<script lang="ts">
  import { Pencil } from "@lucide/svelte"
  import { Button } from "../../ui/button"
  import { Label } from "../../ui/label"
  import * as RadioGroup from "../../ui/radio-group"
  import RouteStopChooser from "./RouteStopChooser.svelte"
  import { config, type RouteAtStop } from "$lib/state"
  import { scale } from "svelte/transition"
  import { pluralize } from "$lib/utils"

  let showRouteEditor = $state(false)

  let routesCount = $derived(new Set($config.routes.map((route) => route.routeId)).size)
  let stopsCount = $derived(new Set($config.routes.map((route) => route.stopId)).size)

  function saveRoutes(routes: RouteAtStop[], timeOffsets: Record<string, number>) {
    $config.routes = routes
    $config.stopTimeOffsets = timeOffsets
    $config.routeStyles = $config.routeStyles.filter((style) =>
      routes.some((route) => route.routeId === style.routeId)
    )
    showRouteEditor = false
  }
</script>

{#if showRouteEditor}
  <div
    class="fixed left-0 top-0 z-50 h-full w-full bg-background"
    transition:scale={{ duration: 300, start: 0.9 }}
  >
    <RouteStopChooser onsave={saveRoutes} config={$config} />
  </div>
{/if}

<div class="mb-5">
  <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">Selected Routes</h4>
  <div class="mb-2 text-sm text-muted-foreground">
    Displaying {routesCount}
    {pluralize(routesCount, "route", "routes")} at {stopsCount}
    {pluralize(stopsCount, "stop", "stops")}.
  </div>

  <Button size="sm" variant="secondary" onclick={() => (showRouteEditor = true)}>
    <Pencil />
    Edit routes
  </Button>
</div>

<div class="mb-5">
  <h4 class="mb-2 scroll-m-20 text-xl font-semibold tracking-tight">Time Display</h4>

  <RadioGroup.Root bind:value={$config.timeDisplay}>
    <div class="flex items-center space-x-2">
      <RadioGroup.Item value="arrival" id="arrival" />
      <Label for="arrival">Arrival time</Label>
    </div>
    <div class="flex items-center space-x-2">
      <RadioGroup.Item value="departure" id="departure" />
      <Label for="departure">Departure time</Label>
    </div>
  </RadioGroup.Root>
</div>

<div class="mb-5">
  <h4 class="mb-2 scroll-m-20 text-xl font-semibold tracking-tight">Time Units</h4>

  <RadioGroup.Root bind:value={$config.timeUnits}>
    <div class="flex items-center space-x-2">
      <RadioGroup.Item value="long" id="long" />
      <Label for="long">Long (e.g., "5min" / "1h15m")</Label>
    </div>
    <div class="flex items-center space-x-2">
      <RadioGroup.Item value="short" id="short" />
      <Label for="short">Short (e.g., "5m" / "1h15m")</Label>
    </div>
    <div class="flex items-center space-x-2">
      <RadioGroup.Item value="none" id="none" />
      <Label for="none">None (e.g., "5" / "1:15")</Label>
    </div>
  </RadioGroup.Root>
</div>

<div class="mb-5">
  <h4 class="mb-2 scroll-m-20 text-xl font-semibold tracking-tight">Schedule Mode</h4>

  <RadioGroup.Root bind:value={$config.listMode}>
    <div class="flex items-center space-x-2">
      <RadioGroup.Item value="sequential" id="sequential" />
      <Label for="sequential">Show {$config.timeDisplay}s from all routes sequentially</Label>
    </div>
    <div class="flex items-center space-x-2">
      <RadioGroup.Item value="nextPerRoute" id="nextPerRoute" />
      <Label for="nextPerRoute">Show only the next {$config.timeDisplay} for each route</Label>
    </div>
  </RadioGroup.Root>
</div>

<div class="mb-5">
  <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">Headsign Overflow</h4>
  <div class="mb-2 text-sm text-muted-foreground">
    Change how headsign text is displayed when it exceeds the available space.
  </div>

  <RadioGroup.Root bind:value={$config.headsignOverflow}>
    <div class="flex items-center space-x-2">
      <RadioGroup.Item value="hidden" id="hidden" />
      <Label for="hidden">Hidden &mdash; excess text will be cut off</Label>
    </div>
    <div class="flex items-center space-x-2">
      <RadioGroup.Item value="scroll" id="scroll" />
      <Label for="scroll"
        >Scroll &mdash; headsigns will scroll back and forth to reveal all text</Label
      >
    </div>
  </RadioGroup.Root>
</div>
