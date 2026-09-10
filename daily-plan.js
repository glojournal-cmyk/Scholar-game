(function(){
'use strict';
const KEY='scholarGardenUxV03';

function day(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function fresh(){return {version:3,lastRoute:'#home',plans:{},scienceRead:{},dayComplete:{},recentSubjects:[],migration:{fromV02:true}}}
function load(){
 try{const x=JSON.parse(localStorage.getItem(KEY)||'null');if(x&&typeof x==='object')return {...fresh(),...x,plans:x.plans||{},scienceRead:x.scienceRead||{},dayComplete:x.dayComplete||{},recentSubjects:Array.isArray(x.recentSubjects)?x.recentSubjects:[]}}
 catch(e){}
 return fresh();
}
function save(s){localStorage.setItem(KEY,JSON.stringify(s));return s}
function touchSubject(subject){
 const s=load();s.recentSubjects=[subject,...s.recentSubjects.filter(x=>x!==subject)].slice(0,5);save(s);
}
function markScience(topicId){
 const s=load(),k=day();if(!s.scienceRead[k])s.scienceRead[k]={};s.scienceRead[k][topicId]=true;save(s);
 document.dispatchEvent(new CustomEvent('lux:plan-change'));
}
function isScienceRead(topicId,k=day()){return !!load().scienceRead?.[k]?.[topicId]}

function latinStats(){
 try{
  const s=window.MasterY8?.todayStats?.('latin')||{};
  return {answers:Number(s.answers)||0,due:Number(s.due)||0,weak:Number(s.weak)||0,loaded:!!s.loaded};
 }catch{return {answers:0,due:0,weak:0,loaded:false}}
}
function frenchStats(){
 try{
  const s=window.MasterY8?.todayStats?.('french')||{};
  return {answers:Number(s.answers)||0,due:Number(s.due)||0,weak:Number(s.weak)||0,loaded:!!s.loaded};
 }catch{return {answers:0,due:0,weak:0,loaded:false}}
}
function biologyStats(){
 try{
  const s=window.BiologyY8?.todayStats?.()||{};
  return {answers:Number(s.answers)||0,due:Number(s.due)||0,weak:Number(s.weak)||0,loaded:!!s.loaded};
 }catch{return {answers:0,due:0,weak:0,loaded:false}}
}
function sciencePick(k){
 const date=new Date(`${k}T12:00:00`),ordinal=Math.floor(date.getTime()/86400000);
 const subjects=['biology','chemistry','physics'],subject=subjects[Math.abs(ordinal)%3],pack=window.ScholarScience?.get(subject);
 const topics=pack?.topics||[],topic=topics.length?topics[Math.abs(Math.floor(ordinal/3))%topics.length]:null;
 return topic?{subject,topic}:null;
}
function makePlan(k=day()){
 const l=latinStats(),f=frenchStats(),b=biologyStats(),tasks=[];
 if(l.loaded&&l.due>0)tasks.push({id:`latin-due-${k}`,subject:'latin',reason:'Due review',title:'Spaced review',target:7,minutes:2,kind:'latin-due'});
 if(f.loaded&&f.due>0)tasks.push({id:`french-due-${k}`,subject:'french',reason:'Due review',title:'Spaced review',target:7,minutes:2,kind:'french-due'});
 if(b.loaded&&b.due>0&&tasks.length<3)tasks.push({id:`biology-due-${k}`,subject:'biology',reason:'Due review',title:'Spaced review',target:7,minutes:3,kind:'biology-due'});
 if(tasks.length<3&&l.loaded&&l.weak>0&&!tasks.some(t=>t.subject==='latin'))tasks.push({id:`latin-weak-${k}`,subject:'latin',reason:'Weak area',title:'Latin Boost',target:7,minutes:2,kind:'latin-weak',baseline:l.answers});
 if(tasks.length<3&&f.loaded&&f.weak>0&&!tasks.some(t=>t.subject==='french'))tasks.push({id:`french-weak-${k}`,subject:'french',reason:'Weak area',title:'French Boost',target:7,minutes:2,kind:'french-weak',baseline:f.answers});
 if(tasks.length<3&&b.loaded&&b.weak>0&&!tasks.some(t=>t.subject==='biology'))tasks.push({id:`biology-weak-${k}`,subject:'biology',reason:'Weak area',title:'Biology Boost',target:7,minutes:3,kind:'biology-weak',baseline:b.answers});
 if(tasks.length<3){
   const pick=sciencePick(k);
   if(pick)tasks.push({id:`science-${pick.topic.id}-${k}`,subject:pick.subject,reason:'Current learning',title:`${pick.topic.id} · ${pick.topic.title}`,target:1,minutes:8,kind:'science-learn',topicId:pick.topic.id});
 }
 const gameDay=(new Date(`${k}T12:00:00`).getDate()%3===0);
 if(gameDay&&tasks.length<3){
   const subject=(new Date(`${k}T12:00:00`).getDate()%2)?'latin':'french';
   if(subject==='latin')tasks.push({id:`latin-game-verbum-${k}`,subject:'latin',reason:'Game',title:'Play Verbum Match',target:1,minutes:3,kind:'latin-game',gameId:'verbum'});
   else if(f.loaded)tasks.push({id:`french-game-spelling-${k}`,subject:'french',reason:'Game',title:'Play Spelling Sprint',target:1,minutes:3,kind:'french-game',gameId:'atelier-spelling'});
 }
 const order=(new Date(`${k}T12:00:00`).getDate()%2)?['latin','french']:['french','latin'];
 for(const subject of order){
   if(tasks.length>=3)break;
   if(tasks.some(t=>t.subject===subject))continue;
   if(subject==='latin'&&!l.loaded)continue;
   if(subject==='french'&&!f.loaded)continue;
   tasks.push({id:`${subject}-standard-${k}`,subject,reason:'Foundation consolidation',title:'Standard practice',target:15,minutes:5,kind:`${subject}-practice`,baseline:subject==='latin'?l.answers:f.answers});
 }
 if(tasks.length<3&&l.loaded&&!tasks.some(t=>t.subject==='latin'))tasks.push({id:`latin-standard-${k}`,subject:'latin',reason:'Foundation consolidation',title:'Standard practice',target:15,minutes:5,kind:'latin-practice',baseline:l.answers});
 return tasks.slice(0,3);
}
function plan(k=day()){
 const s=load();
 if(!Array.isArray(s.plans[k])||!s.plans[k].length){s.plans[k]=makePlan(k);save(s)}
 return s.plans[k];
}
function taskProgress(t,k=day()){
 const l=latinStats(),f=frenchStats(),b=biologyStats();
 if(t.kind==='science-learn')return {value:isScienceRead(t.topicId,k)?1:0,target:1};
 if(t.kind==='latin-game'||t.kind==='french-game'){
   const subject=t.subject,history=window.LuxGrowth?.load?.().history||[];
   const done=history.some(h=>h.day===k&&h.subject===subject&&h.type==='game_learning_complete'&&(t.kind==='latin-game'?String(h.itemId||'').startsWith(`${t.gameId}:`):String(h.itemId||'').startsWith(t.gameId)));
   return {value:done?1:0,target:1};
 }
 if(t.kind==='latin-practice'||t.kind==='latin-weak')return {value:Math.min(t.target,Math.max(0,l.answers-(Number(t.baseline)||0))),target:t.target};
 if(t.kind==='french-practice'||t.kind==='french-weak')return {value:Math.min(t.target,Math.max(0,f.answers-(Number(t.baseline)||0))),target:t.target};
 if(t.kind==='biology-practice'||t.kind==='biology-weak')return {value:Math.min(t.target,Math.max(0,b.answers-(Number(t.baseline)||0))),target:t.target};
 // Due tasks are considered complete only once the scheduled due queue is cleared.
 if(t.kind==='latin-due')return {value:l.due===0?t.target:0,target:t.target};
 if(t.kind==='french-due')return {value:f.due===0?t.target:0,target:t.target};
 if(t.kind==='biology-due')return {value:b.due===0?t.target:0,target:t.target};
 return {value:0,target:t.target||1};
}
function status(k=day()){
 const tasks=plan(k),rows=tasks.map(t=>({...t,progress:taskProgress(t,k)}));
 const done=rows.filter(x=>x.progress.value>=x.progress.target).length;
 const s=load();
 if(rows.length&&done===rows.length&&!s.dayComplete[k]){
   s.dayComplete[k]=new Date().toISOString();save(s);
   window.LuxGrowth?.award?.({subject:'shared',type:'daily_complete',itemId:k,windowKey:k});
 }
 return {tasks:rows,done,total:rows.length,complete:rows.length>0&&done===rows.length};
}
function completedOn(k){const s=load();if(s.dayComplete?.[k])return true;try{return !!window.LuxGrowth?.load?.().studyDates?.[k]}catch{return false}}
function minimumText(k=day()){
 const rows=status(k).tasks;
 const due=rows.find(t=>t.reason==='Due review'&&t.progress.value<t.progress.target);
 if(due)return `Minimum today: complete the ${displaySubject(due.subject)} due review.`;
 const first=rows.find(t=>t.progress.value<t.progress.target);
 return first?`Minimum today: finish ${displaySubject(first.subject)} — ${first.title}.`:'Minimum complete. Anything else today is optional.';
}
function displaySubject(s){return ({latin:'Latin',french:'French',biology:'Biology',chemistry:'Chemistry',physics:'Physics'})[s]||s}
function resetTodayForTest(){const s=load();delete s.plans[day()];save(s)}
window.ScholarUX=Object.freeze({KEY,load,save,day,touchSubject,markScience,isScienceRead});
window.DailyPlan=Object.freeze({plan,status,minimumText,completedOn,displaySubject,resetTodayForTest});
})();