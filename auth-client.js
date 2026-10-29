'use strict';
window.AF=(()=>{
 async function timedFetch(input,options={}){const controller=new AbortController(),original=options.signal;let timedOut=false;const cancel=()=>controller.abort(original.reason);if(original?.aborted)cancel();else original?.addEventListener('abort',cancel,{once:true});const timer=setTimeout(()=>{timedOut=true;controller.abort()},30000);try{return await fetch(input,{...options,signal:controller.signal})}catch(error){if(timedOut)throw Error('The request took too long. Check your connection and try again.');throw error}finally{clearTimeout(timer);original?.removeEventListener('abort',cancel)}}
 const client=window.supabase?.createClient(AF_CONFIG.url,AF_CONFIG.key,{global:{fetch:timedFetch},auth:{flowType:(location.pathname==='/auth-callback.html'&&new URLSearchParams(location.search).get('mode')==='invite')?'implicit':'pkce',detectSessionInUrl:true,persistSession:true,autoRefreshToken:true}});
 let pending;
 async function current(){
  if(!client)throw Error('Account service could not load. Reload and try again.');
  if(!pending)pending=(async()=>{const {data:{user},error}=await client.auth.getUser();if(!user){if(error&&error.name!=='AuthSessionMissingError')throw error;return null}const {data,error:e}=await client.rpc('af_me');if(e)throw e;return data})().finally(()=>{pending=null});
  return pending;
 }
 async function requireAccount(admin=false){const me=await current();if(!me){location.replace('/login.html?next='+encodeURIComponent(admin?'admin':'account'));return null}if(admin&&!me.is_admin)throw Error('This page is only available to the site administrator.');return me}
 async function rpc(name,args){const{data,error}=await client.rpc(name,args);if(error)throw error;return data}
 async function signout(){const {error}=await client.auth.signOut();if(error)throw error;location.replace('/login.html')}
 function message(e){const s=e?.message||String(e);if(/non.?authorized|email address.*not.*authoriz|email_address_not_authorized/i.test(s)||e?.code==='email_address_not_authorized')return 'Email delivery is not ready for public registration yet. Please try again later.';if(/rate.limit|too many|security purposes/i.test(s))return 'Please wait a little before trying again.';if(/invalid login/i.test(s))return 'The email or password is incorrect.';if(/fetch|network|load failed/i.test(s))return 'Could not connect. Check your connection and try again.';if(/Email not confirmed/i.test(s))return 'Please confirm your email before signing in.';if(/smtp|sending.*email/i.test(s))return 'The confirmation email could not be sent. Please try again later.';return s}
 function notify(el,text,error=false){el.textContent=text;el.hidden=!text;el.classList.toggle('is-error',error);el.setAttribute('role',error?'alert':'status')}
 function callback(type='confirm'){return AF_CONFIG.origin+'/auth-callback.html?mode='+type}
 return {client,current,requireAccount,rpc,signout,message,notify,callback};
})();
