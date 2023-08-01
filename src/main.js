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
const room = game._room; // TODO: avoid using protected members
document.body.appendChild(game.view);
game.stage.eventMode = 'static';
game.stage.hitArea = game.screen;
game.startConnection('ws://127.0.0.1:9002');
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
    // toggleStartDialog(); TODO: implement
  } else if (code === 'Space') {
    //game.actionSplit($rootScope['pixiInteractionManager'].mouse.global);
  } else if (code === 'Digit0') {
    game.resetScale();
  // } else if (code == 81 || code == 87) {
  //   game.actionEject($rootScope['pixiInteractionManager'].mouse.global);
  } else if (code === 'Equal') {
    game.incScale();
  } else if (code === 'Minus') {
    game.decScale();
  }
});

resizeHandler();