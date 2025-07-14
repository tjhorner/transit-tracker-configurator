<script lang="ts">
  import { pushConfigToDevice } from "$lib/device"
  import { config, deviceConnection } from "$lib/state"
  import { toast } from "svelte-sonner"
  import { Button } from "../ui/button"
  import { LoaderCircle, Upload } from "@lucide/svelte"
  import { goto } from "$app/navigation"
  import { UsbTransitTrackerDevice } from "$lib/device/usb-device"
  import type { TransitTrackerDevice } from "$lib/device/transit-tracker-device"
  import { NetworkTransitTrackerDevice } from "$lib/device/network-device"

  let pushing = $state(false)

  async function pushConfig() {
    let device: TransitTrackerDevice
    if ($deviceConnection.type === "usb") {
      device = UsbTransitTrackerDevice.instance
    } else if ($deviceConnection.type === "network") {
      device = new NetworkTransitTrackerDevice($deviceConnection.baseUrl!)
    } else {
      toast.error("No device connected")
      return
    }

    pushing = true
    try {
      const results = await pushConfigToDevice($config, device)
      await device.close?.()

      const errors = results.filter((result) => !result)
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
        toast.success("Configuration saved successfully")
      }
    } catch (e: any) {
      if (e.message.includes("No port selected")) {
        toast.info("Not seeing your Transit Tracker in the list?", {
          description: "Make sure your USB cable supports data transfer and not just charging.",
          duration: 10000,
        })
        return
      }

      if (e.name === "ConfigValidationError") {
        toast.error("Validation failed", {
          description: e.message,
          duration: 10000,
        })
        return
      }

      toast.error("Failed to save configuration", {
        description: e.message,
        duration: 10000
      })
    } finally {
      pushing = false
      await device.close?.()
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
