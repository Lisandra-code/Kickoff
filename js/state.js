// state.js
// All data of one Kickoff session lives in one object: `state`.
// It is saved in the browser (localStorage), so a page refresh does not lose the work.

const STORAGE_KEY = 'kickoff-session';

// What a brand new session looks like.
function freshState() {
  return {
    screen: 'start',
    project: {
      name: '',
      brief: '',
      category: '',
      weeks: '',
      outcomes: '',     // learning outcomes, one per line
      language: 'en',   // language of the AI answers: 'en' or 'nl'
    },
    members: [],        // { id, name, skills, learn, outcomes: [] }
    ideas: [],          // { id, title, text, authorId, source: 'group' | 'ai', status: 'active' | 'suggested', buildsOn: [] }
    ai: {
      directions: null, // { directions: [...], questions: [...], used: [...] }
      ideasUsed: null,  // what the AI used for its last idea suggestions
    },
    votes: {},          // { memberId: { ideaId: number } }
    chosenId: null,
    startedAt: null,    // when the brainstorm started (ms)
    finishedAt: null,   // when the group chose an idea (ms)
    ownership: null,    // answer to "Does this feel like your own idea?"
  };
}

function load() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? { ...freshState(), ...JSON.parse(saved) } : null;
  } catch (error) {
    return null; // storage can be blocked, then we simply start fresh
  }
}

export const state = load() || freshState();

export function save() {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    // Saving is a convenience. The app still works without it.
  }
}

export function reset() {
  for (const key of Object.keys(state)) delete state[key];
  Object.assign(state, freshState());
  save();
}

// Small helpers that several screens use.

export function memberName(id) {
  if (id === 'ai') return 'AI';
  const member = state.members.find((m) => m.id === id);
  return member ? member.name || 'Unnamed member' : 'Unknown';
}

export function activeIdeas() {
  return state.ideas.filter((idea) => idea.status === 'active');
}

export function outcomeList() {
  return state.project.outcomes
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}
