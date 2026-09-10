
(function(){
'use strict';
const BLUEPRINT=[
 ['ink-pot','Scholar','Ink Pot','40 Scholar XP'],['desk-lamp','Scholar','Desk Lamp','3 study days'],
 ['study-books','Scholar','Study Books','250 Scholar XP'],['ivy-pot','Scholar','Ivy Pot','7 study days'],
 ['bronze-stylus','Latin','Bronze Stylus','120 Latin XP'],['wax-tablet','Latin','Wax Tablet','250 Latin XP'],
 ['fountain-pen','French','Fountain Pen','120 French XP'],['lavender-vase','French','Lavender Vase','250 French XP'],
 ['scholars-globe','Prestige','Scholar’s Globe','300 Latin + 300 French XP'],['golden-lexicon','Prestige','Golden Lexicon','1,500 Scholar XP']
];
const MEDALS=[
 ['first-steps','First Steps','Reach the first Scholar milestone.'],
 ['daily-disciplina','Daily Disciplina','Build a steady study habit.'],
 ['latin-scholar','Latin Scholar','Grow through Latin learning.'],
 ['french-scholar','French Scholar','Grow through French learning.'],
 ['polyglot','Polyglot Scholar','Build strength across both languages.']
];
const TABS=new Set(['overview','wardrobe','collection','achievements','profile']);
function esc(v){return String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]))}
function state(){return window.LuxGrowth.load()}
function save(s){window.LuxGrowth.save(s)}
function uxState(){try{return window.ScholarUX?.load?.()||{}}catch{return {}}}
function saveUx(s){try{return window.ScholarUX?.save?.(s)||s}catch{return s}}
function ensureWardrobe(s){
 s.wardrobe=s.wardrobe||{};
 if(!s.wardrobe.hair)s.wardrobe.hair='starter';
 if(!s.wardrobe.outfit)s.wardrobe.outfit='starter';
 if(!('accessory'in s.wardrobe))s.wardrobe.accessory=null;
 if(!('hand'in s.wardrobe))s.wardrobe.hand=null;
 return s;
}
function normalizeWardrobeState(){
 const s=ensureWardrobe(state());
 if(s.wardrobe.outfit==='starter'){
   s.wardrobe.outfit='school-uniform';
   save(s);
 }
 return s;
}
function displayName(){
 const ux=uxState();
 const profile=state()?.profile||{};
 return String(profile.displayName||ux.displayName||'').trim()||'Scholar';
}
function renderAvatarCanvas(){
 const img=document.getElementById('wardrobeScholarImage'),canvas=document.getElementById('avatarCanvas');
 if(!img||!canvas)return;
 const selected=window.ScholarAssets?.selectedOutfit?.()||window.ScholarAssets?.manifest?.outfits?.[0];
 const headless=new Set(['garden-athletics','scholar-athletics','midnight-track','noir-academy','onyx-prefect','midnight-atelier','rose-academy']);
 const completeFallback=window.ScholarAssets?.homeAsset?.()||'scholar_master_uniform.png';
 const canUseSelected=selected&&!headless.has(selected.id);
 img.src=canUseSelected?selected.asset:completeFallback;
 img.alt=canUseSelected?`Scholar wearing ${selected.name}`:`Complete Scholar portrait · ${selected?.name||'outfit'} shown as a garment plate in the wardrobe`;
 canvas.dataset.selectedOutfit=selected?.id||'';
 canvas.classList.toggle('rf5-headless-fallback',!canUseSelected);
 canvas.classList.add('has-scholar-art','rf5-complete-scholar');
 window.ScholarAvatarLayers?.compose?.(canvas);
}
function renderWardrobe(){
 const s=normalizeWardrobeState(),root=document.getElementById('wardrobeControls');if(!root)return;
 const g=window.LuxGrowth.snapshot(),items=window.ScholarAssets?.manifest?.outfits||[];
 const equipped=window.ScholarAssets?.normalizeOutfitId?.(s.wardrobe.outfit)||'school-uniform';
 const headless=new Set(['garden-athletics','scholar-athletics','midnight-track','noir-academy','onyx-prefect','midnight-atelier','rose-academy']);
 renderAvatarCanvas();
 root.innerHTML=`<div class="wardrobe-gallery">${items.map(item=>{
   const unlocked=window.ScholarAssets.outfitUnlocked(item,g),selected=item.id===equipped,isPlate=headless.has(item.id);
   const requirement=window.ScholarAssets.unlockRequirement(item);
   return `<article class="wardrobe-preview-card ${unlocked?'unlocked':'locked'} ${selected?'selected':''} ${isPlate?'garment-plate':''}">
     <div class="wardrobe-art-wrap">
       <img src="${esc(item.asset)}" alt="${esc(item.name)}" loading="lazy" decoding="async">
       ${unlocked?'':`<span class="wardrobe-lock">Locked</span>`}
       ${selected?'<span class="wardrobe-selected">Equipped</span>':''}
       ${isPlate?'<span class="wardrobe-plate-label">Garment plate</span>':''}
     </div>
     <div class="wardrobe-card-copy">
       <h3>${esc(item.name)}</h3>
       <p>${unlocked?(selected?'Currently equipped.':'Unlocked through study.'):`Unlock: ${esc(requirement)}`}</p>
       <button class="${selected?'secondary':'primary'}" data-equip-outfit="${esc(item.id)}" ${unlocked&&!selected?'':'disabled'}>${selected?'Equipped':unlocked?'Equip':'Locked'}</button>
     </div>
   </article>`;
 }).join('')}</div>`;
 root.querySelectorAll('[data-equip-outfit]').forEach(b=>b.onclick=()=>{
   const item=items.find(x=>x.id===b.dataset.equipOutfit);
   const latest=window.LuxGrowth.snapshot();
   if(!item||!window.ScholarAssets.outfitUnlocked(item,latest))return;
   const fresh=ensureWardrobe(state());
   fresh.wardrobe.outfit=item.id;
   save(fresh);
   renderWardrobe();
   document.dispatchEvent(new CustomEvent('scholar:wardrobe-change',{detail:{outfit:item.id}}));
 });
 window.ScholarAvatarLayers?.renderControls?.();
}
function renderOverview(){
 const g=window.LuxGrowth.snapshot(),s=g.state||{},selected=window.ScholarAssets?.selectedOutfit?.();
 const img=document.getElementById('scholarOverviewImage');
 if(img){
   img.src=window.ScholarAssets?.homeAsset?.()||'scholar_idle.png';
   img.alt=`${displayName()} Scholar appearance`;
 }
 const set=(id,value)=>{const el=document.getElementById(id);if(el)el.textContent=value};
 set('scholarOverviewName',displayName());
 set('scholarOverviewLevel',`Scholar Level ${g.level}`);
 set('scholarOverviewXP',`${g.into} / ${g.next} XP`);
 const bar=document.getElementById('scholarOverviewXPBar');
 if(bar)bar.style.width=`${Math.min(100,Math.round((g.into/Math.max(1,g.next))*100))}%`;
 set('scholarStatDays',g.studyDays);
 set('scholarStatGarden',`Stage ${g.gardenStage}`);
 set('scholarStatLatin',g.subjectTotals?.latin||0);
 set('scholarStatFrench',g.subjectTotals?.french||0);
 set('scholarStatChemistry',g.subjectTotals?.chemistry||0);
 set('scholarStatPhysics',g.subjectTotals?.physics||0);
 const recent=document.getElementById('scholarOverviewRecent');
 if(recent){
   const tags=[];
   if(selected?.name)tags.push(`Equipped: ${selected.name}`);
   Object.keys(s.collectibles||{}).slice(-2).reverse().forEach(id=>tags.push(id.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())));
   Object.keys(s.medals||{}).slice(-1).reverse().forEach(id=>tags.push(id.replace(/-/g,' ').replace(/\b\w/g,c=>c.toUpperCase())));
   recent.innerHTML=(tags.length?tags:['Your Scholar journey is ready.']).map(x=>`<span>${esc(x)}</span>`).join('');
 }
 window.ScholarGardenGrowth?.render?.();
}
function renderCollection(){
 const s=state(),filter=document.querySelector('[data-collection-filter].active')?.dataset.collectionFilter||'All';
 const root=document.getElementById('collectionGrid');if(!root)return;
 root.innerHTML=BLUEPRINT.filter(x=>filter==='All'||x[1]===filter).map(x=>{
  const earned=!!s.collectibles?.[x[0]],art=window.ScholarAssets?.rewardAsset?.(x[0]);
  const stateArt=earned?(window.V04UI?.asset?.('success')||'ui_v04_success_badge.webp'):(window.V04UI?.asset?.('lockCrest')||'ui_v04_lock_crest.webp');
  return `<article class="collect-card ${earned?'earned':''}">
    <div class="collect-art ${art?'has-reward-art':''}">${art?`<img class="reward-interaction-art" src="${esc(art)}" alt="${esc(x[2])} reward interaction" loading="lazy" decoding="async">`:`<img class="v04-collection-state" src="${esc(stateArt)}" alt="" loading="lazy" decoding="async">`}</div>
    <small>${esc(x[1])}</small><h3>${esc(x[2])}</h3>
    <p>${earned?'Earned through study.':`Next step: ${esc(x[3])}`}</p>
  </article>`;
 }).join('');
}
function renderAchievements(){
 const s=state(),root=document.getElementById('medalGrid');if(!root)return;
 root.innerHTML=MEDALS.map(([id,title,copy])=>{
   const earned=!!s.medals?.[id],badge=earned?(window.V04UI?.asset?.('success')||'ui_v04_success_badge.webp'):(window.V04UI?.asset?.('badgeLocked')||'ui_badge_locked.webp');
   return `<article class="medal-card ${earned?'earned':''}"><img class="v04-achievement-badge" src="${esc(badge)}" alt="" loading="lazy" decoding="async"><b>${esc(title)}</b><small>${earned?esc(copy):'Not earned yet'}</small></article>`;
 }).join('');
}
function renderProfile(){
 const ux=uxState(),input=document.getElementById('scholarDisplayName'),summary=document.getElementById('scholarProfileData');
 if(input)input.value=String(ux.displayName||'');
 if(summary){
   const g=window.LuxGrowth.snapshot();
   const avatar=window.ScholarAvatarLayers?.status?.();
   summary.innerHTML=[
     ['Scholar level',g.level],
     ['Study days',g.studyDays],
     ['Garden stage',g.gardenStage],
     ['Collectibles',g.collectibleCount],
     ['Achievements',g.medalCount],
     ['Layer avatar',avatar?.composing?'Active':avatar?.artAvailable?'Available':'Waiting for aligned art']
   ].map(([k,v])=>`<div><span>${esc(k)}</span><b>${esc(v)}</b></div>`).join('');
 }
}
function saveProfileName(value){
 const ux=uxState(),name=String(value||'').trim().slice(0,32);
 if(name)ux.displayName=name;else delete ux.displayName;
 saveUx(ux);
 document.dispatchEvent(new CustomEvent('scholar:profile-change',{detail:{displayName:name}}));
 window.LuxApp?.toast?.(name?'Display name saved.':'Display name cleared.');
 renderProfile();renderOverview();
}
function bindProfile(){
 const saveBtn=document.getElementById('saveScholarProfile'),clearBtn=document.getElementById('clearScholarProfile'),input=document.getElementById('scholarDisplayName');
 if(saveBtn)saveBtn.onclick=()=>saveProfileName(input?.value||'');
 if(clearBtn)clearBtn.onclick=()=>{if(input)input.value='';saveProfileName('')};
 if(input)input.onkeydown=e=>{if(e.key==='Enter'){e.preventDefault();saveProfileName(input.value)}};
}
function openTab(tab='overview'){
 tab=TABS.has(tab)?tab:'overview';
 document.querySelectorAll('[data-scholar-tab]').forEach(b=>b.classList.toggle('active',b.dataset.scholarTab===tab));
 document.querySelectorAll('[data-scholar-pane]').forEach(p=>p.classList.toggle('hidden',p.dataset.scholarPane!==tab));
 if(tab==='overview')renderOverview();
 if(tab==='wardrobe')renderWardrobe();
 if(tab==='collection')renderCollection();
 if(tab==='achievements')renderAchievements();
 if(tab==='profile')renderProfile();
 document.dispatchEvent(new CustomEvent('scholar:tab-open',{detail:{tab}}));
 history.replaceState(null,'',`#scholar/${tab}`);
}
function bind(){
 document.querySelectorAll('[data-scholar-tab]').forEach(b=>b.onclick=()=>openTab(b.dataset.scholarTab));
 document.querySelectorAll('[data-collection-filter]').forEach(b=>b.onclick=()=>{
  document.querySelectorAll('[data-collection-filter]').forEach(x=>x.classList.toggle('active',x===b));renderCollection();
 });
 bindProfile();
}
document.addEventListener('lux:growth',()=>{const tab=document.querySelector('[data-scholar-tab].active')?.dataset.scholarTab;if(tab==='overview')renderOverview();if(tab==='profile')renderProfile()});
document.addEventListener('scholar:wardrobe-change',()=>{renderOverview();renderAvatarCanvas()});
window.ScholarView=Object.freeze({
 TABS,openTab,renderOverview,renderWardrobe,renderAvatarCanvas,renderCollection,renderAchievements,renderProfile,saveProfileName,BLUEPRINT
});
window.addEventListener('DOMContentLoaded',bind,{once:true});
})();
