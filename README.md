# Kickoff

Kickoff helps groups of ICT students find a project idea they own. The group thinks first, the AI gives a direction based on their ideas, and the group decides.

This is the MVP of our self defined case study. It is based on our brainstorm POC test with two groups of ICT students.

## How it works

1. **Brief:** the group adds the project name, the brief, the number of weeks and their learning outcomes.
2. **Group:** each member adds their skills, what they want to learn and which learning outcomes they still need.
3. **Brainstorm:** every member adds at least one idea of their own. Only then can the group ask the AI for a direction. After a direction, the group can ask for AI ideas that build on their ideas, and keep or dismiss them.
4. **Choose:** every member gets 3 votes. The idea with the most votes is chosen. The group then answers: does this feel like your own idea?

Kickoff runs on one shared screen. Data is saved only in the browser of that device.

## Features (from the POC results)

| Priority | Feature | In the MVP |
|---|---|---|
| Must | Group ideas first: the AI unlocks when every member has added an idea | Yes |
| Must | AI gives a direction based on the group's ideas, plus questions to talk about | Yes |
| Must | Decision step: voting | Yes |
| Must | Skills, learning wishes and learning outcomes as input | Yes |
| Should | Show what the AI used | Yes |
| Should | Choose Dutch or English | Yes |
| Should | Open an idea for more detail | Partly: AI ideas are explained in 3 or 4 sentences |
| Could | Timer | Yes |

## Quality criteria

- Every member can add their own ideas before the AI shows anything.
- The AI only builds on or combines the group's ideas.
- The group ends with one chosen idea through the vote.
- The interface has few steps and works on one laptop.
- In a test, the group scores "the idea feels like ours" at least as high as without AI.

## Files

| File | What it does |
|---|---|
| `index.html` | The page with the header. Every screen is drawn inside `<main id="app">`. |
| `css/style.css` | All styling. |
| `js/main.js` | Decides which screen to show and draws the step pills. |
| `js/state.js` | All data of one session, saved in the browser. |
| `js/ui.js` | Small helpers, like making text safe for HTML. |
| `js/ai.js` | Sends the group's input to our server function and gets the answer back. |
| `js/screens/*.js` | One file per screen: start, brief, group, brainstorm, vote, summary. |
| `api/kickoff.js` | Server function on Vercel. Keeps the API key secret, holds the prompt and calls the AI model on Groq. |

## Run it on your laptop

1. Install [Node.js](https://nodejs.org) (version 18 or newer).
2. Copy `.env.example`, name the copy `.env` and add your Groq API key (free at [console.groq.com](https://console.groq.com)).
3. In the terminal, in this folder:
   ```
   npx vercel dev
   ```
4. Open the address it shows, usually http://localhost:3000.

## Put it online

1. Import this repository on [vercel.com](https://vercel.com).
2. Under Settings, Environment Variables, add `GROQ_API_KEY`.
3. Every push to `main` goes live.

## AI use

The website code was written with help from Claude (vibe coded), based on our low fidelity prototype and POC results. I checked it by testing every feature and going through each file. The AI inside Kickoff runs on Groq's free tier, with the open model Llama 3.3 70B. The prompt Kickoff sends to it is in `api/kickoff.js`.
