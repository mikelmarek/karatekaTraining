const KNOWN_GAME_DESCRIPTIONS = {
  'Stínový ninja': 've dvojici jeden vede pohyb a druhý ho zrcadlí',
  'Dotkni se kolena': 'lehké reakční kolo bez úderů, ruce nahoře',
  'Karate socha': 'na povel okamžitě zastavit a vytvořit postoj',
  'Samurai reakce': 'chytání pásu nebo měkkého předmětu před dopadem',
  'Sumo': 'krátká bezpečná kola na stabilitu a práci nohou',
  'Sumo turnaj': 'krátká bezpečná kola s častým střídáním dětí',
  'Ninja průchod': 'proběhnout mezi překážkami tělem bez tvrdého kontaktu',
  'Karate paměť': 'opakování krátké kombinace technik po trenérovi',
  'Ninja rovnováha': 'stabilita na jedné noze s lehkým vychýlením',
  'Obrana hradu': 'obrana kuželu krokem a tělem bez úderů'
};

function expandKnownDescription(line) {
  const trimmed = line.trim();
  const description = KNOWN_GAME_DESCRIPTIONS[trimmed];
  return description ? `${trimmed} – ${description}` : trimmed;
}

function formatSection(lines) {
  const items = lines.filter(Boolean).map((line) => `   ◦ ${expandKnownDescription(line)}`);
  return items.length ? items.join('\n') : '   ◦ —';
}

function safeJoin(lines) {
  return lines.filter(Boolean).map((line) => expandKnownDescription(line)).join(', ');
}

function detectPrimaryKata(lines) {
  const text = (lines || []).join(' ');

  if (/fukyugata\s+ichi/i.test(text)) {
    return 'Fukyugata Ichi';
  }
  if (/fukyugata\s+ni/i.test(text)) {
    return 'Fukyugata Ni';
  }
  if (/naihanchi\s+shodan/i.test(text)) {
    return 'Naihanchi Shodan';
  }
  if (/naihanchi\s+nidan/i.test(text)) {
    return 'Naihanchi Nidan';
  }
  if (/naihanchi\s+sandan/i.test(text)) {
    return 'Naihanchi Sandan';
  }
  if (/naihanchi/i.test(text)) {
    return 'Naihanchi';
  }
  if (/pinan\s+shodan/i.test(text)) {
    return 'Pinan Shodan';
  }
  if (/pinan\s+nidan/i.test(text)) {
    return 'Pinan Nidan';
  }
  if (/pinan\s+sandan/i.test(text)) {
    return 'Pinan Sandan';
  }
  if (/pinan\s+yondan/i.test(text)) {
    return 'Pinan Yondan';
  }
  if (/pinan\s+godan/i.test(text)) {
    return 'Pinan Godan';
  }
  if (/pinan/i.test(text)) {
    return 'Pinan';
  }

  return 'kata dle lekce';
}

function buildDetailedMessage({ lesson, state, event, reminderType }) {
  const reminderLabel = reminderType === '30h' ? 'Detailní plán před tréninkem' : 'Připomenutí před tréninkem';
  const eventDate = new Date(event.start);
  const dateLabel = new Intl.DateTimeFormat('cs-CZ', {
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(eventDate);

  const tools = new Set();
  if (lesson.sections.hra.some((item) => /kužel|hrad/i.test(item))) {
    tools.add('kužely');
  }
  if (lesson.sections.zahrati.some((item) => /pás|tyč/i.test(item))) {
    tools.add('pás nebo měkkou tyč');
  }
  if (!tools.size) {
    tools.add('pásky nebo kužely');
  }

  const kataName = detectPrimaryKata(lesson.sections.kata);
  const groupLabel = state.training_group === 'advanced' ? 'pokročilí' : 'začátečníci';
  const groupBadge = state.training_group === 'advanced' ? 'POKROČILÍ' : 'ZAČÁTEČNÍCI';

  const noteTail = lesson.contextNote
    ? `\nPoznámka z minulých lekcí: ${lesson.contextNote}`
    : '';

  return [
    `🥋 <b>${reminderLabel} – ${groupBadge}</b>`,
    '',
    `📅 ${dateLabel}`,
    `📘 Lekce ${lesson.lessonNumber}: ${capitalize(lesson.title)}`,
    `🎯 Cíl: ${lesson.goal}`,
    `🧒 Skupina: ${state.age_group} let • ${groupLabel}`,
    `📦 Pomůcky: ${Array.from(tools).join(', ')}`,
    '',
    '<b>60min plán</b>',
    `• Zahájení (3 min):\n${formatSection(lesson.sections.zahajeni)}`,
    `• Zahřátí (10 min):\n${formatSection(lesson.sections.zahrati)}`,
    `• Kihon (15 min):\n${formatSection(lesson.sections.kihon)}`,
    `• Kata – ${kataName} (10 min):\n${formatSection(lesson.sections.kata)}`,
    `• Hra / partner (15 min):\n${formatSection(lesson.sections.hra)}`,
    `• Závěr (7 min):\n${formatSection(lesson.sections.zaver)}`,
    '',
    `<b>Varianta pro menší děti:</b> Zkrať kihon o 3–5 minut a přidej víc ukazování pohybem.`,
    `<b>Varianta pro malou skupinu:</b> Více dvojic, delší střídání rolí, více individuální pochvaly.`,
    `<b>Varianta když jsou děti divoké:</b> Dej rychle Karate sochu nebo Sumo s jasnými pravidly.`,
    `<b>Varianta když jsou unavené:</b> Zkrať opakování kata a nech jen 1 hlavní technický cíl.`,
    '',
    `<b>Poznámka pro trenéra:</b> Drž poměr cca 70 % pohyb a hry / 30 % technika.${noteTail}`,
    '<b>Po tréninku si zapiš:</b> co fungovalo, co bylo moc těžké a co děti bavilo.'
  ].join('\n');
}

function buildShortReminder({ lesson, state, event }) {
  const eventDate = new Date(event.start);
  const timeLabel = new Intl.DateTimeFormat('cs-CZ', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(eventDate);
  const kataName = detectPrimaryKata(lesson.sections.kata);
  const groupLabel = state.training_group === 'advanced' ? 'pokročilí' : 'začátečníci';
  const groupBadge = state.training_group === 'advanced' ? 'POKROČILÍ' : 'ZAČÁTEČNÍCI';

  return [
    `⏰ <b>Krátké připomenutí – ${groupBadge}</b>`,
    '',
    `Dnes v ${timeLabel} je ${groupLabel} lekce ${lesson.lessonNumber}: ${capitalize(lesson.title)}.`,
    `🎯 Cíl: ${lesson.goal}`,
    `🥋 Kihon: ${safeJoin(lesson.sections.kihon.slice(0, 3))}`,
    `🧭 Kata: ${kataName} – ${safeJoin(lesson.sections.kata.slice(0, 2))}`,
    `🎲 Záložní hra: ${lesson.sections.hra[0] || lesson.sections.zahrati[0] || 'Karate socha'}`,
    `📦 Pomůcky: ${lesson.sections.hra.some((item) => /hrad|kužel/i.test(item)) ? 'kužely' : 'pásky nebo kužely'}`
  ].join('\n');
}

function capitalize(value) {
  if (!value) {
    return '';
  }
  return value.charAt(0).toUpperCase() + value.slice(1);
}

export function createReminderMessage(payload) {
  return payload.reminderType === '30h'
    ? buildDetailedMessage(payload)
    : buildShortReminder(payload);
}

export function createCurriculumExhaustedMessage({ state, event, reminderType }) {
  const reminderLabel = reminderType === '30h' ? 'Upozornění před tréninkem' : 'Krátké upozornění';
  const eventDate = new Date(event.start);
  const dateLabel = new Intl.DateTimeFormat('cs-CZ', {
    dateStyle: 'full',
    timeStyle: 'short'
  }).format(eventDate);
  const groupBadge = state.training_group === 'advanced' ? 'POKROČILÍ' : 'ZAČÁTEČNÍCI';
  const recentHistory = (state.lesson_history || []).slice(-5);
  const historyLines = recentHistory.length
    ? recentHistory.map((item) => {
      const itemDate = new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'short' }).format(new Date(item.eventStart));
      return `• ${itemDate} – lekce ${item.lessonNumber}`;
    }).join('\n')
    : '• Zatím není zapsaná historie tréninků.';

  return [
    `📚 <b>${reminderLabel} – ${groupBadge}</b>`,
    '',
    `📅 Blíží se trénink: ${dateLabel}`,
    'Byly vyčerpány všechny připravené lekce 1–40.',
    '',
    '<b>Co udělat teď</b>',
    '• podívat se do lesson history, co už skupina prošla,',
    '• vyhodnotit, co děti zvládají jistě a co je potřeba upevnit,',
    '• připravit navazující blok pro pokročilejší učení,',
    '• teprve potom nastavit další sérii lekcí.',
    '',
    '<b>Poslední zapsané lekce</b>',
    historyLines,
    '',
    'Až bude nová série připravená, stačí doplnit osnovu a nastavit další číslo lekce.'
  ].join('\n');
}
