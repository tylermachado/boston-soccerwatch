export interface Game {
  uid: string;
  summary: string;
  start: string;
  description: string;
  location: string;
}

function unfold(text: string): string {
  return text.replace(/\r?\n[ \t]/g, '');
}

function parseICSDate(dtstring: string): string {
  const m = dtstring.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!m) return dtstring;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7]}`;
}

export function parseICS(text: string): Game[] {
  const unfolded = unfold(text);
  const games: Game[] = [];
  const eventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
  let match;

  while ((match = eventRegex.exec(unfolded)) !== null) {
    const block = match[1];
    const get = (field: string): string => {
      const re = new RegExp(`^${field}(?:;[^:]*)?:(.+)$`, 'm');
      const m = block.match(re);
      return m ? m[1].trim() : '';
    };

    games.push({
      uid: get('UID'),
      summary: get('SUMMARY'),
      start: parseICSDate(get('DTSTART')),
      description: get('DESCRIPTION').replace(/\\n/g, '\n').replace(/\\,/g, ','),
      location: get('LOCATION').replace(/\\,/g, ',').replace(/\\n/g, '\n'),
    });
  }

  return games;
}

export async function fetchWCSchedule(): Promise<Game[]> {
  const response = await fetch('https://www.tylermachado.com/us-soccer-calendars/wc26/wc26.ics');
  if (!response.ok) throw new Error(`Failed to fetch WC schedule: HTTP ${response.status}`);
  return parseICS(await response.text());
}
