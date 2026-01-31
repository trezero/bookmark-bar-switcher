import { type BookmarkBackup, type BarSnapshot, type BookmarkSnapshot } from '~/types/backup';
import { getBookmarksBarId, getCustomBars, getCustomDirectoryId } from '~/background/util.ts';
import { getActiveBar } from '~/background/storage.ts';
import { acquireLock, releaseLock } from '~/background/operation-lock.ts';
import pkg from '../../package.json' with { type: 'json' };

const BACKUP_HISTORY_SIZE = 5;

/**
 * Create a complete backup of all bookmark bars.
 * @returns The backup object containing all bar data
 */
export async function createBackup(): Promise<BookmarkBackup> {
    const activeBar = await getActiveBar();
    const customBars = await getCustomBars();
    const bookmarkBarId = await getBookmarksBarId();

    const bars: BarSnapshot[] = [];

    for (const bar of customBars) {
        const bookmarks = await serializeBookmarks(bar.id);
        bars.push({
            id: bar.id,
            title: bar.title ?? 'Untitled Bar',
            bookmarks,
        });
    }

    const visibleBarBookmarks = await serializeBookmarks(bookmarkBarId);
    bars.push({
        id: bookmarkBarId,
        title: 'Bookmarks Bar (visible)',
        bookmarks: visibleBarBookmarks,
    });

    return {
        version: 1,
        timestamp: Date.now(),
        extensionVersion: pkg.version,
        activeBarId: activeBar.id,
        bars,
    };
}

/**
 * Recursively serialize bookmarks from a folder.
 * @param folderId - The folder ID to serialize
 * @returns Array of bookmark snapshots
 */
async function serializeBookmarks(folderId: string): Promise<BookmarkSnapshot[]> {
    const children = await chrome.bookmarks.getChildren(folderId);
    const snapshots: BookmarkSnapshot[] = [];

    for (const child of children) {
        if (child.url) {
            snapshots.push({
                title: child.title,
                url: child.url,
            });
        } else {
            const childBookmarks = await serializeBookmarks(child.id);
            snapshots.push({
                title: child.title,
                children: childBookmarks,
            });
        }
    }

    return snapshots;
}

/**
 * Save a backup to local storage and maintain history.
 * @param backup - The backup to save
 */
export async function saveBackupLocal(backup: BookmarkBackup): Promise<void> {
    const storage = await chrome.storage.local.get(['localBackup', 'localBackupHistory']);
    
    await chrome.storage.local.set({ localBackup: backup });

    const history: BookmarkBackup[] = storage.localBackupHistory || [];
    history.unshift(backup);
    
    if (history.length > BACKUP_HISTORY_SIZE) {
        history.splice(BACKUP_HISTORY_SIZE);
    }

    await chrome.storage.local.set({ localBackupHistory: history });
}

/**
 * Get the most recent local backup.
 * @returns The latest backup or undefined if none exists
 */
export async function getLatestBackup(): Promise<BookmarkBackup | undefined> {
    const storage = await chrome.storage.local.get('localBackup');
    return storage.localBackup;
}

/**
 * Get all stored backup history.
 * @returns Array of backups, newest first
 */
export async function getBackupHistory(): Promise<BookmarkBackup[]> {
    const storage = await chrome.storage.local.get('localBackupHistory');
    return storage.localBackupHistory || [];
}

/**
 * Restore bookmarks from a backup snapshot.
 * @param backup - The backup to restore
 */
export async function restoreFromBackup(backup: BookmarkBackup): Promise<void> {
    if (!acquireLock()) {
        throw new Error('Cannot restore while a bar switch is in progress');
    }

    try {
        const bookmarkBarId = await getBookmarksBarId();
        const customDirectoryId = await getCustomDirectoryId();

        const currentBookmarkBarChildren = await chrome.bookmarks.getChildren(bookmarkBarId);
        for (const child of currentBookmarkBarChildren) {
            await chrome.bookmarks.removeTree(child.id);
        }

        const currentCustomBars = await chrome.bookmarks.getChildren(customDirectoryId);
        for (const bar of currentCustomBars) {
            if (!bar.url) {
                await chrome.bookmarks.removeTree(bar.id);
            }
        }

        for (const barSnapshot of backup.bars) {
            if (barSnapshot.id === bookmarkBarId || barSnapshot.title === 'Bookmarks Bar (visible)') {
                await restoreBookmarksToFolder(bookmarkBarId, barSnapshot.bookmarks);
            } else {
                const restoredBar = await chrome.bookmarks.create({
                    parentId: customDirectoryId,
                    title: barSnapshot.title,
                });
                await restoreBookmarksToFolder(restoredBar.id, barSnapshot.bookmarks);
            }
        }

        await chrome.storage.local.set({ activeBar: backup.activeBarId });
        
        console.log('Backup restored successfully');
    } catch (error) {
        console.error('Failed to restore backup:', error);
        throw error;
    } finally {
        releaseLock();
    }
}

/**
 * Recursively restore bookmarks to a folder.
 * @param parentId - The parent folder ID
 * @param bookmarks - The bookmarks to restore
 */
async function restoreBookmarksToFolder(parentId: string, bookmarks: BookmarkSnapshot[]): Promise<void> {
    for (const bookmark of bookmarks) {
        if (bookmark.url) {
            await chrome.bookmarks.create({
                parentId,
                title: bookmark.title,
                url: bookmark.url,
            });
        } else if (bookmark.children) {
            const folder = await chrome.bookmarks.create({
                parentId,
                title: bookmark.title,
            });
            await restoreBookmarksToFolder(folder.id, bookmark.children);
        }
    }
}
