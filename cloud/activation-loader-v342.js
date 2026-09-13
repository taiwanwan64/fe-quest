// FE QUEST v342 cloud activation loader.
// Production intent: one same-origin entrypoint after the core application script.
// The learner app stays local-first: disabled config or any cloud asset/runtime failure is fail-open.
(function(root){
  'use strict';

  const PUBLIC_ENHANCEMENT_PATHS=Object.freeze([
    './assets/ipa92-sort-lab-v377.js',
    './assets/ipa92-graph-lab-v377.js',
    './assets/ipa92-modeling-lab-v377.js',
    './assets/ipa92-memory-lab-v377.js'
  ]);
  // Public-safe metadata only. Protected stems/options/answers/explanations remain in Supabase.
  // This script is intentionally loaded after app-v377.js so it can extend the existing lexical QUESTION_BANK
  // without rewriting the 1MB sanitized application bundle.
  const IPA92_SUBJECT_A_METADATA=Object.freeze([
    {"id":"ipa92_a_formal_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"基礎","concept":"正規表現","coreTopicId":"core_02_04","qualityAudit":"ipa92-original-v1","cognitiveLevel":"適用","applicationDemand":"文字列判定"},
    {"id":"ipa92_a_formal_002","sourcePool":"subject_a","cat":"基礎理論","difficulty":"標準","concept":"BNF","coreTopicId":"core_02_04","qualityAudit":"ipa92-original-v1","cognitiveLevel":"適用","applicationDemand":"生成規則追跡"},
    {"id":"ipa92_a_formal_003","sourcePool":"subject_a","cat":"基礎理論","difficulty":"標準","concept":"形式言語の閉包","coreTopicId":"core_02_04","qualityAudit":"ipa92-original-v1","cognitiveLevel":"判断","judgmentDemand":"Kleene閉包理解"},
    {"id":"ipa92_a_graph_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"基礎","concept":"有向グラフ","coreTopicId":"core_03_01","qualityAudit":"ipa92-original-v1","cognitiveLevel":"判断","judgmentDemand":"グラフ種別判定"},
    {"id":"ipa92_a_graph_002","sourcePool":"subject_a","cat":"基礎理論","difficulty":"標準","concept":"重み付きグラフ","coreTopicId":"core_03_01","qualityAudit":"ipa92-original-v1","cognitiveLevel":"適用","applicationDemand":"最短経路計算"},
    {"id":"ipa92_a_hypothesis_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"標準","concept":"仮説検定","coreTopicId":"core_02_06","qualityAudit":"ipa92-original-v1","cognitiveLevel":"適用","applicationDemand":"p値判断"},
    {"id":"ipa92_a_hypothesis_002","sourcePool":"subject_a","cat":"基礎理論","difficulty":"基礎","concept":"仮説検定の解釈","coreTopicId":"core_02_06","qualityAudit":"ipa92-original-v1","cognitiveLevel":"判断","judgmentDemand":"結論解釈"},
    {"id":"ipa92_a_hypothesis_003","sourcePool":"subject_a","cat":"基礎理論","difficulty":"標準","concept":"第1種の誤り","coreTopicId":"core_02_06","qualityAudit":"ipa92-original-v1","cognitiveLevel":"判断","judgmentDemand":"誤り分類"},
    {"id":"ipa92_a_markov_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"基礎","concept":"マルコフ過程","coreTopicId":"core_02_06","qualityAudit":"ipa92-original-v1","cognitiveLevel":"想起","recallDemand":"性質理解"},
    {"id":"ipa92_a_markov_002","sourcePool":"subject_a","cat":"基礎理論","difficulty":"標準","concept":"状態遷移確率","coreTopicId":"core_02_06","qualityAudit":"ipa92-original-v1","cognitiveLevel":"適用","applicationDemand":"確率計算"},
    {"id":"ipa92_a_predicate_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"基礎","concept":"述語論理","coreTopicId":"core_02_01","qualityAudit":"ipa92-original-v1","cognitiveLevel":"適用","applicationDemand":"論理式選択"},
    {"id":"ipa92_a_predicate_002","sourcePool":"subject_a","cat":"基礎理論","difficulty":"標準","concept":"述語論理の否定","coreTopicId":"core_02_01","qualityAudit":"ipa92-original-v1","cognitiveLevel":"判断","judgmentDemand":"量化記号の否定"},
    {"id":"ipa92_a_predicate_003","sourcePool":"subject_a","cat":"基礎理論","difficulty":"基礎","concept":"演繹推論と帰納推論","coreTopicId":"core_02_01","qualityAudit":"ipa92-original-v1","cognitiveLevel":"判断","judgmentDemand":"推論方式比較"},
    {"id":"ipa92_a_bitsync_001","sourcePool":"subject_a","cat":"ネットワーク","difficulty":"基礎","concept":"ビット同期","coreTopicId":"core_10_09","qualityAudit":"ipa92-original-v2","cognitiveLevel":"判断","judgmentDemand":"同期対象判定"},
    {"id":"ipa92_a_cnn_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"基礎","concept":"CNN","coreTopicId":"core_02_05","qualityAudit":"ipa92-original-v2","cognitiveLevel":"判断","judgmentDemand":"適用対象判定"},
    {"id":"ipa92_a_fdm_001","sourcePool":"subject_a","cat":"ネットワーク","difficulty":"基礎","concept":"周波数分割多重","coreTopicId":"core_10_01","qualityAudit":"ipa92-original-v2","cognitiveLevel":"判断","judgmentDemand":"多重化方式判定"},
    {"id":"ipa92_a_foundation_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"基礎","concept":"基盤モデル","coreTopicId":"core_02_05","qualityAudit":"ipa92-original-v2","cognitiveLevel":"想起","recallDemand":"概念理解"},
    {"id":"ipa92_a_framesync_001","sourcePool":"subject_a","cat":"ネットワーク","difficulty":"標準","concept":"フレーム同期","coreTopicId":"core_10_09","qualityAudit":"ipa92-original-v2","cognitiveLevel":"判断","judgmentDemand":"同期方式判定"},
    {"id":"ipa92_a_llm_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"標準","concept":"大規模言語モデル","coreTopicId":"core_02_05","qualityAudit":"ipa92-original-v2","cognitiveLevel":"判断","judgmentDemand":"生成原理理解"},
    {"id":"ipa92_a_modulation_001","sourcePool":"subject_a","cat":"ネットワーク","difficulty":"基礎","concept":"AM・FM・PM","coreTopicId":"core_10_01","qualityAudit":"ipa92-original-v2","cognitiveLevel":"判断","judgmentDemand":"変調方式判定"},
    {"id":"ipa92_a_pca_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"標準","concept":"主成分分析","coreTopicId":"core_02_05","qualityAudit":"ipa92-original-v2","cognitiveLevel":"適用","applicationDemand":"次元削減判断"},
    {"id":"ipa92_a_pcm_001","sourcePool":"subject_a","cat":"ネットワーク","difficulty":"基礎","concept":"PCM","coreTopicId":"core_10_01","qualityAudit":"ipa92-original-v2","cognitiveLevel":"適用","applicationDemand":"処理順序判定"},
    {"id":"ipa92_a_prompt_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"基礎","concept":"プロンプトエンジニアリング","coreTopicId":"core_02_05","qualityAudit":"ipa92-original-v2","cognitiveLevel":"適用","applicationDemand":"few-shot判定"},
    {"id":"ipa92_a_prompt_002","sourcePool":"subject_a","cat":"基礎理論","difficulty":"標準","concept":"プロンプト設計","coreTopicId":"core_02_05","qualityAudit":"ipa92-original-v2","cognitiveLevel":"判断","judgmentDemand":"指示明確化"},
    {"id":"ipa92_a_rnn_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"基礎","concept":"RNN","coreTopicId":"core_02_05","qualityAudit":"ipa92-original-v2","cognitiveLevel":"判断","judgmentDemand":"適用対象判定"},
    {"id":"ipa92_a_svm_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"標準","concept":"SVM","coreTopicId":"core_02_05","qualityAudit":"ipa92-original-v2","cognitiveLevel":"判断","judgmentDemand":"手法特徴判定"},
    {"id":"ipa92_a_tdm_001","sourcePool":"subject_a","cat":"ネットワーク","difficulty":"基礎","concept":"時分割多重","coreTopicId":"core_10_01","qualityAudit":"ipa92-original-v2","cognitiveLevel":"判断","judgmentDemand":"多重化方式判定"},
    {"id":"ipa92_a_2pc_001","sourcePool":"subject_a","cat":"データベース","difficulty":"標準","concept":"2相コミット","coreTopicId":"core_09_08","qualityAudit":"ipa92-original-v3","cognitiveLevel":"適用","applicationDemand":"処理順序判定"},
    {"id":"ipa92_a_2pc_002","sourcePool":"subject_a","cat":"データベース","difficulty":"標準","concept":"分散トランザクション","coreTopicId":"core_09_08","qualityAudit":"ipa92-original-v3","cognitiveLevel":"判断","judgmentDemand":"結果整合判定"},
    {"id":"ipa92_a_dfd_001","sourcePool":"subject_a","cat":"システム開発技術","difficulty":"標準","concept":"DFD","coreTopicId":"core_12_03","qualityAudit":"ipa92-original-v3","cognitiveLevel":"適用","applicationDemand":"要素識別"},
    {"id":"ipa92_a_distdb_001","sourcePool":"subject_a","cat":"データベース","difficulty":"基礎","concept":"分散データベースとレプリケーション","coreTopicId":"core_09_08","qualityAudit":"ipa92-original-v3","cognitiveLevel":"判断","judgmentDemand":"技術目的判定"},
    {"id":"ipa92_a_er_001","sourcePool":"subject_a","cat":"データベース","difficulty":"標準","concept":"E-R図とカーディナリティ","coreTopicId":"core_09_03","qualityAudit":"ipa92-original-v3","cognitiveLevel":"適用","applicationDemand":"多対多分解"},
    {"id":"ipa92_a_er_002","sourcePool":"subject_a","cat":"データベース","difficulty":"標準","concept":"E-R図と正規化","coreTopicId":"core_09_03","qualityAudit":"ipa92-original-v3","cognitiveLevel":"判断","judgmentDemand":"設計手法比較"},
    {"id":"ipa92_a_gpu_001","sourcePool":"subject_a","cat":"コンピュータ構成要素","difficulty":"基礎","concept":"GPUと並列処理","coreTopicId":"core_04_01","qualityAudit":"ipa92-original-v3","cognitiveLevel":"適用","applicationDemand":"適用対象判定"},
    {"id":"ipa92_a_pagefault_001","sourcePool":"subject_a","cat":"ソフトウェア","difficulty":"標準","concept":"TLBミスとページフォールト","coreTopicId":"core_06_01","qualityAudit":"ipa92-original-v3","cognitiveLevel":"適用","applicationDemand":"状態判定"},
    {"id":"ipa92_a_pagerepl_001","sourcePool":"subject_a","cat":"ソフトウェア","difficulty":"標準","concept":"FIFO・LRUページ置換","coreTopicId":"core_06_01","qualityAudit":"ipa92-original-v3","cognitiveLevel":"判断","judgmentDemand":"置換方式比較"},
    {"id":"ipa92_a_simd_001","sourcePool":"subject_a","cat":"コンピュータ構成要素","difficulty":"標準","concept":"SIMD","coreTopicId":"core_04_01","qualityAudit":"ipa92-original-v3","cognitiveLevel":"判断","judgmentDemand":"並列処理方式判定"},
    {"id":"ipa92_a_tlb_001","sourcePool":"subject_a","cat":"ソフトウェア","difficulty":"基礎","concept":"TLB","coreTopicId":"core_06_01","qualityAudit":"ipa92-original-v3","cognitiveLevel":"判断","judgmentDemand":"役割判定"},
    {"id":"ipa92_a_uml_001","sourcePool":"subject_a","cat":"システム開発技術","difficulty":"基礎","concept":"UMLクラス図","coreTopicId":"core_12_03","qualityAudit":"ipa92-original-v3","cognitiveLevel":"判断","judgmentDemand":"図の用途判定"},
    {"id":"ipa92_a_nfv_001","sourcePool":"subject_a","cat":"ネットワーク","difficulty":"標準","concept":"NFV","coreTopicId":"core_10_10","qualityAudit":"ipa92-original-v4","cognitiveLevel":"適用","applicationDemand":"SDN・NFV比較"},
    {"id":"ipa92_a_oauth_001","sourcePool":"subject_a","cat":"セキュリティ","difficulty":"基礎","concept":"OAuth","coreTopicId":"core_11_08","qualityAudit":"ipa92-original-v4","cognitiveLevel":"判断","judgmentDemand":"認可方式判定"},
    {"id":"ipa92_a_oauth_002","sourcePool":"subject_a","cat":"セキュリティ","difficulty":"基礎","concept":"認証と認可","coreTopicId":"core_11_08","qualityAudit":"ipa92-original-v4","cognitiveLevel":"判断","judgmentDemand":"概念比較"},
    {"id":"ipa92_a_oauth_003","sourcePool":"subject_a","cat":"セキュリティ","difficulty":"標準","concept":"OAuthアクセストークン","coreTopicId":"core_11_08","qualityAudit":"ipa92-original-v4","cognitiveLevel":"適用","applicationDemand":"トークン役割判定"},
    {"id":"ipa92_a_openflow_001","sourcePool":"subject_a","cat":"ネットワーク","difficulty":"標準","concept":"OpenFlow","coreTopicId":"core_10_10","qualityAudit":"ipa92-original-v4","cognitiveLevel":"判断","judgmentDemand":"SDN関連技術判定"},
    {"id":"ipa92_a_reliability_001","sourcePool":"subject_a","cat":"システム構成要素","difficulty":"基礎","concept":"フェールセーフ","coreTopicId":"core_05_04","qualityAudit":"ipa92-original-v4","cognitiveLevel":"適用","applicationDemand":"信頼性設計判定"},
    {"id":"ipa92_a_reliability_002","sourcePool":"subject_a","cat":"システム構成要素","difficulty":"標準","concept":"フェールソフト","coreTopicId":"core_05_04","qualityAudit":"ipa92-original-v4","cognitiveLevel":"適用","applicationDemand":"縮退運転判定"},
    {"id":"ipa92_a_reliability_003","sourcePool":"subject_a","cat":"システム構成要素","difficulty":"標準","concept":"フォールトアボイダンスとフォールトトレラント","coreTopicId":"core_05_04","qualityAudit":"ipa92-original-v4","cognitiveLevel":"判断","judgmentDemand":"信頼性設計比較"},
    {"id":"ipa92_a_rlo_001","sourcePool":"subject_a","cat":"サービスマネジメント","difficulty":"標準","concept":"RLO","coreTopicId":"core_15_08","qualityAudit":"ipa92-original-v4","cognitiveLevel":"判断","judgmentDemand":"復旧水準判定"},
    {"id":"ipa92_a_rpo_001","sourcePool":"subject_a","cat":"サービスマネジメント","difficulty":"標準","concept":"RPO","coreTopicId":"core_15_08","qualityAudit":"ipa92-original-v4","cognitiveLevel":"適用","applicationDemand":"データ復旧時点判定"},
    {"id":"ipa92_a_rto_001","sourcePool":"subject_a","cat":"サービスマネジメント","difficulty":"基礎","concept":"RTO","coreTopicId":"core_15_08","qualityAudit":"ipa92-original-v4","cognitiveLevel":"適用","applicationDemand":"復旧目標判定"},
    {"id":"ipa92_a_sdn_001","sourcePool":"subject_a","cat":"ネットワーク","difficulty":"基礎","concept":"SDN","coreTopicId":"core_10_10","qualityAudit":"ipa92-original-v4","cognitiveLevel":"判断","judgmentDemand":"技術特徴判定"},
    {"id":"ipa92_a_bisection_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"二分法","coreTopicId":"core_02_07","qualityAudit":"ipa92-original-v5"},
    {"id":"ipa92_a_ddd_001","sourcePool":"subject_a","cat":"ソフトウェア","difficulty":"standard","concept":"DDDとユビキタス言語","coreTopicId":"core_12_04","qualityAudit":"ipa92-original-v5"},
    {"id":"ipa92_a_eoq_001","sourcePool":"subject_a","cat":"企業と法務","difficulty":"standard","concept":"EOQ","coreTopicId":"core_20_03","qualityAudit":"ipa92-original-v5"},
    {"id":"ipa92_a_error_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"丸め誤差と打切り誤差","coreTopicId":"core_02_07","qualityAudit":"ipa92-original-v5"},
    {"id":"ipa92_a_inspection_001","sourcePool":"subject_a","cat":"ソフトウェア","difficulty":"standard","concept":"インスペクション","coreTopicId":"core_12_08","qualityAudit":"ipa92-original-v5"},
    {"id":"ipa92_a_inventory_001","sourcePool":"subject_a","cat":"企業と法務","difficulty":"standard","concept":"定量発注方式と発注点","coreTopicId":"core_20_03","qualityAudit":"ipa92-original-v5"},
    {"id":"ipa92_a_lp_001","sourcePool":"subject_a","cat":"企業と法務","difficulty":"standard","concept":"線形計画法の目的関数","coreTopicId":"core_20_03","qualityAudit":"ipa92-original-v5"},
    {"id":"ipa92_a_lp_002","sourcePool":"subject_a","cat":"企業と法務","difficulty":"standard","concept":"線形計画法の制約条件","coreTopicId":"core_20_03","qualityAudit":"ipa92-original-v5"},
    {"id":"ipa92_a_mvc_001","sourcePool":"subject_a","cat":"ソフトウェア","difficulty":"standard","concept":"MVC","coreTopicId":"core_12_04","qualityAudit":"ipa92-original-v5"},
    {"id":"ipa92_a_newton_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"ニュートン法","coreTopicId":"core_02_07","qualityAudit":"ipa92-original-v5"},
    {"id":"ipa92_a_pwm_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"PWMとデューティ比","coreTopicId":"core_02_09","qualityAudit":"ipa92-original-v5"},
    {"id":"ipa92_a_pwm_002","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"PWM出力","coreTopicId":"core_02_09","qualityAudit":"ipa92-original-v5"},
    {"id":"ipa92_a_refactor_001","sourcePool":"subject_a","cat":"ソフトウェア","difficulty":"standard","concept":"リファクタリング","coreTopicId":"core_12_08","qualityAudit":"ipa92-original-v5"},
    {"id":"ipa92_a_review_001","sourcePool":"subject_a","cat":"ソフトウェア","difficulty":"standard","concept":"ウォークスルー","coreTopicId":"core_12_08","qualityAudit":"ipa92-original-v5"},
    {"id":"ipa92_a_solid_001","sourcePool":"subject_a","cat":"ソフトウェア","difficulty":"standard","concept":"SOLID 単一責任の原則","coreTopicId":"core_12_04","qualityAudit":"ipa92-original-v5"},
    {"id":"ipa92_a_symbolic_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"数式処理","coreTopicId":"core_02_07","qualityAudit":"ipa92-original-v5"},
    {"id":"ipa92_a_ajax_001","sourcePool":"subject_a","cat":"プログラミング","difficulty":"standard","concept":"Ajax","coreTopicId":"core_03_05","qualityAudit":"ipa92-original-v6"},
    {"id":"ipa92_a_coding_standard_001","sourcePool":"subject_a","cat":"ソフトウェア","difficulty":"standard","concept":"コーディング標準","coreTopicId":"core_12_06","qualityAudit":"ipa92-original-v6"},
    {"id":"ipa92_a_control_break_001","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"コントロールブレーク","coreTopicId":"core_03_03","qualityAudit":"ipa92-original-v6"},
    {"id":"ipa92_a_decision_table_001","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"決定表","coreTopicId":"core_03_02","qualityAudit":"ipa92-original-v6"},
    {"id":"ipa92_a_decision_table_002","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"決定表の規則列","coreTopicId":"core_03_02","qualityAudit":"ipa92-original-v6"},
    {"id":"ipa92_a_heap_sort_001","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"ヒープソート","coreTopicId":"core_03_03","qualityAudit":"ipa92-original-v6"},
    {"id":"ipa92_a_heap_sort_002","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"最大ヒープ","coreTopicId":"core_03_03","qualityAudit":"ipa92-original-v6"},
    {"id":"ipa92_a_insertion_sort_001","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"挿入ソート","coreTopicId":"core_03_03","qualityAudit":"ipa92-original-v6"},
    {"id":"ipa92_a_insertion_sort_002","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"挿入ソートの途中状態","coreTopicId":"core_03_03","qualityAudit":"ipa92-original-v6"},
    {"id":"ipa92_a_merge_sort_001","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"マージソートの基本動作","coreTopicId":"core_03_03","qualityAudit":"ipa92-original-v6"},
    {"id":"ipa92_a_merge_sort_002","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"マージソートと分割統治","coreTopicId":"core_03_03","qualityAudit":"ipa92-original-v6"},
    {"id":"ipa92_a_shell_sort_001","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"シェルソート","coreTopicId":"core_03_03","qualityAudit":"ipa92-original-v6"},
    {"id":"ipa92_a_shell_sort_002","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"シェルソートのギャップ","coreTopicId":"core_03_03","qualityAudit":"ipa92-original-v6"},
    {"id":"ipa92_a_static_analysis_001","sourcePool":"subject_a","cat":"ソフトウェア","difficulty":"standard","concept":"静的解析","coreTopicId":"core_12_06","qualityAudit":"ipa92-original-v6"},
    {"id":"ipa92_a_string_match_001","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"文字列照合","coreTopicId":"core_03_03","qualityAudit":"ipa92-original-v6"},
    {"id":"ipa92_a_web_role_001","sourcePool":"subject_a","cat":"プログラミング","difficulty":"standard","concept":"Webクライアントとサーバの役割","coreTopicId":"core_03_05","qualityAudit":"ipa92-original-v6"}
  ].map(item=>Object.freeze(item)));
  const ACTIVATION_SPEC=Object.freeze({
    version:'v342',
    configPath:'./cloud/public-config-v342.js',
    stylePath:'./cloud/sync-ui-v342.css',
    sdkPath:'./vendor/supabase/supabase-2.112.3.js',
    modulePaths:Object.freeze([
      './cloud/sync-contract-v342.js',
      './cloud/sync-state-v342.js',
      './cloud/sync-engine-v342.js',
      './cloud/supabase/transport-v342.js',
      './cloud/supabase/auth-boundary-v342.js',
      './cloud/production-adapter-v342.js',
      './cloud/reconciliation-v342.js',
      './cloud/local-reconciliation-adapter-v342.js',
      './cloud/sync-controller-v342.js',
      './cloud/sync-ui-v342.js',
      './cloud/runtime-bootstrap-v342.js'
    ]),
    policy:'same-origin-pinned-sdk-fail-open-local-first'
  });

  function installIpa92SubjectAMetadata(){
    try{
      if(IPA92_SUBJECT_A_METADATA.length!==83)return Object.freeze({ok:false,status:'ipa92-safe-metadata-unavailable',added:0,total:IPA92_SUBJECT_A_METADATA.length});
      if(typeof QUESTION_BANK==='undefined'||!Array.isArray(QUESTION_BANK))return Object.freeze({ok:false,status:'subject-a-bank-unavailable',added:0});
      const existing=new Set(QUESTION_BANK.map(item=>item?.id).filter(Boolean));
      let added=0;
      for(const item of IPA92_SUBJECT_A_METADATA){
        if(existing.has(item.id))continue;
        QUESTION_BANK.push({...item});
        existing.add(item.id);
        added++;
      }
      const complete=IPA92_SUBJECT_A_METADATA.every(item=>existing.has(item.id));
      return Object.freeze({ok:complete,status:complete?'installed':'incomplete',added,total:IPA92_SUBJECT_A_METADATA.length});
    }catch(error){
      return Object.freeze({ok:false,status:'install-failed',added:0,error:String(error?.message||error)});
    }
  }

  function localAssetPath(value){
    const path=String(value||'');
    if(!/^\.\/[A-Za-z0-9_./-]+$/.test(path)||path.includes('..'))throw new TypeError('cloud activation asset must be a fixed same-origin relative path');
    return path;
  }
  function assetId(kind,path){return `fequest-v342-${kind}-${path.replace(/[^a-z0-9]+/gi,'-')}`}

  function installConnectivityNoticeRecovery(){
    const d=root.document;
    if(!d||typeof root.addEventListener!=='function')return false;
    if(root.FEQUEST_V342_CONNECTIVITY_NOTICE_RECOVERY_INSTALLED)return true;
    const clearStaleOfflineNotice=()=>{
      try{
        if(root.navigator?.onLine!==true)return false;
        const notice=d.getElementById?.('appNotice');
        if(!notice||!notice.classList?.contains('offline'))return false;
        notice.className='app-notice';
        return true;
      }catch(_e){return false}
    };
    root.addEventListener('online',clearStaleOfflineNotice);
    root.addEventListener('pageshow',clearStaleOfflineNotice);
    root.FEQUEST_V342_CONNECTIVITY_NOTICE_RECOVERY_INSTALLED=true;
    clearStaleOfflineNotice();
    return true;
  }

  function defaultLoadScript(path,doc){
    const p=localAssetPath(path),d=doc||root.document;
    if(!d||typeof d.createElement!=='function')return Promise.reject(new Error('document unavailable'));
    const id=assetId('script',p),existing=d.getElementById?.(id);
    if(existing){
      if(existing.dataset?.loaded==='true')return Promise.resolve({ok:true,path:p,reused:true});
      return new Promise((resolve,reject)=>{existing.addEventListener('load',()=>resolve({ok:true,path:p,reused:true}),{once:true});existing.addEventListener('error',()=>reject(new Error(`failed to load ${p}`)),{once:true})});
    }
    return new Promise((resolve,reject)=>{
      const el=d.createElement('script');el.id=id;el.src=p;el.async=false;el.defer=false;
      el.addEventListener('load',()=>{try{el.dataset.loaded='true'}catch(_e){}resolve({ok:true,path:p,reused:false})},{once:true});
      el.addEventListener('error',()=>reject(new Error(`failed to load ${p}`)),{once:true});
      (d.head||d.body||d.documentElement).appendChild(el);
    });
  }

  function defaultLoadStyle(path,doc){
    const p=localAssetPath(path),d=doc||root.document;
    if(!d||typeof d.createElement!=='function')return Promise.reject(new Error('document unavailable'));
    const id=assetId('style',p),existing=d.getElementById?.(id);
    if(existing)return Promise.resolve({ok:true,path:p,reused:true});
    return new Promise((resolve,reject)=>{
      const el=d.createElement('link');el.id=id;el.rel='stylesheet';el.href=p;
      el.addEventListener('load',()=>resolve({ok:true,path:p,reused:false}),{once:true});
      el.addEventListener('error',()=>reject(new Error(`failed to load ${p}`)),{once:true});
      (d.head||d.documentElement).appendChild(el);
    });
  }

  function loadPublicEnhancements(){
    for(const path of PUBLIC_ENHANCEMENT_PATHS){
      defaultLoadScript(path).catch(error=>{try{console.warn(`FE QUEST public enhancement failed: ${path}; core study continues`,error)}catch(_e){}});
    }
    return true;
  }

  function createActivationLoader(options={}){
    const loadScript=typeof options.loadScript==='function'?options.loadScript:(path=>defaultLoadScript(path,options.document));
    const loadStyle=typeof options.loadStyle==='function'?options.loadStyle:(path=>defaultLoadStyle(path,options.document));
    const warn=typeof options.warn==='function'?options.warn:((...args)=>{try{console.warn(...args)}catch(_e){}});
    let runtime=null,startPromise=null,stopped=false;

    function currentConfig(){return options.config??root.FEQUEST_PUBLIC_CLOUD_CONFIG_V342??null}

    async function ensureConfig(){
      const present=currentConfig();
      if(present)return {ok:true,config:present,loaded:false};
      try{await loadScript(ACTIVATION_SPEC.configPath)}catch(error){return {ok:false,status:'config-load-failed',error}}
      const config=currentConfig();
      if(!config)return {ok:false,status:'config-missing'};
      return {ok:true,config,loaded:true};
    }

    async function startInner(){
      if(stopped)return {ok:false,status:'stopped'};
      const configResult=await ensureConfig();
      if(!configResult.ok)return configResult;
      const config=configResult.config;
      if(!config||config.enabled!==true)return {ok:true,status:'disabled',configLoaded:configResult.loaded};

      try{await loadStyle(ACTIVATION_SPEC.stylePath)}catch(error){warn('FE QUEST cloud style failed; local study continues',error);return {ok:false,status:'asset-load-failed',asset:ACTIVATION_SPEC.stylePath,error}}
      const scripts=[ACTIVATION_SPEC.sdkPath,...ACTIVATION_SPEC.modulePaths];
      for(const path of scripts){
        try{await loadScript(path)}catch(error){warn(`FE QUEST cloud asset failed: ${path}; core study continues`,error);return {ok:false,status:'asset-load-failed',asset:path,error}}
      }

      const factory=typeof options.runtimeFactory==='function'?options.runtimeFactory:root.FEQUEST_CLOUD_RUNTIME_V342?.createCloudRuntime;
      if(typeof factory!=='function')return {ok:false,status:'runtime-missing'};
      let candidate;
      try{candidate=factory(options.runtimeOptions?{...options.runtimeOptions,config}:{config})}catch(error){warn('FE QUEST cloud runtime assembly failed; local study continues',error);return {ok:false,status:'runtime-assembly-failed',error}}
      if(!candidate||candidate.ok!==true||typeof candidate.start!=='function')return {ok:false,status:candidate?.status||'runtime-not-ready',error:candidate?.error};
      runtime=candidate;
      let result;
      try{result=await runtime.start()}catch(error){warn('FE QUEST cloud runtime start failed; local study continues',error);return {ok:false,status:'runtime-start-failed',error}}
      if(!result||result.ok!==true)return {ok:false,status:result?.status||'runtime-start-failed',result};
      return {ok:true,status:'started',runtimeStatus:result.status||'started'};
    }

    function start(){
      if(startPromise)return startPromise;
      startPromise=Promise.resolve().then(startInner);
      return startPromise;
    }
    function stop(){
      stopped=true;
      try{runtime&&runtime.stop&&runtime.stop()}catch(_e){}
      return true;
    }
    function snapshot(){return Object.freeze({started:Boolean(runtime),stopped,config:Boolean(currentConfig()),policy:ACTIVATION_SPEC.policy})}
    return Object.freeze({start,stop,snapshot});
  }

  function autoStart(){
    installConnectivityNoticeRecovery();
    loadPublicEnhancements();
    const loader=createActivationLoader();
    root.FEQUEST_CLOUD_ACTIVATION_INSTANCE_V342=loader;
    loader.start().catch(error=>{try{console.warn('FE QUEST cloud activation failed; local study continues',error)}catch(_e){}});
    return loader;
  }

  const metadataInstall=installIpa92SubjectAMetadata();
  root.FEQUEST_IPA92_SUBJECT_A_METADATA=IPA92_SUBJECT_A_METADATA;
  root.FEQUEST_IPA92_SUBJECT_A_METADATA_INSTALL=metadataInstall;
  const api=Object.freeze({ACTIVATION_SPEC,PUBLIC_ENHANCEMENT_PATHS,IPA92_SUBJECT_A_METADATA,installIpa92SubjectAMetadata,localAssetPath,installConnectivityNoticeRecovery,loadPublicEnhancements,createActivationLoader,autoStart});
  root.FEQUEST_CLOUD_ACTIVATION_V342=api;
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  if(typeof document!=='undefined')Promise.resolve().then(()=>autoStart());
})(typeof globalThis!=='undefined'?globalThis:this);
