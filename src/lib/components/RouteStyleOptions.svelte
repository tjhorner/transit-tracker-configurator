<script lang="ts">
	import { type ConfigState, type RouteAtStop, type RouteStyle } from "$lib/state"

	interface Props {
		configState: ConfigState
		onsave: (routeStyles: RouteStyle[]) => void
	}

	let { configState, onsave }: Props = $props()

	let styles: RouteStyle[] = $state(configState.routeStyles)
	let availableRoutes: RouteAtStop[] = $derived(
		Array.from(new Set(configState.routes.map((route) => route.routeId)))
			.filter((routeId) => !styles.some((style) => style.routeId === routeId))
			.map((routeId) =>
				configState.routes.find((route) => route.routeId === routeId)
			) as RouteAtStop[]
	)

	$effect(() => {
		onsave(styles)
	})
</script>

<div class="styles">
	{#each styles as style, idx}
		{@const route = configState.routes.find((route) => route.routeId === style.routeId)}
		<div class="style">
			<select
				bind:value={style.routeId}
				onchange={() => {
					style.name = route?.routeName ?? ""
					style.color = route?.color ? `#${route.color}` : "#028e51"
				}}
			>
				{#if route}
					<option value={style.routeId}>{route.routeName}</option>
				{/if}
				{#each availableRoutes as route}
					<option value={route.routeId}>{route.routeName}</option>
				{/each}
			</select>
			→
			<input type="text" bind:value={style.name} placeholder="Custom Route Name" />
			<input type="color" bind:value={style.color} />
			<button onclick={() => styles.splice(idx, 1)}>&times;</button>
		</div>
	{/each}

	<button
		disabled={availableRoutes.length === 0}
		onclick={() =>
			styles.push({
				routeId: availableRoutes[0].routeId,
				color: availableRoutes[0]?.color ? `#${availableRoutes[0].color}` : "#028e51",
				name: availableRoutes[0].routeName
			})}
	>
		Add Route Style
	</button>
</div>

<style>
	.styles {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		padding: 1rem;
		border: 1px solid #ccc;
		border-radius: 8px;
		background-color: #f9f9f9;
	}

	.style {
		display: flex;
		align-items: center;
		gap: 0.5rem;
	}

	.style select,
	.style input {
		padding: 0.5rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		flex: 1;
	}

	.style select {
		flex: 0.4;
	}

	.style input[type="color"] {
		padding: 0;
		flex: 0.2;
	}

	.style button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		background-color: #ff6b6b;
		color: white;
		cursor: pointer;
	}

	.style button:hover {
		background-color: #ff4c4c !important;
	}

	button {
		padding: 0.5rem 1rem;
		border: none;
		border-radius: 4px;
		background-color: #4caf50;
		color: white;
		cursor: pointer;
	}

	button:disabled {
		background-color: #ccc;
		cursor: not-allowed;
	}

	button:not(:disabled):hover {
		background-color: #45a049;
	}

	@media (prefers-color-scheme: dark) {
		.styles {
			border-color: #555;
			background-color: #333;
		}

		.style select,
		.style input {
			background-color: #444;
			color: white;
			border-color: #555;
		}

		.style button {
			background-color: #ff4c4c;
		}

		.style button:hover {
			background-color: #ff3333 !important;
		}

		button {
			background-color: #45a049;
		}

		button:hover {
			background-color: #3e8e41;
		}

		button:disabled {
			background-color: #555;
		}
	}
</style>
