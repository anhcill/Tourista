'use client';

/** @returns {() => void} */
const unsubscribe = (fn) => () => { listeners.delete(fn); };

export const p2pModalBus = {
  publish(open) {
    listeners.forEach((fn) => fn(open));
  },
  subscribe(fn) {
    listeners.add(fn);
    return unsubscribe(fn);
  },
};
