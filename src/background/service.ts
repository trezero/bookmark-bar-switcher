import { type BookmarksBar, type BookmarksBarPopup } from 'bookmarks';
import {
    findFolder,
    getBookmarksBarId,
    getCustomBars,
    getCustomDirectoryId,
    isOperaBrowser,
    moveBookmark,
} from '~/background/util.ts';
import { getActiveBar, updateActiveBar, updateLastWorkspaceId } from '~/background/storage.ts';
import { acquireLock, releaseLock } from '~/background/operation-lock.ts';
import { createBackup, saveBackupLocal } from '~/background/backup.ts';
import { uploadBackup } from '~/background/drive.ts';

/**
 * Setup the extension when it is first installed
 * or the currently active bookmarks bar was (re)moved.
 */
export async function install() {
    await getActiveBar();
    if (isOperaBrowser()) {
        await updateLastWorkspaceId();
    }
}

/**
 * Exchange current bookmark bar with the selected bookmark bar by moving
 * bookmarks from the current bookmark bar to "Other Bookmarks" and the bookmarks
 * from the selected bookmarks bar to the "Bookmarks Bar".
 *
 * @param activatedId - The id of the bar that should become the active bookmarks bar.
 * @param deactivatedId - The id of the bar that should be moved back to its folder. (optional)
 */
export async function exchangeBars(activatedId: string, deactivatedId?: string) {
    if (!acquireLock()) {
        console.warn('Bar switch already in progress, skipping concurrent switch');
        return;
    }

    try {
        const bookmarkBarId = await getBookmarksBarId();
        const deactivatedBar = await (deactivatedId === undefined ? getActiveBar() : findFolder(deactivatedId));
        const activatedBar = await findFolder(activatedId);

        if (activatedBar === undefined || deactivatedBar === undefined || activatedBar.id === deactivatedBar.id) {
            return;
        }

        const backup = await createBackup();
        await saveBackupLocal(backup);

        const settings = await chrome.storage.local.get('driveAutoBackup');
        if (settings.driveAutoBackup === true) {
            uploadBackup(backup).catch(error => {
                console.error('Auto-upload to Drive failed:', error);
            });
        }

        // move the deactivated bar to its folder
        await moveBookmark(bookmarkBarId, deactivatedBar.id);
        // move the activated bar to the "Bookmarks Bar"
        await moveBookmark(activatedBar.id, bookmarkBarId);
        await updateActiveBar(activatedBar);

        await verifyIntegrity(bookmarkBarId, activatedBar.id, deactivatedBar.id);
    } finally {
        releaseLock();
    }
}

/**
 * Verify the integrity of the bar switch operation.
 * Checks that bookmarks were moved correctly.
 *
 * @param bookmarkBarId - The bookmarks bar ID.
 * @param activatedBarId - The activated bar ID.
 * @param deactivatedBarId - The deactivated bar ID.
 */
async function verifyIntegrity(bookmarkBarId: string, activatedBarId: string, deactivatedBarId: string) {
    try {
        const bookmarkBarChildren = await chrome.bookmarks.getChildren(bookmarkBarId);
        const deactivatedBarChildren = await chrome.bookmarks.getChildren(deactivatedBarId);

        if (bookmarkBarChildren.length === 0 && deactivatedBarChildren.length === 0) {
            console.warn('Integrity check: Both bars are empty after switch - this may indicate corruption');
        }
    } catch (error) {
        console.error('Integrity check failed:', error);
    }
}

/**
 * Create a new bookmarks bar.
 *
 * @param title - The title.
 * @returns The created bar.
 */
export async function createBar(title: string) {
    return chrome.bookmarks.create({
        parentId: await getCustomDirectoryId(),
        title,
    }) as Promise<BookmarksBar>;
}

/**
 * Rename a bookmarks bar.
 *
 * @param id - The bar id.
 * @param title - The current title.
 */
export async function renameBar(id: string, title: string) {
    await chrome.bookmarks.update(id, { title });
}

/**
 * Reorder bookmarks bars using drag-and-drop.
 *
 * @param bars - The bookmarks bars.
 * @param dropResult - The drop result.
 * @returns - The reordered bookmark bars.
 */
export async function reorderBars(
    bars: BookmarksBarPopup[],
    dropResult: { removedIndex: number | null; addedIndex: number | null },
) {
    const { removedIndex, addedIndex } = dropResult;
    if (removedIndex === null || addedIndex === null || removedIndex === addedIndex) {
        return bars;
    }

    const customDirectoryId = await getCustomDirectoryId();
    const customBars = await getCustomBars();
    const movedBar = customBars[removedIndex];
    await chrome.bookmarks.move(movedBar.id, {
        // need to increment the index by 1 when moving a bar downwards
        index: addedIndex < removedIndex ? addedIndex : addedIndex + 1,
        parentId: customDirectoryId,
    });
    const [element] = bars.splice(removedIndex, 1);
    bars.splice(addedIndex, 0, element);
    return bars;
}

/**
 * Remove a bookmarks bar.
 *
 * @param id - The bar id.
 */
export async function removeBar(id: string) {
    await chrome.bookmarks.removeTree(id);
}
