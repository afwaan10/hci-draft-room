(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  let items = Array.isArray(window.MOBA_HUB_ITEMS) ? window.MOBA_HUB_ITEMS : [];
  const itemMap = () => new Map(items.map((item) => [item.id, item]));
  const initials = (name) => String(name || '?').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();
  const escapeHtml = (value = '') => window.MOBAHub?.escapeHtml ? window.MOBAHub.escapeHtml(value) : String(value).replace(/[&<>'\"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));

  function normalizeAttribute(attribute) {
    if (Array.isArray(attribute)) return { name: attribute[0], value: attribute[1] };
    return { name: attribute?.name || 'Attribute', value: attribute?.value || '—' };
  }

  function filteredItems() {
    const query = $('itemSearch').value.trim().toLowerCase();
    const category = $('itemCategory').value;
    return items.filter((item) => {
      const attributes = (item.attributes || []).map((entry) => normalizeAttribute(entry).name);
      const effects = (item.effects || item.passives || []).flatMap((entry) => [entry.name, entry.description]);
      const searchable = [item.name, item.description, item.purpose, item.category, ...attributes, ...effects, ...(item.recommendedRoles || [])].join(' ').toLowerCase();
      return (!query || searchable.includes(query)) && (!category || item.category === category);
    });
  }

  function iconMarkup(item, eager = false) {
    const fallback = `<span class="item-icon-fallback">${escapeHtml(initials(item.name))}</span>`;
    if (!item.image) return fallback;
    return `${fallback}<img src="${escapeHtml(item.image)}" alt="" ${eager ? '' : 'loading="lazy"'} referrerpolicy="no-referrer">`;
  }

  function primaryStats(item) {
    return (item.attributes || []).slice(0, 2).map((entry) => {
      const stat = normalizeAttribute(entry);
      return `<span><b>${escapeHtml(stat.value)}</b> ${escapeHtml(stat.name)}</span>`;
    }).join('');
  }

  function render() {
    const list = filteredItems();
    const grid = $('itemGrid');
    grid.replaceChildren();
    list.forEach((item) => {
      const button = document.createElement('button');
      button.className = 'item-card';
      button.type = 'button';
      button.setAttribute('aria-label', `Open ${item.name} details`);
      button.innerHTML = `
        <span class="item-icon">${iconMarkup(item)}</span>
        <span class="item-card-copy">
          <strong>${escapeHtml(item.name)}</strong>
          <small>${escapeHtml(item.category || 'Uncategorized')} · ${Number(item.shopPrice || item.price || 0).toLocaleString()} Gold</small>
          <span class="item-card-stats">${primaryStats(item) || '<span>Open for item details</span>'}</span>
        </span>`;
      const image = button.querySelector('img');
      image?.addEventListener('error', () => image.remove(), { once: true });
      button.addEventListener('click', () => openItem(item));
      grid.appendChild(button);
    });
    if (!list.length) grid.innerHTML = '<div class="mh-empty item-empty">No items match the current filters.</div>';
    $('itemResultCount').textContent = `${list.length} of ${items.length} items`;
  }

  function renderTags(id, values) {
    $(id).innerHTML = (values || []).map((value) => `<span class="hero-tag">${escapeHtml(typeof value === 'string' ? value : value.name || value.id || '')}</span>`).join('');
  }

  function effectRows(item) {
    const values = item.effects || item.passives || [];
    return values.map((effect) => {
      const name = Array.isArray(effect) ? effect[0] : effect.name;
      const description = Array.isArray(effect) ? effect[1] : effect.description;
      const type = Array.isArray(effect) ? 'Effect' : (effect.type || 'Effect');
      const cooldownValue = !Array.isArray(effect) && effect.cooldownSeconds !== null && effect.cooldownSeconds !== undefined && String(effect.cooldownSeconds).trim() !== '' ? Number(effect.cooldownSeconds) : null;
      const cooldown = Number.isFinite(cooldownValue) ? `<span>${cooldownValue}s cooldown</span>` : '';
      return `<article class="item-effect"><header><strong>${escapeHtml(name || 'Item Effect')}</strong><span>${escapeHtml(type)}</span></header><p>${escapeHtml(description || 'Description unavailable.')}</p>${cooldown}</article>`;
    }).join('') || '<p class="mh-help">This item has no listed passive or active effect.</p>';
  }

  function buildNode(entry, lookup) {
    const normalized = typeof entry === 'string' ? { itemId: entry } : (entry || {});
    const item = lookup.get(normalized.itemId) || { id: normalized.itemId, name: String(normalized.itemId || 'Unknown Item'), image: '' };
    return `<button type="button" class="build-node" data-item-id="${escapeHtml(item.id)}">
      <span class="build-node-icon">${iconMarkup(item)}</span>
      <span><strong>${escapeHtml(item.name)}</strong><small>${Number(normalized.priceAtSnapshot || item.shopPrice || item.price || 0).toLocaleString()} Gold</small></span>
    </button>`;
  }

  function renderBuildPath(item) {
    const path = item.buildPath || {};
    const builtFrom = Array.isArray(path.builtFrom) ? path.builtFrom : [];
    const buildsInto = Array.isArray(path.buildsInto) ? path.buildsInto : [];
    const lookup = itemMap();
    const section = $('itemBuildSection');
    if (!builtFrom.length && !buildsInto.length) {
      section.hidden = true;
      return;
    }
    section.hidden = false;
    $('itemBuildPath').innerHTML = `
      ${builtFrom.length ? `<div class="build-group"><small>Built From</small><div class="build-nodes">${builtFrom.map((entry) => buildNode(entry, lookup)).join('')}</div>${Number.isFinite(Number(path.upgradeCost)) ? `<p>Upgrade Cost: <strong>${Number(path.upgradeCost).toLocaleString()} Gold</strong></p>` : ''}</div>` : ''}
      ${buildsInto.length ? `<div class="build-group"><small>Builds Into</small><div class="build-nodes">${buildsInto.map((entry) => buildNode(entry, lookup)).join('')}</div></div>` : ''}`;
    $('itemBuildPath').querySelectorAll('[data-item-id]').forEach((button) => {
      button.addEventListener('click', () => {
        const target = lookup.get(button.dataset.itemId);
        if (target) openItem(target);
      });
      button.querySelector('img')?.addEventListener('error', (event) => event.currentTarget.remove(), { once: true });
    });
  }

  function openItem(item) {
    $('itemModalName').textContent = item.name;
    $('itemModalIcon').innerHTML = iconMarkup(item, true);
    $('itemModalIcon').querySelector('img')?.addEventListener('error', (event) => event.currentTarget.remove(), { once: true });
    $('itemModalMeta').textContent = `${item.category || 'Uncategorized'} · ${item.tier || 'Tier unavailable'} · ${Number(item.shopPrice || item.price || 0).toLocaleString()} Gold`;
    $('itemModalDescription').textContent = item.purpose || item.description || 'No verified purpose is available for this item.';
    $('itemAttributes').innerHTML = (item.attributes || []).map((attribute) => {
      const stat = normalizeAttribute(attribute);
      return `<div class="attribute-row"><span>${escapeHtml(stat.name)}</span><strong>${escapeHtml(stat.value)}</strong></div>`;
    }).join('') || '<p class="mh-help">No base attributes are listed for this item.</p>';
    $('itemPassives').innerHTML = effectRows(item);
    renderTags('itemRoles', item.recommendedRoles || []);
    renderTags('itemHeroes', item.recommendedHeroes || []);
    $('itemHeroesSection').hidden = !(item.recommendedHeroes || []).length;
    renderBuildPath(item);
    $('itemPatch').textContent = `${item.season || 'Season 15'} · ${item.patchVersion || 'Current research snapshot'} · Values are displayed separately from component totals.`;
    const source = $('itemSource');
    source.href = item.sourceUrl || 'https://hokstats.gg/items/';
    source.hidden = false;
    $('itemModal').hidden = false;
    document.body.classList.add('modal-open');
    $('itemModalClose').focus();
  }

  function closeItem() {
    $('itemModal').hidden = true;
    document.body.classList.remove('modal-open');
  }

  async function mergeFirestoreItems(state) {
    if (!state.db) return;
    try {
      const snapshot = await state.db.collection('items').get();
      if (snapshot.empty) return;
      const remote = new Map(snapshot.docs.map((doc) => [doc.id, { id: doc.id, ...doc.data() }]));
      items = items.map((item) => remote.has(item.id) ? { ...item, ...remote.get(item.id) } : item);
    } catch (error) {
      console.warn('Using the local Season 15 item dataset:', error.message);
    }
  }

  function showFatalState(message) {
    const grid = $('itemGrid');
    if (grid) {
      grid.innerHTML = `<article class="mh-empty item-empty"><strong>Item data could not be loaded.</strong><p>${escapeHtml(message || 'Please refresh the page after deployment finishes.')}</p><button class="mh-btn" type="button" data-item-retry>Reload Item Center</button></article>`;
      grid.querySelector('[data-item-retry]')?.addEventListener('click', () => location.reload());
    }
    if ($('itemResultCount')) $('itemResultCount').textContent = 'Data unavailable';
  }

  let booted = false;

  async function boot(state = {}) {
    if (booted) return;
    booted = true;
    try {
      if (!Array.isArray(items) || !items.length) throw new Error('The local item dataset is missing or was not published.');
      await mergeFirestoreItems(state);
      const categories = [...new Set(items.map((item) => item.category).filter(Boolean))].sort();
      $('itemCategory').innerHTML = '<option value="">All Categories</option>' + categories.map((category) => `<option value="${escapeHtml(category)}">${escapeHtml(category)}</option>`).join('');
      $('itemSearch').addEventListener('input', render);
      $('itemCategory').addEventListener('change', render);
      $('itemModalClose').addEventListener('click', closeItem);
      $('itemModal').addEventListener('click', (event) => { if (event.target.id === 'itemModal') closeItem(); });
      document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !$('itemModal').hidden) closeItem(); });
      render();
    } catch (error) {
      console.error('Item Center initialization failed:', error);
      showFatalState(error.message);
    }
  }

  function scheduleStandaloneBoot() {
    const run = () => boot({ db: null, auth: null, user: null });
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', run, { once: true });
    else run();
  }

  if (window.MOBAHub?.onReady) {
    window.MOBAHub.onReady(boot);
    // Android local-preview servers may not complete Firebase authentication.
    if (/^(?:localhost|127\.0\.0\.1)$/.test(location.hostname) || location.protocol === 'file:') {
      window.setTimeout(() => { if (!booted) scheduleStandaloneBoot(); }, 1800);
    }
  } else {
    scheduleStandaloneBoot();
  }
})();
