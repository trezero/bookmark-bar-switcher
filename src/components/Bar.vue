<template>
  <div 
    :class="[
      'px-3.5 py-3 rounded-xl transition-all mb-2 flex items-center justify-between gap-3 group relative overflow-hidden',
      isActive 
        ? 'bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-500/30 border shadow-sm' 
        : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md dark:bg-slate-800/40 dark:border-slate-700 dark:hover:bg-slate-800 dark:hover:border-slate-600 border'
    ]"
  >
    <div v-if="isActive" class="absolute left-0 top-0 bottom-0 w-1 bg-blue-500"></div>

    <div class="flex items-center gap-3 flex-1 min-w-0 ml-1">
      <span class="material-symbols-outlined text-[20px]" 
        :class="isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-400 dark:text-slate-500 group-hover:text-slate-600 dark:group-hover:text-slate-300'">
        {{ isActive ? 'folder_open' : 'folder' }}
      </span>
      
      <div class="flex flex-col min-w-0">
        <h3 class="text-sm font-semibold truncate leading-tight"
            :class="isActive ? 'text-blue-900 dark:text-blue-100' : 'text-slate-700 dark:text-slate-200'">
            {{ title }}
        </h3>
        <p class="text-[10px] truncate"
           :class="isActive ? 'text-blue-700/70 dark:text-blue-200/50' : 'text-slate-400 dark:text-slate-500'">
           {{ bookmarkCount }} bookmarks • Used {{ lastUsed }}
        </p>
      </div>
    </div>
    
    <div class="flex items-center gap-1 flex-shrink-0">
      <button 
        v-if="!isActive"
        @click="$emit('exchange')"
        class="opacity-0 group-hover:opacity-100 focus:opacity-100 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded-lg text-xs font-medium transition-all shadow-sm transform active:scale-95"
      >
        Switch
      </button>
      
      <button 
        v-if="isActive"
        class="text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-500/20 px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider cursor-default"
      >
        Active
      </button>

      <button 
        @click="$emit('edit')"
        class="p-1.5 rounded-lg transition-colors"
        :class="isActive ? 'text-blue-600/60 hover:text-blue-600 hover:bg-blue-100/50 dark:text-blue-400/50 dark:hover:bg-blue-500/20' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:text-slate-600 dark:hover:text-slate-300 dark:hover:bg-slate-700'"
        title="Edit"
      >
        <span class="material-symbols-outlined text-lg">more_vert</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';

export default defineComponent({
  props: {
    title: {
      type: String,
      required: true,
    },
    isActive: {
      type: Boolean,
      required: true,
    },
    bookmarkCount: {
      type: Number,
      default: 0,
    },
    lastUsed: {
      type: String,
      default: 'Never',
    },
  },
  emits: ['exchange', 'edit'],
});
</script>
