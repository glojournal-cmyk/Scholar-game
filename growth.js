
(function(){
'use strict';
const KEY='luxScholarGardenV1';
const RULES=Object.freeze({
  daily_complete:60,
  practice_first_correct:4,
  practice_repeat_correct:1,
  practice_repair_correct:2,
  formal_due_review_correct:6,
  spelling_first_independent:8,
  spelling_repair:2,
  vocab_review_2d:10,
  vocab_review_7d:15,
  quiz_complete_80:30,
  quiz_bonus_90:15,
  game_learning_complete:20,
  boss_complete:25,
  vocab_mastered:10,
  writing_complete:20,
  extra_training_complete:12,
  weak_area_complete:8,
  topic_mastery_first:25,
  retention_confirmed:10,
  reveal:0,
  assisted_build:1,
  clue_correct:1
});
function fresh(){
  return {
    version:2,xp:0,level:1,medals:{},collectibles:{},
    wardrobe:{hair:'starter',outfit:'starter',accessory:null},
    garden:{stage:1,equipped:[]},claims:{},counts:{},history:[],studyDates:{},
    subjectTotals:{latin:0,french:0,biology:0,chemistry:0,physics:0},
    milestones:{}
  };
}
function load(){
  try{
    const v=JSON.parse(localStorage.getItem(KEY)||'null');
    const b=fresh();
    if(!v||typeof v!=='object')return b;
    return {...b,...v,
      medals:{...b.medals,...(v.medals||{})},
      collectibles:{...b.collectibles,...(v.collectibles||{})},
      wardrobe:{...b.wardrobe,...(v.wardrobe||{})},
      garden:{...b.garden,...(v.garden||{})},
      claims:{...b.claims,...(v.claims||{})},
      counts:{...b.counts,...(v.counts||{})},
      history:Array.isArray(v.history)?v.history:[],
      studyDates:{...b.studyDates,...(v.studyDates||{})},
      subjectTotals:{...b.subjectTotals,...(v.subjectTotals||{})},
      milestones:{...b.milestones,...(v.milestones||{})}
    };
  }catch(e){return fresh()}
}
function save(s){localStorage.setItem(KEY,JSON.stringify(s))}
function day(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function need(level){const n=Math.max(1,Number(level)||1);return Math.round(100+(n-1)*40+Math.pow(n-1,1.35)*10)}
function levelFromXP(total){
  let left=Math.max(0,Number(total)||0),level=1;
  while(level<50 && left>=need(level)){left-=need(level);level++}
  return {level,into:left,next:need(level)}
}
function multiplier(type,count){
  const oneShot=['daily_complete','formal_due_review_correct','vocab_review_2d','vocab_review_7d','boss_complete','vocab_mastered','writing_complete','topic_mastery_first','retention_confirmed'];
  if(oneShot.includes(type))return count===0?1:0;
  if(count===0)return 1;
  if(count===1)return .2;
  return 0;
}
function unlockRewards(s){
  const xp=s.xp||0, days=Object.keys(s.studyDates||{}).length, latin=s.subjectTotals?.latin||0, french=s.subjectTotals?.french||0;
  const unlock=(id,cond)=>{if(cond&&!s.collectibles[id])s.collectibles[id]={earnedAt:new Date().toISOString()}};
  unlock('ink-pot',xp>=40);
  unlock('desk-lamp',days>=3);
  unlock('study-books',xp>=250);
  unlock('ivy-pot',days>=7);
  unlock('bronze-stylus',latin>=120);
  unlock('wax-tablet',latin>=250);
  unlock('fountain-pen',french>=120);
  unlock('lavender-vase',french>=250);
  unlock('scholars-globe',latin>=300&&french>=300);
  unlock('golden-lexicon',xp>=1500);
  s.garden.stage = xp>=2200?4:xp>=1000?3:xp>=400?2:1;

  const medal=(id,cond)=>{if(cond&&!s.medals[id])s.medals[id]={earnedAt:new Date().toISOString()}};
  medal('first-steps',xp>=100);
  medal('daily-disciplina',days>=7);
  medal('latin-scholar',latin>=500);
  medal('french-scholar',french>=500);
  medal('polyglot',latin>=500&&french>=500);
}
function award(event){
  if(!event||!(event.type in RULES))return {awarded:0,reason:'unknown_event'};
  const s=load();
  const key=[event.subject||'shared',event.type,event.itemId||'session',event.windowKey||day()].join('|');
  const count=Number(s.counts[key])||0;
  const amount=Math.max(0,Math.round(RULES[event.type]*multiplier(event.type,count)));
  s.counts[key]=count+1;
  if(amount){
    s.xp=(s.xp||0)+amount;
    if(['latin','french','biology','chemistry','physics'].includes(event.subject))s.subjectTotals[event.subject]=(s.subjectTotals[event.subject]||0)+amount;
    s.studyDates[day()]=true;
    s.history.push({at:new Date().toISOString(),day:day(),subject:event.subject||'shared',type:event.type,itemId:event.itemId||null,xp:amount});
    if(s.history.length>500)s.history=s.history.slice(-500);
    s.level=levelFromXP(s.xp).level;
    unlockRewards(s);
  }
  save(s);
  document.dispatchEvent(new CustomEvent('lux:growth',{detail:{amount,event}}));
  return {awarded:amount,reason:amount?'awarded':'repeat_decay',state:s};
}
function snapshot(){
  const s=load(),l=levelFromXP(s.xp||0);
  return {...l,total:s.xp||0,medalCount:Object.keys(s.medals||{}).length,
    collectibleCount:Object.keys(s.collectibles||{}).length,studyDays:Object.keys(s.studyDates||{}).length,
    gardenStage:s.garden?.stage||1,subjectTotals:s.subjectTotals||{latin:0,french:0,biology:0,chemistry:0,physics:0},state:s};
}
window.LuxGrowth=Object.freeze({KEY,RULES,load,save,award,snapshot,levelFromXP});
})();
