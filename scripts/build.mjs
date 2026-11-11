import {readdir,mkdir,copyFile,readFile,writeFile,cp} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {generate} from './generate-pages.mjs';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'dist');
const {homepage}=JSON.parse(await readFile(path.join(root,'package.json'),'utf8'));
const origin=new URL(process.env.SITE_URL||homepage);
if(!['https:','http:'].includes(origin.protocol)||origin.pathname!=='/'||origin.search||origin.hash||origin.username||origin.password)throw Error('SITE_URL must be a production origin without a path.');
await mkdir(out,{recursive:true});
const files=(await readdir(root)).filter(f=>/\.(html|css|js|svg|txt)$/.test(f));
for(const f of files)await copyFile(path.join(root,f),path.join(out,f));
for(const dir of ['assets','sharing'])await cp(path.join(root,dir),path.join(out,dir),{recursive:true});
const {pages,downloadCount}=await generate(out,origin.href);
const esc=s=>s.replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
for(const file of ['privacy.html','terms.html']){
  const url=new URL(file,origin).href;
  const html=await readFile(path.join(out,file),'utf8');
  await writeFile(path.join(out,file),html.replace(/<link\b[^>]*rel="canonical"[^>]*>/g,'').replace(/<meta\b[^>]*property="og:url"[^>]*>/g,'').replace('</head>',`<link rel="canonical" href="${esc(url)}"><meta property="og:url" content="${esc(url)}"></head>`));
}
const sharingCount=(await readdir(path.join(out,'sharing'))).filter(f=>f.endsWith('.png')).length;
console.log(`Built Paperkind: ${pages.length} sitemap pages, ${downloadCount} printable PDFs and ${sharingCount} sharing images. Canonical URLs generated for ${origin.origin}.`);
