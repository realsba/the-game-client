import * as PIXI from 'pixi.js';

import './style.css';

const app = new PIXI.Application({resizeTo: window});
document.body.appendChild(app.view);

const graphics = new PIXI.Graphics();
app.stage.addChild(graphics);
graphics.beginFill(0xDE3249);
graphics.drawCircle(150, 150, 100);
graphics.endFill();

