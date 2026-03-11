import { readBootstrapStateFile, readPersistedState, writePersistedState } from './statePersistence.js';

function createDefaultTrackState(group) {
  return {
    current_lesson: 1,
    last_training_date: null,
    last_sent_plan_date: null,
    last_feedback_request_date: null,
    preferred_kata: group === 'advanced'
      ? 'Fukyugata Ichi / Naihanchi Shodan / Fukyugata Ni'
      : 'Fukyugata Ichi',
    curriculum_exhausted: false,
    curriculum_exhausted_at: null,
    lesson_history: [],
    sent_reminders: {}
  };
}

function createDefaultState() {
  return {
    assistant_name: 'Karate Coach Assistant',
    language: 'cs',
    training_day: 'středa',
    training_duration_minutes: 60,
    age_group: '5-10',
    training_group: 'beginner',
    current_lesson: 1,
    lesson_sequence_start_date: null,
    last_training_date: null,
    last_sent_plan_date: null,
    last_feedback_request_date: null,
    preferred_kata: 'Fukyugata Ichi',
    delivery_channels: ['telegram'],
    notes_summary: [],
    pending_adjustments: [],
    curriculum_exhausted: false,
    curriculum_exhausted_at: null,
    lesson_history: [],
    sent_reminders: {},
    lesson_tracks: {
      beginner: createDefaultTrackState('beginner'),
      advanced: createDefaultTrackState('advanced')
    }
  };
}

export function normalizeTrainingGroup(value) {
  return value === 'advanced' ? 'advanced' : 'beginner';
}

function normalizeTrack(track, group) {
  const normalizedTrack = track || {};
  return {
    current_lesson: normalizedTrack.current_lesson ?? 1,
    last_training_date: normalizedTrack.last_training_date ?? null,
    last_sent_plan_date: normalizedTrack.last_sent_plan_date ?? null,
    last_feedback_request_date: normalizedTrack.last_feedback_request_date ?? null,
    preferred_kata: normalizedTrack.preferred_kata
      ?? createDefaultTrackState(group).preferred_kata,
    curriculum_exhausted: normalizedTrack.curriculum_exhausted ?? false,
    curriculum_exhausted_at: normalizedTrack.curriculum_exhausted_at ?? null,
    lesson_history: normalizedTrack.lesson_history || [],
    sent_reminders: normalizedTrack.sent_reminders || {}
  };
}

function createLegacyBeginnerTrack(state) {
  return normalizeTrack({
    current_lesson: state.current_lesson,
    last_training_date: state.last_training_date,
    last_sent_plan_date: state.last_sent_plan_date,
    last_feedback_request_date: state.last_feedback_request_date,
    preferred_kata: state.preferred_kata,
    curriculum_exhausted: state.curriculum_exhausted,
    curriculum_exhausted_at: state.curriculum_exhausted_at,
    lesson_history: state.lesson_history,
    sent_reminders: state.sent_reminders
  }, 'beginner');
}

function syncActiveTrackFields(state) {
  const trainingGroup = normalizeTrainingGroup(state.training_group);
  const activeTrack = normalizeTrack(state.lesson_tracks?.[trainingGroup], trainingGroup);

  return {
    ...state,
    training_group: trainingGroup,
    current_lesson: activeTrack.current_lesson,
    last_training_date: activeTrack.last_training_date,
    last_sent_plan_date: activeTrack.last_sent_plan_date,
    last_feedback_request_date: activeTrack.last_feedback_request_date,
    preferred_kata: activeTrack.preferred_kata,
    curriculum_exhausted: activeTrack.curriculum_exhausted,
    curriculum_exhausted_at: activeTrack.curriculum_exhausted_at,
    lesson_history: activeTrack.lesson_history,
    sent_reminders: activeTrack.sent_reminders,
    lesson_tracks: {
      beginner: normalizeTrack(state.lesson_tracks?.beginner, 'beginner'),
      advanced: normalizeTrack(state.lesson_tracks?.advanced, 'advanced')
    }
  };
}

export function getTrackState(state, trainingGroup = state.training_group) {
  const normalizedGroup = normalizeTrainingGroup(trainingGroup);
  return normalizeTrack(state.lesson_tracks?.[normalizedGroup], normalizedGroup);
}

export function setTrackState(state, trainingGroup, updates) {
  const normalizedGroup = normalizeTrainingGroup(trainingGroup);
  const nextState = {
    ...state,
    lesson_tracks: {
      ...state.lesson_tracks,
      [normalizedGroup]: normalizeTrack({
        ...state.lesson_tracks?.[normalizedGroup],
        ...updates
      }, normalizedGroup)
    }
  };

  return syncActiveTrackFields(nextState);
}

function resolveStateTarget(stateTarget) {
  if (typeof stateTarget === 'string') {
    return {
      stateBackend: 'local',
      stateFile: stateTarget,
      githubStateGistId: null,
      githubStateFilename: null,
      githubStateToken: null
    };
  }

  return stateTarget;
}

async function loadBootstrapState(stateFile) {
  try {
    const raw = await readBootstrapStateFile(stateFile);
    return JSON.parse(raw);
  } catch (error) {
    if (error.code === 'ENOENT') {
      return createDefaultState();
    }
    throw error;
  }
}

export async function loadState(stateTarget) {
  const target = resolveStateTarget(stateTarget);
  try {
    const raw = await readPersistedState(target);
    const parsed = JSON.parse(raw);
    const normalized = {
      ...createDefaultState(),
      ...parsed,
      training_group: normalizeTrainingGroup(parsed.training_group),
      lesson_tracks: parsed.lesson_tracks
        ? {
          beginner: normalizeTrack(parsed.lesson_tracks.beginner, 'beginner'),
          advanced: normalizeTrack(parsed.lesson_tracks.advanced, 'advanced')
        }
        : {
          beginner: createLegacyBeginnerTrack(parsed),
          advanced: createDefaultTrackState('advanced')
        }
    };

    return syncActiveTrackFields(normalized);
  } catch (error) {
    if (error.code === 'ENOENT') {
      const fallbackState = syncActiveTrackFields(await loadBootstrapState(target.stateFile));
      await saveState(target, fallbackState);
      return fallbackState;
    }
    throw error;
  }
}

export async function saveState(stateTarget, state) {
  const target = resolveStateTarget(stateTarget);
  const normalized = syncActiveTrackFields({
    ...createDefaultState(),
    ...state,
    lesson_tracks: {
      beginner: normalizeTrack(state.lesson_tracks?.beginner, 'beginner'),
      advanced: normalizeTrack(state.lesson_tracks?.advanced, 'advanced')
    }
  });
  await writePersistedState(target, `${JSON.stringify(normalized, null, 2)}\n`);
}

export async function updateCurrentLesson(stateTarget, lessonNumber, trainingGroup) {
  const state = await loadState(stateTarget);
  const group = normalizeTrainingGroup(trainingGroup || state.training_group);
  const track = getTrackState(state, group);
  const nextState = setTrackState({
    ...state,
    training_group: group
  }, group, {
    ...track,
    current_lesson: lessonNumber,
    curriculum_exhausted: false,
    curriculum_exhausted_at: null
  });

  await saveState(stateTarget, nextState);
  return nextState;
}

export async function updateTrainingGroup(stateTarget, trainingGroup) {
  const state = await loadState(stateTarget);
  const nextState = syncActiveTrackFields({
    ...state,
    training_group: normalizeTrainingGroup(trainingGroup)
  });

  await saveState(stateTarget, nextState);
  return nextState;
}

export function getManualTypeLabel(trainingGroup) {
  return normalizeTrainingGroup(trainingGroup) === 'advanced' ? 'pokročilí' : 'začátečníci';
}

export function getManualFileForState(config, state, trainingGroup = state.training_group) {
  const group = normalizeTrainingGroup(trainingGroup);
  return group === 'advanced' ? config.advancedManualFile : config.manualFile;
}

export function getActiveTrackSummary(state) {
  const track = getTrackState(state, state.training_group);
  return {
    trainingGroup: normalizeTrainingGroup(state.training_group),
    currentLesson: track.current_lesson,
    curriculumExhausted: track.curriculum_exhausted
  };
}

export function getStateWithActiveTrack(state, trainingGroup = state.training_group) {
  return syncActiveTrackFields({
    ...state,
    training_group: normalizeTrainingGroup(trainingGroup)
  });
}
