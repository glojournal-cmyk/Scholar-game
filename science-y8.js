
(function(){
'use strict';

const SUBJECTS={
  chemistry:{label:'Chemistry',key:'scienceY8ChemistryV1'},
  physics:{label:'Physics',key:'scienceY8PhysicsV1'}
};
const INDEX_URL='./cp-y8/runtime/index.json';
let index=null;
const topicCache=new Map();
const sessions={chemistry:null,physics:null};

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function norm(v){return String(v??'').normalize('NFKC').toLowerCase().replace(/[’]/g,"'").replace(/[.!?;:,]+$/g,'').replace(/\s+/g,' ').trim()}
function day(d=new Date()){return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`}
function addDays(n){const d=new Date();d.setDate(d.getDate()+Number(n||0));return day(d)}
function shuffle(a){a=[...a];for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
function fresh(subject){return {version:1,subject,concepts:{},history:[],sessions:0,answered:0,correct:0,createdAt:new Date().toISOString()}}
function load(subject){
  try{const v=JSON.parse(localStorage.getItem(SUBJECTS[subject].key)||'null');return v&&typeof v==='object'?{...fresh(subject),...v,concepts:v.concepts||{},history:Array.isArray(v.history)?v.history:[]}:fresh(subject)}
  catch{return fresh(subject)}
}
function save(subject,state){localStorage.setItem(SUBJECTS[subject].key,JSON.stringify(state))}
function conceptRec(state,id){
  if(!state.concepts[id])state.concepts[id]={state:'new',attempts:0,correct:0,weightedAttempts:0,weightedCorrect:0,productionSuccess:false,nextDue:null,lastSeen:null};
  return state.concepts[id];
}
async function ensureIndex(){
  if(index)return true;
  try{
    const r=await fetch(INDEX_URL,{cache:'default'});if(!r.ok)throw new Error(`index ${r.status}`);
    index=await r.json();return true;
  }catch(err){console.error('[ScienceY8] index load failed',err);return false}
}
function topics(subject,{includePreview=true}={}){
  if(!index)return [];
  return index.topics.filter(t=>t.subject===subject&&(includePreview||t.enabledCount>0));
}
async function bundle(subject,topicId){
  const key=`${subject}:${topicId}`;if(topicCache.has(key))return topicCache.get(key);
  if(!(await ensureIndex()))throw new Error('Science index unavailable');
  const meta=index.topics.find(t=>t.subject===subject&&t.topicId===topicId);if(!meta)throw new Error(`Unknown topic ${topicId}`);
  const r=await fetch(`./cp-y8/runtime/${meta.file}`,{cache:'default'});if(!r.ok)throw new Error(`${meta.file}: ${r.status}`);
  const data=await r.json();topicCache.set(key,data);return data;
}
async function allBundles(subject,{includePreview=false}={}){
  if(!(await ensureIndex()))throw new Error('Science index unavailable');
  return Promise.all(topics(subject,{includePreview}).map(t=>bundle(subject,t.topicId)));
}
function dueCount(subject){
  const s=load(subject),today=day();
  return Object.values(s.concepts).filter(c=>c.nextDue&&c.nextDue<=today&&c.state!=='secure').length;
}
function masterySummary(subject){
  const s=load(subject),vals=Object.values(s.concepts);
  const out={new:0,recognised:0,learning:0,consolidating:0,secure:0,total:0};
  vals.forEach(c=>{out[c.state]=(out[c.state]||0)+1;out.total++});
  return out;
}
function isProduction(q){return !(q.gameplay?.recognition===true)}
function updateMastery(subject,q,correct,{manual=false,preview=false}={}){
  const state=load(subject),rec=conceptRec(state,q.conceptId),weight=Number(q.gameplay?.masteryWeight)||1;
  const wasDue=!!rec.nextDue&&rec.nextDue<=day();
  rec.attempts++;rec.weightedAttempts+=weight;rec.lastSeen=new Date().toISOString();
  if(correct){rec.correct++;rec.weightedCorrect+=weight}
  const production=isProduction(q);
  if(correct&&production)rec.productionSuccess=true;
  const accuracy=rec.weightedAttempts?rec.weightedCorrect/rec.weightedAttempts:0;

  if(!preview){
    if(correct){
      if(production){
        if(rec.state==='consolidating'&&wasDue&&accuracy>=.85){rec.state='secure';rec.nextDue=addDays(21)}
        else if((rec.state==='learning'||rec.state==='recognised'||rec.state==='new')&&wasDue&&rec.state==='learning'){rec.state='consolidating';rec.nextDue=addDays(7)}
        else if(rec.state==='new'||rec.state==='recognised'){rec.state='learning';rec.nextDue=addDays(2)}
        else if(rec.state==='learning'){rec.nextDue=rec.nextDue||addDays(2)}
        else if(rec.state==='consolidating'){rec.nextDue=rec.nextDue||addDays(7)}
      }else{
        if(rec.state==='new')rec.state='recognised';
        rec.nextDue=rec.nextDue||addDays(2);
      }
    }else{
      if(rec.state==='secure')rec.state='consolidating';
      else if(rec.state==='new')rec.state='new';
      rec.nextDue=addDays(2);
    }
  }

  state.answered++;if(correct)state.correct++;
  state.history.push({at:new Date().toISOString(),questionId:q.id,conceptId:q.conceptId,correct,manual,preview,state:rec.state});
  if(state.history.length>700)state.history=state.history.slice(-700);
  save(subject,state);

  if(!preview&&correct&&window.LuxGrowth){
    const seenBefore=rec.attempts>1;
    window.LuxGrowth.award({
      subject,
      type:wasDue?'formal_due_review_correct':seenBefore?'practice_repeat_correct':'practice_first_correct',
      itemId:q.conceptId,
      windowKey:day()
    });
  }
  return rec;
}
function topicArt(subject,mode='learn'){
  const art={
    chemistry:{learn:'rf5_chemistry_practical.webp',practice:'rf5_chemistry_practice.webp',progress:'rf5_chemistry_reaction.webp',preview:'rf5_chemistry_particles.webp'},
    physics:{learn:'rf5_physics_motion.webp',practice:'rf5_physics_practice.webp',progress:'rf5_physics_observatory.webp',preview:'rf5_physics_night.webp'}
  };
  return art[subject]?.[mode]||art[subject]?.learn||'';
}
function pane(id){return document.getElementById(id)}
async function renderLearn(subject){
  if(!(await ensureIndex()))return false;
  const root=pane('genericLearnPane');if(!root)return false;
  const ts=topics(subject,{includePreview:true});
  root.innerHTML=`<section class="rf5-science-spread">
    <div class="rf5-science-copy"><p class="eyebrow">YEAR 8 · FOUNDATION REVIEW</p><h2>${SUBJECTS[subject].label} revision library</h2>
    <p>Confirmed Year 8 content is separated from optional preview material. Open a chapter, retrieve the key rules, then practise.</p>
    <div class="rf5-topic-index">${ts.map(t=>`<button class="rf5-topic-link ${t.previewCount?'preview':''}" data-science-note="${esc(t.topicId)}">
      <span>${t.previewCount?'OPTIONAL PREVIEW':'FOUNDATION'}</span><b>${esc(t.title)}</b><small>${t.questionCount} revision questions</small>
    </button>`).join('')}</div></div>
    <figure class="rf5-science-plate"><img src="./${topicArt(subject,'learn')}" alt="${SUBJECTS[subject].label} study scene"></figure>
  </section>`;
  root.querySelectorAll('[data-science-note]').forEach(b=>b.onclick=()=>renderNote(subject,b.dataset.scienceNote));
  return true;
}
async function renderNote(subject,topicId){
  const root=pane('genericLearnPane'),data=await bundle(subject,topicId),t=data.topic;
  const preview=t.status==='preview';
  root.innerHTML=`<article class="rf5-note-layout ${preview?'is-preview':''}">
    <aside class="rf5-note-side">
      <button class="back-link" data-science-back>← All ${SUBJECTS[subject].label} chapters</button>
      <img src="./${topicArt(subject,preview?'preview':'learn')}" alt="" loading="lazy">
      <span class="route-pill ${preview?'preview':'foundation'}">${preview?'Optional preview · no ordinary-session weighting':'Year 8 Foundation'}</span>
    </aside>
    <div class="rf5-note-paper">
      <p class="eyebrow">${esc(t.term||'YEAR 8')}</p><h2>${esc(t.title)}</h2><p class="rf5-note-overview">${esc(t.overview)}</p>
      ${t.learningGoals?.length?`<section><h3>Learning goals</h3><ul>${t.learningGoals.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`:''}
      ${t.mustMemoriseRules?.length?`<section><h3>Must memorise</h3><ol>${t.mustMemoriseRules.map(x=>`<li>${esc(x)}</li>`).join('')}</ol></section>`:''}
      ${t.mustMemoriseVocabulary?.length?`<section><h3>Vocabulary</h3><div class="rf5-vocab-ledger">${t.mustMemoriseVocabulary.map(x=>`<div><b>${esc(x.term)}</b><span>${esc(x.meaning)}</span></div>`).join('')}</div></section>`:''}
      ${t.workedExamples?.length?`<section><h3>Worked examples</h3>${t.workedExamples.map(x=>`<div class="rf5-worked"><b>${esc(x.prompt)}</b><p>${esc(x.answer)}</p></div>`).join('')}</section>`:''}
      ${t.commonMistakes?.length?`<section class="rf5-repair"><h3>Common mistakes</h3><ul>${t.commonMistakes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul></section>`:''}
      <div class="rf5-note-actions"><button class="primary" data-science-practise-topic="${esc(topicId)}">Practise this chapter</button></div>
    </div>
  </article>`;
  root.querySelector('[data-science-back]').onclick=()=>renderLearn(subject);
  root.querySelector('[data-science-practise-topic]').onclick=async()=>{
    await startPractice(subject,preview?'preview':'topic',12,topicId);
    document.querySelectorAll('[data-subject-tab]').forEach(x=>x.classList.toggle('active',x.dataset.subjectTab==='practice'));
    root.classList.add('hidden');pane('genericPracticePane')?.classList.remove('hidden');
  };
}
async function renderPracticeHome(subject){
  if(!(await ensureIndex()))return false;
  const root=pane('genericPracticePane');if(!root)return false;
  const ts=topics(subject,{includePreview:true}),due=dueCount(subject);
  root.innerHTML=`<section class="rf5-practice-desk">
    <figure><img src="./${topicArt(subject,'practice')}" alt="${SUBJECTS[subject].label} revision practice"></figure>
    <div class="rf5-practice-panel"><p class="eyebrow">RETRIEVE · APPLY · REPAIR</p><h2>${SUBJECTS[subject].label} practice</h2>
      <p>Ordinary sessions use only confirmed Year 8 questions. Preview topics are always separate.</p>
      <div class="rf5-practice-actions">
        <button class="primary" data-science-start="mixed">Mixed revision · 15</button>
        <button class="secondary" data-science-start="quick">Quick revision · 7</button>
        <button class="secondary" data-science-start="due" ${due?'':'disabled'}>Due review · ${due}</button>
      </div>
      <label class="rf5-topic-select">Focus chapter<select data-science-topic><option value="all">All confirmed topics</option>${ts.filter(t=>t.enabledCount).map(t=>`<option value="${esc(t.topicId)}">${esc(t.title)}</option>`).join('')}</select></label>
      <button class="text-button" data-science-start="topic">Start focused chapter</button>
      ${ts.some(t=>t.previewCount)?`<div class="rf5-preview-box"><b>Optional preview</b><p>Preview questions are excluded from ordinary revision and do not award Scholar XP.</p><button class="secondary" data-science-preview>Open preview topics</button></div>`:''}
    </div>
  </section>`;
  root.querySelectorAll('[data-science-start]').forEach(b=>b.onclick=()=>{
    const mode=b.dataset.scienceStart,topic=root.querySelector('[data-science-topic]')?.value||'all';
    const count=mode==='quick'?7:mode==='due'?7:15;
    startPractice(subject,mode,count,mode==='topic'?topic:'all');
  });
  root.querySelector('[data-science-preview]')?.addEventListener('click',()=>renderPreviewPicker(subject));
  return true;
}
async function renderPreviewPicker(subject){
  const root=pane('genericPracticePane'),ts=topics(subject,{includePreview:true}).filter(t=>t.previewCount);
  root.innerHTML=`<section class="rf5-preview-picker"><button class="back-link" data-back-practice>← Practice</button><p class="eyebrow">OPTIONAL PREVIEW</p><h2>Explore later-course material</h2>
  <p>These topics are outside ordinary Year 8 revision. First exposure carries no ordinary-session penalty and does not award Scholar XP.</p>
  <div class="rf5-topic-index">${ts.map(t=>`<button class="rf5-topic-link preview" data-preview-topic="${esc(t.topicId)}"><span>PREVIEW</span><b>${esc(t.title)}</b><small>${t.previewCount} questions</small></button>`).join('')}</div></section>`;
  root.querySelector('[data-back-practice]').onclick=()=>renderPracticeHome(subject);
  root.querySelectorAll('[data-preview-topic]').forEach(b=>b.onclick=()=>startPractice(subject,'preview',10,b.dataset.previewTopic));
}
function eligibleQuestion(q,mode,state){
  if(mode==='preview')return q.status==='preview';
  if(q.status!=='enabled')return false;
  if(mode==='due'){
    const c=state.concepts[q.conceptId];
    return !!c?.nextDue&&c.nextDue<=day()&&c.state!=='secure';
  }
  return true;
}
async function startPractice(subject,mode='mixed',count=15,topicId='all'){
  const state=load(subject);
  let bundles;
  if(topicId!=='all')bundles=[await bundle(subject,topicId)];
  else bundles=await allBundles(subject,{includePreview:mode==='preview'});
  let pool=bundles.flatMap(b=>b.questions).filter(q=>eligibleQuestion(q,mode,state));
  if(mode==='preview')pool=pool.filter(q=>q.status==='preview');
  else pool=pool.filter(q=>q.status==='enabled');
  if(!pool.length){window.LuxApp?.toast?.(mode==='due'?'No due reviews right now.':'No questions available in this selection.');return false}

  // Respect the supplied session blueprint: recognition supports recall, but
  // production/application should dominate ordinary evidence. New/weak pools may use
  // closer to 50:50; familiar pools aim around 30:70; due review is production-heavy.
  pool=shuffle(pool);
  const attempted=pool.filter(q=>(state.concepts[q.conceptId]?.attempts||0)>0).length;
  const familiarity=pool.length?attempted/pool.length:0;
  const recognitionRatio=mode==='due'?.20:(familiarity<.25?.50:.30);
  const targetRecognition=Math.max(1,Math.min(count-1,Math.round(count*recognitionRatio)));
  const recognition=shuffle(pool.filter(q=>q.gameplay?.recognition===true));
  const production=shuffle(pool.filter(q=>q.gameplay?.recognition!==true));
  const chosen=[],concepts=new Set(),formats=new Map();

  function takeFrom(source,target){
    for(const q of source){
      if(chosen.length>=count||target<=0)break;
      if(concepts.has(q.conceptId))continue;
      const fmtCount=formats.get(q.format)||0;
      if(fmtCount>=Math.ceil(count/3))continue;
      chosen.push(q);concepts.add(q.conceptId);formats.set(q.format,fmtCount+1);target--;
    }
  }
  // Open with up to two accessible recognition items when available.
  takeFrom(recognition,Math.min(2,targetRecognition));
  takeFrom(production,count-targetRecognition);
  takeFrom(recognition,targetRecognition-chosen.filter(q=>q.gameplay?.recognition===true).length);
  for(const q of shuffle([...production,...recognition])){
    if(chosen.length>=count)break;
    if(!chosen.some(x=>x.id===q.id)){chosen.push(q);concepts.add(q.conceptId)}
  }
  const final=chosen.slice(0,count);
  // End on production/application evidence when the pool contains it.
  if(final.length&&final[final.length-1].gameplay?.recognition===true){
    const swap=final.findIndex((q,i)=>i>1&&q.gameplay?.recognition!==true);
    if(swap>=0){const tmp=final[swap];final[swap]=final[final.length-1];final[final.length-1]=tmp}
  }
  sessions[subject]={subject,mode,topicId,questions:final,i:0,correct:0,answered:0,preview:mode==='preview',lastConcept:null};
  const s=load(subject);s.sessions++;save(subject,s);
  renderQuestion(subject);
  return true;
}
function answerUI(q){
  if(q.format==='mc_single'){
    return `<div class="rf5-choice-grid">${(q.options||[]).map((o,i)=>`<label><input type="radio" name="science-choice" value="${esc(o)}"><span>${esc(o)}</span></label>`).join('')}</div>`;
  }
  if(q.format==='matching'){
    const rights=shuffle((q.stimulus?.rightItems||[]));
    return `<div class="rf5-match-grid">${(q.stimulus?.leftItems||[]).map((left,i)=>`<label><b>${esc(left)}</b><select data-match-left="${esc(left)}"><option value="">Choose…</option>${rights.map(r=>`<option value="${esc(r)}">${esc(r)}</option>`).join('')}</select></label>`).join('')}</div>`;
  }
  if(q.format==='sequence'){
    const items=shuffle(q.answer?.items||[]);
    return `<div class="rf5-sequence-grid">${(q.answer?.items||[]).map((_,i)=>`<label><b>${i+1}</b><select data-sequence-pos="${i}"><option value="">Choose…</option>${items.map(x=>`<option value="${esc(x)}">${esc(x)}</option>`).join('')}</select></label>`).join('')}</div>`;
  }
  if(q.format==='sorting'){
    const cats=Object.keys(q.answer?.categories||{}),items=Object.values(q.answer?.categories||{}).flat();
    return `<div class="rf5-sort-grid">${items.map(item=>`<label><b>${esc(item)}</b><select data-sort-item="${esc(item)}"><option value="">Choose category…</option>${cats.map(c=>`<option value="${esc(c)}">${esc(c)}</option>`).join('')}</select></label>`).join('')}</div>`;
  }
  return `<textarea class="rf5-science-answer" rows="${['extended_response','practical_design'].includes(q.format)?8:5}" placeholder="${esc(q.task?.answerFormat||'Write your answer…')}"></textarea>`;
}
function learnerValue(root,q){
  if(q.format==='mc_single')return root.querySelector('input[name="science-choice"]:checked')?.value||'';
  if(q.format==='matching')return Object.fromEntries([...root.querySelectorAll('[data-match-left]')].map(x=>[x.dataset.matchLeft,x.value]));
  if(q.format==='sequence')return [...root.querySelectorAll('[data-sequence-pos]')].map(x=>x.value);
  if(q.format==='sorting')return Object.fromEntries([...root.querySelectorAll('[data-sort-item]')].map(x=>[x.dataset.sortItem,x.value]));
  return root.querySelector('.rf5-science-answer')?.value||'';
}
function objectiveMark(q,value){
  if(q.format==='mc_single')return {decided:true,correct:norm(value)===norm(q.answer?.correctOption)};
  if(q.format==='typed_short'&&q.answer?.accepted?.length){
    const correct=q.answer.accepted.some(x=>norm(x)===norm(value));return correct?{decided:true,correct:true}:{decided:false,correct:false};
  }
  if(q.format==='matching'){
    const pairs=q.answer?.pairs||[];if(!pairs.length)return {decided:false,correct:false};
    return {decided:true,correct:pairs.every(p=>norm(value[p.left])===norm(p.right))};
  }
  if(q.format==='sequence'){
    const a=q.answer?.items||[];return {decided:true,correct:a.length&&a.every((x,i)=>norm(value[i])===norm(x))};
  }
  if(q.format==='sorting'){
    const cats=q.answer?.categories||{};let ok=true,any=false;
    Object.entries(cats).forEach(([cat,items])=>items.forEach(item=>{any=true;if(norm(value[item])!==norm(cat))ok=false}));
    return {decided:any,correct:ok};
  }
  return {decided:false,correct:false};
}
function rubric(q){
  if(q.answer?.markPoints?.length)return `<ol>${q.answer.markPoints.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`;
  if(q.answer?.accepted?.length)return `<ul>${q.answer.accepted.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`;
  if(q.answer?.correctOption)return `<p>${esc(q.answer.correctOption)}</p>`;
  if(q.answer?.pairs?.length)return `<ul>${q.answer.pairs.map(x=>`<li><b>${esc(x.left)}</b> — ${esc(x.right)}</li>`).join('')}</ul>`;
  if(q.answer?.items?.length)return `<ol>${q.answer.items.map(x=>`<li>${esc(x)}</li>`).join('')}</ol>`;
  if(q.answer?.categories)return `<ul>${Object.entries(q.answer.categories).map(([c,items])=>`<li><b>${esc(c)}</b>: ${items.map(esc).join(', ')}</li>`).join('')}</ul>`;
  return `<p>${esc(q.feedback?.short||'Compare your answer with the teaching feedback.')}</p>`;
}
function renderQuestion(subject){
  const ses=sessions[subject],root=pane('genericPracticePane');if(!ses||!root)return;
  if(ses.i>=ses.questions.length)return renderSessionEnd(subject);
  const q=ses.questions[ses.i],preview=ses.preview;
  root.innerHTML=`<article class="rf5-question-shell ${preview?'is-preview':''}">
    <header class="rf5-question-head"><div><p class="eyebrow">${preview?'OPTIONAL PREVIEW':'YEAR 8 FOUNDATION'} · ${esc(q.task?.label||q.format)}</p><h2>${esc(SUBJECTS[subject].label)} revision</h2></div>
    <span>${ses.i+1} / ${ses.questions.length}</span></header>
    <div class="rf5-question-progress"><i style="width:${Math.round((ses.i/ses.questions.length)*100)}%"></i></div>
    <div class="rf5-question-body"><figure><img src="./${topicArt(subject,preview?'preview':'practice')}" alt=""></figure>
    <section class="rf5-question-paper"><small>${esc(q.topic||'')}</small><h3>${esc(q.prompt)}</h3><p>${esc(q.task?.instruction||'')}</p>
    <div class="rf5-response-area">${answerUI(q)}</div>
    <button class="primary" data-science-submit>Check answer</button>
    <div class="rf5-feedback" aria-live="polite"></div></section></div>
  </article>`;
  root.querySelector('[data-science-submit]').onclick=()=>submitQuestion(subject,q);
}
function submitQuestion(subject,q){
  const ses=sessions[subject],root=pane('genericPracticePane'),paper=root.querySelector('.rf5-question-paper');
  const value=learnerValue(root,q);
  const empty=typeof value==='string'?!value.trim():Array.isArray(value)?value.some(x=>!x):Object.values(value).some(x=>!x);
  if(empty){window.LuxApp?.toast?.('Complete your answer first.');return}
  root.querySelector('[data-science-submit]').disabled=true;
  const marked=objectiveMark(q,value),fb=root.querySelector('.rf5-feedback');
  if(marked.decided){
    finishMark(subject,q,marked.correct,false);
    fb.innerHTML=`<div class="rf5-result ${marked.correct?'correct':'repair'}"><h4>${marked.correct?'Correct':'Needs repair'}</h4>
      <p>${esc(q.feedback?.short||'')}</p>${!marked.correct?`<div class="rf5-rubric"><b>Correct answer</b>${rubric(q)}</div>`:''}
      ${q.feedback?.remember?`<p><b>Remember:</b> ${esc(q.feedback.remember)}</p>`:''}
      <button class="primary" data-science-next>${ses.i+1>=ses.questions.length?'Finish session':'Next question'}</button></div>`;
    fb.querySelector('[data-science-next]').onclick=()=>nextQuestion(subject);
  }else{
    fb.innerHTML=`<div class="rf5-result review"><h4>Self-check against the source answer</h4>
      <p>Your response needs a mark-point check rather than unsafe exact-string marking.</p>
      <div class="rf5-rubric">${rubric(q)}</div>
      ${q.feedback?.commonError?`<p><b>Common error:</b> ${esc(q.feedback.commonError)}</p>`:''}
      <div class="rf5-selfmark"><button class="primary" data-selfmark="correct">I included the required science</button><button class="secondary" data-selfmark="repair">Needs repair</button></div></div>`;
    fb.querySelectorAll('[data-selfmark]').forEach(b=>b.onclick=()=>{
      const correct=b.dataset.selfmark==='correct';finishMark(subject,q,correct,true);
      fb.querySelector('.rf5-selfmark').innerHTML=`<button class="primary" data-science-next>${ses.i+1>=ses.questions.length?'Finish session':'Next question'}</button>`;
      fb.querySelector('[data-science-next]').onclick=()=>nextQuestion(subject);
    });
  }
}
function finishMark(subject,q,correct,manual){
  const ses=sessions[subject];if(!ses)return;
  updateMastery(subject,q,correct,{manual,preview:ses.preview});
  ses.answered++;if(correct)ses.correct++;
}
function nextQuestion(subject){const ses=sessions[subject];if(!ses)return;ses.i++;renderQuestion(subject)}
function renderSessionEnd(subject){
  const ses=sessions[subject],root=pane('genericPracticePane');if(!ses||!root)return;
  const pct=ses.answered?Math.round(ses.correct/ses.answered*100):0;
  root.innerHTML=`<section class="rf5-session-end"><figure><img src="./${topicArt(subject,'progress')}" alt=""></figure><div>
  <p class="eyebrow">${ses.preview?'PREVIEW COMPLETE':'REVISION COMPLETE'}</p><h2>${ses.correct} / ${ses.answered}</h2><p>${pct}% checked correct.</p>
  <p>${ses.preview?'Preview work stayed separate from ordinary Year 8 mastery and Scholar XP.':'Wrong answers are scheduled back into the repair cycle instead of repeating immediately.'}</p>
  <button class="primary" data-again>Another session</button><button class="secondary" data-progress>View progress</button></div></section>`;
  root.querySelector('[data-again]').onclick=()=>renderPracticeHome(subject);
  root.querySelector('[data-progress]').onclick=()=>{
    document.querySelectorAll('[data-subject-tab]').forEach(x=>x.classList.toggle('active',x.dataset.subjectTab==='progress'));
    root.classList.add('hidden');pane('genericProgressPane')?.classList.remove('hidden');renderProgress(subject);
  };
}
async function renderProgress(subject){
  if(!(await ensureIndex()))return false;
  const root=pane('genericProgressPane');if(!root)return false;
  const s=load(subject),sum=masterySummary(subject),ts=topics(subject,{includePreview:false});
  root.innerHTML=`<section class="rf5-progress-spread"><div class="rf5-progress-copy">
    <p class="eyebrow">YEAR 8 FOUNDATION · REAL EVIDENCE</p><h2>${SUBJECTS[subject].label} progress</h2>
    <p>Recognition can build confidence, but only production/application evidence can move a concept toward secure.</p>
    <div class="rf5-mastery-ledger">
      <div><b>${sum.secure||0}</b><span>Secure</span></div><div><b>${sum.consolidating||0}</b><span>Consolidating</span></div>
      <div><b>${sum.learning||0}</b><span>Learning</span></div><div><b>${dueCount(subject)}</b><span>Due</span></div>
    </div>
    <div class="rf5-progress-topics">${ts.map(t=>{
      const recs=Object.entries(s.concepts).filter(([id,c])=>id.startsWith(t.topicId));
      const secure=recs.filter(([,c])=>c.state==='secure').length;
      return `<article><span>${esc(t.title)}</span><b>${secure} secure</b><small>${recs.length?`${recs.length} concepts attempted`:'Not started'}</small></article>`
    }).join('')}</div>
  </div><figure><img src="./${topicArt(subject,'progress')}" alt="${SUBJECTS[subject].label} progress scene"></figure></section>`;
  return true;
}
async function render(subject,tab){
  if(!SUBJECTS[subject])return false;
  if(tab==='learn')return renderLearn(subject);
  if(tab==='practice')return renderPracticeHome(subject);
  if(tab==='progress')return renderProgress(subject);
  const root=pane('genericPlayPane');
  if(root)root.innerHTML=`<div class="unavailable-pane"><p class="eyebrow">YEAR 8 ${esc(SUBJECTS[subject].label.toUpperCase())}</p><h2>Practice is the active revision mode.</h2><p>Dedicated science games are not being used as formal mastery evidence.</p></div>`;
  return true;
}
window.ScienceY8=Object.freeze({ensureIndex,topics,bundle,dueCount,masterySummary,render,renderLearn,renderPracticeHome,renderProgress,startPractice,renderNote});
})();
