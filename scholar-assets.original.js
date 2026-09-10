(function(){
'use strict';
const A=Object.freeze({"master":"assets/scholar/master/scholar_master_uniform.png","home":{"idle":"assets/scholar/home/scholar_idle.png","ready":"assets/scholar/home/scholar_ready.png","thinking":"assets/scholar/home/scholar_thinking.png","success":"assets/scholar/home/scholar_success.png","welcome":"assets/scholar/home/scholar_welcome.png","rewardUnlock":"assets/scholar/home/scholar_reward_unlock.png","reading":"assets/scholar/home/scholar_reading_notes.png","unfinished":"assets/scholar/home/scholar_unfinished.png","confident":"assets/scholar/home/scholar_confident.png","resting":"assets/scholar/home/scholar_resting.png"},"outfits":[{"id":"school-uniform","name":"Tiffin School Uniform","asset":"assets/scholar/outfits/outfit_school_uniform.png","unlock":{"type":"always"}},{"id":"winter-scholar","name":"Winter Scholar","asset":"assets/scholar/outfits/outfit_winter_scholar.png","unlock":{"type":"studyDays","value":3}},{"id":"summer-scholar","name":"Summer Scholar","asset":"assets/scholar/outfits/outfit_summer_scholar.png","unlock":{"type":"studyDays","value":7}},{"id":"casual-study","name":"Casual Study","asset":"assets/scholar/outfits/outfit_casual_study.png","unlock":{"type":"scholarXP","value":100}},{"id":"library-scholar","name":"Library Scholar","asset":"assets/scholar/outfits/outfit_library_scholar.png","unlock":{"type":"scholarXP","value":250}},{"id":"latin-scholar","name":"Latin Scholar","asset":"assets/scholar/outfits/outfit_latin_scholar.png","unlock":{"type":"subjectXP","subject":"latin","value":250}},{"id":"french-scholar","name":"French Scholar","asset":"assets/scholar/outfits/outfit_french_scholar.png","unlock":{"type":"subjectXP","subject":"french","value":250}},{"id":"reward-cardigan","name":"Scholar Reward Cardigan","asset":"assets/scholar/outfits/outfit_reward_cardigan.png","unlock":{"type":"scholarXP","value":400}},{"id":"achievement","name":"Achievement Outfit","asset":"assets/scholar/outfits/outfit_achievement.png","unlock":{"type":"dualSubjectXP","subjects":["latin","french"],"valueEach":300}},{"id":"prestige","name":"Prestige Scholar","asset":"assets/scholar/outfits/outfit_prestige.png","unlock":{"type":"scholarXP","value":1500}}],"rewards":{"exactVisualMappings":{"ink-pot":{"interactionAsset":"assets/scholar/reward-interactions/reward_interaction_ink_pot.png","use":["unlock celebration","reward detail"]},"study-books":{"interactionAsset":"assets/scholar/reward-interactions/reward_interaction_book_stack.png","use":["unlock celebration","reward detail"]},"ivy-pot":{"interactionAsset":"assets/scholar/reward-interactions/reward_interaction_plant.png","use":["unlock celebration","reward detail"]}},"generalCelebrationAssets":{"ribbon":"assets/scholar/reward-interactions/reward_interaction_ribbon.png","medal":"assets/scholar/reward-interactions/reward_interaction_medal.png","laurel":"assets/scholar/reward-interactions/reward_interaction_laurel.png","letter":"assets/scholar/reward-interactions/reward_interaction_letter.png","mastery":"assets/scholar/reward-interactions/reward_interaction_proud_book.png","prestige":"assets/scholar/reward-interactions/reward_interaction_classical_ornament.png","quill":"assets/scholar/reward-interactions/reward_interaction_quill.png"},"missingStandaloneItemArt":["desk-lamp","bronze-stylus","wax-tablet","fountain-pen","lavender-vase","scholars-globe","golden-lexicon"],"important":"The supplied pack contains character-with-reward interaction renders, not standalone room-object cutouts. Do not place these full-character images as room furniture. Use them for unlock celebration/detail screens only."}});

function growthState(){
  try{return window.LuxGrowth?.snapshot?.()||null}catch{return null}
}
function dailyState(){
  try{return window.DailyPlan?.status?.()||null}catch{return null}
}
function baseHomeState(){
  const d=dailyState();
  if(!d)return 'idle';
  if(d.total>0 && d.done>=d.total)return 'success';
  const due=(d.tasks||[]).some(t=>String(t.reason||'').toLowerCase().includes('due review'));
  if(due)return 'thinking';
  const active=(d.tasks||[]).some(t=>(t.progress?.value||0)<(t.progress?.target||0));
  return active?'ready':'idle';
}
function outfitUnlocked(item,g){
  if(!item||!g)return false;
  const u=item.unlock||{type:'always'};
  if(u.type==='always')return true;
  if(u.type==='studyDays')return (g.studyDays||0)>=u.value;
  if(u.type==='scholarXP')return (g.total||0)>=u.value;
  if(u.type==='subjectXP')return (g.subjectTotals?.[u.subject]||0)>=u.value;
  if(u.type==='dualSubjectXP')return (u.subjects||[]).every(s=>(g.subjectTotals?.[s]||0)>=u.valueEach);
  return false;
}
function wardrobeState(){
  try{return window.LuxGrowth?.load?.()?.wardrobe||{}}catch{return {}}
}
function selectedOutfit(){
  const w=wardrobeState();
  const id=w.outfit==='starter'?'school-uniform':(w.outfit||'school-uniform');
  return A.outfits.find(x=>x.id===id)||A.outfits[0];
}
function homeAsset(){
  const outfit=selectedOutfit();
  if(outfit && outfit.id!=='school-uniform')return outfit.asset;
  return A.home[baseHomeState()]||A.home.idle;
}
window.ScholarAssets=Object.freeze({
  manifest:A,
  growthState,dailyState,baseHomeState,outfitUnlocked,selectedOutfit,homeAsset
});
})();