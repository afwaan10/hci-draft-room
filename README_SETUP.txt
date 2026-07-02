HCI Draft Room - Complete Version

ISI FILE:
- index.html     : Loading 3 detik + pilih game HOK / MLBB.
- hok.html       : Draft Room khusus Honor of Kings.
- mlbb.html      : Draft Room khusus Mobile Legends.
- css/draft-room.css
- js/draft-room.js
- js/heroes-hok.js
- js/heroes-mlbb.js
- js/firebase-config.js
- assets/hci-logo.webp

CARA PAKAI:
1. Upload semua isi folder ini ke repository / hosting draft.hokcommunity.my.id.
2. Jangan ubah nama index.html, hok.html, dan mlbb.html.
3. Copy config Firebase lama kamu ke js/firebase-config.js.
4. Buka index.html / domain utama.
5. Setelah loading 3 detik, pilih HOK atau MLBB.

CATATAN:
- HOK dan MLBB sudah dipisahkan ke halaman masing-masing.
- Jika memilih HOK, masuk ke hok.html.
- Jika memilih MLBB, masuk ke mlbb.html.
- MLBB sudah memiliki database awal hero berbasis nama dan role, tanpa foto.
- Result draft bisa didownload sebagai PNG.
- Next Game akan lanjut ke Game 2 / Best of 3 dan refresh halaman otomatis.
- Auto-scroll ke hero hanya aktif di tampilan mobile.

FIREBASE:
Sistem tetap memakai collection draftRooms. Jadi rules Firebase lama yang mengizinkan /draftRooms masih bisa dipakai.
