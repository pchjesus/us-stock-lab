"""Offline fail-closed checks for the narrowly pinned deployment compiler."""
import importlib.util
import pathlib
import shutil
import tempfile
import unittest

ROOT = pathlib.Path(__file__).resolve().parents[1]
SPEC = importlib.util.spec_from_file_location('finance_atomic', ROOT / 'scripts/finance_migration_atomic.py')
MODULE = importlib.util.module_from_spec(SPEC)
SPEC.loader.exec_module(MODULE)


class GuardTest(unittest.TestCase):
    def setUp(self):
        self.temp = tempfile.TemporaryDirectory()
        base = pathlib.Path(self.temp.name)
        self.migrations = base / 'migrations'
        shutil.copytree(ROOT / 'supabase/migrations', self.migrations)
        self.fixture = base / 'statements.json'
        shutil.copy(ROOT / 'scripts/finance-migration-cli-statements.json', self.fixture)
        self.old = MODULE.MIGRATIONS, MODULE.STATEMENTS
        MODULE.MIGRATIONS, MODULE.STATEMENTS = self.migrations, self.fixture

    def tearDown(self):
        MODULE.MIGRATIONS, MODULE.STATEMENTS = self.old
        self.temp.cleanup()

    def test_baseline_compiles(self):
        sql = MODULE.compile_sql()
        self.assertTrue(sql.startswith('BEGIN;\n'))
        self.assertIn("SELECT 'g1c2d_commit_confirmed';", sql)

    def test_sql_mutation_even_in_comment_or_quoted_body_is_rejected(self):
        file = self.migrations / next(iter(MODULE.MANIFEST))
        original = file.read_bytes()
        for suffix in (b'\n-- begin; commit;\n', b"\nselect 'commit;';\n", b'\nselect $$begin;$$;\n'):
            file.write_bytes(original + suffix)
            with self.assertRaises(ValueError):
                MODULE.compile_sql()

    def test_fixture_change_rejected(self):
        self.fixture.write_bytes(self.fixture.read_bytes() + b' ')
        with self.assertRaises(ValueError):
            MODULE.compile_sql()

    def test_baseline_mutation_rejected(self):
        file = self.migrations / next(iter(MODULE.BASELINE))
        file.write_bytes(file.read_bytes() + b'\n-- changed\n')
        with self.assertRaises(ValueError):
            MODULE.compile_sql()

    def test_unexpected_migration_rejected(self):
        (self.migrations / '202610270008_unexpected.sql').write_text('select 1;\n')
        with self.assertRaises(ValueError):
            MODULE.compile_sql()

    def test_project_and_environment_are_fixed(self):
        with self.assertRaises(ValueError):
            MODULE.production_command('not-the-project', 'psql')
        env = MODULE.production_environment({'PGHOSTADDR': '127.0.0.1', 'PGSERVICE': 'evil',
                                             'PGSSLMODE': 'disable', 'PGPASSWORD': 'test', 'PATH': '/bin'})
        self.assertNotIn('PGHOSTADDR', env)
        self.assertNotIn('PGSERVICE', env)
        self.assertEqual(env['PGSSLMODE'], 'verify-full')
        self.assertEqual(env['PGPASSWORD'], 'test')

    def test_absent_commit_ack_is_unknown(self):
        self.assertFalse(MODULE.run_psql(['/bin/true'], ''))


if __name__ == '__main__':
    unittest.main()
