(() => {
  "use strict";

  const STORAGE_KEY = "hok_draft_state_v1";
  const MAX_GAME_TIMER = 99 * 60 + 59;
  const MAX_COUNTER = 999;
  const MAX_GOLD = 99999999;

  const $ = (id) => document.getElementById(id);

  const elements = {
    overlay: $("ingameOverlay"),
    blueTeamLogo: $("blueTeamLogo"),
    redTeamLogo: $("redTeamLogo"),
    blueTeamName: $("blueTeamName"),
    redTeamName: $("redTeamName"),
    blueSeriesScore: $("blueSeriesScore"),
    redSeriesScore: $("redSeriesScore"),
    seriesLabel: $("seriesLabel"),
    gameTimer: $("gameTimer"),
    blueKills: $("blueKills"),
    redKills: $("redKills"),
    blueGold: $("blueGold"),
    redGold: $("redGold"),
    goldAdvantage: $("goldAdvantage"),
    blueTyrant: $("blueTyrant"),
    redTyrant: $("redTyrant"),
    blueOverlord: $("blueOverlord"),
    redOverlord: $("redOverlord")
  };

  const defaultState = () => ({
    blueTeam: { name: "", logo: "", score: 0 },
    redTeam: { name: "", logo: "", score: 0 },
    series: "BO3",
    mode: "draft",
    gameTimer: 0,
    gameTimerRunning: false,
    blueKills: 0,
    redKills: 0,
    blueGold: 0,
    redGold: 0,
    goldDiff: 0,
    blueTyrant: 0,
    redTyrant: 0,
    blueOverlord: 0,
    redOverlord: 0
  });

  function safeInt(value, fallback = 0) {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function cssUrl(value) {
    return String(value).replaceAll("\\", "\\\\").replaceAll('"', '\\"');
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

  function normalizeGoldPair(source) {
    const legacyDiff = clamp(safeInt(source.goldDiff), -MAX_GOLD, MAX_GOLD);
    const hasBlue = Number.isFinite(Number.parseInt(source.blueGold, 10));
    const hasRed = Number.isFinite(Number.parseInt(source.redGold, 10));

    if (hasBlue || hasRed) {
      const blueGold = clamp(safeInt(source.blueGold), 0, MAX_GOLD);
      const redGold = clamp(safeInt(source.redGold), 0, MAX_GOLD);
      return { blueGold, redGold, goldDiff: blueGold - redGold };
    }

    // Backward compatibility untuk state lama yang hanya menyimpan goldDiff.
    return {
      blueGold: legacyDiff > 0 ? legacyDiff : 0,
      redGold: legacyDiff < 0 ? Math.abs(legacyDiff) : 0,
      goldDiff: legacyDiff
    };
  }

  function normalizeState(candidate) {
    const source = candidate && typeof candidate === "object" ? candidate : {};
    const series = source.series === "BO1" || source.series === "BO5"
      ? source.series
      : "BO3";
    const gold = normalizeGoldPair(source);

    return {
      blueTeam: normalizeTeam(source.blueTeam, series),
      redTeam: normalizeTeam(source.redTeam, series),
      series,
      mode: source.mode === "ingame" ? "ingame" : "draft",
      gameTimer: clamp(safeInt(source.gameTimer), 0, MAX_GAME_TIMER),
      gameTimerRunning: Boolean(source.gameTimerRunning),
      blueKills: clamp(safeInt(source.blueKills), 0, MAX_COUNTER),
      redKills: clamp(safeInt(source.redKills), 0, MAX_COUNTER),
      blueGold: gold.blueGold,
      redGold: gold.redGold,
      goldDiff: gold.goldDiff,
      blueTyrant: clamp(safeInt(source.blueTyrant), 0, MAX_COUNTER),
      redTyrant: clamp(safeInt(source.redTyrant), 0, MAX_COUNTER),
      blueOverlord: clamp(safeInt(source.blueOverlord), 0, MAX_COUNTER),
      redOverlord: clamp(safeInt(source.redOverlord), 0, MAX_COUNTER)
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? normalizeState(JSON.parse(raw)) : defaultState();
    } catch (error) {
      console.error("Gagal membaca state In-Game.", error);
      return defaultState();
    }
  }

  function formatClock(totalSeconds) {
    const safeSeconds = clamp(safeInt(totalSeconds), 0, MAX_GAME_TIMER);
    const minutes = Math.floor(safeSeconds / 60);
    const seconds = safeSeconds % 60;

    return `${String(minutes).padStart(2, "0")}:${String(seconds).padStart(2, "0")}`;
  }

  function formatGold(value) {
    const amount = Math.abs(safeInt(value));

    if (amount >= 1000000) {
      const formatted = (amount / 1000000).toFixed(amount % 1000000 === 0 ? 0 : 1);
      return `${formatted}M`;
    }

    if (amount >= 1000) {
      const formatted = (amount / 1000).toFixed(amount % 1000 === 0 ? 0 : 1);
      return `${formatted}K`;
    }

    return String(amount);
  }

  function renderLogo(node, source, fallback) {
    node.style.backgroundImage = source ? `url("${cssUrl(source)}")` : "";
    node.textContent = source ? "" : fallback;
  }

  function renderGoldLead(value) {
    elements.goldAdvantage.classList.remove("is-blue", "is-red", "is-even");

    if (value > 0) {
      elements.goldAdvantage.textContent = `BLUE +${formatGold(value)}`;
      elements.goldAdvantage.classList.add("is-blue");
    } else if (value < 0) {
      elements.goldAdvantage.textContent = `RED +${formatGold(value)}`;
      elements.goldAdvantage.classList.add("is-red");
    } else {
      elements.goldAdvantage.textContent = "GOLD EVEN";
      elements.goldAdvantage.classList.add("is-even");
    }
  }

  function render(rawState) {
    const state = normalizeState(rawState);
    const isIngame = state.mode === "ingame";

    elements.overlay.classList.toggle("is-hidden", !isIngame);

    elements.blueTeamName.textContent = state.blueTeam.name || "BLUE TEAM";
    elements.redTeamName.textContent = state.redTeam.name || "RED TEAM";
    elements.blueSeriesScore.textContent = String(state.blueTeam.score);
    elements.redSeriesScore.textContent = String(state.redTeam.score);
    elements.seriesLabel.textContent = state.series;

    renderLogo(elements.blueTeamLogo, state.blueTeam.logo, "BL");
    renderLogo(elements.redTeamLogo, state.redTeam.logo, "RD");

    elements.gameTimer.textContent = formatClock(state.gameTimer);
    elements.gameTimer.dateTime = `PT${state.gameTimer}S`;
    elements.blueKills.textContent = String(state.blueKills);
    elements.redKills.textContent = String(state.redKills);
    elements.blueGold.textContent = formatGold(state.blueGold);
    elements.redGold.textContent = formatGold(state.redGold);

    renderGoldLead(state.blueGold - state.redGold);

    elements.blueTyrant.textContent = String(state.blueTyrant);
    elements.redTyrant.textContent = String(state.redTyrant);
    elements.blueOverlord.textContent = String(state.blueOverlord);
    elements.redOverlord.textContent = String(state.redOverlord);
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
      render(JSON.parse(event.newValue));
    } catch (error) {
      console.error("Gagal sinkronisasi In-Game overlay.", error);
    }
  }

  function initialize() {
    fitOverlay();
    render(loadState());

    window.addEventListener("resize", fitOverlay);
    window.addEventListener("storage", handleStorage);
  }

  initialize();
})();
