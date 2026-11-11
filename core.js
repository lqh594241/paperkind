(function(root){
'use strict';
const pt=72/25.4,n=v=>Number(v.toFixed(4));
const kinds=['graph','dots','isometric','knit','hex','lined','cornell','staff','tab','bass','chord','coordinate','polar','storyboard','comic','handwriting','calligraphy','engineering'];
function geometry(options){
 let [width,height]=options.paper==='letter'?[215.9,279.4]:options.paper==='a4'?[210,297]:[];
 if(!width)throw Error('Choose A4 or US Letter.');
 if(options.orientation==='landscape')[width,height]=[height,width];else if(options.orientation!=='portrait')throw Error('Choose an orientation.');
 const margin=Number(options.margin),spacing=Number(options.spacing),ratio=Number(options.ratio);
 if(!Number.isFinite(margin)||margin<5||margin>35||!Number.isFinite(spacing)||spacing<2||spacing>20||!Number.isFinite(ratio)||ratio<.5||ratio>1.5)throw Error('Use margins of 5–35 mm, spacing of 2–20 mm and a knitting ratio of 0.5–1.5.');
 if(!/^#[0-9a-f]{6}$/i.test(options.color))throw Error('Choose a grid color.');
 if(!kinds.includes(options.kind))throw Error('Choose a paper type.');
 const lines=[],dots=[],circles=[],labels=[],right=width-margin,bottom=height-margin,kind=options.kind;
 const line=(x1,y1,x2,y2,major=false,dash=false)=>lines.push({x1,y1,x2,y2,major,dash});
 const text=(x,y,value,size=2.8,anchor='start')=>labels.push({x,y,value,size,anchor});
 const rect=(x,y,w,h,major=false)=>{line(x,y,x+w,y,major);line(x+w,y,x+w,y+h,major);line(x+w,y+h,x,y+h,major);line(x,y+h,x,y,major);};
 function grid(top=margin,heavy=options.major){let i=0;for(let x=margin;x<=right+.001;x+=spacing)line(x,top,x,bottom,heavy&&i++%5===0);i=0;const dy=kind==='knit'?spacing*ratio:spacing;for(let y=top;y<=bottom+.001;y+=dy)line(margin,y,right,y,heavy&&i++%5===0);}
 if(kind==='dots'){
  for(let x=margin;x<=right+.001;x+=spacing)for(let y=margin;y<=bottom+.001;y+=spacing)dots.push({x,y});
 }else if(kind==='isometric'){
  const dy=spacing*Math.sqrt(3)/2;for(let y=margin;y<=bottom;y+=dy)line(margin,y,right,y);
  const offset=(bottom-margin)/Math.sqrt(3);for(let x=margin-offset-spacing;x<=right+offset+spacing;x+=spacing){line(x,margin,x+offset,bottom);line(x,margin,x-offset,bottom);}
 }else if(kind==='hex'){
  const dx=Math.sqrt(3)*spacing,dy=1.5*spacing,seen=new Set();
  for(let row=-1;row<(bottom-margin)/dy+2;row++)for(let col=-1;col<(right-margin)/dx+2;col++){
   const cx=margin+col*dx+(row%2?dx/2:0),cy=margin+row*dy;
   const vertices=Array.from({length:6},(_,i)=>{const a=(60*i-30)*Math.PI/180;return [cx+spacing*Math.cos(a),cy+spacing*Math.sin(a)];});
   for(let i=0;i<6;i++){const a=vertices[i],b=vertices[(i+1)%6],key=[a,b].map(p=>p.map(v=>v.toFixed(3)).join(',')).sort().join('|');if(!seen.has(key)){seen.add(key);line(...a,...b);}}
  }
 }else if(kind==='lined'){
  for(let y=margin+spacing;y<=bottom;y+=spacing)line(margin,y,right,y);line(margin+25,margin,margin+25,bottom,true);
 }else if(kind==='cornell'){
  const cue=margin+50,summary=bottom-45,top=margin+15;text(margin,margin+4,'TOPIC:');text(right-48,margin+4,'DATE:');
  line(margin,top,right,top,true);line(cue,top,cue,summary,true);line(margin,summary,right,summary,true);
  text(margin+2,top+5,'CUES');text(cue+3,top+5,'NOTES');text(margin+2,summary+5,'SUMMARY');
  for(let y=top+spacing+6;y<summary;y+=spacing)line(cue,y,right,y);for(let y=summary+12;y<=bottom;y+=spacing)line(margin,y,right,y);
 }else if(['staff','tab','bass'].includes(kind)){
  const count=kind==='staff'?5:kind==='tab'?6:4,block=(count-1)*spacing,gap=kind==='staff'?spacing*8:spacing*5;
  for(let y=margin+(kind==='staff'?2:8);y+block<=bottom;y+=block+gap){for(let j=0;j<count;j++)line(margin+8,y+j*spacing,right,y+j*spacing);line(margin+8,y,margin+8,y+block);if(kind!=='staff')text(margin,y+block/2+1,kind==='tab'?'TAB':'BASS',2.2);}
 }else if(kind==='chord'){
  const cw=spacing*5,ch=spacing*5,gapX=12,gapY=21,cols=Math.max(1,Math.floor((right-margin+gapX)/(cw+gapX))),rows=Math.floor((bottom-margin+gapY)/(ch+gapY)),left=(width-(cols*cw+(cols-1)*gapX))/2;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const x=left+col*(cw+gapX),y=margin+8+row*(ch+gapY);if(y+ch>bottom)continue;line(x,y-5,x+cw,y-5);for(let i=0;i<=5;i++){line(x+i*spacing,y,x+i*spacing,y+ch);line(x,y+i*spacing,x+cw,y+i*spacing,i===0);}text(x+cw/2,y+ch+4,'6   5   4   3   2   1',1.9,'middle');}
 }else if(kind==='coordinate'){
  const nx=Math.floor((right-margin-10)/spacing/2),ny=Math.floor((bottom-margin-10)/spacing/2),cx=width/2,cy=height/2;
  const l=cx-nx*spacing,r=cx+nx*spacing,t=cy-ny*spacing,b=cy+ny*spacing;
  for(let i=-nx;i<=nx;i++)line(cx+i*spacing,t,cx+i*spacing,b,i===0);for(let i=-ny;i<=ny;i++)line(l,cy+i*spacing,r,cy+i*spacing,i===0);
  line(l,cy,r+2,cy,true);line(r+2,cy,r,cy-1,true);line(r+2,cy,r,cy+1,true);line(cx,b,cx,t-2,true);line(cx,t-2,cx-1,t,true);line(cx,t-2,cx+1,t,true);
  for(let i=-nx;i<=nx;i++)if(i&&i%2===0)text(cx+i*spacing,cy+3,String(i),2,'middle');for(let i=-ny;i<=ny;i++)if(i&&i%2===0)text(cx-2,cy-i*spacing+.7,String(i),2,'end');
  text(cx-2,cy+3,'0',2,'end');text(r+2,cy-2,'x');text(cx+2,t-2,'y');
 }else if(kind==='polar'){
  const cx=width/2,cy=height/2,r=Math.floor((Math.min(width,height)/2-margin-9)/spacing)*spacing;
  for(let radius=spacing;radius<=r;radius+=spacing)circles.push({x:cx,y:cy,r:radius});
  for(let deg=0;deg<360;deg+=15){const a=deg*Math.PI/180;line(cx,cy,cx+r*Math.cos(a),cy-r*Math.sin(a),deg%90===0);text(cx+(r+5)*Math.cos(a),cy-(r+5)*Math.sin(a)+1,String(deg),2.5,'middle');}
  text(cx,cy+r+13,'Angles in degrees; label radial values for your own scale.',2.5,'middle');
 }else if(kind==='storyboard'||kind==='comic'){
  const cols=2,rows=3,gap=8,w=(right-margin-gap)/cols,caption=kind==='storyboard'?15:0,h=(bottom-margin-(rows-1)*gap)/rows-caption;
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){const x=margin+col*(w+gap),y=margin+row*(h+caption+gap);rect(x,y,w,h,true);if(caption){text(x,y+h+4,`SHOT ${row*2+col+1}`,2.2);line(x,y+h+9,x+w,y+h+9);line(x,y+h+14,x+w,y+h+14);}}
 }else if(kind==='handwriting'){
  for(let y=margin+spacing;y+spacing<=bottom;y+=spacing*3){line(margin,y-spacing,right,y-spacing);line(margin,y,right,y,false,true);line(margin,y+spacing,right,y+spacing,true);}
 }else if(kind==='calligraphy'){
  for(let y=margin+spacing;y+spacing*2<=bottom;y+=spacing*4){line(margin,y-spacing,right,y-spacing);line(margin,y,right,y,false,true);line(margin,y+spacing,right,y+spacing,true);line(margin,y+spacing*2,right,y+spacing*2);}
  const offset=(bottom-margin)/Math.tan(55*Math.PI/180);for(let x=margin-offset;x<=right;x+=spacing*2)line(x,bottom,x+offset,margin,false,true);
 }else if(kind==='engineering'){
  text(margin,margin+3,'PROJECT:');text(width*.55,margin+3,'DATE:');text(right-22,margin+3,'SHEET:');line(margin,margin+7,right,margin+7,true);grid(margin+12,true);
 }else grid();
 return {width,height,margin,spacing,lines,dots,circles,labels,color:options.color,ruler:options.ruler,kind};
}
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function svg(g){
 const clip=`<clipPath id="grid-clip"><rect x="${g.margin}" y="${g.margin}" width="${g.width-g.margin*2}" height="${g.height-g.margin*2}"/></clipPath>`;
 const lines=g.lines.map(l=>`<line x1="${n(l.x1)}" y1="${n(l.y1)}" x2="${n(l.x2)}" y2="${n(l.y2)}" stroke-width="${l.major?.28:.12}"${l.dash?' stroke-dasharray="1 1"':''}/>`).join('');
 const dots=g.dots.map(d=>`<circle cx="${n(d.x)}" cy="${n(d.y)}" r="0.22"/>`).join('');
 const circles=g.circles.map(c=>`<circle cx="${n(c.x)}" cy="${n(c.y)}" r="${n(c.r)}" stroke-width=".12"/>`).join('');
 const labels=g.labels.map(t=>`<text x="${n(t.x)}" y="${n(t.y)}" font-size="${t.size}" text-anchor="${t.anchor}">${esc(t.value)}</text>`).join('');
 const rulerY=g.height-g.margin/2;
 return `<svg xmlns="http://www.w3.org/2000/svg" width="${g.width}mm" height="${g.height}mm" viewBox="0 0 ${g.width} ${g.height}" role="img" aria-label="${g.kind} paper preview"><title>${g.kind} paper · ${g.spacing} mm spacing</title><rect width="100%" height="100%" fill="white"/><defs>${clip}</defs><g clip-path="url(#grid-clip)" stroke="${g.color}" fill="none">${lines}${circles}</g><g clip-path="url(#grid-clip)" fill="${g.color}">${dots}</g><g font-family="Arial,Helvetica,sans-serif" fill="${g.color}">${labels}</g>${g.ruler?`<path d="M${g.margin} ${rulerY}h50m-50-1v2m50-2v2" fill="none" stroke="#555" stroke-width=".15"/><text x="${g.margin+54}" y="${rulerY+1}" font-family="Arial" font-size="2.5" fill="#555">50 mm · print at 100%</text>`:''}</svg>`;
}
function pdf(g){
 const rgb=[1,3,5].map(i=>parseInt(g.color.slice(i,i+2),16)/255).map(n).join(' ');
 const circle=(x,y,r)=>{const k=.55228475*r;return `${n(x+r)} ${n(y)} m ${n(x+r)} ${n(y+k)} ${n(x+k)} ${n(y+r)} ${n(x)} ${n(y+r)} c ${n(x-k)} ${n(y+r)} ${n(x-r)} ${n(y+k)} ${n(x-r)} ${n(y)} c ${n(x-r)} ${n(y-k)} ${n(x-k)} ${n(y-r)} ${n(x)} ${n(y-r)} c ${n(x+k)} ${n(y-r)} ${n(x+r)} ${n(y-k)} ${n(x+r)} ${n(y)} c `;};
 let content=`q\n${n(g.margin*pt)} ${n(g.margin*pt)} ${n((g.width-2*g.margin)*pt)} ${n((g.height-2*g.margin)*pt)} re W n\n${rgb} RG\n${rgb} rg\n`;
 for(const l of g.lines)content+=`${l.dash?`[${n(pt)} ${n(pt)}]`:'[]'} 0 d ${n((l.major?.28:.12)*pt)} w ${n(l.x1*pt)} ${n((g.height-l.y1)*pt)} m ${n(l.x2*pt)} ${n((g.height-l.y2)*pt)} l S\n`;
 content+='[] 0 d\n';for(const c of g.circles)content+=`${n(.12*pt)} w ${circle(c.x*pt,(g.height-c.y)*pt,c.r*pt)}S\n`;for(const d of g.dots)content+=circle(d.x*pt,(g.height-d.y)*pt,.22*pt)+'f\n';
 content+='Q\n'+`${rgb} rg\n`;
 for(const t of g.labels){const shift=t.anchor==='middle'?t.value.length*t.size*.25:t.anchor==='end'?t.value.length*t.size*.5:0;const safe=t.value.replace(/[\\()]/g,'\\$&');content+=`BT /F1 ${n(t.size*pt)} Tf ${n((t.x-shift)*pt)} ${n((g.height-t.y)*pt)} Td (${safe}) Tj ET\n`;}
 if(g.ruler){const y=g.margin/2*pt,x=g.margin*pt;content+=`0.3 G 0.3 g 0.4 w ${n(x)} ${n(y)} m ${n(x+50*pt)} ${n(y)} l S ${n(x)} ${n(y-pt)} m ${n(x)} ${n(y+pt)} l S ${n(x+50*pt)} ${n(y-pt)} m ${n(x+50*pt)} ${n(y+pt)} l S BT /F1 7 Tf ${n(x+54*pt)} ${n(y-2)} Td (50 mm - print at 100%) Tj ET\n`;}
 return MiniPDF.create([{width:g.width*pt,height:g.height*pt,content}]);
}
root.PaperTools={geometry,svg,pdf,kinds};
})(globalThis);
