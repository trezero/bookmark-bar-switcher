<template>
  <main style="min-width: max-content" class="m-2">
    <SyncWarning />
    
    <BookmarksBars :added-bar="createdBar" />
    <Create class="mt-2" @create="create" />

    <div class="mt-3 border-top pt-3">
      <div class="d-flex align-items-center justify-content-between mb-2" @click="toggleBackupSection" style="cursor: pointer">
        <strong>⚙️ Backup & Restore</strong>
        <span>{{ backupSectionExpanded ? '▼' : '▶' }}</span>
      </div>

      <BCollapse v-model="backupSectionExpanded">
        <div class="backup-content">
          <h6 class="mb-2">Local Backups</h6>
          <Backup />

          <hr class="my-3">

          <h6 class="mb-2">Google Drive Backups</h6>
          <DriveBackup />
        </div>
      </BCollapse>
    </div>
  </main>
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
      backupSectionExpanded: false,
    };
  },
  methods: {
    create(bar: BookmarksBar) {
      this.createdBar = bar;
    },
    toggleBackupSection() {
      this.backupSectionExpanded = !this.backupSectionExpanded;
    },
  },
});
</script>
