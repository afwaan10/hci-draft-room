(() => {
  const $ = (id) => document.getElementById(id);
  const board = $('mapBoard');
  const layer = $('markerLayer');
  const markerCount = $('markerCount');
  const mapTitle = $('mapTitle');
  const mapNote = $('mapNote');
  const mapHeading = $('mapPlanHeading');
  const mapGameLabel = $('mapGameLabel');
  const mapBoardShort = $('mapBoardShort');
  const toast = $('toast');
  let activeType = 'attack';
  let activeGame = 'hok';
  let markers = [];

  const typeInfo = {
    attack: { label:'Attack', icon:'⚔', color:'#ff6b6b' },
    defend: { label:'Defend', icon:'◆', color:'#4dabf7' },
    rotate: { label:'Rotate', icon:'↻', color:'#ffe3a2' },
    objective: { label:'Objective', icon:'★', color:'#f5c451' },
    danger: { label:'Danger', icon:'!', color:'#ff4d4f' },
    vision: { label:'Vision', icon:'◉', color:'#51cf66' }
  };
  const gameInfo = {
    hok: { label:'Honor of Kings', short:'HOK', cls:'hok-map', title:'HOK Hero Gorge', lanes:['CLASH','MID','FARM'], objectives:['TYRANT','OVERLORD'] },
    mlbb: { label:'Mobile Legends', short:'MLBB', cls:'mlbb-map', title:'MLBB Land of Dawn', lanes:['EXP','MID','GOLD'], objectives:['TURTLE','LORD'] }
  };

  function showToast(message){
    if(!toast) return;
    toast.textContent = message;
    toast.hidden = false;
    clearTimeout(showToast.timer);
    showToast.timer = setTimeout(() => { toast.hidden = true; }, 2400);
  }
  function escapeHtml(value){
    return String(value ?? '').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;').replaceAll("'",'&#039;');
  }
  function save(){
    try{ localStorage.setItem('hciMapPlanV1', JSON.stringify({ activeGame, activeType, title: mapTitle?.value || '', note: mapNote?.value || '', markers })); }catch(_e){}
  }
  function load(){
    try{
      const raw = localStorage.getItem('hciMapPlanV1');
      if(!raw) return;
      const data = JSON.parse(raw);
      if(gameInfo[data.activeGame]) activeGame = data.activeGame;
      if(typeInfo[data.activeType]) activeType = data.activeType;
      if(Array.isArray(data.markers)) markers = data.markers.filter((m) => typeInfo[m.type] && Number.isFinite(m.x) && Number.isFinite(m.y)).slice(0, 80);
      if(mapTitle && data.title) mapTitle.value = String(data.title).slice(0, 44);
      if(mapNote && data.note) mapNote.value = String(data.note).slice(0, 80);
    }catch(_e){}
  }
  function updateGame(){
    const info = gameInfo[activeGame] || gameInfo.hok;
    if(board){
      board.classList.toggle('hok-map', activeGame === 'hok');
      board.classList.toggle('mlbb-map', activeGame === 'mlbb');
    }
    document.querySelectorAll('.map-game-tab').forEach((btn) => btn.classList.toggle('active', btn.dataset.game === activeGame));
    if(mapGameLabel) mapGameLabel.textContent = info.title || info.label;
    if(mapBoardShort) mapBoardShort.textContent = info.short;
  }
  function updateTools(){
    document.querySelectorAll('.marker-tool').forEach((btn) => btn.classList.toggle('active', btn.dataset.type === activeType));
  }
  function render(){
    if(!layer) return;
    const frag = document.createDocumentFragment();
    markers.forEach((marker, index) => {
      const info = typeInfo[marker.type] || typeInfo.attack;
      const btn = document.createElement('button');
      btn.type = 'button';
      btn.className = `map-marker ${marker.type}`;
      btn.style.left = `${marker.x}%`;
      btn.style.top = `${marker.y}%`;
      btn.style.setProperty('--marker-color', info.color);
      btn.dataset.index = String(index);
      btn.title = `${info.label} ${index + 1} - tap to remove`;
      btn.innerHTML = `<span>${escapeHtml(info.icon)}</span><small>${index + 1}</small>`;
      frag.appendChild(btn);
    });
    layer.replaceChildren(frag);
    if(markerCount) markerCount.textContent = String(markers.length);
    if(mapHeading) mapHeading.textContent = mapTitle?.value?.trim() || 'HCI Map Plan';
    save();
  }
  function addMarker(event){
    if(!board || event.target.closest('.map-marker')) return;
    const rect = board.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * 100;
    const y = ((event.clientY - rect.top) / rect.height) * 100;
    if(x < 0 || x > 100 || y < 0 || y > 100) return;
    markers.push({ type: activeType, x: Math.max(1, Math.min(99, x)), y: Math.max(1, Math.min(99, y)) });
    render();
  }
  function removeMarker(event){
    const btn = event.target.closest('.map-marker');
    if(!btn) return;
    event.stopPropagation();
    const index = Number(btn.dataset.index);
    if(Number.isFinite(index)){
      markers.splice(index, 1);
      render();
    }
  }
  function drawMap(ctx, w, h){
    const info = gameInfo[activeGame] || gameInfo.hok;
    const accent = activeGame === 'hok' ? '#f5c451' : '#ffb347';
    const bg = ctx.createLinearGradient(0, 0, w, h);
    bg.addColorStop(0, activeGame === 'hok' ? '#051724' : '#130b20');
    bg.addColorStop(.52, '#071018');
    bg.addColorStop(1, '#1f1a0d');
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);
    const blueGlow = ctx.createRadialGradient(w*.12, h*.86, 0, w*.12, h*.86, w*.42);
    blueGlow.addColorStop(0, 'rgba(77,171,247,.24)');
    blueGlow.addColorStop(1, 'rgba(77,171,247,0)');
    ctx.fillStyle = blueGlow; ctx.fillRect(0,0,w,h);
    const redGlow = ctx.createRadialGradient(w*.88, h*.14, 0, w*.88, h*.14, w*.42);
    redGlow.addColorStop(0, 'rgba(255,107,107,.23)');
    redGlow.addColorStop(1, 'rgba(255,107,107,0)');
    ctx.fillStyle = redGlow; ctx.fillRect(0,0,w,h);
    ctx.strokeStyle = 'rgba(255,255,255,.06)'; ctx.lineWidth = 4;
    for(let i = -h; i < w; i += 86){ ctx.beginPath(); ctx.moveTo(i,0); ctx.lineTo(i+h,h); ctx.stroke(); }
    function path(points, color, width){ ctx.strokeStyle=color; ctx.lineWidth=width; ctx.lineCap='round'; ctx.beginPath(); ctx.moveTo(points[0][0],points[0][1]); for(const p of points.slice(1)){ if(p.length===4) ctx.quadraticCurveTo(p[0],p[1],p[2],p[3]); else ctx.lineTo(p[0],p[1]); } ctx.stroke(); }
    path([[135,h-120],[w*.5,h*.52,w-135,120]], 'rgba(245,196,81,.25)', 10);
    path([[125,155],[w*.36,95,w-125,160]], 'rgba(77,171,247,.30)', 6);
    path([[145,h/2],[w-145,h/2]], 'rgba(255,255,255,.18)', 5);
    path([[125,h-155],[w*.36,h-95,w-125,h-160]], 'rgba(77,171,247,.28)', 6);
    function circle(x,y,r,label,sub,color){
      ctx.fillStyle=color; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.24)'; ctx.lineWidth=4; ctx.stroke();
      ctx.fillStyle='#eef6ff'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.font='900 28px system-ui, Arial'; ctx.fillText(label,x,y-7);
      if(sub){ ctx.fillStyle='rgba(238,246,255,.70)'; ctx.font='800 15px system-ui, Arial'; ctx.fillText(sub,x,y+22); }
    }
    circle(118,h-118,68,'BLUE','BASE','rgba(77,171,247,.22)');
    circle(w-118,118,68,'RED','BASE','rgba(255,107,107,.22)');
    const obj = info.objectives || ['OBJ','OBJ'];
    circle(w*.33,h*.43,54,obj[0],'OBJ', 'rgba(245,196,81,.22)');
    circle(w*.67,h*.57,54,obj[1],'OBJ', 'rgba(245,196,81,.22)');
    ctx.font='900 23px system-ui, Arial'; ctx.textAlign='center'; ctx.textBaseline='middle';
    const lanes = info.lanes || ['TOP','MID','BOT'];
    function tag(x,y,t,stroke,fill){ ctx.fillStyle='rgba(6,16,25,.72)'; ctx.strokeStyle=stroke; ctx.lineWidth=2; roundRect(ctx,x-62,y-22,124,44,18,true,true); ctx.fillStyle=fill; ctx.fillText(t,x,y+1); }
    tag(w*.18,h*.15,lanes[0],'rgba(77,171,247,.35)','#dceeff');
    tag(w*.50,h*.49,lanes[1],'rgba(245,196,81,.40)','#fff1c8');
    tag(w*.82,h*.84,lanes[2],'rgba(77,171,247,.35)','#dceeff');
    ctx.fillStyle = 'rgba(255,255,255,.10)';
    [[.22,.30],[.27,.68],[.44,.34],[.56,.65],[.74,.34],[.78,.70]].forEach(([x,y]) => { ctx.beginPath(); ctx.arc(w*x,h*y,22,0,Math.PI*2); ctx.fill(); });
    ctx.fillStyle = '#ffe3a2'; ctx.font = '900 26px system-ui, Arial'; ctx.textAlign = 'left'; ctx.textBaseline='top';
    ctx.fillText(`${info.short} · HCI MOBA MAP SIMULATOR`, 36, 22);
    ctx.fillStyle = '#eef6ff'; ctx.font = '900 34px system-ui, Arial'; ctx.fillText((mapTitle?.value || 'HCI Map Plan').slice(0, 44), 36, 52);
    ctx.fillStyle = '#a8bacf'; ctx.font = '700 22px system-ui, Arial'; ctx.textAlign='right';
    ctx.fillText((mapNote?.value || 'Map strategy plan').slice(0, 80), w-36, 36);
  }
  function roundRect(ctx,x,y,w,h,r,fill,stroke){
    ctx.beginPath(); ctx.moveTo(x+r,y); ctx.arcTo(x+w,y,x+w,y+h,r); ctx.arcTo(x+w,y+h,x,y+h,r); ctx.arcTo(x,y+h,x,y,r); ctx.arcTo(x,y,x+w,y,r); ctx.closePath(); if(fill) ctx.fill(); if(stroke) ctx.stroke();
  }
  function downloadPng(){
    const w = 1600, h = 900;
    const canvas = document.createElement('canvas'); canvas.width = w; canvas.height = h;
    const ctx = canvas.getContext('2d');
    drawMap(ctx, w, h);
    ctx.fillStyle = 'rgba(4,9,16,.82)'; ctx.fillRect(0,0,w,96);
    ctx.fillStyle = '#ffe3a2'; ctx.font = '900 26px system-ui'; ctx.textAlign = 'left'; ctx.textBaseline='top';
    ctx.fillText(`${gameInfo[activeGame].short} · HCI MOBA MAP SIMULATOR`, 36, 22);
    ctx.fillStyle = '#eef6ff'; ctx.font = '900 34px system-ui'; ctx.fillText((mapTitle?.value || 'HCI Map Plan').slice(0, 44), 36, 52);
    ctx.fillStyle = '#a8bacf'; ctx.font = '600 22px system-ui'; ctx.textAlign='right';
    ctx.fillText((mapNote?.value || 'Map strategy plan').slice(0, 80), w-36, 36);
    markers.forEach((marker, index) => {
      const info = typeInfo[marker.type] || typeInfo.attack;
      const x = (marker.x/100)*w, y = (marker.y/100)*h;
      ctx.fillStyle = info.color; ctx.beginPath(); ctx.arc(x,y,28,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle = 'rgba(0,0,0,.60)'; ctx.lineWidth = 5; ctx.stroke();
      ctx.fillStyle = '#081018'; ctx.font = '900 30px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(info.icon, x, y-1);
      ctx.fillStyle = '#eef6ff'; ctx.font = '900 18px system-ui'; ctx.fillText(String(index+1), x+31, y-25);
    });
    const a = document.createElement('a');
    a.download = `hci-map-plan-${gameInfo[activeGame].short.toLowerCase()}-${Date.now()}.png`;
    a.href = canvas.toDataURL('image/png');
    a.click();
    showToast('Map plan PNG downloaded.');
  }
  async function copySummary(){
    const lines = [
      `HCI MOBA Map Plan (${gameInfo[activeGame].label})`,
      `Title: ${mapTitle?.value || 'HCI Map Plan'}`,
      mapNote?.value ? `Note: ${mapNote.value}` : '',
      `Markers: ${markers.length}`,
      ...markers.map((m, i) => `${i+1}. ${typeInfo[m.type].label} at ${m.x.toFixed(1)}%, ${m.y.toFixed(1)}%`)
    ].filter(Boolean);
    try{ await navigator.clipboard.writeText(lines.join('\n')); showToast('Map summary copied.'); }
    catch(_e){ showToast('Could not copy summary.'); }
  }
  function bind(){
    document.querySelectorAll('.map-game-tab').forEach((btn) => btn.addEventListener('click', () => { activeGame = btn.dataset.game; updateGame(); render(); }));
    document.querySelectorAll('.marker-tool').forEach((btn) => btn.addEventListener('click', () => { activeType = btn.dataset.type; updateTools(); save(); }));
    if(board){ board.addEventListener('click', addMarker); board.addEventListener('click', removeMarker, true); }
    if($('undoMarkerBtn')) $('undoMarkerBtn').addEventListener('click', () => { markers.pop(); render(); });
    if($('clearMarkersBtn')) $('clearMarkersBtn').addEventListener('click', () => { if(confirm('Clear all map markers?')){ markers = []; render(); } });
    if($('downloadMapBtn')) $('downloadMapBtn').addEventListener('click', downloadPng);
    if($('copyMapBtn')) $('copyMapBtn').addEventListener('click', copySummary);
    if(mapTitle) mapTitle.addEventListener('input', render);
    if(mapNote) mapNote.addEventListener('input', save);
  }
  load(); bind(); updateGame(); updateTools(); render();
})();
