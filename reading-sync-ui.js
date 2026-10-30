'use strict';
(()=>{
 const root=document.querySelector('[data-reading-sync]');if(!root||!window.AFData)return;
 const q=s=>root.querySelector('[data-sync-'+s+']'),tr=s=>window.AFI18n?.translate(s)||s;
 const show=(key,value)=>q(key).hidden=!value;
 function render(){
  const s=AFData.state(),account=s.phase==='account',ready=account||s.phase==='guest';
  q('status').textContent=s.error?tr('Sync needs attention.')+' '+tr(s.error):tr(s.phase==='loading'?'Checking reading storage…':s.phase==='blocked'?'Your account could not be verified. Retry before saving account data.':s.phase==='guest'?'Reading is saved in this browser. Sign in to enable private sync.':s.busy?'Syncing your private reading data…':s.conflicts.length?'Some changes need your review.':!s.persistent?'Browser storage is unavailable. Keep this page open and copy important notes.':s.enabled?s.pending?'Changes are waiting to sync.':'Your account reading data is up to date.':'Sync is paused. Changes stay in this account’s browser storage.');
  show('signin',s.phase==='guest');show('enable',account&&!s.enabled);show('pause',account&&s.enabled);show('now',account);show('import',account);show('import-note',account);show('retry',s.phase==='blocked');show('counts',account);show('review',account&&s.conflicts.length>0);
  q('pending').textContent=String(s.pending);q('conflicts').textContent=String(s.conflicts.length);
  root.querySelectorAll('button').forEach(b=>b.disabled=s.busy||(!ready&&b!==q('retry')));
  q('conflict-list').replaceChildren();
  for(const c of s.conflicts){
   const row=document.createElement('div');row.className='reading-conflict-row';const title=document.createElement('strong');title.textContent=tr({bookmark:'Saved verse',read:'Reading checkmark',goal:'Daily reading goal',resume:'Reading place',note:'Study note',reflection:'Personal reflection'}[c.kind])+' · '+c.key;row.append(title);
   for(const[label,value]of [['This device',c.local],['Account version',c.account]]){const h=document.createElement('p'),pre=document.createElement('pre');h.textContent=tr(label);pre.setAttribute('data-i18n-ignore','');pre.dir='auto';pre.textContent=value===null?tr('Deleted'):typeof value==='string'?value:JSON.stringify(value,null,2);row.append(h,pre)}
   q('conflict-list').append(row);
  }
 }
 q('enable').onclick=()=>AFData.toggle(true);q('pause').onclick=()=>AFData.toggle(false);q('now').onclick=()=>AFData.sync();q('retry').onclick=()=>AFData.reconnect();
 q('import').onclick=()=>{const count=AFData.importBrowser();q('feedback').hidden=false;q('feedback').textContent=tr(count===false?'Import could not start. Please try again.':count?'Guest reading data imported. Existing account records were kept.':'No new guest reading records to import.')};
 q('remote').onclick=()=>AFData.resolve(false);q('local').onclick=()=>AFData.resolve(true);
 window.addEventListener('af:datachange',render);document.addEventListener('af:languagechange',render);render();
})();
