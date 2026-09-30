import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source=fs.readFileSync('assets/app-v377.js','utf8');
const begin=source.indexOf('function formatVisibleExponentsV377(');
const end=source.indexOf("if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',installExponentTypographyV377",begin);
assert.ok(begin>0&&end>begin,'typography adapter exists');

const TEXT=3,ELEMENT=1,FRAGMENT=11;
class NodeMock{
  constructor(type,value='',tag=''){this.nodeType=type;this.nodeValue=value;this.tag=tag;this.children=[];this.parentElement=null;this.className='';}
  append(child){this.children.push(child);child.parentElement=this.nodeType===ELEMENT?this:this.parentElement;}
  matches(){return ['pre','code','kbd','samp','textarea','script','style','svg'].includes(this.tag);}
  closest(){for(let p=this;p;p=p.parentElement)if(p.matches())return p;return null;}
  replaceWith(fragment){const parent=this.parentElement;const i=parent.children.indexOf(this);assert.ok(i>=0);parent.children.splice(i,1,...fragment.children);for(const child of fragment.children)child.parentElement=parent;}
  set textContent(value){this.children=[new NodeMock(TEXT,String(value))];this.children[0].parentElement=this;}
  get textContent(){return this.nodeType===TEXT?this.nodeValue:this.children.map(x=>x.textContent).join('');}
}
const body=new NodeMock(ELEMENT,'','body');
const paragraph=new NodeMock(ELEMENT,'','p');paragraph.append(new NodeMock(TEXT,'1.23×10^9 と 2^(n−1)、2^0'));
const code=new NodeMock(ELEMENT,'','pre');code.append(new NodeMock(TEXT,'1^0 はコード'));
body.append(paragraph);body.append(code);
let observer;
const document={body,createTextNode:s=>new NodeMock(TEXT,s),createElement:tag=>new NodeMock(ELEMENT,'',tag),createDocumentFragment:()=>new NodeMock(FRAGMENT),createTreeWalker(root){
  const nodes=[];function visit(node){for(const child of node.children){if(child.nodeType===TEXT)nodes.push(child);else visit(child);}}visit(root);
  let i=0;return {get currentNode(){return nodes[i-1]},nextNode(){return i<nodes.length?nodes[i++]:null}};
}};
const context={document,Node:{TEXT_NODE:TEXT,ELEMENT_NODE:ELEMENT},NodeFilter:{SHOW_TEXT:4},MutationObserver:class{constructor(callback){observer=callback}observe(){}}};
vm.createContext(context);vm.runInContext(source.slice(begin,end)+'\ninstallExponentTypographyV377();',context);
assert.equal(paragraph.textContent,'1.23×109 と 2n−1、20');
assert.deepEqual(paragraph.children.filter(x=>x.tag==='sup').map(x=>x.textContent),['9','n−1','0']);
assert.equal(code.textContent,'1^0 はコード');
const late=new NodeMock(ELEMENT,'','div');late.append(new NodeMock(TEXT,'後から 10^-3'));body.append(late);
observer([{type:'childList',addedNodes:[late]}]);
assert.equal(late.children.find(x=>x.tag==='sup')?.textContent,'-3');
assert.equal(late.textContent,'後から 10-3');
const units=new NodeMock(ELEMENT,'','p');
units.append(new NodeMock(TEXT,'10^9Hz、10^6bit、10^-3s、10^3MB、10^9foo、10^9Hz_value、10^9Hz2'));
body.append(units);
observer([{type:'childList',addedNodes:[units]}]);
assert.deepEqual(units.children.filter(x=>x.tag==='sup').map(x=>x.textContent),['9','6','-3','3']);
assert.equal(units.textContent,'109Hz、106bit、10-3s、103MB、10^9foo、10^9Hz_value、10^9Hz2');
const lateText=new NodeMock(TEXT,'更新後は 10^9Hz');
const changing=new NodeMock(ELEMENT,'','span');changing.append(lateText);body.append(changing);
observer([{type:'characterData',target:lateText}]);
assert.equal(changing.children.find(x=>x.tag==='sup')?.textContent,'9');
assert.equal(changing.textContent,'更新後は 109Hz');
console.log('PASS exponent typography: initial and late text, signed and parenthesized powers, code preserved');
