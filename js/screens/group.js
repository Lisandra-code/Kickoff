// group.js
// Step 2: every member adds their skills, what they want to learn
// and which learning outcomes they still need.

import { state, save, outcomeList } from '../state.js';
import { escape, newId } from '../ui.js';

function addMember() {
  state.members.push({ id: newId(), name: '', skills: '', learn: '', outcomes: [] });
  save();
}

export function renderGroup(app, go) {
  // A group starts with two empty member cards.
  while (state.members.length < 2) addMember();

  const outcomes = outcomeList();

  app.innerHTML = `
    <div class="page wide">
      <div>
        <h1>Who is in your group?</h1>
        <p class="lead">Each member fills in what they can do and what they want to learn. The AI uses this later.</p>
      </div>

      <div class="grid" id="members">
        ${state.members.map((m, index) => `
          <section class="card strong" data-id="${m.id}" aria-label="Member ${index + 1}">
            <div class="row between">
              <strong>Member ${index + 1}</strong>
              ${state.members.length > 2 ? `<button type="button" class="btn danger small" data-remove="${m.id}">Remove</button>` : ''}
            </div>
            <div class="field">
              <label for="name-${m.id}">Name</label>
              <input id="name-${m.id}" type="text" data-field="name" value="${escape(m.name)}">
            </div>
            <div class="field">
              <label for="skills-${m.id}">Skills <span class="hint">(comma separated)</span></label>
              <input id="skills-${m.id}" type="text" data-field="skills" placeholder="e.g. front end, UX research, Unity" value="${escape(m.skills)}">
            </div>
            <div class="field">
              <label for="learn-${m.id}">I want to learn</label>
              <input id="learn-${m.id}" type="text" data-field="learn" placeholder="e.g. working with AI, sound design" value="${escape(m.learn)}">
            </div>
            ${outcomes.length ? `
              <fieldset class="field" style="border:0;margin:0;padding:0">
                <legend class="label" style="margin-bottom:6px">Learning outcomes I still need</legend>
                ${outcomes.map((o) => `
                  <label class="check"><input type="checkbox" data-outcome="${escape(o)}" ${m.outcomes.includes(o) ? 'checked' : ''}>${escape(o)}</label>
                `).join('')}
              </fieldset>
            ` : ''}
          </section>
        `).join('')}
        <button type="button" class="btn dashed" id="add" style="min-height:120px">+ Add member</button>
      </div>

      <p class="notice error" id="error" hidden></p>

      <div class="row between">
        <button type="button" class="btn ghost" id="back">Back</button>
        <button type="button" class="btn primary" id="next">Next: start brainstorm</button>
      </div>
    </div>
  `;

  // Save every change into the right member.
  app.querySelector('#members').addEventListener('input', (event) => {
    const card = event.target.closest('[data-id]');
    if (!card) return;
    const member = state.members.find((m) => m.id === card.dataset.id);
    const field = event.target.dataset.field;
    if (field) member[field] = event.target.value;
    if (event.target.dataset.outcome) {
      const outcome = event.target.dataset.outcome;
      member.outcomes = event.target.checked
        ? [...member.outcomes, outcome]
        : member.outcomes.filter((o) => o !== outcome);
    }
    save();
  });

  app.querySelectorAll('[data-remove]').forEach((button) => {
    button.addEventListener('click', () => {
      state.members = state.members.filter((m) => m.id !== button.dataset.remove);
      save();
      renderGroup(app, go);
    });
  });

  app.querySelector('#add').addEventListener('click', () => {
    addMember();
    renderGroup(app, go);
  });

  app.querySelector('#back').addEventListener('click', () => go('brief'));

  app.querySelector('#next').addEventListener('click', () => {
    const named = state.members.filter((m) => m.name.trim());
    if (named.length < 2) {
      const error = app.querySelector('#error');
      error.textContent = 'Add at least two members with a name.';
      error.hidden = false;
      return;
    }
    // Members without a name are left out.
    state.members = named;
    if (!state.startedAt) state.startedAt = Date.now();
    save();
    go('brainstorm');
  });
}
