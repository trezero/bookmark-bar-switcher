<template>
  <div class="flex flex-col h-screen overflow-hidden relative">
    <div class="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none">
      <div class="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
      <div class="absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[120px] rounded-full"></div>
    </div>

    <header class="px-4 pt-3 pb-2.5 flex flex-col gap-2 sticky top-0 z-30 bg-background-dark/80 glass border-b border-white/5">
      <div class="flex justify-between items-center">
        <h1 class="text-xl font-bold tracking-tight">Bar Sets</h1>
      </div>
      <div class="relative group">
        <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-base font-light">search</span>
        <input 
          v-model="searchQuery"
          class="w-full bg-slate-900/60 border border-slate-800/50 rounded-lg py-1.5 pl-8 pr-3 text-xs focus:ring-1 focus:ring-primary focus:bg-slate-900 transition-all placeholder:text-slate-500" 
          placeholder="Search bookmark bar sets..." 
          type="text"
        />
      </div>
    </header>

    <main class="flex-1 overflow-y-auto hide-scrollbar">
      <div class="px-4 pt-3 pb-24">
        <SyncWarning />
        
        <section class="mb-3">
          <h2 class="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-0.5">Create New Bar Set</h2>
          <Create @create="create" />
        </section>

        <section>
          <h2 class="text-[9px] font-bold uppercase tracking-widest text-slate-500 mb-2 px-0.5">Saved Bar Sets</h2>
          <BookmarksBars :added-bar="createdBar" :search-query="searchQuery" />
        </section>
      </div>
    </main>

    <div class="fixed bottom-0 left-0 right-0 z-40 bg-slate-900/60 glass border-t border-slate-800/50 shadow-[0_-10px_40px_rgba(0,0,0,0.6)]">
      <div class="pb-2 pt-2 px-4">
        <div class="flex flex-col items-center">
          <div class="w-8 h-0.5 bg-slate-700/60 rounded-full mb-2"></div>
          <div class="w-full flex items-center justify-between gap-3">
            <div class="flex items-center gap-2">
              <div class="relative flex items-center justify-center w-6 h-6 rounded-lg bg-primary/10">
                <span class="material-symbols-outlined text-primary text-base">cloud_sync</span>
                <div v-if="driveConnected" class="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-500 border border-slate-900"></div>
              </div>
              <div class="flex flex-col">
                <span class="text-[8px] uppercase tracking-wider font-bold text-slate-500">Backup Status</span>
                <span class="text-[10px] font-medium text-slate-300">{{ backupStatusText }}</span>
              </div>
            </div>
            <button 
              @click="showBackupPanel = !showBackupPanel"
              class="text-[10px] font-bold text-primary hover:text-white transition-all flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary active:scale-95"
            >
              <span class="material-symbols-outlined text-sm">settings_backup_restore</span>
              Manage
            </button>
          </div>
        </div>
      </div>
    </div>

    <div 
      v-if="showBackupPanel"
      class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
      @click="showBackupPanel = false"
    >
      <div 
        class="fixed bottom-0 left-0 right-0 bg-slate-900/95 glass border-t border-slate-800/80 rounded-t-[40px] shadow-[0_-20px_50px_rgba(0,0,0,0.5)] max-h-[70vh] overflow-hidden"
        @click.stop
      >
        <div class="pt-3 pb-2 flex flex-col items-center">
          <div class="w-12 h-1.5 bg-slate-700 rounded-full mb-4"></div>
          <button 
            @click="showBackupPanel = false"
            class="text-slate-400 hover:text-white transition-colors"
          >
            <span class="material-symbols-outlined text-3xl">keyboard_arrow_down</span>
          </button>
        </div>
        
        <div class="px-8 flex flex-col h-full overflow-y-auto hide-scrollbar pb-12">
          <header class="mb-8">
            <h2 class="text-2xl font-bold text-white mb-1">Backup & Restore</h2>
            <p class="text-sm text-slate-400">Manage your data locally or sync with cloud</p>
          </header>

          <div class="space-y-6">
            <div class="bg-slate-800/40 border border-slate-700/50 p-5 rounded-3xl">
              <div class="flex items-center justify-between mb-4">
                <div class="flex items-center gap-4">
                  <div class="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center">
                    <span class="material-symbols-outlined text-primary text-2xl">cloud_sync</span>
                  </div>
                  <div>
                    <p class="text-base font-semibold text-white">Google Drive Backups</p>
                    <p class="text-xs text-slate-400">Sync across devices</p>
                  </div>
                </div>
              </div>
              <DriveBackup @status-change="updateDriveStatus" />
            </div>

            <div class="bg-slate-800/40 border border-slate-700/50 p-5 rounded-3xl">
              <div class="flex items-center gap-4 mb-4">
                <div class="w-12 h-12 rounded-2xl bg-emerald-500/10 flex items-center justify-center">
                  <span class="material-symbols-outlined text-emerald-500 text-2xl">save</span>
                </div>
                <div>
                  <p class="text-base font-semibold text-white">Local Backups</p>
                  <p class="text-xs text-slate-400">Export and restore manually</p>
                </div>
              </div>
              <Backup />
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { BookmarksBar } from 'bookmarks';
import BookmarksBars from '~/components/BookmarksBars.vue';
import Create from '~/components/Create.vue';
import SyncWarning from '~/components/SyncWarning.vue';
import Backup from '~/components/Backup.vue';
import DriveBackup from '~/components/DriveBackup.vue';
import { defineComponent } from 'vue';

export default defineComponent({
  components: { Create, BookmarksBars, SyncWarning, Backup, DriveBackup },
  data() {
    return { 
      createdBar: {},
      showBackupPanel: false,
      searchQuery: '',
      driveConnected: false,
      lastBackupTime: null as string | null,
    };
  },
  computed: {
    backupStatusText(): string {
      if (this.lastBackupTime) {
        const date = new Date(this.lastBackupTime);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        const diffHours = Math.floor(diffMs / 3600000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins}m ago`;
        if (diffHours < 24) return `${diffHours}h ago`;
        return date.toLocaleDateString();
      }
      return 'No recent backup';
    },
  },
  async mounted() {
    await this.loadBackupStatus();
  },
  methods: {
    create(bar: BookmarksBar) {
      this.createdBar = bar;
    },
    async loadBackupStatus() {
      const result = await chrome.storage.local.get(['driveConnected', 'lastDriveBackup']);
      this.driveConnected = result.driveConnected === true;
      this.lastBackupTime = result.lastDriveBackup || null;
    },
    updateDriveStatus(status: { connected: boolean; lastBackup?: string }) {
      this.driveConnected = status.connected;
      if (status.lastBackup) {
        this.lastBackupTime = status.lastBackup;
      }
    },
  },
});
</script>
