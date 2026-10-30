'use strict';
// Passage identity comes from public URL parameters, never account or browser preferences.
window.AFMetadata=(()=>{
 const base='https://getfurqan.online';
 function canonical(path,search){
  const input=new URLSearchParams(search),out=new URLSearchParams();
  const integer=(key,max)=>{const raw=input.get(key);return /^\d+$/.test(raw||'')&&Number(raw)>=1&&Number(raw)<=max?String(Number(raw)):null};
  const reference=key=>{const raw=input.get(key)||'';if(!/^\d{1,3}:\d{1,3}$/.test(raw))return null;const [c,v]=raw.split(':').map(Number);return c>=1&&c<=114&&v>=1&&v<=286?c+':'+v:null};
  if(path==='/reader.html'){
   for(const [key,max] of [['chapter',114],['verse',0],['juz',30],['page',604]]){if(!input.has(key))continue;const value=key==='verse'?reference(key):integer(key,max);if(value&&(key!=='chapter'||value!=='1'))out.set(key,value);break;}
   const page=integer('p',100);if(page&&page!=='1'&&!out.has('verse'))out.set('p',page);
  }else if(path==='/study.html'){
   const verse=reference('verse');if(verse&&verse!=='1:1')out.set('verse',verse);
   const edition=input.get('tafsir');if(edition&&/^[a-z][a-z0-9_]{1,70}$/.test(edition)&&edition!=='persian_saadi')out.set('tafsir',edition);
  }else if(path==='/hadith.html'||path==='/hadith-book.html'){
   const collection=input.get('collection');if(/^[a-z][a-z0-9-]{0,40}$/.test(collection||''))out.set('collection',collection);
   const key=path==='/hadith.html'?'hadith':'book',value=input.get(key);if((/^\d+(?:\.\d+)?$/.test(value||'')&&Number(value)>0)||(key==='book'&&value==='unassigned'))out.set(key,value);
   const edition=input.get('edition');if(/^[a-z][a-z0-9_-]{1,80}$/.test(edition||''))out.set('edition',edition);
   if(path==='/hadith-book.html'){const page=integer('page',10000);if(page&&page!=='1')out.set('page',page);}
  }
  return base+path+(out.size?'?'+out:'');
 }
 function refresh(){
  const url=canonical(location.pathname,location.search);let link=document.querySelector('link[rel="canonical"]');
  if(!link){link=document.createElement('link');link.rel='canonical';document.head.append(link)}link.href=url;
  for(const [selector,value] of [['meta[property="og:url"]',url],['meta[property="og:title"]',document.title],['meta[name="twitter:title"]',document.title]]){const node=document.querySelector(selector);if(node)node.content=value;}
  const data=document.querySelector('script[type="application/ld+json"]');if(data)try{const json=JSON.parse(data.textContent);for(const item of json['@graph']||[]){if(item['@type']==='WebPage'){item['@id']=url+'#webpage';item.url=url;item.name=document.title;}if(item['@type']==='BreadcrumbList'){const last=item.itemListElement.at(-1);last.item=url;last.name=document.title.split(' · ')[0];}}data.textContent=JSON.stringify(json);}catch{}
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',refresh,{once:true});else refresh();
 window.addEventListener('popstate',refresh);document.addEventListener('af:languagechange',refresh);
 return {canonical,refresh};
})();
