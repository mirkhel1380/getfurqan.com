import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const fields={'auth-password':{type:'password',value:'synthetic-fixture-only'},'new-password':{type:'password',value:'another-fixture-only'}};const events={};
const buttons=Object.keys(fields).map(id=>({hidden:true,attrs:{'aria-controls':id,'aria-pressed':'false'},setAttribute(k,v){this.attrs[k]=v},getAttribute(k){return this.attrs[k]},addEventListener(event,fn){this[event]=fn}}));const mode={addEventListener(type,fn){events.mode=fn}},form={addEventListener(type,fn){events.submit=fn}};
vm.runInNewContext(fs.readFileSync('dist/password-visibility.js','utf8'),{document:{getElementById:id=>fields[id],querySelectorAll:s=>s==='[data-password-toggle]'?buttons:s==='[data-mode]'?[mode]:[form]},window:{addEventListener(type,fn){events[type]=fn}}});
assert.ok(buttons.every(x=>!x.hidden));const value=fields['auth-password'].value;buttons[0].click();assert.equal(fields['auth-password'].type,'text');assert.equal(buttons[0].attrs['aria-label'],'Hide password');assert.equal(buttons[0].attrs['aria-pressed'],'true');assert.equal(fields['auth-password'].value,value);buttons[0].click();assert.equal(fields['auth-password'].type,'password');assert.equal(buttons[0].attrs['aria-label'],'Show password');
for(const kind of ['mode','submit','pagehide']){buttons.forEach(b=>b.click());events[kind]();assert.ok(Object.values(fields).every(x=>x.type==='password'));assert.ok(buttons.every(x=>x.attrs['aria-pressed']==='false'));}
console.log('PASS: password show/hide, accessible labels/state, preserved value, and remasking on mode change, submit and page exit.');
