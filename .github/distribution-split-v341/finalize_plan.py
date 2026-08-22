from pathlib import Path

p=Path('FE_QUEST_DEVELOPMENT_PLAN.md');t=p.read_text()
assert '現行アプリ: **v340**' in t or '現行アプリ: **v341**' in t
assert '次の計画バージョン: **v341**' in t or '次の計画バージョン: **v342**' in t
t=t.replace('現行アプリ: **v340**','現行アプリ: **v341**',1)
t=t.replace('次の計画バージョン: **v341**','次の計画バージョン: **v342**',1)
header='# v341 — 配信構造・巨大HTMLの分割'
if header+' ✅ 完了（2026-08-22）' not in t:
    assert header+'\n' in t
    t=t.replace(header+'\n',header+' ✅ 完了（2026-08-22）\n',1)
if '### v341 完了結果' not in t:
    s=t.index(header)
    n=t.index('# v342 —',s)
    sep=t.rfind('\n---\n',s,n)
    assert sep>0
    block='''\n### v341 完了結果\n\n- 完成版HTMLを実測し、styleタグ **1個 / 231,671 bytes**、classic scriptタグ **1個 / 約3.36MB**、外部化後のHTML見込み約95KBであることを確認。\n- `document.currentScript` / `document.write` / `import.meta` / module構文など、単一classic scriptを外部化する際の主要hazardは **0件**。\n- production `index.html` を最小shellへ切り替え、CSSを `assets/app-v341.css`、JavaScriptを `assets/app-v341.js` へ分離。実行位置とclassic scriptの同期実行順は維持。\n- `assets/asset-manifest-v341.json` にassetのbytes / SHA-256 / 実行契約を固定。\n- Service WorkerのAPP_SHELLへCSS / JS / asset manifestを追加し、インストール後のオフライン再起動を維持。\n- 分割後HTML + CSS + JSから、承認済みinline v341 documentをbyte再構成できることをCIで確認。\n- 科目A **710問**、QUESTION_BANK、科目B content、Subject B semantics、`buildTodayTasks()`、試験日・学習時間配分、profile/settings key contract、初回設定判定に意味的差分なし。\n- profile schema変更なし。runtime contract failure 0。\n- 旧巨大source module群は移行・参照用としてrepo内に残すが、production rootからは直接bundleしない。\n- 詳細: `audits/DISTRIBUTION_SPLIT_v341.md`\n- 回帰基準: `_regression/distribution-split-v341.fixture.json`\n'''
    t=t[:sep]+block+t[sep:]

h='## 10. 直近の次アクション'
pos=t.index(h)
new='''## 10. 直近の次アクション\n\n**次に着手する正式タスクは v342「アカウント / クラウド同期 基盤」。**\n\nv341でproduction配信を小さなHTML shell + versioned static assetsへ分離し、オフラインcache契約も固定した。これにより、巨大inline bundleへ状態同期を直接重ねる段階を抜け、クラウド同期をローカルファーストで設計できる状態になった。\n\n最初の順序:\n\n1. 現行profile schema v5 / revision / updatedAt / writerId / atomic保存 / recovery point / export payloadを同期契約として棚卸しする\n2. Supabase等の候補を費用・認証・RLS・バックアップ・無料枠・運用負荷で比較し、実装先を決める\n3. 「ローカルが正本で、通信可能時にクラウドへ同期」の状態遷移を先にfixture化する\n4. 端末A→端末B、オフライン編集→再接続、古いクラウドデータとの競合をシミュレーションする\n5. 既存ユーザーがログインしなくても今まで通り完全に学習できることを必須条件にする\n6. 認証・同期を追加しても、復旧センター / JSONエクスポート / last-known-goodを廃止しない\n\n`buildBFinal` と `subjectBHubRecommendation` の残る3段wrapperは既知の内部負債として追跡を続けるが、v342では同期状態管理とデータ保護を最優先する。\n'''
t=t[:pos]+new
p.write_text(t)
print('FEQUEST_PLAN_FINALIZED current=v341 next=v342')
