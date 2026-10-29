'use strict';
(()=>{
 const form=document.getElementById('contact-form'),button=document.getElementById('contact-submit'),status=document.getElementById('contact-status');
 let busy=false,requestId=null,fingerprint='';
 const message=(text,error=false)=>{status.textContent=text;status.hidden=false;status.classList.toggle('is-error',error);status.setAttribute('role',error?'alert':'status')};
 function setBusy(on){busy=on;button.disabled=on;button.setAttribute('aria-busy',String(on));button.textContent=on?'Sending…':'Send message';for(const field of form.querySelectorAll('input,textarea'))field.disabled=on;}
 const deadline=operation=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('timeout')),35000);Promise.resolve().then(operation).then(resolve,reject).finally(()=>clearTimeout(timer));});
 form.addEventListener('submit',async event=>{
  event.preventDefault();if(busy||!form.reportValidity())return;
  const payload={p_name:form.elements.name.value.trim(),p_email:form.elements.email.value.trim().toLowerCase(),p_subject:form.elements.subject.value.trim(),p_message:form.elements.message.value.trim(),p_language:window.AFI18n?.language||'en',p_website:form.elements.website.value};
  if(!payload.p_name||payload.p_subject.length<3||payload.p_message.length<10){message('Please check your name, subject and message.',true);return;}
  const next=JSON.stringify([payload.p_name,payload.p_email,payload.p_subject,payload.p_message]);if(next!==fingerprint||!requestId){requestId=crypto.randomUUID?crypto.randomUUID():(()=>{const a=crypto.getRandomValues(new Uint8Array(16));a[6]=(a[6]&15)|64;a[8]=(a[8]&63)|128;const h=[...a].map(x=>x.toString(16).padStart(2,'0')).join('');return h.slice(0,8)+'-'+h.slice(8,12)+'-'+h.slice(12,16)+'-'+h.slice(16,20)+'-'+h.slice(20);})();fingerprint=next;}
  setBusy(true);status.hidden=true;
  try{
   if(!window.AF?.client)throw Error('unavailable');
   const result=await deadline(()=>AF.client.rpc('af_contact_submit',{...payload,p_request_id:requestId}));
   if(result.error)throw result.error;if(result.data?.ok!==true||result.data?.reference!==requestId)throw Error('unavailable');
   form.reset();requestId=null;fingerprint='';message('Thank you. Your message has been received by Al Furqan.');
  }catch(error){
   if(/Too many messages/i.test(error?.message||''))message('Too many messages. Please try again later or email contact@getfurqan.online.',true);
   else message('Your message could not be confirmed. Your text is still here; try again or email contact@getfurqan.online.',true);
  }finally{setBusy(false);}
 });
 button.disabled=false;
})();
