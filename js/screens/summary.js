// summary.js
// The chosen idea, how long it took, and one question:
// does this feel like your own idea? (This is the ownership question from our POC test.)

import { state, save, memberName } from '../state.js';
import { escape } from '../ui.js';
import { totalVotes } from './vote.js';

const ownershipAnswers = ['Not at all', 'A little', 'Mostly', 'Completely'];

export function renderSummary(app, go) {
  const idea = state.ideas.find((i) => i.id === state.chosenId);
  if (!idea) { go('vote'); return; }

  const allVotes = state.members.length * 3;
  const minutes = Math.max(1, Math.round((state.finishedAt - state.startedAt) / 60000));
  const origin = idea.source === 'group' ? `Idea from ${memberName(idea.authorId)}` : 'AI idea, kept by the group';

  app.innerHTML = `
    <div class="page narrow">
      <p class="lead">Your group chose · found in ${minutes} min</p>

      <section class="card strong" style="padding:32px;gap:18px">
        <h1 class="big-title">${escape(idea.title)}</h1>
        ${idea.text ? `<p style="font-size:17px">${escape(idea.text)}</p>` : ''}
        <div class="facts">
          <div class="fact"><span class="tag">Where it came from</span><strong>${escape(origin)}</strong></div>
          <div class="fact"><span class="tag">Votes</span><strong>${totalVotes(idea.id)} of ${allVotes}</strong></div>
          <div class="fact"><span class="tag">Time</span><strong>${minutes} minutes</strong></div>
        </div>
      </section>

      <fieldset class="card" style="margin:0">
        <legend class="label" style="padding:0 6px">Does this feel like your own idea?</legend>
        <div class="chips">
          ${ownershipAnswers.map((a) => `
            <label class="chip"><input type="radio" name="ownership" value="${a}" ${state.ownership === a ? 'checked' : ''}><span>${a}</span></label>
          `).join('')}
        </div>
      </fieldset>

      <div class="row">
        <button type="button" class="btn primary" id="copy">Copy summary</button>
        <button type="button" class="btn ghost" id="back">Back to voting</button>
      </div>
      <p class="hint" id="copied" aria-live="polite"></p>
    </div>
  `;

  app.querySelectorAll('input[name="ownership"]').forEach((input) =>
    input.addEventListener('change', () => { state.ownership = input.value; save(); }));

  app.querySelector('#copy').addEventListener('click', async () => {
    const text = [
      `Project: ${state.project.name}`,
      `Chosen idea: ${idea.title}`,
      idea.text,
      `${origin}. ${totalVotes(idea.id)} of ${allVotes} votes. Found in ${minutes} minutes.`,
      `Group: ${state.members.map((m) => m.name).join(', ')}`,
    ].filter(Boolean).join('\n');
    const status = app.querySelector('#copied');
    try {
      await navigator.clipboard.writeText(text);
      status.textContent = 'Copied. Paste it in Trello, Notion or your group chat.';
    } catch (error) {
      status.textContent = 'Copying did not work in this browser. Select the text and copy it yourself.';
    }
  });

  app.querySelector('#back').addEventListener('click', () => {
    state.chosenId = null;
    save();
    go('vote');
  });
}
