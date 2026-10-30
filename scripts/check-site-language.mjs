import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const root=new URL('../dist/',import.meta.url),locales=['en','prs','ps','fa','de','nl','fr','it','ur','tr','es','pt','id'];
const packs=Object.fromEntries(locales.map(k=>[k,JSON.parse(fs.readFileSync(new URL('locales/'+k+'.json',root)))]));
const base=Object.keys(packs.en).sort();for(const code of locales){assert.deepEqual(Object.keys(packs[code]).sort(),base);assert.ok(Object.values(packs[code]).every(x=>typeof x==='string'&&x.length));}
const supplemental=JSON.parse(fs.readFileSync(new URL('../docs/interface-message-keys.json',import.meta.url)));
const placeholders=s=>[...s.matchAll(/\{(\w+)\}/g)].map(x=>x[1]).sort();
for(const code of locales)for(const key of supplemental){assert.ok(packs[code][key],`${code}: ${key}`);assert.deepEqual(placeholders(packs[code][key]),placeholders(key),`${code}: ${key}`);}
// Pure message tests, including async race, unavailable pack, persistence, and reversibility.
const changes=[],saved=new Map(),events=[];let blocked=null;
const html={nodeType:1,lang:'en',dir:'ltr',hasAttribute(){return false},closest(){return null}};
let walkNodes=[];
const document={readyState:'loading',documentElement:html,addEventListener(){},querySelectorAll(){return []},getElementById(){return null},createTreeWalker(){let i=0;return {nextNode(){return walkNodes[i++]||null}}},dispatchEvent(e){events.push(e)}};
const context={window:{},document,NodeFilter:{SHOW_ELEMENT:1,SHOW_TEXT:4},CustomEvent:class{constructor(type,options){this.type=type;this.detail=options.detail}},AbortSignal,localStorage:{setItem(k,v){saved.set(k,v)},getItem(k){return saved.get(k)}},fetch:async url=>{const key=url.match(/locales\/(.*?)\.json/)[1];if(key===blocked)throw Error('Offline');return {ok:true,json:async()=>packs[key]}},console};
vm.runInNewContext(fs.readFileSync(new URL('site-language.js',root),'utf8'),context);const api=context.window.AFI18n;
for(const code of locales){assert.equal(await api.select(code),true);assert.equal(api.language,code);assert.equal(saved.get('af-site-language'),code);assert.equal(html.lang,code);assert.equal(html.dir,['prs','ps','fa','ur'].includes(code)?'rtl':'ltr');assert.equal(api.translate('Read Quran'),packs[code]['Read Quran']);assert.equal(api.translate('Tafsir and word meanings'),code==='en'?'Tafsir and word meanings':packs[code]['Tafsir & words']);assert.equal(api.translate('← Previous'),code==='en'?'← Previous':'← '+packs[code].Previous);assert.equal(api.translate('Resend in 42s'),code==='en'?'Resend in 42s':packs[code]['Resend in {n}s'].replace('{n}','42'));assert.equal(api.translate('3 times'),code==='en'?'3 times':packs[code]['{n} times'].replace('{n}','3'));assert.equal(api.translate('قال رسول الله ﷺ'), 'قال رسول الله ﷺ');assert.equal(api.translate('دری — محمد انور بدخشانی'),'دری — محمد انور بدخشانی');}
await api.select('en');blocked='de';vm.runInNewContext(fs.readFileSync(new URL('site-language.js',root),'utf8'),context);const offline=context.window.AFI18n;assert.equal(await offline.select('de'),false);assert.equal(offline.language,'en');assert.equal(await api.select('x-unknown'),false);assert.equal(saved.get('af-site-language'),'en');
blocked=null;
// Regression: changing a counter or locale keeps references intact and restores English.
for(const code of locales){await api.select(code);for(const [key,values] of [
 ['Save verse {ref}',{ref:'2:255'}],['Mark verse {ref} as read today',{ref:'2:255'}],
 ['{n} unique verses marked today · goal {goal}. Only mark verses you have read.',{n:'3',goal:'7'}],
 ['Page {page} · Juz {juz} / Hizb {hizb}',{page:'2',juz:'1',hizb:'1'}],
 ['Covers {ref}',{ref:'1:1–1:7'}],['{n} of {goal} verses today',{n:'3',goal:'7'}],
 ['Play {iteration} of {repeat} · Verse {verse} of {total}',{iteration:'2',repeat:'3',verse:'4',total:'7'}]
 ]){const fill=s=>s.replace(/\{(\w+)\}/g,(_,k)=>values[k]);assert.equal(api.translate(fill(key)),fill(packs[code][key]),`${code}: ${key}`);}}
function element({source=false,ui=false,field=false,attrs={}}={}){return {nodeType:1,values:{...attrs},value:'My personal note: Save verse 2:255',matches(){return field},closest(selector){if(selector==='[data-af-interface]')return ui?this:null;if(selector==='[lang]')return source?this:html;if(selector.startsWith('script,style,svg'))return source||field?this:null;return null},hasAttribute(name){return (name==='data-af-interface'&&ui)||name in this.values},getAttribute(name){return this.values[name]},setAttribute(name,value){this.values[name]=value}};}
const source=element({source:true}),summary=element({source:true,ui:true}),field=element({field:true,attrs:{placeholder:'Write a thought or question to revisit…'}});
const sourceText={nodeType:3,nodeValue:'Read Quran',parentElement:source},summaryText={nodeType:3,nodeValue:'Translator notes',parentElement:summary};
walkNodes=[sourceText,summaryText,field];for(const code of ['prs','de','ps','en']){await api.select(code);assert.equal(sourceText.nodeValue,'Read Quran');assert.equal(summaryText.nodeValue,packs[code]['Translator notes']);assert.equal(field.values.placeholder,packs[code]['Write a thought or question to revisit…']);assert.equal(field.value,'My personal note: Save verse 2:255');}walkNodes=[];
let count=0;function files(dir){for(const entry of fs.readdirSync(dir,{withFileTypes:true})){const path=new URL(entry.name+(entry.isDirectory()?'/':''),dir);if(entry.isDirectory())files(path);else if(entry.name.endsWith('.html')){const s=fs.readFileSync(path,'utf8');count++;assert.equal((s.match(/site-language.js\?/g)||[]).length,1,path.href);assert.ok(s.includes('data-drawer-panel="languages"'),path.href);assert.ok(s.includes('data-site-language="en"'),path.href);assert.ok(s.includes('data-site-language="prs"'),path.href);assert.ok(s.includes('data-site-language="ps"'),path.href);assert.ok(!/All (other|13) languages/i.test(s),path.href);const section=s.match(/<section data-drawer-panel="languages"[\s\S]*?<\/section>/)[0];assert.ok(!section.includes('<a '),path.href);assert.ok(section.indexOf('data-site-language="en"')<section.indexOf('data-site-language="prs"'));assert.ok(section.indexOf('data-site-language="prs"')<section.indexOf('data-site-language="ps"'));}}}
files(root);console.log(`PASS: ${locales.length} interface message catalogs (${base.length} messages each), all ${count} pages wired, ordering, persistence, LTR/RTL, fallback, counter labels and unchanged source strings.`);
