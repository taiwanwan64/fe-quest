function subjectAPracticeEvidenceV362(){
  if(profile.diagnosticCompleted===true)return true;
  if(Object.keys(safeObject(profile.diagnosticScores)).length)return true;
  return Object.values(safeObject(profile.qStats)).some(stat=>(Number(stat?.attempts)||0)>0);
}

function readinessComponents(){
  const lesson=lessonCompletionAverage();
  const skillVals=sortedSkills().map(x=>x[1]);
  const skill=skillVals.length?Math.round(skillVals.reduce((a,b)=>a+b,0)/skillVals.length):0;
  const quiz=recentQuizRate();
  const cognitive=subjectACognitiveEvidence();
  // profile.skills starts at a neutral 50 for adaptive question selection. It is
  // not learning evidence and must not make a fresh/reset learner look 18% done.
  const aPractice=subjectAPracticeEvidenceV362()
    ? Math.round(skill*.35 + quiz*.30 + cognitive*.35)
    : 0;

  const fullMocks=(profile.mockHistory||[]).filter(x=>x.mode==='full');
  const halfMocks=(profile.mockHistory||[]).filter(x=>x.mode==='half');
  const aMock=fullMocks.length?recentAverageRate(fullMocks,3):Math.round(recentAverageRate(halfMocks,2)*.8);

  const bAlgo=objectCompletion(profile.bProgress,B_EXERCISES.length);
  const bSec=objectCompletion(profile.securityBProgress,SECURITY_SCENARIOS.length);
  const bTraining=Math.round((bAlgo+bSec)/2);
  const bExam=recentAverageRate(profile.bFinalHistory||[],3);

  const mem=memoryHealth();
  const memoryEvidence=mem.attempted?Math.round(mem.avg*Math.min(1,mem.attempted/60)):0;

  return {lesson,aPractice,aMock,bTraining,bExam,memoryEvidence,cognitive};
}
