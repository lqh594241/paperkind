(function () {
  'use strict';
  const C = KnitChart, $ = id => document.getElementById(id);
  if (!$('studio')) return;
  let state = C.sample(C.create(), 'diamonds'); state.title = 'Diamond repeat study';
  let selected = 1, tool = 'paint', cursor = 0, drawing = false, strokeBefore = null, last = null, panning = null;
  const past = [], future = [], clone = s => structuredClone(s);
  const msg = (text = '', error = false) => { $('chart-status').textContent = text; $('chart-status').hidden = !text; $('chart-status').classList.toggle('error', error); };
  const safely = fn => async event => { try { await fn(event); } catch (e) { msg(e.message, true); } };
  function remember(before) { past.push(before); if (past.length > 50) past.shift(); future.length = 0; }
  function change(fn, text = '') { const before = clone(state), next = fn(clone(state)); state = C.validate(next); remember(before); cursor = Math.min(cursor, state.cells.length - 1); render(true); msg(text); }
  function history(redo = false) { if (drawing) endStroke(); const from = redo ? future : past, to = redo ? past : future; if (!from.length) return; to.push(clone(state)); state = from.pop(); cursor = Math.min(cursor,state.cells.length-1); render(true); msg(redo ? 'Change restored.' : 'Last change undone.'); }
  function syncFields() {
    for(const [id,value] of Object.entries({'chart-title':state.title,'chart-cols':state.cols,'chart-rows':state.rows,'gauge-stitches':state.gauge.stitches,'gauge-rows':state.gauge.rows,'gauge-unit':state.gauge.unit,'chart-working':state.working}))$(id).value=value;
  }
  function selection() {
    const svg=$('chart-viewport').querySelector('svg'); if (!svg) return;
    svg.querySelector('[data-cursor]')?.remove();
    const r=Math.floor(cursor/state.cols),col=cursor%state.cols,dy=18*C.dimensions(state).ratio;
    const rect=document.createElementNS('http://www.w3.org/2000/svg','rect');
    for(const [key,value] of Object.entries({x:40+col*18,y:40+(state.rows-1-r)*dy,width:18,height:dy,fill:'none',stroke:'#182b20','stroke-width':2.5,'pointer-events':'none','data-cursor':''}))rect.setAttribute(key,String(value));
    svg.append(rect); $('chart-cursor').textContent=`Stitch ${state.cols-col}, row ${r+1} · ${state.cells[cursor]?String.fromCharCode(64+state.cells[cursor]):'background'}`;
  }
  function renderChart() {
    $('chart-viewport').innerHTML=C.svg(state,{symbols:$('chart-symbols').checked});
    const svg=$('chart-viewport').querySelector('svg'),zoom=$('chart-zoom').value;
    svg.style.width=zoom==='fit'?'100%':`${Number(svg.getAttribute('width'))*Number(zoom)}px`;
    svg.style.maxWidth=zoom==='fit'?'100%':'none';
    selection();
  }
  function palette() {
    $('chart-palette').replaceChildren();
    for(let i=1;i<=6;i++) {
      const button=document.createElement('button');button.type='button';button.textContent=String.fromCharCode(64+i);
      button.style.background=state.palette[i-1];button.style.color=C.contrast(state.palette[i-1]);button.setAttribute('aria-label',`Color ${button.textContent}, ${state.palette[i-1]}`);button.setAttribute('aria-pressed',String(selected===i));
      button.addEventListener('click',()=>{selected=i;palette();});$('chart-palette').append(button);
    }
    $('chart-color').value=state.palette[selected-1];
  }
  function exportOptions() { return {paper:$('chart-paper').value,orientation:$('chart-orientation').value,cell:Site.val('chart-print-cell',3,8),symbols:$('chart-symbols').checked}; }
  function printPlan() {
    try { const p=C.plan(state,exportOptions());$('chart-print-plan').textContent=`${p.total} ${p.total===1?'page':'pages'} · ${p.tilesX} across × ${p.tilesY} bands · ${p.cell} × ${p.cellHeight.toFixed(2)} mm cells`;for(const id of ['chart-pdf','chart-blank'])$(id).disabled=false; }
    catch(e){$('chart-print-plan').textContent=e.message;for(const id of ['chart-pdf','chart-blank'])$(id).disabled=true;}
  }
  function render(fields=false) {
    if(fields)syncFields(); renderChart();palette();
    const g=C.dimensions(state);$('gauge-summary').textContent=`Row height / stitch width: ${g.ratio.toFixed(4)}`;
    $('chart-dimensions').textContent=`${Number(g.width.toFixed(2))} × ${Number(g.height.toFixed(2))} ${g.unit}`;
    $('chart-counts').replaceChildren(); C.counts(state).forEach((n,i)=>{const item=document.createElement('span'),swatch=document.createElement('i');swatch.style.background=i?state.palette[i-1]:'#fffdf6';item.append(swatch,`${i?String.fromCharCode(64+i):'Background'} ${n.toLocaleString('en-US')}`);$('chart-counts').append(item);});
    $('chart-repeat').innerHTML=C.svg(state,{symbols:false,repeat:true});
    $('chart-undo').disabled=!past.length;$('chart-redo').disabled=!future.length;printPlan();
  }
  function flood(index,value) {
    const old=state.cells[index];if(old===value)return;
    const stack=[index];state.cells[index]=value;
    while(stack.length){const i=stack.pop(),col=i%state.cols;for(const j of [col?i-1:-1,col<state.cols-1?i+1:-1,i-state.cols,i+state.cols])if(j>=0&&j<state.cells.length&&state.cells[j]===old){state.cells[j]=value;stack.push(j);}}
  }
  function paint(index,erase=false) {
    cursor=index;const value=erase||tool==='erase'?0:selected;
    if(tool==='fill'&&!erase)flood(index,value);else state.cells[index]=value;
    if($('chart-symmetry').checked){const mirror=Math.floor(index/state.cols)*state.cols+state.cols-1-index%state.cols;if(tool==='fill'&&!erase)flood(mirror,value);else state.cells[mirror]=value;}
  }
  function at(event) {
    const svg=$('chart-viewport').querySelector('svg'),rect=svg.getBoundingClientRect(),view=svg.viewBox.baseVal;
    const x=(event.clientX-rect.left)*view.width/rect.width,y=(event.clientY-rect.top)*view.height/rect.height;
    const col=Math.floor((x-40)/18),r=state.rows-1-Math.floor((y-40)/(18*C.dimensions(state).ratio));
    return col>=0&&col<state.cols&&r>=0&&r<state.rows?r*state.cols+col:null;
  }
  function segment(from,to) {
    const c1=from%state.cols,r1=Math.floor(from/state.cols),c2=to%state.cols,r2=Math.floor(to/state.cols),steps=Math.max(Math.abs(c2-c1),Math.abs(r2-r1));
    for(let i=0;i<=steps;i++){const f=steps?i/steps:0;paint(Math.round(r1+(r2-r1)*f)*state.cols+Math.round(c1+(c2-c1)*f));}
  }
  function endStroke(){panning=null;if(!drawing)return;drawing=false;last=null;if(strokeBefore&&strokeBefore.cells.some((v,i)=>v!==state.cells[i]))remember(strokeBefore);strokeBefore=null;render();}
  $('chart-viewport').addEventListener('pointerdown',e=>{if(e.button!==0)return;if(tool==='pan'){e.preventDefault();panning={x:e.clientX,y:e.clientY};$('chart-viewport').focus({preventScroll:true});return;}const i=at(e);if(i===null)return;e.preventDefault();$('chart-viewport').focus({preventScroll:true});drawing=true;strokeBefore=clone(state);paint(i);last=i;renderChart();});
  $('chart-viewport').addEventListener('pointermove',e=>{if(panning){$('chart-viewport').scrollLeft-=e.clientX-panning.x;$('chart-viewport').scrollTop-=e.clientY-panning.y;panning={x:e.clientX,y:e.clientY};return;}if(!drawing||tool==='fill')return;const i=at(e);if(i===null||i===last)return;segment(last??i,i);last=i;renderChart();});
  window.addEventListener('pointerup',endStroke);window.addEventListener('pointercancel',endStroke);window.addEventListener('blur',endStroke);
  $('chart-viewport').addEventListener('keydown',e=>{
    let col=cursor%state.cols,r=Math.floor(cursor/state.cols);
    if(['ArrowLeft','ArrowRight','ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();col=Math.max(0,Math.min(state.cols-1,col+(e.key==='ArrowRight'?1:e.key==='ArrowLeft'?-1:0)));r=Math.max(0,Math.min(state.rows-1,r+(e.key==='ArrowUp'?1:e.key==='ArrowDown'?-1:0)));cursor=r*state.cols+col;selection();return;}
    if(e.key===' '||e.key==='Delete'||e.key==='Backspace'){e.preventDefault();if(tool==='pan'&&e.key===' ')return;const before=clone(state);paint(cursor,e.key!==' ');remember(before);render();}
    if(/^[1-6]$/.test(e.key)){selected=Number(e.key);palette();}
  });
  document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'&&!e.target.closest('input,select,textarea')){e.preventDefault();history(e.shiftKey);}});
  for(const button of document.querySelectorAll('[data-chart-tool]'))button.addEventListener('click',()=>{endStroke();tool=button.dataset.chartTool;$('chart-viewport').classList.toggle('is-panning',tool==='pan');for(const b of document.querySelectorAll('[data-chart-tool]'))b.setAttribute('aria-pressed',String(b===button));});
  $('chart-undo').addEventListener('click',()=>history());$('chart-redo').addEventListener('click',()=>history(true));
  $('apply-gauge').addEventListener('click',safely(()=>{const stitches=Site.val('gauge-stitches',1,200),rows=Site.val('gauge-rows',1,200),unit=$('gauge-unit').value;C.gauge(stitches,rows,unit);change(s=>({...s,gauge:{stitches,rows,unit}}),'Gauge applied. Cell proportions and estimated size updated.');}));
  $('resize-chart').addEventListener('click',safely(()=>{const cols=Site.val('chart-cols',4,96,true),rows=Site.val('chart-rows',4,120,true);change(s=>C.resize(s,cols,rows),'Chart resized. Undo recovers cropped cells.');}));
  $('chart-working').addEventListener('change',()=>change(s=>({...s,working:$('chart-working').value})));
  $('chart-title').addEventListener('change',safely(()=>change(s=>({...s,title:$('chart-title').value}))));
  $('chart-color').addEventListener('change',()=>change(s=>{s.palette[selected-1]=$('chart-color').value;return s;}));
  $('mirror-chart').addEventListener('click',()=>change(s=>C.mirror(s),'Chart mirrored left to right.'));
  $('flip-chart').addEventListener('click',()=>change(s=>C.mirror(s,true),'Chart flipped top to bottom.'));
  $('clear-chart').addEventListener('click',()=>change(s=>({...s,cells:s.cells.map(()=>0)}),'Chart cleared. Undo brings your work back.'));
  $('load-sample').addEventListener('click',()=>change(s=>C.sample(s,$('chart-sample').value),'Study loaded. Undo restores the previous chart. These studies are chart sketches, not tested knitting patterns.'));
  for(const id of ['chart-symbols','chart-zoom'])$(id).addEventListener('change',renderChart);
  for(const id of ['chart-paper','chart-orientation','chart-print-cell'])$(id).addEventListener('input',printPlan);
  function save(data,ext,type){Site.download(data,`paperkind-${state.cols}x${state.rows}-chart.${ext}`,type);msg('Download prepared. Keep a project file if you want to edit this chart later.');}
  $('project-save').addEventListener('click',safely(()=>save(JSON.stringify(C.validate(state),null,2),'json','application/json')));
  $('project-open').addEventListener('click',()=>$('project-file').click());
  $('project-file').addEventListener('change',safely(async()=>{try{const file=$('project-file').files[0];if(!file)return;if(file.size>600000)throw Error('Choose a Paperkind project smaller than 600 KB.');const next=C.validate(JSON.parse(await file.text()));change(()=>next,'Project opened locally.');}finally{$('project-file').value='';}}));
  $('chart-pdf').addEventListener('click',safely(()=>save(C.pdf(state,exportOptions()),'pdf','application/pdf')));
  $('chart-blank').addEventListener('click',safely(()=>{Site.download(C.pdf(state,{...exportOptions(),blank:true}),`paperkind-${state.cols}x${state.rows}-blank.pdf`,'application/pdf');msg('Blank numbered chart prepared, using the same gauge and page settings.');}));
  $('chart-svg').addEventListener('click',safely(()=>save(C.svg(state,{symbols:$('chart-symbols').checked}),'svg','image/svg+xml')));
  $('chart-csv').addEventListener('click',safely(()=>save('\uFEFF'+C.csv(state),'csv','text/csv;charset=utf-8')));
  $('chart-png').addEventListener('click',safely(async()=>{
    const svg=C.svg(state,{symbols:$('chart-symbols').checked}),url=URL.createObjectURL(new Blob([svg],{type:'image/svg+xml'}));
    try{const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(Error('Could not render the chart image.'));image.src=url;});const scale=Math.min(2,4096/Math.max(image.naturalWidth,image.naturalHeight));const canvas=document.createElement('canvas');canvas.width=Math.round(image.naturalWidth*scale);canvas.height=Math.round(image.naturalHeight*scale);canvas.getContext('2d').drawImage(image,0,0,canvas.width,canvas.height);save(await Site.blob(canvas),'png','image/png');}finally{URL.revokeObjectURL(url);}
  }));
  window.addEventListener('beforeunload',event=>{if(!past.length)return;event.preventDefault();event.returnValue='';});
  render(true);
})();
