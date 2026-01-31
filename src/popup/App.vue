<template>
  <div class="flex flex-col h-screen overflow-hidden relative bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
    
    <div class="fixed top-0 left-0 w-full h-full -z-10 pointer-events-none opacity-100 dark:opacity-20 transition-opacity duration-300">
      <div class="absolute top-[-10%] right-[-10%] w-[60%] h-[40%] bg-blue-400/30 blur-[120px] rounded-full"></div>
      <div class="absolute bottom-[20%] left-[-10%] w-[50%] h-[50%] bg-purple-400/30 blur-[120px] rounded-full"></div>
    </div>

    <header class="px-4 pt-3 pb-2.5 flex flex-col gap-2 sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200/60 dark:border-slate-800 transition-colors">
      <div class="flex justify-between items-center">
        <h1 class="text-xl font-bold tracking-tight text-slate-900 dark:text-white">BarSwap</h1>
        <button 
          @click="toggleTheme"
          class="w-8 h-8 rounded-lg flex items-center justify-center transition-all shadow-sm
                 bg-slate-100 hover:bg-slate-200 text-slate-600
                 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-yellow-400"
          title="Toggle theme"
        >
          <span v-if="isDark" class="material-symbols-outlined text-lg">light_mode</span>
          <span v-else class="material-symbols-outlined text-lg">dark_mode</span>
        </button>
      </div>
      
      <div class="relative group">
        <span class="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 text-lg">search</span>
        <input 
          v-model="searchQuery"
          class="w-full rounded-xl py-2 pl-9 pr-3 text-xs transition-all shadow-sm
                 bg-slate-100 border-transparent focus:bg-white focus:ring-2 focus:ring-primary/50 placeholder:text-slate-400 text-slate-900
                 dark:bg-slate-800/50 dark:border-slate-700 dark:focus:bg-slate-800 dark:text-white dark:placeholder:text-slate-500" 
          placeholder="Search bookmark bar sets..." 
          type="text"
        />
      </div>
    </header>

    <main class="flex-1 overflow-y-auto hide-scrollbar">
      <div class="px-4 pt-3 pb-24">
        <SyncWarning />
        
        <section class="mb-4">
          <h2 class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 px-1">Create New Bar Set</h2>
          <Create @create="create" />
        </section>

        <section>
          <h2 class="text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 mb-2 px-1">Saved Bar Sets</h2>
          <BookmarksBars :added-bar="createdBar" :search-query="searchQuery" />
        </section>
      </div>
    </main>

    <div class="fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-xl transition-colors
                bg-white/90 border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]
                dark:bg-slate-900/90 dark:border-slate-800 dark:shadow-[0_-4px_20px_rgba(0,0,0,0.4)]">
      <div class="pb-3 pt-2 px-4">
        <div class="flex flex-col items-center">
          <div class="w-8 h-1 bg-slate-200 dark:bg-slate-700 rounded-full mb-3"></div>
          
          <div class="w-full flex items-center justify-between gap-3">
            <div class="flex items-center gap-2.5">
              <div class="relative flex items-center justify-center w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-500/10">
                <span class="material-symbols-outlined text-blue-600 dark:text-blue-400 text-lg">cloud_sync</span>
                <div v-if="driveConnected" class="absolute top-0 right-0 w-2 h-2 rounded-full bg-emerald-500 border-2 border-white dark:border-slate-900"></div>
              </div>
              <div class="flex flex-col">
                <span class="text-[9px] uppercase tracking-wider font-bold text-slate-400 dark:text-slate-500">Last Backup</span>
                <span class="text-xs font-semibold text-slate-700 dark:text-slate-200">{{ backupStatusText }}</span>
              </div>
            </div>
            
            <button 
              @click="showBackupPanel = !showBackupPanel"
              class="text-xs font-semibold px-4 py-2 rounded-xl transition-all shadow-sm active:scale-95 flex items-center gap-2
                     bg-slate-900 text-white hover:bg-slate-800
                     dark:bg-blue-600 dark:hover:bg-blue-500"
            >
              <span class="material-symbols-outlined text-lg">settings</span>
              Manage
            </button>
          </div>
        </div>
      </div>
    </div>

    <div 
      v-if="showBackupPanel"
      class="fixed inset-0 z-50 bg-slate-900/20 dark:bg-black/60 backdrop-blur-sm"
      @click="showBackupPanel = false"
    >
      <div 
        class="fixed bottom-0 left-0 right-0 rounded-t-[32px] shadow-2xl max-h-[85vh] overflow-hidden flex flex-col transition-colors
               bg-white dark:bg-slate-900"
        @click.stop
      >
        <div class="pt-4 pb-2 flex flex-col items-center bg-inherit z-10">
          <div class="w-12 h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mb-4"></div>
          <div class="px-8 w-full flex justify-between items-end border-b border-slate-100 dark:border-slate-800 pb-4">
             <div>
                <h2 class="text-2xl font-bold text-slate-900 dark:text-white">Backup & Restore</h2>
                <p class="text-sm text-slate-500 dark:text-slate-400">Sync data locally or to the cloud</p>
             </div>
             <button @click="showBackupPanel = false" class="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 transition-colors">
                <span class="material-symbols-outlined text-slate-600 dark:text-slate-400">close</span>
             </button>
          </div>
        </div>
        
        <div class="px-6 flex-1 overflow-y-auto hide-scrollbar pb-12 pt-4 space-y-6">
          <div class="p-5 rounded-2xl border transition-colors
                      bg-blue-50/50 border-blue-100
                      dark:bg-slate-800/50 dark:border-slate-700/50">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-500/20 flex items-center justify-center text-blue-600 dark:text-blue-400">
                <span class="material-symbols-outlined text-2xl">cloud_sync</span>
              </div>
              <div>
                <p class="text-sm font-bold text-slate-900 dark:text-white">Google Drive</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">Automatic cloud sync</p>
              </div>
            </div>
            <DriveBackup @status-change="updateDriveStatus" />
          </div>

          <div class="p-5 rounded-2xl border transition-colors
                      bg-emerald-50/50 border-emerald-100
                      dark:bg-slate-800/50 dark:border-slate-700/50">
            <div class="flex items-center gap-4 mb-4">
              <div class="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
                <span class="material-symbols-outlined text-2xl">hard_drive</span>
              </div>
              <div>
                <p class="text-sm font-bold text-slate-900 dark:text-white">Local Storage</p>
                <p class="text-xs text-slate-500 dark:text-slate-400">Manual export & import</p>
              </div>
            </div>
            <Backup />
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
      isDark: false,
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
    await this.loadTheme();
  },
  methods: {
    create(bar: BookmarksBar) {
      this.createdBar = bar;
    },
    async loadTheme() {
      const result = await chrome.storage.local.get('theme');
      if (result.theme === 'dark' || (!result.theme && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        this.isDark = true;
      } else {
        this.isDark = false;
      }
      this.applyTheme();
    },
    toggleTheme() {
      this.isDark = !this.isDark;
      chrome.storage.local.set({ theme: this.isDark ? 'dark' : 'light' });
      this.applyTheme();
    },
    applyTheme() {
      if (this.isDark) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
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
