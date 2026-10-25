(() => {
  const addButton=()=>{
    const side=document.getElementById('side'); if(!side || side.querySelector('.linkedin-nav-btn')) return;
    const labels=[...side.querySelectorAll('.nav-label')];
    const resources=labels.find(x=>x.textContent.includes('Placement Resources'));
    const btn=document.createElement('button');
    btn.className='nav-btn linkedin-nav-btn';
    btn.innerHTML='▣ LinkedIn Profile <span>100%</span>';
    btn.onclick=()=>window.showLinkedIn?.();
    if(resources) resources.after(btn); else side.appendChild(btn);
  };
  new MutationObserver(addButton).observe(document.body,{childList:true,subtree:true});
  addButton();
})();