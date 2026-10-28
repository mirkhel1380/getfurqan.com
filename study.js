'use strict';
const $=id=>document.getElementById(id),API='https://api.quran.com/api/v4',ENC='https://quranenc.com/api/v1';
const tafsirs={persian_saadi:{lang:'fa',dir:'rtl'},arabic_saadi:{lang:'ar',dir:'rtl'},urdu_saadi:{lang:'ur',dir:'rtl'},turkish_saadi:{lang:'tr',dir:'ltr'},indonesian_saadi:{lang:'id',dir:'ltr'},russian_saadi:{lang:'ru',dir:'ltr'},swahili_saadi:{lang:'sw',dir:'ltr'}};

Object.assign(tafsirs,{
 english_ibnkathir:{lang:'en',dir:'ltr',kind:'qf',resource:169,slug:'en-tafisr-ibn-kathir',title:'Ibn Kathir (Abridged)',author:'Hafiz Ibn Kathir · English abridged edition · Quran.Foundation'},
 bengali_zakaria_tafsir:{lang:'bn',dir:'ltr',kind:'qf',resource:166,slug:'bn-tafsir-abu-bakr-zakaria',title:'Tafsir Abu Bakr Zakaria',author:'Abu Bakr Zakaria · King Fahd Quran Printing Complex · Quran.Foundation'},
 ...Object.fromEntries([['french','fr','ltr'],['spanish','es','ltr'],['pashto','ps','rtl'],['chinese','zh','ltr'],['hindi','hi','ltr']].map(([key,lang,dir])=>[key+'_mokhtasar',{lang,dir,kind:'mukhtasar',title:'Al-Mukhtasar in Interpreting the Noble Quran',author:'Tafsir Center for Quranic Studies · translated edition · QuranEnc',version:'1.0.0'}]))
});
const publisherEditions={german_didi:{title:'Erläuterung des Koran (Tafsīr)',author:'Samir Mourad · Deutscher Informationsdienst über den Islam e.V. (DIdI)',url:'https://www.didi-info.de/tafsirdateien'},dutch_yaqeen:{title:'Tafsier van imam as-Saʿdiy',author:'‘Abd al-Rahman al-Sa‘di · Dutch edition published by Al-Yaqeen',url:'https://www.al-yaqeen.com/category/artikelen/boeken/tafsier-van-imam-as-sasupcsupdiy/'}};
function sourceLink(label,url,cls){const a=el('a',cls,label);a.href=url;a.target='_blank';a.rel='noopener';return a}
function publisherTafsir(key){const ed=publisherEditions[key],card=el('article','publisher-card');card.dataset.publisher=key;
 $('tafsir-title').textContent=ed.title;$('tafsir-author').textContent=ed.author;$('tafsir-note').textContent='Publisher original · This edition opens on the publisher’s website. Its full text is not reproduced inside Al Furqan.';$('tafsir-status').textContent='';$('tafsir-version').textContent='';$('tafsir-source').href=ed.url;$('tafsir-source').textContent='Publisher and original edition ↗';
 const c=chapters.find(c=>c.id===selected.chapter);card.append(el('span','eyebrow',key==='german_didi'?'DEUTSCH / GERMAN':'NEDERLANDS / DUTCH'),el('h3','',ed.title),el('p','',ed.author),el('p','current-passage','Your selected passage: '+c.name_simple+' · '+selected.chapter+':'+selected.verse));
 if(key==='german_didi'){card.append(el('p','','A 12-volume German tafsir compiled from classical sources, including al-Tabari and Ibn Kathir. DIdI publishes its revised PDF editions in its original library.'),sourceLink('Open DIdI’s published tafsir library ↗',ed.url,'button'),el('p','source-detail','The publisher lists the volumes and revision dates. Open the relevant volume and find surah '+selected.chapter+' and verse '+selected.verse+'. This link opens the complete library, not an individual verse.'));}
 else{const match=dutchTafsirLinks[selected.chapter];card.append(el('p','','Dutch explanations of selected surahs from As-Saadi’s tafsir, published by Al-Yaqeen. Each article covers a whole surah.'));
 if(match)card.append(sourceLink('Read this surah’s Dutch tafsir ↗',match.url,'button'),el('p','source-detail','Source article: '+match.title+'. This opens the surah explanation, including its surrounding context.'));
 else card.append(el('p','availability-note','No Dutch explanation for this surah is indexed here. Browse the publisher’s collection or choose a surah from the indexed list below.'));
 card.append(sourceLink('Browse Al-Yaqeen’s tafsir collection ↗',ed.url,'collection-link'));
 const details=el('details','publisher-index');details.append(el('summary','',Object.keys(dutchTafsirLinks).length+' indexed surahs'));const list=el('div','source-list');for(const [number,item] of Object.entries(dutchTafsirLinks).sort((a,b)=>Number(a[0])-Number(b[0])))list.append(sourceLink(item.title+' ↗',item.url));details.append(list);card.append(details);
 }$('tafsir-content').append(card);
}
function renderBlock(text,lang,dir,heading,type){const article=el('article','tafsir-block'),head=el('div','block-meta'),content=el('div','block-text');head.append(el('span','',heading),el('span','',type));content.lang=lang;content.dir=dir;renderSource(text,content);article.append(head,content,FurqanSpeech.controls(content,lang,'tafsir '+heading));$('tafsir-content').append(article)}

let chapters=[],selected={chapter:1,verse:1},verseSeq=0,tafsirSeq=0,meta={};
async function json(url){const r=await fetch(url,{signal:AbortSignal.timeout(20000)});if(!r.ok)throw Error('Source unavailable');return r.json()}
function el(tag,cls,value){const e=document.createElement(tag);if(cls)e.className=cls;if(value!==undefined)e.textContent=value;return e}
function plain(s){return new DOMParser().parseFromString(String(s),'text/html').body.textContent||''}
function renderSource(s,container){const d=new DOMParser().parseFromString(String(s),'text/html');function copy(from,to){for(const c of from.childNodes){if(c.nodeType===3){for(const part of c.textContent.split(/(﴿[^﴾]*﴾)/g)){if(part.startsWith('﴿')&&part.endsWith('﴾')){const q=el('span','quran-quote',part);q.lang='ar';q.dir='rtl';to.append(q)}else to.append(document.createTextNode(part))}}else if(c.nodeType===1&&!['SCRIPT','STYLE','IFRAME'].includes(c.tagName)){const tag=['P','BR','STRONG','EM','B','I','SUP','SUB','UL','OL','LI','BLOCKQUOTE','H1','H2','H3','H4'].includes(c.tagName)?(['H1','H2'].includes(c.tagName)?'h3':c.tagName.toLowerCase()):'span';const n=el(tag);copy(c,n);to.append(n)}}}copy(d.body,container)}
function bounds(){const c=chapters.find(c=>c.id===Number($('chapter').value));if(c){$('verse-number').max=c.verses_count;if(Number($('verse-number').value)>c.verses_count)$('verse-number').value=1}}
function navigation(){const c=chapters.find(c=>c.id===selected.chapter);$('verse-heading').textContent=c.name_simple;$('verse-reference').textContent=selected.chapter+':'+selected.verse;$('previous').disabled=selected.verse<=1;$('next').disabled=selected.verse>=c.verses_count;$('reader-link').href='/reader.html?verse='+encodeURIComponent(selected.chapter+':'+selected.verse);history.replaceState(null,'','?verse='+selected.chapter+':'+selected.verse)}
async function loadWords(){const id=++verseSeq,key=selected.chapter+':'+selected.verse,lang=$('word-language').value;$('arabic').textContent='';$('words').replaceChildren();$('verse-error').textContent='';$('words-status').textContent='Loading original text and word meanings…';$('retry-words').hidden=true;try{const d=await json(API+'/verses/by_key/'+key+'?words=true&language='+lang+'&word_fields=text_uthmani&fields=text_uthmani');if(id!==verseSeq)return;const v=d.verse;if(v?.verse_key!==key||!v.text_uthmani)throw Error('Mismatched verse');$('arabic').textContent=v.text_uthmani;const words=v.words?.filter(w=>w.char_type_name==='word');if(!words?.length)throw Error('Words unavailable');const expected=lang==='fa'?'persian':'english';if(words.some(w=>!w.text_uthmani||!w.translation?.text||w.translation.language_name!==expected))throw Error('Word language unavailable');for(const w of words){const card=el('div','word-card');const ar=el('span','word-arabic',w.text_uthmani);ar.lang='ar';ar.dir='rtl';ar.setAttribute('translate','no');const meaning=el('span','word-meaning',plain(w.translation.text));meaning.lang=lang;meaning.dir=lang==='fa'?'rtl':'ltr';card.append(el('span','word-position',String(w.position)),ar,meaning);$('words').append(card)}$('words-status').textContent=words.length+' words · '+(lang==='fa'?'Persian':'English')+' meanings';}catch{if(id===verseSeq){if(!$('arabic').textContent)$('verse-error').textContent='Arabic text could not be loaded.';$('words-status').textContent='Word meanings could not be loaded in this language. Retry or choose another language.';$('retry-words').hidden=false}}}
async function loadTafsir(){
 FurqanSpeech.stop();
 const id=++tafsirSeq,c=selected.chapter,v=selected.verse,key=$('tafsir-language').value,edition=tafsirs[key];
 $('tafsir-content').replaceChildren();$('retry-tafsir').hidden=true;
 history.replaceState(null,'','?verse='+c+':'+v+'&tafsir='+encodeURIComponent(key));
 if(publisherEditions[key]){publisherTafsir(key);$('tafsir-note').textContent+=' Device-voice playback is available only for text displayed in Al Furqan.';return}
 $('tafsir-title').textContent=edition.title||'As-Saadi’s tafsir';$('tafsir-author').textContent=edition.author||'By ‘Abd al-Rahman al-Sa‘di · original Arabic and translated editions';
 $('tafsir-note').textContent='Published explanation · Entries may cover one or several verses. The source range is shown with each entry. Persian is a Persian edition, rather than a separate Dari edition.';
 $('tafsir-status').textContent='Loading the published explanation…';$('tafsir-version').textContent=(meta[key]?.version||edition.version)?' · v'+(meta[key]?.version||edition.version):'';
 $('tafsir-source').href=edition.kind==='qf'?'https://quran.com/'+c+':'+v+'/tafsirs/'+edition.slug:'https://quranenc.com/en/browse/'+key+'/'+c;
 $('tafsir-source').textContent=$('tafsir-language').selectedOptions[0].textContent+' · '+(edition.kind==='qf'?'Quran.Foundation':'QuranEnc')+' ↗';
 try{
  if(edition.kind==='mukhtasar'){
   const d=await json(ENC+'/translation/aya/'+key+'/'+c+'/'+v);if(id!==tafsirSeq)return;const b=d.result;
   if(Number(b?.sura)!==c||Number(b.aya)!==v||!b.translation)throw Error('Mismatched explanation');
   renderBlock(b.translation,edition.lang,edition.dir,'Covers '+c+':'+v,'Al-Mukhtasar');
   if(b.footnotes)renderBlock(b.footnotes,edition.lang,edition.dir,'Notes for '+c+':'+v,'Source notes');
  }else if(edition.kind==='qf'){
   const d=await json(API+'/tafsirs/'+edition.slug+'/by_ayah/'+c+':'+v);if(id!==tafsirSeq)return;const b=d.tafsir,keys=Object.keys(b?.verses||{});
   if(Number(b?.resource_id)!==edition.resource||!b.text||!keys.includes(c+':'+v)||keys.some(k=>!/^\d{1,3}:\d{1,3}$/.test(k)))throw Error('Mismatched explanation');
   const refs=keys.sort((a,b)=>{const [ac,av]=a.split(':').map(Number),[bc,bv]=b.split(':').map(Number);return ac-bc||av-bv});
   renderBlock(b.text,edition.lang,edition.dir,'Covers '+refs[0]+(refs.length>1?'–'+refs.at(-1):''),edition.title);
  }else{
   const d=await json(ENC+'/tafsir/aya/'+key+'/'+c+'/'+v);if(id!==tafsirSeq)return;const blocks=d.result;
   if(!Array.isArray(blocks)||blocks.some(b=>Number(b.sura)!==c||Number(b.from_aya)>v||Number(b.to_aya)<v||!b.text))throw Error('Mismatched explanation');
   if(!blocks.length){$('tafsir-status').textContent='No explanation is available for this verse in the selected edition.';return}
   for(const b of blocks)renderBlock(b.text,edition.lang,edition.dir,'Covers '+c+':'+b.from_aya+(Number(b.to_aya)!==Number(b.from_aya)?'–'+c+':'+b.to_aya:''),b.type||'Source entry');
  }$('tafsir-status').textContent='';
 }catch{if(id===tafsirSeq){$('tafsir-status').textContent='This explanation could not be loaded. Retry or choose another edition.';$('retry-tafsir').hidden=false}}
}

function load(){navigation();$('page-status').textContent='';loadWords();loadTafsir()}
function chooseTab(kind,focus=false){for(const name of ['tafsir','words']){const active=name===kind;$(name+'-tab').setAttribute('aria-selected',String(active));$(name+'-tab').tabIndex=active?0:-1;$(name+'-panel').hidden=!active}if(focus)$(kind+'-tab').focus()}
for(const name of ['tafsir','words']){$(name+'-tab').onclick=()=>chooseTab(name);$(name+'-tab').onkeydown=e=>{if(['ArrowLeft','ArrowRight','Home','End'].includes(e.key)){e.preventDefault();chooseTab(e.key==='Home'?'tafsir':e.key==='End'?'words':name==='tafsir'?'words':'tafsir',true)}}}
$('chapter').onchange=()=>{$('verse-number').value=1;bounds()};$('passage-form').onsubmit=e=>{e.preventDefault();if(!$('passage-form').reportValidity())return;selected={chapter:Number($('chapter').value),verse:Number($('verse-number').value)};load()};for(const [id,step] of [['previous',-1],['next',1]])$(id).onclick=()=>{const c=chapters.find(c=>c.id===selected.chapter),v=selected.verse+step;if(v<1||v>c.verses_count)return;selected.verse=v;$('chapter').value=selected.chapter;$('verse-number').value=v;bounds();load()};$('tafsir-language').onchange=loadTafsir;$('word-language').onchange=loadWords;$('retry-tafsir').onclick=loadTafsir;$('retry-words').onclick=loadWords;
async function init(){$('retry-init').hidden=true;$('page-status').textContent='Connecting to the source…';try{const d=await json(API+'/chapters?language=en');if(!d.chapters?.length)throw Error();chapters=d.chapters;$('chapter').replaceChildren(...chapters.map(c=>new Option(c.id+'. '+c.name_simple,c.id)));const params=new URLSearchParams(location.search),requested=params.get('tafsir');if(tafsirs[requested]||publisherEditions[requested])$('tafsir-language').value=requested;const key=params.get('verse');if(/^\d{1,3}:\d{1,3}$/.test(key||'')){const [c,v]=key.split(':').map(Number),chapter=chapters.find(x=>x.id===c);if(chapter&&v>=1&&v<=chapter.verses_count)selected={chapter:c,verse:v}}$('chapter').value=selected.chapter;$('verse-number').value=selected.verse;bounds();$('chapter').disabled=$('open-verse').disabled=false;load();json(ENC+'/tafsirs/list').then(d=>{for(const e of d.tafsirs||[])meta[e.key]=e;const key=$('tafsir-language').value;$('tafsir-version').textContent=(meta[key]?.version||tafsirs[key]?.version)?' · v'+(meta[key]?.version||tafsirs[key]?.version):''}).catch(()=>{});}catch{$('page-status').textContent='Could not load the surah list. Please retry.';$('retry-init').hidden=false}}
$('retry-init').onclick=init;init();
