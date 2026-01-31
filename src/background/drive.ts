import { type BookmarkBackup, type DriveBackupMeta } from '~/types/backup';

const DRIVE_API_BASE = 'https://www.googleapis.com/drive/v3/files';
const DRIVE_UPLOAD_BASE = 'https://www.googleapis.com/upload/drive/v3/files';
const MAX_BACKUPS = 10;

let lastUploadTimestamp = 0;
const UPLOAD_RATE_LIMIT_MS = 60000;

/**
 * Get an OAuth2 token for Google Drive access.
 * @param interactive - Whether to show the OAuth consent screen
 * @returns The access token or undefined if not available
 */
export async function getAuthToken(interactive: boolean): Promise<string | undefined> {
    try {
        const result = await chrome.identity.getAuthToken({ interactive });
        return typeof result === 'string' ? result : result?.token;
    } catch (error) {
        console.error('Failed to get auth token:', error);
        return undefined;
    }
}

/**
 * Check if the user has previously connected Google Drive.
 * @returns true if connected, false otherwise
 */
export async function isConnected(): Promise<boolean> {
    const token = await getAuthToken(false);
    return token !== undefined;
}

/**
 * Upload a backup to Google Drive's appDataFolder.
 * @param backup - The backup to upload
 */
export async function uploadBackup(backup: BookmarkBackup): Promise<void> {
    const now = Date.now();
    if (now - lastUploadTimestamp < UPLOAD_RATE_LIMIT_MS) {
        console.log('Skipping Drive upload due to rate limit');
        return;
    }

    const token = await getAuthToken(false);
    if (!token) {
        throw new Error('Not authenticated with Google Drive');
    }

    const fileName = `bbs-backup-${backup.timestamp}.json`;
    const metadata = {
        name: fileName,
        mimeType: 'application/json',
        parents: ['appDataFolder'],
    };

    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const multipartRequestBody =
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(metadata) +
        delimiter +
        'Content-Type: application/json\r\n\r\n' +
        JSON.stringify(backup) +
        closeDelimiter;

    const response = await fetchWithRetry(
        `${DRIVE_UPLOAD_BASE}?uploadType=multipart`,
        {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body: multipartRequestBody,
        },
        token
    );

    if (!response.ok) {
        throw new Error(`Failed to upload backup: ${response.statusText}`);
    }

    lastUploadTimestamp = now;
    await pruneOldBackups(token);
}

/**
 * List all backups stored in Google Drive.
 * @returns Array of backup metadata
 */
export async function listBackups(): Promise<DriveBackupMeta[]> {
    const token = await getAuthToken(false);
    if (!token) {
        throw new Error('Not authenticated with Google Drive');
    }

    const query = encodeURIComponent("name contains 'bbs-backup' and trashed=false");
    const url = `${DRIVE_API_BASE}?spaces=appDataFolder&q=${query}&fields=files(id,name,modifiedTime)&orderBy=modifiedTime desc`;

    const response = await fetchWithRetry(url, {
        headers: { 'Authorization': `Bearer ${token}` },
    }, token);

    if (!response.ok) {
        throw new Error(`Failed to list backups: ${response.statusText}`);
    }

    const data = await response.json();
    return data.files || [];
}

/**
 * Download a backup from Google Drive.
 * @param fileId - The Drive file ID
 * @returns The backup object
 */
export async function downloadBackup(fileId: string): Promise<BookmarkBackup> {
    const token = await getAuthToken(false);
    if (!token) {
        throw new Error('Not authenticated with Google Drive');
    }

    const response = await fetchWithRetry(
        `${DRIVE_API_BASE}/${fileId}?alt=media`,
        {
            headers: { 'Authorization': `Bearer ${token}` },
        },
        token
    );

    if (!response.ok) {
        throw new Error(`Failed to download backup: ${response.statusText}`);
    }

    return await response.json();
}

/**
 * Delete a backup from Google Drive.
 * @param fileId - The Drive file ID
 */
export async function deleteBackup(fileId: string): Promise<void> {
    const token = await getAuthToken(false);
    if (!token) {
        throw new Error('Not authenticated with Google Drive');
    }

    const response = await fetchWithRetry(
        `${DRIVE_API_BASE}/${fileId}`,
        {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${token}` },
        },
        token
    );

    if (!response.ok) {
        throw new Error(`Failed to delete backup: ${response.statusText}`);
    }
}

/**
 * Prune old backups, keeping only the most recent MAX_BACKUPS.
 * @param token - The OAuth2 token
 */
async function pruneOldBackups(token: string): Promise<void> {
    try {
        const backups = await listBackups();
        if (backups.length > MAX_BACKUPS) {
            const toDelete = backups.slice(MAX_BACKUPS);
            for (const backup of toDelete) {
                await deleteBackup(backup.id);
            }
        }
    } catch (error) {
        console.error('Failed to prune old backups:', error);
    }
}

/**
 * Fetch with automatic token refresh on 401 responses.
 * @param url - The URL to fetch
 * @param options - Fetch options
 * @param token - The current token
 * @returns The fetch response
 */
async function fetchWithRetry(
    url: string,
    options: RequestInit,
    token: string
): Promise<Response> {
    let response = await fetch(url, options);

    if (response.status === 401) {
        await chrome.identity.removeCachedAuthToken({ token });
        const newToken = await getAuthToken(false);
        if (newToken) {
            const newHeaders = new Headers(options.headers);
            newHeaders.set('Authorization', `Bearer ${newToken}`);
            response = await fetch(url, { ...options, headers: newHeaders });
        }
    }

    return response;
}

/**
 * Disconnect from Google Drive by clearing cached tokens.
 */
export async function disconnect(): Promise<void> {
    const token = await getAuthToken(false);
    if (token) {
        await chrome.identity.removeCachedAuthToken({ token });
    }
    await chrome.storage.local.remove('driveConnected');
}
