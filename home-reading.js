'use strict';
(()=>{
 const $=id=>document.getElementById(id),store=window.FurqanProgress;if(!$('home-goal-form')||!store)return;
 const tr=s=>window.AFI18n?.translate(s)||s;let chapters=[];
 function render(){
  $('home-query').placeholder=tr('An Arabic or English word, or a reference like 2:255');
  const state=AFData.state(),ready=['guest','account'].includes(state.phase),d=store.read(),s=store.stats(d),r=d.resume;
  $('home-goal').disabled=$('home-goal-save').disabled=!ready;
  if(document.activeElement!==$('home-goal'))$('home-goal').value=d.goal;
  $('home-goal-count').textContent=s.today+' / '+d.goal;$('home-goal-meter').max=d.goal;$('home-goal-meter').value=Math.min(s.today,d.goal);$('home-saved-count').textContent=String(store.bookmarks().length);
  if(r){
   const c=chapters.find(c=>c.id===Number(r.key.split(':')[0]));$('home-resume-title').textContent=(c?c.name_simple+' · ':'')+r.key;
   $('home-resume-title').dir='auto';$('home-resume-description').textContent=tr('Return to the place you saved in the reader.');$('home-resume-link').textContent=tr('Continue reading')+' →';
   const p=new URLSearchParams({verse:r.key});if(window.editions?.[r.translation])p.set('translation',r.translation);$('home-resume-link').href='/reader.html?'+p;
  }else{
   $('home-resume-title').textContent=tr('Begin with a passage.');$('home-resume-description').textContent=tr('Keep your place in the reader and return to it here.');$('home-resume-link').textContent=tr('Read Quran')+' →';$('home-resume-link').href='/reader.html?chapter=1';
  }
  $('home-data-status').textContent=tr(state.phase==='loading'?'Checking reading storage…':state.phase==='blocked'?'Your account could not be verified. Retry before saving account data.':state.phase==='guest'?'Guest reading stays in this browser. Private account sync is optional.':state.error||state.conflicts.length?'Sync needs attention.':state.enabled?'Private reading sync is on.':'Private reading sync is paused.');
 }
 $('home-popular-toggle').onclick=()=>{const open=$('home-popular').hidden;$('home-popular').hidden=!open;$('home-popular-toggle').setAttribute('aria-expanded',String(open))};
 $('home-goal-form').onsubmit=e=>{e.preventDefault();if(!e.currentTarget.reportValidity())return;const ok=store.goal(Number($('home-goal').value));$('home-goal-status').textContent=tr(ok?'Goal saved.':'Goal could not be saved permanently. It is available for this visit only.');render()};
 window.addEventListener('furqan-progress',render);window.addEventListener('af:datachange',render);document.addEventListener('af:languagechange',render);render();
 fetch('https://api.quran.com/api/v4/chapters?language=en',{signal:AbortSignal.timeout(20000)}).then(r=>{if(!r.ok)throw Error();return r.json()}).then(d=>{if(Array.isArray(d.chapters)&&d.chapters.length===114){chapters=d.chapters;render()}}).catch(()=>{});
})();
