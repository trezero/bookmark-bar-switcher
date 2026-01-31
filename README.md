
<h1 align="center">Bookmark Bar Switcher Plus</h1>

<p align="center">
    <a href="https://github.com/danielptv/bookmark-bar-switcher"><img alt="License: MIT" src="https://img.shields.io/badge/License-MIT-yellow.svg?logo=github"></a>
    <img alt="Version" src="https://img.shields.io/badge/Version-2.0.0-blue.svg">
</p>

<p align="center">
Switch between multiple bookmark bars with <strong>sync corruption prevention</strong>, <strong>automatic backups</strong>, and <strong>Google Drive integration</strong>.
</p>

<p align="center">
<em>Forked from <a href="https://github.com/danielptv/bookmark-bar-switcher">bookmark-bar-switcher</a> by Daniel Purtov</em>
</p>

<p align="center">
  <a href="https://github.com/danielptv/bookmark-bar-switcher">
    <img src="https://user-images.githubusercontent.com/93288603/230776334-b1ea8670-0f11-4c13-b87c-4fdbe125ee14.png" alt="Bookmark Bar Switcher">
  </a>
</p>

<p align="left">
  <a href="https://chrome.google.com/webstore/detail/bookmark-bar-switcher/ogcdabloogpipelcphkhajkaneclpnlk">
    <img src="https://user-images.githubusercontent.com/93288603/230715576-77cafdcb-9f4e-465d-8c81-cfb305068946.png" alt="Chrome Web Store">
  </a>
</p>

## What's New in Plus

This enhanced version adds critical features to prevent bookmark corruption and provide backup capabilities:

### 🛡️ Sync Corruption Prevention
- **Sync Detection**: Automatically detects when Chrome bookmark sync is enabled
- **Warning System**: Displays a prominent warning banner explaining the risks
- **Operation Guard**: Prevents sync-induced events from cascading during bar switches
- **Integrity Verification**: Validates bookmark positions after each switch

### 💾 Automatic Local Backups
- **Pre-Switch Snapshots**: Automatically backs up all bookmark bars before every switch
- **Backup History**: Maintains the last 5 backups for quick recovery
- **One-Click Restore**: Easily restore from any backup with a single click
- **Nested Folder Support**: Fully preserves complex bookmark folder structures

### ☁️ Google Drive Integration
- **Cloud Backup**: Store backups in your Google Drive's secure appDataFolder
- **Cross-Device Recovery**: Restore bookmarks even after reinstalling or on new devices
- **Auto-Upload**: Optional automatic upload to Drive after each bar switch
- **Smart Management**: Keeps the latest 10 backups, auto-prunes older ones

## Original Project

This extension is based on [Bookmark Bar Switcher](https://github.com/danielptv/bookmark-bar-switcher) by Daniel Purtov, which was inspired by the original [Bookmark-Bar-Switcher](https://github.com/zoeesilcock/Bookmark-Bar-Switcher) by Zoee Silcock. The original project recreated the functionality using Vue.js with TypeScript and Bootstrap for modern Chrome compatibility.

## Supported Browsers

Currently, this extension supports Chromium browsers only.

| Browser    | Support Level                                                                                    |
| ---------- | ------------------------------------------------------------------------------------------------ |
| **Chrome** | *Officially Supported* (with automated tests)                                                    |
| **Opera**  | *Officially Supported* (with automated tests)                                                    |
| **Edge**   | *Unofficially Supported* as a Chrome-compatible target (but not explicitly tested in automation) |

## How to Use

### Switch between Bookmark Bars

#### Mouse

All available bookmark bars will show up in the extension popup.
To switch between them, just click the one you would
like to switch to.

#### Keyboard Shortcuts

Alternatively, you can also switch using keyboard shortcuts. The default bindings are:

| Shortcut               | Command                             |
| ---------------------- | ----------------------------------- |
| `CTRL` + `UpArrow`     | Switch to the next bookmark bar     |
| `CTRL` + `DownArrow`   | Switch to the previous bookmark bar |
| `CTRL` + `Shift` + `1` | Switch to the first bookmark bar    |
| `CTRL` + `Shift` + `2` | Switch to the second bookmark bar   |

Additional shortcuts are available. To assign them or redefine existing shortcuts visit ***chrome://extensions/shortcuts***.

### Edit Bookmark Bars

You can add, rename, reorder and remove bookmark bars from within the extension:

* **Add:** Type the name of your new bar into the input field at the bottom and confirm with `Enter` or by clicking the ***PLUS***-button.
* **Edit:** Either use the ***EDIT***-button next to the bar you want to modify or double-click it. Type the new name and
  confirm with `Enter` or by clicking the ***SAVE***-button.
* **Reorder:** Drag the bookmark bar to its desired position with the mouse and drop it.
* **Remove:** Enter the ***EDIT*** mode and click the ***DELETE*** button.

### Backup & Restore

#### Local Backups
* **Automatic**: Backups are created automatically before every bar switch
* **Manual Backup**: Click "Create backup now" in the Backup & Restore section
* **Restore**: Click "Restore bookmarks" to view and restore from available backups

#### Google Drive Backups (Optional)
1. Click "⚙ Backup & Restore" to expand the backup section
2. Click "Connect Google Drive" and authorize the extension
3. Use "Back up now" to manually upload to Drive
4. Enable "Auto-backup to Google Drive" for automatic cloud backups
5. Use "Restore from Google Drive" to recover from cloud backups

**Note**: Google Drive backup requires OAuth2 setup. See `src/manifest.ts` for detailed setup instructions.

## How it Works

The extension exchanges the bookmarks inside the current bookmark bar with the ones within a chosen folder in the
*"Bookmark Bars"* directory.
The current bookmark bar will be backed up to a folder in *"Bookmark Bars"*.
The current
bookmark bar will be called ***"My first bookmark bar 🚀"*** when you first install the extension.
