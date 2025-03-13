<script lang="ts">
	import { goto } from "$app/navigation"
	import VerticalButtons from "$lib/components/ui/VerticalButtons.svelte"
	import { getDeviceBaseUrl } from "$lib/device"
	import { config } from "$lib/state"

  async function saveDeviceBaseUrl() {
    try {
      const baseUrl = await getDeviceBaseUrl()
      $config.deviceBaseUrl = baseUrl
      goto("/configure")
    } catch (e: any) {
      console.error(e)
      const ip = prompt(`Failed to connect to device via USB. Please enter its IP address manually.\n\n(Error: ${e.message})`)
      if (ip) {
        $config.deviceBaseUrl = `http://${ip}`
        goto("/configure")
      }
    }
  }
</script>

<VerticalButtons>
  <h1>Welcome!</h1>

  <a href="/flash">
    <strong>Prepare new device →</strong><br>
    I am following the Transit Tracker build guide and want to flash the firmware.
  </a>

  <button onclick={saveDeviceBaseUrl}>
    <strong>Configure existing device →</strong><br>
    I have an existing Transit Tracker and want to configure it.
  </button>

  <a href="/configure">
    <strong>Advanced mode →</strong><br>
    I am an advanced user and want to generate YAML config.
  </a>
</VerticalButtons>