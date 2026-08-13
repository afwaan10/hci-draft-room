# HCI Broadcast — Honor of Kings Overlay

HCI Broadcast adalah overlay Honor of Kings untuk OBS dengan dua fase:

- Draft Overlay (`display.html`)
- In-Game Overlay (`ingame.html`)
- Operator Control (`control.html`)

Semua state tetap menggunakan:

```text
hok_draft_state_v1
```

Arsitektur tetap pure client-side:

```text
control.html
    ↓
localStorage
    ↓
storage event
    ↓
display.html / ingame.html
```

## Struktur Folder

```text
HCI Broadcast/
├── control.html
├── display.html
├── ingame.html
├── css/
│   ├── control.css
│   ├── display.css
│   └── ingame.css
├── js/
│   ├── control.js
│   ├── display.js
│   ├── ingame.js
│   ├── heroes-data.js
│   └── items-data.js
├── assets/
│   ├── heroes/
│   │   ├── icons/
│   │   └── portraits/
│   └── items/
│       └── icons/
├── README.md
└── README-OPERATOR.txt
```

## Menjalankan

Windows:

```bat
cd "C:\path\to\HCI Broadcast"
py -m http.server 8080 --bind 0.0.0.0
```

Jika `py` tidak tersedia:

```bat
python -m http.server 8080 --bind 0.0.0.0
```

URL:

```text
Control:
http://127.0.0.1:8080/control.html

Draft:
http://127.0.0.1:8080/display.html

In-Game:
http://127.0.0.1:8080/ingame.html
```

## OBS

Recommended setup:

```text
OBS Custom Browser Dock:
http://127.0.0.1:8080/control.html

Browser Source — Draft:
http://127.0.0.1:8080/display.html

Browser Source — In-Game:
http://127.0.0.1:8080/ingame.html
```

Browser Source:

```text
Width  : 1920
Height : 1080
```

Draft dan In-Game source dapat tetap aktif bersamaan. `state.mode` mengatur overlay yang terlihat.

---

# Draft

## Series

Series yang tersedia:

```text
BO1
BO3
BO5
```

Maximum series score:

```text
BO1 → 1
BO3 → 2
BO5 → 3
```

## Hero Lane / Position

Visual picker menggunakan lima posisi broadcast:

```text
Clash Lane
Mid Lane
Roam
Farm Lane
Jungle
```

Hero fleksibel dapat memiliki lebih dari satu `positions`.

Contoh:

```js
{
  id: "augran",
  name: "Augran",
  role: "Jungle",
  positions: ["Jungle", "Clash Lane"]
}
```

`combatClass` tetap disimpan sebagai metadata internal tetapi tidak dipakai sebagai filter operator utama.

## Pick Lock Flow

Pick tidak lagi langsung dianggap final.

Workflow:

```text
1. Operator pilih hero.
2. Slot menjadi PICKING.
3. Foto player hilang / fade.
4. Hero masuk dengan animasi.
5. Slot sedikit melebar.
6. Operator tekan LOCK.
7. Hero tetap tampil sebagai locked pick.
```

Jika perlu koreksi:

```text
UNLOCK
```

akan mengaktifkan kembali slot sebagai pick aktif.

## Draft Display

Draft Overlay sekarang dibuat compact di bagian bawah 1920x1080.

Tujuan:

- Area atas tetap kosong untuk face cam caster / online event layout.
- Pick Blue dan Red berjajar horizontal.
- Ban tampil kecil pada header tim.
- Team name/logo/series score tetap terlihat.
- Timer dan status pick berada di tengah.
- Slot aktif hanya sedikit melebar agar tidak mengganggu layout.

Animasi hero tetap menggunakan requirement:

```css
translateY(80px) scale(0.7)
→
translateY(0) scale(1)

opacity 0 → 1
duration 0.65s
glow box-shadow
```

---

# Reset System

## Reset Draft

Mereset:

```text
Ban
Pick
Pick lock status
Active pick
Draft timer
```

Tetap menyimpan:

```text
Team name
Logo
Player name
Player photo
Items
Series score
In-Game stats
```

## Reset In-Game

Mereset:

```text
Game timer
Kills
Gold diff
Tyrant
Overlord
```

Setup tim/player dan series score tetap.

## Reset Match

Mereset:

```text
Draft
In-Game stats
```

Tetap menyimpan:

```text
Team
Logo
Player
Photo
Items
Series score
```

Gunakan setelah Game 1 untuk masuk Game 2, dan seterusnya.

## Reset Series

Mereset:

```text
Draft
In-Game stats
Series score → 0 - 0
```

Tetap menyimpan team/logo/player/photo/items.

## Reset Event / Clear All

Menghapus seluruh setup dan state:

```text
Team
Logo
Player
Photo
Items
Series score
Draft
In-Game
```

State kembali ke default.

---

# In-Game

## Game Timer

```text
Start
Pause
Reset 00:00
```

Format:

```text
MM:SS
```

## Kills

```text
Blue +1 / -1
Red +1 / -1
```

## Gold Advantage

Input angka bebas menerima nilai seperti:

```text
432
1750
2840
-1920
```

Quick adjustment:

```text
−500 | −200 | −100 | Even | +100 | +200 | +500
```

Convention:

```text
positive → Blue unggul
negative → Red unggul
0        → Even
```

Display:

```text
500   → +500
1500  → +1.5k
2840  → +2.8k
```

## Objectives

Counter tersedia untuk:

```text
Tyrant Blue / Red
Overlord Blue / Red
```

---

# Keyboard Hotkeys

Hotkey hanya berjalan pada `IN-GAME MODE`.

```text
Q          → Blue Kill +1
E          → Red Kill +1

A          → Gold +200 Blue
D          → Gold +200 Red

Shift + A  → Gold +500 Blue
Shift + D  → Gold +500 Red

Z          → Blue Tyrant +1
X          → Red Tyrant +1

C          → Blue Overlord +1
V          → Red Overlord +1

Space      → Start / Pause Game Timer
T          → Reset Game Timer
R          → Reset semua In-Game Stats
```

Proteksi hotkey:

- Tidak berjalan saat operator mengetik pada `input`.
- Tidak berjalan pada search.
- Tidak berjalan pada `textarea`.
- Tidak berjalan pada `select`.
- Tidak berjalan pada `contenteditable`.
- Tidak berjalan ketika Visual Picker terbuka.
- Key repeat dari tombol yang ditahan diabaikan.
- Setiap aksi memberikan visual feedback singkat.

---

# Foto Player

Foto player diupload dari `control.html`.

Foto disimpan sebagai base64 terkompresi dalam state browser.

Foto adalah bagian dari setup event/series dan tidak dihapus oleh:

```text
Reset Draft
Reset In-Game
Reset Match
Reset Series
```

Foto hanya ikut terhapus ketika:

```text
Reset Event / Clear All
```

Pada Draft Overlay:

```text
Belum pick
→ foto player tampil

Sedang picking
→ foto player fade out
→ hero animation tampil

Locked
→ hero tetap tampil
→ nama player tetap tampil
```

---

# Assets

Production project membawa:

```text
120 hero icons
120 hero portraits
118 item icons
```

Hero source-key/pinyin hanya metadata internal. Operator memakai nama Global/English.

---

# Catatan localStorage dan HP

`127.0.0.1` selalu menunjuk perangkat yang sedang membuka browser.

Control di HP dan OBS di PC tidak berbagi `localStorage` yang sama.

Untuk baseline project ini, konfigurasi paling stabil tetap:

```text
Control → OBS Custom Browser Dock
Draft   → OBS Browser Source
InGame  → OBS Browser Source
```

Jika suatu hari control harus benar-benar dijalankan dari HP/tablet ke OBS PC secara realtime, diperlukan transport jaringan seperti WebSocket/local bridge.

---

# Asset Sources

Referensi asset yang digunakan selama pembangunan project:

```text
Official HoK Camp / IP Library:
https://reurl.cc/r3vnNx

Large HoK material pack:
https://github.com/lengyibai/wzry-material

Liquipedia Honor of Kings:
https://liquipedia.net/honorofkings/Portal:Heroes
```

Production build tidak membawa seluruh raw repository. Hanya asset hero/item yang diperlukan runtime yang sudah dikurasi ke folder `assets/`.

Lane filter operator menggunakan terminologi Global:

```text
Clash Lane
Mid Lane
Roam
Farm Lane
Jungle
```

Hero fleksibel disimpan menggunakan array `positions` agar dapat muncul di lebih dari satu filter.

Referensi audit posisi Global/international yang digunakan pada revisi ini:

```text
Official Honor of Kings Global:
https://www.honorofkings.com/

Current international-server lane references:
https://hokstats.gg/tier-list/clash-lane/
https://hokstats.gg/tier-list/jungle/
https://hokstats.gg/tier-list/mid/
https://hokstats.gg/tier-list/farm/
https://hokstats.gg/tier-list/roam/
```


# Test Checklist

```text
[ ] BO1 score maksimal 1
[ ] BO3 score maksimal 2
[ ] BO5 score maksimal 3

[ ] Hero filter hanya 5 lane
[ ] Augran muncul di Jungle
[ ] Multi-position filter bekerja

[ ] Foto player tampil sebelum pick
[ ] Pilih hero → foto player hilang
[ ] Hero animation 0.65s
[ ] Active pick sedikit melebar
[ ] LOCK bekerja
[ ] UNLOCK bekerja

[ ] Reset Draft tidak menghapus setup
[ ] Reset In-Game tidak menghapus setup
[ ] Reset Match mempertahankan series score
[ ] Reset Series membuat score 0-0
[ ] Reset Event menghapus seluruh setup

[ ] Q/E kills
[ ] A/D gold ±200
[ ] Shift+A/D gold ±500
[ ] Z/X Tyrant
[ ] C/V Overlord
[ ] Space timer
[ ] T reset timer
[ ] R reset in-game

[ ] Hotkey tidak aktif saat mengetik nama player
[ ] Hotkey tidak aktif saat mengetik team name
[ ] Hotkey tidak aktif pada hero/item search

[ ] Draft Browser Source transparan
[ ] In-Game Browser Source transparan
```

---

# Player Photo Framing

Player photo sekarang dirender sebagai image layer, bukan `background-size: cover`.

Runtime menggunakan:

```css
object-fit: contain;
object-position: center bottom;
```

State player sekarang backward-compatible dengan:

```js
{
  name: "",
  photo: "",
  photoScale: 1,
  photoOffsetY: 0
}
```

Control menyediakan adjustment per player:

- Scale: 85% sampai 130%.
- Vertical offset: -20% sampai +20%.
- Reset Frame.
- Clear Photo.

Recommended source:

```text
Aspect ratio : 9:16
Resolution   : 1080×1920 source
Pose         : head to waist
Headroom     : 8–12%
Format       : PNG / WebP
Background   : transparent preferred
```

Upload dikompresi secara internal ke ukuran maksimum 540×960 WebP agar cukup tajam untuk card draft tetapi lebih aman terhadap quota localStorage.

# HCI Visual Theme

Seluruh control, draft display, dan in-game display sekarang memakai satu design language HCI:

- dark navy/black competitive surface;
- cyan/blue technical accents;
- red side accent;
- gold status accent;
- thin borders dan restrained glow;
- lebih angular/compact dibanding versi awal;
- visual picker mengikuti skin yang sama.

Layout fungsi tidak berubah dan state key tetap:

```text
hok_draft_state_v1
```

