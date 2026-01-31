<template>
  <div 
    v-if="showWarning" 
    class="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6 relative"
  >
    <button 
      @click="dismissWarning"
      class="absolute top-3 right-3 text-amber-400 hover:text-amber-200 transition-colors"
    >
      <span class="material-symbols-outlined text-xl">close</span>
    </button>
    
    <div class="flex items-start gap-3 mb-3">
      <span class="material-symbols-outlined text-amber-400 text-2xl">warning</span>
      <div class="flex-1 pr-6">
        <h4 class="font-bold text-amber-200 mb-2">Bookmark Sync Detected</h4>
        <p class="text-sm text-amber-100 mb-2">
          Chrome bookmark sync is enabled and may corrupt your bookmark bars when switching. 
          For best results, disable bookmark sync in your Chrome settings.
        </p>
        <p class="text-xs text-amber-200/80">
          To disable: Copy and paste this URL into your address bar: 
          <code class="bg-amber-900/30 px-2 py-0.5 rounded text-amber-100">chrome://settings/syncSetup</code>
        </p>
      </div>
    </div>
    
    <label class="flex items-center gap-2 cursor-pointer text-sm text-amber-200">
      <input 
        type="checkbox" 
        v-model="dontShowAgain" 
        @change="handleDontShowAgain"
        class="w-4 h-4 rounded border-amber-500/50 bg-amber-900/30 text-amber-500 focus:ring-amber-500"
      />
      <span>Don't show this warning again</span>
    </label>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { isSyncEnabled } from '~/background/sync-detection.ts';

export default defineComponent({
  name: 'SyncWarning',
  data() {
    return {
      showWarning: false,
      dontShowAgain: false,
    };
  },
  async mounted() {
    await this.checkSyncStatus();
  },
  methods: {
    async checkSyncStatus() {
      const dismissed = await this.getWarningDismissed();
      if (dismissed) {
        return;
      }

      const syncEnabled = await isSyncEnabled();
      this.showWarning = syncEnabled;
    },
    async getWarningDismissed(): Promise<boolean> {
      const result = await chrome.storage.local.get('syncWarningDismissed');
      return result.syncWarningDismissed === true;
    },
    dismissWarning() {
      this.showWarning = false;
    },
    async handleDontShowAgain() {
      if (this.dontShowAgain) {
        await chrome.storage.local.set({ syncWarningDismissed: true });
      }
    },
  },
});
</script>
