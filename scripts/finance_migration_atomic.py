"""Controlled finance migration tool. Defaults to offline validation.

The production path requires explicit project confirmation and has no DB URL
parameter. All ambiguous outcomes are failures requiring independent review.
"""
from __future__ import annotations

import argparse
import hashlib
import json
import os
import pathlib
import re
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parents[1]
MIGRATIONS = ROOT / 'supabase/migrations'
STATEMENTS = ROOT / 'scripts/finance-migration-cli-statements.json'
PROJECT = 'vveljtqmujdzkzmoncjx'
MANIFEST = {
    '202610270004_manual_trading.sql': 'e8264dc71bb553604149d04bdc9a6aedb90c443dc86ab2a226a6607d67629c36',
    '202610270005_manual_dividends.sql': '559c41e214d4eb77365f21260dabcb0b7ec36b0c76881aa9f3d35486cd252da0',
    '202610270006_tax_evidence.sql': '418a2eb4d112fd3c4e8ee0b2b7a95bc9ff4e5b5d2660d120632957a1fb60da2a',
    '202610270007_finance_audit.sql': '3b1891ffa9116acb70cdea9a0c7cf4e4cf84fceb0eab3bd390c5f75fc717b750',
}
BASELINE = {
    '20261026135037_202610260001_foundation.sql': '2035aa696c49e4357a1cf321cbdbc8c689dea3806c948387a5430f4772a39572',
    '202610270001_server_trading.sql': 'bce65c78801763959842ee1ab6c1b34aef4ac70681c65e7ab04380c0856737d1',
    '202610270002_order_hardening.sql': 'a33b31472c8a6cb886ee6a0f32667b3eabbce15b13caee8eb4fac214060a4e68',
    '202610270003_market_hours.sql': 'bb19590999edb691ce14f0319474f7bc73ee798405858deb4713b33a58e866c7',
}
STATEMENTS_HASH = 'ededa5ecd4c48056af103699f49f72864ad3d914b0d67d47129ff6f0b53e1f68'


def _sha(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


def validated_migrations() -> list[tuple[str, str, list[str]]]:
    """Only accept the exact files and the pinned official CLI statement output.

    This is intentionally not a generic SQL parser: hashes pin both SQL and
    parser output, and the only accepted transaction boundaries are the exact
    first and last CLI-parsed statements for these four immutable files.
    """
    raw = STATEMENTS.read_bytes()
    if _sha(raw) != STATEMENTS_HASH:
        raise ValueError('CLI statement fixture hash mismatch')
    statements = json.loads(raw)
    expected_names = [*BASELINE, *MANIFEST]
    if sorted(p.name for p in MIGRATIONS.glob('*.sql')) != sorted(expected_names):
        raise ValueError('migration file set does not exactly match the expected baseline')
    if set(statements) != {name.split('_', 1)[0] for name in MANIFEST}:
        raise ValueError('CLI statement fixture versions mismatch')
    for filename, expected_hash in BASELINE.items():
        if _sha((MIGRATIONS / filename).read_bytes()) != expected_hash:
            raise ValueError('baseline migration content hash mismatch: ' + filename)
    result = []
    for filename, expected_hash in MANIFEST.items():
        source = (MIGRATIONS / filename).read_bytes()
        if _sha(source) != expected_hash:
            raise ValueError('migration content hash mismatch: ' + filename)
        version, name = filename[:-4].split('_', 1)
        parts = statements[version]
        lines = source.decode('utf-8').splitlines()
        if not isinstance(parts, list) or len(parts) < 3 or not all(isinstance(x, str) for x in parts):
            raise ValueError('invalid statement fixture')
        if len(lines) < 3 or lines[1] != 'begin;' or lines[-1] != 'commit;':
            raise ValueError('unexpected exact transaction boundary')
        if parts[0] != lines[0] + '\nbegin' or parts[-1] != 'commit':
            raise ValueError('CLI statement boundary mismatch')
        for statement in parts[1:-1]:
            # The hashes, not this conservative guard, are the SQL safety boundary.
            if re.match(r'^\s*(?:begin|commit|rollback|savepoint|release|start\s+transaction|prepare\s+transaction)\b', statement, re.I):
                raise ValueError('unexpected top-level transaction control')
            if re.search(r'(?m)^\s*\\', statement):
                raise ValueError('psql metacommand is forbidden')
        result.append((version, name, parts))
    return result


def compile_sql(production: bool = False) -> str:
    """Build a single transaction using the pinned, CLI-derived statement arrays."""
    migrations = validated_migrations()
    chunks = ["BEGIN;\nSET LOCAL lock_timeout='5s';\nDO $$ BEGIN PERFORM pg_advisory_xact_lock(724102607004); END $$;\n",
              'LOCK TABLE supabase_migrations.schema_migrations IN ACCESS EXCLUSIVE MODE;\n',
              """DO $$ BEGIN
              IF (SELECT array_agg(version || ':' || coalesce(name,'') ORDER BY version)
                    FROM supabase_migrations.schema_migrations)
                 IS DISTINCT FROM ARRAY['20261026135037:202610260001_foundation',
                   '202610270001:server_trading','202610270002:order_hardening',
                   '202610270003:market_hours']::text[] THEN
                 RAISE EXCEPTION 'unexpected_migration_history'; END IF;
              IF (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
                  WHERE n.nspname IN ('public','paper_private') AND c.relkind IN ('r','p') AND c.relrowsecurity) <> 12
                OR (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
                  WHERE n.nspname IN ('public','paper_private') AND c.relkind IN ('r','p')) <> 12
                OR (SELECT count(*) FROM pg_constraint c JOIN pg_namespace n ON n.oid=c.connamespace
                  WHERE n.nspname IN ('public','paper_private')) <> 51
                OR (SELECT count(*) FROM pg_indexes WHERE schemaname IN ('public','paper_private')) <> 21
                OR (SELECT count(*) FROM pg_policies WHERE schemaname IN ('public','paper_private')) <> 12
                OR (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname IN ('public','paper_private')) <> 4
                OR (SELECT count(*) FROM pg_trigger t JOIN pg_class c ON c.oid=t.tgrelid
                    JOIN pg_namespace n ON n.oid=c.relnamespace WHERE n.nspname IN ('public','paper_private')
                    AND NOT t.tgisinternal) <> 0
              THEN RAISE EXCEPTION 'unexpected_baseline_catalog'; END IF;
              IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
                  WHERE n.nspname IN ('public','paper_private') AND c.relkind IN ('r','p','v','m','S')
                  AND c.relname ~ '^(manual_|dividend_|finance_)') OR
                 EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
                  WHERE n.nspname IN ('public','paper_private') AND p.proname ~ '^(manual_|dividend_|finance_)') THEN
                 RAISE EXCEPTION 'unexpected_finance_objects'; END IF;
              END $$;\n"""]
    if production:
        chunks.insert(1, """DO $$ BEGIN
          IF current_database() <> 'postgres' OR current_user <> 'postgres' OR
             NOT coalesce((SELECT ssl FROM pg_stat_ssl WHERE pid=pg_backend_pid()),false)
          THEN RAISE EXCEPTION 'unexpected_database_identity_or_transport'; END IF;
          END $$;\n""")
    for version, name, parts in migrations:
        # Retain the original header comment; only its following BEGIN is removed.
        chunks.append(parts[0][:-len('\nbegin')] + '\n')
        chunks.extend(statement + ';\n' for statement in parts[1:-1])
        # Avoid SQL quoting ambiguity; fixture holds the exact CLI 2.122.0
        # statements including the original transaction control statements.
        encoded = ','.join("convert_from(decode('%s','hex'),'UTF8')" % s.encode().hex() for s in parts)
        chunks.append('INSERT INTO supabase_migrations.schema_migrations(version,name,statements) '
                      f"VALUES ('{version}','{name}',ARRAY[{encoded}]);\n")
    chunks.append("""DO $$ BEGIN
      IF (SELECT count(*) FROM supabase_migrations.schema_migrations) <> 8 OR
         (SELECT count(*) FROM supabase_migrations.schema_migrations
          WHERE version IN ('202610270004','202610270005','202610270006','202610270007')) <> 4
      THEN RAISE EXCEPTION 'unexpected_final_history'; END IF;
      IF EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
          WHERE n.nspname='public' AND c.relkind='r'
            AND (c.relname LIKE 'manual_%' OR c.relname LIKE 'dividend_%') AND NOT c.relrowsecurity)
      THEN RAISE EXCEPTION 'finance_rls_missing'; END IF;
      IF (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
          WHERE n.nspname='public' AND c.relkind='r'
            AND c.relname IN ('manual_accounts','manual_orders','manual_positions','manual_ledger',
              'manual_tax_documents','manual_fee_policies','dividend_events','dividend_entitlements',
              'dividend_credits','dividend_delivery_status') AND c.relrowsecurity
            AND NOT has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
            AND has_table_privilege('authenticated',c.oid,'SELECT')
            AND NOT has_table_privilege('authenticated',c.oid,'INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')) <> 10
      THEN RAISE EXCEPTION 'finance_table_acl_mismatch'; END IF;
      IF (SELECT count(*) FROM pg_class c JOIN pg_namespace n ON n.oid=c.relnamespace
          WHERE n.nspname='paper_private' AND c.relkind='r'
            AND c.relname IN ('dividend_admins','dividend_control','dividend_audit','finance_admins')
            AND c.relrowsecurity
            AND NOT has_table_privilege('anon',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')
            AND NOT has_table_privilege('authenticated',c.oid,'SELECT,INSERT,UPDATE,DELETE,TRUNCATE,REFERENCES,TRIGGER')) <> 4
      THEN RAISE EXCEPTION 'finance_private_acl_mismatch'; END IF;
      IF (SELECT count(*) FROM pg_proc p JOIN pg_namespace n ON n.oid=p.pronamespace
          WHERE n.nspname='public' AND p.proname IN ('manual_snapshot','manual_order',
            'manual_order_v2','manual_fee_policy_set','manual_tax_snapshot','manual_tax_save',
            'dividend_manage','dividend_dashboard','dividend_admin')
            AND NOT has_function_privilege('anon',p.oid,'execute')
            AND has_function_privilege('authenticated',p.oid,'execute')) <> 9
      THEN RAISE EXCEPTION 'finance_rpc_acl_mismatch'; END IF;
      IF EXISTS (SELECT 1 FROM public.manual_accounts a WHERE a.cash_cents <>
          (SELECT coalesce(sum(l.delta_cents),0) FROM public.manual_ledger l WHERE l.account_id=a.id))
      OR EXISTS (SELECT 1 FROM public.paper_accounts a WHERE a.cash_cents <>
          (SELECT coalesce(sum(l.delta_cents),0) FROM public.paper_cash_ledger l WHERE l.account_id=a.id))
      OR EXISTS (SELECT 1 FROM public.dividend_credits c WHERE NOT EXISTS
          (SELECT 1 FROM public.manual_ledger l WHERE l.dividend_credit_id=c.id
           AND l.account_id=c.account_id AND l.kind='dividend' AND l.delta_cents=c.net_cents))
      THEN RAISE EXCEPTION 'ledger_mismatch'; END IF;
      IF NOT has_function_privilege('authenticated','public.paper_snapshot()','EXECUTE') OR
         has_function_privilege('anon','public.paper_snapshot()','EXECUTE') OR
         NOT has_function_privilege('authenticated','public.paper_order(uuid,text,text,bigint)','EXECUTE') OR
         has_function_privilege('anon','public.paper_order(uuid,text,text,bigint)','EXECUTE')
      THEN RAISE EXCEPTION 'paper_rpc_acl_mismatch'; END IF;
      END $$;\nCOMMIT;\nSELECT 'g1c2d_commit_confirmed';\n""")
    return ''.join(chunks)


def run_psql(command: list[str], program: str, env: dict[str, str] | None = None) -> bool:
    """Require server acknowledgement, never expose SQL, DB output or secrets.

    False means UNKNOWN, not rolled back: callers must stop and inspect DB state.
    The production CLI itself constructs the connection command and sanitizes
    the libpq environment; it never accepts an arbitrary connection string.
    """
    try:
        result = subprocess.run(command, input=program, text=True, capture_output=True, timeout=180, env=env)
    except (OSError, subprocess.TimeoutExpired):
        return False
    return result.returncode == 0 and result.stdout.strip().splitlines()[-1:] == ['g1c2d_commit_confirmed']


def production_command(project_ref: str, psql: str) -> list[str]:
    if project_ref != PROJECT:
        raise ValueError('wrong project reference')
    return [psql, '-X', '-qAt', '-w', '-v', 'ON_ERROR_STOP=1',
            '-h', 'db.' + PROJECT + '.supabase.co', '-p', '5432', '-d', 'postgres', '-U', 'postgres']


def production_environment(source: dict[str, str]) -> dict[str, str]:
    # Reject all inherited libpq connection overrides, retaining only the
    # password source and CA path. Never log these values.
    env = {key: value for key, value in source.items() if not key.startswith('PG')}
    for key in ('PGPASSWORD', 'PGPASSFILE', 'PGSSLROOTCERT'):
        if key in source:
            env[key] = source[key]
    env.update(PGSSLMODE='verify-full', PGCONNECT_TIMEOUT='10', PGAPPNAME='g1c2d_atomic_finance')
    return env


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description='Default: offline verification without a database connection.')
    parser.add_argument('--execute-production', action='store_true', help='request the separately approved production operation')
    parser.add_argument('--project-ref', default='', help='must equal the hard-coded production project reference')
    args = parser.parse_args()
    try:
        program = compile_sql(production=args.execute_production)
    except (ValueError, OSError) as error:
        print('STOP: offline validation failed:', type(error).__name__, file=sys.stderr)
        raise SystemExit(1)
    if not args.execute_production:
        print('OFFLINE CHECK PASS: four pinned migrations and CLI statement fixture; no DB connection')
        raise SystemExit(0)
    # No production path may silently fall back to another project or host.
    psql = shutil.which('psql')
    if args.project_ref != PROJECT or not psql or not sys.stdin.isatty():
        print('STOP: exact project, local psql and interactive approval are required', file=sys.stderr)
        raise SystemExit(2)
    approval = input('Type APPROVE ' + PROJECT + ' to authorize 004-007: ')
    if approval != 'APPROVE ' + PROJECT:
        print('STOP: approval not supplied', file=sys.stderr)
        raise SystemExit(2)
    ok = run_psql(production_command(args.project_ref, psql), program, production_environment(dict(os.environ)))
    if not ok:
        print('STOP: result UNKNOWN; do not retry. Independently inspect schema and history.', file=sys.stderr)
        raise SystemExit(1)
    print('COMMIT CONFIRMED: verify operational checks independently before enabling features')
