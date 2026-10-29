'use strict';
(()=>{
 const root=document.getElementById('weekly-reflection');if(!root)return;
 const $=id=>document.getElementById(id),notesKey='af-ayah-reflections-v1',viewsKey='af-ayah-view-tokens-v1';
 let ref='13:28',visible=false,viewBusy=false,needsRecord=true,request=0;const drafts=new Map();
 const today=()=>new Date().toISOString().slice(0,10);
 const tr=s=>window.AFI18n?.translate(s)||s;
 function status(id,message,error=false){const el=$(id);el.textContent=message;el.hidden=!message;el.classList.toggle('is-error',error)}
 function readNotes(){const n=JSON.parse(localStorage.getItem(notesKey)||'{}');if(!n||typeof n!=='object'||Array.isArray(n))throw Error('Invalid notes');return n}
 function noteFor(key){try{const n=readNotes()[key];return typeof n==='string'?n:''}catch{return ''}}
 function uuid(){if(crypto.randomUUID)return crypto.randomUUID();const b=crypto.getRandomValues(new Uint8Array(16));b[6]=(b[6]&15)|64;b[8]=(b[8]&63)|128;const h=[...b].map(v=>v.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20)}
 function token(){try{const day=today(),stored=JSON.parse(localStorage.getItem(viewsKey)||'{}');const rows=stored&&typeof stored==='object'&&!Array.isArray(stored)?stored:{};for(const key of Object.keys(rows))if(!key.startsWith(day+':'))delete rows[key];const key=day+':'+ref;if(!/^[a-f0-9-]{36}$/i.test(rows[key]||''))rows[key]=uuid();localStorage.setItem(viewsKey,JSON.stringify(rows));return rows[key]}catch{return null}}
 function shareURL(){const url=new URL($('weekly-read').getAttribute('href'),'https://getfurqan.online');return url.href}
 async function views(record=false){if(viewBusy)return;const id=++request,current=ref;viewBusy=true;$('ayah-views-retry').disabled=true;try{const p_token=record?token():null;if(!window.AF?.rpc)throw Error('Unavailable');const result=await AF.rpc('af_ayah_views',{p_verse:current,p_token});if(id!==request||ref!==current)return;if(!Number.isSafeInteger(Number(result?.views))||Number(result.views)<0)throw Error('Invalid count');$('ayah-view-count').textContent=new Intl.NumberFormat(document.documentElement.lang||'en').format(Number(result.views));needsRecord=record?!p_token:needsRecord;status('ayah-views-status',record&&!p_token?'Browser storage is unavailable. Your visit was not added.':'')}catch{if(id===request){status('ayah-views-status','Views could not load. Please try again.',true)}}finally{viewBusy=false;$('ayah-views-retry').disabled=false;if(ref!==current&&visible)views(true)}}
 function panel(button,panelId){const opening=$(panelId).hidden;$(panelId).hidden=!opening;$(button).setAttribute('aria-expanded',String(opening));return opening}
 $('ayah-views').onclick=()=>{if(panel('ayah-views','ayah-views-panel'))views(visible&&needsRecord)};
 $('ayah-views-retry').onclick=()=>views(visible&&needsRecord);
 $('ayah-reflect').onclick=()=>{if(panel('ayah-reflect','ayah-reflect-panel'))$('ayah-reflection').focus()};
 $('ayah-reflection').addEventListener('input',()=>{drafts.set(ref,$('ayah-reflection').value);status('ayah-note-status','Unsaved changes.')});
 $('ayah-save').onclick=()=>{const value=$('ayah-reflection').value;if(!value.trim()){status('ayah-note-status','Write a reflection before saving.',true);return}try{const notes=readNotes();notes[ref]=value;localStorage.setItem(notesKey,JSON.stringify(notes));drafts.set(ref,value);status('ayah-note-status','Reflection saved in this browser.')}catch{status('ayah-note-status','Could not save. Browser storage may be unavailable or full. Copy your note before leaving.',true)}};
 $('ayah-delete').onclick=()=>{try{const notes=readNotes();delete notes[ref];localStorage.setItem(notesKey,JSON.stringify(notes));drafts.delete(ref);$('ayah-reflection').value='';status('ayah-note-status','Reflection deleted.')}catch{status('ayah-note-status','Could not delete. Browser storage is unavailable.',true)}};
 $('ayah-share').onclick=async()=>{const url=shareURL(),button=$('ayah-share');button.disabled=true;status('ayah-share-status','');try{if(navigator.share){try{await navigator.share({title:'Al Furqan · '+ref,url});return}catch(e){if(e.name==='AbortError')return}}try{await navigator.clipboard.writeText(url);status('ayah-share-status','Ayah link copied.')}catch{$('ayah-share-panel').hidden=false;$('ayah-share-url').value=url;$('ayah-share-url').focus();$('ayah-share-url').select()}}finally{button.disabled=false}};
 function selection(){const match=new URL($('weekly-read').href).searchParams.get('verse');if(!/^\d{1,3}:\d{1,3}$/.test(match||''))return;if(match!==ref){drafts.set(ref,$('ayah-reflection').value);ref=match;$('ayah-reflection').value=drafts.get(ref)??noteFor(ref);$('ayah-view-count').textContent='—';needsRecord=true;request++;status('ayah-note-status','');status('ayah-views-status','');status('ayah-share-status','');if(visible)views(true)}$('ayah-share-panel').hidden=true}
 $('ayah-reflection').value=noteFor(ref);document.addEventListener('af:featuredverse',selection);selection();
 if('IntersectionObserver'in window){const observer=new IntersectionObserver(entries=>{visible=entries.some(e=>e.isIntersecting);if(visible&&needsRecord&&!document.hidden)views(true)},{threshold:.5});observer.observe($('weekly-arabic'))}else{visible=true;views(true)}
 document.addEventListener('visibilitychange',()=>{if(!document.hidden&&visible){needsRecord=true;views(true)}});
 window.addEventListener('storage',e=>{if(e.key===notesKey&&!drafts.has(ref))$('ayah-reflection').value=noteFor(ref)});
})();
