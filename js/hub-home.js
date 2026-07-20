(() => {
  const $ = (id) => document.getElementById(id);
  const els = {
    loader: $('appLoader'),
    app: $('hubApp'),
    toast: $('toast'),
    gate: $('loginGate'),
    gateStatus: $('loginGateStatus'),
    login: $('googleLoginBtn'),
    menuBtn: $('homeMenuBtn'),
    menuPanel: $('homeMenuPanel'),
    menuLogout: $('menuLogoutBtn'),
    profileBlock: $('menuProfileBlock'),
    menuUserPhoto: $('menuUserPhoto'),
    menuUserName: $('menuUserName'),
    menuUserEmail: $('menuUserEmail')
  };

  let auth = null;
  let currentUser = null;

  function showToast(message){
    if(!els.toast) return;
    els.toast.textContent = message;
    els.toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { els.toast.hidden = true; }, 2800);
  }

  function setGateStatus(message){
    if(els.gateStatus) els.gateStatus.textContent = message;
  }

  function isConfigReady(){
    const cfg = window.HCI_FIREBASE_CONFIG;
    return Boolean(cfg && cfg.apiKey && cfg.projectId && !String(cfg.apiKey).includes('PASTE'));
  }

  function showApp(){
    setTimeout(() => {
      if(els.loader) els.loader.hidden = true;
      if(els.app) els.app.hidden = false;
    }, 450);
  }

  function lockPage(){
    document.body.classList.add('auth-locked');
    if(els.gate) els.gate.hidden = false;
  }

  function unlockPage(){
    document.body.classList.remove('auth-locked');
    if(els.gate) els.gate.hidden = true;
  }

  function closeMenu(){
    if(!els.menuPanel || !els.menuBtn) return;
    els.menuPanel.hidden = true;
    els.menuBtn.setAttribute('aria-expanded', 'false');
  }

  function toggleMenu(){
    if(!els.menuPanel || !els.menuBtn) return;
    const nextOpen = els.menuPanel.hidden;
    els.menuPanel.hidden = !nextOpen;
    els.menuBtn.setAttribute('aria-expanded', String(nextOpen));
  }

  async function signIn(){
    if(!auth){
      setGateStatus('Firebase is not ready. Please check configuration.');
      showToast('Firebase is not ready.');
      return;
    }
    const provider = new firebase.auth.GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    setGateStatus('Opening Google login...');
    try{
      const result = await auth.signInWithPopup(provider);
      currentUser = result.user;
      setGateStatus('Login successful.');
      renderAuth(currentUser);
    }catch(error){
      setGateStatus('Google login is required to continue.');
      showToast(error?.message || 'Google login was cancelled.');
    }
  }

  async function signOut(){
    if(!auth) return;
    closeMenu();
    await auth.signOut();
    showToast('Logged out.');
  }

  function updateGameLocks(){
    document.querySelectorAll('[data-requires-login="true"]').forEach((card) => {
      const locked = !currentUser;
      card.classList.toggle('needs-login', locked);
      card.setAttribute('aria-disabled', currentUser ? 'false' : 'true');
      const action = card.querySelector('[data-start-label]');
      if(action){
        action.textContent = locked ? (action.dataset.loginLabel || 'Login Required') : (action.dataset.startLabel || 'Start');
      }
    });
  }

  function renderAuth(user){
    currentUser = user && !user.isAnonymous ? user : null;
    if(currentUser){
      if(els.profileBlock) els.profileBlock.hidden = false;
      if(els.menuLogout) els.menuLogout.hidden = false;
      if(els.menuUserName) els.menuUserName.textContent = currentUser.displayName || 'HCI User';
      if(els.menuUserEmail) els.menuUserEmail.textContent = currentUser.email || 'Signed in';
      if(els.menuUserPhoto){
        els.menuUserPhoto.src = currentUser.photoURL || '/assets/brand/hci-community.jpg';
        els.menuUserPhoto.hidden = false;
      }
      unlockPage();
    } else {
      if(els.profileBlock) els.profileBlock.hidden = true;
      if(els.menuLogout) els.menuLogout.hidden = true;
      closeMenu();
      lockPage();
    }
    updateGameLocks();
  }

  function bind(){
    if(els.login) els.login.addEventListener('click', signIn);
    if(els.menuLogout) els.menuLogout.addEventListener('click', signOut);
    if(els.menuBtn) els.menuBtn.addEventListener('click', toggleMenu);

    document.addEventListener('click', (event) => {
      if(!els.menuPanel || !els.menuBtn) return;
      const menuWrap = event.target.closest('.home-menu-wrap');
      if(!menuWrap) closeMenu();
    });

    document.addEventListener('keydown', (event) => {
      if(event.key === 'Escape') closeMenu();
    });

    document.querySelectorAll('[data-requires-login="true"]').forEach((card) => {
      card.addEventListener('click', (event) => {
        if(!currentUser){
          event.preventDefault();
          lockPage();
          showToast('Please connect with Google first.');
        }
      });
    });
  }

  async function init(){
    bind();
    showApp();

    if(!isConfigReady()){
      setGateStatus('Firebase config is missing. Google login cannot start.');
      lockPage();
      showToast('Firebase config is missing.');
      return;
    }

    try{
      if(!firebase.apps.length) firebase.initializeApp(window.HCI_FIREBASE_CONFIG);
      auth = firebase.auth();
      await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      auth.onAuthStateChanged((user) => renderAuth(user));
    }catch(error){
      setGateStatus('Firebase error. Google login cannot start.');
      lockPage();
      showToast(error.message || 'Firebase error.');
    }
  }

  init();
})();
