(() => {
  'use strict';
  const $=(id)=>document.getElementById(id);
  const form=$('authForm');
  if(!form) return;
  const mode=form.dataset.mode;
  const status=$('authStatus');
  const submit=$('authSubmit');
  const google=$('googleAuth');
  const showStatus=(message,type='')=>{if(!status)return;status.textContent=message;status.className=`mh-status ${type}`;};
  const busy=(value)=>{if(submit)submit.disabled=value;if(google)google.disabled=value;};
  const authState=()=>window.MOBAHub?.state;
  const normalizedUsername=(value)=>String(value||'').trim().toLowerCase();
  const validatePassword=(value,confirmation)=>{
    if(String(value).length<8) throw new Error('Password must contain at least 8 characters.');
    if(confirmation!==undefined && value!==confirmation) throw new Error('Passwords do not match.');
  };
  const firebaseMessage=(error)=>{
    const code=String(error?.code||'');
    if(code.includes('invalid-credential')||code.includes('wrong-password')||code.includes('user-not-found')) return 'The email, username, or password is incorrect.';
    if(code.includes('email-already-in-use')) return 'This email is already registered.';
    if(code.includes('invalid-email')) return 'Enter a valid email address.';
    if(code.includes('weak-password')) return 'Password must contain at least 8 characters.';
    if(code.includes('too-many-requests')) return 'Too many attempts. Try again later.';
    return error?.message || 'Authentication failed.';
  };
  async function login(){
    const {auth,db}=authState(); const identity=$('email').value.trim(); const password=$('password').value;
    if(!identity) throw new Error('Enter your email address or username.');
    let email=identity;
    if(!identity.includes('@')){
      const username=normalizedUsername(identity);
      if(!/^[a-z0-9_]{3,20}$/.test(username)) throw new Error('Enter a valid email address or username.');
      const snapshot=await db.collection('usernames').doc(username).get();
      email=String(snapshot.data()?.email||'').trim();
      if(!snapshot.exists||!email) throw new Error('The email, username, or password is incorrect.');
    }
    await auth.signInWithEmailAndPassword(email,password);
  }
  async function register(){
    const {auth,db}=authState(); const fullName=$('fullName').value.trim(); const username=normalizedUsername($('username').value); const email=$('email').value.trim(); const password=$('password').value; const confirmation=$('confirmPassword').value;
    if(fullName.length<2) throw new Error('Enter your full name.');
    if(!/^[a-z0-9_]{3,20}$/.test(username)) throw new Error('Username must be 3–20 characters using letters, numbers, or underscores.');
    validatePassword(password,confirmation);
    const credential=await auth.createUserWithEmailAndPassword(email,password);
    try{
      await credential.user.updateProfile({displayName:fullName});
      const usernameRef=db.collection('usernames').doc(username);
      const userRef=db.collection('users').doc(credential.user.uid);
      await db.runTransaction(async transaction=>{
        const usernameSnap=await transaction.get(usernameRef);
        if(usernameSnap.exists) throw new Error('This username is already in use.');
        transaction.set(usernameRef,{uid:credential.user.uid,email:credential.user.email||email,createdAt:firebase.firestore.FieldValue.serverTimestamp(),updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
        transaction.set(userRef,{fullName,username,email,photoURL:'',bio:'',country:'',mainGame:'Honor of Kings',mainRole:'',rank:'',playerId:'',createdAt:firebase.firestore.FieldValue.serverTimestamp(),updatedAt:firebase.firestore.FieldValue.serverTimestamp()},{merge:true});
      });
      try{await credential.user.sendEmailVerification();}catch(_error){}
    }catch(error){
      try{await credential.user.delete();}catch(_cleanupError){}
      throw error;
    }
  }
  async function forgot(){
    const {auth}=authState(); const email=$('email').value.trim(); if(!email) throw new Error('Enter your email address.');
    await auth.sendPasswordResetEmail(email,{url:window.MOBAHub.LOGIN_ROUTE,handleCodeInApp:false});
    showStatus('Password reset instructions were sent. Check your inbox and spam folder.','success');
  }
  async function reset(){
    const {auth}=authState(); const params=new URLSearchParams(location.search); const code=params.get('oobCode'); const password=$('password').value; const confirmation=$('confirmPassword').value;
    if(!code) throw new Error('This password reset link is invalid or incomplete.'); validatePassword(password,confirmation);
    await auth.verifyPasswordResetCode(code); await auth.confirmPasswordReset(code,password);
    showStatus('Password updated. Redirecting to sign in…','success'); setTimeout(()=>location.replace(window.MOBAHub.LOGIN_ROUTE),900);
  }
  async function submitHandler(event){
    event.preventDefault(); if(!authState()?.auth){showStatus('Authentication service is unavailable. Check Firebase configuration.');return;} busy(true); showStatus('Processing…');
    try{
      if(mode==='login') await login();
      if(mode==='register') await register();
      if(mode==='forgot') await forgot();
      if(mode==='reset') await reset();
      if(mode==='login'||mode==='register'){
        const next=window.MOBAHub.validNext(new URLSearchParams(location.search).get('next'));
        location.replace(next);
      }
    }catch(error){showStatus(firebaseMessage(error));}finally{busy(false);}
  }
  form.addEventListener('submit',submitHandler);
  google?.addEventListener('click',async()=>{
    busy(true);showStatus('Opening Google sign in…');
    try{
      const provider=new firebase.auth.GoogleAuthProvider();provider.setCustomParameters({prompt:'select_account'});
      const result=await authState().auth.signInWithPopup(provider);
      const ref=authState().db.collection('users').doc(result.user.uid);
      const profile={fullName:result.user.displayName||'',email:result.user.email||'',photoURL:result.user.photoURL||'',updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
      if(result.additionalUserInfo?.isNewUser) profile.createdAt=firebase.firestore.FieldValue.serverTimestamp();
      await ref.set(profile,{merge:true});
      const next=window.MOBAHub.validNext(new URLSearchParams(location.search).get('next')); location.replace(next);
    }catch(error){showStatus(firebaseMessage(error));busy(false);}
  });
  document.querySelectorAll('[data-toggle-password]').forEach(button=>button.addEventListener('click',()=>{
    const input=$(button.dataset.togglePassword);if(!input)return;input.type=input.type==='password'?'text':'password';button.textContent=input.type==='password'?'Show':'Hide';
  }));
})();
