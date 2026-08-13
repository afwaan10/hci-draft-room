(() => {
  "use strict";

  const STORAGE_KEY = "hok_draft_state_v1";
  const PLAYER_COUNT = 5;
  const HERO_SLOT_COUNT = 5;
  const ITEM_SLOT_COUNT = 6;

  const $ = (id) => document.getElementById(id);

  const elements = {
    overlay: $("draftOverlay"),
    blueTeamName: $("blueTeamName"),
    redTeamName: $("redTeamName"),
    blueTeamLogo: $("blueTeamLogo"),
    redTeamLogo: $("redTeamLogo"),
    blueTeamScore: $("blueTeamScore"),
    redTeamScore: $("redTeamScore"),
    seriesLabel: $("seriesLabel"),
    seriesDots: $("seriesDots"),
    timer: $("timerDisplay"),
    blueBans: $("blueBans"),
    redBans: $("redBans"),
    bluePicks: $("bluePicks"),
    redPicks: $("redPicks"),
    activePickSide: $("activePickSide"),
    activePickText: $("activePickText"),
    connection: $("connectionLabel")
  };

  let previousLocks = {
    blue: Array(HERO_SLOT_COUNT).fill(false),
    red: Array(HERO_SLOT_COUNT).fill(false)
  };

  function emptyPlayers() {
    return Array.from(
      { length: PLAYER_COUNT },
      () => ({ name: "", photo: "", photoScale: 1, photoOffsetY: 0 })
    );
  }

  function emptyItems() {
    return Array.from(
      { length: PLAYER_COUNT },
      () => Array(ITEM_SLOT_COUNT).fill("")
    );
  }

  function emptyHeroes() {
    return Array(HERO_SLOT_COUNT).fill("");
  }

  function emptyLocks() {
    return Array(HERO_SLOT_COUNT).fill(false);
  }

  function defaults() {
    return {
      blueTeam: { name: "", logo: "", score: 0 },
      redTeam: { name: "", logo: "", score: 0 },
      bluePlayers: emptyPlayers(),
      redPlayers: emptyPlayers(),
      blueBans: emptyHeroes(),
      redBans: emptyHeroes(),
      bluePicks: emptyHeroes(),
      redPicks: emptyHeroes(),
      bluePickLocked: emptyLocks(),
      redPickLocked: emptyLocks(),
      activePick: null,
      timer: 30,
      timerRunning: false,
      series: "BO3",
      bluePlayerItems: emptyItems(),
      redPlayerItems: emptyItems(),
      mode: "draft"
    };
  }

  function safeInt(value, fallback = 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
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

  function normalizeState(candidate) {
    const source = candidate && typeof candidate === "object" ? candidate : {};
    const series = normalizeSeries(source.series);
    const maxScore = maxSeriesScore(series);

    const normalizePlayers = (rows) =>
      Array.from({ length: PLAYER_COUNT }, (_, index) => ({
        name: typeof rows?.[index]?.name === "string" ? rows[index].name : "",
        photo: typeof rows?.[index]?.photo === "string" ? rows[index].photo : "",
        photoScale: clamp(
          Number.isFinite(Number.parseFloat(rows?.[index]?.photoScale))
            ? Number.parseFloat(rows[index].photoScale)
            : 1,
          0.85,
          1.30
        ),
        photoOffsetY: clamp(safeInt(rows?.[index]?.photoOffsetY, 0), -20, 20)
      }));

    const normalizeHeroes = (rows) =>
      Array.from(
        { length: HERO_SLOT_COUNT },
        (_, index) => (window.HOK_HERO_MAP[rows?.[index]] ? rows[index] : "")
      );

    const bluePicks = normalizeHeroes(source.bluePicks);
    const redPicks = normalizeHeroes(source.redPicks);

    const normalizeLocks = (rows, picks) =>
      Array.from(
        { length: HERO_SLOT_COUNT },
        (_, index) => Boolean(rows?.[index] && picks[index])
      );

    const bluePickLocked = normalizeLocks(source.bluePickLocked, bluePicks);
    const redPickLocked = normalizeLocks(source.redPickLocked, redPicks);

    let activePick = null;

    if (source.activePick && typeof source.activePick === "object") {
      const side = source.activePick.side === "red"
        ? "red"
        : source.activePick.side === "blue"
          ? "blue"
          : "";

      const index = safeInt(source.activePick.index, -1);
      const picks = side === "blue" ? bluePicks : redPicks;
      const locks = side === "blue" ? bluePickLocked : redPickLocked;

      if (
        side
        && index >= 0
        && index < HERO_SLOT_COUNT
        && picks[index]
        && !locks[index]
      ) {
        activePick = { side, index };
      }
    }

    const normalizeItems = (rows) =>
      Array.from({ length: PLAYER_COUNT }, (_, playerIndex) =>
        Array.from(
          { length: ITEM_SLOT_COUNT },
          (_, itemIndex) => (
            window.HOK_ITEM_MAP[rows?.[playerIndex]?.[itemIndex]]
              ? rows[playerIndex][itemIndex]
              : ""
          )
        )
      );

    return {
      blueTeam: {
        name: source.blueTeam?.name || "",
        logo: source.blueTeam?.logo || "",
        score: clamp(safeInt(source.blueTeam?.score), 0, maxScore)
      },
      redTeam: {
        name: source.redTeam?.name || "",
        logo: source.redTeam?.logo || "",
        score: clamp(safeInt(source.redTeam?.score), 0, maxScore)
      },
      bluePlayers: normalizePlayers(source.bluePlayers),
      redPlayers: normalizePlayers(source.redPlayers),
      blueBans: normalizeHeroes(source.blueBans),
      redBans: normalizeHeroes(source.redBans),
      bluePicks,
      redPicks,
      bluePickLocked,
      redPickLocked,
      activePick,
      timer: clamp(safeInt(source.timer, 30), 0, 999),
      timerRunning: Boolean(source.timerRunning),
      series,
      bluePlayerItems: normalizeItems(source.bluePlayerItems),
      redPlayerItems: normalizeItems(source.redPlayerItems),
      mode: source.mode === "ingame" ? "ingame" : "draft"
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeState(JSON.parse(raw)) : defaults();
    } catch (error) {
      console.error("Failed to load draft state.", error);
      return defaults();
    }
  }

  function cssUrl(value) {
    return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
  }

  function renderLogo(node, source, fallback) {
    node.style.backgroundImage = source ? `url("${cssUrl(source)}")` : "";
    node.textContent = source ? "" : fallback;
  }

  function formatTimer(value) {
    const seconds = clamp(safeInt(value), 0, 999);
    const minutes = Math.floor(seconds / 60);
    const remainder = seconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  }

  function seriesGameCount(series) {
    if (series === "BO1") {
      return 1;
    }

    return series === "BO5" ? 5 : 3;
  }

  function renderSeriesDots(state) {
    elements.seriesDots.replaceChildren();

    const count = seriesGameCount(state.series);
    let blueRemaining = state.blueTeam.score;
    let redRemaining = state.redTeam.score;

    for (let index = 0; index < count; index += 1) {
      const dot = document.createElement("span");
      dot.className = "series-dot";

      if (blueRemaining > 0) {
        dot.classList.add("blue-win");
        blueRemaining -= 1;
      } else if (redRemaining > 0) {
        dot.classList.add("red-win");
        redRemaining -= 1;
      }

      elements.seriesDots.append(dot);
    }
  }

  function renderBans(container, heroIds) {
    container.replaceChildren();

    heroIds.forEach((heroId) => {
      const hero = window.HOK_HERO_MAP[heroId];
      const card = document.createElement("span");
      card.className = `ban-card${hero ? "" : " is-empty"}`;

      const image = document.createElement("span");
      image.className = "ban-card-image";

      if (hero) {
        image.style.backgroundImage = `url("${cssUrl(hero.assets.icon)}")`;
        card.title = hero.name;
      }

      card.append(image);
      container.append(card);
    });
  }

  function playerFallbackText(player, index) {
    const name = player.name.trim();

    if (name) {
      return name
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0] || "")
        .join("")
        .toUpperCase();
    }

    return `P${index + 1}`;
  }

  function createPickCard({
    side,
    index,
    player,
    hero,
    locked,
    animateLock
  }) {
    const card = document.createElement("article");
    const hasHero = Boolean(hero && locked);

    card.className = [
      "pick-card",
      `is-${side}`,
      hasHero ? "has-hero" : "",
      locked ? "is-locked" : "",
      animateLock ? "is-locking" : ""
    ].filter(Boolean).join(" ");

    // Foto player tetap menjadi layer dasar.
    // Hero baru menimpa foto player setelah LOCK.
    const playerVisual = document.createElement("div");
    playerVisual.className = "player-visual";

    if (player.photo) {
      const playerPhoto = document.createElement("img");
      playerPhoto.className = "player-photo";
      playerPhoto.src = player.photo;
      playerPhoto.alt = "";
      playerPhoto.style.transform =
        `translateY(${player.photoOffsetY}%) scale(${player.photoScale})`;
      playerVisual.append(playerPhoto);
    } else {
      const fallback = document.createElement("span");
      fallback.className = "player-fallback";
      fallback.textContent = playerFallbackText(player, index);
      playerVisual.append(fallback);
    }

    const heroVisual = document.createElement("div");
    heroVisual.className = "hero-visual";

    if (hasHero) {
      heroVisual.style.backgroundImage = `url("${cssUrl(hero.assets.portrait)}")`;
    }

    const shade = document.createElement("div");
    shade.className = "card-shade";

    const top = document.createElement("div");
    top.className = "pick-card-top";

    const pickIndex = document.createElement("span");
    pickIndex.className = "pick-index";
    pickIndex.textContent = `P${index + 1}`;

    const status = document.createElement("span");
    status.className = "pick-status";
    status.textContent = locked ? "LOCKED" : "";

    top.append(pickIndex, status);

    const bottom = document.createElement("div");
    bottom.className = "pick-card-bottom";

    const heroName = document.createElement("div");
    heroName.className = "hero-name";
    heroName.textContent = hasHero ? hero.name : "WAITING";

    const playerName = document.createElement("div");
    playerName.className = "player-name";
    playerName.textContent = player.name || `PLAYER ${index + 1}`;

    bottom.append(heroName, playerName);
    card.append(playerVisual, heroVisual, shade, top, bottom);

    return card;
  }

  function renderPicks(container, state, side, animate) {
    container.replaceChildren();

    const picks = side === "blue" ? state.bluePicks : state.redPicks;
    const locks = side === "blue" ? state.bluePickLocked : state.redPickLocked;
    const players = side === "blue" ? state.bluePlayers : state.redPlayers;

    picks.forEach((heroId, index) => {
      const locked = Boolean(locks[index]);
      const hero = locked ? window.HOK_HERO_MAP[heroId] : null;
      const justLocked = Boolean(
        animate
        && locked
        && !previousLocks[side][index]
        && hero
      );

      container.append(
        createPickCard({
          side,
          index,
          player: players[index],
          hero,
          locked,
          animateLock: justLocked
        })
      );
    });
  }

  function renderActivePick(state) {
    if (!state.activePick) {
      elements.activePickSide.textContent = "READY";
      elements.activePickText.textContent = "WAITING LOCK";
      return;
    }

    const side = state.activePick.side;
    const index = state.activePick.index;
    const player = side === "blue" ? state.bluePlayers[index] : state.redPlayers[index];

    // Nama hero sengaja tidak ditampilkan sebelum LOCK.
    elements.activePickSide.textContent = `${side.toUpperCase()} SIDE`;
    elements.activePickText.textContent =
      `${player.name || `PLAYER ${index + 1}`} · WAITING LOCK`;
  }

  function render(rawState, animate = true) {
    const state = normalizeState(rawState);

    elements.overlay.hidden = state.mode !== "draft";

    elements.blueTeamName.textContent = state.blueTeam.name || "BLUE TEAM";
    elements.redTeamName.textContent = state.redTeam.name || "RED TEAM";
    elements.blueTeamScore.textContent = String(state.blueTeam.score);
    elements.redTeamScore.textContent = String(state.redTeam.score);
    elements.seriesLabel.textContent = state.series;
    elements.timer.textContent = formatTimer(state.timer);
    elements.timer.classList.toggle("is-urgent", state.timer > 0 && state.timer <= 5);

    renderLogo(elements.blueTeamLogo, state.blueTeam.logo, "BL");
    renderLogo(elements.redTeamLogo, state.redTeam.logo, "RD");
    renderSeriesDots(state);
    renderBans(elements.blueBans, state.blueBans);
    renderBans(elements.redBans, state.redBans);
    renderPicks(elements.bluePicks, state, "blue", animate);
    renderPicks(elements.redPicks, state, "red", animate);
    renderActivePick(state);

    elements.connection.textContent = state.timerRunning
      ? "DRAFT TIMER RUNNING"
      : "LOCAL STATE READY";

    previousLocks = {
      blue: state.bluePickLocked.slice(),
      red: state.redPickLocked.slice()
    };
  }

  function fitOverlay() {
    const scale = Math.min(
      window.innerWidth / 1920,
      window.innerHeight / 1080
    );

    elements.overlay.style.transform = `scale(${scale})`;
    elements.overlay.style.left = `${Math.max(0, (window.innerWidth - 1920 * scale) / 2)}px`;
    elements.overlay.style.top = `${Math.max(0, (window.innerHeight - 1080 * scale) / 2)}px`;
  }

  function handleStorage(event) {
    if (event.key !== STORAGE_KEY || !event.newValue) {
      return;
    }

    try {
      render(JSON.parse(event.newValue), true);
    } catch (error) {
      console.error("Failed to render synchronized draft state.", error);
    }
  }

  function initialize() {
    if (!window.HOK_HEROES?.length || !window.HOK_HERO_MAP) {
      throw new Error("Hero data missing.");
    }

    if (!window.HOK_ITEMS?.length || !window.HOK_ITEM_MAP) {
      throw new Error("Item data missing.");
    }

    fitOverlay();
    render(loadState(), false);

    window.addEventListener("resize", fitOverlay);
    window.addEventListener("storage", handleStorage);
  }

  initialize();
})();
