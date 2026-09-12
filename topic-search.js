(function(){
'use strict';

let index=null;
let loading=null;
const q=s=>document.querySelector(s);

function norm(v){
  return String(v??'')
    .normalize('NFKD').replace(/[\u0300-\u036f]/g,'')
    .toLowerCase().replace(/[’]/g,"'")
    .replace(/[^\p{L}\p{N}%+\-/' ]/gu,' ')
    .replace(/\s+/g,' ').trim();
}
function esc(v){
  return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
async function ensure(){
  if(index)return index;
  if(loading)return loading;
  loading=fetch('./topic-search-index.json',{cache:'no-store'}).then(r=>{
    if(!r.ok)throw new Error(`topic-search-index.json: ${r.status}`);
    return r.json();
  }).then(x=>index=x);
  return loading;
}
function subjectLabel(s){return ({latin:'Latin',french:'French',biology:'Biology',chemistry:'Chemistry',physics:'Physics'})[s]||s}

function score(entry,query){
  const needle=norm(query);
  if(!needle)return 0;
  const words=needle.split(' ').filter(Boolean);
  const title=norm(entry.title);
  const aliases=norm((entry.aliases||[]).join(' '));
  const summary=norm(entry.summary);
  const body=norm(entry.searchText);
  const subject=norm(subjectLabel(entry.subject));
  let n=0;

  if(title===needle)n+=150;
  if(title.includes(needle))n+=95;
  if(aliases.includes(needle))n+=82;
  if(summary.includes(needle))n+=48;
  if(body.includes(needle))n+=42;
  if(subject===needle)n+=35;

  for(const w of words){
    if(title.includes(w))n+=24;
    if(aliases.includes(w))n+=18;
    if(summary.includes(w))n+=9;
    if(body.includes(w))n+=5;
    if(subject.includes(w))n+=4;
  }

  // Prefer source-backed/active material, while still allowing preview results.
  if(entry.status==='enabled')n+=8;
  if(entry.status==='preview')n-=3;

  // For a Year 9 learner, Latin bridge results should be easy to reach.
  if(entry.subject==='latin'&&entry.track==='current')n+=5;
  return n;
}
function search(query){
  if(!index)return [];
  return index.entries
    .map(e=>({e,s:score(e,query)}))
    .filter(x=>x.s>8)
    .sort((a,b)=>b.s-a.s||a.e.title.localeCompare(b.e.title))
    .slice(0,10)
    .map(x=>x.e);
}
function resultMarkup(e){
  const preview=e.status==='preview'?'<span class="topic-search-preview">Preview</span>':'';
  return `<button class="topic-search-result" type="button"
    data-topic-search-id="${esc(e.id)}"
    data-topic-search-kind="${esc(e.kind)}"
    data-topic-search-subject="${esc(e.subject)}"
    data-topic-search-track="${esc(e.track)}">
      <span class="topic-search-result-art"><img src="${art(e.subject)}" alt=""></span>
      <span class="topic-search-result-copy">
        <span class="topic-search-meta">${esc(subjectLabel(e.subject))} · ${esc(e.badge||'Revision')} ${preview}</span>
        <strong>${esc(e.title)}</strong>
        <small>${esc(e.summary||'Open this revision topic.')}</small>
      </span>
      <span class="topic-search-open">Open</span>
    </button>`;
}
function art(subject){
  return ({
    latin:'./study_latin_textbook.png',
    french:'./study_french_notebook.png',
    biology:'./study_biology_book.png',
    chemistry:'./study_pen_and_book.png',
    physics:'./study_planner.png'
  })[subject]||'./study_book_stack.png';
}
function render(query){
  const results=q('#topicSearchResults');
  const hint=q('#topicSearchHint');
  if(!results)return;
  const value=String(query||'').trim();
  if(!value){
    results.innerHTML=`<div class="topic-search-empty">
      <img src="./study_flashcards.png" alt="">
      <strong>What would you like to revise?</strong>
      <p>Try “imperfect tense”, “photosynthesis”, “forces”, “acids” or a subject name.</p>
    </div>`;
    if(hint)hint.textContent=`${index?.count||0} searchable revision topics`;
    return;
  }
  const rows=search(value);
  if(hint)hint.textContent=rows.length?`${rows.length} best matches`:'No matching topic found';
  results.innerHTML=rows.length?rows.map(resultMarkup).join(''):`<div class="topic-search-empty">
    <strong>No close match yet.</strong>
    <p>Try a shorter phrase, e.g. “imperfect”, “energy”, “cells” or “translation”.</p>
  </div>`;
}
async function open(){
  const modal=q('#topicSearchModal');
  if(!modal)return;
  modal.classList.remove('hidden');
  document.body.classList.add('topic-search-open');
  try{
    await ensure();
    const input=q('#topicSearchInput');
    render(input?.value||'');
    requestAnimationFrame(()=>input?.focus());
  }catch(err){
    console.error('[TopicSearch] load failed',err);
    q('#topicSearchResults').innerHTML='<div class="topic-search-empty"><strong>Search could not load.</strong><p>Please refresh and try again.</p></div>';
  }
}
function close(){
  q('#topicSearchModal')?.classList.add('hidden');
  document.body.classList.remove('topic-search-open');
}
async function openResult(el){
  const {topicSearchId:id,topicSearchKind:kind,topicSearchSubject:subject}=el.dataset;
  close();
  try{
    if(kind==='language'){
      if(subject==='latin'){
        const ok=await window.LuxApp?.goSubject?.('latin','current','learn');
        if(!ok)return;
        if(!(await window.MasterY8?.ensure?.('latin')))throw new Error('Latin search data unavailable');
        await window.MasterY8.renderNote('latin',id);
        history.replaceState(null,'',`#subject/latin-current/learn`);
      }else{
        await window.SubjectHub?.openTopicLearn?.(subject,id);
      }
    }else if(kind==='biology'){
      await window.SubjectHub?.openTopicLearn?.('biology',id);
    }else if(kind==='science-y8'){
      const ok=await window.LuxApp?.goSubject?.(subject,'foundation','learn');
      if(!ok)return;
      if(!(await window.ScienceY8?.ensureIndex?.()))throw new Error(`${subject} search data unavailable`);
      await window.ScienceY8.renderNote(subject,id);
    }else if(kind==='science-current'){
      const ok=await window.LuxApp?.goSubject?.(subject,'current','learn');
      if(!ok)return;
      await window.SubjectHub?.showScienceTopic?.(subject,id);
    }
    window.scrollTo({top:0,behavior:'auto'});
    window.ScholarAudio?.chime?.('confirm');
  }catch(err){
    console.error('[TopicSearch] open failed',kind,subject,id,err);
    window.LuxApp?.toast?.('That topic could not be opened. Please retry.');
  }
}

document.addEventListener('click',e=>{
  if(e.target.closest('#globalTopicSearch')){e.preventDefault();open();return}
  if(e.target.closest('[data-topic-search-close]')){e.preventDefault();close();return}
  const result=e.target.closest('[data-topic-search-id]');
  if(result){e.preventDefault();openResult(result);return}
});
document.addEventListener('input',e=>{
  if(e.target.id==='topicSearchInput')render(e.target.value);
});
document.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!q('#topicSearchModal')?.classList.contains('hidden')){close();return}
  if(e.key==='/'&&!e.ctrlKey&&!e.metaKey&&!e.altKey){
    const tag=document.activeElement?.tagName;
    if(!['INPUT','TEXTAREA','SELECT'].includes(tag)){
      e.preventDefault();open();
    }
  }
});

window.TopicSearch=Object.freeze({open,close,ensure,search});
})();