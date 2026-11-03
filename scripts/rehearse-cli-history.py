"""Run the pinned Supabase CLI only inside a disposable, network-none PostgreSQL.

Usage: python3 scripts/rehearse-cli-history.py /absolute/path/to/supabase
The CLI binary must be v2.122.0. No external DB URL or production credentials
are accepted. Injected SQL is confined to a temporary copy of the migrations.
"""
import concurrent.futures, hashlib, importlib.util, json, pathlib, re, select, subprocess, sys, tempfile, time, uuid

ROOT = pathlib.Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / 'supabase/migrations'
NAME = 'stock-g1c2-' + uuid.uuid4().hex[:12]
if len(sys.argv) != 2 or not pathlib.Path(sys.argv[1]).is_file():
    raise SystemExit('Provide the local official Supabase CLI binary path')
CLI = pathlib.Path(sys.argv[1]).resolve()
if hashlib.sha256(CLI.read_bytes()).hexdigest() != 'cb6a371c6ca17c3d2e2fc382348762f570cef2cb94a6da3c69735925adb7a0d0':
    raise SystemExit('CLI binary does not match the tested Linux amd64 2.122.0 release')

def run(*args, input=None, check=True):
    return subprocess.run(args, input=input, text=True, capture_output=True, check=check)

def docker(*args, **kwargs):
    return run('docker', *args, **kwargs)

def sql(db, statement, check=True):
    return docker('exec', '-i', NAME, 'psql', '-U', 'postgres', '-d', db,
                  '-v', 'ON_ERROR_STOP=1', '-Atq', input=statement, check=check)

def cli(db, *args, check=True):
    return docker('exec', '-w', '/tmp/project', NAME, '/tmp/supabase', *args,
                  '--db-url', f'postgresql://postgres@localhost:5432/{db}?sslmode=disable',
                  check=check)

files = sorted(MIGRATIONS.glob('*.sql'))
assert [p.name.split('_', 1)[0] for p in files] == ['20261026135037'] + [f'20261027000{i}' for i in range(1, 8)]
started = False
try:
    docker('run', '--pull=never', '--network', 'none', '--rm', '-d', '--name', NAME,
           '-e', 'POSTGRES_HOST_AUTH_METHOD=trust', 'postgres:17')
    started = True
    for _ in range(120):
        if sql('postgres', 'select 1;', check=False).returncode == 0:
            break
        time.sleep(.25)
    else:
        raise RuntimeError('isolated database did not become ready')
    docker('cp', str(CLI), NAME + ':/tmp/supabase')
    assert docker('exec', NAME, '/tmp/supabase', '--version').stdout.strip() == '2.122.0'
    docker('exec', NAME, 'mkdir', '-p', '/tmp/project/supabase/migrations')
    bootstrap = (ROOT / 'tests/sql/bootstrap.sql').read_text()
    sql('postgres', 'create role anon nologin; create role authenticated nologin;')
    bootstrap = bootstrap.replace('create role anon nologin;', '').replace('create role authenticated nologin;', '')
    with tempfile.TemporaryDirectory(prefix='g1c2-') as td:
        tmp = pathlib.Path(td)
        def upload(inject=None):
            for f in files:
                content = f.read_text()
                if inject and f.name.startswith('20261027000' + str(inject)):
                    assert content.count('commit;') == 1
                    content = content.replace('commit;', "do $$begin raise exception 'g1c2_injected'; end$$;\ncommit;")
                (tmp / f.name).write_text(content)
                docker('cp', str(tmp / f.name), NAME + ':/tmp/project/supabase/migrations/' + f.name)

        def setup(db):
            sql('postgres', f'create database {db};')
            sql(db, bootstrap)
            for f in files[:4]:
                sql(db, f.read_text())
            sql(db, """create schema supabase_migrations;
                create table supabase_migrations.schema_migrations(version text primary key, statements text[], name text);
                insert into supabase_migrations.schema_migrations(version,name) values
                ('20261026135037','202610260001_foundation'),('202610270001','server_trading'),
                ('202610270002','order_hardening'),('202610270003','market_hours');""")
            sql(db, """insert into auth.users values ('00000000-0000-0000-0000-000000000001');
                set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
                select public.paper_snapshot();""")

        def paper_ok(db):
            assert sql(db, """select count(*)=1 and bool_and(a.cash_cents=(select sum(l.delta_cents)
                from public.paper_cash_ledger l where l.account_id=a.id)) from public.paper_accounts a;""").stdout.strip() == 't'

        def manual_ok(db, create=False):
            if create:
                sql(db, """set role authenticated; set request.jwt.claim.sub='00000000-0000-0000-0000-000000000001';
                    select public.manual_snapshot();""")
            assert sql(db, """select count(*)=1 and bool_and(a.cash_cents=(select sum(l.delta_cents)
                from public.manual_ledger l where l.account_id=a.id)) from public.manual_accounts a;""").stdout.strip() == 't'

        def final_acl(db):
            assert sql(db, """select bool_and(not has_function_privilege('anon',p.oid,'execute'))
                and bool_and(has_function_privilege('authenticated',p.oid,'execute'))
                and count(*)=9 from pg_proc p join pg_namespace n on n.oid=p.pronamespace
                where n.nspname='public' and p.proname in ('manual_snapshot','manual_order',
                'manual_order_v2','manual_fee_policy_set','manual_tax_snapshot','manual_tax_save',
                'dividend_manage','dividend_dashboard','dividend_admin');""").stdout.strip() == 't'
            assert sql(db, """select count(*)>0 and bool_and(c.relrowsecurity) from pg_class c
                join pg_namespace n on n.oid=c.relnamespace where n.nspname='public'
                and c.relkind='r' and (c.relname like 'manual_%' or c.relname like 'dividend_%');""").stdout.strip() == 't'

        def state(db):
            return sql(db, """select (select string_agg(version,',' order by version) from supabase_migrations.schema_migrations),
                to_regclass('public.manual_accounts') is not null,
                to_regclass('public.dividend_events') is not null,
                to_regclass('public.manual_tax_documents') is not null,
                exists(select 1 from information_schema.columns where table_schema='public' and table_name='manual_accounts' and column_name='revision'),
                coalesce(has_function_privilege('authenticated',to_regprocedure('public.manual_snapshot()'),'execute'),false),
                has_function_privilege('authenticated','public.paper_snapshot()','execute');""").stdout.strip()

        for stage in (4, 5, 7):
            db = 'case' + str(stage)
            setup(db)
            upload(stage)
            if stage == 4:
                before = state(db)
                dry = cli(db, 'db', 'push', '--skip-vault', '--dry-run', check=False)
                assert dry.returncode == 0, dry.stderr[-1500:]
                assert all(f.name in dry.stdout + dry.stderr for f in files[4:]), dry.stdout + dry.stderr
                assert state(db) == before
                print('PASS isolated dry-run --skip-vault: exactly 004..007 listed; state unchanged')
            result = cli(db, 'db', 'push', '--skip-vault', '--yes', check=False)
            assert result.returncode != 0 and 'g1c2_injected' in result.stderr + result.stdout, (stage, result.stderr[-1500:])
            observed = state(db).split('|')
            expected = ['t' if stage > i else 'f' for i in (4, 5, 6, 7)]
            assert observed[1:5] == expected, (stage, observed)
            assert observed[-1] == 't' and observed[-2] == ('f' if stage == 4 else 't'), observed
            paper_ok(db)
            if stage > 4:
                manual_ok(db, create=True)  # Proves an authenticated call can create an account.
            hist = observed[0].split(',')
            assert hist == [p.name.split('_', 1)[0] for p in files[:stage]], (stage, hist)
            again = cli(db, 'db', 'push', '--skip-vault', '--yes', check=False)
            assert again.returncode != 0 and state(db).split('|')[0] == observed[0]
            upload()
            cli(db, 'db', 'push', '--skip-vault', '--yes')
            assert len(state(db).split('|')[0].split(',')) == 8
            paper_ok(db)
            manual_ok(db, create=(stage == 4))
            final_acl(db)
            repeated = cli(db, 'db', 'push', '--skip-vault', '--yes')
            assert len(state(db).split('|')[0].split(',')) == 8
            exposure = 'absent' if stage == 4 else 'callable by authenticated role'
            print(f'PASS injected {stage:03d}: state/history verified; intermediate RPC {exposure}; corrected retry succeeds; duplicate CLI push is no-op')

        db = 'historyfail'
        setup(db)
        upload()
        sql(db, """create function supabase_migrations.reject_history() returns trigger language plpgsql as $$
          begin if new.version='202610270004' then raise exception 'g1c2_history_failure'; end if; return new; end $$;
          create trigger reject_history before insert on supabase_migrations.schema_migrations
          for each row execute function supabase_migrations.reject_history();""")
        result = cli(db, 'db', 'push', '--skip-vault', '--yes', check=False)
        assert result.returncode != 0 and 'g1c2_history_failure' in result.stderr + result.stdout, result.stderr[-1500:]
        observed = state(db).split('|')
        assert observed[1] == 't' and observed[-2] == 't' and '202610270004' not in observed[0], observed
        paper_ok(db)
        manual_ok(db, create=True)
        sql(db, 'drop trigger reject_history on supabase_migrations.schema_migrations;')
        retry = cli(db, 'db', 'push', '--skip-vault', '--yes', check=False)
        assert retry.returncode != 0 and '202610270004' not in state(db).split('|')[0], retry.stderr[-1500:]
        paper_ok(db)
        manual_ok(db)
        print('PASS history insert failure: 004 schema committed, authenticated RPC exposed, history missing; CLI retry fails: stop for manual reconciliation')

        # Experiment only: strip just the standalone top-level BEGIN/COMMIT
        # from in-memory copies and insert simulated CLI history in the same
        # transaction. This is NOT an approved Supabase deployment mechanism.
        db = 'atomicexperiment'
        setup(db)
        baseline = state(db)
        def experiment_sql(f):
            content = f.read_text()
            content, nbegin = re.subn(r'^begin;\s*$', '', content, count=1, flags=re.MULTILINE | re.IGNORECASE)
            content, ncommit = re.subn(r'^commit;\s*$', '', content, count=1, flags=re.MULTILINE | re.IGNORECASE)
            assert nbegin == ncommit == 1
            return content

        def history_sql(f):
            version, name = f.stem.split('_', 1)
            # Exact source bytes, not the rewritten experimental body.
            source = f.read_bytes().hex()
            return ("insert into supabase_migrations.schema_migrations(version,name,statements) "
                    f"values ('{version}','{name}',array[convert_from(decode('{source}','hex'),'UTF8')]);\n")

        bodies = [(experiment_sql(f), history_sql(f)) for f in files[4:]]
        # Psql exits on error; backend disconnect must roll back all DDL/history.
        for failure in ('before_004', 'before_005', 'before_007', 'history_after_007'):
            batch = 'begin;\n'
            for i, (body, history) in enumerate(bodies):
                if failure == f'before_00{i+4}':
                    batch += "do $$begin raise exception 'g1c2_atomic_failure'; end$$;\n"
                batch += body + '\n'
                if failure == 'history_after_007' and i == 3:
                    batch += "do $$begin raise exception 'g1c2_atomic_failure'; end$$;\n"
                batch += history
            batch += 'commit;\n'
            failed = sql(db, batch, check=False)
            assert failed.returncode != 0 and 'g1c2_atomic_failure' in failed.stderr
            assert state(db) == baseline
            paper_ok(db)
        sql(db, """create function supabase_migrations.reject_007() returns trigger language plpgsql as $$
            begin if new.version='202610270007' then raise exception 'g1c2_007_history_failure'; end if;
            return new; end $$; create trigger reject_007 before insert on supabase_migrations.schema_migrations
            for each row execute function supabase_migrations.reject_007();""")
        failed = sql(db, 'begin;\n' + ''.join(body + '\n' + history for body, history in bodies) + '\ncommit;\n', check=False)
        assert failed.returncode != 0 and 'g1c2_007_history_failure' in failed.stderr
        assert state(db) == baseline
        paper_ok(db)
        sql(db, 'drop trigger reject_007 on supabase_migrations.schema_migrations;')
        print('PASS experimental single transaction: 004/005/007 and pre-history failures roll back all schema and simulated history')

        p = subprocess.Popen(['docker', 'exec', '-i', NAME, 'psql', '-U', 'postgres', '-d', db,
                              '-v', 'ON_ERROR_STOP=1', '-Atq'], stdin=subprocess.PIPE,
                             stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        try:
            def expect_stage(label):
                if not select.select([p.stdout], [], [], 30)[0]:
                    raise RuntimeError('isolated transaction stage timed out: ' + label)
                assert p.stdout.readline().strip() == label
            p.stdin.write('begin;\n' + bodies[0][0] + '\n' + bodies[0][1] + '\n\\echo G1C2_STAGE_004\n')
            p.stdin.flush()
            expect_stage('G1C2_STAGE_004')
            assert state(db) == baseline  # A separate session cannot see the new RPC or history.
            paper_ok(db)
            p.stdin.write(''.join(body + '\n' + history for body, history in bodies[1:3]) + '\n\\echo G1C2_STAGE_006\n')
            p.stdin.flush()
            expect_stage('G1C2_STAGE_006')
            assert state(db) == baseline
            paper_ok(db)
            p.stdin.write(bodies[3][0] + '\n' + bodies[3][1] + '\ncommit;\n')
            p.stdin.close()
            errors = p.stderr.read()
            assert p.wait(timeout=60) == 0, errors[-1500:]
        finally:
            if p.poll() is None:
                p.kill()
                p.wait()
        assert len(state(db).split('|')[0].split(',')) == 8
        paper_ok(db)
        manual_ok(db, create=True)
        final_acl(db)
        cli(db, 'db', 'push', '--skip-vault', '--yes')
        assert len(state(db).split('|')[0].split(',')) == 8
        print('PASS experimental single transaction: separate session cannot see 004/006 RPC/history before commit; paper readable; final ACL/ledger and duplicate CLI push verified')

        # Exercise the actual experimental compiler against the CLI baseline.
        spec = importlib.util.spec_from_file_location('finance_atomic', ROOT / 'scripts/finance_migration_atomic.py')
        module = importlib.util.module_from_spec(spec)
        assert spec.loader is not None
        spec.loader.exec_module(module)
        try:
            module.production_command('wrong-project', '/usr/bin/psql')
            raise AssertionError('wrong project accepted')
        except ValueError:
            pass
        cmd = module.production_command(module.PROJECT, '/usr/bin/psql')
        assert 'db.' + module.PROJECT + '.supabase.co' in cmd
        env = module.production_environment({'PGHOST': 'evil', 'PGHOSTADDR': '127.0.0.1',
                                             'PGOPTIONS': 'unsafe', 'PGSSLMODE': 'disable',
                                             'PGPASSWORD': 'fixture', 'PATH': '/usr/bin'})
        assert 'PGHOST' not in env and 'PGHOSTADDR' not in env and 'PGOPTIONS' not in env
        assert env['PGSSLMODE'] == 'verify-full' and env['PGPASSWORD'] == 'fixture'
        compiled = module.compile_sql()
        db = 'targetguard'
        setup(db)
        baseline = state(db)
        command = ['docker', 'exec', '-i', NAME, 'psql', '-U', 'postgres', '-d', db,
                   '-v', 'ON_ERROR_STOP=1', '-Atq']
        assert not module.run_psql(command, module.compile_sql(production=True))
        assert state(db) == baseline  # Local DB is not the TLS-protected production target.
        for stage in (4, 5, 7):
            db = 'compilefail' + str(stage)
            setup(db)
            baseline = state(db)
            first = module.validated_migrations()[stage - 4][2][1] + ';\n'
            assert compiled.count(first) == 1
            bad = compiled.replace(first, "do $$begin raise exception 'compiled_injected'; end$$;\n" + first, 1)
            failed = sql(db, bad, check=False)
            assert failed.returncode != 0 and 'compiled_injected' in failed.stderr
            assert state(db) == baseline
            paper_ok(db)
        db = 'compilehistoryfail'
        setup(db)
        baseline = state(db)
        sql(db, """create function supabase_migrations.reject_compiler() returns trigger language plpgsql as $$
            begin if new.version='202610270007' then raise exception 'compiled_history_failure'; end if;
            return new; end $$; create trigger reject_compiler before insert on supabase_migrations.schema_migrations
            for each row execute function supabase_migrations.reject_compiler();""")
        failed = sql(db, compiled, check=False)
        assert failed.returncode != 0 and 'compiled_history_failure' in failed.stderr
        assert state(db) == baseline
        paper_ok(db)
        print('PASS experimental compiler: 004/005/007 and history INSERT failure roll back all schema and history')
        db = 'compiledexperiment'
        setup(db)
        original = state(db)
        command = ['docker', 'exec', '-i', NAME, 'psql', '-U', 'postgres', '-d', db,
                   '-v', 'ON_ERROR_STOP=1', '-Atq']
        assert module.run_psql(command, compiled)
        paper_ok(db)
        manual_ok(db, create=True)
        final_acl(db)
        query = "select json_object_agg(version,json_build_object('name',name,'statements',statements)) from supabase_migrations.schema_migrations where version between '202610270004' and '202610270007';"
        assert json.loads(sql(db, query).stdout) == json.loads(sql('case4', query).stdout)
        assert not module.run_psql(command, compiled)
        repeated = sql(db, compiled, check=False)
        assert repeated.returncode != 0 and 'unexpected_migration_history' in repeated.stderr
        print('PASS experimental compiler: final state and statement arrays match official CLI, duplicate blocked')

        db = 'compiledvisibility'
        setup(db)
        p = subprocess.Popen(['docker', 'exec', '-i', NAME, 'psql', '-U', 'postgres', '-d', db,
                              '-v', 'ON_ERROR_STOP=1', '-Atq'], stdin=subprocess.PIPE,
                             stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        try:
            markers = [module.validated_migrations()[i][2][1] + ';\n' for i in (1, 3)]
            assert all(compiled.count(x) == 1 for x in markers)
            first, rest = compiled.split(markers[0], 1)
            middle, last = rest.split(markers[1], 1)
            def await_marker(label):
                if not select.select([p.stdout], [], [], 30)[0]:
                    raise RuntimeError('compiled stage timed out: ' + label)
                assert p.stdout.readline().strip() == label
            for text_part, label in ((first, 'COMPILED_AFTER_004'),
                                     (markers[0] + middle, 'COMPILED_AFTER_006')):
                p.stdin.write(text_part + '\n\\echo ' + label + '\n')
                p.stdin.flush()
                await_marker(label)
                assert sql(db, "select to_regprocedure('public.manual_snapshot()') is null;").stdout.strip() == 't'
                assert sql(db, 'select pg_try_advisory_xact_lock(724102607004);').stdout.strip() == 'f'
                paper_ok(db)
            p.stdin.write(markers[1] + last)
            p.stdin.close()
            output = p.stdout.read()
            errors = p.stderr.read()
            assert p.wait(timeout=60) == 0 and output.strip().splitlines()[-1:] == ['g1c2d_commit_confirmed'], errors[-1000:]
            final_acl(db)
            paper_ok(db)
        finally:
            if p.poll() is None:
                p.kill()
                p.wait()
        print('PASS tool SQL: RPC invisible after 004 and 006, concurrent advisory lock blocked, paper readable')

        db = 'compiledabort'
        setup(db)
        baseline = state(db)
        p = subprocess.Popen(['docker', 'exec', '-i', NAME, 'psql', '-U', 'postgres', '-d', db,
                              '-v', 'ON_ERROR_STOP=1', '-Atq'], stdin=subprocess.PIPE,
                             stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        try:
            body, boundary, tail = compiled.rpartition('COMMIT;\n')
            assert boundary and "g1c2d_commit_confirmed" in tail
            body = body.replace('BEGIN;\n', "BEGIN;\nSET LOCAL application_name='g1c2d_abort_test';\n", 1)
            p.stdin.write(body + '\n\\echo G1C2D_BEFORE_COMMIT\n')
            p.stdin.flush()
            assert select.select([p.stdout], [], [], 30)[0]
            assert p.stdout.readline().strip() == 'G1C2D_BEFORE_COMMIT'
            assert sql(db, "select to_regprocedure('public.manual_snapshot()') is null;").stdout.strip() == 't'
            locked = sql(db, "set statement_timeout='1s'; select count(*) from supabase_migrations.schema_migrations;", check=False)
            assert locked.returncode != 0 and 'statement timeout' in locked.stderr
            paper_ok(db)
            result = sql('postgres', "select pg_terminate_backend(pid) from pg_stat_activity where application_name='g1c2d_abort_test';")
            assert result.stdout.strip() == 't'
            # psql can exit 0 on EOF without noticing an idle server disconnect.
            # Force a DB round trip before treating its exit status as evidence.
            try:
                p.stdin.write('select 1;\n')
                p.stdin.flush()
            except BrokenPipeError:
                pass
            p.stdin.close()
            assert p.wait(timeout=30) != 0
            assert state(db) == baseline
            paper_ok(db)
        finally:
            if p.poll() is None:
                p.kill()
                p.wait()
        print('PASS experimental compiler: killed connection before commit rolls back; independent observation required')

        # Exercise the same psql runner used by the tool with connections
        # severed on both sides of COMMIT. No retry is performed by run_psql.
        for after_commit in (False, True):
            db = 'runnerafter' if after_commit else 'runnerbefore'
            setup(db)
            baseline = state(db)
            label = 'g1c2d_runner_after' if after_commit else 'g1c2d_runner_before'
            program = compiled.replace('BEGIN;\n', f"BEGIN;\nSET application_name='{label}';\n", 1)
            marker = "SELECT 'g1c2d_commit_confirmed';" if after_commit else 'COMMIT;\n'
            assert program.count(marker) == 1
            program = program.replace(marker, 'SELECT pg_sleep(60);\n' + marker, 1)
            command = ['docker', 'exec', '-i', NAME, 'psql', '-U', 'postgres', '-d', db,
                       '-v', 'ON_ERROR_STOP=1', '-Atq']
            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:
                future = pool.submit(module.run_psql, command, program)
                found = False
                for _ in range(120):
                    current = sql('postgres', f"select count(*) from pg_stat_activity where application_name='{label}' and wait_event='PgSleep';")
                    if current.stdout.strip() == '1':
                        found = True
                        break
                    time.sleep(.25)
                assert found, 'runner did not reach the injected wait'
                killed = sql('postgres', f"select pg_terminate_backend(pid) from pg_stat_activity where application_name='{label}';")
                assert killed.stdout.strip() == 't'
                assert future.result(timeout=30) is False
            observed = state(db)
            if after_commit:
                assert len(observed.split('|')[0].split(',')) == 8
            else:
                assert observed == baseline
            paper_ok(db)
        print('PASS runner: disconnect before commit rolled back; disconnect after commit remains unknown and did not retry')
finally:
    if started:
        docker('rm', '-f', NAME, check=False)
