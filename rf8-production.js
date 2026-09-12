/* Lux et Labor — RF8 stable presentation controller.
   Academic marking, mastery, XP, review and question engines remain isolated
   in their dedicated modules. This file only coordinates presentation art. */
(()=>{
'use strict';

const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
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

const GAME_ART=Object.freeze({
  forma:'final_game_forma.webp',
  mosaic:'final_game_mosaic.webp',
  verbum:'final_game_verbum.webp',
  manuscript:'final_game_manuscript.webp'
});

const OUTFIT_SCENE=Object.freeze({
  'school-uniform':'raising_study_day.webp',
  'rose-academy':'raising_conservatory.webp',
  'garden-athletics':'raising_garden.webp',
  'scholar-athletics':'raising_garden_variant.webp',
  'midnight-track':'raising_study_evening.webp',
  'noir-academy':'raising_library.webp',
  'onyx-prefect':'raising_observatory.webp',
  'midnight-atelier':'raising_study_evening_variant.webp'
});

function isEvening(){
  const h=new Date().getHours();
  return h<7||h>=18;
}

function setSceneVars(){
  const root=document.documentElement;
  const base=isEvening()?'raising_study_evening.webp':'raising_study_day.webp';
  root.style.setProperty('--rf8-home-scene',`url("${A}${base}")`);
  root.style.setProperty('--rf8-wardrobe-scene',`url("${A}${base}")`);
}

function selectedOutfit(){
  return window.ScholarAssets?.selectedOutfit?.()||null;
}

function setImg(img,src,alt){
  if(!img||!src)return;
  if(img.getAttribute('src')!==src) img.src=src;
  if(alt!==undefined) img.alt=alt;
}

function syncScholarArt(){
  const selected=selectedOutfit();
  const asset=selected?.asset||A+'outfit_default_complete.webp';
  const name=selected?.name||'Scholar uniform';
  setImg(q('#homeScholarImage'),asset,`Scholar wearing ${name}`);
  setImg(q('#scholarOverviewImage'),asset,`Scholar wearing ${name}`);
  setImg(q('#wardrobeScholarImage'),asset,`Scholar wearing ${name}`);

  const canvas=q('#avatarCanvas');
  if(canvas){
    const id=selected?.id||'school-uniform';
    canvas.dataset.outfit=id;
    canvas.dataset.selectedOutfit=id;
    const scene=OUTFIT_SCENE[id]||(isEvening()?'raising_study_evening.webp':'raising_study_day.webp');
    const bg=`url("${A}${scene}")`;
    if(canvas.style.backgroundImage!==bg) canvas.style.backgroundImage=bg;
  }
}

function subjectKey(){
  const title=(q('#subjectTitle')?.textContent||'').trim().toLowerCase();
  return ['latin','french','biology','chemistry','physics','english'].find(x=>title.startsWith(x))||'';
}

function currentSubjectTab(){
  return q('#subjectScreen [data-subject-tab].active')?.dataset.subjectTab||'learn';
}

function updateSubjectHero(){
  const key=subjectKey();
  if(!key)return;
  const img=q('#subjectScreen .rf4-subject-art img,#subjectScreen .rf8-subject-art img');
  if(img){
    const tab=currentSubjectTab();
    const src=(SUBJECT_TAB_ART[key]&&SUBJECT_TAB_ART[key][tab])||SUBJECT_ART[key];
    setImg(img,src,`${key[0].toUpperCase()+key.slice(1)} study illustration`);
  }
  const paper=q('#subjectContent');
  if(paper){
    const scene=(key==='physics'||key==='chemistry')?'raising_observatory_variant.webp':
      key==='biology'?'raising_conservatory_variant.webp':'raising_library_variant.webp';
    paper.style.setProperty('--rf8-subject-paper-scene',`url("${A}${scene}")`);
  }
}

function cardSubject(card){
  const raw=((q('h3,h2,strong',card)?.textContent)||card.textContent||'').toLowerCase();
  return ['latin','french','biology','chemistry','physics','english'].find(k=>raw.includes(k))||'';
}

function decorateStudy(){
  qa('#studyScreen .study-card').forEach(card=>{
    const key=cardSubject(card);
    if(!key)return;
    let img=q('img.rf8-study-art',card);
    if(!img){
      img=document.createElement('img');
      img.className='rf8-study-art';
      img.decoding='async';
      img.loading='lazy';
      img.alt='';
      card.prepend(img);
    }
    setImg(img,SUBJECT_ART[key]||'','');
    card.dataset.rf8Subject=key;
  });
}

function decorateGameCards(){
  qa('[data-gamev2-start]').forEach(btn=>{
    const src=GAME_ART[btn.dataset.gamev2Start];
    const img=q('img',btn);
    if(img&&src) setImg(img,src,img.alt||'');
  });
}

function profileIntegrity(){
  const pane=q('#scholarScreen [data-scholar-pane="profile"]');
  const hero=q('#scholarScreen .rf8-profile-hero');
  if(hero&&pane&&hero.parentElement!==pane) pane.prepend(hero);
}

function semanticTabs(){
  qa('#scholarScreen [data-scholar-tab]').forEach(b=>{
    const id=`scholar-${b.dataset.scholarTab}`;
    b.setAttribute('aria-controls',id);
  });
  qa('#scholarScreen [data-scholar-pane]').forEach(p=>{
    p.id=`scholar-${p.dataset.scholarPane}`;
  });
}

let refreshQueued=false;
function refresh(){
  if(refreshQueued)return;
  refreshQueued=true;
  requestAnimationFrame(()=>{
    refreshQueued=false;
    setSceneVars();
    syncScholarArt();
    decorateStudy();
    updateSubjectHero();
    decorateGameCards();
    profileIntegrity();
    semanticTabs();
  });
}

function init(){
  document.body.classList.add('rf8-ready');
  refresh();

  const mo=new MutationObserver(mutations=>{
    if(mutations.some(m=>m.type==='childList'||m.type==='characterData'||(m.type==='attributes'&&m.attributeName==='class'))){
      refresh();
    }
  });
  mo.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});

  document.addEventListener('scholar:wardrobe-change',refresh);
  window.addEventListener('hashchange',refresh);
  document.addEventListener('click',e=>{
    if(e.target.closest('#subjectScreen [data-subject-tab]')) setTimeout(refresh,0);
  });
}

document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init,{once:true}):init();

window.RF8=Object.freeze({
  refresh,
  subjectArt:SUBJECT_ART
});
})();
