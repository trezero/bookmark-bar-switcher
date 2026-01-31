export interface BookmarkBackup {
    version: number;
    timestamp: number;
    extensionVersion: string;
    activeBarId: string;
    bars: BarSnapshot[];
}

export interface BarSnapshot {
    id: string;
    title: string;
    bookmarks: BookmarkSnapshot[];
}

export interface BookmarkSnapshot {
    title: string;
    url?: string;
    children?: BookmarkSnapshot[];
}

export interface DriveBackupMeta {
    id: string;
    name: string;
    modifiedTime: string;
}
