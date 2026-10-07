import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const app = fs.readFileSync('assets/app-v377.js','utf8');
const start = app.indexOf('function setCourseSubject(subject,save=true){');
const end = app.indexOf("\ndocument.querySelectorAll('[data-course-subject]').forEach(btn=>{\n  btn.addEventListener",start);
assert.ok(start>=0 && end>start);
const setter = app.slice(start,end);
const restore = app.split('\n').filter(line=>line.includes('queueMicrotask(()=>setCourseSubject(activeCourseSubject,false))'));
assert.equal(restore.length,1);
assert.ok(!app.split('\n').includes('setCourseSubject(activeCourseSubject,false);'));
const declaration = name => app.split('\n').find(line=>line.startsWith(`const ${name}=`));
assert.ok(declaration('B_EXERCISES') && declaration('SECURITY_SCENARIOS'));

function boot(subject,restoreLine) {
  const queued=[]; const saves=[]; const panels={}; const rendered=[];
  for (const name of ['subjectACoursePanel','subjectBCoursePanel']) panels[name]={hidden:null,classList:{toggle(){}},setAttribute(){}};
  const profile={settings:{lastCourseSubject:subject},xp:1247,lessonProgress:{core_21_01:100},recentHistory:['chapter21:12/12']};
  const before=JSON.stringify(profile);
  const context=vm.createContext({profile,document:{getElementById:id=>panels[id],querySelectorAll:()=>[]},queueMicrotask:fn=>queued.push(fn),saveProfile:()=>saves.push(true),record:counts=>rendered.push(counts)});
  vm.runInContext(`let activeCourseSubject=profile.settings?.lastCourseSubject==='B'?'B':'A';\n${setter}\nfunction renderSubjectBHub(){record([B_EXERCISES.length,SECURITY_SCENARIOS.length]);}\n${restoreLine}\n${declaration('B_EXERCISES')}\n${declaration('SECURITY_SCENARIOS')}`,context);
  queued.forEach(fn=>fn());
  assert.equal(JSON.stringify(profile),before,'cold restoration must not mutate profile');
  assert.equal(saves.length,0,'cold restoration must not save/reset progress');
  assert.equal(panels.subjectACoursePanel.hidden,subject==='B');
  assert.equal(panels.subjectBCoursePanel.hidden,subject!=='B');
  if(subject==='B') assert.deepEqual(rendered.map(x=>Array.from(x)),[[20,15]]);
  else assert.equal(rendered.length,0);
}
assert.throws(()=>boot('B','setCourseSubject(activeCourseSubject,false);'),/before initialization/,'reproduce original saved-B startup fault');
boot('A',restore[0]); boot('B',restore[0]);
console.log('PASS saved A/B cold boot: actual setter deferred beyond catalog declarations, 20+15, no profile writes; original TDZ reproduced');
