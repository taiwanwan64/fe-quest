from pathlib import Path

p=Path('tools/v170_validate.py')
s=p.read_text()
old="const __feqSelf=globalThis.FEQUEST_SELF_CHECK;if(!__feqSelf)throw new Error('snapshot self-check missing');\nconst __feqPayload={appVersion:APP_VERSION,questionBank:__feqCanon(QUESTION_BANK),selfCheck:__feqCanon(__feqSelf),"
new="const __feqSelf=globalThis.FEQUEST_SELF_CHECK;if(!__feqSelf)throw new Error('snapshot self-check missing');\nconst __feqStableSelf={...__feqSelf};delete __feqStableSelf.checkedAt;\nconst __feqPayload={appVersion:APP_VERSION,questionBank:__feqCanon(QUESTION_BANK),selfCheck:__feqCanon(__feqStableSelf),"
if old not in s:
    if '__feqStableSelf' not in s:
        raise AssertionError('canonical snapshot marker not found')
else:
    s=s.replace(old,new,1)
old2="  'canonical_runtime_snapshot':prod_snap,\n"
new2="  'canonical_runtime_snapshot':prod_snap,\n  'canonical_snapshot_excluded_volatile_fields':['FEQUEST_SELF_CHECK.checkedAt'],\n"
if old2 in s and 'canonical_snapshot_excluded_volatile_fields' not in s:
    s=s.replace(old2,new2,1)
p.write_text(s)
print('FEQUEST_V170_CANONICAL_SNAPSHOT_STABILIZED excluded=FEQUEST_SELF_CHECK.checkedAt')
