(() => {
  const CONFIG = window.HCI_GAME_CONFIG || { gameKey: 'HOK', gameName: 'Honor of Kings', roomPrefix: 'HOK', roles: ['ALL'], bansPerTeam: 4, turnSeconds: 45 };
  const PREPARE_SECONDS = 5;
  const DEFAULT_BEST_OF = 3;

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
    sessionModal: $('sessionModal'), sessionModalTitle: $('sessionModalTitle'), nextGameBtn: $('nextGameBtn'), backLobbyBtn: $('backLobbyBtn'), downloadResultBtn: $('downloadResultBtn'), toast: $('toast'),
    siteNav: $('siteNav'), navToggle: $('navToggle'), seriesOptions: document.querySelectorAll('[data-series]')
  };

  let db = null, auth = null, currentUser = null, currentRoomId = null, currentRoom = null, currentRole = 'SPECTATOR';
  let unsubscribeRoom = null, timerInterval = null, prepareTransitionTimer = null, activeLane = 'ALL', lastAutoScrollTurnKey = '', lastFinishedModalKey = '', autoResolveBusy = false, historySaving = false;
  let heroes = Array.isArray(window.HCI_HEROES) ? [...window.HCI_HEROES] : [];

  const ROLE_ICON_PATHS = {
    HOK: { ALL:'/assets/role-icons/hok/all.png', 'Clash Lane':'/assets/role-icons/hok/clash.png', Farm:'/assets/role-icons/hok/farm.png', Mid:'/assets/role-icons/hok/mid.png', Jungle:'/assets/role-icons/hok/jungle.png', Roam:'/assets/role-icons/hok/roam.png' },
    MLBB: { ALL:'/assets/role-icons/mlbb/all.png', 'EXP Lane':'/assets/role-icons/mlbb/exp.png', Jungle:'/assets/role-icons/mlbb/jungle.png', 'Mid Lane':'/assets/role-icons/mlbb/mid.png', 'Gold Lane':'/assets/role-icons/mlbb/gold.png', Roam:'/assets/role-icons/mlbb/roam.png' }
  };
  const FALLBACK_ROLE_ICON = '<svg viewBox="0 0 24 24"><path d="M12 3l7 4v10l-7 4-7-4V7l7-4Z"/><path d="M12 7v10M8 9l8 6M16 9l-8 6"/></svg>';

  function escapeHtml(value){ return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
  function setHidden(el, value){ if(el) el.hidden = Boolean(value); }
  function setText(el, value){ if(el) el.textContent = value; }
  function showToast(message){ if(!els.toast) return; els.toast.textContent = message; els.toast.hidden = false; clearTimeout(showToast.timer); showToast.timer = setTimeout(() => { els.toast.hidden = true; }, 2800); }
  function isConfigReady(){ const cfg = window.HCI_FIREBASE_CONFIG; return Boolean(cfg && cfg.apiKey && cfg.projectId && !String(cfg.apiKey).includes('PASTE')); }
  function roleIconHtml(role){ const gameKey = String(CONFIG.gameKey || 'HOK').toUpperCase(); const src = (ROLE_ICON_PATHS[gameKey] || ROLE_ICON_PATHS.HOK)[role] || (ROLE_ICON_PATHS[gameKey] || ROLE_ICON_PATHS.HOK).ALL; return src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(role)}" loading="lazy">` : FALLBACK_ROLE_ICON; }
  function heroById(id){ return heroes.find((hero) => hero.id === id) || null; }
  function heroLabel(id){ const hero = heroById(id); return hero ? hero.name : id || '-'; }
  function heroInitials(name){ return String(name || '?').split(/\s+|\.|-/).filter(Boolean).slice(0,2).map((p) => p[0]?.toUpperCase()).join('') || '?'; }
  function gameSlug(){ return String(CONFIG.gameKey || 'HOK').toLowerCase() === 'mlbb' ? 'mlbb' : 'hok'; }
  function gameHomeRoute(){ return `/${gameSlug()}/`; }
  function isDraftRoute(){ return location.pathname.split('/').filter(Boolean).includes('draft'); }
  function getRouteRoomId(){ const parts = location.pathname.split('/').filter(Boolean); const draftIndex = parts.indexOf('draft'); if(draftIndex >= 0 && parts[draftIndex + 2]) return decodeURIComponent(parts[draftIndex + 2]).toUpperCase(); return ''; }
  function draftRouteForRoom(roomId){ return `/draft/${gameSlug()}/${encodeURIComponent(roomId)}`; }
  function lobbyRouteForRoom(roomId){ return roomId ? `${gameHomeRoute()}?room=${encodeURIComponent(roomId)}` : gameHomeRoute(); }
  function pushRoute(path){ if(location.pathname + location.search !== path) history.pushState({ hciDraftRoute:true }, '', path); }
  function goToDraftRoute(roomId){ pushRoute(draftRouteForRoom(roomId)); }
  function goToLobbyRoute(roomId){ pushRoute(lobbyRouteForRoom(roomId)); }
  function gameNumber(room = currentRoom){ return Number(room?.gameNumber || 1); }
  function bestOf(room = currentRoom){ return Number(room?.bestOf || DEFAULT_BEST_OF); }
  function gameTitle(room = currentRoom){ return `Game ${gameNumber(room)} / Best of ${bestOf(room)}`; }
  function isHost(){ return Boolean(currentRoom && currentUser && currentRoom.hostUid === currentUser.uid); }
  function getSelectedBestOf(){ const value = Number(els.seriesFormat?.value || DEFAULT_BEST_OF); return value === 5 ? 5 : 3; }
  function uidForTeam(team, room = currentRoom){ return team === 'A' ? room?.teamAUid : room?.teamBUid; }
  function valuesForTeam(team, type, room = currentRoom){ const field = type === 'ban' ? (team === 'A' ? 'bansA' : 'bansB') : (team === 'A' ? 'picksA' : 'picksB'); return room?.[field] || []; }
  function displayTeams(room = currentRoom){ const number = gameNumber(room); const blue = blueTeamForGame(number); const red = redTeamForGame(number); return { left: blue, right: red, blue, red }; }
  function teamState(team, room = currentRoom){ return uidForTeam(team, room) ? (currentRole === team ? 'You' : 'Filled') : 'Empty'; }
  function updateSeriesButtons(){ const value = String(getSelectedBestOf()); document.querySelectorAll('[data-series]').forEach((btn) => { const active = btn.dataset.series === value; btn.classList.toggle('active', active); btn.setAttribute('aria-checked', active ? 'true' : 'false'); }); }
  function getBansPerTeam(){ return Number(CONFIG.bansPerTeam || (CONFIG.gameKey === 'MLBB' ? 5 : 4)); }
  function getTurnSeconds(){ return Number(CONFIG.turnSeconds || 45); }
  function generateRoomId(){ return `${CONFIG.roomPrefix || CONFIG.gameKey || 'HCI'}-${Math.floor(1000 + Math.random() * 90000)}`; }
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
  function isMobileAutoScroll(){ return window.matchMedia('(max-width: 760px)').matches; }
  function scrollToHeroPanel(){ if(isMobileAutoScroll() && els.heroPanel) els.heroPanel.scrollIntoView({behavior:'smooth', block:'start'}); }
  function scrollToDraftBoard(){ if(isMobileAutoScroll() && els.draftBoard) els.draftBoard.scrollIntoView({behavior:'smooth', block:'start'}); }
  function enterDraftFocus(){ document.body.classList.add('draft-active', 'route-draft-page'); }
  function leaveDraftFocus(){ document.body.classList.remove('draft-active', 'route-draft-page'); }
  function setNotice(message, isWarning = true){ if(!els.firebaseNotice) return; els.firebaseNotice.innerHTML = message; els.firebaseNotice.classList.toggle('warning', isWarning); els.firebaseNotice.hidden = false; }
  function saveRestore(){ if(currentRoomId) sessionStorage.setItem(`hciDraftRestore:${CONFIG.gameKey}`, JSON.stringify({ roomId: currentRoomId })); }
  function clearRestore(){ sessionStorage.removeItem(`hciDraftRestore:${CONFIG.gameKey}`); }
  function redirectToLogin(){ const next = encodeURIComponent(location.pathname + location.search + location.hash); location.href = `/?next=${next}`; }

  async function loadHeroesFromFirestore(){
    if(!db || CONFIG.gameKey !== 'HOK') return;
    try{
      const snapshot = await db.collection('heroes').orderBy('name').get();
      if(!snapshot.empty){
        heroes = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() })).map((hero) => ({ ...hero, image: hero.image || `/assets/game/hok/${hero.id}.png` }));
      }
    }catch(error){ console.warn('Using local hero database:', error.message); }
  }

  async function initFirebase(){
    if(!isConfigReady()){
      setText(els.connectionStatus, 'Firebase is not configured');
      setNotice('Firebase is not configured. Edit <strong>js/firebase-config.js</strong> to enable real-time rooms.');
      renderRoleFilters(); renderHeroGrid(); renderDraftSequence(); return;
    }
    try{
      if(!firebase.apps.length) firebase.initializeApp(window.HCI_FIREBASE_CONFIG);
      auth = firebase.auth(); db = firebase.firestore();
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      auth.onAuthStateChanged(async (user) => {
        if(!user || user.isAnonymous){ redirectToLogin(); return; }
        currentUser = user;
        if(els.signedUserMini){ const photo = user.photoURL ? `<img src="${escapeHtml(user.photoURL)}" alt="">` : '<span class="mini-avatar-fallback">HCI</span>'; els.signedUserMini.innerHTML = `${photo}<span>${escapeHtml(user.displayName || 'Profile')}</span>`; }
        setText(els.connectionStatus, 'Realtime ready');
        if(els.createRoomBtn) els.createRoomBtn.disabled = false;
        if(els.joinRoomBtn) els.joinRoomBtn.disabled = false;
        setHidden(els.firebaseNotice, true);
        await loadHeroesFromFirestore();
        renderRoleFilters(); renderHeroGrid(); renderDraftSequence(); restoreRoomIfNeeded();
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
    const roomName = (els.roomNameInput?.value || 'HCI Practice Room').trim().slice(0,36) || 'HCI Practice Room';
    const teamAName = (els.teamANameSeed?.value || 'Team A').trim().slice(0,24) || 'Team A';
    const teamBName = (els.teamBNameSeed?.value || 'Team B').trim().slice(0,24) || 'Team B';
    return {
      id: roomId, roomName, game: CONFIG.gameKey, bestOf: getSelectedBestOf(), gameNumber: 1, status:'lobby',
      hostUid: currentUser.uid, hostName: currentUser.displayName || 'Host', hostEmail: currentUser.email || '',
      teamAUid: currentUser.uid, teamBUid:'', teamAName, teamBName, spectatorUids: [],
      turnIndex:0, turnSeconds:getTurnSeconds(), prepareSeconds: PREPARE_SECONDS, bansPerTeam:getBansPerTeam(),
      bansA:[], bansB:[], picksA:[], picksB:[], selectedHeroIds:[], currentTurnStartedAt:null, prepareEndsAt:null,
      createdAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp(), finishedGames: []
    };
  }
  function restoreRoomIfNeeded(){ const params = new URLSearchParams(location.search); const roomParam = params.get('room') || getRouteRoomId(); if(roomParam) listenRoom(String(roomParam).toUpperCase()); }

  async function createRoom(){
    if(!db || !currentUser) return showToast('Please login with Google first.');
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
    if(!db || !currentUser) return showToast('Please login with Google first.');
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
      if(!doc.exists){ showToast('Room was deleted or is no longer available.'); resetLocalState(true); return; }
      currentRoom = doc.data(); inferRoleFromRoom(); saveRestore(); renderRoom();
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
      try{ await db.collection('draftRooms').doc(currentRoomId).update({ spectatorUids: firebase.firestore.FieldValue.arrayUnion(currentUser.uid), updatedAt: firebase.firestore.FieldValue.serverTimestamp() }); }catch(e){}
      currentRole = 'SPECTATOR'; renderRoom(); return showToast('You are viewing as Spectator.');
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
      await db.collection('draftRooms').doc(currentRoomId).update({ status:'preparing', turnIndex:0, bansA:[], bansB:[], picksA:[], picksB:[], selectedHeroIds:[], currentTurnStartedAt:null, prepareEndsAt, turnSeconds:getTurnSeconds(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      goToDraftRoute(currentRoomId);
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
    const action = step.type === 'ban' ? 'Ban' : 'Pick';
    const ok = await confirmDialog({
      title: `${action} ${hero.name}?`,
      message: `${teamName(step.team)} · ${step.side === 'BLUE' ? 'Blue Side' : 'Red Side'} · ${gameTitle(currentRoom)}`,
      confirmText: action,
      cancelText: 'Cancel',
      danger: step.type === 'ban'
    });
    if(!ok) return;
    const ref = db.collection('draftRooms').doc(currentRoomId);
    try{
      await db.runTransaction(async (tx) => {
        const snap = await tx.get(ref); if(!snap.exists) throw new Error('Room not found.');
        const room = snap.data(); const liveStep = draftSteps(room)[room.turnIndex];
        if(!liveStep) throw new Error('The draft is complete.');
        if(liveStep.team !== currentRole) throw new Error(`It is ${teamName(liveStep.team, room)}'s turn.`);
        const liveUnavailable = heroUnavailableReason(room, liveStep, hero.id);
        if(liveUnavailable === 'selected') throw new Error('This hero has already been selected or banned.');
        if(liveUnavailable === 'gbp-used') throw new Error(`${hero.name} was already used by ${teamName(liveStep.team, room)} and cannot be picked again.`);
        const field = fieldForStep(liveStep); const nextTurnIndex = Number(room.turnIndex || 0) + 1; const nextStatus = nextTurnIndex >= draftSteps(room).length ? 'finished' : 'drafting';
        tx.update(ref, { [field]: firebase.firestore.FieldValue.arrayUnion(hero.id), selectedHeroIds: firebase.firestore.FieldValue.arrayUnion(hero.id), turnIndex: nextTurnIndex, status: nextStatus, currentTurnStartedAt: nextStatus === 'drafting' ? firebase.firestore.FieldValue.serverTimestamp() : null, updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
      });
      setTimeout(scrollToDraftBoard, 180);
    }catch(error){ showToast(error.message); }
  }
  async function nextGame(){
    if(!currentRoom || !currentRoomId) return;
    if(!isHost()) return showToast('Only the host can continue to the next game.');
    const next = gameNumber() + 1; if(next > bestOf()) return showToast(`Best of ${bestOf()} is complete.`);
    const boardTeams = displayTeams(currentRoom);
    const summary = {
      gameNumber: gameNumber(),
      blueTeamKey: boardTeams.blue,
      redTeamKey: boardTeams.red,
      bansA: currentRoom.bansA || [], bansB: currentRoom.bansB || [],
      picksA: currentRoom.picksA || [], picksB: currentRoom.picksB || [],
      blueBans: valuesForTeam(boardTeams.blue, 'ban'), redBans: valuesForTeam(boardTeams.red, 'ban'),
      bluePicks: valuesForTeam(boardTeams.blue, 'pick'), redPicks: valuesForTeam(boardTeams.red, 'pick'),
      savedAtMillis: Date.now()
    };
    try{
      await db.collection('draftRooms').doc(currentRoomId).update({
        finishedGames: firebase.firestore.FieldValue.arrayUnion(summary),
        gameNumber: next, status:'lobby', turnIndex:0, bansA:[], bansB:[], picksA:[], picksB:[], selectedHeroIds:[], currentTurnStartedAt:null, prepareEndsAt:null, updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
      hideSessionModal(); goToLobbyRoute(currentRoomId);
    }catch(error){ showToast(error.message); }
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
  async function leaveRoom(){ resetLocalState(true); location.href = gameHomeRoute(); }
  function resetLocalState(clearStorage = true){
    if(unsubscribeRoom) unsubscribeRoom(); unsubscribeRoom = null; currentRoomId = null; currentRoom = null; currentRole = 'SPECTATOR';
    setHidden(els.setupPanel, false); setHidden(els.roomPanel, true); setHidden(els.draftStage, true); if(els.roomIdInput) els.roomIdInput.value = '';
    clearInterval(timerInterval); clearTimeout(prepareTransitionTimer); timerInterval = null; prepareTransitionTimer = null; hideSessionModal(); leaveDraftFocus(); document.body.classList.remove('room-lobby','room-preparing','room-drafting','room-finished'); if(clearStorage) clearRestore();
  }

  function renderRoom(){
    if(!currentRoom) return;
    const status = currentRoom.status || 'lobby';
    if((status === 'preparing' || status === 'drafting') && !isDraftRoute()) goToDraftRoute(currentRoom.id || currentRoomId);
    if(status === 'lobby' && isDraftRoute()){ hideSessionModal(); goToLobbyRoute(currentRoom.id || currentRoomId); }
    const isLobby = status === 'lobby', isPreparing = status === 'preparing', isDrafting = status === 'drafting', isFinished = status === 'finished';
    document.body.classList.toggle('room-lobby', isLobby); document.body.classList.toggle('room-preparing', isPreparing); document.body.classList.toggle('room-drafting', isDrafting); document.body.classList.toggle('room-finished', isFinished);
    if(isLobby){ leaveDraftFocus(); hideSessionModal(); lastFinishedModalKey = ''; } else { enterDraftFocus(); }
    setHidden(els.setupPanel, true); setHidden(els.roomPanel, false); setHidden(els.draftStage, isLobby);
    setText(els.roomNameDisplay, currentRoom.roomName || 'Draft Room'); setText(els.roomCodeDisplay, currentRoom.id || currentRoomId);
    setText(els.roomStatusDisplay, isPreparing ? 'Starting Soon' : isDrafting ? 'Drafting' : isFinished ? 'Finished' : 'Lobby');
    if(els.teamANameInput && els.teamANameInput !== document.activeElement) els.teamANameInput.value = teamName('A');
    if(els.teamBNameInput && els.teamBNameInput !== document.activeElement) els.teamBNameInput.value = teamName('B');
    const boardTeams = displayTeams(currentRoom); const leftTeam = boardTeams.left; const rightTeam = boardTeams.right;
    setText(els.teamATitle, teamName(leftTeam)); setText(els.teamBTitle, teamName(rightTeam)); setText(els.resultATitle, teamName(leftTeam)); setText(els.resultBTitle, teamName(rightTeam));
    setText(els.teamASideLabel, 'Blue Side'); setText(els.teamBSideLabel, 'Red Side'); setText(els.resultASideLabel, 'Blue Side'); setText(els.resultBSideLabel, 'Red Side');
    setText(els.teamAState, teamState(leftTeam)); setText(els.teamBState, teamState(rightTeam));
    setText(els.gameHeadline, gameTitle()); setText(els.focusRoomText, `${currentRoom.id || currentRoomId} · ${currentRoom.roomName || 'Draft Room'}`);
    document.querySelectorAll('.side-btn').forEach((btn) => btn.classList.toggle('active', btn.dataset.side === currentRole));
    setHidden(els.sidePicker, !isLobby); setHidden(els.startDraftBtn, !(isLobby && isHost())); if(els.startDraftBtn) els.startDraftBtn.disabled = !hasBothTeams();
    setHidden(els.copyResultBtn, !isFinished); setHidden(els.downloadResultTopBtn, !isFinished); setHidden(els.downloadResultTopBtn2, !isFinished); setHidden(els.deleteRoomBtn, !isHost()); setHidden(els.deleteRoomTopBtn, !isHost());
    const banCount = Number(currentRoom.bansPerTeam || getBansPerTeam()); renderSlots(els.teamABans, valuesForTeam(leftTeam, 'ban'), banCount, 'Ban'); renderSlots(els.teamBBans, valuesForTeam(rightTeam, 'ban'), banCount, 'Ban'); renderSlots(els.teamAPicks, valuesForTeam(leftTeam, 'pick'), 5, 'Pick'); renderSlots(els.teamBPicks, valuesForTeam(rightTeam, 'pick'), 5, 'Pick');
    renderDraftResult(); renderCurrentTurn(); renderDraftSequence(); renderHeroGrid(); ensurePrepareTransition(); startTimerRenderer(); handleMobileTurnAutoScroll(); maybeShowFinishedModal(); maybeSaveHistory();
  }
  function renderSlots(container, values, count, prefix){
    if(!container) return; container.innerHTML = '';
    for(let i=0;i<count;i++){
      const heroId = values[i]; const div = document.createElement('div'); div.className = `slot ${heroId ? 'filled' : ''}`;
      if(!heroId){ div.innerHTML = `<span class="slot-placeholder">${prefix} ${i+1}</span>`; container.appendChild(div); continue; }
      const hero = heroById(heroId); const name = hero ? hero.name : heroId; const image = hero?.image || ''; const initials = heroInitials(name);
      const avatar = image ? `<span class="slot-avatar"><img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" onerror="this.parentElement.textContent='${initials}'"></span>` : `<span class="slot-avatar">${initials}</span>`;
      div.innerHTML = `<span class="slot-media">${avatar}<span class="slot-copy"><strong class="slot-name">${escapeHtml(name)}</strong><small>${prefix} ${i+1}</small></span></span>`; container.appendChild(div);
    }
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
      const hero = heroById(heroId); const name = hero ? hero.name : heroId; const image = hero?.image || ''; box.className = `result-hero-box ${type} filled`; const avatar = image ? `<span class="result-avatar"><img src="${escapeHtml(image)}" alt="${escapeHtml(name)}" onerror="this.parentElement.textContent='${heroInitials(name)}'"></span>` : `<span class="result-avatar">${heroInitials(name)}</span>`; box.innerHTML = `${avatar}<span class="result-hero-info"><span class="result-hero-name">${escapeHtml(name)}</span><span class="result-hero-order">${type === 'ban' ? 'Ban' : 'Pick'} ${i+1}</span></span>`; container.appendChild(box);
    }
  }
  function renderCurrentTurn(){
    if(!currentRoom) return;
    if(currentRoom.status === 'lobby'){
      const sideText = hasBothTeams() ? `${teamName('A')} is ${sideForTeam('A')} · ${teamName('B')} is ${sideForTeam('B')}.` : 'Share the Room Code and wait until both teams are filled.';
      setText(els.currentTurnText, `${gameTitle()} Lobby`); setText(els.currentTurnHelp, sideText); setText(els.timerValue, '--'); return;
    }
    if(currentRoom.status === 'preparing'){ setText(els.currentTurnText, 'Draft starting soon'); setText(els.currentTurnHelp, 'All devices are entering the draft stage before the first turn starts.'); return; }
    if(currentRoom.status === 'finished'){ setText(els.currentTurnText, 'Draft complete'); setText(els.currentTurnHelp, isHost() ? 'Continue to the next game or download the result.' : 'Waiting for the host to continue.'); setText(els.timerValue, 'Done'); return; }
    const step = draftSteps(currentRoom)[currentRoom.turnIndex]; if(!step) return;
    setText(els.currentTurnText, `${teamName(step.team)} ${step.type.toUpperCase()}`);
    setText(els.currentTurnHelp, currentRole === step.team ? 'Your turn. Select a hero before the timer ends. If time runs out, the system will auto-random.' : `Waiting for ${teamName(step.team)}. If the timer ends, the system will auto-random.`);
  }
  function renderDraftSequence(){
    if(!els.draftSequence) return; const steps = draftSteps(currentRoom); els.draftSequence.innerHTML = '';
    steps.forEach((step, i) => { const chip = document.createElement('span'); chip.className = 'step-chip'; if(currentRoom){ if(i < currentRoom.turnIndex) chip.classList.add('done'); if(i === currentRoom.turnIndex && currentRoom.status === 'drafting') chip.classList.add('active'); } chip.textContent = `${step.side === 'BLUE' ? 'Blue' : 'Red'} · ${teamName(step.team)} ${step.type === 'ban' ? 'Ban' : 'Pick'}`; els.draftSequence.appendChild(chip); });
  }
  function renderRoleFilters(){
    if(!els.laneFilterButtons) return; els.laneFilterButtons.innerHTML = '';
    (CONFIG.roles || ['ALL']).forEach((role) => { const btn = document.createElement('button'); btn.type = 'button'; btn.className = `role-filter ${activeLane === role ? 'active' : ''}`; btn.title = role; btn.setAttribute('aria-label', role); btn.innerHTML = roleIconHtml(role); btn.addEventListener('click', () => { activeLane = role; renderRoleFilters(); renderHeroGrid(); }); els.laneFilterButtons.appendChild(btn); });
  }
  function miniRoleIcons(lanes){ return (lanes || []).slice(0,3).map((lane) => `<span class="mini-role" title="${escapeHtml(lane)}">${roleIconHtml(lane)}</span>`).join(''); }
  function renderHeroGrid(){
    if(!els.heroGrid) return; const search = (els.heroSearch?.value || '').trim().toLowerCase(); const selected = currentRoom?.selectedHeroIds || []; const step = currentRoom?.status === 'drafting' ? draftSteps(currentRoom)[currentRoom.turnIndex] : null; const canClick = step && currentRole === step.team;
    const filtered = heroes.filter((hero) => { const name = String(hero.name || '').toLowerCase(); const lanes = Array.isArray(hero.lanes) ? hero.lanes : []; const matchesSearch = !search || name.includes(search); const matchesLane = activeLane === 'ALL' || lanes.includes(activeLane); return matchesSearch && matchesLane; });
    els.heroGrid.innerHTML = '';
    filtered.forEach((hero) => {
      const locked = selected.includes(hero.id); const gbpLocked = Boolean(step && isPreviousPickLockedForStep(currentRoom, step, hero.id)); const disabledHero = hero.active === false; const btn = document.createElement('button'); btn.className = `hero-card ${locked ? 'locked' : ''} ${gbpLocked ? 'gbp-locked' : ''} ${disabledHero ? 'disabled-hero' : ''}`; btn.disabled = locked || gbpLocked || disabledHero || !canClick; const initials = heroInitials(hero.name); const avatar = hero.image ? `<span class="hero-avatar"><img src="${escapeHtml(hero.image)}" alt="${escapeHtml(hero.name)}" onerror="this.parentElement.textContent='${initials}'"></span>` : `<span class="hero-avatar">${initials}</span>`; const lockNote = gbpLocked ? '<span class="hero-lock-note">Used by your team</span>' : locked ? '<span class="hero-lock-note">Selected / Banned</span>' : ''; btn.innerHTML = `<span>${avatar}</span><span><span class="hero-name">${escapeHtml(hero.name)}</span>${lockNote}<span class="hero-lanes">${miniRoleIcons(hero.lanes || [])}</span></span>`; btn.addEventListener('click', () => selectHero(hero)); els.heroGrid.appendChild(btn);
    });
    if(!filtered.length) els.heroGrid.innerHTML = '<div class="notice compact">No heroes match this filter.</div>';
  }
  function timestampToMillis(value){ return value && value.toDate ? value.toDate().getTime() : 0; }
  async function beginDraftAfterPreparing(){
    if(!db || !currentRoomId) return;
    try{ const ref = db.collection('draftRooms').doc(currentRoomId); await db.runTransaction(async (tx) => { const snap = await tx.get(ref); if(!snap.exists) return; const room = snap.data(); if(room.status !== 'preparing') return; tx.update(ref, { status:'drafting', currentTurnStartedAt: firebase.firestore.FieldValue.serverTimestamp(), prepareEndsAt:null, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }); }); }catch(error){ console.warn(error.message); }
  }
  function prepareRemainingMs(){ if(!currentRoom || currentRoom.status !== 'preparing') return 0; const endsAt = timestampToMillis(currentRoom.prepareEndsAt); if(!endsAt) return PREPARE_SECONDS * 1000; return Math.max(0, endsAt - Date.now()); }
  function ensurePrepareTransition(){ clearTimeout(prepareTransitionTimer); prepareTransitionTimer = null; if(!currentRoom || currentRoom.status !== 'preparing') return; prepareTransitionTimer = setTimeout(beginDraftAfterPreparing, prepareRemainingMs() + 200); }
  function draftRemainingMs(room = currentRoom){ if(!room || room.status !== 'drafting' || !room.currentTurnStartedAt) return 0; const startedAt = timestampToMillis(room.currentTurnStartedAt) || 0; const duration = Number(room.turnSeconds || getTurnSeconds()) * 1000; return Math.max(0, (startedAt + duration) - Date.now()); }
  async function tryAutoResolveTurn(){
    if(autoResolveBusy || !db || !currentRoomId || !currentRoom || currentRoom.status !== 'drafting') return; if(draftRemainingMs(currentRoom) > 0) return; autoResolveBusy = true;
    try{ const ref = db.collection('draftRooms').doc(currentRoomId); await db.runTransaction(async (tx) => { const snap = await tx.get(ref); if(!snap.exists) return; const room = snap.data(); if(room.status !== 'drafting' || !room.currentTurnStartedAt) return; if(draftRemainingMs(room) > 0) return; const liveStep = draftSteps(room)[room.turnIndex]; if(!liveStep) return; const pool = availableHeroPool(room, liveStep); if(!pool.length) return; const randomHero = pool[Math.floor(Math.random() * pool.length)]; const field = fieldForStep(liveStep); const nextTurnIndex = Number(room.turnIndex || 0) + 1; const nextStatus = nextTurnIndex >= draftSteps(room).length ? 'finished' : 'drafting'; tx.update(ref, { [field]: firebase.firestore.FieldValue.arrayUnion(randomHero.id), selectedHeroIds: firebase.firestore.FieldValue.arrayUnion(randomHero.id), turnIndex: nextTurnIndex, status: nextStatus, currentTurnStartedAt: nextStatus === 'drafting' ? firebase.firestore.FieldValue.serverTimestamp() : null, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }); }); }catch(error){ console.warn('Auto random turn failed:', error.message); } finally { autoResolveBusy = false; }
  }
  function startTimerRenderer(){
    clearInterval(timerInterval); if(!currentRoom || (currentRoom.status !== 'drafting' && currentRoom.status !== 'preparing')) return;
    timerInterval = setInterval(() => { if(!currentRoom) return; if(currentRoom.status === 'preparing'){ const remaining = Math.ceil(prepareRemainingMs()/1000); setText(els.timerValue, `${Math.max(0, remaining)}s`); return; } if(currentRoom.status !== 'drafting' || !currentRoom.currentTurnStartedAt) return; const remainingMs = draftRemainingMs(currentRoom); const remaining = Math.ceil(remainingMs / 1000); setText(els.timerValue, `${Math.max(0, remaining)}s`); if(remainingMs <= 0) tryAutoResolveTurn(); }, 250);
  }
  function handleMobileTurnAutoScroll(){ if(!isMobileAutoScroll() || !currentRoom || currentRoom.status !== 'drafting') return; const step = draftSteps(currentRoom)[currentRoom.turnIndex]; if(!step || currentRole !== step.team) return; const key = `${currentRoom.id}-${currentRole}-${currentRoom.turnIndex}`; if(lastAutoScrollTurnKey === key) return; lastAutoScrollTurnKey = key; setTimeout(scrollToHeroPanel, 220); }
  function maybeShowFinishedModal(){ if(!currentRoom || currentRoom.status !== 'finished') return; const key = `${currentRoom.id}-${gameNumber()}`; if(lastFinishedModalKey === key) return; lastFinishedModalKey = key; setTimeout(showSessionModal, 350); }
  function showSessionModal(){
    if(!els.sessionModal) return;
    setText(els.sessionModalTitle, `${gameTitle()} Complete Result`);
    const card = els.sessionModal.querySelector('.session-modal-card');
    const info = card?.querySelector('p'); if(info) info.textContent = 'Draft result, estimated win chance, and action controls are shown below.';
    let body = card?.querySelector('.session-result-body');
    if(card && !body){ body = document.createElement('div'); body.className = 'session-result-body'; const actions = card.querySelector('.modal-actions'); card.insertBefore(body, actions || null); }
    if(body) body.innerHTML = buildResultModalHtml(currentRoom);
    if(els.nextGameBtn) els.nextGameBtn.disabled = gameNumber() >= bestOf() || !isHost();
    if(els.backLobbyBtn){ els.backLobbyBtn.disabled = false; els.backLobbyBtn.textContent = 'Leave Match'; }
    if(els.downloadResultBtn) els.downloadResultBtn.textContent = 'Download Result';
    setHidden(els.sessionModal, false);
  }
  function hideSessionModal(){ setHidden(els.sessionModal, true); }
  function roleTagsForHero(hero){
    const lanes = Array.isArray(hero?.lanes) ? hero.lanes : [];
    const tags = new Set();
    lanes.forEach((lane) => {
      const v = String(lane).toLowerCase();
      if(v.includes('jungle')) tags.add('jungle');
      if(v.includes('mid')) tags.add('mid');
      if(v.includes('roam')) tags.add('roam');
      if(v.includes('farm') || v.includes('gold')) tags.add('carry');
      if(v.includes('clash') || v.includes('exp')) tags.add('frontline');
    });
    if(!tags.size) tags.add('flex');
    return tags;
  }
  function draftFeatureScore(heroIds){
    const picked = (heroIds || []).map(heroById).filter(Boolean);
    const counts = { carry:0, jungle:0, mid:0, roam:0, frontline:0, flex:0 };
    picked.forEach((hero) => roleTagsForHero(hero).forEach((tag) => { counts[tag] = (counts[tag] || 0) + 1; }));
    const covered = ['carry','jungle','mid','roam','frontline'].filter((tag) => counts[tag] > 0).length;
    let score = 36 + covered * 7 + Math.min(10, picked.length * 2);
    if(counts.jungle && counts.roam) score += 4;
    if(counts.carry && counts.mid && counts.jungle) score += 4;
    if(counts.frontline && counts.roam) score += 3;
    ['carry','jungle','mid','roam'].forEach((tag) => { if(!counts[tag]) score -= 5; });
    const overload = Math.max(...Object.values(counts)); if(overload >= 4) score -= 7; else if(overload >= 3) score -= 3;
    return { score, counts, covered, picked };
  }
  function analyzeDraftResult(room = currentRoom){
    const board = displayTeams(room);
    const bluePicks = valuesForTeam(board.blue, 'pick', room); const redPicks = valuesForTeam(board.red, 'pick', room);
    const blue = draftFeatureScore(bluePicks); const red = draftFeatureScore(redPicks);
    const firstPickBoost = board.blue === blueTeamForGame(gameNumber(room)) ? 1 : 0;
    const diff = (blue.score + firstPickBoost) - red.score;
    const bluePct = Math.max(38, Math.min(62, Math.round(50 + diff * 0.85)));
    const redPct = 100 - bluePct;
    const leader = bluePct >= redPct ? 'blue' : 'red';
    const leaderName = leader === 'blue' ? teamName(board.blue, room) : teamName(board.red, room);
    const explainFor = (label, data, pct) => {
      const notes = [];
      if(data.covered >= 5) notes.push(`${label} has complete role coverage.`);
      else notes.push(`${label} covers ${data.covered}/5 core role groups.`);
      if(data.counts.jungle && data.counts.roam) notes.push('Jungle + Roam gives stronger tempo/setup.');
      if(data.counts.carry && data.counts.mid && data.counts.jungle) notes.push('Damage threats are spread across carry, mid, and jungle.');
      if(!data.counts.roam) notes.push('Draft lacks clear roam/utility protection.');
      if(!data.counts.jungle) notes.push('Draft lacks clear jungle tempo.');
      if(Math.max(...Object.values(data.counts)) >= 3) notes.push('Several heroes overlap roles, so execution risk is higher.');
      notes.push(`Estimated chance: ${pct}%.`);
      return notes;
    };
    return {
      bluePct, redPct, leader, leaderName,
      blueName: teamName(board.blue, room), redName: teamName(board.red, room),
      blueTeamKey: board.blue, redTeamKey: board.red,
      blueNotes: explainFor(teamName(board.blue, room), blue, bluePct), redNotes: explainFor(teamName(board.red, room), red, redPct),
      summary: `${leaderName} has the stronger estimated draft edge from role coverage, tempo setup, and composition balance. This is a simulator estimate, not official statistics.`
    };
  }
  function buildSimulationHtml(room, compact = false){
    const sim = analyzeDraftResult(room);
    const blueNotes = sim.blueNotes.slice(0, compact ? 2 : 4).map((n) => `<li>${escapeHtml(n)}</li>`).join('');
    const redNotes = sim.redNotes.slice(0, compact ? 2 : 4).map((n) => `<li>${escapeHtml(n)}</li>`).join('');
    return `<div class="sim-head"><span class="eyebrow">Estimated Draft Win Rate</span><strong>${escapeHtml(sim.blueName)} ${sim.bluePct}%</strong><b>vs</b><strong>${escapeHtml(sim.redName)} ${sim.redPct}%</strong></div><p>${escapeHtml(sim.summary)}</p><div class="sim-notes"><div><b>${escapeHtml(sim.blueName)}</b><ul>${blueNotes}</ul></div><div><b>${escapeHtml(sim.redName)}</b><ul>${redNotes}</ul></div></div><small class="sim-disclaimer">Simulation estimate only. It is not official win-rate data.</small>`;
  }
  function resultListHtml(ids, type){ return (ids || []).map((id, index) => `<span><b>${type} ${index+1}</b>${escapeHtml(heroLabel(id))}</span>`).join('') || '<span>-</span>'; }
  function buildResultModalHtml(room){
    const board = displayTeams(room); const banCount = Number(room?.bansPerTeam || getBansPerTeam());
    const blueBans = valuesForTeam(board.blue, 'ban', room).slice(0, banCount); const redBans = valuesForTeam(board.red, 'ban', room).slice(0, banCount);
    const bluePicks = valuesForTeam(board.blue, 'pick', room).slice(0, 5); const redPicks = valuesForTeam(board.red, 'pick', room).slice(0, 5);
    return `<div class="modal-result-grid"><section><h3>${escapeHtml(teamName(board.blue, room))} · Blue Side</h3><div class="modal-mini-list"><h4>Ban</h4>${resultListHtml(blueBans, 'B')}</div><div class="modal-mini-list"><h4>Pick</h4>${resultListHtml(bluePicks, 'P')}</div></section><section><h3>${escapeHtml(teamName(board.red, room))} · Red Side</h3><div class="modal-mini-list"><h4>Ban</h4>${resultListHtml(redBans, 'B')}</div><div class="modal-mini-list"><h4>Pick</h4>${resultListHtml(redPicks, 'P')}</div></section></div><div class="draft-sim-panel modal-sim">${buildSimulationHtml(room, true)}</div>`;
  }
  async function maybeSaveHistory(){
    if(historySaving || !db || !currentRoom || currentRoom.status !== 'finished' || !isHost()) return;
    const historyId = `${currentRoom.id || currentRoomId}_${gameNumber()}`; if(sessionStorage.getItem(`hciHistorySaved:${historyId}`)) return; historySaving = true;
    try{ const ref = db.collection('draftHistory').doc(historyId); const snap = await ref.get(); if(!snap.exists){ const boardTeams = displayTeams(currentRoom); await ref.set({ id: historyId, roomId: currentRoom.id || currentRoomId, roomName: currentRoom.roomName || 'Draft Room', game: CONFIG.gameKey, gameNumber: gameNumber(), bestOf: bestOf(), teamAName: teamName('A'), teamBName: teamName('B'), teamASide: sideForTeam('A'), teamBSide: sideForTeam('B'), blueTeamKey: boardTeams.blue, redTeamKey: boardTeams.red, blueTeamName: teamName(boardTeams.blue), redTeamName: teamName(boardTeams.red), bansA: currentRoom.bansA || [], bansB: currentRoom.bansB || [], picksA: currentRoom.picksA || [], picksB: currentRoom.picksB || [], blueBans: valuesForTeam(boardTeams.blue, 'ban'), redBans: valuesForTeam(boardTeams.red, 'ban'), bluePicks: valuesForTeam(boardTeams.blue, 'pick'), redPicks: valuesForTeam(boardTeams.red, 'pick'), participantUids: [currentRoom.teamAUid, currentRoom.teamBUid, currentRoom.hostUid].filter(Boolean), hostUid: currentRoom.hostUid, simulation: analyzeDraftResult(currentRoom), finishedAtMillis: Date.now(), createdAt: firebase.firestore.FieldValue.serverTimestamp() }); } sessionStorage.setItem(`hciHistorySaved:${historyId}`, '1'); }catch(error){ console.warn('History save failed:', error.message); }finally{ historySaving = false; }
  }

  async function copyRoomId(){ if(!currentRoomId) return; await navigator.clipboard.writeText(currentRoomId); showToast('Room Code copied.'); }
  async function copyResult(){ if(!currentRoom) return; const result = [`HCI MOBA Draft Hub - ${CONFIG.gameKey} - ${currentRoom.id}`, currentRoom.roomName || 'Draft Room', gameTitle(), `${teamName('A')} (${sideForTeam('A')}) Ban: ${(currentRoom.bansA || []).map(heroLabel).join(', ') || '-'}`, `${teamName('A')} Pick: ${(currentRoom.picksA || []).map(heroLabel).join(', ') || '-'}`, '', `${teamName('B')} (${sideForTeam('B')}) Ban: ${(currentRoom.bansB || []).map(heroLabel).join(', ') || '-'}`, `${teamName('B')} Pick: ${(currentRoom.picksB || []).map(heroLabel).join(', ') || '-'}`, '', `Estimated WR: ${analyzeDraftResult(currentRoom).blueName} ${analyzeDraftResult(currentRoom).bluePct}% vs ${analyzeDraftResult(currentRoom).redName} ${analyzeDraftResult(currentRoom).redPct}%`, analyzeDraftResult(currentRoom).summary].join('\n'); await navigator.clipboard.writeText(result); showToast('Result copied.'); }
  async function downloadResultPng(){
    if(!currentRoom) return showToast('Result is not available yet.');
    const canvas = document.createElement('canvas'); canvas.width = 1500; canvas.height = 1160; const ctx = canvas.getContext('2d');
    const allIds = [...(currentRoom.bansA || []), ...(currentRoom.picksA || []), ...(currentRoom.bansB || []), ...(currentRoom.picksB || [])]; const imageCache = await buildHeroImageCache(allIds);
    const gradient = ctx.createLinearGradient(0,0,1500,1160); gradient.addColorStop(0,'#071018'); gradient.addColorStop(0.55,'#0d2030'); gradient.addColorStop(1,'#0a111b'); ctx.fillStyle = gradient; ctx.fillRect(0,0,1500,1160);
    roundRect(ctx,42,42,1416,1076,34,true,false,'rgba(255,255,255,.055)'); ctx.strokeStyle = 'rgba(245,196,81,.44)'; ctx.lineWidth = 3; roundRect(ctx,42,42,1416,1076,34,false,true);
    ctx.fillStyle = '#ffe3a2'; ctx.font = 'bold 34px Arial'; ctx.fillText('HCI MOBA Draft Hub',82,108); ctx.fillStyle = '#eef6ff'; ctx.font = 'bold 54px Arial'; ctx.fillText(`${CONFIG.gameKey} ${gameTitle()} Result`,82,172);
    ctx.fillStyle = '#a8bacf'; ctx.font = '23px Arial'; ctx.fillText(`${currentRoom.roomName || 'Draft Room'} · Room ${currentRoom.id || currentRoomId}`,82,214);
    const boardTeams = displayTeams(currentRoom);
    drawTeamResult(ctx, `${teamName(boardTeams.blue)} · Blue Side`, valuesForTeam(boardTeams.blue, 'ban'), valuesForTeam(boardTeams.blue, 'pick'), 82,250, '#4dabf7', imageCache);
    drawTeamResult(ctx, `${teamName(boardTeams.red)} · Red Side`, valuesForTeam(boardTeams.red, 'ban'), valuesForTeam(boardTeams.red, 'pick'), 770,250, '#ff6b6b', imageCache);
    drawSimulationResult(ctx, analyzeDraftResult(currentRoom), 82,850, 1336, 210);
    ctx.fillStyle = '#a8bacf'; ctx.font = '22px Arial'; ctx.fillText(new Date().toLocaleString('en-GB', { hour12:false }),82,1085);
    const a = document.createElement('a'); a.download = `hci-${String(CONFIG.gameKey).toLowerCase()}-${String(currentRoom.id || currentRoomId).toLowerCase()}-game-${gameNumber()}-result.png`; a.href = canvas.toDataURL('image/png'); a.click(); showToast('Result PNG downloaded.');
  }
  async function buildHeroImageCache(heroIds){ const ids = [...new Set((heroIds || []).filter(Boolean))]; const entries = await Promise.all(ids.map(async (heroId) => { const hero = heroById(heroId); if(!hero?.image) return [heroId, null]; const img = await loadImageSafe(hero.image); return [heroId, img]; })); return new Map(entries); }
  function loadImageSafe(src){ return new Promise((resolve) => { if(!src) return resolve(null); const img = new Image(); img.crossOrigin = 'anonymous'; img.onload = () => resolve(img); img.onerror = () => resolve(null); img.src = src; }); }
  function drawTeamResult(ctx, title, bans, picks, x, y, color, imageCache){
    const banCount = Number(currentRoom.bansPerTeam || getBansPerTeam()); roundRect(ctx,x,y,648,570,28,true,false,'rgba(255,255,255,.055)'); ctx.fillStyle = color; ctx.font = 'bold 30px Arial'; ctx.fillText(title,x+28,y+52); ctx.fillStyle = '#ffe3a2'; ctx.font = 'bold 23px Arial'; ctx.fillText('BAN',x+28,y+102);
    const banW = banCount === 5 ? 108 : 128; for(let i=0;i<banCount;i++) drawHeroBox(ctx, bans[i], x+28+i*(banW+10), y+122, banW, 104, `Ban ${i+1}`, imageCache);
    ctx.fillStyle = '#ffe3a2'; ctx.font = 'bold 23px Arial'; ctx.fillText('PICK',x+28,y+270); for(let i=0;i<5;i++) drawHeroBox(ctx, picks[i], x+28, y+292+i*58, 590, 52, `Pick ${i+1}`, imageCache);
  }
  function drawHeroBox(ctx, heroId, x, y, w, h, label, imageCache){
    const hero = heroId ? heroById(heroId) : null; const name = hero ? hero.name : (heroId ? heroLabel(heroId) : '-'); const img = heroId && imageCache ? imageCache.get(heroId) : null; roundRect(ctx,x,y,w,h,14,true,false,'rgba(0,0,0,.22)'); let textX = x + 12; const textTop = y + (h >= 90 ? 72 : 24);
    if(img){ const size = h >= 90 ? 58 : 42; const imgX = h >= 90 ? x + (w - size) / 2 : x + 10; const imgY = h >= 90 ? y + 10 : y + (h - size) / 2; ctx.save(); roundRect(ctx,imgX,imgY,size,size,10,false,false); ctx.clip(); ctx.drawImage(img, imgX, imgY, size, size); ctx.restore(); textX = h >= 90 ? x + 8 : imgX + size + 10; }
    ctx.fillStyle = '#eef6ff'; ctx.textAlign = h >= 90 ? 'center' : 'left'; ctx.font = h >= 90 ? 'bold 16px Arial' : 'bold 18px Arial'; wrapText(ctx, name || '-', h >= 90 ? x + w/2 : textX, textTop, h >= 90 ? w - 16 : w - (textX - x) - 10, h >= 90 ? 17 : 20, h >= 90 ? 'center' : 'left'); ctx.fillStyle = '#a8bacf'; ctx.font = '13px Arial'; ctx.fillText(label,h >= 90 ? x + w/2 : textX,y+h-10); ctx.textAlign = 'left';
  }
  function drawSimulationResult(ctx, sim, x, y, w, h){
    roundRect(ctx,x,y,w,h,24,true,false,'rgba(245,196,81,.09)'); ctx.strokeStyle = 'rgba(245,196,81,.28)'; ctx.lineWidth = 2; roundRect(ctx,x,y,w,h,24,false,true);
    ctx.fillStyle = '#ffe3a2'; ctx.font = 'bold 24px Arial'; ctx.fillText('Estimated Draft Win Rate Simulation', x+28, y+42);
    ctx.fillStyle = '#eef6ff'; ctx.font = 'bold 34px Arial'; ctx.fillText(`${sim.blueName}: ${sim.bluePct}%`, x+28, y+88); ctx.fillText(`${sim.redName}: ${sim.redPct}%`, x+420, y+88);
    ctx.fillStyle = '#a8bacf'; ctx.font = '19px Arial'; wrapText(ctx, sim.summary, x+28, y+126, w-56, 24);
    ctx.font = '16px Arial'; ctx.fillText('Simulation estimate only, not official statistics.', x+28, y+h-24);
  }
  function roundRect(ctx,x,y,w,h,r,fill,stroke,fillStyle){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); if(fill){ ctx.fillStyle = fillStyle || ctx.fillStyle; ctx.fill(); } if(stroke) ctx.stroke(); }
  function wrapText(ctx,text,x,y,maxWidth,lineHeight,align){ const words = String(text).split(' '); let line = ''; const oldAlign = ctx.textAlign; if(align) ctx.textAlign = align; for(let n=0;n<words.length;n++){ const test = line + words[n] + ' '; if(ctx.measureText(test).width > maxWidth && n>0){ ctx.fillText(line.trim(),x,y); line = words[n] + ' '; y += lineHeight; } else line = test; } ctx.fillText(line.trim(),x,y); ctx.textAlign = oldAlign; }
  function confirmDialog({ title, message, confirmText = 'OK', cancelText = 'Cancel', danger = false } = {}){ return new Promise((resolve) => { const overlay = document.createElement('div'); overlay.className = 'custom-confirm'; overlay.innerHTML = `<div class="custom-confirm-card" role="dialog" aria-modal="true"><div class="custom-confirm-icon ${danger ? 'danger' : ''}" aria-hidden="true">${danger ? '!' : '✓'}</div><div class="custom-confirm-copy"><h2>${escapeHtml(title || 'Confirm Action')}</h2><p>${escapeHtml(message || 'Are you sure?')}</p></div><div class="custom-confirm-actions"><button class="secondary-btn" data-cancel>${escapeHtml(cancelText)}</button><button class="${danger ? 'danger-btn' : 'primary-btn'}" data-confirm>${escapeHtml(confirmText)}</button></div></div>`; document.body.appendChild(overlay); const cleanup = (value) => { overlay.remove(); resolve(value); }; overlay.querySelector('[data-cancel]').addEventListener('click', () => cleanup(false)); overlay.querySelector('[data-confirm]').addEventListener('click', () => cleanup(true)); overlay.addEventListener('click', (e) => { if(e.target === overlay) cleanup(false); }); }); }
  function bindEvents(){
    if(els.createRoomBtn) els.createRoomBtn.addEventListener('click', createRoom); if(els.joinRoomBtn) els.joinRoomBtn.addEventListener('click', joinRoom); if(els.roomIdInput) els.roomIdInput.addEventListener('keydown', (e) => { if(e.key === 'Enter') joinRoom(); });
    [els.copyRoomBtn, els.copyRoomTopBtn].filter(Boolean).forEach((btn) => btn.addEventListener('click', copyRoomId));
    if(els.startDraftBtn) els.startDraftBtn.addEventListener('click', startDraft); if(els.copyResultBtn) els.copyResultBtn.addEventListener('click', copyResult); if(els.deleteRoomBtn) els.deleteRoomBtn.addEventListener('click', deleteRoom); if(els.deleteRoomTopBtn) els.deleteRoomTopBtn.addEventListener('click', deleteRoom); if(els.leaveRoomBtn) els.leaveRoomBtn.addEventListener('click', leaveRoom);
    [els.downloadResultTopBtn, els.downloadResultTopBtn2, els.downloadResultBtn].filter(Boolean).forEach((btn) => btn.addEventListener('click', downloadResultPng));
    if(els.heroSearch) els.heroSearch.addEventListener('input', renderHeroGrid); if(els.nextGameBtn) els.nextGameBtn.addEventListener('click', nextGame); if(els.backLobbyBtn) els.backLobbyBtn.addEventListener('click', leaveRoom);
    document.querySelectorAll('.side-btn').forEach((btn) => btn.addEventListener('click', () => chooseSide(btn.dataset.side)));
    [els.teamANameInput, els.teamBNameInput].filter(Boolean).forEach((input) => input.addEventListener('change', updateTeamNames));
    document.querySelectorAll('[data-series]').forEach((btn) => btn.addEventListener('click', () => { if(els.seriesFormat) els.seriesFormat.value = btn.dataset.series === '5' ? '5' : '3'; updateSeriesButtons(); })); updateSeriesButtons();
    if(els.navToggle && els.siteNav){ els.navToggle.addEventListener('click', () => { const open = !els.siteNav.classList.contains('open'); els.siteNav.classList.toggle('open', open); els.navToggle.setAttribute('aria-expanded', open ? 'true' : 'false'); }); }
    window.addEventListener('popstate', () => { const roomId = getRouteRoomId() || new URLSearchParams(location.search).get('room'); if(roomId && roomId !== currentRoomId) listenRoom(String(roomId).toUpperCase()); });
  }
  bindEvents(); renderRoleFilters(); renderHeroGrid(); renderDraftSequence(); initFirebase();
})();
