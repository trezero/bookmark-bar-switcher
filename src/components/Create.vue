<template>
  <div>
    <div class="relative flex items-center gap-2">
      <div class="relative flex-1">
        <input 
          v-model="inputValue"
          @keydown.enter="save"
          class="w-full rounded-xl py-2.5 pl-3 pr-10 text-sm focus:ring-2 focus:ring-blue-500/50 transition-all shadow-sm
                 bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400
                 dark:bg-slate-800 dark:border-slate-700 dark:text-white dark:placeholder:text-slate-500" 
          placeholder="Name your new set..." 
          type="text"
        />
        <div class="absolute right-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-slate-400 bg-slate-100 dark:bg-slate-700 px-1.5 py-0.5 rounded border border-slate-200 dark:border-slate-600">
          ENTER
        </div>
      </div>
      
      <button 
        @click="save"
        :disabled="!inputValue.trim()"
        class="w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-sm
               bg-blue-600 text-white hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 disabled:cursor-not-allowed
               dark:disabled:bg-slate-800 dark:disabled:text-slate-600"
        title="Create"
      >
        <span class="material-symbols-outlined text-xl">add</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { createBar } from '~/background/service.ts';
import { defineComponent } from 'vue';

export default defineComponent({
  emits: ['create'],
  data() {
    return { inputValue: '' };
  },
  methods: {
    async save() {
      if (this.inputValue.trim() === '') {
        return;
      }
      const createdBar = await createBar(this.inputValue.trim());
      this.$emit('create', createdBar);
      this.inputValue = '';
    },
  },
});
</script>
