<script setup>
import {ref, inject} from 'vue';

const game = inject('game');
const config = inject('config');

const dialog = ref(true);
const colors = ref(config.colors.slice(0, 12));
const selectedColor = ref(config.colors[0]);
const selectedColorIndex = ref(0);
const name = ref('');

const show = () => {
  dialog.value = true;
};

const hide = () => {
  dialog.value = false;
};

const selectColor = (color, index) => {
  selectedColor.value = color;
  selectedColorIndex.value = index;
};

const play = () => {
  game.actionPlay(name.value, selectedColorIndex.value);
  hide();
};

const spectate = () => {
  game.actionSpectate(0);
  hide();
};
</script>

<template>
  <v-dialog v-model="dialog" activator="parent" width="auto">
    <v-card max-width="350">
      <v-card-title class="text-center">
        <v-icon left>mdi-account</v-icon>
        The Game
      </v-card-title>
      <v-card-subtitle>
        <v-row>
        <v-col>Player settings</v-col>
        <v-col class="text-right text-blue-grey">v1.0.0</v-col>
        </v-row>
      </v-card-subtitle>
      <v-card-text>
        <v-row align="center">
          <v-icon :color="selectedColor" size="60px">mdi-circle</v-icon>
          <v-text-field clearable label="Name" v-model="name"></v-text-field>
        </v-row>
        <v-row>
          <v-col
              v-for="(color, index) in colors"
              :key="index"
              cols="3"
              md="3"
              sm="4"
              class="pa1-1"
          >
            <v-btn :color="color" class="ma1-0" @click="selectColor(color, index)" />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn color="primary" @click="play">Play</v-btn>
        <v-btn color="secondary" @click="spectate">Spectate</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<style>
</style>
