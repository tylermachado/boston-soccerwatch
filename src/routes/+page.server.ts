import { fetchWCSchedule } from '$lib/server/wc-schedule';
import { fetchSchedule } from '$lib/server/schedule';

export interface Event {
  id: string;
  title: string;
  start: string;
  startDisplay?: string;
  location: string;
  description: string;
  type: 'wc' | 'local';
}

// Combines a date string ("2026-06-12") with a time string (either "14:00" or "2:00 PM")
// from the Apps Script (formatted in the spreadsheet's Eastern timezone)
// into a UTC ISO timestamp using the EDT offset (UTC-4).
function combineDateTime(dateStr: string, timeStr: string): string {
  let hours: number, minutes: number;
  const ampm = timeStr.match(/(\d+):(\d+)\s*(AM|PM)/i);
  if (ampm) {
    hours = parseInt(ampm[1], 10);
    minutes = parseInt(ampm[2], 10);
    const period = ampm[3].toUpperCase();
    if (period === 'AM' && hours === 12) hours = 0;
    if (period === 'PM' && hours !== 12) hours += 12;
  } else {
    const [hStr, mStr] = timeStr.split(':');
    hours = parseInt(hStr, 10);
    minutes = parseInt(mStr, 10);
  }
  const pad = (n: number) => n.toString().padStart(2, '0');
  return new Date(`${dateStr}T${pad(hours)}:${pad(minutes)}:00-04:00`).toISOString();
}

// Returns the time string for display (already formatted by the sheet)
function formatSheetTime(timeStr: string): string {
  return timeStr;
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
    .map((s, i) => ({
      id: `local-${i}`,
      title: s['Event Title / Venue'] ?? '',
      start: combineDateTime(s['Date'], s['Start Time']),
      startDisplay: s['Start Time'] ? formatSheetTime(s['Start Time']) : undefined,
      location: s['Address'] ?? '',
      description: s['Link for Registration, Info, Etc.'] ?? '',
      type: 'local',
    }));

  const events = [...wcEvents, ...localEvents].sort((a, b) =>
    a.start.localeCompare(b.start)
  );

  return { events };
}
