from pathlib import Path
import hashlib, re

IDENT_RE=re.compile(r'\b[A-Za-z_$][A-Za-z0-9_$]*\b')

def sha_bytes(b):
    return hashlib.sha256(b).hexdigest()

def _strip_js_literals_and_comments(text):
    # Deterministic source-level sanitizer. This is deliberately lexical, not a JS semantic parser.
    out=[]
    i=0
    n=len(text)
    state='code'
    quote=''
    while i<n:
        c=text[i]
        d=text[i+1] if i+1<n else ''
        if state=='code':
            if c=='/' and d=='/':
                out.extend('  '); i+=2; state='line'; continue
            if c=='/' and d=='*':
                out.extend('  '); i+=2; state='block'; continue
            if c in ("'",'"','`'):
                quote=c; out.append(' '); i+=1; state='string'; continue
            out.append(c); i+=1; continue
        if state=='line':
            if c=='\n':
                out.append('\n'); state='code'
            else:
                out.append(' ')
            i+=1; continue
        if state=='block':
            if c=='*' and d=='/':
                out.extend('  '); i+=2; state='code'
            else:
                out.append('\n' if c=='\n' else ' '); i+=1
            continue
        if state=='string':
            if c=='\\':
                out.extend('  ' if i+1<n else ' '); i+=2; continue
            if c==quote:
                out.append(' '); i+=1; state='code'; continue
            out.append('\n' if c=='\n' else ' '); i+=1
    return ''.join(out)

def _effect_flags(text,row):
    s=_strip_js_literals_and_comments(text)
    assign_targets=row.get('assignment_targets',[])
    return {
        'dom_reference': bool(re.search(r'\b(?:document|HTMLElement|querySelector|querySelectorAll|getElementById|getElementsByClassName|createElement)\b',s)),
        'dom_write': bool(row.get('source_flags',{}).get('dom_write')) or bool(re.search(r'\.(?:innerHTML|outerHTML|textContent|innerText|className|style)\s*=|insertAdjacentHTML|replaceChildren|appendChild|removeChild',s)),
        'event_listener': bool(row.get('source_flags',{}).get('event_listener')) or '.addEventListener(' in s,
        'storage_reference': bool(row.get('source_flags',{}).get('storage_access')) or bool(re.search(r'\b(?:localStorage|sessionStorage)\b',s)),
        'question_bank_reference': bool(row.get('source_flags',{}).get('question_bank_reference')) or 'QUESTION_BANK' in s,
        'profile_schema_reference': bool(row.get('source_flags',{}).get('profile_schema_reference')) or bool(re.search(r'\b(?:PROFILE_SCHEMA|profileSchema)\b',s)),
        'late_fix_or_boot': bool(row.get('source_flags',{}).get('late_fix_reference')) or bool(re.search(r'\bapplyV\d+LateFixes\b|DOMContentLoaded|FEQUEST_SELF_CHECK',s)),
        'render_navigation_reference': bool(re.search(r'\b(?:render[A-Z]\w*|navigateTo|history|location|scrollIntoView|scrollTo)\b',s)),
        'timer_async_reference': bool(re.search(r'\b(?:setTimeout|setInterval|requestAnimationFrame|Promise|async|await)\b',s)),
        'audit_contract_reference': bool(re.search(r'\b(?:Audit|Contract|SelfCheck|assert)\b',s)),
        'global_export_write': bool(row.get('global_exports')),
        'assignment_write_marker': bool(assign_targets),
    }

def analyze_patch_effects(patch_fixture):
    rows=patch_fixture['blocks']
    # Only symbols introduced by the patch chain are used for patch-to-patch dependency edges.
    defs_by_symbol={}
    exact_writes={}
    normalized=[]
    for idx,row in enumerate(rows):
        named=set(row.get('function_declarations',[]))|set(row.get('lexical_declarations',[]))|set(row.get('class_declarations',[]))|set(row.get('global_exports',[]))
        simple_assign={x for x in row.get('assignment_targets',[]) if re.fullmatch(r'[A-Za-z_$][A-Za-z0-9_$]*',x)}
        named |= simple_assign
        for sym in named:
            defs_by_symbol.setdefault(sym,[]).append(idx)
        writes=set()
        writes.update('function:'+x for x in row.get('function_declarations',[]))
        writes.update('lexical:'+x for x in row.get('lexical_declarations',[]))
        writes.update('class:'+x for x in row.get('class_declarations',[]))
        writes.update('global:'+x for x in row.get('global_exports',[]))
        writes.update('assign:'+x for x in row.get('assignment_targets',[]))
        for target in writes:
            exact_writes.setdefault(target,[]).append(idx)
        normalized.append({'idx':idx,'path':row['path'],'named_defs':sorted(named),'write_targets':sorted(writes)})
    universe=set(defs_by_symbol)
    refs_by_block=[]
    for idx,row in enumerate(rows):
        text=Path(row['path']).read_text()
        clean=_strip_js_literals_and_comments(text)
        tokens=set(IDENT_RE.findall(clean))
        own=set(normalized[idx]['named_defs'])
        refs=sorted((tokens & universe)-own)
        refs_by_block.append(refs)
    edges=[]
    provider_to_edges={i:[] for i in range(len(rows))}
    consumer_to_edges={i:[] for i in range(len(rows))}
    for consumer,refs in enumerate(refs_by_block):
        for sym in refs:
            prior=[i for i in defs_by_symbol.get(sym,[]) if i<consumer]
            if not prior:
                continue
            provider=max(prior)
            edge={'provider':rows[provider]['path'],'consumer':rows[consumer]['path'],'symbol':sym}
            edges.append(edge)
            provider_to_edges[provider].append(edge)
            consumer_to_edges[consumer].append(edge)
    definition_chains=[]
    for sym,idxs in sorted(defs_by_symbol.items()):
        if len(idxs)>1:
            definition_chains.append({'symbol':sym,'blocks':[rows[i]['path'] for i in idxs]})
    write_chains=[]
    for target,idxs in sorted(exact_writes.items()):
        if len(idxs)>1:
            write_chains.append({'target':target,'blocks':[rows[i]['path'] for i in idxs]})
    rewrite_members=set()
    for ch in definition_chains:
        rewrite_members.update(ch['blocks'])
    for ch in write_chains:
        rewrite_members.update(ch['blocks'])
    block_results=[]
    category_counts={}
    provider_blocks=0
    effect_marker_blocks=0
    leaf_review_blocks=0
    rewrite_review_blocks=0
    for idx,row in enumerate(rows):
        text=Path(row['path']).read_text()
        flags=_effect_flags(text,row)
        cats=sorted(k for k,v in flags.items() if v)
        for c in cats:
            category_counts[c]=category_counts.get(c,0)+1
        provides=sorted({e['symbol'] for e in provider_to_edges[idx]})
        consumes=sorted({e['symbol'] for e in consumer_to_edges[idx]})
        is_provider=bool(provides)
        has_effect=bool(cats)
        is_rewrite=row['path'] in rewrite_members
        if is_provider:
            provider_blocks+=1
        if has_effect:
            effect_marker_blocks+=1
        if is_rewrite:
            rewrite_review_blocks+=1
        patch_local_leaf=(not is_provider and not has_effect and not is_rewrite)
        if patch_local_leaf:
            leaf_review_blocks+=1
        roles=[]
        if is_provider: roles.append('dependency-provider')
        if consumes: roles.append('dependency-consumer')
        if is_rewrite: roles.append('rewrite-chain-review')
        if has_effect: roles.append('effect-marker-bearing')
        if patch_local_leaf: roles.append('patch-local-leaf-review')
        block_results.append({
            'path':row['path'],
            'version':row['version'],
            'block':row['block'],
            'definitions':normalized[idx]['named_defs'],
            'write_targets':normalized[idx]['write_targets'],
            'patch_symbol_references':refs_by_block[idx],
            'provided_to_later_symbols':provides,
            'consumed_from_prior_symbols':consumes,
            'dependency_edge_count_in':len(consumer_to_edges[idx]),
            'dependency_edge_count_out':len(provider_to_edges[idx]),
            'effect_flags':flags,
            'roles':roles,
            'equivalence_test_candidate': bool(is_rewrite or patch_local_leaf),
            'automatic_removal_candidate': False,
        })
    return {
        'analysis_method':{
            'kind':'deterministic-source-level-lexical-effect-dependency-analysis',
            'dependency_scope':'v132-v144 patch-defined symbols only; nearest prior patch definition is selected as provider',
            'effect_scope':'explicit source markers only; presence does not imply top-level execution',
            'strings_comments':'removed before dependency token analysis',
            'semantic_proof':False,
            'automatic_redundancy_decisions':False,
            'removal_requires_equivalence_test':True,
        },
        'summary':{
            'version_count':patch_fixture['patch_range']['version_count'],
            'block_count':len(rows),
            'dependency_edges':len(edges),
            'dependency_provider_blocks':provider_blocks,
            'effect_marker_blocks':effect_marker_blocks,
            'rewrite_review_blocks':rewrite_review_blocks,
            'patch_local_leaf_review_blocks':leaf_review_blocks,
            'definition_chains':len(definition_chains),
            'write_chains':len(write_chains),
            'equivalence_test_candidates':sum(1 for b in block_results if b['equivalence_test_candidate']),
            'automatic_removal_candidates':0,
            'effect_category_counts':dict(sorted(category_counts.items())),
        },
        'dependency_edges':edges,
        'definition_chains':definition_chains,
        'write_chains':write_chains,
        'blocks':block_results,
    }
