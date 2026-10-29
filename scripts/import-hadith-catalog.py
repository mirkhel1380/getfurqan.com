"""Inventory every Arabic/English source record without changing hadith text."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from collections import Counter,defaultdict
import urllib.request,json,hashlib,datetime
REV='df57907be35291c91ad6a6691180e22ca9920784';BASE=f'https://raw.githubusercontent.com/fawazahmed0/hadith-api/{REV}'
CACHE=Path('../hadith-source');CACHE.mkdir(exist_ok=True)
OUT=Path('dist/content/hadith');OUT.mkdir(parents=True,exist_ok=True)
def get(path):
 target=CACHE/path.replace('/','_')
 if target.exists():raw=target.read_bytes()
 else:
  raw=urllib.request.urlopen(BASE+'/'+path,timeout=60).read();target.write_bytes(raw)
 return json.loads(raw),hashlib.sha256(raw).hexdigest()
editions,_=get('editions.min.json');keys=['bukhari','muslim','abudawud','tirmidhi','nasai','ibnmajah','malik','nawawi','qudsi','dehlawi']
def number(x):return format(x,'.12g') if isinstance(x,float) else str(x)
def import_collection(key):
 ar,ha=get(f'editions/ara-{key}.json');en,he=get(f'editions/eng-{key}.json')
 arabic={number(h['hadithnumber']):h for h in ar['hadiths']};english={number(h['hadithnumber']):h for h in en['hadiths']}
 assert len(arabic)==len(ar['hadiths']),f'Duplicate Arabic IDs: {key}'
 assert len(english)==len(en['hadiths']),f'Duplicate English IDs: {key}'
 ids=sorted(set(arabic)|set(english),key=float);index=[];sections=defaultdict(list);mismatches=[]
 for id in ids:
  a=arabic.get(id);b=english.get(id);ref=(a or b)['reference'];section=str(ref['book'])
  if a and b and a['reference']!=b['reference']:mismatches.append(id)
  index.append([id,str((a or b).get('arabicnumber','')),section,str(ref['hadith']),bool(a and a['text'].strip()),bool(b and b['text'].strip())]);sections[section].append(id)
 titles=en['metadata']['sections'];arabic_titles=ar['metadata']['sections'];books=[]
 for id,hadith_ids in sections.items():
  books.append({'id':id,'title':titles.get(id,'Introduction' if id=='0' else 'Book '+id),'arabic':arabic_titles.get(id,''),'count':len(hadith_ids),'first':hadith_ids[0],'last':hadith_ids[-1]})
 books.sort(key=lambda x:int(x['id']))
 col={'id':key,'name':editions[key]['name'],'arabic_name':ar['metadata']['name'],'count':len(ids),'arabic_count':sum(x[4] for x in index),'english_count':sum(x[5] for x in index),'books':books,'editions':[x for x in editions[key]['collection'] if x['name']==f'ara-{key}' or x['language']!='Arabic'],'readable_count':sum(x[4] or x[5] for x in index),'missing_both':sum(not x[4] and not x[5] for x in index),'reference_mismatches':mismatches,'hashes':{'arabic':ha,'english':he}}
 (OUT/f'{key}.json').write_text(json.dumps({'collection':key,'revision':REV,'records':index},ensure_ascii=False,separators=(',',':'))+'\n')
 print(key,len(ids),'books',len(books),'missing Arabic',len(ids)-col['arabic_count'],'missing English',len(ids)-col['english_count'],'mismatches',len(mismatches),flush=True)
 return col
with ThreadPoolExecutor(max_workers=4) as pool:collections=list(pool.map(import_collection,keys))
manifest={'revision':REV,'source':'https://github.com/fawazahmed0/hadith-api','license':'Unlicense','fetched':datetime.date.today().isoformat(),'total':sum(c['count'] for c in collections),'readable_total':sum(c['readable_count'] for c in collections),'collections':collections}
(OUT/'catalog.json').write_text(json.dumps(manifest,ensure_ascii=False,separators=(',',':'))+'\n')
print('TOTAL',manifest['total'],flush=True)
