<script lang="ts">
	import { apiBaseUrl } from "$lib/config"
	import type { ConfigState, Feed } from "$lib/state"
	import { onMount } from "svelte"

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

<div class="options">
  <h1>Available Feeds</h1>

  {#each feeds as feed}
    <button
      onclick={() => onsave(feed)}
      class:selected={configState.feed?.code === feed.code}
    >
      <strong>{feed.name}</strong><br>
      {feed.description ?? ""}
    </button>
  {/each}
</div>

<style>
  .options {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1em;
  }

  h1 {
    margin: 0;
  }

  .options button {
    display: block;
    width: 100%;
    max-width: 500px;
    background: #ececec;
    border-radius: 10px;
    padding: 1em;
    color: inherit;
    text-decoration: none;
    border: none;
    cursor: pointer;
    text-align: left;
    font-size: 1em;
  }

  .options button:hover {
    background: #ddd;
  }

  .options button:active, .options button.selected {
    background: #ccc;
  }
</style>