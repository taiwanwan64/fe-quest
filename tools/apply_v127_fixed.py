from pathlib import Path
import runpy

root=Path('.')
part1=''.join((root/f'tools/v127_p1_{i}.txt').read_text().strip() for i in range(1,5))
assert len(part1)==3800
(root/'tools/v127_part1.txt').write_text(part1)
runpy.run_path(str(root/'tools/apply_v127.py'),run_name='__main__')
