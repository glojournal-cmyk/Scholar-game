
(function(){
'use strict';

const SUBJECTS={
 latin:{label:'Latin',key:'latinY8MasteryV1',legacyKey:'latinSummerV8State'},
 french:{label:'French',key:'frenchY8MasteryV1',legacyKey:'monJardinFrancais.progress.v2'}
};
let index=null,conceptIndex=null,originMap=null;
const topicCache=new Map(),bundleCache=new Map(),sessions={latin:null,french:null};
let markerPromise=null;
function getMarker(){
 if(!markerPromise)markerPromise=import('./mcp-reference-marker.mjs').catch(err=>{console.warn('Reference marker unavailable',err);return null});
 return markerPromise;
}

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function addDays(n){const d=new Date();d.setDate(d.getDate()+Number(n||0));return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function baseNorm(v){
 return String(v??'').normalize('NFC').toLowerCase().replace(/[’]/g,"'").replace(/[.!?;:,]+$/g,'').replace(/\s+/g,' ').trim();
}
function stripDiacritics(v){return baseNorm(v).normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function latinNorm(v){return baseNorm(String(v??'').replace(/\s*\([^)]*\)/g,' '))}
function subjectNorm(subject,v){return subject==='french'?stripDiacritics(v):latinNorm(v)}
function splitSet(subject,v){return subjectNorm(subject,v).split(/\s*(?:,|;|\/|\||\band\b|\n)\s*/i).filter(Boolean)}
function tokenSet(subject,v){return new Set(subjectNorm(subject,v).split(/\s+/).filter(Boolean))}

async function loadCore(){
 if(index&&conceptIndex&&originMap)return true;
 try{
  const [i,c,o]=await Promise.all([
   fetch('./mcp-runtime-index.json').then(r=>r.json()),
   fetch('./mcp-concept-index.json').then(r=>r.json()),
   fetch('./mcp-origin-map.json').then(r=>r.json())
  ]);
  index=i;conceptIndex=c;originMap=o;return true;
 }catch(err){console.error('Master Content Pack core load failed',err);return false}
}
function fresh(subject){
 return {version:2,subject,concepts:{},history:[],sessions:0,answered:0,correct:0,milestones:{},migratedLegacy:false,createdAt:new Date().toISOString()};
}
function loadState(subject){
 const key=SUBJECTS[subject].key;
 try{
  const x=JSON.parse(localStorage.getItem(key)||'null');
  if(x&&typeof x==='object')return {...fresh(subject),...x,concepts:x.concepts||{},history:Array.isArray(x.history)?x.history:[],milestones:x.milestones||{}};
 }catch{}
 return fresh(subject);
}
function saveState(subject,s){localStorage.setItem(SUBJECTS[subject].key,JSON.stringify(s))}
const states={latin:loadState('latin'),french:loadState('french')};

function conceptState(subject,id,topicId){
 const s=states[subject];
 if(!s.concepts[id])s.concepts[id]={
  stage:'new',topicId:topicId||conceptIndex?.[subject]?.[id]?.topicId||null,
  attempts:0,totalWeight:0,correctWeight:0,hasProductionSuccess:false,nextDue:null,dueStage:null,lastAt:null,lastCorrect:null
 };
 if(topicId&&!s.concepts[id].topicId)s.concepts[id].topicId=topicId;
 return s.concepts[id];
}
function weightedAccuracy(cs){return cs.totalWeight?Math.round(cs.correctWeight/cs.totalWeight*100):0}

function migrateLegacy(subject){
 const s=states[subject];if(s.migratedLegacy||!originMap?.[subject])return;
 let legacy=null;
 try{legacy=JSON.parse(localStorage.getItem(SUBJECTS[subject].legacyKey)||'null')}catch{}
 if(!legacy){s.migratedLegacy=true;saveState(subject,s);return}
 const map=originMap[subject];
 if(subject==='latin'){
  const results=legacy.results||{};
  Object.entries(results).forEach(([oldId,r])=>{
   const m=map[oldId];if(!m||!r?.ok)return;
   const cs=conceptState(subject,m.conceptId,m.topicId);
   cs.attempts=Math.max(cs.attempts,1);cs.totalWeight+=m.masteryWeight;cs.correctWeight+=m.masteryWeight;
   if(!m.recognition){cs.hasProductionSuccess=true;if(['new','recognised'].includes(cs.stage))cs.stage='learning'}
   else if(cs.stage==='new')cs.stage='recognised';
  });
  Object.entries(legacy.reviews||{}).forEach(([oldId,r])=>{
   const m=map[oldId];if(!m)return;const cs=conceptState(subject,m.conceptId,m.topicId);
   if(r?.due)cs.nextDue=r.due;
   if(r?.stage===1)cs.dueStage='2d';else if(r?.stage===2)cs.dueStage='7d';
  });
 }else{
  Object.entries(legacy.attempts||{}).forEach(([oldId,a])=>{
   const m=map[oldId];if(!m)return;const cs=conceptState(subject,m.conceptId,m.topicId);
   if(a?.status==='correct'){
    cs.attempts=Math.max(cs.attempts,1);cs.totalWeight+=m.masteryWeight;cs.correctWeight+=m.masteryWeight;
    if(!m.recognition){cs.hasProductionSuccess=true;if(['new','recognised'].includes(cs.stage))cs.stage='learning'}
    else if(cs.stage==='new')cs.stage='recognised';
   }
   if(a?.status==='wrong'){cs.lastCorrect=false;cs.nextDue=a.dueAt?new Date(a.dueAt).toISOString().slice(0,10):addDays(2);cs.dueStage='2d'}
  });
 }
 s.migratedLegacy=true;saveState(subject,s);
}

function renderPackError(subject,pane,kind='Practice'){
 if(!pane)return;
 pane.innerHTML=`<div class="load-error"><p class="eyebrow">${SUBJECTS[subject]?.label?.toUpperCase()||'FOUNDATION'}</p><h2>${kind} data could not be loaded.</h2><p>Please retry. Your existing learner state is safe.</p><button class="primary" data-mcp-retry="${subject}" data-mcp-retry-kind="${kind.toLowerCase()}">Retry</button></div>`;
}

async function ensure(subject){
 if(!(await loadCore()))return false;
 migrateLegacy(subject);return true;
}
function topics(subject){
 return (index?.topics||[]).filter(x=>x.subject===subject);
}
async function loadBundle(file){
 if(bundleCache.has(file))return bundleCache.get(file);
 const bundle=await fetch(`./${file}`,{cache:'default'}).then(r=>{if(!r.ok)throw new Error(`${file}: ${r.status}`);return r.json()});
 bundleCache.set(file,bundle);
 return bundle;
}
async function loadTopic(subject,topicId){
 const key=`${subject}:${topicId}`;if(topicCache.has(key))return topicCache.get(key);
 const meta=topics(subject).find(x=>x.topicId===topicId);
 if(!meta?.bundle)throw new Error(`Unknown topic ${topicId}`);
 const bundle=await loadBundle(meta.bundle);
 const row=(bundle.topics||[]).find(x=>x.topicId===topicId);
 if(!row)throw new Error(`Unknown topic ${topicId}`);
 const data=row.data;
 topicCache.set(key,data);return data;
}
function enabled(q){
 // French listen/type records stay preserved in the Master Pack, but are not auto-selected
 // until the app has a reliable approved audio source. We do not substitute generic TTS.
 return q.status==='enabled'&&!(q.subject==='french'&&q.format==='listen_type');
}
function isRecognition(q){return !!q.gameplay?.recognition}
function dueConceptIds(subject){
 const k=today(),s=states[subject];
 return Object.entries(s.concepts).filter(([id,c])=>c?.nextDue&&c.nextDue<=k&&c.stage!=='secure').map(([id])=>id);
}
function weakConceptIds(subject){
 const s=states[subject];
 return Object.entries(s.concepts).filter(([id,c])=>c&&c.attempts>0&&c.stage!=='secure'&&(c.lastCorrect===false||['recognised','learning','consolidating'].includes(c.stage))).map(([id])=>id);
}
function dueCount(subject){return dueConceptIds(subject).length}
function weakCount(subject){return weakConceptIds(subject).length}
function reviewDates(subject){return Object.values(states[subject].concepts).map(c=>c?.nextDue).filter(Boolean)}
function todayStats(subject){
 const k=today(),rows=states[subject].history.filter(h=>h.day===k);
 return {answers:rows.length,correct:rows.filter(h=>h.correct).length,due:dueCount(subject),weak:weakCount(subject),loaded:!!index};
}
function masterySummary(subject){
 const ids=Object.keys(conceptIndex?.[subject]||{}),stages={new:0,recognised:0,learning:0,consolidating:0,secure:0};
 ids.forEach(id=>{const st=states[subject].concepts[id]?.stage||'new';stages[st]=(stages[st]||0)+1});
 return {total:ids.length,...stages};
}
function topicProgress(subject,topicId){
 const ids=Object.entries(conceptIndex?.[subject]||{}).filter(([id,c])=>c.topicId===topicId&&c.status==='enabled').map(([id])=>id);
 const secure=ids.filter(id=>states[subject].concepts[id]?.stage==='secure').length;
 return {total:ids.length,secure,pct:ids.length?Math.round(secure/ids.length*100):0};
}

async function questionsForConcepts(subject,ids){
 const byTopic=new Map();
 ids.forEach(id=>{const topicId=states[subject].concepts[id]?.topicId||conceptIndex?.[subject]?.[id]?.topicId;if(topicId){if(!byTopic.has(topicId))byTopic.set(topicId,new Set());byTopic.get(topicId).add(id)}});
 const out=[];
 for(const [topicId,set] of byTopic){
  const data=await loadTopic(subject,topicId);
  set.forEach(cid=>{
   const candidates=(data.questions||[]).filter(q=>enabled(q)&&q.conceptId===cid);
   const production=candidates.filter(q=>!isRecognition(q));
   const choice=shuffle(production.length?production:candidates)[0];if(choice)out.push(choice);
  });
 }
 return out;
}
function sessionMix(pool,count){
 const uniq=[];const seen=new Set();
 for(const q of shuffle(pool)){if(!seen.has(q.id)){seen.add(q.id);uniq.push(q)}}
 const recognition=uniq.filter(isRecognition),production=uniq.filter(q=>!isRecognition(q));
 const opening=shuffle(recognition).slice(0,Math.min(2,count));
 const rest=[...shuffle(production),...shuffle(recognition.filter(q=>!opening.includes(q)))];
 return [...opening,...rest].slice(0,count);
}
async function choose(subject,mode,count,topicId='all'){
 if(mode==='due')return sessionMix(await questionsForConcepts(subject,dueConceptIds(subject)),count);
 if(mode==='weak')return sessionMix(await questionsForConcepts(subject,weakConceptIds(subject)),count);
 let selectedTopics=[];
 if(topicId!=='all')selectedTopics=[topicId];
 else{
  const eligible=topics(subject).filter(t=>t.enabledCount>0);
  const recent=states[subject].history.slice(-60).map(h=>h.topicId).filter(Boolean);
  const neglected=eligible.filter(t=>!recent.includes(t.topicId));
  selectedTopics=[...shuffle(neglected),...shuffle(eligible.filter(t=>!neglected.includes(t)))].slice(0,Math.min(5,eligible.length)).map(t=>t.topicId);
 }
 const pool=[];
 for(const tid of selectedTopics){
  const data=await loadTopic(subject,tid);
  pool.push(...(data.questions||[]).filter(q=>enabled(q)));
 }
 if(mode==='production')return sessionMix(pool.filter(q=>!isRecognition(q)),count);
 if(mode==='extra'){
   const production=pool.filter(q=>!isRecognition(q));
   return sessionMix(production.length?production:pool,count);
 }
 return sessionMix(pool,count);
}

function mark(subject,q,input,selected){
 const a=q.answer||{},mode=a.mode;
 if(mode==='choice')return {automatic:true,correct:subjectNorm(subject,selected)===subjectNorm(subject,a.correctOption),model:a.correctOption};
 if(['exact_or_equivalent','one_of_complete_examples','ordered_tiles'].includes(mode)){
  const accepted=a.accepted||[],base=subjectNorm(subject,input),hit=accepted.find(x=>subjectNorm(subject,x)===base);
  if(hit){
   const accentOnly=subject==='french'&&baseNorm(input)!==baseNorm(hit)&&stripDiacritics(input)===stripDiacritics(hit);
   return {automatic:true,correct:true,accentOnly,model:hit};
  }
  return {automatic:true,correct:false,model:accepted[0]||''};
 }
 if(['semantic_groups','latin_required_groups'].includes(mode)){
  const accepted=(a.accepted||[]).find(x=>subjectNorm(subject,x)===subjectNorm(subject,input));
  if(accepted)return {automatic:true,correct:true,model:accepted};
  const tokens=tokenSet(subject,input),missing=[];
  (a.requiredGroups||[]).forEach(g=>{if(!(g.alternatives||[]).some(x=>{const n=subjectNorm(subject,x);return n.includes(' ')?subjectNorm(subject,input).includes(n):tokens.has(n)}))missing.push(g.label)});
  if(mode==='latin_required_groups'&&a.rejectUnrelatedExtraTokens){
   const allowed=new Set();(a.requiredGroups||[]).flatMap(g=>g.alternatives||[]).forEach(x=>subjectNorm(subject,x).split(/\s+/).forEach(t=>allowed.add(t)));
   const extra=[...tokens].filter(t=>!allowed.has(t));
   return {automatic:true,correct:missing.length===0&&extra.length===0,missing,extra,model:(a.accepted||[])[0]||''};
  }
  return {automatic:true,correct:missing.length===0,missing,model:(a.accepted||[])[0]||''};
 }
 if(mode==='unordered_required_groups'){
  const parts=new Set(splitSet(subject,input)),missing=[];
  (a.requiredGroups||[]).forEach(g=>{if(!(g.alternatives||[]).some(x=>parts.has(subjectNorm(subject,x))))missing.push(g.label)});
  return {automatic:true,correct:missing.length===0,missing,model:(a.accepted||[])[0]||(a.requiredGroups||[]).map(g=>g.label).join(', ')};
 }
 if(mode==='manual_review')return {automatic:false,correct:null,model:(a.accepted||[])[0]||''};
 return {automatic:false,correct:null,model:(a.accepted||[])[0]||''};
}

function stageRank(s){return ({new:0,recognised:1,learning:2,consolidating:3,secure:4})[s]??0}
function updateMastery(subject,q,correct,isDue){
 const s=states[subject],cs=conceptState(subject,q.conceptId,q.topicId),beforeStage=cs.stage,w=Number(q.gameplay?.masteryWeight||1);
 cs.attempts++;cs.totalWeight+=w;if(correct)cs.correctWeight+=w;cs.lastAt=new Date().toISOString();cs.lastCorrect=!!correct;
 const production=!isRecognition(q),acc=weightedAccuracy(cs);
 if(!correct){
  if(cs.stage==='secure')cs.stage='consolidating';
  cs.nextDue=addDays(q.review?.onWrong?.resetToDays??q.review?.onWrong?.nextDueDays??2);cs.dueStage='2d';
  saveState(subject,s);
  return {beforeStage,afterStage:cs.stage,becameSecure:false,strengthened:false};
 }
 if(production)cs.hasProductionSuccess=true;
 if(isDue&&production&&cs.dueStage==='2d'){
  cs.stage='consolidating';cs.nextDue=addDays(q.review?.onWrong?.thenDueDays??7);cs.dueStage='7d';
 }else if(isDue&&production&&cs.dueStage==='7d'&&cs.hasProductionSuccess&&acc>=85){
  cs.stage='secure';cs.nextDue=null;cs.dueStage=null;
 }else if(production){
  if(['new','recognised'].includes(cs.stage))cs.stage='learning';
  if(cs.stage==='learning'&&!cs.nextDue){cs.nextDue=addDays(q.review?.onCorrect?.newToLearningDays??2);cs.dueStage='2d'}
 }else{
  if(cs.stage==='new')cs.stage='recognised';
  if(!cs.nextDue){cs.nextDue=addDays(q.review?.onCorrect?.newToLearningDays??2);cs.dueStage='2d'}
 }
 const becameSecure=beforeStage!=='secure'&&cs.stage==='secure';
 saveState(subject,s);
 return {beforeStage,afterStage:cs.stage,becameSecure,strengthened:stageRank(cs.stage)>stageRank(beforeStage)};
}
function record(subject,q,correct,isDue,manual=false,accentOnly=false){
 const s=states[subject],transition=updateMastery(subject,q,correct,isDue);
 s.answered++;if(correct)s.correct++;
 s.history.push({at:new Date().toISOString(),day:today(),questionId:q.id,conceptId:q.conceptId,topicId:q.topicId,correct:!!correct,recognition:isRecognition(q),manual,accentOnly});
 if(s.history.length>1500)s.history=s.history.slice(-1500);
 saveState(subject,s);
 if(correct){
   const xpType=isDue?'formal_due_review_correct':transition.beforeStage==='secure'?'practice_repeat_correct':'practice_first_correct';
   window.LuxGrowth?.award?.({subject,type:xpType,itemId:q.id});
 }
 if(transition.becameSecure){
   window.LuxGrowth?.award?.({subject,type:'retention_confirmed',itemId:`${subject}:${q.conceptId}`,windowKey:'ever'});
 }
 document.dispatchEvent(new CustomEvent('mcp:y8-progress',{detail:{subject,transition,conceptId:q.conceptId,topicId:q.topicId}}));
 return transition;
}
function metric(subject,topicId='all'){
 if(topicId&&topicId!=='all'){
  const p=topicProgress(subject,topicId);return {kind:'topic',topicId,value:p.pct,label:`${p.pct}%`,secure:p.secure,total:p.total};
 }
 const m=masterySummary(subject);return {kind:'subject',value:m.secure,label:`${m.secure} secure`,secure:m.secure,total:m.total};
}
function maybeTopicMilestone(subject,topicId,before,after){
 if(!topicId||topicId==='all'||before.value>=85||after.value<85)return 0;
 const s=states[subject],key=`topic85:${topicId}`;
 if(s.milestones[key])return 0;
 s.milestones[key]={earnedAt:new Date().toISOString(),value:after.value};saveState(subject,s);
 return window.LuxGrowth?.award?.({subject,type:'topic_mastery_first',itemId:`${subject}:${topicId}`,windowKey:'ever'})?.awarded||0;
}
function taskControl(subject,q){
 if(q.format==='mc_single')return `<div class="options">${(q.options||[]).map(o=>`<button class="option" data-mcp-opt="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
 if(q.format==='word_tiles'){
  const accepted=q.answer?.accepted?.[0]||'',tiles=shuffle(accepted.split(/\s+/).filter(Boolean));
  return `<div class="tile-bank">${tiles.map(t=>`<button class="word-tile" type="button" data-word-tile="${esc(t)}">${esc(t)}</button>`).join('')}</div><input id="mcpAnswer" class="answer-input" autocomplete="off" placeholder="Build or type the answer…">`;
 }
 if(q.format==='listen_type'){
  return `<button class="secondary" id="mcpListen" type="button">🔈 Listen</button><input id="mcpAnswer" class="answer-input" autocomplete="off" placeholder="Type what you hear…">`;
 }
 return `<textarea id="mcpAnswer" class="answer-input ${q.format==='controlled_translation'?'mcp-answer-large':''}" placeholder="${esc(q.task?.answerFormat||'Write your answer…')}"></textarea>`;
}
function sessionRoot(){return document.getElementById('genericPracticePane')}
function renderQuestion(subject){
 const session=sessions[subject],q=session.questions[session.index],pane=sessionRoot();
 pane.innerHTML=`<div class="quiz-card card">
  <div class="quiz-top"><span>${esc(q.topic)} · ${esc(q.task?.label||'PRACTISE')}</span><b>${session.index+1} / ${session.questions.length}</b></div>
  <div class="quiz-progress"><i style="width:${((session.index+1)/session.questions.length)*100}%"></i></div>
  ${q.task?.instruction?`<p class="task-instruction">${esc(q.task.instruction)}</p>`:''}
  <h2>${esc(q.prompt)}</h2>
  ${q.stimulus?.text?`<div class="context-box">${esc(q.stimulus.text)}</div>`:''}
  ${taskControl(subject,q)}
  <div class="quiz-actions"><button class="primary" id="mcpCheck">Check answer</button><button class="secondary" id="mcpExit">Back</button></div>
  <div id="mcpFeedback"></div>
 </div>`;
 pane.querySelectorAll('[data-mcp-opt]').forEach(b=>b.onclick=()=>{pane.querySelectorAll('.option').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')});
 pane.querySelectorAll('[data-word-tile]').forEach(b=>b.onclick=()=>{const a=document.getElementById('mcpAnswer');a.value=(a.value+' '+b.dataset.wordTile).trim()});
 document.getElementById('mcpListen')?.addEventListener('click',()=>{if('speechSynthesis'in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(q.answer?.accepted?.[0]||q.stimulus?.text||'');u.lang=subject==='french'?'fr-FR':'la';u.rate=.82;speechSynthesis.speak(u)}});
 document.getElementById('mcpCheck').onclick=()=>checkAnswer(subject,q);
 document.getElementById('mcpExit').onclick=()=>renderPractice(subject);
}
function manualReview(subject,q,input){
 const root=document.getElementById('mcpFeedback'),model=q.answer?.accepted?.[0]||'';
 root.innerHTML=`<div class="feedback manual"><p class="eyebrow">REVIEW NEEDED</p><h3>Check this open response carefully.</h3>
  <p><b>Your answer:</b> ${esc(input)}</p>${model?`<div class="model-answer"><b>Teacher example</b><br>${esc(model)}</div>`:''}
  <p>${esc(q.feedback?.short||'Compare the required content and grammar before deciding.')}</p>
  <div class="quiz-actions"><button class="primary" id="mcpManualCorrect">My answer meets the task</button><button class="secondary" id="mcpManualRepair">I need to repair it</button></div></div>`;
 document.getElementById('mcpManualCorrect').onclick=()=>finishMarked(subject,q,true,true,{input,model});
 document.getElementById('mcpManualRepair').onclick=()=>finishMarked(subject,q,false,true,{input,model});
}
async function checkAnswer(subject,q){
 const session=sessions[subject],selected=document.querySelector('#genericPracticePane .option.selected')?.textContent||'',input=(document.getElementById('mcpAnswer')?.value||'').trim();
 if(q.format==='mc_single'&&!selected)return window.LuxApp.toast('Choose an answer first.');
 if(q.format!=='mc_single'&&!input)return window.LuxApp.toast('Write an answer first.');
 const response=selected||input;
 const marker=await getMarker();
 if(marker?.markQuestion){
   const result=marker.markQuestion(q,response);
   if(result.correct===null)return manualReview(subject,q,input||response);
   finishMarked(subject,q,!!result.correct,false,{
     input:response,
     model:Array.isArray(result.expected)?result.expected[0]:result.expected||q.answer?.accepted?.[0]||'',
     missing:result.missing||[],
     extra:result.unexpected||[],
     accentOnly:result.result==='Nearly correct — accents'
   });
   return;
 }
 const result=mark(subject,q,input,selected);
 if(!result.automatic)return manualReview(subject,q,input);
 finishMarked(subject,q,result.correct,false,{input:selected||input,...result});
}
function finishMarked(subject,q,correct,manual,detail={}){
 const session=sessions[subject],transition=record(subject,q,correct,session.mode==='due',manual,!!detail.accentOnly);
 if(correct)session.score++;if(manual)session.manual++;
 if(transition?.strengthened)session.strengthened.add(q.conceptId);
 if(transition?.becameSecure)session.retained.add(q.conceptId);
 const fb=q.feedback||{},root=document.getElementById('mcpFeedback');
 root.innerHTML=`<div class="feedback ${correct?'good':'bad'}"><h3>${correct?(detail.accentOnly?'Correct — add the accents':'Correct'):'Needs repair'}</h3>
 ${detail.input?`<p><b>Your answer:</b> ${esc(detail.input)}</p>`:''}
 ${detail.missing?.length?`<p><b>Missing:</b> ${detail.missing.map(esc).join(', ')}</p>`:''}
 ${detail.extra?.length?`<p><b>Extra:</b> ${detail.extra.map(esc).join(', ')}</p>`:''}
 ${detail.model?`<div class="model-answer"><b>Accepted answer</b><br>${esc(detail.model)}</div>`:''}
 ${fb.short?`<p>${esc(fb.short)}</p>`:''}
 ${fb.remember?`<p class="memory"><b>Remember:</b> ${esc(fb.remember)}</p>`:''}
 ${!correct?'<p class="review-note">This concept will return through spaced review.</p>':''}
 <button class="primary" id="mcpNext">${session.index+1<session.questions.length?'Next':'See result'}</button></div>`;
 document.getElementById('mcpNext').onclick=()=>{session.index++;if(session.index<session.questions.length)renderQuestion(subject);else finishSession(subject)};
}
function finishSession(subject){
 const session=sessions[subject],pct=Math.round(session.score/Math.max(1,session.questions.length)*100),pane=sessionRoot();
 const after=metric(subject,session.topicId),xpBefore=session.xpBefore,xpNow=window.LuxGrowth?.snapshot?.().total||xpBefore;
 let sessionBonus=0;
 if(session.mode==='extra'&&session.score>0)sessionBonus+=window.LuxGrowth?.award?.({subject,type:'extra_training_complete',itemId:`${subject}:${session.topicId}`,windowKey:today()})?.awarded||0;
 if(session.mode==='weak'&&session.score>0)sessionBonus+=window.LuxGrowth?.award?.({subject,type:'weak_area_complete',itemId:`${subject}:${session.topicId||'mixed'}`,windowKey:today()})?.awarded||0;
 const milestoneXP=maybeTopicMilestone(subject,session.topicId,session.beforeMastery,after);
 const finalXP=window.LuxGrowth?.snapshot?.().total||xpNow;
 const gained=Math.max(0,finalXP-xpBefore);
 const masteryChanged=after.value!==session.beforeMastery.value;
 const masteryLine=after.kind==='topic'
   ?`${session.beforeMastery.value}% ${masteryChanged?'→':'—'} ${after.value}%`
   :`${session.beforeMastery.secure} ${masteryChanged?'→':'—'} ${after.secure} secure concepts`;
 pane.innerHTML=`<div class="result-card card training-result">
  <p class="eyebrow">${SUBJECTS[subject].label.toUpperCase()} FOUNDATION</p><h2>Session complete</h2>
  <div class="training-result-grid">
    <div><small>MASTERY</small><strong>${masteryLine}</strong><span>${masteryChanged?'Academic evidence strengthened this area.':'No formal mastery change yet.'}</span></div>
    <div><small>SCHOLAR XP</small><strong>+${gained} XP</strong><span>${sessionBonus?`Includes ${sessionBonus} training bonus.`:'From valid learning evidence.'}</span></div>
    <div><small>CONCEPTS STRENGTHENED</small><strong>${session.strengthened.size}</strong><span>${session.retained.size?`${session.retained.size} retention confirmation${session.retained.size===1?'':'s'}.`:'Later review may still be needed.'}</span></div>
  </div>
  ${milestoneXP?`<div class="milestone-banner"><b>TOPIC MASTERY MILESTONE</b><span>+${milestoneXP} Scholar XP · first time only</span></div>`:''}
  ${!masteryChanged?`<p class="review-note">Good practice. A later review may be needed before this can become secure.</p>`:''}
  <div class="quiz-actions">
    <button class="primary" id="mcpAgain">Continue Training</button>
    <button class="secondary" id="mcpOverview">Back to ${SUBJECTS[subject].label}</button>
    <button class="secondary" id="mcpHome">Home</button>
  </div>
 </div>`;
 document.getElementById('mcpAgain').onclick=()=>startPractice(subject,session.mode,session.questions.length,session.topicId);
 document.getElementById('mcpOverview').onclick=()=>renderPractice(subject);
 document.getElementById('mcpHome').onclick=()=>window.LuxApp?.go?.('home');
}
async function startPractice(subject,mode='mixed',count=15,topicId='all'){
 const pane=document.getElementById('genericPracticePane');
 if(pane){pane.classList.remove('hidden');pane.innerHTML='<div class="loading-panel" role="status"><span class="loading-dot"></span><p>Preparing your questions…</p></div>'}
 if(!(await ensure(subject))){renderPackError(subject,pane,'Practice');return false}
 let qs=[];
 try{qs=await choose(subject,mode,count,topicId)}
 catch(err){console.error('[MasterY8] question load failed',subject,mode,topicId,err);renderPackError(subject,pane,'Practice');return false}
 if(!qs.length){window.LuxApp.toast(mode==='due'?'No reviews are due right now.':'No matching enabled questions are available.');renderPractice(subject);return false}
 sessions[subject]={
   questions:qs,index:0,score:0,manual:0,mode,topicId,
   xpBefore:window.LuxGrowth?.snapshot?.().total||0,
   beforeMastery:metric(subject,topicId),
   strengthened:new Set(),retained:new Set()
 };
 states[subject].sessions++;saveState(subject,states[subject]);
 const opened=await window.SubjectHub?.open?.(subject,'foundation','practice');
 if(opened===false)return false;
 renderQuestion(subject);return true;
}
async function renderLearn(subject){
 const pane=document.getElementById('genericLearnPane');
 pane.innerHTML='<div class="loading-panel" role="status"><span class="loading-dot"></span><p>Loading learning notes…</p></div>';
 if(!(await ensure(subject))){renderPackError(subject,pane,'Learn');return}
 const ts=topics(subject).filter(t=>t.enabledCount>0);
 pane.innerHTML=`<div class="section-title"><div><p class="eyebrow">YEAR 8 FOUNDATION</p><h2>${SUBJECTS[subject].label} Learn</h2></div><span>${ts.length} topics</span></div>
 <div class="note-topic-list">${ts.map(t=>{const p=topicProgress(subject,t.topicId);return `<article class="note-topic"><p class="eyebrow">${p.pct}% SECURE</p><h3>${esc(t.title)}</h3><p>Review the structured teaching notes for this topic.</p><button class="secondary" data-mcp-note="${esc(t.topicId)}">Open notes</button></article>`}).join('')}</div>`;
 pane.querySelectorAll('[data-mcp-note]').forEach(b=>b.onclick=()=>renderNote(subject,b.dataset.mcpNote));
}
async function renderNote(subject,topicId){
 const data=await loadTopic(subject,topicId),n=data.note,pane=document.getElementById('genericLearnPane');
 pane.innerHTML=`<button class="back-link" id="mcpNotesBack">← All ${SUBJECTS[subject].label} topics</button><article class="note-detail">
 <p class="eyebrow">YEAR 8 FOUNDATION</p><h2>${esc(n?.title||data.title)}</h2><p>${esc(n?.overview||'')}</p>
 ${(n?.learningGoals||[]).length?`<h3>Learning goals</h3><ul>${n.learningGoals.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
 ${(n?.mustMemoriseRules||[]).length?`<h3>Must memorise</h3><ul>${n.mustMemoriseRules.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
 ${(n?.mustMemoriseVocabulary||[]).length?`<h3>Key vocabulary</h3><ul>${n.mustMemoriseVocabulary.slice(0,40).map(x=>`<li>${esc(x.stimulus||x.term)} → ${esc(x.answer||x.meaning)}</li>`).join('')}</ul>`:''}
 ${(n?.workedExamples||[]).length?`<h3>Worked examples</h3>${n.workedExamples.slice(0,8).map(x=>`<div class="model-answer"><b>${esc(x.task||x.prompt||'Example')}</b><br>${esc(x.stimulus||'')} ${x.answer?`→ ${esc(x.answer)}`:''}${x.why?`<br><small>${esc(x.why)}</small>`:''}</div>`).join('')}`:''}
 ${(n?.commonMistakes||[]).length?`<h3>Common mistakes</h3><ul>${n.commonMistakes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
 <div class="quiz-actions"><button class="primary" id="mcpTopicPractice">Practise this topic</button></div></article>`;
 document.getElementById('mcpNotesBack').onclick=()=>renderLearn(subject);
 document.getElementById('mcpTopicPractice').onclick=()=>startPractice(subject,'extra',10,topicId);
}
async function renderPractice(subject){
 const pane=document.getElementById('genericPracticePane');
 pane.innerHTML='<div class="loading-panel" role="status"><span class="loading-dot"></span><p>Loading structured practice…</p></div>';
 if(!(await ensure(subject))){renderPackError(subject,pane,'Practice');return}
 const d=dueCount(subject),w=weakCount(subject),ts=topics(subject).filter(t=>t.enabledCount>0);
 const recent=states[subject].history.slice().reverse().find(h=>h.topicId)?.topicId;
 const current=ts.find(t=>t.topicId===recent)||ts[0];
 const cp=current?topicProgress(subject,current.topicId):null;
 pane.innerHTML=`<div class="section-title"><div><p class="eyebrow">FREE TRAINING</p><h2>${SUBJECTS[subject].label} Training Hall</h2></div><span>${d} due · ${w} to revisit</span></div>
 ${current?`<article class="training-focus card-soft">
   <div><p class="eyebrow">CURRENT FOCUS</p><h3>${esc(current.title)}</h3><p>${cp.pct}% secure · ${Math.max(0,cp.total-cp.secure)} concepts still building</p></div>
   <div class="training-focus-actions">
     <button class="primary" data-mcp-current-extra="${esc(current.topicId)}">Extra Practice</button>
     <button class="secondary" data-mcp-current-learn="${esc(current.topicId)}">Continue Topic</button>
   </div>
 </article>`:''}
 <div class="practice-options training-modes">
  <button class="practice-choice" data-mcp-mode="due"><b>Due Review</b><small>${d?`${d} concept${d===1?'':'s'} due`:'Nothing due right now'}</small></button>
  <button class="practice-choice" data-mcp-mode="weak"><b>Review Weak Areas</b><small>${w?`${w} concept${w===1?'':'s'} need confidence`:'No weak queue right now'}</small></button>
  <button class="practice-choice" data-mcp-mode="mixed"><b>Mixed Training</b><small>15-question structured consolidation</small></button>
 </div>
 <div class="section-title training-topic-title"><div><p class="eyebrow">CHOOSE A TOPIC</p><h2>Extra Practice</h2></div><span>${ts.length} topics</span></div>
 <div class="mcp-topic-grid training-topic-grid">${ts.map(t=>{const p=topicProgress(subject,t.topicId);return `<article class="note-topic training-topic-card">
   <div><p class="eyebrow">${p.pct}% SECURE</p><h3>${esc(t.title)}</h3><p>${p.secure}/${p.total} concepts secure</p></div>
   <div class="topic-training-actions"><button class="secondary" data-mcp-topic-learn="${esc(t.topicId)}">Learn</button><button class="primary" data-mcp-topic-extra="${esc(t.topicId)}">Extra Practice</button></div>
  </article>`}).join('')}</div>`;
 pane.querySelector('[data-mcp-mode="due"]').onclick=()=>startPractice(subject,'due',7);
 pane.querySelector('[data-mcp-mode="weak"]').onclick=()=>startPractice(subject,'weak',7);
 pane.querySelector('[data-mcp-mode="mixed"]').onclick=()=>startPractice(subject,'mixed',15);
 pane.querySelector('[data-mcp-current-extra]')?.addEventListener('click',e=>startPractice(subject,'extra',10,e.currentTarget.dataset.mcpCurrentExtra));
 pane.querySelector('[data-mcp-current-learn]')?.addEventListener('click',async e=>{
   await window.SubjectHub.openTopicLearn(subject,e.currentTarget.dataset.mcpCurrentLearn);
 });
 pane.querySelectorAll('[data-mcp-topic-extra]').forEach(b=>b.onclick=()=>startPractice(subject,'extra',10,b.dataset.mcpTopicExtra));
 pane.querySelectorAll('[data-mcp-topic-learn]').forEach(b=>b.onclick=async()=>{
   await window.SubjectHub.openTopicLearn(subject,b.dataset.mcpTopicLearn);
 });
}
async function renderProgress(subject){
 const pane=document.getElementById('genericProgressPane');
 pane.innerHTML='<div class="loading-panel" role="status"><span class="loading-dot"></span><p>Loading progress…</p></div>';
 if(!(await ensure(subject))){renderPackError(subject,pane,'Progress');return}
 const s=masterySummary(subject),ts=topics(subject).filter(t=>t.enabledCount>0);
 pane.innerHTML=`<div class="section-title"><div><p class="eyebrow">FOUNDATION PROGRESS</p><h2>${SUBJECTS[subject].label} mastery</h2></div><span>${s.secure} secure</span></div>
 <div class="progress-stats"><div><b>${s.secure}</b><span>Secure</span></div><div><b>${s.consolidating+s.learning}</b><span>Building</span></div><div><b>${dueCount(subject)}</b><span>Due review</span></div></div>
 <div class="topic-progress">${ts.map(t=>{const p=topicProgress(subject,t.topicId);return `<div class="topic-bar"><div><span>${esc(t.title)}</span><b>${p.pct}%</b></div><div class="bar"><i style="width:${p.pct}%"></i></div></div>`}).join('')}</div>`;
}

window.MasterY8=Object.freeze({
 ensure,topics,renderLearn,renderNote,renderPractice,renderProgress,startPractice,
 dueCount,weakCount,reviewDates,todayStats,masterySummary,state:subject=>states[subject]
});
})();
