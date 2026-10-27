// vote.js
// Step 4: every member gets 3 votes and spreads them over the ideas.
// The group passes the laptop around: pick your name, then vote.

import { state, save, memberName, activeIdeas } from '../state.js';
import { escape } from '../ui.js';

const VOTES_PER_MEMBER = 3;
let voterId = null;

function votesOf(memberId) {
  return state.votes[memberId] || {};
}

// Only votes on ideas that are still on the board count.
function usedVotes(memberId) {
  return activeIdeas().reduce((sum, idea) => sum + (votesOf(memberId)[idea.id] || 0), 0);
}

export function totalVotes(ideaId) {
  return state.members.reduce((sum, m) => sum + (votesOf(m.id)[ideaId] || 0), 0);
}

export function renderVote(app, go) {
  const ideas = activeIdeas();
  if (!voterId || !state.members.some((m) => m.id === voterId)) voterId = state.members[0].id;

  const left = VOTES_PER_MEMBER - usedVotes(voterId);
  const doneCount = state.members.filter((m) => usedVotes(m.id) === VOTES_PER_MEMBER).length;

  // Which idea has the most votes? If two share the top, it is a tie.
  const sorted = [...ideas].sort((a, b) => totalVotes(b.id) - totalVotes(a.id));
  const top = sorted[0];
  const isTie = sorted.length > 1 && totalVotes(sorted[0].id) === totalVotes(sorted[1].id);
  const canChoose = top && totalVotes(top.id) > 0 && !isTie;

  app.innerHTML = `
    <div class="page">
      <div class="row between" style="align-items:flex-end">
        <div>
          <h1>Pick your favourites</h1>
          <p class="lead">Everyone gets ${VOTES_PER_MEMBER} votes. You can put more than one vote on the same idea.</p>
        </div>
        <span class="notice">Done voting: ${doneCount} of ${state.members.length}</span>
      </div>

      <div class="card">
        <span class="label" id="voter-label">Who is voting now?</span>
        <div class="voter-tabs" role="group" aria-labelledby="voter-label">
          ${state.members.map((m) => `
            <button type="button" class="btn small ${m.id === voterId ? 'primary' : ''}" data-voter="${m.id}" aria-pressed="${m.id === voterId}">
              ${escape(m.name)} (${VOTES_PER_MEMBER - usedVotes(m.id)} left)
            </button>
          `).join('')}
        </div>
        <p class="lead" aria-live="polite">${escape(memberName(voterId))} has ${left} vote${left === 1 ? '' : 's'} left.</p>
      </div>

      <div style="display:flex;flex-direction:column;gap:12px">
        ${ideas.map((idea) => {
          const mine = votesOf(voterId)[idea.id] || 0;
          return `
            <div class="card ${idea.id === top?.id && canChoose ? 'strong' : ''}">
              <div class="vote-row">
                <div class="info">
                  <strong style="font-size:18px">${escape(idea.title)}</strong>
                  <p class="builds-on">${idea.source === 'group' ? `Idea from ${escape(memberName(idea.authorId))}` : 'AI idea, kept by the group'} · ${totalVotes(idea.id)} vote${totalVotes(idea.id) === 1 ? '' : 's'} in total</p>
                </div>
                <div class="counter">
                  <button type="button" class="btn icon-btn" data-minus="${idea.id}" aria-label="Remove a vote from ${escape(idea.title)}" ${mine === 0 ? 'disabled' : ''}>−</button>
                  <span class="count">${mine} from you</span>
                  <button type="button" class="btn primary icon-btn" data-plus="${idea.id}" aria-label="Add a vote to ${escape(idea.title)}" ${left === 0 ? 'disabled' : ''}>+</button>
                </div>
              </div>
            </div>
          `;
        }).join('')}
      </div>

      ${isTie && totalVotes(top.id) > 0 ? '<p class="notice">It is a tie. Talk about the tied ideas and move a vote, or combine them into one idea on the board.</p>' : ''}

      <div class="row between">
        <button type="button" class="btn ghost" id="back">Back to board</button>
        <button type="button" class="btn primary" id="choose" ${canChoose ? '' : 'disabled'}>Choose top idea</button>
      </div>
    </div>
  `;

  const rerender = () => renderVote(app, go);

  app.querySelectorAll('[data-voter]').forEach((b) =>
    b.addEventListener('click', () => { voterId = b.dataset.voter; rerender(); }));

  app.querySelectorAll('[data-plus]').forEach((b) =>
    b.addEventListener('click', () => {
      const mine = (state.votes[voterId] ||= {});
      mine[b.dataset.plus] = (mine[b.dataset.plus] || 0) + 1;
      save();
      rerender();
    }));

  app.querySelectorAll('[data-minus]').forEach((b) =>
    b.addEventListener('click', () => {
      const mine = (state.votes[voterId] ||= {});
      mine[b.dataset.minus] = Math.max(0, (mine[b.dataset.minus] || 0) - 1);
      save();
      rerender();
    }));

  app.querySelector('#back').addEventListener('click', () => go('brainstorm'));
  app.querySelector('#choose').addEventListener('click', () => {
    state.chosenId = top.id;
    state.finishedAt = Date.now();
    save();
    go('summary');
  });
}
