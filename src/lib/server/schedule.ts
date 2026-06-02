import { SHEET_SECRET, SHEET_DEPLOYMENT_ID } from '$env/static/private';
import fallbackSchedule from '$lib/data/schedule.json';

const TIMEOUT_MS = 15000;

export async function fetchSchedule() {
  if (!SHEET_DEPLOYMENT_ID || !SHEET_SECRET) {
    console.warn('SHEET_DEPLOYMENT_ID or SHEET_SECRET not set, using local fallback');
    return fallbackSchedule;
  }

  try {
    const url = `https://script.google.com/macros/s/${SHEET_DEPLOYMENT_ID}/exec?token=${SHEET_SECRET}`;
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), TIMEOUT_MS);

    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeout);

    if (!response.ok) throw new Error(`HTTP ${response.status}`);

    const { data } = await response.json();
    console.log('fetchSchedule data:', data);
    return data;
  } catch (err) {
    console.warn('Remote schedule fetch failed, using local fallback:', err);
    return fallbackSchedule;
  }
}