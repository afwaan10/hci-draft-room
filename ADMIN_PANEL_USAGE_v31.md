# Admin Panel Usage — HCI MOBA Draft Hub v31

## Open Admin Panel
Open the website path:

`/admin/`

Example:

`https://your-domain.com/admin/`

## Login
Click **Sign in with Google**.

Only admin email accounts are allowed. In this build, the default allowed admin email is:

`muhammaddeha03@gmail.com`

If you use a different Google email, update both:
- `js/admin-dashboard.js` admin email list, or `window.HCI_ADMIN_EMAILS` in config
- `firebase.rules` `adminEmail()` list

Then publish the updated Firestore rules.

## Admin Panel v1 Tools

### 1. Create Room
Choose game and session length, then click **Create Room**.
Admin becomes the host/Team A by default, so the room can be started after Team B joins.

### 2. Add Paid Credits
Enter user UID and credit amount, then click **Add Credits**.
This writes to `userAccess/{uid}`.

### 3. Game / Logo Management
Choose game, status, logo path, and description, then save.
This writes to `siteConfig/game_HOK` or `siteConfig/game_MLBB`.

### 4. Hero Management
Enter hero ID, name, lanes/roles, image path, and active/hidden status.
This writes to `heroes/{heroId}`.

### 5. Sponsor Slot
Enter sponsor slot ID, title, text, and URL.
This writes to `sponsors/{slotId}`.

### 6. Community Link
Enter link ID, label, and URL.
This writes to `communityLinks/{linkId}`.

### 7. Room Monitor
Shows recent draft rooms and their status.

## Important Notes
Admin Panel v1 can save content/config data, but some static website sections may still need future code integration before every saved config is automatically displayed everywhere.
For example, sponsor and community link configs are saved and ready, but full dynamic homepage rendering can be expanded in the next admin iteration.
