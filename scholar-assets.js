(function(){
'use strict';

const A=Object.freeze({
  master:'scholar_master_uniform.png',
  home:Object.freeze({
    idle:'scholar_idle.png',
    ready:'scholar_ready.png',
    thinking:'scholar_thinking.png',
    success:'scholar_success.png',
    welcome:'scholar_welcome.png',
    rewardUnlock:'scholar_reward_unlock.png',
    reading:'scholar_reading_notes.png',
    unfinished:'scholar_unfinished.png',
    confident:'scholar_confident.png',
    resting:'scholar_resting.png'
  }),
  outfits:Object.freeze([
    {id:'school-uniform',name:'Tiffin School Uniform',asset:'outfit_school_uniform.png',unlock:{type:'always'}},
    {id:'winter-scholar',name:'Winter Scholar',asset:'outfit_winter_scholar.png',unlock:{type:'studyDays',value:3}},
    {id:'summer-scholar',name:'Summer Scholar',asset:'outfit_summer_scholar.png',unlock:{type:'studyDays',value:7}},
    {id:'casual-study',name:'Casual Study',asset:'outfit_casual_study.png',unlock:{type:'scholarXP',value:100}},
    {id:'library-scholar',name:'Library Scholar',asset:'outfit_library_scholar.png',unlock:{type:'scholarXP',value:250}},
    {id:'latin-scholar',name:'Latin Scholar',asset:'outfit_latin_scholar.png',unlock:{type:'subjectXP',subject:'latin',value:250}},
    {id:'french-scholar',name:'French Scholar',asset:'outfit_french_scholar.png',unlock:{type:'subjectXP',subject:'french',value:250}},
    {id:'reward-cardigan',name:'Scholar Reward Cardigan',asset:'outfit_reward_cardigan.png',unlock:{type:'scholarXP',value:400}},
    {id:'achievement',name:'Achievement Outfit',asset:'outfit_achievement.png',unlock:{type:'dualSubjectXP',subjects:['latin','french'],valueEach:300}},
    {id:'prestige',name:'Prestige Scholar',asset:'outfit_prestige.png',unlock:{type:'scholarXP',value:1500}},
    {id:'rose-academy',name:'Rose Academy Cardigan',asset:'outfit_rose_academy.png',category:'seasonal',source:'user-upload',unlock:{type:'always'}},
    {id:'garden-athletics',name:'Garden Athletics',asset:'outfit_garden_athletics.png',category:'athletics',source:'user-upload',unlock:{type:'always'}},
    {id:'scholar-athletics',name:'Scholar Athletics',asset:'outfit_scholar_athletics.png',category:'athletics',source:'user-upload',unlock:{type:'always'}},
    {id:'midnight-track',name:'Midnight Track',asset:'outfit_midnight_track.png',category:'athletics',source:'user-upload',unlock:{type:'always'}},
    {id:'noir-academy',name:'Noir Academy',asset:'outfit_noir_academy.png',category:'prestige',source:'user-upload',unlock:{type:'always'}},
    {id:'onyx-prefect',name:'Onyx Prefect',asset:'outfit_onyx_prefect.png',category:'prestige',source:'user-upload',unlock:{type:'always'}},
    {id:'midnight-atelier',name:'Midnight Atelier',asset:'outfit_midnight_atelier.png',category:'prestige',source:'user-upload',unlock:{type:'always'}}
  ]),
  study:Object.freeze({
    latinLearn:'study_latin_textbook.png',
    frenchLearn:'study_french_notebook.png',
    biologyLearn:'study_biology_book.png',
    writing:'study_writing_notebook.png',
    vocabReview:'study_flashcards.png',
    dailyPlan:'study_planner.png',
    worksheet:'study_worksheet.png',
    readyGeneral:'study_pen_and_book.png',
    bookStack:'study_book_stack.png',
    pointing:'study_pointing.png'
  }),
  emotions:Object.freeze({
    neutral:'emotion_neutral.png',
    happy:'emotion_happy.png',
    excited:'emotion_excited.png',
    proud:'emotion_proud.png',
    thoughtful:'emotion_thoughtful.png',
    worried:'emotion_worried.png',
    sleepy:'emotion_sleepy.png',
    determined:'emotion_determined.png',
    shyPleased:'emotion_shy_pleased.png',
    curious:'emotion_curious.png'
  }),
  rewards:Object.freeze({
    exactVisualMappings:Object.freeze({
      'ink-pot':{interactionAsset:'reward_interaction_ink_pot.png',use:['unlock celebration','reward detail']},
      'study-books':{interactionAsset:'reward_interaction_book_stack.png',use:['unlock celebration','reward detail']},
      'ivy-pot':{interactionAsset:'reward_interaction_plant.png',use:['unlock celebration','reward detail']}
    }),
    generalCelebrationAssets:Object.freeze({
      ribbon:'reward_interaction_ribbon.png',
      medal:'reward_interaction_medal.png',
      laurel:'reward_interaction_laurel.png',
      letter:'reward_interaction_letter.png',
      mastery:'reward_interaction_proud_book.png',
      prestige:'reward_interaction_classical_ornament.png',
      quill:'reward_interaction_quill.png'
    }),
    missingStandaloneItemArt:Object.freeze(['desk-lamp','bronze-stylus','wax-tablet','fountain-pen','lavender-vase','scholars-globe','golden-lexicon'])
  })
});

function growthState(){
  try{return window.LuxGrowth?.snapshot?.()||null}catch{return null}
}
function dailyState(){
  try{return window.DailyPlan?.status?.()||null}catch{return null}
}
function baseHomeState(){
  const d=dailyState();
  if(!d)return 'idle';
  if(d.total>0&&d.done>=d.total)return 'success';
  const due=(d.tasks||[]).some(t=>String(t.reason||'').toLowerCase().includes('due review'));
  if(due)return 'thinking';
  const active=(d.tasks||[]).some(t=>(t.progress?.value||0)<(t.progress?.target||0));
  return active?'ready':'idle';
}
function outfitUnlocked(item,g=growthState()){
  if(!item||!g)return false;
  const u=item.unlock||{type:'always'};
  if(u.type==='always')return true;
  if(u.type==='studyDays')return (g.studyDays||0)>=u.value;
  if(u.type==='scholarXP')return (g.total||0)>=u.value;
  if(u.type==='subjectXP')return (g.subjectTotals?.[u.subject]||0)>=u.value;
  if(u.type==='dualSubjectXP')return (u.subjects||[]).every(s=>(g.subjectTotals?.[s]||0)>=u.valueEach);
  return false;
}
function unlockRequirement(item){
  const u=item?.unlock||{type:'always'};
  if(u.type==='always')return 'Always available';
  if(u.type==='studyDays')return `${u.value} study days`;
  if(u.type==='scholarXP')return `${u.value.toLocaleString('en-GB')} Scholar XP`;
  if(u.type==='subjectXP')return `${u.value.toLocaleString('en-GB')} ${u.subject[0].toUpperCase()+u.subject.slice(1)} XP`;
  if(u.type==='dualSubjectXP')return `${u.valueEach.toLocaleString('en-GB')} ${u.subjects.map(s=>s[0].toUpperCase()+s.slice(1)).join(' + ')} XP each`;
  return 'Locked';
}
function wardrobeState(){
  try{return window.LuxGrowth?.load?.()?.wardrobe||{}}catch{return {}}
}
function normalizeOutfitId(id){
  return !id||id==='starter'?'school-uniform':id;
}
function selectedOutfit(){
  const id=normalizeOutfitId(wardrobeState().outfit);
  return A.outfits.find(x=>x.id===id)||A.outfits[0];
}
function homeAsset(){
  // Outfit PNGs are wardrobe previews. Until aligned avatar layers are enabled,
  // keep Home/Overview on a complete Scholar render instead of showing a headless outfit.
  return A.home[baseHomeState()]||A.home.idle;
}
function rewardAsset(id){
  return A.rewards.exactVisualMappings[id]?.interactionAsset||null;
}
function homeReactionAsset(name){
  return A.home[name]||null;
}
function dueCount(subject){
  try{
    if(subject==='biology')return Number(window.BiologyY8?.dueCount?.())||0;
    if(subject==='latin'||subject==='french')return Number(window.MasterY8?.dueCount?.(subject))||0;
  }catch{}
  return 0;
}
function subjectPose(subject,tab='learn'){
  if(tab==='learn'){
    if(subject==='latin')return A.study.latinLearn;
    if(subject==='french')return A.study.frenchLearn;
    if(subject==='biology')return A.study.biologyLearn;
    return A.study.readyGeneral;
  }
  if(tab==='practice')return dueCount(subject)>0?A.emotions.thoughtful:A.study.worksheet;
  if(tab==='progress')return A.emotions.proud;
  if(tab==='play')return A.emotions.determined;
  return A.emotions.neutral;
}
function preloadCurrentHome(){
  const src=homeAsset();
  if(!src||typeof Image==='undefined')return;
  const img=new Image();img.decoding='async';img.src=src;
}

window.ScholarAssets=Object.freeze({
  manifest:A,
  growthState,dailyState,baseHomeState,outfitUnlocked,unlockRequirement,
  normalizeOutfitId,selectedOutfit,homeAsset,homeReactionAsset,rewardAsset,subjectPose,preloadCurrentHome
});
})();
