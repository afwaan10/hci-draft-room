(() => {
  'use strict';

  const WORLD_WIDTH = 1600;
  const WORLD_HEIGHT = 900;
  const MIN_SCALE = 0.35;
  const MAX_SCALE = 4;
  const MAX_HISTORY = 60;
  const assetUrl = (path) => window.MOBAHub?.url(path) || window.MOBA_HUB_PATHS?.url(path) || path;
  const MAPS = {
    hok: { name: 'Honor of Kings', src: assetUrl('assets/maps/hok-real-map.webp') },
    mlbb: { name: 'Mobile Legends', src: assetUrl('assets/maps/mlbb-real-map.jpg') }
  };
  const ICONS = { attack: '⚔', defend: '◆', objective: '★', vision: '◉', danger: '!', rotate: '↻', note: '✎' };
  const $ = (id) => document.getElementById(id);
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const createId = () => `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;

  const viewport = $('mapViewport');
  const world = $('mapWorld');
  const markersLayer = $('mapMarkers');
  const routesLayer = $('mapRoutes');
  if (!viewport || !world || !markersLayer || !routesLayer) return;

  const state = {
    game: 'hok',
    mode: 'pan',
    markerType: 'attack',
    team: 'blue',
    role: 'Jungle',
    scale: 1,
    panX: 0,
    panY: 0,
    markers: [],
    routes: [],
    selected: null,
    title: 'MOBA HUB Tactical Plan',
    note: '',
    history: [],
    future: [],
    mapPlanId: null
  };

  const pointers = new Map();
  let drag = null;
  let gesture = null;
  let spaceHeld = false;

  function storageKey() {
    return `mobaHubMapPlanV42:${window.MOBAHub?.state?.user?.uid || 'local'}`;
  }

  function serializableState() {
    return {
      game: state.game,
      markers: state.markers,
      routes: state.routes,
      title: state.title,
      note: state.note,
      mapPlanId: state.mapPlanId
    };
  }

  function snapshot() {
    return JSON.stringify(serializableState());
  }

  function remember(raw = snapshot()) {
    state.history.push(raw);
    if (state.history.length > MAX_HISTORY) state.history.shift();
    state.future = [];
    updateHistoryButtons();
  }

  function applySnapshot(raw) {
    const data = JSON.parse(raw);
    state.game = MAPS[data.game] ? data.game : 'hok';
    state.markers = Array.isArray(data.markers) ? data.markers : [];
    state.routes = Array.isArray(data.routes) ? data.routes : [];
    state.title = String(data.title || 'MOBA HUB Tactical Plan');
    state.note = String(data.note || '');
    state.mapPlanId = data.mapPlanId || null;
    state.selected = null;
    $('planTitle').value = state.title;
    $('planNote').value = state.note;
    switchGame(state.game, false);
    render();
  }

  function undo() {
    if (!state.history.length) return;
    state.future.push(snapshot());
    applySnapshot(state.history.pop());
    saveLocal();
    updateHistoryButtons();
  }

  function redo() {
    if (!state.future.length) return;
    state.history.push(snapshot());
    applySnapshot(state.future.pop());
    saveLocal();
    updateHistoryButtons();
  }

  function updateHistoryButtons() {
    $('undo').disabled = !state.history.length;
    $('redo').disabled = !state.future.length;
  }

  function viewportPoint(clientX, clientY) {
    const rect = viewport.getBoundingClientRect();
    return { x: clientX - rect.left, y: clientY - rect.top };
  }

  function worldPoint(clientX, clientY) {
    const point = viewportPoint(clientX, clientY);
    return {
      x: (point.x - state.panX) / state.scale,
      y: (point.y - state.panY) / state.scale
    };
  }

  function applyTransform() {
    world.style.transform = `translate(${state.panX}px, ${state.panY}px) scale(${state.scale})`;
    $('zoomReadout').textContent = `${Math.round(state.scale * 100)}%`;
  }

  function fitMap() {
    const rect = viewport.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    state.scale = clamp(Math.min(rect.width / WORLD_WIDTH, rect.height / WORLD_HEIGHT) * 0.94, MIN_SCALE, MAX_SCALE);
    state.panX = (rect.width - WORLD_WIDTH * state.scale) / 2;
    state.panY = (rect.height - WORLD_HEIGHT * state.scale) / 2;
    applyTransform();
  }

  function zoomAt(nextScale, clientX, clientY) {
    const rect = viewport.getBoundingClientRect();
    const localX = clientX - rect.left;
    const localY = clientY - rect.top;
    const worldX = (localX - state.panX) / state.scale;
    const worldY = (localY - state.panY) / state.scale;
    state.scale = clamp(nextScale, MIN_SCALE, MAX_SCALE);
    state.panX = localX - worldX * state.scale;
    state.panY = localY - worldY * state.scale;
    applyTransform();
  }

  function setMode(mode) {
    state.mode = mode;
    document.querySelectorAll('[data-tool]').forEach((button) => button.classList.toggle('active', button.dataset.tool === mode));
    document.querySelectorAll('[data-mobile-tool]').forEach((button) => button.classList.toggle('active', button.dataset.mobileTool === mode));
    viewport.classList.toggle('pan-mode', mode === 'pan');
    const messages = {
      pan: 'Drag to move. Use the mouse wheel or pinch with two fingers to zoom.',
      select: 'Select and drag markers or routes. Press Delete to remove the selected object.',
      route: 'Drag from a start point to an end point to draw a directional route.',
      role: 'Tap the map to place the selected team role.',
      marker: 'Tap the map to place the selected strategy marker.'
    };
    $('activeToolText').textContent = messages[mode] || messages.marker;
  }

  function switchGame(game, record = true) {
    if (!MAPS[game]) return;
    if (record && game !== state.game) remember();
    state.game = game;
    $('mapImage').src = MAPS[game].src;
    $('mapImage').alt = `${MAPS[game].name} tactical map`;
    document.querySelectorAll('[data-game]').forEach((button) => button.classList.toggle('active', button.dataset.game === game));
    saveLocal();
  }

  function markerLabel(marker) {
    if (marker.kind === 'role') return marker.role;
    if (marker.kind === 'note') return marker.text || 'Note';
    return ICONS[marker.kind] || '•';
  }

  function renderMarkers() {
    markersLayer.replaceChildren();
    for (const marker of state.markers) {
      const element = document.createElement('button');
      element.type = 'button';
      element.className = `map42-marker ${marker.team || 'neutral'} ${marker.kind === 'note' ? 'note' : ''}`;
      if (state.selected?.type === 'marker' && state.selected.id === marker.id) element.classList.add('selected');
      element.dataset.objectType = 'marker';
      element.dataset.id = marker.id;
      element.style.left = `${marker.x}px`;
      element.style.top = `${marker.y}px`;
      element.textContent = markerLabel(marker);
      element.title = marker.kind === 'role' ? `${marker.team} ${marker.role}` : marker.kind;
      markersLayer.appendChild(element);
    }
  }

  function renderRoutes() {
    routesLayer.innerHTML = `
      <defs>
        <marker id="arrow-blue" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#4e9dff"/></marker>
        <marker id="arrow-red" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#ff6577"/></marker>
        <marker id="arrow-neutral" markerWidth="8" markerHeight="8" refX="7" refY="3" orient="auto"><path d="M0,0 L0,6 L8,3 z" fill="#f0c75e"/></marker>
      </defs>`;

    for (const route of state.routes) {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', route.x1);
      line.setAttribute('y1', route.y1);
      line.setAttribute('x2', route.x2);
      line.setAttribute('y2', route.y2);
      line.setAttribute('class', `map42-route ${route.team}${state.selected?.type === 'route' && state.selected.id === route.id ? ' selected' : ''}`);
      line.setAttribute('marker-end', `url(#arrow-${route.team})`);
      line.dataset.objectType = 'route';
      line.dataset.id = route.id;
      if (route.dashed) line.setAttribute('stroke-dasharray', '16 12');
      routesLayer.appendChild(line);
    }

    if (drag?.type === 'route') {
      const line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
      line.setAttribute('x1', drag.start.x);
      line.setAttribute('y1', drag.start.y);
      line.setAttribute('x2', drag.current.x);
      line.setAttribute('y2', drag.current.y);
      line.setAttribute('class', `map42-route ${state.team} preview`);
      routesLayer.appendChild(line);
    }
  }

  function render() {
    renderMarkers();
    renderRoutes();
    $('objectCount').textContent = `${state.markers.length} markers · ${state.routes.length} routes`;
    $('deleteSelected').disabled = !state.selected;
    applyTransform();
    updateHistoryButtons();
  }

  function modalPrompt({ title, label, confirmText, initialValue = '' }) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'mh-modal';
      overlay.innerHTML = `
        <article class="mh-modal-card" role="dialog" aria-modal="true" aria-labelledby="mapPromptTitle">
          <header class="mh-modal-head"><h2 id="mapPromptTitle"></h2><button class="mh-modal-close" type="button" aria-label="Close">×</button></header>
          <div class="mh-modal-body">
            <div class="mh-field"><label for="mapPromptInput"></label><input class="mh-input" id="mapPromptInput" maxlength="80"></div>
            <div class="mh-actions" style="margin-top:16px"><button class="mh-btn primary" data-confirm type="button"></button><button class="mh-btn" data-cancel type="button">Cancel</button></div>
          </div>
        </article>`;
      document.body.appendChild(overlay);
      overlay.querySelector('h2').textContent = title;
      overlay.querySelector('label').textContent = label;
      overlay.querySelector('[data-confirm]').textContent = confirmText;
      const input = overlay.querySelector('input');
      input.value = initialValue;
      const done = (value) => { overlay.remove(); resolve(value); };
      overlay.querySelector('[data-confirm]').addEventListener('click', () => done(input.value.trim().slice(0, 80)));
      overlay.querySelector('[data-cancel]').addEventListener('click', () => done(''));
      overlay.querySelector('.mh-modal-close').addEventListener('click', () => done(''));
      overlay.addEventListener('click', (event) => { if (event.target === overlay) done(''); });
      input.addEventListener('keydown', (event) => {
        if (event.key === 'Enter') done(input.value.trim().slice(0, 80));
        if (event.key === 'Escape') done('');
      });
      requestAnimationFrame(() => input.focus());
    });
  }

  function modalConfirm({ title, message, confirmText = 'Confirm', danger = false }) {
    return new Promise((resolve) => {
      const overlay = document.createElement('div');
      overlay.className = 'mh-modal';
      overlay.innerHTML = `
        <article class="mh-modal-card" role="dialog" aria-modal="true" aria-labelledby="mapConfirmTitle">
          <header class="mh-modal-head"><h2 id="mapConfirmTitle"></h2><button class="mh-modal-close" type="button" aria-label="Close">×</button></header>
          <div class="mh-modal-body"><p class="mh-help" data-message></p><div class="mh-actions" style="margin-top:18px"><button class="mh-btn ${danger ? 'danger' : 'primary'}" data-confirm type="button"></button><button class="mh-btn" data-cancel type="button">Cancel</button></div></div>
        </article>`;
      document.body.appendChild(overlay);
      overlay.querySelector('h2').textContent = title;
      overlay.querySelector('[data-message]').textContent = message;
      overlay.querySelector('[data-confirm]').textContent = confirmText;
      const done = (value) => { overlay.remove(); resolve(value); };
      overlay.querySelector('[data-confirm]').addEventListener('click', () => done(true));
      overlay.querySelector('[data-cancel]').addEventListener('click', () => done(false));
      overlay.querySelector('.mh-modal-close').addEventListener('click', () => done(false));
      overlay.addEventListener('click', (event) => { if (event.target === overlay) done(false); });
      overlay.addEventListener('keydown', (event) => { if (event.key === 'Escape') done(false); });
      requestAnimationFrame(() => overlay.querySelector('[data-cancel]').focus());
    });
  }

  async function addMarker(point) {
    const before = snapshot();
    const marker = {
      id: createId(),
      x: clamp(point.x, 0, WORLD_WIDTH),
      y: clamp(point.y, 0, WORLD_HEIGHT),
      team: state.team,
      kind: state.mode === 'role' ? 'role' : state.markerType
    };
    if (marker.kind === 'role') marker.role = state.role;
    if (marker.kind === 'note') {
      const text = await modalPrompt({ title: 'Map Note', label: 'Short Note', confirmText: 'Add Note' });
      if (!text) return;
      marker.text = text;
    }
    remember(before);
    state.markers.push(marker);
    state.selected = { type: 'marker', id: marker.id };
    render();
    saveLocal();
  }

  function beginGesture() {
    if (pointers.size < 2) return;
    const [first, second] = [...pointers.values()].slice(0, 2);
    const centerX = (first.x + second.x) / 2;
    const centerY = (first.y + second.y) / 2;
    const anchor = worldPoint(centerX, centerY);
    gesture = {
      startDistance: Math.max(1, Math.hypot(second.x - first.x, second.y - first.y)),
      startScale: state.scale,
      anchorWorldX: anchor.x,
      anchorWorldY: anchor.y
    };
    drag = null;
    viewport.classList.add('is-panning');
  }

  function pointerTarget(event) {
    const element = event.target.closest?.('[data-object-type]');
    if (!element) return null;
    return { type: element.dataset.objectType, id: element.dataset.id };
  }

  function startPointer(event) {
    viewport.setPointerCapture?.(event.pointerId);
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });
    if (pointers.size === 2) {
      beginGesture();
      return;
    }
    if (pointers.size > 2) return;

    const target = pointerTarget(event);
    const point = worldPoint(event.clientX, event.clientY);
    const wantsPan = state.mode === 'pan' || spaceHeld || event.button === 1;

    if (target && state.mode === 'select') {
      state.selected = target;
      if (target.type === 'marker') {
        const marker = state.markers.find((entry) => entry.id === target.id);
        if (marker) {
          drag = {
            type: 'marker',
            id: marker.id,
            before: snapshot(),
            moved: false,
            startClientX: event.clientX,
            startClientY: event.clientY,
            offsetX: point.x - marker.x,
            offsetY: point.y - marker.y
          };
        }
      }
      render();
      return;
    }

    if (wantsPan) {
      drag = { type: 'pan', startX: event.clientX, startY: event.clientY, panX: state.panX, panY: state.panY };
      viewport.classList.add('is-panning');
      return;
    }

    if (state.mode === 'marker' || state.mode === 'role') {
      drag = { type: 'pending-marker', point, startX: event.clientX, startY: event.clientY, moved: false };
      return;
    }

    if (state.mode === 'route') {
      drag = { type: 'route', start: point, current: point };
      renderRoutes();
      return;
    }

    if (state.mode === 'select') {
      state.selected = null;
      render();
    }
  }

  function movePointer(event) {
    if (!pointers.has(event.pointerId)) return;
    pointers.set(event.pointerId, { x: event.clientX, y: event.clientY });

    if (pointers.size >= 2 && gesture) {
      const [first, second] = [...pointers.values()].slice(0, 2);
      const distance = Math.max(1, Math.hypot(second.x - first.x, second.y - first.y));
      const nextScale = clamp(gesture.startScale * (distance / gesture.startDistance), MIN_SCALE, MAX_SCALE);
      const center = viewportPoint((first.x + second.x) / 2, (first.y + second.y) / 2);
      state.scale = nextScale;
      state.panX = center.x - gesture.anchorWorldX * nextScale;
      state.panY = center.y - gesture.anchorWorldY * nextScale;
      applyTransform();
      return;
    }

    if (!drag) return;
    if (drag.type === 'pan') {
      state.panX = drag.panX + (event.clientX - drag.startX);
      state.panY = drag.panY + (event.clientY - drag.startY);
      applyTransform();
      return;
    }

    if (drag.type === 'pending-marker') {
      if (Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 8) drag.moved = true;
      return;
    }

    if (drag.type === 'marker') {
      const point = worldPoint(event.clientX, event.clientY);
      const marker = state.markers.find((entry) => entry.id === drag.id);
      if (!marker) return;
      if (Math.hypot(event.clientX - drag.startClientX, event.clientY - drag.startClientY) > 3) drag.moved = true;
      marker.x = clamp(point.x - drag.offsetX, 0, WORLD_WIDTH);
      marker.y = clamp(point.y - drag.offsetY, 0, WORLD_HEIGHT);
      renderMarkers();
      return;
    }

    if (drag.type === 'route') {
      const point = worldPoint(event.clientX, event.clientY);
      drag.current = { x: clamp(point.x, 0, WORLD_WIDTH), y: clamp(point.y, 0, WORLD_HEIGHT) };
      renderRoutes();
    }
  }

  async function endPointer(event) {
    pointers.delete(event.pointerId);
    if (pointers.size >= 2) return;
    if (gesture) {
      if (pointers.size < 2) {
        gesture = null;
        drag = null;
        viewport.classList.remove('is-panning');
      }
      return;
    }
    if (!drag) return;

    const completed = drag;
    drag = null;
    viewport.classList.remove('is-panning');

    if (completed.type === 'pending-marker' && !completed.moved) {
      await addMarker(completed.point);
      return;
    }

    if (completed.type === 'marker' && completed.moved) {
      remember(completed.before);
      saveLocal();
    }

    if (completed.type === 'route') {
      const length = Math.hypot(completed.current.x - completed.start.x, completed.current.y - completed.start.y);
      if (length > 20) {
        remember();
        const route = {
          id: createId(),
          x1: completed.start.x,
          y1: completed.start.y,
          x2: completed.current.x,
          y2: completed.current.y,
          team: state.team,
          dashed: $('dashedRoute').checked
        };
        state.routes.push(route);
        state.selected = { type: 'route', id: route.id };
        saveLocal();
      }
    }
    render();
  }

  function removeSelected() {
    if (!state.selected) return;
    remember();
    if (state.selected.type === 'marker') state.markers = state.markers.filter((entry) => entry.id !== state.selected.id);
    if (state.selected.type === 'route') state.routes = state.routes.filter((entry) => entry.id !== state.selected.id);
    state.selected = null;
    render();
    saveLocal();
  }

  async function clearAll() {
    if (!state.markers.length && !state.routes.length) return;
    const confirmed = await modalConfirm({
      title: 'Clear Tactical Plan?',
      message: 'Every marker and route in the current plan will be removed. You can still use Undo immediately afterward.',
      confirmText: 'Clear Plan',
      danger: true
    });
    if (!confirmed) return;
    remember();
    state.markers = [];
    state.routes = [];
    state.selected = null;
    render();
    saveLocal();
  }

  function saveLocal() {
    state.title = $('planTitle')?.value.trim() || 'MOBA HUB Tactical Plan';
    state.note = $('planNote')?.value.trim() || '';
    try {
      localStorage.setItem(storageKey(), snapshot());
      $('saveState').textContent = 'Saved locally';
      clearTimeout(saveLocal.timer);
      saveLocal.timer = setTimeout(() => { $('saveState').textContent = 'Autosave active'; }, 1400);
    } catch (error) {
      $('saveState').textContent = 'Local save unavailable';
      console.warn(error);
    }
  }

  function loadLocal() {
    try {
      const raw = localStorage.getItem(storageKey());
      if (raw) {
        const data = JSON.parse(raw);
        state.game = MAPS[data.game] ? data.game : state.game;
        state.markers = Array.isArray(data.markers) ? data.markers : [];
        state.routes = Array.isArray(data.routes) ? data.routes : [];
        state.title = String(data.title || state.title);
        state.note = String(data.note || '');
        state.mapPlanId = data.mapPlanId || null;
      }
    } catch (error) {
      console.warn('Local map plan could not be loaded:', error);
    }
    $('planTitle').value = state.title;
    $('planNote').value = state.note;
  }

  async function saveCloud() {
    const app = window.MOBAHub.state;
    if (!app.user || !app.db) throw new Error('Sign in before saving a map plan.');
    saveLocal();
    const isNew = !state.mapPlanId;
    const ref = isNew ? app.db.collection('mapPlans').doc() : app.db.collection('mapPlans').doc(state.mapPlanId);
    state.mapPlanId = ref.id;
    const payload = {
      ownerUid: app.user.uid,
      game: state.game,
      title: state.title,
      note: state.note,
      markers: state.markers,
      routes: state.routes,
      updatedAt: firebase.firestore.FieldValue.serverTimestamp()
    };
    if (isNew) payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
    await ref.set(payload, { merge: true });
    saveLocal();
    window.MOBAHub.toast('Map plan saved to your account.');
  }

  async function exportPng() {
    const canvas = document.createElement('canvas');
    canvas.width = WORLD_WIDTH;
    canvas.height = WORLD_HEIGHT + 80;
    const context = canvas.getContext('2d');
    context.fillStyle = '#080b10';
    context.fillRect(0, 0, canvas.width, canvas.height);
    const image = new Image();
    image.src = MAPS[state.game].src;
    await new Promise((resolve) => { image.onload = resolve; image.onerror = resolve; });
    if (image.naturalWidth) context.drawImage(image, 0, 80, WORLD_WIDTH, WORLD_HEIGHT);

    context.fillStyle = '#111720';
    context.fillRect(0, 0, WORLD_WIDTH, 80);
    context.fillStyle = '#f4f7fb';
    context.font = 'bold 30px Arial';
    context.fillText(state.title || 'MOBA HUB Tactical Plan', 30, 46);
    context.fillStyle = '#9ba9bb';
    context.font = '16px Arial';
    context.fillText(`${MAPS[state.game].name} · ${state.note || 'Strategy plan'}`, 30, 69);

    context.lineWidth = 7;
    context.lineCap = 'round';
    for (const route of state.routes) {
      context.strokeStyle = route.team === 'blue' ? '#4e9dff' : route.team === 'red' ? '#ff6577' : '#f0c75e';
      context.setLineDash(route.dashed ? [16, 12] : []);
      context.beginPath();
      context.moveTo(route.x1, route.y1 + 80);
      context.lineTo(route.x2, route.y2 + 80);
      context.stroke();
      const angle = Math.atan2(route.y2 - route.y1, route.x2 - route.x1);
      context.fillStyle = context.strokeStyle;
      context.beginPath();
      context.moveTo(route.x2, route.y2 + 80);
      context.lineTo(route.x2 - 18 * Math.cos(angle - 0.5), route.y2 + 80 - 18 * Math.sin(angle - 0.5));
      context.lineTo(route.x2 - 18 * Math.cos(angle + 0.5), route.y2 + 80 - 18 * Math.sin(angle + 0.5));
      context.closePath();
      context.fill();
    }

    context.setLineDash([]);
    for (const marker of state.markers) {
      context.fillStyle = marker.team === 'blue' ? '#2066b2' : marker.team === 'red' ? '#a93042' : '#8f6c1c';
      context.beginPath();
      context.arc(marker.x, marker.y + 80, 25, 0, Math.PI * 2);
      context.fill();
      context.strokeStyle = '#fff';
      context.lineWidth = 2;
      context.stroke();
      context.fillStyle = '#fff';
      context.textAlign = 'center';
      context.font = 'bold 14px Arial';
      context.fillText(markerLabel(marker).slice(0, 16), marker.x, marker.y + 85);
    }

    const link = document.createElement('a');
    link.download = `moba-hub-${state.game}-map-plan.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
  }

  function closeMobileTools() {
    if (window.matchMedia('(max-width: 900px)').matches) $('mapTools').classList.remove('open');
  }

  function bind() {
    document.querySelectorAll('[data-game]').forEach((button) => button.addEventListener('click', () => switchGame(button.dataset.game)));
    document.querySelectorAll('[data-tool]').forEach((button) => button.addEventListener('click', () => { setMode(button.dataset.tool); closeMobileTools(); }));
    document.querySelectorAll('[data-mobile-tool]').forEach((button) => button.addEventListener('click', () => {
      const mode = button.dataset.mobileTool;
      if (mode === 'tools') {
        $('mapTools').classList.toggle('open');
        return;
      }
      setMode(mode);
    }));
    document.querySelectorAll('[data-marker]').forEach((button) => button.addEventListener('click', () => {
      state.markerType = button.dataset.marker;
      setMode('marker');
      document.querySelectorAll('[data-marker]').forEach((entry) => entry.classList.toggle('active', entry === button));
      closeMobileTools();
    }));
    document.querySelectorAll('[data-team]').forEach((button) => button.addEventListener('click', () => {
      state.team = button.dataset.team;
      document.querySelectorAll('[data-team]').forEach((entry) => entry.classList.toggle('active', entry === button));
    }));
    document.querySelectorAll('[data-role]').forEach((button) => button.addEventListener('click', () => {
      state.role = button.dataset.role;
      setMode('role');
      document.querySelectorAll('[data-role]').forEach((entry) => entry.classList.toggle('active', entry === button));
      closeMobileTools();
    }));

    viewport.addEventListener('pointerdown', startPointer);
    viewport.addEventListener('pointermove', movePointer);
    viewport.addEventListener('pointerup', endPointer);
    viewport.addEventListener('pointercancel', endPointer);
    viewport.addEventListener('wheel', (event) => {
      event.preventDefault();
      zoomAt(state.scale * Math.exp(-event.deltaY * 0.0015), event.clientX, event.clientY);
    }, { passive: false });
    viewport.addEventListener('dblclick', (event) => zoomAt(state.scale * 1.45, event.clientX, event.clientY));

    $('zoomIn').addEventListener('click', () => {
      const rect = viewport.getBoundingClientRect();
      zoomAt(state.scale * 1.2, rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
    $('zoomOut').addEventListener('click', () => {
      const rect = viewport.getBoundingClientRect();
      zoomAt(state.scale / 1.2, rect.left + rect.width / 2, rect.top + rect.height / 2);
    });
    $('fitMap').addEventListener('click', fitMap);
    $('undo').addEventListener('click', undo);
    $('redo').addEventListener('click', redo);
    $('deleteSelected').addEventListener('click', removeSelected);
    $('clearAll').addEventListener('click', clearAll);
    $('saveCloud').addEventListener('click', () => saveCloud().catch((error) => window.MOBAHub.toast(error.message)));
    $('exportMap').addEventListener('click', exportPng);
    $('planTitle').addEventListener('input', saveLocal);
    $('planNote').addEventListener('input', saveLocal);

    window.addEventListener('keydown', (event) => {
      const tag = document.activeElement?.tagName;
      if (event.code === 'Space' && !event.repeat && !['INPUT', 'TEXTAREA', 'SELECT'].includes(tag)) {
        spaceHeld = true;
        event.preventDefault();
      }
      if ((event.key === 'Delete' || event.key === 'Backspace') && !['INPUT', 'TEXTAREA'].includes(tag)) removeSelected();
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'z') {
        event.preventDefault();
        event.shiftKey ? redo() : undo();
      }
    });
    window.addEventListener('keyup', (event) => { if (event.code === 'Space') spaceHeld = false; });
    window.addEventListener('resize', () => {
      clearTimeout(bind.resizeTimer);
      bind.resizeTimer = setTimeout(fitMap, 150);
    });
  }

  window.MOBAHub.onReady(() => {
    loadLocal();
    const requestedGame = new URLSearchParams(location.search).get('game');
    if (MAPS[requestedGame]) state.game = requestedGame;
    bind();
    switchGame(state.game, false);
    setMode(state.mode);
    render();
    requestAnimationFrame(fitMap);
  });
})();
