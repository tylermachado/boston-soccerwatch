import { fetchWCSchedule } from '$lib/server/wc-schedule';

export async function load() {
  const games = await fetchWCSchedule();
  return { games };
}
