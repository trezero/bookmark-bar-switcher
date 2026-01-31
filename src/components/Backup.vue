<template>
  <div>
    <div class="grid grid-cols-1 gap-3">
      <button 
        @click="createManualBackup" 
        :disabled="creating"
        class="flex items-center gap-4 bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 p-4 rounded-2xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div class="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
          <span class="material-symbols-outlined text-emerald-500 text-xl">file_download</span>
        </div>
        <div class="text-left flex-1">
          <p class="text-sm font-semibold text-white">{{ creating ? 'Creating backup...' : 'Create Local Backup' }}</p>
          <p class="text-xs text-slate-400">Export all sets as a .json file</p>
        </div>
        <span class="material-symbols-outlined ml-auto text-slate-600 group-hover:text-slate-400 transition-colors">chevron_right</span>
      </button>

      <button 
        @click="showRestoreModal = true" 
        :disabled="backupHistory.length === 0"
        class="flex items-center gap-4 bg-slate-800/40 hover:bg-slate-800/60 border border-slate-700/50 p-4 rounded-2xl transition-all group disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <div class="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
          <span class="material-symbols-outlined text-amber-500 text-xl">file_upload</span>
        </div>
        <div class="text-left flex-1">
          <p class="text-sm font-semibold text-white">Restore from File</p>
          <p class="text-xs text-slate-400">Import your previously saved bars</p>
        </div>
        <span class="material-symbols-outlined ml-auto text-slate-600 group-hover:text-slate-400 transition-colors">chevron_right</span>
      </button>
    </div>

    <div v-if="backupHistory.length > 0" class="text-center text-[10px] text-slate-600 uppercase tracking-widest font-bold pt-4">
      {{ backupHistory.length }} backup{{ backupHistory.length > 1 ? 's' : '' }} available
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
        <h3 class="text-xl font-bold mb-4">Restore from Backup</h3>
        
        <div v-if="backupHistory.length === 0" class="text-center py-8 text-slate-400">
          No backups available.
        </div>
        
        <div v-else class="flex-1 overflow-y-auto space-y-2 mb-4">
          <button
            v-for="(backup, index) in backupHistory"
            :key="index"
            @click="selectedBackupIndex = index"
            :class="[
              'w-full text-left p-4 rounded-xl border transition-all',
              selectedBackupIndex === index
                ? 'bg-primary/20 border-primary/50'
                : 'bg-slate-700/30 border-slate-600/50 hover:border-slate-500'
            ]"
          >
            <div class="font-semibold text-sm mb-1">{{ formatTime(backup.timestamp) }}</div>
            <div class="text-xs text-slate-400">
              Active bar: {{ getBarTitle(backup.activeBarId, backup.bars) }}
            </div>
            <div class="text-xs text-slate-400">
              {{ backup.bars.length }} bar{{ backup.bars.length > 1 ? 's' : '' }}
            </div>
          </button>
        </div>

        <div class="bg-amber-500/10 border border-amber-500/30 rounded-xl p-3 mb-4">
          <p class="text-xs text-amber-200">
            <strong>Warning:</strong> Restoring will replace all current bookmark bars with the backup data.
          </p>
        </div>

        <div class="flex gap-3">
          <button 
            @click="showRestoreModal = false"
            class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
          >
            Cancel
          </button>
          <button 
            @click="restoreSelected"
            :disabled="selectedBackupIndex === null"
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
import { createBackup, saveBackupLocal, getBackupHistory, restoreFromBackup } from '~/background/backup.ts';
import { type BookmarkBackup, type BarSnapshot } from '~/types/backup';

export default defineComponent({
  name: 'Backup',
  data() {
    return {
      creating: false,
      backupHistory: [] as BookmarkBackup[],
      showRestoreModal: false,
      selectedBackupIndex: null as number | null,
    };
  },
  async mounted() {
    await this.loadBackupHistory();
  },
  methods: {
    async loadBackupHistory() {
      this.backupHistory = await getBackupHistory();
    },
    async createManualBackup() {
      this.creating = true;
      try {
        const backup = await createBackup();
        await saveBackupLocal(backup);
        await this.loadBackupHistory();
        alert('Backup created successfully!');
      } catch (error) {
        console.error('Failed to create backup:', error);
        alert('Failed to create backup. Please try again.');
      } finally {
        this.creating = false;
      }
    },
    async restoreSelected() {
      if (this.selectedBackupIndex === null) {
        return;
      }

      const backup = this.backupHistory[this.selectedBackupIndex];
      if (!backup) {
        return;
      }

      try {
        await restoreFromBackup(backup);
        alert('Bookmarks restored successfully! Please reload the extension.');
        this.showRestoreModal = false;
      } catch (error) {
        console.error('Failed to restore backup:', error);
        alert('Failed to restore backup. Please try again.');
      }
    },
    formatTime(timestamp: number): string {
      return new Date(timestamp).toLocaleString();
    },
    getBarTitle(barId: string, bars: BarSnapshot[]): string {
      const bar = bars.find(b => b.id === barId);
      return bar ? bar.title : 'Unknown';
    },
  },
});
</script>
