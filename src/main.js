import './style.css';

import * as PIXI from 'pixi.js';
import Config from './Config.js';
import Game from './Game.js';

const app = new PIXI.Application({resizeTo: window});
document.body.appendChild(app.view);
const config = new Config();

const game = new Game(app.stage, config);
game.startConnection('ws://127.0.0.1:9002');
const room = game._room;

let elapsed = 0.0;
app.ticker.add((delta) => {
  const dt = delta / 60;
  room.update();
  //room._infoPanel.fps = app.ticker.FPS; // TODO: do not use protected members
  game.update();
});

const resizeHandler = () => {
  game.resize(window.innerWidth, window.innerHeight);
}

import { Button } from '@pixi/ui';
const buttonView = new PIXI.Graphics().beginFill(0x506000).drawRoundedRect(0, 0, 100, 40, 5);
const text = new PIXI.Text('🤙', { fontSize: 30 });
text.anchor.set(0.5);
text.x = buttonView.width / 2;
text.y = buttonView.height / 2;
buttonView.addChild(text);
buttonView.x = 500;
buttonView.y = 50;
const button = new Button(buttonView);
app.stage.addChild(buttonView);
button.onPress.connect(() => console.log('Button pressed!'));


window.onresize = resizeHandler;
resizeHandler();