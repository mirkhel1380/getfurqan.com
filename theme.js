'use strict';
// Run before paint. System is the default; explicit choices are shared across pages.
window.AFTheme=(()=>{
 const key='af-theme',choices=['light','dark','system'],media=window.matchMedia('(prefers-color-scheme: dark)');
 let preference='system',resolved;
 try{const saved=localStorage.getItem(key);if(choices.includes(saved))preference=saved;else {const legacy=localStorage.getItem('furqan-dark');if(legacy==='true'||legacy==='false')preference=legacy==='true'?'dark':'light'}}catch{}
 function apply(){const next=preference==='system'?(media.matches?'dark':'light'):preference,changed=next!==resolved;resolved=next;document.documentElement.dataset.theme=next;document.documentElement.style.colorScheme=next;document.body?.classList.toggle('dark',next==='dark');document.querySelectorAll('[data-theme-choice]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.themeChoice===preference)));const reader=document.getElementById('theme');if(reader){reader.textContent=next==='dark'?'☀':'☾';reader.setAttribute('aria-label',window.AFI18n?.translate('Open preferences')||'Open preferences')}if(changed)document.dispatchEvent(new CustomEvent('af:themechange',{detail:{preference,resolved}}))}
 function select(value){if(!choices.includes(value))return;preference=value;try{localStorage.setItem(key,value);localStorage.removeItem('furqan-dark')}catch{}apply()}
 const change=()=>{if(preference==='system')apply()};if(media.addEventListener)media.addEventListener('change',change);else media.addListener(change);
 window.addEventListener('storage',e=>{if(e.key===key){preference=choices.includes(e.newValue)?e.newValue:'system';apply()}});
 function boot(){document.querySelectorAll('[data-theme-choice]').forEach(b=>b.addEventListener('click',()=>select(b.dataset.themeChoice)));apply()}
 apply();if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
 return {select,get preference(){return preference},get resolved(){return resolved}};
})();
