(function(){
'use strict';

const A=Object.freeze({
  laurel:'ui_v04_laurel_wreath.webp',
  scholarCrest:'ui_v04_scholar_crest.webp',
  lockCrest:'ui_v04_lock_crest.webp',
  rewardGem:'ui_v04_reward_gem_red.webp',
  compass:'ui_v04_compass_star.webp',
  nameplateSlim:'ui_v04_nameplate_slim.webp',
  nameplateOrnate:'ui_v04_nameplate_ornate.webp',
  leaf:'ui_v04_leaf.webp',
  flower:'ui_v04_flower.webp',
  success:'ui_v04_success_badge.webp',
  divider:'ui_divider_laurel.webp',
  corner:'ui_corner_flourish.webp',
  frame:'ui_frame_ornament.webp',
  seal:'ui_stamp_seal.webp',
  badgeLocked:'ui_badge_locked.webp',
  badgeUnlocked:'ui_badge_unlocked.webp',
  starReward:'ui_star_reward.webp',
  loading:'ui_loading_flower.webp',
  emptyBook:'ui_empty_state_book.webp',
  emptyGarden:'ui_empty_state_garden.webp'
});

function asset(name){return A[name]||''}

function getGrowth(){
  try{return window.LuxGrowth?.snapshot?.()||null}catch{return null}
}
function getPlan(){
  try{return window.DailyPlan?.status?.()||null}catch{return null}
}
function nextReward(g){
  if(!g)return {name:'Ink Pot'};
  const s=g.state||{},items=[
    ['ink-pot','Ink Pot',40],
    ['study-books','Study Books',250],
    ['golden-lexicon','Golden Lexicon',1500]
  ];
  const n=items.find(([id])=>!s.collectibles?.[id]);
  return n?{id:n[0],name:n[1],need:n[2]}:{id:null,name:'Flourishing Garden',need:g.total};
}
function syncJourney(){
  const g=getGrowth(),p=getPlan();
  const garden=document.getElementById('journeyGarden');
  const daily=document.getElementById('journeyDaily');
  const reward=document.getElementById('journeyReward');
  const headline=document.getElementById('journeyHeadline');
  if(g&&garden)garden.textContent=`Stage ${g.gardenStage}`;
  if(p&&daily)daily.textContent=`${p.done} / ${p.total}`;
  if(g&&reward)reward.textContent=nextReward(g).name;
  if(headline){
    if(!p||!p.total)headline.textContent='A quiet study day — choose one subject when you are ready.';
    else if(p.done>=p.total)headline.textContent='Daily Quest complete — your Scholar world has grown.';
    else {
      const left=Math.max(0,p.total-p.done);
      headline.textContent=`${left} ${left===1?'step':'steps'} left in today’s journey.`;
    }
  }
}

function decorateDynamic(){
  document.querySelectorAll('.training-access-card').forEach(card=>{
    if(card.querySelector('.v04-card-corner'))return;
    const img=document.createElement('img');
    img.src=asset('leaf');img.alt='';img.setAttribute('aria-hidden','true');img.className='v04-card-corner';
    card.appendChild(img);
  });
  document.querySelectorAll('.quick-play-card').forEach(card=>{
    if(card.querySelector('.v04-play-spark'))return;
    const img=document.createElement('img');
    img.src=asset('compass');img.alt='';img.setAttribute('aria-hidden','true');img.className='v04-play-spark';
    card.appendChild(img);
  });
  document.querySelectorAll('.study-card').forEach(card=>{
    if(card.querySelector('.v04-study-flower'))return;
    const img=document.createElement('img');
    img.src=asset('flower');img.alt='';img.setAttribute('aria-hidden','true');img.className='v04-study-flower';
    card.appendChild(img);
  });
}

function sync(){
  syncJourney();
  decorateDynamic();
}

document.addEventListener('lux:growth',sync);
document.addEventListener('lux:plan-change',sync);
document.addEventListener('scholar:wardrobe-change',sync);
window.addEventListener('hashchange',()=>queueMicrotask(sync));
window.addEventListener('popstate',()=>queueMicrotask(sync));
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',sync,{once:true}):sync();

window.V04UI=Object.freeze({assets:A,asset,sync,syncJourney,decorateDynamic});
})();
