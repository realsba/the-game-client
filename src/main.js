import * as PIXI from 'pixi.js';
import Config from './Config';
import InfoPanel from './InfoPanel';
import DirectionPanel from './DirectionPanel';
import PlayerInfoPanel from './PlayerInfoPanel';
import Leaderboard from './Leaderboard';
import Room from './Room';

import './style.css';

const app = new PIXI.Application({resizeTo: window});
document.body.appendChild(app.view);

const config = new Config();
const room = new Room(app.stage, config);

let infoPanel = new InfoPanel(room, config.infoPanel);
infoPanel.x = 8;
infoPanel.y = 8;

let leaderboard = new Leaderboard(room, config.leaderboard);
leaderboard.x = 8;
leaderboard.y = 8;
leaderboard.items = [{id: 1, name: 'sba', mass: 32}, {id: 2, name: 'Ura', mass: 32}];

let playerInfoPanel = new PlayerInfoPanel(room, config.playerInfoPanel);
playerInfoPanel.x = 8;

let elapsed = 0.0;
app.ticker.add((delta) => {
  elapsed += delta;
  //graphics.x = 200.0 + Math.cos(elapsed/100.0) * 200.0;
  //graphics.y = 200.0 + Math.sin(elapsed/100.0) * 200.0;
});

let resizeHandler = () => {
  infoPanel.x = window.innerWidth - infoPanel.width - 8;
  playerInfoPanel.y = window.innerHeight - playerInfoPanel.height - 8;
  room.drawGrid();
}

window.onresize = resizeHandler;
infoPanel.onResize = resizeHandler;
playerInfoPanel.onResize = resizeHandler;

resizeHandler();