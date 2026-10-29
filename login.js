'use strict';
(()=>{
 const $=id=>document.getElementById(id),form=$('auth-form'),status=$('auth-status');
 const pendingKey='af-confirmation-pending-v1';
 let mode='signin',busy=false,ticker=null,pending=null;
 try{const saved=JSON.parse(sessionStorage.getItem(pendingKey)||'null');if(saved&&typeof saved.email==='string'&&saved.email.length<=254)pending={email:saved.email.trim().toLowerCase(),nextAllowedAt:Number.isFinite(Number(saved.nextAllowedAt))?Math.max(0,Math.min(Number(saved.nextAllowedAt),Date.now()+3600000)):0}}catch{}
 const normalize=email=>email.trim().toLowerCase();
 const readyFor=m=>m==='signin'||(m==='recovery'?AF_CONFIG.recoveryReady:AF_CONFIG.registrationReady);
 const titles={
  signin:['Welcome back','Sign in with your email and password.','Sign in'],
  signup:['Create your account','A few details, and a confirmation email to get started.','Create account'],
  recovery:['Forgot your password?','Enter your email to request a password reset link.','Send reset link'],
  resend:['Confirm your email','Request a fresh link for an unconfirmed account. Already confirmed? Sign in instead.','Resend confirmation']
 };
 function remember(email,seconds=0){const same=pending?.email===normalize(email);pending={email:normalize(email),nextAllowedAt:seconds?Date.now()+seconds*1000:same?pending.nextAllowedAt:0};try{sessionStorage.setItem(pendingKey,JSON.stringify(pending))}catch{}}
 function remaining(){return mode==='resend'&&pending?.email===normalize($('auth-email').value)?Math.max(0,Math.ceil((pending.nextAllowedAt-Date.now())/1000)):0}
 function refreshButton(){const wait=remaining(),button=$('auth-submit');button.disabled=busy||!readyFor(mode)||wait>0;button.setAttribute('aria-busy',String(busy));button.textContent=busy?'Please wait…':wait?`Resend in ${wait}s`:titles[mode][2];if(wait>0&&ticker===null)ticker=setInterval(refreshButton,1000);else if(!wait&&ticker!==null){clearInterval(ticker);ticker=null}}
 function setBusy(on){busy=on;form.setAttribute('aria-busy',String(on));['auth-email','auth-name','auth-password'].forEach(id=>$(id).disabled=on);document.querySelectorAll('[data-mode]').forEach(b=>b.disabled=on);refreshButton()}
 function setMode(next){
  if(busy||!titles[next])return;
  mode=next;const [heading,subtitle]=titles[mode];$('auth-heading').textContent=heading;$('auth-subtitle').textContent=subtitle;
  if(mode==='resend'&&!$('auth-email').value&&pending)$('auth-email').value=pending.email;
  $('name-label').hidden=mode!=='signup';$('auth-name').required=mode==='signup';$('password-label').hidden=!['signin','signup'].includes(mode);$('auth-password').required=['signin','signup'].includes(mode);$('auth-password').minLength=mode==='signup'?12:1;$('auth-password').autocomplete=mode==='signup'?'new-password':'current-password';$('password-hint').hidden=mode!=='signup';$('back-signin').hidden=['signin','signup'].includes(mode);
  document.querySelectorAll('.auth-links [data-mode]').forEach(button=>button.hidden=button.dataset.mode===mode);
  document.querySelectorAll('[role=tab]').forEach(t=>{const on=t.dataset.mode===mode;t.setAttribute('aria-selected',String(on));t.tabIndex=on?0:-1});$('auth-panel').setAttribute('aria-labelledby',mode==='signup'?'tab-signup':mode==='signin'?'tab-signin':'auth-heading');
  const ready=readyFor(mode);form.hidden=!ready;refreshButton();if(!ready){$('auth-subtitle').textContent='You can sign in to an existing account or continue reading without an account.';AF.notify(status,'Account registration is temporarily unavailable. Please try again later.')}else AF.notify(status,'');
 }
 const request=operation=>new Promise((resolve,reject)=>{const timer=setTimeout(()=>reject(Error('The request took too long. Check your connection and try again.')),35000);Promise.resolve().then(operation).then(resolve,reject).finally(()=>clearTimeout(timer))});
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>setMode(b.dataset.mode));
 $('auth-email').addEventListener('input',refreshButton);
 document.querySelector('.auth-tabs').addEventListener('keydown',e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();setMode(mode==='signup'?'signin':'signup');$(mode==='signup'?'tab-signup':'tab-signin').focus()}});
 setMode(new URLSearchParams(location.search).get('mode')||'signin');
 form.onsubmit=async e=>{
  e.preventDefault();if(busy||remaining()>0)return;if(!readyFor(mode)){AF.notify(status,'Account registration is temporarily unavailable. Please try again later.');return}
  const submittedMode=mode,email=$('auth-email').value.trim(),password=$('auth-password').value;let transition=null;
  setBusy(true);AF.notify(status,'Please wait…');
  try{
   if(!AF.client)throw Error('Account service could not load. Please reload.');let result;
   if(mode==='signin'){
    result=await request(()=>AF.client.auth.signInWithPassword({email,password}));if(result.error)throw result.error;
    const me=await request(()=>AF.current());if(!me)throw Error('Please sign in again.');const next=new URLSearchParams(location.search).get('next');location.assign(me.is_admin&&next==='admin'?'/admin.html':'/account.html');return;
   }
   if(mode==='signup'){
    const name=$('auth-name').value.trim();if(!name)throw Error('Please enter your name.');
    result=await request(()=>AF.client.auth.signUp({email,password,options:{emailRedirectTo:AF.callback(),data:{display_name:name}}}));if(result.error)throw result.error;
    $('auth-password').value='';remember(email,60);transition={message:'If this address can be registered, a confirmation email will arrive shortly. Check your inbox and spam folder. If the link expires, request a fresh one below. Open the newest email in this browser.'};
   }
   if(mode==='recovery'){
    result=await request(()=>AF.client.auth.resetPasswordForEmail(email,{redirectTo:AF.callback('recovery')}));if(result.error)throw result.error;
    AF.notify(status,'If an account exists for this email, a password reset link will arrive shortly. Open it in this browser.');
   }
   if(mode==='resend'){
    result=await request(()=>AF.client.auth.resend({type:'signup',email,options:{emailRedirectTo:AF.callback()}}));if(result.error)throw result.error;
    remember(email,60);AF.notify(status,'If this account still needs confirmation, a fresh email will arrive shortly. Check spam too. Use only the newest link and open it in this browser. If already confirmed, sign in.');
   }
  }catch(error){
   const text=error?.message||String(error),wait=text.match(/after\s+(\d+)\s+seconds?/i);
   if(submittedMode==='signin'&&(error?.code==='email_not_confirmed'||/email not confirmed/i.test(text))){remember(email);$('auth-password').value='';transition={message:'Confirm your email before signing in. You can request a fresh confirmation link below.'}}
   else if(['signup','resend'].includes(submittedMode)&&wait){const seconds=Math.min(3600,Math.max(1,Number(wait[1])));remember(email,seconds);transition={message:`Please wait ${seconds} seconds before requesting another confirmation email.`,error:true}}
   else AF.notify(status,error?.code==='over_email_send_rate_limit'?'The email sending limit has been reached. Please try again later.':AF.message(error),true);
  }finally{setBusy(false);if(transition){setMode('resend');AF.notify(status,transition.message,!!transition.error)}}
 };
})();
