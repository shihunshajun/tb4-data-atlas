const COLORS={simple:'#00a67a',medium:'#2855ff',hard:'#f0a51a',extreme:'#dc3347',unknown:'#a2a2a2'};
const LABELS={simple:'简单',medium:'中等',hard:'困难',extreme:'极难',unknown:'待核验'};
const RANGES={simple:'< 64K',medium:'64K–128K',hard:'128K–256K',extreme:'> 256K',unknown:'无有效 Token'};
let DATA,current='overall',selectedDifficulty='all',metric='domain';
const $=s=>document.querySelector(s),fmt=n=>new Intl.NumberFormat('zh-CN',{maximumFractionDigits:1}).format(n),pct=(n,d)=>d?`${(n/d*100).toFixed(1)}%`:'0%';
const compact=n=>n>=1e6?`${(n/1e6).toFixed(1)}M`:n>=1e3?`${(n/1e3).toFixed(1)}K`:fmt(n);

function active(){return DATA.views[current]}
function scopeCount(d){return selectedDifficulty==='all'?d.total:d.difficulty[selectedDifficulty]}
function renderSummary(d){
  const count=scopeCount(d),known=d.valid;
  const cards=[['任务',count,selectedDifficulty==='all'?`${fmt(known)} 条 Token 可计算`:LABELS[selectedDifficulty]],['中位 Token',compact(d.median),'完整轨迹'],['平均 Token',compact(d.mean),'完整轨迹'],['P90',compact(d.p90),'90% 任务不超过'],['总 Token',`${(d.token_sum/1e9).toFixed(2)}B`,`${fmt(d.unknown)} 条待核验`]];
  $('#summary').innerHTML=cards.map(([k,v,s])=>`<div class="stat"><b>${v}</b><span>${k}</span><small>${s}</small></div>`).join('');
  $('#heroCount').textContent=compact(d.total);$('#scopeNote').textContent=`${d.label} · ${fmt(d.total)} 个任务`;
}
function renderLegend(){
  $('#legend').innerHTML=Object.keys(LABELS).map(k=>`<span><i style="background:${COLORS[k]}"></i>${LABELS[k]}</span>`).join('');
}
function renderCategories(d){
  const rows=metric==='domain'?d.domains:d.languages,max=Math.max(...rows.map(x=>x[1]),1);
  $('#taxonomyTitle').textContent=metric==='domain'?'子任务领域分布':'编程语言分布';
  $('#categoryGrid').innerHTML=rows.slice(0,9).map(([name,n],i)=>{
    const sub=current==='overall'?[['TB4',DATA.views.tb4[metric==='domain'?'domains':'languages'].find(x=>x[0]===name)?.[1]||0],['TB2.1',DATA.views.tb21[metric==='domain'?'domains':'languages'].find(x=>x[0]===name)?.[1]||0]]:[['占比',pct(n,d.total)],['相对规模',`${(n/max*100).toFixed(0)}%`]];
    return `<article class="category-card"><header><span>${String(i+1).padStart(2,'0')} · ${name}</span><b>${fmt(n)}</b></header><div class="cat-main"><strong>${fmt(n)}</strong><span>SHARE<br><b>${pct(n,d.total)}</b></span></div><div class="mini-stack"><i style="width:${n/max*100}%;background:${i===0?'#111':'#2855ff'}"></i></div><div class="subcats">${sub.map(([k,v])=>`<div class="subcat"><span>${k}</span><b>${typeof v==='number'?fmt(v):v}</b></div>`).join('')}</div></article>`
  }).join('');
}
function renderDifficulty(d){
  const bands=Object.keys(LABELS),max=Math.max(...bands.map(k=>d.difficulty[k]),1);
  $('#difficultyScope').textContent=`${d.label} · ${fmt(d.total)} 题`;
  $('#difficultyChart').innerHTML=bands.map(k=>`<div class="bar-col" style="opacity:${selectedDifficulty==='all'||selectedDifficulty===k?1:.2}"><span class="bar-value">${fmt(d.difficulty[k])}</span><div class="bar" style="height:${d.difficulty[k]/max*88}%;background:${COLORS[k]}"></div><span class="bar-label">${LABELS[k]}</span><span class="bar-range">${RANGES[k]}</span></div>`).join('');
}
function renderHistogram(d){
  const rows=Object.entries(d.histogram),max=Math.max(...rows.map(x=>x[1]),1);
  $('#histogramChart').innerHTML=rows.map(([k,n])=>`<div class="bar-col"><span class="bar-value">${fmt(n)}</span><div class="bar" style="height:${n/max*88}%"></div><span class="bar-label">${k}</span><span class="bar-range">${pct(n,d.valid)}</span></div>`).join('');
}
function renderDatasetDifficulty(){
  const keys=['overall','tb4','tb21'];
  $('#typeDifficulty').innerHTML=keys.map(key=>{const d=DATA.views[key],parts=Object.keys(LABELS).map(k=>`<i class="d-${k==='extreme'?'very-hard':k}" style="width:${d.difficulty[k]/d.total*100}%;background:${COLORS[k]}" title="${LABELS[k]} ${fmt(d.difficulty[k])}"></i>`).join('');return `<div class="type-difficulty-row"><span class="type-name">${d.label}<small>${fmt(d.total)} 题</small></span><span class="difficulty-stack">${parts}</span><span class="type-metric"><b>${compact(d.median)}</b><small>中位 Token</small></span><span class="type-metric"><b>${pct(d.difficulty.extreme,d.total)}</b><small>极难占比</small></span><span class="type-metric"><b>${fmt(d.unknown)}</b><small>待核验</small></span></div>`}).join('');
}
function renderTable(d){
  const rows=metric==='domain'?d.domains:d.languages,max=Math.max(...rows.map(x=>x[1]),1);
  $('#tableTitle').textContent=metric==='domain'?'领域统计明细':'语言统计明细';$('#tableCount').textContent=`${fmt(rows.length)} 组`;
  $('#tableRows').innerHTML=rows.map(([name,n],i)=>`<tr><td>${String(i+1).padStart(2,'0')}</td><td><b>${name}</b></td><td>${fmt(n)}</td><td>${pct(n,d.total)}</td><td><div class="rank-track"><i style="width:${n/max*100}%"></i></div></td></tr>`).join('');
}
function render(){const d=active();renderSummary(d);renderCategories(d);renderDifficulty(d);renderHistogram(d);renderDatasetDifficulty();renderTable(d)}
async function boot(){
  DATA=await fetch('atlas-summary.json').then(r=>r.json());renderLegend();render();
  $('#viewFilter').onchange=e=>{current=e.target.value;render()};
  $('#difficultyFilter').onchange=e=>{selectedDifficulty=e.target.value;render()};
  $('#metricFilter').onchange=e=>{metric=e.target.value;render()};
  $('#resetBtn').onclick=()=>{current='overall';selectedDifficulty='all';metric='domain';$('#viewFilter').value=current;$('#difficultyFilter').value='all';$('#metricFilter').value='domain';render()};
}
boot().catch(e=>{document.body.innerHTML=`<pre style="padding:40px">数据加载失败：${e.message}</pre>`});
