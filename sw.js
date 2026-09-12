const V='scholars-garden-v0-4-0-alpha5-rf105-20260912';
const CORE=`${V}-core`, RUN=`${V}-runtime`;
const FILES=[
 './french-reference-marker.js',
 './question-bank.json',
 './vocab-bank.json',
 './writing-bank.json',
 './notes-by-section.json',
  "./",
  "./index.html",
  "./offline.html",
  "./manifest.webmanifest",
  "./rf10-production.css?v=20260912-rf105",
  "./rf10-production.js?v=20260912-rf105",
  "./favicon_192.png",
  "./favicon_512.png",
  "./apple_touch_icon_180.png",
  "./scholar_master_uniform.png",
  "./latin-question-bank.js?v=20260912-rf105",
  "./growth.js?v=20260912-rf105",
  "./latin-module.js?v=20260912-rf105",
  "./french-module.js?v=20260912-rf105",
  "./latin-games.js?v=20260912-rf105",
  "./science-notes.js?v=20260912-rf105",
  "./biology-y8.js?v=20260912-rf105",
  "./science-y8.js?v=20260912-rf105",
  "./language-y8.js?v=20260912-rf105",
  "./daily-plan.js?v=20260912-rf105",
  "./scholar-assets.js?v=20260912-rf105",
  "./v04-art-config.js?v=20260912-rf105",
  "./avatar-layer-system.js?v=20260912-rf105",
  "./garden-growth.js?v=20260912-rf105",
  "./v04-ui-assets.js?v=20260912-rf105",
  "./subject-hub.js?v=20260912-rf105",
  "./scholar.js?v=20260912-rf105",
  "./app.js?v=20260912-rf105",
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
  event.waitUntil(caches.open(CORE).then(c=>c.addAll(FILES)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CORE&&k!==RUN).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  const url=new URL(req.url);
  if(url.origin!==location.origin) return;

  // HTML/navigation: network first so deploys update promptly.
  if(req.mode==='navigate'){
    event.respondWith(fetch(req).then(r=>{
      const copy=r.clone(); caches.open(RUN).then(c=>c.put(req,copy)); return r;
    }).catch(()=>caches.match(req).then(r=>r||caches.match('./index.html')).then(r=>r||caches.match('./offline.html'))));
    return;
  }

  // Runtime topic shards and changing JSON: network first, runtime cached.
  if(url.pathname.includes('/cp-y8/runtime/') || url.pathname.endsWith('.json')){
    event.respondWith(fetch(req).then(r=>{
      const copy=r.clone(); caches.open(RUN).then(c=>c.put(req,copy)); return r;
    }).catch(()=>caches.match(req)));
    return;
  }

  // Static production assets: cache first with background refresh.
  event.respondWith(caches.match(req).then(cached=>{
    const fresh=fetch(req).then(r=>{const copy=r.clone();caches.open(RUN).then(c=>c.put(req,copy));return r;}).catch(()=>cached);
    return cached||fresh;
  }));
});
