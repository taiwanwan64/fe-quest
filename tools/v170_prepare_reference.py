from pathlib import Path
import re, shutil, subprocess

def req(v,m):
    if not v: raise AssertionError(m)

ref=Path('_v170_reference_src')
if ref.exists(): shutil.rmtree(ref)
ref.mkdir()
shutil.copytree('app',ref/'app')
for name in ['manifest.webmanifest','sw.js','icon-192.png','icon-512.png','apple-touch-icon.png']:
    shutil.copy2(name,ref/name)

src=subprocess.check_output(['git','show','origin/main:index.html'],text=True)
req(src.count('include_relative app/v132-block-00.txt')==1 and src.count('include_relative app/v144-block-00.txt')==1,'parent expanded assembler')
s=src
s=s.replace('{% capture v169block %}{% include_relative app/v169-block-00.txt %}{% endcapture %}','{% capture v170block %}{% include_relative app/v170-block-00.txt %}{% endcapture %}')
s=s.replace('<title>FE QUEST PWA v169</title>','<title>FE QUEST PWA v170</title>')
s=s.replace("const APP_VERSION = 'v169';","const APP_VERSION = 'v170';")
s=s.replace('applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV169SelfCheck();','applyV143LateFixes();window.FEQUEST_SELF_CHECK=runV170SelfCheck();')
s=s.replace('{{ v169block }}','{{ v170block }}')
includes=re.findall(r'\{%\s*include_relative\s+(app/v(?:13[2-9]|14[0-4])-block-\d\d\.txt)\s*%\}',s)
req(len(includes)==47,'reference expanded include count')
req('{% include_relative app/v170-block-00.txt %}' in s and 'v169-block-00.txt' not in s,'reference adapter')
(ref/'index.html').write_text(s)
print('FEQUEST_V170_REFERENCE_PREPARED expanded-includes=47')
