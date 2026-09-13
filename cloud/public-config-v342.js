// FE QUEST v342 public cloud configuration.
// Publishable/anon keys are browser-public by design; secret/service-role keys are forbidden.
// This file is loaded after app-v377.js, so it may install public-safe metadata into QUESTION_BANK.
(function(root){
  'use strict';

  const IPA92_V7_METADATA=Object.freeze([
    {"id":"ipa92_a_mm1_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"M/M/1モデルの利用率","coreTopicId":"core_02_06","qualityAudit":"ipa92-original-v7"},
    {"id":"ipa92_a_mm1_002","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"M/M/1モデルの平均系内数","coreTopicId":"core_02_06","qualityAudit":"ipa92-original-v7"},
    {"id":"ipa92_a_charcode_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"Unicodeと文字コード","coreTopicId":"core_02_08","qualityAudit":"ipa92-original-v7"},
    {"id":"ipa92_a_charcode_002","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"UTF-8","coreTopicId":"core_02_08","qualityAudit":"ipa92-original-v7"},
    {"id":"ipa92_a_risc_cisc_001","sourcePool":"subject_a","cat":"コンピュータ構成要素","difficulty":"standard","concept":"RISC","coreTopicId":"core_04_01","qualityAudit":"ipa92-original-v7"},
    {"id":"ipa92_a_risc_cisc_002","sourcePool":"subject_a","cat":"コンピュータ構成要素","difficulty":"standard","concept":"CISC","coreTopicId":"core_04_01","qualityAudit":"ipa92-original-v7"},
    {"id":"ipa92_a_cache_write_001","sourcePool":"subject_a","cat":"コンピュータ構成要素","difficulty":"standard","concept":"ライトスルー方式","coreTopicId":"core_04_03","qualityAudit":"ipa92-original-v7"},
    {"id":"ipa92_a_cache_write_002","sourcePool":"subject_a","cat":"コンピュータ構成要素","difficulty":"standard","concept":"メモリインターリーブ","coreTopicId":"core_04_03","qualityAudit":"ipa92-original-v7"},
    {"id":"ipa92_a_kernel_arch_001","sourcePool":"subject_a","cat":"ソフトウェア","difficulty":"standard","concept":"マイクロカーネル","coreTopicId":"core_06_01","qualityAudit":"ipa92-original-v7"},
    {"id":"ipa92_a_kernel_arch_002","sourcePool":"subject_a","cat":"ソフトウェア","difficulty":"standard","concept":"モノリシックカーネル","coreTopicId":"core_06_01","qualityAudit":"ipa92-original-v7"},
    {"id":"ipa92_a_errorcode_001","sourcePool":"subject_a","cat":"ネットワーク","difficulty":"standard","concept":"ハミング符号","coreTopicId":"core_10_09","qualityAudit":"ipa92-original-v7"},
    {"id":"ipa92_a_errorcode_002","sourcePool":"subject_a","cat":"ネットワーク","difficulty":"standard","concept":"チェックサム","coreTopicId":"core_10_09","qualityAudit":"ipa92-original-v7"},
    {"id":"ipa92_a_balanced_tree_001","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"AVL木","coreTopicId":"core_03_01","qualityAudit":"ipa92-original-v7"},
    {"id":"ipa92_a_balanced_tree_002","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"B木","coreTopicId":"core_03_01","qualityAudit":"ipa92-original-v7"},
    {"id":"ipa92_a_shortest_path_001","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"ダイクストラ法","coreTopicId":"core_03_03","qualityAudit":"ipa92-original-v7"},
    {"id":"ipa92_a_shortest_path_002","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"ベルマンフォード法","coreTopicId":"core_03_03","qualityAudit":"ipa92-original-v7"}
  ].map(item=>Object.freeze(item)));

  function installV7Metadata(){
    try{
      if(IPA92_V7_METADATA.length!==16)return Object.freeze({ok:false,status:'v7-safe-metadata-invalid',added:0,total:IPA92_V7_METADATA.length});
      if(typeof QUESTION_BANK==='undefined'||!Array.isArray(QUESTION_BANK))return Object.freeze({ok:false,status:'subject-a-bank-unavailable',added:0,total:IPA92_V7_METADATA.length});
      const existing=new Set(QUESTION_BANK.map(item=>item?.id).filter(Boolean));
      let added=0;
      for(const item of IPA92_V7_METADATA){
        if(existing.has(item.id))continue;
        QUESTION_BANK.push({...item});
        existing.add(item.id);
        added++;
      }
      const complete=IPA92_V7_METADATA.every(item=>existing.has(item.id));
      return Object.freeze({ok:complete,status:complete?'installed':'incomplete',added,total:IPA92_V7_METADATA.length});
    }catch(error){
      return Object.freeze({ok:false,status:'install-failed',added:0,total:IPA92_V7_METADATA.length,error:String(error?.message||error)});
    }
  }

  function activateV7Provider(){
    const d=root.document;
    if(!d||typeof d.createElement!=='function')return Promise.resolve({ok:false,status:'document-unavailable'});
    if(root.FEQUEST_PROTECTED_CONTENT?.version==='v376-provider-4-ipa92-v1-v7'){
      const install=installV7Metadata();
      root.FEQUEST_IPA92_V7_SUBJECT_A_METADATA_INSTALL=install;
      return Promise.resolve({ok:install.ok,status:install.status,reused:true});
    }
    const id='fequest-ipa92-v7-provider';
    const existing=d.getElementById?.(id);
    if(existing){
      return new Promise(resolve=>{
        const finish=()=>{
          const install=installV7Metadata();
          root.FEQUEST_IPA92_V7_SUBJECT_A_METADATA_INSTALL=install;
          resolve({ok:install.ok,status:install.status,reused:true});
        };
        if(root.FEQUEST_PROTECTED_CONTENT?.version==='v376-provider-4-ipa92-v1-v7')return finish();
        existing.addEventListener('load',finish,{once:true});
        existing.addEventListener('error',()=>resolve({ok:false,status:'provider-load-failed',reused:true}),{once:true});
      });
    }
    return new Promise(resolve=>{
      const script=d.createElement('script');
      script.id=id;
      script.src='./assets/protected-content-provider-v376-v7.js';
      script.async=false;
      script.addEventListener('load',()=>{
        const install=installV7Metadata();
        root.FEQUEST_IPA92_V7_SUBJECT_A_METADATA_INSTALL=install;
        resolve({ok:install.ok&&root.FEQUEST_PROTECTED_CONTENT?.catalogTotal===1003,status:install.ok?'activated':'metadata-install-failed',reused:false});
      },{once:true});
      script.addEventListener('error',()=>resolve({ok:false,status:'provider-load-failed',reused:false}),{once:true});
      (d.head||d.body||d.documentElement).appendChild(script);
    });
  }

  root.FEQUEST_IPA92_V7_SUBJECT_A_METADATA=IPA92_V7_METADATA;
  root.FEQUEST_IPA92_V7_PROVIDER_READY=activateV7Provider();
  root.FEQUEST_PUBLIC_CLOUD_CONFIG_V342=Object.freeze({
    version:1,
    enabled:true,
    provider:'supabase',
    url:'https://gkvgxnkoypypikxtyeoz.supabase.co',
    publishableKey:'sb_publishable_kRxdzyfjBDHEd9xMamQpYg_C8reUast',
    redirectTo:'https://taiwanwan64.github.io/fe-quest/'
  });
})(typeof globalThis!=='undefined'?globalThis:this);
