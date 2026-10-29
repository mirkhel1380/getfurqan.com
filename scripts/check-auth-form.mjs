import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code=readFileSync('dist/login.js','utf8');
function setup(mode='signup',ready=false,result=async()=>({error:null})){
 const els={},timers=new Map();let calls=0,tid=0;
 const get=id=>els[id]??={hidden:false,value:id==='auth-email'?'fixture@example.invalid':id==='auth-name'?'Test reader':'synthetic-test-value',disabled:false,textContent:'',setAttribute(k,v){this[k]=v},classList:{toggle(){}},querySelector(){return get('auth-submit')},focus(){}};
 const tabs=['signin','signup','recovery','resend'].map(m=>({...get('tab-'+m),dataset:{mode:m}}));
 const auth={};for(const name of ['signInWithPassword','signUp','resetPasswordForEmail','resend'])auth[name]=async()=>{calls++;return result()};
 vm.runInNewContext(code,{URLSearchParams,setTimeout(fn,ms){const id=++tid;timers.set(id,{fn,ms});return id},clearTimeout(id){timers.delete(id)},location:{search:'?mode='+mode,assign(){}},document:{getElementById:get,querySelectorAll:()=>tabs,querySelector:()=>({addEventListener(){}})},AF_CONFIG:{registrationReady:ready,recoveryReady:true},AF:{client:{auth},current:async()=>({is_admin:false}),callback:()=>'/auth-callback.html',notify:(el,text)=>el.textContent=text,message:e=>e.message}});
 return {get,tabs,timers,calls:()=>calls,submit:()=>get('auth-form').onsubmit({preventDefault(){}})};
}
const closed=setup();assert.equal(closed.get('auth-form').hidden,true);assert.equal(closed.get('auth-submit').disabled,true);assert.doesNotMatch(closed.get('auth-status').textContent,/prepared/i);await closed.submit();assert.equal(closed.calls(),0);
for(const mode of ['signin','recovery']){const x=setup(mode);assert.equal(x.get('auth-form').hidden,false);assert.equal(x.get('auth-submit').disabled,false)}
const fail=setup('signup',true,async()=>({error:Error('Delivery failed')}));await fail.submit();assert.equal(fail.get('auth-submit').disabled,false);assert.equal(fail.get('auth-submit')['aria-busy'],'false');assert.equal(fail.get('auth-status').textContent,'Delivery failed');assert.ok(fail.tabs.every(x=>!x.disabled));
const hung=setup('signup',true,()=>new Promise(()=>{}));const pending=hung.submit();await Promise.resolve();assert.equal(hung.get('auth-submit')['aria-busy'],'true');assert.ok(hung.tabs.every(x=>x.disabled));assert.equal(hung.calls(),1);await hung.submit();assert.equal(hung.calls(),1);const timeout=[...hung.timers.values()].find(x=>x.ms===35000);timeout.fn();await pending;assert.equal(hung.get('auth-submit').disabled,false);assert.equal(hung.get('auth-submit').textContent,'Create account');assert.match(hung.get('auth-status').textContent,/took too long/);
let options,abortObserved=false;const networkTimers=[];
vm.runInNewContext(readFileSync('dist/auth-client.js','utf8'),{window:{supabase:{createClient:(u,k,o)=>(options=o,{})}},AF_CONFIG:{url:'https://example.invalid',key:'public-fixture'},location:{pathname:'/login.html',search:''},URLSearchParams,AbortController,setTimeout(fn){networkTimers.push(fn);return 1},clearTimeout(){},fetch:(input,init)=>new Promise((resolve,reject)=>init.signal.addEventListener('abort',()=>{abortObserved=true;reject(Error('aborted'))}))});
const network=options.global.fetch('https://example.invalid');networkTimers[0]();await assert.rejects(network,/took too long/);assert.equal(abortObserved,true);
console.log('PASS: closed signup does not collect details or send requests; recovery stays usable; failures and timeouts restore controls; duplicate submissions blocked; hanging fetch is aborted.');
