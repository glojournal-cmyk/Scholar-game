(function(){
'use strict';
const LABEL={latin:'Latin',french:'French',biology:'Biology',chemistry:'Chemistry',physics:'Physics'};
const ICON={latin:'L',french:'F',biology:'B',chemistry:'C',physics:'P'};
let current={subject:'latin',track:'foundation',tab:'practice'};

function canonicalRoute(subject=current.subject,track=current.track,tab=current.tab){
 let slug=subject;
 if(track==='foundation'&&['biology','chemistry','physics'].includes(subject))slug=`${subject}-foundation`;
 return `#subject/${slug}/${tab}`;
}

function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function due(subject){
 if(subject==='latin'||subject==='french')return Number(window.MasterY8?.dueCount?.(subject))||0;
 if(subject==='biology')return Number(window.BiologyY8?.dueCount?.())||0;
 if(subject==='chemistry'||subject==='physics')return Number(window.ScienceY8?.dueCount?.(subject))||0;
 return 0;
}
function weak(subject){
 if(subject==='latin'||subject==='french')return Number(window.MasterY8?.weakCount?.(subject))||0;
 if(subject==='biology')return Number(window.BiologyY8?.weakCount?.())||0;
 return 0;
}
function latinMastery(){
 try{
  const s=window.LatinModule?.state?.();const vals=Object.values(s?.categoryCycles||{}).map(x=>x.completedPercent).filter(x=>Number.isFinite(x));
  if(!vals.length)return 'Building foundations';
  const secure=vals.filter(x=>x>=85).length;
  return secure?`${secure} area${secure===1?'':'s'} secure`:'Learning in progress';
 }catch{return 'Learning in progress'}
}
function frenchMastery(){
 try{
  const s=window.FrenchModule?.todayStats?.();
  return s?.loaded?'Learning in progress':'Preparing tools';
 }catch{return 'Learning in progress'}
}
function scienceCard(subject){
 const pack=window.ScholarScience?.get(subject);
 return `<article class="study-card">
   <div class="subject-orb">${ICON[subject]}</div><h3>${LABEL[subject]}</h3>
   <p>Current Year 9 revision notes are ready to learn topic by topic.</p>
   <div class="study-status"><span>${pack?.topics.length||0} learning topics</span><span>Learn available</span></div>
   <div class="card-action"><small>Practice waits for an approved bank</small><button class="primary" data-open-subject="${subject}" data-track="current">Learn</button></div>
 </article>`;
}
function unavailableCurrent(subject){
 return `<article class="study-card">
   <div class="subject-orb">${ICON[subject]}</div><h3>${LABEL[subject]}</h3>
   <p>Current Year 9 lessons are not available yet.</p>
   <div class="unavailable-note">Not available yet</div>
 </article>`;
}
function foundationCard(subject){
 if(subject==='biology'){
   const d=Number(window.BiologyY8?.dueCount?.())||0,w=Number(window.BiologyY8?.weakCount?.())||0;
   return `<article class="study-card">
    <div class="subject-orb">${ICON[subject]}</div><h3>Biology</h3>
    <p>Year 8 Foundation Review from the structured Master Content Pack.</p>
    <div class="study-status"><span>${d} due</span>${w?`<span>${w} to revisit</span>`:'<span>On track</span>'}</div>
    <div class="card-action"><small>Learn · Practise · Progress</small><button class="primary" data-open-subject="${subject}" data-track="foundation">Continue</button></div>
   </article>`;
 }
 const d=due(subject),w=weak(subject);
 return `<article class="study-card">
   <div class="subject-orb">${ICON[subject]}</div><h3>${LABEL[subject]}</h3>
   <p>Year 8 Foundation Review for consolidation and scheduled recall.</p>
   <div class="study-status"><span>${d} due</span>${w?`<span>${w} to revisit</span>`:'<span>On track</span>'}</div>
   <div class="card-action"><small>${subject==='latin'?latinMastery():frenchMastery()}</small><button class="primary" data-open-subject="${subject}" data-track="foundation">Continue</button></div>
 </article>`;
}
function scienceFoundationCard(subject){
 const d=due(subject),summary=window.ScienceY8?.masterySummary?.(subject)||{};
 return `<article class="study-card rf5-foundation-science" data-foundation-subject="${subject}">
   <div class="subject-orb">${ICON[subject]}</div><h3>${LABEL[subject]}</h3>
   <p>Year 8 Foundation Review with source-locked revision notes, retrieval and application practice.</p>
   <div class="study-status"><span>${d} due</span><span>${summary.secure||0} secure</span></div>
   <div class="card-action"><small>Confirmed Year 8 content; optional preview stays separate.</small><button class="primary" data-open-subject="${subject}" data-track="foundation">Continue</button></div>
 </article>`;
}
function renderStudy(){
 const currentGrid=document.getElementById('currentStudyGrid'),foundationGrid=document.getElementById('foundationStudyGrid');
 if(!currentGrid||!foundationGrid)return;
 currentGrid.innerHTML=unavailableCurrent('latin')+unavailableCurrent('french')+scienceCard('biology')+scienceCard('chemistry')+scienceCard('physics');
 foundationGrid.innerHTML=foundationCard('latin')+foundationCard('french')+foundationCard('biology')+scienceFoundationCard('chemistry')+scienceFoundationCard('physics');
}

function configureTabs(subject,track){
 const supported=new Set(['learn','practice','play','progress']);
 document.querySelectorAll('[data-subject-tab]').forEach(b=>{
   const tab=b.dataset.subjectTab;
   let enabled=supported.has(tab);
   let reason='';
   if(track==='current'&&['biology','chemistry','physics'].includes(subject)){
     if(tab==='practice'){enabled=false;reason='Practice bank not yet available'}
     if(tab==='play'){enabled=false;reason='Verified learning game not yet available'}
   }
   if(track==='foundation'&&['biology','chemistry','physics'].includes(subject)&&tab==='play'){
     enabled=false;reason=`${LABEL[subject]} Foundation uses Learn, Practise and Progress`;
   }
   b.disabled=!enabled;
   b.title=reason;
   b.setAttribute('aria-disabled',String(!enabled));
 }
)}

function renderSubjectScholarPose(subject,track,tab=current.tab){
 const img=document.getElementById('subjectScholarPose');if(!img||!window.ScholarAssets)return;
 const src=window.ScholarAssets.subjectPose(subject,tab);
 if(src&&img.getAttribute('src')!==src)img.src=src;
 img.alt=`Scholar studying ${LABEL[subject]}`;
 img.classList.toggle('hidden',!src);
}

function setHeader(subject,track){
 document.getElementById('subjectIcon').textContent=ICON[subject]||'?';
 document.getElementById('subjectTitle').textContent=LABEL[subject]||subject;
 const pill=document.getElementById('subjectTrack');
 pill.textContent=track==='current'?'Current · Year 9':'Foundation Review · Year 8';
 pill.className=`route-pill ${track==='current'?'current':'foundation'}`;
 document.getElementById('subjectSubtitle').textContent=
   track==='current'?'Learn the current course in a clear topic sequence.':'Consolidate prior learning with spaced review and focused practice.';
 const d=track==='foundation'?due(subject):0;
 document.getElementById('subjectDue').textContent=track==='foundation'&&['latin','french','biology','chemistry','physics'].includes(subject)?`${d} due`:'Current learning';
 document.getElementById('subjectMastery').textContent=
   track==='foundation'&&['latin','french'].includes(subject)?((window.MasterY8?.masterySummary?.(subject)?.secure||0)+' secure concepts'):
   track==='foundation'&&subject==='biology'?((window.BiologyY8?.masterySummary?.().secure||0)+' secure concepts'):
   track==='foundation'&&['chemistry','physics'].includes(subject)?((window.ScienceY8?.masterySummary?.(subject)?.secure||0)+' secure concepts'):
   track==='current'&&window.ScholarScience?.get(subject)?'Learn available':'Not available yet';
 const c=document.getElementById('subjectContinue');
 const available=(track==='foundation'&&['latin','french','biology','chemistry','physics'].includes(subject))||(track==='current'&&!!window.ScholarScience?.get(subject));
 c.disabled=!available;c.textContent=available?'Continue today':'Not available yet';
 c.dataset.subjectContinue=subject;c.dataset.subjectTrack=track;
 configureTabs(subject,track);
 renderSubjectScholarPose(subject,track,current.tab);
 window.V04Visual?.subject?.(subject,track,current.tab);
}
function hideAllHosts(){
 document.getElementById('latinScreen').classList.add('hidden');
 document.getElementById('frenchScreen').classList.add('hidden');
 document.querySelectorAll('[data-subject-pane]').forEach(p=>p.classList.add('hidden'));
}
function unavailable(title,copy){
 return `<div class="unavailable-pane"><p class="eyebrow">NOT AVAILABLE YET</p><h2>${esc(title)}</h2><p>${esc(copy)}</p></div>`;
}
async function renderScienceLearn(subject){
 const pack=window.ScholarScience?.get(subject),pane=document.getElementById('genericLearnPane');
 if(!pack){pane.innerHTML=unavailable('Current learning','Verified current content is not connected yet.');return}
 const topics=pack.topics;
 pane.innerHTML=`<div class="section-title"><div><p class="eyebrow">CURRENT YEAR 9</p><h2>${pack.subject} Learn</h2></div><span>${topics.length} topics</span></div>
 <div class="note-topic-list">${topics.map(t=>`<article class="note-topic">
   <p class="eyebrow">${esc(t.id)}</p><h3>${esc(t.title)}</h3><p>${esc(t.summary)}</p>
   <button class="secondary" data-open-science-topic="${esc(t.id)}">Open notes</button>
 </article>`).join('')}</div>`;
 pane.querySelectorAll('[data-open-science-topic]').forEach(b=>b.onclick=()=>showScienceTopic(subject,b.dataset.openScienceTopic));
}
async function showScienceTopic(subject,id){
 const t=window.ScholarScience?.topic(subject,id),pane=document.getElementById('genericLearnPane');if(!t)return;
 const done=window.ScholarUX?.isScienceRead?.(id);
 pane.innerHTML=`<button class="back-link" id="backTopicList">← All ${esc(LABEL[subject])} topics</button>
 <article class="note-detail">
  <p class="eyebrow">${esc(id)} · CURRENT YEAR 9</p><h2>${esc(t.title)}</h2><p>${esc(t.summary)}</p>
  ${t.must?.length?`<h3>Must memorise</h3><ul>${t.must.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
  ${t.practical?`<h3>Practical / method</h3><p>${esc(t.practical)}</p>`:''}
  ${t.mistakes?.length?`<h3>Common mistakes</h3><ul>${t.mistakes.map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`:''}
  ${t.extension?`<div class="extension-box"><b>Extension</b><br>${esc(t.extension)}</div>`:''}
  <div class="quiz-actions"><button class="primary" id="markTopicRead">${done?'Reviewed today ✓':'Finish notes'}</button></div>
 </article>`;
 document.getElementById('backTopicList').onclick=()=>renderScienceLearn(subject);
 document.getElementById('markTopicRead').onclick=()=>{window.ScholarUX.markScience(id);window.LuxApp.toast('Notes marked reviewed for today.');showScienceTopic(subject,id)};
 window.ScholarUX.touchSubject(subject);
}
async function renderScienceOther(subject,tab){
 const pane=document.getElementById(`generic${tab[0].toUpperCase()+tab.slice(1)}Pane`);
 const copy={
  practice:'Practice is not available yet. Use Learn for now.',
  review:'Review is not available yet. Use Learn for now.',
  play:'Play is not available yet for this subject.',
  progress:'Formal topic progress will appear when Practice becomes available.'
 }[tab];
 pane.innerHTML=unavailable(`${LABEL[subject]} ${tab}`,copy);
}
async function renderFoundationBio(tab){
 if(!(await window.BiologyY8?.ensureData?.()))throw new Error('Biology Foundation data unavailable');
 if(tab==='learn'){window.BiologyY8.renderLearn();return true}
 if(tab==='practice'){window.BiologyY8.renderFoundationHome();return true}
 if(tab==='play'){window.BiologyY8.renderPlay();return true}
 if(tab==='progress'){window.BiologyY8.renderProgress();return true}
 throw new Error(`Unsupported Biology Foundation tab: ${tab}`);
}
async function renderFrenchPlay(){
 const pane=document.getElementById('genericPlayPane');pane.classList.remove('hidden');
 pane.innerHTML=`<div class="play-promo"><div><p class="eyebrow">PLAY</p><h2>French learning games</h2><p>Games earn Scholar XP without replacing formal academic evidence.</p></div></div>
 <div class="french-play-grid">
  <article class="french-game-card">
   <img src="hero_08.webp" alt="">
   <div><p class="eyebrow">SPELLING</p><h3>Atelier d’Orthographe</h3><p>Exact learned spelling with accents. Wrong words return later rather than immediately.</p><button class="primary" id="openFrenchSpellingGame">Play</button></div>
  </article>
 </div>`;
 document.getElementById('openFrenchSpellingGame').onclick=async()=>{
   if(await window.FrenchModule.ensureData()){pane.classList.add('hidden');document.getElementById('frenchScreen').classList.remove('hidden');window.FrenchModule.show('frenchSpelling');}
 };
}
async function renderFoundationEngine(subject,tab){
 if(subject==='latin'||subject==='french'){
   if(tab==='play'){
     if(subject==='latin'){
       const playPane=document.getElementById('genericPlayPane');
       if(playPane){playPane.innerHTML='';playPane.classList.add('hidden');}
       document.getElementById('latinScreen').classList.remove('hidden');
       if(!window.GameV2?.openHub)throw new Error('Latin GameV2 engine unavailable');
       window.GameV2.openHub();
     }else{
       document.getElementById('frenchScreen').classList.add('hidden');
       await renderFrenchPlay();
     }
     window.ScholarUX.touchSubject(subject);
     return true;
   }
   const pane=document.getElementById(`generic${tab[0].toUpperCase()+tab.slice(1)}Pane`);
   pane.classList.remove('hidden');
   if(tab==='learn')await window.MasterY8.renderLearn(subject);
   else if(tab==='practice')await window.MasterY8.renderPractice(subject);
   else if(tab==='progress')await window.MasterY8.renderProgress(subject);
   else throw new Error(`Unsupported Foundation tab: ${tab}`);
   window.ScholarUX.touchSubject(subject);
   return true;
 }
 return false;
}
async function renderTab(tab){
 const allowed=['learn','practice','play','progress'];
 if(!allowed.includes(tab)){
   console.error('[SubjectHub] Unknown tab:',tab);
   window.LuxApp?.toast?.('That study section is unavailable.');
   return false;
 }
 const {subject,track}=current;
 if(!LABEL[subject]){
   console.error('[SubjectHub] Unknown subject:',subject);
   window.LuxApp?.toast?.('Unknown subject.');
   return false;
 }
 const tabButton=document.querySelector(`[data-subject-tab="${tab}"]`);
 if(tabButton?.disabled){
   window.LuxApp?.toast?.(tabButton.title||'This section is not available yet.');
   return false;
 }

 current.tab=tab;
 hideAllHosts();
 document.querySelectorAll('[data-subject-tab]').forEach(b=>b.classList.toggle('active',b.dataset.subjectTab===tab));
 renderSubjectScholarPose(subject,track,tab);
 window.V04Visual?.subject?.(subject,track,tab);

 const pane=document.getElementById(`generic${tab[0].toUpperCase()+tab.slice(1)}Pane`);
 if(pane){
   pane.classList.remove('hidden');
   pane.innerHTML='<div class="loading-panel" role="status"><span class="loading-dot"></span><p>Loading learning tools…</p></div>';
 }

 try{
   if(track==='current'){
     if(tab==='learn')await renderScienceLearn(subject);
     else await renderScienceOther(subject,tab);
   }else if(subject==='biology'){
     await renderFoundationBio(tab);
   }else if(['chemistry','physics'].includes(subject)){
     if(!(await window.ScienceY8?.ensureIndex?.()))throw new Error(`${subject} Foundation data unavailable`);
     await window.ScienceY8.render(subject,tab);
   }else{
     await renderFoundationEngine(subject,tab);
   }
   history.replaceState(null,'',canonicalRoute(subject,track,tab));
   return true;
 }catch(err){
   console.error('[SubjectHub] render failed',subject,track,tab,err);
   if(pane){
     pane.classList.remove('hidden');
     pane.innerHTML=`<div class="load-error"><h2>Could not open this activity.</h2><p>Please retry. Your saved progress has not been changed.</p><button class="primary" data-retry-subject-tab="${tab}">Retry</button></div>`;
   }
   return false;
 }
}
async function openTopicLearn(subject,topicId){
 if(!LABEL[subject])throw new Error(`Unknown subject: ${subject}`);
 const track='foundation';
 const previousHash=location.hash||canonicalRoute(subject,track,'practice');

 // Keep SubjectHub as the source of truth for subject/track/tab state.
 if(current.subject!==subject||current.track!==track){
   current={subject,track,tab:'practice'};
   setHeader(subject,track);
 }

 // Add a distinct Learn history entry so browser Back can return to Practice.
 const learnHash=canonicalRoute(subject,track,'learn');
 if(location.hash!==learnHash)history.pushState({from:previousHash,topicId},'',learnHash);

 const opened=await renderTab('learn');
 if(!opened)throw new Error(`Could not open Learn for ${subject}`);

 if(subject==='biology'){
   if(!(await window.BiologyY8?.ensureData?.()))throw new Error('Biology data unavailable');
   await window.BiologyY8.renderNote(topicId);
 }else{
   if(!(await window.MasterY8?.ensure?.(subject)))throw new Error(`${subject} data unavailable`);
   await window.MasterY8.renderNote(subject,topicId);
 }

 const pane=document.getElementById('genericLearnPane');
 pane?.classList.remove('hidden');
 document.getElementById('genericPracticePane')?.classList.add('hidden');
 document.querySelectorAll('[data-subject-tab]').forEach(b=>b.classList.toggle('active',b.dataset.subjectTab==='learn'));

 if(pane?.scrollIntoView)pane.scrollIntoView({block:'start',behavior:'auto'});
 else window.scrollTo?.({top:0,behavior:'auto'});
 return true;
}

async function continueToday(subject,track){
 if(track==='current'){return await renderTab('learn')}
 const d=due(subject);await renderTab('practice');
 if(subject==='latin'||subject==='french'){
   setTimeout(()=>window.MasterY8.startPractice(subject,d?'due':'mixed',d?7:15,'all'),0);return;
 }
 if(subject==='biology'){
   const bd=Number(window.BiologyY8?.dueCount?.())||0;
   setTimeout(()=>window.BiologyY8.startPractice(bd?'due':'mixed',bd?7:15,'all'),0);
 }
 if(subject==='chemistry'||subject==='physics'){
   const sd=Number(window.ScienceY8?.dueCount?.(subject))||0;
   setTimeout(()=>window.ScienceY8.startPractice(subject,sd?'due':'mixed',sd?7:15,'all'),0);
 }
}
async function open(subject,track='current',tab){
 if(!LABEL[subject]){console.error('[SubjectHub] Unknown subject route:',subject);window.LuxApp?.toast?.('Unknown subject route.');return false}
 if(!['current','foundation'].includes(track)){console.error('[SubjectHub] Unknown track:',track);track='current'}
 current={subject,track,tab:tab||((track==='foundation')?'practice':'learn')};
 setHeader(subject,track);
 return await renderTab(current.tab);
}
function parseRoute(hash){
 const raw=hash.replace(/^#/,'').split('/').filter(Boolean);
 if(raw[0]!=='subject')return null;
 let subject=raw[1]||'latin',track='current';
 if(subject.endsWith('-foundation')){subject=subject.replace(/-foundation$/,'');track='foundation'}
 else if(['latin','french'].includes(subject))track='foundation';
 let tab=['learn','practice','play','progress'].includes(raw[2])?raw[2]:undefined;if(raw[2]==='review')tab='practice';
 return {subject,track,tab};
}
window.SubjectHub=Object.freeze({renderStudy,open,parseRoute,renderTab,openTopicLearn,continueToday,showScienceTopic});
})();