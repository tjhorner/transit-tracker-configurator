<script lang="ts">
	import { goto } from "$app/navigation"
	import FeedSelector from "$lib/components/FeedSelector.svelte"
	import type { Feed } from "$lib/state"
  import { config } from "$lib/state"

  function saveFeed(feed: Feed) {
    $config.feed = feed
    $config.routes = []
    $config.routeStyles = []
    goto("/configure")
  }
</script>

<FeedSelector onsave={saveFeed} configState={$config} />
