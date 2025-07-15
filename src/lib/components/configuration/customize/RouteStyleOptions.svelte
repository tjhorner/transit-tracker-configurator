<script lang="ts">
  import { type ConfigState, type RouteAtStop, type RouteStyle } from "$lib/state"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { Card, CardContent } from "$lib/components/ui/card"
  import { Trash } from "@lucide/svelte"
  import { Select, SelectContent, SelectItem, SelectTrigger } from "$lib/components/ui/select"
  import ColorPicker from "../../ui/ColorPicker.svelte"

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

  function updateRouteStyle(style: RouteStyle, routeId: string) {
    const route = configState.routes.find((r) => r.routeId === routeId)
    style.routeId = routeId
    style.name = route?.routeName ?? ""
    style.color = route?.color ? `#${route.color}` : "#028e51"
  }

  function getPalette() {
    const colors = new Set<string>([
      ...styles
        .map((style) => style.color)
        .filter((color) => color !== undefined)
        .map((color) => color.toUpperCase()),
      ...configState.routes
        .map((route) => route.color)
        .filter((color) => color !== null)
        .map((color) => `#${color.toUpperCase()}`)
    ])

    return Array.from(colors)
  }
</script>

<Card>
  <CardContent class="space-y-4 p-3">
    {#each styles as style, idx}
      {@const route = configState.routes.find((route) => route.routeId === style.routeId)}
      <div class="flex items-center gap-2">
        <Select
          type="single"
          value={style.routeId}
          onValueChange={(value) => updateRouteStyle(style, value)}
        >
          <SelectTrigger class="flex-[0.4] overflow-clip">
            {#if route}
              {route.routeName}
            {:else}
              Select Route
            {/if}
          </SelectTrigger>
          <SelectContent>
            {#if route}
              <SelectItem value={style.routeId}>{route.routeName}</SelectItem>
            {/if}
            {#each availableRoutes as route}
              <SelectItem value={route.routeId}>{route.routeName}</SelectItem>
            {/each}
          </SelectContent>
        </Select>

        <span class="mx-1">→</span>

        <Input type="text" bind:value={style.name} placeholder="Custom route name" class="flex-1" />

        <ColorPicker bind:value={style.color} palette={getPalette()} />
        <!-- <Input type="color" bind:value={style.color} class="h-10 w-10 cursor-pointer p-0" /> -->

        <Button variant="destructive" class="px-3" onclick={() => styles.splice(idx, 1)}>
          <Trash />
        </Button>
      </div>
    {/each}

    <Button
      variant="secondary"
      class="w-full"
      size="sm"
      disabled={availableRoutes.length === 0}
      onclick={() =>
        styles.push({
          routeId: availableRoutes[0].routeId,
          color: availableRoutes[0]?.color ? `#${availableRoutes[0].color}` : "#028e51",
          name: availableRoutes[0].routeName
        })}
    >
      Add route style
    </Button>
  </CardContent>
</Card>
