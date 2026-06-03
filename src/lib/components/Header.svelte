<script lang="ts">
	interface Props {
		dates?: string[];
		selectedDate?: string;
		onSelectDate?: (date: string) => void;
	}

	let { dates = [], selectedDate = '', onSelectDate }: Props = $props();

	function formatDateLabel(dateStr: string): string {
		const [y, m, d] = dateStr.split('-').map(Number);
		return new Date(y, m - 1, d).toLocaleDateString('en-US', {
			weekday: 'short',
			month: 'short',
			day: 'numeric'
		});
	}



	import { savedSessions } from '$stores/savedSessions.svelte.ts';

	import { page } from '$app/stores';
import { browser } from '$app/environment';
import { onMount } from 'svelte';

onMount(() => {
  const params = new URLSearchParams(window.location.search);
  const saved = params.get('saved');
  if (saved) {
    saved.split(',').forEach(id => {
      if (!savedSessions.isSaved(id)) savedSessions.toggle(id);
    });
  }
});

function buildShareUrl(): string {
  const ids = savedSessions.getIds().join(',');
  const url = new URL(window.location.href);
  url.searchParams.set('saved', ids);
  return url.toString();
}

let copied = $state(false);

function copyShareUrl() {
  navigator.clipboard.writeText(buildShareUrl());
  copied = true;
  setTimeout(() => copied = false, 2000);
}
</script>

<header class="sticky top-0 bg-gradient-to-r from-green-50 to-emerald-50 border-b border-green-200 z-50">
	<div class="max-w-6xl mx-auto px-4 py-6">
		<div class="flex gap-8 items-start">
			<!-- Left column: Title (40%) -->
			<div class="w-2/5 flex-shrink-0">
				<h1 class="text-4xl font-bold text-green-900">Boston Soccer Watch</h1>
			</div>

			<!-- Right column: Content (60%) -->
			<div class="w-3/5 pt-1">
				<p class="text-sm text-gray-700 mb-3">Watch parties for 2026 World Cup games in greater Boston.</p>

				<p class="text-sm text-gray-700 mb-4"><a href="https://docs.google.com/forms/d/e/1FAIpQLSea_5snoiJ4wJBqrtTiAffPJuq0Pa4OfrMhErPV38sjiJmlQw/viewform">Submit a party via this form.</a> All submissions are moderated before appearing live on the site.</p>

				{#if dates.length > 0}
					<div class="flex flex-wrap items-center gap-3">
						<div class="flex gap-2">
							{#each dates as date}
								<button
									onclick={() => onSelectDate(date)}
									class="px-2 py-0.5 rounded-full text-xs font-medium border transition-colors
										{selectedDate === date
										? 'bg-green-900 text-white border-green-900'
										: 'bg-white text-gray-600 border-green-300 hover:border-green-500 hover:text-green-900'}"
								>
									{formatDateLabel(date)}
								</button>
							{/each}
						</div>
						<button
							onclick={copyShareUrl}
							class="text-xs px-2 py-0.5 rounded bg-green-200 border border-green-400 text-green-900 hover:bg-green-300 transition-colors font-medium"
						>
							{copied ? '✓ Copied!' : 'Share'}
						</button>
					</div>
				{/if}
			</div>
		</div>
	</div>
</header>
