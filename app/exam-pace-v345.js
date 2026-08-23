const V345_EXAM_PACE_PRESENTATION_SPEC=Object.freeze({
  version:'v345',
  profileSchemaChange:false,
  evidenceBasis:'existing-exam-pace-status',
  taperPriority:true,
  passProbability:false
});

function examPaceOutcomeDecisionV345(p={}){
  const baseline=Math.max(0,Math.round(Number(p?.baseline)||0));
  const effective=Math.max(0,Math.round(Number(p?.effective)||baseline));
  const days=Number.isFinite(Number(p?.days))?Number(p.days):null;
  const phase=p?.phase?.name||'通常学習';
  const phaseIcon=p?.phase?.icon||'📅';
  if(!p?.hasExam){
    return {state:'unset',tone:'neutral',icon:'📅',title:'受験日を設定すると表示',detail:'学習計画で受験予定日を設定すると、FE QUEST内の残り学習量と学習ペースをここでも確認できます。'};
  }
  if(p?.expired){
    return {state:'expired',tone:'warn',icon:'📅',title:'受験日を更新してください',detail:'設定した受験日は経過しています。学習計画の受験予定日を確認してください。'};
  }
  const when=days===0?'受験当日':days===1?'前日':`残り${Math.max(0,days)}日`;
  if(p?.taper){
    const cap=Math.max(0,Math.round(Number(p?.taperCap)||effective));
    const reduced=effective<baseline;
    return {
      state:'taper',tone:'good',icon:phaseIcon,
      title:reduced?`直前調整：${baseline}→${effective}分/日`:`直前調整：${effective}分/日`,
      detail:reduced
        ? `${phase}・${when}。追い込みで増やさず、通常クエストを${cap}分上限へ段階的に抑えています。FE QUEST内の残り学習量を全部消化する時期ではありません。この表示は合格確率ではありません。`
        : `${phase}・${when}。現在の設定${baseline}分/日は直前期上限${cap}分以内です。負荷を増やさず、既習範囲の確認を優先します。この表示は合格確率ではありません。`
    };
  }
  const remaining=Math.max(0,Number(p?.remaining)||0);
  if(remaining<=0){
    return {state:'complete',tone:'good',icon:'✅',title:'主要メニューは完了済み',detail:`${phase}・${when}。新しい詰め込みより、復習と実戦確認を優先してください。この表示は合格確率ではありません。`};
  }
  const required=Math.max(0,Math.ceil(Number(p?.required)||0));
  const current=Math.max(0,Math.round(Number(p?.currentPace)||0));
  const observed=Math.max(0,Math.round(Number(p?.recent?.observedDays)||0));
  const source=p?.paceSource==='recent'
    ? `直近${observed}日間の記録学習時間から現在ペースを換算`
    : `学習記録がまだ少ないため設定中の${baseline}分/日を現在ペースとして試算`;
  const statusCopy={
    good:'余裕をもって進められそうです。',
    ok:'今のペースでおおむね計画どおりです。',
    warn:'少しペース調整が必要です。',
    danger:'今の設定と受験日の組み合わせを見直す余地があります。'
  };
  const tone={good:'good',ok:'ok',warn:'warn',danger:'danger'}[p?.status]||'ok';
  let adjustment='';
  if(p?.auto){
    adjustment=effective>baseline?`今日の目標は自動調整で${baseline}→${effective}分。`:`今日の目標は${effective}分。`;
  }else{
    adjustment=`自動調整はOFF・今日の目標は${effective}分。`;
  }
  return {
    state:'pace',tone,icon:phaseIcon,
    title:`必要${required}分/日・現在${current}分/日`,
    detail:`${phase}・${when}。${statusCopy[p?.status]||statusCopy.ok}${source}。${adjustment}必要ペースはFE QUEST内の推奨メニュー消化の目安で、合格確率ではありません。`
  };
}

function renderExamPaceOutcomeV345(){
  const root=document.getElementById('analyticsOutcomeExamPace');
  const title=document.getElementById('analyticsOutcomeExamPaceTitle');
  const note=document.getElementById('analyticsOutcomeExamPaceNote');
  const icon=document.getElementById('analyticsOutcomeExamPaceIcon');
  if(!root||!title||!note||!icon)return;
  const decision=examPaceOutcomeDecisionV345(examPaceStatus());
  root.dataset.tone=decision.tone;
  icon.textContent=decision.icon;
  title.textContent=decision.title;
  note.textContent=decision.detail;
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
  renderExamPaceOutcomeV345();
}
