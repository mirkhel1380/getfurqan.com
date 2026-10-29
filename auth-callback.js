'use strict';
(async()=>{
 const $=id=>document.getElementById(id),status=$('callback-status'),link=$('callback-link');
 const params=new URLSearchParams(location.search),requested=params.get('mode'),recovery=requested==='recovery',invite=requested==='invite';
 const cleanURL=()=>history.replaceState(null,'','/auth-callback.html'+(recovery?'?mode=recovery':invite?'?mode=invite':''));
 let verifiedSession=false;
 try{
  const hash=new URLSearchParams(location.hash.slice(1));
  if(hash.get('error_description')||params.get('error_description'))throw Error(hash.get('error_description')||params.get('error_description'));
  const {data,error}=await AF.client.auth.getSession();cleanURL();if(error)throw error;if(!data.session)throw Error('This link has expired, has already been used, or was opened in a different browser. Request a new link and open it in the browser where you requested it.');
  const verified=await AF.client.auth.getUser();if(verified.error||!verified.data.user)throw verified.error||Error('Could not verify this session.');
  const me=await AF.current();if(!me)throw Error('Please sign in again to continue.');verifiedSession=true;
  if(recovery||invite){$('callback-heading').textContent=invite?'Welcome to Al Furqan':'Choose a new password';AF.notify(status,invite?'Your email is verified. Choose your own password to finish setting up your account.':'Your secure link is verified. Choose a new password below.');$('reset-form').hidden=false}
  else{$('callback-heading').textContent='Email confirmed';AF.notify(status,'Your account is ready. Welcome to Al Furqan.');link.href='/account.html';link.textContent='Open my account →';link.hidden=false}
 }catch(e){cleanURL();$('callback-heading').textContent='We could not verify this link';AF.notify(status,AF.message(e),true);link.hidden=false}
 $('reset-form').onsubmit=async e=>{e.preventDefault();if(!verifiedSession||(!recovery&&!invite))return;const b=e.target.querySelector('button');b.disabled=true;try{const p=$('new-password').value;if(p.length<12||p.length>128)throw Error('Use a password containing 12 to 128 characters.');if(p!==$('confirm-password').value)throw Error('The passwords do not match.');const{error}=await AF.client.auth.updateUser({password:p});if(error)throw error;$('reset-form').reset();$('reset-form').hidden=true;AF.notify(status,invite?'Your account is ready. Open your account to continue.':'Your password has been updated.');link.href='/account.html';link.textContent='Open my account →';link.hidden=false}catch(err){AF.notify(status,AF.message(err),true)}finally{b.disabled=false}};
})();
