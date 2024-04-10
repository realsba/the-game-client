<script setup>
import ColorPicker from './ColorPicker.vue';

import { ref } from 'vue';

const props = defineProps(['modelValue', 'colors', 'name', 'colorIndex']);
const emit = defineEmits(['update:modelValue', 'play', 'spectate']);

const colorIndex = ref(props.colorIndex);
const name = ref('sba');

function play() {
  emit('play', name.value !== null ? name.value : '', colorIndex.value);
  closeDialog();
}

function spectate() {
  emit('spectate');
  closeDialog();
}

function closeDialog() {
  emit('update:modelValue', false);
}
</script>

<template>
  <v-dialog :model-value="modelValue" width="auto" persistent @keyup.enter="closeDialog">
    <v-card max-width="350">
      <v-card-title class="text-center">
        <v-icon left>mdi-account</v-icon>
        The Game
      </v-card-title>
      <v-card-subtitle>
        <v-row>
        <v-col>Player settings</v-col>
        <v-col class="text-right text-blue-grey">v0.8.3</v-col>
        </v-row>
      </v-card-subtitle>
      <v-card-text>
        <v-row align="center">
          <v-text-field clearable label="Name" v-model="name"></v-text-field>
        </v-row>
        <v-row>
          <ColorPicker v-model="colorIndex" :colors="colors"/>
        </v-row>
        <v-row>
          Move your mouse to control your cell
          Press Space to split
          Press W to eject some mass
        </v-row>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn color="primary" @click="play">Play</v-btn>
        <v-btn color="secondary" @click="spectate">Spectate</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
