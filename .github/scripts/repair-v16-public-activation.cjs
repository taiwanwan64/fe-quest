const fs=require('node:fs');
const cp=require('node:child_process');
const path='.github/scripts/apply-v16-public-activation.cjs';
let source=fs.readFileSync(path,'utf8');
source=source.split('\n').filter(line=>{
  if(line.includes("'deploy sw v16');"))return false;
  if(line.includes("'deploy provider version');"))return false;
  return true;
}).join('\n');
fs.writeFileSync(path,source,'utf8');
const check=cp.spawnSync(process.execPath,['--check',path],{stdio:'inherit'});
if(check.status!==0)process.exit(check.status||1);
const run=cp.spawnSync(process.execPath,[path],{stdio:'inherit'});
if(run.status!==0)process.exit(run.status||1);
try{fs.unlinkSync('.github/scripts/repair-v16-public-activation.cjs')}catch(error){if(error.code!=='ENOENT')throw error}
console.log('PASS repaired and applied v16 public activation');
