'use strict';
(()=>{
 const path=location.pathname;
 const current=path.startsWith('/topics/')?'/topics.html':path.startsWith('/hadith/')||['/hadith.html','/hadith-book.html'].includes(path)?'/hadiths.html':path;
 for(const a of document.querySelectorAll('.af-primary-navigation a'))if(new URL(a.href).pathname===current)a.setAttribute('aria-current','page');
})();
