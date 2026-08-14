(() => {
  "use strict";
  const KEY="hok_broadcast_tools_v1", $=id=>document.getElementById(id), preview=new URLSearchParams(location.search).get("preview")==="1";
  let timer=null;
  function load(){try{return JSON.parse(localStorage.getItem(KEY)||"{}")}catch{return {}}}
  function render(){const e=load().event||{};const active=Boolean(e.visible)&&Number(e.expiresAt||0)>Date.now();$("eventOverlay").classList.toggle("is-hidden",!preview&&!active);$("eventStage").classList.toggle("is-blue",e.side!=="red");$("eventStage").classList.toggle("is-red",e.side==="red");$("eventKicker").textContent=e.type==="kill"?(e.player||"KILL EVENT"):"OBJECTIVE SECURED";$("eventTitle").textContent=e.title||"LIVE EVENT";$("eventSubtitle").textContent=e.subtitle||"HCI BROADCAST";clearTimeout(timer);if(active)timer=setTimeout(render,Math.max(80,Number(e.expiresAt)-Date.now()+30))}
  render();window.addEventListener("storage",e=>{if(e.key===KEY)render()});
})();
