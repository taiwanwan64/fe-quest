from pathlib import Path

source = Path('tools/v155_validate.py').read_text(encoding='utf-8')
source = source.replace(
    '2493dafe66bfad28bde8f39e0dcd922d4ae1715b96007fc4cf259c748290447f',
    '12292fa538af35786c3f061befe060682c363b1b44620b96422a48af3d8c8658'
)
source = source.replace('==54897', '==54898')
exec(compile(source, 'tools/v155_validate.py', 'exec'), {'__name__': '__main__'})
