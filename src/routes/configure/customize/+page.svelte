<script lang="ts">
	import AbbreviationOptions from "$lib/components/AbbreviationOptions.svelte"
	import RouteStyleOptions from "$lib/components/RouteStyleOptions.svelte"
	import type { Abbreviation, ConfigState, Feed } from "$lib/state"
	import { config } from "$lib/state"

	function saveAbbreviations(abbreviations: Abbreviation[]) {
		$config.abbreviations = abbreviations
	}
</script>

<div class="options">
	<a href="/configure">← Back</a>

	<h1>Customization</h1>

	<h2>Abbreviations</h2>
	<p>
		Abbreviations are used to shorten the names of headsigns on the countdown clock so that they fit
		without overflowing. For example, you could abbreviate "Transit Center" to "TC" in order to save
		space.
	</p>
	<AbbreviationOptions configState={$config} onsave={saveAbbreviations} />

	<h2>Route Styles</h2>
	<p>You can customize the color and names of specific routes.</p>
	<RouteStyleOptions configState={$config} onsave={(styles) => ($config.routeStyles = styles)} />
</div>

<style>
	.options {
		display: flex;
		flex-direction: column;
		gap: 1em;
		max-width: 800px;
	}

	h1 {
		margin: 0;
	}

	h2 {
		margin-bottom: 0;
	}

	p {
		margin: 0;
		line-height: 1.5;
	}
</style>
