(() => {
  const $ = (id) => document.getElementById(id);
  const board = $('mapBoard');
  const markerLayer = $('markerLayer');
  const overlayLayer = $('overlayLayer');
  const routeLayer = $('routeLayer');
  const mapTitle = $('mapTitle');
  const mapNote = $('mapNote');
  const markerCount = $('markerCount');
  const roleCount = $('roleCount');
  const routeCount = $('routeCount');
  const mapHeading = $('mapPlanHeading');
  const mapGameLabel = $('mapGameLabel');
  const mapBoardShort = $('mapBoardShort');
  const markerSummary = $('markerSummary');
  const toggleLabels = $('toggleLabels');
  const toggleObjectives = $('toggleObjectives');
  const toggleRoutes = $('toggleRoutes');
  const blueRoleGrid = $('blueRoleGrid');
  const redRoleGrid = $('redRoleGrid');
  const blueTeamLabel = $('blueTeamLabel');
  const redTeamLabel = $('redTeamLabel');

  let activeGame = 'hok';
  let activeMode = 'select';
  let selectedTool = { kind: 'strategy', id: 'attack' };
  let markers = [];
  let routes = [];
  let routeDraft = null;
  let dragging = null;
  let suppressNextBoardClick = false;
  let suppressMarkerClick = false;

  const strategyInfo = {
    attack: { label: 'Attack', icon: '⚔', color: '#ff6b6b' },
    defend: { label: 'Defend', icon: '◆', color: '#74c0fc' },
    rotate: { label: 'Rotate', icon: '↻', color: '#ffe28a' },
    objective: { label: 'Objective', icon: '★', color: '#f5c451' },
    danger: { label: 'Danger', icon: '!', color: '#f06595' },
    vision: { label: 'Vision', icon: '◉', color: '#51cf66' }
  };

  const gameInfo = {
    hok: {
      label: 'Honor of Kings',
      title: 'HOK Hero Gorge',
      short: 'HOK',
      boardSrc: '/assets/maps/hok-board.png',
      roles: [
        { code: 'C', label: 'Clash Lane' },
        { code: 'J', label: 'Jungle' },
        { code: 'M', label: 'Mid Lane' },
        { code: 'F', label: 'Farm Lane' },
        { code: 'R', label: 'Roam' }
      ],
      roleHint: 'Clash / Jungle / Mid / Farm / Roam',
      lanes: [
        { text: 'Clash', x: 16, y: 18 },
        { text: 'Mid', x: 48, y: 52 },
        { text: 'Farm', x: 83, y: 79 }
      ],
      objectives: [
        { text: 'Overlord', x: 49, y: 16 },
        { text: 'Tyrant', x: 59, y: 62 },
        { text: 'Blue Buff', x: 35, y: 35 },
        { text: 'Red Buff', x: 64, y: 58 }
      ],
      presets: {
        early: {
          note: 'Roam controls river vision before first Tyrant.',
          markers: [
            { kind:'role', team:'blue', code:'J', label:'Jungle', x:33, y:47 },
            { kind:'role', team:'blue', code:'R', label:'Roam', x:42, y:50 },
            { kind:'role', team:'red', code:'J', label:'Jungle', x:67, y:48 },
            { kind:'strategy', id:'objective', x:59, y:62 },
            { kind:'strategy', id:'vision', x:50, y:50 },
            { kind:'strategy', id:'danger', x:65, y:54 }
          ],
          routes: [
            { team:'blue', from:{x:28,y:64}, to:{x:52,y:50} },
            { team:'blue', from:{x:36,y:46}, to:{x:58,y:61} },
            { team:'red', from:{x:74,y:36}, to:{x:62,y:53} }
          ]
        },
        mid: {
          note: 'Secure mid priority and control river entrances.',
          markers: [
            { kind:'role', team:'blue', code:'M', label:'Mid Lane', x:45, y:50 },
            { kind:'role', team:'blue', code:'R', label:'Roam', x:40, y:55 },
            { kind:'role', team:'red', code:'M', label:'Mid Lane', x:56, y:48 },
            { kind:'strategy', id:'vision', x:39, y:43 },
            { kind:'strategy', id:'vision', x:61, y:57 },
            { kind:'strategy', id:'defend', x:50, y:50 }
          ],
          routes: [
            { team:'blue', from:{x:28,y:35}, to:{x:48,y:48} },
            { team:'red', from:{x:72,y:65}, to:{x:54,y:52} }
          ]
        },
        siege: {
          note: 'Group after objective and pressure side entrance.',
          markers: [
            { kind:'role', team:'blue', code:'C', label:'Clash Lane', x:55, y:28 },
            { kind:'role', team:'blue', code:'M', label:'Mid Lane', x:57, y:44 },
            { kind:'role', team:'blue', code:'F', label:'Farm Lane', x:62, y:57 },
            { kind:'strategy', id:'attack', x:74, y:36 },
            { kind:'strategy', id:'objective', x:49, y:16 }
          ],
          routes: [
            { team:'blue', from:{x:49,y:16}, to:{x:73,y:31} },
            { team:'blue', from:{x:57,y:44}, to:{x:74,y:36} }
          ]
        },
        split: {
          note: 'One side pressure while four members hold objective vision.',
          markers: [
            { kind:'role', team:'blue', code:'C', label:'Clash Lane', x:22, y:18 },
            { kind:'role', team:'blue', code:'R', label:'Roam', x:50, y:54 },
            { kind:'strategy', id:'rotate', x:31, y:27 },
            { kind:'strategy', id:'vision', x:55, y:58 },
            { kind:'strategy', id:'defend', x:48, y:62 }
          ],
          routes: [
            { team:'blue', from:{x:22,y:18}, to:{x:38,y:26} },
            { team:'blue', from:{x:43,y:64}, to:{x:58,y:62} }
          ]
        }
      }
    },
    mlbb: {
      label: 'Mobile Legends',
      title: 'MLBB Land of Dawn',
      short: 'MLBB',
      boardSrc: '/assets/maps/mlbb-board.png',
      roles: [
        { code: 'E', label: 'EXP Lane' },
        { code: 'J', label: 'Jungle' },
        { code: 'M', label: 'Mid Lane' },
        { code: 'G', label: 'Gold Lane' },
        { code: 'R', label: 'Roam' }
      ],
      roleHint: 'EXP / Jungle / Mid / Gold / Roam',
      lanes: [
        { text: 'EXP', x: 14, y: 16 },
        { text: 'Mid', x: 50, y: 50 },
        { text: 'Gold', x: 86, y: 84 }
      ],
      objectives: [
        { text: 'Turtle', x: 33, y: 28 },
        { text: 'Lord', x: 68, y: 58 },
        { text: 'Blue Buff', x: 30, y: 67 },
        { text: 'Red Buff', x: 71, y: 77 }
      ],
      presets: {
        early: {
          note: 'Secure Turtle side vision and mid priority.',
          markers: [
            { kind:'role', team:'blue', code:'J', label:'Jungle', x:34, y:54 },
            { kind:'role', team:'blue', code:'R', label:'Roam', x:42, y:48 },
            { kind:'role', team:'red', code:'J', label:'Jungle', x:62, y:42 },
            { kind:'strategy', id:'objective', x:33, y:28 },
            { kind:'strategy', id:'vision', x:46, y:40 },
            { kind:'strategy', id:'danger', x:58, y:38 }
          ],
          routes: [
            { team:'blue', from:{x:28,y:70}, to:{x:42,y:47} },
            { team:'blue', from:{x:34,y:54}, to:{x:33,y:28} },
            { team:'red', from:{x:74,y:20}, to:{x:58,y:39} }
          ]
        },
        mid: {
          note: 'River vision + jungle entrance control.',
          markers: [
            { kind:'role', team:'blue', code:'M', label:'Mid Lane', x:45, y:52 },
            { kind:'role', team:'red', code:'M', label:'Mid Lane', x:55, y:48 },
            { kind:'strategy', id:'vision', x:42, y:45 },
            { kind:'strategy', id:'vision', x:58, y:55 },
            { kind:'strategy', id:'defend', x:50, y:50 }
          ],
          routes: [
            { team:'blue', from:{x:23,y:32}, to:{x:45,y:52} },
            { team:'red', from:{x:78,y:66}, to:{x:55,y:48} }
          ]
        },
        siege: {
          note: 'Take Lord then pressure mid and gold lane turret.',
          markers: [
            { kind:'role', team:'blue', code:'J', label:'Jungle', x:60, y:62 },
            { kind:'role', team:'blue', code:'M', label:'Mid Lane', x:56, y:52 },
            { kind:'role', team:'blue', code:'G', label:'Gold Lane', x:67, y:71 },
            { kind:'strategy', id:'objective', x:68, y:58 },
            { kind:'strategy', id:'attack', x:75, y:50 }
          ],
          routes: [
            { team:'blue', from:{x:68,y:58}, to:{x:75,y:50} },
            { team:'blue', from:{x:67,y:71}, to:{x:83,y:78} }
          ]
        },
        split: {
          note: 'EXP side pressure while four members hold Lord river.',
          markers: [
            { kind:'role', team:'blue', code:'E', label:'EXP Lane', x:19, y:18 },
            { kind:'role', team:'blue', code:'R', label:'Roam', x:55, y:59 },
            { kind:'strategy', id:'rotate', x:29, y:28 },
            { kind:'strategy', id:'vision', x:59, y:61 },
            { kind:'strategy', id:'defend', x:52, y:63 }
          ],
          routes: [
            { team:'blue', from:{x:19,y:18}, to:{x:30,y:31} },
            { team:'blue', from:{x:46,y:66}, to:{x:65,y:61} }
          ]
        }
      }
    }
  };

  function showToast(message){
    const toast = $('toast');
    if(!toast) return;
    toast.hidden = false;
    toast.textContent = message;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toast.hidden = true; }, 2200);
  }

  function save(){
    try {
      localStorage.setItem('hciMapPlanV35', JSON.stringify({
        activeGame,
        activeMode,
        selectedTool,
        markers,
        routes,
        title: mapTitle?.value || '',
        note: mapNote?.value || '',
        showLabels: !!toggleLabels?.checked,
        showObjectives: !!toggleObjectives?.checked,
        showRoutes: toggleRoutes ? !!toggleRoutes.checked : true
      }));
    } catch (_e) {}
  }

  function normalizeOldMarkers(list){
    return (list || []).filter((m) => Number.isFinite(m.x) && Number.isFinite(m.y)).map((m) => {
      if(m.kind) return m;
      return { kind: 'strategy', id: m.id || m.type || 'attack', x: m.x, y: m.y };
    }).filter((m) => m.kind === 'role' || (m.kind === 'strategy' && strategyInfo[m.id]));
  }

  function load(){
    try {
      const raw = localStorage.getItem('hciMapPlanV35') || localStorage.getItem('hciMapPlanV2') || localStorage.getItem('hciMapPlanV1');
      if(!raw) return;
      const data = JSON.parse(raw);
      if(gameInfo[data.activeGame]) activeGame = data.activeGame;
      if(data.selectedTool && data.selectedTool.kind){ selectedTool = data.selectedTool; }
      if(data.activeMode) activeMode = data.activeMode === 'route' ? 'route' : 'select';
      if(Array.isArray(data.markers)) markers = normalizeOldMarkers(data.markers).slice(0, 140);
      if(Array.isArray(data.routes)) routes = data.routes.filter((r) => r.from && r.to && Number.isFinite(r.from.x) && Number.isFinite(r.from.y) && Number.isFinite(r.to.x) && Number.isFinite(r.to.y)).slice(0, 60);
      if(mapTitle && data.title) mapTitle.value = String(data.title).slice(0, 44);
      if(mapNote && data.note) mapNote.value = String(data.note).slice(0, 80);
      if(toggleLabels && typeof data.showLabels === 'boolean') toggleLabels.checked = data.showLabels;
      if(toggleObjectives && typeof data.showObjectives === 'boolean') toggleObjectives.checked = data.showObjectives;
      if(toggleRoutes && typeof data.showRoutes === 'boolean') toggleRoutes.checked = data.showRoutes;
    } catch (_e) {}
  }

  function renderRoleChips(){
    const info = gameInfo[activeGame];
    if(!info || !blueRoleGrid || !redRoleGrid) return;
    blueRoleGrid.replaceChildren();
    redRoleGrid.replaceChildren();
    if(blueTeamLabel) blueTeamLabel.textContent = info.roleHint;
    if(redTeamLabel) redTeamLabel.textContent = info.roleHint;

    const buildChip = (team, role) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'role-chip';
      btn.dataset.team = team;
      btn.dataset.code = role.code;
      btn.dataset.label = role.label;
      btn.innerHTML = `<span class="role-code">${role.code}</span><span><strong>${role.label}</strong><small>${team === 'blue' ? 'Blue Team' : 'Red Team'}</small></span>`;
      const isActive = selectedTool.kind === 'role' && selectedTool.team === team && selectedTool.code === role.code;
      btn.classList.toggle('active', isActive);
      btn.addEventListener('click', () => {
        selectedTool = { kind: 'role', team, code: role.code, label: role.label };
        activeMode = 'select';
        updateToolHighlights();
        save();
      });
      return btn;
    };

    info.roles.forEach((role) => blueRoleGrid.appendChild(buildChip('blue', role)));
    info.roles.forEach((role) => redRoleGrid.appendChild(buildChip('red', role)));
  }

  function updateToolHighlights(){
    document.querySelectorAll('.marker-tool').forEach((btn) => {
      btn.classList.toggle('active', selectedTool.kind === 'strategy' && btn.dataset.type === selectedTool.id);
    });
    document.querySelectorAll('.role-chip').forEach((btn) => {
      btn.classList.toggle('active', selectedTool.kind === 'role' && btn.dataset.team === selectedTool.team && btn.dataset.code === selectedTool.code);
    });
    document.querySelectorAll('.mode-tool').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === activeMode);
    });
    if(board){
      board.classList.toggle('route-mode', activeMode === 'route');
    }
  }

  function updateGame(){
    const info = gameInfo[activeGame] || gameInfo.hok;
    if(board){
      board.classList.toggle('hok-map', activeGame === 'hok');
      board.classList.toggle('mlbb-map', activeGame === 'mlbb');
    }
    document.querySelectorAll('.map-game-tab').forEach((btn) => btn.classList.toggle('active', btn.dataset.game === activeGame));
    if(mapGameLabel) mapGameLabel.textContent = info.label;
    if(mapBoardShort) mapBoardShort.textContent = info.short;
    renderRoleChips();
    renderOverlays();
  }

  function renderOverlays(){
    if(!overlayLayer) return;
    overlayLayer.replaceChildren();
    const info = gameInfo[activeGame] || gameInfo.hok;
    if(activeMode === 'route' && routeDraft){
      const hint = document.createElement('div');
      hint.className = 'map-route-hint';
      hint.textContent = 'Tap route end point';
      overlayLayer.appendChild(hint);
    }
    if(toggleLabels?.checked){
      info.lanes.forEach((lane) => {
        const el = document.createElement('div');
        el.className = 'map-helper-label lane';
        el.textContent = lane.text;
        el.style.left = `${lane.x}%`;
        el.style.top = `${lane.y}%`;
        overlayLayer.appendChild(el);
      });
    }
    if(toggleObjectives?.checked){
      info.objectives.forEach((obj) => {
        const el = document.createElement('div');
        el.className = 'map-helper-label objective';
        el.textContent = obj.text;
        el.style.left = `${obj.x}%`;
        el.style.top = `${obj.y}%`;
        overlayLayer.appendChild(el);
      });
    }
  }

  function routeClass(route){
    if(route.team === 'blue') return 'route-blue';
    if(route.team === 'red') return 'route-red';
    return 'route-neutral';
  }

  function renderRoutes(){
    if(!routeLayer) return;
    routeLayer.replaceChildren();
    if(toggleRoutes && !toggleRoutes.checked) {
      if(routeCount) routeCount.textContent = String(routes.length);
      return;
    }
    routes.forEach((route, index) => {
      const dx = route.to.x - route.from.x;
      const dy = route.to.y - route.from.y;
      const mx = (route.from.x + route.to.x) / 2;
      const my = (route.from.y + route.to.y) / 2;
      const bend = route.bend || (index % 2 ? -5 : 5);
      const cx = mx - dy * 0.08;
      const cy = my + dx * 0.08 + bend;
      const path = document.createElementNS('http://www.w3.org/2000/svg','path');
      path.setAttribute('d', `M ${route.from.x} ${route.from.y} Q ${cx} ${cy} ${route.to.x} ${route.to.y}`);
      path.setAttribute('class', routeClass(route));
      path.setAttribute('stroke-width', route.width || '1.1');
      path.setAttribute('stroke-dasharray', route.dash || '2.4 1.6');
      routeLayer.appendChild(path);

      const label = document.createElement('div');
      label.className = 'map-route-label';
      label.textContent = route.team === 'red' ? 'Red route' : route.team === 'blue' ? 'Blue route' : 'Route';
      label.style.left = `${mx}%`;
      label.style.top = `${my}%`;
      overlayLayer?.appendChild(label);
    });
    if(routeCount) routeCount.textContent = String(routes.length);
  }

  function summarizeCounts(){
    const strategyCounts = Object.keys(strategyInfo).reduce((acc, key) => { acc[key] = 0; return acc; }, {});
    const roleCounts = { blue: 0, red: 0 };
    markers.forEach((m) => {
      if(m.kind === 'strategy' && strategyCounts[m.id] !== undefined) strategyCounts[m.id] += 1;
      if(m.kind === 'role') roleCounts[m.team] += 1;
    });
    if(markerCount) markerCount.textContent = String(Object.values(strategyCounts).reduce((a,b)=>a+b,0));
    if(roleCount) roleCount.textContent = String(roleCounts.blue + roleCounts.red);
    if(routeCount) routeCount.textContent = String(routes.length);
    if(!markerSummary) return;
    markerSummary.innerHTML = `
      <strong>Current planner summary</strong>
      <div class="count-grid">
        <div class="count-chip"><span><b style="background:${strategyInfo.attack.color}"></b>Attack</span><span>${strategyCounts.attack}</span></div>
        <div class="count-chip"><span><b style="background:${strategyInfo.defend.color}"></b>Defend</span><span>${strategyCounts.defend}</span></div>
        <div class="count-chip"><span><b style="background:${strategyInfo.rotate.color}"></b>Rotate</span><span>${strategyCounts.rotate}</span></div>
        <div class="count-chip"><span><b style="background:${strategyInfo.objective.color}"></b>Objective</span><span>${strategyCounts.objective}</span></div>
        <div class="count-chip"><span><b style="background:${strategyInfo.danger.color}"></b>Danger</span><span>${strategyCounts.danger}</span></div>
        <div class="count-chip"><span><b style="background:${strategyInfo.vision.color}"></b>Vision</span><span>${strategyCounts.vision}</span></div>
        <div class="count-chip"><span><b style="background:#2563eb"></b>Blue roles</span><span>${roleCounts.blue}</span></div>
        <div class="count-chip"><span><b style="background:#ef4444"></b>Red roles</span><span>${roleCounts.red}</span></div>
        <div class="count-chip"><span><b style="background:#f5c451"></b>Routes</span><span>${routes.length}</span></div>
      </div>
    `;
  }

  function renderMarkers(){
    if(!markerLayer) return;
    const frag = document.createDocumentFragment();
    markers.forEach((marker, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `map-marker ${marker.kind === 'role' ? 'role-marker' : 'strategy-marker'}`;
      btn.dataset.index = String(index);
      btn.style.left = `${marker.x}%`;
      btn.style.top = `${marker.y}%`;
      if(marker.kind === 'strategy'){
        const info = strategyInfo[marker.id] || strategyInfo.attack;
        btn.style.setProperty('--marker-color', info.color);
        btn.title = `${info.label} - drag to move, tap to remove`;
        btn.innerHTML = `<span class="marker-core">${info.icon}</span><small>${index + 1}</small>`;
      } else {
        btn.dataset.team = marker.team;
        btn.title = `${marker.team === 'blue' ? 'Blue' : 'Red'} ${marker.label} - drag to move, tap to remove`;
        btn.innerHTML = `<span class="marker-core">${marker.code}</span><small>${marker.team === 'blue' ? 'B' : 'R'}</small>`;
      }
      frag.appendChild(btn);
    });
    markerLayer.replaceChildren(frag);
  }

  function render(){
    if(mapHeading) mapHeading.textContent = mapTitle?.value?.trim() || 'HCI Map Plan';
    renderOverlays();
    renderRoutes();
    renderMarkers();
    summarizeCounts();
    save();
  }

  function getPointFromEvent(event){
    if(!board) return null;
    const rect = board.getBoundingClientRect();
    const clientX = event.clientX ?? (event.touches && event.touches[0]?.clientX);
    const clientY = event.clientY ?? (event.touches && event.touches[0]?.clientY);
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    if(!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100) return null;
    return { x: Math.max(1, Math.min(99, x)), y: Math.max(1, Math.min(99, y)) };
  }

  function addAtPoint(point){
    if(selectedTool.kind === 'strategy'){
      markers.push({ kind: 'strategy', id: selectedTool.id, x: point.x, y: point.y });
    } else if(selectedTool.kind === 'role'){
      markers.push({ kind: 'role', team: selectedTool.team, code: selectedTool.code, label: selectedTool.label, x: point.x, y: point.y });
    }
  }

  function currentRouteTeam(){
    if(selectedTool.kind === 'role') return selectedTool.team;
    if(selectedTool.kind === 'strategy' && (selectedTool.id === 'danger' || selectedTool.id === 'attack')) return 'red';
    if(selectedTool.kind === 'strategy' && (selectedTool.id === 'defend' || selectedTool.id === 'vision')) return 'blue';
    return 'neutral';
  }

  function handleBoardClick(event){
    if(!board || event.target.closest('.map-marker')) return;
    if(suppressNextBoardClick){ suppressNextBoardClick = false; return; }
    const point = getPointFromEvent(event);
    if(!point) return;
    if(activeMode === 'route'){
      if(!routeDraft){
        routeDraft = point;
        render();
        showToast('Route start set. Tap the destination.');
        return;
      }
      routes.push({ team: currentRouteTeam(), from: routeDraft, to: point });
      routeDraft = null;
      render();
      return;
    }
    addAtPoint(point);
    render();
  }

  function startDrag(event){
    const btn = event.target.closest('.map-marker');
    if(!btn || !board) return;
    if(activeMode === 'route') return;
    const index = Number(btn.dataset.index);
    if(!Number.isFinite(index)) return;
    event.preventDefault();
    event.stopPropagation();
    const p = getPointFromEvent(event);
    dragging = {
      index,
      moved: false,
      startX: p?.x ?? markers[index].x,
      startY: p?.y ?? markers[index].y,
      pointerId: event.pointerId
    };
    btn.classList.add('is-dragging');
    try { btn.setPointerCapture(event.pointerId); } catch (_e) {}
  }

  function moveDrag(event){
    if(!dragging) return;
    const point = getPointFromEvent(event);
    if(!point) return;
    const marker = markers[dragging.index];
    if(!marker) return;
    if(Math.abs(point.x - dragging.startX) > 0.5 || Math.abs(point.y - dragging.startY) > 0.5) dragging.moved = true;
    marker.x = point.x;
    marker.y = point.y;
    const el = markerLayer?.querySelector(`[data-index="${dragging.index}"]`);
    if(el){
      el.style.left = `${point.x}%`;
      el.style.top = `${point.y}%`;
    }
  }

  function endDrag(event){
    if(!dragging) return;
    const index = dragging.index;
    const moved = dragging.moved;
    const el = markerLayer?.querySelector(`[data-index="${index}"]`);
    if(el) el.classList.remove('is-dragging');
    try { el?.releasePointerCapture(event.pointerId); } catch (_e) {}
    dragging = null;
    if(moved){
      suppressNextBoardClick = true;
      suppressMarkerClick = true;
      setTimeout(() => { suppressMarkerClick = false; }, 250);
      save();
      showToast('Marker moved.');
    }
  }

  function removeMarker(event){
    const btn = event.target.closest('.map-marker');
    if(!btn) return;
    if(dragging || suppressMarkerClick){ event.stopPropagation(); return; }
    event.stopPropagation();
    const index = Number(btn.dataset.index);
    if(Number.isFinite(index)){
      markers.splice(index, 1);
      render();
    }
  }

  function applyPreset(name){
    const preset = gameInfo[activeGame]?.presets?.[name];
    if(!preset) return;
    if(!confirm('Apply this preset? Current markers and routes will be replaced.')) return;
    markers = normalizeOldMarkers(preset.markers || []);
    routes = (preset.routes || []).map((r) => ({ ...r, from:{...r.from}, to:{...r.to} }));
    if(mapNote) mapNote.value = preset.note || '';
    routeDraft = null;
    render();
    showToast('Preset applied.');
  }

  function bind(){
    document.querySelectorAll('.map-game-tab').forEach((btn) => btn.addEventListener('click', () => {
      activeGame = btn.dataset.game;
      routeDraft = null;
      updateGame();
      updateToolHighlights();
      render();
    }));
    document.querySelectorAll('.marker-tool').forEach((btn) => btn.addEventListener('click', () => {
      selectedTool = { kind: 'strategy', id: btn.dataset.type };
      activeMode = 'select';
      routeDraft = null;
      updateToolHighlights();
      render();
    }));
    document.querySelectorAll('.mode-tool').forEach((btn) => btn.addEventListener('click', () => {
      activeMode = btn.dataset.mode === 'route' ? 'route' : 'select';
      routeDraft = null;
      updateToolHighlights();
      render();
      showToast(activeMode === 'route' ? 'Route mode: tap start and destination.' : 'Select mode: tap to place, drag to move.');
    }));
    document.querySelectorAll('.preset-btn').forEach((btn) => btn.addEventListener('click', () => applyPreset(btn.dataset.preset)));
    if(board){
      board.addEventListener('click', handleBoardClick);
    }
    if(markerLayer){
      markerLayer.addEventListener('click', removeMarker, true);
      markerLayer.addEventListener('pointerdown', startDrag, true);
      markerLayer.addEventListener('pointermove', moveDrag, true);
      markerLayer.addEventListener('pointerup', endDrag, true);
      markerLayer.addEventListener('pointercancel', endDrag, true);
    }
    $('undoMarkerBtn')?.addEventListener('click', () => {
      if(routeDraft){ routeDraft = null; render(); return; }
      if(routes.length){ routes.pop(); render(); return; }
      markers.pop();
      render();
    });
    $('clearMarkersBtn')?.addEventListener('click', () => {
      if(confirm('Clear all map markers and routes?')){ markers = []; routes = []; routeDraft = null; render(); }
    });
    $('copyMapBtn')?.addEventListener('click', copySummary);
    $('downloadMapBtn')?.addEventListener('click', downloadPng);
    mapTitle?.addEventListener('input', render);
    mapNote?.addEventListener('input', save);
    toggleLabels?.addEventListener('change', render);
    toggleObjectives?.addEventListener('change', render);
    toggleRoutes?.addEventListener('change', render);
  }

  async function copySummary(){
    const info = gameInfo[activeGame] || gameInfo.hok;
    const lines = [
      `HCI MOBA Map Plan (${info.label})`,
      `Title: ${mapTitle?.value || 'HCI Map Plan'}`,
      mapNote?.value ? `Note: ${mapNote.value}` : '',
      `Strategy markers: ${markers.filter((m) => m.kind === 'strategy').length}`,
      `Role markers: ${markers.filter((m) => m.kind === 'role').length}`,
      `Routes: ${routes.length}`,
      ...markers.map((m, i) => m.kind === 'strategy'
        ? `${i+1}. ${strategyInfo[m.id]?.label || m.id} at ${m.x.toFixed(1)}%, ${m.y.toFixed(1)}%`
        : `${i+1}. ${m.team === 'blue' ? 'Blue' : 'Red'} ${m.label} (${m.code}) at ${m.x.toFixed(1)}%, ${m.y.toFixed(1)}%`),
      ...routes.map((r, i) => `Route ${i+1}. ${r.team} from ${r.from.x.toFixed(1)}%,${r.from.y.toFixed(1)}% to ${r.to.x.toFixed(1)}%,${r.to.y.toFixed(1)}%`)
    ].filter(Boolean);
    try {
      await navigator.clipboard.writeText(lines.join('\n'));
      showToast('Map summary copied.');
    } catch (_e) {
      showToast('Could not copy summary.');
    }
  }

  function drawRoundedRect(ctx, x, y, w, h, r){
    ctx.beginPath();
    ctx.moveTo(x+r, y);
    ctx.arcTo(x+w, y, x+w, y+h, r);
    ctx.arcTo(x+w, y+h, x, y+h, r);
    ctx.arcTo(x, y+h, x, y, r);
    ctx.arcTo(x, y, x+w, y, r);
    ctx.closePath();
  }

  function loadImage(src){
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function drawCover(ctx, img, x, y, w, h){
    const scale = Math.max(w / img.width, h / img.height);
    const dw = img.width * scale;
    const dh = img.height * scale;
    const dx = x + (w - dw) / 2;
    const dy = y + (h - dh) / 2;
    ctx.drawImage(img, dx, dy, dw, dh);
  }

  function drawRouteCanvas(ctx, route, padding, boardTop, boardW, boardH, index){
    const sx = padding + (route.from.x / 100) * boardW;
    const sy = boardTop + (route.from.y / 100) * boardH;
    const ex = padding + (route.to.x / 100) * boardW;
    const ey = boardTop + (route.to.y / 100) * boardH;
    const dx = ex - sx;
    const dy = ey - sy;
    const mx = (sx + ex) / 2;
    const my = (sy + ey) / 2;
    const cx = mx - dy * .08;
    const cy = my + dx * .08 + ((index % 2 ? -1 : 1) * 28);
    const color = route.team === 'red' ? '#ff6b6b' : route.team === 'blue' ? '#4dabf7' : '#f5c451';
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    ctx.setLineDash([18, 12]);
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.quadraticCurveTo(cx, cy, ex, ey);
    ctx.stroke();
    ctx.setLineDash([]);
    const angle = Math.atan2(ey - cy, ex - cx);
    ctx.translate(ex, ey);
    ctx.rotate(angle);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-22, -12);
    ctx.lineTo(-17, 0);
    ctx.lineTo(-22, 12);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }

  async function downloadPng(){
    const info = gameInfo[activeGame] || gameInfo.hok;
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = activeGame === 'mlbb' ? 1600 : 1000;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#05111b';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    const padding = 36;
    const boardTop = 120;
    const boardW = canvas.width - padding * 2;
    const boardH = canvas.height - boardTop - padding;

    drawRoundedRect(ctx, padding, boardTop, boardW, boardH, 28);
    ctx.save();
    ctx.clip();
    try {
      const img = await loadImage(info.boardSrc);
      drawCover(ctx, img, padding, boardTop, boardW, boardH);
    } catch (_e) {
      ctx.fillStyle = '#0b1724';
      ctx.fillRect(padding, boardTop, boardW, boardH);
    }
    const fade = ctx.createLinearGradient(0, boardTop, 0, boardTop + boardH);
    fade.addColorStop(0, 'rgba(4,11,17,.12)');
    fade.addColorStop(1, 'rgba(4,11,17,.24)');
    ctx.fillStyle = fade;
    ctx.fillRect(padding, boardTop, boardW, boardH);
    ctx.restore();

    ctx.fillStyle = '#ffe3a2';
    ctx.font = '900 24px system-ui';
    ctx.fillText(`${info.short} · HCI MOBA MAP SIMULATOR`, padding, 42);
    ctx.fillStyle = '#eef6ff';
    ctx.font = '900 42px system-ui';
    ctx.fillText((mapTitle?.value || 'HCI Map Plan').slice(0, 44), padding, 82);
    ctx.fillStyle = '#a8bacf';
    ctx.font = '700 22px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText((mapNote?.value || 'Map strategy plan').slice(0, 80), canvas.width - padding, 46);
    ctx.textAlign = 'left';

    const drawLabel = (text, xPct, yPct, type) => {
      const x = padding + (xPct / 100) * boardW;
      const y = boardTop + (yPct / 100) * boardH;
      ctx.font = '900 18px system-ui';
      const textW = ctx.measureText(text).width + 28;
      const h = 36;
      ctx.fillStyle = 'rgba(4,11,17,.68)';
      ctx.strokeStyle = type === 'objective' ? 'rgba(245,196,81,.32)' : 'rgba(116,192,252,.24)';
      drawRoundedRect(ctx, x - textW / 2, y - h / 2, textW, h, 18);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = type === 'objective' ? '#ffe3a2' : '#eef6ff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text, x, y + 1);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    };

    if(toggleLabels?.checked){ info.lanes.forEach((lane) => drawLabel(lane.text, lane.x, lane.y, 'lane')); }
    if(toggleObjectives?.checked){ info.objectives.forEach((obj) => drawLabel(obj.text, obj.x, obj.y, 'objective')); }
    if(!toggleRoutes || toggleRoutes.checked){ routes.forEach((r, i) => drawRouteCanvas(ctx, r, padding, boardTop, boardW, boardH, i)); }

    markers.forEach((m, idx) => {
      const x = padding + (m.x / 100) * boardW;
      const y = boardTop + (m.y / 100) * boardH;
      const isRole = m.kind === 'role';
      const color = isRole ? (m.team === 'blue' ? '#2563eb' : '#ef4444') : (strategyInfo[m.id]?.color || '#f5c451');
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.arc(x, y, isRole ? 26 : 24, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = isRole ? 'rgba(255,255,255,.42)' : 'rgba(4,11,17,.85)';
      ctx.lineWidth = 4;
      ctx.stroke();
      ctx.fillStyle = isRole ? '#ffffff' : '#081018';
      ctx.font = `900 ${isRole ? 24 : 28}px system-ui`;
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(isRole ? m.code : (strategyInfo[m.id]?.icon || '•'), x, y);
      ctx.fillStyle = '#eef6ff';
      ctx.font = '900 16px system-ui';
      ctx.fillText(isRole ? (m.team === 'blue' ? 'B' : 'R') : String(idx + 1), x + 24, y - 20);
    });

    const link = document.createElement('a');
    link.download = `hci-map-plan-${info.short.toLowerCase()}-${Date.now()}.png`;
    link.href = canvas.toDataURL('image/png');
    link.click();
    showToast('Map plan PNG downloaded.');
  }

  load();
  bind();
  updateGame();
  updateToolHighlights();
  render();
})();
