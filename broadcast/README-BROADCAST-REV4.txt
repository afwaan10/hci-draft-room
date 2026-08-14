HCI BROADCAST REV4 — OPERATOR CONSOLE + RESULT SCANNER REVISION
Tanggal: 14 Agustus 2026

RINGKASAN
- Source tetap pure HTML + CSS + Vanilla JavaScript.
- State utama Draft/In-Game tetap menggunakan: hok_draft_state_v1
- Result utama tetap menggunakan: hok_result_state_v1
- Tidak ada perubahan Firebase / database / hosting configuration.
- Hotkey Draft/In-Game tetap dinonaktifkan sementara sesuai revisi sebelumnya.

FITUR REV4
1. BROADCAST HUB
   - Ringkasan match aktif, BO, mode, skor series.
   - Akses cepat Draft, In-Game, Result, dan Broadcast Tools.
   - Shortcut membuka seluruh output OBS.

2. MATCH SCHEDULE / QUEUE
   - Tambah Blue Team vs Red Team + BO1/BO3/BO5.
   - Tombol Muat memasukkan nama tim dan format series ke control existing.
   - Data queue disimpan di localStorage.

3. POST-DRAFT OVERLAY
   - Output baru: postdraft.html
   - Mengambil 10 hero yang sudah LOCK dari Draft.
   - Tampilkan/sembunyikan dari control.

4. DRAFT RECAP + GLOBAL BAN
   - Simpan snapshot Draft per game.
   - Output baru: recap.html
   - Global Ban opsional membaca hero dari recap tersimpan.
   - Saat Global Ban aktif, hero tersebut ditandai dan diblokir di Hero Picker.
   - Snapshot recap hanya menyimpan nama/pick/ban yang diperlukan agar localStorage tidak penuh oleh foto base64.

5. LIVE EVENT OVERLAY
   - Output baru: event.html
   - + Tyrant / + Overlord otomatis memicu notification singkat.
   - Kill Event manual: First Blood, Double, Triple, Quad, Penta, Team Wipe.

6. MVP OVERLAY
   - Output baru: mvp.html
   - Mengambil player, hero, foto, KDA, Gold, dan 6 item dari Result state.
   - Pemilihan MVP dari control.

7. RESULT SCANNER REVISION
   - Upload screenshot HANYA menampilkan preview. Tidak ada deteksi otomatis saat upload.
   - AUTO SCAN RESULT baru menjalankan:
       resolusi asli screenshot -> deteksi panel -> generate 10 row -> hero/item/OCR -> preview.
   - Mapping 10 slot tetap:
       P1 Clash Lane
       P2 Jungle
       P3 Mid Lane
       P4 Farm Lane
       P5 Roam
     untuk Blue dan Red.
   - Layout output Horizontal/Rows tidak memengaruhi scanner.
   - Mapping hero dan 6 item diperbaiki berdasarkan screenshot native HoK.
   - Hero matching tidak lagi dipaksa oleh Draft lock ketika Auto Scan berlangsung.
   - Role hanya menjadi bobot ringan, bukan hard rule.
   - Confidence dibuat lebih konservatif: data low-confidence dibiarkan kosong untuk review daripada mengisi salah.
   - Hasil scan lama dibersihkan sebelum scan baru.
   - Tombol Reset Hasil Scan ditambahkan.
   - Temporary scan menggunakan key hok_result_temp_v1 dan TIDAK mengganti result live sebelum operator Confirm.

8. POPUP CONFIRM RESULT
   Setelah Auto Scan selesai muncul preview overlay Result.
   Tombol:
   - Cancel      : batalkan temporary scan, screenshot tetap tersedia.
   - Scan Again  : scan ulang screenshot yang sama.
   - Confirm     : simpan hasil sebagai Result confirmed.

   Confirm TIDAK otomatis tayang ke OBS.
   Operator tetap harus menekan TAYANGKAN RESULT.

OUTPUT OBS BARU
- postdraft.html
- event.html
- mvp.html
- recap.html

OUTPUT EXISTING
- display.html
- ingame.html
- result.html

CATATAN 2 PC
Broadcast masih memakai localStorage. Control dan output OBS realtime harus berada pada browser storage/device yang sama. localStorage tidak sinkron otomatis antar-PC.

UPDATE GITHUB
Cara termudah: upload/overwrite seluruh folder broadcast/ dari ZIP FULL REV4.
Tidak perlu mengubah firebase.json, Firestore rules, Auth, atau root MOBA HUB.
