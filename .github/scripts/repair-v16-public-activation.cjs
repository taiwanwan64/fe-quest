const fs=require('node:fs');
const cp=require('node:child_process');
const path='.github/scripts/apply-v16-public-activation.cjs';
let source=fs.readFileSync(path,'utf8');
const lines=source.split('\n').map(line=>{
  if(line.includes("'deploy sw v16');")){
    return "deploy=replaceOne(deploy,`          grep -Fq '\\"./assets/question-catalog-ipa92-v15.json\\"' \\"$RUNNER_TEMP/site/sw.js\\"\\n`,`          grep -Fq '\\"./assets/question-catalog-ipa92-v15.json\\"' \\"$RUNNER_TEMP/site/sw.js\\"\\n          grep -Fq '\\"./assets/protected-content-provider-v376-v16.js\\"' \\"$RUNNER_TEMP/site/sw.js\\"\\n          grep -Fq '\\"./assets/question-catalog-ipa92-v16.json\\"' \\"$RUNNER_TEMP/site/sw.js\\"\\n`,'deploy sw v16');";
  }
  if(line.includes("'deploy provider version');")){
    return "deploy=replaceOne(deploy,`          grep -Fq \\"version:'v376-provider-12-ipa92-v1-v15'\\" \\"$RUNNER_TEMP/site/assets/protected-content-provider-v376-v15.js\\"\\n`,`          grep -Fq \\"version:'v376-provider-12-ipa92-v1-v15'\\" \\"$RUNNER_TEMP/site/assets/protected-content-provider-v376-v15.js\\"\\n          grep -Fq \\"version:'v376-provider-13-ipa92-v1-v16'\\" \\"$RUNNER_TEMP/site/assets/protected-content-provider-v376-v16.js\\"\\n`,'deploy provider version');";
  }
  return line;
});
source=lines.join('\n');
fs.writeFileSync(path,source,'utf8');
const check=cp.spawnSync(process.execPath,['--check',path],{stdio:'inherit'});
if(check.status!==0)process.exit(check.status||1);
const run=cp.spawnSync(process.execPath,[path],{stdio:'inherit'});
if(run.status!==0)process.exit(run.status||1);
try{fs.unlinkSync('.github/scripts/repair-v16-public-activation.cjs')}catch(error){if(error.code!=='ENOENT')throw error}
console.log('PASS repaired and applied v16 public activation');
