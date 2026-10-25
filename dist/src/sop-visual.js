(() => {
  const C = window.CLOUDBLITZ_CONTENT;
  if (!C) return;
  const sheetList = Array.isArray(C.sheets) ? C.sheets : Object.values(C.sheets || {});
  const sheets = Object.fromEntries(sheetList.map(s => [s.name, s]));
  const escapeHtml = value => String(value ?? '').replace(/[&<>\"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'}[ch]));
  const text = row => (row || []).filter(v => String(v ?? '').trim()).join('   ');
  const isSection = value => /SECTION [A-Z]/i.test(String(value || ''));
  const isReminder = value => String(value || '').includes('KEY REMINDER');

  function sourceVisual(n) {
    const s = sheets[n];
    if (!s) return '<div class="sop-empty">Source worksheet not found.</div>';
    const rows = s.rows || [];
    const title = text(rows[1]) || text(rows[0]) || n;
    const blocks = [];
    let sectionNo = 0;
    let current = null;
    const flush = () => { if (current && current.items.length) blocks.push(current); current = null; };

    rows.slice(2).forEach((row, idx) => {
      const values = (row || []).map(v => String(v ?? '').trim());
      const joined = values.filter(Boolean).join('   ');
      if (!joined) return;
      if (isSection(joined)) {
        flush();
        sectionNo += 1;
        current = { heading: joined.replace(/^SECTION\s+/i, 'SECTION '), items: [], no: sectionNo };
        return;
      }
      if (isReminder(joined)) {
        flush();
        blocks.push({ reminder: joined });
        return;
      }
      if (!current) current = { heading: 'Source Content', items: [], no: 1 };
      current.items.push({ values, joined, index: idx });
    });
    flush();

    const rendered = blocks.map(b => {
      if (b.reminder) return `<div class="sop-reminder sop-reveal"><div class="sop-reminder-icon">!</div><div><div class="sop-kicker">KEY REMINDER</div><div class="sop-reminder-text">${escapeHtml(b.reminder.replace(/^⚡\s*KEY REMINDER:\s*/i,''))}</div></div></div>`;
      const items = b.items.map((item, ii) => {
        const v = item.values.filter(Boolean);
        const doValue = v.find(x => x.includes('✓'));
        const dontValue = v.find(x => x.includes('✗'));
        if (doValue || dontValue) return `<div class="sop-do-dont sop-reveal"><div class="sop-good"><span>✓</span><div>${escapeHtml(doValue || '')}</div></div><div class="sop-bad"><span>✗</span><div>${escapeHtml(dontValue || '')}</div></div></div>`;
        const heading = v.length > 1 ? v[0] : '';
        const body = v.length > 1 ? v.slice(1).join('   ') : v[0];
        const numbered = /^(\d+\.|[0-9]+\.)/.test(body);
        return `<article class="sop-card sop-reveal ${numbered?'sop-numbered':''}"><div class="sop-card-top"><span class="sop-index">${String(ii+1).padStart(2,'0')}</span>${heading ? `<span class="sop-label">${escapeHtml(heading)}</span>` : ''}</div><div class="sop-card-body">${escapeHtml(body)}</div></article>`;
      }).join('');
      return `<section class="sop-section sop-reveal"><div class="sop-section-marker">${String(b.no).padStart(2,'0')}</div><div class="sop-section-main"><div class="sop-section-heading">${escapeHtml(b.heading)}</div><div class="sop-section-line"></div>${items}</div></section>`;
    }).join('');

    return `<div class="sop-experience"><div class="sop-hero"><div class="sop-hero-glow"></div><div class="sop-eyebrow">CLOUDBLITZ · GenAI · LEARNING RESOURCES</div><h1>${escapeHtml(title)}</h1><p>Source-preserved SOP presentation. The content below is rendered from the workbook; the visual layout, motion and navigation are presentation only.</p><div class="sop-toolbar"><button class="pill-btn primary" onclick="sopExpandAll()">Expand All</button><button class="pill-btn" onclick="sopCollapseAll()">Collapse Cards</button><button class="pill-btn" onclick="window.print()">Print</button></div></div><div class="sop-progress"><div><span>Document progress</span><b id="sop-progress-label">0%</b></div><div class="sop-progress-track"><i id="sop-progress-bar"></i></div></div><div class="sop-content">${rendered}</div></div>`;
  }

  function visualDoc(name) {
    if (!sheets[name]) return;
    const root = document.getElementById('app');
    root.innerHTML = `<div class="app"><header class="topbar"><div class="brand"><div class="brandmark">CB</div><div><h1>CloudBlitz GenAI Placement Training</h1><small>SOP Visual Classroom · Source Workbook</small></div></div><div class="top-actions"><button class="pill-btn" onclick="show('sops')">← SOP Library</button></div></header><main class="content">${sourceVisual(name)}</main></div>`;
    initMotion();
  }

  function initMotion() {
    const nodes = [...document.querySelectorAll('.sop-reveal')];
    nodes.forEach((el, i) => { el.style.setProperty('--delay', `${Math.min(i * 45, 500)}ms`); });
    if ('IntersectionObserver' in window) {
      const io = new IntersectionObserver(entries => entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); }), {threshold:.08});
      nodes.forEach(n => io.observe(n));
    } else nodes.forEach(n => n.classList.add('in'));
    const cards = [...document.querySelectorAll('.sop-card')];
    cards.forEach(card => card.addEventListener('click', () => card.classList.toggle('expanded')));
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const pct = max > 0 ? Math.round((window.scrollY / max) * 100) : 100;
      const bar = document.getElementById('sop-progress-bar');
      const label = document.getElementById('sop-progress-label');
      if (bar) bar.style.width = `${pct}%`;
      if (label) label.textContent = `${pct}%`;
    };
    window.addEventListener('scroll', onScroll, {passive:true});
    onScroll();
  }

  window.sopExpandAll = () => document.querySelectorAll('.sop-card').forEach(c => c.classList.add('expanded'));
  window.sopCollapseAll = () => document.querySelectorAll('.sop-card').forEach(c => c.classList.remove('expanded'));
  window.doc = visualDoc;
})();
