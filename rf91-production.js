
(function(){
'use strict';

const PREF_KEY='scholarsGarden.rf91.preferences';
const qs=(s,r=document)=>r.querySelector(s);
const qsa=(s,r=document)=>[...r.querySelectorAll(s)];
const A='./assets/rf8/';

const SUBJECT_ART=Object.freeze({
  latin:'rf2_subject_latin.webp',
  french:'rf2_subject_french.webp',
  biology:'rf2_subject_biology.webp',
  chemistry:'rf2_subject_chemistry.webp',
  physics:'rf2_subject_physics.webp',
  english:A+'english_literature_hero.webp'
});
const SUBJECT_TAB_ART=Object.freeze({
  french:{learn:'rf3_french_lesson.webp',practice:'rf3_french_practice.webp',play:'rf3_french_vocab.webp',progress:'rf3_french_mastery.webp'},
  biology:{learn:'rf3_biology_lesson.webp',practice:'rf3_biology_practice.webp',play:'rf3_biology_microscopy.webp',progress:'rf3_biology_mastery.webp'},
  chemistry:{learn:'rf5_chemistry_practical.webp',practice:'rf5_chemistry_practice.webp',play:'rf5_chemistry_lab.webp',progress:'rf5_chemistry_reaction.webp'},
  physics:{learn:'rf5_physics_motion.webp',practice:'rf5_physics_practice.webp',play:'rf5_physics_night.webp',progress:'rf5_physics_observatory.webp'}
});

function subjectKey(){
  const title=(qs('#subjectTitle')?.textContent||'').trim().toLowerCase();
  return ['latin','french','biology','chemistry','physics','english'].find(x=>title.startsWith(x))||'';
}
function currentSubjectTab(){
  return qs('#subjectScreen [data-subject-tab].active')?.dataset.subjectTab||
         qs('#subjectScreen [data-subject-tab][aria-selected="true"]')?.dataset.subjectTab||'learn';
}
function decorateSubject(){
  const key=subjectKey(); if(!key)return;
  const img=qs('#subjectScreen .rf4-subject-art img');
  if(!img)return;
  const tab=currentSubjectTab();
  img.src=(SUBJECT_TAB_ART[key]&&SUBJECT_TAB_ART[key][tab])||SUBJECT_ART[key]||'';
  img.alt=`${key[0].toUpperCase()+key.slice(1)} study illustration`;
}

function cardSubject(card){
  const raw=((qs('h3,h2,strong',card)?.textContent)||card.textContent||'').toLowerCase();
  return ['latin','french','biology','chemistry','physics','english'].find(k=>raw.includes(k))||'';
}
function cardTrack(card){
  const b=qs('[data-open-subject]',card);
  return b?.dataset.track||'current';
}
function actionAvailable(subject,track,tab){
  if(track==='current'){
    if(['latin','french','english'].includes(subject)) return false;
    if(['biology','chemistry','physics'].includes(subject)) return tab==='learn'||tab==='progress';
  }
  if(track==='foundation'){
    if(['latin','french','biology'].includes(subject)) return ['learn','practice','progress'].includes(tab)||(subject==='latin'||subject==='french')&&tab==='play';
    if(['chemistry','physics'].includes(subject)) return ['learn','practice','progress'].includes(tab);
  }
  return false;
}
function addStudyActions(card,subject,track){
  if(qs('.rf91-study-actions',card))return;
  const existing=qs('.card-action',card);
  if(existing) existing.classList.add('rf91-legacy-card-action');
  const rail=document.createElement('div');
  rail.className='rf91-study-actions';
  rail.setAttribute('aria-label',`${subject} study actions`);
  [['learn','Learn'],['practice','Practise'],['play','Play'],['progress','Progress']].forEach(([tab,label])=>{
    const b=document.createElement('button');
    b.type='button';
    b.className='rf91-subject-action';
    b.textContent=label;
    b.dataset.studyAction=tab;
    b.dataset.studySubject=subject;
    b.dataset.studyTrack=track;
    const ok=actionAvailable(subject,track,tab);
    b.disabled=!ok;
    if(!ok)b.title='Not available for this course yet';
    rail.appendChild(b);
  });
  card.appendChild(rail);
}
function decorateStudy(){
  qsa('#studyScreen .study-card').forEach(card=>{
    const key=cardSubject(card); if(!key)return;
    let img=qs('img.rf91-study-art',card);
    if(!img){
      img=document.createElement('img');
      img.className='rf91-study-art'; img.decoding='async'; img.loading='lazy'; img.alt='';
      card.prepend(img);
    }
    img.src=SUBJECT_ART[key]||'';
    card.dataset.rf91Subject=key;
    addStudyActions(card,key,cardTrack(card));
  });
}

function loadPrefs(){
  const fallback={sound:true,music:false,notifications:true,reducedMotion:false};
  try{
    const newer=JSON.parse(localStorage.getItem(PREF_KEY)||'{}');
    const older=JSON.parse(localStorage.getItem('scholarsGarden.rf9.preferences')||'{}');
    return Object.assign(fallback,older,newer);
  }catch{return fallback}
}
function savePrefs(p){try{localStorage.setItem(PREF_KEY,JSON.stringify(p))}catch{}}
function applyPrefs(){
  const p=loadPrefs();
  document.documentElement.classList.toggle('rf91-reduced-motion',!!p.reducedMotion);
  const map={rf9SoundToggle:'sound',rf9MusicToggle:'music',rf9NotificationsToggle:'notifications',rf9MotionToggle:'reducedMotion'};
  Object.entries(map).forEach(([id,key])=>{const el=document.getElementById(id);if(el)el.checked=!!p[key]});
}
function bindPrefs(){
  const map={rf9SoundToggle:'sound',rf9MusicToggle:'music',rf9NotificationsToggle:'notifications',rf9MotionToggle:'reducedMotion'};
  Object.entries(map).forEach(([id,key])=>{
    const el=document.getElementById(id);if(!el||el.dataset.rf91Bound)return;
    el.dataset.rf91Bound='1';
    el.addEventListener('change',()=>{const p=loadPrefs();p[key]=!!el.checked;savePrefs(p);applyPrefs()});
  });
}
function syncScholarArt(){
  const selected=window.ScholarAssets?.selectedOutfit?.();
  const id=selected?.id||'school-uniform';
  const asset=id==='school-uniform'?'./scholar_master_uniform.png':selected?.asset||'./scholar_master_uniform.png';
  ['homeScholarImage','scholarOverviewImage','wardrobeScholarImage'].forEach(x=>{
    const img=document.getElementById(x);
    if(img){img.src=asset;img.alt=`Scholar wearing ${selected?.name||'Tiffin School Uniform'}`;}
  });
}
function selectStudyYear(year,scroll=false){
  const current=year!=='foundation';
  qsa('[data-v04-year]').forEach(b=>{
    const on=b.dataset.v04Year===(current?'current':'foundation');
    b.setAttribute('aria-pressed',String(on));
    b.classList.toggle('active',on);
  });
  const currentBand=qs('#studyScreen .study-band:not(.foundation-band)');
  const foundationBand=qs('#studyScreen .foundation-band');
  if(currentBand)currentBand.hidden=!current;
  if(foundationBand)foundationBand.hidden=current;
  try{sessionStorage.setItem('scholarsGarden.studyYear',current?'current':'foundation')}catch{}
  if(scroll)qs('#studyScreen .study-band:not([hidden])')?.scrollIntoView({block:'start',behavior:'smooth'});
}
function bindStudyYear(){
  qsa('[data-v04-year]').forEach(b=>{
    if(b.dataset.rf91Bound)return;b.dataset.rf91Bound='1';
    b.addEventListener('click',()=>selectStudyYear(b.dataset.v04Year,true));
  });
  let remembered='current';
  try{remembered=sessionStorage.getItem('scholarsGarden.studyYear')||'current'}catch{}
  selectStudyYear(remembered,false);
}
function bindStudyActions(){
  if(document.documentElement.dataset.rf91StudyActionsBound)return;
  document.documentElement.dataset.rf91StudyActionsBound='1';
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-study-action]');
    if(!b)return;
    e.preventDefault();e.stopPropagation();
    if(b.disabled)return;
    const {studySubject:subject,studyTrack:track,studyAction:tab}=b.dataset;
    if(window.LuxApp?.goSubject) await window.LuxApp.goSubject(subject,track,tab);
  },true);
}
function enhanceProfile(){
  const install=document.getElementById('rf9InstallApp');
  let deferred=null;
  window.addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;if(install)install.disabled=false});
  if(install&&!install.dataset.rf91Bound){
    install.dataset.rf91Bound='1';
    install.disabled=false;
    install.addEventListener('click',async()=>{
      if(deferred){deferred.prompt();await deferred.userChoice;deferred=null;return}
      window.LuxApp?.toast?.('Use your browser’s Install App / Add to Home Screen option.');
    });
  }
}
function improveAria(){
  qsa('[data-global-route]').forEach(b=>b.setAttribute('aria-current',b.classList.contains('active')?'page':'false'));
  qsa('[data-subject-tab]').forEach(b=>b.setAttribute('role','tab'));
  qsa('.quick-play-card strong,.training-access-card h3').forEach(el=>el.setAttribute('title',el.textContent.trim()));
}
let pending=false;
function refresh(){
  if(pending)return;pending=true;
  requestAnimationFrame(()=>{
    pending=false;
    decorateStudy();decorateSubject();syncScholarArt();improveAria();bindStudyYear();bindPrefs();
  });
}
function init(){
  document.body.dataset.visualBuild='rf9.1';
  bindStudyActions();
  bindStudyYear();
  bindPrefs();
  applyPrefs();
  enhanceProfile();
  refresh();
  document.addEventListener('scholar:wardrobe-change',refresh);
  document.addEventListener('click',e=>{
    if(e.target.closest('#subjectScreen [data-subject-tab], [data-global-route], [data-scholar-tab]'))setTimeout(refresh,0);
  });
  window.addEventListener('hashchange',refresh);
  new MutationObserver(ms=>{
    if(ms.some(m=>m.type==='childList' || m.type==='characterData'))refresh();
  }).observe(document.body,{subtree:true,childList:true,characterData:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
