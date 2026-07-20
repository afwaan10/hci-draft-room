(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const ADMIN_EMAILS = Array.from(new Set([
    ...(Array.isArray(window.MOBA_HUB_ADMIN_EMAILS) ? window.MOBA_HUB_ADMIN_EMAILS : []),
    ...(Array.isArray(window.HCI_ADMIN_EMAILS) ? window.HCI_ADMIN_EMAILS : []),
    'muhammaddeha03@gmail.com'
  ].map((email) => String(email).toLowerCase())));
  const PUBLIC_ADMIN_CREATE = Boolean(window.MOBA_HUB_ALLOW_PUBLIC_ADMIN_CREATE || window.HCI_ALLOW_PUBLIC_ADMIN_CREATE);
  const TRIAL_CREDITS = Number(window.MOBA_HUB_TRIAL_CREDITS || window.HCI_TRIAL_CREDITS || 2);
  const SERIES_FORMATS = {
    bo3: { games: 3, mode: 'bestOf', label: 'BO 3', cost: 1 },
    bo5: { games: 5, mode: 'bestOf', label: 'BO 5', cost: 2 },
    flat2: { games: 2, mode: 'flat', label: 'BO2 Flat', cost: 1 },
    flat3: { games: 3, mode: 'flat', label: 'BO3 Flat', cost: 1 },
    flat4: { games: 4, mode: 'flat', label: 'BO4 Flat', cost: 2 }
  };

  const elements = {
    panel: $('adminPanel'), content: $('adminContentPanel'), recent: $('recentRoomsPanel'), notice: $('adminAccessNotice'),
    game: $('adminGame'), count: $('adminGameCount'), create: $('adminCreateRoomBtn'), created: $('adminCreatedRoom'),
    uid: $('creditUid'), amount: $('creditAmount'), add: $('addCreditBtn'), rooms: $('recentRoomsList'), toast: $('toast')
  };
  let db = null;
  let user = null;
  let tokenIsAdmin = false;
  let unsubscribe = null;

  const escapeHtml = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[char]));
  const seriesInfo = (value) => SERIES_FORMATS[String(value || 'bo3')] || SERIES_FORMATS.bo3;
  const roomId = (prefix) => `${prefix}-${Math.floor(1000 + Math.random() * 90000)}`;
  const hostCode = () => { const source = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; return Array.from({ length: 6 }, () => source[Math.floor(Math.random() * source.length)]).join(''); };

  function showToast(message) {
    if (!elements.toast) return;
    elements.toast.textContent = message;
    elements.toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { elements.toast.hidden = true; }, 2800);
  }

  function isAdmin() {
    if (!user || user.isAnonymous) return false;
    return PUBLIC_ADMIN_CREATE || tokenIsAdmin || ADMIN_EMAILS.includes(String(user.email || '').toLowerCase());
  }

  function parseJsonField(id, fallback = []) {
    const value = ($(id)?.value || '').trim();
    if (!value) return fallback;
    try {
      const parsed = JSON.parse(value);
      if (!Array.isArray(parsed)) throw new Error('Value must be a JSON array.');
      return parsed;
    } catch (error) {
      throw new Error(`${id}: ${error.message}`);
    }
  }

  async function createRoom() {
    if (!isAdmin()) throw new Error('Administrator access is required.');
    const game = elements.game.value;
    const seriesKey = String(elements.count.value || 'bo3');
    const series = seriesInfo(seriesKey);
    let id = roomId(game);
    let ref = db.collection('draftRooms').doc(id);
    let snapshot = await ref.get();
    let tries = 0;
    while (snapshot.exists && tries < 20) {
      id = roomId(game);
      ref = db.collection('draftRooms').doc(id);
      snapshot = await ref.get();
      tries += 1;
    }
    const code = hostCode();
    const now = firebase.firestore.FieldValue.serverTimestamp();
    await ref.set({
      id, game, bestOf: series.games, gameCount: series.games, seriesGames: series.games, seriesMode: series.mode, seriesKey,
      seriesLabel: series.label, flatSeries: series.mode === 'flat', gameNumber: 1, status: 'lobby', adminUid: user.uid,
      adminEmail: user.email, hostCode: code, hostUid: user.uid, hostName: user.displayName || 'Admin Host', hostEmail: user.email || '',
      hostSide: 'A', teamAUid: user.uid, teamBUid: '', teamAName: 'Team A', teamBName: 'Team B', opponentUid: '', turnIndex: 0,
      turnSeconds: game === 'HOK' ? 30 : 45, prepareSeconds: 5, bansA: [], bansB: [], picksA: [], picksB: [], selectedHeroIds: [],
      finishedGames: [], currentTurnStartedAt: null, prepareEndsAt: null, accessCost: series.cost, accessCharged: false,
      accessSource: '', spectatorUids: [], createdAt: now, updatedAt: now
    });
    await ref.collection('activityLogs').add({ action: 'admin_create_room', actorUid: user.uid, actorEmail: user.email, actorRole: 'ADMIN', game, roomId: id, meta: { seriesKey, gameCount: series.games }, createdAt: now });
    elements.created.innerHTML = `<strong>Room ID:</strong> ${escapeHtml(id)}<br><strong>Host Code:</strong> ${escapeHtml(code)}<br><strong>Session:</strong> ${escapeHtml(series.label)} · ${series.cost} credit(s)`;
    elements.created.hidden = false;
    showToast('Room created.');
  }

  async function addCredits() {
    if (!isAdmin()) throw new Error('Administrator access is required.');
    const uid = (elements.uid.value || '').trim();
    const amount = Number(elements.amount.value || 0);
    if (!uid || amount <= 0) throw new Error('Enter a UID and a valid credit amount.');
    const ref = db.collection('userAccess').doc(uid);
    const snapshot = await ref.get();
    if (!snapshot.exists) {
      await ref.set({ uid, email: '', displayName: '', trialCredits: TRIAL_CREDITS, paidCredits: amount, createdAt: firebase.firestore.FieldValue.serverTimestamp(), updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    } else {
      await ref.update({ paidCredits: firebase.firestore.FieldValue.increment(amount), updatedAt: firebase.firestore.FieldValue.serverTimestamp() });
    }
    showToast('Credits added.');
  }

  async function saveGameConfig() {
    const game = String($('cfgGame').value || 'HOK').toUpperCase();
    await db.collection('siteConfig').doc(`game_${game}`).set({
      game, status: $('cfgStatus').value || 'active', logoPath: $('cfgLogo').value.trim(), description: $('cfgDescription').value.trim(),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedBy: user.email
    }, { merge: true });
    showToast('Game configuration saved.');
  }

  async function saveHero() {
    const id = $('heroId').value.trim().toLowerCase().replace(/\s+/g, '-');
    const name = $('heroName').value.trim();
    if (!id || !name) throw new Error('Hero ID and name are required.');
    await db.collection('heroes').doc(id).set({
      id, game: String($('heroGame').value || 'HOK').toUpperCase(), name,
      lanes: $('heroLanes').value.split(',').map((value) => value.trim()).filter(Boolean),
      image: $('heroImage').value.trim(), model3d: $('heroModel').value.trim(), patchVersion: $('heroPatch').value.trim(),
      description: $('heroDescription').value.trim(), skills: parseJsonField('heroSkills'), active: $('heroActive').value !== 'false',
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedBy: user.email
    }, { merge: true });
    showToast('Hero saved.');
  }

  async function saveItem() {
    const id = $('itemId').value.trim().toLowerCase().replace(/\s+/g, '-');
    const name = $('itemName').value.trim();
    if (!id || !name) throw new Error('Item ID and name are required.');
    await db.collection('items').doc(id).set({
      id, name, category: $('itemCategory').value.trim(), tier: $('itemTier').value.trim(), price: Number($('itemPrice').value || 0),
      image: $('itemImage').value.trim(), patchVersion: $('itemPatch').value.trim(), description: $('itemDescription').value.trim(),
      attributes: parseJsonField('itemAttributes'), passives: parseJsonField('itemPassives'),
      recommendedRoles: $('itemRoles').value.split(',').map((value) => value.trim()).filter(Boolean),
      updatedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedBy: user.email
    }, { merge: true });
    showToast('Item saved.');
  }

  async function saveSponsor() {
    const id = $('sponsorSlot').value.trim().toLowerCase().replace(/\s+/g, '-') || 'sponsor-1';
    await db.collection('sponsors').doc(id).set({ id, title: $('sponsorTitle').value.trim(), text: $('sponsorText').value.trim(), url: $('sponsorUrl').value.trim(), active: true, updatedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedBy: user.email }, { merge: true });
    showToast('Sponsor saved.');
  }

  async function saveCommunityLink() {
    const id = $('linkId').value.trim().toLowerCase().replace(/\s+/g, '-');
    if (!id) throw new Error('Link ID is required.');
    await db.collection('communityLinks').doc(id).set({ id, label: $('linkLabel').value.trim(), url: $('linkUrl').value.trim(), active: true, updatedAt: firebase.firestore.FieldValue.serverTimestamp(), updatedBy: user.email }, { merge: true });
    showToast('Community link saved.');
  }

  function listenRooms() {
    if (unsubscribe) unsubscribe();
    unsubscribe = db.collection('draftRooms').orderBy('createdAt', 'desc').limit(12).onSnapshot((snapshot) => {
      if (snapshot.empty) { elements.rooms.textContent = 'No rooms yet.'; return; }
      elements.rooms.innerHTML = snapshot.docs.map((document) => {
        const room = document.data();
        return `<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.12)"><strong>${escapeHtml(room.id)}</strong> · ${escapeHtml(room.game)} · ${escapeHtml(room.status)} · ${escapeHtml(room.seriesLabel || `${room.gameCount || 3} Game`)}<br><span style="color:#9fb0c4">Host: ${escapeHtml(room.hostEmail || 'not claimed')} · Cost: ${escapeHtml(room.accessCost || 1)} credit(s)</span></div>`;
      }).join('');
    }, (error) => showToast(error.message));
  }

  function bindAction(id, handler) {
    $(id)?.addEventListener('click', () => handler().catch((error) => showToast(error.message)));
  }

  window.MOBAHub.onReady(async (state) => {
    db = state.db;
    user = state.user;
    try { tokenIsAdmin = Boolean((await user.getIdTokenResult()).claims.admin); } catch (_error) { tokenIsAdmin = false; }
    if (!isAdmin()) {
      elements.notice.textContent = 'This account does not have administrator access.';
      elements.notice.classList.add('warning');
      return;
    }
    elements.notice.textContent = `Administrator access active for ${user.email}.`;
    elements.panel.hidden = false;
    elements.content.hidden = false;
    elements.recent.hidden = false;
    listenRooms();

    bindAction('adminCreateRoomBtn', createRoom);
    bindAction('addCreditBtn', addCredits);
    bindAction('saveGameConfigBtn', saveGameConfig);
    bindAction('saveHeroBtn', saveHero);
    bindAction('saveItemBtn', saveItem);
    bindAction('saveSponsorBtn', saveSponsor);
    bindAction('saveCommunityLinkBtn', saveCommunityLink);
  });
})();
