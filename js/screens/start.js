// start.js
// The first screen: what Kickoff does, and a button to start.

import { state, reset } from '../state.js';

export function renderStart(app, go) {
  const hasSession = state.project.name !== '' || state.members.length > 0;

  app.innerHTML = `
    <div class="page">
      <section class="hero">
        <div>
          <h1>Start your group project with an idea everyone owns.</h1>
          <p class="lead">Add your brief and your group, put your own ideas on the board first, and let AI help you find a direction. Then choose one idea together.</p>
          <div class="row">
            <button type="button" class="btn primary" id="new">Start a new project</button>
            ${hasSession ? `<button type="button" class="btn" id="continue">Continue: <span id="continue-name"></span></button>` : ''}
          </div>
        </div>
      </section>
      <section class="flow" aria-label="How it works">
        <div class="card"><strong>1 · Brief</strong><span class="lead">Paste the assignment and set the time you have</span></div>
        <div class="card"><strong>2 · Group</strong><span class="lead">Skills, learning wishes and learning outcomes</span></div>
        <div class="card"><strong>3 · Brainstorm</strong><span class="lead">Your ideas first, then an AI direction</span></div>
        <div class="card"><strong>4 · Choose</strong><span class="lead">Vote and agree on one idea</span></div>
      </section>
    </div>
  `;

  if (hasSession) {
    // textContent instead of innerHTML, because the name was typed by a user.
    app.querySelector('#continue-name').textContent = state.project.name || 'your project';
    app.querySelector('#continue').addEventListener('click', () => go(state.chosenId ? 'summary' : 'brief'));
  }

  app.querySelector('#new').addEventListener('click', () => {
    if (hasSession && !window.confirm('Start over? This clears the current project on this device.')) return;
    reset();
    go('brief');
  });
}
