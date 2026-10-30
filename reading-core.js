'use strict';
// Only personal reading records are mapped here; published Quran/source text is never stored or edited.
window.AFReadingCore=(()=>{
 const keys=['furqan-reading-progress','furqan-bookmarks','furqan-study-notes','af-ayah-reflections-v1'];
 const verse=k=>typeof k==='string'&&/^[1-9]\d{0,2}:[1-9]\d{0,2}$/.test(k)&&Number(k.split(':')[0])<=114&&Number(k.split(':')[1])<=286;
 const date=k=>/^\d{4}-\d{2}-\d{2}$/.test(k)&&!Number.isNaN(Date.parse(k+'T00:00:00Z'))&&new Date(k+'T00:00:00Z').toISOString().slice(0,10)===k;
 const id=(kind,key)=>kind+':'+key;
 const stable=v=>v&&typeof v==='object'?(Array.isArray(v)?v.map(stable):Object.fromEntries(Object.keys(v).sort().map(k=>[k,stable(v[k])]))):v;
 const equal=(a,b)=>JSON.stringify(stable(a))===JSON.stringify(stable(b));
 function valid(kind,key,value){
  if(typeof key!=='string'||key.length>100)return false;
  if(kind==='goal')return key==='goal'&&(value===null||(Number.isInteger(value)&&value>=1&&value<=1000));
  if(kind==='resume')return key==='resume'&&(value===null||(value&&typeof value==='object'&&!Array.isArray(value)&&Object.keys(value).sort().join(',')==='key,translation,updatedAt'&&verse(value.key)&&/^[a-z0-9_]{1,80}$/.test(value.translation)&&typeof value.updatedAt==='string'&&value.updatedAt.length<=40&&Number.isFinite(Date.parse(value.updatedAt))));
  if(kind==='read'){const parts=key.split('|');return parts.length===2&&date(parts[0])&&verse(parts[1])&&(value===true||value===null)}
  if(!verse(key))return false;
  if(kind==='bookmark')return value===true||value===null;
  return ['note','reflection'].includes(kind)&&(value===null||(typeof value==='string'&&value.length<=5000));
 }
 function flatten(storageKey,value){
  const out=new Map(),put=(kind,key,v)=>{if(valid(kind,key,v))out.set(id(kind,key),{kind,key,value:v})};
  if(storageKey===keys[1]&&Array.isArray(value))for(const k of value)put('bookmark',k,true);
  if([keys[2],keys[3]].includes(storageKey)&&value&&typeof value==='object'&&!Array.isArray(value))for(const [k,v]of Object.entries(value))if(typeof v==='string'&&v)put(storageKey===keys[2]?'note':'reflection',k,v);
  if(storageKey===keys[0]&&value&&typeof value==='object'){
   if(Number.isInteger(value.goal))put('goal','goal',value.goal);
   if(value.resume)put('resume','resume',value.resume);
   if(value.days&&typeof value.days==='object')for(const [d,rows]of Object.entries(value.days))if(Array.isArray(rows))for(const k of rows)put('read',d+'|'+k,true);
  }
  return out;
 }
 const active=r=>r.pending?r.pending.value:r.server?.value??null;
 function materialize(storageKey,records){
  const progress={version:1,goal:5,days:{},resume:null},bookmarks=[],notes={};
  for(const r of records.values()){
   const v=active(r);if(v===null||!valid(r.kind,r.key,v))continue;
   if(storageKey===keys[1]&&r.kind==='bookmark')bookmarks.push(r.key);
   if(storageKey===keys[2]&&r.kind==='note'||storageKey===keys[3]&&r.kind==='reflection')notes[r.key]=v;
   if(storageKey===keys[0]){
    if(r.kind==='goal')progress.goal=v;
    if(r.kind==='resume')progress.resume=v;
    if(r.kind==='read'){const[d,k]=r.key.split('|');(progress.days[d]??=[]).push(k)}
   }
  }
  if(storageKey===keys[0])return progress;
  if(storageKey===keys[1])return bookmarks;
  return notes;
 }
 // Acknowledging an older queued edit must not discard a newer local edit.
 function acknowledge(record,sent,remote){
  const next={...record,server:{value:remote.value,revision:remote.revision}};
  if(!record.pending)return next;
  if(remote.ok){
   if(record.pending.id===sent.id)delete next.pending;
   else if(record.pending.base===sent.base)next.pending={...record.pending,base:remote.revision};
   delete next.conflict;
  }else next.conflict={value:remote.value,revision:remote.revision};
  return next;
 }
 return {keys,verse,date,id,equal,valid,flatten,materialize,active,acknowledge};
})();
