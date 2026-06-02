<script lang="ts">
  import type { PageData } from './$types';

  let { data }: { data: PageData } = $props();

  function dateKey(isoString: string): string {
    const d = new Date(isoString);
    return [
      d.getFullYear(),
      String(d.getMonth() + 1).padStart(2, '0'),
      String(d.getDate()).padStart(2, '0'),
    ].join('-');
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

  function formatTime(isoString: string): string {
    return new Date(isoString).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  }

  function groupByDate<T extends { start: string }>(events: T[]): Map<string, T[]> {
    const map = new Map<string, T[]>();
    for (const event of events) {
      const key = dateKey(event.start);
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(event);
    }
    return map;
  }

  const wcEvents = $derived(data.events.filter((e) => e.type === 'wc'));
  const localEvents = $derived(data.events.filter((e) => e.type === 'local'));

  const allDates = $derived.by(() => {
    const dates = new Set<string>();
    for (const e of data.events) dates.add(dateKey(e.start));
    return [...dates].sort();
  });

  const wcByDate = $derived(groupByDate(wcEvents));
  const localByDate = $derived(groupByDate(localEvents));
</script>

<div class="max-w-6xl mx-auto px-4 py-8">
  <h1 class="text-3xl font-bold mb-8">Schedule</h1>

  {#each allDates as dateStr}
    {@const wc = wcByDate.get(dateStr) ?? []}
    {@const local = localByDate.get(dateStr) ?? []}
    {#if wc.length > 0 || local.length > 0}
      <section class="mb-10">
        <h2 class="text-lg font-semibold text-gray-500 border-b border-gray-200 pb-2 mb-4">
          {formatDate(dateStr)}
        </h2>
        <div class="grid grid-cols-1 md:grid-cols-6 gap-6">

          <!-- WC games: 2 cols -->
          <div class="md:col-span-2">
            {#if wc.length > 0}
              <ul class="space-y-2">
                {#each wc as event}
                  <li class="py-2 border-b border-gray-100 last:border-0">
                    <time class="text-xs text-gray-400 block" datetime={event.start}>
                      {formatTime(event.start)}
                    </time>
                    <p class="font-medium text-sm leading-snug mt-0.5">{event.title}</p>
                    {#if event.location}
                      <p class="text-xs text-gray-500 mt-0.5">{event.location}</p>
                    {/if}
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="text-sm text-gray-300 italic">No matches</p>
            {/if}
          </div>

          <!-- Local events: 4 cols -->
          <div class="md:col-span-4">
            {#if local.length > 0}
              <ul class="space-y-2">
                {#each local as event}
                  <li class="py-2 border-b border-gray-100 last:border-0">
                    <time class="text-xs text-gray-400 block" datetime={event.start}>
                      {formatTime(event.start)}
                    </time>
                    <p class="font-medium text-sm leading-snug mt-0.5">{event.title}</p>
                    {#if event.location}
                      <p class="text-xs text-gray-500 mt-0.5">{event.location}</p>
                    {/if}
                    {#if event.description}
                      <p class="text-xs text-gray-400 mt-0.5">{event.description}</p>
                    {/if}
                  </li>
                {/each}
              </ul>
            {:else}
              <p class="text-sm text-gray-300 italic">No local events</p>
            {/if}
          </div>

        </div>
      </section>
    {/if}
  {/each}
</div>
