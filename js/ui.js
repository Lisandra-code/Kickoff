// ui.js
// Small helpers for drawing screens.

// Makes text safe to put inside HTML. Everything typed by users or written by the AI
// goes through this, so nobody can inject their own HTML or scripts.
export function escape(text) {
  return String(text ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

// A short random id for members and ideas.
export function newId() {
  return Math.random().toString(36).slice(2, 10);
}

// Turns milliseconds into "mm:ss".
export function formatTime(ms) {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const minutes = String(Math.floor(totalSeconds / 60)).padStart(2, '0');
  const seconds = String(totalSeconds % 60).padStart(2, '0');
  return `${minutes}:${seconds}`;
}
