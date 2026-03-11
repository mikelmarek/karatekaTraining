import { google } from 'googleapis';

function createCalendarClient(config) {
  const auth = new google.auth.OAuth2(
    config.googleClientId,
    config.googleClientSecret
  );

  auth.setCredentials({
    refresh_token: config.googleRefreshToken
  });

  return google.calendar({ version: 'v3', auth });
}

export async function findUpcomingTrainingEvents(config, windowEndDate) {
  return findTrainingEvents(config, {
    timeMin: new Date(),
    timeMax: windowEndDate,
    maxResults: 20
  });
}

export async function findTrainingEvents(config, { timeMin, timeMax, maxResults = 50 }) {
  const calendar = createCalendarClient(config);
  const response = await calendar.events.list({
    calendarId: config.googleCalendarId,
    timeMin: timeMin.toISOString(),
    timeMax: timeMax.toISOString(),
    singleEvents: true,
    orderBy: 'startTime',
    maxResults
  });

  const events = response.data.items || [];

  return events.filter((event) => {
    const haystack = [event.summary, event.description, event.location]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();

    return haystack.includes(config.trainingEventQuery);
  }).map((event) => ({
    id: event.id,
    summary: event.summary || 'Karate trénink',
    description: event.description || '',
    location: event.location || '',
    start: event.start?.dateTime || event.start?.date,
    end: event.end?.dateTime || event.end?.date
  }));
}
