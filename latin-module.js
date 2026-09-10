
(function(){
'use strict';
const BANK=window.LATIN_BANK||[], NOTES=window.LATIN_NOTES||{}, KEY='latinSummerV8State';
const OLDER=['latinSummerV7State','latinSummerV6State','latinV3State'];
const TARGET=85;
const byId=new Map(BANK.map(q=>[q.id,q]));
let state=loadState(), session=null, lastLatinView='latinHome';

function empty(){
 return {version:9,attempts:[],reviews:{},results:{},cycles:{},categoryCycles:{},settings:{sound:true},activeSession:null,lastSaved:null,gamesV2:{}};
}
function merge(v){
 const b=empty(),o={...b,...(v||{})};
 o.attempts=Array.isArray(o.attempts)?o.attempts:[];
 o.reviews=o.reviews||{};o.results=o.results||{};o.cycles=o.cycles||{};o.categoryCycles=o.categoryCycles||{};
 o.settings={sound:true,...(o.settings||{})};o.gamesV2=o.gamesV2||{};
 return o;
}
function loadState(){
 try{const s=JSON.parse(localStorage.getItem(KEY)||'null');if(s)return merge(s)}catch(e){}
 for(const k of OLDER){try{const s=JSON.parse(localStorage.getItem(k)||'null');if(s)return merge(s)}catch(e){}}
 return empty();
}
function save(){state.lastSaved=new Date().toISOString();localStorage.setItem(KEY,JSON.stringify(state));window.state=state}
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function stripMarks(v){return String(v||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'')}
function norm(v){return stripMarks(v).toLowerCase().replace(/[“”‘’.,!?;:'"()\-]/g,' ').replace(/\s+/g,' ').trim()}
function normExact(v){return norm(String(v||'').replace(/\s*\([^)]*\)/g,' ')).replace(/^(the|a|an)\s+/,'')}
function tokens(v){return new Set(norm(v).split(' ').filter(Boolean))}
function phrase(answer,opt){const a=` ${norm(answer)} `,o=` ${norm(opt)} `;return a.includes(o)}
function addDays(n){const d=new Date();d.setDate(d.getDate()+n);return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function today(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}

function category(q){
 const s=`${q.topic||''} ${q.label||''} ${q.direction||''}`.toLowerCase();
 if(/roman|greece|civilisation|civilization|research|map locations|culture/.test(s))return'Roman World';
 if(q.type==='lat_auto'||q.type==='eng_auto'||/translation|set-text|set text|english → latin|latin → english/.test(s))return'Translation';
 if(/vocab|meaning|stage \d+|preposition/.test(s))return'Vocabulary';
 return'Grammar';
}
function pool(cat){return BANK.filter(q=>!cat||cat==='Mixed'||category(q)===cat)}
function cycleFor(cat){
 if(!state.categoryCycles[cat])state.categoryCycles[cat]={round:1,seen:[],answered:0,correct:0,completedPercent:null};
 const c=state.categoryCycles[cat];c.seen=Array.isArray(c.seen)?c.seen:[];return c;
}
function dueQuestions(){
 const now=today();return Object.entries(state.reviews).filter(([id,r])=>r&&r.due<=now&&byId.has(id)).map(([id])=>byId.get(id));
}
function weakQuestions(){return Object.keys(state.reviews).map(id=>byId.get(id)).filter(Boolean)}
function parseSet(answer,expectedItems){
 const expected=expectedItems.map(normExact),allSingle=expected.every(x=>!x.includes(' '));
 let parts=allSingle?norm(answer.replace(/\band\b/gi,' ').replace(/[;,/|]/g,' ')).split(' ').filter(Boolean):
 answer.split(/\s*(?:,|;|\/|\||\band\b)\s*/i).map(normExact).filter(Boolean);
 return [...new Set(parts)];
}
function mark(q,answer){
 if(q.type==='exact_any'){return {ok:(q.accepted||[]).some(a=>normExact(a)===normExact(answer)),missing:[],extra:[]}}
 if(q.type==='unordered_set'){
  const exp=(q.setItems||[]).map(normExact),got=parseSet(answer,q.setItems||[]);
  const missing=exp.filter(x=>!got.includes(x)),extra=got.filter(x=>!exp.includes(x));
  return {ok:!missing.length&&!extra.length,missing,extra};
 }
 if(q.type==='eng_auto'){
  if((q.accepted||[]).some(a=>norm(a)===norm(answer)))return {ok:true,missing:[],extra:[]};
  const missing=[];(q.groups||[]).forEach(g=>{if(!g.some(x=>phrase(answer,x)))missing.push(g[0])});
  return {ok:!missing.length,missing,extra:[]};
 }
 if(q.type==='lat_auto'){
  if((q.accepted||[]).some(a=>norm(a)===norm(answer)))return {ok:true,missing:[],extra:[]};
  const at=tokens(answer),missing=[];(q.latinGroups||[]).forEach(g=>{if(!g.every(x=>at.has(norm(x))))missing.push(g.join(' + '))});
  const allowed=new Set();(q.latinGroups||[]).flat().forEach(x=>allowed.add(norm(x)));(q.accepted||[]).forEach(a=>tokens(a).forEach(x=>allowed.add(x)));
  const extra=[...at].filter(x=>!allowed.has(x));return {ok:!missing.length&&!extra.length,missing,extra};
 }
 return {ok:false,missing:[],extra:[]};
}
function updateReview(q,ok,isReview){
 state.results[q.id]={ok,date:new Date().toISOString()};
 if(!ok){state.reviews[q.id]={stage:1,due:addDays(2),lastWrong:new Date().toISOString()};return}
 const r=state.reviews[q.id];
 if(isReview&&r){if(r.stage===1)state.reviews[q.id]={stage:2,due:addDays(7),lastWrong:r.lastWrong};else delete state.reviews[q.id]}
}
function recordCategory(q,ok,cat){
 if(!cat||cat==='Mixed'||category(q)!==cat)return;
 const c=cycleFor(cat),ids=new Set(pool(cat).map(x=>x.id));
 c.seen=c.seen.filter(id=>ids.has(id));
 if(!c.seen.includes(q.id)){c.seen.push(q.id);c.answered++;if(ok)c.correct++}
 if(ids.size&&c.seen.length>=ids.size){
   c.completedPercent=Math.round(c.correct/Math.max(1,c.answered)*100);
   c.completedRound=c.round;
   c.round++;c.seen=[];c.answered=0;c.correct=0;
 }
}
function selectQuestions(cat,count,isReview=false){
 if(isReview)return shuffle(dueQuestions()).slice(0,count);
 const p=pool(cat).filter(q=>!state.reviews[q.id]);
 const c=cat&&cat!=='Mixed'?cycleFor(cat):null;
 const unseen=c?p.filter(q=>!c.seen.includes(q.id)):p.filter(q=>!state.results[q.id]);
 const old=p.filter(q=>!unseen.includes(q));
 return [...shuffle(unseen),...shuffle(old)].slice(0,Math.min(count,p.length));
}
function latinView(id){
 document.querySelectorAll('#latinScreen .latin-view').forEach(x=>x.classList.toggle('hidden',x.id!==id));
 document.querySelectorAll('#latinScreen [data-latin-view]').forEach(x=>x.classList.toggle('active',x.dataset.latinView===id));
 lastLatinView=id;
 if(id==='latinHome')renderHome();
 if(id==='latinVocab')renderVocab();
 if(id==='latinProgress')renderProgress();
 if(id==='latinNotes')renderNotes();
}
function startPractice(cat='Mixed',count=10,isReview=false){
 const qs=selectQuestions(cat,count,isReview);
 if(!qs.length){window.LuxApp.toast(isReview?'No Latin reviews are due today.':'No questions are available in this pool.');return}
 session={questions:qs,index:0,score:0,cat,isReview,answers:[]};
 latinView('latinQuiz');renderQuestion();
}
function renderQuestion(){
 const q=session.questions[session.index],box=document.getElementById('latinQuizBox');
 const choice=q.type==='mc';
 box.innerHTML=`<div class="quiz-top"><span>${esc(category(q))} · ${esc(q.topic||q.label||'Latin')}</span><b>${session.index+1} / ${session.questions.length}</b></div>
 <div class="quiz-progress"><i style="width:${((session.index+1)/session.questions.length)*100}%"></i></div>
 ${q.context?`<div class="context-box">${esc(q.context)}</div>`:''}
 <h2>${esc(q.q)}</h2>
 ${choice?`<div class="options">${(q.opts||[]).map(o=>`<button type="button" class="option" data-latin-opt="${esc(o)}">${esc(o)}</button>`).join('')}</div>`:
 `<input id="latinAnswer" class="answer-input" autocomplete="off" spellcheck="false" placeholder="Write your answer…">`}
 <div class="quiz-actions"><button class="primary" id="latinCheck">Check answer</button><button class="secondary" id="latinPause">Pause</button></div>
 <div id="latinFeedback"></div>`;
 box.querySelectorAll('[data-latin-opt]').forEach(b=>b.onclick=()=>{box.querySelectorAll('.option').forEach(x=>x.classList.remove('selected'));b.classList.add('selected')});
 document.getElementById('latinCheck').onclick=checkAnswer;document.getElementById('latinPause').onclick=()=>latinView('latinHome');
 document.getElementById('latinAnswer')?.addEventListener('keydown',e=>{if(e.key==='Enter')checkAnswer()});
}
function checkAnswer(){
 const q=session.questions[session.index],choice=q.type==='mc';
 let given='',result={ok:false,missing:[],extra:[]};
 if(choice){const b=document.querySelector('#latinQuizBox .option.selected');if(!b)return window.LuxApp.toast('Choose an answer first.');given=b.textContent;result.ok=norm(given)===norm(q.a)}
 else{given=(document.getElementById('latinAnswer').value||'').trim();if(!given)return window.LuxApp.toast('Write an answer first.');result=mark(q,given)}
 if(result.ok)session.score++;
 updateReview(q,result.ok,session.isReview);recordCategory(q,result.ok,session.cat);
 state.attempts.push({id:q.id,date:new Date().toISOString(),category:category(q),ok:result.ok});
 session.answers.push({id:q.id,ok:result.ok});save();
 if(result.ok){
  window.LuxGrowth?.award({subject:'latin',type:session.isReview?'formal_due_review_correct':'practice_first_correct',itemId:q.id,windowKey:session.isReview?`review-${state.results[q.id]?.date?.slice(0,10)||today()}`:today()});
 }
 const ans=q.a||q.answerExample||(q.accepted||[])[0]||'';
 const fb=document.getElementById('latinFeedback');
 fb.innerHTML=`<div class="feedback ${result.ok?'good':'bad'}"><h3>${result.ok?'Correct.':'Not quite.'}</h3>
 <p><b>Your answer:</b> ${esc(given)}</p>
 ${!result.ok&&result.missing?.length?`<p><b>Missing:</b> ${result.missing.map(esc).join(', ')}</p>`:''}
 ${!result.ok&&result.extra?.length?`<p><b>Extra:</b> ${result.extra.map(esc).join(', ')}</p>`:''}
 ${ans?`<div class="model-answer"><b>Accepted answer</b><br>${esc(ans)}</div>`:''}
 <div class="teacher-note"><b>Teacher-bank explanation</b><ol>${(q.steps||[q.explain||'Compare with the accepted answer.']).map(x=>`<li>${esc(x)}</li>`).join('')}</ol></div>
 <p class="memory"><b>Must remember:</b> ${esc(q.mustRemember||q.explain||'Review the exact source-taught form.')}</p>
 ${!result.ok?'<p class="review-note">Saved for 2-day review. A correct due review schedules one 7-day check.</p>':''}
 <button class="primary" id="latinNext">${session.index+1<session.questions.length?'Next question':'See result'}</button></div>`;
 document.getElementById('latinCheck').disabled=true;document.getElementById('latinNext').onclick=nextQuestion;
}
function nextQuestion(){if(++session.index<session.questions.length)renderQuestion();else finish()}
function finish(){
 const pct=Math.round(session.score/session.questions.length*100);
 if(pct>=80)window.LuxGrowth?.award({subject:'latin',type:'quiz_complete_80',itemId:`${session.cat}:${today()}`});
 if(pct>=90)window.LuxGrowth?.award({subject:'latin',type:'quiz_bonus_90',itemId:`${session.cat}:${today()}`});
 document.getElementById('latinQuizBox').innerHTML=`<div class="result-card"><p class="eyebrow">SESSION COMPLETE</p><h2>${pct>=85?'Strong work.':'Keep building the pattern.'}</h2><div class="big-score">${pct}%</div><p>${session.score}/${session.questions.length} correct</p><div class="quiz-actions"><button class="primary" id="latinAgain">Another session</button><button class="secondary" id="latinBack">Practice hub</button></div></div>`;
 document.getElementById('latinAgain').onclick=()=>startPractice(session.cat,session.questions.length,session.isReview);
 document.getElementById('latinBack').onclick=()=>latinView('latinHome');renderHome();
}
function renderHome(){
 const due=dueQuestions().length,weak=weakQuestions().length,root=document.getElementById('latinPracticeCards');
 const cats=['Vocabulary','Grammar','Translation','Roman World'];
 root.innerHTML=cats.map((c,i)=>{const cy=cycleFor(c),p=pool(c).length,mastered=cy.completedPercent>=TARGET;return `<button class="learning-card" data-start-latin="${c}">
 <span>${String(i+1).padStart(2,'0')}</span><h3>${c}</h3><p>Focused practice</p><small>${mastered?`Mastered ${cy.completedPercent}%`:cy.completedPercent!=null?`Last full cycle ${cy.completedPercent}%`:`Cycle ${cy.round}`}</small></button>`}).join('')+
 `<button class="learning-card due-card" data-start-due><span>↺</span><h3>Due Review</h3><p>${due} due now · ${weak} to revisit</p><small>2-day → 7-day schedule</small></button>`;
 root.querySelectorAll('[data-start-latin]').forEach(b=>b.onclick=()=>startPractice(b.dataset.startLatin,10,false));
 root.querySelector('[data-start-due]').onclick=()=>startPractice('Mixed',Math.min(20,Math.max(1,due)),true);
 document.getElementById('latinMixed').onclick=()=>startPractice('Mixed',15,false);
 document.getElementById('latinQuick').onclick=()=>startPractice(['Vocabulary','Grammar'][Math.floor(Math.random()*2)],8,false);
 document.querySelector('[data-latin-stat="due"]').textContent=due;
 document.querySelector('[data-latin-stat="attempts"]').textContent=state.attempts.length;
}
let vocabRows=[],vocabIndex=0;
function makeVocab(){
 if(vocabRows.length)return;
 const seen=new Set();
 BANK.forEach(q=>{
  if(q.type!=='exact_any'||!Array.isArray(q.accepted)||!q.accepted.length)return;
  const dir=String(q.direction||'').toLowerCase(), prompt=String(q.q||'').trim();
  if(!/latin.*english|meaning|translate/i.test(dir+' '+q.label+' '+q.topic))return;
  let latin=prompt.replace(/^translate\s*/i,'').replace(/^what does\s*/i,'').replace(/[?]/g,'').trim();
  if(latin.length>40||latin.split(/\s+/).length>4)return;
  const eng=q.accepted[0];const key=norm(latin)+'|'+norm(eng);
  if(!latin||!eng||seen.has(key))return;seen.add(key);vocabRows.push({latin,english:eng,topic:q.topic||q.label||''});
 });
 if(vocabRows.length<100){
  BANK.filter(q=>q.type==='exact_any'&&q.accepted?.length).forEach(q=>{
   const m=String(q.q||'').match(/[“"]?([A-Za-zāēīōūĀĒĪŌŪ-]+)[”"]?/);
   if(m&&m[1]&&m[1].length>1){const key=norm(m[1])+'|'+norm(q.accepted[0]);if(!seen.has(key)){seen.add(key);vocabRows.push({latin:m[1],english:q.accepted[0],topic:q.topic||''})}}
  });
 }
}
function renderVocab(){
 makeVocab();const s=(document.getElementById('latinVocabSearch')?.value||'').toLowerCase();
 const rows=vocabRows.filter(v=>!s||v.latin.toLowerCase().includes(s)||String(v.english).toLowerCase().includes(s));
 document.getElementById('latinVocabCount').textContent=`${rows.length} source-covered entries`;
 document.getElementById('latinVocabList').innerHTML=rows.slice(0,180).map(v=>`<div class="vocab-row"><b>${esc(v.latin)}</b><span>${esc(v.english)}</span><small>${esc(v.topic)}</small></div>`).join('');
}
function renderProgress(){
 const attempts=state.attempts||[],correct=attempts.filter(a=>a.ok).length,acc=attempts.length?Math.round(correct/attempts.length*100):0;
 const cats=['Vocabulary','Grammar','Translation','Roman World'];
 document.getElementById('latinProgressStats').innerHTML=`<div><b>${attempts.length}</b><span>Answers</span></div><div><b>${acc}%</b><span>Accuracy</span></div><div><b>${Object.keys(state.reviews).length}</b><span>Saved reviews</span></div>`;
 document.getElementById('latinMasteryList').innerHTML=cats.map(c=>{const cy=cycleFor(c),p=cy.completedPercent||0;return `<div class="topic-bar"><div><span>${c}</span><b>${cy.completedPercent==null?'Not completed':p+'%'}</b></div><div class="bar"><i style="width:${Math.min(100,p)}%"></i></div></div>`}).join('');
}
function renderNotes(){
 const search=(document.getElementById('latinNotesSearch')?.value||'').toLowerCase();
 const rows=Object.entries(NOTES).map(([day,n])=>({day,n,title:String(n.title||day).replace(/^\d+\s+[A-Za-z]+\s+[—-]\s*/,'')}))
  .filter(x=>!search||(`${x.title} ${x.n.intro||''}`).toLowerCase().includes(search));
 document.getElementById('latinNotesList').innerHTML=rows.map((x,i)=>`<button class="note-card" data-note-key="${esc(x.day)}"><span>${String(i+1).padStart(2,'0')}</span><div><h3>${esc(x.title)}</h3><p>${esc(x.n.intro||'Teacher notes')}</p></div></button>`).join('');
 document.querySelectorAll('[data-note-key]').forEach(b=>b.onclick=()=>openNotes(b.dataset.noteKey));
}
function openNotes(day){
 const n=NOTES[day];if(!n)return;
 latinView('latinNoteDetail');
 document.getElementById('latinNoteDetailBox').innerHTML=`<p class="eyebrow">TEACHER NOTES · SOURCE METADATA ${esc(day)}</p><h2>${esc(String(n.title||day).replace(/^\d+\s+[A-Za-z]+\s+[—-]\s*/,''))}</h2><p>${esc(n.intro||'')}</p>
 ${(n.must||n.items||[]).length?`<h3>Must remember</h3><ul>${(n.must||n.items||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
 ${(n.sections||[]).map(s=>`<section class="note-section"><h3>${esc(s.title)}</h3><ul>${(s.items||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`).join('')}
 <button class="secondary" id="latinNoteBack">Back to Notes</button>`;
 document.getElementById('latinNoteBack').onclick=()=>latinView('latinNotes');
}
function init(){
 window.bank=BANK;window.state=state;window.save=save;
 window.playTone=function(kind){if(!state.settings.sound)return; /* intentionally subtle/silent-compatible */};
 window.setNavActive=function(){};
 window.openNotes=openNotes;
 window.show=function(id){
   if(['gamesHub','gamePlay'].includes(id)){latinView(id);return}
   latinView(id);
 };
 document.querySelectorAll('#latinScreen [data-latin-view]').forEach(b=>b.onclick=()=>{
   const id=b.dataset.latinView;
   if(id==='gamesHub'&&window.GameV2)window.GameV2.openHub();else latinView(id);
 });
 document.getElementById('latinVocabSearch').addEventListener('input',renderVocab);
 document.getElementById('latinNotesSearch').addEventListener('input',renderNotes);
 renderHome();renderVocab();renderProgress();renderNotes();
}
function startWeakPractice(count=7){
 const qs=shuffle(weakQuestions()).slice(0,Math.max(1,count));
 if(!qs.length){window.LuxApp.toast('No saved Latin weak items right now.');return}
 session={questions:qs,index:0,score:0,cat:'Mixed',isReview:false,answers:[],weakPractice:true};
 latinView('latinQuiz');renderQuestion();
}
function todayStats(){
 const k=today(),rows=(state.attempts||[]).filter(a=>String(a.date||'').slice(0,10)===k);
 return {answers:rows.length,correct:rows.filter(a=>a.ok).length,translation:rows.filter(a=>a.category==='Translation').length,due:dueQuestions().length,weak:weakQuestions().length};
}
function reviewDates(){return Object.values(state.reviews||{}).map(r=>r?.due).filter(Boolean)}
window.LatinModule={init,show:latinView,startPractice,renderHome,renderProgress,dueCount:()=>dueQuestions().length,weakCount:()=>weakQuestions().length,state:()=>state,save,todayStats,startWeakPractice,reviewDates};
})();
