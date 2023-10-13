<script setup>
const props = defineProps(['modelValue', 'colors']);
const emit = defineEmits(['update:modelValue']);

const updateSelection = (index) => {
  emit('update:modelValue', index);
}

const isSelected = (index) => props.modelValue === index;
</script>

<template>
  <v-row>
    <v-col
      v-for="(color, index) in colors"
      :key="index"
      cols="3"
    >
      <v-btn
        :color="color"
        :class="{ selected: isSelected(index) }"
        @click="updateSelection(index)"
      />
    </v-col>
  </v-row>
</template>

<style>
.v-btn.selected {
  border: 1px solid #000;
}
</style>
