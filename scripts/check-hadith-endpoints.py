"""Check sample source endpoints against complete, pinned source editions."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import urllib.request,urllib.error,json,hashlib
r=Path('dist/content/hadith');cache=Path('../hadith-source');manifest=json.loads((r/'catalog.json').read_text());base='https://raw.githubusercontent.com/fawazahmed0/hadith-api/'+manifest['revision']
jobs=[]
for col in manifest['collections']:
 rows=json.loads((r/(col['id']+'.json')).read_text())['records'];readable=[x for x in rows if x[4] or x[5]]
 chosen=[readable[0],readable[-1]]
 fractional=next((x for x in readable if '.' in x[0]),None)
 if fractional:chosen.append(fractional)
 for row in chosen:
  for prefix in ['ara','eng']:jobs.append((col['id'],prefix,row[0]))
def check(job):
 col,prefix,id=job;path=f'editions/{prefix}-{col}/{id}.json'
 full_raw=(cache/f'editions_{prefix}-{col}.json').read_bytes()
 source_col=next(c for c in manifest['collections'] if c['id']==col)
 assert hashlib.sha256(full_raw).hexdigest()==source_col['hashes']['arabic' if prefix=='ara' else 'english']
 full=json.loads(full_raw)
 expected=next(h for h in full['hadiths'] if str(h['hadithnumber'])==id or str(float(h['hadithnumber']))==str(float(id)))
 try:
  raw=urllib.request.urlopen(base+'/'+path,timeout=25).read();record=json.loads(raw)['hadiths'][0]
  assert record==expected,f'Source endpoint mismatch: {job}'
  return {'collection':col,'edition':prefix,'id':id,'individual_endpoint':True,'sha256':hashlib.sha256(raw).hexdigest(),'matches_full_source':True}
 except urllib.error.HTTPError as error:
  if error.code!=404:raise
  return {'collection':col,'edition':prefix,'id':id,'individual_endpoint':False,'fallback':'Published book or full edition','full_source_hash_verified':True}
with ThreadPoolExecutor(max_workers=4) as pool:checks=list(pool.map(check,jobs))
Path('docs/hadith-endpoint-checks.json').write_text(json.dumps({'revision':manifest['revision'],'checks':checks},indent=2)+'\n');print('Checked',len(checks),'first, last and fractional references;',sum(c['individual_endpoint'] for c in checks),'individual endpoints match complete source;',sum(not c['individual_endpoint'] for c in checks),'need the verified book/full-edition fallback.')
