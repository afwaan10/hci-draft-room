(() => {
  const $ = (id) => document.getElementById(id);
  const board = $('mapBoard');
  const layer = $('markerLayer');
  const markerCount = $('markerCount');
  const mapTitle = $('mapTitle');
  const mapNote = $('mapNote');
  const mapHeading = $('mapPlanHeading');
  const mapGameLabel = $('mapGameLabel');
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
    hok: { label:'Honor of Kings', short:'HOK', cls:'hok-map' },
    mlbb: { label:'Mobile Legends', short:'MLBB', cls:'mlbb-map' }
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
    if(mapGameLabel) mapGameLabel.textContent = info.label;
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
    const gradient = ctx.createLinearGradient(0, 0, w, h);
    gradient.addColorStop(0, activeGame === 'hok' ? '#061a25' : '#120a20');
    gradient.addColorStop(.5, '#071018');
    gradient.addColorStop(1, activeGame === 'hok' ? '#1f1a0d' : '#20110a');
    ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h);
    ctx.strokeStyle = 'rgba(255,255,255,.12)'; ctx.lineWidth = 4;
    for(let i = -h; i < w; i += 95){
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i + h, h); ctx.stroke();
    }
    ctx.strokeStyle = 'rgba(245,196,81,.22)'; ctx.lineWidth = 8;
    ctx.beginPath(); ctx.moveTo(90, h - 110); ctx.lineTo(w - 90, 110); ctx.stroke();
    ctx.strokeStyle = 'rgba(77,171,247,.22)'; ctx.lineWidth = 5;
    ctx.beginPath(); ctx.moveTo(120, 130); ctx.quadraticCurveTo(w/2, 80, w - 120, 130); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(120, h - 130); ctx.quadraticCurveTo(w/2, h - 80, w - 120, h - 130); ctx.stroke();
    ctx.strokeStyle = 'rgba(255,255,255,.16)'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(120, h/2); ctx.lineTo(w - 120, h/2); ctx.stroke();
    function circle(x,y,r,label,color){
      ctx.fillStyle = color; ctx.beginPath(); ctx.arc(x,y,r,0,Math.PI*2); ctx.fill();
      ctx.strokeStyle='rgba(255,255,255,.25)'; ctx.lineWidth=3; ctx.stroke();
      ctx.fillStyle='#eef6ff'; ctx.font='700 26px system-ui'; ctx.textAlign='center'; ctx.textBaseline='middle'; ctx.fillText(label,x,y);
    }
    circle(115, h-105, 58, 'BLUE', 'rgba(77,171,247,.22)');
    circle(w-115, 105, 58, 'RED', 'rgba(255,107,107,.22)');
    circle(w*.33, h*.43, 42, 'OBJ', 'rgba(245,196,81,.20)');
    circle(w*.67, h*.57, 42, 'OBJ', 'rgba(245,196,81,.20)');
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
