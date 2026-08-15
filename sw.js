const APP_VERSION = 'v151';
const CACHE_NAME = 'fe-quest-v151-1';
const CACHE_PREFIX = 'fe-quest-';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.webmanifest',
  './icon-192.png',
  './icon-512.png',
  './apple-touch-icon.png'
];

self.addEventListener('install', event => {
  // v117 emergency hotfix: v116 can enter a false save-block loop during startup.
  // Activate this release immediately so the learner only needs one normal reload.
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(APP_SHELL.map(url => new Request(url,{cache:'reload'})))
    )
  );
});

self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k.startsWith(CACHE_PREFIX) && k !== CACHE_NAME).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', event => {
  if(event.data?.type === 'SKIP_WAITING') self.skipWaiting();
  if(event.data?.type === 'GET_VERSION') event.source?.postMessage?.({type:'APP_VERSION',version:APP_VERSION});
});

function networkWithTimeout(request, timeoutMs=4000){
  return Promise.race([
    fetch(request),
    new Promise((_,reject)=>setTimeout(()=>reject(new Error('network timeout')),timeoutMs))
  ]);
}

async function navigationResponse(request){
  try{
    const response = await networkWithTimeout(request,4000);
    if(response && response.ok){
      const cache = await caches.open(CACHE_NAME);
      cache.put('./index.html',response.clone()).catch(()=>{});
    }
    return response;
  }catch(e){
    return (await caches.match('./index.html')) || (await caches.match('./')) || Response.error();
  }
}

async function staleWhileRevalidate(request){
  const cached = await caches.match(request);
  const network = fetch(request).then(response => {
    if(response && response.ok && response.type !== 'opaque'){
      caches.open(CACHE_NAME).then(cache=>cache.put(request,response.clone())).catch(()=>{});
    }
    return response;
  }).catch(()=>null);
  return cached || (await network) || Response.error();
}

self.addEventListener('fetch', event => {
  const request=event.request;
  if(request.method !== 'GET' || request.headers.has('range')) return;
  const url=new URL(request.url);
  if(url.origin !== self.location.origin) return;

  if(request.mode === 'navigate'){
    event.respondWith(navigationResponse(request));
    return;
  }
  event.respondWith(staleWhileRevalidate(request));
});
