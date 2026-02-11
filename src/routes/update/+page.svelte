<script lang="ts">
  import { goto } from "$app/navigation"
  import FirmwareFlasher from "$lib/components/setup/FirmwareFlasher.svelte"
  import TopNav from "$lib/components/TopNav.svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { ESPHomeRpcClient, type DeviceInfo } from "$lib/esphome-rpc"
  import { getSerialPort } from "$lib/utils"
  import { CheckCircle, CircleCheck, Clipboard } from "@lucide/svelte"
  import { onMount } from "svelte"
  import { toast } from "svelte-sonner"

  let checking = $state(false)

  let currentFirmwareVersion: string | null = $state(null)
  let latestFirmwareVersion: string | null = $state(null)

  let port: SerialPort | null = $state(null)
  let rpcClient: ESPHomeRpcClient | null = $state(null)

  async function getLatestVersion() {
    const resp = await fetch("https://transit-tracker.eastsideurbanism.org/firmware/manifest.json")
    if (!resp.ok) {
      throw new Error(`Failed to fetch firmware manifest: ${resp.status} ${resp.statusText}`)
    }

    const manifest = await resp.json()
    return manifest.version
  }

  async function getCurrentVersion() {
    port = await getSerialPort()

    try {
      await port.open({ baudRate: 115200 })
    } catch (e: any) {
      if (e.message.includes("Failed to open serial port")) {
        alert(
          "Couldn't open serial port. Please close all other browser tabs or applications that might be connecting to the device."
        )
        return
      }

      if (!e.message.endsWith("already open.")) {
        alert(`Unable to connect to Transit Tracker. Error: ${e.message}`)
        return
      }
    }

    rpcClient = new ESPHomeRpcClient(port)

    try {
      await rpcClient.connect()
      
      rpcClient.addEventListener("disconnect", () => {
        rpcClient = null
      })

      const deviceInfo = await rpcClient.getDeviceInfo()
      return deviceInfo.project_version
    } catch (error: any) {
      alert(`Your Transit Tracker isn't responding properly. Please try pressing the RESET button on the board and try again.\n\nError: ${error.message || error}`)
      await rpcClient.disconnect()
      rpcClient = null
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
    } catch (e: any) {
      alert(`Failed to check for updates. Error: ${e.message}`)
    } finally {
      checking = false
      await rpcClient?.disconnect()
      await port?.close()
    }
  }

  onMount(() => {
    return async () => {
      await rpcClient?.disconnect()
      await port?.close()
    }
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
          <strong>Your Transit Tracker is running the latest firmware: {latestFirmwareVersion}</strong>
        </div>
      {:else}
        <h2 class="text-center font-bold text-xl">Update available!</h2>

        <p class="mb-4 mt-2 leading-6 text-center text-lg font-medium">
          {currentFirmwareVersion}
          <span class="mx-2 text-gray-400">→</span>
          {latestFirmwareVersion}
        </p>

        <Button variant="secondary" class="w-full mb-3" href="https://github.com/EastsideUrbanism/transit-tracker/releases/tag/{latestFirmwareVersion}" target="_blank">
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
