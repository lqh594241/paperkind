(function () {
  'use strict';
  const { $, val, status, guard, download } = Site;
  const form = $('paper-form');
  if (!form) return;
  let current = null;
  const params = new URLSearchParams(location.search);
  const choices = {kind: PaperTools.kinds, paper: ['a4', 'letter'], orientation: ['portrait', 'landscape']};
  for (const [key, allowed] of Object.entries(choices)) {
    if (allowed.includes(params.get(key))) $(key).value = params.get(key);
  }
  for (const [key, min, max] of [['spacing', 2, 20], ['margin', 5, 35], ['ratio', .5, 1.5]]) {
    const value = params.get(key);
    if (value !== null && value.trim() !== '' && Number.isFinite(Number(value)) && Number(value) >= min && Number(value) <= max) $(key).value = value;
  }
  if (/^#[0-9a-f]{6}$/i.test(params.get('color') || '')) $('color').value = params.get('color');
  for (const key of ['major', 'ruler']) {
    if (['true', 'false'].includes(params.get(key))) $(key).checked = params.get(key) === 'true';
  }
  const formats={
 graph:['Grid spacing','Distance between neighboring grid lines.'],dots:['Dot spacing','Distance between neighboring dot centers.'],isometric:['Triangle side','Equilateral triangle side length. Row distance is side × √3 ÷ 2.'],knit:['Cell width','Cell height = cell width × row-height ratio.'],hex:['Hexagon side','One hexagon edge. Flat-to-flat distance = side × √3; point-to-point = side × 2.'],lined:['Line spacing','Distance between writing baselines. A left margin guide sits 25 mm inside the page margin.'],cornell:['Note ruling','Ruled notes with a 50 mm cue column and 45 mm summary area.'],staff:['Staff line spacing','Five lines per staff; the gap between staff groups is eight times this setting.'],tab:['String line spacing','Six-line guitar tablature systems. Write your own tuning and timing.'],bass:['String line spacing','Four-line bass tablature systems. Write your own tuning and timing.'],chord:['Diagram spacing','Equal spacing between six string lines and five fret spaces.'],coordinate:['Unit spacing','One cell = one coordinate unit. Even units are labeled around centered axes.'],polar:['Radial spacing','Distance between circles. Spokes are 15° apart; assign your own radial units.'],storyboard:['Layout','Six planning frames with captions. Frame proportions depend on the paper size.'],comic:['Layout','Six blank panels with 8 mm gutters. No bleed or publisher trim marks.'],handwriting:['Half-band height','Top guide to baseline = twice this setting. The middle guide is dashed.'],calligraphy:['x-height','Equal ascender / x-height / descender zones with 55° slant guides.'],engineering:['Grid spacing','Square grid with heavier fifth lines and project / date / sheet fields.']
 };
  function render() {
    current = null;
    const kind = $('kind').value;
    $('ratio-field').hidden = $('ratio-note').hidden = kind !== 'knit';
    $('major-field').hidden = !['graph', 'knit'].includes(kind);
    const fixed=['storyboard','comic'].includes(kind);
    $('spacing').disabled=fixed;
    document.querySelector('label[for="spacing"]').textContent=formats[kind][0]+(fixed?'':' · mm');
    $('spacing-note').textContent=formats[kind][1];
    try {
      const options = {
        paper: $('paper').value, orientation: $('orientation').value, kind,
        spacing: val('spacing', 2, 20), margin: val('margin', 5, 35),
        ratio: val('ratio', .5, 1.5), color: $('color').value,
        major: $('major').checked, ruler: $('ruler').checked
      };
      current = PaperTools.geometry(options);
      $('paper-preview').innerHTML = PaperTools.svg(current);
      const grid = kind === 'knit' ? `${options.spacing} × ${Number((options.spacing * options.ratio).toFixed(3))} mm cells` : kind === 'storyboard' ? '6 frames with captions' : kind === 'comic' ? '6 blank panels' : `${options.spacing} mm ${formats[kind][0].toLowerCase()}`;
      $('paper-summary').textContent = `${options.paper === 'a4' ? 'A4' : 'US Letter'} · ${current.width} × ${current.height} mm · ${grid}`;
      for (const id of ['download-pdf', 'download-svg']) $(id).disabled = false;
      status('');
    } catch (error) {
      $('paper-preview').replaceChildren();
      $('paper-summary').textContent = 'Check the paper settings to preview your sheet.';
      for (const id of ['download-pdf', 'download-svg']) $(id).disabled = true;
      status(error.message, true);
    }
  }
  for (const control of form.querySelectorAll('input,select')) control.addEventListener('input', render);
  function filename(ext) { return `paperkind-${current.kind}-${$('paper').value}-${current.spacing}mm.${ext}`; }
  $('download-pdf').addEventListener('click', guard(() => {
    if (current) download(PaperTools.pdf(current), filename('pdf'), 'application/pdf');
  }));
  $('download-svg').addEventListener('click', () => {
    if (current) download(PaperTools.svg(current), filename('svg'), 'image/svg+xml');
  });
  render();
})();
