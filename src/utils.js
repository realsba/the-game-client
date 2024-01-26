export function delayed_call(func, timeout = 250) {
  let timer;
  let lastArgs;
  return (...args) => {
    lastArgs = args;
    if (timer) {
      return;
    }
    timer = setTimeout(() => {
      timer = undefined;
      func.call(this, ...lastArgs);
    }, timeout);
  };
}