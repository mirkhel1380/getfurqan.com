'use strict';
window.AFContactInbox=(()=>{
 const $=id=>document.getElementById(id);let page=1,total=0,busy=false,started=false;
 const node=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n};
 const notify=(text,error=false)=>AF.notify($('contact-inbox-status'),text,error);
 async function load(){
  if(busy)return;busy=true;for(const id of ['contact-inbox-refresh','contact-inbox-prev','contact-inbox-next','contact-inbox-unread'])$(id).disabled=true;notify('Loading messages…');
  try{
   const result=await AF.rpc('af_contact_inbox',{p_page:page,p_unread:$('contact-inbox-unread').checked});total=result.total;
   if(page>1&&(page-1)*20>=total){page=Math.max(1,Math.ceil(total/20));busy=false;return load();}
   $('contact-inbox-count').textContent=String(result.unread);$('contact-inbox-list').replaceChildren();
   for(const item of result.messages){
    const card=node('article',undefined,'contact-message');card.dataset.status=item.status;
    const subject=node('h3',item.subject,'contact-user-content');subject.dir='auto';subject.setAttribute('translate','no');
    const meta=node('div',undefined,'contact-message-meta'),name=node('span',item.name,'contact-user-content'),email=node('span',item.email,'contact-user-content');name.dir='auto';email.dir='ltr';name.setAttribute('translate','no');email.setAttribute('translate','no');
    const date=node('time',new Date(item.created_at).toLocaleString(window.AFI18n?.language==='prs'?'fa-AF':window.AFI18n?.language||'en',{dateStyle:'medium',timeStyle:'short'}));date.dateTime=item.created_at;meta.append(name,email,date,node('span',item.status==='new'?'Unread':'Read'));
    const text=node('p',item.message,'contact-message-text contact-user-content');text.dir='auto';text.setAttribute('translate','no');
    const actions=node('div',undefined,'contact-message-actions'),mark=node('button',item.status==='new'?'Mark read':'Mark unread','af-secondary');mark.type='button';
    mark.onclick=async()=>{mark.disabled=true;try{await AF.rpc('af_contact_mark',{p_id:item.id,p_read:item.status==='new'});await load();}catch{notify('The message status could not be updated. Please retry.',true);}finally{mark.disabled=false;}};
    actions.append(mark);card.append(subject,meta,text,actions);$('contact-inbox-list').append(card);
   }
   $('contact-inbox-empty').hidden=result.messages.length>0;$('contact-inbox-page').textContent=page+' / '+Math.max(1,Math.ceil(total/20));notify('');
  }catch{notify('Messages could not load. Please retry.',true);}
  finally{busy=false;$('contact-inbox-refresh').disabled=$('contact-inbox-unread').disabled=false;$('contact-inbox-prev').disabled=page<=1;$('contact-inbox-next').disabled=page*20>=total;}
 }
 function start(){if(started||!$('contact-inbox-list'))return;started=true;$('contact-inbox-refresh').onclick=load;$('contact-inbox-prev').onclick=()=>{if(page>1&&!busy){page--;load();}};$('contact-inbox-next').onclick=()=>{if(page*20<total&&!busy){page++;load();}};$('contact-inbox-unread').onchange=()=>{page=1;load();};load();}
 return {start};
})();
