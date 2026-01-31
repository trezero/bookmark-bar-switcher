/**
 * OAuth Configuration
 * 
 * Copy this file to oauth-config.ts and fill in your OAuth credentials.
 * The oauth-config.ts file is gitignored to keep your secrets safe.
 */

export const OAUTH_CONFIG = {
    // Chrome Extension OAuth client (for chrome.identity API)
    CHROME_EXTENSION_CLIENT_ID: 'YOUR_CHROME_EXTENSION_CLIENT_ID_HERE',
    
    // Web Application OAuth client (for web-based OAuth popup in Comet/other browsers)
    WEB_APP_CLIENT_ID: 'YOUR_WEB_APP_CLIENT_ID_HERE',
    WEB_APP_CLIENT_SECRET: 'YOUR_WEB_APP_CLIENT_SECRET_HERE',
};
