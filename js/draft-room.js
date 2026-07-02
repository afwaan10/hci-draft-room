(() => {
  const CONFIG = window.HCI_GAME_CONFIG || { gameKey: "HOK", gameName: "HOK Draft Room", roomPrefix: "HOK", roles: ["ALL", "Clash Lane", "Jungle", "Mid", "Farm", "Roam"] };
  const DRAFT_STEPS = [
    { team: "A", type: "ban", label: "A Ban 1" }, { team: "B", type: "ban", label: "B Ban 1" },
    { team: "A", type: "ban", label: "A Ban 2" }, { team: "B", type: "ban", label: "B Ban 2" },
    { team: "A", type: "pick", label: "A Pick 1" }, { team: "B", type: "pick", label: "B Pick 1" },
    { team: "B", type: "pick", label: "B Pick 2" }, { team: "A", type: "pick", label: "A Pick 2" },
    { team: "A", type: "pick", label: "A Pick 3" }, { team: "B", type: "pick", label: "B Pick 3" },
    { team: "A", type: "ban", label: "A Ban 3" }, { team: "B", type: "ban", label: "B Ban 3" },
    { team: "A", type: "ban", label: "A Ban 4" }, { team: "B", type: "ban", label: "B Ban 4" },
    { team: "B", type: "pick", label: "B Pick 4" }, { team: "A", type: "pick", label: "A Pick 4" },
    { team: "A", type: "pick", label: "A Pick 5" }, { team: "B", type: "pick", label: "B Pick 5" }
  ];
  const TURN_SECONDS = 45;
  const MAX_GAMES = 3;
  const $ = (id) => document.getElementById(id);
  const els = {
    connectionStatus: $("connectionStatus"), setupPanel: $("setupPanel") || $("create-room"), roomPanel: $("roomPanel"),
    draftStage: $("draftStage") || document.querySelector(".draft-stage"), draftFocusHeader: $("draftFocusHeader"), focusRoomText: $("focusRoomText"), gameHeadline: $("gameHeadline"),
    createRoomBtn: $("createRoomBtn"), joinRoomBtn: $("joinRoomBtn"), roomIdInput: $("roomIdInput"), firebaseNotice: $("firebaseNotice"),
    roomCodeDisplay: $("roomCodeDisplay"), copyRoomBtn: $("copyRoomBtn"), copyRoomTopBtn: $("copyRoomTopBtn"),
    roomStatusDisplay: $("roomStatusDisplay"), sidePicker: $("sidePicker"), currentTurnText: $("currentTurnText"), currentTurnHelp: $("currentTurnHelp"), timerValue: $("timerValue"),
    startDraftBtn: $("startDraftBtn"), copyResultBtn: $("copyResultBtn"), deleteRoomBtn: $("deleteRoomBtn"), deleteRoomTopBtn: $("deleteRoomTopBtn"), leaveRoomBtn: $("leaveRoomBtn"), downloadResultTopBtn: $("downloadResultTopBtn"),
    teamABans: $("teamABans"), teamBBans: $("teamBBans"), teamAPicks: $("teamAPicks"), teamBPicks: $("teamBPicks"), teamAState: $("teamAState"), teamBState: $("teamBState"),
    heroSearch: $("heroSearch"), laneFilterButtons: $("laneFilterButtons"), draftSequence: $("draftSequence"), heroGrid: $("heroGrid"), draftBoard: $("draftBoard"), heroPanel: $("heroPanel"),
    draftResultPanel: $("draftResultPanel"), resultGameTitle: $("resultGameTitle"), resultABans: $("resultABans"), resultBBans: $("resultBBans"), resultAPicks: $("resultAPicks"), resultBPicks: $("resultBPicks"),
    sessionModal: $("sessionModal"), sessionModalTitle: $("sessionModalTitle"), nextGameBtn: $("nextGameBtn"), backLobbyBtn: $("backLobbyBtn"), downloadResultBtn: $("downloadResultBtn"), toast: $("toast")
  };

  let db = null, auth = null, currentUser = null, currentRoomId = null, currentRoom = null, currentRole = null, unsubscribeRoom = null, timerInterval = null;
  let heroes = Array.isArray(window.HCI_HEROES) ? [...window.HCI_HEROES] : [];
  let activeLane = "ALL", lastAutoScrollTurnKey = "", lastFinishedModalKey = "";

  const ROLE_ICON_PATHS = {
    HOK: {
      "ALL": "/assets/role-icons/hok/all.png", "Clash Lane": "/assets/role-icons/hok/clash.png", "Farm": "/assets/role-icons/hok/farm.png", "Mid": "/assets/role-icons/hok/mid.png", "Jungle": "/assets/role-icons/hok/jungle.png", "Roam": "/assets/role-icons/hok/roam.png"
    },
    MLBB: {
      "ALL": "/assets/role-icons/mlbb/all.png", "EXP Lane": "/assets/role-icons/mlbb/exp.png", "Jungle": "/assets/role-icons/mlbb/jungle.png", "Mid Lane": "/assets/role-icons/mlbb/mid.png", "Gold Lane": "/assets/role-icons/mlbb/gold.png", "Roam": "/assets/role-icons/mlbb/roam.png"
    }
  };
  const FALLBACK_ROLE_ICON = '<svg viewBox="0 0 24 24"><path d="M12 3l7 4v10l-7 4-7-4V7l7-4Z"/><path d="M12 7v10M8 9l8 6M16 9l-8 6"/></svg>';

  function escapeHtml(value){ return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
  function setHidden(el, value){ if(el) el.hidden = Boolean(value); }
  function setText(el, value){ if(el) el.textContent = value; }
  function setHtml(el, value){ if(el) el.innerHTML = value; }
  function showToast(message){ if(!els.toast) return; els.toast.textContent = message; setHidden(els.toast, false); clearTimeout(showToast.timer); showToast.timer = setTimeout(() => setHidden(els.toast, true), 2600); }
  function isConfigReady(){ const cfg = window.HCI_FIREBASE_CONFIG; return Boolean(cfg && typeof cfg === "object" && cfg.apiKey && !String(cfg.apiKey).includes("PASTE") && cfg.projectId && !String(cfg.projectId).includes("PASTE")); }
  function roleIconHtml(role){ const gameKey = String(CONFIG.gameKey || "HOK").toUpperCase(); const gameIcons = ROLE_ICON_PATHS[gameKey] || ROLE_ICON_PATHS.HOK; const src = gameIcons[role] || gameIcons.ALL; return src ? `<img src="${escapeHtml(src)}" alt="${escapeHtml(role)}" loading="lazy">` : FALLBACK_ROLE_ICON; }
  function heroById(id){ return heroes.find((hero) => hero.id === id) || null; }
  function heroLabel(id){ const hero = heroById(id); return hero ? hero.name : id || "-"; }
  function heroInitials(name){ return String(name||"?").split(/\s+|\.|-/).filter(Boolean).slice(0,2).map((p)=>p[0]?.toUpperCase()).join("") || "?"; }
  function generateRoomId(){ const prefix = CONFIG.roomPrefix || CONFIG.gameKey || "HCI"; const number = Math.floor(1 + Math.random() * 100000); return `${prefix}-${number}`; }
  function gameNumber(){ return Number(currentRoom?.gameNumber || 1); }
  function gameTitle(){ return `Game ${gameNumber()} / Best of 3`; }
  function gameSlug(){ return String(CONFIG.gameKey || "HOK").toLowerCase() === "mlbb" ? "mlbb" : "hok"; }
  function gameHomeRoute(){ return `/${gameSlug()}/`; }
  function isDraftRoute(){ return location.pathname.split("/").filter(Boolean).includes("draft"); }
  function getRouteRoomId(){ const parts = location.pathname.split("/").filter(Boolean); const draftIndex = parts.indexOf("draft"); if(draftIndex >= 0 && parts[draftIndex + 2]) return decodeURIComponent(parts[draftIndex + 2]).toUpperCase(); return ""; }
  function draftRouteForRoom(roomId){ return `/draft/${gameSlug()}/${encodeURIComponent(roomId)}`; }
  function lobbyRouteForRoom(roomId){ return `${gameHomeRoute()}?room=${encodeURIComponent(roomId)}&role=${encodeURIComponent(currentRole || "SPECTATOR")}`; }
  function goToDraftRoute(roomId){ saveRestore(); if(location.pathname !== draftRouteForRoom(roomId)) location.href = draftRouteForRoom(roomId); }
  function goToLobbyRoute(roomId){ saveRestore(); location.href = lobbyRouteForRoom(roomId); }
  function isHost(){ return Boolean(currentRoom && currentUser && currentRoom.hostUid === currentUser.uid); }
  function isController(){ return isHost() || currentRole === "A"; }
  function isMobileAutoScroll(){ return window.matchMedia("(max-width: 760px)").matches; }
  function scrollToHeroPanel(){ if(!isMobileAutoScroll()) return; const heroPanel = document.getElementById("heroPanel"); if(heroPanel) heroPanel.scrollIntoView({behavior:"smooth",block:"start"}); }
  function scrollToDraftBoard(){ if(!isMobileAutoScroll()) return; const draftBoard = document.getElementById("draftBoard"); if(draftBoard) draftBoard.scrollIntoView({behavior:"smooth",block:"start"}); }
  function enterDraftFocus(){ document.body.classList.add("draft-active"); document.body.classList.add("route-draft-page"); }
  function leaveDraftFocus(){ document.body.classList.remove("draft-active"); document.body.classList.remove("route-draft-page"); }
  function saveRestore(){ if(currentRoomId && currentRole) sessionStorage.setItem(`hciDraftRestore:${CONFIG.gameKey}`, JSON.stringify({roomId:currentRoomId, role:currentRole})); }

  function setNotice(message, isWarning = true){ if(!els.firebaseNotice) return; els.firebaseNotice.innerHTML = message; els.firebaseNotice.classList.toggle("warning", isWarning); setHidden(els.firebaseNotice, false); }
  async function loadHeroesFromFirestore(){ if(!db || CONFIG.gameKey !== "HOK") return; try{ const snapshot = await db.collection("heroes").orderBy("name").get(); if(!snapshot.empty) heroes = snapshot.docs.map((doc)=>({id:doc.id,...doc.data()})); } catch(error){ console.warn("Using local hero database:", error.message); } }

  async function initFirebase(){
    if(!isConfigReady()){
      setText(els.connectionStatus, "Firebase is not configured");
      setNotice('Firebase is not configured. Edit <strong>js/firebase-config.js</strong> to enable real-time rooms.');
      renderRoleFilters(); renderHeroGrid(); renderDraftSequence(); return;
    }
    try{
      if(!firebase.apps.length) firebase.initializeApp(window.HCI_FIREBASE_CONFIG);
      auth = firebase.auth(); db = firebase.firestore();
      await auth.setPersistence(firebase.auth.Auth.Persistence.SESSION);
      const credential = auth.currentUser ? { user: auth.currentUser } : await auth.signInAnonymously();
      currentUser = credential.user;
      await loadHeroesFromFirestore();
      setText(els.connectionStatus, "Realtime ready");
      if(els.createRoomBtn) els.createRoomBtn.disabled = false;
      if(els.joinRoomBtn) els.joinRoomBtn.disabled = false;
      setHidden(els.firebaseNotice, true);
      renderRoleFilters(); renderHeroGrid(); renderDraftSequence(); restoreRoomIfNeeded();
    }catch(error){
      setText(els.connectionStatus, "Firebase error");
      const msg = String(error && (error.message || error.code) || "Firebase error");
      const extra = msg.includes("unauthorized-domain") ? '<br><br><strong>Fix:</strong> add <strong>draft.hokcommunity.my.id</strong> and <strong>afwaan10.github.io</strong> in Firebase Authentication → Settings → Authorized domains.' : '';
      setNotice('Firebase error: ' + escapeHtml(msg) + extra);
      showToast(msg); console.error(error);
    }
  }

  function baseRoomData(roomId){ return { id: roomId, game: CONFIG.gameKey, gameNumber: 1, status:"lobby", hostUid: currentUser.uid, teamAUid: currentUser.uid, teamBUid:"", teamAName:"Team A", teamBName:"Team B", turnIndex:0, turnSeconds:TURN_SECONDS, bansA:[], bansB:[], picksA:[], picksB:[], selectedHeroIds:[], draftSteps:DRAFT_STEPS, currentTurnStartedAt:null, createdAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() }; }
  function restoreRoomIfNeeded(){ const params = new URLSearchParams(location.search); const roomParam = params.get("room") || getRouteRoomId(); const roleParam = params.get("role"); let data = null; try{ data = JSON.parse(sessionStorage.getItem(`hciDraftRestore:${CONFIG.gameKey}`) || "null"); }catch{} const roomId = roomParam || data?.roomId; if(roomId){ currentRole = roleParam || data?.role || "SPECTATOR"; listenRoom(String(roomId).toUpperCase()); } }
  async function createRoom(){ if(!db || !currentUser) return showToast("Firebase is not ready."); try{ let roomId = generateRoomId(); let ref = db.collection("draftRooms").doc(roomId); let doc = await ref.get(); let tries = 0; while(doc.exists && tries < 15){ roomId = generateRoomId(); ref = db.collection("draftRooms").doc(roomId); doc = await ref.get(); tries++; } if(doc.exists) throw new Error("Could not generate a unique Room ID. Try again."); await ref.set(baseRoomData(roomId)); currentRole = "A"; listenRoom(roomId); showToast(`Room ${roomId} created`); }catch(error){ showToast(error.message); } }
  async function joinRoom(){ if(!db) return showToast("Firebase is not ready."); const roomId = (els.roomIdInput?.value || "").trim().toUpperCase(); if(!roomId) return showToast("Enter a Room ID first."); try{ const doc = await db.collection("draftRooms").doc(roomId).get(); if(!doc.exists) return showToast("Room not found."); if(doc.data().game && doc.data().game !== CONFIG.gameKey) return showToast(`This room is for ${doc.data().game}, not ${CONFIG.gameKey}.`); currentRole = "SPECTATOR"; listenRoom(roomId); showToast(`Joined ${roomId}. Choose Team B or Spectator.`); }catch(error){ showToast(error.message); } }
  function listenRoom(roomId){ if(unsubscribeRoom) unsubscribeRoom(); currentRoomId = roomId; unsubscribeRoom = db.collection("draftRooms").doc(roomId).onSnapshot((doc)=>{ if(!doc.exists){ showToast("Room was deleted or is no longer available."); resetLocalState(); return; } currentRoom = doc.data(); inferRoleFromRoom(); saveRestore(); renderRoom(); },(error)=>showToast(error.message)); setHidden(els.setupPanel, true); setHidden(els.roomPanel, false); }
  function inferRoleFromRoom(){ if(!currentUser || !currentRoom) return; if(currentRoom.teamAUid === currentUser.uid) currentRole = "A"; else if(currentRoom.teamBUid === currentUser.uid) currentRole = "B"; else if(!currentRole) currentRole = "SPECTATOR"; }
  async function chooseSide(side){ if(!currentRoom || !currentRoomId) return; if(side === "SPECTATOR"){ currentRole = "SPECTATOR"; saveRestore(); renderRoom(); return showToast("You are viewing as Spectator."); } const field = side === "A" ? "teamAUid" : "teamBUid"; if(currentRoom[field] && currentRoom[field] !== currentUser.uid) return showToast(`Team ${side} is already filled.`); try{ await db.collection("draftRooms").doc(currentRoomId).update({[field]: currentUser.uid, updatedAt: firebase.firestore.FieldValue.serverTimestamp()}); currentRole = side; saveRestore(); renderRoom(); showToast(`You joined Team ${side}.`); }catch(error){ showToast(error.message); } }
  async function startDraft(){ if(!currentRoom || !currentRoomId) return; if(!isController()) return showToast("Only the host or Team A can start the draft."); if(!currentRoom.teamBUid) return showToast("Team B has not joined yet."); try{ await db.collection("draftRooms").doc(currentRoomId).update({ status:"drafting", turnIndex:0, currentTurnStartedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() }); goToDraftRoute(currentRoomId); }catch(error){ showToast(error.message); } }

  async function selectHero(hero){
    if(!currentRoom || !currentRoomId || !hero) return; if(!hero.active) return showToast("This hero is disabled."); if(currentRoom.status !== "drafting") return showToast("The draft has not started."); const step = DRAFT_STEPS[currentRoom.turnIndex]; if(!step) return showToast("The draft is complete."); if(currentRole !== step.team) return showToast(`It is Team ${step.team}'s turn.`); if(currentRoom.selectedHeroIds?.includes(hero.id)) return showToast("This hero has already been selected or banned."); const ref = db.collection("draftRooms").doc(currentRoomId);
    try{ await db.runTransaction(async(tx)=>{ const snap = await tx.get(ref); if(!snap.exists) throw new Error("Room not found."); const room = snap.data(); const liveStep = DRAFT_STEPS[room.turnIndex]; if(!liveStep) throw new Error("The draft is complete."); if(liveStep.team !== currentRole) throw new Error(`It is Team ${liveStep.team}'s turn.`); if((room.selectedHeroIds || []).includes(hero.id)) throw new Error("This hero has already been selected or banned."); const field = liveStep.type === "ban" ? (liveStep.team === "A" ? "bansA" : "bansB") : (liveStep.team === "A" ? "picksA" : "picksB"); const nextTurnIndex = room.turnIndex + 1; const nextStatus = nextTurnIndex >= DRAFT_STEPS.length ? "finished" : "drafting"; tx.update(ref,{ [field]: firebase.firestore.FieldValue.arrayUnion(hero.id), selectedHeroIds: firebase.firestore.FieldValue.arrayUnion(hero.id), turnIndex: nextTurnIndex, status: nextStatus, currentTurnStartedAt: nextStatus === "drafting" ? firebase.firestore.FieldValue.serverTimestamp() : null, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }); }); setTimeout(scrollToDraftBoard,180); }catch(error){ showToast(error.message); }
  }
  async function nextGame(){ if(!currentRoom || !currentRoomId) return; if(!isController()) return showToast("Only the host or Team A can continue to the next game."); const next = gameNumber() + 1; if(next > MAX_GAMES) return showToast("Best of 3 is complete. Return to lobby for a new session."); try{ await db.collection("draftRooms").doc(currentRoomId).update({ gameNumber: next, status:"lobby", turnIndex:0, bansA:[], bansB:[], picksA:[], picksB:[], selectedHeroIds:[], currentTurnStartedAt:null, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }); hideSessionModal(); goToLobbyRoute(currentRoomId); }catch(error){ showToast(error.message); } }
  async function backToLobby(){ if(!currentRoom || !currentRoomId) return resetLocalState(true); if(isController()){ try{ await db.collection("draftRooms").doc(currentRoomId).update({ status:"lobby", currentTurnStartedAt:null, updatedAt: firebase.firestore.FieldValue.serverTimestamp() }); }catch(error){ showToast(error.message); } } hideSessionModal(); goToLobbyRoute(currentRoomId); }
  async function deleteRoom(){ if(!currentRoom || !isHost()) return showToast("Only the host can delete this room."); const ok = await confirmDialog({ title:"Delete Room?", message:`Room ${currentRoomId} will be removed for every device. This action cannot be undone.`, confirmText:"Delete Room", cancelText:"Cancel", danger:true }); if(!ok) return; try{ await db.collection("draftRooms").doc(currentRoomId).delete(); resetLocalState(true); showToast("Room deleted."); if(isDraftRoute()) location.href = gameHomeRoute(); }catch(error){ showToast(error.message); } }
  function leaveRoom(){ resetLocalState(true); if(isDraftRoute()) location.href = gameHomeRoute(); }
  function resetLocalState(clearStorage = true){ if(unsubscribeRoom) unsubscribeRoom(); unsubscribeRoom = null; currentRoomId = null; currentRoom = null; currentRole = null; setHidden(els.setupPanel, false); setHidden(els.roomPanel, true); setHidden(els.draftStage, true); if(els.roomIdInput) els.roomIdInput.value = ""; clearInterval(timerInterval); timerInterval = null; hideSessionModal(); leaveDraftFocus(); document.body.classList.remove("room-lobby","room-drafting","room-finished"); if(clearStorage) sessionStorage.removeItem(`hciDraftRestore:${CONFIG.gameKey}`); }

  function renderRoom(){
    if(!currentRoom) return;
    const status = currentRoom.status || "lobby";
    if(status === "drafting" && !isDraftRoute()){ goToDraftRoute(currentRoom.id || currentRoomId); return; }
    if(status === "lobby" && isDraftRoute()){ hideSessionModal(); goToLobbyRoute(currentRoom.id || currentRoomId); return; }
    const isLobby = status === "lobby";
    const isDrafting = status === "drafting";
    const isFinished = status === "finished";
    document.body.classList.toggle("room-lobby", isLobby);
    document.body.classList.toggle("room-drafting", isDrafting);
    document.body.classList.toggle("room-finished", isFinished);
    if(isLobby){ leaveDraftFocus(); hideSessionModal(); lastFinishedModalKey = ""; }
    else { enterDraftFocus(); }
    setHidden(els.setupPanel, true);
    setHidden(els.roomPanel, false);
    setHidden(els.draftStage, isLobby);
    setText(els.roomCodeDisplay, currentRoom.id || currentRoomId);
    setText(els.roomStatusDisplay, isDrafting ? "Drafting" : isFinished ? "Finished" : "Lobby");
    setText(els.teamAState, currentRoom.teamAUid ? (currentRole === "A" ? "You" : "Filled") : "Empty");
    setText(els.teamBState, currentRoom.teamBUid ? (currentRole === "B" ? "You" : "Filled") : "Empty");
    setText(els.gameHeadline, gameTitle());
    setText(els.focusRoomText, `${currentRoom.id || currentRoomId} · ${gameTitle()}`);
    document.querySelectorAll(".side-btn").forEach((btn)=>btn.classList.toggle("active",btn.dataset.side === currentRole));
    setHidden(els.sidePicker, !isLobby);
    setHidden(els.startDraftBtn, !(isLobby && isController()));
    if(els.startDraftBtn) els.startDraftBtn.disabled = !currentRoom.teamBUid;
    setHidden(els.copyResultBtn, !isFinished);
    setHidden(els.downloadResultTopBtn, !isFinished);
    setHidden(els.deleteRoomBtn, !isHost());
    setHidden(els.deleteRoomTopBtn, !isHost());
    renderSlots(els.teamABans,currentRoom.bansA || [],4,"Ban");
    renderSlots(els.teamBBans,currentRoom.bansB || [],4,"Ban");
    renderSlots(els.teamAPicks,currentRoom.picksA || [],5,"Pick");
    renderSlots(els.teamBPicks,currentRoom.picksB || [],5,"Pick");
    renderDraftResult(); renderCurrentTurn(); renderDraftSequence(); renderHeroGrid(); startTimerRenderer(); handleMobileTurnAutoScroll(); maybeShowFinishedModal();
  }
  function renderSlots(container,values,count,prefix){ if(!container) return; container.innerHTML = ""; for(let i=0;i<count;i++){ const heroId = values[i]; const div = document.createElement("div"); div.className = `slot ${heroId ? "filled" : ""}`; div.innerHTML = heroId ? `<span>${escapeHtml(heroLabel(heroId))}<small>${prefix} ${i+1}</small></span>` : `<span>${prefix} ${i+1}</span>`; container.appendChild(div); } }
  function renderDraftResult(){ if(!els.draftResultPanel || !currentRoom) return; const bansA = currentRoom.bansA || [], bansB = currentRoom.bansB || [], picksA = currentRoom.picksA || [], picksB = currentRoom.picksB || []; const complete = currentRoom.status === "finished" || (bansA.length >= 4 && bansB.length >= 4 && picksA.length >= 5 && picksB.length >= 5); setHidden(els.draftResultPanel, !complete); if(!complete) return; setText(els.resultGameTitle, `${gameTitle()} Draft Result`); renderResultBoxes(els.resultABans,bansA,4,"ban"); renderResultBoxes(els.resultBBans,bansB,4,"ban"); renderResultBoxes(els.resultAPicks,picksA,5,"pick"); renderResultBoxes(els.resultBPicks,picksB,5,"pick"); }
  function renderResultBoxes(container,heroIds,count,type){ if(!container) return; container.innerHTML = ""; for(let i=0;i<count;i++){ const heroId = heroIds[i]; const box = document.createElement("div"); if(!heroId){ box.className = `result-hero-box ${type} empty`; box.textContent = `${type === "ban" ? "Ban" : "Pick"} ${i+1}`; container.appendChild(box); continue; } const hero = heroById(heroId); const name = hero ? hero.name : heroId; const image = hero && hero.image ? hero.image : ""; box.className = `result-hero-box ${type} filled`; const avatar = image ? `<span class="result-avatar"><img src="${escapeHtml(image)}" alt="${escapeHtml(name)}"></span>` : `<span class="result-avatar">${heroInitials(name)}</span>`; box.innerHTML = `${avatar}<span class="result-hero-info"><span class="result-hero-name">${escapeHtml(name)}</span><span class="result-hero-order">${type === "ban" ? "Ban" : "Pick"} ${i+1}</span></span>`; container.appendChild(box); } }
  function renderCurrentTurn(){ if(!currentRoom) return; if(currentRoom.status === "lobby"){ setText(els.currentTurnText, "Waiting for draft to start"); setText(els.currentTurnHelp, currentRoom.teamBUid ? "Team B has joined. The host can start the draft." : "Share the Room ID with Team B."); setText(els.timerValue, "--"); return; } if(currentRoom.status === "finished"){ setText(els.currentTurnText, "Draft complete"); setText(els.currentTurnHelp, "Download the result or continue to the next game."); setText(els.timerValue, "Done"); return; } const step = DRAFT_STEPS[currentRoom.turnIndex]; setText(els.currentTurnText, `Team ${step.team} ${step.type.toUpperCase()}`); setText(els.currentTurnHelp, currentRole === step.team ? "Your turn. Select a hero from the database." : `Waiting for Team ${step.team} to choose a hero.`); }
  function renderDraftSequence(){ if(!els.draftSequence) return; els.draftSequence.innerHTML = ""; DRAFT_STEPS.forEach((step,i)=>{ const chip = document.createElement("span"); chip.className = "step-chip"; if(currentRoom){ if(i < currentRoom.turnIndex) chip.classList.add("done"); if(i === currentRoom.turnIndex && currentRoom.status === "drafting") chip.classList.add("active"); } chip.textContent = step.label; els.draftSequence.appendChild(chip); }); }
  function renderRoleFilters(){ if(!els.laneFilterButtons) return; els.laneFilterButtons.innerHTML = ""; (CONFIG.roles || ["ALL"]).forEach((role)=>{ const btn = document.createElement("button"); btn.type = "button"; btn.className = `role-filter ${activeLane === role ? "active" : ""}`; btn.title = role; btn.setAttribute("aria-label", role); btn.innerHTML = roleIconHtml(role); btn.addEventListener("click",()=>{ activeLane = role; renderRoleFilters(); renderHeroGrid(); }); els.laneFilterButtons.appendChild(btn); }); }
  function miniRoleIcons(lanes){ return (lanes || []).slice(0,3).map((lane)=>`<span class="mini-role" title="${escapeHtml(lane)}">${roleIconHtml(lane)}</span>`).join(""); }
  function renderHeroGrid(){ if(!els.heroGrid) return; const search = (els.heroSearch?.value || "").trim().toLowerCase(); const selected = currentRoom?.selectedHeroIds || []; const step = currentRoom?.status === "drafting" ? DRAFT_STEPS[currentRoom.turnIndex] : null; const canClick = step && currentRole === step.team; const filtered = heroes.filter((hero)=>{ const matchesSearch = !search || hero.name.toLowerCase().includes(search); const lanes = Array.isArray(hero.lanes) ? hero.lanes : []; const matchesLane = activeLane === "ALL" || lanes.includes(activeLane); return matchesSearch && matchesLane; }); els.heroGrid.innerHTML = ""; filtered.forEach((hero)=>{ const locked = selected.includes(hero.id); const disabledHero = hero.active === false; const btn = document.createElement("button"); btn.className = `hero-card ${locked ? "locked" : ""} ${disabledHero ? "disabled-hero" : ""}`; btn.disabled = locked || disabledHero || !canClick; const initials = heroInitials(hero.name); const avatar = hero.image ? `<span class="hero-avatar"><img src="${escapeHtml(hero.image)}" alt="${escapeHtml(hero.name)}" onerror="this.parentElement.textContent='${initials}'"></span>` : `<span class="hero-avatar">${initials}</span>`; btn.innerHTML = `<span>${avatar}</span><span><span class="hero-name">${escapeHtml(hero.name)}</span><span class="hero-lanes">${miniRoleIcons(hero.lanes || [])}</span></span>`; btn.addEventListener("click",()=>selectHero(hero)); els.heroGrid.appendChild(btn); }); if(!filtered.length) els.heroGrid.innerHTML = `<div class="notice compact">No heroes match this filter.</div>`; }
  function startTimerRenderer(){ clearInterval(timerInterval); if(!currentRoom || currentRoom.status !== "drafting") return; timerInterval = setInterval(()=>{ if(!currentRoom || currentRoom.status !== "drafting" || !currentRoom.currentTurnStartedAt) return; const startedAt = currentRoom.currentTurnStartedAt.toDate ? currentRoom.currentTurnStartedAt.toDate().getTime() : Date.now(); const elapsed = Math.floor((Date.now() - startedAt)/1000); const remaining = Math.max(0,(currentRoom.turnSeconds || TURN_SECONDS) - elapsed); setText(els.timerValue, `${remaining}s`); },500); }
  function handleMobileTurnAutoScroll(){ if(!isMobileAutoScroll() || !currentRoom || currentRoom.status !== "drafting") return; const step = DRAFT_STEPS[currentRoom.turnIndex]; if(!step || currentRole !== step.team) return; const key = `${currentRoom.id}-${currentRole}-${currentRoom.turnIndex}`; if(lastAutoScrollTurnKey === key) return; lastAutoScrollTurnKey = key; setTimeout(scrollToHeroPanel,220); }
  function maybeShowFinishedModal(){ if(!currentRoom || currentRoom.status !== "finished") return; const key = `${currentRoom.id}-${gameNumber()}`; if(lastFinishedModalKey === key) return; lastFinishedModalKey = key; setTimeout(showSessionModal,350); }
  function showSessionModal(){ if(!els.sessionModal) return; setText(els.sessionModalTitle, `${gameTitle()} complete`); if(els.nextGameBtn) els.nextGameBtn.disabled = gameNumber() >= MAX_GAMES || !isController(); setHidden(els.sessionModal, false); }
  function hideSessionModal(){ setHidden(els.sessionModal, true); }

  async function copyRoomId(){ if(!currentRoomId) return; await navigator.clipboard.writeText(currentRoomId); showToast("Room ID copied."); }
  async function copyResult(){ if(!currentRoom) return; const result = [`Draft Room By HCI - ${CONFIG.gameKey} - ${currentRoom.id}`, gameTitle(), "", `Team A Ban: ${(currentRoom.bansA || []).map(heroLabel).join(", ") || "-"}`, `Team A Pick: ${(currentRoom.picksA || []).map(heroLabel).join(", ") || "-"}`, "", `Team B Ban: ${(currentRoom.bansB || []).map(heroLabel).join(", ") || "-"}`, `Team B Pick: ${(currentRoom.picksB || []).map(heroLabel).join(", ") || "-"}`].join("\n"); await navigator.clipboard.writeText(result); showToast("Result copied."); }
  function downloadResultPng(){ if(!currentRoom) return showToast("Result is not available yet."); const canvas = document.createElement("canvas"); canvas.width = 1300; canvas.height = 900; const ctx = canvas.getContext("2d"); const gradient = ctx.createLinearGradient(0,0,1300,900); gradient.addColorStop(0,"#071018"); gradient.addColorStop(0.55,"#0d2030"); gradient.addColorStop(1,"#0a111b"); ctx.fillStyle = gradient; ctx.fillRect(0,0,1300,900); ctx.strokeStyle = "rgba(245,196,81,.42)"; ctx.lineWidth = 3; roundRect(ctx,40,40,1220,820,34,true,false,"rgba(255,255,255,.055)"); ctx.fillStyle = "#ffe3a2"; ctx.font = "bold 34px Arial"; ctx.fillText("Draft Room By HCI",80,105); ctx.fillStyle = "#eef6ff"; ctx.font = "bold 56px Arial"; ctx.fillText(`${CONFIG.gameKey} ${gameTitle()} Result`,80,170); drawTeamResult(ctx,"TEAM A",currentRoom.bansA || [],currentRoom.picksA || [],80,230,"#4dabf7"); drawTeamResult(ctx,"TEAM B",currentRoom.bansB || [],currentRoom.picksB || [],690,230,"#ff6b6b"); ctx.fillStyle = "#a8bacf"; ctx.font = "24px Arial"; ctx.fillText(`Room: ${currentRoom.id || currentRoomId}`,80,835); const a = document.createElement("a"); a.download = `hci-draft-result-${Math.random().toString(36).slice(2,10)}.png`; a.href = canvas.toDataURL("image/png"); a.click(); showToast("Result PNG downloaded."); }
  function drawTeamResult(ctx,title,bans,picks,x,y,color){ roundRect(ctx,x,y,530,550,28,true,false,"rgba(255,255,255,.055)"); ctx.fillStyle = color; ctx.font = "bold 32px Arial"; ctx.fillText(title,x+28,y+52); ctx.fillStyle = "#ffe3a2"; ctx.font = "bold 24px Arial"; ctx.fillText("BAN",x+28,y+105); for(let i=0;i<4;i++) drawHeroBox(ctx, heroLabel(bans[i]), x+28+i*122, y+125, 108, 78, `Ban ${i+1}`); ctx.fillStyle = "#ffe3a2"; ctx.font = "bold 24px Arial"; ctx.fillText("PICK",x+28,y+245); for(let i=0;i<5;i++) drawHeroBox(ctx, heroLabel(picks[i]), x+28, y+265+i*54, 474, 44, `Pick ${i+1}`); }
  function drawHeroBox(ctx,name,x,y,w,h,label){ roundRect(ctx,x,y,w,h,14,true,false,"rgba(0,0,0,.22)"); ctx.fillStyle = "#eef6ff"; ctx.font = "bold 19px Arial"; wrapText(ctx, name || "-", x+12, y+28, w-24, 20); ctx.fillStyle = "#a8bacf"; ctx.font = "14px Arial"; ctx.fillText(label,x+12,y+h-12); }
  function roundRect(ctx,x,y,w,h,r,fill,stroke,fillStyle){ ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); if(fill){ ctx.fillStyle = fillStyle || ctx.fillStyle; ctx.fill(); } if(stroke) ctx.stroke(); }
  function wrapText(ctx,text,x,y,maxWidth,lineHeight){ const words = String(text).split(" "); let line=""; for(let n=0;n<words.length;n++){ const test = line + words[n] + " "; if(ctx.measureText(test).width > maxWidth && n>0){ ctx.fillText(line,x,y); line = words[n] + " "; y += lineHeight; } else line = test; } ctx.fillText(line,x,y); }

  function confirmDialog({title, message, confirmText = "OK", cancelText = "Cancel", danger = false} = {}){
    return new Promise((resolve) => {
      const overlay = document.createElement("div");
      overlay.className = "custom-confirm";
      overlay.innerHTML = `
        <div class="custom-confirm-card" role="dialog" aria-modal="true">
          <div class="custom-confirm-icon ${danger ? "danger" : ""}">${danger ? "!" : "i"}</div>
          <div class="custom-confirm-copy"><h2>${escapeHtml(title || "Confirm Action")}</h2><p>${escapeHtml(message || "Are you sure?")}</p></div>
          <div class="custom-confirm-actions"><button class="secondary-btn" data-cancel>${escapeHtml(cancelText)}</button><button class="${danger ? "danger-btn" : "primary-btn"}" data-confirm>${escapeHtml(confirmText)}</button></div>
        </div>`;
      document.body.appendChild(overlay);
      const cleanup = (value) => { overlay.remove(); resolve(value); };
      overlay.querySelector("[data-cancel]").addEventListener("click",()=>cleanup(false));
      overlay.querySelector("[data-confirm]").addEventListener("click",()=>cleanup(true));
      overlay.addEventListener("click",(e)=>{ if(e.target === overlay) cleanup(false); });
    });
  }

  function bindEvents(){
    if(els.createRoomBtn) els.createRoomBtn.addEventListener("click",createRoom);
    if(els.joinRoomBtn) els.joinRoomBtn.addEventListener("click",joinRoom);
    if(els.roomIdInput) els.roomIdInput.addEventListener("keydown",(e)=>{ if(e.key === "Enter") joinRoom(); });
    if(els.copyRoomBtn) els.copyRoomBtn.addEventListener("click",copyRoomId);
    if(els.copyRoomTopBtn) els.copyRoomTopBtn.addEventListener("click",copyRoomId);
    if(els.startDraftBtn) els.startDraftBtn.addEventListener("click",startDraft);
    if(els.copyResultBtn) els.copyResultBtn.addEventListener("click",copyResult);
    if(els.deleteRoomBtn) els.deleteRoomBtn.addEventListener("click",deleteRoom);
    if(els.deleteRoomTopBtn) els.deleteRoomTopBtn.addEventListener("click",deleteRoom);
    if(els.leaveRoomBtn) els.leaveRoomBtn.addEventListener("click",leaveRoom);
    if(els.downloadResultTopBtn) els.downloadResultTopBtn.addEventListener("click",downloadResultPng);
    if(els.heroSearch) els.heroSearch.addEventListener("input",renderHeroGrid);
    if(els.nextGameBtn) els.nextGameBtn.addEventListener("click",nextGame);
    if(els.backLobbyBtn) els.backLobbyBtn.addEventListener("click",backToLobby);
    if(els.downloadResultBtn) els.downloadResultBtn.addEventListener("click",downloadResultPng);
    document.querySelectorAll(".side-btn").forEach((btn)=>btn.addEventListener("click",()=>chooseSide(btn.dataset.side)));
  }
  bindEvents(); renderRoleFilters(); renderHeroGrid(); renderDraftSequence(); initFirebase();
})();
