import { fetchWCSchedule } from '$lib/server/wc-schedule';
import { fetchSchedule } from '$lib/server/schedule';

export interface Event {
  id: string;
  title: string;
  start: string;
  location: string;
  description: string;
  type: 'wc' | 'local';
}

// Combines a Google Sheets date ("2026-06-17T04:00:00.000Z") with a Sheets
// time ("1899-12-30T15:32:11.000Z") into a single ISO timestamp.
function combineDateTime(dateIso: string, timeIso: string): string {
  const date = dateIso.slice(0, 10); // "YYYY-MM-DD"
  const time = timeIso.slice(11, 19); // "HH:MM:SS"
  return `${date}T${time}.000Z`;
}

export async function load() {
  const [wcGames, schedule] = await Promise.all([
    fetchWCSchedule(),
    fetchSchedule(),
  ]);

  const wcEvents: Event[] = wcGames.map((g) => ({
    id: g.uid,
    title: g.summary,
    start: g.start,
    location: g.location,
    description: g.description,
    type: 'wc',
  }));

  const scheduleArr: any[] = Array.isArray(schedule) ? schedule : [];
  const localEvents: Event[] = scheduleArr
    .filter((s) => s['Approval'])
    .map((s, i) => ({
      id: `local-${i}`,
      title: s['Event Title / Venue'] ?? '',
      start: combineDateTime(s['Date'], s['Start Time']),
      location: s['Address'] ?? '',
      description: s['Link for Registration, Info, Etc.'] ?? '',
      type: 'local',
    }));

  const events = [...wcEvents, ...localEvents].sort((a, b) =>
    a.start.localeCompare(b.start)
  );

  return { events };
}
