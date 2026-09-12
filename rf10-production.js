
(function(){
'use strict';
const PREF_KEY='scholarsGarden.rf101.preferences';
const MIGRATION='scholarsGarden.rf10.tiffinDefaultMigrated';
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const ART={
  subjects:{
    latin:'rf2_subject_latin.webp',french:'rf2_subject_french.webp',biology:'rf2_subject_biology.webp',
    chemistry:'rf2_subject_chemistry.webp',physics:'rf2_subject_physics.webp',english:'./assets/rf8/english_literature_hero.webp'
  }
};
function subjectKey(){
  const t=(q('#subjectTitle')?.textContent||'').toLowerCase();
  return ['latin','french','biology','chemistry','physics','english'].find(x=>t.startsWith(x))||'';
}
function studySubject(card){
  const t=(q('h3,h2,strong',card)?.textContent||card.textContent||'').toLowerCase();
  return ['latin','french','biology','chemistry','physics','english'].find(x=>t.includes(x))||'';
}
function studyTrack(card){return q('[data-open-subject]',card)?.dataset.track||'current'}
function available(subject,track,tab){
  if(track==='current'){
    if(['biology','chemistry','physics'].includes(subject)) return tab==='learn'||tab==='progress';
    return false;
  }
  if(['latin','french'].includes(subject)) return ['learn','practice','play','progress'].includes(tab);
  if(subject==='biology') return ['learn','practice','progress'].includes(tab);
  if(['chemistry','physics'].includes(subject)) return ['learn','practice','progress'].includes(tab);
  return false;
}
function decorateStudy(){
  qa('#studyScreen .study-card').forEach(card=>{
    const s=studySubject(card); if(!s)return;
    let img=q('.rf91-study-art',card);
    if(!img){img=document.createElement('img');img.className='rf91-study-art';img.alt='';img.loading='lazy';img.decoding='async';card.prepend(img)}
    img.src=ART.subjects[s]||'';
    let rail=q('.rf91-study-actions',card);
    if(!rail){
      rail=document.createElement('div');rail.className='rf91-study-actions';card.appendChild(rail);
    }
    const tr=studyTrack(card);
    rail.innerHTML='';
    [['learn','Learn'],['practice','Practise'],['play','Play'],['progress','Progress']].forEach(([tab,label])=>{
      const b=document.createElement('button');b.type='button';b.className='rf91-subject-action';b.textContent=label;
      b.dataset.studyAction=tab;b.dataset.studySubject=s;b.dataset.studyTrack=tr;
      // Also expose the canonical app-router attributes. This means the central
      // router can always identify the exact subject/track/tab, even after a
      // previous French/Latin route has been active.
      b.dataset.openSubject=s;b.dataset.track=tr;b.dataset.openTab=tab;
      b.disabled=!available(s,tr,tab);if(b.disabled)b.title='Not available for this course yet';
      rail.appendChild(b);
    });
    q('.card-action',card)?.classList.add('rf91-legacy-card-action');
  });
}
function bindStudyActions(){
  if(document.documentElement.dataset.rf10StudyBound)return;
  document.documentElement.dataset.rf10StudyBound='1';
  document.addEventListener('click',async e=>{
    const b=e.target.closest('[data-study-action]');if(!b||b.disabled)return;
    e.preventDefault();e.stopImmediatePropagation();
    const subject=b.dataset.studySubject;
    const track=b.dataset.studyTrack||'current';
    const tab=b.dataset.studyAction||'learn';
    const ok=await window.LuxApp?.goSubject?.(subject,track,tab);
    if(!ok)console.error('[RF10.1] Study route failed',subject,track,tab);
  },true);
}
function selectYear(year,scroll=false){
  const foundation=year==='foundation';
  qa('[data-v04-year]').forEach(b=>{
    const on=b.dataset.v04Year===(foundation?'foundation':'current');
    b.classList.toggle('active',on);b.setAttribute('aria-pressed',String(on));
  });
  const current=q('#studyScreen .study-band:not(.foundation-band)'),found=q('#studyScreen .foundation-band');
  if(current)current.hidden=foundation;if(found)found.hidden=!foundation;
  try{sessionStorage.setItem('scholarsGarden.studyYear',foundation?'foundation':'current')}catch{}
  if(scroll)q('#studyScreen .study-band:not([hidden])')?.scrollIntoView({block:'start',behavior:'smooth'});
}
function bindYears(){
  qa('[data-v04-year]').forEach(b=>{
    if(b.dataset.rf10Bound)return;b.dataset.rf10Bound='1';
    b.addEventListener('click',()=>selectYear(b.dataset.v04Year,true));
  });
  let y='current';try{y=sessionStorage.getItem('scholarsGarden.studyYear')||'current'}catch{}
  selectYear(y,false);
}
function migrateTiffinDefault(){
  try{
    if(localStorage.getItem(MIGRATION))return;
    const s=window.LuxGrowth?.load?.();
    if(s){
      const snap=window.LuxGrowth?.snapshot?.();
      const fresh=(snap?.total||0)===0 && (snap?.studyDays||0)<=1;
      if(!s.wardrobe)s.wardrobe={};
      if(!s.wardrobe.outfit || s.wardrobe.outfit==='starter' || fresh){
        s.wardrobe.outfit='school-uniform';
        window.LuxGrowth.save(s);
      }
    }
    localStorage.setItem(MIGRATION,'1');
  }catch{}
}
function syncTiffin(){
  const selected=window.ScholarAssets?.selectedOutfit?.();
  const school=!selected||selected.id==='school-uniform';
  const asset=school?'./scholar_master_uniform.png':selected.asset;
  ['homeScholarImage','scholarOverviewImage','wardrobeScholarImage'].forEach(id=>{
    const img=document.getElementById(id);if(img){img.src=asset;img.alt=`Scholar wearing ${school?'Tiffin School Uniform':selected.name}`}
  });
}
function subjectArt(){
  const s=subjectKey();const img=q('#subjectScreen .rf4-subject-art img');if(img&&s){img.src=ART.subjects[s]||'';img.alt=`${s} study environment`}
}
function fixProfile(){
  const rows=qa('#scholarProfileData>div');
  const layer=rows.find(r=>(q('span',r)?.textContent||'').trim()==='Layer avatar');
  if(layer){q('span',layer).textContent='Scholar uniform';q('b',layer).textContent=window.ScholarAssets?.selectedOutfit?.()?.name||'Tiffin School Uniform'}
}
function loadPrefs(){
  const base={sound:true,music:false,notifications:true,reducedMotion:false};
  try{
    return Object.assign(base,JSON.parse(localStorage.getItem('scholarsGarden.rf9.preferences')||'{}'),JSON.parse(localStorage.getItem('scholarsGarden.rf91.preferences')||'{}'),JSON.parse(localStorage.getItem(PREF_KEY)||'{}'));
  }catch{return base}
}
function applyPrefs(){
  const p=loadPrefs();document.documentElement.classList.toggle('rf10-reduced-motion',!!p.reducedMotion);
  const map={rf9SoundToggle:'sound',rf9MusicToggle:'music',rf9NotificationsToggle:'notifications',rf9MotionToggle:'reducedMotion'};
  Object.entries(map).forEach(([id,k])=>{const el=document.getElementById(id);if(el)el.checked=!!p[k]});
}
function bindPrefs(){
  const map={rf9SoundToggle:'sound',rf9MusicToggle:'music',rf9NotificationsToggle:'notifications',rf9MotionToggle:'reducedMotion'};
  Object.entries(map).forEach(([id,k])=>{
    const el=document.getElementById(id);if(!el||el.dataset.rf10Pref)return;el.dataset.rf10Pref='1';
    el.addEventListener('change',()=>{const p=loadPrefs();p[k]=!!el.checked;try{localStorage.setItem(PREF_KEY,JSON.stringify(p))}catch{}applyPrefs()});
  });
}
function compactHome(){
  // prevent stale development copy from leaking into the polished shell
  const reward=q('#nextRewardArt img');
  if(reward){
    reward.loading='eager';
    const title=(q('#nextRewardTitle')?.textContent||q('#nextRewardName')?.textContent||'').toLowerCase();
    if(title.includes('ink pot')||title.includes('inkpot')){
      reward.src='./reward_interaction_ink_pot.png';
      reward.alt='Ink Pot';
    }
  }
}
function improveAria(){
  qa('[data-global-route]').forEach(b=>b.setAttribute('aria-current',b.classList.contains('active')?'page':'false'));
  qa('[data-subject-tab]').forEach(b=>b.setAttribute('role','tab'));
}
let scheduled=false;
function refresh(){
  if(scheduled)return;scheduled=true;
  requestAnimationFrame(()=>{
    scheduled=false;
    decorateStudy();subjectArt();syncTiffin();fixProfile();bindYears();bindPrefs();applyPrefs();compactHome();improveAria();
  });
}
function init(){
  document.body.dataset.visualBuild='rf10';
  migrateTiffinDefault();
  bindStudyActions();bindYears();bindPrefs();applyPrefs();refresh();
  document.addEventListener('click',e=>{
    if(e.target.closest('[data-global-route],[data-subject-tab],[data-scholar-tab],[data-collection-filter],[data-v04-year]'))setTimeout(refresh,40);
    if(e.target.closest('[data-study-action],[data-open-subject]'))requestAnimationFrame(()=>window.scrollTo({top:0,left:0,behavior:'auto'}));
  });
  document.addEventListener('scholar:wardrobe-change',()=>setTimeout(refresh,20));
  document.addEventListener('lux:growth',()=>setTimeout(refresh,20));
  window.addEventListener('hashchange',()=>setTimeout(refresh,20));
  new MutationObserver(ms=>{
    if(ms.some(m=>m.type==='childList'||m.type==='characterData'))refresh();
  }).observe(document.body,{childList:true,subtree:true,characterData:true});
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();
