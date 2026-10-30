'use strict';
(()=>{
 for(const root of document.querySelectorAll('[data-voice-search]')){
  const input=document.getElementById(root.dataset.voiceInput),button=root.querySelector('[data-voice-toggle]'),language=root.querySelector('select'),status=root.querySelector('[data-voice-status]');if(!input||!button||!language||!status)continue;
  const Recognition=window.SpeechRecognition||window.webkitSpeechRecognition,tr=s=>window.AFI18n?.translate(s)||s;let recognition=null,timer,message='';
  const say=s=>{message=s;status.textContent=tr(s)};
  const reset=()=>{clearTimeout(timer);recognition=null;button.setAttribute('aria-pressed','false');button.textContent=tr('Start voice search');language.disabled=false};
  const cancel=()=>{try{recognition?.abort()}catch{}reset()};
  if(!Recognition||!window.isSecureContext){button.disabled=true;say(!window.isSecureContext?'Voice search needs a secure HTTPS connection. You can still type your search.':'Voice search is not supported by this browser. You can still type your search.')}
  if(Recognition&&window.isSecureContext)button.disabled=false;
  button.onclick=()=>{
   if(recognition){try{recognition.stop()}catch{cancel()}return}
   const current=new Recognition();recognition=current;current.lang=language.value;current.continuous=false;current.interimResults=false;current.maxAlternatives=1;
   button.textContent=tr('Stop listening');button.setAttribute('aria-pressed','true');language.disabled=true;say('Allow the microphone, then say an Arabic or English word.');
   timer=setTimeout(()=>{cancel();say('Voice search timed out. Try again or type your search.')},25000);
   current.onstart=()=>{if(recognition!==current)return;clearTimeout(timer);timer=setTimeout(()=>{cancel();say('Voice search timed out. Try again or type your search.')},15000);say('Listening…')};
   current.onresult=e=>{if(recognition!==current)return;const text=e.results?.[0]?.[0]?.transcript?.trim();if(text){input.value=text.slice(0,input.maxLength>0?input.maxLength:120);input.dispatchEvent(new Event('input',{bubbles:true}));say('Check the recognized text, then choose Search.')}else say('No speech was recognized. Try again or type your search.')};
   current.onnomatch=()=>say('No speech was recognized. Try again or type your search.');
   current.onerror=e=>{if(recognition!==current)return;say(['not-allowed','service-not-allowed'].includes(e.error)?'Microphone access was not allowed. You can still type your search.':e.error==='network'?'The speech service could not connect. Try again or type your search.':'No speech was recognized. Try again or type your search.');reset()};
   current.onend=()=>{if(recognition===current)reset()};
   try{current.start()}catch{say('Voice search could not start. Try again or type your search.');reset()}
  };
  window.addEventListener('pagehide',cancel);document.addEventListener('visibilitychange',()=>{if(document.hidden)cancel()});document.addEventListener('af:languagechange',()=>{button.textContent=tr(recognition?'Stop listening':'Start voice search');status.textContent=tr(message)});
 }
})();
