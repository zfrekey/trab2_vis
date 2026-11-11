// O store coordena brush, seleção e modo de cor sem acoplar as views entre si.
const state = {
  years: [1957, 2026],
  actor: null,
  sector: null,
  colorBy: "actor",
};
const listeners = new Set();

export function getState() {
  return { ...state };
}

export function setState(patch) {
  Object.assign(state, patch);
  for (const listener of listeners) listener(getState());
}

export function subscribe(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
