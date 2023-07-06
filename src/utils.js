export function delayed_call(func, timeout = 250) {
  let timer;
  return (...args) => {
    if (timer) {
      return;
    }
    clearTimeout(timer);
    timer = setTimeout(() => {
      timer = undefined;
      func.apply(this, args);
    }, timeout);
  };
}