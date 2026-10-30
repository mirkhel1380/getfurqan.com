'use strict';
window.FurqanProgress=(()=>{
 const KEY='furqan-reading-progress';let fallback=null,available=true;
 const validKey=k=>typeof k==='string'&&/^\d{1,3}:\d{1,3}$/.test(k)&&Number(k.split(':')[0])>=1&&Number(k.split(':')[0])<=114&&Number(k.split(':')[1])>=1&&Number(k.split(':')[1])<=286;
 function day(date=new Date()){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-')}
 function clean(raw){const d={version:1,goal:5,days:{},resume:null};if(!raw||typeof raw!=='object')return d;if(Number.isInteger(raw.goal)&&raw.goal>=1&&raw.goal<=1000)d.goal=raw.goal;if(raw.days&&typeof raw.days==='object')for(const [date,keys] of Object.entries(raw.days)){if(/^\d{4}-\d{2}-\d{2}$/.test(date)&&Array.isArray(keys))d.days[date]=[...new Set(keys.filter(validKey))]}if(validKey(raw.resume?.key))d.resume={key:raw.resume.key,translation:typeof raw.resume.translation==='string'?raw.resume.translation:'dari_badkhashani',updatedAt:typeof raw.resume.updatedAt==='string'?raw.resume.updatedAt:''};return d}
 function read(){if(window.AFData)return clean(AFData.get(KEY,null));if(!available)return clean(fallback);try{const raw=localStorage.getItem(KEY);return clean(raw?JSON.parse(raw):null)}catch{available=false;return clean(fallback)}}
 function save(d){if(window.AFData)return AFData.set(KEY,clean(d));fallback=clean(d);try{localStorage.setItem(KEY,JSON.stringify(fallback));available=true}catch{available=false}window.dispatchEvent(new Event('furqan-progress'));return available}
 function resume(key,translation){if(!validKey(key))return false;const d=read();d.resume={key,translation,updatedAt:new Date().toISOString()};return save(d)}
 function setRead(key,done,translation){if(!validKey(key))return false;const d=read(),date=day(),keys=new Set(d.days[date]||[]);if(done)keys.add(key);else keys.delete(key);d.days[date]=[...keys];d.resume={key,translation,updatedAt:new Date().toISOString()};return save(d)}
 function goal(n){if(!Number.isInteger(n)||n<1||n>1000)return false;const d=read();d.goal=n;return save(d)}
 function bookmarks(){try{const d=window.AFData?AFData.get('furqan-bookmarks',[]):JSON.parse(localStorage.getItem('furqan-bookmarks')||'[]');return Array.isArray(d)?[...new Set(d.filter(validKey))]:[]}catch{available=false;return []}}
 function setBookmarks(keys){if(window.AFData)return AFData.set('furqan-bookmarks',[...new Set(keys.filter(validKey))]);try{localStorage.setItem('furqan-bookmarks',JSON.stringify([...new Set(keys.filter(validKey))]));return true}catch{available=false;return false}}
 function stats(d=read()){const today=d.days[day()]||[],unique=new Set(Object.values(d.days).flat()),cursor=new Date();let streak=0;if(!today.length)cursor.setDate(cursor.getDate()-1);while((d.days[day(cursor)]||[]).length){streak++;cursor.setDate(cursor.getDate()-1)}return {today:today.length,unique:unique.size,streak}}
 return {read,day,resume,setRead,goal,stats,bookmarks,setBookmarks,validKey,available:()=>window.AFData?AFData.state().persistent&&['guest','account'].includes(AFData.state().phase):available};
})();
