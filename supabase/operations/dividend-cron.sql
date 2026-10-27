-- REVIEWED INSTALL SCRIPT ONLY. Do not run on production during v0.6-D.
-- pg_cron must be available and configured (shared_preload_libraries, cron.database_name).
create extension if not exists pg_cron;
-- Run as the trusted database owner; no HTTP endpoint or frontend secret.
select cron.schedule('manual-dividend-settlement','*/5 * * * *','select paper_private.settle_dividends()');
-- Bootstrap admins via trusted SQL only:
-- insert into paper_private.dividend_admins(user_id) values('<approved-auth-user-uuid>');
