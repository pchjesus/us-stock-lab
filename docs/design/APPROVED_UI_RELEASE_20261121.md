# Approved UI release — 2026-11-21

- Default: UI v1 navigation/learning and Home A (original HomeDashboard); Market v2.2 density, Stock Workspace v3. No experiment selector on root.
- Existing design comparison routes remain explicit opt-in; ui=legacy is rollback viewing, ui=v1 is historical v1. All historical Pages subpaths preserved.
- No database migrations, order math, account store, real trading, Supabase configuration/feature flags changed.
- Production workflow tests the approved default separately on PC/mobile, then runs original UI/auth/release/UX0 suites against an explicit historical reference build before restoring the tested production artifact. Historical suites are not represented as full coverage of the new default.
- Previous approved design source: a89dc47612376933e3678b0a32cb5fadfb8e88a1. Prior main: c9dd16b4d1e7d15c1a189cc5146281e24017f9fc.
