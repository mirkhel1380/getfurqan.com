import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
function setup(reply){
 const fields=Object.fromEntries(Object.entries({name:'Synthetic reader',email:'fixture@example.invalid',subject:'Website feedback',message:'A synthetic message for a reversible test.',website:''}).map(([k,value])=>[k,{value,disabled:false}]));
 let handler,resets=0,seq=0;const calls=[],timers=new Map();const form={elements:fields,reportValidity:()=>true,querySelectorAll:()=>Object.values(fields),addEventListener(type,fn){if(type==='submit')handler=fn},reset(){resets++;for(const f of Object.values(fields))f.value='';}};
 const button={disabled:false,textContent:'Send message',setAttribute(k,v){this[k]=v}};const status={hidden:true,textContent:'',setAttribute(){},classList:{toggle(){}}};
 const document={getElementById:id=>({'contact-form':form,'contact-submit':button,'contact-status':status}[id])};
 vm.runInNewContext(fs.readFileSync('dist/contact.js','utf8'),{window:{AF:{client:{}},AFI18n:{language:'prs'}},AF:{client:{rpc:async(name,args)=>{calls.push({name,args});return reply(args,calls.length)}}},document,crypto:{randomUUID:()=>`00000000-0000-4000-8000-${String(++seq).padStart(12,'0')}`},setTimeout(fn){const id=timers.size+1;timers.set(id,fn);return id},clearTimeout(id){timers.delete(id)}});
 return {fields,button,status,calls,timers,resets:()=>resets,submit:()=>handler({preventDefault(){}})};
}
const ok=setup(async a=>({data:{ok:true,reference:a.p_request_id},error:null}));await ok.submit();assert.equal(ok.calls[0].name,'af_contact_submit');assert.equal(ok.calls[0].args.p_language,'prs');assert.equal(ok.resets(),1);assert.match(ok.status.textContent,/received/);assert.equal(ok.button.disabled,false);
const retry=setup(async(a,n)=>n===1?{error:Error('network')}:{data:{ok:true,reference:a.p_request_id}});await retry.submit();assert.equal(retry.resets(),0);assert.equal(retry.fields.message.value,'A synthetic message for a reversible test.');assert.match(retry.status.textContent,/could not be confirmed/);await retry.submit();assert.equal(retry.calls[0].args.p_request_id,retry.calls[1].args.p_request_id);assert.equal(retry.resets(),1);
const invalid=setup(async()=>{throw Error('should not run')});invalid.fields.message.value='short';await invalid.submit();assert.equal(invalid.calls.length,0);assert.match(invalid.status.textContent,/Please check/);
const rate=setup(async()=>({error:Error('Too many messages. Please try again later')}));await rate.submit();assert.match(rate.status.textContent,/Too many/);assert.equal(rate.resets(),0);
const hung=setup(()=>new Promise(()=>{}));const pending=hung.submit();await Promise.resolve();await hung.submit();assert.equal(hung.calls.length,1);assert.equal(hung.button.disabled,true);[...hung.timers.values()][0]();await pending;assert.equal(hung.button.disabled,false);assert.equal(hung.resets(),0);assert.ok(Object.values(hung.fields).every(x=>!x.disabled));
console.log('PASS: confirmed contact receipt, preserved fields on failure, idempotent retry, validation, rate-limit feedback, timeout recovery and duplicate-send prevention.');
