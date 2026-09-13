const fs=require('node:fs');
const vm=require('node:vm');
const file='.github/tools/generate-ipa92-v18.cjs';
const lines=fs.readFileSync(file,'utf8').split(/\r?\n/);

function replaceLine(predicate,replacement,label){
  const indexes=[];
  for(let i=0;i<lines.length;i++)if(predicate(lines[i]))indexes.push(i);
  if(indexes.length!==1)throw new Error(`expected one ${label} line, got ${indexes.length}`);
  lines[indexes[0]]=replacement;
}
function stmt(target,oldText,newText,label){
  return `${target}=replaceOnce(${target},${JSON.stringify(oldText)},${JSON.stringify(newText)},${JSON.stringify(label)});`;
}

const pubProvider=`          grep -Fq '"./assets/protected-content-provider-v376-v17.js"' "$RUNNER_TEMP/site/sw.js"`;
const pubProviderNew=pubProvider+`\n          grep -Fq '"./assets/protected-content-provider-v376-v18.js"' "$RUNNER_TEMP/site/sw.js"`;
replaceLine(
  line=>line.includes("publication=replaceOnce(publication,'          grep -Fq")&&line.includes('protected-content-provider-v376-v17.js'),
  stmt('publication',pubProvider,pubProviderNew,'publication sw provider'),
  'publication provider'
);

const pubCatalog=`          grep -Fq '"./assets/question-catalog-ipa92-v17.json"' "$RUNNER_TEMP/site/sw.js"`;
const pubCatalogNew=pubCatalog+`\n          grep -Fq '"./assets/question-catalog-ipa92-v18.json"' "$RUNNER_TEMP/site/sw.js"`;
replaceLine(
  line=>line.includes("publication=replaceOnce(publication,'          grep -Fq")&&line.includes('question-catalog-ipa92-v17.json'),
  stmt('publication',pubCatalog,pubCatalogNew,'publication sw catalog'),
  'publication catalog'
);

const deployProvider=`          grep -Fq '"./assets/protected-content-provider-v376-v15.js"' "$RUNNER_TEMP/site/sw.js"`;
const deployProviderNew=deployProvider+`\n          grep -Fq '"./assets/protected-content-provider-v376-v18.js"' "$RUNNER_TEMP/site/sw.js"`;
replaceLine(
  line=>line.includes("deploy=replaceOnce(deploy,'          grep -Fq")&&line.includes('protected-content-provider-v376-v15.js'),
  stmt('deploy',deployProvider,deployProviderNew,'deploy sw provider'),
  'deploy provider'
);

const deployCatalog=`          grep -Fq '"./assets/question-catalog-ipa92-v15.json"' "$RUNNER_TEMP/site/sw.js"`;
const deployCatalogNew=deployCatalog+`\n          grep -Fq '"./assets/question-catalog-ipa92-v18.json"' "$RUNNER_TEMP/site/sw.js"`;
replaceLine(
  line=>line.includes("deploy=replaceOnce(deploy,'          grep -Fq")&&line.includes('question-catalog-ipa92-v15.json'),
  stmt('deploy',deployCatalog,deployCatalogNew,'deploy sw catalog'),
  'deploy catalog'
);

const source=lines.join('\n');
new vm.Script(source,{filename:file}).runInThisContext();
