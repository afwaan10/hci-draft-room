(() => {
  'use strict';

  const paths = window.MOBA_HUB_PATHS || { root: new URL('./', document.baseURI).href, url: (value = '') => new URL(String(value).replace(/^\/+/, ''), document.baseURI).href };
  const LOGIN_ROUTE = paths.url('auth/login/');
  const HOME_ROUTE = paths.url('');
  const DEFAULT_AVATAR = paths.url('assets/brand/default-avatar.svg');
  const cfg = window.MOBA_HUB_FIREBASE_CONFIG || window.HCI_FIREBASE_CONFIG;
  const state = { app: null, auth: null, db: null, user: null, profile: null, ready: false };
  const listeners = new Set();

  const escapeHtml = (value = '') => String(value).replace(/[&<>'"]/g, (character) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#039;', '"': '&quot;' }[character]));
  const url = (value = '') => paths.url(value);
  function validNext(value) {
    if (!value) return HOME_ROUTE;
    try {
      const target = new URL(value, location.href);
      const root = new URL(paths.root);
      if (target.origin !== location.origin || !target.pathname.startsWith(root.pathname)) return HOME_ROUTE;
      return target.href;
    } catch (_error) { return HOME_ROUTE; }
  }
  const wait = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
  async function withTimeout(promise, ms, fallback = null) {
    return Promise.race([Promise.resolve(promise).catch(() => fallback), wait(ms).then(() => fallback)]);
  }

  function toast(message) {
    let element = document.getElementById('mhToast');
    if (!element) { element = document.createElement('div'); element.id = 'mhToast'; element.className = 'mh-toast'; document.body.appendChild(element); }
    element.textContent = message; element.hidden = false; clearTimeout(toast.timer);
    toast.timer = setTimeout(() => { element.hidden = true; }, 2800);
  }

  const firebaseReady = () => Boolean(window.firebase && cfg && cfg.apiKey && cfg.projectId && !String(cfg.apiKey).includes('PASTE'));
  function setLoaderDone() { const loader = document.querySelector('.mh-loader'); if (!loader) return; loader.classList.add('is-done'); setTimeout(() => loader.remove(), 260); }
  function reveal() { document.body.classList.add('auth-ready'); setLoaderDone(); }
  function showLoader(label = 'Loading MOBA HUB') { const loader = document.querySelector('.mh-loader'); if (!loader) return; loader.classList.remove('is-done'); const text = loader.querySelector('small'); if (text) text.textContent = label; }

  function renderAccount() {
    const user = state.user; const profile = state.profile || {};
    document.querySelectorAll('[data-user-name]').forEach((element) => { element.textContent = profile.fullName || user?.displayName || 'MOBA HUB User'; });
    document.querySelectorAll('[data-user-email]').forEach((element) => { element.textContent = user?.email || ''; });
    document.querySelectorAll('[data-user-username]').forEach((element) => { element.textContent = profile.username ? `@${profile.username}` : 'Complete profile'; });
    document.querySelectorAll('[data-user-photo]').forEach((element) => {
      const source = String(profile.photoURL || user?.photoURL || '').trim() || DEFAULT_AVATAR;
      if (element.tagName === 'IMG') {
        element.hidden = false;
        element.src = source;
        element.onerror = () => { element.onerror = null; element.src = DEFAULT_AVATAR; };
      } else {
        element.textContent = '';
        element.classList.add('mh-avatar-image');
        element.style.backgroundImage = `url("${source.replace(/"/g, '%22')}")`;
        const probe = new Image();
        probe.onerror = () => { element.style.backgroundImage = `url("${DEFAULT_AVATAR}")`; };
        probe.src = source;
      }
    });
  }

  async function loadProfile(user) {
    if (!state.db || !user) return null;
    try {
      const reference = state.db.collection('users').doc(user.uid);
      const snapshot = await reference.get();
      if (snapshot.exists) return { id: snapshot.id, ...snapshot.data() };
      const base = { fullName: user.displayName || '', username: '', email: user.email || '', photoURL: user.photoURL || '', createdAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() };
      await reference.set(base, { merge: true }); return base;
    } catch (error) { console.warn('Profile unavailable:', error.message); return null; }
  }

  function ensureNavBackdrop() {
    let backdrop = document.querySelector('[data-nav-backdrop]');
    if (!backdrop) {
      backdrop = document.createElement('button');
      backdrop.type = 'button';
      backdrop.className = 'mh-nav-backdrop';
      backdrop.setAttribute('data-nav-backdrop', '');
      backdrop.setAttribute('aria-label', 'Close navigation');
      backdrop.hidden = true;
      document.body.appendChild(backdrop);
    }
    return backdrop;
  }

  function closeMenus() {
    const links = document.querySelector('[data-nav-links]');
    const toggle = document.querySelector('[data-nav-toggle]');
    const profileMenu = document.querySelector('[data-profile-menu]');
    const backdrop = document.querySelector('[data-nav-backdrop]');
    links?.classList.remove('open');
    toggle?.setAttribute('aria-expanded', 'false');
    if (profileMenu) profileMenu.hidden = true;
    if (backdrop) backdrop.hidden = true;
    document.body.classList.remove('mh-navigation-open');
  }

  function reflectMenuState() {
    const links = document.querySelector('[data-nav-links]');
    const profileMenu = document.querySelector('[data-profile-menu]');
    const backdrop = ensureNavBackdrop();
    const open = Boolean(links?.classList.contains('open') || (profileMenu && !profileMenu.hidden));
    backdrop.hidden = !open;
    document.body.classList.toggle('mh-navigation-open', open);
  }

  async function signOut() {
    closeMenus(); showLoader('Signing out…');
    try { sessionStorage.removeItem('mobaHubTransient'); localStorage.removeItem('mobaHubActiveRoom'); await withTimeout(state.auth?.signOut(), 3000); }
    finally { location.replace(LOGIN_ROUTE); }
  }

  function bindNavigation() {
    const navToggle = document.querySelector('[data-nav-toggle]');
    const links = document.querySelector('[data-nav-links]');
    const profileButton = document.querySelector('[data-profile-toggle]');
    const profileMenu = document.querySelector('[data-profile-menu]');
    const backdrop = ensureNavBackdrop();

    navToggle?.addEventListener('click', (event) => {
      event.preventDefault(); event.stopPropagation();
      if (profileMenu) profileMenu.hidden = true;
      const open = !links?.classList.contains('open');
      links?.classList.toggle('open', open);
      navToggle.setAttribute('aria-expanded', String(open));
      reflectMenuState();
    });

    profileButton?.addEventListener('click', (event) => {
      event.preventDefault(); event.stopPropagation();
      links?.classList.remove('open');
      navToggle?.setAttribute('aria-expanded', 'false');
      if (profileMenu) profileMenu.hidden = !profileMenu.hidden;
      reflectMenuState();
    });

    backdrop.addEventListener('click', closeMenus);
    document.addEventListener('click', (event) => {
      if (!event.target.closest('.mh-profile-wrap') && !event.target.closest('[data-nav-links]') && !event.target.closest('[data-nav-toggle]')) closeMenus();
    });
    document.addEventListener('keydown', (event) => { if (event.key === 'Escape') closeMenus(); });

    // Do not close on pointerdown: hiding the link before click can cancel navigation on Android.
    document.querySelectorAll('[data-nav-links] a,[data-profile-menu] a').forEach((link) => {
      link.addEventListener('click', () => { setTimeout(closeMenus, 0); });
    });
    document.querySelectorAll('[data-logout]').forEach((button) => button.addEventListener('click', signOut));
    window.addEventListener('pageshow', (event) => { closeMenus(); if (event.persisted || state.ready) reveal(); });
    window.addEventListener('pagehide', closeMenus);
    window.addEventListener('resize', () => { if (window.innerWidth > 820) closeMenus(); });
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'hidden') closeMenus(); });
  }

  function authError(message) {
    reveal();
    if (document.querySelector('.mh-auth-error')) return;
    const panel = document.createElement('div'); panel.className = 'mh-auth-error';
    panel.innerHTML = `<section class="mh-auth-error-card"><span class="mh-kicker">Connection issue</span><h1>MOBA HUB could not verify your session.</h1><p>${escapeHtml(message)}</p><div class="mh-actions" style="justify-content:center"><button class="mh-btn primary" type="button" data-retry>Retry</button><a class="mh-btn" href="${LOGIN_ROUTE}">Open Login</a></div></section>`;
    document.body.appendChild(panel); panel.querySelector('[data-retry]').addEventListener('click', () => location.reload());
  }

  async function init() {
    bindNavigation(); const mode = document.body.dataset.auth || 'public';
    if (!firebaseReady()) { if (mode === 'protected') { location.replace(`${LOGIN_ROUTE}?error=firebase`); return; } reveal(); state.ready = true; listeners.forEach((listener) => listener(state)); return; }
    try {
      if (!firebase.apps.length) firebase.initializeApp(cfg); state.app = firebase.app(); state.auth = firebase.auth(); state.db = firebase.firestore();
      await withTimeout(state.auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL), 2500);
    } catch (error) { if (mode === 'protected') authError(error.message || 'Firebase initialization failed.'); else reveal(); return; }

    let settled = false;
    const watchdog = setTimeout(() => { if (!settled) authError('The authentication check took too long. Check your internet connection and Firebase authorized domains.'); }, 9000);
    state.auth.onAuthStateChanged(async (user) => {
      settled = true; clearTimeout(watchdog); state.user = user && !user.isAnonymous ? user : null;
      if (mode === 'protected' && !state.user) { location.replace(LOGIN_ROUTE); return; }
      if (mode === 'guest' && state.user) { location.replace(HOME_ROUTE); return; }
      reveal(); renderAccount();
      state.profile = state.user ? await withTimeout(loadProfile(state.user), 3500, null) : null;
      state.ready = true; renderAccount(); listeners.forEach((listener) => listener(state));
    }, (error) => { settled = true; clearTimeout(watchdog); authError(error.message || 'Authentication failed.'); });
  }

  window.MOBAHub = { state, init, onReady(listener) { state.ready ? listener(state) : listeners.add(listener); }, toast, escapeHtml, signOut, renderAccount, closeMenus, url, validNext, LOGIN_ROUTE, HOME_ROUTE, ROOT_ROUTE: paths.root, DEFAULT_AVATAR };
  document.addEventListener('DOMContentLoaded', init, { once: true });
})();
