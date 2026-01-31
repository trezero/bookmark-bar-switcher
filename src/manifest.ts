/* eslint-disable camelcase */
/**
 * GOOGLE DRIVE OAUTH2 SETUP INSTRUCTIONS:
 * 
 * To enable Google Drive backup functionality, you need to set up OAuth2:
 * 
 * 1. Go to https://console.cloud.google.com/
 * 2. Create a new project or select an existing one
 * 3. Enable the Google Drive API:
 *    - Go to "APIs & Services" > "Library"
 *    - Search for "Google Drive API"
 *    - Click "Enable"
 * 4. Configure OAuth consent screen:
 *    - Go to "APIs & Services" > "OAuth consent screen"
 *    - Choose "External" user type
 *    - Fill in app name, user support email, and developer contact
 *    - Add the scope: https://www.googleapis.com/auth/drive.appdata
 * 5. Create OAuth 2.0 Client ID:
 *    - Go to "APIs & Services" > "Credentials"
 *    - Click "Create Credentials" > "OAuth client ID"
 *    - Application type: "Chrome Extension"
 *    - For development (unpacked extension):
 *      - Load your unpacked extension in Chrome
 *      - Copy the extension ID from chrome://extensions
 *      - Use that ID when creating the OAuth client
 *    - For production (Chrome Web Store):
 *      - Use your Chrome Web Store extension ID
 * 6. Copy the Client ID and replace 'YOUR_CLIENT_ID_HERE' below in the oauth2 section
 * 
 * Note: The extension will work without OAuth2 configured, but Google Drive backup
 * features will not be available until you complete this setup.
 */
import pkg from '../package.json' with { type: 'json' };

const icons = {
    16: 'icons/icon16.png',
    32: 'icons/icon32.png',
    48: 'icons/icon48.png',
    128: 'icons/icon128.png',
};

const manifest = {
    action: {
        default_icon: icons,
        default_popup: 'src/popup/index.html',
        default_title: pkg.displayName,
    },
    background: { service_worker: 'src/background/main.ts', type: 'module' as const },
    icons,
    commands: {
        'next-bar': {
            suggested_key: { default: 'Ctrl+Down' },
            description: 'Switch to next bookmark bar.',
        },
        'previous-bar': {
            suggested_key: { default: 'Ctrl+Up' },
            description: 'Switch to previous bookmark bar.',
        },
        'switch-to-1': {
            suggested_key: { default: 'Ctrl+Shift+1' },
            description: 'Switch to 1. bookmark bar.',
        },
        'switch-to-2': {
            suggested_key: { default: 'Ctrl+Shift+2' },
            description: 'Switch to 2. bookmark bar.',
        },
        'switch-to-3': { description: 'Switch to 3. bookmark bar.' },
        'switch-to-4': { description: 'Switch to 4. bookmark bar.' },
        'switch-to-5': { description: 'Switch to 5. bookmark bar.' },
        'switch-to-6': { description: 'Switch to 6. bookmark bar.' },
        'switch-to-7': { description: 'Switch to 7. bookmark bar.' },
        'switch-to-8': { description: 'Switch to 8. bookmark bar.' },
        'switch-to-9': { description: 'Switch to 9. bookmark bar.' },
        'switch-to-10': { description: 'Switch to 10. bookmark bar.' },
    },
    oauth2: {
        client_id: '919329643472-lq45hgd7kmuv5oeorcd76ippkbcikuel.apps.googleusercontent.com',
        scopes: ['https://www.googleapis.com/auth/drive.appdata'],
    },
};

export function getManifest(): chrome.runtime.ManifestV3 {
    return {
        author: { email: pkg.author.email },
        description: pkg.description,
        name: pkg.displayName,
        version: pkg.version,
        manifest_version: 3,
        permissions: ['bookmarks', 'storage', 'identity'],
        ...manifest,
    };
}
/* eslint-enable camelcase */
