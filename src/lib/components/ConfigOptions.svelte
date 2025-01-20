<script lang="ts">
	import { pushConfigToDevice } from "$lib/device"
	import { type ConfigState, config } from "$lib/state"

  interface Props {
    configState: ConfigState
  }

  function pushConfig() {
    pushConfigToDevice($config, $config.deviceBaseUrl!)
  }

  let { configState }: Props = $props()
</script>

<div class="options">
  <h1>Countdown Display Configurator</h1>

  <a href="/configure/feed">
    <strong>Select feed →</strong><br>
    {#if configState.feed}
      {configState.feed.name}
    {:else}
      Choose the feed to display.
    {/if}
  </a>

  {#if configState.feed}
    <a href="/configure/routes">
      <strong>Select routes →</strong><br>
      {#if configState.routes.length > 0}
        {configState.routes.length} routes selected
      {:else}
        Choose the routes to display on your clock.
      {/if}
    </a>

    <a href="/configure/customize">
      <strong>Customize styles →</strong><br>
      Abbreviate headsigns and customize the names of routes.
    </a>

    <hr>

    <button onclick={pushConfig}>
      <strong>Save config →</strong><br>
      Push the new configuration to your device.
    </button>
  {/if}
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
    background: none;
    color: inherit;
    border: none;
    padding: 0;
    font: inherit;
    cursor: pointer;
    outline: inherit;
    text-align: left;
  }

  .options a, .options button {
    display: block;
    width: 100%;
    background: #ececec;
    border-radius: 10px;
    padding: 1em;
    color: inherit;
    text-decoration: none;
  }

  .options a:hover, .options button:hover {
    background: #ddd;
  }

  .options a:active, .options button:active {
    background: #ccc;
  }

  hr {
    width: 100%;
    border: none;
    border-top: 1px solid #ccc;
  }
</style>