# Publishing Guide for BarSwap

This guide covers how to publish and update your extension on the Chrome Web Store.

## First-Time Setup

### 1. Register as Chrome Web Store Developer

1. Go to [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Sign in with your Google account
3. Pay the one-time $5 developer registration fee
4. Accept the developer agreement

### 2. Prepare Extension Package

Build the production version:

```bash
npm run build
```

Create a ZIP file of the `dist/` folder:
- Open the `dist/` folder
- Select all files and folders inside
- Right-click → "Send to" → "Compressed (zipped) folder"
- Name it `barswap-2.0.0.zip` (use your version number)

### 3. Create Promotional Images

Open these HTML files in Chrome and capture screenshots:

1. **Small Tile (440x280)**:
   - Open `promotional/small-tile.html` in Chrome
   - Follow the instructions on the page to capture
   - Save as `small-tile-440x280.png`

2. **Marquee (1400x560)**:
   - Open `promotional/marquee.html` in Chrome
   - Follow the instructions on the page to capture
   - Save as `marquee-1400x560.png`

### 4. Manual First Submission

1. Go to [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click **"New Item"**
3. Upload your ZIP file
4. Fill out the store listing:

   **Product Details:**
   - App name: `BarSwap`
   - Summary: `Instantly switch between multiple bookmark bar sets`
   - Description: See `package.json` for the full description
   - Category: `Productivity`
   - Language: `English`

   **Privacy Practices:**
   - Single purpose: "Switch between multiple bookmark bars"
   - Permissions justification:
     - `bookmarks`: Required to read and organize bookmark bars
     - `storage`: Required to save bar configurations and active state
     - `identity`: Required for Google Drive backup authentication
     - `webNavigation`: Required for Opera workspace detection
   - Remote code: `No`
   - Data handling: No user data collected (unless using Drive backup)

   **Store Listing:**
   - Icon: Upload `public/icons/icon128.png`
   - Screenshots: Upload 3-5 screenshots of your extension
   - Small tile: Upload `small-tile-440x280.png`
   - Marquee: Upload `marquee-1400x560.png`

5. Submit for review (typically takes 1-3 days)

### 5. Update OAuth Configuration

After submission, you'll receive a permanent extension ID. Update your OAuth:

1. Copy the extension ID from the Chrome Web Store dashboard
2. Go to [Google Cloud Console](https://console.cloud.google.com/)
3. Navigate to "APIs & Services" > "Credentials"
4. Edit your OAuth 2.0 Client ID
5. Under "Authorized redirect URIs", add:
   ```
   https://<YOUR-EXTENSION-ID>.chromiumapp.org/
   ```
6. Save changes

## Automated Publishing Setup (After First Submission)

### 1. Get Chrome Web Store API Access

1. Go to [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
2. Click on your profile/account settings
3. Navigate to "API access"
4. Click "Create new client ID" or use existing Google Cloud project
5. Note down your credentials

### 2. Get Refresh Token

You need to generate a refresh token using OAuth2. Here's how:

1. Install the Chrome Web Store API helper:
   ```bash
   npm install -g chrome-webstore-upload-cli
   ```

2. Generate a refresh token:
   ```bash
   chrome-webstore-upload authorize
   ```

   This will:
   - Open a browser window
   - Ask you to authorize access
   - Display your refresh token

   Copy the refresh token for the next step.

### 3. Configure Environment Variables

1. Copy the example environment file:
   ```bash
   copy .env.example .env
   ```

2. Edit `.env` and fill in your credentials:
   ```env
   EXTENSION_ID=<your-extension-id>
   CLIENT_ID=<your-client-id>.apps.googleusercontent.com
   CLIENT_SECRET=<your-client-secret>
   REFRESH_TOKEN=<your-refresh-token>
   ```

3. **IMPORTANT**: Never commit `.env` to git (it's already in `.gitignore`)

### 4. Publish Updates

After setup, publishing is simple:

```bash
# Build and publish in one command
npm run build && npm run release

# Or step by step:
npm run build
npm run release
```

The `release` script will:
- Upload the `dist/` folder
- Automatically publish to the Chrome Web Store
- Display the result

## Manual Updates

If you prefer to update manually:

1. Build your extension: `npm run build`
2. Create ZIP of `dist/` folder
3. Go to [Developer Dashboard](https://chrome.google.com/webstore/devconsole)
4. Click on your extension
5. Click "Package" tab
6. Upload new ZIP
7. Click "Submit for review"

## Versioning

Before publishing updates:

1. Update version in `package.json`:
   ```json
   {
     "version": "2.1.0"
   }
   ```

2. The manifest will automatically use this version

3. Follow [Semantic Versioning](https://semver.org/):
   - MAJOR: Breaking changes
   - MINOR: New features (backward compatible)
   - PATCH: Bug fixes

## Troubleshooting

### "Invalid refresh token"
- Regenerate refresh token: `chrome-webstore-upload authorize`
- Update `.env` with new token

### "Extension ID mismatch"
- Verify `EXTENSION_ID` in `.env` matches your dashboard

### "OAuth error 400: redirect_uri_mismatch"
- Update Google Cloud Console OAuth redirect URI
- Use: `https://<EXTENSION-ID>.chromiumapp.org/`

### Upload fails
- Check ZIP only contains `dist/` contents (not the `dist/` folder itself)
- Verify manifest.json is valid
- Check version number is higher than current published version

## Resources

- [Chrome Web Store Developer Dashboard](https://chrome.google.com/webstore/devconsole)
- [Chrome Web Store Publish Documentation](https://developer.chrome.com/docs/webstore/publish/)
- [chrome-webstore-upload-cli](https://github.com/DrewML/chrome-webstore-upload-cli)
