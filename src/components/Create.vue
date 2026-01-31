<template>
  <div>
    <div class="relative flex items-center gap-1.5">
      <input 
        v-model="inputValue"
        @keydown.enter="save"
        class="flex-1 bg-slate-900/40 border border-slate-800/50 rounded-lg py-1.5 px-2.5 text-xs focus:ring-1 focus:ring-primary transition-all placeholder:text-slate-600" 
        placeholder="Set name (e.g. 'Project Alpha')" 
        type="text"
      />
      <button 
        @click="save"
        :disabled="!inputValue.trim()"
        :class="[
          'w-8 h-8 rounded-lg flex items-center justify-center transition-colors shadow-lg',
          inputValue.trim() 
            ? 'bg-primary hover:bg-blue-600 shadow-primary/20' 
            : 'bg-slate-800 cursor-not-allowed opacity-50'
        ]"
        title="Create new bar set"
      >
        <span class="material-symbols-outlined text-white text-lg">add</span>
      </button>
    </div>
    <p class="text-[9px] text-slate-500 mt-1 px-0.5">
      Current browser bar will be captured into this new set.
    </p>
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
