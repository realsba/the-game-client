<script setup>
defineProps(['modelValue']);
const emit = defineEmits(['update:modelValue']);

const close = () => {
  emit('update:modelValue', false);
};
</script>

<template>
  <v-alert :model-value="modelValue" color="error" title="Alert" max-width="30%">
    Connection loss. Try again.
    <div class="text-right">
      <v-btn color="yellow" @click="close">Ok</v-btn>
    </div>
  </v-alert>
</template>
