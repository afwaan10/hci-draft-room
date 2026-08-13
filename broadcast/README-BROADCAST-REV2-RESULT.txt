HCI BROADCAST — REVISION 2 / POST-GAME RESULT SCANNER
============================================================

FILE BARU
---------

result.html
css/result.css
js/result.js
js/result-scanner.js
result/index.html

URL
---

https://draft.hokcommunity.my.id/broadcast/result.html
https://draft.hokcommunity.my.id/broadcast/result/

CARA KERJA SCANNER
------------------

1. Input screenshot dapat melalui Upload, Tangkap Layar Desktop, Ctrl+V, atau Tempel Clipboard. Ukuran screenshot bebas.
2. Scanner tidak mengharuskan file 1920×1080.
3. Area result dapat:
   - dideteksi otomatis;
   - memakai seluruh screenshot;
   - dipilih manual dengan drag.
4. Area terpilih dinormalisasi ke sistem koordinat internal.
5. Slot player selalu dipetakan berdasarkan role:
   P1 Clash Lane
   P2 Jungle
   P3 Mid Lane
   P4 Farm Lane
   P5 Roam
6. Preset tersedia:
   - 5v5 Horizontal
   - 5v5 List / Rows
7. Jika layout screenshot berbeda, gunakan "Kalibrasi 10 Slot" sekali. Kalibrasi disimpan dan tetap berlaku untuk screenshot resolusi lain selama layout result sama.
8. Hero dan item dipindai menggunakan visual matching terhadap asset lokal HCI Broadcast.
9. Hero mendapat cross-check role. Hero LOCK dari Draft menjadi prior yang lebih kuat bila tersedia.
10. Mode Lengkap menambahkan OCR IGN/KDA/Gold menggunakan Tesseract.js browser.
11. Confidence rendah tidak langsung dianggap benar. Operator review dan koreksi manual sebelum tayang.
12. Tombol "Scan Ulang Slot" tersedia per role.

MODE SCAN
---------

Cepat:
- Hero
- 6 item × 10 player

Lengkap:
- Hero
- Item
- IGN
- KDA
- Gold

OCR mode Lengkap membutuhkan koneksi internet untuk memuat OCR engine dari CDN.
Jika OCR gagal, visual scan Hero + Item tetap berjalan.

RESULT OVERLAY EDITOR
---------------------

Operator dapat mengubah tanpa mengedit source OBS:
- Posisi X
- Posisi Y
- Scale
- Lebar panel
- Opacity panel
- Opacity card
- Jarak card
- Zoom hero
- Show/hide Role
- Show/hide KDA
- Show/hide Gold
- Show/hide Item

result.html menggunakan canvas 1920×1080 transparan.
Panel result semi-transparan dan dapat digeser/di-scale dari control.html. Foto player dari setup Draft ikut digunakan otomatis pada Result Overlay bila tersedia.

OBS
---

Tambahkan Browser Source:

https://draft.hokcommunity.my.id/broadcast/result.html

Width  : 1920
Height : 1080

Source boleh tetap aktif. Gunakan tombol:
- TAYANGKAN RESULT
- SEMBUNYIKAN

di control.html.

PENTING
-------

State Result menggunakan key terpisah:

hok_result_state_v1

State Draft existing tetap:

hok_draft_state_v1

Tidak ada perubahan pada firebase.json, Firebase Rules, Firestore, atau file website di luar folder /broadcast/.

CATATAN ANTAR-PC
----------------

localStorage tetap tersimpan per browser/perangkat. Control di PC A tidak otomatis sinkron ke Browser Source di PC B tanpa realtime backend. Revisi ini tidak mengubah Firebase/backend existing.
