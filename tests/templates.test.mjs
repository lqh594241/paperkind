import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtemp, readFile, rm, readdir} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import {generate} from '../scripts/generate-pages.mjs';

test('template generation creates downloadable physical sheets and consistent production URLs', async () => {
  const output = await mkdtemp(path.join(os.tmpdir(), 'paperkind-test-'));
  try {
    const {pages} = await generate(output, 'https://paper.example/');
    const sitemap = await readFile(path.join(output, 'sitemap.xml'), 'utf8');
    assert.equal((sitemap.match(/<loc>/g) || []).length, 28);
    assert.equal(new Set([...sitemap.matchAll(/<loc>(.*?)<\/loc>/g)].map(m=>m[1])).size,28);
    assert.ok(!sitemap.includes('workers.dev'));
    const copy = await readFile(path.join(output, 'sharing/pin-copy.csv'), 'utf8');
    assert.equal(copy.trim().split('\n').length, 7);
    assert.ok(!copy.includes('workers.dev'));
    for (const page of pages.filter(p => !['privacy.html','terms.html'].includes(p))) {
      const html = await readFile(path.join(output, page), 'utf8');
      const canonical = page === 'index.html' ? 'https://paper.example/' : `https://paper.example/${page}`;
      assert.ok(html.includes(`rel="canonical" href="${canonical}"`));
      assert.equal((html.match(/analytics.ahrefs.com\/analytics.js/g) || []).length, 1);
      assert.ok(html.includes('content="no-referrer-when-downgrade"'));
      const schema = JSON.parse(html.match(/<script type="application\/ld\+json">(.*?)<\/script>/s)[1]);
      assert.equal(schema['@context'], 'https://schema.org');
      if (!['index.html','knitting-chart-maker.html','printable-paper.html'].includes(page)) {
        const downloads = [...html.matchAll(/href="\.\/(assets\/downloads\/[^\"]+\.pdf)" download/g)];
        assert.equal(downloads.length, 2);
        for (const [,file] of downloads) {
          const pdf = await readFile(path.join(output,file), 'utf8');
          assert.ok(pdf.startsWith('%PDF-1.4'));
          const box=pdf.match(/\/MediaBox \[0 0 ([\d.]+) ([\d.]+)\]/);
          assert.ok(box);
          const expected=file.includes('-a4.pdf')?[210,297]:[215.9,279.4];
          assert.ok(Math.abs(Number(box[1])-expected[0]*72/25.4)<0.001);
          assert.ok(Math.abs(Number(box[2])-expected[1]*72/25.4)<0.001);
        }
      }
    }
    assert.equal((await readdir(path.join(output,'assets/downloads'))).length,46);
    const catalog=await readFile(path.join(output,'printable-paper.html'),'utf8');
    assert.equal((catalog.match(/class="template-card /g)||[]).length,23);
    const titles=new Set(),descriptions=new Set();
    for(const page of pages.filter(p=>!['privacy.html','terms.html'].includes(p))){
      const html=await readFile(path.join(output,page),'utf8');
      const title=html.match(/<title>(.*?)<\/title>/s)[1];
      assert.ok(!titles.has(title),'each page has its own title');titles.add(title);
      const description=html.match(/name="description" content="([^"]+)"/)[1];
      assert.ok(!descriptions.has(description),'each page has its own description');descriptions.add(description);
      for(const [,file] of html.matchAll(/(?:href|src)="\.\/([^"?#]+)(?:[?#][^"]*)?"/g)){
        if(['common.js','ads.js','pdf.js','core.js','app.js','studio.js','chart.js','catalog.js','styles.css','studio.css','catalog.css','favicon.svg','privacy.html','terms.html'].includes(file))continue;
        await readFile(path.join(output,file));
      }
    }
    await assert.rejects(generate(output,'https://paper.example/subdirectory/'),/production origin/);
  } finally {
    await rm(output,{recursive:true,force:true});
  }
});
