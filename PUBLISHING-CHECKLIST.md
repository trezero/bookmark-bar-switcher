# Publishing Checklist for Chrome Web Store

**Complete step-by-step checklist for publishing BarSwap**

---

## Phase 1: Preparation

### Developer Account
- [ ] Register at https://chrome.google.com/webstore/devconsole
- [ ] Pay $5 one-time developer fee
- [ ] Accept developer agreement

### Build Extension
- [ ] Run `npm run build`
- [ ] Test extension in Chrome by loading `dist/` folder
- [ ] Verify all features work correctly

---

## Phase 2: Create Assets

### Package Extension
**Option A - Automated Script:**
- [ ] Run `package-extension.bat`
- [ ] Find ZIP in `releases/` folder

**Option B - Manual:**
- [ ] Open `dist/` folder
- [ ] Select all files inside (not the dist folder itself)
- [ ] Right-click → "Send to" → "Compressed (zipped) folder"
- [ ] Name it `barswap-2.0.0.zip`

### Promotional Images
- [ ] Open `promotional/small-tile.html` in Chrome
  - [ ] Press F12 → Ctrl+Shift+M
  - [ ] Set to 440 x 280
  - [ ] Capture node screenshot
  - [ ] Save as `small-tile-440x280.png`

- [ ] Open `promotional/marquee.html` in Chrome
  - [ ] Press F12 → Ctrl+Shift+M
  - [ ] Set to 1400 x 560
  - [ ] Capture node screenshot
  - [ ] Save as `marquee-1400x560.png`

### Extension Screenshots
Take 5 screenshots of your extension (see `screenshots/README.md`):
- [ ] Main view - Light mode (1280x800 or 640x400)
- [ ] Main view - Dark mode
- [ ] Active bar highlighted
- [ ] Backup panel open
- [ ] Create new bar in action

**How to capture:**
- Load extension, press Windows+Shift+S, capture popup area

---

## Phase 3: Submit to Chrome Web Store

### Upload to Dashboard
- [ ] Go to https://chrome.google.com/webstore/devconsole
- [ ] Click "New Item"
- [ ] Upload your ZIP file
- [ ] Wait for upload to complete

### Fill Out Store Listing

#### Product Details
- [ ] App name: `BarSwap`
- [ ] Summary: `Instantly switch between multiple bookmark bar sets`
- [ ] Category: `Productivity`
- [ ] Language: `English`
- [ ] Description: (Copy from `package.json` or use provided template)

#### Privacy Practices
- [ ] Single purpose: `Switch between multiple bookmark bars`
- [ ] Permissions justification:
  ```
  - bookmarks: Required to read and organize bookmark bars
  - storage: Required to save bar configurations and active state
  - identity: Required for Google Drive backup authentication
  - webNavigation: Required for Opera workspace detection
  ```
- [ ] Remote code: `No`
- [ ] Data handling: `No user data collected (unless using Drive backup)`

#### Store Assets
- [ ] Icon: Upload `public/icons/icon128.png`
- [ ] Screenshots: Upload your 5 extension screenshots
- [ ] Small promotional tile: Upload `small-tile-440x280.png`
- [ ] Marquee promotional image: Upload `marquee-1400x560.png`

#### Distribution
- [ ] Visibility: `Public` (or `Unlisted` if you prefer)
- [ ] Regions: `All regions` (or select specific ones)

### Submit
- [ ] Review all information
- [ ] Click "Submit for Review"
- [ ] Wait for approval (typically 1-3 days)

---

## Phase 4: Post-Approval

### Update OAuth Configuration
- [ ] Copy extension ID from Chrome Web Store dashboard
- [ ] Go to https://console.cloud.google.com/
- [ ] Navigate to "APIs & Services" > "Credentials"
- [ ] Edit OAuth 2.0 Client ID for your extension
- [ ] Add authorized redirect URI:
  ```
  https://<YOUR-EXTENSION-ID>.chromiumapp.org/
  ```
- [ ] Save changes

### Test Published Extension
- [ ] Install extension from Chrome Web Store
- [ ] Test all features
- [ ] Test Google Drive OAuth login
- [ ] Verify keyboard shortcuts work
- [ ] Test on multiple computers

---

## Phase 5: Automated Updates (Optional)

### Setup Automated Publishing
- [ ] Copy `.env.example` to `.env`
- [ ] Get Chrome Web Store API credentials from dashboard
- [ ] Generate refresh token: `chrome-webstore-upload authorize`
- [ ] Fill in `.env` with all credentials:
  - [ ] `EXTENSION_ID`
  - [ ] `CLIENT_ID`
  - [ ] `CLIENT_SECRET`
  - [ ] `REFRESH_TOKEN`
- [ ] Test automated publishing: `npm run release`

### For Future Updates
- [ ] Update version in `package.json`
- [ ] Make your changes
- [ ] Run tests: `npm test`
- [ ] Build and publish: `npm run build && npm run release`

---

## Files Created for You

| File | Purpose |
|------|---------|
| `PUBLISHING.md` | Complete publishing guide with detailed instructions |
| `QUICK-START-PUBLISHING.md` | Quick reference for publishing process |
| `PUBLISHING-CHECKLIST.md` | This checklist |
| `.env.example` | Template for automated publishing credentials |
| `package-extension.bat` | Script to build and package extension |
| `promotional/small-tile.html` | Template for 440x280 promotional image |
| `promotional/marquee.html` | Template for 1400x560 promotional banner |
| `promotional/README.md` | Guide for creating promotional images |
| `screenshots/README.md` | Guide for taking extension screenshots |

---

## Quick Command Reference

```bash
# Build extension
npm run build

# Package extension (Windows)
package-extension.bat

# Test extension
npm test

# Publish update (after setup)
npm run release

# Generate OAuth token (one-time)
chrome-webstore-upload authorize
```

---

## Resources

- **Developer Dashboard**: https://chrome.google.com/webstore/devconsole
- **Google Cloud Console**: https://console.cloud.google.com/
- **Chrome Web Store Docs**: https://developer.chrome.com/docs/webstore/
- **Extension Best Practices**: https://developer.chrome.com/docs/extensions/mv3/

---

## Estimated Timeline

- ✅ Preparation: **30 minutes** (account setup, build extension)
- ✅ Create assets: **30 minutes** (screenshots, promotional images)
- ✅ Submit listing: **20 minutes** (fill out form, upload)
- ⏳ Review waiting: **1-3 days** (Google's review process)
- ✅ Post-approval: **15 minutes** (update OAuth, test)
- ✅ Setup automation: **15 minutes** (optional, for future updates)

**Total active time: ~2 hours**

---

## Need Help?

- **Quick questions**: See `QUICK-START-PUBLISHING.md`
- **Detailed guide**: See `PUBLISHING.md`
- **Screenshot help**: See `screenshots/README.md`
- **Promotional images**: See `promotional/README.md`
- **OAuth issues**: See "Troubleshooting" section in `PUBLISHING.md`

---

**Good luck with your submission! 🚀**
