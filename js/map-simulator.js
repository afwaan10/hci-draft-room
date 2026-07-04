(() => {
  'use strict';

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
  const toggleVisionRange = $('toggleVisionRange');
  const lineArrowToggle = $('lineArrowToggle');
  const routeList = $('routeList');
  const blueRoleGrid = $('blueRoleGrid');
  const redRoleGrid = $('redRoleGrid');
  const blueTeamLabel = $('blueTeamLabel');
  const redTeamLabel = $('redTeamLabel');

  const strategyInfo = {
    attack: { label: 'Attack', icon: '⚔', color: '#ff6b6b' },
    defend: { label: 'Defend', icon: '◆', color: '#74c0fc' },
    rotate: { label: 'Rotate', icon: '↻', color: '#ffe28a' },
    objective: { label: 'Objective', icon: '★', color: '#f5c451' },
    danger: { label: 'Danger', icon: '!', color: '#f06595' },
    vision: { label: 'Vision', icon: '◉', color: '#51cf66' },
    note: { label: 'Note', icon: '✎', color: '#b197fc' }
  };

  const routeColors = {
    blue: '#4dabf7',
    red: '#ff6b6b',
    neutral: '#f5c451'
  };

  const gameInfo = {
    hok: {
      label: 'Honor of Kings',
      title: 'HOK Hero Gorge',
      short: 'HOK',
      boardSrc: '/assets/maps/hok-real-map.webp',
      roles: [
        { code: 'C', label: 'Clash Lane' },
        { code: 'J', label: 'Jungle' },
        { code: 'M', label: 'Mid Lane' },
        { code: 'F', label: 'Farm Lane' },
        { code: 'R', label: 'Roam' }
      ],
      roleHint: 'Clash / Jungle / Mid / Farm / Roam',
      lanes: [
        { text: 'Clash', x: 22, y: 17 },
        { text: 'Mid', x: 51, y: 52 },
        { text: 'Farm', x: 79, y: 81 }
      ],
      objectives: [
        { text: 'Overlord', x: 39, y: 20 },
        { text: 'Tyrant', x: 66, y: 58 }
      ],
      presets: {
        early: {
          note: 'Roam controls river vision before first Tyrant.',
          markers: [
            { kind:'role', team:'blue', code:'J', label:'Jungle', x:35, y:56 },
            { kind:'role', team:'blue', code:'R', label:'Roam', x:44, y:52 },
            { kind:'role', team:'red', code:'J', label:'Jungle', x:67, y:45 },
            { kind:'strategy', id:'objective', x:66, y:58 },
            { kind:'strategy', id:'vision', x:51, y:50 },
            { kind:'strategy', id:'danger', x:63, y:49 }
          ],
          routes: [
            { team:'blue', style:'dashed', arrow:true, points:[{x:30,y:69},{x:39,y:58},{x:52,y:51}] },
            { team:'blue', style:'solid', arrow:true, points:[{x:35,y:56},{x:48,y:58},{x:66,y:58}] },
            { team:'red', style:'dashed', arrow:true, points:[{x:77,y:33},{x:70,y:41},{x:63,y:49}] }
          ]
        },
        mid: {
          note: 'Secure mid priority and control river entrances.',
          markers: [
            { kind:'role', team:'blue', code:'M', label:'Mid Lane', x:44, y:52 },
            { kind:'role', team:'blue', code:'R', label:'Roam', x:42, y:58 },
            { kind:'role', team:'red', code:'M', label:'Mid Lane', x:57, y:47 },
            { kind:'strategy', id:'vision', x:43, y:43 },
            { kind:'strategy', id:'vision', x:59, y:57 },
            { kind:'strategy', id:'defend', x:50, y:51 }
          ],
          routes: [
            { team:'blue', style:'dashed', arrow:true, points:[{x:28,y:35},{x:38,y:43},{x:48,y:50}] },
            { team:'red', style:'dashed', arrow:true, points:[{x:73,y:65},{x:64,y:57},{x:55,y:49}] }
          ]
        },
        siege: {
          note: 'Group after objective and pressure the next side entrance.',
          markers: [
            { kind:'role', team:'blue', code:'C', label:'Clash Lane', x:54, y:28 },
            { kind:'role', team:'blue', code:'M', label:'Mid Lane', x:58, y:43 },
            { kind:'role', team:'blue', code:'F', label:'Farm Lane', x:63, y:61 },
            { kind:'strategy', id:'attack', x:76, y:35 },
            { kind:'strategy', id:'objective', x:39, y:20 }
          ],
          routes: [
            { team:'blue', style:'solid', arrow:true, points:[{x:39,y:20},{x:50,y:26},{x:62,y:30},{x:76,y:35}] },
            { team:'blue', style:'dashed', arrow:true, points:[{x:58,y:43},{x:67,y:39},{x:76,y:35}] }
          ]
        },
        split: {
          note: 'One side pressures while four members hold objective vision.',
          markers: [
            { kind:'role', team:'blue', code:'C', label:'Clash Lane', x:21, y:19 },
            { kind:'role', team:'blue', code:'R', label:'Roam', x:52, y:55 },
            { kind:'strategy', id:'rotate', x:32, y:28 },
            { kind:'strategy', id:'vision', x:56, y:58 },
            { kind:'strategy', id:'defend', x:48, y:61 }
          ],
          routes: [
            { team:'blue', style:'solid', arrow:true, points:[{x:21,y:19},{x:27,y:23},{x:33,y:29},{x:40,y:34}] },
            { team:'blue', style:'dashed', arrow:true, points:[{x:43,y:65},{x:50,y:62},{x:58,y:60}] }
          ]
        }
      }
    },
    mlbb: {
      label: 'Mobile Legends',
      title: 'MLBB Land of Dawn',
      short: 'MLBB',
      boardSrc: '/assets/maps/mlbb-real-map.jpg',
      roles: [
        { code: 'E', label: 'EXP Lane' },
        { code: 'J', label: 'Jungle' },
        { code: 'M', label: 'Mid Lane' },
        { code: 'G', label: 'Gold Lane' },
        { code: 'R', label: 'Roam' }
      ],
      roleHint: 'EXP / Jungle / Mid / Gold / Roam',
      lanes: [
        { text: 'EXP', x: 14, y: 15 },
        { text: 'Mid', x: 50, y: 50 },
        { text: 'Gold', x: 86, y: 85 }
      ],
      objectives: [
        { text: 'Turtle', x: 31, y: 31 },
        { text: 'Lord', x: 69, y: 68 }
      ],
      presets: {
        early: {
          note: 'Secure Turtle side vision and mid priority.',
          markers: [
            { kind:'role', team:'blue', code:'J', label:'Jungle', x:35, y:56 },
            { kind:'role', team:'blue', code:'R', label:'Roam', x:43, y:49 },
            { kind:'role', team:'red', code:'J', label:'Jungle', x:63, y:43 },
            { kind:'strategy', id:'objective', x:31, y:31 },
            { kind:'strategy', id:'vision', x:46, y:41 },
            { kind:'strategy', id:'danger', x:58, y:39 }
          ],
          routes: [
            { team:'blue', style:'dashed', arrow:true, points:[{x:28,y:71},{x:36,y:60},{x:43,y:49}] },
            { team:'blue', style:'solid', arrow:true, points:[{x:35,y:56},{x:34,y:44},{x:31,y:31}] },
            { team:'red', style:'dashed', arrow:true, points:[{x:75,y:20},{x:68,y:31},{x:58,y:39}] }
          ]
        },
        mid: {
          note: 'River vision and jungle entrance control.',
          markers: [
            { kind:'role', team:'blue', code:'M', label:'Mid Lane', x:45, y:52 },
            { kind:'role', team:'red', code:'M', label:'Mid Lane', x:56, y:48 },
            { kind:'strategy', id:'vision', x:42, y:45 },
            { kind:'strategy', id:'vision', x:58, y:55 },
            { kind:'strategy', id:'defend', x:50, y:50 }
          ],
          routes: [
            { team:'blue', style:'dashed', arrow:true, points:[{x:23,y:32},{x:34,y:42},{x:45,y:52}] },
            { team:'red', style:'dashed', arrow:true, points:[{x:78,y:66},{x:67,y:57},{x:56,y:48}] }
          ]
        },
        siege: {
          note: 'Take Lord then pressure mid and Gold Lane turret.',
          markers: [
            { kind:'role', team:'blue', code:'J', label:'Jungle', x:60, y:64 },
            { kind:'role', team:'blue', code:'M', label:'Mid Lane', x:56, y:52 },
            { kind:'role', team:'blue', code:'G', label:'Gold Lane', x:68, y:73 },
            { kind:'strategy', id:'objective', x:69, y:68 },
            { kind:'strategy', id:'attack', x:77, y:51 }
          ],
          routes: [
            { team:'blue', style:'solid', arrow:true, points:[{x:69,y:68},{x:72,y:60},{x:77,y:51}] },
            { team:'blue', style:'dashed', arrow:true, points:[{x:68,y:73},{x:77,y:78},{x:85,y:84}] }
          ]
        },
        split: {
          note: 'EXP side pressure while four members hold Lord river.',
          markers: [
            { kind:'role', team:'blue', code:'E', label:'EXP Lane', x:18, y:18 },
            { kind:'role', team:'blue', code:'R', label:'Roam', x:55, y:60 },
            { kind:'strategy', id:'rotate', x:29, y:28 },
            { kind:'strategy', id:'vision', x:59, y:61 },
            { kind:'strategy', id:'defend', x:52, y:63 }
          ],
          routes: [
            { team:'blue', style:'solid', arrow:true, points:[{x:18,y:18},{x:24,y:24},{x:30,y:31}] },
            { team:'blue', style:'dashed', arrow:true, points:[{x:46,y:67},{x:55,y:64},{x:66,y:61}] }
          ]
        }
      }
    }
  };

  let activeGame = 'hok';
  let activeMode = 'select';
  let selectedTool = { kind: 'strategy', id: 'attack' };
  let routeSettings = { team: 'blue', style: 'dashed', arrow: true };
  let routeDraft = [];
  let selectedRouteIndex = null;
  let draggingMarker = null;
  let draggingRoutePoint = null;
  let suppressNextBoardClick = false;
  let suppressMarkerClick = false;
  const plans = {
    hok: { markers: [], routes: [], title: 'HCI Map Plan', note: '' },
    mlbb: { markers: [], routes: [], title: 'HCI Map Plan', note: '' }
  };

  const currentPlan = () => plans[activeGame];

  function showToast(message){
    const toast = $('toast');
    if(!toast) return;
    toast.hidden = false;
    toast.textContent = message;
    clearTimeout(showToast._t);
    showToast._t = setTimeout(() => { toast.hidden = true; }, 2200);
  }

  function clone(value){
    return JSON.parse(JSON.stringify(value));
  }

  function normalizeMarkers(list){
    return (list || [])
      .filter((m) => Number.isFinite(m.x) && Number.isFinite(m.y))
      .map((m) => m.kind ? m : ({ kind:'strategy', id:m.id || m.type || 'attack', x:m.x, y:m.y }))
      .filter((m) => m.kind === 'role' || (m.kind === 'strategy' && strategyInfo[m.id]))
      .slice(0, 160);
  }

  function normalizeRoutes(list){
    return (list || []).map((r) => {
      const points = Array.isArray(r.points)
        ? r.points
        : (r.from && r.to ? [r.from, r.to] : []);
      return {
        team: routeColors[r.team] ? r.team : 'neutral',
        style: r.style === 'solid' ? 'solid' : 'dashed',
        arrow: r.arrow !== false,
        points: points.filter((p) => Number.isFinite(p.x) && Number.isFinite(p.y)).map((p) => ({x:p.x,y:p.y}))
      };
    }).filter((r) => r.points.length >= 2).slice(0, 80);
  }

  function persistCurrentFields(){
    const plan = currentPlan();
    if(mapTitle) plan.title = mapTitle.value || 'HCI Map Plan';
    if(mapNote) plan.note = mapNote.value || '';
  }

  function save(){
    persistCurrentFields();
    try {
      localStorage.setItem('hciMapPlanV37', JSON.stringify({
        activeGame,
        activeMode,
        selectedTool,
        routeSettings,
        plans,
        showLabels: !!toggleLabels?.checked,
        showObjectives: !!toggleObjectives?.checked,
        showRoutes: toggleRoutes ? !!toggleRoutes.checked : true,
        showVisionRange: toggleVisionRange ? !!toggleVisionRange.checked : true
      }));
    } catch (_e) {}
  }

  function load(){
    try {
      const raw37 = localStorage.getItem('hciMapPlanV37') || localStorage.getItem('hciMapPlanV36');
      if(raw37){
        const data = JSON.parse(raw37);
        if(gameInfo[data.activeGame]) activeGame = data.activeGame;
        if(data.selectedTool?.kind) selectedTool = data.selectedTool;
        if(data.routeSettings) routeSettings = {
          team: routeColors[data.routeSettings.team] ? data.routeSettings.team : 'blue',
          style: data.routeSettings.style === 'solid' ? 'solid' : 'dashed',
          arrow: data.routeSettings.arrow !== false
        };
        ['hok','mlbb'].forEach((game) => {
          const source = data.plans?.[game];
          if(!source) return;
          plans[game] = {
            markers: normalizeMarkers(source.markers),
            routes: normalizeRoutes(source.routes),
            title: String(source.title || 'HCI Map Plan').slice(0,44),
            note: String(source.note || '').slice(0,80)
          };
        });
        if(toggleLabels && typeof data.showLabels === 'boolean') toggleLabels.checked = data.showLabels;
        if(toggleObjectives && typeof data.showObjectives === 'boolean') toggleObjectives.checked = data.showObjectives;
        if(toggleRoutes && typeof data.showRoutes === 'boolean') toggleRoutes.checked = data.showRoutes;
        if(toggleVisionRange && typeof data.showVisionRange === 'boolean') toggleVisionRange.checked = data.showVisionRange;
        return;
      }

      // Migrate v35 or older data into the game that was active at that time.
      const rawOld = localStorage.getItem('hciMapPlanV35') || localStorage.getItem('hciMapPlanV2') || localStorage.getItem('hciMapPlanV1');
      if(!rawOld) return;
      const data = JSON.parse(rawOld);
      if(gameInfo[data.activeGame]) activeGame = data.activeGame;
      plans[activeGame] = {
        markers: normalizeMarkers(data.markers),
        routes: normalizeRoutes(data.routes),
        title: String(data.title || 'HCI Map Plan').slice(0,44),
        note: String(data.note || '').slice(0,80)
      };
      if(data.selectedTool?.kind) selectedTool = data.selectedTool;
      if(toggleLabels && typeof data.showLabels === 'boolean') toggleLabels.checked = data.showLabels;
      if(toggleObjectives && typeof data.showObjectives === 'boolean') toggleObjectives.checked = data.showObjectives;
      if(toggleRoutes && typeof data.showRoutes === 'boolean') toggleRoutes.checked = data.showRoutes;
      if(toggleVisionRange && typeof data.showVisionRange === 'boolean') toggleVisionRange.checked = data.showVisionRange;
    } catch (_e) {}
  }

  function loadPlanFields(){
    const plan = currentPlan();
    if(mapTitle) mapTitle.value = plan.title || 'HCI Map Plan';
    if(mapNote) mapNote.value = plan.note || '';
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
      btn.innerHTML = `<span class="role-code">${role.code}</span><span><strong>${role.label}</strong><small>${team === 'blue' ? 'Blue Team' : 'Red Team'}</small></span>`;
      btn.addEventListener('click', () => {
        selectedTool = { kind:'role', team, code:role.code, label:role.label };
        activeMode = 'select';
        routeDraft = [];
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
      btn.classList.toggle('active', selectedTool.kind === 'strategy' && btn.dataset.type === selectedTool.id && activeMode === 'select');
    });
    document.querySelectorAll('.role-chip').forEach((btn) => {
      btn.classList.toggle('active', selectedTool.kind === 'role' && btn.dataset.team === selectedTool.team && btn.dataset.code === selectedTool.code && activeMode === 'select');
    });
    document.querySelectorAll('.mode-tool').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mode === activeMode);
    });
    document.querySelectorAll('.line-team-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.team === routeSettings.team));
    document.querySelectorAll('.line-style-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.style === routeSettings.style));
    if(lineArrowToggle) lineArrowToggle.checked = routeSettings.arrow;
    if(board) board.classList.toggle('route-mode', activeMode === 'route');
  }

  function updateGame(){
    const info = gameInfo[activeGame];
    if(board){
      board.classList.toggle('hok-map', activeGame === 'hok');
      board.classList.toggle('mlbb-map', activeGame === 'mlbb');
    }
    document.querySelectorAll('.map-game-tab').forEach((btn) => btn.classList.toggle('active', btn.dataset.game === activeGame));
    if(mapGameLabel) mapGameLabel.textContent = info.label;
    if(mapBoardShort) mapBoardShort.textContent = info.short;
    renderRoleChips();
    loadPlanFields();
  }

  function renderOverlays(){
    if(!overlayLayer) return;
    overlayLayer.replaceChildren();
    const info = gameInfo[activeGame];

    if(activeMode === 'route'){
      const hint = document.createElement('div');
      hint.className = 'map-route-hint';
      hint.textContent = routeDraft.length
        ? `${routeDraft.length} point${routeDraft.length > 1 ? 's' : ''} · tap next point or Finish Line`
        : 'Tap the first route point';
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

    if(activeMode === 'route' && selectedRouteIndex !== null){
      const route = currentPlan().routes[selectedRouteIndex];
      route?.points.forEach((point, pointIndex) => {
        const handle = document.createElement('button');
        handle.type = 'button';
        handle.className = 'route-point-handle';
        handle.dataset.routeIndex = String(selectedRouteIndex);
        handle.dataset.pointIndex = String(pointIndex);
        handle.style.left = `${point.x}%`;
        handle.style.top = `${point.y}%`;
        handle.title = 'Drag route point';
        handle.innerHTML = `<span>${pointIndex + 1}</span>`;
        overlayLayer.appendChild(handle);
      });
    }
  }

  function ensureRouteDefs(){
    if(!routeLayer) return;
    const ns = 'http://www.w3.org/2000/svg';
    const defs = document.createElementNS(ns, 'defs');
    Object.entries(routeColors).forEach(([team, color]) => {
      const marker = document.createElementNS(ns, 'marker');
      marker.setAttribute('id', `arrow-${team}`);
      marker.setAttribute('markerWidth', '6');
      marker.setAttribute('markerHeight', '6');
      marker.setAttribute('refX', '5');
      marker.setAttribute('refY', '3');
      marker.setAttribute('orient', 'auto');
      marker.setAttribute('markerUnits', 'strokeWidth');
      const path = document.createElementNS(ns, 'path');
      path.setAttribute('d', 'M 0 0 L 6 3 L 0 6 z');
      path.setAttribute('fill', color);
      marker.appendChild(path);
      defs.appendChild(marker);
    });
    routeLayer.appendChild(defs);
  }

  function routePath(points){
    if(!points?.length) return '';
    return `M ${points.map((p) => `${p.x} ${p.y}`).join(' L ')}`;
  }

  function appendRouteSvg(route, index, isDraft = false){
    if(!routeLayer || route.points.length < 2) return;
    const ns = 'http://www.w3.org/2000/svg';
    const path = document.createElementNS(ns, 'path');
    path.setAttribute('d', routePath(route.points));
    path.setAttribute('class', `route-path route-${route.team}${isDraft ? ' route-ghost' : ''}${selectedRouteIndex === index ? ' selected-route' : ''}`);
    path.setAttribute('stroke-width', selectedRouteIndex === index ? '1.55' : '1.15');
    path.setAttribute('vector-effect', 'non-scaling-stroke');
    if(route.style === 'dashed') path.setAttribute('stroke-dasharray', '2.4 1.6');
    if(route.arrow && !isDraft) path.setAttribute('marker-end', `url(#arrow-${route.team})`);
    routeLayer.appendChild(path);
  }

  function renderRoutes(){
    if(!routeLayer) return;
    routeLayer.replaceChildren();
    ensureRouteDefs();
    const plan = currentPlan();
    if(!toggleRoutes || toggleRoutes.checked){
      plan.routes.forEach((route, index) => appendRouteSvg(route, index, false));
      if(routeDraft.length >= 2){
        appendRouteSvg({ ...routeSettings, points:routeDraft }, -1, true);
      }
    }
    if(routeCount) routeCount.textContent = String(plan.routes.length);
  }

  function renderRouteList(){
    if(!routeList) return;
    routeList.replaceChildren();
    const routes = currentPlan().routes;
    if(!routes.length){
      const empty = document.createElement('div');
      empty.className = 'route-list-empty';
      empty.textContent = 'No route lines yet.';
      routeList.appendChild(empty);
      return;
    }
    routes.forEach((route, index) => {
      const row = document.createElement('div');
      row.className = `route-list-item${selectedRouteIndex === index ? ' active' : ''}`;
      row.dataset.routeIndex = String(index);
      row.innerHTML = `
        <button type="button" class="route-select-btn" data-route-select="${index}">
          <i style="background:${routeColors[route.team]}"></i>
          <span>Line ${index + 1}<small>${route.team} · ${route.style} · ${route.points.length} pts${route.arrow ? ' · arrow' : ''}</small></span>
        </button>
        <button type="button" class="route-delete-btn" data-route-delete="${index}" aria-label="Delete line ${index + 1}">×</button>
      `;
      routeList.appendChild(row);
    });
  }

  function summarizeCounts(){
    const strategyCounts = Object.keys(strategyInfo).reduce((acc, key) => { acc[key] = 0; return acc; }, {});
    const roleCounts = { blue:0, red:0 };
    const plan = currentPlan();
    plan.markers.forEach((m) => {
      if(m.kind === 'strategy' && strategyCounts[m.id] !== undefined) strategyCounts[m.id] += 1;
      if(m.kind === 'role') roleCounts[m.team] += 1;
    });
    if(markerCount) markerCount.textContent = String(Object.values(strategyCounts).reduce((a,b) => a+b,0));
    if(roleCount) roleCount.textContent = String(roleCounts.blue + roleCounts.red);
    if(routeCount) routeCount.textContent = String(plan.routes.length);
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
        <div class="count-chip"><span><b style="background:${strategyInfo.note.color}"></b>Note</span><span>${strategyCounts.note}</span></div>
        <div class="count-chip"><span><b style="background:#2563eb"></b>Blue roles</span><span>${roleCounts.blue}</span></div>
        <div class="count-chip"><span><b style="background:#ef4444"></b>Red roles</span><span>${roleCounts.red}</span></div>
        <div class="count-chip"><span><b style="background:#f5c451"></b>Lines</span><span>${plan.routes.length}</span></div>
      </div>
    `;
  }

  function renderMarkers(){
    if(!markerLayer) return;
    const frag = document.createDocumentFragment();
    currentPlan().markers.forEach((marker, index) => {
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `map-marker ${marker.kind === 'role' ? 'role-marker' : 'strategy-marker'}`;
      btn.dataset.index = String(index);
      btn.style.left = `${marker.x}%`;
      btn.style.top = `${marker.y}%`;
      if(marker.kind === 'strategy'){
        const info = strategyInfo[marker.id] || strategyInfo.attack;
        btn.dataset.strategy = marker.id;
        btn.style.setProperty('--marker-color', info.color);
        btn.title = `${info.label} - drag to move, tap to remove`;
        if(marker.id === 'note'){
          btn.classList.add('note-marker');
          btn.innerHTML = `<span class="marker-note-text">${escapeHtml(marker.text || 'Note')}</span><small>${index + 1}</small>`;
        } else {
          btn.innerHTML = `<span class="marker-core">${info.icon}</span><small>${index + 1}</small>`;
        }
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
    board?.classList.toggle('hide-vision-range', toggleVisionRange ? !toggleVisionRange.checked : false);
    if(mapHeading) mapHeading.textContent = mapTitle?.value?.trim() || currentPlan().title || 'HCI Map Plan';
    renderOverlays();
    renderRoutes();
    renderMarkers();
    renderRouteList();
    summarizeCounts();
    updateToolHighlights();
    save();
  }

  function getPointFromEvent(event){
    if(!board) return null;
    const rect = board.getBoundingClientRect();
    const clientX = event.clientX ?? event.touches?.[0]?.clientX;
    const clientY = event.clientY ?? event.touches?.[0]?.clientY;
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;
    if(!Number.isFinite(x) || !Number.isFinite(y) || x < 0 || x > 100 || y < 0 || y > 100) return null;
    return { x:Math.max(1,Math.min(99,x)), y:Math.max(1,Math.min(99,y)) };
  }

  function addMarkerAt(point){
    const markers = currentPlan().markers;
    if(selectedTool.kind === 'strategy'){
      if(selectedTool.id === 'note'){
        const text = prompt('Note text for this map point:', 'Push wave first');
        if(!text || !text.trim()) return;
        markers.push({ kind:'strategy', id:'note', text:text.trim().slice(0, 48), x:point.x, y:point.y });
      } else {
        markers.push({ kind:'strategy', id:selectedTool.id, x:point.x, y:point.y });
      }
    } else if(selectedTool.kind === 'role'){
      markers.push({ kind:'role', team:selectedTool.team, code:selectedTool.code, label:selectedTool.label, x:point.x, y:point.y });
    }
  }

  function handleBoardClick(event){
    if(!board || event.target.closest('.map-marker') || event.target.closest('.route-point-handle')) return;
    if(suppressNextBoardClick){ suppressNextBoardClick = false; return; }
    const point = getPointFromEvent(event);
    if(!point) return;
    if(activeMode === 'route'){
      routeDraft.push(point);
      render();
      if(routeDraft.length === 1) showToast('First point added. Continue route, then Finish Line.');
      return;
    }
    addMarkerAt(point);
    render();
  }

  function finishRoute(){
    if(routeDraft.length < 2){
      showToast('Add at least 2 route points.');
      return;
    }
    currentPlan().routes.push({ ...routeSettings, points:clone(routeDraft) });
    selectedRouteIndex = currentPlan().routes.length - 1;
    routeDraft = [];
    render();
    showToast('Route line saved.');
  }

  function cancelRouteDraft(){
    routeDraft = [];
    render();
    showToast('Route draft cancelled.');
  }

  function reverseRoute(){
    if(routeDraft.length >= 2){
      routeDraft.reverse();
      render();
      showToast('Draft direction reversed.');
      return;
    }
    const route = selectedRouteIndex !== null ? currentPlan().routes[selectedRouteIndex] : null;
    if(!route){ showToast('Select a saved line first.'); return; }
    route.points.reverse();
    render();
    showToast('Line direction reversed.');
  }

  function selectRoute(index){
    const route = currentPlan().routes[index];
    if(!route) return;
    selectedRouteIndex = index;
    routeSettings = { team:route.team, style:route.style, arrow:route.arrow !== false };
    activeMode = 'route';
    routeDraft = [];
    render();
    showToast(`Line ${index + 1} selected. Drag its numbered points to edit.`);
  }

  function deleteRoute(index){
    const routes = currentPlan().routes;
    if(!routes[index]) return;
    routes.splice(index, 1);
    if(selectedRouteIndex === index) selectedRouteIndex = null;
    else if(selectedRouteIndex !== null && selectedRouteIndex > index) selectedRouteIndex -= 1;
    render();
  }

  function applyRouteSettingsToSelected(){
    const route = selectedRouteIndex !== null ? currentPlan().routes[selectedRouteIndex] : null;
    if(route){
      route.team = routeSettings.team;
      route.style = routeSettings.style;
      route.arrow = routeSettings.arrow;
    }
  }

  function startMarkerDrag(event){
    const btn = event.target.closest('.map-marker');
    if(!btn || activeMode === 'route') return;
    const index = Number(btn.dataset.index);
    if(!Number.isFinite(index)) return;
    event.preventDefault();
    event.stopPropagation();
    const point = getPointFromEvent(event);
    const marker = currentPlan().markers[index];
    draggingMarker = {
      index,
      moved:false,
      startX:point?.x ?? marker.x,
      startY:point?.y ?? marker.y,
      pointerId:event.pointerId
    };
    btn.classList.add('is-dragging');
    try { btn.setPointerCapture(event.pointerId); } catch (_e) {}
  }

  function moveMarkerDrag(event){
    if(!draggingMarker) return;
    const point = getPointFromEvent(event);
    if(!point) return;
    const marker = currentPlan().markers[draggingMarker.index];
    if(!marker) return;
    if(Math.abs(point.x-draggingMarker.startX)>.5 || Math.abs(point.y-draggingMarker.startY)>.5) draggingMarker.moved = true;
    marker.x = point.x;
    marker.y = point.y;
    const el = markerLayer?.querySelector(`[data-index="${draggingMarker.index}"]`);
    if(el){ el.style.left = `${point.x}%`; el.style.top = `${point.y}%`; }
  }

  function endMarkerDrag(event){
    if(!draggingMarker) return;
    const { index, moved } = draggingMarker;
    const el = markerLayer?.querySelector(`[data-index="${index}"]`);
    el?.classList.remove('is-dragging');
    try { el?.releasePointerCapture(event.pointerId); } catch (_e) {}
    draggingMarker = null;
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
    if(draggingMarker || suppressMarkerClick){ event.stopPropagation(); return; }
    event.stopPropagation();
    const index = Number(btn.dataset.index);
    if(Number.isFinite(index)){
      currentPlan().markers.splice(index, 1);
      render();
    }
  }

  function startRoutePointDrag(event){
    const handle = event.target.closest('.route-point-handle');
    if(!handle) return;
    const routeIndex = Number(handle.dataset.routeIndex);
    const pointIndex = Number(handle.dataset.pointIndex);
    if(!Number.isFinite(routeIndex) || !Number.isFinite(pointIndex)) return;
    event.preventDefault();
    event.stopPropagation();
    draggingRoutePoint = { routeIndex, pointIndex, pointerId:event.pointerId };
    handle.classList.add('is-dragging');
    try { handle.setPointerCapture(event.pointerId); } catch (_e) {}
  }

  function moveRoutePointDrag(event){
    if(!draggingRoutePoint) return;
    const point = getPointFromEvent(event);
    if(!point) return;
    const route = currentPlan().routes[draggingRoutePoint.routeIndex];
    if(!route?.points[draggingRoutePoint.pointIndex]) return;
    route.points[draggingRoutePoint.pointIndex] = point;
    const handle = overlayLayer?.querySelector(`[data-route-index="${draggingRoutePoint.routeIndex}"][data-point-index="${draggingRoutePoint.pointIndex}"]`);
    if(handle){ handle.style.left = `${point.x}%`; handle.style.top = `${point.y}%`; }
    renderRoutes();
  }

  function endRoutePointDrag(event){
    if(!draggingRoutePoint) return;
    const handle = overlayLayer?.querySelector(`[data-route-index="${draggingRoutePoint.routeIndex}"][data-point-index="${draggingRoutePoint.pointIndex}"]`);
    handle?.classList.remove('is-dragging');
    try { handle?.releasePointerCapture(event.pointerId); } catch (_e) {}
    draggingRoutePoint = null;
    save();
    render();
    showToast('Route point moved.');
  }

  function applyPreset(name){
    const preset = gameInfo[activeGame]?.presets?.[name];
    if(!preset) return;
    if(!confirm('Apply this preset? Current markers and lines for this game will be replaced.')) return;
    const plan = currentPlan();
    plan.markers = normalizeMarkers(clone(preset.markers));
    plan.routes = normalizeRoutes(clone(preset.routes));
    plan.note = preset.note || '';
    if(mapNote) mapNote.value = plan.note;
    routeDraft = [];
    selectedRouteIndex = null;
    render();
    showToast('Preset applied.');
  }

  function switchGame(nextGame){
    if(!gameInfo[nextGame] || nextGame === activeGame) return;
    persistCurrentFields();
    activeGame = nextGame;
    routeDraft = [];
    selectedRouteIndex = null;
    updateGame();
    render();
  }


  function closeMobileSheets(){
    document.body.classList.remove('sheet-tools-open','sheet-roles-open');
    const backdrop = $('mobileSheetBackdrop');
    if(backdrop) backdrop.hidden = true;
  }

  function openMobileSheet(kind){
    closeMobileSheets();
    const backdrop = $('mobileSheetBackdrop');
    if(backdrop) backdrop.hidden = false;
    document.body.classList.add(kind === 'roles' ? 'sheet-roles-open' : 'sheet-tools-open');
  }

  function setMobileToolbarActive(action){
    document.querySelectorAll('[data-mobile-action]').forEach((btn) => {
      btn.classList.toggle('active', btn.dataset.mobileAction === action);
    });
  }

  function handleMobileAction(action){
    if(action === 'move'){
      activeMode = 'select';
      routeDraft = [];
      selectedRouteIndex = null;
      closeMobileSheets();
      setMobileToolbarActive('move');
      render();
      showToast('Move mode active. Drag markers or route points.');
      return;
    }
    if(action === 'line'){
      activeMode = 'route';
      openMobileSheet('tools');
      setMobileToolbarActive('line');
      render();
      setTimeout(() => document.querySelector('.line-tool-panel')?.scrollIntoView({behavior:'smooth', block:'start'}), 80);
      showToast('Line mode active. Configure line, then tap map points.');
      return;
    }
    if(action === 'markers'){
      activeMode = 'select';
      openMobileSheet('tools');
      setMobileToolbarActive('markers');
      render();
      setTimeout(() => document.querySelector('.marker-palette')?.scrollIntoView({behavior:'smooth', block:'center'}), 80);
      return;
    }
    if(action === 'roles'){
      activeMode = 'select';
      openMobileSheet('roles');
      setMobileToolbarActive('roles');
      render();
      return;
    }
    openMobileSheet('tools');
    setMobileToolbarActive('tools');
  }

  function bind(){
    document.querySelectorAll('[data-mobile-action]').forEach((btn) => btn.addEventListener('click', () => handleMobileAction(btn.dataset.mobileAction)));
    document.querySelectorAll('[data-close-sheet]').forEach((btn) => btn.addEventListener('click', closeMobileSheets));
    $('mobileSheetBackdrop')?.addEventListener('click', closeMobileSheets);
    window.addEventListener('keydown', (event) => { if(event.key === 'Escape') closeMobileSheets(); });

    document.querySelectorAll('.map-game-tab').forEach((btn) => btn.addEventListener('click', () => switchGame(btn.dataset.game)));

    document.querySelectorAll('.marker-tool').forEach((btn) => btn.addEventListener('click', () => {
      selectedTool = { kind:'strategy', id:btn.dataset.type };
      activeMode = 'select';
      routeDraft = [];
      selectedRouteIndex = null;
      setMobileToolbarActive('markers');
      render();
    }));

    document.querySelectorAll('.mode-tool').forEach((btn) => btn.addEventListener('click', () => {
      activeMode = btn.dataset.mode === 'route' ? 'route' : 'select';
      if(activeMode !== 'route'){
        routeDraft = [];
        selectedRouteIndex = null;
      }
      setMobileToolbarActive(activeMode === 'route' ? 'line' : 'move');
      render();
      showToast(activeMode === 'route' ? 'Line mode: tap multiple map points, then Finish Line.' : 'Select mode: tap to place markers, drag to move.');
    }));

    document.querySelectorAll('.line-team-btn').forEach((btn) => btn.addEventListener('click', () => {
      routeSettings.team = btn.dataset.team;
      applyRouteSettingsToSelected();
      render();
    }));

    document.querySelectorAll('.line-style-btn').forEach((btn) => btn.addEventListener('click', () => {
      routeSettings.style = btn.dataset.style === 'solid' ? 'solid' : 'dashed';
      applyRouteSettingsToSelected();
      render();
    }));

    lineArrowToggle?.addEventListener('change', () => {
      routeSettings.arrow = !!lineArrowToggle.checked;
      applyRouteSettingsToSelected();
      render();
    });

    $('finishRouteBtn')?.addEventListener('click', finishRoute);
    $('cancelRouteBtn')?.addEventListener('click', cancelRouteDraft);
    $('reverseRouteBtn')?.addEventListener('click', reverseRoute);
    $('clearRoutesBtn')?.addEventListener('click', () => {
      if(!currentPlan().routes.length && !routeDraft.length){ showToast('No lines to clear.'); return; }
      if(confirm('Clear all route lines for this game? Markers will stay.')){
        currentPlan().routes = [];
        routeDraft = [];
        selectedRouteIndex = null;
        render();
      }
    });

    routeList?.addEventListener('click', (event) => {
      const deleteBtn = event.target.closest('[data-route-delete]');
      if(deleteBtn){ deleteRoute(Number(deleteBtn.dataset.routeDelete)); return; }
      const selectBtn = event.target.closest('[data-route-select]');
      if(selectBtn) selectRoute(Number(selectBtn.dataset.routeSelect));
    });

    document.querySelectorAll('.preset-btn').forEach((btn) => btn.addEventListener('click', () => applyPreset(btn.dataset.preset)));

    board?.addEventListener('click', handleBoardClick);

    if(markerLayer){
      markerLayer.addEventListener('click', removeMarker, true);
      markerLayer.addEventListener('pointerdown', startMarkerDrag, true);
      markerLayer.addEventListener('pointermove', moveMarkerDrag, true);
      markerLayer.addEventListener('pointerup', endMarkerDrag, true);
      markerLayer.addEventListener('pointercancel', endMarkerDrag, true);
    }

    if(overlayLayer){
      overlayLayer.addEventListener('pointerdown', startRoutePointDrag, true);
      overlayLayer.addEventListener('pointermove', moveRoutePointDrag, true);
      overlayLayer.addEventListener('pointerup', endRoutePointDrag, true);
      overlayLayer.addEventListener('pointercancel', endRoutePointDrag, true);
    }

    $('undoMarkerBtn')?.addEventListener('click', () => {
      if(routeDraft.length){ routeDraft.pop(); render(); return; }
      if(selectedRouteIndex !== null){ selectedRouteIndex = null; render(); return; }
      const plan = currentPlan();
      if(plan.routes.length){ plan.routes.pop(); render(); return; }
      plan.markers.pop();
      render();
    });

    $('clearMarkersBtn')?.addEventListener('click', () => {
      const plan = currentPlan();
      if(confirm('Clear all markers and lines for this game?')){
        plan.markers = [];
        plan.routes = [];
        routeDraft = [];
        selectedRouteIndex = null;
        render();
      }
    });

    $('copyMapBtn')?.addEventListener('click', copySummary);
    $('downloadMapBtn')?.addEventListener('click', downloadPng);
    mapTitle?.addEventListener('input', render);
    mapNote?.addEventListener('input', save);
    toggleLabels?.addEventListener('change', render);
    toggleObjectives?.addEventListener('change', render);
    toggleRoutes?.addEventListener('change', render);
    toggleVisionRange?.addEventListener('change', render);
  }

  async function copySummary(){
    const info = gameInfo[activeGame];
    const plan = currentPlan();
    const lines = [
      `HCI MOBA Map Plan (${info.label})`,
      `Title: ${plan.title || 'HCI Map Plan'}`,
      plan.note ? `Note: ${plan.note}` : '',
      `Strategy markers: ${plan.markers.filter((m) => m.kind === 'strategy').length}`,
      `Role markers: ${plan.markers.filter((m) => m.kind === 'role').length}`,
      `Route lines: ${plan.routes.length}`,
      ...plan.markers.map((m, i) => m.kind === 'strategy'
        ? `${i+1}. ${strategyInfo[m.id]?.label || m.id}${m.id === 'note' && m.text ? `: ${m.text}` : ''} at ${m.x.toFixed(1)}%, ${m.y.toFixed(1)}%`
        : `${i+1}. ${m.team === 'blue' ? 'Blue' : 'Red'} ${m.label} (${m.code}) at ${m.x.toFixed(1)}%, ${m.y.toFixed(1)}%`),
      ...plan.routes.map((r, i) => `Line ${i+1}. ${r.team}, ${r.style}, ${r.arrow ? 'arrow' : 'no arrow'}, ${r.points.length} points`)
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
    ctx.moveTo(x+r,y);
    ctx.arcTo(x+w,y,x+w,y+h,r);
    ctx.arcTo(x+w,y+h,x,y+h,r);
    ctx.arcTo(x,y+h,x,y,r);
    ctx.arcTo(x,y,x+w,y,r);
    ctx.closePath();
  }

  function loadImage(src){
    return new Promise((resolve,reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = reject;
      img.src = src;
    });
  }

  function drawRouteCanvas(ctx, route, boardX, boardY, boardW, boardH){
    if(route.points.length < 2) return;
    const points = route.points.map((p) => ({ x:boardX + (p.x/100)*boardW, y:boardY + (p.y/100)*boardH }));
    const color = routeColors[route.team] || routeColors.neutral;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = 8;
    if(route.style === 'dashed') ctx.setLineDash([18,12]);
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    points.slice(1).forEach((p) => ctx.lineTo(p.x,p.y));
    ctx.stroke();
    ctx.setLineDash([]);
    if(route.arrow){
      const end = points[points.length-1];
      const prev = points[points.length-2];
      const angle = Math.atan2(end.y-prev.y,end.x-prev.x);
      ctx.translate(end.x,end.y);
      ctx.rotate(angle);
      ctx.fillStyle = color;
      ctx.beginPath();
      ctx.moveTo(0,0);
      ctx.lineTo(-24,-13);
      ctx.lineTo(-18,0);
      ctx.lineTo(-24,13);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  async function downloadPng(){
    persistCurrentFields();
    const info = gameInfo[activeGame];
    const plan = currentPlan();
    const sourceRatio = activeGame === 'hok' ? 1000/523 : 1;
    const boardW = 1528;
    const boardH = Math.round(boardW / sourceRatio);
    const headerH = 120;
    const padding = 36;
    const canvas = document.createElement('canvas');
    canvas.width = 1600;
    canvas.height = headerH + boardH + padding;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#05111b';
    ctx.fillRect(0,0,canvas.width,canvas.height);

    const boardX = padding;
    const boardY = headerH;
    drawRoundedRect(ctx,boardX,boardY,boardW,boardH,28);
    ctx.save();
    ctx.clip();
    try {
      const img = await loadImage(info.boardSrc);
      ctx.drawImage(img,boardX,boardY,boardW,boardH);
    } catch (_e) {
      ctx.fillStyle = '#0b1724';
      ctx.fillRect(boardX,boardY,boardW,boardH);
    }
    ctx.fillStyle = 'rgba(4,11,17,.12)';
    ctx.fillRect(boardX,boardY,boardW,boardH);
    ctx.restore();

    ctx.fillStyle = '#ffe3a2';
    ctx.font = '900 24px system-ui';
    ctx.fillText(`${info.short} · HCI MOBA MAP SIMULATOR`,padding,42);
    ctx.fillStyle = '#eef6ff';
    ctx.font = '900 42px system-ui';
    ctx.fillText((plan.title || 'HCI Map Plan').slice(0,44),padding,82);
    ctx.fillStyle = '#a8bacf';
    ctx.font = '700 22px system-ui';
    ctx.textAlign = 'right';
    ctx.fillText((plan.note || 'Map strategy plan').slice(0,80),canvas.width-padding,46);
    ctx.textAlign = 'left';

    const drawLabel = (text,xPct,yPct,type) => {
      const x = boardX + (xPct/100)*boardW;
      const y = boardY + (yPct/100)*boardH;
      ctx.font = '900 18px system-ui';
      const textW = ctx.measureText(text).width + 28;
      const h = 36;
      ctx.fillStyle = 'rgba(4,11,17,.72)';
      ctx.strokeStyle = type === 'objective' ? 'rgba(245,196,81,.5)' : 'rgba(116,192,252,.4)';
      drawRoundedRect(ctx,x-textW/2,y-h/2,textW,h,18);
      ctx.fill();
      ctx.stroke();
      ctx.fillStyle = type === 'objective' ? '#ffe3a2' : '#eef6ff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(text,x,y+1);
      ctx.textAlign = 'left';
      ctx.textBaseline = 'alphabetic';
    };

    if(toggleLabels?.checked) info.lanes.forEach((lane) => drawLabel(lane.text,lane.x,lane.y,'lane'));
    if(toggleObjectives?.checked) info.objectives.forEach((obj) => drawLabel(obj.text,obj.x,obj.y,'objective'));
    if(!toggleRoutes || toggleRoutes.checked) plan.routes.forEach((route) => drawRouteCanvas(ctx,route,boardX,boardY,boardW,boardH));

    plan.markers.forEach((m,idx) => {
      const x = boardX + (m.x/100)*boardW;
      const y = boardY + (m.y/100)*boardH;
      const isRole = m.kind === 'role';
      const color = isRole ? (m.team === 'blue' ? '#2563eb' : '#ef4444') : (strategyInfo[m.id]?.color || '#f5c451');
      if(!isRole && m.id === 'note'){
        const text = String(m.text || 'Note').slice(0, 48);
        ctx.font = '800 20px system-ui';
        const tw = Math.min(360, Math.max(120, ctx.measureText(text).width + 30));
        ctx.fillStyle = 'rgba(24,18,46,.92)';
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        drawRoundedRect(ctx, x - tw/2, y - 24, tw, 48, 14);
        ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#f4efff';
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
      } else {
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(x,y,isRole?26:24,0,Math.PI*2);
        ctx.fill();
        ctx.strokeStyle = isRole ? 'rgba(255,255,255,.55)' : 'rgba(4,11,17,.9)';
        ctx.lineWidth = 4;
        ctx.stroke();
        ctx.fillStyle = isRole ? '#fff' : '#081018';
        ctx.font = `900 ${isRole?24:28}px system-ui`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(isRole ? m.code : (strategyInfo[m.id]?.icon || '•'),x,y);
        ctx.fillStyle = '#eef6ff';
        ctx.font = '900 16px system-ui';
        ctx.fillText(isRole ? (m.team === 'blue' ? 'B':'R') : String(idx+1),x+24,y-20);
      }
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
