<template>
  <div class="backup-section">
    <div class="d-grid gap-2 mb-3">
      <BButton variant="primary" @click="createManualBackup" :disabled="creating">
        {{ creating ? 'Creating backup...' : 'Create backup now' }}
      </BButton>

      <BButton variant="secondary" @click="showRestoreModal = true" :disabled="backupHistory.length === 0">
        Restore bookmarks
      </BButton>
    </div>

    <div v-if="backupHistory.length > 0" class="text-muted small">
      {{ backupHistory.length }} backup{{ backupHistory.length > 1 ? 's' : '' }} available
    </div>

    <BModal v-model="showRestoreModal" title="Restore from Backup" @ok="restoreSelected">
      <div v-if="backupHistory.length === 0">
        No backups available.
      </div>
      <BListGroup v-else>
        <BListGroupItem
          v-for="(backup, index) in backupHistory"
          :key="index"
          :active="selectedBackupIndex === index"
          @click="selectedBackupIndex = index"
          button
        >
          <div class="d-flex justify-content-between align-items-start">
            <div>
              <div><strong>{{ formatTime(backup.timestamp) }}</strong></div>
              <small class="text-muted">
                Active bar: {{ getBarTitle(backup.activeBarId, backup.bars) }}
              </small>
              <br>
              <small class="text-muted">
                {{ backup.bars.length }} bar{{ backup.bars.length > 1 ? 's' : '' }}
              </small>
            </div>
          </div>
        </BListGroupItem>
      </BListGroup>

      <BAlert variant="warning" show class="mt-3 mb-0">
        <small>
          <strong>Warning:</strong> Restoring will replace all current bookmark bars with the backup data.
        </small>
      </BAlert>
    </BModal>
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
