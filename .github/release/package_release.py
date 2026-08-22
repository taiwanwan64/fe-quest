from pathlib import Path
import argparse, hashlib, json, zipfile


BASE_FILES=(
    'index.html','manifest.webmanifest','sw.js',
    'icon-192.png','icon-512.png','apple-touch-icon.png'
)


def req(ok,msg):
    if not ok: raise AssertionError(msg)

def sha256(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()

def safe_rel(value):
    rel=str(value or '').replace('\\','/').lstrip('./')
    p=Path(rel)
    req(rel and not p.is_absolute() and '..' not in p.parts,'unsafe release path '+str(value))
    return p.as_posix()

def collect_release_files(site,version,layout):
    site=Path(site)
    files=list(BASE_FILES)
    if (site/'privacy.html').exists(): files.append('privacy.html')

    if layout=='split':
        manifest_rel=f'assets/asset-manifest-{version}.json'
        manifest_path=site/manifest_rel
        req(manifest_path.exists(),'split asset manifest missing')
        manifest=json.loads(manifest_path.read_text())
        req(manifest.get('version')==version,'split asset manifest version mismatch')
        files.append(manifest_rel)
        for item in manifest.get('assets') or []:
            rel=safe_rel(item.get('path'))
            path=site/rel
            req(path.exists(),'manifest asset missing '+rel)
            req(path.stat().st_size==item.get('utf8Bytes'),'manifest asset size mismatch '+rel)
            req(sha256(path)==item.get('sha256'),'manifest asset hash mismatch '+rel)
            files.append(rel)

        cloud=manifest.get('cloudActivation') or {}
        identities={safe_rel(x.get('path')):x for x in (cloud.get('assets') or [])}
        for raw in cloud.get('precache') or []:
            rel=safe_rel(raw);path=site/rel
            req(path.exists(),'cloud precache asset missing '+rel)
            item=identities.get(rel);req(item is not None,'cloud precache identity missing '+rel)
            req(path.stat().st_size==item.get('utf8Bytes'),'cloud asset size mismatch '+rel)
            req(sha256(path)==item.get('sha256'),'cloud asset hash mismatch '+rel)
            files.append(rel)
    elif layout!='inline':
        raise AssertionError('unknown release layout '+str(layout))

    out=[];seen=set()
    for raw in files:
        rel=safe_rel(raw)
        if rel in seen: continue
        req((site/rel).is_file(),'release file missing '+rel)
        seen.add(rel);out.append(rel)
    return out

def package_release(site,version,layout,output):
    site=Path(site);output=Path(output)
    files=collect_release_files(site,version,layout)
    output.parent.mkdir(parents=True,exist_ok=True)
    with zipfile.ZipFile(output,'w',compression=zipfile.ZIP_DEFLATED,compresslevel=9) as zf:
        for rel in files:
            data=(site/rel).read_bytes()
            info=zipfile.ZipInfo(rel,date_time=(1980,1,1,0,0,0))
            info.compress_type=zipfile.ZIP_DEFLATED
            info.external_attr=0o100644 << 16
            info.create_system=3
            zf.writestr(info,data,compress_type=zipfile.ZIP_DEFLATED,compresslevel=9)
    with zipfile.ZipFile(output) as zf:
        names=zf.namelist()
        req(names==files,'release ZIP member order mismatch')
        for rel in files:req(zf.read(rel)==(site/rel).read_bytes(),'release ZIP content mismatch '+rel)
    return {'path':output.as_posix(),'bytes':output.stat().st_size,'sha256':sha256(output),'files':files}

def main():
    ap=argparse.ArgumentParser()
    ap.add_argument('--site',default='_site')
    ap.add_argument('--version',required=True)
    ap.add_argument('--layout',choices=['inline','split'],required=True)
    ap.add_argument('--output',required=True)
    args=ap.parse_args()
    result=package_release(args.site,args.version,args.layout,args.output)
    print(json.dumps(result,ensure_ascii=False,indent=2))

if __name__=='__main__':main()
