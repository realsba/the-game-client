import { TEXT_GRADIENT } from 'pixi.js';

export default class Config {
  gridSize = 512;
  gridLineStyle = { width: 1, color: 0x303030, alpha: 1 };
  borderLineStyle = { width: 2, color: 0x808080, alpha: 0.75 };
  leaderboard = {
    lineStyle: { width: 1, color: 0x777777, alpha: 1 },
    fill: [0x777777, 0.5],
    title: {
      fontFamily: 'Junegull',
      fontSize: '16pt',
      fill: [0x505050, 0xA0A0A0],
      fillGradientType: TEXT_GRADIENT.LINEAR_VERTICAL,
      stroke: 0x303030,
      strokeThickness: 2,
      align: 'center'
    },
    list: {
      def: { fontFamily: 'Arial', fontSize: '16pt', fill: '#999999', stroke: '#555555', strokeThickness: 1 },
      self: { fontFamily: 'Arial', fontSize: '16pt', fill: '#BB8080', stroke: '#A04040', strokeThickness: 1 },
      mass: { font: 'italic 12pt Arial', fill: '#888888', stroke: '#555555', strokeThickness: 1, valign: 'bottom'}
    }
  };
  infoPanel = {
    lineStyle: { width: 1, color: 0x777777, alpha: 1 },
    fill: [0x777777, 0.5],
    label: {
      def: { font: '14pt Open Sans', fill: '#BBBBBB', stroke: '#808080', strokeThickness: 2 },
      good: { font: 'bold 14pt Open Sans', fill: '#BBBBBB', stroke: '#008000', strokeThickness: 2 },
      normal: { font: 'bold 14pt Open Sans', fill: '#BBBBBB', stroke: '#000000', strokeThickness: 2 },
      bad: { font: 'bold 14pt Open Sans', fill: '#BBBBBB', stroke: '#800000', strokeThickness: 2 }
    },
    connectionLabel: {
      fontFamily: 'Open Sans',
      fontSize: '12pt',
      fill: 0xBBBBBB,
      stroke: 0x808080,
      strokeThickness: 1,
      align: 'center'
    }
  };
  playerInfoPanel = {
    lineStyle: { width: 1, color: 0x777777, alpha: 1 },
    fill: [0x777777, 0.5],
    label: {
      def: { font: 'bold 18pt Arial', fill: '#BBBBBB', stroke: '#000000', strokeThickness: 2 },
      property: { font: 'bold 18pt Arial', fill: '#777777', stroke: '#000000', strokeThickness: 2 },
      lower: { font: 'bold 18pt Arial', fill: '#BBBBBB', stroke: '#880000', strokeThickness: 2 },
      best: { font: 'bold 18pt Arial', fill: '#BBBBBB', stroke: '#008800', strokeThickness: 2 },
      maxMass: { font: 'bold 18pt Arial', fill: '#BBBBBB', stroke: '#000088', strokeThickness: 2 }
    }
  };
  directionPanel = {
    lineStyle: { width: 1, color: 0x777777, alpha: 1 },
    fill: [0x777777, 0.5],
    label: {
      def: { font: 'bold 20pt Arial', fill: '#BBBBBB', stroke: '#000000', strokeThickness: 2 }
    }
  };
  colors = [
    0x7BD148,
    0x5484ED,
    0xA4BDFC,
    0x46D6DB,
    0x7AE7BF,
    0x51B749,
    0xFBD75B,
    0xFFB878,
    0xFF887C,
    0xDC2127,
    0xDBADFF,
    0xE1E1E1,
    0x8B4513, // Mother
    0x32CD32, // Virus type I
    0xFF0000, // Virus type II
    0x0000FF
  ];
}
