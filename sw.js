const CACHE_NAME='sao-miguel-v4-premium';
const APP_SHELL=[
  './','./index.html','./styles.css','./app.js','./days.js','./transcription.js','./config.js','./manifest.webmanifest',
  './assets/cover.jpg','./assets/cover-bg.jpg','./assets/cover-premium-4k.jpg','./assets/icon-192.png','./assets/icon-512.png'
];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  if(event.request.method!=='GET') return;
  event.respondWith(caches.match(event.request).then(found=> found || fetch(event.request)));
});
