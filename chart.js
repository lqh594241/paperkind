/* Knitting chart model and vector exports. No network or browser dependency. */
(function (root) {
  'use strict';
  const PALETTE = ['#b65d45', '#44654f', '#d3aa56', '#3e557c', '#916579', '#77776d'];
  const validColor = c => /^#[0-9a-f]{6}$/i.test(c);
  function integer(value, min, max, name) {
    if (!Number.isInteger(value) || value < min || value > max) throw Error(`${name} must be a whole number from ${min} to ${max}.`);
    return value;
  }
  function gauge(stitches, rows, unit = 'cm') {
    if (![stitches, rows].every(n => Number.isFinite(n) && n >= 1 && n <= 200)) throw Error('Enter 1–200 stitches and rows over the same measured distance.');
    if (!['cm', 'in'].includes(unit)) throw Error('Choose a gauge unit.');
    const ratio = stitches / rows;
    if (ratio < .25 || ratio > 2) throw Error('Supported row-height / stitch-width ratios are 0.25–2. Check your gauge.');
    return {stitches, rows, unit, ratio, distance: unit === 'cm' ? 10 : 4};
  }
  function create(cols = 32, rows = 36) {
    integer(cols, 4, 96, 'Stitches'); integer(rows, 4, 120, 'Rows');
    return {version: 1, title: 'My colorwork study', cols, rows, cells: Array(cols * rows).fill(0), palette: [...PALETTE], gauge: {stitches: 20, rows: 28, unit: 'cm'}, working: 'flat'};
  }
  function validate(value) {
    if (!value || value.version !== 1) throw Error('This is not a supported Paperkind chart file.');
    const state = create(value.cols, value.rows);
    if (!Array.isArray(value.palette) || value.palette.length !== 6 || !value.palette.every(validColor)) throw Error('The project needs six valid palette colors.');
    if (!Array.isArray(value.cells) || value.cells.length !== state.cols * state.rows || !value.cells.every(c => Number.isInteger(c) && c >= 0 && c <= 6)) throw Error('The project has invalid stitch data.');
    if (typeof value.title !== 'string' || value.title.length > 70 || /[\x00-\x1f]/.test(value.title)) throw Error('The title must contain up to 70 printable characters.');
    if (!value.gauge) throw Error('The project needs gauge measurements.');
    gauge(value.gauge.stitches, value.gauge.rows, value.gauge.unit);
    if (!['flat', 'round'].includes(value.working)) throw Error('Choose flat or in-the-round chart reading.');
    return {...state, title: value.title, palette: [...value.palette], cells: [...value.cells], gauge: {...value.gauge}, working: value.working};
  }
  function dimensions(s) {
    const g = gauge(s.gauge.stitches, s.gauge.rows, s.gauge.unit);
    return {...g, width: s.cols / g.stitches * g.distance, height: s.rows / g.rows * g.distance};
  }
  function resize(s, cols, rows) {
    const next = create(cols, rows);
    for (let r = 0; r < Math.min(s.rows, rows); r++) for (let c = 0; c < Math.min(s.cols, cols); c++) next.cells[r * cols + cols - 1 - c] = s.cells[r * s.cols + s.cols - 1 - c];
    return {...s, cols, rows, cells: next.cells};
  }
  function mirror(s, vertical = false) {
    return {...s, cells: s.cells.map((_, i) => {
      const row = Math.floor(i / s.cols), col = i % s.cols;
      return s.cells[(vertical ? s.rows - 1 - row : row) * s.cols + (vertical ? col : s.cols - 1 - col)];
    })};
  }
  function sample(s, name) {
    const cells = s.cells.map((_, i) => {
      const r = Math.floor(i / s.cols) % 12, c = i % s.cols % 12;
      if (name === 'diamonds') { const dist = Math.abs(c - 5.5) + Math.abs(r - 5.5); return dist >= 3 && dist <= 5 ? 1 : (dist <= 1 ? 2 : 0); }
      if (name === 'checks') return (Math.floor(c / 3) + Math.floor(r / 3)) % 2 ? 2 : 0;
      if (name === 'chevrons') return ((r - Math.abs(c - 5.5)) % 6 + 6) % 6 < 2 ? 1 : 0;
      return 0;
    });
    return {...s, cells};
  }
  function counts(s) { const out = Array(7).fill(0); for (const color of s.cells) out[color]++; return out; }
  const esc = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;'}[c]));
  function svg(s, {symbols = true, repeat = false} = {}) {
    const ratio = dimensions(s).ratio, cell = 18, dy = cell * ratio, margin = 40;
    const nx = repeat ? 3 : 1, ny = repeat ? 2 : 1, cols = s.cols * nx, rows = s.rows * ny;
    const width = cols * cell + margin * 2, height = rows * dy + margin * 2;
    let body = '';
    for (let y = 0; y < s.rows; y++) for (let c = 0; c < s.cols; c++) {
      const r = s.rows - 1 - y, source = r * s.cols + c, color = s.cells[source];
      const x = margin + c * cell, top = margin + y * dy;
      body += `<rect x="${x}" y="${top}" width="${cell}" height="${dy}" fill="${color ? s.palette[color - 1] : '#fffdf6'}" stroke="#56664e" stroke-opacity=".25" stroke-width=".5"${repeat ? '' : ` data-cell="${source}"`}/>`;
      if (symbols && color) body += `<text x="${x + cell / 2}" y="${top + dy / 2}" fill="${contrast(s.palette[color - 1])}" font-size="${Math.min(11, dy * .7)}" text-anchor="middle" dominant-baseline="central" pointer-events="none">${String.fromCharCode(64 + color)}</text>`;
    }
    if (!repeat) {
      for (let r = 0; r < s.rows; r++) body += `<text x="${s.working==='flat'&&r%2===1?margin-17:width-margin+8}" y="${margin + (s.rows - r - .5) * dy}" dominant-baseline="central" font-size="9">${r + 1}</text>`;
      for (let c = 0; c < s.cols; c++) if ((c + 1) % 5 === 0 || c === 0 || c === s.cols - 1) body += `<text x="${margin + (s.cols - c - .5) * cell}" y="${height - margin + 17}" text-anchor="middle" font-size="9">${c + 1}</text>`;
    } else {
      body=`<defs><g id="knit-repeat-tile">${body}</g></defs>${Array.from({length:nx*ny},(_,i)=>`<use href="#knit-repeat-tile" transform="translate(${i%nx*s.cols*cell},${Math.floor(i/nx)*s.rows*dy})"/>`).join('')}`;
      for (let c = 1; c < nx; c++) body += `<path d="M${margin + c * s.cols * cell},${margin}v${rows * dy}" stroke="#b95a3d" stroke-width="2" stroke-dasharray="5 4"/>`;
      body += `<path d="M${margin},${margin + s.rows * dy}h${cols * cell}" stroke="#b95a3d" stroke-width="2" stroke-dasharray="5 4"/>`;
    }
    return `<svg xmlns="http://www.w3.org/2000/svg" role="img" aria-label="${esc(s.title)}${repeat ? ' repeated 3 across and 2 high' : ' stitch chart'}" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}" font-family="Arial" fill="#273b30"><title>${esc(s.title)}${repeat ? ' - repeated 3 across and 2 high' : ''}</title><g aria-hidden="true"><rect width="100%" height="100%" fill="#fffdf6"/>${body}</g></svg>`;
  }
  function contrast(hex) {
    const rgb = [1,3,5].map(i => parseInt(hex.slice(i,i+2),16)/255).map(c => c <= .04045 ? c/12.92 : ((c+.055)/1.055)**2.4);
    return .2126*rgb[0]+.7152*rgb[1]+.0722*rgb[2] > .179 ? '#17271b' : '#ffffff';
  }
  function plan(s, options = {}) {
    const {paper = 'a4', cell = 5, orientation = 'portrait'} = options;
    if (!['a4','letter','a5'].includes(paper) || !['portrait','landscape'].includes(orientation)) throw Error('Choose a supported page size and orientation.');
    if (!Number.isFinite(cell) || cell < 3 || cell > 8) throw Error('Print cell width must be 3–8 mm.');
    let [width,height] = {a4:[210,297], letter:[215.9,279.4], a5:[148,210]}[paper];
    if (orientation === 'landscape') [width,height] = [height,width];
    const cellHeight = cell * dimensions(s).ratio;
    const maxAcross = Math.floor((width - 42) / cell), maxHigh = Math.floor((height - 75) / cellHeight);
    const tilesX = Math.ceil(s.cols / maxAcross), tilesY = Math.ceil(s.rows / maxHigh);
    // Balance the tiles so a final page is not almost empty.
    const across = Math.ceil(s.cols / tilesX), high = Math.ceil(s.rows / tilesY);
    if (tilesX * tilesY > 30) throw Error('This chart needs over 30 pages. Reduce print cell width, change paper size or use landscape.');
    return {width,height,cell,cellHeight,across,high,tilesX,tilesY,total:tilesX*tilesY};
  }
  function pdf(s, options = {}) {
    s = validate(s);
    const p = plan(s,options), pages = [], pt = 72/25.4, n = v => Number(v.toFixed(4));
    const rgb = hex => [1,3,5].map(i => n(parseInt(hex.slice(i,i+2),16)/255)).join(' ');
    // Standard PDF Helvetica is ASCII. Project titles keep Unicode in SVG/PNG/JSON.
    const ascii = text => String(text).replace(/[^\x20-\x7e]/g,'?').replace(/[\\()]/g,'\\$&');
    const text = (x,y,size,value) => `BT /F1 ${size} Tf ${n(x*pt)} ${n((p.height-y)*pt)} Td (${ascii(value)}) Tj ET\n`;
    for (let ty=0;ty<p.tilesY;ty++) for(let tx=0;tx<p.tilesX;tx++) {
      const startC=tx*p.across,startR=ty*p.high,cols=Math.min(p.across,s.cols-startC),rows=Math.min(p.high,s.rows-startR);
      const title=s.title||'Untitled colorwork chart',titleMax=Math.floor((p.width-30)*pt/8);
      let c='0.15 0.23 0.19 rg\n'+text(15,14,13,title.length>titleMax?title.slice(0,titleMax-3)+'...':title);
      c+=text(15,21,8,`${s.cols} stitches x ${s.rows} rows | Gauge ${s.gauge.stitches} sts / ${s.gauge.rows} rows over ${s.gauge.unit==='cm'?'10 cm':'4 in'}`);
      c+=text(15,27,8,`Tile ${pages.length+1}/${p.total} | column ${tx+1}/${p.tilesX}, band ${ty+1}/${p.tilesY} from bottom | Print at 100%`);
      const bottom=40+rows*p.cellHeight, left=20;
      for(let r=0;r<rows;r++) for(let col=0;col<cols;col++) {
        const color=options.blank?0:s.cells[(startR+r)*s.cols+startC+col],x=left+col*p.cell,y=bottom-r*p.cellHeight;
        if(color)c+=`${rgb(s.palette[color-1])} rg ${n(x*pt)} ${n((p.height-y)*pt)} ${n(p.cell*pt)} ${n(p.cellHeight*pt)} re f\n`;
        c+=`0.55 0.59 0.53 RG 0.3 w ${n(x*pt)} ${n((p.height-y)*pt)} ${n(p.cell*pt)} ${n(p.cellHeight*pt)} re S\n`;
        if(options.symbols!==false&&color)c+=`${rgb(contrast(s.palette[color-1]))} rg\n`+text(x+p.cell*.31,y-p.cellHeight*.36,Math.min(8,p.cellHeight*pt*.65),String.fromCharCode(64+color));
      }
      c+='0.15 0.23 0.19 rg\n';
      for(let r=0;r<rows;r++)c+=text(s.working==='flat'&&(startR+r)%2===1?left-5:left+cols*p.cell+2,bottom-(r+.32)*p.cellHeight,6,startR+r+1);
      for(let col=0;col<cols;col++) {
        const stitch=s.cols-(startC+col);
        if(stitch%5===0||col===0||col===cols-1)c+=text(left+(col+.2)*p.cell,bottom+4,6,stitch);
      }
      const count=options.blank?[s.cells.length,0,0,0,0,0,0]:counts(s);
      const legend=['Background: '+count[0],...s.palette.map((color,i)=>`${String.fromCharCode(65+i)} ${color.toUpperCase()}: ${count[i+1]}`)];
      c+=text(15,p.height-19,6,legend.slice(0,4).join('   '));
      c+=text(15,p.height-15,6,legend.slice(4).join('   '));
      c+=text(15,p.height-10,6,`${s.working==='flat'?'Flat: odd rows right to left; even rows left to right.':'Round: read every row right to left.'} Blank cells = background.`);
      c+=text(15,p.height-6,5.5,'Paperkind | Counts are chart cells, not yarn quantities. Swatch before knitting.');
      pages.push({width:p.width*pt,height:p.height*pt,content:c});
    }
    return MiniPDF.create(pages);
  }
  function csv(s) {
    const rows=[['Row','Read direction','Color runs in reading order (background = blank cell)']];
    for(let r=0;r<s.rows;r++) {
      const rtl=s.working==='round'||r%2===0;
      const values=s.cells.slice(r*s.cols,(r+1)*s.cols); if(rtl)values.reverse();
      const runs=[];
      for(const color of values){if(runs.length&&runs.at(-1).color===color)runs.at(-1).count++;else runs.push({color,count:1});}
      rows.push([r+1,rtl?'right to left':'left to right',runs.map(({color,count})=>`${color?String.fromCharCode(64+color):'Background'} x${count}`).join('; ')]);
    }
    return rows.map(row=>row.map(v=>'"'+String(v).replaceAll('"','""')+'"').join(',')).join('\r\n');
  }
  root.KnitChart={create,validate,gauge,dimensions,resize,mirror,sample,counts,svg,pdf,plan,csv,contrast};
})(globalThis);
