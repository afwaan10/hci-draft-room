/**
 * MOBA HUB - hub-home.js
 * Version: 42 (MOBA HUB Rebuild)
 * Handles: Forced Authentication Gate, UI Toggles (Login/Register/Reset), and Firebase Auth.
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // ==========================================
    // 1. INISIALISASI ELEMEN DOM
    // ==========================================
    
    // Elemen Utama
    const appLoader = document.getElementById('appLoader');
    const hubApp = document.getElementById('hubApp');
    const loginGate = document.getElementById('loginGate');
    const loginGateStatus = document.getElementById('loginGateStatus');
    const toast = document.getElementById('toast');

    // Elemen Menu & User Profile
    const menuUserName = document.getElementById('menuUserName');
    const menuUserEmail = document.getElementById('menuUserEmail');
    const menuUserPhoto = document.getElementById('menuUserPhoto');
    const menuLogoutBtn = document.getElementById('menuLogoutBtn');
    
    // Elemen Sidebar Menu
    const homeMenuBtn = document.getElementById('homeMenuBtn');
    const homeMenuPanel = document.getElementById('homeMenuPanel');

    // Tombol Auth Google
    const googleLoginBtn = document.getElementById('googleLoginBtn');

    // Formulir & Tombol Navigasi Auth
    const emailLoginForm = document.getElementById('emailLoginForm');
    const loginEmailInput = document.getElementById('loginEmail');
    const loginPasswordInput = document.getElementById('loginPassword');
    
    const showRegisterFormBtn = document.getElementById('showRegisterForm');
    const showResetFormBtn = document.getElementById('showResetForm');

    // ==========================================
    // 2. FUNGSI UTILITAS (TOAST & MENU)
    // ==========================================
    
    function showToast(message, isError = false) {
        toast.textContent = message;
        toast.style.background = isError ? '#ef4444' : '#22c55e'; // Merah (error) / Hijau (sukses)
        toast.hidden = false;
        setTimeout(() => { toast.hidden = true; }, 3500);
    }

    // Toggle Sidebar Menu
    if (homeMenuBtn && homeMenuPanel) {
        homeMenuBtn.addEventListener('click', () => {
            const isExpanded = homeMenuBtn.getAttribute('aria-expanded') === 'true';
            homeMenuBtn.setAttribute('aria-expanded', !isExpanded);
            homeMenuPanel.hidden = isExpanded;
        });
    }

    // ==========================================
    // 3. UI TOGGLE UNTUK REGISTER & RESET PASSWORD
    // ==========================================
    
    // Perhatikan: Karena struktur HTML sebelumnya hanya memiliki Form Login dasar untuk menjaga ukuran file,
    // kita akan menggunakan JavaScript untuk mengganti isi form di dalam kotak login.

    // --- Switch ke Register Form ---
    if (showRegisterFormBtn) {
        showRegisterFormBtn.addEventListener('click', (e) => {
            e.preventDefault();
            emailLoginForm.innerHTML = `
                <div style="margin-bottom: 10px;">
                    <label style="display: block; font-size: 0.85rem; color: #ccc; margin-bottom: 5px;">Full Name</label>
                    <input type="text" id="regFullName" required placeholder="John Doe" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #333; background: #1a1a1a; color: #fff;">
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="display: block; font-size: 0.85rem; color: #ccc; margin-bottom: 5px;">Username</label>
                    <input type="text" id="regUsername" required placeholder="johndoe99" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #333; background: #1a1a1a; color: #fff;">
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="display: block; font-size: 0.85rem; color: #ccc; margin-bottom: 5px;">Email Address</label>
                    <input type="email" id="regEmail" required placeholder="Valid email for reset code" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #333; background: #1a1a1a; color: #fff;">
                </div>
                <div style="margin-bottom: 10px;">
                    <label style="display: block; font-size: 0.85rem; color: #ccc; margin-bottom: 5px;">Password</label>
                    <input type="password" id="regPassword" required placeholder="Create strong password" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #333; background: #1a1a1a; color: #fff;">
                </div>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-size: 0.85rem; color: #ccc; margin-bottom: 5px;">Confirm Password</label>
                    <input type="password" id="regConfirmPassword" required placeholder="Type password again" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #333; background: #1a1a1a; color: #fff;">
                </div>
                <button type="submit" id="submitRegisterBtn" class="primary-btn login-gate-btn" style="width: 100%;">Sign Up</button>
                <div style="text-align: center; margin-top: 15px; font-size: 0.85rem; color: #ccc;">
                    Already have an account? <a href="#" onclick="window.location.reload();" style="color: #4285F4; text-decoration: none; font-weight: bold;">Log In Here</a>
                </div>
            `;
            // Attach event listener ke form baru
            attachRegisterEvent();
        });
    }

    // --- Switch ke Reset Password Form ---
    if (showResetFormBtn) {
        showResetFormBtn.addEventListener('click', (e) => {
            e.preventDefault();
            emailLoginForm.innerHTML = `
                <p style="color: #ccc; font-size: 0.9rem; margin-bottom: 15px;">Enter your email to receive a password reset link.</p>
                <div style="margin-bottom: 15px;">
                    <label style="display: block; font-size: 0.85rem; color: #ccc; margin-bottom: 5px;">Email Address</label>
                    <input type="email" id="resetEmail" required placeholder="Enter registered email" style="width: 100%; padding: 10px; border-radius: 6px; border: 1px solid #333; background: #1a1a1a; color: #fff;">
                </div>
                <button type="submit" id="submitResetBtn" class="primary-btn login-gate-btn" style="width: 100%; background: #eab308; color: #000; border: none;">Send Reset Code</button>
                <div style="text-align: center; margin-top: 15px; font-size: 0.85rem; color: #ccc;">
                    Remember your password? <a href="#" onclick="window.location.reload();" style="color: #4285F4; text-decoration: none; font-weight: bold;">Back to Log In</a>
                </div>
            `;
            attachResetEvent();
        });
    }


    // ==========================================
    // 4. FIREBASE AUTH LOGIC
    // ==========================================
    
    // Tunggu Firebase inisialisasi dari firebase-config.js
    setTimeout(() => {
        if (typeof firebase === 'undefined') {
            console.error("Firebase SDK not loaded.");
            return;
        }

        const auth = firebase.auth();
        const db = firebase.firestore();

        // A. CEK STATUS LOGIN (FORCED LOGIN LOGIC)
        auth.onAuthStateChanged((user) => {
            if (user) {
                // User sudah login -> Tutup Login Gate, Tampilkan App
                loginGate.hidden = true;
                appLoader.hidden = true;
                hubApp.hidden = false;

                // Update Profil di Menu
                if (menuUserName) menuUserName.textContent = user.displayName || 'MOBA Player';
                if (menuUserEmail) menuUserEmail.textContent = user.email;
                if (menuUserPhoto) {
                    menuUserPhoto.src = user.photoURL || '/assets/brand/hci-icon.png';
                    document.getElementById('menuProfileBlock').hidden = false;
                }
                if (menuLogoutBtn) menuLogoutBtn.hidden = false;
                
            } else {
                // User belum login -> Tampilkan Login Gate, Sembunyikan App
                hubApp.hidden = true;
                appLoader.hidden = true; // Matikan loader
                loginGate.hidden = false;
            }
        });

        // B. GOOGLE LOGIN
        if (googleLoginBtn) {
            googleLoginBtn.addEventListener('click', () => {
                loginGateStatus.textContent = "Connecting to Google...";
                const provider = new firebase.auth.GoogleAuthProvider();
                auth.signInWithPopup(provider)
                    .then((result) => {
                        showToast("Login Successful!");
                    })
                    .catch((error) => {
                        loginGateStatus.textContent = "Error: " + error.message;
                        showToast(error.message, true);
                    });
            });
        }

        // C. LOGOUT
        if (menuLogoutBtn) {
            menuLogoutBtn.addEventListener('click', () => {
                auth.signOut().then(() => {
                    // Refresh halaman untuk mereset UI
                    window.location.reload();
                }).catch((error) => {
                    showToast("Logout failed.", true);
                });
            });
        }

        // D. EMAIL LOGIN (Default Form)
        if (emailLoginForm) {
            emailLoginForm.addEventListener('submit', (e) => {
                e.preventDefault();
                // Jika input email dan password ada, berarti ini form Login
                if (loginEmailInput && loginPasswordInput) {
                    const email = loginEmailInput.value;
                    const pass = loginPasswordInput.value;
                    loginGateStatus.textContent = "Authenticating...";
                    
                    auth.signInWithEmailAndPassword(email, pass)
                        .then(() => {
                            showToast("Login Successful!");
                        })
                        .catch((error) => {
                            loginGateStatus.textContent = "Invalid email or password.";
                            showToast(error.message, true);
                        });
                }
            });
        }

        // E. REGISTER NEW ACCOUNT (Dipanggil saat Switch ke Register Form)
        function attachRegisterEvent() {
            const submitBtn = document.getElementById('submitRegisterBtn');
            if (submitBtn) {
                submitBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const email = document.getElementById('regEmail').value;
                    const pass = document.getElementById('regPassword').value;
                    const confirmPass = document.getElementById('regConfirmPassword').value;
                    const fullName = document.getElementById('regFullName').value;
                    const username = document.getElementById('regUsername').value;

                    // Validasi Poin 7: Confirm Password
                    if (pass !== confirmPass) {
                        showToast("Passwords do not match!", true);
                        return;
                    }

                    loginGateStatus.textContent = "Creating account...";

                    auth.createUserWithEmailAndPassword(email, pass)
                        .then((userCredential) => {
                            const user = userCredential.user;
                            // Update Display Name
                            return user.updateProfile({
                                displayName: fullName
                            }).then(() => {
                                // Simpan data tambahan ke Firestore (Opsional)
                                return db.collection('users').doc(user.uid).set({
                                    fullName: fullName,
                                    username: username,
                                    email: email,
                                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                                });
                            });
                        })
                        .then(() => {
                            showToast("Account created successfully!");
                        })
                        .catch((error) => {
                            loginGateStatus.textContent = "Error: " + error.message;
                            showToast(error.message, true);
                        });
                });
            }
        }

        // F. RESET PASSWORD (Dipanggil saat Switch ke Reset Form)
        function attachResetEvent() {
            const submitBtn = document.getElementById('submitResetBtn');
            if (submitBtn) {
                submitBtn.addEventListener('click', (e) => {
                    e.preventDefault();
                    const email = document.getElementById('resetEmail').value;
                    
                    if(!email) {
                        showToast("Please enter an email address.", true);
                        return;
                    }

                    loginGateStatus.textContent = "Sending reset link...";
                    
                    auth.sendPasswordResetEmail(email)
                        .then(() => {
                            loginGateStatus.textContent = "Reset code sent to " + email;
                            showToast("Check your email for the reset link.");
                            // Kembali ke login setelah 3 detik
                            setTimeout(() => { window.location.reload(); }, 3000);
                        })
                        .catch((error) => {
                            loginGateStatus.textContent = "Error: " + error.message;
                            showToast(error.message, true);
                        });
                });
            }
        }

    }, 1000); // Delay 1 detik untuk memastikan Firebase SDK termuat
});
