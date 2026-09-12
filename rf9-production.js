
(function(){
'use strict';

const PREF_KEY='scholarsGarden.rf9.preferences';
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];

const A='./assets/rf8/';
const SUBJECT_ART=Object.freeze({
  latin:'rf2_subject_latin.webp',french:'rf2_subject_french.webp',biology:'rf2_subject_biology.webp',
  chemistry:'rf2_subject_chemistry.webp',physics:'rf2_subject_physics.webp',english:A+'english_literature_hero.webp'
});
const SUBJECT_TAB_ART=Object.freeze({
  french:{learn:'rf3_french_lesson.webp',practice:'rf3_french_practice.webp',play:'rf3_french_vocab.webp',progress:'rf3_french_mastery.webp'},
  biology:{learn:'rf3_biology_lesson.webp',practice:'rf3_biology_practice.webp',play:'rf3_biology_microscopy.webp',progress:'rf3_biology_mastery.webp'},
  chemistry:{learn:'rf5_chemistry_practical.webp',practice:'rf5_chemistry_practice.webp',play:'rf5_chemistry_lab.webp',progress:'rf5_chemistry_reaction.webp'},
  physics:{learn:'rf5_physics_motion.webp',practice:'rf5_physics_practice.webp',play:'rf5_physics_night.webp',progress:'rf5_physics_observatory.webp'}
});
const OUTFIT_SCENE=Object.freeze({
  'school-uniform':'raising_study_day.webp','rose-academy':'raising_conservatory.webp',
  'garden-athletics':'raising_garden.webp','scholar-athletics':'raising_garden_variant.webp',
  'midnight-track':'raising_study_evening.webp','noir-academy':'raising_library.webp',
  'onyx-prefect':'raising_observatory.webp','midnight-atelier':'raising_study_evening_variant.webp'
});
function subjectKey(){
  const title=(qs('#subjectTitle')?.textContent||'').trim().toLowerCase();
  return ['latin','french','biology','chemistry','physics','english'].find(x=>title.startsWith(x))||'';
}
function currentSubjectTab(){return qs('#subjectScreen [data-subject-tab].active')?.dataset.subjectTab||'learn'}
function decorateSubject(){
  const key=subjectKey();if(!key)return;
  const img=qs('#subjectScreen .rf4-subject-art img');
  if(img){
    const tab=currentSubjectTab();
    img.src=(SUBJECT_TAB_ART[key]&&SUBJECT_TAB_ART[key][tab])||SUBJECT_ART[key]||'';
    img.alt=`${key[0].toUpperCase()+key.slice(1)} study illustration`;
  }
}
function cardSubject(card){
  const raw=((qs('h3,h2,strong',card)?.textContent)||card.textContent||'').toLowerCase();
  return ['latin','french','biology','chemistry','physics','english'].find(k=>raw.includes(k))||'';
}
function decorateStudy(){
  qsa('#studyScreen .study-card').forEach(card=>{
    const key=cardSubject(card);if(!key)return;
    let img=qs('img.rf9-study-art',card);
    if(!img){img=document.createElement('img');img.className='rf9-study-art';img.decoding='async';img.loading='lazy';img.alt='';card.prepend(img)}
    img.src=SUBJECT_ART[key]||'';
    card.dataset.rf9Subject=key;
  });
}
function syncScholarArt(){
  const selected=window.ScholarAssets?.selectedOutfit?.();
  const id=selected?.id||'school-uniform';
  const asset=id==='school-uniform'?'./scholar_master_uniform.png':selected?.asset||'./scholar_master_uniform.png';
  ['homeScholarImage','scholarOverviewImage','wardrobeScholarImage'].forEach(x=>{
    const img=document.getElementById(x);if(img){img.src=asset;img.alt=`Scholar wearing ${selected?.name||'Tiffin School Uniform'}`;}
  });
  const canvas=document.getElementById('avatarCanvas');
  if(canvas){
    canvas.style.backgroundImage=`url("${A}${OUTFIT_SCENE[id]||(new Date().getHours()>=18?'raising_study_evening.webp':'raising_study_day.webp')}")`;
  }
}
let rf9RefreshPending=false;
function refreshPresentation(){
  if(rf9RefreshPending)return;rf9RefreshPending=true;
  requestAnimationFrame(()=>{rf9RefreshPending=false;decorateStudy();decorateSubject();syncScholarArt()});
}


function loadPrefs(){
  try{return Object.assign({sound:true,music:false,notifications:true,reducedMotion:false},JSON.parse(localStorage.getItem(PREF_KEY)||'{}'))}
  catch{return {sound:true,music:false,notifications:true,reducedMotion:false}}
}
function savePrefs(p){try{localStorage.setItem(PREF_KEY,JSON.stringify(p))}catch{}}
function applyPrefs(){
  const p=loadPrefs();
  document.documentElement.classList.toggle('rf9-reduced-motion',!!p.reducedMotion);
  const map={rf9SoundToggle:'sound',rf9MusicToggle:'music',rf9NotificationsToggle:'notifications',rf9MotionToggle:'reducedMotion'};
  Object.entries(map).forEach(([id,key])=>{const el=document.getElementById(id);if(el)el.checked=!!p[key]});
}
function bindPrefs(){
  const map={rf9SoundToggle:'sound',rf9MusicToggle:'music',rf9NotificationsToggle:'notifications',rf9MotionToggle:'reducedMotion'};
  Object.entries(map).forEach(([id,key])=>{
    const el=document.getElementById(id); if(!el)return;
    el.addEventListener('change',()=>{const p=loadPrefs();p[key]=!!el.checked;savePrefs(p);applyPrefs()});
  });
}
function setScene(){
  const h=new Date().getHours();
  const scene=qs('.rf4-scholar-scene');
  if(scene){
    scene.style.backgroundImage=`linear-gradient(90deg,rgba(248,243,233,.08),rgba(248,243,233,0)),url("./assets/rf8/${h>=18||h<7?'raising_study_evening.webp':'raising_study_day.webp'}")`;
  }
}
function enforceTiffinDefault(){
  const master='./scholar_master_uniform.png';
  const ids=['homeScholarImage','scholarOverviewImage','wardrobeScholarImage'];
  ids.forEach(id=>{
    const img=document.getElementById(id);
    if(!img)return;
    if(id==='wardrobeScholarImage'){
      const state=window.LuxGrowth?.load?.();
      const outfit=window.ScholarAssets?.normalizeOutfitId?.(state?.wardrobe?.outfit||'school-uniform');
      if(outfit==='school-uniform') img.src=master;
    }else if(!img.getAttribute('src')||/outfit_default_complete/.test(img.getAttribute('src'))) img.src=master;
  });
}
function enhanceProfile(){
  const install=document.getElementById('rf9InstallApp');
  let deferred=null;
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e; if(install)install.disabled=false});
  if(install){
    install.disabled=false;
    install.addEventListener('click',async()=>{
      if(deferred){deferred.prompt();await deferred.userChoice;deferred=null;return}
      window.LuxApp?.toast?.('Use your browser’s Install App / Add to Home Screen option.');
    });
  }
}
function labelNavigation(){
  qsa('[data-global-route]').forEach(b=>{
    b.addEventListener('click',()=>requestAnimationFrame(()=>{
      const route=b.dataset.globalRoute;
      qsa('.global-nav [data-global-route]').forEach(x=>x.classList.toggle('active',x.dataset.globalRoute===route));
    }));
  });
}
function subjectTabAria(){
  qsa('[data-subject-tab]').forEach(b=>b.setAttribute('role','tab'));
}
function init(){
  document.body.dataset.visualBuild='rf9';
  setScene();
  enforceTiffinDefault();
  refreshPresentation();
  applyPrefs();bindPrefs();enhanceProfile();labelNavigation();subjectTabAria();
  document.addEventListener('scholar:wardrobe-change',refreshPresentation);
  document.addEventListener('click',e=>{if(e.target.closest('#subjectScreen [data-subject-tab]'))setTimeout(refreshPresentation,0)});
  window.addEventListener('hashchange',refreshPresentation);
  new MutationObserver(ms=>{if(ms.some(m=>m.type==='childList'||m.type==='characterData'))refreshPresentation()})
    .observe(document.body,{subtree:true,childList:true,characterData:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
