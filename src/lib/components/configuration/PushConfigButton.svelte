<script lang="ts">
  import { pushConfigToDevice } from "$lib/device"
  import { config } from "$lib/state"
  import { toast } from "svelte-sonner"
  import { Button } from "../ui/button"
  import { LoaderCircle, Upload } from "@lucide/svelte"

  let pushing = $state(false)

  async function pushConfig() {
    pushing = true
    try {
      await pushConfigToDevice($config, $config.deviceBaseUrl!)
      toast.success("Configuration updated on device")
    } catch (e: any) {
      console.error(e)
      toast.error("Failed to push config", {
        description: `Make sure you are on the same network as the device.\n\n(Error: ${e.message})`,
        duration: 10000
      })
    } finally {
      pushing = false
    }
  }
</script>

<Button class="flex-grow" onclick={pushConfig} disabled={pushing}>
  {#if pushing}
    <LoaderCircle class="animate-spin" />
    Saving configuration...
  {:else}
    <Upload /> Save configuration to device
  {/if}
</Button>
