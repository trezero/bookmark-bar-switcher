<template>
  <div class="drive-backup">
    <div v-if="!connected" class="text-center">
      <BButton variant="primary" @click="connectDrive" :disabled="connecting">
        <span v-if="connecting">Connecting...</span>
        <span v-else>Connect Google Drive</span>
      </BButton>
      <small class="d-block mt-2 text-muted">
        Backup your bookmarks to Google Drive for cross-device recovery
      </small>
    </div>

    <div v-else>
      <div class="d-flex justify-content-between align-items-center mb-2">
        <strong>Google Drive: Connected</strong>
        <BButton variant="link" size="sm" @click="disconnectDrive">Disconnect</BButton>
      </div>

      <div v-if="lastBackupTime" class="text-muted small mb-2">
        Last backup: {{ formatTime(lastBackupTime) }}
      </div>

      <div class="d-grid gap-2">
        <BButton variant="success" @click="backupNow" :disabled="backing">
          {{ backing ? 'Backing up...' : 'Back up now' }}
        </BButton>

        <BButton variant="info" @click="showRestoreModal = true" :disabled="loading">
          Restore from Google Drive
        </BButton>
      </div>

      <BFormCheckbox v-model="autoBackup" @change="toggleAutoBackup" class="mt-3">
        Auto-backup to Google Drive after each switch
      </BFormCheckbox>
    </div>

    <BModal v-model="showRestoreModal" title="Restore from Google Drive" @ok="restoreSelected">
      <div v-if="loading" class="text-center">
        <BSpinner small></BSpinner> Loading backups...
      </div>
      <div v-else-if="driveBackups.length === 0">
        No backups found in Google Drive.
      </div>
      <BListGroup v-else>
        <BListGroupItem
          v-for="backup in driveBackups"
          :key="backup.id"
          :active="selectedBackupId === backup.id"
          @click="selectedBackupId = backup.id"
          button
        >
          <div class="d-flex justify-content-between">
            <span>{{ formatBackupName(backup.name) }}</span>
            <small class="text-muted">{{ formatTime(backup.modifiedTime) }}</small>
          </div>
        </BListGroupItem>
      </BListGroup>
    </BModal>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { getAuthToken, isConnected, uploadBackup, listBackups, downloadBackup, disconnect } from '~/background/drive.ts';
import { createBackup, restoreFromBackup } from '~/background/backup.ts';
import { type DriveBackupMeta } from '~/types/backup';

export default defineComponent({
  name: 'DriveBackup',
  data() {
    return {
      connected: false,
      connecting: false,
      backing: false,
      loading: false,
      autoBackup: false,
      lastBackupTime: null as string | null,
      showRestoreModal: false,
      driveBackups: [] as DriveBackupMeta[],
      selectedBackupId: null as string | null,
    };
  },
  async mounted() {
    await this.checkConnection();
    await this.loadSettings();
  },
  methods: {
    async checkConnection() {
      this.connected = await isConnected();
    },
    async loadSettings() {
      const result = await chrome.storage.local.get(['driveAutoBackup', 'lastDriveBackup']);
      this.autoBackup = result.driveAutoBackup === true;
      this.lastBackupTime = result.lastDriveBackup || null;
    },
    async connectDrive() {
      this.connecting = true;
      try {
        const token = await getAuthToken(true);
        if (token) {
          this.connected = true;
          await chrome.storage.local.set({ driveConnected: true });
        }
      } catch (error) {
        console.error('Failed to connect to Google Drive:', error);
        alert('Failed to connect to Google Drive. Please try again.');
      } finally {
        this.connecting = false;
      }
    },
    async disconnectDrive() {
      await disconnect();
      this.connected = false;
      this.autoBackup = false;
    },
    async backupNow() {
      this.backing = true;
      try {
        const backup = await createBackup();
        await uploadBackup(backup);
        this.lastBackupTime = new Date().toISOString();
        await chrome.storage.local.set({ lastDriveBackup: this.lastBackupTime });
        alert('Backup uploaded to Google Drive successfully!');
      } catch (error) {
        console.error('Failed to backup to Google Drive:', error);
        alert('Failed to backup to Google Drive. Please try again.');
      } finally {
        this.backing = false;
      }
    },
    async toggleAutoBackup() {
      await chrome.storage.local.set({ driveAutoBackup: this.autoBackup });
    },
    async showRestore() {
      this.showRestoreModal = true;
      this.loading = true;
      try {
        this.driveBackups = await listBackups();
      } catch (error) {
        console.error('Failed to list backups:', error);
        alert('Failed to load backups from Google Drive.');
      } finally {
        this.loading = false;
      }
    },
    async restoreSelected() {
      if (!this.selectedBackupId) {
        return;
      }

      try {
        const backup = await downloadBackup(this.selectedBackupId);
        await restoreFromBackup(backup);
        alert('Bookmarks restored successfully! Please reload the extension.');
        this.showRestoreModal = false;
      } catch (error) {
        console.error('Failed to restore backup:', error);
        alert('Failed to restore backup. Please try again.');
      }
    },
    formatTime(time: string): string {
      return new Date(time).toLocaleString();
    },
    formatBackupName(name: string): string {
      const match = name.match(/bbs-backup-(\d+)\.json/);
      if (match) {
        return new Date(parseInt(match[1])).toLocaleString();
      }
      return name;
    },
  },
  watch: {
    showRestoreModal(newVal) {
      if (newVal) {
        this.showRestore();
      }
    },
  },
});
</script>
