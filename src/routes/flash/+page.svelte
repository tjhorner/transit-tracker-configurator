<script lang="ts">
	import { goto } from "$app/navigation"
	import FlashButton from "$lib/components/FlashButton.svelte"
	import { config } from "$lib/state"
  import { ImprovSerial } from "improv-wifi-serial-sdk/dist/serial"

  let loading = $state(false)

  async function getDeviceBaseUrl(): Promise<string> {
    const port = await navigator.serial.requestPort()
    await port.open({ baudRate: 115200 })

    const improv = new ImprovSerial(port, console)
    await improv.initialize()

    if (!improv.nextUrl) {
      throw new Error("Device did not report URL")
    }

    await improv.close()
    await port.close()

    return improv.nextUrl
  }

  async function saveDeviceBaseUrl() {
    loading = true
    try {
      const baseUrl = await getDeviceBaseUrl()
      $config.deviceBaseUrl = baseUrl
      goto("/configure")
    } catch (e) {
      console.error(e)
      alert("Failed to connect to device")
    } finally {
      loading = false
    }
  }
</script>

<div class="layout">
  <h1>Flash Firmware</h1>

  <p>
    From this page, you can flash the pre-built firmware for your countdown clock and
    connect it to your Wi-Fi network. Plug in the board and press Connect to get started.
  </p>

  <p>
    Once flashed, press the Next button to configure the routes you want to use.
  </p>

  {#if loading}
    <p>Connecting to device...</p>
  {:else}
    <div class="buttons">
      <FlashButton manifest="/firmware/manifest.json" />
      <button onclick={saveDeviceBaseUrl}>Next: Configuration</button>
    </div>
  {/if}
</div>

<style>
  .layout {
    max-width: 600px;
  }

  p {
    line-height: 1.5;
  }

  .buttons {
    display: flex;
    width: 100%;
    justify-content: space-between;
  }
</style>