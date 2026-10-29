import {readFileSync} from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const code=readFileSync('dist/auth-callback.js','utf8');
async function check(mode,{session=true,gate=true}={}){
 const els={};const button={disabled:false};let updated=0,cleaned=0;
 const get=id=>els[id]??=( {hidden:['reset-form','callback-link'].includes(id),value:'',textContent:'',href:'/login.html',classList:{toggle(){}},setAttribute(){},querySelector(){return button},reset(){}} );
 const context={URLSearchParams,location:{search:'?mode='+mode,hash:''},history:{replaceState(){cleaned++}},document:{getElementById:get},AF:{client:{auth:{getSession:async()=>({data:{session:session?{}:null}}),getUser:async()=>({data:{user:{}}}),updateUser:async()=>{updated++;return {error:null}}}},current:async()=>{if(!gate)throw Error('Email verification required');return {is_admin:true}},notify(el,text){el.textContent=text},message:e=>e.message}};
 await vm.runInNewContext(code,context);return {els,get,updated:()=>updated,cleaned:()=>cleaned,button};
}
for(const mode of ['invite','recovery']){const x=await check(mode);assert.equal(x.get('reset-form').hidden,false);assert.ok(x.cleaned()>0);x.get('new-password').value='not-a-real-user-password';x.get('confirm-password').value='different';await x.get('reset-form').onsubmit({preventDefault(){},target:x.get('reset-form')});assert.equal(x.updated(),0);x.get('confirm-password').value=x.get('new-password').value;await x.get('reset-form').onsubmit({preventDefault(){},target:x.get('reset-form')});assert.equal(x.updated(),1);assert.equal(x.get('reset-form').hidden,true);assert.equal(x.get('callback-link').href,'/account.html')}
for(const opts of [{session:false},{gate:false}]){const x=await check('invite',opts);assert.equal(x.get('reset-form').hidden,true);assert.equal(x.get('callback-link').hidden,false);assert.ok(x.cleaned()>0);await x.get('reset-form').onsubmit({preventDefault(){},target:x.get('reset-form')});assert.equal(x.updated(),0)}
const confirmed=await check('confirm');assert.equal(confirmed.get('reset-form').hidden,true);assert.equal(confirmed.get('callback-link').href,'/account.html');
console.log('PASS: verified invite/recovery setup, confirmation-only flow, expired/unverified denial, password mismatch rejection, no updates without verified session, callback URL cleanup.');
