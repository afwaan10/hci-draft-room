(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const localHeroes = Array.isArray(window.MOBA_HUB_HEROES)
    ? window.MOBA_HUB_HEROES
    : (Array.isArray(window.HCI_HEROES) ? window.HCI_HEROES : []);

  let heroes = localHeroes.filter((hero) => hero.active !== false);
  let activeHero = null;
  let selectedSkillIndex = 0;

  const typeLabel = (type = '') => ({
    passive: 'Passive', active: 'Active Skill', ultimate: 'Ultimate', transformed: 'Transformed Skill', alternate: 'Alternate Skill', special: 'Special Skill'
  }[String(type).toLowerCase()] || String(type || 'Skill'));

  function heroImage(hero) {
    const image = hero?.image || '';
    return image ? (/^(?:https?:|data:|blob:)/i.test(image) ? image : window.MOBAHub.url(image)) : window.MOBAHub.url('assets/brand/moba-hub-icon.png');
  }

  function fallbackOverview(hero) {
    const roles = (hero.roles || []).join(' / ') || 'flexible';
    const lanes = (hero.lanes || []).join(' and ') || 'multiple lanes';
    return `${hero.name} is a ${roles} hero commonly played in ${lanes}. Use the skill and current-meta panels for patch-aware draft preparation.`;
  }

  function svgIcon(kind = 'active') {
    const common = 'viewBox="0 0 24 24" aria-hidden="true" focusable="false"';
    if (kind === 'passive') return `<svg ${common}><path d="M12 3a9 9 0 1 0 9 9h-2.2a6.8 6.8 0 1 1-2-4.8L13 11h8V3l-2.6 2.6A8.9 8.9 0 0 0 12 3Z"/></svg>`;
    if (kind === 'ultimate') return `<svg ${common}><path d="m12 2 2.7 5.5 6.1.9-4.4 4.3 1 6.1-5.4-2.9-5.4 2.9 1-6.1L3.2 8.4l6.1-.9L12 2Z"/></svg>`;
    if (kind === 'transformed') return `<svg ${common}><path d="M4 4h6v2H7.4l3.8 3.8-1.4 1.4L6 7.4V10H4V4Zm16 16h-6v-2h2.6l-3.8-3.8 1.4-1.4L18 16.6V14h2v6ZM14 4h6v6h-2V7.4l-3.8 3.8-1.4-1.4L16.6 6H14V4ZM4 14h2v2.6l3.8-3.8 1.4 1.4L7.4 18H10v2H4v-6Z"/></svg>`;
    return `<svg ${common}><path d="M13.1 2 5 13h6l-.1 9L19 11h-6l.1-9Z"/></svg>`;
  }

  function skillIconMarkup(skill) {
    if (skill?.icon) {
      const resolved = /^(?:https?:|data:|blob:)/i.test(skill.icon) ? skill.icon : window.MOBAHub.url(skill.icon);
      const src = window.MOBAHub.escapeHtml(resolved);
      return `<img src="${src}" alt="" loading="lazy" referrerpolicy="no-referrer">`;
    }
    return svgIcon(String(skill?.type || 'active').toLowerCase());
  }

  function formatSeries(value, pendingText = 'Not verified for the current patch') {
    if (Array.isArray(value) && value.length) return value.join(' / ');
    if (value !== null && value !== undefined && String(value).trim()) return String(value);
    return pendingText;
  }

  function renderMeta(hero) {
    const meta = hero?.meta || {};
    const stats = [
      ['Win Rate', Number.isFinite(Number(meta.winRate)) ? `${Number(meta.winRate).toFixed(2)}%` : 'Unavailable'],
      ['Pick Rate', Number.isFinite(Number(meta.pickRate)) ? `${Number(meta.pickRate).toFixed(2)}%` : 'Unavailable'],
      ['Ban Rate', Number.isFinite(Number(meta.banRate)) ? `${Number(meta.banRate).toFixed(2)}%` : 'Unavailable'],
      ['Popularity', meta.popularity || 'Unrated']
    ];
    $('heroMetaStats').innerHTML = stats.map(([label, value]) => `
      <div class="hero-meta-stat"><small>${window.MOBAHub.escapeHtml(label)}</small><strong>${window.MOBAHub.escapeHtml(value)}</strong></div>
    `).join('');
    $('heroMetaContext').textContent = meta.snapshotAt
      ? `${meta.server === 'global' ? 'Global Ranked' : 'Ranked'} · ${meta.roleScope || hero.recommendedLane || 'Role scope unavailable'} · Snapshot ${new Date(meta.snapshotAt).toLocaleDateString('en-GB')}`
      : 'Current meta statistics are not available for this hero.';
  }

  function renderSkill() {
    const skills = Array.isArray(activeHero?.skills) ? activeHero.skills : [];
    const skill = skills[selectedSkillIndex] || skills[0];
    const tabs = $('skillTabs');
    tabs.replaceChildren();

    if (!skills.length) {
      tabs.innerHTML = '<div class="mh-empty">No verified skill records are available.</div>';
      $('skillName').textContent = 'Skill data unavailable';
      $('skillType').textContent = '—';
      $('skillCooldown').textContent = '—';
      $('skillCost').textContent = '—';
      $('skillDescription').textContent = 'This hero is listed in the roster, but the skill kit has not been verified yet.';
      $('skillMechanics').replaceChildren();
      return;
    }

    skills.forEach((entry, index) => {
      const button = document.createElement('button');
      button.className = `skill-tab ${selectedSkillIndex === index ? 'active' : ''}`;
      button.type = 'button';
      button.setAttribute('aria-pressed', selectedSkillIndex === index ? 'true' : 'false');
      button.setAttribute('aria-label', entry.name || `Skill ${index + 1}`);
      button.innerHTML = `<span class="skill-icon">${skillIconMarkup(entry)}</span><span class="skill-tab-copy"><strong>${window.MOBAHub.escapeHtml(entry.name || 'Unnamed Skill')}</strong><small>${window.MOBAHub.escapeHtml(typeLabel(entry.type))}</small></span>`;
      button.addEventListener('click', () => {
        selectedSkillIndex = index;
        renderSkill();
      });
      tabs.appendChild(button);
    });

    $('skillName').textContent = skill.name || 'Unnamed Skill';
    $('skillType').textContent = typeLabel(skill.type);
    $('skillCooldown').textContent = formatSeries(skill.cooldown, String(skill.type).toLowerCase() === 'passive' ? 'Passive' : 'Not verified');
    $('skillCost').textContent = formatSeries(skill.cost, 'Not verified');
    $('skillDescription').textContent = skill.description || 'No verified description is available for this skill.';
    $('skillMechanics').innerHTML = (skill.mechanicTags || []).map((tag) => `<span class="hero-tag">${window.MOBAHub.escapeHtml(String(tag).replace(/-/g, ' '))}</span>`).join('');
  }

  function renderList() {
    const query = $('heroSearch').value.trim().toLowerCase();
    const lane = $('heroLane').value;
    const filtered = heroes.filter((hero) => {
      const searchable = [hero.name, hero.title, ...(hero.roles || []), ...(hero.lanes || [])].join(' ').toLowerCase();
      return (!query || searchable.includes(query)) && (!lane || (hero.lanes || []).includes(lane));
    });

    const list = $('heroList');
    list.replaceChildren();
    filtered.forEach((hero) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = `hero-list-btn ${activeHero?.id === hero.id ? 'active' : ''}`;
      const meta = hero.meta || {};
      button.innerHTML = `
        <img src="${window.MOBAHub.escapeHtml(heroImage(hero))}" alt="" loading="lazy">
        <span><strong>${window.MOBAHub.escapeHtml(hero.name)}</strong><small>${window.MOBAHub.escapeHtml((hero.lanes || []).join(' · ') || 'Flexible')}</small></span>
        <span class="hero-list-wr">${Number.isFinite(Number(meta.winRate)) ? `${Number(meta.winRate).toFixed(1)}% WR` : '—'}</span>`;
      const image = button.querySelector('img');
      image.addEventListener('error', () => { image.src = window.MOBAHub.url('assets/brand/moba-hub-icon.png'); }, { once: true });
      button.addEventListener('click', () => selectHero(hero));
      list.appendChild(button);
    });

    if (!filtered.length) list.innerHTML = '<div class="mh-empty">No heroes match the current filters.</div>';
    $('heroResultCount').textContent = `${filtered.length} of ${heroes.length} heroes`;
  }

  function selectHero(hero) {
    if (!hero) return;
    activeHero = hero;
    selectedSkillIndex = 0;

    const params = new URLSearchParams(location.search);
    params.set('hero', hero.id);
    try { history.replaceState(null, '', `${location.pathname}?${params}`); } catch (_error) { /* Embedded preview */ }

    $('heroImage').src = heroImage(hero);
    $('heroImage').alt = `${hero.name} hero render`;
    $('heroName').textContent = hero.name;
    $('heroTitle').textContent = hero.title || 'Honor of Kings Hero';
    $('heroLanes').innerHTML = [...(hero.roles || []), ...(hero.lanes || [])].map((value) => `<span class="hero-tag">${window.MOBAHub.escapeHtml(value)}</span>`).join('');
    $('heroOverview').textContent = hero.description || fallbackOverview(hero);
    $('heroPatch').textContent = `${hero.patchVersion || 'Season 15 research snapshot'} · Skill names and descriptions are cross-checked; cooldown and cost fields are only shown when verified.`;
    $('heroSource').href = hero.sourceUrl || 'https://camp.honorofkings.com/';

    const modelButton = $('view3D');
    modelButton.disabled = !hero.model3d;
    modelButton.title = hero.model3d ? 'View interactive 3D model' : 'No licensed 3D model is included for this hero';
    $('view2D').classList.add('primary');
    modelButton.classList.remove('primary');
    $('heroModel').hidden = true;
    $('heroImage').hidden = false;

    renderMeta(hero);
    renderSkill();
    renderList();
  }

  let modelViewerPromise = null;
  function ensureModelViewer() {
    if (customElements.get('model-viewer')) return Promise.resolve();
    if (modelViewerPromise) return modelViewerPromise;
    modelViewerPromise = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.type = 'module';
      script.src = 'https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js';
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
    return modelViewerPromise;
  }

  async function view3D() {
    if (!activeHero?.model3d) return;
    try { await ensureModelViewer(); } catch (_error) { window.MOBAHub.toast('The 3D viewer could not be loaded.'); return; }
    const model = $('heroModel');
    model.src = activeHero.model3d;
    model.setAttribute('poster', heroImage(activeHero));
    model.hidden = false;
    $('heroImage').hidden = true;
    $('view3D').classList.add('primary');
    $('view2D').classList.remove('primary');
  }

  function view2D() {
    $('heroModel').hidden = true;
    $('heroImage').hidden = false;
    $('view2D').classList.add('primary');
    $('view3D').classList.remove('primary');
  }

  function prepareFilters() {
    const lanes = [...new Set(heroes.flatMap((hero) => hero.lanes || []))].sort();
    $('heroLane').innerHTML = '<option value="">All Lanes</option>' + lanes.map((lane) => `<option>${window.MOBAHub.escapeHtml(lane)}</option>`).join('');
  }

  window.MOBAHub.onReady(() => {
    if (!heroes.length) {
      $('heroList').innerHTML = '<div class="mh-empty">No hero data is available.</div>';
      return;
    }
    prepareFilters();
    $('heroSearch').addEventListener('input', renderList);
    $('heroLane').addEventListener('change', renderList);
    $('view3D').addEventListener('click', view3D);
    $('view2D').addEventListener('click', view2D);
    $('heroImage').addEventListener('error', () => { $('heroImage').src = window.MOBAHub.url('assets/brand/moba-hub-icon.png'); });
    const requestedId = new URLSearchParams(location.search).get('hero');
    selectHero(heroes.find((hero) => hero.id === requestedId) || heroes[0]);
  });
})();
