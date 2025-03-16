<script lang="ts">
  import { Label } from "$lib/components/ui/label"
  import * as RadioGroup from "$lib/components/ui/radio-group"
  import { getDeviceBaseUrl } from "$lib/device"
  import { Cable, Usb, Wifi } from "@lucide/svelte"
  import { Button } from "../ui/button"
  import { Input } from "../ui/input"

  interface Props {
    onSuccess?: (baseUrl: string) => void
  }

  let { onSuccess }: Props = $props()

  let connectionType: "usb" | "wifi" = $state("usb")
  let ipAddress = $state("")
  let connecting = $state(false)

  async function tryToConnect() {
    connecting = true

    try {
      const baseUrl = await getDeviceBaseUrl()
      onSuccess?.(baseUrl)
    } catch (e: any) {
      alert(`Unable to connect to Transit Tracker. Error: ${e.message}`)
    } finally {
      connecting = false
    }
  }

  async function setIpAddress() {
    const baseUrl = new URL(`http://${ipAddress}`)
    onSuccess?.(baseUrl.origin)
  }
</script>

<RadioGroup.Root bind:value={connectionType} class="grid grid-cols-2 gap-4">
  <div>
    <RadioGroup.Item value="usb" id="usb" class="peer sr-only" />
    <Label
      for="usb"
      class="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
    >
      <Usb class="mb-3 h-6 w-6" />
      Connect via USB
    </Label>
  </div>
  <div>
    <RadioGroup.Item value="wifi" id="wifi" class="peer sr-only" />
    <Label
      for="wifi"
      class="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
    >
      <Wifi class="mb-3 h-6 w-6" />
      Manually enter IP
    </Label>
  </div>
</RadioGroup.Root>

{#if connectionType === "usb"}
  <Button class="flex-grow" disabled={connecting} onclick={tryToConnect}>
    <Cable /> Connect via USB
  </Button>
{/if}

{#if connectionType === "wifi"}
  <div class="flex flex-col gap-2">
    <Label for="ip">IP address</Label>
    <Input placeholder="127.0.0.1" bind:value={ipAddress} name="ip" id="ip" />
  </div>

  <Button class="flex-grow" onclick={setIpAddress} disabled={!ipAddress || connecting}>
    <Cable /> Connect using IP
  </Button>
{/if}
