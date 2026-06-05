import { fetchWCSchedule } from '$lib/server/wc-schedule';

function nyDateKey(date: Date): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(date);

  const year = parts.find((part) => part.type === 'year')?.value ?? '';
  const month = parts.find((part) => part.type === 'month')?.value ?? '';
  const day = parts.find((part) => part.type === 'day')?.value ?? '';

  return `${year}-${month}-${day}`;
}

export async function load() {
  const games = await fetchWCSchedule();
  const todayNy = nyDateKey(new Date());
  const upcomingGames = games.filter((game) => nyDateKey(new Date(game.start)) >= todayNy);

  return { games: upcomingGames };
}
