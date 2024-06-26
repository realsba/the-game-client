import './style.css';

import Config from './Config.js';
import Game from './Game.js';

import App from './App.vue';
import { createApp } from 'vue';
import { registerPlugins } from '@/plugins';

const config = new Config();
const game = new Game(config);

await game.init({
  resizeTo: window,
  antialias: true,
  autoDensity: true,
  resolution: 2
});

const app = createApp(App);
registerPlugins(app);
app.provide('game', game);
app.provide('config', config);
app.mount('#app');

document.body.appendChild(game.canvas);
game.stage.eventMode = 'static';
game.stage.hitArea = game.screen;
game.startConnection('ws://thegame:3333');
game.stage.onmousemove = (e) => {
  game.setMousePosition(e.data.global);
}

game.ticker.add(() => {
  game.room.infoPanel.fps = game.ticker.FPS;
  game.update();
});

const resizeHandler = () => {
  game.setScreenSize(window.innerWidth, window.innerHeight);
}

window.onresize = resizeHandler;

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
  if (code === 'Space') {
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

resizeHandler();
