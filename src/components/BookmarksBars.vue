<template>
  <div>
    <Container
      lock-axis="y"
      :animation-duration="400"
      drag-class="cursor-move"
      @drop="reorder"
      @drag-start="removeActive"
      @drag-end="addActive"
    >
      <Draggable v-for="(bar, index) in filteredBars" :key="index">
        <Bar
          v-if="!bar.isEdited"
          :title="bar.title"
          :is-active="bar.isActive"
          :bookmark-count="bar.bookmarkCount || 0"
          :last-used="formatLastUsed(bar.lastUsed)"
          @exchange="exchange(bar.id)"
          @edit="customBars[index].isEdited = true"
        />
        <Edit
          v-else
          :is-last="customBars.length < 2"
          :bar-id="bar.id"
          :initial-value="bar.title"
          @rename="
            (updatedTitle: string) => {
              customBars[index].title = updatedTitle;
              customBars[index].isEdited = false;
            }
          "
          @remove="
            {
              showPopup = true;
              setRemoveCandidate(bar, index);
            }
          "
        />
      </Draggable>
    </Container>
    
    <div v-if="filteredBars.length === 0 && searchQuery" class="text-center py-8">
      <span class="material-symbols-outlined text-slate-600 text-5xl mb-3">search_off</span>
      <p class="text-slate-400">No bar sets match your search</p>
    </div>

    <div 
      v-if="showPopup"
      class="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center"
      @click="showPopup = false"
    >
      <div 
        class="bg-slate-800 border border-slate-700 rounded-2xl p-6 max-w-sm mx-4 shadow-2xl"
        @click.stop
      >
        <h3 class="text-lg font-bold mb-2">Remove Bar Set?</h3>
        <p class="text-sm text-slate-400 mb-6">
          This will permanently delete this bookmark bar and all of its bookmarks.
        </p>
        <div class="flex gap-3">
          <button 
            @click="showPopup = false"
            class="flex-1 bg-slate-700 hover:bg-slate-600 text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
          >
            Cancel
          </button>
          <button 
            @click="remove"
            class="flex-1 bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 rounded-xl text-sm transition-all"
          >
            Remove
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
// @ts-nocheck
import { type BookmarksBar, BookmarksBarPopup, RemoveCandidate } from 'bookmarks';
import { Container, Draggable, type DropResult } from 'vue-dndrop';
import { defineComponent } from 'vue';
import { exchangeBars, removeBar, reorderBars } from '~/background/service.ts';
import Bar from '~/components/Bar.vue';
import Edit from '~/components/Edit.vue';
import { getActiveBar } from '~/background/storage.ts';
import { getCustomBars } from '~/background/util.ts';

export default defineComponent({
  name: 'BookmarksBars',
  components: { Edit, Bar, Draggable, Container },
  props: { 
    addedBar: { type: Object, required: true },
    searchQuery: { type: String, default: '' },
  },
  data() {
    return {
      customBars: [] as any[],
      removeCandidate: {} as any,
      showPopup: false,
      activeBarId: '',
    };
  },
  computed: {
    filteredBars() {
      if (!this.searchQuery.trim()) {
        return this.customBars;
      }
      const query = this.searchQuery.toLowerCase();
      return this.customBars.filter((bar: any) => 
        bar.title.toLowerCase().includes(query)
      );
    },
  },
  watch: {
    addedBar: {
      immediate: true,
      handler(addedBar) {
        if (addedBar as BookmarksBar) {
          this.addBar(addedBar);
        }
      },
    },
  },
  async created() {
    const activeBar = await getActiveBar();
    this.activeBarId = activeBar.id;
    
    const customBars = await getCustomBars();
    this.customBars = await Promise.all(
      customBars.map(async (bar: any) => {
        const bookmarkCount = await this.getBookmarkCount(bar.id);
        return {
          ...bar,
          isActive: bar.id === this.activeBarId,
          isEdited: false,
          bookmarkCount,
          lastUsed: Date.now(),
        };
      })
    );
    chrome.storage.onChanged.addListener(async () => {
      const updatedActiveBar = await getActiveBar();
      this.activeBarId = updatedActiveBar.id;
      this.customBars.forEach((bar: any) => {
        bar.isActive = bar.id === this.activeBarId;
      });
    });
    chrome.commands.onCommand.addListener(() => this.cancelEdit());
  },
  methods: {
    async getBookmarkCount(barId: string) {
      try {
        const children = await chrome.bookmarks.getChildren(barId);
        return children.length;
      } catch {
        return 0;
      }
    },
    formatLastUsed(timestamp?: number) {
      if (!timestamp) return 'Never';
      
      const now = Date.now();
      const diffMs = now - timestamp;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Just now';
      if (diffMins < 60) return `${diffMins}m ago`;
      if (diffHours < 24) return `${diffHours}h ago`;
      if (diffDays === 1) return 'Yesterday';
      if (diffDays < 7) return `${diffDays}d ago`;
      return new Date(timestamp).toLocaleDateString();
    },
    addActive() {
      this.customBars.forEach((bar: any) => {
        bar.isActive = bar.id === this.activeBarId;
      });
    },
    removeActive() {
      this.customBars.forEach((bar: any) => {
        bar.isActive = bar.id === this.activeBarId;
      });
    },
    async reorder(dropResult: any) {
      this.customBars = await reorderBars(this.customBars, dropResult);
    },
    setRemoveCandidate(bar: any, index: number) {
      this.removeCandidate = {
        ...bar,
        index,
      };
    },
    async exchange(id: string) {
      await exchangeBars(id);
      this.customBars.forEach((bar: any) => {
        bar.isActive = bar.id === id;
        if (bar.id === id) {
          bar.lastUsed = Date.now();
        }
      });
    },
    async remove() {
      if (this.customBars.length < 2) {
        return;
      }
      await removeBar(this.removeCandidate.id);
      const activeBar = await getActiveBar();
      this.customBars.splice(this.removeCandidate.index, 1);
      this.customBars.forEach((bar: any) => {
        bar.isActive = bar.id === activeBar.id;
      });
      this.showPopup = false;
    },
    cancelEdit() {
      this.customBars.forEach((bar: any) => {
        bar.isEdited = false;
      });
    },
    addBar(bar: any) {
      this.customBars.push({
        ...bar,
        isActive: false,
        isEdited: false,
        bookmarkCount: 0,
        lastUsed: Date.now(),
      });
    },
  },
});
</script>
