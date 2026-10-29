export const REVISION='df57907be35291c91ad6a6691180e22ca9920784';
export const BASES=[`https://raw.githubusercontent.com/fawazahmed0/hadith-api/${REVISION}`,`https://cdn.jsdelivr.net/gh/fawazahmed0/hadith-api@${REVISION}`];
const cache=new Map();
export function numberKey(value){const s=String(value??'').trim().replace(/[٠-٩]/g,c=>String(c.charCodeAt(0)-1632)).replace(/[۰-۹]/g,c=>String(c.charCodeAt(0)-1776));if(!/^\d{1,5}(?:\.\d{1,6})?$/.test(s))return null;return String(Number(s))}
export function searchable(value){return String(value??'').normalize('NFKC').toLocaleLowerCase().replace(/[\u064b-\u065f\u0670\u06d6-\u06ed]/g,'').replace(/[أإآٱ]/g,'ا').replace(/ى/g,'ي')}
export function rowKey(row){return numberKey(row.hadithnumber)}
export function matches(record,expected){return record&&rowKey(record)===expected[0]&&String(record.reference?.book)===expected[2]&&String(record.reference?.hadith)===expected[3]}
export function bookName(book){return book?.title||'Book not assigned in source'}
export function hadithURL(collection,id,edition){return '/hadith.html?collection='+encodeURIComponent(collection)+'&hadith='+encodeURIComponent(id)+(edition?'&edition='+encodeURIComponent(edition):'')}
export async function localJSON(path){const r=await fetch(path);if(!r.ok)throw Error('The local hadith index could not load.');return r.json()}
export function sourceURL(edition,path=''){return BASES[0]+'/editions/'+edition+(path?'/'+path:'')+'.json'}
export function remoteJSON(edition,path=''){
 if(!/^[a-z]{3}-[a-z]+\d?$/.test(edition)||!/^(?:\d+(?:\.\d+)?|sections\/\d+)?$/.test(path))return Promise.reject(Error('Invalid source reference.'));
 const key=edition+'/'+path;if(cache.has(key))return cache.get(key);
 const task=(async()=>{for(const base of BASES){const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),12000);try{const r=await fetch(base+'/editions/'+edition+(path?'/'+path:'')+'.json',{signal:controller.signal});if(!r.ok)throw Error('Source unavailable');const d=await r.json();if(!Array.isArray(d.hadiths))throw Error('Invalid source response');return d}catch{}finally{clearTimeout(timer)}}throw Error('The published text could not load. Check your connection and try again.');})();
 cache.set(key,task);task.catch(()=>cache.delete(key));return task;
}
export async function report(edition,expected){let h;try{const d=await remoteJSON(edition,expected[0]);h=d.hadiths.find(h=>rowKey(h)===expected[0])}catch{const available=await bookRecords(edition,expected[2],[expected]);h=available.get(expected[0])}if(!matches(h,expected))throw Error('The source reference does not match this numbered report. This edition cannot be displayed here.');return h}
export async function bookRecords(edition,book,expected){let data;try{data=await remoteJSON(edition,'sections/'+book)}catch{data=await remoteJSON(edition)}let map=new Map(data.hadiths.map(h=>[rowKey(h),h]));if(expected.some(row=>!map.has(row[0]))){data=await remoteJSON(edition);map=new Map(data.hadiths.map(h=>[rowKey(h),h]))}const valid=new Map();for(const row of expected){const h=map.get(row[0]);if(matches(h,row))valid.set(row[0],h)}return valid}
