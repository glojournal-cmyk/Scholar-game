
(function(){
'use strict';

/*
 V0.4 Alpha 3 avatar-layer runtime.
 The runtime is deliberately dormant until the corresponding transparent PNGs
 are explicitly marked available. This prevents broken-image requests while
 art production is still in progress.
*/
const KEY='scholarAvatarV04';
const CONTRACT=Object.freeze({
  version:1,
  canvas:{width:1536,height:2048},
  available:false,
  core:Object.freeze({
    backHair:'avatar_hair_back_long_brown.png',
    baseBody:'avatar_base_body.png',
    frontHair:'avatar_hair_front_long_brown.png'
  }),
  expressions:Object.freeze({
    happy:'expression_happy.png',
    focus:'expression_focus.png',
    proud:'expression_proud.png',
    surprised:'expression_surprised.png',
    tired:'expression_tired.png',
    celebrate:'expression_celebrate.png'
  }),
  outfits:Object.freeze({
    'green-cardigan':'outfit_green_cardigan.png',
    'garden-dress':'outfit_garden_dress.png',
    'formal-scholar':'outfit_formal_scholar.png',
    'french-academy':'outfit_french_academy.png'
  }),
  accessories:Object.freeze({
    beret:'accessory_beret_navy.png'
  }),
  handItems:Object.freeze({
    book:'handitem_book.png',
    scroll:'handitem_scroll.png',
    quill:'handitem_quill.png',
    flower:'handitem_flower.png',
    lantern:'handitem_lantern.png',
    magnifier:'handitem_magnifier.png'
  })
});

function fresh(){
  return {
    version:1,
    enabled:false,
    expression:'happy',
    layerOutfit:null,
    accessory:null,
    handItem:null
  };
}
function load(){
  try{
    const x=JSON.parse(localStorage.getItem(KEY)||'null');
    if(x&&typeof x==='object')return {...fresh(),...x};
  }catch{}
  return fresh();
}
function save(s){
  try{localStorage.setItem(KEY,JSON.stringify({...fresh(),...s}))}catch{}
  return s;
}
function runtimeConfig(){
  const override=window.ScholarAvatarLayerConfig;
  if(!override||typeof override!=='object')return CONTRACT;
  return {
    ...CONTRACT,
    ...override,
    core:override.core||CONTRACT.core,
    expressions:override.expressions||CONTRACT.expressions,
    outfits:override.outfits||CONTRACT.outfits,
    accessories:override.accessories||CONTRACT.accessories,
    handItems:override.handItems||CONTRACT.handItems
  };
}
function canCompose(){
  const c=runtimeConfig(),s=load();
  return !!(c.available&&s.enabled&&c.core?.backHair&&c.core?.baseBody&&c.core?.frontHair);
}
function layerElement(canvas,name){
  return canvas?.querySelector?.(`[data-avatar-layer="${name}"]`)||null;
}
function setLayer(el,src,z){
  if(!el)return;
  el.innerHTML='';
  el.style.zIndex=String(z);
  if(!src){el.style.removeProperty('background-image');return}
  const img=document.createElement('img');
  img.src=src;
  img.alt='';
  img.setAttribute('aria-hidden','true');
  img.decoding='async';
  img.draggable=false;
  img.style.zIndex=String(z);
  el.appendChild(img);
}
function resolveState(){
  const c=runtimeConfig(),s=load();
  return {
    backHair:c.core.backHair,
    baseBody:c.core.baseBody,
    outfit:(s.layerOutfit&&c.outfits[s.layerOutfit])||c.outfits[Object.keys(c.outfits||{})[0]]||null,
    frontHair:c.core.frontHair,
    expression:c.expressions[s.expression]||null,
    accessory:s.accessory?c.accessories[s.accessory]:null,
    handItem:s.handItem?c.handItems[s.handItem]:null
  };
}
function compose(canvas=document.getElementById('avatarCanvas')){
  if(!canvas)return false;
  const fallback=canvas.querySelector('#wardrobeScholarImage');
  if(!canCompose()){
    canvas.classList.remove('avatar-compositor-active');
    if(fallback)fallback.hidden=false;
    return false;
  }
  const a=resolveState();
  const order=[
    ['back-hair',a.backHair,10],
    ['base-body',a.baseBody,20],
    ['outfit',a.outfit,30],
    ['front-hair',a.frontHair,40],
    ['expression',a.expression,50],
    ['accessory',a.accessory,60],
    ['hand-item',a.handItem,70]
  ];
  order.forEach(([name,src,z])=>setLayer(layerElement(canvas,name),src,z));
  canvas.classList.add('avatar-compositor-active');
  if(fallback)fallback.hidden=true;
  return true;
}

function homeLayerElement(stage,name){
  return stage?.querySelector?.(`[data-home-avatar-layer="${name}"]`)||null;
}
function composeHome(stage=document.getElementById('scholarArtSlot')){
  if(!stage)return false;
  const fallback=stage.querySelector('#homeScholarImage');
  if(!canCompose()){
    stage.classList.remove('avatar-compositor-active');
    if(fallback)fallback.hidden=false;
    return false;
  }
  const a=resolveState();
  let exp=stage.querySelector('[data-home-avatar-layer="expression"]');
  if(!exp){
    exp=document.createElement('div');
    exp.className='home-avatar-layer';
    exp.dataset.homeAvatarLayer='expression';
    stage.appendChild(exp);
  }
  const order=[
    ['back-hair',a.backHair,10],
    ['base-character',a.baseBody,20],
    ['outfit',a.outfit,30],
    ['front-hair',a.frontHair,40],
    ['expression',a.expression,50],
    ['accessory',a.accessory,60],
    ['hand-item',a.handItem,70]
  ];
  order.forEach(([name,src,z])=>setLayer(homeLayerElement(stage,name),src,z));
  stage.classList.add('avatar-compositor-active');
  if(fallback)fallback.hidden=true;
  return true;
}

function setSelection(part,value){
  const s=load();
  if(part==='expression')s.expression=value||'happy';
  else if(part==='outfit')s.layerOutfit=value||null;
  else if(part==='accessory')s.accessory=value||null;
  else if(part==='handItem')s.handItem=value||null;
  save(s);compose();composeHome();
  document.dispatchEvent(new CustomEvent('scholar:avatar-layer-change',{detail:{part,value}}));
}
function setEnabled(on){
  const s=load();s.enabled=!!on;save(s);compose();composeHome();return s.enabled;
}
function status(){
  const c=runtimeConfig(),s=load();
  return {
    contractVersion:c.version,
    canvas:c.canvas,
    artAvailable:!!c.available,
    enabled:!!s.enabled,
    composing:canCompose(),
    selection:{expression:s.expression,outfit:s.layerOutfit,accessory:s.accessory,handItem:s.handItem}
  };
}
function renderControls(root=document.getElementById('avatarLayerControls')){
  if(!root)return;
  const c=runtimeConfig(),s=load();
  if(!c.available){
    root.hidden=true;
    root.innerHTML='';
    return;
  }
  root.hidden=false;
  const select=(label,key,items,current,none=true)=>{
    const opts=(none?'<option value="">None</option>':'')+Object.keys(items).map(id=>`<option value="${id}" ${id===current?'selected':''}>${id.replace(/-/g,' ')}</option>`).join('');
    return `<label class="avatar-layer-field"><span>${label}</span><select data-avatar-select="${key}">${opts}</select></label>`;
  };
  root.innerHTML=`<div class="avatar-layer-editor">
    <div class="avatar-layer-editor-head"><div><small>OPTIONAL LAYER MODE</small><strong>Custom appearance</strong></div>
    <label class="avatar-layer-toggle"><input type="checkbox" data-avatar-enabled ${s.enabled?'checked':''}> Layered avatar</label></div>
    ${select('Expression','expression',c.expressions,s.expression,false)}
    ${select('Outfit overlay','outfit',c.outfits,s.layerOutfit,true)}
    ${select('Accessory','accessory',c.accessories,s.accessory,true)}
    ${select('Hand item','handItem',c.handItems,s.handItem,true)}
  </div>`;
  root.querySelector('[data-avatar-enabled]')?.addEventListener('change',e=>setEnabled(e.target.checked));
  root.querySelectorAll('[data-avatar-select]').forEach(el=>el.addEventListener('change',()=>setSelection(el.dataset.avatarSelect,el.value||null)));
}
function refresh(){
  compose();
  composeHome();
  renderControls();
}
document.addEventListener('scholar:wardrobe-change',refresh);
document.addEventListener('scholar:avatar-layer-change',()=>compose());
window.addEventListener('DOMContentLoaded',refresh,{once:true});

window.ScholarAvatarLayers=Object.freeze({
  KEY,CONTRACT,load,save,status,compose,composeHome,renderControls,setSelection,setEnabled,refresh
});
})();
