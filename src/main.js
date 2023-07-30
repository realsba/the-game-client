import './style.css';

import * as PIXI from 'pixi.js';
import Config from './Config.js';
import Game from './Game.js';

import { Avatar, Cell, CellDef, Virus } from "./Cell.js";

const app = new PIXI.Application({resizeTo: window});
document.body.appendChild(app.view);
const config = new Config();

const game = new Game(app.stage, config);
game.startConnection('ws://127.0.0.1:9002');
const room = game._room;

const def = new CellDef();
def.x = 300;
def.y = 300;
def.radius = 100;
def.color = 0xFF00FF;
def.name = '0xFF00FF';

const cell = new Avatar(room, def, 1);
cell.draw();

let elapsed = 0.0;
app.ticker.add((delta) => {
  const dt = delta / 60;
  room.update();
  room._infoPanel.fps = app.ticker.FPS; // TODO: do not use protected members
});

let resizeHandler = () => {
  room.setScreenSize(window.innerWidth, window.innerHeight);
}

window.onresize = resizeHandler;
//infoPanel.onResize = resizeHandler;
//playerInfoPanel.onResize = resizeHandler;

resizeHandler();