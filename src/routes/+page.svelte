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

  function downloadEventAsIcs(event: EventItem) {
    const d = new Date(event.start);
    const formatIcsDate = (date: Date) => {
      return date.toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
    };
    
    const endDate = new Date(d.getTime() + 2 * 60 * 60 * 1000); // 2 hour default duration
    const icsContent = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'PRODID:-//Soccer Watch//EN',
      'BEGIN:VEVENT',
      `DTSTART:${formatIcsDate(d)}`,
      `DTEND:${formatIcsDate(endDate)}`,
      `SUMMARY:${event.title}`,
      ...(event.location ? [`LOCATION:${event.location}`] : []),
      ...(event.description ? [`DESCRIPTION:${event.description}`] : []),
      `UID:${event.uid || event.title}-${d.getTime()}@soccerwatch`,
      'END:VEVENT',
      'END:VCALENDAR'
    ].join('\r\n');

    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${event.title}-${formatIcsDate(d).slice(0, 8)}.ics`;
    link.click();
    URL.revokeObjectURL(url);
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
                  <li class="flex items-center justify-between pl-3 border-l-2 border-blue-400 bg-blue-50 rounded-r py-1 pr-2">
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium">{event.title}</p>
                      {#if event.location}
                        <p class="text-xs text-gray-400">{event.location}</p>
                      {/if}
                    </div>
                    <div class="flex gap-1 ml-2 flex-shrink-0">
                      {#if event.description}
                        <button 
                          onclick={() => window.open(event.description, '_blank', 'noopener,noreferrer')} 
                          class="p-1.5 bg-blue-200 hover:bg-blue-300 rounded text-blue-700 transition-colors cursor-pointer"
                          title="Info"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <circle cx="12" cy="12" r="10" stroke-width="2"/>
                            <path d="M12 16v-4M12 8h.01" stroke-width="2" stroke-linecap="round"/>
                          </svg>
                        </button>
                      {/if}
                      <button 
                        onclick={() => downloadEventAsIcs(event)} 
                        class="p-1.5 bg-blue-200 hover:bg-blue-300 rounded text-blue-700 transition-colors cursor-pointer"
                        title="Add to Calendar"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <rect x="3" y="4" width="18" height="18" rx="2" stroke-width="2"/>
                          <path d="M16 2v4M8 2v4M3 10h18" stroke-width="2" stroke-linecap="round"/>
                          <path d="M12 14v4M10 16h4" stroke-width="2" stroke-linecap="round"/>
                        </svg>
                      </button>
                    </div>
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
