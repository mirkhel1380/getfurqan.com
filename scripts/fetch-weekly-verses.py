"""Fetch unchanged published QuranEnc verses. Not run by a visitor's browser."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import urllib.request,json,hashlib,datetime
refs=['13:28','2:153','2:152','94:5','39:53','3:134','17:9','49:13']
editions={'english_saheeh':('en','ltr','Noor International Center'),'dari_badkhashani':('prs','rtl','Muhammad Anwar Badakhshani'),'pashto_rwwad':('ps','rtl','Rowwad Translation Center')}
def fetch(job):
 ref,key=job;c,v=ref.split(':');url=f'https://quranenc.com/api/v1/translation/aya/{key}/{c}/{v}'
 raw=urllib.request.urlopen(url,timeout=45).read();d=json.loads(raw)['result']
 assert d['sura']==c and d['aya']==v and d['arabic_text'] and d['translation']
 return ref,key,{'source':url,'sha256':hashlib.sha256(raw).hexdigest(),'arabic':d['arabic_text'],'text':d['translation'],'notes':d['footnotes']}
output={'fetched':datetime.date.today().isoformat(),'editions':{k:dict(zip(['lang','dir','translator'],v)) for k,v in editions.items()},'verses':{ref:{'translations':{}} for ref in refs}}
with ThreadPoolExecutor(max_workers=6) as pool:
 for ref,key,d in pool.map(fetch,[(ref,key) for ref in refs for key in editions]):
  item=output['verses'][ref]
  if 'arabic' in item:assert item['arabic']==d['arabic'],f'Arabic mismatch {ref}'
  item['arabic']=d.pop('arabic');item['translations'][key]=d
# Store available publisher versions and transcript descriptions alongside the snapshots.
meta=json.load(urllib.request.urlopen('https://quranenc.com/api/v1/translations/list',timeout=30))
for entry in meta.get('translations',[]):
 if entry['key'] in output['editions']:
  output['editions'][entry['key']].update({k:entry.get(k) for k in ['version','title','description','last_update']})
for key,edition in output['editions'].items():
 edition['publisher']=edition['translator']
 edition.setdefault('version',None)
Path('dist/content/weekly-verses.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n')
print('Saved 8 verses, 3 published translations each; Arabic matches across all editions.')
