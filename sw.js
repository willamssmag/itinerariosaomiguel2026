const CACHE_NAME='sao-miguel-v2-shell';
const APP_SHELL=['./','./index.html','./styles.css','./app.js','./days.js','./config.js','./manifest.webmanifest','./assets/cover.jpg','./assets/icon-192.png','./assets/icon-512.png'];
self.addEventListener('install',event=>{
  event.waitUntil(caches.open(CACHE_NAME).then(cache=>cache.addAll(APP_SHELL)).then(()=>self.skipWaiting()));
});
self.addEventListener('activate',event=>{
  event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE_NAME).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('fetch',event=>{
  const req=event.request;
  if(req.method!=='GET') return;
  event.respondWith(caches.match(req).then(found=>found||fetch(req).then(response=>{
    const copy=response.clone();
    if(req.url.includes('/pages/') || APP_SHELL.some(p=>req.url.endsWith(p.replace('./','/')))){
      caches.open(CACHE_NAME).then(cache=>cache.put(req,copy));
    }
    return response;
  }).catch(()=>found)));
});
