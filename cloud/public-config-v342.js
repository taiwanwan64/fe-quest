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

  const IPA92_V10_METADATA=Object.freeze([
    {"id":"ipa92_a_wcag_001","sourcePool":"subject_a","cat":"ユーザーインタフェース","difficulty":"standard","concept":"WCAG","coreTopicId":"core_08_02","qualityAudit":"ipa92-original-v10"},
    {"id":"ipa92_a_responsive_001","sourcePool":"subject_a","cat":"ユーザーインタフェース","difficulty":"standard","concept":"レスポンシブWebデザイン","coreTopicId":"core_08_02","qualityAudit":"ipa92-original-v10"},
    {"id":"ipa92_a_heuristic_eval_001","sourcePool":"subject_a","cat":"ユーザーインタフェース","difficulty":"standard","concept":"ヒューリスティック評価","coreTopicId":"core_08_02","qualityAudit":"ipa92-original-v10"},
    {"id":"ipa92_a_usability_test_001","sourcePool":"subject_a","cat":"ユーザーインタフェース","difficulty":"standard","concept":"ユーザビリティテスト","coreTopicId":"core_08_02","qualityAudit":"ipa92-original-v10"},
    {"id":"ipa92_a_three_schema_001","sourcePool":"subject_a","cat":"データベース","difficulty":"standard","concept":"3層スキーマ・外部スキーマ","coreTopicId":"core_09_01","qualityAudit":"ipa92-original-v10"},
    {"id":"ipa92_a_three_schema_002","sourcePool":"subject_a","cat":"データベース","difficulty":"standard","concept":"概念スキーマと内部スキーマ","coreTopicId":"core_09_01","qualityAudit":"ipa92-original-v10"},
    {"id":"ipa92_a_nosql_types_001","sourcePool":"subject_a","cat":"データベース","difficulty":"standard","concept":"キーバリュー型データベース","coreTopicId":"core_09_08","qualityAudit":"ipa92-original-v10"},
    {"id":"ipa92_a_nosql_types_002","sourcePool":"subject_a","cat":"データベース","difficulty":"standard","concept":"ドキュメント指向データベース","coreTopicId":"core_09_08","qualityAudit":"ipa92-original-v10"},
    {"id":"ipa92_a_csma_001","sourcePool":"subject_a","cat":"ネットワーク","difficulty":"standard","concept":"CSMA/CD","coreTopicId":"core_10_02","qualityAudit":"ipa92-original-v10"},
    {"id":"ipa92_a_csma_002","sourcePool":"subject_a","cat":"ネットワーク","difficulty":"standard","concept":"CSMA/CA","coreTopicId":"core_10_02","qualityAudit":"ipa92-original-v10"},
    {"id":"ipa92_a_spanning_tree_001","sourcePool":"subject_a","cat":"ネットワーク","difficulty":"standard","concept":"スパニングツリー","coreTopicId":"core_10_02","qualityAudit":"ipa92-original-v10"},
    {"id":"ipa92_a_radius_001","sourcePool":"subject_a","cat":"ネットワーク","difficulty":"standard","concept":"RADIUS","coreTopicId":"core_10_10","qualityAudit":"ipa92-original-v10"},
    {"id":"ipa92_a_qos_001","sourcePool":"subject_a","cat":"ネットワーク","difficulty":"standard","concept":"QoS","coreTopicId":"core_10_10","qualityAudit":"ipa92-original-v10"},
    {"id":"ipa92_a_secure_boot_001","sourcePool":"subject_a","cat":"セキュリティ","difficulty":"standard","concept":"セキュアブート","coreTopicId":"core_11_08","qualityAudit":"ipa92-original-v10"},
    {"id":"ipa92_a_stub_001","sourcePool":"subject_a","cat":"システム開発技術","difficulty":"standard","concept":"スタブ","coreTopicId":"core_12_05","qualityAudit":"ipa92-original-v10"},
    {"id":"ipa92_a_condition_coverage_001","sourcePool":"subject_a","cat":"システム開発技術","difficulty":"standard","concept":"条件網羅","coreTopicId":"core_12_05","qualityAudit":"ipa92-original-v10"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V11_METADATA=Object.freeze([
    {"id":"ipa92_a_platform_law_001","sourcePool":"subject_a","cat":"企業と法務","difficulty":"standard","concept":"情報流通プラットフォーム対処法","coreTopicId":"core_21_03","qualityAudit":"ipa92-original-v11"},
    {"id":"ipa92_a_platform_law_002","sourcePool":"subject_a","cat":"企業と法務","difficulty":"standard","concept":"情報流通プラットフォーム対処法と発信者情報","coreTopicId":"core_21_03","qualityAudit":"ipa92-original-v11"},
    {"id":"ipa92_a_cloud_native_001","sourcePool":"subject_a","cat":"システム戦略","difficulty":"standard","concept":"クラウドネイティブ","coreTopicId":"core_16_03","qualityAudit":"ipa92-original-v11"},
    {"id":"ipa92_a_cloud_native_002","sourcePool":"subject_a","cat":"システム戦略","difficulty":"standard","concept":"クラウドリフトとクラウドネイティブ","coreTopicId":"core_16_03","qualityAudit":"ipa92-original-v11"},
    {"id":"ipa92_a_cloud_by_default_001","sourcePool":"subject_a","cat":"システム戦略","difficulty":"standard","concept":"クラウドバイデフォルト","coreTopicId":"core_16_03","qualityAudit":"ipa92-original-v11"},
    {"id":"ipa92_a_cloud_by_default_002","sourcePool":"subject_a","cat":"システム戦略","difficulty":"standard","concept":"クラウドバイデフォルトの判断","coreTopicId":"core_16_03","qualityAudit":"ipa92-original-v11"},
    {"id":"ipa92_a_test_driver_001","sourcePool":"subject_a","cat":"システム開発技術","difficulty":"standard","concept":"ドライバ","coreTopicId":"core_12_05","qualityAudit":"ipa92-original-v11"},
    {"id":"ipa92_a_test_driver_002","sourcePool":"subject_a","cat":"システム開発技術","difficulty":"standard","concept":"スタブとドライバ","coreTopicId":"core_12_05","qualityAudit":"ipa92-original-v11"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V12_METADATA=Object.freeze([
    {"id":"ipa92_a_sysml_001","sourcePool":"subject_a","cat":"システム開発技術","difficulty":"standard","concept":"SysML","coreTopicId":"core_12_02","qualityAudit":"ipa92-original-v12"},
    {"id":"ipa92_a_sysml_002","sourcePool":"subject_a","cat":"システム開発技術","difficulty":"standard","concept":"SysMLとUML","coreTopicId":"core_12_02","qualityAudit":"ipa92-original-v12"},
    {"id":"ipa92_a_user_story_001","sourcePool":"subject_a","cat":"システム開発技術","difficulty":"standard","concept":"ユーザーストーリー","coreTopicId":"core_12_02","qualityAudit":"ipa92-original-v12"},
    {"id":"ipa92_a_user_story_002","sourcePool":"subject_a","cat":"システム開発技術","difficulty":"standard","concept":"ユーザーストーリーと受入条件","coreTopicId":"core_12_02","qualityAudit":"ipa92-original-v12"},
    {"id":"ipa92_a_usecase_001","sourcePool":"subject_a","cat":"システム開発技術","difficulty":"standard","concept":"ユースケース図","coreTopicId":"core_12_03","qualityAudit":"ipa92-original-v12"},
    {"id":"ipa92_a_mockup_001","sourcePool":"subject_a","cat":"システム開発技術","difficulty":"standard","concept":"モックアップ","coreTopicId":"core_12_03","qualityAudit":"ipa92-original-v12"},
    {"id":"ipa92_a_prototype_001","sourcePool":"subject_a","cat":"ソフトウェア開発管理技術","difficulty":"standard","concept":"プロトタイピング","coreTopicId":"core_13_01","qualityAudit":"ipa92-original-v12"},
    {"id":"ipa92_a_mockup_prototype_001","sourcePool":"subject_a","cat":"ソフトウェア開発管理技術","difficulty":"standard","concept":"モックアップとプロトタイプ","coreTopicId":"core_13_01","qualityAudit":"ipa92-original-v12"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V13_METADATA=Object.freeze([
    {"id":"ipa92_a_low_code_001","sourcePool":"subject_a","cat":"ソフトウェア開発管理技術","difficulty":"standard","concept":"ローコード開発","coreTopicId":"core_13_01","qualityAudit":"ipa92-original-v13"},
    {"id":"ipa92_a_no_code_001","sourcePool":"subject_a","cat":"ソフトウェア開発管理技術","difficulty":"standard","concept":"ノーコード開発","coreTopicId":"core_13_01","qualityAudit":"ipa92-original-v13"},
    {"id":"ipa92_a_pair_programming_001","sourcePool":"subject_a","cat":"ソフトウェア開発管理技術","difficulty":"standard","concept":"ペアプログラミング","coreTopicId":"core_13_01","qualityAudit":"ipa92-original-v13"},
    {"id":"ipa92_a_mob_programming_001","sourcePool":"subject_a","cat":"ソフトウェア開発管理技術","difficulty":"standard","concept":"モブプログラミング","coreTopicId":"core_13_01","qualityAudit":"ipa92-original-v13"},
    {"id":"ipa92_a_kpt_001","sourcePool":"subject_a","cat":"ソフトウェア開発管理技術","difficulty":"standard","concept":"KPT","coreTopicId":"core_13_01","qualityAudit":"ipa92-original-v13"},
    {"id":"ipa92_a_yagni_001","sourcePool":"subject_a","cat":"ソフトウェア開発管理技術","difficulty":"standard","concept":"YAGNI","coreTopicId":"core_13_01","qualityAudit":"ipa92-original-v13"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V14_METADATA=Object.freeze([
    {"id":"ipa92_a_pmo_001","sourcePool":"subject_a","cat":"マネジメント","difficulty":"standard","concept":"PMO","coreTopicId":"core_14_01","qualityAudit":"ipa92-original-v14"},
    {"id":"ipa92_a_wbs_dictionary_001","sourcePool":"subject_a","cat":"マネジメント","difficulty":"standard","concept":"WBS辞書","coreTopicId":"core_14_02","qualityAudit":"ipa92-original-v14"},
    {"id":"ipa92_a_cocomo_001","sourcePool":"subject_a","cat":"マネジメント","difficulty":"standard","concept":"COCOMO","coreTopicId":"core_14_04","qualityAudit":"ipa92-original-v14"},
    {"id":"ipa92_a_ccb_001","sourcePool":"subject_a","cat":"マネジメント","difficulty":"standard","concept":"CCB","coreTopicId":"core_14_07","qualityAudit":"ipa92-original-v14"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V15_METADATA=Object.freeze([
    {"id":"ipa92_a_aiops_001","sourcePool":"subject_a","cat":"サービスマネジメント","difficulty":"standard","concept":"AIOps","coreTopicId":"core_15_08","qualityAudit":"ipa92-original-v15"},
    {"id":"ipa92_a_job_scheduling_001","sourcePool":"subject_a","cat":"サービスマネジメント","difficulty":"standard","concept":"ジョブスケジューリング","coreTopicId":"core_15_08","qualityAudit":"ipa92-original-v15"},
    {"id":"ipa92_a_hot_cold_aisle_001","sourcePool":"subject_a","cat":"サービスマネジメント","difficulty":"standard","concept":"ホットアイル／コールドアイル","coreTopicId":"core_15_04","qualityAudit":"ipa92-original-v15"},
    {"id":"ipa92_a_mdf_001","sourcePool":"subject_a","cat":"サービスマネジメント","difficulty":"standard","concept":"MDF","coreTopicId":"core_15_04","qualityAudit":"ipa92-original-v15"},
    {"id":"ipa92_a_green_it_001","sourcePool":"subject_a","cat":"サービスマネジメント","difficulty":"standard","concept":"Green IT","coreTopicId":"core_15_04","qualityAudit":"ipa92-original-v15"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V16_METADATA=Object.freeze([
    {"id":"ipa92_a_coso_internal_control_001","sourcePool":"subject_a","cat":"サービスマネジメント","difficulty":"standard","concept":"COSOと内部統制","coreTopicId":"core_15_06","qualityAudit":"ipa92-original-v16"},
    {"id":"ipa92_a_csa_internal_control_001","sourcePool":"subject_a","cat":"サービスマネジメント","difficulty":"standard","concept":"CSA（Control Self-Assessment）","coreTopicId":"core_15_06","qualityAudit":"ipa92-original-v16"},
    {"id":"ipa92_a_jisq38500_it_governance_001","sourcePool":"subject_a","cat":"サービスマネジメント","difficulty":"standard","concept":"JIS Q 38500とITガバナンス","coreTopicId":"core_15_06","qualityAudit":"ipa92-original-v16"},
    {"id":"ipa92_a_it_general_controls_001","sourcePool":"subject_a","cat":"サービスマネジメント","difficulty":"standard","concept":"ITに係る全般統制","coreTopicId":"core_15_06","qualityAudit":"ipa92-original-v16"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V17_METADATA=Object.freeze([
    {"id":"ipa92_a_enterprise_architecture_001","sourcePool":"subject_a","cat":"システム戦略","difficulty":"standard","concept":"EA（Enterprise Architecture）","coreTopicId":"core_16_01","qualityAudit":"ipa92-original-v17"},
    {"id":"ipa92_a_wfa_001","sourcePool":"subject_a","cat":"システム戦略","difficulty":"standard","concept":"WFA（Work Flow Architecture）","coreTopicId":"core_16_01","qualityAudit":"ipa92-original-v17"},
    {"id":"ipa92_a_soa_001","sourcePool":"subject_a","cat":"システム戦略","difficulty":"standard","concept":"SOA（Service Oriented Architecture）","coreTopicId":"core_16_01","qualityAudit":"ipa92-original-v17"},
    {"id":"ipa92_a_zachman_framework_001","sourcePool":"subject_a","cat":"システム戦略","difficulty":"standard","concept":"ザックマンフレームワーク","coreTopicId":"core_16_01","qualityAudit":"ipa92-original-v17"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V18_METADATA=Object.freeze([
    {"id":"ipa92_a_vrio_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"VRIO","coreTopicId":"core_18_03","qualityAudit":"ipa92-original-v18"},
    {"id":"ipa92_a_growth_matrix_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"成長マトリクス","coreTopicId":"core_18_03","qualityAudit":"ipa92-original-v18"},
    {"id":"ipa92_a_3c_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"3C分析","coreTopicId":"core_18_05","qualityAudit":"ipa92-original-v18"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V19_METADATA=Object.freeze([
    {"id":"ipa92_a_persona_journey_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"ペルソナとカスタマージャーニーマップ","coreTopicId":"core_18_05","qualityAudit":"ipa92-original-v19"},
    {"id":"ipa92_a_dynamic_pricing_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"ダイナミックプライシング","coreTopicId":"core_18_05","qualityAudit":"ipa92-original-v19"},
    {"id":"ipa92_a_subscription_model_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"サブスクリプションモデル","coreTopicId":"core_18_05","qualityAudit":"ipa92-original-v19"},
    {"id":"ipa92_a_omnichannel_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"オムニチャネル","coreTopicId":"core_18_05","qualityAudit":"ipa92-original-v19"},
    {"id":"ipa92_a_seo_lpo_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"SEOとLPO","coreTopicId":"core_18_05","qualityAudit":"ipa92-original-v19"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V20_METADATA=Object.freeze([
    {"id":"ipa92_a_mot_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"MOT（技術経営）","coreTopicId":"core_18_07","qualityAudit":"ipa92-original-v20"},
    {"id":"ipa92_a_open_innovation_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"オープンイノベーション","coreTopicId":"core_18_07","qualityAudit":"ipa92-original-v20"},
    {"id":"ipa92_a_innovators_dilemma_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"イノベーションのジレンマ","coreTopicId":"core_18_07","qualityAudit":"ipa92-original-v20"},
    {"id":"ipa92_a_lean_startup_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"リーンスタートアップ","coreTopicId":"core_18_07","qualityAudit":"ipa92-original-v20"},
    {"id":"ipa92_a_poc_pov_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"PoCとPoV","coreTopicId":"core_18_08","qualityAudit":"ipa92-original-v20"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V21_METADATA=Object.freeze([
    {"id":"ipa92_a_digital_twin_cps_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"デジタルツインとCPS","coreTopicId":"core_19_04","qualityAudit":"ipa92-original-v21"},
    {"id":"ipa92_a_smart_contract_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"スマートコントラクト","coreTopicId":"core_19_03","qualityAudit":"ipa92-original-v21"},
    {"id":"ipa92_a_ekyc_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"eKYC","coreTopicId":"core_19_01","qualityAudit":"ipa92-original-v21"},
    {"id":"ipa92_a_cbdc_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"CBDC","coreTopicId":"core_19_01","qualityAudit":"ipa92-original-v21"},
    {"id":"ipa92_a_nft_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"NFT","coreTopicId":"core_19_03","qualityAudit":"ipa92-original-v21"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V22_METADATA=Object.freeze([
    {"id":"ipa92_a_edge_ai_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"エッジAI","coreTopicId":"core_19_04","qualityAudit":"ipa92-original-v22"},
    {"id":"ipa92_a_hems_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"HEMS","coreTopicId":"core_19_04","qualityAudit":"ipa92-original-v22"},
    {"id":"ipa92_a_m2m_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"M2M","coreTopicId":"core_19_04","qualityAudit":"ipa92-original-v22"},
    {"id":"ipa92_a_smart_industry_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"スマートファクトリーとスマート農業","coreTopicId":"core_19_02","qualityAudit":"ipa92-original-v22"},
    {"id":"ipa92_a_maas_autonomous_001","sourcePool":"subject_a","cat":"経営戦略","difficulty":"standard","concept":"MaaSと自動運転","coreTopicId":"core_19_01","qualityAudit":"ipa92-original-v22"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V23_METADATA=Object.freeze([
    {"id":"ipa92_a_bcp_bcm_bia_001","sourcePool":"subject_a","cat":"ストラテジ","difficulty":"standard","concept":"BCP・BCM・BIA","coreTopicId":"core_20_01","qualityAudit":"ipa92-original-v23"},
    {"id":"ipa92_a_regression_moving_average_001","sourcePool":"subject_a","cat":"ストラテジ","difficulty":"standard","concept":"回帰分析と移動平均","coreTopicId":"core_20_07","qualityAudit":"ipa92-original-v23"},
    {"id":"ipa92_a_bi_data_mining_001","sourcePool":"subject_a","cat":"ストラテジ","difficulty":"standard","concept":"BIとデータマイニング","coreTopicId":"core_20_07","qualityAudit":"ipa92-original-v23"},
    {"id":"ipa92_a_boxplot_001","sourcePool":"subject_a","cat":"ストラテジ","difficulty":"standard","concept":"箱ひげ図","coreTopicId":"core_20_07","qualityAudit":"ipa92-original-v23"},
    {"id":"ipa92_a_heatmap_001","sourcePool":"subject_a","cat":"ストラテジ","difficulty":"standard","concept":"ヒートマップ","coreTopicId":"core_20_07","qualityAudit":"ipa92-original-v23"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V24_METADATA=Object.freeze([
    {"id":"ipa92_a_financial_statements_roles_001","sourcePool":"subject_a","cat":"ストラテジ","difficulty":"standard","concept":"財務諸表の役割","coreTopicId":"core_20_05","qualityAudit":"ipa92-original-v24"},
    {"id":"ipa92_a_roa_roe_001","sourcePool":"subject_a","cat":"ストラテジ","difficulty":"standard","concept":"ROAとROE","coreTopicId":"core_20_05","qualityAudit":"ipa92-original-v24"},
    {"id":"ipa92_a_equity_fixed_ratio_001","sourcePool":"subject_a","cat":"ストラテジ","difficulty":"standard","concept":"自己資本比率と固定比率","coreTopicId":"core_20_05","qualityAudit":"ipa92-original-v24"},
    {"id":"ipa92_a_margin_of_safety_001","sourcePool":"subject_a","cat":"ストラテジ","difficulty":"standard","concept":"安全余裕率","coreTopicId":"core_20_04","qualityAudit":"ipa92-original-v24"},
    {"id":"ipa92_a_cashflow_classification_001","sourcePool":"subject_a","cat":"ストラテジ","difficulty":"standard","concept":"キャッシュフローの区分","coreTopicId":"core_20_05","qualityAudit":"ipa92-original-v24"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V25_METADATA=Object.freeze([
    {"id":"ipa92_a_decimal_encoding_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"BCD・ゾーン10進・パック10進","coreTopicId":"core_01_02","qualityAudit":"ipa92-original-v25"},
    {"id":"ipa92_a_bayes_distribution_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"ベイズ定理と確率分布","coreTopicId":"core_02_06","qualityAudit":"ipa92-original-v25"},
    {"id":"ipa92_a_statistical_inference_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"統計的推定と最尤法","coreTopicId":"core_02_06","qualityAudit":"ipa92-original-v25"},
    {"id":"ipa92_a_compiler_phases_001","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"コンパイラの解析段階","coreTopicId":"core_03_04","qualityAudit":"ipa92-original-v25"},
    {"id":"ipa92_a_language_paradigms_001","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"プログラミング言語のパラダイム","coreTopicId":"core_03_04","qualityAudit":"ipa92-original-v25"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V26_METADATA=Object.freeze([
    {"id":"ipa92_a_article36_agreement_001","sourcePool":"subject_a","cat":"ストラテジ","difficulty":"standard","concept":"36協定","coreTopicId":"core_21_04","qualityAudit":"ipa92-original-v26"},
    {"id":"ipa92_a_nda_001","sourcePool":"subject_a","cat":"ストラテジ","difficulty":"standard","concept":"秘密保持契約（NDA）","coreTopicId":"core_21_04","qualityAudit":"ipa92-original-v26"},
    {"id":"ipa92_a_gpl_lgpl_001","sourcePool":"subject_a","cat":"コンピュータ","difficulty":"standard","concept":"GPLとLGPL","coreTopicId":"core_06_05","qualityAudit":"ipa92-original-v26"},
    {"id":"ipa92_a_web_internet_standards_bodies_001","sourcePool":"subject_a","cat":"ストラテジ","difficulty":"standard","concept":"W3C・IETF・IEEE","coreTopicId":"core_21_06","qualityAudit":"ipa92-original-v26"},
    {"id":"ipa92_a_jis_itu_iec_001","sourcePool":"subject_a","cat":"ストラテジ","difficulty":"standard","concept":"JIS・ITU・IEC","coreTopicId":"core_21_06","qualityAudit":"ipa92-original-v26"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V27_METADATA=Object.freeze([
    {"id":"ipa92_a_linear_algebra_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"行列・逆行列・固有値","coreTopicId":"core_02_07","qualityAudit":"ipa92-original-v27"},
    {"id":"ipa92_a_sequences_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"等差数列と等比数列","coreTopicId":"core_02_07","qualityAudit":"ipa92-original-v27"},
    {"id":"ipa92_a_interpolation_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"補間法","coreTopicId":"core_02_07","qualityAudit":"ipa92-original-v27"},
    {"id":"ipa92_a_dynamic_programming_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"動的計画法","coreTopicId":"core_02_07","qualityAudit":"ipa92-original-v27"},
    {"id":"ipa92_a_hash_search_001","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"ハッシュ表探索と衝突処理","coreTopicId":"core_03_03","qualityAudit":"ipa92-original-v27"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V28_METADATA=Object.freeze([
    {"id":"ipa92_a_nlp_analysis_001","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"形態素解析・係り受け解析・n-gram","coreTopicId":"core_03_03","qualityAudit":"ipa92-original-v28"},
    {"id":"ipa92_a_script_languages_001","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"ECMAScriptとPython","coreTopicId":"core_03_04","qualityAudit":"ipa92-original-v28"},
    {"id":"ipa92_a_override_overload_001","sourcePool":"subject_a","cat":"ソフトウェア","difficulty":"standard","concept":"オーバーライドとオーバーロード","coreTopicId":"core_12_04","qualityAudit":"ipa92-original-v28"},
    {"id":"ipa92_a_abstract_data_type_001","sourcePool":"subject_a","cat":"ソフトウェア","difficulty":"standard","concept":"抽象データ型（ADT）","coreTopicId":"core_12_04","qualityAudit":"ipa92-original-v28"},
    {"id":"ipa92_a_xml_001","sourcePool":"subject_a","cat":"プログラミング","difficulty":"standard","concept":"XML","coreTopicId":"core_03_05","qualityAudit":"ipa92-original-v28"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V29_METADATA=Object.freeze([
    {"id":"ipa92_a_dynamic_array_001","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"動的配列","coreTopicId":"core_03_01","qualityAudit":"ipa92-original-v29"},
    {"id":"ipa92_a_linked_list_variants_001","sourcePool":"subject_a","cat":"アルゴリズム","difficulty":"standard","concept":"双方向リストと環状リスト","coreTopicId":"core_03_01","qualityAudit":"ipa92-original-v29"},
    {"id":"ipa92_a_frequency_filters_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"ローパスフィルタとハイパスフィルタ","coreTopicId":"core_02_09","qualityAudit":"ipa92-original-v29"},
    {"id":"ipa92_a_control_response_stability_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"過渡応答・定常応答・制御安定性","coreTopicId":"core_02_09","qualityAudit":"ipa92-original-v29"},
    {"id":"ipa92_a_sensor_types_001","sourcePool":"subject_a","cat":"基礎理論","difficulty":"standard","concept":"ジャイロセンサ・ひずみゲージ・ホール素子","coreTopicId":"core_02_09","qualityAudit":"ipa92-original-v29"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V30_METADATA=Object.freeze([
    {"id":"ipa92_a_duplex_modes_001","sourcePool":"subject_a","cat":"ネットワーク","difficulty":"standard","concept":"単方向・半二重・全二重通信","coreTopicId":"core_10_01","qualityAudit":"ipa92-original-v30"},
    {"id":"ipa92_a_start_stop_sync_001","sourcePool":"subject_a","cat":"ネットワーク","difficulty":"standard","concept":"調歩同期とスタート・ストップビット","coreTopicId":"core_10_09","qualityAudit":"ipa92-original-v30"},
    {"id":"ipa92_a_character_sync_001","sourcePool":"subject_a","cat":"ネットワーク","difficulty":"standard","concept":"キャラクタ同期とSYN文字","coreTopicId":"core_10_09","qualityAudit":"ipa92-original-v30"},
    {"id":"ipa92_a_flag_sync_001","sourcePool":"subject_a","cat":"ネットワーク","difficulty":"standard","concept":"フラグ同期とフレーム境界","coreTopicId":"core_10_09","qualityAudit":"ipa92-original-v30"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V31_METADATA=Object.freeze([
    {"id":"ipa92_a_superscalar_vliw_001","sourcePool":"subject_a","cat":"コンピュータ構成要素","difficulty":"standard","concept":"スーパースカラとVLIW","coreTopicId":"core_04_01","qualityAudit":"ipa92-original-v31"},
    {"id":"ipa92_a_amdahl_law_001","sourcePool":"subject_a","cat":"コンピュータ構成要素","difficulty":"standard","concept":"アムダールの法則","coreTopicId":"core_04_01","qualityAudit":"ipa92-original-v31"},
    {"id":"ipa92_a_flynn_architecture_001","sourcePool":"subject_a","cat":"コンピュータ構成要素","difficulty":"standard","concept":"SISD・SIMD・MISD・MIMD","coreTopicId":"core_04_01","qualityAudit":"ipa92-original-v31"},
    {"id":"ipa92_a_swapping_001","sourcePool":"subject_a","cat":"ソフトウェア","difficulty":"standard","concept":"スワッピングとページング","coreTopicId":"core_06_01","qualityAudit":"ipa92-original-v31"},
    {"id":"ipa92_a_segment_paging_001","sourcePool":"subject_a","cat":"ソフトウェア","difficulty":"standard","concept":"セグメンテーションとセグメントページング","coreTopicId":"core_06_01","qualityAudit":"ipa92-original-v31"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V32_METADATA=Object.freeze([
    {"id":"ipa92_a_dimm_sodimm_001","sourcePool":"subject_a","cat":"コンピュータ構成要素","difficulty":"standard","concept":"DIMMとSO-DIMM","coreTopicId":"core_04_03","qualityAudit":"ipa92-original-v32"},
    {"id":"ipa92_a_wear_leveling_001","sourcePool":"subject_a","cat":"コンピュータ構成要素","difficulty":"standard","concept":"ウェアレベリング","coreTopicId":"core_04_03","qualityAudit":"ipa92-original-v32"},
    {"id":"ipa92_a_disk_cache_001","sourcePool":"subject_a","cat":"コンピュータ構成要素","difficulty":"standard","concept":"ディスクキャッシュ","coreTopicId":"core_04_03","qualityAudit":"ipa92-original-v32"},
    {"id":"ipa92_a_storage_media_001","sourcePool":"subject_a","cat":"コンピュータ構成要素","difficulty":"standard","concept":"RAMファイルとストリーマ","coreTopicId":"core_04_03","qualityAudit":"ipa92-original-v32"},
    {"id":"ipa92_a_cache_write_back_001","sourcePool":"subject_a","cat":"コンピュータ構成要素","difficulty":"standard","concept":"ライトバック方式とライトスルー方式","coreTopicId":"core_04_03","qualityAudit":"ipa92-original-v32"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V33_METADATA=Object.freeze([
    {"id":"ipa92_a_serial_parallel_io_001","sourcePool":"subject_a","cat":"コンピュータ構成要素","difficulty":"standard","concept":"シリアル転送とパラレル転送","coreTopicId":"core_04_04","qualityAudit":"ipa92-original-v33"},
    {"id":"ipa92_a_video_interfaces_001","sourcePool":"subject_a","cat":"コンピュータ構成要素","difficulty":"standard","concept":"HDMIとDisplayPort","coreTopicId":"core_04_04","qualityAudit":"ipa92-original-v33"},
    {"id":"ipa92_a_input_readers_001","sourcePool":"subject_a","cat":"コンピュータ構成要素","difficulty":"standard","concept":"OCR・OMR・バーコードリーダ","coreTopicId":"core_04_05","qualityAudit":"ipa92-original-v33"},
    {"id":"ipa92_a_dma_io_001","sourcePool":"subject_a","cat":"コンピュータ構成要素","difficulty":"standard","concept":"DMA転送","coreTopicId":"core_04_06","qualityAudit":"ipa92-original-v33"},
    {"id":"ipa92_a_system_bus_roles_001","sourcePool":"subject_a","cat":"コンピュータ構成要素","difficulty":"standard","concept":"アドレスバス・データバス・制御バス","coreTopicId":"core_04_06","qualityAudit":"ipa92-original-v33"}
  ].map(item=>Object.freeze(item)));

  const IPA92_V34_METADATA=Object.freeze([
    {"id":"ipa92_a_dual_duplex_system_001","sourcePool":"subject_a","cat":"システム構成要素","difficulty":"standard","concept":"デュアルシステムとデュプレックスシステム","coreTopicId":"core_05_02","qualityAudit":"ipa92-original-v34"},
    {"id":"ipa92_a_hot_cold_standby_001","sourcePool":"subject_a","cat":"システム構成要素","difficulty":"standard","concept":"ホットスタンバイとコールドスタンバイ","coreTopicId":"core_05_02","qualityAudit":"ipa92-original-v34"},
    {"id":"ipa92_a_benchmark_001","sourcePool":"subject_a","cat":"システム構成要素","difficulty":"standard","concept":"ベンチマーク","coreTopicId":"core_05_03","qualityAudit":"ipa92-original-v34"},
    {"id":"ipa92_a_rasis_001","sourcePool":"subject_a","cat":"システム構成要素","difficulty":"standard","concept":"RASIS","coreTopicId":"core_05_04","qualityAudit":"ipa92-original-v34"},
    {"id":"ipa92_a_foolproof_001","sourcePool":"subject_a","cat":"システム構成要素","difficulty":"standard","concept":"フールプルーフ","coreTopicId":"core_05_04","qualityAudit":"ipa92-original-v34"}
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
  function installV10Metadata(){return installMetadata(IPA92_V10_METADATA,'v10',16)}
  function installV11Metadata(){return installMetadata(IPA92_V11_METADATA,'v11',8)}
  function installV12Metadata(){return installMetadata(IPA92_V12_METADATA,'v12',8)}
  function installV13Metadata(){return installMetadata(IPA92_V13_METADATA,'v13',6)}
  function installV14Metadata(){return installMetadata(IPA92_V14_METADATA,'v14',4)}
  function installV15Metadata(){return installMetadata(IPA92_V15_METADATA,'v15',5)}
  function installV16Metadata(){return installMetadata(IPA92_V16_METADATA,'v16',4)}
  function installV17Metadata(){return installMetadata(IPA92_V17_METADATA,'v17',4)}
  function installV18Metadata(){return installMetadata(IPA92_V18_METADATA,'v18',3)}
  function installV19Metadata(){return installMetadata(IPA92_V19_METADATA,'v19',5)}
  function installV20Metadata(){return installMetadata(IPA92_V20_METADATA,'v20',5)}
  function installV21Metadata(){return installMetadata(IPA92_V21_METADATA,'v21',5)}
  function installV22Metadata(){return installMetadata(IPA92_V22_METADATA,'v22',5)}
  function installV23Metadata(){return installMetadata(IPA92_V23_METADATA,'v23',5)}
  function installV24Metadata(){return installMetadata(IPA92_V24_METADATA,'v24',5)}
  function installV25Metadata(){return installMetadata(IPA92_V25_METADATA,'v25',5)}
  function installV26Metadata(){return installMetadata(IPA92_V26_METADATA,'v26',5)}
  function installV27Metadata(){return installMetadata(IPA92_V27_METADATA,'v27',5)}
  function installV28Metadata(){return installMetadata(IPA92_V28_METADATA,'v28',5)}
  function installV29Metadata(){return installMetadata(IPA92_V29_METADATA,'v29',5)}
  function installV30Metadata(){return installMetadata(IPA92_V30_METADATA,'v30',4)}
  function installV31Metadata(){return installMetadata(IPA92_V31_METADATA,'v31',5)}
  function installV32Metadata(){return installMetadata(IPA92_V32_METADATA,'v32',5)}
  function installV33Metadata(){return installMetadata(IPA92_V33_METADATA,'v33',5)}
  function installV34Metadata(){return installMetadata(IPA92_V34_METADATA,'v34',5)}
  function finishLatestActivation(reused){
    const v7Install=installV7Metadata();
    const v8Install=installV8Metadata();
    const v9Install=installV9Metadata();
    const v10Install=installV10Metadata();
    const v11Install=installV11Metadata();
    const v12Install=installV12Metadata();
    const v13Install=installV13Metadata();
    const v14Install=installV14Metadata();
    const v15Install=installV15Metadata();
    const v16Install=installV16Metadata();
    const v17Install=installV17Metadata();
    const v18Install=installV18Metadata();
    const v19Install=installV19Metadata();
    const v20Install=installV20Metadata();
    const v21Install=installV21Metadata();
    const v22Install=installV22Metadata();
    const v23Install=installV23Metadata();
    const v24Install=installV24Metadata();
    const v25Install=installV25Metadata();
    const v26Install=installV26Metadata();
    const v27Install=installV27Metadata();
    const v28Install=installV28Metadata();
    const v29Install=installV29Metadata();
    const v30Install=installV30Metadata();
    const v31Install=installV31Metadata();
    const v32Install=installV32Metadata();
    const v33Install=installV33Metadata();
    const v34Install=installV34Metadata();
    root.FEQUEST_IPA92_V7_SUBJECT_A_METADATA_INSTALL=v7Install;
    root.FEQUEST_IPA92_V8_SUBJECT_A_METADATA_INSTALL=v8Install;
    root.FEQUEST_IPA92_V9_SUBJECT_A_METADATA_INSTALL=v9Install;
    root.FEQUEST_IPA92_V10_SUBJECT_A_METADATA_INSTALL=v10Install;
    root.FEQUEST_IPA92_V11_SUBJECT_A_METADATA_INSTALL=v11Install;
    root.FEQUEST_IPA92_V12_SUBJECT_A_METADATA_INSTALL=v12Install;
    root.FEQUEST_IPA92_V13_SUBJECT_A_METADATA_INSTALL=v13Install;
    root.FEQUEST_IPA92_V14_SUBJECT_A_METADATA_INSTALL=v14Install;
    root.FEQUEST_IPA92_V15_SUBJECT_A_METADATA_INSTALL=v15Install;
    root.FEQUEST_IPA92_V16_SUBJECT_A_METADATA_INSTALL=v16Install;
    root.FEQUEST_IPA92_V17_SUBJECT_A_METADATA_INSTALL=v17Install;
    root.FEQUEST_IPA92_V18_SUBJECT_A_METADATA_INSTALL=v18Install;
    root.FEQUEST_IPA92_V19_SUBJECT_A_METADATA_INSTALL=v19Install;
    root.FEQUEST_IPA92_V20_SUBJECT_A_METADATA_INSTALL=v20Install;
    root.FEQUEST_IPA92_V21_SUBJECT_A_METADATA_INSTALL=v21Install;
    root.FEQUEST_IPA92_V22_SUBJECT_A_METADATA_INSTALL=v22Install;
    root.FEQUEST_IPA92_V23_SUBJECT_A_METADATA_INSTALL=v23Install;
    root.FEQUEST_IPA92_V24_SUBJECT_A_METADATA_INSTALL=v24Install;
    root.FEQUEST_IPA92_V25_SUBJECT_A_METADATA_INSTALL=v25Install;
    root.FEQUEST_IPA92_V26_SUBJECT_A_METADATA_INSTALL=v26Install;
    root.FEQUEST_IPA92_V27_SUBJECT_A_METADATA_INSTALL=v27Install;
    root.FEQUEST_IPA92_V28_SUBJECT_A_METADATA_INSTALL=v28Install;
    root.FEQUEST_IPA92_V29_SUBJECT_A_METADATA_INSTALL=v29Install;
    root.FEQUEST_IPA92_V30_SUBJECT_A_METADATA_INSTALL=v30Install;
    root.FEQUEST_IPA92_V31_SUBJECT_A_METADATA_INSTALL=v31Install;
    root.FEQUEST_IPA92_V32_SUBJECT_A_METADATA_INSTALL=v32Install;
    root.FEQUEST_IPA92_V33_SUBJECT_A_METADATA_INSTALL=v33Install;
    root.FEQUEST_IPA92_V34_SUBJECT_A_METADATA_INSTALL=v34Install;
    const providerOk=root.FEQUEST_PROTECTED_CONTENT?.version==='v376-provider-31-ipa92-v1-v34'&&root.FEQUEST_PROTECTED_CONTENT?.catalogTotal===1168;
    const ok=providerOk&&v7Install.ok&&v8Install.ok&&v9Install.ok&&v10Install.ok&&v11Install.ok&&v12Install.ok&&v13Install.ok&&v14Install.ok&&v15Install.ok&&v16Install.ok&&v17Install.ok&&v18Install.ok&&v19Install.ok&&v20Install.ok&&v21Install.ok&&v22Install.ok&&v23Install.ok&&v24Install.ok&&v25Install.ok&&v26Install.ok&&v27Install.ok&&v28Install.ok&&v29Install.ok&&v30Install.ok&&v31Install.ok&&v32Install.ok&&v33Install.ok&&v34Install.ok;
    return Object.freeze({ok,status:ok?'activated':'metadata-install-failed',reused,v7:v7Install,v8:v8Install,v9:v9Install,v10:v10Install,v11:v11Install,v12:v12Install,v13:v13Install,v14:v14Install,v15:v15Install,v16:v16Install,v17:v17Install,v18:v18Install,v19:v19Install,v20:v20Install,v21:v21Install,v22:v22Install,v23:v23Install,v24:v24Install,v25:v25Install,v26:v26Install,v27:v27Install,v28:v28Install,v29:v29Install,v30:v30Install,v31:v31Install,v32:v32Install,v33:v33Install,v34:v34Install});
  }

  function activateV34Provider(){
    const d=root.document;
    if(!d||typeof d.createElement!=='function')return Promise.resolve({ok:false,status:'document-unavailable'});
    if(root.FEQUEST_PROTECTED_CONTENT?.version==='v376-provider-31-ipa92-v1-v34')return Promise.resolve(finishLatestActivation(true));
    const id='fequest-ipa92-v34-provider';
    const existing=d.getElementById?.(id);
    if(existing){
      return new Promise(resolve=>{
        const finish=()=>resolve(finishLatestActivation(true));
        if(root.FEQUEST_PROTECTED_CONTENT?.version==='v376-provider-31-ipa92-v1-v34')return finish();
        existing.addEventListener('load',finish,{once:true});
        existing.addEventListener('error',()=>resolve({ok:false,status:'provider-load-failed',reused:true}),{once:true});
      });
    }
    return new Promise(resolve=>{
      const script=d.createElement('script');
      script.id=id;
      script.src='./assets/protected-content-provider-v376-v34.js';
      script.async=false;
      script.addEventListener('load',()=>resolve(finishLatestActivation(false)),{once:true});
      script.addEventListener('error',()=>resolve({ok:false,status:'provider-load-failed',reused:false}),{once:true});
      (d.head||d.body||d.documentElement).appendChild(script);
    });
  }

  root.FEQUEST_IPA92_V7_SUBJECT_A_METADATA=IPA92_V7_METADATA;
  root.FEQUEST_IPA92_V8_SUBJECT_A_METADATA=IPA92_V8_METADATA;
  root.FEQUEST_IPA92_V9_SUBJECT_A_METADATA=IPA92_V9_METADATA;
  root.FEQUEST_IPA92_V10_SUBJECT_A_METADATA=IPA92_V10_METADATA;
  root.FEQUEST_IPA92_V11_SUBJECT_A_METADATA=IPA92_V11_METADATA;
  root.FEQUEST_IPA92_V12_SUBJECT_A_METADATA=IPA92_V12_METADATA;
  root.FEQUEST_IPA92_V13_SUBJECT_A_METADATA=IPA92_V13_METADATA;
  root.FEQUEST_IPA92_V14_SUBJECT_A_METADATA=IPA92_V14_METADATA;
  root.FEQUEST_IPA92_V15_SUBJECT_A_METADATA=IPA92_V15_METADATA;
  root.FEQUEST_IPA92_V16_SUBJECT_A_METADATA=IPA92_V16_METADATA;
  root.FEQUEST_IPA92_V17_SUBJECT_A_METADATA=IPA92_V17_METADATA;
  root.FEQUEST_IPA92_V18_SUBJECT_A_METADATA=IPA92_V18_METADATA;
  root.FEQUEST_IPA92_V19_SUBJECT_A_METADATA=IPA92_V19_METADATA;
  root.FEQUEST_IPA92_V20_SUBJECT_A_METADATA=IPA92_V20_METADATA;
  root.FEQUEST_IPA92_V21_SUBJECT_A_METADATA=IPA92_V21_METADATA;
  root.FEQUEST_IPA92_V22_SUBJECT_A_METADATA=IPA92_V22_METADATA;
  root.FEQUEST_IPA92_V23_SUBJECT_A_METADATA=IPA92_V23_METADATA;
  root.FEQUEST_IPA92_V24_SUBJECT_A_METADATA=IPA92_V24_METADATA;
  root.FEQUEST_IPA92_V25_SUBJECT_A_METADATA=IPA92_V25_METADATA;
  root.FEQUEST_IPA92_V26_SUBJECT_A_METADATA=IPA92_V26_METADATA;
  root.FEQUEST_IPA92_V27_SUBJECT_A_METADATA=IPA92_V27_METADATA;
  root.FEQUEST_IPA92_V28_SUBJECT_A_METADATA=IPA92_V28_METADATA;
  root.FEQUEST_IPA92_V29_SUBJECT_A_METADATA=IPA92_V29_METADATA;
  root.FEQUEST_IPA92_V30_SUBJECT_A_METADATA=IPA92_V30_METADATA;
  root.FEQUEST_IPA92_V31_SUBJECT_A_METADATA=IPA92_V31_METADATA;
  root.FEQUEST_IPA92_V32_SUBJECT_A_METADATA=IPA92_V32_METADATA;
  root.FEQUEST_IPA92_V33_SUBJECT_A_METADATA=IPA92_V33_METADATA;
  root.FEQUEST_IPA92_V34_SUBJECT_A_METADATA=IPA92_V34_METADATA;
  const latestProviderReady=activateV34Provider();
  root.FEQUEST_IPA92_V34_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V33_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V32_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V31_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V30_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V29_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V28_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V27_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V26_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V25_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V24_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V23_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V22_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V21_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V20_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V19_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V18_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V17_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V16_PROVIDER_READY=latestProviderReady;
  // Backward-compatible readiness aliases: historical callers wait for the latest provider.
  root.FEQUEST_IPA92_V15_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V14_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V13_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V12_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V11_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V10_PROVIDER_READY=latestProviderReady;
  root.FEQUEST_IPA92_V9_PROVIDER_READY=latestProviderReady;
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