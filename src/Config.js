/**
 * @constructor
 *  color - number
 *  lineStyle - [width, color, alpha]
 *  fill - [color, alpha]
 *  PIXI.MultiStyleText.style - {font: 'bold 32px Arial', fill: '#777777', stroke: '#000000', strokeThickness: 2, align: 'center'}
 */
function Config() {
  this.gridSize = 512;
  this.gridLineStyle = [3, 0x303030, 1];
  this.borderLineStyle = [5, 0x808080, 0.75];

  this.leaderboard = {
    _lineStyle: [1, 0x777777, 1],
    _fill: [0x777777, 0.5],
    _title: {
      'fontFamily': 'Junegull',
      'fontSize': '16pt',
      'fill': [0x505050, 0xA0A0A0],
      'fillGradientType': PIXI['TEXT_GRADIENT']['LINEAR_VERTICAL'],
      'stroke': 0x303030,
      'strokeThickness': 2,
      'align': 'center'
    },
    _list: {
      'def': { 'font': 'bold 16pt Arial', 'fill': '#999999', 'stroke': '#555555', 'strokeThickness': 1 },
      'self': { 'font': 'bold 16pt Arial', 'fill': '#BB8080', 'stroke': '#555555', 'strokeThickness': 1 },
      'mass': { 'font': 'italic 12pt Arial', 'fill': '#888888', 'stroke': '#555555', 'strokeThickness': 1, 'valign': 'bottom'}
    }
  };
  this.infoPanel = {
    _lineStyle: [1, 0x777777, 1],
    _fill: [0x777777, 0.5],
    _label: {
      'def': { 'font': '14pt Open Sans', 'fill': '#BBBBBB', 'stroke': '#808080', 'strokeThickness': 2 },
      'good': { 'font': 'bold 14pt Open Sans', 'fill': '#BBBBBB', 'stroke': '#008000', 'strokeThickness': 2 },
      'normal': { 'font': 'bold 14pt Open Sans', 'fill': '#BBBBBB', 'stroke': '#000000', 'strokeThickness': 2 },
      'bad': { 'font': 'bold 14pt Open Sans', 'fill': '#BBBBBB', 'stroke': '#800000', 'strokeThickness': 2 }
    },
    _connectionLabel: {
      'fontFamily': 'Open Sans',
      'fontSize': '12pt',
      'fill': 0xBBBBBB,
      'stroke': 0x808080,
      'strokeThickness': 1,
      'align': 'center'
    }
  };
  this.playerInfoPanel = {
    _lineStyle: [1, 0x777777, 1],
    _fill: [0x777777, 0.5],
    _label: {
      'def': { 'font': 'bold 18pt Arial', 'fill': '#BBBBBB', 'stroke': '#000000', 'strokeThickness': 2 },
      'property': { 'font': 'bold 18pt Arial', 'fill': '#777777', 'stroke': '#000000', 'strokeThickness': 2 },
      'lower': { 'font': 'bold 18pt Arial', 'fill': '#BBBBBB', 'stroke': '#880000', 'strokeThickness': 2 },
      'best': { 'font': 'bold 18pt Arial', 'fill': '#BBBBBB', 'stroke': '#008800', 'strokeThickness': 2 },
      'maxMass': { 'font': 'bold 18pt Arial', 'fill': '#BBBBBB', 'stroke': '#000088', 'strokeThickness': 2 }
    }
  };
  this.directionPanel = {
    _lineStyle: [1, 0x777777, 1],
    _fill: [0x777777, 0.5],
    _label: {
      'def': { 'font': 'bold 20pt Arial', 'fill': '#BBBBBB', 'stroke': '#000000', 'strokeThickness': 2 }
    }
  };
}

var colors = [
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
