// api/kickoff.js
// A Vercel serverless function. It runs on the server, not in the browser.
// It keeps the Groq API key secret, writes the prompt, and sends back clean JSON.
// The AI model runs on Groq (free tier): https://console.groq.com
//
// The browser sends: { mode: 'direction' | 'ideas', project, members, ideas, language }

// Which model to use. You can set GROQ_MODEL in .env to choose one yourself.
// If not, the server asks Groq which models your key can use and picks the first one
// from this list that is available. Groq changes its models often, so this keeps working.
const PREFERRED_MODELS = [
  'openai/gpt-oss-120b',
  'llama-3.3-70b-versatile',
  'meta-llama/llama-4-maverick-17b-128e-instruct',
  'qwen/qwen3-32b',
  'openai/gpt-oss-20b',
  'llama-3.1-8b-instant',
];
let chosenModel = process.env.GROQ_MODEL || null; // remembered after the first lookup
const failedModels = new Set(); // models that gave a 'not found' error, so we skip them
const MAX_BODY_LENGTH = 20000; // characters, so nobody can send a huge request

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Use POST.' });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'The server has no API key. Add GROQ_API_KEY to your .env file or to Vercel.' });
  }

  let body = req.body;
  try {
    if (typeof body === 'string') body = JSON.parse(body);
  } catch (error) {
    return res.status(400).json({ error: 'The request was not valid JSON.' });
  }

  if (JSON.stringify(body || {}).length > MAX_BODY_LENGTH) {
    return res.status(413).json({ error: 'There is too much text. Shorten the brief or the ideas.' });
  }

  const { mode, project, members, ideas, language } = body || {};
  if (mode !== 'direction' && mode !== 'ideas') {
    return res.status(400).json({ error: 'Unknown mode.' });
  }
  if (!project?.brief || !Array.isArray(members) || !Array.isArray(ideas) || ideas.length === 0) {
    return res.status(400).json({ error: 'Add a brief, the members and at least one idea first.' });
  }

  const prompt = buildPrompt({ mode, project, members, ideas, language });

  try {
    let response = await callGroq(apiKey, await pickModel(apiKey), prompt);

    // The model was removed or is not available for this key: look up another one and try once more.
    if (response.status === 404) {
      console.warn('Model not available:', chosenModel, '- looking for another model.');
      failedModels.add(chosenModel);
      chosenModel = null;
      response = await callGroq(apiKey, await pickModel(apiKey, true), prompt);
    }

    if (!response.ok) {
      console.error('Groq API error', response.status, await response.text());
      return res.status(502).json({ error: 'The AI service gave an error. Try again in a moment.' });
    }

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || '';
    const result = extractJson(text);
    if (!result) {
      return res.status(502).json({ error: 'The AI answer could not be read. Try again.' });
    }
    return res.status(200).json(clean(mode, result));
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Could not reach the AI service.' });
  }
}

// ---------- The prompt ----------
// This is where the rule from our POC test lives: the AI builds on the group's own
// ideas and does not take over. Changing these lines changes how Kickoff behaves.

const SYSTEM_PROMPT = `You are Kickoff, a brainstorm helper for groups of ICT students at the start of a school project.
The students own the project. You never take over the brainstorm.
You only work with the ideas the group already wrote down: you find what they have in common, build on them or combine them.
Be concrete and short. Use simple words. Do not flatter.
Always answer with JSON only, no other text.`;

function buildPrompt({ mode, project, members, ideas, language }) {
  const lang = language === 'nl' ? 'Dutch' : 'English';

  const context = `PROJECT
Name: ${project.name || ''}
Category: ${project.category || 'not given'}
Weeks: ${project.weeks || 'not given'}
Brief:
${project.brief}

GROUP MEMBERS
${members.map((m) => `- ${m.name}. Skills: ${m.skills || 'not given'}. Wants to learn: ${m.learn || 'not given'}. Learning outcomes still needed: ${(m.outcomes || []).join(', ') || 'not given'}.`).join('\n')}

IDEAS FROM THE GROUP
${ideas.map((i) => `- "${i.title}" (by ${i.by})${i.text ? `: ${i.text}` : ''}`).join('\n')}`;

  if (mode === 'direction') {
    return `${context}

TASK
Do not invent new project ideas. Look at the group's ideas and give 2 or 3 directions the group could take.
A direction is a theme or approach that connects or builds on their ideas, so they can work it out themselves.
For each direction, say which of their ideas it builds on, using the exact idea titles.
Also give 2 short questions the group should talk about to choose, for example about the target group, the brief or what they want to learn.
Write in ${lang}.

Answer with this JSON:
{"directions":[{"title":"short name","text":"2 or 3 sentences","buildsOn":["idea title"]}],"questions":["question"]}`;
  }

  return `${context}

TASK
Give 3 project ideas that build on or combine the group's ideas. Each idea must clearly grow from at least one of their ideas.
Explain each idea in 3 or 4 sentences so everyone understands it: what it is, who it is for, and what the group would make.
Say which of their ideas it builds on, using the exact idea titles, and which members' skills or learning wishes it fits.
Write in ${lang}.

Answer with this JSON:
{"ideas":[{"title":"short name","text":"3 or 4 sentences","buildsOn":["idea title"],"fits":"which skills or learning wishes it fits"}]}`;
}

// ---------- Talking to Groq ----------

async function callGroq(apiKey, model, prompt) {
  const body = {
    model,
    max_tokens: 3000,
    temperature: 0.7,
    response_format: { type: 'json_object' }, // asks the model for JSON only
    messages: [
      { role: 'system', content: SYSTEM_PROMPT },
      { role: 'user', content: prompt },
    ],
  };
  // gpt-oss models think before they answer. Low effort keeps it fast and leaves room for the answer.
  if (model.startsWith('openai/gpt-oss')) body.reasoning_effort = 'low';

  return fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: { 'Authorization': `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}

// Finds a model this key can use. skipEnv = true ignores GROQ_MODEL (used when that model failed).
async function pickModel(apiKey, skipEnv = false) {
  if (chosenModel) return chosenModel;
  if (process.env.GROQ_MODEL && !skipEnv) return (chosenModel = process.env.GROQ_MODEL);

  const response = await fetch('https://api.groq.com/openai/v1/models', {
    headers: { 'Authorization': `Bearer ${apiKey}` },
  });
  if (!response.ok) {
    console.error('Could not list Groq models', response.status, await response.text());
    return PREFERRED_MODELS.find((id) => !failedModels.has(id)) || PREFERRED_MODELS[0];
  }
  const data = await response.json();
  const available = (data.data || []).filter((m) => m.active !== false).map((m) => m.id).filter((id) => !failedModels.has(id));
  console.log('Groq models available for this key:', available.join(', '));

  const textModels = available.filter((id) => !/whisper|tts|guard|playai|orpheus|embed/i.test(id));
  chosenModel = PREFERRED_MODELS.find((id) => available.includes(id)) || textModels[0] || PREFERRED_MODELS[0];
  console.log('Kickoff uses model:', chosenModel);
  return chosenModel;
}

// ---------- Helpers ----------

// The model sometimes wraps JSON in extra text. This takes out the part between the first { and the last }.
function extractJson(text) {
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    return JSON.parse(text.slice(start, end + 1));
  } catch (error) {
    return null;
  }
}

// Only pass on the fields the website expects, as plain text.
function clean(mode, result) {
  const str = (v) => (typeof v === 'string' ? v.slice(0, 1000) : '');
  const list = (v) => (Array.isArray(v) ? v.map(str).filter(Boolean).slice(0, 6) : []);

  if (mode === 'direction') {
    return {
      directions: (result.directions || []).slice(0, 3).map((d) => ({ title: str(d.title), text: str(d.text), buildsOn: list(d.buildsOn) })),
      questions: list(result.questions).slice(0, 3),
    };
  }
  return {
    ideas: (result.ideas || []).slice(0, 3).map((i) => ({ title: str(i.title), text: str(i.text), buildsOn: list(i.buildsOn), fits: str(i.fits) })),
  };
}
