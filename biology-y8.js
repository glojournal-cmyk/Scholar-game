
(function(){
'use strict';

const KEY='biologyY8MasteryV1';
const FILES={
  questions:'bio-y8-question-bank.json',
  answers:'bio-y8-answer-bank.json',
  concepts:'bio-y8-concept-bank.json',
  keywords:'bio-y8-keyword-bank.json',
  notes:'bio-y8-notes-by-topic.json',
  diagrams:'bio-y8-diagram-specs.json'
};
const DATA={questions:[],answers:[],concepts:[],keywords:[],notes:[],diagrams:[]};
let ready=false,loading=null,session=null,currentTopic='all';

function fresh(){
 return {
   version:1,
   attempts:{},
   concepts:{},
   history:[],
   sessions:0,
   answered:0,
   correct:0,
   manualReviewed:0,
   milestones:{},
   createdAt:new Date().toISOString()
 };
}
function load(){
 try{
   const x=JSON.parse(localStorage.getItem(KEY)||'null');
   return x&&typeof x==='object'
    ?{...fresh(),...x,attempts:x.attempts||{},concepts:x.concepts||{},history:Array.isArray(x.history)?x.history:[],milestones:x.milestones||{}}
    :fresh();
 }catch{return fresh()}
}
let state=load();
function save(){localStorage.setItem(KEY,JSON.stringify(state))}
function today(){
 const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function addDays(n){
 const d=new Date();d.setDate(d.getDate()+Number(n||0));
 return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function norm(v){return String(v??'').normalize('NFKD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’]/g,"'").replace(/[^\p{L}\p{N}%²+\-./' ]/gu,' ').replace(/\s+/g,' ').trim()}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

async function fetchJson(name){
 const r=await fetch(`./${name}`,{cache:'default'});
 if(!r.ok)throw new Error(`${name}: ${r.status}`);
 return r.json();
}
function renderBiologyError(pane,kind='Practice'){
 if(!pane)return;
 pane.innerHTML=`<div class="load-error"><p class="eyebrow">BIOLOGY FOUNDATION</p><h2>${kind} data could not be loaded.</h2><p>Please retry. Your saved Biology progress is safe.</p><button class="primary" data-bio-retry="${kind.toLowerCase()}">Retry</button></div>`;
}

async function ensureData(){
 if(ready)return true;
 if(loading)return loading;
 loading=(async()=>{
  try{
   const [questions,answers,concepts,keywords,notes,diagrams]=await Promise.all([
     fetchJson(FILES.questions),fetchJson(FILES.answers),fetchJson(FILES.concepts),
     fetchJson(FILES.keywords),fetchJson(FILES.notes),fetchJson(FILES.diagrams)
   ]);
   DATA.questions=questions;DATA.answers=answers;DATA.concepts=concepts;DATA.keywords=keywords;DATA.notes=notes;DATA.diagrams=diagrams;
   ready=true;renderFoundationHome();return true;
  }catch(err){console.error('Biology Y8 data load failed',err);return false}
 })();
 return loading;
}

function enabledQuestions(){return DATA.questions.filter(q=>q.status==='enabled'&&q.subject==='biology'&&q.year===8)}
function topics(){
 const map=new Map();
 DATA.notes.filter(n=>n.status==='enabled'&&n.subject==='biology'&&n.year===8).forEach(n=>map.set(n.topicId,n.title));
 return [...map.entries()].map(([id,title])=>({id,title}));
}
function questionById(id){return DATA.questions.find(q=>q.id===id)}
function conceptFor(id){return DATA.concepts.find(c=>c.id===id)}
function conceptState(id){
 if(!state.concepts[id])state.concepts[id]={stage:'new',hasProductionSuccess:false,nextDue:null,reviewStep:0,lastAt:null,score:0,attempts:0};
 return state.concepts[id];
}
function reviewDates(){return Object.values(state.concepts).map(c=>c?.nextDue).filter(Boolean)}
function dueConceptIds(){
 const k=today();return Object.entries(state.concepts).filter(([id,c])=>c?.nextDue&&c.nextDue<=k&&c.stage!=='secure').map(([id])=>id)
}
function dueQuestions(){
 const ids=new Set(dueConceptIds());
 const out=[];
 ids.forEach(cid=>{
   const candidates=enabledQuestions().filter(q=>q.conceptId===cid);
   const production=candidates.filter(q=>q.gameplay?.recognition===false);
   out.push(...shuffle(production.length?production:candidates).slice(0,1));
 });
 return out;
}
function weakConceptIds(){
 return Object.entries(state.concepts).filter(([id,c])=>c&&c.attempts>0&&c.stage!=='secure'&&(c.lastCorrect===false||c.reviewStep>0)).map(([id])=>id)
}
function weakQuestions(){
 const ids=new Set(weakConceptIds());
 const out=[];
 ids.forEach(cid=>{
   const candidates=enabledQuestions().filter(q=>q.conceptId===cid);
   const production=candidates.filter(q=>q.gameplay?.recognition===false);
   out.push(...shuffle(production.length?production:candidates).slice(0,1));
 });
 return out;
}
function dueCount(){return dueConceptIds().length}
function weakCount(){return weakConceptIds().length}
function masterySummary(){
 const all=DATA.concepts.filter(c=>c.status==='enabled'),stages={new:0,learning:0,consolidating:0,secure:0};
 all.forEach(c=>{const s=state.concepts[c.id]?.stage||'new';stages[s]=(stages[s]||0)+1});
 return {total:all.length,...stages};
}
function topicProgress(topicId){
 const cs=DATA.concepts.filter(c=>c.topicId===topicId&&c.status==='enabled');
 const secure=cs.filter(c=>state.concepts[c.id]?.stage==='secure').length;
 return {total:cs.length,secure,pct:cs.length?Math.round(secure/cs.length*100):0};
}
function scheduleAfterWrong(q,cs){
 const r=q.review?.onWrong||{};
 cs.preWrongStage=cs.stage;
 cs.stage=cs.stage==='new'?'learning':cs.stage;
 cs.recoveryStep=1;
 cs.reviewStep=1;
 cs.nextDue=addDays(r.nextDueDays??2);
}
function scheduleAfterCorrect(q,cs){
 const r=q.review?.onCorrect||{},wrongRule=q.review?.onWrong||{};
 const production=q.gameplay?.recognition===false;
 const wasAwaitingSecure=!!cs.awaitingSecure;
 if(production)cs.hasProductionSuccess=true;
 if(q._isDueReview&&cs.recoveryStep===1){
   cs.recoveryStep=2;cs.reviewStep=2;cs.nextDue=addDays(wrongRule.thenDueDays??7);return;
 }
 if(q._isDueReview&&cs.recoveryStep===2){
   cs.recoveryStep=0;cs.reviewStep=0;delete cs.preWrongStage;
   // The second recovery success can now re-enter the normal consolidation path below.
 }
 if(cs.stage==='new'){
   cs.stage='learning';cs.nextDue=addDays(r.newToLearningDays??2);cs.reviewStep=1;
 }else if(cs.stage==='learning'){
   cs.stage='consolidating';cs.nextDue=addDays(r.learningToConsolidatingDays??7);cs.reviewStep=2;
 }else if(cs.stage==='consolidating'&&wasAwaitingSecure&&q._isDueReview&&cs.hasProductionSuccess){
   cs.stage='secure';cs.nextDue=null;cs.awaitingSecure=false;cs.reviewStep=0;
 }else if(cs.stage==='consolidating'){
   if(cs.hasProductionSuccess){
     // The pack's long consolidation interval must be completed before "secure".
     cs.nextDue=addDays(r.consolidatingToSecureDays??21);cs.reviewStep=3;cs.awaitingSecure=true;
   }else{
     cs.nextDue=addDays(r.learningToConsolidatingDays??7);cs.reviewStep=2;
   }
 }else if(cs.stage==='secure'){
   cs.nextDue=null;
 }
}
function stageRank(s){return ({new:0,learning:1,consolidating:2,secure:3})[s]??0}
function record(q,correct,meta={}){
 const cs=conceptState(q.conceptId),beforeStage=cs.stage;
 cs.attempts++;cs.lastAt=new Date().toISOString();cs.lastCorrect=!!correct;
 cs.score=(Number(cs.score)||0)+(correct?Number(q.gameplay?.masteryWeight||1):0);
 const qForSchedule={...q,_isDueReview:!!meta.isDueReview};
 if(correct)scheduleAfterCorrect(qForSchedule,cs);else scheduleAfterWrong(qForSchedule,cs);
 state.attempts[q.id]={tries:(state.attempts[q.id]?.tries||0)+1,lastAt:new Date().toISOString(),lastCorrect:!!correct,manual:!!meta.manual};
 state.answered++;if(correct)state.correct++;if(meta.manual)state.manualReviewed++;
 state.history.push({at:new Date().toISOString(),day:today(),questionId:q.id,conceptId:q.conceptId,topicId:q.topicId,correct:!!correct,format:q.format,manual:!!meta.manual});
 if(state.history.length>1000)state.history=state.history.slice(-1000);
 save();
 const transition={beforeStage,afterStage:cs.stage,becameSecure:beforeStage!=='secure'&&cs.stage==='secure',strengthened:stageRank(cs.stage)>stageRank(beforeStage)};
 if(correct){
   const xpType=meta.isDueReview?'formal_due_review_correct':beforeStage==='secure'?'practice_repeat_correct':'practice_first_correct';
   window.LuxGrowth?.award?.({subject:'biology',type:xpType,itemId:q.id});
 }
 if(transition.becameSecure)window.LuxGrowth?.award?.({subject:'biology',type:'retention_confirmed',itemId:`biology:${q.conceptId}`,windowKey:'ever'});
 document.dispatchEvent(new CustomEvent('bio:y8-progress',{detail:{transition,conceptId:q.conceptId,topicId:q.topicId}}));
 return transition;
}
function metric(topicId='all'){
 if(topicId&&topicId!=='all'){const p=topicProgress(topicId);return {kind:'topic',topicId,value:p.pct,secure:p.secure,total:p.total}}
 const m=masterySummary();return {kind:'subject',value:m.secure,secure:m.secure,total:m.total}
}
function maybeTopicMilestone(topicId,before,after){
 if(!topicId||topicId==='all'||before.value>=85||after.value<85)return 0;
 const key=`topic85:${topicId}`;if(state.milestones[key])return 0;
 state.milestones[key]={earnedAt:new Date().toISOString(),value:after.value};save();
 return window.LuxGrowth?.award?.({subject:'biology',type:'topic_mastery_first',itemId:`biology:${topicId}`,windowKey:'ever'})?.awarded||0;
}
function splitItems(v){return norm(v).split(/\s*(?:,|;|\/|\band\b|\n)\s*/).filter(Boolean)}
function markAutomatic(q,input,selected){
 const a=q.answer||{};
 if(q.format==='mc_single')return {automatic:true,correct:norm(selected)===norm(a.correctOption),model:a.correctOption};
 if(q.format==='typed_exact'||q.format==='typed_short'){
   const accepted=a.accepted||[];return {automatic:true,correct:accepted.some(x=>norm(x)===norm(input)),model:accepted[0]||''};
 }
 if(q.format==='unordered_set'){
   const got=new Set(splitItems(input)),groups=a.requiredGroups||[];
   const missing=groups.filter(g=>!(g.alternatives||[]).some(x=>got.has(norm(x)))).map(g=>g.label);
   return {automatic:true,correct:missing.length===0,missing,model:groups.map(g=>g.label).join(', ')};
 }
 if(q.format==='sequence'){
   const got=splitItems(input),target=(a.items||[]).map(norm);
   return {automatic:true,correct:got.length===target.length&&got.every((x,i)=>x===target[i]),model:(a.items||[]).join(' → ')};
 }
 if(q.format==='calculation'){
   const val=Number(String(input).match(/-?\d+(?:\.\d+)?/)?.[0]);
   const tol=Number(a.tolerance??0),numOk=Number.isFinite(val)&&Math.abs(val-Number(a.value))<=tol;
   const unitOk=!(a.units||[]).length||(a.units||[]).some(u=>norm(input).includes(norm(u)));
   return {automatic:true,correct:numOk&&unitOk,model:a.working||`${a.value} ${(a.units||[])[0]||''}`};
 }
 return {automatic:false,correct:null,model:a.modelAnswer||''};
}

function renderManualChecklist(q,input){
 const a=q.answer||{},points=a.markPoints||[];
 const root=document.getElementById('bioFeedback');
 root.innerHTML=`<div class="feedback manual"><p class="eyebrow">SELF-CHECK</p><h3>Compare your answer with the mark points.</h3>
 <p><b>Your answer:</b> ${esc(input)}</p>
 <div class="bio-mark-points">${points.map((p,i)=>`<label><input type="checkbox" data-mp="${esc(p.id||i)}"> ${esc(p.text)}</label>`).join('')}</div>
 ${a.modelAnswer?`<div class="model-answer"><b>Model answer</b><br>${esc(a.modelAnswer)}</div>`:''}
 <div class="quiz-actions"><button class="primary" id="bioManualCorrect">I included all required points</button><button class="secondary" id="bioManualWrong">I need to review</button></div></div>`;
 document.getElementById('bioManualCorrect').onclick=()=>{
   const boxes=[...root.querySelectorAll('[data-mp]')],all=boxes.length?boxes.every(b=>b.checked):true;
   if(!all)return window.LuxApp.toast('Tick each mark point you genuinely included.');
   finishMarked(q,true,true);
 };
 document.getElementById('bioManualWrong').onclick=()=>finishMarked(q,false,true);
}
function renderManualGeneric(q,input){
 const a=q.answer||{},root=document.getElementById('bioFeedback');
 let model='';
 if(a.pairs)model=a.pairs.map(p=>`${p.left} → ${p.right}`).join('<br>');
 else if(a.categories)model=Object.entries(a.categories).map(([k,v])=>`${esc(k)}: ${esc(v.join(', '))}`).join('<br>');
 else if(a.requiredLabels)model=esc(a.requiredLabels.join(', '));
 root.innerHTML=`<div class="feedback manual"><p class="eyebrow">SELF-CHECK</p><h3>Check your completed response.</h3>
 <p><b>Your response:</b> ${esc(input||'Completed interactively / on paper')}</p>
 ${model?`<div class="model-answer"><b>Required solution</b><br>${model}</div>`:''}
 <div class="quiz-actions"><button class="primary" id="bioManualCorrect">My response matches</button><button class="secondary" id="bioManualWrong">I need to review</button></div></div>`;
 document.getElementById('bioManualCorrect').onclick=()=>finishMarked(q,true,true);
 document.getElementById('bioManualWrong').onclick=()=>finishMarked(q,false,true);
}

function sessionPool(mode='mixed',topicId='all'){
 let p=enabledQuestions();
 if(topicId!=='all')p=p.filter(q=>q.topicId===topicId);
 if(mode==='due')return dueQuestions().filter(q=>topicId==='all'||q.topicId===topicId);
 if(mode==='weak')return weakQuestions().filter(q=>topicId==='all'||q.topicId===topicId);
 if(mode==='quick')p=p.filter(q=>q.gameplay?.eligibleModes?.includes('quick-quiz')||q.gameplay?.eligibleModes?.includes('warm-up'));
 if(mode==='production'||mode==='extra')p=p.filter(q=>q.gameplay?.recognition===false);
 return p;
}
function choose(mode,count,topicId='all'){
 const p=sessionPool(mode,topicId),unseen=[],seen=[];
 p.forEach(q=>(state.attempts[q.id]?seen:unseen).push(q));
 return [...shuffle(unseen),...shuffle(seen)].slice(0,Math.min(count,p.length));
}
async function startPractice(mode='mixed',count=10,topicId='all'){
 const pane=document.getElementById('genericPracticePane');
 if(pane){pane.classList.remove('hidden');pane.innerHTML='<div class="loading-panel" role="status"><span class="loading-dot"></span><p>Preparing Biology questions…</p></div>'}
 if(!(await ensureData())){renderBiologyError(pane,'Practice');return false}
 const qs=choose(mode,count,topicId);
 if(!qs.length){window.LuxApp.toast(mode==='due'?'No Biology reviews are due right now.':'No matching Biology questions are available.');renderFoundationHome();return false}
 session={
   questions:qs,index:0,score:0,manual:0,mode,topicId,isDueReview:mode==='due',
   xpBefore:window.LuxGrowth?.snapshot?.().total||0,
   beforeMastery:metric(topicId),
   strengthened:new Set(),retained:new Set()
 };state.sessions++;save();
 const opened=await window.SubjectHub?.open?.('biology','foundation','practice');
 if(opened===false)return false;
 document.getElementById('genericPracticePane')?.classList.remove('hidden');
 renderQuestion();return true;
}
function answerControl(q){
 if(q.format==='mc_single')return `<div class="options">${(q.options||[]).map(o=>`<button class="option" data-bio-opt="${esc(o)}">${esc(o)}</button>`).join('')}</div>`;
 if(['matching','sorting','diagram_label'].includes(q.format))return `<textarea id="bioAnswer" class="answer-input bio-answer-large" placeholder="Complete this task on paper or type your arrangement here, then self-check."></textarea>`;
 return `<textarea id="bioAnswer" class="answer-input ${['mark_points','practical_design','extended_response'].includes(q.format)?'bio-answer-large':''}" placeholder="${esc(q.task?.answerFormat||'Write your answer…')}"></textarea>`;
}
function renderQuestion(){
 if(!session)return;
 const q=session.questions[session.index],pane=document.getElementById('genericPracticePane');
 pane.innerHTML=`<div class="quiz-card card">
  <div class="quiz-top"><span>${esc(q.topic)} · ${esc(q.task?.label||'PRACTISE')}</span><b>${session.index+1} / ${session.questions.length}</b></div>
  <div class="quiz-progress"><i style="width:${((session.index+1)/session.questions.length)*100}%"></i></div>
  <h2>${esc(q.prompt)}</h2>
  ${q.stimulus?.text&&norm(q.stimulus.text)!==norm(q.prompt)?`<div class="context-box">${esc(q.stimulus.text)}</div>`:''}
  ${answerControl(q)}
  <div class="quiz-actions"><button class="primary" id="bioCheck">Check answer</button><button class="secondary" id="bioExit">Back to Biology</button></div>
  <div id="bioFeedback"></div>
 </div>`;
 pane.querySelectorAll('[data-bio-opt]').forEach(b=>b.onclick=()=>{pane.querySelectorAll('.option').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')});
 document.getElementById('bioCheck').onclick=()=>check(q);
 document.getElementById('bioExit').onclick=()=>renderFoundationHome();
}
function check(q){
 const selected=document.querySelector('#genericPracticePane .option.selected')?.textContent||'';
 const input=(document.getElementById('bioAnswer')?.value||'').trim();
 if(q.format==='mc_single'&&!selected)return window.LuxApp.toast('Choose one answer.');
 if(q.format!=='mc_single'&&!input&&!['diagram_label'].includes(q.format))return window.LuxApp.toast('Write or complete your answer first.');
 const auto=markAutomatic(q,input,selected);
 if(auto.automatic){
   finishMarked(q,auto.correct,false,{input:selected||input,model:auto.model,missing:auto.missing||[]});
 }else if(['mark_points','practical_design','extended_response'].includes(q.format)||q.answer?.manualReviewFallback){
   renderManualChecklist(q,input);
 }else renderManualGeneric(q,input);
}
function finishMarked(q,correct,manual=false,detail={}){
 const transition=record(q,correct,{manual,isDueReview:!!session?.isDueReview});
 if(correct)session.score++;if(manual)session.manual++;
 if(transition?.strengthened)session.strengthened.add(q.conceptId);
 if(transition?.becameSecure)session.retained.add(q.conceptId);
 const root=document.getElementById('bioFeedback'),fb=q.feedback||{};
 root.innerHTML=`<div class="feedback ${correct?'good':'bad'}"><h3>${correct?'Correct / met.':'Review this concept.'}</h3>
 ${detail.input?`<p><b>Your answer:</b> ${esc(detail.input)}</p>`:''}
 ${detail.missing?.length?`<p><b>Missing:</b> ${detail.missing.map(esc).join(', ')}</p>`:''}
 ${detail.model?`<div class="model-answer"><b>Accepted / model answer</b><br>${esc(detail.model)}</div>`:''}
 ${fb.short?`<p>${esc(fb.short)}</p>`:''}
 ${fb.remember?`<p class="memory"><b>Remember:</b> ${esc(fb.remember)}</p>`:''}
 ${!correct?'<p class="review-note">This concept has been scheduled for review using the pack’s spaced-review rule.</p>':''}
 <button class="primary" id="bioNext">${session.index+1<session.questions.length?'Next question':'See result'}</button></div>`;
 document.getElementById('bioNext').onclick=next;
}
function next(){if(++session.index<session.questions.length)renderQuestion();else finishSession()}
function finishSession(){
 const pct=Math.round(session.score/Math.max(1,session.questions.length)*100),pane=document.getElementById('genericPracticePane');
 const after=metric(session.topicId);
 let sessionBonus=0;
 if(session.mode==='extra'&&session.score>0)sessionBonus+=window.LuxGrowth?.award?.({subject:'biology',type:'extra_training_complete',itemId:`biology:${session.topicId}`,windowKey:today()})?.awarded||0;
 if(session.mode==='weak'&&session.score>0)sessionBonus+=window.LuxGrowth?.award?.({subject:'biology',type:'weak_area_complete',itemId:`biology:${session.topicId||'mixed'}`,windowKey:today()})?.awarded||0;
 const milestoneXP=maybeTopicMilestone(session.topicId,session.beforeMastery,after);
 const xpNow=window.LuxGrowth?.snapshot?.().total||session.xpBefore,gained=Math.max(0,xpNow-session.xpBefore);
 const changed=after.value!==session.beforeMastery.value;
 const masteryLine=after.kind==='topic'?`${session.beforeMastery.value}% ${changed?'→':'—'} ${after.value}%`:`${session.beforeMastery.secure} ${changed?'→':'—'} ${after.secure} secure concepts`;
 pane.innerHTML=`<div class="result-card card training-result"><p class="eyebrow">BIOLOGY FOUNDATION</p><h2>Session complete</h2>
 <div class="training-result-grid">
  <div><small>MASTERY</small><strong>${masteryLine}</strong><span>${changed?'Academic evidence strengthened this area.':'No formal mastery change yet.'}</span></div>
  <div><small>SCHOLAR XP</small><strong>+${gained} XP</strong><span>${sessionBonus?`Includes ${sessionBonus} training bonus.`:'From valid learning evidence.'}</span></div>
  <div><small>CONCEPTS STRENGTHENED</small><strong>${session.strengthened.size}</strong><span>${session.retained.size?`${session.retained.size} retention confirmation${session.retained.size===1?'':'s'}.`:'Later review may still be needed.'}</span></div>
 </div>
 ${milestoneXP?`<div class="milestone-banner"><b>TOPIC MASTERY MILESTONE</b><span>+${milestoneXP} Scholar XP · first time only</span></div>`:''}
 ${!changed?'<p class="review-note">Good practice. A later review may be needed before this can become secure.</p>':''}
 <div class="quiz-actions"><button class="primary" id="bioAgain">Continue Training</button><button class="secondary" id="bioHome">Back to Biology</button><button class="secondary" id="bioAppHome">Home</button></div></div>`;
 document.getElementById('bioAgain').onclick=()=>startPractice(session.mode,session.questions.length,session.topicId);
 document.getElementById('bioHome').onclick=()=>renderFoundationHome();
 document.getElementById('bioAppHome').onclick=()=>window.LuxApp?.go?.('home');
}
function renderFoundationHome(){
 const pane=document.getElementById('genericPracticePane');if(!pane)return;
 if(!ready){pane.innerHTML=`<div class="loading-panel" role="status"><span class="loading-dot"></span><p>Preparing Biology Foundation Review…</p></div>`;ensureData().then(ok=>ok?renderFoundationHome():renderBiologyError(pane,'Practice'));return}
 const d=dueCount(),w=weakCount(),ts=topics();
 const recent=state.history.slice().reverse().find(h=>h.topicId)?.topicId;
 const current=ts.find(t=>t.id===recent)||ts[0],cp=current?topicProgress(current.id):null;
 pane.innerHTML=`<div class="section-title"><div><p class="eyebrow">FREE TRAINING</p><h2>Biology Training Hall</h2></div><span>${d} due · ${w} to revisit</span></div>
 ${current?`<article class="training-focus card-soft">
  <div><p class="eyebrow">CURRENT FOCUS</p><h3>${esc(current.title)}</h3><p>${cp.pct}% secure · ${Math.max(0,cp.total-cp.secure)} concepts still building</p></div>
  <div class="training-focus-actions"><button class="primary" data-bio-current-extra="${esc(current.id)}">Extra Practice</button><button class="secondary" data-bio-current-learn="${esc(current.id)}">Continue Topic</button></div>
 </article>`:''}
 <div class="practice-options training-modes">
  <button class="practice-choice" data-bio-mode="due"><b>Due Review</b><small>${d?`${d} concept${d===1?'':'s'} due`:'Nothing due right now'}</small></button>
  <button class="practice-choice" data-bio-mode="weak"><b>Review Weak Areas</b><small>${w?`${w} concept${w===1?'':'s'} need confidence`:'No weak queue right now'}</small></button>
  <button class="practice-choice" data-bio-mode="mixed"><b>Mixed Training</b><small>15-question structured consolidation</small></button>
 </div>
 <div class="section-title training-topic-title"><div><p class="eyebrow">CHOOSE A TOPIC</p><h2>Extra Practice</h2></div><span>${ts.length} topics</span></div>
 <div class="bio-topic-practice training-topic-grid">${ts.map(t=>{const pr=topicProgress(t.id);return `<article class="note-topic training-topic-card">
   <div><p class="eyebrow">${pr.pct}% SECURE</p><h3>${esc(t.title)}</h3><p>${pr.secure}/${pr.total} concepts secure</p></div>
   <div class="topic-training-actions"><button class="secondary" data-bio-topic-learn="${esc(t.id)}">Learn</button><button class="primary" data-bio-topic-extra="${esc(t.id)}">Extra Practice</button></div>
  </article>`}).join('')}</div>`;
 pane.querySelector('[data-bio-mode="due"]').onclick=()=>startPractice('due',7,'all');
 pane.querySelector('[data-bio-mode="weak"]').onclick=()=>startPractice('weak',7,'all');
 pane.querySelector('[data-bio-mode="mixed"]').onclick=()=>startPractice('mixed',15,'all');
 pane.querySelector('[data-bio-current-extra]')?.addEventListener('click',e=>startPractice('extra',10,e.currentTarget.dataset.bioCurrentExtra));
 pane.querySelector('[data-bio-current-learn]')?.addEventListener('click',async e=>{
   await window.SubjectHub.openTopicLearn('biology',e.currentTarget.dataset.bioCurrentLearn);
 });
 pane.querySelectorAll('[data-bio-topic-extra]').forEach(b=>b.onclick=()=>startPractice('extra',10,b.dataset.bioTopicExtra));
 pane.querySelectorAll('[data-bio-topic-learn]').forEach(b=>b.onclick=async()=>{
   await window.SubjectHub.openTopicLearn('biology',b.dataset.bioTopicLearn);
 });
}
function renderLearn(){
 const pane=document.getElementById('genericLearnPane');if(!pane)return;
 if(!ready){pane.innerHTML=`<div class="unavailable-pane"><h2>Preparing Biology notes…</h2></div>`;return}
 pane.innerHTML=`<div class="section-title"><div><p class="eyebrow">YEAR 8 FOUNDATION REVIEW</p><h2>Biology Learn</h2></div><span>${DATA.notes.length} topics</span></div>
 <div class="note-topic-list">${DATA.notes.map(n=>`<article class="note-topic"><p class="eyebrow">FOUNDATION</p><h3>${esc(n.title)}</h3><p>${esc(n.overview)}</p><button class="secondary" data-bio-note="${esc(n.topicId)}">Open notes</button></article>`).join('')}</div>`;
 pane.querySelectorAll('[data-bio-note]').forEach(b=>b.onclick=()=>renderNote(b.dataset.bioNote));
}
function renderNote(topicId){
 const n=DATA.notes.find(x=>x.topicId===topicId),pane=document.getElementById('genericLearnPane');if(!n)return;
 pane.innerHTML=`<button class="back-link" id="bioNotesBack">← All Biology notes</button><article class="note-detail">
 <p class="eyebrow">YEAR 8 FOUNDATION</p><h2>${esc(n.title)}</h2><p>${esc(n.overview)}</p>
 <h3>Learning goals</h3><ul>${(n.learningGoals||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
 <h3>Must memorise</h3><ul>${(n.mustMemoriseRules||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>
 ${(n.mustMemoriseVocabulary||[]).length?`<h3>Key vocabulary</h3><ul>${n.mustMemoriseVocabulary.map(x=>`<li><b>${esc(x.term)}</b> — ${esc(x.meaning)}</li>`).join('')}</ul>`:''}
 ${(n.workedExamples||[]).length?`<h3>Worked example</h3>${n.workedExamples.map(x=>`<div class="model-answer"><b>${esc(x.prompt)}</b><br>${esc(x.answer)}</div>`).join('')}`:''}
 ${(n.commonMistakes||[]).length?`<h3>Common mistakes</h3><ul>${n.commonMistakes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
 <div class="quiz-actions"><button class="primary" id="bioTopicPractice">Practise this topic</button></div></article>`;
 document.getElementById('bioNotesBack').onclick=renderLearn;
 document.getElementById('bioTopicPractice').onclick=()=>startPractice('extra',10,topicId);
}
function renderProgress(){
 const pane=document.getElementById('genericProgressPane');if(!pane)return;
 const s=masterySummary();
 pane.innerHTML=`<div class="section-title"><div><p class="eyebrow">FOUNDATION PROGRESS</p><h2>Biology mastery</h2></div><span>${s.secure} secure</span></div>
 <div class="progress-stats"><div><b>${s.secure}</b><span>Secure concepts</span></div><div><b>${s.consolidating}</b><span>Consolidating</span></div><div><b>${dueCount()}</b><span>Due review</span></div></div>
 <div class="topic-progress">${topics().map(t=>{const pr=topicProgress(t.id);return `<div class="topic-bar"><div><span>${esc(t.title)}</span><b>${pr.pct}%</b></div><div class="bar"><i style="width:${pr.pct}%"></i></div></div>`}).join('')}</div>`;
}
function renderPlay(){
 const pane=document.getElementById('genericPlayPane');if(!pane)return;
 pane.innerHTML=`<div class="unavailable-pane"><p class="eyebrow">PLAY</p><h2>Biology games are not connected yet</h2><p>Foundation Biology Practice is active. No separate verified Biology game engine is bundled, so Play stays unavailable rather than turning ordinary questions into a fake game.</p></div>`;
}
function todayStats(){
 const k=today(),rows=state.history.filter(h=>h.day===k);
 return {answers:rows.length,correct:rows.filter(h=>h.correct).length,due:dueCount(),weak:weakCount(),loaded:ready};
}

window.BiologyY8=Object.freeze({
 KEY,ensureData,renderLearn,renderNote,renderFoundationHome,renderProgress,renderPlay,startPractice,dueCount,weakCount,reviewDates,todayStats,masterySummary,state:()=>state,ready:()=>ready
});
})();
