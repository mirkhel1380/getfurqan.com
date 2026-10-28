'use strict';
(()=>{
 const header=document.querySelector('.site-header'),toggle=document.getElementById('site-menu-toggle'),nav=document.getElementById('site-navigation');if(!header||!toggle||!nav)return;
 function setOpen(open){toggle.setAttribute('aria-expanded',String(open));toggle.setAttribute('aria-label',open?'Close navigation menu':'Open navigation menu');nav.classList.toggle('is-open',open)}
 header.classList.add('nav-ready');setOpen(false);toggle.onclick=()=>setOpen(toggle.getAttribute('aria-expanded')!=='true');
 document.addEventListener('keydown',e=>{if(e.key==='Escape'&&toggle.getAttribute('aria-expanded')==='true'){setOpen(false);toggle.focus()}});
 document.addEventListener('click',e=>{if(!header.contains(e.target))setOpen(false)});
 nav.addEventListener('click',e=>{if(e.target.closest('a'))setOpen(false)});
 matchMedia('(min-width: 1041px)').addEventListener('change',()=>setOpen(false));
})();
