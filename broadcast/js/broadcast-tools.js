(() => {
  "use strict";

  const TOOLS_KEY = "hok_broadcast_tools_v1";
  const BROADCAST_KEY = "hok_draft_state_v1";
  const RESULT_KEY = "hok_result_state_v1";
  const PLAYER_COUNT = 5;
  const $ = (id) => document.getElementById(id);
  const clone = (value) => JSON.parse(JSON.stringify(value));
  const safeText = (value, max = 32) => String(value || "").trim().slice(0, max);

  const els = {
    hubBlue: $("hubBlueTeam"), hubRed: $("hubRedTeam"), hubSeries: $("hubSeries"), hubMode: $("hubMode"), hubScore: $("hubSeriesScore"), hubBadge: $("hubLiveBadge"),
    toolsStatus: $("toolsStatus"),
    scheduleBlue: $("scheduleBlueInput"), scheduleRed: $("scheduleRedInput"), scheduleSeries: $("scheduleSeriesInput"), scheduleAdd: $("scheduleAddButton"), scheduleList: $("scheduleList"),
    postdraftShow: $("postdraftShowButton"), postdraftHide: $("postdraftHideButton"),
    recapSave: $("recapSaveButton"), recapList: $("recapList"), recapShow: $("recapShowButton"), recapHide: $("recapHideButton"),
    globalBanEnabled: $("globalBanEnabled"), globalBanChips: $("globalBanChips"), globalBanReset: $("globalBanResetButton"),
    mvpSelect: $("mvpPlayerSelect"), mvpShow: $("mvpShowButton"), mvpHide: $("mvpHideButton"), mvpHint: $("mvpSourceHint"),
    killPlayer: $("killEventPlayer"), killType: $("killEventType"), killShow: $("killEventShowButton"),
    pickerGrid: $("pickerGrid")
  };

  function defaultState() {
    return {
      schedule: [],
      postdraftVisible: false,
      recaps: [],
      selectedRecapId: "",
      recapVisible: false,
      globalBanEnabled: false,
      event: { seq: 0, visible: false, type: "", side: "blue", title: "", subtitle: "", player: "", expiresAt: 0 },
      mvp: { visible: false, side: "blue", index: 0 }
    };
  }

  function normalize(raw) {
    const base = defaultState();
    const source = raw && typeof raw === "object" ? raw : {};
    const schedule = Array.isArray(source.schedule) ? source.schedule.slice(0, 50).map((row) => ({
      id: safeText(row?.id || `${Date.now()}-${Math.random()}`, 80),
      blue: safeText(row?.blue || "BLUE TEAM"), red: safeText(row?.red || "RED TEAM"),
      series: ["BO1", "BO3", "BO5"].includes(row?.series) ? row.series : "BO3",
      status: ["queued", "active", "done"].includes(row?.status) ? row.status : "queued"
    })) : [];
    const recaps = Array.isArray(source.recaps) ? source.recaps.slice(-20).filter((row) => row && typeof row === "object") : [];
    return {
      schedule,
      postdraftVisible: Boolean(source.postdraftVisible),
      recaps,
      selectedRecapId: safeText(source.selectedRecapId, 80),
      recapVisible: Boolean(source.recapVisible),
      globalBanEnabled: Boolean(source.globalBanEnabled),
      event: { ...base.event, ...(source.event && typeof source.event === "object" ? source.event : {}) },
      mvp: {
        visible: Boolean(source.mvp?.visible),
        side: source.mvp?.side === "red" ? "red" : "blue",
        index: Math.max(0, Math.min(4, Number.parseInt(source.mvp?.index, 10) || 0))
      }
    };
  }

  function loadTools() {
    try { return normalize(JSON.parse(localStorage.getItem(TOOLS_KEY) || "{}")); }
    catch { return defaultState(); }
  }

  let state = loadTools();

  function saveTools(render = true) {
    state = normalize(state);
    localStorage.setItem(TOOLS_KEY, JSON.stringify(state));
    if (render) renderAll();
  }

  function loadBroadcast() {
    try { return JSON.parse(localStorage.getItem(BROADCAST_KEY) || "{}"); }
    catch { return {}; }
  }

  function loadResult() {
    try { return JSON.parse(localStorage.getItem(RESULT_KEY) || "{}"); }
    catch { return {}; }
  }

  function setStatus(text, good = true) {
    if (!els.toolsStatus) return;
    els.toolsStatus.textContent = text;
    els.toolsStatus.style.color = good ? "#9ef2d7" : "#ffb4bf";
    window.setTimeout(() => { if (els.toolsStatus) els.toolsStatus.textContent = "READY"; }, 1600);
  }

  function dispatchValue(id, value, eventName = "input") {
    const input = $(id);
    if (!input) return;
    input.value = value;
    input.dispatchEvent(new Event(eventName, { bubbles: true }));
  }

  function renderHub() {
    if (!els.hubBlue) return;
    const b = loadBroadcast();
    els.hubBlue.textContent = b.blueTeam?.name || "BLUE TEAM";
    els.hubRed.textContent = b.redTeam?.name || "RED TEAM";
    els.hubSeries.textContent = b.series || "BO3";
    els.hubMode.textContent = b.mode === "ingame" ? "IN-GAME" : "DRAFT";
    els.hubScore.textContent = `${b.blueTeam?.score || 0} - ${b.redTeam?.score || 0}`;
    els.hubBadge.textContent = b.mode === "ingame" && b.gameTimerRunning ? "ON AIR" : "SIAP";
  }

  function renderSchedule() {
    if (!els.scheduleList) return;
    els.scheduleList.replaceChildren();
    if (!state.schedule.length) {
      const empty = document.createElement("div");
      empty.className = "empty-tools-state";
      empty.textContent = "Belum ada match di antrean.";
      els.scheduleList.append(empty);
      return;
    }
    state.schedule.forEach((match) => {
      const row = document.createElement("div"); row.className = "schedule-row";
      const copyEl = document.createElement("div"); copyEl.className = "schedule-row-copy";
      copyEl.innerHTML = `<strong>${escapeHtml(match.blue)} vs ${escapeHtml(match.red)}</strong><small>${match.series} · ${match.status === "active" ? "AKTIF" : match.status === "done" ? "SELESAI" : "ANTRE"}</small>`;
      const load = document.createElement("button"); load.type = "button"; load.className = "button button-primary button-small"; load.textContent = "Muat"; load.dataset.scheduleLoad = match.id;
      const del = document.createElement("button"); del.type = "button"; del.className = "button button-danger-soft button-small"; del.textContent = "Hapus"; del.dataset.scheduleDelete = match.id;
      row.append(copyEl, load, del); els.scheduleList.append(row);
    });
  }

  function snapshotDraft() {
    const b = loadBroadcast();
    const n = state.recaps.length + 1;
    return {
      id: `recap-${Date.now()}`,
      label: `GAME ${n}`,
      createdAt: Date.now(),
      series: b.series || "BO3",
      blueTeam: clone(b.blueTeam || { name: "BLUE TEAM", logo: "", score: 0 }),
      redTeam: clone(b.redTeam || { name: "RED TEAM", logo: "", score: 0 }),
      bluePlayers: Array.from({ length: PLAYER_COUNT }, (_, i) => ({ name: safeText(b.bluePlayers?.[i]?.name, 24) })),
      redPlayers: Array.from({ length: PLAYER_COUNT }, (_, i) => ({ name: safeText(b.redPlayers?.[i]?.name, 24) })),
      bluePicks: clone(b.bluePicks || []), redPicks: clone(b.redPicks || []),
      bluePickLocked: clone(b.bluePickLocked || []), redPickLocked: clone(b.redPickLocked || []),
      blueBans: clone(b.blueBans || []), redBans: clone(b.redBans || [])
    };
  }

  function renderRecaps() {
    if (!els.recapList) return;
    els.recapList.replaceChildren();
    if (!state.recaps.length) {
      const empty = document.createElement("div"); empty.className = "empty-tools-state"; empty.textContent = "Belum ada Draft Recap tersimpan."; els.recapList.append(empty);
      return;
    }
    state.recaps.forEach((recap) => {
      const row = document.createElement("div"); row.className = "recap-row";
      const radio = document.createElement("input"); radio.type = "radio"; radio.name = "recap-active"; radio.checked = state.selectedRecapId === recap.id; radio.dataset.recapSelect = recap.id;
      const copyEl = document.createElement("div"); copyEl.className = "recap-row-copy";
      copyEl.innerHTML = `<strong>${escapeHtml(recap.label || "GAME")} · ${escapeHtml(recap.blueTeam?.name || "BLUE")} vs ${escapeHtml(recap.redTeam?.name || "RED")}</strong><small>${new Date(recap.createdAt || Date.now()).toLocaleString("id-ID")}</small>`;
      const view = document.createElement("a"); view.className = "button button-secondary button-small"; view.href = "recap.html?preview=1"; view.target = "_blank"; view.rel = "noopener"; view.textContent = "Preview";
      const del = document.createElement("button"); del.type = "button"; del.className = "button button-danger-soft button-small"; del.textContent = "Hapus"; del.dataset.recapDelete = recap.id;
      row.append(radio, copyEl, view, del); els.recapList.append(row);
    });
  }

  function bannedHeroIds() {
    const ids = new Set();
    state.recaps.forEach((recap) => {
      [...(recap.bluePicks || []), ...(recap.redPicks || [])].forEach((id) => {
        if (window.HOK_HERO_MAP?.[id]) ids.add(id);
      });
    });
    return ids;
  }

  function renderGlobalBan() {
    if (!els.globalBanEnabled) return;
    els.globalBanEnabled.checked = state.globalBanEnabled;
    els.globalBanChips.replaceChildren();
    const ids = [...bannedHeroIds()];
    if (!ids.length) {
      const empty = document.createElement("div"); empty.className = "empty-tools-state"; empty.textContent = "Hero terpakai akan muncul setelah Draft Recap disimpan."; els.globalBanChips.append(empty);
    } else {
      ids.forEach((id) => {
        const hero = window.HOK_HERO_MAP[id];
        const chip = document.createElement("span"); chip.className = "global-ban-chip";
        const img = document.createElement("img"); img.src = hero.assets.icon; img.alt = "";
        const text = document.createElement("span"); text.textContent = hero.name;
        chip.append(img, text); els.globalBanChips.append(chip);
      });
    }
    markPickerBans();
  }

  function markPickerBans() {
    if (!els.pickerGrid) return;
    const banned = bannedHeroIds();
    els.pickerGrid.querySelectorAll(".picker-card[data-picker-value]").forEach((card) => {
      const id = card.dataset.pickerValue || "";
      const isHero = Boolean(window.HOK_HERO_MAP?.[id]);
      card.classList.toggle("is-global-banned", state.globalBanEnabled && isHero && banned.has(id));
      if (state.globalBanEnabled && isHero && banned.has(id)) card.setAttribute("aria-disabled", "true"); else card.removeAttribute("aria-disabled");
    });
  }

  function resultPlayers() {
    const r = loadResult();
    const out = [];
    for (const side of ["blue", "red"]) {
      const rows = side === "blue" ? r.bluePlayers : r.redPlayers;
      for (let i = 0; i < PLAYER_COUNT; i += 1) {
        const p = rows?.[i] || {};
        out.push({ side, index: i, ign: p.ign || `${side.toUpperCase()} P${i + 1}`, heroId: p.heroId || "" });
      }
    }
    return out;
  }

  function renderMvp() {
    if (!els.mvpSelect) return;
    const players = resultPlayers();
    els.mvpSelect.replaceChildren();
    players.forEach((p) => {
      const option = document.createElement("option"); option.value = `${p.side}:${p.index}`;
      const hero = window.HOK_HERO_MAP?.[p.heroId]; option.textContent = `${p.side.toUpperCase()} · ${p.ign}${hero ? ` · ${hero.name}` : ""}`;
      option.selected = state.mvp.side === p.side && state.mvp.index === p.index;
      els.mvpSelect.append(option);
    });
    const r = loadResult();
    els.mvpHint.textContent = r.scanner?.confirmedAt ? "Sumber: Result Scanner yang sudah dikonfirmasi." : "Belum ada Result Scanner terkonfirmasi; data dapat tetap dipilih dari state Result saat ini.";
  }

  function renderKillPlayers() {
    if (!els.killPlayer) return;
    const b = loadBroadcast();
    const current = els.killPlayer.value;
    els.killPlayer.replaceChildren();
    for (const side of ["blue", "red"]) {
      const players = side === "blue" ? b.bluePlayers : b.redPlayers;
      for (let i = 0; i < PLAYER_COUNT; i += 1) {
        const option = document.createElement("option");
        option.value = `${side}:${i}`;
        option.textContent = `${side.toUpperCase()} · ${players?.[i]?.name || `PLAYER ${i + 1}`}`;
        els.killPlayer.append(option);
      }
    }
    if ([...els.killPlayer.options].some((o) => o.value === current)) els.killPlayer.value = current;
  }

  function renderAll() {
    renderHub(); renderSchedule(); renderRecaps(); renderGlobalBan(); renderMvp(); renderKillPlayers();
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[ch]));
  }

  function triggerEvent({ type, side, title, subtitle = "", player = "", duration = 4200 }) {
    state.event = {
      seq: (Number(state.event?.seq) || 0) + 1,
      visible: true,
      type, side: side === "red" ? "red" : "blue",
      title: safeText(title, 48), subtitle: safeText(subtitle, 64), player: safeText(player, 32),
      expiresAt: Date.now() + duration
    };
    saveTools(false);
    setStatus("EVENT ON AIR");
  }

  function bind() {
    els.scheduleAdd?.addEventListener("click", () => {
      const blue = safeText(els.scheduleBlue.value || "BLUE TEAM");
      const red = safeText(els.scheduleRed.value || "RED TEAM");
      state.schedule.push({ id: `match-${Date.now()}`, blue, red, series: els.scheduleSeries.value || "BO3", status: "queued" });
      els.scheduleBlue.value = ""; els.scheduleRed.value = ""; saveTools(); setStatus("MATCH DITAMBAH");
    });

    els.scheduleList?.addEventListener("click", (event) => {
      const load = event.target.closest("[data-schedule-load]");
      const del = event.target.closest("[data-schedule-delete]");
      if (load) {
        const match = state.schedule.find((row) => row.id === load.dataset.scheduleLoad); if (!match) return;
        state.schedule.forEach((row) => { if (row.status === "active") row.status = "queued"; }); match.status = "active";
        dispatchValue("blueTeamName", match.blue); dispatchValue("redTeamName", match.red); dispatchValue("seriesSelect", match.series, "change");
        saveTools(); setStatus("MATCH DIMUAT");
      }
      if (del) { state.schedule = state.schedule.filter((row) => row.id !== del.dataset.scheduleDelete); saveTools(); }
    });

    els.postdraftShow?.addEventListener("click", () => { state.postdraftVisible = true; saveTools(); setStatus("POST-DRAFT ON AIR"); });
    els.postdraftHide?.addEventListener("click", () => { state.postdraftVisible = false; saveTools(); });

    els.recapSave?.addEventListener("click", () => {
      const recap = snapshotDraft(); state.recaps.push(recap); state.selectedRecapId = recap.id; saveTools(); setStatus("DRAFT DISIMPAN");
    });
    els.recapList?.addEventListener("change", (event) => { if (event.target.dataset.recapSelect) { state.selectedRecapId = event.target.dataset.recapSelect; saveTools(); } });
    els.recapList?.addEventListener("click", (event) => {
      const del = event.target.closest("[data-recap-delete]"); if (!del) return;
      state.recaps = state.recaps.filter((row) => row.id !== del.dataset.recapDelete);
      if (!state.recaps.some((row) => row.id === state.selectedRecapId)) state.selectedRecapId = state.recaps.at(-1)?.id || "";
      saveTools();
    });
    els.recapShow?.addEventListener("click", () => {
      if (!state.selectedRecapId && state.recaps.length) state.selectedRecapId = state.recaps.at(-1).id;
      if (!state.selectedRecapId) return setStatus("BELUM ADA RECAP", false);
      state.recapVisible = true; saveTools(); setStatus("RECAP ON AIR");
    });
    els.recapHide?.addEventListener("click", () => { state.recapVisible = false; saveTools(); });

    els.globalBanEnabled?.addEventListener("change", () => { state.globalBanEnabled = els.globalBanEnabled.checked; saveTools(); });
    els.globalBanReset?.addEventListener("click", () => { state.recaps = []; state.selectedRecapId = ""; state.globalBanEnabled = false; state.recapVisible = false; saveTools(); setStatus("GLOBAL BAN RESET"); });

    els.mvpSelect?.addEventListener("change", () => {
      const [side, rawIndex] = els.mvpSelect.value.split(":"); state.mvp.side = side === "red" ? "red" : "blue"; state.mvp.index = Math.max(0, Math.min(4, Number(rawIndex) || 0)); saveTools(false);
    });
    els.mvpShow?.addEventListener("click", () => { els.mvpSelect.dispatchEvent(new Event("change")); state.mvp.visible = true; saveTools(); setStatus("MVP ON AIR"); });
    els.mvpHide?.addEventListener("click", () => { state.mvp.visible = false; saveTools(); });

    els.killShow?.addEventListener("click", () => {
      const [side, rawIndex] = (els.killPlayer.value || "blue:0").split(":"); const b = loadBroadcast(); const players = side === "red" ? b.redPlayers : b.bluePlayers; const name = players?.[Number(rawIndex)]?.name || `PLAYER ${Number(rawIndex) + 1}`;
      triggerEvent({ type: "kill", side, title: els.killType.value || "KILL EVENT", player: name, subtitle: `${name} · ${side.toUpperCase()} SIDE` });
    });

    const objectiveBindings = [
      ["blueTyrantPlus", "blue", "TYRANT"], ["redTyrantPlus", "red", "TYRANT"],
      ["blueOverlordPlus", "blue", "OVERLORD"], ["redOverlordPlus", "red", "OVERLORD"]
    ];
    objectiveBindings.forEach(([id, side, title]) => {
      $(id)?.addEventListener("click", () => window.setTimeout(() => {
        const b = loadBroadcast(); const team = side === "blue" ? b.blueTeam?.name : b.redTeam?.name;
        triggerEvent({ type: "objective", side, title, subtitle: `${team || side.toUpperCase()} MENGAMANKAN OBJECTIVE` });
      }, 0));
    });

    if (els.pickerGrid) {
      els.pickerGrid.addEventListener("click", (event) => {
        if (!state.globalBanEnabled) return;
        const card = event.target.closest(".picker-card[data-picker-value]"); if (!card) return;
        const id = card.dataset.pickerValue || "";
        if (window.HOK_HERO_MAP?.[id] && bannedHeroIds().has(id)) {
          event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation(); setStatus("HERO GLOBAL BAN", false);
        }
      }, true);
      new MutationObserver(markPickerBans).observe(els.pickerGrid, { childList: true, subtree: true });
    }

    window.addEventListener("storage", (event) => {
      if (event.key === TOOLS_KEY && event.newValue) { try { state = normalize(JSON.parse(event.newValue)); renderAll(); } catch {} }
      if (event.key === BROADCAST_KEY || event.key === RESULT_KEY) renderAll();
    });
    document.addEventListener("input", (event) => {
      if (["blueTeamName", "redTeamName", "seriesSelect"].includes(event.target.id)) window.setTimeout(renderHub, 0);
    });
  }

  if (!$("hubPanel")) return;
  bind(); renderAll();
})();
