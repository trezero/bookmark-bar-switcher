<template>
  <div>
    <div v-if="!connected" class="text-center">
      <button 
        @click="connectDrive" 
        :disabled="connecting"
        class="w-full bg-primary hover:bg-blue-600 text-white font-semibold py-3 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed mb-3"
      >
        <span v-if="connecting">Connecting...</span>
        <span v-else>Sign in with Google</span>
      </button>
      <p class="text-xs text-slate-400 mb-2">
        Backup your bookmarks to Google Drive for cross-device recovery
      </p>
      <p v-if="authMethod === 'web-oauth'" class="text-xs text-blue-400">
        <strong>Note:</strong> Using web-based authentication (compatible with all Chromium browsers)
      </p>
    </div>

    <div v-else>
      <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-700/50">
        <div class="flex items-center gap-2">
          <div class="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span class="text-sm font-semibold text-white">Connected</span>
        </div>
        <button 
          @click="disconnectDrive"
          class="text-xs text-slate-400 hover:text-white transition-colors"
        >
          Disconnect
        </button>
      </div>

      <div v-if="lastBackupTime" class="text-xs text-slate-400 mb-4">
        Last backup: {{ formatTime(lastBackupTime) }}
      </div>

      <div class="grid grid-cols-1 gap-3 mb-4">
        <button 
          @click="backupNow" 
          :disabled="backing"
          class="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {{ backing ? 'Backing up...' : 'Back up now' }}
        </button>

        <button 
          @click="showRestoreModal = true" 
          :disabled="loading"
          class="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Restore from Google Drive
        </button>
      </div>

      <label class="flex items-center gap-3 cursor-pointer">
        <div class="relative">
          <input 
            type="checkbox" 
            v-model="autoBackup" 
            @change="toggleAutoBackup"
            class="sr-only peer"
          />
          <div class="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </div>
        <span class="text-xs text-slate-300">Auto-backup after each switch</span>
      </label>
    </div>

    <div 
      v-if="showRestoreModal"
      class="fixed inset-0 z-[60] bg-black/50 backdrop-blur-sm flex items-center justify-center"
      @click="showRestoreModal = false"
    >
      <div 
        class="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-md mx-4 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
        @click.stop
      >
        <h3 class="text-xl font-bold mb-4">Restore from Google Drive</h3>
        
        <div v-if="loading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          <p class="text-slate-400 mt-3">Loading backups...</p>
        </div>
        
        <div v-else-if="driveBackups.length === 0" class="text-center py-8 text-slate-400">
          No backups found in Google Drive.
        </div>
        
        <div v-else class="flex-1 overflow-y-auto space-y-2 mb-4">
          <button
            v-for="backup in driveBackups"
            :key="backup.id"
            @click="selectedBackupId = backup.id"
            :class="[
              'w-full text-left p-4 rounded-xl border transition-all',
              selectedBackupId === backup.id
                ? 'bg-primary/20 border-primary/50'
                : 'bg-slate-700/30 border-slate-600/50 hover:border-slate-500'
            ]"
          >
            <div class="flex justify-between items-start">
              <span class="font-semibold text-sm">{{ formatBackupName(backup.name) }}</span>
              <span class="text-xs text-slate-400">{{ formatTime(backup.modifiedTime) }}</span>
            </div>
          </button>
        </div>

        <div v-if="!loading && driveBackups.length > 0" class="flex gap-3">
          <button 
            @click="showRestoreModal = false"
            class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
          >
            Cancel
          </button>
          <button 
            @click="restoreSelected"
            :disabled="!selectedBackupId"
            class="flex-1 bg-primary hover:bg-blue-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Restore
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { type DriveBackupMeta } from '~/types/backup';

export default defineComponent({
  name: 'DriveBackup',
  emits: ['status-change'],
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
      authMethod: 'none' as 'chrome.identity' | 'web-oauth' | 'none',
    };
  },
  async mounted() {
    await this.checkConnection();
    await this.loadSettings();
    await this.checkAuthMethod();
  },
  methods: {
    async sendMessage(action: string, data: any = {}): Promise<any> {
      return new Promise((resolve, reject) => {
        chrome.runtime.sendMessage({ action, ...data }, (response) => {
          if (chrome.runtime.lastError) {
            reject(new Error(chrome.runtime.lastError.message));
          } else if (response && response.success) {
            resolve(response);
          } else {
            reject(new Error(response?.error || 'Unknown error'));
          }
        });
      });
    },
    async checkConnection() {
      try {
        const response = await this.sendMessage('drive:isConnected');
        this.connected = response.connected;
        this.$emit('status-change', { connected: this.connected, lastBackup: this.lastBackupTime });
      } catch (error) {
        console.error('Failed to check connection:', error);
        this.connected = false;
        this.$emit('status-change', { connected: false });
      }
    },
    async checkAuthMethod() {
      try {
        const response = await this.sendMessage('drive:getAuthMethod');
        this.authMethod = response.method;
      } catch (error) {
        console.error('Failed to check auth method:', error);
        this.authMethod = 'none';
      }
    },
    async loadSettings() {
      const result = await chrome.storage.local.get(['driveAutoBackup', 'lastDriveBackup']);
      this.autoBackup = result.driveAutoBackup === true;
      this.lastBackupTime = result.lastDriveBackup || null;
    },
    async connectDrive() {
      this.connecting = true;
      try {
        const response = await this.sendMessage('drive:getAuthToken', { interactive: true });
        if (response.token) {
          this.connected = true;
          await chrome.storage.local.set({ driveConnected: true });
          this.$emit('status-change', { connected: true, lastBackup: this.lastBackupTime });
        }
      } catch (error) {
        console.error('Failed to connect to Google Drive:', error);
        alert('Failed to connect to Google Drive. Please try again.');
      } finally {
        this.connecting = false;
      }
    },
    async disconnectDrive() {
      try {
        await this.sendMessage('drive:disconnect');
        this.connected = false;
        this.autoBackup = false;
        this.$emit('status-change', { connected: false });
      } catch (error) {
        console.error('Failed to disconnect:', error);
      }
    },
    async backupNow() {
      this.backing = true;
      try {
        await this.sendMessage('drive:uploadBackup');
        this.lastBackupTime = new Date().toISOString();
        await chrome.storage.local.set({ lastDriveBackup: this.lastBackupTime });
        this.$emit('status-change', { connected: true, lastBackup: this.lastBackupTime });
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
        const response = await this.sendMessage('drive:listBackups');
        this.driveBackups = response.backups;
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
        await this.sendMessage('drive:downloadBackup', { fileId: this.selectedBackupId });
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
