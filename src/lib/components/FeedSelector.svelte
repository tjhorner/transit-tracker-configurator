<script lang="ts">
  import { apiBaseUrl } from "$lib/config"
  import type { ConfigState, Feed } from "$lib/state"
  import { onMount } from "svelte"
  import VerticalButtons from "./ui/VerticalButtons.svelte"

  interface Props {
    configState: ConfigState
    onsave: (feed: Feed) => void
  }

  let { configState, onsave }: Props = $props()

  let feeds: Feed[] = $state([])

  async function getFeeds() {
    const response = await fetch(`${apiBaseUrl}/feeds`)
    feeds = await response.json()
  }

  onMount(() => {
    getFeeds()
  })
</script>

<VerticalButtons>
  <h1>Available Feeds</h1>

  {#each feeds as feed}
    <button onclick={() => onsave(feed)} class:selected={configState.feed?.code === feed.code}>
      <strong>{feed.name}</strong><br />
      {feed.description ?? ""}
    </button>
  {/each}
</VerticalButtons>
