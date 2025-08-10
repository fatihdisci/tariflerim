(function(){
  const diag = document.getElementById('diag');
  const $ = (s,root=document)=>root.querySelector(s);
  const storeKey='tarifdefteri.v1';
  let data, activeId;
  // Elements
  const listEl=$('#list'), detailEl=$('#detail'), tagBar=$('#tagBar'), qInput=$('#q');
  const modal=$('#modal');
  const fName=$('#fName'), fTags=$('#fTags'), fServes=$('#fServes'), fTime=$('#fTime'),
        fIngs=$('#fIngs'), fSteps=$('#fSteps'), fPhoto=$('#fPhoto'), fPreview=$('#fPreview');

  const btnAdd=$('#addBtn'), btnClose=$('#closeModal'), btnSave=$('#saveBtn'),
        btnDelete=$('#deleteBtn'), btnPrint=$('#printBtn'),
        btnExport=$('#exportBtn'), inpImport=$('#importFile'), btnClear=$('#clearSearch');

  // Diagnostics
if (diag) diag.style.display = 'none';

  // Data
  function uid(){ return Math.random().toString(36).slice(2,9) }
  function load(){
    try{ const raw=localStorage.getItem(storeKey); return raw? JSON.parse(raw): sample(); }
    catch(e){ return sample(); }
  }
  function save(){ localStorage.setItem(storeKey, JSON.stringify(data)) }
  function sample(){ return { recipes:[{
    id: uid(), name:"Fırında Sebzeli Tavuk", tags:["pratik","fırın","akşam"],
    serves:4, time:35, photo:"", ingredients:[
      {t:"2 adet tavuk göğsü",done:false},{t:"1 kabak",done:false},{t:"1 kırmızı biber",done:false},
      {t:"1 soğan",done:false},{t:"2 YK zeytinyağı",done:false},{t:"Tuz & karabiber",done:false}
    ], steps:["Fırını 190°C ısıt.","Sebzeleri ve tavuğu doğra.","Baharat ve yağla karıştır.","Tepsiye yay, 35 dk pişir."],
    created:Date.now(), updated:Date.now()
  }]}; }

  function esc(s){ return String(s||'').replace(/[&<>"']/g, m=>({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[m])); }
  function allTags(){ const s=new Set(); data.recipes.forEach(r=>(r.tags||[]).forEach(t=>s.add(t))); return [...s].sort(); }
  let tagFilter=null;

  function renderTagBar(){
    tagBar.innerHTML='';
    const any=document.createElement('div'); any.className='chip'+(tagFilter===null?' active':''); any.textContent='Tümü';
    any.onclick=()=>{ tagFilter=null; renderAll(); };
    tagBar.appendChild(any);
    allTags().forEach(t=>{
      const el=document.createElement('div'); el.className='chip'+(tagFilter===t?' active':''); el.textContent=t;
      el.onclick=()=>{ tagFilter=(tagFilter===t?null:t); renderAll(); };
      tagBar.appendChild(el);
    });
  }

  function matches(r,q){
    if(!q) return true; q=q.toLowerCase();
    return (r.name||'').toLowerCase().includes(q)
      || (r.tags||[]).join(' ').toLowerCase().includes(q)
      || (r.ingredients||[]).some(i=>(i.t||'').toLowerCase().includes(q));
  }

  function renderList(){
    const q=qInput.value.trim();
    const items=data.recipes
      .filter(r=>tagFilter?(r.tags||[]).includes(tagFilter):true)
      .filter(r=>matches(r,q))
      .sort((a,b)=>b.updated-a.updated);

    listEl.innerHTML='';
    if(items.length===0){ listEl.innerHTML='<div class="muted">Sonuç yok.</div>'; return; }
    items.forEach(r=>{
      const card=document.createElement('div'); card.className='card';
      const img=document.createElement('img'); img.className='thumb';
      img.src=r.photo||'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64"><rect width="100%" height="100%" fill="%23101010"/><text x="50%" y="55%" font-family="Arial" font-size="10" fill="%23333" text-anchor="middle">FOTO</text></svg>';
      const meta=document.createElement('div'); meta.className='meta';
      meta.innerHTML=`<div class="name">${esc(r.name)}</div><div class="sub">${(r.tags||[]).map(t=>'#'+t).join(' ')} • ${r.time||'-'} dk • ${r.serves||'-'} porsiyon</div>`;
      card.appendChild(img); card.appendChild(meta);
      card.onclick=()=>{ activeId=r.id; renderDetail(); };
      listEl.appendChild(card);
    });
  }

  function renderDetail(){
    const r=data.recipes.find(x=>x.id===activeId);
    if(!r){ detailEl.innerHTML='<div class="empty">Soldan bir tarif seçin ya da “+ Yeni Tarif”.</div>'; return; }
    const ingHTML=(r.ingredients||[]).map((ing,i)=>`<label class="ing"><input type="checkbox" ${ing.done?'checked':''} data-ing="${i}"><div>${esc(ing.t)}</div></label>`).join('');
    const stepHTML=(r.steps||[]).map((s,i)=>`<div class="step"><div class="num">${i+1}</div><div>${esc(s)}</div></div>`).join('');
    detailEl.innerHTML=`
      <div class="hero">
        <img src="${r.photo||'data:image/svg+xml;utf8,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'120\\' height=\\'120\\'><rect width=\\'100%\\' height=\\'100%\\' fill=\\'%23101010\\'/><text x=\\'50%\\' y=\\'55%\\' font-family=\\'Arial\\' font-size=\\'12\\' fill=\\'%23333\\' text-anchor=\\'middle\\'>FOTO</text></svg>'}">
        <div class="info">
          <h2 class="h1">${esc(r.name)}</h2>
          <div class="muted">Etiketler: ${(r.tags||[]).map(t=>'#'+t).join(' ')||'—'}</div>
          <div class="kvs"><div class="kv">⏱ ${r.time||'-'} dk</div><div class="kv">👥 ${r.serves||'-'} porsiyon</div><div class="kv">🗓 ${new Date(r.updated).toLocaleDateString()}</div></div>
          <div style="margin-top:8px;display:flex;gap:8px;flex-wrap:wrap">
            <button class="btn small" id="editBtn" type="button">Düzenle</button>
            <button class="btn small ghost" id="dupBtn" type="button">Kopya Oluştur</button>
            <button class="btn small warn" id="delBtn" type="button">Sil</button>
          </div>
        </div>
      </div>
      <div class="section"><h3>Malzemeler</h3><div class="inglist" id="ingList">${ingHTML}</div></div>
      <div class="section"><h3>Adımlar</h3><div class="steplist">${stepHTML}</div></div>`;

    $('#ingList',detailEl)?.addEventListener('change',(e)=>{
      const idx=Number(e.target.dataset.ing);
      if(!isNaN(idx) && r.ingredients[idx]){ r.ingredients[idx].done=e.target.checked; r.updated=Date.now(); save(); }
    });
    $('#editBtn',detailEl)?.addEventListener('click', ()=> openModal(r.id));
    $('#dupBtn',detailEl)?.addEventListener('click', ()=>{
      const c=JSON.parse(JSON.stringify(r)); c.id=uid(); c.name=r.name+' (Kopya)'; c.created=c.updated=Date.now();
      data.recipes.unshift(c); save(); renderAll(); activeId=c.id; renderDetail();
    });
    $('#delBtn',detailEl)?.addEventListener('click', ()=>{
      if(confirm('Bu tarifi silmek istiyor musunuz?')){ data.recipes=data.recipes.filter(x=>x.id!==r.id); save(); renderAll(); activeId=data.recipes[0]?.id||null; renderDetail(); }
    });
  }

  function openModal(id){
    $('#modalTitle').textContent = id ? 'Tarifi Düzenle' : 'Yeni Tarif';
    $('#deleteBtn').style.display = id ? 'inline-flex' : 'none';
    if(id){
      const r=data.recipes.find(x=>x.id===id);
      fName.value=r.name||''; fTags.value=(r.tags||[]).join(', '); fServes.value=r.serves||''; fTime.value=r.time||'';
      fIngs.value=(r.ingredients||[]).map(i=>i.t).join('\n'); fSteps.value=(r.steps||[]).join('\n');
      fPreview.src=r.photo||''; fPreview.style.display=r.photo?'block':'none'; fPhoto.value=''; modal.dataset.editId=id;
    }else{
      fName.value=''; fTags.value=''; fServes.value=''; fTime.value=''; fIngs.value=''; fSteps.value=''; fPhoto.value=''; fPreview.src=''; fPreview.style.display='none'; modal.dataset.editId='';
    }
    modal.classList.add('open'); modal.setAttribute('aria-hidden','false');
    setTimeout(()=>fName.focus(),50);
  }

  function closeModal(){ modal.classList.remove('open'); modal.setAttribute('aria-hidden','true'); }

  function handleSave(){
    const name=fName.value.trim();
    if(!name){ alert('Tarif adı gerekli.'); fName.focus(); return; }
    const tags=fTags.value.split(',').map(s=>s.trim()).filter(Boolean).map(s=>s.toLowerCase());
    const serves=Number(fServes.value)||null, time=Number(fTime.value)||null;
    const ingredients=fIngs.value.split('\n').map(s=>s.trim()).filter(Boolean).map(s=>({t:s,done:false}));
    const steps=fSteps.value.split('\n').map(s=>s.trim()).filter(Boolean);
    const photo=fPreview.src && fPreview.style.display!=='none' ? fPreview.src : '';
    const id=modal.dataset.editId;
    if(id){
      const r=data.recipes.find(x=>x.id===id);
      Object.assign(r,{name,tags,serves,time,steps,photo});
      r.ingredients=ingredients.map(i=>{ const prev=(r.ingredients||[]).find(p=>p.t===i.t); return {t:i.t,done:prev?prev.done:false}; });
      r.updated=Date.now(); activeId=r.id;
    }else{
      const r={id:uid(),name,tags,serves,time,ingredients,steps,photo,created:Date.now(),updated:Date.now()};
      data.recipes.unshift(r); activeId=r.id;
    }
    save(); closeModal(); renderAll(); renderDetail();
  }

  // Bind
  btnAdd?.addEventListener('click', ()=> openModal(null));
  btnClose?.addEventListener('click', closeModal);
  modal.addEventListener('click', (e)=>{ if(e.target===modal) closeModal(); });
  btnSave?.addEventListener('click', handleSave);

  btnPrint?.addEventListener('click', ()=> window.print());
  btnExport?.addEventListener('click', ()=>{
    const blob=new Blob([JSON.stringify(data,null,2)],{type:'application/json'});
    const a=document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='tarifler.json';
    document.body.appendChild(a); a.click(); a.remove(); setTimeout(()=>URL.revokeObjectURL(a.href),1500);
  });
  inpImport?.addEventListener('change', (e)=>{
    const file=e.target.files?.[0]; if(!file) return;
    const reader=new FileReader(); reader.onload=()=>{
      try{ const obj=JSON.parse(reader.result); if(obj && Array.isArray(obj.recipes)){ data=obj; save(); renderAll(); activeId=data.recipes[0]?.id||null; renderDetail(); }
      else alert('Geçersiz dosya formatı.'); }catch(err){ alert('JSON okunamadı.'); }
    }; reader.readAsText(file);
  });

  qInput.addEventListener('input', renderList);
  btnClear.addEventListener('click', ()=>{ qInput.value=''; renderList(); });

  // Start
  data = load();
  activeId = data.recipes[0]?.id || null;
  renderTagBar(); renderList(); renderDetail();
})();
