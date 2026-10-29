'use strict';
(()=>{
 const controls=[...document.querySelectorAll('[data-password-toggle]')];
 function set(button,visible){const field=document.getElementById(button.getAttribute('aria-controls'));if(!field)return;field.type=visible?'text':'password';button.setAttribute('aria-pressed',String(visible));button.setAttribute('aria-label',visible?'Hide password':'Show password');}
 function hide(){controls.forEach(b=>set(b,false));}
 controls.forEach(button=>{button.hidden=false;button.addEventListener('click',()=>set(button,button.getAttribute('aria-pressed')!=='true'));});
 document.querySelectorAll('[data-mode]').forEach(b=>b.addEventListener('click',hide,{capture:true}));
 document.querySelectorAll('form').forEach(f=>f.addEventListener('submit',hide,{capture:true}));
 window.addEventListener('pagehide',hide);
})();
