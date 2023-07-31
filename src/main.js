import './style.css';

import Config from './Config.js';
import Game from './Game.js';

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
//game.stage.eventMode = 'static';
//game.stage.hitArea = game.screen;
document.body.appendChild(game.view);


//const game = new Game(app.stage, config);
game.startConnection('ws://127.0.0.1:9002');
const room = game._room;

//game.stage.onmousemove = (e) => {
  //console.log('Mouse moved');
  //console.log('X', e.data.global.x, 'Y', e.data.global.y);
//}

let elapsed = 0.0;
game.ticker.add((delta) => {
  const dt = delta / 60;
  room.update();
  room.infoPanel.fps = game.ticker.FPS;
  game.update();
});

const resizeHandler = () => {
  game.setScreenSize(window.innerWidth, window.innerHeight);
}

/*
window.addEventListener('keydown', (event) => {
  if (event.repeat) {
    return;
  }
  if (event.ctrlKey) {
    game.setMousePosition(true);
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
    // toggleStartDialog(); TODO: implement
  } else if (code === 'Space') {
    game.actionSplit($rootScope['pixiInteractionManager'].mouse.global);
  } else if (keyCode == 48) {
    game.resetScale();
  } else if (keyCode == 81 || keyCode == 87) {
    game.actionEject($rootScope['pixiInteractionManager'].mouse.global);
  } else if (keyCode == 187) {
    game.incScale();
  } else if (keyCode == 189) {
    game.decScale();
  }
});

window.addEventListener('keyup', (event) => {
  console.log('keyup', event.keyCode, event.code);
});
*/

window.onresize = resizeHandler;
resizeHandler();