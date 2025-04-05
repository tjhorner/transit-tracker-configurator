<script lang="ts">
  import { DefaultMarker } from "svelte-maplibre"
  import { MapLibre, type Map as MapLibreMap } from "svelte-maplibre"
  import RouteChooser from "./RouteChooser.svelte"
  import CountdownPreview from "./CountdownPreview.svelte"
  import type { ConfigState, RouteAtStop } from "$lib/state"
  import debounce from "p-debounce"
  import { apiBaseUrl } from "$lib/config"
  import * as Card from "$lib/components/ui/card"
  import { Button } from "$lib/components/ui/button"
  import { Checkbox } from "$lib/components/ui/checkbox"
  import { Separator } from "./ui/separator"
  import { Label } from "$lib/components/ui/label"
  import { Input } from "./ui/input"
  import { mode as appearanceMode } from "mode-watcher"

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

  let mapStyle = $derived($appearanceMode === "dark" ? "dark-matter-gl" : "positron-gl")

  let needsZoomIn = $state(true)

  const selectionGroupedByStop = $derived(Map.groupBy(selected, (r) => r.stopId).values())

  async function getStops(bounds: number[][]) {
    if (abortController) {
      abortController.abort()
    }

    abortController = new AbortController()
    const response = await fetch(
      `${apiBaseUrl}/stops/within/${bounds[0][0]},${bounds[0][1]},${bounds[1][0]},${bounds[1][1]}`,
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

<div class="flex h-full w-full flex-col-reverse md:flex-row">
  <div class="flex w-full flex-col overflow-y-auto p-4 md:w-3/5">
    <div class="mb-4">
      <h2
        class="mb-2 mt-0 scroll-m-20 text-3xl font-semibold tracking-tight transition-colors first:mt-0"
      >
        Selected Routes
      </h2>

      <p class="leading-6 [&:not(:first-child)]:mt-2">
        Find the stop you are interested in on the map then select the routes you want to track on
        your Transit Tracker.
      </p>

      <p class="leading-6 [&:not(:first-child)]:mt-2">
        You can also optionally set a travel time for each stop; this will adjust the countdown time
        to account for the time it takes for you to get to the stop. For example, if it takes you 5
        minutes to walk to a stop, set the travel time to 5 minutes.
      </p>

      <p class="leading-6 [&:not(:first-child)]:mt-2">You can select up to five routes.</p>
    </div>

    {#each selectionGroupedByStop as routes}
      <Card.Root class="mb-3">
        <Card.Header class="px-4 pb-2 pt-3">
          <Card.Title class="text-lg">
            {routes[0].stopName}
            {#if routes[0].stopCode}
              ({routes[0].stopCode})
            {/if}
          </Card.Title>
        </Card.Header>
        <Card.Content class="p-4 pt-0">
          <div class="flex flex-col gap-2">
            {#if timeOffsets[routes[0].stopId]}
              <Label>Travel time in minutes</Label>
              <Input
                type="number"
                value={timeOffsets[routes[0].stopId]}
                class="h-8 px-2 py-1"
                oninput={(e) => (timeOffsets[routes[0].stopId] = parseInt(e.currentTarget.value))}
              />
            {:else}
              <Button
                variant="secondary"
                size="xs"
                onclick={() => (timeOffsets[routes[0].stopId] = 1)}>Set travel time</Button
              >
            {/if}
          </div>

          <Separator class="my-4" />

          {#each routes as route (route.routeId + route.stopId)}
            <div class="selected-route [&:not(:last-child)]:mb-2">
              <label class="flex cursor-pointer items-start gap-2">
                <Checkbox
                  checked
                  onCheckedChange={(e) =>
                    selected.splice(
                      selected.findIndex(
                        (r) => r.routeId === route.routeId && r.stopId === route.stopId
                      ),
                      1
                    )}
                />
                <div class="-mt-[3px]">
                  <strong>Route: {route.routeName}</strong>
                  {#each route.headsigns as headsign}
                    <div class="headsign"><strong>→</strong> {headsign}</div>
                  {/each}
                </div>
              </label>
            </div>
          {/each}
        </Card.Content>
      </Card.Root>
    {/each}

    <div class="mt-4 flex flex-grow flex-col justify-end gap-3">
      {#if selected.length > 0}
        <div>
          <h3 class="mb-2 scroll-m-20 text-2xl font-semibold tracking-tight">Countdown Preview</h3>
          <Card.Root>
            <Card.Content class="p-3">
              <CountdownPreview routes={selected} {timeOffsets} />
            </Card.Content>
          </Card.Root>
        </div>
      {/if}

      <Button size="lg" onclick={() => onsave?.(selected, timeOffsets)}>Save</Button>
    </div>
  </div>

  <MapLibre
    bind:map
    style={`https://basemaps.cartocdn.com/gl/${mapStyle}-style/style.json`}
    standardControls
    class="h-full w-full"
    onmoveend={onMapMoved}
    bounds={[-133.066406,18.812718,-59.809570,53.304621]}
  >
    {#each stops as stop (stop.stopId)}
      <DefaultMarker lngLat={[stop.lon, stop.lat]} class="cursor-pointer">
        <RouteChooser
          {stop}
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
      <div
        class="pointer-events-none absolute z-[999] flex h-full w-full items-center justify-center text-center"
      >
        <p class="rounded-lg bg-black/60 p-4 text-4xl text-white">Zoom in to see stops</p>
      </div>
    {/if}
  </MapLibre>
</div>
