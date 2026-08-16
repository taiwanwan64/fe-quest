from pathlib import Path
import shutil

ROOT=Path('.')
DST=Path('_candidate')
if DST.exists(): shutil.rmtree(DST)
DST.mkdir()

skip={'.git','_site','_site_candidate','_candidate','.jekyll-cache','FE_QUEST_PWA_v183.zip'}
for p in ROOT.iterdir():
    if p.name in skip: continue
    target=DST/p.name
    if p.is_dir(): shutil.copytree(p,target)
    else: shutil.copy2(p,target)

(DST/'_data').mkdir(exist_ok=True)
(DST/'_data'/'release.yml').write_text('version: v183\n')

idx=DST/'index.html'
t=idx.read_text()
old1='{% assign s1 = productionBase | replace: "<title>FE QUEST PWA v131</title>", "<title>FE QUEST PWA v183</title>" %}'
old2='{% assign s2 = s1 | replace: "const APP_VERSION = \'v131\';", "const APP_VERSION = \'v183\';" %}'
if old1 not in t or old2 not in t: raise AssertionError('candidate index anchors missing')
# Keep the replacement on one physical line so Liquid emits exactly the same surrounding whitespace as the conventional source.
new1="{% assign releaseVersion = site.data.release.version %}{% capture releaseTitle %}<title>FE QUEST PWA {{ releaseVersion }}</title>{% endcapture %}{% capture releaseAppVersion %}const APP_VERSION = '{{ releaseVersion }}';{% endcapture %}{% assign s1 = productionBase | replace: \"<title>FE QUEST PWA v131</title>\", releaseTitle %}"
new2='{% assign s2 = s1 | replace: "const APP_VERSION = \'v131\';", releaseAppVersion %}'
t=t.replace(old1,new1,1).replace(old2,new2,1)
idx.write_text(t)

manifest=DST/'manifest.webmanifest'
m=manifest.read_text()
if not m.lstrip().startswith('{'): raise AssertionError('reference manifest not direct JSON')
m=m.replace('v183','{{ site.data.release.version }}')
manifest.write_text('---\n---\n'+m)

sw=DST/'sw.js'
w=sw.read_text()
if w.startswith('---'): raise AssertionError('reference sw already templated')
w=w.replace('v183','{{ site.data.release.version }}')
sw.write_text('---\n---\n'+w)

print('FEQUEST_V183_SINGLE_SOURCE_CANDIDATE_READY version-source=_data/release.yml templated-index=1 templated-manifest=1 templated-sw=1 source-manifest-direct-json=0 source-sw-direct-js=0')
