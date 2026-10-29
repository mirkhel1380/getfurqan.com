"use strict";
(()=>{
 const drawer=document.getElementById('af-drawer'),toggle=document.getElementById('site-menu-toggle');if(!drawer)return;
 let opener;
 const names={navigation:'Explore Al Furqan',languages:'Website language',preferences:'Preferences'};
 function close(){drawer.close()}
 document.querySelectorAll('[data-drawer]').forEach(b=>b.addEventListener('click',()=>{opener=b;document.querySelectorAll('[data-drawer-panel]').forEach(p=>p.hidden=p.dataset.drawerPanel!==b.dataset.drawer);document.getElementById('af-drawer-title').textContent=names[b.dataset.drawer];if(b.hasAttribute('data-expand-languages')){document.getElementById('af-other-languages').hidden=false;document.getElementById('af-more-languages').setAttribute('aria-expanded','true');}drawer.showModal();toggle.setAttribute('aria-expanded','true');document.body.classList.add('af-menu-open')}));
 document.getElementById('af-drawer-close').onclick=close;
 drawer.addEventListener('click',e=>{const r=drawer.getBoundingClientRect();if(e.target===drawer&&(e.clientX<r.left||e.clientY<r.top||e.clientY>r.bottom))close()});
 drawer.addEventListener('close',()=>{toggle.setAttribute('aria-expanded','false');document.body.classList.remove('af-menu-open');opener?.focus()});
 document.querySelectorAll('#site-navigation a').forEach(a=>{if(location.pathname===new URL(a.href).pathname||(location.pathname.startsWith('/topics/')&&new URL(a.href).pathname==='/topics.html')||((location.pathname.startsWith('/hadith/')||['/hadith.html','/hadith-book.html'].includes(location.pathname))&&new URL(a.href).pathname==='/hadiths.html'))a.setAttribute('aria-current','page')});
 const reduce=document.getElementById('af-reduce-motion');try{reduce.checked=localStorage.getItem('af-reduce-motion')==='true'}catch{};
 function motion(){document.documentElement.classList.toggle('af-reduce-motion',reduce.checked);if(reduce.checked){const pause=document.getElementById('scene-toggle');if(pause&&pause.getAttribute('aria-pressed')!=='true')pause.click()}}
 motion();reduce.onchange=()=>{try{localStorage.setItem('af-reduce-motion',String(reduce.checked))}catch{}motion()};
 // Authentication is optional: navigation and public reading work if the client cannot load.
 if(window.AF)AF.current().then(me=>{if(!me)return;document.querySelectorAll('[data-account-link]').forEach(a=>{a.href='/account.html';const s=a.querySelector('span');if(s){s.textContent='My account'}else a.textContent='My account'})}).catch(()=>{});
})();
