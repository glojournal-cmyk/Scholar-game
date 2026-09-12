const V='scholars-garden-v0-4-0-alpha5-rf1072-20260912';
const CORE=`${V}-core`, RUN=`${V}-runtime`;
const FILES=[
 './french-reference-marker.js',
 './question-bank.json',
 './vocab-bank.json',
 './writing-bank.json',
 './notes-by-section.json',
  "./",
  "./version.json",
  "./assets/ui-nav/search.png",
  "./assets/ui-nav/scholar.png",
  "./assets/ui-nav/garden.png",
  "./assets/ui-nav/study.png",
  "./assets/ui-nav/home.png",
  "./topic-search-index.json",
  "./topic-search.js?v=20260912-rf1072",
  "./deploy-guard.js?v=20260912-rf1072",
  "./index.html",
  "./offline.html",
  "./manifest.webmanifest",
  "./rf10-production.css?v=20260912-rf1072",
  "./rf10-production.js?v=20260912-rf1072",
  "./favicon_192.png",
  "./favicon_512.png",
  "./apple_touch_icon_180.png",
  "./scholar_master_uniform.png",
  "./latin-question-bank.js?v=20260912-rf1072",
  "./growth.js?v=20260912-rf1072",
  "./latin-module.js?v=20260912-rf1072",
  "./french-module.js?v=20260912-rf1072",
  "./latin-games.js?v=20260912-rf1072",
  "./science-notes.js?v=20260912-rf1072",
  "./biology-y8.js?v=20260912-rf1072",
  "./science-y8.js?v=20260912-rf1072",
  "./language-y8.js?v=20260912-rf1072",
  "./daily-plan.js?v=20260912-rf1072",
  "./scholar-assets.js?v=20260912-rf1072",
  "./v04-art-config.js?v=20260912-rf1072",
  "./avatar-layer-system.js?v=20260912-rf1072",
  "./garden-growth.js?v=20260912-rf1072",
  "./v04-ui-assets.js?v=20260912-rf1072",
  "./subject-hub.js?v=20260912-rf1072",
  "./scholar.js?v=20260912-rf1072",
  "./app.js?v=20260912-rf1072",
  "./cp-y8/runtime/index.json",
  "./cp-y8/shared/marking-spec.json",
  "./cp-y8/shared/mastery-review-spec.json",
  "./cp-y8/shared/session-blueprints.json",
  "./assets/rf8/english_literature_hero.webp",
  "./assets/rf8/outfit_default_complete.webp",
  "./assets/rf8/outfit_garden_athletics_complete.webp",
  "./assets/rf8/outfit_midnight_atelier_complete.webp",
  "./assets/rf8/outfit_midnight_track_complete.webp",
  "./assets/rf8/outfit_noir_academy_complete.webp",
  "./assets/rf8/outfit_onyx_prefect_complete.webp",
  "./assets/rf8/outfit_rose_academy_complete.webp",
  "./assets/rf8/outfit_scholar_athletics_complete.webp",
  "./assets/rf8/profile_settings_hero.webp",
  "./assets/rf8/raising_conservatory.webp",
  "./assets/rf8/raising_conservatory_variant.webp",
  "./assets/rf8/raising_garden.webp",
  "./assets/rf8/raising_garden_variant.webp",
  "./assets/rf8/raising_library.webp",
  "./assets/rf8/raising_library_variant.webp",
  "./assets/rf8/raising_observatory.webp",
  "./assets/rf8/raising_observatory_variant.webp",
  "./assets/rf8/raising_study_day.webp",
  "./assets/rf8/raising_study_day_variant.webp",
  "./assets/rf8/raising_study_evening.webp",
  "./assets/rf8/raising_study_evening_variant.webp"
];

self.addEventListener('install',event=>{
  event.waitUntil(
    caches.open(CORE)
      .then(c=>c.addAll(FILES))
      .then(()=>self.skipWaiting())
  );
});

self.addEventListener('activate',event=>{
  event.waitUntil((async()=>{
    const keys=await caches.keys();
    await Promise.all(keys.filter(k=>k.startsWith('scholars-garden-')&&k!==CORE&&k!==RUN).map(k=>caches.delete(k)));
    await self.clients.claim();
  })());
});

self.addEventListener('message',event=>{
  if(event.data?.type==='SKIP_WAITING')self.skipWaiting();
  if(event.data?.type==='PURGE_OLD_CACHES'){
    event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith('scholars-garden-')&&k!==CORE&&k!==RUN).map(k=>caches.delete(k)))));
  }
});

self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return;

  // version.json must always describe the deployed commit, never an old cache.
  if(url.pathname.endsWith('/version.json')){
    event.respondWith(fetch(req,{cache:'no-store'}));
    return;
  }

  // Navigations are deliberately network-only when online.
  // Offline fallback uses the current build cache.
  if(req.mode==='navigate'){
    event.respondWith(
      fetch(req,{cache:'no-store'})
        .then(r=>r)
        .catch(async()=> (await caches.match('./index.html')) || (await caches.match('./offline.html')))
    );
    return;
  }

  // Changing JSON/runtime content is network first.
  if(url.pathname.includes('/cp-y8/runtime/')||url.pathname.endsWith('.json')){
    event.respondWith(
      fetch(req,{cache:'no-store'}).then(r=>{
        if(r.ok){const copy=r.clone();caches.open(RUN).then(c=>c.put(req,copy));}
        return r;
      }).catch(()=>caches.match(req))
    );
    return;
  }

  // Versioned assets can be cached; query-string bumps identify releases.
  event.respondWith(
    caches.match(req).then(cached=>{
      const network=fetch(req).then(r=>{
        if(r.ok){const copy=r.clone();caches.open(RUN).then(c=>c.put(req,copy));}
        return r;
      }).catch(()=>cached);
      return cached||network;
    })
  );
});
