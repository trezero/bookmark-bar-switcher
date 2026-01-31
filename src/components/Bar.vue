<template>
  <div 
    :class="[
      'p-4 rounded-2xl glass transition-all mb-4',
      isActive 
        ? 'bg-primary/10 border border-primary/30' 
        : 'bg-card-dark border border-slate-800/50 hover:border-slate-700'
    ]"
  >
    <div class="flex justify-between items-start mb-4">
      <div class="flex-1">
        <div class="flex items-center gap-2 mb-1">
          <h3 class="text-lg font-bold">{{ title }}</h3>
          <span 
            v-if="isActive"
            class="bg-primary text-[10px] px-1.5 py-0.5 rounded uppercase font-bold text-white tracking-wider"
          >
            Active
          </span>
        </div>
        <p class="text-xs text-slate-400 font-light">
          {{ bookmarkCount }} bookmark{{ bookmarkCount !== 1 ? 's' : '' }} • Last used {{ lastUsed }}
        </p>
      </div>
      <button 
        @click="$emit('edit')"
        class="text-slate-500 p-1 hover:text-slate-300 transition-colors"
        title="Edit"
      >
        <span class="material-symbols-outlined">more_vert</span>
      </button>
    </div>
    
    <button 
      v-if="isActive"
      class="w-full bg-primary/20 text-primary border border-primary/20 font-semibold py-2.5 rounded-xl text-sm cursor-default"
    >
      Currently Active
    </button>
    <button 
      v-else
      @click="$emit('exchange')"
      class="w-full bg-slate-800/80 hover:bg-slate-700 text-slate-100 font-semibold py-2.5 rounded-xl text-sm transition-all flex items-center justify-center gap-2"
    >
      <span class="material-symbols-outlined text-lg">swap_horiz</span>
      Switch to this bar
    </button>
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
