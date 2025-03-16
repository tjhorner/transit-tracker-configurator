<script lang="ts">
  import { config, type Abbreviation, type RouteStyle } from "$lib/state"
  import AbbreviationOptions from "../AbbreviationOptions.svelte"
  import RouteStyleOptions from "../RouteStyleOptions.svelte"

  function saveAbbreviations(abbreviations: Abbreviation[]) {
    $config.abbreviations = abbreviations
  }

  function saveRouteStyles(routeStyles: RouteStyle[]) {
    $config.routeStyles = routeStyles
  }
</script>

<div class="mb-5">
  <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">Abbreviations</h4>
  <div class="mb-2 flex flex-col text-sm text-muted-foreground">
    Shorten route headsigns so they fit better on the screen. For example, you can abbreviate
    "Transit Center" to "TC".
  </div>

  <AbbreviationOptions configState={$config} onsave={saveAbbreviations} />
</div>

<div class="mb-5">
  <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">Route Styles</h4>
  <div class="mb-2 flex flex-col text-sm text-muted-foreground">
    Customize the names and colors of routes.
  </div>

  <RouteStyleOptions configState={$config} onsave={saveRouteStyles} />
</div>
