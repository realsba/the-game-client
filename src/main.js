import './style.css';

import * as PIXI from 'pixi.js';
import Config from './Config';
import Room from './Room';

const app = new PIXI.Application({resizeTo: window});
document.body.appendChild(app.view);
const config = new Config();
const room = new Room(app.stage, config);

let elapsed = 0.0;
app.ticker.add((delta) => {
  const dt = delta / 60;
  room.update();
});

let resizeHandler = () => {
  //infoPanel.x = window.innerWidth - infoPanel.width - 8;
  //playerInfoPanel.y = window.innerHeight - playerInfoPanel.height - 8;
  room.setScreenSize(window.innerWidth, window.innerHeight);
}

window.onresize = resizeHandler;
//infoPanel.onResize = resizeHandler;
//playerInfoPanel.onResize = resizeHandler;

resizeHandler();