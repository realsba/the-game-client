<script setup>
import StartDialog from './components/StartDialog';
import ConnectionLossAlert from './components/ConnectionLossAlert';

import { ref, inject, onMounted } from 'vue';

const game = inject('game');
const showConnectionLossAlert = ref(false);
const showStartDialog = ref(false);
const playStatus = ref(false);

const onCloseConnectionLossAlert = () => {
  showConnectionLossAlert.value = false;
  game.startConnection('ws://192.168.0.120:9002');
};

onMounted(() => {
  game.onConnectionLoss = () => {
    showConnectionLossAlert.value = true;
  };
  game.onPlay = () => {
    console.log('onPlay');
    playStatus.value = false;
  };
  game.onSpectate = () => {
    console.log('onSpectate')
    playStatus.value = true;
  };
  game.onFinish = () => {
    console.log('onFinish')
    playStatus.value = true;
  };
});
</script>

<template>
  <div>
    <v-app>
      <v-container>
        <ConnectionLossAlert :model="showConnectionLossAlert" @close="onCloseConnectionLossAlert" />
        <StartDialog ref="startDialog" />
      </v-container>
    </v-app>
  </div>
</template>
