(() => {
  "use strict";

  const STORAGE_KEY = "hok_draft_state_v1";
  const PLAYER_COUNT = 5;
  const HERO_SLOT_COUNT = 5;
  const ITEM_SLOT_COUNT = 6;
  const DEFAULT_DRAFT_TIMER = 30;
  const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
  const MAX_GAME_TIMER = 99 * 60 + 59;
  const MAX_COUNTER = 999;
  const MAX_GOLD_DIFF = 999999;
  const LANE_FILTERS = ["Clash Lane", "Mid Lane", "Roam", "Farm Lane", "Jungle"];
  const PLAYER_PHOTO_SCALE_MIN = 0.85;
  const PLAYER_PHOTO_SCALE_MAX = 1.30;
  const PLAYER_PHOTO_OFFSET_MIN = -20;
  const PLAYER_PHOTO_OFFSET_MAX = 20;
  const HOTKEYS_ENABLED = false; // Revisi 1: dinonaktifkan sementara, bukan dihapus.

  const $ = (id) => document.getElementById(id);

  const emptyPlayers = () =>
    Array.from({ length: PLAYER_COUNT }, () => ({
      name: "",
      photo: "",
      photoScale: 1,
      photoOffsetY: 0
    }));

  const emptyItems = () =>
    Array.from({ length: PLAYER_COUNT }, () => Array(ITEM_SLOT_COUNT).fill(""));

  const emptyHeroSlots = () => Array(HERO_SLOT_COUNT).fill("");
  const emptyLocks = () => Array(HERO_SLOT_COUNT).fill(false);

  const createDefaultState = () => ({
    blueTeam: { name: "", logo: "", score: 0 },
    redTeam: { name: "", logo: "", score: 0 },
    bluePlayers: emptyPlayers(),
    redPlayers: emptyPlayers(),
    blueBans: emptyHeroSlots(),
    redBans: emptyHeroSlots(),
    bluePicks: emptyHeroSlots(),
    redPicks: emptyHeroSlots(),
    bluePickLocked: emptyLocks(),
    redPickLocked: emptyLocks(),
    activePick: null,
    timer: DEFAULT_DRAFT_TIMER,
    timerRunning: false,
    series: "BO3",
    bluePlayerItems: emptyItems(),
    redPlayerItems: emptyItems(),
    mode: "draft",
    gameTimer: 0,
    gameTimerRunning: false,
    blueKills: 0,
    redKills: 0,
    goldDiff: 0,
    blueTyrant: 0,
    redTyrant: 0,
    blueOverlord: 0,
    redOverlord: 0
  });

  const elements = {
    status: $("storageStatus"),
    activeModeBadge: $("activeModeBadge"),
    draftModeButton: $("draftModeButton"),
    ingameModeButton: $("ingameModeButton"),
    draftControls: $("draftControls"),
    ingameControls: $("ingameControls"),

    resetDraft: $("resetDraftButton"),
    resetIngame: $("resetIngameButton"),
    resetMatch: $("resetMatchButton"),
    resetSeries: $("resetSeriesButton"),
    resetEvent: $("resetEventButton"),

    series: $("seriesSelect"),
    timer: $("timerInput"),
    timerStart: $("timerStartButton"),
    timerStop: $("timerStopButton"),
    timerReset: $("timerResetButton"),

    blueTeamName: $("blueTeamName"),
    redTeamName: $("redTeamName"),
    blueLogoInput: $("blueLogoInput"),
    redLogoInput: $("redLogoInput"),
    blueLogoClear: $("blueLogoClear"),
    redLogoClear: $("redLogoClear"),
    blueLogoPreview: $("blueLogoPreview"),
    redLogoPreview: $("redLogoPreview"),
    blueScoreMinus: $("blueScoreMinus"),
    blueScorePlus: $("blueScorePlus"),
    redScoreMinus: $("redScoreMinus"),
    redScorePlus: $("redScorePlus"),
    blueScoreValue: $("blueScoreValue"),
    redScoreValue: $("redScoreValue"),
    bluePlayers: $("bluePlayers"),
    redPlayers: $("redPlayers"),
    blueItems: $("blueItems"),
    redItems: $("redItems"),
    blueBans: $("blueBans"),
    redBans: $("redBans"),
    bluePicks: $("bluePicks"),
    redPicks: $("redPicks"),

    ingameBlueTeamLabel: $("ingameBlueTeamLabel"),
    ingameRedTeamLabel: $("ingameRedTeamLabel"),
    ingameBlueSeriesScore: $("ingameBlueSeriesScore"),
    ingameRedSeriesScore: $("ingameRedSeriesScore"),
    gameTimerDisplay: $("gameTimerDisplay"),
    gameTimerStatus: $("gameTimerStatus"),
    gameTimerStart: $("gameTimerStartButton"),
    gameTimerPause: $("gameTimerPauseButton"),
    gameTimerReset: $("gameTimerResetButton"),

    blueKillsValue: $("blueKillsValue"),
    redKillsValue: $("redKillsValue"),
    blueKillsMinus: $("blueKillsMinus"),
    blueKillsPlus: $("blueKillsPlus"),
    redKillsMinus: $("redKillsMinus"),
    redKillsPlus: $("redKillsPlus"),

    goldDiffInput: $("goldDiffInput"),
    goldAdvantagePreview: $("goldAdvantagePreview"),
    goldReset: $("goldResetButton"),

    blueTyrantValue: $("blueTyrantValue"),
    redTyrantValue: $("redTyrantValue"),
    blueOverlordValue: $("blueOverlordValue"),
    redOverlordValue: $("redOverlordValue"),
    blueTyrantMinus: $("blueTyrantMinus"),
    blueTyrantPlus: $("blueTyrantPlus"),
    redTyrantMinus: $("redTyrantMinus"),
    redTyrantPlus: $("redTyrantPlus"),
    blueOverlordMinus: $("blueOverlordMinus"),
    blueOverlordPlus: $("blueOverlordPlus"),
    redOverlordMinus: $("redOverlordMinus"),
    redOverlordPlus: $("redOverlordPlus"),

    visualPicker: $("visualPicker"),
    pickerEyebrow: $("pickerEyebrow"),
    pickerTitle: $("pickerTitle"),
    pickerClose: $("pickerCloseButton"),
    pickerSearch: $("pickerSearch"),
    pickerFilters: $("pickerFilters"),
    pickerGrid: $("pickerGrid"),

    hotkeyFeedback: $("hotkeyFeedback")
  };

  let state = loadState();
  let draftTimerIntervalId = null;
  let gameTimerIntervalId = null;
  let statusTimeoutId = null;
  let hotkeyFeedbackTimeoutId = null;
  let pickerContext = null;
  let pickerFilter = "all";

  function safeInt(value, fallback = 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function safeFloat(value, fallback = 0) {
    const parsed = Number.parseFloat(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function normalizeSeries(value) {
    if (value === "BO1" || value === "BO5") {
      return value;
    }

    return "BO3";
  }

  function maxSeriesScore(series) {
    if (series === "BO1") {
      return 1;
    }

    return series === "BO5" ? 3 : 2;
  }

  function normalizeTeam(team, series) {
    const source = team && typeof team === "object" ? team : {};

    return {
      name: typeof source.name === "string" ? source.name.slice(0, 32) : "",
      logo: typeof source.logo === "string" ? source.logo : "",
      score: clamp(safeInt(source.score), 0, maxSeriesScore(series))
    };
  }

  function normalizePlayers(players) {
    const source = Array.isArray(players) ? players : [];

    return Array.from({ length: PLAYER_COUNT }, (_, index) => ({
      name: typeof source[index]?.name === "string" ? source[index].name.slice(0, 24) : "",
      photo: typeof source[index]?.photo === "string" ? source[index].photo : "",
      photoScale: clamp(
        safeFloat(source[index]?.photoScale, 1),
        PLAYER_PHOTO_SCALE_MIN,
        PLAYER_PHOTO_SCALE_MAX
      ),
      photoOffsetY: clamp(
        safeInt(source[index]?.photoOffsetY, 0),
        PLAYER_PHOTO_OFFSET_MIN,
        PLAYER_PHOTO_OFFSET_MAX
      )
    }));
  }

  function normalizeHeroSlots(slots) {
    const source = Array.isArray(slots) ? slots : [];

    return Array.from(
      { length: HERO_SLOT_COUNT },
      (_, index) => (window.HOK_HERO_MAP[source[index]] ? source[index] : "")
    );
  }

  function normalizeLocks(values, picks) {
    const source = Array.isArray(values) ? values : [];

    return Array.from(
      { length: HERO_SLOT_COUNT },
      (_, index) => Boolean(source[index] && picks[index])
    );
  }

  function normalizeItemSlots(rows) {
    const source = Array.isArray(rows) ? rows : [];

    return Array.from({ length: PLAYER_COUNT }, (_, playerIndex) => {
      const row = Array.isArray(source[playerIndex]) ? source[playerIndex] : [];

      return Array.from(
        { length: ITEM_SLOT_COUNT },
        (_, itemIndex) => (window.HOK_ITEM_MAP[row[itemIndex]] ? row[itemIndex] : "")
      );
    });
  }

  function normalizeActivePick(activePick, bluePicks, redPicks, blueLocks, redLocks) {
    if (!activePick || typeof activePick !== "object") {
      return null;
    }

    const side = activePick.side === "red" ? "red" : activePick.side === "blue" ? "blue" : "";
    const index = safeInt(activePick.index, -1);

    if (!side || index < 0 || index >= HERO_SLOT_COUNT) {
      return null;
    }

    const picks = side === "blue" ? bluePicks : redPicks;
    const locks = side === "blue" ? blueLocks : redLocks;

    if (!picks[index] || locks[index]) {
      return null;
    }

    return { side, index };
  }

  function normalizeState(candidate) {
    const source = candidate && typeof candidate === "object" ? candidate : {};
    const series = normalizeSeries(source.series);
    const bluePicks = normalizeHeroSlots(source.bluePicks);
    const redPicks = normalizeHeroSlots(source.redPicks);
    const bluePickLocked = normalizeLocks(source.bluePickLocked, bluePicks);
    const redPickLocked = normalizeLocks(source.redPickLocked, redPicks);

    return {
      blueTeam: normalizeTeam(source.blueTeam, series),
      redTeam: normalizeTeam(source.redTeam, series),
      bluePlayers: normalizePlayers(source.bluePlayers),
      redPlayers: normalizePlayers(source.redPlayers),
      blueBans: normalizeHeroSlots(source.blueBans),
      redBans: normalizeHeroSlots(source.redBans),
      bluePicks,
      redPicks,
      bluePickLocked,
      redPickLocked,
      activePick: normalizeActivePick(
        source.activePick,
        bluePicks,
        redPicks,
        bluePickLocked,
        redPickLocked
      ),
      timer: clamp(safeInt(source.timer, DEFAULT_DRAFT_TIMER), 0, 999),
      timerRunning: Boolean(source.timerRunning),
      series,
      bluePlayerItems: normalizeItemSlots(source.bluePlayerItems),
      redPlayerItems: normalizeItemSlots(source.redPlayerItems),
      mode: source.mode === "ingame" ? "ingame" : "draft",
      gameTimer: clamp(safeInt(source.gameTimer), 0, MAX_GAME_TIMER),
      gameTimerRunning: Boolean(source.gameTimerRunning),
      blueKills: clamp(safeInt(source.blueKills), 0, MAX_COUNTER),
      redKills: clamp(safeInt(source.redKills), 0, MAX_COUNTER),
      goldDiff: clamp(safeInt(source.goldDiff), -MAX_GOLD_DIFF, MAX_GOLD_DIFF),
      blueTyrant: clamp(safeInt(source.blueTyrant), 0, MAX_COUNTER),
      redTyrant: clamp(safeInt(source.redTyrant), 0, MAX_COUNTER),
      blueOverlord: clamp(safeInt(source.blueOverlord), 0, MAX_COUNTER),
      redOverlord: clamp(safeInt(source.redOverlord), 0, MAX_COUNTER)
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeState(JSON.parse(raw)) : createDefaultState();
    } catch (error) {
      console.error("Failed to load overlay state.", error);
      return createDefaultState();
    }
  }

  function saveState() {
    state = normalizeState(state);

    try {
      setStatus("Saving", "saving");
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      setStatus("Saved", "ok", true);
      return true;
    } catch (error) {
      console.error("Failed to save overlay state.", error);
      setStatus(
        error?.name === "QuotaExceededError" ? "Storage full" : "Save failed",
        "error"
      );
      return false;
    }
  }

  function setStatus(text, type = "ok", autoReset = false) {
    if (!elements.status) {
      return;
    }

    elements.status.textContent = text;
    elements.status.dataset.status = type;

    if (statusTimeoutId) {
      window.clearTimeout(statusTimeoutId);
      statusTimeoutId = null;
    }

    if (autoReset) {
      statusTimeoutId = window.setTimeout(() => {
        elements.status.textContent = "Ready";
        elements.status.dataset.status = "ok";
      }, 800);
    }
  }

  function showHotkeyFeedback(shortcut, action) {
    if (!elements.hotkeyFeedback) {
      return;
    }

    elements.hotkeyFeedback.innerHTML = "";

    const key = document.createElement("kbd");
    key.textContent = shortcut;

    const message = document.createElement("span");
    message.textContent = action;

    elements.hotkeyFeedback.append(key, message);
    elements.hotkeyFeedback.classList.add("is-visible");

    if (hotkeyFeedbackTimeoutId) {
      window.clearTimeout(hotkeyFeedbackTimeoutId);
    }

    hotkeyFeedbackTimeoutId = window.setTimeout(() => {
      elements.hotkeyFeedback.classList.remove("is-visible");
    }, 900);
  }

  function cssUrl(value) {
    return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  }

  function formatClock(totalSeconds) {
    const safeSeconds = clamp(safeInt(totalSeconds), 0, MAX_GAME_TIMER);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function formatGold(value) {
    const amount = Math.abs(safeInt(value));

    if (amount >= 1000) {
      const formatted = (amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1);
      return `${formatted}k`;
    }

    return String(amount);
  }

  function isPickStateKey(stateKey) {
    return stateKey === "bluePicks" || stateKey === "redPicks";
  }

  function getPickSide(stateKey) {
    return stateKey.startsWith("red") ? "red" : "blue";
  }

  function getPickLocks(side) {
    return side === "blue" ? state.bluePickLocked : state.redPickLocked;
  }

  function getPickArray(side) {
    return side === "blue" ? state.bluePicks : state.redPicks;
  }

  function isActivePick(side, index) {
    return state.activePick?.side === side && state.activePick?.index === index;
  }

  function getPickerEntries() {
    if (!pickerContext) {
      return [];
    }

    if (pickerContext.type === "hero") {
      return window.HOK_HEROES
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name));
    }

    return window.HOK_ITEMS
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name));
  }

  function getPickerFilterValues() {
    if (!pickerContext) {
      return [];
    }

    if (pickerContext.type === "hero") {
      return LANE_FILTERS.slice();
    }

    return [...new Set(window.HOK_ITEMS.map((item) => item.category).filter(Boolean))]
      .sort((a, b) => a.localeCompare(b));
  }

  function openVisualPicker(context) {
    pickerContext = context;
    pickerFilter = "all";

    const isHero = context.type === "hero";

    elements.pickerEyebrow.textContent = isHero ? "SELECT HERO" : "SELECT ITEM";

    if (isHero) {
      const label = isPickStateKey(context.stateKey) ? "Pick" : "Ban";
      elements.pickerTitle.textContent = `${label} Hero · Slot ${context.index + 1}`;
      elements.pickerSearch.placeholder = "Search Global hero name...";
    } else {
      elements.pickerTitle.textContent =
        `Choose Item · P${context.playerIndex + 1} · Slot ${context.itemIndex + 1}`;
      elements.pickerSearch.placeholder = "Search item...";
    }

    elements.pickerSearch.value = "";
    renderPickerFilters();
    renderPickerGrid();

    elements.visualPicker.classList.add("is-open");
    elements.visualPicker.setAttribute("aria-hidden", "false");
    document.body.classList.add("picker-open");

    window.setTimeout(() => elements.pickerSearch.focus(), 40);
  }

  function closeVisualPicker() {
    elements.visualPicker.classList.remove("is-open");
    elements.visualPicker.setAttribute("aria-hidden", "true");
    document.body.classList.remove("picker-open");

    pickerContext = null;
    pickerFilter = "all";
    elements.pickerSearch.value = "";
    elements.pickerFilters.replaceChildren();
    elements.pickerGrid.replaceChildren();
  }

  function renderPickerFilters() {
    elements.pickerFilters.replaceChildren();

    ["all", ...getPickerFilterValues()].forEach((value) => {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "picker-filter-button";
      button.dataset.filter = value;
      button.textContent = value === "all" ? "All" : value;
      button.classList.toggle("is-active", pickerFilter === value);
      elements.pickerFilters.append(button);
    });
  }

  function createPickerImage(source, fallbackText) {
    const image = document.createElement("span");
    image.className = "picker-card-image";

    if (source) {
      image.style.backgroundImage = `url("${cssUrl(source)}")`;

      const probe = new Image();
      probe.onerror = () => {
        image.style.backgroundImage = "";
        image.classList.add("is-fallback");
        image.textContent = fallbackText;
      };
      probe.src = source;
    } else {
      image.classList.add("is-fallback");
      image.textContent = fallbackText;
    }

    return image;
  }

  function createEmptyPickerCard() {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "picker-card picker-card-empty";
    button.dataset.pickerValue = "";

    const image = document.createElement("span");
    image.className = "picker-card-image is-fallback";
    image.textContent = "×";

    const copy = document.createElement("span");
    copy.className = "picker-card-copy";

    const name = document.createElement("strong");
    name.textContent = "Empty / Clear";

    const meta = document.createElement("small");
    meta.textContent = "Remove current selection";

    copy.append(name, meta);
    button.append(image, copy);

    return button;
  }

  function createHeroPickerCard(hero) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "picker-card picker-card-hero";
    button.dataset.pickerValue = hero.id;

    const image = createPickerImage(
      hero.assets?.icon,
      hero.name.slice(0, 2).toUpperCase()
    );

    const copy = document.createElement("span");
    copy.className = "picker-card-copy";

    const name = document.createElement("strong");
    name.textContent = hero.name;

    const meta = document.createElement("small");
    meta.textContent = Array.isArray(hero.positions)
      ? hero.positions.join(" · ")
      : hero.role;

    copy.append(name, meta);
    button.append(image, copy);

    return button;
  }

  function createItemPickerCard(item) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "picker-card picker-card-item";
    button.dataset.pickerValue = item.id;

    const image = createPickerImage(item.asset, "IT");

    const copy = document.createElement("span");
    copy.className = "picker-card-copy";

    const name = document.createElement("strong");
    name.textContent = item.name;

    const meta = document.createElement("small");
    meta.textContent = `${item.category}${item.tier ? ` · Tier ${item.tier}` : ""}`;

    copy.append(name, meta);
    button.append(image, copy);

    return button;
  }

  function renderPickerGrid() {
    elements.pickerGrid.replaceChildren();

    if (!pickerContext) {
      return;
    }

    const query = elements.pickerSearch.value.trim().toLowerCase();

    const entries = getPickerEntries().filter((entry) => {
      const matchesFilter = pickerFilter === "all"
        || (
          pickerContext.type === "hero"
            ? Array.isArray(entry.positions) && entry.positions.includes(pickerFilter)
            : entry.category === pickerFilter
        );

      const haystack = pickerContext.type === "hero"
        ? `${entry.name} ${entry.role} ${(entry.positions || []).join(" ")} ${entry.sourceKey || ""}`
        : `${entry.name} ${entry.category} ${entry.tier || ""}`;

      return matchesFilter && (!query || haystack.toLowerCase().includes(query));
    });

    elements.pickerGrid.append(createEmptyPickerCard());

    entries.forEach((entry) => {
      elements.pickerGrid.append(
        pickerContext.type === "hero"
          ? createHeroPickerCard(entry)
          : createItemPickerCard(entry)
      );
    });

    if (entries.length === 0) {
      const empty = document.createElement("div");
      empty.className = "picker-no-results";
      empty.textContent = "No matching data.";
      elements.pickerGrid.append(empty);
    }
  }

  function applyPickerSelection(value) {
    if (!pickerContext) {
      return;
    }

    if (pickerContext.type === "hero") {
      const heroId = window.HOK_HERO_MAP[value] ? value : "";
      const { stateKey, index } = pickerContext;

      state[stateKey][index] = heroId;

      if (isPickStateKey(stateKey)) {
        const side = getPickSide(stateKey);
        const locks = getPickLocks(side);
        locks[index] = false;
        state.activePick = heroId ? { side, index } : null;
      }

      saveState();
      renderHeroEditors(stateKey, state[stateKey]);
    } else {
      const rows = pickerContext.side === "blue"
        ? state.bluePlayerItems
        : state.redPlayerItems;

      const itemId = window.HOK_ITEM_MAP[value] ? value : "";
      rows[pickerContext.playerIndex][pickerContext.itemIndex] = itemId;

      saveState();
      renderItemEditors(pickerContext.side, rows);
    }

    closeVisualPicker();
  }

  function renderPreview(node, source, fallback) {
    if (!node) {
      return;
    }

    node.style.backgroundImage = source ? `url("${cssUrl(source)}")` : "";
    node.textContent = source ? "" : fallback;
  }

  function buildPlayerEditors(side, container) {
    container.replaceChildren();

    for (let index = 0; index < PLAYER_COUNT; index += 1) {
      const card = document.createElement("article");
      card.className = "player-editor-card";
      card.dataset.side = side;
      card.dataset.index = String(index);

      const main = document.createElement("div");
      main.className = "player-editor-row";

      const slot = document.createElement("span");
      slot.className = "slot-number";
      slot.textContent = String(index + 1).padStart(2, "0");

      const nameInput = document.createElement("input");
      nameInput.type = "text";
      nameInput.maxLength = 24;
      nameInput.placeholder = `Player ${index + 1}`;
      nameInput.dataset.side = side;
      nameInput.dataset.index = String(index);
      nameInput.className = "player-name-input";

      const uploadLabel = document.createElement("label");
      uploadLabel.className = "file-button player-upload";
      uploadLabel.textContent = "Photo";

      const uploadInput = document.createElement("input");
      uploadInput.type = "file";
      uploadInput.accept = "image/png,image/jpeg,image/webp";
      uploadInput.dataset.side = side;
      uploadInput.dataset.index = String(index);
      uploadInput.className = "player-photo-input";
      uploadLabel.append(uploadInput);

      const preview = document.createElement("div");
      preview.className = "image-preview player-preview";
      preview.dataset.side = side;
      preview.dataset.index = String(index);

      const previewImage = document.createElement("img");
      previewImage.className = "player-preview-image";
      previewImage.alt = "";
      previewImage.hidden = true;

      const previewFallback = document.createElement("span");
      previewFallback.className = "player-preview-fallback";
      previewFallback.textContent = "P";

      preview.append(previewImage, previewFallback);
      main.append(slot, nameInput, uploadLabel, preview);

      const adjustments = document.createElement("div");
      adjustments.className = "photo-adjust-row";

      const scaleLabel = document.createElement("label");
      scaleLabel.className = "photo-adjust-control";
      scaleLabel.innerHTML = `
        <span>Scale <output class="photo-scale-value">100%</output></span>
        <input
          class="player-photo-scale"
          data-side="${side}"
          data-index="${index}"
          type="range"
          min="85"
          max="130"
          step="1"
          value="100"
        >
      `;

      const offsetLabel = document.createElement("label");
      offsetLabel.className = "photo-adjust-control";
      offsetLabel.innerHTML = `
        <span>Vertical <output class="photo-offset-value">0%</output></span>
        <input
          class="player-photo-offset"
          data-side="${side}"
          data-index="${index}"
          type="range"
          min="-20"
          max="20"
          step="1"
          value="0"
        >
      `;

      const resetFrame = document.createElement("button");
      resetFrame.type = "button";
      resetFrame.className = "photo-frame-button";
      resetFrame.dataset.action = "reset-frame";
      resetFrame.dataset.index = String(index);
      resetFrame.textContent = "Reset Frame";

      const clearPhoto = document.createElement("button");
      clearPhoto.type = "button";
      clearPhoto.className = "photo-frame-button is-danger";
      clearPhoto.dataset.action = "clear-photo";
      clearPhoto.dataset.index = String(index);
      clearPhoto.textContent = "Clear Photo";

      adjustments.append(scaleLabel, offsetLabel, resetFrame, clearPhoto);
      card.append(main, adjustments);
      container.append(card);
    }
  }

  function buildHeroEditors(stateKey, container) {
    const isPick = isPickStateKey(stateKey);
    container.replaceChildren();

    for (let index = 0; index < HERO_SLOT_COUNT; index += 1) {
      const row = document.createElement("div");
      row.className = `hero-select-row${isPick ? " is-pick-row" : ""}`;

      const button = document.createElement("button");
      button.type = "button";
      button.className = "hero-picker-button";
      button.dataset.stateKey = stateKey;
      button.dataset.index = String(index);

      const image = document.createElement("span");
      image.className = "hero-control-preview";

      const copy = document.createElement("span");
      copy.className = "hero-picker-copy";

      const name = document.createElement("strong");
      name.className = "hero-picker-name";
      name.textContent = "Select hero";

      const role = document.createElement("small");
      role.className = "hero-picker-role";
      role.textContent = `Slot ${index + 1}`;

      copy.append(name, role);
      button.append(image, copy);
      row.append(button);

      if (isPick) {
        const status = document.createElement("span");
        status.className = "pick-control-status";
        status.dataset.index = String(index);
        status.textContent = "EMPTY";

        const lockButton = document.createElement("button");
        lockButton.type = "button";
        lockButton.className = "pick-lock-button";
        lockButton.dataset.index = String(index);
        lockButton.textContent = "LOCK & TAYANGKAN";

        row.append(status, lockButton);
      }

      const clearButton = document.createElement("button");
      clearButton.type = "button";
      clearButton.className = "clear-slot";
      clearButton.dataset.index = String(index);
      clearButton.textContent = "HAPUS";
      clearButton.setAttribute("aria-label", `Clear slot ${index + 1}`);
      row.append(clearButton);

      container.append(row);
    }
  }

  function buildItemEditors(side, container) {
    container.replaceChildren();

    for (let playerIndex = 0; playerIndex < PLAYER_COUNT; playerIndex += 1) {
      const row = document.createElement("div");
      row.className = "item-player-row";

      const label = document.createElement("strong");
      label.textContent = `P${playerIndex + 1}`;

      const slots = document.createElement("div");
      slots.className = "item-slots-control";

      for (let itemIndex = 0; itemIndex < ITEM_SLOT_COUNT; itemIndex += 1) {
        const button = document.createElement("button");
        button.type = "button";
        button.className = "item-picker-button";
        button.dataset.side = side;
        button.dataset.player = String(playerIndex);
        button.dataset.slot = String(itemIndex);

        const icon = document.createElement("span");
        icon.className = "item-control-icon";

        const name = document.createElement("span");
        name.className = "item-control-name";
        name.textContent = "Empty";

        button.append(icon, name);
        slots.append(button);
      }

      row.append(label, slots);
      container.append(row);
    }
  }

  function renderMode() {
    const isDraft = state.mode === "draft";

    elements.draftModeButton.classList.toggle("is-active", isDraft);
    elements.ingameModeButton.classList.toggle("is-active", !isDraft);
    elements.draftModeButton.setAttribute("aria-selected", String(isDraft));
    elements.ingameModeButton.setAttribute("aria-selected", String(!isDraft));

    elements.draftControls.classList.toggle("is-hidden", !isDraft);
    elements.ingameControls.classList.toggle("is-hidden", isDraft);

    elements.activeModeBadge.textContent = isDraft ? "DRAFT MODE" : "IN-GAME MODE";
    elements.activeModeBadge.dataset.mode = state.mode;
  }

  function renderAll() {
    renderMode();

    elements.series.value = state.series;
    elements.timer.value = String(state.timer);
    elements.blueTeamName.value = state.blueTeam.name;
    elements.redTeamName.value = state.redTeam.name;
    elements.blueScoreValue.textContent = String(state.blueTeam.score);
    elements.redScoreValue.textContent = String(state.redTeam.score);

    renderPreview(elements.blueLogoPreview, state.blueTeam.logo, "BL");
    renderPreview(elements.redLogoPreview, state.redTeam.logo, "RD");
    renderPlayers("blue", state.bluePlayers);
    renderPlayers("red", state.redPlayers);

    for (const key of ["blueBans", "redBans", "bluePicks", "redPicks"]) {
      renderHeroEditors(key, state[key]);
    }

    renderItemEditors("blue", state.bluePlayerItems);
    renderItemEditors("red", state.redPlayerItems);
    renderIngameControls();

    syncDraftTimer();
    syncGameTimer();
  }

  function renderPlayers(side, players) {
    const container = side === "blue" ? elements.bluePlayers : elements.redPlayers;
    const cards = container.querySelectorAll(".player-editor-card");

    players.forEach((player, index) => {
      const card = cards[index];

      if (!card) {
        return;
      }

      const nameInput = card.querySelector(".player-name-input");
      const previewImage = card.querySelector(".player-preview-image");
      const previewFallback = card.querySelector(".player-preview-fallback");
      const scaleInput = card.querySelector(".player-photo-scale");
      const offsetInput = card.querySelector(".player-photo-offset");
      const scaleValue = card.querySelector(".photo-scale-value");
      const offsetValue = card.querySelector(".photo-offset-value");

      if (nameInput) {
        nameInput.value = player.name;
      }

      if (previewImage && previewFallback) {
        if (player.photo) {
          previewImage.src = player.photo;
          previewImage.hidden = false;
          previewImage.style.transform =
            `translateY(${player.photoOffsetY}%) scale(${player.photoScale})`;
          previewFallback.hidden = true;
        } else {
          previewImage.removeAttribute("src");
          previewImage.hidden = true;
          previewImage.style.transform = "";
          previewFallback.hidden = false;
          previewFallback.textContent = "P";
        }
      }

      if (scaleInput) {
        scaleInput.value = String(Math.round(player.photoScale * 100));
      }

      if (offsetInput) {
        offsetInput.value = String(player.photoOffsetY);
      }

      if (scaleValue) {
        scaleValue.textContent = `${Math.round(player.photoScale * 100)}%`;
      }

      if (offsetValue) {
        const prefix = player.photoOffsetY > 0 ? "+" : "";
        offsetValue.textContent = `${prefix}${player.photoOffsetY}%`;
      }
    });
  }

  function renderHeroEditors(stateKey, values) {
    const container = elements[stateKey];
    const isPick = isPickStateKey(stateKey);
    const side = isPick ? getPickSide(stateKey) : "";
    const locks = isPick ? getPickLocks(side) : [];
    const buttons = container.querySelectorAll(".hero-picker-button");

    values.forEach((heroId, index) => {
      const hero = window.HOK_HERO_MAP[heroId];
      const button = buttons[index];

      if (!button) {
        return;
      }

      const preview = button.querySelector(".hero-control-preview");
      const name = button.querySelector(".hero-picker-name");
      const role = button.querySelector(".hero-picker-role");

      if (preview) {
        preview.style.backgroundImage = hero
          ? `url("${cssUrl(hero.assets.icon)}")`
          : "";
        preview.textContent = hero ? "" : String(index + 1);
        preview.title = hero ? hero.name : "Empty";
      }

      if (name) {
        name.textContent = hero?.name || "Select hero";
      }

      if (role) {
        role.textContent = hero
          ? (hero.positions || [hero.role]).join(" · ")
          : `Slot ${index + 1}`;
      }

      button.classList.toggle("has-value", Boolean(hero));

      if (isPick) {
        const row = button.closest(".hero-select-row");
        const status = row?.querySelector(".pick-control-status");
        const lockButton = row?.querySelector(".pick-lock-button");
        const locked = Boolean(locks[index]);
        const active = Boolean(hero && isActivePick(side, index));

        if (status) {
          status.textContent = !hero ? "KOSONG" : locked ? "ON AIR" : "SIAP LOCK";
          status.dataset.status = !hero ? "empty" : locked ? "locked" : "ready";
        }

        if (lockButton) {
          lockButton.disabled = !hero;
          lockButton.textContent = locked ? "UNLOCK" : "LOCK & TAYANGKAN";
          lockButton.classList.toggle("is-locked", locked);
          lockButton.title = locked
            ? "Unlock hero ini agar dapat dikoreksi"
            : "Lock hero dan tampilkan ke Draft Display / OBS";
        }

        // Hero yang sudah ON AIR harus di-UNLOCK sebelum dapat diganti.
        button.disabled = locked;
        button.title = locked
          ? "Hero sudah ON AIR. Tekan UNLOCK untuk mengubah."
          : hero
            ? "Hero dipilih di control tetapi belum tampil di OBS"
            : "Pilih hero";

        row?.classList.toggle("is-active-pick", Boolean(hero && !locked && active));
      }
    });
  }

  function renderItemEditors(side, rows) {
    const container = side === "blue" ? elements.blueItems : elements.redItems;

    container.querySelectorAll(".item-picker-button").forEach((button) => {
      const playerIndex = safeInt(button.dataset.player, -1);
      const itemIndex = safeInt(button.dataset.slot, -1);
      const itemId = rows[playerIndex]?.[itemIndex] || "";
      const item = window.HOK_ITEM_MAP[itemId];
      const icon = button.querySelector(".item-control-icon");
      const name = button.querySelector(".item-control-name");

      if (icon) {
        icon.style.backgroundImage = item ? `url("${cssUrl(item.asset)}")` : "";
        icon.title = item?.name || "Empty";
      }

      if (name) {
        name.textContent = item?.name || "Empty";
      }

      button.classList.toggle("has-value", Boolean(item));
    });
  }

  function renderIngameControls() {
    elements.ingameBlueTeamLabel.textContent = state.blueTeam.name || "BLUE TEAM";
    elements.ingameRedTeamLabel.textContent = state.redTeam.name || "RED TEAM";
    elements.ingameBlueSeriesScore.textContent = String(state.blueTeam.score);
    elements.ingameRedSeriesScore.textContent = String(state.redTeam.score);

    elements.gameTimerDisplay.textContent = formatClock(state.gameTimer);
    elements.gameTimerStatus.textContent = state.gameTimerRunning ? "RUNNING" : "PAUSED";
    elements.gameTimerStatus.dataset.running = String(state.gameTimerRunning);

    elements.blueKillsValue.textContent = String(state.blueKills);
    elements.redKillsValue.textContent = String(state.redKills);

    elements.goldDiffInput.value = String(state.goldDiff);
    renderGoldPreview();

    elements.blueTyrantValue.textContent = String(state.blueTyrant);
    elements.redTyrantValue.textContent = String(state.redTyrant);
    elements.blueOverlordValue.textContent = String(state.blueOverlord);
    elements.redOverlordValue.textContent = String(state.redOverlord);
  }

  function renderGoldPreview() {
    const value = state.goldDiff;
    const preview = elements.goldAdvantagePreview;

    preview.classList.remove("is-blue", "is-red", "is-even");

    if (value > 0) {
      preview.textContent = `BLUE +${formatGold(value)}`;
      preview.classList.add("is-blue");
    } else if (value < 0) {
      preview.textContent = `RED +${formatGold(value)}`;
      preview.classList.add("is-red");
    } else {
      preview.textContent = "EVEN";
      preview.classList.add("is-even");
    }
  }

  function setMode(mode) {
    state.mode = mode === "ingame" ? "ingame" : "draft";
    saveState();
    renderMode();
  }

  function updateSeriesScore(side, delta) {
    const team = side === "blue" ? state.blueTeam : state.redTeam;

    team.score = clamp(
      team.score + delta,
      0,
      maxSeriesScore(state.series)
    );

    saveState();
    renderAll();
  }

  function updateCounter(key, delta) {
    state[key] = clamp(safeInt(state[key]) + delta, 0, MAX_COUNTER);
    saveState();
    renderIngameControls();
  }

  function updateGoldDiff(value) {
    state.goldDiff = clamp(safeInt(value), -MAX_GOLD_DIFF, MAX_GOLD_DIFF);
    saveState();
    renderIngameControls();
  }

  function resetDraftFields() {
    state.blueBans = emptyHeroSlots();
    state.redBans = emptyHeroSlots();
    state.bluePicks = emptyHeroSlots();
    state.redPicks = emptyHeroSlots();
    state.bluePickLocked = emptyLocks();
    state.redPickLocked = emptyLocks();
    state.activePick = null;
    state.timer = DEFAULT_DRAFT_TIMER;
    state.timerRunning = false;
  }

  function resetIngameFields() {
    state.gameTimer = 0;
    state.gameTimerRunning = false;
    state.blueKills = 0;
    state.redKills = 0;
    state.goldDiff = 0;
    state.blueTyrant = 0;
    state.redTyrant = 0;
    state.blueOverlord = 0;
    state.redOverlord = 0;
  }

  function resetDraftState({ confirmReset = true } = {}) {
    if (
      confirmReset
      && !window.confirm("Reset ban, pick, pick lock status, and draft timer? Team/player setup and series score will stay.")
    ) {
      return false;
    }

    resetDraftFields();
    saveState();
    renderAll();
    return true;
  }

  function resetIngameStats({ confirmReset = true } = {}) {
    if (
      confirmReset
      && !window.confirm("Reset game timer, kills, gold advantage and objectives? Team/player setup and series score will stay.")
    ) {
      return false;
    }

    resetIngameFields();
    saveState();
    renderAll();
    return true;
  }

  function resetMatchState() {
    if (
      !window.confirm("Reset Draft + In-Game stats for the next game? Team/player setup and series score will stay.")
    ) {
      return;
    }

    resetDraftFields();
    resetIngameFields();
    saveState();
    renderAll();
  }

  function resetSeriesState() {
    if (
      !window.confirm("Reset the full series score and all match stats? Team, logo, player names/photos and items will stay.")
    ) {
      return;
    }

    resetDraftFields();
    resetIngameFields();
    state.blueTeam.score = 0;
    state.redTeam.score = 0;
    saveState();
    renderAll();
  }

  function resetEventState() {
    if (
      !window.confirm("CLEAR ALL EVENT DATA? This removes team names, logos, player names/photos, items, score, draft and in-game stats.")
    ) {
      return;
    }

    state = createDefaultState();
    saveState();
    renderAll();
  }

  function togglePickLock(stateKey, index) {
    const side = getPickSide(stateKey);
    const picks = getPickArray(side);
    const locks = getPickLocks(side);

    if (!picks[index]) {
      return;
    }

    const nextLocked = !locks[index];
    locks[index] = nextLocked;

    if (nextLocked) {
      if (isActivePick(side, index)) {
        state.activePick = null;
      }
    } else {
      state.activePick = { side, index };
    }

    saveState();
    renderHeroEditors(stateKey, picks);
  }

  async function handleLogo(side, event) {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    try {
      const dataUrl = await imageToDataUrl(file, 512, 512, 0.86);
      (side === "blue" ? state.blueTeam : state.redTeam).logo = dataUrl;
      saveState();
      renderAll();
    } catch (error) {
      setStatus(error.message || "Image failed", "error");
    } finally {
      event.target.value = "";
    }
  }

  function clearLogo(side) {
    (side === "blue" ? state.blueTeam : state.redTeam).logo = "";
    saveState();
    renderAll();
  }

  function imageToDataUrl(file, maxWidth, maxHeight, quality) {
    if (!file.type.startsWith("image/")) {
      return Promise.reject(new Error("File must be an image"));
    }

    if (file.size > IMAGE_MAX_BYTES) {
      return Promise.reject(new Error("Image max 8 MB"));
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();

      reader.onerror = () => reject(new Error("Cannot read image"));

      reader.onload = () => {
        const image = new Image();

        image.onerror = () => reject(new Error("Invalid image"));

        image.onload = () => {
          const scale = Math.min(
            1,
            maxWidth / image.width,
            maxHeight / image.height
          );

          const canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(image.width * scale));
          canvas.height = Math.max(1, Math.round(image.height * scale));

          const context = canvas.getContext("2d");

          if (!context) {
            reject(new Error("Canvas unavailable"));
            return;
          }

          context.clearRect(0, 0, canvas.width, canvas.height);
          context.drawImage(image, 0, 0, canvas.width, canvas.height);

          try {
            resolve(canvas.toDataURL("image/webp", quality));
          } catch (error) {
            reject(new Error("Image encoding failed"));
          }
        };

        image.src = String(reader.result);
      };

      reader.readAsDataURL(file);
    });
  }

  function syncDraftTimer() {
    if (draftTimerIntervalId !== null) {
      window.clearInterval(draftTimerIntervalId);
      draftTimerIntervalId = null;
    }

    if (!state.timerRunning) {
      return;
    }

    draftTimerIntervalId = window.setInterval(() => {
      state.timer = Math.max(0, state.timer - 1);

      if (state.timer === 0) {
        state.timerRunning = false;
      }

      saveState();
      elements.timer.value = String(state.timer);

      if (!state.timerRunning) {
        syncDraftTimer();
      }
    }, 1000);
  }

  function syncGameTimer() {
    if (gameTimerIntervalId !== null) {
      window.clearInterval(gameTimerIntervalId);
      gameTimerIntervalId = null;
    }

    if (!state.gameTimerRunning) {
      return;
    }

    gameTimerIntervalId = window.setInterval(() => {
      state.gameTimer = Math.min(MAX_GAME_TIMER, state.gameTimer + 1);

      if (state.gameTimer >= MAX_GAME_TIMER) {
        state.gameTimerRunning = false;
      }

      saveState();
      renderIngameControls();

      if (!state.gameTimerRunning) {
        syncGameTimer();
      }
    }, 1000);
  }

  function isTypingTarget(target) {
    if (!(target instanceof Element)) {
      return false;
    }

    return Boolean(
      target.closest(
        'input, textarea, select, [contenteditable="true"], [contenteditable=""], [role="textbox"]'
      )
    );
  }

  function handleHotkey(event) {
    if (!HOTKEYS_ENABLED) {
      return;
    }

    if (
      state.mode !== "ingame"
      || event.repeat
      || event.ctrlKey
      || event.altKey
      || event.metaKey
      || isTypingTarget(event.target)
      || elements.visualPicker.classList.contains("is-open")
    ) {
      return;
    }

    const key = event.key.toLowerCase();
    let handled = true;

    switch (key) {
      case "q":
        updateCounter("blueKills", 1);
        showHotkeyFeedback("Q", "Blue Kill +1");
        break;

      case "e":
        updateCounter("redKills", 1);
        showHotkeyFeedback("E", "Red Kill +1");
        break;

      case "a":
        updateGoldDiff(state.goldDiff + (event.shiftKey ? 500 : 200));
        showHotkeyFeedback(event.shiftKey ? "Shift+A" : "A", event.shiftKey ? "Blue Gold +500" : "Blue Gold +200");
        break;

      case "d":
        updateGoldDiff(state.goldDiff - (event.shiftKey ? 500 : 200));
        showHotkeyFeedback(event.shiftKey ? "Shift+D" : "D", event.shiftKey ? "Red Gold +500" : "Red Gold +200");
        break;

      case "z":
        updateCounter("blueTyrant", 1);
        showHotkeyFeedback("Z", "Blue Tyrant +1");
        break;

      case "x":
        updateCounter("redTyrant", 1);
        showHotkeyFeedback("X", "Red Tyrant +1");
        break;

      case "c":
        updateCounter("blueOverlord", 1);
        showHotkeyFeedback("C", "Blue Overlord +1");
        break;

      case "v":
        updateCounter("redOverlord", 1);
        showHotkeyFeedback("V", "Red Overlord +1");
        break;

      case " ":
        state.gameTimerRunning = !state.gameTimerRunning;
        saveState();
        renderAll();
        showHotkeyFeedback("Space", state.gameTimerRunning ? "Game Timer Started" : "Game Timer Paused");
        break;

      case "t":
        state.gameTimer = 0;
        state.gameTimerRunning = false;
        saveState();
        renderAll();
        showHotkeyFeedback("T", "Game Timer Reset");
        break;

      case "r":
        resetIngameFields();
        saveState();
        renderAll();
        showHotkeyFeedback("R", "In-Game Stats Reset");
        break;

      default:
        handled = false;
        break;
    }

    if (handled) {
      event.preventDefault();
    }
  }

  function bindEvents() {
    elements.draftModeButton.addEventListener("click", () => setMode("draft"));
    elements.ingameModeButton.addEventListener("click", () => setMode("ingame"));

    elements.resetDraft.addEventListener("click", () => resetDraftState());
    elements.resetIngame.addEventListener("click", () => resetIngameStats());
    elements.resetMatch.addEventListener("click", resetMatchState);
    elements.resetSeries.addEventListener("click", resetSeriesState);
    elements.resetEvent.addEventListener("click", resetEventState);

    elements.blueTeamName.addEventListener("input", (event) => {
      state.blueTeam.name = event.target.value.slice(0, 32);
      saveState();
      renderIngameControls();
    });

    elements.redTeamName.addEventListener("input", (event) => {
      state.redTeam.name = event.target.value.slice(0, 32);
      saveState();
      renderIngameControls();
    });

    elements.series.addEventListener("change", (event) => {
      state.series = normalizeSeries(event.target.value);
      state.blueTeam.score = clamp(
        state.blueTeam.score,
        0,
        maxSeriesScore(state.series)
      );
      state.redTeam.score = clamp(
        state.redTeam.score,
        0,
        maxSeriesScore(state.series)
      );
      saveState();
      renderAll();
    });

    elements.timer.addEventListener("change", (event) => {
      state.timer = clamp(
        safeInt(event.target.value, DEFAULT_DRAFT_TIMER),
        0,
        999
      );

      if (state.timer === 0) {
        state.timerRunning = false;
      }

      saveState();
      renderAll();
    });

    elements.timerStart.addEventListener("click", () => {
      if (state.timer <= 0) {
        state.timer = DEFAULT_DRAFT_TIMER;
      }

      state.timerRunning = true;
      saveState();
      renderAll();
    });

    elements.timerStop.addEventListener("click", () => {
      state.timerRunning = false;
      saveState();
      renderAll();
    });

    elements.timerReset.addEventListener("click", () => {
      state.timer = DEFAULT_DRAFT_TIMER;
      state.timerRunning = false;
      saveState();
      renderAll();
    });

    elements.blueScoreMinus.addEventListener("click", () => updateSeriesScore("blue", -1));
    elements.blueScorePlus.addEventListener("click", () => updateSeriesScore("blue", 1));
    elements.redScoreMinus.addEventListener("click", () => updateSeriesScore("red", -1));
    elements.redScorePlus.addEventListener("click", () => updateSeriesScore("red", 1));

    elements.blueLogoInput.addEventListener("change", (event) => handleLogo("blue", event));
    elements.redLogoInput.addEventListener("change", (event) => handleLogo("red", event));
    elements.blueLogoClear.addEventListener("click", () => clearLogo("blue"));
    elements.redLogoClear.addEventListener("click", () => clearLogo("red"));

    for (const side of ["blue", "red"]) {
      const playerContainer = side === "blue" ? elements.bluePlayers : elements.redPlayers;
      const itemContainer = side === "blue" ? elements.blueItems : elements.redItems;

      playerContainer.addEventListener("input", (event) => {
        const players = side === "blue" ? state.bluePlayers : state.redPlayers;
        const index = safeInt(event.target.dataset.index, -1);

        if (!players[index]) {
          return;
        }

        if (event.target.matches(".player-name-input")) {
          players[index].name = event.target.value.slice(0, 24);
          saveState();
          return;
        }

        if (event.target.matches(".player-photo-scale")) {
          players[index].photoScale = clamp(
            safeFloat(event.target.value, 100) / 100,
            PLAYER_PHOTO_SCALE_MIN,
            PLAYER_PHOTO_SCALE_MAX
          );
          saveState();
          renderPlayers(side, players);
          return;
        }

        if (event.target.matches(".player-photo-offset")) {
          players[index].photoOffsetY = clamp(
            safeInt(event.target.value, 0),
            PLAYER_PHOTO_OFFSET_MIN,
            PLAYER_PHOTO_OFFSET_MAX
          );
          saveState();
          renderPlayers(side, players);
        }
      });

      playerContainer.addEventListener("change", async (event) => {
        if (!event.target.matches(".player-photo-input")) {
          return;
        }

        const file = event.target.files?.[0];

        if (!file) {
          return;
        }

        const players = side === "blue" ? state.bluePlayers : state.redPlayers;
        const index = safeInt(event.target.dataset.index, -1);

        if (!players[index]) {
          return;
        }

        try {
          players[index].photo = await imageToDataUrl(file, 540, 960, 0.72);
          players[index].photoScale = 1;
          players[index].photoOffsetY = 0;
          saveState();
          renderAll();
        } catch (error) {
          setStatus(error.message || "Image failed", "error");
        } finally {
          event.target.value = "";
        }
      });

      playerContainer.addEventListener("click", (event) => {
        const button = event.target.closest(".photo-frame-button");

        if (!button) {
          return;
        }

        const players = side === "blue" ? state.bluePlayers : state.redPlayers;
        const index = safeInt(button.dataset.index, -1);

        if (!players[index]) {
          return;
        }

        if (button.dataset.action === "reset-frame") {
          players[index].photoScale = 1;
          players[index].photoOffsetY = 0;
          saveState();
          renderPlayers(side, players);
          return;
        }

        if (button.dataset.action === "clear-photo") {
          players[index].photo = "";
          players[index].photoScale = 1;
          players[index].photoOffsetY = 0;
          saveState();
          renderPlayers(side, players);
        }
      });

      itemContainer.addEventListener("click", (event) => {
        const button = event.target.closest(".item-picker-button");

        if (!button) {
          return;
        }

        const playerIndex = safeInt(button.dataset.player, -1);
        const itemIndex = safeInt(button.dataset.slot, -1);

        if (
          playerIndex < 0
          || playerIndex >= PLAYER_COUNT
          || itemIndex < 0
          || itemIndex >= ITEM_SLOT_COUNT
        ) {
          return;
        }

        openVisualPicker({
          type: "item",
          side,
          playerIndex,
          itemIndex
        });
      });
    }

    for (const key of ["blueBans", "redBans", "bluePicks", "redPicks"]) {
      const container = elements[key];

      container.addEventListener("click", (event) => {
        const pickerButton = event.target.closest(".hero-picker-button");

        if (pickerButton) {
          const index = safeInt(pickerButton.dataset.index, -1);

          if (index >= 0 && index < HERO_SLOT_COUNT) {
            openVisualPicker({
              type: "hero",
              stateKey: key,
              index
            });
          }

          return;
        }

        const lockButton = event.target.closest(".pick-lock-button");

        if (lockButton && isPickStateKey(key)) {
          const index = safeInt(lockButton.dataset.index, -1);

          if (index >= 0 && index < HERO_SLOT_COUNT) {
            togglePickLock(key, index);
          }

          return;
        }

        const clearButton = event.target.closest(".clear-slot");

        if (!clearButton) {
          return;
        }

        const index = safeInt(clearButton.dataset.index, -1);

        if (index < 0 || index >= HERO_SLOT_COUNT) {
          return;
        }

        state[key][index] = "";

        if (isPickStateKey(key)) {
          const side = getPickSide(key);
          getPickLocks(side)[index] = false;

          if (isActivePick(side, index)) {
            state.activePick = null;
          }
        }

        saveState();
        renderHeroEditors(key, state[key]);
      });
    }

    elements.gameTimerStart.addEventListener("click", () => {
      state.gameTimerRunning = true;
      saveState();
      renderAll();
    });

    elements.gameTimerPause.addEventListener("click", () => {
      state.gameTimerRunning = false;
      saveState();
      renderAll();
    });

    elements.gameTimerReset.addEventListener("click", () => {
      state.gameTimer = 0;
      state.gameTimerRunning = false;
      saveState();
      renderAll();
    });

    elements.blueKillsMinus.addEventListener("click", () => updateCounter("blueKills", -1));
    elements.blueKillsPlus.addEventListener("click", () => updateCounter("blueKills", 1));
    elements.redKillsMinus.addEventListener("click", () => updateCounter("redKills", -1));
    elements.redKillsPlus.addEventListener("click", () => updateCounter("redKills", 1));

    elements.goldDiffInput.addEventListener("change", (event) => {
      updateGoldDiff(event.target.value);
    });

    document.querySelectorAll(".gold-adjust-button").forEach((button) => {
      button.addEventListener("click", () => {
        updateGoldDiff(state.goldDiff + safeInt(button.dataset.goldDelta));
      });
    });

    elements.goldReset.addEventListener("click", () => updateGoldDiff(0));

    elements.blueTyrantMinus.addEventListener("click", () => updateCounter("blueTyrant", -1));
    elements.blueTyrantPlus.addEventListener("click", () => updateCounter("blueTyrant", 1));
    elements.redTyrantMinus.addEventListener("click", () => updateCounter("redTyrant", -1));
    elements.redTyrantPlus.addEventListener("click", () => updateCounter("redTyrant", 1));
    elements.blueOverlordMinus.addEventListener("click", () => updateCounter("blueOverlord", -1));
    elements.blueOverlordPlus.addEventListener("click", () => updateCounter("blueOverlord", 1));
    elements.redOverlordMinus.addEventListener("click", () => updateCounter("redOverlord", -1));
    elements.redOverlordPlus.addEventListener("click", () => updateCounter("redOverlord", 1));

    elements.pickerSearch.addEventListener("input", renderPickerGrid);

    elements.pickerFilters.addEventListener("click", (event) => {
      const button = event.target.closest(".picker-filter-button");

      if (!button) {
        return;
      }

      pickerFilter = button.dataset.filter || "all";
      renderPickerFilters();
      renderPickerGrid();
    });

    elements.pickerGrid.addEventListener("click", (event) => {
      const card = event.target.closest(".picker-card");

      if (!card) {
        return;
      }

      applyPickerSelection(card.dataset.pickerValue || "");
    });

    elements.pickerClose.addEventListener("click", closeVisualPicker);
    elements.visualPicker.addEventListener("click", (event) => {
      if (event.target.matches("[data-picker-close]")) {
        closeVisualPicker();
      }
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && pickerContext) {
        closeVisualPicker();
        return;
      }

      handleHotkey(event);
    });

    window.addEventListener("storage", (event) => {
      if (event.key !== STORAGE_KEY || !event.newValue) {
        return;
      }

      try {
        state = normalizeState(JSON.parse(event.newValue));
        renderAll();
        setStatus("Synced", "ok", true);
      } catch (error) {
        console.error("Failed to synchronize overlay state.", error);
        setStatus("Sync failed", "error");
      }
    });

    window.addEventListener("beforeunload", () => {
      if (draftTimerIntervalId !== null) {
        window.clearInterval(draftTimerIntervalId);
      }

      if (gameTimerIntervalId !== null) {
        window.clearInterval(gameTimerIntervalId);
      }
    });
  }

  function initialize() {
    if (!window.HOK_HEROES?.length || !window.HOK_HERO_MAP) {
      throw new Error("Hero data missing.");
    }

    if (!window.HOK_ITEMS?.length || !window.HOK_ITEM_MAP) {
      throw new Error("Item data missing.");
    }

    buildPlayerEditors("blue", elements.bluePlayers);
    buildPlayerEditors("red", elements.redPlayers);
    buildHeroEditors("blueBans", elements.blueBans);
    buildHeroEditors("redBans", elements.redBans);
    buildHeroEditors("bluePicks", elements.bluePicks);
    buildHeroEditors("redPicks", elements.redPicks);
    buildItemEditors("blue", elements.blueItems);
    buildItemEditors("red", elements.redItems);

    bindEvents();
    renderAll();
    saveState();
  }

  initialize();
})();
