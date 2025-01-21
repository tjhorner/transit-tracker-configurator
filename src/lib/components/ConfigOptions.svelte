<script lang="ts">
	import { pushConfigToDevice } from "$lib/device"
	import { type ConfigState, config } from "$lib/state"

  interface Props {
    configState: ConfigState
  }

  async function pushConfig() {
    try {
      await pushConfigToDevice($config, $config.deviceBaseUrl!)
    } catch(e: any) {
      console.error(e)
      alert("Failed to push config. Make sure you are on the same network as the device.")
    }
  }

  let { configState }: Props = $props()
</script>

<div class="options">
  <h1>Countdown Display Configurator</h1>

  <a href="/flash">
    <strong>Set up device →</strong><br>
    Flash firmware or connect to a different device.
  </a>

  <hr>

  <a href="/configure/feed">
    <strong>Select feed →</strong><br>
    {#if configState.feed}
      {configState.feed.name}
    {:else}
      Choose the feed to source routes from.
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

    {#if configState.deviceBaseUrl}
      <button onclick={pushConfig}>
        <strong>Save config →</strong><br>
        Push the new configuration to your device.
      </button>
    {/if}

    <a href="/configure/yaml">
      <strong>Generate YAML →</strong><br>
      Copy the YAML configuration for ESPHome.
    </a>
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