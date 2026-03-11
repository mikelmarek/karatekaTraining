import { config } from './config.js';
import { logError, logInfo } from './logger.js';
import { runReminderCheck, startScheduler } from './scheduler.js';
import {
  getManualFileForState,
  getManualTypeLabel,
  getStateWithActiveTrack,
  loadState,
  normalizeTrainingGroup,
  updateCurrentLesson,
  updateTrainingGroup
} from './stateStore.js';
import { loadManualRepository } from './manualRepository.js';
import { createReminderMessage } from './planner.js';
import { sendTelegramMessage } from './telegramService.js';

function parseTestPlanArgs(args, currentGroup) {
  let reminderType = '30h';
  let lessonNumber = null;
  let trainingGroup = normalizeTrainingGroup(currentGroup);

  for (const arg of args) {
    if (arg === '30h' || arg === '6h') {
      reminderType = arg;
      continue;
    }

    if (arg === 'beginner' || arg === 'advanced') {
      trainingGroup = normalizeTrainingGroup(arg);
      continue;
    }

    const numericValue = Number(arg);
    if (Number.isInteger(numericValue) && numericValue >= 1 && numericValue <= 40) {
      lessonNumber = numericValue;
    }
  }

  return {
    reminderType,
    lessonNumber,
    trainingGroup
  };
}

async function main() {
  const args = process.argv.slice(2);
  const command = args[0];

  if (command === '--once') {
    await logInfo(config.logFile, 'Ruční spuštění --once');
    await runReminderCheck(config);
    return;
  }

  if (command === 'set-lesson') {
    const lessonNumber = Number(args[1]);
    const trainingGroup = args[2] === 'advanced' || args[2] === 'beginner'
      ? normalizeTrainingGroup(args[2])
      : undefined;
    if (!Number.isInteger(lessonNumber) || lessonNumber < 1 || lessonNumber > 40) {
      throw new Error('Zadej číslo lekce 1 až 40.');
    }
    const state = await updateCurrentLesson(config.stateFile, lessonNumber, trainingGroup);
    await logInfo(config.logFile, 'Ruční změna lekce', {
      trainingGroup: state.training_group,
      currentLesson: state.current_lesson
    });
    console.log(`Aktuální lekce pro skupinu ${getManualTypeLabel(state.training_group)} nastavena na ${state.current_lesson}.`);
    return;
  }

  if (command === 'set-group') {
    const inputGroup = args[1];
    if (inputGroup !== 'beginner' && inputGroup !== 'advanced') {
      throw new Error('Zadej skupinu beginner nebo advanced.');
    }

    const state = await updateTrainingGroup(config.stateFile, inputGroup);
    await logInfo(config.logFile, 'Ruční změna skupiny', {
      trainingGroup: state.training_group,
      currentLesson: state.current_lesson
    });
    console.log(`Aktivní skupina nastavena na ${getManualTypeLabel(state.training_group)}. Aktuální lekce: ${state.current_lesson}.`);
    return;
  }

  if (command === 'test-telegram') {
    await sendTelegramMessage(config, '✅ Karate Coach Assistant je úspěšně napojen na Telegram.');
    await logInfo(config.logFile, 'Odeslána testovací Telegram zpráva');
    console.log('Testovací zpráva byla odeslána.');
    return;
  }

  if (command === 'test-plan') {
    const storedState = await loadState(config.stateFile);
    const parsedArgs = parseTestPlanArgs(args.slice(1), storedState.training_group);
    const state = getStateWithActiveTrack(storedState, parsedArgs.trainingGroup);
    const manualRepository = await loadManualRepository(getManualFileForState(config, state));
    const lessonNumber = parsedArgs.lessonNumber || state.current_lesson;
    const lesson = manualRepository.getLessonPlan(lessonNumber, state);
    const now = Date.now();
    const eventStart = new Date(now + (parsedArgs.reminderType === '30h' ? 30 : 6) * 60 * 60 * 1000);
    const eventEnd = new Date(eventStart.getTime() + 60 * 60 * 1000);
    const text = createReminderMessage({
      lesson,
      state,
      reminderType: parsedArgs.reminderType,
      event: {
        id: `manual-test-${parsedArgs.trainingGroup}-${parsedArgs.reminderType}-${lessonNumber}`,
        summary: 'Testovací karate trénink',
        start: eventStart.toISOString(),
        end: eventEnd.toISOString()
      }
    });

    await sendTelegramMessage(config, text);
    await logInfo(config.logFile, 'Odeslán testovací plán', {
      trainingGroup: state.training_group,
      reminderType: parsedArgs.reminderType,
      lessonNumber
    });
    console.log(`Testovací plán typu ${parsedArgs.reminderType} pro skupinu ${getManualTypeLabel(state.training_group)} a lekci ${lessonNumber} byl odeslán.`);
    return;
  }

  await logInfo(config.logFile, 'Spuštění dlouhodobého režimu');
  await runReminderCheck(config, { silent: true });
  startScheduler(config);
}

main().catch(async (error) => {
  try {
    await logError(config.logFile, 'Fatal error', {
      message: error.message,
      stack: error.stack
    });
  } catch {
    // ignore logging failure
  }
  console.error(error.message || error);
  process.exit(1);
});
