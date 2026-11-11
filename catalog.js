(function(){
 'use strict';
 const search=document.getElementById('paper-search');if(!search)return;
 const links=[...document.querySelectorAll('[data-category]')],cards=[...document.querySelectorAll('.catalog-grid .template-card')],params=new URLSearchParams(location.search);
 let category=links.some(l=>l.dataset.category===params.get('category'))?params.get('category'):'all';
 search.value=params.get('q')||'';document.querySelector('.catalog-search').hidden=false;
 function render(){
  const query=search.value.toLowerCase().trim().replace(/\s+/g,' ');let count=0;
  for(const card of cards){card.hidden=!(category==='all'||card.dataset.group===category)||!card.dataset.search.includes(query);if(!card.hidden)count++;}
  for(const link of links){if(link.dataset.category===category)link.setAttribute('aria-current','true');else link.removeAttribute('aria-current');}
  document.getElementById('catalog-count').textContent=`${count} ${count===1?'template':'templates'}${query?' matching your search':''}`;
  document.querySelector('.catalog-empty').hidden=count!==0;
  const state=new URLSearchParams();if(category!=='all')state.set('category',category);if(search.value.trim())state.set('q',search.value.trim());
  history.replaceState(null,'',location.pathname+(state.size?'?'+state:'')+location.hash);
 }
 for(const link of links)link.addEventListener('click',event=>{if(event.ctrlKey||event.metaKey||event.shiftKey||event.altKey)return;event.preventDefault();category=link.dataset.category;render();});
 search.addEventListener('input',render);
 document.getElementById('reset-catalog').addEventListener('click',()=>{category='all';search.value='';render();search.focus();});
 render();
})();
