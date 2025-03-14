<script lang="ts">
	import { goto } from "$app/navigation"
	import RouteStopChooser from "$lib/components/RouteStopChooser.svelte"
	import { config, type RouteAtStop } from "$lib/state"

	function saveRoutes(routes: RouteAtStop[], timeOffsets: Record<string, number>) {
		$config.routes = routes
		$config.stopTimeOffsets = timeOffsets
		goto("/configure")
	}
</script>

<RouteStopChooser onsave={saveRoutes} config={$config} />
