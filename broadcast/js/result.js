(() => {
  "use strict";

  const RESULT_KEY = "hok_result_state_v1";
  const PLAYER_COUNT = 5;
  const ITEM_COUNT = 6;
  const ROLES = ["Clash Lane", "Jungle", "Mid Lane", "Farm Lane", "Roam"];

  const $ = (id) => document.getElementById(id);
  const elements = {
    overlay: $("resultOverlay"),
    stage: $("resultStage"),
    title: $("resultTitle"),
    gameLabel: $("resultGameLabel"),
    blueName: $("resultBlueTeamName"),
    redName: $("resultRedTeamName"),
    blueLogo: $("resultBlueLogo"),
    redLogo: $("resultRedLogo"),
    blueKills: $("resultBlueKills"),
    redKills: $("resultRedKills"),
    bluePlayers: $("resultBluePlayers"),
    redPlayers: $("resultRedPlayers")
  };

  const safeInt = (value, fallback = 0) => {
    const parsed = Number.parseInt(value, 10);
    return Number.isFinite(parsed) ? parsed : fallback;
  };

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function emptyPlayer(index) {
    return {
      role: ROLES[index],
      ign: `PLAYER ${index + 1}`,
      photo: "",
      photoScale: 1,
      photoOffsetY: 0,
      heroId: "",
      kda: "0/0/0",
      gold: "0",
      items: Array(ITEM_COUNT).fill(""),
      confidence: {
        ign: 0,
        hero: 0,
        kda: 0,
        gold: 0,
        items: Array(ITEM_COUNT).fill(0)
      }
    };
  }

  function normalizePlayers(players) {
    const source = Array.isArray(players) ? players : [];
    return Array.from({ length: PLAYER_COUNT }, (_, index) => {
      const row = source[index] || {};
      return {
        role: ROLES[index],
        ign: typeof row.ign === "string" && row.ign.trim() ? row.ign.trim().slice(0, 24) : `PLAYER ${index + 1}`,
        photo: typeof row.photo === "string" ? row.photo : "",
        photoScale: clamp(Number.parseFloat(row.photoScale) || 1, 0.85, 1.30),
        photoOffsetY: clamp(safeInt(row.photoOffsetY), -20, 20),
        heroId: window.HOK_HERO_MAP[row.heroId] ? row.heroId : "",
        kda: typeof row.kda === "string" ? row.kda.slice(0, 18) : "0/0/0",
        gold: typeof row.gold === "string" ? row.gold.slice(0, 18) : String(row.gold || "0"),
        items: Array.from({ length: ITEM_COUNT }, (_, itemIndex) => {
          const id = Array.isArray(row.items) ? row.items[itemIndex] : "";
          return window.HOK_ITEM_MAP[id] ? id : "";
        }),
        confidence: row.confidence && typeof row.confidence === "object" ? row.confidence : emptyPlayer(index).confidence
      };
    });
  }

  function normalizeState(candidate) {
    const source = candidate && typeof candidate === "object" ? candidate : {};
    const layout = source.layout && typeof source.layout === "object" ? source.layout : {};
    return {
      visible: Boolean(source.visible),
      title: typeof source.title === "string" ? source.title.slice(0, 32) : "GAME RESULT",
      gameLabel: typeof source.gameLabel === "string" ? source.gameLabel.slice(0, 24) : "GAME 1",
      blueTeam: {
        name: typeof source.blueTeam?.name === "string" ? source.blueTeam.name.slice(0, 32) : "BLUE TEAM",
        logo: typeof source.blueTeam?.logo === "string" ? source.blueTeam.logo : ""
      },
      redTeam: {
        name: typeof source.redTeam?.name === "string" ? source.redTeam.name.slice(0, 32) : "RED TEAM",
        logo: typeof source.redTeam?.logo === "string" ? source.redTeam.logo : ""
      },
      blueKills: clamp(safeInt(source.blueKills), 0, 999),
      redKills: clamp(safeInt(source.redKills), 0, 999),
      bluePlayers: normalizePlayers(source.bluePlayers),
      redPlayers: normalizePlayers(source.redPlayers),
      layout: {
        x: clamp(safeInt(layout.x), -500, 500),
        y: clamp(safeInt(layout.y), -420, 420),
        scale: clamp(Number.parseFloat(layout.scale) || 1, 0.7, 1.3),
        width: clamp(safeInt(layout.width, 1780), 1320, 1880),
        panelOpacity: clamp(Number.parseFloat(layout.panelOpacity) || 0.92, 0.3, 1),
        cardOpacity: clamp(Number.parseFloat(layout.cardOpacity) || 0.96, 0.45, 1),
        cardGap: clamp(safeInt(layout.cardGap, 8), 2, 20),
        heroZoom: clamp(Number.parseFloat(layout.heroZoom) || 1, 0.85, 1.25),
        showRoles: layout.showRoles !== false,
        showKda: layout.showKda !== false,
        showGold: layout.showGold !== false,
        showItems: layout.showItems !== false
      }
    };
  }

  function loadState() {
    try {
      const raw = localStorage.getItem(RESULT_KEY);
      return normalizeState(raw ? JSON.parse(raw) : {});
    } catch (error) {
      console.error("Gagal membaca result state.", error);
      return normalizeState({});
    }
  }

  function initials(name, fallback) {
    const clean = String(name || "").trim();
    if (!clean) return fallback;
    return clean.split(/\s+/).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  }

  function renderLogo(element, team, fallback) {
    if (team.logo) {
      element.style.backgroundImage = `url(${JSON.stringify(team.logo)})`;
      element.textContent = "";
    } else {
      element.style.backgroundImage = "";
      element.textContent = initials(team.name, fallback);
    }
  }

  function createPlayerCard(player, side, index) {
    const card = document.createElement("article");
    card.className = "result-player-card";

    const heroFrame = document.createElement("div");
    heroFrame.className = "result-hero-frame";

    const hero = window.HOK_HERO_MAP[player.heroId];
    if (hero) {
      const image = document.createElement("img");
      image.className = "result-hero-image";
      image.src = hero.assets.portrait;
      image.alt = "";
      heroFrame.append(image);
    } else {
      const fallback = document.createElement("span");
      fallback.className = "result-hero-fallback";
      fallback.textContent = `P${index + 1}`;
      heroFrame.append(fallback);
    }

    if (player.photo) {
      const photo = document.createElement("img");
      photo.className = "result-player-photo";
      photo.src = player.photo;
      photo.alt = "";
      photo.style.transform = `translateY(${player.photoOffsetY}%) scale(${player.photoScale})`;
      heroFrame.append(photo);
    }

    const role = document.createElement("span");
    role.className = "result-role-badge";
    role.textContent = player.role;

    const heroName = document.createElement("strong");
    heroName.className = "result-hero-name";
    heroName.textContent = hero?.name || "HERO";

    heroFrame.append(role, heroName);

    const info = document.createElement("div");
    info.className = "result-player-info";

    const ign = document.createElement("strong");
    ign.className = "result-player-ign";
    ign.textContent = player.ign || `PLAYER ${index + 1}`;

    const roleText = document.createElement("span");
    roleText.className = "result-player-role-text";
    roleText.textContent = player.role.toUpperCase();

    const items = document.createElement("div");
    items.className = "result-items";
    player.items.forEach((itemId) => {
      const slot = document.createElement("div");
      slot.className = "result-item";
      const item = window.HOK_ITEM_MAP[itemId];
      if (item) {
        const image = document.createElement("img");
        image.src = item.asset;
        image.alt = "";
        slot.append(image);
      }
      items.append(slot);
    });

    const stats = document.createElement("div");
    stats.className = "result-player-stats";

    const kda = document.createElement("div");
    kda.className = "result-stat result-stat-kda";
    kda.innerHTML = `<span>KDA</span><strong>${escapeHtml(player.kda || "-")}</strong>`;

    const gold = document.createElement("div");
    gold.className = "result-stat result-stat-gold";
    gold.innerHTML = `<span>GOLD</span><strong>${escapeHtml(player.gold || "-")}</strong>`;

    stats.append(kda, gold);
    info.append(ign, roleText, items, stats);
    card.append(heroFrame, info);
    return card;
  }

  function escapeHtml(value) {
    return String(value)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  function applyLayout(layout) {
    const root = document.documentElement;
    root.style.setProperty("--result-width", `${layout.width}px`);
    root.style.setProperty("--result-x", `${layout.x}px`);
    root.style.setProperty("--result-y", `${layout.y}px`);
    root.style.setProperty("--result-scale", String(layout.scale));
    root.style.setProperty("--result-panel-opacity", String(layout.panelOpacity));
    root.style.setProperty("--result-card-opacity", String(layout.cardOpacity));
    root.style.setProperty("--result-card-gap", `${layout.cardGap}px`);
    root.style.setProperty("--result-hero-zoom", String(layout.heroZoom));

    elements.overlay.classList.toggle("hide-roles", !layout.showRoles);
    elements.overlay.classList.toggle("hide-kda", !layout.showKda);
    elements.overlay.classList.toggle("hide-gold", !layout.showGold);
    elements.overlay.classList.toggle("hide-items", !layout.showItems);
  }

  function render(rawState) {
    const state = normalizeState(rawState);
    elements.overlay.classList.toggle("is-hidden", !state.visible);
    elements.title.textContent = state.title || "GAME RESULT";
    elements.gameLabel.textContent = state.gameLabel || "GAME 1";
    elements.blueName.textContent = state.blueTeam.name || "BLUE TEAM";
    elements.redName.textContent = state.redTeam.name || "RED TEAM";
    elements.blueKills.textContent = String(state.blueKills);
    elements.redKills.textContent = String(state.redKills);
    renderLogo(elements.blueLogo, state.blueTeam, "BL");
    renderLogo(elements.redLogo, state.redTeam, "RD");

    elements.bluePlayers.replaceChildren(...state.bluePlayers.map((player, index) => createPlayerCard(player, "blue", index)));
    elements.redPlayers.replaceChildren(...state.redPlayers.map((player, index) => createPlayerCard(player, "red", index)));
    applyLayout(state.layout);
  }

  window.addEventListener("storage", (event) => {
    if (event.key === RESULT_KEY && event.newValue) {
      try {
        render(JSON.parse(event.newValue));
      } catch (error) {
        console.error("Result storage event invalid.", error);
      }
    }
  });

  const params = new URLSearchParams(location.search);
  document.body.classList.toggle("show-safe-area", params.get("safe") === "1");

  render(loadState());
})();
