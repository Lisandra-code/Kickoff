// main.js
// The starting point of the app. It decides which screen to show
// and draws the step pills in the header.

import { state, save } from './state.js';
import { renderStart } from './screens/start.js';
import { renderBrief } from './screens/brief.js';
import { renderGroup } from './screens/group.js';
import { renderBrainstorm } from './screens/brainstorm.js';
import { renderVote } from './screens/vote.js';
import { renderSummary } from './screens/summary.js';

const screens = {
  start: renderStart,
  brief: renderBrief,
  group: renderGroup,
  brainstorm: renderBrainstorm,
  vote: renderVote,
  summary: renderSummary,
};

const steps = [
  { screen: 'brief', label: '1 Brief' },
  { screen: 'group', label: '2 Group' },
  { screen: 'brainstorm', label: '3 Brainstorm' },
  { screen: 'vote', label: '4 Choose' },
];

const app = document.getElementById('app');
const stepsNav = document.getElementById('steps');

// Every screen gets this function, so it can move to another screen.
export function go(screen) {
  state.screen = screen;
  save();
  render();
  window.scrollTo(0, 0);
}

function render() {
  // Screens can register a cleanup (for example to stop a timer) before the next screen is drawn.
  if (typeof app.cleanup === 'function') app.cleanup();
  app.cleanup = null;

  const draw = screens[state.screen] || renderStart;
  draw(app, go);
  renderSteps();
}

function renderSteps() {
  const current = state.screen === 'summary' ? 'vote' : state.screen;
  const currentIndex = steps.findIndex((s) => s.screen === current);
  stepsNav.innerHTML = steps
    .map((step, index) => {
      let className = 'step';
      if (index === currentIndex) className += ' is-active';
      else if (index < currentIndex) className += ' is-done';
      return `<span class="${className}">${step.label}</span>`;
    })
    .join('');
}

document.querySelector('[data-go="start"]').addEventListener('click', () => go('start'));

render();
