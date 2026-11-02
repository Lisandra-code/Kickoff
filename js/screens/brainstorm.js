// brainstorm.js
// Step 3: the core of Kickoff.
// Rule from our POC test: the group thinks first, the AI gives a direction based on
// their ideas, and the group decides. That is why the AI buttons stay locked
// until every member has added at least one idea of their own.

import { state, save, memberName, activeIdeas } from '../state.js';
import { escape, newId, formatTime } from '../ui.js';
import { askAI } from '../ai.js';

// Things that only matter while this screen is open.
let loading = null;                    // null, 'direction' or 'ideas'
let errorMessage = '';
let draft = { authorId: '', title: '', text: '' }; // what is typed in the "add idea" form

export function renderBrainstorm(app, go) {
  const groupIdeas = state.ideas.filter((i) => i.source === 'group');
  const aiSuggestions = state.ideas.filter((i) => i.status === 'suggested');
  const adoptedAiIdeas = state.ideas.filter((i) => i.source === 'ai' && i.status === 'active');

  // Who has added an idea already?
  const ideaCount = (memberId) => groupIdeas.filter((i) => i.authorId === memberId).length;
  const everyoneHasIdea = state.members.every((m) => ideaCount(m.id) > 0);
  const hasDirection = Boolean(state.ai.directions);

  // New session (for example a new demo visitor): clear the form and start with someone who has no idea yet.
  if (!state.members.some((m) => m.id === draft.authorId)) {
    const firstWithoutIdea = state.members.find((m) => ideaCount(m.id) === 0);
    draft = { authorId: (firstWithoutIdea || state.members[0])?.id || '', title: '', text: '' };
  }

  app.innerHTML = `
    <div class="page wide">
      <div class="toolbar">
        <div>
          <h1 style="font-size:26px;margin:0">${escape(state.project.name)} · brainstorm</h1>
          <p class="lead">Add your own ideas first. Then ask the AI for a direction.</p>
        </div>
        <span class="timer" aria-label="Time since the brainstorm started">Time: <span id="timer">00:00</span></span>
      </div>

      <div class="layout-2">
        <div class="main">
          <form class="card strong" id="idea-form">
            <h2>Add an idea</h2>
            <div class="row">
              <div class="field" style="flex:1 1 180px">
                <label for="author">Whose idea?</label>
                <select id="author">
                  ${state.members.map((m) => `<option value="${m.id}" ${m.id === draft.authorId ? 'selected' : ''}>${escape(m.name)}</option>`).join('')}
                </select>
              </div>
              <div class="field" style="flex:3 1 260px">
                <label for="title">Idea in a few words</label>
                <input id="title" type="text" required placeholder="e.g. Escape room about recycling" value="${escape(draft.title)}">
              </div>
            </div>
            <div class="field">
              <label for="text">Explain it <span class="hint">(optional, a half idea or a direction is fine too)</span></label>
              <textarea id="text" rows="3">${escape(draft.text)}</textarea>
            </div>
            <div class="row"><button type="submit" class="btn primary">Add idea</button></div>
          </form>

          ${aiSuggestions.length ? `
            <h2 style="margin-top:8px">AI suggestions</h2>
            <p class="lead">Keep the ones you like. They join the board as AI ideas.</p>
            <div class="grid">
              ${aiSuggestions.map((idea) => `
                <article class="card ai">
                  <span class="tag ai-tag">AI suggestion</span>
                  <strong>${escape(idea.title)}</strong>
                  <p>${escape(idea.text)}</p>
                  ${idea.buildsOn.length ? `<p class="builds-on">Builds on: ${idea.buildsOn.map(escape).join(', ')}</p>` : ''}
                  ${idea.fits ? `<p class="builds-on">Fits: ${escape(idea.fits)}</p>` : ''}
                  <div class="row">
                    <button type="button" class="btn small" data-adopt="${idea.id}">Keep</button>
                    <button type="button" class="btn small ghost" data-dismiss="${idea.id}">Dismiss</button>
                  </div>
                </article>
              `).join('')}
            </div>
          ` : ''}

          <h2 style="margin-top:8px">The board <span class="hint">(${activeIdeas().length} ideas)</span></h2>
          ${activeIdeas().length === 0 ? '<p class="notice">No ideas yet. Every member starts with at least one idea of their own.</p>' : ''}
          <div class="grid">
            ${[...groupIdeas, ...adoptedAiIdeas].map((idea) => `
              <article class="card ${idea.source === 'group' ? 'strong' : 'ai'}">
                <span class="tag">${idea.source === 'group' ? escape(memberName(idea.authorId)) : 'AI idea, kept by the group'}</span>
                <strong>${escape(idea.title)}</strong>
                ${idea.text ? `<p>${escape(idea.text)}</p>` : ''}
                <div class="row"><button type="button" class="btn danger small" data-remove="${idea.id}">Remove</button></div>
              </article>
            `).join('')}
          </div>
        </div>

        <aside class="side">
          <section class="card strong" aria-labelledby="ask-title">
            <h2 id="ask-title">Ask the AI</h2>
            <p class="lead" style="font-size:15px">The AI only works with your ideas. Every member adds one first.</p>
            <ul class="checklist">
              ${state.members.map((m) => `<li class="${ideaCount(m.id) ? 'ok' : ''}">${escape(m.name)}: ${ideaCount(m.id)}</li>`).join('')}
            </ul>
            <button type="button" class="btn primary" id="ask-direction" ${!everyoneHasIdea || loading ? 'disabled' : ''}>
              ${loading === 'direction' ? '<span class="loading" aria-hidden="true"></span> Thinking…' : hasDirection ? 'Get a new direction' : 'Get a direction'}
            </button>
            <button type="button" class="btn dashed" id="ask-ideas" ${!hasDirection || loading ? 'disabled' : ''}>
              ${loading === 'ideas' ? '<span class="loading" aria-hidden="true"></span> Thinking…' : 'Suggest ideas'}
            </button>
            ${!hasDirection ? '<p class="hint">Ideas from the AI unlock after you asked for a direction.</p>' : ''}
            ${errorMessage ? `<p class="notice error" role="alert">${escape(errorMessage)}</p>` : ''}
          </section>

          ${hasDirection ? renderDirections(state.ai.directions) : ''}
        </aside>
      </div>

      <div class="row between">
        <button type="button" class="btn ghost" id="back">Back</button>
        <button type="button" class="btn primary" id="next" ${activeIdeas().length < 2 ? 'disabled' : ''}>Done: choose an idea</button>
      </div>
    </div>
  `;

  bindEvents(app, go);
  startTimer(app);
}

function renderDirections(result) {
  return `
    <section class="card" aria-labelledby="dir-title">
      <h2 id="dir-title">Directions from your ideas</h2>
      ${result.directions.map((d) => `
        <div class="direction">
          <strong>${escape(d.title)}</strong>
          <p>${escape(d.text)}</p>
          ${d.buildsOn?.length ? `<p class="builds-on">Builds on: ${d.buildsOn.map(escape).join(', ')}</p>` : ''}
        </div>
      `).join('')}
      ${result.questions?.length ? `
        <div>
          <strong>Talk about this together</strong>
          <ul style="margin:6px 0 0;padding-left:18px">${result.questions.map((q) => `<li>${escape(q)}</li>`).join('')}</ul>
        </div>
      ` : ''}
      <details>
        <summary>What did the AI use?</summary>
        <ul class="used">${result.used.map((u) => `<li>${escape(u)}</li>`).join('')}</ul>
      </details>
    </section>
  `;
}

function bindEvents(app, go) {
  const rerender = () => renderBrainstorm(app, go);
  const form = app.querySelector('#idea-form');

  // Remember what is typed, so it survives a redraw.
  form.addEventListener('input', () => {
    draft = {
      authorId: form.querySelector('#author').value,
      title: form.querySelector('#title').value,
      text: form.querySelector('#text').value,
    };
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const title = form.querySelector('#title').value.trim();
    if (!title) {
      form.querySelector('#title').focus();
      return;
    }
    state.ideas.push({
      id: newId(),
      title,
      text: form.querySelector('#text').value.trim(),
      authorId: form.querySelector('#author').value,
      source: 'group',
      status: 'active',
      buildsOn: [],
    });
    save();
    draft = { authorId: nextAuthor(form.querySelector('#author').value), title: '', text: '' };
    rerender();
    app.querySelector('#title').focus();
  });

  app.querySelectorAll('[data-remove]').forEach((button) =>
    button.addEventListener('click', () => {
      state.ideas = state.ideas.filter((i) => i.id !== button.dataset.remove);
      save();
      rerender();
    }));

  app.querySelectorAll('[data-adopt]').forEach((button) =>
    button.addEventListener('click', () => {
      state.ideas.find((i) => i.id === button.dataset.adopt).status = 'active';
      save();
      rerender();
    }));

  app.querySelectorAll('[data-dismiss]').forEach((button) =>
    button.addEventListener('click', () => {
      state.ideas = state.ideas.filter((i) => i.id !== button.dataset.dismiss);
      save();
      rerender();
    }));

  app.querySelector('#ask-direction').addEventListener('click', () => runAI('direction', rerender));
  app.querySelector('#ask-ideas').addEventListener('click', () => runAI('ideas', rerender));
  app.querySelector('#back').addEventListener('click', () => go('group'));
  app.querySelector('#next').addEventListener('click', () => go('vote'));
}

// After adding an idea, the form moves on to the next member.
function nextAuthor(currentId) {
  const index = state.members.findIndex((m) => m.id === currentId);
  return state.members[(index + 1) % state.members.length]?.id || '';
}

async function runAI(mode, rerender) {
  loading = mode;
  errorMessage = '';
  rerender();
  try {
    const { data, used } = await askAI(mode);
    if (mode === 'direction') {
      state.ai.directions = { directions: data.directions || [], questions: data.questions || [], used };
    } else {
      // Old suggestions that were not kept are replaced by the new ones.
      state.ideas = state.ideas.filter((i) => i.status !== 'suggested');
      for (const idea of data.ideas || []) {
        state.ideas.push({
          id: newId(),
          title: idea.title,
          text: idea.text,
          fits: idea.fits || '',
          buildsOn: idea.buildsOn || [],
          authorId: 'ai',
          source: 'ai',
          status: 'suggested',
        });
      }
      state.ai.ideasUsed = used;
    }
    save();
  } catch (error) {
    errorMessage = error.message;
  }
  loading = null;
  // Only redraw if the group is still on this screen.
  if (state.screen === 'brainstorm') rerender();
}

function startTimer(app) {
  // Stop the timer of the previous draw first, so only one timer runs.
  if (typeof app.cleanup === 'function') app.cleanup();
  const timer = app.querySelector('#timer');
  const tick = () => { timer.textContent = formatTime(Date.now() - (state.startedAt || Date.now())); };
  tick();
  const interval = setInterval(tick, 1000);
  app.cleanup = () => clearInterval(interval);
}
