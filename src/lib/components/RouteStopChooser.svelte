<script lang="ts">
	import { DefaultMarker } from "svelte-maplibre"
	import { MapLibre, type Map as MapLibreMap } from "svelte-maplibre"
	import RouteChooser from "./RouteChooser.svelte"
	import CountdownPreview from "./CountdownPreview.svelte"
	import type { ConfigState, RouteAtStop } from "$lib/state"
	import debounce from "p-debounce"
	import { apiBaseUrl } from "$lib/config"

	interface Props {
		config: ConfigState
		onsave?: (routes: RouteAtStop[], timeOffsets: Record<string, number>) => void
	}

	let { config, onsave }: Props = $props()

	let selected = $state(config.routes)
	let timeOffsets = $state(config.stopTimeOffsets)
	let disabled = $derived(selected.length >= 5)
	let stops: any[] = $state([])
	let abortController: AbortController | null = null
	let map: MapLibreMap | undefined = $state()
	let feed = $derived(config.feed!)

	let needsZoomIn = $state(true)

	const selectionGroupedByStop = $derived(Map.groupBy(selected, (r) => r.stopId).values())

	async function getStops(bounds: number[][]) {
		if (abortController) {
			abortController.abort()
		}

		abortController = new AbortController()
		const response = await fetch(
			`${apiBaseUrl}/stops/${config.feed!.code}/within/${bounds[0][1]}/${bounds[0][0]}/${bounds[1][1]}/${bounds[1][0]}`,
			{ signal: abortController?.signal }
		)

		abortController = null
		return response.json()
	}

	async function _onMapMoved({ target }: { target: MapLibreMap }) {
		if (target.getZoom() < 15) {
			needsZoomIn = true
			stops = []
			return
		}

		needsZoomIn = false

		const bounds = target.getBounds()
		stops = await getStops(bounds.toArray())
	}

	const onMapMoved = debounce(_onMapMoved, 1000)
</script>

<div class="split">
	<div class="side">
		<div>
			<h2>Selected Routes</h2>

			<p>
				Find the stop you are interested in on the map then select the routes you want to track on
				your Transit Tracker.
			</p>

			<p>
				You can also optionally set a travel time for each stop; this will adjust the countdown time
				to account for the time it takes for you to get to the stop. For example, if it takes you 5
				minutes to walk to a stop, set the travel time to 5 minutes.
			</p>

			<p>You can select up to five routes.</p>
		</div>

		{#each selectionGroupedByStop as routes}
			<div class="card">
				<h3>{routes[0].stopName} ({routes[0].stopCode})</h3>

				<div class="time-offset">
					{#if timeOffsets[routes[0].stopId]}
						<label>
							Travel Time:
							<input
								type="number"
								value={timeOffsets[routes[0].stopId]}
								oninput={(e) => (timeOffsets[routes[0].stopId] = parseInt(e.currentTarget.value))}
							/> minutes
						</label>
					{:else}
						<button onclick={() => (timeOffsets[routes[0].stopId] = 1)}> Set Travel Time </button>
					{/if}
				</div>

				{#each routes as route (route.routeId + route.stopId)}
					<div class="selected-route">
						<label>
							<input
								type="checkbox"
								checked
								onchange={(e) =>
									selected.splice(
										selected.findIndex(
											(r) => r.routeId === route.routeId && r.stopId === route.stopId
										),
										1
									)}
							/>
							<div>
								<strong>Route: {route.routeName}</strong>
								{#each route.headsigns as headsign}
									<div class="headsign"><strong>→</strong> {headsign}</div>
								{/each}
							</div>
						</label>
					</div>
				{/each}
			</div>
		{/each}

		<div class="controls">
			{#if selected.length > 0}
				<div>
					<h2>Countdown Preview</h2>
					<div class="card">
						<CountdownPreview feed={feed.code} routes={selected} {timeOffsets} />
					</div>
				</div>
			{/if}

			<button onclick={() => onsave?.(selected, timeOffsets)}> Save </button>
		</div>
	</div>

	<MapLibre
		bind:map
		style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
		standardControls
		class="map"
		onmoveend={onMapMoved}
		bounds={[
			[feed.bounds[1], feed.bounds[0]],
			[feed.bounds[3], feed.bounds[2]]
		]}
	>
		{#each stops as stop (stop.stopId)}
			<DefaultMarker lngLat={[stop.lon, stop.lat]} class="marker">
				<RouteChooser
					{stop}
					feed={feed.code}
					{selected}
					{disabled}
					onRouteSelected={(route: RouteAtStop) => selected.push(route)}
					onRouteDeselected={(route: RouteAtStop) =>
						selected.splice(
							selected.findIndex((r) => r.routeId === route.routeId && r.stopId === route.stopId),
							1
						)}
				/>
			</DefaultMarker>
		{/each}

		{#if needsZoomIn}
			<div class="zoomin-overlay">
				<p>Zoom in to see stops</p>
			</div>
		{/if}
	</MapLibre>
</div>

<style>
	h2 {
		margin-top: 0;
		margin-bottom: 0.5em;
	}

	.zoomin-overlay {
		position: absolute;
		width: 100%;
		height: 100%;
		z-index: 999;
		pointer-events: none;
		text-align: center;
		display: flex;
		justify-content: center;
		align-items: center;
	}

	.zoomin-overlay p {
		background: rgba(0, 0, 0, 0.6);
		color: white;
		font-size: 2em;
		padding: 1em;
		border-radius: 10px;
	}

	:global(.map) {
		width: 100%;
		height: 100%;
	}

	:global(.marker) {
		cursor: pointer;
	}

	.split {
		display: flex;
		height: 100%;
		width: 100%;
	}

	.side {
		display: flex;
		flex-direction: column;
		width: 60%;
		overflow-y: auto;
		padding: 1em;
	}

	@media (max-width: 768px) {
		.split {
			flex-direction: column-reverse;
		}

		.side {
			width: 100%;
			flex-basis: 100%;
		}
	}

	.selected-route:not(:last-child) {
		margin-bottom: 0.5em;
	}

	.selected-route label {
		display: flex;
		align-items: flex-start;
		gap: 5px;
	}

	.selected-route .headsign:first-of-type {
		margin-top: 0.2em;
	}

	.card {
		background: #ececec;
		border-radius: 10px;
		padding: 1em;
		margin-bottom: 1em;
	}

	.card h3 {
		margin-top: 0;
		margin-bottom: 0.5em;
	}

	.time-offset {
		margin-bottom: 0.5em;
		vertical-align: bottom;
	}

	.time-offset input {
		width: 4em;
	}

	.controls {
		display: flex;
		flex-direction: column;
		justify-content: flex-end;
		flex-grow: 1;
		gap: 0.25em;
		margin-top: 0.75em;
	}

	.controls button {
		font-size: 1.5em;
		padding: 0.5rem 3rem;
		color: white;
		background: #007bff;
		border: none;
		border-radius: 4px;
		cursor: pointer;
	}

	@media (prefers-color-scheme: dark) {
		.card {
			background: #333;
			color: white;
		}

		.controls button {
			background: #0056b3;
		}
	}
</style>
