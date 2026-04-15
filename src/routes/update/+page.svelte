<script lang="ts">
  import { goto } from "$app/navigation"
  import FirmwareFlasher from "$lib/components/setup/FirmwareFlasher.svelte"
  import TopNav from "$lib/components/TopNav.svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { ESPHomeRpcClient, type DeviceInfo } from "$lib/esphome-rpc"
  import { getSerialContext } from "$lib/serial-context"
  import { CircleCheck, Clipboard } from "@lucide/svelte"
  import { onDestroy } from "svelte"
  import { toast } from "svelte-sonner"

  let checking = $state(false)

  let currentFirmwareVersion: string | null = $state(null)
  let latestFirmwareVersion: string | null = $state(null)

  let port: SerialPort | null = $state(null)
  let rpcClient: ESPHomeRpcClient | null = $state(null)

  const ctx = getSerialContext()

  async function getLatestVersion() {
    const resp = await fetch("https://transit-tracker.eastsideurbanism.org/firmware/manifest.json")
    if (!resp.ok) {
      throw new Error(`Failed to fetch firmware manifest: ${resp.status} ${resp.statusText}`)
    }

    const manifest = await resp.json()
    return manifest.version
  }

  async function getCurrentVersion() {
    port = await ctx.getOpenSerialPort()

    rpcClient = new ESPHomeRpcClient(port)

    try {
      await rpcClient.connect()

      rpcClient.addEventListener("disconnect", () => {
        rpcClient = null
      })

      const deviceInfo = await rpcClient.getDeviceInfo()
      return deviceInfo.project_version
    } catch (error: any) {
      alert(
        `Your Transit Tracker isn't responding properly. Please try pressing the RESET button on the board and try again.\n\nError: ${error.message || error}`
      )
    } finally {
      await rpcClient?.disconnect()
      rpcClient = null

      await port?.close()
      port = null
    }
  }

  async function checkForUpdates() {
    checking = true

    try {
      const [latestVersion, currentVersion] = await Promise.all([
        getLatestVersion(),
        getCurrentVersion()
      ])

      if (!currentVersion) {
        return
      }

      latestFirmwareVersion = latestVersion
      currentFirmwareVersion = currentVersion
    } finally {
      checking = false
    }
  }

  onDestroy(async () => {
    await rpcClient?.disconnect()
    await port?.close()
  })
</script>

<TopNav />

<Card.Root class="w-xl">
  <Card.Header>
    <Card.Title>Update firmware</Card.Title>
    <Card.Description>Get the latest features and bug fixes.</Card.Description>
  </Card.Header>
  <Card.Content>
    {#if currentFirmwareVersion && latestFirmwareVersion}
      {#if currentFirmwareVersion === latestFirmwareVersion}
        <div class="flex items-center gap-2 text-lg">
          <CircleCheck size={24} class="text-green-400" />
          <strong
            >Your Transit Tracker is running the latest firmware: {latestFirmwareVersion}</strong
          >
        </div>
      {:else}
        <h2 class="text-center text-xl font-bold">Update available!</h2>

        <p class="mb-4 mt-2 text-center text-lg font-medium leading-6">
          {currentFirmwareVersion}
          <span class="mx-2 text-gray-400">→</span>
          {latestFirmwareVersion}
        </p>

        <Button
          variant="secondary"
          class="mb-3 w-full"
          href="https://github.com/EastsideUrbanism/transit-tracker/releases/tag/{latestFirmwareVersion}"
          target="_blank"
        >
          <Clipboard /> View release notes
        </Button>

        <FirmwareFlasher
          file="https://transit-tracker.eastsideurbanism.org/firmware/firmware.bin"
          offset={0x10000}
          eraseFlash={false}
          bootButtonRequired={false}
          onSuccess={() => {
            toast.success("Firmware updated")
            goto("/")
          }}
        />
      {/if}
    {:else}
      <p class="mb-4 leading-6">
        Connect your Transit Tracker to this computer via USB and press the button below to check
        for updates.
      </p>

      <Button class="w-full" onclick={checkForUpdates} disabled={checking}>
        {checking ? "Checking for updates..." : "Check for updates"}
      </Button>
    {/if}
  </Card.Content>
</Card.Root>
