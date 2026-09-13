// FE QUEST IPA Ver.9.2 question batch v7 public-safe runtime metadata.
// Protected stems/options/answers/explanations remain in Supabase/private source.
(function(root){
  'use strict';
  const METADATA=Object.freeze([
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

  function install(){
    try{
      if(METADATA.length!==16)return Object.freeze({ok:false,status:'v7-safe-metadata-invalid',added:0,total:METADATA.length});
      if(typeof QUESTION_BANK==='undefined'||!Array.isArray(QUESTION_BANK))return Object.freeze({ok:false,status:'subject-a-bank-unavailable',added:0,total:METADATA.length});
      const existing=new Set(QUESTION_BANK.map(item=>item?.id).filter(Boolean));
      let added=0;
      for(const item of METADATA){
        if(existing.has(item.id))continue;
        QUESTION_BANK.push({...item});
        existing.add(item.id);
        added++;
      }
      const complete=METADATA.every(item=>existing.has(item.id));
      return Object.freeze({ok:complete,status:complete?'installed':'incomplete',added,total:METADATA.length});
    }catch(error){
      return Object.freeze({ok:false,status:'install-failed',added:0,total:METADATA.length,error:String(error?.message||error)});
    }
  }

  const installResult=install();
  root.FEQUEST_IPA92_V7_SUBJECT_A_METADATA=METADATA;
  root.FEQUEST_IPA92_V7_SUBJECT_A_METADATA_INSTALL=installResult;
  root.FEQUEST_IPA92_V7_RUNTIME=Object.freeze({version:'v377-ipa92-v7-runtime-1',metadata:METADATA,install});
})(typeof globalThis!=='undefined'?globalThis:this);
