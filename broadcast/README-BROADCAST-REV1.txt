HCI BROADCAST — WEBSITE INTEGRATION REVISION 1
============================================================

Folder ini ditambahkan sebagai /broadcast/.
Tidak ada file existing MOBA HUB yang diubah.

URL:
https://draft.hokcommunity.my.id/broadcast/control.html
https://draft.hokcommunity.my.id/broadcast/display.html
https://draft.hokcommunity.my.id/broadcast/ingame.html

Alias:
https://draft.hokcommunity.my.id/broadcast/control/
https://draft.hokcommunity.my.id/broadcast/display/
https://draft.hokcommunity.my.id/broadcast/ingame/

REVISION 1
----------
- Layout/posisi Draft Display existing dipertahankan.
- Foto player tetap tampil sebelum LOCK.
- Hero yang dipilih di control belum tampil di OBS.
- LOCK & TAYANGKAN baru memunculkan hero.
- Hero masuk dari bawah ke atas selama 1.15 detik.
- Ada lock impact/burst/hentakan.
- Picking animation/display hero sementara dihapus.
- Logo team sedikit diperbesar.
- Items menjadi modul collapsible.
- Hotkey dinonaktifkan sementara, tidak dihapus.
- Tombol/status Draft Control diperjelas.
- Canvas transparan; panel semi-transparan.

CATATAN 2 PC
------------
localStorage tidak sinkron antar perangkat.
Jika Control ada di PC A dan OBS Display ada di PC B, state tidak realtime.
Scope revisi ini tidak mengubah Firebase rules/backend karena repository existing
diminta tetap utuh dan hanya folder /broadcast/ yang ditambahkan.
