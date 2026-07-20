(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  let items = Array.isArray(window.MOBA_HUB_ITEMS) ? window.MOBA_HUB_ITEMS : [];
  const itemMap = () => new Map(items.map((item) => [item.id, item]));
  const initials = (name) => String(name || '?').split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase();

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
    const fallback = `<span class="item-icon-fallback">${window.MOBAHub.escapeHtml(initials(item.name))}</span>`;
    if (!item.image) return fallback;
    return `${fallback}<img src="${window.MOBAHub.escapeHtml(item.image)}" alt="" ${eager ? '' : 'loading="lazy"'} referrerpolicy="no-referrer">`;
  }

  function primaryStats(item) {
    return (item.attributes || []).slice(0, 2).map((entry) => {
      const stat = normalizeAttribute(entry);
      return `<span><b>${window.MOBAHub.escapeHtml(stat.value)}</b> ${window.MOBAHub.escapeHtml(stat.name)}</span>`;
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
          <strong>${window.MOBAHub.escapeHtml(item.name)}</strong>
          <small>${window.MOBAHub.escapeHtml(item.category || 'Uncategorized')} · ${Number(item.shopPrice || item.price || 0).toLocaleString()} Gold</small>
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
    $(id).innerHTML = (values || []).map((value) => `<span class="hero-tag">${window.MOBAHub.escapeHtml(typeof value === 'string' ? value : value.name || value.id || '')}</span>`).join('');
  }

  function effectRows(item) {
    const values = item.effects || item.passives || [];
    return values.map((effect) => {
      const name = Array.isArray(effect) ? effect[0] : effect.name;
      const description = Array.isArray(effect) ? effect[1] : effect.description;
      const type = Array.isArray(effect) ? 'Effect' : (effect.type || 'Effect');
      const cooldown = !Array.isArray(effect) && Number.isFinite(Number(effect.cooldownSeconds)) ? `<span>${Number(effect.cooldownSeconds)}s cooldown</span>` : '';
      return `<article class="item-effect"><header><strong>${window.MOBAHub.escapeHtml(name || 'Item Effect')}</strong><span>${window.MOBAHub.escapeHtml(type)}</span></header><p>${window.MOBAHub.escapeHtml(description || 'Description unavailable.')}</p>${cooldown}</article>`;
    }).join('') || '<p class="mh-help">This item has no listed passive or active effect.</p>';
  }

  function buildNode(entry, lookup) {
    const normalized = typeof entry === 'string' ? { itemId: entry } : (entry || {});
    const item = lookup.get(normalized.itemId) || { id: normalized.itemId, name: String(normalized.itemId || 'Unknown Item'), image: '' };
    return `<button type="button" class="build-node" data-item-id="${window.MOBAHub.escapeHtml(item.id)}">
      <span class="build-node-icon">${iconMarkup(item)}</span>
      <span><strong>${window.MOBAHub.escapeHtml(item.name)}</strong><small>${Number(normalized.priceAtSnapshot || item.shopPrice || item.price || 0).toLocaleString()} Gold</small></span>
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
      return `<div class="attribute-row"><span>${window.MOBAHub.escapeHtml(stat.name)}</span><strong>${window.MOBAHub.escapeHtml(stat.value)}</strong></div>`;
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

  window.MOBAHub.onReady(async (state) => {
    await mergeFirestoreItems(state);
    const categories = [...new Set(items.map((item) => item.category).filter(Boolean))].sort();
    $('itemCategory').innerHTML = '<option value="">All Categories</option>' + categories.map((category) => `<option>${window.MOBAHub.escapeHtml(category)}</option>`).join('');
    $('itemSearch').addEventListener('input', render);
    $('itemCategory').addEventListener('change', render);
    $('itemModalClose').addEventListener('click', closeItem);
    $('itemModal').addEventListener('click', (event) => { if (event.target.id === 'itemModal') closeItem(); });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape' && !$('itemModal').hidden) closeItem(); });
    render();
  });
})();
