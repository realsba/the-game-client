<script setup>
import { defineEmits } from 'vue';

defineProps({model: Boolean});

const close = () => {
   defineEmits().emit('close-alert');
};
</script>

<template>
  <v-alert :model-value="model" color="error" title="Alert" max-width="30%">
    Connection loss. Try again.
    <div class="text-right">
      <v-btn color="yellow" @click="close">Ok</v-btn>
    </div>
  </v-alert>
</template>
