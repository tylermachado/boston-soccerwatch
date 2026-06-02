#!/usr/bin/env node
/**
 * Fetches the schedule from the Google Apps Script endpoint and writes it
 * to src/lib/data/schedule.json as a local fallback.
 *
 * Reads SHEET_DEPLOYMENT_ID and SHEET_SECRET from .env (or the environment).
 *
 * Usage:
 *   node scripts/scrape-sheet.js
 *   npm run scrape:sheet
 */

import { readFileSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');

// ---------------------------------------------------------------------------
// Load .env without requiring dotenv
// ---------------------------------------------------------------------------
function loadEnv() {
  try {
    const envPath = resolve(ROOT, '.env');
    const lines = readFileSync(envPath, 'utf-8').split('\n');
    for (const line of lines) {
      const match = line.match(/^([^#=\s][^=]*)=(.*)$/);
      if (match) {
        const key = match[1].trim();
        const val = match[2].trim().replace(/^['"]|['"]$/g, ''); // strip optional quotes
        if (!(key in process.env)) process.env[key] = val;
      }
    }
  } catch {
    // no .env file – rely on environment variables being set externally
  }
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------
const TIMEOUT_MS = 15_000;

async function main() {
  loadEnv();

  const deploymentId = process.env.SHEET_DEPLOYMENT_ID;
  const secret = process.env.SHEET_SECRET;

  if (!deploymentId || !secret) {
    console.error(
      'Error: SHEET_DEPLOYMENT_ID and SHEET_SECRET must be set in .env or the environment.'
    );
    process.exit(1);
  }

  const url = `https://script.google.com/macros/s/${deploymentId}/exec?token=${secret}`;
  console.log('Fetching schedule from Google Apps Script…');

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);

  let json;
  try {
    const response = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    clearTimeout(timer);

    if (!response.ok) {
      throw new Error(`HTTP ${response.status} ${response.statusText}`);
    }

    const contentType = response.headers.get('content-type') ?? '';
    const text = await response.text();

    if (!contentType.includes('json') && !text.trimStart().startsWith('{') && !text.trimStart().startsWith('[')) {
      console.error('Response is not JSON. Content-Type:', contentType);
      console.error('Response body (first 500 chars):');
      console.error(text.slice(0, 500));
      process.exit(1);
    }

    json = JSON.parse(text);
  } catch (err) {
    clearTimeout(timer);
    console.error('Fetch failed:', err.message);
    process.exit(1);
  }

  const data = json.data ?? json;

  const outPath = resolve(ROOT, 'src/lib/data/schedule.json');
  writeFileSync(outPath, JSON.stringify(data, null, 2) + '\n', 'utf-8');

  const sessionCount = data?.sessions?.length ?? '(unknown)';
  console.log(`✓ Wrote ${outPath}`);
  console.log(`  Sessions: ${sessionCount}`);
}

main();
