<template>
  <div>
    <div v-if="!connected" class="text-center">
      <button 
        @click="connectDrive" 
        :disabled="connecting"
        class="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2.5 rounded-xl text-sm transition-all shadow-sm shadow-blue-500/20 mb-3 flex items-center justify-center gap-2"
      >
        <span v-if="connecting" class="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
        <span>{{ connecting ? 'Connecting...' : 'Sign in with Google' }}</span>
      </button>
      <p class="text-xs text-slate-500 dark:text-slate-400">
        Securely backup your bookmarks to Google Drive.
      </p>
    </div>

    <div v-else>
      <div class="flex justify-between items-center mb-4 pb-3 border-b border-slate-200 dark:border-slate-700">
        <div class="flex items-center gap-2">
          <div class="relative flex h-2 w-2">
            <span class="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span class="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span class="text-sm font-semibold text-slate-700 dark:text-slate-200">Connected</span>
        </div>
        <button 
          @click="disconnectDrive"
          class="text-xs font-medium text-red-500 hover:text-red-600 dark:text-red-400 dark:hover:text-red-300 transition-colors"
        >
          Disconnect
        </button>
      </div>

      <div class="grid grid-cols-2 gap-3 mb-4">
        <button 
          @click="backupNow" 
          :disabled="backing"
          class="bg-slate-900 hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 text-white font-semibold py-2 rounded-lg text-xs transition-all flex flex-col items-center justify-center gap-1 h-16"
        >
          <span class="material-symbols-outlined text-xl">upload</span>
          {{ backing ? 'Backing up...' : 'Backup' }}
        </button>

        <button 
          @click="showRestoreModal = true" 
          :disabled="loading"
          class="bg-white border border-slate-200 hover:bg-slate-50 text-slate-700 dark:bg-slate-800 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700 font-semibold py-2 rounded-lg text-xs transition-all flex flex-col items-center justify-center gap-1 h-16"
        >
          <span class="material-symbols-outlined text-xl">history</span>
          Restore
        </button>
      </div>

      <label class="flex items-center justify-between cursor-pointer p-3 rounded-xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700/50">
        <span class="text-xs font-medium text-slate-600 dark:text-slate-300">Auto-backup on switch</span>
        <div class="relative">
          <input type="checkbox" v-model="autoBackup" @change="toggleAutoBackup" class="sr-only peer" />
          <div class="w-9 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer dark:bg-slate-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
        </div>
      </label>
    </div>

    <div 
      v-if="showRestoreModal"
      class="fixed inset-0 z-[60] bg-slate-900/20 dark:bg-black/60 backdrop-blur-sm flex items-center justify-center"
      @click="showRestoreModal = false"
    >
      <div 
        class="bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl p-6 max-w-md mx-4 shadow-2xl max-h-[80vh] overflow-hidden flex flex-col"
        @click.stop
      >
        <h3 class="text-xl font-bold mb-4 text-slate-900 dark:text-white">Restore from Google Drive</h3>
        
        <div v-if="loading" class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="text-slate-500 dark:text-slate-400 mt-3">Loading backups...</p>
        </div>
        
        <div v-else-if="driveBackups.length === 0" class="text-center py-8 text-slate-500 dark:text-slate-400">
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
                ? 'bg-blue-50 border-blue-300 dark:bg-blue-900/20 dark:border-blue-500/50'
                : 'bg-slate-50 border-slate-200 hover:border-slate-300 dark:bg-slate-700/30 dark:border-slate-600/50 dark:hover:border-slate-500'
            ]"
          >
            <div class="flex justify-between items-start">
              <span class="font-semibold text-sm text-slate-900 dark:text-white">{{ formatBackupName(backup.name) }}</span>
              <span class="text-xs text-slate-500 dark:text-slate-400">{{ formatTime(backup.modifiedTime) }}</span>
            </div>
          </button>
        </div>

        <div v-if="!loading && driveBackups.length > 0" class="flex gap-3">
          <button 
            @click="showRestoreModal = false"
            class="flex-1 bg-slate-200 hover:bg-slate-300 text-slate-700 dark:bg-slate-700 dark:hover:bg-slate-600 dark:text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
          >
            Cancel
          </button>
          <button 
            @click="restoreSelected"
            :disabled="!selectedBackupId"
            class="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed"
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
