from pathlib import Path
import hashlib,json,re

V='v341'

def req(ok,msg):
    if not ok: raise AssertionError(msg)
def h(b): return hashlib.sha256(b).hexdigest()

src=Path('_site/index.html')
req(src.exists(),'inline built index missing')
html=src.read_text()
styles=list(re.finditer(r'<style([^>]*)>(.*?)</style>',html,re.S|re.I))
scripts=list(re.finditer(r'<script([^>]*)>(.*?)</script>',html,re.S|re.I))
req(len(styles)==1,'v341 split expects one style tag')
req(len(scripts)==1,'v341 split expects one script tag')
sm, jm=styles[0], scripts[0]
req(not sm.group(1).strip(),'style attributes changed')
req(not jm.group(1).strip(),'script attributes changed')
css=sm.group(2).encode()
js=jm.group(2).encode()
req(len(css)>200_000,'unexpected CSS payload')
req(len(js)>3_000_000,'unexpected JS payload')
req(b'document.currentScript' not in js and b'document.write' not in js and b'import.meta' not in js,'externalization hazard')

assets=Path('assets');assets.mkdir(exist_ok=True)
cssp=assets/f'app-{V}.css';jsp=assets/f'app-{V}.js'
cssp.write_bytes(css);jsp.write_bytes(js)

style_tag=f'<link rel="stylesheet" href="./assets/app-{V}.css">'
script_tag=f'<script src="./assets/app-{V}.js"></script>'
shell=html[:sm.start()]+style_tag+html[sm.end():]
# Find script again after style replacement because offsets changed.
jm2=re.search(r'<script([^>]*)>(.*?)</script>',shell,re.S|re.I)
req(jm2 is not None,'script disappeared during split')
shell=shell[:jm2.start()]+script_tag+shell[jm2.end():]
req('<style' not in shell.lower(),'inline style remains')
req(not re.search(r'<script(?![^>]*\bsrc=)[^>]*>.*?</script>',shell,re.S|re.I),'inline script remains')
req(f'<title>FE QUEST PWA {V}</title>' in shell,'v341 title missing')

shellp=Path('app/base-shell-v341.html')
shellp.write_text(shell)
Path('index.html').write_text('---\n---\n{% include_relative app/base-shell-v341.html %}\n')

manifest={
  'version':V,
  'strategy':'external-classic-script-and-stylesheet',
  'sourceInlineIndex':{'utf8Bytes':len(html.encode()),'sha256':h(html.encode())},
  'shell':{'path':'index.html','estimatedUtf8Bytes':len(shell.encode()),'sha256':h(shell.encode())},
  'assets':[
    {'path':f'assets/app-{V}.css','kind':'style','utf8Bytes':len(css),'sha256':h(css)},
    {'path':f'assets/app-{V}.js','kind':'classic-script','utf8Bytes':len(js),'sha256':h(js)}
  ],
  'executionContract':{
    'styleTagCountBefore':1,'scriptTagCountBefore':1,
    'scriptType':'classic','scriptRegion':'body',
    'currentScript':False,'documentWrite':False,'importMeta':False,'moduleSyntax':False,
    'orderPreserved':True
  }
}
Path(f'assets/asset-manifest-{V}.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n')

sw=Path('sw.js');w=sw.read_text()
req(f"const APP_VERSION = '{V}';" in w and f"fe-quest-{V}-1" in w,'v341 SW not materialized')
anchor="  './manifest.webmanifest',\n"
rows=(f"  './assets/app-{V}.css',\n"
      f"  './assets/app-{V}.js',\n"
      f"  './assets/asset-manifest-{V}.json',\n")
if f"'./assets/app-{V}.js'" not in w:
    req(anchor in w,'APP_SHELL anchor missing')
    w=w.replace(anchor,anchor+rows,1)
sw.write_text(w)

print(json.dumps({
 'inlineBytes':len(html.encode()),'splitHtmlBytes':len(shell.encode()),
 'cssBytes':len(css),'jsBytes':len(js),
 'htmlReductionBytes':len(html.encode())-len(shell.encode()),
 'htmlReductionPercent':round((1-len(shell.encode())/len(html.encode()))*100,2),
 'cssSha256':h(css),'jsSha256':h(js)
},ensure_ascii=False,indent=2))
