#!/usr/bin/env node
/**
 * Fetches the World Cup .ics feed, parses it, and writes the result to
 * src/lib/data/wc-schedule.json as a local snapshot.
 *
 * Usage:
 *   node scripts/scrape-ics.js
 *   npm run scrape:ics
 *
 * You can override the ICS URL via the WC_ICS_URL environment variable.
 */

import { writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

const DEFAULT_ICS_URL =
  'https://www.tylermachado.com/us-soccer-calendars/wc26/wc26.ics';

// ---------------------------------------------------------------------------
// ICS parser (mirrors src/lib/server/wc-schedule.ts)
// ---------------------------------------------------------------------------

/** Unfold multi-line ICS values (RFC 5545 line folding). */
function unfold(text) {
  return text.replace(/\r?\n[ \t]/g, '');
}

/** Convert a DTSTART / DTEND string to an ISO-8601 datetime string. */
function parseICSDate(dtstring) {
  const m = dtstring.match(/^(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})(Z?)$/);
  if (!m) return dtstring;
  return `${m[1]}-${m[2]}-${m[3]}T${m[4]}:${m[5]}:${m[6]}${m[7]}`;
}

/**
 * Parse an ICS text into an array of game objects.
 * @param {string} text
 * @returns {{ uid: string; summary: string; start: string; description: string; location: string }[]}
 */
function parseICS(text) {
  const unfolded = unfold(text);
  const games = [];
  const eventRegex = /BEGIN:VEVENT([\s\S]*?)END:VEVENT/g;
  let match;

  while ((match = eventRegex.exec(unfolded)) !== null) {
    const block = match[1];

    const get = (field) => {
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

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const TIMEOUT_MS = 15_000;

async function main() {
  const icsUrl = process.env.WC_ICS_URL ?? DEFAULT_ICS_URL;

  console.log(`Fetching ICS feed from:\n  ${icsUrl}`);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let icsText;
  try {
    const response = await fetch(icsUrl, { signal: controller.signal });
    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    icsText = await response.text();
  } catch (err) {
    clearTimeout(timer);
    console.error('Fetch failed:', err.message);
    process.exit(1);
  }

  const games = parseICS(icsText);

  if (games.length === 0) {
    console.warn('Warning: no VEVENT entries found in the ICS feed.');
  }

  const outPath = resolve(ROOT, 'src/lib/data/wc-schedule.json');
  writeFileSync(outPath, JSON.stringify(games, null, 2) + '\n', 'utf-8');

  console.log(`✓ Wrote ${outPath}`);
  console.log(`  Games: ${games.length}`);

  // Print a sample of the first 3 events for quick verification
  if (games.length > 0) {
    console.log('\nFirst 3 events:');
    games.slice(0, 3).forEach((g) => {
      console.log(`  [${g.start}] ${g.summary} @ ${g.location}`);
    });
  }
}

main();
