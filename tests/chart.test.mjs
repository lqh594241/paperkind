import test from 'node:test';
import assert from 'node:assert/strict';
import '../pdf.js';
import '../chart.js';
const C=globalThis.KnitChart;

test('blocked gauge gives stitch proportions and estimated fabric dimensions',()=>{
  const state=C.create();
  const d=C.dimensions(state);
  assert.equal(d.ratio,20/28);
  assert.equal(d.width,16);
  assert.ok(Math.abs(d.height-12.857142857)<1e-8);
  state.gauge.unit='in';
  assert.equal(C.dimensions(state).width,6.4);
  assert.throws(()=>C.gauge(200,1),/ratios/);
  assert.throws(()=>C.gauge(NaN,28),/stitches/);
});

test('resize preserves stitch numbers from the bottom-right origin; mirror is reversible',()=>{
  const s=C.create(4,4);s.cells[0]=1;s.cells[15]=6;
  const wider=C.resize(s,6,5);
  assert.equal(wider.cells[2],1);assert.equal(wider.cells[3*6+5],6);
  assert.deepEqual(C.resize(wider,4,4).cells,s.cells);
  assert.deepEqual(C.mirror(C.mirror(s)).cells,s.cells);
  assert.deepEqual(C.mirror(C.mirror(s,true),true).cells,s.cells);
  assert.equal(C.mirror(s).cells[3],1);
});

test('project round-trip validates every cell, gauge, palette and size without trusting imported markup',()=>{
  const s=C.sample(C.create(),'diamonds');
  s.title='<img src=x onerror=alert(1)>';
  assert.deepEqual(C.validate(JSON.parse(JSON.stringify(s))),s);
  const svg=C.svg(s);
  assert.ok(!svg.includes('<img'));assert.ok(svg.includes('&lt;img'));
  assert.throws(()=>C.validate({...s,cells:[0]}),/stitch data/);
  assert.throws(()=>C.validate({...s,cells:s.cells.map(()=>7)}),/stitch data/);
  assert.throws(()=>C.validate({...s,palette:['red',...s.palette.slice(1)]}),/palette/);
  assert.throws(()=>C.validate({...s,cols:10000}),/Stitches/);
  assert.throws(()=>C.validate({...s,gauge:{stitches:0,rows:28,unit:'cm'}}));
});

test('PDF tiles cover all cells once at fixed physical cell size, with global row/stitch numbers',()=>{
  const s=C.sample(C.create(96,120),'checks');
  for(const paper of ['a4','letter','a5'])for(const orientation of ['portrait','landscape']){
    const p=C.plan(s,{paper,orientation,cell:5});
    let covered=0;
    for(let y=0;y<p.tilesY;y++)for(let x=0;x<p.tilesX;x++)covered+=Math.min(p.across,s.cols-x*p.across)*Math.min(p.high,s.rows-y*p.high);
    assert.equal(covered,s.cells.length);
    const pdf=new TextDecoder().decode(C.pdf(s,{paper,orientation,cell:5}));
    assert.equal((pdf.match(/\/Type \/Page /g)||[]).length,p.total);
    assert.ok(pdf.includes('Blank cells = background.'));
    assert.ok(pdf.includes('Gauge 20 sts / 28 rows over 10 cm'));
    assert.ok(pdf.includes(`Tile ${p.total}/${p.total}`));
    const xref=Number(pdf.match(/startxref\n(\d+)/)[1]);assert.equal(pdf.slice(xref,xref+4),'xref');
  }
  const tall={...s,gauge:{stitches:40,rows:20,unit:'cm'}};
  assert.throws(()=>C.plan(tall,{paper:'a5',cell:8}),/30 pages/);
});

test('CSV directions follow chart reading convention and color runs total each row',()=>{
  const s=C.create(4,4);s.cells=[1,1,2,0,1,0,2,2,0,0,0,0,6,6,6,6];
  const lines=C.csv(s).split('\r\n');
  assert.ok(lines[1].includes('right to left'));assert.ok(lines[1].includes('Background x1; B x1; A x2'));
  assert.ok(lines[2].includes('left to right'));assert.ok(lines[2].includes('A x1; Background x1; B x2'));
  s.working='round';assert.ok(C.csv(s).split('\r\n')[2].includes('right to left'));
  assert.equal(C.counts(s).reduce((a,b)=>a+b),16);
});
