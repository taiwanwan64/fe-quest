from pathlib import Path
import hashlib
p=Path('_site/index.html').read_bytes(); r=Path('_site_reference/index.html').read_bytes()
print('FEQUEST_V170_DIFF_DEBUG', 'prod-bytes='+str(len(p)), 'ref-bytes='+str(len(r)), 'prod-sha='+hashlib.sha256(p).hexdigest(), 'ref-sha='+hashlib.sha256(r).hexdigest())
limit=min(len(p),len(r)); i=next((i for i in range(limit) if p[i]!=r[i]),limit)
print('FEQUEST_V170_DIFF_FIRST',i,'prod-tail=',repr(p[max(0,i-120):i+240]),'ref-tail=',repr(r[max(0,i-120):i+240]))
# longest common prefix/suffix and middle delta
j=0
while j<limit-i and p[len(p)-1-j]==r[len(r)-1-j]: j+=1
print('FEQUEST_V170_DIFF_SPAN','prefix='+str(i),'suffix='+str(j),'prod-middle='+str(len(p)-i-j),'ref-middle='+str(len(r)-i-j))
