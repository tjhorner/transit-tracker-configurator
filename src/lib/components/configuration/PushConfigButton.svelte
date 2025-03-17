<script lang="ts">
  import { pushConfigToDevice } from "$lib/device"
  import { config } from "$lib/state"
  import { toast } from "svelte-sonner"
  import { Button } from "../ui/button"
  import { LoaderCircle, Upload } from "@lucide/svelte"
  import { goto } from "$app/navigation"

  let pushing = $state(false)

  async function pushConfig() {
    pushing = true
    try {
      const results = await pushConfigToDevice($config, $config.deviceBaseUrl!)

      const errors = results.filter(result => !result.ok)
      if (errors.length > 0) {
        toast.warning("Unable to push full config", {
          description: "Your Transit Tracker may need a firmware update.",
          duration: 10000,
          action: {
            label: "Update Firmware",
            onClick() {
              goto("/update")
            }
          }
        })
      } else {
        toast.success("Configuration pushed successfully")
      }
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
