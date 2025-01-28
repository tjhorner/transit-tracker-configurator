<script lang="ts">
  import { config } from "$lib/state"
  import * as YAML from "json-to-pretty-yaml"

  function generateYaml() {
    const distinctColorsUsed = new Set($config.routeStyles.map(s => s.color.replaceAll("#", "")))
    const routesGroupedByStop = Map.groupBy($config.routes, (r) => r.stopId).values()

    const generatedConfig = {
      ...(distinctColorsUsed.size > 0 ? {
        "color": distinctColorsUsed.values().map(c => ({
          "id": `c_${c}`,
          "hex": c
        })).toArray()
      } : {}),
      "transit_tracker": {
        "base_url": $config.apiBaseUrl,
        "feed_code": $config.feed?.code,
        "stops": routesGroupedByStop.map(routes => ({
          "stop_id": routes[0].stopId,
          "time_offset": $config.stopTimeOffsets[routes[0].stopId] ? `-${$config.stopTimeOffsets[routes[0].stopId]}min` : undefined,
          "routes": routes.map(r => r.routeId)
        })).toArray(),
        "styles": $config.routeStyles.map(s => ({
          "route_id": s.routeId,
          "name": s.name,
          "color": `c_${s.color.replaceAll("#", "")}`
        })),
        "abbreviations": $config.abbreviations.map(a => ({
          "from": a.from,
          "to": a.to,
        }))
      }
    }

    return YAML.stringify(generatedConfig)
  }

  function copyYaml() {
    navigator.clipboard.writeText(generateYaml())
  }
</script>

<div>
  <a href="/configure">← Back</a>
  <pre>{generateYaml()}</pre>
  <button onclick={copyYaml}>Copy</button>
</div>

<style>
  pre {
    white-space: pre-wrap;
  }
</style>