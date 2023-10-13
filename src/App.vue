<script setup>
import StartDialog from './components/StartDialog';
import ConnectionLossAlert from './components/ConnectionLossAlert';

import { ref, inject, onMounted, onBeforeMount, onBeforeUnmount } from 'vue';

const game = inject('game');
const config = inject('config');

const showConnectionLossAlert = ref(false);
const showStartDialog = ref(false);

const colors = ref(config.colors.slice(0, 12));
const name = ref('sba');
const colorIndex = ref(0);

const playStatus = ref(false);

const handleKeyPress = (event) => {
  const keyCode = event.code;

  if (keyCode === 'Escape') {
    showStartDialog.value = !showConnectionLossAlert.value;
  }
}

function updateConnectionLossAlert(value) {
  if (!value) {
    game.startConnection('ws://192.168.0.120:9002');
  }
}

function onPlay(name, colorIndex) {
  game.actionPlay(name, colorIndex);
}

function onSpectate() {
  game.actionSpectate(0);
}

onMounted(() => {
  game.onConnectionLoss = () => {
    showConnectionLossAlert.value = true;
    showStartDialog.value = false;
  };

  game.onPlay = () => {
    playStatus.value = false;
  };

  game.onSpectate = () => {
    playStatus.value = true;
  };

  game.onFinish = function () {
    showStartDialog.value = true;
    playStatus.value = true;
  };
});

onBeforeMount(() => {
  window.addEventListener('keyup', handleKeyPress);
});

onBeforeUnmount(() => {
  window.removeEventListener('keyup', handleKeyPress);
});
</script>

<template>
  <div>
    <v-app>
      <v-container>
        <ConnectionLossAlert v-model="showConnectionLossAlert" @update:modelValue="updateConnectionLossAlert" />
        <StartDialog
            v-model="showStartDialog"
            v-model:name="name"
            v-model:color-index="colorIndex"
            :colors="colors"
            @play="onPlay"
            @spectate="onSpectate"
        />
      </v-container>
    </v-app>
  </div>
</template>