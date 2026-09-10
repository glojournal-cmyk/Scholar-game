
/* Lux et Labor — RF7 final editorial controller.
   Academic marking/mastery/XP engines remain in their dedicated modules. */
(()=>{
'use strict';
const q=(s,r=document)=>r.querySelector(s);
const qa=(s,r=document)=>[...r.querySelectorAll(s)];
const A='./assets/rf7/';

const OUTFITS=Object.freeze({
  'school-uniform':'outfit_default_complete.webp',
  'rose-academy':'outfit_rose_academy_complete.webp',
  'garden-athletics':'outfit_garden_athletics_complete.webp',
  'scholar-athletics':'outfit_scholar_athletics_complete.webp',
  'midnight-track':'outfit_midnight_track_complete.webp',
  'noir-academy':'outfit_noir_academy_complete.webp',
  'onyx-prefect':'outfit_onyx_prefect_complete.webp',
  'midnight-atelier':'outfit_midnight_atelier_complete.webp'
});

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
  forma:'final_game_forma.webp',mosaic:'final_game_mosaic.webp',
  verbum:'final_game_verbum.webp',manuscript:'final_game_manuscript.webp'
});

function hour(){return new Date().getHours()}
function isEvening(){const h=hour(); return h<7 || h>=18}

function setSceneVars(){
  const root=document.documentElement;
  root.style.setProperty('--rf7-home-scene',`url("${A}${isEvening()?'raising_study_evening.webp':'raising_study_day.webp'}")`);
  root.style.setProperty('--rf7-wardrobe-scene',`url("${A}${isEvening()?'raising_study_evening.webp':'raising_study_day.webp'}")`);
}

function completeOutfit(id){
  const img=q('#wardrobeScholarImage'); if(!img)return;
  const file=OUTFITS[id]||OUTFITS['school-uniform'];
  img.src=A+file;
  img.dataset.outfit=id;
  const canvas=q('#avatarCanvas');
  if(canvas){
    canvas.dataset.outfit=id;
    const scene={
      'school-uniform':'raising_study_day.webp',
      'rose-academy':'raising_conservatory.webp',
      'garden-athletics':'raising_garden.webp',
      'scholar-athletics':'raising_garden_variant.webp',
      'midnight-track':'raising_study_evening.webp',
      'noir-academy':'raising_library.webp',
      'onyx-prefect':'raising_observatory.webp',
      'midnight-atelier':'raising_study_evening_variant.webp'
    }[id] || 'raising_study_day.webp';
    canvas.style.backgroundImage=`url("${A}${scene}")`;
  }
}

function outfitIdFrom(el){
  if(!el)return '';
  return el.dataset.outfitId||el.dataset.id||el.getAttribute('data-outfit')||'';
}

function subjectKey(){
  const title=(q('#subjectTitle')?.textContent||'').trim().toLowerCase();
  return ['latin','french','biology','chemistry','physics','english'].find(x=>title.startsWith(x))||'';
}
function currentSubjectTab(){
  const active=q('#subjectScreen .subject-tabs [data-subject-tab].active');
  return active?.dataset.subjectTab||'learn';
}
function updateSubjectHero(){
  const key=subjectKey(); if(!key)return;
  const img=q('#subjectScreen .rf4-subject-art img'); if(!img)return;
  const tab=currentSubjectTab();
  let src=(SUBJECT_TAB_ART[key]&&SUBJECT_TAB_ART[key][tab])||SUBJECT_ART[key];
  if(src) img.src=src;
  img.alt=key.charAt(0).toUpperCase()+key.slice(1)+' study illustration';
  const paper=q('#subjectContent');
  if(paper){
    const scene=(key==='physics'||key==='chemistry')?'raising_observatory_variant.webp':
      key==='biology'?'raising_conservatory_variant.webp':'raising_library_variant.webp';
    paper.style.setProperty('--rf7-subject-paper-scene',`url("${A}${scene}")`);
  }
}

function cardSubject(card){
  const raw=((q('h3,h2,strong',card)?.textContent)||card.textContent||'').toLowerCase();
  return ['latin','french','biology','chemistry','physics','english'].find(k=>raw.includes(k))||'';
}
function decorateStudy(){
  qa('#studyScreen .study-card').forEach(card=>{
    const key=cardSubject(card); if(!key)return;
    let img=q('img.rf7-study-art',card);
    if(!img){
      img=document.createElement('img');
      img.className='rf7-study-art';
      img.decoding='async'; img.loading='lazy'; img.alt='';
      card.prepend(img);
    }
    img.src=SUBJECT_ART[key]||'';
    card.dataset.rf7Subject=key;
  });
}

function fixHomeScholar(){
  const home=q('#homeScholarImage');
  if(home && !home.dataset.rf7Locked){
    home.src=A+OUTFITS['school-uniform'];
    home.dataset.rf7Locked='1';
  }
  const overview=q('#scholarOverviewImage');
  if(overview){
    overview.src=A+OUTFITS['school-uniform'];
  }
}

function ensureQuickPlay(){
  // Keep generated content; guarantee "See all games" actually reaches Latin Games.
  const see=q('#seeAllGames');
  if(see && !see.dataset.rf7Bound){
    see.dataset.rf7Bound='1';
    see.addEventListener('click',()=>{
      q('[data-global-route="study"]')?.click();
      setTimeout(()=>{
        // choose Latin card if available, then Play tab
        const latin=qa('#studyScreen .study-card').find(c=>cardSubject(c)==='latin');
        latin?.click();
        setTimeout(()=>q('#subjectScreen [data-subject-tab="play"]')?.click(),80);
      },60);
    });
  }
}

function decorateGameCards(){
  qa('[data-gamev2-start]').forEach(btn=>{
    const id=btn.dataset.gamev2Start;
    const img=q('img',btn);
    if(img && GAME_ART[id]) img.src=GAME_ART[id];
  });
}

function profileIntegrity(){
  // RF7 profile hero is source HTML inside the profile pane. Never append to a tab button.
  const hero=q('#scholarScreen [data-scholar-pane="profile"] > .rf7-profile-hero');
  if(hero && hero.parentElement?.matches('button')) hero.remove();
}

function semanticTabs(){
  qa('#scholarScreen [data-scholar-tab]').forEach(b=>{
    b.setAttribute('aria-controls',`scholar-${b.dataset.scholarTab}`);
  });
  qa('#scholarScreen [data-scholar-pane]').forEach(p=>{
    p.id=`scholar-${p.dataset.scholarPane}`;
  });
}

function markBody(){document.body.classList.add('rf7-ready')}

function refresh(){
  setSceneVars();
  fixHomeScholar();
  decorateStudy();
  updateSubjectHero();
  decorateGameCards();
  ensureQuickPlay();
  profileIntegrity();
  semanticTabs();
}

document.addEventListener('DOMContentLoaded',()=>{
  markBody(); refresh();
  setTimeout(()=>{
    const selected=q('#scholarScreen [data-outfit-id].active,#scholarScreen [data-outfit].active');
    const saved=outfitIdFrom(selected)||q('#avatarCanvas')?.dataset.outfit||q('#wardrobeScholarImage')?.dataset.outfit||'school-uniform';
    completeOutfit(OUTFITS[saved]?saved:'school-uniform');
  },0);

  const mo=new MutationObserver(muts=>{
    let relevant=false;
    for(const m of muts){
      if(m.type==='childList'||m.type==='characterData'){relevant=true;break}
    }
    if(relevant) requestAnimationFrame(()=>{decorateStudy();updateSubjectHero();decorateGameCards();fixHomeScholar();});
  });
  mo.observe(document.body,{subtree:true,childList:true,characterData:true});
});

document.addEventListener('click',e=>{
  const outfit=e.target.closest('[data-outfit-id],[data-outfit]');
  const oid=outfitIdFrom(outfit);
  if(oid && OUTFITS[oid]) requestAnimationFrame(()=>completeOutfit(oid));

  if(e.target.closest('#subjectScreen [data-subject-tab]')){
    setTimeout(updateSubjectHero,20);
  }
  if(e.target.closest('[data-global-route="subject"],.study-card')){
    setTimeout(updateSubjectHero,40);
  }
});

window.RF7=Object.freeze({
  outfits:OUTFITS,
  subjectArt:SUBJECT_ART,
  refresh,
  setOutfit:completeOutfit
});
})();
