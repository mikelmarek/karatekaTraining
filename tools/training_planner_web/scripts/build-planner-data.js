import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..', '..', '..');
const PLAN_DIR = path.join(ROOT_DIR, 'plan');
const DATA_DIR = path.join(ROOT_DIR, 'tools', 'training_planner_web', 'data');

const SOURCES = {
  monthlyPlan: path.join(PLAN_DIR, 'mesicni_treninkovy_plan_deti_karate_6_12.md'),
  annualPlan: path.join(PLAN_DIR, 'karate_deti_rocni_plan_a_nastroje', 'rocni_plan_deti_karate_6_12.md'),
  exerciseDrawer: path.join(PLAN_DIR, 'karate_deti_rocni_plan_a_nastroje', 'suplik_cviceni_deti_karate.md'),
  monthlyTemplate: path.join(PLAN_DIR, 'mesicni_sablona_treninkoveho_planu_deti_karate.md'),
  toolsGuide: path.join(PLAN_DIR, 'karate_deti_rocni_plan_a_nastroje', 'pomucky_pro_detske_treninky.md')
};

function slugify(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function normalizeBullet(value) {
  return value.replace(/^[-*]\s*/, '').trim();
}

function appendText(target, value) {
  return target ? `${target} ${value}`.trim() : value.trim();
}

function createEmptyWeek(monthId, weekNumber) {
  return {
    id: `${monthId}-week-${weekNumber}`,
    weekNumber,
    title: `Týden ${weekNumber}`,
    theme: '',
    lessonGoal: '',
    content: [],
    sections: {},
    tools: [],
    notesTemplate: {
      completed: '',
      incomplete: '',
      nextTime: '',
      trainerNotes: ''
    }
  };
}

function ensureSection(week, sectionName) {
  if (!week.sections[sectionName]) {
    week.sections[sectionName] = [];
  }
  return week.sections[sectionName];
}

function mapContentPrefixToSection(prefix) {
  const normalized = slugify(prefix);

  if (normalized.includes('zahajeni')) return 'zahajeni';
  if (normalized.includes('zahrati')) return 'zahrati';
  if (normalized.includes('mobilita')) return 'mobilita';
  if (normalized.includes('pruprava')) return 'priprava';
  if (normalized.includes('reakcni-blok') || normalized === 'reakce' || normalized.includes('reakce')) return 'reakce';
  if (normalized.includes('koordinace')) return 'koordinace';
  if (normalized.includes('kihon')) return 'kihon';
  if (normalized.includes('kata')) return 'kata';
  if (normalized.includes('hra')) return 'hra';
  if (normalized.includes('zaver')) return 'zaver';
  return 'ostatni';
}

function deriveStructuredSections(content) {
  const structuredSections = {
    zahajeni: [],
    zahrati: [],
    mobilita: [],
    priprava: [],
    reakce: [],
    koordinace: [],
    kihon: [],
    kata: [],
    hra: [],
    zaver: [],
    ostatni: []
  };

  for (const rawItem of content) {
    const match = rawItem.match(/^([^:]+):\s*(.+)$/);
    if (!match) {
      structuredSections.ostatni.push(rawItem);
      continue;
    }

    const [, prefix, value] = match;
    const sectionKey = mapContentPrefixToSection(prefix);
    structuredSections[sectionKey].push(value.trim());
  }

  return Object.fromEntries(Object.entries(structuredSections).filter(([, items]) => items.length > 0));
}

function finalizeWeek(week) {
  if (!week.theme) {
    const firstItem = week.content[0] || '';
    week.theme = firstItem ? firstItem.replace(/^zahřátí:\s*/i, '').trim() : week.title;
  }

  if (!week.lessonGoal) {
    week.lessonGoal = week.theme;
  }

  week.derivedSections = deriveStructuredSections(week.content);

  return week;
}

function parseMonthlyPlan(content) {
  const lines = content.split(/\r?\n/);
  const months = [];

  let currentMonth = null;
  let currentWeek = null;
  let currentMode = null;
  let currentSectionName = null;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed === '---') {
      continue;
    }

    if (/^#\s+[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ]+$/.test(trimmed)) {
      const monthName = trimmed.replace(/^#\s+/, '').trim();
      const monthId = slugify(monthName);
      currentMonth = {
        id: monthId,
        name: monthName,
        mainGoal: '',
        technicalGoals: [],
        movementGoals: [],
        monthTools: [],
        checkpoint: '',
        weeks: []
      };
      months.push(currentMonth);
      currentWeek = null;
      currentMode = null;
      currentSectionName = null;
      continue;
    }

    if (!currentMonth) {
      continue;
    }

    if (trimmed.startsWith('## ')) {
      const heading = trimmed.slice(3).trim();
      currentSectionName = null;

      if (heading === 'Hlavní cíl') {
        currentMode = 'month-main-goal';
      } else if (heading === 'Technický cíl') {
        currentMode = 'month-technical-goals';
      } else if (heading === 'Pohybový cíl') {
        currentMode = 'month-movement-goals';
      } else if (heading.startsWith('Týden ')) {
        const weekNumber = Number(heading.replace(/[^0-9]/g, ''));
        currentWeek = createEmptyWeek(currentMonth.id, weekNumber);
        currentMonth.weeks.push(currentWeek);
        currentMode = 'week-content';
      } else if (heading === 'Pomůcky') {
        currentMode = currentWeek ? 'week-tools' : 'month-tools';
      } else if (heading === 'Kontrolní bod') {
        currentMode = 'month-checkpoint';
      } else {
        currentMode = null;
      }

      continue;
    }

    if (trimmed.startsWith('### ')) {
      const subheading = trimmed.slice(4).trim();
      currentSectionName = subheading;

      if (subheading === 'Téma') {
        currentMode = 'week-theme';
      } else if (subheading === 'Cíl lekce') {
        currentMode = 'week-lesson-goal';
      } else if (subheading === 'Náplň') {
        currentMode = 'week-content';
      } else {
        currentMode = 'week-subsection';
        if (currentWeek) {
          ensureSection(currentWeek, subheading);
        }
      }

      continue;
    }

    if (trimmed.startsWith('- ')) {
      const value = normalizeBullet(trimmed);

      if (currentMode === 'month-technical-goals') {
        currentMonth.technicalGoals.push(value);
      } else if (currentMode === 'month-movement-goals') {
        currentMonth.movementGoals.push(value);
      } else if (currentMode === 'month-tools') {
        currentMonth.monthTools.push(value);
      } else if (currentMode === 'week-tools' && currentWeek) {
        currentWeek.tools.push(value);
      } else if ((currentMode === 'week-content' || currentMode === 'week-subsection') && currentWeek) {
        currentWeek.content.push(value);
        if (currentSectionName && currentMode === 'week-subsection') {
          ensureSection(currentWeek, currentSectionName).push(value);
        }
      }

      continue;
    }

    if (currentMode === 'month-main-goal') {
      currentMonth.mainGoal = appendText(currentMonth.mainGoal, trimmed);
    } else if (currentMode === 'month-checkpoint') {
      currentMonth.checkpoint = appendText(currentMonth.checkpoint, trimmed);
    } else if (currentMode === 'week-theme' && currentWeek) {
      currentWeek.theme = appendText(currentWeek.theme, trimmed);
    } else if (currentMode === 'week-lesson-goal' && currentWeek) {
      currentWeek.lessonGoal = appendText(currentWeek.lessonGoal, trimmed);
    } else if ((currentMode === 'week-content' || currentMode === 'week-subsection') && currentWeek) {
      currentWeek.content.push(trimmed);
      if (currentSectionName && currentMode === 'week-subsection') {
        ensureSection(currentWeek, currentSectionName).push(trimmed);
      }
    }
  }

  for (const month of months) {
    month.weeks = month.weeks.map((week) => finalizeWeek(week));
  }

  return months;
}

function parseAnnualPlan(content) {
  const lines = content.split(/\r?\n/);
  const months = [];
  let currentMonth = null;
  let currentMode = null;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed === '---') {
      continue;
    }

    if (trimmed.startsWith('## ')) {
      const heading = trimmed.slice(3).trim();
      if (/^[A-ZÁČĎÉĚÍŇÓŘŠŤÚŮÝŽ][^–]+–/.test(heading)) {
        const [namePart, focusPart] = heading.split('–').map((item) => item.trim());
        currentMonth = {
          id: slugify(namePart),
          name: namePart,
          focus: focusPart,
          mainGoal: [],
          technicalGoal: [],
          movementGoal: [],
          gameTypes: [],
          checkpoint: []
        };
        months.push(currentMonth);
        currentMode = null;
        continue;
      }

      if (!currentMonth) {
        continue;
      }

      if (heading === 'Hlavní cíl') currentMode = 'mainGoal';
      else if (heading === 'Technický cíl') currentMode = 'technicalGoal';
      else if (heading === 'Pohybový cíl') currentMode = 'movementGoal';
      else if (heading === 'Typy her') currentMode = 'gameTypes';
      else if (heading === 'Kontrolní bod') currentMode = 'checkpoint';
      else currentMode = null;

      continue;
    }

    if (trimmed.startsWith('### ')) {
      if (!currentMonth) {
        continue;
      }

      const heading = trimmed.slice(4).trim();

      if (heading === 'Hlavní cíl') currentMode = 'mainGoal';
      else if (heading === 'Technický cíl') currentMode = 'technicalGoal';
      else if (heading === 'Pohybový cíl') currentMode = 'movementGoal';
      else if (heading === 'Typy her') currentMode = 'gameTypes';
      else if (heading === 'Kontrolní bod') currentMode = 'checkpoint';
      else currentMode = null;

      continue;
    }

    if (!currentMonth) {
      continue;
    }

    if (trimmed.startsWith('- ') && currentMode) {
      currentMonth[currentMode].push(normalizeBullet(trimmed));
    }
  }

  return months;
}

function parseExerciseDrawer(content) {
  const lines = content.split(/\r?\n/);
  const categories = [];
  const exercises = [];
  let currentCategory = null;
  let currentExercise = null;

  for (const rawLine of lines) {
    const trimmed = rawLine.trim();
    if (!trimmed || trimmed === '---') {
      continue;
    }

    if (/^#\s+[A-Z]\.\s+/.test(trimmed)) {
      const match = trimmed.match(/^#\s+([A-Z])\.\s+(.+)$/);
      currentCategory = {
        id: match[1],
        title: match[2].trim()
      };
      categories.push(currentCategory);
      currentExercise = null;
      continue;
    }

    if (/^##\s+[A-Z]\d+\.\s+/.test(trimmed)) {
      const match = trimmed.match(/^##\s+([A-Z]\d+)\.\s+(.+)$/);
      currentExercise = {
        id: match[1],
        slug: slugify(match[2]),
        name: match[2].trim(),
        categoryId: currentCategory?.id || 'X',
        categoryTitle: currentCategory?.title || 'Ostatní',
        goal: '',
        tools: '',
        description: '',
        variants: '',
        karateTransfer: '',
        coachNote: ''
      };
      exercises.push(currentExercise);
      continue;
    }

    if (!currentExercise) {
      continue;
    }

    const fieldMap = [
      ['**Cíl:**', 'goal'],
      ['**Pomůcky:**', 'tools'],
      ['**Popis:**', 'description'],
      ['**Varianta:**', 'variants'],
      ['**Varianty:**', 'variants'],
      ['**Karate přenos:**', 'karateTransfer'],
      ['**Poznámka:**', 'coachNote'],
      ['**Poznámka pro trenéra:**', 'coachNote']
    ];

    const matchedField = fieldMap.find(([prefix]) => trimmed.startsWith(prefix));
    if (matchedField) {
      const [prefix, key] = matchedField;
      const value = trimmed.slice(prefix.length).trim();
      currentExercise[key] = appendText(currentExercise[key], value);
      continue;
    }

    if (trimmed.startsWith('- ')) {
      currentExercise.description = appendText(currentExercise.description, normalizeBullet(trimmed));
      continue;
    }
  }

  return { categories, exercises };
}

function parseSimpleBullets(content) {
  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line.startsWith('- '))
    .map((line) => normalizeBullet(line));
}

async function buildPlannerData() {
  const [monthlyPlanContent, annualPlanContent, exerciseDrawerContent, templateContent, toolsGuideContent] = await Promise.all([
    fs.readFile(SOURCES.monthlyPlan, 'utf8'),
    fs.readFile(SOURCES.annualPlan, 'utf8'),
    fs.readFile(SOURCES.exerciseDrawer, 'utf8'),
    fs.readFile(SOURCES.monthlyTemplate, 'utf8'),
    fs.readFile(SOURCES.toolsGuide, 'utf8')
  ]);

  const calendarMonths = parseMonthlyPlan(monthlyPlanContent);
  const annualMonths = parseAnnualPlan(annualPlanContent);
  const exerciseDrawer = parseExerciseDrawer(exerciseDrawerContent);
  const templateBullets = parseSimpleBullets(templateContent);
  const toolRecommendations = parseSimpleBullets(toolsGuideContent);

  const monthMap = new Map(annualMonths.map((item) => [item.id, item]));
  const calendar = calendarMonths.map((month) => ({
    ...month,
    annualFocus: monthMap.get(month.id) || null
  }));

  const output = {
    generatedAt: new Date().toISOString(),
    sources: Object.fromEntries(
      Object.entries(SOURCES).map(([key, value]) => [key, path.relative(ROOT_DIR, value)])
    ),
    calendar,
    annualOverview: annualMonths,
    exerciseDrawer,
    monthlyTemplateHints: templateBullets,
    toolRecommendations
  };

  await fs.mkdir(DATA_DIR, { recursive: true });
  await fs.writeFile(path.join(DATA_DIR, 'planner-data.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
}

buildPlannerData().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});