/**
 * Check if Chrome bookmark sync is enabled.
 * Tries the Chrome 138+ syncing property first, falls back to chrome.identity API.
 * @returns true if sync is enabled, false otherwise
 */
export async function isSyncEnabled(): Promise<boolean> {
    try {
        const tree = await chrome.bookmarks.getTree();
        if (tree.length > 0 && 'syncing' in tree[0]) {
            return (tree[0] as any).syncing === true;
        }
    } catch (error) {
        console.log('Chrome 138+ syncing property not available, falling back to identity API');
    }

    try {
        const userInfo = await chrome.identity.getProfileUserInfo({ accountStatus: chrome.identity.AccountStatus.SYNC });
        return userInfo.email !== undefined && userInfo.email !== '';
    } catch (error) {
        console.error('Failed to detect sync status:', error);
        return false;
    }
}

/**
 * Register a callback for sync status changes.
 * @param callback - Function to call when sign-in state changes
 */
export function onSyncStatusChanged(callback: (account: chrome.identity.AccountInfo) => void): void {
    if (chrome.identity.onSignInChanged) {
        chrome.identity.onSignInChanged.addListener(callback);
    }
}
