
const screens = [...document.querySelectorAll('.screen')];
const navBtns = [...document.querySelectorAll('.nav-btn[data-screen]')];
const UI_STATE_KEY='fequest_ui_state_v2';
const SAFE_RESUME_SCREENS=new Set(['home','map','problems','plan']);
let restoringUiState=false;

function initializeAccessibility(){
  screens.forEach(screen=>screen.setAttribute('aria-hidden',screen.classList.contains('active')?'false':'true'));
  navBtns.forEach(btn=>{
    if(btn.classList.contains('active'))btn.setAttribute('aria-current','page');
    btn.querySelector('.ico')?.setAttribute('aria-hidden','true');
  });
  document.querySelectorAll('button.back').forEach(btn=>{
    if(!btn.hasAttribute('aria-label'))btn.setAttribute('aria-label',btn.textContent.trim()==='Ã—'?'çµ‚äº†ã—ã¦æˆ»ã‚‹':'å‰ã®ç”»é¢ã«æˆ»ã‚‹');
  });
}
initializeAccessibility();

function readUiState(){
  try{return JSON.parse(localStorage.getItem(UI_STATE_KEY)||'{}')}catch(e){return {}}
}
function writeUiState(patch={}){
  try{
    const next={...readUiState(),...patch,updatedAt:Date.now(),appVersion:APP_VERSION};
    localStorage.setItem(UI_STATE_KEY,JSON.stringify(next));
    return next;
  }catch(e){return null}
}
function activeScreenId(){return document.querySelector('.screen.active')?.id||'home'}
function rememberScreen(id){
  if(restoringUiState)return;
  if(id==='lesson')writeUiState({screen:'lesson'});
  else if(SAFE_RESUME_SCREENS.has(id))writeUiState({screen:id});
  else if(id==='trace')writeUiState({screen:'map'});
}
function appHistoryReplace(id,depth=0){
  try{window.history?.replaceState?.({feqScreen:id,feqDepth:depth},'',location.href)}catch(e){}
}
function appHistoryPush(id){
  try{
    const current=window.history?.state;
    if(current?.feqScreen===id)return;
    const depth=(current?.feqDepth||0)+1;
    window.history?.pushState?.({feqScreen:id,feqDepth:depth},'',location.href);
  }catch(e){}
}
function primaryNavScreen(id){
  if(id==='weak'||id==='mock')return 'problems';
  if(id==='coverage'||id==='history')return 'plan';
  if(id==='lesson'||id==='trace')return 'map';
  return id;
}
function showScreen(id,opts={}){
  const exists=screens.some(s=>s.id===id);
  if(!exists)id='home';
  const prev=activeScreenId();
  screens.forEach(s => {
    const active=s.id===id;
    s.classList.toggle('active',active);
    s.setAttribute('aria-hidden',active?'false':'true');
  });
  const navRoot=primaryNavScreen(id);
  navBtns.forEach(b => {
    const active=b.dataset.screen===navRoot;
    b.classList.toggle('active',active);
    if(active)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');
  });
  if(id==='history' && typeof renderLearningAnalytics==='function') renderLearningAnalytics();
  if(id==='map' && typeof renderLearningEntry==='function') renderLearningEntry();
  rememberScreen(id);
  if(!opts.fromHistory && !opts.noHistory && prev!==id)appHistoryPush(id);
  if(opts.replaceHistory)appHistoryReplace(id,opts.depth||0);
  if(!opts.keepScroll)window.scrollTo({top:0, behavior:opts.instant?'auto':'smooth'});
}
function appBack(fallback='home'){
  const st=window.history?.state;
  if(st?.feqDepth>0 && typeof window.history?.back==='function'){
    window.history.back();
  }else{
    showScreen(fallback,{replaceHistory:true,instant:true});
  }
}
window.addEventListener('popstate',e=>{
  const target=e.state?.feqScreen;
  if(target)showScreen(target,{fromHistory:true,instant:true});
});

document.querySelectorAll('[data-screen]').forEach(btn=>{
  btn.addEventListener('click',()=>{
    if(btn.classList.contains('back'))appBack(btn.dataset.screen||'home');
    else showScreen(btn.dataset.screen);
  });
});


const toast = document.getElementById('toast');
function popToast(msg){
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(()=>toast.classList.remove('show'),1600);
}

document.getElementById('settingsBtn').addEventListener('click',()=>{
  showScreen('plan');
  if(typeof renderPlannerScreen==='function') renderPlannerScreen();
  if(typeof setPlanDetailsOpen==='function') setPlanDetailsOpen(true);
  setTimeout(()=>{
    document.getElementById('learningSettingsCard')?.scrollIntoView?.({behavior:'smooth',block:'center'});
  },80);
});

const aiDrawer = document.getElementById('aiDrawer');
const aiFab = document.getElementById('aiFab');
const aiBackdrop = document.getElementById('aiBackdrop');
let aiReturnFocus=null;
function openAi(){
  aiReturnFocus=document.activeElement instanceof HTMLElement?document.activeElement:null;
  aiDrawer.removeAttribute('inert');
  aiDrawer.setAttribute('aria-hidden','false');
  aiDrawer.classList.add('open');
  aiFab?.setAttribute('aria-expanded','true');
  aiBackdrop?.setAttribute('aria-hidden','false');
  document.body.classList.add('ai-open');
  requestAnimationFrame(()=>document.getElementById('chatInput')?.focus({preventScroll:true}));
}
function closeAi(){
  aiDrawer.classList.remove('open');
  aiDrawer.setAttribute('aria-hidden','true');
  aiDrawer.setAttribute('inert','');
  aiFab?.setAttribute('aria-expanded','false');
  aiBackdrop?.setAttribute('aria-hidden','true');
  document.body.classList.remove('ai-open');
  const target=aiReturnFocus;aiReturnFocus=null;
  requestAnimationFrame(()=>target?.focus?.({preventScroll:true}));
}
aiFab.addEventListener('click',openAi);
document.getElementById('openAiSide').addEventListener('click',openAi);
document.getElementById('closeAi').addEventListener('click',closeAi);
aiBackdrop?.addEventListener('click',closeAi);
document.addEventListener('keydown',e=>{if(e.key==='Escape'&&aiDrawer.classList.contains('open')){e.preventDefault();closeAi();}});

const chat = document.getElementById('chat');
const input = document.getElementById('chatInput');
function addBubble(text, type){
  const d = document.createElement('div');
  d.className = 'bubble ' + (type === 'user' ? 'user-bub':'bot-bub');
  d.textContent = text;
  chat.appendChild(d);
  chat.scrollTop = chat.scrollHeight;
}
function mockAnswer(q){
  const lower = q.toLowerCase();
  if(q.includes('äºŒåˆ†æŽ¢ç´¢') || q.includes('ç­”ãˆ') || q.includes('ãªãœ')){
    return 'äºŒåˆ†æŽ¢ç´¢ã§ã¯ã€ä¸­å¤®ã®å€¤ã¨ç›®çš„ã®å€¤ã‚’æ¯”ã¹ã¦ã€ŒåŠåˆ†ã‚’æ¨ã¦ã‚‹ã€ã®ãŒãƒã‚¤ãƒ³ãƒˆã§ã™ã€‚37ã¯23ã‚ˆã‚Šå¤§ãã„ã®ã§ã€23ä»¥ä¸‹ã®å·¦å´ã¯èª¿ã¹ãªãã¦ã‚ˆããªã‚Šã¾ã™ã€‚';
  }
  if(q.includes('å›³')){
    return 'ã‚¤ãƒ¡ãƒ¼ã‚¸ã¯ã€Œè¾žæ›¸ã‚’çœŸã‚“ä¸­ã‹ã‚‰é–‹ãã€æ–¹æ³•ã§ã™ã€‚ç›®çš„ã®è¨€è‘‰ãŒå¾Œã‚ãªã‚‰å‰åŠã‚’å…¨éƒ¨æ¨ã¦ã€æ®‹ã£ãŸç¯„å›²ã§ã‚‚ã¾ãŸçœŸã‚“ä¸­ã‚’è¦‹ã‚‹ã€ã‚’ç¹°ã‚Šè¿”ã—ã¾ã™ã€‚';
  }
  if(q.includes('ç°¡å˜')){
    return 'ã€ŒçœŸã‚“ä¸­ã‚’è¦‹ã‚‹ â†’ å¤§ãã„ã‹å°ã•ã„ã‹åˆ¤æ–­ â†’ ã„ã‚‰ãªã„åŠåˆ†ã‚’æ¨ã¦ã‚‹ã€ã€‚ã¾ãšã¯ã“ã®3æ‰‹ã ã‘è¦šãˆã‚Œã°å¤§ä¸ˆå¤«ã§ã™ã€‚';
  }
  if(q.includes('ä¼¼ãŸ')){
    return 'ç·´ç¿’ï¼šé…åˆ— [2, 5, 9, 14, 21, 30, 44] ã‹ã‚‰30ã‚’äºŒåˆ†æŽ¢ç´¢ã™ã‚‹ã¨ãã€æœ€åˆã«ä¸­å¤®ã®14ã‚’è¦‹ãŸå¾Œã€æ¬¡ã«æ®‹ã™ã®ã¯å·¦å´ãƒ»å³å´ã®ã©ã¡ã‚‰ã§ã—ã‚‡ã†ï¼Ÿ';
  }
  return 'ç¾åœ¨ã®BITå…ˆç”Ÿã¯ãƒ­ãƒ¼ã‚«ãƒ«ãƒ‡ãƒ¢ã§ã™ã€‚å¤–éƒ¨AI APIã«ã¯æŽ¥ç¶šã—ã¦ã„ã¾ã›ã‚“ã€‚å°†æ¥APIé€£æºã™ã‚‹ã¨ãã¯ã€ç¾åœ¨ã®å•é¡Œã‚„å­¦ç¿’çŠ¶æ³ã«åˆã‚ã›ãŸèª¬æ˜Žã¸æ‹¡å¼µã§ãã¾ã™ã€‚';
}
function send(){
  const q = input.value.trim();
  if(!q) return;
  addBubble(q,'user'); input.value='';
  setTimeout(()=>addBubble(mockAnswer(q),'bot'),350);
}
document.getElementById('sendChat').addEventListener('click',send);
input.addEventListener('keydown',e=>{ if(e.key==='Enter') send(); });
document.querySelectorAll('.quick button').forEach(b=>{
  b.addEventListener('click',()=>{
    addBubble(b.dataset.q,'user');
    setTimeout(()=>addBubble(mockAnswer(b.dataset.q),'bot'),300);
  });
});


// ===== v100: User-visible recovery center + storage self-test =====
const STORAGE_KEY = 'fequest_profile_v4'; // compatibility mirror: schema v5 is written here so v97 refuses to downgrade it
const PROFILE_ATOMIC_KEY = 'fequest_profile_atomic_v1';
const PROFILE_MIGRATION_JOURNAL_KEY = 'fequest_profile_migration_journal_v1';
const PROFILE_WRITER_LEASE_KEY = 'fequest_profile_writer_lease_v1';
const PROFILE_VERSION_CHECKPOINT_KEY = 'fequest_profile_version_checkpoint_v1';
const PROFILE_LAST_EXPORT_KEY = 'fequest_profile_last_export_v1';
const CORRUPT_PROFILE_KEY = 'fequest_profile_corrupt_recovery';
const LAST_GOOD_PROFILE_KEY = 'fequest_profile_last_good_v1';
const PRE_IMPORT_PROFILE_KEY = 'fequest_profile_pre_import_v1';
const PRE_MANUAL_RESTORE_PROFILE_KEY = 'fequest_profile_pre_manual_restore_v1';
const PROFILE_CHECKSUM_KEY = 'fequest_profile_checksum_v1';
const LAST_GOOD_CHECKSUM_KEY = 'fequest_profile_last_good_checksum_v1';
const LEGACY_STORAGE_KEYS = ['fequest_profile_v3','fequest_profile_v2','fequest_profile_v1'];
const RECOVERY_DB_NAME = 'fequest_recovery_v1';
const RECOVERY_DB_STORE = 'profileSnapshots';
const RECOVERY_DB_VERSION = 1;
const RECOVERY_MAX_SNAPSHOTS = 4;
const RECOVERY_CHECKPOINT_INTERVAL = 30*60*1000;
const WRITER_LEASE_MS = 12000;
const PROFILE_SCHEMA_VERSION = 5;
const APP_VERSION = 'v365';
const TAB_INSTANCE_ID = (()=>{try{return crypto.randomUUID()}catch(_e){return `tab-${Date.now()}-${Math.random().toString(36).slice(2)}`}})();
let profileRecoveryWarning = false;
let profileRecoverySource = '';
let profileRecoveryReason = '';
let profileRecoveryNeedsIndexedDb = false;
let profileWriteBlocked = false;
let profileWriteBlockNoticeShown = false;
let profileConflictBlocked = false;
let profileConflictNoticeShown = false;
let profileBaseRevision = 0;
let profileCommittedChecksum = '';
let storagePressureNoticeShown = false;
let recoveryCheckpointLastAt = 0;
let profileCommittedSnapshot = null;
let lastProfileSaveFailure = '';
let lastProfileSaveFailureAt = 0;
// v117: the script is intentionally one file, so several modules backfill profile fields
// before later modules have declared their datasets.  Never persist+render during that phase.
let appBootComplete = false;
let bootProfileSavePending = false;

const DEFAULT_PROFILE = {
  profileSchemaVersion: PROFILE_SCHEMA_VERSION,
  profileMeta: {
    createdAt: null,
    updatedAt: null,
    lastAppVersion: null,
    migratedFromSchema: null,
    revision: 0,
    lastWriterId: null
  },
  masteryHistory: {},
  xp: 0,
  streak: 0,
  diagnosticCompleted: false,
  diagnosticScores: {},
  skills: {
    'åŸºç¤Žç†è«–': 50,
    'ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿': 50,
    'ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹': 50,
    'ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯': 50,
    'ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£': 50,
    'ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ': 50,
    'ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ': 50,
    'ã‚¹ãƒˆãƒ©ãƒ†ã‚¸': 50
  },
  lastStudyDate: null
};

function isPlainObject(v){
  return !!v&&typeof v==='object'&&!Array.isArray(v);
}
function finiteNumber(v,fallback=0){
  const n=Number(v);return Number.isFinite(n)?n:fallback;
}
function nonNegativeInt(v,fallback=0){
  return Math.max(0,Math.round(finiteNumber(v,fallback)));
}
function boundedPercent(v,fallback=0){
  return Math.max(0,Math.min(100,Math.round(finiteNumber(v,fallback))));
}
function safeObject(v){return isPlainObject(v)?v:{}}
function safeArray(v,max=2000){return Array.isArray(v)?v.slice(0,max):[]}
function normalizeProgressMap(v){
  const out={};
  Object.entries(safeObject(v)).forEach(([k,val])=>{
    if(typeof k==='string'&&k)out[k]=boundedPercent(val,0);
  });
  return out;
}
function profileSchemaNumber(v){
  const n=nonNegativeInt(v?.profileSchemaVersion,1);
  return n>=1?n:1;
}
function futureSchemaError(schema){
  const e=new Error(`ã“ã®å­¦ç¿’ãƒ‡ãƒ¼ã‚¿ã¯æ–°ã—ã„å½¢å¼ v${schema} ã§ã™ã€‚å¯¾å¿œã™ã‚‹FE QUESTã¸æ›´æ–°ã—ã¦ãã ã•ã„`);
  e.code='FUTURE_PROFILE_SCHEMA';
  e.schema=schema;
  return e;
}
function migrateProfileData(input){
  const src=isPlainObject(input)?structuredClone(input):{};
  const fromSchema=profileSchemaNumber(src);
  if(fromSchema>PROFILE_SCHEMA_VERSION)throw futureSchemaError(fromSchema);

  // Migration is intentionally additive. Unknown fields are preserved so a version update
  // never throws away learning evidence simply because the current UI does not use it.
  if(fromSchema<2){
    src.settings=safeObject(src.settings);
    src.dailyPlans=safeObject(src.dailyPlans);
  }
  if(fromSchema<3){
    src.chapterMastery=safeObject(src.chapterMastery);
    src.reviewJourney=safeObject(src.reviewJourney);
    src.reviewJourneys=safeObject(src.reviewJourneys);
  }
  if(fromSchema<4){
    src.profileMeta=safeObject(src.profileMeta);
    src.masteryHistory=safeObject(src.masteryHistory);
  }
  if(fromSchema<5){
    src.profileMeta={...safeObject(src.profileMeta),revision:nonNegativeInt(src.profileMeta?.revision,0),lastWriterId:null};
  }
  src.profileSchemaVersion=PROFILE_SCHEMA_VERSION;
  src.profileMeta={
    ...safeObject(src.profileMeta),
    migratedFromSchema:fromSchema<PROFILE_SCHEMA_VERSION?fromSchema:(src.profileMeta?.migratedFromSchema??null)
  };
  return {profile:src,fromSchema,migrated:fromSchema<PROFILE_SCHEMA_VERSION};
}
function normalizeProfileData(input){
  const migration=migrateProfileData(input);
  const p=migration.profile;
  const out={...structuredClone(DEFAULT_PROFILE),...p};
  out.profileSchemaVersion=PROFILE_SCHEMA_VERSION;
  out.profileMeta={...structuredClone(DEFAULT_PROFILE.profileMeta),...safeObject(p.profileMeta)};
  out.profileMeta.revision=nonNegativeInt(out.profileMeta.revision,0);
  out.profileMeta.lastWriterId=typeof out.profileMeta.lastWriterId==='string'?out.profileMeta.lastWriterId:null;
  out.masteryHistory=safeObject(p.masteryHistory);
  out.xp=nonNegativeInt(p.xp,0);
  out.streak=nonNegativeInt(p.streak,0);
  out.diagnosticCompleted=!!p.diagnosticCompleted;
  out.diagnosticScores=safeObject(p.diagnosticScores);
  out.skills={};
  Object.entries(DEFAULT_PROFILE.skills).forEach(([name,def])=>{
    out.skills[name]=boundedPercent(p.skills?.[name],def);
  });
  out.lastStudyDate=typeof p.lastStudyDate==='string'?p.lastStudyDate:null;

  out.lessonProgress=normalizeProgressMap(p.lessonProgress);
  out.bProgress=normalizeProgressMap(p.bProgress);
  out.securityBProgress=normalizeProgressMap(p.securityBProgress);

  ['qStats','techniqueStats','mockQuestionStats','mockMistakeStats','bMockStats','bCompoundStats',
   'securityMockStats','bFinalStats','bFinalMistakeStats','settings','dailyPlans','reviewJourney','reviewJourneys','chapterMastery'
  ].forEach(key=>out[key]=safeObject(p[key]));

  out.sessions=safeArray(p.sessions,3000);
  out.activity=safeObject(p.activity);
  out.mockHistory=safeArray(p.mockHistory,100);
  out.bMockHistory=safeArray(p.bMockHistory,100);
  out.bCompoundHistory=safeArray(p.bCompoundHistory,100);
  out.securityMockHistory=safeArray(p.securityMockHistory,100);
  out.bFinalHistory=safeArray(p.bFinalHistory,100);

  return out;
}

// v96 backup compatibility: its checksum was calculated after forcing schema v3.
function normalizeProfileDataV3ForChecksum(input){
  const p=isPlainObject(input)?input:{};
  const base=structuredClone(DEFAULT_PROFILE);
  base.profileSchemaVersion=3;
  delete base.profileMeta;
  delete base.masteryHistory;
  const out={...base,...p};
  out.profileSchemaVersion=3;
  out.xp=nonNegativeInt(p.xp,0);
  out.streak=nonNegativeInt(p.streak,0);
  out.diagnosticCompleted=!!p.diagnosticCompleted;
  out.diagnosticScores=safeObject(p.diagnosticScores);
  out.skills={};
  Object.entries(DEFAULT_PROFILE.skills).forEach(([name,def])=>out.skills[name]=boundedPercent(p.skills?.[name],def));
  out.lastStudyDate=typeof p.lastStudyDate==='string'?p.lastStudyDate:null;
  out.lessonProgress=normalizeProgressMap(p.lessonProgress);
  out.bProgress=normalizeProgressMap(p.bProgress);
  out.securityBProgress=normalizeProgressMap(p.securityBProgress);
  ['qStats','techniqueStats','mockQuestionStats','mockMistakeStats','bMockStats','bCompoundStats',
   'securityMockStats','bFinalStats','bFinalMistakeStats','settings','dailyPlans','reviewJourney','reviewJourneys','chapterMastery'
  ].forEach(key=>out[key]=safeObject(p[key]));
  out.sessions=safeArray(p.sessions,3000);
  out.activity=safeObject(p.activity);
  out.mockHistory=safeArray(p.mockHistory,100);
  out.bMockHistory=safeArray(p.bMockHistory,100);
  out.bCompoundHistory=safeArray(p.bCompoundHistory,100);
  out.securityMockHistory=safeArray(p.securityMockHistory,100);
  out.bFinalHistory=safeArray(p.bFinalHistory,100);
  return out;
}
function profileIntegrityChecksumV3(p){
  return `fnv1a32:${fnv1a32(stableJson(normalizeProfileDataV3ForChecksum(p)))}`;
}

// v97 backup/current-data compatibility: checksum must be calculated exactly as schema v4 did.
function normalizeProfileDataV4ForChecksum(input){
  const p=isPlainObject(input)?input:{};
  const base=structuredClone(DEFAULT_PROFILE);
  base.profileSchemaVersion=4;
  base.profileMeta={createdAt:null,updatedAt:null,lastAppVersion:null,migratedFromSchema:null};
  base.masteryHistory={};
  const out={...base,...p};
  out.profileSchemaVersion=4;
  const pm=safeObject(p.profileMeta);
  out.profileMeta={
    createdAt:pm.createdAt??null,
    updatedAt:pm.updatedAt??null,
    lastAppVersion:pm.lastAppVersion??null,
    migratedFromSchema:pm.migratedFromSchema??null
  };
  out.masteryHistory=safeObject(p.masteryHistory);
  out.xp=nonNegativeInt(p.xp,0);
  out.streak=nonNegativeInt(p.streak,0);
  out.diagnosticCompleted=!!p.diagnosticCompleted;
  out.diagnosticScores=safeObject(p.diagnosticScores);
  out.skills={};
  Object.entries(DEFAULT_PROFILE.skills).forEach(([name,def])=>out.skills[name]=boundedPercent(p.skills?.[name],def));
  out.lastStudyDate=typeof p.lastStudyDate==='string'?p.lastStudyDate:null;
  out.lessonProgress=normalizeProgressMap(p.lessonProgress);
  out.bProgress=normalizeProgressMap(p.bProgress);
  out.securityBProgress=normalizeProgressMap(p.securityBProgress);
  ['qStats','techniqueStats','mockQuestionStats','mockMistakeStats','bMockStats','bCompoundStats',
   'securityMockStats','bFinalStats','bFinalMistakeStats','settings','dailyPlans','reviewJourney','reviewJourneys','chapterMastery'
  ].forEach(key=>out[key]=safeObject(p[key]));
  out.sessions=safeArray(p.sessions,3000);
  out.activity=safeObject(p.activity);
  out.mockHistory=safeArray(p.mockHistory,100);
  out.bMockHistory=safeArray(p.bMockHistory,100);
  out.bCompoundHistory=safeArray(p.bCompoundHistory,100);
  out.securityMockHistory=safeArray(p.securityMockHistory,100);
  out.bFinalHistory=safeArray(p.bFinalHistory,100);
  return out;
}
function profileIntegrityChecksumV4(p){
  return `fnv1a32:${fnv1a32(stableJson(normalizeProfileDataV4ForChecksum(p)))}`;
}
function profileChecksumForSchema(p,schema=profileSchemaNumber(p)){
  if(schema===3)return profileIntegrityChecksumV3(p);
  if(schema===4)return profileIntegrityChecksumV4(p);
  return profileIntegrityChecksum(p);
}
function parseProfileRaw(raw){
  if(typeof raw!=='string'||!raw.trim())throw new Error('empty profile');
  const parsed=JSON.parse(raw);
  if(!isPlainObject(parsed))throw new Error('profile is not an object');
  if(profileSchemaNumber(parsed)>PROFILE_SCHEMA_VERSION)throw futureSchemaError(profileSchemaNumber(parsed));
  return normalizeProfileData(parsed);
}
function stampProfileForSave(p){
  const now=new Date().toISOString();
  const normalized=normalizeProfileData(p);
  normalized.profileMeta={
    ...safeObject(normalized.profileMeta),
    createdAt:normalized.profileMeta?.createdAt||now,
    updatedAt:now,
    lastAppVersion:APP_VERSION
  };
  return normalized;
}
function validRawWithChecksum(raw,expected=null){
  if(typeof raw!=='string'||!raw.trim())throw new Error('empty profile');
  const parsed=JSON.parse(raw);
  if(!isPlainObject(parsed))throw new Error('profile is not an object');
  const sourceSchema=profileSchemaNumber(parsed);
  if(sourceSchema>PROFILE_SCHEMA_VERSION)throw futureSchemaError(sourceSchema);
  const sourceChecksum=profileChecksumForSchema(parsed,sourceSchema);
  if(expected&&expected!==sourceChecksum)throw new Error('profile checksum mismatch');
  const normalized=normalizeProfileData(parsed);
  return {profile:normalized,checksum:profileIntegrityChecksum(normalized),sourceChecksum,sourceSchema};
}
function atomicProfileEnvelope(p,{revision=null,writerId=TAB_INSTANCE_ID}={}){
  const normalized=normalizeProfileData(p);
  const rev=revision==null?nonNegativeInt(normalized.profileMeta?.revision,0):nonNegativeInt(revision,0);
  normalized.profileMeta={...safeObject(normalized.profileMeta),revision:rev,lastWriterId:writerId||null};
  return {
    format:'fequest-profile-atomic-v1',appVersion:APP_VERSION,profileSchemaVersion:PROFILE_SCHEMA_VERSION,
    revision:rev,writerId:writerId||null,savedAt:new Date().toISOString(),
    checksum:profileIntegrityChecksum(normalized),profile:normalized
  };
}
function decodeAtomicProfileEnvelope(raw){
  if(typeof raw!=='string'||!raw.trim())throw new Error('empty atomic profile');
  const env=JSON.parse(raw);
  if(!isPlainObject(env)||env.format!=='fequest-profile-atomic-v1'||!isPlainObject(env.profile))throw new Error('invalid atomic profile');
  const schema=nonNegativeInt(env.profileSchemaVersion??env.profile.profileSchemaVersion,1);
  if(schema>PROFILE_SCHEMA_VERSION)throw futureSchemaError(schema);
  const actual=profileChecksumForSchema(env.profile,schema);
  if(typeof env.checksum!=='string'||actual!==env.checksum)throw new Error('atomic profile checksum mismatch');
  const normalized=normalizeProfileData(env.profile);
  const rev=nonNegativeInt(env.revision??normalized.profileMeta?.revision,0);
  normalized.profileMeta={...safeObject(normalized.profileMeta),revision:rev,lastWriterId:typeof env.writerId==='string'?env.writerId:(normalized.profileMeta?.lastWriterId||null)};
  return {profile:normalized,revision:rev,writerId:normalized.profileMeta.lastWriterId,sourceSchema:schema,checksum:profileIntegrityChecksum(normalized)};
}
function currentAtomicProfile(){
  const raw=localStorage.getItem(PROFILE_ATOMIC_KEY);
  if(!raw)return null;
  return decodeAtomicProfileEnvelope(raw);
}
function beginMigrationJournal(raw,checksum,fromSchema){
  try{localStorage.setItem(PROFILE_MIGRATION_JOURNAL_KEY,JSON.stringify({format:'fequest-migration-v1',fromSchema,toSchema:PROFILE_SCHEMA_VERSION,startedAt:new Date().toISOString(),raw,checksum:checksum||null}))}catch(_e){}
}
function finishMigrationJournal(){try{localStorage.removeItem(PROFILE_MIGRATION_JOURNAL_KEY)}catch(_e){}}
function recoverInterruptedMigrationIfNeeded(){
  const jr=localStorage.getItem(PROFILE_MIGRATION_JOURNAL_KEY);if(!jr)return false;
  try{
    const atomic=currentAtomicProfile();
    if(atomic&&atomic.sourceSchema===PROFILE_SCHEMA_VERSION){finishMigrationJournal();return false}
  }catch(_e){}
  try{
    const j=JSON.parse(jr);
    if(j?.format==='fequest-migration-v1'&&typeof j.raw==='string'){
      const checked=validRawWithChecksum(j.raw,j.checksum||null);
      if(checked.sourceSchema<=PROFILE_SCHEMA_VERSION){
        localStorage.setItem(STORAGE_KEY,j.raw);
        if(j.checksum)localStorage.setItem(PROFILE_CHECKSUM_KEY,j.checksum);else localStorage.removeItem(PROFILE_CHECKSUM_KEY);
        localStorage.removeItem(PROFILE_ATOMIC_KEY);
      }
    }
  }catch(e){console.warn('Interrupted migration rollback failed',e)}
  finishMigrationJournal();return true;
}
function readWriterLease(){try{return JSON.parse(localStorage.getItem(PROFILE_WRITER_LEASE_KEY)||'null')}catch(_e){return null}}
function acquireProfileWriteLease(){
  const now=Date.now();
  try{
    const old=readWriterLease();
    if(old?.tabId&&old.tabId!==TAB_INSTANCE_ID&&Number(old.expiresAt)>now)return false;
    localStorage.setItem(PROFILE_WRITER_LEASE_KEY,JSON.stringify({tabId:TAB_INSTANCE_ID,expiresAt:now+WRITER_LEASE_MS}));
    return readWriterLease()?.tabId===TAB_INSTANCE_ID;
  }catch(e){console.warn('Writer lease unavailable',e);return true}
}
function releaseProfileWriteLease(){try{const x=readWriterLease();if(x?.tabId===TAB_INSTANCE_ID)localStorage.removeItem(PROFILE_WRITER_LEASE_KEY)}catch(_e){}}
function markProfileConflict(reason='åˆ¥ã®ç”»é¢ã§å­¦ç¿’ãƒ‡ãƒ¼ã‚¿ãŒæ›´æ–°ã•ã‚Œã¾ã—ãŸ'){
  profileConflictBlocked=true;
  if(profileConflictNoticeShown)return;
  profileConflictNoticeShown=true;
  setTimeout(()=>showAppNotice?.('update','åˆ¥ã®ç”»é¢ã®å­¦ç¿’ãƒ‡ãƒ¼ã‚¿ã‚’ä¿è­·ã—ã¾ã—ãŸ',`${reason}ã€‚å¤ã„çŠ¶æ…‹ã§ä¸Šæ›¸ãã—ãªã„ã‚ˆã†ã€ã“ã®ç”»é¢ã‹ã‚‰ã®ä¿å­˜ã‚’åœæ­¢ã—ã¾ã—ãŸã€‚æœ€æ–°çŠ¶æ…‹ã‚’èª­ã¿è¾¼ã‚“ã§ãã ã•ã„ã€‚`,'æœ€æ–°çŠ¶æ…‹ã‚’èª­ã¿è¾¼ã‚€',()=>location.reload()),0);
}
function assertNoExternalProfileConflict(){
  let atomic=null;try{atomic=currentAtomicProfile()}catch(e){throw e}
  if(!atomic)return true;
  if(atomic.revision>profileBaseRevision&&atomic.writerId!==TAB_INSTANCE_ID){
    const e=new Error('profile revision conflict');e.code='PROFILE_REVISION_CONFLICT';throw e;
  }
  return true;
}
function bestCurrentRawForRollback(){
  try{const a=currentAtomicProfile();if(a)return {raw:JSON.stringify(a.profile),checksum:profileIntegrityChecksum(a.profile)}}catch(_e){}
  const raw=localStorage.getItem(STORAGE_KEY);if(!raw)return null;
  try{const c=validRawWithChecksum(raw,localStorage.getItem(PROFILE_CHECKSUM_KEY)||null);return {raw,checksum:c.sourceChecksum}}catch(_e){return null}
}
function preservePreviousProfileIfValid(nextRaw){
  const prev=bestCurrentRawForRollback();
  if(!prev||prev.raw===nextRaw)return;
  try{localStorage.setItem(LAST_GOOD_PROFILE_KEY,prev.raw);localStorage.setItem(LAST_GOOD_CHECKSUM_KEY,prev.checksum)}catch(e){console.warn('Rollback snapshot could not be refreshed',e)}
}
function writeCurrentProfile(p,{preservePrevious=true,skipConflictCheck=false,exactRevision=null}={}){
  if(!skipConflictCheck)assertNoExternalProfileConflict();
  let normalized=normalizeProfileData(p);
  let latestRevision=profileBaseRevision;
  try{latestRevision=Math.max(latestRevision,currentAtomicProfile()?.revision||0)}catch(_e){}
  const revision=exactRevision==null?Math.max(latestRevision,nonNegativeInt(normalized.profileMeta?.revision,0))+1:nonNegativeInt(exactRevision,0);
  normalized.profileMeta={...safeObject(normalized.profileMeta),revision,lastWriterId:TAB_INSTANCE_ID};
  const raw=JSON.stringify(normalized),checksum=profileIntegrityChecksum(normalized);
  if(preservePrevious)preservePreviousProfileIfValid(raw);

  // One localStorage write contains both profile and checksum. If the app is killed after this line,
  // the new state is still self-validating; the compatibility mirrors below may be repaired on next boot.
  const envelope=atomicProfileEnvelope(normalized,{revision,writerId:TAB_INSTANCE_ID});
  localStorage.setItem(PROFILE_ATOMIC_KEY,JSON.stringify(envelope));
  try{localStorage.setItem(STORAGE_KEY,raw);localStorage.setItem(PROFILE_CHECKSUM_KEY,checksum)}catch(e){console.warn('Compatibility mirror write incomplete; atomic profile remains authoritative',e)}
  profileBaseRevision=revision;profileCommittedChecksum=checksum;
  return {profile:normalized,raw,checksum,revision};
}
function rememberCommittedProfile(p=profile){
  const normalized=normalizeProfileData(p);
  profileCommittedSnapshot=structuredClone(normalized);
  profileCommittedChecksum=profileIntegrityChecksum(normalized);
  profileBaseRevision=nonNegativeInt(normalized.profileMeta?.revision,profileBaseRevision);
  return normalized;
}
function restoreCommittedProfileInMemory(refresh=true){
  if(!profileCommittedSnapshot)return false;
  profile=structuredClone(profileCommittedSnapshot);
  profileCommittedChecksum=profileIntegrityChecksum(profile);
  profileBaseRevision=nonNegativeInt(profile.profileMeta?.revision,profileBaseRevision);
  if(refresh)try{refreshProfileUI?.()}catch(_e){}
  return true;
}
function noteProfileSaveFailure(e){
  lastProfileSaveFailure=e?.message||String(e||'ä¿å­˜ã«å¤±æ•—ã—ã¾ã—ãŸ');
  lastProfileSaveFailureAt=Date.now();
}
function clearProfileSaveFailure(){lastProfileSaveFailure='';lastProfileSaveFailureAt=0;}

function repairCompatibilityMirror(p){
  try{const normalized=normalizeProfileData(p);localStorage.setItem(STORAGE_KEY,JSON.stringify(normalized));localStorage.setItem(PROFILE_CHECKSUM_KEY,profileIntegrityChecksum(normalized));return true}catch(_e){return false}
}
function repairAtomicEnvelopeExact(p){
  const normalized=normalizeProfileData(p),revision=nonNegativeInt(normalized.profileMeta?.revision,0);
  const env=atomicProfileEnvelope(normalized,{revision,writerId:normalized.profileMeta?.lastWriterId||TAB_INSTANCE_ID});
  localStorage.setItem(PROFILE_ATOMIC_KEY,JSON.stringify(env));profileBaseRevision=revision;return normalized;
}
function storeValidProfileSnapshot(p){
  const normalized=normalizeProfileData(p);
  const result=writeCurrentProfile(normalized,{preservePrevious:true,skipConflictCheck:true});
  return result.profile;
}
function loadProfile(){
  recoverInterruptedMigrationIfNeeded();

  const atomicRaw=localStorage.getItem(PROFILE_ATOMIC_KEY);
  if(atomicRaw){
    try{
      const a=decodeAtomicProfileEnvelope(atomicRaw);
      profileBaseRevision=a.revision;
      repairCompatibilityMirror(a.profile);
      return a.profile;
    }catch(e){
      console.warn('Atomic profile could not be used; checking compatibility mirror',e);
      if(e?.code==='FUTURE_PROFILE_SCHEMA'){
        profileRecoveryWarning=true;profileRecoveryReason=e?.message||String(e);profileRecoverySource='future';profileWriteBlocked=true;
        return structuredClone(DEFAULT_PROFILE);
      }
      try{localStorage.setItem(CORRUPT_PROFILE_KEY,atomicRaw)}catch(_e){}
    }
  }

  let raw=localStorage.getItem(STORAGE_KEY);
  if(!raw){
    for(const key of LEGACY_STORAGE_KEYS){
      const legacy=localStorage.getItem(key);if(!legacy)continue;
      try{
        const parsed=JSON.parse(legacy),sourceSchema=profileSchemaNumber(parsed);
        let migrated=normalizeProfileData(parsed);
        migrated.profileMeta={...safeObject(migrated.profileMeta),lastAppVersion:APP_VERSION};
        beginMigrationJournal(legacy,null,sourceSchema);
        const result=writeCurrentProfile(migrated,{preservePrevious:false,skipConflictCheck:true});
        finishMigrationJournal();profileRecoverySource='legacy';return result.profile;
      }catch(_e){}
    }
    profileBaseRevision=0;return structuredClone(DEFAULT_PROFILE);
  }

  try{
    const parsed=JSON.parse(raw);
    if(!isPlainObject(parsed))throw new Error('profile is not an object');
    const sourceSchema=profileSchemaNumber(parsed);
    if(sourceSchema>PROFILE_SCHEMA_VERSION)throw futureSchemaError(sourceSchema);
    const expected=localStorage.getItem(PROFILE_CHECKSUM_KEY);
    const sourceChecksum=profileChecksumForSchema(parsed,sourceSchema);
    if(expected&&expected!==sourceChecksum)throw new Error('profile checksum mismatch');
    let p=normalizeProfileData(parsed);

    if(sourceSchema<PROFILE_SCHEMA_VERSION){
      beginMigrationJournal(raw,expected||sourceChecksum,sourceSchema);
      p.profileMeta={...safeObject(p.profileMeta),lastAppVersion:APP_VERSION};
      const migrated=writeCurrentProfile(p,{preservePrevious:true,skipConflictCheck:true});
      p=migrated.profile;finishMigrationJournal();profileRecoverySource='migration';
    }else{
      profileBaseRevision=nonNegativeInt(p.profileMeta?.revision,0);
      repairAtomicEnvelopeExact(p);
      if(!expected)try{localStorage.setItem(PROFILE_CHECKSUM_KEY,profileIntegrityChecksum(p))}catch(_e){}
      if(!localStorage.getItem(LAST_GOOD_PROFILE_KEY))try{localStorage.setItem(LAST_GOOD_PROFILE_KEY,raw);localStorage.setItem(LAST_GOOD_CHECKSUM_KEY,sourceChecksum)}catch(_e){}
    }
    return p;
  }catch(e){
    console.warn('å­¦ç¿’ãƒ‡ãƒ¼ã‚¿ã®èª­ã¿è¾¼ã¿ã«å¤±æ•—ã—ã¾ã—ãŸã€‚',e);
    profileRecoveryWarning=true;profileRecoveryReason=e?.message||String(e);
    if(e?.code==='FUTURE_PROFILE_SCHEMA'){
      profileRecoverySource='future';profileWriteBlocked=true;return structuredClone(DEFAULT_PROFILE);
    }
    try{localStorage.setItem(CORRUPT_PROFILE_KEY,raw)}catch(_e){}
    const snapshot=localStorage.getItem(LAST_GOOD_PROFILE_KEY);
    if(snapshot){
      try{
        const checked=validRawWithChecksum(snapshot,localStorage.getItem(LAST_GOOD_CHECKSUM_KEY)||null);
        profileRecoverySource='snapshot';
        const result=writeCurrentProfile(checked.profile,{preservePrevious:false,skipConflictCheck:true});
        return result.profile;
      }catch(_e){}
    }
    profileRecoverySource='default';profileRecoveryNeedsIndexedDb=true;profileWriteBlocked=true;profileBaseRevision=0;
    return structuredClone(DEFAULT_PROFILE);
  }
}
let profile = loadProfile();
rememberCommittedProfile(profile);

function saveProfile(){
  // v117: top-level schema/backfill calls made while the one-file bundle is still
  // declaring later modules must never refresh the whole UI. Defer them into one
  // final save after every dataset/renderer exists.
  if(!appBootComplete){bootProfileSavePending=true;return true;}
  if(profileWriteBlocked||profileConflictBlocked){restoreCommittedProfileInMemory(true);return false;}
  if(!acquireProfileWriteLease()){
    restoreCommittedProfileInMemory(true);
    markProfileConflict('åˆ¥ã®FE QUESTç”»é¢ãŒã„ã¾å­¦ç¿’ãƒ‡ãƒ¼ã‚¿ã‚’æ›¸ãè¾¼ã‚“ã§ã„ã¾ã™');return false;
  }
  let saved=false;
  try{
    profile=stampProfileForSave(profile);
    const result=writeCurrentProfile(profile,{preservePrevious:true});
    profile=result.profile;rememberCommittedProfile(profile);clearProfileSaveFailure();
    saved=true;
  }catch(e){
    restoreCommittedProfileInMemory(false);noteProfileSaveFailure(e);
    if(e?.code==='PROFILE_REVISION_CONFLICT'){markProfileConflict();return false}
    profileWriteBlocked=true;
    console.warn('å­¦ç¿’ãƒ‡ãƒ¼ã‚¿ã®ä¿å­˜ã«å¤±æ•—ã—ã¾ã—ãŸã€‚',e);
    setTimeout(()=>showAppNotice('error','ä¿å­˜ã§ãã¾ã›ã‚“ã§ã—ãŸ','ç¾åœ¨ã®å­¦ç¿’ãƒ‡ãƒ¼ã‚¿ã¯æœ€å¾Œã«æ­£å¸¸ä¿å­˜ã§ããŸçŠ¶æ…‹ã¸æˆ»ã—ã¾ã—ãŸã€‚ãƒšãƒ¼ã‚¸ã‚’å†èª­ã¿è¾¼ã¿ã™ã‚‹ã¨æ”¹å–„ã™ã‚‹å ´åˆãŒã‚ã‚Šã¾ã™ã€‚','å†èª­ã¿è¾¼ã¿',()=>location.reload()),0);
    setTimeout(()=>refreshPwaHealth?.(),0);
    return false;
  }finally{releaseProfileWriteLease()}

  // A recovery-checkpoint or UI-rendering bug must never be misclassified as a
  // storage failure. Persistence has already succeeded at this point.
  try{queueRecoveryCheckpoint('autosave',false)}catch(e){console.warn('Recovery checkpoint queue failed',e)}
  try{refreshProfileUI()}catch(e){
    console.warn('UI refresh failed after a successful save',e);
    setTimeout(()=>reportGlobalError?.(),0);
  }
  return saved;
}

function clamp(n,min,max){ return Math.max(min, Math.min(max,n)); }

const COGNITIVE_WEIGHTS={'æƒ³èµ·':0.80,'é©ç”¨':1.00,'åˆ¤æ–­':1.25};

function cognitiveWeight(q){
  return COGNITIVE_WEIGHTS[q?.cognitiveLevel]||1;
}

function cognitiveSkillDelta(q,base){
  return Math.round(base*cognitiveWeight(q)*100)/100;
}

function applyQuestionSkillDelta(q,base){
  if(!q?.cat)return;
  profile.skills[q.cat]=clamp((profile.skills[q.cat]||50)+cognitiveSkillDelta(q,base),0,100);
}

function cognitiveLevelEvidence(cat,level){
  ensureQuestionProfile();
  const qs=QUESTION_BANK.filter(q=>q.cat===cat&&q.cognitiveLevel===level);
  const attempted=qs.filter(q=>(profile.qStats?.[q.id]?.attempts||0)>0);
  const attempts=attempted.reduce((n,q)=>n+(profile.qStats[q.id].attempts||0),0);
  const correct=attempted.reduce((n,q)=>n+(profile.qStats[q.id].correct||0),0);
  const accuracy=attempts?Math.round(correct/attempts*100):null;
  const ret=attempted.map(q=>memoryRetention(profile.qStats[q.id])).filter(x=>x!=null);
  const retention=ret.length?Math.round(ret.reduce((a,b)=>a+b,0)/ret.length):null;
  const raw=accuracy==null?null:Math.round(accuracy*.65+(retention??accuracy)*.35);
  const coverage=qs.length?Math.round(attempted.length/qs.length*100):0;
  const score=raw==null?null:Math.round(raw*(.72+.28*coverage/100));
  return {level,total:qs.length,attempted:attempted.length,attempts,correct,accuracy,retention,coverage,score};
}

function categoryCognitiveEvidence(cat){
  const levels=['æƒ³èµ·','é©ç”¨','åˆ¤æ–­'].map(level=>cognitiveLevelEvidence(cat,level));
  const prior=Math.round(profile.skills?.[cat]||50);
  const tested=levels.filter(x=>x.score!=null);
  const denom=levels.reduce((s,x)=>s+COGNITIVE_WEIGHTS[x.level],0);
  const weighted=levels.reduce((s,x)=>s+(x.score==null?prior:x.score)*COGNITIVE_WEIGHTS[x.level],0);
  const score=tested.length?Math.round(weighted/Math.max(1,denom)):prior;
  const weakest=[...levels].sort((a,b)=>{
    const as=a.score==null?50:a.score,bs=b.score==null?50:b.score;
    if(as!==bs)return as-bs;
    return COGNITIVE_WEIGHTS[b.level]-COGNITIVE_WEIGHTS[a.level];
  })[0];
  return {cat,score,levels,weakest};
}

function subjectACognitiveEvidence(){
  const rows=QUESTION_BANK.map(q=>({q,st:profile.qStats?.[q.id]})).filter(x=>(x.st?.attempts||0)>0);
  if(!rows.length)return 0;
  let weighted=0,denom=0;
  rows.forEach(({q,st})=>{
    const accuracy=st.attempts?clamp((st.correct||0)/st.attempts*100,0,100):0;
    const retention=memoryRetention(st)??accuracy;
    const score=accuracy*.60+retention*.40;
    const w=cognitiveWeight(q);
    weighted+=score*w;denom+=w;
  });
  const coverageWeight=rows.reduce((n,x)=>n+cognitiveWeight(x.q),0);
  const totalWeight=QUESTION_BANK.reduce((n,q)=>n+cognitiveWeight(q),0);
  const coverage=totalWeight?coverageWeight/totalWeight:0;
  return Math.round((weighted/Math.max(1,denom))*(.60+.40*coverage));
}

function refreshProfileUI(){
  const xpTop = document.getElementById('xpTop');
  const xpMobile = document.getElementById('xpMobile');
  const streakTop = document.getElementById('streakTop');
  const streakMobile = document.getElementById('streakMobile');
  if(xpTop) xpTop.textContent = profile.xp.toLocaleString('ja-JP');
  if(xpMobile) xpMobile.textContent = profile.xp >= 1000 ? (profile.xp/1000).toFixed(1)+'k' : profile.xp;
  if(streakTop) streakTop.textContent = profile.streak;
  if(streakMobile) streakMobile.textContent = profile.streak;

  const banner = document.getElementById('diagBanner');
  if(banner) banner.classList.toggle('hidden', profile.diagnosticCompleted);
  const home=document.getElementById('home');
  if(home)home.classList.toggle('home-onboarding',!profile.diagnosticCompleted);

  renderSkills();
  buildDailyQuest();
}

function sortedSkills(){
  return Object.keys(profile.skills||{}).map(cat=>[cat,categoryCognitiveEvidence(cat).score]).sort((a,b)=>a[1]-b[1]);
}

function renderSkills(){
  const list = document.getElementById('skillList');
  if(!list) return;
  list.innerHTML = '';
  const icons = {
    'åŸºç¤Žç†è«–':'ðŸ§®','ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿':'âš™ï¸','ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹':'ðŸ—„ï¸','ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯':'ðŸŒ',
    'ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£':'ðŸ›¡ï¸','ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ':'ðŸ’»','ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ':'ðŸ“‹','ã‚¹ãƒˆãƒ©ãƒ†ã‚¸':'ðŸ“ˆ'
  };
  sortedSkills().forEach(([name,val])=>{
    const row = document.createElement('div');
    row.className='skill-row';
    row.innerHTML = `
      <div class="skill-head">
        <div class="skill-name">${icons[name]||'ðŸ“˜'} ${name}</div>
        <div class="skill-value">${val}%</div>
      </div>
      <div class="progress"><div style="width:${val}%"></div></div>
    `;
    list.appendChild(row);
  });
  const weak = sortedSkills().slice(0,3).map(x=>x[0]);
  const advice = document.getElementById('weakAdvice');
  if(advice){
    advice.textContent = profile.diagnosticCompleted
      ? `ç¾åœ¨ã®å„ªå…ˆåˆ†é‡Žã¯ã€Œ${weak.join('ãƒ»')}ã€ã§ã™ã€‚æ¯Žæ—¥ã®å¾©ç¿’æž ã«å°‘ã—ãšã¤å…¥ã‚Œã¾ã™ã€‚`
      : 'å®ŸåŠ›è¨ºæ–­ã‚’ã™ã‚‹ã¨ã€ã“ã“ã«å„ªå…ˆã—ã¦å­¦ã¶åˆ†é‡ŽãŒè¡¨ç¤ºã•ã‚Œã¾ã™ã€‚';
  }
}

function buildDailyQuest(){
  const ordered = sortedSkills();
  const weak1 = ordered[0]?.[0] || 'ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ';
  const weak2 = ordered[1]?.[0] || 'ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯';
  const review = document.getElementById('questReviewTopic');
  const newTitle = document.getElementById('questNewTitle');
  const btopic = document.getElementById('questBTopic');
  if(review) review.textContent = `${weak1}ãƒ»${weak2}`;

  const newStage = {
    'åŸºç¤Žç†è«–':'åŸºæ•°å¤‰æ›',
    'ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿':'CPUã¨ã‚­ãƒ£ãƒƒã‚·ãƒ¥',
    'ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹':'SQLã®åŸºæœ¬',
    'ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯':'IPã‚¢ãƒ‰ãƒ¬ã‚¹',
    'ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£':'å…¬é–‹éµæš—å·',
    'ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ':'äºŒåˆ†æŽ¢ç´¢',
    'ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ':'ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆç®¡ç†',
    'ã‚¹ãƒˆãƒ©ãƒ†ã‚¸':'çµŒå–¶æˆ¦ç•¥'
  };
  if(newTitle) newTitle.textContent = newStage[weak1] || 'äºŒåˆ†æŽ¢ç´¢';
  if(btopic) btopic.textContent = categoryCognitiveEvidence('ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ').score < 70 ? 'é…åˆ—ãƒ»ãƒ«ãƒ¼ãƒ—' : 'æ¡ä»¶åˆ†å²ãƒ»æŽ¢ç´¢';
}

// Original diagnostic questions based on FE topic areas; not copied from the books.
const DIAG_QUESTIONS = [
  {
    category:'åŸºç¤Žç†è«–',
    q:'2é€²æ•° 1010 ã‚’10é€²æ•°ã§è¡¨ã™ã¨ã„ãã¤ã§ã™ã‹ï¼Ÿ',
    options:['8','10','12','14'], answer:1
  },
  {
    category:'ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿',
    q:'CPUã¨ä¸»è¨˜æ†¶ã®é€Ÿåº¦å·®ã‚’åŸ‹ã‚ã‚‹ãŸã‚ã«ä½¿ã‚ã‚Œã‚‹ã‚‚ã®ã¨ã—ã¦æœ€ã‚‚é©åˆ‡ãªã®ã¯ï¼Ÿ',
    options:['ã‚­ãƒ£ãƒƒã‚·ãƒ¥ãƒ¡ãƒ¢ãƒª','å…‰ãƒ‡ã‚£ã‚¹ã‚¯','ãƒ—ãƒªãƒ³ã‚¿','ãƒ«ãƒ¼ã‚¿'], answer:0
  },
  {
    category:'ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹',
    q:'é–¢ä¿‚ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹ã§ã€è¡¨ã®å„è¡Œã‚’ä¸€æ„ã«è­˜åˆ¥ã™ã‚‹ãŸã‚ã«ä½¿ã†ã‚­ãƒ¼ã¯ï¼Ÿ',
    options:['å¤–éƒ¨ã‚­ãƒ¼','ä¸»ã‚­ãƒ¼','æš—å·éµ','æ¤œç´¢ã‚­ãƒ¼'], answer:1
  },
  {
    category:'ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯',
    q:'ã‚¤ãƒ³ã‚¿ãƒ¼ãƒãƒƒãƒˆä¸Šã§æ©Ÿå™¨ã‚’è­˜åˆ¥ã™ã‚‹ãŸã‚ã«ä½¿ã‚ã‚Œã‚‹è«–ç†çš„ãªã‚¢ãƒ‰ãƒ¬ã‚¹ã¯ï¼Ÿ',
    options:['MACã‚¢ãƒ‰ãƒ¬ã‚¹','IPã‚¢ãƒ‰ãƒ¬ã‚¹','SSID','URL'], answer:1
  },
  {
    category:'ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£',
    q:'é€ä¿¡è€…æœ¬äººãŒä½œæˆã—ãŸã“ã¨ã¨ã€å†…å®¹ãŒæ”¹ã–ã‚“ã•ã‚Œã¦ã„ãªã„ã“ã¨ã®ç¢ºèªã«å½¹ç«‹ã¤ã‚‚ã®ã¯ï¼Ÿ',
    options:['ãƒ‡ã‚¸ã‚¿ãƒ«ç½²å','ãƒãƒƒã‚¯ã‚¢ãƒƒãƒ—','åœ§ç¸®','ãƒ•ã‚¡ã‚¤ã‚¢ã‚¦ã‚©ãƒ¼ãƒ«'], answer:0
  },
  {
    category:'ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ',
    q:'äºŒåˆ†æŽ¢ç´¢ã‚’åŠ¹çŽ‡ã‚ˆãä½¿ã†ãŸã‚ã«ã€æŽ¢ç´¢å¯¾è±¡ã®ãƒ‡ãƒ¼ã‚¿ã«å¿…è¦ãªæ¡ä»¶ã¯ï¼Ÿ',
    options:['å¿…ãšé‡è¤‡ã—ã¦ã„ã‚‹','æ•´åˆ—ã•ã‚Œã¦ã„ã‚‹','ç”»åƒãƒ‡ãƒ¼ã‚¿ã§ã‚ã‚‹','æš—å·åŒ–ã•ã‚Œã¦ã„ã‚‹'], answer:1
  },
  {
    category:'ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ',
    q:'ã‚¹ã‚¿ãƒƒã‚¯ã‹ã‚‰ãƒ‡ãƒ¼ã‚¿ã‚’å–ã‚Šå‡ºã™é †åºã¨ã—ã¦æ­£ã—ã„ã‚‚ã®ã¯ï¼Ÿ',
    options:['æœ€åˆã«å…¥ã‚ŒãŸã‚‚ã®ã‹ã‚‰','æœ€å¾Œã«å…¥ã‚ŒãŸã‚‚ã®ã‹ã‚‰','ãƒ©ãƒ³ãƒ€ãƒ ','å€¤ãŒå°ã•ã„ã‚‚ã®ã‹ã‚‰'], answer:1
  },
  {
    category:'ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ',
    q:'ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆã§ä½œæ¥­ã®é–‹å§‹ãƒ»çµ‚äº†äºˆå®šã‚’ç®¡ç†ã™ã‚‹å¯¾è±¡ã¨ã—ã¦æœ€ã‚‚è¿‘ã„ã‚‚ã®ã¯ï¼Ÿ',
    options:['ã‚¹ã‚±ã‚¸ãƒ¥ãƒ¼ãƒ«','æš—å·éµ','IPã‚¢ãƒ‰ãƒ¬ã‚¹','ä¸»ã‚­ãƒ¼'], answer:0
  },
  {
    category:'ã‚¹ãƒˆãƒ©ãƒ†ã‚¸',
    q:'å£²ä¸Šé«˜ã¨è²»ç”¨ãŒç­‰ã—ããªã‚Šã€åˆ©ç›ŠãŒ0ã«ãªã‚‹å£²ä¸Šé«˜ã‚’ä½•ã¨å‘¼ã³ã¾ã™ã‹ï¼Ÿ',
    options:['æç›Šåˆ†å²ç‚¹','é™ç•Œåˆ©ç›Š','å–¶æ¥­åˆ©ç›ŠçŽ‡','æµå‹•æ¯”çŽ‡'], answer:0
  },
  {
    category:'ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯',
    q:'å®¶åº­ã‚„ç¤¾å†…LANã§ä½¿ã‚ã‚Œã‚‹ã“ã¨ãŒå¤šãã€ã‚¤ãƒ³ã‚¿ãƒ¼ãƒãƒƒãƒˆä¸Šã§ã¯ãã®ã¾ã¾ä½¿ã‚ãªã„IPã‚¢ãƒ‰ãƒ¬ã‚¹ã¯ï¼Ÿ',
    options:['ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆIPã‚¢ãƒ‰ãƒ¬ã‚¹','ã‚°ãƒ­ãƒ¼ãƒãƒ«IPã‚¢ãƒ‰ãƒ¬ã‚¹','MACã‚¢ãƒ‰ãƒ¬ã‚¹','URL'], answer:0
  },
  {
    category:'ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£',
    q:'ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰ãã®ã‚‚ã®ã§ã¯ãªãã€è¨ˆç®—çµæžœã‚’ä¿å­˜ã—ã¦ç…§åˆã™ã‚‹ç”¨é€”ã§ã‚ˆãä½¿ã‚ã‚Œã‚‹ä»•çµ„ã¿ã¯ï¼Ÿ',
    options:['ãƒãƒƒã‚·ãƒ¥','ã‚½ãƒ¼ãƒˆ','ã‚­ãƒ£ãƒƒã‚·ãƒ¥','ãƒ«ãƒ¼ãƒ†ã‚£ãƒ³ã‚°'], answer:0
  },
  {
    category:'ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹',
    q:'è¤‡æ•°ã®å‡¦ç†ã‚’ã€Œã™ã¹ã¦æˆåŠŸã€ã¾ãŸã¯ã€Œã™ã¹ã¦å–ã‚Šæ¶ˆã—ã€ã¨ã—ã¦æ‰±ã†ã¾ã¨ã¾ã‚Šã¯ï¼Ÿ',
    options:['ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³','ã‚µãƒ–ãƒãƒƒãƒˆ','ã‚¹ãƒ¬ãƒƒãƒ‰','ãƒ—ãƒ­ãƒˆã‚³ãƒ«'], answer:0
  }
];

let diagIndex = 0;
let diagAnswers = Array(DIAG_QUESTIONS.length).fill(null);

function startDiagnosticFlow(skipIntro=false){
  showScreen('diagnostic');
  document.getElementById('diagResult').style.display='none';
  if(skipIntro){
    diagIndex=0;
    diagAnswers=Array(DIAG_QUESTIONS.length).fill(null);
    document.getElementById('diagIntro').style.display='none';
    document.getElementById('diagQuiz').style.display='block';
    renderDiagQuestion();
  }else{
    document.getElementById('diagIntro').style.display='block';
    document.getElementById('diagQuiz').style.display='none';
  }
}

const startDiagnosticBtn = document.getElementById('startDiagnostic');
if(startDiagnosticBtn) startDiagnosticBtn.addEventListener('click',()=>startDiagnosticFlow(true));

const diagBegin = document.getElementById('diagBegin');
if(diagBegin) diagBegin.addEventListener('click',()=>startDiagnosticFlow(true));

function renderDiagQuestion(){
  const item = DIAG_QUESTIONS[diagIndex];
  document.getElementById('diagCategory').textContent=item.category;
  document.getElementById('diagCount').textContent=`${diagIndex+1} / ${DIAG_QUESTIONS.length}`;
  document.getElementById('diagProgress').style.width=`${((diagIndex+1)/DIAG_QUESTIONS.length)*100}%`;
  document.getElementById('diagQuestion').textContent=item.q;
  const opts=document.getElementById('diagOptions');
  opts.innerHTML='';
  item.options.forEach((op,i)=>{
    const b=document.createElement('button');
    b.className='diag-option'+(diagAnswers[diagIndex]===i?' selected':'');
    b.textContent=`${String.fromCharCode(65+i)}. ${op}`;
    b.addEventListener('click',()=>{
      diagAnswers[diagIndex]=i;
      renderDiagQuestion();
    });
    opts.appendChild(b);
  });
  document.getElementById('diagPrev').disabled=diagIndex===0;
  document.getElementById('diagNext').textContent=diagIndex===DIAG_QUESTIONS.length-1?'çµæžœã‚’è¦‹ã‚‹':'æ¬¡ã¸ â†’';
}

document.getElementById('diagPrev')?.addEventListener('click',()=>{
  if(diagIndex>0){diagIndex--;renderDiagQuestion();}
});

document.getElementById('diagNext')?.addEventListener('click',()=>{
  if(diagAnswers[diagIndex]===null){
    popToast('å›žç­”ã‚’1ã¤é¸ã‚“ã§ãã ã•ã„');
    return;
  }
  if(diagIndex<DIAG_QUESTIONS.length-1){
    diagIndex++;renderDiagQuestion();
  }else{
    finishDiagnostic();
  }
});

function finishDiagnostic(){
  const cats={};
  DIAG_QUESTIONS.forEach((q,i)=>{
    if(!cats[q.category]) cats[q.category]={correct:0,total:0};
    cats[q.category].total++;
    if(diagAnswers[i]===q.answer) cats[q.category].correct++;
  });

  const scores={};
  Object.entries(cats).forEach(([cat,v])=>{
    scores[cat]=Math.round(v.correct/v.total*100);
  });

  // Categories with one diagnostic item are softened toward a neutral prior
  // so one mistake does not create an extreme 0/100 mastery estimate.
  Object.keys(profile.skills).forEach(cat=>{
    const raw = scores[cat];
    if(raw !== undefined){
      const sampleCount = cats[cat].total;
      const prior = profile.skills[cat] ?? 60;
      const weight = sampleCount >= 2 ? 0.65 : 0.45;
      profile.skills[cat]=Math.round(prior*(1-weight)+raw*weight);
    }
  });

  profile.diagnosticCompleted=true;
  profile.diagnosticScores=scores;
  profile.xp += 120;
  saveProfile();

  document.getElementById('diagQuiz').style.display='none';
  document.getElementById('diagResult').style.display='block';

  const grid=document.getElementById('diagResultGrid');
  grid.innerHTML='';
  sortedSkills().forEach(([cat,val])=>{
    const d=document.createElement('div');
    d.className='diag-result';
    d.innerHTML=`<div class="sub">${cat}</div><div class="diag-score">${val}%</div>`;
    grid.appendChild(d);
  });

  const weak=sortedSkills().slice(0,3).map(x=>x[0]);
  document.getElementById('diagResultAdvice').textContent=
    `ã¾ãšã¯ã€Œ${weak.join('ãƒ»')}ã€ã‚’é‡ç‚¹çš„ã«é€²ã‚ã¾ã™ã€‚ä»Šæ—¥ã®å­¦ç¿’ã¯${effectiveStudyMinutes()}åˆ†ã‚’ç›®å®‰ã«è‡ªå‹•èª¿æ•´ã—ã¾ã™ã€‚`;
}

document.getElementById('diagFinish')?.addEventListener('click',()=>globalThis.finishGuidedDiagnosticV364());
document.getElementById('diagRedo')?.addEventListener('click',()=>{
  profile.diagnosticCompleted=false;
  saveProfile();
  startDiagnosticFlow(true);
});

// Lesson interactions are handled by the v6 lesson engine.
// If the current prototype's result handler hard-codes XP, profile refresh will win afterwards.
setTimeout(refreshProfileUI,0);



// ===== v5: Original question bank + spaced review =====
// All questions below are FE QUEST originals.
// Book structure/topics were used only as curriculum references.

const QUESTION_BANK = [
  {
    "id": "theory-01",
    "cat": "åŸºç¤Žç†è«–",
    "concept": "åŸºæ•°å¤‰æ›",
    "difficulty": "åŸºç¤Ž",
    "q": "æ©Ÿå™¨Aã¯è£…ç½®ç•ªå·ã‚’2é€²æ•°ã§ä¿æŒã™ã‚‹ä»•æ§˜ã§ã€10é€²æ•°13ã‚’ç™»éŒ²ã—ãŸã„ã€‚ç™»éŒ²ã™ã¹ã2é€²è¡¨ç¾ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "1101",
      "1011",
      "1110",
      "1001"
    ],
    "a": 0,
    "exp": "13 = 8 + 4 + 1 ãªã®ã§ã€8ãƒ»4ãƒ»1ã®æ¡ãŒ1ã«ãªã‚Šã¾ã™ã€‚ã—ãŸãŒã£ã¦ 1101 ã§ã™ã€‚",
    "hint": "8, 4, 2, 1 ã®4ã¤ã®é‡ã¿ã§13ã‚’ä½œã£ã¦ã¿ã¾ã—ã‚‡ã†ã€‚",
    "choiceExps": [
      "13 = 8 + 4 + 1 ãªã®ã§ã€8ãƒ»4ãƒ»1ã®æ¡ãŒ1ã«ãªã‚Šã¾ã™ã€‚ã—ãŸãŒã£ã¦ 1101 ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¾‹ï¼š11011010â‚‚ â†’ 1101 1010 â†’ D A â†’ DAâ‚â‚†ã€ã€‚13 = 8 + 4 + 1 ãªã®ã§ã€8ãƒ»4ãƒ»1ã®æ¡ãŒ1ã«ãªã‚Šã¾ã™ã€‚ã—ãŸãŒã£ã¦ 1101 ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ1011ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¾‹ï¼š11011010â‚‚ â†’ 1101 1010 â†’ D A â†’ DAâ‚â‚†ã€ã€‚13 = 8 + 4 + 1 ãªã®ã§ã€8ãƒ»4ãƒ»1ã®æ¡ãŒ1ã«ãªã‚Šã¾ã™ã€‚ã—ãŸãŒã£ã¦ 1101 ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ1110ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¾‹ï¼š11011010â‚‚ â†’ 1101 1010 â†’ D A â†’ DAâ‚â‚†ã€ã€‚13 = 8 + 4 + 1 ãªã®ã§ã€8ãƒ»4ãƒ»1ã®æ¡ãŒ1ã«ãªã‚Šã¾ã™ã€‚ã—ãŸãŒã£ã¦ 1101 ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ1001ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_01_04",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "theory-02",
    "cat": "åŸºç¤Žç†è«–",
    "concept": "è«–ç†æ¼”ç®—",
    "difficulty": "åŸºç¤Ž",
    "q": "ã‚¢ã‚¯ã‚»ã‚¹æ¡ä»¶ãŒã€Œåˆ©ç”¨è€…AãŒèªè¨¼æ¸ˆã¿ AND ç«¯æœ«BãŒç¤¾å†…ç«¯æœ«ã€ã§ã‚ã‚‹ã€‚Aã¯æ¡ä»¶ã‚’æº€ãŸã™ãŒBã¯æº€ãŸã•ãªã„ã€‚ã“ã®è«–ç†å¼ã®çµæžœã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "å ´åˆã«ã‚ˆã‚‹",
      "å½",
      "å®šç¾©ã§ããªã„",
      "çœŸ"
    ],
    "a": 1,
    "exp": "ANDã¯ä¸¡æ–¹ãŒçœŸã®ã¨ãã ã‘çœŸã«ãªã‚Šã¾ã™ã€‚BãŒå½ãªã®ã§çµæžœã¯å½ã§ã™ã€‚",
    "hint": "ANDã¯ã€ŒAã‚‚Bã‚‚ã€ã®æ„å‘³ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œé›†åˆã¯ã€Œã‚ã‚‹æ¡ä»¶ã‚’æº€ãŸã™ã‚‚ã®ã®é›†ã¾ã‚Šã€ã€è«–ç†æ¼”ç®—ã¯ã€ŒçœŸã‹å½ã‹ã€ã‚’çµ„ã¿åˆã‚ã›ã‚‹è¨ˆç®—ã§ã™ã€‚æ¤œç´¢æ¡ä»¶ã‚„ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã®æ¡ä»¶åˆ¤å®šã®åŸºç¤Žã«ãªã‚‹è€ƒãˆæ–¹ã§ã™ã€ã€‚ANDã¯ä¸¡æ–¹ãŒçœŸã®ã¨ãã ã‘çœŸã«ãªã‚Šã¾ã™ã€‚BãŒå½ãªã®ã§çµæžœã¯å½ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå ´åˆã«ã‚ˆã‚‹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ANDã¯ä¸¡æ–¹ãŒçœŸã®ã¨ãã ã‘çœŸã«ãªã‚Šã¾ã™ã€‚BãŒå½ãªã®ã§çµæžœã¯å½ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œé›†åˆã¯ã€Œã‚ã‚‹æ¡ä»¶ã‚’æº€ãŸã™ã‚‚ã®ã®é›†ã¾ã‚Šã€ã€è«–ç†æ¼”ç®—ã¯ã€ŒçœŸã‹å½ã‹ã€ã‚’çµ„ã¿åˆã‚ã›ã‚‹è¨ˆç®—ã§ã™ã€‚æ¤œç´¢æ¡ä»¶ã‚„ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã®æ¡ä»¶åˆ¤å®šã®åŸºç¤Žã«ãªã‚‹è€ƒãˆæ–¹ã§ã™ã€ã€‚ã“ã®ãŸã‚ã€Œå®šç¾©ã§ããªã„ã€ã®ã‚ˆã†ã«æ–­å®šã™ã‚‹ã¨ã€å•é¡Œã®æ¡ä»¶ãƒ»å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œé›†åˆã¯ã€Œã‚ã‚‹æ¡ä»¶ã‚’æº€ãŸã™ã‚‚ã®ã®é›†ã¾ã‚Šã€ã€è«–ç†æ¼”ç®—ã¯ã€ŒçœŸã‹å½ã‹ã€ã‚’çµ„ã¿åˆã‚ã›ã‚‹è¨ˆç®—ã§ã™ã€‚æ¤œç´¢æ¡ä»¶ã‚„ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã®æ¡ä»¶åˆ¤å®šã®åŸºç¤Žã«ãªã‚‹è€ƒãˆæ–¹ã§ã™ã€ã€‚ANDã¯ä¸¡æ–¹ãŒçœŸã®ã¨ãã ã‘çœŸã«ãªã‚Šã¾ã™ã€‚BãŒå½ãªã®ã§çµæžœã¯å½ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒçœŸã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_02_01",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "theory-03",
    "cat": "åŸºç¤Žç†è«–",
    "concept": "è£œæ•°",
    "difficulty": "æ¨™æº–",
    "q": "8ãƒ“ãƒƒãƒˆã®2ã®è£œæ•°è¡¨ç¾ã§ã€00000101 ãŒ +5 ã‚’è¡¨ã™ã¨ãã€-5 ã‚’è¡¨ã™ã‚‚ã®ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "00000110",
      "11111010",
      "11111011",
      "10000101"
    ],
    "a": 2,
    "exp": "+5ã®ãƒ“ãƒƒãƒˆã‚’åè»¢ã™ã‚‹ã¨11111010ã€ãã“ã«1ã‚’åŠ ãˆã‚‹ã¨11111011ã§ã™ã€‚",
    "hint": "2ã®è£œæ•°ã¯ã€Œãƒ“ãƒƒãƒˆåè»¢ã—ã¦1ã‚’åŠ ãˆã‚‹ã€ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ8bitã§+5=00000101ã€‚åè»¢11111010ã«1ã‚’åŠ ãˆã€-5=11111011ã§ã™ã€ã€‚+5ã®ãƒ“ãƒƒãƒˆã‚’åè»¢ã™ã‚‹ã¨11111010ã€ãã“ã«1ã‚’åŠ ãˆã‚‹ã¨11111011ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ00000110ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ8bitã§+5=00000101ã€‚åè»¢11111010ã«1ã‚’åŠ ãˆã€-5=11111011ã§ã™ã€ã€‚+5ã®ãƒ“ãƒƒãƒˆã‚’åè»¢ã™ã‚‹ã¨11111010ã€ãã“ã«1ã‚’åŠ ãˆã‚‹ã¨11111011ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ11111010ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "+5ã®ãƒ“ãƒƒãƒˆã‚’åè»¢ã™ã‚‹ã¨11111010ã€ãã“ã«1ã‚’åŠ ãˆã‚‹ã¨11111011ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ8bitã§+5=00000101ã€‚åè»¢11111010ã«1ã‚’åŠ ãˆã€-5=11111011ã§ã™ã€ã€‚+5ã®ãƒ“ãƒƒãƒˆã‚’åè»¢ã™ã‚‹ã¨11111010ã€ãã“ã«1ã‚’åŠ ãˆã‚‹ã¨11111011ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ10000101ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_01_05",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "theory-04",
    "cat": "åŸºç¤Žç†è«–",
    "concept": "ç¢ºçŽ‡",
    "difficulty": "æ¨™æº–",
    "q": "ç‹¬ç«‹ã—ãŸ2ã¤ã®è£…ç½®Aãƒ»BãŒã‚ã‚Šã€ãã‚Œãžã‚Œæ­£å¸¸ã«å‹•ãç¢ºçŽ‡ãŒ0.9ã§ã‚ã‚‹ã€‚ä¸¡æ–¹ã¨ã‚‚æ­£å¸¸ã«å‹•ãç¢ºçŽ‡ã¯ï¼Ÿ",
    "options": [
      "0.90",
      "0.99",
      "1.80",
      "0.81"
    ],
    "a": 3,
    "exp": "ç‹¬ç«‹äº‹è±¡ãªã®ã§ 0.9 Ã— 0.9 = 0.81 ã§ã™ã€‚",
    "hint": "ã€Œä¸¡æ–¹ã¨ã‚‚ã€ã¯ç¢ºçŽ‡ã‚’æŽ›ã‘åˆã‚ã›ã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¾‹ï¼šç¨¼åƒçŽ‡0.9ã®è£…ç½®2å°ãªã‚‰ã€ç›´åˆ—0.81ã€ä¸¦åˆ—1-(0.1Ã—0.1)=0.99ã€ã€‚ç‹¬ç«‹äº‹è±¡ãªã®ã§ 0.9 Ã— 0.9 = 0.81 ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ0.90ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¾‹ï¼šç¨¼åƒçŽ‡0.9ã®è£…ç½®2å°ãªã‚‰ã€ç›´åˆ—0.81ã€ä¸¦åˆ—1-(0.1Ã—0.1)=0.99ã€ã€‚ç‹¬ç«‹äº‹è±¡ãªã®ã§ 0.9 Ã— 0.9 = 0.81 ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ0.99ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¾‹ï¼šç¨¼åƒçŽ‡0.9ã®è£…ç½®2å°ãªã‚‰ã€ç›´åˆ—0.81ã€ä¸¦åˆ—1-(0.1Ã—0.1)=0.99ã€ã€‚ç‹¬ç«‹äº‹è±¡ãªã®ã§ 0.9 Ã— 0.9 = 0.81 ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ1.80ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ç‹¬ç«‹äº‹è±¡ãªã®ã§ 0.9 Ã— 0.9 = 0.81 ã§ã™ã€‚"
    ],
    "explainTopicId": "core_05_04",
    "explainTopicSource": "manual",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "è¤‡æ•°æ¡ä»¶"
  },
  {
    "id": "computer-01",
    "cat": "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿",
    "concept": "CPU",
    "difficulty": "åŸºç¤Ž",
    "q": "CPUãŒä¸»è¨˜æ†¶ã‹ã‚‰å‘½ä»¤ã‚’å–ã‚Šå‡ºã—ã€å†…å®¹ã‚’è§£èª­ã—ã¦å®Ÿè¡Œã™ã‚‹ä¸€é€£ã®æµã‚Œã¨ã—ã¦æœ€ã‚‚é©åˆ‡ãªã®ã¯ï¼Ÿ",
    "options": [
      "å–å‡ºã—â†’è§£èª­â†’å®Ÿè¡Œ",
      "è§£èª­â†’å–å‡ºã—â†’å®Ÿè¡Œ",
      "å–å‡ºã—â†’å®Ÿè¡Œâ†’è§£èª­",
      "å®Ÿè¡Œâ†’è§£èª­â†’å–å‡ºã—"
    ],
    "a": 0,
    "exp": "åŸºæœ¬çš„ãªå‘½ä»¤ã‚µã‚¤ã‚¯ãƒ«ã¯ã€å‘½ä»¤å–å‡ºã—ï¼ˆfetchï¼‰â†’å‘½ä»¤è§£èª­ï¼ˆdecodeï¼‰â†’å®Ÿè¡Œï¼ˆexecuteï¼‰ã§ã™ã€‚",
    "hint": "ã¾ãšå‘½ä»¤ã‚’æ‰‹å…ƒã«æŒã£ã¦ã“ãªã„ã¨ã€è§£èª­ã‚‚å®Ÿè¡Œã‚‚ã§ãã¾ã›ã‚“ã€‚",
    "choiceExps": [
      "åŸºæœ¬çš„ãªå‘½ä»¤ã‚µã‚¤ã‚¯ãƒ«ã¯ã€å‘½ä»¤å–å‡ºã—ï¼ˆfetchï¼‰â†’å‘½ä»¤è§£èª­ï¼ˆdecodeï¼‰â†’å®Ÿè¡Œï¼ˆexecuteï¼‰ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒ•ã‚§ãƒƒãƒã§ä¸»è¨˜æ†¶ã‹ã‚‰å‘½ä»¤ã‚’å–ã‚Šå‡ºã™ã€ã€‚åŸºæœ¬çš„ãªå‘½ä»¤ã‚µã‚¤ã‚¯ãƒ«ã¯ã€å‘½ä»¤å–å‡ºã—ï¼ˆfetchï¼‰â†’å‘½ä»¤è§£èª­ï¼ˆdecodeï¼‰â†’å®Ÿè¡Œï¼ˆexecuteï¼‰ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œè§£èª­â†’å–å‡ºã—â†’å®Ÿè¡Œã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒ•ã‚§ãƒƒãƒã§ä¸»è¨˜æ†¶ã‹ã‚‰å‘½ä»¤ã‚’å–ã‚Šå‡ºã™ã€ã€‚åŸºæœ¬çš„ãªå‘½ä»¤ã‚µã‚¤ã‚¯ãƒ«ã¯ã€å‘½ä»¤å–å‡ºã—ï¼ˆfetchï¼‰â†’å‘½ä»¤è§£èª­ï¼ˆdecodeï¼‰â†’å®Ÿè¡Œï¼ˆexecuteï¼‰ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå–å‡ºã—â†’å®Ÿè¡Œâ†’è§£èª­ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒ•ã‚§ãƒƒãƒã§ä¸»è¨˜æ†¶ã‹ã‚‰å‘½ä»¤ã‚’å–ã‚Šå‡ºã™ã€ã€‚åŸºæœ¬çš„ãªå‘½ä»¤ã‚µã‚¤ã‚¯ãƒ«ã¯ã€å‘½ä»¤å–å‡ºã—ï¼ˆfetchï¼‰â†’å‘½ä»¤è§£èª­ï¼ˆdecodeï¼‰â†’å®Ÿè¡Œï¼ˆexecuteï¼‰ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå®Ÿè¡Œâ†’è§£èª­â†’å–å‡ºã—ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_04_02",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "åŽŸå‰‡ãƒ»é–¢ä¿‚"
  },
  {
    "id": "computer-02",
    "cat": "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿",
    "concept": "ã‚­ãƒ£ãƒƒã‚·ãƒ¥",
    "difficulty": "åŸºç¤Ž",
    "q": "CPUãŒä¸»è¨˜æ†¶ã‹ã‚‰ãƒ‡ãƒ¼ã‚¿ã‚’èª­ã‚€ãŸã³ã«å¾…ã¡æ™‚é–“ãŒç”Ÿã˜ã¦ã„ã‚‹ã€‚CPUã¨ä¸»è¨˜æ†¶ã®é–“ã«é«˜é€Ÿãªå°å®¹é‡ãƒ¡ãƒ¢ãƒªã‚’ç½®ãä¸»ãªç‹™ã„ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "è£œåŠ©è¨˜æ†¶è£…ç½®ã¸ä¿å­˜ã§ãã‚‹ãƒ‡ãƒ¼ã‚¿å®¹é‡ã‚’å¢—ã‚„ã™",
      "CPUã¨ä¸»è¨˜æ†¶ã®é€Ÿåº¦å·®ã«ã‚ˆã‚‹å¾…ã¡æ™‚é–“ã‚’æ¸›ã‚‰ã™",
      "ä¸»è¨˜æ†¶ã®å†…å®¹ã‚’é›»æºæ–­å¾Œã‚‚ä¿æŒã§ãã‚‹ã‚ˆã†ã«ã™ã‚‹",
      "CPUãŒå®Ÿè¡Œã§ãã‚‹å‘½ä»¤ã®ç¨®é¡žãã®ã‚‚ã®ã‚’å¢—ã‚„ã™"
    ],
    "a": 1,
    "exp": "ã‚­ãƒ£ãƒƒã‚·ãƒ¥ãƒ¡ãƒ¢ãƒªã¯ã€CPUãŒã‚ˆãä½¿ã†å‘½ä»¤ã‚„ãƒ‡ãƒ¼ã‚¿ã‚’é«˜é€Ÿã«å‚ç…§ã§ãã‚‹ã‚ˆã†ã«ã—ã€ä¸»è¨˜æ†¶ã¸ã®ã‚¢ã‚¯ã‚»ã‚¹å¾…ã¡ã‚’æ¸›ã‚‰ã—ã¾ã™ã€‚",
    "hint": "CPUã¯ä¸»è¨˜æ†¶ã‚ˆã‚Šé«˜é€Ÿã§ã™ã€‚ãã®é€Ÿåº¦å·®ã‚’åŸ‹ã‚ã‚‹ä»•çµ„ã¿ã‚’è€ƒãˆã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã‚­ãƒ£ãƒƒã‚·ãƒ¥ã¯CPUã¨ä¸»è¨˜æ†¶ã®é€Ÿåº¦å·®ã‚’ç·©å’Œã€ã€‚ã‚­ãƒ£ãƒƒã‚·ãƒ¥ãƒ¡ãƒ¢ãƒªã¯ã€CPUãŒã‚ˆãä½¿ã†å‘½ä»¤ã‚„ãƒ‡ãƒ¼ã‚¿ã‚’é«˜é€Ÿã«å‚ç…§ã§ãã‚‹ã‚ˆã†ã«ã—ã€ä¸»è¨˜æ†¶ã¸ã®ã‚¢ã‚¯ã‚»ã‚¹å¾…ã¡ã‚’æ¸›ã‚‰ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œè£œåŠ©è¨˜æ†¶è£…ç½®ã¸ä¿å­˜ã§ãã‚‹ãƒ‡ãƒ¼ã‚¿å®¹é‡ã‚’å¢—ã‚„ã™ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã‚­ãƒ£ãƒƒã‚·ãƒ¥ãƒ¡ãƒ¢ãƒªã¯ã€CPUãŒã‚ˆãä½¿ã†å‘½ä»¤ã‚„ãƒ‡ãƒ¼ã‚¿ã‚’é«˜é€Ÿã«å‚ç…§ã§ãã‚‹ã‚ˆã†ã«ã—ã€ä¸»è¨˜æ†¶ã¸ã®ã‚¢ã‚¯ã‚»ã‚¹å¾…ã¡ã‚’æ¸›ã‚‰ã—ã¾ã™ã€‚",
      "ã€Œä¸»è¨˜æ†¶ã€ã¯ã€å®Ÿè¡Œä¸­ã®ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã‚„ãƒ‡ãƒ¼ã‚¿ã‚’ç½®ãè¨˜æ†¶è£…ç½®ã§ã™ã€‚ä¸€èˆ¬ã«RAMã‚’ä½¿ã„ã¾ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€ŒCPUã€ã¯ã€å‘½ä»¤ã‚’å®Ÿè¡Œã—ã€è¨ˆç®—ã‚„åˆ¶å¾¡ã‚’è¡Œã†ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿ã®ä¸­å¿ƒçš„ãªå‡¦ç†è£…ç½®ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_04_03",
    "explainTopicSource": "semantic",
    "cognitiveRewrite": "v90-context",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "å½¹å‰²é¸æŠž"
  },
  {
    "id": "computer-03",
    "cat": "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿",
    "concept": "è¨˜æ†¶éšŽå±¤",
    "difficulty": "æ¨™æº–",
    "q": "ä¸€èˆ¬ã«ã€ã‚¢ã‚¯ã‚»ã‚¹é€Ÿåº¦ãŒé€Ÿã„é †ã¨ã—ã¦æœ€ã‚‚é©åˆ‡ãªã®ã¯ï¼Ÿ",
    "options": [
      "SSDâ†’ä¸»è¨˜æ†¶â†’ãƒ¬ã‚¸ã‚¹ã‚¿",
      "ä¸»è¨˜æ†¶â†’ã‚­ãƒ£ãƒƒã‚·ãƒ¥â†’ãƒ¬ã‚¸ã‚¹ã‚¿",
      "ãƒ¬ã‚¸ã‚¹ã‚¿â†’ã‚­ãƒ£ãƒƒã‚·ãƒ¥â†’ä¸»è¨˜æ†¶",
      "ã‚­ãƒ£ãƒƒã‚·ãƒ¥â†’SSDâ†’ãƒ¬ã‚¸ã‚¹ã‚¿"
    ],
    "a": 2,
    "exp": "CPUå†…éƒ¨ã®ãƒ¬ã‚¸ã‚¹ã‚¿ãŒæœ€ã‚‚é«˜é€Ÿã§ã€ãã®æ¬¡ã«ã‚­ãƒ£ãƒƒã‚·ãƒ¥ã€ä¸»è¨˜æ†¶ã¨ç¶šãã¾ã™ã€‚",
    "hint": "CPUã«è¿‘ã„ã»ã©é«˜é€Ÿã€ã¨è€ƒãˆã‚‹ã¨æ•´ç†ã—ã‚„ã™ã„ã§ã™ã€‚",
    "choiceExps": [
      "ã€Œãƒ¬ã‚¸ã‚¹ã‚¿ã€ã¯ã€CPUå†…éƒ¨ã«ã‚ã‚‹éžå¸¸ã«é«˜é€Ÿã§å°å®¹é‡ãªè¨˜æ†¶é ˜åŸŸã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œãƒ¬ã‚¸ã‚¹ã‚¿ã€ã¯ã€CPUå†…éƒ¨ã«ã‚ã‚‹éžå¸¸ã«é«˜é€Ÿã§å°å®¹é‡ãªè¨˜æ†¶é ˜åŸŸã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "CPUå†…éƒ¨ã®ãƒ¬ã‚¸ã‚¹ã‚¿ãŒæœ€ã‚‚é«˜é€Ÿã§ã€ãã®æ¬¡ã«ã‚­ãƒ£ãƒƒã‚·ãƒ¥ã€ä¸»è¨˜æ†¶ã¨ç¶šãã¾ã™ã€‚",
      "ã€Œãƒ¬ã‚¸ã‚¹ã‚¿ã€ã¯ã€CPUå†…éƒ¨ã«ã‚ã‚‹éžå¸¸ã«é«˜é€Ÿã§å°å®¹é‡ãªè¨˜æ†¶é ˜åŸŸã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_04_03",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "åŽŸå‰‡ãƒ»é–¢ä¿‚"
  },
  {
    "id": "computer-04",
    "cat": "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿",
    "concept": "å‰²è¾¼ã¿",
    "difficulty": "æ¨™æº–",
    "q": "ãƒ‡ã‚£ã‚¹ã‚¯è£…ç½®ãŒå‡¦ç†ã‚’çµ‚ãˆãŸæ™‚ã ã‘CPUã¸é€šçŸ¥ã—ã€CPUã¯é€šçŸ¥ã‚’å—ã‘ã‚‹ã¾ã§åˆ¥å‡¦ç†ã‚’é€²ã‚ãŸã„ã€‚ã“ã®ä»•çµ„ã¿ã«æœ€ã‚‚è¿‘ã„ã‚‚ã®ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ã‚­ãƒ£ãƒƒã‚·ãƒ¥",
      "ä»®æƒ³è¨˜æ†¶",
      "ã‚¹ãƒ—ãƒ¼ãƒªãƒ³ã‚°",
      "å‰²è¾¼ã¿"
    ],
    "a": 3,
    "exp": "å‰²è¾¼ã¿ã¯ã€å¤–éƒ¨ã‚¤ãƒ™ãƒ³ãƒˆãªã©ã«å¿œã˜ã¦CPUãŒç¾åœ¨ã®å‡¦ç†ã‚’ä¸€æ™‚ä¸­æ–­ã—ã€å‰²è¾¼ã¿å‡¦ç†ã¸ç§»ã‚‹ä»•çµ„ã¿ã§ã™ã€‚",
    "hint": "ã€Œä»Šã‚„ã£ã¦ã„ã‚‹å‡¦ç†ã«å‰²ã£ã¦å…¥ã‚‹ã€ã‚¤ãƒ¡ãƒ¼ã‚¸ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå‰²è¾¼ã¿ãŒç™ºç”Ÿã™ã‚‹ã¨é€šå¸¸å‡¦ç†ã‚’ä¸€æ™‚ä¸­æ–­ã—ã€å‰²è¾¼ã¿å‡¦ç†å¾Œã«æˆ»ã‚‹ã€ã€‚å‰²è¾¼ã¿ã¯ã€å¤–éƒ¨ã‚¤ãƒ™ãƒ³ãƒˆãªã©ã«å¿œã˜ã¦CPUãŒç¾åœ¨ã®å‡¦ç†ã‚’ä¸€æ™‚ä¸­æ–­ã—ã€å‰²è¾¼ã¿å‡¦ç†ã¸ç§»ã‚‹ä»•çµ„ã¿ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œã‚­ãƒ£ãƒƒã‚·ãƒ¥ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œä»®æƒ³è¨˜æ†¶ã€ã¯ã€ä¸»è¨˜æ†¶ã ã‘ã§ã¯è¶³ã‚Šãªã„ã¨ãã€è£œåŠ©è¨˜æ†¶ã®ä¸€éƒ¨ã‚‚ä½¿ã£ã¦å¤§ããªè¨˜æ†¶ç©ºé–“ãŒã‚ã‚‹ã‚ˆã†ã«è¦‹ã›ã‚‹ä»•çµ„ã¿ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå‰²è¾¼ã¿ãŒç™ºç”Ÿã™ã‚‹ã¨é€šå¸¸å‡¦ç†ã‚’ä¸€æ™‚ä¸­æ–­ã—ã€å‰²è¾¼ã¿å‡¦ç†å¾Œã«æˆ»ã‚‹ã€ã€‚å‰²è¾¼ã¿ã¯ã€å¤–éƒ¨ã‚¤ãƒ™ãƒ³ãƒˆãªã©ã«å¿œã˜ã¦CPUãŒç¾åœ¨ã®å‡¦ç†ã‚’ä¸€æ™‚ä¸­æ–­ã—ã€å‰²è¾¼ã¿å‡¦ç†ã¸ç§»ã‚‹ä»•çµ„ã¿ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œã‚¹ãƒ—ãƒ¼ãƒªãƒ³ã‚°ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "å‰²è¾¼ã¿ã¯ã€å¤–éƒ¨ã‚¤ãƒ™ãƒ³ãƒˆãªã©ã«å¿œã˜ã¦CPUãŒç¾åœ¨ã®å‡¦ç†ã‚’ä¸€æ™‚ä¸­æ–­ã—ã€å‰²è¾¼ã¿å‡¦ç†ã¸ç§»ã‚‹ä»•çµ„ã¿ã§ã™ã€‚"
    ],
    "explainTopicId": "core_04_02",
    "explainTopicSource": "manual",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "db-01",
    "cat": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹",
    "concept": "ä¸»ã‚­ãƒ¼",
    "difficulty": "åŸºç¤Ž",
    "q": "ç¤¾å“¡è¡¨ã§ã€åŒå§“åŒåãŒã„ã¦ã‚‚å„è¡Œã‚’å¿…ãšä¸€æ„ã«ç‰¹å®šã§ãã‚‹ç¤¾å“¡ç•ªå·ã‚’è¨­å®šã—ãŸã„ã€‚ã“ã®ç¤¾å“¡ç•ªå·ã®å½¹å‰²ã«æœ€ã‚‚è¿‘ã„ã‚‚ã®ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ä¸»ã‚­ãƒ¼",
      "ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹",
      "å¤–éƒ¨ã‚­ãƒ¼",
      "ãƒ“ãƒ¥ãƒ¼"
    ],
    "a": 0,
    "exp": "ä¸»ã‚­ãƒ¼ã¯å„è¡Œï¼ˆãƒ¬ã‚³ãƒ¼ãƒ‰ï¼‰ã‚’ä¸€æ„ã«è­˜åˆ¥ã™ã‚‹ãŸã‚ã®å±žæ€§ã¾ãŸã¯å±žæ€§ã®çµ„ã§ã™ã€‚",
    "hint": "ã€Œã“ã®1è¡Œã¯èª°ï¼Ÿã€ã‚’ä¸€æ„ã«æ±ºã‚ã‚‹ã‚­ãƒ¼ã§ã™ã€‚",
    "choiceExps": [
      "ä¸»ã‚­ãƒ¼ã¯å„è¡Œï¼ˆãƒ¬ã‚³ãƒ¼ãƒ‰ï¼‰ã‚’ä¸€æ„ã«è­˜åˆ¥ã™ã‚‹ãŸã‚ã®å±žæ€§ã¾ãŸã¯å±žæ€§ã®çµ„ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¸»ã‚­ãƒ¼ã¯è¡Œã‚’ä¸€æ„ã«è­˜åˆ¥ã€ã€‚ä¸»ã‚­ãƒ¼ã¯å„è¡Œï¼ˆãƒ¬ã‚³ãƒ¼ãƒ‰ï¼‰ã‚’ä¸€æ„ã«è­˜åˆ¥ã™ã‚‹ãŸã‚ã®å±žæ€§ã¾ãŸã¯å±žæ€§ã®çµ„ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œå¤–éƒ¨ã‚­ãƒ¼ã€ã¯ã€åˆ¥ã®è¡¨ã®ä¸»ã‚­ãƒ¼ãªã©ã‚’å‚ç…§ã—ã€è¡¨åŒå£«ã‚’é–¢é€£ä»˜ã‘ã‚‹ãŸã‚ã®åˆ—ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¸»ã‚­ãƒ¼ã¯è¡Œã‚’ä¸€æ„ã«è­˜åˆ¥ã€ã€‚ä¸»ã‚­ãƒ¼ã¯å„è¡Œï¼ˆãƒ¬ã‚³ãƒ¼ãƒ‰ï¼‰ã‚’ä¸€æ„ã«è­˜åˆ¥ã™ã‚‹ãŸã‚ã®å±žæ€§ã¾ãŸã¯å±žæ€§ã®çµ„ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒ“ãƒ¥ãƒ¼ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_09_02",
    "explainTopicSource": "semantic",
    "cognitiveRewrite": "v90-context",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "å½¹å‰²é¸æŠž"
  },
  {
    "id": "db-02",
    "cat": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹",
    "concept": "SQL",
    "difficulty": "åŸºç¤Ž",
    "q": "çµ¦ä¸Žè¡¨employeeã‹ã‚‰ã€salaryãŒ300000ä»¥ä¸Šã®ç¤¾å“¡ã ã‘ã‚’æŠ½å‡ºã—ãŸã„ã€‚å¢ƒç•Œå€¤300000ã‚‚çµæžœã¸å«ã‚ã‚‹WHEREå¥ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "WHERE salary <= 300000",
      "WHERE salary >= 300000",
      "WHERE salary = 300000",
      "WHERE salary <> 300000"
    ],
    "a": 1,
    "exp": "ã€Œ300000ä»¥ä¸Šã€ã¯300000ã‚’å«ã¿ã€ãã‚Œã‚ˆã‚Šå¤§ãã„å€¤ã‚‚å¯¾è±¡ãªã®ã§ã€WHERE salary >= 300000 ã¨ã—ã¾ã™ã€‚",
    "hint": "ã€Œä»¥ä¸Šã€ã¯å¢ƒç•Œå€¤ã‚’å«ã‚€ã®ã§ >= ã‚’ä½¿ã„ã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¾‹ï¼šéƒ¨ç½²åˆ¥å¹³å‡çµ¦ä¸Žã§å¹³å‡30ä¸‡å††ä»¥ä¸Š â†’ GROUP BY éƒ¨ç½²ã€HAVING AVG(çµ¦ä¸Ž)>=300000ã€ã€‚ã€Œ300000ä»¥ä¸Šã€ã¯300000ã‚’å«ã¿ã€ãã‚Œã‚ˆã‚Šå¤§ãã„å€¤ã‚‚å¯¾è±¡ãªã®ã§ã€WHERE salary >= 300000 ã¨ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒWHERE salary <= 300000ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œ300000ä»¥ä¸Šã€ã¯300000ã‚’å«ã¿ã€ãã‚Œã‚ˆã‚Šå¤§ãã„å€¤ã‚‚å¯¾è±¡ãªã®ã§ã€WHERE salary >= 300000 ã¨ã—ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¾‹ï¼šéƒ¨ç½²åˆ¥å¹³å‡çµ¦ä¸Žã§å¹³å‡30ä¸‡å††ä»¥ä¸Š â†’ GROUP BY éƒ¨ç½²ã€HAVING AVG(çµ¦ä¸Ž)>=300000ã€ã€‚ã€Œ300000ä»¥ä¸Šã€ã¯300000ã‚’å«ã¿ã€ãã‚Œã‚ˆã‚Šå¤§ãã„å€¤ã‚‚å¯¾è±¡ãªã®ã§ã€WHERE salary >= 300000 ã¨ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒWHERE salary = 300000ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¾‹ï¼šéƒ¨ç½²åˆ¥å¹³å‡çµ¦ä¸Žã§å¹³å‡30ä¸‡å††ä»¥ä¸Š â†’ GROUP BY éƒ¨ç½²ã€HAVING AVG(çµ¦ä¸Ž)>=300000ã€ã€‚ã€Œ300000ä»¥ä¸Šã€ã¯300000ã‚’å«ã¿ã€ãã‚Œã‚ˆã‚Šå¤§ãã„å€¤ã‚‚å¯¾è±¡ãªã®ã§ã€WHERE salary >= 300000 ã¨ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒWHERE salary <> 300000ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_09_07",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "db-03",
    "cat": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹",
    "concept": "æ­£è¦åŒ–",
    "difficulty": "æ¨™æº–",
    "q": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹ã®æ­£è¦åŒ–ã‚’è¡Œã†ä¸»ãªç›®çš„ã¨ã—ã¦æœ€ã‚‚é©åˆ‡ãªã®ã¯ï¼Ÿ",
    "options": [
      "æ¤œç´¢æ€§èƒ½ã‚’æ”¹å–„ã™ã‚‹ãŸã‚ã€æ­£è¦åŒ–ã®å„æ®µéšŽã§ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹æ§‹æˆã‚’è¦‹ç›´ã™",
      "è¡¨ã®ãƒ‡ãƒ¼ã‚¿ã‚’æš—å·åŒ–ã—ã¦ç¬¬ä¸‰è€…ã‹ã‚‰èª­ã‚ãªãã™ã‚‹",
      "ãƒ‡ãƒ¼ã‚¿ã®é‡è¤‡ã‚’æŠ‘ãˆã€æ›´æ–°æ™‚ã®ä¸æ•´åˆã‚’èµ·ã“ã—ã«ããã™ã‚‹",
      "æ›´æ–°å‡¦ç†ã‚’å˜ç´”åŒ–ã™ã‚‹ãŸã‚ã€é–¢é€£ãƒ‡ãƒ¼ã‚¿ã‚’ä¸€ã¤ã®è¡¨ã¸é›†ç´„ã™ã‚‹"
    ],
    "a": 2,
    "exp": "æ­£è¦åŒ–ã¯ã€ãƒ‡ãƒ¼ã‚¿ã®é‡è¤‡ã‚’æ¸›ã‚‰ã—ã€è¿½åŠ ãƒ»æ›´æ–°ãƒ»å‰Šé™¤æ™‚ã®ä¸æ•´åˆï¼ˆæ›´æ–°ç•°å¸¸ï¼‰ã‚’èµ·ã“ã—ã«ããã™ã‚‹ãŸã‚ã«è¡Œã„ã¾ã™ã€‚",
    "hint": "åŒã˜äº‹å®Ÿã‚’è¤‡æ•°ç®‡æ‰€ã«é‡è¤‡ã—ã¦æŒã¤ã¨ã€æ›´æ–°æ¼ã‚ŒãŒèµ·ãã‚„ã™ããªã‚Šã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹è¨­è¨ˆã§ã¯æ¦‚å¿µãƒ¢ãƒ‡ãƒ«ã‹ã‚‰è¡¨æ§‹é€ ã¸è½ã¨ã—è¾¼ã¿ã€æ­£è¦åŒ–ã§æ›´æ–°æ™‚ã®çŸ›ç›¾ã‚„é‡è¤‡ã‚’æ¸›ã‚‰ã—ã¾ã™ã€ã€‚ã“ã®ãŸã‚ã€Œæ¤œç´¢æ€§èƒ½ã‚’æ”¹å–„ã™ã‚‹ãŸã‚ã€æ­£è¦åŒ–ã®å„æ®µéšŽã§ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹æ§‹æˆã‚’è¦‹ç›´ã™ã€ã®ã‚ˆã†ã«æ–­å®šã™ã‚‹ã¨ã€å•é¡Œã®æ¡ä»¶ãƒ»å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹è¨­è¨ˆã§ã¯æ¦‚å¿µãƒ¢ãƒ‡ãƒ«ã‹ã‚‰è¡¨æ§‹é€ ã¸è½ã¨ã—è¾¼ã¿ã€æ­£è¦åŒ–ã§æ›´æ–°æ™‚ã®çŸ›ç›¾ã‚„é‡è¤‡ã‚’æ¸›ã‚‰ã—ã¾ã™ã€ã€‚æ­£è¦åŒ–ã¯ã€ãƒ‡ãƒ¼ã‚¿ã®é‡è¤‡ã‚’æ¸›ã‚‰ã—ã€è¿½åŠ ãƒ»æ›´æ–°ãƒ»å‰Šé™¤æ™‚ã®ä¸æ•´åˆï¼ˆæ›´æ–°ç•°å¸¸ï¼‰ã‚’èµ·ã“ã—ã«ããã™ã‚‹ãŸã‚ã«è¡Œã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œè¡¨ã®ãƒ‡ãƒ¼ã‚¿ã‚’æš—å·åŒ–ã—ã¦ç¬¬ä¸‰è€…ã‹ã‚‰èª­ã‚ãªãã™ã‚‹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "æ­£è¦åŒ–ã¯ã€ãƒ‡ãƒ¼ã‚¿ã®é‡è¤‡ã‚’æ¸›ã‚‰ã—ã€è¿½åŠ ãƒ»æ›´æ–°ãƒ»å‰Šé™¤æ™‚ã®ä¸æ•´åˆï¼ˆæ›´æ–°ç•°å¸¸ï¼‰ã‚’èµ·ã“ã—ã«ããã™ã‚‹ãŸã‚ã«è¡Œã„ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹è¨­è¨ˆã§ã¯æ¦‚å¿µãƒ¢ãƒ‡ãƒ«ã‹ã‚‰è¡¨æ§‹é€ ã¸è½ã¨ã—è¾¼ã¿ã€æ­£è¦åŒ–ã§æ›´æ–°æ™‚ã®çŸ›ç›¾ã‚„é‡è¤‡ã‚’æ¸›ã‚‰ã—ã¾ã™ã€ã€‚ã“ã®ãŸã‚ã€Œæ›´æ–°å‡¦ç†ã‚’å˜ç´”åŒ–ã™ã‚‹ãŸã‚ã€é–¢é€£ãƒ‡ãƒ¼ã‚¿ã‚’ä¸€ã¤ã®è¡¨ã¸é›†ç´„ã™ã‚‹ã€ã®ã‚ˆã†ã«æ–­å®šã™ã‚‹ã¨ã€å•é¡Œã®æ¡ä»¶ãƒ»å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_09_03",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "åŽŸå‰‡ãƒ»é–¢ä¿‚"
  },
  {
    "id": "db-04",
    "cat": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹",
    "concept": "ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³",
    "difficulty": "æ¨™æº–",
    "q": "éŠ€è¡ŒæŒ¯è¾¼ã§ã€ŒAå£åº§ã‹ã‚‰æ¸›é¡ã€ã¨ã€ŒBå£åº§ã¸åŠ ç®—ã€ã‚’ä¸€ä½“ã¨ã—ã¦æ‰±ã„ã€é€”ä¸­å¤±æ•—æ™‚ã¯ä¸¡æ–¹å–ã‚Šæ¶ˆã—ãŸã„ã€‚ã“ã®æ€§è³ªã«æœ€ã‚‚é–¢ä¿‚ã™ã‚‹ã‚‚ã®ã¯ï¼Ÿ",
    "options": [
      "è€ä¹…æ€§",
      "ä¸€è²«æ€§",
      "ç‹¬ç«‹æ€§",
      "åŽŸå­æ€§"
    ],
    "a": 3,
    "exp": "åŽŸå­æ€§ï¼ˆAtomicityï¼‰ã¯ã€ä¸€é€£ã®å‡¦ç†ã‚’ã€Œå…¨ã¦å®Ÿè¡Œã™ã‚‹ã€ã‹ã€Œå…¨ã¦å–ã‚Šæ¶ˆã™ã€ã‹ã®ã©ã¡ã‚‰ã‹ã¨ã—ã¦æ‰±ã†æ€§è³ªã§ã™ã€‚",
    "hint": "ACIDç‰¹æ€§ã®ã†ã¡ã€Œå…¨éƒ¨ã‹ã€ä½•ã‚‚ã—ãªã„ã‹ã€ã«å¯¾å¿œã™ã‚‹æ€§è³ªã§ã™ã€‚",
    "choiceExps": [
      "ã€ŒåŽŸå­æ€§ã€ã¯å…¨éƒ¨æˆåŠŸã‹å…¨éƒ¨å¤±æ•—ã€‚é€”ä¸­ã ã‘ç¢ºå®šã•ã›ãªã„ã€‚ä¸€æ–¹ã€Œè€ä¹…æ€§ã€ã¯COMMITå¾Œã®çµæžœãŒéšœå®³å¾Œã‚‚ä¿æŒã•ã‚Œã‚‹ã€‚ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹ã®ã¯å‰è€…ã§ã‚ã‚‹ã€‚",
      "ã€ŒåŽŸå­æ€§ã€ã¯å…¨éƒ¨æˆåŠŸã‹å…¨éƒ¨å¤±æ•—ã€‚é€”ä¸­ã ã‘ç¢ºå®šã•ã›ãªã„ã€‚ä¸€æ–¹ã€Œä¸€è²«æ€§ã€ã¯å‡¦ç†å‰å¾Œã§DBã®æ•´åˆæ€§åˆ¶ç´„ã‚’å®ˆã‚‹ã€‚ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹ã®ã¯å‰è€…ã§ã‚ã‚‹ã€‚",
      "ã€ŒåŽŸå­æ€§ã€ã¯å…¨éƒ¨æˆåŠŸã‹å…¨éƒ¨å¤±æ•—ã€‚é€”ä¸­ã ã‘ç¢ºå®šã•ã›ãªã„ã€‚ä¸€æ–¹ã€Œç‹¬ç«‹æ€§ã€ã¯åŒæ™‚å®Ÿè¡Œå‡¦ç†ãŒäº’ã„ã¸ä¸é©åˆ‡ã«å½±éŸ¿ã—ãªã„ã€‚ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹ã®ã¯å‰è€…ã§ã‚ã‚‹ã€‚",
      "åŽŸå­æ€§ï¼ˆAtomicityï¼‰ã¯ã€ä¸€é€£ã®å‡¦ç†ã‚’ã€Œå…¨ã¦å®Ÿè¡Œã™ã‚‹ã€ã‹ã€Œå…¨ã¦å–ã‚Šæ¶ˆã™ã€ã‹ã®ã©ã¡ã‚‰ã‹ã¨ã—ã¦æ‰±ã†æ€§è³ªã§ã™ã€‚"
    ],
    "explainTopicId": "core_09_05",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "è¤‡æ•°æ¡ä»¶"
  },
  {
    "id": "net-01",
    "cat": "ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯",
    "concept": "IPã‚¢ãƒ‰ãƒ¬ã‚¹",
    "difficulty": "åŸºç¤Ž",
    "q": "ç¤¾å†…PCã§ã¯192.168.1.20ã‚’ä½¿ã„ã€ã‚¤ãƒ³ã‚¿ãƒ¼ãƒãƒƒãƒˆæŽ¥ç¶šæ™‚ã¯ãƒ«ãƒ¼ã‚¿ã§ã‚¢ãƒ‰ãƒ¬ã‚¹å¤‰æ›ã—ã¦ã„ã‚‹ã€‚ã“ã®ç¤¾å†…PCã®IPv4ã‚¢ãƒ‰ãƒ¬ã‚¹ã®ç¨®é¡žã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆIPã‚¢ãƒ‰ãƒ¬ã‚¹",
      "ã‚°ãƒ­ãƒ¼ãƒãƒ«IPã‚¢ãƒ‰ãƒ¬ã‚¹",
      "ãƒ«ãƒ¼ãƒ—ãƒãƒƒã‚¯ã‚¢ãƒ‰ãƒ¬ã‚¹",
      "ãƒªãƒ³ã‚¯ãƒ­ãƒ¼ã‚«ãƒ«ã‚¢ãƒ‰ãƒ¬ã‚¹"
    ],
    "a": 0,
    "exp": "ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆIPã‚¢ãƒ‰ãƒ¬ã‚¹ã¯çµ„ç¹”å†…ãªã©ã§åˆ©ç”¨ã•ã‚Œã€ã‚¤ãƒ³ã‚¿ãƒ¼ãƒãƒƒãƒˆã¸å‡ºã‚‹éš›ã«ã¯ä¸€èˆ¬ã«NAT/NAPTãªã©ã§å¤‰æ›ã—ã¾ã™ã€‚",
    "hint": "å®¶åº­ã‚„ç¤¾å†…LANã§ä½¿ã„ã€å¤–éƒ¨ã¸å‡ºã‚‹éš›ã«ã‚¢ãƒ‰ãƒ¬ã‚¹å¤‰æ›ã™ã‚‹ã“ã¨ãŒå¤šã„ã‚¢ãƒ‰ãƒ¬ã‚¹ã§ã™ã€‚",
    "choiceExps": [
      "ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆIPã‚¢ãƒ‰ãƒ¬ã‚¹ã¯çµ„ç¹”å†…ãªã©ã§åˆ©ç”¨ã•ã‚Œã€ã‚¤ãƒ³ã‚¿ãƒ¼ãƒãƒƒãƒˆã¸å‡ºã‚‹éš›ã«ã¯ä¸€èˆ¬ã«NAT/NAPTãªã©ã§å¤‰æ›ã—ã¾ã™ã€‚",
      "ã€ŒIPã‚¢ãƒ‰ãƒ¬ã‚¹ã€ã¯ã€ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ä¸Šã®æ©Ÿå™¨ã‚’è­˜åˆ¥ã™ã‚‹ãŸã‚ã®ç•ªå·ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã‚°ãƒ­ãƒ¼ãƒãƒ«IPã‚¢ãƒ‰ãƒ¬ã‚¹ã¯ã‚¤ãƒ³ã‚¿ãƒ¼ãƒãƒƒãƒˆä¸Šã§é‡è¤‡ã—ãªã„ä½æ‰€ã€ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆIPã‚¢ãƒ‰ãƒ¬ã‚¹ã¯å®¶åº­ã‚„ç¤¾å†…ãªã©é–‰ã˜ãŸãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯å†…ã§ä½¿ã†ä½æ‰€ã§ã™ã€‚NATã‚„NAPTãŒä¸¡è€…ã®æ©‹æ¸¡ã—ã‚’ã—ã¾ã™ã€ã€‚ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆIPã‚¢ãƒ‰ãƒ¬ã‚¹ã¯çµ„ç¹”å†…ãªã©ã§åˆ©ç”¨ã•ã‚Œã€ã‚¤ãƒ³ã‚¿ãƒ¼ãƒãƒƒãƒˆã¸å‡ºã‚‹éš›ã«ã¯ä¸€èˆ¬ã«NAT/NAPTãªã©ã§å¤‰æ›ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒ«ãƒ¼ãƒ—ãƒãƒƒã‚¯ã‚¢ãƒ‰ãƒ¬ã‚¹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã‚°ãƒ­ãƒ¼ãƒãƒ«IPã‚¢ãƒ‰ãƒ¬ã‚¹ã¯ã‚¤ãƒ³ã‚¿ãƒ¼ãƒãƒƒãƒˆä¸Šã§é‡è¤‡ã—ãªã„ä½æ‰€ã€ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆIPã‚¢ãƒ‰ãƒ¬ã‚¹ã¯å®¶åº­ã‚„ç¤¾å†…ãªã©é–‰ã˜ãŸãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯å†…ã§ä½¿ã†ä½æ‰€ã§ã™ã€‚NATã‚„NAPTãŒä¸¡è€…ã®æ©‹æ¸¡ã—ã‚’ã—ã¾ã™ã€ã€‚ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆIPã‚¢ãƒ‰ãƒ¬ã‚¹ã¯çµ„ç¹”å†…ãªã©ã§åˆ©ç”¨ã•ã‚Œã€ã‚¤ãƒ³ã‚¿ãƒ¼ãƒãƒƒãƒˆã¸å‡ºã‚‹éš›ã«ã¯ä¸€èˆ¬ã«NAT/NAPTãªã©ã§å¤‰æ›ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒªãƒ³ã‚¯ãƒ­ãƒ¼ã‚«ãƒ«ã‚¢ãƒ‰ãƒ¬ã‚¹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_10_05",
    "explainTopicSource": "semantic",
    "cognitiveRewrite": "v90-context",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "å½¹å‰²é¸æŠž"
  },
  {
    "id": "net-02",
    "cat": "ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯",
    "concept": "DNS",
    "difficulty": "åŸºç¤Ž",
    "q": "åˆ©ç”¨è€…ãŒãƒ–ãƒ©ã‚¦ã‚¶ã¸ example.com ã¨å…¥åŠ›ã—ãŸã€‚é€šä¿¡å…ˆã‚µãƒ¼ãƒã®IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’èª¿ã¹ã‚‹ãŸã‚ã«ä½¿ã‚ã‚Œã‚‹ä»•çµ„ã¿ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ARP",
      "DNS",
      "NAT",
      "DHCP"
    ],
    "a": 1,
    "exp": "DNSã¯ã€ãƒ‰ãƒ¡ã‚¤ãƒ³åã¨IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å¯¾å¿œä»˜ã‘ã‚‹ä»•çµ„ã¿ã§ã™ã€‚åå‰è§£æ±ºã«ã‚ˆã£ã¦example.comã®ã‚ˆã†ãªåå‰ã‹ã‚‰IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å¾—ã‚‰ã‚Œã¾ã™ã€‚",
    "hint": "ã€Œåå‰è§£æ±ºã€ã‚’è¡Œã†ä»•çµ„ã¿ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œwww.example.comã®åå‰è§£æ±ºã§DNSã‹ã‚‰IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å¾—ã¾ã™ã€ã€‚DNSã¯ã€ãƒ‰ãƒ¡ã‚¤ãƒ³åã¨IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å¯¾å¿œä»˜ã‘ã‚‹ä»•çµ„ã¿ã§ã™ã€‚åå‰è§£æ±ºã«ã‚ˆã£ã¦example.comã®ã‚ˆã†ãªåå‰ã‹ã‚‰IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å¾—ã‚‰ã‚Œã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒARPã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "DNSã¯ã€ãƒ‰ãƒ¡ã‚¤ãƒ³åã¨IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å¯¾å¿œä»˜ã‘ã‚‹ä»•çµ„ã¿ã§ã™ã€‚åå‰è§£æ±ºã«ã‚ˆã£ã¦example.comã®ã‚ˆã†ãªåå‰ã‹ã‚‰IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å¾—ã‚‰ã‚Œã¾ã™ã€‚",
      "ã€ŒNATã€ã¯ã€ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆIPã‚¢ãƒ‰ãƒ¬ã‚¹ã¨ã‚°ãƒ­ãƒ¼ãƒãƒ«IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å¤‰æ›ã™ã‚‹ä»•çµ„ã¿ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œwww.example.comã®åå‰è§£æ±ºã§DNSã‹ã‚‰IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å¾—ã¾ã™ã€ã€‚DNSã¯ã€ãƒ‰ãƒ¡ã‚¤ãƒ³åã¨IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å¯¾å¿œä»˜ã‘ã‚‹ä»•çµ„ã¿ã§ã™ã€‚åå‰è§£æ±ºã«ã‚ˆã£ã¦example.comã®ã‚ˆã†ãªåå‰ã‹ã‚‰IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å¾—ã‚‰ã‚Œã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒDHCPã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_10_06",
    "explainTopicSource": "semantic",
    "cognitiveRewrite": "v90-context",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "å½¹å‰²é¸æŠž"
  },
  {
    "id": "net-03",
    "cat": "ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯",
    "concept": "ã‚µãƒ–ãƒãƒƒãƒˆ",
    "difficulty": "æ¨™æº–",
    "q": "IPv4ã‚¢ãƒ‰ãƒ¬ã‚¹ 192.168.10.25/24 ã®ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã‚¢ãƒ‰ãƒ¬ã‚¹ã¯ï¼Ÿ",
    "options": [
      "192.168.10.255",
      "192.168.10.24",
      "192.168.10.0",
      "192.168.0.0"
    ],
    "a": 2,
    "exp": "/24ã§ã¯å…ˆé ­24ãƒ“ãƒƒãƒˆãŒãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯éƒ¨ã§ã™ã€‚æœ€å¾Œã®8ãƒ“ãƒƒãƒˆã‚’0ã«ã™ã‚‹ã¨192.168.10.0ã§ã™ã€‚",
    "hint": "/24ã¯ 255.255.255.0 ã¨åŒã˜æ„å‘³ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ192.168.1.130/26ã®ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã¯192.168.1.128ã§ã™ã€ã€‚/24ã§ã¯å…ˆé ­24ãƒ“ãƒƒãƒˆãŒãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯éƒ¨ã§ã™ã€‚æœ€å¾Œã®8ãƒ“ãƒƒãƒˆã‚’0ã«ã™ã‚‹ã¨192.168.10.0ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ192.168.10.255ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ192.168.1.130/26ã®ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã¯192.168.1.128ã§ã™ã€ã€‚/24ã§ã¯å…ˆé ­24ãƒ“ãƒƒãƒˆãŒãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯éƒ¨ã§ã™ã€‚æœ€å¾Œã®8ãƒ“ãƒƒãƒˆã‚’0ã«ã™ã‚‹ã¨192.168.10.0ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ192.168.10.24ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "/24ã§ã¯å…ˆé ­24ãƒ“ãƒƒãƒˆãŒãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯éƒ¨ã§ã™ã€‚æœ€å¾Œã®8ãƒ“ãƒƒãƒˆã‚’0ã«ã™ã‚‹ã¨192.168.10.0ã§ã™ã€‚",
      "ã“ã®å†…å®¹ã¯ã€Œã‚°ãƒ­ãƒ¼ãƒãƒ«IPã‚¢ãƒ‰ãƒ¬ã‚¹ã¨ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆIPã‚¢ãƒ‰ãƒ¬ã‚¹ã€ã§æ‰±ã†äº‹é …ã«å½“ãŸã‚‹ã€‚ã€Œã‚µãƒ–ãƒãƒƒãƒˆã€ã§å•ã‚ã‚Œã¦ã„ã‚‹å†…å®¹ã¨ã¯è«–ç‚¹ãŒç•°ãªã‚‹ã€‚"
    ],
    "explainTopicId": "core_10_04",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "net-04",
    "cat": "ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯",
    "concept": "TCP/UDP",
    "difficulty": "æ¨™æº–",
    "q": "åˆ°é”ç¢ºèªã‚„å†é€åˆ¶å¾¡ã‚’è¡Œã„ã€ä¿¡é ¼æ€§ã®é«˜ã„é€šä¿¡ã‚’æä¾›ã™ã‚‹ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã¯ï¼Ÿ",
    "options": [
      "UDP",
      "ARP",
      "ICMP",
      "TCP"
    ],
    "a": 3,
    "exp": "TCPã¯ã‚³ãƒã‚¯ã‚·ãƒ§ãƒ³åž‹ã§ã€é †åºåˆ¶å¾¡ãƒ»å†é€åˆ¶å¾¡ãªã©ã«ã‚ˆã‚Šä¿¡é ¼æ€§ã‚’ç¢ºä¿ã—ã¾ã™ã€‚",
    "hint": "Webã‚„ãƒ¡ãƒ¼ãƒ«ãªã©ã€å¤šãã®ç”¨é€”ã§ã€Œç¢ºå®Ÿã«å±Šã‘ãŸã„ã€ã¨ãã«ä½¿ã‚ã‚Œã¾ã™ã€‚",
    "choiceExps": [
      "ã€ŒUDPã€ã¯ã€å†é€ãªã©ã‚’ç°¡ç•¥åŒ–ã—ã€é€Ÿåº¦ã‚„ãƒªã‚¢ãƒ«ã‚¿ã‚¤ãƒ æ€§ã‚’é‡è¦–ã™ã‚‹é€šä¿¡æ–¹å¼ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€ŒTCPã€ã¯åˆ°é”ç¢ºèªãƒ»é †åºåˆ¶å¾¡ãƒ»å†é€ã‚ã‚Šã€‚ä¿¡é ¼æ€§é‡è¦–ã€‚ä¸€æ–¹ã€ŒARã€ã¯ç¾å®Ÿã®æ˜ åƒãƒ»ç©ºé–“ã¸ãƒ‡ã‚¸ã‚¿ãƒ«æƒ…å ±ã‚’é‡ã­ã‚‹ã€‚ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹ã®ã¯å‰è€…ã§ã‚ã‚‹ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒTCPã¯ä¿¡é ¼æ€§ã‚ã‚‹è»¢é€ã€ã€‚TCPã¯ã‚³ãƒã‚¯ã‚·ãƒ§ãƒ³åž‹ã§ã€é †åºåˆ¶å¾¡ãƒ»å†é€åˆ¶å¾¡ãªã©ã«ã‚ˆã‚Šä¿¡é ¼æ€§ã‚’ç¢ºä¿ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒICMPã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "TCPã¯ã‚³ãƒã‚¯ã‚·ãƒ§ãƒ³åž‹ã§ã€é †åºåˆ¶å¾¡ãƒ»å†é€åˆ¶å¾¡ãªã©ã«ã‚ˆã‚Šä¿¡é ¼æ€§ã‚’ç¢ºä¿ã—ã¾ã™ã€‚"
    ],
    "explainTopicId": "core_10_07",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "sec-01",
    "cat": "ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£",
    "concept": "ãƒãƒƒã‚·ãƒ¥",
    "difficulty": "åŸºç¤Ž",
    "q": "å…¥åŠ›ãƒ‡ãƒ¼ã‚¿ã‹ã‚‰å›ºå®šé•·ã®å€¤ã‚’ç”Ÿæˆã—ã€æ”¹ã–ã‚“æ¤œçŸ¥ãªã©ã«åˆ©ç”¨ã•ã‚Œã‚‹ã‚‚ã®ã¯ï¼Ÿ",
    "options": [
      "ãƒãƒƒã‚·ãƒ¥é–¢æ•°",
      "å…¬é–‹éµæš—å·æ–¹å¼",
      "ãƒ‡ã‚¸ã‚¿ãƒ«ç½²å",
      "å…±é€šéµæš—å·æ–¹å¼"
    ],
    "a": 0,
    "exp": "ãƒãƒƒã‚·ãƒ¥é–¢æ•°ã¯å…¥åŠ›ãƒ‡ãƒ¼ã‚¿ã‹ã‚‰å›ºå®šé•·ã®ãƒãƒƒã‚·ãƒ¥å€¤ã‚’ç”Ÿæˆã—ã¾ã™ã€‚å…ƒãƒ‡ãƒ¼ã‚¿ãŒå¤‰åŒ–ã™ã‚‹ã¨é€šå¸¸ãƒãƒƒã‚·ãƒ¥å€¤ã‚‚å¤‰åŒ–ã™ã‚‹ãŸã‚ã€æ”¹ã–ã‚“æ¤œçŸ¥ãªã©ã«åˆ©ç”¨ã§ãã¾ã™ã€‚",
    "hint": "å…ƒãƒ‡ãƒ¼ã‚¿ã‚’å¾©å·ã™ã‚‹ãŸã‚ã§ã¯ãªãã€ãƒ‡ãƒ¼ã‚¿ã®ã€ŒæŒ‡ç´‹ã€ã‚’ä½œã‚‹å‡¦ç†ã§ã™ã€‚",
    "choiceExps": [
      "ãƒãƒƒã‚·ãƒ¥é–¢æ•°ã¯å…¥åŠ›ãƒ‡ãƒ¼ã‚¿ã‹ã‚‰å›ºå®šé•·ã®ãƒãƒƒã‚·ãƒ¥å€¤ã‚’ç”Ÿæˆã—ã¾ã™ã€‚å…ƒãƒ‡ãƒ¼ã‚¿ãŒå¤‰åŒ–ã™ã‚‹ã¨é€šå¸¸ãƒãƒƒã‚·ãƒ¥å€¤ã‚‚å¤‰åŒ–ã™ã‚‹ãŸã‚ã€æ”¹ã–ã‚“æ¤œçŸ¥ãªã©ã«åˆ©ç”¨ã§ãã¾ã™ã€‚",
      "ã€Œå…¬é–‹éµæš—å·ã€ã¯ã€å…¬é–‹éµã¨ç§˜å¯†éµã®2æœ¬ã‚’ä½¿ã†æ–¹å¼ã§ã™ã€‚éµé…é€ã‚„èªè¨¼ã«åˆ©ç”¨ã•ã‚Œã¾ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œãƒ‡ã‚¸ã‚¿ãƒ«ç½²åã€ã¯ã€ç§˜å¯†éµã§ç½²åã—ã€å¯¾å¿œã™ã‚‹å…¬é–‹éµã§ç¢ºèªã™ã‚‹ã“ã¨ã§ã€ä½œæˆè€…ã¨æ”¹ã–ã‚“ã®æœ‰ç„¡ã‚’ç¢ºèªã™ã‚‹ä»•çµ„ã¿ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œå…±é€šéµæš—å·ã€ã¯ã€æš—å·åŒ–ã¨å¾©å·ã«åŒã˜ç§˜å¯†éµã‚’ä½¿ã†æ–¹å¼ã§ã™ã€‚é«˜é€Ÿã§ã™ãŒéµé…é€ãŒèª²é¡Œã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_11_03",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "sec-02",
    "cat": "ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£",
    "concept": "å…¬é–‹éµæš—å·",
    "difficulty": "æ¨™æº–",
    "q": "é€ä¿¡è€…ãŒå—ä¿¡è€…ã¸æ©Ÿå¯†æ–‡æ›¸ã‚’é€ã‚ŠãŸã„ã€‚å—ä¿¡è€…æœ¬äººã ã‘ãŒå¾©å·ã§ãã‚‹ã‚ˆã†å…¬é–‹éµæš—å·æ–¹å¼ã§æš—å·åŒ–ã™ã‚‹å ´åˆã€é€ä¿¡è€…ãŒä½¿ã†éµã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "é€ä¿¡è€…ã®å…¬é–‹éµ",
      "å—ä¿¡è€…ã®å…¬é–‹éµ",
      "å—ä¿¡è€…ã®ç§˜å¯†éµ",
      "é€ä¿¡è€…ã®ç§˜å¯†éµ"
    ],
    "a": 1,
    "exp": "å—ä¿¡è€…ã®å…¬é–‹éµã§æš—å·åŒ–ã—ã€ãã®å¯¾å¿œã™ã‚‹å—ä¿¡è€…ã®ç§˜å¯†éµã§å¾©å·ã—ã¾ã™ã€‚",
    "hint": "æš—å·åŒ–ã™ã‚‹éµã¯ç›¸æ‰‹ã«å…¬é–‹ã•ã‚Œã¦ã„ã¦ã‚‚å›°ã‚‰ãªã„éµã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œç½²åè€…ã®å…¬é–‹éµã§æ¤œè¨¼ã€ã€‚å—ä¿¡è€…ã®å…¬é–‹éµã§æš—å·åŒ–ã—ã€ãã®å¯¾å¿œã™ã‚‹å—ä¿¡è€…ã®ç§˜å¯†éµã§å¾©å·ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œé€ä¿¡è€…ã®å…¬é–‹éµã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "å—ä¿¡è€…ã®å…¬é–‹éµã§æš—å·åŒ–ã—ã€ãã®å¯¾å¿œã™ã‚‹å—ä¿¡è€…ã®ç§˜å¯†éµã§å¾©å·ã—ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œç½²åè€…ã®å…¬é–‹éµã§æ¤œè¨¼ã€ã€‚å—ä¿¡è€…ã®å…¬é–‹éµã§æš—å·åŒ–ã—ã€ãã®å¯¾å¿œã™ã‚‹å—ä¿¡è€…ã®ç§˜å¯†éµã§å¾©å·ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå—ä¿¡è€…ã®ç§˜å¯†éµã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œç½²åè€…ã®å…¬é–‹éµã§æ¤œè¨¼ã€ã€‚å—ä¿¡è€…ã®å…¬é–‹éµã§æš—å·åŒ–ã—ã€ãã®å¯¾å¿œã™ã‚‹å—ä¿¡è€…ã®ç§˜å¯†éµã§å¾©å·ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œé€ä¿¡è€…ã®ç§˜å¯†éµã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_11_03",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "sec-03",
    "cat": "ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£",
    "concept": "ãƒ‡ã‚¸ã‚¿ãƒ«ç½²å",
    "difficulty": "æ¨™æº–",
    "q": "é€ä¿¡è€…ãŒæ–‡æ›¸ã¸ãƒ‡ã‚¸ã‚¿ãƒ«ç½²åã‚’ä»˜ã‘ã€å—ä¿¡è€…ãŒç½²åè€…æœ¬äººã«ã‚ˆã‚‹ç½²åã‹ç¢ºèªã§ãã‚‹ã‚ˆã†ã«ã—ãŸã„ã€‚ç½²åä»˜ä¸Žæ™‚ã«ä½¿ã†éµã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ç½²åè€…ã®å…¬é–‹éµ",
      "å—ä¿¡è€…ã®å…¬é–‹éµ",
      "ç½²åè€…ã®ç§˜å¯†éµ",
      "å—ä¿¡è€…ã®ç§˜å¯†éµ"
    ],
    "a": 2,
    "exp": "ç½²åè€…ã¯è‡ªåˆ†ã®ç§˜å¯†éµã‚’ç”¨ã„ã¦ç½²åã—ã€æ¤œè¨¼å´ã¯ç½²åè€…ã®å…¬é–‹éµã§ç¢ºèªã—ã¾ã™ã€‚",
    "hint": "æœ¬äººã—ã‹æŒã£ã¦ã„ãªã„éµã§ç½²åã™ã‚‹ã‹ã‚‰ã€æœ¬äººæ€§ã®ç¢ºèªã«ä½¿ãˆã¾ã™ã€‚",
    "choiceExps": [
      "ã“ã®å†…å®¹ã¯ã€Œãƒ‡ã‚¸ã‚¿ãƒ«ç½²åã¨èªè¨¼å±€ã€ã§æ‰±ã†äº‹é …ã«å½“ãŸã‚‹ã€‚ã€Œãƒ‡ã‚¸ã‚¿ãƒ«ç½²åã€ã§å•ã‚ã‚Œã¦ã„ã‚‹å†…å®¹ã¨ã¯è«–ç‚¹ãŒç•°ãªã‚‹ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œç½²åè€…ã®ç§˜å¯†éµã§ç½²åã€ã€‚ç½²åè€…ã¯è‡ªåˆ†ã®ç§˜å¯†éµã‚’ç”¨ã„ã¦ç½²åã—ã€æ¤œè¨¼å´ã¯ç½²åè€…ã®å…¬é–‹éµã§ç¢ºèªã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå—ä¿¡è€…ã®å…¬é–‹éµã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ç½²åè€…ã¯è‡ªåˆ†ã®ç§˜å¯†éµã‚’ç”¨ã„ã¦ç½²åã—ã€æ¤œè¨¼å´ã¯ç½²åè€…ã®å…¬é–‹éµã§ç¢ºèªã—ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œç½²åè€…ã®ç§˜å¯†éµã§ç½²åã€ã€‚ç½²åè€…ã¯è‡ªåˆ†ã®ç§˜å¯†éµã‚’ç”¨ã„ã¦ç½²åã—ã€æ¤œè¨¼å´ã¯ç½²åè€…ã®å…¬é–‹éµã§ç¢ºèªã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå—ä¿¡è€…ã®ç§˜å¯†éµã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_11_03",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "sec-04",
    "cat": "ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£",
    "concept": "èªè¨¼",
    "difficulty": "åŸºç¤Ž",
    "q": "ã€ŒçŸ¥ã£ã¦ã„ã‚‹æƒ…å ±ã€ã€ŒæŒã£ã¦ã„ã‚‹ç‰©ã€ã€Œæœ¬äººã®èº«ä½“çš„ç‰¹å¾´ã€ã®ã†ã¡ã€ç•°ãªã‚‹ç¨®é¡žã‚’2ã¤ä»¥ä¸Šçµ„ã¿åˆã‚ã›ã‚‹èªè¨¼ã¯ï¼Ÿ",
    "options": [
      "ãƒ¯ãƒ³ã‚¿ã‚¤ãƒ ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰èªè¨¼",
      "ãƒªã‚¹ã‚¯ãƒ™ãƒ¼ã‚¹èªè¨¼",
      "ã‚·ãƒ³ã‚°ãƒ«ã‚µã‚¤ãƒ³ã‚ªãƒ³",
      "å¤šè¦ç´ èªè¨¼"
    ],
    "a": 3,
    "exp": "å¤šè¦ç´ èªè¨¼ã¯ã€çŸ¥è­˜æƒ…å ±ãƒ»æ‰€æŒæƒ…å ±ãƒ»ç”Ÿä½“æƒ…å ±ãªã©ã€ç•°ãªã‚‹ç¨®é¡žã®èªè¨¼è¦ç´ ã‚’2ç¨®é¡žä»¥ä¸Šçµ„ã¿åˆã‚ã›ã¾ã™ã€‚",
    "hint": "ã€Œ2å›žèªè¨¼ã™ã‚‹ã€ã“ã¨ã§ã¯ãªãã€ã€Œç•°ãªã‚‹ç¨®é¡žã®è¦ç´ ã‚’çµ„ã¿åˆã‚ã›ã‚‹ã€ã“ã¨ãŒãƒã‚¤ãƒ³ãƒˆã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå¤šè¦ç´ èªè¨¼ã§èªè¨¼å¼·åŒ–ã€ã€‚å¤šè¦ç´ èªè¨¼ã¯ã€çŸ¥è­˜æƒ…å ±ãƒ»æ‰€æŒæƒ…å ±ãƒ»ç”Ÿä½“æƒ…å ±ãªã©ã€ç•°ãªã‚‹ç¨®é¡žã®èªè¨¼è¦ç´ ã‚’2ç¨®é¡žä»¥ä¸Šçµ„ã¿åˆã‚ã›ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒ¯ãƒ³ã‚¿ã‚¤ãƒ ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰èªè¨¼ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œãƒªã‚¹ã‚¯ã€ã¯ã€æœ›ã¾ã—ããªã„å‡ºæ¥äº‹ãŒèµ·ã“ã‚‹å¯èƒ½æ€§ã¨ã€ãã®å½±éŸ¿ã‚’çµ„ã¿åˆã‚ã›ã¦è€ƒãˆãŸã‚‚ã®ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå¤šè¦ç´ èªè¨¼ã§èªè¨¼å¼·åŒ–ã€ã€‚å¤šè¦ç´ èªè¨¼ã¯ã€çŸ¥è­˜æƒ…å ±ãƒ»æ‰€æŒæƒ…å ±ãƒ»ç”Ÿä½“æƒ…å ±ãªã©ã€ç•°ãªã‚‹ç¨®é¡žã®èªè¨¼è¦ç´ ã‚’2ç¨®é¡žä»¥ä¸Šçµ„ã¿åˆã‚ã›ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œã‚·ãƒ³ã‚°ãƒ«ã‚µã‚¤ãƒ³ã‚ªãƒ³ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "å¤šè¦ç´ èªè¨¼ã¯ã€çŸ¥è­˜æƒ…å ±ãƒ»æ‰€æŒæƒ…å ±ãƒ»ç”Ÿä½“æƒ…å ±ãªã©ã€ç•°ãªã‚‹ç¨®é¡žã®èªè¨¼è¦ç´ ã‚’2ç¨®é¡žä»¥ä¸Šçµ„ã¿åˆã‚ã›ã¾ã™ã€‚"
    ],
    "explainTopicId": "core_11_06",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "åŽŸå‰‡ãƒ»é–¢ä¿‚"
  },
  {
    "id": "algo-01",
    "cat": "ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ",
    "concept": "äºŒåˆ†æŽ¢ç´¢",
    "difficulty": "åŸºç¤Ž",
    "q": "æ˜‡é †ã«æ•´åˆ—ã•ã‚ŒãŸé…åˆ— [4, 9, 15, 22, 31, 40, 52] ã‹ã‚‰40ã‚’äºŒåˆ†æŽ¢ç´¢ã™ã‚‹ã€‚æœ€åˆã«22ã¨æ¯”è¼ƒã—ãŸå¾Œã€æ¬¡ã«æ®‹ã™ç¯„å›²ã¯ï¼Ÿ",
    "options": [
      "22ã‚ˆã‚Šå³å´",
      "æŽ¢ç´¢çµ‚äº†",
      "22ã‚ˆã‚Šå·¦å´",
      "å…¨ä½“ã‚’æ®‹ã™"
    ],
    "a": 0,
    "exp": "40ã¯22ã‚ˆã‚Šå¤§ãã„ã®ã§ã€22ä»¥ä¸‹ã®å·¦åŠåˆ†ã‚’æ¨ã¦ã€å³åŠåˆ†ã‚’æŽ¢ç´¢ã—ã¾ã™ã€‚",
    "hint": "ç›®çš„å€¤40ã¨ä¸­å¤®22ã®å¤§å°ã‚’æ¯”ã¹ã¾ã™ã€‚",
    "choiceExps": [
      "40ã¯22ã‚ˆã‚Šå¤§ãã„ã®ã§ã€22ä»¥ä¸‹ã®å·¦åŠåˆ†ã‚’æ¨ã¦ã€å³åŠåˆ†ã‚’æŽ¢ç´¢ã—ã¾ã™ã€‚",
      "ã€ŒæŽ¢ç´¢ã€ã¯ã€ç›®çš„ã®ãƒ‡ãƒ¼ã‚¿ã‚’ãƒ‡ãƒ¼ã‚¿é›†åˆã®ä¸­ã‹ã‚‰æŽ¢ã™å‡¦ç†ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œç›®çš„å€¤40ã¨ä¸­å¤®22ã®å¤§å°ã‚’æ¯”ã¹ã¾ã™ã€ã€‚40ã¯22ã‚ˆã‚Šå¤§ãã„ã®ã§ã€22ä»¥ä¸‹ã®å·¦åŠåˆ†ã‚’æ¨ã¦ã€å³åŠåˆ†ã‚’æŽ¢ç´¢ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ22ã‚ˆã‚Šå·¦å´ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œç›®çš„å€¤40ã¨ä¸­å¤®22ã®å¤§å°ã‚’æ¯”ã¹ã¾ã™ã€ã€‚40ã¯22ã‚ˆã‚Šå¤§ãã„ã®ã§ã€22ä»¥ä¸‹ã®å·¦åŠåˆ†ã‚’æ¨ã¦ã€å³åŠåˆ†ã‚’æŽ¢ç´¢ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå…¨ä½“ã‚’æ®‹ã™ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_03_03",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "algo-02",
    "cat": "ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ",
    "concept": "ã‚¹ã‚¿ãƒƒã‚¯",
    "difficulty": "åŸºç¤Ž",
    "q": "ç©ºã®ã‚¹ã‚¿ãƒƒã‚¯ã« Aã€Bã€C ã®é †ã§PUSHã—ãŸå¾Œã€1å›žPOPã™ã‚‹ã¨å–ã‚Šå‡ºã•ã‚Œã‚‹ã®ã¯ï¼Ÿ",
    "options": [
      "A",
      "C",
      "B",
      "ä½•ã‚‚å–ã‚Šå‡ºã›ãªã„"
    ],
    "a": 1,
    "exp": "ã‚¹ã‚¿ãƒƒã‚¯ã¯LIFOï¼ˆå¾Œå…¥ã‚Œå…ˆå‡ºã—ï¼‰ãªã®ã§ã€æœ€å¾Œã«å…¥ã‚ŒãŸCãŒæœ€åˆã«å–ã‚Šå‡ºã•ã‚Œã¾ã™ã€‚",
    "hint": "ç©ã¿é‡ã­ãŸçš¿ã‚’ä¸Šã‹ã‚‰å–ã‚‹ã‚¤ãƒ¡ãƒ¼ã‚¸ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒA,B,Cã‚’ã‚¹ã‚¿ãƒƒã‚¯ã¸é †ã«PUSHã™ã‚‹ã¨æœ€åˆã®POPã¯Cã§ã™ã€ã€‚ã‚¹ã‚¿ãƒƒã‚¯ã¯LIFOï¼ˆå¾Œå…¥ã‚Œå…ˆå‡ºã—ï¼‰ãªã®ã§ã€æœ€å¾Œã«å…¥ã‚ŒãŸCãŒæœ€åˆã«å–ã‚Šå‡ºã•ã‚Œã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒAã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã‚¹ã‚¿ãƒƒã‚¯ã¯LIFOï¼ˆå¾Œå…¥ã‚Œå…ˆå‡ºã—ï¼‰ãªã®ã§ã€æœ€å¾Œã«å…¥ã‚ŒãŸCãŒæœ€åˆã«å–ã‚Šå‡ºã•ã‚Œã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒA,B,Cã‚’ã‚¹ã‚¿ãƒƒã‚¯ã¸é †ã«PUSHã™ã‚‹ã¨æœ€åˆã®POPã¯Cã§ã™ã€ã€‚ã‚¹ã‚¿ãƒƒã‚¯ã¯LIFOï¼ˆå¾Œå…¥ã‚Œå…ˆå‡ºã—ï¼‰ãªã®ã§ã€æœ€å¾Œã«å…¥ã‚ŒãŸCãŒæœ€åˆã«å–ã‚Šå‡ºã•ã‚Œã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒBã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒA,B,Cã‚’ã‚¹ã‚¿ãƒƒã‚¯ã¸é †ã«PUSHã™ã‚‹ã¨æœ€åˆã®POPã¯Cã§ã™ã€ã€‚ã“ã®ãŸã‚ã€Œä½•ã‚‚å–ã‚Šå‡ºã›ãªã„ã€ã®ã‚ˆã†ã«æ–­å®šã™ã‚‹ã¨ã€å•é¡Œã®æ¡ä»¶ãƒ»å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_03_01",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "algo-03",
    "cat": "ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ",
    "concept": "è¨ˆç®—é‡",
    "difficulty": "æ¨™æº–",
    "q": "æœªæ•´åˆ—ã®nä»¶ã®ãƒ‡ãƒ¼ã‚¿ã‹ã‚‰ç›®çš„ã®å€¤ã‚’å…ˆé ­ã‹ã‚‰é †ã«æŽ¢ã™ã€‚ç›®çš„ã®å€¤ãŒæœ€å¾Œã«ã‚ã‚‹å ´åˆã€èª¿ã¹ã‚‹è¦ç´ æ•°ã®ãŠãŠã‚ˆãã®å¢—ãˆæ–¹ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "log2 n",
      "nÂ²",
      "n",
      "1"
    ],
    "a": 2,
    "exp": "ç›®çš„ã®å€¤ãŒæœ€å¾Œã«ã‚ã‚‹ã€ã¾ãŸã¯å­˜åœ¨ã—ãªã„å ´åˆã€æœ€å¤§ã§nå€‹ã™ã¹ã¦ã‚’èª¿ã¹ã¾ã™ã€‚è¨ˆç®—é‡ã¯O(n)ã§ã™ã€‚",
    "hint": "ä¸€ã¤ãšã¤é †ç•ªã«è¦‹ã‚‹æŽ¢ç´¢ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œè¨ˆç®—é‡ã¯å…¥åŠ›ä»¶æ•°nãŒå¢—ãˆãŸã¨ãå‡¦ç†é‡ãŒã©ã†å¢—ãˆã‚‹ã‹ã‚’è¡¨ã—ã€å®šæ•°å€ã‚ˆã‚Šå¢—ãˆæ–¹ã®é•ã„ã‚’è¦‹ã‚‹ã€ã€‚ç›®çš„ã®å€¤ãŒæœ€å¾Œã«ã‚ã‚‹ã€ã¾ãŸã¯å­˜åœ¨ã—ãªã„å ´åˆã€æœ€å¤§ã§nå€‹ã™ã¹ã¦ã‚’èª¿ã¹ã¾ã™ã€‚è¨ˆç®—é‡ã¯O(n)ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œlog2 nã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œè¨ˆç®—é‡ã¯å…¥åŠ›ä»¶æ•°nãŒå¢—ãˆãŸã¨ãå‡¦ç†é‡ãŒã©ã†å¢—ãˆã‚‹ã‹ã‚’è¡¨ã—ã€å®šæ•°å€ã‚ˆã‚Šå¢—ãˆæ–¹ã®é•ã„ã‚’è¦‹ã‚‹ã€ã€‚ç›®çš„ã®å€¤ãŒæœ€å¾Œã«ã‚ã‚‹ã€ã¾ãŸã¯å­˜åœ¨ã—ãªã„å ´åˆã€æœ€å¤§ã§nå€‹ã™ã¹ã¦ã‚’èª¿ã¹ã¾ã™ã€‚è¨ˆç®—é‡ã¯O(n)ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒnÂ²ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ç›®çš„ã®å€¤ãŒæœ€å¾Œã«ã‚ã‚‹ã€ã¾ãŸã¯å­˜åœ¨ã—ãªã„å ´åˆã€æœ€å¤§ã§nå€‹ã™ã¹ã¦ã‚’èª¿ã¹ã¾ã™ã€‚è¨ˆç®—é‡ã¯O(n)ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œè¨ˆç®—é‡ã¯å…¥åŠ›ä»¶æ•°nãŒå¢—ãˆãŸã¨ãå‡¦ç†é‡ãŒã©ã†å¢—ãˆã‚‹ã‹ã‚’è¡¨ã—ã€å®šæ•°å€ã‚ˆã‚Šå¢—ãˆæ–¹ã®é•ã„ã‚’è¦‹ã‚‹ã€ã€‚ç›®çš„ã®å€¤ãŒæœ€å¾Œã«ã‚ã‚‹ã€ã¾ãŸã¯å­˜åœ¨ã—ãªã„å ´åˆã€æœ€å¤§ã§nå€‹ã™ã¹ã¦ã‚’èª¿ã¹ã¾ã™ã€‚è¨ˆç®—é‡ã¯O(n)ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ1ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_03_03",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "algo-04",
    "cat": "ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ",
    "concept": "ãƒ«ãƒ¼ãƒ—ãƒˆãƒ¬ãƒ¼ã‚¹",
    "difficulty": "æ¨™æº–",
    "q": "aâ†0 ã¨ã—ã€iã‚’1ã‹ã‚‰4ã¾ã§1ãšã¤å¢—ã‚„ã—ãªãŒã‚‰ aâ†a+i ã‚’å®Ÿè¡Œã™ã‚‹ã€‚çµ‚äº†æ™‚ã®aã¯ã„ãã¤ã‹ã€‚",
    "options": [
      "16",
      "4",
      "6",
      "10"
    ],
    "a": 3,
    "exp": "aã¯ 0+1+2+3+4 = 10 ã«ãªã‚Šã¾ã™ã€‚",
    "hint": "iã®å€¤ã‚’1,2,3,4ã¨é †ç•ªã«è¶³ã—ã¦ã¿ã¾ã—ã‚‡ã†ã€‚",
    "choiceExps": [
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ10ã€ã«ãªã‚‹ã€‚aã¯ 0+1+2+3+4 = 10 ã«ãªã‚Šã¾ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ10ã€ã«ãªã‚‹ã€‚aã¯ 0+1+2+3+4 = 10 ã«ãªã‚Šã¾ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ10ã€ã«ãªã‚‹ã€‚aã¯ 0+1+2+3+4 = 10 ã«ãªã‚Šã¾ã™ã€‚",
      "aã¯ 0+1+2+3+4 = 10 ã«ãªã‚Šã¾ã™ã€‚"
    ],
    "explainTopicId": "core_03_04",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "mgmt-01",
    "cat": "ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ",
    "concept": "ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆ",
    "difficulty": "åŸºç¤Ž",
    "q": "ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆã§å®Ÿæ–½ã™ã¹ãä½œæ¥­ã‚’æ¼ã‚ŒãªãæŠŠæ¡ã—ã‚„ã™ãã™ã‚‹ãŸã‚ã€æˆæžœç‰©ã‚„ä½œæ¥­ã‚’éšŽå±¤çš„ã«åˆ†è§£ã—ãŸã‚‚ã®ã¯ï¼Ÿ",
    "options": [
      "WBS",
      "ã‚¬ãƒ³ãƒˆãƒãƒ£ãƒ¼ãƒˆ",
      "PERTå›³",
      "RACIãƒãƒ£ãƒ¼ãƒˆ"
    ],
    "a": 0,
    "exp": "WBSï¼ˆWork Breakdown Structureï¼‰ã¯ã€ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆã®æˆæžœç‰©ã‚„ä½œæ¥­ã‚’ç®¡ç†å¯èƒ½ãªå˜ä½ã¾ã§éšŽå±¤çš„ã«åˆ†è§£ã—ãŸã‚‚ã®ã§ã™ã€‚",
    "hint": "ã€Œä½œæ¥­ã‚’åˆ†è§£ã—ã¦éšŽå±¤åŒ–ã™ã‚‹ã€ãŸã‚ã®æ§‹é€ ã§ã™ã€‚",
    "choiceExps": [
      "WBSï¼ˆWork Breakdown Structureï¼‰ã¯ã€ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆã®æˆæžœç‰©ã‚„ä½œæ¥­ã‚’ç®¡ç†å¯èƒ½ãªå˜ä½ã¾ã§éšŽå±¤çš„ã«åˆ†è§£ã—ãŸã‚‚ã®ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒWBSã§ä½œæ¥­ã‚’éšŽå±¤åˆ†è§£ã€ã€‚WBSï¼ˆWork Breakdown Structureï¼‰ã¯ã€ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆã®æˆæžœç‰©ã‚„ä½œæ¥­ã‚’ç®¡ç†å¯èƒ½ãªå˜ä½ã¾ã§éšŽå±¤çš„ã«åˆ†è§£ã—ãŸã‚‚ã®ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œã‚¬ãƒ³ãƒˆãƒãƒ£ãƒ¼ãƒˆã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€ŒPERTã€ã¯ã€Program Evaluation and Review Techniqueã€‚ä½œæ¥­ã®å‰å¾Œé–¢ä¿‚ã¨æ‰€è¦æ™‚é–“ã‹ã‚‰ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆæ—¥ç¨‹ã‚’åˆ†æžã™ã‚‹æ‰‹æ³•ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒWBSã§ä½œæ¥­ã‚’éšŽå±¤åˆ†è§£ã€ã€‚WBSï¼ˆWork Breakdown Structureï¼‰ã¯ã€ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆã®æˆæžœç‰©ã‚„ä½œæ¥­ã‚’ç®¡ç†å¯èƒ½ãªå˜ä½ã¾ã§éšŽå±¤çš„ã«åˆ†è§£ã—ãŸã‚‚ã®ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒRACIãƒãƒ£ãƒ¼ãƒˆã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_14_02",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "mgmt-02",
    "cat": "ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ",
    "concept": "ãƒªã‚¹ã‚¯",
    "difficulty": "æ¨™æº–",
    "q": "ç™ºç”Ÿç¢ºçŽ‡ã¯ä½Žã„ãŒã€ç™ºç”Ÿã—ãŸå ´åˆã®å½±éŸ¿ãŒéžå¸¸ã«å¤§ãã„ãƒªã‚¹ã‚¯ã¸ã®å¯¾å¿œã¨ã—ã¦ã€ã¾ãšé©åˆ‡ãªã®ã¯ï¼Ÿ",
    "options": [
      "ç™ºç”ŸãŒç¢ºå®šã—ãŸå•é¡Œã¨ã—ã¦ç›´ã¡ã«å‡¦ç†ã‚’é–‹å§‹ã™ã‚‹",
      "å½±éŸ¿ã¨å¯¾å¿œç­–ã‚’æ¤œè¨Žã—ã¦ç®¡ç†å¯¾è±¡ã«ã™ã‚‹",
      "æ‹…å½“è€…ã®è¨˜æ†¶ã«æ®‹ã—ã€æ–‡æ›¸åŒ–ã›ãšæ§˜å­ã‚’è¦‹ã‚‹",
      "ç™ºç”Ÿç¢ºçŽ‡ãŒä½Žã„ã“ã¨ã‚’ç†ç”±ã«è©•ä¾¡å¯¾è±¡ã‹ã‚‰å¤–ã™"
    ],
    "a": 1,
    "exp": "ãƒªã‚¹ã‚¯ã¯ç™ºç”Ÿç¢ºçŽ‡ã¨å½±éŸ¿åº¦ã‚’è©•ä¾¡ã—ã€å¿…è¦ãªå¯¾å¿œã‚’è¨ˆç”»ã—ã¾ã™ã€‚ç¢ºçŽ‡ãŒä½Žãã¦ã‚‚å½±éŸ¿ãŒå¤§ãã‘ã‚Œã°ç®¡ç†å¯¾è±¡ã«ãªã‚Šå¾—ã¾ã™ã€‚",
    "hint": "ç¢ºçŽ‡ã ã‘ã§ãªãã€Œèµ·ããŸã¨ãã®å¤§ãã•ã€ã‚‚è¦‹ã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒªã‚¹ã‚¯ã¯å•é¡ŒãŒç™ºç”Ÿã—ã¦ã‹ã‚‰å¯¾å‡¦ã™ã‚‹ã®ã§ã¯ãªãã€äº‹å‰ã«è­˜åˆ¥ã—ã¦å¯¾å¿œç­–ã‚„è²¬ä»»è€…ã‚’æº–å‚™ã™ã‚‹ã€ã€‚ãƒªã‚¹ã‚¯ã¯ç™ºç”Ÿç¢ºçŽ‡ã¨å½±éŸ¿åº¦ã‚’è©•ä¾¡ã—ã€å¿…è¦ãªå¯¾å¿œã‚’è¨ˆç”»ã—ã¾ã™ã€‚ç¢ºçŽ‡ãŒä½Žãã¦ã‚‚å½±éŸ¿ãŒå¤§ãã‘ã‚Œã°ç®¡ç†å¯¾è±¡ã«ãªã‚Šå¾—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œç™ºç”ŸãŒç¢ºå®šã—ãŸå•é¡Œã¨ã—ã¦ç›´ã¡ã«å‡¦ç†ã‚’é–‹å§‹ã™ã‚‹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ãƒªã‚¹ã‚¯ã¯ç™ºç”Ÿç¢ºçŽ‡ã¨å½±éŸ¿åº¦ã‚’è©•ä¾¡ã—ã€å¿…è¦ãªå¯¾å¿œã‚’è¨ˆç”»ã—ã¾ã™ã€‚ç¢ºçŽ‡ãŒä½Žãã¦ã‚‚å½±éŸ¿ãŒå¤§ãã‘ã‚Œã°ç®¡ç†å¯¾è±¡ã«ãªã‚Šå¾—ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒªã‚¹ã‚¯ã¯å•é¡ŒãŒç™ºç”Ÿã—ã¦ã‹ã‚‰å¯¾å‡¦ã™ã‚‹ã®ã§ã¯ãªãã€äº‹å‰ã«è­˜åˆ¥ã—ã¦å¯¾å¿œç­–ã‚„è²¬ä»»è€…ã‚’æº–å‚™ã™ã‚‹ã€ã€‚ãƒªã‚¹ã‚¯ã¯ç™ºç”Ÿç¢ºçŽ‡ã¨å½±éŸ¿åº¦ã‚’è©•ä¾¡ã—ã€å¿…è¦ãªå¯¾å¿œã‚’è¨ˆç”»ã—ã¾ã™ã€‚ç¢ºçŽ‡ãŒä½Žãã¦ã‚‚å½±éŸ¿ãŒå¤§ãã‘ã‚Œã°ç®¡ç†å¯¾è±¡ã«ãªã‚Šå¾—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œæ‹…å½“è€…ã®è¨˜æ†¶ã«æ®‹ã—ã€æ–‡æ›¸åŒ–ã›ãšæ§˜å­ã‚’è¦‹ã‚‹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒªã‚¹ã‚¯ã¯å•é¡ŒãŒç™ºç”Ÿã—ã¦ã‹ã‚‰å¯¾å‡¦ã™ã‚‹ã®ã§ã¯ãªãã€äº‹å‰ã«è­˜åˆ¥ã—ã¦å¯¾å¿œç­–ã‚„è²¬ä»»è€…ã‚’æº–å‚™ã™ã‚‹ã€ã€‚ãƒªã‚¹ã‚¯ã¯ç™ºç”Ÿç¢ºçŽ‡ã¨å½±éŸ¿åº¦ã‚’è©•ä¾¡ã—ã€å¿…è¦ãªå¯¾å¿œã‚’è¨ˆç”»ã—ã¾ã™ã€‚ç¢ºçŽ‡ãŒä½Žãã¦ã‚‚å½±éŸ¿ãŒå¤§ãã‘ã‚Œã°ç®¡ç†å¯¾è±¡ã«ãªã‚Šå¾—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œç™ºç”Ÿç¢ºçŽ‡ãŒä½Žã„ã“ã¨ã‚’ç†ç”±ã«è©•ä¾¡å¯¾è±¡ã‹ã‚‰å¤–ã™ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_14_06",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "å½¹å‰²é¸æŠž"
  },
  {
    "id": "mgmt-03",
    "cat": "ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ",
    "concept": "ã‚µãƒ¼ãƒ“ã‚¹ãƒ¬ãƒ™ãƒ«",
    "difficulty": "åŸºç¤Ž",
    "q": "ã‚µãƒ¼ãƒ“ã‚¹æä¾›è€…ã¨åˆ©ç”¨è€…ãŒã€æœˆé–“ç¨¼åƒçŽ‡99.9%ä»¥ä¸Šãƒ»å¿œç­”æ™‚é–“3ç§’ä»¥å†…ãªã©ã€æ¸¬å®šå¯èƒ½ãªã‚µãƒ¼ãƒ“ã‚¹æ°´æº–ã‚’åˆæ„ã—ãŸã€‚ã“ã®åˆæ„ã«æœ€ã‚‚è¿‘ã„ã‚‚ã®ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "RFP",
      "OLA",
      "SLA",
      "WBS"
    ],
    "a": 2,
    "exp": "SLAï¼ˆService Level Agreementï¼‰ã¯ã€ã‚µãƒ¼ãƒ“ã‚¹æä¾›è€…ã¨åˆ©ç”¨è€…ã®é–“ã§ã€å¯ç”¨æ€§ã‚„å¿œç­”æ™‚é–“ãªã©ã®ã‚µãƒ¼ãƒ“ã‚¹æ°´æº–ã‚’åˆæ„ã—ãŸã‚‚ã®ã§ã™ã€‚",
    "hint": "Service Level Agreement ã®ç•¥ã§ã™ã€‚",
    "choiceExps": [
      "ã€ŒRFPã€ã¯ã€Request For Proposalã®ç•¥ã§ã€è¦ä»¶ã‚’ç¤ºã—ã¦å…·ä½“çš„ãªææ¡ˆã‚’ä¾é ¼ã™ã‚‹æ–‡æ›¸ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã‚µãƒ¼ãƒ“ã‚¹ãƒ¬ãƒ™ãƒ«ç®¡ç†ã¯ã€ã‚µãƒ¼ãƒ“ã‚¹ã®å“è³ªç›®æ¨™ã‚’æ±ºã‚ã€ãã®å®Ÿç¸¾ã‚’æ¸¬ã£ã¦æ”¹å–„ã™ã‚‹æ´»å‹•ã§ã™ã€‚SLAã¯æä¾›è€…ã¨åˆ©ç”¨è€…ã®é–“ã§åˆæ„ã—ãŸã‚µãƒ¼ãƒ“ã‚¹æ°´æº–ã‚’è¡¨ã—ã¾ã™ã€ã€‚SLAï¼ˆService Level Agreementï¼‰ã¯ã€ã‚µãƒ¼ãƒ“ã‚¹æä¾›è€…ã¨åˆ©ç”¨è€…ã®é–“ã§ã€å¯ç”¨æ€§ã‚„å¿œç­”æ™‚é–“ãªã©ã®ã‚µãƒ¼ãƒ“ã‚¹æ°´æº–ã‚’åˆæ„ã—ãŸã‚‚ã®ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒOLAã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "SLAï¼ˆService Level Agreementï¼‰ã¯ã€ã‚µãƒ¼ãƒ“ã‚¹æä¾›è€…ã¨åˆ©ç”¨è€…ã®é–“ã§ã€å¯ç”¨æ€§ã‚„å¿œç­”æ™‚é–“ãªã©ã®ã‚µãƒ¼ãƒ“ã‚¹æ°´æº–ã‚’åˆæ„ã—ãŸã‚‚ã®ã§ã™ã€‚",
      "ã€ŒWBSã€ã¯ã€Work Breakdown Structureã®ç•¥ã§ã€ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆã®ä½œæ¥­ã‚’å°ã•ãªå˜ä½ã¸åˆ†è§£ã—ãŸã‚‚ã®ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_15_02",
    "explainTopicSource": "semantic",
    "cognitiveRewrite": "v90-context",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "å½¹å‰²é¸æŠž"
  },
  {
    "id": "mgmt-04",
    "cat": "ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ",
    "concept": "ç›£æŸ»",
    "difficulty": "æ¨™æº–",
    "q": "ã‚·ã‚¹ãƒ†ãƒ ç›£æŸ»äººã«ç‰¹ã«æ±‚ã‚ã‚‰ã‚Œã‚‹ç«‹å ´ã¨ã—ã¦æœ€ã‚‚é©åˆ‡ãªã®ã¯ï¼Ÿ",
    "options": [
      "ç›£æŸ»å¯¾è±¡æ¥­å‹™ã®å®Ÿæ–½è²¬ä»»",
      "ç›£æŸ»å¯¾è±¡éƒ¨ç½²ã®æŒ‡æ®å‘½ä»¤ä¸‹ã«å…¥ã‚‹ã“ã¨",
      "ç›£æŸ»å¯¾è±¡ã‚·ã‚¹ãƒ†ãƒ ã®é–‹ç™ºè²¬ä»»",
      "ç›£æŸ»å¯¾è±¡ã‹ã‚‰ã®ç‹¬ç«‹æ€§"
    ],
    "a": 3,
    "exp": "ã‚·ã‚¹ãƒ†ãƒ ç›£æŸ»ã§ã¯ã€å®¢è¦³çš„ãªè©•ä¾¡ã‚’è¡Œã†ãŸã‚ã€ç›£æŸ»äººãŒç›£æŸ»å¯¾è±¡ã‹ã‚‰ç‹¬ç«‹ã—ãŸç«‹å ´ã§ã‚ã‚‹ã“ã¨ãŒé‡è¦ã§ã™ã€‚",
    "hint": "è©•ä¾¡ã™ã‚‹äººã¨ã€è©•ä¾¡ã•ã‚Œã‚‹æ¥­å‹™ã®è²¬ä»»è€…ã¯åˆ†ã‘ã‚‹å¿…è¦ãŒã‚ã‚Šã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œç›£æŸ»äººã®ç‹¬ç«‹æ€§ãƒ»å®¢è¦³æ€§ã€ã€‚ã‚·ã‚¹ãƒ†ãƒ ç›£æŸ»ã§ã¯ã€å®¢è¦³çš„ãªè©•ä¾¡ã‚’è¡Œã†ãŸã‚ã€ç›£æŸ»äººãŒç›£æŸ»å¯¾è±¡ã‹ã‚‰ç‹¬ç«‹ã—ãŸç«‹å ´ã§ã‚ã‚‹ã“ã¨ãŒé‡è¦ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œç›£æŸ»å¯¾è±¡æ¥­å‹™ã®å®Ÿæ–½è²¬ä»»ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œç›£æŸ»äººã®ç‹¬ç«‹æ€§ãƒ»å®¢è¦³æ€§ã€ã€‚ã‚·ã‚¹ãƒ†ãƒ ç›£æŸ»ã§ã¯ã€å®¢è¦³çš„ãªè©•ä¾¡ã‚’è¡Œã†ãŸã‚ã€ç›£æŸ»äººãŒç›£æŸ»å¯¾è±¡ã‹ã‚‰ç‹¬ç«‹ã—ãŸç«‹å ´ã§ã‚ã‚‹ã“ã¨ãŒé‡è¦ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œç›£æŸ»å¯¾è±¡éƒ¨ç½²ã®æŒ‡æ®å‘½ä»¤ä¸‹ã«å…¥ã‚‹ã“ã¨ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œç›£æŸ»äººã®ç‹¬ç«‹æ€§ãƒ»å®¢è¦³æ€§ã€ã€‚ã‚·ã‚¹ãƒ†ãƒ ç›£æŸ»ã§ã¯ã€å®¢è¦³çš„ãªè©•ä¾¡ã‚’è¡Œã†ãŸã‚ã€ç›£æŸ»äººãŒç›£æŸ»å¯¾è±¡ã‹ã‚‰ç‹¬ç«‹ã—ãŸç«‹å ´ã§ã‚ã‚‹ã“ã¨ãŒé‡è¦ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œç›£æŸ»å¯¾è±¡ã‚·ã‚¹ãƒ†ãƒ ã®é–‹ç™ºè²¬ä»»ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã‚·ã‚¹ãƒ†ãƒ ç›£æŸ»ã§ã¯ã€å®¢è¦³çš„ãªè©•ä¾¡ã‚’è¡Œã†ãŸã‚ã€ç›£æŸ»äººãŒç›£æŸ»å¯¾è±¡ã‹ã‚‰ç‹¬ç«‹ã—ãŸç«‹å ´ã§ã‚ã‚‹ã“ã¨ãŒé‡è¦ã§ã™ã€‚"
    ],
    "explainTopicId": "core_15_05",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "åŽŸå‰‡ãƒ»é–¢ä¿‚"
  },
  {
    "id": "strat-01",
    "cat": "ã‚¹ãƒˆãƒ©ãƒ†ã‚¸",
    "concept": "æç›Šåˆ†å²ç‚¹",
    "difficulty": "åŸºç¤Ž",
    "q": "å£²ä¸Šé«˜ã¨ç·è²»ç”¨ãŒç­‰ã—ããªã‚Šã€åˆ©ç›ŠãŒ0ã¨ãªã‚‹å£²ä¸Šé«˜ã‚’ä½•ã¨å‘¼ã¶ã‹ã€‚",
    "options": [
      "æç›Šåˆ†å²ç‚¹å£²ä¸Šé«˜",
      "é™ç•Œåˆ©ç›Š",
      "å›ºå®šè²»",
      "å¤‰å‹•è²»"
    ],
    "a": 0,
    "exp": "å£²ä¸Šé«˜ã¨ç·è²»ç”¨ãŒç­‰ã—ãã€åˆ©ç›ŠãŒã¡ã‚‡ã†ã©0ã«ãªã‚‹å£²ä¸Šé«˜ã‚’æç›Šåˆ†å²ç‚¹å£²ä¸Šé«˜ã¨å‘¼ã³ã¾ã™ã€‚",
    "hint": "åˆ©ç›ŠãŒãƒ—ãƒ©ã‚¹ã«ã‚‚ãƒžã‚¤ãƒŠã‚¹ã«ã‚‚ãªã‚‰ãªã„å¢ƒç›®ã®å£²ä¸Šé«˜ã§ã™ã€‚",
    "choiceExps": [
      "å£²ä¸Šé«˜ã¨ç·è²»ç”¨ãŒç­‰ã—ãã€åˆ©ç›ŠãŒã¡ã‚‡ã†ã©0ã«ãªã‚‹å£²ä¸Šé«˜ã‚’æç›Šåˆ†å²ç‚¹å£²ä¸Šé«˜ã¨å‘¼ã³ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œæç›Šåˆ†å²ç‚¹å£²ä¸Šé«˜=å›ºå®šè²»/é™ç•Œåˆ©ç›ŠçŽ‡ã€ã€‚å£²ä¸Šé«˜ã¨ç·è²»ç”¨ãŒç­‰ã—ãã€åˆ©ç›ŠãŒã¡ã‚‡ã†ã©0ã«ãªã‚‹å£²ä¸Šé«˜ã‚’æç›Šåˆ†å²ç‚¹å£²ä¸Šé«˜ã¨å‘¼ã³ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œé™ç•Œåˆ©ç›Šã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œå›ºå®šè²»ã€ã¯ã€å£²ä¸Šé‡ãŒå¤‰ã‚ã£ã¦ã‚‚ä¸€å®šç¯„å›²ã§ã¯ã»ã¼å¤‰ã‚ã‚‰ãªã„è²»ç”¨ã§ã™ã€‚å®¶è³ƒãªã©ãŒä¾‹ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œå¤‰å‹•è²»ã€ã¯ã€ç”Ÿç”£é‡ã‚„è²©å£²é‡ã«å¿œã˜ã¦å¢—æ¸›ã™ã‚‹è²»ç”¨ã§ã™ã€‚ææ–™è²»ãªã©ãŒä¾‹ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_20_04",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "strat-02",
    "cat": "ã‚¹ãƒˆãƒ©ãƒ†ã‚¸",
    "concept": "SWOT",
    "difficulty": "åŸºç¤Ž",
    "q": "ã‚ã‚‹ä¼æ¥­ã¯ã€é•·å¹´åŸ¹ã£ãŸãƒ–ãƒ©ãƒ³ãƒ‰åŠ›ã¨ç†Ÿç·´æŠ€è¡“è€…ã‚’ç«¶äº‰ä¸Šã®å¼·ã¿ã¨è©•ä¾¡ã—ãŸã€‚SWOTåˆ†æžã§ã¯ä¸»ã«ã©ã®è¦ç´ ã«åˆ†é¡žã™ã‚‹ã‹ã€‚",
    "options": [
      "Threat",
      "Strength",
      "Weakness",
      "Opportunity"
    ],
    "a": 1,
    "exp": "SWOTã¯Strengthï¼ˆå¼·ã¿ï¼‰ã€Weaknessï¼ˆå¼±ã¿ï¼‰ã€Opportunityï¼ˆæ©Ÿä¼šï¼‰ã€Threatï¼ˆè„…å¨ï¼‰ã§ã™ã€‚",
    "hint": "Sã¯è‹±èªžã®ã€Œå¼·ã•ã€ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒSã¯è‹±èªžã®ã€Œå¼·ã•ã€ã§ã™ã€ã€‚SWOTã¯Strengthï¼ˆå¼·ã¿ï¼‰ã€Weaknessï¼ˆå¼±ã¿ï¼‰ã€Opportunityï¼ˆæ©Ÿä¼šï¼‰ã€Threatï¼ˆè„…å¨ï¼‰ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒThreatã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "SWOTã¯Strengthï¼ˆå¼·ã¿ï¼‰ã€Weaknessï¼ˆå¼±ã¿ï¼‰ã€Opportunityï¼ˆæ©Ÿä¼šï¼‰ã€Threatï¼ˆè„…å¨ï¼‰ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒSã¯è‹±èªžã®ã€Œå¼·ã•ã€ã§ã™ã€ã€‚SWOTã¯Strengthï¼ˆå¼·ã¿ï¼‰ã€Weaknessï¼ˆå¼±ã¿ï¼‰ã€Opportunityï¼ˆæ©Ÿä¼šï¼‰ã€Threatï¼ˆè„…å¨ï¼‰ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒWeaknessã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒSã¯è‹±èªžã®ã€Œå¼·ã•ã€ã§ã™ã€ã€‚SWOTã¯Strengthï¼ˆå¼·ã¿ï¼‰ã€Weaknessï¼ˆå¼±ã¿ï¼‰ã€Opportunityï¼ˆæ©Ÿä¼šï¼‰ã€Threatï¼ˆè„…å¨ï¼‰ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒOpportunityã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_18_03",
    "explainTopicSource": "manual",
    "cognitiveRewrite": "v90-context",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "å½¹å‰²é¸æŠž"
  },
  {
    "id": "strat-03",
    "cat": "ã‚¹ãƒˆãƒ©ãƒ†ã‚¸",
    "concept": "ãƒžãƒ¼ã‚±ãƒ†ã‚£ãƒ³ã‚°",
    "difficulty": "æ¨™æº–",
    "q": "å¸‚å ´ã‚’é¡§å®¢ã®å±žæ€§ã‚„ãƒ‹ãƒ¼ã‚ºãªã©ã§è¤‡æ•°ã®ã‚°ãƒ«ãƒ¼ãƒ—ã«åˆ†ã‘ã‚‹ã“ã¨ã¯ï¼Ÿ",
    "options": [
      "ã‚¿ãƒ¼ã‚²ãƒ†ã‚£ãƒ³ã‚°",
      "ãƒã‚¸ã‚·ãƒ§ãƒ‹ãƒ³ã‚°",
      "ã‚»ã‚°ãƒ¡ãƒ³ãƒ†ãƒ¼ã‚·ãƒ§ãƒ³",
      "ãƒ—ãƒ­ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³"
    ],
    "a": 2,
    "exp": "ã‚»ã‚°ãƒ¡ãƒ³ãƒ†ãƒ¼ã‚·ãƒ§ãƒ³ã¯ã€å¸‚å ´ã‚’é¡§å®¢ã®å±žæ€§ã‚„ãƒ‹ãƒ¼ã‚ºãªã©ã‚’åŸºæº–ã«ã€ä¼¼ãŸç‰¹å¾´ã‚’ã‚‚ã¤ã‚°ãƒ«ãƒ¼ãƒ—ã¸åˆ†ã‘ã‚‹ã“ã¨ã§ã™ã€‚",
    "hint": "STPã®æœ€åˆã®Sã«å½“ãŸã‚Šã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒžãƒ¼ã‚±ãƒ†ã‚£ãƒ³ã‚°ã§ã¯ã€å¸‚å ´ã‚’ã‚»ã‚°ãƒ¡ãƒ³ãƒˆã«åˆ†ã‘ã€ç‹™ã†é¡§å®¢ã‚’ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã¨ã—ã¦é¸ã³ã€è‡ªç¤¾è£½å“ã‚’ã©ã†èªè­˜ã—ã¦ã‚‚ã‚‰ã†ã‹ãƒã‚¸ã‚·ãƒ§ãƒ‹ãƒ³ã‚°ã‚’è€ƒãˆã‚‹ã€‚4Pã¯Productãƒ»Priceãƒ»Placeãƒ»Promotionã®çµ„åˆã›ã§ã‚ã‚‹ã€ã€‚ã‚»ã‚°ãƒ¡ãƒ³ãƒ†ãƒ¼ã‚·ãƒ§ãƒ³ã¯ã€å¸‚å ´ã‚’é¡§å®¢ã®å±žæ€§ã‚„ãƒ‹ãƒ¼ã‚ºãªã©ã‚’åŸºæº–ã«ã€ä¼¼ãŸç‰¹å¾´ã‚’ã‚‚ã¤ã‚°ãƒ«ãƒ¼ãƒ—ã¸åˆ†ã‘ã‚‹ã“ã¨ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œã‚¿ãƒ¼ã‚²ãƒ†ã‚£ãƒ³ã‚°ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒžãƒ¼ã‚±ãƒ†ã‚£ãƒ³ã‚°ã§ã¯ã€å¸‚å ´ã‚’ã‚»ã‚°ãƒ¡ãƒ³ãƒˆã«åˆ†ã‘ã€ç‹™ã†é¡§å®¢ã‚’ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã¨ã—ã¦é¸ã³ã€è‡ªç¤¾è£½å“ã‚’ã©ã†èªè­˜ã—ã¦ã‚‚ã‚‰ã†ã‹ãƒã‚¸ã‚·ãƒ§ãƒ‹ãƒ³ã‚°ã‚’è€ƒãˆã‚‹ã€‚4Pã¯Productãƒ»Priceãƒ»Placeãƒ»Promotionã®çµ„åˆã›ã§ã‚ã‚‹ã€ã€‚ã‚»ã‚°ãƒ¡ãƒ³ãƒ†ãƒ¼ã‚·ãƒ§ãƒ³ã¯ã€å¸‚å ´ã‚’é¡§å®¢ã®å±žæ€§ã‚„ãƒ‹ãƒ¼ã‚ºãªã©ã‚’åŸºæº–ã«ã€ä¼¼ãŸç‰¹å¾´ã‚’ã‚‚ã¤ã‚°ãƒ«ãƒ¼ãƒ—ã¸åˆ†ã‘ã‚‹ã“ã¨ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒã‚¸ã‚·ãƒ§ãƒ‹ãƒ³ã‚°ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã‚»ã‚°ãƒ¡ãƒ³ãƒ†ãƒ¼ã‚·ãƒ§ãƒ³ã¯ã€å¸‚å ´ã‚’é¡§å®¢ã®å±žæ€§ã‚„ãƒ‹ãƒ¼ã‚ºãªã©ã‚’åŸºæº–ã«ã€ä¼¼ãŸç‰¹å¾´ã‚’ã‚‚ã¤ã‚°ãƒ«ãƒ¼ãƒ—ã¸åˆ†ã‘ã‚‹ã“ã¨ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒžãƒ¼ã‚±ãƒ†ã‚£ãƒ³ã‚°ã§ã¯ã€å¸‚å ´ã‚’ã‚»ã‚°ãƒ¡ãƒ³ãƒˆã«åˆ†ã‘ã€ç‹™ã†é¡§å®¢ã‚’ã‚¿ãƒ¼ã‚²ãƒƒãƒˆã¨ã—ã¦é¸ã³ã€è‡ªç¤¾è£½å“ã‚’ã©ã†èªè­˜ã—ã¦ã‚‚ã‚‰ã†ã‹ãƒã‚¸ã‚·ãƒ§ãƒ‹ãƒ³ã‚°ã‚’è€ƒãˆã‚‹ã€‚4Pã¯Productãƒ»Priceãƒ»Placeãƒ»Promotionã®çµ„åˆã›ã§ã‚ã‚‹ã€ã€‚ã‚»ã‚°ãƒ¡ãƒ³ãƒ†ãƒ¼ã‚·ãƒ§ãƒ³ã¯ã€å¸‚å ´ã‚’é¡§å®¢ã®å±žæ€§ã‚„ãƒ‹ãƒ¼ã‚ºãªã©ã‚’åŸºæº–ã«ã€ä¼¼ãŸç‰¹å¾´ã‚’ã‚‚ã¤ã‚°ãƒ«ãƒ¼ãƒ—ã¸åˆ†ã‘ã‚‹ã“ã¨ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒ—ãƒ­ãƒ¢ãƒ¼ã‚·ãƒ§ãƒ³ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_18_05",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "strat-04",
    "cat": "ã‚¹ãƒˆãƒ©ãƒ†ã‚¸",
    "concept": "çŸ¥çš„è²¡ç”£",
    "difficulty": "æ¨™æº–",
    "q": "ç™ºæ˜Žã‚’ä¿è­·ã™ã‚‹ä»£è¡¨çš„ãªç”£æ¥­è²¡ç”£æ¨©ã¯ï¼Ÿ",
    "options": [
      "æ„åŒ æ¨©",
      "å•†æ¨™æ¨©",
      "å®Ÿç”¨æ–°æ¡ˆæ¨©",
      "ç‰¹è¨±æ¨©"
    ],
    "a": 3,
    "exp": "æŠ€è¡“çš„æ€æƒ³ã®å‰µä½œã§ã‚ã‚‹ç™ºæ˜Žã‚’ä¿è­·ã™ã‚‹ä»£è¡¨çš„ãªç”£æ¥­è²¡ç”£æ¨©ã¯ç‰¹è¨±æ¨©ã§ã™ã€‚",
    "hint": "ç”£æ¥­è²¡ç”£æ¨©ã®ã†ã¡ã€ç™ºæ˜Žã‚’ä¿è­·ã™ã‚‹æ¨©åˆ©ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œç‰¹è¨±æ¨©ã¯ç™ºæ˜Žã€ã€‚æŠ€è¡“çš„æ€æƒ³ã®å‰µä½œã§ã‚ã‚‹ç™ºæ˜Žã‚’ä¿è­·ã™ã‚‹ä»£è¡¨çš„ãªç”£æ¥­è²¡ç”£æ¨©ã¯ç‰¹è¨±æ¨©ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œæ„åŒ æ¨©ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œå•†æ¨™æ¨©ã€ã¯ã€å•†å“åã‚„ãƒ­ã‚´ãªã©ã€å•†å“ãƒ»ã‚µãƒ¼ãƒ“ã‚¹ã‚’åŒºåˆ¥ã™ã‚‹ç›®å°ã‚’ä¿è­·ã™ã‚‹æ¨©åˆ©ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œç‰¹è¨±æ¨©ã¯ç™ºæ˜Žã€ã€‚æŠ€è¡“çš„æ€æƒ³ã®å‰µä½œã§ã‚ã‚‹ç™ºæ˜Žã‚’ä¿è­·ã™ã‚‹ä»£è¡¨çš„ãªç”£æ¥­è²¡ç”£æ¨©ã¯ç‰¹è¨±æ¨©ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå®Ÿç”¨æ–°æ¡ˆæ¨©ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "æŠ€è¡“çš„æ€æƒ³ã®å‰µä½œã§ã‚ã‚‹ç™ºæ˜Žã‚’ä¿è­·ã™ã‚‹ä»£è¡¨çš„ãªç”£æ¥­è²¡ç”£æ¨©ã¯ç‰¹è¨±æ¨©ã§ã™ã€‚"
    ],
    "explainTopicId": "core_21_01",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "sys-01",
    "cat": "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿",
    "concept": "OS",
    "difficulty": "åŸºç¤Ž",
    "q": "è¤‡æ•°ã®ã‚¢ãƒ—ãƒªãŒåŒã˜CPUãƒ»ä¸»è¨˜æ†¶ãƒ»å…¥å‡ºåŠ›è£…ç½®ã‚’å…±æœ‰ã™ã‚‹PCã§ã€å„è³‡æºã®å‰²å½“ã¦ã¨åŸºæœ¬çš„ãªå…¥å‡ºåŠ›åˆ¶å¾¡ã‚’æ‹…ã†ã‚½ãƒ•ãƒˆã‚¦ã‚§ã‚¢ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ã‚ªãƒšãƒ¬ãƒ¼ãƒ†ã‚£ãƒ³ã‚°ã‚·ã‚¹ãƒ†ãƒ ",
      "ãƒ‡ãƒã‚¤ã‚¹ãƒ‰ãƒ©ã‚¤ãƒ",
      "ã‚³ãƒ³ãƒ‘ã‚¤ãƒ©",
      "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹ç®¡ç†ã‚·ã‚¹ãƒ†ãƒ ï¼ˆDBMSï¼‰"
    ],
    "a": 0,
    "exp": "OSã¯CPUãƒ»ä¸»è¨˜æ†¶ãƒ»å…¥å‡ºåŠ›è£…ç½®ãªã©ã®è³‡æºã‚’ç®¡ç†ã—ã€è¤‡æ•°ã®ã‚¢ãƒ—ãƒªã‚±ãƒ¼ã‚·ãƒ§ãƒ³ãŒåˆ©ç”¨ã§ãã‚‹å®Ÿè¡Œç’°å¢ƒã‚’æä¾›ã—ã¾ã™ã€‚",
    "hint": "Windowsã‚„Linuxã®ã‚ˆã†ã«ã€ãƒãƒ¼ãƒ‰ã‚¦ã‚§ã‚¢è³‡æºã‚’ç®¡ç†ã™ã‚‹åŸºæœ¬ã‚½ãƒ•ãƒˆã‚¦ã‚§ã‚¢ã§ã™ã€‚",
    "choiceExps": [
      "OSã¯CPUãƒ»ä¸»è¨˜æ†¶ãƒ»å…¥å‡ºåŠ›è£…ç½®ãªã©ã®è³‡æºã‚’ç®¡ç†ã—ã€è¤‡æ•°ã®ã‚¢ãƒ—ãƒªã‚±ãƒ¼ã‚·ãƒ§ãƒ³ãŒåˆ©ç”¨ã§ãã‚‹å®Ÿè¡Œç’°å¢ƒã‚’æä¾›ã—ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒOSï¼ˆOperating Systemï¼šã‚ªãƒšãƒ¬ãƒ¼ãƒ†ã‚£ãƒ³ã‚°ã‚·ã‚¹ãƒ†ãƒ ï¼‰ã¯ã€ã‚¢ãƒ—ãƒªã¨ãƒãƒ¼ãƒ‰ã‚¦ã‚§ã‚¢ã®é–“ã«å…¥ã‚Šã€CPUãƒ»ãƒ¡ãƒ¢ãƒªãƒ»ãƒ•ã‚¡ã‚¤ãƒ«ãƒ»å…¥å‡ºåŠ›è£…ç½®ãªã©ã‚’ã¾ã¨ã‚ã¦ç®¡ç†ã™ã‚‹åŸºæœ¬ã‚½ãƒ•ãƒˆã‚¦ã‚§ã‚¢ã§ã™ã€ã€‚OSã¯CPUãƒ»ä¸»è¨˜æ†¶ãƒ»å…¥å‡ºåŠ›è£…ç½®ãªã©ã®è³‡æºã‚’ç®¡ç†ã—ã€è¤‡æ•°ã®ã‚¢ãƒ—ãƒªã‚±ãƒ¼ã‚·ãƒ§ãƒ³ãŒåˆ©ç”¨ã§ãã‚‹å®Ÿè¡Œç’°å¢ƒã‚’æä¾›ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒ‡ãƒã‚¤ã‚¹ãƒ‰ãƒ©ã‚¤ãƒã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œã‚³ãƒ³ãƒ‘ã‚¤ãƒ©ã€ã¯ã€ãƒ—ãƒ­ã‚°ãƒ©ãƒ å…¨ä½“ã‚’æ©Ÿæ¢°ãŒå®Ÿè¡Œã§ãã‚‹å½¢ã¸ã¾ã¨ã‚ã¦å¤‰æ›ã™ã‚‹ã‚½ãƒ•ãƒˆã‚¦ã‚§ã‚¢ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹ã€ã¯ã€å¤§é‡ã®ãƒ‡ãƒ¼ã‚¿ã‚’æ•´ç†ã—ã¦ä¿å­˜ã—ã€æ¤œç´¢ãƒ»æ›´æ–°ã—ã‚„ã™ãã™ã‚‹ä»•çµ„ã¿ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_06_01",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "sys-02",
    "cat": "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿",
    "concept": "ä¿¡é ¼æ€§",
    "difficulty": "æ¨™æº–",
    "q": "ç¨¼åƒçŽ‡0.9ã®åŒä¸€è£…ç½®Aãƒ»Bã‚’ä¸¦åˆ—ã«æŽ¥ç¶šã—ã€å°‘ãªãã¨ã‚‚ä¸€æ–¹ãŒå‹•ã‘ã°ã‚·ã‚¹ãƒ†ãƒ ãŒç¨¼åƒã™ã‚‹ã€‚ã‚·ã‚¹ãƒ†ãƒ ç¨¼åƒçŽ‡ã¯ï¼Ÿ",
    "options": [
      "0.81",
      "0.99",
      "0.90",
      "0.10"
    ],
    "a": 1,
    "exp": "ä¸¡æ–¹ã¨ã‚‚åœæ­¢ã™ã‚‹ç¢ºçŽ‡ã¯0.1Ã—0.1=0.01ã§ã™ã€‚ã—ãŸãŒã£ã¦ã€å°‘ãªãã¨ã‚‚ä¸€æ–¹ãŒç¨¼åƒã™ã‚‹ç¢ºçŽ‡ã¯1âˆ’0.01=0.99ã§ã™ã€‚",
    "hint": "ä¸¦åˆ—ã§ã¯ã€Œä¸¡æ–¹ã¨ã‚‚æ•…éšœã™ã‚‹ç¢ºçŽ‡ã€ã‚’1ã‹ã‚‰å¼•ãã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¾‹ï¼šç¨¼åƒçŽ‡0.9ã®è£…ç½®2å°ãªã‚‰ã€ç›´åˆ—0.81ã€ä¸¦åˆ—1-(0.1Ã—0.1)=0.99ã€ã€‚ä¸¡æ–¹ã¨ã‚‚åœæ­¢ã™ã‚‹ç¢ºçŽ‡ã¯0.1Ã—0.1=0.01ã§ã™ã€‚ã—ãŸãŒã£ã¦ã€å°‘ãªãã¨ã‚‚ä¸€æ–¹ãŒç¨¼åƒã™ã‚‹ç¢ºçŽ‡ã¯1âˆ’0.01=0.99ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ0.81ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ä¸¡æ–¹ã¨ã‚‚åœæ­¢ã™ã‚‹ç¢ºçŽ‡ã¯0.1Ã—0.1=0.01ã§ã™ã€‚ã—ãŸãŒã£ã¦ã€å°‘ãªãã¨ã‚‚ä¸€æ–¹ãŒç¨¼åƒã™ã‚‹ç¢ºçŽ‡ã¯1âˆ’0.01=0.99ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¾‹ï¼šç¨¼åƒçŽ‡0.9ã®è£…ç½®2å°ãªã‚‰ã€ç›´åˆ—0.81ã€ä¸¦åˆ—1-(0.1Ã—0.1)=0.99ã€ã€‚ä¸¡æ–¹ã¨ã‚‚åœæ­¢ã™ã‚‹ç¢ºçŽ‡ã¯0.1Ã—0.1=0.01ã§ã™ã€‚ã—ãŸãŒã£ã¦ã€å°‘ãªãã¨ã‚‚ä¸€æ–¹ãŒç¨¼åƒã™ã‚‹ç¢ºçŽ‡ã¯1âˆ’0.01=0.99ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ0.90ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¾‹ï¼šç¨¼åƒçŽ‡0.9ã®è£…ç½®2å°ãªã‚‰ã€ç›´åˆ—0.81ã€ä¸¦åˆ—1-(0.1Ã—0.1)=0.99ã€ã€‚ä¸¡æ–¹ã¨ã‚‚åœæ­¢ã™ã‚‹ç¢ºçŽ‡ã¯0.1Ã—0.1=0.01ã§ã™ã€‚ã—ãŸãŒã£ã¦ã€å°‘ãªãã¨ã‚‚ä¸€æ–¹ãŒç¨¼åƒã™ã‚‹ç¢ºçŽ‡ã¯1âˆ’0.01=0.99ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ0.10ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_05_04",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "mgmt-05",
    "cat": "ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ",
    "concept": "ã‚·ã‚¹ãƒ†ãƒ é–‹ç™º",
    "difficulty": "åŸºç¤Ž",
    "q": "åˆ©ç”¨è€…ãŒå¿…è¦ã¨ã™ã‚‹æ©Ÿèƒ½ã‚„æ€§èƒ½ã‚’æ˜Žç¢ºã«ã™ã‚‹å·¥ç¨‹ã¨ã—ã¦æœ€ã‚‚é©åˆ‡ãªã®ã¯ï¼Ÿ",
    "options": [
      "è©³ç´°è¨­è¨ˆ",
      "ãƒ—ãƒ­ã‚°ãƒ©ãƒŸãƒ³ã‚°",
      "è¦ä»¶å®šç¾©",
      "åŸºæœ¬è¨­è¨ˆ"
    ],
    "a": 2,
    "exp": "è¦ä»¶å®šç¾©ã§ã¯ã€åˆ©ç”¨è€…ãŒå¿…è¦ã¨ã™ã‚‹æ©Ÿèƒ½ãƒ»æ€§èƒ½ãƒ»åˆ¶ç´„ãªã©ã€ã‚·ã‚¹ãƒ†ãƒ ãŒæº€ãŸã™ã¹ãæ¡ä»¶ã‚’æ˜Žç¢ºã«ã—ã¾ã™ã€‚",
    "hint": "è¨­è¨ˆã«å…¥ã‚‹å‰ã«ã€Œä½•ã‚’å®Ÿç¾ã™ã‚‹ã‹ã€ã‚’æ±ºã‚ã‚‹å·¥ç¨‹ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã‚·ã‚¹ãƒ†ãƒ è¦ä»¶å®šç¾©ã§ã¯åˆ©ç”¨è€…ãƒ»æ¥­å‹™ãŒå¿…è¦ã¨ã™ã‚‹æ©Ÿèƒ½ã€æ€§èƒ½ã€ä¿¡é ¼æ€§ã€ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£ã€åˆ¶ç´„ã‚’æ˜Žç¢ºã«ã—ã¾ã™ã€ã€‚è¦ä»¶å®šç¾©ã§ã¯ã€åˆ©ç”¨è€…ãŒå¿…è¦ã¨ã™ã‚‹æ©Ÿèƒ½ãƒ»æ€§èƒ½ãƒ»åˆ¶ç´„ãªã©ã€ã‚·ã‚¹ãƒ†ãƒ ãŒæº€ãŸã™ã¹ãæ¡ä»¶ã‚’æ˜Žç¢ºã«ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œè©³ç´°è¨­è¨ˆã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã‚·ã‚¹ãƒ†ãƒ è¦ä»¶å®šç¾©ã§ã¯åˆ©ç”¨è€…ãƒ»æ¥­å‹™ãŒå¿…è¦ã¨ã™ã‚‹æ©Ÿèƒ½ã€æ€§èƒ½ã€ä¿¡é ¼æ€§ã€ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£ã€åˆ¶ç´„ã‚’æ˜Žç¢ºã«ã—ã¾ã™ã€ã€‚è¦ä»¶å®šç¾©ã§ã¯ã€åˆ©ç”¨è€…ãŒå¿…è¦ã¨ã™ã‚‹æ©Ÿèƒ½ãƒ»æ€§èƒ½ãƒ»åˆ¶ç´„ãªã©ã€ã‚·ã‚¹ãƒ†ãƒ ãŒæº€ãŸã™ã¹ãæ¡ä»¶ã‚’æ˜Žç¢ºã«ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒ—ãƒ­ã‚°ãƒ©ãƒŸãƒ³ã‚°ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "è¦ä»¶å®šç¾©ã§ã¯ã€åˆ©ç”¨è€…ãŒå¿…è¦ã¨ã™ã‚‹æ©Ÿèƒ½ãƒ»æ€§èƒ½ãƒ»åˆ¶ç´„ãªã©ã€ã‚·ã‚¹ãƒ†ãƒ ãŒæº€ãŸã™ã¹ãæ¡ä»¶ã‚’æ˜Žç¢ºã«ã—ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã‚·ã‚¹ãƒ†ãƒ è¦ä»¶å®šç¾©ã§ã¯åˆ©ç”¨è€…ãƒ»æ¥­å‹™ãŒå¿…è¦ã¨ã™ã‚‹æ©Ÿèƒ½ã€æ€§èƒ½ã€ä¿¡é ¼æ€§ã€ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£ã€åˆ¶ç´„ã‚’æ˜Žç¢ºã«ã—ã¾ã™ã€ã€‚è¦ä»¶å®šç¾©ã§ã¯ã€åˆ©ç”¨è€…ãŒå¿…è¦ã¨ã™ã‚‹æ©Ÿèƒ½ãƒ»æ€§èƒ½ãƒ»åˆ¶ç´„ãªã©ã€ã‚·ã‚¹ãƒ†ãƒ ãŒæº€ãŸã™ã¹ãæ¡ä»¶ã‚’æ˜Žç¢ºã«ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒåŸºæœ¬è¨­è¨ˆã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_12_02",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "mgmt-06",
    "cat": "ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ",
    "concept": "ãƒ†ã‚¹ãƒˆ",
    "difficulty": "æ¨™æº–",
    "q": "è¤‡æ•°ã®ãƒ¢ã‚¸ãƒ¥ãƒ¼ãƒ«ã‚’çµ„ã¿åˆã‚ã›ã€ã‚¤ãƒ³ã‚¿ãƒ•ã‚§ãƒ¼ã‚¹ã‚„é€£æºã‚’ç¢ºèªã™ã‚‹ãƒ†ã‚¹ãƒˆã¯ï¼Ÿ",
    "options": [
      "å—å…¥ãƒ†ã‚¹ãƒˆ",
      "å˜ä½“ãƒ†ã‚¹ãƒˆ",
      "ã‚·ã‚¹ãƒ†ãƒ ãƒ†ã‚¹ãƒˆ",
      "çµåˆãƒ†ã‚¹ãƒˆ"
    ],
    "a": 3,
    "exp": "çµåˆãƒ†ã‚¹ãƒˆã§ã¯ã€è¤‡æ•°ã®ãƒ¢ã‚¸ãƒ¥ãƒ¼ãƒ«ã‚’çµ„ã¿åˆã‚ã›ã€ãƒ¢ã‚¸ãƒ¥ãƒ¼ãƒ«é–“ã®ã‚¤ãƒ³ã‚¿ãƒ•ã‚§ãƒ¼ã‚¹ã‚„ãƒ‡ãƒ¼ã‚¿ã®å—æ¸¡ã—ã‚’ç¢ºèªã—ã¾ã™ã€‚",
    "hint": "å˜ä½“ãƒ†ã‚¹ãƒˆã®æ¬¡ã«ã€ãƒ¢ã‚¸ãƒ¥ãƒ¼ãƒ«åŒå£«ã‚’çµ„ã¿åˆã‚ã›ã¦ç¢ºèªã—ã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œçµåˆãƒ†ã‚¹ãƒˆï¼šéƒ¨å“åŒå£«ã®é€£æºã€ã€‚çµåˆãƒ†ã‚¹ãƒˆã§ã¯ã€è¤‡æ•°ã®ãƒ¢ã‚¸ãƒ¥ãƒ¼ãƒ«ã‚’çµ„ã¿åˆã‚ã›ã€ãƒ¢ã‚¸ãƒ¥ãƒ¼ãƒ«é–“ã®ã‚¤ãƒ³ã‚¿ãƒ•ã‚§ãƒ¼ã‚¹ã‚„ãƒ‡ãƒ¼ã‚¿ã®å—æ¸¡ã—ã‚’ç¢ºèªã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå—å…¥ãƒ†ã‚¹ãƒˆã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œå˜ä½“ãƒ†ã‚¹ãƒˆã€ã¯ã€ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã®å°ã•ãªéƒ¨å“å˜ä½ã§æ­£ã—ãå‹•ãã‹ã‚’ç¢ºèªã™ã‚‹ãƒ†ã‚¹ãƒˆã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œã‚·ã‚¹ãƒ†ãƒ ãƒ†ã‚¹ãƒˆã€ã¯ã€å®Œæˆã—ãŸã‚·ã‚¹ãƒ†ãƒ å…¨ä½“ãŒè¦ä»¶ã‚’æº€ãŸã™ã‹ç¢ºèªã™ã‚‹ãƒ†ã‚¹ãƒˆã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "çµåˆãƒ†ã‚¹ãƒˆã§ã¯ã€è¤‡æ•°ã®ãƒ¢ã‚¸ãƒ¥ãƒ¼ãƒ«ã‚’çµ„ã¿åˆã‚ã›ã€ãƒ¢ã‚¸ãƒ¥ãƒ¼ãƒ«é–“ã®ã‚¤ãƒ³ã‚¿ãƒ•ã‚§ãƒ¼ã‚¹ã‚„ãƒ‡ãƒ¼ã‚¿ã®å—æ¸¡ã—ã‚’ç¢ºèªã—ã¾ã™ã€‚"
    ],
    "explainTopicId": "core_12_05",
    "explainTopicSource": "manual",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "mgmt-07",
    "cat": "ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ",
    "concept": "ã‚¯ãƒªãƒ†ã‚£ã‚«ãƒ«ãƒ‘ã‚¹",
    "difficulty": "æ¨™æº–",
    "q": "ã‚¢ãƒ­ãƒ¼ãƒ€ã‚¤ã‚¢ã‚°ãƒ©ãƒ ãªã©ã§ã€é…å»¶ã™ã‚‹ã¨ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆå…¨ä½“ã®å®Œäº†æ—¥ã‚‚é…ã‚Œã‚‹ã€ä½™è£•æ™‚é–“ãŒ0ã®çµŒè·¯ã‚’ä½•ã¨å‘¼ã¶ï¼Ÿ",
    "options": [
      "ã‚¯ãƒªãƒ†ã‚£ã‚«ãƒ«ãƒ‘ã‚¹",
      "æœ€çŸ­çµŒè·¯",
      "ãƒ€ãƒŸãƒ¼ä½œæ¥­",
      "ãƒžã‚¤ãƒ«ã‚¹ãƒˆãƒ¼ãƒ³"
    ],
    "a": 0,
    "exp": "ã‚¯ãƒªãƒ†ã‚£ã‚«ãƒ«ãƒ‘ã‚¹ã¯æ‰€è¦æ™‚é–“ãŒæœ€é•·ã§ã€é€šå¸¸ã¯ä½™è£•æ™‚é–“ãŒ0ã¨ãªã‚‹çµŒè·¯ã§ã™ã€‚ã“ã®çµŒè·¯ã®é…å»¶ã¯ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆå…¨ä½“ã®é…å»¶ã«ã¤ãªãŒã‚Šã¾ã™ã€‚",
    "hint": "é…ã‚‰ã›ã‚‹ä½™è£•ãŒãªã„çµŒè·¯ã§ã™ã€‚",
    "choiceExps": [
      "ã‚¯ãƒªãƒ†ã‚£ã‚«ãƒ«ãƒ‘ã‚¹ã¯æ‰€è¦æ™‚é–“ãŒæœ€é•·ã§ã€é€šå¸¸ã¯ä½™è£•æ™‚é–“ãŒ0ã¨ãªã‚‹çµŒè·¯ã§ã™ã€‚ã“ã®çµŒè·¯ã®é…å»¶ã¯ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆå…¨ä½“ã®é…å»¶ã«ã¤ãªãŒã‚Šã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã‚¯ãƒªãƒ†ã‚£ã‚«ãƒ«ãƒ‘ã‚¹ã¯æœ€é•·æ‰€è¦æ™‚é–“çµŒè·¯ã€ã€‚ã‚¯ãƒªãƒ†ã‚£ã‚«ãƒ«ãƒ‘ã‚¹ã¯æ‰€è¦æ™‚é–“ãŒæœ€é•·ã§ã€é€šå¸¸ã¯ä½™è£•æ™‚é–“ãŒ0ã¨ãªã‚‹çµŒè·¯ã§ã™ã€‚ã“ã®çµŒè·¯ã®é…å»¶ã¯ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆå…¨ä½“ã®é…å»¶ã«ã¤ãªãŒã‚Šã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œæœ€çŸ­çµŒè·¯ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã‚¯ãƒªãƒ†ã‚£ã‚«ãƒ«ãƒ‘ã‚¹ã¯æœ€é•·æ‰€è¦æ™‚é–“çµŒè·¯ã€ã€‚ã‚¯ãƒªãƒ†ã‚£ã‚«ãƒ«ãƒ‘ã‚¹ã¯æ‰€è¦æ™‚é–“ãŒæœ€é•·ã§ã€é€šå¸¸ã¯ä½™è£•æ™‚é–“ãŒ0ã¨ãªã‚‹çµŒè·¯ã§ã™ã€‚ã“ã®çµŒè·¯ã®é…å»¶ã¯ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆå…¨ä½“ã®é…å»¶ã«ã¤ãªãŒã‚Šã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒ€ãƒŸãƒ¼ä½œæ¥­ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã‚¯ãƒªãƒ†ã‚£ã‚«ãƒ«ãƒ‘ã‚¹ã¯æœ€é•·æ‰€è¦æ™‚é–“çµŒè·¯ã€ã€‚ã‚¯ãƒªãƒ†ã‚£ã‚«ãƒ«ãƒ‘ã‚¹ã¯æ‰€è¦æ™‚é–“ãŒæœ€é•·ã§ã€é€šå¸¸ã¯ä½™è£•æ™‚é–“ãŒ0ã¨ãªã‚‹çµŒè·¯ã§ã™ã€‚ã“ã®çµŒè·¯ã®é…å»¶ã¯ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆå…¨ä½“ã®é…å»¶ã«ã¤ãªãŒã‚Šã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒžã‚¤ãƒ«ã‚¹ãƒˆãƒ¼ãƒ³ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_14_04",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "åŽŸå‰‡ãƒ»é–¢ä¿‚"
  },
  {
    "id": "mgmt-08",
    "cat": "ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ",
    "concept": "SLA",
    "difficulty": "æ¨™æº–",
    "q": "SLAã§æœˆé–“ç¨¼åƒçŽ‡99.9%ä»¥ä¸Šã¨å®šã‚ãŸã€‚30æ—¥ã‚’720æ™‚é–“ã¨ã™ã‚‹ã¨ã€è¨±å®¹ã•ã‚Œã‚‹åœæ­¢æ™‚é–“ã¯æœ€å¤§ã§ãŠã‚ˆãä½•åˆ†ï¼Ÿ",
    "options": [
      "72åˆ†",
      "43.2åˆ†",
      "432åˆ†",
      "7.2åˆ†"
    ],
    "a": 1,
    "exp": "åœæ­¢å¯èƒ½ãªå‰²åˆã¯0.1%=0.001ã§ã™ã€‚720æ™‚é–“Ã—0.001=0.72æ™‚é–“ãªã®ã§ã€0.72Ã—60=43.2åˆ†ã§ã™ã€‚",
    "hint": "99.9%ç¨¼åƒãªã‚‰ã€åœæ­¢ã§ãã‚‹ã®ã¯å…¨æ™‚é–“ã®0.1%ã§ã™ã€‚",
    "choiceExps": [
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ43.2åˆ†ã€ã«ãªã‚‹ã€‚åœæ­¢å¯èƒ½ãªå‰²åˆã¯0.1%=0.001ã§ã™ã€‚720æ™‚é–“Ã—0.001=0.72æ™‚é–“ãªã®ã§ã€0.72Ã—60=43.2åˆ†ã§ã™ã€‚",
      "åœæ­¢å¯èƒ½ãªå‰²åˆã¯0.1%=0.001ã§ã™ã€‚720æ™‚é–“Ã—0.001=0.72æ™‚é–“ãªã®ã§ã€0.72Ã—60=43.2åˆ†ã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ43.2åˆ†ã€ã«ãªã‚‹ã€‚åœæ­¢å¯èƒ½ãªå‰²åˆã¯0.1%=0.001ã§ã™ã€‚720æ™‚é–“Ã—0.001=0.72æ™‚é–“ãªã®ã§ã€0.72Ã—60=43.2åˆ†ã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ43.2åˆ†ã€ã«ãªã‚‹ã€‚åœæ­¢å¯èƒ½ãªå‰²åˆã¯0.1%=0.001ã§ã™ã€‚720æ™‚é–“Ã—0.001=0.72æ™‚é–“ãªã®ã§ã€0.72Ã—60=43.2åˆ†ã§ã™ã€‚"
    ],
    "explainTopicId": "core_15_02",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "strat-05",
    "cat": "ã‚¹ãƒˆãƒ©ãƒ†ã‚¸",
    "concept": "çŸ¥çš„è²¡ç”£",
    "difficulty": "åŸºç¤Ž",
    "q": "å•†å“ã‚„ã‚µãƒ¼ãƒ“ã‚¹ã‚’ä»–ç¤¾ã®ã‚‚ã®ã¨åŒºåˆ¥ã™ã‚‹ãŸã‚ã®åç§°ãƒ»ãƒ­ã‚´ãªã©ã‚’ä¿è­·ã™ã‚‹ç”£æ¥­è²¡ç”£æ¨©ã¯ï¼Ÿ",
    "options": [
      "å®Ÿç”¨æ–°æ¡ˆæ¨©",
      "ç‰¹è¨±æ¨©",
      "å•†æ¨™æ¨©",
      "æ„åŒ æ¨©"
    ],
    "a": 2,
    "exp": "å•†å“åã€ã‚µãƒ¼ãƒ“ã‚¹åã€ãƒ­ã‚´ãªã©ã€å•†å“ãƒ»ã‚µãƒ¼ãƒ“ã‚¹ã‚’è­˜åˆ¥ã™ã‚‹æ¨™è­˜ã‚’ä¿è­·ã™ã‚‹ã®ãŒå•†æ¨™æ¨©ã§ã™ã€‚",
    "hint": "ãƒ–ãƒ©ãƒ³ãƒ‰åã‚„ãƒ­ã‚´ã‚’ä¿è­·ã™ã‚‹æ¨©åˆ©ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå•†æ¨™æ¨©ï¼šå•†å“ãƒ»ã‚µãƒ¼ãƒ“ã‚¹ã‚’åŒºåˆ¥ã™ã‚‹åç§°ãƒ»ãƒ­ã‚´ãªã©ã€‚ç™»éŒ²ãŒå¿…è¦ã€ã€‚å•†å“åã€ã‚µãƒ¼ãƒ“ã‚¹åã€ãƒ­ã‚´ãªã©ã€å•†å“ãƒ»ã‚µãƒ¼ãƒ“ã‚¹ã‚’è­˜åˆ¥ã™ã‚‹æ¨™è­˜ã‚’ä¿è­·ã™ã‚‹ã®ãŒå•†æ¨™æ¨©ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå®Ÿç”¨æ–°æ¡ˆæ¨©ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œç‰¹è¨±æ¨©ã€ã¯ã€æ–°ã—ã„æŠ€è¡“çš„ãªç™ºæ˜Žã‚’ä¿è­·ã™ã‚‹æ¨©åˆ©ã§ã™ã€‚ç™»éŒ²ãŒå¿…è¦ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "å•†å“åã€ã‚µãƒ¼ãƒ“ã‚¹åã€ãƒ­ã‚´ãªã©ã€å•†å“ãƒ»ã‚µãƒ¼ãƒ“ã‚¹ã‚’è­˜åˆ¥ã™ã‚‹æ¨™è­˜ã‚’ä¿è­·ã™ã‚‹ã®ãŒå•†æ¨™æ¨©ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå•†æ¨™æ¨©ï¼šå•†å“ãƒ»ã‚µãƒ¼ãƒ“ã‚¹ã‚’åŒºåˆ¥ã™ã‚‹åç§°ãƒ»ãƒ­ã‚´ãªã©ã€‚ç™»éŒ²ãŒå¿…è¦ã€ã€‚å•†å“åã€ã‚µãƒ¼ãƒ“ã‚¹åã€ãƒ­ã‚´ãªã©ã€å•†å“ãƒ»ã‚µãƒ¼ãƒ“ã‚¹ã‚’è­˜åˆ¥ã™ã‚‹æ¨™è­˜ã‚’ä¿è­·ã™ã‚‹ã®ãŒå•†æ¨™æ¨©ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œæ„åŒ æ¨©ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_21_01",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "strat-06",
    "cat": "ã‚¹ãƒˆãƒ©ãƒ†ã‚¸",
    "concept": "æç›Šåˆ†å²ç‚¹",
    "difficulty": "åŸºç¤Ž",
    "q": "æ–°å•†å“ã®å£²ä¸Šé«˜ãŒç·è²»ç”¨ã¨ã¡ã‚‡ã†ã©ä¸€è‡´ã—ãŸã€‚ã“ã®æ™‚ç‚¹ã§ã¯å›ºå®šè²»ã¨å¤‰å‹•è²»ã‚’ã™ã¹ã¦å›žåŽã—ã¦ã„ã‚‹ãŒã€è¶…éŽåˆ†ã¯ãªã„ã€‚åˆ©ç›Šã¯ã„ãã‚‰ã‹ã€‚",
    "options": [
      "å£²ä¸Šé«˜ã¨åŒé¡",
      "å›ºå®šè²»ãŒæ®‹ã‚‹ãŸã‚èµ¤å­—ã¨ãªã‚‹",
      "å›ºå®šè²»ã¨åŒé¡",
      "0"
    ],
    "a": 3,
    "exp": "å£²ä¸Šé«˜ï¼ç·è²»ç”¨ãŒåˆ©ç›Šãªã®ã§ã€ä¸¡è€…ãŒç­‰ã—ã„æç›Šåˆ†å²ç‚¹ã§ã¯åˆ©ç›Šã¯0ã§ã™ã€‚",
    "hint": "å£²ä¸Šé«˜ = ç·è²»ç”¨ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œæç›Šåˆ†å²ç‚¹ã¯å£²ä¸Šé«˜ã¨ç·è²»ç”¨ãŒç­‰ã—ãåˆ©ç›Š0ã¨ãªã‚‹ç‚¹ã§ã™ã€‚å›ºå®šè²»ãƒ»å¤‰å‹•è²»ãƒ»å¤‰å‹•è²»çŽ‡ã‹ã‚‰è¨ˆç®—ã—ã¾ã™ã€ã€‚å£²ä¸Šé«˜ï¼ç·è²»ç”¨ãŒåˆ©ç›Šãªã®ã§ã€ä¸¡è€…ãŒç­‰ã—ã„æç›Šåˆ†å²ç‚¹ã§ã¯åˆ©ç›Šã¯0ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå£²ä¸Šé«˜ã¨åŒé¡ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œæç›Šåˆ†å²ç‚¹ã¯å£²ä¸Šé«˜ã¨ç·è²»ç”¨ãŒç­‰ã—ãåˆ©ç›Š0ã¨ãªã‚‹ç‚¹ã§ã™ã€‚å›ºå®šè²»ãƒ»å¤‰å‹•è²»ãƒ»å¤‰å‹•è²»çŽ‡ã‹ã‚‰è¨ˆç®—ã—ã¾ã™ã€ã€‚ã“ã®ãŸã‚ã€Œå›ºå®šè²»ãŒæ®‹ã‚‹ãŸã‚èµ¤å­—ã¨ãªã‚‹ã€ã®ã‚ˆã†ã«æ–­å®šã™ã‚‹ã¨ã€å•é¡Œã®æ¡ä»¶ãƒ»å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œå›ºå®šè²»ã€ã¯ã€å£²ä¸Šé‡ãŒå¤‰ã‚ã£ã¦ã‚‚ä¸€å®šç¯„å›²ã§ã¯ã»ã¼å¤‰ã‚ã‚‰ãªã„è²»ç”¨ã§ã™ã€‚å®¶è³ƒãªã©ãŒä¾‹ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "å£²ä¸Šé«˜ï¼ç·è²»ç”¨ãŒåˆ©ç›Šãªã®ã§ã€ä¸¡è€…ãŒç­‰ã—ã„æç›Šåˆ†å²ç‚¹ã§ã¯åˆ©ç›Šã¯0ã§ã™ã€‚"
    ],
    "explainTopicId": "core_20_04",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "theory-05",
    "cat": "åŸºç¤Žç†è«–",
    "concept": "ã‚ªãƒ¼ãƒˆãƒžãƒˆãƒ³",
    "difficulty": "æ¨™æº–",
    "q": "çŠ¶æ…‹Aã§å…¥åŠ›1ã‚’å—ã‘ã‚‹ã¨Bã¸ã€çŠ¶æ…‹Bã§å…¥åŠ›1ã‚’å—ã‘ã‚‹ã¨Aã¸ç§»ã‚‹ã€‚åˆæœŸçŠ¶æ…‹Aã‹ã‚‰å…¥åŠ›åˆ—1,1ã‚’ä¸ŽãˆãŸæœ€çµ‚çŠ¶æ…‹ã¯ï¼Ÿ",
    "options": [
      "A",
      "çµ‚äº†çŠ¶æ…‹",
      "ä¸æ˜Ž",
      "B"
    ],
    "a": 0,
    "exp": "Aâ†’(1)Bâ†’(1)Aã¨é·ç§»ã™ã‚‹ã®ã§æœ€çµ‚çŠ¶æ…‹ã¯Aã§ã™ã€‚",
    "hint": "å…¥åŠ›ã‚’1å€‹ãšã¤é †ã«é©ç”¨ã—ã¾ã™ã€‚",
    "choiceExps": [
      "Aâ†’(1)Bâ†’(1)Aã¨é·ç§»ã™ã‚‹ã®ã§æœ€çµ‚çŠ¶æ…‹ã¯Aã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒçŠ¶æ…‹Aã§1ãªã‚‰Bã€Bã§1ãªã‚‰Aã¨ã„ã†è¦å‰‡ãªã‚‰å…¥åŠ›11ã§Aã¸æˆ»ã‚Šã¾ã™ã€ã€‚Aâ†’(1)Bâ†’(1)Aã¨é·ç§»ã™ã‚‹ã®ã§æœ€çµ‚çŠ¶æ…‹ã¯Aã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œçµ‚äº†çŠ¶æ…‹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒçŠ¶æ…‹Aã§1ãªã‚‰Bã€Bã§1ãªã‚‰Aã¨ã„ã†è¦å‰‡ãªã‚‰å…¥åŠ›11ã§Aã¸æˆ»ã‚Šã¾ã™ã€ã€‚Aâ†’(1)Bâ†’(1)Aã¨é·ç§»ã™ã‚‹ã®ã§æœ€çµ‚çŠ¶æ…‹ã¯Aã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œä¸æ˜Žã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒçŠ¶æ…‹Aã§1ãªã‚‰Bã€Bã§1ãªã‚‰Aã¨ã„ã†è¦å‰‡ãªã‚‰å…¥åŠ›11ã§Aã¸æˆ»ã‚Šã¾ã™ã€ã€‚Aâ†’(1)Bâ†’(1)Aã¨é·ç§»ã™ã‚‹ã®ã§æœ€çµ‚çŠ¶æ…‹ã¯Aã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒBã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_02_04",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "hardware-01",
    "cat": "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿",
    "concept": "åŠå°Žä½“ãƒ¡ãƒ¢ãƒª",
    "difficulty": "åŸºç¤Ž",
    "q": "ä¸»è¨˜æ†¶ã¨ã—ã¦ã€é›»æºã‚’åˆ‡ã‚‹ã¨å†…å®¹ãŒå¤±ã‚ã‚Œã¦ã‚‚ã‚ˆã„é«˜é€ŸãªåŠå°Žä½“ãƒ¡ãƒ¢ãƒªã‚’é¸ã¶ã€‚ä¸€èˆ¬ã«è©²å½“ã™ã‚‹ã‚‚ã®ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "å…‰ãƒ‡ã‚£ã‚¹ã‚¯",
      "RAM",
      "ROM",
      "ãƒ•ãƒ©ãƒƒã‚·ãƒ¥ãƒ¡ãƒ¢ãƒª"
    ],
    "a": 1,
    "exp": "RAMã¯ä¸€èˆ¬ã«æ®ç™ºæ€§ã§ã€é›»æºã‚’åˆ‡ã‚‹ã¨å†…å®¹ãŒå¤±ã‚ã‚Œã¾ã™ã€‚",
    "hint": "ä¸»è¨˜æ†¶ã¨ã—ã¦ä½¿ã‚ã‚Œã‚‹ä»£è¡¨çš„ãªãƒ¡ãƒ¢ãƒªã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒDRAMã¨SRAMã®ç”¨é€”ã‚’å¯¾æ¯”ã™ã‚‹ã€ã€‚RAMã¯ä¸€èˆ¬ã«æ®ç™ºæ€§ã§ã€é›»æºã‚’åˆ‡ã‚‹ã¨å†…å®¹ãŒå¤±ã‚ã‚Œã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå…‰ãƒ‡ã‚£ã‚¹ã‚¯ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "RAMã¯ä¸€èˆ¬ã«æ®ç™ºæ€§ã§ã€é›»æºã‚’åˆ‡ã‚‹ã¨å†…å®¹ãŒå¤±ã‚ã‚Œã¾ã™ã€‚",
      "ã€ŒROMã€ã¯ã€Read Only Memoryã€‚é›»æºã‚’åˆ‡ã£ã¦ã‚‚å†…å®¹ãŒæ®‹ã‚‹ä¸æ®ç™ºæ€§ãƒ¡ãƒ¢ãƒªã®ç·ç§°ã¨ã—ã¦ä½¿ã‚ã‚Œã‚‹ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œãƒ•ãƒ©ãƒƒã‚·ãƒ¥ãƒ¡ãƒ¢ãƒªã€ã¯ã€é›»æºã‚’åˆ‡ã£ã¦ã‚‚å†…å®¹ãŒæ®‹ã‚‹åŠå°Žä½“ãƒ¡ãƒ¢ãƒªã§ã€SSDã‚„USBãƒ¡ãƒ¢ãƒªãªã©ã«ä½¿ã‚ã‚Œã¾ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_07_01",
    "explainTopicSource": "semantic",
    "cognitiveRewrite": "v90-context",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "å½¹å‰²é¸æŠž"
  },
  {
    "id": "software-01",
    "cat": "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿",
    "concept": "ãƒ•ã‚¡ã‚¤ãƒ«ã‚·ã‚¹ãƒ†ãƒ ",
    "difficulty": "åŸºç¤Ž",
    "q": "ç¾åœ¨ä½ç½®ã«ä¾å­˜ã›ãšåŒã˜ãƒ•ã‚¡ã‚¤ãƒ«ã‚’æŒ‡å®šã—ãŸã„ã€‚ãƒ«ãƒ¼ãƒˆç›´ä¸‹ã®homeã€ãã®ä¸‹ã®userã€ãã®ä¸‹ã®data.csvã‚’è¡¨ã™çµ¶å¯¾ãƒ‘ã‚¹ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "../data.csv",
      "data.csv/home",
      "/home/user/data.csv",
      "home/user/data.csv"
    ],
    "a": 2,
    "exp": "çµ¶å¯¾ãƒ‘ã‚¹ã¯ãƒ«ãƒ¼ãƒˆ/ã‹ã‚‰éšŽå±¤ã‚’é †ã«è¨˜è¿°ã—ã¾ã™ã€‚",
    "hint": "å…ˆé ­ã¯/ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ/home/user/a.txtã¯ãƒ«ãƒ¼ãƒˆã‹ã‚‰ã®çµ¶å¯¾ãƒ‘ã‚¹ã§ã™ã€ã€‚çµ¶å¯¾ãƒ‘ã‚¹ã¯ãƒ«ãƒ¼ãƒˆ/ã‹ã‚‰éšŽå±¤ã‚’é †ã«è¨˜è¿°ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ../data.csvã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ/home/user/a.txtã¯ãƒ«ãƒ¼ãƒˆã‹ã‚‰ã®çµ¶å¯¾ãƒ‘ã‚¹ã§ã™ã€ã€‚çµ¶å¯¾ãƒ‘ã‚¹ã¯ãƒ«ãƒ¼ãƒˆ/ã‹ã‚‰éšŽå±¤ã‚’é †ã«è¨˜è¿°ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œdata.csv/homeã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "çµ¶å¯¾ãƒ‘ã‚¹ã¯ãƒ«ãƒ¼ãƒˆ/ã‹ã‚‰éšŽå±¤ã‚’é †ã«è¨˜è¿°ã—ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ/home/user/a.txtã¯ãƒ«ãƒ¼ãƒˆã‹ã‚‰ã®çµ¶å¯¾ãƒ‘ã‚¹ã§ã™ã€ã€‚çµ¶å¯¾ãƒ‘ã‚¹ã¯ãƒ«ãƒ¼ãƒˆ/ã‹ã‚‰éšŽå±¤ã‚’é †ã«è¨˜è¿°ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œhome/user/data.csvã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_06_02",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "ui-01",
    "cat": "ã‚¹ãƒˆãƒ©ãƒ†ã‚¸",
    "concept": "ã‚¢ã‚¯ã‚»ã‚·ãƒ“ãƒªãƒ†ã‚£",
    "difficulty": "åŸºç¤Ž",
    "q": "ã‚¨ãƒ©ãƒ¼çŠ¶æ…‹ã‚’èµ¤ã€æ­£å¸¸çŠ¶æ…‹ã‚’ç·‘ã§è¡¨ç¤ºã™ã‚‹ç”»é¢ã‚’è¨­è¨ˆã—ã¦ã„ã‚‹ã€‚è‰²è¦šã®é•ã„ãŒã‚ã‚‹åˆ©ç”¨è€…ã«ã‚‚åŒºåˆ¥ã§ãã€ãƒ¢ãƒŽã‚¯ãƒ­è¡¨ç¤ºã§ã‚‚æ„å‘³ãŒå¤±ã‚ã‚Œã«ãã„è¨­è¨ˆã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ã‚³ãƒ³ãƒˆãƒ©ã‚¹ãƒˆã‚’ä½Žãã—ã¦åˆºæ¿€ã‚’æ¸›ã‚‰ã™",
      "é‡è¦ãªæ“ä½œã¯ãƒ›ãƒãƒ¼æ™‚ã«è£œè¶³èª¬æ˜Žã‚’è¡¨ç¤ºã—ã€è‰²ã®é•ã„ã‚’ä¸­å¿ƒã«çŠ¶æ…‹ã‚’ä¼ãˆã‚‹",
      "èµ¤ã¨ç·‘ã®è‰²ç›¸å·®ã‚’å¤§ããã—ã€çŠ¶æ…‹åã¯ãƒ„ãƒ¼ãƒ«ãƒãƒƒãƒ—ã§è£œè¶³ã™ã‚‹",
      "è‰²ã«åŠ ãˆã¦æ–‡å­—ã‚„ã‚¢ã‚¤ã‚³ãƒ³ã§ã‚‚çŠ¶æ…‹ã‚’ç¤ºã™"
    ],
    "a": 3,
    "exp": "è‰²ã ã‘ã«ä¾å­˜ã›ãšã€æ–‡å­—ã‚„ã‚¢ã‚¤ã‚³ãƒ³ãªã©åˆ¥ã®æ‰‹æŽ›ã‹ã‚Šã‚‚ä½µç”¨ã™ã‚‹ã¨ã€è‰²è¦šå·®ã‚„è¡¨ç¤ºæ¡ä»¶ãŒå¤‰ã‚ã£ã¦ã‚‚çŠ¶æ…‹ã‚’åŒºåˆ¥ã—ã‚„ã™ã„ã€‚",
    "hint": "æƒ…å ±ã‚’ä¼ãˆã‚‹æ‰‹æ®µã‚’ã€Žè‰²ã ã‘ã€ã«ã—ãªã„ã€‚",
    "choiceExps": [
      "ã‚³ãƒ³ãƒˆãƒ©ã‚¹ãƒˆã‚’ä¸‹ã’ã‚‹ã¨åˆ¤åˆ¥ã—ã«ãããªã‚‹å ´åˆãŒã‚ã‚‹ã€‚",
      "ãƒ›ãƒãƒ¼ã ã‘ã§ã¯ã‚¿ãƒƒãƒæ“ä½œã‚„ã‚­ãƒ¼ãƒœãƒ¼ãƒ‰æ“ä½œã§æƒ…å ±ã¸åˆ°é”ã—ã«ãã„ã€‚",
      "è‰²ã ã‘ã«æ„å‘³ã‚’æŒãŸã›ã‚‹ã¨è‰²è¦šå·®ã‚„ãƒ¢ãƒŽã‚¯ãƒ­è¡¨ç¤ºã§åŒºåˆ¥ã—ã«ãã„ã€‚",
      "è‰²ã ã‘ã«ä¾å­˜ã›ãšã€æ–‡å­—ã‚„ã‚¢ã‚¤ã‚³ãƒ³ãªã©åˆ¥ã®æ‰‹æŽ›ã‹ã‚Šã‚‚ä½µç”¨ã™ã‚‹ã¨ã€è‰²è¦šå·®ã‚„è¡¨ç¤ºæ¡ä»¶ãŒå¤‰ã‚ã£ã¦ã‚‚çŠ¶æ…‹ã‚’åŒºåˆ¥ã—ã‚„ã™ã„ã€‚"
    ],
    "explainTopicId": "core_08_02",
    "explainTopicSource": "manual",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-rewritten",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "media-01",
    "cat": "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿",
    "concept": "ç”»åƒãƒ‡ãƒ¼ã‚¿é‡",
    "difficulty": "æ¨™æº–",
    "q": "200Ã—100ç”»ç´ ã€1ç”»ç´ 8ãƒ“ãƒƒãƒˆã®éžåœ§ç¸®ç”»åƒã®ãƒ‡ãƒ¼ã‚¿é‡ã¯ä½•ãƒ“ãƒƒãƒˆï¼Ÿ",
    "options": [
      "160,000",
      "800",
      "20,000",
      "1,600"
    ],
    "a": 0,
    "exp": "200Ã—100Ã—8=160,000ãƒ“ãƒƒãƒˆã§ã™ã€‚",
    "hint": "ç”»ç´ æ•°Ã—1ç”»ç´ ã®ãƒ“ãƒƒãƒˆæ•°ã§ã™ã€‚",
    "choiceExps": [
      "200Ã—100Ã—8=160,000ãƒ“ãƒƒãƒˆã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ800Ã—600ç”»ç´ ãƒ»24bitãªã‚‰11,520,000bitã§ã€8ã§å‰²ã‚‹ã¨1,440,000byteã€ã€‚200Ã—100Ã—8=160,000ãƒ“ãƒƒãƒˆã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ800ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ800Ã—600ç”»ç´ ãƒ»24bitãªã‚‰11,520,000bitã§ã€8ã§å‰²ã‚‹ã¨1,440,000byteã€ã€‚200Ã—100Ã—8=160,000ãƒ“ãƒƒãƒˆã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ20,000ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ800Ã—600ç”»ç´ ãƒ»24bitãªã‚‰11,520,000bitã§ã€8ã§å‰²ã‚‹ã¨1,440,000byteã€ã€‚200Ã—100Ã—8=160,000ãƒ“ãƒƒãƒˆã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ1,600ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_08_03",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "mgmt-09",
    "cat": "ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ",
    "concept": "é–‹ç™ºãƒ¢ãƒ‡ãƒ«",
    "difficulty": "åŸºç¤Ž",
    "q": "é–‹ç™ºãƒãƒ¼ãƒ ãŒ2é€±é–“ã”ã¨ã«å‹•ãã‚½ãƒ•ãƒˆã‚¦ã‚§ã‚¢ã‚’æä¾›ã—ã€åˆ©ç”¨è€…ã®ãƒ•ã‚£ãƒ¼ãƒ‰ãƒãƒƒã‚¯ã‚’æ¬¡ã®åå¾©ã¸å–ã‚Šè¾¼ã‚“ã§ã„ã‚‹ã€‚ã“ã®é–‹ç™ºã‚¢ãƒ—ãƒ­ãƒ¼ãƒã«æœ€ã‚‚è¿‘ã„ã‚‚ã®ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ã‚¦ã‚©ãƒ¼ã‚¿ãƒ¼ãƒ•ã‚©ãƒ¼ãƒ«é–‹ç™º",
      "ã‚¢ã‚¸ãƒ£ã‚¤ãƒ«é–‹ç™º",
      "Vå­—ãƒ¢ãƒ‡ãƒ«",
      "ä¸€æ‹¬ç§»è¡Œ"
    ],
    "a": 1,
    "exp": "ã‚¢ã‚¸ãƒ£ã‚¤ãƒ«é–‹ç™ºã§ã¯ã€çŸ­ã„åå¾©ã®ä¸­ã§è¨ˆç”»ãƒ»å®Ÿè£…ãƒ»ç¢ºèªãªã©ã‚’ç¹°ã‚Šè¿”ã—ã€ä¾¡å€¤ã‚’æ®µéšŽçš„ã«æä¾›ã—ã¾ã™ã€‚",
    "hint": "çŸ­ã„åå¾©ã‚’ç¹°ã‚Šè¿”ã—ãªãŒã‚‰æ”¹å–„ã™ã‚‹é–‹ç™ºæ–¹æ³•ã§ã™ã€‚",
    "choiceExps": [
      "ã€Œã‚¦ã‚©ãƒ¼ã‚¿ãƒ¼ãƒ•ã‚©ãƒ¼ãƒ«ã€ã¯ã€å·¥ç¨‹ã‚’ä¸Šæµã‹ã‚‰é †ç•ªã«é€²ã‚ã‚‹é–‹ç™ºãƒ¢ãƒ‡ãƒ«ã§ã™ã€‚è¨ˆç”»ã‚’ç«‹ã¦ã‚„ã™ã„ä¸€æ–¹ã€å¤§ããªå¤‰æ›´ã«ã¯å¼±ã„å‚¾å‘ãŒã‚ã‚Šã¾ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã‚¢ã‚¸ãƒ£ã‚¤ãƒ«é–‹ç™ºã§ã¯ã€çŸ­ã„åå¾©ã®ä¸­ã§è¨ˆç”»ãƒ»å®Ÿè£…ãƒ»ç¢ºèªãªã©ã‚’ç¹°ã‚Šè¿”ã—ã€ä¾¡å€¤ã‚’æ®µéšŽçš„ã«æä¾›ã—ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã‚¢ã‚¸ãƒ£ã‚¤ãƒ«ã¯çŸ­ã„åå¾©ã§ä¾¡å€¤ã‚’å±Šã‘ã‚‹ã€ã€‚ã‚¢ã‚¸ãƒ£ã‚¤ãƒ«é–‹ç™ºã§ã¯ã€çŸ­ã„åå¾©ã®ä¸­ã§è¨ˆç”»ãƒ»å®Ÿè£…ãƒ»ç¢ºèªãªã©ã‚’ç¹°ã‚Šè¿”ã—ã€ä¾¡å€¤ã‚’æ®µéšŽçš„ã«æä¾›ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒVå­—ãƒ¢ãƒ‡ãƒ«ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã‚¢ã‚¸ãƒ£ã‚¤ãƒ«ã¯çŸ­ã„åå¾©ã§ä¾¡å€¤ã‚’å±Šã‘ã‚‹ã€ã€‚ã‚¢ã‚¸ãƒ£ã‚¤ãƒ«é–‹ç™ºã§ã¯ã€çŸ­ã„åå¾©ã®ä¸­ã§è¨ˆç”»ãƒ»å®Ÿè£…ãƒ»ç¢ºèªãªã©ã‚’ç¹°ã‚Šè¿”ã—ã€ä¾¡å€¤ã‚’æ®µéšŽçš„ã«æä¾›ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œä¸€æ‹¬ç§»è¡Œã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_13_01",
    "explainTopicSource": "semantic",
    "cognitiveRewrite": "v90-context",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "å½¹å‰²é¸æŠž"
  },
  {
    "id": "mgmt-10",
    "cat": "ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ",
    "concept": "ã‚·ã‚¹ãƒ†ãƒ ç›£æŸ»",
    "difficulty": "æ¨™æº–",
    "q": "ã‚·ã‚¹ãƒ†ãƒ ç›£æŸ»ã§ã€ç›£æŸ»æ„è¦‹ã‚’è£ä»˜ã‘ã‚‹ãŸã‚ã«ç›£æŸ»äººãŒåŽé›†ãƒ»è©•ä¾¡ã™ã‚‹è¨˜éŒ²ã‚„è³‡æ–™ãªã©ã‚’ä½•ã¨å‘¼ã¶ï¼Ÿ",
    "options": [
      "ç›£æŸ»èª¿æ›¸",
      "æ”¹å–„è¨ˆç”»",
      "ç›£æŸ»è¨¼æ‹ ",
      "ç›£æŸ»å¯¾è±¡"
    ],
    "a": 2,
    "exp": "ç›£æŸ»è¨¼æ‹ ã¯ã€ç›£æŸ»æ„è¦‹ã‚’å½¢æˆã™ã‚‹ãŸã‚ã®æ ¹æ‹ ã¨ãªã‚‹æƒ…å ±ã§ã™ã€‚ç›£æŸ»äººã¯ååˆ†ã‹ã¤é©åˆ‡ãªè¨¼æ‹ ã‚’åŽé›†ãƒ»è©•ä¾¡ã—ã¾ã™ã€‚",
    "hint": "ç›£æŸ»çµæžœã‚’ã€Œãªãœãã†åˆ¤æ–­ã—ãŸã‹ã€è£ä»˜ã‘ã‚‹æƒ…å ±ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œç›£æŸ»è¨¼æ‹ ã‚’åŽé›†ã€ã€‚ç›£æŸ»è¨¼æ‹ ã¯ã€ç›£æŸ»æ„è¦‹ã‚’å½¢æˆã™ã‚‹ãŸã‚ã®æ ¹æ‹ ã¨ãªã‚‹æƒ…å ±ã§ã™ã€‚ç›£æŸ»äººã¯ååˆ†ã‹ã¤é©åˆ‡ãªè¨¼æ‹ ã‚’åŽé›†ãƒ»è©•ä¾¡ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œç›£æŸ»èª¿æ›¸ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œç›£æŸ»è¨¼æ‹ ã‚’åŽé›†ã€ã€‚ç›£æŸ»è¨¼æ‹ ã¯ã€ç›£æŸ»æ„è¦‹ã‚’å½¢æˆã™ã‚‹ãŸã‚ã®æ ¹æ‹ ã¨ãªã‚‹æƒ…å ±ã§ã™ã€‚ç›£æŸ»äººã¯ååˆ†ã‹ã¤é©åˆ‡ãªè¨¼æ‹ ã‚’åŽé›†ãƒ»è©•ä¾¡ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œæ”¹å–„è¨ˆç”»ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ç›£æŸ»è¨¼æ‹ ã¯ã€ç›£æŸ»æ„è¦‹ã‚’å½¢æˆã™ã‚‹ãŸã‚ã®æ ¹æ‹ ã¨ãªã‚‹æƒ…å ±ã§ã™ã€‚ç›£æŸ»äººã¯ååˆ†ã‹ã¤é©åˆ‡ãªè¨¼æ‹ ã‚’åŽé›†ãƒ»è©•ä¾¡ã—ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œç›£æŸ»è¨¼æ‹ ã‚’åŽé›†ã€ã€‚ç›£æŸ»è¨¼æ‹ ã¯ã€ç›£æŸ»æ„è¦‹ã‚’å½¢æˆã™ã‚‹ãŸã‚ã®æ ¹æ‹ ã¨ãªã‚‹æƒ…å ±ã§ã™ã€‚ç›£æŸ»äººã¯ååˆ†ã‹ã¤é©åˆ‡ãªè¨¼æ‹ ã‚’åŽé›†ãƒ»è©•ä¾¡ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œç›£æŸ»å¯¾è±¡ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_15_05",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "strat-07",
    "cat": "ã‚¹ãƒˆãƒ©ãƒ†ã‚¸",
    "concept": "BPR",
    "difficulty": "æ¨™æº–",
    "q": "æ—¢å­˜ã®æ¥­å‹™æ‰‹é †ã‚’éƒ¨åˆ†çš„ã«æ”¹å–„ã™ã‚‹ã®ã§ã¯ãªãã€æ¥­å‹™ãƒ—ãƒ­ã‚»ã‚¹ã‚’æ ¹æœ¬ã‹ã‚‰è¦‹ç›´ã—ã¦å†è¨­è¨ˆã™ã‚‹è€ƒãˆæ–¹ã¯ï¼Ÿ",
    "options": [
      "ERP",
      "BPO",
      "CRM",
      "BPR"
    ],
    "a": 3,
    "exp": "BPRï¼ˆBusiness Process Re-engineeringï¼‰ã¯ã€æ¥­å‹™ãƒ—ãƒ­ã‚»ã‚¹ã‚’æŠœæœ¬çš„ã«è¦‹ç›´ã—ã€å†è¨­è¨ˆã™ã‚‹è€ƒãˆæ–¹ã§ã™ã€‚",
    "hint": "Re-engineeringï¼æ ¹æœ¬ã‹ã‚‰ä½œã‚Šç›´ã™è€ƒãˆæ–¹ã§ã™ã€‚",
    "choiceExps": [
      "ã€ŒERPã€ã¯ã€ä¼æ¥­å…¨ä½“ã®äººãƒ»ç‰©ãƒ»é‡‘ãªã©ã®çµŒå–¶è³‡æºã‚’çµ±åˆçš„ã«ç®¡ç†ã™ã‚‹ä»•çµ„ã¿ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒBPRã¯æŠœæœ¬çš„å†è¨­è¨ˆã€ã€‚BPRï¼ˆBusiness Process Re-engineeringï¼‰ã¯ã€æ¥­å‹™ãƒ—ãƒ­ã‚»ã‚¹ã‚’æŠœæœ¬çš„ã«è¦‹ç›´ã—ã€å†è¨­è¨ˆã™ã‚‹è€ƒãˆæ–¹ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒBPOã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€ŒCRMã€ã¯ã€é¡§å®¢æƒ…å ±ã‚„é¡§å®¢ã¨ã®é–¢ä¿‚ã‚’ç®¡ç†ã—ã€å–¶æ¥­ã‚„ã‚µãƒ¼ãƒ“ã‚¹ã¸ç”Ÿã‹ã™ä»•çµ„ã¿ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "BPRï¼ˆBusiness Process Re-engineeringï¼‰ã¯ã€æ¥­å‹™ãƒ—ãƒ­ã‚»ã‚¹ã‚’æŠœæœ¬çš„ã«è¦‹ç›´ã—ã€å†è¨­è¨ˆã™ã‚‹è€ƒãˆæ–¹ã§ã™ã€‚"
    ],
    "explainTopicId": "core_16_02",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "strat-08",
    "cat": "ã‚¹ãƒˆãƒ©ãƒ†ã‚¸",
    "concept": "RFP",
    "difficulty": "åŸºç¤Ž",
    "q": "ã‚·ã‚¹ãƒ†ãƒ èª¿é”ã§ã€å€™è£œãƒ™ãƒ³ãƒ€ã«ææ¡ˆã‚’ä¾é ¼ã™ã‚‹æ–‡æ›¸ã¯ï¼Ÿ",
    "options": [
      "RFP",
      "RFI",
      "RFQ",
      "SLA"
    ],
    "a": 0,
    "exp": "RFPï¼ˆRequest for Proposalï¼‰ã¯ã€å€™è£œãƒ™ãƒ³ãƒ€ã«å…·ä½“çš„ãªææ¡ˆã‚’æ±‚ã‚ã‚‹ææ¡ˆä¾é ¼æ›¸ã§ã™ã€‚",
    "hint": "RFIã¯æƒ…å ±æä¾›ä¾é ¼ã€RFQã¯è¦‹ç©ä¾é ¼ã€RFPã¯ææ¡ˆä¾é ¼ã§ã™ã€‚",
    "choiceExps": [
      "RFPï¼ˆRequest for Proposalï¼‰ã¯ã€å€™è£œãƒ™ãƒ³ãƒ€ã«å…·ä½“çš„ãªææ¡ˆã‚’æ±‚ã‚ã‚‹ææ¡ˆä¾é ¼æ›¸ã§ã™ã€‚",
      "ã€ŒRFIã€ã¯ã€Request For Informationã®ç•¥ã§ã€è£½å“ãƒ»æŠ€è¡“ãƒ»å€™è£œä¼æ¥­ãªã©ã®æƒ…å ±åŽé›†ã‚’ä¾é ¼ã™ã‚‹æ–‡æ›¸ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€ŒRFQã€ã¯ã€Request For Quotationï¼ˆè¦‹ç©ä¾é ¼æ›¸ï¼‰ã€‚ä¾¡æ ¼ã‚„æ¡ä»¶ã®è¦‹ç©ã‚Šã‚’ä¾é ¼ã™ã‚‹æ–‡æ›¸ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€ŒSLAã€ã¯ã€Service Level Agreementã®ç•¥ã§ã€æä¾›è€…ã¨åˆ©ç”¨è€…ãŒåˆæ„ã—ãŸã‚µãƒ¼ãƒ“ã‚¹å“è³ªã®ç›®æ¨™ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_17_02",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "strat-09",
    "cat": "ã‚¹ãƒˆãƒ©ãƒ†ã‚¸",
    "concept": "SWOT",
    "difficulty": "åŸºç¤Ž",
    "q": "SWOTåˆ†æžã§ã€Œç«¶åˆä¼æ¥­ã®æ–°è¦å‚å…¥ã€ã¯ä¸€èˆ¬ã«ã©ã‚Œï¼Ÿ",
    "options": [
      "Weakness",
      "Threat",
      "Opportunity",
      "Strength"
    ],
    "a": 1,
    "exp": "ç«¶åˆã®æ–°è¦å‚å…¥ã¯å¤–éƒ¨ç’°å¢ƒã®ãƒžã‚¤ãƒŠã‚¹è¦å› ãªã®ã§Threatï¼ˆè„…å¨ï¼‰ã§ã™ã€‚",
    "hint": "å¤–éƒ¨Ã—ãƒžã‚¤ãƒŠã‚¹ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒSWOTã‚„ãƒ•ã‚¡ã‚¤ãƒ–ãƒ•ã‚©ãƒ¼ã‚¹ã§ç’°å¢ƒåˆ†æžã€ã€‚ç«¶åˆã®æ–°è¦å‚å…¥ã¯å¤–éƒ¨ç’°å¢ƒã®ãƒžã‚¤ãƒŠã‚¹è¦å› ãªã®ã§Threatï¼ˆè„…å¨ï¼‰ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒWeaknessã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ç«¶åˆã®æ–°è¦å‚å…¥ã¯å¤–éƒ¨ç’°å¢ƒã®ãƒžã‚¤ãƒŠã‚¹è¦å› ãªã®ã§Threatï¼ˆè„…å¨ï¼‰ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒSWOTã‚„ãƒ•ã‚¡ã‚¤ãƒ–ãƒ•ã‚©ãƒ¼ã‚¹ã§ç’°å¢ƒåˆ†æžã€ã€‚ç«¶åˆã®æ–°è¦å‚å…¥ã¯å¤–éƒ¨ç’°å¢ƒã®ãƒžã‚¤ãƒŠã‚¹è¦å› ãªã®ã§Threatï¼ˆè„…å¨ï¼‰ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒOpportunityã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒSWOTã‚„ãƒ•ã‚¡ã‚¤ãƒ–ãƒ•ã‚©ãƒ¼ã‚¹ã§ç’°å¢ƒåˆ†æžã€ã€‚ç«¶åˆã®æ–°è¦å‚å…¥ã¯å¤–éƒ¨ç’°å¢ƒã®ãƒžã‚¤ãƒŠã‚¹è¦å› ãªã®ã§Threatï¼ˆè„…å¨ï¼‰ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒStrengthã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_18_03",
    "explainTopicSource": "manual",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "strat-10",
    "cat": "ã‚¹ãƒˆãƒ©ãƒ†ã‚¸",
    "concept": "IoT",
    "difficulty": "åŸºç¤Ž",
    "q": "IoTã§æ¸©åº¦ãªã©ã®ç‰©ç†é‡ã‚’å–å¾—ã™ã‚‹è£…ç½®ã¯ï¼Ÿ",
    "options": [
      "ã‚³ãƒ³ãƒˆãƒ­ãƒ¼ãƒ©",
      "ã‚¢ã‚¯ãƒãƒ¥ã‚¨ãƒ¼ã‚¿",
      "ã‚»ãƒ³ã‚µ",
      "ã‚²ãƒ¼ãƒˆã‚¦ã‚§ã‚¤"
    ],
    "a": 2,
    "exp": "ã‚»ãƒ³ã‚µã¯æ¸©åº¦ãƒ»å…‰ãƒ»åŠ é€Ÿåº¦ãªã©ã€ç¾å®Ÿä¸–ç•Œã®ç‰©ç†é‡ã‚’è¨ˆæ¸¬ã—ã¦ãƒ‡ãƒ¼ã‚¿ã¨ã—ã¦å–ã‚Šè¾¼ã¿ã¾ã™ã€‚",
    "hint": "ç¾å®Ÿä¸–ç•Œã‚’ã€Œæ¸¬ã‚‹ã€å´ã®è£…ç½®ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã‚»ãƒ³ã‚µã§çŠ¶æ…‹å–å¾—ã€ã€‚ã‚»ãƒ³ã‚µã¯æ¸©åº¦ãƒ»å…‰ãƒ»åŠ é€Ÿåº¦ãªã©ã€ç¾å®Ÿä¸–ç•Œã®ç‰©ç†é‡ã‚’è¨ˆæ¸¬ã—ã¦ãƒ‡ãƒ¼ã‚¿ã¨ã—ã¦å–ã‚Šè¾¼ã¿ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œã‚³ãƒ³ãƒˆãƒ­ãƒ¼ãƒ©ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã‚»ãƒ³ã‚µã§çŠ¶æ…‹å–å¾—ã€ã€‚ã‚»ãƒ³ã‚µã¯æ¸©åº¦ãƒ»å…‰ãƒ»åŠ é€Ÿåº¦ãªã©ã€ç¾å®Ÿä¸–ç•Œã®ç‰©ç†é‡ã‚’è¨ˆæ¸¬ã—ã¦ãƒ‡ãƒ¼ã‚¿ã¨ã—ã¦å–ã‚Šè¾¼ã¿ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œã‚¢ã‚¯ãƒãƒ¥ã‚¨ãƒ¼ã‚¿ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã‚»ãƒ³ã‚µã¯æ¸©åº¦ãƒ»å…‰ãƒ»åŠ é€Ÿåº¦ãªã©ã€ç¾å®Ÿä¸–ç•Œã®ç‰©ç†é‡ã‚’è¨ˆæ¸¬ã—ã¦ãƒ‡ãƒ¼ã‚¿ã¨ã—ã¦å–ã‚Šè¾¼ã¿ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã‚»ãƒ³ã‚µã§çŠ¶æ…‹å–å¾—ã€ã€‚ã‚»ãƒ³ã‚µã¯æ¸©åº¦ãƒ»å…‰ãƒ»åŠ é€Ÿåº¦ãªã©ã€ç¾å®Ÿä¸–ç•Œã®ç‰©ç†é‡ã‚’è¨ˆæ¸¬ã—ã¦ãƒ‡ãƒ¼ã‚¿ã¨ã—ã¦å–ã‚Šè¾¼ã¿ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œã‚²ãƒ¼ãƒˆã‚¦ã‚§ã‚¤ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_19_04",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "strat-11",
    "cat": "ã‚¹ãƒˆãƒ©ãƒ†ã‚¸",
    "concept": "è²¡å‹™",
    "difficulty": "åŸºç¤Ž",
    "q": "å£²ä¸Šé«˜900ã€å£²ä¸ŠåŽŸä¾¡550ã®ã¨ãã€å£²ä¸Šç·åˆ©ç›Šã¯ã„ãã‚‰ï¼Ÿ",
    "options": [
      "550",
      "900",
      "1,450",
      "350"
    ],
    "a": 3,
    "exp": "å£²ä¸Šç·åˆ©ç›Š=å£²ä¸Šé«˜900âˆ’å£²ä¸ŠåŽŸä¾¡550=350ã§ã™ã€‚",
    "hint": "å£²ä¸Šé«˜ã‹ã‚‰å£²ä¸ŠåŽŸä¾¡ã‚’å¼•ãã¾ã™ã€‚",
    "choiceExps": [
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ350ã€ã«ãªã‚‹ã€‚å£²ä¸Šç·åˆ©ç›Š=å£²ä¸Šé«˜900âˆ’å£²ä¸ŠåŽŸä¾¡550=350ã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ350ã€ã«ãªã‚‹ã€‚å£²ä¸Šç·åˆ©ç›Š=å£²ä¸Šé«˜900âˆ’å£²ä¸ŠåŽŸä¾¡550=350ã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ350ã€ã«ãªã‚‹ã€‚å£²ä¸Šç·åˆ©ç›Š=å£²ä¸Šé«˜900âˆ’å£²ä¸ŠåŽŸä¾¡550=350ã§ã™ã€‚",
      "å£²ä¸Šç·åˆ©ç›Š=å£²ä¸Šé«˜900âˆ’å£²ä¸ŠåŽŸä¾¡550=350ã§ã™ã€‚"
    ],
    "explainTopicId": "core_20_05",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v93-promoted",
    "applicationDemand": "è¦å‰‡é©ç”¨",
    "recallBoundary": "v93-promoted"
  },
  {
    "id": "theory-06",
    "cat": "åŸºç¤Žç†è«–",
    "concept": "ãƒ‡ãƒ¼ã‚¿å˜ä½",
    "difficulty": "åŸºç¤Ž",
    "q": "1KiBã‚’1024ãƒã‚¤ãƒˆã¨ã™ã‚‹ã¨ã€4KiBã¯ä½•ãƒã‚¤ãƒˆï¼Ÿ",
    "options": [
      "4096",
      "2048",
      "8192",
      "4000"
    ],
    "a": 0,
    "exp": "4Ã—1024=4096ãƒã‚¤ãƒˆã§ã™ã€‚",
    "hint": "KiBã§ã¯1024å€ã—ã¾ã™ã€‚",
    "choiceExps": [
      "4Ã—1024=4096ãƒã‚¤ãƒˆã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒKiBã§ã¯1024å€ã—ã¾ã™ã€ã€‚4Ã—1024=4096ãƒã‚¤ãƒˆã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ2048ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒKiBã§ã¯1024å€ã—ã¾ã™ã€ã€‚4Ã—1024=4096ãƒã‚¤ãƒˆã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ8192ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒKiBã§ã¯1024å€ã—ã¾ã™ã€ã€‚4Ã—1024=4096ãƒã‚¤ãƒˆã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ4000ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_01_01",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "theory-07",
    "cat": "åŸºç¤Žç†è«–",
    "concept": "16é€²æ•°",
    "difficulty": "åŸºç¤Ž",
    "q": "16é€²æ•° 1F ã‚’10é€²æ•°ã§è¡¨ã™ã¨ï¼Ÿ",
    "options": [
      "35",
      "31",
      "25",
      "21"
    ],
    "a": 1,
    "exp": "1Ã—16+15=31ã§ã™ã€‚Fã¯10é€²æ•°ã®15ã§ã™ã€‚",
    "hint": "F=15ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ16é€²æ•°ã®Aã€œFã¯10ã€œ15ã‚’1æ¡ã§è¡¨ã™ã€ã€‚1Ã—16+15=31ã§ã™ã€‚Fã¯10é€²æ•°ã®15ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ35ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "1Ã—16+15=31ã§ã™ã€‚Fã¯10é€²æ•°ã®15ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ16é€²æ•°ã®Aã€œFã¯10ã€œ15ã‚’1æ¡ã§è¡¨ã™ã€ã€‚1Ã—16+15=31ã§ã™ã€‚Fã¯10é€²æ•°ã®15ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ25ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ16é€²æ•°ã®Aã€œFã¯10ã€œ15ã‚’1æ¡ã§è¡¨ã™ã€ã€‚1Ã—16+15=31ã§ã™ã€‚Fã¯10é€²æ•°ã®15ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ21ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_01_02",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "theory-08",
    "cat": "åŸºç¤Žç†è«–",
    "concept": "é›†åˆ",
    "difficulty": "æ¨™æº–",
    "q": "é›†åˆA={1,2,3}ã€é›†åˆB={3,4,5}ã®å…±é€šéƒ¨åˆ†Aâˆ©Bã¯ï¼Ÿ",
    "options": [
      "{1,2,3,4,5}",
      "{1,2}",
      "{3}",
      "{4,5}"
    ],
    "a": 2,
    "exp": "ä¸¡æ–¹ã®é›†åˆã«å«ã¾ã‚Œã‚‹è¦ç´ ã¯3ã ã‘ã§ã™ã€‚",
    "hint": "å…±é€šã—ã¦å«ã¾ã‚Œã‚‹ã‚‚ã®ã‚’æŽ¢ã—ã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒA={1,2}, B={2,3}ãªã‚‰Aâˆ©B={2}ã€AâˆªB={1,2,3}ã§ã™ã€ã€‚ä¸¡æ–¹ã®é›†åˆã«å«ã¾ã‚Œã‚‹è¦ç´ ã¯3ã ã‘ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ{1,2,3,4,5}ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒA={1,2}, B={2,3}ãªã‚‰Aâˆ©B={2}ã€AâˆªB={1,2,3}ã§ã™ã€ã€‚ä¸¡æ–¹ã®é›†åˆã«å«ã¾ã‚Œã‚‹è¦ç´ ã¯3ã ã‘ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ{1,2}ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ä¸¡æ–¹ã®é›†åˆã«å«ã¾ã‚Œã‚‹è¦ç´ ã¯3ã ã‘ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒA={1,2}, B={2,3}ãªã‚‰Aâˆ©B={2}ã€AâˆªB={1,2,3}ã§ã™ã€ã€‚ä¸¡æ–¹ã®é›†åˆã«å«ã¾ã‚Œã‚‹è¦ç´ ã¯3ã ã‘ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ{4,5}ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_02_01",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "computer-05",
    "cat": "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿",
    "concept": "ã‚¹ãƒ«ãƒ¼ãƒ—ãƒƒãƒˆ",
    "difficulty": "æ¨™æº–",
    "q": "ã‚µãƒ¼ãƒAã¯1åˆ†é–“ã«120ä»¶ã®è¦æ±‚ã‚’å®Œäº†ã§ãã‚‹ã€‚1ä»¶ã®å¿œç­”æ™‚é–“ã§ã¯ãªãã€å˜ä½æ™‚é–“å½“ãŸã‚Šã«å‡¦ç†ã§ãã‚‹é‡ã‚’è¡¨ã™æŒ‡æ¨™ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ç¨¼åƒçŽ‡",
      "æ•…éšœçŽ‡",
      "å¿œç­”æ™‚é–“",
      "ã‚¹ãƒ«ãƒ¼ãƒ—ãƒƒãƒˆ"
    ],
    "a": 3,
    "exp": "å˜ä½æ™‚é–“å½“ãŸã‚Šã«å‡¦ç†ã§ãã‚‹ä»•äº‹é‡ã‚’ã‚¹ãƒ«ãƒ¼ãƒ—ãƒƒãƒˆã¨å‘¼ã³ã¾ã™ã€‚",
    "hint": "ã€Œ1åˆ†ã«ä½•ä»¶ã€ã®ã‚ˆã†ãªé‡ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã‚¹ãƒ«ãƒ¼ãƒ—ãƒƒãƒˆã¯å˜ä½æ™‚é–“å½“ãŸã‚Šå‡¦ç†é‡ã€ã€‚å˜ä½æ™‚é–“å½“ãŸã‚Šã«å‡¦ç†ã§ãã‚‹ä»•äº‹é‡ã‚’ã‚¹ãƒ«ãƒ¼ãƒ—ãƒƒãƒˆã¨å‘¼ã³ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œç¨¼åƒçŽ‡ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã‚¹ãƒ«ãƒ¼ãƒ—ãƒƒãƒˆã¯å˜ä½æ™‚é–“å½“ãŸã‚Šå‡¦ç†é‡ã€ã€‚å˜ä½æ™‚é–“å½“ãŸã‚Šã«å‡¦ç†ã§ãã‚‹ä»•äº‹é‡ã‚’ã‚¹ãƒ«ãƒ¼ãƒ—ãƒƒãƒˆã¨å‘¼ã³ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œæ•…éšœçŽ‡ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œå¿œç­”æ™‚é–“ã€ã¯ã€è¦æ±‚ã‚’å‡ºã—ã¦ã‹ã‚‰æœ€åˆã®å¿œç­”ãŒè¿”ã‚‹ã¾ã§ãªã©ã€åˆ©ç”¨è€…ã‹ã‚‰è¦‹ãŸå¾…ã¡æ™‚é–“ã‚’è¡¨ã™æŒ‡æ¨™ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "å˜ä½æ™‚é–“å½“ãŸã‚Šã«å‡¦ç†ã§ãã‚‹ä»•äº‹é‡ã‚’ã‚¹ãƒ«ãƒ¼ãƒ—ãƒƒãƒˆã¨å‘¼ã³ã¾ã™ã€‚"
    ],
    "explainTopicId": "core_05_03",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "computer-06",
    "cat": "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿",
    "concept": "RAID",
    "difficulty": "æ¨™æº–",
    "q": "è¤‡æ•°ãƒ‡ã‚£ã‚¹ã‚¯ã«åŒã˜ãƒ‡ãƒ¼ã‚¿ã‚’æ›¸ãè¾¼ã‚€ãƒŸãƒ©ãƒ¼ãƒªãƒ³ã‚°ã‚’åˆ©ç”¨ã™ã‚‹ä»£è¡¨çš„ãªRAIDãƒ¬ãƒ™ãƒ«ã¯ï¼Ÿ",
    "options": [
      "RAID1",
      "RAID6",
      "RAID0",
      "RAID5"
    ],
    "a": 0,
    "exp": "RAID1ã¯ãƒŸãƒ©ãƒ¼ãƒªãƒ³ã‚°ã«ã‚ˆã£ã¦åŒã˜ãƒ‡ãƒ¼ã‚¿ã‚’è¤‡æ•°ã®ãƒ‡ã‚£ã‚¹ã‚¯ã¸æ›¸ãè¾¼ã¿ã€å†—é•·æ€§ã‚’æŒãŸã›ã¾ã™ã€‚",
    "hint": "RAID1ï¼ãƒŸãƒ©ãƒ¼ãƒªãƒ³ã‚°ã¨æ•´ç†ã—ã¾ã™ã€‚",
    "choiceExps": [
      "RAID1ã¯ãƒŸãƒ©ãƒ¼ãƒªãƒ³ã‚°ã«ã‚ˆã£ã¦åŒã˜ãƒ‡ãƒ¼ã‚¿ã‚’è¤‡æ•°ã®ãƒ‡ã‚£ã‚¹ã‚¯ã¸æ›¸ãè¾¼ã¿ã€å†—é•·æ€§ã‚’æŒãŸã›ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒRAID1ï¼ãƒŸãƒ©ãƒ¼ãƒªãƒ³ã‚°ã¨æ•´ç†ã—ã¾ã™ã€ã€‚RAID1ã¯ãƒŸãƒ©ãƒ¼ãƒªãƒ³ã‚°ã«ã‚ˆã£ã¦åŒã˜ãƒ‡ãƒ¼ã‚¿ã‚’è¤‡æ•°ã®ãƒ‡ã‚£ã‚¹ã‚¯ã¸æ›¸ãè¾¼ã¿ã€å†—é•·æ€§ã‚’æŒãŸã›ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒRAID6ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒRAID1ï¼ãƒŸãƒ©ãƒ¼ãƒªãƒ³ã‚°ã¨æ•´ç†ã—ã¾ã™ã€ã€‚RAID1ã¯ãƒŸãƒ©ãƒ¼ãƒªãƒ³ã‚°ã«ã‚ˆã£ã¦åŒã˜ãƒ‡ãƒ¼ã‚¿ã‚’è¤‡æ•°ã®ãƒ‡ã‚£ã‚¹ã‚¯ã¸æ›¸ãè¾¼ã¿ã€å†—é•·æ€§ã‚’æŒãŸã›ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒRAID0ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒRAID1ï¼ãƒŸãƒ©ãƒ¼ãƒªãƒ³ã‚°ã¨æ•´ç†ã—ã¾ã™ã€ã€‚RAID1ã¯ãƒŸãƒ©ãƒ¼ãƒªãƒ³ã‚°ã«ã‚ˆã£ã¦åŒã˜ãƒ‡ãƒ¼ã‚¿ã‚’è¤‡æ•°ã®ãƒ‡ã‚£ã‚¹ã‚¯ã¸æ›¸ãè¾¼ã¿ã€å†—é•·æ€§ã‚’æŒãŸã›ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒRAID5ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_04_03",
    "explainTopicSource": "manual",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "computer-07",
    "cat": "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿",
    "concept": "å…¥å‡ºåŠ›",
    "difficulty": "åŸºç¤Ž",
    "q": "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿ã‹ã‚‰åˆ©ç”¨è€…ã¸æƒ…å ±ã‚’è¡¨ç¤ºã™ã‚‹è£…ç½®ã¯ã©ã‚Œï¼Ÿ",
    "options": [
      "ã‚­ãƒ¼ãƒœãƒ¼ãƒ‰",
      "ãƒ‡ã‚£ã‚¹ãƒ—ãƒ¬ã‚¤",
      "ãƒžã‚¦ã‚¹",
      "ã‚¹ã‚­ãƒ£ãƒŠ"
    ],
    "a": 1,
    "exp": "ãƒ‡ã‚£ã‚¹ãƒ—ãƒ¬ã‚¤ã¯å‡ºåŠ›è£…ç½®ã§ã™ã€‚",
    "hint": "ç”»é¢ã¸æƒ…å ±ã‚’å‡ºã—ã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå‡ºåŠ›:ãƒ‡ã‚£ã‚¹ãƒ—ãƒ¬ã‚¤ã€ãƒ—ãƒªãƒ³ã‚¿ã€ã€‚ãƒ‡ã‚£ã‚¹ãƒ—ãƒ¬ã‚¤ã¯å‡ºåŠ›è£…ç½®ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œã‚­ãƒ¼ãƒœãƒ¼ãƒ‰ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ãƒ‡ã‚£ã‚¹ãƒ—ãƒ¬ã‚¤ã¯å‡ºåŠ›è£…ç½®ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå‡ºåŠ›:ãƒ‡ã‚£ã‚¹ãƒ—ãƒ¬ã‚¤ã€ãƒ—ãƒªãƒ³ã‚¿ã€ã€‚ãƒ‡ã‚£ã‚¹ãƒ—ãƒ¬ã‚¤ã¯å‡ºåŠ›è£…ç½®ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒžã‚¦ã‚¹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå‡ºåŠ›:ãƒ‡ã‚£ã‚¹ãƒ—ãƒ¬ã‚¤ã€ãƒ—ãƒªãƒ³ã‚¿ã€ã€‚ãƒ‡ã‚£ã‚¹ãƒ—ãƒ¬ã‚¤ã¯å‡ºåŠ›è£…ç½®ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œã‚¹ã‚­ãƒ£ãƒŠã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_04_05",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "db-05",
    "cat": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹",
    "concept": "å¤–éƒ¨ã‚­ãƒ¼",
    "difficulty": "æ¨™æº–",
    "q": "æ³¨æ–‡è¡¨ã®é¡§å®¢IDã‚’é¡§å®¢è¡¨ã®é¡§å®¢IDã¨å¯¾å¿œä»˜ã‘ã‚‹ã¨ãã€æ³¨æ–‡è¡¨å´ã®é¡§å®¢IDã«è¨­å®šã™ã‚‹ã‚­ãƒ¼ã¨ã—ã¦æœ€ã‚‚é©åˆ‡ãªã®ã¯ï¼Ÿ",
    "options": [
      "ä»£æ›¿ã‚­ãƒ¼",
      "è¤‡åˆã‚­ãƒ¼",
      "å¤–éƒ¨ã‚­ãƒ¼",
      "å€™è£œã‚­ãƒ¼"
    ],
    "a": 2,
    "exp": "æ³¨æ–‡è¡¨ã®é¡§å®¢IDã®ã‚ˆã†ã«ã€åˆ¥è¡¨ã®ä¸»ã‚­ãƒ¼ãªã©ã‚’å‚ç…§ã—ã¦è¡¨åŒå£«ã®é–¢ä¿‚ã‚’è¡¨ã™å±žæ€§ã‚’å¤–éƒ¨ã‚­ãƒ¼ã¨ã—ã¦è¨­å®šã—ã¾ã™ã€‚",
    "hint": "åˆ¥ã®è¡¨ã®è¡Œã‚’å‚ç…§ã™ã‚‹ãŸã‚ã®ã‚­ãƒ¼ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå¤–éƒ¨ã‚­ãƒ¼ã§è¡¨é–“ã®é–¢ä¿‚ã‚’è¡¨ã™ã€ã€‚æ³¨æ–‡è¡¨ã®é¡§å®¢IDã®ã‚ˆã†ã«ã€åˆ¥è¡¨ã®ä¸»ã‚­ãƒ¼ãªã©ã‚’å‚ç…§ã—ã¦è¡¨åŒå£«ã®é–¢ä¿‚ã‚’è¡¨ã™å±žæ€§ã‚’å¤–éƒ¨ã‚­ãƒ¼ã¨ã—ã¦è¨­å®šã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œä»£æ›¿ã‚­ãƒ¼ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå¤–éƒ¨ã‚­ãƒ¼ã§è¡¨é–“ã®é–¢ä¿‚ã‚’è¡¨ã™ã€ã€‚æ³¨æ–‡è¡¨ã®é¡§å®¢IDã®ã‚ˆã†ã«ã€åˆ¥è¡¨ã®ä¸»ã‚­ãƒ¼ãªã©ã‚’å‚ç…§ã—ã¦è¡¨åŒå£«ã®é–¢ä¿‚ã‚’è¡¨ã™å±žæ€§ã‚’å¤–éƒ¨ã‚­ãƒ¼ã¨ã—ã¦è¨­å®šã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œè¤‡åˆã‚­ãƒ¼ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "æ³¨æ–‡è¡¨ã®é¡§å®¢IDã®ã‚ˆã†ã«ã€åˆ¥è¡¨ã®ä¸»ã‚­ãƒ¼ãªã©ã‚’å‚ç…§ã—ã¦è¡¨åŒå£«ã®é–¢ä¿‚ã‚’è¡¨ã™å±žæ€§ã‚’å¤–éƒ¨ã‚­ãƒ¼ã¨ã—ã¦è¨­å®šã—ã¾ã™ã€‚",
      "ã€Œå¤–éƒ¨ã‚­ãƒ¼ã€ã¯åˆ¥è¡¨ã®ä¸»ã‚­ãƒ¼ãªã©ã‚’å‚ç…§ã—ã€è¡¨åŒå£«ã‚’é–¢é€£ä»˜ã‘ã‚‹ã€‚ä¸€æ–¹ã€Œå€™è£œã‚­ãƒ¼ã€ã¯è¡Œã‚’ä¸€æ„ã«è­˜åˆ¥ã§ãã‚‹æœ€å°ã®å±žæ€§é›†åˆã€‚ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹ã®ã¯å‰è€…ã§ã‚ã‚‹ã€‚"
    ],
    "explainTopicId": "core_09_02",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "å½¹å‰²é¸æŠž"
  },
  {
    "id": "db-06",
    "cat": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹",
    "concept": "SQLé›†ç´„",
    "difficulty": "æ¨™æº–",
    "q": "è¡¨salesã®amountåˆ—ã®åˆè¨ˆã‚’æ±‚ã‚ã‚‹SQLé–¢æ•°ã¯ï¼Ÿ",
    "options": [
      "MAX(amount)",
      "COUNT(amount)",
      "AVG(amount)",
      "SUM(amount)"
    ],
    "a": 3,
    "exp": "SUMã¯æŒ‡å®šã—ãŸæ•°å€¤åˆ—ã®å€¤ã‚’åˆè¨ˆã™ã‚‹é›†ç´„é–¢æ•°ã§ã™ã€‚amountåˆ—ã®åˆè¨ˆãªã‚‰SUM(amount)ã‚’ä½¿ã„ã¾ã™ã€‚",
    "hint": "SUMã¯è‹±èªžã§ã€Œåˆè¨ˆã€ã‚’æ„å‘³ã—ã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒCOUNTãƒ»SUMãƒ»AVGãƒ»MAXãƒ»MINã¯ä»£è¡¨çš„ãªé›†è¨ˆé–¢æ•°ã€ã€‚SUMã¯æŒ‡å®šã—ãŸæ•°å€¤åˆ—ã®å€¤ã‚’åˆè¨ˆã™ã‚‹é›†ç´„é–¢æ•°ã§ã™ã€‚amountåˆ—ã®åˆè¨ˆãªã‚‰SUM(amount)ã‚’ä½¿ã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒMAX(amount)ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒCOUNTãƒ»SUMãƒ»AVGãƒ»MAXãƒ»MINã¯ä»£è¡¨çš„ãªé›†è¨ˆé–¢æ•°ã€ã€‚SUMã¯æŒ‡å®šã—ãŸæ•°å€¤åˆ—ã®å€¤ã‚’åˆè¨ˆã™ã‚‹é›†ç´„é–¢æ•°ã§ã™ã€‚amountåˆ—ã®åˆè¨ˆãªã‚‰SUM(amount)ã‚’ä½¿ã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒCOUNT(amount)ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒCOUNTãƒ»SUMãƒ»AVGãƒ»MAXãƒ»MINã¯ä»£è¡¨çš„ãªé›†è¨ˆé–¢æ•°ã€ã€‚SUMã¯æŒ‡å®šã—ãŸæ•°å€¤åˆ—ã®å€¤ã‚’åˆè¨ˆã™ã‚‹é›†ç´„é–¢æ•°ã§ã™ã€‚amountåˆ—ã®åˆè¨ˆãªã‚‰SUM(amount)ã‚’ä½¿ã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒAVG(amount)ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "SUMã¯æŒ‡å®šã—ãŸæ•°å€¤åˆ—ã®å€¤ã‚’åˆè¨ˆã™ã‚‹é›†ç´„é–¢æ•°ã§ã™ã€‚amountåˆ—ã®åˆè¨ˆãªã‚‰SUM(amount)ã‚’ä½¿ã„ã¾ã™ã€‚"
    ],
    "explainTopicId": "core_09_07",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "å¼ãƒ»æ§‹æ–‡"
  },
  {
    "id": "db-07",
    "cat": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹",
    "concept": "ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹",
    "difficulty": "æ¨™æº–",
    "q": "æ¤œç´¢ã‚’é«˜é€ŸåŒ–ã™ã‚‹ãŸã‚ã«è¡¨ã®åˆ—ã¸è¨­å®šã™ã‚‹ç´¢å¼•ã«æœ€ã‚‚è¿‘ã„ã‚‚ã®ã¯ï¼Ÿ",
    "options": [
      "ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹",
      "ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³",
      "ãƒ“ãƒ¥ãƒ¼",
      "å¤–éƒ¨ã‚­ãƒ¼"
    ],
    "a": 0,
    "exp": "ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã¯æ¤œç´¢å¯¾è±¡ã®ä½ç½®ã‚’åŠ¹çŽ‡ã‚ˆãæŽ¢ã™ãŸã‚ã®ç´¢å¼•ã§ã™ã€‚",
    "hint": "æœ¬ã®ç´¢å¼•ã‚’ã‚¤ãƒ¡ãƒ¼ã‚¸ã—ã¾ã™ã€‚",
    "choiceExps": [
      "ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã¯æ¤œç´¢å¯¾è±¡ã®ä½ç½®ã‚’åŠ¹çŽ‡ã‚ˆãæŽ¢ã™ãŸã‚ã®ç´¢å¼•ã§ã™ã€‚",
      "ã€Œãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³ã€ã¯ã€è¤‡æ•°ã®ãƒ‡ãƒ¼ã‚¿æ“ä½œã‚’ã€ã¾ã¨ã‚ã¦æˆåŠŸã¾ãŸã¯å¤±æ•—ã•ã›ã‚‹å‡¦ç†å˜ä½ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã¯æ¤œç´¢ã‚’é€Ÿã‚ã‚‹ãŒæ›´æ–°ã‚³ã‚¹ãƒˆã‚‚ã‚ã‚‹ã€ã€‚ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã¯æ¤œç´¢å¯¾è±¡ã®ä½ç½®ã‚’åŠ¹çŽ‡ã‚ˆãæŽ¢ã™ãŸã‚ã®ç´¢å¼•ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒ“ãƒ¥ãƒ¼ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œå¤–éƒ¨ã‚­ãƒ¼ã€ã¯ã€åˆ¥ã®è¡¨ã®ä¸»ã‚­ãƒ¼ãªã©ã‚’å‚ç…§ã—ã€è¡¨åŒå£«ã‚’é–¢é€£ä»˜ã‘ã‚‹ãŸã‚ã®åˆ—ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_09_04",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "net-05",
    "cat": "ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯",
    "concept": "DHCP",
    "difficulty": "åŸºç¤Ž",
    "q": "æ–°ã—ãæŽ¥ç¶šã—ãŸPCã¸ã€IPã‚¢ãƒ‰ãƒ¬ã‚¹ãƒ»ã‚µãƒ–ãƒãƒƒãƒˆãƒžã‚¹ã‚¯ãƒ»ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆã‚²ãƒ¼ãƒˆã‚¦ã‚§ã‚¤ãªã©ã‚’è‡ªå‹•è¨­å®šã—ãŸã„ã€‚åˆ©ç”¨ã™ã‚‹ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ARP",
      "DHCP",
      "NTP",
      "DNS"
    ],
    "a": 1,
    "exp": "DHCPã¯ã€IPã‚¢ãƒ‰ãƒ¬ã‚¹ã€ã‚µãƒ–ãƒãƒƒãƒˆãƒžã‚¹ã‚¯ã€ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆã‚²ãƒ¼ãƒˆã‚¦ã‚§ã‚¤ãªã©ã®ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯è¨­å®šã‚’ç«¯æœ«ã¸è‡ªå‹•é…å¸ƒã—ã¾ã™ã€‚",
    "hint": "ç«¯æœ«ã®IPè¨­å®šã‚’è‡ªå‹•åŒ–ã™ã‚‹ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒDHCPã§IPè¨­å®šã‚’è‡ªå‹•é…å¸ƒã§ãã‚‹ã€ã€‚DHCPã¯ã€IPã‚¢ãƒ‰ãƒ¬ã‚¹ã€ã‚µãƒ–ãƒãƒƒãƒˆãƒžã‚¹ã‚¯ã€ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆã‚²ãƒ¼ãƒˆã‚¦ã‚§ã‚¤ãªã©ã®ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯è¨­å®šã‚’ç«¯æœ«ã¸è‡ªå‹•é…å¸ƒã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒARPã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "DHCPã¯ã€IPã‚¢ãƒ‰ãƒ¬ã‚¹ã€ã‚µãƒ–ãƒãƒƒãƒˆãƒžã‚¹ã‚¯ã€ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆã‚²ãƒ¼ãƒˆã‚¦ã‚§ã‚¤ãªã©ã®ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯è¨­å®šã‚’ç«¯æœ«ã¸è‡ªå‹•é…å¸ƒã—ã¾ã™ã€‚",
      "ã€ŒNTPã€ã¯ã€ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ä¸Šã®æ©Ÿå™¨ã®æ™‚åˆ»ã‚’åŒæœŸã™ã‚‹ãŸã‚ã®ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€ŒDNSã€ã¯ã€ãƒ‰ãƒ¡ã‚¤ãƒ³åã¨IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å¯¾å¿œä»˜ã‘ã‚‹ä»•çµ„ã¿ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_10_03",
    "explainTopicSource": "semantic",
    "cognitiveRewrite": "v90-context",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "å½¹å‰²é¸æŠž"
  },
  {
    "id": "net-06",
    "cat": "ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯",
    "concept": "HTTP",
    "difficulty": "åŸºç¤Ž",
    "q": "Webãƒ–ãƒ©ã‚¦ã‚¶ã¨Webã‚µãƒ¼ãƒé–“ã®é€šä¿¡ã§ä»£è¡¨çš„ã«ç”¨ã„ã‚‰ã‚Œã‚‹ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã¯ï¼Ÿ",
    "options": [
      "SNMP",
      "SMTP",
      "HTTP",
      "POP3"
    ],
    "a": 2,
    "exp": "HTTPã¯Webã®ãƒ‡ãƒ¼ã‚¿è»¢é€ã«ä½¿ã‚ã‚Œã‚‹ä»£è¡¨çš„ãªãƒ—ãƒ­ãƒˆã‚³ãƒ«ã§ã™ã€‚",
    "hint": "Webãƒšãƒ¼ã‚¸ã®é€šä¿¡ã§ã™ã€‚",
    "choiceExps": [
      "ã€ŒSNMPã€ã¯ã€ãƒ«ãƒ¼ã‚¿ã‚„ã‚¹ã‚¤ãƒƒãƒãªã©ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯æ©Ÿå™¨ã®çŠ¶æ…‹ã‚’ç›£è¦–ãƒ»ç®¡ç†ã™ã‚‹ãŸã‚ã®ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€ŒSMTPã€ã¯ã€é›»å­ãƒ¡ãƒ¼ãƒ«ã‚’é€ä¿¡ãƒ»è»¢é€ã™ã‚‹ãŸã‚ã®ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "HTTPã¯Webã®ãƒ‡ãƒ¼ã‚¿è»¢é€ã«ä½¿ã‚ã‚Œã‚‹ä»£è¡¨çš„ãªãƒ—ãƒ­ãƒˆã‚³ãƒ«ã§ã™ã€‚",
      "ã€ŒPOP3ã€ã¯ã€Post Office Protocol version 3ã€‚ãƒ¡ãƒ¼ãƒ«ã‚’ã‚µãƒ¼ãƒã‹ã‚‰ç«¯æœ«ã¸å–å¾—ã™ã‚‹ãŸã‚ã®å—ä¿¡ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_10_07",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "net-07",
    "cat": "ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯",
    "concept": "NAT",
    "difficulty": "æ¨™æº–",
    "q": "å®¶åº­å†…ã®è¤‡æ•°ç«¯æœ«ãŒãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆIPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’ä½¿ã„ã€1ã¤ã®ã‚°ãƒ­ãƒ¼ãƒãƒ«IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å…±æœ‰ã—ã¦ã‚¤ãƒ³ã‚¿ãƒ¼ãƒãƒƒãƒˆã¸æŽ¥ç¶šã™ã‚‹ä»•çµ„ã¿ã«é–¢ä¿‚ã™ã‚‹ã‚‚ã®ã¯ï¼Ÿ",
    "options": [
      "NAT",
      "DHCP",
      "DNS",
      "NAPT"
    ],
    "a": 3,
    "exp": "NAPTã¯IPã‚¢ãƒ‰ãƒ¬ã‚¹ã«åŠ ãˆã¦ãƒãƒ¼ãƒˆç•ªå·ã‚‚å¤‰æ›ã™ã‚‹ãŸã‚ã€è¤‡æ•°ã®ç«¯æœ«ãŒ1ã¤ã®ã‚°ãƒ­ãƒ¼ãƒãƒ«IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å…±æœ‰ã§ãã¾ã™ã€‚",
    "hint": "è¤‡æ•°ç«¯æœ«ã‚’1ã¤ã®ã‚°ãƒ­ãƒ¼ãƒãƒ«IPã§åŒºåˆ¥ã™ã‚‹ãŸã‚ã€ãƒãƒ¼ãƒˆç•ªå·ã‚‚å¤‰æ›ã—ã¾ã™ã€‚",
    "choiceExps": [
      "ã€ŒNATã€ã¯ã€ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆIPã‚¢ãƒ‰ãƒ¬ã‚¹ã¨ã‚°ãƒ­ãƒ¼ãƒãƒ«IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å¤‰æ›ã™ã‚‹ä»•çµ„ã¿ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒNAPTï¼šIPã‚¢ãƒ‰ãƒ¬ã‚¹ã«åŠ ãˆã¦ãƒãƒ¼ãƒˆç•ªå·ã‚‚ä½¿ã„ã€å¤šæ•°ç«¯æœ«ã‚’1ã¤ã®ã‚°ãƒ­ãƒ¼ãƒãƒ«IPã¸å¯¾å¿œã€ã€‚NAPTã¯IPã‚¢ãƒ‰ãƒ¬ã‚¹ã«åŠ ãˆã¦ãƒãƒ¼ãƒˆç•ªå·ã‚‚å¤‰æ›ã™ã‚‹ãŸã‚ã€è¤‡æ•°ã®ç«¯æœ«ãŒ1ã¤ã®ã‚°ãƒ­ãƒ¼ãƒãƒ«IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å…±æœ‰ã§ãã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒDHCPã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€ŒDNSã€ã¯ã€ãƒ‰ãƒ¡ã‚¤ãƒ³åã¨IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å¯¾å¿œä»˜ã‘ã‚‹ä»•çµ„ã¿ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "NAPTã¯IPã‚¢ãƒ‰ãƒ¬ã‚¹ã«åŠ ãˆã¦ãƒãƒ¼ãƒˆç•ªå·ã‚‚å¤‰æ›ã™ã‚‹ãŸã‚ã€è¤‡æ•°ã®ç«¯æœ«ãŒ1ã¤ã®ã‚°ãƒ­ãƒ¼ãƒãƒ«IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å…±æœ‰ã§ãã¾ã™ã€‚"
    ],
    "explainTopicId": "core_10_05",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "sec-05",
    "cat": "ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£",
    "concept": "å…±é€šéµæš—å·",
    "difficulty": "åŸºç¤Ž",
    "q": "æš—å·åŒ–ã¨å¾©å·ã«åŒã˜ç§˜å¯†ã®éµã‚’ä½¿ã†æ–¹å¼ã¯ï¼Ÿ",
    "options": [
      "å…±é€šéµæš—å·æ–¹å¼",
      "ãƒãƒƒã‚·ãƒ¥é–¢æ•°",
      "ãƒ‡ã‚¸ã‚¿ãƒ«ç½²å",
      "å…¬é–‹éµæš—å·æ–¹å¼"
    ],
    "a": 0,
    "exp": "å…±é€šéµæš—å·æ–¹å¼ã§ã¯é€å—ä¿¡è€…ãŒåŒã˜ç§˜å¯†éµã‚’å…±æœ‰ã—ã¦æš—å·åŒ–ãƒ»å¾©å·ã—ã¾ã™ã€‚",
    "hint": "ã€Œå…±é€šã€ã®éµã‚’ä½¿ã„ã¾ã™ã€‚",
    "choiceExps": [
      "å…±é€šéµæš—å·æ–¹å¼ã§ã¯é€å—ä¿¡è€…ãŒåŒã˜ç§˜å¯†éµã‚’å…±æœ‰ã—ã¦æš—å·åŒ–ãƒ»å¾©å·ã—ã¾ã™ã€‚",
      "ã€Œãƒãƒƒã‚·ãƒ¥ã€ã¯ã€å…¥åŠ›ãƒ‡ãƒ¼ã‚¿ã‹ã‚‰å›ºå®šé•·ã®å€¤ã‚’è¨ˆç®—ã™ã‚‹ä»•çµ„ã¿ã§ã™ã€‚å…ƒãƒ‡ãƒ¼ã‚¿ã®å¾©å…ƒã§ã¯ãªãæ”¹ã–ã‚“æ¤œå‡ºãªã©ã«ä½¿ã„ã¾ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œãƒ‡ã‚¸ã‚¿ãƒ«ç½²åã€ã¯ã€ç§˜å¯†éµã§ç½²åã—ã€å¯¾å¿œã™ã‚‹å…¬é–‹éµã§ç¢ºèªã™ã‚‹ã“ã¨ã§ã€ä½œæˆè€…ã¨æ”¹ã–ã‚“ã®æœ‰ç„¡ã‚’ç¢ºèªã™ã‚‹ä»•çµ„ã¿ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œå…¬é–‹éµæš—å·ã€ã¯ã€å…¬é–‹éµã¨ç§˜å¯†éµã®2æœ¬ã‚’ä½¿ã†æ–¹å¼ã§ã™ã€‚éµé…é€ã‚„èªè¨¼ã«åˆ©ç”¨ã•ã‚Œã¾ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_11_02",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "sec-06",
    "cat": "ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£",
    "concept": "ãƒžãƒ«ã‚¦ã‚§ã‚¢",
    "difficulty": "æ¨™æº–",
    "q": "ç¤¾å†…ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã§ã€ä»–ã®ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã¸å¯„ç”Ÿã›ãšå˜ç‹¬ã§å‹•ä½œã—ã€è‡ªåˆ†è‡ªèº«ã‚’è¤‡è£½ã—ãªãŒã‚‰åˆ¥ç«¯æœ«ã¸æ„ŸæŸ“ã‚’åºƒã’ã‚‹ãƒžãƒ«ã‚¦ã‚§ã‚¢ãŒè¦‹ã¤ã‹ã£ãŸã€‚æœ€ã‚‚è¿‘ã„ã‚‚ã®ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ãƒ©ãƒ³ã‚µãƒ ã‚¦ã‚§ã‚¢",
      "ãƒ¯ãƒ¼ãƒ ",
      "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿ã‚¦ã‚¤ãƒ«ã‚¹",
      "ãƒˆãƒ­ã‚¤ã®æœ¨é¦¬"
    ],
    "a": 1,
    "exp": "ãƒ¯ãƒ¼ãƒ ã¯ä»–ã®ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã¸ã®å¯„ç”Ÿã‚’å¿…é ˆã¨ã›ãšã€ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ãªã©ã‚’ä»‹ã—ã¦è‡ªå¾‹çš„ã«è‡ªå·±å¢—æ®–ã™ã‚‹ãƒžãƒ«ã‚¦ã‚§ã‚¢ã§ã™ã€‚",
    "hint": "ä»–ã®ãƒ•ã‚¡ã‚¤ãƒ«ã¸å¯„ç”Ÿã›ãšã€å˜ç‹¬ã§åºƒãŒã‚‹ç‚¹ãŒç‰¹å¾´ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä»–ã®ãƒ•ã‚¡ã‚¤ãƒ«ã¸å¯„ç”Ÿã›ãšã€å˜ç‹¬ã§åºƒãŒã‚‹ç‚¹ãŒç‰¹å¾´ã§ã™ã€ã€‚ãƒ¯ãƒ¼ãƒ ã¯ä»–ã®ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã¸ã®å¯„ç”Ÿã‚’å¿…é ˆã¨ã›ãšã€ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ãªã©ã‚’ä»‹ã—ã¦è‡ªå¾‹çš„ã«è‡ªå·±å¢—æ®–ã™ã‚‹ãƒžãƒ«ã‚¦ã‚§ã‚¢ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒ©ãƒ³ã‚µãƒ ã‚¦ã‚§ã‚¢ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ãƒ¯ãƒ¼ãƒ ã¯ä»–ã®ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã¸ã®å¯„ç”Ÿã‚’å¿…é ˆã¨ã›ãšã€ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ãªã©ã‚’ä»‹ã—ã¦è‡ªå¾‹çš„ã«è‡ªå·±å¢—æ®–ã™ã‚‹ãƒžãƒ«ã‚¦ã‚§ã‚¢ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä»–ã®ãƒ•ã‚¡ã‚¤ãƒ«ã¸å¯„ç”Ÿã›ãšã€å˜ç‹¬ã§åºƒãŒã‚‹ç‚¹ãŒç‰¹å¾´ã§ã™ã€ã€‚ãƒ¯ãƒ¼ãƒ ã¯ä»–ã®ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã¸ã®å¯„ç”Ÿã‚’å¿…é ˆã¨ã›ãšã€ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ãªã©ã‚’ä»‹ã—ã¦è‡ªå¾‹çš„ã«è‡ªå·±å¢—æ®–ã™ã‚‹ãƒžãƒ«ã‚¦ã‚§ã‚¢ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿ã‚¦ã‚¤ãƒ«ã‚¹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä»–ã®ãƒ•ã‚¡ã‚¤ãƒ«ã¸å¯„ç”Ÿã›ãšã€å˜ç‹¬ã§åºƒãŒã‚‹ç‚¹ãŒç‰¹å¾´ã§ã™ã€ã€‚ãƒ¯ãƒ¼ãƒ ã¯ä»–ã®ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã¸ã®å¯„ç”Ÿã‚’å¿…é ˆã¨ã›ãšã€ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ãªã©ã‚’ä»‹ã—ã¦è‡ªå¾‹çš„ã«è‡ªå·±å¢—æ®–ã™ã‚‹ãƒžãƒ«ã‚¦ã‚§ã‚¢ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒˆãƒ­ã‚¤ã®æœ¨é¦¬ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_11_06",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "sec-07",
    "cat": "ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£",
    "concept": "ãƒãƒƒã‚¯ã‚¢ãƒƒãƒ—",
    "difficulty": "æ¨™æº–",
    "q": "ãƒãƒƒã‚¯ã‚¢ãƒƒãƒ—ãŒéšœå®³æ™‚ã®å¯ç”¨æ€§å‘ä¸Šã«æœ¬å½“ã«å½¹ç«‹ã¤ã“ã¨ã‚’ç¢ºèªã™ã‚‹ãŸã‚ã€å®šæœŸçš„ã«è¡Œã†ã¹ãã‚‚ã®ã¯ï¼Ÿ",
    "options": [
      "ãƒãƒƒã‚¯ã‚¢ãƒƒãƒ—å–å¾—å‡¦ç†ã®æˆåŠŸãƒ­ã‚°ã‚’ç¢ºèªã™ã‚‹",
      "ãƒãƒƒã‚¯ã‚¢ãƒƒãƒ—åª’ä½“ã®ç©ºãå®¹é‡ã‚’å®šæœŸçš„ã«ç¢ºèªã™ã‚‹",
      "ãƒãƒƒã‚¯ã‚¢ãƒƒãƒ—ã‹ã‚‰å®Ÿéš›ã«å¾©å…ƒã§ãã‚‹ã‹ãƒ†ã‚¹ãƒˆã™ã‚‹",
      "ãƒãƒƒã‚¯ã‚¢ãƒƒãƒ—å¯¾è±¡ã®ä»¶æ•°ãƒ»å®¹é‡ãŒæƒ³å®šã©ãŠã‚Šã‹ã‚’å®šæœŸç¢ºèªã™ã‚‹"
    ],
    "a": 2,
    "exp": "ãƒãƒƒã‚¯ã‚¢ãƒƒãƒ—ã¯å–å¾—ã™ã‚‹ã ã‘ã§ãªãã€å®Ÿéš›ã«å¾©å…ƒã§ãã‚‹ã“ã¨ã‚’å®šæœŸçš„ã«ç¢ºèªã—ã¦åˆã‚ã¦ã€éšœå®³æ™‚ã®å¾©æ—§æ‰‹æ®µã¨ã—ã¦ä¿¡é ¼ã§ãã¾ã™ã€‚",
    "hint": "ã€Œå–ã‚Œã¦ã„ã‚‹ã€ã ã‘ã§ãªãã€Œæˆ»ã›ã‚‹ã€ã“ã¨ã‚’ç¢ºèªã—ã¾ã™ã€‚",
    "choiceExps": [
      "ã€Œãƒãƒƒã‚¯ã‚¢ãƒƒãƒ—ã€ã¯ã€å…ƒãƒ‡ãƒ¼ã‚¿ã‚’å¤±ã£ãŸã¨ãã«å¾©å…ƒã§ãã‚‹ã‚ˆã†ã€åˆ¥ã®å ´æ‰€ã¸ã‚³ãƒ”ãƒ¼ã‚’ä¿å­˜ã—ã¦ãŠãã“ã¨ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œãƒãƒƒã‚¯ã‚¢ãƒƒãƒ—ã€ã¯ã€å…ƒãƒ‡ãƒ¼ã‚¿ã‚’å¤±ã£ãŸã¨ãã«å¾©å…ƒã§ãã‚‹ã‚ˆã†ã€åˆ¥ã®å ´æ‰€ã¸ã‚³ãƒ”ãƒ¼ã‚’ä¿å­˜ã—ã¦ãŠãã“ã¨ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ãƒãƒƒã‚¯ã‚¢ãƒƒãƒ—ã¯å–å¾—ã™ã‚‹ã ã‘ã§ãªãã€å®Ÿéš›ã«å¾©å…ƒã§ãã‚‹ã“ã¨ã‚’å®šæœŸçš„ã«ç¢ºèªã—ã¦åˆã‚ã¦ã€éšœå®³æ™‚ã®å¾©æ—§æ‰‹æ®µã¨ã—ã¦ä¿¡é ¼ã§ãã¾ã™ã€‚",
      "ã€Œãƒãƒƒã‚¯ã‚¢ãƒƒãƒ—ã€ã¯ã€å…ƒãƒ‡ãƒ¼ã‚¿ã‚’å¤±ã£ãŸã¨ãã«å¾©å…ƒã§ãã‚‹ã‚ˆã†ã€åˆ¥ã®å ´æ‰€ã¸ã‚³ãƒ”ãƒ¼ã‚’ä¿å­˜ã—ã¦ãŠãã“ã¨ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_11_06",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "å½¹å‰²é¸æŠž"
  },
  {
    "id": "algo-05",
    "cat": "ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ",
    "concept": "ã‚­ãƒ¥ãƒ¼",
    "difficulty": "åŸºç¤Ž",
    "q": "ç©ºã®ã‚­ãƒ¥ãƒ¼ã¸Aã€Bã€Cã®é †ã«ENQUEUEã—ãŸå¾Œã€1å›žDEQUEUEã™ã‚‹ã¨å–ã‚Šå‡ºã•ã‚Œã‚‹ã®ã¯ï¼Ÿ",
    "options": [
      "C",
      "å–ã‚Šå‡ºã›ãªã„",
      "B",
      "A"
    ],
    "a": 3,
    "exp": "ã‚­ãƒ¥ãƒ¼ã¯FIFOãªã®ã§æœ€åˆã«å…¥ã‚ŒãŸAãŒæœ€åˆã«å–ã‚Šå‡ºã•ã‚Œã¾ã™ã€‚",
    "hint": "å¾…ã¡è¡Œåˆ—ã¨åŒã˜ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒA,B,Cã‚’ã‚¹ã‚¿ãƒƒã‚¯ã¸é †ã«PUSHã™ã‚‹ã¨æœ€åˆã®POPã¯Cã§ã™ã€ã€‚ã‚­ãƒ¥ãƒ¼ã¯FIFOãªã®ã§æœ€åˆã«å…¥ã‚ŒãŸAãŒæœ€åˆã«å–ã‚Šå‡ºã•ã‚Œã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒCã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒA,B,Cã‚’ã‚¹ã‚¿ãƒƒã‚¯ã¸é †ã«PUSHã™ã‚‹ã¨æœ€åˆã®POPã¯Cã§ã™ã€ã€‚ã“ã®ãŸã‚ã€Œå–ã‚Šå‡ºã›ãªã„ã€ã®ã‚ˆã†ã«æ–­å®šã™ã‚‹ã¨ã€å•é¡Œã®æ¡ä»¶ãƒ»å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒA,B,Cã‚’ã‚¹ã‚¿ãƒƒã‚¯ã¸é †ã«PUSHã™ã‚‹ã¨æœ€åˆã®POPã¯Cã§ã™ã€ã€‚ã‚­ãƒ¥ãƒ¼ã¯FIFOãªã®ã§æœ€åˆã«å…¥ã‚ŒãŸAãŒæœ€åˆã«å–ã‚Šå‡ºã•ã‚Œã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒBã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã‚­ãƒ¥ãƒ¼ã¯FIFOãªã®ã§æœ€åˆã«å…¥ã‚ŒãŸAãŒæœ€åˆã«å–ã‚Šå‡ºã•ã‚Œã¾ã™ã€‚"
    ],
    "explainTopicId": "core_03_01",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "algo-06",
    "cat": "ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ",
    "concept": "ã‚½ãƒ¼ãƒˆ",
    "difficulty": "æ¨™æº–",
    "q": "é…åˆ— [4, 1, 3, 2] ã«å¯¾ã—ã€å·¦ã‹ã‚‰å³ã¸éš£ã‚Šåˆã†è¦ç´ ã‚’æ¯”è¼ƒã—ã¦å¤§ãã„æ–¹ã‚’å³ã¸é€ã‚‹ãƒãƒ–ãƒ«ã‚½ãƒ¼ãƒˆã‚’1å›žã ã‘èµ°æŸ»ã—ãŸã€‚èµ°æŸ»å¾Œã®é…åˆ—ã¯ï¼Ÿ",
    "options": [
      "[1,3,2,4]",
      "[1,4,2,3]",
      "[1,2,3,4]",
      "[4,1,2,3]"
    ],
    "a": 0,
    "exp": "4ã¨1ã‚’äº¤æ›ã—ã¦[1,4,3,2]ã€4ã¨3ã‚’äº¤æ›ã—ã¦[1,3,4,2]ã€4ã¨2ã‚’äº¤æ›ã—ã¦[1,3,2,4]ã¨ãªã‚Šã¾ã™ã€‚1å›žã®èµ°æŸ»ã§æœ€å¤§å€¤4ãŒæœ«å°¾ã¸ç§»å‹•ã—ã¾ã™ã€‚",
    "hint": "å·¦ã‹ã‚‰é †ã«éš£æŽ¥è¦ç´ ã‚’æ¯”è¼ƒã—ã€å¤§ãã„æ–¹ã‚’å³ã¸é€ã‚Šã¾ã™ã€‚",
    "choiceExps": [
      "4ã¨1ã‚’äº¤æ›ã—ã¦[1,4,3,2]ã€4ã¨3ã‚’äº¤æ›ã—ã¦[1,3,4,2]ã€4ã¨2ã‚’äº¤æ›ã—ã¦[1,3,2,4]ã¨ãªã‚Šã¾ã™ã€‚1å›žã®èµ°æŸ»ã§æœ€å¤§å€¤4ãŒæœ«å°¾ã¸ç§»å‹•ã—ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå·¦ã‹ã‚‰é †ã«éš£æŽ¥è¦ç´ ã‚’æ¯”è¼ƒã—ã€å¤§ãã„æ–¹ã‚’å³ã¸é€ã‚Šã¾ã™ã€ã€‚4ã¨1ã‚’äº¤æ›ã—ã¦[1,4,3,2]ã€4ã¨3ã‚’äº¤æ›ã—ã¦[1,3,4,2]ã€4ã¨2ã‚’äº¤æ›ã—ã¦[1,3,2,4]ã¨ãªã‚Šã¾ã™ã€‚1å›žã®èµ°æŸ»ã§æœ€å¤§å€¤4ãŒæœ«å°¾ã¸ç§»å‹•ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ[1,4,2,3]ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå·¦ã‹ã‚‰é †ã«éš£æŽ¥è¦ç´ ã‚’æ¯”è¼ƒã—ã€å¤§ãã„æ–¹ã‚’å³ã¸é€ã‚Šã¾ã™ã€ã€‚4ã¨1ã‚’äº¤æ›ã—ã¦[1,4,3,2]ã€4ã¨3ã‚’äº¤æ›ã—ã¦[1,3,4,2]ã€4ã¨2ã‚’äº¤æ›ã—ã¦[1,3,2,4]ã¨ãªã‚Šã¾ã™ã€‚1å›žã®èµ°æŸ»ã§æœ€å¤§å€¤4ãŒæœ«å°¾ã¸ç§»å‹•ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ[1,2,3,4]ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå·¦ã‹ã‚‰é †ã«éš£æŽ¥è¦ç´ ã‚’æ¯”è¼ƒã—ã€å¤§ãã„æ–¹ã‚’å³ã¸é€ã‚Šã¾ã™ã€ã€‚4ã¨1ã‚’äº¤æ›ã—ã¦[1,4,3,2]ã€4ã¨3ã‚’äº¤æ›ã—ã¦[1,3,4,2]ã€4ã¨2ã‚’äº¤æ›ã—ã¦[1,3,2,4]ã¨ãªã‚Šã¾ã™ã€‚1å›žã®èµ°æŸ»ã§æœ€å¤§å€¤4ãŒæœ«å°¾ã¸ç§»å‹•ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ[4,1,2,3]ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_03_03",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "algo-07",
    "cat": "ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ",
    "concept": "æ¡ä»¶åˆ†å²",
    "difficulty": "åŸºç¤Ž",
    "q": "x=7ã®ã¨ãã€Œif x > 5 then yâ†1 else yâ†0ã€ã‚’å®Ÿè¡Œã—ãŸå¾Œã®yã¯ï¼Ÿ",
    "options": [
      "0",
      "1",
      "5",
      "7"
    ],
    "a": 1,
    "exp": "7>5ã¯çœŸãªã®ã§thenå´ãŒå®Ÿè¡Œã•ã‚Œã€y=1ã«ãªã‚Šã¾ã™ã€‚",
    "hint": "æ¡ä»¶7>5ã‚’è©•ä¾¡ã—ã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ1ã‹ã‚‰5ã¾ã§åŠ ç®—ã™ã‚‹ãªã‚‰sum=0ã‹ã‚‰5å›žåŠ ç®—ã—15ã«ãªã‚Šã¾ã™ã€ã€‚7>5ã¯çœŸãªã®ã§thenå´ãŒå®Ÿè¡Œã•ã‚Œã€y=1ã«ãªã‚Šã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ0ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "7>5ã¯çœŸãªã®ã§thenå´ãŒå®Ÿè¡Œã•ã‚Œã€y=1ã«ãªã‚Šã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ1ã‹ã‚‰5ã¾ã§åŠ ç®—ã™ã‚‹ãªã‚‰sum=0ã‹ã‚‰5å›žåŠ ç®—ã—15ã«ãªã‚Šã¾ã™ã€ã€‚7>5ã¯çœŸãªã®ã§thenå´ãŒå®Ÿè¡Œã•ã‚Œã€y=1ã«ãªã‚Šã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ5ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ1ã‹ã‚‰5ã¾ã§åŠ ç®—ã™ã‚‹ãªã‚‰sum=0ã‹ã‚‰5å›žåŠ ç®—ã—15ã«ãªã‚Šã¾ã™ã€ã€‚7>5ã¯çœŸãªã®ã§thenå´ãŒå®Ÿè¡Œã•ã‚Œã€y=1ã«ãªã‚Šã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ7ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_03_02",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "mgmt-11",
    "cat": "ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ",
    "concept": "EVM",
    "difficulty": "æ¨™æº–",
    "q": "EVMã§ã€ã‚ã‚‹æ™‚ç‚¹ã®PVãŒ100ã€EVãŒ80ã§ã‚ã£ãŸã€‚ã‚¹ã‚±ã‚¸ãƒ¥ãƒ¼ãƒ«ã®çŠ¶æ³ã¨ã—ã¦æœ€ã‚‚é©åˆ‡ãªã®ã¯ï¼Ÿ",
    "options": [
      "è¨ˆç”»ã©ãŠã‚Šã§ã‚ã‚‹",
      "ã‚³ã‚¹ãƒˆè¶…éŽã§ã‚ã‚‹ã¨åˆ¤æ–­ã§ãã‚‹",
      "è¨ˆç”»ã‚ˆã‚Šé…ã‚Œã¦ã„ã‚‹",
      "è¨ˆç”»ã‚ˆã‚Šé€²ã‚“ã§ã„ã‚‹"
    ],
    "a": 2,
    "exp": "EVï¼ˆå‡ºæ¥é«˜ï¼‰ãŒPVï¼ˆè¨ˆç”»ä¾¡å€¤ï¼‰ã‚ˆã‚Šå°ã•ã„ã®ã§ã€è¨ˆç”»ã—ãŸæ™‚ç‚¹ã¾ã§ã«äºˆå®šã—ã¦ã„ãŸä½œæ¥­é‡ã‚’é”æˆã§ãã¦ãŠã‚‰ãšã€ã‚¹ã‚±ã‚¸ãƒ¥ãƒ¼ãƒ«ã¯é…ã‚Œã¦ã„ã¾ã™ã€‚",
    "hint": "ã‚¹ã‚±ã‚¸ãƒ¥ãƒ¼ãƒ«ã¯EVã¨PVã‚’æ¯”è¼ƒã—ã¾ã™ã€‚EVï¼œPVãªã‚‰é…ã‚Œã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒPVï¼šè¨ˆç”»ä¸Šã€ä»Šã¾ã§ã«çµ‚ãˆã¦ã„ã‚‹ã¯ãšã®ä½œæ¥­ä¾¡å€¤ã€ã€‚EVï¼ˆå‡ºæ¥é«˜ï¼‰ãŒPVï¼ˆè¨ˆç”»ä¾¡å€¤ï¼‰ã‚ˆã‚Šå°ã•ã„ã®ã§ã€è¨ˆç”»ã—ãŸæ™‚ç‚¹ã¾ã§ã«äºˆå®šã—ã¦ã„ãŸä½œæ¥­é‡ã‚’é”æˆã§ãã¦ãŠã‚‰ãšã€ã‚¹ã‚±ã‚¸ãƒ¥ãƒ¼ãƒ«ã¯é…ã‚Œã¦ã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œè¨ˆç”»ã©ãŠã‚Šã§ã‚ã‚‹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒPVï¼šè¨ˆç”»ä¸Šã€ä»Šã¾ã§ã«çµ‚ãˆã¦ã„ã‚‹ã¯ãšã®ä½œæ¥­ä¾¡å€¤ã€ã€‚EVï¼ˆå‡ºæ¥é«˜ï¼‰ãŒPVï¼ˆè¨ˆç”»ä¾¡å€¤ï¼‰ã‚ˆã‚Šå°ã•ã„ã®ã§ã€è¨ˆç”»ã—ãŸæ™‚ç‚¹ã¾ã§ã«äºˆå®šã—ã¦ã„ãŸä½œæ¥­é‡ã‚’é”æˆã§ãã¦ãŠã‚‰ãšã€ã‚¹ã‚±ã‚¸ãƒ¥ãƒ¼ãƒ«ã¯é…ã‚Œã¦ã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œã‚³ã‚¹ãƒˆè¶…éŽã§ã‚ã‚‹ã¨åˆ¤æ–­ã§ãã‚‹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "EVï¼ˆå‡ºæ¥é«˜ï¼‰ãŒPVï¼ˆè¨ˆç”»ä¾¡å€¤ï¼‰ã‚ˆã‚Šå°ã•ã„ã®ã§ã€è¨ˆç”»ã—ãŸæ™‚ç‚¹ã¾ã§ã«äºˆå®šã—ã¦ã„ãŸä½œæ¥­é‡ã‚’é”æˆã§ãã¦ãŠã‚‰ãšã€ã‚¹ã‚±ã‚¸ãƒ¥ãƒ¼ãƒ«ã¯é…ã‚Œã¦ã„ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒPVï¼šè¨ˆç”»ä¸Šã€ä»Šã¾ã§ã«çµ‚ãˆã¦ã„ã‚‹ã¯ãšã®ä½œæ¥­ä¾¡å€¤ã€ã€‚EVï¼ˆå‡ºæ¥é«˜ï¼‰ãŒPVï¼ˆè¨ˆç”»ä¾¡å€¤ï¼‰ã‚ˆã‚Šå°ã•ã„ã®ã§ã€è¨ˆç”»ã—ãŸæ™‚ç‚¹ã¾ã§ã«äºˆå®šã—ã¦ã„ãŸä½œæ¥­é‡ã‚’é”æˆã§ãã¦ãŠã‚‰ãšã€ã‚¹ã‚±ã‚¸ãƒ¥ãƒ¼ãƒ«ã¯é…ã‚Œã¦ã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œè¨ˆç”»ã‚ˆã‚Šé€²ã‚“ã§ã„ã‚‹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_14_05",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "mgmt-12",
    "cat": "ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ",
    "concept": "ãƒªã‚¹ã‚¯",
    "difficulty": "æ¨™æº–",
    "q": "é‡è¦ãªã‚µãƒ¼ãƒéšœå®³ã®ç™ºç”Ÿç¢ºçŽ‡ã‚’ä¸‹ã’ã‚‹ãŸã‚ã€å†—é•·åŒ–ã‚„äºˆé˜²ä¿å®ˆã‚’è¡Œã†ãƒªã‚¹ã‚¯å¯¾å¿œã¯ã©ã‚Œã«æœ€ã‚‚è¿‘ã„ï¼Ÿ",
    "options": [
      "ãƒªã‚¹ã‚¯å—å®¹",
      "ãƒªã‚¹ã‚¯å›žé¿",
      "ãƒªã‚¹ã‚¯ç§»è»¢",
      "ãƒªã‚¹ã‚¯è»½æ¸›"
    ],
    "a": 3,
    "exp": "ç™ºç”Ÿç¢ºçŽ‡ã‚„å½±éŸ¿åº¦ã‚’å°ã•ãã™ã‚‹å¯¾ç­–ã¯ãƒªã‚¹ã‚¯è»½æ¸›ã§ã™ã€‚å†—é•·åŒ–ã‚„äºˆé˜²ä¿å®ˆã¯ã€éšœå®³ãƒªã‚¹ã‚¯ã‚’ä½Žæ¸›ã™ã‚‹ä»£è¡¨çš„ãªå¯¾ç­–ã§ã™ã€‚",
    "hint": "ãƒªã‚¹ã‚¯ãã®ã‚‚ã®ã‚’ã‚¼ãƒ­ã«ã›ãšã€ç¢ºçŽ‡ã‚„å½±éŸ¿ã‚’å°ã•ãã™ã‚‹å¯¾å¿œã§ã™ã€‚",
    "choiceExps": [
      "ã€Œãƒªã‚¹ã‚¯ã€ã¯ã€æœ›ã¾ã—ããªã„å‡ºæ¥äº‹ãŒèµ·ã“ã‚‹å¯èƒ½æ€§ã¨ã€ãã®å½±éŸ¿ã‚’çµ„ã¿åˆã‚ã›ã¦è€ƒãˆãŸã‚‚ã®ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œãƒªã‚¹ã‚¯ã€ã¯ã€æœ›ã¾ã—ããªã„å‡ºæ¥äº‹ãŒèµ·ã“ã‚‹å¯èƒ½æ€§ã¨ã€ãã®å½±éŸ¿ã‚’çµ„ã¿åˆã‚ã›ã¦è€ƒãˆãŸã‚‚ã®ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œãƒªã‚¹ã‚¯ã€ã¯ã€æœ›ã¾ã—ããªã„å‡ºæ¥äº‹ãŒèµ·ã“ã‚‹å¯èƒ½æ€§ã¨ã€ãã®å½±éŸ¿ã‚’çµ„ã¿åˆã‚ã›ã¦è€ƒãˆãŸã‚‚ã®ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ç™ºç”Ÿç¢ºçŽ‡ã‚„å½±éŸ¿åº¦ã‚’å°ã•ãã™ã‚‹å¯¾ç­–ã¯ãƒªã‚¹ã‚¯è»½æ¸›ã§ã™ã€‚å†—é•·åŒ–ã‚„äºˆé˜²ä¿å®ˆã¯ã€éšœå®³ãƒªã‚¹ã‚¯ã‚’ä½Žæ¸›ã™ã‚‹ä»£è¡¨çš„ãªå¯¾ç­–ã§ã™ã€‚"
    ],
    "explainTopicId": "core_14_06",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "å½¹å‰²é¸æŠž"
  },
  {
    "id": "mgmt-13",
    "cat": "ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ",
    "concept": "å†…éƒ¨çµ±åˆ¶",
    "difficulty": "æ¨™æº–",
    "q": "æ¥­å‹™ãŒé©åˆ‡ã«è¡Œã‚ã‚Œã‚‹ã‚ˆã†ã€çµ„ç¹”å†…ã«ä»•çµ„ã¿ã‚„ãƒ«ãƒ¼ãƒ«ã‚’æ•´å‚™ãƒ»é‹ç”¨ã™ã‚‹è€ƒãˆæ–¹ã«æœ€ã‚‚è¿‘ã„ã®ã¯ï¼Ÿ",
    "options": [
      "å†…éƒ¨çµ±åˆ¶",
      "å†…éƒ¨ç›£æŸ»",
      "å¤–éƒ¨ç›£æŸ»",
      "ãƒªã‚¹ã‚¯ç§»è»¢"
    ],
    "a": 0,
    "exp": "å†…éƒ¨çµ±åˆ¶ã¯ã€æ¥­å‹™ã®æœ‰åŠ¹æ€§ãƒ»åŠ¹çŽ‡æ€§ã€è²¡å‹™å ±å‘Šã®ä¿¡é ¼æ€§ã€æ³•ä»¤éµå®ˆãªã©ã®ç›®çš„é”æˆã‚’æ”¯ãˆã‚‹ãŸã‚ã€çµ„ç¹”å†…ã«æ•´å‚™ãƒ»é‹ç”¨ã™ã‚‹ä»•çµ„ã¿ã§ã™ã€‚",
    "hint": "å€‹åˆ¥ã®ç›£æŸ»æ´»å‹•ã§ã¯ãªãã€çµ„ç¹”å…¨ä½“ã§æ¥­å‹™ã‚’é©åˆ‡ã«è¡Œã†ãŸã‚ã®ä»•çµ„ã¿ã‚’è€ƒãˆã¾ã™ã€‚",
    "choiceExps": [
      "å†…éƒ¨çµ±åˆ¶ã¯ã€æ¥­å‹™ã®æœ‰åŠ¹æ€§ãƒ»åŠ¹çŽ‡æ€§ã€è²¡å‹™å ±å‘Šã®ä¿¡é ¼æ€§ã€æ³•ä»¤éµå®ˆãªã©ã®ç›®çš„é”æˆã‚’æ”¯ãˆã‚‹ãŸã‚ã€çµ„ç¹”å†…ã«æ•´å‚™ãƒ»é‹ç”¨ã™ã‚‹ä»•çµ„ã¿ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå†…éƒ¨çµ±åˆ¶ã¯ã€ä¼šç¤¾ãŒé©åˆ‡ã«æ¥­å‹™ã‚’è¡Œã„ã€ä¸æ­£ã‚„ãƒŸã‚¹ã‚’é˜²ãŽã€æ­£ã—ã„æƒ…å ±ã‚’ä½œã‚Œã‚‹ã‚ˆã†ã«ã™ã‚‹ä»•çµ„ã¿ã§ã™ã€‚è·å‹™åˆ†æŽŒã‚„æ‰¿èªæ‰‹ç¶šãªã©ã‚‚ãã®ä¸€éƒ¨ã§ã™ã€ã€‚å†…éƒ¨çµ±åˆ¶ã¯ã€æ¥­å‹™ã®æœ‰åŠ¹æ€§ãƒ»åŠ¹çŽ‡æ€§ã€è²¡å‹™å ±å‘Šã®ä¿¡é ¼æ€§ã€æ³•ä»¤éµå®ˆãªã©ã®ç›®çš„é”æˆã‚’æ”¯ãˆã‚‹ãŸã‚ã€çµ„ç¹”å†…ã«æ•´å‚™ãƒ»é‹ç”¨ã™ã‚‹ä»•çµ„ã¿ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå†…éƒ¨ç›£æŸ»ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå†…éƒ¨çµ±åˆ¶ã¯ã€ä¼šç¤¾ãŒé©åˆ‡ã«æ¥­å‹™ã‚’è¡Œã„ã€ä¸æ­£ã‚„ãƒŸã‚¹ã‚’é˜²ãŽã€æ­£ã—ã„æƒ…å ±ã‚’ä½œã‚Œã‚‹ã‚ˆã†ã«ã™ã‚‹ä»•çµ„ã¿ã§ã™ã€‚è·å‹™åˆ†æŽŒã‚„æ‰¿èªæ‰‹ç¶šãªã©ã‚‚ãã®ä¸€éƒ¨ã§ã™ã€ã€‚å†…éƒ¨çµ±åˆ¶ã¯ã€æ¥­å‹™ã®æœ‰åŠ¹æ€§ãƒ»åŠ¹çŽ‡æ€§ã€è²¡å‹™å ±å‘Šã®ä¿¡é ¼æ€§ã€æ³•ä»¤éµå®ˆãªã©ã®ç›®çš„é”æˆã‚’æ”¯ãˆã‚‹ãŸã‚ã€çµ„ç¹”å†…ã«æ•´å‚™ãƒ»é‹ç”¨ã™ã‚‹ä»•çµ„ã¿ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå¤–éƒ¨ç›£æŸ»ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œãƒªã‚¹ã‚¯ã€ã¯ã€æœ›ã¾ã—ããªã„å‡ºæ¥äº‹ãŒèµ·ã“ã‚‹å¯èƒ½æ€§ã¨ã€ãã®å½±éŸ¿ã‚’çµ„ã¿åˆã‚ã›ã¦è€ƒãˆãŸã‚‚ã®ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_15_06",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "åŽŸå‰‡ãƒ»é–¢ä¿‚"
  },
  {
    "id": "strat-12",
    "cat": "ã‚¹ãƒˆãƒ©ãƒ†ã‚¸",
    "concept": "ãƒžãƒ¼ã‚±ãƒ†ã‚£ãƒ³ã‚°",
    "difficulty": "åŸºç¤Ž",
    "q": "ãƒžãƒ¼ã‚±ãƒ†ã‚£ãƒ³ã‚°ã®4Pã«å«ã¾ã‚Œãªã„ã‚‚ã®ã¯ã©ã‚Œï¼Ÿ",
    "options": [
      "Price",
      "People",
      "Promotion",
      "Product"
    ],
    "a": 1,
    "exp": "ä»£è¡¨çš„ãªãƒžãƒ¼ã‚±ãƒ†ã‚£ãƒ³ã‚°ãƒŸãƒƒã‚¯ã‚¹ã®4Pã¯Productï¼ˆè£½å“ï¼‰ã€Priceï¼ˆä¾¡æ ¼ï¼‰ã€Placeï¼ˆæµé€šï¼‰ã€Promotionï¼ˆè²©å£²ä¿ƒé€²ï¼‰ã§ã™ã€‚Peopleã¯ã“ã®4Pã«ã¯å«ã¾ã‚Œã¾ã›ã‚“ã€‚",
    "hint": "4Pã¯ Productãƒ»Priceãƒ»Placeãƒ»Promotion ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ4P=Product Price Place Promotionã€ã€‚ä»£è¡¨çš„ãªãƒžãƒ¼ã‚±ãƒ†ã‚£ãƒ³ã‚°ãƒŸãƒƒã‚¯ã‚¹ã®4Pã¯Productï¼ˆè£½å“ï¼‰ã€Priceï¼ˆä¾¡æ ¼ï¼‰ã€Placeï¼ˆæµé€šï¼‰ã€Promotionï¼ˆè²©å£²ä¿ƒé€²ï¼‰ã§ã™ã€‚Peopleã¯ã“ã®4Pã«ã¯å«ã¾ã‚Œã¾ã›ã‚“ã€‚ ã—ãŸãŒã£ã¦ã€ŒPriceã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ä»£è¡¨çš„ãªãƒžãƒ¼ã‚±ãƒ†ã‚£ãƒ³ã‚°ãƒŸãƒƒã‚¯ã‚¹ã®4Pã¯Productï¼ˆè£½å“ï¼‰ã€Priceï¼ˆä¾¡æ ¼ï¼‰ã€Placeï¼ˆæµé€šï¼‰ã€Promotionï¼ˆè²©å£²ä¿ƒé€²ï¼‰ã§ã™ã€‚Peopleã¯ã“ã®4Pã«ã¯å«ã¾ã‚Œã¾ã›ã‚“ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ4P=Product Price Place Promotionã€ã€‚ä»£è¡¨çš„ãªãƒžãƒ¼ã‚±ãƒ†ã‚£ãƒ³ã‚°ãƒŸãƒƒã‚¯ã‚¹ã®4Pã¯Productï¼ˆè£½å“ï¼‰ã€Priceï¼ˆä¾¡æ ¼ï¼‰ã€Placeï¼ˆæµé€šï¼‰ã€Promotionï¼ˆè²©å£²ä¿ƒé€²ï¼‰ã§ã™ã€‚Peopleã¯ã“ã®4Pã«ã¯å«ã¾ã‚Œã¾ã›ã‚“ã€‚ ã—ãŸãŒã£ã¦ã€ŒPromotionã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ4P=Product Price Place Promotionã€ã€‚ä»£è¡¨çš„ãªãƒžãƒ¼ã‚±ãƒ†ã‚£ãƒ³ã‚°ãƒŸãƒƒã‚¯ã‚¹ã®4Pã¯Productï¼ˆè£½å“ï¼‰ã€Priceï¼ˆä¾¡æ ¼ï¼‰ã€Placeï¼ˆæµé€šï¼‰ã€Promotionï¼ˆè²©å£²ä¿ƒé€²ï¼‰ã§ã™ã€‚Peopleã¯ã“ã®4Pã«ã¯å«ã¾ã‚Œã¾ã›ã‚“ã€‚ ã—ãŸãŒã£ã¦ã€ŒProductã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_18_05",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "strat-13",
    "cat": "ã‚¹ãƒˆãƒ©ãƒ†ã‚¸",
    "concept": "KPI",
    "difficulty": "æ¨™æº–",
    "q": "æœ€çµ‚ç›®æ¨™ã®é”æˆã«å‘ã‘ãŸé€”ä¸­çµŒéŽã‚’æ¸¬ã‚‹é‡è¦ãªæŒ‡æ¨™ã¯ï¼Ÿ",
    "options": [
      "ROI",
      "KGI",
      "KPI",
      "CSF"
    ],
    "a": 2,
    "exp": "KPIï¼ˆKey Performance Indicatorï¼‰ã¯ã€æœ€çµ‚ç›®æ¨™ã®é”æˆã«å‘ã‘ãŸãƒ—ãƒ­ã‚»ã‚¹ã®é€²æ—ã‚’ç¶™ç¶šçš„ã«æ¸¬ã‚‹é‡è¦æ¥­ç¸¾è©•ä¾¡æŒ‡æ¨™ã§ã™ã€‚",
    "hint": "æœ€çµ‚ç›®æ¨™ãã®ã‚‚ã®ã§ã¯ãªãã€ãã®é”æˆã«å‘ã‘ãŸé€”ä¸­ã®é‡è¦æŒ‡æ¨™ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒKPIã¯éŽç¨‹ã®é‡è¦æŒ‡æ¨™ã€ã€‚KPIï¼ˆKey Performance Indicatorï¼‰ã¯ã€æœ€çµ‚ç›®æ¨™ã®é”æˆã«å‘ã‘ãŸãƒ—ãƒ­ã‚»ã‚¹ã®é€²æ—ã‚’ç¶™ç¶šçš„ã«æ¸¬ã‚‹é‡è¦æ¥­ç¸¾è©•ä¾¡æŒ‡æ¨™ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒROIã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€ŒKGIã€ã¯ã€Key Goal Indicatorã®ç•¥ã§ã€æœ€çµ‚çš„ã«é”æˆã—ãŸã„ç›®æ¨™ã‚’æ¸¬ã‚‹æŒ‡æ¨™ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "KPIï¼ˆKey Performance Indicatorï¼‰ã¯ã€æœ€çµ‚ç›®æ¨™ã®é”æˆã«å‘ã‘ãŸãƒ—ãƒ­ã‚»ã‚¹ã®é€²æ—ã‚’ç¶™ç¶šçš„ã«æ¸¬ã‚‹é‡è¦æ¥­ç¸¾è©•ä¾¡æŒ‡æ¨™ã§ã™ã€‚",
      "ã€ŒCSFã€ã¯ã€Critical Success Factorï¼ˆé‡è¦æˆåŠŸè¦å› ï¼‰ã€‚ç›®æ¨™é”æˆã®ãŸã‚ç‰¹ã«é‡è¦ã¨ãªã‚‹è¦å› ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_18_04",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "strat-14",
    "cat": "ã‚¹ãƒˆãƒ©ãƒ†ã‚¸",
    "concept": "æ³•å‹™",
    "difficulty": "æ¨™æº–",
    "q": "ä»–äººãŒä½œæˆã—ãŸãƒ—ãƒ­ã‚°ãƒ©ãƒ ã‚’è¨±å¯ãªãè¤‡è£½ã—ã€ç¬¬ä¸‰è€…ã¸é…å¸ƒã—ãŸã€‚ã“ã®è¡Œç‚ºã§ä¸»ã«å•é¡Œã¨ãªã‚‹æ¨©åˆ©ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ç‰¹è¨±æ¨©",
      "å•†æ¨™æ¨©",
      "æ‰€æœ‰æ¨©",
      "è‘—ä½œæ¨©"
    ],
    "a": 3,
    "exp": "ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã¯è‘—ä½œç‰©ã¨ã—ã¦è‘—ä½œæ¨©ã«ã‚ˆã‚‹ä¿è­·å¯¾è±¡ã¨ãªã‚Šå¾—ã¾ã™ã€‚",
    "hint": "ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã®ã€Œè¡¨ç¾ã€ã‚’ä¿è­·ã™ã‚‹æ¨©åˆ©ã§ã™ã€‚",
    "choiceExps": [
      "ã€Œç‰¹è¨±æ¨©ã€ã¯ã€æ–°ã—ã„æŠ€è¡“çš„ãªç™ºæ˜Žã‚’ä¿è­·ã™ã‚‹æ¨©åˆ©ã§ã™ã€‚ç™»éŒ²ãŒå¿…è¦ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œå•†æ¨™æ¨©ã€ã¯ã€å•†å“åã‚„ãƒ­ã‚´ãªã©ã€å•†å“ãƒ»ã‚µãƒ¼ãƒ“ã‚¹ã‚’åŒºåˆ¥ã™ã‚‹ç›®å°ã‚’ä¿è­·ã™ã‚‹æ¨©åˆ©ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œè‘—ä½œæ¨©ã¯å‰µä½œæ™‚ã«ç™ºç”Ÿã€ã€‚ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã¯è‘—ä½œç‰©ã¨ã—ã¦è‘—ä½œæ¨©ã«ã‚ˆã‚‹ä¿è­·å¯¾è±¡ã¨ãªã‚Šå¾—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œæ‰€æœ‰æ¨©ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã¯è‘—ä½œç‰©ã¨ã—ã¦è‘—ä½œæ¨©ã«ã‚ˆã‚‹ä¿è­·å¯¾è±¡ã¨ãªã‚Šå¾—ã¾ã™ã€‚"
    ],
    "explainTopicId": "core_21_01",
    "explainTopicSource": "semantic",
    "cognitiveRewrite": "v90-context",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "å½¹å‰²é¸æŠž"
  },
  {
    "id": "theory-09",
    "cat": "åŸºç¤Žç†è«–",
    "concept": "ãƒ“ãƒƒãƒˆã‚·ãƒ•ãƒˆ",
    "difficulty": "æ¨™æº–",
    "q": "8ãƒ“ãƒƒãƒˆã®2é€²æ•° 00101100 ã‚’1ãƒ“ãƒƒãƒˆå·¦ã«è«–ç†ã‚·ãƒ•ãƒˆã—ãŸçµæžœã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "01011000",
      "00010110",
      "10110000",
      "00101101"
    ],
    "a": 0,
    "exp": "å·¦ã‚·ãƒ•ãƒˆã§ã¯å„ãƒ“ãƒƒãƒˆã‚’å·¦ã¸1æ¡ç§»ã—ã€å³ç«¯ã«0ã‚’å…¥ã‚Œã¾ã™ã€‚00101100 â†’ 01011000 ã§ã™ã€‚",
    "hint": "å·¦ã¸1æ¡å‹•ã‹ã—ã€ç©ºã„ãŸå³ç«¯ã«ã¯0ã‚’å…¥ã‚Œã¾ã™ã€‚",
    "choiceExps": [
      "å·¦ã‚·ãƒ•ãƒˆã§ã¯å„ãƒ“ãƒƒãƒˆã‚’å·¦ã¸1æ¡ç§»ã—ã€å³ç«¯ã«0ã‚’å…¥ã‚Œã¾ã™ã€‚00101100 â†’ 01011000 ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ2é€²æ•°00110100ã‚’1bitè«–ç†å³ã‚·ãƒ•ãƒˆã™ã‚‹ã¨00011010ã«ãªã‚Šã¾ã™ã€‚æ­£ã®æ•´æ•°ãªã‚‰2ã§å‰²ã‚‹æ“ä½œã«å¯¾å¿œã™ã‚‹å ´åˆãŒã‚ã‚Šã¾ã™ã€ã€‚å·¦ã‚·ãƒ•ãƒˆã§ã¯å„ãƒ“ãƒƒãƒˆã‚’å·¦ã¸1æ¡ç§»ã—ã€å³ç«¯ã«0ã‚’å…¥ã‚Œã¾ã™ã€‚00101100 â†’ 01011000 ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ00010110ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ2é€²æ•°00110100ã‚’1bitè«–ç†å³ã‚·ãƒ•ãƒˆã™ã‚‹ã¨00011010ã«ãªã‚Šã¾ã™ã€‚æ­£ã®æ•´æ•°ãªã‚‰2ã§å‰²ã‚‹æ“ä½œã«å¯¾å¿œã™ã‚‹å ´åˆãŒã‚ã‚Šã¾ã™ã€ã€‚å·¦ã‚·ãƒ•ãƒˆã§ã¯å„ãƒ“ãƒƒãƒˆã‚’å·¦ã¸1æ¡ç§»ã—ã€å³ç«¯ã«0ã‚’å…¥ã‚Œã¾ã™ã€‚00101100 â†’ 01011000 ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ10110000ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ2é€²æ•°00110100ã‚’1bitè«–ç†å³ã‚·ãƒ•ãƒˆã™ã‚‹ã¨00011010ã«ãªã‚Šã¾ã™ã€‚æ­£ã®æ•´æ•°ãªã‚‰2ã§å‰²ã‚‹æ“ä½œã«å¯¾å¿œã™ã‚‹å ´åˆãŒã‚ã‚Šã¾ã™ã€ã€‚å·¦ã‚·ãƒ•ãƒˆã§ã¯å„ãƒ“ãƒƒãƒˆã‚’å·¦ã¸1æ¡ç§»ã—ã€å³ç«¯ã«0ã‚’å…¥ã‚Œã¾ã™ã€‚00101100 â†’ 01011000 ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ00101101ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_01_07",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "theory-10",
    "cat": "åŸºç¤Žç†è«–",
    "concept": "2ã®è£œæ•°",
    "difficulty": "æ¨™æº–",
    "q": "8ãƒ“ãƒƒãƒˆã®2ã®è£œæ•°è¡¨ç¾ã§ã€10é€²æ•°ã® -5 ã‚’è¡¨ã™ã‚‚ã®ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "10000101",
      "11111011",
      "00000101",
      "11111010"
    ],
    "a": 1,
    "exp": "+5 ã¯ 00000101 ã§ã™ã€‚å…¨ãƒ“ãƒƒãƒˆã‚’åè»¢ã—ã¦11111010ã¨ã—ã€1ã‚’åŠ ãˆã‚‹ã¨11111011ã«ãªã‚Šã¾ã™ã€‚",
    "hint": "æ­£ã®5ã‚’2é€²æ•°ã«ã—ã€ãƒ“ãƒƒãƒˆåè»¢ã—ã¦1ã‚’åŠ ãˆã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ1ã‚’åŠ ãˆã¦11111011ã€‚ã“ã‚ŒãŒ8bitã®-5ã€ã€‚+5 ã¯ 00000101 ã§ã™ã€‚å…¨ãƒ“ãƒƒãƒˆã‚’åè»¢ã—ã¦11111010ã¨ã—ã€1ã‚’åŠ ãˆã‚‹ã¨11111011ã«ãªã‚Šã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ10000101ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "+5 ã¯ 00000101 ã§ã™ã€‚å…¨ãƒ“ãƒƒãƒˆã‚’åè»¢ã—ã¦11111010ã¨ã—ã€1ã‚’åŠ ãˆã‚‹ã¨11111011ã«ãªã‚Šã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ1ã‚’åŠ ãˆã¦11111011ã€‚ã“ã‚ŒãŒ8bitã®-5ã€ã€‚+5 ã¯ 00000101 ã§ã™ã€‚å…¨ãƒ“ãƒƒãƒˆã‚’åè»¢ã—ã¦11111010ã¨ã—ã€1ã‚’åŠ ãˆã‚‹ã¨11111011ã«ãªã‚Šã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ00000101ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ1ã‚’åŠ ãˆã¦11111011ã€‚ã“ã‚ŒãŒ8bitã®-5ã€ã€‚+5 ã¯ 00000101 ã§ã™ã€‚å…¨ãƒ“ãƒƒãƒˆã‚’åè»¢ã—ã¦11111010ã¨ã—ã€1ã‚’åŠ ãˆã‚‹ã¨11111011ã«ãªã‚Šã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ11111010ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_01_05",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "theory-11",
    "cat": "åŸºç¤Žç†è«–",
    "concept": "è«–ç†æ¼”ç®—",
    "difficulty": "æ¨™æº–",
    "q": "ãƒ‰ãƒ»ãƒ¢ãƒ«ã‚¬ãƒ³ã®æ³•å‰‡ã«ã‚ˆã‚Šã€NOT(A AND B) ã¨ç­‰ä¾¡ãªè«–ç†å¼ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "A AND (NOT B)",
      "(NOT A) AND (NOT B)",
      "(NOT A) OR (NOT B)",
      "A OR B"
    ],
    "a": 2,
    "exp": "ANDå…¨ä½“ã®å¦å®šã¯ã€ãã‚Œãžã‚Œã‚’å¦å®šã—ãŸORã«å¤‰æ›ã§ãã¾ã™ã€‚ã—ãŸãŒã£ã¦ (NOT A) OR (NOT B) ã§ã™ã€‚",
    "hint": "ANDã‚’å¦å®šã™ã‚‹ã¨ã€æ¼”ç®—å­ã¯ORã¸å…¥ã‚Œæ›¿ã‚ã‚Šã¾ã™ã€‚",
    "choiceExps": [
      "ã€ŒANDã€ã¯ã€ä¸¡æ–¹ã®æ¡ä»¶ãŒçœŸã®ã¨ãã ã‘çœŸã«ãªã‚‹è«–ç†æ¼”ç®—ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€ŒANDã€ã¯ã€ä¸¡æ–¹ã®æ¡ä»¶ãŒçœŸã®ã¨ãã ã‘çœŸã«ãªã‚‹è«–ç†æ¼”ç®—ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ANDå…¨ä½“ã®å¦å®šã¯ã€ãã‚Œãžã‚Œã‚’å¦å®šã—ãŸORã«å¤‰æ›ã§ãã¾ã™ã€‚ã—ãŸãŒã£ã¦ (NOT A) OR (NOT B) ã§ã™ã€‚",
      "ã€ŒORã€ã¯ã€ã©ã¡ã‚‰ã‹ä¸€æ–¹ä»¥ä¸ŠãŒçœŸãªã‚‰çœŸã«ãªã‚‹è«–ç†æ¼”ç®—ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_02_01",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "theory-12",
    "cat": "åŸºç¤Žç†è«–",
    "concept": "æƒ…å ±é‡",
    "difficulty": "åŸºç¤Ž",
    "q": "50é€šã‚Šã®çŠ¶æ…‹ã‚’ã€ãã‚Œãžã‚Œç•°ãªã‚‹ãƒ“ãƒƒãƒˆåˆ—ã§è¡¨ã™ãŸã‚ã«æœ€ä½Žä½•ãƒ“ãƒƒãƒˆå¿…è¦ã‹ã€‚",
    "options": [
      "5ãƒ“ãƒƒãƒˆ",
      "7ãƒ“ãƒƒãƒˆ",
      "8ãƒ“ãƒƒãƒˆ",
      "6ãƒ“ãƒƒãƒˆ"
    ],
    "a": 3,
    "exp": "5ãƒ“ãƒƒãƒˆã§ã¯2^5=32é€šã‚Šã§ä¸è¶³ã—ã¾ã™ã€‚6ãƒ“ãƒƒãƒˆãªã‚‰2^6=64é€šã‚Šãªã®ã§50çŠ¶æ…‹ã‚’è¡¨ã›ã¾ã™ã€‚",
    "hint": "2^n ãŒ50ä»¥ä¸Šã«ãªã‚‹æœ€å°ã®nã‚’æŽ¢ã—ã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œæ–‡å­—ãƒ»ç”»åƒãƒ»éŸ³å£°ã‚‚æœ€çµ‚çš„ã«ã¯ãƒ“ãƒƒãƒˆåˆ—ã¨ã—ã¦ä¿æŒã•ã‚Œã‚‹ã€ã€‚5ãƒ“ãƒƒãƒˆã§ã¯2^5=32é€šã‚Šã§ä¸è¶³ã—ã¾ã™ã€‚6ãƒ“ãƒƒãƒˆãªã‚‰2^6=64é€šã‚Šãªã®ã§50çŠ¶æ…‹ã‚’è¡¨ã›ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ5ãƒ“ãƒƒãƒˆã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œæ–‡å­—ãƒ»ç”»åƒãƒ»éŸ³å£°ã‚‚æœ€çµ‚çš„ã«ã¯ãƒ“ãƒƒãƒˆåˆ—ã¨ã—ã¦ä¿æŒã•ã‚Œã‚‹ã€ã€‚5ãƒ“ãƒƒãƒˆã§ã¯2^5=32é€šã‚Šã§ä¸è¶³ã—ã¾ã™ã€‚6ãƒ“ãƒƒãƒˆãªã‚‰2^6=64é€šã‚Šãªã®ã§50çŠ¶æ…‹ã‚’è¡¨ã›ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ7ãƒ“ãƒƒãƒˆã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œæ–‡å­—ãƒ»ç”»åƒãƒ»éŸ³å£°ã‚‚æœ€çµ‚çš„ã«ã¯ãƒ“ãƒƒãƒˆåˆ—ã¨ã—ã¦ä¿æŒã•ã‚Œã‚‹ã€ã€‚5ãƒ“ãƒƒãƒˆã§ã¯2^5=32é€šã‚Šã§ä¸è¶³ã—ã¾ã™ã€‚6ãƒ“ãƒƒãƒˆãªã‚‰2^6=64é€šã‚Šãªã®ã§50çŠ¶æ…‹ã‚’è¡¨ã›ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ8ãƒ“ãƒƒãƒˆã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "5ãƒ“ãƒƒãƒˆã§ã¯2^5=32é€šã‚Šã§ä¸è¶³ã—ã¾ã™ã€‚6ãƒ“ãƒƒãƒˆãªã‚‰2^6=64é€šã‚Šãªã®ã§50çŠ¶æ…‹ã‚’è¡¨ã›ã¾ã™ã€‚"
    ],
    "explainTopicId": "core_01_01",
    "explainTopicSource": "manual",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "è¤‡æ•°æ¡ä»¶"
  },
  {
    "id": "theory-13",
    "cat": "åŸºç¤Žç†è«–",
    "concept": "ç¢ºçŽ‡",
    "difficulty": "åŸºç¤Ž",
    "q": "äº’ã„ã«ç‹¬ç«‹ãªäº‹è±¡Aã¨BãŒã‚ã‚Šã€P(A)=0.8ã€P(B)=0.9ã§ã‚ã‚‹ã€‚Aã¨BãŒä¸¡æ–¹èµ·ã“ã‚‹ç¢ºçŽ‡ã¯ï¼Ÿ",
    "options": [
      "0.72",
      "0.80",
      "0.98",
      "0.17"
    ],
    "a": 0,
    "exp": "ç‹¬ç«‹ãªäº‹è±¡ãŒä¸¡æ–¹èµ·ã“ã‚‹ç¢ºçŽ‡ã¯ç©ã§æ±‚ã‚ã¾ã™ã€‚0.8Ã—0.9=0.72ã§ã™ã€‚",
    "hint": "ç‹¬ç«‹ãªã‚‰ã€ä¸¡æ–¹èµ·ã“ã‚‹ç¢ºçŽ‡ã¯2ã¤ã®ç¢ºçŽ‡ã‚’æŽ›ã‘ã¾ã™ã€‚",
    "choiceExps": [
      "ç‹¬ç«‹ãªäº‹è±¡ãŒä¸¡æ–¹èµ·ã“ã‚‹ç¢ºçŽ‡ã¯ç©ã§æ±‚ã‚ã¾ã™ã€‚0.8Ã—0.9=0.72ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œç‹¬ç«‹ãªã‚‰ã€ä¸¡æ–¹èµ·ã“ã‚‹ç¢ºçŽ‡ã¯2ã¤ã®ç¢ºçŽ‡ã‚’æŽ›ã‘ã¾ã™ã€ã€‚ç‹¬ç«‹ãªäº‹è±¡ãŒä¸¡æ–¹èµ·ã“ã‚‹ç¢ºçŽ‡ã¯ç©ã§æ±‚ã‚ã¾ã™ã€‚0.8Ã—0.9=0.72ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ0.80ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œç‹¬ç«‹ãªã‚‰ã€ä¸¡æ–¹èµ·ã“ã‚‹ç¢ºçŽ‡ã¯2ã¤ã®ç¢ºçŽ‡ã‚’æŽ›ã‘ã¾ã™ã€ã€‚ç‹¬ç«‹ãªäº‹è±¡ãŒä¸¡æ–¹èµ·ã“ã‚‹ç¢ºçŽ‡ã¯ç©ã§æ±‚ã‚ã¾ã™ã€‚0.8Ã—0.9=0.72ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ0.98ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œç‹¬ç«‹ãªã‚‰ã€ä¸¡æ–¹èµ·ã“ã‚‹ç¢ºçŽ‡ã¯2ã¤ã®ç¢ºçŽ‡ã‚’æŽ›ã‘ã¾ã™ã€ã€‚ç‹¬ç«‹ãªäº‹è±¡ãŒä¸¡æ–¹èµ·ã“ã‚‹ç¢ºçŽ‡ã¯ç©ã§æ±‚ã‚ã¾ã™ã€‚0.8Ã—0.9=0.72ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ0.17ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_02_06",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "è¤‡æ•°æ¡ä»¶"
  },
  {
    "id": "theory-14",
    "cat": "åŸºç¤Žç†è«–",
    "concept": "é›†åˆ",
    "difficulty": "åŸºç¤Ž",
    "q": "é›†åˆA={1,2,4}ã€é›†åˆB={2,3,4} ã®å’Œé›†åˆ AâˆªB ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "{1,2,2,3,4,4}",
      "{1,2,3,4}",
      "{2,4}",
      "{1,3}"
    ],
    "a": 1,
    "exp": "å’Œé›†åˆã¯Aã¾ãŸã¯Bã®å°‘ãªãã¨ã‚‚ä¸€æ–¹ã«å«ã¾ã‚Œã‚‹è¦ç´ ã®é›†åˆã§ã™ã€‚é‡è¤‡ã‚’é™¤ãã¨ {1,2,3,4} ã§ã™ã€‚",
    "hint": "ä¸¡æ–¹ã®é›†åˆã«å‡ºã¦ãã‚‹è¦ç´ ã‚’ã€é‡è¤‡ãªã—ã§å…¨éƒ¨é›†ã‚ã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒA={1,2}, B={2,3}ãªã‚‰Aâˆ©B={2}ã€AâˆªB={1,2,3}ã§ã™ã€ã€‚å’Œé›†åˆã¯Aã¾ãŸã¯Bã®å°‘ãªãã¨ã‚‚ä¸€æ–¹ã«å«ã¾ã‚Œã‚‹è¦ç´ ã®é›†åˆã§ã™ã€‚é‡è¤‡ã‚’é™¤ãã¨ {1,2,3,4} ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ{1,2,2,3,4,4}ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "å’Œé›†åˆã¯Aã¾ãŸã¯Bã®å°‘ãªãã¨ã‚‚ä¸€æ–¹ã«å«ã¾ã‚Œã‚‹è¦ç´ ã®é›†åˆã§ã™ã€‚é‡è¤‡ã‚’é™¤ãã¨ {1,2,3,4} ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒA={1,2}, B={2,3}ãªã‚‰Aâˆ©B={2}ã€AâˆªB={1,2,3}ã§ã™ã€ã€‚å’Œé›†åˆã¯Aã¾ãŸã¯Bã®å°‘ãªãã¨ã‚‚ä¸€æ–¹ã«å«ã¾ã‚Œã‚‹è¦ç´ ã®é›†åˆã§ã™ã€‚é‡è¤‡ã‚’é™¤ãã¨ {1,2,3,4} ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ{2,4}ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒA={1,2}, B={2,3}ãªã‚‰Aâˆ©B={2}ã€AâˆªB={1,2,3}ã§ã™ã€ã€‚å’Œé›†åˆã¯Aã¾ãŸã¯Bã®å°‘ãªãã¨ã‚‚ä¸€æ–¹ã«å«ã¾ã‚Œã‚‹è¦ç´ ã®é›†åˆã§ã™ã€‚é‡è¤‡ã‚’é™¤ãã¨ {1,2,3,4} ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ{1,3}ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_02_01",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "theory-15",
    "cat": "åŸºç¤Žç†è«–",
    "concept": "ãƒ‘ãƒªãƒ†ã‚£",
    "difficulty": "æ¨™æº–",
    "q": "ãƒ‡ãƒ¼ã‚¿ãƒ“ãƒƒãƒˆ 1011001 ã«å¶æ•°ãƒ‘ãƒªãƒ†ã‚£ã‚’ä»˜åŠ ã™ã‚‹ã€‚ãƒ‘ãƒªãƒ†ã‚£ãƒ“ãƒƒãƒˆã¯ã„ãã¤ã‹ã€‚",
    "options": [
      "1",
      "2",
      "0",
      "åˆ¤å®šã§ããªã„"
    ],
    "a": 2,
    "exp": "1011001 ã«å«ã¾ã‚Œã‚‹1ã¯4å€‹ã§ã™ã€‚ã™ã§ã«å¶æ•°ãªã®ã§ã€å¶æ•°ãƒ‘ãƒªãƒ†ã‚£ã‚’ä¿ã¤ãŸã‚ã®ãƒ‘ãƒªãƒ†ã‚£ãƒ“ãƒƒãƒˆã¯0ã§ã™ã€‚",
    "hint": "ã¾ãšå…ƒãƒ‡ãƒ¼ã‚¿ã«å«ã¾ã‚Œã‚‹1ã®å€‹æ•°ã‚’æ•°ãˆã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒ‘ãƒªãƒ†ã‚£bitã‚‚ç°¡æ˜“ãªèª¤ã‚Šæ¤œå‡ºã«ä½¿ã‚ã‚Œã‚‹ã€ã€‚1011001 ã«å«ã¾ã‚Œã‚‹1ã¯4å€‹ã§ã™ã€‚ã™ã§ã«å¶æ•°ãªã®ã§ã€å¶æ•°ãƒ‘ãƒªãƒ†ã‚£ã‚’ä¿ã¤ãŸã‚ã®ãƒ‘ãƒªãƒ†ã‚£ãƒ“ãƒƒãƒˆã¯0ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ1ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒ‘ãƒªãƒ†ã‚£bitã‚‚ç°¡æ˜“ãªèª¤ã‚Šæ¤œå‡ºã«ä½¿ã‚ã‚Œã‚‹ã€ã€‚1011001 ã«å«ã¾ã‚Œã‚‹1ã¯4å€‹ã§ã™ã€‚ã™ã§ã«å¶æ•°ãªã®ã§ã€å¶æ•°ãƒ‘ãƒªãƒ†ã‚£ã‚’ä¿ã¤ãŸã‚ã®ãƒ‘ãƒªãƒ†ã‚£ãƒ“ãƒƒãƒˆã¯0ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ2ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "1011001 ã«å«ã¾ã‚Œã‚‹1ã¯4å€‹ã§ã™ã€‚ã™ã§ã«å¶æ•°ãªã®ã§ã€å¶æ•°ãƒ‘ãƒªãƒ†ã‚£ã‚’ä¿ã¤ãŸã‚ã®ãƒ‘ãƒªãƒ†ã‚£ãƒ“ãƒƒãƒˆã¯0ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒ‘ãƒªãƒ†ã‚£bitã‚‚ç°¡æ˜“ãªèª¤ã‚Šæ¤œå‡ºã«ä½¿ã‚ã‚Œã‚‹ã€ã€‚ã“ã®ãŸã‚ã€Œåˆ¤å®šã§ããªã„ã€ã®ã‚ˆã†ã«æ–­å®šã™ã‚‹ã¨ã€å•é¡Œã®æ¡ä»¶ãƒ»å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_10_09",
    "explainTopicSource": "manual",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "theory-16",
    "cat": "åŸºç¤Žç†è«–",
    "concept": "16é€²æ•°",
    "difficulty": "åŸºç¤Ž",
    "q": "16é€²æ•° 3A ã‚’8ãƒ“ãƒƒãƒˆã®2é€²æ•°ã§è¡¨ã—ãŸã‚‚ã®ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "11101000",
      "00011010",
      "00110101",
      "00111010"
    ],
    "a": 3,
    "exp": "3ã¯0011ã€Aã¯1010ã§ã™ã€‚4ãƒ“ãƒƒãƒˆãšã¤å¤‰æ›ã—ã¦ä¸¦ã¹ã‚‹ã¨00111010ã§ã™ã€‚",
    "hint": "16é€²æ•°1æ¡ã‚’2é€²æ•°4ãƒ“ãƒƒãƒˆã¸å¤‰æ›ã—ã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¾‹ï¼š11011010â‚‚ â†’ 1101 1010 â†’ D A â†’ DAâ‚â‚†ã€ã€‚3ã¯0011ã€Aã¯1010ã§ã™ã€‚4ãƒ“ãƒƒãƒˆãšã¤å¤‰æ›ã—ã¦ä¸¦ã¹ã‚‹ã¨00111010ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ11101000ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¾‹ï¼š11011010â‚‚ â†’ 1101 1010 â†’ D A â†’ DAâ‚â‚†ã€ã€‚3ã¯0011ã€Aã¯1010ã§ã™ã€‚4ãƒ“ãƒƒãƒˆãšã¤å¤‰æ›ã—ã¦ä¸¦ã¹ã‚‹ã¨00111010ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ00011010ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¾‹ï¼š11011010â‚‚ â†’ 1101 1010 â†’ D A â†’ DAâ‚â‚†ã€ã€‚3ã¯0011ã€Aã¯1010ã§ã™ã€‚4ãƒ“ãƒƒãƒˆãšã¤å¤‰æ›ã—ã¦ä¸¦ã¹ã‚‹ã¨00111010ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ00110101ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "3ã¯0011ã€Aã¯1010ã§ã™ã€‚4ãƒ“ãƒƒãƒˆãšã¤å¤‰æ›ã—ã¦ä¸¦ã¹ã‚‹ã¨00111010ã§ã™ã€‚"
    ],
    "explainTopicId": "core_01_04",
    "explainTopicSource": "manual",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "theory-17",
    "cat": "åŸºç¤Žç†è«–",
    "concept": "å¹³å‡",
    "difficulty": "åŸºç¤Ž",
    "q": "4ã¤ã®å€¤ 12, 15, 18, 25 ã®ç®—è¡“å¹³å‡ã¯ã„ãã¤ã‹ã€‚",
    "options": [
      "17.5",
      "17.0",
      "16.0",
      "18.0"
    ],
    "a": 0,
    "exp": "åˆè¨ˆã¯12+15+18+25=70ã§ã™ã€‚70Ã·4=17.5ã¨ãªã‚Šã¾ã™ã€‚",
    "hint": "ã™ã¹ã¦è¶³ã—ã¦ã€ãƒ‡ãƒ¼ã‚¿ã®å€‹æ•°4ã§å‰²ã‚Šã¾ã™ã€‚",
    "choiceExps": [
      "åˆè¨ˆã¯12+15+18+25=70ã§ã™ã€‚70Ã·4=17.5ã¨ãªã‚Šã¾ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ17.5ã€ã«ãªã‚‹ã€‚åˆè¨ˆã¯12+15+18+25=70ã§ã™ã€‚70Ã·4=17.5ã¨ãªã‚Šã¾ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ17.5ã€ã«ãªã‚‹ã€‚åˆè¨ˆã¯12+15+18+25=70ã§ã™ã€‚70Ã·4=17.5ã¨ãªã‚Šã¾ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ17.5ã€ã«ãªã‚‹ã€‚åˆè¨ˆã¯12+15+18+25=70ã§ã™ã€‚70Ã·4=17.5ã¨ãªã‚Šã¾ã™ã€‚"
    ],
    "explainTopicId": "core_02_06",
    "explainTopicSource": "manual",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "theory-18",
    "cat": "åŸºç¤Žç†è«–",
    "concept": "ä¸­å¤®å€¤",
    "difficulty": "åŸºç¤Ž",
    "q": "å€¤ 4, 7, 9, 20, 100 ã®ä¸­å¤®å€¤ã¯ã„ãã¤ã‹ã€‚",
    "options": [
      "7",
      "9",
      "20",
      "28"
    ],
    "a": 1,
    "exp": "5å€‹ã®å€¤ã¯ã™ã§ã«å°ã•ã„é †ã§ã™ã€‚ä¸­å¤®ã®3ç•ªç›®ã«ã‚ã‚‹9ãŒä¸­å¤®å€¤ã§ã™ã€‚",
    "hint": "å¥‡æ•°å€‹ãªã‚‰ã€å°ã•ã„é †ã«ä¸¦ã¹ãŸä¸­å¤®ã®å€¤ã‚’é¸ã³ã¾ã™ã€‚",
    "choiceExps": [
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ9ã€ã«ãªã‚‹ã€‚5å€‹ã®å€¤ã¯ã™ã§ã«å°ã•ã„é †ã§ã™ã€‚ä¸­å¤®ã®3ç•ªç›®ã«ã‚ã‚‹9ãŒä¸­å¤®å€¤ã§ã™ã€‚",
      "5å€‹ã®å€¤ã¯ã™ã§ã«å°ã•ã„é †ã§ã™ã€‚ä¸­å¤®ã®3ç•ªç›®ã«ã‚ã‚‹9ãŒä¸­å¤®å€¤ã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ9ã€ã«ãªã‚‹ã€‚5å€‹ã®å€¤ã¯ã™ã§ã«å°ã•ã„é †ã§ã™ã€‚ä¸­å¤®ã®3ç•ªç›®ã«ã‚ã‚‹9ãŒä¸­å¤®å€¤ã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ9ã€ã«ãªã‚‹ã€‚5å€‹ã®å€¤ã¯ã™ã§ã«å°ã•ã„é †ã§ã™ã€‚ä¸­å¤®ã®3ç•ªç›®ã«ã‚ã‚‹9ãŒä¸­å¤®å€¤ã§ã™ã€‚"
    ],
    "explainTopicId": "core_02_06",
    "explainTopicSource": "manual",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "theory-19",
    "cat": "åŸºç¤Žç†è«–",
    "concept": "è«–ç†æ¼”ç®—",
    "difficulty": "åŸºç¤Ž",
    "q": "Aã¨BãŒã¨ã‚‚ã«çœŸã®ã¨ãã€A NAND B ã®çµæžœã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "Aã¨åŒã˜",
      "Bã¨åŒã˜",
      "å½",
      "çœŸ"
    ],
    "a": 2,
    "exp": "NANDã¯ANDã®çµæžœã‚’å¦å®šã—ã¾ã™ã€‚çœŸ AND çœŸã¯çœŸãªã®ã§ã€ãã‚Œã‚’å¦å®šã—ãŸçµæžœã¯å½ã§ã™ã€‚",
    "hint": "ã¾ãšANDã‚’æ±‚ã‚ã€ãã®çµæžœã‚’åè»¢ã—ã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã¾ãšANDã‚’æ±‚ã‚ã€ãã®çµæžœã‚’åè»¢ã—ã¾ã™ã€ã€‚ã“ã®ãŸã‚ã€ŒAã¨åŒã˜ã€ã®ã‚ˆã†ã«æ–­å®šã™ã‚‹ã¨ã€å•é¡Œã®æ¡ä»¶ãƒ»å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã¾ãšANDã‚’æ±‚ã‚ã€ãã®çµæžœã‚’åè»¢ã—ã¾ã™ã€ã€‚ã“ã®ãŸã‚ã€ŒBã¨åŒã˜ã€ã®ã‚ˆã†ã«æ–­å®šã™ã‚‹ã¨ã€å•é¡Œã®æ¡ä»¶ãƒ»å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "NANDã¯ANDã®çµæžœã‚’å¦å®šã—ã¾ã™ã€‚çœŸ AND çœŸã¯çœŸãªã®ã§ã€ãã‚Œã‚’å¦å®šã—ãŸçµæžœã¯å½ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã¾ãšANDã‚’æ±‚ã‚ã€ãã®çµæžœã‚’åè»¢ã—ã¾ã™ã€ã€‚NANDã¯ANDã®çµæžœã‚’å¦å®šã—ã¾ã™ã€‚çœŸ AND çœŸã¯çœŸãªã®ã§ã€ãã‚Œã‚’å¦å®šã—ãŸçµæžœã¯å½ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒçœŸã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_02_02",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "è¦å‰‡é©ç”¨"
  },
  {
    "id": "theory-20",
    "cat": "åŸºç¤Žç†è«–",
    "concept": "ã‚ªãƒ¼ãƒˆãƒžãƒˆãƒ³",
    "difficulty": "æ¨™æº–",
    "q": "çŠ¶æ…‹S0ã‹ã‚‰é–‹å§‹ã—ã€å…¥åŠ›1ã®ãŸã³ã«S0ã¨S1ã‚’åˆ‡ã‚Šæ›¿ãˆã€å…¥åŠ›0ã§ã¯çŠ¶æ…‹ã‚’å¤‰ãˆãªã„ã‚ªãƒ¼ãƒˆãƒžãƒˆãƒ³ãŒã‚ã‚‹ã€‚å…¥åŠ›åˆ—1011ã‚’å‡¦ç†ã—ãŸæœ€çµ‚çŠ¶æ…‹ã¯ï¼Ÿ",
    "options": [
      "çŠ¶æ…‹ã‚’ä¸€æ„ã«æ±ºã‚ã‚‰ã‚Œãªã„",
      "S0",
      "å…¥åŠ›é€”ä¸­ã§åœæ­¢ã™ã‚‹",
      "S1"
    ],
    "a": 3,
    "exp": "S0â†’(1)S1â†’(0)S1â†’(1)S0â†’(1)S1 ã¨é·ç§»ã™ã‚‹ã®ã§ã€æœ€çµ‚çŠ¶æ…‹ã¯S1ã§ã™ã€‚",
    "hint": "å…¥åŠ›ã‚’å·¦ã‹ã‚‰1æ–‡å­—ãšã¤è¿½ã„ã€1ã®ã¨ãã ã‘çŠ¶æ…‹ã‚’åˆ‡ã‚Šæ›¿ãˆã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå…¥åŠ›ã‚’å·¦ã‹ã‚‰1æ–‡å­—ãšã¤è¿½ã„ã€1ã®ã¨ãã ã‘çŠ¶æ…‹ã‚’åˆ‡ã‚Šæ›¿ãˆã¾ã™ã€ã€‚S0â†’(1)S1â†’(0)S1â†’(1)S0â†’(1)S1 ã¨é·ç§»ã™ã‚‹ã®ã§ã€æœ€çµ‚çŠ¶æ…‹ã¯S1ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒçŠ¶æ…‹ã‚’ä¸€æ„ã«æ±ºã‚ã‚‰ã‚Œãªã„ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå…¥åŠ›ã‚’å·¦ã‹ã‚‰1æ–‡å­—ãšã¤è¿½ã„ã€1ã®ã¨ãã ã‘çŠ¶æ…‹ã‚’åˆ‡ã‚Šæ›¿ãˆã¾ã™ã€ã€‚S0â†’(1)S1â†’(0)S1â†’(1)S0â†’(1)S1 ã¨é·ç§»ã™ã‚‹ã®ã§ã€æœ€çµ‚çŠ¶æ…‹ã¯S1ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒS0ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå…¥åŠ›ã‚’å·¦ã‹ã‚‰1æ–‡å­—ãšã¤è¿½ã„ã€1ã®ã¨ãã ã‘çŠ¶æ…‹ã‚’åˆ‡ã‚Šæ›¿ãˆã¾ã™ã€ã€‚S0â†’(1)S1â†’(0)S1â†’(1)S0â†’(1)S1 ã¨é·ç§»ã™ã‚‹ã®ã§ã€æœ€çµ‚çŠ¶æ…‹ã¯S1ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå…¥åŠ›é€”ä¸­ã§åœæ­¢ã™ã‚‹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "S0â†’(1)S1â†’(0)S1â†’(1)S0â†’(1)S1 ã¨é·ç§»ã™ã‚‹ã®ã§ã€æœ€çµ‚çŠ¶æ…‹ã¯S1ã§ã™ã€‚"
    ],
    "explainTopicId": "core_02_04",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "computer-08",
    "cat": "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿",
    "concept": "CPUæ€§èƒ½",
    "difficulty": "æ¨™æº–",
    "q": "2GHzã®CPUãŒã€å¹³å‡CPI=2ã§10å„„å‘½ä»¤ã‚’å®Ÿè¡Œã™ã‚‹ã€‚å®Ÿè¡Œæ™‚é–“ã¯ãŠã‚ˆãä½•ç§’ã‹ã€‚",
    "options": [
      "1ç§’",
      "0.25ç§’",
      "0.5ç§’",
      "2ç§’"
    ],
    "a": 0,
    "exp": "å¿…è¦ã‚¯ãƒ­ãƒƒã‚¯æ•°ã¯10å„„å‘½ä»¤Ã—2=20å„„ã‚¯ãƒ­ãƒƒã‚¯ã§ã™ã€‚2GHzã¯1ç§’ã«20å„„ã‚¯ãƒ­ãƒƒã‚¯ãªã®ã§ã€ç´„1ç§’ã§ã™ã€‚",
    "hint": "å‘½ä»¤æ•°Ã—CPIã§å¿…è¦ã‚¯ãƒ­ãƒƒã‚¯æ•°ã‚’å‡ºã—ã€ã‚¯ãƒ­ãƒƒã‚¯å‘¨æ³¢æ•°ã§å‰²ã‚Šã¾ã™ã€‚",
    "choiceExps": [
      "å¿…è¦ã‚¯ãƒ­ãƒƒã‚¯æ•°ã¯10å„„å‘½ä»¤Ã—2=20å„„ã‚¯ãƒ­ãƒƒã‚¯ã§ã™ã€‚2GHzã¯1ç§’ã«20å„„ã‚¯ãƒ­ãƒƒã‚¯ãªã®ã§ã€ç´„1ç§’ã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ1ç§’ã€ã«ãªã‚‹ã€‚å¿…è¦ã‚¯ãƒ­ãƒƒã‚¯æ•°ã¯10å„„å‘½ä»¤Ã—2=20å„„ã‚¯ãƒ­ãƒƒã‚¯ã§ã™ã€‚2GHzã¯1ç§’ã«20å„„ã‚¯ãƒ­ãƒƒã‚¯ãªã®ã§ã€ç´„1ç§’ã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ1ç§’ã€ã«ãªã‚‹ã€‚å¿…è¦ã‚¯ãƒ­ãƒƒã‚¯æ•°ã¯10å„„å‘½ä»¤Ã—2=20å„„ã‚¯ãƒ­ãƒƒã‚¯ã§ã™ã€‚2GHzã¯1ç§’ã«20å„„ã‚¯ãƒ­ãƒƒã‚¯ãªã®ã§ã€ç´„1ç§’ã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ1ç§’ã€ã«ãªã‚‹ã€‚å¿…è¦ã‚¯ãƒ­ãƒƒã‚¯æ•°ã¯10å„„å‘½ä»¤Ã—2=20å„„ã‚¯ãƒ­ãƒƒã‚¯ã§ã™ã€‚2GHzã¯1ç§’ã«20å„„ã‚¯ãƒ­ãƒƒã‚¯ãªã®ã§ã€ç´„1ç§’ã§ã™ã€‚"
    ],
    "explainTopicId": "core_04_01",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "computer-09",
    "cat": "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿",
    "concept": "ã‚­ãƒ£ãƒƒã‚·ãƒ¥",
    "difficulty": "æ¨™æº–",
    "q": "ã‚­ãƒ£ãƒƒã‚·ãƒ¥ã®ãƒ’ãƒƒãƒˆçŽ‡ãŒ90%ã§ã€ãƒ’ãƒƒãƒˆæ™‚10nsã€ãƒŸã‚¹æ™‚110nsã‹ã‹ã‚‹ã¨ã™ã‚‹ã€‚å¹³å‡ã‚¢ã‚¯ã‚»ã‚¹æ™‚é–“ã¯ï¼Ÿ",
    "options": [
      "55ns",
      "20ns",
      "100ns",
      "11ns"
    ],
    "a": 1,
    "exp": "0.9Ã—10 + 0.1Ã—110 = 9 + 11 = 20nsã§ã™ã€‚",
    "hint": "ãƒ’ãƒƒãƒˆæ™‚ã¨ãƒŸã‚¹æ™‚ã®æ™‚é–“ã‚’ã€ãã‚Œãžã‚Œã®ç™ºç”Ÿç¢ºçŽ‡ã§é‡ã¿ä»˜ã‘ã—ã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¾‹ï¼šãƒ’ãƒƒãƒˆçŽ‡90%ã€ãƒ’ãƒƒãƒˆ1nsã€ãƒŸã‚¹æ™‚ã«ä¸»è¨˜æ†¶50nsãªã‚‰ã€0.9Ã—1 + 0.1Ã—50 = 5.9nsã€ã€‚0.9Ã—10 + 0.1Ã—110 = 9 + 11 = 20nsã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ55nsã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "0.9Ã—10 + 0.1Ã—110 = 9 + 11 = 20nsã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¾‹ï¼šãƒ’ãƒƒãƒˆçŽ‡90%ã€ãƒ’ãƒƒãƒˆ1nsã€ãƒŸã‚¹æ™‚ã«ä¸»è¨˜æ†¶50nsãªã‚‰ã€0.9Ã—1 + 0.1Ã—50 = 5.9nsã€ã€‚0.9Ã—10 + 0.1Ã—110 = 9 + 11 = 20nsã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ100nsã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¾‹ï¼šãƒ’ãƒƒãƒˆçŽ‡90%ã€ãƒ’ãƒƒãƒˆ1nsã€ãƒŸã‚¹æ™‚ã«ä¸»è¨˜æ†¶50nsãªã‚‰ã€0.9Ã—1 + 0.1Ã—50 = 5.9nsã€ã€‚0.9Ã—10 + 0.1Ã—110 = 9 + 11 = 20nsã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ11nsã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_04_03",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "computer-10",
    "cat": "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿",
    "concept": "ä»®æƒ³è¨˜æ†¶",
    "difficulty": "åŸºç¤Ž",
    "q": "ä»®æƒ³è¨˜æ†¶ã‚’ä½¿ã†å‡¦ç†ãŒã€å‚ç…§ã—ã‚ˆã†ã¨ã—ãŸãƒšãƒ¼ã‚¸ã‚’ä¸»è¨˜æ†¶å†…ã§è¦‹ã¤ã‘ã‚‰ã‚Œãšã€è£œåŠ©è¨˜æ†¶ã‹ã‚‰èª­ã¿è¾¼ã‚€å¿…è¦ãŒç”Ÿã˜ãŸã€‚ã“ã®äº‹è±¡ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ã‚¹ãƒ—ãƒ¼ãƒªãƒ³ã‚°",
      "ã‚­ãƒ£ãƒƒã‚·ãƒ¥ãƒ’ãƒƒãƒˆ",
      "ãƒšãƒ¼ã‚¸ãƒ•ã‚©ãƒ¼ãƒ«ãƒˆ",
      "ãƒ‡ãƒƒãƒ‰ãƒ­ãƒƒã‚¯"
    ],
    "a": 2,
    "exp": "å¿…è¦ãªãƒšãƒ¼ã‚¸ãŒä¸»è¨˜æ†¶ã«ãªã„ã¨ãƒšãƒ¼ã‚¸ãƒ•ã‚©ãƒ¼ãƒ«ãƒˆãŒç™ºç”Ÿã—ã€è£œåŠ©è¨˜æ†¶ã‹ã‚‰ãƒšãƒ¼ã‚¸ã‚’èª­ã¿è¾¼ã¿ã¾ã™ã€‚",
    "hint": "ä»®æƒ³è¨˜æ†¶ã®ã€Žãƒšãƒ¼ã‚¸ãŒãƒ¡ãƒ¢ãƒªã«ãªã„ã€å ´åˆã®ç”¨èªžã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒšãƒ¼ã‚¸ãƒ•ã‚©ãƒ¼ãƒ«ãƒˆãŒå¤šã™ãŽã‚‹ã¨ã‚¹ãƒ©ãƒƒã‚·ãƒ³ã‚°ãŒç™ºç”Ÿã—æ€§èƒ½ãŒä½Žä¸‹ã™ã‚‹ã€ã€‚å¿…è¦ãªãƒšãƒ¼ã‚¸ãŒä¸»è¨˜æ†¶ã«ãªã„ã¨ãƒšãƒ¼ã‚¸ãƒ•ã‚©ãƒ¼ãƒ«ãƒˆãŒç™ºç”Ÿã—ã€è£œåŠ©è¨˜æ†¶ã‹ã‚‰ãƒšãƒ¼ã‚¸ã‚’èª­ã¿è¾¼ã¿ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œã‚¹ãƒ—ãƒ¼ãƒªãƒ³ã‚°ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒšãƒ¼ã‚¸ãƒ•ã‚©ãƒ¼ãƒ«ãƒˆãŒå¤šã™ãŽã‚‹ã¨ã‚¹ãƒ©ãƒƒã‚·ãƒ³ã‚°ãŒç™ºç”Ÿã—æ€§èƒ½ãŒä½Žä¸‹ã™ã‚‹ã€ã€‚å¿…è¦ãªãƒšãƒ¼ã‚¸ãŒä¸»è¨˜æ†¶ã«ãªã„ã¨ãƒšãƒ¼ã‚¸ãƒ•ã‚©ãƒ¼ãƒ«ãƒˆãŒç™ºç”Ÿã—ã€è£œåŠ©è¨˜æ†¶ã‹ã‚‰ãƒšãƒ¼ã‚¸ã‚’èª­ã¿è¾¼ã¿ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œã‚­ãƒ£ãƒƒã‚·ãƒ¥ãƒ’ãƒƒãƒˆã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "å¿…è¦ãªãƒšãƒ¼ã‚¸ãŒä¸»è¨˜æ†¶ã«ãªã„ã¨ãƒšãƒ¼ã‚¸ãƒ•ã‚©ãƒ¼ãƒ«ãƒˆãŒç™ºç”Ÿã—ã€è£œåŠ©è¨˜æ†¶ã‹ã‚‰ãƒšãƒ¼ã‚¸ã‚’èª­ã¿è¾¼ã¿ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒšãƒ¼ã‚¸ãƒ•ã‚©ãƒ¼ãƒ«ãƒˆãŒå¤šã™ãŽã‚‹ã¨ã‚¹ãƒ©ãƒƒã‚·ãƒ³ã‚°ãŒç™ºç”Ÿã—æ€§èƒ½ãŒä½Žä¸‹ã™ã‚‹ã€ã€‚å¿…è¦ãªãƒšãƒ¼ã‚¸ãŒä¸»è¨˜æ†¶ã«ãªã„ã¨ãƒšãƒ¼ã‚¸ãƒ•ã‚©ãƒ¼ãƒ«ãƒˆãŒç™ºç”Ÿã—ã€è£œåŠ©è¨˜æ†¶ã‹ã‚‰ãƒšãƒ¼ã‚¸ã‚’èª­ã¿è¾¼ã¿ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒ‡ãƒƒãƒ‰ãƒ­ãƒƒã‚¯ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_06_01",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "computer-11",
    "cat": "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿",
    "concept": "ãƒ—ãƒ­ã‚»ã‚¹çŠ¶æ…‹",
    "difficulty": "åŸºç¤Ž",
    "q": "ãƒ—ãƒ­ã‚»ã‚¹Aã¯ãƒ‡ã‚£ã‚¹ã‚¯èª­è¾¼ã¿ã‚’è¦æ±‚ã—ãŸå¾Œã€å®Œäº†é€šçŸ¥ãŒæ¥ã‚‹ã¾ã§CPUã‚’ä½¿ã‚ãšå¾…ã£ã¦ã„ã‚‹ã€‚ã“ã®ã¨ãã®çŠ¶æ…‹ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "å®Ÿè¡ŒçŠ¶æ…‹",
      "å®Ÿè¡Œå¯èƒ½çŠ¶æ…‹",
      "çµ‚äº†çŠ¶æ…‹",
      "å¾…ã¡çŠ¶æ…‹"
    ],
    "a": 3,
    "exp": "å…¥å‡ºåŠ›å®Œäº†ãªã©ã®äº‹è±¡ã‚’å¾…ã£ã¦ã„ã‚‹ãƒ—ãƒ­ã‚»ã‚¹ã¯å¾…ã¡çŠ¶æ…‹ã§ã™ã€‚CPUã‚’å‰²ã‚Šå½“ã¦ã¦ã‚‚å‡¦ç†ã‚’å†é–‹ã§ãã¾ã›ã‚“ã€‚",
    "hint": "CPUå¾…ã¡ã§ã¯ãªãã€å…¥å‡ºåŠ›ãªã©ã®å®Œäº†ã‚’å¾…ã£ã¦ã„ã‚‹çŠ¶æ…‹ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒCPUå¾…ã¡ã§ã¯ãªãã€å…¥å‡ºåŠ›ãªã©ã®å®Œäº†ã‚’å¾…ã£ã¦ã„ã‚‹çŠ¶æ…‹ã§ã™ã€ã€‚å…¥å‡ºåŠ›å®Œäº†ãªã©ã®äº‹è±¡ã‚’å¾…ã£ã¦ã„ã‚‹ãƒ—ãƒ­ã‚»ã‚¹ã¯å¾…ã¡çŠ¶æ…‹ã§ã™ã€‚CPUã‚’å‰²ã‚Šå½“ã¦ã¦ã‚‚å‡¦ç†ã‚’å†é–‹ã§ãã¾ã›ã‚“ã€‚ ã—ãŸãŒã£ã¦ã€Œå®Ÿè¡ŒçŠ¶æ…‹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒCPUå¾…ã¡ã§ã¯ãªãã€å…¥å‡ºåŠ›ãªã©ã®å®Œäº†ã‚’å¾…ã£ã¦ã„ã‚‹çŠ¶æ…‹ã§ã™ã€ã€‚å…¥å‡ºåŠ›å®Œäº†ãªã©ã®äº‹è±¡ã‚’å¾…ã£ã¦ã„ã‚‹ãƒ—ãƒ­ã‚»ã‚¹ã¯å¾…ã¡çŠ¶æ…‹ã§ã™ã€‚CPUã‚’å‰²ã‚Šå½“ã¦ã¦ã‚‚å‡¦ç†ã‚’å†é–‹ã§ãã¾ã›ã‚“ã€‚ ã—ãŸãŒã£ã¦ã€Œå®Ÿè¡Œå¯èƒ½çŠ¶æ…‹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒCPUå¾…ã¡ã§ã¯ãªãã€å…¥å‡ºåŠ›ãªã©ã®å®Œäº†ã‚’å¾…ã£ã¦ã„ã‚‹çŠ¶æ…‹ã§ã™ã€ã€‚å…¥å‡ºåŠ›å®Œäº†ãªã©ã®äº‹è±¡ã‚’å¾…ã£ã¦ã„ã‚‹ãƒ—ãƒ­ã‚»ã‚¹ã¯å¾…ã¡çŠ¶æ…‹ã§ã™ã€‚CPUã‚’å‰²ã‚Šå½“ã¦ã¦ã‚‚å‡¦ç†ã‚’å†é–‹ã§ãã¾ã›ã‚“ã€‚ ã—ãŸãŒã£ã¦ã€Œçµ‚äº†çŠ¶æ…‹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "å…¥å‡ºåŠ›å®Œäº†ãªã©ã®äº‹è±¡ã‚’å¾…ã£ã¦ã„ã‚‹ãƒ—ãƒ­ã‚»ã‚¹ã¯å¾…ã¡çŠ¶æ…‹ã§ã™ã€‚CPUã‚’å‰²ã‚Šå½“ã¦ã¦ã‚‚å‡¦ç†ã‚’å†é–‹ã§ãã¾ã›ã‚“ã€‚"
    ],
    "explainTopicId": "core_06_01",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "computer-12",
    "cat": "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿",
    "concept": "RAID",
    "difficulty": "æ¨™æº–",
    "q": "å®¹é‡2TBã®ãƒ‡ã‚£ã‚¹ã‚¯4å°ã§RAID5ã‚’æ§‹æˆã—ãŸã¨ãã€æ¦‚ç®—ã®åˆ©ç”¨å¯èƒ½å®¹é‡ã¯ï¼Ÿ",
    "options": [
      "6TB",
      "4TB",
      "8TB",
      "2TB"
    ],
    "a": 0,
    "exp": "RAID5ã§ã¯1å°åˆ†ç›¸å½“ã‚’ãƒ‘ãƒªãƒ†ã‚£ã«ä½¿ã†ãŸã‚ã€åˆ©ç”¨å¯èƒ½å®¹é‡ã¯(4-1)Ã—2TB=6TBã§ã™ã€‚",
    "hint": "RAID5ã®å®¹é‡ã¯ã€ãŠãŠã‚€ã­ã€Žå°æ•°-1ã€å°åˆ†ã§ã™ã€‚",
    "choiceExps": [
      "RAID5ã§ã¯1å°åˆ†ç›¸å½“ã‚’ãƒ‘ãƒªãƒ†ã‚£ã«ä½¿ã†ãŸã‚ã€åˆ©ç”¨å¯èƒ½å®¹é‡ã¯(4-1)Ã—2TB=6TBã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒRAID5ã®å®¹é‡ã¯ã€ãŠãŠã‚€ã­ã€Žå°æ•°-1ã€å°åˆ†ã§ã™ã€ã€‚RAID5ã§ã¯1å°åˆ†ç›¸å½“ã‚’ãƒ‘ãƒªãƒ†ã‚£ã«ä½¿ã†ãŸã‚ã€åˆ©ç”¨å¯èƒ½å®¹é‡ã¯(4-1)Ã—2TB=6TBã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ4TBã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒRAID5ã®å®¹é‡ã¯ã€ãŠãŠã‚€ã­ã€Žå°æ•°-1ã€å°åˆ†ã§ã™ã€ã€‚RAID5ã§ã¯1å°åˆ†ç›¸å½“ã‚’ãƒ‘ãƒªãƒ†ã‚£ã«ä½¿ã†ãŸã‚ã€åˆ©ç”¨å¯èƒ½å®¹é‡ã¯(4-1)Ã—2TB=6TBã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ8TBã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒRAID5ã®å®¹é‡ã¯ã€ãŠãŠã‚€ã­ã€Žå°æ•°-1ã€å°åˆ†ã§ã™ã€ã€‚RAID5ã§ã¯1å°åˆ†ç›¸å½“ã‚’ãƒ‘ãƒªãƒ†ã‚£ã«ä½¿ã†ãŸã‚ã€åˆ©ç”¨å¯èƒ½å®¹é‡ã¯(4-1)Ã—2TB=6TBã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ2TBã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_04_03",
    "explainTopicSource": "manual",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "computer-13",
    "cat": "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿",
    "concept": "ä¿¡é ¼æ€§",
    "difficulty": "æ¨™æº–",
    "q": "MTBFãŒ900æ™‚é–“ã€MTTRãŒ100æ™‚é–“ã®ã‚·ã‚¹ãƒ†ãƒ ã®ç¨¼åƒçŽ‡ã¯ï¼Ÿ",
    "options": [
      "0.99",
      "0.90",
      "0.10",
      "0.81"
    ],
    "a": 1,
    "exp": "ç¨¼åƒçŽ‡=MTBFÃ·(MTBF+MTTR)=900Ã·1000=0.90ã§ã™ã€‚",
    "hint": "ç¨¼åƒæ™‚é–“ã‚’ã€Žç¨¼åƒæ™‚é–“+ä¿®å¾©æ™‚é–“ã€ã§å‰²ã‚Šã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒMTBF=900æ™‚é–“ã€MTTR=100æ™‚é–“ãªã‚‰ç¨¼åƒçŽ‡0.9ã§ã™ã€ã€‚ç¨¼åƒçŽ‡=MTBFÃ·(MTBF+MTTR)=900Ã·1000=0.90ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ0.99ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ç¨¼åƒçŽ‡=MTBFÃ·(MTBF+MTTR)=900Ã·1000=0.90ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒMTBF=900æ™‚é–“ã€MTTR=100æ™‚é–“ãªã‚‰ç¨¼åƒçŽ‡0.9ã§ã™ã€ã€‚ç¨¼åƒçŽ‡=MTBFÃ·(MTBF+MTTR)=900Ã·1000=0.90ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ0.10ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒMTBF=900æ™‚é–“ã€MTTR=100æ™‚é–“ãªã‚‰ç¨¼åƒçŽ‡0.9ã§ã™ã€ã€‚ç¨¼åƒçŽ‡=MTBFÃ·(MTBF+MTTR)=900Ã·1000=0.90ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ0.81ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_05_04",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "computer-14",
    "cat": "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿",
    "concept": "ã‚¢ãƒ‰ãƒ¬ã‚¹ç©ºé–“",
    "difficulty": "æ¨™æº–",
    "q": "32ãƒ“ãƒƒãƒˆã®ã‚¢ãƒ‰ãƒ¬ã‚¹ã§1ãƒã‚¤ãƒˆå˜ä½ã«ç•ªåœ°ã‚’ä»˜ã‘ã‚‹ã¨ãã€ç›´æŽ¥è¡¨ã›ã‚‹ã‚¢ãƒ‰ãƒ¬ã‚¹ç©ºé–“ã¯æœ€å¤§ã§ç´„ä½•GiBã‹ã€‚",
    "options": [
      "2GiB",
      "8GiB",
      "4GiB",
      "32GiB"
    ],
    "a": 2,
    "exp": "32ãƒ“ãƒƒãƒˆã§ã¯2^32é€šã‚Šã®ç•ªåœ°ã‚’è¡¨ã›ã¾ã™ã€‚1ç•ªåœ°1ãƒã‚¤ãƒˆãªã®ã§2^32ãƒã‚¤ãƒˆ=4GiBã§ã™ã€‚",
    "hint": "2^32ãƒã‚¤ãƒˆã‚’GiBã¸æ›ç®—ã—ã¾ã™ã€‚",
    "choiceExps": [
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ4GiBã€ã«ãªã‚‹ã€‚32ãƒ“ãƒƒãƒˆã§ã¯2^32é€šã‚Šã®ç•ªåœ°ã‚’è¡¨ã›ã¾ã™ã€‚1ç•ªåœ°1ãƒã‚¤ãƒˆãªã®ã§2^32ãƒã‚¤ãƒˆ=4GiBã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ4GiBã€ã«ãªã‚‹ã€‚32ãƒ“ãƒƒãƒˆã§ã¯2^32é€šã‚Šã®ç•ªåœ°ã‚’è¡¨ã›ã¾ã™ã€‚1ç•ªåœ°1ãƒã‚¤ãƒˆãªã®ã§2^32ãƒã‚¤ãƒˆ=4GiBã§ã™ã€‚",
      "32ãƒ“ãƒƒãƒˆã§ã¯2^32é€šã‚Šã®ç•ªåœ°ã‚’è¡¨ã›ã¾ã™ã€‚1ç•ªåœ°1ãƒã‚¤ãƒˆãªã®ã§2^32ãƒã‚¤ãƒˆ=4GiBã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ4GiBã€ã«ãªã‚‹ã€‚32ãƒ“ãƒƒãƒˆã§ã¯2^32é€šã‚Šã®ç•ªåœ°ã‚’è¡¨ã›ã¾ã™ã€‚1ç•ªåœ°1ãƒã‚¤ãƒˆãªã®ã§2^32ãƒã‚¤ãƒˆ=4GiBã§ã™ã€‚"
    ],
    "explainTopicId": "core_04_03",
    "explainTopicSource": "manual",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "computer-15",
    "cat": "ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿",
    "concept": "å‰²è¾¼ã¿",
    "difficulty": "åŸºç¤Ž",
    "q": "å‰²è¾¼ã¿å‡¦ç†ã®èª¬æ˜Žã¨ã—ã¦æœ€ã‚‚é©åˆ‡ãªã®ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ãƒãƒ¼ãƒªãƒ³ã‚°ã§è£…ç½®çŠ¶æ…‹ã‚’ç¹°ã‚Šè¿”ã—ç¢ºèªã™ã‚‹å‡¦ç†",
      "DMAã§å…¥å‡ºåŠ›è£…ç½®ã¨ä¸»è¨˜æ†¶ã®é–“ã‚’è»¢é€ã™ã‚‹å‡¦ç†",
      "ã‚¹ãƒ—ãƒ¼ãƒªãƒ³ã‚°ã§å…¥å‡ºåŠ›è¦æ±‚ã‚’ä¸€æ™‚è“„ç©ã™ã‚‹å‡¦ç†",
      "CPUãŒç¾åœ¨ã®å‡¦ç†ã‚’ä¸€æ™‚ä¸­æ–­ã—ã€å„ªå…ˆã™ã¹ãäº‹è±¡ã®å‡¦ç†ã¸ç§»ã‚‹"
    ],
    "a": 3,
    "exp": "å‰²è¾¼ã¿ãŒç™ºç”Ÿã™ã‚‹ã¨ã€CPUã¯ç¾åœ¨ã®å‡¦ç†çŠ¶æ…‹ã‚’ä¿å­˜ã—ã¦å‰²è¾¼ã¿å‡¦ç†ã¸ç§»ã‚Šã€çµ‚äº†å¾Œã«å…ƒã®å‡¦ç†ã¸æˆ»ã‚Šã¾ã™ã€‚",
    "hint": "å…¥å‡ºåŠ›å®Œäº†ãªã©ã€ã™ãå¯¾å¿œã—ãŸã„äº‹è±¡ã‚’CPUã¸çŸ¥ã‚‰ã›ã‚‹ä»•çµ„ã¿ã§ã™ã€‚",
    "choiceExps": [
      "ãƒãƒ¼ãƒªãƒ³ã‚°ã¯CPUå´ã‹ã‚‰çŠ¶æ…‹ã‚’ç¹°ã‚Šè¿”ã—ç¢ºèªã™ã‚‹æ–¹å¼ã§ã€äº‹è±¡å´ã‹ã‚‰CPUã¸å‡¦ç†ã‚’è¦æ±‚ã™ã‚‹å‰²è¾¼ã¿ã¨ã¯ç•°ãªã‚‹ã€‚",
      "DMAã¯CPUã®ä»‹åœ¨ã‚’æ¸›ã‚‰ã—ã¦ä¸»è¨˜æ†¶ã¨å…¥å‡ºåŠ›è£…ç½®ã®é–“ã§ãƒ‡ãƒ¼ã‚¿è»¢é€ã™ã‚‹ä»•çµ„ã¿ã€‚",
      "ã‚¹ãƒ—ãƒ¼ãƒªãƒ³ã‚°ã¯ä½Žé€Ÿãªå…¥å‡ºåŠ›è£…ç½®å‘ã‘ã®ãƒ‡ãƒ¼ã‚¿ã‚’è£œåŠ©è¨˜æ†¶ãªã©ã¸ä¸€æ™‚è“„ç©ã™ã‚‹ä»•çµ„ã¿ã€‚",
      "å‰²è¾¼ã¿ãŒç™ºç”Ÿã™ã‚‹ã¨ã€CPUã¯ç¾åœ¨ã®å‡¦ç†çŠ¶æ…‹ã‚’ä¿å­˜ã—ã¦å‰²è¾¼ã¿å‡¦ç†ã¸ç§»ã‚Šã€çµ‚äº†å¾Œã«å…ƒã®å‡¦ç†ã¸æˆ»ã‚Šã¾ã™ã€‚"
    ],
    "explainTopicId": "core_04_02",
    "explainTopicSource": "semantic",
    "qualityOverride": "v89-near-domain-distractors",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "db-08",
    "cat": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹",
    "concept": "SQL",
    "difficulty": "åŸºç¤Ž",
    "q": "ç¤¾å“¡è¡¨employeeã‹ã‚‰æ°ånameã¨æ‰€å±ždeptã ã‘ã‚’ä¸€è¦§è¡¨ç¤ºã—ã€salaryãªã©ä»–ã®åˆ—ã¯å–å¾—ã—ãŸããªã„ã€‚é©åˆ‡ãªSQLã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "SELECT name, dept FROM employee;",
      "SELECT employee FROM name, dept;",
      "SELECT * WHERE name, dept FROM employee;",
      "GET name, dept IN employee;"
    ],
    "a": 0,
    "exp": "å–å¾—ã™ã‚‹åˆ—ã‚’SELECTã®å¾Œã‚ã«åˆ—æŒ™ã—ã€FROMã§è¡¨åã‚’æŒ‡å®šã—ã¾ã™ã€‚",
    "hint": "SELECT åˆ—1, åˆ—2 FROM è¡¨å ã®å½¢ã§ã™ã€‚",
    "choiceExps": [
      "å–å¾—ã™ã‚‹åˆ—ã‚’SELECTã®å¾Œã‚ã«åˆ—æŒ™ã—ã€FROMã§è¡¨åã‚’æŒ‡å®šã—ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒSELECT åˆ—1, åˆ—2 FROM è¡¨å ã®å½¢ã§ã™ã€ã€‚å–å¾—ã™ã‚‹åˆ—ã‚’SELECTã®å¾Œã‚ã«åˆ—æŒ™ã—ã€FROMã§è¡¨åã‚’æŒ‡å®šã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒSELECT employee FROM name, dept;ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒSELECT åˆ—1, åˆ—2 FROM è¡¨å ã®å½¢ã§ã™ã€ã€‚å–å¾—ã™ã‚‹åˆ—ã‚’SELECTã®å¾Œã‚ã«åˆ—æŒ™ã—ã€FROMã§è¡¨åã‚’æŒ‡å®šã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒSELECT * WHERE name, dept FROM employee;ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒSELECT åˆ—1, åˆ—2 FROM è¡¨å ã®å½¢ã§ã™ã€ã€‚å–å¾—ã™ã‚‹åˆ—ã‚’SELECTã®å¾Œã‚ã«åˆ—æŒ™ã—ã€FROMã§è¡¨åã‚’æŒ‡å®šã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒGET name, dept IN employee;ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_09_07",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "db-09",
    "cat": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹",
    "concept": "SQL",
    "difficulty": "æ¨™æº–",
    "q": "employeeè¡¨ã‹ã‚‰ã€ageãŒ30ä»¥ä¸Šã‹ã¤deptãŒ'å–¶æ¥­'ã®è¡Œã‚’æŠ½å‡ºã™ã‚‹WHEREå¥ã¯ï¼Ÿ",
    "options": [
      "WHERE age >= 30 OR dept = 'å–¶æ¥­'",
      "WHERE age >= 30 AND dept = 'å–¶æ¥­'",
      "WHERE age > 30 AND dept <> 'å–¶æ¥­'",
      "WHERE age = 30 AND dept LIKE '%å–¶æ¥­%'"
    ],
    "a": 1,
    "exp": "2ã¤ã®æ¡ä»¶ã‚’ä¸¡æ–¹æº€ãŸã™å¿…è¦ãŒã‚ã‚‹ã®ã§ANDã§çµã³ã¾ã™ã€‚30ä»¥ä¸Šã¯>=ã§ã™ã€‚",
    "hint": "ã€Žã‹ã¤ã€ã¯ANDã€ã€Ž30ä»¥ä¸Šã€ã¯>=ã§ã™ã€‚",
    "choiceExps": [
      "ã€ŒORã€ã¯ã€ã©ã¡ã‚‰ã‹ä¸€æ–¹ä»¥ä¸ŠãŒçœŸãªã‚‰çœŸã«ãªã‚‹è«–ç†æ¼”ç®—ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "2ã¤ã®æ¡ä»¶ã‚’ä¸¡æ–¹æº€ãŸã™å¿…è¦ãŒã‚ã‚‹ã®ã§ANDã§çµã³ã¾ã™ã€‚30ä»¥ä¸Šã¯>=ã§ã™ã€‚",
      "ã€ŒANDã€ã¯ã€ä¸¡æ–¹ã®æ¡ä»¶ãŒçœŸã®ã¨ãã ã‘çœŸã«ãªã‚‹è«–ç†æ¼”ç®—ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€ŒANDã€ã¯ã€ä¸¡æ–¹ã®æ¡ä»¶ãŒçœŸã®ã¨ãã ã‘çœŸã«ãªã‚‹è«–ç†æ¼”ç®—ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_09_07",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "db-10",
    "cat": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹",
    "concept": "GROUP BY",
    "difficulty": "æ¨™æº–",
    "q": "employeeè¡¨ã‹ã‚‰ã€åœ¨ç±ä¸­(active=1)ã®ç¤¾å“¡ã ã‘ã‚’å¯¾è±¡ã«ã€éƒ¨ç½²deptã”ã¨ã®äººæ•°ã‚’æ•°ãˆãŸã„ã€‚SQLã®ä¸»è¦éƒ¨åˆ†ã¨ã—ã¦é©åˆ‡ãªã®ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "SELECT dept, COUNT(*) FROM employee ORDER BY dept WHERE active=1;",
      "SELECT dept FROM employee HAVING active=1 COUNT(*);",
      "SELECT dept, COUNT(*) FROM employee WHERE active=1 GROUP BY dept;",
      "SELECT COUNT(dept) FROM employee GROUP BY active=1;"
    ],
    "a": 2,
    "exp": "è¡Œã‚’åœ¨ç±ä¸­ã ã‘ã«çµžã‚‹ã«ã¯WHEREã€éƒ¨ç½²ã”ã¨ã«é›†ç´„ã™ã‚‹ã«ã¯GROUP BYã‚’ä½¿ã†ã€‚ã—ãŸãŒã£ã¦WHERE active=1ã®å¾Œã«GROUP BY deptã‚’ç½®ãå½¢ãŒé©åˆ‡ã€‚",
    "hint": "å…ˆã«ã€Žã©ã®è¡Œã‚’å¯¾è±¡ã«ã™ã‚‹ã‹ã€ã€æ¬¡ã«ã€Žä½•ã”ã¨ã«ã¾ã¨ã‚ã‚‹ã‹ã€ã‚’åˆ†ã‘ã‚‹ã€‚",
    "choiceExps": [
      "ORDER BYã¯ä¸¦ã¹æ›¿ãˆã§ã‚ã‚Šã€WHEREã‚’ORDER BYã®å¾Œã‚ã¸ç½®ãæ§‹æ–‡ã‚‚ä¸é©åˆ‡ã€‚",
      "HAVINGã¯é›†ç´„å¾Œã®æ¡ä»¶ã«ä½¿ã†ã€‚è¨˜è¿°ã‚‚SQLã¨ã—ã¦ä¸é©åˆ‡ã€‚",
      "è¡Œã‚’åœ¨ç±ä¸­ã ã‘ã«çµžã‚‹ã«ã¯WHEREã€éƒ¨ç½²ã”ã¨ã«é›†ç´„ã™ã‚‹ã«ã¯GROUP BYã‚’ä½¿ã†ã€‚ã—ãŸãŒã£ã¦WHERE active=1ã®å¾Œã«GROUP BY deptã‚’ç½®ãå½¢ãŒé©åˆ‡ã€‚",
      "active=1ã¯ã‚°ãƒ«ãƒ¼ãƒ—åŒ–ã™ã‚‹é …ç›®ã§ã¯ãªãã€ã¾ãšWHEREã§è¡Œã‚’çµžã‚‹ã€‚"
    ],
    "explainTopicId": "core_09_07",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-rewritten",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "db-11",
    "cat": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹",
    "concept": "HAVING",
    "difficulty": "æ¨™æº–",
    "q": "deptã”ã¨ã«äººæ•°ã‚’é›†è¨ˆã—ãŸçµæžœã«å¯¾ã—ã€5äººä»¥ä¸Šã®éƒ¨é–€ã ã‘ã‚’æ®‹ã—ãŸã„ã€‚é›†ç´„å¾Œã®çµæžœã¸æ¡ä»¶ã‚’æŒ‡å®šã™ã‚‹å¥ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "GROUP BY COUNT(*) >= 5",
      "WHERE COUNT(*) >= 5",
      "ORDER BY COUNT(*) >= 5",
      "HAVING COUNT(*) >= 5"
    ],
    "a": 3,
    "exp": "é›†ç´„å¾Œã®ã‚°ãƒ«ãƒ¼ãƒ—ã«æ¡ä»¶ã‚’ä»˜ã‘ã‚‹å ´åˆã¯HAVINGã‚’ä½¿ã„ã¾ã™ã€‚WHEREã¯é›†ç´„å‰ã®è¡Œã‚’çµžã‚‹ãŸã‚ã®å¥ã§ã™ã€‚",
    "hint": "COUNTã®çµæžœã«æ¡ä»¶ã‚’ä»˜ã‘ã‚‹ã®ã¯WHEREã§ã¯ãªãåˆ¥ã®å¥ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¾‹ï¼šéƒ¨ç½²åˆ¥å¹³å‡çµ¦ä¸Žã§å¹³å‡30ä¸‡å††ä»¥ä¸Š â†’ GROUP BY éƒ¨ç½²ã€HAVING AVG(çµ¦ä¸Ž)>=300000ã€ã€‚é›†ç´„å¾Œã®ã‚°ãƒ«ãƒ¼ãƒ—ã«æ¡ä»¶ã‚’ä»˜ã‘ã‚‹å ´åˆã¯HAVINGã‚’ä½¿ã„ã¾ã™ã€‚WHEREã¯é›†ç´„å‰ã®è¡Œã‚’çµžã‚‹ãŸã‚ã®å¥ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒGROUP BY COUNT(*) >= 5ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¾‹ï¼šéƒ¨ç½²åˆ¥å¹³å‡çµ¦ä¸Žã§å¹³å‡30ä¸‡å††ä»¥ä¸Š â†’ GROUP BY éƒ¨ç½²ã€HAVING AVG(çµ¦ä¸Ž)>=300000ã€ã€‚é›†ç´„å¾Œã®ã‚°ãƒ«ãƒ¼ãƒ—ã«æ¡ä»¶ã‚’ä»˜ã‘ã‚‹å ´åˆã¯HAVINGã‚’ä½¿ã„ã¾ã™ã€‚WHEREã¯é›†ç´„å‰ã®è¡Œã‚’çµžã‚‹ãŸã‚ã®å¥ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒWHERE COUNT(*) >= 5ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¾‹ï¼šéƒ¨ç½²åˆ¥å¹³å‡çµ¦ä¸Žã§å¹³å‡30ä¸‡å††ä»¥ä¸Š â†’ GROUP BY éƒ¨ç½²ã€HAVING AVG(çµ¦ä¸Ž)>=300000ã€ã€‚é›†ç´„å¾Œã®ã‚°ãƒ«ãƒ¼ãƒ—ã«æ¡ä»¶ã‚’ä»˜ã‘ã‚‹å ´åˆã¯HAVINGã‚’ä½¿ã„ã¾ã™ã€‚WHEREã¯é›†ç´„å‰ã®è¡Œã‚’çµžã‚‹ãŸã‚ã®å¥ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒORDER BY COUNT(*) >= 5ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "é›†ç´„å¾Œã®ã‚°ãƒ«ãƒ¼ãƒ—ã«æ¡ä»¶ã‚’ä»˜ã‘ã‚‹å ´åˆã¯HAVINGã‚’ä½¿ã„ã¾ã™ã€‚WHEREã¯é›†ç´„å‰ã®è¡Œã‚’çµžã‚‹ãŸã‚ã®å¥ã§ã™ã€‚"
    ],
    "explainTopicId": "core_09_07",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "db-12",
    "cat": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹",
    "concept": "JOIN",
    "difficulty": "æ¨™æº–",
    "q": "customerè¡¨ã®1äººã®é¡§å®¢ã«ordersè¡¨ã®è¤‡æ•°æ³¨æ–‡ã‚’å¯¾å¿œä»˜ã‘ãŸã„ã€‚ä¸¡è¡¨ã«ã¯customer_idãŒã‚ã‚Šã€ã“ã‚Œã‚’ã‚­ãƒ¼ã¨ã—ã¦çµåˆã™ã‚‹ã€‚JOINã®çµåˆæ¡ä»¶ã¨ã—ã¦é©åˆ‡ãªã®ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "customer.customer_id = orders.customer_id",
      "customer.customer_id <> orders.customer_id",
      "customer.name = orders.order_id",
      "customer.customer_id IS NULL"
    ],
    "a": 0,
    "exp": "äºŒã¤ã®è¡¨ã§åŒã˜é¡§å®¢ã‚’å¯¾å¿œä»˜ã‘ã‚‹ã«ã¯ã€å…±é€šã™ã‚‹customer_idåŒå£«ãŒç­‰ã—ã„ã“ã¨ã‚’çµåˆæ¡ä»¶ã«ã™ã‚‹ã€‚",
    "hint": "ã€Žã©ã®åˆ—ãŒåŒã˜å®Ÿä½“ã‚’æŒ‡ã™ã‹ã€ã¨ã€Žä¸€è‡´æ¡ä»¶ã€ã‚’è¦‹ã‚‹ã€‚",
    "choiceExps": [
      "äºŒã¤ã®è¡¨ã§åŒã˜é¡§å®¢ã‚’å¯¾å¿œä»˜ã‘ã‚‹ã«ã¯ã€å…±é€šã™ã‚‹customer_idåŒå£«ãŒç­‰ã—ã„ã“ã¨ã‚’çµåˆæ¡ä»¶ã«ã™ã‚‹ã€‚",
      "ä¸ä¸€è‡´æ¡ä»¶ã§ã¯åŒã˜é¡§å®¢ã®æ³¨æ–‡ã‚’å¯¾å¿œä»˜ã‘ã‚‰ã‚Œãªã„ã€‚",
      "é¡§å®¢åã¨æ³¨æ–‡IDã¯æ„å‘³ãŒç•°ãªã‚‹åˆ—ã§ã‚ã‚Šçµåˆã‚­ãƒ¼ã¨ã—ã¦ä¸é©åˆ‡ã€‚",
      "NULLã ã‘ã‚’é¸ã¶æ¡ä»¶ã§ã¯é¡§å®¢ã¨æ³¨æ–‡ã‚’å¯¾å¿œä»˜ã‘ã‚‰ã‚Œãªã„ã€‚"
    ],
    "explainTopicId": "core_09_02",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-rewritten",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "db-13",
    "cat": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹",
    "concept": "NULL",
    "difficulty": "åŸºç¤Ž",
    "q": "SQLã§ã€column_a ãŒNULLã§ã‚ã‚‹è¡Œã‚’æ¤œç´¢ã™ã‚‹æ¡ä»¶ã¨ã—ã¦é©åˆ‡ãªã®ã¯ï¼Ÿ",
    "options": [
      "column_a == NULL",
      "column_a IS NULL",
      "column_a LIKE NULL",
      "column_a = NULL"
    ],
    "a": 1,
    "exp": "SQLã§ã¯NULLã¨ã®æ¯”è¼ƒã«=ã‚’ä½¿ã‚ãšã€IS NULLã‚’ä½¿ã„ã¾ã™ã€‚",
    "hint": "NULLã¯é€šå¸¸ã®å€¤ã§ã¯ãªã„ãŸã‚ã€å°‚ç”¨ã®åˆ¤å®šæ§‹æ–‡ã‚’ä½¿ã„ã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒNULLã®æ„å‘³ã‚’ç†è§£ã™ã‚‹ã€ã€‚SQLã§ã¯NULLã¨ã®æ¯”è¼ƒã«=ã‚’ä½¿ã‚ãšã€IS NULLã‚’ä½¿ã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œcolumn_a == NULLã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "SQLã§ã¯NULLã¨ã®æ¯”è¼ƒã«=ã‚’ä½¿ã‚ãšã€IS NULLã‚’ä½¿ã„ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒNULLã®æ„å‘³ã‚’ç†è§£ã™ã‚‹ã€ã€‚SQLã§ã¯NULLã¨ã®æ¯”è¼ƒã«=ã‚’ä½¿ã‚ãšã€IS NULLã‚’ä½¿ã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œcolumn_a LIKE NULLã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒNULLã®æ„å‘³ã‚’ç†è§£ã™ã‚‹ã€ã€‚SQLã§ã¯NULLã¨ã®æ¯”è¼ƒã«=ã‚’ä½¿ã‚ãšã€IS NULLã‚’ä½¿ã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œcolumn_a = NULLã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_09_02",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "å¼ãƒ»æ§‹æ–‡"
  },
  {
    "id": "db-14",
    "cat": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹",
    "concept": "ORDER BY",
    "difficulty": "åŸºç¤Ž",
    "q": "scoreåˆ—ã‚’é«˜ã„é †ã«ä¸¦ã¹ã‚‹æŒ‡å®šã¨ã—ã¦é©åˆ‡ãªã®ã¯ï¼Ÿ",
    "options": [
      "SORT score HIGH",
      "ORDER BY score ASC",
      "ORDER BY score DESC",
      "GROUP BY score DESC"
    ],
    "a": 2,
    "exp": "é™é †ã¯DESCã€æ˜‡é †ã¯ASCã§ã™ã€‚é«˜ã„å€¤ã‹ã‚‰ä¸¦ã¹ã‚‹ã®ã§DESCã‚’æŒ‡å®šã—ã¾ã™ã€‚",
    "hint": "é«˜ã„é †ã¯é™é †ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒSELECTã¯åˆ—ã€WHEREã¯è¡Œã€GROUP BYã¯é›†ç´„å˜ä½ã¨ã„ã†å½¹å‰²ã‚’æ··åŒã—ãªã„ã‚ˆã†ã«ã—ã¾ã™ã€ã€‚é™é †ã¯DESCã€æ˜‡é †ã¯ASCã§ã™ã€‚é«˜ã„å€¤ã‹ã‚‰ä¸¦ã¹ã‚‹ã®ã§DESCã‚’æŒ‡å®šã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒSORT score HIGHã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒSELECTã¯åˆ—ã€WHEREã¯è¡Œã€GROUP BYã¯é›†ç´„å˜ä½ã¨ã„ã†å½¹å‰²ã‚’æ··åŒã—ãªã„ã‚ˆã†ã«ã—ã¾ã™ã€ã€‚é™é †ã¯DESCã€æ˜‡é †ã¯ASCã§ã™ã€‚é«˜ã„å€¤ã‹ã‚‰ä¸¦ã¹ã‚‹ã®ã§DESCã‚’æŒ‡å®šã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒORDER BY score ASCã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "é™é †ã¯DESCã€æ˜‡é †ã¯ASCã§ã™ã€‚é«˜ã„å€¤ã‹ã‚‰ä¸¦ã¹ã‚‹ã®ã§DESCã‚’æŒ‡å®šã—ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒSELECTã¯åˆ—ã€WHEREã¯è¡Œã€GROUP BYã¯é›†ç´„å˜ä½ã¨ã„ã†å½¹å‰²ã‚’æ··åŒã—ãªã„ã‚ˆã†ã«ã—ã¾ã™ã€ã€‚é™é †ã¯DESCã€æ˜‡é †ã¯ASCã§ã™ã€‚é«˜ã„å€¤ã‹ã‚‰ä¸¦ã¹ã‚‹ã®ã§DESCã‚’æŒ‡å®šã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒGROUP BY score DESCã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_09_07",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "å¼ãƒ»æ§‹æ–‡"
  },
  {
    "id": "db-15",
    "cat": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹",
    "concept": "ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³",
    "difficulty": "åŸºç¤Ž",
    "q": "ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³ã§COMMITã‚’å®Ÿè¡Œã™ã‚‹ä¸»ãªæ„å‘³ã¯ï¼Ÿ",
    "options": [
      "ãã‚Œã¾ã§ã®æ›´æ–°ã‚’å–ã‚Šæ¶ˆã™",
      "è¡¨ã‚’å‰Šé™¤ã™ã‚‹",
      "æŽ’ä»–åˆ¶å¾¡ã‚’ç„¡åŠ¹ã«ã™ã‚‹",
      "ãã‚Œã¾ã§ã®æ›´æ–°ã‚’ç¢ºå®šã™ã‚‹"
    ],
    "a": 3,
    "exp": "COMMITã¯ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³å†…ã§è¡Œã£ãŸæ›´æ–°ã‚’ç¢ºå®šã—ã€æ°¸ç¶šçš„ãªçµæžœã¨ã—ã¦æ‰±ã„ã¾ã™ã€‚",
    "hint": "ROLLBACKã¨ã®é•ã„ã‚’è€ƒãˆã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œé€”ä¸­ã§éšœå®³ãŒèµ·ããŸã‚‰ROLLBACKã§ä¸€é€£ã®æ›´æ–°ã‚’å–ã‚Šæ¶ˆã™ã€ã€‚COMMITã¯ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³å†…ã§è¡Œã£ãŸæ›´æ–°ã‚’ç¢ºå®šã—ã€æ°¸ç¶šçš„ãªçµæžœã¨ã—ã¦æ‰±ã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãã‚Œã¾ã§ã®æ›´æ–°ã‚’å–ã‚Šæ¶ˆã™ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œé€”ä¸­ã§éšœå®³ãŒèµ·ããŸã‚‰ROLLBACKã§ä¸€é€£ã®æ›´æ–°ã‚’å–ã‚Šæ¶ˆã™ã€ã€‚COMMITã¯ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³å†…ã§è¡Œã£ãŸæ›´æ–°ã‚’ç¢ºå®šã—ã€æ°¸ç¶šçš„ãªçµæžœã¨ã—ã¦æ‰±ã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œè¡¨ã‚’å‰Šé™¤ã™ã‚‹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œé€”ä¸­ã§éšœå®³ãŒèµ·ããŸã‚‰ROLLBACKã§ä¸€é€£ã®æ›´æ–°ã‚’å–ã‚Šæ¶ˆã™ã€ã€‚COMMITã¯ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³å†…ã§è¡Œã£ãŸæ›´æ–°ã‚’ç¢ºå®šã—ã€æ°¸ç¶šçš„ãªçµæžœã¨ã—ã¦æ‰±ã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒæŽ’ä»–åˆ¶å¾¡ã‚’ç„¡åŠ¹ã«ã™ã‚‹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "COMMITã¯ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³å†…ã§è¡Œã£ãŸæ›´æ–°ã‚’ç¢ºå®šã—ã€æ°¸ç¶šçš„ãªçµæžœã¨ã—ã¦æ‰±ã„ã¾ã™ã€‚"
    ],
    "explainTopicId": "core_09_05",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "å¼ãƒ»æ§‹æ–‡"
  },
  {
    "id": "db-16",
    "cat": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹",
    "concept": "ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³",
    "difficulty": "åŸºç¤Ž",
    "q": "ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³é€”ä¸­ã®æ›´æ–°ã‚’å–ã‚Šæ¶ˆã—ã¦ã€é–‹å§‹å‰ã®çŠ¶æ…‹ã¸æˆ»ã™æ“ä½œã¯ï¼Ÿ",
    "options": [
      "ROLLBACK",
      "CHECKPOINT",
      "GRANT",
      "COMMIT"
    ],
    "a": 0,
    "exp": "ROLLBACKã¯ã€ã¾ã ç¢ºå®šã—ã¦ã„ãªã„ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³ã®æ›´æ–°ã‚’å–ã‚Šæ¶ˆã—ã¾ã™ã€‚",
    "hint": "COMMITã®åå¯¾ã®æ“ä½œã‚’é¸ã³ã¾ã™ã€‚",
    "choiceExps": [
      "ROLLBACKã¯ã€ã¾ã ç¢ºå®šã—ã¦ã„ãªã„ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³ã®æ›´æ–°ã‚’å–ã‚Šæ¶ˆã—ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œé€”ä¸­ã§éšœå®³ãŒèµ·ããŸã‚‰ROLLBACKã§ä¸€é€£ã®æ›´æ–°ã‚’å–ã‚Šæ¶ˆã™ã€ã€‚ROLLBACKã¯ã€ã¾ã ç¢ºå®šã—ã¦ã„ãªã„ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³ã®æ›´æ–°ã‚’å–ã‚Šæ¶ˆã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒCHECKPOINTã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œé€”ä¸­ã§éšœå®³ãŒèµ·ããŸã‚‰ROLLBACKã§ä¸€é€£ã®æ›´æ–°ã‚’å–ã‚Šæ¶ˆã™ã€ã€‚ROLLBACKã¯ã€ã¾ã ç¢ºå®šã—ã¦ã„ãªã„ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³ã®æ›´æ–°ã‚’å–ã‚Šæ¶ˆã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒGRANTã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€ŒCOMMITã€ã¯ã€ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³ã§è¡Œã£ãŸå¤‰æ›´ã‚’æ­£å¼ã«ç¢ºå®šã™ã‚‹æ“ä½œã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_09_05",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "å¼ãƒ»æ§‹æ–‡"
  },
  {
    "id": "db-17",
    "cat": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹",
    "concept": "åˆ†é›¢æ€§",
    "difficulty": "æ¨™æº–",
    "q": "ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³AãŒæ›´æ–°ã—ãŸå€¤ã‚’ã¾ã COMMITã—ã¦ã„ãªã„é–“ã«ã€ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³BãŒãã®å€¤ã‚’èª­ã¿å–ã£ã¦ã—ã¾ã£ãŸã€‚ã“ã®ç¾è±¡ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ãƒ•ã‚¡ãƒ³ãƒˆãƒ ãƒªãƒ¼ãƒ‰",
      "ãƒ€ãƒ¼ãƒ†ã‚£ãƒªãƒ¼ãƒ‰",
      "ãƒ‡ãƒƒãƒ‰ãƒ­ãƒƒã‚¯",
      "ãƒ­ã‚¹ãƒˆã‚¢ãƒƒãƒ—ãƒ‡ãƒ¼ãƒˆ"
    ],
    "a": 1,
    "exp": "æœªç¢ºå®šã®å¤‰æ›´ã‚’ä»–ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³ãŒèª­ã¿å–ã‚‹ã“ã¨ã‚’ãƒ€ãƒ¼ãƒ†ã‚£ãƒªãƒ¼ãƒ‰ã¨ã„ã„ã¾ã™ã€‚",
    "hint": "ã€Žã¾ã ç¢ºå®šã—ã¦ã„ãªã„å€¤ã‚’èª­ã‚€ã€ç¾è±¡ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³ã¯ä¸€é€£ã®DBå‡¦ç†ã‚’ä¸€å˜ä½ã¨ã—ã¦æ‰±ã„ã€ACIDç‰¹æ€§ã¨COMMIT/ROLLBACKã§æ•´åˆæ€§ã‚’å®ˆã‚Šã¾ã™ã€ã€‚æœªç¢ºå®šã®å¤‰æ›´ã‚’ä»–ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³ãŒèª­ã¿å–ã‚‹ã“ã¨ã‚’ãƒ€ãƒ¼ãƒ†ã‚£ãƒªãƒ¼ãƒ‰ã¨ã„ã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒ•ã‚¡ãƒ³ãƒˆãƒ ãƒªãƒ¼ãƒ‰ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "æœªç¢ºå®šã®å¤‰æ›´ã‚’ä»–ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³ãŒèª­ã¿å–ã‚‹ã“ã¨ã‚’ãƒ€ãƒ¼ãƒ†ã‚£ãƒªãƒ¼ãƒ‰ã¨ã„ã„ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³ã¯ä¸€é€£ã®DBå‡¦ç†ã‚’ä¸€å˜ä½ã¨ã—ã¦æ‰±ã„ã€ACIDç‰¹æ€§ã¨COMMIT/ROLLBACKã§æ•´åˆæ€§ã‚’å®ˆã‚Šã¾ã™ã€ã€‚æœªç¢ºå®šã®å¤‰æ›´ã‚’ä»–ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³ãŒèª­ã¿å–ã‚‹ã“ã¨ã‚’ãƒ€ãƒ¼ãƒ†ã‚£ãƒªãƒ¼ãƒ‰ã¨ã„ã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒ‡ãƒƒãƒ‰ãƒ­ãƒƒã‚¯ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³ã¯ä¸€é€£ã®DBå‡¦ç†ã‚’ä¸€å˜ä½ã¨ã—ã¦æ‰±ã„ã€ACIDç‰¹æ€§ã¨COMMIT/ROLLBACKã§æ•´åˆæ€§ã‚’å®ˆã‚Šã¾ã™ã€ã€‚æœªç¢ºå®šã®å¤‰æ›´ã‚’ä»–ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³ãŒèª­ã¿å–ã‚‹ã“ã¨ã‚’ãƒ€ãƒ¼ãƒ†ã‚£ãƒªãƒ¼ãƒ‰ã¨ã„ã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒ­ã‚¹ãƒˆã‚¢ãƒƒãƒ—ãƒ‡ãƒ¼ãƒˆã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_09_05",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "db-18",
    "cat": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹",
    "concept": "è¤‡åˆä¸»ã‚­ãƒ¼",
    "difficulty": "æ¨™æº–",
    "q": "æ³¨æ–‡æ˜Žç´°è¡¨ã§ã€1ã¤ã®æ³¨æ–‡ã«è¤‡æ•°å•†å“ãŒå«ã¾ã‚Œã‚‹ã€‚å„æ˜Žç´°ã‚’ä¸€æ„ã«è­˜åˆ¥ã™ã‚‹çµ„åˆã›ã¨ã—ã¦é©åˆ‡ãªã®ã¯ï¼Ÿ",
    "options": [
      "æ³¨æ–‡ID",
      "å•†å“åã¨ä¾¡æ ¼",
      "æ³¨æ–‡IDã¨å•†å“ID",
      "æ•°é‡"
    ],
    "a": 2,
    "exp": "æ³¨æ–‡IDã ã‘ã§ã¯åŒã˜æ³¨æ–‡å†…ã®è¤‡æ•°æ˜Žç´°ã‚’åŒºåˆ¥ã§ãã¾ã›ã‚“ã€‚æ³¨æ–‡IDã¨å•†å“IDã®çµ„åˆã›ãªã‚‰å„æ˜Žç´°ã‚’è­˜åˆ¥ã§ãã¾ã™ã€‚",
    "hint": "1åˆ—ã ã‘ã§ã¯é‡è¤‡ã™ã‚‹å ´åˆã€è¤‡æ•°åˆ—ã‚’çµ„ã¿åˆã‚ã›ã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¸»ã‚­ãƒ¼ã¯è¡Œã‚’ä¸€æ„ã«è­˜åˆ¥ã€ã€‚æ³¨æ–‡IDã ã‘ã§ã¯åŒã˜æ³¨æ–‡å†…ã®è¤‡æ•°æ˜Žç´°ã‚’åŒºåˆ¥ã§ãã¾ã›ã‚“ã€‚æ³¨æ–‡IDã¨å•†å“IDã®çµ„åˆã›ãªã‚‰å„æ˜Žç´°ã‚’è­˜åˆ¥ã§ãã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œæ³¨æ–‡IDã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¸»ã‚­ãƒ¼ã¯è¡Œã‚’ä¸€æ„ã«è­˜åˆ¥ã€ã€‚æ³¨æ–‡IDã ã‘ã§ã¯åŒã˜æ³¨æ–‡å†…ã®è¤‡æ•°æ˜Žç´°ã‚’åŒºåˆ¥ã§ãã¾ã›ã‚“ã€‚æ³¨æ–‡IDã¨å•†å“IDã®çµ„åˆã›ãªã‚‰å„æ˜Žç´°ã‚’è­˜åˆ¥ã§ãã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå•†å“åã¨ä¾¡æ ¼ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "æ³¨æ–‡IDã ã‘ã§ã¯åŒã˜æ³¨æ–‡å†…ã®è¤‡æ•°æ˜Žç´°ã‚’åŒºåˆ¥ã§ãã¾ã›ã‚“ã€‚æ³¨æ–‡IDã¨å•†å“IDã®çµ„åˆã›ãªã‚‰å„æ˜Žç´°ã‚’è­˜åˆ¥ã§ãã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä¸»ã‚­ãƒ¼ã¯è¡Œã‚’ä¸€æ„ã«è­˜åˆ¥ã€ã€‚æ³¨æ–‡IDã ã‘ã§ã¯åŒã˜æ³¨æ–‡å†…ã®è¤‡æ•°æ˜Žç´°ã‚’åŒºåˆ¥ã§ãã¾ã›ã‚“ã€‚æ³¨æ–‡IDã¨å•†å“IDã®çµ„åˆã›ãªã‚‰å„æ˜Žç´°ã‚’è­˜åˆ¥ã§ãã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œæ•°é‡ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_09_02",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "è¤‡æ•°æ¡ä»¶"
  },
  {
    "id": "db-19",
    "cat": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹",
    "concept": "ç¬¬2æ­£è¦å½¢",
    "difficulty": "æ¨™æº–",
    "q": "è¤‡åˆä¸»ã‚­ãƒ¼ã®ä¸€éƒ¨ã ã‘ã«ä¾å­˜ã™ã‚‹éžã‚­ãƒ¼å±žæ€§ã‚’åˆ¥è¡¨ã¸åˆ†é›¢ã™ã‚‹ã“ã¨ã§æº€ãŸã—ã‚„ã™ããªã‚‹æ­£è¦å½¢ã¯ï¼Ÿ",
    "options": [
      "ç¬¬3æ­£è¦å½¢",
      "éžæ­£è¦å½¢",
      "ç¬¬1æ­£è¦å½¢",
      "ç¬¬2æ­£è¦å½¢"
    ],
    "a": 3,
    "exp": "ç¬¬2æ­£è¦å½¢ã§ã¯ã€éžã‚­ãƒ¼å±žæ€§ãŒè¤‡åˆä¸»ã‚­ãƒ¼ã®ä¸€éƒ¨ã ã‘ã«ä¾å­˜ã™ã‚‹éƒ¨åˆ†é–¢æ•°å¾“å±žã‚’å–ã‚Šé™¤ãã¾ã™ã€‚",
    "hint": "è¤‡åˆä¸»ã‚­ãƒ¼ã®ã€Žä¸€éƒ¨ã¸ã®ä¾å­˜ã€ã‚’é™¤ãæ®µéšŽã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œç¬¬2æ­£è¦å½¢ï¼šè¤‡åˆä¸»ã‚­ãƒ¼ã®ä¸€éƒ¨ã ã‘ã«ä¾å­˜ã™ã‚‹é …ç›®ï¼ˆéƒ¨åˆ†é–¢æ•°å¾“å±žï¼‰ã‚’åˆ¥è¡¨ã¸åˆ†ã‘ã‚‹ã€ã€‚ç¬¬2æ­£è¦å½¢ã§ã¯ã€éžã‚­ãƒ¼å±žæ€§ãŒè¤‡åˆä¸»ã‚­ãƒ¼ã®ä¸€éƒ¨ã ã‘ã«ä¾å­˜ã™ã‚‹éƒ¨åˆ†é–¢æ•°å¾“å±žã‚’å–ã‚Šé™¤ãã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œç¬¬3æ­£è¦å½¢ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œç¬¬2æ­£è¦å½¢ï¼šè¤‡åˆä¸»ã‚­ãƒ¼ã®ä¸€éƒ¨ã ã‘ã«ä¾å­˜ã™ã‚‹é …ç›®ï¼ˆéƒ¨åˆ†é–¢æ•°å¾“å±žï¼‰ã‚’åˆ¥è¡¨ã¸åˆ†ã‘ã‚‹ã€ã€‚ç¬¬2æ­£è¦å½¢ã§ã¯ã€éžã‚­ãƒ¼å±žæ€§ãŒè¤‡åˆä¸»ã‚­ãƒ¼ã®ä¸€éƒ¨ã ã‘ã«ä¾å­˜ã™ã‚‹éƒ¨åˆ†é–¢æ•°å¾“å±žã‚’å–ã‚Šé™¤ãã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œéžæ­£è¦å½¢ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œç¬¬2æ­£è¦å½¢ï¼šè¤‡åˆä¸»ã‚­ãƒ¼ã®ä¸€éƒ¨ã ã‘ã«ä¾å­˜ã™ã‚‹é …ç›®ï¼ˆéƒ¨åˆ†é–¢æ•°å¾“å±žï¼‰ã‚’åˆ¥è¡¨ã¸åˆ†ã‘ã‚‹ã€ã€‚ç¬¬2æ­£è¦å½¢ã§ã¯ã€éžã‚­ãƒ¼å±žæ€§ãŒè¤‡åˆä¸»ã‚­ãƒ¼ã®ä¸€éƒ¨ã ã‘ã«ä¾å­˜ã™ã‚‹éƒ¨åˆ†é–¢æ•°å¾“å±žã‚’å–ã‚Šé™¤ãã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œç¬¬1æ­£è¦å½¢ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ç¬¬2æ­£è¦å½¢ã§ã¯ã€éžã‚­ãƒ¼å±žæ€§ãŒè¤‡åˆä¸»ã‚­ãƒ¼ã®ä¸€éƒ¨ã ã‘ã«ä¾å­˜ã™ã‚‹éƒ¨åˆ†é–¢æ•°å¾“å±žã‚’å–ã‚Šé™¤ãã¾ã™ã€‚"
    ],
    "explainTopicId": "core_09_03",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "db-20",
    "cat": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹",
    "concept": "ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹",
    "difficulty": "æ¨™æº–",
    "q": "ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹ã®ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã‚’å¢—ã‚„ã—ã™ãŽãŸå ´åˆã«èµ·ã“ã‚Šå¾—ã‚‹æ¬ ç‚¹ã¯ï¼Ÿ",
    "options": [
      "INSERTã‚„UPDATEæ™‚ã®æ›´æ–°è² è·ã¨ä¿å­˜é ˜åŸŸãŒå¢—ãˆã‚‹",
      "ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³å‡¦ç†ãã®ã‚‚ã®ãŒåˆ©ç”¨ã§ããªããªã‚‹",
      "SELECTæ–‡ã«ã‚ˆã‚‹æ¤œç´¢å‡¦ç†ãŒå®Ÿè¡Œã§ããªããªã‚‹",
      "ä¸»ã‚­ãƒ¼ã‚„å¤–éƒ¨ã‚­ãƒ¼ãªã©ã®åˆ¶ç´„ã‚’è¨­å®šã§ããªããªã‚‹"
    ],
    "a": 0,
    "exp": "ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã¯æ¤œç´¢ã‚’é€Ÿãã§ãã‚‹ä¸€æ–¹ã€ãƒ‡ãƒ¼ã‚¿æ›´æ–°æ™‚ã«ã¯ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹å´ã‚‚æ›´æ–°ã™ã‚‹å¿…è¦ãŒã‚ã‚Šã€é ˜åŸŸã‚‚æ¶ˆè²»ã—ã¾ã™ã€‚",
    "hint": "æ¤œç´¢æ€§èƒ½ã ã‘ã§ãªãã€ãƒ‡ãƒ¼ã‚¿ã‚’æ›¸ãæ›ãˆã‚‹ã¨ãã®ã‚³ã‚¹ãƒˆã‚’è€ƒãˆã¾ã™ã€‚",
    "choiceExps": [
      "ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã¯æ¤œç´¢ã‚’é€Ÿãã§ãã‚‹ä¸€æ–¹ã€ãƒ‡ãƒ¼ã‚¿æ›´æ–°æ™‚ã«ã¯ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹å´ã‚‚æ›´æ–°ã™ã‚‹å¿…è¦ãŒã‚ã‚Šã€é ˜åŸŸã‚‚æ¶ˆè²»ã—ã¾ã™ã€‚",
      "ã€Œãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³ã€ã¯ã€è¤‡æ•°ã®ãƒ‡ãƒ¼ã‚¿æ“ä½œã‚’ã€ã¾ã¨ã‚ã¦æˆåŠŸã¾ãŸã¯å¤±æ•—ã•ã›ã‚‹å‡¦ç†å˜ä½ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒDBMSï¼ˆDatabase Management Systemï¼šãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹ç®¡ç†ã‚·ã‚¹ãƒ†ãƒ ï¼‰ã¯ã€ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹ã‚’å®‰å…¨ãƒ»åŠ¹çŽ‡çš„ã«åˆ©ç”¨ã™ã‚‹ãŸã‚ã®ã‚½ãƒ•ãƒˆã‚¦ã‚§ã‚¢ã§ã™ã€‚æ¤œç´¢ã€æ›´æ–°ã€æ¨©é™ã€åŒæ™‚åˆ©ç”¨ã€éšœå®³å¾©æ—§ãªã©ã‚’ç®¡ç†ã—ã¾ã™ã€ã€‚ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹ã¯æ¤œç´¢ã‚’é€Ÿãã§ãã‚‹ä¸€æ–¹ã€ãƒ‡ãƒ¼ã‚¿æ›´æ–°æ™‚ã«ã¯ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹å´ã‚‚æ›´æ–°ã™ã‚‹å¿…è¦ãŒã‚ã‚Šã€é ˜åŸŸã‚‚æ¶ˆè²»ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒSELECTæ–‡ã«ã‚ˆã‚‹æ¤œç´¢å‡¦ç†ãŒå®Ÿè¡Œã§ããªããªã‚‹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œå¤–éƒ¨ã‚­ãƒ¼ã€ã¯ã€åˆ¥ã®è¡¨ã®ä¸»ã‚­ãƒ¼ãªã©ã‚’å‚ç…§ã—ã€è¡¨åŒå£«ã‚’é–¢é€£ä»˜ã‘ã‚‹ãŸã‚ã®åˆ—ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_09_04",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "å½¹å‰²é¸æŠž"
  },
  {
    "id": "net-08",
    "cat": "ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯",
    "concept": "OSIå‚ç…§ãƒ¢ãƒ‡ãƒ«",
    "difficulty": "åŸºç¤Ž",
    "q": "ãƒ«ãƒ¼ã‚¿ãŒå®›å…ˆIPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’ç¢ºèªã—ã€ç•°ãªã‚‹ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã¸ãƒ‘ã‚±ãƒƒãƒˆã‚’è»¢é€ã—ã¦ã„ã‚‹ã€‚ã“ã®å‡¦ç†ãŒä¸»ã«å±žã™ã‚‹OSIå‚ç…§ãƒ¢ãƒ‡ãƒ«ã®å±¤ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ç‰©ç†å±¤",
      "ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯å±¤",
      "ãƒ‡ãƒ¼ã‚¿ãƒªãƒ³ã‚¯å±¤",
      "ãƒˆãƒ©ãƒ³ã‚¹ãƒãƒ¼ãƒˆå±¤"
    ],
    "a": 1,
    "exp": "ãƒ«ãƒ¼ã‚¿ã¯IPã‚¢ãƒ‰ãƒ¬ã‚¹ã«åŸºã¥ã„ã¦çµŒè·¯é¸æŠžã‚’è¡Œã†ãŸã‚ã€ä¸»ã«ç¬¬3å±¤ã®ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯å±¤ã§å‹•ä½œã—ã¾ã™ã€‚",
    "hint": "IPã‚’æ‰±ã†å±¤ã‚’è€ƒãˆã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒ«ãƒ¼ã‚¿ï¼šIPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’è¦‹ã¦ç•°ãªã‚‹ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯é–“ã‚’ä¸­ç¶™ã€ã€‚ãƒ«ãƒ¼ã‚¿ã¯IPã‚¢ãƒ‰ãƒ¬ã‚¹ã«åŸºã¥ã„ã¦çµŒè·¯é¸æŠžã‚’è¡Œã†ãŸã‚ã€ä¸»ã«ç¬¬3å±¤ã®ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯å±¤ã§å‹•ä½œã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œç‰©ç†å±¤ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ãƒ«ãƒ¼ã‚¿ã¯IPã‚¢ãƒ‰ãƒ¬ã‚¹ã«åŸºã¥ã„ã¦çµŒè·¯é¸æŠžã‚’è¡Œã†ãŸã‚ã€ä¸»ã«ç¬¬3å±¤ã®ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯å±¤ã§å‹•ä½œã—ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒ«ãƒ¼ã‚¿ï¼šIPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’è¦‹ã¦ç•°ãªã‚‹ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯é–“ã‚’ä¸­ç¶™ã€ã€‚ãƒ«ãƒ¼ã‚¿ã¯IPã‚¢ãƒ‰ãƒ¬ã‚¹ã«åŸºã¥ã„ã¦çµŒè·¯é¸æŠžã‚’è¡Œã†ãŸã‚ã€ä¸»ã«ç¬¬3å±¤ã®ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯å±¤ã§å‹•ä½œã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒ‡ãƒ¼ã‚¿ãƒªãƒ³ã‚¯å±¤ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒ«ãƒ¼ã‚¿ï¼šIPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’è¦‹ã¦ç•°ãªã‚‹ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯é–“ã‚’ä¸­ç¶™ã€ã€‚ãƒ«ãƒ¼ã‚¿ã¯IPã‚¢ãƒ‰ãƒ¬ã‚¹ã«åŸºã¥ã„ã¦çµŒè·¯é¸æŠžã‚’è¡Œã†ãŸã‚ã€ä¸»ã«ç¬¬3å±¤ã®ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯å±¤ã§å‹•ä½œã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒˆãƒ©ãƒ³ã‚¹ãƒãƒ¼ãƒˆå±¤ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_10_02",
    "explainTopicSource": "semantic",
    "cognitiveRewrite": "v90-context",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "å½¹å‰²é¸æŠž"
  },
  {
    "id": "net-09",
    "cat": "ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯",
    "concept": "LANã‚¹ã‚¤ãƒƒãƒ",
    "difficulty": "åŸºç¤Ž",
    "q": "Ethernetã®L2ã‚¹ã‚¤ãƒƒãƒãŒã€å—ä¿¡ã—ãŸãƒ•ãƒ¬ãƒ¼ãƒ ã‚’ã©ã®ãƒãƒ¼ãƒˆã¸è»¢é€ã™ã‚‹ã‹æ±ºã‚ãŸã„ã€‚ä¸»ã«å‚ç…§ã™ã‚‹æƒ…å ±ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ãƒãƒ¼ãƒˆç•ªå·",
      "URL",
      "MACã‚¢ãƒ‰ãƒ¬ã‚¹",
      "IPã‚¢ãƒ‰ãƒ¬ã‚¹"
    ],
    "a": 2,
    "exp": "L2ã‚¹ã‚¤ãƒƒãƒã¯MACã‚¢ãƒ‰ãƒ¬ã‚¹ãƒ†ãƒ¼ãƒ–ãƒ«ã‚’ä½¿ã£ã¦Ethernetãƒ•ãƒ¬ãƒ¼ãƒ ã‚’é©åˆ‡ãªãƒãƒ¼ãƒˆã¸è»¢é€ã—ã¾ã™ã€‚",
    "hint": "L2ã¯ãƒ‡ãƒ¼ã‚¿ãƒªãƒ³ã‚¯å±¤ã§ä½¿ã‚ã‚Œã‚‹ã‚¢ãƒ‰ãƒ¬ã‚¹ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã‚¹ã‚¤ãƒƒãƒã¯MACã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’è¦‹ã¦è»¢é€ã€ã€‚L2ã‚¹ã‚¤ãƒƒãƒã¯MACã‚¢ãƒ‰ãƒ¬ã‚¹ãƒ†ãƒ¼ãƒ–ãƒ«ã‚’ä½¿ã£ã¦Ethernetãƒ•ãƒ¬ãƒ¼ãƒ ã‚’é©åˆ‡ãªãƒãƒ¼ãƒˆã¸è»¢é€ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒãƒ¼ãƒˆç•ªå·ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œã‚¹ã‚¤ãƒƒãƒã¯MACã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’è¦‹ã¦è»¢é€ã€ã€‚L2ã‚¹ã‚¤ãƒƒãƒã¯MACã‚¢ãƒ‰ãƒ¬ã‚¹ãƒ†ãƒ¼ãƒ–ãƒ«ã‚’ä½¿ã£ã¦Ethernetãƒ•ãƒ¬ãƒ¼ãƒ ã‚’é©åˆ‡ãªãƒãƒ¼ãƒˆã¸è»¢é€ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒURLã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "L2ã‚¹ã‚¤ãƒƒãƒã¯MACã‚¢ãƒ‰ãƒ¬ã‚¹ãƒ†ãƒ¼ãƒ–ãƒ«ã‚’ä½¿ã£ã¦Ethernetãƒ•ãƒ¬ãƒ¼ãƒ ã‚’é©åˆ‡ãªãƒãƒ¼ãƒˆã¸è»¢é€ã—ã¾ã™ã€‚",
      "ã€ŒIPã‚¢ãƒ‰ãƒ¬ã‚¹ã€ã¯ã€ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ä¸Šã®æ©Ÿå™¨ã‚’è­˜åˆ¥ã™ã‚‹ãŸã‚ã®ç•ªå·ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_10_02",
    "explainTopicSource": "semantic",
    "cognitiveRewrite": "v90-context",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "å½¹å‰²é¸æŠž"
  },
  {
    "id": "net-10",
    "cat": "ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯",
    "concept": "TCP",
    "difficulty": "æ¨™æº–",
    "q": "TCPã®æŽ¥ç¶šç¢ºç«‹ã§è¡Œã‚ã‚Œã‚‹3ã‚¦ã‚§ã‚¤ãƒãƒ³ãƒ‰ã‚·ã‚§ã‚¤ã‚¯ã®é †åºã¨ã—ã¦æ­£ã—ã„ã‚‚ã®ã¯ï¼Ÿ",
    "options": [
      "FIN â†’ FIN/ACK â†’ ACK",
      "ACK â†’ SYN â†’ FIN",
      "SYN â†’ ACK â†’ FIN",
      "SYN â†’ SYN/ACK â†’ ACK"
    ],
    "a": 3,
    "exp": "TCPæŽ¥ç¶šã§ã¯ã€ã‚¯ãƒ©ã‚¤ã‚¢ãƒ³ãƒˆã®SYNã€ã‚µãƒ¼ãƒã®SYN/ACKã€ã‚¯ãƒ©ã‚¤ã‚¢ãƒ³ãƒˆã®ACKã®3æ®µéšŽã§æŽ¥ç¶šã‚’ç¢ºç«‹ã—ã¾ã™ã€‚",
    "hint": "æœ€åˆã¯æŽ¥ç¶šè¦æ±‚ã‚’è¡¨ã™SYNã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œæœ€åˆã¯æŽ¥ç¶šè¦æ±‚ã‚’è¡¨ã™SYNã§ã™ã€ã€‚TCPæŽ¥ç¶šã§ã¯ã€ã‚¯ãƒ©ã‚¤ã‚¢ãƒ³ãƒˆã®SYNã€ã‚µãƒ¼ãƒã®SYN/ACKã€ã‚¯ãƒ©ã‚¤ã‚¢ãƒ³ãƒˆã®ACKã®3æ®µéšŽã§æŽ¥ç¶šã‚’ç¢ºç«‹ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒFIN â†’ FIN/ACK â†’ ACKã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œæœ€åˆã¯æŽ¥ç¶šè¦æ±‚ã‚’è¡¨ã™SYNã§ã™ã€ã€‚TCPæŽ¥ç¶šã§ã¯ã€ã‚¯ãƒ©ã‚¤ã‚¢ãƒ³ãƒˆã®SYNã€ã‚µãƒ¼ãƒã®SYN/ACKã€ã‚¯ãƒ©ã‚¤ã‚¢ãƒ³ãƒˆã®ACKã®3æ®µéšŽã§æŽ¥ç¶šã‚’ç¢ºç«‹ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒACK â†’ SYN â†’ FINã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œæœ€åˆã¯æŽ¥ç¶šè¦æ±‚ã‚’è¡¨ã™SYNã§ã™ã€ã€‚TCPæŽ¥ç¶šã§ã¯ã€ã‚¯ãƒ©ã‚¤ã‚¢ãƒ³ãƒˆã®SYNã€ã‚µãƒ¼ãƒã®SYN/ACKã€ã‚¯ãƒ©ã‚¤ã‚¢ãƒ³ãƒˆã®ACKã®3æ®µéšŽã§æŽ¥ç¶šã‚’ç¢ºç«‹ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒSYN â†’ ACK â†’ FINã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "TCPæŽ¥ç¶šã§ã¯ã€ã‚¯ãƒ©ã‚¤ã‚¢ãƒ³ãƒˆã®SYNã€ã‚µãƒ¼ãƒã®SYN/ACKã€ã‚¯ãƒ©ã‚¤ã‚¢ãƒ³ãƒˆã®ACKã®3æ®µéšŽã§æŽ¥ç¶šã‚’ç¢ºç«‹ã—ã¾ã™ã€‚"
    ],
    "explainTopicId": "core_10_07",
    "explainTopicSource": "manual",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "net-11",
    "cat": "ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯",
    "concept": "HTTPS",
    "difficulty": "åŸºç¤Ž",
    "q": "HTTPSã§ä¸€èˆ¬çš„ã«ä½¿ã‚ã‚Œã‚‹æ¨™æº–ãƒãƒ¼ãƒˆç•ªå·ã¯ï¼Ÿ",
    "options": [
      "443",
      "21",
      "25",
      "80"
    ],
    "a": 0,
    "exp": "HTTPSã®æ¨™æº–ãƒãƒ¼ãƒˆã¯443ã§ã™ã€‚HTTPã¯ä¸€èˆ¬ã«80ã‚’ä½¿ã„ã¾ã™ã€‚",
    "hint": "HTTPã®80ç•ªã¨å¯¾ã«ãªã‚‹ã€å®‰å…¨ãªWebé€šä¿¡ã®æ¨™æº–ãƒãƒ¼ãƒˆã§ã™ã€‚",
    "choiceExps": [
      "HTTPSã®æ¨™æº–ãƒãƒ¼ãƒˆã¯443ã§ã™ã€‚HTTPã¯ä¸€èˆ¬ã«80ã‚’ä½¿ã„ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒHTTPã®80ç•ªã¨å¯¾ã«ãªã‚‹ã€å®‰å…¨ãªWebé€šä¿¡ã®æ¨™æº–ãƒãƒ¼ãƒˆã§ã™ã€ã€‚HTTPSã®æ¨™æº–ãƒãƒ¼ãƒˆã¯443ã§ã™ã€‚HTTPã¯ä¸€èˆ¬ã«80ã‚’ä½¿ã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ21ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒHTTPã®80ç•ªã¨å¯¾ã«ãªã‚‹ã€å®‰å…¨ãªWebé€šä¿¡ã®æ¨™æº–ãƒãƒ¼ãƒˆã§ã™ã€ã€‚HTTPSã®æ¨™æº–ãƒãƒ¼ãƒˆã¯443ã§ã™ã€‚HTTPã¯ä¸€èˆ¬ã«80ã‚’ä½¿ã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ25ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒHTTPã®80ç•ªã¨å¯¾ã«ãªã‚‹ã€å®‰å…¨ãªWebé€šä¿¡ã®æ¨™æº–ãƒãƒ¼ãƒˆã§ã™ã€ã€‚HTTPSã®æ¨™æº–ãƒãƒ¼ãƒˆã¯443ã§ã™ã€‚HTTPã¯ä¸€èˆ¬ã«80ã‚’ä½¿ã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ80ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_10_08",
    "explainTopicSource": "manual",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "è¦æ ¼ãƒ»å®šæ•°"
  },
  {
    "id": "net-12",
    "cat": "ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯",
    "concept": "ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆIP",
    "difficulty": "åŸºç¤Ž",
    "q": "æ¬¡ã®IPv4ã‚¢ãƒ‰ãƒ¬ã‚¹ã®ã†ã¡ã€ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆã‚¢ãƒ‰ãƒ¬ã‚¹ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "172.32.0.1",
      "192.168.10.20",
      "224.0.0.1",
      "11.0.0.1"
    ],
    "a": 1,
    "exp": "192.168.0.0/16ã¯ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆã‚¢ãƒ‰ãƒ¬ã‚¹ç¯„å›²ã§ã™ã€‚172ç³»ã¯172.16.0.0ã€œ172.31.255.255ãŒå¯¾è±¡ã§ã™ã€‚",
    "hint": "192.168.x.x ã¯ä»£è¡¨çš„ãªãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆã‚¢ãƒ‰ãƒ¬ã‚¹ç¯„å›²ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ192.168.0.0/16ã€ã€‚192.168.0.0/16ã¯ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆã‚¢ãƒ‰ãƒ¬ã‚¹ç¯„å›²ã§ã™ã€‚172ç³»ã¯172.16.0.0ã€œ172.31.255.255ãŒå¯¾è±¡ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ172.32.0.1ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "192.168.0.0/16ã¯ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆã‚¢ãƒ‰ãƒ¬ã‚¹ç¯„å›²ã§ã™ã€‚172ç³»ã¯172.16.0.0ã€œ172.31.255.255ãŒå¯¾è±¡ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ192.168.0.0/16ã€ã€‚192.168.0.0/16ã¯ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆã‚¢ãƒ‰ãƒ¬ã‚¹ç¯„å›²ã§ã™ã€‚172ç³»ã¯172.16.0.0ã€œ172.31.255.255ãŒå¯¾è±¡ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ224.0.0.1ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ192.168.0.0/16ã€ã€‚192.168.0.0/16ã¯ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆã‚¢ãƒ‰ãƒ¬ã‚¹ç¯„å›²ã§ã™ã€‚172ç³»ã¯172.16.0.0ã€œ172.31.255.255ãŒå¯¾è±¡ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ11.0.0.1ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_10_05",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "net-13",
    "cat": "ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯",
    "concept": "IPv6",
    "difficulty": "åŸºç¤Ž",
    "q": "IPv6ã‚¢ãƒ‰ãƒ¬ã‚¹ã®é•·ã•ã¯ä½•ãƒ“ãƒƒãƒˆã‹ã€‚",
    "options": [
      "256ãƒ“ãƒƒãƒˆ",
      "32ãƒ“ãƒƒãƒˆ",
      "128ãƒ“ãƒƒãƒˆ",
      "64ãƒ“ãƒƒãƒˆ"
    ],
    "a": 2,
    "exp": "IPv6ã‚¢ãƒ‰ãƒ¬ã‚¹ã¯128ãƒ“ãƒƒãƒˆã§ã™ã€‚IPv4ã®32ãƒ“ãƒƒãƒˆã‚ˆã‚Šå¤§å¹…ã«åºƒã„ã‚¢ãƒ‰ãƒ¬ã‚¹ç©ºé–“ã‚’æŒã¡ã¾ã™ã€‚",
    "hint": "IPv4ã¯32ãƒ“ãƒƒãƒˆã§ã™ã€‚IPv6ã¯ãã®4å€ã®é•·ã•ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒIPv6ã¯128bitã€ã€‚IPv6ã‚¢ãƒ‰ãƒ¬ã‚¹ã¯128ãƒ“ãƒƒãƒˆã§ã™ã€‚IPv4ã®32ãƒ“ãƒƒãƒˆã‚ˆã‚Šå¤§å¹…ã«åºƒã„ã‚¢ãƒ‰ãƒ¬ã‚¹ç©ºé–“ã‚’æŒã¡ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ256ãƒ“ãƒƒãƒˆã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒIPv6ã¯128bitã€ã€‚IPv6ã‚¢ãƒ‰ãƒ¬ã‚¹ã¯128ãƒ“ãƒƒãƒˆã§ã™ã€‚IPv4ã®32ãƒ“ãƒƒãƒˆã‚ˆã‚Šå¤§å¹…ã«åºƒã„ã‚¢ãƒ‰ãƒ¬ã‚¹ç©ºé–“ã‚’æŒã¡ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ32ãƒ“ãƒƒãƒˆã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "IPv6ã‚¢ãƒ‰ãƒ¬ã‚¹ã¯128ãƒ“ãƒƒãƒˆã§ã™ã€‚IPv4ã®32ãƒ“ãƒƒãƒˆã‚ˆã‚Šå¤§å¹…ã«åºƒã„ã‚¢ãƒ‰ãƒ¬ã‚¹ç©ºé–“ã‚’æŒã¡ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒIPv6ã¯128bitã€ã€‚IPv6ã‚¢ãƒ‰ãƒ¬ã‚¹ã¯128ãƒ“ãƒƒãƒˆã§ã™ã€‚IPv4ã®32ãƒ“ãƒƒãƒˆã‚ˆã‚Šå¤§å¹…ã«åºƒã„ã‚¢ãƒ‰ãƒ¬ã‚¹ç©ºé–“ã‚’æŒã¡ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ64ãƒ“ãƒƒãƒˆã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_10_03",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "è¦æ ¼ãƒ»å®šæ•°"
  },
  {
    "id": "net-14",
    "cat": "ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯",
    "concept": "ARP",
    "difficulty": "æ¨™æº–",
    "q": "åŒä¸€LANå†…ã§ã€å®›å…ˆIPv4ã‚¢ãƒ‰ãƒ¬ã‚¹ã«å¯¾å¿œã™ã‚‹MACã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’èª¿ã¹ã‚‹ãŸã‚ã«ä½¿ã‚ã‚Œã‚‹ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã¯ï¼Ÿ",
    "options": [
      "DNS",
      "DHCP",
      "SMTP",
      "ARP"
    ],
    "a": 3,
    "exp": "ARPã¯IPv4ã‚¢ãƒ‰ãƒ¬ã‚¹ã‹ã‚‰å¯¾å¿œã™ã‚‹MACã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’è§£æ±ºã™ã‚‹ãŸã‚ã«ä½¿ã„ã¾ã™ã€‚",
    "hint": "IPã¨MACã‚’å¯¾å¿œä»˜ã‘ã‚‹ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã§ã™ã€‚",
    "choiceExps": [
      "ã€ŒDNSã€ã¯ã€ãƒ‰ãƒ¡ã‚¤ãƒ³åã¨IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å¯¾å¿œä»˜ã‘ã‚‹ä»•çµ„ã¿ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒARPã‚„ICMPã‚’ã‚¢ãƒ—ãƒªã‚±ãƒ¼ã‚·ãƒ§ãƒ³å±¤ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã¨æ··åŒã—ãªã„ã“ã¨ã€ã€‚ARPã¯IPv4ã‚¢ãƒ‰ãƒ¬ã‚¹ã‹ã‚‰å¯¾å¿œã™ã‚‹MACã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’è§£æ±ºã™ã‚‹ãŸã‚ã«ä½¿ã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒDHCPã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€ŒSMTPã€ã¯ã€é›»å­ãƒ¡ãƒ¼ãƒ«ã‚’é€ä¿¡ãƒ»è»¢é€ã™ã‚‹ãŸã‚ã®ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ARPã¯IPv4ã‚¢ãƒ‰ãƒ¬ã‚¹ã‹ã‚‰å¯¾å¿œã™ã‚‹MACã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’è§£æ±ºã™ã‚‹ãŸã‚ã«ä½¿ã„ã¾ã™ã€‚"
    ],
    "explainTopicId": "core_10_07",
    "explainTopicSource": "manual",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "net-15",
    "cat": "ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯",
    "concept": "ICMP",
    "difficulty": "åŸºç¤Ž",
    "q": "pingã‚³ãƒžãƒ³ãƒ‰ãŒç–Žé€šç¢ºèªã«åˆ©ç”¨ã™ã‚‹ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã¯ï¼Ÿ",
    "options": [
      "ICMP",
      "SMTP",
      "ARP",
      "FTP"
    ],
    "a": 0,
    "exp": "pingã¯ICMP Echo Requestã¨Echo Replyã‚’ä½¿ã£ã¦ç–Žé€šã‚’ç¢ºèªã—ã¾ã™ã€‚",
    "hint": "Echo Request / Echo Replyã‚’ä½¿ã†ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã§ã™ã€‚",
    "choiceExps": [
      "pingã¯ICMP Echo Requestã¨Echo Replyã‚’ä½¿ã£ã¦ç–Žé€šã‚’ç¢ºèªã—ã¾ã™ã€‚",
      "ã€ŒSMTPã€ã¯ã€é›»å­ãƒ¡ãƒ¼ãƒ«ã‚’é€ä¿¡ãƒ»è»¢é€ã™ã‚‹ãŸã‚ã®ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒARPã‚„ICMPã‚’ã‚¢ãƒ—ãƒªã‚±ãƒ¼ã‚·ãƒ§ãƒ³å±¤ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã¨æ··åŒã—ãªã„ã“ã¨ã€ã€‚pingã¯ICMP Echo Requestã¨Echo Replyã‚’ä½¿ã£ã¦ç–Žé€šã‚’ç¢ºèªã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒARPã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒARPã‚„ICMPã‚’ã‚¢ãƒ—ãƒªã‚±ãƒ¼ã‚·ãƒ§ãƒ³å±¤ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã¨æ··åŒã—ãªã„ã“ã¨ã€ã€‚pingã¯ICMP Echo Requestã¨Echo Replyã‚’ä½¿ã£ã¦ç–Žé€šã‚’ç¢ºèªã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒFTPã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_10_07",
    "explainTopicSource": "manual",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "net-16",
    "cat": "ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯",
    "concept": "é›»å­ãƒ¡ãƒ¼ãƒ«",
    "difficulty": "åŸºç¤Ž",
    "q": "é€ä¿¡å´ã®ãƒ¡ãƒ¼ãƒ«ã‚µãƒ¼ãƒãŒã€å®›å…ˆçµ„ç¹”ã®ãƒ¡ãƒ¼ãƒ«ã‚µãƒ¼ãƒã¸é›»å­ãƒ¡ãƒ¼ãƒ«ã‚’è»¢é€ã™ã‚‹ã€‚ä¸»ã«åˆ©ç”¨ã™ã‚‹ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "SNMP",
      "SMTP",
      "POP3",
      "IMAP"
    ],
    "a": 1,
    "exp": "SMTPã¯é›»å­ãƒ¡ãƒ¼ãƒ«ã®é€ä¿¡ãƒ»è»¢é€ã«ä½¿ã‚ã‚Œã¾ã™ã€‚POP3ã‚„IMAPã¯ä¸»ã«ãƒ¡ãƒ¼ãƒ«ã®å—ä¿¡ãƒ»å‚ç…§ã«ä½¿ã„ã¾ã™ã€‚",
    "hint": "ãƒ¡ãƒ¼ãƒ«ã‚’ã€Žé€ã‚‹ã€ãŸã‚ã®ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã§ã™ã€‚",
    "choiceExps": [
      "ã€ŒSNMPã€ã¯ã€ãƒ«ãƒ¼ã‚¿ã‚„ã‚¹ã‚¤ãƒƒãƒãªã©ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯æ©Ÿå™¨ã®çŠ¶æ…‹ã‚’ç›£è¦–ãƒ»ç®¡ç†ã™ã‚‹ãŸã‚ã®ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "SMTPã¯é›»å­ãƒ¡ãƒ¼ãƒ«ã®é€ä¿¡ãƒ»è»¢é€ã«ä½¿ã‚ã‚Œã¾ã™ã€‚POP3ã‚„IMAPã¯ä¸»ã«ãƒ¡ãƒ¼ãƒ«ã®å—ä¿¡ãƒ»å‚ç…§ã«ä½¿ã„ã¾ã™ã€‚",
      "ã€ŒPOP3ã€ã¯ã€Post Office Protocol version 3ã€‚ãƒ¡ãƒ¼ãƒ«ã‚’ã‚µãƒ¼ãƒã‹ã‚‰ç«¯æœ«ã¸å–å¾—ã™ã‚‹ãŸã‚ã®å—ä¿¡ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€ŒIMAPã€ã¯ã€Internet Message Access Protocolã€‚ãƒ¡ãƒ¼ãƒ«ã‚’ã‚µãƒ¼ãƒä¸Šã«ä¿æŒã—ãŸã¾ã¾ã€è¤‡æ•°ç«¯æœ«ã‹ã‚‰åŒæœŸã—ã¦åˆ©ç”¨ã—ã‚„ã™ã„å—ä¿¡ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_10_08",
    "explainTopicSource": "semantic",
    "cognitiveRewrite": "v90-context",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "å½¹å‰²é¸æŠž"
  },
  {
    "id": "net-17",
    "cat": "ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯",
    "concept": "IMAP",
    "difficulty": "æ¨™æº–",
    "q": "è¤‡æ•°ç«¯æœ«ã§ãƒ¡ãƒ¼ãƒ«ãƒœãƒƒã‚¯ã‚¹ã®æ—¢èª­çŠ¶æ…‹ã‚„ãƒ•ã‚©ãƒ«ãƒ€ã‚’åŒæœŸã—ãªãŒã‚‰åˆ©ç”¨ã™ã‚‹ç”¨é€”ã«å‘ããƒ—ãƒ­ãƒˆã‚³ãƒ«ã¯ï¼Ÿ",
    "options": [
      "SMTP",
      "ARP",
      "IMAP",
      "ICMP"
    ],
    "a": 2,
    "exp": "IMAPã¯ãƒ¡ãƒ¼ãƒ«ã‚’ã‚µãƒ¼ãƒä¸Šã§ç®¡ç†ã—ã€è¤‡æ•°ç«¯æœ«ã‹ã‚‰çŠ¶æ…‹ã‚’åŒæœŸã—ãªãŒã‚‰å‚ç…§ã™ã‚‹ç”¨é€”ã«é©ã—ã¾ã™ã€‚",
    "hint": "ã‚µãƒ¼ãƒä¸Šã®ãƒ¡ãƒ¼ãƒ«ã‚’è¤‡æ•°ç«¯æœ«ã§åŒæœŸã—ã¦æ‰±ã„ã¾ã™ã€‚",
    "choiceExps": [
      "ã€ŒSMTPã€ã¯ã€é›»å­ãƒ¡ãƒ¼ãƒ«ã‚’é€ä¿¡ãƒ»è»¢é€ã™ã‚‹ãŸã‚ã®ãƒ—ãƒ­ãƒˆã‚³ãƒ«ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒ¡ãƒ¼ãƒ«å—ä¿¡ï¼šPOP3 / IMAPã€ã€‚IMAPã¯ãƒ¡ãƒ¼ãƒ«ã‚’ã‚µãƒ¼ãƒä¸Šã§ç®¡ç†ã—ã€è¤‡æ•°ç«¯æœ«ã‹ã‚‰çŠ¶æ…‹ã‚’åŒæœŸã—ãªãŒã‚‰å‚ç…§ã™ã‚‹ç”¨é€”ã«é©ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒARPã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "IMAPã¯ãƒ¡ãƒ¼ãƒ«ã‚’ã‚µãƒ¼ãƒä¸Šã§ç®¡ç†ã—ã€è¤‡æ•°ç«¯æœ«ã‹ã‚‰çŠ¶æ…‹ã‚’åŒæœŸã—ãªãŒã‚‰å‚ç…§ã™ã‚‹ç”¨é€”ã«é©ã—ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒ¡ãƒ¼ãƒ«å—ä¿¡ï¼šPOP3 / IMAPã€ã€‚IMAPã¯ãƒ¡ãƒ¼ãƒ«ã‚’ã‚µãƒ¼ãƒä¸Šã§ç®¡ç†ã—ã€è¤‡æ•°ç«¯æœ«ã‹ã‚‰çŠ¶æ…‹ã‚’åŒæœŸã—ãªãŒã‚‰å‚ç…§ã™ã‚‹ç”¨é€”ã«é©ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒICMPã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_10_08",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "net-18",
    "cat": "ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯",
    "concept": "ã‚µãƒ–ãƒãƒƒãƒˆ",
    "difficulty": "æ¨™æº–",
    "q": "IPv4ã® /27 ã‚µãƒ–ãƒãƒƒãƒˆã§ã€ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã‚¢ãƒ‰ãƒ¬ã‚¹ã¨ãƒ–ãƒ­ãƒ¼ãƒ‰ã‚­ãƒ£ã‚¹ãƒˆã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’é™¤ã„ã¦åˆ©ç”¨ã§ãã‚‹ãƒ›ã‚¹ãƒˆã‚¢ãƒ‰ãƒ¬ã‚¹æ•°ã¯ï¼Ÿ",
    "options": [
      "32",
      "62",
      "14",
      "30"
    ],
    "a": 3,
    "exp": "/27ã§ã¯ãƒ›ã‚¹ãƒˆéƒ¨ãŒ5ãƒ“ãƒƒãƒˆãªã®ã§2^5=32ã‚¢ãƒ‰ãƒ¬ã‚¹ã‚ã‚Šã¾ã™ã€‚ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã¨ãƒ–ãƒ­ãƒ¼ãƒ‰ã‚­ãƒ£ã‚¹ãƒˆã‚’é™¤ãã¨30ã§ã™ã€‚",
    "hint": "ãƒ›ã‚¹ãƒˆéƒ¨ã®ãƒ“ãƒƒãƒˆæ•°ã¯32-27=5ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ192.168.1.130/26ã®ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã¯192.168.1.128ã§ã™ã€ã€‚/27ã§ã¯ãƒ›ã‚¹ãƒˆéƒ¨ãŒ5ãƒ“ãƒƒãƒˆãªã®ã§2^5=32ã‚¢ãƒ‰ãƒ¬ã‚¹ã‚ã‚Šã¾ã™ã€‚ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã¨ãƒ–ãƒ­ãƒ¼ãƒ‰ã‚­ãƒ£ã‚¹ãƒˆã‚’é™¤ãã¨30ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ32ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ192.168.1.130/26ã®ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã¯192.168.1.128ã§ã™ã€ã€‚/27ã§ã¯ãƒ›ã‚¹ãƒˆéƒ¨ãŒ5ãƒ“ãƒƒãƒˆãªã®ã§2^5=32ã‚¢ãƒ‰ãƒ¬ã‚¹ã‚ã‚Šã¾ã™ã€‚ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã¨ãƒ–ãƒ­ãƒ¼ãƒ‰ã‚­ãƒ£ã‚¹ãƒˆã‚’é™¤ãã¨30ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ62ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œ192.168.1.130/26ã®ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã¯192.168.1.128ã§ã™ã€ã€‚/27ã§ã¯ãƒ›ã‚¹ãƒˆéƒ¨ãŒ5ãƒ“ãƒƒãƒˆãªã®ã§2^5=32ã‚¢ãƒ‰ãƒ¬ã‚¹ã‚ã‚Šã¾ã™ã€‚ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã¨ãƒ–ãƒ­ãƒ¼ãƒ‰ã‚­ãƒ£ã‚¹ãƒˆã‚’é™¤ãã¨30ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ14ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "/27ã§ã¯ãƒ›ã‚¹ãƒˆéƒ¨ãŒ5ãƒ“ãƒƒãƒˆãªã®ã§2^5=32ã‚¢ãƒ‰ãƒ¬ã‚¹ã‚ã‚Šã¾ã™ã€‚ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã¨ãƒ–ãƒ­ãƒ¼ãƒ‰ã‚­ãƒ£ã‚¹ãƒˆã‚’é™¤ãã¨30ã§ã™ã€‚"
    ],
    "explainTopicId": "core_10_04",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "net-19",
    "cat": "ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯",
    "concept": "ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆã‚²ãƒ¼ãƒˆã‚¦ã‚§ã‚¤",
    "difficulty": "åŸºç¤Ž",
    "q": "ç«¯æœ«AãŒè‡ªåˆ†ã¨ã¯ç•°ãªã‚‹ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ä¸Šã®ã‚µãƒ¼ãƒã¸ãƒ‘ã‚±ãƒƒãƒˆã‚’é€ã‚ŠãŸã„ã€‚å®›å…ˆãŒåŒä¸€ã‚µãƒ–ãƒãƒƒãƒˆå¤–ã®ã¨ãã€é€šå¸¸ã¾ãšè»¢é€å…ˆã¨ã—ã¦ä½¿ã†ã‚‚ã®ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆã‚²ãƒ¼ãƒˆã‚¦ã‚§ã‚¤",
      "ãƒ–ãƒ­ãƒ¼ãƒ‰ã‚­ãƒ£ã‚¹ãƒˆã‚¢ãƒ‰ãƒ¬ã‚¹",
      "DNSã‚­ãƒ£ãƒƒã‚·ãƒ¥",
      "ãƒ«ãƒ¼ãƒ—ãƒãƒƒã‚¯ã‚¢ãƒ‰ãƒ¬ã‚¹"
    ],
    "a": 0,
    "exp": "å®›å…ˆãŒåŒä¸€ã‚µãƒ–ãƒãƒƒãƒˆå¤–ãªã‚‰ã€ç«¯æœ«ã¯é€šå¸¸ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆã‚²ãƒ¼ãƒˆã‚¦ã‚§ã‚¤ã§ã‚ã‚‹ãƒ«ãƒ¼ã‚¿ã¸ãƒ‘ã‚±ãƒƒãƒˆã‚’é€ã‚Šã¾ã™ã€‚",
    "hint": "å¤–éƒ¨ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã¸å‡ºã‚‹ã€Žå‡ºå£ã€ã‚’è€ƒãˆã¾ã™ã€‚",
    "choiceExps": [
      "å®›å…ˆãŒåŒä¸€ã‚µãƒ–ãƒãƒƒãƒˆå¤–ãªã‚‰ã€ç«¯æœ«ã¯é€šå¸¸ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆã‚²ãƒ¼ãƒˆã‚¦ã‚§ã‚¤ã§ã‚ã‚‹ãƒ«ãƒ¼ã‚¿ã¸ãƒ‘ã‚±ãƒƒãƒˆã‚’é€ã‚Šã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå¤–éƒ¨ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã¸å‡ºã‚‹ã€Žå‡ºå£ã€ã‚’è€ƒãˆã¾ã™ã€ã€‚å®›å…ˆãŒåŒä¸€ã‚µãƒ–ãƒãƒƒãƒˆå¤–ãªã‚‰ã€ç«¯æœ«ã¯é€šå¸¸ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆã‚²ãƒ¼ãƒˆã‚¦ã‚§ã‚¤ã§ã‚ã‚‹ãƒ«ãƒ¼ã‚¿ã¸ãƒ‘ã‚±ãƒƒãƒˆã‚’é€ã‚Šã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒ–ãƒ­ãƒ¼ãƒ‰ã‚­ãƒ£ã‚¹ãƒˆã‚¢ãƒ‰ãƒ¬ã‚¹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€ŒDNSã€ã¯ã€ãƒ‰ãƒ¡ã‚¤ãƒ³åã¨IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å¯¾å¿œä»˜ã‘ã‚‹ä»•çµ„ã¿ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå¤–éƒ¨ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã¸å‡ºã‚‹ã€Žå‡ºå£ã€ã‚’è€ƒãˆã¾ã™ã€ã€‚å®›å…ˆãŒåŒä¸€ã‚µãƒ–ãƒãƒƒãƒˆå¤–ãªã‚‰ã€ç«¯æœ«ã¯é€šå¸¸ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆã‚²ãƒ¼ãƒˆã‚¦ã‚§ã‚¤ã§ã‚ã‚‹ãƒ«ãƒ¼ã‚¿ã¸ãƒ‘ã‚±ãƒƒãƒˆã‚’é€ã‚Šã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒ«ãƒ¼ãƒ—ãƒãƒƒã‚¯ã‚¢ãƒ‰ãƒ¬ã‚¹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_10_04",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "net-20",
    "cat": "ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯",
    "concept": "NAPT",
    "difficulty": "æ¨™æº–",
    "q": "è¤‡æ•°ã®ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆIPç«¯æœ«ãŒã€ãƒãƒ¼ãƒˆç•ªå·ã‚‚åˆ©ç”¨ã—ã¦1ã¤ã®ã‚°ãƒ­ãƒ¼ãƒãƒ«IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å…±æœ‰ã™ã‚‹ä»•çµ„ã¿ã¯ï¼Ÿ",
    "options": [
      "ARP",
      "NAPT",
      "DNSãƒ©ã‚¦ãƒ³ãƒ‰ãƒ­ãƒ“ãƒ³",
      "VLAN"
    ],
    "a": 1,
    "exp": "NAPTã¯IPã‚¢ãƒ‰ãƒ¬ã‚¹ã ã‘ã§ãªããƒãƒ¼ãƒˆç•ªå·ã‚‚å¤‰æ›ã—ã€è¤‡æ•°ç«¯æœ«ã®é€šä¿¡ã‚’1ã¤ã®ã‚°ãƒ­ãƒ¼ãƒãƒ«IPã§è­˜åˆ¥ã—ã¾ã™ã€‚",
    "hint": "NATã«ãƒãƒ¼ãƒˆç•ªå·ã®å¤‰æ›ã‚‚çµ„ã¿åˆã‚ã›ã‚‹ä»•çµ„ã¿ã§ã™ã€‚",
    "choiceExps": [
      "ã€ŒNAPTã€ã¯IPã‚¢ãƒ‰ãƒ¬ã‚¹ã«åŠ ãˆã¦ãƒãƒ¼ãƒˆç•ªå·ã‚‚ä½¿ã„ã€å¤šæ•°ç«¯æœ«ã‚’1ã¤ã®ã‚°ãƒ­ãƒ¼ãƒãƒ«IPã¸å¯¾å¿œã€‚ä¸€æ–¹ã€ŒARã€ã¯ç¾å®Ÿã®æ˜ åƒãƒ»ç©ºé–“ã¸ãƒ‡ã‚¸ã‚¿ãƒ«æƒ…å ±ã‚’é‡ã­ã‚‹ã€‚ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹ã®ã¯å‰è€…ã§ã‚ã‚‹ã€‚",
      "NAPTã¯IPã‚¢ãƒ‰ãƒ¬ã‚¹ã ã‘ã§ãªããƒãƒ¼ãƒˆç•ªå·ã‚‚å¤‰æ›ã—ã€è¤‡æ•°ç«¯æœ«ã®é€šä¿¡ã‚’1ã¤ã®ã‚°ãƒ­ãƒ¼ãƒãƒ«IPã§è­˜åˆ¥ã—ã¾ã™ã€‚",
      "ã€ŒDNSã€ã¯ã€ãƒ‰ãƒ¡ã‚¤ãƒ³åã¨IPã‚¢ãƒ‰ãƒ¬ã‚¹ã‚’å¯¾å¿œä»˜ã‘ã‚‹ä»•çµ„ã¿ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒNAPTï¼šIPã‚¢ãƒ‰ãƒ¬ã‚¹ã«åŠ ãˆã¦ãƒãƒ¼ãƒˆç•ªå·ã‚‚ä½¿ã„ã€å¤šæ•°ç«¯æœ«ã‚’1ã¤ã®ã‚°ãƒ­ãƒ¼ãƒãƒ«IPã¸å¯¾å¿œã€ã€‚NAPTã¯IPã‚¢ãƒ‰ãƒ¬ã‚¹ã ã‘ã§ãªããƒãƒ¼ãƒˆç•ªå·ã‚‚å¤‰æ›ã—ã€è¤‡æ•°ç«¯æœ«ã®é€šä¿¡ã‚’1ã¤ã®ã‚°ãƒ­ãƒ¼ãƒãƒ«IPã§è­˜åˆ¥ã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒVLANã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_10_05",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "sec-08",
    "cat": "ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£",
    "concept": "æ©Ÿå¯†æ€§",
    "difficulty": "åŸºç¤Ž",
    "q": "æƒ…å ±ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£ã®æ©Ÿå¯†æ€§ï¼ˆConfidentialityï¼‰ãŒä¸»ã«å®ˆã‚ã†ã¨ã™ã‚‹ã‚‚ã®ã¯ï¼Ÿ",
    "options": [
      "å¿…è¦ãªã¨ãã«æƒ…å ±ã‚„ã‚·ã‚¹ãƒ†ãƒ ã‚’åˆ©ç”¨ã§ãã‚‹ã“ã¨",
      "æƒ…å ±ãŒä¸æ­£ã«å¤‰æ›´ãƒ»ç ´å£Šã•ã‚Œã¦ã„ãªã„ã“ã¨",
      "æ¨©é™ã®ãªã„è€…ã«æƒ…å ±ã‚’è¦‹ã‚‰ã‚Œãªã„ã“ã¨",
      "åˆ©ç”¨è€…ã‚„é€šä¿¡ç›¸æ‰‹ãŒæœ¬äººã§ã‚ã‚‹ã“ã¨ã‚’ç¢ºèªã§ãã‚‹ã“ã¨"
    ],
    "a": 2,
    "exp": "æ©Ÿå¯†æ€§ã¯ã€è¨±å¯ã•ã‚ŒãŸè€…ã ã‘ãŒæƒ…å ±ã¸ã‚¢ã‚¯ã‚»ã‚¹ã§ãã‚‹çŠ¶æ…‹ã‚’å®ˆã‚‹æ€§è³ªã§ã™ã€‚",
    "hint": "CIAã®Cã¯ã€Žç§˜å¯†ã‚’å®ˆã‚‹ã€è¦³ç‚¹ã§ã™ã€‚",
    "choiceExps": [
      "ã“ã‚Œã¯å¯ç”¨æ€§ï¼ˆAvailabilityï¼‰ã®èª¬æ˜Žã§ã‚ã‚Šã€æ©Ÿå¯†æ€§ã§ã¯ãªã„ã€‚",
      "ã“ã‚Œã¯å®Œå…¨æ€§ï¼ˆIntegrityï¼‰ã®èª¬æ˜Žã§ã‚ã‚Šã€æ©Ÿå¯†æ€§ã§ã¯ãªã„ã€‚",
      "æ©Ÿå¯†æ€§ã¯ã€è¨±å¯ã•ã‚ŒãŸè€…ã ã‘ãŒæƒ…å ±ã¸ã‚¢ã‚¯ã‚»ã‚¹ã§ãã‚‹çŠ¶æ…‹ã‚’å®ˆã‚‹æ€§è³ªã§ã™ã€‚",
      "ã“ã‚Œã¯çœŸæ­£æ€§ãƒ»èªè¨¼ã«é–¢ã™ã‚‹èª¬æ˜Žã§ã‚ã‚Šã€æ©Ÿå¯†æ€§ãã®ã‚‚ã®ã§ã¯ãªã„ã€‚"
    ],
    "explainTopicId": "core_11_01",
    "explainTopicSource": "semantic",
    "qualityOverride": "v78-plausible-distractors",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "åŽŸå‰‡ãƒ»é–¢ä¿‚"
  },
  {
    "id": "sec-09",
    "cat": "ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£",
    "concept": "å®Œå…¨æ€§",
    "difficulty": "åŸºç¤Ž",
    "q": "æƒ…å ±ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£ã®å®Œå…¨æ€§ï¼ˆIntegrityï¼‰ã®èª¬æ˜Žã¨ã—ã¦æœ€ã‚‚é©åˆ‡ãªã®ã¯ï¼Ÿ",
    "options": [
      "å¿…è¦ãªã¨ãã«æƒ…å ±ã‚„ã‚·ã‚¹ãƒ†ãƒ ã‚’åˆ©ç”¨ã§ãã‚‹ã“ã¨",
      "æ¨©é™ã®ãªã„è€…ã«æƒ…å ±ã‚’è¦‹ã‚‰ã‚Œãªã„ã“ã¨",
      "åˆ©ç”¨è€…ã‚„é€šä¿¡ç›¸æ‰‹ãŒæœ¬äººã§ã‚ã‚‹ã“ã¨ã‚’ç¢ºèªã§ãã‚‹ã“ã¨",
      "æƒ…å ±ãŒä¸æ­£ã«å¤‰æ›´ãƒ»ç ´å£Šã•ã‚Œã¦ã„ãªã„ã“ã¨"
    ],
    "a": 3,
    "exp": "å®Œå…¨æ€§ã¯ã€æƒ…å ±ãŒæ­£ç¢ºã§å®Œå…¨ãªçŠ¶æ…‹ã«ä¿ãŸã‚Œã€ä¸æ­£ã«å¤‰æ›´ã•ã‚Œã¦ã„ãªã„ã“ã¨ã‚’æŒ‡ã—ã¾ã™ã€‚",
    "hint": "CIAã®Iã¯ã€Žå†…å®¹ãŒæ­£ã—ã„ã¾ã¾ã‹ã€ã¨ã„ã†è¦³ç‚¹ã§ã™ã€‚",
    "choiceExps": [
      "ã“ã‚Œã¯å¯ç”¨æ€§ï¼ˆAvailabilityï¼‰ã®èª¬æ˜Žã§ã‚ã‚Šã€å®Œå…¨æ€§ã§ã¯ãªã„ã€‚",
      "ã“ã‚Œã¯æ©Ÿå¯†æ€§ï¼ˆConfidentialityï¼‰ã®èª¬æ˜Žã§ã‚ã‚Šã€å®Œå…¨æ€§ã§ã¯ãªã„ã€‚",
      "ã“ã‚Œã¯çœŸæ­£æ€§ãƒ»èªè¨¼ã«é–¢ã™ã‚‹èª¬æ˜Žã§ã‚ã‚Šã€å®Œå…¨æ€§ãã®ã‚‚ã®ã§ã¯ãªã„ã€‚",
      "å®Œå…¨æ€§ã¯ã€æƒ…å ±ãŒæ­£ç¢ºã§å®Œå…¨ãªçŠ¶æ…‹ã«ä¿ãŸã‚Œã€ä¸æ­£ã«å¤‰æ›´ã•ã‚Œã¦ã„ãªã„ã“ã¨ã‚’æŒ‡ã—ã¾ã™ã€‚"
    ],
    "explainTopicId": "core_11_01",
    "explainTopicSource": "semantic",
    "qualityOverride": "v78-plausible-distractors",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "åŽŸå‰‡ãƒ»é–¢ä¿‚"
  },
  {
    "id": "sec-10",
    "cat": "ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£",
    "concept": "å¯ç”¨æ€§",
    "difficulty": "åŸºç¤Ž",
    "q": "æƒ…å ±ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£ã®å¯ç”¨æ€§ï¼ˆAvailabilityï¼‰ã®èª¬æ˜Žã¨ã—ã¦æœ€ã‚‚é©åˆ‡ãªã®ã¯ï¼Ÿ",
    "options": [
      "å¿…è¦ãªã¨ãã«æƒ…å ±ã‚„ã‚·ã‚¹ãƒ†ãƒ ã‚’åˆ©ç”¨ã§ãã‚‹ã“ã¨",
      "æ¨©é™ã®ãªã„è€…ã«æƒ…å ±ã‚’è¦‹ã‚‰ã‚Œãªã„ã“ã¨",
      "æƒ…å ±ãŒä¸æ­£ã«å¤‰æ›´ãƒ»ç ´å£Šã•ã‚Œã¦ã„ãªã„ã“ã¨",
      "åˆ©ç”¨è€…ã‚„é€šä¿¡ç›¸æ‰‹ãŒæœ¬äººã§ã‚ã‚‹ã“ã¨ã‚’ç¢ºèªã§ãã‚‹ã“ã¨"
    ],
    "a": 0,
    "exp": "å¯ç”¨æ€§ã¯ã€è¨±å¯ã•ã‚ŒãŸåˆ©ç”¨è€…ãŒå¿…è¦ãªã¨ãã«æƒ…å ±ã‚„ã‚µãƒ¼ãƒ“ã‚¹ã‚’åˆ©ç”¨ã§ãã‚‹çŠ¶æ…‹ã‚’ä¿ã¤ã“ã¨ã§ã™ã€‚",
    "hint": "CIAã®Aã¯ã€Žä½¿ã„ãŸã„ã¨ãã«ä½¿ãˆã‚‹ã‹ã€ã§ã™ã€‚",
    "choiceExps": [
      "å¯ç”¨æ€§ã¯ã€è¨±å¯ã•ã‚ŒãŸåˆ©ç”¨è€…ãŒå¿…è¦ãªã¨ãã«æƒ…å ±ã‚„ã‚µãƒ¼ãƒ“ã‚¹ã‚’åˆ©ç”¨ã§ãã‚‹çŠ¶æ…‹ã‚’ä¿ã¤ã“ã¨ã§ã™ã€‚",
      "ã“ã‚Œã¯æ©Ÿå¯†æ€§ï¼ˆConfidentialityï¼‰ã®èª¬æ˜Žã§ã‚ã‚Šã€å¯ç”¨æ€§ã§ã¯ãªã„ã€‚",
      "ã“ã‚Œã¯å®Œå…¨æ€§ï¼ˆIntegrityï¼‰ã®èª¬æ˜Žã§ã‚ã‚Šã€å¯ç”¨æ€§ã§ã¯ãªã„ã€‚",
      "ã“ã‚Œã¯çœŸæ­£æ€§ãƒ»èªè¨¼ã«é–¢ã™ã‚‹èª¬æ˜Žã§ã‚ã‚Šã€å¯ç”¨æ€§ãã®ã‚‚ã®ã§ã¯ãªã„ã€‚"
    ],
    "explainTopicId": "core_11_01",
    "explainTopicSource": "semantic",
    "qualityOverride": "v78-plausible-distractors",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "åŽŸå‰‡ãƒ»é–¢ä¿‚"
  },
  {
    "id": "sec-11",
    "cat": "ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£",
    "concept": "ãƒ•ã‚£ãƒƒã‚·ãƒ³ã‚°",
    "difficulty": "åŸºç¤Ž",
    "q": "åˆ©ç”¨è€…ã¸å®Ÿåœ¨ã‚µãƒ¼ãƒ“ã‚¹ã‚’è£…ã£ãŸãƒ¡ãƒ¼ãƒ«ã‚’é€ã‚Šã€å½ã®ãƒ­ã‚°ã‚¤ãƒ³ç”»é¢ã¸èª˜å°Žã—ã¦IDã¨ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰ã‚’å…¥åŠ›ã•ã›ã‚‹æ”»æ’ƒã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ãƒ–ãƒ«ãƒ¼ãƒˆãƒ•ã‚©ãƒ¼ã‚¹æ”»æ’ƒ",
      "ãƒ•ã‚£ãƒƒã‚·ãƒ³ã‚°",
      "SQLã‚¤ãƒ³ã‚¸ã‚§ã‚¯ã‚·ãƒ§ãƒ³",
      "DoSæ”»æ’ƒ"
    ],
    "a": 1,
    "exp": "å®Ÿåœ¨ã™ã‚‹çµ„ç¹”ãªã©ã‚’è£…ã£ã¦åˆ©ç”¨è€…ã‚’å½ã‚µã‚¤ãƒˆã¸èª˜å°Žã—ã€èªè¨¼æƒ…å ±ã‚’ç›—ã‚€æ‰‹å£ã‚’ãƒ•ã‚£ãƒƒã‚·ãƒ³ã‚°ã¨ã„ã„ã¾ã™ã€‚",
    "hint": "åˆ©ç”¨è€…ã‚’ã ã¾ã—ã¦å½ã‚µã‚¤ãƒˆã¸èª˜å°Žã™ã‚‹æ”»æ’ƒã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå½ã‚µã‚¤ãƒˆã¸èª˜å°Žã—èªè¨¼æƒ…å ±ã‚’å…¥åŠ›ã•ã›ã‚‹ã®ã¯ãƒ•ã‚£ãƒƒã‚·ãƒ³ã‚°ã®ä¾‹ã§ã™ã€ã€‚å®Ÿåœ¨ã™ã‚‹çµ„ç¹”ãªã©ã‚’è£…ã£ã¦åˆ©ç”¨è€…ã‚’å½ã‚µã‚¤ãƒˆã¸èª˜å°Žã—ã€èªè¨¼æƒ…å ±ã‚’ç›—ã‚€æ‰‹å£ã‚’ãƒ•ã‚£ãƒƒã‚·ãƒ³ã‚°ã¨ã„ã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒ–ãƒ«ãƒ¼ãƒˆãƒ•ã‚©ãƒ¼ã‚¹æ”»æ’ƒã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "å®Ÿåœ¨ã™ã‚‹çµ„ç¹”ãªã©ã‚’è£…ã£ã¦åˆ©ç”¨è€…ã‚’å½ã‚µã‚¤ãƒˆã¸èª˜å°Žã—ã€èªè¨¼æƒ…å ±ã‚’ç›—ã‚€æ‰‹å£ã‚’ãƒ•ã‚£ãƒƒã‚·ãƒ³ã‚°ã¨ã„ã„ã¾ã™ã€‚",
      "ã€ŒSQLã€ã¯ã€é–¢ä¿‚ãƒ‡ãƒ¼ã‚¿ãƒ™ãƒ¼ã‚¹ã¸æ¤œç´¢ãƒ»è¿½åŠ ãƒ»æ›´æ–°ãƒ»å‰Šé™¤ãªã©ã‚’æŒ‡ç¤ºã™ã‚‹ãŸã‚ã®è¨€èªžã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå½ã‚µã‚¤ãƒˆã¸èª˜å°Žã—èªè¨¼æƒ…å ±ã‚’å…¥åŠ›ã•ã›ã‚‹ã®ã¯ãƒ•ã‚£ãƒƒã‚·ãƒ³ã‚°ã®ä¾‹ã§ã™ã€ã€‚å®Ÿåœ¨ã™ã‚‹çµ„ç¹”ãªã©ã‚’è£…ã£ã¦åˆ©ç”¨è€…ã‚’å½ã‚µã‚¤ãƒˆã¸èª˜å°Žã—ã€èªè¨¼æƒ…å ±ã‚’ç›—ã‚€æ‰‹å£ã‚’ãƒ•ã‚£ãƒƒã‚·ãƒ³ã‚°ã¨ã„ã„ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒDoSæ”»æ’ƒã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_11_01",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "sec-12",
    "cat": "ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£",
    "concept": "SQLã‚¤ãƒ³ã‚¸ã‚§ã‚¯ã‚·ãƒ§ãƒ³",
    "difficulty": "æ¨™æº–",
    "q": "Webã‚¢ãƒ—ãƒªã®SQLã‚¤ãƒ³ã‚¸ã‚§ã‚¯ã‚·ãƒ§ãƒ³å¯¾ç­–ã¨ã—ã¦ç‰¹ã«æœ‰åŠ¹ãªã®ã¯ï¼Ÿ",
    "options": [
      "å‡ºåŠ›æ™‚ã«HTMLç‰¹æ®Šæ–‡å­—ã‚’ã‚¨ã‚¹ã‚±ãƒ¼ãƒ—ã™ã‚‹",
      "CSRFãƒˆãƒ¼ã‚¯ãƒ³ã‚’æ¤œè¨¼ã™ã‚‹",
      "ãƒ—ãƒ¬ãƒ¼ã‚¹ãƒ›ãƒ«ãƒ€ã‚’ä½¿ã£ãŸãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿åŒ–ã‚¯ã‚¨ãƒª",
      "ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰ã¸ã‚½ãƒ«ãƒˆã‚’ä»˜ã‘ã¦ãƒãƒƒã‚·ãƒ¥åŒ–ã™ã‚‹"
    ],
    "a": 2,
    "exp": "ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿åŒ–ã‚¯ã‚¨ãƒªã§ã¯å…¥åŠ›å€¤ã¨SQLæ§‹æ–‡ã‚’åˆ†é›¢ã§ãã‚‹ãŸã‚ã€å…¥åŠ›ã‚’SQLå‘½ä»¤ã¨ã—ã¦è§£é‡ˆã•ã‚Œã«ããã§ãã¾ã™ã€‚",
    "hint": "å…¥åŠ›å€¤ã‚’SQLæ–‡ã®æ–‡å­—åˆ—é€£çµã§çµ„ã¿ç«‹ã¦ãªã„æ–¹æ³•ã‚’é¸ã³ã¾ã™ã€‚",
    "choiceExps": [
      "HTMLã‚¨ã‚¹ã‚±ãƒ¼ãƒ—ã¯ä¸»ã«XSSå¯¾ç­–ã€‚SQLæ–‡ã®æ§‹é€ ã¨å€¤ã‚’åˆ†é›¢ã™ã‚‹å¯¾ç­–ã§ã¯ãªã„ã€‚",
      "CSRFãƒˆãƒ¼ã‚¯ãƒ³ã¯ä¸»ã«ã€åˆ©ç”¨è€…ã®æ„å›³ã—ãªã„ãƒªã‚¯ã‚¨ã‚¹ãƒˆé€ä¿¡ã‚’é˜²ããŸã‚ã®å¯¾ç­–ã€‚",
      "ãƒ‘ãƒ©ãƒ¡ãƒ¼ã‚¿åŒ–ã‚¯ã‚¨ãƒªã§ã¯å…¥åŠ›å€¤ã¨SQLæ§‹æ–‡ã‚’åˆ†é›¢ã§ãã‚‹ãŸã‚ã€å…¥åŠ›ã‚’SQLå‘½ä»¤ã¨ã—ã¦è§£é‡ˆã•ã‚Œã«ããã§ãã¾ã™ã€‚",
      "ã‚½ãƒ«ãƒˆä»˜ããƒãƒƒã‚·ãƒ¥ã¯ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰ä¿å­˜ã‚’å¼·åŒ–ã™ã‚‹å¯¾ç­–ã§ã‚ã‚Šã€SQLã‚¤ãƒ³ã‚¸ã‚§ã‚¯ã‚·ãƒ§ãƒ³å¯¾ç­–ãã®ã‚‚ã®ã§ã¯ãªã„ã€‚"
    ],
    "explainTopicId": "core_11_08",
    "explainTopicSource": "manual",
    "qualityOverride": "v89-near-domain-distractors",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "è¦å‰‡é©ç”¨"
  },
  {
    "id": "sec-13",
    "cat": "ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£",
    "concept": "XSS",
    "difficulty": "æ¨™æº–",
    "q": "æŽ²ç¤ºæ¿ã«æŠ•ç¨¿ã•ã‚ŒãŸæ–‡å­—åˆ—ã‚’HTMLã¸è¡¨ç¤ºã™ã‚‹Webã‚¢ãƒ—ãƒªã§ã€XSSå¯¾ç­–ã¨ã—ã¦åŸºæœ¬ã¨ãªã‚‹å‡¦ç†ã¯ï¼Ÿ",
    "options": [
      "SQLæ–‡ã‚’çµ„ã¿ç«‹ã¦ã‚‹ã¨ããƒ—ãƒ¬ãƒ¼ã‚¹ãƒ›ãƒ«ãƒ€ã‚’ä½¿ç”¨ã™ã‚‹",
      "çŠ¶æ…‹ã‚’å¤‰æ›´ã™ã‚‹è¦æ±‚ã§CSRFãƒˆãƒ¼ã‚¯ãƒ³ã‚’æ¤œè¨¼ã™ã‚‹",
      "ä¿å­˜ã™ã‚‹ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰ã‚’ã‚½ãƒ«ãƒˆä»˜ããƒãƒƒã‚·ãƒ¥ã§ä¿è­·ã™ã‚‹",
      "å‡ºåŠ›æ™‚ã«HTMLã¨ã—ã¦ç‰¹åˆ¥ãªæ„å‘³ã‚’æŒã¤æ–‡å­—ã‚’é©åˆ‡ã«ã‚¨ã‚¹ã‚±ãƒ¼ãƒ—ã™ã‚‹"
    ],
    "a": 3,
    "exp": "XSSã§ã¯æ”»æ’ƒè€…ã®å…¥åŠ›ãŒHTMLã‚„JavaScriptã¨ã—ã¦è§£é‡ˆã•ã‚Œã‚‹ã“ã¨ã‚’é˜²ããŸã‚ã€å‡ºåŠ›æ™‚ã®é©åˆ‡ãªã‚¨ã‚¹ã‚±ãƒ¼ãƒ—ãŒåŸºæœ¬ã§ã™ã€‚",
    "hint": "æŠ•ç¨¿å†…å®¹ã‚’ã€Žãƒ—ãƒ­ã‚°ãƒ©ãƒ ã€ã§ã¯ãªãã€Žæ–‡å­—åˆ—ã€ã¨ã—ã¦è¡¨ç¤ºã•ã›ã¾ã™ã€‚",
    "choiceExps": [
      "ãƒ—ãƒ¬ãƒ¼ã‚¹ãƒ›ãƒ«ãƒ€ã¯ä¸»ã«SQLã‚¤ãƒ³ã‚¸ã‚§ã‚¯ã‚·ãƒ§ãƒ³å¯¾ç­–ã§ã‚ã‚Šã€HTMLå‡ºåŠ›æ™‚ã®XSSå¯¾ç­–ã¨ã¯ç›®çš„ãŒç•°ãªã‚‹ã€‚",
      "CSRFãƒˆãƒ¼ã‚¯ãƒ³ã¯ä¸»ã«CSRFå¯¾ç­–ã§ã‚ã‚Šã€æŠ•ç¨¿æ–‡å­—åˆ—ã‚’HTMLã¸å®‰å…¨ã«å‡ºåŠ›ã™ã‚‹å‡¦ç†ã§ã¯ãªã„ã€‚",
      "ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰ã®ãƒãƒƒã‚·ãƒ¥åŒ–ã¯èªè¨¼æƒ…å ±ã®æ¼ãˆã„å¯¾ç­–ã§ã‚ã‚Šã€XSSã®ã‚¹ã‚¯ãƒªãƒ—ãƒˆå®Ÿè¡Œã‚’é˜²ãå‡¦ç†ã§ã¯ãªã„ã€‚",
      "XSSã§ã¯æ”»æ’ƒè€…ã®å…¥åŠ›ãŒHTMLã‚„JavaScriptã¨ã—ã¦è§£é‡ˆã•ã‚Œã‚‹ã“ã¨ã‚’é˜²ããŸã‚ã€å‡ºåŠ›æ™‚ã®é©åˆ‡ãªã‚¨ã‚¹ã‚±ãƒ¼ãƒ—ãŒåŸºæœ¬ã§ã™ã€‚"
    ],
    "explainTopicId": "core_11_08",
    "explainTopicSource": "manual",
    "qualityOverride": "v78-plausible-distractors",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "å½¹å‰²é¸æŠž"
  },
  {
    "id": "sec-14",
    "cat": "ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£",
    "concept": "CSRF",
    "difficulty": "æ¨™æº–",
    "q": "ãƒ­ã‚°ã‚¤ãƒ³æ¸ˆã¿åˆ©ç”¨è€…ã®ãƒ–ãƒ©ã‚¦ã‚¶ã‚’æ‚ªç”¨ã—ã¦æ„å›³ã—ãªã„æ“ä½œã‚’é€ä¿¡ã•ã›ã‚‹CSRFã¸ã®å¯¾ç­–ã¨ã—ã¦é©åˆ‡ãªã®ã¯ï¼Ÿ",
    "options": [
      "æŽ¨æ¸¬å›°é›£ãªCSRFãƒˆãƒ¼ã‚¯ãƒ³ã‚’è¦æ±‚ã—æ¤œè¨¼ã™ã‚‹",
      "HTMLå‡ºåŠ›æ™‚ã«ç‰¹æ®Šæ–‡å­—ã‚’ã‚¨ã‚¹ã‚±ãƒ¼ãƒ—ã™ã‚‹",
      "SQLå®Ÿè¡Œæ™‚ã«ãƒ—ãƒ¬ãƒ¼ã‚¹ãƒ›ãƒ«ãƒ€ã‚’ä½¿ç”¨ã™ã‚‹",
      "Content-Security-Policyã§ã‚¹ã‚¯ãƒªãƒ—ãƒˆå®Ÿè¡Œå…ƒã‚’åˆ¶é™ã™ã‚‹"
    ],
    "a": 0,
    "exp": "CSRFãƒˆãƒ¼ã‚¯ãƒ³ã‚’ãƒ•ã‚©ãƒ¼ãƒ ãªã©ã«å«ã‚ã€ã‚µãƒ¼ãƒå´ã§æ­£å½“ãªç”»é¢ã‹ã‚‰ã®è¦æ±‚ã‹æ¤œè¨¼ã™ã‚‹ã“ã¨ã§æ”»æ’ƒã‚’é˜²ãŽã‚„ã™ããªã‚Šã¾ã™ã€‚",
    "hint": "æ”»æ’ƒè€…ãŒç”¨æ„ã—ãŸå¤–éƒ¨ãƒšãƒ¼ã‚¸ã‹ã‚‰ã¯ä½œã‚Šã«ãã„å€¤ã‚’è¦æ±‚ã—ã¾ã™ã€‚",
    "choiceExps": [
      "CSRFãƒˆãƒ¼ã‚¯ãƒ³ã‚’ãƒ•ã‚©ãƒ¼ãƒ ãªã©ã«å«ã‚ã€ã‚µãƒ¼ãƒå´ã§æ­£å½“ãªç”»é¢ã‹ã‚‰ã®è¦æ±‚ã‹æ¤œè¨¼ã™ã‚‹ã“ã¨ã§æ”»æ’ƒã‚’é˜²ãŽã‚„ã™ããªã‚Šã¾ã™ã€‚",
      "HTMLã‚¨ã‚¹ã‚±ãƒ¼ãƒ—ã¯ä¸»ã«XSSå¯¾ç­–ã§ã‚ã‚Šã€æ­£è¦åˆ©ç”¨è€…ã®ãƒ–ãƒ©ã‚¦ã‚¶ã‹ã‚‰é€ã‚‰ã‚Œã‚‹ä¸æ­£ãªè¦æ±‚ãã®ã‚‚ã®ã‚’è­˜åˆ¥ã™ã‚‹æ–¹æ³•ã§ã¯ãªã„ã€‚",
      "ãƒ—ãƒ¬ãƒ¼ã‚¹ãƒ›ãƒ«ãƒ€ã¯SQLã‚¤ãƒ³ã‚¸ã‚§ã‚¯ã‚·ãƒ§ãƒ³å¯¾ç­–ã§ã‚ã‚Šã€CSRFå¯¾ç­–ã¨ã¯ç•°ãªã‚‹ã€‚",
      "Content-Security-Policyã¯ä¸»ã«XSSãªã©ã®ã‚¹ã‚¯ãƒªãƒ—ãƒˆå®Ÿè¡Œè¢«å®³ã‚’æŠ‘ãˆã‚‹ãŸã‚ã®ä»•çµ„ã¿ã§ã‚ã‚Šã€CSRFã®è¦æ±‚æ­£å½“æ€§ç¢ºèªãã®ã‚‚ã®ã§ã¯ãªã„ã€‚"
    ],
    "explainTopicId": "core_11_08",
    "explainTopicSource": "manual",
    "qualityOverride": "v78-plausible-distractors",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-pass",
    "applicationDemand": "å½¹å‰²é¸æŠž"
  },
  {
    "id": "sec-15",
    "cat": "ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£",
    "concept": "æœ€å°æ¨©é™",
    "difficulty": "åŸºç¤Ž",
    "q": "åˆ©ç”¨è€…ã‚„ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã¸ã€æ¥­å‹™ã«å¿…è¦ãªç¯„å›²ã ã‘ã®æ¨©é™ã‚’ä¸Žãˆã‚‹è€ƒãˆæ–¹ã¯ï¼Ÿ",
    "options": [
      "å¯ç”¨æ€§æœ€å¤§åŒ–ã®åŽŸå‰‡",
      "æœ€å°æ¨©é™ã®åŽŸå‰‡",
      "è·å‹™åˆ†æŽŒã®ç¦æ­¢",
      "å®Œå…¨å…¬é–‹ã®åŽŸå‰‡"
    ],
    "a": 1,
    "exp": "æœ€å°æ¨©é™ã®åŽŸå‰‡ã§ã¯ã€å¿…è¦ä»¥ä¸Šã®ã‚¢ã‚¯ã‚»ã‚¹æ¨©ã‚’ä¸Žãˆãšã€ä¾µå®³æ™‚ã®å½±éŸ¿ç¯„å›²ã‚‚æŠ‘ãˆã¾ã™ã€‚",
    "hint": "ã€Žå¿…è¦ãªã‚‚ã®ã ã‘è¨±å¯ã™ã‚‹ã€è€ƒãˆæ–¹ã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œæœ€å°æ¨©é™ã§ã‚¢ã‚¯ã‚»ã‚¹åˆ¶å¾¡ã€ã€‚æœ€å°æ¨©é™ã®åŽŸå‰‡ã§ã¯ã€å¿…è¦ä»¥ä¸Šã®ã‚¢ã‚¯ã‚»ã‚¹æ¨©ã‚’ä¸Žãˆãšã€ä¾µå®³æ™‚ã®å½±éŸ¿ç¯„å›²ã‚‚æŠ‘ãˆã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå¯ç”¨æ€§æœ€å¤§åŒ–ã®åŽŸå‰‡ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "æœ€å°æ¨©é™ã®åŽŸå‰‡ã§ã¯ã€å¿…è¦ä»¥ä¸Šã®ã‚¢ã‚¯ã‚»ã‚¹æ¨©ã‚’ä¸Žãˆãšã€ä¾µå®³æ™‚ã®å½±éŸ¿ç¯„å›²ã‚‚æŠ‘ãˆã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œæœ€å°æ¨©é™ã§ã‚¢ã‚¯ã‚»ã‚¹åˆ¶å¾¡ã€ã€‚æœ€å°æ¨©é™ã®åŽŸå‰‡ã§ã¯ã€å¿…è¦ä»¥ä¸Šã®ã‚¢ã‚¯ã‚»ã‚¹æ¨©ã‚’ä¸Žãˆãšã€ä¾µå®³æ™‚ã®å½±éŸ¿ç¯„å›²ã‚‚æŠ‘ãˆã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œè·å‹™åˆ†æŽŒã®ç¦æ­¢ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œæœ€å°æ¨©é™ã§ã‚¢ã‚¯ã‚»ã‚¹åˆ¶å¾¡ã€ã€‚æœ€å°æ¨©é™ã®åŽŸå‰‡ã§ã¯ã€å¿…è¦ä»¥ä¸Šã®ã‚¢ã‚¯ã‚»ã‚¹æ¨©ã‚’ä¸Žãˆãšã€ä¾µå®³æ™‚ã®å½±éŸ¿ç¯„å›²ã‚‚æŠ‘ãˆã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå®Œå…¨å…¬é–‹ã®åŽŸå‰‡ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_11_06",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "åŽŸå‰‡ãƒ»é–¢ä¿‚"
  },
  {
    "id": "sec-16",
    "cat": "ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£",
    "concept": "ãƒ‡ã‚¸ã‚¿ãƒ«è¨¼æ˜Žæ›¸",
    "difficulty": "æ¨™æº–",
    "q": "ãƒ–ãƒ©ã‚¦ã‚¶ãŒWebã‚µãƒ¼ãƒã®å…¬é–‹éµã¨ãã®ã‚µãƒ¼ãƒã®èº«å…ƒã¨ã®å¯¾å¿œã‚’ç¢ºèªã§ãã‚‹ã‚ˆã†ã«ã™ã‚‹ãŸã‚ã€èªè¨¼å±€ï¼ˆCAï¼‰ãŒä¸»ã«è¡Œã†ã“ã¨ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "åˆ©ç”¨è€…ã®ç§˜å¯†éµã‚’Webä¸Šã§å…¬é–‹ã™ã‚‹",
      "ã™ã¹ã¦ã®é€šä¿¡å†…å®¹ã‚’é•·æœŸä¿å­˜ã™ã‚‹",
      "å…¬é–‹éµã¨ãã®æ‰€æœ‰è€…ã®æƒ…å ±ã‚’çµã³ä»˜ã‘ã¦è¨¼æ˜Žã™ã‚‹",
      "ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰ã‚’æš—å·åŒ–ã›ãšé…å¸ƒã™ã‚‹"
    ],
    "a": 2,
    "exp": "CAã¯æœ¬äººç¢ºèªãªã©ã‚’è¡Œã„ã€å…¬é–‹éµã¨çµ„ç¹”åãƒ»ãƒ‰ãƒ¡ã‚¤ãƒ³åãªã©ã®ä¸»ä½“æƒ…å ±ã‚’çµã³ä»˜ã‘ãŸè¨¼æ˜Žæ›¸ã‚’ç™ºè¡Œã—ã¾ã™ã€‚",
    "hint": "å…¬é–‹éµãŒã€Žèª°ã®ã‚‚ã®ã‹ã€ã‚’ç¬¬ä¸‰è€…ã¨ã—ã¦ä¿è¨¼ã—ã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œè¨¼æ˜Žæ›¸ã¯å…¬é–‹éµã¨ä¸»ä½“ã‚’çµã³ä»˜ã‘ã‚‹ã€ã€‚CAã¯æœ¬äººç¢ºèªãªã©ã‚’è¡Œã„ã€å…¬é–‹éµã¨çµ„ç¹”åãƒ»ãƒ‰ãƒ¡ã‚¤ãƒ³åãªã©ã®ä¸»ä½“æƒ…å ±ã‚’çµã³ä»˜ã‘ãŸè¨¼æ˜Žæ›¸ã‚’ç™ºè¡Œã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œåˆ©ç”¨è€…ã®ç§˜å¯†éµã‚’Webä¸Šã§å…¬é–‹ã™ã‚‹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œè¨¼æ˜Žæ›¸ã¯å…¬é–‹éµã¨ä¸»ä½“ã‚’çµã³ä»˜ã‘ã‚‹ã€ã€‚ã“ã®ãŸã‚ã€Œã™ã¹ã¦ã®é€šä¿¡å†…å®¹ã‚’é•·æœŸä¿å­˜ã™ã‚‹ã€ã®ã‚ˆã†ã«æ–­å®šã™ã‚‹ã¨ã€å•é¡Œã®æ¡ä»¶ãƒ»å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "CAã¯æœ¬äººç¢ºèªãªã©ã‚’è¡Œã„ã€å…¬é–‹éµã¨çµ„ç¹”åãƒ»ãƒ‰ãƒ¡ã‚¤ãƒ³åãªã©ã®ä¸»ä½“æƒ…å ±ã‚’çµã³ä»˜ã‘ãŸè¨¼æ˜Žæ›¸ã‚’ç™ºè¡Œã—ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œè¨¼æ˜Žæ›¸ã¯å…¬é–‹éµã¨ä¸»ä½“ã‚’çµã³ä»˜ã‘ã‚‹ã€ã€‚CAã¯æœ¬äººç¢ºèªãªã©ã‚’è¡Œã„ã€å…¬é–‹éµã¨çµ„ç¹”åãƒ»ãƒ‰ãƒ¡ã‚¤ãƒ³åãªã©ã®ä¸»ä½“æƒ…å ±ã‚’çµã³ä»˜ã‘ãŸè¨¼æ˜Žæ›¸ã‚’ç™ºè¡Œã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰ã‚’æš—å·åŒ–ã›ãšé…å¸ƒã™ã‚‹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_11_03",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "sec-17",
    "cat": "ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£",
    "concept": "ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰ãƒãƒƒã‚·ãƒ¥",
    "difficulty": "æ¨™æº–",
    "q": "ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰ã‚’ãƒãƒƒã‚·ãƒ¥åŒ–ã—ã¦ä¿å­˜ã™ã‚‹ã¨ãã€å„ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰ã«ãƒ©ãƒ³ãƒ€ãƒ ãªã‚½ãƒ«ãƒˆã‚’åŠ ãˆã‚‹ä¸»ãªç›®çš„ã¯ï¼Ÿ",
    "options": [
      "åˆ©ç”¨è€…ãŒå…¥åŠ›ã™ã‚‹ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰ã®æ–‡å­—æ•°ã‚’çŸ­ãã™ã‚‹",
      "åˆ©ç”¨è€…å…¨å“¡ã§åŒä¸€ã®ãƒãƒƒã‚·ãƒ¥å€¤ã‚’å…±æœ‰ã—ã¦ç®¡ç†ã™ã‚‹",
      "ãƒãƒƒã‚·ãƒ¥å€¤ã‹ã‚‰å…ƒã®ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰ã‚’å¾©å·ã§ãã‚‹ã‚ˆã†ã«ã™ã‚‹",
      "åŒã˜ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰ã§ã‚‚ç•°ãªã‚‹ãƒãƒƒã‚·ãƒ¥å€¤ã«ã—ã€äº‹å‰è¨ˆç®—æ”»æ’ƒã‚’é›£ã—ãã™ã‚‹"
    ],
    "a": 3,
    "exp": "ã‚½ãƒ«ãƒˆã«ã‚ˆã‚ŠåŒä¸€ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰ã§ã‚‚ä¿å­˜ãƒãƒƒã‚·ãƒ¥ãŒç•°ãªã‚Šã€ãƒ¬ã‚¤ãƒ³ãƒœãƒ¼ãƒ†ãƒ¼ãƒ–ãƒ«ãªã©ã®äº‹å‰è¨ˆç®—çµæžœã‚’ãã®ã¾ã¾ä½¿ã„ã«ããã—ã¾ã™ã€‚",
    "hint": "åŒã˜ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰åŒå£«ãŒåŒã˜ä¿å­˜å€¤ã«ãªã‚‹ã“ã¨ã‚’é˜²ãŽã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒåŒã˜ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰åŒå£«ãŒåŒã˜ä¿å­˜å€¤ã«ãªã‚‹ã“ã¨ã‚’é˜²ãŽã¾ã™ã€ã€‚ã‚½ãƒ«ãƒˆã«ã‚ˆã‚ŠåŒä¸€ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰ã§ã‚‚ä¿å­˜ãƒãƒƒã‚·ãƒ¥ãŒç•°ãªã‚Šã€ãƒ¬ã‚¤ãƒ³ãƒœãƒ¼ãƒ†ãƒ¼ãƒ–ãƒ«ãªã©ã®äº‹å‰è¨ˆç®—çµæžœã‚’ãã®ã¾ã¾ä½¿ã„ã«ããã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œåˆ©ç”¨è€…ãŒå…¥åŠ›ã™ã‚‹ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰ã®æ–‡å­—æ•°ã‚’çŸ­ãã™ã‚‹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œãƒãƒƒã‚·ãƒ¥ã€ã¯ã€å…¥åŠ›ãƒ‡ãƒ¼ã‚¿ã‹ã‚‰å›ºå®šé•·ã®å€¤ã‚’è¨ˆç®—ã™ã‚‹ä»•çµ„ã¿ã§ã™ã€‚å…ƒãƒ‡ãƒ¼ã‚¿ã®å¾©å…ƒã§ã¯ãªãæ”¹ã–ã‚“æ¤œå‡ºãªã©ã«ä½¿ã„ã¾ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œãƒãƒƒã‚·ãƒ¥ã€ã¯ã€å…¥åŠ›ãƒ‡ãƒ¼ã‚¿ã‹ã‚‰å›ºå®šé•·ã®å€¤ã‚’è¨ˆç®—ã™ã‚‹ä»•çµ„ã¿ã§ã™ã€‚å…ƒãƒ‡ãƒ¼ã‚¿ã®å¾©å…ƒã§ã¯ãªãæ”¹ã–ã‚“æ¤œå‡ºãªã©ã«ä½¿ã„ã¾ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã‚½ãƒ«ãƒˆã«ã‚ˆã‚ŠåŒä¸€ãƒ‘ã‚¹ãƒ¯ãƒ¼ãƒ‰ã§ã‚‚ä¿å­˜ãƒãƒƒã‚·ãƒ¥ãŒç•°ãªã‚Šã€ãƒ¬ã‚¤ãƒ³ãƒœãƒ¼ãƒ†ãƒ¼ãƒ–ãƒ«ãªã©ã®äº‹å‰è¨ˆç®—çµæžœã‚’ãã®ã¾ã¾ä½¿ã„ã«ããã—ã¾ã™ã€‚"
    ],
    "explainTopicId": "core_11_03",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "è¤‡æ•°æ¡ä»¶"
  },
  {
    "id": "sec-18",
    "cat": "ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£",
    "concept": "HMAC",
    "difficulty": "æ¨™æº–",
    "q": "é€ä¿¡è€…ã¨å—ä¿¡è€…ãŒå…±æœ‰ã™ã‚‹ç§˜å¯†éµã¨ãƒãƒƒã‚·ãƒ¥é–¢æ•°ã‚’ä½¿ã„ã€ãƒ¡ãƒƒã‚»ãƒ¼ã‚¸ã®æ”¹ã–ã‚“ã¨é€ä¿¡å…ƒã®æ­£å½“æ€§ã‚’ç¢ºèªã™ã‚‹ä»•çµ„ã¿ã¯ï¼Ÿ",
    "options": [
      "ãƒ¡ãƒƒã‚»ãƒ¼ã‚¸æœ¬æ–‡ã®ãƒãƒƒã‚·ãƒ¥å€¤ã‚’é€ä¿¡å´ã§è¨ˆç®—ã—ã€å—ä¿¡å´ã§åŒã˜æ–¹å¼ã®å€¤ã¨æ¯”è¼ƒã™ã‚‹",
      "å…¬é–‹éµã‚’ä½¿ã£ã¦ãƒ‡ã‚¸ã‚¿ãƒ«ç½²åã‚’ä»˜ä¸Žã™ã‚‹",
      "å…±é€šéµã§ãƒ¡ãƒƒã‚»ãƒ¼ã‚¸æœ¬æ–‡ã‚’æš—å·åŒ–ã™ã‚‹",
      "å…±æœ‰ã™ã‚‹ç§˜å¯†éµã¨ãƒãƒƒã‚·ãƒ¥é–¢æ•°ã‹ã‚‰èªè¨¼å€¤ã‚’ç”Ÿæˆã™ã‚‹"
    ],
    "a": 3,
    "exp": "HMACã¯ç§˜å¯†éµã¨ãƒãƒƒã‚·ãƒ¥é–¢æ•°ã‚’çµ„ã¿åˆã‚ã›ãŸãƒ¡ãƒƒã‚»ãƒ¼ã‚¸èªè¨¼ã‚³ãƒ¼ãƒ‰ã§ã€å®Œå…¨æ€§ã¨å…±æœ‰éµã‚’çŸ¥ã‚‹ç›¸æ‰‹ã‹ã‚‰ã®ç”Ÿæˆã§ã‚ã‚‹ã“ã¨ã‚’ç¢ºèªã§ãã¾ã™ã€‚",
    "hint": "ãƒãƒƒã‚·ãƒ¥ã«å…±æœ‰ç§˜å¯†éµã‚’çµ„ã¿åˆã‚ã›ã‚‹ä»•çµ„ã¿ã§ã™ã€‚",
    "choiceExps": [
      "ã€Œãƒãƒƒã‚·ãƒ¥ã€ã¯ã€å…¥åŠ›ãƒ‡ãƒ¼ã‚¿ã‹ã‚‰å›ºå®šé•·ã®å€¤ã‚’è¨ˆç®—ã™ã‚‹ä»•çµ„ã¿ã§ã™ã€‚å…ƒãƒ‡ãƒ¼ã‚¿ã®å¾©å…ƒã§ã¯ãªãæ”¹ã–ã‚“æ¤œå‡ºãªã©ã«ä½¿ã„ã¾ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œãƒ‡ã‚¸ã‚¿ãƒ«ç½²åã€ã¯ã€ç§˜å¯†éµã§ç½²åã—ã€å¯¾å¿œã™ã‚‹å…¬é–‹éµã§ç¢ºèªã™ã‚‹ã“ã¨ã§ã€ä½œæˆè€…ã¨æ”¹ã–ã‚“ã®æœ‰ç„¡ã‚’ç¢ºèªã™ã‚‹ä»•çµ„ã¿ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒãƒƒã‚·ãƒ¥ã«å…±æœ‰ç§˜å¯†éµã‚’çµ„ã¿åˆã‚ã›ã‚‹ä»•çµ„ã¿ã§ã™ã€ã€‚HMACã¯ç§˜å¯†éµã¨ãƒãƒƒã‚·ãƒ¥é–¢æ•°ã‚’çµ„ã¿åˆã‚ã›ãŸãƒ¡ãƒƒã‚»ãƒ¼ã‚¸èªè¨¼ã‚³ãƒ¼ãƒ‰ã§ã€å®Œå…¨æ€§ã¨å…±æœ‰éµã‚’çŸ¥ã‚‹ç›¸æ‰‹ã‹ã‚‰ã®ç”Ÿæˆã§ã‚ã‚‹ã“ã¨ã‚’ç¢ºèªã§ãã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå…±é€šéµã§ãƒ¡ãƒƒã‚»ãƒ¼ã‚¸æœ¬æ–‡ã‚’æš—å·åŒ–ã™ã‚‹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "HMACã¯ç§˜å¯†éµã¨ãƒãƒƒã‚·ãƒ¥é–¢æ•°ã‚’çµ„ã¿åˆã‚ã›ãŸãƒ¡ãƒƒã‚»ãƒ¼ã‚¸èªè¨¼ã‚³ãƒ¼ãƒ‰ã§ã€å®Œå…¨æ€§ã¨å…±æœ‰éµã‚’çŸ¥ã‚‹ç›¸æ‰‹ã‹ã‚‰ã®ç”Ÿæˆã§ã‚ã‚‹ã“ã¨ã‚’ç¢ºèªã§ãã¾ã™ã€‚"
    ],
    "explainTopicId": "core_11_03",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "è¤‡æ•°æ¡ä»¶"
  },
  {
    "id": "sec-19",
    "cat": "ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£",
    "concept": "ãƒ©ãƒ³ã‚µãƒ ã‚¦ã‚§ã‚¢",
    "difficulty": "æ¨™æº–",
    "q": "ç«¯æœ«Aã§ãƒ©ãƒ³ã‚µãƒ ã‚¦ã‚§ã‚¢æ„ŸæŸ“ãŒç–‘ã‚ã‚Œã€Aã‹ã‚‰ã‚¢ã‚¯ã‚»ã‚¹ã§ãã‚‹å…±æœ‰ãƒ•ã‚©ãƒ«ãƒ€ã§ã‚‚æš—å·åŒ–ãŒé€²ã¿å§‹ã‚ãŸã€‚è¨¼æ‹ ä¿å…¨ã¯å¿…è¦ã ãŒã€ã¾ãšè¢«å®³æ‹¡å¤§ã‚’æ­¢ã‚ãŸã„ã€‚æœ€åˆã«å„ªå…ˆã™ã‚‹å¯¾å¿œã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "æ„ŸæŸ“ç«¯æœ«ã‚’ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã¸æŽ¥ç¶šã—ãŸã¾ã¾ã‚¹ã‚­ãƒ£ãƒ³ã‚’ç¶šã‘ã‚‹",
      "æ„ŸæŸ“ç«¯æœ«ã‚’ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã‹ã‚‰éš”é›¢ã™ã‚‹",
      "æš—å·åŒ–ã•ã‚ŒãŸãƒ•ã‚¡ã‚¤ãƒ«ã‚’ç›´ã¡ã«å…¨ã¦å‰Šé™¤ã™ã‚‹",
      "èª¿æŸ»å‰ã«ç«¯æœ«ã‚„ã‚µãƒ¼ãƒã®ãƒ­ã‚°ã‚’å‰Šé™¤ã™ã‚‹"
    ],
    "a": 1,
    "exp": "æ„ŸæŸ“æ‹¡å¤§ä¸­ã¯ã€ã¾ãšæ„ŸæŸ“ç«¯æœ«ã‚’ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã‹ã‚‰éš”é›¢ã—ã¦å…±æœ‰è³‡æºã‚„ä»–ç«¯æœ«ã¸ã®è¢«å®³æ‹¡å¤§ã‚’æŠ‘ãˆã‚‹ã€‚ãã®å¾Œã«è¨¼æ‹ ä¿å…¨ã‚„èª¿æŸ»ãƒ»å¾©æ—§ã¸é€²ã‚€ã€‚",
    "hint": "ã€ŽåŽŸå› ç©¶æ˜Žã€ã‚ˆã‚Šå…ˆã«ã€ã€Žæ‹¡å¤§ã‚’æ­¢ã‚ã‚‹ã€åˆå‹•ã‚’è€ƒãˆã‚‹ã€‚",
    "choiceExps": [
      "æŽ¥ç¶šã—ãŸã¾ã¾ã§ã¯å…±æœ‰è³‡æºã‚„ä»–ç«¯æœ«ã¸è¢«å®³ãŒåºƒãŒã‚‹ãŠãã‚ŒãŒã‚ã‚‹ã€‚",
      "æ„ŸæŸ“æ‹¡å¤§ä¸­ã¯ã€ã¾ãšæ„ŸæŸ“ç«¯æœ«ã‚’ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã‹ã‚‰éš”é›¢ã—ã¦å…±æœ‰è³‡æºã‚„ä»–ç«¯æœ«ã¸ã®è¢«å®³æ‹¡å¤§ã‚’æŠ‘ãˆã‚‹ã€‚ãã®å¾Œã«è¨¼æ‹ ä¿å…¨ã‚„èª¿æŸ»ãƒ»å¾©æ—§ã¸é€²ã‚€ã€‚",
      "ãƒ•ã‚¡ã‚¤ãƒ«å‰Šé™¤ã¯è¨¼æ‹ ã‚„å¾©æ—§å¯èƒ½æ€§ã‚’å¤±ã†ãŠãã‚ŒãŒã‚ã‚Šã€æœ€åˆã®å¯¾å¿œã§ã¯ãªã„ã€‚",
      "ãƒ­ã‚°å‰Šé™¤ã¯èª¿æŸ»ã«å¿…è¦ãªè¨¼æ‹ ã‚’å¤±ã†ãŸã‚ä¸é©åˆ‡ã€‚"
    ],
    "explainTopicId": "core_11_06",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-rewritten",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "sec-20",
    "cat": "ã‚»ã‚­ãƒ¥ãƒªãƒ†ã‚£",
    "concept": "ãƒ‘ãƒƒãƒç®¡ç†",
    "difficulty": "åŸºç¤Ž",
    "q": "è„†å¼±æ€§æƒ…å ±ãŒå…¬é–‹ã•ã‚ŒãŸOSã«å¯¾ã—ã€ãƒ™ãƒ³ãƒ€æä¾›ã®ä¿®æ­£ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã‚’å½±éŸ¿ç¢ºèªã®ä¸Šã§ç¶™ç¶šçš„ã«é©ç”¨ã—ã¦ã„ãç®¡ç†æ´»å‹•ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "è„†å¼±æ€§è¨ºæ–­ã§å¼±ç‚¹ã‚’æ´—ã„å‡ºã™",
      "å¤‰æ›´ç®¡ç†ã§é©ç”¨æ—¥æ™‚ã‚„å½±éŸ¿ã‚’æ‰¿èªã™ã‚‹",
      "ãƒ‘ãƒƒãƒç®¡ç†",
      "æ§‹æˆç®¡ç†ã§ã‚½ãƒ•ãƒˆã‚¦ã‚§ã‚¢ã®ç‰ˆã‚’è¨˜éŒ²ã™ã‚‹"
    ],
    "a": 2,
    "exp": "è„†å¼±æ€§ä¿®æ­£ã‚’å«ã‚€æ›´æ–°ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã‚’é©åˆ‡ã«è©•ä¾¡ãƒ»é©ç”¨ã™ã‚‹ã“ã¨ã¯ãƒ‘ãƒƒãƒç®¡ç†ã®é‡è¦ãªæ´»å‹•ã§ã™ã€‚",
    "hint": "è„†å¼±æ€§ã‚’ä¿®æ­£ã™ã‚‹æ›´æ–°ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã®ç®¡ç†ã§ã™ã€‚",
    "choiceExps": [
      "è„†å¼±æ€§è¨ºæ–­ã¯å¼±ç‚¹ã‚’ç™ºè¦‹ãƒ»è©•ä¾¡ã™ã‚‹æ´»å‹•ã§ã€æ›´æ–°ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã‚’ç¶™ç¶šçš„ã«é©ç”¨ã™ã‚‹ç®¡ç†ãã®ã‚‚ã®ã§ã¯ãªã„ã€‚",
      "å¤‰æ›´ç®¡ç†ã¯å€‹ã€…ã®å¤‰æ›´ã®å½±éŸ¿è©•ä¾¡ãƒ»æ‰¿èªã‚’æ‰±ã†ãŒã€è„†å¼±æ€§ä¿®æ­£æ›´æ–°ã‚’ç¶™ç¶šçš„ã«ç®¡ç†ã™ã‚‹ä¸­å¿ƒæ¦‚å¿µã¯ãƒ‘ãƒƒãƒç®¡ç†ã€‚",
      "è„†å¼±æ€§ä¿®æ­£ã‚’å«ã‚€æ›´æ–°ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã‚’é©åˆ‡ã«è©•ä¾¡ãƒ»é©ç”¨ã™ã‚‹ã“ã¨ã¯ãƒ‘ãƒƒãƒç®¡ç†ã®é‡è¦ãªæ´»å‹•ã§ã™ã€‚",
      "æ§‹æˆç®¡ç†ã¯å°Žå…¥æ¸ˆã¿ã‚½ãƒ•ãƒˆã‚¦ã‚§ã‚¢ã®ç‰ˆã‚„çµ„åˆã›ã‚’æŠŠæ¡ã™ã‚‹æ´»å‹•ã§ã€ä¿®æ­£ãƒ—ãƒ­ã‚°ãƒ©ãƒ ã®é©ç”¨ç®¡ç†ã¨ã¯å½¹å‰²ãŒç•°ãªã‚‹ã€‚"
    ],
    "explainTopicId": "core_11_07",
    "explainTopicSource": "semantic",
    "qualityOverride": "v89-near-domain-distractors",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "algo-08",
    "cat": "ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ",
    "concept": "é…åˆ—ãƒˆãƒ¬ãƒ¼ã‚¹",
    "difficulty": "åŸºç¤Ž",
    "q": "é…åˆ—A=[2,4,6]ã§ã€æ·»å­—ã¯0ã‹ã‚‰å§‹ã¾ã‚Šã¾ã™ã€‚A[1] â† A[0] + A[2] ã‚’å®Ÿè¡Œã—ãŸå¾Œã®A[1]ã¯ï¼Ÿ",
    "options": [
      "12",
      "4",
      "6",
      "8"
    ],
    "a": 3,
    "exp": "A[0]=2ã€A[2]=6ãªã®ã§ã€A[1]ã«ã¯2+6=8ãŒä»£å…¥ã•ã‚Œã¾ã™ã€‚",
    "hint": "å³è¾ºã®2è¦ç´ ã‚’å…ˆã«å–ã‚Šå‡ºã—ã¦è¶³ã—ã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå³è¾ºã®2è¦ç´ ã‚’å…ˆã«å–ã‚Šå‡ºã—ã¦è¶³ã—ã¾ã™ã€ã€‚A[0]=2ã€A[2]=6ãªã®ã§ã€A[1]ã«ã¯2+6=8ãŒä»£å…¥ã•ã‚Œã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ12ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå³è¾ºã®2è¦ç´ ã‚’å…ˆã«å–ã‚Šå‡ºã—ã¦è¶³ã—ã¾ã™ã€ã€‚A[0]=2ã€A[2]=6ãªã®ã§ã€A[1]ã«ã¯2+6=8ãŒä»£å…¥ã•ã‚Œã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ4ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œå³è¾ºã®2è¦ç´ ã‚’å…ˆã«å–ã‚Šå‡ºã—ã¦è¶³ã—ã¾ã™ã€ã€‚A[0]=2ã€A[2]=6ãªã®ã§ã€A[1]ã«ã¯2+6=8ãŒä»£å…¥ã•ã‚Œã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ6ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "A[0]=2ã€A[2]=6ãªã®ã§ã€A[1]ã«ã¯2+6=8ãŒä»£å…¥ã•ã‚Œã¾ã™ã€‚"
    ],
    "explainTopicId": "core_03_01",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "algo-09",
    "cat": "ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ",
    "concept": "äºŒé‡ãƒ«ãƒ¼ãƒ—",
    "difficulty": "åŸºç¤Ž",
    "q": "å¤–å´ã®ãƒ«ãƒ¼ãƒ—ã‚’3å›žã€å„å¤–å´ãƒ«ãƒ¼ãƒ—ã®ä¸­ã§å†…å´ã®ãƒ«ãƒ¼ãƒ—ã‚’2å›žå®Ÿè¡Œã™ã‚‹ã€‚å†…å´ã®å‡¦ç†ã¯åˆè¨ˆä½•å›žå®Ÿè¡Œã•ã‚Œã‚‹ã‹ï¼Ÿ",
    "options": [
      "6å›ž",
      "2å›ž",
      "3å›ž",
      "9å›ž"
    ],
    "a": 0,
    "exp": "å¤–å´3å›žã®ãã‚Œãžã‚Œã§å†…å´ã‚’2å›žå®Ÿè¡Œã™ã‚‹ã®ã§ã€3Ã—2=6å›žã§ã™ã€‚",
    "hint": "å¤–å´ã®å›žæ•°Ã—å†…å´ã®å›žæ•°ã§ã™ã€‚",
    "choiceExps": [
      "å¤–å´3å›žã®ãã‚Œãžã‚Œã§å†…å´ã‚’2å›žå®Ÿè¡Œã™ã‚‹ã®ã§ã€3Ã—2=6å›žã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ6å›žã€ã«ãªã‚‹ã€‚å¤–å´3å›žã®ãã‚Œãžã‚Œã§å†…å´ã‚’2å›žå®Ÿè¡Œã™ã‚‹ã®ã§ã€3Ã—2=6å›žã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ6å›žã€ã«ãªã‚‹ã€‚å¤–å´3å›žã®ãã‚Œãžã‚Œã§å†…å´ã‚’2å›žå®Ÿè¡Œã™ã‚‹ã®ã§ã€3Ã—2=6å›žã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ6å›žã€ã«ãªã‚‹ã€‚å¤–å´3å›žã®ãã‚Œãžã‚Œã§å†…å´ã‚’2å›žå®Ÿè¡Œã™ã‚‹ã®ã§ã€3Ã—2=6å›žã§ã™ã€‚"
    ],
    "explainTopicId": "core_03_02",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "algo-10",
    "cat": "ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ",
    "concept": "å†å¸°",
    "difficulty": "åŸºç¤Ž",
    "q": "factorial(n) ãŒ nÃ—factorial(n-1) ã§å®šç¾©ã•ã‚Œã€factorial(1)=1 ã®ã¨ã factorial(5) ã¯ï¼Ÿ",
    "options": [
      "60",
      "120",
      "125",
      "25"
    ],
    "a": 1,
    "exp": "5Ã—4Ã—3Ã—2Ã—1=120ã§ã™ã€‚",
    "hint": "5ã‹ã‚‰1ã¾ã§é †ã«æŽ›ã‘ã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä»£è¡¨çš„ãªå¢—ãˆæ–¹ã¯ O(1) < O(log n) < O(n) < O(n log n) < O(nÂ²)ã€ã€‚5Ã—4Ã—3Ã—2Ã—1=120ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ60ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "5Ã—4Ã—3Ã—2Ã—1=120ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä»£è¡¨çš„ãªå¢—ãˆæ–¹ã¯ O(1) < O(log n) < O(n) < O(n log n) < O(nÂ²)ã€ã€‚5Ã—4Ã—3Ã—2Ã—1=120ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ125ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä»£è¡¨çš„ãªå¢—ãˆæ–¹ã¯ O(1) < O(log n) < O(n) < O(n log n) < O(nÂ²)ã€ã€‚5Ã—4Ã—3Ã—2Ã—1=120ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ25ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_03_02",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "algo-11",
    "cat": "ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ",
    "concept": "äºŒåˆ†æŽ¢ç´¢",
    "difficulty": "æ¨™æº–",
    "q": "æ˜‡é †é…åˆ— [1,4,7,9,12,15] ã‹ã‚‰12ã‚’äºŒåˆ†æŽ¢ç´¢ã™ã‚‹ã€‚ä¸­å¤®ã‚’åˆ‡ã‚Šæ¨ã¦ã§é¸ã¶ã¨ã€æ¯”è¼ƒã¯ä½•å›žã§è¦‹ã¤ã‹ã‚‹ã‹ã€‚",
    "options": [
      "4å›ž",
      "1å›ž",
      "2å›ž",
      "3å›ž"
    ],
    "a": 2,
    "exp": "æœ€åˆã¯ä¸­å¤®ã®7ã¨æ¯”è¼ƒã—ã¦å³åŠåˆ†ã¸é€²ã¿ã€æ¬¡ã«12ã¨æ¯”è¼ƒã—ã¦è¦‹ã¤ã‹ã‚‹ã®ã§2å›žã§ã™ã€‚",
    "hint": "å®Ÿéš›ã«ä¸­å¤®è¦ç´ ã‚’é †ç•ªã«æ›¸ãå‡ºã—ã¦ã¿ã¾ã™ã€‚",
    "choiceExps": [
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ2å›žã€ã«ãªã‚‹ã€‚æœ€åˆã¯ä¸­å¤®ã®7ã¨æ¯”è¼ƒã—ã¦å³åŠåˆ†ã¸é€²ã¿ã€æ¬¡ã«12ã¨æ¯”è¼ƒã—ã¦è¦‹ã¤ã‹ã‚‹ã®ã§2å›žã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ2å›žã€ã«ãªã‚‹ã€‚æœ€åˆã¯ä¸­å¤®ã®7ã¨æ¯”è¼ƒã—ã¦å³åŠåˆ†ã¸é€²ã¿ã€æ¬¡ã«12ã¨æ¯”è¼ƒã—ã¦è¦‹ã¤ã‹ã‚‹ã®ã§2å›žã§ã™ã€‚",
      "æœ€åˆã¯ä¸­å¤®ã®7ã¨æ¯”è¼ƒã—ã¦å³åŠåˆ†ã¸é€²ã¿ã€æ¬¡ã«12ã¨æ¯”è¼ƒã—ã¦è¦‹ã¤ã‹ã‚‹ã®ã§2å›žã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ2å›žã€ã«ãªã‚‹ã€‚æœ€åˆã¯ä¸­å¤®ã®7ã¨æ¯”è¼ƒã—ã¦å³åŠåˆ†ã¸é€²ã¿ã€æ¬¡ã«12ã¨æ¯”è¼ƒã—ã¦è¦‹ã¤ã‹ã‚‹ã®ã§2å›žã§ã™ã€‚"
    ],
    "explainTopicId": "core_03_03",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "algo-12",
    "cat": "ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ",
    "concept": "ã‚¹ã‚¿ãƒƒã‚¯",
    "difficulty": "åŸºç¤Ž",
    "q": "ç©ºã®ã‚¹ã‚¿ãƒƒã‚¯ã«Aã‚’PUSHã€Bã‚’PUSHã€1å›žPOPã€Cã‚’PUSHã—ãŸå¾Œã€ã•ã‚‰ã«1å›žPOPã™ã‚‹ã¨å–ã‚Šå‡ºã•ã‚Œã‚‹ã®ã¯ï¼Ÿ",
    "options": [
      "A",
      "B",
      "å–ã‚Šå‡ºã›ãªã„",
      "C"
    ],
    "a": 3,
    "exp": "Aâ†’Bã®é †ã«ç©ã¿ã€æœ€åˆã®POPã§Bã‚’å–ã‚Šå‡ºã—ã¾ã™ã€‚ãã®å¾ŒCã‚’ç©ã‚€ã®ã§ã€æ¬¡ã®POPã¯Cã§ã™ã€‚",
    "hint": "ã‚¹ã‚¿ãƒƒã‚¯ã¯æœ€å¾Œã«å…¥ã‚ŒãŸã‚‚ã®ã‹ã‚‰å–ã‚Šå‡ºã™LIFOã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒA,B,Cã‚’ã‚¹ã‚¿ãƒƒã‚¯ã¸é †ã«PUSHã™ã‚‹ã¨æœ€åˆã®POPã¯Cã§ã™ã€ã€‚Aâ†’Bã®é †ã«ç©ã¿ã€æœ€åˆã®POPã§Bã‚’å–ã‚Šå‡ºã—ã¾ã™ã€‚ãã®å¾ŒCã‚’ç©ã‚€ã®ã§ã€æ¬¡ã®POPã¯Cã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒAã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒA,B,Cã‚’ã‚¹ã‚¿ãƒƒã‚¯ã¸é †ã«PUSHã™ã‚‹ã¨æœ€åˆã®POPã¯Cã§ã™ã€ã€‚Aâ†’Bã®é †ã«ç©ã¿ã€æœ€åˆã®POPã§Bã‚’å–ã‚Šå‡ºã—ã¾ã™ã€‚ãã®å¾ŒCã‚’ç©ã‚€ã®ã§ã€æ¬¡ã®POPã¯Cã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒBã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒA,B,Cã‚’ã‚¹ã‚¿ãƒƒã‚¯ã¸é †ã«PUSHã™ã‚‹ã¨æœ€åˆã®POPã¯Cã§ã™ã€ã€‚ã“ã®ãŸã‚ã€Œå–ã‚Šå‡ºã›ãªã„ã€ã®ã‚ˆã†ã«æ–­å®šã™ã‚‹ã¨ã€å•é¡Œã®æ¡ä»¶ãƒ»å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "Aâ†’Bã®é †ã«ç©ã¿ã€æœ€åˆã®POPã§Bã‚’å–ã‚Šå‡ºã—ã¾ã™ã€‚ãã®å¾ŒCã‚’ç©ã‚€ã®ã§ã€æ¬¡ã®POPã¯Cã§ã™ã€‚"
    ],
    "explainTopicId": "core_03_01",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "algo-13",
    "cat": "ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ",
    "concept": "ã‚­ãƒ¥ãƒ¼",
    "difficulty": "åŸºç¤Ž",
    "q": "ç©ºã®ã‚­ãƒ¥ãƒ¼ã¸Aã€Bã€Cã®é †ã«ENQUEUEã—ã¾ã—ãŸã€‚2å›žç›®ã®DEQUEUEã§å–ã‚Šå‡ºã•ã‚Œã‚‹è¦ç´ ã¯ï¼Ÿ",
    "options": [
      "B",
      "C",
      "å–ã‚Šå‡ºã›ãªã„",
      "A"
    ],
    "a": 0,
    "exp": "ã‚­ãƒ¥ãƒ¼ã¯å…ˆã«å…¥ã‚ŒãŸã‚‚ã®ã‹ã‚‰å–ã‚Šå‡ºã™FIFOã§ã™ã€‚1å›žç›®ãŒAã€2å›žç›®ãŒBã§ã™ã€‚",
    "hint": "Aâ†’Bâ†’Cã®é †ã«ä¸¦ã³ã€å…ˆé ­ã‹ã‚‰å–ã‚Šå‡ºã—ã¾ã™ã€‚",
    "choiceExps": [
      "ã‚­ãƒ¥ãƒ¼ã¯å…ˆã«å…¥ã‚ŒãŸã‚‚ã®ã‹ã‚‰å–ã‚Šå‡ºã™FIFOã§ã™ã€‚1å›žç›®ãŒAã€2å›žç›®ãŒBã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒAâ†’Bâ†’Cã®é †ã«ä¸¦ã³ã€å…ˆé ­ã‹ã‚‰å–ã‚Šå‡ºã—ã¾ã™ã€ã€‚ã‚­ãƒ¥ãƒ¼ã¯å…ˆã«å…¥ã‚ŒãŸã‚‚ã®ã‹ã‚‰å–ã‚Šå‡ºã™FIFOã§ã™ã€‚1å›žç›®ãŒAã€2å›žç›®ãŒBã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒCã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒAâ†’Bâ†’Cã®é †ã«ä¸¦ã³ã€å…ˆé ­ã‹ã‚‰å–ã‚Šå‡ºã—ã¾ã™ã€ã€‚ã“ã®ãŸã‚ã€Œå–ã‚Šå‡ºã›ãªã„ã€ã®ã‚ˆã†ã«æ–­å®šã™ã‚‹ã¨ã€å•é¡Œã®æ¡ä»¶ãƒ»å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒAâ†’Bâ†’Cã®é †ã«ä¸¦ã³ã€å…ˆé ­ã‹ã‚‰å–ã‚Šå‡ºã—ã¾ã™ã€ã€‚ã‚­ãƒ¥ãƒ¼ã¯å…ˆã«å…¥ã‚ŒãŸã‚‚ã®ã‹ã‚‰å–ã‚Šå‡ºã™FIFOã§ã™ã€‚1å›žç›®ãŒAã€2å›žç›®ãŒBã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒAã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_03_01",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "algo-14",
    "cat": "ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ",
    "concept": "æœ¨ã®èµ°æŸ»",
    "difficulty": "æ¨™æº–",
    "q": "äºŒåˆ†æœ¨ã§ã€æ ¹Aã®å·¦å­ãŒBã€å³å­ãŒCã€Bã®å·¦å­ãŒDã€å³å­ãŒEã§ã‚ã‚‹ã€‚å…ˆè¡Œé †ï¼ˆpreorderï¼‰ã®èµ°æŸ»é †ã¯ï¼Ÿ",
    "options": [
      "A, C, B, E, D",
      "A, B, D, E, C",
      "D, B, E, A, C",
      "D, E, B, C, A"
    ],
    "a": 1,
    "exp": "å…ˆè¡Œé †ã¯ã€Žæ ¹â†’å·¦éƒ¨åˆ†æœ¨â†’å³éƒ¨åˆ†æœ¨ã€ã§ã™ã€‚Aã®å¾Œã€Bã®éƒ¨åˆ†æœ¨D,Eã‚’ãŸã©ã‚Šã€æœ€å¾Œã«Cã¸é€²ã¿ã¾ã™ã€‚",
    "hint": "preorderã¯æœ€åˆã«æ ¹ã‚’è¨ªã‚Œã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œpreorderã¯æœ€åˆã«æ ¹ã‚’è¨ªã‚Œã¾ã™ã€ã€‚å…ˆè¡Œé †ã¯ã€Žæ ¹â†’å·¦éƒ¨åˆ†æœ¨â†’å³éƒ¨åˆ†æœ¨ã€ã§ã™ã€‚Aã®å¾Œã€Bã®éƒ¨åˆ†æœ¨D,Eã‚’ãŸã©ã‚Šã€æœ€å¾Œã«Cã¸é€²ã¿ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒA, C, B, E, Dã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "å…ˆè¡Œé †ã¯ã€Žæ ¹â†’å·¦éƒ¨åˆ†æœ¨â†’å³éƒ¨åˆ†æœ¨ã€ã§ã™ã€‚Aã®å¾Œã€Bã®éƒ¨åˆ†æœ¨D,Eã‚’ãŸã©ã‚Šã€æœ€å¾Œã«Cã¸é€²ã¿ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œpreorderã¯æœ€åˆã«æ ¹ã‚’è¨ªã‚Œã¾ã™ã€ã€‚å…ˆè¡Œé †ã¯ã€Žæ ¹â†’å·¦éƒ¨åˆ†æœ¨â†’å³éƒ¨åˆ†æœ¨ã€ã§ã™ã€‚Aã®å¾Œã€Bã®éƒ¨åˆ†æœ¨D,Eã‚’ãŸã©ã‚Šã€æœ€å¾Œã«Cã¸é€²ã¿ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒD, B, E, A, Cã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œpreorderã¯æœ€åˆã«æ ¹ã‚’è¨ªã‚Œã¾ã™ã€ã€‚å…ˆè¡Œé †ã¯ã€Žæ ¹â†’å·¦éƒ¨åˆ†æœ¨â†’å³éƒ¨åˆ†æœ¨ã€ã§ã™ã€‚Aã®å¾Œã€Bã®éƒ¨åˆ†æœ¨D,Eã‚’ãŸã©ã‚Šã€æœ€å¾Œã«Cã¸é€²ã¿ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒD, E, B, C, Aã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_03_01",
    "explainTopicSource": "manual",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "algo-15",
    "cat": "ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ",
    "concept": "æœ¨ã®èµ°æŸ»",
    "difficulty": "æ¨™æº–",
    "q": "äºŒåˆ†æœ¨ã§ã€æ ¹Aã®å·¦å­ãŒBã€å³å­ãŒCã€Bã®å·¦å­ãŒDã€å³å­ãŒEã§ã‚ã‚‹ã€‚ä¸­é–“é †ï¼ˆinorderï¼‰ã®èµ°æŸ»é †ã¯ï¼Ÿ",
    "options": [
      "A, B, D, E, C",
      "D, E, B, C, A",
      "D, B, E, A, C",
      "C, A, E, B, D"
    ],
    "a": 2,
    "exp": "ä¸­é–“é †ã¯ã€Žå·¦éƒ¨åˆ†æœ¨â†’æ ¹â†’å³éƒ¨åˆ†æœ¨ã€ã§ã™ã€‚Bã®å·¦Dã€Bã€å³Eã€ãã®å¾ŒAã€Cã¨ãªã‚Šã¾ã™ã€‚",
    "hint": "inorderã§ã¯æ ¹ã‚’å·¦éƒ¨åˆ†æœ¨ã¨å³éƒ¨åˆ†æœ¨ã®é–“ã§è¨ªã‚Œã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œinorderã§ã¯æ ¹ã‚’å·¦éƒ¨åˆ†æœ¨ã¨å³éƒ¨åˆ†æœ¨ã®é–“ã§è¨ªã‚Œã¾ã™ã€ã€‚ä¸­é–“é †ã¯ã€Žå·¦éƒ¨åˆ†æœ¨â†’æ ¹â†’å³éƒ¨åˆ†æœ¨ã€ã§ã™ã€‚Bã®å·¦Dã€Bã€å³Eã€ãã®å¾ŒAã€Cã¨ãªã‚Šã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒA, B, D, E, Cã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œinorderã§ã¯æ ¹ã‚’å·¦éƒ¨åˆ†æœ¨ã¨å³éƒ¨åˆ†æœ¨ã®é–“ã§è¨ªã‚Œã¾ã™ã€ã€‚ä¸­é–“é †ã¯ã€Žå·¦éƒ¨åˆ†æœ¨â†’æ ¹â†’å³éƒ¨åˆ†æœ¨ã€ã§ã™ã€‚Bã®å·¦Dã€Bã€å³Eã€ãã®å¾ŒAã€Cã¨ãªã‚Šã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒD, E, B, C, Aã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "ä¸­é–“é †ã¯ã€Žå·¦éƒ¨åˆ†æœ¨â†’æ ¹â†’å³éƒ¨åˆ†æœ¨ã€ã§ã™ã€‚Bã®å·¦Dã€Bã€å³Eã€ãã®å¾ŒAã€Cã¨ãªã‚Šã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œinorderã§ã¯æ ¹ã‚’å·¦éƒ¨åˆ†æœ¨ã¨å³éƒ¨åˆ†æœ¨ã®é–“ã§è¨ªã‚Œã¾ã™ã€ã€‚ä¸­é–“é †ã¯ã€Žå·¦éƒ¨åˆ†æœ¨â†’æ ¹â†’å³éƒ¨åˆ†æœ¨ã€ã§ã™ã€‚Bã®å·¦Dã€Bã€å³Eã€ãã®å¾ŒAã€Cã¨ãªã‚Šã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒC, A, E, B, Dã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_03_01",
    "explainTopicSource": "manual",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "algo-16",
    "cat": "ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ",
    "concept": "ãƒãƒ–ãƒ«ã‚½ãƒ¼ãƒˆ",
    "difficulty": "æ¨™æº–",
    "q": "é…åˆ— [5,1,4,2] ã‚’æ˜‡é †ã®ãƒãƒ–ãƒ«ã‚½ãƒ¼ãƒˆã§å·¦ã‹ã‚‰å³ã¸1å›žèµ°æŸ»ã—ãŸç›´å¾Œã®é…åˆ—ã¯ï¼Ÿ",
    "options": [
      "[5,1,2,4]",
      "[1,4,5,2]",
      "[1,2,4,5]",
      "[1,4,2,5]"
    ],
    "a": 3,
    "exp": "5ã¨1ã‚’äº¤æ›â†’[1,5,4,2]ã€5ã¨4ã‚’äº¤æ›â†’[1,4,5,2]ã€5ã¨2ã‚’äº¤æ›â†’[1,4,2,5]ã§ã™ã€‚",
    "hint": "éš£æŽ¥è¦ç´ ã‚’å·¦ã‹ã‚‰é †ã«æ¯”è¼ƒã—ã€å¤§ãã„å€¤ãŒå³ã¸ç§»å‹•ã—ã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒãƒ–ãƒ«ã‚½ãƒ¼ãƒˆã¯éš£æŽ¥è¦ç´ ã‚’æ¯”è¼ƒäº¤æ›ã€ã€‚5ã¨1ã‚’äº¤æ›â†’[1,5,4,2]ã€5ã¨4ã‚’äº¤æ›â†’[1,4,5,2]ã€5ã¨2ã‚’äº¤æ›â†’[1,4,2,5]ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ[5,1,2,4]ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒãƒ–ãƒ«ã‚½ãƒ¼ãƒˆã¯éš£æŽ¥è¦ç´ ã‚’æ¯”è¼ƒäº¤æ›ã€ã€‚5ã¨1ã‚’äº¤æ›â†’[1,5,4,2]ã€5ã¨4ã‚’äº¤æ›â†’[1,4,5,2]ã€5ã¨2ã‚’äº¤æ›â†’[1,4,2,5]ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ[1,4,5,2]ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œãƒãƒ–ãƒ«ã‚½ãƒ¼ãƒˆã¯éš£æŽ¥è¦ç´ ã‚’æ¯”è¼ƒäº¤æ›ã€ã€‚5ã¨1ã‚’äº¤æ›â†’[1,5,4,2]ã€5ã¨4ã‚’äº¤æ›â†’[1,4,5,2]ã€5ã¨2ã‚’äº¤æ›â†’[1,4,2,5]ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ[1,2,4,5]ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "5ã¨1ã‚’äº¤æ›â†’[1,5,4,2]ã€5ã¨4ã‚’äº¤æ›â†’[1,4,5,2]ã€5ã¨2ã‚’äº¤æ›â†’[1,4,2,5]ã§ã™ã€‚"
    ],
    "explainTopicId": "core_03_03",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "algo-17",
    "cat": "ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ",
    "concept": "é¸æŠžã‚½ãƒ¼ãƒˆ",
    "difficulty": "æ¨™æº–",
    "q": "é…åˆ— [4,2,5,1] ã‚’æ˜‡é †ã®é¸æŠžã‚½ãƒ¼ãƒˆã§ã€æœ€åˆã®1å›žã®é¸æŠžãƒ»äº¤æ›ã‚’è¡Œã£ãŸç›´å¾Œã¯ï¼Ÿ",
    "options": [
      "[1,2,5,4]",
      "[1,4,2,5]",
      "[2,4,5,1]",
      "[4,1,5,2]"
    ],
    "a": 0,
    "exp": "æœªæ•´åˆ—éƒ¨åˆ†å…¨ä½“ã‹ã‚‰æœ€å°å€¤1ã‚’æŽ¢ã—ã€å…ˆé ­ã®4ã¨äº¤æ›ã™ã‚‹ã®ã§ [1,2,5,4] ã§ã™ã€‚",
    "hint": "é¸æŠžã‚½ãƒ¼ãƒˆã®æœ€åˆã®å‡¦ç†ã§ã¯å…¨ä½“ã‹ã‚‰æœ€å°å€¤ã‚’1ã¤é¸ã³ã¾ã™ã€‚",
    "choiceExps": [
      "æœªæ•´åˆ—éƒ¨åˆ†å…¨ä½“ã‹ã‚‰æœ€å°å€¤1ã‚’æŽ¢ã—ã€å…ˆé ­ã®4ã¨äº¤æ›ã™ã‚‹ã®ã§ [1,2,5,4] ã§ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œé¸æŠžã‚½ãƒ¼ãƒˆã®æœ€åˆã®å‡¦ç†ã§ã¯å…¨ä½“ã‹ã‚‰æœ€å°å€¤ã‚’1ã¤é¸ã³ã¾ã™ã€ã€‚æœªæ•´åˆ—éƒ¨åˆ†å…¨ä½“ã‹ã‚‰æœ€å°å€¤1ã‚’æŽ¢ã—ã€å…ˆé ­ã®4ã¨äº¤æ›ã™ã‚‹ã®ã§ [1,2,5,4] ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ[1,4,2,5]ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œé¸æŠžã‚½ãƒ¼ãƒˆã®æœ€åˆã®å‡¦ç†ã§ã¯å…¨ä½“ã‹ã‚‰æœ€å°å€¤ã‚’1ã¤é¸ã³ã¾ã™ã€ã€‚æœªæ•´åˆ—éƒ¨åˆ†å…¨ä½“ã‹ã‚‰æœ€å°å€¤1ã‚’æŽ¢ã—ã€å…ˆé ­ã®4ã¨äº¤æ›ã™ã‚‹ã®ã§ [1,2,5,4] ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ[2,4,5,1]ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œé¸æŠžã‚½ãƒ¼ãƒˆã®æœ€åˆã®å‡¦ç†ã§ã¯å…¨ä½“ã‹ã‚‰æœ€å°å€¤ã‚’1ã¤é¸ã³ã¾ã™ã€ã€‚æœªæ•´åˆ—éƒ¨åˆ†å…¨ä½“ã‹ã‚‰æœ€å°å€¤1ã‚’æŽ¢ã—ã€å…ˆé ­ã®4ã¨äº¤æ›ã™ã‚‹ã®ã§ [1,2,5,4] ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ[4,1,5,2]ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_03_03",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "algo-18",
    "cat": "ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ",
    "concept": "è¨ˆç®—é‡",
    "difficulty": "æ¨™æº–",
    "q": "æ•´åˆ—æ¸ˆã¿é…åˆ—ã‚’äºŒåˆ†æŽ¢ç´¢ã™ã‚‹ã€‚è¦ç´ æ•°ã‚’ç´„2å€ã«ã—ã¦ã‚‚æ¯”è¼ƒå›žæ•°ã¯1å›žç¨‹åº¦ã—ã‹å¢—ãˆãªã„ã€‚ã“ã®å¢—ãˆæ–¹ã«æœ€ã‚‚è¿‘ã„è¨ˆç®—é‡ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "O(1)",
      "O(log n)",
      "O(n)",
      "O(nÂ²)"
    ],
    "a": 1,
    "exp": "äºŒåˆ†æŽ¢ç´¢ã¯æ¯”è¼ƒã®ãŸã³ã«æŽ¢ç´¢ç¯„å›²ã‚’ã»ã¼åŠåˆ†ã«ã™ã‚‹ãŸã‚ã€æ¯”è¼ƒå›žæ•°ã¯å¯¾æ•°çš„ã«å¢—ãˆã¾ã™ã€‚",
    "hint": "è¦ç´ æ•°ãŒ2å€ã«ãªã£ã¦ã‚‚æ¯”è¼ƒå›žæ•°ã¯ç´„1å›žã—ã‹å¢—ãˆã¾ã›ã‚“ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒäºŒåˆ†æŽ¢ç´¢ã¯O(log n)ã€å˜ç´”ãªç·šå½¢æŽ¢ç´¢ã¯O(n)ãŒç›®å®‰ã€ã€‚äºŒåˆ†æŽ¢ç´¢ã¯æ¯”è¼ƒã®ãŸã³ã«æŽ¢ç´¢ç¯„å›²ã‚’ã»ã¼åŠåˆ†ã«ã™ã‚‹ãŸã‚ã€æ¯”è¼ƒå›žæ•°ã¯å¯¾æ•°çš„ã«å¢—ãˆã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒO(1)ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "äºŒåˆ†æŽ¢ç´¢ã¯æ¯”è¼ƒã®ãŸã³ã«æŽ¢ç´¢ç¯„å›²ã‚’ã»ã¼åŠåˆ†ã«ã™ã‚‹ãŸã‚ã€æ¯”è¼ƒå›žæ•°ã¯å¯¾æ•°çš„ã«å¢—ãˆã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒäºŒåˆ†æŽ¢ç´¢ã¯O(log n)ã€å˜ç´”ãªç·šå½¢æŽ¢ç´¢ã¯O(n)ãŒç›®å®‰ã€ã€‚äºŒåˆ†æŽ¢ç´¢ã¯æ¯”è¼ƒã®ãŸã³ã«æŽ¢ç´¢ç¯„å›²ã‚’ã»ã¼åŠåˆ†ã«ã™ã‚‹ãŸã‚ã€æ¯”è¼ƒå›žæ•°ã¯å¯¾æ•°çš„ã«å¢—ãˆã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒO(n)ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒäºŒåˆ†æŽ¢ç´¢ã¯O(log n)ã€å˜ç´”ãªç·šå½¢æŽ¢ç´¢ã¯O(n)ãŒç›®å®‰ã€ã€‚äºŒåˆ†æŽ¢ç´¢ã¯æ¯”è¼ƒã®ãŸã³ã«æŽ¢ç´¢ç¯„å›²ã‚’ã»ã¼åŠåˆ†ã«ã™ã‚‹ãŸã‚ã€æ¯”è¼ƒå›žæ•°ã¯å¯¾æ•°çš„ã«å¢—ãˆã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒO(nÂ²)ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_03_02",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "algo-19",
    "cat": "ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ",
    "concept": "ãƒ¦ãƒ¼ã‚¯ãƒªãƒƒãƒ‰äº’é™¤æ³•",
    "difficulty": "æ¨™æº–",
    "q": "ãƒ¦ãƒ¼ã‚¯ãƒªãƒƒãƒ‰äº’é™¤æ³•ã§48ã¨18ã®æœ€å¤§å…¬ç´„æ•°ã‚’æ±‚ã‚ã‚‹ã¨ã„ãã¤ã‹ã€‚",
    "options": [
      "3",
      "12",
      "6",
      "2"
    ],
    "a": 2,
    "exp": "48 mod 18=12ã€18 mod 12=6ã€12 mod 6=0ãªã®ã§æœ€å¤§å…¬ç´„æ•°ã¯6ã§ã™ã€‚",
    "hint": "å¤§ãã„æ•°ã‚’å°ã•ã„æ•°ã§å‰²ã£ãŸä½™ã‚Šã‚’ç¹°ã‚Šè¿”ã—ã¾ã™ã€‚",
    "choiceExps": [
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ6ã€ã«ãªã‚‹ã€‚48 mod 18=12ã€18 mod 12=6ã€12 mod 6=0ãªã®ã§æœ€å¤§å…¬ç´„æ•°ã¯6ã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ6ã€ã«ãªã‚‹ã€‚48 mod 18=12ã€18 mod 12=6ã€12 mod 6=0ãªã®ã§æœ€å¤§å…¬ç´„æ•°ã¯6ã§ã™ã€‚",
      "48 mod 18=12ã€18 mod 12=6ã€12 mod 6=0ãªã®ã§æœ€å¤§å…¬ç´„æ•°ã¯6ã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ6ã€ã«ãªã‚‹ã€‚48 mod 18=12ã€18 mod 12=6ã€12 mod 6=0ãªã®ã§æœ€å¤§å…¬ç´„æ•°ã¯6ã§ã™ã€‚"
    ],
    "explainTopicId": "core_03_02",
    "explainTopicSource": "manual",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "algo-20",
    "cat": "ã‚¢ãƒ«ã‚´ãƒªã‚ºãƒ ",
    "concept": "é–¢æ•°",
    "difficulty": "åŸºç¤Ž",
    "q": "é–¢æ•° f(x) ãŒã€Œreturn xÃ—2+1ã€ã¨å®šç¾©ã•ã‚Œã¦ã„ã¾ã™ã€‚f(4) ã®æˆ»ã‚Šå€¤ã¯ï¼Ÿ",
    "options": [
      "17",
      "8",
      "10",
      "9"
    ],
    "a": 3,
    "exp": "4Ã—2+1=9ã§ã™ã€‚",
    "hint": "xã«4ã‚’ä»£å…¥ã—ã¦å¼ã‚’ãã®ã¾ã¾è¨ˆç®—ã—ã¾ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œxã«4ã‚’ä»£å…¥ã—ã¦å¼ã‚’ãã®ã¾ã¾è¨ˆç®—ã—ã¾ã™ã€ã€‚4Ã—2+1=9ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ17ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œxã«4ã‚’ä»£å…¥ã—ã¦å¼ã‚’ãã®ã¾ã¾è¨ˆç®—ã—ã¾ã™ã€ã€‚4Ã—2+1=9ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ8ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œxã«4ã‚’ä»£å…¥ã—ã¦å¼ã‚’ãã®ã¾ã¾è¨ˆç®—ã—ã¾ã™ã€ã€‚4Ã—2+1=9ã§ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ10ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "4Ã—2+1=9ã§ã™ã€‚"
    ],
    "explainTopicId": "core_03_02",
    "explainTopicSource": "manual",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "mgmt-14",
    "cat": "ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ",
    "concept": "ã‚¯ãƒªãƒ†ã‚£ã‚«ãƒ«ãƒ‘ã‚¹",
    "difficulty": "æ¨™æº–",
    "q": "ä½™è£•æ™‚é–“0æ—¥ã®ã‚¯ãƒªãƒ†ã‚£ã‚«ãƒ«ãƒ‘ã‚¹ä¸Šã«ã‚ã‚‹ä½œæ¥­ãŒ2æ—¥é…ã‚Œã€ä»–ã®æ¡ä»¶ã¯å¤‰ã‚ã‚‰ãªã„ã¨ã™ã‚‹ã€‚ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆå®Œäº†æ—¥ã¯é€šå¸¸ã©ã†ãªã‚‹ã‹ï¼Ÿ",
    "options": [
      "2æ—¥é…ã‚Œã‚‹",
      "å¤‰ã‚ã‚‰ãªã„",
      "1æ—¥æ—©ã¾ã‚‹",
      "å¾Œç¶šä½œæ¥­ã®é–‹å§‹ã‚‚é…ã‚Œã‚‹ãŸã‚ã€å®Œäº†æ—¥ã¯3æ—¥ä»¥ä¸Šé…ã‚Œã‚‹"
    ],
    "a": 0,
    "exp": "ã‚¯ãƒªãƒ†ã‚£ã‚«ãƒ«ãƒ‘ã‚¹ä¸Šã®ä½œæ¥­ã«ã¯ä½™è£•ãŒãªã„ãŸã‚ã€ãã®ä½œæ¥­ã®2æ—¥é…å»¶ã¯é€šå¸¸ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆå…¨ä½“ã®å®Œäº†ã‚’2æ—¥é…ã‚‰ã›ã¾ã™ã€‚",
    "hint": "ä½™è£•æ™‚é–“ãŒ0æ—¥ã®çµŒè·¯ä¸Šã®é…ã‚Œã§ã™ã€‚",
    "choiceExps": [
      "ã‚¯ãƒªãƒ†ã‚£ã‚«ãƒ«ãƒ‘ã‚¹ä¸Šã®ä½œæ¥­ã«ã¯ä½™è£•ãŒãªã„ãŸã‚ã€ãã®ä½œæ¥­ã®2æ—¥é…å»¶ã¯é€šå¸¸ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆå…¨ä½“ã®å®Œäº†ã‚’2æ—¥é…ã‚‰ã›ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä½™è£•æ™‚é–“ãŒ0æ—¥ã®çµŒè·¯ä¸Šã®é…ã‚Œã§ã™ã€ã€‚ã‚¯ãƒªãƒ†ã‚£ã‚«ãƒ«ãƒ‘ã‚¹ä¸Šã®ä½œæ¥­ã«ã¯ä½™è£•ãŒãªã„ãŸã‚ã€ãã®ä½œæ¥­ã®2æ—¥é…å»¶ã¯é€šå¸¸ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆå…¨ä½“ã®å®Œäº†ã‚’2æ—¥é…ã‚‰ã›ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå¤‰ã‚ã‚‰ãªã„ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä½™è£•æ™‚é–“ãŒ0æ—¥ã®çµŒè·¯ä¸Šã®é…ã‚Œã§ã™ã€ã€‚ã‚¯ãƒªãƒ†ã‚£ã‚«ãƒ«ãƒ‘ã‚¹ä¸Šã®ä½œæ¥­ã«ã¯ä½™è£•ãŒãªã„ãŸã‚ã€ãã®ä½œæ¥­ã®2æ—¥é…å»¶ã¯é€šå¸¸ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆå…¨ä½“ã®å®Œäº†ã‚’2æ—¥é…ã‚‰ã›ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œ1æ—¥æ—©ã¾ã‚‹ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œä½™è£•æ™‚é–“ãŒ0æ—¥ã®çµŒè·¯ä¸Šã®é…ã‚Œã§ã™ã€ã€‚ã“ã®ãŸã‚ã€Œå¾Œç¶šä½œæ¥­ã®é–‹å§‹ã‚‚é…ã‚Œã‚‹ãŸã‚ã€å®Œäº†æ—¥ã¯3æ—¥ä»¥ä¸Šé…ã‚Œã‚‹ã€ã®ã‚ˆã†ã«æ–­å®šã™ã‚‹ã¨ã€å•é¡Œã®æ¡ä»¶ãƒ»å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_14_04",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "mgmt-15",
    "cat": "ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ",
    "concept": "EVM",
    "difficulty": "æ¨™æº–",
    "q": "EVMã§EV=80ã€AC=100ã®ã¨ãã€ã‚³ã‚¹ãƒˆåŠ¹çŽ‡æŒ‡æ•°CPI=EV/ACã¯ã„ãã¤ã‹ã€‚",
    "options": [
      "1.0",
      "0.8",
      "1.25",
      "0.2"
    ],
    "a": 1,
    "exp": "CPI=EVÃ·AC=80Ã·100=0.8ã§ã™ã€‚1æœªæº€ãªã®ã§ã€å¾—ã‚‰ã‚ŒãŸä¾¡å€¤ã«å¯¾ã—ã¦å®Ÿã‚³ã‚¹ãƒˆãŒå¤§ãã„çŠ¶æ…‹ã§ã™ã€‚",
    "hint": "CPIã¯EVã‚’ACã§å‰²ã‚Šã¾ã™ã€‚",
    "choiceExps": [
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ0.8ã€ã«ãªã‚‹ã€‚CPI=EVÃ·AC=80Ã·100=0.8ã§ã™ã€‚1æœªæº€ãªã®ã§ã€å¾—ã‚‰ã‚ŒãŸä¾¡å€¤ã«å¯¾ã—ã¦å®Ÿã‚³ã‚¹ãƒˆãŒå¤§ãã„çŠ¶æ…‹ã§ã™ã€‚",
      "CPI=EVÃ·AC=80Ã·100=0.8ã§ã™ã€‚1æœªæº€ãªã®ã§ã€å¾—ã‚‰ã‚ŒãŸä¾¡å€¤ã«å¯¾ã—ã¦å®Ÿã‚³ã‚¹ãƒˆãŒå¤§ãã„çŠ¶æ…‹ã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ0.8ã€ã«ãªã‚‹ã€‚CPI=EVÃ·AC=80Ã·100=0.8ã§ã™ã€‚1æœªæº€ãªã®ã§ã€å¾—ã‚‰ã‚ŒãŸä¾¡å€¤ã«å¯¾ã—ã¦å®Ÿã‚³ã‚¹ãƒˆãŒå¤§ãã„çŠ¶æ…‹ã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ0.8ã€ã«ãªã‚‹ã€‚CPI=EVÃ·AC=80Ã·100=0.8ã§ã™ã€‚1æœªæº€ãªã®ã§ã€å¾—ã‚‰ã‚ŒãŸä¾¡å€¤ã«å¯¾ã—ã¦å®Ÿã‚³ã‚¹ãƒˆãŒå¤§ãã„çŠ¶æ…‹ã§ã™ã€‚"
    ],
    "explainTopicId": "core_14_05",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "mgmt-16",
    "cat": "ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ",
    "concept": "EVM",
    "difficulty": "æ¨™æº–",
    "q": "EVMã§EV=80ã€PV=100ã®ã¨ãã€ã‚¹ã‚±ã‚¸ãƒ¥ãƒ¼ãƒ«åŠ¹çŽ‡æŒ‡æ•°SPI=EV/PVã¯ã„ãã¤ã‹ã€‚",
    "options": [
      "1.25",
      "0.2",
      "0.8",
      "1.0"
    ],
    "a": 2,
    "exp": "SPI=EVÃ·PV=80Ã·100=0.8ã§ã™ã€‚1æœªæº€ãªã®ã§ã€è¨ˆç”»ã‚ˆã‚Šé€²æ—ãŒé…ã‚Œã¦ã„ã‚‹çŠ¶æ…‹ã§ã™ã€‚",
    "hint": "SPIã¯EVã‚’PVã§å‰²ã‚Šã¾ã™ã€‚",
    "choiceExps": [
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ0.8ã€ã«ãªã‚‹ã€‚SPI=EVÃ·PV=80Ã·100=0.8ã§ã™ã€‚1æœªæº€ãªã®ã§ã€è¨ˆç”»ã‚ˆã‚Šé€²æ—ãŒé…ã‚Œã¦ã„ã‚‹çŠ¶æ…‹ã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ0.8ã€ã«ãªã‚‹ã€‚SPI=EVÃ·PV=80Ã·100=0.8ã§ã™ã€‚1æœªæº€ãªã®ã§ã€è¨ˆç”»ã‚ˆã‚Šé€²æ—ãŒé…ã‚Œã¦ã„ã‚‹çŠ¶æ…‹ã§ã™ã€‚",
      "SPI=EVÃ·PV=80Ã·100=0.8ã§ã™ã€‚1æœªæº€ãªã®ã§ã€è¨ˆç”»ã‚ˆã‚Šé€²æ—ãŒé…ã‚Œã¦ã„ã‚‹çŠ¶æ…‹ã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ0.8ã€ã«ãªã‚‹ã€‚SPI=EVÃ·PV=80Ã·100=0.8ã§ã™ã€‚1æœªæº€ãªã®ã§ã€è¨ˆç”»ã‚ˆã‚Šé€²æ—ãŒé…ã‚Œã¦ã„ã‚‹çŠ¶æ…‹ã§ã™ã€‚"
    ],
    "explainTopicId": "core_14_05",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "mgmt-17",
    "cat": "ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ",
    "concept": "ãƒªã‚¹ã‚¯å¯¾å¿œ",
    "difficulty": "æ¨™æº–",
    "q": "äº‹æ•…æ™‚ã«1,000ä¸‡å††ã®æå¤±ãŒç™ºç”Ÿã™ã‚‹å¯èƒ½æ€§ãŒã‚ã‚‹ãŸã‚ä¿é™ºã¸åŠ å…¥ã—ã€é‡‘éŠ­çš„å½±éŸ¿ã®ä¸€éƒ¨ã‚’ä¿é™ºä¼šç¤¾ã¸è² æ‹…ã—ã¦ã‚‚ã‚‰ã†ã€‚ã“ã®å¯¾å¿œã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ãƒªã‚¹ã‚¯å›žé¿",
      "ãƒªã‚¹ã‚¯å—å®¹",
      "ãƒªã‚¹ã‚¯å¢—å¤§",
      "ãƒªã‚¹ã‚¯ç§»è»¢"
    ],
    "a": 3,
    "exp": "ä¿é™ºã‚„å¥‘ç´„ãªã©ã‚’ä½¿ã£ã¦ãƒªã‚¹ã‚¯ã«ã‚ˆã‚‹å½±éŸ¿ã‚’ç¬¬ä¸‰è€…ã¸ç§»ã™å¯¾å¿œã‚’ãƒªã‚¹ã‚¯ç§»è»¢ã¨ã„ã„ã¾ã™ã€‚",
    "hint": "ãƒªã‚¹ã‚¯ãã®ã‚‚ã®ã‚’ãªãã™ã®ã§ã¯ãªãã€å½±éŸ¿ã‚’ä»–è€…ã¸ç§»ã—ã¾ã™ã€‚",
    "choiceExps": [
      "ã€Œãƒªã‚¹ã‚¯ã€ã¯ã€æœ›ã¾ã—ããªã„å‡ºæ¥äº‹ãŒèµ·ã“ã‚‹å¯èƒ½æ€§ã¨ã€ãã®å½±éŸ¿ã‚’çµ„ã¿åˆã‚ã›ã¦è€ƒãˆãŸã‚‚ã®ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œãƒªã‚¹ã‚¯ã€ã¯ã€æœ›ã¾ã—ããªã„å‡ºæ¥äº‹ãŒèµ·ã“ã‚‹å¯èƒ½æ€§ã¨ã€ãã®å½±éŸ¿ã‚’çµ„ã¿åˆã‚ã›ã¦è€ƒãˆãŸã‚‚ã®ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œãƒªã‚¹ã‚¯ã€ã¯ã€æœ›ã¾ã—ããªã„å‡ºæ¥äº‹ãŒèµ·ã“ã‚‹å¯èƒ½æ€§ã¨ã€ãã®å½±éŸ¿ã‚’çµ„ã¿åˆã‚ã›ã¦è€ƒãˆãŸã‚‚ã®ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ä¿é™ºã‚„å¥‘ç´„ãªã©ã‚’ä½¿ã£ã¦ãƒªã‚¹ã‚¯ã«ã‚ˆã‚‹å½±éŸ¿ã‚’ç¬¬ä¸‰è€…ã¸ç§»ã™å¯¾å¿œã‚’ãƒªã‚¹ã‚¯ç§»è»¢ã¨ã„ã„ã¾ã™ã€‚"
    ],
    "explainTopicId": "core_14_06",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "mgmt-18",
    "cat": "ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ",
    "concept": "ã‚¤ãƒ³ã‚·ãƒ‡ãƒ³ãƒˆç®¡ç†",
    "difficulty": "åŸºç¤Ž",
    "q": "å…¨ç¤¾ãƒ­ã‚°ã‚¤ãƒ³éšœå®³ãŒç™ºç”Ÿã—ãŸã€‚æ ¹æœ¬åŽŸå› ã®å®Œå…¨è§£æ˜Žã‚’å¾…ã¤ã‚ˆã‚Šå…ˆã«ã€æš«å®šç­–ã§ã‚‚åˆ©ç”¨è€…ãŒå†ã³ä½¿ãˆã‚‹çŠ¶æ…‹ã¸æˆ»ã™ã“ã¨ã‚’å„ªå…ˆã™ã‚‹ç®¡ç†æ´»å‹•ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ã‚¤ãƒ³ã‚·ãƒ‡ãƒ³ãƒˆç®¡ç†",
      "å¤‰æ›´ç®¡ç†",
      "æ§‹æˆç®¡ç†",
      "å•é¡Œç®¡ç†"
    ],
    "a": 0,
    "exp": "ã‚¤ãƒ³ã‚·ãƒ‡ãƒ³ãƒˆç®¡ç†ã¯ã‚µãƒ¼ãƒ“ã‚¹ã‚’æ­£å¸¸çŠ¶æ…‹ã¸è¿…é€Ÿã«æˆ»ã—ã€æ¥­å‹™ã¸ã®å½±éŸ¿ã‚’æœ€å°åŒ–ã™ã‚‹ã“ã¨ã‚’é‡è¦–ã—ã¾ã™ã€‚",
    "hint": "ã€Žã¾ãšã‚µãƒ¼ãƒ“ã‚¹ã‚’æˆ»ã™ã€æ´»å‹•ã§ã™ã€‚",
    "choiceExps": [
      "ã‚¤ãƒ³ã‚·ãƒ‡ãƒ³ãƒˆç®¡ç†ã¯ã‚µãƒ¼ãƒ“ã‚¹ã‚’æ­£å¸¸çŠ¶æ…‹ã¸è¿…é€Ÿã«æˆ»ã—ã€æ¥­å‹™ã¸ã®å½±éŸ¿ã‚’æœ€å°åŒ–ã™ã‚‹ã“ã¨ã‚’é‡è¦–ã—ã¾ã™ã€‚",
      "å¤‰æ›´ç®¡ç†ã¯å¤‰æ›´è¦æ±‚ã®å½±éŸ¿è©•ä¾¡ãƒ»æ‰¿èªãƒ»å®Ÿæ–½ã‚’ç®¡ç†ã™ã‚‹ã€‚",
      "æ§‹æˆç®¡ç†ã¯ITè³‡ç”£ã‚„æ§‹æˆã‚¢ã‚¤ãƒ†ãƒ ã®è­˜åˆ¥ãƒ»ç‰ˆãƒ»é–¢ä¿‚ã‚’ç®¡ç†ã™ã‚‹ã€‚",
      "å•é¡Œç®¡ç†ã¯æ ¹æœ¬åŽŸå› ã®åˆ†æžã¨å†ç™ºé˜²æ­¢ã‚’ä¸»ç›®çš„ã¨ã™ã‚‹ã€‚"
    ],
    "explainTopicId": "core_15_08",
    "explainTopicSource": "semantic",
    "qualityOverride": "v89-near-domain-distractors",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "mgmt-19",
    "cat": "ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ",
    "concept": "å¤‰æ›´ç®¡ç†",
    "difficulty": "åŸºç¤Ž",
    "q": "æœ¬ç•ªã‚·ã‚¹ãƒ†ãƒ ã¸æ©Ÿèƒ½å¤‰æ›´ã‚’åŠ ãˆã‚‹å‰ã«ã€å½±éŸ¿ã‚„ãƒªã‚¹ã‚¯ã‚’è©•ä¾¡ã—ã€æ‰¿èªãƒ»å®Ÿæ–½æ—¥ç¨‹ã‚’ç®¡ç†ã™ã‚‹æ´»å‹•ã¯ï¼Ÿ",
    "options": [
      "ãƒªãƒªãƒ¼ã‚¹å¾Œã®å•é¡Œç®¡ç†",
      "å¤‰æ›´ç®¡ç†",
      "å¯ç”¨æ€§ç®¡ç†",
      "å®¹é‡ç®¡ç†"
    ],
    "a": 1,
    "exp": "å¤‰æ›´ç®¡ç†ã§ã¯å¤‰æ›´è¦æ±‚ã‚’è©•ä¾¡ã—ã€æ‰¿èªã‚„ã‚¹ã‚±ã‚¸ãƒ¥ãƒ¼ãƒ«ã‚’çµ±åˆ¶ã—ã¦ã€å¤‰æ›´ã«ã‚ˆã‚‹éšœå®³ãƒªã‚¹ã‚¯ã‚’æŠ‘ãˆã¾ã™ã€‚",
    "hint": "æœ¬ç•ªç’°å¢ƒã‚’å¤‰æ›´ã™ã‚‹å‰ã®è©•ä¾¡ã¨æ‰¿èªã«æ³¨ç›®ã—ã¾ã™ã€‚",
    "choiceExps": [
      "ã€Œå•é¡Œç®¡ç†ã€ã¯ã€éšœå®³ã®æ ¹æœ¬åŽŸå› ã‚’èª¿ã¹ã€å†ç™ºé˜²æ­¢ã«ã¤ãªã’ã‚‹ç®¡ç†ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "å¤‰æ›´ç®¡ç†ã§ã¯å¤‰æ›´è¦æ±‚ã‚’è©•ä¾¡ã—ã€æ‰¿èªã‚„ã‚¹ã‚±ã‚¸ãƒ¥ãƒ¼ãƒ«ã‚’çµ±åˆ¶ã—ã¦ã€å¤‰æ›´ã«ã‚ˆã‚‹éšœå®³ãƒªã‚¹ã‚¯ã‚’æŠ‘ãˆã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œæ§‹æˆç®¡ç†ã¯ã€ã‚½ãƒ¼ã‚¹ã‚³ãƒ¼ãƒ‰ã‚„è¨­å®šãƒ•ã‚¡ã‚¤ãƒ«ãªã©ã€Œä½•ãŒã©ã®ç‰ˆã‹ã€ã‚’ç®¡ç†ã™ã‚‹ã“ã¨ã§ã™ã€‚å¤‰æ›´ç®¡ç†ã¯ã€å¤‰æ›´ã®å¿…è¦æ€§ãƒ»å½±éŸ¿ãƒ»æ‰¿èªãƒ»å®Ÿæ–½ã‚’ç®¡ç†ã—ã¾ã™ã€ã€‚å¤‰æ›´ç®¡ç†ã§ã¯å¤‰æ›´è¦æ±‚ã‚’è©•ä¾¡ã—ã€æ‰¿èªã‚„ã‚¹ã‚±ã‚¸ãƒ¥ãƒ¼ãƒ«ã‚’çµ±åˆ¶ã—ã¦ã€å¤‰æ›´ã«ã‚ˆã‚‹éšœå®³ãƒªã‚¹ã‚¯ã‚’æŠ‘ãˆã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå¯ç”¨æ€§ç®¡ç†ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€Œæ§‹æˆç®¡ç†ã¯ã€ã‚½ãƒ¼ã‚¹ã‚³ãƒ¼ãƒ‰ã‚„è¨­å®šãƒ•ã‚¡ã‚¤ãƒ«ãªã©ã€Œä½•ãŒã©ã®ç‰ˆã‹ã€ã‚’ç®¡ç†ã™ã‚‹ã“ã¨ã§ã™ã€‚å¤‰æ›´ç®¡ç†ã¯ã€å¤‰æ›´ã®å¿…è¦æ€§ãƒ»å½±éŸ¿ãƒ»æ‰¿èªãƒ»å®Ÿæ–½ã‚’ç®¡ç†ã—ã¾ã™ã€ã€‚å¤‰æ›´ç®¡ç†ã§ã¯å¤‰æ›´è¦æ±‚ã‚’è©•ä¾¡ã—ã€æ‰¿èªã‚„ã‚¹ã‚±ã‚¸ãƒ¥ãƒ¼ãƒ«ã‚’çµ±åˆ¶ã—ã¦ã€å¤‰æ›´ã«ã‚ˆã‚‹éšœå®³ãƒªã‚¹ã‚¯ã‚’æŠ‘ãˆã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€Œå®¹é‡ç®¡ç†ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_13_04",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "æƒ³èµ·",
    "recallAudit": "v93-retained",
    "recallDemand": "ç”¨èªžãƒ»å½¹å‰²"
  },
  {
    "id": "mgmt-20",
    "cat": "ãƒžãƒã‚¸ãƒ¡ãƒ³ãƒˆ",
    "concept": "ã‚µãƒ¼ãƒ“ã‚¹ãƒ‡ã‚¹ã‚¯",
    "difficulty": "åŸºç¤Ž",
    "q": "åˆ©ç”¨è€…ãŒéšœå®³é€£çµ¡ãƒ»æ“ä½œè³ªå•ãƒ»ä¾é ¼ã‚’ã©ã“ã¸å‡ºã›ã°ã‚ˆã„ã‹è¿·ã‚ãªã„ã‚ˆã†ã€ITã‚µãƒ¼ãƒ“ã‚¹ã®å—ä»˜çª“å£ã‚’ä¸€å…ƒåŒ–ã—ãŸã„ã€‚ã“ã®å½¹å‰²ã‚’æ‹…ã†ã‚‚ã®ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "éšœå®³ã®æ ¹æœ¬åŽŸå› ã‚’åˆ†æžã—ã€å†ç™ºé˜²æ­¢ã¸ã¤ãªã’ã‚‹å•é¡Œç®¡ç†",
      "æœ¬ç•ªå¤‰æ›´ã®å½±éŸ¿ã‚’å¯©æŸ»ã—ã€æ‰¿èªãƒ»æ—¥ç¨‹ã‚’ç®¡ç†ã™ã‚‹å¤‰æ›´ç®¡ç†",
      "åˆ©ç”¨è€…ã‹ã‚‰ã®å•ã„åˆã‚ã›ã‚„éšœå®³é€£çµ¡ã‚’ä¸€å…ƒçš„ã«å—ã‘ã‚‹ã‚µãƒ¼ãƒ“ã‚¹ãƒ‡ã‚¹ã‚¯",
      "ITè³‡ç”£ã‚„æ§‹æˆæƒ…å ±ã‚’è­˜åˆ¥ãƒ»è¨˜éŒ²ã—ã¦ç¶­æŒã™ã‚‹æ§‹æˆç®¡ç†"
    ],
    "a": 2,
    "exp": "ã‚µãƒ¼ãƒ“ã‚¹ãƒ‡ã‚¹ã‚¯ã¯åˆ©ç”¨è€…ã¨ITã‚µãƒ¼ãƒ“ã‚¹æä¾›å´ã®å˜ä¸€çª“å£ã¨ãªã‚Šã€å•ã„åˆã‚ã›ãƒ»ã‚¤ãƒ³ã‚·ãƒ‡ãƒ³ãƒˆãªã©ã‚’å—ã‘ä»˜ã‘ã¾ã™ã€‚",
    "hint": "åˆ©ç”¨è€…ãŒå›°ã£ãŸã¨ãã«ã¾ãšé€£çµ¡ã™ã‚‹çª“å£ã§ã™ã€‚",
    "choiceExps": [
      "ã€Œå•é¡Œç®¡ç†ã€ã¯ã€éšœå®³ã®æ ¹æœ¬åŽŸå› ã‚’èª¿ã¹ã€å†ç™ºé˜²æ­¢ã«ã¤ãªã’ã‚‹ç®¡ç†ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã€Œå¤‰æ›´ç®¡ç†ã€ã¯ã€å¤‰æ›´ã®è¦æ±‚ãƒ»å½±éŸ¿ãƒ»æ‰¿èªãƒ»å®Ÿæ–½ãƒ»ç¢ºèªã‚’ç®¡ç†ã™ã‚‹ã“ã¨ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚",
      "ã‚µãƒ¼ãƒ“ã‚¹ãƒ‡ã‚¹ã‚¯ã¯åˆ©ç”¨è€…ã¨ITã‚µãƒ¼ãƒ“ã‚¹æä¾›å´ã®å˜ä¸€çª“å£ã¨ãªã‚Šã€å•ã„åˆã‚ã›ãƒ»ã‚¤ãƒ³ã‚·ãƒ‡ãƒ³ãƒˆãªã©ã‚’å—ã‘ä»˜ã‘ã¾ã™ã€‚",
      "ã€Œæ§‹æˆç®¡ç†ã€ã¯ã€ã‚½ãƒ¼ã‚¹ã‚³ãƒ¼ãƒ‰ã‚„è¨­å®šãªã©ã€æˆæžœç‰©ã®ç‰ˆã‚„çµ„åˆã›ã‚’ç®¡ç†ã™ã‚‹ã“ã¨ã§ã™ã€‚ ã“ã®å•é¡Œã§æ±‚ã‚ã‚‹å†…å®¹ã¨ã¯ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_15_03",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "strat-15",
    "cat": "ã‚¹ãƒˆãƒ©ãƒ†ã‚¸",
    "concept": "KGI/KPI",
    "difficulty": "æ¨™æº–",
    "q": "çµŒå–¶ç›®æ¨™ã¨ã—ã¦ã€Žå¹´é–“å£²ä¸Š10å„„å††ã€ã‚’ç½®ãã€ãã®é”æˆéŽç¨‹ã‚’è¦‹ã‚‹ãŸã‚ã€Žæœˆé–“å•†è«‡æ•°ã€ã€Žæˆç´„çŽ‡ã€ã‚’è¿½è·¡ã™ã‚‹ã€‚ã“ã®ã¨ãKGIã¨KPIã®é–¢ä¿‚ã¨ã—ã¦é©åˆ‡ãªã‚‚ã®ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "KGIã¯é€”ä¸­çµŒéŽã‚’æ¸¬ã‚‹æŒ‡æ¨™ã€KPIã¯æœ€çµ‚ç›®æ¨™ã®é”æˆåº¦ã‚’æ¸¬ã‚‹æŒ‡æ¨™ã§ã‚ã‚‹",
      "KGIã¯æœ€çµ‚æˆæžœã€KPIã‚‚æœ€çµ‚æˆæžœã‚’ã‚ˆã‚Šç´°ã‹ã„æœŸé–“ã§è¿½è·¡ã™ã‚‹æŒ‡æ¨™ã§ã‚ã‚‹",
      "KGIã¨KPIã¯åŒã˜æ•°å€¤ãƒ»å˜ä½ã§è¨­å®šã—ãªã‘ã‚Œã°ãªã‚‰ãªã„",
      "KGIã¯æœ€çµ‚çš„ãªç›®æ¨™é”æˆåº¦ã€KPIã¯ãã®é”æˆéŽç¨‹ã‚’æ¸¬ã‚‹é‡è¦æŒ‡æ¨™"
    ],
    "a": 3,
    "exp": "KGIã¯æœ€çµ‚ç›®æ¨™ã®é”æˆåº¦ã‚’è¡¨ã—ã€KPIã¯KGIé”æˆã¸å‘ã‘ãŸé‡è¦ãªãƒ—ãƒ­ã‚»ã‚¹ã‚„ä¸­é–“æˆæžœã‚’æ¸¬ã‚Šã¾ã™ã€‚",
    "hint": "ã‚´ãƒ¼ãƒ«ãã®ã‚‚ã®ã¨ã€ã‚´ãƒ¼ãƒ«ã¸å‘ã‹ã†é€”ä¸­ã®æŒ‡æ¨™ã‚’åŒºåˆ¥ã—ã¾ã™ã€‚",
    "choiceExps": [
      "KGIã¨KPIã®å½¹å‰²ãŒé€†ã€‚KGIãŒæœ€çµ‚ç›®æ¨™ã€KPIãŒãã®é”æˆéŽç¨‹ã‚’æ¸¬ã‚‹ã€‚",
      "KPIã¯æœ€çµ‚æˆæžœã ã‘ã§ãªãã€æœ€çµ‚ç›®æ¨™ã¸å‘ã‹ã†é€”ä¸­ã®é‡è¦ãªçŠ¶æ…‹ãƒ»æ´»å‹•ã‚’æ¸¬ã‚‹ã€‚",
      "KGIã¨KPIã¯å½¹å‰²ãŒç•°ãªã‚‹ãŸã‚ã€åŒã˜æ•°å€¤ã‚„åŒã˜å˜ä½ã§ã‚ã‚‹å¿…è¦ã¯ãªã„ã€‚",
      "KGIã¯æœ€çµ‚ç›®æ¨™ã®é”æˆåº¦ã‚’è¡¨ã—ã€KPIã¯KGIé”æˆã¸å‘ã‘ãŸé‡è¦ãªãƒ—ãƒ­ã‚»ã‚¹ã‚„ä¸­é–“æˆæžœã‚’æ¸¬ã‚Šã¾ã™ã€‚"
    ],
    "explainTopicId": "core_18_04",
    "explainTopicSource": "semantic",
    "qualityOverride": "v78-plausible-distractors",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "strat-16",
    "cat": "ã‚¹ãƒˆãƒ©ãƒ†ã‚¸",
    "concept": "ROI",
    "difficulty": "æ¨™æº–",
    "q": "100ä¸‡å††ã‚’æŠ•è³‡ã—ã€ãã®æŠ•è³‡ã«ã‚ˆã£ã¦20ä¸‡å††ã®åˆ©ç›Šã‚’å¾—ãŸã¨ã™ã‚‹ã€‚ROIã‚’åˆ©ç›ŠÃ·æŠ•è³‡é¡ã§æ±‚ã‚ã‚‹ã¨ï¼Ÿ",
    "options": [
      "20%",
      "120%",
      "5%",
      "80%"
    ],
    "a": 0,
    "exp": "ROI=20ä¸‡å††Ã·100ä¸‡å††Ã—100=20%ã§ã™ã€‚",
    "hint": "åˆ©ç›Šã‚’æŠ•è³‡é¡ã§å‰²ã£ã¦ç™¾åˆ†çŽ‡ã«ã—ã¾ã™ã€‚",
    "choiceExps": [
      "ROI=20ä¸‡å††Ã·100ä¸‡å††Ã—100=20%ã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ20%ã€ã«ãªã‚‹ã€‚ROI=20ä¸‡å††Ã·100ä¸‡å††Ã—100=20%ã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ20%ã€ã«ãªã‚‹ã€‚ROI=20ä¸‡å††Ã·100ä¸‡å††Ã—100=20%ã§ã™ã€‚",
      "æ¡ä»¶ã‚’æ­£ã—ãå¼ã¸å…¥ã‚Œã‚‹ã¨æ­£è§£å€¤ã¯ã€Œ20%ã€ã«ãªã‚‹ã€‚ROI=20ä¸‡å††Ã·100ä¸‡å††Ã—100=20%ã§ã™ã€‚"
    ],
    "explainTopicId": "core_18_04",
    "explainTopicSource": "manual",
    "cognitiveLevel": "åˆ¤æ–­",
    "judgmentAudit": "v91-pass",
    "judgmentDemand": "æ–‡è„ˆæ¯”è¼ƒ"
  },
  {
    "id": "strat-17",
    "cat": "ã‚¹ãƒˆãƒ©ãƒ†ã‚¸",
    "concept": "PESTåˆ†æž",
    "difficulty": "æ¨™æº–",
    "q": "æµ·å¤–å±•é–‹ã‚’æ¤œè¨Žã™ã‚‹ä¼æ¥­ãŒã€å€‹äººæƒ…å ±ä¿è­·è¦åˆ¶ã®æ”¹æ­£ã‚„æ”¿åºœã®ç”£æ¥­æ”¿ç­–ã‚’å¤–éƒ¨ç’°å¢ƒã¨ã—ã¦åˆ†æžã™ã‚‹ã€‚PESTã§ã¯ä¸»ã«ã©ã®è¦å› ã«åˆ†é¡žã™ã‚‹ã‹ã€‚",
    "options": [
      "Economicï¼ˆçµŒæ¸ˆçš„è¦å› ï¼‰",
      "Politicalï¼ˆæ”¿æ²»çš„è¦å› ï¼‰",
      "Socialï¼ˆç¤¾ä¼šçš„è¦å› ï¼‰",
      "Technologicalï¼ˆæŠ€è¡“çš„è¦å› ï¼‰"
    ],
    "a": 1,
    "exp": "æ³•åˆ¶åº¦ãƒ»è¦åˆ¶ãƒ»æ”¿åºœæ–¹é‡ãªã©ã¯Politicalï¼ˆæ”¿æ²»çš„è¦å› ï¼‰ã«åˆ†é¡žã—ã¾ã™ã€‚",
    "hint": "æ”¿åºœã‚„æ³•å¾‹ã«é–¢ã‚ã‚‹å¤–éƒ¨ç’°å¢ƒã§ã™ã€‚",
    "choiceExps": [
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒSWOTãƒ»PESTãªã©åˆ†æžæ‰‹æ³•ã€ã€‚æ³•åˆ¶åº¦ãƒ»è¦åˆ¶ãƒ»æ”¿åºœæ–¹é‡ãªã©ã¯Politicalï¼ˆæ”¿æ²»çš„è¦å› ï¼‰ã«åˆ†é¡žã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒEconomicï¼ˆçµŒæ¸ˆçš„è¦å› ï¼‰ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "æ³•åˆ¶åº¦ãƒ»è¦åˆ¶ãƒ»æ”¿åºœæ–¹é‡ãªã©ã¯Politicalï¼ˆæ”¿æ²»çš„è¦å› ï¼‰ã«åˆ†é¡žã—ã¾ã™ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒSWOTãƒ»PESTãªã©åˆ†æžæ‰‹æ³•ã€ã€‚æ³•åˆ¶åº¦ãƒ»è¦åˆ¶ãƒ»æ”¿åºœæ–¹é‡ãªã©ã¯Politicalï¼ˆæ”¿æ²»çš„è¦å› ï¼‰ã«åˆ†é¡žã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒSocialï¼ˆç¤¾ä¼šçš„è¦å› ï¼‰ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚",
      "åˆ¤æ–­ã®æ ¹æ‹ ã¯ã€ŒSWOTãƒ»PESTãªã©åˆ†æžæ‰‹æ³•ã€ã€‚æ³•åˆ¶åº¦ãƒ»è¦åˆ¶ãƒ»æ”¿åºœæ–¹é‡ãªã©ã¯Politicalï¼ˆæ”¿æ²»çš„è¦å› ï¼‰ã«åˆ†é¡žã—ã¾ã™ã€‚ ã—ãŸãŒã£ã¦ã€ŒTechnologicalï¼ˆæŠ€è¡“çš„è¦å› ï¼‰ã€ã¯å•é¡Œæ–‡ã®æ¡ä»¶ã¾ãŸã¯å®šç¾©ã¨ä¸€è‡´ã—ãªã„ã€‚"
    ],
    "explainTopicId": "core_18_01",
    "explainTopicSource": "semantic",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "strat-18",
    "cat": "ã‚¹ãƒˆãƒ©ãƒ†ã‚¸",
    "concept": "ãƒãƒªãƒ¥ãƒ¼ãƒã‚§ãƒ¼ãƒ³",
    "difficulty": "æ¨™æº–",
    "q": "è‡ªç¤¾ã®ä¾¡å€¤å‰µå‡ºæ´»å‹•ã‚’ã€è³¼è²·ç‰©æµãƒ»è£½é€ ãƒ»å‡ºè·ç‰©æµãƒ»è²©å£²ãƒ»ã‚µãƒ¼ãƒ“ã‚¹ãªã©ã®æµã‚Œã§æ‰ãˆãŸã„ã€‚ãƒãƒªãƒ¥ãƒ¼ãƒã‚§ãƒ¼ãƒ³ã®ä¸»æ´»å‹•ã®çµ„åˆã›ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "äººäº‹ç®¡ç†ãƒ»æŠ€è¡“é–‹ç™ºãƒ»èª¿é”ãƒ»å…¨ç¤¾ç®¡ç†",
      "èª¿é”ãƒ»äººäº‹ç®¡ç†ãƒ»æŠ€è¡“é–‹ç™ºãƒ»ã‚µãƒ¼ãƒ“ã‚¹",
      "è³¼è²·ç‰©æµãƒ»è£½é€ ãƒ»å‡ºè·ç‰©æµãƒ»è²©å£²ãƒ»ã‚µãƒ¼ãƒ“ã‚¹",
      "è£½é€ ãƒ»äººäº‹ç®¡ç†ãƒ»æŠ€è¡“é–‹ç™ºãƒ»å…¨ç¤¾ç®¡ç†"
    ],
    "a": 2,
    "exp": "ãƒãƒªãƒ¥ãƒ¼ãƒã‚§ãƒ¼ãƒ³ã®ä¸»æ´»å‹•ã«ã¯è³¼è²·ç‰©æµã€è£½é€ ã€å‡ºè·ç‰©æµã€ãƒžãƒ¼ã‚±ãƒ†ã‚£ãƒ³ã‚°ãƒ»è²©å£²ã€ã‚µãƒ¼ãƒ“ã‚¹ãªã©ãŒã‚ã‚Šã¾ã™ã€‚äººäº‹ã‚„æŠ€è¡“é–‹ç™ºãªã©ã¯æ”¯æ´æ´»å‹•ã§ã™ã€‚",
    "hint": "è£½å“ã‚„ã‚µãƒ¼ãƒ“ã‚¹ãŒé¡§å®¢ã¸å±Šãæµã‚Œã«ç›´æŽ¥é–¢ã‚ã‚‹æ´»å‹•ã‚’é¸ã³ã¾ã™ã€‚",
    "choiceExps": [
      "äººäº‹ç®¡ç†ãƒ»æŠ€è¡“é–‹ç™ºãƒ»èª¿é”ãƒ»å…¨ç¤¾ç®¡ç†ã¯ä»£è¡¨çš„ãªæ”¯æ´æ´»å‹•ã®çµ„åˆã›ã€‚",
      "ã‚µãƒ¼ãƒ“ã‚¹ã¯ä¸»æ´»å‹•ã ãŒã€èª¿é”ãƒ»äººäº‹ç®¡ç†ãƒ»æŠ€è¡“é–‹ç™ºã¯æ”¯æ´æ´»å‹•ãªã®ã§æ··åœ¨ã—ã¦ã„ã‚‹ã€‚",
      "ãƒãƒªãƒ¥ãƒ¼ãƒã‚§ãƒ¼ãƒ³ã®ä¸»æ´»å‹•ã«ã¯è³¼è²·ç‰©æµã€è£½é€ ã€å‡ºè·ç‰©æµã€ãƒžãƒ¼ã‚±ãƒ†ã‚£ãƒ³ã‚°ãƒ»è²©å£²ã€ã‚µãƒ¼ãƒ“ã‚¹ãªã©ãŒã‚ã‚Šã¾ã™ã€‚äººäº‹ã‚„æŠ€è¡“é–‹ç™ºãªã©ã¯æ”¯æ´æ´»å‹•ã§ã™ã€‚",
      "è£½é€ ã¯ä¸»æ´»å‹•ã ãŒã€äººäº‹ç®¡ç†ãƒ»æŠ€è¡“é–‹ç™ºãƒ»å…¨ç¤¾ç®¡ç†ã¯æ”¯æ´æ´»å‹•ãªã®ã§æ··åœ¨ã—ã¦ã„ã‚‹ã€‚"
    ],
    "explainTopicId": "core_18_03",
    "explainTopicSource": "manual",
    "qualityOverride": "v89-near-domain-distractors",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  },
  {
    "id": "strat-19",
    "cat": "ã‚¹ãƒˆãƒ©ãƒ†ã‚¸",
    "concept": "CRM",
    "difficulty": "åŸºç¤Ž",
    "q": "é¡§å®¢ã”ã¨ã®è³¼å…¥å±¥æ­´ãƒ»å•ã„åˆã‚ã›å±¥æ­´ãƒ»æŽ¥ç‚¹æƒ…å ±ã‚’ã¾ã¨ã‚ã€ç¶™ç¶šçš„ãªé–¢ä¿‚å¼·åŒ–ã‚„é›¢åé˜²æ­¢ã¸æ´»ç”¨ã—ãŸã„ã€‚å°Žå…¥ç›®çš„ã¨ã—ã¦æœ€ã‚‚è¿‘ã„ã‚‚ã®ã¯ã©ã‚Œã‹ã€‚",
    "options": [
      "ä¾›çµ¦ãƒ»ç‰©æµã®æµã‚Œã‚’ä¼æ¥­é–“ã§å…¨ä½“æœ€é©åŒ–ã™ã‚‹",
      "ä¼æ¥­å…¨ä½“ã®åŸºå¹¹æ¥­å‹™ã¨çµŒå–¶è³‡æºã‚’çµ±åˆç®¡ç†ã™ã‚‹",
      "å–¶æ¥­æ¡ˆä»¶ã‚„å•†è«‡å±¥æ­´ã‚’ç®¡ç†ã—ã¦å–¶æ¥­æ´»å‹•ã‚’åŠ¹çŽ‡åŒ–ã™ã‚‹",
      "é¡§å®¢æƒ…å ±ã‚„æŽ¥ç‚¹ã‚’æ´»ç”¨ã—ã¦é•·æœŸçš„ãªé¡§å®¢é–¢ä¿‚ã‚’å¼·åŒ–ã™ã‚‹"
    ],
    "a": 3,
    "exp": "CRMã¯é¡§å®¢ã¨ã®é–¢ä¿‚ã‚’ç®¡ç†ã—ã€é¡§å®¢æº€è¶³ãƒ»ç¶™ç¶šå–å¼•ãƒ»é¡§å®¢ç”Ÿæ¶¯ä¾¡å€¤ãªã©ã®å‘ä¸Šã‚’ç›®æŒ‡ã—ã¾ã™ã€‚",
    "hint": "Customer Relationship Managementã®ç›®çš„ã‚’è€ƒãˆã¾ã™ã€‚",
    "choiceExps": [
      "ä¾›çµ¦ãƒ»ç‰©æµã®æµã‚Œã‚’ä¼æ¥­é–“ã§å…¨ä½“æœ€é©åŒ–ã™ã‚‹ã®ã¯SCMã®ä¸»ç›®çš„ã€‚CRMãŒä¸­å¿ƒã«æ‰±ã†é¡§å®¢é–¢ä¿‚ç®¡ç†ã¨ã¯ç•°ãªã‚‹ã€‚",
      "ä¼æ¥­å…¨ä½“ã®åŸºå¹¹æ¥­å‹™ã¨çµŒå–¶è³‡æºã‚’çµ±åˆç®¡ç†ã™ã‚‹ã®ã¯ERPã®ä¸»ç›®çš„ã€‚CRMã®ä¸»ç›®çš„ã§ã¯ãªã„ã€‚",
      "å–¶æ¥­æ¡ˆä»¶ã‚„å•†è«‡å±¥æ­´ã‚’ç®¡ç†ã—ã¦å–¶æ¥­æ´»å‹•ã‚’åŠ¹çŽ‡åŒ–ã™ã‚‹ã®ã¯SFAã®ä¸»ç›®çš„ã€‚CRMã‚ˆã‚Šå¯¾è±¡ãŒå–¶æ¥­æ´»å‹•ã«å¯„ã‚‹ã€‚",
      "CRMã¯é¡§å®¢ã¨ã®é–¢ä¿‚ã‚’ç®¡ç†ã—ã€é¡§å®¢æº€è¶³ãƒ»ç¶™ç¶šå–å¼•ãƒ»é¡§å®¢ç”Ÿæ¶¯ä¾¡å€¤ãªã©ã®å‘ä¸Šã‚’ç›®æŒ‡ã—ã¾ã™ã€‚"
    ],
    "explainTopicId": "core_18_06",
    "explainTopicSource": "semantic",
    "qualityOverride": "v89-near-domain-distractors",
    "cognitiveLevel": "é©ç”¨",
    "applicationAudit": "v92-rewritten",
    "applicationDemand": "çŠ¶æ³é©ç”¨"
  }
];


const QUESTION_QUALITY_AUDIT = {
  version: 29,
  audited: 160,
  existingPreserved: 76,
  added: 84,
  categoryTarget: 20,
  answerPositionTarget: [40,40,40,40],
  checks: [
    'å•é¡Œæ–‡ã®ä¸€æ„æ€§',
    '4æŠžã®é‡è¤‡',
    'èª¤ç­”é¸æŠžè‚¢ã®å¦¥å½“æ€§',
    'è§£èª¬ã®æ ¹æ‹ ',
    'ãƒ’ãƒ³ãƒˆã®æœ‰ç”¨æ€§',
    'æ­£è§£ä½ç½®ã®åã‚Š',
    '8åˆ†é‡Žã®å•é¡Œæ•°ãƒãƒ©ãƒ³ã‚¹'
  ]
};

const CORE_A_CHAPTER_EXTRA_QUESTIONS={"7":[{"id":"chapterextra_07_01","coreTopicId":"core_07_01","cat":"ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿","concept":"åŠå°Žä½“ãƒ¡ãƒ¢ãƒª","difficulty":"æ¨™æº–","angle":"comparison","q":"DRAMã¨SRAMã®ç‰¹å¾´ã®çµ„åˆã›ã¨ã—ã¦ã€æœ€ã‚‚é©åˆ‡ãªã‚‚ã®ã¯ã©ã‚Œã‹ã€‚","options":["DRAMã¯ãƒªãƒ•ãƒ¬ãƒƒã‚·ãƒ¥ãŒå¿…è¦ã§ä¸»è¨˜æ†¶ã«ä½¿ã‚ã‚Œã‚‹ã“ã¨ãŒå¤šãã€SRAMã¯é«˜é€Ÿã§ã‚­ãƒ£ãƒƒã‚·ãƒ¥ã«ä½¿ã‚ã‚Œã‚‹ã“ã¨ãŒå¤šã„","DRAMã¯ä¸æ®ç™ºæ€§ã§SSDã®è¨˜æ†¶ç´ å­ã«ä½¿ã‚ã‚Œã€SRAMã¯ç£æ°—ãƒ‡ã‚£ã‚¹ã‚¯ã®è¨˜éŒ²åª’ä½“ã¨ã—ã¦ä½¿ã‚ã‚Œã‚‹","DRAMã¯SRAMã‚ˆã‚Šé«˜é€Ÿã§é«˜ä¾¡ãªãŸã‚CPUå†…éƒ¨ã®ã‚­ãƒ£ãƒƒã‚·ãƒ¥ã«ä½¿ã‚ã‚Œã€SRAMã¯ä¸»è¨˜æ†¶ã«ä½¿ã‚ã‚Œã‚‹","SRAMã¯ãƒªãƒ•ãƒ¬ãƒƒã‚·ãƒ¥ãŒå¿…è¦ã§ä¸»è¨˜æ†¶ã«ä½¿ã‚ã‚Œã€DRAMã¯é›»æºã‚’åˆ‡ã£ã¦ã‚‚å†…å®¹ã‚’ä¿æŒã™ã‚‹"],"a":0,"exp":"DRAMã¯å¤§å®¹é‡åŒ–ã—ã‚„ã™ãä¸»è¨˜æ†¶ã«ä½¿ã‚ã‚Œã¾ã™ãŒã€è¨˜æ†¶ä¿æŒã®ãŸã‚ãƒªãƒ•ãƒ¬ãƒƒã‚·ãƒ¥ãŒå¿…è¦ã§ã™ã€‚SRAMã¯é«˜é€Ÿã§ãƒªãƒ•ãƒ¬ãƒƒã‚·ãƒ¥ä¸è¦ã§ã™ãŒé«˜ä¾¡ãªãŸã‚ã‚­ãƒ£ãƒƒã‚·ãƒ¥ãªã©ã«ä½¿ã‚ã‚Œã¾ã™ã€‚","hint":"ä¸»è¨˜æ†¶ã¨ã‚­ãƒ£ãƒƒã‚·ãƒ¥ã§ã‚ˆãä½¿ã‚ã‚Œã‚‹ãƒ¡ãƒ¢ãƒªã®é•ã„ã‚’æ•´ç†ã—ã¾ã™ã€‚","choiceExps":["DRAMã¯ãƒªãƒ•ãƒ¬ãƒƒã‚·ãƒ¥ãŒå¿…è¦ã§ä¸»è¨˜æ†¶ã«ã€SRAMã¯é«˜é€Ÿã§ã‚­ãƒ£ãƒƒã‚·ãƒ¥ã«ä½¿ã‚ã‚Œã‚‹ã“ã¨ãŒå¤šã„ã€‚ã“ã®çµ„åˆã›ãŒé©åˆ‡ã€‚","DRAMã¯æ®ç™ºæ€§ã®åŠå°Žä½“ãƒ¡ãƒ¢ãƒªã§ã‚ã‚Šã€SSDã®è¨˜æ†¶ç´ å­ã¨ã„ã†èª¬æ˜Žã¯é©åˆ‡ã§ãªã„ã€‚SRAMã‚‚ç£æ°—ãƒ‡ã‚£ã‚¹ã‚¯ã«ä½¿ã†ãƒ¡ãƒ¢ãƒªã§ã¯ãªã„ã€‚","ä¸€èˆ¬ã«SRAMã®æ–¹ãŒDRAMã‚ˆã‚Šé«˜é€Ÿã§é«˜ä¾¡ã§ã‚ã‚‹ã€‚ç‰¹å¾´ãŒé€†ã«ãªã£ã¦ã„ã‚‹ã€‚","SRAMã¯ãƒªãƒ•ãƒ¬ãƒƒã‚·ãƒ¥ä¸è¦ã§ã€DRAMã‚‚é›»æºã‚’åˆ‡ã‚Œã°å†…å®¹ã‚’å¤±ã†æ®ç™ºæ€§ãƒ¡ãƒ¢ãƒªã§ã‚ã‚‹ã€‚"],"cognitiveLevel":"é©ç”¨"},{"id":"chapterextra_07_02","coreTopicId":"core_07_01","cat":"ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿","concept":"ãƒ•ãƒ©ãƒƒã‚·ãƒ¥ãƒ¡ãƒ¢ãƒª","difficulty":"æ¨™æº–","angle":"application","q":"é›»æºã‚’åˆ‡ã£ã¦ã‚‚å†…å®¹ã‚’ä¿æŒã§ãã€SSDã‚„USBãƒ¡ãƒ¢ãƒªãªã©ã«åˆ©ç”¨ã•ã‚Œã‚‹åŠå°Žä½“ãƒ¡ãƒ¢ãƒªã¯ã©ã‚Œã‹ã€‚","options":["DRAM","ãƒ•ãƒ©ãƒƒã‚·ãƒ¥ãƒ¡ãƒ¢ãƒª","SRAM","ã‚­ãƒ£ãƒƒã‚·ãƒ¥ãƒ¡ãƒ¢ãƒª"],"a":1,"exp":"ãƒ•ãƒ©ãƒƒã‚·ãƒ¥ãƒ¡ãƒ¢ãƒªã¯é›»æ°—çš„ã«æ›¸æ›ãˆå¯èƒ½ãªä¸æ®ç™ºæ€§åŠå°Žä½“ãƒ¡ãƒ¢ãƒªã§ã€SSDã‚„USBãƒ¡ãƒ¢ãƒªãªã©ã«ä½¿ã‚ã‚Œã¾ã™ã€‚","hint":"é›»æºæ–­å¾Œã‚‚ä¿æŒã™ã‚‹ã€Žä¸æ®ç™ºæ€§ã€ãŒæ‰‹æŽ›ã‹ã‚Šã§ã™ã€‚","choiceExps":["DRAMã¯é›»æºã‚’åˆ‡ã‚‹ã¨å†…å®¹ã‚’å¤±ã†æ®ç™ºæ€§ãƒ¡ãƒ¢ãƒªã§ã€ä¸»è¨˜æ†¶ã«ä½¿ã‚ã‚Œã‚‹ã€‚","ãƒ•ãƒ©ãƒƒã‚·ãƒ¥ãƒ¡ãƒ¢ãƒªã¯ä¸æ®ç™ºæ€§ã§é›»æ°—çš„ã«æ›¸æ›ãˆã§ãã€SSDã‚„USBãƒ¡ãƒ¢ãƒªã«ä½¿ã‚ã‚Œã‚‹ã€‚","SRAMã‚‚æ®ç™ºæ€§ã§ã‚ã‚Šã€ä¸»ã«ã‚­ãƒ£ãƒƒã‚·ãƒ¥ãƒ¡ãƒ¢ãƒªãªã©é«˜é€Ÿæ€§ãŒå¿…è¦ãªç”¨é€”ã«ä½¿ã‚ã‚Œã‚‹ã€‚","ã‚­ãƒ£ãƒƒã‚·ãƒ¥ãƒ¡ãƒ¢ãƒªã¯ç”¨é€”åã§ã‚ã‚Šã€ä¸€èˆ¬ã«SRAMãªã©ã®æ®ç™ºæ€§ãƒ¡ãƒ¢ãƒªã§æ§‹æˆã•ã‚Œã‚‹ã€‚"],"cognitiveLevel":"é©ç”¨"},{"id":"chapterextra_07_03","coreTopicId":"core_07_02","cat":"ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿","concept":"é›»å­å›žè·¯","difficulty":"æ¨™æº–","angle":"discrimination","q":"çµ„åˆã›å›žè·¯ã¨é †åºå›žè·¯ã®é•ã„ã«ã¤ã„ã¦ã€æœ€ã‚‚é©åˆ‡ãªèª¬æ˜Žã¯ã©ã‚Œã‹ã€‚","options":["çµ„åˆã›å›žè·¯ã¯ç¾åœ¨ã®å…¥åŠ›ã ã‘ã§å‡ºåŠ›ãŒæ±ºã¾ã‚Šã€é †åºå›žè·¯ã¯éŽåŽ»ã®çŠ¶æ…‹ã‚‚å‡ºåŠ›ã«å½±éŸ¿ã™ã‚‹","çµ„åˆã›å›žè·¯ãŒãƒ•ãƒªãƒƒãƒ—ãƒ•ãƒ­ãƒƒãƒ—ã§çŠ¶æ…‹ã‚’ä¿æŒã—ã€é †åºå›žè·¯ã¯ç¾åœ¨å…¥åŠ›ã‚’çµ„ã¿åˆã‚ã›ã¦å‡ºåŠ›ã™ã‚‹","é †åºå›žè·¯ã¯ç¾åœ¨ã®å…¥åŠ›ã‹ã‚‰å‡ºåŠ›ãŒæ±ºã¾ã‚Šã€çµ„åˆã›å›žè·¯ã¯éŽåŽ»ã®çŠ¶æ…‹ã‚‚å‚ç…§ã™ã‚‹","çµ„åˆã›å›žè·¯ã¯ä¸»ã«ã‚¢ãƒŠãƒ­ã‚°ä¿¡å·ã€é †åºå›žè·¯ã¯ä¸»ã«ãƒ‡ã‚¸ã‚¿ãƒ«ä¿¡å·ã‚’æ‰±ã†"],"a":0,"exp":"çµ„åˆã›å›žè·¯ã¯ç¾åœ¨ã®å…¥åŠ›ã ã‘ã‹ã‚‰å‡ºåŠ›ãŒæ±ºã¾ã‚Šã¾ã™ã€‚é †åºå›žè·¯ã¯ãƒ•ãƒªãƒƒãƒ—ãƒ•ãƒ­ãƒƒãƒ—ãªã©ã§çŠ¶æ…‹ã‚’ä¿æŒã™ã‚‹ãŸã‚ã€éŽåŽ»ã®çŠ¶æ…‹ã‚‚å‡ºåŠ›ã«å½±éŸ¿ã—ã¾ã™ã€‚","hint":"ã€ŽçŠ¶æ…‹ã‚’è¨˜æ†¶ã™ã‚‹ã‹ã€ã«æ³¨ç›®ã—ã¾ã™ã€‚","choiceExps":["çµ„åˆã›å›žè·¯ã¯ç¾åœ¨ã®å…¥åŠ›ã ã‘ã€é †åºå›žè·¯ã¯ä¿æŒã—ãŸéŽåŽ»ã®çŠ¶æ…‹ã‚‚ä½¿ã£ã¦å‡ºåŠ›ã‚’æ±ºã‚ã‚‹ã€‚","çŠ¶æ…‹ã‚’è¨˜æ†¶ã™ã‚‹ãƒ•ãƒªãƒƒãƒ—ãƒ•ãƒ­ãƒƒãƒ—ã‚’ä½¿ã†ä»£è¡¨ä¾‹ã¯é †åºå›žè·¯ã§ã‚ã‚Šã€èª¬æ˜ŽãŒé€†ã€‚","é †åºå›žè·¯ã‚‚ç¾åœ¨ã®å…¥åŠ›ã¨ä¿æŒçŠ¶æ…‹ã«å¿œã˜ã¦å‡ºåŠ›ã‚„æ¬¡çŠ¶æ…‹ãŒå¤‰åŒ–ã™ã‚‹ã€‚","çµ„åˆã›å›žè·¯ã‚‚é †åºå›žè·¯ã‚‚ãƒ‡ã‚¸ã‚¿ãƒ«å›žè·¯ã¨ã—ã¦æ‰±ã‚ã‚Œã€ã“ã®åŒºåˆ¥ã¯ã‚¢ãƒŠãƒ­ã‚°/ãƒ‡ã‚¸ã‚¿ãƒ«ã®é•ã„ã§ã¯ãªã„ã€‚"],"cognitiveLevel":"é©ç”¨"},{"id":"chapterextra_07_04","coreTopicId":"core_07_02","cat":"ã‚³ãƒ³ãƒ”ãƒ¥ãƒ¼ã‚¿","concept":"ãƒ•ãƒªãƒƒãƒ—ãƒ•ãƒ­ãƒƒãƒ—","difficulty":"æ¨™æº–","angle":"knowledge","q":"ãƒ‡ã‚¸ã‚¿ãƒ«å›žè·¯ã§1bitã®çŠ¶æ…‹ã‚’ä¿æŒã™ã‚‹åŸºæœ¬ç´ å­ã¨ã—ã¦æœ€ã‚‚é©åˆ‡ãªã‚‚ã®ã¯ã©ã‚Œã‹ã€‚","options":["A/Dã‚³ãƒ³ãƒãƒ¼ã‚¿","åŠ ç®—å™¨","ãƒ•ãƒªãƒƒãƒ—ãƒ•ãƒ­ãƒƒãƒ—","ãƒ‡ã‚³ãƒ¼ãƒ€"],"a":2,"exp":"ãƒ•ãƒªãƒƒãƒ—ãƒ•ãƒ­ãƒƒãƒ—ã¯1bitã®çŠ¶æ…‹ã‚’ä¿æŒã§ãã€ãƒ¬ã‚¸ã‚¹ã‚¿ã‚„ã‚«ã‚¦ãƒ³ã‚¿ãªã©ã®é †åºå›žè·¯ã‚’æ§‹æˆã™ã‚‹åŸºæœ¬ç´ å­ã§ã™ã€‚","hint":"é †åºå›žè·¯ã§ã€Žè¨˜æ†¶ã€ã‚’æ‹…ã†ç´ å­ã‚’é¸ã³ã¾ã™ã€‚","choiceExps":["A/Dã‚³ãƒ³ãƒãƒ¼ã‚¿ã¯ã‚¢ãƒŠãƒ­ã‚°ä¿¡å·ã‚’ãƒ‡ã‚¸ã‚¿ãƒ«å€¤ã¸å¤‰æ›ã™ã‚‹å›žè·¯ã§ã€1bitã®çŠ¶æ…‹ä¿æŒãŒä¸»ç›®çš„ã§ã¯ãªã„ã€‚","åŠ ç®—å™¨ã¯2é€²æ•°ãªã©ã®åŠ ç®—ã‚’è¡Œã†çµ„åˆã›å›žè·¯ã§ã€çŠ¶æ…‹ä¿æŒã‚’ä¸»ç›®çš„ã¨ã—ãªã„ã€‚","ãƒ•ãƒªãƒƒãƒ—ãƒ•ãƒ­ãƒƒãƒ—ã¯1bitã®çŠ¶æ…‹ã‚’ä¿æŒã—ã€ãƒ¬ã‚¸ã‚¹ã‚¿ã‚„ã‚«ã‚¦ãƒ³ã‚¿ãªã©ã®é †åºå›žè·¯ã®åŸºæœ¬ã«ãªã‚‹ã€‚","ãƒ‡ã‚³ãƒ¼ãƒ€ã¯å…¥åŠ›ã‚³ãƒ¼ãƒ‰ã«å¿œã˜ã¦ç‰¹å®šã®å‡ºåŠ›ã‚’é¸æŠžã™ã‚‹çµ„åˆã›å›žè·¯ã§ã‚ã‚‹ã€‚"],"cognitiveLevel":"é©ç”¨"}],"17":[{"id":"chapterextra_17_01","coreTopicId":"core_17_01","cat":"ã‚¹ãƒˆãƒ©ãƒ†ã‚¸","concept":"ã‚·ã‚¹ãƒ†ãƒ ä¼ç”»","difficulty":"æ¨™æº–","angle":"application","q":"æ–°ã‚·ã‚¹ãƒ†ãƒ ã®ä¼ç”»æ®µéšŽã§æœ€åˆã«é‡è¦–ã™ã¹ãæ¤œè¨Žã¨ã—ã¦ã€æœ€ã‚‚é©åˆ‡ãªã‚‚ã®ã¯ã©ã‚Œã‹ã€‚","options":["æŽ¡ç”¨ã™ã‚‹ãƒ—ãƒ­ã‚°ãƒ©ãƒŸãƒ³ã‚°è¨€èªžã®æ–‡æ³•ã‚’æ±ºå®šã™ã‚‹","çµŒå–¶ãƒ»æ¥­å‹™ä¸Šã®èª²é¡Œã¨ã‚·ã‚¹ãƒ†ãƒ åŒ–ã®ç›®çš„ã‚’æ˜Žç¢ºã«ã™ã‚‹","ãƒ­ã‚°ä¿å­˜æœŸé–“ã‚„ãƒãƒƒã‚¯ã‚¢ãƒƒãƒ—æ–¹é‡ãªã©ã€é‹ç”¨è¦ä»¶ã‚’å…ˆã«å…·ä½“åŒ–ã™ã‚‹","å…¨ç”»é¢ã®é…è‰²ã¨ã‚¢ã‚¤ã‚³ãƒ³ã‚’ç¢ºå®šã™ã‚‹"],"a":1,"exp":"ä¼ç”»æ®µéšŽã§ã¯ã€çµŒå–¶ãƒ»æ¥­å‹™ä¸Šã®èª²é¡Œã‚’æ•´ç†ã—ã€ä½•ã®ãŸã‚ã«ã‚·ã‚¹ãƒ†ãƒ åŒ–ã™ã‚‹ã®ã‹ã€å¯¾è±¡ç¯„å›²ãƒ»è²»ç”¨ãƒ»åŠ¹æžœãƒ»ãƒªã‚¹ã‚¯ãªã©ã‚’æ¤œè¨Žã—ã¾ã™ã€‚","hint":"è£½å“ã‚„æŠ€è¡“ã‚’é¸ã¶å‰ã«ã€Žä½•ã‚’è§£æ±ºã™ã‚‹ã‹ã€ã‚’æ˜Žç¢ºã«ã—ã¾ã™ã€‚","choiceExps":["ãƒ—ãƒ­ã‚°ãƒ©ãƒŸãƒ³ã‚°è¨€èªžã®æ–‡æ³•é¸å®šã¯å®Ÿè£…ã«è¿‘ã„æ¤œè¨Žã§ã‚ã‚Šã€ä¼ç”»ã®æœ€åˆã«å„ªå…ˆã™ã‚‹äº‹é …ã§ã¯ãªã„ã€‚","ä¼ç”»ã§ã¯ã€çµŒå–¶ãƒ»æ¥­å‹™ä¸Šã®èª²é¡Œã¨ã‚·ã‚¹ãƒ†ãƒ åŒ–ã®ç›®çš„ã‚’æ˜Žç¢ºã«ã—ã¦ã‹ã‚‰å…·ä½“çš„ãªæ–¹å¼ã‚’æ¤œè¨Žã™ã‚‹ã€‚","ãƒ­ã‚°ä¿å­˜æœŸé–“ã¯è¦ä»¶ã‚„é‹ç”¨è¨­è¨ˆã§å…·ä½“åŒ–ã™ã‚‹äº‹é …ã§ã€èª²é¡Œã‚„ç›®çš„ã®æ•´ç†ã‚ˆã‚Šå…ˆã«å›ºå®šã—ãªã„ã€‚","ç”»é¢ã®é…è‰²ã‚„ã‚¢ã‚¤ã‚³ãƒ³ã¯UIè¨­è¨ˆã®è©³ç´°ã§ã‚ã‚Šã€ä¼ç”»æ®µéšŽã®æœ€åˆã®æ¤œè¨Žã§ã¯ãªã„ã€‚"],"cognitiveLevel":"é©ç”¨"},{"id":"chapterextra_17_02","coreTopicId":"core_17_02","cat":"ã‚¹ãƒˆãƒ©ãƒ†ã‚¸","concept":"RFIãƒ»RFP","difficulty":"æ¨™æº–","angle":"comparison","q":"RFIã¨RFPã®ä½¿ã„åˆ†ã‘ã«ã¤ã„ã¦ã€æœ€ã‚‚é©åˆ‡ãªèª¬æ˜Žã¯ã©ã‚Œã‹ã€‚","options":["RFIã¯å¥‘ç´„ç· çµå¾Œã®æ¤œåŽæ›¸ã§ã€RFPã¯éšœå®³å ±å‘Šæ›¸ã§ã‚ã‚‹","RFIã¯å€™è£œå…ˆã‚„æŠ€è¡“ãªã©ã®æƒ…å ±åŽé›†ã«ä½¿ã„ã€RFPã¯è¦ä»¶ã‚’ç¤ºã—ã¦å…·ä½“çš„ãªææ¡ˆã‚’æ±‚ã‚ã‚‹","RFIã§æ¦‚ç®—ä¾¡æ ¼ã¨å€™è£œæ©Ÿèƒ½ã‚’åŽé›†ã—ã€RFPã¯å¥‘ç´„å€™è£œã‚’çµžã‚Šè¾¼ã‚“ã å¾Œã®æ¡ä»¶ç¢ºèªã«ä½¿ã†","RFIã¨RFPã¯ã„ãšã‚Œã‚‚ãƒ™ãƒ³ãƒ€ã‹ã‚‰æƒ…å ±ã‚’å¾—ã‚‹æ–‡æ›¸ã§ã‚ã‚Šã€è¦ä»¶ã®å…·ä½“åº¦ã«å¤§ããªé•ã„ã¯ãªã„"],"a":1,"exp":"RFIã¯å¸‚å ´ãƒ»æŠ€è¡“ãƒ»å€™è£œãƒ™ãƒ³ãƒ€ãªã©ã®æƒ…å ±åŽé›†ã€RFPã¯å…·ä½“çš„ãªè¦ä»¶ã‚’ç¤ºã—ã¦ææ¡ˆã‚’ä¾é ¼ã™ã‚‹ãŸã‚ã«ä½¿ã„ã¾ã™ã€‚","hint":"Informationã¨Proposalã®é•ã„ã‚’æ„è­˜ã—ã¾ã™ã€‚","choiceExps":["RFI/RFPã¯ã„ãšã‚Œã‚‚æ¤œåŽæ›¸ã‚„éšœå®³å ±å‘Šæ›¸ã§ã¯ãªã„ã€‚","RFIã¯æƒ…å ±åŽé›†ã€RFPã¯è¦ä»¶ã‚’ç¤ºã—ãŸå…·ä½“çš„ãªææ¡ˆä¾é ¼ã¨ã„ã†ä½¿ã„åˆ†ã‘ãŒé©åˆ‡ã€‚","RFIã¯ä¾¡æ ¼ã ã‘ã‚’ç¢ºå®šã™ã‚‹æ–‡æ›¸ã§ã¯ãªãã€RFPã‚‚ç´å“å¾Œã«ã ã‘ä½œã‚‹æ–‡æ›¸ã§ã¯ãªã„ã€‚","Informationã¨ProposalãŒç¤ºã™ã¨ãŠã‚Šã€RFIã¨RFPã¯ç›®çš„ãŒç•°ãªã‚‹ã€‚"],"cognitiveLevel":"é©ç”¨"},{"id":"chapterextra_17_03","coreTopicId":"core_17_02","cat":"ã‚¹ãƒˆãƒ©ãƒ†ã‚¸","concept":"èª¿é”è©•ä¾¡","difficulty":"æ¨™æº–","angle":"discrimination","q":"è¤‡æ•°ãƒ™ãƒ³ãƒ€ã®ææ¡ˆã‚’å…¬å¹³ã«æ¯”è¼ƒã™ã‚‹ãŸã‚ã®é€²ã‚æ–¹ã¨ã—ã¦ã€æœ€ã‚‚é©åˆ‡ãªã‚‚ã®ã¯ã©ã‚Œã‹ã€‚","options":["ææ¡ˆã‚’å—ã‘å–ã£ãŸå¾Œã€æœ€ã‚‚å®‰ã„ãƒ™ãƒ³ãƒ€ã«æœ‰åˆ©ãªè©•ä¾¡åŸºæº–ã¸å¤‰æ›´ã™ã‚‹","ä¾¡æ ¼ã‚’ä¸»æŒ‡æ¨™ã«ã—ã¦ã€åŒç¨‹åº¦ã®ææ¡ˆã‚’æ©Ÿèƒ½ãƒ»ç´æœŸãƒ»ä¿å®ˆä½“åˆ¶ã§æ¯”è¼ƒã™ã‚‹","æ©Ÿèƒ½ãƒ»ä¾¡æ ¼ãƒ»ç´æœŸãƒ»å“è³ªãƒ»ä¿å®ˆä½“åˆ¶ãªã©ã®è©•ä¾¡åŸºæº–ã‚’äº‹å‰ã«å®šã‚ã¦æ¯”è¼ƒã™ã‚‹","ãƒ™ãƒ³ãƒ€ã”ã¨ã«å¾—æ„åˆ†é‡Žã«åˆã‚ã›ã¦è¦ä»¶ã‚’èª¿æ•´ã—ã€ãã‚Œãžã‚Œã®ææ¡ˆã‚’ç·åˆè©•ä¾¡ã™ã‚‹"],"a":2,"exp":"ææ¡ˆã‚’å…¬å¹³ã«æ¯”è¼ƒã™ã‚‹ã«ã¯ã€è¦ä»¶ã¨è©•ä¾¡åŸºæº–ã‚’äº‹å‰ã«æ˜Žç¢ºåŒ–ã—ã€å„å€™è£œã‚’å…±é€šã®åŸºæº–ã§è©•ä¾¡ã—ã¾ã™ã€‚","hint":"ã€Žå…±é€šã®ç‰©å·®ã—ã‚’ã„ã¤æ±ºã‚ã‚‹ã‹ã€ãŒãƒã‚¤ãƒ³ãƒˆã§ã™ã€‚","choiceExps":["ææ¡ˆå—é ˜å¾Œã«ç‰¹å®šå€™è£œã¸æœ‰åˆ©ãªåŸºæº–ã¸å¤‰ãˆã‚‹ã¨ã€å…¬å¹³ãªæ¯”è¼ƒã«ãªã‚‰ãªã„ã€‚","ä¾¡æ ¼ã ã‘ã§ã¯è¦æ±‚å……è¶³ã€å“è³ªã€ç´æœŸã€ä¿å®ˆãªã©ã®é‡è¦æ¡ä»¶ã‚’è©•ä¾¡ã§ããªã„ã€‚","è©•ä¾¡åŸºæº–ã‚’äº‹å‰ã«å®šã‚ã€å„ãƒ™ãƒ³ãƒ€ã‚’åŒã˜ç‰©å·®ã—ã§æ¯”è¼ƒã™ã‚‹æ–¹æ³•ãŒé©åˆ‡ã€‚","å€™è£œã”ã¨ã«è¦ä»¶ãŒé•ãˆã°ã€ææ¡ˆå†…å®¹ã‚’åŒã˜æ¡ä»¶ã§æ¯”è¼ƒã§ããªããªã‚‹ã€‚"],"cognitiveLevel":"é©ç”¨"}],"1":[{"id":"chapterextra_01_01","coreTopicId":"core_01_07","cat":"åŸºç¤Žç†è«–","concept":"ã‚·ãƒ•ãƒˆæ¼”ç®—","difficulty":"æ¨™æº–","angle":"comparison","q":"è«–ç†å³ã‚·ãƒ•ãƒˆã¨ç®—è¡“å³ã‚·ãƒ•ãƒˆã®é•ã„ã¨ã—ã¦ã€æœ€ã‚‚é©åˆ‡ãªã‚‚ã®ã¯ã©ã‚Œã‹ã€‚","options":["è«–ç†å³ã‚·ãƒ•ãƒˆã¯ç©ºã„ãŸä¸Šä½bitã‚’0ã§åŸ‹ã‚ã€ç®—è¡“å³ã‚·ãƒ•ãƒˆã¯ç¬¦å·ã‚’ä¿ã¤ãŸã‚æœ€ä¸Šä½bitã‚’å¼•ãç¶™ã","è«–ç†å³ã‚·ãƒ•ãƒˆã¯ç©ºã„ãŸä¸Šä½bitã‚’1ã§åŸ‹ã‚ã€ç®—è¡“å³ã‚·ãƒ•ãƒˆã¯ç¬¦å·ã«é–¢ä¿‚ãªã0ã§åŸ‹ã‚ã‚‹","è«–ç†å³ã‚·ãƒ•ãƒˆã¯ç¬¦å·ä»˜ãæ•´æ•°å°‚ç”¨ã§ã€ç®—è¡“å³ã‚·ãƒ•ãƒˆã¯ç¬¦å·ãªã—æ•´æ•°å°‚ç”¨ã¨ã—ã¦ä½¿ã†","è«–ç†å³ã‚·ãƒ•ãƒˆã¨ç®—è¡“å³ã‚·ãƒ•ãƒˆã¯ã€ç©ºã„ãŸbitã‚’0ã§åŸ‹ã‚ã‚‹ç‚¹ã¾ã§åŒã˜å‡¦ç†ã‚’è¡Œã†"],"a":0,"exp":"è«–ç†å³ã‚·ãƒ•ãƒˆã¯ç©ºã„ãŸä¸Šä½bitã‚’0ã§åŸ‹ã‚ã¾ã™ã€‚ç®—è¡“å³ã‚·ãƒ•ãƒˆã¯ç¬¦å·ä»˜ãæ•´æ•°ã®ç¬¦å·ã‚’ä¿ã¤ãŸã‚ã€é€šå¸¸ã¯å…ƒã®æœ€ä¸Šä½bitã‚’ç©ºã„ãŸä½ç½®ã¸å…¥ã‚Œã¾ã™ã€‚","hint":"ç©ºã„ãŸä¸Šä½bitã‚’ä½•ã§åŸ‹ã‚ã‚‹ã‹ã«æ³¨ç›®ã—ã¾ã™ã€‚","choiceExps":["è«–ç†å³ã‚·ãƒ•ãƒˆã¯0åŸ‹ã‚ã€ç®—è¡“å³ã‚·ãƒ•ãƒˆã¯ç¬¦å·ã‚’ä¿ã¤ãŸã‚ç¬¦å·bitã‚’å¼•ãç¶™ãã¨ã„ã†é•ã„ãŒé©åˆ‡ã€‚","è«–ç†å³ã‚·ãƒ•ãƒˆã¯ä¸Šä½ã‚’0ã§åŸ‹ã‚ã‚‹ã€‚ç®—è¡“å³ã‚·ãƒ•ãƒˆã‚‚å¸¸ã«0åŸ‹ã‚ã§ã¯ãªãã€ç¬¦å·bitã‚’å¼•ãç¶™ãã€‚","ã‚·ãƒ•ãƒˆæ¼”ç®—ã¯bitåˆ—ã«å¯¾ã™ã‚‹æ“ä½œã§ã‚ã‚Šã€å°æ•°å°‚ç”¨ãƒ»æ–‡å­—åˆ—å°‚ç”¨ã¨ã„ã†åŒºåˆ¥ã§ã¯ãªã„ã€‚","è² ã®ç¬¦å·ä»˜ãæ•´æ•°ãªã©ã§ã¯çµæžœãŒç•°ãªã‚‹ãŸã‚ã€ä¸¡è€…ã¯åŒã˜å‡¦ç†ã§ã¯ãªã„ã€‚"],"cognitiveLevel":"é©ç”¨"}],"13":[{"id":"chapterextra_13_01","coreTopicId":"core_13_04","cat":"ã‚½ãƒ•ãƒˆã‚¦ã‚§ã‚¢é–‹ç™º","concept":"æ§‹æˆç®¡ç†ãƒ»å¤‰æ›´ç®¡ç†","difficulty":"æ¨™æº–","angle":"comparison","q":"æ§‹æˆç®¡ç†ã¨å¤‰æ›´ç®¡ç†ã®å½¹å‰²ã®çµ„åˆã›ã¨ã—ã¦ã€æœ€ã‚‚é©åˆ‡ãªã‚‚ã®ã¯ã©ã‚Œã‹ã€‚","options":["æ§‹æˆç®¡ç†ã¯æˆæžœç‰©ã®ç‰ˆã‚„çµ„åˆã›ã‚’è­˜åˆ¥ãƒ»è¿½è·¡ã—ã€å¤‰æ›´ç®¡ç†ã¯å¤‰æ›´è¦æ±‚ã®å½±éŸ¿ã‚’è©•ä¾¡ã—ã¦æ‰¿èªãƒ»å®Ÿæ–½ã‚’ç®¡ç†ã™ã‚‹","æ§‹æˆç®¡ç†ã¯å¤‰æ›´è¦æ±‚ã®å½±éŸ¿ãƒ»æ‰¿èªã‚’ç®¡ç†ã—ã€å¤‰æ›´ç®¡ç†ã¯æˆæžœç‰©ã®ç‰ˆã‚„çµ„åˆã›ã‚’è­˜åˆ¥ãƒ»è¿½è·¡ã™ã‚‹","æ§‹æˆç®¡ç†ã¯ç¾è¡Œç‰ˆã‚’ä¸­å¿ƒã«è­˜åˆ¥ã—ã€å¤‰æ›´ç®¡ç†ã¯å¤‰æ›´æ—¥æ™‚ã¨æ‹…å½“è€…ã‚’è¨˜éŒ²ã™ã‚‹","æ§‹æˆç®¡ç†ã¯æœ¬ç•ªç§»è¡Œå¾Œã‚’ä¸­å¿ƒã«è¡Œã„ã€å¤‰æ›´ç®¡ç†ã¯é–‹ç™ºä¸­ã®è¦æ±‚å¤‰æ›´ã‚’ä¸­å¿ƒã«è¡Œã†"],"a":0,"exp":"æ§‹æˆç®¡ç†ã¯ã‚½ãƒ¼ã‚¹ã‚³ãƒ¼ãƒ‰ã€è¨­å®šã€æ–‡æ›¸ãªã©ã®ç‰ˆã¨çµ„åˆã›ã‚’è­˜åˆ¥ãƒ»è¿½è·¡ã—ã¾ã™ã€‚å¤‰æ›´ç®¡ç†ã¯å¤‰æ›´è¦æ±‚ã®ç†ç”±ã‚„å½±éŸ¿ã‚’è©•ä¾¡ã—ã€æ‰¿èªå¾Œã®å®Ÿæ–½ã¾ã§ç®¡ç†ã—ã¾ã™ã€‚","hint":"ã€Žã©ã®ç‰ˆã‹ã€ã¨ã€Žå¤‰æ›´ã—ã¦ã‚ˆã„ã‹ã€ã‚’åˆ†ã‘ã¦è€ƒãˆã¾ã™ã€‚","choiceExps":["ç‰ˆãƒ»çµ„åˆã›ã‚’æ‰±ã†æ§‹æˆç®¡ç†ã¨ã€å¤‰æ›´è¦æ±‚ã®è©•ä¾¡ãƒ»æ‰¿èªãƒ»å®Ÿæ–½ã‚’æ‰±ã†å¤‰æ›´ç®¡ç†ã®å¯¾å¿œãŒé©åˆ‡ã€‚","æ§‹æˆç®¡ç†ã¨å¤‰æ›´ç®¡ç†ã®ä¸­å¿ƒçš„ãªå½¹å‰²ã‚’é€†ã«ã—ãŸèª¬æ˜Žã§ã‚ã‚‹ã€‚","æ§‹æˆç®¡ç†ã§ã¯å¿…è¦ãªç‰ˆã‚’è¿½è·¡ã§ãã‚‹ã“ã¨ãŒé‡è¦ã§ã€å¤‰æ›´ç®¡ç†ã§ã¯å®Ÿæ–½å‰ã«å½±éŸ¿ã‚„æ‰¿èªã‚’ç¢ºèªã™ã‚‹ã€‚","æ§‹æˆç®¡ç†ãƒ»å¤‰æ›´ç®¡ç†ã¯ç‰¹å®šã®ä¸€æ™‚æœŸã ã‘ã«é™å®šã™ã‚‹æ´»å‹•ã§ã¯ãªãã€é–‹ç™ºãƒ»ä¿å®ˆã‚’é€šã—ã¦å¿…è¦ã«ãªã‚‹ã€‚"],"cognitiveLevel":"é©ç”¨"}]}
const CORE_A_CHAPTER_EXTRA_CONTRACTS={"chapterextra_07_01":"DRAMã¯ãƒªãƒ•ãƒ¬ãƒƒã‚·ãƒ¥ãŒå¿…è¦ã§ä¸»è¨˜æ†¶ã«ä½¿ã‚ã‚Œã‚‹ã“ã¨ãŒå¤šãã€SRAMã¯é«˜é€Ÿã§ã‚­ãƒ£ãƒƒã‚·ãƒ¥ã«ä½¿ã‚ã‚Œã‚‹ã“ã¨ãŒå¤šã„","chapterextra_07_02":"ãƒ•ãƒ©ãƒƒã‚·ãƒ¥ãƒ¡ãƒ¢ãƒª","chapterextra_07_03":"çµ„åˆã›å›žè·¯ã¯ç¾åœ¨ã®å…¥åŠ›ã ã‘ã§å‡ºåŠ›ãŒæ±ºã¾ã‚Šã€é †åºå›žè·¯ã¯éŽåŽ»ã®çŠ¶æ…‹ã‚‚å‡ºåŠ›ã«å½±éŸ¿ã™ã‚‹","chapterextra_07_04":"ãƒ•ãƒªãƒƒãƒ—ãƒ•ãƒ­ãƒƒãƒ—","chapterextra_17_01":"çµŒå–¶ãƒ»æ¥­å‹™ä¸Šã®èª²é¡Œã¨ã‚·ã‚¹ãƒ†ãƒ åŒ–ã®ç›®çš„ã‚’æ˜Žç¢ºã«ã™ã‚‹","chapterextra_17_02":"RFIã¯å€™è£œå…ˆã‚„æŠ€è¡“ãªã©ã®æƒ…å ±åŽé›†ã«ä½¿ã„ã€RFPã¯è¦ä»¶ã‚’ç¤ºã—ã¦å…·ä½“çš„ãªææ¡ˆã‚’æ±‚ã‚ã‚‹","chapterextra_17_03":"æ©Ÿèƒ½ãƒ»ä¾¡æ ¼ãƒ»ç´æœŸãƒ»å“è³ªãƒ»ä¿å®ˆä½“åˆ¶ãªã©ã®è©•ä¾¡åŸºæº–ã‚’äº‹å‰ã«å®šã‚ã¦æ¯”è¼ƒã™ã‚‹","chapterextra_01_01":"è«–ç†å³ã‚·ãƒ•ãƒˆã¯ç©ºã„ãŸä¸Šä½bitã‚’0ã§åŸ‹ã‚ã€ç®—è¡“å³ã‚·ãƒ•ãƒˆã¯ç¬¦å·ã‚’ä¿ã¤ãŸã‚æœ€ä¸Šä½bitã‚’å¼•ãç¶™ã","chapterextra_13_01":"æ§‹æˆç®¡ç†ã¯æˆæžœç‰©ã®ç‰ˆã‚„çµ„åˆã›ã‚’è­˜åˆ¥ãƒ»è¿½è·¡ã—ã€å¤‰æ›´ç®¡ç†ã¯å¤‰æ›´è¦æ±‚ã®å½±éŸ¿ã‚’è©•ä¾¡ã—ã¦æ‰¿èªãƒ»å®Ÿæ–½ã‚’ç®¡ç†ã™ã‚‹"};;
function trackedQuestionPool(){
  return [...QUESTION_BANK,...Object.values(CORE_A_CHAPTER_EXTRA_QUESTIONS).flat()];
}
function questionById(id){
  return trackedQuestionPool().find(q=>q.id===id)||null;
}


function ensureChapterMasteryProfile(){
  if(!profile.chapterMastery) profile.chapterMastery={};

  // v95ä»¥å‰ã®ç›´è¿‘ã‚»ãƒƒã‚·ãƒ§ãƒ³ãŒæ®‹ã£ã¦ã„ã‚‹å ´åˆã¯ã€ç« æœ«çµ±åˆæ¼”ç¿’ã®çµæžœã‚’ç§»è¡Œã™ã‚‹ã€‚
  for(let ch=1;ch<=21;ch++){
    const key=String(ch);
    if(profile.chapterMastery[key])continue;
    const rows=(profile.sessions||[]).filter(x=>x.mode===`corechapter:${ch}`);
    if(!rows.length)continue;
    const latest=rows[0];
    profile.chapterMastery[key]={
      attempts:rows.length,
      passes:rows.filter(x=>(Number(x.rate)||0)>=80).length,
      bestRate:Math.max(...rows.map(x=>Number(x.rate)||0)),
      lastRate:Number(latest.rate)||0,
      lastDate:latest.date||null
    };
  }
}
function recordChapterIntegrationResult(ch,rate){
  ensureChapterMasteryProfile();
  const key=String(ch);
  const st=profile.chapterMastery[key]||(profile.chapterMastery[key]={attempts:0,passes:0,bestRate:0,lastRate:0,lastDate:null});
  st.attempts=(st.attempts||0)+1;
  if(rate>=80)st.passes=(st.passes||0)+1;
  st.bestRate=Math.max(st.bestRate||0,rate||0);
  st.lastRate=rate||0;
  st.lastDate=localDateISO(0);
  return st;
}
function chapterIntegrationEvidence(ch){
  ensureChapterMasteryProfile();
  const st=profile.chapterMastery?.[String(ch)]||{attempts:0,passes:0,bestRate:0,lastRate:0,lastDate:null};
  // ä¸€åº¦80%ä»¥ä¸Šã«åˆ°é”ã—ã€ç›´è¿‘ã§ã‚‚70%ä»¥ä¸Šã‚’ç¶­æŒã—ã¦ã„ã‚‹ã“ã¨ã‚’çµ±åˆç¢ºèªã®æ¡ä»¶ã¨ã™ã‚‹ã€‚
  const passed=(st.bestRate||0)>=80&&(st.lastRate||0)>=70;
  return {...st,passed};
}

function ensureQuestionProfile(){
  if(!profile.qStats) profile.qStats={};
  if(!profile.sessions) profile.sessions=[];
  const trackedQuestions=trackedQuestionPool();
  trackedQuestions.forEach(q=>{
    if(!profile.qStats[q.id]){
      profile.qStats[q.id]={
        attempts:0, correct:0, streak:0,
        due:null, last:null, lastReason:null
      };
    }
    const st=profile.qStats[q.id];
    if(st.stability==null){
      const s=st.streak||0;
      st.stability=s<=0?1:s===1?3:s===2?7:s===3?14:30;
    }
    if(st.lapses==null) st.lapses=0;
    if(st.reviews==null) st.reviews=0;
    if(st.avgSeconds==null) st.avgSeconds=0;
    if(st.timedAnswers==null) st.timedAnswers=0;
    if(st.lastQuality==null) st.lastQuality=null;
    if(st.lastReviewDate==null) st.lastReviewDate=st.last||null;
    if(st.recovered==null) st.recovered=0;
    if(st.retryFailures==null) st.retryFailures=0;
    if((st.memoryVersion||0)<2) st.memoryVersion=2;
  });
}
ensureQuestionProfile();
ensureChapterMasteryProfile();
saveProfile();

// ===== v42: guided review journey =====
if(!profile.reviewJourneys) profile.reviewJourneys={};
let activeReviewJourneyId=null;

const QUESTION_LESSON_MAP={
  'åŸºæ•°å¤‰æ›':'binary','16é€²æ•°':'binary','2ã®è£œæ•°':'binary','è£œæ•°':'binary','ãƒ‡ãƒ¼ã‚¿å˜ä½':'binary','æƒ…å ±é‡':'binary',
  'è«–ç†æ¼”ç®—':'logic','é›†åˆ':'logic','ã‚ªãƒ¼ãƒˆãƒžãƒˆãƒ³':'automata',
  'äºŒåˆ†æŽ¢ç´¢':'binarysearch','ã‚¹ã‚¿ãƒƒã‚¯':'stackqueue','ã‚­ãƒ¥ãƒ¼':'stackqueue','é…åˆ—ãƒˆãƒ¬ãƒ¼ã‚¹':'binarysearch','ãƒ«ãƒ¼ãƒ—ãƒˆãƒ¬ãƒ¼ã‚¹':'binarysearch','æ¡ä»¶åˆ†å²':'binarysearch','äºŒé‡ãƒ«ãƒ¼ãƒ—':'binarysearch','é–¢æ•°':'binarysearch','å†å¸°':'binarysearch','æœ¨ã®èµ°æŸ»':'binarysearch','ã‚½ãƒ¼ãƒˆ':'binarysearch','ãƒãƒ–ãƒ«ã‚½ãƒ¼ãƒˆ':'binarysearch','é¸æŠžã‚½ãƒ¼ãƒˆ':'binarysearch','è¨ˆç®—é‡':'binarysearch','ãƒ¦ãƒ¼ã‚¯ãƒªãƒƒãƒ‰äº’é™¤æ³•':'binarysearch',
  'CPU':'cpu','CPUæ€§èƒ½':'cpu','ã‚­ãƒ£ãƒƒã‚·ãƒ¥':'cache','è¨˜æ†¶éšŽå±¤':'cache','åŠå°Žä½“ãƒ¡ãƒ¢ãƒª':'memorychips','OS':'os','ä»®æƒ³è¨˜æ†¶':'os','ãƒ—ãƒ­ã‚»ã‚¹çŠ¶æ…‹':'os','å‰²è¾¼ã¿':'os','ãƒ•ã‚¡ã‚¤ãƒ«ã‚·ã‚¹ãƒ†ãƒ ':'filesystem','RAID':'backup','ãƒãƒƒã‚¯ã‚¢ãƒƒãƒ—':'backup','ä¿¡é ¼æ€§':'reliability','å¯ç”¨æ€§':'reliability',
  'ã‚¢ã‚¯ã‚»ã‚·ãƒ“ãƒªãƒ†ã‚£':'uiux','ç”»åƒãƒ‡ãƒ¼ã‚¿é‡':'multimedia',
  'SQL':'sql','SQLé›†ç´„':'sql','GROUP BY':'sql','HAVING':'sql','ORDER BY':'sql','JOIN':'sql','NULL':'sql','ä¸»ã‚­ãƒ¼':'sql','å¤–éƒ¨ã‚­ãƒ¼':'sql','æ­£è¦åŒ–':'sql','ç¬¬2æ­£è¦å½¢':'sql','è¤‡åˆä¸»ã‚­ãƒ¼':'sql','ã‚¤ãƒ³ãƒ‡ãƒƒã‚¯ã‚¹':'sql','ãƒˆãƒ©ãƒ³ã‚¶ã‚¯ã‚·ãƒ§ãƒ³':'transaction','åˆ†é›¢æ€§':'transaction',
  'IPã‚¢ãƒ‰ãƒ¬ã‚¹':'subnet','ã‚µãƒ–ãƒãƒƒãƒˆ':'subnet','ãƒ—ãƒ©ã‚¤ãƒ™ãƒ¼ãƒˆIP':'subnet','ãƒ‡ãƒ•ã‚©ãƒ«ãƒˆã‚²ãƒ¼ãƒˆã‚¦ã‚§ã‚¤':'subnet','IPv6':'subnet','TCP':'tcpudp','TCP/UDP':'tcpudp','DNS':'tcpudp','DHCP':'tcpudp','ARP':'tcpudp','NAT':'tcpudp','NAPT':'tcpudp','ICMP':'tcpudp','HTTP':'tcpudp','HTTPS':'tcpudp','é›»å­ãƒ¡ãƒ¼ãƒ«':'tcpudp','IMAP':'tcpudp','OSIå‚ç…§ãƒ¢ãƒ‡ãƒ«':'tcpudp','LANã‚¹ã‚¤ãƒƒãƒ':'tcpudp',
  'å…¬é–‹éµæš—å·':'crypto','å…±é€šéµæš—å·':'crypto','ãƒãƒƒã‚·ãƒ¥':'crypto','HMAC':'crypto','ãƒ‡ã‚¸ã‚¿ãƒ«ç½²å':'signature','ãƒ‡ã‚¸ã‚¿ãƒ«è¨¼æ˜Žæ›¸':'signature',
  'ã‚·ã‚¹ãƒ†ãƒ é–‹ç™º':'development','ãƒ†ã‚¹ãƒˆ':'testing','é–‹ç™ºãƒ¢ãƒ‡ãƒ«':'devmodel','å¤‰æ›´ç®¡ç†':'development',
  'ã‚¯ãƒªãƒ†ã‚£ã‚«ãƒ«ãƒ‘ã‚¹':'criticalpath','ãƒ—ãƒ­ã‚¸ã‚§ã‚¯ãƒˆ':'criticalpath','EVM':'criticalpath','SLA':'sla','ã‚µãƒ¼ãƒ“ã‚¹ãƒ¬ãƒ™ãƒ«':'sla','ã‚µãƒ¼ãƒ“ã‚¹ãƒ‡ã‚¹ã‚¯':'sla','ã‚¤ãƒ³ã‚·ãƒ‡ãƒ³ãƒˆç®¡ç†':'sla','ç›£æŸ»':'audit','ã‚·ã‚¹ãƒ†ãƒ ç›£æŸ»':'audit','å†…éƒ¨çµ±åˆ¶':'audit',
  'BPR':'businessprocess','ãƒãƒªãƒ¥ãƒ¼ãƒã‚§ãƒ¼ãƒ³':'businessprocess','RFP':'procurement',
  'SWOT':'swot','PESTåˆ†æž':'swot','IoT':'iot','æç›Šåˆ†å²ç‚¹':'breakeven','è²¡å‹™':'finance','ROI':'finance','çŸ¥çš„è²¡ç”£':'iprights','æ³•å‹™':'iprights','ãƒžãƒ¼ã‚±ãƒ†ã‚£ãƒ³ã‚°':'swot','CRM':'businessprocess','KPI':'businessprocess','KGI/KPI':'businessprocess'
};
function lessonForQuestion(q){
  if(!q)return null;
  const source=q.sourceId?questionById(q.sourceId):null;
  const id=q.coreTopicId||q.explainTopicId||source?.coreTopicId||source?.explainTopicId||
    QUESTION_LESSON_MAP[q.concept]||QUESTION_LESSON_MAP[source?.concept];
  return id&&LESSONS[id]?id:null;
}
function journeyFor(id){return profile.reviewJourneys?.[id]||null;}
function journeyStageLabel(stage){return stage==='relearn'?'ç†è§£ã—ç›´ã™':stage==='verify'?'åˆ¥å•é¡Œã§ç¢ºèª':stage==='spaced'?'å®šç€ç¢ºèª':'å®šç€æ¸ˆã¿';}
function registerReviewJourney(q,source='practice'){
  const id=q?.sourceId||q?.id;if(!id)return null;
  const base=questionById(id)||q;
  const old=profile.reviewJourneys[id]||{};
  const lessonId=lessonForQuestion(base);
  const wasStable=old.stage==='stable';
  profile.reviewJourneys[id]={
    ...old,id,cat:base.cat,concept:base.concept,lessonId,
    stage:wasStable?(lessonId?'relearn':'verify'):(old.stage|| (lessonId?'relearn':'verify')),
    misses:(old.misses||0)+1,lastWrong:localDateISO(0),source,
    due:profile.qStats?.[id]?.due||localDateISO(1),completedAt:wasStable?null:old.completedAt
  };
  saveProfile();
  return profile.reviewJourneys[id];
}
function activeReviewJourneys(){
  return Object.values(profile.reviewJourneys||{}).filter(j=>j.stage!=='stable').sort((a,b)=>{
    const rank=j=>j.stage==='spaced'?(j.due<=localDateISO(0)?-1:9):j.stage==='relearn'?0:j.stage==='verify'?1:8;
    if(rank(a)!==rank(b))return rank(a)-rank(b);
    return String(b.lastWrong||'').localeCompare(String(a.lastWrong||''));
  });
}
function actionableReviewJourneys(){
  const today=localDateISO(0);
  return activeReviewJourneys().filter(j=>j.stage!=='spaced'||!j.due||j.due<=today);
}
function questionHasActiveJourney(id){
  const j=journeyFor(id);
  return !!j&&j.stage!=='stable';
}
function reviewWorkloadCount(){
  return actionableReviewJourneys().length+dueQuestions().length;
}
function journeyStepHtml(j){
  const idx=j.stage==='relearn'?0:j.stage==='verify'?1:j.stage==='spaced'?2:3;
  const rows=[
    ['ðŸ“˜','ç†è§£ã—ç›´ã™','æ•™æã§è¦ç‚¹ã‚’æ•´ç†'],
    ['ðŸ§©','åˆ¥å•é¡Œã§ç¢ºèª','ãƒ’ãƒ³ãƒˆãªã—ã§åˆè¦‹æ­£è§£'],
    ['ðŸ§ ','å®šç€ã‚’ç¢ºèª','æ—¥ã‚’ç©ºã‘ã¦ã‚‚ã†ä¸€åº¦è§£ã']
  ];
  return rows.map((r,i)=>`<div class="journey-step ${i<idx?'done':i===idx?'current':''}"><div class="n">${i<idx?'âœ“':r[0]}</div><b>${r[1]}</b><span>${r[2]}</span></div>`).join('');
}
function journeyGuidance(j){
  if(j.stage==='relearn')return j.lessonId?'ã¾ãšçŸ­ã„æ•™æã§è«–ç‚¹ã‚’æ•´ç†ã—ã¾ã™ã€‚èª­ã¿çµ‚ãˆãŸã‚‰ã€ãã®ã¾ã¾é¡žé¡Œã¸é€²ã¿ã¾ã™ã€‚':'ã“ã®è«–ç‚¹ã¯å°‚ç”¨æ•™æãŒãªã„ãŸã‚ã€é¡žé¡Œã‹ã‚‰ç¢ºèªã—ã¾ã™ã€‚';
  if(j.stage==='verify')return 'ç­”ãˆã‚’è¦šãˆã¦ã„ã‚‹ã ã‘ã§ã¯ãªãã€æ¡ä»¶ã‚’å¤‰ãˆãŸé¡žé¡Œã‚’æœ€åˆã®å›žç­”ã§æ­£è§£ã§ãã‚‹ã‹ç¢ºèªã—ã¾ã™ã€‚';
  if(j.stage==='spaced')return j.due<=localDateISO(0)?'é–“éš”ã‚’ç©ºã‘ãŸå†ç¢ºèªã®ã‚¿ã‚¤ãƒŸãƒ³ã‚°ã§ã™ã€‚ã“ã“ã‚’åˆè¦‹æ­£è§£ã§ãã‚Œã°å®šç€æ‰±ã„ã«ãªã‚Šã¾ã™ã€‚':`æ¬¡å›žã¯ ${j.due} ã«å†ç¢ºèªã—ã¾ã™ã€‚ä»Šã¯åˆ¥ã®å­¦ç¿’ã‚’é€²ã‚ã¦æ§‹ã„ã¾ã›ã‚“ã€‚`;
  return 'å®šç€ã—ã¾ã—ãŸã€‚';
}
function renderReviewJourneyHub(){
  const all=activeReviewJourneys(),count=document.getElementById('reviewJourneyCount');if(count)count.textContent=all.length;
  const empty=document.getElementById('reviewJourneyEmpty'),next=document.getElementById('reviewJourneyNext');if(!empty||!next)return;
  if(!all.length){empty.style.display='';next.style.display='none';document.getElementById('reviewJourneySummary').textContent='èª¤ç­”ã—ãŸè«–ç‚¹ã‚’ã€Œç†è§£ã—ç›´ã™ â†’ åˆ¥å•é¡Œã§ç¢ºèª â†’ æ—¥ã‚’ç©ºã‘ã¦å®šç€ç¢ºèªã€ã®é †ã§æ¡ˆå†…ã—ã¾ã™ã€‚';return;}
  const j=all[0];empty.style.display='none';next.style.display='';document.getElementById('reviewJourneySummary').textContent=`${all.length}ä»¶ã®å¾©ç¿’ãƒ«ãƒ¼ãƒˆãŒé€²è¡Œä¸­ã§ã™ã€‚æ¬¡ã«ã‚„ã‚‹1ä»¶ã ã‘è¡¨ç¤ºã—ã¦ã„ã¾ã™ã€‚`;
  document.getElementById('reviewJourneyCat').textContent=j.cat;document.getElementById('reviewJourneyConcept').textContent=j.concept;
  document.getElementById('reviewJourneySteps').innerHTML=journeyStepHtml(j);document.getElementById('reviewJourneyGuidance').textContent=journeyGuidance(j);
  const btn=document.getElementById('reviewJourneyAction');
  const waiting=j.stage==='spaced'&&j.due>localDateISO(0);btn.disabled=waiting;btn.textContent=waiting?`${j.due} ã«å†ç¢ºèª`:j.stage==='relearn'?'æ•™æã§ç¢ºèª â†’':j.stage==='verify'?'é¡žé¡Œã§ç¢ºèª â†’':'å¾Œæ—¥å¾©ç¿’ã‚’é–‹å§‹ â†’';btn.dataset.journeyId=j.id;
}
function startJourneyAction(id){
  const j=journeyFor(id);if(!j)return;
  if(j.stage==='relearn'&&j.lessonId){activeReviewJourneyId=id;startLesson(j.lessonId);return;}
  if(j.stage==='spaced'&&j.due>localDateISO(0)){popToast(`${j.due} ã«å†ç¢ºèªã—ã¾ã™`);return;}
  showScreen('problems');startQuiz('journey:'+id);
}
document.getElementById('reviewJourneyAction')?.addEventListener('click',e=>startJourneyAction(e.currentTarget.dataset.journeyId));
function markJourneyLessonDone(id,lessonId){const j=journeyFor(id);if(!j||j.stage!=='relearn'||j.lessonId!==lessonId)return false;j.stage='verify';j.lessonDone=localDateISO(0);saveProfile();return true;}
function markJourneyAnswer(id,firstTryCorrect){
  const j=journeyFor(id);if(!j)return;
  if(firstTryCorrect){
    if(j.stage==='verify'){j.stage='spaced';j.verifyDone=localDateISO(0);j.due=profile.qStats?.[id]?.due||localDateISO(2);}
    else if(j.stage==='spaced'){j.stage='stable';j.spacedDone=localDateISO(0);j.completedAt=localDateISO(0);}
  }else{j.stage='verify';j.due=localDateISO(1);}
  saveProfile();
}
function renderInlineReviewRoute(q){
  const explain=document.getElementById('quizExplain');if(!explain)return;
  explain.querySelector('.review-route-inline')?.remove();
  const id=q.sourceId||q.id,j=journeyFor(id);if(!j)return;
  const d=document.createElement('div');
  d.className='review-route-inline compact';
  d.dataset.questionId=id;
  d.innerHTML=`<b>ðŸ” å¾©ç¿’ã«è¿½åŠ ã—ã¾ã—ãŸ</b><span>${escapeHtml(j.concept)}ã¯ã€å¿…è¦ã«å¿œã˜ã¦æ•™æ â†’ åˆ¥å•é¡Œ â†’ å¾Œæ—¥ã®ç¢ºèªã®é †ã§å¾©ç¿’ã—ã¾ã™ã€‚è©³ã—ã„é€²ã¿æ–¹ã¯æ¼”ç¿’ç”»é¢ã§ç¢ºèªã§ãã¾ã™ã€‚</span>`;
  explain.appendChild(d);
}


function localDateISO(offsetDays=0){
  const d=new Date();
  d.setHours(12,0,0,0);
  d.setDate(d.getDate()+offsetDays);
  const y=d.getFullYear();
  const m=String(d.getMonth()+1).padStart(2,'0');
  const day=String(d.getDate()).padStart(2,'0');
  return `${y}-${m}-${day}`;
}

function parseLocalISO(s){
  if(!s) return null;
  const [y,m,d]=String(s).split('-').map(Number);
  if(!y||!m||!d) return null;
  return new Date(y,m-1,d,12,0,0,0);
}
function daysBetweenISO(from,to=localDateISO(0)){
  const a=parseLocalISO(from),b=parseLocalISO(to);
  if(!a||!b) return 0;
  return Math.round((b-a)/(1000*60*60*24));
}
function ensureMemoryStat(stat){
  if(!stat) return;
  if(stat.stability==null) stat.stability=1;
  if(stat.lapses==null) stat.lapses=0;
  if(stat.reviews==null) stat.reviews=0;
  if(stat.avgSeconds==null) stat.avgSeconds=0;
  if(stat.timedAnswers==null) stat.timedAnswers=0;
  if(stat.lastReviewDate==null) stat.lastReviewDate=stat.last||null;
}
function memoryRetention(stat,onDate=localDateISO(0)){
  if(!stat || !(stat.attempts>0) || !(stat.lastReviewDate||stat.last)) return null;
  ensureMemoryStat(stat);
  const elapsed=Math.max(0,daysBetweenISO(stat.lastReviewDate||stat.last,onDate));
  const stability=Math.max(1,Number(stat.stability)||1);
  // `stability` is defined as roughly the number of days until recall falls to 80%.
  return Math.round(100*Math.pow(0.8,elapsed/stability));
}
function memoryBand(retention){
  if(retention==null) return 'new';
  if(retention>=93) return 'fresh';
  if(retention>=85) return 'good';
  if(retention>=80) return 'soon';
  return 'due';
}
function speedFactorForMemory(seconds){
  if(!seconds) return 1;
  if(seconds<=45) return 1.10;
  if(seconds<=90) return 1.00;
  if(seconds<=150) return 0.90;
  return 0.80;
}
function adaptiveMemoryUpdate(stat,outcome,seconds=0,reason=null,sameSession=false){
  if(!stat) return 1;
  ensureMemoryStat(stat);
  const old=Math.max(1,Number(stat.stability)||1);

  if(!sameSession){
    stat.reviews=(stat.reviews||0)+1;
    if(seconds>0){
      const n=stat.timedAnswers||0;
      stat.avgSeconds=Math.round(((stat.avgSeconds||0)*n + seconds)/(n+1));
      stat.timedAnswers=n+1;
    }
  }

  let interval=1;
  if(outcome==='wrong'){
    stat.lapses=(stat.lapses||0)+1;
    stat.stability=Math.max(1,Math.round(old*0.45*10)/10);
    stat.lastQuality=1;
    interval=1;
  }else if(outcome==='recovered'){
    // Same review session: recovery is valuable, but the first attempt still exposed a gap.
    stat.stability=Math.max(1.5,Math.round(Math.min(old*0.90,3)*10)/10);
    stat.lastQuality=3;
    interval=1;
  }else{
    const streak=Math.max(1,stat.streak||1);
    const growth=1.62 + Math.min(streak,4)*0.17;
    let factor=speedFactorForMemory(seconds);
    if(reason==='2æŠžã§è¿·ã£ãŸ') factor*=0.92;
    if(reason==='æ™‚é–“ä¸è¶³') factor*=0.85;
    stat.stability=Math.min(60,Math.max(3,Math.round(old*growth*factor*10)/10));
    stat.lastQuality=seconds>0 && seconds<=45 ? 5 : 4;
    interval=Math.max(2,Math.min(60,Math.round(stat.stability)));
  }

  stat.lastReviewDate=localDateISO(0);
  stat.due=localDateISO(interval);
  return interval;
}
function reviewUrgency(q){
  const st=profile.qStats?.[q.id];
  if(!st || !(st.attempts>0)) return -999;
  ensureMemoryStat(st);
  const retention=memoryRetention(st);
  const risk=retention==null?0:Math.max(0,100-retention);
  const overdue=st.due && st.due<=localDateISO(0) ? Math.max(0,daysBetweenISO(st.due)) : 0;
  const repeat=Math.min(25,(st.lapses||0)*4);
  const mockRepeat=Math.min(15,(profile.mockMistakeStats?.[q.id]?.misses||0)*3);
  const levelBonus=q.cognitiveLevel==='åˆ¤æ–­'?12:q.cognitiveLevel==='é©ç”¨'?6:0;
  const cognitiveRisk=Math.round(levelBonus*Math.min(1,0.35+risk/100+(overdue?0.25:0)));
  return Math.round(risk + overdue*12 + repeat + mockRepeat + cognitiveRisk);
}
function reviewForecast(days=7){
  ensureQuestionProfile();
  const out=[];
  for(let i=0;i<days;i++){
    const date=localDateISO(i);
    let count=0;
    trackedQuestionPool().forEach(q=>{
      const st=profile.qStats[q.id];
      if(!(st?.attempts>0) || !st.due) return;
      if(i===0){
        if(st.due<=date) count++;
      }else if(st.due===date) count++;
    });
    out.push({date,offset:i,count});
  }
  return out;
}
function memoryHealth(){
  ensureQuestionProfile();
  const attempted=trackedQuestionPool()
    .map(q=>({q,st:profile.qStats[q.id]}))
    .filter(x=>x.st?.attempts>0);
  // An empty learning-evidence set has no retention rate. Keep the numeric fallback at
  // zero for downstream calculations; the dashboard presents it as unmeasured.
  if(!attempted.length) return {attempted:0,avg:0,fresh:0,soon:0,due:0};
  const rows=attempted.map(x=>({...x,retention:memoryRetention(x.st),weight:cognitiveWeight(x.q)}));
  const denom=rows.reduce((s,x)=>s+x.weight,0);
  const avg=Math.round(rows.reduce((s,x)=>s+(x.retention??100)*x.weight,0)/Math.max(1,denom));
  return {
    attempted:rows.length,
    avg,
    fresh:rows.filter(x=>(x.retention??100)>=93).length,
    soon:rows.filter(x=>(x.retention??100)<93 && (x.retention??100)>=80).length,
    due:rows.filter(x=>isDue(x.st) || (x.retention??100)<80).length
  };
}

function isDue(stat){
  if(!stat || !(stat.attempts>0)) return false;
  if(stat.due && stat.due<=localDateISO(0)) return true;
  const retention=memoryRetention(stat);
  return retention!=null && retention<80;
}
function reviewInterval(streak){
  if(streak <= 0) return 1;
  if(streak === 1) return 3;
  if(streak === 2) return 7;
  if(streak === 3) return 14;
  return 30;
}
function shuffled(arr){
  const a=[...arr];
  for(let i=a.length-1;i>0;i--){
    const j=Math.floor(Math.random()*(i+1));
    [a[i],a[j]]=[a[j],a[i]];
  }
  return a;
}
function dueQuestions(){
  ensureQuestionProfile();
  return trackedQuestionPool()
    .filter(q=>isDue(profile.qStats[q.id])&&!questionHasActiveJourney(q.id))
    .sort((a,b)=>reviewUrgency(b)-reviewUrgency(a));
}
function updateDueCount(){
  const e=document.getElementById('dueCount');
  if(e) e.textContent=reviewWorkloadCount();
}
function categoryWeakness(cat){
  return 100-categoryCognitiveEvidence(cat).score;
}
function chooseWeakQuestions(n=10){
  const evidence=Object.fromEntries(Object.keys(profile.skills||{}).map(cat=>[cat,categoryCognitiveEvidence(cat)]));
  const score=q=>{
    const e=evidence[q.cat]||categoryCognitiveEvidence(q.cat);
    const levelGap=q.cognitiveLevel===e.weakest.level?18:0;
    const attempted=(profile.qStats?.[q.id]?.attempts||0)>0;
    const urgency=attempted?Math.max(0,reviewUrgency(q)):0;
    return categoryWeakness(q.cat)+levelGap+Math.min(20,urgency*.12);
  };
  return shuffled(QUESTION_BANK).sort((a,b)=>score(b)-score(a)).slice(0,Math.min(n,QUESTION_BANK.length));
}
function chooseRandomBalanced(n=10){
  const cats=[...new Set(QUESTION_BANK.map(q=>q.cat))];
  let selected=[];
  let pools={};
  cats.forEach(c=>pools[c]=shuffled(QUESTION_BANK.filter(q=>q.cat===c)));
  let ci=0;
  while(selected.length<n && Object.values(pools).some(p=>p.length)){
    const c=cats[ci%cats.length];
    if(pools[c].length) selected.push(pools[c].pop());
    ci++;
  }
  return selected;
}

function chooseFinalBossQuestions(n=5){
  const targets=[
    ...Array(Math.min(3,n)).fill('åˆ¤æ–­'),
    ...Array(Math.max(0,n-Math.min(3,n))).fill('é©ç”¨')
  ];
  const chosen=[],used=new Set(),usedCats=new Set();
  const score=q=>{
    const ev=categoryCognitiveEvidence(q.cat);
    const urgency=(profile.qStats?.[q.id]?.attempts||0)>0?Math.max(0,reviewUrgency(q)):0;
    return (100-ev.score)*1.2 + (q.cognitiveLevel===ev.weakest.level?18:0) + Math.min(20,urgency*.15);
  };
  targets.forEach(level=>{
    let pool=QUESTION_BANK.filter(q=>q.cognitiveLevel===level&&!used.has(q.id)&&!usedCats.has(q.cat));
    if(!pool.length)pool=QUESTION_BANK.filter(q=>q.cognitiveLevel===level&&!used.has(q.id));
    pool=shuffled(pool).sort((a,b)=>score(b)-score(a));
    const q=pool[0];
    if(q){chosen.push(q);used.add(q.id);usedCats.add(q.cat);}
  });
  if(chosen.length<n){
    const rest=shuffled(QUESTION_BANK.filter(q=>!used.has(q.id)&&q.cognitiveLevel!=='æƒ³èµ·')).sort((a,b)=>score(b)-score(a));
    chosen.push(...rest.slice(0,n-chosen.length));
  }
  return shuffled(chosen.slice(0,n));
}

let quizItems=[];
let quizIndex=0;
let quizSelected=null;
let quizAnswered=false;
let quizCorrectCount=0;
let quizWrongCount=0;
let quizEarnedXp=0;
let quizMode='random';
let quizPickedReason=null;
let sessionLog=[];
let quizRetryCount=0;
let quizRecoveredCount=0;
let quizFirstAttemptWrong=false;
let rxTechniqueReady=true;
let rxTechniqueData={};
let rxPaceHandle=null;
let rxPaceRemaining=90;
let rxPaceElapsed=0;
let quizQuestionStartedAt=0;
let quizFirstAttemptSeconds=0;

const problemHub=document.getElementById('problemHub');
const quizSession=document.getElementById('quizSession');
const quizResultScreen=document.getElementById('quizResultScreen');

function nextUnfinishedDailyTask(){
  const rec=getDailyRecord();
  return ensureTodayPlanSnapshot().find(t=>!dailyTaskDone(rec,t))||null;
}
function renderExerciseEntry(){
  const card=document.getElementById('exerciseNextCard');
  const icon=document.getElementById('exerciseNextIcon');
  const kicker=document.getElementById('exerciseNextKicker');
  const title=document.getElementById('exerciseNextTitle');
  const desc=document.getElementById('exerciseNextDesc');
  const action=document.getElementById('exerciseNextAction');
  if(!card||!icon||!kicker||!title||!desc||!action)return;

  const journey=actionableReviewJourneys()[0];
  const due=dueQuestions().length;
  const nextDaily=nextUnfinishedDailyTask();
  action.disabled=false;
  kicker.textContent='æ¬¡ã«ãŠã™ã™ã‚';

  if(journey){
    icon.textContent='ðŸ”';
    title.textContent=`${journey.concept}ã®å¾©ç¿’ã‚’ç¶šã‘ã‚‹`;
    desc.textContent=journeyGuidance(journey);
    action.textContent=journey.stage==='relearn'?'æ•™æã§ç¢ºèª â†’':journey.stage==='verify'?'åˆ¥å•é¡Œã§ç¢ºèª â†’':'å®šç€ã‚’ç¢ºèª â†’';
    action.onclick=()=>startJourneyAction(journey.id);
    return;
  }
  if(due>0){
    icon.textContent='ðŸ§ ';
    title.textContent=`ä»Šæ—¥ã®å¾©ç¿’ ${Math.min(due,10)}å•`;
    desc.textContent=`å¾©ç¿’ã‚¿ã‚¤ãƒŸãƒ³ã‚°ã®å•é¡ŒãŒ${due}å•ã‚ã‚Šã¾ã™ã€‚å¿˜å´ãƒªã‚¹ã‚¯ãŒé«˜ã„é †ã«ç¢ºèªã—ã¾ã™ã€‚`;
    action.textContent='å¾©ç¿’ã‚’å§‹ã‚ã‚‹ â†’';
    action.onclick=()=>startQuiz('review');
    return;
  }
  if(nextDaily && ['boss','warmup','taperReview'].includes(nextDaily.type)){
    icon.textContent=nextDaily.icon||'âœ…';
    kicker.textContent='ä»Šæ—¥ã®è¨ˆç”»';
    title.textContent=nextDaily.title;
    desc.textContent=`${nextDaily.minutes}åˆ†ã®äºˆå®šã§ã™ã€‚ä»Šæ—¥ã®å­¦ç¿’è¨ˆç”»ã«æ²¿ã£ã¦é€²ã‚ã¾ã™ã€‚`;
    action.textContent='å§‹ã‚ã‚‹ â†’';
    action.onclick=()=>launchDailyTask(nextDaily);
    return;
  }
  const rx=recommendedPrescription();
  const meta=prescriptionMeta(rx);
  icon.textContent=meta.icon||'ðŸŽ¯';
  title.textContent=profile.sessions?.length?meta.title:'å¼±ç‚¹ã‚’10å•ã§ç¢ºèª';
  desc.textContent=profile.sessions?.length?meta.desc:'å¾©ç¿’å¾…ã¡ã¯ã‚ã‚Šã¾ã›ã‚“ã€‚ç¾åœ¨ã®ç¿’ç†Ÿåº¦ãŒä½Žã„åˆ†é‡Žã‹ã‚‰10å•ã‚’é¸ã³ã¾ã™ã€‚';
  action.textContent='å§‹ã‚ã‚‹ â†’';
  action.onclick=()=>profile.sessions?.length?startRecommendedPrescription():startQuiz('weak');
}
function openProblemsHub(){
  document.getElementById('problems')?.classList.remove('exercise-session-active');
  if(problemHub) problemHub.style.display='grid';
  if(quizSession) quizSession.style.display='none';
  if(quizResultScreen) quizResultScreen.style.display='none';
  updateDueCount();
  renderRecentHistory();
  renderReviewJourneyHub();
  renderExerciseEntry();
}


// ===== v19: parameterized review variants =====
function shuffledCopy(arr){ return shuffled([...arr]); }
function choicePack(correct,distractors){
  const vals=[];
  [correct,...distractors].forEach(x=>{
    const s=String(x);
    if(!vals.some(v=>String(v)===s)) vals.push(x);
  });
  let filler=1;
  while(vals.length<4){
    const x=`å€™è£œ${filler++}`;
    if(!vals.includes(x)) vals.push(x);
  }
  const mixed=shuffledCopy(vals.slice(0,4));
  return {options:mixed.map(String),a:mixed.findIndex(x=>String(x)===String(correct))};
}
function variantId(baseId){
  return `variant:${baseId}:${Date.now()}:${Math.floor(Math.random()*100000)}`;
}

function genBaseConversion(base){
  const n=8+Math.floor(Math.random()*55),bin=n.toString(2);
  const p=choicePack(n,[n+1,Math.max(0,n-2),n+4]);
  return {id:variantId(base.id),sourceId:base.id,variant:true,cat:base.cat,concept:base.concept,difficulty:'æ¨™æº–',
    q:`2é€²æ•° ${bin} ã‚’10é€²æ•°ã§è¡¨ã™ã¨ï¼Ÿ`,options:p.options,a:p.a,
    exp:`${bin}â‚‚ ã‚’å„æ¡ã®2ã®é‡ã¿ã§è¶³ã™ã¨ ${n} ã§ã™ã€‚`,hint:'å³ç«¯ã‹ã‚‰1,2,4,8,â€¦ã®é‡ã¿ã‚’è€ƒãˆã¾ã™ã€‚'};
}
function genHexConversion(base){
  const n=20+Math.floor(Math.random()*180),hx=n.toString(16).toUpperCase();
  const p=choicePack(n,[n+16,Math.max(0,n-16),n+1]);
  return {id:variantId(base.id),sourceId:base.id,variant:true,cat:base.cat,concept:base.concept,difficulty:'åŸºç¤Ž',
    q:`16é€²æ•° ${hx} ã‚’10é€²æ•°ã§è¡¨ã™ã¨ï¼Ÿ`,options:p.options,a:p.a,
    exp:`${hx}â‚â‚† ã‚’16ã®ä½å–ã‚Šã§è¨ˆç®—ã™ã‚‹ã¨ ${n} ã§ã™ã€‚`,hint:'A=10ã€B=11ã€â€¦ã€F=15ã§ã™ã€‚'};
}
function genReliability(base){
  const vals=[0.8,0.85,0.9,0.95],r=vals[Math.floor(Math.random()*vals.length)];
  const serial=Math.round(r*r*10000)/10000;
  const parallel=Math.round((1-(1-r)*(1-r))*10000)/10000;
  const askParallel=Math.random()<0.5,correct=askParallel?parallel:serial;
  const p=choicePack(correct,[r,askParallel?serial:parallel,Math.round(2*r*100)/100]);
  return {id:variantId(base.id),sourceId:base.id,variant:true,cat:base.cat,concept:base.concept,difficulty:'æ¨™æº–',
    q:`ç¨¼åƒçŽ‡${r}ã®åŒä¸€è£…ç½®2å°ã‚’${askParallel?'ä¸¦åˆ—':'ç›´åˆ—'}ã«æŽ¥ç¶šã—ãŸã€‚ã‚·ã‚¹ãƒ†ãƒ ç¨¼åƒçŽ‡ã¯ï¼Ÿ`,
    options:p.options,a:p.a,
    exp:askParallel?`1âˆ’(1âˆ’${r})Â²=${parallel}ã§ã™ã€‚`:`${r}Ã—${r}=${serial}ã§ã™ã€‚`,
    hint:askParallel?'ä¸¡æ–¹ã¨ã‚‚æ•…éšœã™ã‚‹ç¢ºçŽ‡ã‚’1ã‹ã‚‰å¼•ãã¾ã™ã€‚':'ç›´åˆ—ã¯ä¸¡æ–¹ãŒç¨¼åƒã™ã‚‹å¿…è¦ãŒã‚ã‚Šã¾ã™ã€‚'};
}
function genImageSize(base){
  const ws=[80,100,120,160,200,240],hs=[60,80,100,120],bs=[8,16,24];
  const w=ws[Math.floor(Math.random()*ws.length)],h=hs[Math.floor(Math.random()*hs.length)],b=bs[Math.floor(Math.random()*bs.length)];
  const correct=w*h*b;
  const p=choicePack(correct,[w*h,Math.floor(correct/8),correct*8]);
  return {id:variantId(base.id),sourceId:base.id,variant:true,cat:base.cat,concept:base.concept,difficulty:'æ¨™æº–',
    q:`${w}Ã—${h}ç”»ç´ ã€1ç”»ç´ ${b}ãƒ“ãƒƒãƒˆã®éžåœ§ç¸®ç”»åƒã¯ä½•ãƒ“ãƒƒãƒˆï¼Ÿ`,options:p.options,a:p.a,
    exp:`${w}Ã—${h}Ã—${b}=${correct}ãƒ“ãƒƒãƒˆã§ã™ã€‚`,hint:'ç”»ç´ æ•°Ã—1ç”»ç´ å½“ãŸã‚Šã®ãƒ“ãƒƒãƒˆæ•°ã§ã™ã€‚'};
}
function genGrossProfit(base){
  const sales=(6+Math.floor(Math.random()*8))*100;
  let cost=(3+Math.floor(Math.random()*4))*100;
  if(cost>=sales) cost=sales-200;
  const correct=sales-cost,p=choicePack(correct,[cost,sales,sales+cost]);
  return {id:variantId(base.id),sourceId:base.id,variant:true,cat:base.cat,concept:base.concept,difficulty:'åŸºç¤Ž',
    q:`å£²ä¸Šé«˜${sales}ã€å£²ä¸ŠåŽŸä¾¡${cost}ã®ã¨ãã€å£²ä¸Šç·åˆ©ç›Šã¯ã„ãã‚‰ï¼Ÿ`,options:p.options,a:p.a,
    exp:`${sales}âˆ’${cost}=${correct}ã§ã™ã€‚`,hint:'å£²ä¸Šé«˜ã‹ã‚‰å£²ä¸ŠåŽŸä¾¡ã‚’å¼•ãã¾ã™ã€‚'};
}
function genQueue(base){
  const letters=shuffledCopy(['A','B','C','D','E']).slice(0,3);
  const remove=1+Math.floor(Math.random()*2),answer=letters[remove-1];
  const p=choicePack(answer,[...letters.filter(x=>x!==answer),'å–ã‚Šå‡ºã›ãªã„']);
  return {id:variantId(base.id),sourceId:base.id,variant:true,cat:base.cat,concept:base.concept,difficulty:'åŸºç¤Ž',
    q:`ç©ºã®ã‚­ãƒ¥ãƒ¼ã¸ ${letters.join(' â†’ ')} ã®é †ã«ENQUEUEã—ãŸå¾Œã€${remove}å›žç›®ã®DEQUEUEã§å–ã‚Šå‡ºã•ã‚Œã‚‹ã®ã¯ï¼Ÿ`,options:p.options,a:p.a,
    exp:`FIFOãªã®ã§${remove}å›žç›®ã¯ ${answer} ã§ã™ã€‚`,hint:'æœ€åˆã«å…¥ã‚ŒãŸã‚‚ã®ã‹ã‚‰å–ã‚Šå‡ºã—ã¾ã™ã€‚'};
}
function genStack(base){
  const nums=shuffledCopy([2,4,6,8,10,12]).slice(0,3),answer=nums[2];
  const p=choicePack(answer,[nums[0],nums[1],'å–ã‚Šå‡ºã›ãªã„']);
  return {id:variantId(base.id),sourceId:base.id,variant:true,cat:base.cat,concept:base.concept,difficulty:'åŸºç¤Ž',
    q:`ç©ºã®ã‚¹ã‚¿ãƒƒã‚¯ã¸ ${nums.join(' â†’ ')} ã®é †ã«PUSHã—ãŸç›´å¾Œã€1å›žPOPã™ã‚‹ã¨å–ã‚Šå‡ºã•ã‚Œã‚‹å€¤ã¯ï¼Ÿ`,options:p.options,a:p.a,
    exp:`LIFOãªã®ã§æœ€å¾Œã«PUSHã—ãŸ ${answer} ãŒæœ€åˆã«POPã•ã‚Œã¾ã™ã€‚`,hint:'æœ€å¾Œã«å…¥ã‚ŒãŸã‚‚ã®ãŒæœ€åˆã«å‡ºã¾ã™ã€‚'};
}
function genConditional(base){
  const x=3+Math.floor(Math.random()*12),th=2+Math.floor(Math.random()*10),yt=1+Math.floor(Math.random()*4),yf=5+Math.floor(Math.random()*4);
  const answer=x>th?yt:yf,p=choicePack(answer,[x,th,x>th?yf:yt]);
  return {id:variantId(base.id),sourceId:base.id,variant:true,cat:base.cat,concept:base.concept,difficulty:'åŸºç¤Ž',
    q:`x=${x} ã®ã¨ãã€Œif x > ${th} then yâ†${yt} else yâ†${yf}ã€ã‚’å®Ÿè¡Œã—ãŸå¾Œã®yã¯ï¼Ÿ`,options:p.options,a:p.a,
    exp:`${x}>${th} ã¯${x>th?'çœŸ':'å½'}ãªã®ã§ y=${answer} ã§ã™ã€‚`,hint:`ã¾ãš ${x}>${th} ã‚’åˆ¤å®šã—ã¾ã™ã€‚`};
}
function genSetIntersection(base){
  const c=2+Math.floor(Math.random()*6),aa=[c,c+1,c+3],bb=[c-1,c,c+4],correct=`{${c}}`;
  const p=choicePack(correct,[`{${c},${c+1}}`,`{${c-1},${c}}`,`{${[...new Set([...aa,...bb])].join(',')}}`]);
  return {id:variantId(base.id),sourceId:base.id,variant:true,cat:base.cat,concept:base.concept,difficulty:'æ¨™æº–',
    q:`é›†åˆA={${aa.join(',')}}ã€é›†åˆB={${bb.join(',')}} ã®å…±é€šéƒ¨åˆ† Aâˆ©B ã¯ï¼Ÿ`,options:p.options,a:p.a,
    exp:`ä¸¡æ–¹ã«å«ã¾ã‚Œã‚‹ã®ã¯ ${c} ã ã‘ãªã®ã§ ${correct} ã§ã™ã€‚`,hint:'ä¸¡æ–¹ã®é›†åˆã«å«ã¾ã‚Œã‚‹è¦ç´ ã ã‘æ®‹ã—ã¾ã™ã€‚'};
}
function genThroughput(base){
  const seconds=[30,60,120][Math.floor(Math.random()*3)],count=[60,90,120,180][Math.floor(Math.random()*4)];
  const v=count/(seconds/60),correct=Number.isInteger(v)?String(v):v.toFixed(1);
  const p=choicePack(correct,[String(count),String(Math.round(v/2)),String(Math.round(v*2))]);
  return {id:variantId(base.id),sourceId:base.id,variant:true,cat:base.cat,concept:base.concept,difficulty:'æ¨™æº–',
    q:`${seconds}ç§’é–“ã«${count}ä»¶å‡¦ç†ã§ãã‚‹ã‚·ã‚¹ãƒ†ãƒ ã®ã€1åˆ†å½“ãŸã‚Šã®ã‚¹ãƒ«ãƒ¼ãƒ—ãƒƒãƒˆã¯ä½•ä»¶ï¼Ÿ`,options:p.options,a:p.a,
    exp:`${count}Ã·(${seconds}/60)=${correct}ä»¶/åˆ†ã§ã™ã€‚`,hint:'æ™‚é–“ã‚’1åˆ†ã«ãã‚ãˆã¾ã™ã€‚'};
}


function genSubnet(base){
  const prefix=[25,26,27][Math.floor(Math.random()*3)];
  const block=256/Math.pow(2,prefix-24);
  const third=10+Math.floor(Math.random()*20);
  const host=1+Math.floor(Math.random()*254);
  const network=Math.floor(host/block)*block;
  const broadcast=network+block-1;
  const correct=`192.168.${third}.${network}`;
  const p=choicePack(correct,[
    `192.168.${third}.${broadcast}`,
    `192.168.${third}.${host}`,
    `192.168.${third}.0`
  ]);
  return {
    id:variantId(base.id),sourceId:base.id,variant:true,
    cat:base.cat,concept:base.concept,difficulty:'æ¨™æº–',
    q:`IPv4ã‚¢ãƒ‰ãƒ¬ã‚¹ 192.168.${third}.${host}/${prefix} ã®ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã‚¢ãƒ‰ãƒ¬ã‚¹ã¯ï¼Ÿ`,
    options:p.options,a:p.a,
    exp:`/${prefix}ã§ã¯ç¬¬4ã‚ªã‚¯ãƒ†ãƒƒãƒˆã®ãƒ–ãƒ­ãƒƒã‚¯å¹…ã¯${block}ã§ã™ã€‚${host}ã‚’å«ã‚€ç¯„å›²ã¯${network}ã€œ${broadcast}ãªã®ã§ã€ãƒãƒƒãƒˆãƒ¯ãƒ¼ã‚¯ã‚¢ãƒ‰ãƒ¬ã‚¹ã¯${correct}ã§ã™ã€‚`,
    hint:`/${prefix}ã®ãƒ–ãƒ­ãƒƒã‚¯å¹… ${block} ã”ã¨ã«åŒºåˆ‡ã‚Šã¾ã™ã€‚`
  };
}

function genSqlWhere(base){
  const columns=[
    ['salary','çµ¦ä¸Ž',200000,600000,50000],
    ['age','å¹´é½¢',20,60,5],
    ['score','å¾—ç‚¹',40,90,10]
  ];
  const [col,label,min,max,step]=columns[Math.floor(Math.random()*columns.length)];
  const threshold=min+Math.floor(Math.random()*((max-min)/step+1))*step;
  const ge=Math.random()<0.5;
  const op=ge?'>=':'<';
  const jp=ge?'ä»¥ä¸Š':'æœªæº€';
  const correct=`WHERE ${col} ${op} ${threshold}`;
  const p=choicePack(correct,[
    `WHERE ${col} ${ge?'<=':'>'} ${threshold}`,
    `WHERE ${col} = ${threshold}`,
    `WHERE ${col} LIKE ${threshold}`
  ]);
  return {
    id:variantId(base.id),sourceId:base.id,variant:true,
    cat:base.cat,concept:base.concept,difficulty:'åŸºç¤Ž',
    q:`è¡¨ employee ã‹ã‚‰${label}ï¼ˆ${col}ï¼‰ãŒ${threshold}${jp}ã®è¡Œã‚’æ¤œç´¢ã—ãŸã„ã€‚é©åˆ‡ãªWHEREå¥ã¯ï¼Ÿ`,
    options:p.options,a:p.a,
    exp:`ã€Œ${jp}ã€ãªã®ã§æ¼”ç®—å­ã¯ ${op} ã§ã™ã€‚æ­£ã—ãã¯ ${correct} ã§ã™ã€‚`,
    hint:`ã€Œä»¥ä¸Šã€ã¯ >=ã€ã€Œæœªæº€ã€ã¯ < ã§ã™ã€‚`
  };
}

function genSqlAggregate(base){
  const specs=[
    ['åˆè¨ˆ','SUM','amount'],
    ['å¹³å‡','AVG','score'],
    ['æœ€å¤§å€¤','MAX','price'],
    ['æœ€å°å€¤','MIN','price'],
    ['è¡Œæ•°','COUNT','*']
  ];
  const [jp,fn,col]=specs[Math.floor(Math.random()*specs.length)];
  const correct=`${fn}(${col})`;
  const otherFns=['SUM','AVG','MAX','MIN','COUNT'].filter(x=>x!==fn);
  const distractors=shuffledCopy(otherFns).slice(0,3).map(x=>`${x}(${col})`);
  const p=choicePack(correct,distractors);
  return {
    id:variantId(base.id),sourceId:base.id,variant:true,
    cat:base.cat,concept:base.concept,difficulty:'æ¨™æº–',
    q:`SQLã§${col==='*'?'è¡¨ã®':col+'åˆ—ã®'}${jp}ã‚’æ±‚ã‚ã‚‹å¼ã¯ï¼Ÿ`,
    options:p.options,a:p.a,
    exp:`${jp}ã‚’æ±‚ã‚ã‚‹é›†ç´„é–¢æ•°ã¯ ${fn} ãªã®ã§ ${correct} ã§ã™ã€‚`,
    hint:`SUM=åˆè¨ˆã€AVG=å¹³å‡ã€MAX=æœ€å¤§ã€MIN=æœ€å°ã€COUNT=ä»¶æ•°ã§ã™ã€‚`
  };
}

function genLogic(base){
  const A=Math.random()<0.5, B=Math.random()<0.5;
  const ops=['AND','OR','XOR'];
  const op=ops[Math.floor(Math.random()*ops.length)];
  let value=false;
  if(op==='AND') value=A&&B;
  if(op==='OR') value=A||B;
  if(op==='XOR') value=(A!==B);
  const correct=value?'çœŸ':'å½';
  const p=choicePack(correct,[value?'å½':'çœŸ','å ´åˆã«ã‚ˆã‚‹','å®šç¾©ã§ããªã„']);
  return {
    id:variantId(base.id),sourceId:base.id,variant:true,
    cat:base.cat,concept:base.concept,difficulty:'åŸºç¤Ž',
    q:`AãŒ${A?'çœŸ':'å½'}ã€BãŒ${B?'çœŸ':'å½'}ã®ã¨ãã€A ${op} B ã®çµæžœã¯ï¼Ÿ`,
    options:p.options,a:p.a,
    exp:`${op}ã®è¦å‰‡ã«å¾“ã†ã¨ã€${A?'çœŸ':'å½'} ${op} ${B?'çœŸ':'å½'} ã¯ ${correct} ã§ã™ã€‚`,
    hint:op==='AND'?'ä¸¡æ–¹ãŒçœŸã®ã¨ãã ã‘çœŸã§ã™ã€‚':op==='OR'?'ã©ã¡ã‚‰ã‹ä¸€æ–¹ã§ã‚‚çœŸãªã‚‰çœŸã§ã™ã€‚':'XORã¯ç‰‡æ–¹ã ã‘ãŒçœŸã®ã¨ãçœŸã§ã™ã€‚'
  };
}

function genPublicKeyCrypto(base){
  const names=shuffledCopy(['Aã•ã‚“','Bã•ã‚“','Cã•ã‚“','Dã•ã‚“']).slice(0,2);
  const sender=names[0],receiver=names[1];
  const correct=`${receiver}ã®å…¬é–‹éµ`;
  const p=choicePack(correct,[
    `${receiver}ã®ç§˜å¯†éµ`,
    `${sender}ã®å…¬é–‹éµ`,
    `${sender}ã®ç§˜å¯†éµ`
  ]);
  return {
    id:variantId(base.id),sourceId:base.id,variant:true,
    cat:base.cat,concept:base.concept,difficulty:'æ¨™æº–',
    q:`${sender}ãŒ${receiver}ã ã‘ã«èª­ã‚ã‚‹ã‚ˆã†å…¬é–‹éµæš—å·æ–¹å¼ã§ãƒ¡ãƒƒã‚»ãƒ¼ã‚¸ã‚’æš—å·åŒ–ã™ã‚‹ã€‚é€šå¸¸ã€æš—å·åŒ–ã«ä½¿ã†éµã¯ï¼Ÿ`,
    options:p.options,a:p.a,
    exp:`å—ä¿¡è€…ã§ã‚ã‚‹${receiver}ã®å…¬é–‹éµã§æš—å·åŒ–ã—ã€${receiver}ã®ç§˜å¯†éµã§å¾©å·ã—ã¾ã™ã€‚`,
    hint:'ç§˜å¯†éµã‚’æŒã¤æœ¬äººã ã‘ãŒå¾©å·ã§ãã‚‹ã‚ˆã†ã«ã—ã¾ã™ã€‚'
  };
}

function genSymmetricCrypto(base){
  const correct='æš—å·åŒ–ã¨å¾©å·ã«åŒã˜ç§˜å¯†éµã‚’ä½¿ã†';
  const p=choicePack(correct,[
    'æš—å·åŒ–ã¯å…¬é–‹éµã€å¾©å·ã¯ç§˜å¯†éµã‚’ä½¿ã†',
    'ãƒãƒƒã‚·ãƒ¥å€¤ã‹ã‚‰å…ƒã®å¹³æ–‡ã‚’å¾©å…ƒã™ã‚‹',
    'ç½²åè€…ã®ç§˜å¯†éµã§å—ä¿¡è€…å‘ã‘æš—å·æ–‡ã‚’å¾©å·ã™ã‚‹'
  ]);
  return {
    id:variantId(base.id),sourceId:base.id,variant:true,
    cat:base.cat,concept:base.concept,difficulty:'åŸºç¤Ž',
    q:'å…±é€šéµæš—å·æ–¹å¼ã®ç‰¹å¾´ã¨ã—ã¦æœ€ã‚‚é©åˆ‡ãªã®ã¯ï¼Ÿ',
    options:p.options,a:p.a,
    exp:'å…±é€šéµæš—å·æ–¹å¼ã¯ã€æš—å·åŒ–ã¨å¾©å·ã§åŒã˜ç§˜å¯†éµã‚’å…±æœ‰ã—ã¦ä½¿ã„ã¾ã™ã€‚',
    hint:'ã€Œå…±é€šã€ã®éµã‚’é€ä¿¡å´ã¨å—ä¿¡å´ã§å…±æœ‰ã—ã¾ã™ã€‚'
  };
}

function genDigitalSignature(base){
  const names=shuffledCopy(['Aã•ã‚“','Bã•ã‚“','Cã•ã‚“']).slice(0,2);
  const signer=names[0],receiver=names[1];
  const askSign=Math.random()<0.5;
  const correct=askSign?`${signer}ã®ç§˜å¯†éµ`:`${signer}ã®å…¬é–‹éµ`;
  const p=choicePack(correct,[
    askSign?`${signer}ã®å…¬é–‹éµ`:`${signer}ã®ç§˜å¯†éµ`,
    `${receiver}ã®å…¬é–‹éµ`,
    `${receiver}ã®ç§˜å¯†éµ`
  ]);
  return {
    id:variantId(base.id),sourceId:base.id,variant:true,
    cat:base.cat,concept:base.concept,difficulty:'æ¨™æº–',
    q:askSign
      ? `${signer}ãŒãƒ‡ã‚¸ã‚¿ãƒ«ç½²åã‚’ä»˜ã‘ã¦${receiver}ã¸é€ã‚‹ã€‚ç½²åã®ç”Ÿæˆã«ä¸»ã«ä½¿ã†éµã¯ï¼Ÿ`
      : `${signer}ãŒä»˜ã‘ãŸãƒ‡ã‚¸ã‚¿ãƒ«ç½²åã‚’${receiver}ãŒæ¤œè¨¼ã™ã‚‹ã€‚æ¤œè¨¼ã«ä¸»ã«ä½¿ã†éµã¯ï¼Ÿ`,
    options:p.options,a:p.a,
    exp:askSign
      ? `ç½²åè€…${signer}ã¯è‡ªåˆ†ã®ç§˜å¯†éµã§ç½²åã‚’ç”Ÿæˆã—ã¾ã™ã€‚`
      : `æ¤œè¨¼å´ã¯ç½²åè€…${signer}ã®å…¬é–‹éµã‚’ä½¿ã£ã¦ç½²åã‚’ç¢ºèªã—ã¾ã™ã€‚`,
    hint:askSign?'ç½²åè€…æœ¬äººã—ã‹æŒãŸãªã„éµã‚’ä½¿ã„ã¾ã™ã€‚':'ç½²åè€…ã®å…¬é–‹éµã¯æ¤œè¨¼è€…ãŒåˆ©ç”¨ã§ãã¾ã™ã€‚'
  };
}

function genBreakEven(base){
  const price=[800,1000,1200,1500][Math.floor(Math.random()*4)];
  const variable=[300,400,500,600][Math.floor(Math.random()*4)];
  const margin=Math.max(200,price-variable);
  const units=[100,150,200,250][Math.floor(Math.random()*4)];
  const fixed=margin*units;
  const correct=units;
  const p=choicePack(correct,[Math.max(1,units-50),units+50,Math.round(fixed/price)]);
  return {
    id:variantId(base.id),sourceId:base.id,variant:true,
    cat:base.cat,concept:base.concept,difficulty:'æ¨™æº–',
    q:`1å€‹${price}å††ã§è²©å£²ã—ã€1å€‹å½“ãŸã‚Šå¤‰å‹•è²»ãŒ${variable}å††ã€å›ºå®šè²»ãŒ${fixed}å††ã§ã‚ã‚‹ã€‚æç›Šåˆ†å²ç‚¹è²©å£²æ•°é‡ã¯ï¼Ÿ`,
    options:p.options,a:p.a,
    exp:`1å€‹å½“ãŸã‚Šé™ç•Œåˆ©ç›Šã¯ ${price}-${variable}=${margin}å††ã€‚å›ºå®šè²»${fixed}Ã·${margin}=${units}å€‹ã§ã™ã€‚`,
    hint:'å›ºå®šè²» Ã·ï¼ˆè²©å£²å˜ä¾¡ï¼1å€‹å½“ãŸã‚Šå¤‰å‹•è²»ï¼‰ã§æ±‚ã‚ã¾ã™ã€‚'
  };
}


const VARIANT_GENERATORS=[
  {match:q=>q.concept==='ã‚µãƒ–ãƒãƒƒãƒˆ',gen:genSubnet},
  {match:q=>q.concept==='SQL',gen:genSqlWhere},
  {match:q=>q.concept==='SQLé›†ç´„',gen:genSqlAggregate},
  {match:q=>q.concept==='è«–ç†æ¼”ç®—',gen:genLogic},
  {match:q=>q.concept==='å…¬é–‹éµæš—å·',gen:genPublicKeyCrypto},
  {match:q=>q.concept==='å…±é€šéµæš—å·',gen:genSymmetricCrypto},
  {match:q=>q.concept==='ãƒ‡ã‚¸ã‚¿ãƒ«ç½²å',gen:genDigitalSignature},
  {match:q=>q.concept==='æç›Šåˆ†å²ç‚¹',gen:genBreakEven},
  {match:q=>q.concept==='åŸºæ•°å¤‰æ›',gen:genBaseConversion},
  {match:q=>q.concept==='16é€²æ•°',gen:genHexConversion},
  {match:q=>q.concept==='ä¿¡é ¼æ€§',gen:genReliability},
  {match:q=>q.concept==='ç”»åƒãƒ‡ãƒ¼ã‚¿é‡',gen:genImageSize},
  {match:q=>q.concept==='è²¡å‹™',gen:genGrossProfit},
  {match:q=>q.concept==='ã‚­ãƒ¥ãƒ¼',gen:genQueue},
  {match:q=>q.concept==='ã‚¹ã‚¿ãƒƒã‚¯',gen:genStack},
  {match:q=>q.concept==='æ¡ä»¶åˆ†å²',gen:genConditional},
  {match:q=>q.concept==='é›†åˆ',gen:genSetIntersection},
  {match:q=>q.concept==='ã‚¹ãƒ«ãƒ¼ãƒ—ãƒƒãƒˆ',gen:genThroughput}
];
function generatorFor(q){return VARIANT_GENERATORS.find(x=>x.match(q))?.gen||null;}
function hasVariant(q){return !!generatorFor(q);}
function generateVariant(q){
  const g=generatorFor(q);
  if(!g)return null;
  try{
    const v=g(q);
    if(!v||!Array.isArray(v.options)||v.options.length!==4||v.a<0||v.a>3||v.options[v.a]==null)return null;
    return v;
  }catch(e){console.warn('variant generation failed',q.id,e);return null;}
}
function siblingVariant(q){
  const lessonId=lessonForQuestion(q);
  const sameLesson=lessonId?QUESTION_BANK.filter(x=>x.id!==q.id && lessonForQuestion(x)===lessonId):[];
  const sameConcept=QUESTION_BANK.filter(x=>x.id!==q.id && x.concept===q.concept);
  const pool=sameLesson.length?sameLesson:sameConcept;
  if(!pool.length) return null;
  const picked=shuffledCopy(pool)[0];
  return {...picked,id:variantId(q.id),sourceId:q.sourceId||q.id,variant:true,variantSibling:true};
}
function buildReviewItem(q){
  if(profile.settings.variantReview===false)return q;
  return generateVariant(q)||siblingVariant(q)||q;
}
function variantCoverage(){
  const direct=QUESTION_BANK.filter(hasVariant).length,total=QUESTION_BANK.length;
  const concepts=[...new Set(QUESTION_BANK.filter(hasVariant).map(q=>q.concept))].length;
  return {direct,total,concepts};
}
function validateGeneratedVariants(){
  let count=0;
  for(const base of QUESTION_BANK.filter(hasVariant)){
    for(let i=0;i<8;i++){
      const q=generateVariant(base);
      if(!q||q.options.length!==4||q.a<0||q.a>3||q.options[q.a]==null)throw new Error('invalid variant '+base.id);
      if(q.sourceId!==base.id)throw new Error('source mismatch '+base.id);
      count++;
    }
  }
  return count;
}



const CORE_A_DIFFICULTY_LEVELS=['åŸºç¤Ž','æ¨™æº–','å®Ÿæˆ¦'];
const CORE_A_DIFFICULTY_RANK={'åŸºç¤Ž':0,'æ¨™æº–':1,'å®Ÿæˆ¦':2};

function coreChapterDifficultyTarget(pool){
  const available=CORE_A_DIFFICULTY_LEVELS.reduce((a,k)=>(a[k]=pool.filter(q=>q.difficulty===k).length,a),{});
  const target={'åŸºç¤Ž':0,'æ¨™æº–':0,'å®Ÿæˆ¦':0};
  let left=12;

  // ç« æœ«ã¯ã€Œæ€ã„å‡ºã™ã€ã‚ˆã‚Šã€Œä½¿ã†ãƒ»è¦‹åˆ†ã‘ã‚‹ã€ã‚’é‡è¦–ã™ã‚‹ã€‚
  target['å®Ÿæˆ¦']=Math.min(5,available['å®Ÿæˆ¦']||0,left);left-=target['å®Ÿæˆ¦'];
  target['åŸºç¤Ž']=Math.min(1,available['åŸºç¤Ž']||0,left);left-=target['åŸºç¤Ž'];
  target['æ¨™æº–']=Math.min(left,available['æ¨™æº–']||0);left-=target['æ¨™æº–'];

  // å°ç« ãªã©ã§ä¸€ã¤ã®é›£æ˜“åº¦ãŒä¸è¶³ã™ã‚‹å ´åˆã ã‘ã€æ®‹ã‚Šã‚’ä»–ã®å±¤ã‹ã‚‰è£œã†ã€‚
  for(const level of ['å®Ÿæˆ¦','æ¨™æº–','åŸºç¤Ž']){
    if(left<=0)break;
    const spare=Math.max(0,(available[level]||0)-target[level]);
    const add=Math.min(left,spare);
    target[level]+=add;left-=add;
  }
  return target;
}
function coreChapterQuestionRichness(q){
  if(String(q.id||'').startsWith('challenge_cmp_'))return 100;
  const score={comparison:95,calculation:90,scenario:82,interpretation:76,trace:76,discrimination:72,application:64,knowledge:30};
  return score[q.angle]||45;
}
function coreChapterQuestionNovelty(q){
  const attempts=(typeof profile!=='undefined'&&profile.qStats?.[q.id]?.attempts)||0;
  return attempts===0?24:0;
}
function buildCoreChapterQuiz(ch){
  const topics=CORE_A_CURRICULUM.filter(t=>t.chapter===ch);
  const ids=topics.map(t=>t.id);
  const chapterExtras=CORE_A_CHAPTER_EXTRA_QUESTIONS[ch]||[];
  const pool=[...QUESTION_BANK.filter(q=>q.coreTopicId&&ids.includes(q.coreTopicId)),...chapterExtras];
  const target=coreChapterDifficultyTarget(pool);
  const out=[],used=new Set(),topicCounts={},levelCounts={'åŸºç¤Ž':0,'æ¨™æº–':0,'å®Ÿæˆ¦':0};

  const canUse=q=>q&&!used.has(q.id)&&(levelCounts[q.difficulty]||0)<(target[q.difficulty]||0);
  const add=q=>{
    if(!q||used.has(q.id))return false;
    out.push(q);used.add(q.id);
    if(q.coreTopicId)topicCounts[q.coreTopicId]=(topicCounts[q.coreTopicId]||0)+1;
    levelCounts[q.difficulty]=(levelCounts[q.difficulty]||0)+1;
    return true;
  };
  const best=(candidates,preferUncovered=false)=>{
    const list=shuffled(candidates.filter(canUse));
    list.sort((a,b)=>{
      const ac=topicCounts[a.coreTopicId]||0,bc=topicCounts[b.coreTopicId]||0;
      if(preferUncovered&&((ac===0)!==(bc===0)))return ac===0?-1:1;
      if(ac!==bc)return ac-bc;
      return (coreChapterQuestionRichness(b)+coreChapterQuestionNovelty(b))-(coreChapterQuestionRichness(a)+coreChapterQuestionNovelty(a));
    });
    return list[0]||null;
  };

  // 1) ç« æœ«ã‚‰ã—ã„ã€Œè¿‘ã„æ¦‚å¿µã®è¦‹åˆ†ã‘ã€ã‚’æœ€å¤§3å•ã€å­˜åœ¨ã™ã‚‹ç¯„å›²ã§å„ªå…ˆç¢ºä¿ã€‚
  const comparisons=pool.filter(q=>String(q.id||'').startsWith('challenge_cmp_')||q.angle==='comparison');
  const comparisonGoal=Math.min(3,comparisons.length,Math.max(1,(target['å®Ÿæˆ¦']||0)));
  for(let i=0;i<comparisonGoal;i++){
    const q=best(comparisons,true);
    if(!q)break;
    add(q);
  }

  // 2) è¨ˆç®—ãƒ†ãƒ¼ãƒžãŒã‚ã‚‹ç« ã§ã¯ã€å…¬å¼ã‚’æ€ã„å‡ºã™ã ã‘ã§ãªãå®Ÿéš›ã«ä½¿ã†å•é¡Œã‚’æœ€ä½Ž1å•å…¥ã‚Œã‚‹ã€‚
  const calculations=pool.filter(q=>q.angle==='calculation');
  if(calculations.length&&!out.some(q=>q.angle==='calculation')){
    const q=best(calculations,true);
    if(q)add(q);
  }

  // 3) ãã®ç« ã®å…¨ãƒ†ãƒ¼ãƒžã‚’æœ€ä½Ž1å›žã¯æ‰±ã†ã€‚
  //    å®Ÿæˆ¦â†’æ¨™æº–ã‚’å„ªå…ˆã—ã€åŸºç¤Ž1å•ã¯æœ€å¾Œã®ç¢ºèªç”¨ã«æ®‹ã™ã€‚
  const remainingTopics=shuffled(topics.filter(t=>(topicCounts[t.id]||0)===0));
  for(const t of remainingTopics){
    const same=pool.filter(q=>q.coreTopicId===t.id&&!used.has(q.id));
    let q=null;
    for(const level of ['å®Ÿæˆ¦','æ¨™æº–','åŸºç¤Ž']){
      if((levelCounts[level]||0)>=(target[level]||0))continue;
      q=best(same.filter(x=>x.difficulty===level));
      if(q)break;
    }
    if(!q){
      q=shuffled(same).sort((a,b)=>coreChapterQuestionRichness(b)-coreChapterQuestionRichness(a))[0]||null;
    }
    add(q);
  }

  // 4) æ®‹ã‚Šã¯é›£æ˜“åº¦ç›®æ¨™ã‚’æº€ãŸã—ã¤ã¤ã€åŒã˜ãƒ†ãƒ¼ãƒžã¸ã®åã‚Šã‚’æœ€å°åŒ–ã€‚
  for(const level of ['å®Ÿæˆ¦','æ¨™æº–','åŸºç¤Ž']){
    while((levelCounts[level]||0)<(target[level]||0)&&out.length<12){
      const q=best(pool.filter(x=>x.difficulty===level));
      if(!q)break;
      add(q);
    }
  }

  // 5) æƒ³å®šå¤–ã®ä¸è¶³æ™‚ã ã‘ã€æœªä½¿ç”¨å•é¡Œã‹ã‚‰è£œã†ã€‚
  while(out.length<12){
    const rest=shuffled(pool.filter(q=>!used.has(q.id))).sort((a,b)=>{
      const ac=topicCounts[a.coreTopicId]||0,bc=topicCounts[b.coreTopicId]||0;
      if(ac!==bc)return ac-bc;
      return (coreChapterQuestionRichness(b)+coreChapterQuestionNovelty(b))-(coreChapterQuestionRichness(a)+coreChapterQuestionNovelty(a));
    });
    if(!rest.length)break;
    add(rest[0]);
  }
  return shuffled(out.slice(0,12));
}
function coreChapterQuizAudit(ch,items){
  const topics=CORE_A_CURRICULUM.filter(t=>t.chapter===ch);
  const poolIds=new Set(topics.map(t=>t.id));
  const topicCounts={};
  (items||[]).forEach(q=>{
    if(q.coreTopicId&&poolIds.has(q.coreTopicId))topicCounts[q.coreTopicId]=(topicCounts[q.coreTopicId]||0)+1;
  });
  const comparisons=(items||[]).filter(q=>String(q.id||'').startsWith('challenge_cmp_')||q.angle==='comparison').length;
  const calculations=(items||[]).filter(q=>q.angle==='calculation').length;
  const difficulty=CORE_A_DIFFICULTY_LEVELS.reduce((a,k)=>(a[k]=(items||[]).filter(q=>q.difficulty===k).length,a),{});
  return {
    total:(items||[]).length,
    covered:topics.filter(t=>(topicCounts[t.id]||0)>0).length,
    topicTotal:topics.length,
    maxPerTopic:Math.max(0,...Object.values(topicCounts)),
    comparisons,calculations,difficulty
  };
}

function startQuiz(mode){
  ensureQuestionProfile();
  quizMode=mode;
  if(String(mode).startsWith('journey:')){
    const id=String(mode).slice(8);
    const base=questionById(id);
    quizItems=base?[buildReviewItem(base)]:[];
  }else if(String(mode).startsWith('coretopic:')){
    const id=String(mode).slice(10);
    const pool=QUESTION_BANK.filter(q=>q.coreTopicId===id&&isCoreTopicImmediatePracticeQuestion(q));
    // v127: after a lesson, questions progress from foundation -> concrete application -> harder evidence.
    // Random ordering made the bridge inconsistent and could surface a generic discrimination item before an applied check.
    quizItems=orderCoreTopicPracticeQuestions(pool);
  }else if(String(mode).startsWith('corechapter:')){
    const ch=Number(String(mode).slice(12));
    quizItems=buildCoreChapterQuiz(ch);
  }else if(mode==='warmup'){
    quizItems=chooseExamWarmupQuestions(3);
  }else if(mode==='taperreview'){
    quizItems=chooseTaperReviewQuestions(5);
  }else if(mode==='review'){
    const due=dueQuestions();
    const bases=due.length ? due.slice(0,10) : chooseWeakQuestions(5);
    quizItems=bases.map(buildReviewItem);
  }else if(mode==='weak'){
    quizItems=chooseWeakQuestions(10);
  }else if(mode==='boss'){
    const days=examDaysRemaining();
    quizItems=(days!=null&&days<=14)?chooseFinalBossQuestions(5):chooseRandomBalanced(5);
  }else if(String(mode).startsWith('cogcat:')){
    const [,cat,level]=String(mode).split(':');
    const targeted=QUESTION_BANK.filter(q=>q.cat===cat&&q.cognitiveLevel===level);
    const ranked=shuffled(targeted).sort((a,b)=>reviewUrgency(b)-reviewUrgency(a));
    quizItems=ranked.slice(0,10);
    if(quizItems.length<10){
      const used=new Set(quizItems.map(q=>q.id));
      quizItems.push(...shuffled(QUESTION_BANK.filter(q=>q.cat===cat&&!used.has(q.id))).slice(0,10-quizItems.length));
    }
  }else if(String(mode).startsWith('cat:')){
    const cat=String(mode).slice(4);
    quizItems=shuffled(QUESTION_BANK.filter(q=>q.cat===cat)).slice(0,10);
  }else if(String(mode).startsWith('rx:')){
    quizItems=buildPrescriptionQuiz(mode);
  }else{
    quizItems=chooseRandomBalanced(10);
  }
  quizIndex=0;
  quizSelected=null;
  quizAnswered=false;
  quizCorrectCount=0;
  quizWrongCount=0;
  quizEarnedXp=0;
  quizPickedReason=null;
  quizRecoveredCount=0;
  stopQuestionPacer();
  sessionLog=[];

  document.getElementById('problems')?.classList.add('exercise-session-active');
  problemHub.style.display='none';
  quizResultScreen.style.display='none';
  quizSession.style.display='block';

  const titles={review:'ä»Šæ—¥ã®å¾©ç¿’',taperreview:'ç›´å‰å¾©ç¿’ 5å•',warmup:'å—é¨“å‰ã‚¦ã‚©ãƒ¼ãƒ ã‚¢ãƒƒãƒ— 3å•',weak:'å¼±ç‚¹10å•',random:'ãƒ©ãƒ³ãƒ€ãƒ 10å•',boss:'ä»Šæ—¥ã®ç·åˆãƒã‚§ãƒƒã‚¯'};
  const modeTitle=String(mode).startsWith('journey:')
    ?'å¾©ç¿’ãƒ«ãƒ¼ãƒˆãƒ»é¡žé¡Œç¢ºèª'
    :String(mode).startsWith('coretopic:')
      ?`${CORE_A_TOPIC_MAP[String(mode).slice(10)]?.title||'ãƒ†ãƒ¼ãƒž'}ãƒ»ãƒ†ãƒ¼ãƒžæ¼”ç¿’`
      :String(mode).startsWith('corechapter:')
        ?`ç¬¬${String(mode).slice(12)}ç« ãƒ»ç« æœ«ãƒã‚§ãƒƒã‚¯`
        :String(mode).startsWith('cogcat:')
        ?`${String(mode).split(':')[1]}ãƒ»${String(mode).split(':')[2]} é›†ä¸­ç‰¹è¨“`
        :String(mode).startsWith('cat:')
          ?`${String(mode).slice(4)} é›†ä¸­ç‰¹è¨“`
        :String(mode).startsWith('rx:')
          ?prescriptionMeta(mode).title
          :titles[mode];
  document.getElementById('quizSessionTitle').textContent=modeTitle||'å•é¡Œæ¼”ç¿’';
  document.getElementById('quizSessionSub').textContent=String(mode).startsWith('corechapter:')
    ?`ç§‘ç›®A ç« æœ«çµ±åˆæ¼”ç¿’ãƒ»å…¨${CORE_A_CURRICULUM.filter(t=>t.chapter===Number(String(mode).slice(12))).length}ãƒ†ãƒ¼ãƒž`
    :'ç§‘ç›®A å•é¡Œæ¼”ç¿’';
  configurePrescriptionUI(mode);
  renderQuizQuestion();
  requestAnimationFrame(()=>document.getElementById('quizSession')?.scrollIntoView({block:'start',behavior:'auto'}));
}

document.querySelectorAll('.problem-mode button[data-mode]').forEach(b=>{
  b.addEventListener('click',()=>startQuiz(b.dataset.mode));
});

function renderQuizQuestion(){
  const q=quizItems[quizIndex];
  quizSelected=null;
  quizAnswered=false;
  quizPickedReason=null;
  quizRetryCount=0;
  quizFirstAttemptWrong=false;
  rxTechniqueReady=true;
  rxTechniqueData={};
  stopQuestionPacer();
  quizQuestionStartedAt=Date.now();
  quizFirstAttemptSeconds=0;

  document.getElementById('quizCategory').textContent=`${q.cat}ãƒ»${q.concept}`;
  const angleNames={knowledge:'çŸ¥è­˜',application:'é©ç”¨ä¾‹',discrimination:'è¦‹åˆ†ã‘',calculation:'è¨ˆç®—',scenario:'çŠ¶æ³åˆ¤æ–­',interpretation:'èª­è§£',trace:'æ“ä½œè¿½è·¡',comparison:'æ¯”è¼ƒ'};
  document.getElementById('quizDifficulty').textContent=q.angle?`${q.difficulty}ãƒ»${angleNames[q.angle]||q.angle}`:q.difficulty;
  document.getElementById('quizQuestion').textContent=q.q;
  const vb=document.getElementById('variantBadge');
  if(vb){
    vb.style.display=q.variant?'inline-block':'none';
    vb.textContent=q.variantSibling?'é–¢é€£å•é¡Œå¾©ç¿’':'ãƒãƒªã‚¨ãƒ¼ã‚·ãƒ§ãƒ³å¾©ç¿’';
  }
  document.getElementById('quizCounter').textContent=`${quizIndex+1} / ${quizItems.length}`;
  document.getElementById('quizProgress').style.width=`${(quizIndex/quizItems.length)*100}%`;
  const quizExplain=document.getElementById('quizExplain');
  quizExplain.classList.remove('show');
  quizExplain.style.height='auto';
  quizExplain.style.minHeight='0';
  quizExplain.querySelectorAll('.memory-next-note,.variant-source-note,.retry-note,.review-route-inline').forEach(x=>x.remove());
  document.getElementById('quizResultTitle').textContent='';
  document.getElementById('quizExplanation').textContent='';
  document.getElementById('quizHint').textContent='';
  document.getElementById('reasonBox').classList.remove('show');
  document.getElementById('quizSubmit').textContent='å›žç­”ã™ã‚‹';
  document.getElementById('quizSubmit').disabled=false;
  document.getElementById('quizHintBtn').style.display='block';
  document.querySelector('.quiz-actions')?.classList.remove('single-primary');

  document.querySelectorAll('.reason-chip').forEach(c=>c.classList.remove('picked'));
  renderRxTechnique(q);

  const opts=document.getElementById('quizOptions');
  opts.innerHTML='';
  q.options.forEach((op,i)=>{
    const b=document.createElement('button');
    b.className='quiz-option';
    b.textContent=`${String.fromCharCode(65+i)}. ${op}`;
    b.addEventListener('click',()=>{
      if(quizAnswered) return;
      quizSelected=i;
      document.querySelectorAll('.quiz-option').forEach(x=>x.classList.remove('selected'));
      b.classList.add('selected');
    });
    opts.appendChild(b);
  });
}

document.getElementById('quizHintBtn')?.addEventListener('click',()=>{
  const q=quizItems[quizIndex];
  popToast(q.hint);
});

document.getElementById('quizSubmit')?.addEventListener('click',()=>{
  if(!quizAnswered){
    if(quizSelected===null){
      popToast('é¸æŠžè‚¢ã‚’1ã¤é¸ã‚“ã§ãã ã•ã„');
      return;
    }
    if(!validateRxTechniqueBeforeAnswer()) return;
    gradeCurrentQuestion();
  }else{
    if(quizIndex < quizItems.length-1){
      quizIndex++;
      renderQuizQuestion();
    }else{
      finishQuizSession();
    }
  }
});


function renderChoiceExplanations(q){
  const letters=['A','B','C','D'];
  const rows=(q.options||[]).map((op,i)=>({op,i})).filter(x=>x.i!==q.a).map(({op,i})=>{
    const reason=(q.choiceExps||[])[i]||'';
    return `<div class="choice-explanation is-wrong">
      <div class="choice-explanation-head">
        <span class="choice-mark">Ã—</span>
        <b>${letters[i]}. ${escapeHtml(op)}</b>
      </div>
      <div class="choice-explanation-body">${learningHtml(reason)}</div>
    </div>`;
  }).join('');
  return `<div class="choice-explanations">
    <div class="choice-explanations-title">ä»–ã®é¸æŠžè‚¢</div>
    ${rows}
  </div>`;
}
function renderFinalQuizExplanation(q){
  const root=document.getElementById('quizExplanation');
  if(!root)return;
  root.innerHTML=`
    <div class="answer-rationale">
      <div class="answer-rationale-title">æ­£è§£ã®æ ¹æ‹ </div>
      <div>${learningHtml(q.exp)}</div>
    </div>
    ${renderChoiceExplanations(q)}
  `;
}

function gradeCurrentQuestion(){
  const q=quizItems[quizIndex];
  const ok=quizSelected===q.a;
  const statId=q.sourceId||q.id;
  const st=profile.qStats[statId];
  const selectedNow=quizSelected;
  const attemptSeconds=Math.max(1,Math.round((Date.now()-quizQuestionStartedAt)/1000));

  // é€šå¸¸æ¼”ç¿’ã§ã¯ã™ã¹ã¦ã€Œåˆå›žèª¤ç­”â†’ãƒ’ãƒ³ãƒˆâ†’1å›žã ã‘å†æŒ‘æˆ¦ã€ã«çµ±ä¸€ã™ã‚‹ã€‚
  // v121: èª¤ç­”æ™‚ã¯ãƒ’ãƒ³ãƒˆæœ¬æ–‡ã ã‘ã‚’è¡¨ç¤ºã—ã€æŽ¡ç‚¹ãƒ«ãƒ¼ãƒ«ã‚„ãƒ¡ã‚¿èª¬æ˜Žã¯å‡ºã•ãªã„ã€‚
  // æ¨¡è©¦ã¯åˆ¥ã®è©¦é¨“UIãªã®ã§ã€ã“ã®é–¢æ•°ã‚’é€šã‚‰ãªã„ã€‚
  if(!ok && quizRetryCount===0){
    quizRetryCount=1;
    quizFirstAttemptWrong=true;
    quizWrongCount++;
    quizFirstAttemptSeconds=attemptSeconds;

    // æˆç¸¾ãƒ»æ­£ç­”çŽ‡ãƒ»å¿˜å´ãƒ¢ãƒ‡ãƒ«ã¸å…¥ã‚Œã‚‹ã®ã¯æœ€åˆã®å›žç­”ã ã‘ã€‚
    st.attempts++;
    st.last=localDateISO(0);
    st.streak=0;
    adaptiveMemoryUpdate(st,'wrong',attemptSeconds,quizPickedReason,false);
    applyQuestionSkillDelta(q,-1);
    profile.xp+=2;
    registerReviewJourney(q,String(quizMode).startsWith('journey:')?'journey':'practice');
    saveProfile();

    const selßzëÞ›Ê×¬¢h­µçLØ9æí:/äL¹fçˆ9nlùgaÉØ‘š[˜[˜]™ßIxàîù§ 9/c‰Ø‘š[˜[›Z[ŸIX˜	Ø‘š[˜[˜ÛÝ[KÌ¹fç˜BˆNÂ‚ˆ™]\›ˆÂˆÜXÔÝ]\ËX\Ý\‹™XÛÝ™\š[™ËÝX›K\ÜÛÛ‘Û™KÚ\\”\ÜÙYÙXZÙ\ÝY[K•˜Z[š[™ËS[ØÚË‘š[˜[Ø]\Ëˆ\ÜÙY™Ø]\Ë™š[\ŠÏO™Ëœ\ÜÙY
K›[™Ýˆ™XYN™Ø]\Ë™]™\žJÏO™Ëœ\ÜÙY
BˆNÂŸB‚™[˜Ý[Ûˆ™^[œ\ÜÙYÚ\\Š
^ÂˆÛÛœÝ›ÝÜÏPÓÔ‘WÐWÐÒTT”Ë›X\
ÚOžÂˆÛÛœÝOXÚ\\’[YÜ˜][Û‘]šY[˜ÙJÚ
NÂˆÛÛœÝÜXÜÏPÓÔ‘WÐWÐÕT”’PÕSSK™š[\ŠO˜Ú\\OOXÚ
NÂˆÛÛœÝÛ™O]ÜXÜË™š[\ŠOŠ›Ùš[K›\ÜÛÛ”›ÙÜ™\ÜÏË–ÝšY_
OLL
K›[™ÝÂˆÛÛœÝÙ]Y]ÜXÜË™š[\ŠO–ÉÜÝX›IË	ÛX\Ý\‰×Kš[˜ÛY\ÊÛÜ™UÜXÓX\›š[™ÔÝ]JšY
KšÙ^JJK›[™ÝÂˆ™]\›ˆØÚKÛ™KÝ[ÜXÜË›[™ÝÙ]YNÂˆJK™š[\ŠOˆ^™Kœ\ÜÙY
NÂˆ›ÝÜËœÛÜ

KŠOOžÂˆÛÛœÝ\XK™Û™KØKÝ[œX‹™Û™KØ‹Ý[ÂˆYŠ\ˆOOXœŠ\™]\›ˆœ‹X\ŽÂˆYŠK™K˜™\Ý˜]HOOX‹™K˜™\Ý˜]J\™]\›ˆ‹™K˜™\Ý˜]KXK™K˜™\Ý˜]NÂˆ™]\›ˆK˜ÚX‹˜ÚÂˆJNÂˆ™]\›ˆ›ÝÜÖÌ_[ÂŸB‚™[˜Ý[Ûˆ™^X\Ý\•ÜXÐØ[™Y]J
^ÂˆÛÛœÝ˜[šÏ^ÜÝX›NŒ[™\œÝÛÙŒK™]šY]ÎŒ‹X\›š[™ÎŒË™]ÎX\Ý\ŽŽ_NÂˆ™]\›ˆÛÝ\œÙSX\Ý\žTÝ]\Ê
KÜXÔÝ]\Âˆ™š[\ŠOžœÝ]KšÙ^HOOIÛX\Ý\‰ÊBˆœÛÜ

KŠOOžÂˆÛÛœÝT™XÛÝ™\žO[X\Ý\žT™XÛÝ™\žR[™›ÊKÜXËšY
OÌŒK”™XÛÝ™\žO[X\Ý\žT™XÛÝ™\žR[™›Ê‹ÜXËšY
OÌŒNÂˆYŠT™XÛÝ™\žHOOX”™XÛÝ™\žJ\™]\›ˆT™XÛÝ™\žKX”™XÛÝ™\žNÂˆÛÛœÝ˜O\˜[šÖØKœÝ]KšÙ^WOÏÎ˜\˜[šÖØ‹œÝ]KšÙ^WOÏÎÂˆYŠ˜HOO\˜Š\™]\›ˆ˜K\˜ŽÂˆÛÛœÝ\XKœÝ]Kœ™][[ÛÏÌœX‹œÝ]Kœ™][[ÛÏÌÂˆ™]\›ˆœ‹X\ŽÂˆJVÌ_[ÂŸB‚™[˜Ý[Ûˆš[˜[›ØÝ\Ô™XÛÛ[Y[™][ÛŠÝ]\ÏXÛÝ\œÙSX\Ý\žTÝ]\Ê
J^ÂˆÛÛœÝ^\ÏY^[Q^\Ô™[XZ[š[™Ê
NÂˆÛÛœÝ\™Ù[\ÙOY^\ÈO[[	‰™^\ÏL	‰™^\ÏLMÂˆÛÛœÝY\\\Y^\ÈO[[	‰™^\ÏL	‰™^\ÏLÎÂˆÛÛœÝ›Ý]\ÏXXÝ[Û˜X›T™]šY]Ò›Ý\›™^\Ê
K›[™ÝÂˆÛÛœÝYOYYT]Y\Ý[ÛœÊ
K›[™ÝÂ‚ˆYŠ^\ÏOOL
^Âˆ™]\›ˆÚÚ[™‰ÝØ\›]\	ËXÛÛŽ‰ø¦ ;î#ÉË]N‰ù.â¹¥éxàkÌùecøàh8àdyè®º*£IË\ØÎ‰ù¥¬:)£ù¥fy§d8à ºemù¦`ºe¤ùª(z*i¸à º/ïyb¨8àeøào¸àføà¤øà ¹¥è¹ïäŒùecøàiù¡'ú)¦¸àh8àdy¥m8àb8ào¸àfxà ‰Ë]ÛŽ‰øà©¸àªxàï8àè8à¨¸ààøàåÌùecÉßNÂˆBˆYŠ^\ÏOOLJ^ÂˆYŠ›Ý]\ßYJ\™]\›ˆÚÚ[™‰Ü™]šY]ÉËXÛÛŽ‰ü'éè	Ë]N‰ùbcy¥éxàkùoªyïä¸àh8àdIË\ØÎ˜9oªyïä¸àêøàï8àâ	Ü›Ý]\ßy.í¸àîù§'úfdù/c¹/çy£ H	ÙY_yecøà ºemù¦`ºe¤ùª(z*i¸à¡9¥¬:)£ù¥fy§d8àkú/ïyb¨8àeøào¸àføà¤øà ˜]ÛŽ‰Íyecøào¸àiùè®º*£IßNÂˆ™]\›ˆÚÚ[™‰ÝØ\›]\	ËXÛÛŽ‰ü'ã&IË]N‰ùbcy¥éxàkú.ïxàa9è®º*£xàh8àdIË\ØÎ‰ù¥è¹ïäŒùecøàh8àdyè®º*£xàeøà y¥¬8àeøàa9ëá9fì¸àkùh¥øà¡8àeøào¸àføà¤øà ‰Ë]ÛŽ‰øà©¸àªxàï8àè8à¨¸ààøàåÌùecÉßNÂˆB‚ˆYŠ
›Ý]\ßYJI‰Š
\™Ù[\ÙJ_
Ý]\Ë›Y[K™YOŒL
JJ^Âˆ™]\›ˆÚÚ[™‰Ü™]šY]ÉËXÛÛŽ‰ü'éè	Ë]N‰ù§ 9a*¹ab;ï&¹oªyïä¹o¡xàhxà¤º)èù­¢	Ë\ØÎ˜9oªyïä¸àêøàï8àâ	Ü›Ý]\ßy.í¸àîù§'úfdù/c¹/çy£ H	ÙY_yecøà ¹b)9¥«yecúhc8à¤¹a*¹ab8àeøài¹¢.øàeøào¸àfxà ˜]ÛŽ™Y\\\ÉÍyecøào¸àiùè®º*£IÎ‰ùoªyïä¸à¤¹iâøà xà¢ÉßNÂˆB‚ˆËÈ9«¢øà¢Œù¥éy.éya¡xàkøà y§*¹k£9.¡¹¥fy§d8àc8à`¸àhøài¸à ¹¥¬:)£ùëá9fì¸à¤¹n øàd¸àj¸àa8à ‚ˆYŠYY\\\‰‰œÝ]\Ë›\ÜÛÛ‘Û™OLÌ
^ÂˆÛÛœÝ\ÜÛÛ[™^\ÜÛÛÚÚXÙJ
NÂˆ™]\›ˆÚÚ[™‰Û\ÜÛÛ‰ËXÛÛŽ‰ü'äæ	Ë]N‰ù§*¹k£9.¡¹¥fy§d8à¤¹gâøà xà¢ÉË\ØÎ˜9«¢øà¢ˆ	ÌLÌ\Ý]\Ë›\ÜÛÛ‘Û™_xàá¸àï8àç¸à ¹o,xàa9b!ºaã¸àbøà¢y§*¹k£9.¡¹¥fy§d8à¤º`,¸à xào¸àfxà ˜]ÛŽ‰ù«(xàk¹¥fy§d8àn	Ë\ÜÛÛ’Y›\ÜÛÛ‹šYNÂˆB‚ˆYŠÝ]\Ë˜•˜Z[š[™ÏL	‰ˆ]\™Ù[\ÙJ^ÂˆÛÛœÝ[™^ÚÚXÙJŒ
NÂˆ™]\›ˆÚÚ[™‰ÜÝXš™XÝ‰ËXÛÛŽ‰ü'ä®ÉË]N‰ùéäyæë¸àk¹gî¹é#¹¯%9ïä¸à¤¹k£9¢$	Ë\ØÎ˜9éäyæë¹ki¹ïäˆ	ÜÝ]\Ë˜•˜Z[š[™ßIH8à ¹§*¹k£9.¡¸àk¸à¨¸àêøà­8àê¸à®¸àèøà®øà«xàéxàê¸àá¸à¨øà¤¹a*¹ab8àeøào¸àfxà ˜]ÛŽ‰ùéäyæë¸à¤¹í¦¸àdxà¢ÉËŸNÂˆB‚ˆYŠY\\\Š^ÂˆÛÛœÝÙXZÑ]šY[˜ÙOXØ]YÛÜžPÛÙÛš]]™Q]šY[˜ÙJÝ]\ËÙXZÙ\ÝÌJNÂˆYŠ[X™\ŠÝ]\ËÙXZÙ\ÝÌWJOÌ
^ÂˆÛÛœÝ]™[]ÙXZÑ]šY[˜ÙKÙXZÙ\Ý›]™[Âˆ™]\›ˆÚÚ[™‰ØÛÙÛš]]™IËXÛÛŽ‰ü'ã«ÉË]N˜	ÜÝ]\ËÙXZÙ\ÝÌ_xàîÉÛ]™[xà¤¹çëxàcú(ç9o-Ø\ØÎ‰ù«¢øà¢Œù¥éy.éya¡xàkù¥¬:)£ù¥fy§d8à¡8àåxàêùª(z*i¸àiøàkøàj¸àcøà y¥è¹ïä¸àk¹§ 9o,y 'z  øà¤ŒL9ecøàh8àdyè®º*£xàeøào¸àfxà ‰Ë]ÛŽ˜	Û]™[xà¤ŒL9ecØØ]œÝ]\ËÙXZÙ\ÝÌK]™[NÂˆBˆYŠÝ]\Ë˜•˜Z[š[™ÏL
^ÂˆÛÛœÝ[™^ÚÚXÙJL
NÂˆ™]\›ˆÚÚ[™‰ÜÝXš™XÝ‰ËXÛÛŽ‰ü'ä®ÉË]N‰ùéäyæë¸à¤Œxà®øààøàâ8àh8àdyè®º*£IË\ØÎ‰ÌL9b!¹íãùd"9k§ù¢)¸àkú/ïyb¨8àføàf¸à y¥è¹kf8àk¹çëxàa9¯%9ïä¸à¤¹. 8ài9è®º*£xàeøào¸àfxà ‰Ë]ÛŽ‰ùéäyæë¸à¤¹è®º*£IËŸNÂˆBˆÛÛœÝÚ\\[™^™XYU[œ\ÜÙYÚ\\Š
NÂˆYŠÚ\\Š^Âˆ™]\›ˆÚÚ[™‰ØÚ\\‰ËXÛÛŽ‰ü'éêIË]N˜9ë+	ØÚ\\‹˜Úyêè8à¤¹çëxàcùílyd"9è®º*£X\ØÎ‰ùki¹ïä¹®"8àoøàk¹êè8àh8àdxà¤¹è®º*£xàeøào¸àfxà ¹§*¹ki¹ïä¹ëá9fì¸àkù­íøàg8ào¸àføà¤øà ‰Ë]ÛŽ˜9ë+	ØÚ\\‹˜Úyêè8à¤¹è®º*£XÚ\\Ž˜Ú\\‹˜ÚNÂˆBˆÛÛœÝ[™^X\Ý\•ÜXÐØ[™Y]J
NÂˆYŠ	‰Š›Ùš[K›\ÜÛÛ”›ÙÜ™\ÜÏË–ÞÜXËšY_
OLL
^Âˆ™]\›ˆÚÚ[™‰ÝÜXÉËXÛÛŽ‰ø«d	Ë]N˜	ÞÜXË]_xà¤¹í«y£ X\ØÎ‰ù¥è¹ïä¸àá¸àï8àç¸àk¹/çy£ xà¤¹¥m8àb8ào¸àfxà ¹¥¬8àeøàa9çéz+f8àkùh¥øà¡8àeøào¸àføà¤øà ‰Ë]ÛŽ‰øàá¸àï8àç¹¯%9ïä‰ËÜXÒYžÜXËšYNÂˆBˆ™]\›ˆÚÚ[™‰ÝØ\›]\	ËXÛÛŽ‰ø§!IË]N‰ù¥è¹ïäŒùecøàh8àdyè®º*£IË\ØÎ‰øàdøàdøàbøà¢xàkù.åy."¸àc8à¢¸à¤¹m*xàexàj¸àa8àdøàj8à¤¹a*¹ab8àeøào¸àfxà ‰Ë]ÛŽ‰øà©¸àªxàï8àè8à¨¸ààøàåÌùecÉßNÂˆB‚ˆYŠ\™Ù[\ÙI‰ˆ\Ý]\Ë˜S[ØÚËœ\ÜÙY
^Âˆ™]\›ˆÚÚ[™‰ØS[ØÚÉËXÛÛŽ‰ü'ãàIË]N‰ùéäyæëxà¤¹§+9åj¹¦`ºe¤øàiùè®º*£IË\ØÎ‰øàåxàêùª(z*iŒ¹fç¸àk¹k¢yk¦¹§hy.í¸àc9§*º`e8àiøàfxà ŽL9b!¸à¤¹è®¹/çxàiøàcxà¢ù¥éxàjù§+9åj¹g¢øàiùè®º*£xàeøào¸àfxà ‰Ë]ÛŽ‰øàåxàêùª(z*iŽL9b!¸à¤¹iâøà xà¢ÉËÛ™ÎY_NÂˆB‚ˆYŠ\™Ù[\ÙI‰ˆ\Ý]\Ë˜‘š[˜[œ\ÜÙY
^Âˆ™]\›ˆÚÚ[™‰Ø‘š[˜[	ËXÛÛŽ‰ü'ä®ÉË]N‰ùéäyæë¹íãùd"9k§ù¢)¸àiùè®º*£IË\ØÎ‰ùæí:/äL¹fç¸àk¹k¢yk¦¹§hy.í¸àc9§*º`e8àiøàfxà ŒL9b!¸à¤¹è®¹/çxàeøài¸à¨¸àêøà­8àê¸à®¸àè;ï"øà®øà«xàéxàê¸àá¸à¨øà¤º`&¸àeøàiùè®º*£xàeøào¸àfxà ‰Ë]ÛŽ‰ùéäyæë¹íãùd"L9b!¸à¤¹iâøà xà¢ÉËÛ™ÎY_NÂˆB‚ˆÛÛœÝÙXZÑ]šY[˜ÙOXØ]YÛÜžPÛÙÛš]]™Q]šY[˜ÙJÝ]\ËÙXZÙ\ÝÌJNÂˆYŠ[X™\ŠÝ]\ËÙXZÙ\ÝÌWJOÌ
^ÂˆÛÛœÝ]™[]ÙXZÑ]šY[˜ÙKÙXZÙ\Ý›]™[Âˆ™]\›ˆÚÚ[™‰ØÛÙÛš]]™IËXÛÛŽ‰ü'ã«ÉË]N˜	ÜÝ]\ËÙXZÙ\ÝÌ_xàîÉÛ]™[xà¤º(ç9o-Ø\ØÎ˜9§ 9/c¹b!ºaãˆ	ÓX]œ›Ý[™
Ý]\ËÙXZÙ\ÝÌWJ_IH8à ¹§ 8à ¹o,xàa9 'z  ù«­zf£¸à#	Û]™[xà#xà¤ŒL9ecøàiùæí9£©z(ç9o-øàeøào¸àfxà ˜]ÛŽ˜	Û]™[xà¤ŒL9ecØØ]œÝ]\ËÙXZÙ\ÝÌK]™[NÂˆB‚ˆYŠÝ]\Ë˜Ú\\”\ÜÙYŒJ^ÂˆÛÛœÝ›ÝÏ[™^[œ\ÜÙYÚ\\Š
NÂˆ™]\›ˆÚÚ[™‰ØÚ\\‰ËXÛÛŽ‰ü'éêIË]N˜9ë+	Ü›ÝÏË˜Ú_yêè8àk¹ílyd"9è®º*£X\ØÎ˜9êè9§*ùílyd"	ÜÝ]\Ë˜Ú\\”\ÜÙYKÌŒxà Ž	y.éy."¹b,:`e;ï"ùæí:/äMÌ	y.éy."¹í«y£ xà¤¹ïä¹o¥ùb)9k¦¸àk¹ílyd":*/9¢è8àjøàeøào¸àfxà ˜]ÛŽ˜9ë+	Ü›ÝÏË˜Ú_yêè8à¤ŒL¹ecøàiùè®º*£XÚ\\Žœ›ÝÏË˜Ú_NÂˆB‚ˆYŠÝ]\Ë˜•˜Z[š[™ÏL
^ÂˆÛÛœÝ[™^ÚÚXÙJŒ
NÂˆ™]\›ˆÚÚ[™‰ÜÝXš™XÝ‰ËXÛÛŽ‰ü'ä®ÉË]N‰ùéäyæë¸àk¹gî¹é#¹¯%9ïä¸à¤¹k£9¢$	Ë\ØÎ˜9éäyæë¹ki¹ïäˆ	ÜÝ]\Ë˜•˜Z[š[™ßIH8à ¹§*¹k£9.¡¹¯%9ïä¸à¤¹a*¹ab8àeøào¸àfxà ˜]ÛŽ‰ùéäyæë¸à¤¹í¦¸àdxà¢ÉËŸNÂˆB‚ˆYŠ\Ý]\Ë˜S[ØÚËœ\ÜÙY
^Âˆ™]\›ˆÚÚ[™‰ØS[ØÚÉËXÛÛŽ‰ü'ãàIË]N‰ùéäyæëxàåxàêùª(z*i¸à¤¹k¢yk¦¸àexàføà¢ÉË\ØÎ‰ùæí:/äL¹fç¸àiùnlùgaÍÍIy.éy."¸àîùd!Ì	y.éy."¸à¤‘‘HUQTÕ8àk¹íãù.åy."¸àd¹gî¹®¥¸àjøàeøài¸àa8ào¸àfxà ‰Ë]ÛŽ‰øàåxàêùª(z*iŽL9b!¸à¤¹iâøà xà¢ÉËÛ™ÎY_NÂˆBˆYŠ\Ý]\Ë˜‘š[˜[œ\ÜÙY
^Âˆ™]\›ˆÚÚ[™‰Ø‘š[˜[	ËXÛÛŽ‰ü'ä®ÉË]N‰ùéäyæë¹íãùd"9k§ù¢)¸à¤¹k¢yk¦¸àexàføà¢ÉË\ØÎ‰ùæí:/äL¹fç¸àiùnlùgaÍÌ	y.éy."¸àîùd!Iy.éy."¸à¤‘‘HUQTÕ8àk¹íãù.åy."¸àd¹gî¹®¥¸àjøàeøài¸àa8ào¸àfxà ‰Ë]ÛŽ‰ùéäyæë¹íãùd"L9b!¸à¤¹iâøà xà¢ÉËÛ™ÎY_NÂˆB‚ˆYŠÝ]\ËœÝX›OLMßÝ]\Ë›X\Ý\LÌ
^ÂˆÛÛœÝ[™^X\Ý\•ÜXÐØ[™Y]J
NÂˆYŠ
^ÂˆYŠœÝ]KšÙ^OOOIÜÝX›IÉ‰ˆ^œÝ]K˜Ú\\”™XYJ^Âˆ™]\›ˆÚÚ[™‰ØÚ\\‰ËXÛÛŽ‰ü'éêIË]N˜9ë+	ÞÜXË˜Ú\\Ÿyêè8àk¹êè9§*ùè®º*£X\ØÎ˜8à#	ÞÜXË]_xà#xàkøàá¸àï8àç¹a¡xàiøàkùïä¹o¥ù¬-9®¥¸àiøàfxàc8à yêè9ª*¹¥«xàk¹è®º*£xàc9«¢øàhøài¸àa8ào¸àfxà ˜]ÛŽ˜9ë+	ÞÜXË˜Ú\\Ÿyêè8à¤¹è®º*£XÚ\\ŽžÜXË˜Ú\\ŸNÂˆBˆ™]\›ˆX\Ý\žT™XÛÝ™\žR[™›ÊÜXËšY
OÞÚÚ[™‰ÝÜXÉËXÛÛŽ‰ø¡ª{î#ÉË]N˜	ÞÜXË]_xàk¹ïä¹o¥ùâ­¹¡bøà¤¹¢.øàfX\ØÎ˜	ÛX\Ý\žT™XÛÝ™\žT™X\ÛÛŠœÝ]J_H9ãï¹g*8à#	ÞœÝ]K›X™[xà#xà ˜]ÛŽ‰ùoáz) xàj¹oªyïä¸à¤¹iâøà xà¢ÉËÜXÒYžÜXËšYNžÚÚ[™‰ÝÜXÉËXÛÛŽ‰ø«d	Ë]N˜	ÞÜXË]_xà¤¹ïä¹o¥ùâ­¹¡bøàn\ØÎ˜9ãï¹g*8à#	ÞœÝ]K›X™[xà#xà ¹/çy£ xàj:jæ9«(yecúhc8àkº*/9¢è8à¤¹¥m8àb8ào¸àfxà ˜]ÛŽ‰øàá¸àï8àç¹¯%9ïä¸à¤¹iâøà xà¢ÉËÜXÒYžÜXËšYNÂˆBˆB‚ˆYŠ\Ý]\Ë™Ø]\Ë™š[™
ÏO™ËšYOOIÛY[[ÜžIÊOËœ\ÜÙY
^Âˆ™]\›ˆÚÚ[™‰Ü™]šY]ÉËXÛÛŽ‰ü'éè	Ë]N‰ú*&9¡­¸à¤¹§ 9í`¸àèxàìøàá¸àâ¸àìøà®IË\ØÎ˜9£ª9k¦¹/çy£ H	ÜÝ]\Ë›Y[K˜]™ßIxàîú) yoªyïäˆ	ÜÝ]\Ë›Y[K™Y_yecøà ¹¥¬:)£ùki¹ïä¸à¢8à¢¹/çy£ xàk¹fç¹oªxà¤¹a*¹ab8àeøào¸àfxà ˜]ÛŽ‰ùoªyïä¸à¤¹iâøà xà¢ÉßNÂˆB‚ˆÛÛœÝ]XØ]YÛÜžPÛÙÛš]]™Q]šY[˜ÙJÝ]\ËÙXZÙ\ÝÌJNÂˆ™]\›ˆÚÚ[™‰ØÛÙÛš]]™IËXÛÛŽ‰ø§!IË]N‰ùíãù.åy."¸àd¹í«y£ IË\ØÎ˜9..ú) xà¬¸àï8àâ8à¤¹® 8àgøàeøài¸àa8ào¸àfxà ¹§ 8à ¹o,xàa8à#	ÜÝ]\ËÙXZÙ\ÝÌ_xàîÉÙ]‹ÙXZÙ\Ý›]™[xà#xà¤¹çëxàcùí«y£ xàeøào¸àfxà ˜]ÛŽ˜	Ù]‹ÙXZÙ\Ý›]™[xà¤ŒL9ecØØ]œÝ]\ËÙXZÙ\ÝÌK]™[™]‹ÙXZÙ\Ý›]™[NÂŸB‚‚™[˜Ý[ÛˆÚÜš[˜[›ØÝ\Ô™XÛÛ[Y[™][ÛŠÝ]\ÏXÛÝ\œÙSX\Ý\žTÝ]\Ê
J^ÂˆYŠÝ]\Ë˜Ú\\”\ÜÙYŒJ^ÂˆÛÛœÝ›ÝÏ[™^[œ\ÜÙYÚ\\Š
NÂˆ™]\›ˆÚÚ[™‰ØÚ\\‰ËXÛÛŽ‰ü'éêIË]N˜9ë+	Ü›ÝÏË˜Ú_yêè8àk¹ílyd"9è®º*£X\ØÎ‰ù¥fy§d9k£9.¡¹o£8àkùêè9ª*¹¥«xàiú)¢ùb!¸àdxà¢xà£8à¢øàbøà¤¹è®º*£xàeøào¸àfxà ‰Ë]ÛŽ˜9ë+	Ü›ÝÏË˜Ú_yêè8à¤¹è®º*£XÚ\\Žœ›ÝÏË˜Ú_NÂˆBˆÛÛœÝ]XØ]YÛÜžPÛÙÛš]]™Q]šY[˜ÙJÝ]\ËÙXZÙ\ÝÌJNÂˆYŠ[X™\ŠÝ]\ËÙXZÙ\ÝÌWJOÎ
^Âˆ™]\›ˆÚÚ[™‰ØÛÙÛš]]™IËXÛÛŽ‰ü'ã«ÉË]N˜	ÜÝ]\ËÙXZÙ\ÝÌ_xàîÉÙ]‹ÙXZÙ\Ý›]™[z(ç9o-Ø\ØÎ‰ù¥¬:)£ù¥fy§d8àiøàkøàj¸àcøà y§ 8à ¹o,xàa9 'z  ù«­zf£¸à¤¹æí9£©LL9ecøàiú(ç9o-øàeøào¸àfxà ‰Ë]ÛŽ˜	Ù]‹ÙXZÙ\Ý›]™[xà¤ŒL9ecØØ]œÝ]\ËÙXZÙ\ÝÌK]™[™]‹ÙXZÙ\Ý›]™[NÂˆBˆÛÛœÝ[™^X\Ý\•ÜXÐØ[™Y]J
NÂˆYŠ
^Âˆ™]\›ˆX\Ý\žT™XÛÝ™\žR[™›ÊÜXËšY
OÞÚÚ[™‰ÝÜXÉËXÛÛŽ‰ø¡ª{î#ÉË]N˜	ÞÜXË]_xàk¹ïä¹o¥ùâ­¹¡bøà¤¹¢.øàfX\ØÎ›X\Ý\žT™XÛÝ™\žT™X\ÛÛŠœÝ]JK]ÛŽ‰ùoáz) xàj¹oªyïä‰ËÜXÒYžÜXËšYNžÚÚ[™‰ÝÜXÉËXÛÛŽ‰ø«d	Ë]N˜	ÞÜXË]_xà¤¹ïä¹o¥ùâ­¹¡bøàn\ØÎ˜9ãï¹g*8à#	ÞœÝ]K›X™[xà#xà ¹k¦¹ç`:*/9¢è8à¤¹êcxàoù."¸àd¸ào¸àfxà ˜]ÛŽ‰øàá¸àï8àç¹¯%9ïä‰ËÜXÒYžÜXËšYNÂˆBˆ™]\›ˆÚÚ[™‰ØÛÙÛš]]™IËXÛÛŽ‰ø§!IË]N˜	ÜÝ]\ËÙXZÙ\ÝÌ_xàîÉÙ]‹ÙXZÙ\Ý›]™[yí«y£ X\ØÎ‰ùaj9/døàk¹.åy."¸àc8à¢¸à¤¹í«y£ xàfxà¢ùçëy¦`ºe¤ù¯%9ïä¸àiøàfxà ‰Ë]ÛŽ˜	Ù]‹ÙXZÙ\Ý›]™[xà¤ŒL9ecØØ]œÝ]\ËÙXZÙ\ÝÌK]™[™]‹ÙXZÙ\Ý›]™[NÂŸB‚™[˜Ý[Ûˆ][˜Úš[˜[›ØÝ\ÊYš[˜[›ØÝ\Ô™XÛÛ[Y[™][ÛŠ
J^ÂˆYŠYŠ\™]\›ŽÂˆYŠ‹šÚ[™OOIÝØ\›]\	Ê^ÜÚÝÔØÜ™Y[Š	Ü›Ø›[\ÉÊNÜÝ\]Z^Š	ÝØ\›]\	ÊNÜ™]\›ŽßBˆYŠ‹šÚ[™OOIÜ™]šY]ÉÊ^ÂˆÛÛœÝ^\ÏY^[Q^\Ô™[XZ[š[™Ê
NÂˆYŠ^\ÈO[[	‰™^\ÏL	‰™^\ÏLÊ^ÜÚÝÔØÜ™Y[Š	Ü›Ø›[\ÉÊNÜÝ\]Z^Š	Ý\\œ™]šY]ÉÊNÜ™]\›ŽßBˆÛÛœÝXXÝ[Û˜X›T™]šY]Ò›Ý\›™^\Ê
VÌNÂˆYŠŠ\Ý\›Ý\›™^PXÝ[ÛŠ‹šY
NÂˆ[Ù^ÜÚÝÔØÜ™Y[Š	Ü›Ø›[\ÉÊNÜÝ\]Z^Š	Ü™]šY]ÉÊNßBˆ™]\›ŽÂˆBˆYŠ‹šÚ[™OOIÛ\ÜÛÛ‰Ê^ÜÝ\\ÜÛÛŠ‹›\ÜÛÛ’Y
NÜ™]\›ŽßBˆYŠ‹šÚ[™OOIØÚ\\‰Ê^ÜÚÝÔØÜ™Y[Š	Ü›Ø›[\ÉÊNÜÝ\]Z^ŠÛÜ™XÚ\\Ž‰Ù‹˜Ú\\ŸX
NÜ™]\›ŽßBˆYŠ‹šÚ[™OOIÝÜXÉÊ^ÜÚÝÔØÜ™Y[Š	Ü›Ø›[\ÉÊNÜÝ\]Z^ŠÛÜ™]ÜXÎ‰Ù‹ÜXÒYX
NÜ™]\›ŽßBˆYŠ‹šÚ[™OOIØÛÙÛš]]™IÊ^ÜÚÝÔØÜ™Y[Š	Ü›Ø›[\ÉÊNÜÝ\]Z^ŠÛÙØØ]‰Ù‹˜Ø]N‰Ù‹›]™[X
NÜ™]\›ŽßBˆYŠ‹šÚ[™OOIÜÝXš™XÝ‰Ê^ÂˆÚÝÔØÜ™Y[Š	Ý˜XÙIÊNÂˆÛÛœÝY‹˜Ÿ™^ÚÚXÙJŒ
NÂˆYŠ‹›[ÙOOOIÝ˜XÙIÊ^ÜÙ]“[ÙJ	Ý˜XÙIÊNÚYŠ‹šY
\Ý\‘^\˜Ú\ÙJ‹šY
NßBˆ[ÙHYŠ‹›[ÙOOOIÜÙXÝ\š]IÊ^ÜÙ]“[ÙJ	ÜÙXÝ\š]IÊNÚYŠ‹šY
\Ý\ÙXÝ\š]TØÙ[˜\š[Ê‹šY
NßBˆ[ÙHYŠ‹›[ÙOOOIØÛÛ\Ý[™	Ê^ÜÙ]“[ÙJ	Û[ØÚÉÊNÜÝ\ÛÛ\Ý[™Ú[[™ÙJ
NßBˆ[ÙHYŠ‹›[ÙOOOIÜÙXÝ\š]S[ØÚÉÊ^ÜÙ]“[ÙJ	ÜÙXÝ\š]IÊNÜÝ\ÙXÝ\š]S[ØÚÊ
NßBˆ™]\›ŽÂˆBˆYŠ‹šÚ[™OOIØS[ØÚÉÊ^ÜÚÝÔØÜ™Y[Š	Û[ØÚÉÊNÜÝ\[ØÚÊ	Ù[	ÊNÜ™]\›ŽßBˆYŠ‹šÚ[™OOIØ‘š[˜[	Ê^ÜÚÝÔØÜ™Y[Š	Ý˜XÙIÊNÜÙ]“[ÙJ	Ùš[˜[	ÊNÜÝ\‘š[˜[

NÜ™]\›ŽßBŸB‚›]Ý\œ™[š[˜[›ØÝ\Ï[[Â™[˜Ý[Ûˆ™[™\‘š[˜[X\Ý\”[™[

^ÂˆÛÛœÝÝ[[X\žOYØÝ[Y[™Ù][[Y[žRY
	Ùš[˜[X\Ý\”Ý[[X\žIÊNÂˆÛÛœÝØ]\ÏYØÝ[Y[™Ù][[Y[žRY
	Ùš[˜[X\Ý\‘Ø]\ÉÊNÂˆÛÛœÝ›ÝOYØÝ[Y[™Ù][[Y[žRY
	Ùš[˜[›ØÝ\Ó›ÝIÊNÂˆÛÛœÝYØÝ[Y[™Ù][[Y[žRY
	Ùš[˜[›ØÝ\ÐXÝ[Û‰ÊNÂˆYŠ\Ý[[X\ž_YØ]\ß[›Ý_XŠ\™]\›ŽÂ‚ˆÛÛœÝÝXÛÝ\œÙSX\Ý\žTÝ]\Ê
NÂˆÝ\œ™[š[˜[›ØÝ\ÏYš[˜[›ØÝ\Ô™XÛÛ[Y[™][ÛŠÝ
NÂˆÝ[[X\žKš[›™\’SX‰ÜÝœ™XYOÉø§!H9íãù.åy."¸àd¹gî¹®¥ˆÎ	Î‰ü'ã«È9íãù.åy."¸àd¹gî¹®¥ˆ	ÊÜÝœ\ÜÙY
ÉËÎ	ßOØœ¹ïä¹o¥È	ÜÝ›X\Ý\ŸKÌLÌ8àîùk¦¹ç`9.éy."ˆ	ÜÝœÝX›_KÌLÌ8àîùêè9§*ùílyd"	ÜÝ˜Ú\\”\ÜÙYKÌŒIÜÝœ™XÛÝ™\š[™ÏØ8àîùïä¹o¥ùâ­¹¡bøà¤¹a£yè®º*£y.+H	ÜÝœ™XÛÝ™\š[™ßX‰Éßxà œÜ[ˆÛ\ÜÏHœÝXˆ¹ïä¹o¥ùâ­¹¡bøàkú*&9¡­¹/çy£ xàjùoç8àf8ài¹båyæ¡8àjùi"xà£øà¢¸ào¸àfxà ¹m*xà£8àgøàá¸àï8àç¸àkùoáz) xàjº*/9¢è8à¤¹a*¹ab8àeøài¹¢.øàeøào¸àfxà ‘‘HUQTÕ9âë:!ê¸àk¹ki¹ïä¹k£9.¡¹gî¹®¥¸àiøà yd"9¨/9è®¹ã¡øà¡9ak9o#øàk¹d"9¨/9gî¹®¥¸àiøàkøà`¸à¢¸ào¸àføà¤øà ÜÜ[˜ÂˆØ]\Ëš[›™\’S\Ý™Ø]\Ë›X\
ÏO˜]ˆÛ\ÜÏHœ™XY[™\ÜË\\Ü[‰ÙËœ\ÜÙYÉø§$ÉÎ‰ø (‰ßH	Ù\ØØ\R[
Ë›˜[YJ_OÜÜ[‰Ù\ØØ\R[
Ë˜[YJ_OØÙ]˜
Kš›Ú[Š	ÉÊNÂˆ›ÝKš[›™\’SX‰ØÝ\œ™[š[˜[›ØÝ\ËšXÛÛŸH9«(xàjùa*¹ab;ï&Øˆ	Ù\ØØ\R[
Ý\œ™[š[˜[›ØÝ\Ë]J_Oœ‰Ù\ØØ\R[
Ý\œ™[š[˜[›ØÝ\Ë™\ØÊ_IØÝ\œ™[š[˜[›ØÝ\Ë›Û™ÏÉÏœÜ[ˆÛ\ÜÏHœÝXˆº`&¹n.8à«øàª8à®xàâ8àn9."¹.eøàføàføàf¸à xàgxàk¹¥éxàk¸àèxà©8àìùki¹ïä¸àj8àeøài¸ào¸àj8ào¸àhøàgù¦`ºe¤øà¤¹è®¹/çxàfxà¢ùk§ù¢)¸àèxàâøàéxàï8àiøàfxà ÜÜ[‰Î‰ÉßXÂˆ‹^ÛÛ[XÝ\œ™[š[˜[›ØÝ\Ë˜]ÛŽÂˆ‹›Û˜ÛXÚÏJ
OO›][˜Úš[˜[›ØÝ\ÊÝ\œ™[š[˜[›ØÝ\ÊNÂŸB‚™[˜Ý[Ûˆ^[Q^\Ô™[XZ[š[™Ê
^ÂˆÛÛœÝ˜[\›Ùš[KœÙ][™ÜÏË™^[Q]NÚYŠ]˜[
\™]\›ˆ[ÂˆÛÛœÝ\™Ù][™]È]J˜[
ÉÕLŽŒŒ	ÊK›ÝÏ[™]È]J
NÛ›ÝËœÙ]Ý\œÊL‹
NÂˆ™]\›ˆX]˜ÙZ[

\™Ù][›ÝÊKÎ
NÂŸB™[˜Ý[Ûˆ^[TÝYT\ÙJ^\ÏY^[Q^\Ô™[XZ[š[™Ê
J^ÂˆYŠ^\ÏO[[
\™]\›ˆÚY‰Û›Ü›X[	Ë˜[YN‰ú`&¹n.9ki¹ïä‰ËXÛÛŽ‰ü'äæ	Ë˜][ÜÎžÜ™]šY]Î‹ŒMË\ÜÛÛŽ‹ŒÌËÝXš™XÝŽ‹ŒÌË›ÜÜÎ‹ŒMßK[ÝÓ™]ÎYK[ÝÓÛ™Ñ^[NY_NÂˆYŠ^\Ï
\™]\›ˆÚY‰Ù^\™Y	Ë˜[YN‰ùcåúj$ù¥éyíc:`c‰ËXÛÛŽ‰ü'äáIË˜][ÜÎžÜ™]šY]Î‹ŒMË\ÜÛÛŽ‹ŒÌËÝXš™XÝŽ‹ŒÌË›ÜÜÎ‹ŒMßK[ÝÓ™]ÎYK[ÝÓÛ™Ñ^[NY_NÂˆYŠ^\ÏŽL
\™]\›ˆÚY‰Ù›Ý[™][Û‰Ë˜[YN‰ùgî¹é#¹¢èyo-y§'ÉËXÛÛŽ‰ü'ã,IË˜][ÜÎžÜ™]šY]Î‹ŒMK\ÜÛÛŽ‹ŒÍKÝXš™XÝŽ‹ŒÌ›ÜÜÎ‹ŒŒK[ÝÓ™]ÎYK[ÝÓÛ™Ñ^[NY_NÂˆYŠ^\ÏŒÌ
\™]\›ˆÚY‰ØZ[	Ë˜[YN‰ùk§ùb¦ùoh¹¢$9§'ÉËXÛÛŽ‰ü'éêIË˜][ÜÎžÜ™]šY]Î‹ŒŒ\ÜÛÛŽ‹ŒKÝXš™XÝŽ‹ŒÍK›ÜÜÎ‹ŒŒK[ÝÓ™]ÎYK[ÝÓÛ™Ñ^[NY_NÂˆYŠ^\ÏŒM
\™]\›ˆÚY‰Ùš[š\Ú	Ë˜[YN‰ù.åy."¸àd¹§'ÉËXÛÛŽ‰ü'ã«ÉË˜][ÜÎžÜ™]šY]Î‹ŒK\ÜÛÛŽ‹ŒMKÝXš™XÝŽ‹ŒÍK›ÜÜÎ‹Œ_K[ÝÓ™]ÎYK[ÝÓÛ™Ñ^[NY_NÂˆYŠ^\ÏÊ\™]\›ˆÚY‰Ùš[˜[˜XÝXÙIË˜[YN‰ùæí9bcy¯%9ïä¹§'ÉËXÛÛŽ‰ü'ãàIË˜][ÜÎžÜ™]šY]Î‹ŒÌ\ÜÛÛŽ‹ŒLÝXš™XÝŽ‹ŒÌ›ÜÜÎ‹ŒÌK[ÝÓ™]ÎYK[ÝÓÛ™Ñ^[NY_NÂˆYŠ^\ÏŒÊ\™]\›ˆÚY‰Ý\\‰Ë˜[YN‰ùæí9bcz*¯ù¥m9§'ÉËXÛÛŽ‰ü'éè	Ë˜][ÜÎžÜ™]šY]Î‹ŒÍK\ÜÛÛŽ‹ŒKÝXš™XÝŽ‹ŒŒ›ÜÜÎ‹ŒŒK[ÝÓ™]ÎYK[ÝÓÛ™Ñ^[NY_NÂˆYŠ^\ÏŒJ\™]\›ˆÚY‰Ü›ÝXÝ	Ë˜[YN‰ù.åy."¸àc8à¢¹/çz+mù§'ÉËXÛÛŽ‰ü'æè{î#ÉË˜][ÜÎžÜ™]šY]Î‹\ÜÛÛŽ‹ÝXš™XÝŽŒ›ÜÜÎ‹ŒŒK[ÝÓ™]Î™˜[ÙK[ÝÓÛ™Ñ^[N™˜[Ù_NÂˆYŠ^\ÏOOLJ\™]\›ˆÚY‰Ù]™IË˜[YN‰ùbcy¥éyè®º*£IËXÛÛŽ‰ü'ã&IË˜][ÜÎžÜ™]šY]Î‹Ë\ÜÛÛŽŒÝXš™XÝŽŒ›ÜÜÎ‹ŒÌßK[ÝÓ™]Î™˜[ÙK[ÝÓÛ™Ñ^[N™˜[Ù_NÂˆ™]\›ˆÚY‰Ù^[Q^IË˜[YN‰ùcåúj$ùodù¥éIËXÛÛŽ‰ø¦ ;î#ÉË˜][ÜÎžÜ™]šY]ÎŒ\ÜÛÛŽŒÝXš™XÝŽŒ›ÜÜÎŒ_K[ÝÓ™]Î™˜[ÙK[ÝÓÛ™Ñ^[N™˜[Ù_NÂŸB™[˜Ý[Ûˆ\\”ÝYPØ\
^\ÏY^[Q^\Ô™[XZ[š[™Ê
J^ÂˆYŠ^\ÏO[[^\Ï^\ÏÊ\™]\›ˆ[ÂˆYŠ^\ÏM
\™]\›ˆNÂˆYŠ^\ÏLŠ\™]\›ˆÌÂˆYŠ^\ÏOOLJ\™]\›ˆMNÂˆ™]\›ˆLÂŸB™[˜Ý[Ûˆ›Ý[™\JŠ^Ü™]\›ˆX]˜ÙZ[

[X™\ŠŠ_
KÍJJ_B™[˜Ý[Ûˆ[ØØ]PžT˜][ÜÊÝ[˜][ÜÊ^ÂˆÝ[SX]›X^
ŒX]œ›Ý[™
[X™\ŠÝ[
_Œ
JNÂˆÛÛœÝÙ^\ÏVÉÜ™]šY]ÉË	Û\ÜÛÛ‰Ë	ÜÝXš™XÝ‰Ë	Ø›ÜÜÉ×KÝ]^ßNÛ]\ÙYLÂˆÙ^\Ë™›Ü‘XXÚ

ËJOOžÂˆYŠOOOZÙ^\Ë›[™ÝLJ^ÛÝ]Ú×OSX]›X^
KÝ[]\ÙY
NÜ™]\›ŽßBˆÝ]Ú×OSX]›X^
KX]œ›Ý[™
Ý[
Š˜][ÜÖÚ×_
KÍJJJNÝ\ÙY
Ï[Ý]Ú×NÂˆJNÂˆÚ[JØš™XÝ˜[Y\ÊÝ]
Kœ™YXÙJ
KŠOO˜JØ‹
OÝ[
^ÂˆÛÛœÝÏZÙ^\ËœÛXÙJLJKœÛÜ

KŠOO›Ý]Ø—K[Ý]ØWJK™š[™
ÏO›Ý]Ú×OJNÚYŠZÊXœ™XZÎÛÝ]Ú×KOMNÂˆBˆÚ[JØš™XÝ˜[Y\ÊÝ]
Kœ™YXÙJ
KŠOO˜JØ‹
OÝ[
^ÂˆÛÛœÝÏVË‹‹šÙ^\×KœÛÜ

KŠOOŠ˜][ÜÖØ—_
KJ˜][ÜÖØW_
JVÌNÛÝ]Ú×JÏMNÂˆBˆ™]\›ˆÝ]ÂŸB™[˜Ý[Ûˆ\Ý[X]T™[XZ[š[™ÔÝYSZ[]\Ê
^Âˆ]OLÂˆ
\[ÙˆÓÔ‘WÐWÒQÈOOIÝ[™Yš[™Y	ÏÐÓÔ‘WÐWÒQÎ“Øš™XÝšÙ^\ÊTÔÓÓ”ßßJJK™›Ü‘XXÚ
YOžØÛÛœÝXÛ[\
›Ùš[K›\ÜÛÛ”›ÙÜ™\ÜÏË–ÚY_L
NÛJÏJK\ÌL
JŒMßJNÂˆ
UQTÕSÓ—ÐS’ß×JK™›Ü‘XXÚ
OOžÚYŠJ
›Ùš[KœTÝ]ÏË–ÜKšYOË˜][\ß
OŒ
J[JÏL‹NßJNÂˆ
—ÑVTÒTÑTß×JK™›Ü‘XXÚ
OžØÛÛœÝXÛ[\
›Ùš[K˜”›ÙÜ™\ÜÏË–ÞšY_L
NÛJÏJK\ÌL
JŒMNßJNÂˆ
ÑPÕT’UWÔÐÑST’SÔß×JK™›Ü‘XXÚ
OžØÛÛœÝXÛ[\
›Ùš[KœÙXÝ\š]P”›ÙÜ™\ÜÏË–ÞšY_L
NÛJÏJK\ÌL
JŒMNßJNÂˆÛÛœÝOJ›Ùš[K›[ØÚÒ\ÝÜž_×JK™š[\ŠOž›[ÙOOOIÙ[	ÊK›[™ÝJ›Ùš[K˜‘š[˜[\ÝÜž_×JK›[™ÝÂˆJÏSX]›X^
‹XJJŽL
ÓX]›X^
‹XŠJŒL
ÓX]›X^
KJ›Ùš[K˜“[ØÚÒ\ÝÜž_×JK›[™Ý
J
ÓX]›X^
KJ›Ùš[KœÙXÝ\š]S[ØÚÒ\ÝÜž_×JK›[™Ý
JŒŒ
ÓX]›X^
ËJ›Ùš[K˜ÛÛ\Ý[™\ÝÜž_×JK›[™Ý
JŒŒÂˆÛÛœÝXÝ]™OXXÝ]™T™]šY]Ò›Ý\›™^\Ê
K›[™ÝÂˆJÏSX]›Z[ŠXÝ]™JŽ
ÙYT]Y\Ý[ÛœÊ
K›[™Ý
ŒÊNÂˆ™]\›ˆX]›X^
X]œ›Ý[™
JJNÂŸB™[˜Ý[Ûˆ™XÙ[Ø[[™\”XÙJ^\ÏLM
^ÂˆÛÛœÝÙ^O[™]È]J
NÝÙ^KœÙ]Ý\œÊL‹
NÛ]Ý[LXÝ]™Q^\ÏLÂˆ›ÜŠ]OLÚO^\ÎÚJÊÊ^ØÛÛœÝ[™]È]JÙ^JNÙœÙ]]J™Ù]]J
KZJNØÛÛœÝZ[S[X™\Š›Ùš[K˜XÝ]š]OË–Ù]RÙ^J
WOË›Z[]\Ê_ÝÝ[
Ï[Z[ŽÚYŠZ[Œ
XXÝ]™Q^\ÊÊÎßBˆÛÛœÝ^\Ý[™ÏSØš™XÝšÙ^\Ê›Ùš[K˜XÝ]š]_ßJK™š[\ŠÏOŠ›Ùš[K˜XÝ]š]VÚ×OË›Z[]\ß
OŒ
KœÛÜ

NÂˆ]ØœÙ\™Y^\ÏLÂˆYŠ^\Ý[™Ë›[™Ý
^ØÛÛœÝš\œÝ[™]È]J^\Ý[™ÖÌJÉÕLŽŒŒ	ÊNÛØœÙ\™Y^\ÏSX]›Z[Š^\ËX]›X^
KX]™›ÛÜŠ
Ù^KYš\œÝ
KÎ
JÌJJNßBˆ™]\›ˆÝÝ[XÝ]™Q^\ËØœÙ\™Y^\Ë[›ÝYÚ˜XÝ]™Q^\ÏLÉ‰›ØœÙ\™Y^\ÏM]™Î›ØœÙ\™Y^\ÏÝÝ[ÛØœÙ\™Y^\ÎŒNÂŸB™[˜Ý[Ûˆ^[TXÙTÝ]\Ê
^ÂˆÛÛœÝ^\ÏY^[Q^\Ô™[XZ[š[™Ê
K˜\Ù[[™OS[X™\Š›Ùš[KœÙ][™ÜÏËœÝYSZ[]\Ê_Œ™[XZ[š[™ÏY\Ý[X]T™[XZ[š[™ÔÝYSZ[]\Ê
K™XÙ[\™XÙ[Ø[[™\”XÙJ
K\ÙOY^[TÝYT\ÙJ^\ÊNÂˆYŠ^\ÏO[[
\™]\›ˆÚ\Ñ^[N™˜[ÙK˜\Ù[[™KY™™XÝ]™N˜˜\Ù[[™K™[XZ[š[™Ë™XÙ[\Ù_NÂˆYŠ^\Ï
\™]\›ˆÚ\Ñ^[NYK^\™YYK^\Ë˜\Ù[[™KY™™XÝ]™N˜˜\Ù[[™K™[XZ[š[™Ë™XÙ[\Ù_NÂˆÛÛœÝ]˜Z[X›OSX]›X^
K^\ÊK™\]Z\™Y\™[XZ[š[™ËØ]˜Z[X›KÝ\œ™[XÙO\™XÙ[™[›ÝYÚÜ™XÙ[˜]™Î˜˜\Ù[[™KXÙTÛÝ\˜ÙO\™XÙ[™[›ÝYÚÉÜ™XÙ[	Î‰Ü[‰ÎÂˆÛÛœÝ›Ú™XÝY^\ÏXÝ\œ™[XÙOŒÓX]˜ÙZ[
™[XZ[š[™ËØÝ\œ™[XÙJNŽNNNK›Ú™XÝY]O[™]È]J
NÜ›Ú™XÝY]KœÙ]Ý\œÊL‹
NÜ›Ú™XÝY]KœÙ]]J›Ú™XÝY]K™Ù]]J
JÜ›Ú™XÝY^\ÊNÂˆÛÛœÝÛXÚÏX]˜Z[X›K\›Ú™XÝY^\ÎÂˆ]Ý]\ÏIÙ[™Ù\‰ÎÂˆYŠ™\]Z\™YLÝ\œ™[XÙO\™\]Z\™Y
ŒKŒŒ
\Ý]\ÏIÙÛÛÙ	ÎÙ[ÙHYŠÝ\œ™[XÙO\™\]Z\™Y
‹ŽMJ\Ý]\ÏIÛÚÉÎÙ[ÙHYŠÝ\œ™[XÙO\™\]Z\™Y
‹ÍJ\Ý]\ÏIÝØ\›‰ÎÂˆÛÛœÝ]]Ï\›Ùš[KœÙ][™ÜÏË˜]]ÔXÙHOOY˜[ÙKÝYÙÙ\ÝYSX]›X^
˜\Ù[[™K›Ý[™\J™\]Z\™Y
ŒKŒL
JNÂˆÛÛœÝØ\]\\”ÝYPØ\
^\ÊNÂˆÛÛœÝ\\XØ\O[[ÂˆÛÛœÝ›Ü›X[Y™™XÝ]™OX]]ÏÓX]›Z[ŠLŒÝYÙÙ\ÝY
N˜˜\Ù[[™NÂˆËÈ9«¢øà¢ù¥éy.éya¡xàkøà#9«¢ùki¹ïäºaãøà¤¹aj:`ê9­¢9c%¸àfxà¢øà#xàgøà xàkº/ïxàa:/¯8àoøà¤¹«h¸à xà¢øà ‚ˆËÈ9ª&y®¥¹¦`ºe¤øàc9çëxàa9b*yå*: !xàkùh¥øà¡8àexàf¸à zemøàa9b*yå*: !xàh8àdy«­zf£¹æ¡8àjù."ºfd8à¤¹."øàd¸à¢øà ‚ˆÛÛœÝY™™XÝ]™O]\\ÓX]›Z[Š˜\Ù[[™KØ\
N››Ü›X[Y™™XÝ]™NÂˆÛÛœÝY\ÝY^\ÏYY™™XÝ]™OŒÓX]˜ÙZ[
™[XZ[š[™ËÙY™™XÝ]™JNŽNNNKX^]O[™]È]J
NÛX^]KœÙ]Ý\œÊL‹
NÛX^]KœÙ]]JX^]K™Ù]]J
JÓX]˜ÙZ[
™[XZ[š[™ËÌLŒ
JNÂˆ™]\›ˆÚ\Ñ^[NYK^\™Y™˜[ÙK^\Ë˜\Ù[[™K™[XZ[š[™Ë™XÙ[\ÙK™\]Z\™YÝ\œ™[XÙKXÙTÛÝ\˜ÙK›Ú™XÝY^\Ë›Ú™XÝY]KÛXÚËÝ]\Ë]]ËY™™XÝ]™KØ[”™XÛÝ™\Ž˜Y\ÝY^\ÏX]˜Z[X›KX^]K\\‹\\Ø\˜Ø\NÂŸB™[˜Ý[ÛˆY™™XÝ]™TÝYSZ[]\Ê
^ØÛÛœÝY^[TXÙTÝ]\Ê
NÜ™]\›ˆš\Ñ^[I‰ˆ\™^\™YÜ™Y™™XÝ]™NŠ[X™\Š›Ùš[KœÙ][™ÜÏËœÝYSZ[]\Ê_Œ
NßB™[˜Ý[Ûˆ\\•\ÚÐ[ØØ][ÛŠÝ[^\Ê^ÂˆÝ[SX]›X^
KX]œ›Ý[™
[X™\ŠÝ[
_L
JNÂˆYŠ^\ÏL
\™]\›ˆÜ™]šY]ÎŒ\ÜÛÛŽŒÝXš™XÝŽŒ›ÜÜÎÝ[NÂˆYŠ^\ÏOOLJ\™]\›ˆÜ™]šY]Î“X]›X^
KÝ[MJK\ÜÛÛŽŒÝXš™XÝŽŒ›ÜÜÎ“X]›Z[ŠKÝ[
_NÂˆYŠ^\ÏLÊ\™]\›ˆÜ™]šY]ÎŒL\ÜÛÛŽ“X]›X^
KÝ[LMJKÝXš™XÝŽŒ›ÜÜÎ_NÂˆYŠÝ[LÌ
\™]\›ˆÜ™]šY]ÎŒL\ÜÛÛŽŒLÝXš™XÝŽK›ÜÜÎ_NÂˆ™]\›ˆÜ™]šY]ÎŒMK\ÜÛÛŽŒLÝXš™XÝŽŒL›ÜÜÎ“X]›X^
KÝ[LÍJ_NÂŸB™[˜Ý[Ûˆ\ÚÐ[ØØ][ÛŠÝ[
^ÂˆÝ[S[X™\ŠÝ[
_Y™™XÝ]™TÝYSZ[]\Ê
NØÛÛœÝ^\ÏY^[Q^\Ô™[XZ[š[™Ê
NÂˆYŠ^\ÈO[[	‰™^\ÏL	‰™^\ÏMŠ\™]\›ˆ\\•\ÚÐ[ØØ][ÛŠÝ[^\ÊNÂˆYŠ^\ÏO[[
^ÚYŠÝ[OOLÌ
\™]\›ˆÜ™]šY]ÎK\ÜÛÛŽŒLÝXš™XÝŽŒL›ÜÜÎ_NÚYŠÝ[OOMJ\™]\›ˆÜ™]šY]ÎK\ÜÛÛŽŒMKÝXš™XÝŽŒMK›ÜÜÎŒLNÚYŠÝ[OONL
\™]\›ˆÜ™]šY]ÎŒMK\ÜÛÛŽŒÌÝXš™XÝŽŒÌ›ÜÜÎŒM_NÚYŠÝ[OOMŒ
\™]\›ˆÜ™]šY]ÎŒL\ÜÛÛŽŒŒÝXš™XÝŽŒŒ›ÜÜÎŒLNßBˆ™]\›ˆ[ØØ]PžT˜][ÜÊÝ[^[TÝYT\ÙJ^\ÊKœ˜][ÜÊNÂŸB‚™[˜Ý[ÛˆÙXZÙ\ÝÚÚ[

^Âˆ™]\›ˆÛÜYÚÚ[Ê
VÌOË–ÌH	øà¨¸àêøà­8àê¸à®¸àè	ÎÂŸB™[˜Ý[Ûˆ™^\ÜÛÛÚÚXÙJ
^ÂˆÛÛœÝÙXZÓÜ™\\ÛÜYÚÚ[Ê
K›X\
OžÌJNÂˆ›ÜŠÛÛœÝÚÚ[ÙˆÙXZÓÜ™\Š^ÂˆÛÛœÝYÏPÓÔ‘WÐWÒQË™š[\ŠYO“TÔÓÓ”ÖÚYKœÚÚ[OO\ÚÚ[
NÂˆÛÛœÝ[˜ÛÛ\]OZYË™š[™
YOŠ›Ùš[K›\ÜÛÛ”›ÙÜ™\ÜÏË–ÚY_
OL
NÂˆYŠ[˜ÛÛ\]JH™]\›ˆÚYš[˜ÛÛ\]KÚÚ[]N“TÔÓÓ”ÖÚ[˜ÛÛ\]WK]_NÂˆBˆ™]\›ˆÚY›[ÚÚ[ÙXZÓÜ™\–Ì_	ùgî¹é#¹ä!º*å‰Ë]N‰ùéäyæëy¥fy§dLÌ8àá¸àï8àç¹k£9.¡‰ËÛÛ\]NY_NÂŸB™[˜Ý[Ûˆ™^ÚÚXÙJZ[]\ÏLŒ
^ÂˆÛÛœÝ[ÛÕÝ[P—ÑVTÒTÑTË›[™ÝÂˆÛÛœÝÙXÕÝ[TÑPÕT’UWÔÐÑST’SÔË›[™ÝÂˆÛÛœÝ[ÛÑÛ™OP—ÑVTÒTÑTË™š[\ŠOŠ›Ùš[K˜”›ÙÜ™\ÜÏË–ÞšY_
OLL
K›[™ÝÂˆÛÛœÝÙXÑÛ™OTÑPÕT’UWÔÐÑST’SÔË™š[\ŠOŠ›Ùš[KœÙXÝ\š]P”›ÙÜ™\ÜÏË–ÞšY_
OLL
K›[™ÝÂˆÛÛœÝ[ÛÔ˜]OX[ÛÑÛ™KÓX]›X^
K[ÛÕÝ[
NÂˆÛÛœÝÙXÔ˜]O\ÙXÑÛ™KÓX]›X^
KÙXÕÝ[
NÂ‚ˆYŠ[ÛÑÛ™O[ÛÕÝ[ÙXÑÛ™OÙXÕÝ[
^ÂˆYŠ[ÛÔ˜]O\ÙXÔ˜]H	‰ˆ[ÛÑÛ™O[ÛÕÝ[
^ÂˆÛÛœÝ^P—ÑVTÒTÑTË™š[™
OŠ›Ùš[K˜”›ÙÜ™\ÜÏË–ÞšY_
OL
H—ÑVTÒTÑTÖÌNÂˆ™]\›ˆÛ[ÙN‰Ý˜XÙIËY™^ËšY]N™^Ë]_	øà¨¸àêøà­8àê¸à®¸àè8àâ8àë8àï8à®IßNÂˆBˆÛÛœÝØÏTÑPÕT’UWÔÐÑST’SÔË™š[™
OŠ›Ùš[KœÙXÝ\š]P”›ÙÜ™\ÜÏË–ÞšY_
OL
HÑPÕT’UWÔÐÑST’SÔÖÌNÂˆ™]\›ˆÛ[ÙN‰ÜÙXÝ\š]IËYœØÏËšY]NœØÏË]_	øà®øà«xàéxàê¸àá¸à¨ù¯%9ïä‰ßNÂˆB‚ˆËÈ:`&¹n.8àkŒŒ9b!¹§¨8àjÌL9b!¸àk¹íãùd"9k§ù¢)¸à¤º!ê¹båybl¹odøàeøàj¸àa8à ‚ˆËÈ9gî¹é#¹¯%9ïä¹k£9.¡¹o£8àkÌŒ9b!¸àkº)!ùd"9¯%9ïä¸àj8à®øà«xàéxàê¸àá¸à¨ùk§ù¢)¸à¤¹.©9.¤¸àjùfç¸àfxà ‚ˆÛÛœÝÛÛ\Ý[™[œÏJ›Ùš[K˜ÛÛ\Ý[™\ÝÜž_×JK›[™ÝÂˆÛÛœÝÙXÝ\š]T[œÏJ›Ùš[KœÙXÝ\š]S[ØÚÒ\ÝÜž_×JK›[™ÝÂˆYŠÛÛ\Ý[™[œÏ\ÙXÝ\š]T[œÊ\™]\›ˆÛ[ÙN‰ØÛÛ\Ý[™	ËY›[]N‰ú)!ùd"9ecúhc8àîÌùecÉßNÂˆ™]\›ˆÛ[ÙN‰ÜÙXÝ\š]S[ØÚÉËY›[]N‰øà®øà«xàéxàê¸àá¸à¨È8àçøàâùª(z*i‰ßNÂŸB‚™[˜Ý[Ûˆ™^™XYU[œ\ÜÙYÚ\\Š
^ÂˆÛÛœÝ›ÝÜÏPÓÔ‘WÐWÐÒTT”Ë›X\
ÚOžÂˆÛÛœÝÜXÜÏPÓÔ‘WÐWÐÕT”’PÕSSK™š[\ŠO˜Ú\\OOXÚ
NÂˆÛÛœÝÛ™O]ÜXÜË™š[\ŠOŠ›Ùš[K›\ÜÛÛ”›ÙÜ™\ÜÏË–ÝšY_
OLL
K›[™ÝÂˆ™]\›ˆØÚÛ™KÝ[ÜXÜË›[™ÝN˜Ú\\’[YÜ˜][Û‘]šY[˜ÙJÚ
_NÂˆJK™š[\ŠOž™Û™OOO^Ý[	‰ˆ^™Kœ\ÜÙY
NÂˆ›ÝÜËœÛÜ

KŠOOŠ‹™K˜™\Ý˜]_
KJK™K˜™\Ý˜]_
_K˜ÚX‹˜Ú
NÂˆ™]\›ˆ›ÝÜÖÌ_[ÂŸB‚™[˜Ý[Ûˆ\\‘›ØÝ\Ô™XÛÛ[Y[™][ÛŠ^\ËÝ]\ÏXÛÝ\œÙSX\Ý\žTÝ]\Ê
J^ÂˆÛÛœÝ]XØ]YÛÜžPÛÙÛš]]™Q]šY[˜ÙJÝ]\ËÙXZÙ\ÝÌJNÂ‚ˆËÈ9«¢øà¢8à'¹¥éxàkøà y¥fy§d:`,¹£eøàcL	y§*¹® 8àj¸à¢y§*¹ki¹ïä¸à¤Œxàá¸àï8àç¸àh8àdz*,yk®xà ‚ˆËÈù¥éybcy.ézfcxàkù¥¬:)£ù¥fy§d8à¤¹h¥øà¡8àexàf¸à y¥è¹ïä¹a¡yk®xàk¹êm8àh8àdxà¤¹hg¸àd8à ‚ˆYŠ^\ÏM	‰œÝ]\Ë›\ÜÛÛ‘Û™OLMÊ^ÂˆÛÛœÝ\ÜÛÛ[™^\ÜÛÛÚÚXÙJ
NÂˆYŠ\ÜÛÛËšY
\™]\›ˆÚÚ[™‰Û\ÜÛÛ‰ËXÛÛŽ‰ü'äæ	Ë]N‰ù§*¹k£9.¡¹¥fy§d8à¤Œxàá¸àï8àç¸àh8àdIË\ØÎ˜9¥fy§d	ÜÝ]\Ë›\ÜÛÛ‘Û™_KÌLÌ8à ¹æí9bcxàjùn øàd¸àfxàc¸àf¸à y.â¹¥éxàkøà#	Û\ÜÛÛ‹]_xà#xàh8àdz`,¸à xào¸àfxà ˜]ÛŽ‰ù¥fy§d8à¤ºe¢øàcÉË\ÜÛÛ’Y›\ÜÛÛ‹šYNÂˆB‚ˆYŠ[X™\ŠÝ]\ËÙXZÙ\ÝÌWJOÌ
^Âˆ™]\›ˆÚÚ[™‰ØÛÙÛš]]™IËXÛÛŽ‰ü'ã«ÉË]N˜	ÜÝ]\ËÙXZÙ\ÝÌ_xàîÉÙ]‹ÙXZÙ\Ý›]™[xà¤º(ç9o-Ø\ØÎ˜9§ 9/c¹b!ºaãˆ	ÓX]œ›Ý[™
Ý]\ËÙXZÙ\ÝÌWJ_IH8à ¹¥¬:)£ùëá9fì¸àiøàkøàj¸àcùo,xàa9 'z  øà¤ŒL9ecøàiù¢.øàeøào¸àfxà ˜]ÛŽ˜	Ù]‹ÙXZÙ\Ý›]™[xà¤ŒL9ecØØ]œÝ]\ËÙXZÙ\ÝÌK]™[™]‹ÙXZÙ\Ý›]™[NÂˆB‚ˆËÈù¥éybcy.ézfcxàkùâë9êâøàeøàgùéäyæë¹§¨8à¤¹ïk¸àbøàj¸àa8àgøà xà P¸àc9o,xàa9h-9d"8àkøàdøàk¹§¨8àiùçëxàcùè®º*£xà ‚ˆYŠ^\ÏLÉ‰œÝ]\Ë˜•˜Z[š[™ÏL
^ÂˆÛÛœÝ[™^ÚÚXÙJL
NÂˆ™]\›ˆÚÚ[™‰ÜÝXš™XÝ‰ËXÛÛŽ‰ü'ä®ÉË]N‰ùéäyæë¸à¤¹çëxàcùè®º*£IË\ØÎ˜9éäyæë¹ki¹ïäˆ	ÜÝ]\Ë˜•˜Z[š[™ßIH8à ºemù¦`ºe¤ùk§ù¢)¸àiøàkøàj¸àcù§*¹k£9.¡¸àk¹gî¹é#¹¯%9ïä¸à¤Œxài9è®º*£xàeøào¸àfxà ˜]ÛŽ‰ùéäyæë¸à¤¹è®º*£IËŸNÂˆB‚ˆÛÛœÝÚ\\[™^™XYU[œ\ÜÙYÚ\\Š
NÂˆYŠÚ\\Š^Âˆ™]\›ˆÚÚ[™‰ØÚ\\‰ËXÛÛŽ‰ü'éêIË]N˜9ë+	ØÚ\\‹˜Úyêè8à¤¹ílyd"9è®º*£X\ØÎ‰ùki¹ïä¹®"8àoøàk¹êè8àh8àdxà¤ŒL¹ecøàiùè®º*£xàeøào¸àfxà ¹§*¹ki¹ïä¹ëá9fì¸à¤¹æí9bcxàjù­íøàg8ào¸àføà¤øà ‰Ë]ÛŽ˜9ë+	ØÚ\\‹˜Úyêè8à¤¹è®º*£XÚ\\Ž˜Ú\\‹˜ÚNÂˆB‚ˆÛÛœÝ[™^X\Ý\•ÜXÐØ[™Y]J
NÂˆYŠ	‰Š›Ùš[K›\ÜÛÛ”›ÙÜ™\ÜÏË–ÞÜXËšY_
OLL
^Âˆ™]\›ˆÚÚ[™‰ÝÜXÉËXÛÛŽ‰ø«d	Ë]N˜	ÞÜXË]_xà¤¹í«y£ X\ØÎ˜9ãï¹g*8à#	ÞœÝ]K›X™[xà#xà ¹¥è¹ïä¸àá¸àï8àç¸àk¹/çy£ xàh8àdxà¤¹¥m8àb8ào¸àfxà ˜]ÛŽ‰øàá¸àï8àç¹¯%9ïä‰ËÜXÒYžÜXËšYNÂˆB‚ˆ™]\›ˆÚÚ[™‰ØÛÙÛš]]™IËXÛÛŽ‰ø§!IË]N˜	ÜÝ]\ËÙXZÙ\ÝÌ_xàîÉÙ]‹ÙXZÙ\Ý›]™[xà¤¹í«y£ X\ØÎ‰ù¥¬8àeøàa9ëá9fì¸àn9n øàd¸àf¸à y¥è¹ïä¸àk¹§ 9o,y 'z  øà¤¹çëxàcùè®º*£xàeøào¸àfxà ‰Ë]ÛŽ˜	Ù]‹ÙXZÙ\Ý›]™[xà¤ŒL9ecØØ]œÝ]\ËÙXZÙ\ÝÌK]™[™]‹ÙXZÙ\Ý›]™[NÂŸB‚™[˜Ý[ÛˆÚÛÜÙU\\”™]šY]Ô]Y\Ý[ÛœÊMJ^Âˆ[œÝ\™T]Y\Ý[Û”›Ùš[J
NÂˆÛÛœÝYOYYT]Y\Ý[ÛœÊ
NÂˆÛÛœÝ\ÙY[™]ÈÙ]

NÂˆÛÛœÝÝ]V×NÂˆÛÛœÝY\OOžÚYŠI‰ˆ]\ÙYš\ÊKšY
I‰›Ý]›[™ÝŠ^ÛÝ]œ\Ú
JNÝ\ÙY˜Y
KšY
Nß_NÂˆYKœÛXÙJŠK™›Ü‘XXÚ
Y
NÂˆYŠÝ]›[™ÝŠ^Âˆ˜XÚÙY]Y\Ý[Û”ÛÛ

Bˆ™š[\ŠOOŠ›Ùš[KœTÝ]ÏË–ÜKšYOË˜][\ß
OŒ	‰ˆ]\ÙYš\ÊKšY
I‰ˆ\]Y\Ý[Û’\ÐXÝ]™R›Ý\›™^JKšY
JBˆœÛÜ

KŠOOœ™]šY]Õ\™Ù[˜ÞJŠK\™]šY]Õ\™Ù[˜ÞJJJBˆœÛXÙJ‹[Ý]›[™Ý
K™›Ü‘XXÚ
Y
NÂˆBˆYŠÝ]›[™ÝŠ^ÂˆÚY™›Y
UQTÕSÓ—ÐS’Ë™š[\ŠOOœK™Y™šXÝ[OOOIùgî¹é#‰É‰œK˜ÛÙÛš]]™S]™[OOIù ìú-mÉÉ‰ˆ]\ÙYš\ÊKšY
JJBˆœÛXÙJ‹[Ý]›[™Ý
K™›Ü‘XXÚ
Y
NÂˆBˆ™]\›ˆÝ]›X\
Z[™]šY]Ò][JNÂŸB‚™[˜Ý[ÛˆÚÛÜÙQ^[UØ\›]\]Y\Ý[ÛœÊLÊ^Âˆ[œÝ\™T]Y\Ý[Û”›Ùš[J
NÂˆÛÛœÝ][\YTUQTÕSÓ—ÐS’Ë™š[\ŠOOŠ›Ùš[KœTÝ]ÏË–ÜKšYOË˜][\ß
OŒ	‰ˆ\]Y\Ý[Û’\ÐXÝ]™R›Ý\›™^JKšY
JNÂˆÛÛœÝÝX›OX][\Y™š[\ŠOOžÂˆÛÛœÝ[Y[[ÜžT™][[ÛŠ›Ùš[KœTÝ]ÖÜKšYJNÂˆ™]\›ˆˆO[[	‰œNÂˆJNÂˆÛÛœÝÛÝ\˜ÙO\ÝX›K›[™ÝÜÝX›N˜][\YÂˆÛÛœÝÙ[XÝYV×K\ÙYØ]Ï[™]ÈÙ]

K\ÙY[™]ÈÙ]

NÂˆÛÛœÝ˜[šÙY\ÚY™›Y
ÛÝ\˜ÙJKœÛÜ

KŠOOžÂˆÛÛœÝ\[Y[[ÜžT™][[ÛŠ›Ùš[KœTÝ]ÖØKšYJOÏÌœ[Y[[ÜžT™][[ÛŠ›Ùš[KœTÝ]ÖØ‹šYJOÏÌÂˆÛÛœÝÛÙÛš]]™T˜[šÏ^Éù ìú-mÉÎŒ	ú`jyå*	ÎŒK	ùb)9¥«IÎŒŸNÂˆÛÛœÝY™šXÝ[T˜[šÏ^Éùgî¹é#‰ÎŒ	ùª&y®¥‰ÎŒK	ùk§ù¢)‰ÎŒŸNÂˆÛÛœÝ\ÏJÛÙÛš]]™T˜[šÖØK˜ÛÙÛš]]™S]™[OÏÌŠJŒŒ
ÊY™šXÝ[T˜[šÖØK™Y™šXÝ[WOÏÌJJŽ
ÓX]˜XœÊ\‹NL
NÂˆÛÛœÝœÏJÛÙÛš]]™T˜[šÖØ‹˜ÛÙÛš]]™S]™[OÏÌŠJŒŒ
ÊY™šXÝ[T˜[šÖØ‹™Y™šXÝ[WOÏÌJJŽ
ÓX]˜XœÊœ‹NL
NÂˆËÈ9odù¥éxàkøà#8àiøàcxà¢ùecúhc8à¤º.ïxàcú)èøàcøà#xàdøàj8àc9æë¹æ¡8à ¹ ìú-møàîùgî¹é#¸à¤¹a*¹ab8àeøà zfèøàeøàa9b)9¥«yecúhc8àkù§ 9o£8àjøàfxà¢øà ‚ˆ™]\›ˆ\ËXœÎÂˆJNÂˆ›ÜŠÛÛœÝHÙˆ˜[šÙY
^ÂˆYŠÙ[XÝY›[™Ý[ŠXœ™XZÎÂˆYŠ\ÙYØ]Ëš\ÊK˜Ø]
JXÛÛ[YNÂˆÙ[XÝYœ\Ú
JNÝ\ÙY˜Y
KšY
NÝ\ÙYØ]Ë˜Y
K˜Ø]
NÂˆBˆ›ÜŠÛÛœÝHÙˆ˜[šÙY
^ÂˆYŠÙ[XÝY›[™Ý[ŠXœ™XZÎÂˆYŠ\ÙYš\ÊKšY
JXÛÛ[YNÂˆÙ[XÝYœ\Ú
JNÝ\ÙY˜Y
KšY
NÂˆBˆËÈ9ki¹ïä¹liy«m8àc9aj8àcøàj¸àa9âny«¢¸à¬xàï8à®xàh8àdxà ygî¹é#¸àk¹ ìú-mùecúhc8à¤¹§ 9l#úfd9/oøàa¸à ‚ˆYŠÙ[XÝY›[™ÝŠ^ÂˆÚY™›Y
UQTÕSÓ—ÐS’Ë™š[\ŠOOœK™Y™šXÝ[OOOIùgî¹é#‰É‰œK˜ÛÙÛš]]™S]™[OOIù ìú-mÉÉ‰ˆ]\ÙYš\ÊKšY
JJBˆœÛXÙJ‹\Ù[XÝY›[™Ý
K™›Ü‘XXÚ
OOœÙ[XÝYœ\Ú
JJNÂˆBˆ™]\›ˆÙ[XÝYœÛXÙJŠNÂŸB‚™[˜Ý[ÛˆZ[\\•Ù^U\ÚÜÊ^\ËÝ[
^ÂˆÛÛœÝ[ØÏ]\\•\ÚÐ[ØØ][ÛŠÝ[^\ÊNÂˆÛÛœÝ›Ý]\ÏXXÝ[Û˜X›T™]šY]Ò›Ý\›™^\Ê
K›[™ÝYOYYT]Y\Ý[ÛœÊ
K›[™ÝÂˆÛÛœÝÙXZÏ]ÙXZÙ\ÝÚÚ[

NÂ‚ˆYŠ^\ÏL
^Âˆ™]\›ˆÞÂˆ\N‰ÝØ\›]\	ËXÛÛŽ‰ø¦ ;î#ÉË™Î‰ÞY[ÝÉËˆ]N‰ùcåúj$ùbcxà©¸àªxàï8àè8à¨¸ààøàåÈùecÉËˆ\ØÎ‰ù¥è¹ïä¹ecúhc8à¤¹.+yoàøàjÌùecøàh8àdyè®º*£xà ¹¥¬:)£ù¥fy§d8àîúemù¦`ºe¤ùª(z*i¸àîú/ïxàa:/¯8àoøàkú(c8àa8ào¸àføà¤øà ‰ËˆZ[]\ÎÝ[ˆWNÂˆB‚ˆYŠ^\ÏOOLJ^Âˆ™]\›ˆÂˆÂˆ\N‰Ý\\”™]šY]ÉËXÛÛŽ‰ü'éè	Ë™Î‰ÙÜ™Y[‰Ëˆ]N‰ùbcy¥éxàk¹oªyïäˆyecøào¸àiÉËˆ\ØÎœ›Ý]\ÏØ9oªyïä¸àêøàï8àâ	Ü›Ý]\ßy.í¸àbøà¢ya*¹ab™YOØ9§'úfdù/c¹/çy£ H	ÙY_yecøàbøà¢y§ 9i)ÍyecØ˜8à#	ÝÙXZßxà#xà¤¹§ 9i)Íyecøàh8àdyè®º*£XˆZ[]\Î˜[ØËœ™]šY]ÂˆKˆÂˆ\N‰ÝØ\›]\	ËXÛÛŽ‰ü'ã&IË™Î‰ÞY[ÝÉËˆ]N‰ú.ïxàa8à©¸àªxàï8àè8à¨¸ààøàåÈùecÉËˆ\ØÎ‰ú)èøàcy¡høà£8àgù¥è¹ïä¹ecúhc8àh8àdxàiù¡'ú)¦¸à¤¹è®º*£xà ¹¥¬8àeøàa9ëá9fì¸àkùh¥øà¡8àeøào¸àføà¤øà ‰ËˆZ[]\Î˜[ØË˜›ÜÜÂˆBˆK™š[\ŠO›Z[]\ÏŒ
NÂˆB‚ˆÛÛœÝ›ØÝ\Ï]\\‘›ØÝ\Ô™XÛÛ[Y[™][ÛŠ^\ÊNÂˆÛÛœÝ\ÚÜÏVÂˆÂˆ\N‰Ý\\”™]šY]ÉËXÛÛŽ‰ü'éè	Ë™Î‰ÙÜ™Y[‰Ëˆ]N™^\ÏLÏÉùæí9bcyoªyïäˆyecÉÎ‰ú*&9¡­¸àk¹oªyïä‰Ëˆ\ØÎœ›Ý]\ÏØ9oªyïä¸àêøàï8àâ	Ü›Ý]\ßy.í¸à¤¹a*¹ab™YOØ9§'úfdù/c¹/çy£ H	ÙY_yecøà¤¹a*¹ab˜9§'úfd8à¤º/ã¸àb8àgùoªyïä¹ecúhc8àkøà`¸à¢¸ào¸àføà¤øà ¸à#	ÝÙXZßxà#xàk¹o,yà®yecúhc8àiùk¦¹ç`8à¤¹è®º*£xàeøào¸àfxà ˜ˆZ[]\Î˜[ØËœ™]šY]ÂˆKˆÂˆ\N‰Ùš[˜[›ØÝ\ÉËXÛÛŽ™›ØÝ\ËšXÛÛ‹™Î‰Ø›YIËˆ]N™›ØÝ\Ë]K\ØÎ™›ØÝ\Ë™\ØËˆZ[]\Î˜[ØË›\ÜÛÛ‹›ØÝ\ÂˆBˆNÂ‚ˆYŠ^\ÏM	‰˜[ØËœÝXš™XÝLL
^ÂˆÛÛœÝ[™^ÚÚXÙJ[ØËœÝXš™XÝŠNÂˆ\ÚÜËœ\Ú
Âˆ\N‰ÜÝXš™XÝ‰ËXÛÛŽ‰ü'ä®ÉË™Î‰Ü\œIËˆ]N˜‹›[ÙOOOIÝ˜XÙIÏØ9éäyæë»ï&‰Ø‹]_X˜‹›[ÙOOOIÜÙXÝ\š]IÏØ9éäyæë»ï&‰Ø‹]_X˜‹]Kˆ\ØÎ‰úemù¦`ºe¤øàk¹íãùd"9k§ù¢)¸àiøàkøàj¸àcøà yçëxàa9¥è¹ïä¹¯%9ïä¸à¤Œxài	ËˆZ[]\Î˜[ØËœÝXš™XÝ‹›[ÙN˜‹›[ÙKšY˜‹šYˆJNÂˆY[ÙHYŠ[ØËœÝXš™XÝŒ
^Âˆ\ÚÜÖÌWK›Z[]\ÊÏX[ØËœÝXš™XÝŽÂˆB‚ˆ\ÚÜËœ\Ú
Âˆ\N‰Ø›ÜÜÉËXÛÛŽ‰ü'ädIË™Î‰ÞY[ÝÉËˆ]N‰ùæí9bcyíãùd"8ààxà©øààøà«ÉËˆ\ØÎ‰ùb)9¥«Lùecûï"ú`jyå*¹ecøà ¹¥¬:)£ùçéz+f8àiøàkøàj¸àcøà y/oøàb8à¢øàbøàh8àdxà¤yecøàiùè®º*£xà ‰ËˆZ[]\Î˜[ØË˜›ÜÜÂˆJNÂˆ™]\›ˆ\ÚÜË™š[\ŠO›Z[]\ÏŒ
NÂŸB‚™[˜Ý[ÛˆZ[Ù^U\ÚÜÊ
^ÂˆÛÛœÝ^\Ó›ÝÏY^[Q^\Ô™[XZ[š[™Ê
NÂˆÛÛœÝÝ[›ÝÏYY™™XÝ]™TÝYSZ[]\Ê
NÂˆYŠ^\Ó›ÝÈO[[	‰™^\Ó›ÝÏL	‰™^\Ó›ÝÏMÊ\™]\›ˆZ[\\•Ù^U\ÚÜÊ^\Ó›ÝËÝ[›ÝÊNÂˆÛÛœÝ[ØÏ]\ÚÐ[ØØ][ÛŠÝ[›ÝÊNÂˆÛÛœÝ›Ý]\ÏXXÝ[Û˜X›T™]šY]Ò›Ý\›™^\Ê
K›[™ÝÂˆÛÛœÝYOYYT]Y\Ý[ÛœÊ
K›[™ÝÂˆÛÛœÝ\ÜÛÛ[™^\ÜÛÛÚÚXÙJ
NÂˆÛÛœÝ[™^ÚÚXÙJ[ØËœÝXš™XÝŠNÂˆÛÛœÝ“Z[]\ÏJ‹›[ÙOOOIØÛÛ\Ý[™	ß‹›[ÙOOOIÜÙXÝ\š]S[ØÚÉÊOÓX]›Z[ŠŒ[ØËœÝXš™XÝŠN˜[ØËœÝXš™XÝŽÂˆÛÛœÝ\ÜÛÛ“Z[]\ÏX[ØË›\ÜÛÛŠÓX]›X^
[ØËœÝXš™XÝ‹X“Z[]\ÊNÂˆÛÛœÝÙXZÏ]ÙXZÙ\ÝÚÚ[

NÂˆÛÛœÝ^\ÏY^[Q^\Ô™[XZ[š[™Ê
NÂˆÛÛœÝš[˜[\ÙOY^\ÈO[[	‰™^\ÏLMÂ‚ˆÛÛœÝž™XYO]Ú[™ÝË‘‘TUQTÕÔ–Ô‘PQOOO]YNÂˆÛÛœÝž\ž™XYOÜ™XÛÛ[Y[™Y™\ØÜš\[ÛŠ
NžÚÚ[™‰ÚÛ›ÝÛYÙIËØ]›\ÜÛÛ‹œÚÚ[™X\ÛÛŽ‰øàáøàï8à¯ù.#z-¬ÉßNÂˆÛÛœÝžY]O\ž™XYOÜ™\ØÜš\[Û“Y]Jž
NžÚXÛÛŽ‰ü'äæ	Ë]N›\ÜÛÛ‹]K\ØÎ‰ù§*¹k£9.¡¹¥fy§d8à¤¹a*¹ab	ßNÂˆÛÛœÝ\ÙTž\ž™XYH	‰ˆžšÚ[™OOIÚÛ›ÝÛYÙIÎÂ‚ˆ]X\›•\ÚÎÂˆYŠ\ÜÛÛ‹˜ÛÛ\]J^ÂˆÛÛœÝ›ØÝ\Ï\ÚÜš[˜[›ØÝ\Ô™XÛÛ[Y[™][ÛŠ
NÂˆX\›•\ÚÏ^Âˆ\N‰Ùš[˜[›ØÝ\ÉËXÛÛŽ™›ØÝ\ËšXÛÛ‹™Î‰Ø›YIËˆ]N™›ØÝ\Ë]K\ØÎ™›ØÝ\Ë™\ØËˆZ[]\Î›\ÜÛÛ“Z[]\Ë›ØÝ\ÂˆNÂˆY[ÙHYŠ\ÙTž
^ÂˆX\›•\ÚÏ^Âˆ\N‰Ü™\ØÜš\[Û‰ËXÛÛŽœžY]KšXÛÛ‹™Î‰Ø›YIËˆ]NœžY]K]K\ØÎ˜9c§ùfè8à#	Üžœ™X\ÛÛŸxà#xàjùd"8à£øàføàiº!ê¹båyaé¹¥®XˆZ[]\Î›\ÜÛÛ“Z[]\ËžˆNÂˆY[Ù^ÂˆX\›•\ÚÏ^Âˆ\N‰Û\ÜÛÛ‰ËXÛÛŽ‰ü'äæ	Ë™Î‰Ø›YIËˆ]N›\ÜÛÛ‹]K\ØÎ˜	Û\ÜÛÛ‹œÚÚ[xàîù§*¹k£9.¡¹¥fy§d8à¤¹a*¹abˆZ[]\Î›\ÜÛÛ“Z[]\Ë\ÜÛÛ’Y›\ÜÛÛ‹šYˆNÂˆB‚ˆ™]\›ˆÂˆÂˆ\N‰Ü™]šY]ÉËXÛÛŽ‰ü'éè	Ë™Î‰ÙÜ™Y[‰Ëˆ]N‰ú*&9¡­¸àk¹oªyïä‰Ëˆ\ØÎœ›Ý]\ÏØ9oªyïä¸àêøàï8àâ	Ü›Ý]\ßy.í¸à¤¹a*¹ab™YOØ9oªyïä¹§'úfd8àk¹ecúhc	ÙY_yecøà¤¹a*¹ab˜9§'úfd8à¤º/ã¸àb8àgùoªyïä¹ecúhc8àkøà`¸à¢¸ào¸àføà¤øà ¸à#	ÝÙXZßxà#xàk¹o,yà®yecúhc8àiùk¦¹ç`8à¤¹è®º*£xàeøào¸àfxà ˜ˆZ[]\Î˜[ØËœ™]šY]ÂˆKˆX\›•\ÚËˆÂˆ\N‰ÜÝXš™XÝ‰ËXÛÛŽ‰ü'ä®ÉË™Î‰Ü\œIËˆ]N˜‹›[ÙOOOIÝ˜XÙIÏØ8àåøàëxà¬8àêxàè8àâ8àë8àï8à®{ï&‰Ø‹]_X˜‹›[ÙOOOIÜÙXÝ\š]IÏØ8à®øà«xàéxàê¸àá¸à¨ûï&‰Ø‹]_X˜‹›[ÙOOOIØÛÛ\Ý[™	ÏØ:)!ùd"9¯%9ïä»ï&‰Ø‹]_X˜‹›[ÙOOOIÜÙXÝ\š]S[ØÚÉÏØ‹]N˜9k§ù¢)»ï&‰Ø‹]_Xˆ\ØÎ˜‹›[ÙOOOIÝ˜XÙIÏÉùéäyæëˆ8à¨¸àêøà­8àê¸à®¸àè	Î˜‹›[ÙOOOIÜÙXÝ\š]IÏÉùéäyæëˆ9 áyh,xà®øà«xàéxàê¸àá¸à¨ÉÎ˜‹›[ÙOOOIØÛÛ\Ý[™	ÏÉùéäyæëˆ8à¨¸àêøà­8àê¸à®¸àè8àîÌŒ9b!¹k§ù¢)‰Î˜‹›[ÙOOOIÜÙXÝ\š]S[ØÚÉÏÉùéäyæëˆ8à®øà«xàéxàê¸àá¸à¨øàîÌŒ9b!¹k§ù¢)‰Î‰ùéäyæëˆ9k§ù¢)‰ËˆZ[]\Î˜“Z[]\Ë›[ÙN˜‹›[ÙKšY˜‹šYˆKˆÂˆ\N‰Ø›ÜÜÉËXÛÛŽ‰ü'ädIË™Î‰ÞY[ÝÉËˆ]N™š[˜[\ÙOÉùæí9bcyíãùd"8ààxà©øààøà«ÉÎ‰ù.â¹¥éxàk¹íãùd"8ààxà©øààøà«ÉËˆ\ØÎ™š[˜[\ÙOÉùb)9¥«Lùecûï"ú`jyå*¹ecøàîùb!ºaã¸à¤¹¥høà¢xàeøàiyecÉÎ‰ùaj9b!ºaã¸àbøà¢Myecøàîù.åy."¸àd¸ààxà©øààøà«ÉËˆZ[]\Î˜[ØË˜›ÜÜÂˆBˆNÂŸB™[˜Ý[Ûˆ™[™\‘Z[T[Š
^ÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	ÙZ[U\ÚÓ\Ý	ÊNÂˆYŠ\›ÛÝ
H™]\›ŽÂˆÛÛœÝ™XÏYÙ]Z[T™XÛÜ™

NÂˆÛÛœÝ\ÚÜÏY[œÝ\™UÙ^T[”Û˜\ÚÝ

NÂˆÛÛœÝÝ[S[X™\Š™XË\™Ù]Z[]\Ê_\ÚÜËœ™YXÙJ
Ë
OOœÊÊ[X™\Š›Z[]\Ê_
K
_Y™™XÝ]™TÝYSZ[]\Ê
NÂˆÛÛœÝÛ™U\ÚÜÏ]\ÚÜË™š[\ŠO™Z[U\ÚÑÛ™J™XË
JNÂˆÛÛœÝÛ™SZ[]\ÏYÛ™U\ÚÜËœ™YXÙJ
Ë
OOœÊÝ›Z[]\Ë
NÂˆÛÛœÝÝSX]›Z[ŠLX]œ›Ý[™
Û™SZ[]\ËÝÝ[
ŒL
JNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
	ÙZ[T›ÙÜ™\ÜÐ˜\‰ÊKœÝ[KÚY\Ý
ÉÉIÎÂˆØÝ[Y[™Ù][[Y[žRY
	ÙZ[T›ÙÜ™\ÜÓX™[	ÊK^ÛÛ[X	ÙÛ™SZ[]\ßHÈ	ÝÝ[yb!˜ÂˆØÝ[Y[™Ù][[Y[žRY
	ÙZ[QÛ™SX™[	ÊK^ÛÛ[X	ÙÛ™U\ÚÜË›[™ÝHÈ	Ý\ÚÜË›[™ÝH9k£9.¡˜ÂˆÛÛœÝXÙOY^[TXÙTÝ]\Ê
NÂˆØÝ[Y[™Ù][[Y[žRY
	ÝÙ^T[“Y]IÊK^ÛÛ[\XÙKš\Ñ^[I‰ˆ\XÙK™^\™YˆÈ	ÜXÙKœ\ÙK›˜[Y_xàîù.â¹¥éIÝÝ[yb!¸àîùoªyïä¹o¡xàhIÜ™]šY]ÕÛÜšÛØYÛÝ[

_y.í¸àîùo,yà®xà#	ÝÙXZÙ\ÝÚÚ[

_xà#Xˆˆ9ª&y®¥‰ÝÝ[yb!¸àîùoªyïä¹o¡xàhIÜ™]šY]ÕÛÜšÛØYÛÝ[

_y.í¸àîùo,yà®xà#	ÝÙXZÙ\ÝÚÚ[

_xà#XÂˆÛÛœÝ™XYOXØ[Ô™XY[™\ÜÊ
NÂˆØÝ[Y[™Ù][[Y[žRY
	ÚÛYT™XY[™\ÜÉÊK^ÛÛ[\™XYJÉÉIÎÂ‚ˆ›ÛÝš[›™\’SIÉÎÂˆ\ÚÜË™›Ü‘XXÚ
OžÂˆÛÛœÝÛ™OYZ[U\ÚÑÛ™J™XË
NÂˆÛÛœÝYØÝ[Y[˜Ü™X]Q[[Y[
	Ù]‰ÊNÂˆ˜Û\ÜÓ˜[YOIÙZ[K]\ÚÉÊÊÛ™OÉÈÛ™IÎ‰ÉÊNÂˆš[›™\’SXˆ]ˆÛ\ÜÏH™Z[K]\ÚËZXÛÛˆ	Ý˜™ßH‰ÝšXÛÛŸOÙ]‚ˆ]‚ˆ]ˆÛ\ÜÏH™Z[K]\ÚË]]H‰ÛX\›š[™Ò[
]J_OÙ]‚ˆ]ˆÛ\ÜÏH™Z[K]\ÚËY\ØÈ‰Ù\ØØ\R[
™\ØÊ_OÙ]‚ˆÙ]‚ˆ]ˆÛ\ÜÏH™Z[K]\ÚË\ÚYH‚ˆ]ˆÛ\ÜÏH™Z[K]\ÚË][YH‰Ý›Z[]\ßyb!Ù]‚ˆ]ÛˆÛ\ÜÏH™Z[K]\ÚËXˆ‰ÙÛ™OÉøà ¸àa¹. 9n©‰Î‰úe¢ùiâÉßOØ]Û‚ˆÙ]˜Âˆœ]Y\žTÙ[XÝÜŠ	Ø]Û‰ÊK›Û˜ÛXÚÏJ
OO›][˜ÚZ[U\ÚÊ
NÂˆ›ÛÝ˜\[™Ú[

NÂˆJNÂ‚ˆÛÛœÝ™\Ý[YOYØÝ[Y[™Ù][[Y[žRY
	ÝÙ^T™\Ý[YP‰ÊNÂˆYŠ™\Ý[YJ^ÂˆÛÛœÝ™^\ÚÏ]\ÚÜË™š[™
OˆYZ[U\ÚÑÛ™J™XË
JNÂˆYŠ™^\ÚÊ^Âˆ™\Ý[YK™\ØX›YY˜[ÙNÂˆ™\Ý[YK^ÛÛ[YÛ™U\ÚÜË›[™ÝÉùí¦¸àcxàbøà¢ya£ze¢È8¡¤‰Î‰ù.â¹¥éxàk¹ki¹ïä¸à¤¹iâøà xà¢È8¡¤‰ÎÂˆ™\Ý[YK›Û˜ÛXÚÏJ
OO›][˜ÚZ[U\ÚÊ™^\ÚÊNÂˆY[Ù^Âˆ™\Ý[YK™\ØX›Y]YNÂˆ™\Ý[YK^ÛÛ[Iù.â¹¥éxàk¹ki¹ïä¸àkùk£9.¡¸àeøào¸àeøàgÈ8§$ÉÎÂˆ™\Ý[YK›Û˜ÛXÚÏ[[ÂˆBˆBˆÛÛœÝšYÚ›ÙÜ™\ÜÏYØÝ[Y[™Ù][[Y[žRY
	ÜšYÚZ[T›ÙÜ™\ÜÉÊKšYÚ™^YØÝ[Y[™Ù][[Y[žRY
	ÜšYÚZ[S™^	ÊKšYÚXÝ[ÛYØÝ[Y[™Ù][[Y[žRY
	ÜšYÚZ[PXÝ[Û‰ÊNÂˆÛÛœÝ™^\ÚÏ]\ÚÜË™š[™
OˆYZ[U\ÚÑÛ™J™XË
JNÂˆYŠšYÚ›ÙÜ™\ÜÊ\šYÚ›ÙÜ™\ÜË^ÛÛ[X	ÙÛ™U\ÚÜË›[™ÝKÉÝ\ÚÜË›[™Ýyk£9.¡¸àîÉÙÛ™SZ[]\ßKÉÝÝ[yb!˜ÂˆYŠšYÚ™^
\šYÚ™^^ÛÛ[[™^\ÚÏØ9«(xàkøà#	Û™^\ÚË]_xà#xàîùæë¹k¢IÛ™^\ÚË›Z[]\ßyb!˜‰ù.â¹¥éxàkº*"9å.øàkùk£9.¡¸àeøài¸àa8ào¸àfxà ‰ÎÂˆYŠšYÚXÝ[ÛŠ^ÜšYÚXÝ[Û‹™\ØX›YH[™^\ÚÎÜšYÚXÝ[Û‹^ÛÛ[[™^\ÚÏÉùí¦¸àcxàbøà¢ya£ze¢È8¡¤‰Î‰ù.â¹¥éxàk¹ki¹ïä¸àkùk£9.¡ˆ8§$ÉÎÜšYÚXÝ[Û‹›Û˜ÛXÚÏ[™^\ÚÏÊ
OO›][˜ÚZ[U\ÚÊ™^\ÚÊN›[ßBŸB‚™[˜Ý[Ûˆ][˜ÚZ[U\ÚÊ
^ÂˆYŠ\OOOIÝØ\›]\	Ê^ÂˆÚÝÔØÜ™Y[Š	Ü›Ø›[\ÉÊNÂˆÝ\]Z^Š	ÝØ\›]\	ÊNÂˆ™]\›ŽÂˆBˆYŠ\OOOIÝ\\”™]šY]ÉÊ^ÂˆÚÝÔØÜ™Y[Š	Ü›Ø›[\ÉÊNÂˆÝ\]Z^Š	Ý\\œ™]šY]ÉÊNÂˆ™]\›ŽÂˆBˆYŠ\OOOIÜ™]šY]ÉÊ^ÂˆÛÛœÝXXÝ[Û˜X›T™]šY]Ò›Ý\›™^\Ê
VÌNÂˆYŠŠ^ÂˆÝ\›Ý\›™^PXÝ[ÛŠ‹šY
NÂˆY[Ù^ÂˆÚÝÔØÜ™Y[Š	Ü›Ø›[\ÉÊNÂˆÝ\]Z^Š	Ü™]šY]ÉÊNÂˆBˆ™]\›ŽÂˆBˆYŠ\OOOIÛ\ÜÛÛ‰Ê^ÂˆÝ\\ÜÛÛŠ›\ÜÛÛ’Y
NÂˆ™]\›ŽÂˆBˆYŠ\OOOIÜ™\ØÜš\[Û‰Ê^ÂˆYŠœžËšÚ[™OOIÚÛ›ÝÛYÙIÊHÝ\\ÜÛÛŠXÚÓ\ÜÛÛ‘›Ü”ÚÚ[
œž˜Ø]
JNÂˆ[Ù^ÂˆÚÝÔØÜ™Y[Š	Ü›Ø›[\ÉÊNÂˆÝ\]Z^Šž[ÙJœž
JNÂˆBˆ™]\›ŽÂˆBˆYŠ\OOOIÙš[˜[›ØÝ\ÉÊ^Âˆ][˜Úš[˜[›ØÝ\Ê™›ØÝ\ÊNÂˆ™]\›ŽÂˆBˆYŠ\OOOIÜÝXš™XÝ‰Ê^ÂˆÚÝÔØÜ™Y[Š	Ý˜XÙIÊNÂˆYŠ˜›[ÙOOOIÝ˜XÙIÊ^ÂˆÙ]“[ÙJ	Ý˜XÙIÊNÂˆYŠ˜šY
HÝ\‘^\˜Ú\ÙJ˜šY
NÂˆY[ÙHYŠ˜›[ÙOOOIÜÙXÝ\š]IÊ^ÂˆÙ]“[ÙJ	ÜÙXÝ\š]IÊNÂˆYŠ˜šY
HÝ\ÙXÝ\š]TØÙ[˜\š[Ê˜šY
NÂˆY[ÙHYŠ˜›[ÙOOOIØÛÛ\Ý[™	Ê^ÂˆÙ]“[ÙJ	Û[ØÚÉÊNÂˆÝ\ÛÛ\Ý[™Ú[[™ÙJ
NÂˆY[ÙHYŠ˜›[ÙOOOIÜÙXÝ\š]S[ØÚÉÊ^ÂˆÙ]“[ÙJ	ÜÙXÝ\š]IÊNÂˆÝ\ÙXÝ\š]S[ØÚÊ
NÂˆY[Ù^ÂˆÙ]“[ÙJ	Û[ØÚÉÊNÂˆBˆ™]\›ŽÂˆBˆYŠ\OOOIØ›ÜÜÉÊ^ÂˆÚÝÔØÜ™Y[Š	Ü›Ø›[\ÉÊNÂˆÝ\]Z^Š	Ø›ÜÜÉÊNÂˆBŸB‚‹ËÈX\šÈ[›™\ˆ\ÚÜÈÚ[ˆHÛÜœ™\ÜÛ™[™È™X[XÝ]š]H\ÈÛÛ\]Y‚‹ËÈÜ˜\^\Ý[™ÈÛÛ\][Ûˆ[˜Ý[ÛœÈ˜]\ˆ[ˆ\XØ][™ÈZ\ˆX\›š[™ÈÙÚXË‚˜ÛÛœÝØÛÛ\]S\ÜÛÛ•OXÛÛ\]S\ÜÛÛŽÂ˜ÛÛ\]S\ÜÛÛY[˜Ý[ÛŠ
^ÂˆÛÛœÝ\ÜÛÛ™Y›Ü™OXXÝ]™S\ÜÛÛŽÂˆÛÛœÝ™]šY]Ð™Y›Ü™OXXÝ]™T™]šY]Ò›Ý\›™^RYÚ›Ý\›™^Q›ÜŠXÝ]™T™]šY]Ò›Ý\›™^RY
N›[ÂˆÛÛœÝ\Ô™]šY]Ó\ÜÛÛHH\™]šY]Ð™Y›Ü™I‰œ™]šY]Ð™Y›Ü™KœÝYÙOOOIÜ™[X\›‰É‰œ™]šY]Ð™Y›Ü™K›\ÜÛÛ’YOO[\ÜÛÛ™Y›Ü™NÂˆÛÛœÝ\ÐÛÜ™S\ÜÛÛHHSTÔÓÓ”ÖÛ\ÜÛÛ™Y›Ü™WOË˜ÛÜ™NÂˆØÛÛ\]S\ÜÛÛ•J
NÂ‚ˆËÈ9éäyæëxà¬øà¨¸àkøà#9¥fy§d8à¤º*«xà 8¡¤¸àá¸àï8àç¹¯%9ïä¸à¤¹í`¸àb8à¢øà#xào¸àiøà¤¹.â¹¥éxàk¹ki¹ïäŒy§¨8àj8àfxà¢øà ‚ˆËÈ9oªyïä¸àêøàï8àâ9a¡xàk¹¥fy§d:*«xàoùæí8àeøàkù¥¬:)£ùki¹ïä¹§¨8àj8àeøài¹¥l8àb8àj¸àa8à ‚ˆYŠZ\Ô™]šY]Ó\ÜÛÛ‰‰ˆZ\ÐÛÜ™S\ÜÛÛŠ[X\šÑZ[U\ÚÊ	Û\ÜÛÛ‰ËÛ\ÜÛÛ’Y›\ÜÛÛ™Y›Ü™_JNÂŸNÂ‚˜ÛÛœÝÙš[š\Ú•OYš[š\Ú‘^\˜Ú\ÙNÂ™š[š\Ú‘^\˜Ú\ÙOY[˜Ý[ÛŠ
^ÂˆÛÛœÝY™Y›Ü™OXÝ\œ™[ËšY[ÂˆÙš[š\Ú•J
NÂˆX\šÑZ[U\ÚÊ	ÜÝXš™XÝ‰ËÛ[ÙN‰Ý˜XÙIËYšY™Y›Ü™_JNÂŸNÂ‚˜ÛÛœÝÙš[š\ÚÙXÕOYš[š\ÚÙXÝ\š]TØÙ[˜\š[ÎÂ™š[š\ÚÙXÝ\š]TØÙ[˜\š[ÏY[˜Ý[ÛŠ
^ÂˆÛÛœÝY™Y›Ü™OXÝ\œ™[ÙXÏËšY[ÂˆÙš[š\ÚÙXÕJ
NÂˆX\šÑZ[U\ÚÊ	ÜÝXš™XÝ‰ËÛ[ÙN‰ÜÙXÝ\š]IËYšY™Y›Ü™_JNÂŸNÂ‚‹ËÈ]Z^ˆÛÛ\][Ûˆ]\ÝX]ÚHXÝX[\ÚÈ›Ý]K‚˜ÛÛœÝÙš[š\Ú]Z^”Ù\ÜÚ[Û•OYš[š\Ú]Z^”Ù\ÜÚ[ÛŽÂ™š[š\Ú]Z^”Ù\ÜÚ[ÛY[˜Ý[ÛŠ
^ÂˆÛÛœÝ[ÙP™Y›Ü™O\]Z^“[ÙNÂˆÙš[š\Ú]Z^”Ù\ÜÚ[Û•J
NÂ‚ˆËÈ:`&¹n.9oªyïä¸àj9oªyïä¸àêøàï8àâ8àkøà xàjxàhxà¢xà ¹.â¹¥éxàk¸à#:*&9¡­¸àk¹oªyïä¸à#y§¨8à ‚ˆYŠ[ÙP™Y›Ü™OOOIÜ™]šY]ÉßÝš[™Ê[ÙP™Y›Ü™JKœÝ\ÕÚ]
	Ú›Ý\›™^N‰ÊJ[X\šÑZ[U\ÚÊ	Ü™]šY]ÉÊNÂˆYŠ[ÙP™Y›Ü™OOOIÝ\\œ™]šY]ÉÊ[X\šÑZ[U\ÚÊ	Ý\\”™]šY]ÉÊNÂˆYŠ[ÙP™Y›Ü™OOOIÝØ\›]\	Ê[X\šÑZ[U\ÚÊ	ÝØ\›]\	ÊNÂ‚ˆËÈ9éäyæëxà¬øà¨¹¥fy§d8àkøà xàgxàk¸àá¸àï8àç¸àk¹¯%9ïä¸à¤¹§ 9o£8ào¸àiùí`¸àb8ài¹b'xà xài¹.â¹¥éxàk¹ki¹ïä¹§¨8à¤¹k£9.¡¸à ‚ˆYŠÝš[™Ê[ÙP™Y›Ü™JKœÝ\ÕÚ]
	ØÛÜ™]ÜXÎ‰ÊJ^ÂˆX\šÑZ[U\ÚÊ	Û\ÜÛÛ‰ËÛ\ÜÛÛ’Y”Ýš[™Ê[ÙP™Y›Ü™JKœÛXÙJL
_JNÂˆB‚ˆYŠÝš[™Ê[ÙP™Y›Ü™JKœÝ\ÕÚ]
	ØÛÜ™XÚ\\Ž‰Ê_Ýš[™Ê[ÙP™Y›Ü™JKœÝ\ÕÚ]
	ØÛÙØØ]‰Ê_Ýš[™Ê[ÙP™Y›Ü™JKœÝ\ÕÚ]
	ØÛÜ™]ÜXÎ‰ÊJ^ÂˆX\šÑZ[U\ÚÊ	Ùš[˜[›ØÝ\ÉÊNÂˆB‚ˆYŠ[ÙP™Y›Ü™OOOIØ›ÜÜÉÊHX\šÑZ[U\ÚÊ	Ø›ÜÜÉÊNÂˆYŠÝš[™Ê[ÙP™Y›Ü™JKœÝ\ÕÚ]
	Üž‰ÊJHX\šÑZ[U\ÚÊ	Ü™\ØÜš\[Û‰ËÛ[ÙN›[ÙP™Y›Ü™_JNÂŸNÂ‚‚‹ËÈŽMNˆ9êè9§*ùílyd"9¯%9ïä¸àk¹¢$9î/¸à¤“PTÕT¹b)9k¦¹å*8àjù¬.9í¦¹c%¸àfxà¢øà ‚˜ÛÛœÝÙš[š\Ú]Z^”Ù\ÜÚ[Û•ŽMOYš[š\Ú]Z^”Ù\ÜÚ[ÛŽÂ™š[š\Ú]Z^”Ù\ÜÚ[ÛY[˜Ý[ÛŠ
^ÂˆÛÛœÝ[ÙP™Y›Ü™O\]Z^“[ÙNÂˆÛÛœÝ˜]P™Y›Ü™O\]Z^’][\Ë›[™ÝÓX]œ›Ý[™
]Z^ÛÜœ™XÝÛÝ[Ü]Z^’][\Ë›[™Ý
ŒL
NŒÂˆÙš[š\Ú]Z^”Ù\ÜÚ[Û•ŽMJ
NÂˆYŠÝš[™Ê[ÙP™Y›Ü™JKœÝ\ÕÚ]
	ØÛÜ™XÚ\\Ž‰ÊJ^ÂˆÛÛœÝÚS[X™\ŠÝš[™Ê[ÙP™Y›Ü™JKœÛXÙJLŠJNÂˆYŠÚLI‰˜ÚLŒJ^Âˆ™XÛÜ™Ú\\’[YÜ˜][Û”™\Ý[
Ú˜]P™Y›Ü™JNÂˆØ]™T›Ùš[J
NÂˆ™[™\ÛÜ™PÛÝ\œÙSX\
ØÝ[Y[™Ù][[Y[žRY
	ØÛÜ™PÛÝ\œÙTÙX\˜Ú	ÊOË˜[Y_	ÉÊNÂˆBˆBŸNÂ‚‹ËÈÝXš™XÝ‰ÜÈ]\ˆÝYÙ\È\™H[ÛÈ˜[YÛÛ\][ÛœÈÙˆÙ^IÜÈÝXš™XÝˆÛÝ‚˜ÛÛœÝÙš[š\Ú‘š[˜[OYš[š\Ú‘š[˜[Â™š[š\Ú‘š[˜[Y[˜Ý[ÛŠ[YU\Y˜[ÙJ^ÂˆÛÛœÝY][\ÏHHX‘š[˜[][\Ë›[™ÝÂˆÙš[š\Ú‘š[˜[J[YU\
NÂˆYŠY][\Ê[X\šÑZ[U\ÚÊ	ÜÝXš™XÝ‰ËÛ[ÙN‰Ùš[˜[	ßJNÂŸNÂ˜ÛÛœÝÙš[š\Ú“Z[šS[ØÚÕOYš[š\Ú“Z[šS[ØÚÎÂ™š[š\Ú“Z[šS[ØÚÏY[˜Ý[ÛŠ[YU\Y˜[ÙJ^ÂˆÛÛœÝY][\ÏHHX“[ØÚÒ][\Ë›[™ÝÂˆÙš[š\Ú“Z[šS[ØÚÕJ[YU\
NÂˆYŠY][\Ê[X\šÑZ[U\ÚÊ	ÜÝXš™XÝ‰ËÛ[ÙN‰Û[ØÚÉßJNÂŸNÂ‚‹ËÈŽŽˆŒ9b!¸àkº)!ùd"9¯%9ïä¸àîøà®øà«xàéxàê¸àá¸à¨øàçøàâùª(z*i¸à ¸à yk£9.¡¹¦`¸àh8àdy.â¹¥éxàk¹éäyæë¹§¨8à¤¹k£9.¡¹¢lxàa8àjøàfxà¢øà ‚˜ÛÛœÝÙš[š\ÚÛÛ\Ý[™ŽYš[š\ÚÛÛ\Ý[™Ú[[™ÙNÂ™š[š\ÚÛÛ\Ý[™Ú[[™ÙOY[˜Ý[ÛŠ[YU\Y˜[ÙJ^ÂˆÛÛœÝYÙ]HHXÛÛ\Ý[™Ù]ÂˆÙš[š\ÚÛÛ\Ý[™ŽŠ[YU\
NÂˆYŠYÙ]
[X\šÑZ[U\ÚÊ	ÜÝXš™XÝ‰ËÛ[ÙN‰ØÛÛ\Ý[™	ßJNÂŸNÂ˜ÛÛœÝÙš[š\ÚÙXÝ\š]S[ØÚÕŽYš[š\ÚÙXÝ\š]S[ØÚÎÂ™š[š\ÚÙXÝ\š]S[ØÚÏY[˜Ý[ÛŠ[YU\Y˜[ÙJ^ÂˆÛÛœÝY][\ÏHH\ÙXÓ[ØÚÒ][\Ë›[™ÝÂˆÙš[š\ÚÙXÝ\š]S[ØÚÕŽŠ[YU\
NÂˆYŠY][\Ê[X\šÑZ[U\ÚÊ	ÜÝXš™XÝ‰ËÛ[ÙN‰ÜÙXÝ\š]S[ØÚÉßJNÂŸNÂ‚™[˜Ý[Ûˆ›ØYX\]J
^ÂˆÛÛœÝXÚYÏPÓÔ‘WÐWÐÕT”’PÕSSK™š[\ŠO˜Ú\\LLÊK›X\
OšY
NÂˆÛÛœÝ\Ú[™\ÜÒYÏPÓÔ‘WÐWÐÕT”’PÕSSK™š[\ŠO˜Ú\\LM
K›X\
OšY
NÂˆÛÛœÝUXÚ[\ÜÛÛÛÛ\][Û]™\˜YÙJXÚYÊNÂˆÛÛœÝP\Ú[™\ÜÏ[\ÜÛÛÛÛ\][Û]™\˜YÙJ\Ú[™\ÜÒYÊNÂˆÛÛœÝ[ÛÏ[Øš™XÝÛÛ\][ÛŠ›Ùš[K˜”›ÙÜ™\ÜË—ÑVTÒTÑTË›[™Ý
NÂˆÛÛœÝ”ÙXÏ[Øš™XÝÛÛ\][ÛŠ›Ùš[KœÙXÝ\š]P”›ÙÜ™\ÜËÑPÕT’UWÔÐÑST’SÔË›[™Ý
NÂˆÛÛœÝÏ\™XY[™\ÜÐÛÛ\Û™[Ê
NÂˆÛÛœÝ˜XÝXÙOSX]œ›Ý[™

Ë˜S[ØÚÊØË˜‘^[JKÌŠNÂˆ™]\›ˆÂˆÚXÛÛŽ‰ü'äæ	Ë]N‰øà®xàá¸ààøàåÈxà 9éäyæëH8àá¸à«øàã¸àëxà®	Ë\ØÎ˜9ë+xà'Lùêè8àîÉÝXÚYË›[™Ýxàá¸àï8àç˜Ý˜UXÚKˆÚXÛÛŽ‰ü'äâ‰Ë]N‰øà®xàá¸ààøàåÈ¸à 9éäyæëH8àç¸àãxà®8àèxàìøàâ8àîøà®xàâ8àêxàá¸à®	Ë\ØÎ˜9ë+M8à'Œyêè8àîÉØ\Ú[™\ÜÒYË›[™Ýxàá¸àï8àç˜Ý˜P\Ú[™\ÜßKˆÚXÛÛŽ‰ü'ä®ÉË]N‰øà®xàá¸ààøàåÈøà 9éäyæëˆ8à¨¸àêøà­8àê¸à®¸àè	Ë\ØÎ‰ÌŒ9¯%9ïä¸à¤¹gî¹é#¸¡¤¹ª&y®¥¸¡¤¹oç9å*8àkºh!¸àjøàâ8àë8àï8à®IËÝ˜[ÛßKˆÚXÛÛŽ‰ü'æè{î#ÉË]N‰øà®xàá¸ààøàåÈ8à 9éäyæëˆ8à®øà«xàéxàê¸àá¸à¨ÉË\ØÎ‰ÌMxà¬xàï8à®xàiùâ­¹¬àyb)9¥«IËÝ˜”ÙXßKˆÚXÛÛŽ‰ü'ãàIË]N‰øà®xàá¸ààøàåÈxà 9íãùd"9k§ù¢)‰Ë\ØÎ‰ùéäyæëxàåxàêùª(z*i»ï"ùéäyæë¹íãùd"9k§ù¢)¸àk¹æí:/äy¢$9î/‰ËÝœ˜XÝXÙ_BˆNÂŸB‚™[˜Ý[Ûˆ™[™\”›ØYX\

^ÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	Ü›ØYX\\Ý	ÊNÂˆYŠ\›ÛÝ
H™]\›ŽÂˆ›ÛÝš[›™\’SIÉÎÂˆ›ØYX\]J
K™›Ü‘XXÚ
OžÂˆÛÛœÝYØÝ[Y[˜Ü™X]Q[[Y[
	Ù]‰ÊNÂˆ˜Û\ÜÓ˜[YOIÜ›ØYX\Z][IÎÂˆš[›™\’SXˆ]ˆÛ\ÜÏHœ›ØYX\ZXÛÛˆ‰ÞšXÛÛŸOÙ]‚ˆ]‚ˆ]ˆÛ\ÜÏHœ›ØYX\]]H‰Þ]_OÙ]‚ˆ]ˆÛ\ÜÏHœ›ØYX\Y\ØÈ‰Þ™\ØßOÙ]‚ˆ]ˆÛ\ÜÏHœ›ÙÜ™\ÜÈˆÝ[OH›X\™Ú[‹]ÜÜÚZYÚŽ]ˆÝ[OHÚY‰ÞœÝIHÙ]Ù]‚ˆÙ]‚ˆ]ˆÛ\ÜÏHœ›ØYX\\Ý‰ÞœÝIOÙ]˜Âˆ›ÛÝ˜\[™Ú[

NÂˆJNÂŸB‚™[˜Ý[Ûˆ™[™\•ÙYZÐÚ\

^ÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	ÝÙYZÐÚ\	ÊNÂˆYŠ\›ÛÝ
H™]\›ŽÂˆ›ÛÝš[›™\’SIÉÎÂˆÛÛœÝ˜[Y\ÏVÉù¥éIË	ù§"	Ë	ùàjÉË	ù¬-	Ë	ù§*	Ë	úaäIË	ùg'É×NÂˆÛÛœÝ^\ÏV×NÂˆ›ÜŠ]OMŽÚOLÚKKJ^ÂˆÛÛœÝ[™]È]J
NÂˆœÙ]]J™Ù]]J
KZJNÂˆÛÛœÝÏY]RÙ^J
NÂˆ^\Ëœ\Ú
ÙËZ[Žœ›Ùš[K˜XÝ]š]OË–Ú×OË›Z[]\ßJNÂˆBˆÛÛœÝX^SX]›X^
Œ‹‹™^\Ë›X\
Ož›Z[ŠJNÂˆ^\Ë™›Ü‘XXÚ
OžÂˆÛÛœÝÝSX]›X^
ËX]œ›Ý[™
›Z[‹ÛX^
ŒL
JNÂˆÛÛœÝÏYØÝ[Y[˜Ü™X]Q[[Y[
	Ù]‰ÊNÂˆË˜Û\ÜÓ˜[YOIÙ^KXÛÛ	ÎÂˆËš[›™\’SX]ˆÛ\ÜÏH™^K[Z[ˆ‰Þ›Z[Þ›Z[ŠÉÛIÎ‰ÉßOÙ]‚ˆ]ˆÛ\ÜÏH™^KX˜\‹]Ü˜\]ˆÛ\ÜÏH™^KX˜\ˆˆÝ[OHšZYÚ‰Þ›Z[ÜÝŒßIHÙ]Ù]‚ˆ]ˆÛ\ÜÏH™^K[˜[YH‰Û˜[Y\ÖÞ™™Ù]^J
W_OÙ]˜Âˆ›ÛÝ˜\[™Ú[
ÊNÂˆJNÂŸB‚™[˜Ý[Ûˆ™[™\”™XY[™\ÜÊ
^ÂˆÛÛœÝXØ[Ô™XY[™\ÜÊ
NÂˆÛÛœÝš[™ÏYØÝ[Y[™Ù][[Y[žRY
	Ü™XY[™\ÜÔš[™ÉÊNÂˆYŠš[™ÊHš[™ËœÝ[KœÙ]›Ü\J	ËK\	ËŠNÂˆYŠØÝ[Y[™Ù][[Y[žRY
	Ü™XY[™\ÜÕ˜[YIÊJHØÝ[Y[™Ù][[Y[žRY
	Ü™XY[™\ÜÕ˜[YIÊK^ÛÛ[\ŠÉÉIÎÂˆYŠØÝ[Y[™Ù][[Y[žRY
	ÜšYÚ™XY[™\ÜÉÊJHØÝ[Y[™Ù][[Y[žRY
	ÜšYÚ™XY[™\ÜÉÊK^ÛÛ[\ŠÉÉIÎÂˆYŠØÝ[Y[™Ù][[Y[žRY
	ÜšYÚ™XY[™\ÜÐ˜\‰ÊJHØÝ[Y[™Ù][[Y[žRY
	ÜšYÚ™XY[™\ÜÐ˜\‰ÊKœÝ[KÚY\ŠÉÉIÎÂ‚ˆ]X™[Iùgî¹é#¸àixàcøà¢¹.+IÎÂˆYŠN
HX™[Iùíãù.åy."¸àd¸àn:`,¸à xà¢ùâ­¹¡bÉÎÂˆ[ÙHYŠMJHX™[Iùk§ù¢)¹b¦øà¤¹/.8àl8àfy«­zf£‰ÎÂˆ[ÙHYŠMJHX™[Iù..ú) yb!ºaã¸à¤¹k¦¹ç`9.+IÎÂˆ[ÙHYŠLJHX™[Iùgî¹é#¸à¤¹n øàd¸ài¸àa8à¢ù«­zf£‰ÎÂˆYŠØÝ[Y[™Ù][[Y[žRY
	Ü™XY[™\ÜÓX™[	ÊJHØÝ[Y[™Ù][[Y[žRY
	Ü™XY[™\ÜÓX™[	ÊK^ÛÛ[[X™[Â‚ˆÛÛœÝÏ\™XY[™\ÜÐÛÛ\Û™[Ê
NÂˆÛÛœÝœ™XZÙÝÛYØÝ[Y[™Ù][[Y[žRY
	Ü™XY[™\ÜÐœ™XZÙÝÛ‰ÊNÂˆYŠœ™XZÙÝÛŠ^ÂˆÛÛœÝ›ÝÜÏVÂˆÉùéäyæëy¥fy§d	ËË›\ÜÛÛ—KÉùéäyæëy¯%9ïä‰ËË˜T˜XÝXÙWKÉùéäyæëyª(z*i‰ËË˜S[ØÚ×KˆÉùéäyæë¹ki¹ïä‰ËË˜•˜Z[š[™×KÉùéäyæë¹íãùd"	ËË˜‘^[WKÉùoªyïä¹k¦¹ç`	ËË›Y[[ÜžQ]šY[˜ÙWBˆNÂˆœ™XZÙÝÛ‹š[›™\’S\›ÝÜË›X\

Û˜[YK˜[JOO˜]ˆÛ\ÜÏHœ™XY[™\ÜË\\Ü[‰Û˜[Y_OÜÜ[‰Ý˜[IOØÙ]˜
Kš›Ú[Š	ÉÊNÂˆB‚ˆÛÛœÝÙXZÏ]ÙXZÙ\ÝÚÚ[

NÂˆÛÛœÝ›ØÝ\ÏX9ãï¹g*8àkøà#	ÝÙXZßxà#xà¤¹a*¹ab8à ˜ÂˆYŠØÝ[Y[™Ù][[Y[žRY
	ÜšYÚ›ØÝ\ÉÊJHØÝ[Y[™Ù][[Y[žRY
	ÜšYÚ›ØÝ\ÉÊK^ÛÛ[Y›ØÝ\ÎÂˆYŠØÝ[Y[™Ù][[Y[žRY
	ØY\]™S›ÝIÊJ^ÂˆÛÛœÝ›Ý]\ÏXXÝ[Û˜X›T™]šY]Ò›Ý\›™^\Ê
K›[™ÝYOYYT]Y\Ý[ÛœÊ
K›[™ÝÂˆÛÛœÝ™]šY]Õ^\›Ý]\ÂˆÈ:*©9ëe8àbøà¢yí¦¸àa8ài¸àa8à¢ùoªyïä¸àêøàï8àâ8àc	Ü›Ý]\ßy.í¸à`¸à¢¸ào¸àfxà ¸ào¸àf¸à#9¥fy§d8¡¤ºhgºhc8¡¤¹o£9¥éyè®º*£xà#xàk¹í¦¸àcxàbøà¢z`,¸à xào¸àfxà ˜ˆˆYBˆÈ9oªyïä¹§'úfd8àk¹ecúhc8àc	ÙY_yecøà`¸à¢¸ào¸àfxà ¸ào¸àf¹oªyïä¸àbøà¢yiâøà xà¢øàk¸àc8àb¸àfxàfxà xàiøàfxà ˜ˆˆ	È9oªyïä¹o¡xàhxàkøàj¸àa8àk¸àiøà y¥¬8àeøàa9¥fy§d8à¤º`,¸à xài¹©âøàa8ào¸àføà¤øà ‰ÎÂˆØÝ[Y[™Ù][[Y[žRY
	ØY\]™S›ÝIÊKš[›™\’SX‘‘HUQTÕ8àk¹£ä9¨b;ï&Øˆ	Ù›ØÝ\ßIÜ™]šY]Õ^XÂˆBˆ™[™\‘š[˜[X\Ý\”[™[

NÂŸB‚™[˜Ý[Ûˆ™[™\ÛÝ[ÝÛŠ
^ÂˆÛÛœÝ›ÞYØÝ[Y[™Ù][[Y[žRY
	ØÛÝ[ÝÛ›Þ	ÊNÚYŠX›Þ
\™]\›ŽÂˆYŠ\›Ùš[KœÙ][™ÜË™^[Q]J^Ø›Þš[›™\’SIÏ]ˆÛ\ÜÏH˜ÛÝ[ÝÛ‹Y[\H¹cåúj$ù.¢9k¦¹¥éxà¤º*+yk¦¸àfxà¢øàj8à y«¢øà¢¹¥éy¥l8àîùoáz) xàæ¸àï8à®xàîùk£9.¡º)¢ú/¯8àoøà¤º*"9ë¥øàeøào¸àfxà Ù]‰ÎÜ™]\›ŽßBˆÛÛœÝ^\ÏY^[Q^\Ô™[XZ[š[™Ê
NÂˆYŠ^\Ï
X›Þš[›™\’SIÏ]ˆÛ\ÜÏH˜ÛÝ[ÝÛ‹Y[\Hº*+yk¦¸àeøàgùcåúj$ù.¢9k¦¹¥éxàkú`c¸àc¸ài¸àa8ào¸àfxà ¹¥¬8àeøàa9¥éy.æ8à¤º*+yk¦¸àeøài¸àcøàh8àexàa8à Ù]‰ÎÂˆ[ÙHYŠ^\ÏOOL
X›Þš[›™\’SIÏ]ˆÛ\ÜÏH˜ÛÝ[ÝÛˆ]ˆÛ\ÜÏH˜ÛÝ[ÝÛ‹[[H¹.â¹¥éOÙ]]ˆÛ\ÜÏH˜ÛÝ[ÝÛ‹[X™[¹cåúj$ù.¢9k¦¹¥éxàîù¥¬:)£ùki¹ïä¸àkùh¥øà¡8àexàj¸àaÙ]Ù]‰ÎÂˆ[ÙHYŠ^\ÏOOLJX›Þš[›™\’SIÏ]ˆÛ\ÜÏH˜ÛÝ[ÝÛˆ]ˆÛ\ÜÏH˜ÛÝ[ÝÛ‹[[HŒOÙ]]ˆÛ\ÜÏH˜ÛÝ[ÝÛ‹[X™[¹¥éybcxàîùçëxàa9oªyïä¸àh8àdxàiù¥m8àb8à¢ÏÙ]Ù]‰ÎÂˆ[ÙH›Þš[›™\’SX]ˆÛ\ÜÏH˜ÛÝ[ÝÛˆ]ˆÛ\ÜÏH˜ÛÝ[ÝÛ‹[[H‰Ù^\ßOÙ]]ˆÛ\ÜÏH˜ÛÝ[ÝÛ‹[X™[¹¥éyo£8ào¸àiøàjù.åy."¸àd¸à¢ÏÙ]Ù]˜ÂŸB‚™[˜Ý[ÛˆXÙQ]U^

^Ü™]\›ˆ[œÝ[˜Ù[Ùˆ]I‰ˆS[X™\‹š\Ó˜SŠ™Ù][YJ
JOØ	Ù™Ù][Û

JÌ_KÉÙ™Ù]]J
_X‰ø %	ÎßB™[˜Ý[Ûˆ™[™\‘^[TXÙJ
^ÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	Ù^[TXÙT[™[	ÊNÚYŠ\›ÛÝ
\™]\›ŽØÛÛœÝY^[TXÙTÝ]\Ê
NÂˆYŠ\š\Ñ^[J^Ü›ÛÝš[›™\’SIÏ]ˆÛ\ÜÏHœXÙK[›ÝH¹cåúj$ù.¢9k¦¹¥éxà¤º*+yk¦¸àfxà¢øàj8à Q‘HUQTÕ9a¡xàk¹«¢øà¢¹ki¹ïäºaãøàj9§ :/äxàk¹ki¹ïäº*&:c,¸àbøà¢xà#8àdøàk¸ào¸ào¸àiúe¤øàjùd"8àa¸àbøà#xà¤º(j9é.¸àeøào¸àfxà Ù]‰ÎÜ™]\›ŽßBˆYŠ™^\™Y
^Ü›ÛÝš[›™\’SIÏ]ˆÛ\ÜÏHœXÙK[Ý™\šY]ÈØ\›ˆ]ˆÛ\ÜÏHœXÙKZXY]ˆÛ\ÜÏHœXÙK\Ý]\ËZXÛÛˆ¼'äáOÙ]]ˆÛ\ÜÏHœXÙKZXYXÛÜH]ˆÛ\ÜÏHœXÙK]]H¹cåúj$ù.¢9k¦¹¥éxà¤¹¦í9¥¬8àeøài¸àcøàh8àexàaÙ]]ˆÛ\ÜÏHœXÙKY^Z[ˆº`c¹c®øàk¹¥éy.æ8àc:*+yk¦¸àexà£8ài¸àa8à¢øàgøà xà xàæ¸àï8à®yb)9k¦¸à¤¹`g9«h¸àeøài¸àa8ào¸àfxà Ù]Ù]Ù]Ù]‰ÎÜ™]\›ŽßBˆYŠ\\Š^ÂˆÛÛœÝÝXÛÝ\œÙSX\Ý\žTÝ]\Ê
NÂˆÛÛœÝÚ[\™^\ÏOOLÉùcåúj$ùodù¥éIÎœ™^\ÏOOLOÉùbcy¥éIÎ˜9«¢øà¢‰Ü™^\ßy¥éXÂˆÛÛœÝ]O\™^\ÏOOLÉù.â¹¥éxàkùh¥øà¡8àexàf¸à y¡'ú)¦¸àh8àdy¥m8àb8ào¸àfIÎœ™^\ÏOOLOÉùbcy¥éxàkùçëxàa9oªyïä¸àiùí`¸àb8ào¸àfIÎ‰ù«¢úaãù­¢9c%¸à¢8à¢¸à y.åy."¸àc8à¢¸à¤¹k¢8à¢¸ào¸àfIÎÂˆ›ÛÝš[›™\’SX]ˆÛ\ÜÏHœXÙK[Ý™\šY]ÈÛÛÙ‚ˆ]ˆÛ\ÜÏHœXÙKZXY]ˆÛ\ÜÏHœXÙK\Ý]\ËZXÛÛˆ‰Üœ\ÙKšXÛÛŸOÙ]]ˆÛ\ÜÏHœXÙKZXYXÛÜH]ˆÛ\ÜÏHœXÙK\\ÙH‰Üœ\ÙK›˜[Y_xàîÉÝÚ[ŸOÙ]]ˆÛ\ÜÏHœXÙK]]H‰Ý]_OÙ]]ˆÛ\ÜÏHœXÙKY^Z[ˆ¹æí9bcy§'øàkù§*¹k£9.¡¸àèxàâøàéxàï8à¤¹aj:`ê:*l8à z/¯8ào¸àf¸à z`&¹n.8à«øàª8à®xàâ8à¤¹§ 9i)ÉÜ™Y™™XÝ]™_yb!¸àn9¢¤xàb8ào¸àfxà Ù]Ù]Ù]‚ˆ]ˆÛ\ÜÏHœXÙK[Y]šXÜÈ‚ˆ]ˆÛ\ÜÏHœXÙK[Y]šXÈÜ[¹.â¹¥éxàk¹£ª9ij9."ºfdÜÜ[‰Ü™Y™™XÝ]™_yb!ØÙ]‚ˆ]ˆÛ\ÜÏHœXÙK[Y]šXÈÜ[¹íãù.åy."¸àd¹gî¹®¥ÜÜ[‰ÜÝœ\ÜÙYKÎØÙ]‚ˆ]ˆÛ\ÜÏHœXÙK[Y]šXÈÜ[¹£ª9k¦¹/çy£ OÜÜ[‰ÜÝ›Y[K˜]™ßIOØÙ]‚ˆ]ˆÛ\ÜÏHœXÙK[Y]šXÈÜ[º) yoªyïäÜÜ[‰ÜÝ›Y[K™Y_yecÏØÙ]‚ˆÙ]‚ˆ]ˆÛ\ÜÏHœXÙKXY\ÝY[¹æí9bcz*¯ù¥m;ï&Øˆ9¥¬:)£ùki¹ïä¸àîúemù¦`ºe¤ùª(z*i¸àjøà¢8à¢ú/ïxàa:/¯8àoøà¢8à¢¸à y¥è¹ïä¹ëá9fì¸àk¹oªyïä¸àj9çëxàa9è®º*£xà¤¹a*¹ab8àeøào¸àfxà Ù]‚ˆ]ˆÛ\ÜÏHœXÙK[›ÝH‘‘HUQTÕ9a¡xàk¸à#9«¢øà¢¹ki¹ïäºaãøà#xàkùcàº  øàj8àeøài¹«¢øàeøào¸àfxàc8à xàdøàk¹¦`¹§'øàkùaj:aãù­¢9c%¸à¤¹æë¹ª&xàjøàeøào¸àføà¤øà ŽLÌL9b!¸àk¹k§ù¢)¸à¤º(c8àa¹¥éxàkøà z`&¹n.8à«øàª8à®xàâ8àn9."¹.eøàføàføàf¸àgxàk¹¥éxàk¸àèxà©8àìùki¹ïä¸àj8àeøài¹¢lxàa8ào¸àfxà ¹íãù.åy."¸àd¹gî¹®¥¸à ¹ak9o#øàk¹d"9¨/9gî¹®¥¸àiøàkøà`¸à¢¸ào¸àføà¤øà Ù]‚ˆÙ]˜Âˆ™]\›ŽÂˆBˆÛÛœÝÛO^ÙÛÛÙ–Éø§!IË	ù/fz(åxà¤¸à ¸àhøàiº`,¸à xà¢xà£8àgxàa¸àiøàfIË	ÙÛÛÙ	×KÚÎ–Éü'äcIË	ù.â¸àk¸àæ¸àï8à®xàj¸à¢ze¤øàjùd"8àaº)¢ú/¯8àoøàiøàfIË	ÛÚÉ×KØ\›Ž–Éø¦¨IË	ùl$xàeøàæ¸àï8à®xà¤¹."¸àd¸à¢ùoáz) xàc8à`¸à¢¸ào¸àfIË	ÝØ\›‰×K[™Ù\Ž–Éü'æª	Ë	ù.â¸àk¸àæ¸àï8à®xàiøàkúe¤øàjùd"8à£øàj¸àa:)¢ú/¯8àoøàiøàfIË	Ù[™Ù\‰×_NÂˆÛÛœÝÚXÛÛ‹]KÛ™WO\ÛVÜœÝ]\×_ÛK›ÚÎÂˆÛÛœÝÝ\œ™[\œXÙTÛÝ\˜ÙOOOIÜ™XÙ[	ÏØ9æí:/äIÜœ™XÙ[›ØœÙ\™Y^\ßy¥éze¤øàk¹ki¹ïä¹k£9.¡¹£æùë¥øàiÈ	ÓX]œ›Ý[™
˜Ý\œ™[XÙJ_yb!‹ù¥éX˜9k£9.¡º*&:c,¸àc8ào¸àh9l$xàj¸àa8àgøà xà z*+yk¦¹.+xàkˆ	Ü˜˜\Ù[[™_yb!‹ù¥éH8àiú*i¹ë¥ØÂˆÛÛœÝš[š\Ú\œ™[XZ[š[™ÏLÉù..ú) xàèxàâøàéxàï8àkùk£9.¡¹®"8àoÉÎ˜9.â¸àk¸àæ¸àï8à®xàj¸à¢H	ÜXÙQ]U^
œ›Ú™XÝY]J_xàe8à£yk£9.¡º)¢ú/¯8àoØÂˆ]YIÉÎÂˆYŠ˜]]ÊXY\™Y™™XÝ]™Oœ˜˜\Ù[[™BˆÈ
˜Ø[”™XÛÝ™\Øº!ê¹båz*¯ù¥m9.+{ï&Øˆ9ª&y®¥‰Ü˜˜\Ù[[™_yb!ˆ8¡¤ˆ9.â¹¥éIÜ™Y™™XÝ]™_yb!¸à º*iºj$ù¥éxàjúe¤øàjùd"8à£øàføà¢øàgøà xà yæë¹ª&y¦`ºe¤øà¤¹o%xàcy."¸àd¸ài¸àa8ào¸àfxà ˜˜º!ê¹båz*¯ù¥m9.+{ï&Øˆ9."ºfdLŒ9b!¸ào¸àiùo%xàcy."¸àd¸ài¸à ¹.#z-¬øàeøào¸àfxà ¹cåúj$ù¥éxàkº)¢ùæí8àeøà ¹©':*#¸àeøài¸àcøàh8àexàa8à ˜
Bˆˆº!ê¹båz*¯ù¥mÓ»ï&Øˆ9.â¸àkùª&y®¥‰Ü˜˜\Ù[[™_yb!¸àk¸ào¸ào¸àiùc`yb!¸àiøàfxà º`axà£8àc9aî¸à¢øàj9ïã9¥éy.ézfcxàk¹æë¹ª&xàj:acyb!¸à¤º!ê¹båz*¯ù¥m8àeøào¸àfxà ˜Âˆ[ÙHYX:!ê¹båz*¯ù¥m8àkÓÑ‘¸àiøàfxà ¹oáz) xàæ¸àï8à®xàkùí!	ÓX]˜ÙZ[
œ™\]Z\™Y
_yb!‹ù¥éxàiøàfxà ˜Âˆ›ÛÝš[›™\’SX]ˆÛ\ÜÏHœXÙK[Ý™\šY]È	ÝÛ™_H‚ˆ]ˆÛ\ÜÏHœXÙKZXY]ˆÛ\ÜÏHœXÙK\Ý]\ËZXÛÛˆ‰ÚXÛÛŸOÙ]]ˆÛ\ÜÏHœXÙKZXYXÛÜH]ˆÛ\ÜÏHœXÙK\\ÙH‰Üœ\ÙKšXÛÛŸH	Üœ\ÙK›˜[Y_OÙ]]ˆÛ\ÜÏHœXÙK]]H‰Ý]_OÙ]]ˆÛ\ÜÏHœXÙKY^Z[ˆ‰ØÝ\œ™[xà ‰Ùš[š\Úxà Ù]Ù]Ù]‚ˆ]ˆÛ\ÜÏHœXÙK[Y]šXÜÈ‚ˆ]ˆÛ\ÜÏHœXÙK[Y]šXÈÜ[‘‘HUQTÕ9a¡xàk¹«¢øà¢¹ki¹ïäºaãÏÜÜ[‰ÓX]˜ÙZ[
œ™[XZ[š[™ËÍŒ
_y¦`ºe¤ÏØÙ]‚ˆ]ˆÛ\ÜÏHœXÙK[Y]šXÈÜ[¹oáz) xàæ¸àï8à®OÜÜ[‰ÓX]˜ÙZ[
œ™\]Z\™Y
_yb!‹ù¥éOØÙ]‚ˆ]ˆÛ\ÜÏHœXÙK[Y]šXÈÜ[¹ãï¹g*8àæ¸àï8à®{ï"9k£9.¡¹£æùë¥ûï"OÜÜ[‰ÓX]œ›Ý[™
˜Ý\œ™[XÙJ_yb!‹ù¥éOØÙ]‚ˆ]ˆÛ\ÜÏHœXÙK[Y]šXÈÜ[¹.â¹¥éxàk¹æë¹ª&OÜÜ[‰Ü™Y™™XÝ]™_yb!ØÙ]‚ˆÙ]‚ˆ]ˆÛ\ÜÏHœXÙK\›Ú™XÝ[Ûˆ¹k£9.¡º)¢ú/¯8àoûï&Øˆ	Ùš[š\ÚIÜœÛXÚÏLØ;ï":*iºj$ù¥éxàk¹í!	ÜœÛXÚßy¥éybc{ï"X˜;ï":*iºj$ù¥éxà¢8à¢¹í!	ÓX]˜XœÊœÛXÚÊ_y¥éz`axà£;ï"XOÙ]‚ˆ]ˆÛ\ÜÏHœXÙKXY\ÝY[‰ØYŸOÙ]‚ˆ	È\˜Ø[”™XÛÝ™\‰‰œœ™[XZ[š[™ÏŒØ]ˆÛ\ÜÏHœXÙK[›ÝHŒy¥éLLŒ9b!¸àiú`,¸à xàgùh-9d"8àiøà ¸à y§ 9çëyk£9.¡¹æë¹k¢xàkÈ	ÜXÙQ]U^
›X^]J_H8àe8à£xàiøàfxà Ù]˜‰ÉßBˆ]ˆÛ\ÜÏHœXÙK[›ÝH¸àdøàk¹b)9k¦¸àkÑ‘HUQTÕ9a¡xàk¹£ª9ij8àèxàâøàéxàï8à¤¹í`¸àb8à¢øàgøà xàk¹æë¹k¢xàiøà yd"9¨/9cëú ïy )øàgxàk¸à ¸àk¸àiøàkøà`¸à¢¸ào¸àføà¤øà Ù]‚ˆÙ]˜ÂŸB™[˜Ý[Ûˆ™[™\[ØØ][ÛŠ
^ÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	Ü[[ØØ][Û‰ÊNÚYŠ\›ÛÝ
\™]\›ŽÂˆÛÛœÝÝ[YY™™XÝ]™TÝYSZ[]\Ê
KY^[TXÙTÝ]\Ê
KO]\ÚÐ[ØØ][ÛŠÝ[
NÂˆÛÛœÝ\\HH\\\ŽÂˆÛÛœÝ\ÜÛÛ“X™[]\\‰‰œ™^\ÏLÏÉù¥è¹ïä¸àk¹o,yà®z(ç9o-ÉÎœš\Ñ^[I‰œ™^\ÏLÌÉùo,yà®yki¹ïä‰Î‰ù¥¬:)£ùki¹ïä‰ÎÂˆÛÛœÝ›ÜÜÓX™[]\\‰‰œ™^\ÏOOLÉøà©¸àªxàï8àè8à¨¸ààøàåÉÎœš\Ñ^[I‰œ™^\ÏLMÉùíãùd"8ààxà©øààøà«ÉÎ‰ùíãùd"8ààxà©øààøà«ÉÎÂˆÛÛœÝ][\ÏVÖÉü'éè	Ë	ùoªyïä‰ËKœ™]šY]×KÉü'äæ	Ë\ÜÛÛ“X™[K›\ÜÛÛ—KÉü'ä®ÉË	ùéäyæë‰ËKœÝXš™XÝ—KÉü'ädIË›ÜÜÓX™[K˜›ÜÜ×WK™š[\ŠOžÌ—OŒ
NÂˆÛÛœÝ›ÝOYØÝ[Y[™Ù][[Y[žRY
	Ø[ØØ][Û”XÙS›ÝIÊNÂˆYŠ›ÝJ^ÂˆYŠ\\Š[›ÝKš[›™\’SX]ˆÛ\ÜÏHœXÙK\\ÙKX˜[›™\ˆ‰Üœ\ÙKšXÛÛŸH	Üœ\ÙK›˜[Y_OØ¸à 9.â¹¥éxàk¹£ª9ij	ÝÝ[yb!¸à ¹«¢øà¢‰Ü™^\ßy¥éxàiøàkøà y§*¹k£9.¡ºaãøà¤º/ïxàa9£¦øàdxàf¹¥¬:)£ùki¹ïä¸à¤¹«­zf£¹æ¡8àjù«h¸à xào¸àfxà Ù]˜Âˆ[ÙH›ÝKš[›™\’S\š\Ñ^[I‰ˆ\™^\™YØ]ˆÛ\ÜÏHœXÙK\\ÙKX˜[›™\ˆ‰Üœ\ÙKšXÛÛŸH	Üœ\ÙK›˜[Y_OØ¸à 9.â¹¥éxàk¹æë¹ª&H	ÝÝ[yb!¸à º*iºj$ù¥éxàc:/äxàixàcøànøàjxà y¥¬:)£ùki¹ïä¸à¤¹®&øà¢xàeøài¹oªyïä¸àîùéäyæë¸àîùk§ù¢)¹è®º*£xàn:acyb!¸à¤¹ká8àføào¸àfxà Ù]˜‰ùª&y®¥¹ki¹ïä¹¦`ºe¤øà¤8ài8àk¹ki¹ïä¹§¨8àjúacyb!¸àeøào¸àfxà ‰ÎÂˆBˆ›ÛÝš[›™\’SZ][\Ë›X\
O˜]ˆÛ\ÜÏHœ[›™\‹\›ÝÈ]ˆÝ[OH™›Û\Ú^™NŒŒ\‰ÞÌ_OÙ]]ˆÛ\ÜÏHœ[›™\‹\›ÝËXÛÜH]ˆÛ\ÜÏHœ[›™\‹[X™[‰ÞÌW_OÙ]Ù]‰ÞÌ—_yb!ØÙ]˜
Kš›Ú[Š	ÉÊNÂŸB™[˜Ý[Ûˆ™[™\”[‘›ØÝ\Ê
^ÂˆÛÛœÝ]OYØÝ[Y[™Ù][[Y[žRY
	Ü[‘›ØÝ\Õ]IÊK\ØÏYØÝ[Y[™Ù][[Y[žRY
	Ü[‘›ØÝ\Ñ\ØÉÊKXÝ[ÛYØÝ[Y[™Ù][[Y[žRY
	Ü[‘›ØÝ\ÐXÝ[Û‰ÊKXÛÛYØÝ[Y[™Ù][[Y[žRY
	Ü[‘›ØÝ\ÒXÛÛ‰ÊNÂˆYŠ]]_Y\ØßXXÝ[ÛŠ\™]\›ŽÂˆÛÛœÝ™XÏYÙ]Z[T™XÛÜ™

K\ÚÜÏY[œÝ\™UÙ^T[”Û˜\ÚÝ

NÂˆÛÛœÝÛ™O]\ÚÜË™š[\ŠO™Z[U\ÚÑÛ™J™XË
JK›[™Ý™^]\ÚÜË™š[™
OˆYZ[U\ÚÑÛ™J™XË
JNÂˆYŠ™^
^Ý]K^ÛÛ[X	ÙÛ™_KÉÝ\ÚÜË›[™Ýyk£9.¡¸àîù«(xàkøà#	Û™^]_xà#XÙ\ØË^ÛÛ[X9.â¹¥éxàkº*"9å.øàk¹«¢øà¢¸à¤¹a*¹ab8àeøào¸àfxà ¹æë¹k¢H	Û™^›Z[]\ßyb!¸à ˜ÚXÛÛ‹^ÛÛ[[™^šXÛÛŸ	ü'äáIÎØXÝ[Û‹^ÛÛ[Iù«(xà¤¹iâøà xà¢È8¡¤‰ÎØXÝ[Û‹™\ØX›YY˜[ÙNØXÝ[Û‹›Û˜ÛXÚÏJ
OO›][˜ÚZ[U\ÚÊ™^
NßBˆ[Ù^Ý]K^ÛÛ[Iù.â¹¥éxàkº*"9å.øàkùk£9.¡¸àeøài¸àa8ào¸àfIÎÙ\ØË^ÛÛ[Iú/ïyb¨8àiú*l8à z/¯8ào¸àf¸à yoáz) xàj¸à¢y¯%9ïä¸à¡9b!¹§¤8à¤¹è®º*£xàiøàcxào¸àfxà ‰ÎÚXÛÛ‹^ÛÛ[Iø§$ÉÎØXÝ[Û‹^ÛÛ[Iøàæøàï8àè8àn8¡¤‰ÎØXÝ[Û‹™\ØX›YY˜[ÙNØXÝ[Û‹›Û˜ÛXÚÏJ
OOœÚÝÔØÜ™Y[Š	ÚÛYIÊNßBŸB™[˜Ý[Ûˆ™[™\”[›™\”ØÜ™Y[Š
^ÂˆÛÛœÝZ[œÏYØÝ[Y[™Ù][[Y[žRY
	ÜÝYSZ[]\ÔÙ][™ÉÊK]OYØÝ[Y[™Ù][[Y[žRY
	Ù^[Q]TÙ][™ÉÊK]]ÏYØÝ[Y[™Ù][[Y[žRY
	Ø]]ÔXÙTÙ][™ÉÊNÂˆYŠZ[œÊ[Z[œË˜[YOTÝš[™Ê›Ùš[KœÙ][™ÜËœÝYSZ[]\ßŒ
NÚYŠ]JY]K˜[YO\›Ùš[KœÙ][™ÜË™^[Q]_	ÉÎÚYŠ]]ÊX]]Ë˜ÚXÚÙY\›Ùš[KœÙ][™ÜË˜]]ÔXÙHOOY˜[ÙNÂˆ™[™\”›ØYX\

NÜ™[™\•ÙYZÐÚ\

NÜ™[™\”™XY[™\ÜÊ
NÜ™[™\ÛÝ[ÝÛŠ
NÜ™[™\‘^[TXÙJ
NÜ™[™\[ØØ][ÛŠ
NÜ™[™\‘Z[T[Š
NÜ™[™\”[‘›ØÝ\Ê
NÂˆØÝ[Y[™Ù][[Y[žRY
	Ù^[TXÙPØ\™	ÊOË˜Û\ÜÓ\ÝÙÙÛJ	ÚY[‹XžK\[‰Ë\›Ùš[KœÙ][™ÜË™^[Q]JNÂŸB‚™ØÝ[Y[™Ù][[Y[žRY
	ÜØ]™T[”Ù][™ÜÉÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOžÂˆ›Ùš[KœÙ][™ÜËœÝYSZ[]\ÏS[X™\ŠØÝ[Y[™Ù][[Y[žRY
	ÜÝYSZ[]\ÔÙ][™ÉÊK˜[YJ_ŒÂˆ›Ùš[KœÙ][™ÜË™^[Q]OYØÝ[Y[™Ù][[Y[žRY
	Ù^[Q]TÙ][™ÉÊK˜[Y_	ÉÎÂˆ›Ùš[KœÙ][™ÜË˜]]ÔXÙOHHYØÝ[Y[™Ù][[Y[žRY
	Ø]]ÔXÙTÙ][™ÉÊOË˜ÚXÚÙYÂˆØ]™T›Ùš[J
NÂˆ™XZ[Ù^T[”™\Ù\š[™ÑÛ™J
NÂˆ™[™\”[›™\”ØÜ™Y[Š
NØÛÛœÝY^[TXÙTÝ]\Ê
NÂˆÜØ\Ý
š\Ñ^[I‰ˆ\™^\™YØ9ki¹ïäº*"9å.øà¤¹/çykf8àeøào¸àeøàgøàîù§*¹k£9.¡¹b!¸à¤¹a£yíê9¢$8àeøào¸àeøàgØ‰ùki¹ïäº*"9å.øà¤¹/çykf8àeøào¸àeøàgøàîù§*¹k£9.¡¹b!¸à¤¹a£yíê9¢$8àeøào¸àeøàgÈ8§$ÉÊNÂŸJNÂ™ØÝ[Y[™Ù][[Y[žRY
	Ü™XZ[Ù^T[‰ÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOžÂˆ™XZ[Ù^T[”™\Ù\š[™ÑÛ™J
NÂˆ™[™\”[›™\”ØÜ™Y[Š
NÂˆÜØ\Ý
	ùk£9.¡¹®"8àoøà¤¹«¢øàeøài¸à y.â¹¥éxàk¹§*¹k£9.¡¹b!¸à¤¹a£yíê9¢$8àeøào¸àeøàgÈ8§$ÉÊNÂŸJNÂ‚‹ËÈÙY\[[›™\ˆRH[ˆÞ[˜ÈÚ[ˆ›Ùš[H]HÚ[™Ù\Ë‚˜ÛÛœÝÜ™Yœ™\Ú›Ùš[URWÝŒL\™Yœ™\Ú›Ùš[URNÂœ™Yœ™\Ú›Ùš[UROY[˜Ý[ÛŠ
^ÂˆÜ™Yœ™\Ú›Ùš[URWÝŒL

NÂˆ™[™\‘Z[T[Š
NÂˆ™[™\”[›™\”ØÜ™Y[Š
NÂŸNÂ‚™[˜Ý[ÛˆÙ][‘]Z[ÓÜ[ŠÜ[Š^ÂˆÛÛœÝØÜ™Y[YØÝ[Y[™Ù][[Y[žRY
	Ü[‰ÊKYØÝ[Y[™Ù][[Y[žRY
	Ü[‘]Z[ÕÙÙÛIÊNÂˆYŠ\ØÜ™Y[ŸXŠ\™]\›ŽÂˆØÜ™Y[‹˜Û\ÜÓ\ÝÙÙÛJ	Ü[‹XÛÛ\XÝ	Ë[Ü[ŠNÂˆ‹œÙ]]šX]J	Ø\šXKY^[™Y	ËÝš[™ÊH[Ü[ŠJNÂˆ‹^ÛÛ[[Ü[Éú`,¹£eøàîú*+yk¦¸àkº*lùí,8à¤ºe¢xàf8à¢ÉÎ‰ú`,¹£eøàîú*+yk¦¸àkº*lùí,8à¤º(j9é.‰ÎÂŸB™[˜Ý[ÛˆÜ[”[‘]Q›ÛŒÍLŠ
^ÂˆÙ][‘]Z[ÓÜ[ŠYJNÂˆÛÛœÝ›ÛYØÝ[Y[™Ù][[Y[žRY
	Ü[‘]Q›Û	ÊNÂˆYŠ›Û
Y›Û›Ü[]YNÂŸBœÙ][‘]Z[ÓÜ[Š˜[ÙJNÂ™ØÝ[Y[™Ù][[Y[žRY
	Ü[‘]Z[ÕÙÙÛIÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOžÂˆÙ][‘]Z[ÓÜ[ŠØÝ[Y[™Ù][[Y[žRY
	Ü[‰ÊOË˜Û\ÜÓ\Ý˜ÛÛZ[œÊ	Ü[‹XÛÛ\XÝ	ÊJNÂŸJNÂ‚‹ËÈŒLMÎˆ[RH[š]X[^˜][Ûˆ\ÈY™\œ™Y[[H[™ÙˆH[™K‚‹ËÈ]\ˆ[Ù[\È
ÙXZÛ™\ÜËÔžÔÐJHÝ[XÛ\™H\[™[˜ÚY\ÈY\ˆ\ÈÚ[‚‚‚‹ËÈOOOOH^[H\™XHÛÝ™\˜YÙHOOOOB˜ÛÛœÝVSWÐT‘PWÐÓÕ‘TQÑHHÂˆÚXÛÛŽ‰ü'å(‰Ë]N‰ùgî¹é#¹ä!º*å‰ËYÎÓÔ‘WÐWÒQË™š[\ŠYO“TÔÓÓ”ÖÚYKœÚÚ[OOIùgî¹é#¹ä!º*å‰Ê_KˆÚXÛÛŽ‰ü'éêIË]N‰øà¨¸àêøà­8àê¸à®¸àè8àîøàåøàëxà¬8àêxàçøàìøà¬	ËYÎÓÔ‘WÐWÒQË™š[\ŠYO“TÔÓÓ”ÖÚYKœÚÚ[OOIøà¨¸àêøà­8àê¸à®¸àè	Ê_KˆÚXÛÛŽ‰ø¦¦{î#ÉË]N‰øà¬øàìøàå8àéxàï8à¯øàîøà­øà®xàá¸àè	ËYÎÓÔ‘WÐWÒQË™š[\ŠYO“TÔÓÓ”ÖÚYKœÚÚ[OOIøà¬øàìøàå8àéxàï8à¯ÉÊ_KˆÚXÛÛŽ‰ü'åàûî#ÉË]N‰øàáøàï8à¯øàæxàï8à®IËYÎÓÔ‘WÐWÒQË™š[\ŠYO“TÔÓÓ”ÖÚYKœÚÚ[OOIøàáøàï8à¯øàæxàï8à®IÊ_KˆÚXÛÛŽ‰ü'ã$	Ë]N‰øàãxààøàâ8àëøàï8à«ÉËYÎÓÔ‘WÐWÒQË™š[\ŠYO“TÔÓÓ”ÖÚYKœÚÚ[OOIøàãxààøàâ8àëøàï8à«ÉÊ_KˆÚXÛÛŽ‰ü'æè{î#ÉË]N‰ù áyh,xà®øà«xàéxàê¸àá¸à¨ÉËYÎÓÔ‘WÐWÒQË™š[\ŠYO“TÔÓÓ”ÖÚYKœÚÚ[OOIøà®øà«xàéxàê¸àá¸à¨ÉÊ_KˆÚXÛÛŽ‰ü'äâÉË]N‰úe¢ùæn¸àîøàç¸àãxà®8àèxàìøàâ	ËYÎÓÔ‘WÐWÒQË™š[\ŠYO“TÔÓÓ”ÖÚYKœÚÚ[OOIøàç¸àãxà®8àèxàìøàâ	Ê_KˆÚXÛÛŽ‰ü'äâ	Ë]N‰øà®xàâ8àêxàá¸à®8àîù/ y©kxàîù¬åybæIËYÎÓÔ‘WÐWÒQË™š[\ŠYO“TÔÓÓ”ÖÚYKœÚÚ[OOIøà®xàâ8àêxàá¸à®	Ê_KˆÚXÛÛŽ‰ü'ä®ÉË]N‰ùéäyæë‰ËÜXÚX[‰Ø‰ßB—NÂ‚™[˜Ý[Ûˆ^[P\™XT›ÙÜ™\ÜÊ\™XJ^ÂˆYŠ\™XKœÜXÚX[OOIØ‰Ê^ÂˆÛÛœÝO[Øš™XÝÛÛ\][ÛŠ›Ùš[K˜”›ÙÜ™\ÜË—ÑVTÒTÑTË›[™Ý
NÂˆÛÛœÝÏ[Øš™XÝÛÛ\][ÛŠ›Ùš[KœÙXÝ\š]P”›ÙÜ™\ÜËÑPÕT’UWÔÐÑST’SÔË›[™Ý
NÂˆ™]\›ˆX]œ›Ý[™

JÜÊKÌŠNÂˆBˆÛÛœÝ˜[YJ\™XKšYß×JK™š[\ŠYO“TÔÓÓ”ÖÚYJNÂˆYŠ]˜[Y›[™Ý
H™]\›ˆÂˆ™]\›ˆX]œ›Ý[™
˜[Yœ™YXÙJ
Ý[KY
OOœÝ[JÊ›Ùš[K›\ÜÛÛ”›ÙÜ™\ÜÏË–ÚY_
K
KÝ˜[Y›[™Ý
NÂŸB™[˜Ý[Ûˆ™[™\ÛÝ™\˜YÙJ
^ÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	ØÛÝ™\˜YÙQÜšY	ÊNÂˆYŠ\›ÛÝ
H™]\›ŽÂˆ›ÛÝš[›™\’SIÉÎÂˆÛÛœÝ˜[ÏV×NÂˆVSWÐT‘PWÐÓÕ‘TQÑK™›Ü‘XXÚ
\™XOOžÂˆÛÛœÝÝY^[P\™XT›ÙÜ™\ÜÊ\™XJNÈ˜[Ëœ\Ú
Ý
NÂˆÛÛœÝYØÝ[Y[˜Ü™X]Q[[Y[
	Ù]‰ÊNÂˆ˜Û\ÜÓ˜[YOIØÛÝ™\˜YÙKXÚ\\‰ÎÂˆš[›™\’SX]ˆÛ\ÜÏH˜ÛÝ™\˜YÙKXÚ[[HˆÝ[OH™›Û\Ú^™NŒŒ‰Ø\™XKšXÛÛŸOÙ]‚ˆ]]ˆÛ\ÜÏH˜ÛÝ™\˜YÙKXÚ]]H‰Ø\™XK]_OÙ]]ˆÛ\ÜÏH˜ÛÝ™\˜YÙKXÚ\ÝXˆ‰Ø\™XKœÜXÚX[OOIØ‰ÏÉøàâ8àë8àï8à®HÈ8à®øà«xàéxàê¸àá¸à¨ù¯%9ïä‰Î‰ùkï¹oç8àá¸àï8àçˆ	ÊÊ\™XKšYß×JK›[™Ý
Éù§+	ßOÙ]‚ˆ]ˆÛ\ÜÏHœ›ÙÜ™\ÜÈˆÝ[OHšZYÚŽÛX\™Ú[‹]ÜÜ]ˆÝ[OHÚY‰ÜÝIHÙ]Ù]Ù]‚ˆ]ˆÛ\ÜÏH˜ÛÝ™\˜YÙKXÚ\Ý‰ÜÝIOÙ]˜Âˆ›ÛÝ˜\[™Ú[

NÂˆJNÂˆÛÛœÝÝ™\˜[SX]œ›Ý[™
˜[Ëœ™YXÙJ
KŠOO˜JØ‹
KÓX]›X^
K˜[Ë›[™Ý
JNÂˆØÝ[Y[™Ù][[Y[žRY
	ØÛÝ™\˜YÙSÝ™\˜[	ÊK^ÛÛ[[Ý™\˜[
ÉÉIÎÂŸB‚˜ÛÛœÝÜ™Yœ™\Ú›Ùš[URWÝŒL\™Yœ™\Ú›Ùš[URNÂœ™Yœ™\Ú›Ùš[UROY[˜Ý[ÛŠ
^ÂˆÜ™Yœ™\Ú›Ùš[URWÝŒLŠ
NÂˆ™[™\ÛÝ™\˜YÙJ
NÂŸNÂœ™[™\ÛÝ™\˜YÙJ
NÂ‚‚‚‹ËÈOOOOHŒLÎˆÝXš™XÝH[[ØÚÈ^[HOOOOBšYŠ\›Ùš[K›[ØÚÒ\ÝÜžJH›Ùš[K›[ØÚÒ\ÝÜžOV×NÂšYŠ\›Ùš[K›[ØÚÔ]Y\Ý[Û”Ý]ÊH›Ùš[K›[ØÚÔ]Y\Ý[Û”Ý]Ï^ßNÂ”UQTÕSÓ—ÐS’Ë™›Ü‘XXÚ
OOžÂˆYŠ\›Ùš[K›[ØÚÔ]Y\Ý[Û”Ý]ÖÜKšYJ^Âˆ›Ùš[K›[ØÚÔ]Y\Ý[Û”Ý]ÖÜKšYO^ÜÙY[ŽŒÛÜœ™XÝŒ\ÝÙY[Ž›[NÂˆBŸJNÂœØ]™T›Ùš[J
NÂ‚›][ØÚÒ][\ÏV×NÂ›][ØÚÐ[œÝÙ\œÏV×NÂ›][ØÚÑ›YÜÏV×NÂ›][ØÚÒ[™^LÂ›][ØÚÓ[ÙOIÙ[	ÎÂ›][ØÚÔÙXÛÛ™ÏLÂ›][ØÚÒ[š]X[ÙXÛÛ™ÏLÂ›][ØÚÕ[Y\’[™O[[Â›][ØÚÔÝ\Y][[Â›][ØÚÓ\Ý[ÙOIÙ[	ÎÂ›][ØÚÔ]Y\Ý[Û”ÙXÛÛ™ÏV×NÂ›][ØÚÔ]Y\Ý[Û‘[\™Y][[Â›]\Ý[ØÚÐ][\[[Â›]™]šY]Ò][\ÏV×NÂ›]™]šY]Ò[™^LÂ›]Ý\œ™[Ú[Z[\[[Â‚‚™[˜Ý[Ûˆ˜[™ÛZ^™S[ØÚÔ]Y\Ý[ÛŠJ^ÂˆÛÛœÝ[™^Y\K›Ü[ÛœË›X\

^JOOŠÝ^ÛÜœ™XÝšOOO\K˜_JJNÂˆÛÛœÝZ^Y\ÚY™›Y
[™^Y
NÂˆ™]\›ˆÂˆ‹‹œKˆÜ[ÛœÎ›Z^Y›X\
Ož^
KˆN›Z^Y™š[™[™^
Ož˜ÛÜœ™XÝ
KˆÛÝ\˜ÙRYœKšYˆNÂŸB™[˜Ý[Ûˆ™XÛÜ™[ØÚÔ]Y\Ý[Û•[YJ
^ÂˆYŠ[ØÚÔ]Y\Ý[Û‘[\™Y]OO[[[[ØÚÔ]Y\Ý[Û”ÙXÛÛ™Ë›[™Ý
H™]\›ŽÂˆÛÛœÝ›ÝÏQ]K››ÝÊ
NÂˆÛÛœÝ[OSX]›X^
X]œ›Ý[™

›ÝË[[ØÚÔ]Y\Ý[Û‘[\™Y]
KÌL
JNÂˆ[ØÚÔ]Y\Ý[Û”ÙXÛÛ™ÖÛ[ØÚÒ[™^OJ[ØÚÔ]Y\Ý[Û”ÙXÛÛ™ÖÛ[ØÚÒ[™^_
JÙ[NÂˆ[ØÚÔ]Y\Ý[Û‘[\™Y][›ÝÎÂŸB‚˜ÛÛœÝSÐÒ×ÐÐUQÓÔ’QTÏVÉùgî¹é#¹ä!º*å‰Ë	øà¬øàìøàå8àéxàï8à¯ÉË	øàáøàï8à¯øàæxàï8à®IË	øàãxààøàâ8àëøàï8à«ÉË	øà®øà«xàéxàê¸àá¸à¨ÉË	øà¨¸àêøà­8àê¸à®¸àè	Ë	øàç¸àãxà®8àèxàìøàâ	Ë	øà®xàâ8àêxàá¸à®	×NÂ˜ÛÛœÝSÐÒ×ÑQ‘’PÕSWÓU‘SÏVÉùgî¹é#‰Ë	ùª&y®¥‰Ë	ùk§ù¢)‰×NÂ˜ÛÛœÝSÐÒ×ÐÓÑÓ’UU‘WÓU‘SÏVÉù ìú-mÉË	ú`jyå*	Ë	ùb)9¥«I×NÂ˜ÛÛœÝSÐÒ×Ð“QT’S•Ï^Âˆ[žØÛÝ[Œ˜\ÚXÎŒMKÝ[™\™ŒÌ˜XÝXØ[ŒMK[YNŽL
ŒÛÙÛš]]™NžÉù ìú-mÉÎŒMK	ú`jyå*	ÎŒŽK	ùb)9¥«IÎŒMŸ_Kˆ[ŽžØÛÝ[ŒÌ˜\ÚXÎŽÝ[™\™ŒM˜XÝXØ[Ž[YNJŒÛÙÛš]]™NžÉù ìú-mÉÎŽ	ú`jyå*	ÎŒLË	ùb)9¥«IÎŽ__BŸNÂ›][ØÚÐÝ\œ™[›Y\š[[[Â‚™[˜Ý[Ûˆ[ØÚÐØ]YÛÜžT][Ý\ÊÛÝ[
^ÂˆÛÛœÝ˜\ÙOSX]™›ÛÜŠÛÝ[ÓSÐÒ×ÐÐUQÓÔ’QTË›[™Ý
NÂˆÛÛœÝ™[OXÛÝ[	SSÐÒ×ÐÐUQÓÔ’QTË›[™ÝÂˆÛÛœÝÝ\J›Ùš[K›[ØÚÒ\ÝÜžOË›[™Ý
ISSÐÒ×ÐÐUQÓÔ’QTË›[™ÝÂˆÛÛœÝOSØš™XÝ™œ›ÛQ[šY\ÊSÐÒ×ÐÐUQÓÔ’QTË›X\
ÏO–ØË˜\ÙWJJNÂˆ›ÜŠ]OLÚO™[NÚJÊÊHVÓSÐÒ×ÐÐUQÓÔ’QTÖÊÝ\
ÚJISSÐÒ×ÐÐUQÓÔ’QTË›[™ÝWJÊÎÂˆ™]\›ˆNÂŸB™[˜Ý[Ûˆ[ØÚÔÙY[ŠJ^Âˆ™]\›ˆ›Ùš[K›[ØÚÔ]Y\Ý[Û”Ý]ÏË–ÜKšYOËœÙY[ŸÂŸB™[˜Ý[Ûˆ[ØÚÓ\ÝÙY[ŠJ^Âˆ™]\›ˆ›Ùš[K›[ØÚÔ]Y\Ý[Û”Ý]ÏË–ÜKšYOË›\ÝÙY[Ÿ	ÉÎÂŸB™[˜Ý[Ûˆ[ØÚÐØ[™Y]TÛÜ
KŠ^ÂˆÛÛœÝØO[[ØÚÔÙY[ŠJKØ[[ØÚÔÙY[ŠŠNÂˆYŠØHOO\ØŠ\™]\›ˆØK\ØŽÂˆÛÛœÝO[[ØÚÓ\ÝÙY[ŠJK[[ØÚÓ\ÝÙY[ŠŠNÂˆYŠHOO[Š\™]\›ˆK›ØØ[PÛÛ\\™JŠNÂˆ™]\›ˆX]œ˜[™ÛJ
KKNÂŸB™[˜Ý[Ûˆ[ØÚÐÛÙÛš]]™T™Y™\™[˜ÙJY™šXÝ[J^ÂˆYŠY™šXÝ[OOOIùgî¹é#‰Ê\™]\›ˆÉù ìú-mÉË	ú`jyå*	Ë	ùb)9¥«I×NÂˆYŠY™šXÝ[OOOIùª&y®¥‰Ê\™]\›ˆÉú`jyå*	Ë	ùb)9¥«IË	ù ìú-mÉ×NÂˆ™]\›ˆÉùb)9¥«IË	ú`jyå*	Ë	ù ìú-mÉ×NÂŸB™[˜Ý[ÛˆXÚÓ[ØÚÔÛÛ
ÛÛ‹ÛÛ˜Ù\ÛÝ[ËÛÛ˜Ù\Ø\ÛÙÛš]]™PÛÝ[ËÛÙÛš]]™U\™Ù]Y™šXÝ[J^ÂˆÛÛœÝ™Y[[ØÚÐÛÙÛš]]™T™Y™\™[˜ÙJY™šXÝ[JNÂˆÛÛœÝÚÜÙ[V×NÂˆÛÛœÝ\ÙY[™]ÈÙ]

NÂ‚ˆÛÛœÝ˜[šÙYJ™\ÜXÝØ\
OOžÂˆÛÛœÝØ[™Y]\Ï\ÛÛ™š[\ŠOOžÂˆYŠ\ÙYš\ÊKšY
J\™]\›ˆ˜[ÙNÂˆÛÛœÝÙ^OX	ÜK˜Ø]NŽ‰ÜK˜ÛÛ˜Ù\XÂˆ™]\›ˆ\™\ÜXÝØ\
ÛÛ˜Ù\ÛÝ[ÖÚÙ^W_
OÛÛ˜Ù\Ø\ÂˆJNÂˆ™]\›ˆØ[™Y]\ËœÛÜ

KŠOOžÂˆÛÛœÝ\JÛÙÛš]]™PÛÝ[ÖØK˜ÛÙÛš]]™S]™[_
O
ÛÙÛš]]™U\™Ù]ØK˜ÛÙÛš]]™S]™[_
NÂˆÛÛœÝœJÛÙÛš]]™PÛÝ[ÖØ‹˜ÛÙÛš]]™S]™[_
O
ÛÙÛš]]™U\™Ù]Ø‹˜ÛÙÛš]]™S]™[_
NÂˆYŠ\ˆOOXœŠ\™]\›ˆ\ËLNŒNÂˆÛÛœÝ\\™Y‹š[™^ÙŠK˜ÛÙÛš]]™S]™[
Kœ\™Y‹š[™^ÙŠ‹˜ÛÙÛš]]™S]™[
NÂˆYŠ\OOXœ
\™]\›ˆ\XœÂˆ™]\›ˆ[ØÚÐØ[™Y]TÛÜ
KŠNÂˆJNÂˆNÂ‚ˆÛÛœÝZÙO\OOžÂˆÚÜÙ[‹œ\Ú
JNÝ\ÙY˜Y
KšY
NÂˆÛÛœÝÙ^OX	ÜK˜Ø]NŽ‰ÜK˜ÛÛ˜Ù\XÂˆÛÛ˜Ù\ÛÝ[ÖÚÙ^WOJÛÛ˜Ù\ÛÝ[ÖÚÙ^W_
JÌNÂˆÛÙÛš]]™PÛÝ[ÖÜK˜ÛÙÛš]]™S]™[OJÛÙÛš]]™PÛÝ[ÖÜK˜ÛÙÛš]]™S]™[_
JÌNÂˆNÂ‚ˆÚ[JÚÜÙ[‹›[™ÝŠ^Âˆ]Ø[™Y]\Ï\˜[šÙY
YJNÂˆYŠXØ[™Y]\Ë›[™Ý
XØ[™Y]\Ï\˜[šÙY
˜[ÙJNÂˆYŠXØ[™Y]\Ë›[™Ý
Xœ™XZÎÂˆZÙJØ[™Y]\ÖÌJNÂˆBˆ™]\›ˆÚÜÙ[ŽÂŸB‚™[˜Ý[Ûˆ[ØØ]S[ØÚÑY™šXÝ[PžPØ]YÛÜžJ][Ý\Ëœ
^ÂˆÛÛœÝ™\Ý[SØš™XÝ™œ›ÛQ[šY\ÊSÐÒ×ÐÐUQÓÔ’QTË›X\
ÏO–ØËÉùgî¹é#‰ÎŒ	ùª&y®¥‰ÎŒ	ùk§ù¢)‰ÎŒWJJNÂ‚ˆÛÛœÝ\ÜÚYÛJ]™[Ý[
OOžÂˆ›ÜŠ]ÏLÚÏÝ[ÚÊÊÊ^ÂˆÛÛœÝØ[™Y]\ÏSSÐÒ×ÐÐUQÓÔ’QTË™š[\ŠØ]OžÂˆÛÛœÝ\ÜÚYÛ™YSØš™XÝ˜[Y\Ê™\Ý[ØØ]JKœ™YXÙJ
KŠOO˜JØ‹
NÂˆÛÛœÝ]˜Z[X›OTUQTÕSÓ—ÐS’Ë™š[\ŠOOœK˜Ø]OOXØ]	‰œK™Y™šXÝ[OOO[]™[
K›[™ÝÂˆ™]\›ˆ\ÜÚYÛ™Y][Ý\ÖØØ]H	‰ˆ™\Ý[ØØ]VÛ]™[O]˜Z[X›NÂˆJKœÛÜ

KŠOOžÂˆÛÛœÝ˜O\™\Ý[ØWVÛ]™[KÓX]›X^
K][Ý\ÖØWJNÂˆÛÛœÝ˜\™\Ý[Ø—VÛ]™[KÓX]›X^
K][Ý\ÖØ—JNÂˆ™]\›ˆ˜K\˜ˆSÐÒ×ÐÐUQÓÔ’QTËš[™^ÙŠJKSSÐÒ×ÐÐUQÓÔ’QTËš[™^ÙŠŠNÂˆJNÂˆYŠXØ[™Y]\Ë›[™Ý
Xœ™XZÎÂˆ™\Ý[ØØ[™Y]\ÖÌWVÛ]™[JÊÎÂˆBˆNÂ‚ˆËÈ™\Ù\™H˜XÝXØ[[™˜\ÚXÈ]Y\Ý[ÛœÈš\œÝÈš[H™[XZ[™\ˆÚ]Ý[™\™‚ˆ\ÜÚYÛŠ	ùk§ù¢)‰Ëœœ˜XÝXØ[
NÂˆ\ÜÚYÛŠ	ùgî¹é#‰Ëœ˜˜\ÚXÊNÂ‚ˆSÐÒ×ÐÐUQÓÔ’QTË™›Ü‘XXÚ
Ø]OžÂˆÛÛœÝ\ÜÚYÛ™Y\™\Ý[ØØ]VÉùk§ù¢)‰×JÜ™\Ý[ØØ]VÉùgî¹é#‰×NÂˆ™\Ý[ØØ]VÉùª&y®¥‰×OSX]›X^
][Ý\ÖØØ]KX\ÜÚYÛ™Y
NÂˆJNÂ‚ˆËÈYˆHØ]YÛÜžHXÚÜÈÝ[™\™]Y\Ý[ÛœË™\XÙHHÚÜYÙHÚ][›Ý\ˆ]˜Z[X›HY\‹‚ˆSÐÒ×ÐÐUQÓÔ’QTË™›Ü‘XXÚ
Ø]OžÂˆÛÛœÝÝ]˜Z[X›OTUQTÕSÓ—ÐS’Ë™š[\ŠOOœK˜Ø]OOXØ]	‰œK™Y™šXÝ[OOOIùª&y®¥‰ÊK›[™ÝÂˆYŠ™\Ý[ØØ]VÉùª&y®¥‰×O\Ý]˜Z[X›J\™]\›ŽÂˆ]ÚÜYÙO\™\Ý[ØØ]VÉùª&y®¥‰×K\Ý]˜Z[X›NÂˆ™\Ý[ØØ]VÉùª&y®¥‰×O\Ý]˜Z[X›NÂˆ›ÜŠÛÛœÝ]™[ÙˆÉùk§ù¢)‰Ë	ùgî¹é#‰×J^ÂˆÛÛœÝ]˜Z[X›OTUQTÕSÓ—ÐS’Ë™š[\ŠOOœK˜Ø]OOXØ]	‰œK™Y™šXÝ[OOO[]™[
K›[™ÝÂˆÛÛœÝ›ÛÛOSX]›X^
]˜Z[X›K\™\Ý[ØØ]VÛ]™[JNÂˆÛÛœÝYSX]›Z[Š›ÛÛKÚÜYÙJNÂˆ™\Ý[ØØ]VÛ]™[JÏXYÜÚÜYÙKOXYÂˆYŠÚÜYÙOL
Xœ™XZÎÂˆBˆJNÂ‚ˆ™]\›ˆ™\Ý[ÂŸB‚™[˜Ý[ÛˆZ[[ØÚÔ]Y\Ý[ÛœÊ[ÙSÜÛÝ[
^ÂˆÛÛœÝ[ÙO]\[Ùˆ[ÙSÜÛÝ[OOIÜÝš[™ÉÏÛ[ÙSÜÛÝ[Š[ÙSÜÛÝ[OOMŒÉÙ[	Î‰Ú[‰ÊNÂˆÛÛœÝœSSÐÒ×Ð“QT’S•ÖÛ[ÙW_SÐÒ×Ð“QT’S•Ë™[ÂˆÛÛœÝ][Ý\Ï[[ØÚÐØ]YÛÜžT][Ý\Êœ˜ÛÝ[
NÂˆÛÛœÝY™šXÝ[PžPØ]X[ØØ]S[ØÚÑY™šXÝ[PžPØ]YÛÜžJ][Ý\Ëœ
NÂˆÛÛœÝÛÛ˜Ù\ÛÝ[Ï^ßNÂˆÛÛœÝÛÙÛš]]™PÛÝ[Ï^Éù ìú-mÉÎŒ	ú`jyå*	ÎŒ	ùb)9¥«IÎŒNÂˆÛÛœÝÛÙÛš]]™U\™Ù]Xœ˜ÛÙÛš]]™_Éù ìú-mÉÎŒ	ú`jyå*	Î˜œ˜ÛÝ[	ùb)9¥«IÎŒNÂˆÛÛœÝÝ]V×NÂ‚ˆSÐÒ×ÐÐUQÓÔ’QTË™›Ü‘XXÚ
Ø]OžÂˆÛÛœÝØ\[[ÙOOOIÚ[‰ÏÌNŒŽÂˆSÐÒ×ÑQ‘’PÕSWÓU‘SË™›Ü‘XXÚ
]™[OžÂˆÛÛœÝYY™šXÝ[PžPØ]ØØ]VÛ]™[_ÂˆÛÛœÝÛÛTUQTÕSÓ—ÐS’Ë™š[\ŠOOœK˜Ø]OOXØ]	‰œK™Y™šXÝ[OOO[]™[
NÂˆÝ]œ\Ú
‹‹œXÚÓ[ØÚÔÛÛ
ÛÛ‹ÛÛ˜Ù\ÛÝ[ËØ\ÛÙÛš]]™PÛÝ[ËÛÙÛš]]™U\™Ù]]™[
JNÂˆJNÂˆJNÂ‚ˆÛÛœÝ[š\]YOV×NÂˆÛÛœÝÙY[’YÏ[™]ÈÙ]

NÂˆ›ÜŠÛÛœÝHÙˆÝ]
^ÂˆYŠ\ÙY[’YËš\ÊKšY
J^Ý[š\]YKœ\Ú
JNÜÙY[’YË˜Y
KšY
NßBˆBˆYŠ[š\]YK›[™Ýœ˜ÛÝ[
^Âˆ[š\]YKœ\Ú
‹‹”UQTÕSÓ—ÐS’Ë™š[\ŠOOˆ\ÙY[’YËš\ÊKšY
JKœÛÜ
[ØÚÐØ[™Y]TÛÜ
KœÛXÙJœ˜ÛÝ[][š\]YK›[™Ý
JNÂˆB‚ˆÛÛœÝXÚÙY\ÚY™›Y
[š\]YKœÛXÙJœ˜ÛÝ[
JNÂˆÛÛœÝÛÝ[Ï^ÂˆØ]YÛÜšY\Î“Øš™XÝ™œ›ÛQ[šY\ÊSÐÒ×ÐÐUQÓÔ’QTË›X\
ÏO–ØËXÚÙY™š[\ŠOOœK˜Ø]OOXÊK›[™ÝJJKˆY™šXÝ[N“Øš™XÝ™œ›ÛQ[šY\ÊSÐÒ×ÑQ‘’PÕSWÓU‘SË›X\
]™[O–Û]™[XÚÙY™š[\ŠOOœK™Y™šXÝ[OOO[]™[
K›[™ÝJJKˆÛÙÛš]]™N“Øš™XÝ™œ›ÛQ[šY\ÊSÐÒ×ÐÓÑÓ’UU‘WÓU‘SË›X\
]™[O–Û]™[XÚÙY™š[\ŠOOœK˜ÛÙÛš]]™S]™[OO[]™[
K›[™ÝJJKˆ[œÙY[ŽœXÚÙY™š[\ŠOO›[ØÚÔÙY[ŠJOOOL
K›[™ÝˆNÂˆ[ØÚÐÝ\œ™[›Y\š[^Û[ÙKÛÝ[˜œ˜ÛÝ[][Ý\ËY™šXÝ[PžPØ]ÛÝ[ßNÂˆ™]\›ˆXÚÙY›X\
˜[™ÛZ^™S[ØÚÔ]Y\Ý[ÛŠNÂŸB‚™[˜Ý[ÛˆÝ\[ØÚÊ[ÙJ^Âˆ[ØÚÓ[ÙO[[ÙNÂˆ[ØÚÓ\Ý[ÙO[[ÙNÂˆÛÛœÝœSSÐÒ×Ð“QT’S•ÖÛ[ÙW_SÐÒ×Ð“QT’S•Ë™[ÂˆÛÛœÝÛÝ[Xœ˜ÛÝ[Âˆ[ØÚÒ[š]X[ÙXÛÛ™ÏXœ[YNÂˆ[ØÚÔÙXÛÛ™Ï[[ØÚÒ[š]X[ÙXÛÛ™ÎÂˆ[ØÚÒ][\ÏXZ[[ØÚÔ]Y\Ý[ÛœÊ[ÙJNÂˆYŠ[ØÚÒ][\Ë›[™ÝÛÝ[
^ÂˆÜØ\Ý
9ecúhc9¥l8àc	Û[ØÚÒ][\Ë›[™Ýyecøàeøàbøàj¸àa8àgøà xà xàdøàk¹¥l8àiúe¢ùiâøàeøào¸àfX
NÂˆBˆ[ØÚÐ[œÝÙ\œÏP\œ˜^J[ØÚÒ][\Ë›[™Ý
K™š[
[
NÂˆ[ØÚÑ›YÜÏP\œ˜^J[ØÚÒ][\Ë›[™Ý
K™š[
˜[ÙJNÂˆ[ØÚÔ]Y\Ý[Û”ÙXÛÛ™ÏP\œ˜^J[ØÚÒ][\Ë›[™Ý
K™š[

NÂˆ[ØÚÒ[™^LÂˆ[ØÚÔÝ\Y]Q]K››ÝÊ
NÂˆ[ØÚÔ]Y\Ý[Û‘[\™Y]Q]K››ÝÊ
NÂ‚ˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÓY[IÊK˜Û\ÜÓ\Ý˜Y
	ÚY[‰ÊNÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÑ^[IÊK˜Û\ÜÓ\Ý˜Y
	ÜÚÝÉÊNÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔ™\Ý[	ÊK˜Û\ÜÓ\Ýœ™[[Ý™J	ÜÚÝÉÊNÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÑ^[U]IÊK^ÛÛ[[[ÙOOOIÙ[	ÏÉøàåxàêùª(z*i¸àîùéäyæëIÎ‰øàãøàï8àåyª(z*i¸àîùéäyæëIÎÂ‚ˆ™[™\“[ØÚÓ˜]šYØ]ÜŠ
NÂˆ™[™\“[ØÚÔ]Y\Ý[ÛŠ
NÂˆ\]S[ØÚÕ[Y\Š
NÂˆYŠ[ØÚÕ[Y\’[™JHÛX\’[\˜[
[ØÚÕ[Y\’[™JNÂˆ[ØÚÕ[Y\’[™O\Ù][\˜[


OOžÂˆ[ØÚÔÙXÛÛ™ÏSX]›X^
[ØÚÔÙXÛÛ™ËLJNÂˆ\]S[ØÚÕ[Y\Š
NÂˆYŠ[ØÚÔÙXÛÛ™ÏL
^ÂˆÛX\’[\˜[
[ØÚÕ[Y\’[™JNÂˆ[ØÚÕ[Y\’[™O[[Âˆš[š\Ú[ØÚÊYJNÂˆBˆKL
NÂŸB‚™ØÝ[Y[œ]Y\žTÙ[XÝÜ[
	ÖÙ]K[[ØÚË[[ÙWIÊK™›Ü‘XXÚ
OžÂˆ‹˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOœÝ\[ØÚÊ‹™]\Ù]›[ØÚÓ[ÙJJNÂŸJNÂ‚™[˜Ý[Ûˆ\]S[ØÚÕ[Y\Š
^ÂˆÛÛœÝOSX]™›ÛÜŠ[ØÚÔÙXÛÛ™ËÍŒ
NÂˆÛÛœÝÏ[[ØÚÔÙXÛÛ™ÉMŒÂˆÛÛœÝOYØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÕ[Y\‰ÊNÂˆYŠYJH™]\›ŽÂˆK^ÛÛ[X	ÔÝš[™ÊJKœYÝ\
‹	Ì	Ê_N‰ÔÝš[™ÊÊKœYÝ\
‹	Ì	Ê_XÂˆK˜Û\ÜÓ\ÝÙÙÛJ	ÝØ\›‰Ë[ØÚÔÙXÛÛ™ÏLMJŒ	‰ˆ[ØÚÔÙXÛÛ™ÏJŒ
NÂˆK˜Û\ÜÓ\ÝÙÙÛJ	Ù[™Ù\‰Ë[ØÚÔÙXÛÛ™ÏMJŒ
NÂŸB‚™[˜Ý[Ûˆ™[™\“[ØÚÓ˜]šYØ]ÜŠ
^ÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÓ˜]‘ÜšY	ÊNÂˆYŠ\›ÛÝ
H™]\›ŽÂˆ›ÛÝš[›™\’SIÉÎÂˆ[ØÚÒ][\Ë™›Ü‘XXÚ

KJOOžÂˆÛÛœÝYØÝ[Y[˜Ü™X]Q[[Y[
	Ø]Û‰ÊNÂˆ‹˜Û\ÜÓ˜[YOIÛ[ØÚË[˜]‹\IÎÂˆ‹^ÛÛ[ZJÌNÂˆ‹›Û˜ÛXÚÏJ
OOžÜ™XÛÜ™[ØÚÔ]Y\Ý[Û•[YJ
NÛ[ØÚÒ[™^ZNÛ[ØÚÔ]Y\Ý[Û‘[\™Y]Q]K››ÝÊ
NÜ™[™\“[ØÚÔ]Y\Ý[ÛŠ
NßNÂˆ›ÛÝ˜\[™Ú[
ŠNÂˆJNÂˆ\]S[ØÚÓ˜]šYØ]ÜŠ
NÂŸB™[˜Ý[Ûˆ\]S[ØÚÓ˜]šYØ]ÜŠ
^ÂˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
	Ë›[ØÚË[˜]‹\IÊK™›Ü‘XXÚ

‹JOOžÂˆ‹˜Û\ÜÓ\ÝÙÙÛJ	Ø[œÝÙ\™Y	Ë[ØÚÐ[œÝÙ\œÖÚWHOO[[
NÂˆ‹˜Û\ÜÓ\ÝÙÙÛJ	Ù›YÙÙY	ËH[[ØÚÑ›YÜÖÚWJNÂˆ‹˜Û\ÜÓ\ÝÙÙÛJ	ØÝ\œ™[	ËOOO[[ØÚÒ[™^
NÂˆJNÂŸB‚™[˜Ý[Ûˆ™[™\“[ØÚÔ]Y\Ý[ÛŠ
^ÂˆÛÛœÝO[[ØÚÒ][\ÖÛ[ØÚÒ[™^NÂˆYŠ\JH™]\›ŽÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔS[IÊK^ÛÛ[X9ecÉÛ[ØÚÒ[™^
Ì_XÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔPØ]	ÊK^ÛÛ[IùéäyæëIÎÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔ]Y\Ý[Û‰ÊK^ÛÛ[\KœNÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÑ^[T›ÙÜ™\ÜÕ^	ÊK^ÛÛ[X9ecÉÛ[ØÚÒ[™^
Ì_HÈ	Û[ØÚÒ][\Ë›[™ÝXÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔ™]‰ÊK™\ØX›Y[[ØÚÒ[™^OOLÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÓ™^	ÊK^ÛÛ[[[ØÚÒ[™^OO[[ØÚÒ][\Ë›[™ÝLOÉùab:h+xàn	Î‰ù«(xàn8¡¤‰ÎÂ‚ˆÛÛœÝ›YÏYØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÑ›YÉÊNÂˆ›YË˜Û\ÜÓ\ÝÙÙÛJ	ØXÝ]™IË[ØÚÑ›YÜÖÛ[ØÚÒ[™^JNÂˆ›YË^ÛÛ[[[ØÚÑ›YÜÖÛ[ØÚÒ[™^OÉø¦!H:)¢ùæí8àeùkïº,hIÎ‰ø¦!ˆ8à`¸àj8àiú)¢ùæí8àfIÎÂ‚ˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÓÜ[ÛœÉÊNÂˆ›ÛÝš[›™\’SIÉÎÂˆK›Ü[ÛœË™›Ü‘XXÚ

ËJOOžÂˆÛÛœÝYØÝ[Y[˜Ü™X]Q[[Y[
	Ø]Û‰ÊNÂˆ‹˜Û\ÜÓ˜[YOIÛ[ØÚË\K[Ü[Û‰ÊÊ[ØÚÐ[œÝÙ\œÖÛ[ØÚÒ[™^OOOZOÉÈÙ[XÝY	Î‰ÉÊNÂˆ‹^ÛÛ[X	ÔÝš[™Ë™œ›ÛPÚ\ÛÙJJÚJ_Kˆ	ÛßXÂˆ‹›Û˜ÛXÚÏJ
OOžÂˆ[ØÚÐ[œÝÙ\œÖÛ[ØÚÒ[™^OZNÂˆ™[™\“[ØÚÔ]Y\Ý[ÛŠ
NÂˆNÂˆ›ÛÝ˜\[™Ú[
ŠNÂˆJNÂˆ\]S[ØÚÓ˜]šYØ]ÜŠ
NÂŸB‚™ØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔ™]‰ÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOžÂˆYŠ[ØÚÒ[™^Œ
^Âˆ™XÛÜ™[ØÚÔ]Y\Ý[Û•[YJ
NÂˆ[ØÚÒ[™^KNÂˆ[ØÚÔ]Y\Ý[Û‘[\™Y]Q]K››ÝÊ
NÂˆ™[™\“[ØÚÔ]Y\Ý[ÛŠ
NÂˆBŸJNÂ™ØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÓ™^	ÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOžÂˆ™XÛÜ™[ØÚÔ]Y\Ý[Û•[YJ
NÂˆ[ØÚÒ[™^[[ØÚÒ[™^[ØÚÒ][\Ë›[™ÝLOÛ[ØÚÒ[™^
ÌNŒÂˆ[ØÚÔ]Y\Ý[Û‘[\™Y]Q]K››ÝÊ
NÂˆ™[™\“[ØÚÔ]Y\Ý[ÛŠ
NÂŸJNÂ™ØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÑ›YÉÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOžÂˆ[ØÚÑ›YÜÖÛ[ØÚÒ[™^OH[[ØÚÑ›YÜÖÛ[ØÚÒ[™^NÂˆ™[™\“[ØÚÔ]Y\Ý[ÛŠ
NÂŸJNÂ‚™ØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÑš[š\Ú	ÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOžÂˆÛÛœÝ›[šÏ[[ØÚÐ[œÝÙ\œË™š[\ŠOžOO[[
K›[™ÝÂˆÛÛœÝ\ÙÏX›[šÏØ9§*¹fç¹ëe8àc	Ø›[šßyecøà`¸à¢¸ào¸àfxà ¹í`¹.¡¸àeøài¹£¨yà®xàeøào¸àfxàbûï'Ø‰ùí`¹.¡¸àeøài¹£¨yà®xàeøào¸àfxàbûï'ÉÎÂˆYŠÛÛ™š\›J\ÙÊJHš[š\Ú[ØÚÊ˜[ÙJNÂŸJNÂ‚™[˜Ý[Ûˆ›Ü›X][\ÙY
ÙXÊ^ÂˆÛÛœÝOSX]™›ÛÜŠÙXËÍŒ
NÂˆÛÛœÝÏ\ÙXÉMŒÂˆ™]\›ˆ	Û_yb!‰ÔÝš[™ÊÊKœYÝ\
‹	Ì	Ê_yéä˜ÂŸB‚‚™[˜Ý[Ûˆ[ØÚÕ\™Ù]ÙXÛÛ™Ê
^Ü™]\›ˆ[ØÚÒ][\Ë›[™ÝÓX]œ›Ý[™
[ØÚÒ[š]X[ÙXÛÛ™ËÛ[ØÚÒ][\Ë›[™Ý
NŽLßB™[˜Ý[Ûˆ[ØÚÐ][\XYÛ›ÜÝXÜÊ]Z[ËžPØ]
^ÂˆÛÛœÝ\™Ù][[ØÚÕ\™Ù]ÙXÛÛ™Ê
NÂˆÛÛœÝÜ›Û™Ô›ÝÜÏY]Z[Ë™š[\ŠO™˜[œÝÙ\’[™^OO[[˜[œÝÙ\’[™^OOY˜ÛÜœ™XÝ[™^
NÂˆÛÛœÝÛÝÔ›ÝÜÏY]Z[Ë™š[\ŠOŠœÙXÛÛ™ß
O\™Ù]
ŒKŒÍJNÂˆÛÛœÝ™\X]›ÝÜÏ]Ü›Û™Ô›ÝÜË™š[\ŠOŠ›Ùš[K›[ØÚÓZ\ÝZÙTÝ]ÏË–ÙšYOË›Z\ÜÙ\ß
OLJNÂˆÛÛœÝÙXZÙ\ÝSØš™XÝ™[šY\ÊžPØ]ßJK™š[\Š
Ë—JOO‹Ý[
KœÛÜ

KŠOOŠVÌWK˜ÛÜœ™XÝØVÌWKÝ[
KJ–ÌWK˜ÛÜœ™XÝØ–ÌWKÝ[
JVÌNÂˆ™]\›ˆÝ\™Ù]Ü›Û™ÎÜ›Û™Ô›ÝÜË›[™ÝÛÝÎœÛÝÔ›ÝÜË›[™Ý™\X]œ™\X]›ÝÜË›[™ÝÙXZÙ\ÝÙXZÙ\ÝÞØØ]ÙXZÙ\ÝÌKÝ“X]œ›Ý[™
ÙXZÙ\ÝÌWK˜ÛÜœ™XÝÝÙXZÙ\ÝÌWKÝ[
ŒL
_N›[NÂŸB™[˜Ý[Ûˆ™[™\“[ØÚÑXYÛ›ÜÚ\Ê][\žPØ]
^ÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÑXYÛ›ÜÚ\ÉÊNÚYŠ\›ÛÝ
\™]\›ŽÂˆÛÛœÝ[[ØÚÐ][\XYÛ›ÜÝXÜÊ][\Ë™]Z[ß×KžPØ]ßJNÂˆ›ÛÝš[›™\’SX]ˆÛ\ÜÏH›[ØÚËYXYÛ›ÜÚ\Ë]]H¹.â¹fç¸àk¹ª(z*iº*.¹¥«OÙ]]ˆÛ\ÜÏH›[ØÚËYXYÛ›ÜÚ\ËYÜšY‚ˆ]ˆÛ\ÜÏH›[ØÚËYXYÛ›ÜÚ\ËZ][HÜ[¹§ 9a*¹ab9b!ºaãÜÜ[‰ÞÙXZÙ\ÝÙ\ØØ\R[
ÙXZÙ\Ý˜Ø]
N‰ø %	ßOØÛX[‰ÞÙXZÙ\ÝØ9«hùëe9ã¡È	ÞÙXZÙ\ÝœÝIX‰ùc`yb!¸àj¸àáøàï8à¯øàc8à`¸à¢¸ào¸àføà¤ÉßOÜÛX[Ù]‚ˆ]ˆÛ\ÜÏH›[ØÚËYXYÛ›ÜÚ\ËZ][HÜ[¹¦`ºe¤øà¤¹/oøàhøàgùecúhcÜÜ[‰ÞœÛÝßyecÏØÛX[¹æë¹k¢H	Þ\™Ù]yéä‹ùecÈ8àkŒKŒÍy`#xà¤º-¡xàb8àgùecúhcÜÛX[Ù]‚ˆ]ˆÛ\ÜÏH›[ØÚËYXYÛ›ÜÚ\ËZ][HÜ[¹îl8à¢º/å8àeú*©9ëeÜÜ[‰Þœ™\X]yecÏØÛX[º`c¹c®øàjøà ¹ª(z*i¸àë8àäøàéxàï8àiú*©9ëe8àeøàgú*å¹à®OÜÛX[Ù]‚ˆÙ]˜ÂŸB™[˜Ý[Ûˆ™X\ÛÛ”™\ØÜš\[ÛŠ™X\ÛÛ‹J^ÂˆÛÛœÝX\^Âˆ	ùçéz+f9.#z-¬ÉÎžÚÚ[™‰ÚÛ›ÝÛYÙIË^‰øào¸àf¹çëxàa9¥fy§d8àiùk¦¹ïªxàj9.åyía8àoøà¤¹¥m9ä!¸àeøài¸àbøà¢xà yd#8àf9b!ºaã¸àk¹ecúhc8àn9¢.øà¢¸ào¸àfxà ‰ßKˆ	ú*"9ë¥øàçøà®IÎžÚÚ[™‰ØØ[ÉË^‰ú`%9.+yo#øàîùcf9/cxàîùi"y£æú`c¹ê"øà¤¹ç yåixàeøàj¸àa:*"9ë¥øàâxàê¸àêøàiùè®º*£xàeøào¸àfxà ‰ßKˆ	ú*«xàoú`exàa	ÎžÚÚ[™‰Ü™XY	Ë^‰ù§hy.íº*§¸à¤¹¢ï¸àa¹íí9ïä¸à¤¸àeøài¸à xà#:`jyb!ûï#ù.#z`jyb!øà#xà#9.éy."»ï#ù§*¹® 8à#xàkº*«xàoú$/xàj8àeøà¤¹®&øà¢xàeøào¸àfxà ‰ßKˆ	Ì¹¢§¸àiú/íøàhøàgÉÎžÚÚ[™‰ØÛÛ˜\Ý	Ë^‰ù//8àgú`n9¢§º ¨¸à¤Œ¸ài8àjùíg¸à¢¸à z`exàa8à¤º* :$bxàjøàeøài¸àbøà¢z`n8àm¹«å:/ øàâxàê¸àêøàn:`,¸àoøào¸àfxà ‰ßKˆ	ù¦`ºe¤ù.#z-¬ÉÎžÚÚ[™‰ÜÜYY	Ë^‰ÌyecÎL9éä¸à¤¹æë¹k¢xàjùb)9¥«xàfxà¢øà®xàåøàê¸àìøàâ8àiøà y¦`ºe¤úacyb!¸à¤¹¥m8àb8ào¸àfxà ‰ßBˆNÂˆÛÛœÝ[X\Ü™X\ÛÛ—_ÚÚ[™‰Ü™\X]	Ë^‰ùoªyïä¸àêøàï8àâ8àjù¬¯øàhøài¸à y¥fy§d8àîúhgºhc8àîùo£9¥éyoªyïä¸ào¸àiú`,¸à xào¸àfxà ‰ßNÂˆÛÛœÝ\ÜÛÛ[\ÜÛÛ‘›Ü”]Y\Ý[ÛŠJNÂˆ™]\›ˆË‹‹ž\ÜÛÛŸNÂŸB™[˜Ý[Ûˆ™[™\”™]šY]Ô™\ØÜš\[ÛŠ
^ÂˆÛÛœÝ][O\™]šY]Ò][\ÖÜ™]šY]Ò[™^NÚYŠZ][J\™]\›ŽÂˆÛÛœÝÝ]YÙ][ØÚÓZ\ÝZÙTÝ]
][KœKšY
K™X\ÛÛ\Ý]›\Ý™X\ÛÛŽÂˆÛÛœÝ\™X\ÛÛ”™\ØÜš\[ÛŠ™X\ÛÛ‹][KœJK^YØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]Ô™\ØÜš\[Û•^	ÊKXZ[YØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]Ô™\ØÜš\[Û“XZ[‰ÊK›Ý\›™^OYØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]Ò›Ý\›™^Q\™XÝ	ÊNÂˆYŠ^
]^^ÛÛ[\™X\ÛÛØ	Ü™X\ÛÛŸ{ï&‰Ü^X‰ùc§ùfè8à¤º`n8àm¸àj8à xàgxàk¸ài8ào¸àf¸àcy¥®xàjùd"8àhøàgùoªyïä¹¥®y¬åxà¤¹£ä9¨b8àeøào¸àfxà ‰ÎÂˆYŠXZ[Š^ÛXZ[‹™]\Ù]œ™X\ÛÛ\™X\ÛÛŸ	ÉÎÛXZ[‹™]\Ù]œZYZ][KœKšYÛXZ[‹^ÛÛ[\™X\ÛÛOOIùçéz+f9.#z-¬ÉÉ‰œ›\ÜÛÛÉù¥fy§d8àiùä!º)èøàeùæí8àfH8¡¤‰Îœ™X\ÛÛØ	Ü™\ØÜš\[Û“Y]JÚÚ[™œšÚ[™Ø]š][KœK˜Ø]JK]_H8¡¤˜‰ùoªyïä¸à¤ºe¢ùiâÈ8¡¤‰ÎÛXZ[‹™\ØX›YH\™X\ÛÛŽßBˆÛÛœÝZ›Ý\›™^Q›ÜŠ][KœKšY
NÚYŠ›Ý\›™^J^Ú›Ý\›™^K™]\Ù]œZYZ][KœKšYÚ›Ý\›™^K™\ØX›YHZŽÚ›Ý\›™^K^ÛÛ[ZØ	Ú›Ý\›™^TÝYÙSX™[
‹œÝYÙJ_xàbøà¢yoªyïä¸àêøàï8àâ8à¤¹í¦¸àdxà¢Ø‰ùoªyïä¸àêøàï8àâ8à¤º)¢øà¢ÉÎßBŸB™[˜Ý[ÛˆÝ\™]šY]Ô™\ØÜš\[ÛŠZY™X\ÛÛŠ^ÂˆÛÛœÝO[ÜšYÚ[˜[]Y\Ý[ÛžRY
ZY
NÚYŠ\J\™]\›ŽÂˆÛÛœÝ\™X\ÛÛ”™\ØÜš\[ÛŠ™X\ÛÛ‹JNÂˆYŠ™X\ÛÛOOIùçéz+f9.#z-¬ÉÉ‰œ›\ÜÛÛŠ^ØXÝ]™T™]šY]Ò›Ý\›™^RY\ZYÜÝ\\ÜÛÛŠ›\ÜÛÛŠNÜ™]\›ŽßBˆÚÝÔØÜ™Y[Š	Ü›Ø›[\ÉÊNÜÝ\]Z^Šž‰ÜšÚ[™N‰ÜK˜Ø]X
NÂŸB™[˜Ý[ÛˆÝ\œ™[™]šY]ÑÛZ[˜[™X\ÛÛŠ
^ÂˆÛÛœÝÝ[ÏXYÙÜ™YØ]T™X\ÛÛœÊ
NÜ™]\›ˆØš™XÝ™[šY\ÊÝ[ÊKœÛÜ

KŠOO˜–ÌWKXVÌWJVÌOË–Ì_[ÂŸB™[˜Ý[Ûˆš[š\Ú[ØÚÊ[Y]\Y˜[ÙJ^Âˆ™XÛÜ™[ØÚÔ]Y\Ý[Û•[YJ
NÂˆYŠ[ØÚÕ[Y\’[™J^ØÛX\’[\˜[
[ØÚÕ[Y\’[™JNÛ[ØÚÕ[Y\’[™O[[ßBˆÛÛœÝ\ÙYSX]›Z[Š[ØÚÒ[š]X[ÙXÛÛ™ËX]›X^
[ØÚÒ[š]X[ÙXÛÛ™Ë[[ØÚÔÙXÛÛ™ÊJNÂˆ]ÛÜœ™XÝL›[šÏLÂˆÛÛœÝžPØ]^ßNÂˆÛÛœÝÜ›Û™ÜÏV×NÂ‚ˆ[ØÚÒ][\Ë™›Ü‘XXÚ

KJOOžÂˆÛÛœÝ[œÏ[[ØÚÐ[œÝÙ\œÖÚWNÂˆÛÛœÝÚÏX[œÏOO\K˜NÂˆÛÛœÝÛÝ\˜ÙRY\KœÛÝ\˜ÙRYKšYÂˆÛÛœÝ\Ï\›Ùš[K›[ØÚÔ]Y\Ý[Û”Ý]ÖÜÛÝ\˜ÙRY_
›Ùš[K›[ØÚÔ]Y\Ý[Û”Ý]ÖÜÛÝ\˜ÙRYO^ÜÙY[ŽŒÛÜœ™XÝŒ\ÝÙY[Ž›[JNÂˆ\ËœÙY[J\ËœÙY[Ÿ
JÌNÂˆYŠÚÊ[\Ë˜ÛÜœ™XÝJ\Ë˜ÛÜœ™XÝ
JÌNÂˆ\Ë›\ÝÙY[[ØØ[]RTÓÊ
NÂˆYŠ[œÏOO[[
H›[šÊÊÎÂˆYŠÚÊHÛÜœ™XÝ
ÊÎÂˆYŠXžPØ]ÜK˜Ø]JHžPØ]ÜK˜Ø]O^ØÛÜœ™XÝŒÝ[ŒNÂˆžPØ]ÜK˜Ø]KÝ[
ÊÎÂˆYŠÚÊHžPØ]ÜK˜Ø]K˜ÛÜœ™XÝ
ÊÎÂˆ[œÝ\™T]Y\Ý[Û”›Ùš[J
NÂˆÛÛœÝÝ\›Ùš[KœTÝ]ÖÜKœÛÝ\˜ÙRYKšYNÂˆÛÛœÝÙXÏ[[ØÚÔ]Y\Ý[Û”ÙXÛÛ™ÖÚW_ÂˆYŠ[ÚÊ^ÂˆÜ›Û™ÜËœ\Ú
ÜK[œßJNÂˆYŠÝ
^ÂˆÝ˜][\ÏJÝ˜][\ß
JÌNÂˆÝ›\Ý[ØØ[]RTÓÊ
NÂˆÝœÝ™XZÏLÂˆYŠ[œÏOO[[	‰ˆ[Y]\
HÝ›\Ý™X\ÛÛIù¦`ºe¤ù.#z-¬ÉÎÂˆY\]™SY[[ÜžU\]JÝ	ÝÜ›Û™ÉËÙXËÝ›\Ý™X\ÛÛ‹˜[ÙJNÂˆBˆ™YÚ\Ý\”™]šY]Ò›Ý\›™^JK	Û[ØÚÉÊNÂˆ\T]Y\Ý[Û”ÚÚ[[JKLJNÂˆY[Ù^ÂˆYŠÝ
^ÂˆÝ˜][\ÏJÝ˜][\ß
JÌNÂˆÝ˜ÛÜœ™XÝJÝ˜ÛÜœ™XÝ
JÌNÂˆÝ›\Ý[ØØ[]RTÓÊ
NÂˆÝœÝ™XZÏJÝœÝ™XZß
JÌNÂˆY\]™SY[[ÜžU\]JÝ	ØÛÜœ™XÝ	ËÙXË[˜[ÙJNÂˆBˆ\T]Y\Ý[Û”ÚÚ[[JKŒÍJNÂˆBˆJNÂ‚ˆÛÛœÝÝ[[[ØÚÒ][\Ë›[™ÝÂˆÛÛœÝ˜]O]Ý[ÓX]œ›Ý[™
ÛÜœ™XÝÝÝ[
ŒL
NŒÂˆÛÛœÝÜ›Û™Ï]Ý[XÛÜœ™XÝX›[šÎÂ‚ˆÛÛœÝ][\]Z[Ï[[ØÚÒ][\Ë›X\

KJOOŠÂˆYœKœÛÝ\˜ÙRYKšYˆÚÝÛ“Ü[ÛœÎ–Ë‹‹œK›Ü[Ûœ×KˆÛÜœ™XÝ[™^œK˜Kˆ[œÝÙ\’[™^›[ØÚÐ[œÝÙ\œÖÚWKˆ›YÙÙYˆH[[ØÚÑ›YÜÖÚWKˆÙXÛÛ™Î›[ØÚÔ]Y\Ý[Û”ÙXÛÛ™ÖÚW_ˆJJNÂˆ\Ý[ØÚÐ][\^Âˆ]N›ØØ[]RTÓÊ
K[ÙN›[ØÚÓ[ÙKÝ[ÛÜœ™XÝ›[šË˜]KÙXÛÛ™Î\ÙYˆ›Y\š[›[ØÚÐÝ\œ™[›Y\š[ÜÝXÝ\™YÛÛ™J[ØÚÐÝ\œ™[›Y\š[
N›[ˆžPØ]œÝXÝ\™YÛÛ™JžPØ]
K]Z[Î˜][\]Z[ÂˆNÂˆ›Ùš[K›[ØÚÒ\ÝÜžK[œÚY
\Ý[ØÚÐ][\
NÂˆ›Ùš[K›[ØÚÒ\ÝÜžO\›Ùš[K›[ØÚÒ\ÝÜžKœÛXÙJL
NÂˆ›Ùš[Kž
ÏHX]œ›Ý[™
ÛÜœ™XÝ
ŒŠNÂˆØ]™T›Ùš[J
NÂ‚ˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÑ^[IÊK˜Û\ÜÓ\Ýœ™[[Ý™J	ÜÚÝÉÊNÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔ™\Ý[	ÊK˜Û\ÜÓ\Ý˜Y
	ÜÚÝÉÊNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔ™\Ý[ØÛÜ™IÊK^ÛÛ[X	Ü˜]_IXÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔÝ]ÛÜœ™XÝ	ÊK^ÛÛ[XÛÜœ™XÝÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔÝ]Ü›Û™ÉÊK^ÛÛ[]Ü›Û™ÎÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔÝ]›[šÉÊK^ÛÛ[X›[šÎÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔÝ][YIÊK^ÛÛ[X	ÓX]™›ÛÜŠ\ÙYÍŒ
_[XÂ‚ˆ]Y\ÜØYÙOIùo,yà®xà¤º)¢øài8àdxà¢xà£8àgøàdøàj8àc9cã¹êjøàiøàfxà ‰ÎÂˆ]XÛÛIü'äæ‰ÎÂˆYŠ˜]ONJ^ÛY\ÜØYÙOIøàbøàj¸à¢¹k¢yk¦¸àeøài¸àa8ào¸àfxà º)¢ùæí8àeùecúhc8à¤¹.+yoàøàjù.åy."¸àd¸ào¸àeøà¡øàa¸à ‰ÎÚXÛÛIü'ãá‰ÎßBˆ[ÙHYŠ˜]OMÌ
^ÛY\ÜØYÙOIú"køàa9/cyïk¸àiøàfxà º*©9ëe9b!ºaã¸à¤¹oªyïä¸àfxà¢øàj8àexà¢xàjùk¢yk¦¸àeøào¸àfxà ‰ÎÚXÛÛIü'ã«ÉÎßBˆ[ÙHYŠ˜]OMMJ^ÛY\ÜØYÙOIùgî¹é#¸àkøài8àj¸àc8àhøài¸àa8ào¸àfxà ¹o,yà®xàk¹a£yki¹ïä¸à¤¹a*¹ab8àeøào¸àeøà¡øàa¸à ‰ÎÚXÛÛIü'äâ	ÎßBˆYŠ[Y]\
HY\ÜØYÙOIù¦`ºe¤ùí`¹.¡¸àiøàfxà ¹§*¹fç¹ëe8à¤¹d*øà xài¸à y¦`ºe¤úacyb!¸à ¹oªyïä¹§d9¥¦xàjøàeøào¸àeøà¡øàa¸à ‰ÎÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔ™\Ý[XÛÛ‰ÊK^ÛÛ[ZXÛÛŽÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔ™\Ý[Y\ÜØYÙIÊK^ÛÛ[[Y\ÜØYÙNÂˆ™[™\“[ØÚÑXYÛ›ÜÚ\Ê\Ý[ØÚÐ][\žPØ]
NÂ‚ˆÛÛœÝœ™XZÙÝÛYØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÐœ™XZÙÝÛ‰ÊNÂˆœ™XZÙÝÛ‹š[›™\’SIÉÎÂˆØš™XÝ™[šY\ÊžPØ]
KœÛÜ

KŠOOŠVÌWK˜ÛÜœ™XÝØVÌWKÝ[
KJ–ÌWK˜ÛÜœ™XÝØ–ÌWKÝ[
JK™›Ü‘XXÚ

ØØ]—JOOžÂˆÛÛœÝÝSX]œ›Ý[™
‹˜ÛÜœ™XÝÝ‹Ý[
ŒL
NÂˆÛÛœÝYØÝ[Y[˜Ü™X]Q[[Y[
	Ù]‰ÊNÂˆ˜Û\ÜÓ˜[YOIÛ[ØÚËXœ™XZË\›ÝÉÎÂˆš[›™\’SX]ˆÛ\ÜÏH›[ØÚËXœ™XZË[˜[YH‰ØØ]OÙ]]ˆÛ\ÜÏHœ›ÙÜ™\ÜÈ]ˆÝ[OHÚY‰ÜÝIHÙ]Ù]]ˆÛ\ÜÏH›[ØÚËXœ™XZË\Ý‰ÜÝIOÙ]˜Âˆœ™XZÙÝÛ‹˜\[™Ú[

NÂˆJNÂ‚ˆÛÛœÝ™]šY]ÏYØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔ™]šY]Ó\Ý	ÊNÂˆ™]šY]Ëš[›™\’SIÉÎÂˆÜ›Û™ÜËœÛXÙJ
K™›Ü‘XXÚ
OžÂˆÛÛœÝYØÝ[Y[˜Ü™X]Q[[Y[
	Ù]‰ÊNÂˆ˜Û\ÜÓ˜[YOIÛ[ØÚË\™]šY]ËZ][IÎÂˆÛÛœÝÙ[XÝY^˜[œÏOO[[Éù§*¹fç¹ëe	ÎžœK›Ü[ÛœÖÞ˜[œ×NÂˆÛÛœÝÝ]\›Ùš[K›[ØÚÓZ\ÝZÙTÝ]ÏË–ÞœKœÛÝ\˜ÙRYœKšYNÂˆÛÛœÝZ›Ý\›™^Q›ÜŠœKœÛÝ\˜ÙRYœKšY
NÂˆÛÛœÝ™X\ÛÛ\Ý]Ë›\Ý™X\ÛÛŸ	ùc§ùfè9§*º*&:c,‰ÎÂˆš[›™\’SX‰ÞœK˜Ø]xàîÉÞœK˜ÛÛ˜Ù\OØ]ˆÛ\ÜÏHœÝXˆ‰Ù\ØØ\R[
œKœJ_Oœ¸à`¸àj¸àgûï&‰Ù\ØØ\R[
Ù[XÝY
_H;ï#È9«hú)èûï&‰Ù\ØØ\R[
œK›Ü[ÛœÖÞœK˜WJ_OÙ]]ˆÛ\ÜÏHœÝXˆ¹c§ùfè;ï&‰Ù\ØØ\R[
™X\ÛÛŠ_IÚØ;ï#È9oªyïä»ï&‰Ú›Ý\›™^TÝYÙSX™[
‹œÝYÙJ_X‰ÉßOÙ]˜Âˆ™]šY]Ë˜\[™Ú[

NÂˆJNÂˆYŠ]Ü›Û™ÜË›[™Ý
H™]šY]Ëš[›™\’SIÏ]ˆÛ\ÜÏHœÝXˆ¹aj9ecù«hú)èøàiøàfH<'ã¢OÙ]‰ÎÂ‚ˆÛÛœÝ™]šY]ÐYØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔÝ\™]šY]ÉÊNÂˆYŠ™]šY]ÐŠ^ÂˆÛÛœÝ\Ô™]šY]Ï\™]šY]ÐØ[™Y]\Ê\Ý[ØÚÐ][\
K›[™ÝŒÂˆ™]šY]Ð‹œÝ[K™\Ü^OZ\Ô™]šY]ÏÉÉÎ‰Û›Û™IÎÂˆ™]šY]Ð‹˜Û\ÜÓ\ÝÙÙÛJ	Üš[X\žKXXÝ[Û‰Ë\Ô™]šY]ÊNÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÐ˜XÚÓY[IÊOË˜Û\ÜÓ\ÝÙÙÛJ	Üš[X\žKXXÝ[Û‰ËZ\Ô™]šY]ÊNÂˆBˆ™[™\“[ØÚÒ\ÝÜžJ
NÂˆ™[™\‘Z[T[Š
NÂˆ™[™\”™XY[™\ÜÊ
NÂŸB‚™[˜Ý[ÛˆÚÝÓ[ØÚÓY[J
^ÂˆYŠ[ØÚÕ[Y\’[™J^ØÛX\’[\˜[
[ØÚÕ[Y\’[™JNÛ[ØÚÕ[Y\’[™O[[ßBˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÓY[IÊK˜Û\ÜÓ\Ýœ™[[Ý™J	ÚY[‰ÊNÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÑ^[IÊK˜Û\ÜÓ\Ýœ™[[Ý™J	ÜÚÝÉÊNÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔ™\Ý[	ÊK˜Û\ÜÓ\Ýœ™[[Ý™J	ÜÚÝÉÊNÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔ™]šY]Ó[ÙIÊOË˜Û\ÜÓ\Ýœ™[[Ý™J	ÜÚÝÉÊNÂˆ™[™\“[ØÚÒ\ÝÜžJ
NÂŸB™ØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÐ˜XÚÓY[IÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOžÜÚÝÓ[ØÚÓY[J
NÜÚÝÔØÜ™Y[Š	Ü›Ø›[\ÉÊNßJNÂ™ØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔ™]žIÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOœÝ\[ØÚÊ[ØÚÓ\Ý[ÙJJNÂ‚™[˜Ý[Ûˆ™[™\“[ØÚÒ\ÝÜžJ
^ÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÒ\ÝÜžS\Ý	ÊNÂˆYŠ\›ÛÝ
H™]\›ŽÂˆÛÛœÝ\ÝJ›Ùš[K›[ØÚÒ\ÝÜž_×JKœÛXÙJŠNÂˆYŠZ\Ý›[™Ý
^Âˆ›ÛÝš[›™\’SIÏ]ˆÛ\ÜÏHœÝXˆ¸ào¸àh9ª(z*i¹liy«m8àc8à`¸à¢¸ào¸àføà¤øà Ù]‰ÎÂˆ™]\›ŽÂˆBˆ›ÛÝš[›™\’SIÉÎÂˆ\Ý™›Ü‘XXÚ
OžÂˆÛÛœÝYØÝ[Y[˜Ü™X]Q[[Y[
	Ù]‰ÊNÂˆ˜Û\ÜÓ˜[YOIÛ[ØÚËZ\ÝÜžK\›ÝÉÎÂˆÛÛœÝœZ˜›Y\š[Ë˜ÛÝ[ÏË™Y™šXÝ[NÂˆÛÛœÝÛÙÏZ˜›Y\š[Ë˜ÛÝ[ÏË˜ÛÙÛš]]™NÂˆÛÛœÝœ^XœØ]ˆÛ\ÜÏH›[ØÚËZ\ÝÜžKX›Y\š[¹gî¹é#ˆ	ØœÉùgî¹é#‰×_HÈ9ª&y®¥ˆ	ØœÉùª&y®¥‰×_HÈ9k§ù¢)ˆ	ØœÉùk§ù¢)‰×_OÙ]˜‰ÉÎÂˆÛÛœÝÛÙÕ^XÛÙÏØ]ˆÛ\ÜÏH›[ØÚËZ\ÝÜžKX›Y\š[¹ ìú-mÈ	ØÛÙÖÉù ìú-mÉ×_HÈ:`jyå*	ØÛÙÖÉú`jyå*	×_HÈ9b)9¥«H	ØÛÙÖÉùb)9¥«I×_OÙ]˜‰ÉÎÂˆš[›™\’SX]]ˆÛ\ÜÏH›[ØÚËZ\ÝÜžK]]H‰Ú›[ÙOOOIÙ[	ÏÉøàåxàêùª(z*i‰Î‰øàãøàï8àåyª(z*i‰ßxàîÉÚ˜ÛÜœ™XÝKÉÚÝ[yecÏÙ]]ˆÛ\ÜÏH›[ØÚËZ\ÝÜžK\ÝXˆ‰Ú™]_OÙ]‰Øœ^IØÛÙÕ^IÚ™]Z[ÏÉÏ]ÛˆÛ\ÜÏH›[ØÚËZ\ÝÜžK\™]šY]È¸àë8àäøàéxàïØ]Û‰Î‰ÉßOÙ]‚ˆ]ˆÛ\ÜÏH›[ØÚËZ\ÝÜžK][YH‰Ù›Ü›X][\ÙY
œÙXÛÛ™ß
_OÙ]]ˆÛ\ÜÏH›[ØÚËZ\ÝÜžK\ØÛÜ™H‰Úœ˜]_IOÙ]˜Âˆœ]Y\žTÙ[XÝÜŠ	Ë›[ØÚËZ\ÝÜžK\™]šY]ÉÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOœÝ\[ØÚÔ™]šY]Ê
JNÂˆ›ÛÝ˜\[™Ú[

NÂˆJNÂŸBœ™[™\“[ØÚÒ\ÝÜžJ
NÂ‚‚‹ËÈKKKKHŒM[ØÚÈ™]šY]ÈKKKKBšYŠ\›Ùš[K›[ØÚÓZ\ÝZÙTÝ]ÊH›Ùš[K›[ØÚÓZ\ÝZÙTÝ]Ï^ßNÂ‚™[˜Ý[ÛˆÜšYÚ[˜[]Y\Ý[ÛžRY
Y
^Âˆ™]\›ˆ]Y\Ý[ÛžRY
Y
NÂŸB™[˜Ý[Ûˆ™]šY]ÐØ[™Y]\Ê][\
^ÂˆYŠX][\Ë™]Z[ÊH™]\›ˆ×NÂˆ™]\›ˆ][\™]Z[Ë›X\

JOOžÂˆÛÛœÝO[ÜšYÚ[˜[]Y\Ý[ÛžRY
šY
NÂˆYŠ\JH™]\›ˆ[ÂˆÛÛœÝÜ›Û™ÏY˜[œÝÙ\’[™^OO[[˜[œÝÙ\’[™^OOY˜ÛÜœ™XÝ[™^ÂˆYŠ]Ü›Û™È	‰ˆY™›YÙÙY
H™]\›ˆ[Âˆ™]\›ˆË‹‹™KÜ›Û™ËÜÚ][ÛŽš_NÂˆJK™š[\Š›ÛÛX[ŠNÂŸB™[˜Ý[ÛˆÝ\[ØÚÔ™]šY]Ê][\[\Ý[ØÚÐ][\
^ÂˆYŠX][\Ë™]Z[Ê^ÂˆÜØ\Ý
	øàdøàk¹ª(z*i¸àjøàkú*lùí,8àë8àäøàéxàï9 áyh,xàc8à`¸à¢¸ào¸àføà¤ÉÊNÂˆ™]\›ŽÂˆBˆ\Ý[ØÚÐ][\X][\Âˆ™]šY]Ò][\Ï\™]šY]ÐØ[™Y]\Ê][\
NÂˆYŠ\™]šY]Ò][\Ë›[™Ý
^ÂˆÜØ\Ý
	ùoªyïä¹kïº,hxàkøà`¸à¢¸ào¸àføà¤È<'ã¢IÊNÂˆ™]\›ŽÂˆBˆ™]šY]Ò[™^LÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÓY[IÊK˜Û\ÜÓ\Ý˜Y
	ÚY[‰ÊNÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÑ^[IÊK˜Û\ÜÓ\Ýœ™[[Ý™J	ÜÚÝÉÊNÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔ™\Ý[	ÊK˜Û\ÜÓ\Ýœ™[[Ý™J	ÜÚÝÉÊNÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔ™]šY]Ó[ÙIÊK˜Û\ÜÓ\Ý˜Y
	ÜÚÝÉÊNÂˆØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]ÐØ\™	ÊKœÝ[K™\Ü^OIÉÎÂˆØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]ÔÝ[[X\žIÊK˜Û\ÜÓ\Ýœ™[[Ý™J	ÜÚÝÉÊNÂˆ™[™\“[ØÚÔ™]šY]Ò][J
NÂŸB™ØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔÝ\™]šY]ÉÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOœÝ\[ØÚÔ™]šY]Ê\Ý[ØÚÐ][\
JNÂ‚™[˜Ý[ÛˆÙ][ØÚÓZ\ÝZÙTÝ]
Y
^ÂˆYŠ\›Ùš[K›[ØÚÓZ\ÝZÙTÝ]ÖÚYJH›Ùš[K›[ØÚÓZ\ÝZÙTÝ]ÖÚYO^ÛZ\ÜÙ\ÎŒ™X\ÛÛœÎžßK\Ý›[NÂˆ™]\›ˆ›Ùš[K›[ØÚÓZ\ÝZÙTÝ]ÖÚYNÂŸB™[˜Ý[Ûˆ™[™\“[ØÚÔ™]šY]Ò][J
^ÂˆÛÛœÝ][O\™]šY]Ò][\ÖÜ™]šY]Ò[™^NÂˆYŠZ][JH™]\›ŽÂˆÛÛœÝOZ][KœNÂˆÛÛœÝÝ]YÙ][ØÚÓZ\ÝZÙTÝ]
KšY
NÂ‚ˆØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]Ô›ÙÜ™\ÜÕ^	ÊK^ÛÛ[X	Ü™]šY]Ò[™^
Ì_HÈ	Ü™]šY]Ò][\Ë›[™ÝXÂˆØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]Ô]Y\Ý[Û‰ÊK^ÛÛ[\KœNÂ‚ˆÛÛœÝ˜YÙ\ÏV×NÂˆ˜YÙ\Ëœ\Ú
Ü[ˆÛ\ÜÏHœ™]šY]ËX˜YÙH‰ÜK˜Ø]xàîÉÜK˜ÛÛ˜Ù\OÜÜ[˜
NÂˆYŠ][KÜ›Û™ÊH˜YÙ\Ëœ\Ú
	ÏÜ[ˆÛ\ÜÏHœ™]šY]ËX˜YÙHÜ›Û™Èº*©9ëeÜÜ[‰ÊNÂˆYŠ][K™›YÙÙY
H˜YÙ\Ëœ\Ú
	ÏÜ[ˆÛ\ÜÏHœ™]šY]ËX˜YÙH›YÈ¸¦!H:)¢ùæí8àeÏÜÜ[‰ÊNÂˆYŠ
Ý]›Z\ÜÙ\ß
OLŠH˜YÙ\Ëœ\Ú
Ü[ˆÛ\ÜÏHœ™]šY]ËX˜YÙH™\X]¹îl8à¢º/å8àeú*©9ëe	ÜÝ]›Z\ÜÙ\ßyfçÜÜ[˜
NÂˆØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]Ð˜YÙ\ÉÊKš[›™\’SX˜YÙ\Ëš›Ú[Š	ÉÊNÂ‚ˆÛÛœÝ\Ù\Z][K˜[œÝÙ\’[™^OO[[Éù§*¹fç¹ëe	Îš][KœÚÝÛ“Ü[ÛœÖÚ][K˜[œÝÙ\’[™^NÂˆÛÛœÝÛÜœ™XÝZ][KœÚÝÛ“Ü[ÛœÖÚ][K˜ÛÜœ™XÝ[™^NÂˆØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]Õ\Ù\[œÝÙ\•˜[YIÊK^ÛÛ[]\Ù\ŽÂˆØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]ÐÛÜœ™XÝ[œÝÙ\•˜[YIÊK^ÛÛ[XÛÜœ™XÝÂˆØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]Õ\Ù\[œÝÙ\‰ÊK˜Û\ÜÓ˜[YOIÜ™]šY]ËX[œÝÙ\ˆ\Ù\‰ÊÊ][KÜ›Û™ÏÉÈÜ›Û™ÉÎ‰ÉÊNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]Ñ^[˜][Û‰ÊK^ÛÛ[\K™^ÂˆØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]Ò[	ÊK^ÛÛ[Iú)¦¸àb9¥®{ï&‰ÊÜKš[ÂˆÛÛœÝ\™Ù]SX]œ›Ý[™

\Ý[ØÚÐ][\Ë›[ÙOOOIÚ[‰ÏÍJŒŽL
Œ
KÊ\Ý[ØÚÐ][\ËÝ[Œ
JNÂˆØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]Õ[YIÊK^ÛÛ[X8àdøàk¹ecúhc;ï&¹í!	Ú][KœÙXÛÛ™ßyéäˆ;ï#È9æë¹k¢{ï&¹í!	Ý\™Ù]yéä˜Â‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
	Ëœ™]šY]Ë\™X\ÛÛ‹XÚ\	ÊK™›Ü‘XXÚ
ÏOžÂˆË˜Û\ÜÓ\ÝÙÙÛJ	ÜXÚÙY	ËÝ]›\Ý™X\ÛÛOOXË™]\Ù]›\™X\ÛÛŠNÂˆJNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]Ô™]‰ÊK™\ØX›Y\™]šY]Ò[™^OOLÂˆØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]Ó™^	ÊK^ÛÛ[\™]šY]Ò[™^OO\™]šY]Ò][\Ë›[™ÝLOÉøàë8àäøàéxàï9k£9.¡‰Î‰ù«(xàn8¡¤‰ÎÂˆØÝ[Y[™Ù][[Y[žRY
	ÜÚ[Z[\›Þ	ÊK˜Û\ÜÓ\Ýœ™[[Ý™J	ÜÚÝÉÊNÂˆÝ\œ™[Ú[Z[\[[Âˆ™[™\”™]šY]Ô™\ØÜš\[ÛŠ
NÂŸB‚™ØÝ[Y[œ]Y\žTÙ[XÝÜ[
	Ëœ™]šY]Ë\™X\ÛÛ‹XÚ\	ÊK™›Ü‘XXÚ
Ú\OžÂˆÚ\˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOžÂˆÛÛœÝ][O\™]šY]Ò][\ÖÜ™]šY]Ò[™^NÂˆYŠZ][JH™]\›ŽÂˆÛÛœÝÝ]YÙ][ØÚÓZ\ÝZÙTÝ]
][KœKšY
NÂ‚ˆËÈ[™Èš[Üˆ™X\ÛÛˆÛÝ[YˆH™X\ÛÛˆ\È™Z[™ÈÚ[™ÙY‚ˆYŠÝ]›\Ý™X\ÛÛˆ	‰ˆÝ]œ™X\ÛÛœÖÜÝ]›\Ý™X\ÛÛ—J^ÂˆÝ]œ™X\ÛÛœÖÜÝ]›\Ý™X\ÛÛ—OSX]›X^
Ý]œ™X\ÛÛœÖÜÝ]›\Ý™X\ÛÛ—KLJNÂˆBˆÛÛœÝ™X\ÛÛXÚ\™]\Ù]›\™X\ÛÛŽÂˆÝ]›\Ý™X\ÛÛ\™X\ÛÛŽÂˆÝ]œ™X\ÛÛœÖÜ™X\ÛÛ—OJÝ]œ™X\ÛÛœÖÜ™X\ÛÛ—_
JÌNÂˆÝ]›\Ý[ØØ[]RTÓÊ
NÂˆÛÛœÝ\Ý\›Ùš[KœTÝ]ÏË–Ú][KœKšYNÚYŠ\Ý
\\Ý›\Ý™X\ÛÛ\™X\ÛÛŽÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
	Ëœ™]šY]Ë\™X\ÛÛ‹XÚ\	ÊK™›Ü‘XXÚ
ÏO˜Ë˜Û\ÜÓ\Ýœ™[[Ý™J	ÜXÚÙY	ÊJNÂˆÚ\˜Û\ÜÓ\Ý˜Y
	ÜXÚÙY	ÊNÂˆØ]™T›Ùš[J
NÂˆ™[™\”™]šY]Ô™\ØÜš\[ÛŠ
NÂˆJNÂŸJNÂ‚™[˜Ý[Ûˆ™YÚ\Ý\”™]šY]ÙYZ\ÜÊ][J^ÂˆYŠZ][OËÜ›Û™ÊH™]\›ŽÂˆÛÛœÝÝ]YÙ][ØÚÓZ\ÝZÙTÝ]
][KœKšY
NÂˆYŠ\Ý]—ØÛÝ[Y][\Ù^JHÝ]—ØÛÝ[Y][\Ù^O^ßNÂˆÛÛœÝÙ^OX	Û\Ý[ØÚÐ][\Ë™]_	ÉßKIÚ][KœÜÚ][ÛŸKIÛ\Ý[ØÚÐ][\ËœÙXÛÛ™ßXÂˆYŠ\Ý]—ØÛÝ[Y][\Ù^VÚÙ^WJ^ÂˆÝ]›Z\ÜÙ\ÏJÝ]›Z\ÜÙ\ß
JÌNÂˆÝ]—ØÛÝ[Y][\Ù^VÚÙ^WO]YNÂˆÝ]›\Ý[ØØ[]RTÓÊ
NÂˆËÈÙY\ÛX[È]›ÚY[›[Z]YØØ[ÝÜ˜YÙHÜ›ÝÝˆÛÛœÝÙ^\ÏSØš™XÝšÙ^\ÊÝ]—ØÛÝ[Y][\Ù^JNÂˆYŠÙ^\Ë›[™ÝŒLŠH[]HÝ]—ØÛÝ[Y][\Ù^VÚÙ^\ÖÌWNÂˆØ]™T›Ùš[J
NÂˆBŸB™[˜Ý[Ûˆ[Ý™T™]šY]Ê[J^ÂˆÛÛœÝ][O\™]šY]Ò][\ÖÜ™]šY]Ò[™^NÂˆ™YÚ\Ý\”™]šY]ÙYZ\ÜÊ][JNÂˆÛÛœÝ™^\™]šY]Ò[™^
Ù[NÂˆYŠ™^™^\™]šY]Ò][\Ë›[™Ý
H™]\›ŽÂˆ™]šY]Ò[™^[™^Âˆ™[™\“[ØÚÔ™]šY]Ò][J
NÂŸB™ØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]Ô™]‰ÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OO›[Ý™T™]šY]ÊLJJNÂ™ØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]Ó™^	ÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOžÂˆ™YÚ\Ý\”™]šY]ÙYZ\ÜÊ™]šY]Ò][\ÖÜ™]šY]Ò[™^JNÂˆYŠ™]šY]Ò[™^™]šY]Ò][\Ë›[™ÝLJ^Âˆ™]šY]Ò[™^
ÊÎÂˆ™[™\“[ØÚÔ™]šY]Ò][J
NÂˆY[Ù^Âˆš[š\Ú[ØÚÔ™]šY]Ê
NÂˆBŸJNÂ‚™[˜Ý[ÛˆXÚÔÚ[Z[\”]Y\Ý[ÛŠ˜\ÙJ^ÂˆÛÛœÝ\ÜÛÛ’Y[\ÜÛÛ‘›Ü”]Y\Ý[ÛŠ˜\ÙJNÂˆÛÛœÝ\ÜÛÛ[\ÜÛÛ’YÔUQTÕSÓ—ÐS’Ë™š[\ŠOOœKšYOOX˜\ÙKšY	‰ˆ\ÜÛÛ‘›Ü”]Y\Ý[ÛŠJOOO[\ÜÛÛ’Y
N–×NÂˆÛÛœÝÛÛ˜Ù\TUQTÕSÓ—ÐS’Ë™š[\ŠOOœKšYOOX˜\ÙKšY	‰ˆK˜ÛÛ˜Ù\OOX˜\ÙK˜ÛÛ˜Ù\
NÂˆÛÛœÝØ]YÛÜžOTUQTÕSÓ—ÐS’Ë™š[\ŠOOœKšYOOX˜\ÙKšY	‰ˆK˜Ø]OOX˜\ÙK˜Ø]
NÂˆÛÛœÝÛÛ[\ÜÛÛ‹›[™ÝÛ\ÜÛÛŽ˜ÛÛ˜Ù\›[™ÝØÛÛ˜Ù\˜Ø]YÛÜžNÂˆ™]\›ˆÛÛ›[™ÝÜ˜[™ÛZ^™S[ØÚÔ]Y\Ý[ÛŠÚY™›Y
ÛÛ
VÌJN›[ÂŸB™ØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]ÔÚ[Z[\‰ÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOžÂˆÛÛœÝ][O\™]šY]Ò][\ÖÜ™]šY]Ò[™^NÂˆYŠZ][JH™]\›ŽÂˆÝ\œ™[Ú[Z[\\XÚÔÚ[Z[\”]Y\Ý[ÛŠ][KœJNÂˆÛÛœÝ›ÞYØÝ[Y[™Ù][[Y[žRY
	ÜÚ[Z[\›Þ	ÊNÂˆYŠXÝ\œ™[Ú[Z[\Š^Âˆ›Þ˜Û\ÜÓ\Ý˜Y
	ÜÚÝÉÊNÂˆØÝ[Y[™Ù][[Y[žRY
	ÜÚ[Z[\”]Y\Ý[Û‰ÊK^ÛÛ[Iùãï¹g*8à xàdøàk¹b!ºaã¸àk¹b)yecúhc8àkøà`¸à¢¸ào¸àføà¤øà ‰ÎÂˆØÝ[Y[™Ù][[Y[žRY
	ÜÚ[Z[\“Ü[ÛœÉÊKš[›™\’SIÉÎÂˆØÝ[Y[™Ù][[Y[žRY
	ÜÚ[Z[\‘™YY˜XÚÉÊK^ÛÛ[IÉÎÂˆ™]\›ŽÂˆBˆ›Þ˜Û\ÜÓ\Ý˜Y
	ÜÚÝÉÊNØ›Þ™]\Ù]šYYIÌ	ÎÂˆØÝ[Y[™Ù][[Y[žRY
	ÜÚ[Z[\”]Y\Ý[Û‰ÊK^ÛÛ[XÝ\œ™[Ú[Z[\‹œNÂˆØÝ[Y[™Ù][[Y[žRY
	ÜÚ[Z[\‘™YY˜XÚÉÊK^ÛÛ[IÉÎÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	ÜÚ[Z[\“Ü[ÛœÉÊNÂˆ›ÛÝš[›™\’SIÉÎÂˆÝ\œ™[Ú[Z[\‹›Ü[ÛœË™›Ü‘XXÚ

ËJOOžÂˆÛÛœÝYØÝ[Y[˜Ü™X]Q[[Y[
	Ø]Û‰ÊNÂˆ‹˜Û\ÜÓ˜[YOIÜÚ[Z[\‹[Ü[Û‰ÎÂˆ‹^ÛÛ[X	ÔÝš[™Ë™œ›ÛPÚ\ÛÙJJÚJ_Kˆ	ÛßXÂˆ‹›Û˜ÛXÚÏJ
OOžÂˆÛÛœÝ›ÞYØÝ[Y[™Ù][[Y[žRY
	ÜÚ[Z[\›Þ	ÊNÂˆÛÛœÝšYYX›Þ™]\Ù]šYYOOIÌIÎÂˆYŠOOOXÝ\œ™[Ú[Z[\‹˜J^Âˆ›ÛÝœ]Y\žTÙ[XÝÜ[
	Ø]Û‰ÊK™›Ü‘XXÚ
Ož™\ØX›Y]YJNÂˆ‹˜Û\ÜÓ\Ý˜Y
	ÙÛÛÙ	ÊNÂˆØÝ[Y[™Ù][[Y[žRY
	ÜÚ[Z[\‘™YY˜XÚÉÊK^ÛÛ[Iø«eH9«hú)èûï H	ÊØÝ\œ™[Ú[Z[\‹™^ÂˆÛÛœÝ˜\ÙO\™]šY]Ò][\ÖÜ™]šY]Ò[™^OËœKX˜\ÙOÚ›Ý\›™^Q›ÜŠ˜\ÙKšY
N›[ÂˆYŠ˜\ÙI‰šËœÝYÙOOOIÝ™\šYžIÊ[X\šÒ›Ý\›™^P[œÝÙ\Š˜\ÙKšY]šYY
NÂˆ›Ùš[Kž
Ï]šYYÌŽNÜØ]™T›Ùš[J
NÂˆY[ÙHYŠ]šYY
^Âˆ‹™\ØX›Y]YNØ‹˜Û\ÜÓ\Ý˜Y
	Ø˜Y	ÊNØ›Þ™]\Ù]šYYIÌIÎÂˆØÝ[Y[™Ù][[Y[žRY
	ÜÚ[Z[\‘™YY˜XÚÉÊK^ÛÛ[Iøào¸àh9ëe8àb8àkú(j9é.¸àeøào¸àføà¤øà ¸àä¸àìøàâ;ï&‰ÊÊÝ\œ™[Ú[Z[\‹š[	ùecúhc9¥¡øàk¹§hy.í¸àj:`n9¢§º ¨¸àkº`exàa8à¤¸à ¸àa¹. 9n©¹«å8ànxài¸àcøàh8àexàa8à ‰ÊNÂˆY[Ù^Âˆ›ÛÝœ]Y\žTÙ[XÝÜ[
	Ø]Û‰ÊK™›Ü‘XXÚ
Ož™\ØX›Y]YJNØ‹˜Û\ÜÓ\Ý˜Y
	Ø˜Y	ÊNÜ›ÛÝ˜Ú[™[–ØÝ\œ™[Ú[Z[\‹˜WOË˜Û\ÜÓ\Ý˜Y
	ÙÛÛÙ	ÊNÂˆØÝ[Y[™Ù][[Y[žRY
	ÜÚ[Z[\‘™YY˜XÚÉÊK^ÛÛ[Iù«hú)èøàkÈ	ÊØÝ\œ™[Ú[Z[\‹›Ü[ÛœÖØÝ\œ™[Ú[Z[\‹˜WJÉøà ˆ	ÊØÝ\œ™[Ú[Z[\‹™^ÂˆÛÛœÝ˜\ÙO\™]šY]Ò][\ÖÜ™]šY]Ò[™^OËœNÚYŠ˜\ÙJ[X\šÒ›Ý\›™^P[œÝÙ\Š˜\ÙKšY˜[ÙJNÂˆBˆNÂˆ›ÛÝ˜\[™Ú[
ŠNÂˆJNÂŸJNÂ‚‚™ØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]Ô™\ØÜš\[Û“XZ[‰ÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉËOOžØÛÛœÝZYYK˜Ý\œ™[\™Ù]™]\Ù]œZY™X\ÛÛYK˜Ý\œ™[\™Ù]™]\Ù]œ™X\ÛÛŽÚYŠZY	‰œ™X\ÛÛŠ\Ý\™]šY]Ô™\ØÜš\[ÛŠZY™X\ÛÛŠNßJNÂ™ØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]Ò›Ý\›™^Q\™XÝ	ÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉËOOžØÛÛœÝZYYK˜Ý\œ™[\™Ù]™]\Ù]œZYÚYŠZY
\Ý\›Ý\›™^PXÝ[ÛŠZY
NßJNÂ‚™[˜Ý[ÛˆYÙÜ™YØ]T™X\ÛÛœÊ
^ÂˆÛÛœÝÝ[Ï^ßNÂˆ™]šY]Ò][\Ë™›Ü‘XXÚ
][OOžÂˆÛÛœÝÝ\›Ùš[K›[ØÚÓZ\ÝZÙTÝ]ÏË–Ú][KœKšYNÂˆYŠÝË›\Ý™X\ÛÛŠHÝ[ÖÜÝ›\Ý™X\ÛÛ—OJÝ[ÖÜÝ›\Ý™X\ÛÛ—_
JÌNÂˆJNÂˆ™]\›ˆÝ[ÎÂŸB™[˜Ý[Ûˆš[š\Ú[ØÚÔ™]šY]Ê
^ÂˆØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]ÐØ\™	ÊKœÝ[K™\Ü^OIÛ›Û™IÎÂˆØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]ÔÝ[[X\žIÊK˜Û\ÜÓ\Ý˜Y
	ÜÚÝÉÊNÂ‚ˆÛÛœÝÝ[ÏXYÙÜ™YØ]T™X\ÛÛœÊ
NÂˆÛÛœÝ™X\ÛÛœÏVÉùçéz+f9.#z-¬ÉË	ú*"9ë¥øàçøà®IË	ú*«xàoú`exàa	Ë	Ì¹¢§¸àiú/íøàhøàgÉË	ù¦`ºe¤ù.#z-¬É×NÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	Ü™X\ÛÛ”Ý[[X\žIÊNÂˆ›ÛÝš[›™\’S\™X\ÛÛœË›X\
O˜]ˆÛ\ÜÏHœ™X\ÛÛ‹\Ý[[X\žKXØ\™Ü[ˆÛ\ÜÏHœÝXˆ‰ÜŸOÜÜ[‰ÝÝ[ÖÜ—_yecÏØÙ]˜
Kš›Ú[Š	ÉÊNÂ‚ˆÛÛœÝØ]ÛÝ[Ï^ßNÂˆ™]šY]Ò][\Ë™š[\ŠOžÜ›Û™ÊK™›Ü‘XXÚ
O˜Ø]ÛÝ[ÖÞœK˜Ø]OJØ]ÛÝ[ÖÞœK˜Ø]_
JÌJNÂˆÛÛœÝš[Üš]OSØš™XÝ™[šY\ÊØ]ÛÝ[ÊKœÛÜ

KŠOO˜–ÌWKXVÌWJKœÛXÙJÊNÂˆÛÛœÝÛZ[˜[XÝ\œ™[™]šY]ÑÛZ[˜[™X\ÛÛŠ
NÂˆØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]Ôš[Üš]IÊKš[›™\’S\š[Üš]K›[™ÝˆÈ¹«(xàjùa*¹ab8àfxà¢ùb!ºaãØœ‰Üš[Üš]K›X\

ØË—JOO˜	Øß{ï"	ÛŸyecûï"X
Kš›Ú[Š	È8¡¤ˆ	Ê_OœÜ[ˆÛ\ÜÏHœÝXˆ¹..øàj¹c§ùfè;ï&‰Ù\ØØ\R[
ÛZ[˜[	ù§*º*&:c,‰Ê_xà º*©9ëe8àkùoªyïä¸àêøàï8àâ8àjøà ¹ænúc,¹®"8àoøàiøàfxà ÜÜ[˜ˆˆ	Ïº*©9ëe8àkøà`¸à¢¸ào¸àføà¤øàiøàeøàgøà Ø‰ÎÂˆÛÛœÝ˜YØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]ÔÝ[[X\žR›Ý\›™^IÊKžYØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]ÔÝ[[X\žTž	ÊNÂˆYŠ˜ŠZ˜‹œÝ[K™\Ü^OXXÝ]™T™]šY]Ò›Ý\›™^\Ê
K›[™ÝÉÉÎ‰Û›Û™IÎÂˆYŠžŠ^Üž‹œÝ[K™\Ü^OYÛZ[˜[ÉÉÎ‰Û›Û™IÎÜž‹™]\Ù]œ™X\ÛÛYÛZ[˜[	ÉÎÜž‹™]\Ù]˜Ø]\š[Üš]VÌOË–Ì_ÙXZÙ\ÝÚÚ[

NßB‚ˆ›Ùš[Kž
ÏLLÂˆØ]™T›Ùš[J
NÂŸB™[˜Ý[Ûˆ^][ØÚÔ™]šY]Ê
^ÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔ™]šY]Ó[ÙIÊK˜Û\ÜÓ\Ýœ™[[Ý™J	ÜÚÝÉÊNÂˆØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]ÐØ\™	ÊKœÝ[K™\Ü^OIÉÎÂˆØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]ÔÝ[[X\žIÊK˜Û\ÜÓ\Ýœ™[[Ý™J	ÜÚÝÉÊNÂˆØÝ[Y[™Ù][[Y[žRY
	Û[ØÚÔ™\Ý[	ÊK˜Û\ÜÓ\Ý˜Y
	ÜÚÝÉÊNÂŸB™ØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]Ñ^]	ÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË^][ØÚÔ™]šY]ÊNÂ™ØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]ÔÝ[[X\žP˜XÚÉÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË^][ØÚÔ™]šY]ÊNÂ™ØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]ÔÝ[[X\žR›Ý\›™^IÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOžØÛÛœÝXXÝ]™T™]šY]Ò›Ý\›™^\Ê
VÌNÚYŠŠ\Ý\›Ý\›™^PXÝ[ÛŠ‹šY
NßJNÂ™ØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]ÔÝ[[X\žTž	ÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉËOOžØÛÛœÝ™X\ÛÛYK˜Ý\œ™[\™Ù]™]\Ù]œ™X\ÛÛ‹Ø]YK˜Ý\œ™[\™Ù]™]\Ù]˜Ø]ØÛÛœÝ˜ZÙO^ÚY‰ÉËØ]ÛÛ˜Ù\‰ÉßNØÛÛœÝ\™X\ÛÛ”™\ØÜš\[ÛŠ™X\ÛÛ‹˜ZÙJNÜÚÝÔØÜ™Y[Š	Ü›Ø›[\ÉÊNÜÝ\]Z^Šž‰ÜšÚ[™N‰ØØ]X
NßJNÂ‚‚‹ËÈ[›™\ˆÕTH›ÝÈ™Y›XÝÈ™X[[ØÚÈ][\È\ÈÙ[\ÈÜ™[˜\žH›Ø›[HÙ\ÜÚ[ÛœË‚˜ÛÛœÝÜ›ØYX\]UŒLÏ\›ØYX\]NÂœ›ØYX\]OY[˜Ý[ÛŠ
^ÂˆÛÛœÝ]OWÜ›ØYX\]UŒLÊ
NÂˆYŠ]K›[™Ý
^ÂˆÛÛœÝ[ØÚÐÛÝ[J›Ùš[K›[ØÚÒ\ÝÜž_×JK›[™ÝÂˆÛÛœÝÙ\ÜÚ[ÛÛÝ[J›Ùš[KœÙ\ÜÚ[Ûœß×JK›[™ÝÂˆÛÛœÝSX]›Z[ŠLX]œ›Ý[™


[ØÚÐÛÝ[
ŒŠÜÙ\ÜÚ[ÛÛÝ[
KÌLŠJŒL
JNÂˆ]VÙ]K›[™ÝLWKœÝSX]›X^
]VÙ]K›[™ÝLWKœÝ
NÂˆ]VÙ]K›[™ÝLWK™\ØÏIùo,yà®y¯%9ïä¸àîùoªyïä¸àîùéäyæëHSÐÒÉÎÂˆBˆ™]\›ˆ]NÂŸNÂ‚‚‚‚‹ËÈOOOOHˆX\›š[™È\ÝÜžH[˜[]XÜÈOOOOB˜ÛÛœÝSSUPÔ×ÐÐUQÓÔ’QTÏVÉùgî¹é#¹ä!º*å‰Ë	øà¬øàìøàå8àéxàï8à¯ÉË	øàáøàï8à¯øàæxàï8à®IË	øàãxààøàâ8àëøàï8à«ÉË	øà®øà«xàéxàê¸àá¸à¨ÉË	øà¨¸àêøà­8àê¸à®¸àè	Ë	øàç¸àãxà®8àèxàìøàâ	Ë	øà®xàâ8àêxàá¸à®	×NÂ‚™[˜Ý[Ûˆ[˜[]XÜÑ]SZ[\Ê^\Ê^Ü™]\›ˆØØ[]RTÓÊY^\Ê_B™[˜Ý[Ûˆ[˜[]XÜÓZ[]\Ê^\Ê^Âˆ]Ý[LÂˆ›ÜŠ]OLÚO^\ÎÚJÊÊHÝ[
ÏS[X™\Š›Ùš[K˜XÝ]š]OË–Ø[˜[]XÜÑ]SZ[\ÊJWOË›Z[]\ß
NÂˆ™]\›ˆÝ[ÂŸB™[˜Ý[Ûˆ[˜[]XÜÐXÝ]™Q^\Ê^\Ê^Âˆ]LÙ›ÜŠ]OLÚO^\ÎÚJÊÊZYŠ[X™\Š›Ùš[K˜XÝ]š]OË–Ø[˜[]XÜÑ]SZ[\ÊJWOË›Z[]\ß
OŒ
[ŠÊÎÜ™]\›ˆŽÂŸB™[˜Ý[Ûˆ[˜[]XÜÐ][\Ý™X[J
^ÂˆÛÛœÝ›ÝÜÏV×NÂˆ
›Ùš[KœÙ\ÜÚ[Ûœß×JK™›Ü‘XXÚ

ËÚJOOŠË›Ùß×JK™›Ü‘XXÚ

JOOœ›ÝÜËœ\Ú
Ù]NœË™]KØ]ž˜Ø]ÚÎˆH^›ÚËÜ™\ŽœÚJŒL
ÛKÛÝ\˜ÙN‰ÜÙ\ÜÚ[Û‰ßJJJNÂˆ
›Ùš[K›[ØÚÒ\ÝÜž_×JK™›Ü‘XXÚ

JOOŠ™]Z[ß×JK™›Ü‘XXÚ

JOOžÂˆÛÛœÝOTUQTÕSÓ—ÐS’Ë™š[™
OžšYOOYšY
NÚYŠ\J\™]\›ŽÂˆ›ÝÜËœ\Ú
Ù]Nš™]KØ]œK˜Ø]ÚÎ™˜[œÝÙ\’[™^OO[[	‰™˜[œÝÙ\’[™^OOY˜ÛÜœ™XÝ[™^Ü™\ŽšJŒL
ÙJÍLÛÝ\˜ÙN‰Û[ØÚÉßJNÂˆJJNÂˆ™]\›ˆ›ÝÜËœÛÜ

KŠOO”Ýš[™Ê‹™]JK›ØØ[PÛÛ\\™JÝš[™ÊK™]JJ_K›Ü™\‹X‹›Ü™\ŠNÂŸB™[˜Ý[Ûˆ[˜[]XÜÕ™[™
Ø]
^ÂˆÛÛœÝ›ÝÜÏX[˜[]XÜÐ][\Ý™X[J
K™š[\ŠOž˜Ø]OOXØ]
NÂˆÛÛœÝ™XÙ[\›ÝÜËœÛXÙJL
K™]š[Ý\Ï\›ÝÜËœÛXÙJLŒ
NÂˆYŠ™XÙ[›[™Ýß™]š[Ý\Ë›[™ÝÊ\™]\›ˆÙ[N›[™XÙ[›[™]š[Ý\Î›[Žœ›ÝÜË›[™ÝNÂˆÛÛœÝÝXOO“X]œ›Ý[™
K™š[\ŠOž›ÚÊK›[™ÝØK›[™Ý
ŒL
NÂˆÛÛœÝ\Ý
™XÙ[
K\Ý
™]š[Ý\ÊNÜ™]\›ˆÙ[Nœ‹\™XÙ[œ‹™]š[Ý\ÎœŽœ›ÝÜË›[™ÝNÂŸB™[˜Ý[Ûˆ[˜[]XÜÐØ]YÛÜžTÛ˜\ÚÝ
Ø]
^Âˆ]][\ÏLÛÜœ™XÝLÂˆUQTÕSÓ—ÐS’Ë™š[\ŠOOœK˜Ø]OOXØ]
K™›Ü‘XXÚ
OOžØÛÛœÝÏ\›Ùš[KœTÝ]ÏË–ÜKšYNÚYŠÊ^Ø][\ÊÏ\Ë˜][\ßØÛÜœ™XÝ
Ï\Ë˜ÛÜœ™XÝ_JNÂˆÛÛœÝXØÝ\˜XÞOX][\ÏÓX]œ›Ý[™
ÛÜœ™XÝØ][\ÊŒL
N›[Âˆ™]\›ˆØØ]][\ËXØÝ\˜XÞKX\Ý\žN“X]œ›Ý[™
›Ùš[KœÚÚ[ÏË–ØØ]OÏÍL
K™[™˜[˜[]XÜÕ™[™
Ø]
_NÂŸB™[˜Ý[Ûˆ[˜[]XÜÕ™[™Û\ÜÊ[J^Ü™]\›ˆ[OO[[ÉÙ›]	Î™[ONÉÝ\	Î™[OKNÉÙÝÛ‰Î‰Ù›]	ßB™[˜Ý[Ûˆ[˜[]XÜÕ™[™^

^ÂˆYŠ™[OO[[
\™]\›ˆ	øàáøàï8à¯ùo¡xàhIÎÂˆYŠ™[ON
\™]\›ˆ8¡¤H
ÉÝ™[_\ÂˆYŠ™[OKN
\™]\›ˆ8¡¤È	Ý™[_\Âˆ™]\›ˆ8¡¤ˆ	Ý™[OŒÉÊÉÎ‰ÉßIÝ™[_\ÂŸB™[˜Ý[Ûˆ™[™\[˜[]XÜÒX]X\

^ÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÒX]X\	ÊNÚYŠ\›ÛÝ
\™]\›ŽÂˆÛÛœÝ˜[ÏV×NÙ›ÜŠ]OLŽNÚOLÚKKJ]˜[Ëœ\Ú
Ù]N˜[˜[]XÜÑ]SZ[\ÊJKZ[Ž“[X™\Š›Ùš[K˜XÝ]š]OË–Ø[˜[]XÜÑ]SZ[\ÊJWOË›Z[]\ß
_JNÂˆÛÛœÝX^SX]›X^
K‹‹˜[Ë›X\
Ož›Z[ŠJNÂˆ›ÛÝš[›™\’S]˜[Ë›X\
OžØÛÛœÝ˜][Ï^›Z[‹ÛX^ØÛÛœÝ^›Z[LÉÉÎœ˜][ÏKŒOÉÛŒIÎœ˜][ÏKOÉÛŒ‰Îœ˜][ÏKÍOÉÛŒÉÎ‰Û	ÎÜ™]\›ˆ]ˆÛ\ÜÏH˜[˜[]XÜËY^H	ÛŸH	Þ™]OOO[ØØ[]RTÓÊ
OÉÝÙ^IÎ‰ÉßHˆ]OH‰Þ™]_{ï&‰Þ›Z[Ÿyb!ˆÙ]˜JKš›Ú[Š	ÉÊJØ]ˆÛ\ÜÏH˜[˜[]XÜËZX]X\[X™[ÈˆÝ[OH™ÜšYXÛÛ[[ŽŒKËLHÜ[‰Ý˜[ÖÌK™]KœÛXÙJJ_OÜÜ[Ü[¹.â¹¥éOÜÜ[Ù]˜ÂŸB™[˜Ý[Ûˆ™[™\[˜[]XÜÔÚYÛ˜[ÊÛ˜\Ê^ÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÔÚYÛ˜[ÉÊNÚYŠ\›ÛÝ
\™]\›ŽÂˆÛÛœÝ\ØX›O\Û˜\Ë™š[\ŠOž™[™™[HO[[
NÂˆYŠ]\ØX›K›[™Ý
^Ü›ÛÝš[›™\’SIÏ]ˆÛ\ÜÏH˜[˜[]XÜË\ÚYÛ˜[™]]˜[]ˆÛ\ÜÏH˜[˜[]XÜË\ÚYÛ˜[]Ü¹«å:/ øàáøàï8à¯øà¤ºfá¸à xài¸àa8ào¸àfOØÜ[ˆÛ\ÜÏH˜[˜[]XÜËY[H¸ %ÜÜ[Ù]¹d#8àf9b!ºaã¸àiÌŒ9fç¹ëe8ànøàjz$á9êcxàfxà¢øàj8à yæí:/äLL9fç¹ëe8àj8àgxàk¹bcLL9fç¹ëe8à¤¹«å:/ øàeøài¹/.8àløà¤º(j9é.¸àeøào¸àfxà ÜÙ]‰ÎÜ™]\›ŽßBˆÛÛœÝ™\ÝVË‹‹\ØX›WKœÛÜ

KŠOO˜‹™[™™[KXK™[™™[JVÌKÛÜœÝVË‹‹\ØX›WKœÛÜ

KŠOO˜K™[™™[KX‹™[™™[JVÌNÂˆ]Ø\™ÏV×NÂˆYŠ™\Ý™[™™[OŒ
XØ\™Ëœ\Ú
]ˆÛ\ÜÏH˜[˜[]XÜË\ÚYÛ˜[ÛÛÙ]ˆÛ\ÜÏH˜[˜[]XÜË\ÚYÛ˜[]Ü¼'äâ9/.8àlûï&‰Ø™\Ý˜Ø]OØÜ[ˆÛ\ÜÏH˜[˜[]XÜËY[HŠÉØ™\Ý™[™™[_\ÜÜ[Ù]¹æí:/äLL9fç¹ëe	Ø™\Ý™[™œ™XÙ[IH8¡¤8àgxàk¹bcH	Ø™\Ý™[™œ™]š[Ý\ßIOÜÙ]˜
NÂˆYŠÛÜœÝ™[™™[O
XØ\™Ëœ\Ú
]ˆÛ\ÜÏH˜[˜[]XÜË\ÚYÛ˜[˜Y]ˆÛ\ÜÏH˜[˜[]XÜË\ÚYÛ˜[]Ü¼'å#ˆ:) y¬ê9¡#ûï&‰ÝÛÜœÝ˜Ø]OØÜ[ˆÛ\ÜÏH˜[˜[]XÜËY[H‰ÝÛÜœÝ™[™™[_\ÜÜ[Ù]¹æí:/äLL9fç¹ëe	ÝÛÜœÝ™[™œ™XÙ[IH8¡¤8àgxàk¹bcH	ÝÛÜœÝ™[™œ™]š[Ý\ßIOÜÙ]˜
NÂˆYŠXØ\™Ë›[™Ý
XØ\™Ëœ\Ú
	Ï]ˆÛ\ÜÏH˜[˜[]XÜË\ÚYÛ˜[™]]˜[]ˆÛ\ÜÏH˜[˜[]XÜË\ÚYÛ˜[]Ü¸¡¤ˆ9§ :/äxàkùk¢yk¦ØÜ[ˆÛ\ÜÏH˜[˜[]XÜËY[H¹ª*¸àl8àaÜÜ[Ù]¹«å:/ ùcëú ïxàj¹b!ºaã¸àiøàkøà yi)øàcxàj¹."¹¦!øàîù/c¹."øàkú)¢øà¢xà£8ào¸àføà¤øà ÜÙ]‰ÊNÂˆ›ÛÝš[›™\’SXØ\™Ëš›Ú[Š	ÉÊNÂŸB™[˜Ý[Ûˆ™[™\[˜[]XÜÐØ]YÛÜšY\ÊÛ˜\Ê^ÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÐØ]YÛÜšY\ÉÊNÚYŠ\›ÛÝ
\™]\›ŽÂˆ›ÛÝš[›™\’S\Û˜\Ë›X\
OžØÛÛœÝXØÏ^˜XØÝ\˜XÞOO[[Éø %	Î˜	Þ˜XØÝ\˜XÞ_IX˜\^˜XØÝ\˜XÞOO[[Þ›X\Ý\žNž˜XØÝ\˜XÞKÏX[˜[]XÜÕ™[™Û\ÜÊ™[™™[JNÜ™]\›ˆ]ˆÛ\ÜÏH˜[˜[]XÜËXØ]YÛÜžK\›ÝÈ]ˆÛ\ÜÏH˜[˜[]XÜËXØ]YÛÜžK[˜[YH‰Þ˜Ø]OÙ]]ˆÛ\ÜÏH˜[˜[]XÜËXØ]X˜\ˆ]ˆÛ\ÜÏH˜[˜[]XÜËXØ]Yš[ˆÝ[OHÚY‰Ø˜\ŸIHÙ]Ù]]ˆÛ\ÜÏH˜[˜[]XÜËXØ][Y]šXÈ¹«hùëe	ØXØßOÙ]]ˆÛ\ÜÏH˜[˜[]XÜËXØ][Y]šXÈ¹ïä¹á§È	Þ›X\Ý\ž_IOÙ]]ˆÛ\ÜÏH˜[˜[]XÜË]™[™XÚ\	ÝßH‰Ø[˜[]XÜÕ™[™^
™[™
_OÙ]Ù]˜JKš›Ú[Š	ÉÊNÂŸB™[˜Ý[Ûˆ[˜[]XÜÒ›Ý\›™^PÛÝ[Ê
^ÂˆÛÛœÝœÏSØš™XÝ˜[Y\Ê›Ùš[Kœ™]šY]Ò›Ý\›™^\ßßJKÛÝ[\ÝYÙOOšœË™š[\ŠOš‹œÝYÙOOO\ÝYÙJK›[™ÝÂˆ™]\›ˆÜ™[X\›Ž˜ÛÝ[
	Ü™[X\›‰ÊK™\šYžN˜ÛÝ[
	Ý™\šYžIÊKÜXÙY˜ÛÝ[
	ÜÜXÙY	ÊKÝX›N˜ÛÝ[
	ÜÝX›IÊ_NÂŸB™[˜Ý[Ûˆ™[™\[˜[]XÜÒ›Ý\›™^\Ê
^ÂˆÛÛœÝÛÝ[ÏX[˜[]XÜÒ›Ý\›™^PÛÝ[Ê
NÂˆØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÔÝX›UÝ[	ÊK^ÛÛ[XÛÝ[ËœÝX›NÂˆÛÛœÝÝYÙOYØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÒ›Ý\›™^TÝYÙ\ÉÊNÚYŠÝYÙJ\ÝYÙKš[›™\’SX]ˆÛ\ÜÏH˜[˜[]XÜË\ÝYÙH‰ØÛÝ[Ëœ™[X\›ŸOØÜ[¹¥fy§dÜÜ[Ù]]ˆÛ\ÜÏH˜[˜[]XÜË\ÝYÙH‰ØÛÝ[Ë™\šYž_OØÜ[ºhgºhcÜÜ[Ù]]ˆÛ\ÜÏH˜[˜[]XÜË\ÝYÙH‰ØÛÝ[ËœÜXÙYOØÜ[¹o£9¥éyo¡xàhOÜÜ[Ù]]ˆÛ\ÜÏH˜[˜[]XÜË\ÝYÙH‰ØÛÝ[ËœÝX›_OØÜ[¹k¦¹ç`ÜÜ[Ù]˜ÂˆÛÛœÝÝX›OSØš™XÝ˜[Y\Ê›Ùš[Kœ™]šY]Ò›Ý\›™^\ßßJK™š[\ŠOš‹œÝYÙOOOIÜÝX›IÊKœÛÜ

KŠOO”Ýš[™Ê‹˜ÛÛ\]Y]	ÉÊK›ØØ[PÛÛ\\™JÝš[™ÊK˜ÛÛ\]Y]	ÉÊJJKœÛXÙJŠNÂˆÛÛœÝ\ÝYØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÔÝX›S\Ý	ÊNÚYŠ\Ý
[\Ýš[›™\’S\ÝX›K›[™ÝÜÝX›K›X\
O˜]ˆÛ\ÜÏH˜[˜[]XÜË\ÝX›KZ][H‰Ù\ØØ\R[
‹˜ÛÛ˜Ù\
_OØÜ[‰Ù\ØØ\R[
‹˜ÛÛ\]Y]	ùk¦¹ç`	Ê_OÜÜ[Ù]˜
Kš›Ú[Š	ÉÊN‰Ï]ˆÛ\ÜÏH˜[˜[]XÜËY›Ü›X]Y[\H¸ào¸àh9k¦¹ç`8ào¸àiùk£9.¡¸àeøàgùoªyïä¸àêøàï8àâ8àkøà`¸à¢¸ào¸àføà¤øà Ù]‰ÎÂŸB™[˜Ý[Ûˆ[˜[]XÜÐ‘›Ü›X]›ÝÜÊ
^ÂˆÛÛœÝX\^ßNØÛÛœÝYJ˜[YKÚÊOOžÚYŠ[˜[YJ\™]\›ŽÚYŠ[X\Û˜[YWJ[X\Û˜[YWO^Û˜[YKÝ[ŒÛÜœ™XÝŒNÛX\Û˜[YWKÝ[
ÊÎÚYŠÚÊ[X\Û˜[YWK˜ÛÜœ™XÝ
ÊßNÂˆËÈ[ÛÜš]HZ[šH[ØÚÎˆ[]Y\Ý[ÛœÈ\™H[\›YYX]K\Ý]H™YXÝ[Û‹‚ˆ
›Ùš[K˜“[ØÚÒ\ÝÜž_×JK™›Ü‘XXÚ
OŠ™]Z[ß×JK™›Ü‘XXÚ
O˜Y
	ú`%9.+yâ­¹¡bÉËHY›ÚÊJJNÂˆËÈÛÛ\Ý[™Ú[[™ÙHÝÜ™\ÈH]Y\Ý[ÛˆÚ[™[ˆŒÍŠÈ\ÝÜžK‚ˆ
›Ùš[K˜ÛÛ\Ý[™\ÝÜž_×JK™›Ü‘XXÚ
OŠ™]Z[ß×JK™›Ü‘XXÚ
O˜Y
šÚ[™	ùaé¹ä!¹íd9§§	ËHY›ÚÊJJNÂˆËÈ[ÝXš™XÝPˆ˜XÝXÙH[™XYHÝÜ™\È›Ü›X[^™Y›Ü›X]˜[Y\Ë‚ˆ
›Ùš[K˜‘š[˜[\ÝÜž_×JK™›Ü‘XXÚ
OŠ™]Z[ß×JK™›Ü‘XXÚ
O˜Y
™›Ü›X]
šÚ[™OOIÜÙXÝ\š]IÏÉøà¬xàï8à®yb)9¥«IÎ‰ùaé¹ä!¹íd9§§	ÊKHY›ÚÊJJNÂˆËÈÙXÝ\š]HZ[šH[ØÚÎˆ[™™\ˆÙË\™XY[™ÈœÈØÙ[˜\š[ÈYÛY[œ›ÛH]ÈÛÝ\˜ÙHØÙ[˜\š[Ë‚ˆ
›Ùš[KœÙXÝ\š]S[ØÚÒ\ÝÜž_×JK™›Ü‘XXÚ
OŠ™]Z[ß×JK™›Ü‘XXÚ
OžØÛÛœÝÏTÑPÕT’UWÔÐÑST’SÔË™š[™
OžšYOOYœØÙ[˜\š[ÒY
NØY
ÏË›ÙÏÉøàëxà¬:*«z)èÉÎ‰øà¬xàï8à®yb)9¥«IËHY›ÚÊ_JJNÂˆ™]\›ˆØš™XÝ˜[Y\ÊX\
KœÛÜ

KŠOO˜‹Ý[XKÝ[
NÂŸB™[˜Ý[Ûˆ™[™\[˜[]XÜÐ‘›Ü›X]Ê
^ÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÐ‘›Ü›X]ÉÊNÚYŠ\›ÛÝ
\™]\›ŽØÛÛœÝ›ÝÜÏX[˜[]XÜÐ‘›Ü›X]›ÝÜÊ
NÂˆYŠ\›ÝÜË›[™Ý
^Ü›ÛÝš[›™\’SIÏ]ˆÛ\ÜÏH˜[˜[]XÜËY›Ü›X]Y[\H¹éäyæë¸àk¹k§ù¢)¸àè¸àï8àâxà¤º)èøàcøàj8à z`%9.+yâ­¹¡bøàîùên¹«!:(ç9aaxàîøà¬xàï8à®yb)9¥«xàj¸àjxàk¹oh¹o#ùb)y«hùëe9ã¡øà¤º(j9é.¸àeøào¸àfxà Ù]‰ÎÜ™]\›ŽßBˆ›ÛÝš[›™\’S\›ÝÜË›X\
OžØÛÛœÝÝSX]œ›Ý[™
˜ÛÜœ™XÝÞÝ[
ŒL
NÜ™]\›ˆ]ˆÛ\ÜÏH˜[˜[]XÜËY›Ü›X]\›ÝÈ]ˆÛ\ÜÏH˜[˜[]XÜËY›Ü›X][˜[YH‰Ù\ØØ\R[
›˜[YJ_OÙ]]ˆÛ\ÜÏH˜[˜[]XÜËY›Ü›X]X˜\ˆ]ˆÛ\ÜÏH˜[˜[]XÜËY›Ü›X]Yš[ˆÝ[OHÚY‰ÜÝIHÙ]Ù]]ˆÛ\ÜÏH˜[˜[]XÜËY›Ü›X]\ØÛÜ™H‰ÜÝIH
	Þ˜ÛÜœ™XÝKÉÞÝ[JOÙ]Ù]˜JKš›Ú[Š	ÉÊNÂŸB™[˜Ý[Ûˆ™[™\[˜[]XÜÓ™^
Û˜\Ê^ÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÓ™^	ÊNÚYŠ\›ÛÝ
\™]\›ŽÂˆÛÛœÝXÝ]™OXXÝ]™T™]šY]Ò›Ý\›™^\Ê
NÂˆYŠXÝ]™K›[™Ý
^ØÛÛœÝXXÝ]™VÌNÜ›ÛÝš[›™\’SX]ˆÛ\ÜÏH˜[˜[]XÜË[™^ZXÛÛˆ¼'å OÙ]]‰Ù\ØØ\R[
‹˜ÛÛ˜Ù\
_xàk¹oªyïä¸àêøàï8àâ8à¤¹í¦¸àdxà¢ÏØÜ[‰Ù\ØØ\R[
›Ý\›™^QÝZY[˜ÙJŠJ_OÜÜ[]Ûˆ]KX[˜[]XÜË[™^XXÝ[Û¹oªyïä¸à¤¹í¦¸àdxà¢È8¡¤Ø]ÛÙ]˜Ü›ÛÝœ]Y\žTÙ[XÝÜŠ	ÖÙ]KX[˜[]XÜË[™^XXÝ[Û—IÊK›Û˜ÛXÚÏJ
OOœÝ\›Ý\›™^PXÝ[ÛŠ‹šY
NÜ™]\›ŽßBˆÛÛœÝ][\Y\Û˜\Ë™š[\ŠOž˜][\ÏLÉ‰ž˜XØÝ\˜XÞHO[[
NÂˆYŠ][\Y›[™Ý
^ØÛÛœÝÙXZÏVË‹‹˜][\YKœÛÜ

KŠOO˜K˜XØÝ\˜XÞKX‹˜XØÝ\˜XÞ_K›X\Ý\žKX‹›X\Ý\žJVÌNÜ›ÛÝš[›™\’SX]ˆÛ\ÜÏH˜[˜[]XÜË[™^ZXÛÛˆ¼'ã«ÏÙ]]‰ÝÙXZË˜Ø]xà¤ŒL9ecøàiùè®º*£OØÜ[¹í+ùêcy«hùëe9ã¡È	ÝÙXZË˜XØÝ\˜XÞ_Ixàîùïä¹á§ùn©ˆ	ÝÙXZË›X\Ý\ž_Ixàiøàfxà ¹ãï¹g*8à ¸àhøàj8à ¹è®º*£yb®y§§8àc:jæ8àa9b!ºaã¸àiøàfxà ÜÜ[]Ûˆ]KX[˜[]XÜË[™^XXÝ[Ûº"é¹¢bùå.úgh¸àiùè®º*£H8¡¤Ø]ÛÙ]˜Ü›ÛÝœ]Y\žTÙ[XÝÜŠ	ÖÙ]KX[˜[]XÜË[™^XXÝ[Û—IÊK›Û˜ÛXÚÏJ
OOœÚÝÔØÜ™Y[Š	ÝÙXZÉÊNÜ™]\›ŽßBˆ›ÛÝš[›™\’SIÏ]ˆÛ\ÜÏH˜[˜[]XÜË[™^ZXÛÛˆ¼'ã,OÙ]]¸ào¸àf¹¯%9ïä¸àáøàï8à¯øà¤ºfá¸à xà¢ÏØÜ[¸ào¸àh9b!¹§¤8àjùoáz) xàj¹fç¹ëe9¥l8àc9l$xàj¸àa8àgøà xà y.â¹¥éxàk¹ki¹ïä¸à¡8àêxàìøàà8àè9ecúhc8à¤º`,¸à xà¢øàj9b!¹§¤9ì¯¹n©¸àc9."¸àc8à¢¸ào¸àfxà ÜÜ[Ù]‰ÎÂŸB˜ÛÛœÝŒÍÓPT“’S‘×ÓÕUÓÓQT×ÔÔPÏSØš™XÝ™œ™Y^™JÂˆ™\œÚ[ÛŽ‰ÝŒÍ	Ëˆ›Ùš[TØÚ[XPÚ[™ÙN™˜[ÙKˆ™[™Ú[™ÝÓX^ŒLˆ™[™Ú[™ÝÓZ[ŽŒËˆYX[š[™Ù[[NŽˆÛÜ™[™Î‰Ü™XÛÜ™YX[œÝÙ\‹]Ú[™ÝÜÉÂŸJNÂ‚™[˜Ý[Ûˆ[˜[]XÜÓÝ]ÛÛYU™[™ŒÍ
Ø]
^ÂˆÛÛœÝ›ÝÜÏX[˜[]XÜÐ][\Ý™X[J
K™š[\ŠOž˜Ø]OOXØ]
NÂˆÛÛœÝ™XÙ[\›ÝÜËœÛXÙJŒÍÓPT“’S‘×ÓÕUÓÓQT×ÔÔPË™[™Ú[™ÝÓX^
NÂˆÛÛœÝ™]š[Ý\Ï\›ÝÜËœÛXÙJŒÍÓPT“’S‘×ÓÕUÓÓQT×ÔÔPË™[™Ú[™ÝÓX^ŒÍÓPT“’S‘×ÓÕUÓÓQT×ÔÔPË™[™Ú[™ÝÓX^
ŒŠNÂˆÛÛœÝ™\Ý[^ØØ][N›[™XÙ[›[™]š[Ý\Î›[™XÙ[Žœ™XÙ[›[™Ý™]š[Ý\ÓŽœ™]š[Ý\Ë›[™ÝÝ[™XÛÜ™Yœ›ÝÜË›[™ÝNÂˆYŠ™XÙ[›[™ÝŒÍÓPT“’S‘×ÓÕUÓÓQT×ÔÔPË™[™Ú[™ÝÓZ[Ÿ™]š[Ý\Ë›[™ÝŒÍÓPT“’S‘×ÓÕUÓÓQT×ÔÔPË™[™Ú[™ÝÓZ[Š\™]\›ˆ™\Ý[ÂˆÛÛœÝÝXOO“X]œ›Ý[™
K™š[\ŠOž›ÚÊK›[™ÝØK›[™Ý
ŒL
NÂˆ™\Ý[œ™XÙ[\Ý
™XÙ[
NÜ™\Ý[œ™]š[Ý\Ï\Ý
™]š[Ý\ÊNÜ™\Ý[™[O\™\Ý[œ™XÙ[\™\Ý[œ™]š[Ý\ÎÂˆ™]\›ˆ™\Ý[ÂŸB‚™[˜Ý[ÛˆX\›š[™ÓÝ]ÛÛYT™\ÜXÚ\Ú[Û•ŒÍ
ÜÙ]™[“Z[]\ÏLÙ]™[XÝ]™Q^\ÏL™[™ÏV×KÛ˜\ÚÝÏV×KXÝ]™T™]šY]Ï[[O^ßJ^ÂˆÛÛœÝ\ØX›OJ™[™ß×JK™š[\ŠO“[X™\‹š\Ñš[š]JË™[JJNÂˆÛÛœÝÜ›ÝÝ]\ØX›K™š[\ŠOž™[OUŒÍÓPT“’S‘×ÓÕUÓÓQT×ÔÔPË›YX[š[™Ù[[JKœÛÜ

KŠOO˜‹™[KXK™[JVÌ_[Âˆ]Ü›ÝÝÝ]OIÜ[™[™ÉÎÂˆYŠÜ›ÝÝ
YÜ›ÝÝÝ]OIÙÜ›ÝÝ	ÎÂˆ[ÙHYŠ\ØX›K›[™Ý
YÜ›ÝÝÝ]OIÜÝX›IÎÂ‚ˆ]™^^ÚÚ[™‰ØÛÛXÝ	Ë]N‰øào¸àf¹¯%9ïä¸àáøàï8à¯øà¤ºfá¸à xà¢ÉË]Z[‰ùfç¹ëe8àc9h¥øàb8à¢øàj8à y«(xàjù/.8àl8àfyb!ºaã¸à¤¸à¢8à¢¹amù/dùæ¡8àjù¨b9a¡xàiøàcxào¸àfxà ‰ßNÂˆYŠXÝ]™T™]šY]ÏË˜ÛÛ˜Ù\
^Âˆ™^^ÚÚ[™‰Ü™]šY]ÉË]N˜	ØXÝ]™T™]šY]Ë˜ÛÛ˜Ù\xàk¹oªyïä¸à¤¹í¦¸àdxà¢Ø]Z[˜XÝ]™T™]šY]Ë™ÝZY[˜Ù_	ú`,º(c9.+xàk¹oªyïä¸àêøàï8àâ8à¤¹k£9.¡¸àfxà¢øàj8à yk¦¹ç`8ào¸àiøài8àj¸àc8à¢¸ào¸àfxà ‰ßNÂˆY[Ù^ÂˆÛÛœÝ][\YJÛ˜\ÚÝß×JK™š[\ŠO“[X™\ŠË˜][\ÊOLÉ‰“[X™\‹š\Ñš[š]JË˜XØÝ\˜XÞJJNÂˆYŠ][\Y›[™Ý
^ÂˆÛÛœÝÙXZÏVË‹‹˜][\YKœÛÜ

KŠOO˜K˜XØÝ\˜XÞKX‹˜XØÝ\˜XÞ_K›X\Ý\žKX‹›X\Ý\žJVÌNÂˆ™^^ÚÚ[™‰ØØ]YÛÜžIËØ]ÙXZË˜Ø]]N˜	ÝÙXZË˜Ø]xà¤¹«(xàjùè®º*£X]Z[˜9í+ùêcy«hùëe9ã¡È	ÝÙXZË˜XØÝ\˜XÞ_Ixàîùïä¹á§ùn©ˆ	ÝÙXZË›X\Ý\ž_Ixà¤¸à ¸àj8àjú`n8à¤øàiøàa8ào¸àfxà ˜NÂˆBˆB‚ˆ™]\›ˆÂˆXÝ]š]NžÛZ[]\Î“X]›X^
[X™\ŠÙ]™[“Z[]\Ê_
KXÝ]™Q^\Î“X]›X^
[X™\ŠÙ]™[XÝ]™Q^\Ê_
_KˆÜ›ÝÝÝ]KˆÜ›ÝÝˆ™^ˆ\ÜÔ›Ø˜Xš[]N™˜[ÙBˆNÂŸB‚™[˜Ý[ÛˆX\›š[™ÓÝ]ÛÛYT™\ÜŒÍ

^ÂˆÛÛœÝÛ˜\ÚÝÏPSSUPÔ×ÐÐUQÓÔ’QTË›X\
[˜[]XÜÐØ]YÛÜžTÛ˜\ÚÝ
NÂˆÛÛœÝ™[™ÏPSSUPÔ×ÐÐUQÓÔ’QTË›X\
[˜[]XÜÓÝ]ÛÛYU™[™ŒÍ
NÂˆÛÛœÝXÝ]™OXXÝ]™T™]šY]Ò›Ý\›™^\Ê
VÌ_[Âˆ™]\›ˆX\›š[™ÓÝ]ÛÛYT™\ÜXÚ\Ú[Û•ŒÍ
ÂˆÙ]™[“Z[]\Î˜[˜[]XÜÓZ[]\ÊÊKˆÙ]™[XÝ]™Q^\Î˜[˜[]XÜÐXÝ]™Q^\ÊÊKˆ™[™ËˆÛ˜\ÚÝËˆXÝ]™T™]šY]Î˜XÝ]™OÞØÛÛ˜Ù\˜XÝ]™K˜ÛÛ˜Ù\ÝZY[˜ÙNš›Ý\›™^QÝZY[˜ÙJXÝ]™J_N›[ˆJNÂŸB‚˜ÛÛœÝŒÍWÑVSWÔPÑWÔ‘TÑS•USÓ—ÔÔPÏSØš™XÝ™œ™Y^™JÂˆ™\œÚ[ÛŽ‰ÝŒÍIËˆ›Ùš[TØÚ[XPÚ[™ÙN™˜[ÙKˆ]šY[˜ÙP˜\Ú\Î‰Ù^\Ý[™ËY^[K\XÙK\Ý]\ÉËˆ\\”š[Üš]NYKˆ\ÜÔ›Ø˜Xš[]N™˜[ÙBŸJNÂ‚™[˜Ý[Ûˆ^[TXÙSÝ]ÛÛYQXÚ\Ú[Û•ŒÍJ^ßJ^ÂˆÛÛœÝ˜\Ù[[™OSX]›X^
X]œ›Ý[™
[X™\ŠË˜˜\Ù[[™J_
JNÂˆÛÛœÝY™™XÝ]™OSX]›X^
X]œ›Ý[™
[X™\ŠË™Y™™XÝ]™J_˜\Ù[[™JJNÂˆÛÛœÝ^\ÏS[X™\‹š\Ñš[š]J[X™\ŠË™^\ÊJOÓ[X™\Š™^\ÊN›[ÂˆÛÛœÝ\ÙO\Ëœ\ÙOË›˜[Y_	ú`&¹n.9ki¹ïä‰ÎÂˆÛÛœÝ\ÙRXÛÛ\Ëœ\ÙOËšXÛÛŸ	ü'äáIÎÂˆYŠ\Ëš\Ñ^[J^Âˆ™]\›ˆÜÝ]N‰Ý[œÙ]	ËÛ™N‰Û™]]˜[	ËXÛÛŽ‰ü'äáIË]N‰ùcåúj$ù¥éxà¤º*+yk¦¸àfxà¢øàj:(j9é.‰Ë]Z[‰ùki¹ïäº*"9å.øàiùcåúj$ù.¢9k¦¹¥éxà¤º*+yk¦¸àfxà¢øàj8à Q‘HUQTÕ9a¡xàk¹«¢øà¢¹ki¹ïäºaãøàj9ki¹ïä¸àæ¸àï8à®xà¤¸àdøàdøàiøà ¹è®º*£xàiøàcxào¸àfxà ‰ßNÂˆBˆYŠË™^\™Y
^Âˆ™]\›ˆÜÝ]N‰Ù^\™Y	ËÛ™N‰ÝØ\›‰ËXÛÛŽ‰ü'äáIË]N‰ùcåúj$ù¥éxà¤¹¦í9¥¬8àeøài¸àcøàh8àexàa	Ë]Z[‰ú*+yk¦¸àeøàgùcåúj$ù¥éxàkùíc:`c¸àeøài¸àa8ào¸àfxà ¹ki¹ïäº*"9å.øàk¹cåúj$ù.¢9k¦¹¥éxà¤¹è®º*£xàeøài¸àcøàh8àexàa8à ‰ßNÂˆBˆÛÛœÝÚ[Y^\ÏOOLÉùcåúj$ùodù¥éIÎ™^\ÏOOLOÉùbcy¥éIÎ˜9«¢øà¢‰ÓX]›X^
^\Ê_y¥éXÂˆYŠË\\Š^ÂˆÛÛœÝØ\SX]›X^
X]œ›Ý[™
[X™\ŠË\\Ø\
_Y™™XÝ]™JJNÂˆÛÛœÝ™YXÙYYY™™XÝ]™O˜\Ù[[™NÂˆ™]\›ˆÂˆÝ]N‰Ý\\‰ËÛ™N‰ÙÛÛÙ	ËXÛÛŽœ\ÙRXÛÛ‹ˆ]Nœ™YXÙYØ9æí9bcz*¯ù¥m;ï&‰Ø˜\Ù[[™_x¡¤‰ÙY™™XÝ]™_yb!‹ù¥éX˜9æí9bcz*¯ù¥m;ï&‰ÙY™™XÝ]™_yb!‹ù¥éXˆ]Z[œ™YXÙYˆÈ	Ü\Ù_xàîÉÝÚ[Ÿxà º/ïxàa:/¯8àoøàiùh¥øà¡8àexàf¸à z`&¹n.8à«øàª8à®xàâ8à¤‰ØØ\yb!¹."ºfd8àn9«­zf£¹æ¡8àjù¢¤xàb8ài¸àa8ào¸àfxà ‘‘HUQTÕ9a¡xàk¹«¢øà¢¹ki¹ïäºaãøà¤¹aj:`ê9­¢9c%¸àfxà¢ù¦`¹§'øàiøàkøà`¸à¢¸ào¸àføà¤øà ¸àdøàkº(j9é.¸àkùd"9¨/9è®¹ã¡øàiøàkøà`¸à¢¸ào¸àføà¤øà ˜ˆˆ	Ü\Ù_xàîÉÝÚ[Ÿxà ¹ãï¹g*8àkº*+yk¦‰Ø˜\Ù[[™_yb!‹ù¥éxàkùæí9bcy§'ù."ºfd	ØØ\yb!¹.éya¡xàiøàfxà º,¨:#møà¤¹h¥øà¡8àexàf¸à y¥è¹ïä¹ëá9fì¸àk¹è®º*£xà¤¹a*¹ab8àeøào¸àfxà ¸àdøàkº(j9é.¸àkùd"9¨/9è®¹ã¡øàiøàkøà`¸à¢¸ào¸àføà¤øà ˜ˆNÂˆBˆÛÛœÝ™[XZ[š[™ÏSX]›X^
[X™\ŠËœ™[XZ[š[™Ê_
NÂˆYŠ™[XZ[š[™ÏL
^Âˆ™]\›ˆÜÝ]N‰ØÛÛ\]IËÛ™N‰ÙÛÛÙ	ËXÛÛŽ‰ø§!IË]N‰ù..ú) xàèxàâøàéxàï8àkùk£9.¡¹®"8àoÉË]Z[˜	Ü\Ù_xàîÉÝÚ[Ÿxà ¹¥¬8àeøàa:*l8à z/¯8àoøà¢8à¢¸à yoªyïä¸àj9k§ù¢)¹è®º*£xà¤¹a*¹ab8àeøài¸àcøàh8àexàa8à ¸àdøàkº(j9é.¸àkùd"9¨/9è®¹ã¡øàiøàkøà`¸à¢¸ào¸àføà¤øà ˜NÂˆBˆÛÛœÝ™\]Z\™YSX]›X^
X]˜ÙZ[
[X™\ŠËœ™\]Z\™Y
_
JNÂˆÛÛœÝÝ\œ™[SX]›X^
X]œ›Ý[™
[X™\ŠË˜Ý\œ™[XÙJ_
JNÂˆÛÛœÝØœÙ\™YSX]›X^
X]œ›Ý[™
[X™\ŠËœ™XÙ[Ë›ØœÙ\™Y^\Ê_
JNÂˆÛÛœÝÛÝ\˜ÙO\ËœXÙTÛÝ\˜ÙOOOIÜ™XÙ[	ÂˆÈ9æí:/äIÛØœÙ\™Yy¥éze¤øàkº*&:c,¹ki¹ïä¹¦`ºe¤øàbøà¢yãï¹g*8àæ¸àï8à®xà¤¹£æùë¥Øˆˆ9ki¹ïäº*&:c,¸àc8ào¸àh9l$xàj¸àa8àgøà z*+yk¦¹.+xàk‰Ø˜\Ù[[™_yb!‹ù¥éxà¤¹ãï¹g*8àæ¸àï8à®xàj8àeøàiº*i¹ë¥ØÂˆÛÛœÝÝ]\ÐÛÜO^ÂˆÛÛÙ‰ù/fz(åxà¤¸à ¸àhøàiº`,¸à xà¢xà£8àgxàa¸àiøàfxà ‰ËˆÚÎ‰ù.â¸àk¸àæ¸àï8à®xàiøàb¸àb¸à 8àkz*"9å.øàjxàb¸à¢¸àiøàfxà ‰ËˆØ\›Ž‰ùl$xàeøàæ¸àï8à®z*¯ù¥m8àc9oáz) xàiøàfxà ‰Ëˆ[™Ù\Ž‰ù.â¸àkº*+yk¦¸àj9cåúj$ù¥éxàk¹ía8àoùd"8à£øàføà¤º)¢ùæí8àfy/fyg,8àc8à`¸à¢¸ào¸àfxà ‰ÂˆNÂˆÛÛœÝÛ™O^ÙÛÛÙ‰ÙÛÛÙ	ËÚÎ‰ÛÚÉËØ\›Ž‰ÝØ\›‰Ë[™Ù\Ž‰Ù[™Ù\‰ßVÜËœÝ]\×_	ÛÚÉÎÂˆ]Y\ÝY[IÉÎÂˆYŠË˜]]Ê^ÂˆY\ÝY[YY™™XÝ]™O˜˜\Ù[[™OØ9.â¹¥éxàk¹æë¹ª&xàkú!ê¹båz*¯ù¥m8àiÉØ˜\Ù[[™_x¡¤‰ÙY™™XÝ]™_yb!¸à ˜˜9.â¹¥éxàk¹æë¹ª&xàkÉÙY™™XÝ]™_yb!¸à ˜ÂˆY[Ù^ÂˆY\ÝY[X:!ê¹båz*¯ù¥m8àkÓÑ‘¸àîù.â¹¥éxàk¹æë¹ª&xàkÉÙY™™XÝ]™_yb!¸à ˜ÂˆBˆ™]\›ˆÂˆÝ]N‰ÜXÙIËÛ™KXÛÛŽœ\ÙRXÛÛ‹ˆ]N˜9oáz) IÜ™\]Z\™Yyb!‹ù¥éxàîùãï¹g*	ØÝ\œ™[yb!‹ù¥éXˆ]Z[˜	Ü\Ù_xàîÉÝÚ[Ÿxà ‰ÜÝ]\ÐÛÜVÜËœÝ]\×_Ý]\ÐÛÜK›ÚßIÜÛÝ\˜Ù_xà ‰ØY\ÝY[yoáz) xàæ¸àï8à®xàkÑ‘HUQTÕ9a¡xàk¹£ª9ij8àèxàâøàéxàï9­¢9c%¸àk¹æë¹k¢xàiøà yd"9¨/9è®¹ã¡øàiøàkøà`¸à¢¸ào¸àføà¤øà ˜ˆNÂŸB‚™[˜Ý[Ûˆ™[™\‘^[TXÙSÝ]ÛÛYUŒÍJ
^ÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÓÝ]ÛÛYQ^[TXÙIÊNÂˆÛÛœÝ]OYØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÓÝ]ÛÛYQ^[TXÙU]IÊNÂˆÛÛœÝ›ÝOYØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÓÝ]ÛÛYQ^[TXÙS›ÝIÊNÂˆÛÛœÝXÛÛYØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÓÝ]ÛÛYQ^[TXÙRXÛÛ‰ÊNÂˆYŠ\›ÛÝ]]_[›Ý_ZXÛÛŠ\™]\›ŽÂˆÛÛœÝXÚ\Ú[ÛY^[TXÙSÝ]ÛÛYQXÚ\Ú[Û•ŒÍJ^[TXÙTÝ]\Ê
JNÂˆ›ÛÝ™]\Ù]Û™OYXÚ\Ú[Û‹Û™NÂˆXÛÛ‹^ÛÛ[YXÚ\Ú[Û‹šXÛÛŽÂˆ]K^ÛÛ[YXÚ\Ú[Û‹]NÂˆ›ÝK^ÛÛ[YXÚ\Ú[Û‹™]Z[ÂŸB‚™[˜Ý[Ûˆ™[™\“X\›š[™ÓÝ]ÛÛYT™\ÜŒÍ

^ÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÓÝ]ÛÛYT™\Ü	ÊNÚYŠ\›ÛÝ
\™]\›ŽÂˆÛÛœÝXÝ]š]OYØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÓÝ]ÛÛYPXÝ]š]IÊNÂˆÛÛœÝXÝ]š]S›ÝOYØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÓÝ]ÛÛYPXÝ]š]S›ÝIÊNÂˆÛÛœÝÜ›ÝÝYØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÓÝ]ÛÛYQÜ›ÝÝ	ÊNÂˆÛÛœÝÜ›ÝÝ›ÝOYØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÓÝ]ÛÛYQÜ›ÝÝ›ÝIÊNÂˆÛÛœÝ™^YØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÓÝ]ÛÛYS™^	ÊNÂˆÛÛœÝ™^›ÝOYØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÓÝ]ÛÛYS™^›ÝIÊNÂˆYŠXXÝ]š]_XXÝ]š]S›Ý_YÜ›ÝÝYÜ›ÝÝ›Ý_[™^[™^›ÝJ\™]\›ŽÂ‚ˆÛÛœÝ™\Ü[X\›š[™ÓÝ]ÛÛYT™\ÜŒÍ

NÂˆXÝ]š]K^ÛÛ[X	Ü™\Ü˜XÝ]š]K›Z[]\ßyb!ˆÈ	Ü™\Ü˜XÝ]š]K˜XÝ]™Q^\ßy¥éXÂˆXÝ]š]S›ÝK^ÛÛ[Iùæí:/äMù¥éxàkº*&:c,¹ki¹ïä¹¦`ºe¤øàj9ki¹ïä¹¥éy¥l8àiøàfxà ‰ÎÂ‚ˆYŠ™\Ü™Ü›ÝÝÝ]OOOIÙÜ›ÝÝ	Ê^ÂˆÛÛœÝÏ\™\Ü™Ü›ÝÝÂˆÜ›ÝÝ^ÛÛ[X	ÙË˜Ø]H
ÉÙË™[_\ÂˆÜ›ÝÝ›ÝK^ÛÛ[X9æí:/äIÙËœ™XÙ[Ÿyfç¹ëe	ÙËœ™XÙ[IH8¡¤8àgxàk¹bcIÙËœ™]š[Ý\ÓŸyfç¹ëe	ÙËœ™]š[Ý\ßIXÂˆY[ÙHYŠ™\Ü™Ü›ÝÝÝ]OOOIÜÝX›IÊ^ÂˆÜ›ÝÝ^ÛÛ[Iùi)øàcxàj¹i"yc%¸àkøà`¸à¢¸ào¸àføà¤ÉÎÂˆÜ›ÝÝ›ÝK^ÛÛ[Iù«å:/ øàiøàcxà¢ù§ :/äxàk¹fç¹ëe8àiøàkøà N9.éy."¸àk¹."¹¦!øàkøào¸àh:)¢øà¢xà£8ào¸àføà¤øà ‰ÎÂˆY[Ù^ÂˆÜ›ÝÝ^ÛÛ[Iù«å:/ øàáøàï8à¯øà¤ºfá¸à xài¸àa8ào¸àfIÎÂˆÜ›ÝÝ›ÝK^ÛÛ[Iùd#8àf9b!ºaã¸àiùfç¹ëe8àc:$á9êcxàfxà¢øàj8à y/çykf9®"8àoùfç¹ëe8àk¹ëá9fì¸àiùi"yc%¸à¤º(j9é.¸àeøào¸àfxà ‰ÎÂˆB‚ˆ™^^ÛÛ[\™\Ü›™^]NÂˆ™^›ÝK^ÛÛ[\™\Ü›™^™]Z[Âˆ™[™\‘^[TXÙSÝ]ÛÛYUŒÍJ
NÂŸB‚™[˜Ý[Ûˆ™[™\“X\›š[™Ð[˜[]XÜÊ
^Âˆ[œÝ\™T]Y\Ý[Û”›Ùš[J
NÂˆÛÛœÝÙ]™[X[˜[]XÜÓZ[]\ÊÊK\OX[˜[]XÜÓZ[]\ÊÌ
K^\ÏX[˜[]XÜÐXÝ]™Q^\ÊÌ
K›Ý\›™^\ÏX[˜[]XÜÒ›Ý\›™^PÛÝ[Ê
NÂˆØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÍÓZ[‰ÊK^ÛÛ[X	ÜÙ]™[Ÿyb!˜ÂˆØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÌÌZ[‰ÊK^ÛÛ[X	Ý\_yb!˜ÂˆØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÌÌ^\ÉÊK^ÛÛ[X	Ù^\ßy¥éXÂˆØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÔÝX›IÊK^ÛÛ[Z›Ý\›™^\ËœÝX›NÂˆØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÐXÝ]™T›Ý]\ÉÊK^ÛÛ[Z›Ý\›™^\Ëœ™[X\›ŠÚ›Ý\›™^\Ë™\šYžJÚ›Ý\›™^\ËœÜXÙYÂˆ™[™\[˜[]XÜÒX]X\

NÂˆÛÛœÝÛ˜\ÏPSSUPÔ×ÐÐUQÓÔ’QTË›X\
[˜[]XÜÐØ]YÛÜžTÛ˜\ÚÝ
NÂˆ™[™\“X\›š[™ÓÝ]ÛÛYT™\ÜŒÍ

NÂˆ™[™\[˜[]XÜÔÚYÛ˜[ÊÛ˜\ÊNÜ™[™\[˜[]XÜÐØ]YÛÜšY\ÊÛ˜\ÊNÜ™[™\[˜[]XÜÒ›Ý\›™^\Ê
NÜ™[™\[˜[]XÜÐ‘›Ü›X]Ê
NÜ™[™\[˜[]XÜÓ™^
Û˜\ÊNÂŸB™ØÝ[Y[™Ù][[Y[žRY
	Ú\ÝÜžIÊOË˜Û\ÜÓ\Ý˜Y
	Ø[˜[]XÜËXÛÛ\XÝ	ÊNÂ™ØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÑ]Z[ÕÙÙÛIÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOžÂˆÛÛœÝØÜ™Y[YØÝ[Y[™Ù][[Y[žRY
	Ú\ÝÜžIÊKYØÝ[Y[™Ù][[Y[žRY
	Ø[˜[]XÜÑ]Z[ÕÙÙÛIÊNÂˆÛÛœÝÛÛ\XÝ\ØÜ™Y[‹˜Û\ÜÓ\ÝÙÙÛJ	Ø[˜[]XÜËXÛÛ\XÝ	ÊNØ‹œÙ]]šX]J	Ø\šXKY^[™Y	ËÝš[™ÊXÛÛ\XÝ
JNØ‹^ÛÛ[XÛÛ\XÝÉú*løàeøàa9b!¹§¤8à¤º(j9é.‰Î‰ú*løàeøàa9b!¹§¤8à¤ºe¢xàf8à¢ÉÎÂŸJNÂ‚‚‹ËÈOOOOHŒMNˆY\ÙXZÛ™\ÜÈ[˜[]XÜÈOOOOB˜ÛÛœÝÑPR×ÐÐUQÓÔ’QTÏVÉùgî¹é#¹ä!º*å‰Ë	øà¬øàìøàå8àéxàï8à¯ÉË	øàáøàï8à¯øàæxàï8à®IË	øàãxààøàâ8àëøàï8à«ÉË	øà®øà«xàéxàê¸àá¸à¨ÉË	øà¨¸àêøà­8àê¸à®¸àè	Ë	øàç¸àãxà®8àèxàìøàâ	Ë	øà®xàâ8àêxàá¸à®	×NÂ‚™[˜Ý[ÛˆÙXZÔ]Y\Ý[Û’YÑ›ÜØ]
Ø]
^Âˆ™]\›ˆUQTÕSÓ—ÐS’Ë™š[\ŠOOœK˜Ø]OOXØ]
K›X\
OOœKšY
NÂŸB™[˜Ý[Ûˆ[™XÙ[[ØÚÑ]Z[Ê[Z]MŠ^ÂˆÛÛœÝ›ÝÜÏV×NÂˆ
›Ùš[K›[ØÚÒ\ÝÜž_×JKœÛXÙJ[Z]
K™›Ü‘XXÚ
OžÂˆ
™]Z[ß×JK™›Ü‘XXÚ
Oœ›ÝÜËœ\Ú
Ë‹‹™^[Q]Nš™]K[ÙNš›[Ù_JJNÂˆJNÂˆ™]\›ˆ›ÝÜÎÂŸB™[˜Ý[Ûˆ™X\ÛÛ‘›Ü”]Y\Ý[ÛŠY
^Âˆ™]\›ˆ›Ùš[K›[ØÚÓZ\ÝZÙTÝ]ÏË–ÚYOË›\Ý™X\ÛÛˆ›Ùš[KœTÝ]ÏË–ÚYOË›\Ý™X\ÛÛˆ[ÂŸB™[˜Ý[ÛˆØ]YÛÜžP[˜[]XÜÊØ]
^Âˆ[œÝ\™T]Y\Ý[Û”›Ùš[J
NÂˆÛÛœÝYÏ[™]ÈÙ]
ÙXZÔ]Y\Ý[Û’YÑ›ÜØ]
Ø]
JNÂˆ]][\ÏLÛÜœ™XÝLÂˆYË™›Ü‘XXÚ
YOžÂˆÛÛœÝÝ\›Ùš[KœTÝ]ÏË–ÚYNÂˆYŠÝ
^Ø][\ÊÏ\Ý˜][\ßØÛÜœ™XÝ
Ï\Ý˜ÛÜœ™XÝßBˆJNÂˆÛÛœÝÛÙÛš]]™OXØ]YÛÜžPÛÙÛš]]™Q]šY[˜ÙJØ]
NÂˆÛÛœÝXØÝ\˜XÞOX][\ÏÓX]œ›Ý[™
ÛÜœ™XÝØ][\ÊŒL
N˜ÛÙÛš]]™KœØÛÜ™NÂ‚ˆÛÛœÝ[ØÚÔ›ÝÜÏX[™XÙ[[ØÚÑ]Z[Ê
K™š[\ŠOšYËš\ÊšY
JNÂˆÛÛœÝ[ØÚÕÜ›Û™Ï[[ØÚÔ›ÝÜË™š[\ŠO™˜[œÝÙ\’[™^OO[[˜[œÝÙ\’[™^OOY˜ÛÜœ™XÝ[™^
K›[™ÝÂˆÛÛœÝ[YY[[ØÚÔ›ÝÜË™š[\ŠOŠœÙXÛÛ™ß
OŒ
NÂˆÛÛœÝ]™ÔÙXÏ][YY›[™ÝÓX]œ›Ý[™
[YYœ™YXÙJ
Ë
OOœÊÊœÙXÛÛ™ß
K
KÝ[YY›[™Ý
NŒÂ‚ˆÛÛœÝ™X\ÛÛœÏ^ßNÂˆYË™›Ü‘XXÚ
YOžÂˆÛÛœÝ\™X\ÛÛ‘›Ü”]Y\Ý[ÛŠY
NÂˆYŠŠH™X\ÛÛœÖÜ—OJ™X\ÛÛœÖÜ—_
JÌNÂˆJNÂˆÛÛœÝÛZ[˜[SØš™XÝ™[šY\Ê™X\ÛÛœÊKœÛÜ

KŠOO˜–ÌWKXVÌWJVÌOË–Ì_	øàáøàï8à¯ù.#z-¬ÉÎÂ‚ˆ]™\X]ÏLÂˆYË™›Ü‘XXÚ
YOžÂˆÛÛœÝÝ\›Ùš[KœTÝ]ÏË–ÚYNÂˆÛÛœÝZ\ÝZÙ\ÏSX]›X^

ÝË˜][\ß
KJÝË˜ÛÜœ™XÝ
JNÂˆÛÛœÝ[ØÚÓZ\ÜÏ\›Ùš[K›[ØÚÓZ\ÝZÙTÝ]ÏË–ÚYOË›Z\ÜÙ\ßÂˆYŠX]›X^
Z\ÝZÙ\Ë[ØÚÓZ\ÜÊOLŠH™\X]ÊÊÎÂˆJNÂ‚ˆÛÛœÝX\Ý\žOXÛÙÛš]]™KœØÛÜ™NÂˆÛÛœÝX\Ý\žTš\ÚÏLL[X\Ý\žNÂˆÛÛœÝXØÝ\˜XÞTš\ÚÏLLXXØÝ\˜XÞNÂˆÛÛœÝ[ØÚÔš\ÚÏSX]›Z[ŠL[ØÚÕÜ›Û™ÊŒLŠNÂˆÛÛœÝ[YTš\ÚÏX]™ÔÙXÏÓX]›Z[ŠLX]›X^

]™ÔÙXËMŒ
KÌKŒŠJNŒÂˆÛÛœÝ™\X]š\ÚÏSX]›Z[ŠL™\X]ÊŒŒ
NÂˆÛÛœÝÛÙÛš]]™Tš\ÚÏLLJÛÙÛš]]™KÙXZÙ\ÝœØÛÜ™OO[[ÍL˜ÛÙÛš]]™KÙXZÙ\ÝœØÛÜ™JNÂˆÛÛœÝš[Üš]OSX]œ›Ý[™
Û[\
ˆX\Ý\žTš\ÚÊ‹ŒÍ
ÈXØÝ\˜XÞTš\ÚÊ‹ŒN
ÈÛÙÛš]]™Tš\ÚÊ‹ŒŒ
È[ØÚÔš\ÚÊ‹ŒL
È[YTš\ÚÊ‹Œˆ
È™\X]š\ÚÊ‹ŒL‹ˆLˆ
JNÂˆ™]\›ˆÂˆØ]X\Ý\žK][\ËXØÝ\˜XÞK[ØÚÕÜ›Û™Ë]™ÔÙXËÛZ[˜[™\X]Ëš[Üš]KˆÛÙÛš]]™KÙXZÙ\ÝÛÙÛš]]™N˜ÛÙÛš]]™KÙXZÙ\Ý›]™[ÙXZÙ\ÝÛÙÛš]]™TØÛÜ™N˜ÛÙÛš]]™KÙXZÙ\ÝœØÛÜ™BˆNÂŸB™[˜Ý[ÛˆØ]YÛÜžPYšXÙJJ^ÂˆYŠK™ÛZ[˜[OOIùçéz+f9.#z-¬ÉÊH™]\›ˆ	ù¥fy§d8à¤Œy§+8à¡8à¢¹æí8àeøài¸àbøà¢xà xàdøàk¹b!ºaã¸àh8àdLL9ecú)èøàcøàk¸àc8àb¸àfxàfxà xàiøàfxà ‰ÎÂˆYŠK™ÛZ[˜[OOIú*"9ë¥øàçøà®IÊH™]\›ˆ	ú`%9.+yo#øà¤¹ç yåixàføàf¸à y¥l9`)9ecúhc8à¤¸à¡¸àhøàcøà¢º)èøàcùíí9ïä¸à¤¹a*¹ab8àeøào¸àeøà¡øàa¸à ‰ÎÂˆYŠK™ÛZ[˜[OOIú*«xàoú`exàa	ÊH™]\›ˆ	øà#:`jyb!ûï#ù.#z`jyb!øà#xà#9.éy."»ï#ù§*¹® 8à#xàj¸àjy§hy.íº*§¸àn9cl8à¤¹.æ8àdxà¢ùíí9ïä¸àc9§"yb®xàiøàfxà ‰ÎÂˆYŠK™ÛZ[˜[OOIÌ¹¢§¸àiú/íøàhøàgÉÊH™]\›ˆ	ù//8àgùå*:*§¸àkº`exàa8à¤¹«å:/ ú(j8àiù¥m9ä!¸àeøà y¨.y¢è8à¤º* :$bxàjøàeøàiº`n8àm¹íí9ïä¸àc9§"yb®xàiøàfxà ‰ÎÂˆYŠK™ÛZ[˜[OOIù¦`ºe¤ù.#z-¬ÉÈK˜]™ÔÙXÏŒL
H™]\›ˆ	ù«hú)èøàiøàcxà¢ùecúhc8àiøà ¹¦`ºe¤øà¤¹/oøàa8àfxàc¸ài¸àa8ào¸àfxà ŽL9éä¸à¤¹æë¹k¢xàjù. 9n©¹b)9¥«xàfxà¢ùíí9ïä¸à¤¸à ‰ÎÂˆYŠK˜][\ÏOOL
H™]\›ˆ	ù¯%9ïä¸àáøàï8à¯øàc9l$xàj¸àa8àk¸àiøà xào¸àf¸àdøàk¹b!ºaã¸à¤ŒL9ecú)èøàa8ài¹k§ùb¦øà¤¹®+8à¢¸ào¸àeøà¡øàa¸à ‰ÎÂˆYŠKÙXZÙ\ÝÛÙÛš]]™OOOIùb)9¥«IÊH™]\›ˆ	ùb)9¥«yecúhc8àc9o,xà xàiøàfxà ¹§hy.í¸à¤º)!ù¥l9¢ï¸àa8à z*"9ë¥øàîù«å:/ øàîùa*¹ab:h!¹/cxào¸àiù¨.y¢è8à¤¹£ xàhøàiº`n8àm¹íí9ïä¸à¤¸à ‰ÎÂˆYŠKÙXZÙ\ÝÛÙÛš]]™OOOIú`jyå*	ÊH™]\›ˆ	ú`jyå*9ecúhc8àc9o,xà xàiøàfxà ¹å*:*§¸à¤º)¦¸àb8à¢øàh8àdxàiøàj¸àcøà yâ­¹¬àxà¡9æë¹æ¡8àn9odøài¸àkøà xà¢ùíí9ïä¸à¤¹h¥øà¡8àeøào¸àeøà¡øàa¸à ‰ÎÂˆYŠKÙXZÙ\ÝÛÙÛš]]™OOOIù ìú-mÉÊH™]\›ˆ	ùgî¹é#¹çéz+f8àk¹cå¸à¢¹aî¸àeøàc9o,xà xàiøàfxà ¹å*:*§¸àîùonybl¸àîùk¦¹¥l8à¤¹çëy¦`ºe¤øàiùëe8àb8à¢xà£8à¢øào¸àiùoªyïä¸àeøào¸àeøà¡øàa¸à ‰ÎÂˆ™]\›ˆ	ùo,yà®yecúhc8à¤º)èøàcxà ze¤ú`exàb8àgùecúhc8à¤¹ïã9¥éxàk¹oªyïä¸ào¸àiøài8àj¸àd¸ào¸àeøà¡øàa¸à ‰ÎÂŸB™[˜Ý[ÛˆÛÜYØ]YÛÜžP[˜[]XÜÊ
^Âˆ™]\›ˆÑPR×ÐÐUQÓÔ’QTË›X\
Ø]YÛÜžP[˜[]XÜÊKœÛÜ

KŠOO˜‹œš[Üš]KXKœš[Üš]JNÂŸB™[˜Ý[ÛˆYÙÜ™YØ]UÙXZÔ™X\ÛÛœÊ
^ÂˆÛÛœÝÝ[Ï^Éùçéz+f9.#z-¬ÉÎŒ	ú*"9ë¥øàçøà®IÎŒ	ú*«xàoú`exàa	ÎŒ	Ì¹¢§¸àiú/íøàhøàgÉÎŒ	ù¦`ºe¤ù.#z-¬ÉÎŒ	ùå*:*§¸à¤¹çéxà¢xàj¸àbøàhøàgÉÎŒ	ú*"9ë¥ù¥®y¬åxà¤¹oæ8à£8àgÉÎŒ	ùecúhc9¥¡øà¤º*«xàoú`exàb8àgÉÎŒ	øànøào9b!¸àbøà¢xàj¸àbøàhøàgÉÎŒNÂˆØš™XÝ˜[Y\Ê›Ùš[KœTÝ]ßßJK™›Ü‘XXÚ
ÝOžÂˆYŠÝË›\Ý™X\ÛÛŠHÝ[ÖÜÝ›\Ý™X\ÛÛ—OJÝ[ÖÜÝ›\Ý™X\ÛÛ—_
JÌNÂˆJNÂˆØš™XÝ˜[Y\Ê›Ùš[K›[ØÚÓZ\ÝZÙTÝ]ßßJK™›Ü‘XXÚ
ÝOžÂˆYŠÝË›\Ý™X\ÛÛŠHÝ[ÖÜÝ›\Ý™X\ÛÛ—OJÝ[ÖÜÝ›\Ý™X\ÛÛ—_
JÌNÂˆJNÂˆËÈ›Ü›X[^™HÛ\ˆH™X\ÛÛˆX™[È[ÈHŒMX™[Ë‚ˆÝ[ÖÉùçéz+f9.#z-¬É×H
ÏH
Ý[ÖÉùå*:*§¸à¤¹çéxà¢xàj¸àbøàhøàgÉ×_
H
È
Ý[ÖÉøànøào9b!¸àbøà¢xàj¸àbøàhøàgÉ×_
NÂˆÝ[ÖÉú*"9ë¥øàçøà®I×H
ÏHÝ[ÖÉú*"9ë¥ù¥®y¬åxà¤¹oæ8à£8àgÉ×_ÂˆÝ[ÖÉú*«xàoú`exàa	×H
ÏHÝ[ÖÉùecúhc9¥¡øà¤º*«xàoú`exàb8àgÉ×_Âˆ™]\›ˆÉùçéz+f9.#z-¬ÉË	ú*"9ë¥øàçøà®IË	ú*«xàoú`exàa	Ë	Ì¹¢§¸àiú/íøàhøàgÉË	ù¦`ºe¤ù.#z-¬É×K›X\
˜[YOO–Û˜[YKÝ[ÖÛ˜[YW_JNÂŸB™[˜Ý[Ûˆ™\X]YÜ›Û™Ô]Y\Ý[ÛœÊ
^Âˆ™]\›ˆ˜XÚÙY]Y\Ý[Û”ÛÛ

K›X\
OOžÂˆÛÛœÝÝ\›Ùš[KœTÝ]ÏË–ÜKšY_ßNÂˆÛÛœÝÜ™[˜\žOSX]›X^

Ý˜][\ß
KJÝ˜ÛÜœ™XÝ
JNÂˆÛÛœÝ[ØÚÏ\›Ùš[K›[ØÚÓZ\ÝZÙTÝ]ÏË–ÜKšYOË›Z\ÜÙ\ßÂˆ™]\›ˆÜKÛÝ[“X]›X^
Ü™[˜\žK[ØÚÊK™X\ÛÛŽœ™X\ÛÛ‘›Ü”]Y\Ý[ÛŠKšY
KYNœÝ™Y_	ÉßNÂˆJK™š[\ŠOž˜ÛÝ[LŠKœÛÜ

KŠOO˜‹˜ÛÝ[XK˜ÛÝ[
KœÛXÙJŠNÂŸB™[˜Ý[ÛˆÛÝÓ[ØÚÔ]Y\Ý[ÛœÊ
^ÂˆÛÛœÝžRY^ßNÂˆ[™XÙ[[ØÚÑ]Z[ÊJK™›Ü‘XXÚ
OžÂˆYŠ
œÙXÛÛ™ß
OL
H™]\›ŽÂˆYŠXžRYÙšYHœÙXÛÛ™Ï˜žRYÙšYKœÙXÛÛ™ÊHžRYÙšYOYÂˆJNÂˆ™]\›ˆØš™XÝ˜[Y\ÊžRY
K›X\
OŠÙN›ÜšYÚ[˜[]Y\Ý[ÛžRY
šY
_JJBˆ™š[\ŠOžœJKœÛÜ

KŠOO˜‹™œÙXÛÛ™ËXK™œÙXÛÛ™ÊKœÛXÙJŠNÂŸB‚™[˜Ý[Ûˆ™[™\•ÙXZÑ\Ú›Ø\™

^ÂˆÛÛœÝÜšYYØÝ[Y[™Ù][[Y[žRY
	ÝÙXZÐØ]YÛÜžQÜšY	ÊNÂˆYŠYÜšY
H™]\›ŽÂˆÛÛœÝ[˜[]XÜÏ\ÛÜYØ]YÛÜžP[˜[]XÜÊ
NÂˆÛÛœÝÜX[˜[]XÜÖÌNÂ‚ˆØÝ[Y[™Ù][[Y[žRY
	ÝÙXZÕÜ]IÊK^ÛÛ[X9§ 9a*¹ab;ï&‰ÝÜ˜Ø]XÂˆØÝ[Y[™Ù][[Y[žRY
	ÝÙXZÕÜØÛÜ™IÊK^ÛÛ[]Üœš[Üš]NÂˆØÝ[Y[™Ù][[Y[žRY
	ÝÙXZÕÜÝX‰ÊK^ÛÛ[Bˆ9ïä¹á§ùn©ˆ	ÝÜ›X\Ý\ž_Ixàîù«hùëe9ã¡È	ÝÜ˜XØÝ\˜XÞ_Ixàîùo,xàa9 'z  ûï&‰ÝÜÙXZÙ\ÝÛÙÛš]]™_IÝÜÙXZÙ\ÝÛÙÛš]]™TØÛÜ™OO[[ÉÉÎ˜	ÝÜÙXZÙ\ÝÛÙÛš]]™TØÛÜ™_IXxàîÉÝÜ™ÛZ[˜[OOIøàáøàï8à¯ù.#z-¬ÉÏÉú*©9ëe9ä!¹å,xàkøào¸àh9§*º*&:c,‰Î˜9..øàj¸ài8ào¸àf¸àc{ï&‰ÝÜ™ÛZ[˜[XXÂˆÛÛœÝÙXZÕÜXÝ[ÛYØÝ[Y[™Ù][[Y[žRY
	ÝÙXZÕÜXÝ[Û‰ÊNÂˆYŠÙXZÕÜXÝ[ÛŠ^ÂˆÙXZÕÜXÝ[Û‹^ÛÛ[X	ÝÜ˜Ø]xà¤ŒL9ecøàiùè®º*£H8¡¤˜ÂˆÙXZÕÜXÝ[Û‹›Û˜ÛXÚÏJ
OOžÜÚÝÔØÜ™Y[Š	Ü›Ø›[\ÉÊNÜÝ\]Z^ŠÛÙØØ]‰ÝÜ˜Ø]N‰ÝÜÙXZÙ\ÝÛÙÛš]]™_X
NßNÂˆB‚ˆÜšYš[›™\’SIÉÎÂˆ[˜[]XÜË™›Ü‘XXÚ

KY
OOžÂˆÛÛœÝØ\™YØÝ[Y[˜Ü™X]Q[[Y[
	Ù]‰ÊNÂˆØ\™˜Û\ÜÓ˜[YOIÝÙXZËXØ]YÛÜžKXØ\™	ÊÊYOOLÉÈÜ	Î‰ÉÊNÂˆØ\™š[›™\’SXˆ]ˆÛ\ÜÏHÙXZËXØ]ZXY‚ˆ]ˆÛ\ÜÏHÙXZËXØ]\˜[šÈˆÉÚY
Ì_OÙ]‚ˆ]ˆÛ\ÜÏHÙXZËXØ]XÛÜH]ˆÛ\ÜÏHÙXZËXØ]]]H‰ØK˜Ø]OÙ]]ˆÛ\ÜÏHœÝXˆ‰ØKœ™\X]ÏØ9îl8à¢º/å8àeú*©9ëe	ØKœ™\X]ßz*å¹à®X‰ùîl8à¢º/å8àeú*©9ëe8àj¸àeÉßOÙ]Ù]‚ˆ]ˆÛ\ÜÏHÙXZËXØ]\š[Üš]H‰ØKœš[Üš]_OÛX[¹a*¹ab9n©ÜÛX[Ù]‚ˆÙ]‚ˆ]ˆÛ\ÜÏHÙXZË[Y]šXÜÈ‚ˆ]ˆÛ\ÜÏHÙXZË[Y]šXÈ]ˆÛ\ÜÏHÙXZË[Y]šXË[X™[¹ïä¹á§ùn©Ù]]ˆÛ\ÜÏHÙXZË[Y]šXË]˜[YH‰ØK›X\Ý\ž_IOÙ]Ù]‚ˆ]ˆÛ\ÜÏHÙXZË[Y]šXÈ]ˆÛ\ÜÏHÙXZË[Y]šXË[X™[¹«hùëe9ã¡ÏÙ]]ˆÛ\ÜÏHÙXZË[Y]šXË]˜[YH‰ØK˜XØÝ\˜XÞ_IOÙ]Ù]‚ˆ]ˆÛ\ÜÏHÙXZË[Y]šXÈ]ˆÛ\ÜÏHÙXZË[Y]šXË[X™[¹nlùgaù¦`ºe¤ÏÙ]]ˆÛ\ÜÏHÙXZË[Y]šXË]˜[YH‰ØK˜]™ÔÙXÏØK˜]™ÔÙXÊÉùéä‰Î‰ø %	ßOÙ]Ù]‚ˆ]ˆÛ\ÜÏHÙXZË[Y]šXÈ]ˆÛ\ÜÏHÙXZË[Y]šXË[X™[¹o,xàa9 'z  ÏÙ]]ˆÛ\ÜÏHÙXZË[Y]šXË]˜[YH‰ØKÙXZÙ\ÝÛÙÛš]]™_IØKÙXZÙ\ÝÛÙÛš]]™TØÛÜ™OO[[ÉÉÎ˜	ØKÙXZÙ\ÝÛÙÛš]]™TØÛÜ™_IXOÙ]Ù]‚ˆÙ]‚ˆ]ˆÛ\ÜÏHÙXZËXØ][›ÝH‰ØØ]YÛÜžPYšXÙJJ_OÙ]‚ˆ]ˆÛ\ÜÏHÙXZËXØ]XXÝ[ÛœÈ‚ˆ]ÛˆÛ\ÜÏH›Ü[‹XØ][\ÜÛÛˆˆ]KXØ]H‰ØK˜Ø]H¹¥fy§d8à¤º)¢øà¢ÏØ]Û‚ˆ]ÛˆÛ\ÜÏHœ˜XÝXÙKXØ]ˆ]KXØ]H‰ØK˜Ø]Hˆ]KXÛÙÛš]]™OH‰ØKÙXZÙ\ÝÛÙÛš]]™_H‰ØKÙXZÙ\ÝÛÙÛš]]™_xà¤ŒL9ecÏØ]Û‚ˆÙ]˜ÂˆÜšY˜\[™Ú[
Ø\™
NÂˆJNÂ‚ˆÜšYœ]Y\žTÙ[XÝÜ[
	Ëœ˜XÝXÙKXØ]	ÊK™›Ü‘XXÚ
O˜‹›Û˜ÛXÚÏJ
OOžÂˆÚÝÔØÜ™Y[Š	Ü›Ø›[\ÉÊNÂˆÝ\]Z^ŠÛÙØØ]‰Ø‹™]\Ù]˜Ø]N‰Ø‹™]\Ù]˜ÛÙÛš]]™_X
NÂˆJNÂˆÜšYœ]Y\žTÙ[XÝÜ[
	Ë›Ü[‹XØ][\ÜÛÛ‰ÊK™›Ü‘XXÚ
O˜‹›Û˜ÛXÚÏJ
OOžÂˆÛÛœÝY\XÚÓ\ÜÛÛ‘›Ü”ÚÚ[
‹™]\Ù]˜Ø]
NÂˆÝ\\ÜÛÛŠY
NÂˆJNÂ‚ˆÛÛœÝ™X\ÛÛœÏXYÙÜ™YØ]UÙXZÔ™X\ÛÛœÊ
NÂˆÛÛœÝX^™X\ÛÛSX]›X^
K‹‹œ™X\ÛÛœË›X\
OžÌWJJNÂˆØÝ[Y[™Ù][[Y[žRY
	ÝÙXZÔ™X\ÛÛ“\Ý	ÊKš[›™\’S\™X\ÛÛœË›X\

Û˜[YKÛÝ[JOO˜ˆ]ˆÛ\ÜÏHœ™X\ÛÛ‹\›ÝÈ‚ˆ]ˆÛ\ÜÏHœ™X\ÛÛ‹[˜[YH‰Û˜[Y_OÙ]‚ˆ]ˆÛ\ÜÏHœ™X\ÛÛ‹]˜XÚÈ]ˆÛ\ÜÏHœ™X\ÛÛ‹Yš[ˆÝ[OHÚY‰ÓX]œ›Ý[™
ÛÝ[ÛX^™X\ÛÛŠŒL
_IHÙ]Ù]‚ˆ]ˆÛ\ÜÏHœ™X\ÛÛ‹XÛÝ[‰ØÛÝ[OÙ]‚ˆÙ]˜
Kš›Ú[Š	ÉÊNÂ‚ˆÛÛœÝYšXÙUÜX[˜[]XÜËœÛXÙJÊNÂˆÛÛœÝ™X\ÛÛ]Ü™ÛZ[˜[Âˆ]Xš]Iøào¸àf¹§ 9a*¹ab9b!ºaã¸à¤¹çëxàa9¥fy§d8¡¤ŒL9ecù¯%9ïä¸¡¤¹ïã9¥éyoªyïä¸àkºh!¸àiùfç¸àeøào¸àfxà ‰ÎÂˆYŠ™X\ÛÛOOIú*"9ë¥øàçøà®IÊHXš]Iú*"9ë¥ùecúhc8àiøàkú`%9.+yo#øà¤¹«¢øàeøà yëe8àb8à¤º`n8àm¹bcxàjùcf9/cxàîù¨`xàîù.éy."‹ù§*¹® 8à¤¹è®º*£xàeøào¸àfxà ‰ÎÂˆ[ÙHYŠ™X\ÛÛOOIú*«xàoú`exàa	ÊHXš]Iùecúhc9¥¡øàk¹§hy.íº*§¸à¤¹ab8àjù¢ï¸àhøài¸àbøà¢z`n9¢§º ¨¸à¤º)¢øà¢ùïä¹¡høà¤¹.æ8àdxào¸àfxà ‰ÎÂˆ[ÙHYŠ™X\ÛÛOOIÌ¹¢§¸àiú/íøàhøàgÉÊHXš]IÌ¹¢§¸ào¸àiùíg¸à£8àgøà¢xà yd!:`n9¢§º ¨¸àc8à#8àj¸àg:`exàa¸àbøà#xà¤Œxài:* 8àb8à¢øàbùè®º*£xàeøào¸àfxà ‰ÎÂˆ[ÙHYŠ™X\ÛÛOOIù¦`ºe¤ù.#z-¬ÉÊHXš]IÌyecÎL9éä¸à¤¹. 8ài8àk¹æë¹k¢xàjøàeøà z*l8ào¸àhøàgùecúhc8àkú)¢ùæí8àeøàåxàêxà¬8àn9fç¸àeøào¸àfxà ‰ÎÂˆØÝ[Y[™Ù][[Y[žRY
	ÝÙXZÑY\YšXÙIÊKš[›™\’SBˆ¹a*¹ab:h!¹/c{ï&Øˆ	ØYšXÙUÜ›X\
Ož˜Ø]
Kš›Ú[Š	È8¡¤ˆ	Ê_Oœœ¹.â¹fç¸àk¹¥.ye¡8àçxà©8àìøàâ;ï&Øˆ	ÚXš]XÂ‚ˆÛÛœÝ™\X]Y\™\X]YÜ›Û™Ô]Y\Ý[ÛœÊ
NÂˆØÝ[Y[™Ù][[Y[žRY
	Ü™\X]Ü›Û™Ó\Ý	ÊKš[›™\’S\™\X]Y›[™ÝÜ™\X]Y›X\
O˜ˆ]ˆÛ\ÜÏHÙXZË[\ÝZ][H‚ˆ]ˆÛ\ÜÏHÙXZË[\Ý]Ü]ˆÛ\ÜÏHÙXZË[\Ý]]H‰ÞœK˜Ø]xàîÉÞœK˜ÛÛ˜Ù\OÙ]Ü[ˆÛ\ÜÏHÙXZË[\ÝX˜YÙH‰Þ˜ÛÝ[yfçÜÜ[Ù]‚ˆ]ˆÛ\ÜÏHÙXZË[\Ý\ÝXˆ‰Ù\ØØ\R[
œKœJ_IÞœ™X\ÛÛØœ¹æí:/äxàk¹c§ùfè;ï&‰Ù\ØØ\R[
œ™X\ÛÛŠ_X‰ÉßIÞ™YOØœ¹«(yfç¹oªyïä»ï&‰Þ™Y_X‰ÉßOÙ]‚ˆ]ÛˆÛ\ÜÏHÙXZË[\ÝXXÝ[Ûˆˆ]K]ÙXZÜZYH‰Ù\ØØ\R[
œKšY
_H¸àdøàkº*å¹à®xà¤¹oªyïäˆ8¡¤Ø]Û‚ˆÙ]˜
Kš›Ú[Š	ÉÊN‰Ï]ˆÛ\ÜÏHÙXZËY[\H¹îl8à¢º/å8àeú*©9ëe8àkøào¸àh8à`¸à¢¸ào¸àføà¤øà Ù]‰ÎÂ‚ˆÛÛœÝÛÝÏ\ÛÝÓ[ØÚÔ]Y\Ý[ÛœÊ
NÂˆØÝ[Y[™Ù][[Y[žRY
	ÜÛÝÔ]Y\Ý[Û“\Ý	ÊKš[›™\’S\ÛÝË›[™ÝÜÛÝË›X\
O˜ˆ]ˆÛ\ÜÏHÙXZË[\ÝZ][H‚ˆ]ˆÛ\ÜÏHÙXZË[\Ý]Ü]ˆÛ\ÜÏHÙXZË[\Ý]]H‰ÞœK˜Ø]xàîÉÞœK˜ÛÛ˜Ù\OÙ]Ü[ˆÛ\ÜÏHÙXZË[\ÝX˜YÙH‰Þ™œÙXÛÛ™ßyéäÜÜ[Ù]‚ˆ]ˆÛ\ÜÏHÙXZË[\Ý\ÝXˆ‰Ù\ØØ\R[
œKœJ_OÙ]‚ˆ]ÛˆÛ\ÜÏHÙXZË[\ÝXXÝ[ÛˆÙXÛÛ™\žHˆ]K]ÙXZÜZYH‰Ù\ØØ\R[
œKšY
_H¹d#8àf:*å¹à®xà¤¸à ¸àaŒyecÈ8¡¤Ø]Û‚ˆÙ]˜
Kš›Ú[Š	ÉÊN‰Ï]ˆÛ\ÜÏHÙXZËY[\H¹ª(z*i¸à¤¹cåøàdxà¢øàj8à yecúhc9b)xàk¹¦`ºe¤ùb!¹§¤8àc:(j9é.¸àexà£8ào¸àfxà Ù]‰ÎÂ‚ˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
	ÖÙ]K]ÙXZÜZYIÊK™›Ü‘XXÚ
O˜‹›Û˜ÛXÚÏJ
OOžÂˆÚÝÔØÜ™Y[Š	Ü›Ø›[\ÉÊNÂˆÝ\]Z^Š	Ú›Ý\›™^N‰ÊØ‹™]\Ù]ÙXZÜZY
NÂˆJNÂŸB‚˜ÛÛœÝÜ™Yœ™\Ú›Ùš[URWÝŒMO\™Yœ™\Ú›Ùš[URNÂœ™Yœ™\Ú›Ùš[UROY[˜Ý[ÛŠ
^ÂˆÜ™Yœ™\Ú›Ùš[URWÝŒMJ
NÂˆ™[™\•ÙXZÑ\Ú›Ø\™

NÂŸNÂœ™[™\•ÙXZÑ\Ú›Ø\™

NÂ‚‚‚‚‹ËÈOOOOHŒMÎˆXÚš\]YK\ÜXÚYšXÈ›Ø›[HÛÛš[™ÈOOOOBšYŠ\›Ùš[KXÚš\]YTÝ]ÊH›Ùš[KXÚš\]YTÝ]Ï^ßNÂ‚™[˜Ý[ÛˆžÚ[™

^Âˆ™]\›ˆÝš[™Ê]Z^“[ÙJKœÝ\ÕÚ]
	Üž‰ÊHÈÝš[™Ê]Z^“[ÙJKœÜ]
	Î‰ÊVÌWHˆ[ÂŸB™[˜Ý[ÛˆÝÜ]Y\Ý[Û”XÙ\Š
^ÂˆYŠžXÙR[™J^ØÛX\’[\˜[
žXÙR[™JNÜžXÙR[™O[[ßBŸB™[˜Ý[ÛˆØY™UXÚš\]YTÛ˜\ÚÝ

^ÂˆÛÛœÝÚ[™\žÚ[™

NÂˆYŠZÚ[™
H™]\›ˆ[ÂˆÛÛœÝÝ]^ÚÚ[™NÂˆYŠÚ[™OOIØØ[ÉÊHÝ]ÛÜšÏJžXÚš\]YQ]KÛÜšß	ÉÊKœÛXÙJLŒ
NÂˆYŠÚ[™OOIÜ™XY	ÊHÝ]›X\šÙYVË‹‹ŠžXÚš\]YQ]K›X\šÙY×JWNÂˆYŠÚ[™OOIØÛÛ˜\Ý	ÊHÝ]™š[˜[\ÝÏVË‹‹ŠžXÚš\]YQ]K™š[˜[\Ýß×JWNÂˆYŠÚ[™OOIÜÜYY	ÊHÝ]œÙXÛÛ™Ï\žXÙQ[\ÙYÂˆYŠÚ[™OOIÜ™\X]	ÊHÝ]˜ÛÛ™š\›YYHH\žXÚš\]YQ]K˜ÛÛ™š\›YYÂˆ™]\›ˆÝ]ÂŸB™[˜Ý[ÛˆXÚš\]YTÝ]
Ú[™
^ÂˆYŠ\›Ùš[KXÚš\]YTÝ]ÖÚÚ[™JH›Ùš[KXÚš\]YTÝ]ÖÚÚ[™O^ÜÙ\ÜÚ[ÛœÎŒ]Y\Ý[ÛœÎŒ™XÛÝ™\™YŒš\œÝÜ›Û™ÎŒNÂˆ™]\›ˆ›Ùš[KXÚš\]YTÝ]ÖÚÚ[™NÂŸB™[˜Ý[Ûˆ™XÛÜ™XÚš\]YTÙ\ÜÚ[Û”Ý]Ê
^ÂˆÛÛœÝÚ[™\žÚ[™

NÂˆYŠZÚ[™
H™]\›ŽÂˆÛÛœÝÝ]XÚš\]YTÝ]
Ú[™
NÂˆÝœÙ\ÜÚ[ÛœÊÊÎÂˆÛÛœÝ›ÝÜÏ\Ù\ÜÚ[Û“ÙË™š[\ŠOžXÚš\]YOOOZÚ[™
NÂˆÝœ]Y\Ý[ÛœÊÏ\›ÝÜË›[™ÝÂˆÝœ™XÛÝ™\™Y
Ï\›ÝÜË™š[\ŠOžœ™XÛÝ™\™Y
K›[™ÝÂˆÝ™š\œÝÜ›Û™ÊÏ\›ÝÜË™š[\ŠOˆ^›ÚÊK›[™ÝÂˆÝ›\Ý[ØØ[]RTÓÊ
NÂˆØ]™T›Ùš[J
NÂŸB‚™[˜Ý[Ûˆ™[™\”žXÚš\]YJJ^ÂˆÛÛœÝ›ÞYØÝ[Y[™Ù][[Y[žRY
	ÜžXÚš\]YIÊNÂˆÛÛœÝ›ÙOYØÝ[Y[™Ù][[Y[žRY
	ÜžXÚš\]YP›ÙIÊNÂˆYŠX›ÞX›ÙJH™]\›ŽÂˆÛÛœÝÚ[™\žÚ[™

NÂˆÝÜ]Y\Ý[Û”XÙ\Š
NÂˆžXÙQ[\ÙYLÂˆÛÛœÝÜ[ÛœÑ[YØÝ[Y[™Ù][[Y[žRY
	Ü]Z^“Ü[ÛœÉÊNÂ‚‚ˆYŠZÚ[™Ú[™OOIÚÛ›ÝÛYÙIÊ^Âˆ›ÞœÝ[K™\Ü^OIÛ›Û™IÎÂˆžXÚš\]YT™XYO]YNÂˆ™]\›ŽÂˆB‚ˆ›ÞœÝ[K™\Ü^OIØ›ØÚÉÎÂˆÛÛœÝXÛÛYØÝ[Y[™Ù][[Y[žRY
	ÜžXÚš\]YRXÛÛ‰ÊNÂˆÛÛœÝ]OYØÝ[Y[™Ù][[Y[žRY
	ÜžXÚš\]YU]IÊNÂˆÛÛœÝ\ØÏYØÝ[Y[™Ù][[Y[žRY
	ÜžXÚš\]YQ\ØÉÊNÂ‚ˆYŠÚ[™OOIØØ[ÉÊ^ÂˆXÛÛ‹^ÛÛ[Iü'éë‰ÎÂˆ]K^ÛÛ[Iú`%9.+yo#øà¤¹«¢øàeøài¸àbøà¢yëe8àb8à¢ÉÎÂˆ\ØË^ÛÛ[Iúh+xàk¹.+xàh8àdxàiú*"9ë¥øàføàf¸à yo#øàîú`%9.+yíd9§§8àîùcf9/cxàk¸àjxà£8àbøà¤¹¦î8àcxào¸àfxà ‰ÎÂˆžXÚš\]YT™XYOY˜[ÙNÂˆžXÚš\]YQ]O^ÝÛÜšÎ‰ÉßNÂˆ›ÙKš[›™\’SXˆ^\™XHÛ\ÜÏH˜Ø[Ë]ÛÜšÈˆYHœžØ[ÕÛÜšÈˆXÙZÛ\H¹/¢ûï&ŒŽH0åÈŽHHŽIˆÌLøào¸àgøàkÈŒ0åÈL0åÈHMŒš]Ý^\™XO‚ˆ]ˆÛ\ÜÏHXÚš\]YKXÚXÚÜÈ‚ˆÜ[ˆÛ\ÜÏHXÚXÚXÚÈˆYH˜Ø[ÐÚXÚÑ›Ü›][H¹o#øà¤¹¦î8àcÏÜÜ[‚ˆÜ[ˆÛ\ÜÏHXÚXÚXÚÈ¹¨`xà¤¹è®º*£OÜÜ[‚ˆÜ[ˆÛ\ÜÏHXÚXÚXÚÈ¹cf9/cxà¤¹è®º*£OÜÜ[‚ˆÙ]˜ÂˆØÝ[Y[™Ù][[Y[žRY
	ÜžØ[ÕÛÜšÉÊK˜Y]™[\Ý[™\Š	Ú[œ]	ËOOžÂˆžXÚš\]YQ]KÛÜšÏYK\™Ù]˜[YNÂˆžXÚš\]YT™XYOYK\™Ù]˜[YKš[J
K›[™ÝLŽÂˆØÝ[Y[™Ù][[Y[žRY
	ØØ[ÐÚXÚÑ›Ü›][IÊK˜Û\ÜÓ\ÝÙÙÛJ	ÙÛ™IËžXÚš\]YT™XYJNÂˆJNÂˆ™]\›ŽÂˆB‚ˆYŠÚ[™OOIÜ™XY	Ê^ÂˆXÛÛ‹^ÛÛ[Iü'å#IÎÂˆ]K^ÛÛ[Iù§hy.íº*§¸à¤¹ab8àjù¢ï¸àa‰ÎÂˆ\ØË^ÛÛ[Iùëe8àb8à¤º)¢øà¢ùbcxàjøà yecúhc9¥¡øàiùb)9¥«xà¤¹mé¹cìøàfxà¢ú*§¸à¤¹è®º*£xàeøào¸àfxà ‰ÎÂˆÛÛœÝÙ^]ÛÜ™ÏVÉù§ 8à º`jyb!ÉË	ù.#z`jyb!ÉË	ú`jyb!ÉË	ù.éy."‰Ë	ù.éy."ÉË	ù§*¹® 	Ë	ú-¡xàb8à¢ÉË	ù§ 9a*¹ab	Ë	øào¸àf‰Ë	ù«(xàjÉË	ù..øàj‰Ë	ù. :"+8àjÉË	ùoáxàf‰×NÂˆ]›Ý[™ZÙ^]ÛÜ™Ë™š[\ŠÏOœKœKš[˜ÛY\ÊÊJNÂˆYŠY›Ý[™›[™Ý
H›Ý[™VÉù/exà¤¹ecøà£øà£8ài¸àa8à¢øàbùè®º*£I×NÂˆžXÚš\]YT™XYOY˜[ÙNÂˆžXÚš\]YQ]O^ÛX\šÙY›™]ÈÙ]

_NÂˆ›ÙKš[›™\’SX]ˆÛ\ÜÏH˜ÛÛ™][Û‹XÚ\È‰Ù›Ý[™›X\

ËJOO˜]ÛˆÛ\ÜÏH˜ÛÛ™][Û‹XÚ\ˆ]KXÛÛ™H‰Ú_H‰ÚßOØ]Û˜
Kš›Ú[Š	ÉÊ_OÙ]‚ˆ]ˆÛ\ÜÏH™š[˜[\Ý\Ý]\È¹l$xàj¸àcøàj8à Œxài9è®º*£xàfxà¢øàj9fç¹ëe8àiøàcxào¸àfxà Ù]˜Âˆ›ÙKœ]Y\žTÙ[XÝÜ[
	Ë˜ÛÛ™][Û‹XÚ\	ÊK™›Ü‘XXÚ

‹JOO˜‹›Û˜ÛXÚÏJ
OOžÂˆ‹˜Û\ÜÓ\ÝÙÙÛJ	ÛX\šÙY	ÊNÂˆYŠ‹˜Û\ÜÓ\Ý˜ÛÛZ[œÊ	ÛX\šÙY	ÊJHžXÚš\]YQ]K›X\šÙY˜Y
›Ý[™ÚWJNÂˆ[ÙHžXÚš\]YQ]K›X\šÙY™[]J›Ý[™ÚWJNÂˆžXÚš\]YT™XYO\žXÚš\]YQ]K›X\šÙYœÚ^™OŒÂˆJNÂˆ™]\›ŽÂˆB‚ˆYŠÚ[™OOIØÛÛ˜\Ý	Ê^ÂˆXÛÛ‹^ÛÛ[Iø¦¥»î#ÉÎÂˆ]K^ÛÛ[Iøào¸àfŒ¹¢§¸ào¸àiùíg¸à¢ÉÎÂˆ\ØË^ÛÛ[Iù§ 9í`¹fç¹ëe8àk¹bcxàjøà y«å:/ øàfxà¢Ì¹`&z(ç8à¤¹¦#¹é.¸àeøào¸àfxà ‰ÎÂˆžXÚš\]YT™XYOY˜[ÙNÂˆžXÚš\]YQ]O^Ùš[˜[\ÝÎ›™]ÈÙ]

_NÂˆ›ÙKš[›™\’SX]ˆÛ\ÜÏH™š[˜[\ÝYÜšY‰ÜK›Ü[ÛœË›X\

ËJOO˜]ÛˆÛ\ÜÏH™š[˜[\Ý[Ü[Ûˆˆ]KYš[˜[\ÝH‰Ú_H‰ÔÝš[™Ë™œ›ÛPÚ\ÛÙJJÚJ_Kˆ	ÛßOØ]Û˜
Kš›Ú[Š	ÉÊ_OÙ]‚ˆ]ˆÛ\ÜÏH™š[˜[\Ý\Ý]\ÈˆYH™š[˜[\ÝÝ]\ÈŒÈˆ:`n9¢§Ù]˜Âˆ›ÙKœ]Y\žTÙ[XÝÜ[
	Ë™š[˜[\Ý[Ü[Û‰ÊK™›Ü‘XXÚ

‹JOO˜‹›Û˜ÛXÚÏJ
OOžÂˆYŠžXÚš\]YQ]K™š[˜[\ÝËš\ÊJJ^ÂˆžXÚš\]YQ]K™š[˜[\ÝË™[]JJNØ‹˜Û\ÜÓ\Ýœ™[[Ý™J	ÜXÚÙY	ÊNÂˆY[ÙHYŠžXÚš\]YQ]K™š[˜[\ÝËœÚ^™OŠ^ÂˆžXÚš\]YQ]K™š[˜[\ÝË˜Y
JNØ‹˜Û\ÜÓ\Ý˜Y
	ÜXÚÙY	ÊNÂˆY[ÙHÜØ\Ý
	ù«å:/ øàfxà¢ù`&z(ç8àkÌ¸ài8ào¸àiøàiøàfIÊNÂˆžXÚš\]YT™XYO\žXÚš\]YQ]K™š[˜[\ÝËœÚ^™OOOLŽÂˆØÝ[Y[™Ù][[Y[žRY
	Ùš[˜[\ÝÝ]\ÉÊK^ÛÛ[X	ÜžXÚš\]YQ]K™š[˜[\ÝËœÚ^™_HÈˆ:`n9¢§˜ÂˆJNÂˆ™]\›ŽÂˆB‚ˆYŠÚ[™OOIÜÜYY	Ê^ÂˆXÛÛ‹^ÛÛ[Iø£ì{î#ÉÎÂˆ]K^ÛÛ[IÌyecÎL9éä¸àæ¸àï8à®IÎÂˆ\ØË^ÛÛ[IÎL9éä¸à¤º-¡xàb8àgøà¢xà xàa8àhøàgøà¤ùb)9¥«xàeøàiº)¢ùæí8àeøàn9fç¸àfy¡'ú)¦¸à¤º.ªøàjøài8àdxào¸àfxà ‰ÎÂˆžXÚš\]YT™XYO]YNÂˆžXÚš\]YQ]O^ßNÂˆžXÙT™[XZ[š[™ÏNLÂˆžXÙQ[\ÙYLÂˆ›ÙKš[›™\’SX]ˆÛ\ÜÏHœXÙK]Ü˜\‚ˆ]ˆÛ\ÜÏHœXÙKXÛØÚÈˆYHœXÙPÛØÚÈŽLÏÙ]‚ˆ]]ˆÛ\ÜÏHœXÙK]˜XÚÈ]ˆÛ\ÜÏHœXÙKYš[ˆYHœXÙQš[Ù]Ù]‚ˆ]ˆÛ\ÜÏHœXÙK[X™[ˆYHœXÙSX™[¹æë¹k¢{ï&ŽL9éä¹.éya¡xà ŒÌ9éä¹¦`¹à®xàiú`n9¢§º ¨¸à¤¹íg¸à¢¹iâøà xào¸àfxà Ù]Ù]‚ˆÙ]˜ÂˆžXÙR[™O\Ù][\˜[


OOžÂˆžXÙQ[\ÙY
ÊÎÂˆžXÙT™[XZ[š[™ËKNÂˆÛÛœÝÛØÚÏYØÝ[Y[™Ù][[Y[žRY
	ÜXÙPÛØÚÉÊNÂˆÛÛœÝš[YØÝ[Y[™Ù][[Y[žRY
	ÜXÙQš[	ÊNÂˆÛÛœÝX™[YØÝ[Y[™Ù][[Y[žRY
	ÜXÙSX™[	ÊNÂˆYŠXÛØÚßYš[[X™[
^ÜÝÜ]Y\Ý[Û”XÙ\Š
NÜ™]\›ŽßBˆYŠžXÙT™[XZ[š[™ÏL
^ÂˆÛØÚË^ÛÛ[X	ÜžXÙT™[XZ[š[™ß\ØÂˆš[œÝ[KÚYSX]›X^
žXÙT™[XZ[š[™ËÎL
ŒL
JÉÉIÎÂˆš[˜Û\ÜÓ\ÝÙÙÛJ	ÝØ\›‰ËžXÙT™[XZ[š[™ÏLÌ
NÂˆYŠžXÙT™[XZ[š[™ÏLÌ
HX™[^ÛÛ[Iù«¢øà¢ŒÌ9éä¹.éy."ûï&¹`&z(ç8à¤¹íg¸à¢¸à xàa8àhøàgøà¤ùfç¹ëe8à¤¹¬n¸à xào¸àeøà¡øàa¸à ‰ÎÂˆY[Ù^ÂˆÛØÚË^ÛÛ[X
ÉÓX]˜XœÊžXÙT™[XZ[š[™Ê_\ØÂˆÛØÚË˜Û\ÜÓ\Ý˜Y
	ÛÝ™\‰ÊNÂˆš[œÝ[KÚYIÌL	IÎÙš[˜Û\ÜÓ\Ý˜Y
	ÛÝ™\‰ÊNÂˆX™[^ÛÛ[IÎL9éä¸à¤º-¡z`c¸à ¹k§ù¢)¸àj¸à¢z)¢ùæí8àeøàåxàêxà¬8àn9fç¸àfyb)9¥«xà ¹§"yb®xàiøàfxà ‰ÎÂˆBˆKL
NÂˆ™]\›ŽÂˆB‚ˆYŠÚ[™OOIÜ™\X]	Ê^ÂˆXÛÛ‹^ÛÛ[Iü'å IÎÂˆ]K^ÛÛ[Iùbcyfç¸àk¸ài8ào¸àf¸àcxà¤¹ 'xàa9aî¸àfIÎÂˆ\ØË^ÛÛ[Iùd#8àf:e¤ú`exàa8à¤¹á(y¡#ú+f8àjùîl8à¢º/å8àexàj¸àa8àgøà xà ybcyfç¸àk¹c§ùfè8à¤¹ab8àjùè®º*£xàeøào¸àfxà ‰ÎÂˆÛÛœÝ\Ï\›Ùš[K›[ØÚÓZ\ÝZÙTÝ]ÏË–ÜKšYNÂˆÛÛœÝ\Ï\›Ùš[KœTÝ]ÏË–ÜKšYNÂˆÛÛœÝÜ™[˜\žOSX]›X^

\ÏË˜][\ß
KJ\ÏË˜ÛÜœ™XÝ
JNÂˆÛÛœÝZ\ÜÙ\ÏSX]›X^
\ÏË›Z\ÜÙ\ßÜ™[˜\žJNÂˆÛÛœÝ™X\ÛÛ[\ÏË›\Ý™X\ÛÛŸ\ÏË›\Ý™X\ÛÛŸ	ùc§ùfè9§*º*&:c,‰ÎÂˆžXÚš\]YT™XYOY˜[ÙNÂˆžXÚš\]YQ]O^ØÛÛ™š\›YY™˜[Ù_NÂˆ›ÙKš[›™\’SX]ˆÛ\ÜÏHœ™\X][Y[[ÜžH¸àdøàkº*å¹à®xàkº*©9ëe:*&:c,»ï&¹í!	ÛZ\ÜÙ\ßyfçØœ¹æí:/äxàk¹c§ùfè;ï&‰Ü™X\ÛÛŸOœ¹.â¹fç¸àkùd#8àf9c§ùfè8à¤º`oøàdxàiº)èøàcxào¸àfxà Ù]‚ˆ]ÛˆÛ\ÜÏHœ™\X]XÛÛ™š\›HˆYHœ™\X]ÛÛ™š\›H¹bcyfç¸àk¸ài8ào¸àf¸àcxà¤¹è®º*£xàeøàgÏØ]Û˜ÂˆØÝ[Y[™Ù][[Y[žRY
	Ü™\X]ÛÛ™š\›IÊK›Û˜ÛXÚÏYOOžÂˆžXÚš\]YQ]K˜ÛÛ™š\›YY]YNÜžXÚš\]YT™XYO]YNÂˆK˜Ý\œ™[\™Ù]˜Û\ÜÓ\Ý˜Y
	ÙÛ™IÊNÙK˜Ý\œ™[\™Ù]^ÛÛ[Iø§$È9è®º*£y®"8àoÉÎÂˆNÂˆ™]\›ŽÂˆB‚ˆ›ÞœÝ[K™\Ü^OIÛ›Û™IÎÂˆžXÚš\]YT™XYO]YNÂŸB‚™[˜Ý[Ûˆ˜[Y]TžXÚš\]YP™Y›Ü™P[œÝÙ\Š
^ÂˆÛÛœÝÚ[™\žÚ[™

NÂˆYŠ]Z^“[ÙOOOIÜ™]šY]ÉÊ^ÂˆYŠ\žXÚš\]YT™XYJ^ÂˆÜØ\Ý
	øào¸àfº*&9¡­¸àbøà¢yëe8àb8à¤¹ 'xàa9aî¸àeøài¸àbøà¢z`n9¢§º ¨¸àn:`,¸àoøào¸àeøà¡øàa‰ÊNÂˆ™]\›ˆ˜[ÙNÂˆBˆ™]\›ˆYNÂˆBˆYŠZÚ[™Ú[™OOIÚÛ›ÝÛYÙIÈÚ[™OOIÜÜYY	ÊH™]\›ˆYNÂˆYŠ\žXÚš\]YT™XYJ^ÂˆÛÛœÝ\ÙÜÏ^ÂˆØ[Î‰ú`%9.+yo#øà¤Œz(c8àh8àdxàiøà ¹¦î8àa8ài¸àbøà¢yfç¹ëe8àeøào¸àeøà¡øàa¸à ‰Ëˆ™XY‰ùecúhc9¥¡øàk¹§hy.íº*§¸à¤Œxài9è®º*£xàeøài¸àbøà¢yfç¹ëe8àeøào¸àeøà¡øàa¸à ‰ËˆÛÛ˜\Ý‰ù«å:/ øàfxà¢Ì¸ài8àk¹`&z(ç8à¤¹ab8àjú`n8à¤øàiøàcøàh8àexàa8à ‰Ëˆ™\X]‰ùbcyfç¸àk¸ài8ào¸àf¸àcxà¤¹è®º*£xàeøài¸àbøà¢yfç¹ëe8àeøào¸àeøà¡øàa¸à ‰ÂˆNÂˆÜØ\Ý
\ÙÜÖÚÚ[™_	ú)èøàcùbcxàk¸à®xàá¸ààøàåøà¤¹k£9.¡¸àeøài¸àcøàh8àexàa	ÊNÂˆ™]\›ˆ˜[ÙNÂˆBˆYŠÚ[™OOIØÛÛ˜\Ý	È	‰ˆ\žXÚš\]YQ]K™š[˜[\ÝËš\Ê]Z^”Ù[XÝY
J^ÂˆÜØ\Ý
	ùab8ànøàjz`n8à¤øàh¹¢§¸àk¹.+xàbøà¢y§ 9í`¹fç¹ëe8à¤º`n8à¤øàiøàcøàh8àexàa	ÊNÂˆ™]\›ˆ˜[ÙNÂˆBˆ™]\›ˆYNÂŸB‚‹ËÈOOOOHŒMŽˆY\]™H™\ØÜš\[Ûˆ[™Ú[™HOOOOB›]ž[Y\’[™O[[Â›]žÙXÛÛ™ÏLÂ‚˜ÛÛœÝ–ÐÐS×ÒÑVUÓÔ‘ÏVÉùgî¹¥l	Ë	ÌMº`,‰Ë	øàáøàï8à¯úaãÉË	ùê/9`ãIË	ù/èzh/9 )ÉË	ù¤#yæâ‰Ë	ú,¨ybæIË	øà®xàêøàï8àåøààøàâ	Ë	øà­xàå¸àãxààøàâ	Ë	ùå.ù`ãÉ×NÂ˜ÛÛœÝ–ÐÓÓ•TÕÒÑVUÓÔ‘ÏVÉÕÔ	Ë	ÕQ	Ë	øà®xà¯øààøà«ÉË	øà«xàéxàï	Ë	ùak:e¢úcmIË	ùalz`&ºcmIË	øàä8ààøà«øà¨¸ààøàåÉË	ÔSIË	Ô“ÓIË	øà¨¸à®8àèøà©8àêÉË	øà©¸àªxàï8à¯øàï8àåxàªxàï8àêÉË	ÔÓIË	ùæèù§îÉË	ùi%º`ê8à«xàï	×NÂ‚™[˜Ý[Ûˆ›Ü›X[^™T™X\ÛÛŠ™X\ÛÛŠ^ÂˆYŠÉùå*:*§¸à¤¹çéxà¢xàj¸àbøàhøàgÉË	øànøào9b!¸àbøà¢xàj¸àbøàhøàgÉ×Kš[˜ÛY\Ê™X\ÛÛŠJH™]\›ˆ	ùçéz+f9.#z-¬ÉÎÂˆYŠ™X\ÛÛOOIú*"9ë¥ù¥®y¬åxà¤¹oæ8à£8àgÉÊH™]\›ˆ	ú*"9ë¥øàçøà®IÎÂˆYŠ™X\ÛÛOOIùecúhc9¥¡øà¤º*«xàoú`exàb8àgÉÊH™]\›ˆ	ú*«xàoú`exàa	ÎÂˆ™]\›ˆ™X\ÛÛŸ	øàáøàï8à¯ù.#z-¬ÉÎÂŸB‹ËÈ‘HUQTÕŒÍÈ8 %ÝXš™XÝHY\]™H]šY[˜ÙHÛÛ™šY[˜ÙK‚‹ËÈ\È\È[š™XÝY[È\]ŒÍËšœÈ[ˆXÙHÙˆH™]š[Ý\È™XÛÛ[Y[™Y™\ØÜš\[ÛŠ
K‚‹ËÈ][X™\˜][H™]\Ù\È^\Ý[™È›Ùš[HšY[ÎÈ›È›Ùš[HØÚ[XHZYÜ˜][Ûˆ\È™\]Z\™Y‚˜ÛÛœÝŒÍ×ÐQTU‘WÔ‘PÒTÒSÓ—ÔÔPÏSØš™XÝ™œ™Y^™JÂˆ™\œÚ[ÛŽ‰ÝŒÍÉËˆ™X\ÛÛ•Ú[™ÝÑ^\ÎŒÌˆZ[‘\Ý[˜Ý™X\ÛÛ”]Y\Ý[ÛœÎŒ‹ˆZ[•[YY[œÝÙ\œÎKˆÛÝÔÙXÛÛ™ÎŒLLˆÙXZÐXØÝ\˜XÞU™\ÚÛŽˆÛXÞN‰ØXØÝ\˜XÞKX[™\™\X]\š[X\žK\™X\ÛÛ‹][YKYØ]Y[›Ë\ØÚ[XKXÚ[™ÙIÂŸJNÂ˜ÛÛœÝŒÍ×ÔÕP’‘PÕÐWÔ‘PTÓÓ”ÏSØš™XÝ™œ™Y^™JÉùçéz+f9.#z-¬ÉË	ú*"9ë¥øàçøà®IË	ú*«xàoú`exàa	Ë	Ì¹¢§¸àiú/íøàhøàgÉË	ù¦`ºe¤ù.#z-¬É×JNÂ‚™[˜Ý[ÛˆÝXš™XÝQ]šY[˜ÙPYÙQ^\ÕŒÍÊ˜[YJ^ÂˆÛÛœÝ˜]ÏTÝš[™Ê˜[Y_	ÉÊKš[J
NÂˆYŠK×—ÍKWÌŸKWÌŸIË\Ý
˜]ÊJ\™]\›ˆ[ÂˆÛÛœÝ]Q]Kœ\œÙJ˜]ÊÉÕŒŒ‰ÊNÂˆÛÛœÝ›ÝÏQ]Kœ\œÙJØØ[]RTÓÊ
JÉÕŒŒ‰ÊNÂˆYŠS[X™\‹š\Ñš[š]J]
_S[X™\‹š\Ñš[š]J›ÝÊJ\™]\›ˆ[Âˆ™]\›ˆX]›X^
X]™›ÛÜŠ
›ÝËX]
KÎ
JNÂŸB™[˜Ý[ÛˆÝXš™XÝPY\]™Q]šY[˜ÙUŒÍÊØ]
^Âˆ[œÝ\™T]Y\Ý[Û”›Ùš[J
NÂˆÛÛœÝYÏVË‹‹›™]ÈÙ]
ÙXZÔ]Y\Ý[Û’YÑ›ÜØ]
Ø]
JWNÂˆÛÛœÝ™X\ÛÛÛÝ[Ï^ßNÂˆÛÛœÝ™XÙ[™X\ÛÛÛÝ[Ï^ßNÂˆ][YY[œÝÙ\œÏLÙZYÚYÙXÛÛ™ÏLÂˆYË™›Ü‘XXÚ
YOžÂˆÛÛœÝ\Ý\›Ùš[KœTÝ]ÏË–ÚY_ßNÂˆÛÛœÝ\Ý\›Ùš[K›[ØÚÓZ\ÝZÙTÝ]ÏË–ÚY_ßNÂˆÛÛœÝ[YYSX]›X^
[X™\Š\Ý[YY[œÝÙ\œÊ_
NÂˆÛÛœÝ]™ÏSX]›X^
[X™\Š\Ý˜]™ÔÙXÛÛ™Ê_
NÂˆYŠ[YYŒ	‰˜]™ÏŒ
^Ý[YY[œÝÙ\œÊÏ][YYÝÙZYÚYÙXÛÛ™ÊÏ][YY
˜]™ÎßBˆÛÛœÝ™X\ÛÛ[›Ü›X[^™T™X\ÛÛŠ™X\ÛÛ‘›Ü”]Y\Ý[ÛŠY
JNÂˆYŠUŒÍ×ÔÕP’‘PÕÐWÔ‘PTÓÓ”Ëš[˜ÛY\Ê™X\ÛÛŠJ\™]\›ŽÂˆ™X\ÛÛÛÝ[ÖÜ™X\ÛÛ—OJ™X\ÛÛÛÝ[ÖÜ™X\ÛÛ—_
JÌNÂˆÛÛœÝ]\ÏVÜ\Ý›\Ý\Ý›\ÝK™š[\Š›ÛÛX[ŠKœÛÜ

NÂˆÛÛœÝYÙO\ÝXš™XÝQ]šY[˜ÙPYÙQ^\ÕŒÍÊ]\Ë˜]
LJJNÂˆYŠYÙHO[[	‰˜YÙOUŒÍ×ÐQTU‘WÔ‘PÒTÒSÓ—ÔÔPËœ™X\ÛÛ•Ú[™ÝÑ^\Ê^Âˆ™XÙ[™X\ÛÛÛÝ[ÖÜ™X\ÛÛ—OJ™XÙ[™X\ÛÛÛÝ[ÖÜ™X\ÛÛ—_
JÌNÂˆBˆJNÂˆÛÛœÝ˜[šÙYSØš™XÝ™[šY\Ê™X\ÛÛÛÝ[ÊKœÛÜ

KŠOO˜–ÌWKXVÌW_ŒÍ×ÔÕP’‘PÕÐWÔ‘PTÓÓ”Ëš[™^ÙŠVÌJKUŒÍ×ÔÕP’‘PÕÐWÔ‘PTÓÓ”Ëš[™^ÙŠ–ÌJJNÂˆÛÛœÝ™X\ÛÛ\˜[šÙYÌOË–Ì_[ÂˆÛÛœÝ™X\ÛÛ”Ý\Ü\˜[šÙYÌOË–ÌW_ÂˆÛÛœÝÙXÛÛ™Ý\Ü\˜[šÙYÌWOË–ÌW_ÂˆÛÛœÝ™XÙ[™X\ÛÛ”Ý\Ü\™X\ÛÛÊ™XÙ[™X\ÛÛÛÝ[ÖÜ™X\ÛÛ—_
NŒÂˆÛÛœÝ™X\ÛÛÛÛ™šY[HH\™X\ÛÛ‰‰œ™X\ÛÛ”Ý\ÜUŒÍ×ÐQTU‘WÔ‘PÒTÒSÓ—ÔÔPË›Z[‘\Ý[˜Ý™X\ÛÛ”]Y\Ý[ÛœÉ‰œ™XÙ[™X\ÛÛ”Ý\ÜLI‰œ™X\ÛÛ”Ý\ÜœÙXÛÛ™Ý\ÜÂˆ™]\›ˆÂˆØ]ˆ™X\ÛÛ‹ˆ™X\ÛÛ”Ý\Üˆ™XÙ[™X\ÛÛ”Ý\Üˆ™X\ÛÛÛÛ™šY[ˆ[YY[œÝÙ\œËˆ]™ÔÙXÛÛ™Î[YY[œÝÙ\œÏÓX]œ›Ý[™
ÙZYÚYÙXÛÛ™ËÝ[YY[œÝÙ\œÊNŒˆ[Z[™ÐÛÛ™šY[[YY[œÝÙ\œÏUŒÍ×ÐQTU‘WÔ‘PÒTÒSÓ—ÔÔPË›Z[•[YY[œÝÙ\œÂˆNÂŸB™[˜Ý[ÛˆÝXš™XÝT™\ØÜš\[Û‘XÚ\Ú[Û•ŒÍÊÜ]šY[˜ÙJ^ÂˆÛÛœÝOY]šY[˜Ù_ßNÂˆÛÛœÝXØÝ\˜XÞOS[X™\ŠÜË˜XØÝ\˜XÞJNÂˆÛÛœÝÙXZÐXØÝ\˜XÞOS[X™\‹š\Ñš[š]JXØÝ\˜XÞJI‰˜XØÝ\˜XÞOŒÍ×ÐQTU‘WÔ‘PÒTÒSÓ—ÔÔPËÙXZÐXØÝ\˜XÞU™\ÚÛÂˆÛÛœÝ™\X]ÏSX]›X^
[X™\ŠÜËœ™\X]Ê_
NÂˆÛÛœÝ™X\ÛÛYKœ™X\ÛÛŸ[ÂˆÛÛœÝ˜\ÙO^ØØ]ÜË˜Ø]	ùgî¹é#¹ä!º*å‰Ëš[Üš]N“[X™\ŠÜËœš[Üš]J_ŒÍÑ]šY[˜ÙNžË‹‹™KÙXZÐXØÝ\˜XÞK™\X]ß_NÂ‚ˆYŠKœ™X\ÛÛÛÛ™šY[
^ÂˆYŠ™X\ÛÛOOIú*"9ë¥øàçøà®IÊ\™]\›ˆË‹‹˜˜\ÙKÚ[™‰ØØ[ÉË™X\ÛÛ‹]šY[˜ÙPÛÛ™šY[˜ÙN‰Ü™X\ÛÛ‹\™\X]Y	ßNÂˆYŠ™X\ÛÛOOIú*«xàoú`exàa	Ê\™]\›ˆË‹‹˜˜\ÙKÚ[™‰Ü™XY	Ë™X\ÛÛ‹]šY[˜ÙPÛÛ™šY[˜ÙN‰Ü™X\ÛÛ‹\™\X]Y	ßNÂˆYŠ™X\ÛÛOOIÌ¹¢§¸àiú/íøàhøàgÉÊ\™]\›ˆË‹‹˜˜\ÙKÚ[™‰ØÛÛ˜\Ý	Ë™X\ÛÛ‹]šY[˜ÙPÛÛ™šY[˜ÙN‰Ü™X\ÛÛ‹\™\X]Y	ßNÂˆYŠ™X\ÛÛOOIù¦`ºe¤ù.#z-¬ÉÉ‰™K[Z[™ÐÛÛ™šY[	‰™K˜]™ÔÙXÛÛ™ÏUŒÍ×ÐQTU‘WÔ‘PÒTÒSÓ—ÔÔPËœÛÝÔÙXÛÛ™É‰ÙXZÐXØÝ\˜XÞJ^Âˆ™]\›ˆË‹‹˜˜\ÙKÚ[™‰ÜÜYY	Ë™X\ÛÛ‹]šY[˜ÙPÛÛ™šY[˜ÙN‰Ü™X\ÛÛ‹X[™][YIßNÂˆBˆYŠ™X\ÛÛOOIùçéz+f9.#z-¬ÉÊ\™]\›ˆË‹‹˜˜\ÙKÚ[™‰ÚÛ›ÝÛYÙIË™X\ÛÛ‹]šY[˜ÙPÛÛ™šY[˜ÙN‰Ü™X\ÛÛ‹\™\X]Y	ßNÂˆB‚ˆËÈHÚ[™ÛH™XÙ[[YK\ÚÜYÙH™\ÜX^H™XÛÛYHXÝ[Û˜X›HÛ›HÚ[ˆYX\Ý\™Y[Z[™ÂˆËÈ[™ÙXZÈXØÝ\˜XÞHÛÜœ›Ø›Ü˜]H]ˆÛÝËX]XÛÜœ™XÝ]H[Û™H]\Ý™]™\ˆ›Ü˜ÙHÜYYÛÜšË‚ˆYŠ™X\ÛÛOOIù¦`ºe¤ù.#z-¬ÉÉ‰™Kœ™X\ÛÛ”Ý\ÜLI‰™Kœ™XÙ[™X\ÛÛ”Ý\ÜLI‰™K[Z[™ÐÛÛ™šY[	‰™K˜]™ÔÙXÛÛ™ÏUŒÍ×ÐQTU‘WÔ‘PÒTÒSÓ—ÔÔPËœÛÝÔÙXÛÛ™É‰ÙXZÐXØÝ\˜XÞJ^Âˆ™]\›ˆË‹‹˜˜\ÙKÚ[™‰ÜÜYY	Ë™X\ÛÛ‹]šY[˜ÙPÛÛ™šY[˜ÙN‰Ü™X\ÛÛ‹][YKXÛÜœ›Ø›Ü˜]Y	ßNÂˆBˆYŠ™\X]ÏLŠ\™]\›ˆË‹‹˜˜\ÙKÚ[™‰Ü™\X]	Ë™X\ÛÛŽ‰ùîl8à¢º/å8àeú*©9ëe	Ë]šY[˜ÙPÛÛ™šY[˜ÙN‰Ü™\X]Y\œ›ÜœÉßNÂˆ™]\›ˆË‹‹˜˜\ÙKÚ[™‰ÚÛ›ÝÛYÙIË™X\ÛÛŽ‰øàáøàï8à¯ù.#z-¬ÉË]šY[˜ÙPÛÛ™šY[˜ÙN‰Ú[œÝY™šXÚY[	ßNÂŸB™[˜Ý[Ûˆ™XÛÛ[Y[™Y™\ØÜš\[ÛŠ
^ÂˆÛÛœÝÜ\ÛÜYØ]YÛÜžP[˜[]XÜÊ
VÌ_ØØ]‰ùgî¹é#¹ä!º*å‰ËÛZ[˜[‰øàáøàï8à¯ù.#z-¬ÉË]™ÔÙXÎŒ™\X]ÎŒš[Üš]NŒXØÝ\˜XÞNŒNÂˆÛÛœÝ]šY[˜ÙO\ÝXš™XÝPY\]™Q]šY[˜ÙUŒÍÊÜ˜Ø]
NÂˆ™]\›ˆÝXš™XÝT™\ØÜš\[Û‘XÚ\Ú[Û•ŒÍÊÜ]šY[˜ÙJNÂŸB™ÛØ˜[\Ë•ŒÍ×ÐQTU‘WÔ‘PÒTÒSÓ—ÔÔPÏUŒÍ×ÐQTU‘WÔ‘PÒTÒSÓ—ÔÔPÎÂ™ÛØ˜[\ËœÝXš™XÝPY\]™Q]šY[˜ÙUŒÍÏ\ÝXš™XÝPY\]™Q]šY[˜ÙUŒÍÎÂ™ÛØ˜[\ËœÝXš™XÝT™\ØÜš\[Û‘XÚ\Ú[Û•ŒÍÏ\ÝXš™XÝT™\ØÜš\[Û‘XÚ\Ú[Û•ŒÍÎÂ™[˜Ý[Ûˆ™\ØÜš\[Û“Y]J[ÙSÜ”ž
^Âˆ]ž[[ÙSÜ”žÂˆYŠ\[ÙˆžOOIÜÝš[™ÉÊ^ÂˆÛÛœÝ\Ï\žœÜ]
	Î‰ÊNÂˆž^ÚÚ[™œ\ÖÌW_	ÚÛ›ÝÛYÙIËØ]œ\ËœÛXÙJŠKš›Ú[Š	Î‰Ê_ÙXZÙ\ÝÚÚ[

_NÂˆBˆÛÛœÝX\^ÂˆÛ›ÝÛYÙNžÚXÛÛŽ‰ü'äæ	Ë]N˜	Üž˜Ø]{ï&¹çéz+f:(ç9o-Ø\ØÎ‰úe¨º`(ù¥fy§d8àiùä!º)èøà¤¹/g8àhøài¸àbøà¢y¯%9ïä¸àn:`,¸àoøào¸àfxà ‰ßKˆØ[ÎžÚXÛÛŽ‰ü'éë‰Ë]N˜	Üž˜Ø]{ï&º*"9ë¥øàâxàê¸àêØ\ØÎ‰ù¥l9`)8àîùo#øàîùcf9/cxà¤¹. ykéøàjú/ïxàa¹ecúhc8à¤¹a*¹ab8àeøào¸àfxà ‰ßKˆ™XYžÚXÛÛŽ‰ü'å#IË]N˜	Üž˜Ø]{ï&¹§hy.íº*§¸àâxàê¸àêØ\ØÎ‰øà#9§ 8à º`jyb!øà#xà#9.éy."¸àîù§*¹® 8à#xàj¸àjy§hy.í¸à¤¹¡#ú+f8àeøàiº)èøàcxào¸àfxà ‰ßKˆÛÛ˜\ÝžÚXÛÛŽ‰ø¦¥»î#ÉË]N˜	Üž˜Ø]{ï&¹«å:/ øàâxàê¸àêØ\ØÎ‰ù//8àgùå*:*§¸àîù¥®yo#øàkº`exàa8à¤¹¨.y¢è9.æ8àcxàiú`n8àm¹íí9ïä¸àiøàfxà ‰ßKˆÜYYžÚXÛÛŽ‰ø£ì{î#ÉË]N˜	Üž˜Ø]{ï&ŒMyb!¸à®xàåøàê¸àìøàâ\ØÎ‰ÌL9ecøà¤ŒMyb!¸à ŒyecÎL9éä¸à¤¹æë¹k¢xàjù¦`ºe¤úacyb!¸à¤¹íí9ïä¸àeøào¸àfxà ‰ßKˆ™\X]žÚXÛÛŽ‰ü'å IË]N˜	Üž˜Ø]{ï&¹îl8à¢º/å8àeú*©9ëe8ài8àm¸àeØ\ØÎ‰ù/eyn©¸à ºe¤ú`exàb8ài¸àa8à¢ùecúhc8àîú*å¹à®xà¤¹§ 9a*¹ab8àiú)èøàcyæí8àeøào¸àfxà ‰ßBˆNÂˆ™]\›ˆX\ÜžšÚ[™_X\šÛ›ÝÛYÙNÂŸB™[˜Ý[Ûˆž[ÙJž\™XÛÛ[Y[™Y™\ØÜš\[ÛŠ
J^Ü™]\›ˆž‰ÜžšÚ[™N‰Üž˜Ø]XßB™[˜Ý[Ûˆ]Y\Ý[Û“X]Ú\ÒÙ^]ÛÜ™ÊKÛÜ™Ê^ØÛÛœÝX	ÜK˜ÛÛ˜Ù\H	ÜKœ_XÜ™]\›ˆÛÜ™ËœÛÛYJÏOš[˜ÛY\ÊÊJNßB™[˜Ý[ÛˆY]Z^”ÛÛ
ÛÛØ]ÛÝ[
^ÂˆÛÛœÝ\ÙY[™]ÈÙ]
ÛÛ›X\
OOœKšY
JNÂˆÛÛœÝØ[YO\ÚY™›Y
UQTÕSÓ—ÐS’Ë™š[\ŠOOœK˜Ø]OOXØ]	‰ˆ]\ÙYš\ÊKšY
JJNÂˆÛÛœÝ™\Ý\ÚY™›Y
UQTÕSÓ—ÐS’Ë™š[\ŠOOˆ]\ÙYš\ÊKšY
JJNÂˆ™]\›ˆË‹‹œÛÛ‹‹œØ[YK‹‹œ™\ÝKœÛXÙJÛÝ[
NÂŸB™[˜Ý[ÛˆZ[™\ØÜš\[Û”]Z^Š[ÙJ^ÂˆÛÛœÝTÝš[™Ê[ÙJKœÜ]
	Î‰ÊNÂˆÛÛœÝÚ[™\ÌW_	ÚÛ›ÝÛYÙIËØ]\œÛXÙJŠKš›Ú[Š	Î‰Ê_ÙXZÙ\ÝÚÚ[

NÂˆÛÛœÝØ[YOTUQTÕSÓ—ÐS’Ë™š[\ŠOOœK˜Ø]OOXØ]
NÂˆ]ÛÛV×NÂˆYŠÚ[™OOIØØ[ÉÊ^ÂˆÛÛ\ÚY™›Y
Ø[YK™š[\ŠOOœ]Y\Ý[Û“X]Ú\ÒÙ^]ÛÜ™ÊK–ÐÐS×ÒÑVUÓÔ‘ÊJJNÂˆYŠÛÛ›[™ÝŠHÛÛVË‹‹œÛÛ‹‹œÚY™›Y
UQTÕSÓ—ÐS’Ë™š[\ŠOOœ]Y\Ý[Û“X]Ú\ÒÙ^]ÛÜ™ÊK–ÐÐS×ÒÑVUÓÔ‘ÊI‰ˆ\ÛÛœÛÛYJOžšYOO\KšY
JJWNÂˆ™]\›ˆY]Z^”ÛÛ
ÛÛØ]
NÂˆBˆYŠÚ[™OOIÜ™XY	Ê^ÂˆÛÛœÝÛÜ™ÏVÉù§ 8à º`jyb!ÉË	ú`jyb!ÉË	ù§*¹® 	Ë	ù.éy."‰Ë	ù«(xàjÉË	ù..øàj‰Ë	ù. :"+8àjÉË	øàjxà£	×NÂˆ™]\›ˆY]Z^”ÛÛ
ÚY™›Y
Ø[YK™š[\ŠOOÛÜ™ËœÛÛYJÏOœKœKš[˜ÛY\ÊÊJJJKØ]
NÂˆBˆYŠÚ[™OOIØÛÛ˜\Ý	Ê^ÂˆÛÛ\ÚY™›Y
Ø[YK™š[\ŠOOœ]Y\Ý[Û“X]Ú\ÒÙ^]ÛÜ™ÊK–ÐÓÓ•TÕÒÑVUÓÔ‘ÊJJNÂˆYŠÛÛ›[™ÝŠHÛÛVË‹‹œÛÛ‹‹œÚY™›Y
UQTÕSÓ—ÐS’Ë™š[\ŠOOœ]Y\Ý[Û“X]Ú\ÒÙ^]ÛÜ™ÊK–ÐÓÓ•TÕÒÑVUÓÔ‘ÊI‰ˆ\ÛÛœÛÛYJOžšYOO\KšY
JJWNÂˆ™]\›ˆY]Z^”ÛÛ
ÛÛØ]
NÂˆBˆYŠÚ[™OOIÜ™\X]	Ê^ÂˆÛÛœÝYÏ[™]ÈÙ]
™\X]YÜ›Û™Ô]Y\Ý[ÛœÊ
K›X\
OžœKšY
JNÂˆ™]\›ˆY]Z^”ÛÛ
ÚY™›Y
UQTÕSÓ—ÐS’Ë™š[\ŠOOšYËš\ÊKšY
JJKØ]
NÂˆBˆYŠÚ[™OOIÜÜYY	ÊH™]\›ˆY]Z^”ÛÛ
ÚY™›Y
Ø[YJKØ]L
NÂˆ™]\›ˆY]Z^”ÛÛ
ÚY™›Y
Ø[YJKØ]
NÂŸB™[˜Ý[ÛˆÝÜž[Y\Š
^ÂˆYŠž[Y\’[™J^ØÛX\’[\˜[
ž[Y\’[™JNÜž[Y\’[™O[[ßBˆžÙXÛÛ™ÏLÂˆÛÛœÝOYØÝ[Y[™Ù][[Y[žRY
	Üž[Y\‰ÊNÂˆYŠJ^ÙKœÝ[K™\Ü^OIÛ›Û™IÎÙK˜Û\ÜÓ\Ýœ™[[Ý™J	ÝØ\›‰ÊNßBŸB™[˜Ý[Ûˆ\]Tž[Y\Š
^ÂˆÛÛœÝOYØÝ[Y[™Ù][[Y[žRY
	Üž[Y\‰ÊNÚYŠYJ\™]\›ŽÂˆK^ÛÛ[X	ÔÝš[™ÊX]™›ÛÜŠžÙXÛÛ™ËÍŒ
JKœYÝ\
‹	Ì	Ê_N‰ÔÝš[™ÊžÙXÛÛ™ÉMŒ
KœYÝ\
‹	Ì	Ê_XÂˆK˜Û\ÜÓ\ÝÙÙÛJ	ÝØ\›‰ËžÙXÛÛ™ÏLN
NÂŸB™[˜Ý[ÛˆÝ\žÜYY[Y\Š
^ÂˆÝÜž[Y\Š
NÜžÙXÛÛ™ÏNLÂˆÛÛœÝOYØÝ[Y[™Ù][[Y[žRY
	Üž[Y\‰ÊNÚYŠJYKœÝ[K™\Ü^OIØ›ØÚÉÎÂˆ\]Tž[Y\Š
NÂˆž[Y\’[™O\Ù][\˜[


OOžÂˆžÙXÛÛ™ÏSX]›X^
žÙXÛÛ™ËLJNÝ\]Tž[Y\Š
NÂˆYŠžÙXÛÛ™ÏOOL
^ÜÝÜž[Y\Š
NÜÜØ\Ý
	ÌMyb!¹íc:`c¸àiøàfxà ¹«¢øà¢¸àkù«hùè®¸àexà¤¹a*¹ab8àeøàiº)èøàcxào¸àeøà¡øàa¸à ‰ÊNßBˆKL
NÂŸB™[˜Ý[ÛˆÛÛ™šYÝ\™T™\ØÜš\[Û•RJ[ÙJ^ÂˆÛÛœÝYØÝ[Y[™Ù][[Y[žRY
	Üž˜[›™\‰ÊNÚYŠXŠ\™]\›ŽÂˆYŠTÝš[™Ê[ÙJKœÝ\ÕÚ]
	Üž‰ÊJ^Ø‹œÝ[K™\Ü^OIÛ›Û™IÎÜÝÜž[Y\Š
NÜ™]\›ŽßBˆÛÛœÝO\™\ØÜš\[Û“Y]J[ÙJNÂˆ‹œÝ[K™\Ü^OIÙ›^	ÎÂˆØÝ[Y[™Ù][[Y[žRY
	Üž˜[›™\’XÛÛ‰ÊK^ÛÛ[[KšXÛÛŽÂˆØÝ[Y[™Ù][[Y[žRY
	Üž˜[›™\•]IÊK^ÛÛ[[K]NÂˆØÝ[Y[™Ù][[Y[žRY
	Üž˜[›™\‘\ØÉÊK^ÛÛ[[K™\ØÎÂˆYŠÝš[™Ê[ÙJKœÝ\ÕÚ]
	ÜžœÜYY‰ÊJ\Ý\žÜYY[Y\Š
NÙ[ÙHÝÜž[Y\Š
NÂŸB™[˜Ý[Ûˆ™Yœ™\Ú™\ØÜš\[ÛØ\™

^ÂˆÛÛœÝž\™XÛÛ[Y[™Y™\ØÜš\[ÛŠ
KO\™\ØÜš\[Û“Y]Jž
NÂˆÛÛœÝOYØÝ[Y[™Ù][[Y[žRY
	ÜžZ[šSX™[	ÊKYØÝ[Y[™Ù][[Y[žRY
	ÜžZ[šQ\ØÉÊNÂˆYŠJXK^ÛÛ[\žœ™X\ÛÛOOIøàáøàï8à¯ù.#z-¬ÉÏÉú*.¹¥«yå*	Îœžœ™X\ÛÛŽÂˆYŠŠX‹^ÛÛ[X	ÛKšXÛÛŸH	ÛK]_H8 %	ÛK™\ØßXÂŸB™[˜Ý[ÛˆÝ\™XÛÛ[Y[™Y™\ØÜš\[ÛŠ
^ÂˆÛÛœÝž\™XÛÛ[Y[™Y™\ØÜš\[ÛŠ
NÂˆYŠžšÚ[™OOIÚÛ›ÝÛYÙIÊ^ÜÝ\\ÜÛÛŠXÚÓ\ÜÛÛ‘›Ü”ÚÚ[
ž˜Ø]
JNÜ™]\›ŽßBˆÚÝÔØÜ™Y[Š	Ü›Ø›[\ÉÊNÜÝ\]Z^Šž[ÙJž
JNÂŸB™ØÝ[Y[™Ù][[Y[žRY
	ÜÝ\™\ØÜš\[Û‰ÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉËÝ\™XÛÛ[Y[™Y™\ØÜš\[ÛŠNÂ‚‹ËÈYH™\ØÜš\[ÛˆÈHÙXZÛ™\ÜÈYšXÙHY\ˆ[ŒMH›Ù\ËÙ[˜Ý[ÛœÈ\™H]˜Z[X›K‚˜ÛÛœÝÜ™[™\•ÙXZÑ\Ú›Ø\™ŒM\™[™\•ÙXZÑ\Ú›Ø\™Âœ™[™\•ÙXZÑ\Ú›Ø\™Y[˜Ý[ÛŠ
^ÂˆÜ™[™\•ÙXZÑ\Ú›Ø\™ŒMŠ
NÂˆÛÛœÝž\™XÛÛ[Y[™Y™\ØÜš\[ÛŠ
KO\™\ØÜš\[Û“Y]Jž
NÂˆÛÛœÝ›ÞYØÝ[Y[™Ù][[Y[žRY
	ÝÙXZÑY\YšXÙIÊNÂˆYŠ›Þ
H›Þš[›™\’S
ÏH]ˆÛ\ÜÏHœž\™\ØÜš\[Ûˆ¼'ä¢ˆ‘HUQTÕ8àk¹aé¹¥®{ï&Øˆ	ÛK]_Oœ‰ÛK™\ØßOÙ]˜ÂŸNÂ‚‹ËÈœ›ÛH\È[™HÛØ\™ÓQHX^HØY™[H\ÙHHž[™Ú[™K‚Ú[™ÝË‘‘TUQTÕÔ–Ô‘PQO]YNÂ‹ËÈŒLMÎˆ[š]X[™[™\š[™ÈÝ[ØZ]È›ÜˆHš[˜[[™H›ÛÝ˜\œšY\‹‚‚˜ÛÛœÝÜ™Yœ™\Ú›Ùš[URUŒM\™Yœ™\Ú›Ùš[URNÂœ™Yœ™\Ú›Ùš[UROY[˜Ý[ÛŠ
^ÂˆÜ™Yœ™\Ú›Ùš[URUŒMŠ
NÂˆ™Yœ™\Ú™\ØÜš\[ÛØ\™

NÂˆ™[™\•ÙXZÑ\Ú›Ø\™

NÂŸNÂ‚‚‚‹ËÈOOOOHŒNˆY[[ÜžH\Ú›Ø\™È›Ü™XØ\ÝOOOOB™[˜Ý[ÛˆÜ™]šY]ÐØ[™Y]\ÊLÊ^Âˆ[œÝ\™T]Y\Ý[Û”›Ùš[J
NÂˆÛÛœÝ][\YTUQTÕSÓ—ÐS’Ë™š[\ŠOOœ›Ùš[KœTÝ]ÖÜKšYOË˜][\ÏŒ
NÂˆ™]\›ˆ][\YœÛÜ

KŠOOœ™]šY]Õ\™Ù[˜ÞJŠK\™]šY]Õ\™Ù[˜ÞJJJKœÛXÙJŠNÂŸB™[˜Ý[Ûˆ™]šY]Õ[Z[™ÓX™[
Ý]
^ÂˆÛÛœÝYO\Ý]Ë™YNÂˆYŠYYJH™]\›ˆÝ^‰ùoªyïä¸à¯øà©8àçøàìøà¬;ï&º!ê¹båz*¯ù¥m	ËYN™˜[Ù_NÂˆÛÛœÝÙ^O[ØØ[]RTÓÊ
NÂˆYŠYO]Ù^JH™]\›ˆÝ^‰ùoªyïä¸à¯øà©8àçøàìøà¬;ï&¹.â‰ËYNY_NÂˆÛÛœÝ^\ÏSX]›X^
K^\Ð™]ÙY[’TÓÊÙ^KYJJNÂˆ™]\›ˆÝ^™^\ÏOOLOÉù«(yfç¸àk¹oªyïä»ï&¹¦#¹¥éIÎ˜9«(yfç¸àk¹oªyïä»ï&‰Ù^\ßy¥éyo£YN™˜[Ù_NÂŸB™[˜Ý[Ûˆ™[™\’ÛYT™]šY]ÐØ[™Y]\Ê
^ÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	ÚÛYT™]šY]ÐØ[™Y]\ÉÊNÂˆYŠ\›ÛÝ
H™]\›ŽÂˆÛÛœÝ][\Ï]Ü™]šY]ÐØ[™Y]\ÊÊNÂˆYŠZ][\Ë›[™Ý
^Âˆ›ÛÝš[›™\’SIÏ]ˆÛ\ÜÏH›Z[šKXØ\™]ˆÛ\ÜÏH˜šYÈ¼'éèÙ]¹ki¹ïä¸àáøàï8à¯ùo¡xàhOØ]ˆÛ\ÜÏHœÝXˆ¹ecúhc8à¤º)èøàcøàj8à yoæ8à£8àgxàa¸àjº*å¹à®xà¤¸àdøàdøàjú(j9é.¸àeøào¸àfxà Ù]Ù]‰ÎÂˆ™]\›ŽÂˆBˆÛÛœÝXÛÛœÏ^Éùgî¹é#¹ä!º*å‰Î‰ü'å(‰Ë	øà¬øàìøàå8àéxàï8à¯ÉÎ‰ø¦¦{î#ÉË	øàáøàï8à¯øàæxàï8à®IÎ‰ü'åàûî#ÉË	øàãxààøàâ8àëøàï8à«ÉÎ‰ü'ã$	Ë	øà®øà«xàéxàê¸àá¸à¨ÉÎ‰ü'æè{î#ÉË	øà¨¸àêøà­8àê¸à®¸àè	Î‰ü'éêIË	øàç¸àãxà®8àèxàìøàâ	Î‰ü'äâÉË	øà®xàâ8àêxàá¸à®	Î‰ü'äâ	ßNÂˆ›ÛÝš[›™\’SZ][\Ë›X\
OOžÂˆÛÛœÝÝ\›Ùš[KœTÝ]ÖÜKšYNÂˆÛÛœÝ[Y[[ÜžT™][[ÛŠÝ
OÏÌLÂˆÛÛœÝ[Z[™Ï\™]šY]Õ[Z[™ÓX™[
Ý
NÂˆ™]\›ˆ]ˆÛ\ÜÏH›Z[šKXØ\™]ˆÛ\ÜÏH˜šYÈ‰ÚXÛÛœÖÜK˜Ø]_	ü'éè	ßOÙ]‰Ù\ØØ\R[
K˜ÛÛ˜Ù\
_OØ‚ˆ]ˆÛ\ÜÏHœÝXˆ‰Ù\ØØ\R[
K˜Ø]
_xàîÉÙ\ØØ\R[
K˜ÛÙÛš]]™S]™[	ÉÊ_xàîù£ª9k¦¹/çy£ H	ÜŸIOÙ]‚ˆ]ˆÛ\ÜÏHœ›ÙÜ™\ÜÈˆÝ[OH›X\™Ú[‹]ÜŒL]ˆÝ[OHÚY‰ÜŸIHÙ]Ù]‚ˆ]ˆÛ\ÜÏH›Y[[ÜžK\š\ÚÈˆÝ[OH‰Ý[Z[™Ë™YOÉÉÎ‰ØÛÛÜŽ˜\ŠK[]]Y
IßH‰Ù\ØØ\R[
[Z[™Ë^
_OÙ]Ù]˜ÂˆJKš›Ú[Š	ÉÊNÂŸB™[˜Ý[Ûˆ™[™\“Y[[ÜžRX[

^ÂˆÛÛœÝ[Y[[ÜžRX[

NÂˆÛÛœÝYX\Ý\™YZ˜][\YŒÂˆÛÛœÝš[™ÏYØÝ[Y[™Ù][[Y[žRY
	ÛY[[ÜžRX[š[™ÉÊNÂˆYŠš[™Ê^Âˆš[™ËœÝ[KœÙ]›Ü\J	ËK[Y[[ÜžK\	ËYX\Ý\™YÚ˜]™ÎŒ
NÂˆš[™Ë˜Û\ÜÓ\ÝÙÙÛJ	Ú\Ë][›YX\Ý\™Y	Ë[YX\Ý\™Y
NÂˆš[™ËœÙ]]šX]J	Ø\šXK[X™[	ËYX\Ý\™YØ9£ª9k¦º*&9¡­¹/çy£ yã¡È	Ú˜]™ßIX‰ú*&9¡­¹/çy£ yã¡øàkù§*º*"9®+8àiøàfIÊNÂˆBˆÛÛœÝ˜[YOYØÝ[Y[™Ù][[Y[žRY
	ÛY[[ÜžRX[˜[YIÊNÂˆYŠ˜[YJH˜[YK^ÛÛ[[YX\Ý\™YÚ˜]™ÊÉÉIÎ‰ù§*º*"9®+	ÎÂˆÛÛœÝØ\[ÛYØÝ[Y[™Ù][[Y[žRY
	ÛY[[ÜžRX[Ø\[Û‰ÊNÂˆYŠØ\[ÛŠHØ\[Û‹^ÛÛ[[YX\Ý\™YÉù£ª9k¦¹/çy£ IÎ‰ùecúhc9¯%9ïä¹o£8àjú(j9é.‰ÎÂˆYŠØÝ[Y[™Ù][[Y[žRY
	ÛY[[ÜžQœ™\ÚÛÝ[	ÊJHØÝ[Y[™Ù][[Y[žRY
	ÛY[[ÜžQœ™\ÚÛÝ[	ÊK^ÛÛ[Z™œ™\ÚÂˆYŠØÝ[Y[™Ù][[Y[žRY
	ÛY[[ÜžTÛÛÛÛÝ[	ÊJHØÝ[Y[™Ù][[Y[žRY
	ÛY[[ÜžTÛÛÛÛÝ[	ÊK^ÛÛ[ZœÛÛÛŽÂˆYŠØÝ[Y[™Ù][[Y[žRY
	ÛY[[ÜžQYPÛÝ[	ÊJHØÝ[Y[™Ù][[Y[žRY
	ÛY[[ÜžQYPÛÝ[	ÊK^ÛÛ[Z™YNÂˆÛÛœÝ›ÝOYØÝ[Y[™Ù][[Y[žRY
	ÛY[[ÜžRX[YšXÙIÊNÂˆYŠ›ÝJ^ÂˆYŠ[YX\Ý\™Y
H›ÝK^ÛÛ[Iùecúhc9¯%9ïä¸à¤¸àfxà¢øàj8à yecúhc8àe8àj8àkº*&9¡­ºe¤úf¥8à¤¹ki¹ïä¸àeøài¹oªyïä¹¥éxà¤º*¯ù¥m8àeøào¸àfxà ‰ÎÂˆ[ÙHYŠ™YOŒ
H›ÝKš[›™\’SX‰Ú™Y_yecøàc9oªyïä¸à¯øà©8àçøàìøà¬8àiøàfxà Øˆ9.â¹¥éxàk¹oªyïä¸àiøàkùoæ9cm8àê¸à®xà«øàc:jæ8àa:h!¸àjùaîºhc8àeøào¸àfxà ˜Âˆ[ÙHYŠœÛÛÛŒ
H›ÝKš[›™\’SX9ãï¹g*8àkùk¢yk¦¸àeøài¸àa8ào¸àfxà ‰ÚœÛÛÛŸyecøàc:/äxàa8àa¸àhxàjùoªyïä¸àn9¢.øà¢ú)¢ú/¯8àoÏØ¸àiøàfxà ˜Âˆ[ÙH›ÝK^ÛÛ[Iùãï¹g*9ki¹ïä¹®"8àoøàk¹ecúhc8àkøà¢8àcù/çy£ xàiøàcxài¸àa8ào¸àfxà ¹¥¬8àeøàa9ëá9fì¸à¤º`,¸à xài¹©âøàa8ào¸àføà¤øà ‰ÎÂˆBŸB™[˜Ý[Ûˆ™[™\”™]šY]Ñ›Ü™XØ\Ý

^ÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	Ü™]šY]Ñ›Ü™XØ\Ý	ÊNÂˆYŠ\›ÛÝ
H™]\›ŽÂˆÛÛœÝ›ÝÜÏ\™]šY]Ñ›Ü™XØ\Ý
ÊNÂˆÛÛœÝX^SX]›X^
K‹‹œ›ÝÜË›X\
Ož˜ÛÝ[
JNÂˆÛÛœÝ˜[Y\ÏVÉù¥éIË	ù§"	Ë	ùàjÉË	ù¬-	Ë	ù§*	Ë	úaäIË	ùg'É×NÂˆ›ÛÝš[›™\’S\›ÝÜË›X\

JOOžÂˆÛÛœÝ\\œÙSØØ[TÓÊ™]JNÂˆÛÛœÝZYÚ^˜ÛÝ[ÓX]›X^
LX]œ›Ý[™
˜ÛÝ[ÛX^
ŒL
JNÂˆ™]\›ˆ]ˆÛ\ÜÏH™›Ü™XØ\ÝY^H	ÚOOOLÉÝÙ^IÎ‰ÉßH‚ˆ]ˆÛ\ÜÏH™›Ü™XØ\ÝXÛÝ[‰Þ˜ÛÝ[Þ˜ÛÝ[
ÉùecÉÎ‰ÉßOÙ]‚ˆ]ˆÛ\ÜÏH™›Ü™XØ\ÝX˜\‹]Ü˜\]ˆÛ\ÜÏH™›Ü™XØ\ÝX˜\ˆˆÝ[OHšZYÚ‰ÚZYÚIHÙ]Ù]‚ˆ]ˆÛ\ÜÏH™›Ü™XØ\Ý[X™[‰ÚOOOLÉù.â¹¥éIÎ›˜[Y\ÖÙ™Ù]^J
W_OÙ]‚ˆÙ]˜ÂˆJKš›Ú[Š	ÉÊNÂŸB™[˜Ý[Ûˆ™[™\“Y[[ÜžQ\Ú›Ø\™

^Âˆ™[™\’ÛYT™]šY]ÐØ[™Y]\Ê
NÂˆ™[™\“Y[[ÜžRX[

NÂˆ™[™\”™]šY]Ñ›Ü™XØ\Ý

NÂˆ\]QYPÛÝ[

NÂˆ™[™\”™]šY]Ò›Ý\›™^RXŠ
NÂŸB™ØÝ[Y[™Ù][[Y[žRY
	ÜÝ\›Ü™XØ\Ý™]šY]ÉÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOžÂˆÚÝÔØÜ™Y[Š	Ü›Ø›[\ÉÊNÂˆÝ\]Z^Š	Ü™]šY]ÉÊNÂŸJNÂ‚˜ÛÛœÝÜ™[™\”[›™\”ØÜ™Y[•ŒN\™[™\”[›™\”ØÜ™Y[ŽÂœ™[™\”[›™\”ØÜ™Y[Y[˜Ý[ÛŠ
^ÂˆÜ™[™\”[›™\”ØÜ™Y[•ŒN

NÂˆ™[™\“Y[[ÜžQ\Ú›Ø\™

NÂŸNÂ‚˜ÛÛœÝÜ™Yœ™\Ú›Ùš[URUŒN\™Yœ™\Ú›Ùš[URNÂœ™Yœ™\Ú›Ùš[UROY[˜Ý[ÛŠ
^ÂˆÜ™Yœ™\Ú›Ùš[URUŒN

NÂˆ™[™\“Y[[ÜžQ\Ú›Ø\™

NÂŸNÂ‚œ™[™\“Y[[ÜžQ\Ú›Ø\™

NÂ‚‚‹ËÈOOOOHŒNNˆ˜\šX[™]šY]ÈÙ][™ÜÈOOOOB™[˜Ý[Ûˆ™Yœ™\Ú˜\šX[™]šY]ÕRJ
^ÂˆÛÛœÝYØÝ[Y[™Ù][[Y[žRY
	Ý˜\šX[™]šY]ÕÙÙÛIÊNÂˆYŠ
]˜ÚXÚÙY\›Ùš[KœÙ][™ÜË˜\šX[™]šY]ÈOOY˜[ÙNÂˆÛÛœÝÏ]˜\šX[ÛÝ™\˜YÙJ
NÂˆÛÛœÝOYØÝ[Y[™Ù][[Y[žRY
	Ý˜\šX[ÛÝ™\˜YÙU^	ÊNÂˆYŠJYK^ÛÛ[X8àäxàêxàèxàï8à¯ùå'ù¢$	ØË˜ÛÛ˜Ù\ßz*å¹à®xàîÉØË™\™XÝyecøà¤¹æí9£©ykï¹oç8à ¸àgxàk¹.å¸àkùd#8àf8àá¸àï8àç¸àk¹b)yecúhc8à¤¹a*¹ab8àeøà xàj¸àdxà£8àl9a`ùecúhc8à¤¹oªyïä¸à ˜ÂŸB™ØÝ[Y[™Ù][[Y[žRY
	Ý˜\šX[™]šY]ÕÙÙÛIÊOË˜Y]™[\Ý[™\Š	ØÚ[™ÙIËOOžÂˆ›Ùš[KœÙ][™ÜË˜\šX[™]šY]ÏHHYK\™Ù]˜ÚXÚÙYÂˆØ]™T›Ùš[J
NÂˆ™Yœ™\Ú˜\šX[™]šY]ÕRJ
NÂˆÜØ\Ý
›Ùš[KœÙ][™ÜË˜\šX[™]šY]ÏÉùoªyïä¸àiúhgºhc8à¤¹a*¹ab8àeøào¸àfIÎ‰ùa`ùecúhc8à¤¸àgxàk¸ào¸ào¹oªyïä¸àeøào¸àfIÊNÂŸJNÂœ™Yœ™\Ú˜\šX[™]šY]ÕRJ
NÂ‚‚‹ËÈOOOOHŒÎˆÝXÝ\˜[Ù[‹XÚXÚÈOOOOB‚˜ÛÛœÝUQTÕSÓ—ÔÑSPS•P×ÐÓÓ•PÕÏ^È˜Ú[[™ÙWÌHŽˆŒŒ9éäˆ‹˜Ú[[™ÙWÌˆŽˆŒKž]H‹˜Ú[[™ÙWÌÈŽˆMˆ‹˜Ú[[™ÙWÌŽˆŒKŒH‹˜Ú[[™ÙWÌHŽˆ‹˜Ú[[™ÙWÌˆŽˆŒLL‹˜Ú[[™ÙWÌÈŽˆŒLLLLLH‹˜Ú[[™ÙWÌŽˆ‹M‹˜Ú[[™ÙWÌHŽˆÌˆ‹˜Ú[[™ÙWÌLŽˆŒLL‹˜Ú[[™ÙWÌLHŽˆžÌËKŸH‹˜Ú[[™ÙWÌLÈŽˆŒ8à LH‹˜Ú[[™ÙWÌNHŽˆŒL‹ya!9doy.é‹˜Ú[[™ÙWÌŒHŽˆÛœÈ‹˜Ú[[™ÙWÌŒÈŽˆŒKŽ9.í‹ùéäˆ‹˜Ú[[™ÙWÌHŽˆŽNIH‹˜Ú[[™ÙWÌˆŽˆŒŽNH‹˜Ú[[™ÙWÌÈŽˆ‹ŒŒž]H‹˜Ú[[™ÙWÌŽŽˆŒKÍž]H‹˜Ú[[™ÙWÌÍHŽˆŒˆ‹˜Ú[[™ÙWÌÍˆŽˆŒNL‹ŒMŽŒLŒLŽ‹˜Ú[[™ÙWÌÈŽˆŒL¹¥éH‹˜Ú[[™ÙWÌHŽˆ”ÕKLŒ8à PÕKLL‹˜Ú[[™ÙWÌˆŽˆŒKŒˆ‹˜Ú[[™ÙWÌLÈŽˆŒL9`"È‹˜Ú[[™ÙWÌMŽˆŒKL9.!ùa¡ˆ‹˜Ú[[™ÙWÌMHŽˆŒML9.!ùa¡ˆ‹˜Ú[[™ÙWÌMÈŽˆŒÌ9.!ùa¡ˆ‹˜Ú[[™ÙWÌNŽˆ9.!ùa¡ˆ‹˜Ú[[™ÙWÝŽL—ÌWÌÈŽˆŒLLL‹˜Ú[[™ÙWÝŽL—Ì—ÌˆŽˆŒËÎ‹˜Ú[[™ÙWÝŽL—Ì—ÌŽˆŒØš]‹˜ÛÛ\]\‹LŽˆŒyéäˆ‹˜ÛÛ\]\‹LHŽˆŒŒœÈ‹˜ÛÛ\]\‹LLˆŽˆ•ˆ‹˜ÛÛ\]\‹LLÈŽˆŒŽL‹™‹LˆŽˆ”ÕSJ[[Ý[
H‹™‹LMˆŽˆ”“ÓPÒÈ‹›™]LÈŽˆŒNL‹ŒMŽŒLŒ‹›™]LHŽˆ‘Ô‹›™]LLŽˆ”ÖSˆ8¡¤ˆÖS‹ÐPÒÈ8¡¤ˆPÒÈ‹›™]LLˆŽˆŒNL‹ŒMŽŒLŒŒ‹›™]LNŽˆŒÌ‹›™]LNHŽˆ¸àáøàåxàªxàêøàâ8à¬¸àï8àâ8à©¸à©øà©‹œÙXËLLÈŽˆ¹aî¹b¦ù¦`¸àjÒS8àj8àeøài¹ânyb)xàj¹¡#ùdløà¤¹£ xài9¥¡ùkeøà¤º`jyb!øàjøàª8à®xà¬xàï8àåøàfxà¢È‹œÙXËLMŽˆ¹£ª9®+9fì:fèøàjÔÔ‘¸àâ8àï8à«øàìøà¤º) y¬`¸àeù©':*/8àfxà¢È‹œÙXËLMÈŽˆ¹d#8àf8àäxà®xàëøàï8àâxàiøà ¹ål8àj¸à¢øàãøààøà­øàéy`)8àjøàeøà y.¢ùbcz*"9ë¥ù¥.ù¤ øà¤ºfèøàeøàcøàfxà¢È‹œÙXËLNŽˆ¹aly§"xàfxà¢ùéæ9káºcmxàj8àãøààøà­øàéze¨¹¥l8àbøà¢z*£z*/9`)8à¤¹å'ù¢$8àfxà¢È‹œÙXËLNHŽˆ¹¡'ù§äùêëù§*øà¤¸àãxààøàâ8àëøàï8à«øàbøà¢zf¥:fè¸àfxà¢È‹›YÛ]LLHŽˆº*"9å.øà¢8à¢º`axà£8ài¸àa8à¢È‹›YÛ]LMHŽˆŒŽ‹›YÛ]LMˆŽˆŒŽ‹œÝ˜]LMˆŽˆŒŒ	HŸNÂ˜ÛÛœÝUQTÕSÓ—ÐÓÓ•VÑTS‘SÖWÔUT“”ÏVÉùbcyecÉË	ùbcxàk¹ecúhc	Ë	ù«(yecÉË	ùbczh!IË	ùd#8àf9fî¹k¦º,áùå(ÉË	ù."¸àk¹ecúhc	Ë	ù."º*&8àk¹ecúhc	×NÂ‚˜ÛÛœÝÓÔ‘WÐWÓS’ÑQÔRS—ÐÓÓ•PÕÏ^È˜ÛÜ™\WÌWÌWÌHŽˆŽš]‹˜ÛÜ™\WÌWÌWÌˆŽˆ¸à#ˆÈš]8à#{ï&¹ áyh,zaãøàk¹§ 9l#ùcf9/cxà º`&¹/èz`'ùn©¸àiøàkÓXš]Üøàj¸àjxà¤¸à¢8àcù/oøàaˆ‹˜ÛÜ™\WÌWÌWÌÈŽˆ¸à#ˆÈž]xà#{ï&Žš]8à ¸àåxà¨xà©8àêùk®zaãøàiøàkÓP¸àîÑÐ¸àj¸àjxà¤¸à¢8àcù/oøàaˆ‹˜ÛÜ™\WÌWÌ—ÌHŽˆŒMH‹˜ÛÜ™\WÌWÌ—ÌˆŽˆŒMº`,¹¥lxàkÌL:`,¹¥lL8à Q¸àkÌMxàiøà`¸à¢øà Œº`,¹¥lLLLxàkÌMº`,¹¥l¸àny¨`xàiùkï¹oç8àfxà¢øà ˆ‹˜ÛÜ™\WÌWÌ—ÌÈŽˆŒMº`,¹¥l8àkxà¤¸à¨¸àêøàåxà¨xàæxààøàâ8àj8àeøài¹¢lxà£øàf¹¥l9`)L8àj:  øàb8à¢øà ˆ‹˜ÛÜ™\WÌWÌ×ÌHŽˆŒL‹˜ÛÜ™\WÌWÌ×ÌˆŽˆŒº`,¹¥lLLL8àkÌMŠÍ
ÌLŒ¸àiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌWÌ×ÌÈŽˆºaãxàoøà¤¹mé¹êëøàbøà¢LK‹8 )¸àj9ïk¸àbøàj¸àa8àdøàj8à ¹cìùêëøàc—Œ8àiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌWÌÌHŽˆ‘Œ‹˜ÛÜ™\WÌWÌÌˆŽˆŒº`,ŒLLHLL8àkÌMº`,‘xàiøà`¸à¢øà ŒLLOQ8à LLLPxàjùkï¹oç8àfxà¢øà ˆ‹˜ÛÜ™\WÌWÌÌÈŽˆŒº`,¹¥m9¥l8à¤ŒMº`,¹¥l8àn9æí8àfxàj8àcxàkøà ycìùêëøàbøà¢Mš]8àf¸ài9c.¹b!øà¢øà ˆ‹˜ÛÜ™\WÌWÌWÌHŽˆŒLLLLLLLH‹˜ÛÜ™\WÌWÌWÌˆŽˆŽš]8àiÊÍOLLxà ¹cãz.èŒLLLLLL8àjÌxà¤¹b¨8àb8à KMOLLLLLLLxàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌWÌWÌÈŽˆ¹ë)¹cíøàh8àdxà¤¹cãz.è¸àeøàiº,¨9¥l8àjøàfxà¢øà#9ë)¹cíùím¹kï¹`):(j9ãï¸à#xàj9­íùd#8àeøàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌWÌ—ÌHŽˆŒL‹˜ÛÜ™\WÌWÌ—ÌˆŽˆŒº`,ŒLLJÌLOLL8àiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌWÌ—ÌÈŽˆŒL:`,¸àk¹¡'ú)¦¸àiÌJÌOL¸àj9¦î8àbøàf¸à Lº`,¸àiøàkÌL8àj9¦î8àcøà ˆ‹˜ÛÜ™\WÌWÌ×ÌHŽˆ¹¨`z$/xàhH‹˜ÛÜ™\WÌWÌ×ÌˆŽˆ¸à#9fî¹k¦¹l#ù¥l9à®xà#{ï&¹l#ù¥l9à®y/cyïk¸à¤¹fî¹k¦¸à ¹¢lxàb8à¢ùëá9fì¸àkùâëxàa8àc:*"9ë¥øàk¹¡#ùdløà¤¹ë¨yä!¸àeøà¡8àfxàa‹˜ÛÜ™\WÌWÌ×ÌÈŽˆ¸à#9­k¹båyl#ù¥l9à®xà#{ï&¹£!ù¥l8à¤¹/oøàhøài¹l#ù¥l9à®y/cyïk¸à¤¹båxàbøàeøà yn øàa9ëá9fì¸àk¹`)8à¤º(j8àfy¥®yo#È‹˜ÛÜ™\WÌ—ÌWÌHŽˆOLKLH‹˜ÛÜ™\WÌ—ÌWÌˆŽˆO^ÌKŸK^Ì‹ßxàj¸à¢Px¢*P^ÌŸxàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌ—ÌWÌÈŽˆ¸à#8ào¸àgøàkøà#xà¤¹£¤¹.å¹æ¡Ô¸àj9¬n¸à xài8àdxàj¸àa8àdøàj8à º`&¹n.8àk“Ô¸àkù.(y¥®yç'øà ¹d*øà 8à ˆ‹˜ÛÜ™\WÌ—Ì—ÌHŽˆŒ‹˜ÛÜ™\WÌ—Ì—ÌˆŽˆOLKL8àj¸à¢PS‘L8à SÔLxà VÔLxàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌ—Ì—ÌÈŽˆº)!úfäxàj¹fçº-ëøà¤¹. 9¬%øàjù¦¥ùë¥øàføàf¸à yd!8à¬¸àï8àâ9aî¹b¦øà¤¹¦î8àcøà ˆ‹˜ÛÜ™\WÌ—Ì×ÌHŽˆPŠÈ‹˜ÛÜ™\WÌ—Ì×ÌˆŽˆŠJÐŠpåÐøàk¹o£9ïkº*&9¬åxàkÐPŠÐðåøàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌ—Ì×ÌÈŽˆ¹¯%9ë¥ùkd8àk¹a*¹ab:h!¹/cxà¤¹á(z)¥¸àeøài¹¥¡ùkeùb%úh!¸àjùi"y£æøàeøàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌ—ÌÌHŽˆˆ‹˜ÛÜ™\WÌ—ÌÌˆŽˆ¹â­¹¡bÐxàiÌxàj¸à¢P¸à P¸àiÌxàj¸à¢Pxàj8àa8àaº)£ùbaøàj¸à¢yaiyb¦ÌLxàiÐxàn9¢.øà¢øà ˆ‹˜ÛÜ™\WÌ—ÌÌÈŽˆ¹aiyb¦øàh8àdxà¤º)¢øàf¸à yoáxàf¸à#9ãï¹g*9â­¹¡bøà#xà¤¹¦í9¥¬8àfxà¢øà ˆ‹˜ÛÜ™\WÌ—ÌWÌHŽˆ¹¥fyn*øà`¸à¢¹ki¹ïäˆ‹˜ÛÜ™\WÌ—ÌWÌˆŽˆ¸à#9¥fyn*øà`¸à¢¹ki¹ïä¸à#{ï&¹«hú)èøàêxàæxàêù.æ8àcxàáøàï8à¯øà ¹b!ºhg¸àîùfç¹n,8àj¸àjH‹˜ÛÜ™\WÌ—ÌWÌÈŽˆ¸à#9¥fyn*øàj¸àeùki¹ïä¸à#{ï&¹«hú)èøàêxàæxàêøàj¸àeøà ¸à«øàêxà®xà¯øàê¸àìøà¬8àj¸àjH‹˜ÛÜ™\WÌ—Ì—ÌHŽˆ¹ª&y®¥¹`cùmëˆ‹˜ÛÜ™\WÌ—Ì—ÌˆŽˆ¹ak9nløàjºgh¸à­xà©8à¬øàëxàk¹§'ùo¡y`)8àkÊJÌŠÌÊÍ
ÍJÍŠKÍLËxàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌ—Ì—ÌÈŽˆ¹æî:e¨¹/à¹¥l8àc:jæ8àa8àdøàj8àh8àdxà¤¹¨.y¢è8àjøà y. 9¥®xàc9.å¹¥®xàk¹c§ùfè8àh8àj9¥«yk¦¸àeøàj¸àa8à¢8àa¸àjøàfxà¢øà ˆ‹˜ÛÜ™\WÌ—Ì×ÌHŽˆ¹.£9b!¹¬åH‹˜ÛÜ™\WÌ—Ì×ÌˆŽˆ¹.£9b!¹¬åxàkøà yë)¹cíøàc9ål8àj¸à¢ùc.ºe¤øà¤¹.£9b!¸àeøà y¨.xà¤¹d*øà 9`m8à¤¹«¢øàeøài¹cãyoªxàfxà¢øà ˆ‹˜ÛÜ™\WÌ—Ì×ÌÈŽˆ¹£¨¹í(¸à¨¸àêøà­8àê¸à®¸àè8àk¹.£9b!¹£¨¹í(¸àj8à y¥l9`):)èù§¤8àk¹.£9b!¹¬åxàkøà#9cb¹b!¸àjùíg¸à¢øà#yà®xàkù//8ài¸àa8à¢øàc9kïº,hxàc9ål8àj¸à¢øà ˆ‹˜ÛÜ™\WÌ—ÌÌHŽˆ¸àãøàåxàç¸àìùë)¹cíÈ‹˜ÛÜ™\WÌ—ÌÌˆŽˆ¹è®¹ã¡ÌKÎ8àiú-møàdøà¢ù.¢ú,hxàkº!ê¹mìy áyh,zaãøàkË[ÙÌŠKÎ
OLØš]8àiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌ—ÌÌÈŽˆ¸à#8àáøàï8à¯úaãøà¤¹l#øàexàcøàfxà¢ùg)ùî+¸à#xàj8à#9a¡yk®xà¤º*«xà xàj¸àcøàfxà¢ù¦¥ùcíùc%¸à#xà¤¹­íùd#8àeøàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌ—ÌWÌHŽˆ¸àåxà¨øàï8àâxàä8ààøà«ùb-¹o¨H‹˜ÛÜ™\WÌ—ÌWÌˆŽˆ¸à#8àåxà¨øàï8àâxàä8ààøà«ùb-¹o¨xà#{ï&¹k§úf¦øàk¹aî¹b¦øà¤¹®+8à¢¸à yæë¹ª&xàj8àk¹më¸à¤¹«(xàk¹¤ãy/g8àn9cãy¦(‹˜ÛÜ™\WÌ—ÌWÌÈŽˆ¸à#8àåxà¨øàï8àâxàåxàªxàëøàï8àâyb-¹o¨xà#{ï&¹i%¹.lxàj¸àjxà¤¹.¢9®+8àeøà yíd9§§8àc9aî¸à¢ùbcxàjùab9fç¸à¢¸àeøàiº(ç9«hÈ‹˜ÛÜ™\WÌ×ÌWÌHŽˆ¸à«xàéxàï‹˜ÛÜ™\WÌ×ÌWÌˆŽˆ¸à#:acyb%øà#{ï&¹­îùkeøàiùæí9£©ycà¹áiøàeøà¡8àfxàa8à º`%9.+y£/ùaixàîùbbºfi8àiøàkùéîùbåxàc9oáz) H‹˜ÛÜ™\WÌ×ÌWÌÈŽˆ¸à#:`(ùíd8àê¸à®xàâ8à#{ï&º) yí(8à¤¸àê¸àìøà«øàiøài8àj¸àd8à º`%9.+xàkº/ïyb¨8àîùbbºfi8àjùd$xàcÈ‹˜ÛÜ™\WÌ×Ì—ÌHŽˆº`n9¢§ˆ‹˜ÛÜ™\WÌ×Ì—ÌˆŽˆŒxàbøà¢Mxào¸àiùb¨9ë¥øàfxà¢øàj¸à¢\Ý[OL8àbøà¢Myfç¹b¨9ë¥øàeÌMxàjøàj¸à¢øà ˆ‹˜ÛÜ™\WÌ×Ì—ÌÈŽˆ¹cãyoªyfç¹¥l8à¤¸à#9`)8àk¹`"ù¥l8à#xàj9cå¸à¢º`exàb8àj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌ×Ì×ÌHŽˆ¸àáøàï8à¯øàc9¥m9b%ù®"8àoÈ‹˜ÛÜ™\WÌ×Ì×ÌˆŽˆº) yí(9¥lL8àj¸à¢y.£9b!¹£¨¹í(¸àkù§ 9i)øàb¸à¢8àgLL9fç¸àk¹«å:/ øàiùëá9fì¸à¤¹íg¸à£8à¢øà ˆ‹˜ÛÜ™\WÌ×Ì×ÌÈŽˆ¹.£9b!¹£¨¹í(¸à¤¹§*¹¥m9b%øàáøàï8à¯øàn8àgxàk¸ào¸ào¹/oøà£øàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌ×ÌÌHŽˆ¸à¬øàìøàäxà©8àêH‹˜ÛÜ™\WÌ×ÌÌˆŽˆ¸à#8à¬øàìøàäxà©8àêy¥®yo#øà#{ï&¹k§ú(c9bcxàjøàåøàëxà¬8àêxàè9aj9/døà¤¹ïîú*,øà ¹ïîú*,ùo£8àkújæ:`'ùk§ú(c8àeøà¡8àfxàa‹˜ÛÜ™\WÌ×ÌÌÈŽˆ¸à#8à©8àìøà¯øàåøàê¸à¯ù¥®yo#øà#{ï&¹k§ú(c8àeøàj¸àc8à¢z`$9«(z)èúaâ8à ¹/ë¹«høàîùè®º*£xà¤¹îl8à¢º/å8àeøà¡8àfxàa‹˜ÛÜ™\WÌ×ÌWÌHŽˆ”ÔS‹˜ÛÜ™\WÌ×ÌWÌˆŽˆ•ÙXˆTxàiøàkÒ”ÓÓ¹oh¹o#øàiøàáøàï8à¯øà¤º` ycåù/èxàfxà¢ù/¢øàc9i&¸àcøà`¸à¢øà ˆ‹˜ÛÜ™\WÌ×ÌWÌÈŽˆ’S8à¤¸àáøàï8à¯øàæxàï8à®y¤ãy/g:* :*§¸àj9­íùd#8àeøàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌÌWÌHŽˆ¸àë8à®8à®xà¯È‹˜ÛÜ™\WÌÌWÌˆŽˆŒÑÒ¸àkÌyéä¸àjÌÌ9a!8à«øàëxààøà«øàh8àc8à Lxà«øàëxààøà«ÏLydoy.é8àj8àkúfd8à¢xàj¸àa8à ˆ‹˜ÛÜ™\WÌÌWÌÈŽˆ¸à«øàëxààøà«ùdj9¬è¹¥l8àh8àdxàiùål8àj¸à¢ÐÔy )ú ïxà¤¹¥«yk¦¸àeøàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌÌ—ÌHŽˆ‘XÛÙH‹˜ÛÜ™\WÌÌ—ÌˆŽˆ‘™]Ú8¡¤‘XÛÙx¡¤‘^XÝ]xàc9gî¹§+9æ¡8àj¹doy.é8à­xà©8à«øàêøàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌÌ—ÌÈŽˆ¸àáøàï8à¯øàk¹cå¹o¥øàj9doy.é8àk¹cå¹o¥øà¤¹­íùd#8àeøàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌÌ×ÌHŽˆ¸àë8à®8à®xà¯È‹˜ÛÜ™\WÌÌ×ÌˆŽˆ¸à#8àë8à®8à®xà¯øà#{ï&Ôya¡z`ê8à ¹§ :`'øàîù§ 9l#ùk®zaãÈ‹˜ÛÜ™\WÌÌ×ÌÈŽˆ¸à#8à«xàèøààøà­øàéxà#{ï&Ôxàj9..ú*&9¡­¸àkº`'ùn©¹më¸à¤¹íêyd£‹˜ÛÜ™\WÌÌÌHŽˆ’RH‹˜ÛÜ™\WÌÌÌˆŽˆ¸à«xàï8àç8àï8àâxà¡9i%¹.æ8àdTÔÑ8à¤•TÐ¸àiù£©yí¦¸àfxà¢ù/¢øàc8à`¸à¢øà ˆ‹˜ÛÜ™\WÌÌÌÈŽˆº)£ù¨/9d#xàj9å*:`%8à¤¹..9¦¥ú*&8àføàf¸à#9/exà¤¸ài8àj¸àd8àbøà#xàiù¥m9ä!¸àfxà¢øà ˆ‹˜ÛÜ™\WÌÌWÌHŽˆ“ÐÔˆ‹˜ÛÜ™\WÌÌWÌˆŽˆ“ÐÔ¸àkùcl9b-ù¥¡ùkeøà¤º*«xàoùcå¸à¢¹¥¡ùkeøàáøàï8à¯øàn9i"y£æøàfxà¢øà ˆ‹˜ÛÜ™\WÌÌWÌÈŽˆ“ÐÔ¸àjÓT¸à¤¹­íùd#8àeøàj¸àa8àdøàj8à “ÓT¸àkøàç¸àï8à«øà¤º*«xàoùcå¸à¢øà ˆ‹˜ÛÜ™\WÌÌ—ÌHŽˆ¸à¨¸àâxàë8à®xàä8à®H‹˜ÛÜ™\WÌÌ—ÌˆŽˆŒÌ˜š]9naxàk¸àáøàï8à¯øàä8à®xàj¸à¢xà y. 9n©¸àkº.èº` xàiÌÌ˜š]8àk¸àáøàï8à¯øà¤¹¢lxàb8à¢ù©âù¢$8àc8à`¸à¢øà ˆ‹˜ÛÜ™\WÌÌ—ÌÈŽˆ¸à¨¸àâxàë8à®xàä8à®xàk¹naxàj8àáøàï8à¯øàä8à®xàk¹naxàkùonybl¸àc9ål8àj¸à¢øàgøà xà yd#8àf9¡#ùdløàk˜š]9¥l8àiøàkøàj¸àa8à ˆ‹˜ÛÜ™\WÌWÌWÌHŽˆ¸àä8ààøààyaé¹ä!ˆ‹˜ÛÜ™\WÌWÌWÌˆŽˆ¸à#8àä8ààøààyaé¹ä!¸à#{ï&¹. 9k¦ºaãøàk¸àáøàï8à¯øà¤¸ào¸àj8à xài¹aé¹ä!¸à ¹íi¹.#º*"9ë¥øàj¸àjH‹˜ÛÜ™\WÌWÌWÌÈŽˆ¸à#8àê¸à¨¸àêøà¯øà©8àè9aé¹ä!¸à#{ï&¹aiyb¦ùo£8àfxàd8àjùíd9§§8àc9oáz) xà ¹.¢9í!8àîù¬n¹®"8àj¸àjH‹˜ÛÜ™\WÌWÌ—ÌHŽˆŒùli8à«øàêxà©8à¨¸àìøàâ8à­xàï8àä‹˜ÛÜ™\WÌWÌ—ÌˆŽˆ¸à#:fá¹.+yaé¹ä!¸à#{ï&¹aé¹ä!¸à¤¹..øàjÌxàbù¢`8àn:fá¸à xà¢È‹˜ÛÜ™\WÌWÌ—ÌÈŽˆ¸à#9b!¹¥hùaé¹ä!¸à#{ï&º)!ù¥l8àk¸à¬øàìøàå8àéxàï8à¯øàn9aé¹ä!¸à¤¹b!¸àdxà¢È‹˜ÛÜ™\WÌWÌ×ÌHŽˆ¸à®xàêøàï8àåøààøàâ‹˜ÛÜ™\WÌWÌ×ÌˆŽˆŒyéä¸àjÌL9.í¹aé¹ä!¸àiøàcxà¢øàj¸à¢xà®xàêøàï8àåøààøàâ8àkÌL9.í‹ùéä¸àiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌWÌ×ÌÈŽˆ¹¦`ºe¤ù£!ùª&xàj9aé¹ä!ºaãù£!ùª&xà¤¹­íùd#8àeøàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌWÌÌHŽˆ“U‘‹ÊU‘ŠÓUŠH‹˜ÛÜ™\WÌWÌÌˆŽˆ“U‘NL9¦`ºe¤øà SULL9¦`ºe¤øàj¸à¢yê/9`ãyã¡ÌŽxàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌWÌÌÈŽˆ“U‘¸àjU¸àk¹cf9/cxàîù¡#ùdløà¤º`!¸àjøàeøàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌ—ÌWÌHŽˆ“ÔÈ‹˜ÛÜ™\WÌ—ÌWÌˆŽˆ¸àêxà©¸àìøàâxàëxàäøàìøàiøàkùd!8àåøàëxà®øà®xàn9. 9k¦¹¦`ºe¤øàf¸àiÔxà¤¹bl¸à¢¹odøài¸à¢øà ˆ‹˜ÛÜ™\WÌ—ÌWÌÈŽˆ“Ôøà¤¸à¨¸àåøàê¸à¬xàï8à­øàéøàìøà¯xàåxàâ8àj9­íùd#8àeøàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌ—Ì—ÌHŽˆ¹ím¹kï¸àäxà®H‹˜ÛÜ™\WÌ—Ì—ÌˆŽˆ‹ÚÛYKÝ\Ù\‹ØK8àkøàêøàï8àâ8àbøà¢xàk¹ím¹kï¸àäxà®xàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌ—Ì—ÌÈŽˆ¹ãï¹g*8àáøà¨øàë8à«øàâ8àê¸àc9ecúhc8àiùé.¸àexà£8à¢ùh-9d"8àkùæî9kï¸àäxà®xàjù¬ê9¡#øàfxà¢øà ˆ‹˜ÛÜ™\WÌ—Ì×ÌHŽˆ¹më¹b!ˆ‹˜ÛÜ™\WÌ—Ì×ÌˆŽˆ¸à#8àåxàêøà#{ï&¹«ã¹fç¸àfxànxài¸à ¹oªy¥éøàkùcf9í%8àh8àc9¦`ºe¤øàîùk®zaãøàc9i)øàcxàa‹˜ÛÜ™\WÌ—Ì×ÌÈŽˆ¸à#9më¹b!¸à#{ï&¹§ 9o£8àk¸àåxàêù.ézfcxàk¹i"y¦í8à ¹oªy¥éøàkøàåxàêÊù§ 9¥¬9më¹b!ˆ‹˜ÛÜ™\WÌ—ÌÌHŽˆ¸àáøàä8ààøà«‹˜ÛÜ™\WÌ—ÌÌˆŽˆ¸àå¸àë8àï8à«øàçxà©8àìøàâ8àiù`g9«h¸àeøài¹i"y¥l9`)8à¤¹è®º*£xàfxà¢øàk¸àkøàáøàä8ààøà«8àk¹an9g¢ùªgú ïxàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌ—ÌÌÈŽˆ¸àá¸à®xàâ8àá8àï8àêøàj9§+9åj¹æèú)¥¸àá8àï8àêøà¤¹­íùd#8àeøàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌ—ÌWÌHŽˆ¸àêxà©8à®øàìøà®y§hy.í¸àjùo¤øàhøài¹b*yå*8àîùa£zacyn øàfxà¢È‹˜ÛÜ™\WÌ—ÌWÌˆŽˆ“[^8à¡9i&¸àcøàk•ÙX¸à­xàï8àä8àîÑ“TøàjÓÔÔøàc8à`¸à¢øà ˆ‹˜ÛÜ™\WÌ—ÌWÌÈŽˆ“ÔÔÏxàäxàå¸àê¸ààøà«øàâxàèxà©8àìøà SÔÔÏyá(y§hy.í¸àjú!ê¹å,xà xàiøàkøàj¸àa8à ˆ‹˜ÛÜ™\WÌ—Ì—ÌHŽˆ¸àçøàâxàêøà©¸à©øà¨ˆ‹˜ÛÜ™\WÌ—Ì—ÌˆŽˆ¸à#Ôøà#{ï&Ôxàîøàèxàè¸àê¸àîøàåxà¨xà©8àêøàîùaiyaî¹b¦øàj¸àjxàãøàï8àâxà©¸à©øà¨º,áù®¤8àk¹gî¹æé9ë¨yä!ˆ‹˜ÛÜ™\WÌ—Ì—ÌÈŽˆ¸à#8àçøàâxàêøà©¸à©øà¨¸à#{ï&‘¸àîÕÙX¸àîú`&¹/èxàj¸àjz)!ù¥l8à¨¸àåøàê¸àc9/oøàa¹alz`&¹ªgú ïH‹˜ÛÜ™\WÌ×ÌWÌHŽˆ”ÔSH‹˜ÛÜ™\WÌ×ÌWÌˆŽˆ¸à#Sxà#{ï&ºjæ9ká¹n©¸àîù«å:/ ùæ¡9k¢y/¨xà ¹..ú*&9¡­¸àjù/oùå*8à ¸àê¸àåxàë8ààøà­øàéxàc9oáz) H‹˜ÛÜ™\WÌ×ÌWÌÈŽˆ¸à#ÔSxà#{ï&ºjæ:`'øàîújæ9/¨xà ¸à«xàèøààøà­øàéxàjù/oùå*8à ¸àê¸àåxàë8ààøà­øàéy.#z) H‹˜ÛÜ™\WÌ×Ì—ÌHŽˆŒMˆ‹˜ÛÜ™\WÌ×Ì—ÌˆŽˆŽš]:aãùkd9c%¸àj¸à¢LM¹«­zf£¸à¤º(j9ãï¸àiøàcxà¢øà ˆ‹˜ÛÜ™\WÌ×Ì—ÌÈŽˆ¸à­xàìøàåøàê¸àìøà¬9dj9¬è¹¥l8àj:aãùkd9c%˜š]9¥l8à¤¹­íùd#8àeøàj¸àa‹˜ÛÜ™\WÌÌWÌHŽˆÓH‹˜ÛÜ™\WÌÌWÌˆŽˆ¸à#ÕRxà#{ï&¸à¨¸à©8à¬øàìøàîøàç8à¯øàìøàj¸àjz)¥º)¦¹æ¡8àjù¤ãy/g8à ¹æí9¡'ùæ¡8àjù/oøàa8à¡8àfxàa‹˜ÛÜ™\WÌÌWÌÈŽˆ¸à#Óxà#{ï&¸à¬øàç¸àìøàâxà¤¹¥¡ùkeùaiyb¦øà ¹k¦¹g¢ùaé¹ä!¸àkº!ê¹båyc%¸à¡9í,8àbøàj¹¤ãy/g8àjùd$xàcÈ‹˜ÛÜ™\WÌÌ—ÌHŽˆº"l¹.éyi%¸àk¹¢bù£¦øàbøà¢¸à ¹/oøàaˆ‹˜ÛÜ™\WÌÌ—ÌˆŽˆ¸à#8àé¸àï8à­¸àäøàê¸àá¸à¨øà#{ï&¹ânyk¦¸àk¹b*yå*: !xàc9æë¹æ¡8à¤¹b®yã¡øà¢8àcøà y® :-¬øàeøàiº`e9¢$8àiøàcxà¢øàbÈ‹˜ÛÜ™\WÌÌ—ÌÈŽˆ¸à#8à¨¸à«øà®øà­øàäøàê¸àá¸à¨øà#{ï&ºf§9k¬øàîùnm:oh¸àîùb*yå*9ä¬9h øàj¸àjxàjøàbøàbøà£øà¢xàf¹b*yå*8àiøàcxà¢øàbÈ‹˜ÛÜ™\WÌÌ×ÌHŽˆ¹cëú`!¹g)ùî+ˆ‹˜ÛÜ™\WÌÌ×ÌˆŽˆŒZÒ¸àîÌM˜š]8àîÌ˜Ú8àkºgìùhì8àkÌyéä¸àiùí!KSXš]8àkºgg¹g)ùî+¸àáøàï8à¯øàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌÌ×ÌÈŽˆ¹g)ùî+¹o£8à­xà©8à®¸à¤ºgg¹g)ùî+¹ak9o#øàh8àdxàiù¥«yk¦¸àeøàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌÌÌHŽˆTˆ‹˜ÛÜ™\WÌÌÌˆŽˆ¸à#T¸à#{ï&¹ãï¹k§øàk¹¦(9`ãøàîùênºe¤øàn8àáøà®8à¯øàêù áyh,xà¤ºaãxàkxà¢È‹˜ÛÜ™\WÌÌÌÈŽˆ¸à#”¸à#{ï&¸à¬øàìøàå8àéxàï8à¯øàc9/g8à¢ù.ë¹ ìùênºe¤øàn8àk¹¬¨yaixà¤ºaãz)¥ˆ‹˜ÛÜ™\WÌWÌWÌHŽˆ‘“TÈ‹˜ÛÜ™\WÌWÌWÌˆŽˆºhiùk¨¹ áyh,xà¤º`ê9ïl¸àe8àj8àjùb)xàåxà¨xà©8àêøàiù£ xài8à¢8à¢¸à y. 9a`Ñ¸àiù¥m9d"9 )øà¤¹/çxàhxà¡8àfxàcøàj¸à¢øà ˆ‹˜ÛÜ™\WÌWÌWÌÈŽˆ¸àáøàï8à¯øàæxàï8à®Oz(j:*"9ë¥øàåxà¨xà©8àêÌy`"øà xàiøàkøàj¸àa8à ˆ‹˜ÛÜ™\WÌWÌ—ÌHŽˆº`n9¢§ˆ‹˜ÛÜ™\WÌWÌ—ÌˆŽˆ¸à#9`&z(ç8à«xàï8à#{ï&º(c8à¤¹. 9¡#øàjú+f9b)xàiøàcxà¢ù§ 9l#øàk¹lg¹ )úfá¹d"‹˜ÛÜ™\WÌWÌ—ÌÈŽˆ¸à#9..øà«xàï8à#{ï&¹`&z(ç8à«xàï8àbøà¢z`n8à¤øàh9.èú(j8à«xàï‹˜ÛÜ™\WÌWÌ×ÌHŽˆ¹ë+y«hú)£ùohˆ‹˜ÛÜ™\WÌWÌ×ÌˆŽˆ¹cåù¬ê9¦#¹í,8àiùea¹dàyd#xà¤¹«ãº(c:aãz)!ù/çykf8àfxà¢øà¢8à¢¹ea¹dàz(j8àn9b!ºfè¸àfxà¢øà ˆ‹˜ÛÜ™\WÌWÌ×ÌÈŽˆ¸à#:(j8à¤¹b!¸àdxà£8àl9oáxàf¹«hú)£ùc%¸à#xàj8àkúfd8à¢xàj¸àa8à ¹o¤ùlg¹ )øà¤º)¢øà¢øà ˆ‹˜ÛÜ™\WÌWÌÌHŽˆ¹©'9í(ºjæ:`'ùc%ˆ‹˜ÛÜ™\WÌWÌÌˆŽˆ¹í(¹o%xà¤º`jyb!øàj¹b%øàjù/g8à¢øàj9©'9í(¸à¤ºjæ:`'ùc%¸àiøàcxà¢øà ˆ‹˜ÛÜ™\WÌWÌÌÈŽˆ¸à©8àìøàáøààøà«øà®xà¤¹h¥øà¡8àføàl9n.8àjùaj9aé¹ä!¸àc:jæ:`'øàjøàj¸à¢øà£øàdxàiøàkøàj¸àa8à ˆ‹˜ÛÜ™\WÌWÌWÌHŽˆÓÓSRU‹˜ÛÜ™\WÌWÌWÌˆŽˆ¸à#9c§ùkd9 )øà#{ï&¹aj:`ê9¢$9b§øàbùaj:`ê9i,y¥eøà º`%9.+xàh8àdyè®¹k¦¸àexàføàj¸àa‹˜ÛÜ™\WÌWÌWÌÈŽˆ¸à#9. :,ªù )øà#{ï&¹aé¹ä!¹bcyo£8àiÑ¸àk¹¥m9d"9 )ùb-¹í!8à¤¹k¢8à¢È‹˜ÛÜ™\WÌWÌ—ÌHŽˆ¸àáøààøàâxàëxààøà«È‹˜ÛÜ™\WÌWÌ—ÌˆŽˆ¸à#9aly§"xàëxààøà«øà#{ï&¹..øàjú*«ycå¸à¢¸à º)!ù¥l9aé¹ä!¸àc9d#9¦`¹cå¹o¥øàiøàcxà¢ùh-9d"8àc8à`¸à¢È‹˜ÛÜ™\WÌWÌ—ÌÈŽˆ¸à#9£¤¹.å¸àëxààøà«øà#{ï&¹¦í9¥¬8à ¹êí¹d"8àfxà¢ùaé¹ä!¸à¤¹o¡xàgøàføà¢È‹˜ÛÜ™\WÌWÌ×ÌHŽˆ’U’S‘È‹˜ÛÜ™\WÌWÌ×ÌˆŽˆº`ê9ïl¹b)xàk¹nlùgaùíi¹.#¸à¤¹¬`¸à xà¢øàj¸à¢xà z`ê9ïl¸àiÑÔ“ÕT–xàeÐU‘øà¤¹/oøàa¹oh¸àc9gî¹§+8àiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌWÌ×ÌÈŽˆ”ÑSPÕ8àkùb%øà UÒT‘xàkú(c8à QÔ“ÕT–xàkúfá¹í!9cf9/cxàj8àa8àa¹onybl¸à¤¹­íùd#8àeøàj¸àa8à¢8àa¸àjøàfxà¢øà ˆ‹˜ÛÜ™\WÌWÌÌHŽˆ¸àáøàï8à¯øà©¸à©øà¨¸àãøà©¸à®H‹˜ÛÜ™\WÌWÌÌˆŽˆ¸à#Ó8à#{ï&¹¬ê9¥¡øàîùaiyaîºaäxàj¸àjy¥éxà!xàk¹çëxàa9¦í9¥¬8à¤¹i)úaãøàjùaé¹ä!ˆ‹˜ÛÜ™\WÌWÌÌÈŽˆ¸à#ÓT8à#{ï&º$á9êcxàáøàï8à¯øà¤¹i&º)ä¹æ¡8àjúfáº*"8àîùb!¹§¤‹˜ÛÜ™\WÌLÌWÌHŽˆ˜œÈ‹˜ÛÜ™\WÌLÌWÌˆŽˆŒLXœùfç¹íæ¸àiøà ¹k§úf¦øàk¸àåxà¨xà©8àêú.èº` xàc9n.8àjÌLXœøàjøàj¸à¢øàj8àkúfd8à¢xàj¸àa8à ˆ‹˜ÛÜ™\WÌLÌWÌÈŽˆ˜œøà¤˜ž]KÜøàj9cå¸à¢º`exàb8àj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌLÌ—ÌHŽˆ¸àêøàï8à¯È‹˜ÛÜ™\WÌLÌ—ÌˆŽˆ¸à#¸à®xà©8ààøààxà#{ï&¹..øàjÓPPøà¨¸àâxàë8à®xà¤º)¢øài¹d#9. S¹a¡xàk¸àåxàë8àï8àè8à¤º.èº` H‹˜ÛÜ™\WÌLÌ—ÌÈŽˆ¸à#8àêøàï8à¯øà#{ï&’T8à¨¸àâxàë8à®xà¤º)¢øài¹ål8àj¸à¢øàãxààøàâ8àëøàï8à«úe¤øà¤¹.+yí¦H‹˜ÛÜ™\WÌLÌ×ÌHŽˆŒÌ˜š]‹˜ÛÜ™\WÌLÌ×ÌˆŽˆŒNL‹ŒMŽŒKŒL8àkÒT8àkº(j:*&9/¢øàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌLÌ×ÌÈŽˆ’T8à¨¸àâxàë8à®xàjPPøà¨¸àâxàë8à®xàk¹onybl¸à¤¹­íùd#8àeøàj¸àa8à ˆ‹˜ÛÜ™\WÌLÌÌHŽˆŽ‹˜ÛÜ™\WÌLÌÌˆŽˆŒNL‹ŒMŽŒKŒLÌÌ¸àk¸àãxààøàâ8àëøàï8à«øàkÌNL‹ŒMŽŒKŒLŽ8àiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌLÌÌÈŽˆŒM‹xàç¸à®xà«ù`)8àiøàå¸àëxààøà«øà­xà©8à®¸à¤¹¬`¸à xà¢øàj8àcyh ùåc8à¤¹è®º*£xàfxà¢øà ˆ‹˜ÛÜ™\WÌLÌWÌHŽˆŒNL‹ŒMŽŒŒÌMˆ‹˜ÛÜ™\WÌLÌWÌˆŽˆ¸à#8à¬8àëxàï8àä8àêÒT8à#{ï&¸à©8àìøà¯øàï8àãxààøàâ9."¸àiù. 9¡#øàjùb*yå*8àfxà¢øà¨¸àâxàë8à®H‹˜ÛÜ™\WÌLÌWÌÈŽˆ¸à#8àåøàêxà©8àæxàï8àâT8à#{ï&¹k­¹n«xàîùé/¹a¡xàj¸àjya¡z`ê8àãxààøàâ8àëøàï8à«øàiùa£yb*yå*8àiøàcxà¢øà¨¸àâxàë8à®H‹˜ÛÜ™\WÌLÌ—ÌHŽˆ‘”È‹˜ÛÜ™\WÌLÌ—ÌˆŽˆÝÝË™^[\K˜ÛÛxàk¹d#ybcz)èù¬n¸àiÑ”øàbøà¢RT8à¨¸àâxàë8à®xà¤¹o¥øà¢øà ˆ‹˜ÛÜ™\WÌLÌ—ÌÈŽˆ‘”øàkÕÙX¸àæ¸àï8à®9§+9/døà¤ºacy/èxàfxà¢ù.åyía8àoøàiøàkøàj¸àa8à ˆ‹˜ÛÜ™\WÌLÌ×ÌHŽˆ’PÓT‹˜ÛÜ™\WÌLÌ×ÌˆŽˆ¸à#Ô8à#{ï&¹b,:`e9è®º*£xàîúh!¹n£ùb-¹o¨xàîùa£z` xà`¸à¢¸à ¹/èzh/9 )úaãz)¥ˆ‹˜ÛÜ™\WÌLÌ×ÌÈŽˆ¸à#Q8à#{ï&¹a£z` xàj¸àjxà¤¹ì(yåiyc%¸à ¹/cº`ayní¸àîøàê¸à¨¸àêøà¯øà©8àè9 )úaãz)¥ˆ‹˜ÛÜ™\WÌLÌÌHŽˆ•”ˆ‹˜ÛÜ™\WÌLÌÌˆŽˆ¸à#ÙX¸à#{ï&’ÈÈ‹˜ÛÜ™\WÌLÌÌÈŽˆ¸à#8àèxàï8àêú` y/èxà#{ï&”ÓU‹˜ÛÜ™\WÌLÌWÌHŽˆÔÈ‹˜ÛÜ™\WÌLÌWÌˆŽˆ¸à#Ôøà#{ï&º*©8à¢¸à¤¹©'9aîˆ‹˜ÛÜ™\WÌLÌWÌÈŽˆ¸à#T”xà#{ï&º*©8à¢¸à¤¹©'9aî¸àeøàgøà¢ya£z` xà¤º) y¬`ˆ‹˜ÛÜ™\WÌLÌLÌHŽˆ”Ó“T‹˜ÛÜ™\WÌLÌLÌˆŽˆ¸àêøàï8à¯øà¡8à®xà©8ààøààxàkÔy/oùå*9ã¡øàîøà©8àìøà¯øàåxà©øàï8à®yâ­¹¡bøà¤¹æèú)¥¸à­xàï8àä8àbøà¢TÓ“T8àiùcãºfá¸àfxà¢ù/¢øàc8à`¸à¢øà ˆ‹˜ÛÜ™\WÌLÌLÌÈŽˆ¸àãxààøàâ8àëøàï8à«ùë¨yä!¸àkøà y©âù¢$8àîúf§9k¬øàîù )ú ïxàîøà®øà«xàéxàê¸àá¸à¨øà¤¹í¦yí¦¹æ¡8àjùæèú)¥¸àîùë¨yä!¸àfxà¢øà ˆ‹˜ÛÜ™\WÌLWÌWÌHŽˆ¸àêxàìøà­xàè8à©¸à©øà¨ˆ‹˜ÛÜ™\WÌLWÌWÌˆŽˆ¹`oxà­xà©8àâ8àn:*¦9l#¸àeú*£z*/9 áyh,xà¤¹aiyb¦øàexàføà¢øàk¸àkøàåxà¨øààøà­øàìøà¬8àk¹/¢øàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌLWÌWÌÈŽˆ¹å*:*§¸à¤¹¦¥ú*&8àfxà¢øàh8àdxàiøàj¸àcù/­yaiyíc:-ëøàj:(ªùk¬øà¤¹íd8àlù.æ8àdxà¢øà ˆ‹˜ÛÜ™\WÌLWÌ—ÌHŽˆ¸àãøààøà­øàéH‹˜ÛÜ™\WÌLWÌ—ÌˆŽˆ¸à#9alz`&ºcmy¦¥ùcíøà#{ï&¹d#8àf9éæ9káºcmxàiù¦¥ùcíùc%¸àîùoªycíøà ºjæ:`'øàh8àc:cmzacz` xàc:*¬ºhc‹˜ÛÜ™\WÌLWÌ—ÌÈŽˆ¸à#9ak:e¢úcmy¦¥ùcíøà#{ï&¹ak:e¢úcmxàj9éæ9káºcmxà¤¹/oùå*8à ºcmyaly§"xàîú*£z*/8àjùd$xàcøàc9aé¹ä!¸àkúaãxàa‹˜ÛÜ™\WÌLWÌ×ÌHŽˆ¹ïl¹d#z !xàk¹ak:e¢úcmH‹˜ÛÜ™\WÌLWÌ×ÌˆŽˆ•ÙX¸à­xà©8àâ8àk•ú*/9¦#¹¦î8à¤Ðxàk¹/èzh/:`(úc¥¸àiù©':*/8àfxà¢øà ˆ‹˜ÛÜ™\WÌLWÌ×ÌÈŽˆ¸àáøà®8à¯øàêùïl¹d#xàkù§+9¥¡øà¤¹éæ9ká¸àjøàfxà¢øàdøàj:!ê¹/døàc9..ùæë¹æ¡8àiøàkøàj¸àa8à ˆ‹˜ÛÜ™\WÌLWÌÌHŽˆ¸àê¸à®xà«ùéîú.èˆ‹˜ÛÜ™\WÌLWÌÌˆŽˆ¸à#9fçº`oøà#{ï&¸àê¸à®xà«øàk¹c§ùfè8àj8àj¸à¢ù­.ùbåz!ê¹/døà¤¸à¡8à xà¢È‹˜ÛÜ™\WÌLWÌÌÈŽˆ¸à#9/c¹®&øà#{ï&¹æn¹å'ùè®¹ã¡øà¡9olzgïøà¤¹l#øàexàcøàfxà¢È‹˜ÛÜ™\WÌLWÌWÌHŽˆ’TÓTÈ‹˜ÛÜ™\WÌLWÌWÌˆŽˆ¹aiyé/¸àîùål9båxàîú` : mù¦`¸àk¹ª*zfd:)¢ùæí8àeøà ¹ë¨yä!¹ëe¸àk¹. :`ê8àiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌLWÌWÌÈŽˆ¸à©¸à©8àêøà®ykï¹ëe¸à¯xàåxàâ8à¤¹aixà£8à£8àl9ë¨yä!¸àc9k£9¢$8à xàiøàkøàj¸àa8à ˆ‹˜ÛÜ™\WÌLWÌ—ÌHŽˆ•ÐQˆ‹˜ÛÜ™\WÌLWÌ—ÌˆŽˆ•ÐQ¸àkÕÙX¸à¨¸àåøàê¸àn8àk¹.#y«høàj’8àê¸à«øàª8à®xàâ8à¤¹©'9§îøàfxà¢ùkï¹ëe¸àiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌLWÌ—ÌÈŽˆ‘•øàîÕÐQ¸àîÒQøàîÒTøàk¹onybl¸à¤¹­íùd#8àeøàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌLWÌ×ÌHŽˆÕ”ÔÈ‹˜ÛÜ™\WÌLWÌ×ÌˆŽˆ¹d#8àf:!!¹o,y )øàiøà ¸à yi%º`ê9ak:e¢øà­xàï8àä8àj:f¥:fè¸àexà£8àgù©':*/9êëù§*øàiøàkù.¢ù©ky."¸àk¹a*¹ab9n©¸àc9ål8àj¸à¢ùh-9d"8àc8à`¸à¢øà ˆ‹˜ÛÜ™\WÌLWÌ×ÌÈŽˆ¹¢ :(dùæ¡8àj¹­ìyb.ùn©¸àj8à yía9îe9fî¹§"xàkº,áùå(ù/¨y`)8àîùb*yå*9â­¹¬àxà¤¹d#9. :)¥¸àeøàj¸àa8à¢8àa¸àjøàfxà¢øà ˆ‹˜ÛÜ™\WÌLWÌÌHŽˆ•ÐQˆ‹˜ÛÜ™\WÌLWÌÌˆŽˆ¸à#8àåxà¨xà©8à¨¸à©¸àªxàï8àêøà#{ï&’T8àîøàçxàï8àâ8àj¸àjxàiú`&¹/èxà¤¹b-¹o¨H‹˜ÛÜ™\WÌLWÌÌÈŽˆ¸à#ÐQ¸à#{ï&’9a¡yk®xà¤º)¢øài•ÙX¸à¨¸àåøàê¸àn8àk¹¥.ù¤ øà¤¹©'9§îøàîúf,¹o¨xàfxà¢È‹˜ÛÜ™\WÌL—ÌWÌHŽˆº*+z*"‹˜ÛÜ™\WÌL—ÌWÌˆŽˆº) y.í¸àj8àá¸à®xàâ8à¬xàï8à®xà¤¹kï¹oç9.æ8àdxà¢øàj:) y¬`¹¯#øà£8à¤¹è®º*£xàeøà¡8àfxàcøàj¸à¢øà ˆ‹˜ÛÜ™\WÌL—ÌWÌÈŽˆ¹méyê"ùd#xàh8àdxàiøàj¸àcù¢$9§§9âjxàj9æë¹æ¡8à¤¹kï¹oç8àexàføà¢øà ˆ‹˜ÛÜ™\WÌL—Ì—ÌHŽˆºgg¹ªgú ïz) y.íˆ‹˜ÛÜ™\WÌL—Ì—ÌˆŽˆ¸à#9ªgú ïz) y.í¸à#{ï&¹©'9í(¸àîùænúc,¸àîú*"9ë¥øàj¸àjxà xà­øà®xàá¸àè8àc9/exà¤¸àfxà¢øàbÈ‹˜ÛÜ™\WÌL—Ì—ÌÈŽˆ¸à#:gg¹ªgú ïz) y.í¸à#{ï&¹ )ú ïxàîùcëùå*9 )øàîøà®øà«xàéxàê¸àá¸à¨øàj¸àjxà xàjxàk¹ê"ùn©¸àk¹dàz,ê¸àiùbåxàcøàbÈ‹˜ÛÜ™\WÌL—Ì×ÌHŽˆ¹íd9d"9n©¸à¤¹/c¸àcøàfxà¢È‹˜ÛÜ™\WÌL—Ì×ÌˆŽˆŒxàè¸à®8àéxàï8àêøàc9. 8ài8àkº,«9bæxàn:fá¹.+xàfxà¢øàj9açzfá¹n©¸à¤ºjæ8à xà¡8àfxàcøàj¸à¢øà ˆ‹˜ÛÜ™\WÌL—Ì×ÌÈŽˆ¹i%º`ê:*+z*"yi%¹¬ê9ab8àkº*+z*"8à xàiøàkøàj¸àa8à ˆ‹˜ÛÜ™\WÌL—ÌÌHŽˆ¸à©8àìøà®xà¯øàìøà®H‹˜ÛÜ™\WÌL—ÌÌˆŽˆ¸à#8àªøàåøà®øàêùc%¸à#{ï&¸àáøàï8à¯øàj9aé¹ä!¸à¤¸ào¸àj8à xà ya¡z`ê:*lùí,8à¤ºf¨8àfH‹˜ÛÜ™\WÌL—ÌÌÈŽˆ¸à#9í¦y¢oøà#{ï&¹¥è¹kf8à«øàêxà®xàk¹ânyo­8à¤¹o%xàcyí¦xàd‹˜ÛÜ™\WÌL—ÌWÌHŽˆ¹íd9d"8àá¸à®xàâ‹˜ÛÜ™\WÌL—ÌWÌˆŽˆ¸à#9cf9/døàá¸à®xàâ8à#{ï&¸àåøàëxà¬8àêxàè:`ê9dàycf9/cH‹˜ÛÜ™\WÌL—ÌWÌÈŽˆ¸à#9íd9d"8àá¸à®xàâ8à#{ï&º`ê9dàyd#9hêøàkº`(ù¤.ˆ‹˜ÛÜ™\WÌL—Ì—ÌHŽˆÒH‹˜ÛÜ™\WÌL—Ì—ÌˆŽˆºe¢ùænº !xàc9i"y¦í8à¤¸àê¸àçxà®8àâ8àê¸àn9cãy¦(8àfxà¢øàj8à z!ê¹båxàiøàäøàêøàâxàj9cf9/døàá¸à®xàâ8àc:-l8à¢ÐÒxàäxà©8àåøàêxà©8àìøàkùk§ú(áydàz,ê¸à¤¹¥+ù£í8àfxà¢øà ˆ‹˜ÛÜ™\WÌL—Ì—ÌÈŽˆº!ê¹båyc%¸àeøài¸àa8ài¸à ¸à xàá¸à®xàâ9a¡yk®xà¡8àë8àäøàéxàï9gî¹®¥¸àc9.#yc`yb!¸àj¸à¢ydàz,ê¸àc:!ê¹båyæ¡8àjù/çz*/8àexà£8à¢øà£øàdxàiøàkøàj¸àa8à ˆ‹˜ÛÜ™\WÌL—Ì×ÌHŽˆ¹cåùaixà£9è®º*£H‹˜ÛÜ™\WÌL—Ì×ÌˆŽˆ¹¥éøà­øà®xàá¸àè8àj9¥¬8à­øà®xàá¸àè8à¤¹. 9k¦¹§'úe¤ù.)º(c9ê/9`ãxàeøà yíd9§§8à¤¹«å:/ øàeøài¸àbøà¢y¥éøà­øà®xàá¸àè8à¤¹`g9«h¸àfxà¢ù¥®y¬åxàc8à`¸à¢øà ˆ‹˜ÛÜ™\WÌL—Ì×ÌÈŽˆ¸à#:e¢ùæn¹`m8àk¸àá¸à®xàâ9d"9¨/8à#xàj8à#9b*yå*: !xàc9©kybæxàiùcåøàdyaixà£8à¢xà£8à¢øàdøàj8à#xàkùd#8àf9è®º*£xàiøàkøàj¸àa8à ˆ‹˜ÛÜ™\WÌL—ÌÌHŽˆº`jyoç9/çyk¢‹˜ÛÜ™\WÌL—ÌÌˆŽˆ“Ôøàk¸à­xàçxàï8àâ9í`¹.¡¸àjùd"8à£øàføài¸à¨¸àåøàê¸à¤¹¥¬Ôøàn9kï¹oç8àexàføà¢øàk¸àkøà yä¬9h ùi"yc%¸àn9kï¹oç8àfxà¢ù/çyk¢8àk¹/¢øàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌL—ÌÌÈŽˆ¹b*yå*9í`¹.¡¸àeøàgÒ8à¤¹cf8àjøàåxàªxàï8àç¸ààøàâ8àeøài¹nàù¨á8àfxà¢øàh8àdxàiøàkøà z) y¬`¸àexà£8à¢ùk¢yaj8àj¹­¢9c®øàë8àæxàêøà¤¹® 8àgøàexàj¸àa9h-9d"8àc8à`¸à¢øà ˆ‹˜ÛÜ™\WÌL×ÌWÌHŽˆ¸à¨¸à®8àèøà©8àêÈ‹˜ÛÜ™\WÌL×ÌWÌˆŽˆ¸à#8à©¸àªxàï8à¯øàï8àåxàªxàï8àêøà#{ï&¹méyê"øà¤ºh!¸àjú`,¸à xà z) y.í¸àc9k¢yk¦¸àeøàgù¨b9.í¸àiú*"9å.øàeøà¡8àfxàa‹˜ÛÜ™\WÌL×ÌWÌÈŽˆ¸à#8à¨¸à®8àèøà©8àêøà#{ï&¹çëxàa9cãyoªxàiù/g9¢$8àîùè®º*£xàîù¥.ye¡8à ¹i"y¦í8àn9kï¹oç8àeøà¡8àfxàa‹˜ÛÜ™\WÌL×Ì—ÌHŽˆ¸àêxà©8à®øàìøà®y§hy.íˆ‹˜ÛÜ™\WÌL×Ì—ÌˆŽˆ“ÔÔøàêxà©8àå¸àêxàê¸à¤º(ïydàxàn9ía8àoú/¯8à 9h-9d"8à xàêxà©8à®øàìøà®y§hzh!xàîú$eù/g9ª*z(j9é.¸àîøà¯xàï8à®ze¢ùé.¹ïªybæxàk¹§"yá(xàj¸àjxà¤¹è®º*£xàfxà¢øà ˆ‹˜ÛÜ™\WÌL×Ì—ÌÈŽˆ¸à#8àª¸àï8àåøàìøà¯xàï8à®xàh8àbøà¢z$eù/g9ª*xàc8àj¸àa8à#xàj8àa8àa¹ä!º)èøàkú*©8à¢¸àiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌL×Ì×ÌHŽˆ’XPÈ‹˜ÛÜ™\WÌL×Ì×ÌˆŽˆºe¢ùænº !yaj9dèxàc9d#8àf8àêxà©8àå¸àêxàê¹âb8à¤¹/oøàb8à¢øà¢8àa¸à y/§ykf:e¨¹/à¸àåxà¨xà©8àêøà¡8à¬øàìøàá¸àâ¹k¦¹ïªxà¤¹ë¨yä!¸àfxà¢ù/¢øàc8à`¸à¢øà ˆ‹˜ÛÜ™\WÌL×Ì×ÌÈŽˆ¸à¯xàï8à®xà¬øàï8àâxàh8àdyâb9ë¨yä!¸àeøài¸à ¸à yk§ú(c9ä¬9h øà¡9/§ykf8àêxà©8àå¸àêxàê¸àc:`exàb8àl9d#8àf9íd9§§8àjøàj¸à¢xàj¸àa9h-9d"8àc8à`¸à¢øà ˆ‹˜ÛÜ™\WÌL×ÌÌHŽˆ¸àæxàï8à®xàêxà©8àìÈ‹˜ÛÜ™\WÌL×ÌÌˆŽˆºf§9k¬ùæn¹å'ù¦`¸àjøà#9§+9åj¸àjøàkøàjxàk¸à¬øàçøààøàâ8àîú*+yk¦¸àîøàêxà©8àå¸àêxàê¹âb8àc9aixàhøài¸àa8àgøàbøà#xà¤¹ânyk¦¸àiøàcxà¢øàdøàj8àc9©âù¢$9ë¨yä!¸àk¹/¨y`)8àiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌL×ÌÌÈŽˆ¹i"y¦í8à¤º*,ycëøàfxà¢øàdøàj8àj8à yi"y¦í8àeøàgù¢$9§§9âjxàk¹âb8à¤º/ïz-èxàfxà¢øàdøàj8àkùb)xàk¹ë¨yä!¹­.ùbåxàh8àc:`(ù¤.¸àfxà¢øà ˆ‹˜ÛÜ™\WÌMÌWÌHŽˆ¹§"y§'øàiùâë:!ê¸àk¹¢$9§§8à¤¹å'øà ‹˜ÛÜ™\WÌMÌWÌˆŽˆ¹¥¬8à­øà®xàá¸àè9l#¹aixàkúe¢ùiâù¥éxàîùí`¹.¡¹¥éxàj9¢$9§§9âjxàc8à`¸à¢øàgøà xàåøàëxà®8à©øà«øàâ8àj8àeøài¹¢lxàb8à¢øà ˆ‹˜ÛÜ™\WÌMÌWÌÈŽˆ¹ecúhc9æn¹å'ùo£8àh8àdyë¨yä!¸àfxà¢øàk¸àiøàkøàj¸àcú*"9å.øàîùæèú)¥¸à¤¹í¦yí¦¸àfxà¢øà ˆ‹˜ÛÜ™\WÌMÌ—ÌHŽˆ•Ð”È‹˜ÛÜ™\WÌMÌ—ÌˆŽˆ¸à­øà®xàá¸àè9l#¹aixà¤º*+z*"8à ze¢ùæn¸à xàá¸à®xàâ8à y¥fz ¬¸àj¸àjxàn9b!º)èøàeøàgÕÐ”øàiù¢áyodøàîú)¢ùêcxà¢¸à¤º(c8àa¸à ˆ‹˜ÛÜ™\WÌMÌ—ÌÈŽˆ•Ð”øàkùcf8àj¸à¢ùía9îe9fìøàiøàkøàj¸àa8à ˆ‹˜ÛÜ™\WÌMÌ×ÌHŽˆº,áù®¤8àç¸àãxà®8àèxàìøàâ‹˜ÛÜ™\WÌMÌ×ÌˆŽˆŒL9.®¹§"8àk¹.åy.¢øà¤ŒL9.®¸àiùoáxàfŒxàbù§"8àiùí`¸àb8à¢xà£8à¢øàj8àkúfd8à¢xàj¸àa8à ˆ‹˜ÛÜ™\WÌMÌ×ÌÈŽˆ¹.®¸à¤¹h¥øà¡8àføàl9«å9/¢øàeøài¹§'úe¤øàc9çëyî+¸àfxà¢øàj9 'xàa:/¯8ào¸àj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌMÌÌHŽˆ¸à«øàê¸àá¸à¨øàªøàêøàäxà®H‹˜ÛÜ™\WÌMÌÌˆŽˆ¹íc:-ëÐxàcù¥éxà P¸àcy¥éxàj¸à¢Mù¥éxàk¹íc:-ëøàc8à«øàê¸àá¸à¨øàªøàêøàäxà®xàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌMÌÌÈŽˆ¹çëxàa9íc:-ëøà¤¸à«øàê¸àá¸à¨øàªøàêøàäxà®xàj:`n8àl8àj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌMÌWÌHŽˆÕˆ‹˜ÛÜ™\WÌMÌWÌˆŽˆ‘UN8à PPÏLL8àj¸à¢PÕKLŒ8àiøà¬øà®xàâ:-¡z`c¸àiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌMÌWÌÈŽˆ”Õ¸àjÕ¸àk¹ë)¹cíøàîùo#øà¤¹cå¸à¢º`exàb8àj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌMÌ—ÌHŽˆ¸àê¸à®xà«È‹˜ÛÜ™\WÌMÌ—ÌˆŽˆ¹í#y§'ú`ayní¸àk¹cëú ïy )øà¤¹¥êy§'øàjùânyk¦¸àeù.èù¦ïú) ydèxà¤¹å*9¡#øàfxà¢øàk¸àkøàê¸à®xà«ùkï¹oç8àiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌMÌ—ÌÈŽˆ¹æn¹å'ù®"8àoúf§9k¬øà¤¸à#9l!¹§ixàê¸à®xà«øà#xàj8àh8àdy¢lxà£øàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌMÌ×ÌHŽˆ¸àåøàëxà®8à©øà«øàâ9ílyd"8àç¸àãxà®8àèxàìøàâ‹˜ÛÜ™\WÌMÌ×ÌˆŽˆº/ïyb¨9ªgú ïxàkº) y§&øàjùkï¸àeøài¸à ze¢ùæn¹méy¥l8àh8àdxàiøàj¸àcùí#y§'øàîøàá¸à®xàâ:aãøàîú,®ùå*8àîøàê¸à®xà«øào¸àiùd"8à£øàføài¹b)9¥«xàfxà¢øàk¸àc9ílyd"9æ¡8àj¹ë¨yä!¸àiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌMÌ×ÌÈŽˆ¹d!9¢áyodøàc:!ê¹b!¸àkºh&9gçøàh8àdy§ :`jyc%¸àfxà¢øàj8à yaj9/dùí#y§'øà¡9dàz,ê¸à¤¹¤#xàj¸àa¹h-9d"8àc8à`¸à¢øà ˆ‹˜ÛÜ™\WÌMÌÌHŽˆ¸à®xàá¸àï8à«øàæøàêøàà‹˜ÛÜ™\WÌMÌÌˆŽˆ¹íc9e­¹li8àjøàkú`,¹£eøàîøàê¸à®xà«øà¤º) yí!8àeøà ze¢ùæn¸ààxàï8àè8àjøàkùamù/dùæ¡8àj¹/g9©kz*¬ºhc8à¤¹aly§"xàfxà¢øàj¸àjxà yæî9¢bøàjùoç8àf8ài¹ áyh,yì¤¹n©¸à¤¹i"xàb8à¢øà ˆ‹˜ÛÜ™\WÌMÌÌÈŽˆ¹aj9dèxàn9d#8àf:*lùí,9 áyh,xà¤¹d#8àf:h.ùn©¸àiú` xà¢øàdøàj8àc9§ :`jxàj8àkúfd8à¢xàj¸àa8à ˆ‹˜ÛÜ™\WÌMÌWÌHŽˆ¹dàz,ê¹ë¨yä!ˆ‹˜ÛÜ™\WÌMÌWÌˆŽˆ¸à¬øàï8àâxàë8àäøàéxàï8àk¹k§ù¥¯yã¡øàj8àá¸à®xàâ8àiú)¢øài8àbøàhøàgù«(:fiy¥l8à¤¹í¦yí¦¹®+9k¦¸àeøà ze¢ùæn¸àåøàëxà®øà®xà¤¹¥.ye¡8àfxà¢ù/¢øàc8à`¸à¢øà ˆ‹˜ÛÜ™\WÌMÌWÌÈŽˆ¹k£9¢$9o£8àjù©'9§îøàfxà¢øàh8àdxàiøàj¸àcøà z*+z*"8àîùk§ú(áy«­zf£¸àbøà¢y«(:fixà¤¹/g8à¢º/¯8ào¸àj¸àa9­.ùbåxàc:aãz) xàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌMÌLÌHŽˆ¸àåøàëxà®8à©øà«øàâ:*¯ú`e8àç¸àãxà®8àèxàìøàâ‹˜ÛÜ™\WÌMÌLÌˆŽˆº) y.í¸àc9¦#¹è®¸àiù¢$9§§9âjxàc9k¦¹ïªxàeøà¡8àfxàa:*¯ú`e8àiøàkùfî¹k¦¹/¨y¨/9g¢ùidyí!8àc:`jxàfxà¢ùh-9d"8àc8à`¸à¢øà ˆ‹˜ÛÜ™\WÌMÌLÌÈŽˆº*¯ú`e:*"9å.øàj‘”9/g9¢$8àh8àdxàiøàj¸àcøà yidyí!9o£8àk¹liz(c8àîùi"y¦í8àîùcåùaixà£8ào¸àiùë¨yä!¹kïº,hxàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌMWÌWÌHŽˆ¸à©8àìøà­øàáøàìøàâ9ë¨yä!ˆ‹˜ÛÜ™\WÌMWÌWÌˆŽˆ¹¥éù¥¬8à­øà®xàá¸àè8à¤¹. 9k¦¹§'úe¤ù.)º(c9ê/9`ãxàeøà yecúhc8àj¸àdxà£8àl9¥éøà¤¹`g9«h¸àfxà¢ù¥®y¬åxàc8à`¸à¢øà ˆ‹˜ÛÜ™\WÌMWÌWÌÈŽˆºe¢ùæn¹k£9.¡xà­xàï8àäøà®yë¨yä!¹í`¹.¡¸àiøàkøàj¸àa8à ˆ‹˜ÛÜ™\WÌMWÌ—ÌHŽˆ”ÓH‹˜ÛÜ™\WÌMWÌ—ÌˆŽˆ¹§":e¤ùê/9`ãyã¡ÎNKŽIy.éy."¸àj¸àjyamù/dùæ¡8àj¹¬-9®¥¸à¤¹d"9¡#øàfxà¢øà ˆ‹˜ÛÜ™\WÌMWÌ—ÌÈŽˆ¸à#:jæ9dàz,ê¸àjøàfxà¢øà#xàk¸à¢8àa¸àj¹®+8à£8àj¸àa:(j9ãï¸àh8àdxàiøàkùë¨yä!¸àeøàjøàcøàa8à ˆ‹˜ÛÜ™\WÌMWÌ×ÌHŽˆ¸à­xàï8àäøà®xàáøà®xà«È‹˜ÛÜ™\WÌMWÌ×ÌˆŽˆ¹aj9é/¸àëxà¬8à©8àìù.#z ïxàkù`"ù.®¸àk¹¤ãy/g:,ê¹ecøà¢8à¢ºjæ9a*¹ab9n©¸àj8àj¸à¢¸à¡8àfxàa8à ˆ‹˜ÛÜ™\WÌMWÌ×ÌÈŽˆ¹cåù.æ:h!¸àh8àdxàiùoáxàf¹a*¹ab9n©¸à¤¹¬n¸à xà¢øà£øàdxàiøàkøàj¸àa8à ˆ‹˜ÛÜ™\WÌMWÌÌHŽˆ•TÈ‹˜ÛÜ™\WÌMWÌÌˆŽˆ•Tøàkù`g:fîùæí9o£8àjùk¢yaj9`g9«h¸à¡9ænºfîùªgùb!ù¦ïøào¸àiúfîùb¦øà¤¹/¦ùíi¸àfxà¢øà ˆ‹˜ÛÜ™\WÌMWÌÌÈŽˆ•Tøà¤ºemù¦`ºe¤øàk¹..úfîù®¤8àj:  øàb8àj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌMWÌWÌHŽˆ¹æèù§îú*/9¢è‹˜ÛÜ™\WÌMWÌWÌˆŽˆ¸à¨¸à«øà®øà®xàëxà¬8à¡9¢oú*£z*&:c,¸à¤¹¢¯yaî¸àeøà z)£ùê"øàjxàb¸à¢º`bùå*8àexà£8ài¸àa8à¢øàbùè®º*£xàfxà¢øà ˆ‹˜ÛÜ™\WÌMWÌWÌÈŽˆ¹æèù§îù.®¸àc:!ê¹b!¸àiùkïº,hy©kybæxà¤¹k§ù¥¯xàeøàiº*ey/¨xàfxà¢ùâ­¹¡bøàkùâë9êâù )øàjùecúhc8àc8à`¸à¢øà ˆ‹˜ÛÜ™\WÌMWÌ—ÌHŽˆº mùbæyb!¹££‹˜ÛÜ™\WÌMWÌ—ÌˆŽˆ¹å,ú*âú !xàj9¢oú*£z !xà¤¹b)y.®¸àjøàfxà¢ú mùbæyb!¹££8àkù.#y«húf,¹«h¸àjùonyêâøài8à ˆ‹˜ÛÜ™\WÌMWÌ—ÌÈŽˆ¹a¡z`ê9ílyb-yæèù§îøàh8àdxà xàiøàkøàj¸àa8à ¹æèù§îøàkú*ey/¨y¢bù«­xàk¹. 8ài8àiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌMWÌ×ÌHŽˆ¹í¦yí¦¹æ¡9¥.ye¡‹˜ÛÜ™\WÌMWÌ×ÌˆŽˆ¹§"9«(xàiùcëùå*9 )øàîùnlùgaùoªy¥éù¦`ºe¤øàîùecøàa9d"8à£øàfù.í¹¥l8à¤¹è®º*£xàeøà yæë¹ª&y§*º`e8àkºh!yæë¸àn9¥.ye¡9ëe¸à¤º*+yk¦¸àfxà¢ù/¢øàc8à`¸à¢øà ˆ‹˜ÛÜ™\WÌMWÌ×ÌÈŽˆ’Ôxàc:"kùc%¸àeøài¸à ¹b*yå*: !y/¨y`)8àc9."øàc8àhøài¸àa8àj¸àa8àbøà y£!ùª&xàk¹æë¹æ¡8à¤¹è®º*£xàfxà¢øà ˆ‹˜ÛÜ™\WÌMWÌÌHŽˆ¸à©8àìøà­øàáøàìøàâ9ë¨yä!ˆ‹˜ÛÜ™\WÌMWÌÌˆŽˆ¸à#8à©8àìøà­øàáøàìøàâ9ë¨yä!¸à#{ï&¸à­xàï8àäøà®xà¤¹¥êxàcù«hùn.8àn9¢.øàfH‹˜ÛÜ™\WÌMWÌÌÈŽˆ¸à#9ecúhc9ë¨yä!¸à#{ï&¹¨.y§+9c§ùfè8à¤º*¯øànya£yæn¸à¤ºf,¸àd‹˜ÛÜ™\WÌM—ÌWÌHŽˆ¹íc9e­¹¢)¹åiH‹˜ÛÜ™\WÌM—ÌWÌˆŽˆ¹aj9é/‘9¥®zaçxàjù¬¯øàa:)!ù¥l8à­øà®xàá¸àè8àk¹ílyd"8àëxàï8àâxàç¸ààøàåøà¤¹/g8à¢øàk¸àkù áyh,xà­øà®xàá¸àè9¢)¹åixàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌM—ÌWÌÈŽˆ¹§ 9¥¬9¢ :(dùl#¹aiz!ê¹/døà¤¹æë¹æ¡8àjøàeøàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌM—Ì—ÌHŽˆ”ˆ‹˜ÛÜ™\WÌM—Ì—ÌˆŽˆ¸à#\ËR\øà#{ï&¹ãï¹g*8àk¹©kybæxàk¹iïøà ¹ãï¹â­¸àk¹/g9©kxà y¢áyodøà yo¡xàhxà zaãz)!øà yecúhc9à®xà¤¹cëú)¥¹c%¸àfxà¢È‹˜ÛÜ™\WÌM—Ì—ÌÈŽˆ¸à#ËP™xà#{ï&¹¥.ye¡9o£8àjùæë¹£!øàfy©kybæxàk¹iïøà ¹.#z) yméyê"øàk¹nàù«h¸à¡9onybl¸àîù áyh,xàk¹­`xà£8à¤¹a£z*+z*"8àfxà¢È‹˜ÛÜ™\WÌM—Ì×ÌHŽˆ¸à¯xàê¸àéxàï8à­øàéøàìøàäøà®8àãxà®H‹˜ÛÜ™\WÌM—Ì×ÌˆŽˆ¹g*9nªùë¨yä!º*¬ºhc8àjù©kybæyb!¹§¤8à xà«øàêxà©¸àâyl#¹aixà y¥fz ¬¸à z`bùå*9¥+ù£í8à¤¹. 9/dù£ä9/¦øàfxà¢ù/¢øàc8à`¸à¢øà ˆ‹˜ÛÜ™\WÌM—Ì×ÌÈŽˆº(ïydàxà¤¹hì¸à¢øàh8àdxàiùoáxàf¸à¯xàê¸àéxàï8à­øàéøàìøàj8àkúfd8à¢xàj¸àa8à ˆ‹˜ÛÜ™\WÌM—ÌÌHŽˆ’ÔH‹˜ÛÜ™\WÌM—ÌÌˆŽˆº!ê¹båyc%¹l#¹aiyo£8àjùaé¹ä!¹¦`ºe¤øàîøàª8àêxàï9ã¡øàîùb*yå*9ã¡øà¤º/ïz-èxàeùb®y§§8à¤º*ey/¨xàfxà¢øà ˆ‹˜ÛÜ™\WÌM—ÌÌÈŽˆ¹l#¹aiyk£9.¡¸à¤¸à­8àï8àêøàjøàeøàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌM×ÌWÌHŽˆ¹/ yå.È‹˜ÛÜ™\WÌM×ÌWÌˆŽˆ¹cåù¬ê9¦`ºe¤ùcb¹®&øà¤¹æë¹æ¡8àjøà­øà®xàá¸àè9c%¹¨b8à¤¹«å:/ øàeù¢¥z,áùb®y§§8à¤º*i¹ë¥øàfxà¢øà ˆ‹˜ÛÜ™\WÌM×ÌWÌÈŽˆ¹§ 9b'xàbøà¢yânyk¦º(ïydàxà`¸à¢¸àcxàiùæë¹æ¡8à¤¹o£9.æ8àdxàeøàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌM×Ì—ÌHŽˆ”‘”‹˜ÛÜ™\WÌM×Ì—ÌˆŽˆ¸à#‘’xà#{ï&¹`&z(ç:(ïydàxàîù¢ :(døàîù/ y©kxàj¸àjxàk¹ áyh,xà¤ºfá¸à xà¢È‹˜ÛÜ™\WÌM×Ì—ÌÈŽˆ¸à#‘”8à#{ï&º) y.í¸à¤¹é.¸àeøà yamù/dùæ¡8àj¹£ä9¨b8à¤¹/§zh/8àfxà¢È‹˜ÛÜ™\WÌNÌWÌHŽˆ”ÕÓÕ‹˜ÛÜ™\WÌNÌWÌˆŽˆ¹n ¹h-9¢$:emøàj:!ê¹é/¹¢ :(dùb¦øà¤¹ía8àoùd"8à£øàføài¹¥¬9n ¹h-9cà¹aixà¤¹©':*#¸àfxà¢ù/¢øàc8à`¸à¢øà ˆ‹˜ÛÜ™\WÌNÌWÌÈŽˆ¹b!¹§¤8àåxàë8àï8àè8àëøàï8à«øà¤¹/oøàa¸àdøàj:!ê¹/døàc9¢)¹åixàiøàkøàj¸àa8à ˆ‹˜ÛÜ™\WÌNÌ—ÌHŽˆ¹n ¹h-9¢$:emùã¡øàj9æî9kï¹n ¹h-8à­øà©øà¨ˆ‹˜ÛÜ™\WÌNÌ—ÌˆŽˆ¹¢$:emùn ¹h-8àiújæ8à­øà©øà¨¸àk¹.¢ù©kxàn9¢¥z,áøàfxà¢ùb)9¥«xàj¸àjxàjÔxà¤¹b*yå*8àfxà¢øà ˆ‹˜ÛÜ™\WÌNÌ—ÌÈŽˆ”xà¤º(ïydàycf9/døàk¹/¨y¨/9¬n¹k¦¹¢bù¬åxàj9­íùd#8àeøàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌNÌ×ÌHŽˆ¹më¹b)yc%ˆ‹˜ÛÜ™\WÌNÌ×ÌˆŽˆºjæ9dàz,ê¸à­xàçxàï8àâ8àiù.å¹é/¸àj9më¹b)yc%¸àfxà¢øàk¸àkùmë¹b)yc%¹¢)¹åixàk¹/¢øàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌNÌ×ÌÈŽˆ¹/c¹/¨y¨/yoáxàf¸à¬øà®xàâ8àê¸àï8àà8àï8à­øààøàåøàiøàkøàj¸àcøà y/c¸à¬øà®xàâ9©âú`(8àc:aãz) xàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌNÌÌHŽˆ’ÑÒH‹˜ÛÜ™\WÌNÌÌˆŽˆ¸à#ÑÒxà#{ï&¹§ 9í`¹æ¡8àjú`e9¢$8àeøàgøàa9íd9§§8à¤¹®+8à¢È‹˜ÛÜ™\WÌNÌÌÈŽˆ¸à#ÔÑ¸à#{ï&’ÑÒz`e9¢$8àjùânxàjúaãz) xàj¹¢$9b§ú) yfè‹˜ÛÜ™\WÌNÌWÌHŽˆ”\œÛÛ›™[‹˜ÛÜ™\WÌNÌWÌˆŽˆº"éynm9li8àn8à¯øàï8à¬¸ààøàâ8à¤¹íg¸à¢¸à yea¹dàxàîù/¨y¨/8àîú,ªz-ëøàîùn ùdb¸à¤¹¥m9d"8àexàføà¢øà ˆ‹˜ÛÜ™\WÌNÌWÌÈŽˆ8àjÕÓÕ8à¤¹­íùd#8àeøàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌNÌ—ÌHŽˆÔ“H‹˜ÛÜ™\WÌNÌ—ÌˆŽˆ¸à#T”8à#{ï&¹/ y©kyaj9/døàk¹íc9e­º,áù®¤‹˜ÛÜ™\WÌNÌ—ÌÈŽˆ¸à#Ô“xà#{ï&ºhiùk¨¹ áyh,xàîúhiùk¨¸àj8àkºe¨¹/àˆ‹˜ÛÜ™\WÌNÌ×ÌHŽˆ¹¢ :(dúe¢ùæn¹¢)¹åiH‹˜ÛÜ™\WÌNÌ×ÌˆŽˆ¹l!¹§ixàkº(ïydàymë¹b)yc%¸àjúaãz) xàj¹å.ù`ãú*£z+f9¢ :(døà¤ºaãyà®zh&9gçøàj9k¦¸à xà z!ê¹é/¹è%9êm¸àj9i)ùki¸àj8àk¹alyd#9è%9êm¸à¤¹ía8àoùd"8à£øàføà¢È‹˜ÛÜ™\WÌNÌ×ÌÈŽˆ¹­`z(c8àeøài¸àa8à¢ù¢ :(døàn8àk¹¢¥z,áøàj8à z!ê¹é/¹¢)¹åixàjùoáz) xàj¹¢ :(dù¢¥z,áøàkùd#8àf8àiøàkøàj¸àa8à ˆ‹˜ÛÜ™\WÌNÌÌHŽˆ¹¢ :(døàëxàï8àâxàç¸ààøàåÈ‹˜ÛÜ™\WÌNÌÌˆŽˆŒùnm9o£8àkº(ïydày¢¥yaixàbøà¢z`!¹ë¥øàeøà Lynm9æë¸àjùgî¹é#¹©':*/8à L¹nm9æë¸àjú*i¹/g8à Lùnm9æë¸àjúaãùå(ù¢ :(døà¤¹è®¹êâøàfxà¢ú*"9å.øà¤¹/g8à¢øà ˆ‹˜ÛÜ™\WÌNÌÌÈŽˆ¸àëxàï8àâxàç¸ààøàåøàkù¦`ºe¤ú.î8àj9.¢ù©kxàîú(ïydàxàj8àk¸ài8àj¸àc8à¢¸àc9oáz) xàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌNWÌWÌHŽˆ”ÔÈ‹˜ÛÜ™\WÌNWÌWÌˆŽˆ”Ôøàáøàï8à¯øàbøà¢yea¹dàyb)yhì¹."¸à¤¹clù¦`ºfáº*"8àeùæn¹¬ê8àn9­.ùå*8àiøàcxà¢øà ˆ‹˜ÛÜ™\WÌNWÌWÌÈŽˆ”ÔÏy¬n¹®"9êëù§*øàh8àdxà xàj9âëxàcùä!º)èøàeøàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌNWÌ—ÌHŽˆÐQ‹˜ÛÜ™\WÌNWÌ—ÌˆŽˆ¸à#ÐQ8à#{ï&º*+z*"8àîú(ïyfìÈ‹˜ÛÜ™\WÌNWÌ—ÌÈŽˆ¸à#ÐQxà#{ï&º)èù§¤8àîøà­øàçøàéxàë8àï8à­øàéøàìÈ‹˜ÛÜ™\WÌNWÌ×ÌHŽˆÐÈ‹˜ÛÜ™\WÌNWÌ×ÌˆŽˆ¹`"ù.®¹d#9hêøàc8àåøàêxààøàâ8àåxàªxàï8àè9."¸àiùhìº,­øàfxà¢øàk¸àkÐÝÐøàk¹/¢øàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌNWÌ×ÌÈŽˆÐ¸àjÐøà¤º,ï9aiz !y.®¹¥l8àh8àdxàiùc.¹b)xàeøàj¸àa8à ˆ‹˜ÛÜ™\WÌNWÌÌHŽˆ¸à¨¸à«øààxàéxàª8àï8à¯È‹˜ÛÜ™\WÌNWÌÌˆŽˆ¹méyh-8à®øàìøà­xàk¹£+ùbåxà¤¸àª8ààøà®8àiùb!¹§¤8àeùål9n.9¦`¸àh8àdxà«øàêxà©¸àâxàn:`&¹çéxàiøàcxà¢øà ˆ‹˜ÛÜ™\WÌNWÌÌÈŽˆ¸à®øàìøà­xàj8à¨¸à«øààxàéxàª8àï8à¯øàk¹onybl¸à¤º`!¸àjøàeøàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌŒÌWÌHŽˆÚXÚÈ‹˜ÛÜ™\WÌŒÌWÌˆŽˆ¹aé¹ä!¹.í¹¥l8à¤¹í«y£ xàeù¢¥yaiy¦`ºe¤øà¤¹®&øà¢xàføàl9å'ùå(ù )øàkùd$y."¸àfxà¢øà ˆ‹˜ÛÜ™\WÌŒÌWÌÈŽˆ¹b®yã¡øàj9§"yb®y )øà¤¹d#8àf9¡#ùdløàjøàeøàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌŒÌ—ÌHŽˆ¹.¢ù©kz`ê9b-ˆ‹˜ÛÜ™\WÌŒÌ—ÌˆŽˆ¸à#9ªgú ïyb)yía9îe8à#{ï&¹e­¹©kxàîú(ïz`(8àîù.®¹.¢øàj¸àjyl ºe 9ªgú ïxàe8àj8àjùíê9¢$‹˜ÛÜ™\WÌŒÌ—ÌÈŽˆ¸à#9.¢ù©kz`ê9b-¹ía9îe8à#{ï&º(ïydàxàîùg,9gçøàj¸àjy.¢ù©kycf9/cxàiùª*zfd8àj:,«9.îøà¤¹£ xài‹˜ÛÜ™\WÌŒÌ×ÌHŽˆ¹âny )ú) yfè9fìÈ‹˜ÛÜ™\WÌŒÌ×ÌˆŽˆ¸àäxàë8àï8àâ9fìøàiù.#z"kùc§ùfè8à¤¹.í¹¥l:h!¸àjù.)¸ànzaãyà®yc§ùfè8à¤º)¢øài8àdxà¢øà ˆ‹˜ÛÜ™\WÌŒÌ×ÌÈŽˆ¸à¬8àêxàåxàkº)¢øàgùæë¸àh8àdxàiÔPù¢bù¬åxà¤º`n8àl8àf¹æë¹æ¡8à¤º)¢øà¢øàdøàj8à ˆ‹˜ÛÜ™\WÌŒÌÌHŽˆÍL‹˜ÛÜ™\WÌŒÌÌˆŽˆ¹fî¹k¦º,®ÌÌ8à yi"ybåz,®ùã¡ÍŒ	xàj¸à¢y¤#yæâ¹b!¹l¤9à®yhì¹."ºjæLÌÌMÍL8àiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌŒÌÌÈŽˆ¹i"ybåz,®øà#9ã¡øà#xàj9i"ybåz,®øà#:hcxà#xà¤¹­íùd#8àeøàj¸àa8àdøàj8à ˆ‹˜ÛÜ™\WÌŒÌWÌHŽˆ¹hì¹."¹íãùb*yæâˆ‹˜ÛÜ™\WÌŒÌWÌˆŽˆ¸à#‹Ôøà#{ï&¸à`¸à¢ù¦`¹à®xàkº,¨y¥/ùâ­¹¡bøà º,áùå(øàîú,¨9`­xàîùí%:,áùå(È‹˜ÛÜ™\WÌŒÌWÌÈŽˆ¸à#Ó8à#{ï&¹. 9k¦¹§'úe¤øàk¹íc9e­¹¢$9î/¸à ¹cã¹æâ¸àîú,®ùå*8àîùb*yæâˆ‹˜ÛÜ™\WÌŒÌ—ÌHŽˆ¹®&ù/¨ya'ùcm‹˜ÛÜ™\WÌŒÌ—ÌˆŽˆ¹cå¹o¥ÌL9.!ùa¡¸à z $9å*ynm8à y«¢ùkf8àk¹k¦ºhcy¬åxàj¸à¢ynmŒ9.!ùa¡¸àk¹a'ùcm8àc9gî¹§+9/¢øàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌŒÌ—ÌÈŽˆ¹®&ù/¨ya'ùcm8àkù«ã¹nm9ãïºaäy¥+ùaî¸àc9æn¹å'øàfxà¢ù¡#ùdløàiøàkøàj¸àa8à ˆ‹˜ÛÜ™\WÌŒÌ×ÌHŽˆ¸àáøàï8à¯øà«øàë8àìøà®8àìøà¬‹˜ÛÜ™\WÌŒÌ×ÌˆŽˆ¹ecøàa9d"8à£øàfù.í¹¥l8àh8àdxàiøàj¸àcú)èù¬n¹¦`ºe¤øàîùa£yecøàa9d"8à£øàfùã¡øàîù® :-¬ùn©¸à¤¹ía8àoùd"8à£øàføài¸à­xàï8àäøà®y¥.ye¡8à¤¹b)9¥«xàfxà¢ù/¢øàc8à`¸à¢øà ˆ‹˜ÛÜ™\WÌŒÌ×ÌÈŽˆ¸àáøàï8à¯úaãøà¢8à¢¸à y©kybæy."¸àk¹ecøàa8àjùd"8àa¸àáøàï8à¯øàj9b!¹§¤9¥®y¬åxàc:aãz) xàiøà`¸à¢øà ˆ‹˜ÛÜ™\WÌŒWÌWÌHŽˆ¹ea¹ª&yª*H‹˜ÛÜ™\WÌŒWÌWÌˆŽˆ¸à#:$eù/g9ª*xà#{ï&¸àåøàëxà¬8àêxàè8àîù¥¡ùêè8àj¸àjxàk¹bmy/g9æ¡:(j9ãï¸à ¹c§ùbaøàj8àeøài¹bmy/g9¦`¸àjùæn¹å'È‹˜ÛÜ™\WÌŒWÌWÌÈŽˆ¸à#9ânz*,yª*xà#{ï&¹¢ :(dùæ¡8àj¹æn¹¦#¸à ¹aîºhf8àîùkêy§îøàîùænúc,¸àc9oáz) H‹˜ÛÜ™\WÌŒWÌ—ÌHŽˆ¹bmy/g9¦`ˆ‹˜ÛÜ™\WÌŒWÌ—ÌˆŽˆº!ê¹é/¸àh8àdxàc9ë¨yä!¸àfxà¢ú(ïz`(8àã¸à©¸àãøà©¸à¤¹éæ9ká¹ë¨yä!¸àfxà¢øàdøàj8àkùe­¹©kyéæ9ká¹/çz+møàjúe¨¹/à¸àfxà¢øà ˆ‹˜ÛÜ™\WÌŒWÌ—ÌÈŽˆº$eù/g9ª*xàkùænúc,¸àeøàj¸àdxà£8àl9æn¹å'øàeøàj¸àa8à xàiøàkøàj¸àa8à ˆ‹˜ÛÜ™\WÌŒWÌ×ÌHŽˆ¹.#y«høà¨¸à«øà®øà®yé y«h¹¬åH‹˜ÛÜ™\WÌŒWÌ×ÌˆŽˆ¹.å¹.®¸àk’Q8àîøàäxà®xàëøàï8àâxà¤¹á(y¥«yb*yå*8àeøài¸à¨¸à«øà®øà®xàfxà¢ú(c9à®¸àkù¬åyæ¡9ecúhc8àjøàj¸à¢øà ˆ‹˜ÛÜ™\WÌŒWÌ×ÌÈŽˆ¹¬åy.é9d#xàh8àdxàiøàj¸àcøà#9/exà¤º)£ùb-¸àfxà¢øàbøà#xà¤¹kï¹oç8àexàføà¢øà ˆ‹˜ÛÜ™\WÌŒWÌÌHŽˆ¹­/º`hùab‹˜ÛÜ™\WÌŒWÌÌˆŽˆ¸à#9­/º`høà#{ï&¹­/º`hùab8àc9b­9`ãz !xàn9©kybæy."¸àk¹£!ù£ë¹doy.é8à¤º(c8àaˆ‹˜ÛÜ™\WÌŒWÌÌÈŽˆ¸à#:*âú,¨8à#{ï&¹cåù¬ê9`m8àc:!ê¸à¢y£!ù£ë¸àeøà y.åy.¢øàk¹k£9¢$8àjú,«9.îøà¤º,¨8àaˆ‹˜ÛÜ™\WÌŒWÌWÌHŽˆ¹¬åy.é8àjùb¨8àb8ài¹k¢yaj8àîùak9æâ¸àîùéæ9ká¹/çy£ xàj¸àjxàk¹`*ùä!¸à º  ù¡k¸àfxà¢È‹˜ÛÜ™\WÌŒWÌWÌˆŽˆ¹b*yå*: !xàáøàï8à¯øà¤¹¥¬8àeøàa9æë¹æ¡8àn:.è¹å*8àfxà¢ùh-9d"8à y¢ :(dùæ¡8àjùcëú ïxàbøàh8àdxàiøàj¸àcøà yb*yå*9æë¹æ¡8àîù§+9.®¸àn8àkº*«9¦#¸àîù¬åy.é8à¡9é/¹a¡z)£ùê"øàn8àkº`jyd"8à¤¹è®º*£xàfxà¢øà ˆ‹˜ÛÜ™\WÌŒWÌWÌÈŽˆ¹¢ :(dú !xàk¹b)9¥«xàiøàkøà yí#y§'øà¡9b*yæâ¸àh8àdxàiøàj¸àcùk¢yaj9 )øàîùé/¹/&¹æ¡9olzgïøà º  ù¡k¸àfxà¢ùoáz) xàc8à`¸à¢øà ˆ‹˜ÛÜ™\WÌŒWÌ—ÌHŽˆ’QUˆ‹˜ÛÜ™\WÌŒWÌ—ÌˆŽˆ¸à#TÓøà#{ï&¹n øàa9b!ºaã¸àk¹fïzf¦ú)£ù¨/‹˜ÛÜ™\WÌŒWÌ—ÌÈŽˆ¸à#QPøà#{ï&ºfîù¬%øàîúfîùkd9b!ºaã¸àk¹fïzf¦ú)£ù¨/ŸNÂ™[˜Ý[Ûˆ˜[Y]T]Y\Ý[Û”Ù[X[XÐÛÛ˜XÝÊ
^ÂˆÛÛœÝžRYSØš™XÝ™œ›ÛQ[šY\ÊUQTÕSÓ—ÐS’Ë›X\
OO–ÜKšYWJJNÂˆÛÛœÝ\œ›ÜœÏV×NÂˆØš™XÝ™[šY\ÊUQTÕSÓ—ÔÑSPS•P×ÐÓÓ•PÕÊK™›Ü‘XXÚ

ÚY^XÝYJOOžÂˆÛÛœÝOXžRYÚYNÂˆYŠ\J^Ù\œ›ÜœËœ\Ú
	ÚYNˆZ\ÜÚ[™Ø
NÜ™]\›ŽßBˆYŠK›Ü[ÛœÏË–ÜK˜WHOOY^XÝY
Y\œ›ÜœËœ\Ú
	ÚYNˆ^XÝY‰Ù^XÝYH˜
NÂˆJNÂˆUQTÕSÓ—ÐS’Ë™›Ü‘XXÚ
OOžÂˆYŠUQTÕSÓ—ÐÓÓ•VÑTS‘SÖWÔUT“”ËœÛÛYJO”Ýš[™ÊKœJKš[˜ÛY\Ê
JJ^Âˆ\œ›ÜœËœ\Ú
	ÜKšYNˆÛÛ^Y\[™[ÛÜ™[™Ø
NÂˆBˆJNÂˆÓÔ‘WÐWÓS’ÑQÔUQTÕSÓ”Ë™›Ü‘XXÚ
OOžÂˆÛÛœÝPÓÔ‘WÐWÕÔP×ÓPTÜK˜ÛÜ™UÜXÒYNÂˆYŠ]
\™]\›ŽÂˆYŠÓÔ‘WÐWÓS’ÑQÔRS—ÐÓÓ•PÕÖÜKšYHOO\K›Ü[ÛœÖÜK˜WJ^Âˆ\œ›ÜœËœ\Ú
	ÜKšYNˆZ[ˆ[œÝÙ\ˆÛÛ˜XÝšY
NÂˆBˆYŠK™\Ý˜XÝÜ“[ÙOOOIÜØ[YK]ÜXËXÛÛ\\š\ÛÛ‰Ê^ÂˆYŠPÓÔ‘WÐWÐÓÓTT’TÓÓ—ÑÕRQTÖÜK˜ÛÜ™UÜXÒYJ^Âˆ\œ›ÜœËœ\Ú
	ÜKšYNˆØ[YK]ÜXÈÛÛ\\š\ÛÛˆÝZYHZ\ÜÚ[™Ø
NÂˆBˆYŠK˜ÚÚXÙQ^ÏË–ÜK˜WHOO\K™^
^Âˆ\œ›ÜœËœ\Ú
	ÜKšYNˆØ[YK]ÜXÈÛÛ\\š\ÛÛˆ^[˜][ÛˆšY
NÂˆBˆY[Ù^ÂˆYŠK˜[™ÛOOOIØ\XØ][Û‰É‰œK™^OO]™^[\J^Âˆ\œ›ÜœËœ\Ú
	ÜKšYNˆ\XØ][Ûˆ^[˜][Ûˆš[™[™ÈšY
NÂˆBˆÛÛœÝ^[˜][Û“Ý™\œšYRYÏ[™]ÈÙ]
ÉØÛÜ™\WÌWÌ—ÌÉË	ØÛÜ™\WÌ×Ì—ÌÉ×JNÂˆYŠK˜[™ÛOOOIÙ\ØÜš[Z[˜][Û‰É‰ˆY^[˜][Û“Ý™\œšYRYËš\ÊKšY
I‰œK™^OO]œ]˜[
^Âˆ\œ›ÜœËœ\Ú
	ÜKšYNˆ\ØÜš[Z[˜][Ûˆ^[˜][Ûˆš[™[™ÈšY
NÂˆBˆBˆJNÂˆ™]\›ˆÛÚÎ™\œ›ÜœË›[™ÝOOL\œ›ÜœßNÂŸB‚‚˜ÛÛœÝ—Ô‘QPÕSÓ—ÐÓÓ•PÕÏ^È›ÛÜÜÝ[NŒHŽˆŒÈ‹›ÛÜÜÝ[NŒˆŽˆŒL‹˜\œ˜^WÛX^ŒHŽˆŽH‹˜\œ˜^WÛX^ŒˆŽˆŽH‹›[™X\—ÜÙX\˜ÚŒHŽˆŒLˆ‹›[™X\—ÜÙX\˜ÚŒˆŽˆŒÈ‹œÝXÚ×ÛÜÎŒHŽˆ‹œÝXÚ×ÛÜÎŒˆŽˆˆ‹œ™XÝ\œÚ[ÛŽŒHŽˆŒH‹œ™XÝ\œÚ[ÛŽŒˆŽˆŒ‹™YWÙœÎŒHŽˆ‘‹™YWÙœÎŒˆŽˆÈ‹˜ÛÝ[Ù]™[ŽŒHŽˆŒH‹˜ÛÝ[Ù]™[ŽŒˆŽˆŒÈ‹˜\œ˜^WÜ™]™\œÙNŒHŽˆ‹˜\œ˜^WÜ™]™\œÙNŒˆŽˆ–ÍKË‹WH‹›™\ÝYÛÛÜŒHŽˆŒH‹›™\ÝYÛÛÜŒˆŽˆˆ‹˜š[˜\žWÜÙX\˜ÚØŽŒHŽˆ‹˜š[˜\žWÜÙX\˜ÚØŽŒˆŽˆH‹˜X˜›WÜÛÜØŽŒHŽˆ–ÌKK—H‹˜X˜›WÜÛÜØŽŒˆŽˆ–ÌK‹WH‹œÙ[XÝ[Û—ÜÛÜØŽŒHŽˆŒH‹œÙ[XÝ[Û—ÜÛÜØŽŒˆŽˆŒÈ‹›X]š^ÜÝ[NŒHŽˆŒÈ‹›X]š^ÜÝ[NŒˆŽˆŒL‹›X]š^Ùš[™ŒHŽˆŠK
H‹›X]š^Ùš[™ŒˆŽˆŠKJH‹œ]Y]YWÛÜÎŒHŽˆŒÈ‹œ]Y]YWÛÜÎŒˆŽˆH‹›[šÙYÛ\ÝŒHŽˆŒLˆ‹›[šÙYÛ\ÝŒˆŽˆŒŒH‹˜š]ÛX\ÚÎŒHŽˆŒL‹˜š]ÛX\ÚÎŒˆŽˆYH‹›Øš™XÝØÛÝ[\ŽŒHŽˆŒÈ‹›Øš™XÝØÛÝ[\ŽŒˆŽˆ‹™ØÙÙ]XÛYŒHŽˆŒLˆ‹™ØÙÙ]XÛYŒˆŽˆŒ‹œ™XÝ\œÚ]™WÙšXŽŒHŽˆŒˆ‹œ™XÝ\œÚ]™WÙšXŽŒˆŽˆŒÈŸNÂ˜ÛÛœÝ—ÐÓÓTÕS‘ÐÓÓ•PÕÏ^ÈœØ[\×Ùš[\ŽŒHŽˆœÝ[ONMËÛÝ[Lˆ‹œØ[\×Ùš[\ŽŒˆŽˆÈ‹œØ[\×Ùš[\ŽŒÈŽˆMÈ‹›X]š^Ý™\ÚÛŒHŽˆ˜ÛÝ[LKØÛÜ™OLH‹›X]š^Ý™\ÚÛŒˆŽˆŒÈ‹›X]š^Ý™\ÚÛŒÈŽˆH‹œ]Y]YWÜÙ\šXÙNŒHŽˆ–ÌL‹LËLH‹œ]Y]YWÜÙ\šXÙNŒˆŽˆŒLˆ‹œ]Y]YWÜÙ\šXÙNŒÈŽˆ–ÌLLWH‹›[šÙYÜ˜[šÎŒHŽˆ˜ÛÝ[LKÝ[OLM‹›[šÙYÜ˜[šÎŒˆŽˆŒH‹›[šÙYÜ˜[šÎŒÈŽˆŒˆ‹˜š[˜\žWØÛÝ[ŒHŽˆŒÈ‹˜š[˜\žWØÛÝ[ŒˆŽˆ‹˜š[˜\žWØÛÝ[ŒÈŽˆœÜÏMKÛÝ[Lˆ‹œ™XÝ\œÚ]™WÜÝ[NŒHŽˆŒH‹œ™XÝ\œÚ]™WÜÝ[NŒˆŽˆˆ‹œ™XÝ\œÚ]™WÜÝ[NŒÈŽˆŒL‹š[œÙ\[Û—Ü\ÜÎŒHŽˆ™]VÚŠÌWH8¡¤Ù^H‹š[œÙ\[Û—Ü\ÜÎŒˆŽˆ–ÌËËK—H‹š[œÙ\[Û—Ü\ÜÎŒÈŽˆ–ÌËKË—H‹œÜÝš^ÜÝXÚÎŒHŽˆ–Í×H‹œÜÝš^ÜÝXÚÎŒˆŽˆ¹®&ùë¥øà¡:fi9ë¥øàiøàkúh!¹n£øàiùíd9§§8àc9i"xà£øà¢øàgøà H‹œÜÝš^ÜÝXÚÎŒÈŽˆŒM‹˜™œ×Ü]Y]YNŒHŽˆš\Ú]YÝWH8¡¤YH‹˜™œ×Ü]Y]YNŒˆŽˆ–Ð‹×H‹˜™œ×Ü]Y]YNŒÈŽˆK‹ËH‹˜š]Ü\›Z\ÜÚ[ÛŽŒHŽˆ™˜[ÙH‹˜š]Ü\›Z\ÜÚ[ÛŽŒˆŽˆœ\›H8¡¤\›HÔˆÜš]SX\ÚÈ‹˜š]Ü\›Z\ÜÚ[ÛŽŒÈŽˆŒLLx  ˆ‹›Øš™XÝØØ\ŒHŽˆŒŒ‹›Øš™XÝØØ\ŒˆŽˆÝ[8¡¤Ý[0åÈ
HH˜]JH‹›Øš™XÝØØ\ŒÈŽˆŒML‹›X]š^Ý˜[œÜÜÙNŒHŽˆ›Ý]Ø×VÜ—H8¡¤VÜ—VØ×H‹›X]š^Ý˜[œÜÜÙNŒˆŽˆˆ‹›X]š^Ý˜[œÜÜÙNŒÈŽˆ–ÖÌKKÌ‹WKÌË—WH‹›Y\™ÙWÜÛÜYŒHŽˆ–ÌK‹WH‹›Y\™ÙWÜÛÜYŒˆŽˆ–ÌK‹‹×H‹›Y\™ÙWÜÛÜYŒÈŽˆ–ÌK‹K‹WH‹œÙ[[™[ÜÙX\˜ÚŒHŽˆ™]VÚWH8¢h\™Ù]‹œÙ[[™[ÜÙX\˜ÚŒˆŽˆ‹œÙ[[™[ÜÙX\˜ÚŒÈŽˆŒÈ‹™YWÚZYÚŒHŽˆœ™]\›ˆH
ÈX^
YšYÚ
H‹™YWÚZYÚŒˆŽˆŒˆ‹™YWÚZYÚŒÈŽˆŸNÂ˜ÛÛœÝ—ÔÑPÕT’UWÔÕTÐÓÓ•PÕÏ^Èœ\Ú[™ÎŒHŽˆ¸àåxà¨øààøà­øàìøà¬8àjøà¢8à¢ú*£z*/9 áyh,xàk¹ê ùcåˆ‹œ\Ú[™ÎŒˆŽˆ¹«hú)£øàk¹íc:-ëøàbøà¢xàäxà®xàëøàï8àâxà¤¹i"y¦í8àeøà yë¨yä!¹¢áyodøàn:`(ùíhxàfxà¢È‹œ\Ú[™ÎŒÈŽˆ¹æåøào¸à£8àgøàäxà®xàëøàï8àâxàh8àdxàiøàkøàëxà¬8à©8àìøàeøàjøàcøàcøàj¸à¢È‹œ˜[œÛÛ]Ø\™NŒHŽˆ¹¡'ù§äøàc9å¤xà£øà£8à¢Ôøà¤¸àãxààøàâ8àëøàï8à«øàbøà¢zf¥:fè¸àfxà¢È‹œ˜[œÛÛ]Ø\™NŒˆŽˆ¹k¦¹§'ùæ¡8àj¸àä8ààøà«øà¨¸ààøàåøàj9oªya`ùè®º*£H‹œ˜[œÛÛ]Ø\™NŒÈŽˆ¹êëù§*øàk¸à©8àæxàìøàâ8àëxà¬8à z*£z*/8àëxà¬8à z`&¹/èxàëxà¬‹˜XØÙ\ÜÎŒHŽˆ¹§ 9l#ùª*zfd8àk¹c§ùbaÈ‹˜XØÙ\ÜÎŒˆŽˆ¹aj9é/¹dèxàkºe¬º)©ùª*zfd8à¤¹i%¸àeøà yoáz) xàj¹¢áyodøà¬8àêøàï8àåøàh8àdxàjù.æ9.#¸àfxà¢È‹˜XØÙ\ÜÎŒÈŽˆ¹ª*zfd8àk¹k¦¹§'ùæ¡8àj¹¨æ¹cn8àeÈ‹›ÙÜÎŒHŽˆ¹¦k¹«­xàj9ål8àj¸à¢ùg,9gçøàîù¦`ºe¤ùn+øàk¹¢$9b§øàëxà¬8à©8àìøàj9i)úaãøàà8à©¸àìøàëxàï8àâH‹›ÙÜÎŒˆŽˆ¹§+9.®¸àk¹b*yå*9.¢ùk§øà y£©yí¦¹a`ù áyh,xà SQz*£z*/9liy«m‹›ÙÜÎŒÈŽˆ¸à¨¸àªøà©¸àìøàâ9/çz+møàj9olzgïùëá9fì¸àkº*¯ù§îøà¤º(c8àaˆ‹˜Ù\YšXØ]NŒHŽˆ¸à¨¸à«øà®øà®yab8àj:*/9¦#¹¦î8àk¹kïº,hxàc9. :!í8àføàf¸à yç'ù«hù )øà¤¹è®º*£xàiøàcxàj¸àa9â­¹¡bÈ‹˜Ù\YšXØ]NŒˆŽˆº+i¹db¸à¤¹á(z)¥¸àeøàiº*£z*/9 áyh,xà¤¹aiyb¦øàføàf¸à yë¨yä!¹¢áyodøàn9è®º*£xàfxà¢È‹˜Ù\YšXØ]NŒÈŽˆ¹ak:e¢úcmxàj9..ù/døàk¹kï¹oç8à¤º*/9¦#¸àfxà¢øàáøà®8à¯øàêú*/9¦#¹¦î8à¤¹ænº(c8àîùë¨yä!¸àfxà¢È‹œš\ÚÎŒHŽˆ”Œ{ï&¹æn¹å'ùcëú ïy )È:jæ8àîùolzgïùn©ˆ:jæ‹œš\ÚÎŒˆŽˆº*ey/¨yíd9§§8à xàê¸à®xà«ú*,yk®y¬-9®¥¸à ykï¹ëe¸à¬øà®xàâ8à¤¹d"8à£øàføài¹b)9¥«xàfxà¢È‹œš\ÚÎŒÈŽˆ¹«¢ùåfxàê¸à®xà«È‹œÜ[Ú[š™XÝ[ÛŽŒHŽˆ”ÔS8à©8àìøà®8à©øà«øà­øàéøàìÈ‹œÜ[Ú[š™XÝ[ÛŽŒˆŽˆ¸àåøàë8àï8à®xàæøàêøàà8à¤¹/oøàhøàgøàäxàêxàèxàï8à¯ùc%¸à«øàª8àêˆ‹œÜ[Ú[š™XÝ[ÛŽŒÈŽˆ¸à¨¸àåøàê¹å*8à¨¸àªøà©¸àìøàâ8àn9oáz) y§ 9l#úfd8àk¹ª*zfd8àh8àdxà¤¹.æ9.#¸àfxà¢È‹žÜÎŒHŽˆ¸à«øàëxà®xà­xà©8àâ8à®xà«øàê¸àåøàá¸à¨øàìøà¬;ï"Ôûï"H‹žÜÎŒˆŽˆ’S8àiùânyb)xàj¹¡#ùdløà¤¹£ xài9¥¡ùkeøà¤º`jyb!øàjøàª8à®xà¬xàï8àåøàfxà¢È‹žÜÎŒÈŽˆ¹ecúhc9¢¥yê/øàk¹a¡yk®xà ze¬º)©ú !xà ze¬º)©øàîùk§ú(c9¦`¹b.øàk¸àëxà¬‹œ\ÜÝÛÜ™ÜÜ˜^NŒHŽˆ¸àäxà®xàëøàï8àâxà®xàåøàë8àï9¥.ù¤ È‹œ\ÜÝÛÜ™ÜÜ˜^NŒˆŽˆ¹§+9.®¹è®º*£xàj:,áù¨/9 áyh,xàk¹/çz+møà yb*yå*9liy«m8àkº*¯ù§îÈ‹œ\ÜÝÛÜ™ÜÜ˜^NŒÈŽˆ“Qxà yo,xàa8àäxà®xàëøàï8àâxàk¹é y«h¸à yål9n.:*£z*/8àk¹æèú)¥ˆ‹\Ø—ÛX[Ø\™NŒHŽˆ¹êëù§*øà¤¹ía9îe8àk¹¢búh!¸àjùo¤øàhøàiºf¥:fè¸àîùh,ydb¸àeøà z*¯ù§îøàfxà¢È‹\Ø—ÛX[Ø\™NŒˆŽˆ¹i%º`ê9j¤¹/døàk¹b*yå*8àêøàï8àêøà¡8àáøàä8à©8à®yb-¹o¨xà¤º*+xàdxà¢È‹\Ø—ÛX[Ø\™NŒÈŽˆ¹ía9îe8àiùk¦¸à xàgùk¢yaj8àj¹©'9§îùä¬9h øàîù¢búh!¸à¤¹b*yå*8àfxà¢È‹™^š[˜][ÛŽŒHŽˆ¹«hùodøàj¹©kybæxàbùè®º*£xàeøài8ài8à yoáz) xàjùoç8àf8ài¸à¨¸à«øà®øà®xà¤¹/çz+møàeøài¸àëxà¬8à¤¹/çyaj8àfxà¢È‹™^š[˜][ÛŽŒˆŽˆº mùbæyi"y¦í8àîú` : møàjùd"8à£øàføàgùª*zfd:)¢ùæí8àeøàj9ål9n.8àj¹i)úaãùcå¹o¥øàk¹æèú)¥ˆ‹™^š[˜][ÛŽŒÈŽˆ¹cå¹o¥øàåxà¨xà©8àêøà y¦`¹b.øà y£©yí¦¹a`øà z.èº` xàîù£ yaî¸àeùab‹˜Üž\×ØÚÚXÙNŒHŽˆ¹alz`&ºcmy¦¥ùcíÈ‹˜Üž\×ØÚÚXÙNŒˆŽˆ¹æî9¢bøàk¹ak:e¢úcmxà¤¹b*yå*8àeøài¹alz`&ºcmxà¤¹/çz+møàfxà¢È‹˜Üž\×ØÚÚXÙNŒÈŽˆ¹ak:e¢úcmy¦¥ùcíøàkºcmzacz` xàk¹b*yà®xàj9alz`&ºcmy¦¥ùcíøàk¹aé¹ä!¹b®yã¡øà¤¹å'øàbøàfH‹œ\ÜÝÛÜ™Ú\ÚŒHŽˆº`jyb!øàj¸àäxà®xàëøàï8àâyå*8àãøààøà­øàéyaé¹ä!¸à¤¹å*8àa8ài¹/çykf8àfxà¢È‹œ\ÜÝÛÜ™Ú\ÚŒˆŽˆ¹d#8àf8àäxà®xàëøàï8àâxàiøà ¹/çykf8àexà£8à¢øàãøààøà­øàéy`)8à¤¹ål8àj¸à¢xàføà¢È‹œ\ÜÝÛÜ™Ú\ÚŒÈŽˆ¹­`yaî¹ëá9fì¸àj8àãøààøà­øàéy¥®yo#øà¤º*ey/¨xàeøà yb*yå*: !y/çz+møà¡9oáz) xàj¸àäxà®xàëøàï8àâyi"y¦í8à¤º`,¸à xà¢È‹œÚYÛ™YÝ\]NŒHŽˆ¹¦í9¥¬8à¤¹k§ú(c8àføàf¸à y«hú)£úacyn ùa`øàj8àåxà¨xà©8àêøà¤¹è®º*£xàfxà¢È‹œÚYÛ™YÝ\]NŒˆŽˆº` y/èz !xàîù/g9¢$: !xàk¹ç'ù«hù )øàj8àáøàï8à¯øàk¹¥.xàe¸à¤ù©'9çéH‹œÚYÛ™YÝ\]NŒÈŽˆ¹ïl¹d#xàkùéæ9káºcmxà y©':*/8àkùak:e¢úcmH‹œ]ÚŒHŽˆºjæ8àa9a*¹ab9n©¸àiùolzgïùè®º*£xàîù/ë¹«høà¤º`,¸à xà¢È‹œ]ÚŒˆŽˆ¹olzgïøàîù.¤¹£æù )øà¤¹è®º*£xàeøà yía9îe8àk¹i"y¦í9¢búh!¸àjùo¤øàhøàiº`jyå*8àfxà¢È‹œ]ÚŒÈŽˆ¸à¨¸à«øà®øà®yb-ºfd8à¡:!!¹o,yªgú ïxàk¹. 9¦`¹`g9«h¸à¤º(c8àa8à y«¢øà¢øàê¸à®xà«øà¤¹ë¨yä!¸àfxà¢ÈŸNÂ˜ÛÛœÝ—ÔÑPÕT’UWÑ’T”ÕÔÕTÐÓÓ•PÕÏ^Èœ\Ú[™ÈŽˆ¸àåxà¨øààøà­øàìøà¬8àjøà¢8à¢ú*£z*/9 áyh,xàk¹ê ùcåˆ‹œ˜[œÛÛ]Ø\™HŽˆ¹¡'ù§äøàc9å¤xà£øà£8à¢Ôøà¤¸àãxààøàâ8àëøàï8à«øàbøà¢zf¥:fè¸àfxà¢È‹˜XØÙ\ÜÈŽˆ¹§ 9l#ùª*zfd8àk¹c§ùbaÈ‹›ÙÜÈŽˆ¹¦k¹«­xàj9ål8àj¸à¢ùg,9gçøàîù¦`ºe¤ùn+øàk¹¢$9b§øàëxà¬8à©8àìøàj9i)úaãøàà8à©¸àìøàëxàï8àâH‹˜Ù\YšXØ]HŽˆ¸à¨¸à«øà®øà®yab8àj:*/9¦#¹¦î8àk¹kïº,hxàc9. :!í8àføàf¸à yç'ù«hù )øà¤¹è®º*£xàiøàcxàj¸àa9â­¹¡bÈ‹œš\ÚÈŽˆ”Œ{ï&¹æn¹å'ùcëú ïy )È:jæ8àîùolzgïùn©ˆ:jæ‹œÜ[Ú[š™XÝ[ÛˆŽˆ”ÔS8à©8àìøà®8à©øà«øà­øàéøàìÈ‹žÜÈŽˆ¸à«øàëxà®xà­xà©8àâ8à®xà«øàê¸àåøàá¸à¨øàìøà¬;ï"Ôûï"H‹œ\ÜÝÛÜ™ÜÜ˜^HŽˆ¸àäxà®xàëøàï8àâxà®xàåøàë8àï9¥.ù¤ È‹\Ø—ÛX[Ø\™HŽˆ¹êëù§*øà¤¹ía9îe8àk¹¢búh!¸àjùo¤øàhøàiºf¥:fè¸àîùh,ydb¸àeøà z*¯ù§îøàfxà¢È‹™^š[˜][ÛˆŽˆ¹«hùodøàj¹©kybæxàbùè®º*£xàeøài8ài8à yoáz) xàjùoç8àf8ài¸à¨¸à«øà®øà®xà¤¹/çz+møàeøài¸àëxà¬8à¤¹/çyaj8àfxà¢È‹˜Üž\×ØÚÚXÙHŽˆ¹alz`&ºcmy¦¥ùcíÈ‹œ\ÜÝÛÜ™Ú\ÚŽˆº`jyb!øàj¸àäxà®xàëøàï8àâyå*8àãøààøà­øàéyaé¹ä!¸à¤¹å*8àa8ài¹/çykf8àfxà¢È‹œÚYÛ™YÝ\]HŽˆ¹¦í9¥¬8à¤¹k§ú(c8àføàf¸à y«hú)£úacyn ùa`øàj8àåxà¨xà©8àêøà¤¹è®º*£xàfxà¢È‹œ]ÚŽˆºjæ8àa9a*¹ab9n©¸àiùolzgïùè®º*£xàîù/ë¹«høà¤º`,¸à xà¢ÈŸNÂ‹ËÈOOOOH‘HUQTÕŒŒÝXš™XÝˆÝ\œ™[\ØÛÜHÙXÝ\š]H™\XÙ[Y[ÈOOOOBŠ

HOˆÂˆÛÛœÝ]Y]IÝŒŒXÝ\œ™[\ØÛÜK\ÙXÝ\š]IÎÂˆÛÛœÝ™\XÙ[Y[Ï^ÂˆÙ\YšXØ]NžÂˆY‰ØÙ\YšXØ]IË]N‰ùaly§"xàåxàªxàêøàà8àk¹ªgùkáº,áù¥¦y¥m9ä!‰ËXÛÛŽ‰ü'åà»î#ÉË]™[‰ùª&y®¥‰ËÛÛ˜Ù\‰ù áyh,z,áùå(ùë¨yä!¸àîùcå¹¢lxàa	Ëˆ\ØÎ‰ùªgùkáº,áù¥¦xàk¹c.¹b!¸àîùë¨yä!º,«9.îøàîøà¨¸à«øà®øà®yëá9fì¸à¤¹è®º*£xàeøà yía9îe8àk¸àêøàï8àêøàjù¬¯øàhøài¹¢lxàa8ào¸àfxà ‰Ëˆ[˜ÚY[žÝ]N‰ùaly§"xàåxàªxàêøàà8àjùë¨yä!º !y.#y¦#¸àk¹ªgùkáº,áù¥¦IË˜YÙN‰ù áyh,z,áùå(ùë¨yä!‰ËXÛÛŽ‰ü'äàIË^‰ú`ê:e 8àk¹aly§"xàåxàªxàêøàà8à¤¹¥m9ä!¸àeøàgøàj8àdøà£xà xà#9é/¹i%¹éæ8à#xàj:(j9é.¸àexà£8àgùidyí!:,áù¥¦xàc:)¢øài8àbøà¢¸ào¸àeøàgøà º,áù¥¦xàk¹ë¨yä!º,«9.îú !xàkú*&:c,¸àexà£8ài¸àb¸à¢xàf¸à z`ê:e 8àk¹aj9dèxàc:e¬º)©øàiøàcxà¢ùâ­¹¡bøàiøàfxà ‰ßKˆ]šY[˜ÙN–ÂˆÚXÛÛŽ‰ü'ãíûî#ÉË^‰ú,áù¥¦xàjøàkøà#9é/¹i%¹éæ8à#xàkº(j9é.¸àc8à`¸à¢ÉßKˆÚXÛÛŽ‰ü'äiIË^‰ùaly§"xàåxàªxàêøàà8àkú`ê:e 8àk¹aj9dèxàc:e¬º)©ùcëú ïIßKˆÚXÛÛŽ‰ø§dÉË^‰ùë¨yä!º,«9.îú !xàj9/çykf9§'úfd8àkº*&:c,¸àc:)¢ùodøàgøà¢xàj¸àa	ßBˆKˆÝ\Î–ÂˆÜN‰ù§ 9b'xàjùè®º*£xàfxà¢ù.¢úh!xàj8àeøài¹§ 8à º`jyb!øàj¸àk¸àkûï'ÉËÜ[ÛœÎ–Éú,áù¥¦xàk¸àåxà¨xà©8àêùoh¹o#øàj9d":*"9k®zaãøà¤¹è®º*£xàfxà¢ÉË	ùaly§"xàåxàªxàêøàà8àbøà¢z,áù¥¦xà¤¹æí8àhxàjùbbºfi8àeøà yo£8àbøà¢yë¨yä!º,«9.îú !xà¤¹£¨¸àfIË	ù áyh,z,áùå(øàk¹ë¨yä!º,«9.îú !xà yªgùká¹c.¹b!¸à y©kybæy."¹oáz) xàj¹b*yå*: !xà¤¹è®º*£xàfxà¢ÉË	øàåxàªxàêøàà9d#xà¤¹i"y¦í8àeøà z`ê:e 9aj9dèxàc9o%xàcyí¦¸àcze¬º)©øàiøàcxà¢øà¢8àa¸àjøàfxà¢É×KNŒ‹[‰ùªgùkáº,áù¥¦xà¤º*¬8àc8à xàjxàk¹c.¹b!¸àiøà z*¬8àjù/oøà£øàføà¢øàbøà¤¹¥m9ä!¸àeøào¸àfxà ‰Ë^Z[Ž‰ù áyh,z,áùå(øàkøà xào¸àf¹ë¨yä!º,«9.îøàj9ªgùká¹c.¹b!¸à yb*yå*8àfxà¢ùoáz) xàc8à`¸à¢ùëá9fì¸à¤¹¦#¹è®¸àjøàeøài¸àbøà¢xà y/çyë¨xà¡8à¨¸à«øà®øà®xàk¹¥®y¬åxà¤¹¬n¸à xào¸àfxà ‰ßKˆÜN‰ùè®º*£yo£8àk¹ë¨yä!¹¥®y¬åxàj8àeøài¹§ 8à º`jyb!øàj¸àk¸àkûï'ÉËÜ[ÛœÎ–Éùb*yå*:h.ùn©¸àc9/c¸àa:,áù¥¦xàh8àdxà¨¸à«øà®øà®yª*xà¤¹c¬øàeøàcøàfxà¢ÉË	ú`ê:e 9a¡xàk¹b*y/¯ù )øà¤¹a*¹ab8àeøà yªgùká¹c.¹b!¸àjøàbøàbøà£øà¢xàf¹d#8àf9ª*zfd8àjøàfxà¢ÉË	ùªgùká¹c.¹b!¸àjùoç8àf8àgøà¨¸à«øà®øà®yª*xàj9/çyë¨yh-9¢`8à¤¹k¦¸à xà yk¦¹§'ùæ¡8àjú)¢ùæí8àfIË	ú,áù¥¦xàk¸à¬øàå8àï9¥l8à¤¹®&øà¢xàføàl8à¨¸à«øà®øà®yª*xàkº)¢ùæí8àeøàkù.#z) xàj8àfxà¢É×KNŒ‹[‰ùªgùká¹ )øàjùoç8àf8àgù/çyë¨xàj8à yoáz) y§ 9l#úfd8àk¹b*yå*9ëá9fì¸à¤º  øàb8ào¸àfxà ‰Ë^Z[Ž‰ùªgùká¹c.¹b!¸àjùoç8àf8ài¹/çyë¨yh-9¢`8àj8à¨¸à«øà®øà®yª*xà¤º*+yk¦¸àeøà y©kybæxà¡9¢áyodú !xàk¹i"yc%¸àjùd"8à£øàføài¹k¦¹§'ùæ¡8àjú)¢ùæí8àfxàdøàj8àc:aãz) xàiøàfxà ‰ßKˆÜN‰ù/çykf9§'úfd8à¤º`c¸àc¸àgùªgùkáº,áù¥¦xàk¹¢lxàa8àj8àeøài¹§ 8à º`jyb!øàj¸àk¸àkûï'ÉËÜ[ÛœÎ–Éù`"ù.®¸àk¹b)9¥«xàiú`&¹n.8àk¸àe8àoøàj8àeøài¹nàù¨á8àfxà¢ÉË	ùoíxàk¸àgøà y§'úfd8à¤¹k¦¸à xàf¹aly§"xàåxàªxàêøàà8àn9«¢øàfIË	øàåxà¨xà©8àêùd#xà¤¹©kybæyå*8àjùi"y¦í8àeøà yaly§"xàåxàªxàêøàà8àiùí¦yí¦¹/çyë¨xàfxà¢ÉË	ùía9îe8àk¹¢búh!¸àjùo¤øàhøài¹nàù¨á8à¤¹¢oú*£xàîú*&:c,¸àeøà yoªya`øàexà£8àjøàcøàa9¥®y¬åxàiùaé¹b!¸àfxà¢É×KNŒË[‰ùnàù¨á9¦`¸àjøà ¹ªgùká¹ áyh,xàc9¯#øà£8àj¸àa9ë¨yä!¸àc9oáz) xàiøàfxà ‰Ë^Z[Ž‰ù/çykf9§'úfd8à¤º`c¸àc¸àgùªgùkáº,áù¥¦xàkøà yía9îe8àk¹k¦¸à xàgù¢oú*£xàîú*&:c,¸àîùnàù¨á9¥®y¬åxàjùo¤øàa8à y áyh,xàc9oªya`øàexà£8àjøàcøàa9oh¸àiùaé¹b!¸àeøào¸àfxà ‰ßBˆKˆÝ[[X\žN‰ù áyh,z,áùå(øàkùë¨yä!º,«9.îøàîùªgùká¹c.¹b!¸àîùb*yå*9ëá9fì¸à¤¹¦#¹è®¸àjøàeøà yc.¹b!¸àjùoç8àf8àgøà¨¸à«øà®øà®yë¨yä!¸àj:`jyb!øàj¹nàù¨á8ào¸àiù. :,ªøàeøài¹ë¨yä!¸àfxà¢øà ‰Ë]X[]P]Y]˜]Y]ˆKˆÜž\×ØÚÚXÙNžÂˆY‰ØÜž\×ØÚÚXÙIË]N‰ùiå:*%ùí`¹.¡¹o£8àjù«¢øàhøàgøà¨¸à«øà®øà®yª*IËXÛÛŽ‰ü'äi	Ë]™[‰ùª&y®¥‰ËÛÛ˜Ù\‰øà¨¸àªøà©¸àìøàâ8àêxà©8àåxà­xà©8à«øàêøàîøà¨¸à«øà®øà®yë¨yä!‰Ëˆ\ØÎ‰ùidyí!9í`¹.¡¸à¡9¢áyodùi"y¦í8àjùd"8à£øàføài¸à y.#z) xàjøàj¸àhøàgùª*zfd8à¤¹è®¹k§øàjú)¢ùæí8àfy­`xà£8à¤¹b)9¥«xàeøào¸àfxà ‰Ëˆ[˜ÚY[žÝ]N‰ùiå:*%ù/g9©kyí`¹.¡¹o£8à ¸à­øà®xàá¸àè8àn8àëxà¬8à©8àìùcëú ïIË˜YÙN‰øà¨¸à«øà®øà®yª*IËXÛÛŽ‰ü'å$IË^‰ùi%º`ê9iå:*%ùab8àk¹¢áyodú !P¸àkùab:`,xàiù/g9©kyidyí!8à¤¹í`¹.¡¸àeøào¸àeøàgøà ¸àeøàbøàeù¨æ¹cn8àeøàiøà P¸àk¸à¨¸àªøà©¸àìøàâ8àc9§"yb®xàj¸ào¸ào¹«¢øà¢¸à y©kybæxà­øà®xàá¸àè8àn8àëxà¬8à©8àìøàiøàcxà¢øàdøàj8àc9b!¸àbøà¢¸ào¸àeøàgøà ‰ßKˆ]šY[˜ÙN–ÂˆÚXÛÛŽ‰ü'äáIË^‰ùiå:*%ùidyí!8àkùab:`,yí`¹.¡‰ßKˆÚXÛÛŽ‰ü'å$ÉË^‰ù¢áyodú !P¸àk¸à¨¸àªøà©¸àìøàâ8àkùãï¹g*8à ¹§"yb®IßKˆÚXÛÛŽ‰ü'éï‰Ë^‰ùidyí!9í`¹.¡¹¦`¸àk¹ª*zfd9bbºfi:*&:c,¸àc8àj¸àa	ßBˆKˆÝ\Î–ÂˆÜN‰ù§ 8à ¹ecúhc8àj8àj¸à¢ùâ­¹¡bøàkøàjxà£8àbøà ‰ËÜ[ÛœÎ–Éùidyí!9í`¹.¡¹o£8à ¹æèù§îøàëxà¬8àc9/çykf8àexà£8ài¸àa8à¢øàdøàj	Ë	ùidyí!9í`¹.¡¹¥éxàc9.®¹.¢øàîùidyí!9cì9n,øàjú*&:c,¸àexà£8ài¸àa8à¢øàdøàj	Ë	øà¨¸àªøà©¸àìøàâ9d#xàjùiå:*%ùab8àk¹/&¹é/¹d#xàc9d*øào¸à£8ài¸àa8à¢øàdøàj	Ë	ùidyí!9í`¹.¡¹o£8à ¹©kybæy."¹.#z) xàj¸à¨¸à«øà®øà®yª*xàc9«¢øàhøài¸àa8à¢øàdøàj	×KNŒË[‰ùãï¹g*8àgxàk¹.®¸àjù©kybæy."¸àk¹b*yå*9oáz) y )øàc8à`¸à¢øàbøà¤º  øàb8ào¸àfxà ‰Ë^Z[Ž‰ùidyí!8àc9í`¹.¡¸àeøàgùb*yå*: !xàjù.#z) xàj¹ª*zfd8àc9«¢øà¢øàj8à y.#y«hùb*yå*8à¡:*©9¤ãy/g8àjøài8àj¸àc8à¢øàgøà xà xà¨¸à«øà®øà®yª*xàk¸àêxà©8àåxà­xà©8à«øàêùë¨yä!¹."¸àk¹ecúhc8àiøàfxà ‰ßKˆÜN‰ùæí8àhxàjú(c8àa¹kï¹oç8àj8àeøài¹§ 8à º`jyb!øàj¸àk¸àkûï'ÉËÜ[ÛœÎ–Éù«(yfç¸àk¹k¦¹§'ù¨æ¹cn8àeøào¸àiøà¨¸àªøà©¸àìøàâ8à¤¹«¢øàeøà yæèú)¥¸àëxà¬8à¤º/ïyb¨8àiú*&:c,¸àfxà¢ÉË	ùidyí!9í`¹.¡º !xàk¸à¨¸àªøà©¸àìøàâ8àn9¥¬8àeøàa8àäxà®xàëøàï8àâxà¤º*+yk¦¸àeøà yb*yå*9â­¹¬àxà¤¹è®º*£xàfxà¢ÉË	ùd#8àf9iå:*%ù/&¹é/¸àk¹b)y¢áyodú !xàn8à¨¸àªøà©¸àìøàâ8à¤¹o%xàcyí¦xàd	Ë	ùidyí!9í`¹.¡¸à¤¹è®º*£xàeøài¹.#z) xàj¹ª*zfd8à¤¹á(yb®yc%¸àeøà yoáz) xàjº*¯ù§îú*&:c,¸à¤¹«¢øàfI×KNŒË[‰ù.#z) xàj¹b*yå*9íc:-ëøà¤¹«h¸à xà yo£8àbøà¢yè®º*£xàiøàcxà¢ú*&:c,¸à ¹«¢øàeøào¸àfxà ‰Ë^Z[Ž‰ùidyí!9í`¹.¡¸àc9è®º*£xàiøàcxàgøà¨¸àªøà©¸àìøàâ8àkù.#z) xàj¸à¨¸à«øà®øà®xà¤¹«h¸à xà yoáz) xàjùoç8àf8ài¹b*yå*9liy«m8à¤¹è®º*£xàeøà ykï¹oç:*&:c,¸à¤¹«¢øàeøào¸àfxà ‰ßKˆÜN‰ùa£yænºf,¹«h¸àj8àeøài¹§ 8à ¹§"yb®xàj¸àk¸àkûï'ÉËÜ[ÛœÎ–Éøà¨¸àªøà©¸àìøàâ9d#xà¤ºemøàcøàeøài¹£ª9®+8àeøàjøàcøàcøàfxà¢ÉË	øàëxà¬8à©8àìùå.úgh¸àkº(j9é.¸à¤¹k¦¹§'ùæ¡8àjùi"y¦í8àfxà¢ÉË	ùidyí!9í`¹.¡¸à¡9ål9båxà¤¹ª*zfd:)¢ùæí8àeøàk¹idyªgøàj8àeøài¹¢búh!¹c%¸àeøà yk¦¹§'ù¨æ¹cn8àeøàiùbbºfi9¯#øà£8à¤¹è®º*£xàfxà¢ÉË	ùiå:*%ùab8àk¹b*yå*: !xàjøài8àa8ài¹idyí!9§'úe¤øàj8àëxà¬8à©8àìùliy«m8à¤¹. :)©ùc%¸àeøà yë¨yä!º !xàc9/çyë¨xàfxà¢É×KNŒ‹[‰ù.®¸àk¹â­¹¡bøàc9i"xà£øàhøàgù¦`¸àjùª*zfd8à º`(ùbåxàeøài¹i"xà£øà¢ù.åyía8àoøà¤º  øàb8ào¸àfxà ‰Ë^Z[Ž‰ùidyí!9í`¹.¡¸à¡9ål9båxà¤¹ª*zfd9i"y¦í8àk¸àcxàhøàbøàdxàj8àeøài¹¢búh!¹c%¸àeøà yk¦¹§'ù¨æ¹cn8àeøàiù¯#øà£8à¤¹©'9aî¸àfxà¢øàdøàj8àiøà y.#z) xàj¹ª*zfd8àk¹«¢ùkf8à¤ºf,¸àc¸à¡8àfxàcøàj¸à¢¸ào¸àfxà ‰ßBˆKˆÝ[[X\žN‰ùb*yå*: !xàk¹idyí!8àîù¢`9lg¸àîú mùbæxàk¹i"yc%¸àjùd"8à£øàføài¹ª*zfd8à¤¹á(yb®yc%¸àîùi"y¦í8àeøà y¨æ¹cn8àeøàiù¯#øà£8à¤¹è®º*£xàfxà¢øà ‰Ë]X[]P]Y]˜]Y]ˆKˆ\ÜÝÛÜ™Ú\ÚžÂˆY‰Ü\ÜÝÛÜ™Ú\Ú	Ë]N‰ùgíùbæyk©8àjù«¢øàexà£8àgùªgùkáº,áù¥¦IËXÛÛŽ‰ü'åá;î#ÉË]™[‰ùgî¹é#‰ËÛÛ˜Ù\‰ùâjyä!¹æ¡8à®øà«xàéxàê¸àá¸à¨øàîùªgùkáº,áù¥¦yë¨yä!‰Ëˆ\ØÎ‰ù§iz**º !xàc8àa8à¢ùgíùbæyä¬9h øàiøà yå.úgh¸àîùí&z,áù¥¦xàîù£ yaî¸àeøà¤¸àjxàk¸à¢8àa¸àjùë¨yä!¸àfxà¢øàbú  øàb8ào¸àfxà ‰Ëˆ[˜ÚY[žÝ]N‰ù§iz**º !ykï¹oç9o£8àjùªgùkáº,áù¥¦xàk¹¥/¹ïk¸à¤¹ænº)¢ÉË˜YÙN‰ùâjyä!¸à®øà«xàéxàê¸àá¸à¨ÉËXÛÛŽ‰ü'ãè‰Ë^‰ùcå¹o%yab8àk¹§iz**º !xà¤¹/&º+l9k©8àn9¨b9a¡xàeøàgùo£8à yalyå*8àåøàê¸àìøà¯øàjúhiùk¨¹ áyh,xà¤¹d*øà 9cl9b-ùâjxàc9«¢øà¢¸à z/äxàcøàk”øà ¹å.úgh¸à¤º(j9é.¸àeøàgøào¸àoºfè¹n+xàeøài¸àa8à¢øàdøàj8àjù¬%ù.æ8àcxào¸àeøàgøà ‰ßKˆ]šY[˜ÙN–ÂˆÚXÛÛŽ‰ü'åª;î#ÉË^‰ùalyå*8àåøàê¸àìøà¯øàjúhiùk¨¹ áyh,xàk¹cl9b-ùâjxàc9«¢øàhøài¸àa8à¢ÉßKˆÚXÛÛŽ‰ü'å©{î#ÉË^‰úfè¹n+y.+xàk”ùå.úgh¸àjù©kybæy áyh,xàc:(j9é.¸àexà£8ài¸àa8à¢ÉßKˆÚXÛÛŽ‰ü'æ­‰Ë^‰ù§iz**º !xàc:`&¸à¢ùcëú ïy )øàk¸à`¸à¢ùc.¹gçøàjú/äxàa	ßBˆKˆÝ\Î–ÂˆÜN‰ù§ 9b'xàk¹kï¹oç8àj8àeøài¹§ 8à º`jyb!øàj¸àk¸àkûï'ÉËÜ[ÛœÎ–Éù§iz**º !xàc9n,8à¢øào¸àiøàgxàk¸ào¸ào¸àjøàeøà yo£8àiù¢áyodú !xàn9/'xàb8à¢ÉË	ùcl9b-ùâjxà¤¹fç¹cã¸àeøà zfè¹n+y.+xàk”øà¤¸àëxààøà«øàfxà¢ÉË	øàåøàê¸àìøà¯øàkºfîù®¤8à¤¹`g9«h¸àeøài¸à ycl9b-ùâjxàk¹¢áyodú !xàn:`(ùíhxàfxà¢ÉË	ù§iz**º !xàk¹båyíæ¸à¤¹è®º*£xàeøài¸à z,áù¥¦xàk¹fç¹cã¹¢áyodøà¤¹¬n¸à xà¢É×KNŒK[‰ù.â¸àfxàd:)¢øà¢xà£8à¢ùâ­¹¡bøàjøàj¸àhøài¸àa8à¢ù áyh,xà¤¹/çz+møàeøào¸àfxà ‰Ë^Z[Ž‰ùí&z,áù¥¦xàk¹¥/¹ïk¸àj9å.úgh¸àkº(j9é.¸àkøà xàjxàhxà¢xà ¹ë+9."z !xàbøà¢z)¢øà¢xà£8à¢øàê¸à®xà«øàc8à`¸à¢øàgøà xà xào¸àfº,áù¥¦xà¤¹fç¹cã¸àeùå.úgh¸à¤¸àëxààøà«øàeøào¸àfxà ‰ßKˆÜN‰ù¥éyn.9æ¡8àj¹kï¹ëe¸àj8àeøài¹§ 8à º`jyb!øàj¸àk¸àkûï'ÉËÜ[ÛœÎ–Éùªgùkáº,áù¥¦xàkù§.¸àk¹."¸àjøào¸àj8à xài¹ïk¸àcxà y¢`9g*8àh8àdyb!¸àbøà¢øà¢8àa¸àjøàfxà¢ÉË	úfè¹n+y¦`¸àk¹å.úgh¸àëxààøà«øàj8à yí&z,áù¥¦xàk¹fç¹cã¸àîù¥¯zc(9/çyë¨xà¤¹o®yn¥xàfxà¢ÉË	ù§iz**º !xàc8àa8à¢ù¥éxàkùªgùkáº,áù¥¦xàk¹b*yå*:*&:c,¸à¤¹b)xàjù/g9¢$8àfxà¢ÉË	øàåøàê¸àìøà¯ùdj:/®¸àk¹b*yå*:*&:c,¸à¤¹«¢øàeøà y¢áyodú !xàc:`,y§*øàjùè®º*£xàfxà¢É×KNŒK[‰ù.®¸àc:fè¸à£8àgù¦`¸àjøà ¹ áyh,xàc:g,¹aî¸àeøàj¸àa9â­¹¡bøà¤¹/g8à¢¸ào¸àfxà ‰Ë^Z[Ž‰úfè¹n+y¦`¸àk¹å.úgh¸àëxààøà«øà¡9í&z,áù¥¦xàk¹fç¹cã¸àîù¥¯zc(9/çyë¨xàj¸àjxà y¥éyn.8àkº`bùå*8àiù áyh,xà¤º)¢øà¢xà£8àjøàcøàcøàfxà¢øàdøàj8àc9gî¹§+8àiøàfxà ‰ßKˆÜN‰ùªgùkáº,áù¥¦xà¤¹é/¹i%¸àn9£ xàhyaî¸àfyoáz) xàc8à`¸à¢ùh-9d"8àkº  øàb9¥®xàj8àeøàiº`jyb!øàj¸àk¸àkûï'ÉËÜ[ÛœÎ–Éù©kybæyæë¹æ¡8àj9£ yaî¸àeùab8à¤º*&:c,¸àeøà y¢áyodú !xàk¹b)9¥«xàiù£ xàhyaî¸àfIË	ú,áù¥¦xà¤¹l yëd¸àjùaixà£8à y£ yaî¸àeùab8àj:/å9cm9.¢9k¦¹¥éxà¤º*&:c,¸àfxà¢ÉË	ùía9îe8àk¹£ yaî¸àeøàêøàï8àêøàjùo¤øàhøài¹¢oú*£xàj:*&:c,¸à¤º(c8àa8à yoáz) xàj¹ëá9fì¸àh8àdy¢lxàa‰Ë	ùí&z,áù¥¦xàkù¢áyodú !xàc9£ yaî¸àeùab8à¤º*&:c,¸àeøà y¢oú*£xàkùn,9é/¹o£8àjøào¸àj8à xài¹cåøàdxà¢É×KNŒ‹[‰ùj¤¹/døàc9í&xàiøà ¸à yªgùká¹ áyh,xàiøà`¸à¢øàdøàj8àkùi"xà£øà¢¸ào¸àføà¤øà ‰Ë^Z[Ž‰ùªgùká¹ áyh,xàk¹£ yaî¸àeøàkùj¤¹/døàjøàbøàbøà£øà¢xàf¸à yía9îe8àk¹¢oú*£xà¡:*&:c,¸àj¸àjxàk¹¢búh!¸àjùo¤øàa8à yoáz) y§ 9l#úfd8àk¹ëá9fì¸àiù¢lxàa8ào¸àfxà ‰ßBˆKˆÝ[[X\žN‰ùå.úgh¸à¡9í&z,áù¥¦xàkºg,¹aî¸à¤ºf,¸àc¸à yªgùká¹ áyh,xàk¹/çyë¨xàîù£ yaî¸àeøà¤¹ía9îe8àk¸àêøàï8àêøàjùo¤øàhøài¹ë¨yä!¸àfxà¢øà ‰Ë]X[]P]Y]˜]Y]ˆKˆÚYÛ™YÝ\]NžÂˆY‰ÜÚYÛ™YÝ\]IË]N‰ù.#ykêxàjº`&¹/èxà¤¹©'9çéxàeøàgùêëù§*øàk¹b'ybåIËXÛÛŽ‰ü'æª	Ë]™[‰ùª&y®¥‰ËÛÛ˜Ù\‰øà©8àìøà­øàáøàìøàâ9kï¹oç8àîú*/9¢è9/çyaj	Ëˆ\ØÎ‰øà®øà«xàéxàê¸àá¸à¨ù.¢ù¥axàc9å¤xà£øà£8à¢ù¦`¸àjøà z(ªùk¬ù¢èyi)úf,¹«h¸àj9.¢ùk§ùè®º*£xà¤¹.(yêâøàfxà¢ùb'ybåxà¤¹b)9¥«xàeøào¸àfxà ‰Ëˆ[˜ÚY[žÝ]N‰ù©kybæyêëù§*øàbøà¢yi)úaãøàk¹.#ykêz`&¹/èxà¤¹©'9çéIË˜YÙN‰øà©8àìøà­øàáøàìøàâ9kï¹oç	ËXÛÛŽ‰ü'å©{î#ÉË^‰ùæèú)¥¹¢áyodøàc8à xà`¸à¢ù©kybæyêëù§*øàbøà¢y­ìyi'8àjùi)úaãøàk¹i%º`ê:`&¹/èxàc9æn¹å'øàeøài¸àa8à¢øàdøàj8à¤¹©'9çéxàeøào¸àeøàgøà ¹b*yå*: !xàkøàgxàk¹¦`ºe¤ùn+øàjùêëù§*øà¤¹/oøàhøài¸àa8àj¸àa8àj9fç¹ëe8àeøài¸àa8ào¸àfxà ‰ßKˆ]šY[˜ÙN–ÂˆÚXÛÛŽ‰ü'åd‰Ë^‰ù­ìyi'8àjú`&¹n.8àj8àkùål8àj¸à¢ùi)úaãú`&¹/èIßKˆÚXÛÛŽ‰ü'äi	Ë^‰ùb*yå*: !xàkú*l¹odù¦`ºe¤ùn+øàk¹¤ãy/g8à¤¹d)¹k¦‰ßKˆÚXÛÛŽ‰ü'éï‰Ë^‰ú`&¹/èxàëxà¬8àj:*£z*/8àëxà¬8àc9/çykf8àexà£8ài¸àa8à¢ÉßBˆKˆÝ\Î–ÂˆÜN‰ùb'ybåxàj8àeøài¹§ 8à º`jyb!øàj¸àk¸àkûï'ÉËÜ[ÛœÎ–Éùía9îe8àk¸à©8àìøà­øàáøàìøàâ9¢búh!¸àjùo¤øàhøài¹h,ydb¸àîúf¥:fè¸àeøà yoáz) xàjº*/9¢è8à¤¹/çyaj8àfxà¢ÉË	ùêëù§*øà¤¸àãxààøàâ8àëøàï8à«øàbøà¢yb!øà¢ºfè¸àeøài¹a£z-mùbåxàeøà yb*yå*: !xàjùâ­¹¬àxà¤¹è®º*£xàfxà¢ÉË	ùêëù§*øàk¹b*yå*8à¤¹í¦yí¦¸àeøàj¸àc8à¢z`&¹/èxàëxà¬8à¤¹cãºfá¸àeøà yïã9e­¹©ky¥éxàjù¢áyodú`ê9ïl¸àn9h,ydb¸àfxà¢ÉË	ùi%º`ê:`&¹/èyab8àn8àk¹£©yí¦¸à¤º`k¹¥«xàeøài¹êëù§*øà¤¹í¦yí¦¹b*yå*8àeøà z*¯ù§îùíd9§§8à¤¹ïã9e­¹©ky¥éxàjùh,ydb¸àfxà¢É×KNŒ[‰ú(ªùk¬ù¢èyi)øà¤¹¢¤xàb8àj¸àc8à¢xà yo£8àkº*¯ù§îøàjùoáz) xàj¹ áyh,xà ¹«¢øàeøào¸àfxà ‰Ë^Z[Ž‰øà©8àìøà­øàáøàìøàâ8àc9å¤xà£øà£8à¢ùh-9d"8àkøà yk¦¸à xà¢xà£8àgù¢búh!¸àiùh,ydb¸àîúf¥:fè¸àeøà yc§ùfè8à¡9olzgïùëá9fì¸à¤º*¯øànxà¢øàgøà xàk¸àëxà¬8àj¸àjxà¤¹/çyaj8àeøào¸àfxà ‰ßKˆÜN‰ùolzgïùëá9fì¸à¤º*¯øànxà¢øàgøà ya*¹ab8àeøài¹è®º*£xàfxà¢ù áyh,xàk¹ía9d"8àføàkûï'ÉËÜ[ÛœÎ–Éùêëù§*øàkº,áùå(ùåj¹cíøà z*+yïkº`ê9ïl¸à z`&¹n.8àk¹b*yå*9¦`ºe¤ùn+ÉË	ùêëù§*øàk“Ôù¦í9¥¬9¥éxà yl#¹aiy¦`¹§'øà z`&¹n.8àk¹£©yí¦¹ab9. :)©ÉË	ú`&¹/èyab8àîù¦`¹b.øà z*£z*/9liy«m8à yk§ú(c8àexà£8àgùaé¹ä!¸à¡:e¨º`(ùêëù§*øàk¸àëxà¬	Ë	ùb*yå*: !xàk¹¢`9lg¸à z mùbæxà z`&¹n.9b*yå*8àfxà¢ù©kybæxà­øà®xàá¸àè9. :)©É×KNŒ‹[‰ù/exàc8à xàa8ài8à xàjxàdøàn:(c8à£øà£8àgøàbøà¤¹¦`¹ìîùb%øàiú/ïxàb8à¢ù áyh,xà¤º`n8àløào¸àfxà ‰Ë^Z[Ž‰ú`&¹/èyab8à¡9¦`¹b.øà z*£z*/9liy«m8à yêëù§*øàîùdj:/®¸à­øà®xàá¸àè8àk¸àëxà¬8à¤¹ê xàcyd"8à£øàføà¢øàdøàj8àiøà y/­yk¬øàk¹ëá9fì¸àj9íc:-ëøà¤º*¯øànxà¡8àfxàcøàj¸à¢¸ào¸àfxà ‰ßKˆÜN‰ùl xàf:/¯8à yo£8àk¹kï¹oç8àj8àeøài¹§ 8à º`jyb!øàj¸àk¸àkûï'ÉËÜ[ÛœÎ–Éùkïº,hyêëù§*øà¤¹©kybæxàãxààøàâ8àëøàï8à«øàn9¢.øàeøà y. 9k¦¹§'úe¤øàk¹æèú)¥¸à¤¹í¦¸àdxà¢ÉË	ùolzgïøàc9å¤xà£øà£8àgøà­øà®xàá¸àè8à¤¹`g9«h¸àeøàgùâ­¹¡bøàiøà ze¨¹/àº`ê9ïl¸àn9â­¹¬àxà¤¹aly§"xàfxà¢ÉË	ùb*yå*: !xàk¸àäxà®xàëøàï8àâxà¤¹i"y¦í8àeøà z`&¹n.8àk¸à©¸à©8àêøà®xà®xà«xàèøàìùíd9§§8à¤¸à ¸àhøài¹oªy¥éùb)9¥«xàfxà¢ÉË	ùc§ùfè8àj9olzgïùëá9fì¸à¤¹è®º*£xàeøài¸àbøà¢yk¢yaj8àj¹oªy¥éøà¤º(c8àa8à ya£yænºf,¹«h¹ëe¸ào¸àiùk§ù¥¯xàfxà¢É×KNŒË[‰ùb'ybåxàh8àdxàiøàj¸àcøà yc§ùfè:fi9c®øàj9k¢yaj8àj¹oªy¥éøào¸àiøài8àj¸àd¸ào¸àfxà ‰Ë^Z[Ž‰ùl xàf:/¯8à yo£8àkùc§ùfè8àîùolzgïùëá9fì¸à¤¹è®º*£xàeøà z!!yj xàkºfi9c®øà yk¢yaj8àj¹oªy¥éøà yoáz) xàj¹a£yænºf,¹«h¹ëe¸ào¸àiù. :`(øàk¸à©8àìøà­øàáøàìøàâ9kï¹oç8àj8àeøàiº`,¸à xào¸àfxà ‰ßBˆKˆÝ[[X\žN‰ùå¤xà£øàeøàa9.¢ú,hxàkù¢búh!¸àjùo¤øàhøài¹h,ydb¸àîúf¥:fè¸àîú*/9¢è9/çyaj8àeøà z*¯ù§îøàbøà¢yoªy¥éøàîùa£yænºf,¹«h¸ào¸àiù¦`¹ìîùb%øàiùë¨yä!¸àfxà¢øà ‰Ë]X[]P]Y]˜]Y]ˆBˆNÂˆÛÛœÝÛÛ˜XÝ^ÂˆÙ\YšXØ]N–Éù áyh,z,áùå(øàk¹ë¨yä!º,«9.îú !xà yªgùká¹c.¹b!¸à y©kybæy."¹oáz) xàj¹b*yå*: !xà¤¹è®º*£xàfxà¢ÉË	ùªgùká¹c.¹b!¸àjùoç8àf8àgøà¨¸à«øà®øà®yª*xàj9/çyë¨yh-9¢`8à¤¹k¦¸à xà yk¦¹§'ùæ¡8àjú)¢ùæí8àfIË	ùía9îe8àk¹¢búh!¸àjùo¤øàhøài¹nàù¨á8à¤¹¢oú*£xàîú*&:c,¸àeøà yoªya`øàexà£8àjøàcøàa9¥®y¬åxàiùaé¹b!¸àfxà¢É×KˆÜž\×ØÚÚXÙN–Éùidyí!9í`¹.¡¹o£8à ¹©kybæy."¹.#z) xàj¸à¨¸à«øà®øà®yª*xàc9«¢øàhøài¸àa8à¢øàdøàj	Ë	ùidyí!9í`¹.¡¸à¤¹è®º*£xàeøài¹.#z) xàj¹ª*zfd8à¤¹á(yb®yc%¸àeøà yoáz) xàjº*¯ù§îú*&:c,¸à¤¹«¢øàfIË	ùidyí!9í`¹.¡¸à¡9ål9båxà¤¹ª*zfd:)¢ùæí8àeøàk¹idyªgøàj8àeøài¹¢búh!¹c%¸àeøà yk¦¹§'ù¨æ¹cn8àeøàiùbbºfi9¯#øà£8à¤¹è®º*£xàfxà¢É×Kˆ\ÜÝÛÜ™Ú\Ú–Éùcl9b-ùâjxà¤¹fç¹cã¸àeøà zfè¹n+y.+xàk”øà¤¸àëxààøà«øàfxà¢ÉË	úfè¹n+y¦`¸àk¹å.úgh¸àëxààøà«øàj8à yí&z,áù¥¦xàk¹fç¹cã¸àîù¥¯zc(9/çyë¨xà¤¹o®yn¥xàfxà¢ÉË	ùía9îe8àk¹£ yaî¸àeøàêøàï8àêøàjùo¤øàhøài¹¢oú*£xàj:*&:c,¸à¤º(c8àa8à yoáz) xàj¹ëá9fì¸àh8àdy¢lxàa‰×KˆÚYÛ™YÝ\]N–Éùía9îe8àk¸à©8àìøà­øàáøàìøàâ9¢búh!¸àjùo¤øàhøài¹h,ydb¸àîúf¥:fè¸àeøà yoáz) xàjº*/9¢è8à¤¹/çyaj8àfxà¢ÉË	ú`&¹/èyab8àîù¦`¹b.øà z*£z*/9liy«m8à yk§ú(c8àexà£8àgùaé¹ä!¸à¡:e¨º`(ùêëù§*øàk¸àëxà¬	Ë	ùc§ùfè8àj9olzgïùëá9fì¸à¤¹è®º*£xàeøài¸àbøà¢yk¢yaj8àj¹oªy¥éøà¤º(c8àa8à ya£yænºf,¹«h¹ëe¸ào¸àiùk§ù¥¯xàfxà¢É×BˆNÂˆØš™XÝ™[šY\Ê™\XÙ[Y[ÊK™›Ü‘XXÚ

ÚY™\XÙ[Y[JOOžÂˆÛÛœÝ[™^TÑPÕT’UWÔÐÑST’SÔË™š[™[™^
ÏOœËšYOOZY
NÂˆYŠ[™^
H›ÝÈ™]È\œ›ÜŠ	Ñ‘HUQTÕŒŒÙXÝ\š]HØÙ[˜\š[ÈZ\ÜÚ[™Îˆ	ÊÚY
NÂˆYŠÑPÕT’UWÔÐÑST’SÔÖÚ[™^K›]™[OO\™\XÙ[Y[›]™[
H›ÝÈ™]È\œ›ÜŠ	Ñ‘HUQTÕŒŒÙXÝ\š]H]™[šYˆ	ÊÚY
NÂˆÑPÕT’UWÔÐÑST’SÔÖÚ[™^O\™\XÙ[Y[ÂˆÛÛ˜XÝÚYK™›Ü‘XXÚ

[œÝÙ\‹JOOžÐ—ÔÑPÕT’UWÔÕTÐÓÓ•PÕÖØ	ÚYN‰ÚJÌ_XOX[œÝÙ\ŽßJNÂˆ—ÔÑPÕT’UWÑ’T”ÕÔÕTÐÓÓ•PÕÖÚYOXÛÛ˜XÝÚYVÌNÂˆJNÂˆÛØ˜[\Ë”ÕP’‘PÕÐ—ÔÑPÕT’UWÕŒŒÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛXÞN‰ØÝ\œ™[\ÝXš™XÝX‹[X[˜YÙ[Y[XØ\ÙK\ÝYK\ØÛÜIËˆYØXÞRYÎ“Øš™XÝ™œ™Y^™JØš™XÝšÙ^\Ê™\XÙ[Y[ÊJKˆÛÛ˜XÝZYÜ˜][ÛŽYKˆ]X[]P]Y]˜]Y]ˆJNÂŸJJ
NÂ‹ËÈOOOOH‘HUQTÕŒŒˆÝXš™XÝˆ[\›YYX]K\Ý]H™YXÝ[Ûˆ™\Z\œÈOOOOBŠ

HOˆÂˆÛÛœÝ]Y]IÝŒŒ‹Z[\›YYX]K\Ý]KX]][XÚ]IÎÂˆÛÛœÝYØXÞRYÏVÉÛÛÜÜÝ[IË	ÜÝXÚ×ÛÜÉË	ØÛÝ[Ù]™[‰Ë	ÛX]š^ÜÝ[IË	Ü]Y]YWÛÜÉË	ÛØš™XÝØÛÝ[\‰×NÂˆÛÛœÝÙ]ZYOžÂˆÛÛœÝ^P—ÑVTÒTÑTË™š[™
OžšYOOZY
NÂˆYŠY^
H›ÝÈ™]È\œ›ÜŠ	Ñ‘HUQTÕŒŒˆÝXš™XÝˆ^\˜Ú\ÙHZ\ÜÚ[™Îˆ	ÊÚY
NÂˆ™]\›ˆ^ÂˆNÂˆÛÛœÝÙ]™YJY‹
OOžÂˆÛÛœÝ^YÙ]
Y
K™YÏY^œÝ\Ë™š[\ŠÏOœËœ™YXÝ
K›X\
ÏOœËœ™YXÝ
NÂˆYŠ™YË›[™ÝOOLŠH›ÝÈ™]È\œ›ÜŠ	Ñ‘HUQTÕŒŒˆ™YXÝ[ÛˆÛÝ[šYˆ	ÊÚY
NÂˆØš™XÝ˜\ÜÚYÛŠ™YÖÛ‹LWK
NÂˆ—Ô‘QPÕSÓ—ÐÓÓ•PÕÖØ	ÚYN‰ÛŸXOTÝš[™Ê™YÖÛ‹LWK›ÜÖÜ™YÖÛ‹LWK˜WJNÂˆNÂ‚ˆÙ]™Y
	ÛÛÜÜÝ[IËKÂˆN‰ùãï¹g*8àkÚOLxàk¹b¨9ë¥ùo£8àiÜÝ[OLxàiøàfxà šOL¸àk¹cãyoªxà¤¹§ 9o£8ào¸àiùk§ú(c8àeøàgùæí9o£8àk¹â­¹¡bøàkûï'ÉËˆÜÎ–ÉÚOL‹Ý[OLÉË	ÚOLËÝ[OLÉË	ÚOL‹Ý[OL‰Ë	ÚOLËÝ[OM‰×KNŒˆ^Z[Ž‰ùãï¹g*8àkœÝ[OLxà¤¹/çy£ xàeøàgøào¸ào¹«(xàk¹cãyoªxàiÚOL¸àj8àj¸à¢¸à yb¨9ë¥ú(c8àiÌJÌLøàn9¦í9¥¬8àeøào¸àfxà Œ¹fç¹æë¸àk¹cãyoªxà¤¹í`¸àb8àgù¦`¹à®xàj¸àk¸àiøà yâ­¹¡bøàkÚOL‹Ý[OLøàiøàfxà ‰Ëˆ[‰øàêøàï8àåùi"y¥lxàk¹¦í9¥¬8àj8à \Ý[xàk¹b¨9ë¥øà¤ºh!¹åj¸àjú/ïxàa8ào¸àfxà ‰ÂˆJNÂˆÙ]™Y
	ÛÛÜÜÝ[IË‹ÂˆN‰ùãï¹g*8àkÚOM8à yb¨9ë¥ùbcxàkœÝ[OM¸àiøàfxà ¸àdøàk¹cãyoªxàbøà¢Y›Ü¹¥¡øà¤¹¢§8àdxà¢øào¸àiøàk¹­`xà£8àkûï'ÉËˆÜÎ–ÉÜÝ[ON8àj8àj¸à¢šOMxàiøà ¹b¨9ë¥øàfxà¢ÉË	ÜÝ[ONxàj8àj¸à¢¸àgxàk¹h-8àiùí`¹.¡¸àfxà¢ÉË	ÜÝ[OLL¸àj8àj¸à¢šOM8àk¸ào¸ào¹í`¹.¡¸àfxà¢ÉË	ÜÝ[OLL8àj8àj¸à¢¸à xàgxàk¹o£›Ü¹¥¡øà¤¹í`¹.¡¸àfxà¢É×KNŒËˆ^Z[Ž‰øào¸àf¹b¨9ë¥ú(c8àiÜÝ[xàkÍ¸¡¤ŒL;ï"ŠÍ;ï"xàjøàj¸à¢¸ào¸àfxà šOM8àk¹cãyoªxà¤¹í`¸àb8à¢øàj9«(xàkù."ºfd8à¤º-¡xàb8à¢øàgøà xà z/ïyb¨8àk¹b¨9ë¥øàkú(c8à£øàf™›Ü¹¥¡øà¤¹í`¹.¡¸àeøào¸àfxà ‰Ëˆ[‰ùb¨9ë¥øà¤¹k§ú(c8àeøài¸àbøà¢xà y«(xàk¹cãyoªxàc9kf9g*8àfxà¢øàbøà¤¹è®º*£xàeøào¸àfxà ‰ÂˆJNÂ‚ˆÙ]™Y
	ÜÝXÚ×ÛÜÉËKÂˆN‰ÜÝXÚÏVÌ‹xàbøà¢H8¡¤Ô
ÝXÚÊH8à¤¹k§ú(c8àeøàgùæí9o£8àk¹ía9d"8àføàkûï'ÉËˆÜÎ–ÉÞL‹ÝXÚÏVÍIË	ÞMÝXÚÏVÌ—IË	ÞMÝXÚÏVÌ‹IË	ÞL‹ÝXÚÏVÌ—I×KNŒKˆ^Z[Ž‰ÓQ“øàj¸àk¸àiøàâ8ààøàåøàk8àc9cå¸à¢¹aî¸àexà£8àižM8àjøàj¸à¢¸ào¸àfxà ¹d#9¦`¸àjÍ8àkøà®xà¯øààøà«øàbøà¢y­¢8àb8à¢øàgøà xà y«¢øà¢ùa¡yk®xàkÖÌ—xàiøàfxà º/å8à¢¹`)8àj8à®xà¯øààøà«ù§+9/døà¤¹.(y¥®y¦í9¥¬8àeøào¸àfxà ‰Ëˆ[‰ÔÔ8àkøàâ8ààøàåøà¤º/å8àfxàh8àdxàiøàj¸àcøà xàgxàkº) yí(8à¤¸à®xà¯øààøà«øàbøà¢ycå¸à¢ºfi8àcxào¸àfxà ‰ÂˆJNÂˆÙ]™Y
	ÜÝXÚ×ÛÜÉË‹ÂˆN‰ÞM8à \ÝXÚÏVÌ‹—xàk¹â­¹¡bøàbøà¢HH8¡¤Ô
ÝXÚÊH8à¤¹k§ú(c8àeøàgùæí9o£8àk¹aj9/dùâ­¹¡bøàkûï'ÉËˆÜÎ–ÉÞM‹OMÝXÚÏVÌ—IË	ÞMOL‹ÝXÚÏVÍ—IË	ÞMOM‹ÝXÚÏV×IË	ÞMOM‹ÝXÚÏVÌ—I×KNŒËˆ^Z[Ž‰ù§ 9b'xàk”Ô8àiùo¥øàgÞM8àkøàgxàk¸ào¸ào¹/çy£ xàexà£8ào¸àfxà ¹ãï¹g*8àk¸àâ8ààøàåÍ¸à¤¹«(xàk”Ô8àiùcå¸à¢¹aî¸àfxàk¸àiÞOM¸àj8àj¸à¢¸à xà®xà¯øààøà«øàjøàkù§ 9b'xàbøà¢y«¢øàhøài¸àa8à¢Ì¸àh8àdxàc9«¢øà¢¸ào¸àfxà ‰Ëˆ[‰ùbcxàk¹¤ãy/g8àiùè®¹k¦¸àeøàgÞ8àj8à yãï¹g*8àk¸à®xà¯øààøà«ÖÌ‹—xà¤¹d#9¦`¸àjú/ïxàa8ào¸àfxà ‰ÂˆJNÂ‚ˆÙ]™Y
	ØÛÝ[Ù]™[‰ËKÂˆN‰Ù]VÌxàbøà¢Y]VÌ—xào¸àiûï"ËL{ï"xà¤¹aé¹ä!¸àeùí`¸àb8àgùæí9o£8àk¹â­¹¡bøàkûï'ÉËˆÜÎ–ÉÚOL‹ÛÝ[L	Ë	ÚOL‹ÛÝ[LIË	ÚOLËÛÝ[L‰Ë	ÚOL‹ÛÝ[L‰×KNŒKˆ^Z[Ž‰Ìøàkùiaù¥l8àj¸àk¸àiØÛÝ[L8àk¸ào¸ào¸à N8àkù`m¹¥l8àj¸àk¸àiÌ8¡¤Œxà LLxàkùiaù¥l8àj¸àk¸àiÌxàk¸ào¸ào¸àiøàfxà ¸àeøàgøàc8àhøàišOL¸àk¹aé¹ä!¹í`¹.¡¹¦`¸àkØÛÝ[Lxàiøàfxà ‰Ëˆ[‰Ìøài8àk¹`)8à¤¹ab:h+xàbøà¢zh!¸àjú)¢øài¸à y`m¹¥l8àk¸àj8àcxàh8àdXÛÝ[8à¤¹h¥øà¡8àeøào¸àfxà ‰ÂˆJNÂˆÙ]™Y
	ØÛÝ[Ù]™[‰Ë‹ÂˆN‰Ù]VÍOLŒ8ào¸àiùaj:) yí(8à¤¹aé¹ä!¸àeùí`¸àb8àgøàj8àcxà XÛÝ[8àj9h¥ùb¨8àc:-møàcxàgù­îùkeøàk¹ía9d"8àføàkûï'ÉËˆÜÎ–ÉØÛÝ[L‹OLKÉË	ØÛÝ[MOLKË	Ë	ØÛÝ[LËOL‹	Ë	ØÛÝ[LËOLKË	×KNŒËˆ^Z[Ž‰úacyb%ÖÌËLKMŒxàiù`m¹¥l8àj¸àk¸àkÎMŒ8àiøàfxà ¹­îùkeøàiøàkÚOLKË8àkŒùfç¸àh8àdXÛÝ[8àc9h¥øàb8à¢øàgøà xà y§ 9í`¹â­¹¡bøàkØÛÝ[Løàiøàfxà ‰Ëˆ[‰ù§ 9í`º) yí(8àh8àdxàiøàj¸àcøà xàjxàk¹cãyoªxàiù§hy.í¸àc9ç'øàh8àhøàgøàbøà¤¹§ 9b'xàbøà¢y.)¸ànxào¸àfxà ‰ÂˆJNÂ‚ˆÙ]™Y
	ÛX]š^ÜÝ[IËKÂˆN‰ùãï¹g*8àkÛVÌVÌOLxàk¹b¨9ë¥ùo£8àiøàfxà Œz(c9æë»ï"L;ï"xà¤¸àfxànxài¹aé¹ä!¸àeùí`¸àb8àgùæí9o£8àk¹â­¹¡bøàkûï'ÉËˆÜÎ–ÉÜLKÏLÝ[OLÉË	ÜLÏLKÝ[OLIË	ÜLÏLKÝ[OLÉË	ÜLKÏLKÝ[OM	×KNŒ‹ˆ^Z[Ž‰ÜL8àiøàkØÏL8àkŒxàjùí¦¸àa8ài˜ÏLxàkŒ¸à¤¹b¨8àb8ào¸àfxà œÝ[xàkÌx¡¤Œøàj8àj¸à¢¸à Lz(c9æë¸àk¹§ 9o£8àjùaé¹ä!¸àeøàgù/cyïk¸àkÜLÏLxàj¸àk¸àiøà xàgxàk¹æí9o£8àkÜLÏLKÝ[OLøàiøàfxà ‰Ëˆ[‰ùa¡y`m8àêøàï8àåøàk˜øà¤¹§ 9o£8ào¸àiú`,¸à xài¸àbøà¢xà yi%¹`m8àêøàï8àåøàkœ¸àc9i"xà£øà¢¸ào¸àfxà ‰ÂˆJNÂˆÙ]™Y
	ÛX]š^ÜÝ[IË‹ÂˆN‰ùãï¹g*8àkÛVÌWVÌOLøàk¹b¨9ë¥ùo£8àiÜÝ[OM¸àiøàfxà ¹«(xàk¹a¡y`m8àêøàï8àåøàiøà yb¨9ë¥ú(c8à¤¹k§ú(c8àfxà¢ùæí9bcxàk¹â­¹¡bøàkûï'ÉËˆÜÎ–ÉÜLÏLKÝ[OM‰Ë	ÜLKÏLKÝ[OM‰Ë	ÜLKÏLKÝ[OLL	Ë	ÜL‹ÏLÝ[OM‰×KNŒKˆ^Z[Ž‰ùd#8àfLxàkº(c8àiùa¡y`m8àêøàï8àåøàk˜øàh8àdxàc8¡¤Œxàn:`,¸àoøào¸àfxà ¸ào¸àhVÌWVÌWOM8à¤¹b¨8àb8ài¸àa8àj¸àa8àk¸àiÜÝ[xàkÍ¸àk¸ào¸ào¸àiøàfxà ¹«(xàk¹b¨9ë¥ùæí9bcxàkÜLKÏLKÝ[OM¸àiøàfxà ‰Ëˆ[‰øàêøàï8àåùi"y¥l8àc:`,¸à 9¦`¹à®xàj8à z) yí(8à¤œÝ[xàn9b¨8àb8à¢ù¦`¹à®xà¤¹b!¸àdxàiº  øàb8ào¸àfxà ‰ÂˆJNÂ‚ˆÙ]™Y
	Ü]Y]YWÛÜÉËKÂˆN‰Ü]Y]YOVÌËWxàbøà¢H8¡¤TUQUQJ]Y]YJH8à¤¹k§ú(c8àeøàgùæí9o£8àk¹ía9d"8àføàkûï'ÉËˆÜÎ–ÉÞMK]Y]YOVÌ×IË	ÞLË]Y]YOVÌËWIË	ÞLË]Y]YOVÍWIË	ÞMK]Y]YOVÍWI×KNŒ‹ˆ^Z[Ž‰Ñ’Q“øàj¸àk¸àiùab:h+xàkŒøàc9cå¸à¢¹aî¸àexà£8àižLøàjøàj¸à¢¸ào¸àfxà ¹d#9¦`¸àjÌøàkøà«xàéxàï8àbøà¢zfi8àbøà£8à¢øàgøà xà y«¢øà¢øà«xàéxàï8àkÖÍWxàiøàfxà º/å8à¢¹`)8àj8à«xàéxàï9§+9/døà¤¹.(y¥®y¦í9¥¬8àeøào¸àfxà ‰Ëˆ[‰ÑTUQUQxàkùab:h+z) yí(8à¤º/å8àeøà xàgxàkº) yí(8à¤¸à«xàéxàï8àbøà¢ycå¸à¢ºfi8àcxào¸àfxà ‰ÂˆJNÂˆÙ]™Y
	Ü]Y]YWÛÜÉË‹ÂˆN‰ÞLøà \]Y]YOVÍK×xàk¹â­¹¡bøàbøà¢HH8¡¤TUQUQJ]Y]YJH8à¤¹k§ú(c8àeøàgùæí9o£8àk¹aj9/dùâ­¹¡bøàkûï'ÉËˆÜÎ–ÉÞLËOMK]Y]YOVÍ×IË	ÞLËOMË]Y]YOVÍWIË	ÞMKOMË]Y]YOV×IË	ÞLËOMK]Y]YOV×I×KNŒˆ^Z[Ž‰ù§ 9b'xàk‘TUQUQxàiùo¥øàgÞLøàkù/çy£ xàexà£8ào¸àfxà ¸àgxàk¹o£øàkù§*ùl/¸àjú/ïyb¨8àexà£8ài¸àa8à¢øàk¸àiøà y«(xàjùcå¸à¢¹aî¸àfyab:h+xàkÍxàiøàfxà ¸à¢8àhøàižOMxàj8àj¸à¢¸à \]Y]YxàjøàkÖÍ×xàc9«¢øà¢¸ào¸àfxà ‰Ëˆ[‰ùbcxàkž8à¤¹/çy£ xàeøài8ài8à Mxàjøàk¸àjxàhxà¢xàc9ab8àjøà«xàéxàï8àn9aixàhøài¸àa8àgøàbøà¤¹è®º*£xàeøào¸àfxà ‰ÂˆJNÂ‚ˆÛÛœÝØšYÙ]
	ÛØš™XÝØÛÝ[\‰ÊNÂˆØš‹™\ØÏIú)!ù¥l8àk¸àª¸àå¸à®8à©øà«øàâ8à¤¹å'ù¢$8àeøà xàèxà¯xààøàâydo9aî¸àeøàc8àgxà£8àg¸à£8àk¸àåxà¨øàï8àêøàâxàn9.#¸àb8à¢ùi"yc%¸à¤º/ïxàa8ào¸àfxà ‰ÎÂˆØš‹˜ÛÙOVÉØÛ\ÜÈÛÝ[\‰Ë	È˜[YIË	È›ØÙY\™H[˜Ê
IË	È˜[YH8¡¤˜[YH
ÈIË	È[™›ØÙY\™IË	Ù[™Û\ÜÉË	ØH8¡¤ÛÝ[\Š˜[YOLŠIË	Øˆ8¡¤ÛÝ[\Š˜[YOMJIË	ØKš[˜Ê
IË	Ø‹š[˜Ê
IË	ØKš[˜Ê
IË	ØK˜[YK‹˜[YH8à¤¹aî¹b¦øàfxà¢É×NÂˆØš‹›Øš™XÝ˜[YOIÐÛÝ[\ˆHÈÛÝ[\ˆ‰ÎÂˆØš‹œÝ\ÏVÂˆÛ[™N‹Ý]NžÉØK˜[YIÎŒ‹	Ø‹˜[YIÎ‰ø %	ßKØš™XÝžÉØK˜[YIÎŒ‹	Ø‹˜[YIÎ‰ø %	ßK\ÙÎ‰Øxà¤˜[YOL¸àiùå'ù¢$8à ‰ßKˆÛ[™NËÝ]NžÉØK˜[YIÎŒ‹	Ø‹˜[YIÎ_KØš™XÝžÉØK˜[YIÎŒ‹	Ø‹˜[YIÎ_K\ÙÎ‰Ø¸à¤˜[YOMxàiùå'ù¢$8à ˜xàj¸àkùb)xà!xàk¸àª¸àå¸à®8à©øà«øàâ8àiøàfxà ‰ßKˆÛ[™NŽÝ]NžÉØK˜[YIÎŒ‹	Ø‹˜[YIÎ_KØš™XÝžÉØK˜[YIÎŒ‹	Ø‹˜[YIÎ_K\ÙÎ‰ØKš[˜Ê
xà¤¹do8àlùaî¸àeøào¸àfxà ‰Ë™YXÝžÜN‰ØKš[˜Ê
xà¤Œyfç¹k§ú(c8àeøàgùæí9o£8àkŒ¸ài8àk¸àª¸àå¸à®8à©øà«øàâ8àk¹â­¹¡bøàkûï'ÉËÜÎ–ÉØK˜[YOL‹‹˜[YOM‰Ë	ØK˜[YOLË‹˜[YOMIË	ØK˜[YOLË‹˜[YOM‰Ë	ØK˜[YOMK‹˜[YOLÉ×KNŒK^Z[Ž‰Ú[˜Ê
xàk¹do9aî¸àeùab8àkØxàj¸àk¸àiøà XK˜[Yxàh8àdxàc¸¡¤Œøàjøàj¸à¢¸ào¸àfxà ˜¸àjøàkøàèxà¯xààøàâxà¤¹do8à¤øàiøàa8àj¸àa8àgøà X‹˜[YOMxàk¸ào¸ào¸àiøàfxà ‰Ë[‰øàjxàk¸àª¸àå¸à®8à©øà«øàâ8àjùkï¸àeøài¸àèxà¯xààøàâxà¤¹do8àlùaî¸àeøàgøàbøà¤¹c.¹b)xàeøào¸àfxà ‰ß_KˆÛ[™NŒËÝ]NžÉØK˜[YIÎŒË	Ø‹˜[YIÎ_KØš™XÝžÉØK˜[YIÎŒË	Ø‹˜[YIÎ_K\ÙÎ‰ØK˜[YOLøà X‹˜[YOMxà ‰ßKˆÛ[™NŽKÝ]NžÉØK˜[YIÎŒË	Ø‹˜[YIÎ_KØš™XÝžÉØK˜[YIÎŒË	Ø‹˜[YIÎ_K\ÙÎ‰ù«(xàjØ‹š[˜Ê
xà¤¹do8àlùaî¸àeøào¸àfxà ‰Ë™YXÝžÜN‰øàdøàk˜‹š[˜Ê
xà¤¹k§ú(c8àeøà xàgxàk¹«(xàk˜Kš[˜Ê
xào¸àiùí`¸àb8àgùo£8àk¹â­¹¡bøàkûï'ÉËÜÎ–ÉØK˜[YOLË‹˜[YOM‰Ë	ØK˜[YOM‹˜[YOM‰Ë	ØK˜[YOM‹˜[YOMIË	ØK˜[YOMK‹˜[YOMÉ×KNŒK^Z[Ž‰ùãï¹g*8àkØOLËMxàiøàfxà ¸ào¸àf˜‹š[˜Ê
xàiØ¸àh8àdxàcx¡¤¸à yí¦¸àcØKš[˜Ê
xàiØxàh8àdxàcø¡¤8àjøàj¸à¢¸ào¸àfxà ¹b)xàª¸àå¸à®8à©øà«øàâ8àk¸àåxà¨øàï8àêøàâxàkùaly§"xàexà£8àj¸àa8àk¸àiù§ 9í`¹æ¡8àjØOMM¸àiøàfxà ‰Ë[‰Ø¸àn8àk¹do9aî¸àeøàjxàn8àk¹do9aî¸àeøà¤¸à ykïº,hxàe8àj8àjÌyfç¸àf¸ài9cãy¦(8àeøào¸àfxà ‰ß_KˆÛ[™NŒËÝ]NžÉØK˜[YIÎŒË	Ø‹˜[YIÎŸKØš™XÝžÉØK˜[YIÎŒË	Ø‹˜[YIÎŸK\ÙÎ‰Ø‹š[˜Ê
yo£8àkØK˜[YOLøà X‹˜[YOM¸à ‰ßKˆÛ[™NŒLÝ]NžÉØK˜[YIÎŒË	Ø‹˜[YIÎŸKØš™XÝžÉØK˜[YIÎŒË	Ø‹˜[YIÎŸK\ÙÎ‰ùí¦¸àa8ài˜Kš[˜Ê
xà¤¹do8àlùaî¸àeøào¸àfxà ‰ßKˆÛ[™NŒËÝ]NžÉØK˜[YIÎ	Ø‹˜[YIÎŸKØš™XÝžÉØK˜[YIÎ	Ø‹˜[YIÎŸK\ÙÎ‰ØK˜[YOM8à X‹˜[YOM¸à ‰ßKˆÛ[™NŒLKÝ]NžÉØK˜[YIÎ	Ø‹˜[YIÎŸKØš™XÝžÉØK˜[YIÎ	Ø‹˜[YIÎŸK\ÙÎ‰ùaî¹b¦øàkØK˜[YOM‹˜[YOM¸àiøàfxà ‰ßBˆNÂˆØš‹œÝ\Ë™š[\ŠÏOœËœ™YXÝ
K™›Ü‘XXÚ

ËJOOžÐ—Ô‘QPÕSÓ—ÐÓÓ•PÕÖØØš™XÝØÛÝ[\Ž‰ÚJÌ_XOTÝš[™ÊËœ™YXÝ›ÜÖÜËœ™YXÝ˜WJNßJNÂ‚ˆÛÛœÝÛÛ˜XÝÙ^\Ï[YØXÞRYË™›]X\
YO–Ø	ÚYNŒX	ÚYNŒ˜JNÂˆÛØ˜[\Ë”ÕP’‘PÕÐ—ÐSÓÔ’UWÕŒŒ—ÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛXÞN‰Ú[\›YYX]K\Ý]K\™YXÝ[Û‹X]][XÚ]IËYØXÞRYÎ“Øš™XÝ™œ™Y^™JË‹‹›YØXÞRY×JKÛÛ˜XÝÙ^\Î“Øš™XÝ™œ™Y^™JÛÛ˜XÝÙ^\ÊK]X[]P]Y]˜]Y]ˆJNÂŸJJ
NËËÈOOOOH‘HUQTÕŒŒHÝXš™XÝˆ[ÛÜš]HZ[šK[[ØÚÈ˜[Z[H˜[[˜ÙHOOOOBŠ

HOˆÂˆÛÛœÝ˜[Z[PžRYSØš™XÝ™œ™Y^™JÂˆÛÜÜÝ[N‰ØÛÛ›ÛÚ]\˜][Û‰ËˆÛÝ[Ù]™[Ž‰ØÛÛ›ÛÚ]\˜][Û‰Ëˆ™\ÝYÛÛÜ‰ØÛÛ›ÛÚ]\˜][Û‰ËˆØÙÙ]XÛY‰ØÛÛ›ÛÚ]\˜][Û‰Ëˆ\œ˜^WÛX^‰Ø\œ˜^WÜØØ[‰Ëˆ\œ˜^WÜ™]™\œÙN‰Ø\œ˜^WÜØØ[‰Ëˆ[™X\—ÜÙX\˜Ú‰ÜÙX\˜ÚÜÛÜ	Ëˆš[˜\žWÜÙX\˜ÚØŽ‰ÜÙX\˜ÚÜÛÜ	ËˆX˜›WÜÛÜØŽ‰ÜÙX\˜ÚÜÛÜ	ËˆÙ[XÝ[Û—ÜÛÜØŽ‰ÜÙX\˜ÚÜÛÜ	ËˆÝXÚ×ÛÜÎ‰ÜÝXÚ×Ü]Y]YIËˆ]Y]YWÛÜÎ‰ÜÝXÚ×Ü]Y]YIËˆ™XÝ\œÚ[ÛŽ‰Ü™XÝ\œÚ[Û‰Ëˆ™XÝ\œÚ]™WÙšXŽ‰Ü™XÝ\œÚ[Û‰Ëˆ™YWÙœÎ‰Ý™YWÛ\Ý	Ëˆ[šÙYÛ\Ý‰Ý™YWÛ\Ý	ËˆX]š^ÜÝ[N‰ÛX]š^	ËˆX]š^Ùš[™‰ÛX]š^	Ëˆš]ÛX\ÚÎ‰Øš]	ËˆØš™XÝØÛÝ[\Ž‰ÛØš™XÝ	ÂˆJNÂˆÛÛœÝ˜[Z[SX^LŽÂ‚ˆ[˜Ý[Ûˆ˜[Z[SÙŠ][J^Âˆ™]\›ˆ˜[Z[PžRYÚ][OËšY_[˜Û\ÜÚYšYY‰ÔÝš[™Ê][OËšY	Ý[šÛ›ÝÛ‰Ê_XÂˆB‚ˆ[˜Ý[Ûˆ^ÜÝ\™TÛÜY
ÛÛ
^Âˆ™]\›ˆÛÛ›X\

][K[™^
OOŠÚ][K[™^YN“X]œ˜[™ÛJ
_JJKœÛÜ

KŠOOžÂˆÛÛœÝØO\›Ùš[K˜“[ØÚÔÝ]ÖØKš][KšYOËœÙY[ŸØ\›Ùš[K˜“[ØÚÔÝ]ÖØ‹š][KšYOËœÙY[ŸÂˆYŠØHOO\ØŠ\™]\›ˆØK\ØŽÂˆÛÛœÝO\›Ùš[K˜“[ØÚÔÝ]ÖØKš][KšYOË›\ÝÙY[Ÿ	ÉË\›Ùš[K˜“[ØÚÔÝ]ÖØ‹š][KšYOË›\ÝÙY[Ÿ	ÉÎÂˆYŠHOO[Š\™]\›ˆK›ØØ[PÛÛ\\™JŠNÂˆYŠKYHOOX‹YJ\™]\›ˆKYKX‹YNÂˆ™]\›ˆKš[™^X‹š[™^ÂˆJK›X\
Ožš][JNÂˆB‚ˆ[˜Ý[ÛˆÙ[XÝ]™[
ÛÛ‹˜[Z[PÛÝ[Ê^ÂˆÛÛœÝ™[XZ[š[™ÏY^ÜÝ\™TÛÜY
ÛÛ
KXÚÙYV×NÂˆÚ[JXÚÙY›[™Ý‰‰œ™[XZ[š[™Ë›[™Ý
^Âˆ]XÚÒ[™^\™[XZ[š[™Ë™š[™[™^
][OOŠ˜[Z[PÛÝ[ÖÙ˜[Z[SÙŠ][JW_
O˜[Z[SX^
NÂˆYŠXÚÒ[™^
\XÚÒ[™^LÂˆÛÛœÝÚ][WO\™[XZ[š[™ËœÜXÙJXÚÒ[™^JK˜[Z[OY˜[Z[SÙŠ][JNÂˆXÚÙYœ\Ú
][JNÂˆ˜[Z[PÛÝ[ÖÙ˜[Z[WOJ˜[Z[PÛÝ[ÖÙ˜[Z[W_
JÌNÂˆBˆ™]\›ˆXÚÙYÂˆB‚ˆZ[“[ØÚÏY[˜Ý[ÛŠ
^ÂˆÛÛœÝØ[™Y]\ÏP—ÑVTÒTÑTË›X\
“[ØÚÐØ[™Y]Qœ›ÛQ^\˜Ú\ÙJK™š[\Š›ÛÛX[ŠKÙ[XÝYV×K˜[Z[PÛÝ[Ï^ßNÂˆØš™XÝ™[šY\Ê—ÓSÐÒ×ÔUSÕTÊK™›Ü‘XXÚ

Û]™[—JOOžÂˆÙ[XÝYœ\Ú
‹‹œÙ[XÝ]™[
Ø[™Y]\Ë™š[\ŠOž›]™[OO[]™[
K‹˜[Z[PÛÝ[ÊJNÂˆJNÂˆ™]\›ˆÚY™›Y
Ù[XÝY
K›X\
ÚY™›P“[ØÚÐ[œÝÙ\ŠNÂˆNÂ‚ˆÛØ˜[\Ë—ÓSÐÒ×ÑSRSWÐ–WÒQY˜[Z[PžRYÂˆÛØ˜[\Ë—ÓSÐÒ×ÑSRSWÓPVY˜[Z[SX^ÂˆÛØ˜[\Ë˜“[ØÚÑ˜[Z[SÙY˜[Z[SÙŽÂˆÛØ˜[\ËœÙ[XÝ“[ØÚÓ]™[Ø[™Y]\Ï\Ù[XÝ]™[ÂˆÛØ˜[\Ë”ÕP’‘PÕÐ—ÔÑTÔÒSÓ—ÕŒŒWÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛXÞN‰Ø[ÛÜš]K[Z[šKZ[˜K\Ù\ÜÚ[Û‹Y˜[Z[KX˜[[˜ÙIËˆÛÝ\˜ÙP]Y]‰ÝŒŒX[ÛÜš]WÛZ[šWÚ[˜WÜÙ\ÜÚ[Û—Ù˜[Z[WØ˜[[˜ÙIËˆ˜[Z[SX^ˆ˜[Z[PžRYˆ™\Ù\™Y“Øš™XÝ™œ™Y^™JØÛÝ[Ž][Ý\Î“Øš™XÝ™œ™Y^™JË‹‹—ÓSÐÒ×ÔUSÕTßJK^ÜÝ\™SÜ™\Ž‰ÜÙY[‹][‹[\ÝÙY[‹][‹\˜[™ÛK]YIßJBˆJNÂŸJJ
NÂ‹ËÈOOOOHŒŒÝXš™XÝˆš[˜[\˜XÝXÙHÝ\ÝZ[™Y]˜XÙH›ÛÜˆOOOOB˜ÛÛœÝ—Ñ’SSÒQÒÕPÑWÑ“ÓÔ—ÕŒŒMÂ˜ÛÛœÝ—Ñ’SSÒQÒÕPÑWÒQ×ÕŒŒ[™]ÈÙ]
Âˆ	Ø™^[WØÝ›ÌIË	Ø™^[WØÝ›Ì	Ë	Ø™^[WØ\œ—Ì‰Ë	Ø™^[WÛX]ÌIË	Ø™^[WÛX]Ì	Ë	Ø™^[WÜ™X×ÌIËˆ	Ø™^[WÝ™YWÌ‰Ë	Ø™^[WÝ™YWÌ	Ë	Ø™^[WÛ\ÝÌ	Ë	Ø™^[WÜÜWÌ	Ë	Ø™^[WØ[Û×ÌIË	Ø™^[WØ[Û×ÌÉÂ—JNÂ˜ÛÛœÝÕP’‘PÕÐ—Ñ’SSÕŒŒÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛXÞN‰Ùš[˜[\˜XÝXÙK\Ý\ÝZ[™Y]˜XÙKY›ÛÜ‰ËˆÛÝ\˜ÙP]Y]‰ÝŒŒËYš[˜[Ü˜XÝXÙWÜÝ\ÝZ[™YÝ˜XÙWÙ›ÛÜ‰ËˆYÚ˜XÙQ›ÛÜŽ—Ñ’SSÒQÒÕPÑWÑ“ÓÔ—ÕŒŒˆYÚ˜XÙRYÎ“Øš™XÝ™œ™Y^™JË‹‹—Ñ’SSÒQÒÕPÑWÒQ×ÕŒŒJKˆ™\Z\›Ý[™\žN‰ÜØ[YKYÛXZ[‹\Ø[YK[]™[\Ù[XÝ[Û‹[Û›IÂŸJNÂ‚™[˜Ý[Ûˆ‘š[˜[YÚ˜XÙPÛÝ[ŒŒ
][\Ê^Âˆ™]\›ˆ][\Ë™š[\ŠOžËšÚ[™OOIØ[ÛÉÉ‰—Ñ’SSÒQÒÕPÑWÒQ×ÕŒŒš\ÊœÛÝ\˜ÙRY
JK›[™ÝÂŸB‚™[˜Ý[Ûˆ‘š[˜[™\Z\•˜XÙQ›ÛÜ•ŒŒ
][\Ê^ÂˆÛÛœÝÝ]VË‹‹š][\×NÂˆ][ÛÏ[Ý]™š[\ŠOžËšÚ[™OOIØ[ÛÉÊNÂˆ]YÚÛÝ[X‘š[˜[YÚ˜XÙPÛÝ[ŒŒ
[ÛÊNÂ‚ˆÚ[JYÚÛÝ[—Ñ’SSÒQÒÕPÑWÑ“ÓÔ—ÕŒŒ
^ÂˆÛÛœÝÙ[XÝYYÏ[™]ÈÙ]
[ÛË›X\
OžœÛÝ\˜ÙRY
JNÂˆÛÛœÝ˜]ÐžRY[™]ÈX\
—ÑVSWÐSÓ×ÒUSTË›X\
O–ÞšYJJNÂˆÛÛœÝ˜]ÔÙ[XÝYX[ÛË›X\
Oœ˜]ÐžRY™Ù]
œÛÝ\˜ÙRY
JK™š[\Š›ÛÛX[ŠNÂˆÛÛœÝ›Ü›X]ÛÝ[Ï^ßNÂˆ˜]ÔÙ[XÝY™›Ü‘XXÚ
OžØÛÛœÝ^™›Ü›X]	øàâ8àë8àï8à®IÎÙ›Ü›X]ÛÝ[ÖÙ—OJ›Ü›X]ÛÝ[ÖÙ—_
JÌNßJNÂˆÛÛœÝÝØ\ÏV×NÂ‚ˆ[ÛË™›Ü‘XXÚ
šXÝ[OOžÂˆYŠ—Ñ’SSÒQÒÕPÑWÒQ×ÕŒŒš\ÊšXÝ[KœÛÝ\˜ÙRY
J\™]\›ŽÂˆÛÛœÝ˜]ÕšXÝ[O\˜]ÐžRY™Ù]
šXÝ[KœÛÝ\˜ÙRY
NÂˆYŠ\˜]ÕšXÝ[J\™]\›ŽÂˆ—ÑVSWÐSÓ×ÒUSTÂˆ™š[\ŠØ[™Y]OO—Ñ’SSÒQÒÕPÑWÒQ×ÕŒŒš\ÊØ[™Y]KšY
I‰ˆ\Ù[XÝYYËš\ÊØ[™Y]KšY
I‰˜Ø[™Y]K™ÛXZ[OO\˜]ÕšXÝ[K™ÛXZ[‰‰˜Ø[™Y]K›]™[OO\˜]ÕšXÝ[K›]™[
Bˆ™›Ü‘XXÚ
Ø[™Y]OOžÂˆÛÛœÝØ[™Y]Q›Ü›X]XØ[™Y]K™›Ü›X]	øàâ8àë8àï8à®IÎÂˆÛÛœÝšXÝ[Q›Ü›X]\˜]ÕšXÝ[K™›Ü›X]	øàâ8àë8àï8à®IÎÂˆÛÛœÝ›ÜÜXÝ]™Q›Ü›X]ØYJ›Ü›X]ÛÝ[ÖØØ[™Y]Q›Ü›X]_
KJØ[™Y]Q›Ü›X]OO]šXÝ[Q›Ü›X]ÌNŒ
NÂˆÝØ\Ëœ\Ú
ÂˆšXÝ[Kˆ˜]ÕšXÝ[KˆØ[™Y]KˆØ[™Y]TÙY[Ž˜‘š[˜[[ÛÔÙY[ŠØ[™Y]JKˆ›ÜÜXÝ]™Q›Ü›X]ØYˆšXÝ[TÙY[Ž˜‘š[˜[[ÛÔÙY[Š˜]ÕšXÝ[JBˆJNÂˆJNÂˆJNÂ‚ˆÝØ\ËœÛÜ

KŠOO‚ˆK˜Ø[™Y]TÙY[‹X‹˜Ø[™Y]TÙY[ˆˆKœ›ÜÜXÝ]™Q›Ü›X]ØYX‹œ›ÜÜXÝ]™Q›Ü›X]ØYˆ‹šXÝ[TÙY[‹XKšXÝ[TÙY[ˆˆX]œ˜[™ÛJ
KKBˆ
NÂˆÛÛœÝÝØ\\ÝØ\ÖÌNÂˆYŠ\ÝØ\
Xœ™XZÎÂˆÛÛœÝÜÏ[Ý]™š[™[™^
OžËšÚ[™OOIØ[ÛÉÉ‰žœÛÝ\˜ÙRYOO\ÝØ\šXÝ[KœÛÝ\˜ÙRY
NÂˆYŠÜÏ
Xœ™XZÎÂˆÝ]ÜÜ×O[XZÙQš[˜[[ÛÑ^[JÝØ\˜Ø[™Y]JNÂˆ[ÛÏ[Ý]™š[\ŠOžËšÚ[™OOIØ[ÛÉÊNÂˆYÚÛÝ[X‘š[˜[YÚ˜XÙPÛÝ[ŒŒ
[ÛÊNÂˆBˆ™]\›ˆÝ]ÂŸB‚˜ÛÛœÝ×ØZ[‘š[˜[™Y›Ü™UŒŒXZ[‘š[˜[Â˜Z[‘š[˜[Y[˜Ý[ÛŠ
^ÂˆÛÛœÝ™\Z\™YX‘š[˜[™\Z\•˜XÙQ›ÛÜ•ŒŒ
×ØZ[‘š[˜[™Y›Ü™UŒŒ

JNÂˆÛÛœÝ[ÛÏ\™\Z\™Y™š[\ŠOžËšÚ[™OOIØ[ÛÉÊNÂˆÛÛœÝÙXÏ\™\Z\™Y™š[\ŠOžËšÚ[™OOIÜÙXÝ\š]IÊNÂˆÛÛœÝ]™[ÛÝ[ÏX[ÛËœ™YXÙJ
K
OOžÛVÞ›]™[OJVÞ›]™[_
JÌNÜ™]\›ˆNßKßJNÂˆÛÛœÝÛXZ[œÏ[™]ÈÙ]
[ÛË›X\
Ož™ÛXZ[ŠJNÂˆ\ÜÙ\
™\Z\™Y›[™ÝOOP—Ñ’SSÐÓÕS•	‰˜[ÛË›[™ÝOOP—Ñ’SSÐSÓ×ÐÓÕS•	‰œÙXË›[™ÝOOP—Ñ’SSÔÑP×ÐÓÕS•	ÝŒŒš[˜[ÛÝ[šY	ÊNÂˆ\ÜÙ\
]™[ÛÝ[ÖÉùª&y®¥‰×OOON	‰›]™[ÛÝ[ÖÉùoç9å*	×OOON	ÝŒŒš[˜[[ÛÜš]H]™[šY	ÊNÂˆ\ÜÙ\
ÛXZ[œËœÚ^™OOOP—Ñ’SSÐSÓ×ÑÓPRS”Ë›[™Ý	‰—Ñ’SSÐSÓ×ÑÓPRS”Ë™]™\žJO™ÛXZ[œËš\Ê
JK	ÝŒŒš[˜[[ÛÜš]HÛXZ[ˆšY	ÊNÂˆ\ÜÙ\
™]ÈÙ]
[ÛË›X\
OžœÛÝ\˜ÙRY
JKœÚ^™OOOX[ÛË›[™Ý	ÝŒŒš[˜[[ÛÜš]H\XØ]HY	ÊNÂˆ\ÜÙ\
‘š[˜[YÚ˜XÙPÛÝ[ŒŒ
[ÛÊOP—Ñ’SSÒQÒÕPÑWÑ“ÓÔ—ÕŒŒ	ÝŒŒš[˜[Ý\ÝZ[™Y]˜XÙH›ÛÜˆ[˜]˜Z[X›IÊNÂˆ™]\›ˆ™\Z\™YÂŸNÂ‚™ÛØ˜[\Ë—Ñ’SSÒQÒÕPÑWÑ“ÓÔ—ÕŒŒP—Ñ’SSÒQÒÕPÑWÑ“ÓÔ—ÕŒŒÂ™ÛØ˜[\Ë—Ñ’SSÒQÒÕPÑWÒQ×ÕŒŒVË‹‹—Ñ’SSÒQÒÕPÑWÒQ×ÕŒŒNÂ™ÛØ˜[\Ë”ÕP’‘PÕÐ—Ñ’SSÕŒŒÔÔPÏTÕP’‘PÕÐ—Ñ’SSÕŒŒÔÔPÎÂ™ÛØ˜[\Ë˜‘š[˜[YÚ˜XÙPÛÝ[ŒŒX‘š[˜[YÚ˜XÙPÛÝ[ŒŒÂ™ÛØ˜[\Ë˜‘š[˜[™\Z\•˜XÙQ›ÛÜ•ŒŒX‘š[˜[™\Z\•˜XÙQ›ÛÜ•ŒŒÂ‹ËÈOOOOH‘HUQTÕŒŒLHÝXš™XÝˆš[˜[X[ÛÜš]HÛÛ[œÚ]H^[œÚ[ÛˆOOOOB˜ÛÛœÝÕP’‘PÕÐ—Ñ’SSÔÓÓÕŒŒLWÒUSTÏSØš™XÝ™œ™Y^™JÂˆØš™XÝ™œ™Y^™JÂˆY‰Ø™^[WÛØš—Ì	ËÛXZ[Ž‰øàª¸àå¸à®8à©øà«øàâ9£!ùd$IË]™[‰ùª&y®¥‰Ë›Ü›X]‰ú`%9.+yâ­¹¡bÉËˆ]N‰ùaly§"ycà¹áiøà¤º`&¸àeøàgú)!ù¥l9fç¸àk¹â­¹¡bù¦í9¥¬	ËˆÛÛ^‰ùd#8àfÛÝ[\¸à©8àìøà®xà¯øàìøà®xà¤º)!ù¥l8àk¹i"y¥l8àbøà¢ycà¹áiøàeøà xàèxà¯xààøàâydo9aî¸àeøàjøà¢8à¢Ý˜[Yxàk¹i"yc%¸à¤ºh!¸àjú/ïxàa8ào¸àfxà ‰ËˆÛÙN–Âˆ	ØH8¡¤ÛÝ[\ŠÊIËˆ	Øˆ8¡¤IËˆ	ØK˜Y
ŠIËˆ	Ø‹˜Y

IËˆ	ØÈ8¡¤‰Ëˆ	ØË˜Y
LJIËˆ	ØK˜[YKË˜[YH8à¤¹aî¹b¦øàfxà¢ÉÂˆKˆ]N–ÞÛX™[‰ÐÛÝ[\‰Ë^‰ÐÛÝ[\ŠŠxàkÝ˜[YO[¸àiùå'ù¢$8àexà£8à XY

xàkøàgxàk¸à©8àìøà®xà¯øàìøà®xàk˜[Yxàn8à¤¹b¨8àb8ào¸àfxà ¸àª¸àå¸à®8à©øà«øàâ9i"y¥l8àk¹.èùaixàkùd#8àf8à©8àìøà®xà¯øàìøà®xàn8àk¹cà¹áiøà¤¹®(xàeøào¸àfxà ‰ßWKˆN‰ù§ 9o£8àjùaî¹b¦øàexà£8à¢ÈK˜[YH8àjË˜[YH8àk¹ía9d"8àføàkûï'ÉËˆÜ[ÛœÎ–ÉØK˜[YONË˜[YON	Ë	ØK˜[YOMKË˜[YON	Ë	ØK˜[YONKË˜[YON	Ë	ØK˜[YOLËË˜[YON	×KˆNŒˆ^Z[Ž‰Øxà X¸à Xøàkùd#8àf8à©8àìøà®xà¯øàìøà®xà¤¹cà¹áiøàeøào¸àfxà ˜[YxàkÌø¡¤x¡¤Žx¡¤Ž8àj9i"yc%¸àfxà¢øàgøà xà Xxàbøà¢z)¢øài¸à ˜øàbøà¢z)¢øài¸à ¹§ 9o£8àkÎ8àiøàfxà ‰ÂˆJKˆØš™XÝ™œ™Y^™JÂˆY‰Ø™^[WØš]ÌIËÛXZ[Ž‰øàäøààøàâ9b%ÉË]™[‰ùoç9å*	Ë›Ü›X]‰ùaé¹ä!¹íd9§§	Ëˆ]N‰øàç¸à®xà«øàîøà­øàåxàâ8àîÖÔ¸à¤º`(ùí¦¸àeøàiº/ïxàa‰ËˆÛÛ^‰Îš]9`)8àjùkï¸àfxà¢ú)!ù¥l8àk¸àäøààøàâ9¯%9ë¥øà¤¹."¸àbøà¢zh!¸àjú`jyå*8àeøà yd!9aé¹ä!¹o£8àk¹`)8à¤¹«(xàk¹aé¹ä!¸àn9o%xàcyí¦xàc¸ào¸àfxà ‰ËˆÛÙN–Âˆ	Þ8¡¤LLLLL8  ‰Ëˆ	Þ8¡¤S‘LLLLLx  ‰Ëˆ	Þ8¡¤ˆIËˆ	Þ8¡¤ÔˆLLL8  ‰Ëˆ	Þ8¡¤ÔˆL8  ‰Ëˆ	Þ8à¤¹aî¹b¦øàfxà¢ÉÂˆKˆ]N–ÞÛX™[‰øà­øàåxàâ	Ë^‰Ïˆ8àkÎš]8àkº*å¹ä!¹cìøà­øàåxàâ8àiøà ymé¹êëøàjøàkÌ8à¤¹aixà£8ào¸àfxà ‰ßWKˆN‰ù§ 9o£8àjùaî¹b¦øàexà£8à¢È8àkûï'ÉËˆÜ[ÛœÎ–ÉÌLLLLx  ‰Ë	ÌLLLLLx  ‰Ë	ÌLLLLx  ‰Ë	ÌLLLL8  ‰×KˆNŒKˆ^Z[Ž‰ÌLLLLLS‘LLLLLOLLLLL8à ycìøànXš]8àiÌLLLxà VÔˆLLL8àiÌLLLLxà y§ 9o£8àjÓÔˆL8àiÌLLLLLxàiøàfxà ‰ÂˆJKˆØš™XÝ™œ™Y^™JÂˆY‰Ø™^[WÝ™YWÌIËÛXZ[Ž‰ù§*9©âú`(	Ë]™[‰ùª&y®¥‰Ë›Ü›X]‰ú`%9.+yâ­¹¡bÉËˆ]N‰ùnaya*¹ab9£¨¹í(¸àk¸à«xàéxàï8àj9í+ùêcy`)	ËˆÛÛ^‰ùl#øàexàj¹§*8à¤¹naya*¹ab8àjøàgøàjxà¢¸à ycå¸à¢¹aî¸àeøàgøàã¸àï8àâxàk¹`)8à¤œÝ[xàn9b¨8àb8àj¸àc8à¢xà«xàéxàï8àk¹â­¹¡bøà º/ïxàa8ào¸àfxà ‰ËˆÛÙN–Âˆ	Ü]Y]YH8¡¤ÐWIËˆ	ÜÝ[H8¡¤	Ëˆ	ÝÚ[H]Y]YH8àc9ên¸àiøàj¸àa	Ëˆ	È8¡¤TUQUQJ]Y]YJIËˆ	ÈÝ[H8¡¤Ý[H
È˜[YIËˆ	È›Y8¢h[8àj¸à¢HS”UQUQJ]Y]YK›Y
IËˆ	ÈœšYÚ8¢h[8àj¸à¢HS”UQUQJ]Y]YKœšYÚ
IËˆ	Ù[™Ú[IÂˆKˆ]N–ÞÛX™[‰ù§*	Ë^‰ÐJ˜[YOLŠxàk¹mé¹kdPŠ˜[YOMJxà ycìùkdPÊ˜[YOLJxà ¸àk¹cìùkdQ
˜[YOM
xà øàk¹mé¹kdQJ˜[YOLÊxà ¸àgxàk¹.å¸àk¹kd8àkÛ[8àiøàfxà ‰ßWKˆN‰Ðxà P¸à Pøàkºh!¸àjùcå¸à¢¹aî¸àeøà Pøàk¹kd8à¤¸à«xàéxàï8àn:/ïyb¨8àeùí`¸àb8àgùæí9o£8àkˆÝ[H8àj]Y]YH8àkûï'ÉËˆÜ[ÛœÎ–ÉÜÝ[OMË]Y]YOVÐËIË	ÜÝ[ON]Y]YOVÑKIË	ÜÝ[ON]Y]YOVÑWIË	ÜÝ[OLL‹]Y]YOVÑWI×KˆNŒ‹ˆ^Z[Ž‰Ðyo£8àkÜÝ[OL‹]Y]YOVÐ‹×xà P¹o£8àkÜÝ[OMË]Y]YOVÐËxà Pùo£8àkÜÝ[ON8àj8àj¸à¢¸à Pøàk¹mé¹kdxà¤¹§*ùl/¸àn:/ïyb¨8àfxà¢øàk¸àiÜ]Y]YOVÑWxàiøàfxà ‰ÂˆJB—JNÂ‚˜ÛÛœÝÕP’‘PÕÐ—Ñ’SSÔÓÓÕŒŒLWÒQÏSØš™XÝ™œ™Y^™JÕP’‘PÕÐ—Ñ’SSÔÓÓÕŒŒLWÒUSTË›X\
OžšY
JNÂ˜ÛÛœÝÕP’‘PÕÐ—Ñ’SSÔÓÓÕŒŒLWÐÓÓ•PÕÏSØš™XÝ™œ™Y^™JÂˆ™^[WÛØš—Ì‰ØK˜[YONË˜[YON	Ëˆ™^[WØš]ÌN‰ÌLLLLLx  ‰Ëˆ™^[WÝ™YWÌN‰ÜÝ[ON]Y]YOVÑWIÂŸJNÂ‚˜\ÜÙ\
—ÑVSWÐSÓ×ÒUSTË›[™ÝOOM	ÝŒŒLHÛÝ\˜ÙHš[˜[[ÛÜš]HÛÛšY	ÊNÂ˜\ÜÙ\
ÕP’‘PÕÐ—Ñ’SSÔÓÓÕŒŒLWÒQË™]™\žJYOˆP—ÑVSWÐSÓ×ÒUSTËœÛÛYJOžšYOOZY
JK	ÝŒŒLHš[˜[[ÛÜš]HYÛÛ\Ú[Û‰ÊNÂ—ÑVSWÐSÓ×ÒUSTËœ\Ú
‹‹”ÕP’‘PÕÐ—Ñ’SSÔÓÓÕŒŒLWÒUSTÊNÂ“Øš™XÝ˜\ÜÚYÛŠ—ÑVSWÐSÓ×ÐÓÓ•PÕËÕP’‘PÕÐ—Ñ’SSÔÓÓÕŒŒLWÐÓÓ•PÕÊNÂ”ÕP’‘PÕÐ—Ñ’SSÔÓÓÕŒŒLWÒQË™›Ü‘XXÚ
YO—Ñ’SSÒQÒÕPÑWÒQ×ÕŒŒ˜Y
Y
JNÂ™ÛØ˜[\Ë—Ñ’SSÒQÒÕPÑWÒQ×ÕŒŒVË‹‹—Ñ’SSÒQÒÕPÑWÒQ×ÕŒŒNÂ‚˜ÛÛœÝÕP’‘PÕÐ—Ñ’SSÕŒŒLWÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛXÞN‰Ùš[˜[X[ÛÜš]K\ÛÛY[œÚ]KY^[œÚ[Û‰ËˆÛÝ\˜ÙP]Y]‰ÝŒŒLYš[˜[ÚYÚÝ˜XÙWÜ›Ý][Û—Ù[œÚ]IËˆYYYÎ”ÕP’‘PÕÐ—Ñ’SSÔÓÓÕŒŒLWÒQËˆ[ÛÜš]TÛÛÛÝ[ËˆYÚ˜XÙTÛÛÛÝ[ŒMKˆYÚ˜XÙS]™[Î“Øš™XÝ™œ™Y^™JÉùª&y®¥‰ÎK	ùoç9å*	ÎŒLJKˆYÚ˜XÙQ›ÛÜŽ—Ñ’SSÒQÒÕPÑWÑ“ÓÔ—ÕŒŒˆÙ[XÝÜÚ[™ÙY™˜[ÙBŸJNÂ‚˜ÛÛœÝ×Ý˜[Y]TÝXš™XÝ”Ù[X[XÜÐ™Y›Ü™UŒŒLO]˜[Y]TÝXš™XÝ”Ù[X[XÜÎÂ˜[Y]TÝXš™XÝ”Ù[X[XÜÏY[˜Ý[ÛŠ
^ÂˆÛÛœÝ™]š[Ý\ÏW×Ý˜[Y]TÝXš™XÝ”Ù[X[XÜÐ™Y›Ü™UŒŒLJ
NÂˆÛÛœÝ\œ›ÜœÏJ™]š[Ý\Ë™\œ›Üœß×JK™š[\ŠOO™HOOIÙ^[H[ÛÜš]HÛÛ]\Ý™H	É‰ˆTÝš[™ÊJKœÝ\ÕÚ]
	Ù^[H[œÝÙ\‹\ÜÚ][ÛˆšX\Î‰ÊJNÂˆÛÛœÝ^[TÜÏVÌNÂˆ—ÑVSWÐSÓ×ÒUSTË™›Ü‘XXÚ
OOžÚYŠ[X™\‹š\Ò[YÙ\ŠK˜JI‰œK˜OL	‰œK˜O
Y^[TÜÖÜK˜WJÊÎßJNÂˆYŠ—ÑVSWÐSÓ×ÒUSTË›[™ÝOOMÊY\œ›ÜœËœ\Ú
^[H[ÛÜš]HÛÛ]\Ý™HÎˆ	Ð—ÑVSWÐSÓ×ÒUSTË›[™ÝX
NÂˆYŠ™]ÈÙ]
—ÑVSWÐSÓ×ÒUSTË›X\
OOœKšY
JKœÚ^™HOOP—ÑVSWÐSÓ×ÒUSTË›[™Ý
Y\œ›ÜœËœ\Ú
	Ù^[H[ÛÜš]HÛÛ\XØ]HY	ÊNÂˆYŠX]›X^
‹‹™^[TÜÊKSX]›Z[Š‹‹™^[TÜÊOŒJY\œ›ÜœËœ\Ú
^[H[œÝÙ\‹\ÜÚ][Ûˆ˜[[˜ÙNˆ	Ù^[TÜËš›Ú[Š	ËÉÊ_X
NÂˆÕP’‘PÕÐ—Ñ’SSÔÓÓÕŒŒLWÒUSTË™›Ü‘XXÚ
OOžÂˆYŠ—ÑVSWÐSÓ×ÐÓÓ•PÕÖÜKšYHOOTÝš[™ÊK›Ü[ÛœÖÜK˜WJJY\œ›ÜœËœ\Ú
	ÜKšYNˆŒŒLH^[HÙ[X[XÈšY
NÂˆJNÂˆÛÛœÝ[œÝÙ\”ÜÚ][ÛœÏ^Ë‹‹Š™]š[Ý\Ë˜[œÝÙ\”ÜÚ][ÛœßßJK^[N™^[TÜßNÂˆ™]\›ˆË‹‹œ™]š[Ý\ËÚÎ™\œ›ÜœË›[™ÝOOL\œ›ÜœË[œÝÙ\”ÜÚ][ÛœßNÂŸNÂ‚™ÛØ˜[\Ë”ÕP’‘PÕÐ—Ñ’SSÔÓÓÕŒŒLWÒUSTÏTÕP’‘PÕÐ—Ñ’SSÔÓÓÕŒŒLWÒUSTÎÂ™ÛØ˜[\Ë”ÕP’‘PÕÐ—Ñ’SSÔÓÓÕŒŒLWÒQÏTÕP’‘PÕÐ—Ñ’SSÔÓÓÕŒŒLWÒQÎÂ™ÛØ˜[\Ë”ÕP’‘PÕÐ—Ñ’SSÕŒŒLWÔÔPÏTÕP’‘PÕÐ—Ñ’SSÕŒŒLWÔÔPÎÂ‹ËÈOOOOH‘HUQTÕŒŒMÝXš™XÝˆš[˜[\˜XÝXÙH›ØÚË[Ü™\ˆšY[]H™\Z\ˆOOOOB˜ÛÛœÝÕP’‘PÕÐ—Ñ’SSÓÔ‘T—ÕŒŒMÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛXÞN‰Ùš[˜[\˜XÝXÙKX[ÛÜš]K][‹\ÙXÝ\š]KX›ØÚË[Ü™\‰ËˆÛÝ\˜ÙP]Y]‰ÝŒŒLËYš[˜[Ü]Y\Ý[Û—ÛÜ™\—ÙšY[]IËˆ[ÛÜš]P›ØÚÐÛÝ[—Ñ’SSÐSÓ×ÐÓÕS•ˆÙXÝ\š]P›ØÚÐÛÝ[—Ñ’SSÔÑP×ÐÓÕS•ˆÙ[XÝYÙ]Ú[™ÙY™˜[ÙKˆÙ[XÝÜÚ[™ÙY™˜[ÙKˆÝX›T\][Û“Û›NYBŸJNÂ‚˜ÛÛœÝ×ØZ[‘š[˜[™Y›Ü™UŒŒMXZ[‘š[˜[Â˜Z[‘š[˜[Y[˜Ý[ÛŠ
^ÂˆÛÛœÝÙ[XÝYW×ØZ[‘š[˜[™Y›Ü™UŒŒM

NÂˆÛÛœÝ[ÛÏ\Ù[XÝY™š[\ŠOžËšÚ[™OOIØ[ÛÉÊNÂˆÛÛœÝÙXÏ\Ù[XÝY™š[\ŠOžËšÚ[™OOIÜÙXÝ\š]IÊNÂˆÛÛœÝÜ™\™YVË‹‹˜[ÛË‹‹œÙX×NÂˆ\ÜÙ\
Ü™\™Y›[™ÝOOP—Ñ’SSÐÓÕS•	‰˜[ÛË›[™ÝOOP—Ñ’SSÐSÓ×ÐÓÕS•	‰œÙXË›[™ÝOOP—Ñ’SSÔÑP×ÐÓÕS•	ÝŒŒMš[˜[›ØÚÈÛÝ[šY	ÊNÂˆ\ÜÙ\
Ü™\™YœÛXÙJ—Ñ’SSÐSÓ×ÐÓÕS•
K™]™\žJOžËšÚ[™OOIØ[ÛÉÊK	ÝŒŒM[ÛÜš]H›ØÚÈÜ™\ˆšY	ÊNÂˆ\ÜÙ\
Ü™\™YœÛXÙJ—Ñ’SSÐSÓ×ÐÓÕS•
K™]™\žJOžËšÚ[™OOIÜÙXÝ\š]IÊK	ÝŒŒMÙXÝ\š]H›ØÚÈÜ™\ˆšY	ÊNÂˆ\ÜÙ\
™]ÈÙ]
Ü™\™Y›X\
O˜	ÞšÚ[™N‰ÞœÛÝ\˜ÙRYX
JKœÚ^™OOO[Ü™\™Y›[™Ý	ÝŒŒMÝX›H\][Ûˆ\XØ]HY	ÊNÂˆ™]\›ˆÜ™\™YÂŸNÂ‚™ÛØ˜[\Ë”ÕP’‘PÕÐ—Ñ’SSÓÔ‘T—ÕŒŒMÔÔPÏTÕP’‘PÕÐ—Ñ’SSÓÔ‘T—ÕŒŒMÔÔPÎÂ™ÛØ˜[\Ë—×ØZ[‘š[˜[™Y›Ü™UŒŒMW×ØZ[‘š[˜[™Y›Ü™UŒŒMÂ‹ËÈOOOOH‘HUQTÕŒŒMÈÝXš™XÝˆš[˜[\˜XÝXÙHÜ›Û™ËX[œÝÙ\ˆ™XÛÝ™\žHš\ÚXš[]H™\Z\ˆOOOOB˜ÛÛœÝÕP’‘PÕÐ—Ñ’SSÔ‘SQQPUSÓ—ÕŒŒM×ÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛXÞN‰ÜÝ\™˜XÙKYš[˜[]Ü›Û™ËX[œÝÙ\‹\™XÛÝ™\žKY[žIËˆÛÝ\˜ÙP]Y]‰ÝŒŒM‹Yš[˜[ÝÜ›Û™×Ø[œÝÙ\—Ü™XÛÝ™\žWÝš\ÚXš[]IËˆÙY\Ñ›ÜØ\™XÝ[Û”š[X\žNYKˆÙY\Ñ[™]šY]ÐÛÛ\ÚX›NYKˆ™XÛÝ™\žQ[žSÛ›UÚ[“™YYYYKˆ›[šÐ[œÝÙ\œÒ[˜ÛYYYBŸJNÂ‚›]×Ø‘š[˜[™XÛÝ™\žP][\ŒŒMÏ[[Â‚™[˜Ý[Ûˆ[œÝ\™P‘š[˜[™XÛÝ™\žQ[žUŒŒMÊ
^ÂˆÛÛœÝ™\Ý[YØÝ[Y[™Ù][[Y[žRY
	Ø‘š[˜[™\Ý[	ÊNÂˆÛÛœÝXÝ[ÛœÏ\™\Ý[Ëœ]Y\žTÙ[XÝÜŠ	Ë˜›[ØÚË\™\Ý[XXÝ[ÛœÉÊNÂˆYŠ\™\Ý[XXÝ[ÛœÊ\™]\›ˆ[Âˆ]YØÝ[Y[™Ù][[Y[žRY
	Ø‘š[˜[™XÛÝ™\žUŒŒMÉÊNÂˆÛÛœÝ]Z[\™\Ý[œ]Y\žTÙ[XÝÜŠ	Ù]Z[Ëœ™\Ý[Y]Z[Y›Û	ÊNÂˆYŠ]Z[	‰ˆY]Z[šY
Y]Z[šYIØ‘š[˜[™]šY]Ñ]Z[ŒŒMÉÎÂˆYŠXŠ^ÂˆYØÝ[Y[˜Ü™X]Q[[Y[
	Ø]Û‰ÊNÂˆ‹\OIØ]Û‰ÎÂˆ‹šYIØ‘š[˜[™XÛÝ™\žUŒŒMÉÎÂˆ‹˜Û\ÜÓ˜[YOIÜÙXÛÛ™\žIÎÂˆ‹šY[]YNÂˆYŠ]Z[
X‹œÙ]]šX]J	Ø\šXKXÛÛ›ÛÉË]Z[šY
NÂˆ‹œÙ]]šX]J	Ø\šXKY^[™Y	Ë	Ù˜[ÙIÊNÂˆ‹˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOžÂˆÛÛœÝ™]šY]Ï\™\Ý[œ]Y\žTÙ[XÝÜŠ	Ù]Z[Ëœ™\Ý[Y]Z[Y›Û	ÊNÂˆYŠ\™]šY]Ê\™]\›ŽÂˆ™]šY]Ë›Ü[]YNÂˆ‹œÙ]]šX]J	Ø\šXKY^[™Y	Ë	ÝYIÊNÂˆ™\]Y\Ý[š[X][Û‘œ˜[YJ

OOžÂˆÛÛœÝš\œÝ™YYÔ™]šY]Ï\™\Ý[œ]Y\žTÙ[XÝÜŠ	Ë˜™š[˜[\™]šY]ËZ][KÜ›Û™ÉÊNÂˆYŠYš\œÝ™YYÔ™]šY]Ê\™]\›ŽÂˆš\œÝ™YYÔ™]šY]ËœÙ]]šX]J	ÝXš[™^	Ë	ËLIÊNÂˆš\œÝ™YYÔ™]šY]Ë™›ØÝ\Ê
NÂˆš\œÝ™YYÔ™]šY]ËœØÜ›Û[ÕšY]ÊØ™Z]š[ÜŽ‰ÜÛ[ÛÝ	Ë›ØÚÎ‰ØÙ[\‰ßJNÂˆJNÂˆJNÂˆÛÛœÝ›ÜØ\™YØÝ[Y[™Ù][[Y[žRY
	Ø‘š[˜[˜XÚÓY[IÊNÂˆXÝ[ÛœËš[œÙ\™Y›Ü™J‹›ÜØ\™XÝ[ÛœË™š\œÝÚ[
NÂˆBˆ™]\›ˆŽÂŸB‚™[˜Ý[Ûˆ\]P‘š[˜[™XÛÝ™\žQ[žUŒŒMÊJ^ÂˆÛÛœÝY[œÝ\™P‘š[˜[™XÛÝ™\žQ[žUŒŒMÊ
NÂˆYŠXŠ\™]\›ŽÂˆÛÛœÝ™\Ý[YØÝ[Y[™Ù][[Y[žRY
	Ø‘š[˜[™\Ý[	ÊNÂˆÛÛœÝ]Z[\™\Ý[Ëœ]Y\žTÙ[XÝÜŠ	Ù]Z[Ëœ™\Ý[Y]Z[Y›Û	ÊNÂˆÛÛœÝÛÜœ™XÝSX]›X^
X]›Z[Š—Ñ’SSÐÓÕS•[X™\ŠOË˜ÛÜœ™XÝ
_
JNÂˆÛÛœÝ›[šÏSX]›X^
X]›Z[Š—Ñ’SSÐÓÕS•XÛÜœ™XÝ[X™\ŠOË˜›[šÊ_
JNÂˆÛÛœÝ™YYÔ™]šY]ÏSX]›X^
—Ñ’SSÐÓÕS•XÛÜœ™XÝ
NÂˆ‹šY[[™YYÔ™]šY]ÏOOLÂˆ‹œÙ]]šX]J	Ø\šXKY^[™Y	Ë]Z[Ë›Ü[ÉÝYIÎ‰Ù˜[ÙIÊNÂˆYŠ™YYÔ™]šY]ÏOOL
^Âˆ‹^ÛÛ[Iú*©9ëe8à¤¹oªyïä¸àfxà¢ÉÎÂˆ™]\›ŽÂˆBˆ‹^ÛÛ[X›[šÏŒØ:*©9ëe8àîù§*¹fç¹ëe8à¤¹oªyïä¸àfxà¢ûï"	Û™YYÔ™]šY]ßyecûï"X˜:*©9ëe8à¤¹oªyïä¸àfxà¢ûï"	Û™YYÔ™]šY]ßyecûï"XÂŸB‚˜ÛÛœÝ×Ü™[™\‘š[˜[™\Ý[™Y›Ü™UŒŒMÏ\™[™\‘š[˜[™\Ý[Âœ™[™\‘š[˜[™\Ý[Y[˜Ý[ÛŠKX\›™Y
^ÂˆÛÛœÝ™\Ý[YØÝ[Y[™Ù][[Y[žRY
	Ø‘š[˜[™\Ý[	ÊNÂˆÛÛœÝ]Z[\™\Ý[Ëœ]Y\žTÙ[XÝÜŠ	Ù]Z[Ëœ™\Ý[Y]Z[Y›Û	ÊNÂˆÛÛœÝ\Ó™]Ð][\XHOOW×Ø‘š[˜[™XÛÝ™\žP][\ŒŒMÎÂˆYŠ\Ó™]Ð][\	‰™]Z[
Y]Z[›Ü[Y˜[ÙNÂˆ×Ü™[™\‘š[˜[™\Ý[™Y›Ü™UŒŒMÊKX\›™Y
NÂˆ×Ø‘š[˜[™XÛÝ™\žP][\ŒŒMÏXNÂˆ\]P‘š[˜[™XÛÝ™\žQ[žUŒŒMÊJNÂŸNÂ‚™ÛØ˜[\Ë”ÕP’‘PÕÐ—Ñ’SSÔ‘SQQPUSÓ—ÕŒŒM×ÔÔPÏTÕP’‘PÕÐ—Ñ’SSÔ‘SQQPUSÓ—ÕŒŒM×ÔÔPÎÂ‹ËÈOOOOH‘HUQTÕŒŒNHÝXš™XÝˆš[˜[\˜XÝXÙHY\ÜØYÙHÛÛœÚ\Ý[˜ÞH™\Z\ˆOOOOB˜ÛÛœÝÕP’‘PÕÐ—Ñ’SSÖÕŒŒNWÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛXÞN‰Ü™\Ù\™KYš[˜[YX\›™Y^[Y\ÜØYÙK[Û‹\Ø[YKX][\\™\™[™\‰ËˆÛÝ\˜ÙP]Y]‰ÝŒŒNYš[˜[Ü™XÛÝ™\žWÞÛY\ÜØYÙWÜ™\™[™\‰ËˆØÛÜš[™ÐÚ[™ÙY™˜[ÙKˆ\œÚ\ÝYÚ[™ÙY™˜[ÙKˆ™X\ÛÛ’\ÝÜžPÚ[™ÙY™˜[ÙKˆ™[YYX][Û•\™Ù]ÐÚ[™ÙY™˜[ÙKˆ™XÛÝ™\žQ[žPÚ[™ÙY™˜[ÙKˆ\Ü^SÛ›NYKˆŒÌÎR[YÜ˜][ÛŽ‰Ù^XÚ]Yš[˜[\™\Ý[\\[[™IÂŸJNÂ‚˜ÛÛœÝ×Ø‘š[˜[X\›™Y\Ü^UŒŒNO[™]ÈÙXZÓX\

NÂ™[˜Ý[ÛˆÝXš™XÝ‘š[˜[X\›™Y›Ü”™[™\•ŒŒNJKX\›™Y
^ÂˆÛÛœÝ›Ü›X[^™YSX]›X^
[X™\ŠX\›™Y
_
NÂˆYŠI‰\[ÙˆOOOIÛØš™XÝ	Ê^ÂˆYŠ›Ü›X[^™YŒW×Ø‘š[˜[X\›™Y\Ü^UŒŒNKš\ÊJJW×Ø‘š[˜[X\›™Y\Ü^UŒŒNKœÙ]
K›Ü›X[^™Y
NÂˆ™]\›ˆ×Ø‘š[˜[X\›™Y\Ü^UŒŒNK™Ù]
JNÂˆBˆ™]\›ˆ›Ü›X[^™YÂŸB‚™ÛØ˜[\Ë”ÕP’‘PÕÐ—Ñ’SSÖÕŒŒNWÔÔPÏTÕP’‘PÕÐ—Ñ’SSÖÕŒŒNWÔÔPÎÂ™ÛØ˜[\ËœÝXš™XÝ‘š[˜[X\›™Y›Ü”™[™\•ŒŒNO\ÝXš™XÝ‘š[˜[X\›™Y›Ü”™[™\•ŒŒNNÂ‚‹Êˆ‘HUQTÕŒŒŒˆ8 %ÝXš™XÝˆ™XY[™\ÜËX]Ø\™H™XÛÛ[Y[™][Ûˆ™\Z\ˆ
‹Â˜ÛÛœÝÕP’‘PÕÐ—Ô‘PQS‘TÔ×ÕŒŒŒ—ÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛXÞN‰ÙØ]KYš[˜[\˜XÝXÙKXžKY[[ÛœÝ˜]Y\ÚÜ\˜XÝXÙKX[™Yš\œÝYš[˜[Y]šY[˜ÙIËˆÛÝ\˜ÙP]Y]‰ÝŒŒŒK\ÝXš™XÝØ—Ü›ÙÜ™\ÜÚ[Û—Ü™XY[™\Ü×Ø›[™™\ÜÉËˆÚÜ˜XÝXÙQ›ÛÜŽKˆš\œÝš[˜[›ÛÜŽKˆ™\Ù\™\Ñ›Ý[™][Û“Ü™\ŽYKˆ™\Ù\™\Ñ^[U™YQ^T[NYKˆ™\Ù\™\ÓXZ[[˜[˜ÙT›Ý][™ÎYKˆ]Y\Ý[Û”Ù[XÝ[ÛÚ[™ÙY™˜[ÙKˆØÛÜš[™ÐÚ[™ÙY™˜[ÙKˆ[Z[™ÐÚ[™ÙY™˜[ÙKˆ™[YYX][Û•\™Ù]ÐÚ[™ÙY™˜[ÙBŸJNÂ‚™[˜Ý[ÛˆÝXš™XÝ”™XY[™\ÜÔ˜]UŒŒŒŠ[ÙJ^ÂˆYŠ[ÙOOOIÛZ[šS[ØÚÉÊH™]\›ˆ[X™\Š›Ùš[K˜“[ØÚÒ\ÝÜžOË–ÌOËœ˜]OÏÌ
NÂˆYŠ[ÙOOOIÜÙXÝ\š]S[ØÚÉÊH™]\›ˆ[X™\Š›Ùš[KœÙXÝ\š]S[ØÚÒ\ÝÜžOË–ÌOËœ˜]OÏÌ
NÂˆYŠ[ÙOOOIØÛÛ\Ý[™	Ê^ÂˆÛÛœÝ›ÝÜÏJ›Ùš[K˜ÛÛ\Ý[™\ÝÜž_×JKœÛXÙJÊK›X\
O“[X™\ŠËœ˜]OÏÌ
JK™š[\Š[X™\‹š\Ñš[š]JNÂˆ™]\›ˆ›ÝÜË›[™ÝÓX]œ›Ý[™
›ÝÜËœ™YXÙJ
KŠOO˜JØ‹
KÜ›ÝÜË›[™Ý
NŒÂˆBˆ™]\›ˆÂŸB™[˜Ý[ÛˆÝXš™XÝ”™XY[™\ÜÐÛÝ[ŒŒŒŠ[ÙJ^ÂˆYŠ[ÙOOOIÛZ[šS[ØÚÉÊH™]\›ˆ
›Ùš[K˜“[ØÚÒ\ÝÜž_×JK›[™ÝÂˆYŠ[ÙOOOIÜÙXÝ\š]S[ØÚÉÊH™]\›ˆ
›Ùš[KœÙXÝ\š]S[ØÚÒ\ÝÜž_×JK›[™ÝÂˆYŠ[ÙOOOIØÛÛ\Ý[™	ÊH™]\›ˆ
›Ùš[K˜ÛÛ\Ý[™\ÝÜž_×JK›[™ÝÂˆ™]\›ˆÂŸB™[˜Ý[ÛˆÝXš™XÝ”ÚÜ]šY[˜ÙUŒŒŒŠ
^ÂˆÛÛœÝ›ÝÜÏVÂˆÛ[ÙN‰ÛZ[šS[ØÚÉË]N‰øà¨¸àêøà­8àê¸à®¸àè8àçøàâùª(z*i‰ËXÛÛŽ‰ü'äçIË˜]NœÝXš™XÝ”™XY[™\ÜÔ˜]UŒŒŒŠ	ÛZ[šS[ØÚÉÊ_KˆÛ[ÙN‰ÜÙXÝ\š]S[ØÚÉË]N‰øà®øà«xàéxàê¸àá¸à¨È8àçøàâùª(z*i‰ËXÛÛŽ‰ü'æè{î#ÉË˜]NœÝXš™XÝ”™XY[™\ÜÔ˜]UŒŒŒŠ	ÜÙXÝ\š]S[ØÚÉÊ_KˆÛ[ÙN‰ØÛÛ\Ý[™	Ë]N‰ú)!ùd"9ecúhc	ËXÛÛŽ‰ü'éêIË˜]NœÝXš™XÝ”™XY[™\ÜÔ˜]UŒŒŒŠ	ØÛÛ\Ý[™	Ê_BˆNÂˆ›ÝÜËœÛÜ

KŠOO˜Kœ˜]KX‹œ˜]JNÂˆ™]\›ˆ›ÝÜÎÂŸB™[˜Ý[ÛˆÝXš™XÝ”™XY[™\ÜÔ˜XÝXÙT™XÕŒŒŒŠ›ÝË™X\ÛÛŠ^ÂˆÛÛœÝ›ÛÜTÕP’‘PÕÐ—Ô‘PQS‘TÔ×ÕŒŒŒ—ÔÔPËœÚÜ˜XÝXÙQ›ÛÜŽÂˆ™]\›ˆÂˆÝYÙNŒË[ÙNœ›ÝË›[ÙKY›[]N˜	Ü›ÝË]_xàiù®¥¹`¦XXÛÛŽœ›ÝËšXÛÛ‹ˆÚXÚÙ\Ž‰øà®xàá¸ààøàåÈøàîùíãùd"9k§ù¢)¸àk¹bcxàjÉËˆ\ØÎœ™X\ÛÛOOIÙš\œÝš[˜[	ÂˆØyfç¹æë¸àk¹íãùd"9k§ù¢)¸àiùo,yà®xàc:)¢øài8àbøà¢¸ào¸àeøàgøà ‰Ü›ÝË]_xà¤Œyfç¹è®º*£xàeøà IÙ›ÛÜŸIy.éy."¸à¤¹æë¹k¢xàjøàeøài¸àbøà¢L¹fç¹æë¸àn:`,¸àoøào¸àfxà ˜ˆ˜9æí:/äxàk¹«hùëe9ã¡øàkÉÜ›ÝËœ˜]_Ixàiøàfxà ŒL9b!¸àk¹íãùd"9k§ù¢)¸àn:`,¸à 9bcxàjøà IÜ›ÝË]_xàiÉÙ›ÛÜŸIy.éy."¸à¤¹æë¹k¢xàjùè®º*£xàeøào¸àfxà ˜ˆNÂŸB™[˜Ý[ÛˆÝXš™XÝ‘š\œÝš[˜[Ù^UŒŒŒŠŠ^ÂˆYŠ\Š\™]\›ˆ	ÉÎÂˆ™]\›ˆÜ‹™]_	ÉË[X™\Š‹œ˜]OÏÌ
K[X™\Š‹˜ÛÜœ™XÝÏÌ
K[X™\Š‹˜›[šÏÏÌ
K[X™\Š‹œÙXÛÛ™ÏÏÌ
WKš›Ú[Š	ß	ÊNÂŸB™[˜Ý[ÛˆÝXš™XÝ‘š\œÝš[˜[\™Ù]ŒŒŒŠŠ^ÂˆÛÛœÝ[ÛÔ˜]OSX]œ›Ý[™
[X™\ŠË˜[ÛÐÛÜœ™XÝÏÌ
KÓX]›X^
K—Ñ’SSÐSÓ×ÐÓÕS•
JŒL
NÂˆÛÛœÝÙXÔ˜]OSX]œ›Ý[™
[X™\ŠËœÙXÐÛÜœ™XÝÏÌ
KÓX]›X^
K—Ñ’SSÔÑP×ÐÓÕS•
JŒL
NÂˆYŠÙXÔ˜]O[ÛÔ˜]J^Âˆ™]\›ˆÛ[ÙN‰ÜÙXÝ\š]S[ØÚÉË]N‰øà®øà«xàéxàê¸àá¸à¨È8àçøàâùª(z*i‰ËXÛÛŽ‰ü'æè{î#ÉË˜]NœÝXš™XÝ”™XY[™\ÜÔ˜]UŒŒŒŠ	ÜÙXÝ\š]S[ØÚÉÊ_NÂˆBˆÛÛœÝ[ÛÏVÂˆÛ[ÙN‰ÛZ[šS[ØÚÉË]N‰øà¨¸àêøà­8àê¸à®¸àè8àçøàâùª(z*i‰ËXÛÛŽ‰ü'äçIË˜]NœÝXš™XÝ”™XY[™\ÜÔ˜]UŒŒŒŠ	ÛZ[šS[ØÚÉÊ_KˆÛ[ÙN‰ØÛÛ\Ý[™	Ë]N‰ú)!ùd"9ecúhc	ËXÛÛŽ‰ü'éêIË˜]NœÝXš™XÝ”™XY[™\ÜÔ˜]UŒŒŒŠ	ØÛÛ\Ý[™	Ê_BˆKœÛÜ

KŠOO˜Kœ˜]KX‹œ˜]JNÂˆ™]\›ˆ[ÛÖÌNÂŸB‚˜ÛÛœÝÜÝXš™XÝ’X”™XÛÛ[Y[™][Û•ŒŒŒ\ÝXš™XÝ’X”™XÛÛ[Y[™][ÛŽÂœÝXš™XÝ’X”™XÛÛ[Y[™][ÛY[˜Ý[ÛŠ
^ÂˆÛÛœÝ™XÏWÜÝXš™XÝ’X”™XÛÛ[Y[™][Û•ŒŒŒŠ
NÂˆÛÛœÝ^\ÏY^[Q^\Ô™[XZ[š[™Ê
NÂˆÛÛœÝš[˜[[ÝÙYHJ^\ÈO[[	‰™^\ÏL	‰™^\ÏLÊNÂˆYŠYš[˜[[ÝÙY\™Xß™XË›[ÙHOOIÙš[˜[	ÊH™]\›ˆ™XÎÂˆÛÛœÝO\ÝXš™XÝ”›ÙÜ™\ÜÓY]šXÜÊ
NÂˆÛÛœÝ›ÛÜTÕP’‘PÕÐ—Ô‘PQS‘TÔ×ÕŒŒŒ—ÔÔPËœÚÜ˜XÝXÙQ›ÛÜŽÂˆYŠK™š[˜[[œÏOOL
^ÂˆÛÛœÝÙXZÙ\Ý\ÝXš™XÝ”ÚÜ]šY[˜ÙUŒŒŒŠ
VÌNÂˆYŠÙXZÙ\Ý	‰ÙXZÙ\Ýœ˜]O›ÛÜŠH™]\›ˆÝXš™XÝ”™XY[™\ÜÔ˜XÝXÙT™XÕŒŒŒŠÙXZÙ\Ý	Ü™Qš[˜[	ÊNÂˆ™]\›ˆ™XÎÂˆBˆYŠK™š[˜[[œÏOOLJ^ÂˆÛÛœÝš\œÝ\›Ùš[K˜‘š[˜[\ÝÜžOË–ÌNÂˆYŠ[X™\Šš\œÝËœ˜]OÏÌL
OTÕP’‘PÕÐ—Ô‘PQS‘TÔ×ÕŒŒŒ—ÔÔPË™š\œÝš[˜[›ÛÜŠH™]\›ˆ™XÎÂˆÛÛœÝ\™Ù]\ÝXš™XÝ‘š\œÝš[˜[\™Ù]ŒŒŒŠš\œÝ
NÂˆÛÛœÝÙ^O\ÝXš™XÝ‘š\œÝš[˜[Ù^UŒŒŒŠš\œÝ
NÂˆYŠ\›Ùš[KœÝXš™XÝ”™XY[™\ÜÕŒŒŒŸ›Ùš[KœÝXš™XÝ”™XY[™\ÜÕŒŒŒ‹™š\œÝš[˜[Ù^HOOZÙ^J^Âˆ›Ùš[KœÝXš™XÝ”™XY[™\ÜÕŒŒŒ^Ùš\œÝš[˜[Ù^NšÙ^K\™Ù][ÙN\™Ù]›[ÙK\™Ù][ÛÝ[œÝXš™XÝ”™XY[™\ÜÐÛÝ[ŒŒŒŠ\™Ù]›[ÙJ_NÂˆØ]™T›Ùš[J
NÂˆBˆÛÛœÝX\šÙ\\›Ùš[KœÝXš™XÝ”™XY[™\ÜÕŒŒŒŽÂˆÛÛœÝX\šÙY\™Ù]]\™Ù]›[ÙOOO[X\šÙ\‹\™Ù][ÙOÝ\™Ù]žÂˆ[ÙN›X\šÙ\‹\™Ù][ÙKˆ]N›X\šÙ\‹\™Ù][ÙOOOIÜÙXÝ\š]S[ØÚÉÏÉøà®øà«xàéxàê¸àá¸à¨È8àçøàâùª(z*i‰Î›X\šÙ\‹\™Ù][ÙOOOIØÛÛ\Ý[™	ÏÉú)!ùd"9ecúhc	Î‰øà¨¸àêøà­8àê¸à®¸àè8àçøàâùª(z*i‰ËˆXÛÛŽ›X\šÙ\‹\™Ù][ÙOOOIÜÙXÝ\š]S[ØÚÉÏÉü'æè{î#ÉÎ›X\šÙ\‹\™Ù][ÙOOOIØÛÛ\Ý[™	ÏÉü'éêIÎ‰ü'äçIËˆ˜]NœÝXš™XÝ”™XY[™\ÜÔ˜]UŒŒŒŠX\šÙ\‹\™Ù][ÙJBˆNÂˆÛÛœÝ˜XÝXÙY\ÝXš™XÝ”™XY[™\ÜÐÛÝ[ŒŒŒŠX\šÙ\‹\™Ù][ÙJO“[X™\ŠX\šÙ\‹\™Ù][ÛÝ[ÏÌ
NÂˆYŠ\˜XÝXÙYÝXš™XÝ”™XY[™\ÜÔ˜]UŒŒŒŠX\šÙ\‹\™Ù][ÙJO›ÛÜŠ^Âˆ™]\›ˆÝXš™XÝ”™XY[™\ÜÔ˜XÝXÙT™XÕŒŒŒŠX\šÙY\™Ù]	Ùš\œÝš[˜[	ÊNÂˆBˆBˆ™]\›ˆ™XÎÂŸNÂ‚™ÛØ˜[\Ë”ÕP’‘PÕÐ—Ô‘PQS‘TÔ×ÕŒŒŒ—ÔÔPÏTÕP’‘PÕÐ—Ô‘PQS‘TÔ×ÕŒŒŒ—ÔÔPÎÂ‚‹Êˆ‘HUQTÕŒŒ8 %ÝXš™XÝˆÛÛ\Ý[™\™XY[™\ÜÈÛÜHÛ\š]H™\Z\ˆ
‹Â˜ÛÛœÝÕP’‘PÕÐ—Ô‘PQS‘TÔ×ÐÓÔWÕŒŒÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛXÞN‰ØÛ\šYžKXÛÛ\Ý[™\™XY[™\ÜËXÛÜK]Ú]]™YKX][\X]™\˜YÙIËˆÛÝ\˜ÙP]Y]‰ÝŒŒŒËXÛÛ\Ý[™Ü™[YYX][Û—ÝÚ[™Ý×ÛY\ÜØYÙIËˆÛÛ\Ý[™]šY[˜ÙUÚ[™ÝÎŒËˆÚÜ˜XÝXÙQ›ÛÜŽKˆÚ[™Ù\Ô™XÛÛ[Y[™][ÛÛÜSÛ›NYKˆ™XÛÛ[Y[™][Û“[ÙPÚ[™ÙY™˜[ÙKˆ™XY[™\ÜÐØ[Ý[][ÛÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û”Ù[XÝ[ÛÚ[™ÙY™˜[ÙKˆØÛÜš[™ÐÚ[™ÙY™˜[ÙKˆ[Z[™ÐÚ[™ÙY™˜[ÙKˆ\œÚ\Ý[˜ÙPÚ[™ÙY™˜[ÙKˆ™[YYX][Û•\™Ù]ÐÚ[™ÙY™˜[ÙBŸJNÂ‚˜ÛÛœÝÜÝXš™XÝ”™XY[™\ÜÔ˜XÝXÙT™XÕŒŒ\ÝXš™XÝ”™XY[™\ÜÔ˜XÝXÙT™XÕŒŒŒŽÂœÝXš™XÝ”™XY[™\ÜÔ˜XÝXÙT™XÕŒŒŒY[˜Ý[ÛŠ›ÝË™X\ÛÛŠ^ÂˆÛÛœÝ™XÏWÜÝXš™XÝ”™XY[™\ÜÔ˜XÝXÙT™XÕŒŒ
›ÝË™X\ÛÛŠNÂˆYŠ›ÝÏË›[ÙHOOIØÛÛ\Ý[™	ÊH™]\›ˆ™XÎÂˆÛÛœÝ›ÛÜTÕP’‘PÕÐ—Ô‘PQS‘TÔ×ÐÓÔWÕŒŒÔÔPËœÚÜ˜XÝXÙQ›ÛÜŽÂˆ™XË™\ØÏ\™X\ÛÛOOIÙš\œÝš[˜[	ÂˆØyfç¹æë¸àk¹íãùd"9k§ù¢)¸àiùo,yà®xàc:)¢øài8àbøà¢¸ào¸àeøàgøà º)!ùd"9ecúhc8àkùæí:/äLùfç¸àk¹nlùgaù«hùëe9ã¡øàiùb)9k¦¸àeøào¸àfxà ¹nlùgaÉÙ›ÛÜŸIy.éy."¸à¤¹æë¹k¢xàjù¥m8àb8ài¸àbøà¢L¹fç¹æë¸àn:`,¸àoøào¸àfxà ˜ˆ˜9æí:/äLùfç¸àk¹nlùgaù«hùëe9ã¡øàkÉÜ›ÝËœ˜]_Ixàiøàfxà ŒL9b!¸àk¹íãùd"9k§ù¢)¸àn:`,¸à 9bcxàjøà z)!ùd"9ecúhc8àk¹nlùgaù«hùëe9ã¡ÉÙ›ÛÜŸIy.éy."¸à¤¹æë¹k¢xàjùè®º*£xàeøào¸àfxà ˜Âˆ™]\›ˆ™XÎÂŸNÂ‚™ÛØ˜[\Ë”ÕP’‘PÕÐ—Ô‘PQS‘TÔ×ÐÓÔWÕŒŒÔÔPÏTÕP’‘PÕÐ—Ô‘PQS‘TÔ×ÐÓÔWÕŒŒÔÔPÎÂ‚‹Êˆ‘HUQTÕŒŒÈ8 %ÝXš™XÝˆ[ÛÜš]KYÛXZ[‹X]Ø\™H›ÙÜ™\ÜÚ[Ûˆ™\Z\ˆ
‹Â˜ÛÛœÝÕP’‘PÕÐ—ÐSÓÔ’UWÑÓPRS—Ô“ÑÔ‘TÔÒSÓ—ÕŒŒ×ÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛXÞN‰Ü›Ý]KXÛÛ˜Ù[˜]YYš\œÝYš[˜[X[ÛÜš]K]ÙXZÛ™\ÜË]›ÝYÚY^\Ý[™ËYÛXZ[‹]˜XÙKX™Y›Ü™KYÙ[™\šXË[Z[šK[[ØÚÉËˆÛÝ\˜ÙP]Y]‰ÝŒŒ‹X[ÛÜš]WÙÛXZ[—ÝÙXZÛ™\Ü×Û›ÝØYÙÜ™YØ]YÙ›Ü—Ü›ÙÜ™\ÜÚ[Û‰ËˆZ[•Ý[Z\ÝZÙ\ÎˆZ[‘ÛXZ[“Z\ÝZÙ\ÎŒ‹ˆZ[‘\Ý[˜Ý][\ÎŒ‹ˆZ[‘ÛXZ[‘\œ›Ü”˜]T\˜Ù[ÍKˆZ[‘ÛXZ[“Z\ÝZÙTÚ\™T\˜Ù[ŒŒˆ\]X[Z\ÝZÙPÛÝ[˜]SXY\˜Ù[ŒKˆ˜[˜XÚÓ[ÙN‰ÛZ[šS[ØÚÉËˆ™]\Ù\Ñ^\Ý[™ÑÛXZ[“X™[ÎYKˆ™]\Ù\Ñ^\Ý[™Ô™[YYX][Û•\™Ù]ÎYKˆ™\Ù\™\Ñ^[U™YQ^T[NYKˆ™XY[™\ÜÕ™\ÚÛÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û”Ù[XÝ[ÛÚ[™ÙY™˜[ÙKˆØÛÜš[™ÐÚ[™ÙY™˜[ÙKˆ[Z[™ÐÚ[™ÙY™˜[ÙKˆÙXÝ\š]T›Ý][™ÐÚ[™ÙY™˜[ÙKˆ\™XÝš[˜[™[YYX][ÛÚ[™ÙY™˜[ÙKˆ›Ùš[TØÚ[XSZYÜ˜][Û”™\]Z\™Y™˜[ÙBŸJNÂ‚™[˜Ý[ÛˆÝXš™XÝ[ÛÜš]QÛXZ[‘]šY[˜ÙUŒŒÊ
^ÂˆÛÛœÝ›ÝÜÏ^ßNÂˆ›ÜŠÛÛœÝ][HÙˆ—ÑVSWÐSÓ×ÒUSTÊ^ÂˆÛÛœÝ[XZÙQš[˜[[ÛÑ^[J][JNÂˆÛÛœÝÛXZ[Y™ÛXZ[Ÿ][K™ÛXZ[Ÿ	ù¤ë9//:* :*§‰ÎÂˆYŠ\›ÝÜÖÙÛXZ[—J\›ÝÜÖÙÛXZ[—O^ÙÛXZ[‹Z\ÜÙ\ÎŒÙY[ŽŒ\Ý[˜ÝZ\ÜÙY][\ÎŒNÂˆÛÛœÝ›ÝÏ\›ÝÜÖÙÛXZ[—NÂˆÛÛœÝÙ^OX‘š[˜[Z\ÝZÙRÙ^J
NÂˆÛÛœÝZ\ÜÙ\ÏSX]›X^
[X™\Š›Ùš[K˜‘š[˜[Z\ÝZÙTÝ]ÏË–ÚÙ^WOË›Z\ÜÙ\Ê_
NÂˆÛÛœÝÙY[SX]›X^
[X™\Š›Ùš[K˜‘š[˜[Ý]ÏË–Ø[ÛÎ‰ÙœÛÝ\˜ÙRYXOËœÙY[Š_
NÂˆ›ÝË›Z\ÜÙ\ÊÏ[Z\ÜÙ\ÎÂˆ›ÝËœÙY[ŠÏ\ÙY[ŽÂˆYŠZ\ÜÙ\ÏŒ
\›ÝË™\Ý[˜ÝZ\ÜÙY][\ÊÊÎÂˆBˆÛÛœÝ˜[šÙYSØš™XÝ˜[Y\Ê›ÝÜÊK›X\
›ÝÏOžÂˆÛÛœÝ]šY[˜ÙTÙY[SX]›X^
›ÝËœÙY[‹›ÝË›Z\ÜÙ\ÊNÂˆÛÛœÝ\œ›Ü”˜]OY]šY[˜ÙTÙY[ÓX]›Z[ŠLX]œ›Ý[™
›ÝË›Z\ÜÙ\ËÙ]šY[˜ÙTÙY[ŠŒL
JNŒÂˆ™]\›ˆË‹‹œ›ÝË]šY[˜ÙTÙY[‹\œ›Ü”˜]_NÂˆJK™š[\Š›ÝÏOœ›ÝË›Z\ÜÙ\ÏŒ
KœÛÜ

KŠOO˜‹›Z\ÜÙ\ËXK›Z\ÜÙ\ß‹™\œ›Ü”˜]KXK™\œ›Ü”˜]_K™ÛXZ[‹›ØØ[PÛÛ\\™J‹™ÛXZ[‹	Ú˜IÊJNÂˆÛÛœÝÝ[Z\ÝZÙ\Ï\˜[šÙYœ™YXÙJ
Ý[K›ÝÊOOœÝ[JÜ›ÝË›Z\ÜÙ\Ë
NÂˆÛÛœÝÜ\˜[šÙYÌ_[ÙXÛÛ™\˜[šÙYÌW_[ÂˆÛÛœÝÚ\™O]Ü	‰Ý[Z\ÝZÙ\ÏÓX]œ›Ý[™
Ü›Z\ÜÙ\ËÝÝ[Z\ÝZÙ\ÊŒL
NŒÂˆÛÛœÝÛX\“XYHH]Ü	‰Š\ÙXÛÛ™Ü›Z\ÜÙ\ÏœÙXÛÛ™›Z\ÜÙ\ß
Ü›Z\ÜÙ\ÏOO\ÙXÛÛ™›Z\ÜÙ\É‰Ü™\œ›Ü”˜]K\ÙXÛÛ™™\œ›Ü”˜]OTÕP’‘PÕÐ—ÐSÓÔ’UWÑÓPRS—Ô“ÑÔ‘TÔÒSÓ—ÕŒŒ×ÔÔPË™\]X[Z\ÝZÙPÛÝ[˜]SXY\˜Ù[
JNÂˆÛÛœÝ]X[YšY\ÏHH]Üˆ	‰Ý[Z\ÝZÙ\ÏTÕP’‘PÕÐ—ÐSÓÔ’UWÑÓPRS—Ô“ÑÔ‘TÔÒSÓ—ÕŒŒ×ÔÔPË›Z[•Ý[Z\ÝZÙ\Âˆ	‰Ü›Z\ÜÙ\ÏTÕP’‘PÕÐ—ÐSÓÔ’UWÑÓPRS—Ô“ÑÔ‘TÔÒSÓ—ÕŒŒ×ÔÔPË›Z[‘ÛXZ[“Z\ÝZÙ\Âˆ	‰Ü™\Ý[˜ÝZ\ÜÙY][\ÏTÕP’‘PÕÐ—ÐSÓÔ’UWÑÓPRS—Ô“ÑÔ‘TÔÒSÓ—ÕŒŒ×ÔÔPË›Z[‘\Ý[˜Ý][\Âˆ	‰Ü™\œ›Ü”˜]OTÕP’‘PÕÐ—ÐSÓÔ’UWÑÓPRS—Ô“ÑÔ‘TÔÒSÓ—ÕŒŒ×ÔÔPË›Z[‘ÛXZ[‘\œ›Ü”˜]T\˜Ù[ˆ	‰œÚ\™OTÕP’‘PÕÐ—ÐSÓÔ’UWÑÓPRS—Ô“ÑÔ‘TÔÒSÓ—ÕŒŒ×ÔÔPË›Z[‘ÛXZ[“Z\ÝZÙTÚ\™T\˜Ù[ˆ	‰˜ÛX\“XYÂˆ™]\›ˆÝÝ[Z\ÝZÙ\ËÚ\™KÛX\“XY]X[YšY\ËÜÙXÛÛ™˜[šÙYNÂŸB‚™[˜Ý[ÛˆÝXš™XÝ[ÛÜš]QÛXZ[•\™Ù]ŒŒÊÛXZ[Š^ÂˆÛÛœÝ][OP—ÑVSWÐSÓ×ÒUSTË™š[™
Ož™ÛXZ[OOYÛXZ[ŠNÂˆYŠZ][J\™]\›ˆ[ÂˆÛÛœÝ[XZÙQš[˜[[ÛÑ^[J][JNÂˆÛÛœÝ\™Ù]X‘š[˜[™[YYX][Û•\™Ù]
œÝYS[ÙKœÛÝ\˜ÙRY™ÛXZ[ŠNÂˆYŠ\™Ù]Ë›[ÙHOOIÝ˜XÙIß]\™Ù]šYP—ÑVTÒTÑTËœÛÛYJOžšYOO]\™Ù]šY
J\™]\›ˆ[Âˆ™]\›ˆÛ[ÙN‰Ý˜XÙIËY\™Ù]šYÛXZ[Ž™™ÛXZ[ŸÛXZ[ŸNÂŸB‚™[˜Ý[ÛˆÝXš™XÝ[ÛÜš]QÛXZ[ÛÛ^ŒŒÊ
^ÂˆÛÛœÝO\ÝXš™XÝ”›ÙÜ™\ÜÓY]šXÜÊ
NÂˆYŠK™š[˜[[œÈOOLJ\™]\›ˆ[ÂˆÛÛœÝš\œÝ\›Ùš[K˜‘š[˜[\ÝÜžOË–ÌNÂˆYŠYš\œÝ[X™\Šš\œÝœ˜]OÏÌL
OTÕP’‘PÕÐ—Ô‘PQS‘TÔ×ÕŒŒŒ—ÔÔPË™š\œÝš[˜[›ÛÜŠ\™]\›ˆ[ÂˆÛÛœÝš\œÝ\™Ù]\ÝXš™XÝ‘š\œÝš[˜[\™Ù]ŒŒŒŠš\œÝ
NÂˆYŠš\œÝ\™Ù]Ë›[ÙHOOIÛZ[šS[ØÚÉÊ\™]\›ˆ[ÂˆÛÛœÝ]šY[˜ÙO\ÝXš™XÝ[ÛÜš]QÛXZ[‘]šY[˜ÙUŒŒÊ
NÂˆYŠY]šY[˜ÙKœ]X[YšY\ßY]šY[˜ÙKÜ
\™]\›ˆ[ÂˆÛÛœÝ\™Ù]\ÝXš™XÝ[ÛÜš]QÛXZ[•\™Ù]ŒŒÊ]šY[˜ÙKÜ™ÛXZ[ŠNÂˆYŠ]\™Ù]
\™]\›ˆ[Âˆ™]\›ˆÙš\œÝš\œÝš[˜[Ù^NœÝXš™XÝ‘š\œÝš[˜[Ù^UŒŒŒŠš\œÝ
K]šY[˜ÙK\™Ù]NÂŸB‚™[˜Ý[ÛˆÝXš™XÝ[ÛÜš]QÛXZ[“X\šÙ\•ŒŒÊÛÛ^ÛÛ\]Y
^Âˆ™]\›ˆÂˆš\œÝš[˜[Ù^N˜ÛÛ^™š\œÝš[˜[Ù^KˆÛXZ[Ž˜ÛÛ^\™Ù]™ÛXZ[‹ˆ\™Ù]Y˜ÛÛ^\™Ù]šYˆÛÛ\]Y˜ÛÛ\]YOO]YKˆ]šY[˜ÙNžÂˆÝ[Z\ÝZÙ\Î˜ÛÛ^™]šY[˜ÙKÝ[Z\ÝZÙ\ËˆÛXZ[“Z\ÝZÙ\Î˜ÛÛ^™]šY[˜ÙKÜ›Z\ÜÙ\Ëˆ\Ý[˜ÝZ\ÜÙY][\Î˜ÛÛ^™]šY[˜ÙKÜ™\Ý[˜ÝZ\ÜÙY][\ËˆÛXZ[‘\œ›Ü”˜]N˜ÛÛ^™]šY[˜ÙKÜ™\œ›Ü”˜]KˆÛXZ[“Z\ÝZÙTÚ\™N˜ÛÛ^™]šY[˜ÙKœÚ\™BˆBˆNÂŸB‚™[˜Ý[ÛˆÝXš™XÝ[ÛÜš]QÛXZ[•˜XÙT™XÕŒŒÊX\šÙ\Š^Âˆ™]\›ˆÂˆÝYÙNŒË[ÙN‰Ý˜XÙIËY›X\šÙ\‹\™Ù]Yˆ]N˜	ÛX\šÙ\‹™ÛXZ[Ÿxàk•PÑxàiùo,yà®z(ç9o-ØXÛÛŽ‰ü'ã«ÉËˆÚXÚÙ\Ž‰øà®xàá¸ààøàåÈøàîùo,yà®xà¤¹íg¸àhøàiº(ç9o-ÉËˆ\ØÎ˜9íãùd"9k§ù¢)¸àkº*©9ëe8àc8à#	ÛX\šÙ\‹™ÛXZ[Ÿxà#xàjúfá¹.+xàeøài¸àa8ào¸àfxà ¸ào¸àf¸àdøàk¹b!ºaã¸àk•PÑxà¤Œyfç¹è®º*£xàeøà xàgxàk¹o£8à¨¸àêøà­8àê¸à®¸àè8àçøàâùª(z*i¸àiÍIy.éy."¸à¤¹æë¹k¢xàjùè®º*£xàeøào¸àfxà ˜ˆNÂŸB‚™[˜Ý[ÛˆÝXš™XÝ“X\šÐ[ÛÜš]QÛXZ[•˜XÙPÛÛ\]UŒŒÊ˜XÙRY
^ÂˆÛÛœÝÛÛ^\ÝXš™XÝ[ÛÜš]QÛXZ[ÛÛ^ŒŒÊ
NÂˆÛÛœÝX\šÙ\\›Ùš[KœÝXš™XÝ[ÛÜš]QÛXZ[•ŒŒÎÂˆYŠX\šÙ\‰‰›X\šÙ\‹™š\œÝš[˜[Ù^OOO\ÝXš™XÝ‘š\œÝš[˜[Ù^UŒŒŒŠ›Ùš[K˜‘š[˜[\ÝÜžOË–ÌJI‰ˆ[X\šÙ\‹˜ÛÛ\]Y	‰›X\šÙ\‹\™Ù]YOO]˜XÙRY
^ÂˆX\šÙ\‹˜ÛÛ\]Y]YNÂˆX\šÙ\‹˜ÛÛ\]Y][ØØ[]RTÓÊ
NÂˆ™]\›ˆYNÂˆBˆYŠÛÛ^	‰˜ÛÛ^\™Ù]šYOO]˜XÙRY
^Âˆ›Ùš[KœÝXš™XÝ[ÛÜš]QÛXZ[•ŒŒÏ\ÝXš™XÝ[ÛÜš]QÛXZ[“X\šÙ\•ŒŒÊÛÛ^YJNÂˆ›Ùš[KœÝXš™XÝ[ÛÜš]QÛXZ[•ŒŒË˜ÛÛ\]Y][ØØ[]RTÓÊ
NÂˆ™]\›ˆYNÂˆBˆ™]\›ˆ˜[ÙNÂŸB‚˜ÛÛœÝÜÝXš™XÝ’X”™XÛÛ[Y[™][Û•ŒŒÏ\ÝXš™XÝ’X”™XÛÛ[Y[™][ÛŽÂœÝXš™XÝ’X”™XÛÛ[Y[™][ÛY[˜Ý[ÛŠ
^ÂˆÛÛœÝ™XÏWÜÝXš™XÝ’X”™XÛÛ[Y[™][Û•ŒŒÊ
NÂˆÛÛœÝ^\ÏY^[Q^\Ô™[XZ[š[™Ê
NÂˆÛÛœÝš[˜[[ÝÙYHJ^\ÈO[[	‰™^\ÏL	‰™^\ÏLÊNÂˆYŠYš[˜[[ÝÙY
\™]\›ˆ™XÎÂˆYŠ\™Xß™XË›[ÙHOOIÛZ[šS[ØÚÉß™XË]HOOIøà¨¸àêøà­8àê¸à®¸àè8àçøàâùª(z*i¸àiù®¥¹`¦IÊ\™]\›ˆ™XÎÂˆÛÛœÝÛÛ^\ÝXš™XÝ[ÛÜš]QÛXZ[ÛÛ^ŒŒÊ
NÂˆYŠXÛÛ^
\™]\›ˆ™XÎÂˆ]X\šÙ\\›Ùš[KœÝXš™XÝ[ÛÜš]QÛXZ[•ŒŒÎÂˆYŠ[X\šÙ\ŸX\šÙ\‹™š\œÝš[˜[Ù^HOOXÛÛ^™š\œÝš[˜[Ù^J^ÂˆX\šÙ\\ÝXš™XÝ[ÛÜš]QÛXZ[“X\šÙ\•ŒŒÊÛÛ^˜[ÙJNÂˆ›Ùš[KœÝXš™XÝ[ÛÜš]QÛXZ[•ŒŒÏ[X\šÙ\ŽÂˆØ]™T›Ùš[J
NÂˆBˆYŠX\šÙ\‹˜ÛÛ\]Y
\™]\›ˆ™XÎÂˆYŠX\šÙ\‹™ÛXZ[ˆOOXÛÛ^\™Ù]™ÛXZ[ŸX\šÙ\‹\™Ù]YOOXÛÛ^\™Ù]šY
^ÂˆX\šÙ\\ÝXš™XÝ[ÛÜš]QÛXZ[“X\šÙ\•ŒŒÊÛÛ^˜[ÙJNÂˆ›Ùš[KœÝXš™XÝ[ÛÜš]QÛXZ[•ŒŒÏ[X\šÙ\ŽÂˆØ]™T›Ùš[J
NÂˆBˆ™]\›ˆÝXš™XÝ[ÛÜš]QÛXZ[•˜XÙT™XÕŒŒÊX\šÙ\ŠNÂŸNÂ‚˜ÛÛœÝÙš[š\Ú‘^\˜Ú\ÙUŒŒÏYš[š\Ú‘^\˜Ú\ÙNÂ™š[š\Ú‘^\˜Ú\ÙOY[˜Ý[ÛŠ
^ÂˆÛÛœÝ˜XÙRYXÝ\œ™[ËšY[ÂˆYŠ˜XÙRY
\ÝXš™XÝ“X\šÐ[ÛÜš]QÛXZ[•˜XÙPÛÛ\]UŒŒÊ˜XÙRY
NÂˆ™]\›ˆÙš[š\Ú‘^\˜Ú\ÙUŒŒÊ
NÂŸNÂ‚™ÛØ˜[\Ë”ÕP’‘PÕÐ—ÐSÓÔ’UWÑÓPRS—Ô“ÑÔ‘TÔÒSÓ—ÕŒŒ×ÔÔPÏTÕP’‘PÕÐ—ÐSÓÔ’UWÑÓPRS—Ô“ÑÔ‘TÔÒSÓ—ÕŒŒ×ÔÔPÎÂ‹ËÈOOOOH‘HUQTÕŒŒÌÝXš™XÝˆÚÚXÙK\ÜXÚYšXÈÜ›Û™ËX[œÝÙ\ˆ™YY˜XÚÈ™\Z\ˆOOOOBŠ

HOˆÂˆÛÛœÝÛXÞOIØÚÚXÙK\ÜXÚYšXË]Ü›Û™ËX[œÝÙ\‹YXYÛ›ÜÚ\ÉÎÂˆÛÛœÝÛÝ\˜ÙP]Y]IÝŒŒŽK\ÝXš™XÝØ—ÝÜ›Û™×Ø[œÝÙ\—Ù™YY˜XÚ×Û›ÝØÚÚXÙWÜÜXÚYšXÉÎÂ‚ˆÛÛœÝÓPRS—ÐÕQTÏSØš™XÝ™œ™Y^™JÂˆ	ùb-¹o¨IÎ‰ùd!9cãyoªxà¤¸à#9§hy.í¹b)9k¦ˆ8¡¤ˆ9k§ú(c8àeøàgù.èùaiH8¡¤ˆ9cãyoªyí`¹.¡¹¦`¸àk¹`)8à#xàkºh!¸àiÌz(c8àf¸ài9¦î8àcxào¸àfxà ‰Ëˆ	ù. 9«(ya`úacyb%ÉÎ‰ù­îùkeøàj9`)8à¤¹oáxàf¸à®øààøàâ8àiù¦î8àcxà z*«xàoùaî¸àeùa`øàj9¦î:/¯8àoùab8à¤¹b!¸àdxàiº/ïxàa8ào¸àfxà ‰Ëˆ	ù.£9«(ya`úacyb%ÉÎ‰ú(c¸àîùb%Øøàîøàgxàk¹¦`¹à®xàk¹`)8à¤¸à®øààøàâ8àiù¦î8àcxà ya¡y`m8àêøàï8àåøàc9í`¸à£øà¢øào¸àiÜ¸à¤º`,¸à xào¸àføà¤øà ‰Ëˆ	ùa£yn,8àîúe¨¹¥l	Î‰ùgî¹n¥y§hy.í¸ào¸àiù."øà¢¸à y¢.øà¢¹`)8à¤¹. 9«­xàf¸ài9do9aî¸àeùa`øàn9¢.øàeøài¹o#øà¤¹gâøà xào¸àfxà ‰Ëˆ	ù§*9©âú`(	Î‰ùãï¹g*8àã¸àï8àâxàj8à y«(xàjùaé¹ä!¸àfxà¢øàã¸àï8àâyb%ûï"9a£yn,8à®xà¯øààøà«øào¸àgøàkøà«xàéxàï;ï"xà¤¹«ã¹fç¹¦î8àcxào¸àfxà ‰Ëˆ	øàª¸àå¸à®8à©øà«øàâ9£!ùd$IÎ‰ùi"y¥l9d#xàiøàkøàj¸àcøà#8àjxàk¸à©8àìøà®xà¯øàìøà®xà¤¹cà¹áiøàeøài¸àa8à¢øàbøà#xà¤¹ab8àjù¥m9ä!¸àeøài¸àbøà¢y¦í9¥¬8àeøào¸àfxà ‰Ëˆ	øàê¸à®xàâ	Î‰ùãï¹g*8àc9£!øàfxàã¸àï8àâxàj™^8àk¹.æ9¦ïøàb9ab8à¤¹çè¹cl8àiù£ãøàa8ài¸àbøà¢y.èùaixàeøào¸àfxà ‰Ëˆ	øà®xà¯øààøà«øàîøà«xàéxàï	Î‰ùcå¸à¢¹aî¸àfy`m;ï"8à®xà¯øààøà«øàk¸àâ8ààøàåûï#øà«xàéxàï8àk¹ab:h+{ï"xàj8à ycå¸à¢¹aî¸àeøàgùo£8àjù«¢øà¢ú) yí(8à¤¹b!¸àdxài¹¦î8àcxào¸àfxà ‰Ëˆ	øàäøààøàâ9b%ÉÎ‰ùd!š]8à¤¹î)¸àjøàgxà£xàb8à PS‘8àîÓÔ¸àîÖÔ¸àîÓ“Õ8àîøà­øàåxàâ8à¤Œy¯%9ë¥øàf¸ài9è®¹k¦¸àeøào¸àfxà ‰Ëˆ	ù£¨¹í(¸àîù¥m9b%ÉÎ‰ù«å:/ øàeøàgùæí9o£8àjùi"xà£øà¢ù­îùkeøàîùh ùåc8àîúacyb%ùâ­¹¡bøà¤Œxà®xàá¸ààøàåøàe8àj8àjú*&:c,¸àeøào¸àfxà ‰Ëˆ	øà¨¸àêøà­8àê¸à®¸àè	Î‰ù«hú)èøàj:`n8à¤øàh9`)8àc9b!¸àbøà£8à¢ù§ 9b'xàk¹.èùaixào¸àiù¢.øà¢¸à xàgxàkŒz(c8àh8àdxà¤¹a£yk§ú(c8àeøào¸àfxà ‰ÂˆJNÂˆÛÛœÝÑPÕT’UWÐÕQTÏSØš™XÝ™œ™Y^™JÂˆ	øàåxà¨øààøà­øàìøà¬8àîú*£z*/	Î‰øà#:*£z*/9 áyh,xàc9¯#øàb8àa8àeøàgùbcy£ä8àj¸à¢xà y.â¸àfxàd9/exà¤¹«h¸à xàiº*¬8àn9/'xàb8à¢øàbøà#xà¤¹ab8àjù¬n¸à xào¸àfxà ‰Ëˆ	øàç¸àêøà©¸à©øà¨¸àîøà©8àìøà­øàáøàìøàâ9kï¹oç	Î‰ùc§ùfè9êm¹¦#¸à¢8à¢¹ab8àjú(ªùk¬ù¢èyi)øà¤¹«h¸à xà z*¯ù§îøàjùoáz) xàjº*&:c,¸à¤¹«¢øàfzh!¹n£øàiú  øàb8ào¸àfxà ‰Ëˆ	øà¨¸à«øà®øà®yb-¹o¨xàîù§ 9l#ùª*zfd	Î‰øàgxàk¹b*yå*: !xàîùonybl¸àjù.â¹oáz) xàj¹ª*zfd8àh8àdxàbøà xàj8àa8àa¹§ 9l#ùª*zfd8àkº.î8àiú`n8àløào¸àfxà ‰Ëˆ	øà¨¸àªøà©¸àìøàâ8àêxà©8àåxà­xà©8à«øàêøàîøà¨¸à«øà®øà®yë¨yä!‰Î‰ùidyí!8àîù¢`9lg¸àîú mùbæxàk¹i"yc%¸àj9ª*zfd9i"y¦í8àc9d#9¦`¸àjú-møàcxà¢øànxàcxàbøà¤¹è®º*£xàeøào¸àfxà ‰Ëˆ	ù áyh,z,áùå(ùë¨yä!¸àîùcå¹¢lxàa	Î‰ùë¨yä!º,«9.îøàîùªgùká¹c.¹b!¸àîùb*yå*: !yëá9fì¸à¤¹ab8àjùè®¹k¦¸àeøà xàgxàk¹c.¹b!¸àjùd"8àa¹¢lxàa8à¤º`n8àløào¸àfxà ‰Ëˆ	ùâjyä!¹æ¡8à®øà«xàéxàê¸àá¸à¨øàîùªgùkáº,áù¥¦yë¨yä!‰Î‰ùë+9."z !xàbøà¢y.âº)¢øàb8à¢ù áyh,xà¤¹ab8àjù/çz+møàeøà xàgxàk¹o£8àjú*&:c,¸àîú`bùå*9¥.ye¡8à¤º  øàb8ào¸àfxà ‰Ëˆ	øà©8àìøà­øàáøàìøàâ9kï¹oç8àîú*/9¢è9/çyaj	Î‰ú(ªùk¬ù¢èyi)úf,¹«h¸àj:*/9¢è9/çyaj8àk¹.(y¥®xà¤¹® 8àgøàfyb'ybåxàbøà¤¹è®º*£xàeøào¸àfxà ‰Ëˆ	ù áyh,xà®øà«xàéxàê¸àá¸à¨ÉÎ‰øà#9k¢8à¢ùkïº,hxàîù.â¸àkº!!yj xàîù§ 9a*¹ab8àkº(c9båxà#xàkŒùà®xà¤¹kï¹oç8àexàføàiº`n8àløào¸àfxà ‰ÂˆJNÂ‚ˆ[˜Ý[Ûˆ^
Š^Ü™]\›ˆÝš[™ÊÏÉÉÊKš[J
NßBˆ[˜Ý[Ûˆš\œÝÙ[[˜ÙJŠ^ÂˆÛÛœÝÏ]^
ŠNÂˆYŠ\Ê\™]\›ˆ	ÉÎÂˆÛÛœÝO\Ë›X]Ú
×‹ŠÖøà »ï {ï'×KÊNÂˆ™]\›ˆOÛVÌNœÎÂˆBˆ[˜Ý[ÛˆÜ[ÛœÓÙŠJ^Ü™]\›ˆ\œ˜^Kš\Ð\œ˜^JOË›Ü[ÛœÊOÜK›Ü[ÛœÎŠ\œ˜^Kš\Ð\œ˜^JOË›ÜÊOÜK›ÜÎ–×JNßBˆ[˜Ý[Ûˆ[œÝÙ\’[™^ÙŠJ^Ü™]\›ˆ[X™\‹š\Ò[YÙ\Š[X™\ŠOË˜JJOÓ[X™\ŠK˜JN“[X™\ŠOË˜ÛÜœ™XÝ
NßBˆ[˜Ý[ÛˆÛÜœ™XÝ^ÙŠJ^ØÛÛœÝÜÏ[Ü[ÛœÓÙŠJKOX[œÝÙ\’[™^ÙŠJNÜ™]\›ˆ^
ÜÖØWJNßB‚ˆ[˜Ý[ÛˆÝ]P\ÜÚYÛ›Y[ÊŠ^ÂˆÛÛœÝÝ]^ßNÂˆÛÛœÝÏ]^
ŠNÂˆÛÛœÝ™OKÊÐKV˜K^—×VÐKV˜K^ŒNWË—JŠWÊWÊŠÖ×—WJ—_×‹×JÊKÙÎÂˆ]NÂˆÚ[J
O\™K™^XÊÊJJ[Ý]ÛVÌWWO[VÌ—NÂˆ™]\›ˆÝ]ÂˆBˆ[˜Ý[Ûˆ\ÝÚÙ[œÊŠ^ÂˆÛÛœÝÏ]^
ŠNÂˆÛÛœÝO\Ë›X]Ú
×Ê×—WJŠWKÊNÂˆYŠJ\™]\›ˆVÌWKœÜ]
	Ë	ÊK›X\
Ožš[J
JK™š[\Š›ÛÛX[ŠNÂˆYŠËš[˜ÛY\Ê	ø¡¤‰ÊJ\™]\›ˆËœÜ]
	ø¡¤‰ÊK›X\
Ožš[J
JK™š[\Š›ÛÛX[ŠNÂˆ™]\›ˆ×NÂˆBˆ[˜Ý[ÛˆØ[YS][\Ù]
KŠ^ÂˆYŠK›[™ÝOOX‹›[™Ý
\™]\›ˆ˜[ÙNÂˆÛÛœÝVË‹‹˜WKœÛÜ

KOVË‹‹˜—KœÛÜ

NÂˆ™]\›ˆ™]™\žJ
‹JOOOO^VÚWJNÂˆBˆ[˜Ý[ÛˆØØ[\“[X™\ŠŠ^ÂˆÛÛœÝÏ]^
ŠKœ™\XÙJÖË××KÙË	ÉÊNÂˆ™]\›ˆ×‹O×
ÊÎ——
ÊOÉË\Ý
ÊOÓ[X™\ŠÊN›[ÂˆB‚ˆ[˜Ý[Ûˆ[ÛÜš]QXYÛ›ÜÚ\ÊY]KÜ›Û™Ê^ÂˆÛÛœÝÛÜœ™XÝ]^
Y]K˜ÛÜœ™XÝ
KÛXZ[]^
Y]K™ÛXZ[Š_	øà¨¸àêøà­8àê¸à®¸àè	ÎÂˆÛÛœÝØO\Ý]P\ÜÚYÛ›Y[ÊÜ›Û™ÊKØO\Ý]P\ÜÚYÛ›Y[ÊÛÜœ™XÝ
NÂˆÛÛœÝÚ\™YSØš™XÝšÙ^\ÊØJK™š[\ŠÏO“Øš™XÝœ›ÝÝ\Kš\ÓÝÛ”›Ü\K˜Ø[
ØKÊJNÂˆÛÛœÝY™\Ú\™Y™š[\ŠÏO^
ØVÚ×JHOO]^
ØVÚ×JJNÂˆYŠÚ\™Y›[™Ý	‰™Y™‹›[™ÝOOLJ^Âˆ™]\›ˆ8à#	Ý^
Ü›Û™Ê_xà#xàiøàkÈ	ÙY™–Ì_H8àk¹¦í9¥¬9¦`¹à®xàh8àdxàc8àf¸à£8ài¸àa8ào¸àfxà ¸ànøàbøàk¹â­¹¡bøà¤¹/çy£ xàeøàgøào¸ào¸à IÙY™–Ì_H8àc9i"xà£øà¢Ìz(c8à¤º)¢ùæí8àeøài¸àcøàh8àexàa8à ˜ÂˆBˆYŠÚ\™Y›[™Ý	‰™Y™‹›[™ÝŒJ^Âˆ™]\›ˆ8à#	Ý^
Ü›Û™Ê_xà#xàiøàkÈ	ÙY™‹š›Ú[Š	øàîÉÊ_H8à¤¹d#9¦`¸àjùbåxàbøàeøài¸àb¸à¢¸à y.èùaixàkºh!¹n£øàc8àf¸à£8ài¸àa8ào¸àfxà ¸à¬øàï8àâxàjù¦î8àbøà£8àgúh!¸àjÌxài8àf¸ài9¦í9¥¬8àeøài¸àcøàh8àexàa8à ˜ÂˆBˆÛÛœÝÛ\ØØ[\“[X™\ŠÜ›Û™ÊKÛ\ØØ[\“[X™\ŠÛÜœ™XÝ
NÂˆYŠÛˆOO[[	‰˜ÛˆOO[[	‰“X]˜XœÊÛ‹XÛŠOOOLJ^Âˆ™]\›ˆ8à#	Ý^
Ü›Û™Ê_xà#xàkù«hú)èøàjxàh8àdxàf¸à£8ài¸àb¸à¢¸à ycãyoªyfç¹¥l8àîù­îùkeøàîù¦í9¥¬9fç¹¥l8àk¸àjxà£8àbøà¤Œyfç¹b!¹bcyo£8àjù¥l8àb8ài¸àa8ào¸àfxà ˜ÂˆBˆÛÛœÝÛ[\ÝÚÙ[œÊÜ›Û™ÊKÛ[\ÝÚÙ[œÊÛÜœ™XÝ
NÂˆYŠÛ›[™Ý	‰˜Û›[™Ý	‰œØ[YS][\Ù]
ÛÛ
I‰Ûš›Ú[Š	ß	ÊHOOXÛš›Ú[Š	ß	ÊJ^Âˆ™]\›ˆ8à#	Ý^
Ü›Û™Ê_xà#xàkú) yí(:!ê¹/døàkøàgxà£xàhøài¸àa8ào¸àfxàc:h!¹n£øàc:`exàa8ào¸àfxà ¹cå¸à¢¹aî¸àeøàîú/ïyb¨8àîù.©9£æøàc:-møàcxà¢úh!¹åj¸à¤º`!¸àjú/ïxàhøài¸àa8àj¸àa8àbùè®º*£xàeøài¸àcøàh8àexàa8à ˜ÂˆBˆYŠÛ›[™Ý	‰˜Û›[™Ý	‰Û›[™ÝOOXÛ›[™Ý
^Âˆ™]\›ˆ8à#	Ý^
Ü›Û™Ê_xà#xàiøàkú) yí(9¥l8àc9«hú)èùâ­¹¡bøàj9. :!í8àeøào¸àføà¤øà º/ïyb¨8àîùbbºfi8àîùcãyoªyí`¹.¡¸àk¸àjxàdøàbøà¤Œyfç¹/fyb!¸àjøà xào¸àgøàkÌyfç¹l$xàj¸àcùaé¹ä!¸àeøài¸àa8ào¸àfxà ˜ÂˆBˆÛÛœÝ›Ü›X]]^
Y]K™›Ü›X]
NÂˆYŠ›Ü›X]OOIùên¹«!:(ç9aaIÊ\™]\›ˆ8à#	Ý^
Ü›Û™Ê_xà#xà¤¹aixà£8à¢øàj8à y.èùaiyab8àj9cà¹áiùa`øàk¹kï¹oç8àc9æë¹æ¡8àk¹aé¹ä!¸àj9. :!í8àeøào¸àføà¤øà ¹ên¹«!8àk¹bcyo£8àiøà#9/exà¤¹«¢øàeøà y/exà¤¹¦í9¥¬8àfxà¢ùo#øàbøà#xà¤¹è®º*£xàeøài¸àcøàh8àexàa8à ˜ÂˆYŠ›Ü›X]OOIùk§ú(c9fç¹¥l	Ê\™]\›ˆ8à#	Ý^
Ü›Û™Ê_xà#xàkùí`¹.¡¹§hy.í¸à¤¹b)9k¦¸àfxà¢øà¯øà©8àçøàìøà¬8àc8àf¸à£8ài¸àa8ào¸àfxà ¹§+9/døà¤¹k§ú(c8àeøàgùfç¹¥l8àh8àdxà¤¹¥l8àb8à y§hy.í¹è®º*£xàgxàk¸à ¸àk¸àkùfç¹¥l8àjùd*øà xàj¸àa8à¢8àa¸àjøàeøào¸àfxà ˜ÂˆYŠ›Ü›X]OOIùi"y¦í9.¢9®+	Ê\™]\›ˆ8à#	Ý^
Ü›Û™Ê_xà#xàkùi"y¦í9bcxàk¹â­¹¡bøà¤¹. :`ê9o%xàcxàf¸àhøài¸àa8ào¸àfxà ¹i"y¦í8àexà£8àgù§hy.í¸àîøàáøàï8à¯øàh8àdxà¤¹ïk¸àcy£æøàb8à y§ 9b'xàbøà¢yaé¹ä!¸à¤º/ïxàa9æí8àeøài¸àcøàh8àexàa8à ˜ÂˆÛÛœÝÙ[™\šXÏ^Âˆ	ùb-¹o¨IÎ‰ù§hy.í¸à¤¹b)9k¦¸àfxà¢ù¦`¹à®xàj8à xàgxàk¹o£8àk¹.èùaixàîØœ™XZøàkºh!¹n£øà¤¹cå¸à¢º`exàb8ài¸àa8ào¸àfxà ‰Ëˆ	ù. 9«(ya`úacyb%ÉÎ‰ù­îùkeøàj8à xàgxàk¹­îùkeøàiú*«xàoù¦î8àcxàfxà¢ù`)8àk¹kï¹oç8àc8àf¸à£8ài¸àa8ào¸àfxà ‰Ëˆ	ù.£9«(ya`úacyb%ÉÎ‰ú(c8àj9b%øà xào¸àgøàkùa¡y`m8àêøàï8àåùí`¹.¡¹bcyo£8àk¹â­¹¡bøà¤¹cå¸à¢º`exàb8ài¸àa8ào¸àfxà ‰Ëˆ	ùa£yn,8àîúe¨¹¥l	Î‰ùgî¹n¥y§hy.í¸àbøà¢y¢.øà¢ù`)8à xào¸àgøàkùdo9aî¸àeùa`øàn9¢.øà¢úh!¹n£øà¤¹cå¸à¢º`exàb8ài¸àa8ào¸àfxà ‰Ëˆ	ù§*9©âú`(	Î‰ú**¹ecúh!¸àj8à y«(xàjùaé¹ä!¸àfxà¢øàã¸àï8àâxà¤¹/çy£ xàfxà¢ù©âú`(8àk¹â­¹¡bøàc8àf¸à£8ài¸àa8ào¸àfxà ‰Ëˆ	øàª¸àå¸à®8à©øà«øàâ9£!ùd$IÎ‰ùcà¹áiøàk¹aly§"xàîùâë9êâøàj8à xàjxàk¸à©8àìøà®xà¯øàìøà®xàc9¦í9¥¬8àexà£8à¢øàbøà¤¹cå¸à¢º`exàb8ài¸àa8ào¸àfxà ‰Ëˆ	øàê¸à®xàâ	Î‰Û™^9cà¹áiøàk¹.æ9¦ïøàb9ab8àj8à yãï¹g*9/cyïk¸àkºe¨¹/à¸à¤¹cå¸à¢º`exàb8ài¸àa8ào¸àfxà ‰Ëˆ	øà®xà¯øààøà«øàîøà«xàéxàï	Î‰ÓQ“ËÑ’Q“øàj8à ycå¸à¢¹aî¸àeøàgùo£8àjù«¢øà¢ù©âú`(8à¤¹d#9¦`¸àjú/ïxàb8ài¸àa8ào¸àføà¤øà ‰Ëˆ	øàäøààøàâ9b%ÉÎ‰ù¯%9ë¥øà¤¸ào¸àj8à xài¹aé¹ä!¸àeøà xàjxàk˜š]8àcy¯%9ë¥øàe8àj8àjùi"xà£øà¢øàbøà¤¹cå¸à¢º`exàb8ài¸àa8ào¸àfxà ‰Ëˆ	ù£¨¹í(¸àîù¥m9b%ÉÎ‰ù«å:/ ùo£8àjù¦í9¥¬8àexà£8à¢ùh ùåc8àîù­îùkeøàîúacyb%ùâ­¹¡bøà¤Œxà®xàá¸ààøàåøàf¸à¢xàeøài¸àa8ào¸àfxà ‰ÂˆNÂˆ™]\›ˆ8à#	Ý^
Ü›Û™Ê_xà#xà¤º`n8à¤øàh9h-9d"8à IÙÙ[™\šXÖÙÛXZ[—_	øà¬øàï8àây."¸àk¹¦í9¥¬8à¤Œy«­zhæøàl8àeøàgøàbøà y¦í9¥¬9bcxàk¹â­¹¡bøà¤¹ëe8àb8ài¸àa8ào¸àfxà ‰ßXÂˆB‚ˆ[˜Ý[ÛˆÙXÝ\š]QXYÛ›ÜÚ\ÊY]KÜ›Û™Ê^ÂˆÛÛœÝÏ]^
Ü›Û™ÊKÛÛ˜Ù\]^
Y]K˜ÛÛ˜Ù\
_	ù áyh,xà®øà«xàéxàê¸àá¸à¨ÉÎÂˆYŠù«(yfçŸ9k¦¹/¢ß:`,y§*ß9o£8àiß9n,9é/¹o£9ål9n.ŠŠ9aî¸àgß9è®º*£JKŠ¸à¢_9íd9§§8à¤¹è®º*£xàeøài¸àbøà¢_:)¢ú` xà¢ß8àgxàk¸ào¸àoŸ9í¦yí¦‹Ë\Ý
ÊJ^Âˆ™]\›ˆ8à#	Ýßxà#xàkùkï¹oç8à¤¹o£8à£y`$¸àeøàjøàeøài¸àa8ào¸àfxà ¹.â¹fç¸àk¸à¬xàï8à®xàiøàkøà xàê¸à®xà«øàc9«¢øàhøàgøào¸ào¹o¡xài8àdøàj:!ê¹/døàc:/ïyb¨:(ªùk¬øàjøài8àj¸àc8à¢øàgøà xà yoáz) xàj¹b'ybåxà¤¹ab8àjú(c8àa8ào¸àfxà ˜ÂˆBˆYŠùaj9dè_9d#8àf9ª*zfd9o%xàcyí¦xàd9b*y/¯ù )ß9d#8àf8à¨¸àªøà©¸àìøàâ9aly§"KŠ¹í¦‹Ë\Ý
ÊJ^Âˆ™]\›ˆ8à#	Ýßxà#xàkùb*y/¯ù )øà¡9ãï¹â­¹í«y£ xà¤¹a*¹ab8àeøà yoáz) y§ 9l#úfd8àk¹ª*zfd8àîùb*yå*9ëá9fì¸àj8àa8àa¹b)9¥«z.î8àbøà¢yi%¸à£8ài¸àa8ào¸àfxà ˜ÂˆBˆYŠùbbºfi9b'y§'ùc%Ÿ9a£xà©8àìøà®xàâ8àï8àêß9­¢9c®ß:fîù®¤8à¤¹`g9«h‹Ë\Ý
ÊI‰‹øà©8àìøà­øàáøàìøàâ8àç¸àêøà©¸à©øà¨Ÿ:*/9¢èË\Ý
ÛÛ˜Ù\
Ý^
Y]KœJJJ^Âˆ™]\›ˆ8à#	Ýßxà#xàiøàkøà yc§ùfè8à¡9olzgïùëá9fì¸à¤¹è®º*£xàfxà¢ùbcxàjú*¯ù§îù§d9¥¦xà¤¹i,xàa¹cëú ïy )øàc8à`¸à¢¸ào¸àfxà ¹l xàf:/¯8à xàj:*/9¢è9/çyaj8à¤¹b!¸àdxàiº  øàb8ài¸àcøàh8àexàa8à ˜ÂˆBˆYŠøàëxà¬:*&:c,Ÿ9æèú)¥Ÿ9. :)©ß9liy«mË\Ý
ÊJ^Âˆ™]\›ˆ8à#	Ýßxà#xàkú*&:c,¸àîùæèú)¥¸àjøàkùonyêâøàhxào¸àfxàc8à xàgxà£8àh8àdxàiøàkùãï¹g*8àk¹clzfn¸àj¹â­¹¡bøà¤¹¦+ù«høàiøàcxào¸àføà¤øà ¹©'9çéxàîú/ïz-èxàj8à y.¢:f,¸àîùl xàf:/¯8à xàîùª*zfd9¦+ù«høà¤¹c.¹b)xàeøào¸àfxà ˜ÂˆBˆYŠÓQ_9i&º) yí(:*£z*/8àäxà®xàëøàï8àâ_9¦¥ùcíùc%Ÿ8àä8ààøà«øà¨¸ààøàåËË\Ý
ÊI‰‹Ê9.#z) _9olzgïøàkøàj¸àa:f,¸àd¸à¢ß9¯#øàb8àa8àeøàj¸àcß:)¢ú` xà¢ÊKË\Ý
ÊJ^Âˆ™]\›ˆ8à#	Ýßxà#xàkù. 8ài8àk¹kï¹ëe¸àiøàê¸à®xà«øàc9­¢8àb8à¢øàj:  øàb:`c¸àc¸ài¸àa8ào¸àfxà ¹i&¹li:f,¹o¨xàiøàkøà yd!9kï¹ëe¸àc9."øàd¸à¢xà£8à¢øàê¸à®xà«øàj9«¢øà¢øàê¸à®xà«øà¤¹b!¸àdxài¹b)9¥«xàeøào¸àfxà ˜ÂˆBˆYŠù§ 9b'_9§ 9a*¹ab8ào¸àf‹Ë\Ý
^
Y]KœJJJ^Âˆ™]\›ˆ8à#	Ýßxà#xàkùkï¹ëe¸àj8àeøài¹. :`ê9¡#ùdløàc8à`¸àhøài¸à ¸à y.â¸àdøàk¹ç«:e¤øàk¹a*¹ab:h!¹/cxàc:`exàa8ào¸àfxà ¹c§ùfè:*¯ù§îøàîùb*y/¯ù )øà¢8à¢¸à z(ªùk¬ù¢èyi)øà¡9.#y«hùb*yå*8à¤¹¢¤xàb8à¢ú(c9båxà¤¹ab8àjù©':*#¸àeøào¸àfxà ˜ÂˆBˆ™]\›ˆ8à#	Ýßxà#xàkù. :`ê8àk¹kï¹ëe¸àj8àeøài¸àkù¡#ùdløàc8à`¸àhøài¸à ¸à xàdøàkº*+yecøàiùecøà£øà£8ài¸àa8à¢øà#	ØÛÛ˜Ù\xà#xàk¹b)9¥«z.î8à¤¹æí9£©y® 8àgøàeøào¸àføà¤øà ˜ÂˆB‚ˆ[˜Ý[ÛˆZ[™YY˜XÚÊY]J^ÂˆÛÛœÝÜÏJY]K›Ü[Ûœß×JK›X\
^
KÛÜœ™XÝ]^
Y]K˜ÛÜœ™XÝ
KÛÜœ™XÝ[™^[ÜË™š[™[™^
OžOOXÛÜœ™XÝ
NÂˆÛÛœÝžU^^ßNÂˆÛÛœÝ\œ˜^O[ÜË›X\

ÜJOOžÂˆYŠOOOXÛÜœ™XÝ[™^ÜOOXÛÜœ™XÝ
\™]\›ˆ	ÉÎÂˆÛÛœÝ\ÔÙXÝ\š]O[Y]KšÚ[™OOIÜÙXÝ\š]IÎÂˆÛÛœÝXYÛ›ÜÚ\ÏZ\ÔÙXÝ\š]OÜÙXÝ\š]QXYÛ›ÜÚ\ÊY]KÜ
N˜[ÛÜš]QXYÛ›ÜÚ\ÊY]KÜ
NÂˆÛÛœÝÚXÚÜÚ[JY]KœÚ[Ý^
Y]KœÚ[
NŠ\ÔÙXÝ\š]OÉùb)9¥«xàk¹b!¹l¤9à®{ï&‰Î‰ùaé¹ä!¸àk¹b!¹l¤9à®{ï&‰ÊJÙš\œÝÙ[[˜ÙJY]K™^Z[ŸY]K™^
JNÂˆÛÛœÝ™^ÝYO]^
Y]Kš[Y]KœÚ[
_
\ÔÙXÝ\š]OÊÑPÕT’UWÐÕQTÖÝ^
Y]K˜ÛÛ˜Ù\
W_ÑPÕT’UWÐÕQTÖÉù áyh,xà®øà«xàéxàê¸àá¸à¨É×JNŠÓPRS—ÐÕQTÖÝ^
Y]K™ÛXZ[ŠW_ÓPRS—ÐÕQTÖÉøà¨¸àêøà­8àê¸à®¸àè	×JJNÂˆÛÛœÝ][OSØš™XÝ™œ™Y^™JÙXYÛ›ÜÚ\ËÚXÚÜÚ[™^ÝY_JNÂˆžU^ÛÜOZ][NÂˆ™]\›ˆ][NÂˆJNÂˆ™]\›ˆØ\œ˜^KžU^NÂˆB‚ˆ[˜Ý[Ûˆ[œÝ[™YY˜XÚÓÛ”]Y\Ý[ÛŠKY]J^ÂˆÛÛœÝÜÏ[Ü[ÛœÓÙŠJK›X\
^
KOX[œÝÙ\’[™^ÙŠJKÛÜœ™XÝ]^
ÜÖØWJNÂˆÛÛœÝZ[XZ[™YY˜XÚÊË‹‹›Y]KÜ[ÛœÎ›ÜËÛÜœ™XÝ^Z[ŽœK™^Z[ŸK™^Y]OË™^Z[‹[œKš[Y]OËš[Ú[œKœÚ[Y]OËœÚ[^œK™^Y]OË™^NœKœ_Y]OËœ_JNÂˆKÜ›Û™Ñ™YY˜XÚÏXZ[˜\œ˜^NÂˆKÜ›Û™Ñ™YY˜XÚÐžU^XZ[˜žU^Âˆ™]\›ˆNÂˆB‚ˆ[˜Ý[Ûˆ[œÝ[ÛÝ\˜ÙQ™YY˜XÚÊ
^Âˆ—ÑVTÒTÑTË™›Ü‘XXÚ
^OžÂˆ^œÝ\Ë™›Ü‘XXÚ
Ý\OžÂˆYŠ\Ý\œ™YXÝ
\™]\›ŽÂˆ[œÝ[™YY˜XÚÓÛ”]Y\Ý[ÛŠÝ\œ™YXÝÚÚ[™‰Ø[ÛÜš]IËÛXZ[Ž™^™ÛXZ[Ÿ^˜ÛÛ˜Ù\	øà¨¸àêøà­8àê¸à®¸àè	Ë›Ü›X]‰ú`%9.+yâ­¹¡bÉßJNÂˆJNÂˆJNÂˆÑPÕT’UWÔÐÑST’SÔË™›Ü‘XXÚ
ØÏOžÂˆØËœÝ\Ë™›Ü‘XXÚ
Ý\Oš[œÝ[™YY˜XÚÓÛ”]Y\Ý[ÛŠÝ\ÚÚ[™‰ÜÙXÝ\š]IËÛÛ˜Ù\œØË˜ÛÛ˜Ù\	ù áyh,xà®øà«xàéxàê¸àá¸à¨ÉßJJNÂˆJNÂˆ›ÜŠ]OLÚO—ÑVSWÐSÓ×ÒUSTË›[™ÝÚJÊÊ^ÂˆÛÛœÝÜ˜ÏP—ÑVSWÐSÓ×ÒUSTÖÚWNÂˆÛÛœÝO^Ë‹‹œÜ˜ßNÂˆ[œÝ[™YY˜XÚÓÛ”]Y\Ý[ÛŠKÚÚ[™‰Ø[ÛÜš]IËÛXZ[ŽœÜ˜Ë™ÛXZ[Ÿ	øà¨¸àêøà­8àê¸à®¸àè	Ë›Ü›X]œÜ˜Ë™›Ü›X]	ùaé¹ä!¹íd9§§	ßJNÂˆ—ÑVSWÐSÓ×ÒUSTÖÚWO\NÂˆBˆ—ÐÓÓTÕS‘ÔÑUË™›Ü‘XXÚ
Ù]OžÂˆÙ]œ\Ë™›Ü‘XXÚ
OOš[œÝ[™YY˜XÚÓÛ”]Y\Ý[ÛŠKÚÚ[™‰Ø[ÛÜš]IËÛXZ[Ž‰øà¨¸àêøà­8àê¸à®¸àè	Ë›Ü›X]œKšÚ[™K™›Ü›X]	øàâ8àë8àï8à®IËÚ[œKœÚ[	ÉË^œK™^	ÉË[œKœÚ[	ÉßJJNÂˆJNÂˆB‚ˆ[˜Ý[Ûˆ™YY˜XÚÑ›ÜŠKÙ[XÝY
^ÂˆYŠ\_Ù[XÝYO[[
\™]\›ˆ[ÂˆÛÛœÝÜÏ[Ü[ÛœÓÙŠJKY]\[ÙˆÙ[XÝYOOIÛ[X™\‰ÏÜÙ[XÝY›ÜË™š[™[™^
O^

OOO]^
Ù[XÝY
JNÂˆÛÛœÝÙ[XÝY^ZYLÝ^
ÜÖÚYJN^
Ù[XÝY
NÂˆYŠÙ[XÝY^OOXÛÜœ™XÝ^ÙŠJJ\™]\›ˆ[ÂˆYŠKÜ›Û™Ñ™YY˜XÚÐžU^Ë–ÜÙ[XÝY^J\™]\›ˆKÜ›Û™Ñ™YY˜XÚÐžU^ÜÙ[XÝY^NÂˆYŠYL	‰œKÜ›Û™Ñ™YY˜XÚÏË–ÚYI‰\[ÙˆKÜ›Û™Ñ™YY˜XÚÖÚYOOOIÛØš™XÝ	Ê\™]\›ˆKÜ›Û™Ñ™YY˜XÚÖÚYNÂˆ™]\›ˆ[ÂˆB‚ˆ[˜Ý[Ûˆ™[X\™YY˜XÚÊÛÝ\˜ÙK\™Ù]
^ÂˆÛÛœÝÜÏ[Ü[ÛœÓÙŠ\™Ù]
KÛÜœ™XÝXÛÜœ™XÝ^ÙŠ\™Ù]
NÂˆÛÛœÝžU^^Ë‹‹ŠÛÝ\˜ÙOËÜ›Û™Ñ™YY˜XÚÐžU^ßJ_NÂˆ\™Ù]Ü›Û™Ñ™YY˜XÚÐžU^XžU^Âˆ\™Ù]Ü›Û™Ñ™YY˜XÚÏ[ÜË›X\
ÜO^
Ü
OOOXÛÜœ™XÝÉÉÎŠžU^Ý^
Ü
W_	ÉÊJNÂˆ™]\›ˆ\™Ù]ÂˆB‚ˆ[˜Ý[ÛˆXYÛ›ÜÚ\Ò[
˜‹[˜ÛYPÚXÚÜÚ[]YJ^ÂˆYŠY˜Š\™]\›ˆ	ÉÎÂˆ™]\›ˆ]ˆÛ\ÜÏH˜˜ÚÚXÙKY™YY˜XÚË]ŒŒÌˆÝ[OH›X\™Ú[‹]ÜŒLÜY[™ÎŒLœLÜØ›Ü™\ŽŒ\ÛÛYÙŒÎXNØ›Ü™\‹\˜Y]\ÎŒLœØ˜XÚÙÜ›Ý[™ˆÙ™™˜YŒØÛÛÜŽˆÍNMÛ[™KZZYÚŒKNÙ›Û\Ú^™NŒM]ˆÝ[OH™›Û]ÙZYÚŽLØÛÛÜŽˆÎMLˆ¼'å#ˆ:`n8à¤øàh9ëe8àb8àbøà¢z)¢øà¢øàjÙ]]‰Ù\ØØ\R[
˜‹™XYÛ›ÜÚ\Ê_OÙ]‰Ú[˜ÛYPÚXÚÜÚ[	‰™˜‹˜ÚXÚÜÚ[Ø]ˆÝ[OH›X\™Ú[‹]ÜÜ¸àdøàdøàh8àdyè®º*£{ï&Ø‰Ù\ØØ\R[
˜‹˜ÚXÚÜÚ[
_OÙ]˜‰ÉßO]ˆÝ[OH›X\™Ú[‹]ÜÜ¹«(yfç¸àk¹d"9fìûï&Ø‰Ù\ØØ\R[
˜‹›™^ÝYJ_OÙ]Ù]˜ÂˆB‚ˆ[˜Ý[Ûˆ™YXÝ[Û”ÛÝ\˜ÙJ^YU^
^ÂˆÛÛœÝ^P—ÑVTÒTÑTË™š[™
OžšYOOY^Y
NÂˆ™]\›ˆ^ËœÝ\ÏË›X\
Ožœ™YXÝ
K™š[\Š›ÛÛX[ŠK™š[™
O^
œJOOO]^
U^
J_[ÂˆBˆ[˜Ý[ÛˆÙXÝ\š]TÛÝ\˜ÙJØÙ[˜\š[ÒYU^
^ÂˆÛÛœÝØÏTÑPÕT’UWÔÐÑST’SÔË™š[™
OžšYOO\ØÙ[˜\š[ÒY
NÂˆ™]\›ˆØÏËœÝ\ÏË™š[™
ÏO^
ËœJOOO]^
U^
J_[ÂˆBˆ[˜Ý[Ûˆš[˜[ÛÝ\˜ÙJ]Z[
^ÂˆYŠ]Z[ËšÚ[™OOIÜÙXÝ\š]IÊ\™]\›ˆÙXÝ\š]TÛÝ\˜ÙJ]Z[œÛÝ\˜ÙRY]Z[œJNÂˆÛÛœÝ^[OP—ÑVSWÐSÓ×ÒUSTË™š[™
OžšYOOY]Z[ËœÛÝ\˜ÙRY
NÂˆYŠ^[J\™]\›ˆ^[NÂˆYŠ]Z[ËœÝYS[ÙOOOIÝ˜XÙIÊ\™]\›ˆ™YXÝ[Û”ÛÝ\˜ÙJ]Z[œÛÝ\˜ÙRY]Z[œJNÂˆYŠ]Z[ËœÝYS[ÙOOOIØÛÛ\Ý[™	Ê^ÂˆÛÛœÝÙ]P—ÐÓÓTÕS‘ÔÑUË™š[™
OžšYOOY]Z[œÛÝ\˜ÙRY
NÂˆ™]\›ˆÙ]Ëœ\ÏË™š[™
OO^
KœJOOO]^
]Z[œJJ_[ÂˆBˆ™]\›ˆ[ÂˆB‚ˆ[œÝ[ÛÝ\˜ÙQ™YY˜XÚÊ
NÂ‚ˆÛÛœÝØ“[ØÚÐØ[™Y]UŒŒÌX“[ØÚÐØ[™Y]Qœ›ÛQ^\˜Ú\ÙNÂˆ“[ØÚÐØ[™Y]Qœ›ÛQ^\˜Ú\ÙOY[˜Ý[ÛŠ^
^ÂˆÛÛœÝÝ]WØ“[ØÚÐØ[™Y]UŒŒÌ
^
NÂˆYŠ[Ý]
\™]\›ˆÝ]ÂˆÛÛœÝÜ˜ÏY^ËœÝ\ÏË–ÛÝ]˜ÚXÚÜÚ[OËœ™YXÝ™YXÝ[Û”ÛÝ\˜ÙJ^ËšYÝ]œJNÂˆYŠÜ˜Ê^ÛÝ]Ü›Û™Ñ™YY˜XÚÐžU^^Ë‹‹ŠÜ˜ËÜ›Û™Ñ™YY˜XÚÐžU^ßJ_NÛÝ]Ü›Û™Ñ™YY˜XÚÏ[Ý]›Ü[ÛœË›X\
ÜO^
Ü
OOO]^
Ý]˜ÛÜœ™XÝ^
OÉÉÎŠÝ]Ü›Û™Ñ™YY˜XÚÐžU^Ý^
Ü
W_	ÉÊJNßBˆ™]\›ˆÝ]ÂˆNÂ‚ˆÛÛœÝÜÚY™›P“[ØÚÐ[œÝÙ\•ŒŒÌ\ÚY™›P“[ØÚÐ[œÝÙ\ŽÂˆÚY™›P“[ØÚÐ[œÝÙ\Y[˜Ý[ÛŠ][J^ÂˆÛÛœÝÝ]WÜÚY™›P“[ØÚÐ[œÝÙ\•ŒŒÌ
][JNÂˆ™]\›ˆ™[X\™YY˜XÚÊ][KÝ]
NÂˆNÂ‚ˆÛÛœÝÜ˜[™ÛZ^™TÙXÝ\š]S[ØÚÒ][UŒŒÌ\˜[™ÛZ^™TÙXÝ\š]S[ØÚÒ][NÂˆ˜[™ÛZ^™TÙXÝ\š]S[ØÚÒ][OY[˜Ý[ÛŠËÝ\[™^
^ÂˆÛÛœÝÝ]WÜ˜[™ÛZ^™TÙXÝ\š]S[ØÚÒ][UŒŒÌ
ËÝ\[™^
KÜ˜Ï\ÏËœÝ\ÏË–ÜÝ\[™^NÂˆ™]\›ˆÜ˜ÏÜ™[X\™YY˜XÚÊÜ˜ËÝ]
N›Ý]ÂˆNÂ‚ˆÛÛœÝÜ˜[™ÛZ^™PÛÛ\Ý[™Ù]ŒŒÌ\˜[™ÛZ^™PÛÛ\Ý[™Ù]Âˆ˜[™ÛZ^™PÛÛ\Ý[™Ù]Y[˜Ý[ÛŠÙ]
^ÂˆÛÛœÝÝ]WÜ˜[™ÛZ^™PÛÛ\Ý[™Ù]ŒŒÌ
Ù]
NÂˆÝ]œ\Ë™›Ü‘XXÚ

KJOOœ™[X\™YY˜XÚÊÙ]œ\ÖÚWKJJNÂˆ™]\›ˆÝ]ÂˆNÂ‚ˆÛÛœÝÛXZÙQš[˜[[ÛÑ^[UŒŒÌ[XZÙQš[˜[[ÛÑ^[NÂˆXZÙQš[˜[[ÛÑ^[OY[˜Ý[ÛŠ][J^Ü™]\›ˆ™[X\™YY˜XÚÊ][KÛXZÙQš[˜[[ÛÑ^[UŒŒÌ
][JJNßNÂ‚ˆÛÛœÝÛXZÙQš[˜[ÙXÝ\š]UŒŒÌ[XZÙQš[˜[ÙXÝ\š]NÂˆXZÙQš[˜[ÙXÝ\š]OY[˜Ý[ÛŠÊ^ÂˆÛÛœÝÝ]WÛXZÙQš[˜[ÙXÝ\š]UŒŒÌ
ÊKÜ˜Ï\ÙXÝ\š]TÛÝ\˜ÙJÏËšYÝ]ËœJNÂˆ™]\›ˆÜ˜ÏÜ™[X\™YY˜XÚÊÜ˜ËÝ]
N›Ý]ÂˆNÂ‚ˆÛÛœÝÜÚÝÐ”™YXÝ[Û•ŒŒÌ\ÚÝÐ”™YXÝ[ÛŽÂˆÚÝÐ”™YXÝ[ÛY[˜Ý[ÛŠ™Y
^ÂˆÜÚÝÐ”™YXÝ[Û•ŒŒÌ
™Y
NÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	Ü™YXÝ[Û“Ü[ÛœÉÊK›ÞYØÝ[Y[™Ù][[Y[žRY
	Ü™YXÝ[Û›Þ	ÊNÂˆYŠ\›ÛÝX›Þ
\™]\›ŽÂˆ][™[YØÝ[Y[™Ù][[Y[žRY
	Ø”™YXÝ[ÛÚÚXÙQ™YY˜XÚÕŒŒÌ	ÊNÂˆYŠ\[™[
^Ü[™[YØÝ[Y[˜Ü™X]Q[[Y[
	Ù]‰ÊNÜ[™[šYIØ”™YXÝ[ÛÚÚXÙQ™YY˜XÚÕŒŒÌ	ÎÜ[™[šY[]YNÜ›ÛÝš[œÙ\Y˜XÙ[[[Y[
	ØY\™[™	Ë[™[
NßBˆ[™[šY[]YNÜ[™[š[›™\’SIÉÎÂˆË‹‹œ›ÛÝœ]Y\žTÙ[XÝÜ[
	Ø]Û‰ÊWK™›Ü‘XXÚ

‹JOOžÂˆÛÛœÝÜšYÚ[˜[X‹›Û˜ÛXÚÎÂˆ‹›Û˜ÛXÚÏJ
OOžÂˆYŠ\[ÙˆÜšYÚ[˜[OOIÙ[˜Ý[Û‰Ê[ÜšYÚ[˜[

NÂˆYŠHOO\™Y˜J^ØÛÛœÝ˜Y™YY˜XÚÑ›ÜŠ™YJNÚYŠ˜Š^Ü[™[š[›™\’SYXYÛ›ÜÚ\Ò[
˜‹˜[ÙJNÜ[™[šY[Y˜[ÙNß_Bˆ[Ù^Ü[™[šY[]YNÜ[™[š[›™\’SIÉÎßBˆNÂˆJNÂˆNÂ‚ˆÛÛœÝØ[œÝÙ\”ÙXÑXÚ\Ú[Û•ŒŒÌX[œÝÙ\”ÙXÑXÚ\Ú[ÛŽÂˆ[œÝÙ\”ÙXÑXÚ\Ú[ÛY[˜Ý[ÛŠK]ÛŠ^ÂˆÛÛœÝÝ\XÝ\œ™[ÙXÏËœÝ\ÏË–ÜÙXÔÝ\[™^K\ÕÜ›Û™ÏHH\Ý\	‰šHOO\Ý\˜K˜‘]OZ\ÕÜ›Û™ÏÙ™YY˜XÚÑ›ÜŠÝ\JN›[ÂˆÛÛœÝÝ]WØ[œÝÙ\”ÙXÑXÚ\Ú[Û•ŒŒÌ
K]ÛŠNÂˆYŠ\ÕÜ›Û™É‰™˜‘]J^ÂˆÛÛœÝ˜YØÝ[Y[™Ù][[Y[žRY
	ÜÙXÑ™YY˜XÚÉÊNÂˆYŠ˜ŠY˜‹š[›™\’SYXYÛ›ÜÚ\Ò[
˜‘]K˜[ÙJJÙ˜‹š[›™\’SÂˆBˆ™]\›ˆÝ]ÂˆNÂ‚ˆ[˜Ý[Ûˆ[š™XÝ“[ØÚÔ™]šY]Ê][\
^ÂˆÛÛœÝ›ÝÜÏVË‹‹™ØÝ[Y[œ]Y\žTÙ[XÝÜ[
	ÈØ“[ØÚÔ™]šY]Ó\Ý˜›[ØÚË\™]šY]ËZ][IÊWNÂˆ
][\Ë™]Z[ß×JK™›Ü‘XXÚ

JOOžÂˆYŠ›ÚßœÙ[XÝYO[[
\™]\›ŽÂˆÛÛœÝÜ˜Ï\™YXÝ[Û”ÛÝ\˜ÙJ™^YœJK˜Y™YY˜XÚÑ›ÜŠÜ˜ËœÙ[XÝY
K›ÝÏ\›ÝÜÖÚWNÂˆYŠY˜Ÿ\›ÝÊ\™]\›ŽÂˆÛÛœÝ[˜ÚÜ\›ÝËœ]Y\žTÙ[XÝÜŠ	Ë˜›[ØÚË\™]šY]ËY^Z[‰ÊNÂˆYŠ[˜ÚÜŠX[˜ÚÜ‹š[œÙ\Y˜XÙ[S
	ØY\™[™	ËXYÛ›ÜÚ\Ò[
˜‹YJJNÂˆJNÂˆBˆÛÛœÝÜ™[™\“[ØÚÔ™\Ý[ŒŒÌ\™[™\“[ØÚÔ™\Ý[Âˆ™[™\“[ØÚÔ™\Ý[Y[˜Ý[ÛŠ][\X\›™Y
^ØÛÛœÝÝ]WÜ™[™\“[ØÚÔ™\Ý[ŒŒÌ
][\X\›™Y
NÚ[š™XÝ“[ØÚÔ™]šY]Ê][\
NÜ™]\›ˆÝ]ßNÂ‚ˆ[˜Ý[Ûˆ[š™XÝÙXÝ\š]S[ØÚÔ™]šY]Ê][\
^ÂˆÛÛœÝ›ÝÜÏVË‹‹™ØÝ[Y[œ]Y\žTÙ[XÝÜ[
	ÈÜÙXÓ[ØÚÔ™]šY]Ó\ÝœÙXÛ[ØÚË\™]šY]ËZ][IÊWNÂˆ
][\Ë™]Z[ß×JK™›Ü‘XXÚ

JOOžÂˆYŠ›ÚßœÙ[XÝYO[[
\™]\›ŽÂˆÛÛœÝÜ˜Ï\ÙXÝ\š]TÛÝ\˜ÙJœØÙ[˜\š[ÒYœJK˜Y™YY˜XÚÑ›ÜŠÜ˜ËœÙ[XÝY
K›ÝÏ\›ÝÜÖÚWNÂˆYŠY˜Ÿ\›ÝÊ\™]\›ŽÂˆÛÛœÝ[˜ÚÜ\›ÝËœ]Y\žTÙ[XÝÜŠ	ËœÙXÛ[ØÚË\™]šY]ËYIÊNÂˆYŠ[˜ÚÜŠX[˜ÚÜ‹š[œÙ\Y˜XÙ[S
	ØY\™[™	ËXYÛ›ÜÚ\Ò[
˜‹YJJNÂˆJNÂˆBˆÛÛœÝÙš[š\ÚÙXÝ\š]S[ØÚÕŒŒÌYš[š\ÚÙXÝ\š]S[ØÚÎÂˆš[š\ÚÙXÝ\š]S[ØÚÏY[˜Ý[ÛŠ[YU\Y˜[ÙJ^ØÛÛœÝÝ]WÙš[š\ÚÙXÝ\š]S[ØÚÕŒŒÌ
[YU\
NÚ[š™XÝÙXÝ\š]S[ØÚÔ™]šY]Ê\ÝÙXÝ\š]S[ØÚÐ][\
NÜ™]\›ˆÝ]ßNÂ‚ˆ[˜Ý[Ûˆ[š™XÝÛÛ\Ý[™™]šY]Ê
^ÂˆYŠXÛÛ\Ý[™Ù]
\™]\›ŽÂˆÛÛœÝ›ÝÜÏVË‹‹™ØÝ[Y[œ]Y\žTÙ[XÝÜ[
	ÈØÛÛ\Ý[™™]šY]È˜˜ÛÛ\Ý[™\™]šY]ËZ][IÊWNÂˆÛÛ\Ý[™Ù]œ\Ë™›Ü‘XXÚ

KJOOžÂˆÛÛœÝÙ[XÝYXÛÛ\Ý[™[œÝÙ\œÏË–ÚWNÂˆYŠÙ[XÝYO[[Ù[XÝYOO\K˜J\™]\›ŽÂˆÛÛœÝ˜Y™YY˜XÚÑ›ÜŠKÙ[XÝY
K›ÝÏ\›ÝÜÖÚWNÂˆYŠY˜Ÿ\›ÝÊ\™]\›ŽÂˆÛÛœÝ]˜[\›ÝËœ]Y\žTÙ[XÝÜŠ	Ë˜˜ÛÛ\Ý[™\™]šY]ËX›Þœ]˜[	ÊNÂˆYŠ]˜[
\]˜[š[œÙ\Y˜XÙ[S
	ØY\™[™	ËXYÛ›ÜÚ\Ò[
˜‹YJJNÂˆ[ÙH›ÝËš[œÙ\Y˜XÙ[S
	Ø™Y›Ü™Y[™	ËXYÛ›ÜÚ\Ò[
˜‹YJJNÂˆJNÂˆBˆÛÛœÝÙš[š\ÚÛÛ\Ý[™Ú[[™ÙUŒŒÌYš[š\ÚÛÛ\Ý[™Ú[[™ÙNÂˆš[š\ÚÛÛ\Ý[™Ú[[™ÙOY[˜Ý[ÛŠ[YU\Y˜[ÙJ^ØÛÛœÝÝ]WÙš[š\ÚÛÛ\Ý[™Ú[[™ÙUŒŒÌ
[YU\
NÚ[š™XÝÛÛ\Ý[™™]šY]Ê
NÜ™]\›ˆÝ]ßNÂ‚ˆ[˜Ý[Ûˆ[š™XÝš[˜[™]šY]Ê][\
^ÂˆÛÛœÝ›ÝÜÏVË‹‹™ØÝ[Y[œ]Y\žTÙ[XÝÜ[
	ÈØ‘š[˜[™]šY]Ó\Ý˜™š[˜[\™]šY]ËZ][IÊWNÂˆ
][\Ë™]Z[ß×JK™›Ü‘XXÚ

JOOžÂˆYŠ›ÚßœÙ[XÝYO[[
\™]\›ŽÂˆÛÛœÝÜ˜ÏYš[˜[ÛÝ\˜ÙJ
K˜Y™YY˜XÚÑ›ÜŠÜ˜ËœÙ[XÝY
K›ÝÏ\›ÝÜÖÚWNÂˆYŠY˜Ÿ\›ÝÊ\™]\›ŽÂˆÛÛœÝ[˜ÚÜ\›ÝËœ]Y\žTÙ[XÝÜŠ	Ë˜™š[˜[\™]šY]ËYIÊNÂˆYŠ[˜ÚÜŠX[˜ÚÜ‹š[œÙ\Y˜XÙ[S
	ØY\™[™	ËXYÛ›ÜÚ\Ò[
˜‹YJJNÂˆJNÂˆBˆÛÛœÝÜ™[™\‘š[˜[™\Ý[ŒŒÌ\™[™\‘š[˜[™\Ý[Âˆ™[™\‘š[˜[™\Ý[Y[˜Ý[ÛŠ][\X\›™Y
^ØÛÛœÝÝ]WÜ™[™\‘š[˜[™\Ý[ŒŒÌ
][\X\›™Y
NÚ[š™XÝš[˜[™]šY]Ê][\
NÜ™]\›ˆÝ]ßNÂ‚ˆÛÛœÝÜXÏSØš™XÝ™œ™Y^™JÂˆÛXÞKˆÛÝ\˜ÙP]Y]ˆš[™[™Î‰ÜÝXš™XÝØ—ÝÜ›Û™×Ø[œÝÙ\—Ù™YY˜XÚ×Û›ÝØÚÚXÙWÜÜXÚYšXÉËˆY]Y]RÙ^N‰ÝÜ›Û™Ñ™YY˜XÚÉËˆÝX›SÛÚÝ\Ù^N‰ÝÜ›Û™Ñ™YY˜XÚÐžU^	Ëˆ™YY˜XÚÔ\Î“Øš™XÝ™œ™Y^™JÉÙXYÛ›ÜÚ\ÉË	ØÚXÚÜÚ[	Ë	Û™^ÝYI×JKˆ[[YYX]T˜XÝXÙT™]™X[ÐÛÜœ™XÝ[œÝÙ\Ž™˜[ÙKˆÜÝ[œÝÙ\”™]šY]ÔÚÝÜÐÚXÚÜÚ[YKˆÛÝ™\œÎ“Øš™XÝ™œ™Y^™JÉØ[ÛÜš]K]˜XÙIË	Ø[ÛÜš]K[Z[šK[[ØÚÉË	ØÛÛ\Ý[™	Ë	ÜÙXÝ\š]K\ØÙ[˜\š[ÉË	ÜÙXÝ\š]K[Z[šK[[ØÚÉË	Ùš[˜[X[ÛÜš]IË	Ùš[˜[\ÙXÝ\š]I×JKˆØÛÜš[™ÐÚ[™ÙY™˜[ÙKˆÛÜœ™XÝ[œÝÙ\œÐÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û”Ù[XÝ[ÛÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û“Ü™\Ú[™ÙY™˜[ÙKˆ[Z[™ÐÚ[™ÙY™˜[ÙKˆ™XY[™\ÜÕ™\ÚÛÚ[™ÙY™˜[ÙKˆÛXZ[”›ÙÜ™\ÜÚ[ÛÚ[™ÙY™˜[ÙKˆ™[YYX][Û•\™Ù]ÐÚ[™ÙY™˜[ÙKˆ›Ùš[TØÚ[XPÚ[™ÙY™˜[ÙBˆJNÂˆÛØ˜[\Ë”ÕP’‘PÕÐ—ÕÔ“Ó‘×ÐS”ÕÑT—Ñ‘QQPÒ×ÕŒŒÌÔÔPÏ\ÜXÎÂˆÛØ˜[\ËœÝXš™XÝÚÚXÙQ™YY˜XÚÕŒŒÌY™YY˜XÚÑ›ÜŽÂˆÛØ˜[\ËœÝXš™XÝÚÚXÙQ™YY˜XÚÒ[ŒŒÌYXYÛ›ÜÚ\Ò[ÂŸJJ
NÂ‹ËÈOOOOH‘HUQTÕŒŒÌÈÝXš™XÝˆ\Ý˜XÝÜˆ]X[]H™\Z\ˆOOOOBŠ

HOˆÂˆÛÛœÝš[™[™ÏIÜÝXš™XÝØ—Ù\Ý˜XÝÜ—ÜÝXÝ\˜[ÛZ\ÛX]Ú	ÎÂˆÛÛœÝÛÝ\˜ÙP]Y]IÝŒŒÌ‹\ÝXš™XÝX‹Y\Ý˜XÝÜ‹YY™šXÝ[KXØ[Xœ˜][Û‰ÎÂˆÛÛœÝ^\˜Ú\ÙOP—ÑVTÒTÑTË™š[™
OžšYOOIÜÙ[XÝ[Û—ÜÛÜØ‰ÊNÂˆYŠY^\˜Ú\ÙJ]›ÝÈ™]È\œ›ÜŠ	ÝŒŒÌÎˆÙ[XÝ[Û—ÜÛÜØˆZ\ÜÚ[™ÉÊNÂˆÛÛœÝÝ\Y^\˜Ú\ÙKœÝ\Ë™š[™
Ožœ™YXÝËœOOOIù§ 9í`¹æ¡8àj›Z[”Üøàkûï'ÉÊNÂˆYŠ\Ý\Ëœ™YXÝ
]›ÝÈ™]È\œ›ÜŠ	ÝŒŒÌÎˆ\™Ù]™YXÝ[ÛˆZ\ÜÚ[™ÉÊNÂˆÛÛœÝ™Y\Ý\œ™YXÝÂˆÛÛœÝÛÜ[ÛIÖÌKK‹IÎÂˆÛÛœÝ™]ÓÜ[ÛIÌ	ÎÂˆÛÛœÝÜ[Û’[™^\™Y›ÜË™š[™[™^
O”Ýš[™Ê
OOO[ÛÜ[ÛŠNÂˆYŠÜ[Û’[™^Ü[Û’[™^OO\™Y˜J]›ÝÈ™]È\œ›ÜŠ	ÝŒŒÌÎˆ\™Ù]\Ý˜XÝÜˆÛÛ˜XÝšY	ÊNÂˆÛÛœÝÛÜœ™XÝ™Y›Ü™OTÝš[™Ê™Y›ÜÖÜ™Y˜WJNÂˆ™Y›ÜÖÛÜ[Û’[™^O[™]ÓÜ[ÛŽÂˆYŠÝš[™Ê™Y›ÜÖÜ™Y˜WJHOOXÛÜœ™XÝ™Y›Ü™_ÛÜœ™XÝ™Y›Ü™HOOIÌÉÊ]›ÝÈ™]È\œ›ÜŠ	ÝŒŒÌÎˆÛÜœ™XÝ[œÝÙ\ˆÚ[™ÙY	ÊNÂ‚ˆÛÛœÝ™YY˜XÚÏSØš™XÝ™œ™Y^™JÂˆXYÛ›ÜÚ\Î‰øà#8à#xà¤º`n8à¤øàh9h-9d"8à [Z[”Üøà¤¹b'y§'ù`)8àk¸ào¸ào¹¦í9¥¬8àeøài¸àa8ào¸àføà¤øà šLxàiÌ8àc9ç'øàjøàj¸àhøàgù¦`¹à®xàiÛZ[”ÜÏLxàn8à ZLøàiÌO¸àc9ç'øàjøàj¸àhøàgù¦`¹à®xàiÛZ[”ÜÏLøàn9¦í9¥¬8àeøào¸àfxà ‰ËˆÚXÚÜÚ[‰ùaé¹ä!¸àk¹b!¹l¤9à®{ï&šLøàiÙ]VÌ×OLxàj]VÛZ[”Ü×OL¸à¤¹«å:/ øàeøà y§hy.í¸àc9ç'øàj¸àk¸àiÛZ[”ÜÈ8¡¤øàiøàfxà ‰Ëˆ™^ÝYN‰ÛZ[”Üøàjøàkøà#9ãï¹g*8ào¸àiøàjú)¢øài8àdxàgù§ 9l#ù`)8àk¹­îùkeøà#xà¤¹/çykf8àeøà xà¢8à¢¹l#øàexàa9`)8à¤º)¢øài8àdxà¢øàgøàløàjù¦í9¥¬8àeøào¸àfxà ‰ÂˆJNÂˆÛÛœÝžU^^Ë‹‹Š™YÜ›Û™Ñ™YY˜XÚÐžU^ßJ_NÂˆ[]HžU^ÛÛÜ[Û—NÂˆžU^Û™]ÓÜ[Û—OY™YY˜XÚÎÂˆ™YÜ›Û™Ñ™YY˜XÚÐžU^XžU^ÂˆÛÛœÝÜ›Û™Ñ™YY˜XÚÏP\œ˜^Kš\Ð\œ˜^J™YÜ›Û™Ñ™YY˜XÚÊOÖË‹‹œ™YÜ›Û™Ñ™YY˜XÚ×Nœ™Y›ÜË›X\


OOˆ	ÉÊNÂˆÜ›Û™Ñ™YY˜XÚÖÛÜ[Û’[™^OY™YY˜XÚÎÂˆÜ›Û™Ñ™YY˜XÚÖÜ™Y˜WOIÉÎÂˆ™YÜ›Û™Ñ™YY˜XÚÏ]Ü›Û™Ñ™YY˜XÚÎÂ‚ˆËÈHŒŒÌˆÝ]XÈ]Y][ÛÈ[œÜXÝY\È^˜KY\Ý˜XÝÜˆX›KˆÚ]›Ý\‚ˆËÈ]]Ü™YÚÚXÙ\È]\È›ÝÝ\œ™[HÝ\™˜XÙY]ÙY\[™ÈH[žH[ˆBˆËÈØ[YH[œÝÙ\ˆ˜[Z[H™]™[ÈH]\™HÙ[™\˜]Ü‹]ÚYÚ[™ÙHœ›ÛH™]š]š[™ÈHZ\ÛX]Ú‚ˆYŠ—ÓSÐÒ×ÑVWÑTÕPÕÔËœÙ[XÝ[Û—ÜÛÜØOO[ÛÜ[ÛŠ^Âˆ—ÓSÐÒ×ÑVWÑTÕPÕÔ‹œÙ[XÝ[Û—ÜÛÜØ[™]ÓÜ[ÛŽÂˆB‚ˆÛØ˜[\Ë”ÕP’‘PÕÐ—ÑTÕPÕÔ—ÔUPSUWÕŒŒÌ×ÔÔPÏSØš™XÝ™œ™Y^™JÂˆš[™[™Ô™\ÛÛ™Y™š[™[™ËˆÛÝ\˜ÙP]Y]ˆ\™Ù]^\˜Ú\ÙN‰ÜÙ[XÝ[Û—ÜÛÜØ‰Ëˆ\™Ù]]Y\Ý[ÛŽ‰ù§ 9í`¹æ¡8àj›Z[”Üøàkûï'ÉËˆÛ\Ý˜XÝÜŽ›ÛÜ[Û‹ˆ™]Ñ\Ý˜XÝÜŽ›™]ÓÜ[Û‹ˆZ\ØÛÛ˜Ù\[ÛŽ‰ÜÝ[KZ[š]X[[Z[”ÜÉËˆÛÜœ™XÝ[œÝÙ\Ž‰ÌÉËˆÛÜœ™XÝ[œÝÙ\Ú[™ÙY™˜[ÙKˆ›Û\Ú[™ÙY™˜[ÙKˆY™šXÝ[SX™[Ú[™ÙY™˜[ÙKˆØÛÜš[™ÐÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û”Ù[XÝ[ÛÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û“Ü™\Ú[™ÙY™˜[ÙKˆ[Z[™ÐÚ[™ÙY™˜[ÙKˆ™XY[™\ÜÕ™\ÚÛÚ[™ÙY™˜[ÙKˆ™[YYX][Û•\™Ù]ÐÚ[™ÙY™˜[ÙKˆŒŒÌ™YY˜XÚÔ™\Ù\™YYBˆJNÂŸJJ
NÂ‹ËÈOOOOH‘HUQTÕŒŒÍHÝXš™XÝˆ˜XÙKYš[˜[Ü›Û™ËY™YY˜XÚÈ›ÜYØ][Ûˆ™\Z\ˆOOOOBŠ

HOˆÂˆÛÛœÝš[™[™ÏIÜÝXš™XÝØ—Ý˜XÙWÙš[˜[Ù™YY˜XÚ×Û›ÝÜ›ÜYØ]Y	ÎÂˆÛÛœÝÛÝ\˜ÙP]Y]IÝŒŒÍ\ÝXš™XÝX‹Y\Ý˜XÝÜ‹\]X[]K[X\›™\‹Y›ÝËX]Y]	ÎÂˆÛÛœÝ™Y›Ü™O[XZÙQš[˜[[ÛÑœ›ÛU˜XÙNÂ‚ˆ[˜Ý[Ûˆ^
Š^Ü™]\›ˆÝš[™ÊÏÉÉÊKš[J
NßBˆ[˜Ý[ÛˆÜ[ÛœÓÙŠJ^Ü™]\›ˆ\œ˜^Kš\Ð\œ˜^JOË›Ü[ÛœÊOÜK›Ü[ÛœÎŠ\œ˜^Kš\Ð\œ˜^JOË›ÜÊOÜK›ÜÎ–×JNßBˆ[˜Ý[Ûˆ[œÝÙ\’[™^ÙŠJ^ÂˆYŠ[X™\‹š\Ò[YÙ\ŠOË˜JJ\™]\›ˆK˜NÂˆYŠ[X™\‹š\Ò[YÙ\ŠOË˜ÛÜœ™XÝ[™^
J\™]\›ˆK˜ÛÜœ™XÝ[™^ÂˆYŠ[X™\‹š\Ò[YÙ\ŠOË˜[œÝÙ\’[™^
J\™]\›ˆK˜[œÝÙ\’[™^ÂˆYŠ\[ÙˆOË˜ÛÜœ™XÝ^OOIÜÝš[™ÉÊ\™]\›ˆÜ[ÛœÓÙŠJK›X\
^
Kš[™^ÙŠ^
K˜ÛÜœ™XÝ^
JNÂˆYŠ[X™\‹š\Ò[YÙ\ŠOË˜ÛÜœ™XÝ
J\™]\›ˆK˜ÛÜœ™XÝÂˆ™]\›ˆLNÂˆBˆ[˜Ý[ÛˆÛÝ\˜ÙT™YXÝ[ÛŠ^Ù[™\˜]Y
^ÂˆÛÛœÝO]^
Ù[™\˜]YËœJNÂˆ™]\›ˆ
^ËœÝ\ß×JK›X\
ÏOœÏËœ™YXÝ
K™š[\Š›ÛÛX[ŠK™š[™
O^
œJOOO\J_[ÂˆBˆ[˜Ý[Ûˆ™YY˜XÚÐžU^
™Y
^ÂˆÛÛœÝX\^Ë‹‹Š™YËÜ›Û™Ñ™YY˜XÚÐžU^ßJ_NÂˆÛÛœÝÜÏ[Ü[ÛœÓÙŠ™Y
KOX[œÝÙ\’[™^ÙŠ™Y
K\œP\œ˜^Kš\Ð\œ˜^J™YËÜ›Û™Ñ™YY˜XÚÊOÜ™YÜ›Û™Ñ™YY˜XÚÎ–×NÂˆÜË™›Ü‘XXÚ

ÜJOOžÂˆYŠOOOXJ\™]\›ŽÂˆÛÛœÝÙ^O]^
Ü
NÂˆYŠ[X\ÚÙ^WI‰˜\œ–ÚWI‰\[Ùˆ\œ–ÚWOOOIÛØš™XÝ	Ê[X\ÚÙ^WOX\œ–ÚWNÂˆJNÂˆ™]\›ˆX\ÂˆBˆ[˜Ý[Ûˆ]XÚ
Ù[™\˜]Y™Y
^ÂˆYŠYÙ[™\˜]Y\™Y
\™]\›ˆÙ[™\˜]YÂˆÛÛœÝÜ[ÛœÏ[Ü[ÛœÓÙŠÙ[™\˜]Y
KOX[œÝÙ\’[™^ÙŠÙ[™\˜]Y
KÛÝ\˜ÙSX\Y™YY˜XÚÐžU^
™Y
KÜ›Û™Ñ™YY˜XÚÏV×KÜ›Û™Ñ™YY˜XÚÐžU^^ßNÂˆÜ[ÛœË™›Ü‘XXÚ

ÜJOOžÂˆÛÛœÝÙ^O]^
Ü
NÂˆYŠOOOXJ^ÝÜ›Û™Ñ™YY˜XÚÖÚWOIÉÎÜ™]\›ŽßBˆÛÛœÝ˜\ÛÝ\˜ÙSX\ÚÙ^W_	ÉÎÂˆÜ›Û™Ñ™YY˜XÚÖÚWOY˜ŽÂˆYŠ˜‰‰\[Ùˆ˜OOIÛØš™XÝ	Ê]Ü›Û™Ñ™YY˜XÚÐžU^ÚÙ^WOY˜ŽÂˆJNÂˆ™]\›ˆË‹‹™Ù[™\˜]YÜ›Û™Ñ™YY˜XÚËÜ›Û™Ñ™YY˜XÚÐžU^NÂˆB‚ˆXZÙQš[˜[[ÛÑœ›ÛU˜XÙOY[˜Ý[ÛŠ^
^ÂˆÛÛœÝÙ[™\˜]YX™Y›Ü™J^
NÂˆ™]\›ˆ]XÚ
Ù[™\˜]YÛÝ\˜ÙT™YXÝ[ÛŠ^Ù[™\˜]Y
JNÂˆNÂ‚ˆÛØ˜[\Ë”ÕP’‘PÕÐ—ÕPÑWÑ’SSÑ‘QQPÒ×ÕŒŒÍWÔÔPÏSØš™XÝ™œ™Y^™JÂˆš[™[™Ô™\ÛÛ™Y™š[™[™ËˆÛÝ\˜ÙP]Y]ˆÛXÞN‰Ý˜XÙKYš[˜[XÚÚXÙKY™YY˜XÚË[Y]Y]K\›ÜYØ][Û‰ËˆÛÝ\˜ÙSY]Y]N“Øš™XÝ™œ™Y^™JÉÝÜ›Û™Ñ™YY˜XÚÉË	ÝÜ›Û™Ñ™YY˜XÚÐžU^	×JKˆ™[X\Ù^N‰ÛÜ[Û‹]^	ËˆÛÝ\˜ÙT]Y\Ý[ÛÚ[™ÙY™˜[ÙKˆÙ[™\˜]Y›Û\Ú[™ÙY™˜[ÙKˆÙ[™\˜]YÜ[ÛœÐÚ[™ÙY™˜[ÙKˆÛÜœ™XÝ[œÝÙ\Ú[™ÙY™˜[ÙKˆØÛÜš[™ÐÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û”Ù[XÝ[ÛÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û“Ü™\Ú[™ÙY™˜[ÙKˆ[Z[™ÐÚ[™ÙY™˜[ÙKˆY™šXÝ[SX™[Ú[™ÙY™˜[ÙKˆ™XY[™\ÜÕ™\ÚÛÚ[™ÙY™˜[ÙKˆ™[YYX][Û•\™Ù]ÐÚ[™ÙY™˜[ÙKˆ›Ùš[TØÚ[XSZYÜ˜][Û”™\]Z\™Y™˜[ÙBˆJNÂˆÛØ˜[\Ë˜]XÚ˜XÙQš[˜[Ü›Û™Ñ™YY˜XÚÕŒŒÍOX]XÚÂŸJJ
NÂ‹ËÈOOOOH‘HUQTÕŒŒÎHÝXš™XÝˆš[˜[ÙXÝ\š]H›Ý][Ûˆ™\Z\ˆOOOOBŠ

HOˆÂˆÛÛœÝš[™[™ÏIÜÝXš™XÝØ—Ùš[˜[ÜÙXÝ\š]WÛÛ™×Ü[—ØÛÝ™\˜YÙWÙØ\	ÎÂˆÛÛœÝÛÝ\˜ÙP]Y]IÝŒŒÎ\ÝXš™XÝX‹Yš[˜[\ÙXÝ\š]K\›Ý][Û‹YXYÛ›ÜÚ\ËX]Y]	ÎÂˆÛÛœÝ™Y›Ü™OXZ[‘š[˜[Â‚ˆ[˜Ý[ÛˆÙY[ŠÊ^Ü™]\›ˆ›Ùš[K˜‘š[˜[Ý]ÏË–ØÙXÎ‰ÜËšYXOËœÙY[ŸßBˆ[˜Ý[ÛˆÛÛÊ
^Âˆ™]\›ˆÂˆÙÜÎ”ÑPÕT’UWÔÐÑST’SÔË™š[\ŠÏOˆH\Ë›ÙÊKˆØ\Ù\Î”ÑPÕT’UWÔÐÑST’SÔË™š[\ŠÏOˆ\Ë›ÙÊBˆNÂˆBˆ[˜Ý[Ûˆ][ÝJ
^ÂˆÛÛœÝÛÙÜËØ\Ù\ßO\ÛÛÊ
NÂˆÛÛœÝ[žTÙY[TÑPÕT’UWÔÐÑST’SÔËœÛÛYJÏOœÙY[ŠÊOŒ
NÂˆÛÛœÝ[œÙY[“ÙÜÏ[ÙÜË™š[\ŠÏOœÙY[ŠÊOOOL
K›[™ÝÂˆÛÛœÝ[œÙY[Ø\Ù\ÏXØ\Ù\Ë™š[\ŠÏOœÙY[ŠÊOOOL
K›[™ÝÂˆYŠX[žTÙY[Ÿ[œÙY[“ÙÜÊÝ[œÙY[Ø\Ù\ÏOOL
\™]\›ˆÛÙÜÎŒ‹Ø\Ù\ÎŒ‹Y\]™N™˜[ÙK[œÙY[“ÙÜË[œÙY[Ø\Ù\ßNÂ‚ˆÛÛœÝØ[™Y]\ÏVÌK‹×K›X\
ÙÐÛÝ[OžÂˆÛÛœÝØ\ÙPÛÝ[M[ÙÐÛÝ[ÂˆÛÛœÝ™]ÐÛÝ™\˜YÙOSX]›Z[ŠÙÐÛÝ[[œÙY[“ÙÜÊJÓX]›Z[ŠØ\ÙPÛÝ[[œÙY[Ø\Ù\ÊNÂˆ™]\›ˆÛÙÜÎ›ÙÐÛÝ[Ø\Ù\Î˜Ø\ÙPÛÝ[™]ÐÛÝ™\˜YÙK\Ý[˜ÙN“X]˜XœÊÙÐÛÝ[LŠ_NÂˆJKœÛÜ

KŠOOžÂˆYŠK›™]ÐÛÝ™\˜YÙHOOX‹›™]ÐÛÝ™\˜YÙJ\™]\›ˆ‹›™]ÐÛÝ™\˜YÙKXK›™]ÐÛÝ™\˜YÙNÂˆYŠK™\Ý[˜ÙHOOX‹™\Ý[˜ÙJ\™]\›ˆK™\Ý[˜ÙKX‹™\Ý[˜ÙNÂˆÛÛœÝÙÓ™YY][œÙY[“ÙÜË][œÙY[Ø\Ù\ÎÂˆYŠÙÓ™YYŒ
\™]\›ˆ‹›ÙÜËXK›ÙÜÎÂˆYŠÙÓ™YY
\™]\›ˆK›ÙÜËX‹›ÙÜÎÂˆ™]\›ˆÂˆJNÂˆÛÛœÝ™\ÝXØ[™Y]\ÖÌNÂˆ™]\›ˆÛÙÜÎ˜™\Ý›ÙÜËØ\Ù\Î˜™\Ý˜Ø\Ù\ËY\]™N˜™\Ý›ÙÜÈOOL‹[œÙY[“ÙÜË[œÙY[Ø\Ù\ßNÂˆBˆ[˜Ý[Ûˆ™XZ[ÙXÝ\š]J][\ËJ^ÂˆYŠP\œ˜^Kš\Ð\œ˜^J][\Ê_\OË˜Y\]™J\™]\›ˆ][\ÎÂˆÛÛœÝÙXÒ[™XÙ\ÏV×NÂˆ][\Ë™›Ü‘XXÚ

][KJOOžÚYŠ][OËšÚ[™OOIÜÙXÝ\š]IÊ\ÙXÒ[™XÙ\Ëœ\Ú
JNßJNÂˆYŠÙXÒ[™XÙ\Ë›[™ÝOOM
\™]\›ˆ][\ÎÂ‚ˆÛÛœÝÛÙÜËØ\Ù\ßO\ÛÛÊ
NÂˆÛÛœÝ\ÙY[™]ÈÙ]

NÂˆÛÛœÝÚÜÙ[“ÙÜÏ\XÚÔÙXÝ\š]Q›Ü‘š[˜[
ÙÜËK›ÙÜË\ÙY
NÂˆÛÛœÝÚÜÙ[Ø\Ù\Ï\XÚÔÙXÝ\š]Q›Ü‘š[˜[
Ø\Ù\ËK˜Ø\Ù\Ë\ÙY
NÂˆÛÛœÝÚÜÙ[VË‹‹˜ÚÜÙ[“ÙÜË‹‹˜ÚÜÙ[Ø\Ù\×NÂˆYŠÚÜÙ[‹›[™ÝOOM™]ÈÙ]
ÚÜÙ[‹›X\
ÏOœËšY
JKœÚ^™HOOM
\™]\›ˆ][\ÎÂ‚ˆÛÛœÝÝ]Z][\ËœÛXÙJ
NÂˆÚÜÙ[‹›X\
XZÙQš[˜[ÙXÝ\š]JK™›Ü‘XXÚ

][KJOOžÛÝ]ÜÙXÒ[™XÙ\ÖÚWWOZ][NßJNÂˆ™]\›ˆÝ]ÂˆB‚ˆZ[‘š[˜[Y[˜Ý[ÛŠ
^ÂˆÛÛœÝO\][ÝJ
NÂˆÛÛœÝ][\ÏX™Y›Ü™J
NÂˆ™]\›ˆ™XZ[ÙXÝ\š]J][\ËJNÂˆNÂ‚ˆÛØ˜[\Ë”ÕP’‘PÕÐ—Ñ’SSÔÑPÕT’UWÔ“ÕUSÓ—ÕŒŒÎWÔÔPÏSØš™XÝ™œ™Y^™JÂˆš[™[™Ô™\ÛÛ™Y™š[™[™ËˆÛÝ\˜ÙP]Y]ˆÛXÞN‰ØY\]™K\ÙXÝ\š]K\ÝXœÛÛXÛÝ™\˜YÙIËˆY˜][][ÝN“Øš™XÝ™œ™Y^™JÛÙÜÎŒ‹Ø\Ù\ÎŒŸJKˆY\]™T][ÝT˜[™ÙN“Øš™XÝ™œ™Y^™JÛZ[”\•\NŒKX^\•\NŒßJKˆš\œÝš[˜[™\Ù\™YYKˆ[ÙY[”™\ÝÜ™\ÑY˜][YKˆ^\Ý[™Ñ^ÜÝ\™TÝ]Ô™]\ÙYYKˆ›Ùš[TØÚ[XSZYÜ˜][Û”™\]Z\™Y™˜[ÙKˆÙXÝ\š]T]Y\Ý[ÛÛÝ[Ú[™ÙY™˜[ÙKˆÙXÝ\š]T]Y\Ý[ÛÛÛ[Ú[™ÙY™˜[ÙKˆ[ÛÜš]TÙ[XÝ[ÛÚ[™ÙY™˜[ÙKˆ[ÛÜš]SÜ™\Ú[™ÙY™˜[ÙKˆØÛÜš[™ÐÚ[™ÙY™˜[ÙKˆ[Z[™ÐÚ[™ÙY™˜[ÙKˆY™šXÝ[SX™[ÐÚ[™ÙY™˜[ÙKˆ™XY[™\ÜÕ™\ÚÛÚ[™ÙY™˜[ÙKˆ™[YYX][Û•\™Ù]ÐÚ[™ÙY™˜[ÙBˆJNÂˆÛØ˜[\ËœÝXš™XÝ‘š[˜[ÙXÝ\š]T][ÝUŒŒÎO\][ÝNÂˆÛØ˜[\Ëœ™XZ[š[˜[ÙXÝ\š]UŒŒÎO\™XZ[ÙXÝ\š]NÂŸJJ
NÂ‹ËÈOOOOH‘HUQTÕŒÈÝXš™XÝˆš[˜[\™]šY]È™X\ÛÛ‹ØXÝ[Ûˆ›Ý]H™\Z\ˆOOOOB˜ÛÛœÝÕP’‘PÕÐ—Ô‘U’QU×Ô‘PTÓÓ—Ô“ÕUWÕŒ×ÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛXÞN‰Ø[YÛ‹XÛÙK][™\œÝ[™[™Ë\™]šY]ËXXÝ[Û‹]Ú]Y^\Ý[™ËXÛÛ\Ý[™\˜XÝXÙKXÛÜIËˆÛÝ\˜ÙP]Y]‰ÝŒ‹\ÝXš™XÝX‹\™[YYX][Û‹]\™Ù]YÜ˜[[\š]KX]Y]	Ëˆš[™[™Ô™\ÛÛ™Y‰ÜÝXš™XÝØ—Ü™]šY]×Ü™X\ÛÛ—ØXÝ[Û—Ü›Ý]WÛZ\ÛX]Ú	ËˆY™™XÝYÚ[™‰Ø[ÛÜš]IËˆY™™XÝY™X\ÛÛŽ‰øà¬øàï8àâyä!º)èÉËˆ›Ý]N‰ØÛÛ\Ý[™	Ëˆ™\Ù\™\ÑY˜][][T™[YYX][ÛŽYKˆ™\Ù\™\ÔÙXÝ\š]T›Ý][™ÎYKˆ]Y\Ý[Û”Ù[XÝ[ÛÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û“Ü™\Ú[™ÙY™˜[ÙKˆØÛÜš[™ÐÚ[™ÙY™˜[ÙKˆ[Z[™ÐÚ[™ÙY™˜[ÙKˆ™XY[™\ÜÐÚ[™ÙY™˜[ÙKˆ›Ùš[TØÚ[XPÚ[™ÙY™˜[ÙKˆŒÌÎR[YÜ˜][ÛŽ‰Ù^XÚ]Yš[˜[\™\Ý[\\[[™IÂŸJNÂ‚™[˜Ý[ÛˆÝXš™XÝ‘š[˜[™]šY]Õ\™Ù]ŒÊ]Z[™X\ÛÛŠ^ÂˆÛÛœÝ˜\ÙOX‘š[˜[™[YYX][Û•\™Ù]
]Z[ËœÝYS[ÙK]Z[ËœÛÝ\˜ÙRY]Z[Ë™ÛXZ[Ÿ	ÉÊNÂˆYŠ]Z[ËšÚ[™OOIÜÙXÝ\š]IÉ‰œ™X\ÛÛOOIøà¬øàï8àâyä!º)èÉÊ\™]\›ˆÛ[ÙN‰ØÛÛ\Ý[™	ËY›[NÂˆ™]\›ˆ˜\ÙNÂŸB‚™[˜Ý[Ûˆ\P‘š[˜[™]šY]Ô›Ý]UŒÊ][\
^ÂˆÛÛœÝÜ›Û™ÏJ][\Ë™]Z[ß×JK™š[\ŠOˆY›ÚÊNÂˆÛÛœÝ]ÛœÏVË‹‹™ØÝ[Y[œ]Y\žTÙ[XÝÜ[
	ÖÙ]KX™š[˜[ÝYWIÊWNÂˆ]ÛœË™›Ü‘XXÚ

‹JOOžÂˆÛÛœÝ]Z[]Ü›Û™ÖÚWNÂˆYŠY]Z[
\™]\›ŽÂˆÛÛœÝÙ^OX‘š[˜[Z\ÝZÙRÙ^J]Z[
NÂˆÛÛœÝ™X\ÛÛ\›Ùš[K˜‘š[˜[Z\ÝZÙTÝ]ÏË–ÚÙ^WOË›\Ý™X\ÛÛŸ	ÉÎÂˆÛÛœÝ\™Ù]\ÝXš™XÝ‘š[˜[™]šY]Õ\™Ù]ŒÊ]Z[™X\ÛÛŠNÂˆYŠ\™Ù]›[ÙHOOIØÛÛ\Ý[™	ß™X\ÛÛˆOOIøà¬øàï8àâyä!º)èÉß]Z[šÚ[™OOIÜÙXÝ\š]IÊ\™]\›ŽÂˆ‹›Û˜ÛXÚÏJ
OOžÂˆØÝ[Y[™Ù][[Y[žRY
	Ø‘š[˜[™\Ý[	ÊOË˜Û\ÜÓ\Ýœ™[[Ý™J	ÜÚÝÉÊNÂˆÙ]“[ÙJ	Û[ØÚÉÊNÂˆÝ\ÛÛ\Ý[™Ú[[™ÙJ
NÂˆNÂˆ‹™]\Ù]˜™š[˜[›Ý]UŒÏIØÛÛ\Ý[™	ÎÂˆJNÂŸB‚™ÛØ˜[\Ë”ÕP’‘PÕÐ—Ô‘U’QU×Ô‘PTÓÓ—Ô“ÕUWÕŒ×ÔÔPÏTÕP’‘PÕÐ—Ô‘U’QU×Ô‘PTÓÓ—Ô“ÕUWÕŒ×ÔÔPÎÂ™ÛØ˜[\ËœÝXš™XÝ‘š[˜[™]šY]Õ\™Ù]ŒÏ\ÝXš™XÝ‘š[˜[™]šY]Õ\™Ù]ŒÎÂ™ÛØ˜[\Ë˜\P‘š[˜[™]šY]Ô›Ý]UŒÏX\P‘š[˜[™]šY]Ô›Ý]UŒÎÂ‹ËÈOOOOH‘HUQTÕŒHÝXš™XÝˆÙXÝ\š]Hš[˜[\™]šY]È™X\ÛÛ‹[X™[™\Z\ˆOOOOB˜ÛÛœÝÕP’‘PÕÐ—ÔÑPÕT’UWÔ‘U’QU×Ô‘PTÓÓ—ÕŒWÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛXÞN‰ÜÙXÝ\š]K\ÜXÚYšXË\™]šY]Ë\™X\ÛÛœËX[™XXÝ[Û‹XÛÜIËˆÛÝ\˜ÙP]Y]‰ÝŒ\ÝXš™XÝX‹\™]šY]Ë\™X\ÛÛ‹\›Ý]K\ÜÝ\™\Z\‹X]Y]	Ëˆš[™[™Ô™\ÛÛ™Y‰ÜÝXš™XÝØ—ÜÙXÝ\š]WÜ™]šY]×Ü™X\ÛÛ—ØXÝ[Û—Ü›Ý]WÛZ\ÛX]Ú	Ëˆ™\XÙ\Õš\ÚX›T™X\ÛÛœÎ“Øš™XÝ™œ™Y^™JÂˆ	øàâ8àë8àï8à®xàçøà®IÎ‰ù¢búh!¸àkº/ïxàa:`exàa	Ëˆ	øà¬øàï8àâyä!º)èÉÎ‰ùkï¹ëe¸àk¹ä!º)èÉÂˆJKˆÙXÝ\š]T›Ý]N‰ÜÙXÝ\š]IËˆÙY\ÓYØXÞT™X\ÛÛ’Ù^\Ô™XYX›NYKˆ[ÛÜš]T™X\ÛÛ“X™[ÐÚ[™ÙY™˜[ÙKˆÙXÝ\š]U\™Ù]YÐÚ[™ÙY™˜[ÙKˆØÛÜš[™ÐÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û”Ù[XÝ[ÛÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û“Ü™\Ú[™ÙY™˜[ÙKˆ[Z[™ÐÚ[™ÙY™˜[ÙKˆ™XY[™\ÜÐÚ[™ÙY™˜[ÙKˆ›Ùš[TØÚ[XSZYÜ˜][Û”™\]Z\™Y™˜[ÙKˆŒÌÎR[YÜ˜][ÛŽ‰Ù^XÚ]Yš[˜[\™\Ý[\\[[™IÂŸJNÂ‚˜ÛÛœÝ×Ø‘š[˜[™]šY]Ô™X\ÛÛ“Y]P™Y›Ü™UŒOX‘š[˜[™]šY]Ô™X\ÛÛ“Y]NÂ™[˜Ý[ÛˆÝXš™XÝ”ÙXÝ\š]T™X\ÛÛØ[›ÛšXØ[ŒJ™X\ÛÛŠ^ÂˆYŠ™X\ÛÛOOIøàâ8àë8àï8à®xàçøà®IÊ\™]\›ˆ	ù¢búh!¸àkº/ïxàa:`exàa	ÎÂˆYŠ™X\ÛÛOOIøà¬øàï8àâyä!º)èÉÊ\™]\›ˆ	ùkï¹ëe¸àk¹ä!º)èÉÎÂˆ™]\›ˆ™X\ÛÛŽÂŸB˜‘š[˜[™]šY]Ô™X\ÛÛ“Y]OY[˜Ý[ÛŠ™X\ÛÛ‹
^ÂˆYŠËšÚ[™OOIÜÙXÝ\š]IÊ\™]\›ˆ×Ø‘š[˜[™]šY]Ô™X\ÛÛ“Y]P™Y›Ü™UŒJ™X\ÛÛ‹
NÂˆÛÛœÝ\ÝXš™XÝ”ÙXÝ\š]T™X\ÛÛØ[›ÛšXØ[ŒJ™X\ÛÛŠNÂˆYŠOOIù¢búh!¸àkº/ïxàa:`exàa	Ê\™]\›ˆÉøà®øà«xàéxàê¸àá¸à¨ù¯%9ïä¸àiù¢búh!¹è®º*£IË	ùb'ybåxàîùè®º*£xàîùh,ydb¸àkºh!¹n£øà¤¸à yd#8àf8à­øàâ¸àê¸àª¹oh¹o#øàiù¥m9ä!¸àeøài¹è®º*£xàeøào¸àfxà ‰×NÂˆYŠOOIùkï¹ëe¸àk¹ä!º)èÉÊ\™]\›ˆÉøà®øà«xàéxàê¸àá¸à¨ù¯%9ïä¸àiùkï¹ëe¹è®º*£IË	ú!!yj xàj9kï¹ëe¸àk¹kï¹oç:e¨¹/à¸à¤¹¥m9ä!¸àeøài¸àbøà¢xà z*l¹odøàfxà¢øà®øà«xàéxàê¸àá¸à¨ù¯%9ïä¸àiùè®º*£xàeøào¸àfxà ‰×NÂˆ™]\›ˆ×Ø‘š[˜[™]šY]Ô™X\ÛÛ“Y]P™Y›Ü™UŒJ™X\ÛÛ‹
NÂŸNÂ‚™[˜Ý[Ûˆ\P‘š[˜[ÙXÝ\š]T™X\ÛÛ“X™[ÕŒJ][\
^ÂˆÛÛœÝÜ›Û™ÏJ][\Ë™]Z[ß×JK™š[\ŠOˆY›ÚÊNÂˆÛÛœÝ›ÝÜÏVË‹‹™ØÝ[Y[œ]Y\žTÙ[XÝÜ[
	Ë˜™š[˜[\™]šY]ËZ][KÜ›Û™ÉÊWNÂˆ›ÝÜË™›Ü‘XXÚ

›ÝËJOOžÂˆÛÛœÝ]Z[]Ü›Û™ÖÚWNÂˆYŠ]Z[ËšÚ[™OOIÜÙXÝ\š]IÊ\™]\›ŽÂˆÛÛœÝÙ^OX‘š[˜[Z\ÝZÙRÙ^J]Z[
NÂˆÛÛœÝÝÜ™Y\›Ùš[K˜‘š[˜[Z\ÝZÙTÝ]ÏË–ÚÙ^WOË›\Ý™X\ÛÛŸ	ÉÎÂˆÛÛœÝØ[›ÛšXØ[\ÝXš™XÝ”ÙXÝ\š]T™X\ÛÛØ[›ÛšXØ[ŒJÝÜ™Y
NÂˆ›ÝËœ]Y\žTÙ[XÝÜ[
	ÖÙ]KX™œ™X\ÛÛ—IÊK™›Ü‘XXÚ
OžÂˆYŠ‹™]\Ù]˜™œ™X\ÛÛOOIøàâ8àë8àï8à®xàçøà®IÊ^Âˆ‹™]\Ù]˜™œ™X\ÛÛIù¢búh!¸àkº/ïxàa:`exàa	ÎÂˆ‹^ÛÛ[Iù¢búh!¸àkº/ïxàa:`exàa	ÎÂˆY[ÙHYŠ‹™]\Ù]˜™œ™X\ÛÛOOIøà¬øàï8àâyä!º)èÉÊ^Âˆ‹™]\Ù]˜™œ™X\ÛÛIùkï¹ëe¸àk¹ä!º)èÉÎÂˆ‹^ÛÛ[Iùkï¹ëe¸àk¹ä!º)èÉÎÂˆBˆ‹˜Û\ÜÓ\ÝÙÙÛJ	ÜXÚÙY	Ë‹™]\Ù]˜™œ™X\ÛÛOOXØ[›ÛšXØ[
NÂˆJNÂˆJNÂŸB‚™ÛØ˜[\Ë”ÕP’‘PÕÐ—ÔÑPÕT’UWÔ‘U’QU×Ô‘PTÓÓ—ÕŒWÔÔPÏTÕP’‘PÕÐ—ÔÑPÕT’UWÔ‘U’QU×Ô‘PTÓÓ—ÕŒWÔÔPÎÂ™ÛØ˜[\ËœÝXš™XÝ”ÙXÝ\š]T™X\ÛÛØ[›ÛšXØ[ŒO\ÝXš™XÝ”ÙXÝ\š]T™X\ÛÛØ[›ÛšXØ[ŒNÂ™ÛØ˜[\Ë˜\P‘š[˜[ÙXÝ\š]T™X\ÛÛ“X™[ÕŒOX\P‘š[˜[ÙXÝ\š]T™X\ÛÛ“X™[ÕŒNÂ‹ËÈOOOOH‘HUQTÕŒÌÎHÝXš™XÝˆš[˜[\™\Ý[^XÚ]\[[™HOOOOB˜ÛÛœÝÕP’‘PÕÐ—Ñ’SSÔ‘TÕSÔTSS‘WÕŒÌÎWÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛXÞN‰Ü™\XÙK]™YKYš[˜[\™\Ý[]Ü˜\\‹[^Y\œË]Ú][Û™KY^XÚ]\\[[™IËˆÛÝ\˜ÙP]Y]‰ÝŒÌÎ\ÜÝ]ŒÌÍËX\˜Ú]XÝ\™KX]Y]	Ëˆ™\XÙ\Ô™[™\•Ü˜\\œÎ“Øš™XÝ™œ™Y^™JÉÝŒŒNIË	ÝŒÉË	ÝŒI×JKˆ™\Ù\™\Ò[›™\•Ü˜\\œÎ“Øš™XÝ™œ™Y^™JÉÝŒŒMÉË	ÝŒŒÌ	×JKˆ^XÝ][Û“Ü™\Ž“Øš™XÝ™œ™Y^™JÂˆ	ÝŒŒNKYX\›™YY\Ü^K[›Ü›X[^˜][Û‰Ëˆ	ÝŒŒMË\™XÛÝ™\žKX™Y›Ü™KØ˜\ÙKØY\‰Ëˆ	ÝŒŒÌXÚÚXÙK\ÜXÚYšXËY™YY˜XÚÉËˆ	ÝŒË\™]šY]Ë\›Ý]IËˆ	ÝŒK\ÙXÝ\š]K\™X\ÛÛ‹[X™[ÉÂˆJKˆØÛÜš[™ÐÚ[™ÙY™˜[ÙKˆ\œÚ\ÝYÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û”Ù[XÝ[ÛÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û“Ü™\Ú[™ÙY™˜[ÙKˆ™XY[™\ÜÐÚ[™ÙY™˜[ÙKˆ›Ùš[TØÚ[XPÚ[™ÙY™˜[ÙBŸJNÂ‚˜ÛÛœÝ×Ü™[™\‘š[˜[™\Ý[™Y›Ü™UŒÌÎO\™[™\‘š[˜[™\Ý[Âœ™[™\‘š[˜[™\Ý[Y[˜Ý[ÛŠ][\X\›™Y
^ÂˆÛÛœÝ\Ü^QX\›™Y\ÝXš™XÝ‘š[˜[X\›™Y›Ü”™[™\•ŒŒNJ][\X\›™Y
NÂˆÛÛœÝÝ]W×Ü™[™\‘š[˜[™\Ý[™Y›Ü™UŒÌÎJ][\\Ü^QX\›™Y
NÂˆ\P‘š[˜[™]šY]Ô›Ý]UŒÊ][\
NÂˆ\P‘š[˜[ÙXÝ\š]T™X\ÛÛ“X™[ÕŒJ][\
NÂˆ™]\›ˆÝ]ÂŸNÂ‚™ÛØ˜[\Ë”ÕP’‘PÕÐ—Ñ’SSÔ‘TÕSÔTSS‘WÕŒÌÎWÔÔPÏTÕP’‘PÕÐ—Ñ’SSÔ‘TÕSÔTSS‘WÕŒÌÎWÔÔPÎÂ‹ËÈOOOOH‘HUQTÕŒHÝXš™XÝˆš[˜[8¡¤•PÑH™[YYX][ÛˆY™šXÝ[H™\Z\ˆOOOOB˜ÛÛœÝÕP’‘PÕÐ—Ô‘SQQPUSÓ—ÑQ‘’PÕSWÕŒWÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛXÞN‰Ü™Y™\‹\Ø[YKYÛXZ[‹\Ø[YK[Ü‹YX\ÚY\‹X]]Ü™Y]˜XÙK]\™Ù]]Ú[‹X]˜Z[X›IËˆÛÝ\˜ÙP]Y]‰ÝŒ\ÝXš™XÝX‹\™[YYX][Û‹YY™šXÝ[KY]Z[	ËˆÛÝ\˜ÙQš[™[™Î‰ÜÝXš™XÝØ—Ü™[YYX][Û—Ý\™Ù]Ú\™\—Ý[—Ùš[˜[ÛX™[	Ëˆ™\Z\™Yš[˜[YÎ“Øš™XÝ™œ™Y^™JÉØ™^[WÛX]ÌIË	Ø™^[WÛX]Ì‰×JKˆ™]š[Ý\Õ\™Ù]‰ÛX]š^Ùš[™	Ëˆ™\Z\™Y\™Ù]‰ÛX]š^ÜÝ[IËˆ™\Ù\™Y^Ù\[ÛœÎ“Øš™XÝ™œ™Y^™JÉØ™^[WÝ™YWÌIË	Ø™^[WÝ™YWÌIË	Ø™^[WÛ\ÝÌ‰Ë	Ø™^[WÛ\ÝÌÉ×JKˆ^Ù\[Û”™X\ÛÛŽ‰Û›Ë\Ø[YKYÛXZ[‹\Ø[YK[Ü‹YX\ÚY\‹]˜XÙK]\™Ù]Z[‹XÝ\œ™[Z[™[ÜžIËˆY™šXÝ[SX™[ÐÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û”Ù[XÝ[ÛÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û“Ü™\Ú[™ÙY™˜[ÙKˆØÛÜš[™ÐÚ[™ÙY™˜[ÙKˆ[Z[™ÐÚ[™ÙY™˜[ÙKˆ™XY[™\ÜÐÚ[™ÙY™˜[ÙKˆ›Ùš[TØÚ[XPÚ[™ÙY™˜[ÙBŸJNÂ‚˜ÛÛœÝ×Ø‘š[˜[™[YYX][Û•\™Ù]™Y›Ü™UŒOX‘š[˜[™[YYX][Û•\™Ù]Â˜‘š[˜[™[YYX][Û•\™Ù]Y[˜Ý[ÛŠÝYS[ÙKÛÝ\˜ÙRYÛXZ[Š^ÂˆÛÛœÝ˜\ÙOW×Ø‘š[˜[™[YYX][Û•\™Ù]™Y›Ü™UŒJÝYS[ÙKÛÝ\˜ÙRYÛXZ[ŠNÂˆYŠÝYS[ÙOOOIÙ^[IÉ‰ŠÛÝ\˜ÙRYOOIØ™^[WÛX]ÌIßÛÝ\˜ÙRYOOIØ™^[WÛX]Ì‰ÊJ^Âˆ™]\›ˆÛ[ÙN‰Ý˜XÙIËY‰ÛX]š^ÜÝ[IßNÂˆBˆ™]\›ˆ˜\ÙNÂŸNÂ‚™ÛØ˜[\Ë”ÕP’‘PÕÐ—Ô‘SQQPUSÓ—ÑQ‘’PÕSWÕŒWÔÔPÏTÕP’‘PÕÐ—Ô‘SQQPUSÓ—ÑQ‘’PÕSWÕŒWÔÔPÎÂ‹ËÈOOOOH‘HUQTÕŒMÝXš™XÝˆØØ[[Û›H\‹\]Y\Ý[Ûˆ\™›Ü›X[˜ÙH[Z[™ÈOOOOB˜ÛÛœÝÕP’‘PÕÐ—ÓÐÐSÔT‘“Ô“PSÑWÕŒMÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛXÞN‰Ø›Ý[™Y[ØØ[[Û›KYš\œÝX[œÝÙ\‹XXÝ]™K][YKY]šY[˜ÙIËˆÛÝ\˜ÙP]Y]‰ÝŒLË\ÝXš™XÝX‹X[œÝÙ\‹[Y™XÞXÛKY]Z[	ËˆÛÝ\˜ÙQš[™[™Î‰ÜÝXš™XÝØ—ÛØØ[ØØ[Xœ˜][Û—ÛXÚÜ×Ü\—Ü]Y\Ý[Û—Ü™\ÜÛœÙWÝ[YIËˆ›Ùš[QšY[‰ÜÝXš™XÝ”\™›Ü›X[˜ÙUŒM	Ëˆ]™[ØÚ[XNŒKˆ]™[[Z]ŒˆX^[\ÙY\ÎŒNˆ^Y\œÎ“Øš™XÝ™œ™Y^™JÉØÛÛ\Ý[™	Ë	ÛZ[šS[ØÚÉË	ÜÙXÝ\š]S[ØÚÉË	Ùš[˜[	×JKˆš\œÝ[œÝÙ\“Û›NYKˆXÝ]™T]Y\Ý[Û•[YSÛ›NYKˆØØ[Û›NYKˆ™[[ÝU[[Y]žN™˜[ÙKˆØÛÜš[™ÐÚ[™ÙY™˜[ÙKˆ^[PÛÝ[ÝÛÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û”Ù[XÝ[ÛÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û“Ü™\Ú[™ÙY™˜[ÙKˆ™XY[™\ÜÐÚ[™ÙY™˜[ÙKˆY™šXÝ[SX™[ÐÚ[™ÙY™˜[ÙKˆ›Ùš[TØÚ[XSZYÜ˜][Û”™\]Z\™Y™˜[ÙBŸJNÂ‚˜ÛÛœÝ×ÜÝXš™XÝ”\™›Ü›X[˜ÙTÝ]UŒM^ßNÂ™[˜Ý[ÛˆÝXš™XÝ”\™›Ü›X[˜ÙS›ÝÕŒM

^Âˆ™]\›ˆ
\[Ùˆ\™›Ü›X[˜ÙHOOIÝ[™Yš[™Y	É‰œ\™›Ü›X[˜ÙI‰\[Ùˆ\™›Ü›X[˜ÙK››ÝÏOOIÙ[˜Ý[Û‰ÊOÜ\™›Ü›X[˜ÙK››ÝÊ
N‘]K››ÝÊ
NÂŸB™[˜Ý[ÛˆÝXš™XÝ”\™›Ü›X[˜ÙTÝ]UŒM
^Y\Š^ÂˆYŠW×ÜÝXš™XÝ”\™›Ü›X[˜ÙTÝ]UŒMÛ^Y\—J^Âˆ×ÜÝXš™XÝ”\™›Ü›X[˜ÙTÝ]UŒMÛ^Y\—O^Ú][\Ô™YŽ›[XÝ]™RÙ^N›[Ý\Y]Œ[\ÙYžßKœ›Þ™[ŽžßKš\œÝÚÎžßKš\œÝ]žßKY]NžßKÚÚ\žßK›\ÚY™˜[Ù_NÂˆBˆ™]\›ˆ×ÜÝXš™XÝ”\™›Ü›X[˜ÙTÝ]UŒMÛ^Y\—NÂŸB™[˜Ý[ÛˆÝXš™XÝ”\™›Ü›X[˜ÙT™\Ù]ŒM
^Y\‹][\Ô™YŠ^ÂˆÛÛœÝÝ\ÝXš™XÝ”\™›Ü›X[˜ÙTÝ]UŒM
^Y\ŠNÂˆÝš][\Ô™YZ][\Ô™YŽÜÝ˜XÝ]™RÙ^O[[ÜÝœÝ\Y]LÜÝ™[\ÙY^ßNÜÝ™œ›Þ™[^ßNÜÝ™š\œÝÚÏ^ßNÜÝ™š\œÝ]^ßNÜÝ›Y]O^ßNÜÝœÚÚ\^ßNÜÝ™›\ÚYY˜[ÙNÂˆ™]\›ˆÝÂŸB™[˜Ý[ÛˆÝXš™XÝ”\™›Ü›X[˜ÙT]\ÙUŒM
Ý›ÝÏ\ÝXš™XÝ”\™›Ü›X[˜ÙS›ÝÕŒM

J^ÂˆÛÛœÝÙ^O\Ý˜XÝ]™RÙ^NÂˆYŠÙ^I‰œÝœÝ\Y]	‰ˆJÙ^H[ˆÝ™œ›Þ™[ŠI‰ˆ\ÝœÚÚ\ÚÙ^WJ^ÂˆÝ™[\ÙYÚÙ^WOSX]›X^
[X™\ŠÝ™[\ÙYÚÙ^WJ_
JÓX]›X^
›ÝË\ÝœÝ\Y]
NÂˆBˆÝ˜XÝ]™RÙ^O[[ÜÝœÝ\Y]LÂŸB™[˜Ý[ÛˆÝXš™XÝ”\™›Ü›X[˜ÙP™Y›Ü™T™[™\•ŒM
^Y\‹][\Ô™Y‹Ù^K[œÝÙ\‹Y]J^Âˆ]Ý\ÝXš™XÝ”\™›Ü›X[˜ÙTÝ]UŒM
^Y\ŠNÂˆYŠÝš][\Ô™YˆOOZ][\Ô™YŠ\Ý\ÝXš™XÝ”\™›Ü›X[˜ÙT™\Ù]ŒM
^Y\‹][\Ô™YŠNÂˆÛÛœÝ›ÝÏ\ÝXš™XÝ”\™›Ü›X[˜ÙS›ÝÕŒM

NÂˆYŠÝ˜XÝ]™RÙ^I‰œÝ˜XÝ]™RÙ^HOOZÙ^J\ÝXš™XÝ”\™›Ü›X[˜ÙT]\ÙUŒM
Ý›ÝÊNÂˆÝ›Y]VÚÙ^WO[Y]_Ý›Y]VÚÙ^W_ßNÂˆYŠ[œÝÙ\ˆOO[[	‰˜[œÝÙ\ˆOO][™Yš[™Y	‰ˆJÙ^H[ˆÝ™œ›Þ™[ŠJ^ÂˆYŠÝ˜XÝ]™RÙ^OOOZÙ^J\ÝXš™XÝ”\™›Ü›X[˜ÙT]\ÙUŒM
Ý›ÝÊNÂˆÝœÚÚ\ÚÙ^WO]YNÂˆ™]\›ˆÝÂˆBˆYŠJÙ^H[ˆÝ™œ›Þ™[ŠI‰ˆ\ÝœÚÚ\ÚÙ^WI‰œÝ˜XÝ]™RÙ^HOOZÙ^J^ÂˆÝ˜XÝ]™RÙ^OZÙ^NÜÝœÝ\Y][›ÝÎÂˆBˆ™]\›ˆÝÂŸB™[˜Ý[ÛˆÝXš™XÝ”\™›Ü›X[˜ÙQœ™Y^™UŒM
^Y\‹Ù^KÙ[XÝYÛÜœ™XÝ[™^
^ÂˆÛÛœÝÝ\ÝXš™XÝ”\™›Ü›X[˜ÙTÝ]UŒM
^Y\ŠNÂˆYŠ
Ù^H[ˆÝ™œ›Þ™[Š_ÝœÚÚ\ÚÙ^WJ\™]\›ŽÂˆÛÛœÝ›ÝÏ\ÝXš™XÝ”\™›Ü›X[˜ÙS›ÝÕŒM

NÂˆYŠÝ˜XÝ]™RÙ^OOOZÙ^J\ÝXš™XÝ”\™›Ü›X[˜ÙT]\ÙUŒM
Ý›ÝÊNÂˆÛÛœÝ[\ÙYSX]›Z[ŠÕP’‘PÕÐ—ÓÐÐSÔT‘“Ô“PSÑWÕŒMÔÔPË›X^[\ÙY\ËX]›X^
X]œ›Ý[™
[X™\ŠÝ™[\ÙYÚÙ^WJ_
JJNÂˆÝ™œ›Þ™[–ÚÙ^WOY[\ÙYÂˆÝ™š\œÝÚÖÚÙ^WOS[X™\‹š\Ò[YÙ\Š[X™\ŠÛÜœ™XÝ[™^
JOÓ[X™\ŠÙ[XÝY
OOOS[X™\ŠÛÜœ™XÝ[™^
N™˜[ÙNÂˆÝ™š\œÝ]ÚÙ^WO[™]È]J
KÒTÓÔÝš[™Ê
NÂŸB™[˜Ý[ÛˆÝXš™XÝ”\™›Ü›X[˜ÙUÜ˜\]ÛœÕŒM
^Y\‹Ù^KÙ[XÝÜ‹ÛÜœ™XÝ[™^
^ÂˆØÝ[Y[œ]Y\žTÙ[XÝÜ[
Ù[XÝÜŠK™›Ü‘XXÚ
OžÂˆÛÛœÝÜšYÚ[˜[X‹›Û˜ÛXÚÎÂˆYŠ\[ÙˆÜšYÚ[˜[OOIÙ[˜Ý[Û‰ß‹™]\Ù]Ë™™\T\™•ŒMOOIÌIÊ\™]\›ŽÂˆYŠ‹™]\Ù]
X‹™]\Ù]™™\T\™•ŒMIÌIÎÂˆ‹›Û˜ÛXÚÏY[˜Ý[ÛŠ]Š^Âˆ]Ù[XÝY[[ÂˆYŠÙ[XÝÜOOIÖÙ]KX›[ÜIÊ\Ù[XÝYS[X™\Š‹™]\Ù]˜›[Ü
NÂˆ[ÙHYŠÙ[XÝÜOOIÖÙ]KXÛÜIÊ\Ù[XÝYS[X™\Š‹™]\Ù]˜ÛÜ
NÂˆ[ÙHYŠÙ[XÝÜOOIÖÙ]K\Û[ÜIÊ\Ù[XÝYS[X™\Š‹™]\Ù]œÛ[Ü
NÂˆ[ÙHYŠÙ[XÝÜOOIÖÙ]KX™›ÜIÊ\Ù[XÝYS[X™\Š‹™]\Ù]˜™›Ü
NÂˆÝXš™XÝ”\™›Ü›X[˜ÙQœ™Y^™UŒM
^Y\‹Ù^KÙ[XÝYÛÜœ™XÝ[™^
NÂˆ™]\›ˆÜšYÚ[˜[˜Ø[
\Ë]ŠNÂˆNÂˆJNÂŸB™[˜Ý[ÛˆÝXš™XÝ”\™›Ü›X[˜ÙP[œÝÙ\’[™^ŒM
][J^ÂˆYŠZ][_\[Ùˆ][HOOIÛØš™XÝ	Ê\™]\›ˆ[Âˆ›ÜŠÛÛœÝÙ^HÙˆÉØIË	Ø[œÝÙ\’[™^	Ë	ØÛÜœ™XÝ[™^	×J^ÂˆÛÛœÝS[X™\Š][VÚÙ^WJNÚYŠ[X™\‹š\Ò[YÙ\ŠŠJ\™]\›ˆŽÂˆBˆ™]\›ˆ[ÂŸB™[˜Ý[ÛˆÝXš™XÝ”\™›Ü›X[˜ÙS]™[ŒM
^Y\‹][J^ÂˆÛÛœÝ\™XÝTÝš[™Ê][OË›]™[ÏÚ][OËœ[]™[ÏÉÉÊKš[J
NÂˆYŠ\™XÝ
\™]\›ˆ\™XÝÂˆÛÛœÝÛÝ\˜ÙRYTÝš[™Ê][OËœÛÝ\˜ÙRYÏÉÉÊNÂˆYŠ^Y\OOIÙš[˜[	Ê^ÂˆYŠ][OËšÚ[™OOIÜÙXÝ\š]IÊ\™]\›ˆÝš[™ÊÑPÕT’UWÔÐÑST’SÔË™š[™
OžšYOO\ÛÝ\˜ÙRY
OË›]™[	ùª&y®¥‰ÊNÂˆ™]\›ˆÝš[™Ê—ÑVSWÐSÓ×ÒUSTË™š[™
OžšYOO\ÛÝ\˜ÙRY
OË›]™[	ùª&y®¥‰ÊNÂˆBˆYŠ^Y\OOIÜÙXÝ\š]S[ØÚÉÊ\™]\›ˆÝš[™ÊÑPÕT’UWÔÐÑST’SÔË™š[™
OžšYOO\ÛÝ\˜ÙRY
OË›]™[	ùª&y®¥‰ÊNÂˆYŠ^Y\OOIØÛÛ\Ý[™	Ê\™]\›ˆÝš[™ÊÛÛ\Ý[™Ù]Ë›]™[	ùª&y®¥‰ÊNÂˆ™]\›ˆ	ùª&y®¥‰ÎÂŸB™[˜Ý[ÛˆÝXš™XÝ”\™›Ü›X[˜ÙTÛÝ\˜ÙRYŒM
^Y\‹][K[™^
^ÂˆYŠ^Y\OOIÛZ[šS[ØÚÉÊ\™]\›ˆÝš[™Ê][OË™^YÏÚ][OËšYÏØZ[šN‰Ú[™^X
NÂˆYŠ^Y\OOIØÛÛ\Ý[™	Ê\™]\›ˆÝš[™Ê][OËœÛÝ\˜ÙRYÏÚ][OËšYÏØ	ØÛÛ\Ý[™Ù]ËšY	ØÛÛ\Ý[™	ßN‰Ú[™^X
NÂˆYŠ^Y\OOIÜÙXÝ\š]S[ØÚÉÊ\™]\›ˆÝš[™Ê][OËœÛÝ\˜ÙRYÏÚ][OËœØÙ[˜\š[ÒYÏÚ][OËšYÏØÙXÝ\š]N‰Ú[™^X
NÂˆYŠ^Y\OOIÙš[˜[	Ê\™]\›ˆÝš[™Ê][OËœÛÝ\˜ÙRYÏÚ][OËšYÏØš[˜[‰Ú[™^X
NÂˆ™]\›ˆ	Û^Y\ŸN‰Ú[™^XÂŸB™[˜Ý[ÛˆÝXš™XÝ”\™›Ü›X[˜ÙSY]UŒM
^Y\‹][K[™^
^Âˆ™]\›ˆÜÛÝ\˜ÙRYœÝXš™XÝ”\™›Ü›X[˜ÙTÛÝ\˜ÙRYŒM
^Y\‹][K[™^
K]™[œÝXš™XÝ”\™›Ü›X[˜ÙS]™[ŒM
^Y\‹][J_NÂŸB™[˜Ý[ÛˆÝXš™XÝ”\™›Ü›X[˜ÙRÙ^UŒM
^Y\‹][K[™^
^Âˆ™]\›ˆ	Ú[™^_	ÜÝXš™XÝ”\™›Ü›X[˜ÙTÛÝ\˜ÙRYŒM
^Y\‹][K[™^
_XÂŸB™[˜Ý[ÛˆÝXš™XÝ”\™›Ü›X[˜ÙT›ÛÝŒM

^Âˆ]›ÛÝ\›Ùš[KœÝXš™XÝ”\™›Ü›X[˜ÙUŒMÂˆYŠ\›ÛÝ\[Ùˆ›ÛÝOOIÛØš™XÝ	ß\œ˜^Kš\Ð\œ˜^J›ÛÝ
J\›ÛÝ^ÜØÚ[XNŒK]™[Î–×_NÂˆÛÛœÝ›ÝÜÏP\œ˜^Kš\Ð\œ˜^J›ÛÝ™]™[ÊOÜ›ÛÝ™]™[Î–×NÂˆ›ÛÝ^ÜØÚ[XNŒK]™[Îœ›ÝÜË™š[\ŠOž	‰\[ÙˆOOIÛØš™XÝ	ÊKœÛXÙJTÕP’‘PÕÐ—ÓÐÐSÔT‘“Ô“PSÑWÕŒMÔÔPË™]™[[Z]
_NÂˆ›Ùš[KœÝXš™XÝ”\™›Ü›X[˜ÙUŒM\›ÛÝÂˆ™]\›ˆ›ÛÝÂŸB™[˜Ý[ÛˆÝXš™XÝ”\™›Ü›X[˜ÙT™XÛÜ™ŒM
]™[
^ÂˆÛÛœÝ^Y\TÝš[™Ê]™[Ë›^Y\Ÿ	ÉÊNÂˆYŠTÕP’‘PÕÐ—ÓÐÐSÔT‘“Ô“PSÑWÕŒMÔÔPË›^Y\œËš[˜ÛY\Ê^Y\ŠJ\™]\›ˆ˜[ÙNÂˆÛÛœÝÛÝ\˜ÙRYTÝš[™Ê]™[ËœÛÝ\˜ÙRY	ÉÊKš[J
NÚYŠ\ÛÝ\˜ÙRY
\™]\›ˆ˜[ÙNÂˆÛÛœÝ[\ÙY\ÏSX]›Z[ŠÕP’‘PÕÐ—ÓÐÐSÔT‘“Ô“PSÑWÕŒMÔÔPË›X^[\ÙY\ËX]›X^
X]œ›Ý[™
[X™\Š]™[Ë™[\ÙY\Ê_
JJNÂˆÛÛœÝ›ÝÏ^Û^Y\‹ÛÝ\˜ÙRY]™[”Ýš[™Ê]™[Ë›]™[	ùª&y®¥‰ÊKÚÎˆHY]™[Ë›ÚË[\ÙY\Ë]”Ýš[™Ê]™[Ë˜]™]È]J
KÒTÓÔÝš[™Ê
J_NÂˆÛÛœÝ›ÛÝ\ÝXš™XÝ”\™›Ü›X[˜ÙT›ÛÝŒM

NÂˆ›ÛÝ™]™[ÏVË‹‹œ›ÛÝ™]™[Ë›Ý×KœÛXÙJTÕP’‘PÕÐ—ÓÐÐSÔT‘“Ô“PSÑWÕŒMÔÔPË™]™[[Z]
NÂˆ™]\›ˆYNÂŸB™[˜Ý[ÛˆÝXš™XÝ”\™›Ü›X[˜ÙQ›\ÚŒM
^Y\Š^ÂˆÛÛœÝÝ\ÝXš™XÝ”\™›Ü›X[˜ÙTÝ]UŒM
^Y\ŠNÂˆYŠÝ™›\ÚY
\™]\›ˆÂˆÝXš™XÝ”\™›Ü›X[˜ÙT]\ÙUŒM
Ý
NÂˆ]YYLÂˆØš™XÝšÙ^\ÊÝ™œ›Þ™[ŠK™›Ü‘XXÚ
Ù^OOžÂˆÛÛœÝY]O\Ý›Y]VÚÙ^W_ßNÂˆYŠÝXš™XÝ”\™›Ü›X[˜ÙT™XÛÜ™ŒM
Û^Y\‹ÛÝ\˜ÙRY›Y]KœÛÝ\˜ÙRY]™[›Y]K›]™[ÚÎˆH\Ý™š\œÝÚÖÚÙ^WK[\ÙY\ÎœÝ™œ›Þ™[–ÚÙ^WK]œÝ™š\œÝ]ÚÙ^W_JJXYY
ÊÎÂˆJNÂˆÝ™›\ÚY]YNÂˆ™]\›ˆYYÂŸB™[˜Ý[ÛˆÝXš™XÝ”\™›Ü›X[˜ÙTÝ[[X\žUŒM

^ÂˆÛÛœÝ›ÝÜÏ\ÝXš™XÝ”\™›Ü›X[˜ÙT›ÛÝŒM

K™]™[ÎÂˆÛÛœÝÝ[[X\š^™O[\ÝOžÂˆÛÛœÝ[Y\Ï[\Ý›X\
O“X]›X^
[X™\Š™[\ÙY\Ê_
JKœÛÜ

KŠOO˜KXŠK[\Ý›[™ÝÂˆÛÛœÝÛÜœ™XÝ[\Ý™š[\ŠOž›ÚÊK›[™ÝÂˆÛÛœÝYYX[[Ê‰LÝ[Y\ÖÊ‹LJKÌ—N“X]œ›Ý[™

[Y\ÖÛ‹Ì‹LWJÝ[Y\ÖÛ‹Ì—JKÌŠJNŒÂˆ™]\›ˆØÛÝ[›‹ÛÜœ™XÝ˜]N›ÓX]œ›Ý[™
ÛÜœ™XÝÛŠŒL
NŒ]™Ó\Î›ÓX]œ›Ý[™
[Y\Ëœ™YXÙJ
KŠOO˜JØ‹
KÛŠNŒYYX[“\Î›YYX[ŸNÂˆNÂˆÛÛœÝÜ›Ý\ZÙ^OO“Øš™XÝ™œ›ÛQ[šY\ÊË‹‹›™]ÈÙ]
›ÝÜË›X\
O”Ýš[™ÊÚÙ^W_	ù§*º*+yk¦‰ÊJJWKœÛÜ

K›X\
O–Ý‹Ý[[X\š^™J›ÝÜË™š[\ŠO”Ýš[™ÊÚÙ^W_	ù§*º*+yk¦‰ÊOOO]ŠJWJJNÂˆ™]\›ˆÝÝ[œÝ[[X\š^™J›ÝÜÊKžS^Y\Ž™Ü›Ý\
	Û^Y\‰ÊKžS]™[™Ü›Ý\
	Û]™[	Ê_NÂŸB‚˜ÛÛœÝ×Ü™[™\ÛÛ\Ý[™]Y\Ý[Û•ŒM\™[™\ÛÛ\Ý[™]Y\Ý[ÛŽÂœ™[™\ÛÛ\Ý[™]Y\Ý[ÛY[˜Ý[ÛŠ
^ÂˆÛÛœÝ][OXÛÛ\Ý[™Ù]Ëœ\ÏË–ØÛÛ\Ý[™[™^NÂˆYŠ][J^ÂˆÛÛœÝÙ^O\ÝXš™XÝ”\™›Ü›X[˜ÙRÙ^UŒM
	ØÛÛ\Ý[™	Ë][KÛÛ\Ý[™[™^
NÂˆÝXš™XÝ”\™›Ü›X[˜ÙP™Y›Ü™T™[™\•ŒM
	ØÛÛ\Ý[™	ËÛÛ\Ý[™Ù]Ëœ\ËÙ^KÛÛ\Ý[™[œÝÙ\œÏË–ØÛÛ\Ý[™[™^KÝXš™XÝ”\™›Ü›X[˜ÙSY]UŒM
	ØÛÛ\Ý[™	Ë][KÛÛ\Ý[™[™^
JNÂˆÛÛœÝÝ]W×Ü™[™\ÛÛ\Ý[™]Y\Ý[Û•ŒM

NÂˆÝXš™XÝ”\™›Ü›X[˜ÙUÜ˜\]ÛœÕŒM
	ØÛÛ\Ý[™	ËÙ^K	ÖÙ]KXÛÜIËÝXš™XÝ”\™›Ü›X[˜ÙP[œÝÙ\’[™^ŒM
][JJNÂˆ™]\›ˆÝ]ÂˆBˆ™]\›ˆ×Ü™[™\ÛÛ\Ý[™]Y\Ý[Û•ŒM

NÂŸNÂ‚˜ÛÛœÝ×Ü™[™\“[ØÚÔ]Y\Ý[Û•ŒM\™[™\“[ØÚÔ]Y\Ý[ÛŽÂœ™[™\“[ØÚÔ]Y\Ý[ÛY[˜Ý[ÛŠ
^ÂˆÛÛœÝ][OX“[ØÚÒ][\ÏË–Ø“[ØÚÒ[™^NÂˆYŠ][J^ÂˆÛÛœÝÙ^O\ÝXš™XÝ”\™›Ü›X[˜ÙRÙ^UŒM
	ÛZ[šS[ØÚÉË][K“[ØÚÒ[™^
NÂˆÝXš™XÝ”\™›Ü›X[˜ÙP™Y›Ü™T™[™\•ŒM
	ÛZ[šS[ØÚÉË“[ØÚÒ][\ËÙ^K“[ØÚÐ[œÝÙ\œÏË–Ø“[ØÚÒ[™^KÝXš™XÝ”\™›Ü›X[˜ÙSY]UŒM
	ÛZ[šS[ØÚÉË][K“[ØÚÒ[™^
JNÂˆÛÛœÝÝ]W×Ü™[™\“[ØÚÔ]Y\Ý[Û•ŒM

NÂˆÝXš™XÝ”\™›Ü›X[˜ÙUÜ˜\]ÛœÕŒM
	ÛZ[šS[ØÚÉËÙ^K	ÖÙ]KX›[ÜIËÝXš™XÝ”\™›Ü›X[˜ÙP[œÝÙ\’[™^ŒM
][JJNÂˆ™]\›ˆÝ]ÂˆBˆ™]\›ˆ×Ü™[™\“[ØÚÔ]Y\Ý[Û•ŒM

NÂŸNÂ‚˜ÛÛœÝ×Ü™[™\”ÙXÝ\š]S[ØÚÔ]Y\Ý[Û•ŒM\™[™\”ÙXÝ\š]S[ØÚÔ]Y\Ý[ÛŽÂœ™[™\”ÙXÝ\š]S[ØÚÔ]Y\Ý[ÛY[˜Ý[ÛŠ
^ÂˆÛÛœÝ][O\ÙXÓ[ØÚÒ][\ÏË–ÜÙXÓ[ØÚÒ[™^NÂˆYŠ][J^ÂˆÛÛœÝÙ^O\ÝXš™XÝ”\™›Ü›X[˜ÙRÙ^UŒM
	ÜÙXÝ\š]S[ØÚÉË][KÙXÓ[ØÚÒ[™^
NÂˆÝXš™XÝ”\™›Ü›X[˜ÙP™Y›Ü™T™[™\•ŒM
	ÜÙXÝ\š]S[ØÚÉËÙXÓ[ØÚÒ][\ËÙ^KÙXÓ[ØÚÐ[œÝÙ\œÏË–ÜÙXÓ[ØÚÒ[™^KÝXš™XÝ”\™›Ü›X[˜ÙSY]UŒM
	ÜÙXÝ\š]S[ØÚÉË][KÙXÓ[ØÚÒ[™^
JNÂˆÛÛœÝÝ]W×Ü™[™\”ÙXÝ\š]S[ØÚÔ]Y\Ý[Û•ŒM

NÂˆÝXš™XÝ”\™›Ü›X[˜ÙUÜ˜\]ÛœÕŒM
	ÜÙXÝ\š]S[ØÚÉËÙ^K	ÖÙ]K\Û[ÜIËÝXš™XÝ”\™›Ü›X[˜ÙP[œÝÙ\’[™^ŒM
][JJNÂˆ™]\›ˆÝ]ÂˆBˆ™]\›ˆ×Ü™[™\”ÙXÝ\š]S[ØÚÔ]Y\Ý[Û•ŒM

NÂŸNÂ‚˜ÛÛœÝ×Ü™[™\‘š[˜[]Y\Ý[Û•ŒM\™[™\‘š[˜[]Y\Ý[ÛŽÂœ™[™\‘š[˜[]Y\Ý[ÛY[˜Ý[ÛŠ
^ÂˆÛÛœÝ][OX‘š[˜[][\ÏË–Ø‘š[˜[[™^NÂˆYŠ][J^ÂˆÛÛœÝÙ^O\ÝXš™XÝ”\™›Ü›X[˜ÙRÙ^UŒM
	Ùš[˜[	Ë][K‘š[˜[[™^
NÂˆÝXš™XÝ”\™›Ü›X[˜ÙP™Y›Ü™T™[™\•ŒM
	Ùš[˜[	Ë‘š[˜[][\ËÙ^K‘š[˜[[œÝÙ\œÏË–Ø‘š[˜[[™^KÝXš™XÝ”\™›Ü›X[˜ÙSY]UŒM
	Ùš[˜[	Ë][K‘š[˜[[™^
JNÂˆÛÛœÝÝ]W×Ü™[™\‘š[˜[]Y\Ý[Û•ŒM

NÂˆÝXš™XÝ”\™›Ü›X[˜ÙUÜ˜\]ÛœÕŒM
	Ùš[˜[	ËÙ^K	ÖÙ]KX™›ÜIËÝXš™XÝ”\™›Ü›X[˜ÙP[œÝÙ\’[™^ŒM
][JJNÂˆ™]\›ˆÝ]ÂˆBˆ™]\›ˆ×Ü™[™\‘š[˜[]Y\Ý[Û•ŒM

NÂŸNÂ‚˜ÛÛœÝ×Ùš[š\ÚÛÛ\Ý[™Ú[[™ÙUŒMYš[š\ÚÛÛ\Ý[™Ú[[™ÙNÂ™š[š\ÚÛÛ\Ý[™Ú[[™ÙOY[˜Ý[ÛŠ‹‹˜\™ÜÊ^ØÛÛœÝÝ]W×Ùš[š\ÚÛÛ\Ý[™Ú[[™ÙUŒM˜\J\Ë\™ÜÊNÚYŠÝXš™XÝ”\™›Ü›X[˜ÙQ›\ÚŒM
	ØÛÛ\Ý[™	ÊJ\Ø]™T›Ùš[J
NÜ™]\›ˆÝ]ßNÂ˜ÛÛœÝ×Ùš[š\Ú“Z[šS[ØÚÕŒMYš[š\Ú“Z[šS[ØÚÎÂ™š[š\Ú“Z[šS[ØÚÏY[˜Ý[ÛŠ‹‹˜\™ÜÊ^ØÛÛœÝÝ]W×Ùš[š\Ú“Z[šS[ØÚÕŒM˜\J\Ë\™ÜÊNÚYŠÝXš™XÝ”\™›Ü›X[˜ÙQ›\ÚŒM
	ÛZ[šS[ØÚÉÊJ\Ø]™T›Ùš[J
NÜ™]\›ˆÝ]ßNÂ˜ÛÛœÝ×Ùš[š\ÚÙXÝ\š]S[ØÚÕŒMYš[š\ÚÙXÝ\š]S[ØÚÎÂ™š[š\ÚÙXÝ\š]S[ØÚÏY[˜Ý[ÛŠ‹‹˜\™ÜÊ^ØÛÛœÝÝ]W×Ùš[š\ÚÙXÝ\š]S[ØÚÕŒM˜\J\Ë\™ÜÊNÚYŠÝXš™XÝ”\™›Ü›X[˜ÙQ›\ÚŒM
	ÜÙXÝ\š]S[ØÚÉÊJ\Ø]™T›Ùš[J
NÜ™]\›ˆÝ]ßNÂ˜ÛÛœÝ×Ùš[š\Ú‘š[˜[ŒMYš[š\Ú‘š[˜[Â™š[š\Ú‘š[˜[Y[˜Ý[ÛŠ‹‹˜\™ÜÊ^ØÛÛœÝÝ]W×Ùš[š\Ú‘š[˜[ŒM˜\J\Ë\™ÜÊNÚYŠÝXš™XÝ”\™›Ü›X[˜ÙQ›\ÚŒM
	Ùš[˜[	ÊJ\Ø]™T›Ùš[J
NÜ™]\›ˆÝ]ßNÂ‚™ÛØ˜[\Ë”ÕP’‘PÕÐ—ÓÐÐSÔT‘“Ô“PSÑWÕŒMÔÔPÏTÕP’‘PÕÐ—ÓÐÐSÔT‘“Ô“PSÑWÕŒMÔÔPÎÂ™ÛØ˜[\ËœÝXš™XÝ”\™›Ü›X[˜ÙT™XÛÜ™ŒM\ÝXš™XÝ”\™›Ü›X[˜ÙT™XÛÜ™ŒMÂ™ÛØ˜[\ËœÝXš™XÝ”\™›Ü›X[˜ÙTÝ[[X\žUŒM\ÝXš™XÝ”\™›Ü›X[˜ÙTÝ[[X\žUŒMÂ™ÛØ˜[\ËœÝXš™XÝ”\™›Ü›X[˜ÙT›ÛÝŒM\ÝXš™XÝ”\™›Ü›X[˜ÙT›ÛÝŒMÂ‹ËÈOOOOH‘HUQTÕŒMÈÝXš™XÝˆX\›™\‹[ØØ[Y\]™H™XÛÛ[Y[™][ÛˆOOOOB˜ÛÛœÝÕP’‘PÕÐ—ÓÐÐSÐQTU‘WÔ‘PÓÓSQS‘USÓ—ÕŒM×ÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛXÞN‰ØXØÝ\˜XÞKYš\œÝXÛÛœÙ\˜]]™K[ØØ[\™XÛÛ[Y[™][Û‰ËˆÛÝ\˜ÙP]Y]‰ÝŒM‹\ÝXš™XÝX‹XY\]™K\™XÛÛ[Y[™][Û‹ZÛÚÉËˆÛÝ\˜ÙQšY[‰ÜÝXš™XÝ”\™›Ü›X[˜ÙUŒM	Ëˆ^Y\œÎ“Øš™XÝ™œ™Y^™JÉØÛÛ\Ý[™	Ë	ÛZ[šS[ØÚÉË	ÜÙXÝ\š]S[ØÚÉ×JKˆÚ[™ÝÔ\“^Y\ŽŒŒˆZ[”Ø[\\Ô\“^Y\ŽŽˆÙXZÐXØÝ\˜XÞU™\ÚÛÌˆ™\]Z\™\Ñš[˜[[œÎŒ‹ˆYP™Z]š[ÜŽ‰Ü™\Ù\™KY^\Ý[™Ë\™XÛÛ[Y[™][Û‰Ëˆ\\”›Ý][™Ô™\Ù\™YYKˆÙ[XÝ[Û”ÚYÛ˜[‰Ùš\œÝX[œÝÙ\‹XXØÝ\˜XÞK[Û›IËˆ™\ÜÛœÙU[YT›ÛN‰ØÛÜK[Û›K\ÙXÛÛ™\žKXÛÛ^	Ëˆ™\ÜÛœÙU[YPÛÜQ›ÛÜ“\ÎŒLˆØØ[Û›NYKˆ™[[ÝU[[Y]žN™˜[ÙKˆ™XÛÛ[Y[™][Û”Ý\™˜XÙN‰ÜÝXš™XÝ’X”™XÛÛ[Y[™][Û‰Ëˆ]Y\Ý[Û”Ù[XÝ[ÛÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û“Ü™\Ú[™ÙY™˜[ÙKˆØÛÜš[™ÐÚ[™ÙY™˜[ÙKˆ^[PÛÝ[ÝÛÚ[™ÙY™˜[ÙKˆ™XY[™\ÜÐÚ[™ÙY™˜[ÙKˆ™[YYX][Û•\™Ù]ÐÚ[™ÙY™˜[ÙKˆY™šXÝ[SX™[ÐÚ[™ÙY™˜[ÙKˆ›Ùš[TØÚ[XPÚ[™ÙY™˜[ÙBŸJNÂ‚™[˜Ý[ÛˆÝXš™XÝ“ØØ[YYX[•ŒMÊ˜[Y\Ê^ÂˆÛÛœÝÏJ˜[Y\ß×JK›X\
[X™\ŠK™š[\Š[X™\‹š\Ñš[š]JKœÛÜ

KŠOO˜KXŠNÂˆYŠ^Ë›[™Ý
\™]\›ˆÂˆÛÛœÝOSX]™›ÛÜŠË›[™ÝÌŠNÂˆ™]\›ˆË›[™Ý	LÓX]œ›Ý[™
ÖÛWJN“X]œ›Ý[™

ÖÛKLWJÞÖÛWJKÌŠNÂŸB‚™[˜Ý[ÛˆÝXš™XÝ“ØØ[^Y\”Ý]ÕŒMÊ
^ÂˆÛÛœÝ]™[Ï\ÝXš™XÝ”\™›Ü›X[˜ÙT›ÛÝŒM

K™]™[ß×NÂˆ™]\›ˆÕP’‘PÕÐ—ÓÐÐSÐQTU‘WÔ‘PÓÓSQS‘USÓ—ÕŒM×ÔÔPË›^Y\œË›X\
^Y\OžÂˆÛÛœÝ›ÝÜÏY]™[Ë™š[\ŠOžË›^Y\OO[^Y\ŠKœÛXÙJTÕP’‘PÕÐ—ÓÐÐSÐQTU‘WÔ‘PÓÓSQS‘USÓ—ÕŒM×ÔÔPËÚ[™ÝÔ\“^Y\ŠNÂˆÛÛœÝÛÝ[\›ÝÜË›[™ÝÂˆÛÛœÝÛÜœ™XÝ\›ÝÜË™š[\ŠOžË›ÚÏOO]YJK›[™ÝÂˆ™]\›ˆÂˆ^Y\‹ˆÛÝ[ˆÛÜœ™XÝˆ˜]N˜ÛÝ[ÓX]œ›Ý[™
ÛÜœ™XÝØÛÝ[
ŒL
N›[ˆYYX[“\ÎœÝXš™XÝ“ØØ[YYX[•ŒMÊ›ÝÜË›X\
OžË™[\ÙY\ÊJBˆNÂˆJNÂŸB‚™[˜Ý[ÛˆÝXš™XÝ“ØØ[^Y\“Y]UŒMÊ^Y\Š^ÂˆYŠ^Y\OOIØÛÛ\Ý[™	Ê\™]\›ˆÛ[ÙN‰ØÛÛ\Ý[™	Ë]N‰ú)!ùd"9ecúhc8à¤ºaãyà®yè®º*£IËXÛÛŽ‰ü'éêIËX™[‰ú)!ùd"9ecúhc	ßNÂˆYŠ^Y\OOIÛZ[šS[ØÚÉÊ\™]\›ˆÛ[ÙN‰ÛZ[šS[ØÚÉË]N‰øà¨¸àêøà­8àê¸à®¸àè8àçøàâùª(z*i¸àiúaãyà®yè®º*£IËXÛÛŽ‰ü'äçIËX™[‰øà¨¸àêøà­8àê¸à®¸àè8àçøàâùª(z*i‰ßNÂˆYŠ^Y\OOIÜÙXÝ\š]S[ØÚÉÊ\™]\›ˆÛ[ÙN‰ÜÙXÝ\š]S[ØÚÉË]N‰øà®øà«xàéxàê¸àá¸à¨È8àçøàâùª(z*i¸àiúaãyà®yè®º*£IËXÛÛŽ‰ü'æè{î#ÉËX™[‰øà®øà«xàéxàê¸àá¸à¨È8àçøàâùª(z*i‰ßNÂˆ™]\›ˆ[ÂŸB‚™[˜Ý[ÛˆÝXš™XÝ“ØØ[Y\]™U\\[ÝÙYŒMÊ^\Ê^Âˆ™]\›ˆJ^\ÈO[[	‰™^\ÏL	‰™^\ÏLÊNÂŸB‚™[˜Ý[ÛˆÝXš™XÝ“ØØ[Y\]™T™XÛÛ[Y[™][Û•ŒMÊ˜\ÙT™XËY]šXÜÊ^ÂˆÛÛœÝO[Y]šXÜßÝXš™XÝ”›ÙÜ™\ÜÓY]šXÜÊ
NÂˆYŠ[X™\ŠOË™š[˜[[œß
OÕP’‘PÕÐ—ÓÐÐSÐQTU‘WÔ‘PÓÓSQS‘USÓ—ÕŒM×ÔÔPËœ™\]Z\™\Ñš[˜[[œÊ\™]\›ˆ˜\ÙT™XÎÂˆÛÛœÝ[YÚX›O\ÝXš™XÝ“ØØ[^Y\”Ý]ÕŒMÊ
K™š[\ŠOž˜ÛÝ[TÕP’‘PÕÐ—ÓÐÐSÐQTU‘WÔ‘PÓÓSQS‘USÓ—ÕŒM×ÔÔPË›Z[”Ø[\\Ô\“^Y\‰‰“[X™\‹š\Ñš[š]Jœ˜]JJNÂˆYŠY[YÚX›K›[™Ý
\™]\›ˆ˜\ÙT™XÎÂˆ[YÚX›KœÛÜ

KŠOO˜Kœ˜]KX‹œ˜]_‹˜ÛÝ[XK˜ÛÝ[ÕP’‘PÕÐ—ÓÐÐSÐQTU‘WÔ‘PÓÓSQS‘USÓ—ÕŒM×ÔÔPË›^Y\œËš[™^ÙŠK›^Y\ŠKTÕP’‘PÕÐ—ÓÐÐSÐQTU‘WÔ‘PÓÓSQS‘USÓ—ÕŒM×ÔÔPË›^Y\œËš[™^ÙŠ‹›^Y\ŠJNÂˆÛÛœÝÙXZÏY[YÚX›VÌNÂˆYŠ[YÚX›K›[™ÝŒI‰™[YÚX›VÌWKœ˜]OOO]ÙXZËœ˜]J\™]\›ˆ˜\ÙT™XÎÂˆYŠÙXZËœ˜]O”ÕP’‘PÕÐ—ÓÐÐSÐQTU‘WÔ‘PÓÓSQS‘USÓ—ÕŒM×ÔÔPËÙXZÐXØÝ\˜XÞU™\ÚÛ
\™]\›ˆ˜\ÙT™XÎÂˆÛÛœÝY]O\ÝXš™XÝ“ØØ[^Y\“Y]UŒMÊÙXZË›^Y\ŠNÂˆYŠ[Y]J\™]\›ˆ˜\ÙT™XÎÂˆÛÛœÝ[Z[™Ï]ÙXZË›YYX[“\ÏTÕP’‘PÕÐ—ÓÐÐSÐQTU‘WÔ‘PÓÓSQS‘USÓ—ÕŒM×ÔÔPËœ™\ÜÛœÙU[YPÛÜQ›ÛÜ“\ÂˆØ9b'yfç¹fç¹ëe9¦`ºe¤øàk¹.+yi+¹`)8àkùí!	ÓX]›X^
KX]œ›Ý[™
ÙXZË›YYX[“\ËÌL
J_yéä¸àiøàf{ï"9¦`ºe¤øàkùæë¹k¢xàiøàf{ï"xà ˜ˆ‰ÉÎÂˆ™]\›ˆÂˆ‹‹˜˜\ÙT™XËˆÝYÙNŒËˆ[ÙN›Y]K›[ÙKˆY›[ˆ]N›Y]K]KˆXÛÛŽ›Y]KšXÛÛ‹ˆÚXÚÙ\Ž‰ùki¹ïäº*&:c,¸àbøà¢xàk¹£ä9¨b	Ëˆ\ØÎ˜9§ :/äIÝÙXZË˜ÛÝ[yecøàk¹b'yfç¹«hùëe9ã¡øàkÉÝÙXZËœ˜]_Ixàiøàfxà ¸ào¸àf‰ÛY]K›X™[xàiùè®º*£xàeøào¸àfxà ‰Ý[Z[™ßXˆØØ[]šY[˜ÙNYKˆØØ[]šY[˜ÙS^Y\ŽÙXZË›^Y\‹ˆØØ[]šY[˜ÙPÛÝ[ÙXZË˜ÛÝ[ˆØØ[]šY[˜ÙT˜]NÙXZËœ˜]BˆNÂŸB‚˜ÛÛœÝ×ÜÝXš™XÝ’X”™XÛÛ[Y[™][Û™Y›Ü™UŒMÏ\ÝXš™XÝ’X”™XÛÛ[Y[™][ÛŽÂœÝXš™XÝ’X”™XÛÛ[Y[™][ÛY[˜Ý[ÛŠ
^ÂˆÛÛœÝ˜\ÙOW×ÜÝXš™XÝ’X”™XÛÛ[Y[™][Û™Y›Ü™UŒMË˜\J\Ë\™Ý[Y[ÊNÂˆÛÛœÝ^\Ï]\[Ùˆ^[Q^\Ô™[XZ[š[™ÏOOIÙ[˜Ý[Û‰ÏÙ^[Q^\Ô™[XZ[š[™Ê
N›[ÂˆÛÛœÝš[˜[[ÝÙY\ÝXš™XÝ“ØØ[Y\]™U\\[ÝÙYŒMÊ^\ÊNÂˆYŠYš[˜[[ÝÙY
\™]\›ˆ˜\ÙNÂˆ™]\›ˆÝXš™XÝ“ØØ[Y\]™T™XÛÛ[Y[™][Û•ŒMÊ˜\ÙKÝXš™XÝ”›ÙÜ™\ÜÓY]šXÜÊ
JNÂŸNÂ‚™ÛØ˜[\Ë”ÕP’‘PÕÐ—ÓÐÐSÐQTU‘WÔ‘PÓÓSQS‘USÓ—ÕŒM×ÔÔPÏTÕP’‘PÕÐ—ÓÐÐSÐQTU‘WÔ‘PÓÓSQS‘USÓ—ÕŒM×ÔÔPÎÂ™ÛØ˜[\ËœÝXš™XÝ“ØØ[^Y\”Ý]ÕŒMÏ\ÝXš™XÝ“ØØ[^Y\”Ý]ÕŒMÎÂ™ÛØ˜[\ËœÝXš™XÝ“ØØ[Y\]™U\\[ÝÙYŒMÏ\ÝXš™XÝ“ØØ[Y\]™U\\[ÝÙYŒMÎÂ™ÛØ˜[\ËœÝXš™XÝ“ØØ[Y\]™T™XÛÛ[Y[™][Û•ŒMÏ\ÝXš™XÝ“ØØ[Y\]™T™XÛÛ[Y[™][Û•ŒMÎÂ‹ËÈOOOOH‘HUQTÕŒŒˆÝXš™XÝˆ]\›Z[š\ÝXÈ[\›˜]K]˜[YH™K]˜XÙH[ÝOOOOB˜ÛÛœÝÕP’‘PÕÐ—ÕS”Ñ‘T—Ô‘UPÑWÕŒŒ—ÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛXÞN‰ØÛÛ\]Y\™\X][Û›KY]\›Z[š\ÝXËX[\›˜]K]˜[Y\ÉËˆÛÝ\˜ÙP]Y]‰ÝŒŒYš^YÝ˜[YWÝ˜XÙWÜ™\˜XÝXÙWÛ[Z]×Ý˜[œÙ™\‰ËˆÛÚÐ]Y]‰ÝŒŒK\ÝXš™XÝX‹\™]˜XÙKZÛÚËY]Z[	Ëˆ[ÝYÎ“Øš™XÝ™œ™Y^™JÉÛÛÜÜÝ[I×JKˆÜšYÚ[˜[š\œÝ^ÜÝ\™NYKˆÛÛ\]Y™\X]Û›NYKˆ]\›Z[š\ÝXÎYKˆ˜[™ÛU˜[Y\Î™˜[ÙKˆ™YXÝ[ÛÚXÚÜÚ[ÎŒ‹ˆÜ[ÛœÔ\”™YXÝ[ÛŽˆÚ\™Y^\˜Ú\ÙP˜[šÓ]]][ÛŽ‰Ý[\Ü˜\žK\ÛÝ[Û›K]Ú]Yš[˜[K\™\ÝÜ™IËˆØÛÜš[™ÐÚ[™ÙY™˜[ÙKˆš[˜[Ù[XÝ[ÛÚ[™ÙY™˜[ÙKˆš[˜[Ü™\Ú[™ÙY™˜[ÙKˆ™XY[™\ÜÐÚ[™ÙY™˜[ÙKˆ™[YYX][Û•\™Ù]ÐÚ[™ÙY™˜[ÙKˆY™šXÝ[SX™[ÐÚ[™ÙY™˜[ÙKˆ^[U[Z[™ÐÚ[™ÙY™˜[ÙKˆ›Ùš[TØÚ[XPÚ[™ÙY™˜[ÙKˆ™[[ÝU[[Y]žN™˜[ÙBŸJNÂ‚™[˜Ý[ÛˆÝXš™XÝÛÛ™UŒŒŠ˜[YJ^Âˆ™]\›ˆ”ÓÓ‹œ\œÙJ”ÓÓ‹œÝš[™ÚYžJ˜[YJJNÂŸB‚™[˜Ý[ÛˆÝXš™XÝ”™YXÝ[Û‘™YY˜XÚÕŒŒŠ™YXÝ
^ÂˆÛÛœÝÜÏJ™YXÝË›Üß×JK›X\
Ýš[™ÊKOS[X™\Š™YXÝË˜JK[TÝš[™Ê™YXÝËš[	øà¬øàï8àâxà¤Œz(c8àf¸ài:/ïxàa8ào¸àfxà ‰ÊNÂˆÛÛœÝÚXÚÜÚ[Iùaé¹ä!¸àk¹b!¹l¤9à®{ï&‰ÊÔÝš[™Ê™YXÝË™^Z[Ÿ	ù«hú)èøàj9b!¸àbøà£8à¢ù§ 9b'xàk¹¦í9¥¬8ào¸àiù¢.øà¢¸ào¸àfxà ‰ÊKœÜ]
	øà ‰ÊVÌJÉøà ‰ÎÂˆÛÛœÝÜ›Û™Ñ™YY˜XÚÏ[ÜË›X\

ÜJOOšOOOXOÉÉÎ“Øš™XÝ™œ™Y^™JÂˆXYÛ›ÜÚ\Î˜8à#	ÛÜxà#xàiøàkøà xàêøàï8àåùi"y¥l8àjÝ[xàk¹¦í9¥¬9¦`¹à®xàk¸àjxàhxà¢xàbøàc8àf¸à£8ài¸àa8ào¸àfxà ¹ãï¹g*8àk¹â­¹¡bøà¤¹«¢øàeøàgøào¸ào¸à y«(xàkŒycãyoªxàh8àdxà¤¸à¬øàï8àâzh!¸àjú/ïxàhøài¸àcøàh8àexàa8à ˜ˆÚXÚÜÚ[ˆ™^ÝYNš[ˆJJNÂˆÛÛœÝÜ›Û™Ñ™YY˜XÚÐžU^^ßNÂˆÜË™›Ü‘XXÚ

ÜJOOžÚYŠHOOXJ]Ü›Û™Ñ™YY˜XÚÐžU^ÛÜO]Ü›Û™Ñ™YY˜XÚÖÚWNßJNÂˆ™YXÝÜ›Û™Ñ™YY˜XÚÏ]Ü›Û™Ñ™YY˜XÚÎÂˆ™YXÝÜ›Û™Ñ™YY˜XÚÐžU^]Ü›Û™Ñ™YY˜XÚÐžU^Âˆ™]\›ˆ™YXÝÂŸB‚™[˜Ý[ÛˆÝXš™XÝ“ÛÜÝ[T™]˜XÙU˜\šX[ŒŒŠ]]Ü™Y
^ÂˆÛÛœÝ˜\šX[\ÝXš™XÝÛÛ™UŒŒŠ]]Ü™Y
NÂˆ˜\šX[]OIøàêøàï8àåøàiùd":*"8àîùb)xàk¹`)8àiùa£xàâ8àë8àï8à®IÎÂˆ˜\šX[™\ØÏIùa£y£$y¢)¸àiøàkÌ¸àbøà¢Mxào¸àiùb¨9ë¥øàeøào¸àfxà ¹bcyfç¸àk¹ëe8àb8à¤¹ 'xàa9aî¸àfxàk¸àiøàkøàj¸àcøà \Ý[xàk¹i"yc%¸à¤¸à ¸àa¹. 9n©º/ïxàa8ào¸àfxà ‰ÎÂˆ˜\šX[˜ÛÙOVÂˆ	ÜÝ[H8¡¤	Ëˆ	Ù›ÜˆH8¡¤ˆÈIËˆ	ÈÝ[H8¡¤Ý[H
ÈIËˆ	Ù[™›Ü‰Ëˆ	ÜÝ[H8à¤¹aî¹b¦øàfxà¢ÉÂˆNÂˆ˜\šX[œÝ\ÏVÂˆÛ[™NŒÝ]NžÜÝ[NŒN‰ø %	ßK\ÙÎ‰ÜÝ[xà¤Œ8àiùb'y§'ùc%¸àeøào¸àeøàgøà ‰ßKˆÛ[™NŒKÝ]NžÜÝ[NŒNŒŸK\ÙÎ‰ù.â¹fç¸àkÚOL¸àbøà¢xàêøàï8àåøà¤ºe¢ùiâøàeøào¸àfxà ‰ßKˆÛ[™NŒ‹Ý]NžÜÝ[NŒ‹NŒŸK\ÙÎ‰ÜÝ[HH
Èˆ8¡¤ˆ‰Ë™YXÝœÝXš™XÝ”™YXÝ[Û‘™YY˜XÚÕŒŒŠÂˆN‰ùãï¹g*8àkÚOL¸àk¹b¨9ë¥ùo£8àiÜÝ[OL¸àiøàfxà šOLøàk¹cãyoªxà¤¹§ 9o£8ào¸àiùk§ú(c8àeøàgùæí9o£8àk¹â­¹¡bøàkûï'ÉËˆÜÎ–ÉÚOLËÝ[OMIË	ÚOMÝ[OMIË	ÚOLËÝ[OLÉË	ÚOMÝ[ONI×KNŒˆ^Z[Ž‰ùãï¹g*8àkœÝ[OL¸à¤¹/çy£ xàeøàgøào¸ào¹«(xàk¹cãyoªxàiÚOLøàj8àj¸à¢¸à yb¨9ë¥ú(c8àiÌŠÌÏMxàn9¦í9¥¬8àeøào¸àfxà Œøàk¹cãyoªxà¤¹í`¸àb8àgùæí9o£8àj¸àk¸àiøà yâ­¹¡bøàkÚOLËÝ[OMxàiøàfxà ‰Ëˆ[‰Úxà¤Œøàn:`,¸à xài¸àbøà¢xà yãï¹g*8àkœÝ[OL¸àjÌøà¤¹b¨8àb8ào¸àfxà ‰ÂˆJ_KˆÛ[™NŒËÝ]NžÜÝ[NŒ‹NŒŸK\ÙÎ‰ÚOL¸àk¹cãyoªxàc9í`¹.¡¸àeøào¸àeøàgøà ‰ßKˆÛ[™NŒKÝ]NžÜÝ[NŒ‹NŒßK\ÙÎ‰ÚOLøàn:`,¸àoøào¸àfxà ‰ßKˆÛ[™NŒ‹Ý]NžÜÝ[NKNŒßK\ÙÎ‰ÜÝ[HHˆ
ÈÈ8¡¤ˆIßKˆÛ[™NŒËÝ]NžÜÝ[NKNŒßK\ÙÎ‰ÚOLøàk¹cãyoªxàc9í`¹.¡¸àeøào¸àeøàgøà ‰ßKˆÛ[™NŒKÝ]NžÜÝ[NKNK\ÙÎ‰ÚOM8àn:`,¸àoøào¸àfxà ‰ßKˆÛ[™NŒ‹Ý]NžÜÝ[NŽKNK\ÙÎ‰ÜÝ[HHH
È8¡¤ˆIßKˆÛ[™NŒËÝ]NžÜÝ[NŽKNK\ÙÎ‰ÚOM8àk¹cãyoªxàc9í`¹.¡¸àeøào¸àeøàgøà ‰ßKˆÛ[™NŒKÝ]NžÜÝ[NŽKN_K\ÙÎ‰ù§ 9o£8àkšOMxàn:`,¸àoøào¸àfxà ‰Ë™YXÝœÝXš™XÝ”™YXÝ[Û‘™YY˜XÚÕŒŒŠÂˆN‰ùãï¹g*8àkÚOMxà yb¨9ë¥ùbcxàkœÝ[ONxàiøàfxà ¸àdøàk¹cãyoªxàbøà¢Y›Ü¹¥¡øà¤¹¢§8àdxà¢øào¸àiøàk¹­`xà£8àkûï'ÉËˆÜÎ–ÉÜÝ[OLL8àj8àj¸à¢šOM¸àiøà ¹b¨9ë¥øàfxà¢ÉË	ÜÝ[OLLøàj8àj¸à¢¸àgxàk¹h-8àiùí`¹.¡¸àfxà¢ÉË	ÜÝ[OLMxàj8àj¸à¢šOMxàk¸ào¸ào¹í`¹.¡¸àfxà¢ÉË	ÜÝ[OLM8àj8àj¸à¢¸à xàgxàk¹o£›Ü¹¥¡øà¤¹í`¹.¡¸àfxà¢É×KNŒËˆ^Z[Ž‰øào¸àf¹b¨9ë¥ú(c8àiÜÝ[xàkÎx¡¤ŒM;ï"JÍ{ï"xàjøàj¸à¢¸ào¸àfxà šOMxàk¹cãyoªxà¤¹í`¸àb8à¢øàj9«(xàkù."ºfdxà¤º-¡xàb8à¢øàgøà xà z/ïyb¨8àk¹b¨9ë¥øàkú(c8à£øàf™›Ü¹¥¡øà¤¹í`¹.¡¸àeøào¸àfxà ‰Ëˆ[‰ÚOMxàk¹b¨9ë¥øà¤¹k§ú(c8àeøài¸àbøà¢xà y«(xàk¹cãyoªxàc9kf9g*8àfxà¢øàbøà¤¹è®º*£xàeøào¸àfxà ‰ÂˆJ_KˆÛ[™NŒ‹Ý]NžÜÝ[NŒMN_K\ÙÎ‰ÜÝ[HHH
ÈH8¡¤ˆM	ßKˆÛ[™NŒËÝ]NžÜÝ[NŒMN_K\ÙÎ‰ù."ºfdxàk¹cãyoªxàc9í`¹.¡¸àeøào¸àeøàgøà ‰ßKˆÛ[™NÝ]NžÜÝ[NŒMN_K\ÙÎ‰ù§ 9í`¹íd9§§8àkÌM8àiøàfxà ‰ßBˆNÂˆ˜\šX[œ™]˜XÙU˜\šX[ŒŒIÛÛÜÜÝ[KX[\›˜]K]˜[Y\Ë]ŒIÎÂˆ™]\›ˆ˜\šX[ÂŸB‚™[˜Ý[ÛˆÝXš™XÝ•˜[œÙ™\”™]˜XÙU˜\šX[ŒŒŠY]]Ü™Y
^ÂˆYŠYOOIÛÛÜÜÝ[IÊ\™]\›ˆÝXš™XÝ“ÛÜÝ[T™]˜XÙU˜\šX[ŒŒŠ]]Ü™Y
NÂˆ™]\›ˆ[ÂŸB‚™[˜Ý[ÛˆÝXš™XÝ•˜[œÙ™\”™]˜XÙQ[YÚX›UŒŒŠY
^Âˆ™]\›ˆÕP’‘PÕÐ—ÕS”Ñ‘T—Ô‘UPÑWÕŒŒ—ÔÔPËœ[ÝYËš[˜ÛY\ÊY
Bˆ	‰“[X™\Š›Ùš[OË˜”›ÙÜ™\ÜÏË–ÚY_
OLLÂŸB‚˜ÛÛœÝÜÝ\‘^\˜Ú\ÙUŒŒ\Ý\‘^\˜Ú\ÙNÂœÝ\‘^\˜Ú\ÙOY[˜Ý[ÛŠY
^ÂˆYŠ\ÝXš™XÝ•˜[œÙ™\”™]˜XÙQ[YÚX›UŒŒŠY
J\™]\›ˆÜÝ\‘^\˜Ú\ÙUŒŒŠY
NÂˆÛÛœÝ[™^P—ÑVTÒTÑTË™š[™[™^
OžšYOOZY
NÂˆYŠ[™^
\™]\›ˆÜÝ\‘^\˜Ú\ÙUŒŒŠY
NÂˆÛÛœÝ]]Ü™YP—ÑVTÒTÑTÖÚ[™^NÂˆÛÛœÝ˜\šX[\ÝXš™XÝ•˜[œÙ™\”™]˜XÙU˜\šX[ŒŒŠY]]Ü™Y
NÂˆYŠ]˜\šX[
\™]\›ˆÜÝ\‘^\˜Ú\ÙUŒŒŠY
NÂˆ—ÑVTÒTÑTÖÚ[™^O]˜\šX[Âˆž^Âˆ™]\›ˆÜÝ\‘^\˜Ú\ÙUŒŒŠY
NÂˆYš[˜[^Âˆ—ÑVTÒTÑTÖÚ[™^OX]]Ü™YÂˆBŸNÂ‚™ÛØ˜[\Ë”ÕP’‘PÕÐ—ÕS”Ñ‘T—Ô‘UPÑWÕŒŒ—ÔÔPÏTÕP’‘PÕÐ—ÕS”Ñ‘T—Ô‘UPÑWÕŒŒ—ÔÔPÎÂ™ÛØ˜[\ËœÝXš™XÝ•˜[œÙ™\”™]˜XÙQ[YÚX›UŒŒ\ÝXš™XÝ•˜[œÙ™\”™]˜XÙQ[YÚX›UŒŒŽÂ™ÛØ˜[\ËœÝXš™XÝ•˜[œÙ™\”™]˜XÙU˜\šX[ŒŒ\ÝXš™XÝ•˜[œÙ™\”™]˜XÙU˜\šX[ŒŒŽÂ‹ËÈOOOOH‘HUQTÕŒÝXš™XÝˆ]\›Z[š\ÝXÈ\œ˜^H™K]˜XÙH^[œÚ[ÛˆOOOOB˜ÛÛœÝÕP’‘PÕÐ—ÕS”Ñ‘T—Ô‘UPÑWÐT”VWÕŒÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛXÞN‰ØÛÛ\]Y\™\X][Û›KY]\›Z[š\ÝXËX\œ˜^KX[\›˜]IËˆÛÝ\˜ÙP]Y]‰ÝŒŒË\ÝXš™XÝX‹]˜[œÙ™\‹\™]˜XÙK\ÜÝX]Y]	Ëˆ[ÝY‰ØÛÝ[Ù]™[‰ËˆÜšYÚ[˜[š\œÝ^ÜÝ\™NYKˆÛÛ\]Y™\X]Û›NYKˆ]\›Z[š\ÝXÎYKˆ˜[™ÛU˜[Y\Î™˜[ÙKˆ™YXÝ[ÛÚXÚÜÚ[ÎŒ‹ˆÜ[ÛœÔ\”™YXÝ[ÛŽˆÚ\™Y^\˜Ú\ÙP˜[šÓ]]][ÛŽ‰Ý[\Ü˜\žK\ÛÝ[Û›K]Ú]Yš[˜[K\™\ÝÜ™IËˆ™\Ù\™\ÕŒŒ“ÛÜÝ[NYKˆØÛÜš[™ÐÚ[™ÙY™˜[ÙKˆš[˜[Ù[XÝ[ÛÚ[™ÙY™˜[ÙKˆš[˜[Ü™\Ú[™ÙY™˜[ÙKˆ™XY[™\ÜÐÚ[™ÙY™˜[ÙKˆ™[YYX][Û•\™Ù]ÐÚ[™ÙY™˜[ÙKˆY™šXÝ[SX™[ÐÚ[™ÙY™˜[ÙKˆ^[U[Z[™ÐÚ[™ÙY™˜[ÙKˆ›Ùš[TØÚ[XPÚ[™ÙY™˜[ÙKˆ™[[ÝU[[Y]žN™˜[ÙBŸJNÂ‚™[˜Ý[ÛˆÝXš™XÝ”™YXÝ[Û‘™YY˜XÚÕŒ
™YXÝ
^ÂˆÛÛœÝÜÏJ™YXÝË›Üß×JK›X\
Ýš[™ÊKOS[X™\Š™YXÝË˜JK[TÝš[™Ê™YXÝËš[	úacyb%øàk¹­îùkeøàjÛÝ[8à¤Œz) yí(8àf¸ài:/ïxàa8ào¸àfxà ‰ÊNÂˆÛÛœÝÚXÚÜÚ[Iùaé¹ä!¸àk¹b!¹l¤9à®{ï&‰ÊÔÝš[™Ê™YXÝË™^Z[Ÿ	ù§hy.í¹b)9k¦¸àjÛÝ[9¦í9¥¬8àkºh!¹n£øà¤¹è®º*£xàeøào¸àfxà ‰ÊKœÜ]
	øà ‰ÊVÌJÉøà ‰ÎÂˆÛÛœÝÜ›Û™Ñ™YY˜XÚÏ[ÜË›X\

ÜJOOšOOOXOÉÉÎ“Øš™XÝ™œ™Y^™JÂˆXYÛ›ÜÚ\Î˜8à#	ÛÜxà#xàiøàkøà yãï¹g*8àk¹­îùkeøàîú) yí(8àk¹`m¹iaøàîØÛÝ[8à¤¹h¥øà¡8àfxà¯øà©8àçøàìøà¬8àk¸àa8àf¸à£8àbøàc8àf¸à£8ài¸àa8ào¸àfxà ¹«(xàkŒz) yí(8àh8àdxà¤¹§hy.í¹b)9k¦¸àbøà¢z/ïxàhøài¸àcøàh8àexàa8à ˜ˆÚXÚÜÚ[ˆ™^ÝYNš[ˆJJNÂˆÛÛœÝÜ›Û™Ñ™YY˜XÚÐžU^^ßNÂˆÜË™›Ü‘XXÚ

ÜJOOžÚYŠHOOXJ]Ü›Û™Ñ™YY˜XÚÐžU^ÛÜO]Ü›Û™Ñ™YY˜XÚÖÚWNßJNÂˆ™YXÝÜ›Û™Ñ™YY˜XÚÏ]Ü›Û™Ñ™YY˜XÚÎÂˆ™YXÝÜ›Û™Ñ™YY˜XÚÐžU^]Ü›Û™Ñ™YY˜XÚÐžU^Âˆ™]\›ˆ™YXÝÂŸB‚™[˜Ý[ÛˆÝXš™XÝÛÝ[]™[”™]˜XÙU˜\šX[Œ
]]Ü™Y
^ÂˆÛÛœÝ˜\šX[R”ÓÓ‹œ\œÙJ”ÓÓ‹œÝš[™ÚYžJ]]Ü™Y
JNÂˆ˜\šX[]OIù`m¹¥l8à¤¹¥l8àb8à¢øàîùb)xàkºacyb%øàiùa£xàâ8àë8àï8à®IÎÂˆ˜\šX[™\ØÏIùa£y£$y¢)¸àiøàkúacyb%øàk¹`)8àj9`m¹¥l8àk¹/cyïk¸àc9i"xà£øà¢¸ào¸àfxà ¹bcyfç¸àk˜ÛÝ[8à¤¹ 'xàa9aî¸àfxàk¸àiøàkøàj¸àcøà yd!:) yí(8àk¹§hy.í¹b)9k¦¸à¤¸à ¸àa¹. 9n©º/ïxàa8ào¸àfxà ‰ÎÂˆ˜\šX[˜ÛÙOVÂˆ	Ù]H8¡¤ÍËKL‹MWIËˆ	ØÛÝ[8¡¤	Ëˆ	Ù›ÜˆH8¡¤È	Ëˆ	ÈYˆ]VÚWH[ÙˆH	Ëˆ	ÈÛÝ[8¡¤ÛÝ[
ÈIËˆ	È[™Y‰Ëˆ	Ù[™›Ü‰Ëˆ	ØÛÝ[8à¤¹aî¹b¦øàfxà¢ÉÂˆNÂˆ˜\šX[œÝ\ÏVÂˆÛ[™NŒÝ]NžÚN‰ø %	Ë˜[YN‰ø %	ËÛÝ[‰ø %	ßK\ÙÎ‰ù.â¹fç¸àkÙ]OVÍËKL‹MWxà¤¹/oøàa8ào¸àfxà ‰ßKˆÛ[™NŒKÝ]NžÚN‰ø %	Ë˜[YN‰ø %	ËÛÝ[ŒK\ÙÎ‰ØÛÝ[8à¤Œ8àiùb'y§'ùc%¸àeøào¸àeøàgøà ‰ßKˆÛ[™NŒ‹Ý]NžÚNŒ˜[YNÛÝ[ŒK\ÙÎ‰ÚOL8à Y]VÌOM8àbøà¢z-l9§îøàeøào¸àfxà ‰ßKˆÛ[™NŒËÝ]NžÚNŒ˜[YNÛÝ[ŒK\ÙÎ‰Í8àkù`m¹¥l8àj¸àk¸àiù§hy.í¸àkùç'øàiøàfxà ‰ßKˆÛ[™NÝ]NžÚNŒ˜[YNÛÝ[Œ_K\ÙÎ‰ØÛÝ[H
ÈH8¡¤ˆIË™YXÝœÝXš™XÝ”™YXÝ[Û‘™YY˜XÚÕŒ
ÂˆN‰ùãï¹g*8àkÚOL8àk¹aé¹ä!¹o£8àiØÛÝ[Lxàiøàfxà ¹«(xàkšOL{ï"]VÌWOMûï"xàk¹cãyoªxà¤¹í`¸àb8àgùæí9o£8àk¹â­¹¡bøàkûï'ÉËˆÜÎ–ÉÚOLKÛÝ[L‰Ë	ÚOL‹ÛÝ[LIË	ÚOLKÛÝ[LIË	ÚOL‹ÛÝ[L‰×KNŒ‹ˆ^Z[Ž‰ù«(xàkÚOLxàiÙ]VÌWOMøà¤º*¯øànxào¸àfxà øàkùiaù¥l8àj¸àk¸àiØÛÝ[8àkùh¥øàb8àf¸à ZOLxàk¹cãyoªxà¤¹í`¸àb8àgùæí9o£8à ˜ÛÝ[Lxàiøàfxà ‰Ëˆ[‰Ù]VÌWOMøàc9`m¹¥l8àbøà¤¹ab8àjùb)9k¦¸àeøà XÛÝ[8à¤¹¦í9¥¬8àfxà¢øàbù¬n¸à xào¸àfxà ‰ÂˆJ_KˆÛ[™NKÝ]NžÚNŒ˜[YNÛÝ[Œ_K\ÙÎ‰ÚOL8àk¹§hy.í¹aé¹ä!¸à¤¹í`¸àb8ào¸àfxà ‰ßKˆÛ[™NŒ‹Ý]NžÚNŒK˜[YNËÛÝ[Œ_K\ÙÎ‰ÚOLxà Y]VÌWOMøàn:`,¸àoøào¸àfxà ‰ßKˆÛ[™NŒËÝ]NžÚNŒK˜[YNËÛÝ[Œ_K\ÙÎ‰Íøàkùiaù¥l8àj¸àk¸àiù§hy.í¸àkù`oxàiøàfxà ‰ßKˆÛ[™NKÝ]NžÚNŒK˜[YNËÛÝ[Œ_K\ÙÎ‰ØÛÝ[8à¤¹h¥øà¡8àexàfšOLxà¤¹í`¸àb8ào¸àfxà ‰ßKˆÛ[™NŒ‹Ý]NžÚNŒ‹˜[YNŽKÛÝ[Œ_K\ÙÎ‰ÚOL¸à Y]VÌ—ONxàn:`,¸àoøào¸àfxà ‰ßKˆÛ[™NŒËÝ]NžÚNŒ‹˜[YNŽKÛÝ[Œ_K\ÙÎ‰Îxà ¹iaù¥l8àj¸àk¸àiØÛÝ[8àkÌxàk¸ào¸ào¸àiøàfxà ‰ßKˆÛ[™NKÝ]NžÚNŒ‹˜[YNŽKÛÝ[Œ_K\ÙÎ‰ÚOL¸à¤¹í`¸àb8ào¸àfxà ‰ßKˆÛ[™NŒ‹Ý]NžÚNŒË˜[YNŒL‹ÛÝ[Œ_K\ÙÎ‰ÚOLøà Y]VÌ×OLL¸àn:`,¸àoøào¸àfxà ‰Ë™YXÝœÝXš™XÝ”™YXÝ[Û‘™YY˜XÚÕŒ
ÂˆN‰ùãï¹g*8àkÚOLøà Y]VÌ×OLL¸à yb)9k¦¹bcxàk˜ÛÝ[Lxàiøàfxà ¸àdøàk¹cãyoªxà¤¹í`¸àb8àgùæí9o£8àk¹â­¹¡bøàkûï'ÉËˆÜÎ–ÉÚOLËÛÝ[L‰Ë	ÚOLËÛÝ[LIË	ÚOMÛÝ[L‰Ë	ÚOMÛÝ[LI×KNŒˆ^Z[Ž‰Ù]VÌ×OLL¸àkù`m¹¥l8àj¸àk¸àiù§hy.í¸àkùç'øàjøàj¸à¢¸à XÛÝ[8àkÌx¡¤Œ¸àn9h¥øàb8ào¸àfxà ¸ào¸àhOLøàk¹cãyoªxà¤¹í`¸àb8àgùæí9o£8àj¸àk¸àiùâ­¹¡bøàkÚOLËÛÝ[L¸àiøàfxà ‰Ëˆ[‰ÌL¸àk¹`m¹iaøà¤¹b)9k¦¸àeøà yç'øàj¸à¢XÛÝ[8à¤Œxàh8àdyh¥øà¡8àeøào¸àfxà ‰ÂˆJ_KˆÛ[™NŒËÝ]NžÚNŒË˜[YNŒL‹ÛÝ[Œ_K\ÙÎ‰ÌL¸àkù`m¹¥l8àj¸àk¸àiù§hy.í¸àkùç'øàiøàfxà ‰ßKˆÛ[™NÝ]NžÚNŒË˜[YNŒL‹ÛÝ[ŒŸK\ÙÎ‰ØÛÝ[HH
ÈH8¡¤ˆ‰ßKˆÛ[™NKÝ]NžÚNŒË˜[YNŒL‹ÛÝ[ŒŸK\ÙÎ‰ÚOLøà¤¹í`¸àb8ào¸àfxà ‰ßKˆÛ[™NŒ‹Ý]NžÚN˜[YNŒMKÛÝ[ŒŸK\ÙÎ‰ù§ 9o£8àkšOM8à Y]VÍOLMxàn:`,¸àoøào¸àfxà ‰ßKˆÛ[™NŒËÝ]NžÚN˜[YNŒMKÛÝ[ŒŸK\ÙÎ‰ÌMxàkùiaù¥l8àj¸àk¸àiØÛÝ[8àkùh¥øàb8ào¸àføà¤øà ‰ßKˆÛ[™N‹Ý]NžÚN˜[YNŒMKÛÝ[ŒŸK\ÙÎ‰ùajz) yí(8àkº-l9§îøàc9í`¸à£øà¢¸ào¸àeøàgøà ‰ßKˆÛ[™NËÝ]NžÚN˜[YNŒMKÛÝ[ŒŸK\ÙÎ‰ù§ 9í`¹íd9§§8àkÌ¸àiøàfxà ‰ßBˆNÂˆ˜\šX[œ™]˜XÙU˜\šX[ŒIØÛÝ[Ù]™[‹X[\›˜]KX\œ˜^K]ŒIÎÂˆ™]\›ˆ˜\šX[ÂŸB‚™[˜Ý[ÛˆÝXš™XÝ•˜[œÙ™\”™]˜XÙP\œ˜^Q[YÚX›UŒ
Y
^Âˆ™]\›ˆYOOTÕP’‘PÕÐ—ÕS”Ñ‘T—Ô‘UPÑWÐT”VWÕŒÔÔPËœ[ÝYˆ	‰“[X™\Š›Ùš[OË˜”›ÙÜ™\ÜÏË–ÚY_
OLLÂŸB‚˜ÛÛœÝÜÝ\‘^\˜Ú\ÙUŒ\Ý\‘^\˜Ú\ÙNÂœÝ\‘^\˜Ú\ÙOY[˜Ý[ÛŠY
^ÂˆYŠ\ÝXš™XÝ•˜[œÙ™\”™]˜XÙP\œ˜^Q[YÚX›UŒ
Y
J\™]\›ˆÜÝ\‘^\˜Ú\ÙUŒ
Y
NÂˆÛÛœÝ[™^P—ÑVTÒTÑTË™š[™[™^
OžšYOOZY
NÂˆYŠ[™^
\™]\›ˆÜÝ\‘^\˜Ú\ÙUŒ
Y
NÂˆÛÛœÝ]]Ü™YP—ÑVTÒTÑTÖÚ[™^NÂˆÛÛœÝ˜\šX[\ÝXš™XÝÛÝ[]™[”™]˜XÙU˜\šX[Œ
]]Ü™Y
NÂˆ—ÑVTÒTÑTÖÚ[™^O]˜\šX[Âˆž^Âˆ™]\›ˆÜÝ\‘^\˜Ú\ÙUŒ
Y
NÂˆYš[˜[^Âˆ—ÑVTÒTÑTÖÚ[™^OX]]Ü™YÂˆBŸNÂ‚™ÛØ˜[\Ë”ÕP’‘PÕÐ—ÕS”Ñ‘T—Ô‘UPÑWÐT”VWÕŒÔÔPÏTÕP’‘PÕÐ—ÕS”Ñ‘T—Ô‘UPÑWÐT”VWÕŒÔÔPÎÂ™ÛØ˜[\ËœÝXš™XÝ•˜[œÙ™\”™]˜XÙP\œ˜^Q[YÚX›UŒ\ÝXš™XÝ•˜[œÙ™\”™]˜XÙP\œ˜^Q[YÚX›UŒÂ™ÛØ˜[\ËœÝXš™XÝÛÝ[]™[”™]˜XÙU˜\šX[Œ\ÝXš™XÝÛÝ[]™[”™]˜XÙU˜\šX[ŒÂ‹ËÈOOOOH‘HUQTÕŒŽÝXš™XÝˆ[Øš[H\]\™Ù]™\Z\ˆOOOOB˜ÛÛœÝÕP’‘PÕÐ—ÓSÐ’SWÕTÕT‘ÑUÕŒŽÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛÝ\˜ÙP]Y]‰ÝŒË\ÝXš™XÝX‹[[Øš[KX[œÝÙ\‹]\\™XY[™\ÜÉËˆÛXÞN‰Û˜\œ›ÝËY[]™[‹XÛÛ›Û[Z[‹ZZYÚ\™\Z\‰ËˆØ\›š[™Ñ›ÛÜ”ˆ™\Z\™YZ[’ZYÚˆ\™Ù]Î“Øš™XÝ™œ™Y^™JÂˆ	ØÛÛ\Ý[™™^	Ë	ØÛÛ\Ý[™™]‰Ë	ØÛÛ\Ý[™ÝX›Z]	Ë	Ø‘š[˜[™^	Ë	Ø‘š[˜[ÝX›Z]	Ëˆ	Ø“[ØÚÓ™^	Ë	Ø“[ØÚÔ™]‰Ë	Ø“[ØÚÔÝX›Z]Ü	Ë	ÜÙXÓ[ØÚÓ™^	Ë	ÜÙXÓ[ØÚÔ™]‰Ë	ÜÙXÓ[ØÚÔÝX›Z]Ü	ÂˆJKˆ[œÝÙ\ÚÚXÙTÚ^š[™ÐÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û”Ù[XÝ[ÛÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û“Ü™\Ú[™ÙY™˜[ÙKˆØÛÜš[™ÐÚ[™ÙY™˜[ÙKˆ^[PÛÝ[ÝÛÚ[™ÙY™˜[ÙKˆ™XY[™\ÜÐÚ[™ÙY™˜[ÙKˆ›Ùš[TØÚ[XSZYÜ˜][Û”™\]Z\™Y™˜[ÙKˆ™[[ÝU[[Y]žN™˜[ÙBŸJNÂ‚Š[˜Ý[Ûˆ[œÝ[ÝXš™XÝ“[Øš[U\\™Ù]ÕŒŽ

^ÂˆYŠ\[ÙˆØÝ[Y[OOIÝ[™Yš[™Y	ß\[ÙˆØÝ[Y[˜Ü™X]Q[[Y[OOIÙ[˜Ý[Û‰Ê\™]\›ŽÂˆÛÛœÝYIÙ™\K\ÝXš™XÝX‹[[Øš[K]\]\™Ù]]ŒŽ	ÎÂˆYŠ\[ÙˆØÝ[Y[™Ù][[Y[žRYOOIÙ[˜Ý[Û‰É‰™ØÝ[Y[™Ù][[Y[žRY
Y
J\™]\›ŽÂˆÛÛœÝÝ[OYØÝ[Y[˜Ü™X]Q[[Y[
	ÜÝ[IÊNÂˆÝ[KšYZYÂˆÝ[K^ÛÛ[XˆØÛÛ\Ý[™™^ØÛÛ\Ý[™™]‹ØÛÛ\Ý[™ÝX›Z]ˆØ‘š[˜[™^Ø‘š[˜[ÝX›Z]ˆØ“[ØÚÓ™^Ø“[ØÚÔ™]‹Ø“[ØÚÔÝX›Z]ÜˆÜÙXÓ[ØÚÓ™^ÜÙXÓ[ØÚÔ™]‹ÜÙXÓ[ØÚÔÝX›Z]ÜÛZ[‹ZZYÚßB˜ÂˆÛÛœÝ›ÛÝYØÝ[Y[šXYØÝ[Y[™ØÝ[Y[[[Y[ÂˆYŠ›ÛÝ	‰\[Ùˆ›ÛÝ˜\[™Ú[OOIÙ[˜Ý[Û‰Ê\›ÛÝ˜\[™Ú[
Ý[JNÂŸJJ
NÂ‚™ÛØ˜[\Ë”ÕP’‘PÕÐ—ÓSÐ’SWÕTÕT‘ÑUÕŒŽÔÔPÏTÕP’‘PÕÐ—ÓSÐ’SWÕTÕT‘ÑUÕŒŽÔÔPÎÂ‹ËÈOOOOH‘HUQTÕŒÌÈÝXš™XÝˆš[˜[\™\Ý[\™XÝ[™Ù™ˆOOOOB˜ÛÛœÝÕP’‘PÕÐ—Ñ’SSÒS‘Ñ‘—ÕŒÌ×ÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛÝ\˜ÙP]Y]‰ÝŒÌ‹\ÝXš™XÝX‹\™\Ý[YKZ[™Ù™‰ËˆÛÝ\˜ÙQš[™[™Î‰ÜÝXš™XÝØ—ØÛÛ\][Û—Ú[™Ù™—Ü™]\›œ×Ý×ÛY[IËˆ\™Ù]Y‰Ø‘š[˜[˜XÚÓY[IËˆÛXÞN‰ØØ\\™KXÛXÚË\›Ý]K]ËY^\Ý[™Ë\ÝXš™XÝX‹XÛÛ[X][Û‰Ëˆ\Ý[˜][ÛŽ‰ØÛÛ[YTÝXš™XÝ‘›ÝÉËˆ™]™[YØXÞSY[R[™\ŽYKˆ[YYš[˜[™\Ý[YPÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û”Ù[XÝ[ÛÚ[™ÙY™˜[ÙKˆ]Y\Ý[Û“Ü™\Ú[™ÙY™˜[ÙKˆØÛÜš[™ÐÚ[™ÙY™˜[ÙKˆ^[PÛÝ[ÝÛÚ[™ÙY™˜[ÙKˆ™XY[™\ÜÐÚ[™ÙY™˜[ÙKˆ›Ùš[TØÚ[XSZYÜ˜][Û”™\]Z\™Y™˜[ÙKˆ™[[ÝU[[Y]žN™˜[ÙBŸJNÂ‚Š[˜Ý[Ûˆ[œÝ[ÝXš™XÝ‘š[˜[[™Ù™•ŒÌÊ
^ÂˆYŠ\[ÙˆØÝ[Y[OOIÝ[™Yš[™Y	ß\[ÙˆØÝ[Y[™Ù][[Y[žRYOOIÙ[˜Ý[Û‰Ê\™]\›ŽÂˆÛÛœÝYØÝ[Y[™Ù][[Y[žRY
	Ø‘š[˜[˜XÚÓY[IÊNÂˆYŠXŸ\[Ùˆ‹˜Y]™[\Ý[™\ˆOOIÙ[˜Ý[Û‰ß‹™]\Ù]Ë™™\Qš[˜[[™Ù™•ŒÌÏOOIÌIÊ\™]\›ŽÂˆYŠ‹™]\Ù]
X‹™]\Ù]™™\Qš[˜[[™Ù™•ŒÌÏIÌIÎÂˆ‹˜Y]™[\Ý[™\Š	ØÛXÚÉË[˜Ý[ÛŠ]Š^ÂˆYŠ]‰‰\[Ùˆ]‹œ™]™[Y˜][OOIÙ[˜Ý[Û‰ÊY]‹œ™]™[Y˜][

NÂˆYŠ]‰‰\[Ùˆ]‹œÝÜ[[YYX]T›ÜYØ][ÛOOIÙ[˜Ý[Û‰ÊY]‹œÝÜ[[YYX]T›ÜYØ][ÛŠ
NÂˆÛÛ[YTÝXš™XÝ‘›ÝÊ
NÂˆKYJNÂŸJJ
NÂ‚™ÛØ˜[\Ë”ÕP’‘PÕÐ—Ñ’SSÒS‘Ñ‘—ÕŒÌ×ÔÔPÏTÕP’‘PÕÐ—Ñ’SSÒS‘Ñ‘—ÕŒÌ×ÔÔPÎÂ‹ËÈOOOOH‘HUQTÕŒÎHÝXš™XÝˆPÑKÙš[˜[˜[œÙ™\‹[Ý™\›\™\Z\ˆOOOOBŠ

HOˆÂˆÛÛœÝYIØ™^[WØ\œ—ÌÉÎÂˆÛÛœÝYP—ÑVSWÐSÓ×ÒUSTË™š[™[™^
OžšYOOZY
NÂˆYŠY
H›ÝÈ™]È\œ›ÜŠ	Ñ‘HUQTÕŒÎH\™Ù]Z\ÜÚ[™Îˆ	ÊÚY
NÂˆÛÛœÝ™Y›Ü™OP—ÑVSWÐSÓ×ÒUSTÖÚYNÂˆÛÛœÝ™\XÙ[Y[^Âˆ‹‹˜™Y›Ü™Kˆ]N‰úf¨ù£©ymë¸àk¹«høàk¹h¥ùb¨:aãøà¤¹í+ùêcIËˆÛÛ^‰úf¨øà¢¹d"8àaº) yí(8àk¹më¸à¤¹¬`¸à xà y«høàk¹më¸àh8àdxà¤œØÛÜ™xàn9b¨9ë¥øàeøào¸àfxà ‰ËˆÛÙN–Âˆ	Ù]H8¡¤ÌËKKWIËˆ	ÜØÛÜ™H8¡¤	Ëˆ	Ù›ÜˆH8¡¤HÈ	Ëˆ	ÈY™ˆ8¡¤]VÚWHH]VÚKLWIËˆ	ÈYˆY™ˆˆ	Ëˆ	ÈØÛÜ™H8¡¤ØÛÜ™H
ÈY™‰Ëˆ	È[™Y‰Ëˆ	Ù[™›Ü‰Ëˆ	ÜØÛÜ™H8à¤¹aî¹b¦øàfxà¢ÉÂˆKˆN‰ÜØÛÜ™H8¡¤ØÛÜ™H
ÈY™ˆ8àc9k§ú(c8àexà£8à¢ùfç¹¥l8àj8à y§ 9o£8àjùaî¹b¦øàexà£8à¢ÜØÛÜ™xàk¹ía9d"8àføàkûï'ÉËˆÜ[ÛœÎ–ÉÌyfç‹ØÛÜ™OM	Ë	Ì¹fç‹ØÛÜ™OL‰Ë	Ì¹fç‹ØÛÜ™OMÉË	Ìùfç‹ØÛÜ™ONI×KˆNŒ‹ˆ^Z[Ž‰úf¨ù£©ymë¸àkÈL‹ËLË8àiøàfxà ¹«høàk¹më¸àh8àdxà¤¹b¨8àb8à¢øàk¸àiù¦í9¥¬8àkÌ¹fç¹k§ú(c8àexà£8à \ØÛÜ™xàkÌ8¡¤Œø¡¤øàj8àj¸à¢¸ào¸àfxà ‰Ëˆ]X[]P]Y]‰ÝŒÎK]˜XÙKYš[˜[[Ý™\›\\™\Z\‰ÂˆNÂˆ—ÑVSWÐSÓ×ÒUSTÖÚYO\™\XÙ[Y[Âˆ—ÑVSWÐSÓ×ÐÓÓ•PÕÖÚYOTÝš[™Ê™\XÙ[Y[›Ü[ÛœÖÜ™\XÙ[Y[˜WJNÂ‚ˆÛØ˜[\Ë”ÕP’‘PÕÐ—ÕPÑWÓÕ‘T“TÔ‘TRT—ÕŒÎWÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛXÞN‰ÛØØ[^™YYš[˜[]˜[œÙ™\‹[Ý™\›\\™\Z\‰ËˆÛÝ\˜ÙP]Y]‰ÝŒÎ]˜XÙK[Ý™\›\Y]Z[	Ëˆ\™Ù]YšYˆ™\Ù\™YÛXZ[Ž˜™Y›Ü™K™ÛXZ[‹ˆ™\Ù\™Y]™[˜™Y›Ü™K›]™[ˆ™\Ù\™Y›Ü›X]˜™Y›Ü™K™›Ü›X]ˆ™\Ù\™Y[œÝÙ\”ÜÚ][ÛŽ˜™Y›Ü™K˜Kˆ™[YYX][Û“X\[™ÐÚ[™ÙY™˜[ÙKˆÙ[XÝ[Û”ÛXÞPÚ[™ÙY™˜[ÙKˆ˜XÙP˜[šÐÚ[™ÙY™˜[ÙKˆX\›™\‘Y™™XÝ‰Ùš[˜[˜XÝXÙH›ÝÈ™\]Z\™\È˜XÚ[™ÈY˜XÙ[Y™™\™[˜Ù\È[™XØÝ[][]YÜÚ]]™HÚ[™ÙH[œÝXYÙˆ™\X][™ÈHPÑHÛÝ[Z[˜Ü™[Y[Ý]H]	ÂˆJNÂŸJJ
NÂ™[˜Ý[Ûˆ˜[Y]TÝXš™XÝ”Ù[X[XÜÊ
^Â‚ˆÛÛœÝ\œ›ÜœÏV×NÂˆÛÛœÝ™YÜÏVÌKÛÛ\Ý[™ÜÏVÌKÙXÝ\š]TÜÏVÌK^[TÜÏVÌNÂ‚ˆYŠ—ÑVTÒTÑTË›[™ÝOOLŒ
Y\œ›ÜœËœ\Ú
	Ý˜XÙH^\˜Ú\Ù\È]\Ý™HŒ	ÊNÂˆ—ÑVTÒTÑTË™›Ü‘XXÚ
^OžÂˆÛÛœÝ™YÏY^œÝ\Ë™š[\ŠÏOœËœ™YXÝ
K›X\
ÏOœËœ™YXÝ
NÂˆYŠ™YË›[™ÝOOLŠY\œ›ÜœËœ\Ú
	Ù^šYNˆ™YXÝ[ÛˆÛÝ[
NÂˆ™YË™›Ü‘XXÚ

JOOžÂˆYŠP\œ˜^Kš\Ð\œ˜^J›ÜÊ_›ÜË›[™ÝOOM™]ÈÙ]
›ÜË›X\
Ýš[™ÊJKœÚ^™HOOMˆS[X™\‹š\Ò[YÙ\Š˜J_˜O˜O\›ÜË›[™Ý\™^Z[Ÿ\š[
^Âˆ\œ›ÜœËœ\Ú
	Ù^šYN‰ÚJÌ_Nˆ[˜[Y™YXÝ[Û˜
NÂˆY[Ù^Âˆ™YÜÖÜ˜WJÊÎÂˆYŠ—Ô‘QPÕSÓ—ÐÓÓ•PÕÖØ	Ù^šYN‰ÚJÌ_XHOOTÝš[™Ê›ÜÖÜ˜WJJ^Âˆ\œ›ÜœËœ\Ú
	Ù^šYN‰ÚJÌ_Nˆ™YXÝ[ÛˆÙ[X[XÈšY
NÂˆBˆBˆJNÂˆJNÂˆYŠ™YÜËœÛÛYJOžOOLL
JY\œ›ÜœËœ\Ú
™YXÝ[Ûˆ[œÝÙ\‹\ÜÚ][ÛˆšX\Îˆ	Ü™YÜËš›Ú[Š	ËÉÊ_X
NÂ‚ˆYŠ—ÐÓÓTÕS‘ÔÑUË›[™ÝOOLMJY\œ›ÜœËœ\Ú
	ØÛÛ\Ý[™Ù]È]\Ý™HMIÊNÂˆ—ÐÓÓTÕS‘ÔÑUË™›Ü‘XXÚ
ÏOžÂˆYŠËœ\ÏË›[™ÝOOLÊY\œ›ÜœËœ\Ú
	ÜËšYNˆÛÛ\Ý[™HÛÝ[
NÂˆËœ\ÏË™›Ü‘XXÚ

KJOOžÂˆYŠK›ÜÏË›[™ÝOOM™]ÈÙ]
K›ÜÊKœÚ^™HOOMK˜OK˜OŒß\K™^
^Âˆ\œ›ÜœËœ\Ú
	ÜËšYN‰ÚJÌ_Nˆ[˜[YÛÛ\Ý[™]Y\Ý[Û˜
NÂˆY[Ù^ÂˆÛÛ\Ý[™ÜÖÜK˜WJÊÎÂˆYŠ—ÐÓÓTÕS‘ÐÓÓ•PÕÖØ	ÜËšYN‰ÚJÌ_XHOO\K›ÜÖÜK˜WJ^Âˆ\œ›ÜœËœ\Ú
	ÜËšYN‰ÚJÌ_NˆÛÛ\Ý[™Ù[X[XÈšY
NÂˆBˆBˆJNÂˆJNÂˆYŠX]›X^
‹‹˜ÛÛ\Ý[™ÜÊKSX]›Z[Š‹‹˜ÛÛ\Ý[™ÜÊOŒJ^Âˆ\œ›ÜœËœ\Ú
ÛÛ\Ý[™[œÝÙ\‹\ÜÚ][ÛˆšX\Îˆ	ØÛÛ\Ý[™ÜËš›Ú[Š	ËÉÊ_X
NÂˆB‚ˆYŠÑPÕT’UWÔÐÑST’SÔË›[™ÝOOLMJY\œ›ÜœËœ\Ú
	ÜÙXÝ\š]HØÙ[˜\š[ÜÈ]\Ý™HMIÊNÂˆYŠÑPÕT’UWÔÐÑST’SÔË™š[\ŠÏOœË›ÙÊK›[™Ý
Y\œ›ÜœËœ\Ú
	ÜÙXÝ\š]HÙÈØÙ[˜\š[ÜÈ]\Ý™H]X\Ý	ÊNÂˆÛÛœÝÙXZÑ\Ý˜XÝÜKùioxàcxàjŸ9hàyí&_8àåøàê¸àìøà¯ùå*9í&_8àè¸àâøà¯ßÔxà«øàëxààøà«ß8à«xàï8àç8àï8àâzacyb%ß: ã9¦kú"lŸ8àáøà¨øà®xàåøàë8à©:)èù`ãùn©Ÿ8àè¸àâøà¯ú)èù`ãùn©‹ÎÂˆÑPÕT’UWÔÐÑST’SÔË™›Ü‘XXÚ
ÏOžÂˆYŠËœÝ\ÏË›[™ÝOOLÊY\œ›ÜœËœ\Ú
	ÜËšYNˆÙXÝ\š]HÝ\ÛÝ[
NÂˆÛÛœÝš\œÝ^XÝYP—ÔÑPÕT’UWÑ’T”ÕÔÕTÐÓÓ•PÕÖÜËšYNÂˆYŠYš\œÝ^XÝYËœÝ\ÏË–ÌOË›Ü[ÛœÏË–ÜËœÝ\ÖÌK˜WHOOYš\œÝ^XÝY
^Âˆ\œ›ÜœËœ\Ú
	ÜËšYNˆš\œÝÙXÝ\š]HÙ[X[XÈšY
NÂˆBˆËœÝ\ÏË™›Ü‘XXÚ

KJOOžÂˆYŠK›Ü[ÛœÏË›[™ÝOOM™]ÈÙ]
K›Ü[ÛœÊKœÚ^™HOOMK˜OK˜OŒß\K™^Z[Š^Âˆ\œ›ÜœËœ\Ú
	ÜËšYN‰ÚJÌ_Nˆ[˜[YÙXÝ\š]H]Y\Ý[Û˜
NÂˆY[Ù^ÂˆÙXÝ\š]TÜÖÜK˜WJÊÎÂˆYŠ—ÔÑPÕT’UWÔÕTÐÓÓ•PÕÖØ	ÜËšYN‰ÚJÌ_XHOO\K›Ü[ÛœÖÜK˜WJ^Âˆ\œ›ÜœËœ\Ú
	ÜËšYN‰ÚJÌ_NˆÙXÝ\š]HÙ[X[XÈšY
NÂˆBˆYŠK›Ü[ÛœËœÛÛYJOÙXZÑ\Ý˜XÝÜ‹\Ý
Ýš[™Ê
JJJ^Âˆ\œ›ÜœËœ\Ú
	ÜËšYN‰ÚJÌ_Nˆš]šX[ÙXÝ\š]H\Ý˜XÝÜ˜
NÂˆBˆBˆJNÂˆJNÂˆYŠX]›X^
‹‹œÙXÝ\š]TÜÊKSX]›Z[Š‹‹œÙXÝ\š]TÜÊOŒJ^Âˆ\œ›ÜœËœ\Ú
ÙXÝ\š]H[œÝÙ\‹\ÜÚ][ÛˆšX\Îˆ	ÜÙXÝ\š]TÜËš›Ú[Š	ËÉÊ_X
NÂˆB‚ˆYŠ—ÑVSWÐSÓ×ÒUSTË›[™ÝOOM
Y\œ›ÜœËœ\Ú
	Ù^[H[ÛÜš]HÛÛ]\Ý™H	ÊNÂˆÛÛœÝÛXZ[ÛÝ[Ï^ßK]™[ÛÝ[Ï^ßNÂˆ—ÑVSWÐSÓ×ÒUSTË™›Ü‘XXÚ
OOžÂˆÛXZ[ÛÝ[ÖÜK™ÛXZ[—OJÛXZ[ÛÝ[ÖÜK™ÛXZ[—_
JÌNÂˆ]™[ÛÝ[ÖÜK›]™[OJ]™[ÛÝ[ÖÜK›]™[_
JÌNÂˆYŠK›Ü[ÛœÏË›[™ÝOOM™]ÈÙ]
K›Ü[ÛœÊKœÚ^™HOOMK˜OK˜OŒß\K™^Z[Ÿ\K˜ÛÙOË›[™Ý
^Âˆ\œ›ÜœËœ\Ú
	ÜKšYNˆ[˜[Y^[H][X
NÂˆY[Ù^Âˆ^[TÜÖÜK˜WJÊÎÂˆYŠ—ÑVSWÐSÓ×ÐÓÓ•PÕÖÜKšYHOOTÝš[™ÊK›Ü[ÛœÖÜK˜WJJ^Âˆ\œ›ÜœËœ\Ú
	ÜKšYNˆ^[HÙ[X[XÈšY
NÂˆBˆBˆJNÂˆYŠ^[TÜËœÛÛYJOžOOLL
JY\œ›ÜœËœ\Ú
^[H[œÝÙ\‹\ÜÚ][ÛˆšX\Îˆ	Ù^[TÜËš›Ú[Š	ËÉÊ_X
NÂˆ—Ñ’SSÐSÓ×ÑÓPRS”Ë™›Ü‘XXÚ
OžÂˆYŠ
ÛXZ[ÛÝ[ÖÙ_
OÊY\œ›ÜœËœ\Ú
	ÙNˆ[œÝY™šXÚY[^[HÛÛ
NÂˆJNÂˆYŠ
]™[ÛÝ[ÖÉùª&y®¥‰×_
ON
]™[ÛÝ[ÖÉùoç9å*	×_
OŒ
^Âˆ\œ›ÜœËœ\Ú
^[H]™[˜[[˜ÙNˆ9ª&y®¥‰Û]™[ÛÝ[ÖÉùª&y®¥‰×_Kùoç9å*	Û]™[ÛÝ[ÖÉùoç9å*	×_X
NÂˆB‚ˆ™]\›ˆÂˆÚÎ™\œ›ÜœË›[™ÝOOL\œ›ÜœËÛXZ[ÛÝ[Ë]™[ÛÝ[Ëˆ[œÝÙ\”ÜÚ][ÛœÎžÜ™YXÝ[ÛŽœ™YÜËÛÛ\Ý[™˜ÛÛ\Ý[™ÜËÙXÝ\š]NœÙXÝ\š]TÜË^[N™^[TÜßBˆNÂŸB‚™[˜Ý[Ûˆ[“\ÜÛÛ•V]Y]

^ÂˆÛÛœÝ\ÜÛÛ’YÏSØš™XÝšÙ^\ÊTÔÓÓ”ßßJNÂˆÛÛœÝYÙPÛÝ[ÏSØš™XÝ™œ›ÛQ[šY\Ê\ÜÛÛ’YË›X\
YO–ÚYTÔÓÓ”ÖÚYKœYÙ\Ë›[™ÝJJNÂˆÛÛœÝ[\˜XÝ]™U\\Ï[\ÜÛÛ’YË™›]X\
YO“TÔÓÓ”ÖÚYKœYÙ\Ë™š[\ŠOœš[\˜XÝ]™JK›X\
Oœš[\˜XÝ]™JJNÂˆÛÛœÝ\ÜÝY\ÏV×NÂˆYŠ\ÜÛÛ’YË›[™ÝOOLÍ
Z\ÜÝY\Ëœ\Ú
\ÜÛÛˆÛÝ[	Û\ÜÛÛ’YË›[™ÝX
NÂˆˆYŠ™]ÈÙ]
[\˜XÝ]™U\\ÊKœÚ^™HOOZ[\˜XÝ]™U\\Ë›[™Ý
Z\ÜÝY\Ëœ\Ú
	Ù\XØ]H[\˜XÝ]™H\IÊNÂˆÛÛœÝ™\]Z\™YVÉÝ˜[œØXÝ[Û‰Ë	Û]]^	Ë	Ùš[\Þ\Ý[IË	Ø]]ÛX]IË	ØØXÚIË	ÜÝXÚÜ]Y]YI×NÂˆ™\]Z\™Y™›Ü‘XXÚ
OžÚYŠZ[\˜XÝ]™U\\Ëš[˜ÛY\Ê
JZ\ÜÝY\Ëœ\Ú
Z\ÜÚ[™È	ÞX
_JNÂˆ™]\›ˆÛÚÎš\ÜÝY\Ë›[™ÝOOL\ÜÛÛÛÝ[›\ÜÛÛ’YË›[™ÝÝ[YÙ\Î“Øš™XÝ˜[Y\ÊYÙPÛÝ[ÊKœ™YXÙJ
KŠOO˜JØ‹
K[\˜XÝ]™PÛÝ[š[\˜XÝ]™U\\Ë›[™Ý\ÜÝY\ßNÂŸBÚ[™ÝË‘‘TUQTÕÓTÔÓÓ—ÕVÐUQU\[“\ÜÛÛ•V]Y]

NÂ‚˜\UŒMÓ]Qš^\Ê
NÝÚ[™ÝË‘‘TUQTÕÔÑS—ÐÒPÒÏYÛØ˜[\ÖÉÜ[•‰ÊÐTÕ‘T”ÒSÓ‹œÛXÙJJJÉÔÙ[ÚXÚÉ×J
NÂšYŠ]Ú[™ÝË‘‘TUQTÕÔÑS—ÐÒPÒË›ÚÊ^ÂˆÛÛœÛÛKØ\›Š	Ñ‘HUQTÕÙ[‹XÚXÚÈ˜Z[Y	ËÚ[™ÝË‘‘TUQTÕÔÑS—ÐÒPÒË™\œ›ÜœÊNÂŸB‚‚™[˜Ý[Ûˆ\œÚ\Ý™\Ú[Y[ZTÝ]J
^ÂˆÛÛœÝØÜ™Y[XXÝ]™TØÜ™Y[’Y

NÂˆ™[Y[X™\”ØÜ™Y[ŠØÜ™Y[ŠNÂˆYŠØÜ™Y[OOIÛ\ÜÛÛ‰Ê\™[Y[X™\“\ÜÛÛ”ÜÚ][ÛŠ
NÂˆØ]™P‘š[˜[™\Ý[YJ
NÂŸB™[˜Ý[Ûˆ™]˜[Y]T›Ùš[Qœ™\Ú™\ÜÊ™X\ÛÛIùå.úgh¹oªyn,	Ê^ÂˆYŠ›Ùš[UÜš]P›ØÚÙY›Ùš[PÛÛ™›XÝ›ØÚÙY
\™]\›ˆ˜[ÙNÂˆž^ÂˆÛÛœÝ]ÛZXÏXÝ\œ™[]ÛZXÔ›Ùš[J
NÂˆYŠX]ÛZXÊ\™]\›ˆYNÂˆÛÛœÝ™][›Û“™YØ]]™R[
]ÛZXËœ™]š\Ú[Û‹
NÂˆÛÛœÝÚXÚÜÝ[OX]ÛZXË˜ÚXÚÜÝ[_›Ùš[R[YÜš]PÚXÚÜÝ[J]ÛZXËœ›Ùš[JNÂˆÛÛœÝ^\›˜[Üš]\X]ÛZXËÜš]\’YOOUP—ÒS”ÕSÑWÒQÂˆÛÛœÝ™]Ù\\™]œ›Ùš[P˜\ÙT™]š\Ú[ÛŽÂˆÛÛœÝ™]ÛÝ[™\™]›Ùš[P˜\ÙT™]š\Ú[ÛŽÂˆÛÛœÝØ[YT™]š\Ú[ÛÚ[™ÙY\™]OO\›Ùš[P˜\ÙT™]š\Ú[Û‰‰˜ÚXÚÜÝ[HOO\›Ùš[PÛÛ[Z]YÚXÚÜÝ[NÂˆYŠ
^\›˜[Üš]\‰‰›™]Ù\Š_™]ÛÝ[™Ø[YT™]š\Ú[ÛÚ[™ÙY
^Âˆ™\ÝÜ™PÛÛ[Z]Y›Ùš[R[“Y[[ÜžJYJNÂˆX\šÔ›Ùš[PÛÛ™›XÝ
	Ü™X\ÛÛŸy¦`¸àjøà yb)xàk¹/çykf9.%¹.èøà¤¹©'9aî¸àeøào¸àeøàgØ
NÂˆ™]\›ˆ˜[ÙNÂˆBˆ™]\›ˆYNÂˆXØ]Ú
J^ÂˆYŠOË˜ÛÙOOOIÑ•UT‘WÔ“Ñ’SWÔÐÒSPIÊ^Âˆ™\ÝÜ™PÛÛ[Z]Y›Ùš[R[“Y[[ÜžJYJNÜ›Ùš[UÜš]P›ØÚÙY]YNÜ›Ùš[T™XÛÝ™\žTÛÝ\˜ÙOIÙ]\™IÎÜ›Ùš[T™XÛÝ™\žT™X\ÛÛYOË›Y\ÜØYÙ_Ýš[™ÊJNÂˆÚÝÐ\›ÝXÙOËŠ	Ù\œ›Ü‰Ë	Ñ‘HUQTÕ8àk¹¦í9¥¬8àc9oáz) xàiøàfIË	ùå.úgh¹oªyn,9¦`¸àjøà xàdøàk¸à¨¸àåøàê¸à¢8à¢¹¥¬8àeøàa9oh¹o#øàk¹ki¹ïä¸àáøàï8à¯øà¤¹©'9aî¸àeøào¸àeøàgøà ¹."¹¦î8àcxà¤ºf,¸àd8àgøà y/çykf8à¤¹`g9«h¸àeøài¸àa8ào¸àfxà ‰Ë	ù¦í9¥¬8à¤¹è®º*£IË

OO˜ÚXÚÑ›Ü\\]JYJJNÂˆ™]\›ˆ˜[ÙNÂˆBˆ™\ÝÜ™PÛÛ[Z]Y›Ùš[R[“Y[[ÜžJYJNÛX\šÔ›Ùš[PÛÛ™›XÝ
	Ü™X\ÛÛŸy¦`¸àjù/çykf8àáøàï8à¯øàk¹¥m9d"9 )øà¤¹è®º*£xàiøàcxào¸àføà¤øàiøàeøàgØ
NÜ™]\›ˆ˜[ÙNÂˆBŸB‚™[˜Ý[ÛˆZTÝ]R\ÕÙ^JÝ]J^ÂˆÛÛœÝÏS[X™\ŠÝ]OË\]Y]
_ÚYŠ]Ê\™]\›ˆ˜[ÙNÂˆÛÛœÝO[™]È]JÊK[™]È]J
NÂˆ™]\›ˆK™Ù][YX\Š
OOOX‹™Ù][YX\Š
I‰˜K™Ù][Û

OOOX‹™Ù][Û

I‰˜K™Ù]]J
OOOX‹™Ù]]J
NÂŸB™[˜Ý[Ûˆ™\ÝÜ™T™\Ú[Y[ZTÝ]J
^Âˆ™\ÝÜš[™ÕZTÝ]O]YNÂˆž^ÂˆYŠ™\ÝÜ™P‘š[˜[™\Ý[YJ
J^Âˆ\\ÝÜžT™\XÙJ	Ý˜XÙIË
NÂˆÙ][Y[Ý]


OOœÚÝÐ\›ÝXÙOËŠ	Ú[™›ÉË	ùíãùd"9k§ù¢)¸à¤¹a£ze¢øàeøào¸àeøàgÉË	ùa£z*«xàoú/¯8àoùbcxàk¹fç¹ëe8àj9«¢øà¢¹¦`ºe¤øàbøà¢yí¦¸àdxài¸àa8ào¸àfxà ‰ÊKÌ
NÂˆ™]\›ˆ	Ø™š[˜[	ÎÂˆBˆÛÛœÝÝ]O\™XYZTÝ]J
NÂˆYŠ]ZTÝ]R\ÕÙ^JÝ]JJ^ÂˆÚÝÔØÜ™Y[Š	ÚÛYIËÛ›Ò\ÝÜžNYK[œÝ[Y_JNÂˆ\\ÝÜžT™\XÙJ	ÚÛYIË
NÂˆ™]\›ˆ	ÚÛYIÎÂˆBˆYŠÝ]KœØÜ™Y[OOIÛ\ÜÛÛ‰É‰œÝ]K›\ÜÛÛ’Y	‰“TÔÓÓ”ÖÜÝ]K›\ÜÛÛ’YJ^ÂˆXÝ]™S\ÜÛÛ\Ý]K›\ÜÛÛ’YÂˆ\ÜÛÛ”Ý\SX]›X^
X]›Z[ŠTÔÓÓ”ÖØXÝ]™S\ÜÛÛ—KœYÙ\Ë›[™ÝLK[X™\ŠÝ]K›\ÜÛÛ”Ý\
_
JNÂˆ\ÜÛÛÛÛ\]S[ÙOY˜[ÙNÂˆ™\Ù]\ÜÛÛ”Ý]J
NÂˆÚÝÔØÜ™Y[Š	Û\ÜÛÛ‰ËÛ›Ò\ÝÜžNYK[œÝ[Y_JNÂˆ™[™\“\ÜÛÛŠ
NÂˆ\\ÝÜžT™\XÙJ	Û\ÜÛÛ‰Ë
NÂˆ™]\›ˆ	Û\ÜÛÛ‰ÎÂˆBˆÛÛœÝ\™Ù]TÐQ‘WÔ‘TÕSQWÔÐÔ‘QS”Ëš\ÊÝ]KœØÜ™Y[ŠOÜÝ]KœØÜ™Y[Ž‰ÚÛYIÎÂˆÚÝÔØÜ™Y[Š\™Ù]Û›Ò\ÝÜžNYK[œÝ[Y_JNÂˆYŠ\™Ù]OOIÜ›Ø›[\ÉÊ[Ü[”›Ø›[\ÒXŠ
NÂˆ\\ÝÜžT™\XÙJ\™Ù]
NÂˆ™]\›ˆ\™Ù]ÂˆYš[˜[^Âˆ™\ÝÜš[™ÕZTÝ]OY˜[ÙNÂˆBŸBÚ[™ÝË˜Y]™[\Ý[™\Š	ÜYÙZYIË

OOžÜ\œÚ\Ý›Ùš[TÚ[[J
NÜ\œÚ\Ý™\Ú[Y[ZTÝ]J
NÜ™[X\ÙT›Ùš[UÜš]SX\ÙJ
_JNÂÚ[™ÝË˜Y]™[\Ý[™\Š	Ø™Y›Ü™][›ØY	Ë

OOžÜ\œÚ\Ý›Ùš[TÚ[[J
NÜ\œÚ\Ý™\Ú[Y[ZTÝ]J
NÜ™[X\ÙT›Ùš[UÜš]SX\ÙJ
_JNÂ™ØÝ[Y[˜Y]™[\Ý[™\Š	Ýš\ÚXš[]XÚ[™ÙIË

OOžÚYŠØÝ[Y[š\ÚXš[]TÝ]OOOIÚY[‰Ê^Ü\œÚ\Ý›Ùš[TÚ[[J
NÜ™[X\ÙT›Ùš[UÜš]SX\ÙJ
__JNÂ‚œ™\ÝÜ™T™\Ú[Y[ZTÝ]J
NÂÚ[™ÝË‘‘TUQTÕÐ“ÓÕÓÒÈHYNÂ‹ËÈOOOOHÎˆÐH›ÙXÝ[ÛˆÝ\ÜOOOOB›]Y™\œ™Y[œÝ[›Û\[[Â›]ÝÔ™YÚ\Ý˜][Û[[Â›][™[™Õ\]T™YÚ\Ý˜][Û[[Â›]ÛÛ›Û\”™[ØY[™ÏY˜[ÙNÂ›]\Ý\]PÚXÚÏLÂ›]™]š[Ý\ÓÛ›[™TÝ]O[˜]šYØ]Ü‹›Û“[™NÂ›]Ù\šXÙUÛÜšÙ\•™\œÚ[Û[[Â‚˜ÛÛœÝ[œÝ[Ø\™YØÝ[Y[™Ù][[Y[žRY
	Ú[œÝ[Ø\™	ÊNÂ˜ÛÛœÝ[œÝ[ØPYØÝ[Y[™Ù][[Y[žRY
	Ú[œÝ[ØP‰ÊNÂ˜ÛÛœÝØS[Ù[YØÝ[Y[™Ù][[Y[žRY
	ÜØS[Ù[	ÊNÂ˜ÛÛœÝÛÜÙTØS[Ù[YØÝ[Y[™Ù][[Y[žRY
	ØÛÜÙTØS[Ù[	ÊNÂ˜ÛÛœÝÙ™›[™T[YØÝ[Y[™Ù][[Y[žRY
	ÛÙ™›[™T[	ÊNÂ˜ÛÛœÝ\›ÝXÙOYØÝ[Y[™Ù][[Y[žRY
	Ø\›ÝXÙIÊNÂ˜ÛÛœÝ\›ÝXÙRXÛÛYØÝ[Y[™Ù][[Y[žRY
	Ø\›ÝXÙRXÛÛ‰ÊNÂ˜ÛÛœÝ\›ÝXÙU]OYØÝ[Y[™Ù][[Y[žRY
	Ø\›ÝXÙU]IÊNÂ˜ÛÛœÝ\›ÝXÙP›ÙOYØÝ[Y[™Ù][[Y[žRY
	Ø\›ÝXÙP›ÙIÊNÂ˜ÛÛœÝ\›ÝXÙPXÝ[ÛYØÝ[Y[™Ù][[Y[žRY
	Ø\›ÝXÙPXÝ[Û‰ÊNÂ˜ÛÛœÝ\›ÝXÙPÛÜÙOYØÝ[Y[™Ù][[Y[žRY
	Ø\›ÝXÙPÛÜÙIÊNÂ‚™[˜Ý[Ûˆ\ÔÝ[™[Û™J
^Âˆ™]\›ˆÚ[™ÝË›X]ÚYYXJ	Ê\Ü^K[[ÙNˆÝ[™[Û™JIÊK›X]Ú\ÈÚ[™ÝË›˜]šYØ]Ü‹œÝ[™[Û™OOO]YNÂŸB™[˜Ý[Ûˆ\ÒSÔÊ
^È™]\›ˆÚ\Û™_\Y\ÙÚK\Ý
˜]šYØ]Ü‹\Ù\YÙ[
NÈB™[˜Ý[Ûˆ™Yœ™\Ú[œÝ[Ø\™

^ÈYŠ[œÝ[Ø\™
Z[œÝ[Ø\™˜Û\ÜÓ\ÝÙÙÛJ	ÚY[‰Ë\ÔÝ[™[Û™J
JNÈBœ™Yœ™\Ú[œÝ[Ø\™

NÂ‚™[˜Ý[ÛˆÚÝÐ\›ÝXÙJÚ[™]K›ÙKXÝ[Û“X™[IÉËXÝ[Û[[
^ÂˆYŠX\›ÝXÙJ\™]\›ŽÂˆ\›ÝXÙK˜Û\ÜÓ˜[YOX\[›ÝXÙHÚÝÈ	ÚÚ[™	ÉßXÂˆ\›ÝXÙRXÛÛ‹^ÛÛ[ZÚ[™OOIÝ\]IÏÉø«!»î#ÉÎšÚ[™OOIÙ\œ›Ü‰ÏÉø¦¨;î#ÉÎšÚ[™OOIÛÙ™›[™IÏÉü'äí	Î‰ø¡.{î#ÉÎÂˆ\›ÝXÙU]K^ÛÛ[]]NÂˆ\›ÝXÙP›ÙK^ÛÛ[X›ÙNÂˆYŠXÝ[Û“X™[	‰˜XÝ[ÛŠ^Âˆ\›ÝXÙPXÝ[Û‹œÝ[K™\Ü^OIÉÎØ\›ÝXÙPXÝ[Û‹^ÛÛ[XXÝ[Û“X™[Âˆ\›ÝXÙPXÝ[Û‹›Û˜ÛXÚÏJ
OOžÂˆYP\›ÝXÙJ
NÂˆž^ØXÝ[ÛŠ
_XØ]Ú
J^ØÛÛœÛÛKØ\›Š	Ó›ÝXÙHXÝ[Ûˆ˜Z[Y	ËJNÜÙ][Y[Ý]


OOœ™\ÜÛØ˜[\œ›ÜËŠ
K
_BˆNÂˆY[Ù^Âˆ\›ÝXÙPXÝ[Û‹œÝ[K™\Ü^OIÛ›Û™IÎØ\›ÝXÙPXÝ[Û‹›Û˜ÛXÚÏ[[ÂˆBŸB™[˜Ý[ÛˆYP\›ÝXÙJ
^ÈYŠ\›ÝXÙJX\›ÝXÙK˜Û\ÜÓ˜[YOIØ\[›ÝXÙIÎÈB˜\›ÝXÙPÛÜÙOË˜Y]™[\Ý[™\Š	ØÛXÚÉËYP\›ÝXÙJNÂ‚Ú[™ÝË˜Y]™[\Ý[™\Š	Ø™Y›Ü™Z[œÝ[›Û\	ËOOžÙKœ™]™[Y˜][

NÙY™\œ™Y[œÝ[›Û\YNßJNÂ›]ØT™]\›‘›ØÝ\Ï[[Â™[˜Ý[ÛˆÜ[”ØQÝZYJ
^ÂˆYŠ\ØS[Ù[
\™]\›ŽÂˆØT™]\›‘›ØÝ\ÏYØÝ[Y[˜XÝ]™Q[[Y[[œÝ[˜Ù[ÙˆS[[Y[ÙØÝ[Y[˜XÝ]™Q[[Y[›[ÂˆØS[Ù[˜Û\ÜÓ\Ý˜Y
	ÛÜ[‰ÊNÜØS[Ù[œÙ]]šX]J	Ø\šXKZY[‰Ë	Ù˜[ÙIÊNÂˆ™\]Y\Ý[š[X][Û‘œ˜[YJ

OO˜ÛÜÙTØS[Ù[Ë™›ØÝ\ÊÜ™]™[ØÜ›ÛY_JJNÂŸB™[˜Ý[ÛˆÛÜÙTØQÝZYJ
^ÂˆYŠ\ØS[Ù[
\™]\›ŽÂˆØS[Ù[˜Û\ÜÓ\Ýœ™[[Ý™J	ÛÜ[‰ÊNÜØS[Ù[œÙ]]šX]J	Ø\šXKZY[‰Ë	ÝYIÊNÂˆÛÛœÝ\™Ù]\ØT™]\›‘›ØÝ\ÎÜØT™]\›‘›ØÝ\Ï[[Ü™\]Y\Ý[š[X][Û‘œ˜[YJ

OO\™Ù]Ë™›ØÝ\ÏËŠÜ™]™[ØÜ›ÛY_JJNÂŸBš[œÝ[ØPË˜Y]™[\Ý[™\Š	ØÛXÚÉË\Þ[˜Ê
OOžÂˆYŠY™\œ™Y[œÝ[›Û\
^ÂˆY™\œ™Y[œÝ[›Û\œ›Û\

NÂˆ]ØZ]Y™\œ™Y[œÝ[›Û\\Ù\ÚÚXÙNÂˆY™\œ™Y[œÝ[›Û\[[Ü™Yœ™\Ú[œÝ[Ø\™

NÜ™]\›ŽÂˆBˆÜ[”ØQÝZYJ
NÂŸJNÂ˜ÛÜÙTØS[Ù[Ë˜Y]™[\Ý[™\Š	ØÛXÚÉËÛÜÙTØQÝZYJNÂœØS[Ù[Ë˜Y]™[\Ý[™\Š	ØÛXÚÉËOOžÚYŠK\™Ù]OO\ØS[Ù[
XÛÜÙTØQÝZYJ
_JNÂ™ØÝ[Y[˜Y]™[\Ý[™\Š	ÚÙ^YÝÛ‰ËOOžÚYŠKšÙ^OOOIÑ\ØØ\IÉ‰œØS[Ù[Ë˜Û\ÜÓ\Ý˜ÛÛZ[œÊ	ÛÜ[‰ÊJ^ÙKœ™]™[Y˜][

NØÛÜÙTØQÝZYJ
Nß_JNÂ‚™[˜Ý[Ûˆ\]SÛ›[™TÝ]JÚÝÕ˜[œÚ][Û]YJ^ÂˆÛÛœÝÛ›[™O[˜]šYØ]Ü‹›Û“[™NÂˆÙ™›[™T[Ë˜Û\ÜÓ\ÝÙÙÛJ	ÜÚÝÉË[Û›[™JNÂˆYŠÚÝÕ˜[œÚ][Û‰‰œ™]š[Ý\ÓÛ›[™TÝ]HOO[Û›[™J^ÂˆYŠÛ›[™J^ÜÜØ\Ý
	øàª¸àìøàêxà©8àìøàjù¢.øà¢¸ào¸àeøàgÉÊNØÚXÚÑ›Ü\\]J˜[ÙJ_Bˆ[ÙHÚÝÐ\›ÝXÙJ	ÛÙ™›[™IË	øàª¸àåxàêxà©8àìøàiùb*yå*9.+IË	ù¥fy§d8àj9ki¹ïä¸àáøàï8à¯øàkøàdøàk¹êëù§*øàbøà¢yb*yå*8àiøàcxào¸àfxà ¹£©yí¦¸àc9¢.øà¢øàj9¦í9¥¬9è®º*£xà¤º(c8àa8ào¸àfxà ‰ÊNÂˆBˆ™]š[Ý\ÓÛ›[™TÝ]O[Û›[™NÂˆ™Yœ™\ÚØRX[

NÂŸBÚ[™ÝË˜Y]™[\Ý[™\Š	ÛÛ›[™IË

OO\]SÛ›[™TÝ]JYJJNÂÚ[™ÝË˜Y]™[\Ý[™\Š	ÛÙ™›[™IË

OO\]SÛ›[™TÝ]JYJJNÂ\]SÛ›[™TÝ]J˜[ÙJNÂ‚™[˜Ý[ÛˆXÝ]˜]T[™[™Õ\]SÜ”™[ØY

^ÂˆËÈŒLMŽˆ\][™È\È[Ø^\ÈHÛ™K]\Ü\˜][Û‹ˆH›ØÚÙYØÛÛ™›XÝ[™ÈØÜ™Y[ˆ\ÂˆËÈ[™XYH›ÛY[‹[Y[[ÜžH]H˜XÚÈÈH\ÝÛÛ[Z]YÛ˜\ÚÝÛÈ]]\ÝˆËÈ›Ý\ÚÈHX\›™\ˆÈX[X[H^ÜÜ™[ØY™Y›Ü™H[œÝ[[™ÈHØY™\ˆ[[YK‚ˆ\œÚ\Ý™\Ú[Y[ZTÝ]J
NÂˆÛÛœÝÛÜšÙ\\[™[™Õ\]T™YÚ\Ý˜][ÛËØZ][™ÎÂˆYŠÛÜšÙ\Š]ÛÜšÙ\‹œÜÝY\ÜØYÙJÝ\N‰ÔÒÒTÕÐRUS‘ÉßJNÂˆ[ÙHØØ][Û‹œ™[ØY

NÂˆ™]\›ˆYNÂŸB˜\Þ[˜È[˜Ý[Ûˆ\T[™[™Õ\]TØY™[J
^ÂˆËÈYˆ\ÈXˆ\ÈÝ[KÛÛ™›XÝYÜˆÜš]KX›ØÚÙYÈ›ÝÜš]Hœ›ÛH]‚ˆËÈÚ[\HXÝ]˜]HHØZ][™È\[™]H™]È[[YHØYH]]Üš]]]™BˆËÈÛÛ[Z]Y›Ùš[Kˆ\È]›ÚYÈH™]š[Ý\ÈX[X[™[ØYÙ^ÜÛÜ‚ˆYŠ›Ùš[PÛÛ™›XÝ›ØÚÙY›Ùš[UÜš]P›ØÚÙY
^Âˆ™]\›ˆXÝ]˜]T[™[™Õ\]SÜ”™[ØY

NÂˆBˆÛÛœÝØ]™Y\\œÚ\Ý›Ùš[TÚ[[J
NÂˆYŠ\Ø]™Y
^ÂˆËÈ\œÚ\Ý›Ùš[TÚ[[H›ÛÈH›Ùš[H˜XÚÈÈHÛÛ[Z]YÛ˜\ÚÝÛ‚ˆËÈ˜Z[\™KØÛÛ™›XÝˆ›ØÙYY[™ÈÚ]H\\]H\È\™Y›Ü™HØY™\ˆ[‚ˆËÈ˜\[™ÈHX\›™\ˆ[ˆH™XÛÝ™\žHÛÜšÙ›ÝË‚ˆ™]\›ˆXÝ]˜]T[™[™Õ\]SÜ”™[ØY

NÂˆBˆž^Ø]ØZ]›ÛZ\ÙKœ˜XÙJÝÜš]T™XÛÝ™\žPÚXÚÜÚ[
›Ùš[K	Ü™K]\]IËYJK™]È›ÛZ\ÙJ™\ÛÛ™OOœÙ][Y[Ý]


OOœ™\ÛÛ™J˜[ÙJKN
JWJNßXØ]Ú
ÙJ^ßBˆ™]\›ˆXÝ]˜]T[™[™Õ\]SÜ”™[ØY

NÂŸB™[˜Ý[ÛˆÚÝÕ\]P]˜Z[X›J™YÊ^Âˆ[™[™Õ\]T™YÚ\Ý˜][Û\™YÎÂˆÚÝÐ\›ÝXÙJ	Ý\]IË	Ñ‘HUQTÕ8à¤¹¦í9¥¬8àiøàcxào¸àfIË	ùki¹ïä¸àáøàï8à¯øà¤¹/çz+møàeøài¸à z!ê¹båxàiù§ 9¥¬9âb8àn9b!øà¢¹¦ïøàb8ào¸àfxà ‰Ë	ù.â¸àfxàd9¦í9¥¬	Ë

OO˜\T[™[™Õ\]TØY™[J
JNÂˆ™Yœ™\ÚØRX[

NÂŸB‚˜\Þ[˜È[˜Ý[ÛˆÚXÚÑ›Ü\\]JÚÝÔ™\Ý[]YJ^ÂˆYŠ\ÝÔ™YÚ\Ý˜][ÛŠ^ÚYŠÚÝÔ™\Ý[
\ÜØ\Ý
	ù¦í9¥¬9è®º*£xàk¹®¥¹`¦y.+xàiøàfIÊNÜ™]\›ˆ˜[ÙNßBˆž^Âˆ\Ý\]PÚXÚÏQ]K››ÝÊ
NÂˆ]ØZ]ÝÔ™YÚ\Ý˜][Û‹\]J
NÂˆYŠÝÔ™YÚ\Ý˜][Û‹ØZ][™Ê^ÜÚÝÕ\]P]˜Z[X›JÝÔ™YÚ\Ý˜][ÛŠNÜ™]\›ˆYNßBˆYŠÚÝÔ™\Ý[
\ÜØ\Ý
	ù§ 9¥¬9âb8àiøàfIÊNÂˆ™Yœ™\ÚØRX[

NÜ™]\›ˆ˜[ÙNÂˆXØ]Ú
J^ÂˆÛÛœÛÛKØ\›Š	Õ\]HÚXÚÈ˜Z[Y	ËJNÂˆYŠÚÝÔ™\Ý[
\ÚÝÐ\›ÝXÙJ	Ù\œ›Ü‰Ë	ù¦í9¥¬8à¤¹è®º*£xàiøàcxào¸àføà¤øàiøàeøàgÉË	ú`&¹/èyâ­¹¡bøà¤¹è®º*£xàeøài¸à xà ¸àa¹. 9n©¸àbº*i¸àeøàcøàh8àexàa8à ‰ÊNÂˆ™]\›ˆ˜[ÙNÂˆBŸB‚šYŠ	ÜÙ\šXÙUÛÜšÙ\‰È[ˆ˜]šYØ]ÜŠ^Âˆ˜]šYØ]Ü‹œÙ\šXÙUÛÜšÙ\‹˜Y]™[\Ý[™\Š	ÛY\ÜØYÙIËOOžÂˆYŠK™]OË\HOOIÐTÕ‘T”ÒSÓ‰Ê\™]\›ŽÂˆÙ\šXÙUÛÜšÙ\•™\œÚ[ÛYK™]K™\œÚ[ÛŸ[ÂˆYŠÙ\šXÙUÛÜšÙ\•™\œÚ[Ûˆ	‰ˆÙ\šXÙUÛÜšÙ\•™\œÚ[ÛˆOOPTÕ‘T”ÒSÓŠ^ÂˆÚÝÐ\›ÝXÙJ	Ý\]IË	øà¨¸àåøàê¹¦í9¥¬8àc9oáz) xàiøàfIË9å.úgh¸àkÉÐTÕ‘T”ÒSÓŸxà xàª¸àåxàêxà©8àìùå*8àáøàï8à¯øàkÉÜÙ\šXÙUÛÜšÙ\•™\œÚ[ÛŸxàiøàfxà ¹¦í9¥¬8àeøài¸àgxà£xàb8ài¸àcøàh8àexàa8à ˜	ù¦í9¥¬8à¤¹è®º*£IË

OO˜ÚXÚÑ›Ü\\]JYJJNÂˆBˆ™Yœ™\ÚØRX[

NÂˆJNÂŸB™[˜Ý[Ûˆ™\]Y\ÝÙ\šXÙUÛÜšÙ\•™\œÚ[ÛŠ
^Âˆ˜]šYØ]Ü‹œÙ\šXÙUÛÜšÙ\Ë˜ÛÛ›Û\ËœÜÝY\ÜØYÙOËŠÝ\N‰ÑÑUÕ‘T”ÒSÓ‰ßJNÂŸB‚šYŠ	ÜÙ\šXÙUÛÜšÙ\‰È[ˆ˜]šYØ]Ü‰‰›ØØ][Û‹œ›ÝØÛÛOOIÙš[N‰Ê^ÂˆÚ[™ÝË˜Y]™[\Ý[™\Š	ÛØY	Ë\Þ[˜Ê
OOžÂˆž^ÂˆÛÛœÝ™YÏX]ØZ]˜]šYØ]Ü‹œÙ\šXÙUÛÜšÙ\‹œ™YÚ\Ý\Š	Ë‹ÜÝËšœÉËÝ\]UšXPØXÚN‰Û›Û™IßJNÂˆÝÔ™YÚ\Ý˜][Û\™YÎÂˆYŠ™YËØZ][™Ê\ÚÝÕ\]P]˜Z[X›J™YÊNÂˆ™YË˜Y]™[\Ý[™\Š	Ý\]Y›Ý[™	Ë

OOžÂˆÛÛœÝÛÜšÙ\\™YËš[œÝ[[™ÎÚYŠ]ÛÜšÙ\Š\™]\›ŽÂˆÛÜšÙ\‹˜Y]™[\Ý[™\Š	ÜÝ]XÚ[™ÙIË

OOžÂˆYŠÛÜšÙ\‹œÝ]OOOIÚ[œÝ[Y	É‰›˜]šYØ]Ü‹œÙ\šXÙUÛÜšÙ\‹˜ÛÛ›Û\Š\ÚÝÕ\]P]˜Z[X›J™YÊNÂˆ™Yœ™\ÚØRX[

NÂˆJNÂˆJNÂˆ™Yœ™\ÚØRX[

NÂˆ™\]Y\ÝÙ\šXÙUÛÜšÙ\•™\œÚ[ÛŠ
NÂˆÙ][Y[Ý]


OO˜ÚXÚÑ›Ü\\]J˜[ÙJKLŒ
NÂˆXØ]Ú
\œŠ^ÂˆÛÛœÛÛKØ\›Š	ÔÙ\šXÙHÛÜšÙ\ˆ™YÚ\Ý˜][Ûˆ˜Z[Y‰Ë\œŠNÂˆÚÝÐ\›ÝXÙJ	Ù\œ›Ü‰Ë	øàª¸àåxàêxà©8àìù®¥¹`¦xàjùi,y¥eøàeøào¸àeøàgÉË	øàª¸àìøàêxà©8àìøàiøàkùb*yå*8àiøàcxào¸àfxàc8à xàª¸àåxàêxà©8àìú-mùbåxàk¹®¥¹`¦xàc8àiøàcxào¸àføà¤øàiøàeøàgøà ¹a£z*«xàoú/¯8àoøàfxà¢øàj9¥.ye¡8àfxà¢ùh-9d"8àc8à`¸à¢¸ào¸àfxà ‰Ë	ùa£z*«xàoú/¯8àoÉË

OO›ØØ][Û‹œ™[ØY

JNÂˆ™Yœ™\ÚØRX[

NÂˆBˆJNÂˆ˜]šYØ]Ü‹œÙ\šXÙUÛÜšÙ\‹˜Y]™[\Ý[™\Š	ØÛÛ›Û\˜Ú[™ÙIË

OOžÂˆYŠÛÛ›Û\”™[ØY[™Ê\™]\›ŽØÛÛ›Û\”™[ØY[™Ï]YNÜ\œÚ\Ý™\Ú[Y[ZTÝ]J
NÛØØ][Û‹œ™[ØY

NÂˆJNÂŸB‚™[˜Ý[ÛˆX^X™PÚXÚÕ\]J
^ÂˆYŠØÝ[Y[š\ÚXš[]TÝ]OOOIÝš\ÚX›IÉ‰›˜]šYØ]Ü‹›Û“[™I‰‘]K››ÝÊ
K[\Ý\]PÚXÚÏJŒ
ŒL
XÚXÚÑ›Ü\\]J˜[ÙJNÂŸBÚ[™ÝË˜Y]™[\Ý[™\Š	Ù›ØÝ\ÉË

OOžÜ™]˜[Y]T›Ùš[Qœ™\Ú™\ÜÊ	øàåxàªxàï8àªøà®yoªyn,	ÊNÛX^X™PÚXÚÕ\]J
_JNÂ™ØÝ[Y[˜Y]™[\Ý[™\Š	Ýš\ÚXš[]XÚ[™ÙIË

OOžÚYŠØÝ[Y[š\ÚXš[]TÝ]OOOIÝš\ÚX›IÊ\™]˜[Y]T›Ùš[Qœ™\Ú™\ÜÊ	ùå.úgh¹oªyn,	ÊNÛX^X™PÚXÚÕ\]J
_JNÂÚ[™ÝË˜Y]™[\Ý[™\Š	ÜYÙ\ÚÝÉËOOžÜ™]˜[Y]T›Ùš[Qœ™\Ú™\ÜÊKœ\œÚ\ÝYÉù/$y«h¹â­¹¡bøàbøà¢xàk¹oªyn,	Î‰ùå.úghº(j9é.‰ÊNÝ\]SÛ›[™TÝ]J˜[ÙJNÜ™Yœ™\ÚØRX[

_JNÂ‚™[˜Ý[Ûˆž]\Õ^
Š^ÂˆYŠS[X™\‹š\Ñš[š]JŠJ\™]\›ˆ	ù.#y¦#‰ÎÂˆYŠL
\™]\›ˆ	ÛŸH˜ÂˆYŠL
ŒL
\™]\›ˆ	Ê‹ÌL
KÑš^Y
J_HÐ˜Âˆ™]\›ˆ	Ê‹ÌLÌL
KÑš^Y
J_HP˜ÂŸB™[˜Ý[Ûˆ]ZXÚÔ›Ùš[R[YÜš]TÝ]J
^Âˆž^ÂˆÛÛœÝOXÝ\œ™[]ÛZXÔ›Ùš[J
NÂˆYŠXJ\™]\›ˆÛÚÎ™˜[ÙKX™[‰ùb'yfç¹/çykf9bcIßNÂˆÛÛœÝZ\œ›Ü[ØØ[ÝÜ˜YÙK™Ù]][JÕÔQÑWÒÑVJNÂˆÛÛœÝ^XÝY[ØØ[ÝÜ˜YÙK™Ù]][J“Ñ’SWÐÒPÒÔÕSWÒÑVJNÂˆYŠ[Z\œ›ÜŠ\™]\›ˆÛÚÎ™˜[ÙKX™[‰øàçøàêxàï9§*¹/g9¢$	ßNÂˆÛÛœÝÚXÚÙY]˜[Y˜]ÕÚ]ÚXÚÜÝ[JZ\œ›Ü‹^XÝY[
NÂˆYŠ›Ùš[R[YÜš]PÚXÚÜÝ[JÚXÚÙYœ›Ùš[JHOO\›Ùš[R[YÜš]PÚXÚÜÝ[JKœ›Ùš[JJ\™]\›ˆÛÚÎ™˜[ÙKX™[‰øàçøàêxàï9më¹ål	ßNÂˆ™]\›ˆÛÚÎYKX™[‰ù«hùn.	ßNÂˆXØ]Ú
J^Ü™]\›ˆÛÚÎ™˜[ÙKX™[‰ú) yè®º*£IË\œ›ÜŽ™_NßBŸB˜\Þ[˜È[˜Ý[Ûˆ™\šYžT›Ùš[Q\˜Xš[]JÚÝÔ™\Ý[]YJ^ÂˆYŠ›Ùš[T™XÛÝ™\žTÛÝ\˜ÙOOOIÙ]\™IÊ^ÂˆYŠÚÝÔ™\Ý[
\ÚÝÐ\›ÝXÙJ	Ù\œ›Ü‰Ë	ù§ 9¥¬9âb8àn8àk¹¦í9¥¬8àc9oáz) xàiøàfIË	ù/çykf8àáøàï8à¯øàkøàdøàk¹å.úgh¸à¢8à¢¹¥¬8àeøàa9oh¹o#øàiøàfxà ¹cé8àa9å.úgh¸àiøàkù©'9§îøà¡9/ë¹oªxà¤º(c8à£øàf¸à y§ 9¥¬9âb8àn9¦í9¥¬8àeøài¸àbøà¢yè®º*£xàeøài¸àcøàh8àexàa8à ‰Ë	ù¦í9¥¬8à¤¹è®º*£IË

OO˜ÚXÚÑ›Ü\\]JYJJNÂˆ™]\›ˆ˜[ÙNÂˆBˆÛÛœÝ]ZXÚÏ\]ZXÚÔ›Ùš[R[YÜš]TÝ]J
NÂˆ]Ú[ÏLÝž^ÜÚ[ÏX]ØZ]™XÛÝ™\žPÚXÚÜÚ[ÛÝ[

_XØ]Ú
ÙJ^ßBˆYŠ]ZXÚË›ÚÊ^ÂˆYŠÚÝÔ™\Ý[
\ÚÝÐ\›ÝXÙJ	Ú[™›ÉË	ùki¹ïä¸àáøàï8à¯øàkù«hùn.8àiøàfIË9c§ùkd9æ¡8àj¹ãï¹g*8àáøàï8à¯øàj9.¤¹£æøàçøàêxàï8àk¹¥m9d"9 )øà¤¹è®º*£xàeøào¸àeøàgøà ºemù§'ùoªy¥éùà®xàkÉÜÚ[ßy.í¸à`¸à¢¸ào¸àfxà ‰ÛØØ[ÝÜ˜YÙK™Ù]][JTÕÑÓÓÑÔ“Ñ’SWÒÑVJOÉù. 9.%¹.èùbcxàk¹«hùn.8àáøàï8à¯øà ¹/çy£ xàeøài¸àa8ào¸àfxà ‰Î‰ù. 9.%¹.èùbcxàk¸àáøàï8à¯øàkù«(yfç¹/çykf9.ézfcxàjù/g9¢$8àexà£8ào¸àfxà ‰ßX
NÂˆ™]\›ˆYNÂˆBˆYŠÚÝÔ™\Ý[
\ÚÝÐ\›ÝXÙJ	Ù\œ›Ü‰Ë	ùki¹ïä¸àáøàï8à¯øà¤¹è®º*£xàeøài¸àcøàh8àexàa	Ë9¥m9d"9 )ùè®º*£yíd9§§;ï&‰Ü]ZXÚË›X™[xà ¹ãï¹g*8àk¹è®¹k¦¸àáøàï8à¯øàkú!ê¹båyoªy¥éùªgù©âøàiù/çz+møàexà£8ài¸àa8ào¸àfxàc8à yoíxàk¸àgøà yi%º`ê8àä8ààøà«øà¨¸ààøàåøà¤¹¦î8àcyaî¸àeøài¸àcøàh8àexàa8à ˜	øàáøàï8à¯øà¤¹¦î8àcyaî¸àfIË^ÜX\›š[™Ñ]JNÂˆ™]\›ˆ˜[ÙNÂŸB˜\Þ[˜È[˜Ý[ÛˆÜ™X]T™XÛÝ™\žTÚ[›ÝÊ
^ÂˆYŠ›Ùš[UÜš]P›ØÚÙY›Ùš[PÛÛ™›XÝ›ØÚÙY
^ÜÚÝÐ\›ÝXÙJ	Ù\œ›Ü‰Ë	ùoªy¥éùà®xà¤¹/g9¢$8àiøàcxào¸àføà¤ÉË	ù/çykf8àc9`g9«h¸àeøài¸àa8à¢ùå.úgh¸àiøàkù¥¬8àeøàa9oªy¥éùà®xà¤¹/g8à¢¸ào¸àføà¤øà ¹§ 9¥¬9â­¹¡bøà¤º*«xàoú/¯8à 8àbøà y/çykf9â­¹¡bøà¤¹è®º*£xàeøài¸àcøàh8àexàa8à ‰ÊNÜ™]\›ˆ˜[ÙNßBˆYŠ\\œÚ\Ý›Ùš[TÚ[[J
J^ÜÚÝÐ\›ÝXÙJ	Ù\œ›Ü‰Ë	ùoªy¥éùà®xà¤¹/g9¢$8àiøàcxào¸àføà¤ÉË	ùãï¹g*8àk¹ki¹ïä¸àáøàï8à¯øà¤¹«hùn.9/çykf8àiøàcxàj¸àbøàhøàgøàgøà xà yoªy¥éùà®y/g9¢$8à¤¹.+y«h¸àeøào¸àeøàgøà ‰ÊNÜ™]\›ˆ˜[ÙNßBˆž^ØÛÛœÝÚÏX]ØZ]Üš]T™XÛÝ™\žPÚXÚÜÚ[
›Ùš[K	ÛX[X[	ËYJNÚYŠÚÊ^ÜÜØ\Ý
	úemù§'ùoªy¥éùà®xà¤¹/g9¢$8àeøào¸àeøàgÉÊNÜ™Yœ™\ÚØRX[

NÜ™]\›ˆYNß]›ÝÈ™]È\œ›ÜŠ	ØÚXÚÜÚ[[˜]˜Z[X›IÊNßBˆØ]Ú
J^ÜÚÝÐ\›ÝXÙJ	Ù\œ›Ü‰Ë	ùoªy¥éùà®xà¤¹/g9¢$8àiøàcxào¸àføà¤øàiøàeøàgÉË	øàå¸àêxà©¸à­¸àk¹/çykf:h&9gçøà¡[™^Y¸àk¹b*yå*9â­¹¡bøà¤¹è®º*£xàeøài¸àcøàh8àexàa8à ‰ÊNÜ™]\›ˆ˜[ÙNßBŸB˜\Þ[˜È[˜Ý[Ûˆ[œÝ\™U™\œÚ[Û”™XÛÝ™\žPÚXÚÜÚ[

^Âˆž^ÂˆYŠØØ[ÝÜ˜YÙK™Ù]][J“Ñ’SWÕ‘T”ÒSÓ—ÐÒPÒÔÒS•ÒÑVJOOOPTÕ‘T”ÒSÓŠ\™]\›ˆ˜[ÙNÂˆYŠ›Ùš[UÜš]P›ØÚÙY›Ùš[PÛÛ™›XÝ›ØÚÙY
\™]\›ˆ˜[ÙNÂˆÛÛœÝÚÏX]ØZ]Üš]T™XÛÝ™\žPÚXÚÜÚ[
›Ùš[K™\œÚ[Û‹IÐTÕ‘T”ÒSÓŸXYJNÂˆYŠÚÊ^ÛØØ[ÝÜ˜YÙKœÙ]][J“Ñ’SWÕ‘T”ÒSÓ—ÐÒPÒÔÒS•ÒÑVKTÕ‘T”ÒSÓŠNÜ™Yœ™\ÚØRX[

NÜ™]\›ˆYNßBˆXØ]Ú
J^ØÛÛœÛÛKØ\›Š	Õ™\œÚ[Ûˆ™XÛÝ™\žHÚXÚÜÚ[˜Z[Y	ËJ_Bˆ™]\›ˆ˜[ÙNÂŸB‚˜\Þ[˜È[˜Ý[Ûˆ™Yœ™\ÚØRX[

^ÂˆÛÛœÝYØÝ[Y[™Ù][[Y[žRY
	ÜØU™\œÚ[Û”Ý]\ÉÊK™]YØÝ[Y[™Ù][[Y[žRY
	ÜØS™]ÛÜšÔÝ]\ÉÊK\ÜYØÝ[Y[™Ù][[Y[žRY
	ÜØQ\Ü^TÝ]\ÉÊKÛÜšÙ\YØÝ[Y[™Ù][[Y[žRY
	ÜØUÛÜšÙ\”Ý]\ÉÊKÝÜ˜YÙOYØÝ[Y[™Ù][[Y[žRY
	ÜØTÝÜ˜YÙTÝ]\ÉÊK˜\YØÝ[Y[™Ù][[Y[žRY
	ÜØTÝÜ˜YÙP˜\‰ÊK\œÚ\ÝYØÝ[Y[™Ù][[Y[žRY
	ÜØT\œÚ\Ý[˜ÙTÝ]\ÉÊK\œÚ\ÝYØÝ[Y[™Ù][[Y[žRY
	Ü™\]Y\Ý\œÚ\Ý[ÝÜ˜YÙIÊNÂˆÛÛœÝØÚ[XOYØÝ[Y[™Ù][[Y[žRY
	Ü›Ùš[TØÚ[XTÝ]\ÉÊKÛ˜\ÚÝYØÝ[Y[™Ù][[Y[žRY
	Ü›Ùš[TÛ˜\ÚÝÝ]\ÉÊK›Û˜XÚÏYØÝ[Y[™Ù][[Y[žRY
	Ü™\ÝÜ™T™R[\Ü	ÊKX[X[›Û˜XÚÏYØÝ[Y[™Ù][[Y[žRY
	Ü™\ÝÜ™T™SX[X[	ÊKÛÜœ\^ÜYØÝ[Y[™Ù][[Y[žRY
	Ù^ÜÛÜœ\›Ùš[IÊKØ]™TÝ]OYØÝ[Y[™Ù][[Y[žRY
	Ü›Ùš[TØ]™TÝ]\ÉÊK[YÜš]OYØÝ[Y[™Ù][[Y[žRY
	Ü›Ùš[R[YÜš]TÝ]\ÉÊK^ÜÝ]OYØÝ[Y[™Ù][[Y[žRY
	Ü›Ùš[Q^ÜÝ]\ÉÊNÂˆYŠŠ^ØÛÛœÝZ\ÛX]Ú\Ù\šXÙUÛÜšÙ\•™\œÚ[Û‰‰œÙ\šXÙUÛÜšÙ\•™\œÚ[ÛˆOOPTÕ‘T”ÒSÓŽÝ‹^ÛÛ[[Z\ÛX]ÚØ	ÐTÕ‘T”ÒSÓŸxàîù¦í9¥¬9oáz) Xœ[™[™Õ\]T™YÚ\Ý˜][ÛËØZ][™ÏØ	ÐTÕ‘T”ÒSÓŸxàîù¦í9¥¬8à`¸à¢˜TÕ‘T”ÒSÓŽÝ‹˜Û\ÜÓ˜[YOJZ\ÛX]Ú[™[™Õ\]T™YÚ\Ý˜][ÛËØZ][™ÊOÉÝØ\›‰Î‰ÙÛÛÙ	ßBˆYŠ™]
^Û™]^ÛÛ[[˜]šYØ]Ü‹›Û“[™OÉøàª¸àìøàêxà©8àìÉÎ‰øàª¸àåxàêxà©8àìÉÎÛ™]˜Û\ÜÓ˜[YO[˜]šYØ]Ü‹›Û“[™OÉÙÛÛÙ	Î‰ÝØ\›‰ßBˆYŠ\Ü
^Ù\Ü^ÛÛ[Z\ÔÝ[™[Û™J
OÉøàæøàï8àè9å.úgh¸à¨¸àåøàê‰Î‰øàå¸àêxà©¸à­‰ÎÙ\Ü˜Û\ÜÓ˜[YOZ\ÔÝ[™[Û™J
OÉÙÛÛÙ	Î‰ÉßBˆYŠÛÜšÙ\Š^ÂˆÛÛœÝÛÛ›ÛYHH[˜]šYØ]Ü‹œÙ\šXÙUÛÜšÙ\Ë˜ÛÛ›Û\ŽÂˆÛÜšÙ\‹^ÛÛ[XÛÛ›ÛYÉù®¥¹`¦yk£9.¡‰ÎŠ	ÜÙ\šXÙUÛÜšÙ\‰Ú[ˆ˜]šYØ]ÜÉù®¥¹`¦y.+IÎ‰úgg¹kï¹oç	ÊNÝÛÜšÙ\‹˜Û\ÜÓ˜[YOXÛÛ›ÛYÉÙÛÛÙ	Î‰ÝØ\›‰ÎÂˆBˆYŠØÚ[XJ^ÂˆYŠ›Ùš[T™XÛÝ™\žTÛÝ\˜ÙOOOIÙ]\™IÊ^ÜØÚ[XK^ÛÛ[Iù¦í9¥¬8àc9oáz) IÎÜØÚ[XK˜Û\ÜÓ˜[YOIÝØ\›‰ÎßBˆ[Ù^ÜØÚ[XK^ÛÛ[X‰Ü›Ùš[Kœ›Ùš[TØÚ[XU™\œÚ[ÛŸ“Ñ’SWÔÐÒSPWÕ‘T”ÒSÓŸXÜØÚ[XK˜Û\ÜÓ˜[YOJ›Ùš[Kœ›Ùš[TØÚ[XU™\œÚ[ÛOOT“Ñ’SWÔÐÒSPWÕ‘T”ÒSÓŠOÉÙÛÛÙ	Î‰ÝØ\›‰ÎßBˆBˆYŠØ]™TÝ]J^ÂˆYŠ›Ùš[PÛÛ™›XÝ›ØÚÙY
^ÜØ]™TÝ]K^ÛÛ[Iùb)yå.úgh¸à¤¹©'9aî¸àîù`g9«h‰ÎÜØ]™TÝ]K˜Û\ÜÓ˜[YOIÝØ\›‰ÎßBˆ[ÙHYŠ›Ùš[UÜš]P›ØÚÙY
^ÜØ]™TÝ]K^ÛÛ[Iù/çykf9`g9«h‰ÎÜØ]™TÝ]K˜Û\ÜÓ˜[YOIÝØ\›‰ÎßBˆ[Ù^Âˆž^ØÛÛœÝOXÝ\œ™[]ÛZXÔ›Ùš[J
NØÛÛœÝXOÒ”ÓÓ‹œ\œÙJØØ[ÝÜ˜YÙK™Ù]][J“Ñ’SWÐUÓRP×ÒÑVJJKœØ]™Y]›[ÜØ]™TÝ]K^ÛÛ[XOØ‰ØKœ™]š\Ú[ÛŸxàîÉÝÛ™]È]J
KÓØØ[U[YTÝš[™Ê	Ú˜KR”	ËÚÝ\Ž‰Ì‹YYÚ]	ËZ[]N‰Ì‹YYÚ]	ßJN‰ù/çykf9®"8àoÉßX‰ùb'yfç¹/çykf9bcIÎÜØ]™TÝ]K˜Û\ÜÓ˜[YOXOÉÙÛÛÙ	Î‰ÝØ\›‰ÎßXØ]Ú
ÙJ^ÜØ]™TÝ]K^ÛÛ[Iú) yè®º*£IÎÜØ]™TÝ]K˜Û\ÜÓ˜[YOIÝØ\›‰ÎßBˆBˆBˆYŠ[YÜš]J^ÂˆÛÛœÝ]ZXÚÏ\]ZXÚÔ›Ùš[R[YÜš]TÝ]J
NÚ[YÜš]K^ÛÛ[\]ZXÚË›ÚÏÉù«hùn.	Îœ]ZXÚË›X™[Ú[YÜš]K˜Û\ÜÓ˜[YO\]ZXÚË›ÚÏÉÙÛÛÙ	Î‰ÝØ\›‰ÎÂˆBˆYŠ^ÜÝ]J^ÂˆÛÛœÝ˜]Ï[ØØ[ÝÜ˜YÙK™Ù]][J“Ñ’SWÓTÕÑVÔ•ÒÑVJK]Q]Kœ\œÙJ˜]ß	ÉÊNÂˆYŠS[X™\‹š\Ñš[š]J]
J^Ù^ÜÝ]K^ÛÛ[Iù§*¹/g9¢$	ÎÙ^ÜÝ]K˜Û\ÜÓ˜[YOIÝØ\›‰ÎßBˆ[Ù^ØÛÛœÝ^\ÏSX]™›ÛÜŠ
]K››ÝÊ
KX]
KÎ
NÙ^ÜÝ]K^ÛÛ[Y^\ÏLÉù.â¹¥éIÎ˜	Ù^\ßy¥éybcXÙ^ÜÝ]K˜Û\ÜÓ˜[YOY^\ÏLMÉÙÛÛÙ	Î‰ÝØ\›‰ÎßBˆBˆYŠÛ˜\ÚÝ
^ÂˆÛÛœÝØØ[ÚÏHH[ØØ[ÝÜ˜YÙK™Ù]][JTÕÑÓÓÑÔ“Ñ’SWÒÑVJNÂˆÛÛœÝX]ØZ]™XÛÝ™\žPÚXÚÜÚ[ÛÝ[

NÂˆÛ˜\ÚÝ^ÛÛ[[ØØ[ÚÏÊØ¹«­y/çz+mûï"ùoªy¥éùà®IÛŸX‰Ì¹«­y/çz+mÉÊNŠØ9oªy¥éùà®IÛŸX‰ù§*¹/g9¢$	ÊNÂˆÛ˜\ÚÝ˜Û\ÜÓ˜[YOJØØ[ÚßŒ
OÉÙÛÛÙ	Î‰ÝØ\›‰ÎÂˆBˆYŠ›Û˜XÚÊ^Âˆ›Û˜XÚË˜Û\ÜÓ\ÝÙÙÛJ	ÚY[‰Ë[ØØ[ÝÜ˜YÙK™Ù]][J‘WÒSTÔ•Ô“Ñ’SWÒÑVJJNÂˆBˆYŠX[X[›Û˜XÚÊ[X[X[›Û˜XÚË˜Û\ÜÓ\ÝÙÙÛJ	ÚY[‰Ë[ØØ[ÝÜ˜YÙK™Ù]][J‘WÓPS•PSÔ‘TÕÔ‘WÔ“Ñ’SWÒÑVJJNÂˆYŠÛÜœ\^Ü
XÛÜœ\^Ü˜Û\ÜÓ\ÝÙÙÛJ	ÚY[‰Ë[ØØ[ÝÜ˜YÙK™Ù]][JÓÔ”•TÔ“Ñ’SWÒÑVJJNÂˆYŠ\œÚ\Ý
^ÂˆYŠ˜]šYØ]Ü‹œÝÜ˜YÙOËœ\œÚ\ÝY
^Âˆž^ØÛÛœÝÜ˜[YX]ØZ]˜]šYØ]Ü‹œÝÜ˜YÙKœ\œÚ\ÝY

NÜ\œÚ\Ý^ÛÛ[YÜ˜[YÉù¬.9í¦¹c%¹®"8àoÉÎ‰ùª&y®¥¹/çz+mÉÎÜ\œÚ\Ý˜Û\ÜÓ˜[YOYÜ˜[YÉÙÛÛÙ	Î‰ÝØ\›‰ÎÚYŠ\œÚ\ÝŠ\\œÚ\Ý‹˜Û\ÜÓ\ÝÙÙÛJ	ÚY[‰ËÜ˜[Y[˜]šYØ]Ü‹œÝÜ˜YÙOËœ\œÚ\Ý
_XØ]Ú
ÙJ^Ü\œÚ\Ý^ÛÛ[Iùè®º*£xàiøàcxào¸àføà¤øàiøàeøàgÉßBˆY[Ù^Ü\œÚ\Ý^ÛÛ[Iøàdøàk¹ä¬9h øàiøàkùcå¹o¥ù.#ycëÉÎÚYŠ\œÚ\ÝŠ\\œÚ\Ý‹˜Û\ÜÓ\Ý˜Y
	ÚY[‰Ê_BˆBˆYŠÝÜ˜YÙI‰›˜]šYØ]Ü‹œÝÜ˜YÙOË™\Ý[X]J^Âˆž^ÂˆÛÛœÝX]ØZ]˜]šYØ]Ü‹œÝÜ˜YÙK™\Ý[X]J
K\ØYÙO^\ØYÙ_][ÝO^œ][Ý_Ý\][ÝOÓX]›Z[ŠL\ØYÙKÜ][ÝJŒL
NŒÂˆÝÜ˜YÙK^ÛÛ[X	Øž]\Õ^
\ØYÙJ_H9/oùå*È	Øž]\Õ^
][ÝJ_XÂˆÝÜ˜YÙK˜Û\ÜÓ˜[YO\ÝNÉÝØ\›‰Î‰ÙÛÛÙ	ÎÚYŠ˜\ŠX˜\‹œÝ[KÚYX	ÜÝIXÂˆYŠÝNL	‰ˆ\ÝÜ˜YÙT™\ÜÝ\™S›ÝXÙTÚÝÛŠ^ÜÝÜ˜YÙT™\ÜÝ\™S›ÝXÙTÚÝÛ]YNÜÙ][Y[Ý]


OOœÚÝÐ\›ÝXÙOËŠ	Ù\œ›Ü‰Ë	ù/çykf:h&9gçøàc9l$xàj¸àcøàj¸àhøài¸àa8ào¸àfIË	ùki¹ïä¸àáøàï8à¯ù§+9/døà¤¹a*¹ab8àfxà¢øàgøà xà z`&¹n.8àkºemù§'ùoªy¥éùà®xàkº/ïyb¨8à¤¹¢¤xàb8ào¸àfxà ¹oíxàk¸àgøà yki¹ïä¸àáøàï8à¯øà¤¹¦î8àcyaî¸àeøài¸àcøàh8àexàa8à ‰Ë	øàáøàï8à¯øà¤¹¦î8àcyaî¸àfIË^ÜX\›š[™Ñ]JK
_BˆXØ]Ú
J^ÜÝÜ˜YÙK^ÛÛ[Iùcå¹o¥øàiøàcxào¸àføà¤øàiøàeøàgÉßBˆY[ÙHYŠÝÜ˜YÙJ^ÜÝÜ˜YÙK^ÛÛ[Iøàdøàk¹ä¬9h øàiøàkùcå¹o¥ù.#ycëÉßBŸB‚™[˜Ý[ÛˆÝX›RœÛÛŠ˜[YJ^ÂˆYŠ˜[YOOO][™Yš[™Y\[Ùˆ˜[YOOOIÙ[˜Ý[Û‰ß\[Ùˆ˜[YOOOIÜÞ[X›Û	Ê\™]\›ˆ[™Yš[™YÂˆYŠ˜[YOOO[[\[Ùˆ˜[YHOOIÛØš™XÝ	Ê\™]\›ˆ”ÓÓ‹œÝš[™ÚYžJ˜[YJNÂˆYŠ\œ˜^Kš\Ð\œ˜^J˜[YJJ\™]\›ˆ	ÖÉÊÝ˜[YK›X\
OœÝX›RœÛÛŠŠOÏÉÛ[	ÊKš›Ú[Š	Ë	ÊJÉ×IÎÂˆÛÛœÝ\ÏV×NÂˆØš™XÝšÙ^\Ê˜[YJKœÛÜ

K™›Ü‘XXÚ
ÏOžÂˆÛÛœÝ[˜ÛÙY\ÝX›RœÛÛŠ˜[YVÚ×JNÂˆYŠ[˜ÛÙYOO][™Yš[™Y
\\Ëœ\Ú
”ÓÓ‹œÝš[™ÚYžJÊJÉÎ‰ÊÙ[˜ÛÙY
NÂˆJNÂˆ™]\›ˆ	ÞÉÊÜ\Ëš›Ú[Š	Ë	ÊJÉßIÎÂŸB™[˜Ý[Ûˆ›ŒXLÌŠ^
^Âˆ]LLXÎYÍNÂˆ›ÜŠ]OLÚO^›[™ÝÚJÊÊ^Âˆ]^˜Ú\ÛÙP]
JNÂˆSX]š[][
LNLÊNÂˆBˆ™]\›ˆ
Œ
KÔÝš[™ÊMŠKœYÝ\
	Ì	ÊNÂŸB™[˜Ý[Ûˆ›Ùš[R[YÜš]PÚXÚÜÝ[J
^Âˆ™]\›ˆ›ŒXLÌŽ‰Ù›ŒXLÌŠÝX›RœÛÛŠ›Ü›X[^™T›Ùš[Q]J
JJ_XÂŸB‚™[˜Ý[ÛˆÜ[”™XÛÝ™\žQŠ
^ÂˆYŠ\[Ùˆ[™^YOOIÝ[™Yš[™Y	Ê\™]\›ˆ›ÛZ\ÙKœ™Z™XÝ
™]È\œ›ÜŠ	Ò[™^Yˆ[œÝ\ÜY	ÊJNÂˆ™]\›ˆ™]È›ÛZ\ÙJ
™\ÛÛ™K™Z™XÝ
OOžÂˆÛÛœÝ™\OZ[™^Y‹›Ü[Š‘PÓÕ‘T–WÑ—ÓSQK‘PÓÕ‘T–WÑ—Õ‘T”ÒSÓŠNÂˆ™\K›Û\Ü˜Y[™YYYJ
OOžÂˆÛÛœÝ\™\Kœ™\Ý[ÂˆYŠY‹›Øš™XÝÝÜ™S˜[Y\Ë˜ÛÛZ[œÊ‘PÓÕ‘T–WÑ—ÔÕÔ‘JJY‹˜Ü™X]SØš™XÝÝÜ™J‘PÓÕ‘T–WÑ—ÔÕÔ‘KÚÙ^T]‰ÚY	ßJNÂˆNÂˆ™\K›ÛœÝXØÙ\ÜÏJ
OOœ™\ÛÛ™J™\Kœ™\Ý[
NÂˆ™\K›Û™\œ›ÜJ
OOœ™Z™XÝ
™\K™\œ›ÜŸ™]È\œ›ÜŠ	Ò[™^YˆÜ[ˆ˜Z[Y	ÊJNÂˆJNÂŸB™[˜Ý[ÛˆY”™\]Y\Ý
™\J^Âˆ™]\›ˆ™]È›ÛZ\ÙJ
™\ÛÛ™K™Z™XÝ
OOžÜ™\K›ÛœÝXØÙ\ÜÏJ
OOœ™\ÛÛ™J™\Kœ™\Ý[
NÜ™\K›Û™\œ›ÜJ
OOœ™Z™XÝ
™\K™\œ›ÜŸ™]È\œ›ÜŠ	Ò[™^Yˆ™\]Y\Ý˜Z[Y	ÊJNßJNÂŸB˜\Þ[˜È[˜Ý[Ûˆ™XÛÝ™\žTÛ˜\ÚÝÊ
^ÂˆÛÛœÝX]ØZ]Ü[”™XÛÝ™\žQŠ
NÂˆž^ÂˆÛÛœÝY‹˜[œØXÝ[ÛŠ‘PÓÕ‘T–WÑ—ÔÕÔ‘K	Ü™XYÛ›IÊNÂˆÛÛœÝ›ÝÜÏX]ØZ]Y”™\]Y\Ý
›Øš™XÝÝÜ™J‘PÓÕ‘T–WÑ—ÔÕÔ‘JK™Ù][

JNÂˆ™]\›ˆ
›ÝÜß×JKœÛÜ

KŠOOŠ‹šY
KJKšY
JNÂˆYš[˜[^Ù‹˜ÛÜÙJ
NßBŸB˜\Þ[˜È[˜Ý[Ûˆ™XÛÝ™\žPÚXÚÜÚ[ÛÝ[

^ÂˆYŠ\[Ùˆ[™^YOOIÝ[™Yš[™Y	Ê\™]\›ˆÂˆž^Ü™]\›ˆ
]ØZ]™XÛÝ™\žTÛ˜\ÚÝÊ
JK›[™ÝXØ]Ú
J^Ü™]\›ˆBŸB˜\Þ[˜È[˜Ý[ÛˆÝÜ˜YÙT™\ÜÝ\™T˜][Ê
^ÂˆYŠ[˜]šYØ]Ü‹œÝÜ˜YÙOË™\Ý[X]J\™]\›ˆÂˆž^ØÛÛœÝX]ØZ]˜]šYØ]Ü‹œÝÜ˜YÙK™\Ý[X]J
KO^\ØYÙ_O^œ][Ý_Ü™]\›ˆOÝKÜNŒXØ]Ú
ÙJ^Ü™]\›ˆBŸB˜\Þ[˜È[˜Ý[ÛˆÜš]T™XÛÝ™\žPÚXÚÜÚ[
\›Ùš[K™X\ÛÛIØ]]ÜØ]™IË›Ü˜ÙOY˜[ÙJ^ÂˆYŠ\[Ùˆ[™^YOOIÝ[™Yš[™Y	ß›Ùš[UÜš]P›ØÚÙY›Ùš[PÛÛ™›XÝ›ØÚÙY
\™]\›ˆ˜[ÙNÂˆÛÛœÝ›ÝÏQ]K››ÝÊ
NÂˆYŠY›Ü˜ÙI‰››ÝË\™XÛÝ™\žPÚXÚÜÚ[\Ý]‘PÓÕ‘T–WÐÒPÒÔÒS•ÒS•T•S
\™]\›ˆ˜[ÙNÂˆYŠY›Ü˜ÙI‰Š]ØZ]ÝÜ˜YÙT™\ÜÝ\™T˜][Ê
JOLŽL
\™]\›ˆ˜[ÙNÂˆ™XÛÝ™\žPÚXÚÜÚ[\Ý][›ÝÎÂˆÛÛœÝ^[ØY[XZÙP˜XÚÝ\^[ØY

NÂˆÛÛœÝX]ØZ]Ü[”™XÛÝ™\žQŠ
NÂˆž^Âˆ]ØZ]™]È›ÛZ\ÙJ
™\ÛÛ™K™Z™XÝ
OOžÂˆÛÛœÝY‹˜[œØXÝ[ÛŠ‘PÓÕ‘T–WÑ—ÔÕÔ‘K	Ü™XYÜš]IÊNÂˆÛÛœÝÝÜ™O]›Øš™XÝÝÜ™J‘PÓÕ‘T–WÑ—ÔÕÔ‘JNÂˆÝÜ™Kœ]
ÚY››ÝËÜ™X]Y]›™]È]J›ÝÊKÒTÓÔÝš[™Ê
K™X\ÛÛ‹\™\œÚ[ÛŽTÕ‘T”ÒSÓ‹›Ùš[TØÚ[XU™\œÚ[ÛŽ”“Ñ’SWÔÐÒSPWÕ‘T”ÒSÓ‹^[ØYJNÂˆ›Û˜ÛÛ\]O\™\ÛÛ™NÝ›Û™\œ›ÜJ
OOœ™Z™XÝ
™\œ›ÜŸ™]È\œ›ÜŠ	Ò[™^YˆÜš]H˜Z[Y	ÊJNÝ›Û˜X›ÜJ
OOœ™Z™XÝ
™\œ›ÜŸ™]È\œ›ÜŠ	Ò[™^YˆÜš]HX›ÜY	ÊJNÂˆJNÂˆÛÛœÝ›ÝÜÏX]ØZ]™XÛÝ™\žTÛ˜\ÚÝÊ
NÂˆYŠ›ÝÜË›[™Ý”‘PÓÕ‘T–WÓPVÔÓTÒÕÊ^ÂˆÛÛœÝŒX]ØZ]Ü[”™XÛÝ™\žQŠ
NÂˆž^Âˆ]ØZ]™]È›ÛZ\ÙJ
™\ÛÛ™K™Z™XÝ
OOžÂˆÛÛœÝYŒ‹˜[œØXÝ[ÛŠ‘PÓÕ‘T–WÑ—ÔÕÔ‘K	Ü™XYÜš]IÊKÝÜ™O]›Øš™XÝÝÜ™J‘PÓÕ‘T–WÑ—ÔÕÔ‘JNÂˆ›ÝÜËœÛXÙJ‘PÓÕ‘T–WÓPVÔÓTÒÕÊK™›Ü‘XXÚ
OœÝÜ™K™[]JšY
JNÂˆ›Û˜ÛÛ\]O\™\ÛÛ™NÝ›Û™\œ›ÜJ
OOœ™Z™XÝ
™\œ›ÜŸ™]È\œ›ÜŠ	Ò[™^Yˆš[H˜Z[Y	ÊJNÂˆJNÂˆYš[˜[^ÙŒ‹˜ÛÜÙJ
NßBˆBˆ™]\›ˆYNÂˆYš[˜[^Ù‹˜ÛÜÙJ
NßBŸB™[˜Ý[Ûˆ]Y]YT™XÛÝ™\žPÚXÚÜÚ[
™X\ÛÛIØ]]ÜØ]™IË›Ü˜ÙOY˜[ÙJ^ÂˆYŠ›Ùš[UÜš]P›ØÚÙY›Ùš[PÛÛ™›XÝ›ØÚÙY\[Ùˆ[™^YOOIÝ[™Yš[™Y	Ê\™]\›ŽÂˆÛÛœÝ›ÝÏQ]K››ÝÊ
NÂˆYŠY›Ü˜ÙI‰››ÝË\™XÛÝ™\žPÚXÚÜÚ[\Ý]‘PÓÕ‘T–WÐÒPÒÔÒS•ÒS•T•S
\™]\›ŽÂˆÙ][Y[Ý]


OOÜš]T™XÛÝ™\žPÚXÚÜÚ[
›Ùš[K™X\ÛÛ‹›Ü˜ÙJK[ŠÚÏOžÚYŠÚÊ\™Yœ™\ÚØRX[ËŠ
NßJK˜Ø]Ú
OO˜ÛÛœÛÛKØ\›Š	Ô™XÛÝ™\žHÚXÚÜÚ[˜Z[Y	ËJJK
NÂŸB˜\Þ[˜È[˜Ý[Ûˆ™XÛÝ™\“]\Ý[™^YÚXÚÜÚ[

^ÂˆYŠ\[Ùˆ[™^YOOIÝ[™Yš[™Y	Ê\™]\›ˆ˜[ÙNÂˆ]›ÝÜÏV×NÂˆž^Ü›ÝÜÏX]ØZ]™XÛÝ™\žTÛ˜\ÚÝÊ
_XØ]Ú
J^Ü™]\›ˆ˜[Ù_Bˆ›ÜŠÛÛœÝ›ÝÈÙˆ›ÝÜÊ^Âˆž^ÂˆÛÛœÝXÛÙYYXÛÙP˜XÚÝ\^[ØY
›ÝËœ^[ØY
NÂˆ›Ùš[UÜš]P›ØÚÙYY˜[ÙNÂˆ›Ùš[T™XÛÝ™\žS™YYÒ[™^YY˜[ÙNÂˆ›Ùš[O\Ý[\›Ùš[Q›Ü”Ø]™JXÛÙYœ›Ùš[JNÂˆÛÛœÝ™\Ý[]Üš]PÝ\œ™[›Ùš[J›Ùš[KÜ™\Ù\™T™]š[Ý\Î™˜[ÙKÚÚ\ÛÛ™›XÝÚXÚÎY_JNÂˆ›Ùš[O\™\Ý[œ›Ùš[NÜ™[Y[X™\ÛÛ[Z]Y›Ùš[J›Ùš[JNÂˆØØ[ÝÜ˜YÙKœÙ]][JTÕÑÓÓÑÔ“Ñ’SWÒÑVK™\Ý[œ˜]ÊNÂˆØØ[ÝÜ˜YÙKœÙ]][JTÕÑÓÓÑÐÒPÒÔÕSWÒÑVK™\Ý[˜ÚXÚÜÝ[JNÂˆ›Ùš[T™XÛÝ™\žTÛÝ\˜ÙOIÚ[™^Y‰ÎÂˆ™]\›ˆYNÂˆXØ]Ú
J^ØÛÛœÛÛKØ\›Š	ÔÚÚ\Y[˜[Y™XÛÝ™\žHÚXÚÜÚ[	ËJ_BˆBˆ™]\›ˆ˜[ÙNÂŸB™[˜Ý[ÛˆXZÙP˜XÚÝ\^[ØY
\›Ùš[J^ÂˆÛÛœÝ›Ü›X[^™Y[›Ü›X[^™T›Ùš[Q]J
NÂˆ™]\›ˆÂˆ›Ü›X]‰Ù™\]Y\ÝX˜XÚÝ\]Œ‰Ëˆ\™\œÚ[ÛŽTÕ‘T”ÒSÓ‹ˆ›Ùš[TØÚ[XU™\œÚ[ÛŽ”“Ñ’SWÔÐÒSPWÕ‘T”ÒSÓ‹ˆ^ÜY]›™]È]J
KÒTÓÔÝš[™Ê
KˆÚXÚÜÝ[Nœ›Ùš[R[YÜš]PÚXÚÜÝ[J›Ü›X[^™Y
Kˆ›Ùš[N››Ü›X[^™YˆNÂŸB™[˜Ý[Ûˆ˜[Y]R[\ÜY›Ùš[JØ[™Y]J^Âˆ™]\›ˆ\ÔZ[“Øš™XÝ
Ø[™Y]JI‰Š\ÔZ[“Øš™XÝ
Ø[™Y]KœÚÚ[Ê_[X™\‹š\Ñš[š]J[X™\ŠØ[™Y]Kž
J_\ÔZ[“Øš™XÝ
Ø[™Y]K›\ÜÛÛ”›ÙÜ™\ÜÊJNÂŸB™[˜Ý[ÛˆXÛÙP˜XÚÝ\^[ØY
\œÙY
^ÂˆYŠZ\ÔZ[“Øš™XÝ
\œÙY
J]›ÝÈ™]È\œ›ÜŠ	øàä8ààøà«øà¨¸ààøàåøàk¹oh¹o#øàc9. :!í8àeøào¸àføà¤ÉÊNÂˆÛÛœÝØ[™Y]OZ\ÔZ[“Øš™XÝ
\œÙYœ›Ùš[JOÜ\œÙYœ›Ùš[Nœ\œÙYÂˆYŠ]˜[Y]R[\ÜY›Ùš[JØ[™Y]JJ]›ÝÈ™]È\œ›ÜŠ	ùki¹ïä¸àáøàï8à¯øàj8àeøàiº*£z+f8àiøàcxào¸àføà¤ÉÊNÂ‚ˆÛÛœÝØÚ[XO[›Û“™YØ]]™R[
\œÙYœ›Ùš[TØÚ[XU™\œÚ[ÛÏØØ[™Y]Kœ›Ùš[TØÚ[XU™\œÚ[ÛÏÌKJNÂˆYŠØÚ[XO”“Ñ’SWÔÐÒSPWÕ‘T”ÒSÓŠ]›ÝÈ™]È\œ›ÜŠ	øàdøàk¸àä8ààøà«øà¨¸ààøàåøàkøà xà¢8à¢¹¥¬8àeøàa‘HUQTÕ8àiù/g9¢$8àexà£8ài¸àa8ào¸àfIÊNÂ‚ˆYŠ\œÙY™›Ü›X]OOIÙ™\]Y\ÝX˜XÚÝ\]Œ‰Ê^ÂˆYŠ\[Ùˆ\œÙY˜ÚXÚÜÝ[HOOIÜÝš[™ÉÊ]›ÝÈ™]È\œ›ÜŠ	ù¥m9d"9 )ù áyh,xàc8à`¸à¢¸ào¸àføà¤ÉÊNÂˆÛÛœÝXÝX[\ØÚ[XOOOLÏÜ›Ùš[R[YÜš]PÚXÚÜÝ[UŒÊØ[™Y]JNœØÚ[XOOOMÜ›Ùš[R[YÜš]PÚXÚÜÝ[U
Ø[™Y]JNœ›Ùš[R[YÜš]PÚXÚÜÝ[JØ[™Y]JNÂˆYŠXÝX[OO\\œÙY˜ÚXÚÜÝ[J]›ÝÈ™]È\œ›ÜŠ	ù¥m9d"9 )øààxà©øààøà«øàjùi,y¥eøàeøào¸àeøàgøà ¸àåxà¨xà©8àêøàc9è-9¤#xào¸àgøàkùi"y¦í8àexà£8ài¸àa8ào¸àfIÊNÂˆY[ÙHYŠ\œÙY™›Ü›X]	‰ˆ\œÙY™›Ü›X]OOIÙ™\]Y\ÝX˜XÚÝ\]ŒIÊ^Âˆ›ÝÈ™]È\œ›ÜŠ	ù§*¹kï¹oç8àk¸àä8ààøà«øà¨¸ààøàåùoh¹o#øàiøàfIÊNÂˆB‚ˆ™]\›ˆÂˆ›Ùš[N››Ü›X[^™T›Ùš[Q]JØ[™Y]JKˆÛÝ\˜ÙQ›Ü›X]œ\œÙY™›Ü›X]	ÛYØXÞK\›Ùš[IËˆ\™\œÚ[ÛŽ\[Ùˆ\œÙY˜\™\œÚ[ÛOOIÜÝš[™ÉÏÜ\œÙY˜\™\œÚ[ÛŽ‰ù¥éùoh¹o#ÉËˆ^ÜY]\[Ùˆ\œÙY™^ÜY]OOIÜÝš[™ÉÏÜ\œÙY™^ÜY]›[ˆÛÝ\˜ÙTØÚ[XNœØÚ[XBˆNÂŸB™[˜Ý[Ûˆ˜XÚÝ\Ý[[X\žJXÛÙY
^ÂˆÛÛœÝYXÛÙYœ›Ùš[NÂˆÛÛœÝ\ÜÛÛ‘Û™OSØš™XÝ˜[Y\Ê›\ÜÛÛ”›ÙÜ™\ÜßßJK™š[\ŠO“[X™\Š
OLL
K›[™ÝÂˆÛÛœÝ‘Û™OSØš™XÝ˜[Y\Ê˜”›ÙÜ™\ÜßßJK™š[\ŠO“[X™\Š
OLL
K›[™ÝÂˆÛÛœÝÙXÑÛ™OSØš™XÝ˜[Y\ÊœÙXÝ\š]P”›ÙÜ™\ÜßßJK™š[\ŠO“[X™\Š
OLL
K›[™ÝÂˆÛÛœÝÚ[YXÛÙY™^ÜY]Û™]È]JXÛÙY™^ÜY]
KÓØØ[TÝš[™Ê	Ú˜KR”	ÊN‰ù¥éy¦`¹ áyh,xàj¸àeÉÎÂˆ™]\›ˆ9/g9¢$9a`ûï&‰ÙXÛÙY˜\™\œÚ[ÛŸW¹/g9¢$9¥éy¦`»ï&‰ÝÚ[ŸW–;ï&‰ÜžÓØØ[TÝš[™Ê	Ú˜KR”	Ê_W¹éäyæëyk£9.¡»ï&‰Û\ÜÛÛ‘Û™_xàá¸àï8àç—¹éäyæë»ï&¸àâ8àë8àï8à®IØ‘Û™_xàîøà®øà«xàéxàê¸àá¸à¨ÉÜÙXÑÛ™_XÂŸB‚™[˜Ý[Ûˆ™XÛÝ™\žT›Ùš[SY]šXÜÊ
^ÂˆÛÛœÝTÝ]Ï\ØY™SØš™XÝ
ËœTÝ]ÊNÂˆÛÛœÝ][\YSØš™XÝ˜[Y\ÊTÝ]ÊK™š[\ŠO››Û“™YØ]]™R[
Ë˜][\Ë
OŒ
K›[™ÝÂˆÛÛœÝ[œÝÙ\™YSØš™XÝ˜[Y\ÊTÝ]ÊKœ™YXÙJ
‹
OO›ŠÛ›Û“™YØ]]™R[
Ë˜][\Ë
K
NÂˆÛÛœÝ\ÜÛÛ‘Û™OSØš™XÝ˜[Y\ÊØY™SØš™XÝ
Ë›\ÜÛÛ”›ÙÜ™\ÜÊJK™š[\ŠO“[X™\Š
OLL
K›[™ÝÂˆÛÛœÝ‘Û™OSØš™XÝ˜[Y\ÊØY™SØš™XÝ
Ë˜”›ÙÜ™\ÜÊJK™š[\ŠO“[X™\Š
OLL
K›[™ÝÂˆÛÛœÝÙXÑÛ™OSØš™XÝ˜[Y\ÊØY™SØš™XÝ
ËœÙXÝ\š]P”›ÙÜ™\ÜÊJK™š[\ŠO“[X™\Š
OLL
K›[™ÝÂˆ™]\›ˆÞ››Û“™YØ]]™R[
Ëž
K\ÜÛÛ‘Û™K‘Û™KÙXÑÛ™K][\Y[œÝÙ\™YNÂŸB™[˜Ý[Ûˆ™XÛÝ™\žSY]šXÜÕ^

^ÂˆÛÛœÝO\™XÛÝ™\žT›Ùš[SY]šXÜÊ
NÂˆ™]\›ˆ	ÛKžÓØØ[TÝš[™Ê	Ú˜KR”	Ê_xàîùéäyæëyk£9.¡ˆ	ÛK›\ÜÛÛ‘Û™_xàîù¯%9ïä¹®"8àoÈ	ÛK˜][\Yyecøàîùéäyæëˆ	ÛK˜‘Û™_KÉÛKœÙXÑÛ™_XÂŸB™[˜Ý[Ûˆ™XÛÝ™\žT™X\ÛÛ•^
™X\ÛÛIÉÊ^ÂˆYŠ™X\ÛÛOOIÛX[X[	Ê\™]\›ˆ	ù¢bùbåy/g9¢$	ÎÂˆYŠ™X\ÛÛOOIØ]]ÜØ]™IÊ\™]\›ˆ	ú!ê¹båy/çz+mÉÎÂˆYŠ™X\ÛÛOOIÜ™K]\]IÊ\™]\›ˆ	øà¨¸àåøàê¹¦í9¥¬9bcIÎÂˆYŠ™X\ÛÛOOIÜ™KZ[\Ü	Ê\™]\›ˆ	øàä8ààøà«øà¨¸ààøàåú*«z/¯9bcIÎÂˆYŠ™X\ÛÛOOIÚ[\Ü	Ê\™]\›ˆ	øàä8ààøà«øà¨¸ààøàåú*«z/¯9o£	ÎÂˆYŠ™X\ÛÛOOIÜ™KZ[\Ü\™\ÝÜ™IÊ\™]\›ˆ	ú*«z/¯9bcxàáøàï8à¯øàn8àk¹oªyn,9o£	ÎÂˆYŠ™X\ÛÛOOIÜ™K[X[X[\™\ÝÜ™IÊ\™]\›ˆ	ù¢bùbåyoªya`ùbcIÎÂˆYŠ™X\ÛÛOOIÛX[X[\™\ÝÜ™IÊ\™]\›ˆ	ù¢bùbåyoªya`ùo£	ÎÂˆYŠ™X\ÛÛOOIÛX[X[\™\ÝÜ™K][™ÉÊ\™]\›ˆ	ù¢bùbåyoªya`øàk¹cå¹­¢9o£	ÎÂˆYŠÝš[™Ê™X\ÛÛŠKœÝ\ÕÚ]
	Ý™\œÚ[Û‹IÊJ\™]\›ˆ	ÔÝš[™Ê™X\ÛÛŠKœÛXÙJ
_yb'yfç˜Âˆ™]\›ˆ™X\ÛÛŸ	ú!ê¹båy/çz+mÉÎÂŸB™[˜Ý[Ûˆ™XÛÝ™\žPØ[™Y]Q]U^
˜[YJ^ÂˆÛÛœÝQ]Kœ\œÙJ˜[Y_	ÉÊNÂˆ™]\›ˆ[X™\‹š\Ñš[š]J
OÛ™]È]J
KÓØØ[TÝš[™Ê	Ú˜KR”	ÊN‰ù¥éy¦`¹.#y¦#‰ÎÂŸB™[˜Ý[ÛˆÝÛ›ØY^š[J˜[YK^\OIØ\XØ][Û‹ÚœÛÛ‰Ê^ÂˆÛÛœÝ›Ø[™]È›ØŠÝ^KÝ\_JNÂˆÛÛœÝOYØÝ[Y[˜Ü™X]Q[[Y[
	ØIÊNØKš™YUT“˜Ü™X]SØš™XÝT“
›ØŠNØK™ÝÛ›ØY[˜[YNÙØÝ[Y[˜›ÙK˜\[™Ú[
JNØK˜ÛXÚÊ
NØKœ™[[Ý™J
NÜÙ][Y[Ý]


OO•T“œ™]›ÚÙSØš™XÝT“
Kš™YŠKL
NÂŸB˜\Þ[˜È[˜Ý[Ûˆ™XÛÝ™\žPØ[™Y]\Ê
^ÂˆÛÛœÝ][\ÏV×NÂˆÛÛœÝ\Ý˜]Ï[ØØ[ÝÜ˜YÙK™Ù]][JTÕÑÓÓÑÔ“Ñ’SWÒÑVJNÂˆYŠ\Ý˜]Ê^Âˆž^ÂˆÛÛœÝÚXÚÙY]˜[Y˜]ÕÚ]ÚXÚÜÝ[J\Ý˜]ËØØ[ÝÜ˜YÙK™Ù]][JTÕÑÓÓÑÐÒPÒÔÕSWÒÑVJ_[
NÂˆ][\Ëœ\Ú
ÚÚ[™‰Û\ÝYÛÛÙ	ËY‰Û\ÝYÛÛÙ	ËX™[‰ù. 9.%¹.èùbcxàk¹«hùn.8àáøàï8à¯ÉËÜ™X]Y]˜ÚXÚÙYœ›Ùš[Kœ›Ùš[SY]OË\]Y][™X\ÛÛŽ‰ù. 9.%¹.èùbcIË›Ùš[N˜ÚXÚÙYœ›Ùš[K˜[YY_JNÂˆXØ]Ú
J^Ú][\Ëœ\Ú
ÚÚ[™‰Û\ÝYÛÛÙ	ËY‰Û\ÝYÛÛÙ	ËX™[‰ù. 9.%¹.èùbcxàk¸àáøàï8à¯ÉËÜ™X]Y]›[™X\ÛÛŽ‰ù. 9.%¹.èùbcIË˜[Y™˜[ÙK\œ›ÜŽ™OË›Y\ÜØYÙ_Ýš[™ÊJ_J_BˆBˆYŠ\[Ùˆ[™^YˆOOIÝ[™Yš[™Y	Ê^Âˆ]›ÝÜÏV×NÝž^Ü›ÝÜÏX]ØZ]™XÛÝ™\žTÛ˜\ÚÝÊ
_XØ]Ú
J^Ü›ÝÜÏV×_Bˆ›ÜŠÛÛœÝ›ÝÈÙˆ›ÝÜÊ^Âˆž^ÂˆÛÛœÝXÛÙYYXÛÙP˜XÚÝ\^[ØY
›ÝËœ^[ØY
NÂˆ][\Ëœ\Ú
ÚÚ[™‰ÚY‰ËYœ›ÝËšYX™[œ™XÛÝ™\žT™X\ÛÛ•^
›ÝËœ™X\ÛÛŠKÜ™X]Y]œ›ÝË˜Ü™X]Y]XÛÙY™^ÜY]™X\ÛÛŽœ›ÝËœ™X\ÛÛ‹›Ùš[N™XÛÙYœ›Ùš[K˜[YY_JNÂˆXØ]Ú
J^Ú][\Ëœ\Ú
ÚÚ[™‰ÚY‰ËYœ›ÝËšYX™[œ™XÛÝ™\žT™X\ÛÛ•^
›ÝËœ™X\ÛÛŠKÜ™X]Y]œ›ÝË˜Ü™X]Y]™X\ÛÛŽœ›ÝËœ™X\ÛÛ‹˜[Y™˜[ÙK\œ›ÜŽ™OË›Y\ÜØYÙ_Ýš[™ÊJ_J_BˆBˆBˆ™]\›ˆ][\ÎÂŸB˜\Þ[˜È[˜Ý[ÛˆÙ]™XÛÝ™\žPØ[™Y]JÚ[™Y
^ÂˆYŠÚ[™OOIÛ\ÝYÛÛÙ	Ê^ÂˆÛÛœÝ˜]Ï[ØØ[ÝÜ˜YÙK™Ù]][JTÕÑÓÓÑÔ“Ñ’SWÒÑVJNÚYŠ\˜]Ê]›ÝÈ™]È\œ›ÜŠ	ù. 9.%¹.èùbcxàk¸àáøàï8à¯øàc8à`¸à¢¸ào¸àføà¤ÉÊNÂˆ™]\›ˆ˜[Y˜]ÕÚ]ÚXÚÜÝ[J˜]ËØØ[ÝÜ˜YÙK™Ù]][JTÕÑÓÓÑÐÒPÒÔÕSWÒÑVJ_[
Kœ›Ùš[NÂˆBˆÛÛœÝ›ÝÜÏX]ØZ]™XÛÝ™\žTÛ˜\ÚÝÊ
NÂˆÛÛœÝ›ÝÏ\›ÝÜË™š[™
O”Ýš[™ÊšY
OOOTÝš[™ÊY
JNÚYŠ\›ÝÊ]›ÝÈ™]È\œ›ÜŠ	ùoªy¥éùà®xàc:)¢øài8àbøà¢¸ào¸àføà¤ÉÊNÂˆ™]\›ˆXÛÙP˜XÚÝ\^[ØY
›ÝËœ^[ØY
Kœ›Ùš[NÂŸB˜\Þ[˜È[˜Ý[Ûˆ™[™\”™XÛÝ™\žPÙ[\Š
^ÂˆÛÛœÝ\ÝYØÝ[Y[™Ù][[Y[žRY
	Ü™XÛÝ™\žTÚ[\Ý	ÊKÝ]\ÏYØÝ[Y[™Ù][[Y[žRY
	Ü™XÛÝ™\žPÙ[\”Ý]\ÉÊK[™ÏYØÝ[Y[™Ù][[Y[žRY
	Ü™\ÝÜ™T™SX[X[	ÊKÛÜœ\YØÝ[Y[™Ù][[Y[žRY
	Ù^ÜÛÜœ\›Ùš[IÊNÂˆYŠ[\Ý\Ý]\Ê\™]\›ŽÂˆYŠ[™Ê][™Ë˜Û\ÜÓ\ÝÙÙÛJ	ÚY[‰Ë[ØØ[ÝÜ˜YÙK™Ù]][J‘WÓPS•PSÔ‘TÕÔ‘WÔ“Ñ’SWÒÑVJJNÂˆYŠÛÜœ\
XÛÜœ\˜Û\ÜÓ\ÝÙÙÛJ	ÚY[‰Ë[ØØ[ÝÜ˜YÙK™Ù]][JÓÔ”•TÔ“Ñ’SWÒÑVJJNÂˆ\Ýœ™\XÙPÚ[™[Š
NÂˆYŠ›Ùš[T™XÛÝ™\žTÛÝ\˜ÙOOOIÙ]\™IÊ^ÂˆÝ]\Ë^ÛÛ[Iù/çykf8àáøàï8à¯øàc8àdøàk¹å.úgh¸à¢8à¢¹¥¬8àeøàa9oh¹o#øàiøàfxà ¹oªy¥éù¤ãy/g8àkøàføàf¸à yab8àjÑ‘HUQTÕ8à¤¹¦í9¥¬8àeøài¸àcøàh8àexàa8à ‰ÎÜÝ]\Ë˜Û\ÜÓ˜[YOIÜ™XÛÝ™\žKXÙ[\‹\Ý]\ÈØ\›‰ÎÜ™]\›ŽÂˆBˆÛÛœÝ][\ÏX]ØZ]™XÛÝ™\žPØ[™Y]\Ê
NÂˆÛÛœÝ˜[YZ][\Ë™š[\ŠOž˜[Y
NÂˆÛÛœÝÝ\œ™[ÚXÚÜÝ[O\›Ùš[R[YÜš]PÚXÚÜÝ[J›Ùš[JNÂˆÛÛœÝ™\ÝÜ˜X›O]˜[Y™š[\ŠOœ›Ùš[R[YÜš]PÚXÚÜÝ[Jœ›Ùš[JHOOXÝ\œ™[ÚXÚÜÝ[JNÂˆÝ]\Ë^ÛÛ[\™\ÝÜ˜X›K›[™ÝØ9ãï¹g*;ï&‰Ü™XÛÝ™\žSY]šXÜÕ^
›Ùš[J_xà ¹¢.øàføà¢ú`c¹c®øàáøàï8à¯øàc	Ü™\ÝÜ˜X›K›[™Ýy.í¸à`¸à¢¸ào¸àfxà º`&¹n.9¦`¸àkùoªya`øàfxà¢ùoáz) xàkøà`¸à¢¸ào¸àføà¤øà ˜‰ùãï¹g*8àj9ål8àj¸à¢ùoªy¥éù`&z(ç8àkøà`¸à¢¸ào¸àføà¤øà ¹ãï¹g*8àáøàï8à¯øàc9«hùn.8àj¸à¢xà xàgxàk¸ào¸ào¹b*yå*8àiøàcxào¸àfxà ‰ÎÂˆÝ]\Ë˜Û\ÜÓ˜[YOX™XÛÝ™\žKXÙ[\‹\Ý]\È	Ý˜[Y›[™ÝÉÙÛÛÙ	Î‰ÉßXÂˆ][\Ë™›Ü‘XXÚ
][OOžÂˆÛÛœÝØ[YOZ][K˜[Y	‰œ›Ùš[R[YÜš]PÚXÚÜÝ[J][Kœ›Ùš[JOOOXÝ\œ™[ÚXÚÜÝ[NÂˆÛÛœÝ›ÝÏYØÝ[Y[˜Ü™X]Q[[Y[
	Ù]‰ÊNÜ›ÝË˜Û\ÜÓ˜[YOX™XÛÝ™\žK\›ÝÉÚ][K˜[YÉÉÎ‰È[˜[Y	ßXÂˆÛÛœÝÛÜOYØÝ[Y[˜Ü™X]Q[[Y[
	Ù]‰ÊNØÛÜK˜Û\ÜÓ˜[YOIÜ™XÛÝ™\žK\›ÝËXÛÜIÎÂˆÛÛœÝ]OYØÝ[Y[˜Ü™X]Q[[Y[
	Ø‰ÊNÝ]K^ÛÛ[X	Ú][K›X™[xàîÉÜ™XÛÝ™\žPØ[™Y]Q]U^
][K˜Ü™X]Y]
_XÂˆÛÛœÝÝXYØÝ[Y[˜Ü™X]Q[[Y[
	ÜÜ[‰ÊNÜÝX‹^ÛÛ[Z][K˜[YÊØ[YOØ9ãï¹g*8àj9d#8àf8àîÉÜ™XÛÝ™\žSY]šXÜÕ^
][Kœ›Ùš[J_Xœ™XÛÝ™\žSY]šXÜÕ^
][Kœ›Ùš[JJN˜9/oùå*8àiøàcxào¸àføà¤ûï&‰Ú][K™\œ›ÜŸ	ù¥m9d"9 )øàª8àêxàï	ßXÂˆÛÜK˜\[™
]KÝXŠNÜ›ÝË˜\[™
ÛÜJNÂˆYŠ][K˜[Y	‰ˆ\Ø[YJ^ØÛÛœÝYØÝ[Y[˜Ü™X]Q[[Y[
	Ø]Û‰ÊNØ‹^ÛÛ[Iøàdøàk¹â­¹¡bøà¤¹è®º*£xàîùoªya`ÉÎØ‹˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOœ™\ÝÜ™T™XÛÝ™\žPØ[™Y]J][KšÚ[™][KšY][K›X™[
JNÜ›ÝË˜\[™
Š_Bˆ\Ý˜\[™
›ÝÊNÂˆJNÂŸB˜\Þ[˜È[˜Ý[Ûˆ™\ÝÜ™T™XÛÝ™\žPØ[™Y]JÚ[™YX™[Iùoªy¥éùà®IÊ^ÂˆYŠ›Ùš[T™XÛÝ™\žTÛÝ\˜ÙOOOIÙ]\™IÊ^ÜÚÝÐ\›ÝXÙJ	Ù\œ›Ü‰Ë	ùab8àjÑ‘HUQTÕ8à¤¹¦í9¥¬8àeøài¸àcøàh8àexàa	Ë	ù¥¬8àeøàa9oh¹o#øàk¹/çykf8àáøàï8à¯øà¤¹cé8àa9å.úgh¸àbøà¢yi"y¦í8àeøàj¸àa8à¢8àa¸à yoªy¥éù¤ãy/g8à¤¹`g9«h¸àeøài¸àa8ào¸àfxà ‰Ë	ù¦í9¥¬8à¤¹è®º*£IË

OO˜ÚXÚÑ›Ü\\]JYJJNÜ™]\›ˆ˜[Ù_BˆYŠ›Ùš[UÜš]P›ØÚÙY›Ùš[PÛÛ™›XÝ›ØÚÙY
^ÜÚÝÐ\›ÝXÙJ	Ù\œ›Ü‰Ë	øàdøàk¹å.úgh¸àbøà¢xàkùoªya`øàiøàcxào¸àføà¤ÉË	ù/çykf8àc9`g9«h¸àeøài¸àa8à¢øàbøà yb)xàk¹å.úgh¸àiù¥¬8àeøàa9ki¹ïä¸àáøàï8à¯øàc8à`¸à¢¸ào¸àfxà ¹§ 9¥¬9â­¹¡bøà¤º*«xàoú/¯8à¤øàiøàbøà¢yoªy¥éøà®øàìøà¯øàï8à¤ºe¢øàa8ài¸àcøàh8àexàa8à ‰Ë	ù§ 9¥¬9â­¹¡bøà¤º*«xàoú/¯8à 	Ë

OO›ØØ][Û‹œ™[ØY

JNÜ™]\›ˆ˜[Ù_Bˆ]Ø[™Y]NÝž^ØØ[™Y]OX]ØZ]Ù]™XÛÝ™\žPØ[™Y]JÚ[™Y
_XØ]Ú
J^ÜÚÝÐ\›ÝXÙJ	Ù\œ›Ü‰Ë	ùoªy¥éùà®xà¤º*«xàoùcå¸à£8ào¸àføà¤øàiøàeøàgÉËOË›Y\ÜØYÙ_	ùoªy¥éùà®xàk¹¥m9d"9 )øà¤¹è®º*£xàiøàcxào¸àføà¤øàiøàeøàgøà ‰ÊNÜ™[™\”™XÛÝ™\žPÙ[\Š
NÜ™]\›ˆ˜[Ù_BˆÛÛœÝÝ\œ™[^\™XÛÝ™\žSY]šXÜÕ^
›Ùš[JKØ[™Y]U^\™XÛÝ™\žSY]šXÜÕ^
Ø[™Y]JNÂˆYŠXÛÛ™š\›J	ÛX™[xàn9¢.øàeøào¸àfxàbûï'Â‚¹ãï¹g*;ï&‰ØÝ\œ™[^B¹oªya`ùab;ï&‰ØØ[™Y]U^B‚¹ãï¹g*8àk¹â­¹¡bøàkøà#9æí9bcxàk¹¢bùbåyoªya`ùbcxà#xàj8àeøàiŒyfç¹b!º` :`oøàeøào¸àfxà ˜
J\™]\›ˆ˜[ÙNÂˆYŠ\\œÚ\Ý›Ùš[TÚ[[J
J^ÜÚÝÐ\›ÝXÙJ	Ù\œ›Ü‰Ë	ùoªya`øà¤ºe¢ùiâøàiøàcxào¸àføà¤ÉË	ùãï¹g*8àk¹ki¹ïä¸àáøàï8à¯øà¤¹«hùn.9/çykf8àiøàcxàj¸àbøàhøàgøàgøà xà yoªya`øà¤¹.+y«h¸àeøào¸àeøàgøà ‰ÊNÜ™]\›ˆ˜[Ù_BˆYŠXXÜ]Z\™T›Ùš[UÜš]SX\ÙJ
J^ÛX\šÔ›Ùš[PÛÛ™›XÝ
	ùb)xàk‘‘HUQTÕ9å.úgh¸àc8àa8ào¹ki¹ïä¸àáøàï8à¯øà¤¹¦î8àcz/¯8à¤øàiøàa8ào¸àfIÊNÜ™]\›ˆ˜[Ù_Bˆž^Âˆ\ÜÙ\›Ñ^\›˜[›Ùš[PÛÛ™›XÝ

NÂˆØØ[ÝÜ˜YÙKœÙ]][J‘WÓPS•PSÔ‘TÕÔ‘WÔ“Ñ’SWÒÑVK”ÓÓ‹œÝš[™ÚYžJXZÙP˜XÚÝ\^[ØY
›Ùš[JJJNÂˆž^Ø]ØZ]›ÛZ\ÙKœ˜XÙJÝÜš]T™XÛÝ™\žPÚXÚÜÚ[
›Ùš[K	Ü™K[X[X[\™\ÝÜ™IËYJK™]È›ÛZ\ÙJ™\ÛÛ™OOœÙ][Y[Ý]


OOœ™\ÛÛ™J˜[ÙJKN
JWJ_XØ]Ú
ÙJ^ßBˆ›Ùš[O\Ý[\›Ùš[Q›Ü”Ø]™JØ[™Y]JNÂˆÛÛœÝ™\Ý[]Üš]PÝ\œ™[›Ùš[J›Ùš[KÜ™\Ù\™T™]š[Ý\ÎY_JNÜ›Ùš[O\™\Ý[œ›Ùš[NÜ™[Y[X™\ÛÛ[Z]Y›Ùš[J›Ùš[JNÂˆØØ[ÝÜ˜YÙKœ™[[Ý™R][J	Ù™\]Y\ÝØ™š[˜[Ü™\Ý[YWÝŒIÊNÛØØ[ÝÜ˜YÙKœ™[[Ý™R][J	Ù™\]Y\ÝÝZWÜÝ]WÝŒ‰ÊNÂˆÜØ\Ý
	ú`n8à¤øàh9oªy¥éùà®xàn9¢.øàeøào¸àeøàgÉÊNÜÙ][Y[Ý]


OO›ØØ][Û‹œ™[ØY

KL
NÜ™]\›ˆYNÂˆXØ]Ú
J^Âˆ™\ÝÜ™PÛÛ[Z]Y›Ùš[R[“Y[[ÜžJYJNÛ›ÝT›Ùš[TØ]™Q˜Z[\™JJNÂˆYŠOË˜ÛÙOOOIÔ“Ñ’SWÔ‘U’TÒSÓ—ÐÓÓ‘“PÕ	Ê[X\šÔ›Ùš[PÛÛ™›XÝ

NÙ[ÙHÚÝÐ\›ÝXÙJ	Ù\œ›Ü‰Ë	ùoªya`øàiøàcxào¸àføà¤øàiøàeøàgÉË	ùãï¹g*8àk¸àáøàï8à¯øàkùi"y¦í8àeøài¸àa8ào¸àføà¤øà ¹/çykf9â­¹¡bøà¤¹è®º*£xàeøài¸à ¸àa¹. 9n©¸àbº*i¸àeøàcøàh8àexàa8à ‰ÊNÂˆ™]\›ˆ˜[ÙNÂˆYš[˜[^Ü™[X\ÙT›Ùš[UÜš]SX\ÙJ
_BŸB˜\Þ[˜È[˜Ý[Ûˆ™\ÝÜ™T™SX[X[›Ùš[J
^ÂˆÛÛœÝ˜]Ï[ØØ[ÝÜ˜YÙK™Ù]][J‘WÓPS•PSÔ‘TÕÔ‘WÔ“Ñ’SWÒÑVJNÚYŠ\˜]Ê^ÜÜØ\Ý
	ù¢.øàføà¢ù¢bùbåyoªya`ùbcxàáøàï8à¯øàkøà`¸à¢¸ào¸àføà¤ÉÊNÜ™]\›ˆ˜[Ù_BˆYŠ›Ùš[UÜš]P›ØÚÙY›Ùš[PÛÛ™›XÝ›ØÚÙY
^ÜÚÝÐ\›ÝXÙJ	Ù\œ›Ü‰Ë	øàdøàk¹å.úgh¸àbøà¢xàkù¢.øàføào¸àføà¤ÉË	ù§ 9¥¬9â­¹¡bøà¤º*«xàoú/¯8à¤øàiøàbøà¢y¤ãy/g8àeøài¸àcøàh8àexàa8à ‰Ë	ù§ 9¥¬9â­¹¡bøà¤º*«xàoú/¯8à 	Ë

OO›ØØ][Û‹œ™[ØY

JNÜ™]\›ˆ˜[Ù_Bˆž^ÂˆÛÛœÝXÛÙYYXÛÙP˜XÚÝ\^[ØY
”ÓÓ‹œ\œÙJ˜]ÊJNÂˆYŠXÛÛ™š\›J9æí9bcxàk¹¢bùbåyoªya`øà¤¹cå¸à¢¹­¢8àeøào¸àfxàbûï'Â‚¹¢.øà¢¹ab;ï&‰Ü™XÛÝ™\žSY]šXÜÕ^
XÛÙYœ›Ùš[J_X
J\™]\›ˆ˜[ÙNÂˆYŠXXÜ]Z\™T›Ùš[UÜš]SX\ÙJ
J^ÛX\šÔ›Ùš[PÛÛ™›XÝ

NÜ™]\›ˆ˜[Ù_Bˆž^Âˆ\ÜÙ\›Ñ^\›˜[›Ùš[PÛÛ™›XÝ

NÂˆ›Ùš[O\Ý[\›Ùš[Q›Ü”Ø]™JXÛÙYœ›Ùš[JNØÛÛœÝ™\Ý[]Üš]PÝ\œ™[›Ùš[J›Ùš[KÜ™\Ù\™T™]š[Ý\ÎY_JNÜ›Ùš[O\™\Ý[œ›Ùš[NÜ™[Y[X™\ÛÛ[Z]Y›Ùš[J›Ùš[JNÂˆØØ[ÝÜ˜YÙKœ™[[Ý™R][J‘WÓPS•PSÔ‘TÕÔ‘WÔ“Ñ’SWÒÑVJNÂˆØØ[ÝÜ˜YÙKœ™[[Ý™R][J	Ù™\]Y\ÝØ™š[˜[Ü™\Ý[YWÝŒIÊNÛØØ[ÝÜ˜YÙKœ™[[Ý™R][J	Ù™\]Y\ÝÝZWÜÝ]WÝŒ‰ÊNÂˆÜØ\Ý
	ù¢bùbåyoªya`ùbcxàk¹â­¹¡bøàn9¢.øàeøào¸àeøàgÉÊNÜÙ][Y[Ý]


OO›ØØ][Û‹œ™[ØY

KL
NÜ™]\›ˆYNÂˆYš[˜[^Ü™[X\ÙT›Ùš[UÜš]SX\ÙJ
_BˆXØ]Ú
J^ÜÚÝÐ\›ÝXÙJ	Ù\œ›Ü‰Ë	ùoªya`ùbcxàk¹â­¹¡bøàn9¢.øàføào¸àføà¤øàiøàeøàgÉËOË›Y\ÜØYÙ_	ú` :`oøàáøàï8à¯øàk¹¥m9d"9 )øà¤¹è®º*£xàiøàcxào¸àføà¤øàiøàeøàgøà ‰ÊNÜ™]\›ˆ˜[Ù_BŸB˜\Þ[˜È[˜Ý[Ûˆ[”ÝÜ˜YÙTÙ[•\Ý

^ÂˆÛÛœÝÝ]\ÏYØÝ[Y[™Ù][[Y[žRY
	Ü™XÛÝ™\žPÙ[\”Ý]\ÉÊNÚYŠÝ]\Ê^ÜÝ]\Ë^ÛÛ[Iùk¢yaj9 )øààxà©øààøà«øà¤¹k§ú(c8àeøài¸àa8ào¸àfx )‰ÎÜÝ]\Ë˜Û\ÜÓ˜[YOIÜ™XÛÝ™\žKXÙ[\‹\Ý]\ÉßBˆÛÛœÝ\ÝÏV×NÂˆÛÛœÝ\ÚJ˜[YKÚË]Z[IÉÊOO\ÝËœ\Ú
Û˜[YKÚË]Z[JNÂˆÛÛœÝ]ZXÚÏ\]ZXÚÔ›Ùš[R[YÜš]TÝ]J
KÝ\œ™[ÚÏ\]ZXÚË›Úß]ZXÚË›X™[OOIùb'yfç¹/çykf9bcIÎÜ\Ú
	ùãï¹g*8àáøàï8à¯øàk¹¥m9d"9 )ÉËÝ\œ™[ÚË]ZXÚË›X™[
NÂˆž^ÂˆÛÛœÝÙ^OX™\]Y\ÝÜ›Ø™WÉÑ]K››ÝÊ
_X˜[YOXÚËIÓX]œ˜[™ÛJ
_XÛØØ[ÝÜ˜YÙKœÙ]][JÙ^K˜[YJNØÛÛœÝÚÏ[ØØ[ÝÜ˜YÙK™Ù]][JÙ^JOOO]˜[YNÛØØ[ÝÜ˜YÙKœ™[[Ý™R][JÙ^JNÜ\Ú
	øàå¸àêxà©¸à­¹a¡xàk¹gî¹§+9/çykf	ËÚËÚÏÉù¦î:/¯8àîú*«z/¯8àîùbbºfiÒÉÎ‰ú*«z/¯9`)8àc9. :!í8àeøào¸àføà¤ÉÊNÂˆXØ]Ú
J^Ü\Ú
	øàå¸àêxà©¸à­¹a¡xàk¹gî¹§+9/çykf	Ë˜[ÙKOË›˜[Y_OË›Y\ÜØYÙ_	ù/çykf9.#ycëÉÊ_BˆYŠ\[Ùˆ[™^YOOIÝ[™Yš[™Y	Ê\\Ú
	úemù§'ùoªy¥éúh&9gçÉË˜[ÙK	Ò[™^Yºgg¹kï¹oç	ÊNÂˆ[Ù^ÂˆÛÛœÝ“˜[YOX™\]Y\Ý\Ù[\ÝIÑ]K››ÝÊ
_XÂˆž^ÂˆÛÛœÝX]ØZ]™]È›ÛZ\ÙJ
™\ÛÛ™K™Z™XÝ
OOžØÛÛœÝZ[™^Y‹›Ü[Š“˜[YKJNÜ‹›Û\Ü˜Y[™YYYJ
OOœ‹œ™\Ý[˜Ü™X]SØš™XÝÝÜ™J	Ü›Ø™IÊNÜ‹›ÛœÝXØÙ\ÜÏJ
OOœ™\ÛÛ™J‹œ™\Ý[
NÜ‹›Û™\œ›ÜJ
OOœ™Z™XÝ
‹™\œ›ÜŠ_JNÂˆÛÛœÝÜ›ÝOX]ØZ]™]È›ÛZ\ÙJ
™\ÛÛ™K™Z™XÝ
OOžØÛÛœÝY‹˜[œØXÝ[ÛŠ	Ü›Ø™IË	Ü™XYÜš]IÊKÝ]›Øš™XÝÝÜ™J	Ü›Ø™IÊNÜÝœ]
	ÛÚÉË	ÚÉÊNÝ›Û˜ÛÛ\]OJ
OOœ™\ÛÛ™JYJNÝ›Û™\œ›ÜJ
OOœ™Z™XÝ
™\œ›ÜŠ_JNÂˆÛÛœÝ™XYX]ØZ]™]È›ÛZ\ÙJ
™\ÛÛ™K™Z™XÝ
OOžØÛÛœÝY‹˜[œØXÝ[ÛŠ	Ü›Ø™IË	Ü™XYÛ›IÊK]›Øš™XÝÝÜ™J	Ü›Ø™IÊK™Ù]
	ÚÉÊNÜ‹›ÛœÝXØÙ\ÜÏJ
OOœ™\ÛÛ™J‹œ™\Ý[
NÜ‹›Û™\œ›ÜJ
OOœ™Z™XÝ
‹™\œ›ÜŠ_JNÂˆ‹˜ÛÜÙJ
NÚ[™^Y‹™[]Q]X˜\ÙJ“˜[YJNÜ\Ú
	úemù§'ùoªy¥éúh&9gçÉËÜ›ÝI‰œ™XYOOIÛÚÉË	ù¦î:/¯8àîú*«z/¯ÒÉÊNÂˆXØ]Ú
J^Ýž^Ú[™^Y‹™[]Q]X˜\ÙJ“˜[YJ_XØ]Ú
ÙJ^ß\\Ú
	úemù§'ùoªy¥éúh&9gçÉË˜[ÙKOË›˜[Y_OË›Y\ÜØYÙ_	ùb*yå*9.#ycëÉÊ_BˆBˆÛÛœÝÝÔÝ\ÜYIÜÙ\šXÙUÛÜšÙ\‰Ú[ˆ˜]šYØ]ÜŽÜ\Ú
	øàª¸àåxàêxà©8àìùå*8àáøàï8à¯ÉË\ÝÔÝ\ÜYH[˜]šYØ]Ü‹œÙ\šXÙUÛÜšÙ\‹˜ÛÛ›Û\‹ÝÔÝ\ÜYÊ˜]šYØ]Ü‹œÙ\šXÙUÛÜšÙ\‹˜ÛÛ›Û\Éùb-¹o¨y.+IÎ‰øào¸àh9®¥¹`¦y.+IÊN‰øàdøàk¹ä¬9h øàiøàkúgg¹kï¹oç	ÊNÂˆÛÛœÝÜš]XØ[]\ÝËœÛXÙJÊK\ÜÙYXÜš]XØ[™š[\ŠOž›ÚÊK›[™ÝÂˆÛÛœÝ[™\Ï]\ÝË›X\
O˜	Þ›ÚÏÉø§$ÉÎ‰ðåÉßH	Þ›˜[Y_IÞ™]Z[Ø;ï&‰Þ™]Z[X‰ÉßX
NÂˆYŠÝ]\Ê^ÜÝ]\Ë^ÛÛ[X9k¢yaj9 )øààxà©øààøà«È	Ü\ÜÙYKÉØÜš]XØ[›[™Ý{ï&‰Û[™\Ëš›Ú[Š	È;ï#È	Ê_XÜÝ]\Ë˜Û\ÜÓ˜[YOX™XÛÝ™\žKXÙ[\‹\Ý]\È	Ü\ÜÙYOOXÜš]XØ[›[™ÝÉÙÛÛÙ	Î‰ÝØ\›‰ßXBˆYŠ\ÜÙYOOXÜš]XØ[›[™Ý
\ÜØ\Ý
	ùki¹ïä¸àáøàï8à¯øàk¹/çykf9ªgù©âøàkù«hùn.8àiøàfIÊNÙ[ÙHÚÝÐ\›ÝXÙJ	Ù\œ›Ü‰Ë	ù/çykf9ªgù©âøàjùè®º*£xàc9oáz) xàiøàfIË	ùoªy¥éøà®øàìøà¯øàï8àjùk¢yaj9 )øààxà©øààøà«ùíd9§§8à¤º(j9é.¸àeøào¸àeøàgøà ¹ki¹ïä¸à¤¹í¦¸àdxà¢ùbcxàjùi%º`ê8àä8ààøà«øà¨¸ààøàåøà¤¹¦î8àcyaî¸àeøài¸àcøàh8àexàa8à ‰Ë	øàáøàï8à¯øà¤¹¦î8àcyaî¸àfIË^ÜX\›š[™Ñ]JNÂˆ™Yœ™\ÚØRX[

NÜ™]\›ˆ\ÝÎÂŸB˜\Þ[˜È[˜Ý[Ûˆ^Ü™XÛÝ™\žQXYÛ›ÜÝXÜÊ
^ÂˆÛÛœÝ]ZXÚÏ\]ZXÚÔ›Ùš[R[YÜš]TÝ]J
NÛ]Ú[ÏV×NÝž^ÜÚ[ÏX]ØZ]™XÛÝ™\žPØ[™Y]\Ê
_XØ]Ú
ÙJ^ßBˆ]ÝÜ˜YÙO[[Ýž^ÚYŠ˜]šYØ]Ü‹œÝÜ˜YÙOË™\Ý[X]J^ØÛÛœÝX]ØZ]˜]šYØ]Ü‹œÝÜ˜YÙK™\Ý[X]J
NÜÝÜ˜YÙO^Ý\ØYÙNž\ØYÙ_][ÝNžœ][Ý___XØ]Ú
ÙJ^ßBˆ]\œÚ\ÝY[[Ýž^ÚYŠ˜]šYØ]Ü‹œÝÜ˜YÙOËœ\œÚ\ÝY
\\œÚ\ÝYX]ØZ]˜]šYØ]Ü‹œÝÜ˜YÙKœ\œÚ\ÝY

_XØ]Ú
ÙJ^ßBˆÛÛœÝOJ

OOžÝž^Ü™]\›ˆÝ\œ™[]ÛZXÔ›Ùš[J
_XØ]Ú
ÙJ^Ü™]\›ˆ[_JJ
NÂˆÛÛœÝ™\Ü^Âˆ›Ü›X]‰Ù™\]Y\ÝYXYÛ›ÜÝXÜË]ŒIËÜ™X]Y]›™]È]J
KÒTÓÔÝš[™Ê
K\™\œÚ[ÛŽTÕ‘T”ÒSÓ‹›Ùš[TØÚ[XU™\œÚ[ÛŽœ›Ùš[Kœ›Ùš[TØÚ[XU™\œÚ[Û‹ˆ›Ùš[NžÜ™]š\Ú[ÛŽ˜OËœ™]š\Ú[ÛÏÜ›Ùš[P˜\ÙT™]š\Ú[Û‹[YÜš]Nœ]ZXÚË›X™[Üš]P›ØÚÙYœ›Ùš[UÜš]P›ØÚÙYÛÛ™›XÝ›ØÚÙYœ›Ùš[PÛÛ™›XÝ›ØÚÙY™XÛÝ™\žTÛÝ\˜ÙNœ›Ùš[T™XÛÝ™\žTÛÝ\˜Ù_[\ÝØ]™Q˜Z[\™N›\Ý›Ùš[TØ]™Q˜Z[\™_[\ÝØ]™Q˜Z[\™P]›\Ý›Ùš[TØ]™Q˜Z[\™P]Û™]È]J\Ý›Ùš[TØ]™Q˜Z[\™P]
KÒTÓÔÝš[™Ê
N›[Ý[[X\žNœ™XÛÝ™\žT›Ùš[SY]šXÜÊ›Ùš[J_Kˆ™XÛÝ™\žNžÝ\ØX›NœÚ[Ë™š[\ŠOž˜[Y
K›[™Ý[˜[YœÚ[Ë™š[\ŠOˆ^˜[Y
K›[™Ý™R[\Ü›Û˜XÚÎˆH[ØØ[ÝÜ˜YÙK™Ù]][J‘WÒSTÔ•Ô“Ñ’SWÒÑVJK™SX[X[›Û˜XÚÎˆH[ØØ[ÝÜ˜YÙK™Ù]][J‘WÓPS•PSÔ‘TÕÔ‘WÔ“Ñ’SWÒÑVJKÛÜœ\˜]Ô™\Ù\™YˆH[ØØ[ÝÜ˜YÙK™Ù]][JÓÔ”•TÔ“Ñ’SWÒÑVJ_Kˆ[š\›Û›Y[žÜÝ[™[Û™Nš\ÔÝ[™[Û™J
KÛ›[™N›˜]šYØ]Ü‹›Û“[™KÙ\šXÙUÛÜšÙ\ÛÛ›ÛYˆH[˜]šYØ]Ü‹œÙ\šXÙUÛÜšÙ\Ë˜ÛÛ›Û\‹\œÚ\Ý[ÝÜ˜YÙNœ\œÚ\ÝYÝÜ˜YÙ_BˆNÂˆÝÛ›ØY^š[J™K\]Y\ÝYXYÛ›ÜÝXÜËIÛØØ[]RTÓÊ
_KšœÛÛ˜”ÓÓ‹œÝš[™ÚYžJ™\Ü[ŠJNÜÜØ\Ý
	ú*.¹¥«xàë8àçxàï8àâ8à¤¹¦î8àcyaî¸àeøào¸àeøàgÉÊNÂŸB™[˜Ý[Ûˆ^Ü™\Ù\™YÛÜœ\›Ùš[J
^ÂˆÛÛœÝ˜]Ï[ØØ[ÝÜ˜YÙK™Ù]][JÓÔ”•TÔ“Ñ’SWÒÑVJNÚYŠ\˜]Ê^ÜÜØ\Ý
	ù/çyaj8àexà£8ài¸àa8à¢ùè-9¤#xàáøàï8à¯øàkøà`¸à¢¸ào¸àføà¤ÉÊNÜ™]\›ˆ˜[Ù_BˆÝÛ›ØY^š[J™K\]Y\Ý\™\Ù\™YXÛÜœ\IÛØØ[]RTÓÊ
_K˜]Ë	Ý^ÜZ[‰ÊNÜÜØ\Ý
	ùè-9¤#y¦`¸àk¹a`øàáøàï8à¯øà¤¸àgxàk¸ào¸ào¹/çyaj8àeøào¸àeøàgÉÊNÜ™]\›ˆYNÂŸB™[˜Ý[Ûˆ^ÜX\›š[™Ñ]J
^ÂˆYŠ›Ùš[T™XÛÝ™\žTÛÝ\˜ÙOOOIÙ]\™IÊ^ÂˆÚÝÐ\›ÝXÙJ	Ù\œ›Ü‰Ë	ù§ 9¥¬9âb8àn9¦í9¥¬8àeøài¸àbøà¢y¦î8àcyaî¸àeøài¸àcøàh8àexàa	Ë	øàdøàk¹å.úgh¸à¢8à¢¹¥¬8àeøàa9oh¹o#øàk¹ki¹ïä¸àáøàï8à¯øàc9/çykf8àexà£8ài¸àa8ào¸àfxà ¹cé8àa9å.úgh¸àk¹ên¹â­¹¡bøà¤º*©8àhøài¸àä8ààøà«øà¨¸ààøàåøàeøàj¸àa8à¢8àa¸à y¦î8àcyaî¸àeøà¤¹`g9«h¸àeøào¸àeøàgøà ‰Ë	ù¦í9¥¬8à¤¹è®º*£IË

OO˜ÚXÚÑ›Ü\\]JYJJNÂˆ™]\›ˆ˜[ÙNÂˆBˆÛÛœÝ^[ØY[XZÙP˜XÚÝ\^[ØY
›Ùš[JNÂˆÛÛœÝ›Ø[™]È›ØŠÒ”ÓÓ‹œÝš[™ÚYžJ^[ØY[ŠWKÝ\N‰Ø\XØ][Û‹ÚœÛÛ‰ßJNÂˆÛÛœÝOYØÝ[Y[˜Ü™X]Q[[Y[
	ØIÊNØKš™YUT“˜Ü™X]SØš™XÝT“
›ØŠNØK™ÝÛ›ØYX™K\]Y\ÝX˜XÚÝ\IÛØØ[]RTÓÊ
_KšœÛÛ˜ÙØÝ[Y[˜›ÙK˜\[™Ú[
JNØK˜ÛXÚÊ
NØKœ™[[Ý™J
NÜÙ][Y[Ý]


OO•T“œ™]›ÚÙSØš™XÝT“
Kš™YŠKL
NÂˆž^ÛØØ[ÝÜ˜YÙKœÙ]][J“Ñ’SWÓTÕÑVÔ•ÒÑVK™]È]J
KÒTÓÔÝš[™Ê
J_XØ]Ú
ÙJ^ßBˆÜØ\Ý
	ù¥m9d"9 )øààxà©øààøà«ù.æ8àcxàiùki¹ïä¸àáøàï8à¯øà¤¹¦î8àcyaî¸àeøào¸àeøàgÉÊNÜ™Yœ™\ÚØRX[ËŠ
NÂŸB˜\Þ[˜È[˜Ý[Ûˆ[\ÜX\›š[™Ñ]Qš[Jš[J^Âˆž^ÂˆYŠš[OËœÚ^™OJŒL
ŒL
]›ÝÈ™]È\œ›ÜŠ	øàä8ààøà«øà¨¸ààøàåøàåxà¨xà©8àêøàc9i)øàcxàfxàc¸ào¸àfIÊNÂˆÛÛœÝ\œÙYR”ÓÓ‹œ\œÙJ]ØZ]š[K^

JNÂˆÛÛœÝXÛÙYYXÛÙP˜XÚÝ\^[ØY
\œÙY
NÂˆÛÛœÝY\ÜØYÙOX9ãï¹g*8àk¹ki¹ïä¸àáøàï8à¯øà¤¸à y«(xàk¸àä8ààøà«øà¨¸ààøàåøàiùïk¸àcy£æøàb8ào¸àfxàbûï'×—‰Ø˜XÚÝ\Ý[[X\žJXÛÙY
_W—¹ãï¹g*8àk¸àáøàï8à¯øàkùêëù§*ùa¡xàjù. 9¦`º` :`oøàexà£8à xà`¸àj8àbøà¢Lyfç¸àh8àdy¢.øàføào¸àfxà ˜ÂˆYŠXÛÛ™š\›JY\ÜØYÙJJ\™]\›ŽÂ‚ˆÛÛœÝÝ\œ™[[ØØ[ÝÜ˜YÙK™Ù]][JÕÔQÑWÒÑVJ_”ÓÓ‹œÝš[™ÚYžJ›Ü›X[^™T›Ùš[Q]J›Ùš[JJNÂˆØØ[ÝÜ˜YÙKœÙ]][J‘WÒSTÔ•Ô“Ñ’SWÒÑVKÝ\œ™[
NÂˆYŠ\›Ùš[UÜš]P›ØÚÙY
\]Y]YT™XÛÝ™\žPÚXÚÜÚ[
	Ü™KZ[\Ü	ËYJNÂ‚ˆ›Ùš[UÜš]P›ØÚÙYY˜[ÙNÂˆ›Ùš[T™XÛÝ™\žS™YYÒ[™^YY˜[ÙNÂˆ›Ùš[O\Ý[\›Ùš[Q›Ü”Ø]™JXÛÙYœ›Ùš[JNÂˆÛÛœÝ[\ÜY™\Ý[]Üš]PÝ\œ™[›Ùš[J›Ùš[KÜ™\Ù\™T™]š[Ý\ÎYKÚÚ\ÛÛ™›XÝÚXÚÎY_JNÂˆ›Ùš[OZ[\ÜY™\Ý[œ›Ùš[NÜ™[Y[X™\ÛÛ[Z]Y›Ùš[J›Ùš[JNÂˆ›Ùš[PÛÛ™›XÝ›ØÚÙYY˜[ÙNÜ›Ùš[PÛÛ™›XÝ›ÝXÙTÚÝÛY˜[ÙNÂˆ]Y]YT™XÛÝ™\žPÚXÚÜÚ[
	Ú[\Ü	ËYJNÂˆØØ[ÝÜ˜YÙKœ™[[Ý™R][J	Ù™\]Y\ÝØ™š[˜[Ü™\Ý[YWÝŒIÊNÂˆØØ[ÝÜ˜YÙKœ™[[Ý™R][J	Ù™\]Y\ÝÝZWÜÝ]WÝŒ‰ÊNÂ‚ˆÜØ\Ý
	ùki¹ïä¸àáøàï8à¯øà¤º*«xàoú/¯8àoøào¸àeøàgÉÊNÜÙ][Y[Ý]


OO›ØØ][Û‹œ™[ØY

KL
NÂˆXØ]Ú
J^ÂˆÛÛœÛÛKØ\›Š	Ò[\Ü˜Z[Y	ËJNÂˆÚÝÐ\›ÝXÙJ	Ù\œ›Ü‰Ë	ùki¹ïä¸àáøàï8à¯øà¤º*«xàoú/¯8à xào¸àføà¤øàiøàeøàgÉËOË›Y\ÜØYÙ_	Ñ‘HUQTÕ8àk¸àä8ààøà«øà¨¸ààøàåøàåxà¨xà©8àêøàbùè®º*£xàeøài¸àcøàh8àexàa8à ‰ÊNÂˆBŸB™[˜Ý[Ûˆ™\ÝÜ™T™R[\Ü›Ùš[J
^ÂˆÛÛœÝ˜]Ï[ØØ[ÝÜ˜YÙK™Ù]][J‘WÒSTÔ•Ô“Ñ’SWÒÑVJNÂˆYŠ\˜]Ê^ÜÜØ\Ý
	ù¢.øàføà¢ú*«z/¯9bcxàáøàï8à¯øàkøà`¸à¢¸ào¸àføà¤ÉÊNÜ™]\›ˆ˜[Ù_Bˆž^ÂˆÛÛœÝ\œÙYR”ÓÓ‹œ\œÙJ˜]ÊNÂˆYŠZ\ÔZ[“Øš™XÝ
\œÙY
J]›ÝÈ™]È\œ›ÜŠ	Ü›Ùš[H\È›Ý[ˆØš™XÝ	ÊNÂˆYŠXÛÛ™š\›J	ùæí9bcxàjøàä8ààøà«øà¨¸ààøàåøà¤º*«xàoú/¯8à 9bcxàk¹ki¹ïä¸àáøàï8à¯øàn9¢.øàeøào¸àfxàbûï'ÉÊJ\™]\›ˆ˜[ÙNÂˆÛÛœÝØÚ[XO\›Ùš[TØÚ[XS[X™\Š\œÙY
NÂˆYŠØÚ[XO”“Ñ’SWÔÐÒSPWÕ‘T”ÒSÓŠ^ÂˆËÈ^XÝ›Û˜XÚÈ\È[Ü™H[\Ü[[ˆ›Ü˜Ú[™ÈHÝÛ™Ü˜YHÛÛ™\œÚ[Û‹‚ˆËÈ™[[Ý™HHÝ\œ™[]ÛZXÈ[™[ÜNÈÝ\Ú\ÙH]ÛÝ[™[XZ[ˆ]]Üš]]]™HÛˆ™[ØYˆËÈ[™H™\ÝÜ™Y™]Ù\‹Y›Ü›X]ÛÛ\]Xš[]HZ\œ›ÜˆÛÝ[™]™\ˆ™H™XXÚY‚ˆØØ[ÝÜ˜YÙKœÙ]][JÕÔQÑWÒÑVK˜]ÊNÂˆØØ[ÝÜ˜YÙKœ™[[Ý™R][J“Ñ’SWÐÒPÒÔÕSWÒÑVJNÂˆØØ[ÝÜ˜YÙKœ™[[Ý™R][J“Ñ’SWÐUÓRP×ÒÑVJNÂˆY[Ù^ÂˆÛÛœÝ™\ÝÜ™Y\Ý[\›Ùš[Q›Ü”Ø]™J\œÙY
NÂˆÛÛœÝ™\ÝÜ™Y™\Ý[]Üš]PÝ\œ™[›Ùš[J™\ÝÜ™YÜ™\Ù\™T™]š[Ý\ÎYKÚÚ\ÛÛ™›XÝÚXÚÎY_JNÂˆ›Ùš[O\™\ÝÜ™Y™\Ý[œ›Ùš[NÜ™[Y[X™\ÛÛ[Z]Y›Ùš[J›Ùš[JNÂˆ]Y]YT™XÛÝ™\žPÚXÚÜÚ[
	Ü™KZ[\Ü\™\ÝÜ™IËYJNÂˆBˆØØ[ÝÜ˜YÙKœ™[[Ý™R][J‘WÒSTÔ•Ô“Ñ’SWÒÑVJNÂˆØØ[ÝÜ˜YÙKœ™[[Ý™R][J	Ù™\]Y\ÝØ™š[˜[Ü™\Ý[YWÝŒIÊNÂˆØØ[ÝÜ˜YÙKœ™[[Ý™R][J	Ù™\]Y\ÝÝZWÜÝ]WÝŒ‰ÊNÂˆÜØ\Ý
	ú*«z/¯9bcxàk¹ki¹ïä¸àáøàï8à¯øàn9¢.øàeøào¸àeøàgÉÊNÂˆÙ][Y[Ý]


OO›ØØ][Û‹œ™[ØY

KL
NÂˆ™]\›ˆYNÂˆXØ]Ú
J^ÂˆÚÝÐ\›ÝXÙJ	Ù\œ›Ü‰Ë	ú*«z/¯9bcxàáøàï8à¯øà¤¹oªya`øàiøàcxào¸àføà¤øàiøàeøàgÉË	ú` :`oøàáøàï8à¯øàc9è-9¤#xàeøài¸àa8à¢ùcëú ïy )øàc8à`¸à¢¸ào¸àfxà ‰ÊNÂˆ™]\›ˆ˜[ÙNÂˆBŸB™ØÝ[Y[™Ù][[Y[žRY
	Ü™\]Y\Ý\œÚ\Ý[ÝÜ˜YÙIÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË\Þ[˜Ê
OOžÂˆYŠ[˜]šYØ]Ü‹œÝÜ˜YÙOËœ\œÚ\Ý
^ÜÜØ\Ý
	øàdøàk¸àå¸àêxà©¸à­¸àiøàkù/çykf9/çz+møàk¹o-ùc%¸àjùkï¹oç8àeøài¸àa8ào¸àføà¤ÉÊNÜ™]\›ŸBˆž^ØÛÛœÝÜ˜[YX]ØZ]˜]šYØ]Ü‹œÝÜ˜YÙKœ\œÚ\Ý

NÜÜØ\Ý
Ü˜[YÉù/çykf9/çz+møà¤¹o-ùc%¸àeøào¸àeøàgÉÎ‰ù/çykf9/çz+møàkøàå¸àêxà©¸à­¸àk¹ª&y®¥º*+yk¦¸àk¸ào¸ào¸àiøàfIÊNÜ™Yœ™\ÚØRX[

_XØ]Ú
ÙJ^ÜÜØ\Ý
	ù/çykf9/çz+møà¤¹i"y¦í8àiøàcxào¸àføà¤øàiøàeøàgÉÊ_BŸJNÂ™ØÝ[Y[™Ù][[Y[žRY
	ØÚXÚÐ\\]IÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OO˜ÚXÚÑ›Ü\\]JYJJNÂ™ØÝ[Y[™Ù][[Y[žRY
	Ý™\šYžT›Ùš[Q]IÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OO™\šYžT›Ùš[Q\˜Xš[]JYJJNÂ™ØÝ[Y[™Ù][[Y[žRY
	Ü[”ÝÜ˜YÙTÙ[•\Ý	ÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOœ[”ÝÜ˜YÙTÙ[•\Ý

JNÂ™ØÝ[Y[™Ù][[Y[žRY
	ØÜ™X]T™XÛÝ™\žTÚ[	ÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OO˜Ü™X]T™XÛÝ™\žTÚ[›ÝÊ
K[Š

OOœ™[™\”™XÛÝ™\žPÙ[\Š
JJNÂ™ØÝ[Y[™Ù][[Y[žRY
	Ü™Yœ™\Ú™XÛÝ™\žPÙ[\‰ÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOœ™[™\”™XÛÝ™\žPÙ[\Š
JNÂ™ØÝ[Y[™Ù][[Y[žRY
	Ü™\ÝÜ™T™SX[X[	ÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOœ™\ÝÜ™T™SX[X[›Ùš[J
JNÂ™ØÝ[Y[™Ù][[Y[žRY
	Ù^Ü™XÛÝ™\žQXYÛ›ÜÝXÜÉÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OO™^Ü™XÛÝ™\žQXYÛ›ÜÝXÜÊ
JNÂ™ØÝ[Y[™Ù][[Y[žRY
	Ù^ÜÛÜœ\›Ùš[IÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË^Ü™\Ù\™YÛÜœ\›Ùš[JNÂ™ØÝ[Y[™Ù][[Y[žRY
	Ù^Ü›Ùš[IÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË^ÜX\›š[™Ñ]JNÂ™ØÝ[Y[™Ù][[Y[žRY
	Ú[\Ü›Ùš[IÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË

OO™ØÝ[Y[™Ù][[Y[žRY
	Ü›Ùš[R[\Ü[œ]	ÊOË˜ÛXÚÊ
JNÂ™ØÝ[Y[™Ù][[Y[žRY
	Ü™\ÝÜ™T™R[\Ü	ÊOË˜Y]™[\Ý[™\Š	ØÛXÚÉË™\ÝÜ™T™R[\Ü›Ùš[JNÂ™ØÝ[Y[™Ù][[Y[žRY
	Ü›Ùš[R[\Ü[œ]	ÊOË˜Y]™[\Ý[™\Š	ØÚ[™ÙIËOOžØÛÛœÝYK\™Ù]™š[\ÏË–ÌNÚYŠŠZ[\ÜX\›š[™Ñ]Qš[JŠNÙK\™Ù]˜[YOIÉßJNÂ‚Ú[™ÝË˜Y]™[\Ý[™\Š	ÜÝÜ˜YÙIËOOžÂˆYŠ
KšÙ^OOOT“Ñ’SWÐUÓRP×ÒÑV_KšÙ^OOOTÕÔQÑWÒÑVJI‰™K›™]Õ˜[YI‰™K›™]Õ˜[YHOOYK›Û˜[YJ^Âˆž^ÂˆÛÛœÝOYKšÙ^OOOT“Ñ’SWÐUÓRP×ÒÑVOÙXÛÙP]ÛZXÔ›Ùš[Q[™[ÜJK›™]Õ˜[YJN›[ÂˆYŠX_KÜš]\’YOOUP—ÒS”ÕSÑWÒQ
[X\šÔ›Ùš[PÛÛ™›XÝ

NÂˆXØ]Ú
ÙJ^ÛX\šÔ›Ùš[PÛÛ™›XÝ
	ùb)xàk¹å.úgh¸àiù/çykf8àáøàï8à¯øàc9i"y¦í8àexà£8ào¸àeøàgÉÊ_BˆBŸJNÂ‚›]\ÝÛØ˜[\œ›Ü]LÂ™[˜Ý[Ûˆ™\ÜÛØ˜[\œ›ÜŠ
^ÂˆÛÛœÝ›ÝÏQ]K››ÝÊ
NÚYŠ›ÝË[\ÝÛØ˜[\œ›Ü]Ì
\™]\›ŽÛ\ÝÛØ˜[\œ›Ü][›ÝÎÂˆÚÝÐ\›ÝXÙJ	Ù\œ›Ü‰Ë	ùå.úgh¸àk¹aé¹ä!¸àiùecúhc8àc9æn¹å'øàeøào¸àeøàgÉË	ùki¹ïä¸àáøàï8à¯øàkùêëù§*øàjù/çykf8àexà£8ài¸àa8ào¸àfxà º(j9é.¸àc8àb¸àbøàeøàa9h-9d"8àkùa£z*«xàoú/¯8àoøàeøài¸àcøàh8àexàa8à ‰Ë	ùa£z*«xàoú/¯8àoÉË

OO›ØØ][Û‹œ™[ØY

JNÂŸBÚ[™ÝË˜Y]™[\Ý[™\Š	Ù\œ›Ü‰ËOOžØÛÛœÛÛKØ\›Š	Ñ‘HUQTÕ[[YH\œ›Ü‰ËK™\œ›ÜŸK›Y\ÜØYÙJNÜ™\ÜÛØ˜[\œ›ÜŠ
_JNÂÚ[™ÝË˜Y]™[\Ý[™\Š	Ý[š[™Y™Z™XÝ[Û‰ËOOžØÛÛœÛÛKØ\›Š	Ñ‘HUQTÕ™Z™XÝY›ÛZ\ÙIËKœ™X\ÛÛŠNÜ™\ÜÛØ˜[\œ›ÜŠ
_JNÂ‚˜\Þ[˜È[˜Ý[Ûˆš[˜[^™T›Ùš[T™XÛÝ™\žJ
^ÂˆYŠ›Ùš[T™XÛÝ™\žS™YYÒ[™^YŠ^ÂˆÛÛœÝ™XÛÝ™\™YX]ØZ]™XÛÝ™\“]\Ý[™^YÚXÚÜÚ[

NÂˆYŠ™XÛÝ™\™Y
^ÂˆÚÝÐ\›ÝXÙJ	Ý\]IË	úemù§'ù/çz+møàk¹oªy¥éùà®xàbøà¢yoªya`øàeøào¸àeøàgÉË	ú`&¹n.8àáøàï8à¯øàj9æí9bcxà®xàâ¸ààøàåøà­øàéøààøàâ8àk¹.(y¥®xàc9/oøàb8àj¸àbøàhøàgøàgøà xà yêëù§*ùa¡xàkºemù§'ùoªy¥éùà®xàbøà¢yki¹ïä¸àáøàï8à¯øà¤¹¢.øàeøào¸àeøàgøà ‰Ë	ùa£z*«xàoú/¯8àoÉË

OO›ØØ][Û‹œ™[ØY

JNÂˆÙ][Y[Ý]


OO›ØØ][Û‹œ™[ØY

KL
NÂˆ™]\›ŽÂˆBˆËÈ›È˜[YÛ™Ë]\›HÚXÚÜÚ[^\ÝËˆHÜšYÚ[˜[œ›ÚÙ[ˆ˜]È]H™[XZ[œÈ[ˆÓÔ”•TÔ“Ñ’SWÒÑVK‚ˆ›Ùš[UÜš]P›ØÚÙYY˜[ÙNÂˆ›Ùš[T™XÛÝ™\žS™YYÒ[™^YY˜[ÙNÂˆØ]™T›Ùš[J
NÂˆB‚ˆYŠ\›Ùš[T™XÛÝ™\žUØ\›š[™Ê\™]\›ŽÂˆYŠ›Ùš[T™XÛÝ™\žTÛÝ\˜ÙOOOIÜÛ˜\ÚÝ	Ê^ÂˆÙ][Y[Ý]


OOœÚÝÐ\›ÝXÙJ	Ý\]IË	ùki¹ïä¸àáøàï8à¯øà¤º!ê¹båyoªy¥éøàeøào¸àeøàgÉË	ùãï¹g*8àáøàï8à¯øàk¹¥m9d"9 )øàjùecúhc8àc:)¢øài8àbøàhøàgøàgøà xà y. 8ài9bcxàk¹«hùn.8àj¸à®xàâ¸ààøàåøà­øàéøààøàâ8àbøà¢yoªy¥éøàeøào¸àeøàgøà ¹è-9¤#xàeøàgùa`øàáøàï8à¯øà ¹oªy¥éùå*8àj8àeøài¹êëù§*ùa¡xàjú` :`oøàeøài¸àa8ào¸àfxà ‰Ë	øàáøàï8à¯øà¤¹è®º*£IË

OOžÜÚÝÔØÜ™Y[Š	Ü[‰ÊNÛÜ[”[‘]Q›ÛŒÍLŠ
NÜÙ][Y[Ý]


OO™ØÝ[Y[™Ù][[Y[žRY
	ÜØRX[Ø\™	ÊOËœØÜ›Û[ÕšY]ÏËŠØ™Z]š[ÜŽ‰ÜÛ[ÛÝ	Ë›ØÚÎ‰ØÙ[\‰ßJK
_JKÌ
NÂˆY[ÙHYŠ›Ùš[T™XÛÝ™\žTÛÝ\˜ÙOOOIÙ]\™IÊ^ÂˆÙ][Y[Ý]


OOœÚÝÐ\›ÝXÙJ	Ù\œ›Ü‰Ë	Ñ‘HUQTÕ8àk¹¦í9¥¬8àc9oáz) xàiøàfIË9/çykf8àáøàï8à¯øàkøàdøàk¸à¨¸àåøàê¸à¢8à¢¹¥¬8àeøàa9oh¹o#øàiøàfxà ¹."¹¦î8àcxà¤ºf,¸àd8àgøà yki¹ïä¸àáøàï8à¯øàn8àk¹/çykf8à¤¹`g9«h¸àeøài¸àa8ào¸àfxà ‰Ü›Ùš[T™XÛÝ™\žT™X\ÛÛØ‰Ü›Ùš[T™XÛÝ™\žT™X\ÛÛŸX‰ÉßX	ù¦í9¥¬8à¤¹è®º*£IË

OO˜ÚXÚÑ›Ü\\]JYJJKÌ
NÂˆY[ÙHYŠ›Ùš[T™XÛÝ™\žTÛÝ\˜ÙHOOIÚ[™^Y‰Ê^ÂˆÙ][Y[Ý]


OOœÚÝÐ\›ÝXÙJ	Ù\œ›Ü‰Ë	ùki¹ïä¸àáøàï8à¯øà¤º*«xàoùcå¸à£8ào¸àføà¤øàiøàeøàgÉË	ù«hùn.8àj¸àëxàï8àªøàêøà®xàâ¸ààøàåøà­øàéøààøàâ8à¡:emù§'ùoªy¥éùà®xà ¹b*yå*8àiøàcxàj¸àbøàhøàgøàgøà xà y¥¬:)£ùâ­¹¡bøàiú-mùbåxàeøào¸àeøàgøà ¹è-9¤#xàeøàgùa`øàáøàï8à¯øàkùoªy¥éùå*8àj8àeøài¹êëù§*ùa¡xàjú` :`oøàeøài¸àa8ào¸àfxà ‰Ë	ú*+yk¦¸à¤ºe¢øàcÉË

OOžÜÚÝÔØÜ™Y[Š	Ü[‰ÊNÛÜ[”[‘]Q›ÛŒÍLŠ
NÜÙ][Y[Ý]


OO™ØÝ[Y[™Ù][[Y[žRY
	ÜØRX[Ø\™	ÊOËœØÜ›Û[ÕšY]ÏËŠØ™Z]š[ÜŽ‰ÜÛ[ÛÝ	Ë›ØÚÎ‰ØÙ[\‰ßJK
_JKÌ
NÂˆBŸB™[˜Ý[Ûˆš[˜[^™P\›ÛÝ

^ÂˆYŠ\›ÛÝÛÛ\]J\™]\›ŽÂˆËÈ]\È^XÝÚ[]™\žHÛÛœÝÛ]]\Ù][™]™\žHRKÔÐH[Ù[H[ˆBˆËÈÛ™KYš[H[™H\È™Y[ˆXÛ\™YˆÛ›H›ÝÈX^HHØ]™HšYÙÙ\ˆ[™[™\š[™Ë‚ˆ\›ÛÝÛÛ\]O]YNÂˆÚ[™ÝË‘‘TUQTÕÐTÐ“ÓÕÐÓÓTUO]YNÂˆÚ[™ÝË‘‘TUQTÕÑRSWÔS—Ô‘PQO]YNÂ‚ˆYŠ›ÛÝ›Ùš[TØ]™T[™[™Ê^Âˆ›ÛÝ›Ùš[TØ]™T[™[™ÏY˜[ÙNÂˆËÈ\œÚ\Ý[ØÚ[XKÙY˜][Ø˜XÚÙš[Ú[™Ù\ÈÛ˜ÙK[œÝXYÙˆ™\X]YHÚ[BˆËÈH[™H\ÈÝ[[š]X[^š[™ËˆØ]™T›Ùš[H[ÛÈ\™›Ü›\ÈHš\œÝ[™[™\‹‚ˆYŠØ]™T›Ùš[J
J\™]\›ŽÂˆBˆž^Âˆ™Yœ™\Ú›Ùš[URJ
NÂˆÜ[”›Ø›[\ÒXŠ
NÂˆ™[™\“X\›š[™Ñ[žJ
NÂˆXØ]Ú
J^ÂˆÛÛœÛÛKØ\›Š	Ñš[˜[\›ÛÝ™[™\ˆ˜Z[Y	ËJNÂˆÙ][Y[Ý]


OOœ™\ÜÛØ˜[\œ›ÜËŠ
K
NÂˆBŸB™š[˜[^™P\›ÛÝ

NÂ‚™š[˜[^™T›Ùš[T™XÛÝ™\žJ
K˜Ø]Ú
OO˜ÛÛœÛÛKØ\›Š	Ô›Ùš[H™XÛÝ™\žHš[˜[^˜][Ûˆ˜Z[Y	ËJJNÂœ™Yœ™\ÚØRX[

NÂœÙ][Y[Ý]


OOœ™[™\”™XÛÝ™\žPÙ[\Š
K˜Ø]Ú
OO˜ÛÛœÛÛKØ\›Š	Ô™XÛÝ™\žHÙ[\ˆ[š]˜Z[Y	ËJJKÍL
NÂœÙ][Y[Ý]


OO™[œÝ\™U™\œÚ[Û”™XÛÝ™\žPÚXÚÜÚ[

K[Š

OOœ™[™\”™XÛÝ™\žPÙ[\Š
JK˜Ø]Ú
OO˜ÛÛœÛÛKØ\›Š	Õ™\œÚ[ÛˆÚXÚÜÚ[[š]˜Z[Y	ËJJKÌ
NÂ‚‹ËÈ‘HUQTÕŒÍ8 %ÝZYYš\œÝ\[ˆÛ˜›Ø\™[™Ë‚‹ËÈ\È^Y\ˆÚ[™Ù\È™\Ù[][Û‹Ü›Ý][™ÈÛ›KˆXØÛÝ[\ÙH™[XZ[œÈÜ[Û˜[[™H^\Ý[™Â‹ËÈŒÍˆØØ[Yš\œÝÛÝY›Ý[™\žHÛÛ[Y\ÈÈÝÛˆ]][XØ][Ûˆ[™Þ[˜Ú›Ûš^˜][Û‹‚˜ÛÛœÝ’T”ÕÔ•S—ÑÕRQQÕŒÍÔÔPÏSØš™XÝ™œ™Y^™JÂˆÛXÞN‰ÛÜ[Û˜[XXØÛÝ[][‹\Ù][™ÜË][‹YXYÛ›ÜÝXË][‹ZÛYIËˆXØÛÝ[™\]Z\™Y™˜[ÙKˆ˜]šYØ][Û“ØÚÙY[[XYÛ›ÜÝXÎYKˆ^\Ý[™ÓX\›™\”›Ý]PÚ[™ÙY™˜[ÙKˆ›Ùš[TØÚ[XPÚ[™ÙY™˜[ÙKˆÛÝY[[YPÚ[™ÙY™˜[ÙKˆXYÛ›ÜÝXÔØÛÜš[™ÐÚ[™ÙY™˜[ÙKˆš[š\Ú\Ý[˜][ÛŽ‰ÚÛYIËˆ]]Ó][˜ÚY\‘XYÛ›ÜÝXÎ™˜[ÙBŸJNÂ‚˜ÛÛœÝ’T”ÕÔ•S—ÐPÐÓÕS•ÔÕUWÕŒÍIÛÛ˜›Ø\™[™ÐXØÛÝ[ŒÍ	ÎÂ˜ÛÛœÝ’T”ÕÔ•S—ÕÕSÔÕT×ÕŒÍIÛÛ˜›Ø\™[™ÕÝ[Ý\ÕŒÍ	ÎÂ›]š\œÝ[‘ÝZYYÙ\ÜÚ[Û•ŒÍY˜[ÙNÂ›]š\œÝ[ÛÝYØœÙ\™\•ŒÍ[[Â›]š\œÝ[ÛÝYÛŒÍ[[Â›]ÜšYÚ[˜[ÚÝÔØÜ™Y[•ŒÍ\ÚÝÔØÜ™Y[ŽÂ›]ÜšYÚ[˜[™[™\‘š\œÝ[‘^\šY[˜ÙUŒÍ]\[Ùˆ™[™\‘š\œÝ[‘^\šY[˜ÙUŒÍOOIÙ[˜Ý[Û‰ÏÜ™[™\‘š\œÝ[‘^\šY[˜ÙUŒÍ›[Â‚™[˜Ý[Ûˆš\œÝ[‘^\Ý[™ÓX\›™\•ŒÍ

^Âˆ™]\›ˆ›ÛÛX[Š›Ùš[OË™XYÛ›ÜÝXÐÛÛ\]Y
_
\[Ùˆš\œÝ[’\ÓX\›š[™Ò\ÝÜžUŒÍOOIÙ[˜Ý[Û‰É‰™š\œÝ[’\ÓX\›š[™Ò\ÝÜžUŒÍ

JNÂŸB‚™[˜Ý[Ûˆš\œÝ[XØÛÝ[\ÜÙYŒÍ

^ÂˆÛÛœÝÝ]O\™XYZTÝ]J
NÂˆ™]\›ˆÉÜÚÚ\Y	Ë	ÜÚYÛ™YZ[‰×Kš[˜ÛY\ÊÝš[™ÊÝ]OË–Ñ’T”ÕÔ•S—ÐPÐÓÕS•ÔÕUWÕŒÍ_	ÉÊJNÂŸB‚™[˜Ý[Ûˆš\œÝ[“™YYÔÙ][™ÜÕŒÍ

^Âˆ™]\›ˆTÝš[™Ê›Ùš[OËœÙ][™ÜÏË™^[Q]_	ÉÊKš[J
NÂŸB‚™[˜Ý[Ûˆš\œÝ[‘ÝZYYXÝ]™UŒÍ

^Âˆ™]\›ˆš\œÝ[‘ÝZYYÙ\ÜÚ[Û•ŒÍYš\œÝ[‘^\Ý[™ÓX\›™\•ŒÍ

NÂŸB‚™[˜Ý[Ûˆš\œÝ[‘ÝZYYÝ[Ý\ÕŒÍ

^ÂˆÛÛœÝØ]™YS[X™\Š™XYZTÝ]J
OË–Ñ’T”ÕÔ•S—ÕÕSÔÕT×ÕŒÍJNÂˆ™]\›ˆØ]™YOOLŸØ]™YOOLÏÜØ]™YŠš\œÝ[“™YYÔÙ][™ÜÕŒÍ

OÌÎŒŠNÂŸB‚™[˜Ý[Ûˆš\œÝ[‘ÝZYY›ÙUŒÍ
YËÛË^
^ÂˆÛÛœÝ›ÙOYØÝ[Y[˜Ü™X]Q[[Y[
YÊNÂˆYŠÛÊ[›ÙK˜Û\ÜÓ˜[YOXÛÎÂˆYŠ^O[[
[›ÙK^ÛÛ[]^Âˆ™]\›ˆ›ÙNÂŸB‚™[˜Ý[Ûˆš\œÝ[ÛÝYØ\™ŒÍ

^Âˆ™]\›ˆØÝ[Y[™Ù][[Y[žRY
	ØÛÝYÞ[˜ÐØ\™ŒÍ‰ÊNÂŸB‚™[˜Ý[Ûˆš\œÝ[ÛÝYÚYÛ™Y[•ŒÍ

^ÂˆÛÛœÝØ\™Yš\œÝ[ÛÝYØ\™ŒÍ

NÂˆÛÛœÝXØÛÝ[XØ\™Ëœ]Y\žTÙ[XÝÜËŠ	Ë™™\K\Þ[˜ËXXØÛÝ[	ÊNÂˆ™]\›ˆXØÛÝ[ÔÝš[™ÊXØÛÝ[^ÛÛ[	ÉÊKš[J
N‰ÉÎÂŸB‚™[˜Ý[Ûˆš\œÝ[ÛÝY™XYUŒÍ

^Âˆ™]\›ˆ›ÛÛX[Šš\œÝ[ÛÝYØ\™ŒÍ

OËœ]Y\žTÙ[XÝÜËŠ	ÖÙ]K\Þ[˜ËXXÝ[ÛHœÙ[™[[šÈ—IÊJNÂŸB‚™[˜Ý[ÛˆÝÜš\œÝ[ÛÝYØ]ÚŒÍ

^Âˆž^Ùš\œÝ[ÛÝYØœÙ\™\•ŒÍË™\ØÛÛ›™XÝ

_XØ]Ú
ÙJ^ßBˆš\œÝ[ÛÝYØœÙ\™\•ŒÍ[[ÂˆYŠš\œÝ[ÛÝYÛŒÍ
XÛX\’[\˜[
š\œÝ[ÛÝYÛŒÍ
NÂˆš\œÝ[ÛÝYÛŒÍ[[ÂŸB‚™[˜Ý[Ûˆ\]Qš\œÝ[ÛÝYÝ]UŒÍ

^ÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	Ùš\œÝ[‘ÝZYYŒÍ	ÊNÂˆYŠ\›ÛÝ›ÛÝ™]\Ù]œÝYÙHOOIØXØÛÝ[	Ê\™]\›ŽÂˆÛÛœÝ[XZ[Yš\œÝ[ÛÝYÚYÛ™Y[•ŒÍ

NÂˆYŠ[XZ[
^ÂˆÛÛœÝÝ\œ™[\›ÛÝœ]Y\žTÙ[XÝÜŠ	ËŒÍXXØÛÝ[\ÚYÛ™YZ[‰ÊNÂˆYŠÝ\œ™[	‰˜Ý\œ™[™]\Ù]™[XZ[OOY[XZ[
\™]\›ŽÂˆ™[™\‘š\œÝ[XØÛÝ[ŒÍ
›ÛÝ[XZ[
NÂˆ™]\›ŽÂˆBˆÛÛœÝÙ[™\›ÛÝœ]Y\žTÙ[XÝÜŠ	ÈÙš\œÝ[”Ù[™[šÕŒÍ	ÊNÂˆÛÛœÝÝ]\Ï\›ÛÝœ]Y\žTÙ[XÝÜŠ	ÈÙš\œÝ[XØÛÝ[Ý]\ÕŒÍ	ÊNÂˆYŠÙ[™
^ÂˆÛÛœÝ™XYOYš\œÝ[ÛÝY™XYUŒÍ

NÂˆÙ[™™\ØX›YH\™XYNÂˆÛÛœÝY\ÜØYÙO\™XYOÉøàèxàï8àêøà¨¸àâxàë8à®xà¤¹aiyb¦øàeøài¸àcøàh8àexàa8à ‰Î‰øà¨¸àªøà©¸àìøàâ9ªgú ïxà¤¹®¥¹`¦xàeøài¸àa8ào¸àfxà ¹o¡xàgøàf¸àjøà®xà«xààøàåøàfxà¢øàdøàj8à ¸àiøàcxào¸àfxà ‰ÎÂˆYŠÝ]\É‰ˆ\Ý]\Ë™]\Ù]œ™\Ý[	‰œÝ]\Ë^ÛÛ[OO[Y\ÜØYÙJ\Ý]\Ë^ÛÛ[[Y\ÜØYÙNÂˆBˆÛÛœÝY[“›ÝXÙOYš\œÝ[ÛÝYØ\™ŒÍ

OËœ]Y\žTÙ[XÝÜËŠ	Ë™™\K\Þ[˜Ë[›ÝXÙIÊNÂˆYŠÝ]\É‰šY[“›ÝXÙJ^ÂˆÛÛœÝY\ÜØYÙOTÝš[™ÊY[“›ÝXÙK^ÛÛ[	ÉÊKš[J
NÂˆÝ]\Ë™]\Ù]œ™\Ý[IÌIÎÂˆYŠÝ]\Ë^ÛÛ[OO[Y\ÜØYÙJ\Ý]\Ë^ÛÛ[[Y\ÜØYÙNÂˆÝ]\Ë˜Û\ÜÓ\ÝÙÙÛJ	Ú\ËY\œ›Ü‰ËY[“›ÝXÙK˜Û\ÜÓ\Ý˜ÛÛZ[œÊ	Ù\œ›Ü‰ÊJNÂˆÝ]\Ë˜Û\ÜÓ\ÝÙÙÛJ	Ú\Ë\ÝXØÙ\ÜÉËY[“›ÝXÙK˜Û\ÜÓ\Ý˜ÛÛZ[œÊ	ÜÝXØÙ\ÜÉÊJNÂˆYŠY[“›ÝXÙK˜Û\ÜÓ\Ý˜ÛÛZ[œÊ	ÜÝXØÙ\ÜÉÊI‰œÙ[™
\Ù[™™\ØX›YY˜[ÙNÂˆBŸB‚™[˜Ý[ÛˆØ]Úš\œÝ[ÛÝYŒÍ

^ÂˆÝÜš\œÝ[ÛÝYØ]ÚŒÍ

NÂˆYŠ\[Ùˆ]]][Û“ØœÙ\™\OOIÙ[˜Ý[Û‰Ê^Âˆš\œÝ[ÛÝYØœÙ\™\•ŒÍ[™]È]]][Û“ØœÙ\™\Š\]Qš\œÝ[ÛÝYÝ]UŒÍ
NÂˆš\œÝ[ÛÝYØœÙ\™\•ŒÍ›ØœÙ\™JØÝ[Y[˜›Ù_ØÝ[Y[™ØÝ[Y[[[Y[ØÚ[\ÝYKÝX™YNYKÚ\˜XÝ\‘]NY_JNÂˆBˆš\œÝ[ÛÝYÛŒÍ\Ù][\˜[
\]Qš\œÝ[ÛÝYÝ]UŒÍÍL
NÂˆÙ][Y[Ý]
\]Qš\œÝ[ÛÝYÝ]UŒÍ
NÂŸB‚™[˜Ý[Ûˆ™[™\‘š\œÝ[”Ú[ŒÍ
›ÛÝÝ\]KXY
^Âˆ›ÛÝœ™\XÙPÚ[™[Š
NÂˆ›ÛÝ˜\[™
š\œÝ[‘ÝZYY›ÙUŒÍ
	Ù]‰Ë	ÝŒÍ\Ý\	Ë8à®xàá¸ààøàåÈ	ÜÝ\HÈ	Ùš\œÝ[‘ÝZYYÝ[Ý\ÕŒÍ

_X
JNÂˆ›ÛÝ˜\[™
š\œÝ[‘ÝZYY›ÙUŒÍ
	ÚIË	ÉË]JJNÂˆ›ÛÝ˜\[™
š\œÝ[‘ÝZYY›ÙUŒÍ
	Ü	Ë	ÝŒÍ[XY	ËXY
JNÂŸB‚™[˜Ý[ÛˆY˜[˜ÙT\Ýš\œÝ[XØÛÝ[ŒÍ
[ÙJ^ÂˆÜš]UZTÝ]JÖÑ’T”ÕÔ•S—ÐPÐÓÕS•ÔÕUWÕŒÍN›[Ù_JNÂˆÝÜš\œÝ[ÛÝYØ]ÚŒÍ

NÂˆÛÛœÝ›ÛÝYØÝ[Y[™Ù][[Y[žRY
	Ùš\œÝ[‘ÝZYYŒÍ	ÊNÂˆYŠš\œÝ[“™YYÔÙ][™ÜÕŒÍ

J\™[™\‘š\œÝ[”Ù][™ÜÕŒÍ
›ÛÝ
NÂˆ[ÙHÝ\š\œÝ[‘XYÛ›ÜÝXÕŒÍ

NÂŸB‚™[˜Ý[Ûˆ™[™\‘š\œÝ[XØÛÝ[ŒÍ
›ÛÝÚYÛ™Y[‘[XZ[IÉÊ^Âˆ›ÛÝ™]\Ù]œÝYÙOIØXØÛÝ[	ÎÂˆ™[™\‘š\œÝ[”Ú[ŒÍ
›ÛÝK	øàëxà¬8à©8àìøàîùænúc,‰Ë	øà¨¸àªøà©¸àìøàâ8à¤¹/oøàa¸àj8à yêëù§*øà¤¹¦ïøàb8àgøàj8àcxà ¹ki¹ïä¸àáøàï8à¯øà¤¹o%xàcyí¦xàd¸ào¸àfxà ¸àëxà¬8à©8àìøàføàf¸à xàdøàk¹êëù§*øàh8àdxàiùiâøà xà¢øàdøàj8à ¸àiøàcxào¸àfxà ‰ÊNÂ‚ˆYŠÚYÛ™Y[‘[XZ[
^ÂˆÛÛœÝÚYÛ™YYš\œÝ[‘ÝZYY›ÙUŒÍ
	Ù]‰Ë	ÝŒÍXXØÛÝ[\ÚYÛ™YZ[‰ÊNÂˆÚYÛ™Y™]\Ù]™[XZ[\ÚYÛ™Y[‘[XZ[ÂˆÚYÛ™Y˜\[™
š\œÝ[‘ÝZYY›ÙUŒÍ
	ÜÜ[‰Ë	ÝŒÍXXØÛÝ[ZXÛÛ‰Ë	ø§$ÉÊJNÂˆÛÛœÝÛÜOYš\œÝ[‘ÝZYY›ÙUŒÍ
	Ù]‰Ë	ÉÊNÂˆÛÜK˜\[™
š\œÝ[‘ÝZYY›ÙUŒÍ
	Ø‰Ë	ÉË	øàëxà¬8à©8àìù®"8àoøàiøàfIÊJNÂˆÛÜK˜\[™
š\œÝ[‘ÝZYY›ÙUŒÍ
	ÜÜ[‰Ë	ÉËÚYÛ™Y[‘[XZ[
JNÂˆÚYÛ™Y˜\[™
ÛÜJNÜ›ÛÝ˜\[™
ÚYÛ™Y
NÂˆÛÛœÝ™^Yš\œÝ[‘ÝZYY›ÙUŒÍ
	Ø]Û‰Ë	ÝŒÍ\š[X\žIË	øàdøàk¸à¨¸àªøà©¸àìøàâ8àiùí¦¸àdxà¢È8¡¤‰ÊNÂˆ™^\OIØ]Û‰ÎÛ™^šYIÙš\œÝ[XØÛÝ[ÛÛ[YUŒÍ	ÎÂˆ™^˜Y]™[\Ý[™\Š	ØÛXÚÉË

OO˜Y˜[˜ÙT\Ýš\œÝ[XØÛÝ[ŒÍ
	ÜÚYÛ™YZ[‰ÊJNÂˆ›ÛÝ˜\[™
™^
NÂˆY[Ù^ÂˆÛÛœÝ›Ü›OYš\œÝ[‘ÝZYY›ÙUŒÍ
	Ù]‰Ë	ÝŒÍXXØÛÝ[Y›Ü›IÊNÂˆÛÛœÝX™[Yš\œÝ[‘ÝZYY›ÙUŒÍ
	ÛX™[	Ë	ÝŒÍ[X™[	Ë	øàèxàï8àêøà¨¸àâxàë8à®IÊNÛX™[š[›ÜIÙš\œÝ[‘[XZ[ŒÍ	ÎÂˆÛÛœÝ[XZ[Yš\œÝ[‘ÝZYY›ÙUŒÍ
	Ú[œ]	Ë	ÉÊNÙ[XZ[šYIÙš\œÝ[‘[XZ[ŒÍ	ÎÙ[XZ[\OIÙ[XZ[	ÎÙ[XZ[˜]]ØÛÛ\]OIÙ[XZ[	ÎÙ[XZ[š[œ][ÙOIÙ[XZ[	ÎÙ[XZ[œXÙZÛ\IÞ[ÝP^[\K˜ÛÛIÎÂˆÛÛœÝÙ[™Yš\œÝ[‘ÝZYY›ÙUŒÍ
	Ø]Û‰Ë	ÝŒÍ\š[X\žIË	øàëxà¬8à©8àìøàîùænúc,¸àê¸àìøà«øà¤º` xà¢ÉÊNÜÙ[™\OIØ]Û‰ÎÜÙ[™šYIÙš\œÝ[”Ù[™[šÕŒÍ	ÎÜÙ[™™\ØX›Y]YNÂˆÙ[™˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOžÂˆÛÛœÝ˜[YOTÝš[™Ê[XZ[˜[Y_	ÉÊKš[J
NÂˆÛÛœÝÝ]\Ï\›ÛÝœ]Y\žTÙ[XÝÜŠ	ÈÙš\œÝ[XØÛÝ[Ý]\ÕŒÍ	ÊNÂˆYŠK×–×—ÐJÐ×—ÐJ×–×—ÐJÉË\Ý
˜[YJJ^ÂˆÝ]\Ë™]\Ù]œ™\Ý[IÌIÎÜÝ]\Ë˜Û\ÜÓ˜[YOIÝŒÍXXØÛÝ[\Ý]\È\ËY\œ›Ü‰ÎÜÝ]\Ë^ÛÛ[Iù«høàeøàa9oh¹o#øàk¸àèxàï8àêøà¨¸àâxàë8à®xà¤¹aiyb¦øàeøài¸àcøàh8àexàa8à ‰ÎÙ[XZ[™›ØÝ\Ê
NÜ™]\›ŽÂˆBˆÛÛœÝÛÝY[XZ[Yš\œÝ[ÛÝYØ\™ŒÍ

OËœ]Y\žTÙ[XÝÜËŠ	ÈØÛÝYÞ[˜Ñ[XZ[ŒÍ‰ÊNÂˆÛÛœÝÛÝYÙ[™Yš\œÝ[ÛÝYØ\™ŒÍ

OËœ]Y\žTÙ[XÝÜËŠ	ÖÙ]K\Þ[˜ËXXÝ[ÛHœÙ[™[[šÈ—IÊNÂˆYŠXÛÝY[XZ[XÛÝYÙ[™
^ÂˆÝ]\Ë™]\Ù]œ™\Ý[IÌIÎÜÝ]\Ë˜Û\ÜÓ˜[YOIÝŒÍXXØÛÝ[\Ý]\È\ËY\œ›Ü‰ÎÜÝ]\Ë^ÛÛ[Iøà¨¸àªøà©¸àìøàâ9ªgú ïxà¤¹®¥¹`¦xàiøàcxào¸àføà¤øàiøàeøàgøà º`&¹/èyâ­¹¡bøà¤¹è®º*£xàfxà¢øàbøà xàëxà¬8à©8àìøàføàf¸àjú`,¸à¤øàiøàcøàh8àexàa8à ‰ÎÜ™]\›ŽÂˆBˆÛÝY[XZ[˜[YO]˜[YNÜÝ]\Ë™]\Ù]œ™\Ý[IÌIÎÜÝ]\Ë˜Û\ÜÓ˜[YOIÝŒÍXXØÛÝ[\Ý]\ÉÎÜÝ]\Ë^ÛÛ[Iøàëxà¬8à©8àìøàê¸àìøà«øà¤º` y/èxàeøài¸àa8ào¸àfx )‰ÎÜÙ[™™\ØX›Y]YNØÛÝYÙ[™˜ÛXÚÊ
NÂˆÙ][Y[Ý]
\]Qš\œÝ[ÛÝYÝ]UŒÍL
NÂˆJNÂˆ›Ü›K˜\[™
X™[[XZ[Ù[™
NÜ›ÛÝ˜\[™
›Ü›JNÂˆ›ÛÝ˜\[™
š\œÝ[‘ÝZYY›ÙUŒÍ
	Ù]‰Ë	ÝŒÍXXØÛÝ[Z[	Ë	ùb'xà xài¸àk¹¥®xàkøà xàèxàï8àêøàjùlb¸àcøàê¸àìøà«øà¤ºe¢øàcøàj9ænúc,¸àc9k£9.¡¸àeøào¸àfxà ¸àäxà®xàëøàï8àâxàkù.#z) xàiøàfxà ‰ÊJNÂˆÛÛœÝÝ]\ÏYš\œÝ[‘ÝZYY›ÙUŒÍ
	Ù]‰Ë	ÝŒÍXXØÛÝ[\Ý]\ÉË	øà¨¸àªøà©¸àìøàâ9ªgú ïxà¤¹®¥¹`¦xàeøài¸àa8ào¸àfxà ¹o¡xàgøàf¸àjøà®xà«xààøàåøàfxà¢øàdøàj8à ¸àiøàcxào¸àfxà ‰ÊNÜÝ]\ËšYIÙš\œÝ[XØÛÝ[Ý]\ÕŒÍ	ÎÜÝ]\ËœÙ]]šX]J	Ü›ÛIË	ÜÝ]\ÉÊNÜ›ÛÝ˜\[™
Ý]\ÊNÂˆÛÛœÝÚÚ\Yš\œÝ[‘ÝZYY›ÙUŒÍ
	Ø]Û‰Ë	ÝŒÍ\ÙXÛÛ™\žIË	øàëxà¬8à©8àìøàføàf¸àjùiâøà xà¢ÉÊNÜÚÚ\\OIØ]Û‰ÎÜÚÚ\šYIÙš\œÝ[XØÛÝ[ÚÚ\ŒÍ	ÎÜÚÚ\˜Y]™[\Ý[™\Š	ØÛXÚÉË

OO˜Y˜[˜ÙT\Ýš\œÝ[XØÛÝ[ŒÍ
	ÜÚÚ\Y	ÊJNÜ›ÛÝ˜\[™
ÚÚ\
NÂˆB‚ˆÛÛœÝš]˜XÞOYš\œÝ[‘ÝZYY›ÙUŒÍ
	Ü	Ë	ÝŒÍ\š]˜XÞIÊNÂˆš]˜XÞK˜\[™
	øà¨¸àªøà©¸àìøàâ9b*yå*8àjøài8àa8ài¸àkÈ	ÊNÂˆÛÛœÝ[šÏYš\œÝ[‘ÝZYY›ÙUŒÍ
	ØIË	ÉË	øàåøàêxà©8àä8à­øàï8àçxàê¸à­øàï	ÊNÛ[šËš™YIË‹Üš]˜XÞKš[	ÎÛ[šË\™Ù]I×Ø›[šÉÎÛ[šËœ™[IÛ›ÛÜ[™\‰ÎÂˆš]˜XÞK˜\[™
[šË	È8à¤¸àe9è®º*£xàcøàh8àexàa8à ‰ÊNÜ›ÛÝ˜\[™
š]˜XÞJNÂˆØ]Úš\œÝ[ÛÝYŒÍ

NÂŸB‚™[˜Ý[Ûˆ™[™\‘š\œÝ[”Ù][™ÜÕŒÍ
›ÛÝ
^ÂˆYŠ\›ÛÝ
\™]\›ŽÂˆ›ÛÝ™]\Ù]œÝYÙOIÜÙ][™ÜÉÎÂˆÛÛœÝÝ[Yš\œÝ[‘ÝZYYÝ[Ý\ÕŒÍ

NÂˆ™[™\‘š\œÝ[”Ú[ŒÍ
›ÛÝÝ[LK	ùki¹ïäº*"9å.øàk¹gî¹®¥¸à¤º*+yk¦‰Ë	ùcåúj$ù.¢9k¦¹¥éxàjy¥éxàjù/oøàb8à¢ù¦`ºe¤øà¤º*+yk¦¸àeøào¸àfxà ¹k§ùb¦ú*.¹¥«xàk¹íd9§§8àj9d"8à£øàføài¸à y§ 9b'xàk¸à#9.â¹¥éxàk¹ki¹ïä¸à#xà¤¹/g8à¢¸ào¸àfxà ‰ÊNÂˆ]Ù[XÝYS[X™\Š›Ùš[OËœÙ][™ÜÏËœÝYSZ[]\Ê_ŒÂˆÛÛœÝ™\Ù]ÏVÌÌKŒLNÚYŠ\™\Ù]Ëš[˜ÛY\ÊÙ[XÝY
J\Ù[XÝYMŒÂ‚ˆÛÛœÝšY[ÏYš\œÝ[‘ÝZYY›ÙUŒÍ
	Ù]‰Ë	ÝŒÍ\Ù][™ÜËYšY[ÉÊNÂˆÛÛœÝ]QšY[Yš\œÝ[‘ÝZYY›ÙUŒÍ
	Ù]‰Ë	ÝŒÍYšY[	ÊNÂˆÛÛœÝ]SX™[Yš\œÝ[‘ÝZYY›ÙUŒÍ
	ÛX™[	Ë	ÝŒÍ[X™[	Ë	ùcåúj$ù.¢9k¦¹¥éIÊNÙ]SX™[š[›ÜIÙš\œÝ[‘^[Q]UŒÍ	ÎÂˆÛÛœÝ]OYš\œÝ[‘ÝZYY›ÙUŒÍ
	Ú[œ]	Ë	ÉÊNÙ]K\OIÙ]IÎÙ]KšYIÙš\œÝ[‘^[Q]UŒÍ	ÎÙ]K›Z[Yš\œÝ[‘]RÙ^UŒÍ

NÙ]K˜[YO\›Ùš[OËœÙ][™ÜÏË™^[Q]_	ÉÎÂˆ]QšY[˜\[™
]SX™[]Kš\œÝ[‘ÝZYY›ÙUŒÍ
	Ù]‰Ë	ÝŒÍZ[	Ë	ù«¢øà¢¹¥éy¥l8àjùd"8à£øàføài¸à y¥¬:)£ùki¹ïä¸àîùoªyïä¸àîùæí9bcy§'øàkº,¨:#møà¤º*¯ù¥m8àeøào¸àfxà ‰ÊJNÂˆÛÛœÝZ[]\ÑšY[Yš\œÝ[‘ÝZYY›ÙUŒÍ
	Ù]‰Ë	ÝŒÍYšY[	ÊNÛZ[]\ÑšY[˜\[™
š\œÝ[‘ÝZYY›ÙUŒÍ
	Ù]‰Ë	ÝŒÍ[X™[	Ë	Ìy¥éxàk¹ki¹ïä¹¦`ºe¤ÉÊJNÂˆÛÛœÝZ[]P]ÛœÏYš\œÝ[‘ÝZYY›ÙUŒÍ
	Ù]‰Ë	ÝŒÍ[Z[]\ÉÊNÂˆ™\Ù]Ë™›Ü‘XXÚ
˜[YOOžÂˆÛÛœÝ]ÛYš\œÝ[‘ÝZYY›ÙUŒÍ
	Ø]Û‰Ë	ÝŒÍ[Z[]IË	Ý˜[Y_yb!˜
NØ]Û‹\OIØ]Û‰ÎØ]Û‹™]\Ù]›Z[]\ÏTÝš[™Ê˜[YJNØ]Û‹œÙ]]šX]J	Ø\šXK\™\ÜÙY	ËÝš[™Ê˜[YOOO\Ù[XÝY
JNÂˆ]Û‹˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOžÜÙ[XÝY]˜[YNÛZ[]P]ÛœËœ]Y\žTÙ[XÝÜ[
	ËŒÍ[Z[]IÊK™›Ü‘XXÚ
][OOš][KœÙ]]šX]J	Ø\šXK\™\ÜÙY	ËÝš[™Ê[X™\Š][K™]\Ù]›Z[]\ÊOOO\Ù[XÝY
JJNßJNÂˆZ[]P]ÛœË˜\[™
]ÛŠNÂˆJNÂˆZ[]\ÑšY[˜\[™
Z[]P]ÛœËš\œÝ[‘ÝZYY›ÙUŒÍ
	Ù]‰Ë	ÝŒÍZ[	Ë	øà`¸àj8àbøà¢xà#:*"9å.øà#xàiøàa8ài8àiøà ¹i"y¦í8àiøàcxào¸àfxà ‰ÊJNÂˆšY[Ë˜\[™
]QšY[Z[]\ÑšY[
NÜ›ÛÝ˜\[™
šY[ÊNÂˆÛÛœÝ\œ›ÜYš\œÝ[‘ÝZYY›ÙUŒÍ
	Ù]‰Ë	ÝŒÍY\œ›Ü‰ÊNÙ\œ›Ü‹šYIÙš\œÝ[”Ù][™ÜÑ\œ›Ü•ŒÍ	ÎÜ›ÛÝ˜\[™
\œ›ÜŠNÂˆÛÛœÝÝX›Z]Yš\œÝ[‘ÝZYY›ÙUŒÍ
	Ø]Û‰Ë	ÝŒÍ\š[X\žIË	ú*+yk¦¸à¤¹/çykf8àeøài¹k§ùb¦ú*.¹¥«xàn8¡¤‰ÊNÜÝX›Z]\OIØ]Û‰ÎÜÝX›Z]šYIÙš\œÝ[”Ù][™ÜÐÛÛ[YUŒÍ	ÎÂˆÝX›Z]˜Y]™[\Ý[™\Š	ØÛXÚÉË

OOžÂˆÛÛœÝ^[OTÝš[™Ê]K˜[Y_	ÉÊKš[J
NÂˆYŠY^[J^Ù\œ›Ü‹^ÛÛ[Iùcåúj$ù.¢9k¦¹¥éxà¤º`n8à¤øàiøàcøàh8àexàa8à ‰ÎÙ\œ›Ü‹˜Û\ÜÓ\Ý˜Y
	ÜÚÝÉÊNÙ]K™›ØÝ\Ê
NÜ™]\›ŽßBˆYŠ^[Oš\œÝ[‘]RÙ^UŒÍ

J^Ù\œ›Ü‹^ÛÛ[Iùcåúj$ù.¢9k¦¹¥éxàkù.â¹¥éy.ézfcxàk¹¥éy.æ8à¤º`n8à¤øàiøàcøàh8àexàa8à ‰ÎÙ\œ›Ü‹˜Û\ÜÓ\Ý˜Y
	ÜÚÝÉÊNÙ]K™›ØÝ\Ê
NÜ™]\›ŽßBˆ\œ›Ü‹˜Û\ÜÓ\Ýœ™[[Ý™J	ÜÚÝÉÊNÜÝX›Z]™\ØX›Y]YNÜÝX›Z]^ÛÛ[Iù/çykf8àeøài¸àa8ào¸àfx )‰ÎÂˆ›Ùš[KœÙ][™ÜÏ\›Ùš[KœÙ][™ÜßßNÜ›Ùš[KœÙ][™ÜËœÝYSZ[]\Ï\Ù[XÝYÜ›Ùš[KœÙ][™ÜË™^[Q]OY^[NÜ›Ùš[KœÙ][™ÜË˜]]ÔXÙO]YNÂˆYŠ\Ø]™T›Ùš[J
J^ÂˆÝX›Z]™\ØX›YY˜[ÙNÜÝX›Z]^ÛÛ[Iú*+yk¦¸à¤¹/çykf8àeøài¹k§ùb¦ú*.¹¥«xàn8¡¤‰ÎÙ\œ›Ü‹^ÛÛ[Iú*+yk¦¸à¤¹/çykf8àiøàcxào¸àføà¤øàiøàeøàgøà ¹l$xàeùo¡xàhøài¸àbøà¢xà xà ¸àa¹. 9n©¸àbº*i¸àeøàcøàh8àexàa8à ‰ÎÙ\œ›Ü‹˜Û\ÜÓ\Ý˜Y
	ÜÚÝÉÊNÜ™]\›ŽÂˆBˆÝ\š\œÝ[‘XYÛ›ÜÝXÕŒÍ

NÂˆJNÂˆ›ÛÝ˜\[™
ÝX›Z]
NÂŸB‚™[˜Ý[Ûˆ™\\™Qš\œÝ[‘XYÛ›ÜÝXÒXY[™ÕŒÍ

^ÂˆÛÛœÝXYYØÝ[Y[œ]Y\žTÙ[XÝÜŠ	ÈÙXYÛ›ÜÝXÈœØÜ™Y[‹ZXYˆ]‰ÊNÂˆYŠZXY
\™]\›ŽÂˆ]Ý\ZXYœ]Y\žTÙ[XÝÜŠ	ËŒÍYXYÛ›ÜÝXË\Ý\	ÊNÂˆYŠ\Ý\
^ÜÝ\Yš\œÝ[‘ÝZYY›ÙUŒÍ
	Ù]‰Ë	ÝŒÍ\Ý\ŒÍYXYÛ›ÜÝXË\Ý\	ÊNÚXYœ™\[™
Ý\
NßBˆÝ\^ÛÛ[X8à®xàá¸ààøàåÈ	Ùš\œÝ[‘ÝZYYÝ[Ý\ÕŒÍ

_HÈ	Ùš\œÝ[‘ÝZYYÝ[Ý\ÕŒÍ

_XÂŸB‚™[˜Ý[ÛˆÝ\š\œÝ[‘XYÛ›ÜÝXÕŒÍ

^ÂˆØÝ[Y[™Ù][[Y[žRY
	Ùš\œÝ[‘ÝZYYŒÍ	ÊOËœ™[[Ý™J
NÂˆš\œÝ[‘ÝZYYÙ\ÜÚ[Û•ŒÍ]YNÂˆØÝ[Y[˜›ÙK˜Û\ÜÓ\Ý˜Y
	Ù™\]Y\ÝYš\œÝ\[‹]ŒÍ	ÊNÂˆ™\\™Qš\œÝ[‘XYÛ›ÜÝXÒXY[™ÕŒÍ

NÂˆÝ\XYÛ›ÜÝXÑ›ÝÊ˜[ÙJNÂˆ\\ÝÜžT™\XÙJ	ÙXYÛ›ÜÝXÉË
NÂŸB‚™[˜Ý[Ûˆš[š\ÚÝZYYXYÛ›ÜÝXÕŒÍ

^Âˆž^Ù[œÝ\™UÙ^T[”Û˜\ÚÝ
YJ_XØ]Ú
ÙJ^ßBˆÜš]UZTÝ]JÖÑ’T”ÕÔ•S—ÐPÐÓÕS•ÔÕUWÕŒÍNœ™XYZTÝ]J
OË–Ñ’T”ÕÔ•S—ÐPÐÓÕS•ÔÕUWÕŒÍ_	ÜÚÚ\Y	ËØÜ™Y[Ž‰ÚÛYIßJNÂˆš\œÝ[‘ÝZYYÙ\ÜÚ[Û•ŒÍY˜[ÙNÂˆÝÜš\œÝ[ÛÝYØ]ÚŒÍ

NÂˆØÝ[Y[˜›ÙK˜Û\ÜÓ\Ýœ™[[Ý™J	Ù™\]Y\ÝYš\œÝ\[‹]ŒÍ	ÊNÂˆØÝ[Y[œ]Y\žTÙ[XÝÜŠ	ËŒÍYXYÛ›ÜÝXË\Ý\	ÊOËœ™[[Ý™J
NÂˆØÝ[Y[™Ù][[Y[žRY
	Ùš\œÝ[‘ÝZYYŒÍ	ÊOËœ™[[Ý™J
NÂˆÜšYÚ[˜[ÚÝÔØÜ™Y[•ŒÍ
	ÚÛYIËÜ™\XÙR\ÝÜžNYK[œÝ[Y_JNÂˆ™Yœ™\Ú›Ùš[URJ
NÂˆ™]\›ˆYNÂŸB‚™[˜Ý[Ûˆ[œÝ[š\œÝ[‘ÝZYYŒÍ

^ÂˆYŠš\œÝ[‘^\Ý[™ÓX\›™\•ŒÍ

J^ÂˆØÝ[Y[˜›ÙK˜Û\ÜÓ\Ýœ™[[Ý™J	Ù™\]Y\ÝYš\œÝ\[‹]ŒÍ	ÊNÂˆ™]\›ˆ˜[ÙNÂˆBˆš\œÝ[‘ÝZYYÙ\ÜÚ[Û•ŒÍ]YNÂˆYŠVÌ‹×Kš[˜ÛY\Ê[X™\Š™XYZTÝ]J
OË–Ñ’T”ÕÔ•S—ÕÕSÔÕT×ÕŒÍJJJ^ÂˆÜš]UZTÝ]JÖÑ’T”ÕÔ•S—ÕÕSÔÕT×ÕŒÍN™š\œÝ[“™YYÔÙ][™ÜÕŒÍ

OÌÎŒŸJNÂˆBˆØÝ[Y[˜›ÙK˜Û\ÜÓ\Ý˜Y
	Ù™\]Y\ÝYš\œÝ\[‹]ŒÍ	ÊNÂˆØÝ[Y[™Ù][[Y[žRY
	Ùš\œÝ[‘^\šY[˜ÙUŒÍ	ÊOËœ™[[Ý™J
NÂˆÛÛœÝÛYOYØÝ[Y[™Ù][[Y[žRY
	ÚÛYIÊNÚYŠZÛYJ\™]\›ˆ˜[ÙNÂˆ]›ÛÝYØÝ[Y[™Ù][[Y[žRY
	Ùš\œÝ[‘ÝZYYŒÍ	ÊNÂˆYŠ\›ÛÝ
^Ü›ÛÝYš\œÝ[‘ÝZYY›ÙUŒÍ
	ÜÙXÝ[Û‰Ë	Ùš\œÝ\[‹YÝZYY]ŒÍ	ÊNÜ›ÛÝšYIÙš\œÝ[‘ÝZYYŒÍ	ÎÜ›ÛÝœÙ]]šX]J	Ø\šXK[X™[	Ë	ùb'yfçº*+yk¦‰ÊNÚÛYKœ™\[™
›ÛÝ
NßBˆYŠš\œÝ[XØÛÝ[\ÜÙYŒÍ

J^ÂˆYŠš\œÝ[“™YYÔÙ][™ÜÕŒÍ

J\™[™\‘š\œÝ[”Ù][™ÜÕŒÍ
›ÛÝ
NÂˆ[ÙHÝ\š\œÝ[‘XYÛ›ÜÝXÕŒÍ

NÂˆY[ÙH™[™\‘š\œÝ[XØÛÝ[ŒÍ
›ÛÝš\œÝ[ÛÝYÚYÛ™Y[•ŒÍ

JNÂˆÜšYÚ[˜[ÚÝÔØÜ™Y[•ŒÍ
	ÚÛYIËÜ™\XÙR\ÝÜžNYK[œÝ[Y_JNÂˆ™]\›ˆYNÂŸB‚œÚÝÔØÜ™Y[Y[˜Ý[ÛŠYÜÏ^ßJ^ÂˆYŠš\œÝ[‘ÝZYYXÝ]™UŒÍ

I‰ˆVÉÚÛYIË	ÙXYÛ›ÜÝXÉ×Kš[˜ÛY\ÊY
J^ÂˆYYØÝ[Y[™Ù][[Y[žRY
	ÙXYÛ›ÜÝXÉÊOË˜Û\ÜÓ\Ý˜ÛÛZ[œÊ	ØXÝ]™IÊOÉÙXYÛ›ÜÝXÉÎ‰ÚÛYIÎÂˆBˆ™]\›ˆÜšYÚ[˜[ÚÝÔØÜ™Y[•ŒÍ
YÜÊNÂŸNÂ‚šYŠÜšYÚ[˜[™[™\‘š\œÝ[‘^\šY[˜ÙUŒÍ
^Âˆ™[™\‘š\œÝ[‘^\šY[˜ÙUŒÍY[˜Ý[ÛŠ
^ÂˆYŠš\œÝ[‘ÝZYYXÝ]™UŒÍ

J^ÙØÝ[Y[™Ù][[Y[žRY
	Ùš\œÝ[‘^\šY[˜ÙUŒÍ	ÊOËœ™[[Ý™J
NÜ™]\›ˆ˜[ÙNßBˆ™]\›ˆÜšYÚ[˜[™[™\‘š\œÝ[‘^\šY[˜ÙUŒÍ

NÂˆNÂŸB‚™ÛØ˜[\Ë‘’T”ÕÔ•S—ÑÕRQQÕŒÍÔÔPÏQ’T”ÕÔ•S—ÑÕRQQÕŒÍÔÔPÎÂ™ÛØ˜[\Ë™š\œÝ[‘^\Ý[™ÓX\›™\•ŒÍYš\œÝ[‘^\Ý[™ÓX\›™\•ŒÍÂ™ÛØ˜[\Ë™š\œÝ[‘ÝZYYXÝ]™UŒÍYš\œÝ[‘ÝZYYXÝ]™UŒÍÂ™ÛØ˜[\ËœÝ\š\œÝ[‘XYÛ›ÜÝXÕŒÍ\Ý\š\œÝ[‘XYÛ›ÜÝXÕŒÍÂ™ÛØ˜[\Ë™š[š\ÚÝZYYXYÛ›ÜÝXÕŒÍYš[š\ÚÝZYYXYÛ›ÜÝXÕŒÍÂ™ÛØ˜[\Ëš[œÝ[š\œÝ[‘ÝZYYŒÍZ[œÝ[š\œÝ[‘ÝZYYŒÍÂ‚šYŠØÝ[Y[œ™XYTÝ]OOOIÛØY[™ÉÊYØÝ[Y[˜Y]™[\Ý[™\Š	ÑÓPÛÛ[ØYY	Ë[œÝ[š\œÝ[‘ÝZYYŒÍÛÛ˜ÙNY_JNÂ™[ÙH[œÝ[š\œÝ[‘ÝZYYŒÍ

NÂ