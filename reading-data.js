'use strict';
window.AFData=(()=>{
 const C=AFReadingCore,records=new Map(),memory=new Map(),failed=new Set();
 let phase='loading',uid=null,enabled=false,persistent=true,error='',busy=false,epoch=0,timer,prefix='',lastSynced=null,ready;
 const uuid=()=>{if(crypto.randomUUID)return crypto.randomUUID();return [...crypto.getRandomValues(new Uint32Array(4))].map(x=>x.toString(16).padStart(8,'0')).join('')};
 function readJSON(key,fallback){try{if(failed.has(key)&&memory.has(key))return memory.get(key);const s=localStorage.getItem(key);return s===null?(memory.has(key)?memory.get(key):fallback):JSON.parse(s)}catch{persistent=false;return memory.has(key)?memory.get(key):fallback}}
 function writeJSON(key,value){memory.set(key,value);try{localStorage.setItem(key,JSON.stringify(value));failed.delete(key);return true}catch{failed.add(key);persistent=false;return false}}
 function state(){return {phase,uid,enabled,persistent,error,busy,lastSynced,pending:[...records.values()].filter(r=>r.pending).length,conflicts:[...records.values()].filter(r=>r.conflict).map(r=>({kind:r.kind,key:r.key,local:r.pending?.value,account:r.conflict.value}))}}
 function announce(scopeChanged=false){window.dispatchEvent(new CustomEvent('af:datachange',{detail:{...state(),scopeChanged}}));window.dispatchEvent(new Event('furqan-progress'))}
 function loadRecord(id){const r=readJSON(prefix+'item:'+id,null);if(r&&C.valid(r.kind,r.key,C.active(r))&&C.id(r.kind,r.key)===id&&Number.isSafeInteger(r.server?.revision??0))records.set(id,r);return records.get(id)}
 function saveRecord(r){records.set(C.id(r.kind,r.key),r);return writeJSON(prefix+'item:'+C.id(r.kind,r.key),r)}
 function loadAll(){records.clear();try{for(let n=0;n<localStorage.length;n++){const k=localStorage.key(n);if(k?.startsWith(prefix+'item:'))loadRecord(k.slice((prefix+'item:').length))}}catch{persistent=false}for(const k of memory.keys())if(k.startsWith(prefix+'item:'))loadRecord(k.slice((prefix+'item:').length))}
 function meta(){writeJSON(prefix+'meta',{enabled,lastSynced})}
 function get(key,fallback){if(!C.keys.includes(key))return fallback;if(phase==='guest')return readJSON(key,fallback);if(phase!=='account')return fallback;return C.materialize(key,records)}
 function set(key,value){
  if(!C.keys.includes(key)||!['guest','account'].includes(phase))return false;
  if(phase==='guest'){const ok=writeJSON(key,value);announce();return ok}
  const before=C.flatten(key,get(key,null)),after=C.flatten(key,value);let ok=true;
  for(const id of new Set([...before.keys(),...after.keys()])){
   const next=after.get(id)?.value??null,old=before.get(id)?.value??null;if(C.equal(next,old))continue;
   const item=after.get(id)||before.get(id);const r=loadRecord(id)||{kind:item.kind,key:item.key,server:{value:null,revision:0}};
   r.pending={value:next,base:r.pending?.base??r.server.revision,id:uuid()};delete r.conflict;ok=saveRecord(r)&&ok;
  }
  announce();queue();return ok;
 }
 function queue(delay=900){clearTimeout(timer);if(phase==='account'&&enabled)timer=setTimeout(()=>sync(),delay)}
 function checkRemote(r){return r&&C.valid(r.kind,r.key,r.value)&&Number.isSafeInteger(r.revision)&&r.revision>=0}
 async function sync(){
  if(busy||phase!=='account'||!window.AF?.rpc)return false;
  const identity=uid,version=epoch;busy=true;error='';announce();
  try{
   const remote=await AF.rpc('af_reading_get');if(version!==epoch||identity!==uid)return false;
   if(typeof remote?.enabled!=='boolean'||!Array.isArray(remote.items)||remote.items.length>20000||!remote.items.every(checkRemote))throw Error('Invalid reading data response.');
   enabled=remote.enabled;meta();
   for(const item of remote.items){const id=C.id(item.kind,item.key),current=loadRecord(id)||{kind:item.kind,key:item.key};saveRecord({...current,server:{value:item.value,revision:item.revision}})}
   // Bounded batches keep a large explicit import responsive. Pending edits persist per record.
   for(let batch=0;enabled&&batch<20;batch++){
    loadAll();const changes=[...records.values()].filter(r=>r.pending&&!r.conflict).slice(0,20);if(!changes.length)break;
    const sent=changes.map(r=>({kind:r.kind,key:r.key,...r.pending}));
    const result=await AF.rpc('af_reading_patch',{p_ops:sent.map(({kind,key,value,base})=>({kind,key,value,base}))});
    if(version!==epoch||identity!==uid)return false;
    if(!Array.isArray(result?.items)||result.items.length!==sent.length)throw Error('Invalid reading data response.');
    for(let i=0;i<sent.length;i++){
     const r=result.items[i],s=sent[i];if(!checkRemote(r)||r.kind!==s.kind||r.key!==s.key||typeof r.ok!=='boolean')throw Error('Invalid reading data response.');
     const current=loadRecord(C.id(s.kind,s.key));if(current)saveRecord(C.acknowledge(current,s,r));
    }
   }
   lastSynced=new Date().toISOString();meta();return true;
  }catch(e){if(version===epoch){error=AF.message(e);if(/sync is paused/i.test(error)){enabled=false;meta()}}return false}
  finally{if(version===epoch){busy=false;announce();if(enabled&&!error&&[...records.values()].some(r=>r.pending&&!r.conflict))queue(500)}}
 }
 async function toggle(value){if(phase!=='account'||busy)return false;const version=epoch;busy=true;error='';announce();try{const r=await AF.rpc('af_reading_enabled',{p_enabled:value});if(version!==epoch)return false;if(r?.enabled!==value)throw Error('Invalid reading data response.');enabled=value;meta();return true}catch(e){if(version===epoch)error=AF.message(e);return false}finally{if(version===epoch){busy=false;announce();if(enabled)queue(0)}}}
 function importBrowser(){
  if(phase!=='account'||busy)return false;let count=0;
  for(const key of C.keys){const source=readJSON(key,null);if(source===null)continue;for(const [id,item]of C.flatten(key,source)){
   // Preserve existing account values, including deletion markers. Never silently upload another visitor's notes.
   if(loadRecord(id))continue;
   saveRecord({...item,server:{value:null,revision:0},pending:{value:item.value,base:0,id:uuid()}});count++;
  }}
  announce();queue();return count;
 }
 function resolve(useLocal){if(phase!=='account'||busy)return;for(const r of records.values())if(r.conflict){const latest=loadRecord(C.id(r.kind,r.key));if(!latest?.conflict)continue;if(useLocal&&latest.pending)latest.pending={...latest.pending,base:latest.conflict.revision,id:uuid()};else delete latest.pending;delete latest.conflict;saveRecord(latest)}announce();queue(0)}
 async function boot(){
  const version=++epoch;clearTimeout(timer);phase='loading';uid=null;enabled=false;busy=false;error='';prefix='';records.clear();announce(true);
  try{
   const me=window.AF?await AF.current():null;if(version!==epoch)return;
   if(!me){phase='guest';announce(true);return}
   if(!/^[a-f0-9-]{36}$/i.test(me.id))throw Error('Could not verify the reading account.');
   uid=me.id;prefix='af-reading-account-v1:'+uid+':';phase='account';const saved=readJSON(prefix+'meta',{});enabled=saved.enabled===true;lastSynced=saved.lastSynced||null;loadAll();announce(true);await sync();
  }catch(e){if(version===epoch){phase='blocked';error=window.AF?.message(e)||String(e);announce(true)}}
 }
 // Callbacks return immediately; Supabase warns against awaited auth calls inside auth-state callbacks.
 window.AF?.client?.auth.onAuthStateChange((event,session)=>{if(['SIGNED_IN','SIGNED_OUT','USER_UPDATED'].includes(event))setTimeout(()=>{if(phase==='account'&&session?.user?.id===uid){sync();return}ready=boot()},0)});
 window.addEventListener('storage',e=>{if(phase==='guest'&&C.keys.includes(e.key)){announce();return}if(phase==='account'&&e.key?.startsWith(prefix)){if(e.key===prefix+'meta'){const m=readJSON(e.key,{});enabled=m.enabled===true;lastSynced=m.lastSynced||null}else if(e.key.startsWith(prefix+'item:'))loadRecord(e.key.slice((prefix+'item:').length));announce();queue()}});
 window.addEventListener('online',()=>sync());window.addEventListener('focus',()=>sync());document.addEventListener('visibilitychange',()=>{if(!document.hidden)sync()});
 setInterval(()=>{if(!document.hidden)sync()},30000);
 ready=boot();
 return {get,set,state,sync,toggle,importBrowser,resolve,reconnect(){ready=boot();return ready},get ready(){return ready}};
})();
