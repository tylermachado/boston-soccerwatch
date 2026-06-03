<script lang="ts">
  import type { PageData } from './$types';
  import Footer from '$lib/components/Footer.svelte';
  import Header from '$lib/components/Header.svelte';

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

  function timeKey(isoString: string): string {
    const d = new Date(isoString);
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
  }

  type EventItem = typeof data.events[number];

  interface TimeSlot {
    time: string;
    wc: EventItem[];
    local: EventItem[];
  }

  const eventsByDate = $derived.by(() => {
    const byDate = new Map<string, Map<string, TimeSlot>>();

    for (const event of data.events) {
      const dk = dateKey(event.start);
      const tk = timeKey(event.start);

      if (!byDate.has(dk)) byDate.set(dk, new Map());
      const slots = byDate.get(dk)!;

      if (!slots.has(tk)) slots.set(tk, { time: tk, wc: [], local: [] });
      const slot = slots.get(tk)!;

      if (event.type === 'wc') slot.wc.push(event);
      else slot.local.push(event);
    }

    return byDate;
  });

  const allDates = $derived([...eventsByDate.keys()].sort());
</script>

<Header />

<div class="max-w-6xl mx-auto px-4 py-8">
  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
    {#each allDates as dateStr}
      {@const slots = [...(eventsByDate.get(dateStr)?.values() ?? [])].sort((a, b) => a.time.localeCompare(b.time))}
      <section class="border border-gray-200 rounded-lg p-4">
        <h2 class="text-sm font-semibold border-b border-gray-200 pb-2 mb-4">
          {formatDate(dateStr)}
        </h2>
        <div class="space-y-4">
          {#each slots as slot}
            {@const anchor = slot.wc[0] ?? slot.local[0]}
            <div>
              <p class="text-xs font-semibold text-gray-500 mb-1.5">{formatTime(anchor.start)}</p>
              <ul class="space-y-1.5">
                {#each slot.wc as event}
                  <li class="pl-3 border-l-2 border-green-400 bg-green-50 rounded-r py-1 pr-2">
                    <p class="text-sm font-medium">{event.title}</p>
                    {#if event.location}
                      <p class="text-xs text-gray-400">{event.location}</p>
                    {/if}
                  </li>
                {/each}
                {#each slot.local as event}
                  <li class="pl-3 border-l-2 border-blue-400 bg-blue-50 rounded-r py-1 pr-2">
                    <p class="text-sm font-medium">{event.title}</p>
                    {#if event.location}
                      <p class="text-xs text-gray-400">{event.location}</p>
                    {/if}
                    {#if event.description}
                      <button onclick={() => window.open(event.description, '_blank', 'noopener,noreferrer')} class="text-xs text-blue-500 hover:underline mt-0.5">info</button>
                    {/if}
                  </li>
                {/each}
              </ul>
            </div>
          {/each}
        </div>
      </section>
    {/each}
  </div>
</div>

<Footer />
