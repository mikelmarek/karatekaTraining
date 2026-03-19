import cron from 'node-cron';
import { findTrainingEvents } from './calendarService.js';
import { logError, logInfo } from './logger.js';
import { loadManualRepository } from './manualRepository.js';
import { createCurriculumExhaustedMessage, createReminderMessage } from './planner.js';
import {
  getManualFileForState,
  getManualTypeLabel,
  getTrackState,
  loadState,
  saveState,
  setTrackState
} from './stateStore.js';
import { sendTelegramMessage } from './telegramService.js';

const DEFAULT_REMINDER_WINDOWS = [
  { type: '24h', mode: 'range', minHours: 0, maxHours: 24, targetHours: null, toleranceMinutes: 20 }
];

function getReminderKey(event, lessonNumber, reminderType) {
  return `${event.id}:${lessonNumber}:${reminderType}`;
}

function getHoursUntil(dateLike) {
  const now = Date.now();
  const target = new Date(dateLike).getTime();
  return (target - now) / (1000 * 60 * 60);
}

function shouldSendReminder(hoursUntil, reminderConfig) {
  if (reminderConfig.mode === 'range') {
    return hoursUntil > reminderConfig.minHours && hoursUntil <= reminderConfig.maxHours;
  }

  const toleranceHours = reminderConfig.toleranceMinutes / 60;
  return Math.abs(hoursUntil - reminderConfig.targetHours) <= toleranceHours;
}

export async function runReminderCheck(config, options = {}) {
  const state = await loadState(config);
  const trainingGroup = state.training_group;
  const reminderWindows = config.reminderWindows?.length
    ? config.reminderWindows
    : DEFAULT_REMINDER_WINDOWS;
  const manualFile = getManualFileForState(config, state);
  const manualRepository = await loadManualRepository(manualFile);
  const activeTrack = getTrackState(state, trainingGroup);
  const now = new Date();
  const windowStart = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const windowEnd = new Date(now.getTime() + 32 * 60 * 60 * 1000);
  const events = await findTrainingEvents(config, {
    timeMin: windowStart,
    timeMax: windowEnd,
    maxResults: 100
  });

  const { completedTrainings, ...nextTrackState } = processCompletedTrainings(
    events,
    activeTrack,
    trainingGroup,
    state.lesson_sequence_start_date,
    now
  );
  const nextState = setTrackState(state, trainingGroup, nextTrackState);
  const upcomingEvents = events.filter((event) => new Date(event.start).getTime() > now.getTime());

  const sentMessages = [];

  for (const event of upcomingEvents) {
    const hoursUntil = getHoursUntil(event.start);

    for (const reminderConfig of reminderWindows) {
      if (!shouldSendReminder(hoursUntil, reminderConfig)) {
        continue;
      }

      const reminderKey = getReminderKey(event, nextState.current_lesson, `${trainingGroup}:${reminderConfig.type}`);
      if (nextState.sent_reminders[reminderKey]) {
        continue;
      }

      const text = nextState.curriculum_exhausted
        ? createCurriculumExhaustedMessage({
          state: nextState,
          event,
          reminderType: reminderConfig.type
        })
        : createReminderMessage({
          lesson: manualRepository.getLessonPlan(nextState.current_lesson, nextState),
          state: nextState,
          event,
          reminderType: reminderConfig.type
        });

      await sendTelegramMessage(config, text);
      nextState.sent_reminders[reminderKey] = new Date().toISOString();
      nextState.last_sent_plan_date = new Date().toISOString();
      sentMessages.push({
        trainingGroup,
        reminderType: reminderConfig.type,
        eventId: event.id,
        lesson: nextState.curriculum_exhausted ? 'curriculum-exhausted' : nextState.current_lesson
      });
    }
  }

  pruneOldReminders(nextState);
  await saveState(config, nextState);

  await logInfo(config.logFile, 'Kontrolní běh dokončen', {
    checkedAt: now.toISOString(),
    trainingGroup,
    trainingGroupLabel: getManualTypeLabel(trainingGroup),
    manualFile,
    foundEvents: events.length,
    upcomingEvents: upcomingEvents.length,
    reminderWindows,
    completedTrainings,
    sentMessages,
    currentLesson: nextState.current_lesson
  });

  if (!options.silent) {
    console.log(`Aktivní skupina jobu: ${getManualTypeLabel(trainingGroup)} | lekce ${nextState.current_lesson}`);

    if (completedTrainings.length) {
      console.log('Automaticky uzavřené tréninky:', completedTrainings);
    }

    if (sentMessages.length) {
      console.log('Odeslané připomínky:', sentMessages);
    } else {
      console.log(`Žádná připomínka teď nespadá do aktivních oken: ${reminderWindows.map((item) => item.type).join(', ')}.`);
    }
  }

  return {
    completedTrainings,
    sentMessages
  };
}

function processCompletedTrainings(events, trackState, trainingGroup, lessonSequenceStartDate, now) {
  const history = trackState.lesson_history || [];
  const completed = [];
  const startDate = lessonSequenceStartDate ? new Date(lessonSequenceStartDate) : null;
  const nextTrack = {
    ...trackState,
    lesson_history: [...history],
    sent_reminders: { ...(trackState.sent_reminders || {}) }
  };

  const pastEvents = events
    .filter((event) => {
      const eventStart = new Date(event.start);
      const eventEnd = new Date(event.end || event.start);
      if (Number.isNaN(eventStart.getTime()) || Number.isNaN(eventEnd.getTime())) {
        return false;
      }
      if (startDate && eventStart.getTime() < startDate.getTime()) {
        return false;
      }
      return eventEnd.getTime() <= now.getTime();
    })
    .sort((left, right) => new Date(left.start).getTime() - new Date(right.start).getTime());

  for (const event of pastEvents) {
    const alreadyProcessed = history.some((item) => item.eventId === event.id);
    if (alreadyProcessed) {
      continue;
    }

    const lessonNumber = nextTrack.current_lesson;
    nextTrack.lesson_history.push({
      eventId: event.id,
      summary: event.summary,
      eventStart: event.start,
      eventEnd: event.end,
      trainingGroup,
      lessonNumber,
      processedAt: new Date().toISOString()
    });

    nextTrack.last_training_date = event.start;
    if (lessonNumber >= 40) {
      nextTrack.current_lesson = 40;
      nextTrack.curriculum_exhausted = true;
      nextTrack.curriculum_exhausted_at = new Date().toISOString();
    } else {
      nextTrack.current_lesson = lessonNumber + 1;
    }
    completed.push({
      trainingGroup,
      eventId: event.id,
      lessonNumber,
      eventStart: event.start
    });
  }

  return {
    ...nextTrack,
    completedTrainings: completed
  };
}

function pruneOldReminders(state) {
  const threshold = Date.now() - (45 * 24 * 60 * 60 * 1000);
  const entries = Object.entries(state.sent_reminders || {});
  state.sent_reminders = Object.fromEntries(
    entries.filter(([, sentAt]) => new Date(sentAt).getTime() >= threshold)
  );
}

export function startScheduler(config) {
  cron.schedule(config.checkCron, async () => {
    try {
      await runReminderCheck(config, { silent: true });
    } catch (error) {
      await logError(config.logFile, 'Chyba při kontrolním běhu', {
        message: error.message,
        stack: error.stack
      });
      console.error('Chyba při kontrolním běhu:', error);
    }
  }, {
    timezone: config.timezone
  });

  void (async () => {
    const state = await loadState(config);
    const trainingGroup = state.training_group;
    await logInfo(config.logFile, 'Scheduler spuštěn', {
      checkCron: config.checkCron,
      timezone: config.timezone,
      reminderWindows: config.reminderWindows,
      trainingGroup,
      trainingGroupLabel: getManualTypeLabel(trainingGroup),
      currentLesson: state.current_lesson,
      manualFile: getManualFileForState(config, state)
    });
    console.log(
      `Scheduler běží podle CRON '${config.checkCron}' v časové zóně ${config.timezone} pro skupinu ${getManualTypeLabel(trainingGroup)}.`
    );
  })().catch((error) => {
    console.error('Nepodařilo se načíst aktivní skupinu scheduleru:', error.message || error);
  });
}
