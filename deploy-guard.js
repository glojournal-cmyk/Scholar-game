(function(){
'use strict';
const EXPECTED='RF10.7.3';
const KEY='scholarsGarden.deployReload';
const VERSION='./version.json';

async function purgeOldRuntime(){
  try{
    if('caches' in window){
      const keys=await caches.keys();
      await Promise.all(keys.filter(k=>k.startsWith('scholars-garden-')).map(k=>caches.delete(k)));
    }
  }catch{}
  try{
    if('serviceWorker' in navigator){
      const regs=await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map(r=>r.unregister()));
    }
  }catch{}
}

async function verify(){
  let live;
  try{
    const res=await fetch(`${VERSION}?t=${Date.now()}`,{
      cache:'no-store',
      headers:{'cache-control':'no-cache'}
    });
    if(!res.ok) throw new Error(`version ${res.status}`);
    live=await res.json();
  }catch(err){
    console.warn('[DeployGuard] version check unavailable',err);
    return;
  }

  window.__SCHOLAR_LIVE_VERSION__=live;

  const meta=document.querySelector('meta[name="scholar-garden-build"]')?.content||'';
  const htmlMatches=meta.includes(live.build);
  if(htmlMatches){
    sessionStorage.removeItem(KEY);
    document.documentElement.dataset.liveBuild=live.build;
    return;
  }

  const already=sessionStorage.getItem(KEY);
  if(already===live.build){
    console.error('[DeployGuard] stale HTML persisted after forced reload', {meta, live:live.build});
    return;
  }

  sessionStorage.setItem(KEY,live.build);
  await purgeOldRuntime();

  const url=new URL(location.href);
  url.searchParams.set('build',live.stamp||live.build);
  location.replace(url.toString());
}

if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',verify,{once:true});
else verify();
})();