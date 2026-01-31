/**
 * OAuth 2.0 handler with fallback for non-Google Chromium browsers
 * Supports both chrome.identity (Chrome with Google sign-in) and web-based OAuth flow
 */

import { OAUTH_CONFIG } from './oauth-config.ts';

// Chrome Extension OAuth client (for chrome.identity API)
const CHROME_EXTENSION_CLIENT_ID = OAUTH_CONFIG.CHROME_EXTENSION_CLIENT_ID;

// Web Application OAuth client (for web-based OAuth popup in Comet/other browsers)
const WEB_APP_CLIENT_ID = OAUTH_CONFIG.WEB_APP_CLIENT_ID;
const WEB_APP_CLIENT_SECRET = OAUTH_CONFIG.WEB_APP_CLIENT_SECRET;

const OAUTH_SCOPES = ['https://www.googleapis.com/auth/drive.appdata'];

/**
 * Get the appropriate OAuth client ID based on authentication method
 */
function getClientId(useChromeIdentity: boolean): string {
    return useChromeIdentity ? CHROME_EXTENSION_CLIENT_ID : WEB_APP_CLIENT_ID;
}

/**
 * Get the OAuth redirect URI for this extension
 */
function getRedirectUri(): string {
    // Try chrome.identity.getRedirectURL first (works in Chrome with identity API)
    if (chrome.identity?.getRedirectURL) {
        return chrome.identity.getRedirectURL();
    }
    
    // Fallback: construct from extension ID
    const extensionId = chrome.runtime.id;
    if (!extensionId) {
        throw new Error('Unable to determine extension ID');
    }
    
    return `https://${extensionId}.chromiumapp.org/`;
}

interface TokenData {
    accessToken: string;
    refreshToken?: string;
    expiresAt: number;
}

/**
 * Check if chrome.identity API is available and working
 */
async function isChromeIdentityAvailable(): Promise<boolean> {
    if (!chrome.identity?.getAuthToken) {
        return false;
    }
    
    try {
        // Try to get a token non-interactively to check if user is signed in
        const result = await chrome.identity.getAuthToken({ interactive: false });
        const token = typeof result === 'string' ? result : result?.token;
        
        if (token) {
            // Clear the token immediately - we're just testing
            await chrome.identity.removeCachedAuthToken({ token });
            return true;
        }
        return false;
    } catch (error) {
        // If error contains "not signed in", chrome.identity won't work
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('not signed in') || errorMessage.includes('user is not signed in')) {
            return false;
        }
        // Other errors might be temporary, so assume it could work
        return true;
    }
}

/**
 * Get access token using chrome.identity (Chrome with Google sign-in)
 */
async function getTokenViaChromeIdentity(interactive: boolean): Promise<string | undefined> {
    try {
        const result = await chrome.identity.getAuthToken({ interactive });
        return typeof result === 'string' ? result : result?.token;
    } catch (error) {
        console.error('chrome.identity.getAuthToken failed:', error);
        return undefined;
    }
}

/**
 * Get access token using web-based OAuth flow (works in any Chromium browser)
 */
async function getTokenViaWebAuth(interactive: boolean): Promise<TokenData | undefined> {
    if (!interactive) {
        // Try to get stored token
        const stored = await chrome.storage.local.get(['googleAuth']);
        if (stored.googleAuth) {
            const tokenData: TokenData = stored.googleAuth;
            
            // Check if token is expired
            if (tokenData.expiresAt > Date.now()) {
                return tokenData;
            }
            
            // Try to refresh if we have a refresh token
            if (tokenData.refreshToken) {
                const refreshed = await refreshAccessToken(tokenData.refreshToken);
                if (refreshed) {
                    return refreshed;
                }
            }
        }
        return undefined;
    }
    
    // Interactive flow - open OAuth popup
    return new Promise((resolve, reject) => {
        const authUrl = buildAuthUrl();
        
        // Create a popup window for OAuth
        chrome.windows.create({
            url: authUrl,
            type: 'popup',
            width: 500,
            height: 600,
        }, (window) => {
            if (!window?.id) {
                reject(new Error('Failed to create OAuth window'));
                return;
            }
            
            const windowId = window.id;
            const redirectUri = getRedirectUri();
            let handledCallback = false;
            
            // Listen for navigation to the callback URL
            const listener = (details: chrome.webNavigation.WebNavigationParentedCallbackDetails) => {
                console.log('OAuth navigation detected:', details.url);
                
                // Only handle navigation in our OAuth window
                if (!details.url.startsWith(redirectUri)) {
                    return;
                }
                
                // Prevent handling the same callback multiple times
                if (handledCallback) {
                    return;
                }
                handledCallback = true;
                
                console.log('OAuth callback URL matched:', details.url);
                
                // Extract the authorization code
                const url = new URL(details.url);
                const code = url.searchParams.get('code');
                const error = url.searchParams.get('error');
                
                // Clean up listeners first
                chrome.webNavigation.onBeforeNavigate.removeListener(listener);
                chrome.windows.onRemoved.removeListener(onRemoved);
                
                // Close the window
                chrome.windows.remove(windowId).catch(() => {
                    // Window might already be closed, ignore error
                });
                
                if (error) {
                    console.error('OAuth error:', error);
                    reject(new Error(`OAuth error: ${error}`));
                    return;
                }
                
                if (!code) {
                    console.error('No authorization code in URL');
                    reject(new Error('No authorization code received'));
                    return;
                }
                
                console.log('Exchanging authorization code for tokens...');
                // Exchange code for tokens
                exchangeCodeForTokens(code)
                    .then(resolve)
                    .catch(reject);
            };
            
            // Handle window close
            const onRemoved = (closedWindowId: number) => {
                if (closedWindowId === windowId && !handledCallback) {
                    chrome.windows.onRemoved.removeListener(onRemoved);
                    chrome.webNavigation.onBeforeNavigate.removeListener(listener);
                    reject(new Error('OAuth window closed by user'));
                }
            };
            
            chrome.webNavigation.onBeforeNavigate.addListener(listener);
            chrome.windows.onRemoved.addListener(onRemoved);
        });
    });
}

/**
 * Build OAuth authorization URL
 */
function buildAuthUrl(): string {
    const params = new URLSearchParams({
        client_id: WEB_APP_CLIENT_ID,
        redirect_uri: getRedirectUri(),
        response_type: 'code',
        scope: OAUTH_SCOPES.join(' '),
        access_type: 'offline', // Request refresh token
        prompt: 'consent', // Force consent to get refresh token
    });
    
    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

/**
 * Exchange authorization code for access and refresh tokens
 */
async function exchangeCodeForTokens(code: string): Promise<TokenData> {
    const response = await fetch('https://oauth2.googleapis.com/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            code,
            client_id: WEB_APP_CLIENT_ID,
            client_secret: WEB_APP_CLIENT_SECRET,
            redirect_uri: getRedirectUri(),
            grant_type: 'authorization_code',
        }).toString(),
    });
    
    if (!response.ok) {
        const error = await response.text();
        throw new Error(`Failed to exchange code for tokens: ${error}`);
    }
    
    const data = await response.json();
    
    const tokenData: TokenData = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token,
        expiresAt: Date.now() + (data.expires_in * 1000),
    };
    
    // Store tokens
    await chrome.storage.local.set({ googleAuth: tokenData });
    
    return tokenData;
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken(refreshToken: string): Promise<TokenData | undefined> {
    try {
        const response = await fetch('https://oauth2.googleapis.com/token', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: new URLSearchParams({
                refresh_token: refreshToken,
                client_id: WEB_APP_CLIENT_ID,
                client_secret: WEB_APP_CLIENT_SECRET,
                grant_type: 'refresh_token',
            }).toString(),
        });
        
        if (!response.ok) {
            console.error('Failed to refresh token');
            return undefined;
        }
        
        const data = await response.json();
        
        const tokenData: TokenData = {
            accessToken: data.access_token,
            refreshToken, // Keep the same refresh token
            expiresAt: Date.now() + (data.expires_in * 1000),
        };
        
        // Update stored tokens
        await chrome.storage.local.set({ googleAuth: tokenData });
        
        return tokenData;
    } catch (error) {
        console.error('Error refreshing token:', error);
        return undefined;
    }
}

/**
 * Get access token with automatic fallback
 * Tries chrome.identity first, falls back to web OAuth if needed
 */
export async function getAccessToken(interactive: boolean): Promise<string | undefined> {
    // First, check if we should use chrome.identity or web auth
    const useChromeIdentity = await isChromeIdentityAvailable();
    
    if (useChromeIdentity) {
        console.log('Using chrome.identity for authentication');
        const token = await getTokenViaChromeIdentity(interactive);
        if (token) {
            return token;
        }
    }
    
    // Fallback to web-based OAuth
    console.log('Using web-based OAuth for authentication');
    const tokenData = await getTokenViaWebAuth(interactive);
    return tokenData?.accessToken;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
    const token = await getAccessToken(false);
    return token !== undefined;
}

/**
 * Sign out and clear all stored tokens
 */
export async function signOut(): Promise<void> {
    // Clear web auth tokens
    await chrome.storage.local.remove(['googleAuth', 'driveConnected']);
    
    // Clear chrome.identity tokens if available
    if (chrome.identity?.getAuthToken) {
        try {
            const result = await chrome.identity.getAuthToken({ interactive: false });
            const token = typeof result === 'string' ? result : result?.token;
            if (token) {
                await chrome.identity.removeCachedAuthToken({ token });
            }
        } catch (error) {
            // Ignore errors during sign out
        }
    }
}

/**
 * Get authentication method being used
 */
export async function getAuthMethod(): Promise<'chrome.identity' | 'web-oauth' | 'none'> {
    const useChromeIdentity = await isChromeIdentityAvailable();
    if (useChromeIdentity) {
        return 'chrome.identity';
    }
    
    const stored = await chrome.storage.local.get(['googleAuth']);
    if (stored.googleAuth) {
        return 'web-oauth';
    }
    
    return 'none';
}
