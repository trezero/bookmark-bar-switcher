# Sync Corruption Prevention & Google Drive Backup

## Problem Statement

When Chrome bookmark sync is enabled, the extension's bar-switching mechanism (`exchangeBars()` in `service.ts`) performs non-atomic `chrome.bookmarks.move()` calls that get synced individually to Google's servers. This causes:

- Partial switch states propagated to other devices
- Sync-induced bookmark events triggering extension handlers during a switch, causing cascading moves
- Divergence between `chrome.storage.local` state (which bar is "active") and actual bookmark positions (which get overwritten by sync)
- Complete bookmark corruption when two devices with the extension fight over the same synced bookmark tree

## Solution Overview

Four interconnected components:

1. **Sync detection + user warning** - Detect sync and warn users before corruption happens
2. **Local backup system** - Automatic snapshots before every bar switch for immediate recovery
3. **Google Drive backup** - Cloud backup to `appDataFolder` for cross-device/reinstall recovery
4. **Operation guard** - Prevent sync-induced events from cascading during a bar switch

---

## 1. Sync Detection & Warning

### Background: How detection works

- `chrome.identity.getProfileUserInfo()` with default `accountStatus: "SYNC"` returns a non-empty email when sync is enabled. Requires the `identity` permission.
- Chrome 138+ exposes a `syncing` boolean on bookmark nodes via the `chrome.bookmarks` API. This is more direct but not yet available to all users.
- Both can be used: try the `syncing` property first (no extra permission needed), fall back to `chrome.identity`.

### Checklist

- [x] Add `"identity"` to the `permissions` array in `src/manifest.ts`
- [x] Create `src/background/sync-detection.ts` with:
  - [x] `isSyncEnabled(): Promise<boolean>` - checks bookmark node `syncing` property first (Chrome 138+), falls back to `chrome.identity.getProfileUserInfo()` with default SYNC accountStatus, returns `true` if email is non-empty
  - [x] `onSyncStatusChanged(callback)` - uses `chrome.identity.onSignInChanged` listener to react to sign-in state changes
- [x] Create a `SyncWarning.vue` component in `src/components/`:
  - [x] Displays a dismissible but persistent warning banner at the top of the popup when sync is detected
  - [x] Warning text explains the conflict and links to `chrome://settings/syncSetup` (note: extensions can't open `chrome://` URLs directly, so display the URL as text the user can copy/paste or navigate to manually)
  - [x] "Don't show again" option stored in `chrome.storage.local` (key: `syncWarningDismissed`)
  - [x] Warning reappears if sync status changes (was off, turned on)
- [x] Integrate `SyncWarning.vue` into `App.vue` - call `isSyncEnabled()` on popup open, conditionally render warning
- [ ] Add sync check on extension install (`main.ts` onInstalled listener) - store initial sync state (deferred - not critical for MVP)

---

## 2. Local Backup System

### Background: What gets backed up

Before every bar switch, serialize all bookmark bar data to `chrome.storage.local`. This captures folder IDs, bookmark titles, URLs, and ordering. The backup is instant, costs nothing, and enables one-click restore.

### Data structure

```typescript
interface BookmarkBackup {
  version: number;               // schema version for future migration
  timestamp: number;             // Date.now()
  extensionVersion: string;      // from package.json
  activeBarId: string;
  bars: BarSnapshot[];
}

interface BarSnapshot {
  id: string;
  title: string;
  bookmarks: BookmarkSnapshot[];
}

interface BookmarkSnapshot {
  title: string;
  url?: string;                  // undefined for folders
  children?: BookmarkSnapshot[]; // nested folders
}
```

### Checklist

- [x] Create `src/types/backup.d.ts` with the interfaces above
- [x] Create `src/background/backup.ts` with:
  - [x] `createBackup(): Promise<BookmarkBackup>` - walks all custom bars + the bookmarks bar, serializes them recursively (handles nested folders)
  - [x] `saveBackupLocal(backup: BookmarkBackup): Promise<void>` - saves to `chrome.storage.local` under key `localBackup`, also maintains `localBackupHistory` (array of last 5 backups, FIFO)
  - [x] `getLatestBackup(): Promise<BookmarkBackup | undefined>` - retrieves most recent local backup
  - [x] `getBackupHistory(): Promise<BookmarkBackup[]>` - retrieves all stored backups
  - [x] `restoreFromBackup(backup: BookmarkBackup): Promise<void>` - recreates bookmark structure from a backup snapshot:
    1. Clears current bookmarks bar contents
    2. Clears all custom bar folders under "Bookmark Bars"
    3. Recreates each bar folder with its bookmarks (recursive for nested folders)
    4. Sets the active bar from the backup
    5. Performs this with the operation guard active (see section 4) to avoid event handler interference
- [x] Integrate backup into `exchangeBars()` in `service.ts`:
  - [x] Call `createBackup()` + `saveBackupLocal()` before the move operations begin
  - [x] This is the automatic backup - happens silently on every switch
- [x] Create `Backup.vue` component in `src/components/`:
  - [x] "Restore bookmarks" button that shows a list of available local backups (timestamp + active bar name)
  - [x] Confirmation modal before restore (reuse pattern from `BookmarksBars.vue` deletion modal)
  - [x] "Create backup now" manual trigger button
- [x] Add `Backup.vue` to `App.vue` (e.g., as a collapsible section or gear/settings area in the popup)

---

## 3. Google Drive Backup

### Background: How it works

Google Drive's `appDataFolder` is a hidden, app-specific folder that users cannot see or access through the Drive UI. Only the extension that created the data can read it. This requires the `drive.appdata` OAuth2 scope (classified as non-sensitive by Google) and a Google Cloud project with the Drive API enabled.

The flow: `chrome.identity.getAuthToken()` gets an OAuth2 token -> extension calls Drive REST API directly via `fetch()` -> backup JSON files are stored in `appDataFolder`.

### Prerequisites (manual, one-time setup by the developer)

- [ ] Create a Google Cloud project (or use existing one for the extension)
- [ ] Enable the Google Drive API in the project
- [ ] Configure the OAuth consent screen (external, app name, scopes)
- [ ] Create an OAuth 2.0 Client ID of type "Chrome Extension" using the extension's ID
- [ ] Note: the Chrome Web Store ID is `ogcdabloogpipelcphkhajkaneclpnlk` - use this for the production client ID. A separate client ID is needed for development (unpacked extension has a different ID unless `key` is set in manifest)

### Checklist

- [x] Add OAuth2 configuration to `src/manifest.ts`:
  ```typescript
  oauth2: {
    client_id: 'YOUR_CLIENT_ID.apps.googleusercontent.com',
    scopes: ['https://www.googleapis.com/auth/drive.appdata']
  }
  ```
- [x] Ensure `"identity"` is in permissions (already added in section 1)
- [x] Create `src/background/drive.ts` with:
  - [x] `getAuthToken(interactive: boolean): Promise<string | undefined>` - wraps `chrome.identity.getAuthToken()`, handles token refresh via `chrome.identity.removeCachedAuthToken()` on 401 responses
  - [x] `isConnected(): Promise<boolean>` - attempts non-interactive `getAuthToken(false)` to check if user has previously authorized
  - [x] `uploadBackup(backup: BookmarkBackup): Promise<void>` - uploads backup JSON to `appDataFolder` via Drive API v3 `files.create` (multipart upload: metadata + content). File name format: `bbs-backup-{timestamp}.json`. Prunes old backups keeping the latest 10.
  - [x] `listBackups(): Promise<DriveBackupMeta[]>` - calls `files.list` with `spaces=appDataFolder`, `q="name contains 'bbs-backup'"`, returns file IDs + names + modified dates sorted newest first
  - [x] `downloadBackup(fileId: string): Promise<BookmarkBackup>` - calls `files.get` with `alt=media` to download the JSON content
  - [x] `deleteBackup(fileId: string): Promise<void>` - calls `files.delete`
  - [x] All Drive API calls use `fetch()` with `Authorization: Bearer {token}` header. Base URL: `https://www.googleapis.com/drive/v3/files` (metadata) and `https://www.googleapis.com/upload/drive/v3/files` (upload)
  - [x] Handle 401 responses by clearing cached token and retrying once
- [x] Create `DriveBackup.vue` component in `src/components/`:
  - [x] "Connect Google Drive" button - calls `getAuthToken(true)` to trigger interactive OAuth consent
  - [x] Once connected, show:
    - [x] "Back up now" button - creates local backup then uploads to Drive
    - [x] "Restore from Google Drive" - lists Drive backups, user picks one, downloads and restores
    - [x] Last backup timestamp display
    - [x] "Disconnect" option - calls `chrome.identity.removeCachedAuthToken()` and clears local connection state
  - [x] Connection status stored in `chrome.storage.local` (key: `driveConnected`)
- [x] Add auto-upload option:
  - [x] Setting in popup: "Auto-backup to Google Drive" toggle (stored in `chrome.storage.local`, key: `driveAutoBackup`)
  - [x] When enabled, after each `saveBackupLocal()` in `exchangeBars()`, also call `uploadBackup()` (fire-and-forget, don't block the switch on network I/O)
  - [x] Rate-limit uploads: skip if last Drive upload was less than 60 seconds ago (store timestamp in memory)
- [ ] First-run / install restore flow (deferred - not critical for MVP):
  - [ ] On `chrome.runtime.onInstalled` with reason `"install"`, after initial setup, check if Drive auth is possible non-interactively (`getAuthToken(false)`)
  - [ ] If the user was previously connected (same Google account), list Drive backups and surface a "Restore from previous installation?" prompt in the popup
  - [ ] Store a flag `installRestoreOffered` in `chrome.storage.local` so it only shows once
- [x] Integrate `DriveBackup.vue` into the popup alongside `Backup.vue` (same settings/backup section of the UI)

---

## 4. Operation Guard & Event Filtering

### Background: Why this is needed

When `exchangeBars()` moves bookmarks, each `chrome.bookmarks.move()` fires `onMoved` events. The extension's `handleMove` handler in `handlers.ts` reacts to these. If sync is also pushing changes simultaneously, the handlers can't distinguish extension-initiated moves from sync-initiated moves, causing cascading corruption.

### Checklist

- [x] Create `src/background/operation-lock.ts` with:
  - [x] `let operationInProgress = false`
  - [x] `acquireLock(): boolean` - sets flag to `true`, returns `false` if already locked
  - [x] `releaseLock(): void` - sets flag to `false`
  - [x] `isLocked(): boolean` - getter
- [x] Wrap `exchangeBars()` in `service.ts` with the lock:
  - [x] Call `acquireLock()` at the start, `releaseLock()` in a `finally` block
  - [x] If lock is already held, return early (prevents concurrent switches)
- [x] Update handlers in `handlers.ts`:
  - [x] In `handleMove`, `handleRemove`, and `handleChange`: if `isLocked()`, return early without processing
  - [x] This silences all bookmark event reactions during an active bar switch
- [x] Add post-switch integrity check in `exchangeBars()`:
  - [x] After both `moveBookmark()` calls complete, verify:
    1. `chrome.bookmarks.getChildren(bookmarkBarId)` returns bookmarks (bar is not empty unless the activated bar was empty)
    2. `chrome.bookmarks.getChildren(deactivatedBar.id)` contains the bookmarks that were previously on the bar
  - [x] If verification fails, log a warning and attempt restore from the backup taken at the start of the switch (section 2)
  - [x] Run the integrity check inside the lock so event handlers don't interfere

---

## 5. UI Layout Changes

### Checklist

- [x] Reorganize `App.vue` to accommodate new components. Proposed popup layout:
  ```
  ┌─────────────────────────────┐
  │ [Sync Warning Banner]       │  <- SyncWarning.vue (conditional)
  ├─────────────────────────────┤
  │ Bookmark Bars               │
  │ ┌─────────────────────────┐ │
  │ │ Bar 1 (active)          │ │  <- BookmarksBars.vue (existing)
  │ │ Bar 2                   │ │
  │ │ Bar 3                   │ │
  │ └─────────────────────────┘ │
  │ [+ Create new bar]         │  <- Create.vue (existing)
  ├─────────────────────────────┤
  │ ⚙ Backup & Restore         │  <- collapsible section
  │ ┌─────────────────────────┐ │
  │ │ [Create backup]         │ │  <- Backup.vue
  │ │ [Restore from local]    │ │
  │ │ ─────────────────────── │ │
  │ │ Google Drive: Connected  │ │  <- DriveBackup.vue
  │ │ [Back up to Drive]      │ │
  │ │ [Restore from Drive]    │ │
  │ │ □ Auto-backup to Drive  │ │
  │ └─────────────────────────┘ │
  └─────────────────────────────┘
  ```
- [x] Keep the popup width unchanged (Bootstrap handles responsiveness)
- [x] The backup section should be collapsed by default to avoid cluttering the main use case (bar switching)
- [x] Match existing Bootstrap + Bootstrap Vue Next styling patterns

---

## 6. Testing

### Checklist

- [ ] Unit tests for `backup.ts`:
  - [ ] `createBackup()` correctly serializes nested bookmark folders
  - [ ] `saveBackupLocal()` maintains FIFO history of 5
  - [ ] `restoreFromBackup()` recreates the correct structure
- [ ] Unit tests for `operation-lock.ts`:
  - [ ] Lock acquisition/release semantics
  - [ ] `exchangeBars()` respects lock
  - [ ] Handlers return early when locked
- [ ] Unit tests for `sync-detection.ts`:
  - [ ] Returns correct result based on mocked `chrome.identity` responses
- [ ] Unit tests for `drive.ts`:
  - [ ] Mock `fetch()` and `chrome.identity.getAuthToken()` calls
  - [ ] Token refresh on 401
  - [ ] Upload/list/download/delete operations
  - [ ] Backup pruning (keep 10)
- [ ] Update E2E tests in `__tests__/popup.test.ts`:
  - [ ] Verify sync warning banner appears/dismisses correctly
  - [ ] Verify backup section is accessible in popup
  - [ ] Test local backup + restore round-trip

---

## 7. Manifest & Permission Changes Summary

All changes to `src/manifest.ts`:

- [x] Add `"identity"` to `permissions` array
- [x] Add `oauth2` block with `client_id` and `scopes: ["https://www.googleapis.com/auth/drive.appdata"]`
- [ ] Consider setting a stable `key` in the manifest for consistent extension ID during development (optional - can be done when setting up OAuth)

---

## Files Created / Modified

### New files
| File | Purpose |
|------|---------|
| `src/background/sync-detection.ts` | Detect whether bookmark sync is enabled |
| `src/background/backup.ts` | Local backup create/save/restore logic |
| `src/background/drive.ts` | Google Drive API wrapper for appDataFolder |
| `src/background/operation-lock.ts` | Mutex for bar switch operations |
| `src/types/backup.d.ts` | TypeScript interfaces for backup data |
| `src/components/SyncWarning.vue` | Sync detection warning banner |
| `src/components/Backup.vue` | Local backup/restore UI |
| `src/components/DriveBackup.vue` | Google Drive backup/restore UI |

### Modified files
| File | Changes |
|------|---------|
| `src/manifest.ts` | Add `identity` permission, `oauth2` block |
| `src/background/service.ts` | Add backup + lock to `exchangeBars()` |
| `src/background/handlers.ts` | Add lock checks to event handlers |
| `src/background/main.ts` | Add install-time sync check and Drive restore prompt |
| `src/popup/App.vue` | Integrate SyncWarning, Backup, DriveBackup components |
| `src/types/bookmarks.d.ts` | May need minor additions |

---

## Implementation Order

Work through the checklist sections in this order to minimize back-tracking:

1. **Operation guard** (section 4) - small, foundational, everything else benefits from it
2. **Local backup** (section 2) - core safety net, needed before testing anything destructive
3. **Sync detection** (section 1) - uses the `identity` permission we'll need for Drive anyway
4. **Google Drive backup** (section 3) - builds on local backup + identity permission
5. **UI layout** (section 5) - integrate all new components
6. **Testing** (section 6) - validate everything end-to-end
