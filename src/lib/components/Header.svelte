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
		<!-- Main layout: Title and Submit button side-by-side on big screens, stacked on mobile -->
		<div class="flex flex-col md:flex-row gap-4 md:gap-6 md:items-center md:mb-4">
			<!-- Left column: Title (100% on mobile, 66% on big screens) -->
			<div class="w-full md:w-2/3">
				<h1 class="text-3xl lg:text-4xl tracking-tighter font-bold text-green-900 mb-3">Boston Soccer Watch 2026</h1>
				<p class="text-sm text-gray-700 mb-2 hidden lg:block">Watch parties for World Cup games in greater Boston.</p>
				<p class="text-sm text-gray-700 hidden lg:block">All submissions are moderated before appearing live on the site.</p>
			</div>

			<!-- Right column: Submit button (100% on mobile, 33% on big screens) -->
			<a
				href="https://docs.google.com/forms/d/e/1FAIpQLSea_5snoiJ4wJBqrtTiAffPJuq0Pa4OfrMhErPV38sjiJmlQw/viewform"
				class="w-full md:w-1/3 md:flex-shrink-0 px-6 py-3 bg-green-600 text-white font-bold text-center rounded-lg hover:bg-green-700 active:bg-green-800 transition-colors shadow-md hover:shadow-lg"
			>
				Submit a Watch Party
			</a>
		</div>

		<!-- Date filters and share button below -->
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
</header>
