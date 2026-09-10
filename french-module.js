
(function(){
'use strict';
const KEY='monJardinFrancais.progress.v2';
const BASES=['./','../French-Revision/','/French-Revision/'];
const DATA={questions:[],vocab:[],writing:[],notes:[]};
let progress=loadProgress(),session=null,vocabRows=[],writingIndex=0,dataReady=false,loadPromise=null;

function fresh(){return {attempts:{},sessions:0,correct:0,answered:0,almost:0,streak:0,lastDay:null,writing:{},history:[],spelling:{},createdAt:Date.now(),markingVersion:2}}
function loadProgress(){try{const p=JSON.parse(localStorage.getItem(KEY)||'{}');return {...fresh(),...p,attempts:p.attempts||{},writing:p.writing||{},history:Array.isArray(p.history)?p.history:[],spelling:p.spelling||{}}}catch{return fresh()}}
function save(){localStorage.setItem(KEY,JSON.stringify(progress))}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function addActivity(x){progress.history.push({at:Date.now(),day:today(),...x});if(progress.history.length>1200)progress.history=progress.history.slice(-1200)}
function normaliseBasic(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase().replace(/[’]/g,"'").replace(/[.,!?;:()"]/g,' ').replace(/\s+/g,' ').trim()}
function strictSpell(v){return String(v||'').normalize('NFC').toLowerCase().replace(/[’]/g,"'").trim().replace(/\s+/g,' ')}
async function loadJson(file){
 let last;
 for(const base of BASES){
   try{const r=await fetch(base+file,{cache:'default'});if(r.ok)return await r.json();last=new Error(`${base+file}: ${r.status}`)}catch(e){last=e}
 }
 throw last||new Error(file);
}
function loadMarker(){
 if(window.FrenchReferenceMarker)return Promise.resolve();
 return new Promise(resolve=>{
   const s=document.createElement('script');s.src='../French-Revision/reference-marker.js';s.onload=resolve;s.onerror=()=>resolve();document.head.appendChild(s);
 });
}
async function ensureData(){
 if(dataReady)return true;if(loadPromise)return loadPromise;
 loadPromise=(async()=>{
  const status=document.getElementById('frenchLoadStatus');if(status)status.textContent='Preparing French learning tools…';
  try{
   await loadMarker();
   const [q,v,w,n]=await Promise.all([loadJson('question-bank.json'),loadJson('vocab-bank.json'),loadJson('writing-bank.json'),loadJson('notes-by-section.json')]);
   DATA.questions=q;DATA.vocab=v;DATA.writing=w;DATA.notes=n;vocabRows=[...v];dataReady=true;
   if(status)status.textContent='French learning tools ready.';
   hydrate();return true;
  }catch(e){
   console.error(e);if(status)status.textContent='French learning tools are temporarily unavailable.';
   return false;
  }
 })();
 return loadPromise;
}
function enabled(){return DATA.questions.filter(q=>q.enabledByDefault===true)}
function dueCount(){return Object.values(progress.attempts).filter(x=>x.status==='wrong'&&(x.dueAt||0)<=Date.now()).length}
function hydrate(){
 const sections=[...new Map(enabled().map(q=>[q.section,q.topic])).entries()].sort((a,b)=>Number(a[0])-Number(b[0]));
 const sel=document.getElementById('frenchTopic');sel.innerHTML='<option value="all">All learned topics</option>'+sections.map(([s,n])=>`<option value="${s}">${s}. ${esc(n)}</option>`).join('');
 const vs=[...new Map(DATA.vocab.map(v=>[v.section,v.topic])).entries()].sort((a,b)=>Number(a[0])-Number(b[0]));
 document.getElementById('frenchVocabTopic').innerHTML='<option value="all">All topics</option>'+vs.map(([s,n])=>`<option value="${s}">${s}. ${esc(n)}</option>`).join('');
 renderHome();renderVocab();renderWriting();renderProgress();renderSpellingSetup();
}
function frenchView(id){
 document.querySelectorAll('#frenchScreen .french-view').forEach(x=>x.classList.toggle('hidden',x.id!==id));
 document.querySelectorAll('#frenchScreen [data-french-view]').forEach(x=>x.classList.toggle('active',x.dataset.frenchView===id));
 if(id==='frenchHome')renderHome();if(id==='frenchVocab')renderVocab();if(id==='frenchWriting')renderWriting();if(id==='frenchProgress')renderProgress();if(id==='frenchSpelling')renderSpellingSetup();
}
function renderHome(){
 if(!dataReady)return;
 const e=enabled();
 document.getElementById('frenchHomeStats').innerHTML=`<div><b>Practice</b><span>Focused session</span></div><div><b>${weakCount()}</b><span>To revisit</span></div><div><b>${dueCount()}</b><span>Due review</span></div>`;
 const groups=[...new Map(e.map(q=>[q.section,q.topic])).entries()].slice(0,12);
 document.getElementById('frenchTopicCards').innerHTML=groups.map(([s,n])=>`<button class="learning-card" data-fr-sec="${s}"><span>${String(s).padStart(2,'0')}</span><h3>${esc(n)}</h3><p>Focused topic practice</p><small>Open practice</small></button>`).join('');
 document.querySelectorAll('[data-fr-sec]').forEach(b=>b.onclick=()=>startQuiz(b.dataset.frSec,10,false));
}
function smartMark(q,input,selected){
 if(q.autoMarkConfidence==='medium'||q.autoMarkConfidence==='manual_review')return {verdict:'manual',correct:null,reason:'This answer needs human review and carries no penalty.'};
 if(window.FrenchReferenceMarker&&q.marking){
   try{const base=window.FrenchReferenceMarker.mark(q.marking,input,selected);return {...base,verdict:base.correct===true?'correct':'wrong'}}catch(e){console.warn('Reference marker fallback',e)}
 }
 if(q.type==='choice'||q.options?.length){
   const target=normaliseBasic(q.displayAnswer||q.answer||'');return {verdict:normaliseBasic(selected)===target?'correct':'wrong',correct:normaliseBasic(selected)===target};
 }
 const accepted=q.marking?.accepted||[q.displayAnswer].filter(Boolean);
 const ok=accepted.some(a=>normaliseBasic(a)===normaliseBasic(input));return {verdict:ok?'correct':'wrong',correct:ok};
}
function startQuiz(sec='all',count=10,reviewOnly=false){
 if(!dataReady)return;
 const now=Date.now(),base=enabled().filter(q=>sec==='all'||String(q.section)===String(sec));
 let questions;
 if(reviewOnly)questions=shuffle(base.filter(q=>progress.attempts[q.id]?.status==='wrong'&&(progress.attempts[q.id]?.dueAt||0)<=now)).slice(0,count);
 else{
   const unseen=[],due=[],old=[];
   base.forEach(q=>{const a=progress.attempts[q.id];if(!a)unseen.push(q);else if(a.status==='wrong'&&(a.dueAt||0)<=now)due.push(q);else old.push(q)});
   questions=[...shuffle(unseen),...shuffle(due),...shuffle(old)].slice(0,Math.min(count,base.length));
 }
 if(!questions.length)return window.LuxApp.toast(reviewOnly?'No French reviews are due today.':'No French questions are available.');
 session={questions,index:0,score:0,manual:0,sec,reviewOnly};progress.sessions++;save();frenchView('frenchQuiz');renderQuestion();
}
function renderQuestion(){
 const q=session.questions[session.index],choice=q.type==='choice'||q.options?.length,box=document.getElementById('frenchQuizBox');
 box.innerHTML=`<div class="quiz-top"><span>${esc(q.topic)} · ${esc(q.category||'Practice')}</span><b>${session.index+1} / ${session.questions.length}</b></div><div class="quiz-progress"><i style="width:${((session.index+1)/session.questions.length)*100}%"></i></div>
 <h2>${esc(q.prompt)}</h2>${q.context?`<div class="context-box">${esc(q.context)}</div>`:''}
 ${choice?`<div class="options">${(q.options||[]).map(o=>`<button class="option" data-fr-opt="${esc(o)}">${esc(o)}</button>`).join('')}</div>`:`<input id="frenchAnswer" class="answer-input" autocomplete="off" placeholder="Écris ta réponse ici…">`}
 <div class="quiz-actions"><button class="primary" id="frenchCheck">Vérifier</button><button class="secondary" id="frenchSpeak">🔈 Écouter</button><button class="secondary" id="frenchPause">Pause</button></div><div id="frenchFeedback"></div>`;
 box.querySelectorAll('[data-fr-opt]').forEach(b=>b.onclick=()=>{box.querySelectorAll('.option').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')});
 document.getElementById('frenchCheck').onclick=checkAnswer;document.getElementById('frenchSpeak').onclick=()=>speak(q.prompt);document.getElementById('frenchPause').onclick=()=>frenchView('frenchHome');
 document.getElementById('frenchAnswer')?.addEventListener('keydown',e=>{if(e.key==='Enter')checkAnswer()});
}
function checkAnswer(){
 const q=session.questions[session.index],choice=q.type==='choice'||q.options?.length,b=document.querySelector('#frenchQuizBox .option.selected'),input=document.getElementById('frenchAnswer')?.value||'',selected=b?.textContent||'';
 if(choice&&!selected)return window.LuxApp.toast('Choisis une réponse.');if(!choice&&!input.trim())return window.LuxApp.toast('Écris une réponse.');
 const result=smartMark(q,input,selected),prev=progress.attempts[q.id]||{tries:0};prev.tries++;
 progress.answered++;
 if(result.verdict==='correct'){session.score++;progress.correct++;prev.status='correct';prev.dueAt=null;window.LuxGrowth?.award({subject:'french',type:session.reviewOnly?'formal_due_review_correct':'practice_first_correct',itemId:q.id})}
 else if(result.verdict==='manual'){session.manual++;prev.status='review';prev.dueAt=null}
 else{prev.status='wrong';prev.dueAt=Date.now()+48*60*60*1000}
 prev.lastAt=Date.now();prev.lastVerdict=result.verdict;progress.attempts[q.id]=prev;addActivity({kind:'question',id:q.id,section:q.section,topic:q.topic,correct:result.verdict==='correct',verdict:result.verdict});save();
 const ex=q.explanation||{},fb=document.getElementById('frenchFeedback');
 fb.innerHTML=`<div class="feedback ${result.verdict==='correct'?'good':result.verdict==='manual'?'manual':'bad'}"><h3>${result.verdict==='correct'?'Correct.':result.verdict==='manual'?'Human review — no penalty.':'À revoir · Review'}</h3>
 <div class="model-answer"><b>Réponse enseignée</b><br>${esc(q.displayAnswer||'Compare with the teacher model.')}</div>
 ${ex.short?`<p>${esc(ex.short)}</p>`:''}${ex.remember?`<p class="memory"><b>À retenir:</b> ${esc(ex.remember)}</p>`:''}
 ${result.verdict==='wrong'?'<p class="review-note">Saved for later review rather than immediately repeated.</p>':''}
 <button class="primary" id="frenchNext">${session.index+1<session.questions.length?'Question suivante':'Voir le résultat'}</button></div>`;
 document.getElementById('frenchCheck').disabled=true;document.getElementById('frenchNext').onclick=nextQuestion;
}
function nextQuestion(){if(++session.index<session.questions.length)renderQuestion();else finish()}
function finish(){
 const graded=session.questions.length-session.manual,pct=graded?Math.round(session.score/graded*100):100;
 if(pct>=80)window.LuxGrowth?.award({subject:'french',type:'quiz_complete_80',itemId:`${session.sec}:${today()}`});
 if(pct>=90)window.LuxGrowth?.award({subject:'french',type:'quiz_bonus_90',itemId:`${session.sec}:${today()}`});
 document.getElementById('frenchQuizBox').innerHTML=`<div class="result-card"><p class="eyebrow">SÉANCE TERMINÉE</p><h2>${pct>=80?'Très bon travail.':'Continue doucement.'}</h2><div class="big-score">${pct}%</div><p>${session.score} correct · ${session.manual} no-penalty manual</p><div class="quiz-actions"><button class="primary" id="frAgain">Nouvelle séance</button><button class="secondary" id="frBack">French home</button></div></div>`;
 document.getElementById('frAgain').onclick=()=>startQuiz(session.sec,session.questions.length,session.reviewOnly);document.getElementById('frBack').onclick=()=>frenchView('frenchHome');renderHome();renderProgress();
}
function speak(text){if('speechSynthesis'in window){speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='fr-FR';u.rate=.85;speechSynthesis.speak(u)}}
function renderVocab(){
 if(!dataReady)return;
 const s=(document.getElementById('frenchVocabSearch').value||'').trim().toLowerCase(),sec=document.getElementById('frenchVocabTopic').value;
 const rows=DATA.vocab.filter(v=>(sec==='all'||String(v.section)===sec)&&(!s||v.french.toLowerCase().includes(s)||v.english.toLowerCase().includes(s)));
 document.getElementById('frenchVocabCount').textContent=`${rows.length} / ${DATA.vocab.length} learned entries`;
 document.getElementById('frenchVocabList').innerHTML=rows.slice(0,180).map(v=>`<button class="vocab-row speak-row" data-speak="${esc(v.french)}"><b>${esc(v.french)}</b><span>${esc(v.english)}</span><small>${esc(v.topic)}</small></button>`).join('');
 document.querySelectorAll('#frenchVocabList [data-speak]').forEach(b=>b.onclick=()=>speak(b.dataset.speak));
}
function renderWriting(){
 if(!dataReady)return;
 const list=document.getElementById('frenchWritingTasks');list.innerHTML=DATA.writing.map((w,i)=>`<button class="writing-task ${i===writingIndex?'active':''}" data-wi="${i}"><b>${esc(w.title)}</b><small>${w.sentenceTarget||3} phrases</small></button>`).join('');
 list.querySelectorAll('[data-wi]').forEach(b=>b.onclick=()=>{saveWriting(false);writingIndex=Number(b.dataset.wi);renderWriting()});
 const w=DATA.writing[writingIndex];if(!w)return;const saved=progress.writing[w.id]?.text||'';
 document.getElementById('frenchWritingEditor').innerHTML=`<h2>${esc(w.title)}</h2><p>${esc(w.prompt)}</p><textarea id="frenchWritingText" placeholder="Écris ici…">${esc(saved)}</textarea><div class="quiz-actions"><button class="primary" id="frWriteCheck">Check checklist</button><button class="secondary" id="frWriteSave">Save</button></div><div id="frWriteFeedback"></div>`;
 document.getElementById('frWriteSave').onclick=()=>saveWriting(true);document.getElementById('frWriteCheck').onclick=checkWriting;
}
function saveWriting(notify){const w=DATA.writing[writingIndex],el=document.getElementById('frenchWritingText');if(!w||!el)return;progress.writing[w.id]={text:el.value,updatedAt:Date.now()};save();if(notify)window.LuxApp.toast('Writing saved.')}
function checkWriting(){
 const w=DATA.writing[writingIndex],text=document.getElementById('frenchWritingText').value;saveWriting(false);
 const n=window.FrenchReferenceMarker?.normalise?window.FrenchReferenceMarker.normalise(text):normaliseBasic(text);let earned=0,total=0;
 const rows=(w.requirements||[]).map(r=>{total+=r.points||1;let met=false;if(r.kind==='sentences')met=text.split(/[.!?]+/).map(x=>x.trim()).filter(Boolean).length>=(r.count||w.sentenceTarget||3);else if(r.any)met=r.any.some(a=>n.includes(window.FrenchReferenceMarker?.normalise?window.FrenchReferenceMarker.normalise(a):normaliseBasic(a)));if(met)earned+=r.points||1;return`<div class="req ${met?'met':''}">${met?'✓':'○'} ${esc(r.label)}</div>`}).join('');
 addActivity({kind:'writing',id:w.id,title:w.title,score:earned,total});save();if(total&&earned===total)window.LuxGrowth?.award({subject:'french',type:'writing_complete',itemId:w.id});
 document.getElementById('frWriteFeedback').innerHTML=`<div class="feedback ${earned===total?'good':'manual'}"><h3>${earned}/${total} checklist points detected</h3>${rows}<div class="model-answer"><b>Model example — not the only valid answer</b><br>${esc(w.model||'')}</div></div>`;
}
function renderProgress(){
 if(!dataReady)return;
 const rows=(progress.history||[]).filter(x=>x.kind==='question'),graded=rows.filter(x=>x.verdict!=='manual'&&x.verdict!=='almost'),correct=graded.filter(x=>x.correct).length,acc=graded.length?Math.round(correct/graded.length*100):0;
 document.getElementById('frenchProgressStats').innerHTML=`<div><b>${progress.sessions}</b><span>Sessions</span></div><div><b>${rows.length}</b><span>Answers</span></div><div><b>${acc}%</b><span>Accuracy</span></div><div><b>${dueCount()}</b><span>Due</span></div>`;
 const grouped={};enabled().forEach(q=>{const g=grouped[q.section]||(grouped[q.section]={name:q.topic,total:0,correct:0});g.total++;if(progress.attempts[q.id]?.status==='correct')g.correct++});
 document.getElementById('frenchTopicProgress').innerHTML=Object.values(grouped).map(g=>{const p=Math.round(g.correct/g.total*100);return`<div class="topic-bar"><div><span>${esc(g.name)}</span><b>${p}%</b></div><div class="bar"><i style="width:${p}%"></i></div></div>`}).join('');
}
let spellSession=null;
function renderSpellingSetup(){
 if(!dataReady)return;
 const due=Object.values(progress.spelling||{}).filter(x=>x.status==='wrong'&&(x.dueAt||0)<=Date.now()).length;
 document.getElementById('frenchSpellDue').textContent=due;
}
function startSpelling(){
 if(!dataReady)return;
 const candidates=DATA.vocab.filter(v=>v.includeInAutomaticQuestions&&v.french.length<=32&&!/[\/;]/.test(v.french));
 const weak=candidates.filter(v=>progress.spelling[v.id]?.status==='wrong');
 const unseen=candidates.filter(v=>!progress.spelling[v.id]);
 const pool=[...shuffle(weak),...shuffle(unseen),...shuffle(candidates)].filter((v,i,a)=>a.findIndex(x=>x.id===v.id)===i).slice(0,8);
 spellSession={items:pool,index:0,score:0,attempts:0};renderSpellItem();
}
function renderSpellItem(){
 const v=spellSession.items[spellSession.index],box=document.getElementById('frenchSpellingBox');
 box.innerHTML=`<div class="quiz-top"><span>ATELIER D’ORTHOGRAPHE</span><b>${spellSession.index+1} / ${spellSession.items.length}</b></div><p class="eyebrow">${esc(v.topic)}</p><h2>${esc(v.english)}</h2><p>Type the learned French spelling. Accents count.</p><input id="spellAnswer" class="answer-input spelling-input" autocomplete="off" spellcheck="false"><div class="quiz-actions"><button class="primary" id="spellCheck">Check spelling</button><button class="secondary" id="spellClue">Clue</button></div><div id="spellFeedback"></div>`;
 document.getElementById('spellCheck').onclick=checkSpell;document.getElementById('spellClue').onclick=()=>{const h=v.french.replace(/[A-Za-zÀ-ÿ](?=.{2})/g,'•');document.getElementById('spellFeedback').innerHTML=`<div class="feedback manual"><b>Clue:</b> ${esc(v.french[0])}${'•'.repeat(Math.max(0,v.french.length-2))}${esc(v.french.slice(-1))}</div>`};
 document.getElementById('spellAnswer').addEventListener('keydown',e=>{if(e.key==='Enter')checkSpell()});
}
function firstDiff(a,b){let i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;return i}
function checkSpell(){
 const v=spellSession.items[spellSession.index],input=document.getElementById('spellAnswer').value.trim(),target=strictSpell(v.french),got=strictSpell(input),fb=document.getElementById('spellFeedback');if(!input)return window.LuxApp.toast('Type the word first.');
 const ok=got===target,rec=progress.spelling[v.id]||{tries:0,independentCorrect:0};rec.tries++;spellSession.attempts++;
 if(ok){spellSession.score++;rec.status='correct';rec.independentCorrect=(rec.independentCorrect||0)+1;rec.dueAt=null;progress.spelling[v.id]=rec;save();window.LuxGrowth?.award({subject:'french',type:'spelling_first_independent',itemId:v.id});fb.innerHTML=`<div class="feedback good"><h3>Correct spelling.</h3><div class="model-answer">${esc(v.french)}</div><button class="primary" id="spellNext">Next word</button></div>`;document.getElementById('spellNext').onclick=nextSpell;return}
 const i=firstDiff(got,target);rec.status='wrong';rec.dueAt=Date.now()+48*60*60*1000;progress.spelling[v.id]=rec;save();
 if(rec.tries%2===1){
   fb.innerHTML=`<div class="feedback bad"><h3>Repair once.</h3><p>First difference is around character ${i+1}. Check accents and exact letters.</p><p><b>Your spelling:</b> ${esc(input)}</p></div>`;
 }else{
   fb.innerHTML=`<div class="feedback bad"><h3>Look, then write it again later.</h3><div class="model-answer"><b>Correct spelling</b><br>${esc(v.french)}</div><p>This word has entered the spelling review queue.</p><button class="primary" id="spellNext">Continue</button></div>`;document.getElementById('spellNext').onclick=nextSpell;
 }
}
function nextSpell(){if(++spellSession.index<spellSession.items.length)renderSpellItem();else{const pct=Math.round(spellSession.score/spellSession.items.length*100);window.LuxGrowth?.award({subject:'french',type:'game_learning_complete',itemId:`atelier-spelling:${today()}`});document.getElementById('frenchSpellingBox').innerHTML=`<div class="result-card"><p class="eyebrow">SPELLING SESSION COMPLETE</p><h2>Atelier complete</h2><div class="big-score">${pct}%</div><button class="primary" id="spellAgain">Play again</button></div>`;document.getElementById('spellAgain').onclick=startSpelling}}
function init(){
 document.querySelectorAll('#frenchScreen [data-french-view]').forEach(b=>b.onclick=()=>{frenchView(b.dataset.frenchView);ensureData()});
 document.getElementById('frenchStartPractice').onclick=async()=>{if(await ensureData())startQuiz(document.getElementById('frenchTopic').value,Number(document.getElementById('frenchCount').value),false)};
 document.getElementById('frenchDue').onclick=async()=>{if(await ensureData())startQuiz('all',20,true)};
 document.getElementById('frenchVocabSearch').addEventListener('input',renderVocab);document.getElementById('frenchVocabTopic').addEventListener('change',renderVocab);
 document.getElementById('startFrenchSpelling').onclick=async()=>{if(await ensureData())startSpelling()};
 ensureData();
}
function startWeakPractice(count=7){
 if(!dataReady)return;
 const ids=new Set(Object.entries(progress.attempts||{}).filter(([id,a])=>a?.status==='wrong').map(([id])=>id));
 const qs=shuffle(enabled().filter(q=>ids.has(q.id))).slice(0,Math.max(1,count));
 if(!qs.length){window.LuxApp.toast('No saved French weak items right now.');return}
 session={questions:qs,index:0,score:0,manual:0,sec:'all',reviewOnly:false,weakPractice:true};
 progress.sessions++;save();frenchView('frenchQuiz');renderQuestion();
}
function todayStats(){
 const k=today(),rows=(progress.history||[]).filter(x=>x.day===k);
 return {answers:rows.filter(x=>x.kind==='question').length,correct:rows.filter(x=>x.kind==='question'&&x.correct).length,writing:rows.filter(x=>x.kind==='writing').length,spelling:rows.filter(x=>x.kind==='spelling').length,due:dataReady?dueCount():0,loaded:dataReady};
}
function weakCount(){return Object.values(progress.attempts||{}).filter(x=>x.status==='wrong').length}
function reviewDates(){return Object.values(progress.attempts||{}).filter(a=>a?.status==='wrong'&&a.dueAt).map(a=>{const d=new Date(a.dueAt);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`})}
window.FrenchModule={init,ensureData,show:frenchView,startQuiz,startSpelling,dueCount:()=>dataReady?dueCount():0,weakCount,todayStats,startWeakPractice,reviewDates,renderProgress};
})();
