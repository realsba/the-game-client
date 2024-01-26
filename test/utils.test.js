import { expect } from 'chai';
import sinon from 'sinon';
import { delayed_call } from '../src/utils.js';

describe('delayed_call', () => {
  let clock;

  beforeEach(() => {
    clock = sinon.useFakeTimers();
  });

  afterEach(() => {
    clock.restore();
  });

  it('should call the function after the specified timeout', async () => {
    const callback = sinon.spy();

    const delayedFunction = delayed_call(callback, 250);
    delayedFunction(1, 2, 3);

    clock.tick(249);
    expect(callback.notCalled).to.be.true;

    clock.tick(1);
    expect(callback.calledOnce).to.be.true;
    expect(callback.calledWith(1, 2, 3)).to.be.true;
  });

  it('should not call the function if called again within the timeout', async () => {
    const callback = sinon.spy();

    const delayedFunction = delayed_call(callback, 250);
    delayedFunction(1, 2, 3);

    clock.tick(100);
    delayedFunction(4, 5, 6);

    clock.tick(150);
    expect(callback.calledOnce).to.be.true;
  });

  it('should use the latest arguments if called again within the timeout', async () => {
    const callback = sinon.spy();

    const delayedFunction = delayed_call(callback, 250);
    delayedFunction(1, 2, 3);
    delayedFunction(4, 5, 6);

    clock.tick(250);
    expect(callback.calledOnce).to.be.true;
    expect(callback.calledWith(4, 5, 6)).to.be.true;
  });

  it('should call the function only once after the timeout expires', async () => {
    const callback = sinon.spy();

    const delayedFunction = delayed_call(callback, 250);
    delayedFunction(1, 2, 3);

    clock.tick(250);
    expect(callback.calledOnce).to.be.true;

    clock.tick(500);
    expect(callback.calledOnce).to.be.true;
  });

  it('should call the function immediately with zero timeout', async () => {
    const callback = sinon.spy();

    const delayedFunction = delayed_call(callback, 0);
    delayedFunction(1, 2, 3);

    clock.tick(0);
    expect(callback.calledOnce).to.be.true;
    expect(callback.calledWith(1, 2, 3)).to.be.true;
  });

});
