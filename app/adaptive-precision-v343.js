// FE QUEST v343 — Subject A adaptive evidence confidence.
// This is injected into app-v343.js in place of the previous recommendedPrescription().
// It deliberately reuses existing profile fields; no profile schema migration is required.
const V343_ADAPTIVE_PRECISION_SPEC=Object.freeze({
  version:'v343',
  reasonWindowDays:30,
  minDistinctReasonQuestions:2,
  minTimedAnswers:5,
  slowSeconds:110,
  weakAccuracyThreshold:80,
  policy:'accuracy-and-repeat-primary-reason-time-gated-no-schema-change'
});
const V343_SUBJECT_A_REASONS=Object.freeze(['知識不足','計算ミス','読み違い','2択で迷った','時間不足']);

function subjectAEvidenceAgeDaysV343(value){
  const raw=String(value||'').trim();
  if(!/^\d{4}-\d{2}-\d{2}$/.test(raw))return null;
  const at=Date.parse(raw+'T00:00:00Z');
  const now=Date.parse(localDateISO(0)+'T00:00:00Z');
  if(!Number.isFinite(at)||!Number.isFinite(now))return null;
  return Math.max(0,Math.floor((now-at)/86400000));
}
function subjectAAdaptiveEvidenceV343(cat){
  ensureQuestionProfile();
  const ids=[...new Set(weakQuestionIdsForCat(cat))];
  const reasonCounts={};
  const recentReasonCounts={};
  let timedAnswers=0,weightedSeconds=0;
  ids.forEach(id=>{
    const qst=profile.qStats?.[id]||{};
    const mst=profile.mockMistakeStats?.[id]||{};
    const timed=Math.max(0,Number(qst.timedAnswers)||0);
    const avg=Math.max(0,Number(qst.avgSeconds)||0);
    if(timed>0&&avg>0){timedAnswers+=timed;weightedSeconds+=timed*avg;}
    const reason=normalizeReason(reasonForQuestion(id));
    if(!V343_SUBJECT_A_REASONS.includes(reason))return;
    reasonCounts[reason]=(reasonCounts[reason]||0)+1;
    const dates=[qst.last,mst.last].filter(Boolean).sort();
    const age=subjectAEvidenceAgeDaysV343(dates.at(-1));
    if(age!=null&&age<=V343_ADAPTIVE_PRECISION_SPEC.reasonWindowDays){
      recentReasonCounts[reason]=(recentReasonCounts[reason]||0)+1;
    }
  });
  const ranked=Object.entries(reasonCounts).sort((a,b)=>b[1]-a[1]||V343_SUBJECT_A_REASONS.indexOf(a[0])-V343_SUBJECT_A_REASONS.indexOf(b[0]));
  const reason=ranked[0]?.[0]||null;
  const reasonSupport=ranked[0]?.[1]||0;
  const secondSupport=ranked[1]?.[1]||0;
  const recentReasonSupport=reason?(recentReasonCounts[reason]||0):0;
  const reasonConfident=!!reason&&reasonSupport>=V343_ADAPTIVE_PRECISION_SPEC.minDistinctReasonQuestions&&recentReasonSupport>=1&&reasonSupport>secondSupport;
  return {
    cat,
    reason,
    reasonSupport,
    recentReasonSupport,
    reasonConfident,
    timedAnswers,
    avgSeconds:timedAnswers?Math.round(weightedSeconds/timedAnswers):0,
    timingConfident:timedAnswers>=V343_ADAPTIVE_PRECISION_SPEC.minTimedAnswers
  };
}
function subjectAPrescriptionDecisionV343(top,evidence){
  const e=evidence||{};
  const accuracy=Number(top?.accuracy);
  const weakAccuracy=Number.isFinite(accuracy)&&accuracy<V343_ADAPTIVE_PRECISION_SPEC.weakAccuracyThreshold;
  const repeats=Math.max(0,Number(top?.repeats)||0);
  const reason=e.reason||null;
  const base={cat:top?.cat||'基礎理論',priority:Number(top?.priority)||0,v343Evidence:{...e,weakAccuracy,repeats}};

  if(e.reasonConfident){
    if(reason==='計算ミス')return {...base,kind:'calc',reason,evidenceConfidence:'reason-repeated'};
    if(reason==='読み違い')return {...base,kind:'read',reason,evidenceConfidence:'reason-repeated'};
    if(reason==='2択で迷った')return {...base,kind:'contrast',reason,evidenceConfidence:'reason-repeated'};
    if(reason==='時間不足'&&e.timingConfident&&e.avgSeconds>=V343_ADAPTIVE_PRECISION_SPEC.slowSeconds&&weakAccuracy){
      return {...base,kind:'speed',reason,evidenceConfidence:'reason-and-time'};
    }
    if(reason==='知識不足')return {...base,kind:'knowledge',reason,evidenceConfidence:'reason-repeated'};
  }

  // A single recent time-shortage report may become actionable only when measured timing
  // and weak accuracy corroborate it. Slow-but-correct data alone must never force speed work.
  if(reason==='時間不足'&&e.reasonSupport>=1&&e.recentReasonSupport>=1&&e.timingConfident&&e.avgSeconds>=V343_ADAPTIVE_PRECISION_SPEC.slowSeconds&&weakAccuracy){
    return {...base,kind:'speed',reason,evidenceConfidence:'reason-time-corroborated'};
  }
  if(repeats>=2)return {...base,kind:'repeat',reason:'繰り返し誤答',evidenceConfidence:'repeat-errors'};
  return {...base,kind:'knowledge',reason:'データ不足',evidenceConfidence:'insufficient'};
}
function recommendedPrescription(){
  const top=sortedCategoryAnalytics()[0]||{cat:'基礎理論',dominant:'データ不足',avgSec:0,repeats:0,priority:0,accuracy:0};
  const evidence=subjectAAdaptiveEvidenceV343(top.cat);
  return subjectAPrescriptionDecisionV343(top,evidence);
}
globalThis.V343_ADAPTIVE_PRECISION_SPEC=V343_ADAPTIVE_PRECISION_SPEC;
globalThis.subjectAAdaptiveEvidenceV343=subjectAAdaptiveEvidenceV343;
globalThis.subjectAPrescriptionDecisionV343=subjectAPrescriptionDecisionV343;
