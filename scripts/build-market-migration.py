"""Generate ONLY the calendar seed between markers from the shared reviewed JSON.
Run --check before deployment; never apply migrations from this script.
"""
import json,pathlib,sys
root=pathlib.Path(__file__).resolve().parents[1]
c=json.loads((root/'src/market-calendar.json').read_text())
assert set(c['years'])=={'2026','2027'}
assert all(len(y['holidays'])==10 for y in c['years'].values())
assert [len(y['earlyCloses']) for y in c['years'].values()]==[2,1]
seed="""-- BEGIN SHARED CALENDAR (generated from src/market-calendar.json)
with contract as (select '%s'::jsonb as data), days as (
 select day::date as date, data from contract,
 generate_series((data->>'start')::date::timestamp,(data->>'end')::date::timestamp,interval '1 day') day
), calendar as (
 select date,data->'years'->to_char(date,'YYYY')->'holidays'->>date::text as holiday,
 (data->'years'->to_char(date,'YYYY')->'earlyCloses') ? date::text as early,
 extract(isodow from date) in (6,7) as weekend from days
)
insert into paper_private.market_days(date,open_at,close_at,reason,early,verified)
select date,
 case when holiday is null and not weekend then (date+time '09:30') at time zone 'America/New_York' end,
 case when holiday is null and not weekend then (date+case when early then time '13:00' else time '16:00' end) at time zone 'America/New_York' end,
 coalesce(holiday,case when weekend then '주말' when early then '조기폐장 · 09:30~13:00 ET' else '정규장 · 09:30~16:00 ET' end),early,true from calendar;
-- END SHARED CALENDAR""" % json.dumps(c,ensure_ascii=False,separators=(',',':')).replace("'","''")
p=root/'supabase/migrations/202610270003_market_hours.sql'
s=p.read_text();a=s.index('-- BEGIN SHARED CALENDAR');b=s.index('-- END SHARED CALENDAR')+len('-- END SHARED CALENDAR');new=s[:a]+seed+s[b:]
if '--check' in sys.argv:
 assert new==s,'Calendar seed differs; regenerate and review before applying'
 print('PASS shared calendar seed')
else:p.write_text(new)
