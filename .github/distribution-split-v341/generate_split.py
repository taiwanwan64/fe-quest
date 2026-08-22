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

recovery='''<!-- FEQUEST_ASSET_RECOVERY_V341_START -->
<script>
(()=>{const show=(kind)=>{const paint=()=>{if(document.getElementById('fequestAssetRecoveryV341'))return;const box=document.createElement('div');box.id='fequestAssetRecoveryV341';box.setAttribute('role','alert');box.style.cssText='position:fixed;inset:16px;z-index:2147483647;margin:auto;max-width:520px;height:max-content;padding:20px;border:1px solid #d9e2ec;border-radius:18px;background:#fff;color:#24313d;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;box-shadow:0 18px 50px rgba(15,23,42,.18)';box.innerHTML='<div style="font-size:20px;font-weight:800;margin-bottom:8px">FE QUESTを読み込めませんでした</div><div style="font-size:14px;line-height:1.65;margin-bottom:14px">必要なアプリファイルを取得できませんでした。通信状態を確認して再読み込みしてください。学習データは削除されません。</div><button type="button" style="min-height:48px;width:100%;border:0;border-radius:12px;background:#58cc02;color:#fff;font-weight:800;font-size:16px" onclick="location.reload()">再読み込み</button>';document.body.appendChild(box)};if(document.body)paint();else document.addEventListener('DOMContentLoaded',paint,{once:true})};addEventListener('error',e=>{const t=e&&e.target;if(t&&((t.tagName==='LINK'&&/stylesheet/i.test(t.rel||''))||t.tagName==='SCRIPT'))show(t.tagName.toLowerCase())},true)})();
</script>
<!-- FEQUEST_ASSET_RECOVERY_V341_END -->
'''
style_tag=f'<link rel="stylesheet" href="./assets/app-{V}.css">'
script_tag=f'<script src="./assets/app-{V}.js"></script>'
shell=html[:sm.start()]+recovery+style_tag+html[sm.end():]
# Find the original application script after style replacement. The recovery script is intentionally first.
app_scripts=list(re.finditer(r'<script([^>]*)>(.*?)</script>',shell,re.S|re.I))
req(len(app_scripts)==2,'recovery + app script expectation')
jm2=app_scripts[-1]
shell=shell[:jm2.start()]+script_tag+shell[jm2.end():]
req('<style' not in shell.lower(),'inline style remains')
req(shell.count('FEQUEST_ASSET_RECOVERY_V341_START')==1,'recovery bootstrap missing')
req(shell.count(script_tag)==1,'external app script missing')
req(f'<title>FE QUEST PWA {V}</title>' in shell,'v341 title missing')

shellp=Path('app/base-shell-v341.html')
shellp.write_text(shell)
Path('index.html').write_text('---\n---\n{% include_relative app/base-shell-v341.html %}\n')

manifest={
  'version':V,
  'strategy':'external-classic-script-and-stylesheet-with-inline-asset-recovery-bootstrap',
  'sourceInlineIndex':{'utf8Bytes':len(html.encode()),'sha256':h(html.encode())},
  'shell':{'path':'index.html','estimatedUtf8Bytes':len(shell.encode()),'sha256':h(shell.encode())},
  'assets':[
    {'path':f'assets/app-{V}.css','kind':'style','utf8Bytes':len(css),'sha256':h(css)},
    {'path':f'assets/app-{V}.js','kind':'classic-script','utf8Bytes':len(js),'sha256':h(js)}
  ],
  'executionContract':{
    'styleTagCountBefore':1,'applicationScriptTagCountBefore':1,
    'scriptType':'classic','scriptRegion':'body',
    'currentScript':False,'documentWrite':False,'importMeta':False,'moduleSyntax':False,
    'orderPreserved':True,'assetRecoveryBootstrap':True,'recoveryMutatesLearningData':False
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
 'cssSha256':h(css),'jsSha256':h(js),'assetRecoveryBootstrap':True
},ensure_ascii=False,indent=2))
