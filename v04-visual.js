
(()=>{
'use strict';

const SCENES=Object.freeze({
 home:'final_home_scholar.webp',
 study:'v04_study_hub_hero.webp',
 garden:'final_garden_main.webp',
 scholar:'v04_scholar_profile_hero.webp',
 subject:{
  latin:'final_subject_latin.webp',
  french:'final_subject_french.webp',
  biology:'final_subject_biology.webp',
  chemistry:'final_subject_chemistry.webp',
  physics:'final_subject_physics.webp'
 },
 tab:{
  latin:{learn:'final_subject_latin.webp',practice:'v04_latin_practice_hero.webp',progress:'v04_latin_progress_hero.webp',play:'v04_latin_games_hero.webp'},
  french:{learn:'final_subject_french.webp',practice:'final_french_scholar.webp',progress:'v04_french_progress_hero.webp',play:'final_subject_french.webp'},
  biology:{learn:'final_subject_biology.webp',practice:'final_biology_scholar.webp',progress:'v04_biology_progress_hero.webp',play:'final_subject_biology.webp'},
  chemistry:{learn:'final_subject_chemistry.webp',practice:'final_subject_chemistry.webp',progress:'final_subject_chemistry.webp',play:'final_subject_chemistry.webp'},
  physics:{learn:'final_subject_physics.webp',practice:'final_subject_physics.webp',progress:'final_subject_physics.webp',play:'final_subject_physics.webp'}
 }
});

const subjectNames=['latin','french','biology','chemistry','physics'];

function cssUrl(file){return `url("./${file}")`}
function setScreenHero(id,file){
 const el=document.getElementById(id);
 if(el&&file)el.style.setProperty('--v04-hero-image',cssUrl(file));
}
function detectStudyCards(){
 document.querySelectorAll('#studyScreen .study-card').forEach(card=>{
   const title=(card.querySelector('h3')?.textContent||'').trim().toLowerCase();
   const subject=subjectNames.find(s=>title.startsWith(s));
   if(!subject)return;
   card.dataset.v04Subject=subject;
   card.style.setProperty('--v04-card-image',cssUrl(SCENES.subject[subject]));
 });
}
function setYear(mode){
 const current=document.querySelector('#studyScreen .study-band:not(.foundation-band)');
 const foundation=document.querySelector('#studyScreen .foundation-band');
 if(current)current.classList.toggle('v04-year-hidden',mode!=='current');
 if(foundation)foundation.classList.toggle('v04-year-hidden',mode!=='foundation');
 document.querySelectorAll('[data-v04-year]').forEach(b=>{
   const active=b.dataset.v04Year===mode;
   b.classList.toggle('active',active);
   b.setAttribute('aria-pressed',String(active));
 });
 try{sessionStorage.setItem('scholarGardenV04StudyYear',mode)}catch{}
}
function home(){
 const el=document.getElementById('homeScreen');if(!el)return;
 el.dataset.v04='home';
 // Keep the dynamic Scholar full-render asset visible on Home so equipped outfits still matter.
 setScreenHero('homeScreen',SCENES.home);
}
function study(){
 const el=document.getElementById('studyScreen');if(!el)return;
 el.dataset.v04='study';
 setScreenHero('studyScreen',SCENES.study);
 detectStudyCards();
 let saved='current';try{saved=sessionStorage.getItem('scholarGardenV04StudyYear')||'current'}catch{}
 setYear(saved==='foundation'?'foundation':'current');
}
function subject(subject,track,tab='learn'){
 const el=document.getElementById('subjectScreen');if(!el)return;
 el.dataset.v04Subject=subject;
 el.dataset.v04Track=track;
 el.dataset.v04Tab=tab;
 const file=SCENES.tab[subject]?.[tab]||SCENES.subject[subject];
 if(file)el.style.setProperty('--v04-hero-image',cssUrl(file));
}
function garden(){
 const el=document.getElementById('gardenScreen');if(!el)return;
 el.dataset.v04='garden';
 // Academic/growth stage logic still controls #gardenImage; this background is decorative only.
 setScreenHero('gardenScreen',SCENES.garden);
}
function scholar(tab='wardrobe'){
 const el=document.getElementById('scholarScreen');if(!el)return;
 el.dataset.v04='scholar';el.dataset.v04ScholarTab=tab;
 setScreenHero('scholarScreen',SCENES.scholar);
}

document.addEventListener('click',e=>{
 const year=e.target.closest('[data-v04-year]');
 if(year){e.preventDefault();setYear(year.dataset.v04Year)}
});

window.V04Visual=Object.freeze({SCENES,home,study,subject,garden,scholar,setYear});
})();
