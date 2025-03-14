<script lang="ts">
	import type { RouteAtStop } from "$lib/state"
	import { Popup } from "svelte-maplibre"
	import Skeleton from "./Skeleton.svelte"
	import { apiBaseUrl } from "$lib/config"

	interface Props {
		stop: any
		feed: string
		selected: RouteAtStop[]
		onRouteSelected: (route: RouteAtStop) => void
		onRouteDeselected: (route: RouteAtStop) => void
		disabled?: boolean
	}

	interface Route {
		routeId: string
		name: string
		color: string | null
		headsigns: string[]
	}

	const {
		stop,
		feed,
		selected,
		onRouteSelected,
		onRouteDeselected,
		disabled = false
	}: Props = $props()

	let routes: Route[] = $state([])
	let shown = $state(false)

	async function getRoutes(stopId: string) {
		const response = await fetch(`${apiBaseUrl}/stops/${feed}/${stopId}/routes`)
		return response.json()
	}

	function isSelected(routeId: string) {
		return selected.some((sr) => sr.routeId === routeId && sr.stopId === stop.stopId)
	}

	function onRouteCheckboxChange(event: Event, route: Route) {
		const target = event.target as HTMLInputElement

		const routeAtStop: RouteAtStop = {
			stopId: stop.stopId,
			stopCode: stop.stopCode,
			stopName: stop.name,
			routeId: route.routeId,
			routeName: route.name,
			headsigns: route.headsigns,
			color: route.color
		}

		if (target.checked) {
			onRouteSelected(routeAtStop)
		} else {
			onRouteDeselected(routeAtStop)
		}
	}

	$effect(() => {
		if (shown && routes.length === 0) {
			getRoutes(stop.stopId).then((r) => (routes = r))
		}
	})
</script>

<Popup bind:open={shown} closeOnMove>
	<div class="container">
		<h2>{stop.name} ({stop.stopCode})</h2>
		{#if routes.length === 0}
			<Skeleton />
		{/if}
		{#each routes as route, index}
			{@const routeSelected = isSelected(route.routeId)}
			<div class="route">
				<label>
					<input
						type="checkbox"
						checked={routeSelected}
						value={index}
						onchange={(e) => onRouteCheckboxChange(e, route)}
						disabled={!routeSelected && disabled}
					/>
					<div>
						<strong>Route: {route.name}</strong>
						{#each route.headsigns as headsign}
							<div class="headsign"><strong>→</strong> {headsign}</div>
						{/each}
					</div>
				</label>
			</div>
		{/each}
	</div>
</Popup>

<style>
	h2 {
		margin-top: 0;
		margin-bottom: 0.5em;
	}

	.container {
		max-height: 400px;
		overflow-y: auto;
		color: black;
	}

	.route {
		font-family:
			system-ui,
			-apple-system,
			BlinkMacSystemFont,
			"Segoe UI",
			Roboto,
			Oxygen,
			Ubuntu,
			Cantarell,
			"Open Sans",
			"Helvetica Neue",
			sans-serif;
	}

	.route:not(:last-child) {
		margin-bottom: 0.5em;
	}

	.route label {
		display: flex;
		align-items: flex-start;
		gap: 2px;
	}
</style>
