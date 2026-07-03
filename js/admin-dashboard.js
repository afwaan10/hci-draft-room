(function(){
  "use strict";
  const $ = (id)=>document.getElementById(id);
  const ADMIN_EMAILS = Array.isArray(window.HCI_ADMIN_EMAILS) ? window.HCI_ADMIN_EMAILS.map((email)=>String(email).toLowerCase()) : [];
  const PUBLIC_ADMIN_CREATE = Boolean(window.HCI_ALLOW_PUBLIC_ADMIN_CREATE);
  const TRIAL_CREDITS = Number(window.HCI_TRIAL_CREDITS || 2);
  const els = {login:$("adminLoginBtn"),panel:$("adminPanel"),recent:$("recentRoomsPanel"),game:$("adminGame"),count:$("adminGameCount"),create:$("adminCreateRoomBtn"),created:$("adminCreatedRoom"),uid:$("creditUid"),amount:$("creditAmount"),add:$("addCreditBtn"),rooms:$("recentRoomsList"),toast:$("toast")};
  let auth=null, db=null, user=null, unsubscribe=null;
  function showToast(msg){ if(!els.toast) return; els.toast.textContent=msg; els.toast.hidden=false; clearTimeout(showToast.timer); showToast.timer=setTimeout(()=>els.toast.hidden=true,2800); }
  function escapeHtml(value){ return String(value ?? "").replaceAll("&","&amp;").replaceAll("<","&lt;").replaceAll(">","&gt;").replaceAll('"',"&quot;").replaceAll("'","&#039;"); }
  function ready(){ const cfg=window.HCI_FIREBASE_CONFIG; return Boolean(cfg&&cfg.apiKey&&cfg.projectId); }
  function isAdmin(){ if(!user || user.isAnonymous) return false; if(PUBLIC_ADMIN_CREATE) return true; return ADMIN_EMAILS.includes(String(user.email||"").toLowerCase()); }
  function roomId(prefix){ return `${prefix}-${Math.floor(1000+Math.random()*90000)}`; }
  function hostCode(){ const s="ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; let c=""; for(let i=0;i<6;i++) c+=s[Math.floor(Math.random()*s.length)]; return c; }
  async function login(){
    if(!ready()) return showToast("Firebase config is missing.");
    if(!firebase.apps.length) firebase.initializeApp(window.HCI_FIREBASE_CONFIG);
    auth=firebase.auth(); db=firebase.firestore();
    const provider=new firebase.auth.GoogleAuthProvider(); provider.setCustomParameters({prompt:"select_account"});
    const result=await auth.signInWithPopup(provider); user=result.user;
    if(!isAdmin()) return showToast("This Google account is not allowed as admin.");
    els.panel.hidden=false; els.recent.hidden=false; els.login.textContent=`Signed in: ${user.email}`; els.login.disabled=true; listenRooms();
  }
  async function createRoom(){
    if(!isAdmin()) return showToast("Admin access required.");
    const game=els.game.value; const count=Number(els.count.value||3); const prefix=game; let id=roomId(prefix); let ref=db.collection("draftRooms").doc(id); let snap=await ref.get(); let tries=0;
    while(snap.exists&&tries<20){ id=roomId(prefix); ref=db.collection("draftRooms").doc(id); snap=await ref.get(); tries++; }
    const code=hostCode(); const cost=count===5?2:1; const now=firebase.firestore.FieldValue.serverTimestamp();
    await ref.set({id,game,gameCount:count,gameNumber:1,status:"waiting",adminUid:user.uid,adminEmail:user.email,hostCode:code,hostUid:"",hostName:"",hostEmail:"",hostSide:"A",teamAUid:"",teamBUid:"",teamAName:"Team A",teamBName:"Team B",opponentUid:"",turnIndex:0,turnSeconds:45,prepareSeconds:3,bansA:[],bansB:[],picksA:[],picksB:[],selectedHeroIds:[],globalLockedHeroIds:[],gameResults:{},currentTurnStartedAt:null,prepareEndsAt:null,accessCost:cost,accessCharged:false,accessSource:"",createdAt:now,updatedAt:now});
    await ref.collection("activityLogs").add({action:"admin_create_room",actorUid:user.uid,actorEmail:user.email,actorRole:"ADMIN",game,roomId:id,meta:{gameCount:count},createdAt:now});
    els.created.innerHTML=`<strong>Room ID:</strong> ${escapeHtml(id)}<br><strong>Host Code:</strong> ${escapeHtml(code)}<br><strong>Session:</strong> ${count} Game · ${cost} credit(s)`; els.created.hidden=false; showToast("Room created.");
  }
  async function addCredits(){
    if(!isAdmin()) return showToast("Admin access required.");
    const uid=(els.uid.value||"").trim(); const amount=Number(els.amount.value||0); if(!uid||amount<=0) return showToast("Enter UID and credit amount.");
    const ref=db.collection("userAccess").doc(uid); const snap=await ref.get();
    if(!snap.exists) await ref.set({uid,email:"",displayName:"",trialCredits:TRIAL_CREDITS,paidCredits:amount,createdAt:firebase.firestore.FieldValue.serverTimestamp(),updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
    else await ref.update({paidCredits:firebase.firestore.FieldValue.increment(amount),updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
    showToast("Credits added.");
  }
  function listenRooms(){
    if(unsubscribe) unsubscribe();
    unsubscribe=db.collection("draftRooms").orderBy("createdAt","desc").limit(12).onSnapshot((snap)=>{
      if(snap.empty){ els.rooms.textContent="No rooms yet."; return; }
      els.rooms.innerHTML=snap.docs.map((d)=>{ const r=d.data(); return `<div style="padding:10px 0;border-bottom:1px solid rgba(255,255,255,.12)"><strong>${escapeHtml(r.id)}</strong> · ${escapeHtml(r.game)} · ${escapeHtml(r.status)} · ${escapeHtml(r.gameCount||3)} Game<br><span style="color:#9fb0c4">Host: ${escapeHtml(r.hostEmail||"not claimed")} · Cost: ${escapeHtml(r.accessCost||1)} credit(s)</span></div>`; }).join("");
    },(err)=>showToast(err.message));
  }
  els.login?.addEventListener("click",()=>login().catch((e)=>showToast(e.message)));
  els.create?.addEventListener("click",()=>createRoom().catch((e)=>showToast(e.message)));
  els.add?.addEventListener("click",()=>addCredits().catch((e)=>showToast(e.message)));
})();
