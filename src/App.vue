<script setup>
import StartDialog from './components/StartDialog';
import ConnectionLossAlert from './components/ConnectionLossAlert';

import { ref, inject, onMounted } from 'vue';

const game = inject('game');
const showConnectionLossAlert = ref(false);

const onCloseConnectionLossAlert = () => {
  showConnectionLossAlert.value = false;
};

onMounted(() => {
  game.onConnectionLoss = () => {
    showConnectionLossAlert.value = true;
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
