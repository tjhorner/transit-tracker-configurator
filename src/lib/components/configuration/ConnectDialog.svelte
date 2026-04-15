<script lang="ts">
  import { Label } from "$lib/components/ui/label"
  import * as RadioGroup from "$lib/components/ui/radio-group"
  import { Cable, Usb, Wifi } from "@lucide/svelte"
  import { Button } from "../ui/button"
  import { Input } from "../ui/input"
  import type { DeviceConnection } from "$lib/state"

  interface Props {
    onSuccess?: (deviceConnection: DeviceConnection) => void
  }

  let { onSuccess }: Props = $props()

  let connectionType: "usb" | "network" = $state("usb")
  let ipAddress = $state("")
  let connecting = $state(false)

  function connectUsb() {
    onSuccess?.({
      type: "usb"
    })
  }

  const browserSupportsWebSerial = "serial" in navigator

  async function setIpAddress() {
    const baseUrl = new URL(`http://${ipAddress}`)
    onSuccess?.({
      type: "network",
      baseUrl: baseUrl.origin
    })
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
    <RadioGroup.Item value="network" id="network" class="peer sr-only" />
    <Label
      for="network"
      class="flex flex-col items-center justify-between rounded-md border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary [&:has([data-state=checked])]:border-primary"
    >
      <Wifi class="mb-3 h-6 w-6" />
      Connect via Network
    </Label>
  </div>
</RadioGroup.Root>

{#if connectionType === "usb"}
  {#if browserSupportsWebSerial}
    <Button class="flex-grow" disabled={connecting} onclick={connectUsb}>
      <Cable /> Connect via USB
    </Button>
  {:else}
    Your browser does not support connecting to devices via USB. Please use a Chromium-based browser
    like Google Chrome or Microsoft Edge, or connect to your Transit Tracker via the network.
  {/if}
{/if}

{#if connectionType === "network"}
  <div class="flex flex-col gap-2">
    <Label for="ip">IP address</Label>
    <Input placeholder="127.0.0.1" bind:value={ipAddress} name="ip" id="ip" />
  </div>

  <Button class="flex-grow" onclick={setIpAddress} disabled={!ipAddress || connecting}>
    <Cable /> Connect using IP
  </Button>
{/if}
