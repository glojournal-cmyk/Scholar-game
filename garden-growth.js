
(function(){
'use strict';

/*
 V0.4 Alpha 4 garden presentation runtime.
 IMPORTANT:
 - LuxGrowth remains the sole owner of XP, unlocks, garden stage and mastery-adjacent state.
 - This module only maps the existing stage to supplied artwork and presentation.
*/
const CONTRACT=Object.freeze({
  available:false,
  stages:Object.freeze({
    1:'garden_growth_01_seed.webp',
    2:'garden_growth_02_young.webp',
    3:'garden_growth_03_budding.webp',
    4:'garden_growth_04_bloom.webp'
  })
});
const MILESTONES=Object.freeze([
  {stage:1,min:0,name:'Seedling',copy:'The first signs of your study habit are taking root.'},
  {stage:2,min:400,name:'Young Growth',copy:'Regular learning has grown a stronger, leafier plant.'},
  {stage:3,min:1000,name:'Budding',copy:'Your Garden is established and preparing to bloom.'},
  {stage:4,min:2200,name:'In Bloom',copy:'A flourishing Scholar Garden grown through sustained study.'}
]);

function config(){
  const o=window.ScholarGardenGrowthConfig;
  return o&&typeof o==='object'?{...CONTRACT,...o,stages:o.stages||CONTRACT.stages}:CONTRACT;
}
function snapshot(){
  try{return window.LuxGrowth?.snapshot?.()||null}catch{return null}
}
function stage(){
  const g=snapshot();
  return Math.max(1,Math.min(4,Number(g?.gardenStage)||1));
}
function artForStage(n=stage()){
  const c=config();
  return c.available?c.stages[Math.max(1,Math.min(4,Number(n)||1))]||null:null;
}
function milestone(n=stage()){
  return MILESTONES.find(x=>x.stage===Math.max(1,Math.min(4,Number(n)||1)))||MILESTONES[0];
}
function nextMilestone(){
  const g=snapshot(),n=stage(),next=MILESTONES.find(x=>x.stage===n+1)||null;
  if(!next)return {stage:n,complete:true,left:0,target:null};
  return {stage:next.stage,complete:false,left:Math.max(0,next.min-(g?.total||0)),target:next.min};
}
function renderSpecimen(slot,n=stage(),compact=false){
  if(!slot)return false;
  const src=artForStage(n);
  if(!src){
    slot.hidden=true;slot.innerHTML='';return false;
  }
  const m=milestone(n);
  slot.hidden=false;
  slot.innerHTML=`<img src="${src}" alt="${m.name} garden plant, stage ${n}" decoding="async" loading="lazy">
    <div><small>${compact?'GARDEN':'GROWTH SPECIMEN'}</small><strong>${m.name}</strong></div>`;
  return true;
}
function renderTimeline(){
  const root=document.getElementById('gardenGrowthTimeline');
  if(!root)return false;
  const current=stage(),g=snapshot();
  root.innerHTML=MILESTONES.map(m=>{
    const unlocked=m.stage<=current,currentClass=m.stage===current?'current':'',status=unlocked?(m.stage===current?'Current':'Reached'):`${Math.max(0,m.min-(g?.total||0))} XP`;
    const src=config().available?config().stages[m.stage]:null;
    return `<article class="garden-growth-step ${unlocked?'unlocked':'locked'} ${currentClass}">
      <div class="garden-growth-step-art">${src?`<img src="${src}" alt="" loading="lazy" decoding="async">`:''}</div>
      <div class="garden-growth-step-copy">
        <small>STAGE ${m.stage}</small><h3>${m.name}</h3><p>${m.copy}</p><span>${status}</span>
      </div>
    </article>`;
  }).join('');
  return true;
}
function renderSummary(){
  const n=stage(),m=milestone(n),next=nextMilestone();
  const name=document.getElementById('gardenGrowthName');
  const copy=document.getElementById('gardenGrowthCopy');
  const nextText=document.getElementById('gardenGrowthNextText');
  if(name)name.textContent=m.name;
  if(copy)copy.textContent=m.copy;
  if(nextText)nextText.textContent=next.complete?'Your Garden is fully in bloom.':`${next.left} XP until Stage ${next.stage}`;
}
function render(){
  renderSpecimen(document.getElementById('gardenGrowthSpecimen'));
  renderSpecimen(document.getElementById('scholarGardenSpecimen'),stage(),true);
  renderTimeline();
  renderSummary();
  return !!artForStage();
}
document.addEventListener('lux:growth',render);
document.addEventListener('scholar:tab-open',render);
window.addEventListener('DOMContentLoaded',render,{once:true});
window.ScholarGardenGrowth=Object.freeze({CONTRACT,MILESTONES,stage,artForStage,milestone,nextMilestone,render});
})();
