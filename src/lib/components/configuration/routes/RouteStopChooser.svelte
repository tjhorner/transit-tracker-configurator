<script lang="ts">
  import { DefaultMarker, FillLayer, GeoJSON, LineLayer } from "svelte-maplibre"
  import { MapLibre, type Map as MapLibreMap } from "svelte-maplibre"
  import RouteChooser from "./RouteChooser.svelte"
  import CountdownPreview from "./CountdownPreview.svelte"
  import type { ConfigState, RouteAtStop } from "$lib/state"
  import debounce from "p-debounce"
  import * as Card from "$lib/components/ui/card"
  import { Button } from "$lib/components/ui/button"
  import { Checkbox } from "$lib/components/ui/checkbox"
  import { Separator } from "../../ui/separator"
  import { Label } from "$lib/components/ui/label"
  import { Input } from "../../ui/input"
  import { mode as appearanceMode } from "mode-watcher"
  import type { FeatureCollection } from "geojson"
  import * as turf from "@turf/turf"
  import { api, type Stop } from "$lib/api"
  import { onMount } from "svelte"
  import { LoaderCircle, TriangleAlert } from "@lucide/svelte"
  import * as Tooltip from "$lib/components/ui/tooltip"
    import RouteChooserPopup from "./RouteChooserPopup.svelte"

  interface Props {
    config: ConfigState
    onsave?: (routes: RouteAtStop[], timeOffsets: Record<string, number>) => void
  }

  let { config, onsave }: Props = $props()

  let serviceAreas: FeatureCollection = $state({
    type: "FeatureCollection",
    features: []
  })

  let selected = $state(config.routes)
  let timeOffsets = $state(config.stopTimeOffsets)
  let disabled = $derived(selected.length >= 25)
  let stopGroups: Stop[][] = $state([])
  let abortController: AbortController | null = $state(null)
  let map: MapLibreMap | undefined = $state()

  let mapStyle = $derived($appearanceMode === "dark" ? "dark-matter-gl" : "positron-gl")

  let needsZoomIn = $state(true)

  const selectionGroupedByStop = $derived(Map.groupBy(selected, (r) => r.stopId).values())

  async function getServiceAreas() {
    serviceAreas = await api.getServiceAreas()

    const bbox = turf.bbox(serviceAreas)
    map?.fitBounds(bbox as [number, number, number, number], {
      animate: false,
      padding: 20,
      maxZoom: 15
    })
  }

  function groupVeryCloseStops(stops: Stop[]) {
    const grouped: Stop[][] = []

    for (const stop of stops) {
      const existingGroup = grouped.find((group) => {
        const dist = turf.distance(
          turf.point([stop.lon, stop.lat]),
          turf.point([group[0].lon, group[0].lat]),
          { units: "meters" }
        )
        return dist < 15
      })

      if (existingGroup) {
        existingGroup.push(stop)
      } else {
        grouped.push([stop])
      }
    }

    return grouped
  }

  async function getStops(bounds: number[][]) {
    if (abortController) {
      abortController.abort()
    }

    abortController = new AbortController()
    const response = await api.getStopsWithin(bounds)
    const groupedStops = groupVeryCloseStops(response)

    abortController = null
    return groupedStops
  }

  async function _onMapMoved({ target }: { target: MapLibreMap }) {
    if (target.getZoom() < 15) {
      needsZoomIn = true
      stopGroups = []
      return
    }

    needsZoomIn = false

    const bounds = target.getBounds()
    stopGroups = await getStops(bounds.toArray())
  }

  function colorIsDark(color: string) {
    const r = parseInt(color.slice(0, 2), 16)
    const g = parseInt(color.slice(2, 4), 16)
    const b = parseInt(color.slice(4, 6), 16)
    return Math.max(r, g, b) < 80
  }

  const onMapMoved = debounce(_onMapMoved, 1000)

  onMount(() => {
    getServiceAreas()
  })
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
            {@const hasDarkColor = route.color ? colorIsDark(route.color) : false}
            <div class="selected-route [&:not(:last-child)]:mb-2">
              <label class="flex cursor-pointer items-start gap-2">
                <Checkbox
                  checked
                  onCheckedChange={() =>
                    selected.splice(
                      selected.findIndex(
                        (r) => r.routeId === route.routeId && r.stopId === route.stopId
                      ),
                      1
                    )}
                />
                <div class="-mt-[3px]">
                  {#if hasDarkColor}
                    <Tooltip.Provider>
                      <Tooltip.Root delayDuration={0}>
                        <Tooltip.Trigger>
                          <TriangleAlert
                            class="relative bottom-[2px] inline text-orange-500 dark:text-yellow-500"
                            size={18}
                          />
                        </Tooltip.Trigger>
                        <Tooltip.Content>
                          <p class="max-w-64">
                            This route uses a color that might not show up very well on your Transit
                            Tracker. You can change the color of this route in the <strong
                              >Customize</strong
                            > tab after saving.
                          </p>
                        </Tooltip.Content>
                      </Tooltip.Root>
                    </Tooltip.Provider>
                  {/if}
                  <strong>
                    Route: {route.routeName}
                  </strong>
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
    bounds={[-133.066406, 18.812718, -59.80957, 53.304621]}
  >
    <GeoJSON id="service-areas" data={serviceAreas} maxzoom={15}>
      <FillLayer
        id="service-areas-fill"
        paint={{
          "fill-color": "#51c551",
          "fill-opacity": ["interpolate", ["linear"], ["zoom"], 0, 0.5, 10, 0.5, 13, 0]
        }}
      />

      <LineLayer
        id="service-areas-line"
        paint={{
          "line-color": "#51c551",
          "line-opacity": ["interpolate", ["linear"], ["zoom"], 0, 1, 10, 0.8, 13, 0],
          "line-width": 2
        }}
      />
    </GeoJSON>

    {#each stopGroups as stops (stops[0].stopId)}
      <DefaultMarker lngLat={[stops[0].lon, stops[0].lat]} class="cursor-pointer">
        <RouteChooserPopup
          {stops}
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

    {#if !needsZoomIn && abortController}
      <div
        class="pointer-events-none absolute z-[999] flex h-full w-full items-center justify-center text-center"
      >
        <p class="rounded-lg bg-black/60 p-4 text-4xl text-white">
          <LoaderCircle class="animate-spin" />
        </p>
      </div>
    {/if}

    {#if !needsZoomIn && !abortController && stopGroups.length === 0}
      <div
        class="pointer-events-none absolute z-[999] flex h-full w-full items-center justify-center text-center"
      >
        <p class="flex flex-col rounded-lg bg-black/60 p-3 text-2xl text-white">
          No stops found
          <Button
            class="pointer-events-auto mt-1 text-blue-400"
            variant="link"
            size="small"
            href="https://transit-tracker.eastsideurbanism.org/docs/user-manual/faq/agency-support"
            target="_blank"
          >
            Which agencies are supported?
          </Button>
        </p>
      </div>
    {/if}
  </MapLibre>
</div>
