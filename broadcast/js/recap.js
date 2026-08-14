(() => {
  "use strict";
  const KEY="hok_broadcast_tools_v1",$=id=>document.getElementById(id),preview=new URLSearchParams(location.search).get("preview")==="1";
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return {}}}
  function initials(n,f){const s=String(n||"").trim();return s?s.split(/\s+/).slice(0,2).map(v=>v[0]).join("").toUpperCase():f}
  function logo(el,team,f){if(team?.logo){el.style.backgroundImage=`url(${JSON.stringify(team.logo)})`;el.textContent=""}else{el.style.backgroundImage="";el.textContent=initials(team?.name,f)}}
  function esc(v){return String(v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]))}
  function pick(recap,side,i){const ids=side==="blue"?recap.bluePicks:recap.redPicks,players=side==="blue"?recap.bluePlayers:recap.redPlayers,hero=window.HOK_HERO_MAP[ids?.[i]],a=document.createElement("article");a.className="recap-pick";if(hero){const img=document.createElement("img");img.src=hero.assets.portrait;img.alt="";a.append(img)}const c=document.createElement("div");c.className="recap-pick-copy";c.innerHTML=`<strong>${esc(hero?.name||"HERO")}</strong><span>${esc(players?.[i]?.name||`PLAYER ${i+1}`)}</span>`;a.append(c);return a}
  function render(){const t=load(),recaps=Array.isArray(t.recaps)?t.recaps:[],r=recaps.find(x=>x.id===t.selectedRecapId)||recaps.at(-1);$("recapOverlay").classList.toggle("is-hidden",!preview&&!t.recapVisible);if(!r)return;$("recapLabel").textContent=r.label||"GAME";$("recapBlueName").textContent=r.blueTeam?.name||"BLUE TEAM";$("recapRedName").textContent=r.redTeam?.name||"RED TEAM";logo($("recapBlueLogo"),r.blueTeam,"BL");logo($("recapRedLogo"),r.redTeam,"RD");$("recapBluePicks").replaceChildren(...Array.from({length:5},(_,i)=>pick(r,"blue",i)));$("recapRedPicks").replaceChildren(...Array.from({length:5},(_,i)=>pick(r,"red",i)))}
  render();window.addEventListener("storage",e=>{if(e.key===KEY)render()});
})();
