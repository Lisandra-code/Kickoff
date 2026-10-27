// brief.js
// Step 1: the group describes the project.

import { state, save } from '../state.js';
import { escape } from '../ui.js';

const categories = ['Interactive / media', 'Software', 'Research', 'Design', 'Other'];

export function renderBrief(app, go) {
  const p = state.project;

  app.innerHTML = `
    <form class="page narrow" id="brief-form" novalidate>
      <div>
        <h1>What is your project about?</h1>
        <p class="lead">This is the starting point for every idea later on.</p>
      </div>

      <div class="field">
        <label for="name">Project name</label>
        <input id="name" type="text" required placeholder="e.g. Museum of sustainability" value="${escape(p.name)}">
      </div>

      <div class="field">
        <label for="brief">Assignment brief</label>
        <textarea id="brief" rows="7" required placeholder="Paste the brief from your teacher or client here">${escape(p.brief)}</textarea>
      </div>

      <fieldset class="field" style="border:0;margin:0;padding:0">
        <legend class="label" style="margin-bottom:6px">Category</legend>
        <div class="chips">
          ${categories.map((c) => `
            <label class="chip"><input type="radio" name="category" value="${escape(c)}" ${p.category === c ? 'checked' : ''}><span>${escape(c)}</span></label>
          `).join('')}
        </div>
      </fieldset>

      <div class="row">
        <div class="field" style="flex:1 1 200px">
          <label for="weeks">Number of weeks</label>
          <input id="weeks" type="number" min="1" max="52" placeholder="e.g. 3" value="${escape(p.weeks)}">
        </div>
        <div class="field" style="flex:1 1 200px">
          <label for="language">Language of the AI answers</label>
          <select id="language">
            <option value="en" ${p.language === 'en' ? 'selected' : ''}>English</option>
            <option value="nl" ${p.language === 'nl' ? 'selected' : ''}>Nederlands</option>
          </select>
        </div>
      </div>

      <div class="field">
        <label for="outcomes">Learning outcomes <span class="hint">(optional, one per line)</span></label>
        <textarea id="outcomes" rows="5" placeholder="LO1 User interaction (analyse and advise)&#10;LO2 User interaction (execution and validation)">${escape(p.outcomes)}</textarea>
      </div>

      <p class="notice error" id="error" hidden></p>

      <div class="row between">
        <button type="button" class="btn ghost" id="back">Back</button>
        <button type="submit" class="btn primary">Next: add your group</button>
      </div>
    </form>
  `;

  const form = app.querySelector('#brief-form');
  const value = (id) => form.querySelector(`#${id}`).value.trim();

  // Save while typing, so nothing gets lost.
  form.addEventListener('input', () => {
    p.name = value('name');
    p.brief = value('brief');
    p.weeks = value('weeks');
    p.outcomes = form.querySelector('#outcomes').value;
    p.language = value('language');
    p.category = form.querySelector('input[name="category"]:checked')?.value || '';
    save();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    if (!p.name || !p.brief) {
      const error = form.querySelector('#error');
      error.textContent = 'Fill in at least the project name and the brief.';
      error.hidden = false;
      return;
    }
    go('group');
  });

  form.querySelector('#back').addEventListener('click', () => go('start'));
}
