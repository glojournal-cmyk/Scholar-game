(function(){
'use strict';

const KEY='scholarsGarden.audioPrefs.v1';
const DEFAULTS={sound:true,music:false,volume:0.42};

let ctx=null, master=null, musicTimer=null, musicStep=0;

function prefs(){
  try{return Object.assign({},DEFAULTS,JSON.parse(localStorage.getItem(KEY)||'{}'))}
  catch{return {...DEFAULTS}}
}
function save(next){
  localStorage.setItem(KEY,JSON.stringify(next));
  window.dispatchEvent(new CustomEvent('scholar-audio-prefs',{detail:next}));
}
function ensure(){
  if(ctx) return ctx;
  const Ctx=window.AudioContext||window.webkitAudioContext;
  if(!Ctx) return null;
  ctx=new Ctx();
  master=ctx.createGain();
  master.gain.value=prefs().volume;
  master.connect(ctx.destination);
  return ctx;
}
async function resume(){
  const c=ensure();
  if(c && c.state==='suspended'){
    try{await c.resume()}catch{}
  }
  return c;
}
function tone(freq=440,dur=.08,type='sine',gain=.05,delay=0){
  const p=prefs();
  if(!p.sound) return;
  const c=ensure(); if(!c||!master)return;
  const now=c.currentTime+delay;
  const osc=c.createOscillator();
  const g=c.createGain();
  osc.type=type;
  osc.frequency.setValueAtTime(freq,now);
  g.gain.setValueAtTime(.0001,now);
  g.gain.exponentialRampToValueAtTime(Math.max(.0001,gain),now+.012);
  g.gain.exponentialRampToValueAtTime(.0001,now+dur);
  osc.connect(g); g.connect(master);
  osc.start(now); osc.stop(now+dur+.03);
}
function chime(kind='tap'){
  const p=prefs(); if(!p.sound)return;
  resume();
  if(kind==='nav'){
    tone(330,.06,'sine',.028,0); tone(495,.08,'sine',.022,.045);
  }else if(kind==='confirm'){
    tone(392,.07,'triangle',.035,0); tone(523.25,.11,'triangle',.03,.055);
  }else if(kind==='reward'){
    tone(392,.09,'sine',.04,0); tone(523.25,.11,'sine',.035,.07); tone(659.25,.16,'sine',.03,.145);
  }else if(kind==='wrong'){
    tone(220,.09,'triangle',.028,0); tone(196,.12,'triangle',.025,.06);
  }else if(kind==='correct'){
    tone(523.25,.07,'sine',.038,0); tone(659.25,.09,'sine',.034,.045); tone(783.99,.13,'sine',.028,.095);
  }else{
    tone(420,.045,'sine',.022,0);
  }
}

function musicTick(){
  const p=prefs();
  if(!p.music){ stopMusic(); return; }
  const c=ensure(); if(!c||!master)return;
  const seq=[261.63,329.63,392,329.63,293.66,349.23,440,349.23];
  const f=seq[musicStep++%seq.length];
  const now=c.currentTime;
  const osc=c.createOscillator(), g=c.createGain(), filter=c.createBiquadFilter();
  osc.type='sine'; osc.frequency.value=f;
  filter.type='lowpass'; filter.frequency.value=900;
  g.gain.setValueAtTime(.0001,now);
  g.gain.exponentialRampToValueAtTime(.012,now+.05);
  g.gain.exponentialRampToValueAtTime(.0001,now+1.55);
  osc.connect(filter); filter.connect(g); g.connect(master);
  osc.start(now); osc.stop(now+1.6);
}
function startMusic(){
  const p=prefs();
  if(!p.music || musicTimer) return;
  resume();
  musicTick();
  musicTimer=setInterval(musicTick,1800);
}
function stopMusic(){
  if(musicTimer){clearInterval(musicTimer);musicTimer=null}
}
function setPref(key,value){
  const p=prefs(); p[key]=value; save(p);
  if(master) master.gain.value=p.volume;
  if(key==='music'){value?startMusic():stopMusic()}
}
function syncControls(){
  const p=prefs();
  const sound=document.getElementById('rf9SoundToggle');
  const music=document.getElementById('rf9MusicToggle');
  if(sound) sound.checked=!!p.sound;
  if(music) music.checked=!!p.music;
}
function bindControls(){
  const sound=document.getElementById('rf9SoundToggle');
  const music=document.getElementById('rf9MusicToggle');
  if(sound && !sound.dataset.audioBound){
    sound.dataset.audioBound='1';
    sound.addEventListener('change',()=>setPref('sound',sound.checked));
  }
  if(music && !music.dataset.audioBound){
    music.dataset.audioBound='1';
    music.addEventListener('change',()=>{
      setPref('music',music.checked);
      if(music.checked) resume().then(startMusic);
    });
  }
  syncControls();
}

document.addEventListener('pointerdown',()=>resume(),{once:true,capture:true});

document.addEventListener('click',e=>{
  const el=e.target.closest('button,[role="button"],a');
  if(!el)return;
  if(el.id==='rf9SoundToggle'||el.id==='rf9MusicToggle')return;

  const text=(el.textContent||'').toLowerCase();
  if(el.matches('[data-global-route],[data-v04-year],[data-subject-tab],[data-scholar-tab]')) chime('nav');
  else if(text.includes('correct')||text.includes('finish')||text.includes('complete')) chime('correct');
  else if(text.includes('reward')||text.includes('unlock')) chime('reward');
  else if(text.includes('check')||text.includes('submit')||text.includes('start')||text.includes('continue')||el.classList.contains('primary')) chime('confirm');
  else chime('tap');
},true);

const observer=new MutationObserver(()=>{
  bindControls();
  const toast=document.querySelector('.toast.show,.toast.visible,[role="status"].success,[role="alert"].success');
  if(toast){
    const t=(toast.textContent||'').toLowerCase();
    if(t.includes('correct')||t.includes('complete')||t.includes('earned')) chime('correct');
  }
});
observer.observe(document.documentElement,{subtree:true,childList:true,attributes:true,attributeFilter:['class']});

window.ScholarAudio=Object.freeze({
  prefs, setPref, chime, startMusic, stopMusic, resume
});

window.addEventListener('DOMContentLoaded',()=>{
  bindControls();
  if(prefs().music) startMusic();
});
})();