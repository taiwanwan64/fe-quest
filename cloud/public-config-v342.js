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

  const IPA92_V8_METADATA=Object.freeze([
    {"id":"ipa92_a_sli_slo_001","sourcePool":"subject_a","cat":"サービスマネジメント","difficulty":"standard","concept":"SLIとSLO","coreTopicId":"core_15_02","qualityAudit":"ipa92-original-v8"},
    {"id":"ipa92_a_sli_slo_002","sourcePool":"subject_a","cat":"サービスマネジメント","difficulty":"standard","concept":"SLO","coreTopicId":"core_15_02","qualityAudit":"ipa92-original-v8"},
    {"id":"ipa92_a_service_request_001","sourcePool":"subject_a","cat":"サービスマネジメント","difficulty":"standard","concept":"サービス要求","coreTopicId":"core_15_08","qualityAudit":"ipa92-original-v8"},
    {"id":"ipa92_a_known_error_001","sourcePool":"subject_a","cat":"サービスマネジメント","difficulty":"standard","concept":"既知の誤り","coreTopicId":"core_15_08","qualityAudit":"ipa92-original-v8"},
    {"id":"ipa92_a_cloud_model_001","sourcePool":"subject_a","cat":"システム戦略","difficulty":"standard","concept":"SaaS","coreTopicId":"core_16_03","qualityAudit":"ipa92-original-v8"},
    {"id":"ipa92_a_cloud_model_002","sourcePool":"subject_a","cat":"システム戦略","difficulty":"standard","concept":"PaaSとIaaS","coreTopicId":"core_16_03","qualityAudit":"ipa92-original-v8"},
    {"id":"ipa92_a_cloud_deploy_001","sourcePool":"subject_a","cat":"システム戦略","difficulty":"standard","concept":"パブリッククラウドとプライベートクラウド","coreTopicId":"core_16_03","qualityAudit":"ipa92-original-v8"},
    {"id":"ipa92_a_cloud_deploy_002","sourcePool":"subject_a","cat":"システム戦略","difficulty":"standard","concept":"ハイブリッドクラウド","coreTopicId":"core_16_03","qualityAudit":"ipa92-original-v8"},
    {"id":"ipa92_a_ai_xai_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"XAI","coreTopicId":"core_02_05","qualityAudit":"ipa92-original-v8"},
    {"id":"ipa92_a_ai_hitl_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"HITL","coreTopicId":"core_02_05","qualityAudit":"ipa92-original-v8"},
    {"id":"ipa92_a_ai_hallucination_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"ハルシネーション","coreTopicId":"core_02_05","qualityAudit":"ipa92-original-v8"},
    {"id":"ipa92_a_ai_hallucination_002","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"生成AI出力の検証","coreTopicId":"core_02_05","qualityAudit":"ipa92-original-v8"},
    {"id":"ipa92_a_privacy_anon_001","sourcePool":"subject_a","cat":"企業と法務","difficulty":"standard","concept":"匿名加工情報","coreTopicId":"core_21_03","qualityAudit":"ipa92-original-v8"},
    {"id":"ipa92_a_privacy_pseudo_001","sourcePool":"subject_a","cat":"企業と法務","difficulty":"standard","concept":"仮名加工情報","coreTopicId":"core_21_03","qualityAudit":"ipa92-original-v8"},
    {"id":"ipa92_a_sme_fairtrade_001","sourcePool":"subject_a","cat":"企業と法務","difficulty":"standard","concept":"中小受託取引適正化法","coreTopicId":"core_21_04","qualityAudit":"ipa92-original-v8"},
    {"id":"ipa92_a_sme_fairtrade_002","sourcePool":"subject_a","cat":"企業と法務","difficulty":"standard","concept":"情報成果物作成委託","coreTopicId":"core_21_04","qualityAudit":"ipa92-original-v8"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V9_METADATA=Object.freeze([
    {"id":"ipa92_a_itil_001","sourcePool":"subject_a","cat":"サービスマネジメント","difficulty":"standard","concept":"ITIL","coreTopicId":"core_15_01","qualityAudit":"ipa92-original-v9"},
    {"id":"ipa92_a_jis20000_001","sourcePool":"subject_a","cat":"サービスマネジメント","difficulty":"standard","concept":"JIS Q 20000","coreTopicId":"core_15_01","qualityAudit":"ipa92-original-v9"},
    {"id":"ipa92_a_cab_001","sourcePool":"subject_a","cat":"サービスマネジメント","difficulty":"standard","concept":"CAB","coreTopicId":"core_15_08","qualityAudit":"ipa92-original-v9"},
    {"id":"ipa92_a_pir_001","sourcePool":"subject_a","cat":"サービスマネジメント","difficulty":"standard","concept":"PIR","coreTopicId":"core_15_08","qualityAudit":"ipa92-original-v9"},
    {"id":"ipa92_a_devops_001","sourcePool":"subject_a","cat":"ソフトウェア開発管理技術","difficulty":"standard","concept":"DevOps","coreTopicId":"core_13_01","qualityAudit":"ipa92-original-v9"},
    {"id":"ipa92_a_devsecops_001","sourcePool":"subject_a","cat":"ソフトウェア開発管理技術","difficulty":"standard","concept":"DevSecOps","coreTopicId":"core_13_01","qualityAudit":"ipa92-original-v9"},
    {"id":"ipa92_a_tdd_001","sourcePool":"subject_a","cat":"ソフトウェア開発管理技術","difficulty":"standard","concept":"テスト駆動開発（TDD）","coreTopicId":"core_13_01","qualityAudit":"ipa92-original-v9"},
    {"id":"ipa92_a_sre_001","sourcePool":"subject_a","cat":"ソフトウェア開発管理技術","difficulty":"standard","concept":"SRE","coreTopicId":"core_13_01","qualityAudit":"ipa92-original-v9"},
    {"id":"ipa92_a_mlops_001","sourcePool":"subject_a","cat":"ソフトウェア開発管理技術","difficulty":"standard","concept":"MLOps","coreTopicId":"core_13_01","qualityAudit":"ipa92-original-v9"},
    {"id":"ipa92_a_gdpr_001","sourcePool":"subject_a","cat":"企業と法務","difficulty":"standard","concept":"GDPR","coreTopicId":"core_21_03","qualityAudit":"ipa92-original-v9"},
    {"id":"ipa92_a_jis15001_001","sourcePool":"subject_a","cat":"企業と法務","difficulty":"standard","concept":"JIS Q 15001","coreTopicId":"core_21_03","qualityAudit":"ipa92-original-v9"},
    {"id":"ipa92_a_esign_law_001","sourcePool":"subject_a","cat":"企業と法務","difficulty":"standard","concept":"電子署名法","coreTopicId":"core_21_03","qualityAudit":"ipa92-original-v9"}
  ].map(item=>Object.freeze(item)));

  function installMetadata(items,label,expectedTotal){
    try{
      if(!Array.isArray(items)||items.length!==expectedTotal)return Object.freeze({ok:false,status:`${label}-safe-metadata-invalid`,added:0,total:items?.length||0});
      if(typeof QUESTION_BANK==='undefined'||!Array.isArray(QUESTION_BANK))return Object.freeze({ok:false,status:'subject-a-bank-unavailable',added:0,total:items.length});
      const existing=new Set(QUESTION_BANK.map(item=>item?.id).filter(Boolean));
      let added=0;
      for(const item of items){
        if(existing.has(item.id))continue;
        QUESTION_BANK.push({...item});
        existing.add(item.id);
        added++;
      }
      const complete=items.every(item=>existing.has(item.id));
      return Object.freeze({ok:complete,status:complete?'installed':'incomplete',added,total:items.length});
    }catch(error){
      return Object.freeze({ok:false,status:'install-failed',added:0,total:items?.length||0,error:String(error?.message||error)});
    }
  }
  function installV7Metadata(){return installMetadata(IPA92_V7_METADATA,'v7',16)}
  function installV8Metadata(){return installMetadata(IPA92_V8_METADATA,'v8',16)}
  function installV9Metadata(){return installMetadata(IPA92_V9_METADATA,'v9',12)}
  function finishLatestActivation(reused){
    const v7Install=installV7Metadata();
    const v8Install=installV8Metadata();
    const v9Install=installV9Metadata();
    root.FEQUEST_IPA92_V7_SUBJECT_A_METADATA_INSTALL=v7Install;
    root.FEQUEST_IPA92_V8_SUBJECT_A_METADATA_INSTALL=v8Install;
    root.FEQUEST_IPA92_V9_SUBJECT_A_METADATA_INSTALL=v9Install;
    const providerOk=root.FEQUEST_PROTECTED_CONTENT?.version==='v376-provider-6-ipa92-v1-v9'&&root.FEQUEST_PROTECTED_CONTENT?.catalogTotal===1031;
    const ok=providerOk&&v7Install.ok&&v8Install.ok&&v9Install.ok;
    return Object.freeze({ok,status:ok?'activated':'metadata-install-failed',reused,v7:v7Install,v8:v8Install,v9:v9Install});
  }

  function activateV9Provider(){
    const d=root.document;
    if(!d||typeof d.createElement!=='function')return Promise.resolve({ok:false,status:'document-unavailable'});
    if(root.FEQUEST_PROTECTED_CONTENT?.version==='v376-provider-6-ipa92-v1-v9')return Promise.resolve(finishLatestActivation(true));
    const id='fequest-ipa92-v9-provider';
    const existing=d.getElementById?.(id);
    if(existing){
      return new Promise(resolve=>{
        const finish=()=>resolve(finishLatestActivation(true));
        if(root.FEQUEST_PROTECTED_CONTENT?.version==='v376-provider-6-ipa92-v1-v9')return finish();
        existing.addEventListener('load',finish,{once:true});
        existing.addEventListener('error',()=>resolve({ok:false,status:'provider-load-failed',reused:true}),{once:true});
      });
    }
    return new Promise(resolve=>{
      const script=d.createElement('script');
      script.id=id;
      script.src='./assets/protected-content-provider-v376-v9.js';
      script.async=false;
      script.addEventListener('load',()=>resolve(finishLatestActivation(false)),{once:true});
      script.addEventListener('error',()=>resolve({ok:false,status:'provider-load-failed',reused:false}),{once:true});
      (d.head||d.body||d.documentElement).appendChild(script);
    });
  }

  root.FEQUEST_IPA92_V7_SUBJECT_A_METADATA=IPA92_V7_METADATA;
  root.FEQUEST_IPA92_V8_SUBJECT_A_METADATA=IPA92_V8_METADATA;
  root.FEQUEST_IPA92_V9_SUBJECT_A_METADATA=IPA92_V9_METADATA;
  const latestProviderReady=activateV9Provider();
  root.FEQUEST_IPA92_V9_PROVIDER_READY=latestProviderReady;
  // Backward-compatible readiness aliases: historical callers wait for the latest provider.
  root.FEQUEST_IPA92_V8_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V7_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_PUBLIC_CLOUD_CONFIG_V342=Object.freeze({
    version:1,
    enabled:true,
    provider:'supabase',
    url:'https://gkvgxnkoypypikxtyeoz.supabase.co',
    publishableKey:'sb_publishable_kRxdzyfjBDHEd9xMamQpYg_C8reUast',
    redirectTo:'https://taiwanwan64.github.io/fe-quest/'
  });
})(typeof globalThis!=='undefined'?globalThis:this);
