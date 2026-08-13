HCI BROADCAST — OPERATOR QUICK GUIDE
====================================

1. JALANKAN SERVER
------------------

Buka Command Prompt di folder:

HCI Broadcast

Jalankan:

py -m http.server 8080 --bind 0.0.0.0


2. URL
------

Control:
http://127.0.0.1:8080/control.html

Draft:
http://127.0.0.1:8080/display.html

In-Game:
http://127.0.0.1:8080/ingame.html


3. MODE
-------

DRAFT MODE
- Ban
- Pick
- Draft timer
- Player setup

IN-GAME MODE
- Game timer
- Kill
- Gold
- Tyrant
- Overlord
- Hotkey


4. SERIES
---------

Tersedia:

BO1
BO3
BO5


5. HERO FILTER
--------------

Filter operator:

Clash Lane
Mid Lane
Roam
Farm Lane
Jungle

Hero yang bisa bermain lebih dari satu posisi dapat muncul di beberapa filter.


6. PICK HERO
------------

Sebelum pick:
- Foto player tampil.

Pilih hero:
- Status menjadi PICKING.
- Foto player hilang.
- Hero masuk dengan animasi.
- Slot sedikit melebar.

Tekan:

LOCK

untuk mengunci hero.

Tekan:

UNLOCK

jika perlu koreksi.


7. RESET
--------

Reset Draft:
- Ban/pick/timer draft saja.
- Team/logo/player/photo tetap.

Reset In-Game:
- Game timer/kills/gold/objective saja.
- Team/logo/player/photo tetap.

Reset Match:
- Draft + In-Game.
- Series score tetap.

Reset Series:
- Draft + In-Game + series score 0-0.
- Team/logo/player/photo tetap.

Reset Event / Clear All:
- Menghapus SEMUA data termasuk logo dan foto player.


8. GOLD
-------

Quick button:

-500
-200
-100
Even
+100
+200
+500

Input manual tetap bisa digunakan.


9. HOTKEY IN-GAME
-----------------

Q          Blue Kill +1
E          Red Kill +1

A          Blue Gold +200
D          Red Gold +200

Shift + A  Blue Gold +500
Shift + D  Red Gold +500

Z          Blue Tyrant +1
X          Red Tyrant +1

C          Blue Overlord +1
V          Red Overlord +1

Space      Start / Pause Game Timer
T          Reset Game Timer
R          Reset Semua In-Game Stats


10. HOTKEY AMAN SAAT MENGETIK
-----------------------------

Hotkey TIDAK berjalan saat operator mengetik pada:

- Nama team
- Nama player
- Gold input
- Search hero
- Search item
- Input / textarea / select lainnya

Hotkey hanya aktif ketika control panel fokus dan berada di IN-GAME MODE.


11. OBS
-------

Custom Browser Dock:

http://127.0.0.1:8080/control.html

Draft Browser Source:

http://127.0.0.1:8080/display.html

In-Game Browser Source:

http://127.0.0.1:8080/ingame.html

Resolution:

1920 x 1080


12. DRAFT LAYOUT
----------------

Draft panel berada di bagian bawah layar.

Area atas sengaja kosong untuk:

- Face cam caster
- Event graphic
- Sponsor
- Online broadcast layout


13. FOTO PLAYER
---------------

Upload foto player hanya sekali saat setup event/series.

Foto tidak hilang saat Reset Match atau Reset Series.

Hanya Reset Event / Clear All yang menghapus foto.

PLAYER PHOTO
------------

Recommended source:

- Portrait 9:16.
- Source 1080 x 1920.
- Pose dari kepala sampai pinggang.
- Sisakan headroom sekitar 8-12%.
- PNG/WebP transparan lebih baik.

Setelah upload, operator dapat mengatur setiap player:

Scale
- 85% sampai 130%.

Vertical
- Nilai negatif menggeser player ke atas.
- Nilai positif menggeser player ke bawah.

Reset Frame
- Kembali ke Scale 100% dan Vertical 0%.

Clear Photo
- Menghapus foto player tersebut.

Foto tidak lagi menggunakan crop "cover". Overlay memakai contain + bottom center,
sehingga badan player lebih aman dari potongan berlebihan.


============================================================
POST-GAME RESULT SCANNER
============================================================

URL OBS Result Overlay:

https://draft.hokcommunity.my.id/broadcast/result.html

Browser Source OBS:
Width  : 1920
Height : 1080

INPUT SCREENSHOT
----------------

Operator dapat menggunakan:

1. Upload Screenshot.
2. Tangkap Layar Desktop.
3. Tempel Clipboard.
4. Ctrl+V gambar screenshot langsung pada Control.

Screenshot tidak wajib 1920x1080.
Scanner bekerja pada area result yang dipilih lalu menormalisasi koordinat secara internal.

AREA RESULT
-----------

Jika screenshot hanya berisi result:
- Gunakan Seluruh Gambar.

Jika screenshot full desktop:
- Tekan Deteksi Area Otomatis.
- Periksa kotak area warna gold.
- Jika belum tepat, tekan Pilih Area Manual lalu drag area result.

KALIBRASI SLOT
---------------

Urutan player scanner selalu:

P1 = Clash Lane
P2 = Jungle
P3 = Mid Lane
P4 = Farm Lane
P5 = Roam

Berlaku untuk Blue dan Red.

Jika kotak player pada preview belum pas:

1. Tekan Kalibrasi 10 Slot.
2. Ikuti instruksi.
3. Drag area player Blue Clash.
4. Blue Jungle.
5. Blue Mid.
6. Blue Farm.
7. Blue Roam.
8. Red Clash.
9. Red Jungle.
10. Red Mid.
11. Red Farm.
12. Red Roam.

Kalibrasi disimpan berdasarkan posisi relatif terhadap area result.
Karena itu resolusi screenshot selanjutnya boleh berbeda selama layout result yang dipakai sama.

MODE SCAN
---------

CEPAT:
- Hero.
- 6 item setiap player.

LENGKAP:
- Hero.
- Item.
- IGN.
- KDA.
- Gold.

Mode Lengkap membutuhkan koneksi internet untuk OCR browser.
Jika OCR gagal, Hero + Item tetap diproses.

HERO
----

Scanner membandingkan icon pada screenshot dengan 120 hero asset lokal.
Role player digunakan sebagai tambahan confidence.

Jika hero sudah LOCK pada Draft Control, hero Draft menjadi prior utama dan scanner visual dipakai sebagai verifikasi tambahan.

ITEM
----

Scanner membandingkan setiap slot item dengan 118 icon item lokal.
Total maksimal:

10 player x 6 item = 60 slot item.

Hasil confidence rendah tetap ditampilkan sebagai warning agar operator dapat memperbaiki manual.

REVIEW
------

Jangan langsung tayangkan result tanpa review.

Periksa:
- IGN.
- Hero.
- KDA.
- Gold.
- 6 Item.

Slot warning dapat:
- dikoreksi manual;
- dipilih ulang melalui visual picker;
- Scan Ulang Slot.

TAYANGKAN RESULT
----------------

Setelah data benar:

TAYANGKAN RESULT

Untuk menutup:

SEMBUNYIKAN

RESULT OVERLAY EDITOR
---------------------

Operator dapat menyesuaikan result.html tanpa mengubah Browser Source OBS:

- Posisi X.
- Posisi Y.
- Scale.
- Lebar Panel.
- Opacity Panel.
- Opacity Card.
- Jarak Card.
- Zoom Hero.
- Tampilkan/Sembunyikan Role.
- Tampilkan/Sembunyikan KDA.
- Tampilkan/Sembunyikan Gold.
- Tampilkan/Sembunyikan Item.

Canvas result.html selalu transparan.
Foto player, team name, logo, roster, hero locked, dan beberapa data existing dapat diambil dari setup Draft menggunakan tombol:

AMBIL TEAM / ROSTER DARI DRAFT

RESULT STORAGE
--------------

Result menggunakan storage terpisah:

hok_result_state_v1

Draft tetap:

hok_draft_state_v1

CATATAN ANTAR-PC
----------------

localStorage tidak sinkron antar perangkat.
Control pada PC A dan OBS Browser Source pada PC B tidak otomatis berbagi state tanpa realtime backend.
