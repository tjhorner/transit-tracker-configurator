<script lang="ts">
  import { DefaultMarker } from "svelte-maplibre"
  import { MapLibre, type Map as MapLibreMap } from "svelte-maplibre"
	import RouteChooser from "./RouteChooser.svelte"
	import CountdownPreview from "./CountdownPreview.svelte"
	import type { ConfigState, Feed, RouteAtStop } from "$lib/state"

  interface Props {
    config: ConfigState
    onsave?: (routes: RouteAtStop[]) => void
  }

  let { config, onsave }: Props = $props()

  let selected = $state(config.routes)
  let disabled = $derived(selected.length >= 5)
  let stops: any[] = $state([])
  let abortController: AbortController | null = null
  let map: MapLibreMap | undefined = $state()
  let feed = $derived(config.feed!)

  const selectionGroupedByStop = $derived(Map.groupBy(selected, (r) => r.stopId))

  async function getStops(bounds: number[][]) {
    if (abortController) {
      abortController.abort()
    }

    abortController = new AbortController()
    const response = await fetch(
      `https://tt.horner.tj/stops/${config.feed!.code}/within/${bounds[0][1]}/${bounds[0][0]}/${bounds[1][1]}/${bounds[1][0]}`,
      { signal: abortController?.signal }
    )

    abortController = null
    return response.json()
  }

  async function onMapMoved({ target }: { target: MapLibreMap }) {
    if (target.getZoom() < 15) {
      stops = []
      return
    }

    const bounds = target.getBounds()
    stops = await getStops(bounds.toArray())
  }

  $inspect(selected)
</script>

<div class="split">
  <div class="side">
    <div>
      <h2>Selected Routes</h2>

      <p>
        Find the stop you are interested in on the map then select the routes
        you want to track on your countdown clock.
      </p>

      <p>
        You can select up to five routes. Zoom in to see stops.
      </p>
    </div>

    {#each selectionGroupedByStop as [ stopId, routes ]}
      <div class="card">
        <h3>{routes[0].stopName} ({routes[0].stopCode})</h3>
        {#each routes as route (route.routeId + route.stopId)}
          <div class="selected-route">
            <label>
              <input
                type="checkbox"
                checked
                onchange={(e) => selected.splice(selected.findIndex((r) => r.routeId === route.routeId && r.stopId === route.stopId), 1)}
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
            <CountdownPreview feed={feed.code} routes={selected} />
          </div>
        </div>
      {/if}

      <button onclick={() => onsave?.(selected)}>
        Save
      </button>
    </div>
  </div>

  <MapLibre
    bind:map={map}
    style="https://basemaps.cartocdn.com/gl/positron-gl-style/style.json"
    standardControls
    class="map"
    onmoveend={onMapMoved}
    bounds={[
      [feed.bounds[1], feed.bounds[0]],
      [feed.bounds[3], feed.bounds[2]],
    ]}
  >
    {#each stops as stop (stop.stopId)}
      <DefaultMarker lngLat={[stop.lon, stop.lat]} class="marker">
        <RouteChooser
          stop={stop}
          feed={feed.code}
          selected={selected}
          disabled={disabled}
          onRouteSelected={(route: RouteAtStop) => selected.push(route)}
          onRouteDeselected={(route: RouteAtStop) => selected.splice(selected.findIndex((r) => r.routeId === route.routeId && r.stopId === route.stopId), 1)}
        />
      </DefaultMarker>
    {/each}
  </MapLibre>
</div>

<style>
  h2 {
    margin-top: 0;
    margin-bottom: 0.5em;
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
</style>