'use strict';
(async()=>{
 const $=id=>document.getElementById(id),status=$('account-status');$('signout').onclick=()=>AF.signout().catch(e=>AF.notify(status,AF.message(e),true));
 try{const me=await AF.requireAccount();if(!me)return;$('profile-email').textContent=me.email;$('profile-name').value=me.display_name;$('profile-verified').textContent=me.email_verified?'Verified':'Confirmation needed';$('profile-created').textContent=new Date(me.created_at).toLocaleDateString(undefined,{year:'numeric',month:'long',day:'numeric'});$('admin-link').hidden=!me.is_admin;$('account-content').hidden=false;AF.notify(status,'')}
 catch(e){AF.notify(status,AF.message(e),true)}
 $('profile-form').onsubmit=async e=>{e.preventDefault();const b=e.target.querySelector('button');b.disabled=true;try{await AF.rpc('af_update_profile',{p_name:$('profile-name').value.trim()});AF.notify(status,'Your profile has been updated.')}catch(err){AF.notify(status,AF.message(err),true)}finally{b.disabled=false}};
})();
