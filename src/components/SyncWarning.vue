<template>
  <BAlert v-if="showWarning" variant="warning" dismissible @close="dismissWarning" class="mb-2">
    <div class="d-flex align-items-start">
      <div class="flex-grow-1">
        <strong>⚠️ Bookmark Sync Detected</strong>
        <p class="mb-2 mt-1">
          Chrome bookmark sync is enabled and may corrupt your bookmark bars when switching. 
          For best results, disable bookmark sync in your Chrome settings.
        </p>
        <small class="text-muted">
          To disable: Copy and paste this URL into your address bar: 
          <code>chrome://settings/syncSetup</code>
        </small>
      </div>
    </div>
    <div class="mt-2">
      <BFormCheckbox v-model="dontShowAgain" @change="handleDontShowAgain">
        Don't show this warning again
      </BFormCheckbox>
    </div>
  </BAlert>
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
