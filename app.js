(function(){
'use strict';
let toastTimer;

function toast(msg){
 const t=document.getElementById('toast');if(!t)return;
 t.textContent=msg;t.classList.add('show');clearTimeout(toastTimer);
 toastTimer=setTimeout(()=>t.classList.remove('show'),2400);
}
function growth(){
 const g=window.LuxGrowth.snapshot();
 document.querySelectorAll('[data-growth="level"]').forEach(x=>x.textContent=g.level);
 document.querySelectorAll('[data-growth="xp"]').forEach(x=>x.textContent=g.into);
 document.querySelectorAll('[data-growth="next"]').forEach(x=>x.textContent=g.next);
 document.querySelectorAll('[data-growth-bar]').forEach(x=>x.style.width=`${Math.min(100,Math.round((g.into/Math.max(1,g.next))*100))}%`);
 return g;
}
function dateKey(d){return window.ScholarUX.day(d)}
function routeInfo(){
 let h=location.hash||'#home';
 const legacy={
  '#latin':'#subject/latin/practice','#french':'#subject/french/practice',
  '#collection':'#scholar/collection','#profile':'#scholar/profile',
  '#games':'#subject/latin/play','#gamesHub':'#subject/latin/play'
 };
 if(legacy[h]){history.replaceState(null,'',legacy[h]);h=legacy[h]}
 const parts=h.replace(/^#/,'').split('/').filter(Boolean);
 if(!parts.length)return {screen:'home'};
 if(parts[0]==='subject')return {screen:'subject',subject:window.SubjectHub.parseRoute(h)};
 if(parts[0]==='scholar')return {screen:'scholar',tab:['overview','wardrobe','collection','achievements','profile'].includes(parts[1])?parts[1]:'overview'};
 if(['home','study','garden'].includes(parts[0]))return {screen:parts[0]};
 return {screen:'home',redirect:true};
}
function showScreen(name){
 document.querySelectorAll('[data-route-screen]').forEach(s=>s.classList.toggle('hidden',s.dataset.routeScreen!==name));
 document.querySelectorAll('[data-global-route]').forEach(b=>b.classList.toggle('active',b.dataset.globalRoute===name));
}
function go(dest){
 const hash=dest.startsWith('#')?dest:`#${dest}`;
 if(location.hash===hash)render().catch(err=>{console.error('[Router] render failed',err);toast('This page could not be opened.')});
 else location.hash=hash;
}
async function goSubject(subject,track='current',tab){
 let slug=subject;
 if(track==='foundation'&&['biology','chemistry','physics'].includes(subject))slug=`${subject}-foundation`;
 const defaultTab=tab||(track==='foundation'?'practice':'learn');
 const hash=`#subject/${slug}/${defaultTab}`;
 if(location.hash!==hash)history.pushState(null,'',hash);
 showScreen('subject');
 growth();
 const ok=await window.SubjectHub.open(subject,track,defaultTab);
 const ux=window.ScholarUX.load();ux.lastRoute=hash;window.ScholarUX.save(ux);
 window.scrollTo({top:0,behavior:'auto'});
 return ok;
}
function greeting(){
 const h=new Date().getHours();return h<12?'Good morning':h<18?'Good afternoon':'Good evening';
}
function reviewDateSet(){
 const dates=new Set();
 try{(window.MasterY8?.reviewDates?.('latin')||[]).forEach(x=>dates.add(x))}catch{}
 try{(window.MasterY8?.reviewDates?.('french')||[]).forEach(x=>dates.add(x))}catch{}
 try{(window.BiologyY8?.reviewDates?.()||[]).forEach(x=>dates.add(x))}catch{}
 return dates;
}
function renderWeek(){
 const root=document.getElementById('weekStrip');if(!root)return;
 const now=new Date(),todayKey=dateKey(now),due=reviewDateSet(),days=[];
 for(let delta=-3;delta<=3;delta++){const d=new Date(now);d.setDate(now.getDate()+delta);days.push(d)}
 root.innerHTML=days.map(d=>{
   const k=dateKey(d),complete=window.DailyPlan.completedOn(k),today=k===todayKey,future=d>now,dueReview=due.has(k);
   return `<div class="week-day ${complete?'complete ':''}${today?'today ':''}${future?'future ':''}${!complete&&!future&&!today?'no-study ':''}${dueReview?'review-due':''}" title="${dueReview?'Review due · ':''}${complete?'Study complete':'Learning day'}">
    <span>${new Intl.DateTimeFormat('en-GB',{weekday:'short'}).format(d)}</span><strong>${d.getDate()}</strong><i aria-hidden="true"></i>
   </div>`;
 }).join('');
}
function taskProgressText(t){
 if(t.kind==='science-learn')return t.progress.value?'Reviewed today':'1 topic';
 if(t.kind==='latin-game'||t.kind==='french-game')return t.progress.value?'Round complete':'1 round';
 if(t.reason==='Due review')return t.progress.value>=t.progress.target?'Complete':`${t.target} questions`;
 return `${t.progress.value} / ${t.progress.target}`;
}
function displayTaskTitle(t){
 const title=String(t?.title||'');
 if(title==='Repair weak Latin')return 'Latin Boost';
 if(title==='Repair weak French')return 'French Boost';
 return title;
}
function taskDescription(t){
 if(t.reason==='Due review')return 'Scheduled recall from earlier learning.';
 if(t.reason==='Weak area')return 'A short boost chosen from items that need more confidence.';
 if(t.reason==='Current learning')return 'Continue the verified Year 9 learning sequence.';
 if(t.reason==='Game')return 'A short real learning game. Scholar XP is separate from mastery.';
 return 'A focused foundation session to keep earlier learning fluent.';
}
function taskButtonLabel(t){
 if(t.progress.value>=t.progress.target)return 'Review';
 if(t.progress.value>0)return 'Continue';
 return t.reason==='Game'?'Play':'Start';
}
function renderToday(){
 const s=window.DailyPlan.status();
 document.getElementById('todayProgressText').textContent=`${s.done} / ${s.total} tasks complete`;
 document.getElementById('todayProgressBar').style.width=`${s.total?Math.round(s.done/s.total*100):0}%`;
 const main=s.tasks.find(t=>t.progress.value<t.progress.target)||s.tasks[0];
 const secondary=s.tasks.filter(t=>!main||t.id!==main.id);
 const mainRoot=document.getElementById('mainQuest'),secondaryRoot=document.getElementById('secondaryTasks');
 if(!main){mainRoot.innerHTML='<p>Nothing scheduled today.</p>';secondaryRoot.innerHTML='';return}
 mainRoot.classList.toggle('complete',main.progress.value>=main.progress.target);
 mainRoot.innerHTML=`<div>
   <div class="quest-kicker"><span>TODAY'S MAIN QUEST</span><span class="reason">${main.reason}</span></div>
   <h3>${window.DailyPlan.displaySubject(main.subject)} · ${displayTaskTitle(main)}</h3>
   <p>${taskDescription(main)}</p>
   <div class="quest-meta"><span>~${main.minutes} min</span><span>${taskProgressText(main)}</span></div>
  </div>
  <button class="primary" data-start-main="${main.id}">${taskButtonLabel(main)}</button>`;
 secondaryRoot.innerHTML=secondary.map(t=>`<article class="secondary-task">
   <div><small>${window.DailyPlan.displaySubject(t.subject).toUpperCase()} · ${t.reason}</small><h3>${displayTaskTitle(t)}</h3><p>${taskProgressText(t)} · ~${t.minutes} min</p></div>
   <button class="secondary" data-start-secondary="${t.id}">${taskButtonLabel(t)}</button>
  </article>`).join('');
}
async function startQuickGame(subject,gameId){
 window.ScholarUX.touchSubject(subject);
 if(subject==='latin'){
   const opened=await goSubject('latin','foundation','play');
   if(!opened)throw new Error('Latin Play hub failed to open');
   if(!window.GameV2?.start)throw new Error('Latin GameV2.start unavailable');
   window.GameV2.start(gameId);
   return true;
 }
 if(subject==='french'){
   const opened=await goSubject('french','foundation','play');
   if(!opened)throw new Error('French Play hub failed to open');
   const ok=await window.FrenchModule.ensureData();
   if(!ok)throw new Error('French data unavailable');
   document.getElementById('genericPlayPane')?.classList.add('hidden');
   document.getElementById('frenchScreen')?.classList.remove('hidden');
   window.FrenchModule.show('frenchSpelling');
   if(!window.FrenchModule.startSpelling)throw new Error('French spelling engine unavailable');
   window.FrenchModule.startSpelling();
   return true;
 }
 throw new Error(`Unknown game subject: ${subject}`);
}
async function startTask(t){
 if(!t)return;
 window.ScholarUX.touchSubject(t.subject);
 if(t.kind==='science-learn'){
   goSubject(t.subject,'current','learn');
   setTimeout(()=>window.SubjectHub.showScienceTopic(t.subject,t.topicId),0);return;
 }
 if(t.kind==='latin-game'){return startQuickGame('latin',t.gameId||'verbum')}
 if(t.kind==='french-game'){return startQuickGame('french',t.gameId||'atelier-spelling')}
 if(t.kind==='latin-due'){
   goSubject('latin','foundation','practice');setTimeout(()=>window.MasterY8.startPractice('latin','due',7,'all'),80);return;
 }
 if(t.kind==='french-due'){
   goSubject('french','foundation','practice');
   if(await window.MasterY8.ensure('french'))setTimeout(()=>window.MasterY8.startPractice('french','due',7,'all'),80);return;
 }
 if(t.kind==='biology-due'){
   goSubject('biology','foundation','practice');
   if(await window.BiologyY8.ensureData())setTimeout(()=>window.BiologyY8.startPractice('due',7,'all'),80);return;
 }
 if(t.kind==='latin-weak'){
   goSubject('latin','foundation','practice');setTimeout(()=>window.MasterY8.startPractice('latin','weak',7,'all'),80);return;
 }
 if(t.kind==='french-weak'){
   goSubject('french','foundation','practice');
   if(await window.MasterY8.ensure('french'))setTimeout(()=>window.MasterY8.startPractice('french','weak',7,'all'),80);return;
 }
 if(t.kind==='biology-weak'){
   goSubject('biology','foundation','practice');
   if(await window.BiologyY8.ensureData())setTimeout(()=>window.BiologyY8.startPractice('weak',7,'all'),80);return;
 }
 if(t.kind==='latin-practice'){
   goSubject('latin','foundation','practice');setTimeout(()=>window.MasterY8.startPractice('latin','mixed',15,'all'),80);return;
 }
 if(t.kind==='french-practice'){
   goSubject('french','foundation','practice');
   if(await window.MasterY8.ensure('french'))setTimeout(()=>window.MasterY8.startPractice('french','mixed',15,'all'),80);
 }
}
function nextReward(g){
 const s=g.state,candidates=[
  ['ink-pot','Ink Pot',40,!!s.collectibles?.['ink-pot']],['study-books','Study Books',250,!!s.collectibles?.['study-books']],
  ['golden-lexicon','Golden Lexicon',1500,!!s.collectibles?.['golden-lexicon']]
 ];
 const next=candidates.find(x=>!x[3])||[null,'Flourishing Garden',Math.max(g.total+100,g.total),false];
 return {id:next[0],name:next[1],need:next[2],left:Math.max(0,next[2]-g.total)};
}
let lastCollectibleCount=null,lastCollectibleIds=new Set();
function renderReward(animate=false){
 const g=growth(),r=nextReward(g),card=document.getElementById('nextRewardCard'),artRoot=document.getElementById('nextRewardArt');
 document.getElementById('nextRewardName').textContent=r.name;
 document.getElementById('nextRewardCopy').textContent=r.left?`${r.left} XP to unlock`:'Unlocked through study';
 artRoot.dataset.rewardName=r.id||'unmapped';
 const art=r.id?window.ScholarAssets?.rewardAsset?.(r.id):null;
 artRoot.classList.toggle('has-reward-art',!!art);
 artRoot.innerHTML=art?`<img class="reward-interaction-art" src="${art}" alt="${r.name} reward preview" loading="lazy" decoding="async">`:'';
 const pct=r.need?Math.min(100,Math.round(g.total/r.need*100)):100;
 document.getElementById('nextRewardBar').style.width=`${pct}%`;
 document.getElementById('homeGrowthStage').textContent=`Garden Stage ${g.gardenStage}`;
 document.getElementById('homeGrowthHint').textContent=
   g.gardenStage===1?'Your Scholar world is beginning to grow.':
   g.gardenStage===2?'Study is adding the first visible details.':
   g.gardenStage===3?'Your Garden is becoming established.':'Your Scholar world is flourishing.';
 if(lastCollectibleCount===null)lastCollectibleCount=g.collectibleCount;
 if(animate&&g.collectibleCount>lastCollectibleCount){
   card.classList.remove('just-unlocked');void card.offsetWidth;card.classList.add('just-unlocked');
   setTimeout(()=>card.classList.remove('just-unlocked'),900);
 }
 lastCollectibleCount=g.collectibleCount;
 lastCollectibleIds=new Set(Object.keys(g.state.collectibles||{}));
}
function flashScholarRewardUnlock(rewardId){
 const outfit=window.ScholarAssets?.selectedOutfit?.();
 const homeImg=document.getElementById('homeScholarImage');
 if(homeImg&&outfit?.id==='school-uniform'){
   const reaction=window.ScholarAssets?.homeReactionAsset?.('rewardUnlock');
   if(reaction)homeImg.src=reaction;
 }
 const art=window.ScholarAssets?.rewardAsset?.(rewardId),artRoot=document.getElementById('nextRewardArt');
 if(art&&artRoot){
   artRoot.classList.add('has-reward-art','reward-unlock-preview');
   artRoot.innerHTML=`<img class="reward-interaction-art" src="${art}" alt="Unlocked reward" decoding="async">`;
 }
 setTimeout(()=>{
   if(routeInfo().screen==='home'){renderScholarScene();renderReward();}
 },1400);
}
function renderQuickPlay(){
 const root=document.getElementById('quickPlayGrid'),drawer=document.getElementById('allGamesDrawer');
 const recommended=[
  {subject:'latin',id:'verbum',name:'Verbum Match',copy:'Vocabulary and grammar connections',time:'~3 min'},
  {subject:'french',id:'atelier-spelling',name:'Spelling Sprint',copy:'Exact French recall with accents',time:'~3 min'},
  {subject:'latin',id:'mosaic',name:'Sentence Mosaic',copy:'Build valid Latin sentences',time:'~4 min'}
 ];
 root.innerHTML=recommended.map(g=>`<article class="quick-play-card" data-subject="${g.subject}">
   <div class="quick-play-icon" aria-hidden="true"></div><div><small>${g.subject.toUpperCase()}</small><strong>${g.name}</strong><em>${g.copy} · ${g.time}</em></div>
   <button class="primary" data-quick-game="${g.id}" data-game-subject="${g.subject}">Play</button>
  </article>`).join('');
 const all=[
  ['latin','forma','Forma Forge','Build and repair Latin forms'],
  ['latin','mosaic','Sentence Mosaic','Build valid Latin sentences'],
  ['latin','verbum','Verbum Match','Vocabulary and grammar connections'],
  ['latin','manuscript','Manuscript Mystery','Inspect and restore Latin'],
  ['french','atelier-spelling','Atelier d’Orthographe','French spelling recall']
 ];
 drawer.innerHTML=`<div class="all-games-grid">${all.map(g=>`<button class="all-game-button" data-all-game="${g[1]}" data-game-subject="${g[0]}"><strong>${g[2]}</strong><small>${g[0][0].toUpperCase()+g[0].slice(1)} · ${g[3]}</small></button>`).join('')}</div>`;
}
function renderSubjectTraining(){
 const root=document.getElementById('subjectTrainingGrid');if(!root)return;
 const latinDue=Number(window.MasterY8?.dueCount?.('latin'))||0,latinWeak=Number(window.MasterY8?.weakCount?.('latin'))||0;
 const frenchDue=Number(window.MasterY8?.dueCount?.('french'))||0,frenchWeak=Number(window.MasterY8?.weakCount?.('french'))||0;
 const bioDue=Number(window.BiologyY8?.dueCount?.())||0,bioWeak=Number(window.BiologyY8?.weakCount?.())||0;
 const latinMaster=window.MasterY8?.masterySummary?.('latin')||{},frenchMaster=window.MasterY8?.masterySummary?.('french')||{},bioMaster=window.BiologyY8?.masterySummary?.()||{};
 const cards=[
  {subject:'latin',track:'foundation',label:'Latin',micro:'YEAR 8 FOUNDATION',detail:'Structured mastery, review and free topic training.',stats:[`${latinMaster.secure||0} secure`,`${latinDue} due`,`${latinWeak} boost`],cta:'Train Latin'},
  {subject:'french',track:'foundation',label:'French',micro:'YEAR 8 FOUNDATION',detail:'Structured mastery, accents, review and free training.',stats:[`${frenchMaster.secure||0} secure`,`${frenchDue} due`,`${frenchWeak} boost`],cta:'Train French'},
  {subject:'biology',track:'foundation',label:'Biology',micro:'YEAR 8 FOUNDATION + Y9 LEARN',detail:'Foundation questions are trainable; Year 9 verified Learn stays available.',stats:[`${bioMaster.secure||0} secure`,`${bioDue} due`,`${bioWeak} boost`],cta:'Train Biology'},
  {subject:'chemistry',track:'current',label:'Chemistry',micro:'CURRENT · YEAR 9',detail:'Verified Year 9 Learn notes. Practice waits for a verified bank.',stats:['Learn available'],cta:'Continue Chemistry'},
  {subject:'physics',track:'current',label:'Physics',micro:'CURRENT · YEAR 9',detail:'Verified Year 9 Learn notes. Practice waits for a verified bank.',stats:['Learn available'],cta:'Continue Physics'}
 ];
 root.innerHTML=cards.map(c=>`<article class="training-access-card" data-subject="${c.subject}">
  <div class="training-access-top"><div class="training-access-icon">${c.label[0]}</div><small>${c.micro}</small></div>
  <h3>${c.label}</h3><p>${c.detail}</p>
  <div class="training-access-stats">${c.stats.map(s=>`<span>${s}</span>`).join('')}</div>
  <button class="primary" data-train-subject="${c.subject}" data-train-track="${c.track}">${c.cta}</button>
 </article>`).join('');
}
function prettyWardrobe(v,fallback='None'){
 if(v===null||v===undefined||v==='none')return fallback;
 return String(v).replace(/[-_]/g,' ').replace(/\b\w/g,c=>c.toUpperCase());
}
function renderScholarScene(){
 const s=window.LuxGrowth.load(),stage=document.getElementById('scholarArtSlot'),img=document.getElementById('homeScholarImage');
 const selected=window.ScholarAssets?.selectedOutfit?.();
 if(stage&&img&&selected){
   const asset=window.ScholarAssets.homeAsset();
   if(img.getAttribute('src')!==asset)img.src=asset;
   img.alt=`Scholar · ${selected.name}`;
   stage.classList.add('has-scholar-art');
   stage.dataset.outfit=selected.id;
 }
 const loadout=document.getElementById('sceneLoadout');
 if(loadout&&selected)loadout.innerHTML=[
   `Outfit · ${selected.name}`,
   selected.id==='school-uniform'?`Pose · ${window.ScholarAssets.baseHomeState()}`:'Full-render appearance'
 ].map(x=>`<span>${x}</span>`).join('');
 const decor=document.getElementById('sceneUnlockedDecor');
 if(decor){
   const items=Object.keys(s.collectibles||{}).slice(-3).reverse();
   decor.innerHTML=(items.length?items:['Next item waiting']).map(id=>`<span>${id==='Next item waiting'?id:id.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())}</span>`).join('');
 }
}
function learnerGreeting(){
 let name='';
 try{name=String(window.LuxGrowth?.load?.().profile?.displayName||window.ScholarUX?.load?.().displayName||'').trim()}catch{}
 return name?`${greeting()}, ${name}`:greeting();
}
function renderHome(){
 document.getElementById('homeGreeting').textContent=learnerGreeting();
 document.getElementById('homeDate').textContent=new Intl.DateTimeFormat('en-GB',{weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
 growth();renderScholarScene();renderWeek();renderToday();renderReward();renderSubjectTraining();renderQuickPlay();
 window.V04Visual?.home?.();
}
function gardenStageBounds(stage){return ({1:[0,400],2:[400,1000],3:[1000,2200],4:[2200,2200]})[stage]||[0,400]}
function renderGarden(){
 const g=growth(),bounds=gardenStageBounds(g.gardenStage),span=Math.max(1,bounds[1]-bounds[0]),pct=g.gardenStage>=4?100:Math.max(0,Math.min(100,(g.total-bounds[0])/span*100));
 document.getElementById('gardenStageText').textContent=`Stage ${g.gardenStage}`;
 document.getElementById('gardenStageBar').style.width=`${pct}%`;
 document.getElementById('gardenNextLabel').textContent=g.gardenStage>=4?'Flourishing':`${Math.max(0,bounds[1]-g.total)} XP`;
 document.getElementById('gardenImage').src=g.gardenStage>=3?'garden_02.webp':'garden_01.webp';
 const r=nextReward(g);document.getElementById('gardenUnlockName').textContent=r.name;
 const s=g.state,events=[];
 Object.keys(s.collectibles||{}).forEach(id=>events.push({id,title:id.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),kind:'Collectible'}));
 Object.keys(s.medals||{}).forEach(id=>events.push({id,title:id.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase()),kind:'Achievement'}));
 document.getElementById('gardenRewards').innerHTML=(events.slice(-8).reverse().length?events.slice(-8).reverse():[{title:'Your first growth item is waiting',kind:'Keep studying',empty:true}]).map(e=>`<article class="collect-card earned"><div class="collect-art">${e.empty?`<img class="v04-collection-state" src="${window.V04UI?.asset?.('emptyGarden')||'ui_empty_state_garden.webp'}" alt="">`:`<img class="v04-collection-state" src="${window.V04UI?.asset?.('success')||'ui_v04_success_badge.webp'}" alt="">`}</div><h3>${e.title}</h3><p>${e.kind}</p></article>`).join('');
 window.V04Visual?.garden?.();
 window.ScholarGardenGrowth?.render?.();
}
async function render(){
 const info=routeInfo();
 if(info.redirect){history.replaceState(null,'','#home');return await render()}
 showScreen(info.screen);
 if(info.screen==='home')renderHome();
 else if(info.screen==='study'){growth();window.SubjectHub.renderStudy();window.V04Visual?.study?.()}
 else if(info.screen==='subject'&&info.subject){growth();await window.SubjectHub.open(info.subject.subject,info.subject.track,info.subject.tab)}
 else if(info.screen==='garden')renderGarden();
 else if(info.screen==='scholar'){growth();window.ScholarView.openTab(info.tab);window.V04Visual?.scholar?.(info.tab)}
 const ux=window.ScholarUX.load();ux.lastRoute=location.hash||'#home';window.ScholarUX.save(ux);
 window.scrollTo({top:0,behavior:'auto'});
}

function currentDailyTask(id){
 try{return window.DailyPlan.status().tasks.find(t=>t.id===id)||null}catch(err){console.error('[ActionRouter] Daily task lookup failed',err);return null}
}
async function handleActionClick(event){
 const el=event.target.closest('button,[role="button"],a');
 if(!el)return;

 try{
   if(el.matches('[data-global-route]')){
     event.preventDefault();go(el.dataset.globalRoute);return;
   }
   if(el.matches('[data-brand-home]')){
     event.preventDefault();go('home');return;
   }
   if(el.matches('[data-train-subject]')){
     event.preventDefault();await goSubject(el.dataset.trainSubject,el.dataset.trainTrack||'current',(el.dataset.trainTrack==='foundation'?'practice':'learn'));return;
   }
   if(el.matches('[data-open-subject]')){
     event.preventDefault();await goSubject(el.dataset.openSubject,el.dataset.track||'current');return;
   }
   if(el.matches('[data-cont-subject]')){
     event.preventDefault();await goSubject(el.dataset.contSubject,el.dataset.contTrack||'current');return;
   }
   if(el.matches('[data-subject-continue]')){
     event.preventDefault();
     if(el.disabled){toast('This activity is not available yet.');return}
     await window.SubjectHub.continueToday(el.dataset.subjectContinue,el.dataset.subjectTrack||'current');return;
   }
   if(el.matches('[data-subject-tab]')){
     event.preventDefault();
     if(el.disabled||el.getAttribute('aria-disabled')==='true'){toast(el.title||'This section is not available yet.');return}
     await window.SubjectHub.renderTab(el.dataset.subjectTab);return;
   }
   if(el.matches('[data-retry-subject-tab]')){
     event.preventDefault();await window.SubjectHub.renderTab(el.dataset.retrySubjectTab);return;
   }
   if(el.matches('[data-start-main]')){
     event.preventDefault();const t=currentDailyTask(el.dataset.startMain);if(!t){console.error('[ActionRouter] Unknown Main Quest task',el.dataset.startMain);toast('This quest could not be opened.');return}await startTask(t);return;
   }
   if(el.matches('[data-start-secondary]')){
     event.preventDefault();const t=currentDailyTask(el.dataset.startSecondary);if(!t){console.error('[ActionRouter] Unknown Side Task',el.dataset.startSecondary);toast('This task could not be opened.');return}await startTask(t);return;
   }
   if(el.matches('[data-quick-game]')){
     event.preventDefault();await startQuickGame(el.dataset.gameSubject,el.dataset.quickGame);return;
   }
   if(el.matches('[data-all-game]')){
     event.preventDefault();await startQuickGame(el.dataset.gameSubject,el.dataset.allGame);return;
   }
   if(el.matches('[data-gamev2-start]')){
     event.preventDefault();
     if(!window.GameV2?.start)throw new Error('Latin GameV2 engine unavailable');
     window.GameV2.start(el.dataset.gamev2Start);return;
   }
   if(el.matches('[data-gamev2-hub]')){
     event.preventDefault();
     if(!window.GameV2?.openHub)throw new Error('Latin GameV2 hub unavailable');
     window.GameV2.openHub();return;
   }
   if(el.id==='seeAllGames'){
     event.preventDefault();document.getElementById('allGamesDrawer')?.classList.toggle('hidden');return;
   }
   if(el.id==='gardenExplore'){
     event.preventDefault();document.getElementById('gardenExplorePanel')?.classList.toggle('hidden');return;
   }
   if(el.matches('[data-mcp-retry]')){
     event.preventDefault();
     const subject=el.dataset.mcpRetry,kind=el.dataset.mcpRetryKind;
     if(kind==='learn')await window.MasterY8.renderLearn(subject);
     else if(kind==='progress')await window.MasterY8.renderProgress(subject);
     else await window.MasterY8.renderPractice(subject);
     return;
   }
   if(el.matches('[data-bio-retry]')){
     event.preventDefault();
     const kind=el.dataset.bioRetry;
     const ok=await window.BiologyY8.ensureData();
     if(!ok){toast('Biology data still could not be loaded.');return}
     if(kind==='learn')window.BiologyY8.renderLearn();
     else if(kind==='progress')window.BiologyY8.renderProgress();
     else window.BiologyY8.renderFoundationHome();
     return;
   }
 }catch(err){
   console.error('[ActionRouter] Action failed',el,err);
   toast('This activity could not be opened. Please retry.');
 }
}

async function init(){
 window.LuxApp={go,goSubject,toast,render,renderHome};
 window.LatinModule.init();window.FrenchModule.init();
 const frenchLegacyReady=window.FrenchModule.ensureData();
 const biologyReady=window.BiologyY8.ensureData();
 const latinMasterReady=window.MasterY8.ensure('latin');
 const frenchMasterReady=window.MasterY8.ensure('french');
 window.ScholarAssets?.preloadCurrentHome?.();
 renderScholarScene();
 document.addEventListener('click',handleActionClick);
 let routeRenderQueued=false;
 const queueRouteRender=source=>{
   if(routeRenderQueued)return;
   routeRenderQueued=true;
   queueMicrotask(async()=>{
     routeRenderQueued=false;
     try{await render()}catch(err){console.error(`[Router] ${source} render failed`,err);toast('This page could not be opened.')}
   });
 };
 window.addEventListener('hashchange',()=>queueRouteRender('hash'));
 window.addEventListener('popstate',()=>queueRouteRender('history'));
 document.addEventListener('lux:growth',()=>{
  const beforeCount=lastCollectibleCount,beforeIds=new Set(lastCollectibleIds),snap=window.LuxGrowth.snapshot();
  const newReward=Object.keys(snap.state.collectibles||{}).find(id=>!beforeIds.has(id))||null;
  growth();
  if(routeInfo().screen==='home'){
    renderHome();
    if(beforeCount!==null&&snap.collectibleCount>beforeCount){
      const card=document.getElementById('nextRewardCard');
      card.classList.remove('just-unlocked');void card.offsetWidth;card.classList.add('just-unlocked');
      setTimeout(()=>card.classList.remove('just-unlocked'),900);
      if(newReward)flashScholarRewardUnlock(newReward);
    }
  }
  if(routeInfo().screen==='garden')renderGarden();
});
 document.addEventListener('scholar:wardrobe-change',()=>{
   renderScholarScene();
   if(routeInfo().screen==='home')renderHome();
 });
 document.addEventListener('scholar:profile-change',()=>{
   if(routeInfo().screen==='home')renderHome();
   if(routeInfo().screen==='scholar')window.ScholarView?.renderOverview?.();
 });
 document.addEventListener('lux:plan-change',()=>{if(routeInfo().screen==='home')renderHome()});
 await Promise.race([Promise.allSettled([frenchLegacyReady,biologyReady,latinMasterReady,frenchMasterReady]),new Promise(resolve=>setTimeout(resolve,2600))]);
 await render();
 if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js?v=0.4.0-a3',{updateViaCache:'none'}).then(reg=>reg.update()).catch(err=>console.warn('[PWA] service worker update failed',err));
}
document.readyState==='loading'?document.addEventListener('DOMContentLoaded',init):init();
})();