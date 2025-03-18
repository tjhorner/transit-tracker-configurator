<script lang="ts">
  import { Ban, Pencil } from "@lucide/svelte"
  import { Button } from "../ui/button"
  import { Label } from "../ui/label"
  import * as RadioGroup from "../ui/radio-group"
  import * as Select from "$lib/components/ui/select"
  import { api, type Feed } from "$lib/api"
  import { onMount } from "svelte"
  import RouteStopChooser from "../RouteStopChooser.svelte"
  import { config, type RouteAtStop } from "$lib/state"
  import { scale } from "svelte/transition"
  import { pluralize } from "$lib/utils"

  let feeds: Feed[] = $state([])
  let showRouteEditor = $state(false)

  let routesCount = $derived(new Set($config.routes.map((route) => route.routeId)).size)
  let stopsCount = $derived(new Set($config.routes.map((route) => route.stopId)).size)

  function saveRoutes(routes: RouteAtStop[], timeOffsets: Record<string, number>) {
    $config.routes = routes
    $config.stopTimeOffsets = timeOffsets
    $config.routeStyles = $config.routeStyles.filter(
      (style) => routes.some((route) => route.routeId === style.routeId)
    )
    showRouteEditor = false
  }

  function selectFeed(feedCode: string) {
    const feed = feeds.find((f) => f.code === feedCode)
    $config.routes = []
    $config.stopTimeOffsets = {}
    $config.abbreviations = []
    $config.routeStyles = []
    $config.feed = feed
  }

  onMount(async () => {
    feeds = await api.getFeeds()
  })
</script>

{#if showRouteEditor}
  <div
    class="fixed left-0 top-0 z-50 h-full w-full bg-background"
    transition:scale={{ duration: 300, start: 0.9 }}
  >
    <RouteStopChooser onsave={saveRoutes} config={$config} />
  </div>
{/if}

<div class="mb-5 flex flex-col">
  <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">Data Source</h4>
  <div class="mb-2 flex flex-col text-sm text-muted-foreground">
    Choose where your Transit Tracker gets its schedule data from.
    <strong class="text-yellow-600">Changing this will clear selected routes.</strong>
  </div>

  <Select.Root type="single" value={$config.feed?.code} onValueChange={selectFeed}>
    <Select.Trigger>{$config.feed?.name ?? "Select feed"}</Select.Trigger>
    <Select.Content>
      {#each feeds as feed}
        <Select.Item value={feed.code}>
          <div class="flex flex-col">
            {feed.name}
            <span class="text-xs text-muted-foreground">{feed.description}</span>
          </div>
        </Select.Item>
      {/each}
    </Select.Content>
  </Select.Root>
</div>

<div class="mb-5">
  <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">Selected Routes</h4>
  <div class="mb-2 text-sm text-muted-foreground">
    Displaying {routesCount}
    {pluralize(routesCount, "route", "routes")} at {stopsCount}
    {pluralize(stopsCount, "stop", "stops")}.
  </div>

  <Button
    size="sm"
    variant="secondary"
    onclick={() => (showRouteEditor = true)}
    disabled={$config.feed === undefined}
  >
    {#if $config.feed}
      <Pencil />
      Edit routes
    {:else}
      <Ban />
      Choose a data source above before selecting routes
    {/if}
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
