function memoryHealth(){
  ensureQuestionProfile();
  const attempted=trackedQuestionPool()
    .map(q=>({q,st:profile.qStats[q.id]}))
    .filter(x=>x.st?.attempts>0);
  // An empty learning-evidence set has no retention rate. Keep the numeric fallback at
  // zero for downstream calculations; the dashboard presents it as unmeasured.
  if(!attempted.length) return {attempted:0,avg:0,fresh:0,soon:0,due:0};
  const rows=attempted.map(x=>({...x,retention:memoryRetention(x.st),weight:cognitiveWeight(x.q)}));
  const denom=rows.reduce((s,x)=>s+x.weight,0);
  const avg=Math.round(rows.reduce((s,x)=>s+(x.retention??100)*x.weight,0)/Math.max(1,denom));
  return {
    attempted:rows.length,
    avg,
    fresh:rows.filter(x=>(x.retention??100)>=93).length,
    soon:rows.filter(x=>(x.retention??100)<93 && (x.retention??100)>=80).length,
    due:rows.filter(x=>isDue(x.st) || (x.retention??100)<80).length
  };
}

// FEQUEST_V363_RENDER_MEMORY_HEALTH
function renderMemoryHealth(){
  const h=memoryHealth();
  const measured=h.attempted>0;
  const ring=document.getElementById('memoryHealthRing');
  if(ring){
    ring.style.setProperty('--memory-p',measured?h.avg:0);
    ring.classList.toggle('is-unmeasured',!measured);
    ring.setAttribute('aria-label',measured?`推定記憶保持率 ${h.avg}%`:'記憶保持率は未計測です');
  }
  const value=document.getElementById('memoryHealthValue');
  if(value) value.textContent=measured?h.avg+'%':'未計測';
  const caption=document.getElementById('memoryHealthCaption');
  if(caption) caption.textContent=measured?'推定保持':'問題演習後に表示';
  if(document.getElementById('memoryFreshCount')) document.getElementById('memoryFreshCount').textContent=h.fresh;
  if(document.getElementById('memorySoonCount')) document.getElementById('memorySoonCount').textContent=h.soon;
  if(document.getElementById('memoryDueCount')) document.getElementById('memoryDueCount').textContent=h.due;
  const note=document.getElementById('memoryHealthAdvice');
  if(note){
    if(!measured) note.textContent='問題演習をすると、問題ごとの記憶間隔を学習して復習日を調整します。';
    else if(h.due>0) note.innerHTML=`<b>${h.due}問が復習タイミングです。</b> 今日の復習では忘却リスクが高い順に出題します。`;
    else if(h.soon>0) note.innerHTML=`現在は安定しています。<b>${h.soon}問が近いうちに復習へ戻る見込み</b>です。`;
    else note.textContent='現在学習済みの問題はよく保持できています。新しい範囲を進めて構いません。';
  }
}
