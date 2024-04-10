export default class Config {
  gridSize = 512;
  gridLineStyle = { width: 1, color: '#303030', alpha: 1 };
  borderLineStyle = { width: 2, color: '#808080', alpha: 0.75 };
  leaderboard = {
    stroke: { width: 1, color: '#777777', alpha: 1 },
    fill: { color: '#777777', alpha: 0.5 },
    title: {
      fontFamily: 'Junegull',
      fontSize: '22pt',
      fontWeight: 'bold',
      fill: '#A0A0A0',
      stroke: '#808080'
    },
    list: {
      number: { fontFamily: 'Arial', fontSize: '12pt', fill: '#777777', stroke: '#555555' },
      def: {
        fontFamily: 'Arial',
        fontSize: '16pt',
        fontWeight: 'bold',
        fill: '#999999',
        stroke: '#555555'
      },
      self: {
        fontFamily: 'Arial',
        fontSize: '16pt',
        fontWeight: 'bold',
        fill: '#BB8080',
        stroke: '#A04040'
      },
      mass: { fontFamily: 'Arial', fontSize: '10pt', fill: '#888888', stroke: '#555555' }
    }
  };
  infoPanel = {
    stroke: { width: 1, color: '#777777', alpha: 1 },
    fill: {color: '#777777', alpha: 0.5},
    label: {
      def: {
        fontFamily: 'Open Sans',
        fontSize: '14pt',
        fontWeight: 'bold',
        fill: '#BBBBBB',
        stroke: '#808080'
      },
      good: {
        fontFamily: 'Open Sans',
        fontSize: '14pt',
        fontWeight: 'bold',
        fill: '#BBBBBB',
        stroke: '#008000'
      },
      normal: {
        fontFamily: 'Open Sans',
        fontSize: '14pt',
        fontWeight: 'bold',
        fill: '#BBBBBB',
        stroke: '#000000',
      },
      bad: {
        fontFamily: 'Open Sans',
        fontSize: '14pt',
        fontWeight: 'bold',
        fill: '#BBBBBB',
        stroke: '#800000'
      }
    },
    connectionLabel: {
      fontFamily: 'Open Sans', fontSize: '12pt', fill: '#BBBBBB', stroke: '#808080'
    }
  };
  playerInfoPanel = {
    stroke: { width: 1, color: '#777777', alpha: 1 },
    fill: {color: '#777777', alpha: 0.5},
    label: {
      def: {
        fontFamily: 'Arial',
        fontSize: '12pt',
        fill: '#BBBBBB',
        stroke: '#000000'
      },
      property: {
        fontFamily: 'Arial',
        fontSize: '18pt',
        fontWeight: 'bold',
        fill: '#777777',
        stroke: '#000000'
      },
      lower: {
        fontFamily: 'Arial',
        fontSize: '18pt',
        fontWeight: 'bold',
        fill: '#BBBBBB',
        stroke: '#880000'
      },
      best: {
        fontFamily: 'Arial',
        fontSize: '18pt',
        fontWeight: 'bold',
        fill: '#BBBBBB',
        stroke: '#008800'
      },
      maxMass: {
        fontFamily: 'Arial',
        fontSize: '18pt',
        fontWeight: 'bold',
        fill: '#BBBBBB',
        stroke: '#000088',
      }
    }
  };
  directionPanel = {
    lineStyle: { width: 1, color: '#777777', alpha: 1 },
    fill: ['#777777', 0.5],
    label: {
      def: {
        fontFamily: 'Arial',
        fontSize: '20pt',
        fontWeight: 'bold',
        fill: '#BBBBBB',
        stroke: '#000000'
      }
    }
  };
  colors = [
    '#7BD148',
    '#5484ED',
    '#A4BDFC',
    '#46D6DB',
    '#7AE7BF',
    '#51B749',
    '#FBD75B',
    '#FFB878',
    '#FF887C',
    '#DC2127',
    '#DBADFF',
    '#E1E1E1',
    '#8B4513', // Mother
    '#32CD32', // Virus type I
    '#FF0000', // Virus type II
    '#0000FF'
  ];
}
