// demo.js
// A ready-made project for demos, like a market stand where visitors only stay a few minutes.
// It fills in the brief and the group, puts a few ideas on the board and opens the brainstorm.
// The visitor joins as the last member ("You"), so the AI stays locked until they add an idea.

import { state, reset, save } from './state.js';
import { newId } from './ui.js';

export function loadDemo() {
  reset();

  const sam = newId();
  const noor = newId();
  const daan = newId();
  const you = newId();

  state.isDemo = true;
  state.project = {
    name: 'Less Waste Canteen',
    brief: 'The school canteen throws away a lot of food every day, and students do not know about it. '
      + 'Design and build an interactive product that makes students aware of food waste in the canteen '
      + 'and encourages them to waste less. Your product must be tested with at least 5 students. '
      + 'You present a working prototype at the end.',
    category: 'Interactive / media',
    weeks: '6',
    outcomes: 'LO1 User interaction\nLO2 Creative iterations\nLO3 Professional standard\nLO4 Personal leadership\nLO5 Reflection',
    language: 'en',
  };

  state.members = [
    { id: sam, name: 'Sam', skills: 'Front-end, JavaScript', learn: 'Working with sensors', outcomes: ['LO1 User interaction', 'LO3 Professional standard'] },
    { id: noor, name: 'Noor', skills: 'UX research, interviews', learn: '3D / Unity', outcomes: ['LO2 Creative iterations'] },
    { id: daan, name: 'Daan', skills: 'Graphic design, video', learn: 'Coding', outcomes: ['LO3 Professional standard', 'LO5 Reflection'] },
    { id: you, name: 'You', skills: '', learn: '', outcomes: [] },
  ];

  const idea = (authorId, title, text) => ({ id: newId(), title, text, authorId, source: 'group', status: 'active', buildsOn: [] });
  state.ideas = [
    idea(sam, 'Waste counter screen', 'A screen at the canteen exit that shows live how many kilos of food were thrown away today.'),
    idea(noor, 'Plate interviews', 'Short interviews at the trash bin about why people leave food on their plate.'),
    idea(daan, 'Leftover posters', 'Funny posters about the strangest leftovers of the week.'),
    idea(daan, 'Something with a game?', ''),
  ];

  state.startedAt = Date.now();
  state.screen = 'brainstorm';
  save();
}
