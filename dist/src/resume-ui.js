(() => {
  const C = window.CLOUDBLITZ_CONTENT;
  if (!C) return;
  const esc = v => String(v ?? '').replace(/[&<>\"']/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[m]));
  const sheets = Object.fromEntries((C.sheets || []).map(s => [s.name, s]));
  const sourceNames = ['Sample Resume — Fresher','Sample Resume — Experienced'];

  const templates = [
    {id:'f1',type:'Fresher',name:'Canva Clean Graduate',style:'clean',desc:'Minimal one-column look for campus placements, internships and ATS-first applications.'},
    {id:'f2',type:'Fresher',name:'Canva Modern Orange',style:'modern',desc:'CloudBlitz orange accent with a modern visual hierarchy for GenAI and LLM freshers.'},
    {id:'f3',type:'Fresher',name:'Canva Tech Grid',style:'grid',desc:'Structured technical layout that gives projects and skills strong visibility.'},
    {id:'f4',type:'Fresher',name:'Canva Executive Starter',style:'executive',desc:'Premium corporate styling for graduates targeting enterprise and service companies.'},
    {id:'e1',type:'Experienced',name:'Canva Executive Pro',style:'executive',desc:'Experience-first format designed for measurable achievements and leadership scope.'},
    {id:'e2',type:'Experienced',name:'Canva Modern Professional',style:'modern',desc:'Contemporary two-column design for experienced GenAI and LLM professionals.'},
    {id:'e3',type:'Experienced',name:'Canva ATS Professional',style:'ats',desc:'Simple text-led structure for job portals, recruiter submissions and ATS screening.'},
    {id:'e4',type:'Experienced',name:'Canva Dark Tech',style:'dark',desc:'Bold technology profile layout for portfolio sharing and direct recruiter outreach.'}
  ];

  function rowsFor(name){ return (sheets[name]?.rows || []).filter(r => r && r.some(v => String(v ?? '').trim())); }
  function lines(row){ return row.filter(v => String(v ?? '').trim()).map(v => String(v).trim()); }
  function isHeading(t){ return /^\s*(PROFESSIONAL SUMMARY|INTERNSHIP EXPERIENCE|PROFESSIONAL EXPERIENCE|TECHNICAL SKILLS|EDUCATION|CERTIFICATIONS|PROJECTS|ACHIEVEMENTS|RESPONSIBILITIES|SKILLS|EXPERIENCE|OBJECTIVE|PROFESSIONAL PROFILE|CAREER SUMMARY)/i.test(t); }
  function splitSections(rows){
    const sections=[]; let current=null;
    rows.slice(4).forEach(r=>{
      const v=lines(r); if(!v.length) return;
      const joined=v.join('   ');
      if(isHeading(joined)){ if(current) sections.push(current); current={title:joined.trim(),items:[]}; return; }
      if(!current) current={title:'Profile',items:[]};
      current.items.push(v);
    });
    if(current) sections.push(current);
    return sections;
  }
  function sectionType(title){
    const t=title.toUpperCase();
    if(/SKILL/.test(t)) return 'skills';
    if(/EDUCATION/.test(t)) return 'education';
    if(/CERTIFICATION/.test(t)) return 'certifications';
    if(/ACHIEVEMENT/.test(t)) return 'achievements';
    if(/SUMMARY|OBJECTIVE|PROFILE/.test(t)) return 'summary';
    if(/INTERNSHIP|EXPERIENCE|RESPONSIBILITIES/.test(t)) return 'experience';
    if(/PROJECT/.test(t)) return 'projects';
    return 'other';
  }
  function contentHtml(section){
    return section.items.map(v=>{
      if(v.length>=3) return `<div class="cr-skill"><b>${esc(v[0])}</b><span>${esc(v.slice(1).join(' · '))}</span></div>`;
      const t=v.join('   '); const bullet=/^[▸•●]/.test(t);
      return `<div class="cr-line ${bullet?'bullet':''}">${esc(t)}</div>`;
    }).join('');
  }
  function visualResume(name, style='modern'){
    const rows=rowsFor(name); if(!rows.length) return '<div class="empty">Resume source not found.</div>';
    const person=lines(rows[1])[0] || 'Candidate';
    const role=lines(rows[2])[0] || '';
    const contact=lines(rows[3]).join(' | ');
    const sections=splitSections(rows);
    const experienced=name.includes('Experienced');
    const initials=person.split(/\s+/).filter(Boolean).slice(0,2).map(x=>x[0]).join('').toUpperCase();
    const sideTypes=new Set(['skills','education','certifications','achievements']);
    const side=sections.filter(s=>sideTypes.has(sectionType(s.title)));
    const main=sections.filter(s=>!sideTypes.has(sectionType(s.title)));
    const renderSection=s=>`<section class="cr-section cr-type-${sectionType(s.title)}"><div class="cr-section-title"><span></span><h3>${esc(s.title)}</h3></div>${contentHtml(s)}</section>`;
    return `<div class="resume-canvas-wrap">
      <div class="resume-canvas-toolbar"><div><span class="cr-badge">CLOUDBLITZ</span><strong>${esc(experienced?'Experienced':'Fresher')} · ${esc(style.toUpperCase())} TEMPLATE</strong><small>Original Canva-inspired visual layout · workbook source content preserved</small></div><div class="cr-actions"><button class="pill-btn" onclick="window.print()">Print / PDF</button><button class="pill-btn" onclick="show('resumes')">← Resume Library</button></div></div>
      <div class="resume-canvas cr-style-${esc(style)} ${experienced?'cr-experienced':'cr-fresher'}">
        <aside class="cr-sidebar"><div class="cr-profile"><div class="cr-orb"><span>${esc(initials)}</span></div><div><div class="cr-side-name">${esc(person)}</div><div class="cr-side-role">${esc(role)}</div></div></div><div class="cr-side-block"><div class="cr-side-label">CONTACT</div><div class="cr-contact-side">${esc(contact)}</div></div><div class="cr-side-block"><div class="cr-side-label">PROFILE TYPE</div><div class="cr-side-copy">${experienced?'Experienced professional profile':'Fresher / internship profile'}</div></div><div class="cr-side-art"><i></i><i></i><i></i><i></i><i></i></div></aside>
        <main class="cr-main"><header class="cr-header"><div><div class="cr-eyebrow">GENAI PLACEMENT TRAINING · CLOUD BLITZ</div><h1>${esc(person)}</h1><h2>${esc(role)}</h2></div><div class="cr-mark"><span>CB</span><small>RESUME</small></div></header><div class="cr-layout"><div class="cr-primary">${main.map(renderSection).join('')}</div><aside class="cr-secondary">${side.map(renderSection).join('')}</aside></div></main>
      </div>
    </div>`;
  }

  function templateCard(t, index){
    const source=t.type==='Fresher'?sourceNames[0]:sourceNames[1];
    const r=rowsFor(source); const person=lines(r[1])[0]||'Candidate';
    return `<article class="resume-template studio-template ${t.type==='Fresher'?'fresh-card':'exp-card'} style-${t.style}">
      <div class="template-visual template-${t.style}"><div class="tv-top"><span>${esc(t.type.toUpperCase())}</span><b>CB</b></div><div class="tv-layout"><div class="tv-side"><i></i><i></i><i></i></div><div><div class="tv-name">${esc(person)}</div><div class="tv-role">${esc(lines(r[2])[0]||'GenAI / LLM')}</div><div class="tv-bars"><i></i><i></i><i></i></div></div></div><div class="tv-footer"><span>CloudBlitz</span><span>${index+1 < 10 ? '0'+(index+1) : index+1} · A4</span></div></div>
      <div class="template-info"><span class="template-chip">${esc(t.type)} · ${esc(t.style)}</span><h4>${esc(t.name)}</h4><p>${esc(t.desc)}</p><button class="pill-btn primary" onclick="resumeTemplate('${esc(source)}','${esc(t.style)}')">Preview & Print</button></div>
    </article>`;
  }

  window.resumes = () => `<div class="resume-library-pro">
    <div class="resume-library-hero"><div><div class="eyebrow">CLOUDBLITZ · GenAI · CAREER PROFILE STUDIO</div><h3>Resume Studio</h3><p>Choose from multiple original Canva-inspired layouts for freshers and experienced candidates. Use the workbook's source resumes as the content base, then personalize them for each student's actual profile.</p><div class="resume-quick-links"><a class="pill-btn canva-btn" href="https://www.canva.com/resumes/templates/" target="_blank" rel="noopener">Open Canva Resume Templates ↗</a><span class="resume-mini-note">Design inspiration only · do not copy copyrighted templates</span></div></div><div class="resume-hero-art"><div class="art-card a1">CV</div><div class="art-card a2">ATS</div><div class="art-card a3">CB</div></div></div>
    <div class="resume-category"><div><h4>Fresher Resume Templates</h4><p>Education, projects, internship and skills first.</p></div><span>4 templates</span></div>
    <div class="resume-template-grid">${templates.filter(t=>t.type==='Fresher').map(templateCard).join('')}</div>
    <div class="resume-category"><div><h4>Experienced Resume Templates</h4><p>Experience, achievements, technical scope and leadership first.</p></div><span>4 templates</span></div>
    <div class="resume-template-grid">${templates.filter(t=>t.type==='Experienced').map(templateCard).join('')}</div>
    <div class="resume-source-packs"><div><b>Source Resume Pack</b><span>Fresher + Experienced workbook examples</span></div><button class="pill-btn" onclick="resumeTemplate('Sample Resume — Fresher','ats')">Fresher ATS</button><button class="pill-btn" onclick="resumeTemplate('Sample Resume — Experienced','ats')">Experienced ATS</button></div>
    <div class="resume-note"><span>✓</span><div><b>Professional resume rule</b><small>Canva is excellent for visual design, but students should use a simple text-first template for ATS-heavy job portals. Keep one polished visual version and one ATS-safe version for every candidate.</small></div></div>
  </div>`;

  window.resumeTemplate = (name, style='modern') => {
    if(!sheets[name]) return;
    const root=document.getElementById('app');
    root.innerHTML=`<div class="app"><header class="topbar"><div class="brand"><div class="brandmark">CB</div><div><h1>CloudBlitz GenAI Placement Training</h1><small>Resume Studio · ${name.includes('Experienced')?'Experienced':'Fresher'} Template</small></div></div><div class="top-actions"><button class="pill-btn" onclick="show('resumes')">← Resume Studio</button></div></header><main class="content">${visualResume(name,style)}</main></div>`;
  };
  window.resume = name => resumeTemplate(name,'modern');
  if(typeof window.render==='function') window.render();
})();