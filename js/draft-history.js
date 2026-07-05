(() => {
  const $ = (id) => document.getElementById(id);
  const els = {
    loader: $('appLoader'), app: $('historyApp'), toast: $('toast'), gate: $('loginGate'), gateStatus: $('loginGateStatus'), login: $('googleLoginBtn'),
    menuBtn: $('homeMenuBtn'), menuPanel: $('homeMenuPanel'), menuLogout: $('menuLogoutBtn'), profileBlock: $('menuProfileBlock'),
    menuUserPhoto: $('menuUserPhoto'), menuUserName: $('menuUserName'), menuUserEmail: $('menuUserEmail'), historyList: $('historyList')
  };
  let auth = null, db = null, currentUser = null, historyRows = [];

  function showToast(message){ if(!els.toast) return; els.toast.textContent = message; els.toast.hidden = false; clearTimeout(showToast.timer); showToast.timer = setTimeout(() => { els.toast.hidden = true; }, 2800); }
  function setGateStatus(message){ if(els.gateStatus) els.gateStatus.textContent = message; }
  function isConfigReady(){ const cfg = window.HCI_FIREBASE_CONFIG; return Boolean(cfg && cfg.apiKey && cfg.projectId && !String(cfg.apiKey).includes('PASTE')); }
  function escapeHtml(value){ return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;'); }
  function showApp(){ setTimeout(() => { if(els.loader) els.loader.hidden = true; if(els.app) els.app.hidden = false; }, 450); }
  function lockPage(){ document.body.classList.add('auth-locked'); if(els.gate) els.gate.hidden = false; }
  function unlockPage(){ document.body.classList.remove('auth-locked'); if(els.gate) els.gate.hidden = true; }
  function closeMenu(){ if(!els.menuPanel || !els.menuBtn) return; els.menuPanel.hidden = true; els.menuBtn.setAttribute('aria-expanded','false'); }
  function toggleMenu(){ if(!els.menuPanel || !els.menuBtn) return; const open = els.menuPanel.hidden; els.menuPanel.hidden = !open; els.menuBtn.setAttribute('aria-expanded', String(open)); }

  async function signIn(){
    if(!auth){ setGateStatus('Firebase is not ready. Please check configuration.'); showToast('Firebase is not ready.'); return; }
    const provider = new firebase.auth.GoogleAuthProvider(); provider.setCustomParameters({ prompt:'select_account' });
    try{ setGateStatus('Opening Google login...'); const result = await auth.signInWithPopup(provider); renderAuth(result.user); }
    catch(error){ setGateStatus('Google login is required to continue.'); showToast(error?.message || 'Google login was cancelled.'); }
  }
  async function signOut(){ if(!auth) return; closeMenu(); await auth.signOut(); showToast('Logged out.'); }

  function renderAuth(user){
    currentUser = user && !user.isAnonymous ? user : null;
    if(currentUser){
      if(els.profileBlock) els.profileBlock.hidden = false; if(els.menuLogout) els.menuLogout.hidden = false;
      if(els.menuUserName) els.menuUserName.textContent = currentUser.displayName || 'HCI User';
      if(els.menuUserEmail) els.menuUserEmail.textContent = currentUser.email || 'Signed in';
      if(els.menuUserPhoto){ els.menuUserPhoto.src = currentUser.photoURL || '/assets/brand/hci-community.jpg'; els.menuUserPhoto.hidden = false; }
      unlockPage(); loadHistory();
    } else {
      if(els.profileBlock) els.profileBlock.hidden = true; if(els.menuLogout) els.menuLogout.hidden = true; closeMenu(); lockPage();
      if(els.historyList) els.historyList.innerHTML = '<div class="history-empty-state">Connect with Google to view your draft history.</div>';
    }
  }

  function listNames(ids){ return (ids || []).map((id) => String(id || '-')).join(', ') || '-'; }
  async function loadHistory(){
    if(!db || !currentUser || !els.historyList) return;
    els.historyList.innerHTML = '<div class="notice compact">Loading history...</div>';
    try{
      const snap = await db.collection('draftHistory').where('participantUids', 'array-contains', currentUser.uid).limit(30).get();
      const rows = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      rows.sort((a,b) => Number(b.finishedAtMillis || 0) - Number(a.finishedAtMillis || 0));
      if(!rows.length){ els.historyList.innerHTML = '<div class="history-empty-state">No finished draft history yet.</div>'; return; }
      historyRows = rows.slice(0, 18);
      els.historyList.innerHTML = historyRows.map((row, index) => {
        const game = row.game || 'MOBA'; const room = row.roomId || '-'; const roomName = row.roomName || 'Draft Room';
        const date = row.finishedAtMillis ? new Date(row.finishedAtMillis).toLocaleString('en-GB', { hour12:false }) : 'Saved';
        const blueName = row.blueTeamName || row.teamAName || 'Blue Team'; const redName = row.redTeamName || row.teamBName || 'Red Team';
        return `<article class="history-item"><div><strong>${escapeHtml(game)} · ${escapeHtml(roomName)}</strong><span>${escapeHtml(blueName)} vs ${escapeHtml(redName)}</span><small>${escapeHtml(room)} · Game ${Number(row.gameNumber || 1)} / BO${Number(row.bestOf || 3)} · ${escapeHtml(date)}</small></div><button class="tiny-btn" type="button" data-history-index="${index}">View Result</button><div class="history-detail" id="historyDetail${index}" hidden></div></article>`;
      }).join('');
    }catch(error){ els.historyList.innerHTML = `<div class="notice warning">Could not load history: ${escapeHtml(error.message)}</div>`; }
  }
  function showHistoryDetail(index){
    const row = historyRows[index]; if(!row) return; const detail = document.getElementById(`historyDetail${index}`); if(!detail) return;
    const visible = !detail.hidden; document.querySelectorAll('.history-detail').forEach((el) => { el.hidden = true; }); if(visible) return;
    const blueBans = row.blueBans || row.bansA || []; const bluePicks = row.bluePicks || row.picksA || [];
    const redBans = row.redBans || row.bansB || []; const redPicks = row.redPicks || row.picksB || [];
    const sim = row.simulation || null;
    const simHtml = sim ? `<div class="history-sim"><b>Estimated WR</b><span>${escapeHtml(sim.blueName || 'Blue')} ${Number(sim.bluePct || 0)}% vs ${escapeHtml(sim.redName || 'Red')} ${Number(sim.redPct || 0)}%</span><small>${escapeHtml(sim.summary || 'Simulation estimate only.')}</small></div>` : '';
    detail.innerHTML = `<div class="history-result-grid"><div><b>Blue Side</b><small>${escapeHtml(row.blueTeamName || row.teamAName || 'Team A')}</small><span>Ban: ${escapeHtml(listNames(blueBans))}</span><span>Pick: ${escapeHtml(listNames(bluePicks))}</span></div><div><b>Red Side</b><small>${escapeHtml(row.redTeamName || row.teamBName || 'Team B')}</small><span>Ban: ${escapeHtml(listNames(redBans))}</span><span>Pick: ${escapeHtml(listNames(redPicks))}</span></div></div>${simHtml}`;
    detail.hidden = false;
  }

  function bind(){
    if(els.login) els.login.addEventListener('click', signIn); if(els.menuLogout) els.menuLogout.addEventListener('click', signOut); if(els.menuBtn) els.menuBtn.addEventListener('click', toggleMenu);
    document.addEventListener('click', (event) => { if(!event.target.closest('.home-menu-wrap')) closeMenu(); });
    document.addEventListener('keydown', (event) => { if(event.key === 'Escape') closeMenu(); });
    if(els.historyList) els.historyList.addEventListener('click', (event) => { const btn = event.target.closest('[data-history-index]'); if(btn) showHistoryDetail(Number(btn.dataset.historyIndex)); });
  }

  async function init(){
    bind(); showApp();
    if(!isConfigReady()){ setGateStatus('Firebase config is missing. Google login cannot start.'); lockPage(); showToast('Firebase config is missing.'); return; }
    try{ if(!firebase.apps.length) firebase.initializeApp(window.HCI_FIREBASE_CONFIG); auth = firebase.auth(); db = firebase.firestore(); await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL); auth.onAuthStateChanged((user) => renderAuth(user)); }
    catch(error){ setGateStatus('Firebase error. Google login cannot start.'); lockPage(); showToast(error.message || 'Firebase error.'); }
  }
  init();
})();
