import { MovingAverage } from '../src/InfoPanel.js';

describe('MovingAverage', () => {
  describe('value()', () => {
    it('should return 3', () => {
      const average = new MovingAverage();
      average.push(1);
      average.push(1);
      average.push(1);
      average.push(1);
      average.push(1);
      average.push(5);
      average.push(5);
      average.push(5);
      average.push(5);
      average.push(5);
      average.value().should.equal(3);
    });
    it('should return "--"', () => {
      const average = new MovingAverage();
      average.value().should.equal('--');
    });
  });
});
