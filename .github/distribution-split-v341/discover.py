from pathlib import Path
import hashlib,json,re

html=Path('_site/index.html').read_text()

def attrs(raw):
    out={}
    for k,v1,v2,v3 in re.findall(r'([:\w-]+)(?:\s*=\s*(?:"([^"]*)"|\'([^\']*)\'|([^\s>]+)))?',raw):
        out[k.lower()]=v1 or v2 or v3 or True
    return out

head_end=html.lower().find('</head>')
body_start=html.lower().find('<body')
body_end=html.lower().find('</body>')
styles=[]
for i,m in enumerate(re.finditer(r'<style([^>]*)>(.*?)</style>',html,re.S|re.I),1):
    raw=m.group(1); content=m.group(2)
    styles.append({'order':i,'bytes':len(content.encode()),'attrs':attrs(raw),'region':'head' if m.start()<head_end else 'body','sha256':hashlib.sha256(content.encode()).hexdigest(),'prefix':re.sub(r'\s+',' ',content[:180])})
scripts=[]
for i,m in enumerate(re.finditer(r'<script([^>]*)>(.*?)</script>',html,re.S|re.I),1):
    raw=m.group(1); content=m.group(2); a=attrs(raw); typ=str(a.get('type','')).lower(); src=a.get('src')
    region='head' if m.start()<head_end else ('body' if body_start>=0 and m.start()<body_end else 'after-body')
    scripts.append({'order':i,'bytes':len(content.encode()),'attrs':a,'type':typ or 'classic','src':src or None,'inline':not bool(src),'region':region,'sha256':hashlib.sha256(content.encode()).hexdigest(),'prefix':re.sub(r'\s+',' ',content[:220]),'hazards':{'currentScript':'document.currentScript' in content,'documentWrite':'document.write' in content,'importMeta':'import.meta' in content,'moduleSyntax':bool(re.search(r'(^|\n)\s*(?:import|export)\s',content)),'sourceURL':'//# sourceURL' in content}})

style_payload=sum(x['bytes'] for x in styles)
script_payload=sum(x['bytes'] for x in scripts if x['inline'])
classic=[x for x in scripts if x['inline'] and x['type'] in ('classic','text/javascript','application/javascript','')]
nonclassic=[x for x in scripts if x['inline'] and x['type'] not in ('classic','text/javascript','application/javascript','')]
stripped=re.sub(r'<style[^>]*>.*?</style>','<link rel="stylesheet" href="./assets/app-v341.css">',html,flags=re.S|re.I)
stripped=re.sub(r'<script([^>]*)>.*?</script>',lambda m: '<script'+m.group(1)+'></script>',stripped,flags=re.S|re.I)

# Roughly identify embedded data declarations inside classic JS that dominate size.
js='\n'.join(x['prefix'] for x in [])
whole_js='\n'.join(m.group(2) for m in re.finditer(r'<script([^>]*)>(.*?)</script>',html,re.S|re.I) if not attrs(m.group(1)).get('src') and str(attrs(m.group(1)).get('type','')).lower() in ('','text/javascript','application/javascript'))
markers=[]
for name in ['QUESTION_BANK','LESSONS','CORE_A_CURRICULUM','B_EXERCISES','SECURITY_SCENARIOS','B_EXAM_ALGO_ITEMS','B_COMPOUND_SETS']:
    positions=[m.start() for m in re.finditer(r'\b'+re.escape(name)+r'\b',whole_js)]
    markers.append({'name':name,'occurrences':len(positions),'firstOffset':positions[0] if positions else None})

report={
 'version':'v341-discovery',
 'builtBytes':len(html.encode()),
 'headEndOffset':head_end,
 'bodyStartOffset':body_start,
 'bodyEndOffset':body_end,
 'styleTagCount':len(styles),'stylePayloadBytes':style_payload,'styles':styles,
 'scriptTagCount':len(scripts),'inlineScriptCount':len([x for x in scripts if x['inline']]),'classicInlineCount':len(classic),'nonClassicInlineCount':len(nonclassic),'scriptPayloadBytes':script_payload,'scripts':scripts,
 'externalScriptCount':len([x for x in scripts if not x['inline']]),
 'payloadFreeHtmlEstimateBytes':len(stripped.encode()),
 'allClassicInlineSameRegion':len(set(x['region'] for x in classic))<=1,
 'classicRegions':sorted(set(x['region'] for x in classic)),
 'hazardCounts':{k:sum(1 for x in classic if x['hazards'][k]) for k in ['currentScript','documentWrite','importMeta','moduleSyntax','sourceURL']},
 'dataMarkers':markers
}
Path('audits').mkdir(exist_ok=True)
Path('audits/V341_DISTRIBUTION_DISCOVERY.json').write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n')
print(json.dumps({k:report[k] for k in ['builtBytes','styleTagCount','stylePayloadBytes','scriptTagCount','inlineScriptCount','classicInlineCount','nonClassicInlineCount','scriptPayloadBytes','externalScriptCount','payloadFreeHtmlEstimateBytes','allClassicInlineSameRegion','classicRegions','hazardCounts']},ensure_ascii=False,indent=2))
