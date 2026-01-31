<template>
  <div 
    :class="[
      'px-3 py-2 rounded-lg glass transition-all mb-1 flex items-center justify-between gap-3 shadow-sm',
      isActive 
        ? 'bg-primary/10 border border-primary/30 dark:bg-primary/10 dark:border-primary/30 bg-gradient-to-r from-indigo-100 to-purple-100 border-indigo-300' 
        : 'bg-card-dark dark:bg-card-dark bg-white border border-slate-800/50 dark:border-slate-800/50 border-indigo-100 hover:border-slate-700 dark:hover:border-slate-700 hover:border-indigo-300 hover:shadow-md'
    ]"
  >
    <div class="flex items-center gap-2 flex-1 min-w-0">
      <h3 class="text-sm font-semibold truncate text-slate-100 dark:text-slate-100 text-slate-900">{{ title }}</h3>
      <span 
        v-if="isActive"
        class="bg-primary text-[8px] px-1.5 py-0.5 rounded uppercase font-bold text-white tracking-wider flex-shrink-0"
      >
        Active
      </span>
    </div>
    
    <div class="flex items-center gap-1.5 flex-shrink-0">
      <button 
        v-if="isActive"
        class="bg-primary/20 text-primary border border-primary/20 font-semibold px-3 py-1 rounded-lg text-[11px] cursor-default whitespace-nowrap dark:bg-primary/20 dark:text-primary dark:border-primary/20 bg-indigo-200 text-indigo-700 border-indigo-300"
      >
        Currently Active
      </button>
      <button 
        v-else
        @click="$emit('exchange')"
        class="bg-slate-800/80 dark:bg-slate-800/80 bg-gradient-to-r from-indigo-500 to-purple-500 hover:bg-slate-700 dark:hover:bg-slate-700 hover:from-indigo-600 hover:to-purple-600 text-slate-100 dark:text-slate-100 text-white font-semibold px-3 py-1 rounded-lg text-[11px] transition-all flex items-center gap-1 whitespace-nowrap shadow-sm"
      >
        <span class="material-symbols-outlined text-sm">swap_horiz</span>
        Switch
      </button>
      
      <button 
        @click="$emit('edit')"
        class="text-slate-500 dark:text-slate-500 text-indigo-600 p-1 hover:text-slate-300 dark:hover:text-slate-300 hover:text-indigo-800 transition-colors"
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
