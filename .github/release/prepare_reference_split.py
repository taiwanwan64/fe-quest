from pathlib import Path
import shutil,subprocess,tarfile,tempfile
from split_release_common import release_context,materialize_tree

version,number,previous=release_context()[1:]
root=Path('_reference')
if root.exists():shutil.rmtree(root)
root.mkdir()
with tempfile.TemporaryDirectory() as td:
    tar_path=Path(td)/'main.tar'
    subprocess.run(['git','archive','--format=tar','origin/main','-o',str(tar_path)],check=True)
    with tarfile.open(tar_path,'r') as tf:tf.extractall(root)
materialize_tree(root,version,previous)
print(f'FEQUEST_SPLIT_RELEASE_REFERENCE_READY version={version} previous={previous} source=origin/main')
