# Quick Start: Publishing BarSwap

**Complete checklist for publishing your extension to Chrome Web Store**

## Prerequisites ✓

- [ ] Register as Chrome Web Store Developer ($5 one-time fee)
- [ ] Have a Google Cloud Console account
- [ ] Extension is built and tested locally

## Step 1: Build Extension

```bash
npm run build
```

This creates the `dist/` folder with your production extension.

## Step 2: Create ZIP Package

1. Open the `dist/` folder
2. Select **ALL** files and folders inside (not the `dist` folder itself)
3. Right-click → "Send to" → "Compressed (zipped) folder"
4. Name it `barswap-2.0.0.zip`

## Step 3: Create Promotional Images

### Small Tile (440x280)
1. Open `promotional/small-tile.html` in Chrome
2. Press F12, then Ctrl+Shift+M
3. Set size to 440 x 280
4. Right-click purple tile → "Capture node screenshot"
5. Save as `small-tile-440x280.png`

### Marquee (1400x560)
1. Open `promotional/marquee.html` in Chrome
2. Press F12, then Ctrl+Shift+M
3. Set size to 1400 x 560
4. Right-click banner → "Capture node screenshot"
5. Save as `marquee-1400x560.png`

## Step 4: Take Extension Screenshots

Open your extension and capture these screenshots (1280x800 or 640x400):

1. **Main view (Light mode)** - Bookmark bars list
2. **Main view (Dark mode)** - Same view, dark theme
3. **Create bar** - "Create New Bar Set" section
4. **Backup panel** - Google Drive & Local Storage options
5. **Active bar** - Multiple bars with one active

**How to capture**:
- Load extension in Chrome
- Press `Windows Key + Shift + S` (Snipping Tool)
- Capture and save as PNG

Create a `screenshots/` folder for these.

## Step 5: Submit to Chrome Web Store

### A. Upload Extension
1. Go to https://chrome.google.com/webstore/devconsole
2. Click "New Item"
3. Upload `barswap-2.0.0.zip`

### B. Fill Out Listing

**Product Details**:
```
Name: BarSwap
Summary: Instantly switch between multiple bookmark bar sets
Category: Productivity
Language: English
```

**Description**:
```
BarSwap lets you manage multiple bookmark bars and switch between them instantly. Perfect for organizing bookmarks by project, workflow, or context.

Features:
• Create multiple bookmark bar sets
• Switch between bars with keyboard shortcuts (Ctrl+Up/Down)
• Direct shortcuts for bars 1-10 (Ctrl+Shift+1 through 0)
• Drag-and-drop reordering
• Google Drive backup and sync
• Dark mode support
• Works with Chrome and Opera

Use Cases:
• Separate work and personal bookmarks
• Different bars for different projects
• Context-specific link collections
• Clean, focused bookmark organization

The extension includes sync corruption prevention and automatic backups to keep your bookmarks safe.
```

**Privacy**:
```
Single purpose: Switch between multiple bookmark bars

Permissions justification:
- bookmarks: Required to read and organize bookmark bars
- storage: Required to save bar configurations and active state
- identity: Required for Google Drive backup authentication
- webNavigation: Required for Opera workspace detection

Remote code: No
Data collection: None (unless user enables Drive backup)
```

### C. Upload Assets
- **Icon**: `public/icons/icon128.png`
- **Screenshots**: Your 5 extension screenshots
- **Small tile**: `small-tile-440x280.png`
- **Marquee**: `marquee-1400x560.png`

### D. Submit for Review
Click "Submit for Review" - typically takes 1-3 days

## Step 6: Update OAuth (After Approval)

Once published, you'll get a permanent extension ID:

1. Copy extension ID from dashboard
2. Go to https://console.cloud.google.com/
3. Navigate to "APIs & Services" > "Credentials"
4. Edit your OAuth 2.0 Client
5. Add redirect URI:
   ```
   https://<YOUR-EXTENSION-ID>.chromiumapp.org/
   ```
6. Save

## Step 7: Setup Automated Publishing (Optional)

For future updates, automate publishing:

1. Copy `.env.example` to `.env`
2. Fill in credentials (see PUBLISHING.md for details)
3. For updates, just run:
   ```bash
   npm run build && npm run release
   ```

## Troubleshooting

**OAuth error after moving to new computer?**
- This is why we're publishing! Once published, you get a stable extension ID

**Upload rejected?**
- Check that ZIP contains dist/ contents, not dist/ folder itself
- Verify manifest.json is valid
- Ensure version number increases

**Need help?**
- See full guide: `PUBLISHING.md`
- Chrome Web Store Docs: https://developer.chrome.com/docs/webstore/

---

**That's it! 🎉**

Your extension will be live on the Chrome Web Store after review approval.
