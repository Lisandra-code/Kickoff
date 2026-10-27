// ai.js
// Talks to our own server function (api/kickoff.js), which talks to the AI model on Groq.
// The API key never comes to the browser: it only lives on the server.

import { state, activeIdeas, memberName } from './state.js';

// Collects what the AI is allowed to see. We send only what it needs.
function buildInput() {
  return {
    project: {
      name: state.project.name,
      brief: state.project.brief,
      category: state.project.category,
      weeks: state.project.weeks,
    },
    members: state.members.map((m) => ({
      name: m.name,
      skills: m.skills,
      learn: m.learn,
      outcomes: m.outcomes,
    })),
    ideas: activeIdeas().map((idea) => ({
      title: idea.title,
      text: idea.text,
      by: memberName(idea.authorId),
    })),
    language: state.project.language,
  };
}

// A readable list of what the AI based its answer on (shown under "What did the AI use?").
export function describeInput(input) {
  const used = [`The brief of “${input.project.name}”`];
  used.push(`${input.members.length} members with their skills and learning wishes`);
  const withOutcomes = input.members.filter((m) => m.outcomes.length).length;
  if (withOutcomes) used.push(`Learning outcomes of ${withOutcomes} members`);
  used.push(`${input.ideas.length} ideas from the group: ${input.ideas.map((i) => `“${i.title}”`).join(', ')}`);
  return used;
}

// mode is 'direction' or 'ideas'.
export async function askAI(mode) {
  const input = buildInput();
  const response = await fetch('/api/kickoff', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode, ...input }),
  });

  let data = null;
  try {
    data = await response.json();
  } catch (error) {
    throw new Error('The AI gave an answer we could not read. Try again.');
  }
  if (!response.ok) throw new Error(data?.error || 'Something went wrong. Try again.');

  return { data, used: describeInput(input) };
}
