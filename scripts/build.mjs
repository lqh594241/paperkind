import {readdir,mkdir,copyFile,readFile,writeFile,rm} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'dist');
const files=(await readdir(root)).filter(f=>/\.(html|css|js|svg|txt)$/.test(f));
let origin;
if(process.env.SITE_URL){origin=new URL(process.env.SITE_URL);if(!['https:','http:'].includes(origin.protocol)||origin.pathname!=='/'||origin.search||origin.hash||origin.username||origin.password)throw new Error('SITE_URL must be an origin without a path.');}
await mkdir(out,{recursive:true});
for(const f of files)await copyFile(path.join(root,f),path.join(out,f));
const pages=files.filter(f=>f.endsWith('.html')&&f!=='404.html');
const esc=s=>s.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('"','&quot;');
if(origin){
for(const f of pages){const url=new URL(f==='index.html'?'/':f,origin).href;const html=await readFile(path.join(out,f),'utf8');await writeFile(path.join(out,f),html.replace('</head>',`<link rel="canonical" href="${esc(url)}"><meta property="og:url" content="${esc(url)}"></head>`));}
await writeFile(path.join(out,'sitemap.xml'),`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${pages.map(f=>`<url><loc>${esc(new URL(f==='index.html'?'/':f,origin).href)}</loc></url>`).join('')}</urlset>`);
await writeFile(path.join(out,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${new URL('/sitemap.xml',origin).href}\n`);
}else await rm(path.join(out,'sitemap.xml'),{force:true});
console.log(`Built ${files.length} assets${origin?' with sitemap and canonical URLs':''}.`);
