from pathlib import Path

root=Path('.')
idx=root/'index.html'
s=idx.read_text(encoding='utf-8')
v150=(root/'app/v150-block-00.txt').read_text(encoding='utf-8').rstrip()
v151=(root/'app/v151-block-00.txt').read_text(encoding='utf-8').rstrip()
assert '<title>FE QUEST PWA v150</title>' in s
assert "const APP_VERSION = 'v150';" in s
assert "assert(PROFILE_SCHEMA_VERSION===5&&APP_VERSION==='v150','v150 version/schema contract drift');" in s
assert 'applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV150SelfCheck();' in s
assert v151 not in s
needle=v150+'\n'
assert needle in s
s=s.replace(needle,v150+'\n'+v151+'\n',1)
s=s.replace('<title>FE QUEST PWA v150</title>','<title>FE QUEST PWA v151</title>',1)
s=s.replace("const APP_VERSION = 'v150';","const APP_VERSION = 'v151';",1)
s=s.replace("assert(PROFILE_SCHEMA_VERSION===5&&APP_VERSION==='v150','v150 version/schema contract drift');","assert(PROFILE_SCHEMA_VERSION===5&&APP_VERSION==='v151','v151 version/schema contract drift');",1)
s=s.replace('applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV150SelfCheck();','applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV151SelfCheck();',1)
idx.write_text(s,encoding='utf-8')

manifest=root/'manifest.webmanifest'
m=manifest.read_text(encoding='utf-8')
assert '"name": "FE QUEST v150"' in m
m=m.replace('"name": "FE QUEST v150"','"name": "FE QUEST v151"',1)
old='"description": "基本情報技術者試験向けPWA。v150ではv149でCI-only legacy sentinelに分類した84 assertを8群へ再編し、そのうち重要用語・定義・比較・計算式・手順を守る56 assertを宣言的critical curriculum contractへ移行。current-contractを63→65契約へ拡張し、84件のsubinventory exact coverageと56件のdeclarative mappingをproductionで監視。release CIではcritical curriculum 56/56、旧293 assert shadow residual 0、browser UI 23/23を明示検証。科目A710問、正答位置、認知レベル、Profile Schema v5、UI外観は維持。"'
new='"description": "基本情報技術者試験向けPWA。v151ではv150で残っていたCI-only legacy sentinel 28件（品質上限、教材構造、章別演習、レッスン、参照アンカー、設定補助、required DOM）を宣言的release contractへ移行。critical curriculum 56件と合わせて84/84を旧runAppSelfCheck本文から独立した宣言マップで完全被覆し、current-contractを65→67契約へ拡張。release CIではcritical curriculum 56/56、remaining release sentinel 28/28、旧293 assert shadow residual 0、browser UI 23/23を明示検証。科目A710問、正答位置、認知レベル、Profile Schema v5、UI外観は維持。"'
assert old in m
m=m.replace(old,new,1)
manifest.write_text(m,encoding='utf-8')

sw=root/'sw.js'
w=sw.read_text(encoding='utf-8')
assert "const APP_VERSION = 'v150';" in w and "const CACHE_NAME = 'fe-quest-v150-1';" in w
w=w.replace("const APP_VERSION = 'v150';","const APP_VERSION = 'v151';",1)
w=w.replace("const CACHE_NAME = 'fe-quest-v150-1';","const CACHE_NAME = 'fe-quest-v151-1';",1)
sw.write_text(w,encoding='utf-8')
print('FEQUEST_V151_APPLY_OK')
