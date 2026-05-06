const AUTH_REQUIRED_ERROR = 'AUTH_REQUIRED';

const EMPTY_SHARED_STATE = {
  version: 2,
  updatedAt: null,
  updatedBy: null,
  notesByLesson: {},
  overridesByLesson: {},
  history: []
};

const TAB_KEYS = {
  calendar: 'calendar',
  drawer: 'drawer',
  history: 'history',
  dojo: 'dojo'
};

const SECTION_LABELS = {
  zahajeni: 'Zahájení',
  zahrati: 'Zahřátí',
  mobilita: 'Mobilita',
  priprava: 'Průprava',
  reakce: 'Reakce',
  koordinace: 'Koordinace',
  kihon: 'Kihon',
  kata: 'Kata',
  hra: 'Hra / partner',
  zaver: 'Závěr',
  ostatni: 'Další body lekce',
  insertedExercises: 'Vložené cviky ze šuplíku'
};

const SECTION_ORDER = [
  'zahajeni',
  'zahrati',
  'mobilita',
  'priprava',
  'reakce',
  'koordinace',
  'kihon',
  'kata',
  'hra',
  'zaver',
  'ostatni'
];

const EXERCISE_ALIAS_MAP = {
  'barvy a mety': ['E4'],
  'reakce na barvu': ['E4'],
  'reakce na barvu / svetlo': ['E4'],
  'reakce na svetlo': ['E4'],
  'opice': ['D6'],
  'opici draha': ['D6'],
  'opici prekazkova draha': ['D6'],
  'lapy na presnost': ['J1'],
  'dvojice s mickem': ['I3'],
  'micky ve dvojici': ['I3'],
  'micek o zed': ['E2'],
  'kratke reakcni hry': ['E1', 'E4'],
  'tymova soutez': ['D5'],
  'mini zkouskovy blok': ['J2']
};

const state = {
  data: null,
  exerciseIndex: [],
  sharedState: structuredClone(EMPTY_SHARED_STATE),
  selectedMonthId: null,
  selectedLessonId: null,
  selectedExerciseId: null,
  modalExerciseId: null,
  selectedCategoryId: 'ALL',
  selectedTab: TAB_KEYS.calendar,
  searchQuery: '',
  drawerNotice: '',
  pendingHistoryEntries: [],
  saveTimer: null,
  hasUnsavedChanges: false,
  sync: {
    status: 'idle',
    message: 'Sdílený stav připravený.',
    lastSavedAt: null
  },
  auth: {
    username: null
  }
};

const refs = {
  authGate: document.getElementById('authGate'),
  appShell: document.getElementById('appShell'),
  loginForm: document.getElementById('loginForm'),
  loginUsernameInput: document.getElementById('loginUsernameInput'),
  loginPasswordInput: document.getElementById('loginPasswordInput'),
  loginSubmitButton: document.getElementById('loginSubmitButton'),
  loginError: document.getElementById('loginError'),
  loginInfo: document.getElementById('loginInfo'),
  sessionStatus: document.getElementById('sessionStatus'),
  logoutButton: document.getElementById('logoutButton'),
  monthNav: document.getElementById('monthNav'),
  monthSummary: document.getElementById('monthSummary'),
  plannerTitle: document.getElementById('plannerTitle'),
  plannerMeta: document.getElementById('plannerMeta'),
  sharedStateBadge: document.getElementById('sharedStateBadge'),
  sharedStateStatus: document.getElementById('sharedStateStatus'),
  calendarTabButton: document.getElementById('calendarTabButton'),
  drawerTabButton: document.getElementById('drawerTabButton'),
  historyTabButton: document.getElementById('historyTabButton'),
  dojoTabButton: document.getElementById('dojoTabButton'),
  calendarView: document.getElementById('calendarView'),
  drawerView: document.getElementById('drawerView'),
  historyView: document.getElementById('historyView'),
  dojoView: document.getElementById('dojoView'),
  historyList: document.getElementById('historyList'),
  dojoRulesContent: document.getElementById('dojoRulesContent'),
  dojoCoachGuideContent: document.getElementById('dojoCoachGuideContent'),
  exerciseModal: document.getElementById('exerciseModal'),
  exerciseModalContent: document.getElementById('exerciseModalContent'),
  closeExerciseModalButton: document.getElementById('closeExerciseModalButton'),
  selectedWeekContext: document.getElementById('selectedWeekContext'),
  weekGrid: document.getElementById('weekGrid'),
  annualFocusCard: document.getElementById('annualFocusCard'),
  selectedLessonBadge: document.getElementById('selectedLessonBadge'),
  selectedLessonTitle: document.getElementById('selectedLessonTitle'),
  selectedLessonMeta: document.getElementById('selectedLessonMeta'),
  lessonCarryover: document.getElementById('lessonCarryover'),
  planSections: document.getElementById('planSections'),
  completedInput: document.getElementById('completedInput'),
  incompleteInput: document.getElementById('incompleteInput'),
  nextTimeInput: document.getElementById('nextTimeInput'),
  trainerNotesInput: document.getElementById('trainerNotesInput'),
  exerciseSearchInput: document.getElementById('exerciseSearchInput'),
  categoryFilters: document.getElementById('categoryFilters'),
  exerciseList: document.getElementById('exerciseList'),
  exerciseDetail: document.getElementById('exerciseDetail'),
  exportStateButton: document.getElementById('exportStateButton'),
  importStateInput: document.getElementById('importStateInput'),
  resetStateButton: document.getElementById('resetStateButton'),
  downloadSharedStateButton: document.getElementById('downloadSharedStateButton')
};

async function fetchJson(url, options = {}) {
  const response = await fetch(url, {
    credentials: 'same-origin',
    ...options,
    headers: {
      ...(options.body ? { 'Content-Type': 'application/json' } : {}),
      ...(options.headers || {})
    }
  });

  if (response.status === 401) {
    throw new Error(AUTH_REQUIRED_ERROR);
  }

  if (!response.ok) {
    const payloadText = await response.text();

    try {
      const payload = JSON.parse(payloadText);
      throw new Error(payload.error || `Request failed: ${response.status}`);
    } catch {
      throw new Error(payloadText || `Request failed: ${response.status}`);
    }
  }

  return response.json();
}

async function loadData() {
  const [plannerData, sharedState] = await Promise.all([
    fetchJson('/api/planner/data'),
    fetchJson('/api/planner/shared-state').catch(() => null)
  ]);

  state.data = plannerData;
  state.exerciseIndex = createExerciseIndex(state.data.exerciseDrawer.exercises);

  if (sharedState) {
    state.sharedState = normalizeSharedState(sharedState);
    state.sync.status = state.sharedState.updatedAt ? 'saved' : 'idle';
    state.sync.message = state.sharedState.updatedAt
      ? `Sdílený planner • ${formatDate(state.sharedState.updatedAt)}`
      : 'Sdílený planner připravený';
    state.sync.lastSavedAt = state.sharedState.updatedAt;
  }

  const initialMonth = state.data.calendar[0];
  state.selectedMonthId = initialMonth?.id || null;
  state.selectedLessonId = initialMonth?.weeks[0]?.id || null;
  state.selectedExerciseId = state.data.exerciseDrawer.exercises[0]?.id || null;

  render();
}

function normalizeSharedState(value) {
  const sharedState = value && typeof value === 'object' ? value : {};
  return {
    ...structuredClone(EMPTY_SHARED_STATE),
    ...sharedState,
    notesByLesson: sharedState.notesByLesson && typeof sharedState.notesByLesson === 'object' ? sharedState.notesByLesson : {},
    overridesByLesson: sharedState.overridesByLesson && typeof sharedState.overridesByLesson === 'object' ? sharedState.overridesByLesson : {},
    history: Array.isArray(sharedState.history) ? sharedState.history : []
  };
}

function setLoginError(message) {
  refs.loginError.textContent = message;
  refs.loginError.hidden = !message;
}

function setLoginInfo(message) {
  refs.loginInfo.textContent = message;
}

function showAuthGate() {
  refs.authGate.hidden = false;
  refs.appShell.hidden = true;
  document.body.classList.add('auth-only');
  refs.loginPasswordInput.value = '';
}

function showAppShell() {
  refs.authGate.hidden = true;
  refs.appShell.hidden = false;
  document.body.classList.remove('auth-only');
  refs.sessionStatus.textContent = state.auth.username ? `Přihlášen: ${state.auth.username}` : '';
}

async function checkSession() {
  try {
    const session = await fetchJson('/api/planner/auth/session');
    state.auth.username = session.username;
    return true;
  } catch (error) {
    if (error.message === AUTH_REQUIRED_ERROR) {
      return false;
    }
    throw error;
  }
}

async function submitLogin(username, password) {
  const payload = await fetchJson('/api/planner/auth/login', {
    method: 'POST',
    body: JSON.stringify({ username, password })
  });
  state.auth.username = payload.username;
  return payload;
}

async function logout() {
  try {
    await fetchJson('/api/planner/auth/logout', {
      method: 'POST',
      body: JSON.stringify({})
    });
  } catch (error) {
    if (error.message !== AUTH_REQUIRED_ERROR) {
      console.warn(error);
    }
  }

  state.auth.username = null;
  showAuthGate();
  setLoginError('');
  setLoginInfo('Byl jsi odhlášen.');
}

async function bootstrapApp() {
  if (await checkSession()) {
    showAppShell();
    await loadData();
    return;
  }

  showAuthGate();
  setLoginError('');
  setLoginInfo('Přihlas se jménem a heslem. Po úspěšném přihlášení se odešle e-mailová notifikace.');
}

function setSyncState(status, message) {
  state.sync.status = status;
  state.sync.message = message;
  renderHeader();
}

function summarizeNoteFields(partial) {
  const labels = [];
  if (Object.hasOwn(partial, 'completed')) labels.push('co jsme stihli');
  if (Object.hasOwn(partial, 'incomplete')) labels.push('co jsme nestihli');
  if (Object.hasOwn(partial, 'nextTime')) labels.push('co příště přidat');
  if (Object.hasOwn(partial, 'trainerNotes')) labels.push('další poznámky');
  return labels;
}

function queueHistoryEntry(entry) {
  const lesson = lessonById(entry.lessonId);
  const month = lesson ? state.data.calendar.find((item) => item.weeks.some((week) => week.id === lesson.id)) : null;
  const nextEntry = {
    lessonId: entry.lessonId,
    lessonTitle: entry.lessonTitle || lesson?.title || null,
    monthName: entry.monthName || month?.name || null,
    type: entry.type || 'update',
    summary: entry.summary || 'Úprava plánu',
    fields: [...new Set(entry.fields || [])]
  };

  const existingIndex = state.pendingHistoryEntries.findIndex(
    (item) => item.lessonId === nextEntry.lessonId && item.type === nextEntry.type
  );

  if (existingIndex >= 0) {
    const existing = state.pendingHistoryEntries[existingIndex];
    state.pendingHistoryEntries[existingIndex] = {
      ...existing,
      summary: nextEntry.summary,
      fields: [...new Set([...(existing.fields || []), ...(nextEntry.fields || [])])]
    };
    return;
  }

  state.pendingHistoryEntries.push(nextEntry);
}

function scheduleSharedStateSave() {
  state.hasUnsavedChanges = true;
  setSyncState('saving', 'Čeká na uložení do sdíleného planneru...');
  window.clearTimeout(state.saveTimer);
  state.saveTimer = window.setTimeout(() => {
    void persistSharedState();
  }, 700);
}

async function persistSharedState(force = false) {
  window.clearTimeout(state.saveTimer);
  state.saveTimer = null;

  if (!force && !state.hasUnsavedChanges) {
    return;
  }

  const historyEntries = [...state.pendingHistoryEntries];
  state.pendingHistoryEntries = [];
  setSyncState('saving', 'Ukládám sdílený planner...');

  try {
    const savedState = await fetchJson('/api/planner/shared-state', {
      method: 'POST',
      body: JSON.stringify({
        state: state.sharedState,
        historyEntries
      })
    });
    state.sharedState = normalizeSharedState(savedState);
    state.hasUnsavedChanges = false;
    state.sync.lastSavedAt = state.sharedState.updatedAt;
    setSyncState('saved', state.sharedState.updatedAt
      ? `Uloženo ${formatDate(state.sharedState.updatedAt)}`
      : 'Uloženo do sdíleného planneru.');
    render();
  } catch (error) {
    state.pendingHistoryEntries = [...historyEntries, ...state.pendingHistoryEntries];
    setSyncState('error', `Uložení selhalo: ${error.message}`);
    throw error;
  }
}

function downloadJson(filename, payload) {
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function normalizeText(value) {
  return (value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function createExerciseIndex(exercises) {
  return exercises.map((exercise) => {
    const aliases = new Set([normalizeText(exercise.name)]);

    for (const [alias, ids] of Object.entries(EXERCISE_ALIAS_MAP)) {
      if (ids.includes(exercise.id)) {
        aliases.add(alias);
      }
    }

    return {
      id: exercise.id,
      aliases: [...aliases].filter(Boolean).sort((a, b) => b.length - a.length)
    };
  });
}

function monthById(monthId) {
  return state.data.calendar.find((month) => month.id === monthId);
}

function lessonById(lessonId) {
  return state.data.calendar.flatMap((month) => month.weeks).find((week) => week.id === lessonId);
}

function orderedLessons() {
  return state.data.calendar.flatMap((month) =>
    month.weeks.map((week) => ({ ...week, monthId: month.id, monthName: month.name }))
  );
}

function previousLessonOf(lessonId) {
  const lessons = orderedLessons();
  const lessonIndex = lessons.findIndex((lesson) => lesson.id === lessonId);
  if (lessonIndex <= 0) {
    return null;
  }
  return lessons[lessonIndex - 1];
}

function exerciseById(exerciseId) {
  return state.data.exerciseDrawer.exercises.find((exercise) => exercise.id === exerciseId);
}

function getLessonState(lessonId) {
  return {
    notes: {
      ...(state.sharedState.notesByLesson?.[lessonId] || {})
    },
    overrides: mergeLessonOverrides(state.sharedState.overridesByLesson?.[lessonId])
  };
}

function mergeLessonOverrides(sharedOverrides = {}) {
  const sharedAdded = sharedOverrides.addedItemsBySection || {};

  return {
    selectedExercises: [...new Set([...(sharedOverrides.selectedExercises || [])])],
    addedItemsBySection: mergeAddedItems(sharedAdded)
  };
}

function mergeAddedItems(sharedAdded, localAdded = {}) {
  const keys = new Set([...Object.keys(sharedAdded), ...Object.keys(localAdded)]);
  const merged = {};
  for (const key of keys) {
    merged[key] = [...(sharedAdded[key] || []), ...(localAdded[key] || [])];
  }
  return merged;
}

function updateLessonNotes(partial) {
  const lessonId = state.selectedLessonId;
  if (!lessonId) {
    return;
  }

  state.sharedState.notesByLesson[lessonId] = {
    ...(state.sharedState.notesByLesson[lessonId] || {}),
    ...partial
  };
  queueHistoryEntry({
    lessonId,
    type: 'notes',
    summary: 'Úprava trenérských poznámek',
    fields: summarizeNoteFields(partial)
  });
  scheduleSharedStateSave();
}

function updateLessonOverrides(mutator) {
  const lessonId = state.selectedLessonId;
  if (!lessonId) {
    return;
  }

  const current = mergeLessonOverrides(state.sharedState.overridesByLesson[lessonId]);
  const next = mutator(current) || current;
  state.sharedState.overridesByLesson[lessonId] = next;
  queueHistoryEntry({
    lessonId,
    type: 'plan',
    summary: 'Úprava obsahu lekce nebo vložených cviků',
    fields: ['plán lekce']
  });
  scheduleSharedStateSave();
  renderPlanDetail();
}

function setSelectedMonth(monthId) {
  state.selectedMonthId = monthId;
  const month = monthById(monthId);
  if (month && !month.weeks.some((week) => week.id === state.selectedLessonId)) {
    state.selectedLessonId = month.weeks[0]?.id || null;
  }
  render();
}

function setSelectedLesson(lessonId) {
  state.selectedLessonId = lessonId;
  state.drawerNotice = '';
  renderWeekGrid();
  renderPlanDetail();
  renderSelectedWeekContext();
}

function setSelectedTab(tabKey) {
  state.selectedTab = tabKey;
  renderTabState();
}

function openExercise(exerciseId) {
  openExerciseModal(exerciseId);
}

function openExerciseModal(exerciseId) {
  state.modalExerciseId = exerciseId;
  renderExerciseModal();
  refs.exerciseModal.hidden = false;
}

function closeExerciseModal() {
  state.modalExerciseId = null;
  refs.exerciseModal.hidden = true;
  refs.exerciseModalContent.innerHTML = '';
}

function openExerciseInDrawer(exerciseId) {
  state.selectedExerciseId = exerciseId;
  state.selectedTab = TAB_KEYS.drawer;
  renderTabState();
  renderExerciseList();
  renderExerciseDetail();

  requestAnimationFrame(() => {
    const card = document.getElementById(`exercise-card-${exerciseId}`);
    card?.scrollIntoView({ block: 'center', behavior: 'smooth' });
  });
}

function render() {
  renderHeader();
  renderTabState();
  renderMonthNav();
  renderMonthSummary();
  renderWeekGrid();
  renderAnnualFocus();
  renderPlanDetail();
  renderSelectedWeekContext();
  renderExerciseFilters();
  renderExerciseList();
  renderExerciseDetail();
  renderHistoryView();
  renderDojoView();
}

function renderHeader() {
  const currentMonth = monthById(state.selectedMonthId);
  refs.plannerTitle.textContent = currentMonth ? currentMonth.name : 'Roční plán';
  refs.plannerMeta.textContent = currentMonth
    ? `${currentMonth.mainGoal} • ${currentMonth.weeks.length} týdenní lekce`
    : '';
  refs.sharedStateBadge.textContent = state.sync.message || (state.sharedState.updatedAt
    ? `Sdílený planner • ${formatDate(state.sharedState.updatedAt)}`
    : 'Sdílený planner připravený');
  refs.sharedStateBadge.classList.toggle('is-saving', state.sync.status === 'saving');
  refs.sharedStateBadge.classList.toggle('is-error', state.sync.status === 'error');
  refs.sharedStateBadge.classList.toggle('is-saved', state.sync.status === 'saved');
  refs.sharedStateStatus.textContent = state.sharedState.updatedBy
    ? `Poslední uložení: ${state.sharedState.updatedBy}${state.sharedState.updatedAt ? ` • ${formatDate(state.sharedState.updatedAt)}` : ''}`
    : 'Sdílený stav zatím nemá uložené změny.';
}

function renderTabState() {
  refs.calendarTabButton.classList.toggle('active', state.selectedTab === TAB_KEYS.calendar);
  refs.drawerTabButton.classList.toggle('active', state.selectedTab === TAB_KEYS.drawer);
  refs.historyTabButton.classList.toggle('active', state.selectedTab === TAB_KEYS.history);
  refs.dojoTabButton.classList.toggle('active', state.selectedTab === TAB_KEYS.dojo);
  refs.calendarView.classList.toggle('active', state.selectedTab === TAB_KEYS.calendar);
  refs.drawerView.classList.toggle('active', state.selectedTab === TAB_KEYS.drawer);
  refs.historyView.classList.toggle('active', state.selectedTab === TAB_KEYS.history);
  refs.dojoView.classList.toggle('active', state.selectedTab === TAB_KEYS.dojo);
}

function renderMonthNav() {
  refs.monthNav.innerHTML = '';
  for (const month of state.data.calendar) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `month-button${month.id === state.selectedMonthId ? ' active' : ''}`;
    button.innerHTML = `<strong>${month.name}</strong><br /><span>${month.weeks.length} týdny</span>`;
    button.addEventListener('click', () => setSelectedMonth(month.id));
    refs.monthNav.appendChild(button);
  }
}

function renderMonthSummary() {
  const month = monthById(state.selectedMonthId);
  if (!month) {
    refs.monthSummary.innerHTML = '';
    return;
  }

  refs.monthSummary.innerHTML = `
    <div class="summary-card">
      <h3>${month.name}</h3>
      <p>${month.mainGoal}</p>
      <p><strong>Technický cíl:</strong> ${month.technicalGoals.join(', ')}</p>
      <p><strong>Pohybový cíl:</strong> ${month.movementGoals.join(', ')}</p>
      <p><strong>Pomůcky:</strong> ${month.monthTools.join(', ') || 'dle lekce'}</p>
      <p><strong>Kontrolní bod:</strong> ${month.checkpoint}</p>
    </div>
  `;
}

function renderWeekGrid() {
  const month = monthById(state.selectedMonthId);
  refs.weekGrid.innerHTML = '';
  if (!month) {
    return;
  }

  for (const week of month.weeks) {
    const lessonState = getLessonState(week.id);
    const card = document.createElement('button');
    card.type = 'button';
    card.className = `week-card${week.id === state.selectedLessonId ? ' active' : ''}`;
    card.innerHTML = `
      <h4>${week.title}</h4>
      <p>${week.theme}</p>
      <p class="exercise-meta">${lessonState.notes.nextTime ? `Příště: ${lessonState.notes.nextTime}` : 'Bez poznámky pro příště'}</p>
    `;
    card.addEventListener('click', () => setSelectedLesson(week.id));
    refs.weekGrid.appendChild(card);
  }
}

function renderAnnualFocus() {
  const month = monthById(state.selectedMonthId);
  const annualFocus = month?.annualFocus;
  if (!annualFocus) {
    refs.annualFocusCard.innerHTML = '<div class="empty-state">Roční fokus pro tento měsíc nebyl rozpoznán.</div>';
    return;
  }

  const mainGoal = annualFocus.mainGoal.length ? annualFocus.mainGoal.join(', ') : 'zatím bez obsahu v podkladu';
  const technicalGoal = annualFocus.technicalGoal.length ? annualFocus.technicalGoal.join(', ') : 'zatím bez obsahu v podkladu';
  const movementGoal = annualFocus.movementGoal.length ? annualFocus.movementGoal.join(', ') : 'zatím bez obsahu v podkladu';
  const gameTypes = annualFocus.gameTypes.length ? annualFocus.gameTypes.join(', ') : 'zatím bez obsahu v podkladu';
  const checkpoint = annualFocus.checkpoint.length ? annualFocus.checkpoint.join(', ') : 'zatím bez obsahu v podkladu';

  refs.annualFocusCard.innerHTML = `
    <h4>${annualFocus.name}</h4>
    <p>${annualFocus.focus}</p>
    <p><strong>Hlavní cíl:</strong> ${mainGoal}</p>
    <p><strong>Technický cíl:</strong> ${technicalGoal}</p>
    <p><strong>Pohybový cíl:</strong> ${movementGoal}</p>
    <p><strong>Typy her:</strong> ${gameTypes}</p>
    <p><strong>Kontrolní bod:</strong> ${checkpoint}</p>
    <p class="exercise-meta">Tato karta drží měsíční metodický rámec. Týdenní operativu upravuješ v detailu lekce.</p>
  `;
}

function renderPlanDetail() {
  const week = lessonById(state.selectedLessonId);
  if (!week) {
    refs.lessonCarryover.innerHTML = '';
    refs.planSections.innerHTML = '<div class="empty-state">Vyber týdenní lekci.</div>';
    return;
  }

  const lessonState = getLessonState(week.id);
  refs.selectedLessonBadge.textContent = `${monthById(state.selectedMonthId)?.name || ''} • ${week.title}`;
  refs.selectedLessonTitle.textContent = week.theme;
  refs.selectedLessonMeta.innerHTML = `
    <div><strong>Cíl lekce:</strong> ${week.lessonGoal}</div>
    <div><strong>Pomůcky:</strong> ${week.tools.join(', ') || monthById(state.selectedMonthId)?.monthTools.join(', ') || 'dle situace'}</div>
  `;

  renderLessonCarryover(week.id);

  refs.planSections.innerHTML = '';

  const sections = week.derivedSections || { ostatni: week.content || [] };
  for (const sectionKey of SECTION_ORDER) {
    const baseItems = sections[sectionKey] || [];
    const customItems = lessonState.overrides.addedItemsBySection?.[sectionKey] || [];
    if (!baseItems.length && !customItems.length) {
      continue;
    }

    refs.planSections.appendChild(
      createSectionCard({
        sectionKey,
        title: SECTION_LABELS[sectionKey] || sectionKey,
        items: [
          ...baseItems.map((value, index) => createDisplayItem(value, `${sectionKey}:${index}`)),
          ...customItems.map((value, index) => createDisplayItem(value, `custom:${sectionKey}:${index}`, true))
        ]
      })
    );
  }

  const insertedExercises = (lessonState.overrides.selectedExercises || [])
    .map((exerciseId, index) => {
      const exercise = exerciseById(exerciseId);
      if (!exercise) {
        return null;
      }
      return {
        id: `exercise:${index}`,
        value: `${exercise.name} – ${exercise.description || exercise.goal}`,
        custom: true,
        exerciseId: exercise.id,
        matches: [exercise.id]
      };
    })
    .filter(Boolean);

  if (insertedExercises.length) {
    refs.planSections.appendChild(
      createSectionCard({
        sectionKey: 'insertedExercises',
        title: SECTION_LABELS.insertedExercises,
        items: insertedExercises,
        allowManualAdd: false
      })
    );
  }

  refs.completedInput.value = lessonState.notes.completed || '';
  refs.incompleteInput.value = lessonState.notes.incomplete || '';
  refs.nextTimeInput.value = lessonState.notes.nextTime || '';
  refs.trainerNotesInput.value = lessonState.notes.trainerNotes || '';
}

function renderLessonCarryover(lessonId) {
  const previousLesson = previousLessonOf(lessonId);
  if (!previousLesson) {
    refs.lessonCarryover.innerHTML = '';
    return;
  }

  const previousState = getLessonState(previousLesson.id);
  const carryNextTime = previousState.notes.nextTime?.trim();
  const carryTrainerNotes = previousState.notes.trainerNotes?.trim();

  if (!carryNextTime && !carryTrainerNotes) {
    refs.lessonCarryover.innerHTML = '';
    return;
  }

  refs.lessonCarryover.innerHTML = `
    <section class="carryover-card">
      <div class="carryover-header">
        <div>
          <p class="eyebrow">Návaznost z minulé lekce</p>
          <h4>${previousLesson.monthName} • ${previousLesson.title}</h4>
          <p class="carryover-theme">${previousLesson.theme}</p>
        </div>
      </div>
      <div class="carryover-list">
        ${carryNextTime ? `
          <div class="carryover-item">
            <div>
              <strong>Co příště přidat</strong>
              <p>${carryNextTime}</p>
            </div>
            <div class="carryover-actions">
              <button id="carryoverToPlanButton" type="button" class="ghost-button small-button">Přenést do plánu</button>
              <button id="carryoverToNotesButton" type="button" class="ghost-button small-button">Přenést do poznámek</button>
            </div>
          </div>
        ` : ''}
        ${carryTrainerNotes ? `
          <div class="carryover-item">
            <div>
              <strong>Další poznámky</strong>
              <p>${carryTrainerNotes}</p>
            </div>
            <div class="carryover-actions">
              <button id="carryoverTrainerToNotesButton" type="button" class="ghost-button small-button">Přidat do trenérských poznámek</button>
            </div>
          </div>
        ` : ''}
      </div>
    </section>
  `;

  document.getElementById('carryoverToPlanButton')?.addEventListener('click', () => {
    addCustomItem('ostatni', `Navázat na minulou lekci: ${carryNextTime}`);
  });

  document.getElementById('carryoverToNotesButton')?.addEventListener('click', () => {
    appendToCurrentTrainerNotes(`Navázat na minulou lekci: ${carryNextTime}`);
  });

  document.getElementById('carryoverTrainerToNotesButton')?.addEventListener('click', () => {
    appendToCurrentTrainerNotes(`Poznámka z ${previousLesson.title}: ${carryTrainerNotes}`);
  });
}

function appendToCurrentTrainerNotes(text) {
  const lessonId = state.selectedLessonId;
  if (!lessonId || !text?.trim()) {
    return;
  }

  const currentNotes = getLessonState(lessonId).notes.trainerNotes?.trim();
  const nextValue = currentNotes ? `${currentNotes}\n\n${text}` : text;
  updateLessonNotes({ trainerNotes: nextValue });
  refs.trainerNotesInput.value = nextValue;
}

function renderExerciseInfo(exercise, options = {}) {
  const actionMarkup = options.includeDrawerButton
    ? '<button id="openExerciseInDrawerButton" type="button" class="ghost-button small-button">Otevřít v šuplíku</button>'
    : '';

  return `
    <h3 id="exerciseModalTitle">${exercise.name}</h3>
    <div class="exercise-detail-meta">
      <div><strong>Kategorie:</strong> ${exercise.categoryId} • ${exercise.categoryTitle}</div>
      <div><strong>Cíl:</strong> ${exercise.goal || 'neuvedeno'}</div>
      <div><strong>Pomůcky:</strong> ${exercise.tools || 'bez pomůcek'}</div>
      <div><strong>Popis:</strong> ${exercise.description || 'bez popisu'}</div>
      <div><strong>Varianty:</strong> ${exercise.variants || 'bez variant'}</div>
      <div><strong>Karate přenos:</strong> ${exercise.karateTransfer || 'bez poznámky'}</div>
      <div><strong>Poznámka pro trenéra:</strong> ${exercise.coachNote || 'bez poznámky'}</div>
    </div>
    ${actionMarkup}
  `;
}

function createDisplayItem(value, id, custom = false) {
  return {
    id,
    value,
    custom,
    matches: findExerciseMatches(value)
  };
}

function findExerciseMatches(text) {
  const normalizedText = normalizeText(text);
  const matches = new Set();

  for (const exercise of state.exerciseIndex) {
    if (exercise.aliases.some((alias) => alias && normalizedText.includes(alias))) {
      matches.add(exercise.id);
    }
  }

  return [...matches];
}

function createSectionCard({ sectionKey, title, items, allowManualAdd = true }) {
  const card = document.createElement('section');
  card.className = 'plan-section';

  const header = document.createElement('div');
  header.className = 'section-title-row';
  header.innerHTML = `<h4>${title}</h4>`;
  card.appendChild(header);

  const list = document.createElement('div');
  list.className = 'section-list';
  if (!items.length) {
    list.innerHTML = '<div class="empty-state">Zatím bez položek.</div>';
  }

  for (const item of items) {
    const row = document.createElement('div');
    row.className = 'section-item';

    const main = document.createElement('div');
    main.className = 'section-item-main';

    if (item.matches.length >= 1) {
      const primaryExerciseId = item.matches[0];
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'linked-item-button';
      button.textContent = item.value;
      button.addEventListener('click', () => openExercise(primaryExerciseId));
      main.appendChild(button);
      if (item.matches.length > 1) {
        const relatedLinks = document.createElement('div');
        relatedLinks.className = 'related-links';
        for (const exerciseId of item.matches.slice(1)) {
          const exercise = exerciseById(exerciseId);
          if (!exercise) {
            continue;
          }
          const button = document.createElement('button');
          button.type = 'button';
          button.className = 'tiny-button';
          button.textContent = exercise.name;
          button.addEventListener('click', () => openExercise(exerciseId));
          relatedLinks.appendChild(button);
        }
        if (relatedLinks.childElementCount) {
          main.appendChild(relatedLinks);
        }
      }
    } else if (item.custom) {
      const textNode = document.createElement('div');
      textNode.textContent = item.value;
      main.appendChild(textNode);
    } else {
      const textNode = document.createElement('div');
      textNode.textContent = item.value;
      main.appendChild(textNode);
    }

    row.appendChild(main);

    const actions = document.createElement('div');
    actions.className = 'item-actions';

    if (item.exerciseId) {
      const removeExerciseButton = document.createElement('button');
      removeExerciseButton.type = 'button';
      removeExerciseButton.className = 'tiny-button';
      removeExerciseButton.textContent = 'Odebrat cvik';
      removeExerciseButton.addEventListener('click', () => removeSelectedExercise(item.exerciseId));
      actions.appendChild(removeExerciseButton);
    } else if (item.custom) {
      const removeButton = document.createElement('button');
      removeButton.type = 'button';
      removeButton.className = 'tiny-button';
      removeButton.textContent = 'Smazat';
      removeButton.addEventListener('click', () => removeCustomItem(sectionKey, item.value));
      actions.appendChild(removeButton);
    }

    row.appendChild(actions);
    list.appendChild(row);
  }

  card.appendChild(list);

  if (allowManualAdd) {
    const addPanel = document.createElement('details');
    addPanel.className = 'section-add-panel';

    const summary = document.createElement('summary');
    summary.textContent = 'Přidat vlastní bod';
    addPanel.appendChild(summary);

    const addRow = document.createElement('div');
    addRow.className = 'section-add';

    const input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'Přidat vlastní bod do plánu';

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'ghost-button small-button';
    addButton.textContent = 'Přidat';
    addButton.addEventListener('click', () => {
      if (!input.value.trim()) {
        return;
      }
      addCustomItem(sectionKey, input.value.trim());
      input.value = '';
      addPanel.open = false;
    });

    input.addEventListener('keydown', (event) => {
      if (event.key !== 'Enter') {
        return;
      }
      event.preventDefault();
      addButton.click();
    });

    addRow.append(input, addButton);
    addPanel.appendChild(addRow);
    card.appendChild(addPanel);
  }

  return card;
}

function addCustomItem(sectionKey, value) {
  updateLessonOverrides((current) => ({
    ...current,
    addedItemsBySection: {
      ...(current.addedItemsBySection || {}),
      [sectionKey]: [...(current.addedItemsBySection?.[sectionKey] || []), value]
    }
  }));
}

function removeCustomItem(sectionKey, value) {
  updateLessonOverrides((current) => ({
    ...current,
    addedItemsBySection: {
      ...(current.addedItemsBySection || {}),
      [sectionKey]: (current.addedItemsBySection?.[sectionKey] || []).filter((item) => item !== value)
    }
  }));
}

function addSelectedExercise(exerciseId) {
  const lessonId = state.selectedLessonId;
  if (!lessonId) {
    state.drawerNotice = 'Nejdřív vyber týden v kalendáři.';
    renderSelectedWeekContext();
    return;
  }

  const lesson = lessonById(lessonId);
  const lessonState = getLessonState(lessonId);
  const alreadySelected = (lessonState.overrides.selectedExercises || []).includes(exerciseId);

  updateLessonOverrides((current) => ({
    ...current,
    selectedExercises: [...new Set([...(current.selectedExercises || []), exerciseId])]
  }));

  state.drawerNotice = alreadySelected
    ? `Cvik už je v týdnu ${lesson?.title || 'bez názvu'}.`
    : `Přidáno do týdne ${lesson?.title || 'bez názvu'}.`;
  renderSelectedWeekContext();
  renderWeekGrid();
}

function removeSelectedExercise(exerciseId) {
  updateLessonOverrides((current) => ({
    ...current,
    selectedExercises: (current.selectedExercises || []).filter((item) => item !== exerciseId)
  }));

  state.drawerNotice = 'Cvik byl z vybraného týdne odebrán.';
  renderSelectedWeekContext();
  renderWeekGrid();
}

function renderSelectedWeekContext() {
  const lesson = lessonById(state.selectedLessonId);
  if (!lesson) {
    refs.selectedWeekContext.innerHTML = '<div class="empty-state">Nejdřív vyber týden v kalendáři, potom se cvik přidá právě do něj.</div>';
    return;
  }

  const month = monthById(state.selectedMonthId);
  const lessonState = getLessonState(lesson.id);
  const selectedExerciseCount = (lessonState.overrides.selectedExercises || []).length;
  const notice = state.drawerNotice ? `<p class="drawer-notice">${state.drawerNotice}</p>` : '';

  refs.selectedWeekContext.innerHTML = `
    <div class="selected-week-card">
      <div>
        <p class="eyebrow">Vybraný týden pro vložení</p>
        <h4>${month?.name || ''} • ${lesson.title}</h4>
        <p class="selected-week-theme">${lesson.theme}</p>
        <p class="selected-week-meta">Vložené cviky ze šuplíku: ${selectedExerciseCount}</p>
        ${notice}
      </div>
      <button id="jumpToSelectedLessonButton" type="button" class="ghost-button small-button">Otevřít detail týdne</button>
    </div>
  `;

  document.getElementById('jumpToSelectedLessonButton')?.addEventListener('click', () => {
    state.selectedTab = TAB_KEYS.calendar;
    renderTabState();
    renderPlanDetail();
  });
}

function renderExerciseFilters() {
  refs.categoryFilters.innerHTML = '';
  const allCategories = [{ id: 'ALL', title: 'Vše' }, ...state.data.exerciseDrawer.categories];
  for (const category of allCategories) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = `chip-button${category.id === state.selectedCategoryId ? ' active' : ''}`;
    button.textContent = category.title;
    button.addEventListener('click', () => {
      state.selectedCategoryId = category.id;
      renderExerciseFilters();
      renderExerciseList();
    });
    refs.categoryFilters.appendChild(button);
  }
}

function renderExerciseList() {
  const query = state.searchQuery.trim().toLowerCase();
  const exercises = state.data.exerciseDrawer.exercises.filter((exercise) => {
    const categoryMatch = state.selectedCategoryId === 'ALL' || exercise.categoryId === state.selectedCategoryId;
    const text = `${exercise.name} ${exercise.goal} ${exercise.description} ${exercise.karateTransfer}`.toLowerCase();
    const queryMatch = !query || text.includes(query);
    return categoryMatch && queryMatch;
  });

  refs.exerciseList.innerHTML = '';
  if (!exercises.length) {
    refs.exerciseList.innerHTML = '<div class="empty-state">Nic neodpovídá filtru.</div>';
    return;
  }

  for (const exercise of exercises) {
    const card = document.createElement('article');
    card.id = `exercise-card-${exercise.id}`;
    card.className = `exercise-card${exercise.id === state.selectedExerciseId ? ' selected' : ''}`;
    card.innerHTML = `
      <div class="exercise-topline">
        <div>
          <h4>${exercise.name}</h4>
          <p class="exercise-meta">${exercise.categoryId} • ${exercise.categoryTitle}</p>
        </div>
      </div>
      <div class="exercise-meta">
        <div><strong>Cíl:</strong> ${exercise.goal || 'neuvedeno'}</div>
        <div><strong>Pomůcky:</strong> ${exercise.tools || 'bez pomůcek'}</div>
        <div><strong>Popis:</strong> ${exercise.description || 'bez popisu'}</div>
      </div>
    `;
    card.addEventListener('click', () => {
      state.selectedExerciseId = exercise.id;
      renderExerciseList();
      renderExerciseDetail();
    });

    const addButton = document.createElement('button');
    addButton.type = 'button';
    addButton.className = 'ghost-button';
    addButton.textContent = state.selectedLessonId ? 'Přidat do tohoto týdne' : 'Nejdřív vyber týden';
    addButton.addEventListener('click', (event) => {
      event.stopPropagation();
      addSelectedExercise(exercise.id);
    });
    card.appendChild(addButton);
    refs.exerciseList.appendChild(card);
  }
}

function renderExerciseDetail() {
  const exercise = exerciseById(state.selectedExerciseId);
  if (!exercise) {
    refs.exerciseDetail.innerHTML = '<div class="empty-state">Vyber cvik ze šuplíku.</div>';
    return;
  }

  refs.exerciseDetail.innerHTML = `<p class="eyebrow">Detail cviku</p>${renderExerciseInfo(exercise)}`;

  const addButton = document.createElement('button');
  addButton.type = 'button';
  addButton.className = 'ghost-button';
  addButton.textContent = state.selectedLessonId ? 'Přidat cvik do tohoto týdne' : 'Nejdřív vyber týden';
  addButton.addEventListener('click', () => addSelectedExercise(exercise.id));
  refs.exerciseDetail.appendChild(addButton);
}

function renderExerciseModal() {
  const exercise = exerciseById(state.modalExerciseId);
  if (!exercise) {
    refs.exerciseModalContent.innerHTML = '<div class="empty-state">Detail cviku se nepodařilo načíst.</div>';
    return;
  }

  refs.exerciseModalContent.innerHTML = renderExerciseInfo(exercise, { includeDrawerButton: true });
  document.getElementById('openExerciseInDrawerButton')?.addEventListener('click', () => {
    closeExerciseModal();
    openExerciseInDrawer(exercise.id);
  });
}

function renderHistoryView() {
  if (!refs.historyList) {
    return;
  }

  const history = [...(state.sharedState.history || [])];
  refs.historyList.innerHTML = '';

  if (!history.length) {
    refs.historyList.innerHTML = '<div class="empty-state">Zatím tu nejsou žádné uložené změny. Jakmile upravíš týden nebo poznámky, objeví se tady historie.</div>';
    return;
  }

  for (const entry of history) {
    const card = document.createElement('article');
    card.className = 'history-card';
    const fieldsMarkup = (entry.fields || [])
      .map((field) => `<span class="history-tag">${field}</span>`)
      .join('');
    card.innerHTML = `
      <p class="eyebrow">${entry.type === 'notes' ? 'Poznámky' : 'Plán lekce'}</p>
      <h4>${entry.monthName || 'Bez měsíce'} • ${entry.lessonTitle || 'Neurčená lekce'}</h4>
      <p class="history-meta">${entry.username || 'neznámý trenér'} • ${entry.at ? formatDate(entry.at) : 'bez času'}</p>
      <p class="history-summary">${entry.summary || 'Úprava sdíleného planneru'}</p>
      ${fieldsMarkup ? `<div class="history-fields">${fieldsMarkup}</div>` : ''}
    `;
    refs.historyList.appendChild(card);
  }
}

function renderDojoView() {
  if (!state.data?.dojo) {
    refs.dojoRulesContent.innerHTML = '<div class="empty-state">Pravidla dojo se nepodařilo načíst.</div>';
    refs.dojoCoachGuideContent.innerHTML = '<div class="empty-state">Metodická poznámka se nepodařila načíst.</div>';
    return;
  }

  refs.dojoRulesContent.innerHTML = renderMarkdownContent(state.data.dojo.childRulesMarkdown || '');
  refs.dojoCoachGuideContent.innerHTML = renderMarkdownContent(state.data.dojo.coachGuideMarkdown || '');
}

function renderMarkdownContent(markdown) {
  const lines = markdown.split(/\r?\n/);
  const chunks = [];
  let listBuffer = null;

  const flushList = () => {
    if (!listBuffer?.items.length) {
      listBuffer = null;
      return;
    }

    const tag = listBuffer.type === 'ol' ? 'ol' : 'ul';
    chunks.push(`<${tag}>${listBuffer.items.map((item) => `<li>${escapeHtml(item)}</li>`).join('')}</${tag}>`);
    listBuffer = null;
  };

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line || line === '---') {
      flushList();
      continue;
    }

    const headingMatch = line.match(/^(#{1,3})\s+(.+)$/);
    if (headingMatch) {
      flushList();
      const level = Math.min(headingMatch[1].length, 3);
      chunks.push(`<h${level}>${escapeHtml(headingMatch[2])}</h${level}>`);
      continue;
    }

    const orderedMatch = line.match(/^\d+\.\s+(.+)$/);
    if (orderedMatch) {
      if (!listBuffer || listBuffer.type !== 'ol') {
        flushList();
        listBuffer = { type: 'ol', items: [] };
      }
      listBuffer.items.push(orderedMatch[1]);
      continue;
    }

    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      if (!listBuffer || listBuffer.type !== 'ul') {
        flushList();
        listBuffer = { type: 'ul', items: [] };
      }
      listBuffer.items.push(bulletMatch[1]);
      continue;
    }

    flushList();
    chunks.push(`<p>${escapeHtml(line)}</p>`);
  }

  flushList();
  return chunks.join('');
}

function escapeHtml(value) {
  return value
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

function formatDate(value) {
  return new Intl.DateTimeFormat('cs-CZ', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));
}

function bindEvents() {
  refs.loginForm.addEventListener('submit', async (event) => {
    event.preventDefault();

    const username = refs.loginUsernameInput.value.trim();
    const password = refs.loginPasswordInput.value;

    if (!username || !password) {
      setLoginError('Vyplň jméno i heslo.');
      return;
    }

    refs.loginSubmitButton.disabled = true;
    setLoginError('');
    setLoginInfo('Probíhá přihlášení...');

    try {
      await submitLogin(username, password);
      showAppShell();
      setLoginInfo('');
      if (!state.data) {
        await loadData();
      }
    } catch (error) {
      console.error(error);
      setLoginInfo('');
      setLoginError(error.message === AUTH_REQUIRED_ERROR ? 'Přihlášení se nezdařilo.' : error.message);
      showAuthGate();
    } finally {
      refs.loginSubmitButton.disabled = false;
    }
  });

  refs.logoutButton.addEventListener('click', () => {
    void logout();
  });

  refs.calendarTabButton.addEventListener('click', () => setSelectedTab(TAB_KEYS.calendar));
  refs.drawerTabButton.addEventListener('click', () => setSelectedTab(TAB_KEYS.drawer));
  refs.historyTabButton.addEventListener('click', () => setSelectedTab(TAB_KEYS.history));
  refs.dojoTabButton.addEventListener('click', () => setSelectedTab(TAB_KEYS.dojo));
  refs.closeExerciseModalButton.addEventListener('click', () => closeExerciseModal());
  refs.exerciseModal.addEventListener('click', (event) => {
    if (event.target === refs.exerciseModal) {
      closeExerciseModal();
    }
  });
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && !refs.exerciseModal.hidden) {
      closeExerciseModal();
    }
  });

  refs.completedInput.addEventListener('input', (event) => updateLessonNotes({ completed: event.target.value }));
  refs.incompleteInput.addEventListener('input', (event) => updateLessonNotes({ incomplete: event.target.value }));
  refs.nextTimeInput.addEventListener('input', (event) => {
    updateLessonNotes({ nextTime: event.target.value });
    renderWeekGrid();
  });
  refs.trainerNotesInput.addEventListener('input', (event) => updateLessonNotes({ trainerNotes: event.target.value }));

  refs.exerciseSearchInput.addEventListener('input', (event) => {
    state.searchQuery = event.target.value;
    renderExerciseList();
  });

  refs.exportStateButton.addEventListener('click', () => {
    downloadJson('karate-planner-shared-backup.json', state.sharedState);
  });

  refs.downloadSharedStateButton.addEventListener('click', () => {
    downloadJson('planner-shared-state.json', state.sharedState);
  });

  refs.importStateInput.addEventListener('change', async (event) => {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }

    const text = await file.text();
    const parsed = normalizeSharedState(JSON.parse(text));
    state.sharedState = parsed;
    queueHistoryEntry({
      lessonId: state.selectedLessonId,
      type: 'import',
      summary: 'Obnova sdíleného planneru ze zálohy',
      fields: ['import JSON']
    });
    await persistSharedState(true);
    event.target.value = '';
  });

  refs.resetStateButton.addEventListener('click', async () => {
    state.sharedState = structuredClone(EMPTY_SHARED_STATE);
    queueHistoryEntry({
      lessonId: state.selectedLessonId,
      type: 'reset',
      summary: 'Vymazání sdílených změn planneru',
      fields: ['reset shared state']
    });
    await persistSharedState(true);
  });

  window.addEventListener('beforeunload', () => {
    if (!state.hasUnsavedChanges) {
      return;
    }

    void persistSharedState(true);
  });
}

bindEvents();
bootstrapApp().catch((error) => {
  console.error(error);
  showAuthGate();
  setLoginError(error.message === AUTH_REQUIRED_ERROR ? 'Přístup vyžaduje přihlášení.' : `Nepodařilo se načíst aplikaci: ${error.message}`);
});
