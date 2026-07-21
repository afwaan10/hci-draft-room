(() => {
  'use strict';
  const $ = (id) => document.getElementById(id);
  const sourceHeroes = Array.isArray(window.MOBA_HUB_HEROES) ? window.MOBA_HUB_HEROES : (Array.isArray(window.HCI_HEROES) ? window.HCI_HEROES : []);
  let heroes = sourceHeroes.filter((hero) => hero.active !== false);
  let lane = 'ALL';
  let activeHero = null;
  let skillIndex = 0;
  let lastFocus = null;

  const heroImage = (hero) => {
    const value = String(hero?.image || '');
    if (!value) return window.MOBAHub.url('assets/brand/moba-hub-icon.png');
    return /^(?:https?:|data:|blob:)/i.test(value) ? value : window.MOBAHub.url(value);
  };
  const resolveAsset = (value) => /^(?:https?:|data:|blob:)/i.test(String(value || '')) ? value : window.MOBAHub.url(value || '');
  const safeNumber = (value) => {
    if (value === null || value === undefined || String(value).trim() === '') return null;
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };
  const text = (value, fallback = '—') => value !== null && value !== undefined && String(value).trim() ? String(value) : fallback;

  function skillPosition(skill, index, allSkills) {
    const type = String(skill?.type || '').toLowerCase();
    if (type === 'passive') return 'Passive';
    if (type === 'ultimate') return 'Ultimate';
    if (type === 'transformed') return 'Transform Skill';
    if (type === 'alternate') return 'Alternate Skill';
    if (type === 'special') return 'Special Skill';
    const activeBefore = allSkills.slice(0, index + 1).filter((entry) => !['passive', 'ultimate', 'transformed', 'alternate', 'special'].includes(String(entry?.type || '').toLowerCase())).length;
    return `Skill ${Math.max(1, activeBefore)}`;
  }

  function cooldownText(skill) {
    const value = skill?.cooldown;
    if (Array.isArray(value) && value.length) return `${value[0]}s`;
    if (safeNumber(value) !== null) return `${safeNumber(value)}s`;
    if (String(skill?.type || '').toLowerCase() === 'passive') return 'No fixed cooldown';
    return 'Verification pending';
  }
  function costText(skill) {
    const value = skill?.cost;
    if (Array.isArray(value) && value.length) return text(value[0]);
    return text(value, 'No listed cost');
  }

  function iconCandidates(skill) {
    return [skill?.icon, ...(Array.isArray(skill?.iconFallbacks) ? skill.iconFallbacks : [])].filter(Boolean).map(resolveAsset);
  }
  function iconMarkup(skill, className = '') {
    const candidates = iconCandidates(skill);
    if (!candidates.length) return `<span class="skill-icon-fallback ${className}" aria-hidden="true">✦</span>`;
    return `<img class="${className}" src="${window.MOBAHub.escapeHtml(candidates[0])}" data-fallbacks="${window.MOBAHub.escapeHtml(JSON.stringify(candidates.slice(1)))}" alt="${window.MOBAHub.escapeHtml(skill?.name || 'Skill')}" loading="lazy" decoding="async" referrerpolicy="no-referrer">`;
  }
  function bindImageFallbacks(scope = document) {
    scope.querySelectorAll('img[data-fallbacks]').forEach((image) => {
      if (image.dataset.fallbackBound) return;
      image.dataset.fallbackBound = '1';
      image.addEventListener('error', () => {
        let values = [];
        try { values = JSON.parse(image.dataset.fallbacks || '[]'); } catch (_error) {}
        const next = values.shift();
        if (next) { image.dataset.fallbacks = JSON.stringify(values); image.src = next; return; }
        image.replaceWith(Object.assign(document.createElement('span'), { className: 'skill-icon-fallback', textContent: '✦' }));
      });
    });
  }

  function roleSummary(hero) {
    const roles = (hero.roles || []).join(' / ') || 'Flexible';
    const lanes = (hero.lanes || []).join(', ') || hero.recommendedLane || 'Multiple lanes';
    const tags = (hero.tacticalProfile?.tags || []).map((tag) => String(tag).replaceAll('-', ' '));
    const strengths = tags.filter((tag) => /control|engage|burst|mobility|heal|shield|sustain|poke|objective|damage/.test(tag)).slice(0, 5);
    return { roles, lanes, strengths };
  }

  function renderFilters() {
    const lanes = ['ALL', ...new Set(heroes.flatMap((hero) => hero.lanes || []))];
    $('heroRoleFilters').innerHTML = lanes.map((value) => `<button type="button" class="hero-role-chip ${lane === value ? 'active' : ''}" data-lane="${window.MOBAHub.escapeHtml(value)}">${window.MOBAHub.escapeHtml(value === 'ALL' ? 'All' : value)}</button>`).join('');
    $('heroRoleFilters').querySelectorAll('[data-lane]').forEach((button) => button.addEventListener('click', () => { lane = button.dataset.lane; renderFilters(); renderGrid(); }));
  }

  function renderGrid() {
    const query = String($('heroSearch').value || '').trim().toLowerCase();
    const filtered = heroes.filter((hero) => {
      const haystack = [hero.name, hero.title, ...(hero.roles || []), ...(hero.lanes || [])].join(' ').toLowerCase();
      return (!query || haystack.includes(query)) && (lane === 'ALL' || (hero.lanes || []).includes(lane));
    });
    $('heroResultCount').textContent = `${filtered.length} heroes`;
    $('heroGrid').innerHTML = filtered.map((hero) => {
      return `<button type="button" class="hero-directory-card" data-hero-id="${window.MOBAHub.escapeHtml(hero.id)}" aria-label="Open ${window.MOBAHub.escapeHtml(hero.name)} details"><span class="hero-directory-art"><img src="${window.MOBAHub.escapeHtml(heroImage(hero))}" alt="${window.MOBAHub.escapeHtml(hero.name)}" loading="lazy" decoding="async"></span><span class="hero-directory-copy"><strong>${window.MOBAHub.escapeHtml(hero.name)}</strong><small>${window.MOBAHub.escapeHtml((hero.lanes || []).slice(0, 2).join(' · ') || (hero.roles || []).join(' · ') || 'Hero')}</small></span></button>`;
    }).join('') || '<div class="mh-empty hero-grid-empty">No heroes match this search.</div>';
    $('heroGrid').querySelectorAll('[data-hero-id]').forEach((button) => button.addEventListener('click', () => openHero(heroes.find((hero) => hero.id === button.dataset.heroId))));
    $('heroGrid').querySelectorAll('img').forEach((image) => image.addEventListener('error', () => { image.src = window.MOBAHub.url('assets/brand/moba-hub-icon.png'); }, { once: true }));
  }

  function renderMeta(hero) {
    const meta = hero.meta || {};
    const rows = [['Win Rate', safeNumber(meta.winRate)], ['Pick Rate', safeNumber(meta.pickRate)], ['Ban Rate', safeNumber(meta.banRate)]];
    $('heroMetaStats').innerHTML = rows.map(([label, value]) => `<div class="hero-meta-stat"><small>${label}</small><strong>${value === null ? 'N/A' : `${value.toFixed(2)}%`}</strong></div>`).join('');
    const snapshot = meta.snapshotAt ? new Date(meta.snapshotAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : 'date unavailable';
    $('heroMetaContext').textContent = `${meta.sourceName || 'Official ranked source'} · ${meta.server || 'Global'} ${meta.mode || 'Ranked'} · Snapshot ${snapshot}. Values marked N/A are not estimated.`;
  }

  function renderSkill() {
    if (!activeHero) return;
    const skills = Array.isArray(activeHero.skills) ? activeHero.skills : [];
    const skill = skills[skillIndex] || skills[0];
    if (!skill) return;
    $('heroSkillSelector').innerHTML = skills.map((entry, index) => `<button type="button" class="hero-skill-choice ${index === skillIndex ? 'active' : ''}" data-skill-index="${index}"><small>${window.MOBAHub.escapeHtml(skillPosition(entry, index, skills))}</small><span class="hero-skill-choice-icon">${iconMarkup(entry)}</span><strong>${window.MOBAHub.escapeHtml(entry.name || 'Unnamed Skill')}</strong></button>`).join('');
    $('heroSkillSelector').querySelectorAll('[data-skill-index]').forEach((button) => button.addEventListener('click', () => { skillIndex = Number(button.dataset.skillIndex); renderSkill(); }));
    $('heroSkillIcon').innerHTML = iconMarkup(skill);
    $('heroSkillPosition').textContent = skillPosition(skill, skillIndex, skills);
    $('heroSkillName').textContent = skill.name || 'Unnamed Skill';
    $('heroSkillType').textContent = String(skill.type || 'Skill').replaceAll('-', ' ');
    $('heroSkillCooldown').textContent = cooldownText(skill);
    $('heroSkillCost').textContent = costText(skill);
    $('heroSkillDescription').textContent = skill.description || 'No verified description is available.';
    $('heroSkillMechanics').innerHTML = (skill.mechanicTags || []).map((tag) => `<span class="hero-tag">${window.MOBAHub.escapeHtml(String(tag).replaceAll('-', ' '))}</span>`).join('');
    bindImageFallbacks($('heroModal'));
  }

  function openHero(hero) {
    if (!hero) return;
    activeHero = hero; skillIndex = 0; lastFocus = document.activeElement;
    $('heroModalImage').src = heroImage(hero); $('heroModalImage').alt = hero.name;
    $('heroModalName').textContent = hero.name;
    $('heroModalTitle').textContent = hero.title || 'Honor of Kings Hero';
    $('heroModalTags').innerHTML = [...(hero.roles || []), ...(hero.lanes || [])].map((tag) => `<span class="hero-tag">${window.MOBAHub.escapeHtml(tag)}</span>`).join('');
    const summary = roleSummary(hero);
    $('heroOverview').textContent = hero.description || `${hero.name} is a ${summary.roles} hero commonly used in ${summary.lanes}.`;
    $('heroAnalysis').innerHTML = `<div><small>Roles</small><strong>${window.MOBAHub.escapeHtml(summary.roles)}</strong></div><div><small>Recommended Lane</small><strong>${window.MOBAHub.escapeHtml(hero.recommendedLane || summary.lanes)}</strong></div><div class="full"><small>Notable Mechanics</small><strong>${window.MOBAHub.escapeHtml(summary.strengths.join(' · ') || 'See individual skill descriptions')}</strong></div>`;
    $('heroPatch').textContent = `${hero.patchVersion || 'Current global research snapshot'} · Skill cooldown is shown at rank one when verified. “Verification pending” is used instead of inventing a value.`;
    $('heroSource').href = hero.sourceUrl || 'https://camp.honorofkings.com/';
    renderMeta(hero); renderSkill();
    $('heroModal').hidden = false; document.body.classList.add('hero-modal-open');
    history.replaceState(history.state, '', `${location.pathname}?hero=${encodeURIComponent(hero.id)}`);
    requestAnimationFrame(() => $('heroModalClose').focus());
  }

  function closeHero() {
    $('heroModal').hidden = true; document.body.classList.remove('hero-modal-open');
    history.replaceState(history.state, '', location.pathname);
    lastFocus?.focus?.();
  }

  window.MOBAHub.onReady(() => {
    renderFilters(); renderGrid();
    $('heroSearch').addEventListener('input', renderGrid);
    $('heroModalClose').addEventListener('click', closeHero);
    $('heroModal').addEventListener('click', (event) => { if (event.target === $('heroModal')) closeHero(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !$('heroModal').hidden) closeHero(); });
    $('heroModalImage').addEventListener('error', () => { $('heroModalImage').src = window.MOBAHub.url('assets/brand/moba-hub-icon.png'); }, { once: true });
    const requested = new URLSearchParams(location.search).get('hero');
    if (requested) openHero(heroes.find((hero) => hero.id === requested));
  });
})();
