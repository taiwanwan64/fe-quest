// ===== v122: Core A prose tone normalization =====
// Explanatory prose is shown in です・ます調. Formulae, labels, and short non-sentence fragments remain unchanged.
function politeCoreSentence(sentence){
  let src=String(sentence??'').trim();
  if(!src)return '';
  const hadStop=src.endsWith('。');
  let body=hadStop?src.slice(0,-1):src;
  if(/(?:です|ます|ません|でしょう|ください|しましょう)$/.test(body))return body+'。';

  const fixed=[
    ['とは限らない','とは限りません'],['わけではない','わけではありません'],['ではない','ではありません'],
    ['とはいえない','とはいえません'],['いえない','いえません'],['できない','できません'],
    ['必要がない','必要がありません'],['意味がない','意味がありません'],['値がない','値がありません'],['余裕がない','余裕がありません'],
    ['必要がある','必要があります'],['可能性がある','可能性があります'],['ことがある','ことがあります'],['ことが多い','ことが多いです'],
    ['である','です'],['という','といいます'],['し得る','する場合があります'],['得る','得ます'],
    ['となる','となります'],['になる','になります'],['ある','あります'],['いる','います'],['できる','できます'],
    ['られる','られます'],['れる','れます'],['せる','せます'],['する','します']
  ];
  for(const [from,to] of fixed){if(body.endsWith(from)){body=body.slice(0,-from.length)+to;return body+'。';}}

  const negative=[['しない','しません'],['わない','いません'],['かない','きません'],['さない','しません'],['たない','ちません'],['ばない','びません'],['まない','みません'],['らない','りません']];
  for(const [from,to] of negative){if(body.endsWith(from)){body=body.slice(0,-from.length)+to;return body+'。';}}
  if(body.endsWith('くない'))return body.slice(0,-3)+'くありません。';
  if(body.endsWith('ない'))return body.slice(0,-2)+'ません。';

  const ruGodan=['入る','走る','帰る','切る','知る','要る','減る','滑る','喋る','焦る','限る','握る','参る','混じる','交じる','返る','散る','照る','練る','捻る','蹴る','湿る','茂る','覆る','蘇る','遮る','陥る','至る','渡る','上がる','下がる','変わる','つながる','異なる','決まる','残る','守る','作る','取る','割る','測る','絞る','戻る','終わる','始まる','高まる','分かる','起こる','当たる','かかる','関わる','広がる','下回る','上回る'];
  if(body.endsWith('る')){
    if(ruGodan.some(v=>body.endsWith(v)))return body.slice(0,-1)+'ります。';
    const prev=body.at(-2)||'';
    if('いきぎしじちぢにひびぴみりえけげせぜてでねへべぺめれ'.includes(prev))return body.slice(0,-1)+'ます。';
    return body.slice(0,-1)+'ります。';
  }
  const godan=[['う','います'],['く','きます'],['ぐ','ぎます'],['す','します'],['つ','ちます'],['ぬ','にます'],['ぶ','びます'],['む','みます']];
  for(const [from,to] of godan){if(body.endsWith(from))return body.slice(0,-1)+to+'。';}

  if(body.endsWith('い'))return body+'です。';
  if(body.endsWith('だ'))return body.slice(0,-1)+'です。';
  if(/[ぁ-んァ-ヶ一-龠]$/.test(body))return body+'です。';
  return body+(hadStop?'。':'');
}
function politeCoreProse(text){
  const parts=String(text??'').match(/[^。]+。?/g)||[];
  return parts.map(p=>politeCoreSentence(p)).join('');
}
function politeCoreHtml(text){return learningHtml(politeCoreProse(text));}
