import test from 'node:test';
import assert from 'node:assert/strict';
import '../pdf.js';
import '../core.js';
import {additions} from '../scripts/catalog-data.mjs';
const base={paper:'a4',orientation:'portrait',margin:10,spacing:5,ratio:.75,color:'#829287',major:false,ruler:true};
const geometry=(kind,spacing=5,paper='a4')=>PaperTools.geometry({...base,kind,spacing,paper});
test('catalog geometry encodes real music, notes, frames and axes',()=>{
 const staff=geometry('staff',2);const staffLines=staff.lines.filter(l=>l.y1===l.y2);
 assert.equal(staffLines.length,12*5);assert.equal(geometry('staff',2,'letter').lines.filter(l=>l.y1===l.y2).length,11*5);
 assert.equal(staffLines[4].y1-staffLines[0].y1,8);
 for(const [kind,count] of [['tab',6],['bass',4]]){const g=geometry(kind,3);const rows=g.lines.filter(l=>l.y1===l.y2);assert.equal(rows.length%count,0);assert.equal(rows[count-1].y1-rows[0].y1,(count-1)*3);}
 const cornell=geometry('cornell',7);assert.ok(cornell.lines.some(l=>l.x1===60&&l.x2===60));assert.ok(cornell.lines.some(l=>l.y1===242&&l.y2===242));assert.deepEqual(cornell.labels.slice(2).map(t=>t.value),['CUES','NOTES','SUMMARY']);
 const polar=geometry('polar');assert.equal(polar.lines.length,24);assert.equal(polar.circles[1].r-polar.circles[0].r,5);assert.ok(polar.labels.some(t=>t.value==='270'&&t.y>148.5));
 const xy=geometry('coordinate');assert.ok(xy.labels.some(t=>t.value==='-2'&&t.x<105));assert.ok(xy.labels.some(t=>t.value==='2'&&t.y<148.5));
 assert.equal(geometry('comic').lines.length,6*4);assert.equal(geometry('storyboard').labels.length,6);
 const calligraphy=geometry('calligraphy');const slant=calligraphy.lines.find(l=>l.y1!==l.y2);assert.ok(Math.abs(Math.atan2(slant.y1-slant.y2,slant.x2-slant.x1)*180/Math.PI-55)<1e-8);
 const hex=geometry('hex');for(const l of hex.lines)assert.ok(Math.abs(Math.hypot(l.x2-l.x1,l.y2-l.y1)-5)<1e-8);
});
test('every catalog preset exports vectors in both page sizes and orientations',()=>{
 assert.equal(additions.length,20);assert.equal(new Set(additions.map(t=>t.slug)).size,20);
 for(const t of additions)for(const paper of ['a4','letter'])for(const orientation of ['portrait','landscape']){
  const g=PaperTools.geometry({...base,...t,paper,orientation});
  assert.ok(g.lines.length+g.dots.length+g.circles.length>0,t.slug);
  for(const l of g.lines)assert.ok([l.x1,l.x2,l.y1,l.y2].every(Number.isFinite));
  const pdf=new TextDecoder().decode(PaperTools.pdf(g));assert.ok(pdf.startsWith('%PDF-1.4'));assert.ok(!/NaN|Infinity/.test(pdf));
  const svg=PaperTools.svg(g);assert.ok(svg.includes(`width="${g.width}mm"`));assert.ok(!/NaN|Infinity/.test(svg));
 }
 const wide=geometry('lined',8.73125).lines.filter(l=>l.y1===l.y2);assert.equal(wide[1].y1-wide[0].y1,8.73125);
 const inch=geometry('graph',6.35).lines.filter(l=>l.x1===l.x2);assert.ok(Math.abs(inch[4].x1-inch[0].x1-25.4)<1e-9);
});
