"""Offline B3 audit of cached SEC originals; never fetches or writes app/DB data.
Usage: python3 scripts/verify-company-evidence.py --cache-dir /path/to/sec-cache
Development-only parser: lxml (not a browser/application dependency).
"""
import argparse,hashlib,json,pathlib
from decimal import Decimal
from lxml import html
parser=argparse.ArgumentParser();parser.add_argument('--cache-dir',type=pathlib.Path,required=True);cache=parser.parse_args().cache_dir
root=pathlib.Path(__file__).resolve().parents[1]
data=json.loads((root/'src/companyFinancials.json').read_text());proof={r['id']:r for r in json.loads((root/'tests/fixtures/company-financial-evidence.json').read_text())}
def name(e):return e.tag.split(':')[-1].lower() if isinstance(e.tag,str) else ''
count=0;calculations=0
assert {f['id'] for c in data for f in c['financials'] if f['origin']['kind']=='reported'}==set(proof),'Evidence coverage mismatch'
for company in data:
 start_count,start_calculations=count,calculations
 symbol=company['symbol'];sources={s['id']:s for s in company['sources']};facts={f['id']:f for f in company['financials']};documents={}
 submissions=json.loads((cache/f'{symbol}-submissions.json').read_text())['filings']['recent']
 eligible=[i for i,f in enumerate(submissions['form']) if f in ['10-K','10-Q','10-K/A','10-Q/A'] and submissions['filingDate'][i]<=company['asOf']]
 chosen={submissions['accessionNumber'][next(i for i in eligible if submissions['form'][i]=='10-K')]}
 chosen.update(submissions['accessionNumber'][i] for i in [i for i in eligible if submissions['form'][i]=='10-Q'][:4])
 assert chosen=={s['accession'] for s in sources.values()}
 assert not any(submissions['form'][i].endswith('/A') and submissions['reportDate'][i] in {f['period']['end'] for f in facts.values()} for i in eligible),'Review amendments before acceptance'
 xbrl=json.loads((cache/f'{symbol}-facts.json').read_text(),parse_float=Decimal)['facts']['us-gaap']
 for f in facts.values():
  if f['origin']['kind']=='calculated':
   inputs=[facts[i] for i in f['origin']['inputIds']];vals=[Decimal(i['value']) for i in inputs]
   result=vals[0]-vals[1] if f['metric']=='freeCashFlow' else sum(vals)
   assert result==Decimal(f['value']);assert all(i['period']==f['period'] for i in inputs);calculations+=1;continue
  source=sources[f['sourceId']];e=f['evidence'];p=proof[f['id']];assert source['filedAt']<=company['asOf'] and e['accession']==source['accession']
  key=source['accession']
  if key not in documents:
   raw=(cache/f'{symbol}-{key}.htm').read_bytes();documents[key]=(html.fromstring(raw),hashlib.sha256(raw).hexdigest())
  tree,digest=documents[key];assert digest==p['documentSha256'];assert p['url']==source['url'] and p['accession']==key
  fy=tree.xpath('//*[@name="dei:DocumentFiscalYearFocus"]');fp=tree.xpath('//*[@name="dei:DocumentFiscalPeriodFocus"]')
  assert fy and fp and int(''.join(fy[0].itertext()).strip())==e['reportFiscalYear'] and ''.join(fp[0].itertext()).strip()==e['reportFiscalPeriod']
  nodes=tree.xpath('//*[@name=$concept and @contextref=$context]',concept=e['concept'],context=e['contextRef']);assert nodes
  matched=False
  for n in nodes:
   if any(name(a)=='hidden' for a in n.iterancestors()):continue
   raw_value=''.join(n.itertext()).strip().replace(',','').replace('$','');sign=-1 if n.get('sign')=='-' else 1
   try:v=Decimal(raw_value)*Decimal(10)**int(n.get('scale','0'))*sign
   except Exception:continue
   if v==Decimal(f['value']):
    assert Decimal(raw_value)*sign==Decimal(e['rawValue']) and int(n.get('scale','0'))==e['scale']
    context=tree.xpath('//*[@id=$id]',id=e['contextRef'])[0];dates={name(c):c.text for c in context.iter() if name(c) in ['startdate','enddate','instant']}
    assert not any(name(c) in ['explicitmember','typedmember'] for c in context.iter())
    assert dates.get('enddate',dates.get('instant'))==f['period']['end'] and dates.get('startdate',dates.get('instant'))==f['period']['start']
    unit=tree.xpath('//*[@id=$id]',id=n.get('unitref'))[0];unit_text=''.join(unit.itertext());assert 'USD' in unit_text and ('shares' in unit_text)==(f['unit']=='USD/share')
    row=next(a for a in n.iterancestors() if name(a)=='tr');assert ' '.join(''.join(row.itertext()).split())==p['tableRow'];matched=True;break
  assert matched
  cf=[r for r in xbrl[e['concept'].split(':')[1]]['units'][e['unit']] if r['accn']==key and r['end']==f['period']['end'] and r.get('start',r['end'])==f['period']['start'] and Decimal(str(r['val']))==Decimal(f['value']) and r['filed']==source['filedAt'] and r['fy']==e['reportFiscalYear'] and r['fp']==e['reportFiscalPeriod'] and r.get('frame')==e['frame']];assert cf
  assert Decimal(p['xbrlValue'])==Decimal(p['htmlNormalizedValue'])==Decimal(f['value']);count+=1
 if symbol=='NVDA':
  notes=json.loads((root/'tests/fixtures/nvda-report-notes.json').read_text());tree,digest=documents[notes['accession']];assert digest==notes['documentSha256'];text=' '.join(tree.text_content().split());assert all(q in text for q in notes['quotes']),'Missing split/Capex source notes'
 print('PASS',symbol,f'{count-start_count} original facts / {calculations-start_calculations} calculations: documents, periods, units, focus/frame and independent Decimal calculations')
print(f'PASS {count} reported facts / {calculations} calculations; cached originals + Company Facts match')
