import './style.css';

import Config from './Config.js';
import Game from './Game.js';

import App from './App.vue';
import { createApp, ref } from 'vue';
import { registerPlugins } from '@/plugins';

const app = createApp(App);
registerPlugins(app);
const vm = app.mount('#app');

const config = new Config();
const game = new Game(
  {
    resizeTo: window,
    antialias: true,
    autoDensity: true,
    resolution: 2
  },
  config
);
const room = game._room; // TODO: avoid using protected members
document.body.appendChild(game.view);
game.stage.eventMode = 'static';
game.stage.hitArea = game.screen;
//game.startConnection('ws://127.0.0.1:9002');
game.startConnection('ws://192.168.0.120:9002');
game.stage.onmousemove = (e) => {
  game.setMousePosition(e.data.global);
}

let elapsed = 0.0;
game.ticker.add((delta) => {
  const dt = delta / 60;
  room.infoPanel.fps = game.ticker.FPS;
  game.update();
});

const resizeHandler = () => {
  game.setScreenSize(window.innerWidth, window.innerHeight);
}

window.onresize = resizeHandler;

function showStartDialog() {
  const startDialog = vm.$refs.startDialog;
  startDialog.show();
}

window.addEventListener('keydown', (event) => {
  if (event.repeat) {
    return;
  }
  const code = event.code;
  if (code === 'Enter') {
    // TODO: implement
    // if ($rootScope['chatMode']) {
    //   const text = $rootScope['chatInput'];
    //   if (text.length > 0) {
    //     game.chatMessage(text);
    //     $rootScope['chatInput'] = '';
    //   }
    // }
    // $rootScope['toggleChat']();
    return;
  }
  // TODO: implement
  // if ($rootScope['chatMode']) {
  //   if (code === 'Escape') {
  //     $rootScope['toggleChat']();
  //   }
  //   return;
  // }
  if (code === 'Escape') {
    showStartDialog();
  } else if (code === 'Space') {
    game.actionSplit();
  } else if (code === 'Digit0') {
    game.resetScale();
  } else if (code === 'KeyQ' || code === 'KeyW') {
    game.actionEject();
  } else if (code === 'Equal') {
    game.incScale();
  } else if (code === 'Minus') {
    game.decScale();
  }
});

window.play = (name, color) => game.actionPlay(name, color);
window.help = () => console.log('To start the game, run play(name, color) in the console');

resizeHandler();
