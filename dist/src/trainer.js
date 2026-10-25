(() => {
  const C = window.CLOUDBLITZ_CONTENT;
  if (!C) return;

  const trainerDays = (C.days || []).filter(d => /^Day \d+$/.test(d.day));
  const sheets = Object.fromEntries((C.sheets || []).map(s => [s.name, s]));
  let dayIndex = 0;
  let topicIndex = 0;
  let open = false;

  const esc = value => String(value ?? '').replace(/[&<>\"']/g, ch => ({
    '&':'&amp;','<':'&lt;','>':'&gt;','\"':'&quot;',"'":'&#039;'
  }[ch]));

  function sourceSheets() {
    const names = C.mapping?.[String(dayIndex + 1)] || [];
    return names.map(name => sheets[name]).filter(Boolean);
  }

  function sourceAsset() {
    for (const sheet of sourceSheets()) {
      if (sheet.assets && sheet.assets.length) return sheet.assets[0];
    }
    return null;
  }

  function assetUrl(src) {
    const name = String(src || '').split('/').pop();
    return `./${String(src||'').replace(/^\.\//,'')}`;
  }

  function clampPosition(day, topic) {
    dayIndex = Math.max(0, Math.min(trainerDays.length - 1, day));
    const count = trainerDays[dayIndex]?.topics?.length || 1;
    topicIndex = Math.max(0, Math.min(count - 1, topic));
  }

  function openTrainer(day = 0, topic = 0) {
    if (!trainerDays.length) return;
    clampPosition(day, topic);
    open = true;
    render();
  }

  function closeTrainer() {
    open = false;
    renderButton();
    const overlay = document.getElementById('cb-trainer-overlay');
    if (overlay) overlay.remove();
  }

  function next() {
    if (!open || !trainerDays.length) return;
    const current = trainerDays[dayIndex];
    const topics = current.topics || [];

    if (topicIndex + 1 < topics.length) {
      topicIndex += 1;
      render();
      return;
    }

    if (dayIndex + 1 < trainerDays.length) {
      dayIndex += 1;
      topicIndex = 0;
      render();
      return;
    }

    const status = document.getElementById('trainer-status');
    if (status) status.textContent = 'Day 12 complete — this is the final topic.';
  }

  function previous() {
    if (!open || !trainerDays.length) return;

    if (topicIndex > 0) {
      topicIndex -= 1;
      render();
      return;
    }

    if (dayIndex > 0) {
      dayIndex -= 1;
      topicIndex = Math.max(0, (trainerDays[dayIndex].topics || []).length - 1);
      render();
    }
  }

  function topicSourceHtml(topic) {
    const sources = sourceSheets();
    if (!sources.length) return '<div class="notice">No mapped source worksheet is available for this topic.</div>';

    const firstWord = String(topic || '').toLowerCase().split(/\s+/)[0];
    const source = sources[0];
    const matches = (source.rows || [])
      .filter(row => row.join(' ').toLowerCase().includes(firstWord))
      .slice(0, 8);
    const rows = matches.length ? matches : (source.rows || []).slice(0, 8);

    return `<div class="notice">Source worksheet: ${esc(source.name)}</div>` +
      rows.map(row => `<p>${esc(row.filter(Boolean).join(' · '))}</p>`).join('');
  }

  function render() {
    renderButton();
    const old = document.getElementById('cb-trainer-overlay');
    if (old) old.remove();
    if (!open || !trainerDays.length) return;

    const day = trainerDays[dayIndex];
    const topics = day.topics || [];
    const topic = topics[topicIndex] || 'Source topic';
    const asset = sourceAsset();
    const key = `cb-trainer-${dayIndex}-${topicIndex}`;
    const progress = topics.length ? Math.round(((topicIndex + 1) / topics.length) * 100) : 0;

    const overlay = document.createElement('div');
    overlay.id = 'cb-trainer-overlay';
    overlay.className = 'trainer';

    const head = document.createElement('div');
    head.className = 'trainer-head';
    head.innerHTML = `<div><strong>CloudBlitz Trainer Mode</strong><div class="key">Day ${dayIndex + 1} of ${trainerDays.length} · ${esc(day.module)}</div></div>`;
    const exit = document.createElement('button');
    exit.className = 'pill-btn';
    exit.textContent = 'Exit · Esc';
    exit.addEventListener('click', closeTrainer);
    head.lastElementChild ? head.lastElementChild.replaceWith(exit) : head.appendChild(exit);

    const body = document.createElement('div');
    body.className = 'trainer-body';

    const main = document.createElement('section');
    main.className = 'trainer-main';
    main.innerHTML = `<div class="key">TOPIC ${topicIndex + 1} OF ${topics.length}</div><h1>${esc(topic)}</h1><div class="trainer-content">${topicSourceHtml(topic)}</div>`;

    const actions = document.createElement('div');
    actions.className = 'hero-actions';
    if (asset) {
      const imageButton = document.createElement('button');
      imageButton.className = 'btn orange';
      imageButton.textContent = 'Open Actual Screenshot';
      imageButton.addEventListener('click', () => showImage(asset.src, asset.label));
      actions.appendChild(imageButton);
    }
    const sourceButton = document.createElement('button');
    sourceButton.className = 'btn ghost';
    sourceButton.textContent = 'Open Mapped Source';
    sourceButton.addEventListener('click', () => {
      const src = sourceSheets()[0];
      if (src && typeof window.openMapped === 'function') {
        closeTrainer();
        window.openMapped(src.name);
      }
    });
    actions.appendChild(sourceButton);
    main.appendChild(actions);

    const side = document.createElement('aside');
    side.className = 'trainer-side';
    side.innerHTML = `<h3>Trainer Controls</h3><label class="check"><input id="trainer-complete" type="checkbox"> Mark topic complete</label><p class="key" style="margin-top:20px">Classroom flow</p><p class="key">Explain → Demonstrate → Student Activity → Review → Next</p><div class="progress"><i style="width:${progress}%"></i></div><p class="key">${topicIndex + 1}/${topics.length} topics</p><p id="trainer-status" class="key"></p><div class="section-title"><h3 style="color:#fff">Jump to Day</h3></div><div id="trainer-days" class="resource-list"></div>`;

    const checkbox = side.querySelector('#trainer-complete');
    checkbox.checked = localStorage.getItem(key) === 'done';
    checkbox.addEventListener('change', () => {
      if (checkbox.checked) localStorage.setItem(key, 'done');
      else localStorage.removeItem(key);
    });

    const dayList = side.querySelector('#trainer-days');
    trainerDays.forEach((d, i) => {
      const button = document.createElement('button');
      button.className = `nav-btn ${i === dayIndex ? 'active' : ''}`;
      button.textContent = `Day ${i + 1} · ${d.module}`;
      button.addEventListener('click', () => openTrainer(i, 0));
      dayList.appendChild(button);
    });

    body.appendChild(main);
    body.appendChild(side);

    const foot = document.createElement('div');
    foot.className = 'trainer-foot';
    const hint = document.createElement('div');
    hint.className = 'key';
    hint.textContent = '← Previous · → Next · Esc Exit';
    const controls = document.createElement('div');

    const prevButton = document.createElement('button');
    prevButton.className = 'pill-btn';
    prevButton.textContent = '← Previous';
    prevButton.disabled = dayIndex === 0 && topicIndex === 0;
    prevButton.addEventListener('click', previous);

    const nextButton = document.createElement('button');
    nextButton.className = 'pill-btn primary';
    nextButton.textContent = dayIndex === trainerDays.length - 1 && topicIndex === topics.length - 1 ? 'Complete' : 'Next →';
    nextButton.addEventListener('click', next);

    controls.appendChild(prevButton);
    controls.appendChild(nextButton);
    foot.appendChild(hint);
    foot.appendChild(controls);

    overlay.appendChild(head);
    overlay.appendChild(body);
    overlay.appendChild(foot);
    document.body.appendChild(overlay);
  }

  function renderButton() {
    let button = document.getElementById('cb-trainer-launch');
    if (!button) {
      button = document.createElement('button');
      button.id = 'cb-trainer-launch';
      button.className = 'pill-btn primary';
      button.textContent = 'Trainer Mode';
      button.style.cssText = 'position:fixed;right:20px;bottom:20px;z-index:70;box-shadow:0 8px 25px #0003';
      button.addEventListener('click', () => openTrainer(0, 0));
      document.body.appendChild(button);
    }
    button.style.display = open ? 'none' : 'block';
  }

  function showImage(src, label) {
    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.addEventListener('click', () => modal.remove());
    modal.innerHTML = `<div class="modal-inner"><button class="close">Close</button><img src="${assetUrl(src)}" alt="${esc(label)}"><div style="color:#fff;text-align:center;margin-top:10px">${esc(label)}</div></div>`;
    modal.querySelector('.close').addEventListener('click', e => { e.stopPropagation(); modal.remove(); });
    document.body.appendChild(modal);
  }

  document.addEventListener('keydown', event => {
    if (!open) return;
    if (event.key === 'ArrowRight') { event.preventDefault(); next(); }
    if (event.key === 'ArrowLeft') { event.preventDefault(); previous(); }
    if (event.key === 'Escape') { event.preventDefault(); closeTrainer(); }
  });

  window.trainerOpenMode = openTrainer;
  window.trainerNext = next;
  window.trainerPrev = previous;
  window.trainerClose = closeTrainer;
  window.trainerImage = showImage;
  renderButton();
})();