(() => {
  const assetUrl = (path) => window.MOBAHub?.url(path) || window.MOBA_HUB_PATHS?.url(path) || path;
  const CONFIG = window.MOBA_HUB_GAME_CONFIG || window.HCI_GAME_CONFIG || { gameKey: 'HOK', gameName: 'Honor of Kings', roomPrefix: 'HOK', roles: ['ALL'], bansPerTeam: 4, turnSeconds: 30 };
  const PREPARE_SECONDS = 5;
  const DEFAULT_BEST_OF = 3;
  const SERIES_FORMATS = {
    bo3: { key:'bo3', games:3, mode:'bestOf', label:'BO 3', title:'BO 3', short:'BO 3' },
    bo5: { key:'bo5', games:5, mode:'bestOf', label:'BO 5', title:'BO 5', short:'BO 5' },
    flat2: { key:'flat2', games:2, mode:'flat', label:'BO2 Flat', title:'BO2 Flat', short:'BO2 Flat' },
    flat3: { key:'flat3', games:3, mode:'flat', label:'BO3 Flat', title:'BO3 Flat', short:'BO3 Flat' },
    flat4: { key:'flat4', games:4, mode:'flat', label:'BO4 Flat', title:'BO4 Flat', short:'BO4 Flat' }
  };

  const BASE_STEPS_HOK = [
    { side:'BLUE', type:'ban', label:'Blue Ban 1' }, { side:'RED', type:'ban', label:'Red Ban 1' },
    { side:'BLUE', type:'ban', label:'Blue Ban 2' }, { side:'RED', type:'ban', label:'Red Ban 2' },
    { side:'BLUE', type:'pick', label:'Blue Pick 1' }, { side:'RED', type:'pick', label:'Red Pick 1' },
    { side:'RED', type:'pick', label:'Red Pick 2' }, { side:'BLUE', type:'pick', label:'Blue Pick 2' },
    { side:'BLUE', type:'pick', label:'Blue Pick 3' }, { side:'RED', type:'pick', label:'Red Pick 3' },
    { side:'RED', type:'ban', label:'Red Ban 3' }, { side:'BLUE', type:'ban', label:'Blue Ban 3' },
    { side:'RED', type:'ban', label:'Red Ban 4' }, { side:'BLUE', type:'ban', label:'Blue Ban 4' },
    { side:'RED', type:'pick', label:'Red Pick 4' }, { side:'BLUE', type:'pick', label:'Blue Pick 4' },
    { side:'BLUE', type:'pick', label:'Blue Pick 5' }, { side:'RED', type:'pick', label:'Red Pick 5' }
  ];
  const BASE_STEPS_MLBB = [
    { side:'BLUE', type:'ban', label:'Blue Ban 1' }, { side:'RED', type:'ban', label:'Red Ban 1' },
    { side:'BLUE', type:'ban', label:'Blue Ban 2' }, { side:'RED', type:'ban', label:'Red Ban 2' },
    { side:'BLUE', type:'ban', label:'Blue Ban 3' }, { side:'RED', type:'ban', label:'Red Ban 3' },
    { side:'BLUE', type:'pick', label:'Blue Pick 1' }, { side:'RED', type:'pick', label:'Red Pick 1' },
    { side:'RED', type:'pick', label:'Red Pick 2' }, { side:'BLUE', type:'pick', label:'Blue Pick 2' },
    { side:'BLUE', type:'pick', label:'Blue Pick 3' }, { side:'RED', type:'pick', label:'Red Pick 3' },
    { side:'RED', type:'ban', label:'Red Ban 4' }, { side:'BLUE', type:'ban', label:'Blue Ban 4' },
    { side:'RED', type:'ban', label:'Red Ban 5' }, { side:'BLUE', type:'ban', label:'Blue Ban 5' },
    { side:'RED', type:'pick', label:'Red Pick 4' }, { side:'BLUE', type:'pick', label:'Blue Pick 4' },
    { side:'BLUE', type:'pick', label:'Blue Pick 5' }, { side:'RED', type:'pick', label:'Red Pick 5' }
  ];

  const $ = (id) => document.getElementById(id);
  const els = {
    connectionStatus: $('connectionStatus'), setupPanel: $('setupPanel') || $('create-room'), roomPanel: $('roomPanel'), signedUserMini: $('signedUserMini'),
    createRoomBtn: $('createRoomBtn'), joinRoomBtn: $('joinRoomBtn'), roomIdInput: $('roomIdInput'), roomNameInput: $('roomNameInput'), seriesFormat: $('seriesFormat'), firebaseNotice: $('firebaseNotice'),
    teamANameSeed: $('teamANameSeed'), teamBNameSeed: $('teamBNameSeed'), teamANameInput: $('teamANameInput'), teamBNameInput: $('teamBNameInput'), roomNameDisplay: $('roomNameDisplay'),
    roomCodeDisplay: $('roomCodeDisplay'), copyRoomBtn: $('copyRoomBtn'), copyRoomTopBtn: $('copyRoomTopBtn'), roomStatusDisplay: $('roomStatusDisplay'), sidePicker: $('sidePicker'),
    currentTurnText: $('currentTurnText'), currentTurnHelp: $('currentTurnHelp'), timerValue: $('timerValue'), startDraftBtn: $('startDraftBtn'), copyResultBtn: $('copyResultBtn'),
    deleteRoomBtn: $('deleteRoomBtn'), deleteRoomTopBtn: $('deleteRoomTopBtn'), leaveRoomBtn: $('leaveRoomBtn'), downloadResultTopBtn: $('downloadResultTopBtn'), downloadResultTopBtn2: $('downloadResultTopBtn2'),
    teamABans: $('teamABans'), teamBBans: $('teamBBans'), teamAPicks: $('teamAPicks'), teamBPicks: $('teamBPicks'), teamAState: $('teamAState'), teamBState: $('teamBState'),
    teamATitle: $('teamATitle'), teamBTitle: $('teamBTitle'), teamASideLabel: $('teamASideLabel'), teamBSideLabel: $('teamBSideLabel'), resultATitle: $('resultATitle'), resultBTitle: $('resultBTitle'), resultASideLabel: $('resultASideLabel'), resultBSideLabel: $('resultBSideLabel'),
    heroSearch: $('heroSearch'), laneFilterButtons: $('laneFilterButtons'), draftSequence: $('draftSequence'), heroGrid: $('heroGrid'), draftBoard: $('draftBoard'), heroPanel: $('heroPanel'), draftStage: $('draftStage'), draftFocusHeader: $('draftFocusHeader'), focusRoomText: $('focusRoomText'), gameHeadline: $('gameHeadline'),
    draftResultPanel: $('draftResultPanel'), resultGameTitle: $('resultGameTitle'), resultABans: $('resultABans'), resultBBans: $('resultBBans'), resultAPicks: $('resultAPicks'), resultBPicks: $('resultBPicks'),
    sessionModal: $('sessionModal'), sessionModalTitle: $('sessionModalTitle'), nextGameBtn: $('nextGameBtn'), backLobbyBtn: $('backLobbyBtn'), downloadResultBtn: $('downloadResultBtn'), sessionDeleteBtn: $('sessionDeleteBtn'), toast: $('toast'),
    siteNav: $('siteNav'), navToggle: $('navToggle'), seriesOptions: document.querySelectorAll('[data-series]')
  };

  let db = null, auth = null, currentUser = null, currentRoomId = null, currentRoom = null, currentRole = 'SPECTATOR';
  let unsubscribeRoom = null, timerInterval = null, prepareTransitionTimer = null, intermissionTransitionTimer = null, activeLane = 'ALL', lastAutoScrollTurnKey = '', lastFinishedModalKey = '', lastParticipantEventKey = '', autoNextGameKey = '', autoResolveBusy = false, historySaving = false;
  let pendingPickIds = [], pendingPickContext = '';
  let heroes = Array.isArray(window.MOBA_HUB_HEROES) ? [...window.MOBA_HUB_HEROES] : (Array.isArray(window.HCI_HEROES) ? [...window.HCI_HEROES] : []);

  const ROLE_ICON_PATHS = {
    HOK: { ALL:assetUrl('assets/role-icons/hok/all.png'), 'Clash Lane':assetUrl('assets/role-icons/hok/clash.png'), Farm:assetUrl('assets/role-icons/hok/farm.png'), Mid:assetUrl('assets/role-icons/hok/mid.png'), Jungle:assetUrl('assets/role-icons/hok/jungle.png'), Roam:assetUrl('assets/role-icons/hok/roam.png') },
    MLBB: { ALL:assetUrl('assets/role-icons/mlbb/all.png'), 'EXP Lane':assetUrl('assets/role-icons/mlbb/exp.png'), Jungle:assetUrl('assets/role-icons/mlbb/jungle.png'), 'Mid Lane':assetUrl('assets/role-icons/mlbb/mid.png'), 'Gold Lane':assetUrl('assets/role-icons/mlbb/gold.png'), Roam:assetUrl('assets/role-icons/mlbb/roam.png') }
  };
  const FALLBACK_ROLE_ICON = '<svg viewBox="0 0 24 24"><path d="M12 3l7 4v10l-7 4-7-4V7l7-4Z"/><path d="M12 7v10M8 9l8 6M16 9l-8 6"/></svg>';

  function escapeHtml(value){ return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
  function setHidden(el, value){ if(el) el.hidden = Boolean(value); }
  function setText(el, value){ if(el) el.textContent = value; }
  function setTimerValue(value){
    setText(els.timerValue, value);
    setText(document.getElementById('proTimerValue'), value);
  }
  function showToast(message){ if(!els.toast) return; els.toast.textContent = message; els.toast.hidden = false; clearTimeout(showToast.timer); showToast.timer = setTimeout(() => { els.toast.hidden = true; }, 2800); }
  function uppercaseRoomCodeInput(){ if(!els.roomIdInput) return; const start = els.roomIdInput.selectionStart; const end = els.roomIdInput.selectionEnd; const next = els.roomIdInput.value.toUpperCase(); if(els.roomIdInput.value !== next){ els.roomIdInput.value = next; try{ els.roomIdInput.setSelectionRange(start, end); }catch(e){} } }
  function gameLogoPath(){ const key = String(CONFIG.gameKey || 'HOK').toUpperCase(); if(key === 'MLBB') return assetUrl('assets/ml.png'); if(key === 'HOK') return assetUrl('assets/hok.png'); return assetUrl('assets/brand/moba-hub-icon.png'); }
  function safeHeroImage(hero){ const image = hero?.image || ''; return image && !/^(?:https?:|data:|blob:)/i.test(image) ? assetUrl(image) : image; }
  function heroAvatarHtml(hero, className, fallbackText){
    const name = hero?.name || fallbackText || '?'; const initials = heroInitials(name); const image = safeHeroImage(hero);
    return image ? `<span class="${className}"><img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" loading="lazy" onerror="this.parentElement.textContent='${initials}'"></span>` : `<span class="${className}">${initials}</span>`;
  }
  function updateGameVisuals(){
    const logo = gameLogoPath();
    document.querySelectorAll('[data-game-logo]').forEach((img) => { img.src = logo; img.alt = `${CONFIG.gameKey || 'MOBA HUB'} Logo`; });
    const landingLogo = document.querySelector('.hero-title-row img'); if(landingLogo){ landingLogo.src = logo; landingLogo.alt = `${CONFIG.gameKey || 'MOBA HUB'} Logo`; landingLogo.setAttribute('data-game-logo',''); }
  }
  function isConfigReady(){ const cfg = window.MOBA_HUB_FIREBASE_CONFIG || window.HCI_FIREBASE_CONFIG; return Boolean(cfg && cfg.apiKey && cfg.projectId && !String(cfg.apiKey).includes('PASTE')); }
  function roleIconHtml(role){ const gameKey = String(CONFIG.gameKey || 'HOK').toUpperCase(); const src = (ROLE_ICON_PATHS[gameKey] || ROLE_ICON_PATHS.HOK)[role] || (ROLE_ICON_PATHS[gameKey] || ROLE_ICON_PATHS.HOK).ALL; return src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(role)}" loading="lazy">` : FALLBACK_ROLE_ICON; }
  function heroById(id){ return heroes.find((hero) => hero.id === id) || null; }
  function heroLabel(id){ const hero = heroById(id); return hero ? hero.name : id || '-'; }
  function heroMeta(hero){
    const data = hero?.meta || hero?.stats || null;
    if(!data) return null;
    const wr = Number(data.winRate ?? data.wr);
    const pr = Number(data.pickRate ?? data.pr);
    const br = Number(data.banRate ?? data.br);
    if(!Number.isFinite(wr) && !Number.isFinite(pr) && !Number.isFinite(br)) return null;
    return {
      wr: Number.isFinite(wr) ? Math.max(0, Math.min(100, wr)).toFixed(1) : null,
      pr: Number.isFinite(pr) ? Math.max(0, Math.min(100, pr)).toFixed(1) : null,
      br: Number.isFinite(br) ? Math.max(0, Math.min(100, br)).toFixed(1) : null,
      tier: data.tier ? String(data.tier) : '',
      updated: data.updated || data.lastUpdated || ''
    };
  }
  function formatOfficialRate(value){ return value === null || value === undefined || value === '' ? 'N/A' : `${value}%`; }
  function metaBadgeHtml(hero){
    const meta = heroMeta(hero);
    if(!meta) return '';
    const primary = meta.wr !== null ? `<b>WR ${escapeHtml(formatOfficialRate(meta.wr))}</b>` : '<b>Verified meta</b>';
    const details = [meta.pr !== null ? `PR ${formatOfficialRate(meta.pr)}` : '', meta.br !== null ? `BR ${formatOfficialRate(meta.br)}` : '', meta.tier].filter(Boolean).join(' · ');
    return `<span class="hero-meta-line">${primary}${details ? `<small>${escapeHtml(details)}</small>` : ''}</span>`;
  }
  function heroInitials(name){ return String(name || '?').split(/\s+|\.|-/).filter(Boolean).slice(0,2).map((p) => p[0]?.toUpperCase()).join('') || '?'; }
  function gameSlug(){ return String(CONFIG.gameKey || 'HOK').toLowerCase() === 'mlbb' ? 'mlbb' : 'hok'; }
  function gameHomeRoute(){ return window.MOBAHub?.url(`${gameSlug()}/`) || window.MOBA_HUB_PATHS.url(`${gameSlug()}/`); }
  function isDraftRoute(){ const params = new URLSearchParams(location.search); return params.get('route') === 'draft' || Boolean(params.get('room')); }
  function getRouteRoomId(){ const params = new URLSearchParams(location.search); const queryRoom = params.get('room'); if(queryRoom) return decodeURIComponent(queryRoom).toUpperCase(); const parts = location.pathname.split('/').filter(Boolean); const draftIndex = parts.indexOf('draft'); if(draftIndex >= 0 && parts[draftIndex + 2]) return decodeURIComponent(parts[draftIndex + 2]).toUpperCase(); return ''; }
  function draftRouteForRoom(roomId){ return `${gameHomeRoute()}?room=${encodeURIComponent(roomId)}&route=draft`; }
  function lobbyRouteForRoom(roomId){ return roomId ? `${gameHomeRoute()}?room=${encodeURIComponent(roomId)}` : gameHomeRoute(); }
  function pushRoute(path){ const current = location.href; if(current !== path) history.pushState({ mobaHubDraftRoute:true }, '', path); }
  function goToDraftRoute(roomId){ pushRoute(draftRouteForRoom(roomId)); }
  function goToLobbyRoute(roomId){ pushRoute(lobbyRouteForRoom(roomId)); }
  function gameNumber(room = currentRoom){ return Number(room?.gameNumber || 1); }
  function normalizeSeriesKey(value){ const raw = String(value || '').trim(); if(SERIES_FORMATS[raw]) return raw; if(raw === '5') return 'bo5'; if(raw === '3') return 'bo3'; if(raw === '2') return 'flat2'; if(raw === '4') return 'flat4'; return 'bo3'; }
  function getSelectedSeries(){ return SERIES_FORMATS[normalizeSeriesKey(els.seriesFormat?.value || 'bo3')] || SERIES_FORMATS.bo3; }
  function seriesInfo(room = currentRoom){
    if(room?.seriesKey && SERIES_FORMATS[room.seriesKey]) return SERIES_FORMATS[room.seriesKey];
    const games = Number(room?.seriesGames || room?.gameCount || room?.bestOf || DEFAULT_BEST_OF);
    const mode = room?.seriesMode === 'flat' ? 'flat' : 'bestOf';
    if(mode === 'flat') return SERIES_FORMATS[`flat${games}`] || { key:`flat${games}`, games, mode:'flat', label:`BO${games} Flat`, title:`BO${games} Flat`, short:`BO${games} Flat` };
    return games === 5 ? SERIES_FORMATS.bo5 : SERIES_FORMATS.bo3;
  }
  function bestOf(room = currentRoom){ return Number(seriesInfo(room).games || DEFAULT_BEST_OF); }
  function seriesLabel(room = currentRoom){ return seriesInfo(room).title || `Best of ${bestOf(room)}`; }
  function gameTitle(room = currentRoom){ return `Game ${gameNumber(room)} / ${seriesLabel(room)}`; }
  function isHost(){ return Boolean(currentRoom && currentUser && currentRoom.hostUid === currentUser.uid); }
  function getSelectedBestOf(){ return Number(getSelectedSeries().games || DEFAULT_BEST_OF); }
  function uidForTeam(team, room = currentRoom){ return team === 'A' ? room?.teamAUid : room?.teamBUid; }
  function valuesForTeam(team, type, room = currentRoom){ const field = type === 'ban' ? (team === 'A' ? 'bansA' : 'bansB') : (team === 'A' ? 'picksA' : 'picksB'); return room?.[field] || []; }
  function displayTeams(room = currentRoom){ const number = gameNumber(room); const blue = blueTeamForGame(number); const red = redTeamForGame(number); return { left: blue, right: red, blue, red }; }
  function teamState(team, room = currentRoom){ return uidForTeam(team, room) ? (currentRole === team ? 'You' : 'Filled') : 'Empty'; }
  function updateSeriesButtons(){ const value = normalizeSeriesKey(els.seriesFormat?.value || 'bo3'); if(els.seriesFormat) els.seriesFormat.value = value; document.querySelectorAll('[data-series]').forEach((btn) => { const active = normalizeSeriesKey(btn.dataset.series) === value; btn.classList.toggle('active', active); btn.setAttribute('aria-checked', active ? 'true' : 'false'); }); }
  function getBansPerTeam(){ return Number(CONFIG.bansPerTeam || (CONFIG.gameKey === 'MLBB' ? 5 : 4)); }
  function getTurnSeconds(){ return Number(CONFIG.turnSeconds || (String(CONFIG.gameKey).toUpperCase() === 'HOK' ? 30 : 45)); }
  const HOK_ROUND_BY_STEP = ['B1','R1','B2','R2','BP1','RP12','RP12','BP23','BP23','RP3','RB3','BB3','RB4','BB4','RP4','BP45','BP45','RP5'];
  function roundKeyForStep(step){
    if(!step) return '';
    if(String(CONFIG.gameKey).toUpperCase() !== 'HOK') return `STEP-${Number(step.index)}`;
    return HOK_ROUND_BY_STEP[Number(step.index)] || `HOK-${Number(step.index)}`;
  }
  function sameDraftRound(first, second){ return Boolean(first && second && roundKeyForStep(first) === roundKeyForStep(second)); }
  function activeRoundSteps(room = currentRoom){
    if(!room || room.status !== 'drafting') return [];
    const steps = draftSteps(room); const start = Number(room.turnIndex || 0); const first = steps[start];
    if(!first) return [];
    const key = roundKeyForStep(first); const group = [];
    for(let i = start; i < steps.length; i += 1){
      const step = steps[i];
      if(roundKeyForStep(step) !== key || step.team !== first.team || step.type !== first.type) break;
      group.push(step);
    }
    return group;
  }
  function isDoublePickRound(room = currentRoom){
    const group = activeRoundSteps(room);
    return String(CONFIG.gameKey || '').toUpperCase() === 'HOK' && group.length > 1 && group.every((step) => step.type === 'pick');
  }
  function activePickContext(room = currentRoom){
    if(!isDoublePickRound(room)) return '';
    const first = activeRoundSteps(room)[0];
    return `${room?.id || currentRoomId || ''}:${gameNumber(room)}:${Number(room?.turnIndex || 0)}:${roundKeyForStep(first)}:${first?.team || ''}`;
  }
  function syncPendingPicks(room = currentRoom){
    const nextContext = activePickContext(room);
    if(nextContext !== pendingPickContext){ pendingPickContext = nextContext; pendingPickIds = []; }
    if(!nextContext && pendingPickIds.length) pendingPickIds = [];
  }
  function clearPendingPicks(){ pendingPickIds = []; pendingPickContext = activePickContext(currentRoom); renderPendingPickPanel(); renderHeroGrid(true); }
  function turnSecondsForStep(step){
    if(!step) return getTurnSeconds();
    if(String(CONFIG.gameKey).toUpperCase() === 'HOK') return Number(step.index) >= 14 ? 45 : 30;
    return getTurnSeconds();
  }
  function activeTurnSeconds(room = currentRoom){ const step = room ? draftSteps(room)[Number(room.turnIndex || 0)] : null; return Number(room?.currentTurnSeconds || turnSecondsForStep(step)); }
  function generateRoomId(){ return `${CONFIG.roomPrefix || CONFIG.gameKey || 'MH'}-${Math.floor(1000 + Math.random() * 90000)}`; }
  function blueTeamForGame(number = gameNumber()){ return Number(number) % 2 === 1 ? 'A' : 'B'; }
  function redTeamForGame(number = gameNumber()){ return blueTeamForGame(number) === 'A' ? 'B' : 'A'; }
  function sideForTeam(team, number = gameNumber()){ return blueTeamForGame(number) === team ? 'Blue Side' : 'Red Side'; }
  function teamForSide(side, number = gameNumber()){ return side === 'BLUE' ? blueTeamForGame(number) : redTeamForGame(number); }
  function baseSteps(){ return CONFIG.gameKey === 'MLBB' ? BASE_STEPS_MLBB : BASE_STEPS_HOK; }
  function draftSteps(room = currentRoom){ const number = gameNumber(room); return baseSteps().map((step, i) => ({ ...step, index:i, team: teamForSide(step.side, number), label: `${step.side === 'BLUE' ? 'Blue' : 'Red'} ${step.type === 'ban' ? 'Ban' : 'Pick'} ${countStepNo(step, i)}` })); }
  function countStepNo(step, index){ return baseSteps().slice(0, index + 1).filter((s) => s.side === step.side && s.type === step.type).length; }
  function fieldForStep(step){ if(step.type === 'ban') return step.team === 'A' ? 'bansA' : 'bansB'; return step.team === 'A' ? 'picksA' : 'picksB'; }
  function isHokGBP(){ return String(CONFIG.gameKey || 'HOK').toUpperCase() === 'HOK'; }
  function finishedGames(room = currentRoom){ return Array.isArray(room?.finishedGames) ? room.finishedGames : []; }
  function previousPicksForTeam(team, room = currentRoom){
    const key = team === 'A' ? 'picksA' : 'picksB';
    return new Set(finishedGames(room).flatMap((game) => Array.isArray(game?.[key]) ? game[key] : []));
  }
  function isPreviousPickLockedForStep(room, step, heroId){
    return Boolean(isHokGBP() && step?.type === 'pick' && step.team && heroId && previousPicksForTeam(step.team, room).has(heroId));
  }
  function heroUnavailableReason(room, step, heroId){
    if(!heroId) return '';
    if((room?.selectedHeroIds || []).includes(heroId)) return 'selected';
    if(isPreviousPickLockedForStep(room, step, heroId)) return 'gbp-used';
    return '';
  }
  function availableHeroPool(room, step){
    const selected = new Set(room?.selectedHeroIds || []);
    return heroes.filter((hero) => hero.active !== false && !selected.has(hero.id) && !isPreviousPickLockedForStep(room, step, hero.id));
  }
  function teamName(team, room = currentRoom){ return team === 'A' ? (room?.teamAName || 'Team A') : (room?.teamBName || 'Team B'); }
  function isMobileAutoScroll(){ return false; }
  function scrollToHeroPanel(){ /* Android auto-scroll intentionally disabled. */ }
  function scrollToDraftBoard(){ /* Android auto-scroll intentionally disabled. */ }
  function enterDraftFocus(){ document.body.classList.add('draft-active', 'route-draft-page'); }
  function leaveDraftFocus(){ document.body.classList.remove('draft-active', 'route-draft-page'); }
  function setNotice(message, isWarning = true){ if(!els.firebaseNotice) return; els.firebaseNotice.innerHTML = message; els.firebaseNotice.classList.toggle('warning', isWarning); els.firebaseNotice.hidden = false; }
  function saveRestore(){ if(currentRoomId) sessionStorage.setItem(`mobaHubDraftRestore:${CONFIG.gameKey}`, JSON.stringify({ roomId: currentRoomId })); }
  function clearRestore(){ sessionStorage.removeItem(`mobaHubDraftRestore:${CONFIG.gameKey}`); }
  function redirectToLogin(){ const next = encodeURIComponent(location.pathname + location.search + location.hash); const login = window.MOBA_HUB_PATHS?.url('auth/login/') || '../auth/login/'; location.replace(`${login}?next=${next}`); }

  async function loadHeroesFromFirestore(){
    if(!db || CONFIG.gameKey !== 'HOK') return;
    try{
      const snapshot = await db.collection('heroes').orderBy('name').get();
      if(!snapshot.empty){
        const remote = new Map(snapshot.docs.map((doc) => [doc.id, { id:doc.id, ...doc.data() }]));
        heroes = heroes.map((hero) => remote.has(hero.id) ? { ...hero, ...remote.get(hero.id), meta:hero.meta, tacticalProfile:hero.tacticalProfile, skills:hero.skills, image:remote.get(hero.id).image || hero.image || assetUrl(`assets/game/hok/${hero.id}.png`) } : hero);
      }
    }catch(error){ console.warn('Using local hero database:', error.message); }
  }

  async function initFirebase(){
    if(!isConfigReady()){
      setText(els.connectionStatus, 'Firebase is not configured');
      setNotice('Firebase is not configured. Edit <strong>js/firebase-config.js</strong> to enable real-time rooms.');
      renderRoleFilters(); renderHeroGrid(true); renderDraftSequence(); return;
    }
    try{
      if(!firebase.apps.length) firebase.initializeApp(window.MOBA_HUB_FIREBASE_CONFIG || window.HCI_FIREBASE_CONFIG);
      auth = firebase.auth(); db = firebase.firestore();
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      auth.onAuthStateChanged(async (user) => {
        if(!user || user.isAnonymous){ redirectToLogin(); return; }
        currentUser = user;
        if(els.signedUserMini){ const photoSrc = user.photoURL || assetUrl('assets/brand/default-avatar.svg'); const photo = `<img src="${escapeHtml(photoSrc)}" alt="" onerror="this.src='${escapeHtml(assetUrl('assets/brand/default-avatar.svg'))}'">`; els.signedUserMini.innerHTML = `${photo}<span>${escapeHtml(user.displayName || 'Profile')}</span>`; }
        setText(els.connectionStatus, 'Realtime ready');
        if(els.createRoomBtn) els.createRoomBtn.disabled = false;
        if(els.joinRoomBtn) els.joinRoomBtn.disabled = false;
        setHidden(els.firebaseNotice, true);
        await loadHeroesFromFirestore();
        renderRoleFilters(); renderHeroGrid(true); renderDraftSequence(); restoreRoomIfNeeded();
      });
    }catch(error){
      setText(els.connectionStatus, 'Firebase error');
      const msg = String(error?.message || error?.code || 'Firebase error');
      const extra = msg.includes('unauthorized-domain') ? '<br><br><strong>Fix:</strong> add <strong>draft.hokcommunity.my.id</strong> in Firebase Authentication → Settings → Authorized domains.' : '';
      setNotice('Firebase error: ' + escapeHtml(msg) + extra);
      showToast(msg); console.error(error);
    }
  }

  function baseRoomData(roomId){
    const roomName = (els.roomNameInput?.value || 'MOBA HUB Practice Room').trim().slice(0,36) || 'MOBA HUB Practice Room';
    const teamAName = (els.teamANameSeed?.value || 'Team A').trim().slice(0,24) || 'Team A';
    const teamBName = (els.teamBNameSeed?.value || 'Team B').trim().slice(0,24) || 'Team B';
    const series = getSelectedSeries();
    return {
      id: roomId, roomName, game: CONFIG.gameKey, bestOf: series.games, seriesGames: series.games, seriesMode: series.mode, seriesKey: series.key, seriesLabel: series.title, flatSeries: series.mode === 'flat', gameNumber: 1, status:'lobby',
      hostUid: currentUser.uid, hostName: currentUser.displayName || 'Host', hostEmail: currentUser.email || '',
      teamAUid: currentUser.uid, teamBUid:'', teamAName, teamBName, spectatorUids: [],
      turnIndex:0, turnSeconds:getTurnSeconds(), currentTurnSeconds:turnSecondsForStep(draftSteps({gameNumber:1})[0]), prepareSeconds: PREPARE_SECONDS, bansPerTeam:getBansPerTeam(),
      bansA:[], bansB:[], picksA:[], picksB:[], selectedHeroIds:[], currentTurnStartedAt:null, prepareEndsAt:null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp(), finishedGames: [], lastParticipantEvent: null
    };
  }
  function restoreRoomIfNeeded(){ const params = new URLSearchParams(location.search); const roomParam = params.get('room') || getRouteRoomId(); if(roomParam) listenRoom(String(roomParam).toUpperCase()); }

  async function createRoom(){
    if(!db || !currentUser) return showToast('Please sign in to MOBA HUB first.');
    try{
      if(els.createRoomBtn) els.createRoomBtn.disabled = true;
      let roomId = generateRoomId(); let ref = db.collection('draftRooms').doc(roomId); let doc = await ref.get(); let tries = 0;
      while(doc.exists && tries < 20){ roomId = generateRoomId(); ref = db.collection('draftRooms').doc(roomId); doc = await ref.get(); tries++; }
      if(doc.exists) throw new Error('Could not generate a unique Room Code. Try again.');
      await ref.set(baseRoomData(roomId));
      currentRole = 'A'; listenRoom(roomId); goToLobbyRoute(roomId); showToast(`Room ${roomId} created`);
    }catch(error){ showToast(error?.message || 'Could not create room.'); }
    finally{ if(els.createRoomBtn) els.createRoomBtn.disabled = false; }
  }
  async function joinRoom(){
    if(!db || !currentUser) return showToast('Please sign in to MOBA HUB first.');
    const roomId = (els.roomIdInput?.value || '').trim().toUpperCase(); if(!roomId) return showToast('Enter a Room Code first.');
    try{
      const doc = await db.collection('draftRooms').doc(roomId).get();
      if(!doc.exists) return showToast('Room not found.');
      const room = doc.data();
      if(room.game && room.game !== CONFIG.gameKey) return showToast(`This room is for ${room.game}, not ${CONFIG.gameKey}.`);
      currentRole = 'SPECTATOR'; listenRoom(roomId); goToLobbyRoute(roomId); showToast(`Joined ${roomId}. Choose a team or Spectator.`);
    }catch(error){ showToast(error.message); }
  }
  function listenRoom(roomId){
    if(unsubscribeRoom) unsubscribeRoom();
    currentRoomId = roomId;
    unsubscribeRoom = db.collection('draftRooms').doc(roomId).onSnapshot((doc) => {
      if(!doc.exists){
        const deletedRoomId = currentRoomId || roomId;
        resetLocalState(true);
        try { history.replaceState({ mobaHubDraftRoute:true, roomDeleted:true }, '', gameHomeRoute()); }
        catch(e){ location.replace(gameHomeRoute()); }
        showToast(`Room ${deletedRoomId || ''} was deleted or is no longer available.`.trim());
        return;
      }
      const incomingRoom = doc.data();
      const event = incomingRoom?.lastParticipantEvent;
      const eventKey = event ? `${event.type || ''}:${event.uid || ''}:${event.atMillis || ''}` : '';
      if(eventKey && eventKey !== lastParticipantEventKey){
        lastParticipantEventKey = eventKey;
        if(event.uid && event.uid !== currentUser?.uid && event.type === 'left') showToast(`${event.name || 'A participant'} left the match.`);
      }
      currentRoom = incomingRoom; inferRoleFromRoom(); saveRestore(); renderRoom();
    }, (error) => showToast(error.message));
    setHidden(els.setupPanel, true); setHidden(els.roomPanel, false);
  }
  function inferRoleFromRoom(){
    if(!currentUser || !currentRoom){ currentRole = 'SPECTATOR'; return; }
    if(currentRoom.teamAUid === currentUser.uid) currentRole = 'A';
    else if(currentRoom.teamBUid === currentUser.uid) currentRole = 'B';
    else currentRole = 'SPECTATOR';
  }
  async function chooseSide(side){
    if(!currentRoom || !currentRoomId || !currentUser) return;
    if((currentRoom.status || 'lobby') !== 'lobby') return showToast('Team slots can only be changed in lobby.');
    if(side === 'SPECTATOR'){
      try{
        const updates = { spectatorUids: firebase.firestore.FieldValue.arrayUnion(currentUser.uid), updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
        if(currentRoom.teamAUid === currentUser.uid) updates.teamAUid = '';
        if(currentRoom.teamBUid === currentUser.uid) updates.teamBUid = '';
        await db.collection('draftRooms').doc(currentRoomId).update(updates);
        currentRole = 'SPECTATOR';
        renderRoom();
        return showToast('You are viewing as Spectator.');
      }catch(error){ return showToast(error.message); }
    }
    const targetField = side === 'A' ? 'teamAUid' : 'teamBUid';
    const otherField = side === 'A' ? 'teamBUid' : 'teamAUid';
    if(currentRoom[targetField] && currentRoom[targetField] !== currentUser.uid) return showToast(`${teamName(side)} is already filled.`);
    try{
      const updates = { [targetField]: currentUser.uid, updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
      if(currentRoom[otherField] === currentUser.uid) updates[otherField] = '';
      await db.collection('draftRooms').doc(currentRoomId).update(updates);
      currentRole = side; renderRoom(); showToast(`You joined ${teamName(side)}.`);
    }catch(error){ showToast(error.message); }
  }
  function hasBothTeams(room = currentRoom){ return Boolean(room && room.teamAUid && room.teamBUid); }
  async function updateTeamNames(){
    if(!currentRoom || !currentRoomId || !currentUser) return;
    if(!isHost()) return showToast('Only the host can update team names.');
    const a = (els.teamANameInput?.value || 'Team A').trim().slice(0,24) || 'Team A';
    const b = (els.teamBNameInput?.value || 'Team B').trim().slice(0,24) || 'Team B';
    try{ await db.collection('draftRooms').doc(currentRoomId).update({ teamAName:a, teamBName:b, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }); showToast('Team names updated.'); }catch(error){ showToast(error.message); }
  }
  async function startDraft(){
    if(!currentRoom || !currentRoomId) return;
    if(!isHost()) return showToast('Only the host can start the draft.');
    if(!hasBothTeams()) return showToast('Both Team A and Team B must be filled first.');
    try{
      const prepareEndsAt = firebase.firestore.Timestamp.fromDate(new Date(Date.now() + PREPARE_SECONDS * 1000));
      await db.collection('draftRooms').doc(currentRoomId).update({ status:'preparing', turnIndex:0, bansA:[], bansB:[], picksA:[], picksB:[], selectedHeroIds:[], currentTurnStartedAt:null, prepareEndsAt, turnSeconds:getTurnSeconds(), currentTurnSeconds:turnSecondsForStep(draftSteps(currentRoom)[0]), updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      goToDraftRoute(currentRoomId);
    }catch(error){ showToast(error.message); }
  }
  function togglePendingPick(hero){
    if(!currentRoom || !hero || !isDoublePickRound(currentRoom)) return;
    syncPendingPicks(currentRoom);
    const group = activeRoundSteps(currentRoom); const required = group.length;
    const index = pendingPickIds.indexOf(hero.id);
    if(index >= 0) pendingPickIds.splice(index, 1);
    else if(pendingPickIds.length < required) pendingPickIds.push(hero.id);
    else return showToast(`Select exactly ${required} heroes, or remove one pending pick first.`);
    renderPendingPickPanel(); renderHeroGrid(true);
  }
  async function lockPendingPicks(){
    if(!currentRoom || !currentRoomId || !isDoublePickRound(currentRoom)) return;
    syncPendingPicks(currentRoom);
    const group = activeRoundSteps(currentRoom); const required = group.length;
    if(currentRole !== group[0]?.team) return showToast(`It is ${teamName(group[0]?.team)}'s turn.`);
    if(pendingPickIds.length !== required) return showToast(`Select ${required} heroes before locking this round.`);
    const chosenIds = [...pendingPickIds]; const chosenNames = chosenIds.map(heroLabel).join(' + ');
    const ok = await confirmDialog({ title:`Lock ${required} Picks?`, message:`${teamName(group[0].team)} will lock ${chosenNames} together. The round timer will not reset between selections.`, confirmText:'Lock Picks', cancelText:'Review' });
    if(!ok) return;
    const ref = db.collection('draftRooms').doc(currentRoomId);
    try{
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref); if(!snap.exists) throw new Error('Room not found.');
        const room = snap.data(); const liveGroup = activeRoundSteps(room);
        if(liveGroup.length !== required || !liveGroup.every((step) => step.type === 'pick' && step.team === currentRole)) throw new Error('The active draft round changed. Please select again.');
        const uniqueIds = [...new Set(chosenIds)];
        if(uniqueIds.length !== required) throw new Error('Each pending pick must be a different hero.');
        for(const heroId of uniqueIds){
          const hero = heroById(heroId); if(!hero || hero.active === false) throw new Error('One selected hero is unavailable.');
          const unavailable = heroUnavailableReason(room, liveGroup[0], heroId);
          if(unavailable === 'selected') throw new Error(`${hero.name} has already been selected or banned.`);
          if(unavailable === 'gbp-used') throw new Error(`${hero.name} was already used by ${teamName(liveGroup[0].team, room)} and cannot be picked again.`);
        }
        const field = fieldForStep(liveGroup[0]); const roomSteps = draftSteps(room);
        const nextTurnIndex = Number(room.turnIndex || 0) + liveGroup.length;
        const nextStatus = nextTurnIndex >= roomSteps.length ? 'finished' : 'drafting'; const nextStep = nextStatus === 'drafting' ? roomSteps[nextTurnIndex] : null;
        tx.update(ref, {
          [field]: [...(Array.isArray(room[field]) ? room[field] : []), ...uniqueIds],
          selectedHeroIds: [...(Array.isArray(room.selectedHeroIds) ? room.selectedHeroIds : []), ...uniqueIds],
          turnIndex: nextTurnIndex, status: nextStatus,
          currentTurnSeconds: nextStep ? turnSecondsForStep(nextStep) : null,
          currentTurnStartedAt: nextStatus === 'drafting' ? firebase.firestore.FieldValue.serverTimestamp() : null,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
      pendingPickIds = []; pendingPickContext = ''; renderPendingPickPanel(); renderHeroGrid(true); setTimeout(scrollToDraftBoard, 180);
    }catch(error){ showToast(error.message); }
  }
  async function selectHero(hero){
    if(!currentRoom || !currentRoomId || !hero) return;
    if(hero.active === false) return showToast('This hero is disabled.');
    if(currentRoom.status !== 'drafting') return showToast('The draft has not started.');
    const steps = draftSteps(currentRoom); const step = steps[currentRoom.turnIndex];
    if(!step) return showToast('The draft is complete.');
    if(currentRole !== step.team) return showToast(`It is ${teamName(step.team)}'s turn.`);
    const unavailable = heroUnavailableReason(currentRoom, step, hero.id);
    if(unavailable === 'selected') return showToast('This hero has already been selected or banned.');
    if(unavailable === 'gbp-used') return showToast(`${hero.name} was already used by ${teamName(step.team)} in a previous game and cannot be picked again.`);
    if(isDoublePickRound(currentRoom)){
      const alreadyPending = pendingPickIds.includes(hero.id);
      const meta = heroMeta(hero);
      const actionLabel = alreadyPending ? 'Remove from double pick' : `Add as Pick ${Math.min(pendingPickIds.length + 1, activeRoundSteps(currentRoom).length)}`;
      const detail = [
        `${teamName(step.team)} · ${step.side === 'BLUE' ? 'Blue Side' : 'Red Side'} · ${gameTitle(currentRoom)}`,
        meta ? `WR ${meta.wr ?? 'N/A'}% · PR ${meta.pr ?? 'N/A'}% · BR ${meta.br ?? 'N/A'}%` : 'Official ranked statistics unavailable'
      ].join('\n');
      const ok = await confirmDialog({ title:`${actionLabel}: ${hero.name}?`, message:detail, confirmText:alreadyPending ? 'Remove' : 'Add Hero', cancelText:'Cancel', danger:false, hero, actionType:'double pick' });
      if(ok) togglePendingPick(hero);
      return;
    }
    const action = step.type === 'ban' ? 'Ban' : 'Pick';
    const ok = await confirmDialog({ title:`${action} ${hero.name}?`, message:`${teamName(step.team)} · ${step.side === 'BLUE' ? 'Blue Side' : 'Red Side'} · ${gameTitle(currentRoom)}`, confirmText:action, cancelText:'Cancel', danger:step.type === 'ban', hero, actionType:step.type });
    if(!ok) return;
    const ref = db.collection('draftRooms').doc(currentRoomId);
    try{
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref); if(!snap.exists) throw new Error('Room not found.');
        const room = snap.data(); const liveStep = draftSteps(room)[room.turnIndex];
        if(!liveStep) throw new Error('The draft is complete.');
        if(liveStep.team !== currentRole) throw new Error(`It is ${teamName(liveStep.team, room)}'s turn.`);
        if(isDoublePickRound(room)) throw new Error('This round requires two pending heroes before locking.');
        const liveUnavailable = heroUnavailableReason(room, liveStep, hero.id);
        if(liveUnavailable === 'selected') throw new Error('This hero has already been selected or banned.');
        if(liveUnavailable === 'gbp-used') throw new Error(`${hero.name} was already used by ${teamName(liveStep.team, room)} and cannot be picked again.`);
        const field = fieldForStep(liveStep); const roomSteps = draftSteps(room); const nextTurnIndex = Number(room.turnIndex || 0) + 1;
        const nextStatus = nextTurnIndex >= roomSteps.length ? 'finished' : 'drafting'; const nextStep = nextStatus === 'drafting' ? roomSteps[nextTurnIndex] : null;
        tx.update(ref, { [field]:firebase.firestore.FieldValue.arrayUnion(hero.id), selectedHeroIds:firebase.firestore.FieldValue.arrayUnion(hero.id), turnIndex:nextTurnIndex, status:nextStatus, currentTurnSeconds:nextStep ? turnSecondsForStep(nextStep) : null, currentTurnStartedAt:nextStatus === 'drafting' ? firebase.firestore.FieldValue.serverTimestamp() : null, updatedAt:firebase.firestore.FieldValue.serverTimestamp() });
      });
      setTimeout(scrollToDraftBoard, 180);
    }catch(error){ showToast(error.message); }
  }
  async function nextGame(){
    if(!currentRoom || !currentRoomId) return;
    if(!isHost()) return showToast('Only the host can continue to the next game.');
    const next = gameNumber() + 1; if(next > bestOf()) return showToast(`${seriesLabel()} is complete.`);
    if(els.nextGameBtn) els.nextGameBtn.disabled = true;
    const boardTeams = displayTeams(currentRoom);
    const summary = { gameNumber:gameNumber(), blueTeamKey:boardTeams.blue, redTeamKey:boardTeams.red, bansA:currentRoom.bansA||[], bansB:currentRoom.bansB||[], picksA:currentRoom.picksA||[], picksB:currentRoom.picksB||[], blueBans:valuesForTeam(boardTeams.blue,'ban'), redBans:valuesForTeam(boardTeams.red,'ban'), bluePicks:valuesForTeam(boardTeams.blue,'pick'), redPicks:valuesForTeam(boardTeams.red,'pick'), savedAtMillis:Date.now() };
    try{
      const nextGameStartsAt = firebase.firestore.Timestamp.fromDate(new Date(Date.now() + 10000));
      await db.collection('draftRooms').doc(currentRoomId).update({ finishedGames:firebase.firestore.FieldValue.arrayUnion(summary), gameNumber:next, status:'intermission', nextGameStartsAt, turnIndex:0, bansA:[], bansB:[], picksA:[], picksB:[], selectedHeroIds:[], currentTurnStartedAt:null, currentTurnSeconds:turnSecondsForStep(draftSteps({...currentRoom,gameNumber:next})[0]), prepareEndsAt:null, updatedAt:firebase.firestore.FieldValue.serverTimestamp() });
      goToDraftRoute(currentRoomId);
    }catch(error){ if(els.nextGameBtn) els.nextGameBtn.disabled=false; showToast(error.message); }
  }
  async function backToLobby(){
    if(!currentRoom || !currentRoomId) return resetLocalState(true);
    if(!isHost()) return showToast('Waiting for the host to continue.');
    try{ await db.collection('draftRooms').doc(currentRoomId).update({ status:'lobby', currentTurnStartedAt:null, prepareEndsAt:null, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }); hideSessionModal(); goToLobbyRoute(currentRoomId); }catch(error){ showToast(error.message); }
  }
  async function deleteRoom(){
    if(!currentRoom || !isHost()) return showToast('Only the host can delete this room.');
    const ok = await confirmDialog({ title:'Delete Room?', message:`Room ${currentRoomId} will be removed for every device. History records stay saved.`, confirmText:'Delete Room', cancelText:'Cancel', danger:true });
    if(!ok) return;
    try{ await db.collection('draftRooms').doc(currentRoomId).delete(); resetLocalState(true); showToast('Room deleted.'); location.href = gameHomeRoute(); }catch(error){ showToast(error.message); }
  }
  async function leaveRoom(){
    if(currentRoomId && db && currentUser){
      try{
        await db.collection('draftRooms').doc(currentRoomId).update({
          lastParticipantEvent:{ type:'left', uid:currentUser.uid, name:currentUser.displayName || currentUser.email || 'Participant', role:currentRole, atMillis:Date.now() },
          updatedAt:firebase.firestore.FieldValue.serverTimestamp()
        });
      }catch(error){ console.warn('Leave event could not be saved:', error.message); }
    }
    resetLocalState(true); location.href = gameHomeRoute();
  }
  function resetLocalState(clearStorage = true){
    if(unsubscribeRoom) unsubscribeRoom(); unsubscribeRoom = null; currentRoomId = null; currentRoom = null; currentRole = 'SPECTATOR'; pendingPickIds = []; pendingPickContext = '';
    setHidden(els.setupPanel, false); setHidden(els.roomPanel, true); setHidden(els.draftStage, true); if(els.roomIdInput) els.roomIdInput.value = '';
    clearInterval(timerInterval); clearTimeout(prepareTransitionTimer); clearTimeout(intermissionTransitionTimer); timerInterval=null; prepareTransitionTimer=null; intermissionTransitionTimer=null; hideSessionModal(); leaveDraftFocus(); document.body.classList.remove('room-lobby','room-intermission','room-preparing','room-drafting','room-finished'); if(clearStorage) clearRestore();
  }

  function renderRoom(){
    if(!currentRoom) return;
    syncPendingPicks(currentRoom);
    const status = currentRoom.status || 'lobby';
    if((status === 'intermission' || status === 'preparing' || status === 'drafting') && !isDraftRoute()) goToDraftRoute(currentRoom.id || currentRoomId);
    if(status === 'lobby' && isDraftRoute()){ hideSessionModal(); goToLobbyRoute(currentRoom.id || currentRoomId); }
    const isLobby = status === 'lobby', isIntermission=status==='intermission', isPreparing = status === 'preparing', isDrafting = status === 'drafting', isFinished = status === 'finished';
    document.body.classList.toggle('room-lobby', isLobby); document.body.classList.toggle('room-intermission',isIntermission); document.body.classList.toggle('room-preparing', isPreparing); document.body.classList.toggle('room-drafting', isDrafting); document.body.classList.toggle('room-finished', isFinished);
    if(isLobby){ leaveDraftFocus(); hideSessionModal(); lastFinishedModalKey = ''; } else { enterDraftFocus(); }
    setHidden(els.setupPanel, true); setHidden(els.roomPanel, false); setHidden(els.draftStage, isLobby);
    setText(els.roomNameDisplay, currentRoom.roomName || 'Draft Room'); setText(els.roomCodeDisplay, currentRoom.id || currentRoomId);
    setText(els.roomStatusDisplay, isIntermission ? 'Next Game' : isPreparing ? 'Starting Soon' : isDrafting ? 'Drafting' : isFinished ? 'Finished' : 'Lobby');
    if(els.teamANameInput && els.teamANameInput !== document.activeElement) els.teamANameInput.value = teamName('A');
    if(els.teamBNameInput && els.teamBNameInput !== document.activeElement) els.teamBNameInput.value = teamName('B');
    const boardTeams = displayTeams(currentRoom); const leftTeam = boardTeams.left; const rightTeam = boardTeams.right;
    setText(els.teamATitle, teamName(leftTeam)); setText(els.teamBTitle, teamName(rightTeam)); setText(els.resultATitle, teamName(leftTeam)); setText(els.resultBTitle, teamName(rightTeam));
    setText(els.teamASideLabel, 'Blue Side'); setText(els.teamBSideLabel, 'Red Side'); setText(els.resultASideLabel, 'Blue Side'); setText(els.resultBSideLabel, 'Red Side');
    setText(els.teamAState, teamState(leftTeam)); setText(els.teamBState, teamState(rightTeam));
    setText(els.gameHeadline, gameTitle()); setText(els.focusRoomText, `${currentRoom.id || currentRoomId} · ${currentRoom.roomName || 'Draft Room'}`);
    document.querySelectorAll('.side-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.side === currentRole));
    setHidden(els.sidePicker, !isLobby); setHidden(els.startDraftBtn, !(isLobby && isHost())); if(els.startDraftBtn) els.startDraftBtn.disabled = !hasBothTeams();
    setHidden(els.copyResultBtn, !isFinished); setHidden(els.downloadResultTopBtn, !isFinished || !isLobby); setHidden(els.downloadResultTopBtn2, true); setHidden(els.deleteRoomBtn, !isHost() || !isLobby); setHidden(els.deleteRoomTopBtn, true);
    const banCount = Number(currentRoom.bansPerTeam || getBansPerTeam()); renderSlots(els.teamABans, valuesForTeam(leftTeam, 'ban'), banCount, 'Ban'); renderSlots(els.teamBBans, valuesForTeam(rightTeam, 'ban'), banCount, 'Ban'); renderSlots(els.teamAPicks, valuesForTeam(leftTeam, 'pick'), 5, 'Pick'); renderSlots(els.teamBPicks, valuesForTeam(rightTeam, 'pick'), 5, 'Pick');
    renderDraftResult(); renderCurrentTurn(); renderProDraftTopbar(); renderSeriesHistory(); renderDraftSequence(); renderHeroGrid(); ensurePrepareTransition(); ensureIntermissionTransition(); startTimerRenderer(); if(isIntermission) showIntermissionModal(); else if(!isFinished) hideSessionModal(); maybeShowRotatePrompt(); maybeShowFinishedModal(); maybeSaveHistory();
  }
  function ensureSeriesHistory(){
    if(!els.draftStage || document.getElementById('seriesHistoryLayout')) return;
    ensureProDraftTopbar();
    const topbar = document.getElementById('proDraftTopbar');
    if(!topbar || !els.heroPanel) return;
    const layout = document.createElement('div'); layout.id = 'seriesHistoryLayout'; layout.className = 'series-history-layout';
    const left = document.createElement('aside'); left.id = 'seriesHistoryLeft'; left.className = 'series-history-panel blue-history'; left.hidden = true;
    const main = document.createElement('div'); main.className = 'series-history-main';
    const right = document.createElement('aside'); right.id = 'seriesHistoryRight'; right.className = 'series-history-panel red-history'; right.hidden = true;
    topbar.parentNode.insertBefore(layout, topbar);
    main.append(topbar, els.heroPanel);
    layout.append(left, main, right);
  }
  function historyHeroStrip(ids, type){
    if(!Array.isArray(ids) || !ids.length) return '<span class="series-history-empty">—</span>';
    return ids.map((id,index)=>{ const hero=heroById(id); return `<span class="series-history-hero" title="${escapeHtml(heroLabel(id))} · ${type} ${index+1}">${heroAvatarHtml(hero,'series-history-avatar',heroLabel(id))}<b>${index+1}</b></span>`; }).join('');
  }
  function historyCardHtml(game, team){
    const number=Number(game?.gameNumber||1); const teamWasBlue=game?.blueTeamKey===team; const side=teamWasBlue?'Blue Side':'Red Side';
    const bans=team==='A'?(game?.bansA||[]):(game?.bansB||[]); const picks=team==='A'?(game?.picksA||[]):(game?.picksB||[]);
    return `<details class="series-history-card" ${number===gameNumber()-1?'open':''}><summary><span>Game ${number}</span><small>${escapeHtml(side)}</small></summary><div><label>Bans</label><div class="series-history-strip bans">${historyHeroStrip(bans,'Ban')}</div><label>Picks</label><div class="series-history-strip picks">${historyHeroStrip(picks,'Pick')}</div></div></details>`;
  }
  function renderSeriesHistory(){
    ensureSeriesHistory();
    const layout=document.getElementById('seriesHistoryLayout'); if(!layout||!currentRoom) return;
    const games=finishedGames(currentRoom).slice().sort((a,b)=>Number(b.gameNumber||0)-Number(a.gameNumber||0));
    const visible=gameNumber(currentRoom)>=2 && games.length>0;
    layout.classList.toggle('has-history',visible);
    const board=displayTeams(currentRoom);
    const renderPanel=(id,team,label)=>{ const panel=document.getElementById(id); if(!panel)return; panel.hidden=!visible; if(!visible)return; panel.innerHTML=`<header><span class="eyebrow">Previous Drafts</span><h3>${escapeHtml(teamName(team))}</h3><small>${escapeHtml(label)}</small></header><div class="series-history-scroll">${games.map((game)=>historyCardHtml(game,team)).join('')}</div>`; };
    renderPanel('seriesHistoryLeft',board.blue,'Current Blue Side');
    renderPanel('seriesHistoryRight',board.red,'Current Red Side');
  }
  function renderSlots(container, values, count, prefix){
    if(!container) return; container.innerHTML = '';
    for(let i=0;i<count;i++){
      const heroId = values[i]; const div = document.createElement('div'); div.className = `slot ${heroId ? 'filled' : ''}`;
      if(!heroId){ div.innerHTML = `<span class="slot-placeholder">${prefix} ${i+1}</span>`; container.appendChild(div); continue; }
      const hero = heroById(heroId); const name = hero ? hero.name : heroId;
      const avatar = heroAvatarHtml(hero, 'slot-avatar', name);
      div.innerHTML = `<span class="slot-media">${avatar}<span class="slot-copy"><strong class="slot-name">${escapeHtml(name)}</strong><small>${prefix} ${i+1}</small></span></span>`; container.appendChild(div);
    }
  }
  function isDraftActiveStatus(room = currentRoom){ return ['intermission','preparing','drafting'].includes(room?.status || ''); }
  function activeRoomLink(){ return currentRoomId ? `${location.origin}${draftRouteForRoom(currentRoomId)}` : location.href; }
  async function copyRoomLink(){ if(!currentRoomId) return; await navigator.clipboard.writeText(activeRoomLink()); showToast('Room link copied.'); }
  function ensureRoomSettingsUI(){
    if(!document.getElementById('roomSettingsOverlay')){
      const overlay = document.createElement('div'); overlay.id = 'roomSettingsOverlay'; overlay.className = 'room-settings-overlay'; overlay.hidden = true;
      overlay.innerHTML = `<div class="room-settings-panel" role="dialog" aria-modal="true" aria-labelledby="roomSettingsTitle"><div class="room-settings-head"><div><span class="eyebrow">Room Settings</span><h2 id="roomSettingsTitle">Draft Room</h2></div><button type="button" class="room-settings-close" aria-label="Close room settings">×</button></div><div class="room-settings-meta"><strong id="roomSettingsCode">-</strong><small id="roomSettingsSub">-</small></div><div class="room-settings-actions"><button type="button" class="secondary-btn" id="roomSettingsCopyId">Copy Room ID</button><button type="button" class="secondary-btn" id="roomSettingsCopyLink">Copy Room Link</button><button type="button" class="secondary-btn" id="roomSettingsDownload" hidden>Download Result</button><button type="button" class="ghost-btn" id="roomSettingsLeave">Leave Match</button><button type="button" class="danger-btn" id="roomSettingsDelete" hidden>Delete Room</button></div></div>`;
      document.body.appendChild(overlay);
      overlay.addEventListener('click', (e) => { if(e.target === overlay) closeRoomSettings(); });
      overlay.querySelector('.room-settings-close')?.addEventListener('click', closeRoomSettings);
      overlay.querySelector('#roomSettingsCopyId')?.addEventListener('click', () => { copyRoomId(); closeRoomSettings(); });
      overlay.querySelector('#roomSettingsCopyLink')?.addEventListener('click', async () => { await copyRoomLink(); closeRoomSettings(); });
      overlay.querySelector('#roomSettingsDownload')?.addEventListener('click', () => { closeRoomSettings(); downloadResultPng(); });
      overlay.querySelector('#roomSettingsLeave')?.addEventListener('click', () => { closeRoomSettings(); leaveRoom(); });
      overlay.querySelector('#roomSettingsDelete')?.addEventListener('click', () => { closeRoomSettings(); deleteRoom(); });
      window.addEventListener('keydown', (event) => { if(event.key === 'Escape') closeRoomSettings(); });
    }
    const btn = document.getElementById('roomSettingsBtn');
    if(btn && !btn.dataset.bound){ btn.dataset.bound = '1'; btn.addEventListener('click', openRoomSettings); }
    updateRoomSettingsUI();
  }
  function openRoomSettings(){ ensureRoomSettingsUI(); updateRoomSettingsUI(); const overlay = document.getElementById('roomSettingsOverlay'); if(!overlay) return; overlay.hidden = false; document.body.classList.add('room-settings-open'); }
  function closeRoomSettings(){ const overlay = document.getElementById('roomSettingsOverlay'); if(overlay) overlay.hidden = true; document.body.classList.remove('room-settings-open'); }
  function updateRoomSettingsUI(){
    const overlay = document.getElementById('roomSettingsOverlay');
    if(!overlay) return;
    setText(document.getElementById('roomSettingsTitle'), currentRoom?.roomName || 'Draft Room');
    setText(document.getElementById('roomSettingsCode'), currentRoom?.id || currentRoomId || '-');
    setText(document.getElementById('roomSettingsSub'), currentRoom ? `${CONFIG.gameKey || 'MOBA HUB'} · ${gameTitle(currentRoom)} · ${currentRoom.status || 'lobby'}` : '-');
    setHidden(document.getElementById('roomSettingsDownload'), currentRoom?.status !== 'finished');
    setHidden(document.getElementById('roomSettingsDelete'), !isHost());
  }
  function ensureProDraftTopbar(){
    if(!els.draftStage || document.getElementById('proDraftTopbar')) return;
    const topbar = document.createElement('section'); topbar.id = 'proDraftTopbar'; topbar.className = 'pro-draft-topbar';
    topbar.innerHTML = `
      <div class="pro-game-badge"><img data-game-logo src="${escapeHtml(gameLogoPath())}" alt="${escapeHtml(CONFIG.gameKey || 'MOBA HUB')} Logo"><span>${escapeHtml(CONFIG.gameKey || 'MOBA HUB')}</span></div>
      <div class="pro-ban-row pro-blue" id="proBlueBans" aria-label="Blue ban slots"></div>
      <div class="pro-turn-box"><span id="proTurnPhase">WAITING</span><strong id="proTimerValue">--</strong><small id="proTurnTeam">Draft Lobby</small><div class="pro-timer-line"><i id="proTimerFill"></i></div></div>
      <div class="pro-ban-row pro-red" id="proRedBans" aria-label="Red ban slots"></div>
      <div class="pro-pick-row pro-blue" id="proBluePicks" aria-label="Blue pick slots"></div>
      <span class="pro-vs">VS</span>
      <div class="pro-pick-row pro-red" id="proRedPicks" aria-label="Red pick slots"></div>
      <button type="button" class="room-settings-btn" id="roomSettingsBtn" aria-label="Open room settings">☰</button>`;
    if(els.draftFocusHeader) els.draftFocusHeader.insertAdjacentElement('afterend', topbar); else els.draftStage.prepend(topbar);
    ensureRoomSettingsUI();
  }
  function compactSlotHtml(heroId, index, type){
    if(!heroId) return `<span class="pro-slot empty ${type}" title="${type === 'ban' ? 'Ban' : 'Pick'} ${index+1}">${index+1}</span>`;
    const hero = heroById(heroId); const name = hero ? hero.name : heroId; const avatar = heroAvatarHtml(hero, 'pro-slot-avatar', name);
    return `<span class="pro-slot filled ${type}" title="${escapeHtml(name)} · ${type === 'ban' ? 'Ban' : 'Pick'} ${index+1}">${avatar}<b>${index+1}</b></span>`;
  }
  function renderCompactSlots(containerId, values, count, type){
    const container = document.getElementById(containerId); if(!container) return;
    container.innerHTML = Array.from({length: count}, (_, i) => compactSlotHtml(values[i], i, type)).join('');
  }
  function renderProDraftTopbar(){
    if(!currentRoom) return; ensureProDraftTopbar(); ensureRoomSettingsUI(); updateGameVisuals();
    const banCount = Number(currentRoom.bansPerTeam || getBansPerTeam()); const board = displayTeams(currentRoom);
    renderCompactSlots('proBlueBans', valuesForTeam(board.blue, 'ban'), banCount, 'ban');
    renderCompactSlots('proRedBans', valuesForTeam(board.red, 'ban'), banCount, 'ban');
    renderCompactSlots('proBluePicks', valuesForTeam(board.blue, 'pick'), 5, 'pick');
    renderCompactSlots('proRedPicks', valuesForTeam(board.red, 'pick'), 5, 'pick');
    const phase = document.getElementById('proTurnPhase'); const team = document.getElementById('proTurnTeam'); const fill = document.getElementById('proTimerFill');
    let phaseText = currentRoom.status === 'intermission' ? 'NEXT GAME' : currentRoom.status === 'preparing' ? 'PREPARE' : currentRoom.status === 'finished' ? 'COMPLETE' : 'LOBBY'; let teamText = gameTitle(currentRoom); let pct = 0;
    if(currentRoom.status === 'drafting'){
      const step = draftSteps(currentRoom)[currentRoom.turnIndex];
      if(step){ phaseText = `${step.side === 'BLUE' ? 'BLUE' : 'RED'} | ${isDoublePickRound(currentRoom) ? 'DOUBLE PICK' : step.type.toUpperCase()}`; teamText = teamName(step.team, currentRoom); const remaining = draftRemainingMs(currentRoom); setTimerValue(`${Math.max(0, Math.ceil(remaining / 1000))}s`); pct = Math.max(0, Math.min(100, (remaining / (activeTurnSeconds(currentRoom) * 1000)) * 100)); }
    } else if(currentRoom.status === 'intermission'){ const remaining=intermissionRemainingMs(); setTimerValue(`${Math.max(0,Math.ceil(remaining/1000))}s`); pct=Math.max(0,Math.min(100,(remaining/10000)*100));
    } else if(currentRoom.status === 'preparing'){
      const remaining = prepareRemainingMs(); setTimerValue(`${Math.max(0, Math.ceil(remaining / 1000))}s`); pct = Math.max(0, Math.min(100, (remaining / (PREPARE_SECONDS * 1000)) * 100));
    } else if(currentRoom.status === 'finished'){ setTimerValue('Done'); pct = 100; }
    setText(phase, phaseText); setText(team, teamText); if(fill) fill.style.width = `${pct || 0}%`;
  }
  function updateProTimerProgress(){
    if(!currentRoom) return;
    const fill = document.getElementById('proTimerFill');
    if(!fill) return;
    let pct = 0;
    if(currentRoom.status === 'drafting'){
      const total = activeTurnSeconds(currentRoom) * 1000;
      pct = total ? Math.max(0, Math.min(100, (draftRemainingMs(currentRoom) / total) * 100)) : 0;
    } else if(currentRoom.status === 'intermission'){ pct=Math.max(0,Math.min(100,(intermissionRemainingMs()/10000)*100));
    } else if(currentRoom.status === 'preparing'){
      pct = Math.max(0, Math.min(100, (prepareRemainingMs() / (PREPARE_SECONDS * 1000)) * 100));
    } else if(currentRoom.status === 'finished'){
      pct = 100;
    }
    fill.style.width = `${pct || 0}%`;
  }
  function renderDraftResult(){
    if(!els.draftResultPanel || !currentRoom) return; const banCount = Number(currentRoom.bansPerTeam || getBansPerTeam()); const complete = currentRoom.status === 'finished' || ((currentRoom.bansA || []).length >= banCount && (currentRoom.bansB || []).length >= banCount && (currentRoom.picksA || []).length >= 5 && (currentRoom.picksB || []).length >= 5);
    setHidden(els.draftResultPanel, !complete); if(!complete) return; const boardTeams = displayTeams(currentRoom); setText(els.resultGameTitle, `${gameTitle()} Draft Result`); renderResultBoxes(els.resultABans, valuesForTeam(boardTeams.left, 'ban'), banCount, 'ban'); renderResultBoxes(els.resultBBans, valuesForTeam(boardTeams.right, 'ban'), banCount, 'ban'); renderResultBoxes(els.resultAPicks, valuesForTeam(boardTeams.left, 'pick'), 5, 'pick'); renderResultBoxes(els.resultBPicks, valuesForTeam(boardTeams.right, 'pick'), 5, 'pick'); renderResultSimulationPanel(els.draftResultPanel, currentRoom);
  }
  function renderResultSimulationPanel(panel, room){
    if(!panel) return; let node = panel.querySelector('.draft-sim-panel'); if(!node){ node = document.createElement('div'); node.className = 'draft-sim-panel'; panel.appendChild(node); }
    node.innerHTML = buildSimulationHtml(room, false);
  }
  function renderResultBoxes(container, heroIds, count, type){
    if(!container) return; container.innerHTML = '';
    for(let i=0;i<count;i++){
      const heroId = heroIds[i]; const box = document.createElement('div');
      if(!heroId){ box.className = `result-hero-box ${type} empty`; box.textContent = `${type === 'ban' ? 'Ban' : 'Pick'} ${i+1}`; container.appendChild(box); continue; }
      const hero = heroById(heroId); const name = hero ? hero.name : heroId; box.className = `result-hero-box ${type} filled`; const avatar = heroAvatarHtml(hero, 'result-avatar', name); box.innerHTML = `${avatar}<span class="result-hero-info"><span class="result-hero-name">${escapeHtml(name)}</span><span class="result-hero-order">${type === 'ban' ? 'Ban' : 'Pick'} ${i+1}</span></span>`; container.appendChild(box);
    }
  }
  function renderCurrentTurn(){
    if(!currentRoom) return;
    if(currentRoom.status === 'lobby'){
      const sideText = hasBothTeams() ? `${teamName('A')} is ${sideForTeam('A')} · ${teamName('B')} is ${sideForTeam('B')}.` : 'Share the Room Code and wait until both teams are filled.';
      setText(els.currentTurnText, `${gameTitle()} Lobby`); setText(els.currentTurnHelp, sideText); setTimerValue( '--'); return;
    }
    if(currentRoom.status === 'intermission'){ const remaining=Math.max(0,Math.ceil(intermissionRemainingMs()/1000)); setText(els.currentTurnText, `Next game starts in ${remaining}s`); setText(els.currentTurnHelp, 'Teams switch sides automatically and stay inside the same room.'); setTimerValue(`${remaining}s`); return; }
    if(currentRoom.status === 'preparing'){ setText(els.currentTurnText, 'Draft starting soon'); setText(els.currentTurnHelp, 'All devices are entering the draft stage before the first turn starts.'); return; }
    if(currentRoom.status === 'finished'){ setText(els.currentTurnText, 'Draft complete'); setText(els.currentTurnHelp, isHost() ? 'Continue to the next game or download the result.' : 'Waiting for the host to continue.'); setTimerValue( 'Done'); return; }
    const step = draftSteps(currentRoom)[currentRoom.turnIndex]; if(!step) return;
    const doublePick = isDoublePickRound(currentRoom); const required = activeRoundSteps(currentRoom).length;
    setText(els.currentTurnText, `${teamName(step.team)} ${doublePick ? `DOUBLE PICK · ${required} HEROES` : step.type.toUpperCase()}`);
    if(doublePick) setText(els.currentTurnHelp, currentRole === step.team ? `Select ${required} heroes, then lock both together. The timer is shared for the entire round and does not reset.` : `Waiting for ${teamName(step.team)} to select and lock ${required} heroes in one round.`);
    else setText(els.currentTurnHelp, currentRole === step.team ? 'Your turn. Select a hero before the timer ends. If time runs out, the system will auto-random.' : `Waiting for ${teamName(step.team)}. If the timer ends, the system will auto-random.`);
  }
  function renderDraftSequence(){
    if(!els.draftSequence) return; const steps = draftSteps(currentRoom); els.draftSequence.innerHTML = '';
    const activeGroupLength = currentRoom?.status === 'drafting' ? activeRoundSteps(currentRoom).length : 0;
    steps.forEach((step, i) => { const chip = document.createElement('span'); chip.className = 'step-chip'; if(currentRoom){ if(i < currentRoom.turnIndex) chip.classList.add('done'); if(currentRoom.status === 'drafting' && i >= currentRoom.turnIndex && i < Number(currentRoom.turnIndex || 0) + activeGroupLength) chip.classList.add('active'); } chip.textContent = `${step.side === 'BLUE' ? 'Blue' : 'Red'} · ${teamName(step.team)} ${step.type === 'ban' ? 'Ban' : 'Pick'}`; els.draftSequence.appendChild(chip); });
  }
  function renderRoleFilters(){
    if(!els.laneFilterButtons) return; els.laneFilterButtons.innerHTML = '';
    (CONFIG.roles || ['ALL']).forEach((role) => { const btn = document.createElement('button'); btn.type = 'button'; btn.className = `role-filter ${activeLane === role ? 'active' : ''}`; btn.title = role; btn.setAttribute('aria-label', role); btn.innerHTML = roleIconHtml(role); btn.addEventListener('click', () => { activeLane = role; renderRoleFilters(); renderHeroGrid(); }); els.laneFilterButtons.appendChild(btn); });
  }
  function miniRoleIcons(lanes){ return (lanes || []).slice(0,3).map((lane) => `<span class="mini-role" title="${escapeHtml(lane)}">${roleIconHtml(lane)}</span>`).join(''); }
  function ensurePendingPickPanel(){
    if(!els.heroPanel || document.getElementById('pendingPickPanel')) return;
    const panel = document.createElement('section'); panel.id = 'pendingPickPanel'; panel.className = 'pending-pick-panel'; panel.hidden = true;
    panel.innerHTML = `<div class="pending-pick-copy"><span class="eyebrow">Double Pick</span><strong id="pendingPickTitle">Select two heroes</strong><small id="pendingPickHelp">Review WR, PR, and BR in the hero popup before adding each pick.</small></div><div class="pending-pick-slots" id="pendingPickSlots"></div><div class="pending-pick-actions"><button type="button" class="ghost-btn" id="clearPendingPicks">Clear</button><button type="button" class="primary-btn" id="lockPendingPicks" disabled>Lock Picks</button></div>`;
    els.draftSequence?.insertAdjacentElement('afterend', panel);
    panel.querySelector('#clearPendingPicks')?.addEventListener('click', clearPendingPicks);
    panel.querySelector('#lockPendingPicks')?.addEventListener('click', lockPendingPicks);
  }
  function renderPendingPickPanel(){
    ensurePendingPickPanel(); const panel = document.getElementById('pendingPickPanel'); if(!panel) return;
    syncPendingPicks(currentRoom); const group = activeRoundSteps(currentRoom); const visible = isDoublePickRound(currentRoom); panel.hidden = !visible;
    if(!visible) return;
    const required = group.length; const canControl = currentRole === group[0]?.team;
    setText(document.getElementById('pendingPickTitle'), canControl ? `Select ${required} heroes before locking` : `${teamName(group[0]?.team)} is selecting ${required} heroes`);
    setText(document.getElementById('pendingPickHelp'), canControl ? 'Tap a pending hero again to remove it. Both picks are submitted in one real-time transaction.' : 'Pending selections stay private until the team locks the complete round.');
    const slots = document.getElementById('pendingPickSlots');
    if(slots) slots.innerHTML = Array.from({length:required}, (_, index) => {
      const heroId = pendingPickIds[index]; const hero = heroById(heroId);
      if(!hero) return `<span class="pending-pick-slot empty"><b>${index + 1}</b><small>Pending</small></span>`;
      return `<button type="button" class="pending-pick-slot filled" data-pending-id="${escapeHtml(hero.id)}" ${canControl ? '' : 'disabled'}>${heroAvatarHtml(hero, 'pending-pick-avatar', hero.name)}<span><b>${escapeHtml(hero.name)}</b><small>Tap to remove</small></span></button>`;
    }).join('');
    slots?.querySelectorAll('[data-pending-id]').forEach((button) => button.addEventListener('click', () => { const hero = heroById(button.dataset.pendingId); if(hero) togglePendingPick(hero); }));
    const lock = document.getElementById('lockPendingPicks'); if(lock) lock.disabled = !canControl || pendingPickIds.length !== required;
    const clear = document.getElementById('clearPendingPicks'); if(clear) clear.disabled = !canControl || !pendingPickIds.length;
  }
  function renderHeroGrid(force = false){
    if(!els.heroGrid) return;
    const search = (els.heroSearch?.value || '').trim().toLowerCase();
    const selected = currentRoom?.selectedHeroIds || [];
    const step = currentRoom?.status === 'drafting' ? draftSteps(currentRoom)[currentRoom.turnIndex] : null;
    const canClick = step && currentRole === step.team;
    const renderSignature = JSON.stringify({
      search,
      activeLane,
      selected,
      role: currentRole,
      status: currentRoom?.status || '',
      turnIndex: Number(currentRoom?.turnIndex || 0),
      stepTeam: step?.team || '',
      stepType: step?.type || '',
      gameNumber: gameNumber(currentRoom),
      finishedGames: currentRoom?.finishedGames || [],
      pendingPickIds
    });
    if(!force && renderHeroGrid.lastSignature === renderSignature && els.heroGrid.childElementCount) return;
    renderHeroGrid.lastSignature = renderSignature;
    const filtered = heroes.filter((hero) => {
      const name = String(hero.name || '').toLowerCase();
      const lanes = Array.isArray(hero.lanes) ? hero.lanes : [];
      const matchesSearch = !search || name.includes(search);
      const matchesLane = activeLane === 'ALL' || lanes.includes(activeLane);
      return matchesSearch && matchesLane;
    });
    els.heroGrid.textContent = '';
    if(!filtered.length){
      els.heroGrid.innerHTML = '<div class="notice compact">No heroes match this filter.</div>';
      return;
    }
    const frag = document.createDocumentFragment();
    for(const hero of filtered){
      const locked = selected.includes(hero.id);
      const pending = pendingPickIds.includes(hero.id);
      const gbpLocked = Boolean(step && isPreviousPickLockedForStep(currentRoom, step, hero.id));
      const disabledHero = hero.active === false;
      const btn = document.createElement('button');
      btn.className = `hero-card ${locked ? 'locked' : ''} ${pending ? 'pending-selected' : ''} ${gbpLocked ? 'gbp-locked' : ''} ${disabledHero ? 'disabled-hero' : ''}`;
      btn.disabled = locked || gbpLocked || disabledHero || !canClick;
      const avatar = heroAvatarHtml(hero, 'hero-avatar', hero.name);
      const lockNote = gbpLocked ? '<span class="hero-lock-note">Used by your team</span>' : locked ? '<span class="hero-lock-note">Selected / Banned</span>' : '';
      btn.innerHTML = `<span>${avatar}</span><span><span class="hero-name">${escapeHtml(hero.name)}</span>${lockNote}<span class="hero-lanes">${miniRoleIcons(hero.lanes || [])}</span></span>`;
      btn.addEventListener('click', () => selectHero(hero), { passive: true });
      frag.appendChild(btn);
    }
    els.heroGrid.appendChild(frag);
    renderPendingPickPanel();
  }
  function timestampToMillis(value){ return value && value.toDate ? value.toDate().getTime() : 0; }
  async function beginDraftAfterPreparing(){
    if(!db || !currentRoomId) return;
    try{ const ref = db.collection('draftRooms').doc(currentRoomId); await db.runTransaction(async (tx) => { const snap = await tx.get(ref); if(!snap.exists) return; const room = snap.data(); if(room.status !== 'preparing') return; tx.update(ref, { status:'drafting', currentTurnStartedAt: firebase.firestore.FieldValue.serverTimestamp(), currentTurnSeconds:turnSecondsForStep(draftSteps(room)[Number(room.turnIndex || 0)]), prepareEndsAt:null, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }); }); }catch(error){ console.warn(error.message); }
  }
  function prepareRemainingMs(){ if(!currentRoom || currentRoom.status !== 'preparing') return 0; const endsAt = timestampToMillis(currentRoom.prepareEndsAt); if(!endsAt) return PREPARE_SECONDS * 1000; return Math.max(0, endsAt - Date.now()); }
  function ensurePrepareTransition(){ clearTimeout(prepareTransitionTimer); prepareTransitionTimer = null; if(!currentRoom || currentRoom.status !== 'preparing') return; prepareTransitionTimer = setTimeout(beginDraftAfterPreparing, prepareRemainingMs() + 200); }
  function intermissionRemainingMs(room = currentRoom){ if(!room || room.status !== 'intermission') return 0; const endsAt=timestampToMillis(room.nextGameStartsAt); return endsAt ? Math.max(0, endsAt-Date.now()) : 10000; }
  async function beginNextGameAfterIntermission(){
    if(!db || !currentRoomId) return;
    try{ const ref=db.collection('draftRooms').doc(currentRoomId); await db.runTransaction(async tx=>{ const snap=await tx.get(ref); if(!snap.exists) return; const room=snap.data(); if(room.status!=='intermission'||intermissionRemainingMs(room)>0) return; const firstStep=draftSteps(room)[0]; tx.update(ref,{status:'drafting',turnIndex:0,currentTurnSeconds:turnSecondsForStep(firstStep),currentTurnStartedAt:firebase.firestore.FieldValue.serverTimestamp(),nextGameStartsAt:null,updatedAt:firebase.firestore.FieldValue.serverTimestamp()}); }); }catch(error){ console.warn(error.message); }
  }
  function ensureIntermissionTransition(){ clearTimeout(intermissionTransitionTimer); intermissionTransitionTimer=null; if(!currentRoom||currentRoom.status!=='intermission') return; intermissionTransitionTimer=setTimeout(beginNextGameAfterIntermission,intermissionRemainingMs()+180); }
  function showIntermissionModal(){
    if(!els.sessionModal||!currentRoom||currentRoom.status!=='intermission') return;
    const remaining=Math.max(0,Math.ceil(intermissionRemainingMs()/1000));
    setText(els.sessionModalTitle,`Game ${gameNumber()} begins in ${remaining}`);
    const card=els.sessionModal.querySelector('.session-modal-card');
    const info=card?.querySelector('p'); if(info) info.textContent='Teams have switched sides automatically. The next draft will start inside the same room.';
    let body=card?.querySelector('.session-result-body');
    if(card && !body){ body=document.createElement('div'); body.className='session-result-body'; card.querySelector('.modal-actions')?.before(body); }
    if(body) body.innerHTML=`<div class="intermission-brand"><img src="${escapeHtml(gameLogoPath())}" alt="${escapeHtml(CONFIG.gameKey)} logo"><span>${escapeHtml(CONFIG.gameKey)}</span></div><div class="next-game-countdown"><strong>${remaining}</strong><span>seconds</span></div>`;
    if(els.nextGameBtn) setHidden(els.nextGameBtn,true); if(els.backLobbyBtn) setHidden(els.backLobbyBtn,true); if(els.downloadResultBtn) setHidden(els.downloadResultBtn,true); if(els.sessionDeleteBtn) setHidden(els.sessionDeleteBtn,true); setHidden(els.sessionModal,false);
  }
  function draftRemainingMs(room = currentRoom){ if(!room || room.status !== 'drafting' || !room.currentTurnStartedAt) return 0; const startedAt = timestampToMillis(room.currentTurnStartedAt) || 0; const duration = activeTurnSeconds(room) * 1000; return Math.max(0, (startedAt + duration) - Date.now()); }
  async function tryAutoResolveTurn(){
    if(autoResolveBusy || !db || !currentRoomId || !currentRoom || currentRoom.status !== 'drafting') return;
    if(draftRemainingMs(currentRoom) > 0) return;
    autoResolveBusy = true;
    try{
      const ref = db.collection('draftRooms').doc(currentRoomId);
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref); if(!snap.exists) return;
        const room = snap.data(); if(room.status !== 'drafting' || !room.currentTurnStartedAt || draftRemainingMs(room) > 0) return;
        const liveGroup = activeRoundSteps(room); const liveStep = liveGroup[0]; if(!liveStep) return;
        const required = isDoublePickRound(room) ? liveGroup.length : 1; const pool = availableHeroPool(room, liveStep); if(pool.length < required) return;
        const poolIds = new Set(pool.map((hero) => hero.id));
        const localPending = currentRole === liveStep.team && activePickContext(room) === pendingPickContext
          ? pendingPickIds.filter((heroId) => poolIds.has(heroId)).slice(0, required)
          : [];
        const remainingPool = pool.filter((hero) => !localPending.includes(hero.id)).sort(() => Math.random() - 0.5);
        const randomIds = [...localPending, ...remainingPool.slice(0, required - localPending.length).map((hero) => hero.id)];
        const field = fieldForStep(liveStep); const roomSteps = draftSteps(room); const nextTurnIndex = Number(room.turnIndex || 0) + required;
        const nextStatus = nextTurnIndex >= roomSteps.length ? 'finished' : 'drafting'; const nextStep = nextStatus === 'drafting' ? roomSteps[nextTurnIndex] : null;
        tx.update(ref, {
          [field]: [...(Array.isArray(room[field]) ? room[field] : []), ...randomIds],
          selectedHeroIds: [...(Array.isArray(room.selectedHeroIds) ? room.selectedHeroIds : []), ...randomIds],
          turnIndex: nextTurnIndex, status: nextStatus,
          currentTurnSeconds: nextStep ? turnSecondsForStep(nextStep) : null,
          currentTurnStartedAt: nextStatus === 'drafting' ? firebase.firestore.FieldValue.serverTimestamp() : null,
          updatedAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      });
    }catch(error){ console.warn('Auto random turn failed:', error.message); }
    finally { autoResolveBusy = false; }
  }
  function startTimerRenderer(){
    clearInterval(timerInterval); if(!currentRoom || !['drafting','preparing','intermission'].includes(currentRoom.status)) return;
    timerInterval = setInterval(() => {
      if(!currentRoom) return;
      if(currentRoom.status === 'intermission'){ const remainingMs=intermissionRemainingMs(); const remaining=Math.ceil(remainingMs/1000); setTimerValue(`${Math.max(0,remaining)}s`); showIntermissionModal(); updateProTimerProgress(); if(remainingMs<=0) beginNextGameAfterIntermission(); return; }
      if(currentRoom.status === 'preparing'){
        const remaining = Math.ceil(prepareRemainingMs()/1000);
        setTimerValue(`${Math.max(0, remaining)}s`);
        updateProTimerProgress();
        return;
      }
      if(currentRoom.status !== 'drafting' || !currentRoom.currentTurnStartedAt) return;
      const remainingMs = draftRemainingMs(currentRoom);
      const remaining = Math.ceil(remainingMs / 1000);
      setTimerValue(`${Math.max(0, remaining)}s`);
      updateProTimerProgress();
      if(remainingMs <= 0) tryAutoResolveTurn();
    }, 250);
  }
  function handleMobileTurnAutoScroll(){ return; }
  function isPortraitDraftScreen(){ return window.matchMedia('(max-width: 760px) and (orientation: portrait)').matches; }
  function maybeShowRotatePrompt(){
    if(!currentRoom || !['preparing','drafting'].includes(currentRoom.status)) return;
    const key = `mobaHubPortraitDraftOk:${CONFIG.gameKey}`; let overlay = document.getElementById('rotateDeviceOverlay');
    if(!isPortraitDraftScreen() || sessionStorage.getItem(key) === '1'){ if(overlay) overlay.remove(); return; }
    if(overlay) return;
    overlay = document.createElement('div'); overlay.id = 'rotateDeviceOverlay'; overlay.className = 'rotate-device-overlay';
    overlay.innerHTML = `<div class="rotate-device-card" role="dialog" aria-modal="true"><div class="rotate-device-icon" aria-hidden="true"><span></span></div><h2>ROTATE YOUR DEVICE</h2><p>Landscape mode provides the best draft view, but portrait mode remains fully available.</p><button class="secondary-btn" data-continue>Continue in portrait anyway</button></div>`;
    document.body.appendChild(overlay);
    overlay.querySelector('[data-continue]').addEventListener('click', () => { sessionStorage.setItem(key, '1'); overlay.remove(); });
  }
  function maybeShowFinishedModal(){
    if(!currentRoom || currentRoom.status !== 'finished') return;
    const key = `${currentRoom.id}-${gameNumber()}`;
    if(gameNumber() < bestOf()){
      hideSessionModal();
      if(isHost() && autoNextGameKey !== key){
        autoNextGameKey=key;
        const completedRoom=currentRoom;
        setTimeout(async()=>{
          await maybeSaveHistory(completedRoom);
          if(currentRoom?.status==='finished' && gameNumber()<bestOf()) nextGame();
        },500);
      }
      return;
    }
    if(lastFinishedModalKey === key) return; lastFinishedModalKey = key; setTimeout(showSessionModal, 350);
  }
  function showSessionModal(){
    if(!els.sessionModal) return;
    setText(els.sessionModalTitle, `${gameTitle()} Complete Result`);
    const card = els.sessionModal.querySelector('.session-modal-card');
    if(card){ let badge = card.querySelector('.session-game-logo'); if(!badge){ badge = document.createElement('div'); badge.className = 'session-game-logo'; card.prepend(badge); } badge.innerHTML = `<img src="${escapeHtml(gameLogoPath())}" alt="${escapeHtml(CONFIG.gameKey || 'MOBA HUB')} Logo"><span>${escapeHtml(CONFIG.gameKey || 'MOBA HUB')}</span>`; }
    const info = card?.querySelector('p'); if(info) info.textContent = 'Draft result, draft composition analysis, and action controls are shown below.';
    let body = card?.querySelector('.session-result-body');
    if(card && !body){ body = document.createElement('div'); body.className = 'session-result-body'; const actions = card.querySelector('.modal-actions'); card.insertBefore(body, actions || null); }
    if(body) body.innerHTML = buildResultModalHtml(currentRoom);
    if(els.nextGameBtn) setHidden(els.nextGameBtn,true);
    if(els.backLobbyBtn){ setHidden(els.backLobbyBtn,false); els.backLobbyBtn.disabled=false; els.backLobbyBtn.textContent='Leave Match'; }
    if(els.downloadResultBtn){ setHidden(els.downloadResultBtn,false); els.downloadResultBtn.textContent='Download Result'; }
    if(els.sessionDeleteBtn) setHidden(els.sessionDeleteBtn,!isHost());
    setHidden(els.sessionModal, false);
  }
  function hideSessionModal(){ setHidden(els.sessionModal, true); }
  function roleTagsForHero(hero){
    const lanes = Array.isArray(hero?.lanes) ? hero.lanes : [];
    const roles = Array.isArray(hero?.roles) ? hero.roles : [];
    const tags = new Set();
    [...lanes, ...roles].forEach((value) => {
      const v = String(value).toLowerCase();
      if(v.includes('jungle') || v.includes('assassin')) tags.add('jungle');
      if(v.includes('mid') || v.includes('mage')) tags.add('mid');
      if(v.includes('roam') || v.includes('support')) tags.add('roam');
      if(v.includes('farm') || v.includes('gold') || v.includes('marksman')) tags.add('carry');
      if(v.includes('clash') || v.includes('exp') || v.includes('tank') || v.includes('fighter')) tags.add('frontline');
    });
    if(!tags.size) tags.add('flex');
    return tags;
  }
  function tacticalTagsForHero(hero){ return new Set((hero?.tacticalProfile?.tags || []).map((tag) => String(tag).toLowerCase())); }
  function hasAnyTag(tags, list){ return list.some((tag) => tags.has(tag)); }
  function heroMetaWinRate(hero){ const value = Number(hero?.meta?.winRate ?? hero?.meta?.wr); return Number.isFinite(value) ? value : null; }
  function draftFeatureScore(heroIds){
    const picked = (heroIds || []).map(heroById).filter(Boolean);
    const counts = { carry:0, jungle:0, mid:0, roam:0, frontline:0, flex:0 };
    const features = { hardCC:0, softCC:0, engage:0, disengage:0, sustain:0, protection:0, objective:0, wave:0, mobility:0, poke:0, burst:0, physical:0, magical:0, trueDamage:0 };
    const metaValues = [];
    picked.forEach((hero) => {
      roleTagsForHero(hero).forEach((tag) => { counts[tag] = (counts[tag] || 0) + 1; });
      const tags = tacticalTagsForHero(hero);
      if(hasAnyTag(tags,['stun','area-stun','targeted-stun','repeated-stun','suppress','fear','petrify','freeze','taunt','immobilize','airborne','launch'])) features.hardCC += 1;
      if(hasAnyTag(tags,['slow','area-slow','silence','blind','displacement','knockback','pull','hook','crowd-control','delayed-control'])) features.softCC += 1;
      if(hasAnyTag(tags,['engage','jump','leap','gap-close','dash','blink','global-teleport','teamfight'])) features.engage += 1;
      if(hasAnyTag(tags,['peel','self-peel','anti-dive','disengage','knockback','cleanse','team-cleanse','projectile-block'])) features.disengage += 1;
      if(hasAnyTag(tags,['heal','area-heal','team-sustain','sustain','lifesteal','recovery','heal-over-time'])) features.sustain += 1;
      if(hasAnyTag(tags,['shield','ally-shield','damage-mitigation','damage-reduction','defense-buff','invulnerability','invincibility'])) features.protection += 1;
      if(hasAnyTag(tags,['objective-control','jungle-clear','structure-damage','tower-disable','tower-utility'])) features.objective += 1;
      if(hasAnyTag(tags,['area-damage','lane-pressure','large-area','chain-damage','multi-target','zone-control'])) features.wave += 1;
      if(hasAnyTag(tags,['mobility','dash','blink','jump','leap','movement-speed','global-mobility'])) features.mobility += 1;
      if(hasAnyTag(tags,['poke','long-range','global-range','projectile','line-damage'])) features.poke += 1;
      if(hasAnyTag(tags,['burst','single-target-burst','delayed-burst','execute'])) features.burst += 1;
      if(hasAnyTag(tags,['physical-damage','physical-attack','basic-attack'])) features.physical += 1;
      if(hasAnyTag(tags,['magic-damage','magic-scaling'])) features.magical += 1;
      if(tags.has('true-damage')) features.trueDamage += 1;
      const wr = heroMetaWinRate(hero); if(wr !== null) metaValues.push(wr);
    });
    const covered = ['carry','jungle','mid','roam','frontline'].filter((tag) => counts[tag] > 0).length;
    const roleScore = covered * 4.2 + (counts.jungle && counts.roam ? 2.5 : 0) + (counts.carry && counts.mid ? 2 : 0);
    const controlScore = Math.min(12, features.hardCC * 3 + features.softCC * 1.2);
    const setupScore = Math.min(10, features.engage * 2 + features.disengage * 1.5);
    const resilienceScore = Math.min(10, counts.frontline * 1.8 + features.sustain * 1.7 + features.protection * 1.6);
    const tempoScore = Math.min(9, features.objective * 2.2 + features.wave * 1.2);
    const reachScore = Math.min(7, features.mobility * 1.1 + features.poke * 1.2);
    const damageTypes = [features.physical > 0, features.magical > 0, features.trueDamage > 0].filter(Boolean).length;
    const damageScore = Math.min(8, damageTypes * 2.2 + Math.min(3, features.burst));
    const avgMeta = metaValues.length ? metaValues.reduce((sum,value)=>sum+value,0)/metaValues.length : 50;
    const metaScore = Math.max(-4, Math.min(4, (avgMeta - 50) * .8));
    const overload = Math.max(...Object.values(counts)); const overlapPenalty = overload >= 4 ? 7 : overload >= 3 ? 3 : 0;
    const missingPenalty = ['carry','jungle','mid','roam'].filter((tag)=>!counts[tag]).length * 4;
    const completeness = picked.length / 5;
    const score = 24 + roleScore + controlScore + setupScore + resilienceScore + tempoScore + reachScore + damageScore + metaScore - overlapPenalty - missingPenalty;
    return { score, counts, features, covered, picked, avgMeta, metaCount:metaValues.length, completeness };
  }
  function analyzeDraftResult(room = currentRoom){
    const board = displayTeams(room); const blue = draftFeatureScore(valuesForTeam(board.blue,'pick',room)); const red = draftFeatureScore(valuesForTeam(board.red,'pick',room));
    const firstPickBoost = 1.2; const diff = (blue.score + firstPickBoost) - red.score;
    const bluePct = Math.max(35, Math.min(65, Math.round(50 + diff * .42))); const redPct = 100 - bluePct;
    const leader = bluePct >= redPct ? 'blue' : 'red'; const leaderName = leader === 'blue' ? teamName(board.blue,room) : teamName(board.red,room);
    const completedPicks = Math.min(blue.picked.length, red.picked.length); const metaCoverage = (blue.metaCount + red.metaCount) / Math.max(1, blue.picked.length + red.picked.length);
    const confidence = completedPicks >= 5 && metaCoverage >= .8 ? 'High' : completedPicks >= 3 ? 'Medium' : 'Low';
    const readableTag = (tag) => String(tag || '').replaceAll('-', ' ');
    const keyHeroesFor = (data) => data.picked.slice(0,5).map((hero) => {
      const tags = [...tacticalTagsForHero(hero)];
      const priority = ['engage','crowd-control','area-stun','suppress','poke','burst','objective-control','team-sustain','shield','peel','mobility','true-damage','structure-damage'];
      const strengths = priority.filter((tag)=>tags.includes(tag)).slice(0,2);
      const fallback = [...roleTagsForHero(hero)].slice(0,2);
      const detail = (strengths.length ? strengths : fallback).map(readableTag).join(' + ') || 'flexible draft contribution';
      return `${hero.name}: ${detail}.`;
    });
    const explainFor = (label, data, pct) => {
      const strengths = []; const risks = []; const winConditions = [];
      if(data.features.hardCC >= 3) strengths.push('Strong crowd-control chain for coordinated team fights.');
      else if(data.features.hardCC === 0) risks.push('Limited reliable hard crowd control makes targets harder to lock down.');
      if(data.features.engage >= 2) strengths.push('Multiple engage tools create reliable initiation options.');
      else risks.push('Engage options are limited, so positioning and enemy mistakes matter more.');
      if(data.features.disengage >= 2) strengths.push('Good peel and disengage can punish enemy dives.');
      if(data.counts.frontline >= 2 || data.features.protection >= 2) strengths.push('Stable frontline or protection gives damage dealers room to operate.');
      else if(!data.counts.frontline) risks.push('A fragile frontline may make vision checks and objective setups dangerous.');
      if(data.features.objective >= 2) strengths.push('Strong objective-control and jungle-tempo profile.');
      else risks.push('Objective secure may depend heavily on one hero or precise timing.');
      if(data.features.sustain >= 2) strengths.push('Sustain and shielding improve extended fights and repeated objective contests.');
      if(data.features.poke >= 2) strengths.push('Poke pressure can soften targets before a full engage.');
      if(data.features.burst >= 2) strengths.push('Burst tools can quickly remove a priority target.');
      const damageTypes = [data.features.physical>0,data.features.magical>0,data.features.trueDamage>0].filter(Boolean).length;
      if(damageTypes >= 2) strengths.push('Mixed damage is harder for the opponent to itemize against.');
      else if(data.picked.length >= 4) risks.push('A predictable damage profile is easier to counter with defensive items.');
      if(data.covered < 5) risks.push(`${label} covers only ${data.covered}/5 core role groups in this model.`);
      if(data.features.engage >= 2 && data.features.hardCC >= 2) winConditions.push('Control vision, force grouped fights, and start on a priority carry before the enemy can spread out.');
      else if(data.features.poke >= 2) winConditions.push('Set up objectives early, maintain distance, and use poke before committing to a full fight.');
      else winConditions.push('Create a lane or tempo advantage first, then convert it into controlled objective fights.');
      if(data.features.objective >= 2) winConditions.push('Use objective pressure to force the opponent into narrow entrances where the composition is strongest.');
      if(data.features.sustain >= 2) winConditions.push('Favor extended fights and repeated contests instead of one all-in burst exchange.');
      if(data.features.mobility >= 3) winConditions.push('Use mobility to rotate first, create numbers advantages, and avoid predictable front-to-back fights.');
      risks.push(`MOBA HUB estimated composition score: ${pct}/100; execution and player skill remain decisive.`);
      return { strengths:strengths.slice(0,6), risks:risks.slice(0,5), winConditions:winConditions.slice(0,3), keyHeroes:keyHeroesFor(data) };
    };
    const blueDetail = explainFor(teamName(board.blue,room),blue,bluePct); const redDetail = explainFor(teamName(board.red,room),red,redPct);
    return {
      bluePct, redPct, leader, leaderName, confidence,
      blueName:teamName(board.blue,room), redName:teamName(board.red,room), blueTeamKey:board.blue, redTeamKey:board.red,
      blueNotes:[...blueDetail.strengths,...blueDetail.risks], redNotes:[...redDetail.strengths,...redDetail.risks],
      blueStrengths:blueDetail.strengths, redStrengths:redDetail.strengths,
      blueRisks:blueDetail.risks, redRisks:redDetail.risks,
      blueWinConditions:blueDetail.winConditions, redWinConditions:redDetail.winConditions,
      blueKeyHeroes:blueDetail.keyHeroes, redKeyHeroes:redDetail.keyHeroes,
      summary:`${leaderName} has the current draft edge from role coverage, crowd control, engage options, protection, objective pressure, damage profile, and the available official hero-stat snapshot.`
    };
  }
  function buildSimulationHtml(room, compact = false){
    const sim = analyzeDraftResult(room); const blueNotes = sim.blueNotes.slice(0, compact ? 2 : 5).map((n)=>`<li>${escapeHtml(n)}</li>`).join(''); const redNotes = sim.redNotes.slice(0, compact ? 2 : 5).map((n)=>`<li>${escapeHtml(n)}</li>`).join('');
    return `<div class="sim-head"><span class="eyebrow">Estimated Draft Advantage</span><strong>${escapeHtml(sim.blueName)} ${sim.bluePct}%</strong><b>vs</b><strong>${escapeHtml(sim.redName)} ${sim.redPct}%</strong><span class="sim-confidence">Confidence: ${escapeHtml(sim.confidence)}</span></div><p>${escapeHtml(sim.summary)}</p><div class="sim-notes"><div><b>${escapeHtml(sim.blueName)}</b><ul>${blueNotes}</ul></div><div><b>${escapeHtml(sim.redName)}</b><ul>${redNotes}</ul></div></div><small class="sim-disclaimer">MOBA HUB composition estimate. It is not an official match probability and does not account for player skill, execution, or in-game decisions.</small>`;
  }
  function resultListHtml(ids, type){ return (ids || []).map((id, index) => `<span><b>${type} ${index+1}</b>${escapeHtml(heroLabel(id))}</span>`).join('') || '<span>-</span>'; }
  function buildResultModalHtml(room){
    const board = displayTeams(room); const banCount = Number(room?.bansPerTeam || getBansPerTeam());
    const blueBans = valuesForTeam(board.blue, 'ban', room).slice(0, banCount); const redBans = valuesForTeam(board.red, 'ban', room).slice(0, banCount);
    const bluePicks = valuesForTeam(board.blue, 'pick', room).slice(0, 5); const redPicks = valuesForTeam(board.red, 'pick', room).slice(0, 5);
    return `<div class="modal-result-grid"><section><h3>${escapeHtml(teamName(board.blue, room))} · Blue Side</h3><div class="modal-mini-list"><h4>Ban</h4>${resultListHtml(blueBans, 'B')}</div><div class="modal-mini-list"><h4>Pick</h4>${resultListHtml(bluePicks, 'P')}</div></section><section><h3>${escapeHtml(teamName(board.red, room))} · Red Side</h3><div class="modal-mini-list"><h4>Ban</h4>${resultListHtml(redBans, 'B')}</div><div class="modal-mini-list"><h4>Pick</h4>${resultListHtml(redPicks, 'P')}</div></section></div><div class="draft-sim-panel modal-sim">${buildSimulationHtml(room, true)}</div>`;
  }
  async function maybeSaveHistory(roomSource = currentRoom){
    if(historySaving || !db || !roomSource || roomSource.status !== 'finished' || !isHost()) return;
    const room = {
      ...roomSource,
      bansA:[...(roomSource.bansA || [])], bansB:[...(roomSource.bansB || [])],
      picksA:[...(roomSource.picksA || [])], picksB:[...(roomSource.picksB || [])],
      selectedHeroIds:[...(roomSource.selectedHeroIds || [])]
    };
    const roomGameNumber=gameNumber(room); const historyId = `${room.id || currentRoomId}_${roomGameNumber}`;
    if(sessionStorage.getItem(`mobaHubHistorySaved:${historyId}`)) return;
    historySaving = true;
    try{
      const ref = db.collection('draftHistory').doc(historyId); const snap = await ref.get();
      if(!snap.exists){
        const boardTeams = displayTeams(room);
        await ref.set({
          id: historyId, roomId: room.id || currentRoomId, roomName: room.roomName || 'Draft Room', game: CONFIG.gameKey,
          gameNumber: roomGameNumber, bestOf: bestOf(room), seriesKey: room.seriesKey || seriesInfo(room).key,
          seriesMode: room.seriesMode || seriesInfo(room).mode, seriesLabel: seriesLabel(room),
          teamAName: teamName('A',room), teamBName: teamName('B',room), teamASide: sideForTeam('A',roomGameNumber), teamBSide: sideForTeam('B',roomGameNumber),
          blueTeamKey: boardTeams.blue, redTeamKey: boardTeams.red, blueTeamName: teamName(boardTeams.blue,room), redTeamName: teamName(boardTeams.red,room),
          bansA: room.bansA, bansB: room.bansB, picksA: room.picksA, picksB: room.picksB,
          blueBans: valuesForTeam(boardTeams.blue,'ban',room), redBans: valuesForTeam(boardTeams.red,'ban',room),
          bluePicks: valuesForTeam(boardTeams.blue,'pick',room), redPicks: valuesForTeam(boardTeams.red,'pick',room),
          participantUids: [room.teamAUid, room.teamBUid, room.hostUid].filter(Boolean), hostUid: room.hostUid,
          simulation: analyzeDraftResult(room), finishedAtMillis: Date.now(), createdAt: firebase.firestore.FieldValue.serverTimestamp()
        });
      }
      sessionStorage.setItem(`mobaHubHistorySaved:${historyId}`, '1');
    }catch(error){ console.warn('History save failed:', error.message); }
    finally{ historySaving = false; }
  }


  async function copyRoomId(){ if(!currentRoomId) return; await navigator.clipboard.writeText(currentRoomId); showToast('Room Code copied.'); }
  async function copyResult(){
    if(!currentRoom) return;
    const sim=analyzeDraftResult(currentRoom); const bullets=(title,values)=>[title,...(values||[]).map((value)=>`- ${value}`)].join('\n');
    const result = [
      `MOBA HUB Draft Simulator - ${CONFIG.gameKey} - ${currentRoom.id}`,
      currentRoom.roomName || 'Draft Room', gameTitle(),
      `${teamName('A')} (${sideForTeam('A')}) Ban: ${(currentRoom.bansA || []).map(heroLabel).join(', ') || '-'}`,
      `${teamName('A')} Pick: ${(currentRoom.picksA || []).map(heroLabel).join(', ') || '-'}`, '',
      `${teamName('B')} (${sideForTeam('B')}) Ban: ${(currentRoom.bansB || []).map(heroLabel).join(', ') || '-'}`,
      `${teamName('B')} Pick: ${(currentRoom.picksB || []).map(heroLabel).join(', ') || '-'}`, '',
      `MOBA HUB Estimated Draft Advantage: ${sim.blueName} ${sim.bluePct}% vs ${sim.redName} ${sim.redPct}%`,
      `Confidence: ${sim.confidence}`, sim.summary, '',
      bullets(`${sim.blueName} strengths`,sim.blueStrengths), bullets(`${sim.blueName} risks`,sim.blueRisks), bullets(`${sim.blueName} win conditions`,sim.blueWinConditions), bullets(`${sim.blueName} key hero contributions`,sim.blueKeyHeroes), '',
      bullets(`${sim.redName} strengths`,sim.redStrengths), bullets(`${sim.redName} risks`,sim.redRisks), bullets(`${sim.redName} win conditions`,sim.redWinConditions), bullets(`${sim.redName} key hero contributions`,sim.redKeyHeroes), '',
      'Disclaimer: this is a MOBA HUB composition estimate, not an official match probability. Player skill, execution, lane outcomes, builds, and in-game decisions can change the result.'
    ].join('\n');
    await navigator.clipboard.writeText(result); showToast('Detailed result copied.');
  }
  async function downloadResultPng(){
    if(!currentRoom) return showToast('Result is not available yet.');
    const canvas = document.createElement('canvas'); canvas.width = 1500; canvas.height = 1600; const ctx = canvas.getContext('2d');
    const allIds = [...(currentRoom.bansA || []), ...(currentRoom.picksA || []), ...(currentRoom.bansB || []), ...(currentRoom.picksB || [])]; const imageCache = await buildHeroImageCache(allIds); const gameLogo = await loadImageSafe(gameLogoPath());
    const gradient = ctx.createLinearGradient(0,0,1500,1600); gradient.addColorStop(0,'#071018'); gradient.addColorStop(0.55,'#0d2030'); gradient.addColorStop(1,'#0a111b'); ctx.fillStyle = gradient; ctx.fillRect(0,0,1500,1600);
    roundRect(ctx,42,42,1416,1516,34,true,false,'rgba(255,255,255,.055)'); ctx.strokeStyle = 'rgba(245,196,81,.44)'; ctx.lineWidth = 3; roundRect(ctx,42,42,1416,1516,34,false,true);
    let headerX = 82; if(gameLogo){ roundRect(ctx,82,72,82,82,18,true,false,'rgba(4,10,16,.72)'); ctx.save(); roundRect(ctx,92,82,62,62,14,false,false); ctx.clip(); ctx.drawImage(gameLogo,92,82,62,62); ctx.restore(); headerX = 184; }
    ctx.fillStyle = '#ffe3a2'; ctx.font = 'bold 34px Arial'; ctx.fillText('MOBA HUB Draft Simulator',headerX,108); ctx.fillStyle = '#eef6ff'; ctx.font = 'bold 54px Arial'; ctx.fillText(`${CONFIG.gameKey} ${gameTitle()} Result`,headerX,172);
    ctx.fillStyle = '#a8bacf'; ctx.font = '23px Arial'; ctx.fillText(`${currentRoom.roomName || 'Draft Room'} · Room ${currentRoom.id || currentRoomId}`,headerX,214);
    const boardTeams = displayTeams(currentRoom);
    drawTeamResult(ctx, `${teamName(boardTeams.blue)} · Blue Side`, valuesForTeam(boardTeams.blue, 'ban'), valuesForTeam(boardTeams.blue, 'pick'), 82,250, '#4dabf7', imageCache);
    drawTeamResult(ctx, `${teamName(boardTeams.red)} · Red Side`, valuesForTeam(boardTeams.red, 'ban'), valuesForTeam(boardTeams.red, 'pick'), 770,250, '#ff6b6b', imageCache);
    drawSimulationResult(ctx, analyzeDraftResult(currentRoom), 82,850, 1336, 625);
    ctx.fillStyle = '#a8bacf'; ctx.font = '20px Arial'; ctx.fillText(new Date().toLocaleString('en-GB', { hour12:false }),82,1520);
    const a = document.createElement('a'); a.download = `moba-hub-${String(CONFIG.gameKey).toLowerCase()}-${String(currentRoom.id || currentRoomId).toLowerCase()}-game-${gameNumber()}-result.png`; a.href = canvas.toDataURL('image/png'); a.click(); showToast('Result PNG downloaded.');
  }
  async function buildHeroImageCache(heroIds){ const ids = [...new Set((heroIds || []).filter(Boolean))]; const entries = await Promise.all(ids.map(async (heroId) => { const hero = heroById(heroId); if(!hero?.image) return [heroId, null]; const img = await loadImageSafe(hero.image); return [heroId, img]; })); return new Map(entries); }
  function loadImageSafe(src){ return new Promise((resolve) => { if(!src) return resolve(null); const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => resolve(img); img.onerror = () => resolve(null); img.src = src; }); }
  function drawTeamResult(ctx, title, bans, picks, x, y, color, imageCache){
    const banCount = Number(currentRoom.bansPerTeam || getBansPerTeam()); roundRect(ctx,x,y,648,570,28,true,false,'rgba(255,255,255,.055)'); ctx.fillStyle = color; ctx.font = 'bold 30px Arial'; ctx.fillText(title,x+28,y+52); ctx.fillStyle = '#ffe3a2'; ctx.font = 'bold 23px Arial'; ctx.fillText('BAN',x+28,y+102);
    const banW = banCount === 5 ? 108 : 128; for(let i=0;i<banCount;i++) drawHeroBox(ctx, bans[i], x+28+i*(banW+10), y+122, banW, 104, `Ban ${i+1}`, imageCache);
    ctx.fillStyle = '#ffe3a2'; ctx.font = 'bold 23px Arial'; ctx.fillText('PICK',x+28,y+270); for(let i=0;i<5;i++) drawHeroBox(ctx, picks[i], x+28, y+292+i*58, 590, 52, `Pick ${i+1}`, imageCache);
  }
  function drawHeroBox(ctx, heroId, x, y, w, h, label, imageCache){
    const hero = heroId ? heroById(heroId) : null; const name = hero ? hero.name : (heroId ? heroLabel(heroId) : '-'); const img = heroId && imageCache ? imageCache.get(heroId) : null;
    roundRect(ctx,x,y,w,h,14,true,false,'rgba(0,0,0,.22)');
    if(h >= 90){
      const size = 48; const imgX = x + (w - size) / 2; const imgY = y + 9;
      if(img){ ctx.save(); roundRect(ctx,imgX,imgY,size,size,11,false,false); ctx.clip(); ctx.drawImage(img, imgX, imgY, size, size); ctx.restore(); }
      ctx.fillStyle = '#eef6ff'; ctx.textAlign = 'center'; ctx.font = 'bold 14px Arial'; wrapText(ctx, name || '-', x + w/2, y + 73, w - 14, 15, 'center');
      ctx.fillStyle = '#a8bacf'; ctx.font = '12px Arial'; ctx.fillText(label, x + w/2, y + h - 8); ctx.textAlign = 'left'; return;
    }
    let textX = x + 12; if(img){ const size = 42; const imgX = x + 10; const imgY = y + (h - size) / 2; ctx.save(); roundRect(ctx,imgX,imgY,size,size,10,false,false); ctx.clip(); ctx.drawImage(img, imgX, imgY, size, size); ctx.restore(); textX = imgX + size + 10; }
    ctx.fillStyle = '#eef6ff'; ctx.textAlign = 'left'; ctx.font = 'bold 18px Arial'; wrapText(ctx, name || '-', textX, y + 24, w - (textX - x) - 10, 20, 'left'); ctx.fillStyle = '#a8bacf'; ctx.font = '13px Arial'; ctx.fillText(label,textX,y+h-10); ctx.textAlign = 'left';
  }
  function drawSimulationResult(ctx, sim, x, y, w, h){
    roundRect(ctx,x,y,w,h,24,true,false,'rgba(245,196,81,.09)'); ctx.strokeStyle = 'rgba(245,196,81,.28)'; ctx.lineWidth = 2; roundRect(ctx,x,y,w,h,24,false,true);
    ctx.fillStyle = '#ffe3a2'; ctx.font = 'bold 24px Arial'; ctx.fillText('Detailed Draft Analysis · MOBA HUB Estimate', x+28, y+42);
    ctx.fillStyle = '#eef6ff'; ctx.font = 'bold 32px Arial'; ctx.fillText(`${sim.blueName}: ${sim.bluePct}%`, x+28, y+86); ctx.fillText(`${sim.redName}: ${sim.redPct}%`, x+w/2+14, y+86);
    ctx.fillStyle = '#a8bacf'; ctx.font = '18px Arial'; wrapText(ctx, `${sim.summary} Confidence: ${sim.confidence}.`, x+28, y+120, w-56, 23);
    const colW=(w-82)/2, leftX=x+28, rightX=x+54+colW, top=y+180;
    const drawSection=(title,values,px,py,max=4)=>{ ctx.fillStyle='#ffe3a2';ctx.font='bold 17px Arial';ctx.fillText(title,px,py);let cy=py+26;ctx.fillStyle='#dce8f5';ctx.font='15px Arial';(values||[]).slice(0,max).forEach((value)=>{ctx.fillStyle='#f5c451';ctx.beginPath();ctx.arc(px+5,cy-5,3,0,Math.PI*2);ctx.fill();ctx.fillStyle='#dce8f5';cy=drawWrappedText(ctx,value,px+16,cy,colW-20,19,3)+7;});return cy;};
    let ly=top,ry=top;
    ly=drawSection(`${sim.blueName} · Why it can win`,sim.blueStrengths,leftX,ly,4); ly=drawSection('Risks / weaknesses',sim.blueRisks,leftX,ly+8,3); ly=drawSection('Win conditions',sim.blueWinConditions,leftX,ly+8,3); ly=drawSection('Hero contributions',sim.blueKeyHeroes,leftX,ly+8,3);
    ry=drawSection(`${sim.redName} · Why it can win`,sim.redStrengths,rightX,ry,4); ry=drawSection('Risks / weaknesses',sim.redRisks,rightX,ry+8,3); ry=drawSection('Win conditions',sim.redWinConditions,rightX,ry+8,3); ry=drawSection('Hero contributions',sim.redKeyHeroes,rightX,ry+8,3);
    ctx.fillStyle = '#8fa2b7'; ctx.font = '14px Arial'; ctx.fillText('Composition estimate only — not official match statistics. Player skill, execution, builds, and in-game decisions remain decisive.', x+28, y+h-24);
  }
  function drawWrappedText(ctx,text,x,y,maxWidth,lineHeight,maxLines=4){
    const words=String(text||'').split(/\s+/);let line='',lines=0,cy=y;
    for(let i=0;i<words.length;i++){const test=(line?line+' ':'')+words[i];if(ctx.measureText(test).width>maxWidth&&line){ctx.fillText(line,x,cy);cy+=lineHeight;lines++;line=words[i];if(lines>=maxLines-1){const rest=[line,...words.slice(i+1)].join(' ');let clipped=rest;while(clipped.length&&ctx.measureText(clipped+'…').width>maxWidth)clipped=clipped.slice(0,-1);ctx.fillText(clipped+(clipped!==rest?'…':''),x,cy);return cy+lineHeight;}}else line=test;}if(line){ctx.fillText(line,x,cy);cy+=lineHeight;}return cy;
  }
  function roundRect(ctx,x,y,w,h,r,fill,stroke,fillStyle){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); if(fill){ ctx.fillStyle = fillStyle || ctx.fillStyle; ctx.fill(); } if(stroke) ctx.stroke(); }
  function wrapText(ctx,text,x,y,maxWidth,lineHeight,align){ const words = String(text).split(' '); let line = ''; const oldAlign = ctx.textAlign; if(align) ctx.textAlign = align; for(let n=0;n<words.length;n++){ const test = line + words[n] + ' '; if(ctx.measureText(test).width > maxWidth && n>0){ ctx.fillText(line.trim(),x,y); line = words[n] + ' '; y += lineHeight; } else line = test; } ctx.fillText(line.trim(),x,y); ctx.textAlign = oldAlign; }
  function confirmDialog({ title, message, confirmText = 'OK', cancelText = 'Cancel', danger = false, hero = null, actionType = '' } = {}){
    return new Promise((resolve) => {
      const overlay = document.createElement('div'); overlay.className = 'custom-confirm';
      const name = hero?.name || title || 'Confirm Action'; const heroVisual = hero ? heroAvatarHtml(hero, `custom-confirm-hero ${danger ? 'danger' : 'pick'}`, name) : `<div class="custom-confirm-icon ${danger ? 'danger' : ''}" aria-hidden="true">${danger ? '!' : '✓'}</div>`;
      const meta = hero ? heroMeta(hero) : null;
      const metaHtml = hero ? `<div class="confirm-hero-meta"><span><small>WR</small><b>${escapeHtml(formatOfficialRate(meta?.wr))}</b></span><span><small>PR</small><b>${escapeHtml(formatOfficialRate(meta?.pr))}</b></span><span><small>BR</small><b>${escapeHtml(formatOfficialRate(meta?.br))}</b></span></div><div class="confirm-hero-roles">${escapeHtml([...(hero.roles||[]),...(hero.lanes||[])].slice(0,4).join(' · ') || 'Role unavailable')}</div>` : '';
      overlay.innerHTML = `<div class="custom-confirm-card ${hero ? 'hero-action-card' : ''} ${danger ? 'danger-action' : 'pick-action'}" role="dialog" aria-modal="true">${heroVisual}<div class="custom-confirm-copy"><span class="confirm-action-kicker">${escapeHtml(actionType ? actionType.toUpperCase() : 'CONFIRM')}</span><h2>${escapeHtml(title || 'Confirm Action')}</h2>${metaHtml}<p>${escapeHtml(message || 'Are you sure?').replaceAll('\n','<br>')}</p></div><div class="custom-confirm-actions"><button class="secondary-btn" data-cancel>${escapeHtml(cancelText)}</button><button class="${danger ? 'danger-btn' : 'primary-btn'}" data-confirm>${escapeHtml(confirmText)}</button></div></div>`;
      document.body.appendChild(overlay); const cleanup = (value) => { overlay.remove(); resolve(value); };
      overlay.querySelector('[data-cancel]').addEventListener('click', () => cleanup(false)); overlay.querySelector('[data-confirm]').addEventListener('click', () => cleanup(true)); overlay.addEventListener('click', (e) => { if(e.target === overlay) cleanup(false); });
    });
  }
  function bindEvents(){
    ensureRoomSettingsUI(); ensurePendingPickPanel();
    if(els.createRoomBtn) els.createRoomBtn.addEventListener('click', createRoom); if(els.joinRoomBtn) els.joinRoomBtn.addEventListener('click', joinRoom); if(els.roomIdInput){ els.roomIdInput.addEventListener('input', uppercaseRoomCodeInput); els.roomIdInput.addEventListener('paste', () => setTimeout(uppercaseRoomCodeInput, 0)); els.roomIdInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') joinRoom(); }); }
    [els.copyRoomBtn, els.copyRoomTopBtn].filter(Boolean).forEach((btn) => btn.addEventListener('click', copyRoomId));
    if(els.startDraftBtn) els.startDraftBtn.addEventListener('click', startDraft); if(els.copyResultBtn) els.copyResultBtn.addEventListener('click', copyResult); if(els.deleteRoomBtn) els.deleteRoomBtn.addEventListener('click', deleteRoom); if(els.deleteRoomTopBtn) els.deleteRoomTopBtn.addEventListener('click', deleteRoom); if(els.leaveRoomBtn) els.leaveRoomBtn.addEventListener('click', leaveRoom);
    [els.downloadResultTopBtn, els.downloadResultTopBtn2, els.downloadResultBtn].filter(Boolean).forEach((btn) => btn.addEventListener('click', downloadResultPng));
    if(els.heroSearch) els.heroSearch.addEventListener('input', () => { clearTimeout(renderHeroGrid.searchTimer); renderHeroGrid.searchTimer = setTimeout(renderHeroGrid, 80); }); if(els.nextGameBtn) els.nextGameBtn.addEventListener('click', nextGame); if(els.backLobbyBtn) els.backLobbyBtn.addEventListener('click', leaveRoom); if(els.sessionDeleteBtn) els.sessionDeleteBtn.addEventListener('click', deleteRoom);
    document.querySelectorAll('.side-btn').forEach((btn) => btn.addEventListener('click', () => chooseSide(btn.dataset.side)));
    [els.teamANameInput, els.teamBNameInput].filter(Boolean).forEach((input) => input.addEventListener('change', updateTeamNames));
    document.querySelectorAll('[data-series]').forEach((btn) => btn.addEventListener('click', () => { if(els.seriesFormat) els.seriesFormat.value = normalizeSeriesKey(btn.dataset.series || 'bo3'); updateSeriesButtons(); })); updateSeriesButtons();
    if(els.navToggle && els.siteNav){
      const closeDraftNav = () => { els.siteNav.classList.remove('open'); els.navToggle.setAttribute('aria-expanded','false'); };
      els.navToggle.addEventListener('click', (event) => { event.stopPropagation(); const open = !els.siteNav.classList.contains('open'); els.siteNav.classList.toggle('open', open); els.navToggle.setAttribute('aria-expanded', open ? 'true' : 'false'); });
      els.siteNav.querySelectorAll('.nav-links a,.nav-links button').forEach((item) => { item.addEventListener('click', () => setTimeout(closeDraftNav,0)); });
      document.addEventListener('click', (event) => { if(!event.target.closest('#siteNav')) closeDraftNav(); });
      document.addEventListener('keydown', (event) => { if(event.key === 'Escape') closeDraftNav(); });
      window.addEventListener('pagehide', closeDraftNav); window.addEventListener('pageshow', closeDraftNav);
    }
    window.addEventListener('popstate', () => { const roomId = getRouteRoomId() || new URLSearchParams(location.search).get('room'); if(roomId && roomId !== currentRoomId) listenRoom(String(roomId).toUpperCase()); });
    window.addEventListener('resize', () => { maybeShowRotatePrompt(); renderProDraftTopbar(); updateRoomSettingsUI(); });
    updateGameVisuals();
  }
  bindEvents(); updateGameVisuals(); renderRoleFilters(); renderHeroGrid(true); renderDraftSequence(); initFirebase();
})();
