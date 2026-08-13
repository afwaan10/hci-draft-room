(() => {
  "use strict";

  const RESULT_KEY = "hok_result_state_v1";
  const BROADCAST_KEY = "hok_draft_state_v1";
  const PLAYER_COUNT = 5;
  const ITEM_COUNT = 6;
  const ROLES = [
    { id: "clash", label: "Clash Lane" },
    { id: "jungle", label: "Jungle" },
    { id: "mid", label: "Mid Lane" },
    { id: "farm", label: "Farm Lane" },
    { id: "roam", label: "Roam" }
  ];
  const SIDE_ORDER = ["blue", "red"];
  const OCR_SCRIPT_URL = "https://cdn.jsdelivr.net/npm/tesseract.js@7/dist/tesseract.min.js";
  const HERO_THRESHOLD = 57;
  const ITEM_THRESHOLD = 54;
  const SCANNER_PROFILE = "hok-result-rows-v1";

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));
  const safeInt = (value, fallback = 0) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const safeFloat = (value, fallback = 0) => {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  };
  const $ = (id) => document.getElementById(id);

  const els = {};
  let state = null;
  let screenshotImage = null;
  let screenshotName = "";
  let cropRect = { x: 0, y: 0, w: 1, h: 1 };
  let interactionMode = "none";
  let pointerStart = null;
  let pointerCurrent = null;
  let calibrationStep = 0;
  let calibrationCards = null;
  let heroSignatures = null;
  let itemSignatures = null;
  let scanBusy = false;
  let pickerContext = null;
  let tesseractWorker = null;

  function emptyConfidence() {
    return {
      ign: 0,
      hero: 0,
      kda: 0,
      gold: 0,
      items: Array(ITEM_COUNT).fill(0)
    };
  }

  function emptyPlayer(index) {
    return {
      role: ROLES[index].label,
      ign: `PLAYER ${index + 1}`,
      photo: "",
      photoScale: 1,
      photoOffsetY: 0,
      heroId: "",
      kda: "0/0/0",
      gold: "0",
      items: Array(ITEM_COUNT).fill(""),
      confidence: emptyConfidence(),
      candidates: { hero: [], items: Array.from({ length: ITEM_COUNT }, () => []) }
    };
  }

  function defaultLayout() {
    return {
      variant: "horizontal",
      x: 0,
      y: 0,
      scale: 1,
      width: 1780,
      panelOpacity: 0.92,
      cardOpacity: 0.96,
      cardGap: 8,
      heroZoom: 1,
      showRoles: true,
      showKda: true,
      showGold: true,
      showItems: true
    };
  }

  function defaultState() {
    return {
      visible: false,
      title: "GAME RESULT",
      gameLabel: "GAME 1",
      blueTeam: { name: "BLUE TEAM", logo: "" },
      redTeam: { name: "RED TEAM", logo: "" },
      blueKills: 0,
      redKills: 0,
      bluePlayers: Array.from({ length: PLAYER_COUNT }, (_, i) => emptyPlayer(i)),
      redPlayers: Array.from({ length: PLAYER_COUNT }, (_, i) => emptyPlayer(i)),
      layout: defaultLayout(),
      scanner: {
        profile: SCANNER_PROFILE,
        cropRect: { x: 0, y: 0, w: 1, h: 1 },
        calibratedCards: null,
        lastQuality: 0,
        lastScanAt: 0
      }
    };
  }

  function normalizePlayer(row, index) {
    const source = row && typeof row === "object" ? row : {};
    const confidence = source.confidence && typeof source.confidence === "object" ? source.confidence : {};
    return {
      role: ROLES[index].label,
      ign: typeof source.ign === "string" && source.ign.trim() ? source.ign.trim().slice(0, 24) : `PLAYER ${index + 1}`,
      photo: typeof source.photo === "string" ? source.photo : "",
      photoScale: clamp(safeFloat(source.photoScale, 1), 0.85, 1.30),
      photoOffsetY: clamp(safeInt(source.photoOffsetY), -20, 20),
      heroId: window.HOK_HERO_MAP[source.heroId] ? source.heroId : "",
      kda: typeof source.kda === "string" ? source.kda.slice(0, 18) : "0/0/0",
      gold: typeof source.gold === "string" ? source.gold.slice(0, 18) : String(source.gold || "0"),
      items: Array.from({ length: ITEM_COUNT }, (_, itemIndex) => {
        const id = Array.isArray(source.items) ? source.items[itemIndex] : "";
        return window.HOK_ITEM_MAP[id] ? id : "";
      }),
      confidence: {
        ign: clamp(safeInt(confidence.ign), 0, 100),
        hero: clamp(safeInt(confidence.hero), 0, 100),
        kda: clamp(safeInt(confidence.kda), 0, 100),
        gold: clamp(safeInt(confidence.gold), 0, 100),
        items: Array.from({ length: ITEM_COUNT }, (_, i) => clamp(safeInt(confidence.items?.[i]), 0, 100))
      },
      candidates: source.candidates && typeof source.candidates === "object"
        ? source.candidates
        : { hero: [], items: Array.from({ length: ITEM_COUNT }, () => []) }
    };
  }

  function normalizeRect(rect, fallback = { x: 0, y: 0, w: 1, h: 1 }) {
    if (!rect || typeof rect !== "object") return { ...fallback };
    const x = clamp(safeFloat(rect.x, fallback.x), 0, 1);
    const y = clamp(safeFloat(rect.y, fallback.y), 0, 1);
    const w = clamp(safeFloat(rect.w, fallback.w), 0.01, 1 - x);
    const h = clamp(safeFloat(rect.h, fallback.h), 0.01, 1 - y);
    return { x, y, w, h };
  }

  function normalizeState(candidate) {
    const base = defaultState();
    const source = candidate && typeof candidate === "object" ? candidate : {};
    const layout = source.layout && typeof source.layout === "object" ? source.layout : {};
    const scanner = source.scanner && typeof source.scanner === "object" ? source.scanner : {};
    return {
      visible: Boolean(source.visible),
      title: typeof source.title === "string" ? source.title.slice(0, 32) : base.title,
      gameLabel: typeof source.gameLabel === "string" ? source.gameLabel.slice(0, 24) : base.gameLabel,
      blueTeam: {
        name: typeof source.blueTeam?.name === "string" ? source.blueTeam.name.slice(0, 32) : base.blueTeam.name,
        logo: typeof source.blueTeam?.logo === "string" ? source.blueTeam.logo : ""
      },
      redTeam: {
        name: typeof source.redTeam?.name === "string" ? source.redTeam.name.slice(0, 32) : base.redTeam.name,
        logo: typeof source.redTeam?.logo === "string" ? source.redTeam.logo : ""
      },
      blueKills: clamp(safeInt(source.blueKills), 0, 999),
      redKills: clamp(safeInt(source.redKills), 0, 999),
      bluePlayers: Array.from({ length: PLAYER_COUNT }, (_, i) => normalizePlayer(source.bluePlayers?.[i], i)),
      redPlayers: Array.from({ length: PLAYER_COUNT }, (_, i) => normalizePlayer(source.redPlayers?.[i], i)),
      layout: {
        variant: layout.variant === "rows"
          ? "rows"
          : (scanner.preset === "rows" ? "rows" : "horizontal"),
        x: clamp(safeInt(layout.x), -500, 500),
        y: clamp(safeInt(layout.y), -420, 420),
        scale: clamp(safeFloat(layout.scale, 1), 0.7, 1.3),
        width: clamp(safeInt(layout.width, 1780), 1320, 1880),
        panelOpacity: clamp(safeFloat(layout.panelOpacity, 0.92), 0.3, 1),
        cardOpacity: clamp(safeFloat(layout.cardOpacity, 0.96), 0.45, 1),
        cardGap: clamp(safeInt(layout.cardGap, 8), 2, 20),
        heroZoom: clamp(safeFloat(layout.heroZoom, 1), 0.85, 1.25),
        showRoles: layout.showRoles !== false,
        showKda: layout.showKda !== false,
        showGold: layout.showGold !== false,
        showItems: layout.showItems !== false
      },
      scanner: {
        profile: SCANNER_PROFILE,
        cropRect: normalizeRect(scanner.cropRect),
        calibratedCards: scanner.profile === SCANNER_PROFILE
          ? normalizeCalibratedCards(scanner.calibratedCards)
          : null,
        lastQuality: clamp(safeInt(scanner.lastQuality), 0, 100),
        lastScanAt: Math.max(0, safeInt(scanner.lastScanAt))
      }
    };
  }

  function normalizeCalibratedCards(cards) {
    if (!cards || typeof cards !== "object") return null;
    const out = { blue: [], red: [] };
    for (const side of SIDE_ORDER) {
      if (!Array.isArray(cards[side]) || cards[side].length !== PLAYER_COUNT) return null;
      out[side] = cards[side].map((rect) => normalizeRect(rect, { x: 0, y: 0, w: 0.1, h: 0.5 }));
    }
    return out;
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(RESULT_KEY);
      return normalizeState(raw ? JSON.parse(raw) : {});
    } catch (error) {
      console.error("Gagal membaca result state.", error);
      return defaultState();
    }
  }

  function saveState(render = true) {
    state = normalizeState(state);
    localStorage.setItem(RESULT_KEY, JSON.stringify(state));
    if (render) renderAll();
  }

  function loadBroadcastState() {
    try {
      const raw = localStorage.getItem(BROADCAST_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (error) {
      console.error("Gagal membaca broadcast state.", error);
      return null;
    }
  }

  function syncFromBroadcast({ preserveScan = true } = {}) {
    const broadcast = loadBroadcastState();
    if (!broadcast) {
      setHint("Data Draft belum ditemukan pada browser ini.", "warn");
      return;
    }

    state.blueTeam.name = broadcast.blueTeam?.name || state.blueTeam.name;
    state.redTeam.name = broadcast.redTeam?.name || state.redTeam.name;
    state.blueTeam.logo = broadcast.blueTeam?.logo || state.blueTeam.logo;
    state.redTeam.logo = broadcast.redTeam?.logo || state.redTeam.logo;
    state.blueKills = clamp(safeInt(broadcast.blueKills), 0, 999);
    state.redKills = clamp(safeInt(broadcast.redKills), 0, 999);

    for (const side of SIDE_ORDER) {
      const rows = side === "blue" ? state.bluePlayers : state.redPlayers;
      const broadcastPlayers = side === "blue" ? broadcast.bluePlayers : broadcast.redPlayers;
      const picks = side === "blue" ? broadcast.bluePicks : broadcast.redPicks;
      const locks = side === "blue" ? broadcast.bluePickLocked : broadcast.redPickLocked;
      const items = side === "blue" ? broadcast.bluePlayerItems : broadcast.redPlayerItems;

      rows.forEach((player, index) => {
        const rosterName = broadcastPlayers?.[index]?.name;
        if (rosterName) {
          player.ign = rosterName;
          player.confidence.ign = preserveScan ? Math.max(player.confidence.ign, 96) : 96;
        }

        const rosterPhoto = broadcastPlayers?.[index]?.photo;
        if (rosterPhoto) {
          player.photo = rosterPhoto;
          player.photoScale = clamp(safeFloat(broadcastPlayers[index]?.photoScale, 1), 0.85, 1.30);
          player.photoOffsetY = clamp(safeInt(broadcastPlayers[index]?.photoOffsetY), -20, 20);
        }

        if (picks?.[index] && locks?.[index] && window.HOK_HERO_MAP[picks[index]]) {
          player.heroId = picks[index];
          player.confidence.hero = 100;
        }

        if (Array.isArray(items?.[index])) {
          items[index].forEach((itemId, itemIndex) => {
            if (window.HOK_ITEM_MAP[itemId] && !player.items[itemIndex]) {
              player.items[itemIndex] = itemId;
              player.confidence.items[itemIndex] = 96;
            }
          });
        }
      });
    }

    saveState();
    setHint("Team, roster, hero locked, dan data existing sudah diambil dari Draft Control.", "good");
  }

  function cacheElements() {
    Object.assign(els, {
      panel: $("resultControlPanel"),
      screenshotInput: $("resultScreenshotInput"),
      captureScreen: $("resultCaptureScreenButton"),
      paste: $("resultPasteButton"),
      scanMode: $("resultScanMode"),
      preset: $("resultLayoutPreset"),
      canvas: $("resultScreenshotCanvas"),
      previewEmpty: $("resultPreviewEmpty"),
      status: $("resultScanStatus"),
      hint: $("resultScanHint"),
      autoArea: $("resultAutoAreaButton"),
      fullArea: $("resultFullAreaButton"),
      manualArea: $("resultManualAreaButton"),
      calibrate: $("resultCalibrateButton"),
      resetCalibration: $("resultResetCalibrationButton"),
      sync: $("resultSyncBroadcastButton"),
      scan: $("resultScanButton"),
      progressBar: $("resultProgressBar"),
      progressText: $("resultProgressText"),
      progressPercent: $("resultProgressPercent"),
      show: $("resultShowButton"),
      hide: $("resultHideButton"),
      resetLayout: $("resultResetLayoutButton"),
      title: $("resultTitleInput"),
      gameLabel: $("resultGameLabelInput"),
      blueKills: $("resultBlueKillsInput"),
      redKills: $("resultRedKillsInput"),
      x: $("resultLayoutX"),
      xValue: $("resultLayoutXValue"),
      y: $("resultLayoutY"),
      yValue: $("resultLayoutYValue"),
      scale: $("resultLayoutScale"),
      scaleValue: $("resultLayoutScaleValue"),
      width: $("resultLayoutWidth"),
      widthValue: $("resultLayoutWidthValue"),
      panelOpacity: $("resultPanelOpacity"),
      panelOpacityValue: $("resultPanelOpacityValue"),
      cardOpacity: $("resultCardOpacity"),
      cardOpacityValue: $("resultCardOpacityValue"),
      cardGap: $("resultCardGap"),
      cardGapValue: $("resultCardGapValue"),
      heroZoom: $("resultHeroZoom"),
      heroZoomValue: $("resultHeroZoomValue"),
      showRoles: $("resultShowRoles"),
      showKda: $("resultShowKda"),
      showGold: $("resultShowGold"),
      showItems: $("resultShowItems"),
      blueReviewName: $("resultBlueReviewName"),
      redReviewName: $("resultRedReviewName"),
      blueReviewPlayers: $("resultBlueReviewPlayers"),
      redReviewPlayers: $("resultRedReviewPlayers"),
      quality: $("resultQualitySummary"),
      picker: $("resultPicker"),
      pickerTitle: $("resultPickerTitle"),
      pickerSearch: $("resultPickerSearch"),
      pickerFilters: $("resultPickerFilters"),
      pickerGrid: $("resultPickerGrid"),
      pickerClose: $("resultPickerCloseButton")
    });
  }

  function setStatus(text, status = "idle") {
    els.status.textContent = text;
    els.status.dataset.status = status;
  }

  function setHint(text, status = "info") {
    els.hint.textContent = text;
    els.hint.dataset.status = status;
  }

  function setProgress(percent, text) {
    const value = clamp(Math.round(percent), 0, 100);
    els.progressBar.style.width = `${value}%`;
    els.progressPercent.textContent = `${value}%`;
    if (text) els.progressText.textContent = text;
  }

  function renderAll() {
    renderEditor();
    renderReview();
    drawPreview();
  }

  function renderEditor() {
    els.title.value = state.title;
    els.gameLabel.value = state.gameLabel;
    els.blueKills.value = String(state.blueKills);
    els.redKills.value = String(state.redKills);

    const layout = state.layout;
    els.preset.value = layout.variant;
    document.querySelectorAll(".result-layout-option").forEach((button) => {
      button.classList.toggle("is-active", button.dataset.resultLayout === layout.variant);
    });
    els.x.value = String(layout.x);
    els.xValue.textContent = `${layout.x}px`;
    els.y.value = String(layout.y);
    els.yValue.textContent = `${layout.y}px`;
    els.scale.value = String(Math.round(layout.scale * 100));
    els.scaleValue.textContent = `${Math.round(layout.scale * 100)}%`;
    els.width.value = String(layout.width);
    els.widthValue.textContent = `${layout.width}px`;
    els.panelOpacity.value = String(Math.round(layout.panelOpacity * 100));
    els.panelOpacityValue.textContent = `${Math.round(layout.panelOpacity * 100)}%`;
    els.cardOpacity.value = String(Math.round(layout.cardOpacity * 100));
    els.cardOpacityValue.textContent = `${Math.round(layout.cardOpacity * 100)}%`;
    els.cardGap.value = String(layout.cardGap);
    els.cardGapValue.textContent = `${layout.cardGap}px`;
    els.heroZoom.value = String(Math.round(layout.heroZoom * 100));
    els.heroZoomValue.textContent = `${Math.round(layout.heroZoom * 100)}%`;
    els.showRoles.checked = layout.showRoles;
    els.showKda.checked = layout.showKda;
    els.showGold.checked = layout.showGold;
    els.showItems.checked = layout.showItems;
  }

  function confidenceClass(value, threshold = 75) {
    return value > 0 && value < threshold ? "is-low" : "";
  }

  function renderDetectedButton(type, side, index, player) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "result-detected-button";
    button.dataset.resultPickType = type;
    button.dataset.side = side;
    button.dataset.index = String(index);

    if (type === "hero") {
      const hero = window.HOK_HERO_MAP[player.heroId];
      if (hero) {
        const image = document.createElement("img");
        image.src = hero.assets.icon;
        image.alt = "";
        button.append(image);
      } else {
        const empty = document.createElement("span");
        empty.className = "result-detected-empty";
        empty.textContent = "?";
        button.append(empty);
      }

      const copy = document.createElement("span");
      copy.className = "result-detected-copy";
      const name = document.createElement("strong");
      name.textContent = hero?.name || "Pilih Hero";
      const confidence = document.createElement("small");
      confidence.textContent = player.confidence.hero ? `Confidence ${player.confidence.hero}%` : "Belum terdeteksi";
      confidence.className = confidenceClass(player.confidence.hero);
      copy.append(name, confidence);
      button.append(copy);
    }

    return button;
  }

  function createReviewPlayer(side, player, index) {
    const row = document.createElement("article");
    const warning = getPlayerWarningCount(player) > 0;
    row.className = `result-player-review${warning ? " has-warning" : ""}`;
    row.dataset.side = side;
    row.dataset.index = String(index);

    const role = document.createElement("div");
    role.className = "result-role-cell";
    role.innerHTML = `<strong>P${index + 1}</strong><span>${ROLES[index].label}</span>`;

    const main = document.createElement("div");
    main.className = "result-player-main-fields";
    const ign = document.createElement("input");
    ign.type = "text";
    ign.maxLength = 24;
    ign.value = player.ign;
    ign.placeholder = "IGN Player";
    ign.dataset.resultField = "ign";
    ign.dataset.side = side;
    ign.dataset.index = String(index);
    main.append(ign, renderDetectedButton("hero", side, index, player));

    const items = document.createElement("div");
    items.className = "result-items-edit";
    player.items.forEach((itemId, itemIndex) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = `result-item-edit-button ${confidenceClass(player.confidence.items[itemIndex], 72)}`.trim();
      button.dataset.resultPickType = "item";
      button.dataset.side = side;
      button.dataset.index = String(index);
      button.dataset.itemIndex = String(itemIndex);
      button.title = `Item ${itemIndex + 1}`;
      const item = window.HOK_ITEM_MAP[itemId];
      if (item) {
        const image = document.createElement("img");
        image.src = item.asset;
        image.alt = "";
        button.append(image);
      } else {
        button.textContent = String(itemIndex + 1);
      }
      if (player.confidence.items[itemIndex]) {
        const conf = document.createElement("span");
        conf.className = "result-item-confidence";
        conf.textContent = String(player.confidence.items[itemIndex]);
        button.append(conf);
      }
      items.append(button);
    });

    const stats = document.createElement("div");
    stats.className = "result-stat-fields";
    for (const field of ["kda", "gold"]) {
      const input = document.createElement("input");
      input.className = "result-stat-input";
      input.type = "text";
      input.value = player[field];
      input.placeholder = field === "kda" ? "K/D/A" : "Gold";
      input.dataset.resultField = field;
      input.dataset.side = side;
      input.dataset.index = String(index);
      stats.append(input);
    }

    const rescan = document.createElement("button");
    rescan.type = "button";
    rescan.className = "result-rescan-button";
    rescan.dataset.rescanSide = side;
    rescan.dataset.rescanIndex = String(index);
    rescan.textContent = "Scan Ulang Slot";

    row.append(role, main, items, stats, rescan);
    return row;
  }

  function getPlayerWarningCount(player) {
    let warnings = 0;
    if (player.confidence.hero > 0 && player.confidence.hero < 70) warnings += 1;
    if (player.confidence.ign > 0 && player.confidence.ign < 70) warnings += 1;
    if (player.confidence.kda > 0 && player.confidence.kda < 68) warnings += 1;
    if (player.confidence.gold > 0 && player.confidence.gold < 68) warnings += 1;
    warnings += player.confidence.items.filter((value) => value > 0 && value < 68).length;
    return warnings;
  }

  function renderReview() {
    els.blueReviewName.textContent = state.blueTeam.name || "BLUE TEAM";
    els.redReviewName.textContent = state.redTeam.name || "RED TEAM";
    els.blueReviewPlayers.replaceChildren(...state.bluePlayers.map((player, i) => createReviewPlayer("blue", player, i)));
    els.redReviewPlayers.replaceChildren(...state.redPlayers.map((player, i) => createReviewPlayer("red", player, i)));

    const summary = calculateQualitySummary();
    if (!state.scanner.lastScanAt) {
      els.quality.textContent = "Belum ada hasil scan. Data dapat diisi manual atau diambil dari Draft.";
    } else {
      els.quality.textContent = `Quality ${summary.quality}% · Hero ${summary.heroes}/10 · Item ${summary.items}/60 · Perlu cek ${summary.warnings} field.`;
    }
  }

  function calculateQualitySummary() {
    const players = [...state.bluePlayers, ...state.redPlayers];
    let heroes = 0;
    let items = 0;
    let warnings = 0;
    const scores = [];
    for (const player of players) {
      if (player.heroId) heroes += 1;
      items += player.items.filter(Boolean).length;
      warnings += getPlayerWarningCount(player);
      if (player.confidence.hero) scores.push(player.confidence.hero);
      for (const c of player.confidence.items) if (c) scores.push(c);
      if (player.confidence.ign) scores.push(player.confidence.ign);
      if (player.confidence.kda) scores.push(player.confidence.kda);
      if (player.confidence.gold) scores.push(player.confidence.gold);
    }
    const quality = scores.length ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
    return { heroes, items, warnings, quality };
  }

  function getDefaultCards() {
    /*
      Scanner hanya membaca hasil match ASLI Honor of Kings dalam format row.
      Layout output Horizontal / Rows tidak pernah mengubah mapping scanner.

      Koordinat relatif di bawah diturunkan dari panel result HoK:
      kiri = Blue 5 row, kanan = Red 5 row.
    */
    const cards = { blue: [], red: [] };
    const startY = 0.185;
    const stepY = 0.124;
    const cardH = 0.112;

    for (let i = 0; i < PLAYER_COUNT; i += 1) {
      const y = startY + i * stepY;
      cards.blue.push({ x: 0.044, y, w: 0.438, h: cardH });
      cards.red.push({ x: 0.518, y, w: 0.438, h: cardH });
    }

    return cards;
  }

  function currentCards() {
    return state.scanner.calibratedCards || getDefaultCards();
  }

  function cardSubregions() {
    /*
      Subregion per row HoK.
      Role digunakan sebagai identity slot, bukan hasil OCR.
      Hero dan item memakai image matching; IGN/KDA/Gold memakai OCR optional.
    */
    return {
      hero: { x: 0.105, y: 0.04, w: 0.155, h: 0.90 },
      ign: { x: 0.405, y: 0.03, w: 0.280, h: 0.36 },
      items: { x: 0.405, y: 0.48, w: 0.305, h: 0.42 },
      kda: { x: 0.690, y: 0.03, w: 0.155, h: 0.38 },
      gold: { x: 0.835, y: 0.03, w: 0.160, h: 0.38 }
    };
  }

  function composeRect(parent, child) {
    return {
      x: parent.x + child.x * parent.w,
      y: parent.y + child.y * parent.h,
      w: child.w * parent.w,
      h: child.h * parent.h
    };
  }

  function rectFromCrop(relativeRect) {
    return composeRect(cropRect, relativeRect);
  }

  function canvasPointToImage(event) {
    const rect = els.canvas.getBoundingClientRect();
    const xCanvas = (event.clientX - rect.left) / rect.width;
    const yCanvas = (event.clientY - rect.top) / rect.height;
    const transform = previewTransform();
    const x = (xCanvas - transform.x) / transform.w;
    const y = (yCanvas - transform.y) / transform.h;
    return { x: clamp(x, 0, 1), y: clamp(y, 0, 1) };
  }

  function previewTransform() {
    if (!screenshotImage) return { x: 0, y: 0, w: 1, h: 1 };
    const canvasAspect = els.canvas.width / els.canvas.height;
    const imageAspect = screenshotImage.naturalWidth / screenshotImage.naturalHeight;
    if (imageAspect > canvasAspect) {
      const h = canvasAspect / imageAspect;
      return { x: 0, y: (1 - h) / 2, w: 1, h };
    }
    const w = imageAspect / canvasAspect;
    return { x: (1 - w) / 2, y: 0, w, h: 1 };
  }

  function drawPreview() {
    const ctx = els.canvas.getContext("2d");
    ctx.clearRect(0, 0, els.canvas.width, els.canvas.height);
    ctx.fillStyle = "#02070c";
    ctx.fillRect(0, 0, els.canvas.width, els.canvas.height);
    if (!screenshotImage) return;

    const t = previewTransform();
    const dx = t.x * els.canvas.width;
    const dy = t.y * els.canvas.height;
    const dw = t.w * els.canvas.width;
    const dh = t.h * els.canvas.height;
    ctx.drawImage(screenshotImage, dx, dy, dw, dh);

    drawNormalizedRect(ctx, cropRect, "#e7bf69", 3, "AREA RESULT");

    const cards = currentCards();
    for (const side of SIDE_ORDER) {
      cards[side].forEach((card, index) => {
        const absolute = rectFromCrop(card);
        const color = side === "blue" ? "#18a8ff" : "#ff4966";
        drawNormalizedRect(ctx, absolute, color, 1.5, `${side === "blue" ? "B" : "R"}${index + 1} ${ROLES[index].label}`);
      });
    }

    if (pointerStart && pointerCurrent && interactionMode !== "none") {
      const drag = normalizedDrag(pointerStart, pointerCurrent);
      drawNormalizedRect(ctx, drag, "#3bd8ff", 2, interactionMode === "crop" ? "AREA BARU" : "SLOT BARU");
    }
  }

  function drawNormalizedRect(ctx, rect, color, lineWidth, label) {
    const t = previewTransform();
    const x = (t.x + rect.x * t.w) * els.canvas.width;
    const y = (t.y + rect.y * t.h) * els.canvas.height;
    const w = rect.w * t.w * els.canvas.width;
    const h = rect.h * t.h * els.canvas.height;
    ctx.save();
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.strokeRect(x, y, w, h);
    if (label) {
      ctx.font = "700 11px Arial";
      const metrics = ctx.measureText(label);
      ctx.fillStyle = "rgba(0,0,0,.78)";
      ctx.fillRect(x, Math.max(0, y - 18), metrics.width + 10, 17);
      ctx.fillStyle = color;
      ctx.fillText(label, x + 5, Math.max(12, y - 5));
    }
    ctx.restore();
  }

  function normalizedDrag(a, b) {
    const x = Math.min(a.x, b.x);
    const y = Math.min(a.y, b.y);
    return { x, y, w: Math.max(0.01, Math.abs(b.x - a.x)), h: Math.max(0.01, Math.abs(b.y - a.y)) };
  }

  function setCrop(rect) {
    cropRect = normalizeRect(rect);
    state.scanner.cropRect = { ...cropRect };
    saveState(false);
    drawPreview();
  }

  async function loadScreenshot(file) {
    const url = URL.createObjectURL(file);
    try {
      const image = new Image();
      await new Promise((resolve, reject) => {
        image.onload = resolve;
        image.onerror = reject;
        image.src = url;
      });
      screenshotImage = image;
      screenshotName = file.name;
      els.previewEmpty.classList.add("is-hidden");
      els.scan.disabled = false;
      setStatus("SIAP SCAN", "good");
      setProgress(0, `${image.naturalWidth}×${image.naturalHeight} · ${file.name}`);

      // Auto-detect setiap screenshot baru. Resolusi/aspect file tidak menjadi preset scanner.
      const detected = detectLikelyPanel();
      cropRect = detected || { x: 0, y: 0, w: 1, h: 1 };
      state.scanner.cropRect = { ...cropRect };
      saveState(false);

      setHint(
        detected
          ? "Area hasil HoK terdeteksi otomatis. Periksa box 10 role; jika meleset gunakan Scanner Lanjutan → Pilih Area Manual/Kalibrasi."
          : "Area otomatis belum yakin. Scanner memakai seluruh gambar; gunakan Pilih Area Manual bila box role tidak pas.",
        detected ? "good" : "warn"
      );
      drawPreview();
    } finally {
      URL.revokeObjectURL(url);
    }
  }

  async function captureDesktopScreenshot() {
    if (!navigator.mediaDevices?.getDisplayMedia) {
      throw new Error("Browser ini tidak mendukung tangkap layar desktop.");
    }
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: true, audio: false });
    try {
      const video = document.createElement("video");
      video.srcObject = stream;
      video.muted = true;
      await video.play();
      await new Promise((resolve) => {
        if (video.videoWidth && video.videoHeight) return resolve();
        video.addEventListener("loadedmetadata", resolve, { once: true });
      });
      await new Promise((resolve) => setTimeout(resolve, 180));
      const canvas = document.createElement("canvas");
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      canvas.getContext("2d").drawImage(video, 0, 0);
      const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
      if (!blob) throw new Error("Gagal membuat screenshot dari desktop.");
      Object.defineProperty(blob, "name", { value: `desktop-${Date.now()}.png` });
      await loadScreenshot(blob);
    } finally {
      stream.getTracks().forEach((track) => track.stop());
    }
  }

  async function pasteScreenshotFromClipboard() {
    if (!navigator.clipboard?.read) {
      throw new Error("Clipboard image API tidak tersedia. Gunakan Ctrl+V atau Upload Screenshot.");
    }
    const entries = await navigator.clipboard.read();
    for (const entry of entries) {
      const imageType = entry.types.find((type) => type.startsWith("image/"));
      if (!imageType) continue;
      const blob = await entry.getType(imageType);
      Object.defineProperty(blob, "name", { value: `clipboard-${Date.now()}.png` });
      await loadScreenshot(blob);
      return true;
    }
    throw new Error("Clipboard tidak berisi gambar.");
  }

  function detectLikelyPanel() {
    if (!screenshotImage) return null;

    const imageAspect = screenshotImage.naturalWidth / screenshotImage.naturalHeight;
    const sampleW = 220;
    const sampleH = Math.max(100, Math.round(sampleW / imageAspect));
    const canvas = document.createElement("canvas");
    canvas.width = sampleW;
    canvas.height = sampleH;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(screenshotImage, 0, 0, sampleW, sampleH);

    const pixels = ctx.getImageData(0, 0, sampleW, sampleH).data;
    const edge = new Float32Array(sampleW * sampleH);
    const cool = new Float32Array(sampleW * sampleH);

    const pixel = (x, y) => {
      const i = (y * sampleW + x) * 4;
      return [pixels[i], pixels[i + 1], pixels[i + 2]];
    };

    const lum = (x, y) => {
      const [r, g, b] = pixel(x, y);
      return 0.2126 * r + 0.7152 * g + 0.0722 * b;
    };

    for (let y = 0; y < sampleH - 1; y += 1) {
      for (let x = 0; x < sampleW - 1; x += 1) {
        const here = lum(x, y);
        edge[y * sampleW + x] =
          Math.abs(here - lum(x + 1, y))
          + Math.abs(here - lum(x, y + 1));

        const [r, g, b] = pixel(x, y);
        // Result HoK umumnya didominasi surface biru/cyan.
        cool[y * sampleW + x] = b > r * 1.06 && b > g * 0.88
          ? clamp((b - r + b - g * 0.72) / 255, 0, 1)
          : 0;
      }
    }

    function integralOf(values) {
      const integral = new Float64Array((sampleW + 1) * (sampleH + 1));
      for (let y = 1; y <= sampleH; y += 1) {
        let rowSum = 0;
        for (let x = 1; x <= sampleW; x += 1) {
          rowSum += values[(y - 1) * sampleW + (x - 1)];
          integral[y * (sampleW + 1) + x] =
            integral[(y - 1) * (sampleW + 1) + x] + rowSum;
        }
      }
      return integral;
    }

    const edgeIntegral = integralOf(edge);
    const coolIntegral = integralOf(cool);

    function rectSum(integral, x, y, w, h) {
      const stride = sampleW + 1;
      const x2 = x + w;
      const y2 = y + h;
      return (
        integral[y2 * stride + x2]
        - integral[y * stride + x2]
        - integral[y2 * stride + x]
        + integral[y * stride + x]
      );
    }

    let best = null;
    // Panel result asli HoK pada contoh berkisar 2.0–2.25:1.
    const ratios = [1.92, 2.02, 2.12, 2.22, 2.32];
    const widthScales = [0.45, 0.55, 0.65, 0.75, 0.85, 0.94];

    for (const ratio of ratios) {
      for (const scale of widthScales) {
        let w = Math.round(sampleW * scale);
        let h = Math.round(w / ratio);

        if (h > sampleH * 0.94) {
          h = Math.round(sampleH * 0.94);
          w = Math.round(h * ratio);
        }

        if (w < 60 || h < 28 || w > sampleW || h > sampleH) continue;

        const stepX = Math.max(2, Math.round((sampleW - w) / 14));
        const stepY = Math.max(2, Math.round((sampleH - h) / 12));

        for (let y = 0; y <= sampleH - h; y += stepY) {
          for (let x = 0; x <= sampleW - w; x += stepX) {
            const area = w * h;
            const edgeDensity = rectSum(edgeIntegral, x, y, w, h) / area;
            const coolDensity = rectSum(coolIntegral, x, y, w, h) / area;
            const centerX = (x + w / 2) / sampleW;
            const centerY = (y + h / 2) / sampleH;

            const centerPenalty =
              Math.abs(centerX - 0.5) * 0.14
              + Math.abs(centerY - 0.52) * 0.08;

            // Edge membantu menemukan tabel; cool-density membantu membedakan panel game dari browser chrome.
            const score =
              edgeDensity * 0.78
              + coolDensity * 17
              + scale * 1.25
              - centerPenalty;

            if (!best || score > best.score) {
              best = { x, y, w, h, score, coolDensity };
            }
          }
        }
      }
    }

    if (!best) return null;

    // Jika tidak ada sinyal surface HoK yang cukup, jangan terlalu percaya auto crop.
    if (best.coolDensity < 0.045 && imageAspect < 1.45) {
      return null;
    }

    const padX = Math.round(best.w * 0.012);
    const padY = Math.round(best.h * 0.025);
    const x = Math.max(0, best.x - padX);
    const y = Math.max(0, best.y - padY);
    const x2 = Math.min(sampleW, best.x + best.w + padX);
    const y2 = Math.min(sampleH, best.y + best.h + padY);

    return {
      x: x / sampleW,
      y: y / sampleH,
      w: (x2 - x) / sampleW,
      h: (y2 - y) / sampleH
    };
  }

  function startCalibration() {
    if (!screenshotImage) {
      setHint("Upload screenshot terlebih dahulu.", "warn");
      return;
    }
    calibrationCards = { blue: [], red: [] };
    calibrationStep = 0;
    interactionMode = "calibrate";
    setHint(`Kalibrasi 1/10: drag area kartu BLUE ${ROLES[0].label}.`, "warn");
  }

  function calibrationTarget() {
    const sideIndex = calibrationStep < PLAYER_COUNT ? 0 : 1;
    const playerIndex = calibrationStep % PLAYER_COUNT;
    return { side: SIDE_ORDER[sideIndex], playerIndex };
  }

  function finishCalibrationRect(imageRect) {
    const target = calibrationTarget();
    const relative = {
      x: (imageRect.x - cropRect.x) / cropRect.w,
      y: (imageRect.y - cropRect.y) / cropRect.h,
      w: imageRect.w / cropRect.w,
      h: imageRect.h / cropRect.h
    };
    calibrationCards[target.side][target.playerIndex] = normalizeRect(relative, { x: 0, y: 0, w: 0.1, h: 0.5 });
    calibrationStep += 1;
    if (calibrationStep >= PLAYER_COUNT * 2) {
      state.scanner.calibratedCards = calibrationCards;
      interactionMode = "none";
      calibrationCards = null;
      saveState(false);
      setHint("Kalibrasi 10 slot selesai dan disimpan. Preset ini dapat dipakai untuk screenshot resolusi berbeda dengan layout result yang sama.", "good");
      drawPreview();
      return;
    }
    const next = calibrationTarget();
    setHint(`Kalibrasi ${calibrationStep + 1}/10: drag area kartu ${next.side.toUpperCase()} ${ROLES[next.playerIndex].label}.`, "warn");
  }

  function bindCanvas() {
    els.canvas.addEventListener("pointerdown", (event) => {
      if (!screenshotImage || interactionMode === "none") return;
      pointerStart = canvasPointToImage(event);
      pointerCurrent = pointerStart;
      els.canvas.setPointerCapture?.(event.pointerId);
      drawPreview();
    });

    els.canvas.addEventListener("pointermove", (event) => {
      if (!pointerStart || interactionMode === "none") return;
      pointerCurrent = canvasPointToImage(event);
      drawPreview();
    });

    els.canvas.addEventListener("pointerup", (event) => {
      if (!pointerStart || !pointerCurrent || interactionMode === "none") return;
      const rect = normalizedDrag(pointerStart, pointerCurrent);
      pointerStart = null;
      pointerCurrent = null;
      if (rect.w < 0.02 || rect.h < 0.02) {
        setHint("Area terlalu kecil. Drag area yang lebih besar.", "warn");
        drawPreview();
        return;
      }

      if (interactionMode === "crop") {
        setCrop(rect);
        interactionMode = "none";
        setHint("Area result manual tersimpan. Sekarang kalibrasi slot jika box role belum pas, lalu SCAN RESULT.", "good");
      } else if (interactionMode === "calibrate") {
        finishCalibrationRect(rect);
      }
      drawPreview();
    });
  }

  async function loadImageAsset(src) {
    const image = new Image();
    image.decoding = "async";
    await new Promise((resolve, reject) => {
      image.onload = resolve;
      image.onerror = () => reject(new Error(`Gagal memuat asset ${src}`));
      image.src = src;
    });
    return image;
  }

  function signatureFromImage(image, sourceRect = null) {
    const size = 14;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.imageSmoothingEnabled = true;

    let sx = 0;
    let sy = 0;
    let sw = image.naturalWidth || image.width;
    let sh = image.naturalHeight || image.height;
    if (sourceRect) {
      sx = Math.round(sourceRect.x * sw);
      sy = Math.round(sourceRect.y * sh);
      sw = Math.max(1, Math.round(sourceRect.w * sw));
      sh = Math.max(1, Math.round(sourceRect.h * sh));
    }

    const cropSize = Math.min(sw, sh) * 0.88;
    const cx = sx + sw / 2;
    const cy = sy + sh / 2;
    ctx.drawImage(image, cx - cropSize / 2, cy - cropSize / 2, cropSize, cropSize, 0, 0, size, size);
    return signatureFromCanvas(canvas);
  }

  function signatureFromCanvas(canvas) {
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const data = ctx.getImageData(0, 0, canvas.width, canvas.height).data;
    const rgb = new Float32Array(canvas.width * canvas.height * 3);
    const gray = new Float32Array(canvas.width * canvas.height);
    let rMean = 0, gMean = 0, bMean = 0;
    let p = 0;
    for (let i = 0; i < data.length; i += 4) {
      rMean += data[i]; gMean += data[i + 1]; bMean += data[i + 2];
      rgb[p * 3] = data[i] / 255;
      rgb[p * 3 + 1] = data[i + 1] / 255;
      rgb[p * 3 + 2] = data[i + 2] / 255;
      gray[p] = (data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114) / 255;
      p += 1;
    }
    const count = p || 1;
    rMean /= count * 255; gMean /= count * 255; bMean /= count * 255;
    const hash = new Uint8Array(canvas.height * (canvas.width - 1));
    let hi = 0;
    for (let y = 0; y < canvas.height; y += 1) {
      for (let x = 0; x < canvas.width - 1; x += 1) {
        const index = y * canvas.width + x;
        hash[hi++] = gray[index] > gray[index + 1] ? 1 : 0;
      }
    }
    return { rgb, hash, mean: [rMean, gMean, bMean] };
  }

  function cropSignature(image, imageRect) {
    const size = 14;
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    const iw = image.naturalWidth;
    const ih = image.naturalHeight;
    const sx = imageRect.x * iw;
    const sy = imageRect.y * ih;
    const sw = imageRect.w * iw;
    const sh = imageRect.h * ih;
    const square = Math.min(sw, sh) * 0.88;
    const cx = sx + sw / 2;
    const cy = sy + sh / 2;
    ctx.drawImage(image, cx - square / 2, cy - square / 2, square, square, 0, 0, size, size);
    return signatureFromCanvas(canvas);
  }

  function signatureDistance(a, b) {
    let rgb = 0;
    for (let i = 0; i < a.rgb.length; i += 1) rgb += Math.abs(a.rgb[i] - b.rgb[i]);
    rgb /= a.rgb.length;
    let hash = 0;
    for (let i = 0; i < a.hash.length; i += 1) hash += a.hash[i] === b.hash[i] ? 0 : 1;
    hash /= a.hash.length;
    const mean = (Math.abs(a.mean[0] - b.mean[0]) + Math.abs(a.mean[1] - b.mean[1]) + Math.abs(a.mean[2] - b.mean[2])) / 3;
    return rgb * 0.58 + hash * 0.27 + mean * 0.15;
  }

  async function loadReferenceSignatures(type) {
    const data = type === "hero" ? window.HOK_HEROES : window.HOK_ITEMS;
    const signatures = [];
    let done = 0;
    for (const item of data) {
      const src = type === "hero" ? item.assets.icon : item.asset;
      try {
        const image = await loadImageAsset(src);
        signatures.push({ id: item.id, data: item, sig: signatureFromImage(image) });
      } catch (error) {
        console.warn(error);
      }
      done += 1;
      if (done % 20 === 0) await new Promise(requestAnimationFrame);
    }
    return signatures;
  }

  function heroMatchesRole(hero, roleLabel) {
    const positions = Array.isArray(hero.positions) ? hero.positions : [hero.role].filter(Boolean);
    return positions.includes(roleLabel);
  }

  function rankSignature(query, refs, type, roleLabel = "") {
    const ranked = refs.map((entry) => {
      let distance = signatureDistance(query, entry.sig);
      if (type === "hero" && roleLabel) {
        distance *= heroMatchesRole(entry.data, roleLabel) ? 0.93 : 1.035;
      }
      return { id: entry.id, name: entry.data.name, distance, data: entry.data };
    }).sort((a, b) => a.distance - b.distance);

    const best = ranked[0];
    const second = ranked[1] || { distance: best?.distance || 1 };
    if (!best) return { id: "", confidence: 0, candidates: [] };
    const absolute = clamp(1 - best.distance, 0, 1);
    const margin = clamp((second.distance - best.distance) / Math.max(second.distance, 0.001), 0, 1);
    const confidence = clamp(Math.round((absolute * 0.78 + margin * 0.22) * 100), 0, 99);
    return {
      id: best.id,
      confidence,
      candidates: ranked.slice(0, 4).map((row) => ({ id: row.id, name: row.name, confidence: clamp(Math.round((1 - row.distance) * 100), 0, 99) }))
    };
  }

  function rankRegionSignature(imageRect, refs, type, roleLabel = "") {
    const variants = [
      { dx: 0, dy: 0, scale: 1 },
      { dx: -0.08, dy: 0, scale: 0.94 },
      { dx: 0.08, dy: 0, scale: 0.94 },
      { dx: 0, dy: -0.08, scale: 0.94 },
      { dx: 0, dy: 0.08, scale: 0.94 }
    ];

    let best = null;

    for (const variant of variants) {
      const w = imageRect.w * variant.scale;
      const h = imageRect.h * variant.scale;
      const rect = {
        x: clamp(
          imageRect.x + (imageRect.w - w) / 2 + imageRect.w * variant.dx,
          0,
          1 - w
        ),
        y: clamp(
          imageRect.y + (imageRect.h - h) / 2 + imageRect.h * variant.dy,
          0,
          1 - h
        ),
        w,
        h
      };

      const ranked = rankSignature(
        cropSignature(screenshotImage, rect),
        refs,
        type,
        roleLabel
      );

      if (!best || ranked.confidence > best.confidence) {
        best = ranked;
      }
    }

    return best || { id: "", confidence: 0, candidates: [] };
  }

  function splitItemRects(cardRect, itemsSubregion) {
    const strip = composeRect(cardRect, itemsSubregion);
    const gap = strip.w * 0.012;
    const slotW = (strip.w - gap * (ITEM_COUNT - 1)) / ITEM_COUNT;
    return Array.from({ length: ITEM_COUNT }, (_, index) => ({
      x: strip.x + index * (slotW + gap),
      y: strip.y,
      w: slotW,
      h: strip.h
    }));
  }

  async function ensureReferenceSignatures() {
    if (!heroSignatures) {
      setProgress(5, "Memuat 120 referensi hero...");
      heroSignatures = await loadReferenceSignatures("hero");
    }
    if (!itemSignatures) {
      setProgress(12, "Memuat 118 referensi item...");
      itemSignatures = await loadReferenceSignatures("item");
    }
  }

  function getCardRect(side, index) {
    const cards = currentCards();
    return rectFromCrop(cards[side][index]);
  }

  async function scanVisualSlot(side, index) {
    const player = side === "blue" ? state.bluePlayers[index] : state.redPlayers[index];
    const card = getCardRect(side, index);
    const sub = cardSubregions();

    const heroRect = composeRect(card, sub.hero);
    const heroResult = rankRegionSignature(heroRect, heroSignatures, "hero", ROLES[index].label);

    // Draft LOCK adalah prior terkuat bila tersedia. Scanner tetap menghitung visual sebagai verifikasi.
    const broadcast = loadBroadcastState();
    const priorHero = side === "blue" ? broadcast?.bluePicks?.[index] : broadcast?.redPicks?.[index];
    const priorLocked = side === "blue" ? broadcast?.bluePickLocked?.[index] : broadcast?.redPickLocked?.[index];
    if (priorHero && priorLocked && window.HOK_HERO_MAP[priorHero]) {
      player.heroId = priorHero;
      player.confidence.hero = Math.max(96, heroResult.id === priorHero ? heroResult.confidence : 96);
    } else if (heroResult.confidence >= HERO_THRESHOLD) {
      player.heroId = heroResult.id;
      player.confidence.hero = heroResult.confidence;
    } else {
      player.heroId = heroResult.confidence >= 45 ? heroResult.id : "";
      player.confidence.hero = heroResult.confidence;
    }
    player.candidates.hero = heroResult.candidates;

    const itemRects = splitItemRects(card, sub.items);
    for (let itemIndex = 0; itemIndex < ITEM_COUNT; itemIndex += 1) {
      const itemResult = rankRegionSignature(itemRects[itemIndex], itemSignatures, "item");
      player.items[itemIndex] = itemResult.confidence >= ITEM_THRESHOLD ? itemResult.id : (itemResult.confidence >= 44 ? itemResult.id : "");
      player.confidence.items[itemIndex] = itemResult.confidence;
      player.candidates.items[itemIndex] = itemResult.candidates;
    }
  }

  function prepareOcrCanvas(imageRect) {
    const iw = screenshotImage.naturalWidth;
    const ih = screenshotImage.naturalHeight;
    const sx = Math.max(0, Math.floor(imageRect.x * iw));
    const sy = Math.max(0, Math.floor(imageRect.y * ih));
    const sw = Math.max(2, Math.floor(imageRect.w * iw));
    const sh = Math.max(2, Math.floor(imageRect.h * ih));
    const scale = clamp(Math.ceil(640 / Math.max(sw, sh)), 2, 5);
    const canvas = document.createElement("canvas");
    canvas.width = sw * scale;
    canvas.height = sh * scale;
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(screenshotImage, sx, sy, sw, sh, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const data = imageData.data;
    let avg = 0;
    for (let i = 0; i < data.length; i += 4) avg += data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
    avg /= data.length / 4;
    for (let i = 0; i < data.length; i += 4) {
      let gray = data[i] * 0.299 + data[i + 1] * 0.587 + data[i + 2] * 0.114;
      if (avg < 128) gray = 255 - gray;
      gray = gray < 150 ? 0 : 255;
      data[i] = data[i + 1] = data[i + 2] = gray;
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }

  async function loadTesseract() {
    if (window.Tesseract) return window.Tesseract;
    await new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = OCR_SCRIPT_URL;
      script.async = true;
      script.onload = resolve;
      script.onerror = () => reject(new Error("OCR library gagal dimuat. Periksa koneksi internet."));
      document.head.append(script);
    });
    return window.Tesseract;
  }

  async function ensureOcrWorker() {
    if (tesseractWorker) return tesseractWorker;
    const Tesseract = await loadTesseract();
    tesseractWorker = await Tesseract.createWorker("eng", 1, {
      logger(message) {
        if (message?.progress != null && message.status) {
          const local = Math.round(message.progress * 100);
          els.progressText.textContent = `OCR: ${message.status} ${local}%`;
        }
      }
    });
    return tesseractWorker;
  }

  function levenshtein(a, b) {
    const s = String(a || "").toUpperCase();
    const t = String(b || "").toUpperCase();
    const dp = Array.from({ length: t.length + 1 }, (_, i) => i);
    for (let i = 1; i <= s.length; i += 1) {
      let prev = dp[0];
      dp[0] = i;
      for (let j = 1; j <= t.length; j += 1) {
        const temp = dp[j];
        dp[j] = Math.min(dp[j] + 1, dp[j - 1] + 1, prev + (s[i - 1] === t[j - 1] ? 0 : 1));
        prev = temp;
      }
    }
    return dp[t.length];
  }

  function similarity(a, b) {
    const max = Math.max(String(a || "").length, String(b || "").length, 1);
    return 1 - levenshtein(a, b) / max;
  }

  function cleanIgn(text) {
    return String(text || "")
      .replace(/[^A-Za-z0-9_.\- ]/g, "")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 24);
  }

  function parseKda(text) {
    const clean = String(text || "").replace(/[Il|]/g, "1");
    const nums = clean.match(/\d+/g) || [];
    if (nums.length >= 3) return `${safeInt(nums[0])}/${safeInt(nums[1])}/${safeInt(nums[2])}`;
    return clean.replace(/\s+/g, "").slice(0, 18);
  }

  function parseGold(text) {
    return String(text || "")
      .replace(/[^0-9.,kKmM]/g, "")
      .replace(/,/g, ".")
      .slice(0, 18) || "0";
  }

  async function recognizeField(worker, canvas, whitelist) {
    await worker.setParameters({
      tessedit_char_whitelist: whitelist,
      preserve_interword_spaces: "1"
    });
    const result = await worker.recognize(canvas);
    return { text: result.data.text || "", confidence: clamp(Math.round(result.data.confidence || 0), 0, 100) };
  }

  async function scanOcrSlot(side, index) {
    const worker = await ensureOcrWorker();
    const player = side === "blue" ? state.bluePlayers[index] : state.redPlayers[index];
    const card = getCardRect(side, index);
    const sub = cardSubregions();

    const ignResult = await recognizeField(worker, prepareOcrCanvas(composeRect(card, sub.ign)), "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_.- ");
    const kdaResult = await recognizeField(worker, prepareOcrCanvas(composeRect(card, sub.kda)), "0123456789/| ");
    const goldResult = await recognizeField(worker, prepareOcrCanvas(composeRect(card, sub.gold)), "0123456789.,kKmM ");

    const detectedIgn = cleanIgn(ignResult.text);
    const broadcast = loadBroadcastState();
    const rosterName = side === "blue" ? broadcast?.bluePlayers?.[index]?.name : broadcast?.redPlayers?.[index]?.name;
    if (rosterName && detectedIgn && similarity(detectedIgn, rosterName) >= 0.58) {
      player.ign = rosterName;
      player.confidence.ign = Math.max(ignResult.confidence, Math.round(similarity(detectedIgn, rosterName) * 100));
    } else if (detectedIgn) {
      player.ign = detectedIgn;
      player.confidence.ign = ignResult.confidence;
    } else if (rosterName) {
      player.ign = rosterName;
      player.confidence.ign = 90;
    }

    const kda = parseKda(kdaResult.text);
    if (kda) {
      player.kda = kda;
      player.confidence.kda = kdaResult.confidence;
    }

    const gold = parseGold(goldResult.text);
    if (gold) {
      player.gold = gold;
      player.confidence.gold = goldResult.confidence;
    }
  }

  async function scanSlot(side, index, { includeOcr = false } = {}) {
    await ensureReferenceSignatures();
    await scanVisualSlot(side, index);
    if (includeOcr) {
      try {
        await scanOcrSlot(side, index);
      } catch (error) {
        console.warn("OCR slot gagal.", error);
        setHint(`OCR gagal pada ${side.toUpperCase()} ${ROLES[index].label}; Hero + Item tetap dipakai.`, "warn");
      }
    }
  }

  async function scanAll() {
    if (!screenshotImage || scanBusy) return;
    scanBusy = true;
    els.scan.disabled = true;
    setStatus("SCANNING", "working");
    setProgress(1, "Menyiapkan scanner...");

    try {
      syncFromBroadcast({ preserveScan: true });
      await ensureReferenceSignatures();
      const includeOcr = els.scanMode.value === "full";
      const total = PLAYER_COUNT * 2;
      let done = 0;
      for (const side of SIDE_ORDER) {
        for (let index = 0; index < PLAYER_COUNT; index += 1) {
          const base = 18 + (done / total) * (includeOcr ? 66 : 78);
          setProgress(base, `Scan ${side.toUpperCase()} ${ROLES[index].label}...`);
          await scanVisualSlot(side, index);
          if (includeOcr) {
            try {
              await scanOcrSlot(side, index);
            } catch (error) {
              console.warn(error);
              setHint("OCR tidak tersedia / gagal. Hero + Item tetap selesai dan field teks dapat dikoreksi manual.", "warn");
            }
          }
          done += 1;
          saveState(false);
          renderReview();
          await new Promise(requestAnimationFrame);
        }
      }

      const summary = calculateQualitySummary();
      state.scanner.lastQuality = summary.quality;
      state.scanner.lastScanAt = Date.now();
      saveState();
      setProgress(100, `Selesai · Hero ${summary.heroes}/10 · Item ${summary.items}/60`);
      if (summary.quality >= 82 && summary.items >= 54) {
        setStatus("SIAP REVIEW", "good");
        setHint("Hasil scan tinggi. Periksa field berwarna warning, lalu tekan TAYANGKAN RESULT.", "good");
      } else if (summary.quality >= 65 || summary.items >= 45) {
        setStatus("PERLU REVIEW", "warn");
        setHint("Sebagian data confidence rendah. Koreksi slot warning atau gunakan Scan Ulang Slot sebelum tayang.", "warn");
      } else {
        setStatus("SCAN RENDAH", "error");
        setHint("Hasil scan terlalu rendah. Pilih area result lebih presisi / kalibrasi 10 slot, lalu scan ulang.", "error");
      }
    } catch (error) {
      console.error(error);
      setStatus("SCAN GAGAL", "error");
      setHint(error.message || "Scanner gagal.", "error");
      setProgress(0, "Scan gagal.");
    } finally {
      scanBusy = false;
      els.scan.disabled = !screenshotImage;
    }
  }

  function openPicker(type, side, index, itemIndex = -1) {
    pickerContext = { type, side, index, itemIndex };
    els.pickerTitle.textContent = type === "hero" ? "Pilih Hero Result" : `Pilih Item ${itemIndex + 1}`;
    els.pickerSearch.value = "";
    els.picker.setAttribute("aria-hidden", "false");
    document.body.classList.add("picker-open");
    renderPicker();
    setTimeout(() => els.pickerSearch.focus(), 0);
  }

  function closePicker() {
    pickerContext = null;
    els.picker.setAttribute("aria-hidden", "true");
    document.body.classList.remove("picker-open");
  }

  function renderPicker() {
    if (!pickerContext) return;
    const query = els.pickerSearch.value.trim().toLowerCase();
    const data = pickerContext.type === "hero" ? window.HOK_HEROES : window.HOK_ITEMS;
    const rows = data.filter((entry) => {
      const text = pickerContext.type === "hero"
        ? `${entry.name} ${(entry.positions || []).join(" ")}`
        : `${entry.name} ${entry.category} T${entry.tier}`;
      return !query || text.toLowerCase().includes(query);
    });

    els.pickerFilters.replaceChildren();
    const clear = document.createElement("button");
    clear.type = "button";
    clear.className = "picker-filter-button";
    clear.textContent = "KOSONGKAN";
    clear.addEventListener("click", () => applyPickerSelection(""));
    els.pickerFilters.append(clear);

    const fragment = document.createDocumentFragment();
    rows.forEach((entry) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "result-picker-card";
      const image = document.createElement("img");
      image.src = pickerContext.type === "hero" ? entry.assets.icon : entry.asset;
      image.alt = "";
      const copy = document.createElement("span");
      const strong = document.createElement("strong");
      strong.textContent = entry.name;
      const small = document.createElement("small");
      small.textContent = pickerContext.type === "hero"
        ? (entry.positions || [entry.role]).join(" · ")
        : `${entry.category} · Tier ${entry.tier}`;
      copy.append(strong, small);
      button.append(image, copy);
      button.addEventListener("click", () => applyPickerSelection(entry.id));
      fragment.append(button);
    });
    els.pickerGrid.replaceChildren(fragment);
  }

  function applyPickerSelection(id) {
    const { type, side, index, itemIndex } = pickerContext;
    const player = side === "blue" ? state.bluePlayers[index] : state.redPlayers[index];
    if (type === "hero") {
      player.heroId = window.HOK_HERO_MAP[id] ? id : "";
      player.confidence.hero = player.heroId ? 100 : 0;
    } else {
      player.items[itemIndex] = window.HOK_ITEM_MAP[id] ? id : "";
      player.confidence.items[itemIndex] = player.items[itemIndex] ? 100 : 0;
    }
    saveState();
    closePicker();
  }

  function bindReview() {
    els.panel.addEventListener("input", (event) => {
      const field = event.target.dataset.resultField;
      if (!field) return;
      const side = event.target.dataset.side;
      const index = safeInt(event.target.dataset.index, -1);
      const player = side === "blue" ? state.bluePlayers[index] : state.redPlayers[index];
      if (!player) return;
      player[field] = event.target.value.slice(0, field === "ign" ? 24 : 18);
      if (player.confidence[field] != null) player.confidence[field] = 100;
      saveState(false);
    });

    els.panel.addEventListener("change", (event) => {
      if (event.target.dataset.resultField) {
        saveState();
      }
    });

    els.panel.addEventListener("click", async (event) => {
      const pick = event.target.closest("[data-result-pick-type]");
      if (pick) {
        openPicker(
          pick.dataset.resultPickType,
          pick.dataset.side,
          safeInt(pick.dataset.index),
          safeInt(pick.dataset.itemIndex, -1)
        );
        return;
      }
      const rescan = event.target.closest("[data-rescan-side]");
      if (rescan && screenshotImage && !scanBusy) {
        scanBusy = true;
        try {
          const side = rescan.dataset.rescanSide;
          const index = safeInt(rescan.dataset.rescanIndex);
          setStatus("SCAN SLOT", "working");
          setProgress(20, `Scan ulang ${side.toUpperCase()} ${ROLES[index].label}...`);
          await scanSlot(side, index, { includeOcr: els.scanMode.value === "full" });
          state.scanner.lastScanAt = Date.now();
          saveState();
          setProgress(100, "Scan ulang slot selesai.");
          setStatus("SIAP REVIEW", "good");
        } catch (error) {
          setStatus("SCAN SLOT GAGAL", "error");
          setHint(error.message || "Scan ulang gagal.", "error");
        } finally {
          scanBusy = false;
        }
      }
    });
  }

  function bindEditor() {
    els.title.addEventListener("input", () => { state.title = els.title.value.slice(0, 32); saveState(false); });
    els.gameLabel.addEventListener("input", () => { state.gameLabel = els.gameLabel.value.slice(0, 24); saveState(false); });
    els.blueKills.addEventListener("input", () => { state.blueKills = clamp(safeInt(els.blueKills.value), 0, 999); saveState(false); });
    els.redKills.addEventListener("input", () => { state.redKills = clamp(safeInt(els.redKills.value), 0, 999); saveState(false); });

    const rangeBindings = [
      [els.x, "x", (v) => safeInt(v), els.xValue, (v) => `${v}px`],
      [els.y, "y", (v) => safeInt(v), els.yValue, (v) => `${v}px`],
      [els.scale, "scale", (v) => safeInt(v) / 100, els.scaleValue, (v) => `${Math.round(v * 100)}%`],
      [els.width, "width", (v) => safeInt(v), els.widthValue, (v) => `${v}px`],
      [els.panelOpacity, "panelOpacity", (v) => safeInt(v) / 100, els.panelOpacityValue, (v) => `${Math.round(v * 100)}%`],
      [els.cardOpacity, "cardOpacity", (v) => safeInt(v) / 100, els.cardOpacityValue, (v) => `${Math.round(v * 100)}%`],
      [els.cardGap, "cardGap", (v) => safeInt(v), els.cardGapValue, (v) => `${v}px`],
      [els.heroZoom, "heroZoom", (v) => safeInt(v) / 100, els.heroZoomValue, (v) => `${Math.round(v * 100)}%`]
    ];
    rangeBindings.forEach(([input, key, parse, output, format]) => {
      input.addEventListener("input", () => {
        state.layout[key] = parse(input.value);
        output.textContent = format(state.layout[key]);
        saveState(false);
      });
      input.addEventListener("change", () => saveState());
    });

    for (const [input, key] of [
      [els.showRoles, "showRoles"],
      [els.showKda, "showKda"],
      [els.showGold, "showGold"],
      [els.showItems, "showItems"]
    ]) {
      input.addEventListener("change", () => { state.layout[key] = input.checked; saveState(); });
    }

    els.resetLayout.addEventListener("click", () => {
      state.layout = defaultLayout();
      saveState();
      setHint("Layout result dikembalikan ke default.", "good");
    });

    els.show.addEventListener("click", () => {
      state.visible = true;
      saveState();
      setHint("Result Overlay ditayangkan. OBS source result.html akan tampil pada browser/origin yang sama.", "good");
    });
    els.hide.addEventListener("click", () => {
      state.visible = false;
      saveState();
      setHint("Result Overlay disembunyikan.", "good");
    });
  }

  function bindScanner() {
    els.screenshotInput.addEventListener("change", async () => {
      const file = els.screenshotInput.files?.[0];
      if (!file) return;
      try {
        await loadScreenshot(file);
      } catch (error) {
        setStatus("FILE GAGAL", "error");
        setHint("Screenshot gagal dibuka.", "error");
      } finally {
        els.screenshotInput.value = "";
      }
    });

    els.captureScreen.addEventListener("click", async () => {
      try {
        setHint("Pilih layar/window yang berisi result. Browser akan mengambil satu frame lalu menghentikan capture.", "warn");
        await captureDesktopScreenshot();
      } catch (error) {
        setStatus("CAPTURE GAGAL", "error");
        setHint(error.message || "Tangkap layar gagal.", "error");
      }
    });

    els.paste.addEventListener("click", async () => {
      try {
        await pasteScreenshotFromClipboard();
      } catch (error) {
        setStatus("CLIPBOARD GAGAL", "error");
        setHint(error.message || "Clipboard gagal dibaca.", "error");
      }
    });

    document.addEventListener("paste", async (event) => {
      const file = Array.from(event.clipboardData?.files || []).find((row) => row.type.startsWith("image/"));
      if (!file) return;
      try {
        await loadScreenshot(file);
        setHint("Screenshot ditempel dari clipboard. Pilih/deteksi area result lalu scan.", "good");
      } catch (error) {
        setHint("Gambar dari clipboard gagal dibuka.", "error");
      }
    });

    els.preset.addEventListener("change", () => {
      state.layout.variant = els.preset.value === "rows" ? "rows" : "horizontal";
      saveState();
      setHint("Layout overlay Result diperbarui. Mapping scanner tetap menggunakan format row hasil asli HoK.", "good");
    });

    document.querySelectorAll(".result-layout-option").forEach((button) => {
      button.addEventListener("click", () => {
        state.layout.variant = button.dataset.resultLayout === "rows" ? "rows" : "horizontal";
        els.preset.value = state.layout.variant;
        saveState();
        setHint("Layout output berubah. Scanner tidak berubah.", "good");
      });
    });

    els.autoArea.addEventListener("click", () => {
      if (!screenshotImage) return setHint("Upload screenshot terlebih dahulu.", "warn");
      const detected = detectLikelyPanel();
      setCrop(detected || { x: 0, y: 0, w: 1, h: 1 });
      setHint("Area hasil HoK terdeteksi. Periksa 10 box role; gunakan Pilih Area Manual hanya jika meleset.", "good");
    });

    els.fullArea.addEventListener("click", () => {
      if (!screenshotImage) return setHint("Upload screenshot terlebih dahulu.", "warn");
      setCrop({ x: 0, y: 0, w: 1, h: 1 });
      setHint("Seluruh screenshot dipakai sebagai area result.", "good");
    });

    els.manualArea.addEventListener("click", () => {
      if (!screenshotImage) return setHint("Upload screenshot terlebih dahulu.", "warn");
      interactionMode = "crop";
      setHint("Drag kotak pada preview untuk memilih area result. Tidak perlu crop file asli.", "warn");
    });

    els.calibrate.addEventListener("click", startCalibration);
    els.resetCalibration.addEventListener("click", () => {
      state.scanner.calibratedCards = null;
      saveState(false);
      drawPreview();
      setHint("Kalibrasi direset ke mapping row hasil HoK bawaan.", "good");
    });
    els.sync.addEventListener("click", () => syncFromBroadcast({ preserveScan: true }));
    els.scan.addEventListener("click", scanAll);
  }

  function bindPicker() {
    els.pickerClose.addEventListener("click", closePicker);
    els.picker.querySelectorAll("[data-result-picker-close]").forEach((node) => node.addEventListener("click", closePicker));
    els.pickerSearch.addEventListener("input", renderPicker);
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && pickerContext) closePicker();
    });
  }

  function init() {
    cacheElements();
    if (!els.panel) return;
    state = loadState();
    cropRect = { ...state.scanner.cropRect };
    bindCanvas();
    bindScanner();
    bindEditor();
    bindReview();
    bindPicker();
    renderAll();
    syncFromBroadcast({ preserveScan: true });
    if (state.scanner.lastScanAt) {
      const summary = calculateQualitySummary();
      setStatus(summary.quality >= 80 ? "SIAP REVIEW" : "PERLU REVIEW", summary.quality >= 80 ? "good" : "warn");
      setProgress(100, `Data scan tersimpan · Quality ${summary.quality}%`);
    }
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init, { once: true });
  } else {
    init();
  }
})();
