(() => {
  const $ = (id) => document.getElementById(id);
  const els = {
    loader: $('appLoader'), app: $('hubApp'), toast: $('toast'), login: $('googleLoginBtn'), logout: $('logoutBtn'),
    signedOut: $('signedOutActions'), signedIn: $('signedInActions'), userCard: $('userCard'), userPhoto: $('userPhoto'),
    userName: $('userName'), userEmail: $('userEmail'), historyList: $('historyList')
  };
  let auth = null, db = null, currentUser = null, historyRows = [];

  function showToast(message){
    if(!els.toast) return;
    els.toast.textContent = message;
    els.toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { els.toast.hidden = true; }, 2800);
  }
  function isConfigReady(){
    const cfg = window.HCI_FIREBASE_CONFIG;
    return Boolean(cfg && cfg.apiKey && cfg.projectId && !String(cfg.apiKey).includes('PASTE'));
  }
  function escapeHtml(value){
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }
  function showApp(){
    setTimeout(() => {
      if(els.loader) els.loader.hidden = true;
      if(els.app) els.app.hidden = false;
    }, 450);
  }
  async function signIn(){
    if(!auth) return showToast('Firebase is not ready.');
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    try{
      const result = await auth.signInWithPopup(provider);
      currentUser = result.user;
      const params = new URLSearchParams(location.search);
      const next = params.get('next');
      if(next && next.startsWith('/')) location.href = next;
    }catch(error){
      showToast(error?.message || 'Google login was cancelled.');
    }
  }
  async function signOut(){
    if(!auth) return;
    await auth.signOut();
    showToast('Logged out.');
  }
  function updateGameLocks(){
    document.querySelectorAll('[data-requires-login="true"]').forEach((card) => {
      const locked = !currentUser;
      card.classList.toggle('needs-login', locked);
      card.setAttribute('aria-disabled', currentUser ? 'false' : 'true');
      const action = card.querySelector('.game-card-action');
      if(action){
        action.textContent = locked ? (action.dataset.loginLabel || 'Login Required') : (action.dataset.startLabel || 'Join / Start');
      }
    });
  }
  function renderAuth(user){
    currentUser = user && !user.isAnonymous ? user : null;
    if(els.signedOut) els.signedOut.hidden = Boolean(currentUser);
    if(els.signedIn) els.signedIn.hidden = !currentUser;
    if(els.userCard) els.userCard.hidden = !currentUser;
    if(currentUser){
      if(els.userName) els.userName.textContent = currentUser.displayName || 'HCI User';
      if(els.userEmail) els.userEmail.textContent = 'Signed in';
      if(els.userPhoto){
        els.userPhoto.src = currentUser.photoURL || '/assets/brand/hci-community.jpg';
        els.userPhoto.hidden = false;
      }
      loadHistory();
    } else {
      if(els.historyList) els.historyList.innerHTML = '<div class="notice compact">Login with Google to view your draft history.</div>';
    }
    updateGameLocks();
  }
  async function loadHistory(){
    if(!db || !currentUser || !els.historyList) return;
    els.historyList.innerHTML = '<div class="notice compact">Loading history...</div>';
    try{
      const snap = await db.collection('draftHistory').where('participantUids', 'array-contains', currentUser.uid).limit(30).get();
      const rows = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      rows.sort((a,b) => Number(b.finishedAtMillis || 0) - Number(a.finishedAtMillis || 0));
      if(!rows.length){
        els.historyList.innerHTML = '<div class="notice compact">No finished draft history yet. Complete a draft first, then it will appear here.</div>';
        return;
      }
      historyRows = rows.slice(0, 12);
      els.historyList.innerHTML = historyRows.map((row, index) => {
        const game = row.game || 'MOBA';
        const room = row.roomId || '-';
        const roomName = row.roomName || 'Draft Room';
        const date = row.finishedAtMillis ? new Date(row.finishedAtMillis).toLocaleString('en-GB', { hour12:false }) : 'Saved';
        const blueName = row.blueTeamName || row.teamAName || 'Blue Team';
        const redName = row.redTeamName || row.teamBName || 'Red Team';
        return `<article class="history-item" data-history-card="${index}"><div><strong>${escapeHtml(game)} · ${escapeHtml(roomName)}</strong><span>${escapeHtml(blueName)} vs ${escapeHtml(redName)}</span><small>${escapeHtml(room)} · Game ${Number(row.gameNumber || 1)} / BO${Number(row.bestOf || 3)} · ${escapeHtml(date)}</small></div><button class="tiny-btn" type="button" data-history-index="${index}">View Result</button><div class="history-detail" id="historyDetail${index}" hidden></div></article>`;
      }).join('');
    }catch(error){
      els.historyList.innerHTML = `<div class="notice warning">Could not load history: ${escapeHtml(error.message)}</div>`;
    }
  }

  function listNames(ids){ return (ids || []).map((id) => String(id || '-')).join(', ') || '-'; }
  function showHistoryDetail(index){
    const row = historyRows[index]; if(!row || !els.historyList) return;
    const detail = document.getElementById(`historyDetail${index}`); if(!detail) return;
    const visible = !detail.hidden;
    document.querySelectorAll('.history-detail').forEach((el) => { el.hidden = true; });
    if(visible) return;
    const blueBans = row.blueBans || row.bansA || [];
    const bluePicks = row.bluePicks || row.picksA || [];
    const redBans = row.redBans || row.bansB || [];
    const redPicks = row.redPicks || row.picksB || [];
    const sim = row.simulation || null;
    const simHtml = sim ? `<div class="history-sim"><b>Estimated WR</b><span>${escapeHtml(sim.blueName || 'Blue')} ${Number(sim.bluePct || 0)}% vs ${escapeHtml(sim.redName || 'Red')} ${Number(sim.redPct || 0)}%</span><small>${escapeHtml(sim.summary || 'Simulation estimate only.')}</small></div>` : '';
    detail.innerHTML = `<div class="history-result-grid"><div><b>Blue Side</b><small>${escapeHtml(row.blueTeamName || row.teamAName || 'Team A')}</small><span>Ban: ${escapeHtml(listNames(blueBans))}</span><span>Pick: ${escapeHtml(listNames(bluePicks))}</span></div><div><b>Red Side</b><small>${escapeHtml(row.redTeamName || row.teamBName || 'Team B')}</small><span>Ban: ${escapeHtml(listNames(redBans))}</span><span>Pick: ${escapeHtml(listNames(redPicks))}</span></div></div>${simHtml}`;
    detail.hidden = false;
  }

  function bind(){
    if(els.login) els.login.addEventListener('click', signIn);
    if(els.logout) els.logout.addEventListener('click', signOut);
    if(els.historyList) els.historyList.addEventListener('click', (event) => { const btn = event.target.closest('[data-history-index]'); if(btn) showHistoryDetail(Number(btn.dataset.historyIndex)); });
    document.querySelectorAll('[data-requires-login="true"]').forEach((card) => {
      card.addEventListener('click', (event) => {
        if(!currentUser){
          event.preventDefault();
          showToast('Please login with Google before opening a draft simulator.');
        }
      });
    });
  }
  async function init(){
    bind();
    if(!isConfigReady()){
      showToast('Firebase config is missing.');
      showApp();
      return;
    }
    try{
      if(!firebase.apps.length) firebase.initializeApp(window.HCI_FIREBASE_CONFIG);
      auth = firebase.auth();
      db = firebase.firestore();
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      auth.onAuthStateChanged((user) => { renderAuth(user); showApp(); });
    }catch(error){
      showToast(error.message || 'Firebase error.');
      showApp();
    }
  }
  init();
})();
