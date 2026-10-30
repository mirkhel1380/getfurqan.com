import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const document={readyState:'loading',addEventListener(){}};
const context={window:{addEventListener(){}},document,URLSearchParams};
vm.runInNewContext(fs.readFileSync(new URL('../dist/metadata.js',import.meta.url),'utf8'),context);
const canonical=context.window.AFMetadata.canonical,base='https://getfurqan.online';
for(const [path,query,result] of [
 ['/reader.html','?chapter=1&p=1&utm_source=x','/reader.html'],
 ['/reader.html','?chapter=2&p=3&view=translation&translation=english_saheeh','/reader.html?chapter=2&p=3'],
 ['/reader.html','?verse=2:255&token=secret&email=a@example.com','/reader.html?verse=2%3A255'],
 ['/reader.html','?chapter=999&verse=2:255','/reader.html'],
 ['/reader.html','?juz=30&p=1','/reader.html?juz=30'],
 ['/reader.html','?page=604','/reader.html?page=604'],
 ['/study.html','?verse=1:1&tafsir=persian_saadi','/study.html'],
 ['/study.html','?verse=1:2&tafsir=english_ibnkathir','/study.html?verse=1%3A2&tafsir=english_ibnkathir'],
 ['/hadith.html','?collection=bukhari&hadith=124.1&edition=eng-bukhari','/hadith.html?collection=bukhari&hadith=124.1&edition=eng-bukhari'],
 ['/hadith-book.html','?collection=bukhari&book=1&page=2&q=private-note','/hadith-book.html?collection=bukhari&book=1&page=2'],
 ['/study.html','?verse=<script>&tafsir=https://bad.example','/study.html']
])assert.equal(canonical(path,query),base+result);
console.log('PASS: passage/edition identity, pagination, canonical defaults and exclusion of tracking, private queries and invalid parameters.');
