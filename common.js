(function(root){
'use strict';
const $=id=>document.getElementById(id);
const fmt=(n,d=2)=>Number(n.toFixed(d)).toLocaleString('en-US');
function number(value,name,min,max,integer=false){if(String(value).trim()==='')throw Error(`Enter ${name}.`);const n=Number(value);if(!Number.isFinite(n)||n<min||n>max||(integer&&!Number.isInteger(n)))throw Error(`${name} must be ${integer?'a whole number':'a number'} between ${min} and ${max}.`);return n;}
const val=(id,min=-1e9,max=1e9,integer=false)=>number($(id).value,$(id).dataset.label||id,min,max,integer);
function status(message,error=false){const out=$('status');if(out){out.textContent=message;out.classList.toggle('error',error);out.hidden=!message;}}
function guard(fn){return async function(event){try{await fn.call(this,event);}catch(error){status(error.message||'Something went wrong. Check your inputs.',true);}};}
function download(data,name,type='text/plain;charset=utf-8'){const blob=data instanceof Blob?data:new Blob([data],{type});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),10000);}
async function copy(text){try{await navigator.clipboard.writeText(text);}catch{const area=document.createElement('textarea');area.value=text;area.style.cssText='position:fixed;left:-9999px;top:0';document.body.append(area);area.select();let ok=false;try{ok=document.execCommand('copy');}finally{area.remove();}if(!ok)throw Error('Clipboard unavailable. Download the result instead.');}status('Copied to your clipboard.');}
function printText(title,text){const box=$('print-area');box.replaceChildren();const h=document.createElement('h1');h.textContent=title;const pre=document.createElement('pre');pre.textContent=text;box.append(h,pre);window.print();}
const escape=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
async function image(file){if(!file||!/^image\/(jpeg|png|webp|gif|avif)$/.test(file.type))throw Error('Choose a JPEG, PNG, WebP, GIF or AVIF image. SVG is not supported.');if(file.size>25*1024*1024)throw Error('Choose an image smaller than 25 MB.');let bitmap;if(typeof createImageBitmap==='function'){bitmap=await createImageBitmap(file);}else{const url=URL.createObjectURL(file);try{bitmap=await new Promise((resolve,reject)=>{const img=new Image();img.onload=()=>resolve(img);img.onerror=()=>reject(Error('This image could not be decoded.'));img.src=url;});}finally{URL.revokeObjectURL(url);}}if(bitmap.width*bitmap.height>32000000){bitmap.close?.();throw Error('This image exceeds 32 megapixels. Choose a smaller image.');}return bitmap;}
function blob(canvas,type='image/png',quality=.92){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(Error('Your browser could not encode this format.')),type,quality));}
function csv(rows){return rows.map(row=>row.map(cell=>'"'+String(cell).replaceAll('"','""')+'"').join(',')).join('\r\n');}
root.Site={$,fmt,number,val,status,guard,download,copy,printText,escape,image,blob,csv};
if($('year'))$('year').textContent=new Date().getFullYear();
// Banner dismissal is managed by ads.js.
document.querySelectorAll('form').forEach(form=>form.addEventListener('submit',event=>event.preventDefault()));
})(globalThis);
