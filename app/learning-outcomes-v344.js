const V344_LEARNING_OUTCOMES_SPEC=Object.freeze({
  version:'v344',
  profileSchemaChange:false,
  trendWindowMax:10,
  trendWindowMin:3,
  meaningfulDelta:8,
  wording:'recorded-answer-windows'
});

function analyticsOutcomeTrendV344(cat){
  const rows=analyticsAttemptStream().filter(x=>x.cat===cat);
  const recent=rows.slice(0,V344_LEARNING_OUTCOMES_SPEC.trendWindowMax);
  const previous=rows.slice(V344_LEARNING_OUTCOMES_SPEC.trendWindowMax,V344_LEARNING_OUTCOMES_SPEC.trendWindowMax*2);
  const result={cat,delta:null,recent:null,previous:null,recentN:recent.length,previousN:previous.length,totalRecorded:rows.length};
  if(recent.length<V344_LEARNING_OUTCOMES_SPEC.trendWindowMin||previous.length<V344_LEARNING_OUTCOMES_SPEC.trendWindowMin)return result;
  const pct=a=>Math.round(a.filter(x=>x.ok).length/a.length*100);
  result.recent=pct(recent);result.previous=pct(previous);result.delta=result.recent-result.previous;
  return result;
}

function learningOutcomeReportDecisionV344({sevenMinutes=0,sevenActiveDays=0,trends=[],snapshots=[],activeReview=null}={}){
  const usable=(trends||[]).filter(x=>Number.isFinite(x?.delta));
  const growth=usable.filter(x=>x.delta>=V344_LEARNING_OUTCOMES_SPEC.meaningfulDelta).sort((a,b)=>b.delta-a.delta)[0]||null;
  let growthState='pending';
  if(growth)growthState='growth';
  else if(usable.length)growthState='stable';

  let next={kind:'collect',title:'まず演習データを集める',detail:'回答が増えると、次に伸ばす分野をより具体的に案内できます。'};
  if(activeReview?.concept){
    next={kind:'review',title:`${activeReview.concept}の復習を続ける`,detail:activeReview.guidance||'進行中の復習ルートを完了すると、定着までつながります。'};
  }else{
    const attempted=(snapshots||[]).filter(x=>Number(x?.attempts)>=3&&Number.isFinite(x?.accuracy));
    if(attempted.length){
      const weak=[...attempted].sort((a,b)=>a.accuracy-b.accuracy||a.mastery-b.mastery)[0];
      next={kind:'category',cat:weak.cat,title:`${weak.cat}を次に確認`,detail:`累積正答率 ${weak.accuracy}%・習熟度 ${weak.mastery}%をもとに選んでいます。`};
    }
  }

  return {
    activity:{minutes:Math.max(0,Number(sevenMinutes)||0),activeDays:Math.max(0,Number(sevenActiveDays)||0)},
    growthState,
    growth,
    next,
    passProbability:false
  };
}

function learningOutcomeReportV344(){
  const snapshots=ANALYTICS_CATEGORIES.map(analyticsCategorySnapshot);
  const trends=ANALYTICS_CATEGORIES.map(analyticsOutcomeTrendV344);
  const active=activeReviewJourneys()[0]||null;
  return learningOutcomeReportDecisionV344({
    sevenMinutes:analyticsMinutes(7),
    sevenActiveDays:analyticsActiveDays(7),
    trends,
    snapshots,
    activeReview:active?{concept:active.concept,guidance:journeyGuidance(active)}:null
  });
}

function renderLearningOutcomeReportV344(){
  const root=document.getElementById('analyticsOutcomeReport');if(!root)return;
  const activity=document.getElementById('analyticsOutcomeActivity');
  const activityNote=document.getElementById('analyticsOutcomeActivityNote');
  const growth=document.getElementById('analyticsOutcomeGrowth');
  const growthNote=document.getElementById('analyticsOutcomeGrowthNote');
  const next=document.getElementById('analyticsOutcomeNext');
  const nextNote=document.getElementById('analyticsOutcomeNextNote');
  if(!activity||!activityNote||!growth||!growthNote||!next||!nextNote)return;

  const report=learningOutcomeReportV344();
  activity.textContent=`${report.activity.minutes}分 / ${report.activity.activeDays}日`;
  activityNote.textContent='直近7日の記録学習時間と学習日数です。';

  if(report.growthState==='growth'){
    const g=report.growth;
    growth.textContent=`${g.cat} +${g.delta}pt`;
    growthNote.textContent=`直近${g.recentN}回答 ${g.recent}% ← その前${g.previousN}回答 ${g.previous}%`;
  }else if(report.growthState==='stable'){
    growth.textContent='大きな変化はありません';
    growthNote.textContent='比較できる最近の回答では、8pt以上の上昇はまだ見られません。';
  }else{
    growth.textContent='比較データを集めています';
    growthNote.textContent='同じ分野で回答が蓄積すると、保存済み回答の範囲で変化を表示します。';
  }

  next.textContent=report.next.title;
  nextNote.textContent=report.next.detail;
}

function renderLearningAnalytics(){
  ensureQuestionProfile();
  const seven=analyticsMinutes(7),thirty=analyticsMinutes(30),days=analyticsActiveDays(30),journeys=analyticsJourneyCounts();
  document.getElementById('analytics7Min').textContent=`${seven}分`;
  document.getElementById('analytics30Min').textContent=`${thirty}分`;
  document.getElementById('analytics30Days').textContent=`${days}日`;
  document.getElementById('analyticsStable').textContent=journeys.stable;
  document.getElementById('analyticsActiveRoutes').textContent=journeys.relearn+journeys.verify+journeys.spaced;
  renderAnalyticsHeatmap();
  const snaps=ANALYTICS_CATEGORIES.map(analyticsCategorySnapshot);
  renderLearningOutcomeReportV344();
  renderAnalyticsSignals(snaps);renderAnalyticsCategories(snaps);renderAnalyticsJourneys();renderAnalyticsBFormats();renderAnalyticsNext(snaps);
}
