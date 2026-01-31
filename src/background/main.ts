import {
    handleChange,
    handleMove,
    handleRemove,
    handleShortcut,
    handleWindowCreate,
    handleWorkspaceSwitch,
} from '~/background/handlers.ts';
import { install } from '~/background/service.ts';
import { isOperaBrowser } from './util.ts';
import { getAuthToken, isConnected, uploadBackup, listBackups, downloadBackup, disconnect } from '~/background/drive.ts';
import { createBackup, restoreFromBackup } from '~/background/backup.ts';

chrome.runtime.onInstalled.addListener(install);
chrome.bookmarks.onChanged.addListener(handleChange);
chrome.bookmarks.onRemoved.addListener(handleRemove);
chrome.bookmarks.onMoved.addListener(handleMove);
chrome.commands.onCommand.addListener(handleShortcut);

if (isOperaBrowser()) {
    // Saves windowId, so Workspace don't switch on new opened windows
    chrome.windows.onCreated.addListener(handleWindowCreate);
    // An onActivated event is fired on every workspace switch
    chrome.tabs.onActivated.addListener(handleWorkspaceSwitch);
}

// Handle messages from popup for Google Drive operations
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === 'drive:getAuthToken') {
        getAuthToken(message.interactive).then(token => {
            sendResponse({ success: true, token });
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true; // Keep channel open for async response
    }
    
    if (message.action === 'drive:isConnected') {
        isConnected().then(connected => {
            sendResponse({ success: true, connected });
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true;
    }
    
    if (message.action === 'drive:uploadBackup') {
        createBackup().then(backup => {
            return uploadBackup(backup);
        }).then(() => {
            sendResponse({ success: true });
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true;
    }
    
    if (message.action === 'drive:listBackups') {
        listBackups().then(backups => {
            sendResponse({ success: true, backups });
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true;
    }
    
    if (message.action === 'drive:downloadBackup') {
        downloadBackup(message.fileId).then(backup => {
            return restoreFromBackup(backup);
        }).then(() => {
            sendResponse({ success: true });
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true;
    }
    
    if (message.action === 'drive:disconnect') {
        disconnect().then(() => {
            sendResponse({ success: true });
        }).catch(error => {
            sendResponse({ success: false, error: error.message });
        });
        return true;
    }
});
