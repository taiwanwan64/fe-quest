const fs=require('node:fs');
const vm=require('node:vm');
const file='.github/tools/generate-ipa92-v18.cjs';
const lines=fs.readFileSync(file,'utf8').split(/\r?\n/);

function replaceLine(label,replacement){
  const indexes=[];
  for(let i=0;i<lines.length;i++)if(lines[i].includes(`'${label}'`))indexes.push(i);
  if(indexes.length!==1)throw new Error(`expected one ${label} line, got ${indexes.length}`);
  lines[indexes[0]]=replacement;
}
function stmt(target,oldText,newText,label){
  return `${target}=replaceOnce(${target},${JSON.stringify(oldText)},${JSON.stringify(newText)},${JSON.stringify(label)});`;
}

const pubProvider=`          grep -Fq '"./assets/protected-content-provider-v376-v17.js"' "$RUNNER_TEMP/site/sw.js"`;
replaceLine('publication sw provider',stmt('publication',pubProvider,pubProvider+`\n          grep -Fq '"./assets/protected-content-provider-v376-v18.js"' "$RUNNER_TEMP/site/sw.js"`,'publication sw provider'));

const pubCatalog=`          grep -Fq '"./assets/question-catalog-ipa92-v17.json"' "$RUNNER_TEMP/site/sw.js"`;
replaceLine('publication sw catalog',stmt('publication',pubCatalog,pubCatalog+`\n          grep -Fq '"./assets/question-catalog-ipa92-v18.json"' "$RUNNER_TEMP/site/sw.js"`,'publication sw catalog'));

const deployProvider=`          grep -Fq '"./assets/protected-content-provider-v376-v15.js"' "$RUNNER_TEMP/site/sw.js"`;
replaceLine('deploy sw provider',stmt('deploy',deployProvider,deployProvider+`\n          grep -Fq '"./assets/protected-content-provider-v376-v18.js"' "$RUNNER_TEMP/site/sw.js"`,'deploy sw provider'));

const deployCatalog=`          grep -Fq '"./assets/question-catalog-ipa92-v15.json"' "$RUNNER_TEMP/site/sw.js"`;
replaceLine('deploy sw catalog',stmt('deploy',deployCatalog,deployCatalog+`\n          grep -Fq '"./assets/question-catalog-ipa92-v18.json"' "$RUNNER_TEMP/site/sw.js"`,'deploy sw catalog'));

const source=lines.join('\n');
new vm.Script(source,{filename:file}).runInThisContext();
