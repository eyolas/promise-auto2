export function promiseDelay(delay) {
  return new Promise((resolve) => {
    setTimeout(() => resolve(), delay);
  });
}
