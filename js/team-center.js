(() => {
  'use strict';

  const $ = (id) => document.getElementById(id);
  const roster = $('rosterGrid');
  let teamId = null;
  let saveTimer = null;
  let lastSerialized = '';
  let currentLogoObjectUrl = '';

  function memberRow(member = {}, index = 0) {
    const row = document.createElement('div');
    row.className = 'roster-row';
    row.dataset.index = index;
    row.innerHTML = `
      <div class="mh-field"><label>Player Name</label><input class="mh-input member-name" maxlength="60" value="${window.MOBAHub.escapeHtml(member.displayName || '')}"></div>
      <div class="mh-field"><label>Username</label><input class="mh-input member-username" maxlength="40" value="${window.MOBAHub.escapeHtml(member.username || '')}"></div>
      <div class="mh-field"><label>Role</label><select class="mh-select member-role"><option value="">Select</option>${['Clash / EXP Lane', 'Jungle', 'Mid Lane', 'Farm / Gold Lane', 'Roam / Support', 'Substitute'].map((role) => `<option ${member.role === role ? 'selected' : ''}>${role}</option>`).join('')}</select></div>
      <button class="mh-btn danger remove-member" type="button">Remove</button>`;
    row.querySelector('.remove-member').addEventListener('click', () => { row.remove(); renumber(); queueSave(); });
    row.querySelectorAll('input,select').forEach((element) => {
      element.addEventListener('input', queueSave);
      element.addEventListener('change', queueSave);
    });
    return row;
  }

  function renumber() {
    [...roster.children].forEach((row, index) => { row.dataset.index = index; });
    $('addPlayer').disabled = roster.children.length >= 7;
  }

  function addMember(member = {}) {
    if (roster.children.length >= 7) return;
    roster.appendChild(memberRow(member, roster.children.length));
    renumber();
  }

  function getMembers() {
    return [...roster.querySelectorAll('.roster-row')]
      .map((row) => ({
        displayName: row.querySelector('.member-name').value.trim(),
        username: row.querySelector('.member-username').value.trim(),
        role: row.querySelector('.member-role').value,
        linkedUid: null,
        accountStatus: 'unlinked'
      }))
      .filter((member) => member.displayName || member.username);
  }

  function getData(state) {
    return {
      name: $('teamName').value.trim(),
      tag: $('teamTag').value.trim().toUpperCase(),
      logoURL: $('teamLogo').value.trim(),
      game: $('teamGame').value,
      region: $('teamRegion').value.trim(),
      description: $('teamDescription').value.trim(),
      leader: $('teamLeader').value.trim() || state.profile?.fullName || state.user.displayName || '',
      coach: $('teamCoach').value.trim(),
      manager: $('teamManager').value.trim(),
      members: getMembers()
    };
  }

  function status(message, type = '') {
    const element = $('teamSaveStatus');
    element.textContent = message;
    element.className = `mh-status ${type}`;
  }

  function updateLogoPreview(source) {
    const preview = $('teamLogoPreview');
    preview.src = source || window.MOBAHub.url('assets/brand/moba-hub-icon.png');
    preview.onerror = () => { preview.onerror = null; preview.src = window.MOBAHub.url('assets/brand/moba-hub-icon.png'); };
  }

  function queueSave() {
    status('Unsaved changes');
    clearTimeout(saveTimer);
    saveTimer = setTimeout(save, 900);
  }

  async function save() {
    const state = window.MOBAHub.state;
    const data = getData(state);
    if (!data.name) { status('Enter a team name.'); return; }
    if (!/^[A-Z0-9]{2,8}$/.test(data.tag)) { status('Team Tag must be 2–8 letters or numbers.'); return; }
    if (data.members.length < 2) { status('Add at least 2 players to the roster.'); return; }
    if (data.members.length > 7) { status('A roster can contain up to 7 players.'); return; }
    const serialized = JSON.stringify(data);
    if (serialized === lastSerialized) return;
    status('Saving…');
    try {
      const isNew = !teamId;
      const ref = teamId ? state.db.collection('teams').doc(teamId) : state.db.collection('teams').doc();
      teamId = ref.id;
      const payload = {
        ...data,
        ownerUid: state.user.uid,
        leaderUid: state.user.uid,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      };
      if (isNew) payload.createdAt = firebase.firestore.FieldValue.serverTimestamp();
      await ref.set(payload, { merge: true });
      lastSerialized = serialized;
      $('teamId').textContent = teamId;
      status('Team saved automatically.', 'success');
      window.MOBAHub.toast('Team Center saved.');
    } catch (error) {
      status(error.message || 'Unable to save team.');
    }
  }

  async function uploadLogo(file) {
    if (!file) return;
    if (!/^image\/(png|jpeg|webp)$/.test(file.type)) { status('Choose a PNG, JPG, or WebP image.'); return; }
    if (file.size > 2 * 1024 * 1024) { status('Team logo must be 2 MB or smaller.'); return; }
    if (currentLogoObjectUrl) URL.revokeObjectURL(currentLogoObjectUrl);
    currentLogoObjectUrl = URL.createObjectURL(file);
    updateLogoPreview(currentLogoObjectUrl);
    status('Local preview only. Firebase Storage will be connected later.');
  }

  function render(data, state) {
    $('teamName').value = data.name || '';
    $('teamTag').value = data.tag || '';
    $('teamLogo').value = data.logoURL || '';
    $('teamGame').value = data.game || 'Honor of Kings';
    $('teamRegion').value = data.region || '';
    $('teamDescription').value = data.description || '';
    $('teamLeader').value = data.leader || state.profile?.fullName || state.user.displayName || '';
    $('teamCoach').value = data.coach || '';
    $('teamManager').value = data.manager || '';
    updateLogoPreview(data.logoURL);
    roster.replaceChildren();
    (data.members || []).forEach(addMember);
    while (roster.children.length < 2) addMember();
    renumber();
    lastSerialized = JSON.stringify(getData(state));
    status(teamId ? 'Team loaded. Changes save automatically.' : 'Create your team. Changes save automatically.', 'success');
  }

  window.MOBAHub.onReady(async (state) => {
    try {
      const snapshot = await state.db.collection('teams').where('ownerUid', '==', state.user.uid).limit(1).get();
      let data = {};
      if (!snapshot.empty) {
        teamId = snapshot.docs[0].id;
        data = snapshot.docs[0].data();
        $('teamId').textContent = teamId;
      }
      render(data, state);
    } catch (error) {
      console.warn(error);
      render({}, state);
      status('Team data could not be loaded.');
    }

    document.querySelectorAll('[data-team-field]').forEach((element) => {
      element.addEventListener('input', queueSave);
      element.addEventListener('change', queueSave);
    });
    $('teamLogo').addEventListener('input', () => updateLogoPreview($('teamLogo').value.trim()));
    $('teamLogoFile').addEventListener('change', (event) => uploadLogo(event.target.files?.[0]));
    $('addPlayer').addEventListener('click', () => { addMember(); queueSave(); });
    $('saveTeam').addEventListener('click', save);
  });
})();
