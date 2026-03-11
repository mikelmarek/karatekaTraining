import fs from 'node:fs/promises';

const BLOCK_FOCUS = {
  1: {
    title: 'Blok 1 – základy',
    goals: [
      'rituál dojo',
      'základní postoje',
      'oi tsuki, age uke, gedan barai, mae geri',
      'Fukyugata Ichi jako celek',
      'radost z tréninku'
    ],
    techniques: ['oi tsuki', 'age uke', 'gedan barai', 'mae geri'],
    games: ['Stínový ninja', 'Dotkni se kolena', 'Karate socha', 'Samurai reakce']
  },
  2: {
    title: 'Blok 2 – stabilita a dvojice',
    goals: [
      'přidat gyaku tsuki',
      'upevnit rovnováhu a koordinaci',
      'více práce ve dvojici',
      'více reakčních her',
      'větší jistota ve Fukyugata Ichi'
    ],
    techniques: ['gyaku tsuki', 'age uke', 'mae geri', 'gedan barai'],
    games: ['Obrana hradu', 'Samurai reakce', 'Stínový ninja', 'Ninja rovnováha']
  },
  3: {
    title: 'Blok 3 – plynulost a přesnost',
    goals: [
      'zlepšit plynulost',
      'posílit disciplínu a přesnost',
      'rozvíjet práci ve dvojici',
      'větší samostatnost dětí'
    ],
    techniques: ['gyaku tsuki', 'age uke → gyaku tsuki', 'mae geri', 'gedan barai'],
    games: ['Karate paměť', 'Obrana hradu', 'Dotkni se kolena', 'Ninja průchod']
  },
  4: {
    title: 'Blok 4 – upevnění a závěr',
    goals: [
      'upevnit všechny základní dovednosti',
      'budovat zdravé sebevědomí',
      'posílit vztah k dojo a stylu',
      'připravit skupinu na další krok'
    ],
    techniques: ['opakování všech technik', 'gyaku tsuki', 'mae geri', 'Fukyugata Ichi plynule'],
    games: ['Sumo turnaj', 'Obrana hradu', 'Karate socha', 'Stínový ninja']
  }
};

function normalizeLine(line) {
  return line.replace(/\*\*/g, '').trim();
}

function extractBetween(content, startMarker, endMarker) {
  const start = content.indexOf(startMarker);
  if (start === -1) {
    return '';
  }

  const sliced = content.slice(start + startMarker.length);
  if (!endMarker) {
    return sliced;
  }

  const end = sliced.indexOf(endMarker);
  return end === -1 ? sliced : sliced.slice(0, end);
}

function parseDetailedLessons(content) {
  const section = extractBetween(content, '# 7. Čtyřicet detailních lekcí', '# 8. Roční plán – cca 40 lekcí');
  const chunks = section.split(/\n---\n/g).map((item) => item.trim()).filter(Boolean);
  const lessons = new Map();

  for (const chunk of chunks) {
    const headerMatch = chunk.match(/## Lekce (\d+) – (.+)/);
    if (!headerMatch) {
      continue;
    }

    const lessonNumber = Number(headerMatch[1]);
    const lessonTitle = headerMatch[2].trim();
    const lines = chunk.split('\n').map((line) => line.trim()).filter(Boolean);

    let currentSection = null;
    const lesson = {
      lessonNumber,
      title: lessonTitle,
      goal: '',
      sections: {
        zahajeni: [],
        zahrati: [],
        kihon: [],
        kata: [],
        hra: [],
        zaver: []
      }
    };

    for (const rawLine of lines.slice(1)) {
      const line = normalizeLine(rawLine);

      if (line === '### Cíl') {
        currentSection = 'goal';
        continue;
      }
      if (line === '### Průběh') {
        currentSection = null;
        continue;
      }
      if (line.startsWith('Zahájení')) {
        currentSection = 'zahajeni';
        continue;
      }
      if (line.startsWith('Zahřátí')) {
        currentSection = 'zahrati';
        continue;
      }
      if (line.startsWith('Kihon')) {
        currentSection = 'kihon';
        continue;
      }
      if (line.startsWith('Kata')) {
        currentSection = 'kata';
        continue;
      }
      if (line.startsWith('Hra / partner') || line === 'Hra' || line.startsWith('Hra ')) {
        currentSection = 'hra';
        continue;
      }
      if (line.startsWith('Závěr')) {
        currentSection = 'zaver';
        continue;
      }

      if (currentSection === 'goal') {
        lesson.goal = lesson.goal ? `${lesson.goal} ${line}` : line;
      } else if (currentSection && lesson.sections[currentSection]) {
        lesson.sections[currentSection].push(line);
      }
    }

    lessons.set(lessonNumber, lesson);
  }

  return lessons;
}

function getBlockNumberForLesson(lessonNumber) {
  if (lessonNumber <= 10) return 1;
  if (lessonNumber <= 20) return 2;
  if (lessonNumber <= 30) return 3;
  return 4;
}

function rotate(list, offset) {
  if (!list.length) {
    return [];
  }
  const normalizedOffset = offset % list.length;
  return [...list.slice(normalizedOffset), ...list.slice(0, normalizedOffset)];
}

function buildGeneratedLesson(lessonNumber, state) {
  const blockNumber = getBlockNumberForLesson(lessonNumber);
  const block = BLOCK_FOCUS[blockNumber];
  const offset = Math.max(0, lessonNumber - ((blockNumber - 1) * 10) - 1);
  const rotatedTechniques = rotate(block.techniques, offset);
  const rotatedGames = rotate(block.games, offset);
  const pending = (state.pending_adjustments || []).join(', ');
  const noteSummary = (state.notes_summary || []).slice(-2).join(' | ');

  return {
    lessonNumber,
    title: `lekce ${lessonNumber} – ${block.title.toLowerCase()}`,
    goal: block.goals.slice(0, 2).join(', '),
    generated: true,
    sections: {
      zahajeni: ['Seiza, mokuso, rei.', 'Krátce připomenout 1 pravidlo dojo a dnešní cíl.'],
      zahrati: [
        `${rotatedGames[0]} – krátká kola 20 až 30 sekund a časté střídání`,
        'Lehký běh se změnou směru a zastavení do postoje'
      ],
      kihon: [
        `4 min – hlavní technika: ${rotatedTechniques[0]}`,
        `4 min – podpůrná technika: ${rotatedTechniques[1] || rotatedTechniques[0]}`,
        '3 min – krátká výzva na signál nebo ve dvojici',
        '4 min – jednoduchá kombinace v pohybu bez dlouhého čekání'
      ],
      kata: [
        'Fukyugata Ichi – nejprve směr a embusen',
        blockNumber >= 3 ? 'Po částech a potom 1 až 2 plynulá opakování' : 'Po částech a potom 1 společné pomalé provedení'
      ],
      hra: [
        `${rotatedGames[1] || rotatedGames[0]} – hlavní hra navázaná na cíl lekce`,
        `${rotatedGames[2] || rotatedGames[0]} – krátká záložní varianta při poklesu pozornosti`
      ],
      zaver: ['Pochvala, rei.', pending ? `Pohlídat při lekci: ${pending}` : 'Krátké shrnutí a 1 otázka dětem, co si zapamatovaly.']
    },
    contextNote: noteSummary || null
  };
}

export async function loadManualRepository(manualFile) {
  const content = await fs.readFile(manualFile, 'utf8');
  const lessons = parseDetailedLessons(content);

  return {
    content,
    lessons,
    getLessonPlan(lessonNumber, state) {
      return lessons.get(lessonNumber) || buildGeneratedLesson(lessonNumber, state);
    }
  };
}
