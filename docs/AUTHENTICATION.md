# Authentication System

## Overview

Bookmark Bar Switcher Plus uses a **hybrid OAuth 2.0 authentication system** that works in both Google Chrome (with Google profile sign-in) and non-Google Chromium browsers like Perplexity Comet.

## How It Works

The extension automatically detects which authentication method to use:

### 1. Chrome Identity API (Chrome with Google Sign-in)
- **When**: Browser is signed into a Google account (Chrome profile)
- **How**: Uses `chrome.identity.getAuthToken()` for seamless authentication
- **Advantages**: No popup, instant authentication, uses browser's existing Google session

### 2. Web-Based OAuth 2.0 (All Chromium Browsers)
- **When**: Browser is NOT signed into Google (e.g., Comet, ungoogled-chromium)
- **How**: Opens OAuth popup window for explicit Google sign-in
- **Advantages**: Works in any Chromium browser, doesn't require browser-level Google account
- **Token Storage**: Stores access and refresh tokens in `chrome.storage.local`

## Authentication Flow

```
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Sign in with Google"                           │
└─────────────────┬───────────────────────────────────────────┘
                  │
                  ▼
┌─────────────────────────────────────────────────────────────┐
│ Check if chrome.identity is available                       │
└─────────────────┬───────────────────────────────────────────┘
                  │
        ┌─────────┴─────────┐
        │                   │
        ▼                   ▼
┌──────────────┐    ┌──────────────────┐
│ Chrome       │    │ Web OAuth        │
│ Identity     │    │ Flow             │
│ (if signed   │    │ (fallback)       │
│  into Chrome)│    │                  │
└──────┬───────┘    └────────┬─────────┘
       │                     │
       │                     ▼
       │            ┌──────────────────┐
       │            │ Open OAuth popup │
       │            │ window           │
       │            └────────┬─────────┘
       │                     │
       │                     ▼
       │            ┌──────────────────┐
       │            │ User authorizes  │
       │            │ in Google        │
       │            └────────┬─────────┘
       │                     │
       │                     ▼
       │            ┌──────────────────┐
       │            │ Exchange code    │
       │            │ for tokens       │
       │            └────────┬─────────┘
       │                     │
       └─────────┬───────────┘
                 │
                 ▼
┌─────────────────────────────────────────────────────────────┐
│ Store tokens & mark as connected                            │
└─────────────────────────────────────────────────────────────┘
```

## Token Management

### Access Tokens
- **Lifetime**: 1 hour (3600 seconds)
- **Storage**: `chrome.storage.local` (for web OAuth) or Chrome's identity cache (for chrome.identity)
- **Refresh**: Automatically refreshed when expired

### Refresh Tokens
- **Lifetime**: Long-lived (until revoked)
- **Storage**: `chrome.storage.local.googleAuth.refreshToken`
- **Purpose**: Obtain new access tokens without re-authentication

### Token Refresh Flow
```javascript
// Automatic refresh when access token expires
if (tokenData.expiresAt < Date.now()) {
    if (tokenData.refreshToken) {
        const newToken = await refreshAccessToken(tokenData.refreshToken);
        // Use new token for API calls
    }
}
```

## Google Cloud Setup

### Prerequisites

1. **Google Cloud Project**
   - Create at https://console.cloud.google.com/

2. **Enable Google Drive API**
   - Navigate to: APIs & Services > Library
   - Search: "Google Drive API"
   - Click: Enable

3. **OAuth Consent Screen**
   - Navigate to: APIs & Services > OAuth consent screen
   - User Type: External
   - App Information:
     - App name: "Bookmark Bar Switcher Plus"
     - User support email: Your email
     - Developer contact: Your email
   - Scopes:
     - `https://www.googleapis.com/auth/drive.appdata`
   - Test users: Add your Google account (if in testing mode)

4. **OAuth 2.0 Client ID**
   - Navigate to: APIs & Services > Credentials
   - Click: Create Credentials > OAuth client ID
   - Application type: **Chrome Extension**
   - Item ID: Your extension ID (from `chrome://extensions`)
     - For unpacked: Copy ID from Chrome extensions page
     - For published: Use Chrome Web Store ID
   - Copy the Client ID

5. **Update Extension**
   - Edit `src/background/oauth.ts`
   - Replace `OAUTH_CLIENT_ID` with your Client ID
   - Rebuild: `npm run build`

### Scopes Used

| Scope | Purpose | Why Needed |
|-------|---------|------------|
| `https://www.googleapis.com/auth/drive.appdata` | Access app-specific folder in Google Drive | Store backup files in hidden `appDataFolder` that only this extension can access |

## Security Considerations

### Token Storage
- **Web OAuth tokens**: Stored in `chrome.storage.local` (encrypted by browser)
- **Chrome Identity tokens**: Managed by Chrome's identity system
- **No sensitive data**: Only OAuth tokens, no passwords

### Token Revocation
- User can revoke access at: https://myaccount.google.com/permissions
- Extension provides "Disconnect" button to clear local tokens

### HTTPS Only
- All OAuth flows use HTTPS
- Google OAuth endpoints are secure
- Extension uses secure redirect URIs

## Browser Compatibility

| Browser | Authentication Method | Notes |
|---------|----------------------|-------|
| Google Chrome (signed in) | chrome.identity | Seamless, no popup |
| Google Chrome (not signed in) | Web OAuth | Popup required |
| Perplexity Comet | Web OAuth | Popup required |
| Microsoft Edge | chrome.identity or Web OAuth | Depends on Microsoft account sign-in |
| Brave | Web OAuth | Popup required |
| Ungoogled Chromium | Web OAuth | Popup required |
| Any Chromium browser | Web OAuth (fallback) | Always works |

## Testing

### Test in Chrome (with Google sign-in)
1. Sign into Chrome with your Google account
2. Load extension
3. Click "Sign in with Google"
4. Should authenticate instantly without popup

### Test in Comet (or any non-Google browser)
1. Open Comet browser
2. Load extension
3. Click "Sign in with Google"
4. OAuth popup should open
5. Sign in with Google account
6. Authorize the extension
7. Popup closes, extension shows "Connected"

### Verify Token Storage
```javascript
// In browser console
chrome.storage.local.get(['googleAuth'], (result) => {
    console.log('Stored auth:', result.googleAuth);
    // Should show: { accessToken, refreshToken, expiresAt }
});
```

## Troubleshooting

### "Failed to get auth token" Error
- **Chrome**: Make sure you're signed into Chrome with a Google account
- **Other browsers**: This is expected, web OAuth will be used automatically

### OAuth Popup Blocked
- Check browser's popup blocker settings
- Allow popups for the extension

### "User is not signed in" Error
- This error triggers the fallback to web OAuth
- No action needed, extension will handle it automatically

### Token Expired
- Extension automatically refreshes tokens
- If refresh fails, user will need to sign in again

### Disconnect Not Working
- Clear browser data: `chrome.storage.local.clear()`
- Revoke access: https://myaccount.google.com/permissions

## API Reference

### `getAccessToken(interactive: boolean)`
Get an access token using hybrid authentication.

```typescript
const token = await getAccessToken(true); // Interactive (show UI if needed)
const token = await getAccessToken(false); // Silent (use cached token)
```

### `isAuthenticated()`
Check if user is authenticated.

```typescript
const authenticated = await isAuthenticated();
if (authenticated) {
    // User is signed in
}
```

### `signOut()`
Sign out and clear all stored tokens.

```typescript
await signOut();
// All tokens cleared
```

### `getAuthMethod()`
Get the current authentication method.

```typescript
const method = await getAuthMethod();
// Returns: 'chrome.identity' | 'web-oauth' | 'none'
```

## Implementation Details

### Files Modified
- `src/background/oauth.ts` - New hybrid OAuth handler
- `src/background/drive.ts` - Updated to use new OAuth system
- `src/background/main.ts` - Added message handlers for popup communication
- `src/components/DriveBackup.vue` - Updated UI for new auth flow
- `src/manifest.ts` - OAuth2 configuration

### Storage Keys
- `googleAuth` - Web OAuth token data
  ```typescript
  {
    accessToken: string;
    refreshToken?: string;
    expiresAt: number; // Unix timestamp
  }
  ```
- `driveConnected` - Boolean flag for connection status
- `driveAutoBackup` - Boolean flag for auto-backup setting
- `lastDriveBackup` - ISO timestamp of last backup

## Migration from Old System

If you were using the old Chrome-only authentication:
1. Existing users in Chrome will continue to work seamlessly
2. Extension will automatically detect and use chrome.identity
3. No data migration needed
4. Tokens are managed by Chrome's identity system

For new installations or non-Chrome browsers:
1. Web OAuth will be used automatically
2. User will see "Sign in with Google" button
3. First-time authorization required
4. Tokens stored in chrome.storage.local
