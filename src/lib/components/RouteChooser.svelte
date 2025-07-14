<script lang="ts">
  import type { RouteAtStop } from "$lib/state"
  import { Popup } from "svelte-maplibre"
  import Skeleton from "./Skeleton.svelte"
  import { api } from "$lib/api"

  interface Props {
    stop: any
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
    selected,
    onRouteSelected,
    onRouteDeselected,
    disabled = false
  }: Props = $props()

  let routes: Route[] = $state([])
  let shown = $state(false)

  async function getRoutes(stopId: string) {
    return await api.getRoutesForStop(stopId)
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

<Popup bind:open={shown} closeOnMove popupClass="p-0">
  <div class="bg-background px-4 py-2 text-foreground">
    <h4 class="mb-2 scroll-m-20 text-lg font-semibold tracking-tight">
      {stop.name}
      {#if stop.stopCode}
        ({stop.stopCode})
      {/if}
    </h4>
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
          <div class="-mt-[3px]">
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

  :global(.maplibregl-popup-content) {
    @apply bg-background p-0 text-foreground;
  }

  :global(.maplibregl-popup-anchor-bottom .maplibregl-popup-tip) {
    @apply border-t-background;
  }

  :global(.maplibregl-popup-anchor-left .maplibregl-popup-tip) {
    @apply border-r-background;
  }

  :global(.maplibregl-popup-anchor-right .maplibregl-popup-tip) {
    @apply border-l-background;
  }

  :global(.maplibregl-popup-anchor-top .maplibregl-popup-tip) {
    @apply border-b-background;
  }
</style>
