from pathlib import Path
import shutil

def req(v,m):
    if not v: raise AssertionError(m)

src=Path('.')
dst=Path('_v172_reference_src')
if dst.exists(): shutil.rmtree(dst)
ignore=shutil.ignore_patterns('.git','_site','_site_reference','_v172_reference_src','FE_QUEST_PWA_v172.zip')
shutil.copytree(src,dst,ignore=ignore)
idx=dst/'index.html'
s=idx.read_text()
stable='{% capture productionBase %}{% include_relative app/base-stable.html %}{% endcapture %}'
legacy='''{% capture base %}{% include_relative app/base-v131.html %}{% endcapture %}\n{% assign legacyStartParts = base | split: "function runAppSelfCheck(){" %}\n{% assign productionBaseHead = legacyStartParts | first %}\n{% assign legacyTail = legacyStartParts | last %}\n{% assign legacyEndParts = legacyTail | split: "function runLessonUXAudit(){" %}\n{% assign productionBaseTail = legacyEndParts | last %}\n{% assign lessonUxHead = "function runLessonUXAudit(){" %}\n{% capture productionBase %}{{ productionBaseHead }}{{ lessonUxHead }}{{ productionBaseTail }}{% endcapture %}'''
req(stable in s,'stable base capture not found')
s=s.replace(stable,legacy,1)
req(s.count('{% include_relative app/base-v131.html %}')==1,'reference base-v131 include')
idx.write_text(s)
print('FEQUEST_V172_REFERENCE_PREPARED stable-base->legacy-liquid-projection')
