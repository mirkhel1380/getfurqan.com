"""Cross-check saved Arabic against a second published text; never edit it."""
from concurrent.futures import ThreadPoolExecutor
from pathlib import Path
import urllib.request,json,unicodedata,hashlib,datetime
source=Path('dist/content/weekly-verses.json');d=json.loads(source.read_text())
def letters(s):
 return ''.join(c for c in unicodedata.normalize('NFKC',s).replace('ٱ','ا') if unicodedata.category(c).startswith('L'))
def check(pair):
 key,item=pair;url='https://api.quran.com/api/v4/quran/verses/uthmani?verse_key='+key
 raw=urllib.request.urlopen(url,timeout=30).read();v=json.loads(raw)['verses'];assert len(v)==1 and v[0]['verse_key']==key
 equal=letters(item['arabic'])==letters(v[0]['text_uthmani'])
 return {'ref':key,'source':url,'raw_sha256':hashlib.sha256(raw).hexdigest(),'base_letters_match':equal}
with ThreadPoolExecutor(max_workers=4) as pool:results=list(pool.map(check,d['verses'].items()))
Path('docs/weekly-arabic-check.json').write_text(json.dumps({'checked':datetime.date.today().isoformat(),'method':'Compare NFKC Arabic letters after removing combining marks, spaces and pauses and normalizing alif wasla to alif. Displayed QuranEnc strings are unchanged. This is not full diacritic certification.','results':results},indent=2)+'\n')
print(results)
assert all(x['base_letters_match'] for x in results),'Manual investigation required; displayed Arabic was not changed.'
