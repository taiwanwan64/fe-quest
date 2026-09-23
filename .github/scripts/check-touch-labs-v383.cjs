'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');

const source=fs.readFileSync('assets/app-v377.js','utf8');
const definitions=source.slice(source.indexOf('const LESSONS = {'),source.indexOf('const LAB_LESSON_IDS='));
const ids=[...definitions.matchAll(/^  ([a-z]+):\s*\{/gm)].map(match=>match[1]);
assert.equal(ids.length,34,'all original optional labs should be accounted for');

class Node {
  constructor(tag='div'){
    this.tag=tag;this.dataset={};this.listeners={};this.children=[];
    this.classList={add(){},remove(){},toggle(){}};
    this.queries=new Map();this.hidden=false;this.isConnected=true;
  }
  setAttribute() {}
  addEventListener(type,handler){this.listeners[type]=handler;}
  appendChild(child){this.children.push(child);}
  querySelector(selector){if(!this.queries.has(selector))this.queries.set(selector,new Node());return this.queries.get(selector);}
  querySelectorAll(){return [];}
  closest(selector){return selector==='button'?this:null;}
  focus(){this.focused=true;}
}
const grid=new Node(),body=new Node();
const document={
  body,activeElement:new Node('button'),
  getElementById(id){return id==='labLessonGrid'?grid:null;},
  createElement(tag){return new Node(tag);},
  addEventListener() {}
};
const lessons=Object.fromEntries(ids.map(id=>[id,{
  title:id,pages:[{quiz:{options:['誤り','正解'],answer:1,explain:'理由'},copy:'理解を確認'}]
}]));
const context={document,LAB_LESSON_IDS:ids,LESSONS:lessons,console};
vm.runInNewContext(fs.readFileSync('assets/lab-rebuild-v383.js','utf8'),context);
const labs=context.FEQUEST_TOUCH_LABS_V383;
assert.deepEqual([...labs.ids].sort(),[...ids].sort(),'every original lab has a rebuilt scenario');
assert.equal(grid.children.length,34);
for(const id of ids){
  labs.open(id);
  const dialog=body.children[0];
  assert.equal(dialog.hidden,false);
  assert.equal(dialog.querySelector('.touch-lab-title').textContent,id);
  assert.ok(dialog.querySelector('.touch-lab-activity').innerHTML.length>50,id);
  assert.match(dialog.querySelector('.touch-lab-check-host').innerHTML,/確かめる/);
  const select=new Node('button');select.dataset.select='1';
  dialog.listeners.click({target:select});
  assert.ok(dialog.querySelector('.touch-lab-activity').innerHTML.length>50,id);
  labs.close();assert.equal(dialog.hidden,true);
}
labs.open('binary');
const dialog=body.children[0],bit=new Node('button');
bit.dataset.bit='0';dialog.listeners.click({target:bit});
assert.match(dialog.querySelector('.touch-lab-activity').innerHTML,/10進数 <strong>8<\/strong>/);
labs.close();
labs.open('logic');
const input=new Node('button');input.dataset.input='0';
dialog.listeners.click({target:input});
assert.match(dialog.querySelector('.touch-lab-activity').innerHTML,/A：ON（1）/);
labs.close();
labs.open('tcpudp');
assert.match(dialog.querySelector('.touch-lab-activity').innerHTML,/<span>接続<\/span>.*<span>送信<\/span>.*<span>到達確認<\/span>/);
labs.close();
console.log('PASS: 34 touch labs, cards, dialog navigation, binary and logic controls');
