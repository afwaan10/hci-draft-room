(() => {
  "use strict";
  const B="hok_draft_state_v1", T="hok_broadcast_tools_v1", $=id=>document.getElementById(id);
  const params=new URLSearchParams(location.search), preview=params.get("preview")==="1";
  function load(k){try{return JSON.parse(localStorage.getItem(k)||"{}")}catch{return {}}}
  function initials(n,f){const s=String(n||"").trim();return s?s.split(/\s+/).slice(0,2).map(v=>v[0]).join("").toUpperCase():f}
  function logo(el,team,f){if(team?.logo){el.style.backgroundImage=`url(${JSON.stringify(team.logo)})`;el.textContent=""}else{el.style.backgroundImage="";el.textContent=initials(team?.name,f)}}
  function card(side,i,b){const p=(side==="blue"?b.bluePlayers:b.redPlayers)?.[i]||{};const picks=side==="blue"?b.bluePicks:b.redPicks;const locks=side==="blue"?b.bluePickLocked:b.redPickLocked;const hero=locks?.[i]?window.HOK_HERO_MAP[picks?.[i]]:null;const a=document.createElement("article");a.className="postdraft-card";if(hero){const img=document.createElement("img");img.src=hero.assets.portrait;img.alt="";a.append(img)}const c=document.createElement("div");c.className="postdraft-card-copy";c.innerHTML=`<span>P${i+1}</span><strong>${escape(p.name||`PLAYER ${i+1}`)}</strong><b>${escape(hero?.name||"BELUM LOCK")}</b>`;a.append(c);return a}
  function escape(v){return String(v).replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[ch]))}
  function render(){const b=load(B),t=load(T);$("postdraftOverlay").classList.toggle("is-hidden",!preview&&!t.postdraftVisible);$("postBlueName").textContent=b.blueTeam?.name||"BLUE TEAM";$("postRedName").textContent=b.redTeam?.name||"RED TEAM";$("postSeries").textContent=b.series||"BO3";logo($("postBlueLogo"),b.blueTeam,"BL");logo($("postRedLogo"),b.redTeam,"RD");$("postBluePicks").replaceChildren(...Array.from({length:5},(_,i)=>card("blue",i,b)));$("postRedPicks").replaceChildren(...Array.from({length:5},(_,i)=>card("red",i,b)))}
  render();window.addEventListener("storage",e=>{if(e.key===B||e.key===T)render()});
})();
