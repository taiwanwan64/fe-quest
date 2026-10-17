import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

// Check the shipped SVG geometry without DOM initialization or network access.
const source=fs.readFileSync(process.argv[2]||'assets/ipa92-graph-lab-v377.js','utf8');
const boundary='validateGraph();\ninjectStyles();';
const cut=source.lastIndexOf(boundary);
assert.ok(cut>=0,'graph initialization boundary');
const context=vm.createContext({});
vm.runInContext(source.slice(0,cut)+`
globalThis.graphTest={
  render(mode,path=[],visited=[]){
    directed=mode;pathNodes=path;traversalKind=visited.length?'BFS':null;
    traversalOrder=visited;traversalIndex=visited.length-1;return graphSvg();
  },bfs,dfs,shortestPath,validateGraph
};})();`,context);
const api=context.graphTest;
assert.equal(api.validateGraph(),true);
const nodes={A:[48,120],B:[130,52],C:[130,188],D:[230,68],E:[230,172],F:[320,120]};
const edges=[['A','B'],['A','C'],['B','D'],['B','E'],['C','E'],['D','F'],['E','F']];
const attrs=text=>Object.fromEntries([...text.matchAll(/([\w-]+)="([^"]*)"/g)].map(m=>[m[1],m[2]]));
let directedEdges=0,undirectedEdges=0;
for(const directed of [false,true]){
  for(const path of [[],['A','B','D','F']]){
    for(const visited of [[],['A','B','C','D','E','F']]){
      const svg=api.render(directed,path,visited);
      const lines=[...svg.matchAll(/<line\b[^>]*\bclass="ipa92-graph-edge(?: is-path)?"[^>]*\/>/g)].map(m=>attrs(m[0]));
      const circles=[...svg.matchAll(/<circle\b[^>]*\/>/g)].map(m=>attrs(m[0]));
      assert.equal(lines.length,7);assert.equal(circles.length,6);
      circles.forEach(c=>assert.equal(Number(c.r),25));
      assert.equal(lines.filter(l=>l.class.includes('is-path')).length,path.length?3:0);
      if(directed){
        const marker=attrs(svg.match(/<marker\b[^>]*>/)?.[0]||'');
        assert.equal(Number(marker.refX),10,'arrow tip is the marker reference point');
        assert.equal(Number(marker.refY),5);assert.equal(marker.viewBox,'0 0 10 10');
        assert.equal(marker.markerUnits,'userSpaceOnUse','path highlighting keeps arrowheads at a readable size');
        assert.equal(Number(marker.markerWidth),14);assert.equal(Number(marker.markerHeight),14);
      }else assert.ok(!svg.includes('marker-end='),'undirected edges have no arrows');
      lines.forEach((l,i)=>{
        const [from,to]=edges[i],a=nodes[from],b=nodes[to];
        const start=[Number(l.x1),Number(l.y1)],end=[Number(l.x2),Number(l.y2)];
        assert.ok([...start,...end].every(Number.isFinite));
        assert.deepEqual(start,a,'edge still starts at the source vertex');
        const dx=b[0]-a[0],dy=b[1]-a[1],length=Math.hypot(dx,dy);
        const along=((end[0]-a[0])*dx+(end[1]-a[1])*dy)/length;
        const cross=Math.abs((end[0]-a[0])*dy-(end[1]-a[1])*dx)/length;
        assert.ok(cross<1e-9,'endpoint stays on the same edge');
        assert.ok(along>25&&along<=length+1e-9,'edge keeps its original direction');
        const clearance=Math.hypot(end[0]-b[0],end[1]-b[1]);
        if(directed){
          assert.equal(l['marker-end'],'url(#ipa92GraphArrow)');
          assert.ok(clearance>27.5,'arrow tip must clear radius 25 plus widest focus stroke');
          directedEdges++;
        }else{assert.deepEqual(end,b,'undirected geometry is preserved');undirectedEdges++;}
      });
    }
  }
}
for(const directed of [false,true]){
  assert.equal(Array.from(api.bfs('A',directed)).join(''),'ABCDEF');
  assert.equal(Array.from(api.dfs('A',directed)).join(''),'ABDFEC');
  assert.equal(Array.from(api.shortestPath('A','F',directed)).join(''),'ABDF');
}
assert.equal(api.shortestPath('F','A',true),null);
assert.equal(Array.from(api.shortestPath('F','A',false)).join(''),'FDBA');
console.log(`PASS graph arrows: ${directedEdges} visible directed edges, ${undirectedEdges} unchanged undirected edges; BFS/DFS/shortest paths preserved`);
