<script>
export default {
  data() {
    return {
      dialog: false,
      colors: ['red', 'green', 'blue', 'yellow', 'orange', 'purple', 'pink', 'teal', 'indigo', 'cyan', 'lime', 'brown'],
      selectedColor: 'red',
    }
  },
  methods: {
    show() {
      this.dialog = true;
    },
    hide() {
      this.dialog = false;
    }
  }
}
</script>

<template>
  <v-dialog v-model="dialog" activator="parent" width="auto">
    <v-card max-width="350">
      <v-card-title class="text-center">
        <v-icon left>mdi-account</v-icon>
        The Game
      </v-card-title>
      <v-card-subtitle class="text-right text-blue-grey">v1.0.0</v-card-subtitle>
      <v-card-text>
        <v-row align="center">
          <v-icon :color="selectedColor" size="60px">mdi-circle</v-icon>
          <v-text-field clearable label="Name"></v-text-field>
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
            <v-btn :color="color" class="ma1-0" @click="selectedColor = color" />
          </v-col>
        </v-row>
      </v-card-text>
      <v-card-actions class="justify-end">
        <v-btn color="primary" @click="hide">Play</v-btn>
        <v-btn color="secondary" @click="hide">Spectate</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>
<style>
</style>
