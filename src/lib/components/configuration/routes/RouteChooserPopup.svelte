<script lang="ts">
  import type { Stop } from "$lib/api"
  import type { RouteAtStop } from "$lib/state"
  import { Popup } from "svelte-maplibre"
  import RouteChooser from "./RouteChooser.svelte"

  interface Props {
    stops: Stop[]
    selected: RouteAtStop[]
    onRouteSelected: (route: RouteAtStop) => void
    onRouteDeselected: (route: RouteAtStop) => void
    disabled?: boolean
  }

  const { stops, selected, onRouteSelected, onRouteDeselected, disabled = false }: Props = $props()

  let shown = $state(false)
</script>

<Popup bind:open={shown} closeOnMove popupClass="p-0">
  <div class="route-chooser">
    {#each stops as stop (stop.stopId)}
      <RouteChooser
        {shown}
        {stop}
        {selected}
        {disabled}
        onRouteSelected={onRouteSelected}
        onRouteDeselected={onRouteDeselected}
      />
    {/each}
  </div>
</Popup>

<style>
  .route-chooser {
    max-height: 50vh;
    overflow-y: auto;
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