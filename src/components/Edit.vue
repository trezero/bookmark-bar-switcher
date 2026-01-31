<template>
  <div class="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/50 mb-4">
    <div class="flex items-center gap-2">
      <input 
        v-model="inputValue"
        @keydown.enter="rename(barId, inputValue)"
        @focus="selectAll"
        class="flex-1 bg-slate-900/60 border border-slate-700/50 rounded-xl py-2.5 px-4 text-sm focus:ring-1 focus:ring-primary transition-all"
        type="text"
      />
      <button 
        @click="rename(barId, inputValue)"
        :disabled="!inputValue.trim()"
        class="w-10 h-10 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center transition-colors"
        title="Save"
      >
        <span class="material-symbols-outlined text-white text-xl">save</span>
      </button>
      <button 
        v-if="!isLast"
        @click="remove"
        class="w-10 h-10 rounded-xl bg-red-600 hover:bg-red-700 flex items-center justify-center transition-colors"
        title="Remove"
      >
        <span class="material-symbols-outlined text-white text-xl">delete</span>
      </button>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue';
import { renameBar } from '~/background/service.ts';

export default defineComponent({
  props: {
    isLast: {
      type: Boolean,
      required: true,
    },
    barId: {
      type: String,
      required: true,
    },
    initialValue: {
      type: String,
      required: true,
    },
  },
  emits: ['rename', 'remove'],
  data() {
    return { inputValue: this.initialValue };
  },
  methods: {
    async rename(id: string, value: string) {
      if (this.inputValue.trim() === '') {
        return;
      }
      await renameBar(id, value);
      this.$emit('rename', this.inputValue);
    },
    remove() {
      this.$emit('remove');
    },
    selectAll(event: Event) {
      const target = event.target as HTMLInputElement;
      target.select();
    },
  },
});
</script>
