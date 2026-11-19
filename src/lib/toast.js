/** Tiny toast bus: toast("Email copied") from anywhere; <Toaster /> shows it. */
const listeners = new Set();
let id = 0;

export function toast(message, tone = "ok") {
  const item = { id: ++id, message, tone };
  listeners.forEach((fn) => fn(item));
}

export function onToast(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
