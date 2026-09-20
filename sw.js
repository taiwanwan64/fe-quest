const APP_VERSION = 'v377';
const CACHE_NAME = 'fe-quest-v377-75';
const CACHE_PREFIX = 'fe-quest-';
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./assets/app-v377.css",
  "./assets/first-impression-ux-v377.css",
  "./assets/ch3-depth-v383.css",
  "./assets/ch4-depth-v384.css",
  "./assets/ch5-depth-v386.css",
  "./assets/ch6-depth-v387.css",
  "./assets/ch7-depth-v388.css",
  "./assets/ch8-depth-v389.css",
  "./assets/ch9-depth-v390.css",
  "./assets/ch10-depth-v391.css",
  "./assets/ch11-depth-v392.css",
  "./assets/ch12-depth-v393.css",
  "./assets/ch13-depth-v394.css",
  "./assets/protected-content-provider-v376.js",
  "./assets/protected-content-provider-v376-v7.js",
  "./assets/protected-content-provider-v376-v8.js",
  "./assets/protected-content-provider-v376-v9.js",
  "./assets/protected-content-provider-v376-v10.js",
  "./assets/protected-content-provider-v376-v11.js",
  "./assets/protected-content-provider-v376-v12.js",
  "./assets/protected-content-provider-v376-v13.js",
  "./assets/protected-content-provider-v376-v14.js",
  "./assets/protected-content-provider-v376-v15.js",
  "./assets/protected-content-provider-v376-v16.js",
  "./assets/protected-content-provider-v376-v17.js",
  "./assets/protected-content-provider-v376-v18.js",
  "./assets/protected-content-provider-v376-v19.js",
  "./assets/protected-content-provider-v376-v20.js",
  "./assets/protected-content-provider-v376-v21.js",
  "./assets/protected-content-provider-v376-v22.js",
  "./assets/protected-content-provider-v376-v23.js",
  "./assets/protected-content-provider-v376-v24.js",
  "./assets/protected-content-provider-v376-v25.js",
  "./assets/protected-content-provider-v376-v26.js",
  "./assets/protected-content-provider-v376-v27.js",
  "./assets/protected-content-provider-v376-v28.js",
  "./assets/protected-content-provider-v376-v29.js",
  "./assets/protected-content-provider-v376-v30.js",
  "./assets/protected-content-provider-v376-v31.js",
  "./assets/protected-content-provider-v376-v32.js",
  "./assets/protected-content-provider-v376-v33.js",
  "./assets/protected-content-provider-v376-v34.js",
  "./assets/protected-content-provider-v376-v35.js",
  "./assets/protected-lesson-provider-v376.js",
  "./assets/app-v377.js",
  "./assets/protected-flow-bridge-v376.js",
  "./assets/protected-b-trace-bridge-v376.js",
  "./assets/protected-b-security-bridge-v376.js",
  "./assets/protected-b-exam-bridge-v376.js",
  "./assets/protected-b-final-bridge-v376.js",
  "./assets/first-impression-ux-v377.js",
  "./assets/ipa92-sort-lab-v377.js",
  "./assets/ipa92-graph-lab-v377.js",
  "./assets/ipa92-modeling-lab-v377.js",
  "./assets/ipa92-memory-lab-v377.js",
  "./assets/question-catalog-v376.json",
  "./assets/question-catalog-ipa92-v1.json",
  "./assets/question-catalog-ipa92-v1-v6.json",
  "./assets/question-catalog-ipa92-v7.json",
  "./assets/question-catalog-ipa92-v8.json",
  "./assets/question-catalog-ipa92-v9.json",
  "./assets/question-catalog-ipa92-v10.json",
  "./assets/question-catalog-ipa92-v11.json",
  "./assets/question-catalog-ipa92-v12.json",
  "./assets/question-catalog-ipa92-v13.json",
  "./assets/question-catalog-ipa92-v14.json",
  "./assets/question-catalog-ipa92-v15.json",
  "./assets/question-catalog-ipa92-v16.json",
  "./assets/question-catalog-ipa92-v17.json",
  "./assets/question-catalog-ipa92-v18.json",
  "./assets/question-catalog-ipa92-v19.json",
  "./assets/question-catalog-ipa92-v20.json",
  "./assets/question-catalog-ipa92-v21.json",
  "./assets/question-catalog-ipa92-v22.json",
  "./assets/question-catalog-ipa92-v23.json",
  "./assets/question-catalog-ipa92-v24.json",
  "./assets/question-catalog-ipa92-v25.json",
  "./assets/question-catalog-ipa92-v26.json",
  "./assets/question-catalog-ipa92-v27.json",
  "./assets/question-catalog-ipa92-v28.json",
  "./assets/question-catalog-ipa92-v29.json",
  "./assets/question-catalog-ipa92-v30.json",
  "./assets/question-catalog-ipa92-v31.json",
  "./assets/question-catalog-ipa92-v32.json",
  "./assets/question-catalog-ipa92-v33.json",
  "./assets/question-catalog-ipa92-v34.json",
  "./assets/question-catalog-ipa92-v35.json",
  "./icon-192.png",
  "./icon-512.png",
  "./apple-touch-icon.png",
  "./cloud/activation-loader-v342.js",
  "./cloud/public-config-v342.js",
  "./cloud/sync-ui-v342.css",
  "./vendor/supabase/supabase-2.112.3.js",
  "./cloud/sync-contract-v342.js",
  "./cloud/sync-state-v342.js",
  "./cloud/sync-engine-v342.js",
  "./cloud/supabase/transport-v342.js",
  "./cloud/supabase/auth-boundary-v342.js",
  "./cloud/production-adapter-v342.js",
  "./cloud/reconciliation-v342.js",
  "./cloud/local-reconciliation-adapter-v342.js",
  "./cloud/sync-controller-v342.js",
  "./cloud/sync-ui-v342.js",
  "./cloud/runtime-bootstrap-v342.js"
];

self.addEventListener('install', event => {
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