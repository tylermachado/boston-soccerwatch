<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  // Group games by UTC date
  function dateKey(isoString: string): string {
    return isoString.slice(0, 10);
  }

  function formatDate(dateStr: string): string {
    const [y, m, d] = dateStr.split('-').map(Number);
    return new Date(y, m - 1, d).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  }

  const gamesByDate = $derived.by(() => {
    const map = new Map<string, typeof data.games[number][]>();
    for (const game of data.games) {
      const key = dateKey(game.start);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(game);
    }
    return [...map.entries()].sort(([a], [b]) => a.localeCompare(b));
  });
</script>

<div class="max-w-2xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-8">World Cup 2026 Schedule</h1>

  {#each gamesByDate as [dateStr, dayGames]}
    <section class="mb-8">
      <h2 class="text-lg font-semibold text-gray-500 border-b border-gray-200 pb-2 mb-4">
        {formatDate(dateStr)}
      </h2>
      <ul class="space-y-3">
        {#each dayGames as game}
          <li class="flex items-start gap-4 py-3 border-b border-gray-100 last:border-0">
            <time
              class="text-sm text-gray-400 w-16 shrink-0 pt-0.5"
              datetime={game.start}
            >
              {new Date(game.start).toLocaleTimeString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                timeZone: 'UTC',
                hour12: true,
              })} UTC
            </time>
            <div>
              <p class="font-medium">{game.summary}</p>
              <p class="text-sm text-gray-500">{game.location}</p>
              {#if game.description}
                <p class="text-xs text-gray-400 mt-0.5">{game.description}</p>
              {/if}
            </div>
          </li>
        {/each}
      </ul>
    </section>
  {/each}
</div>
