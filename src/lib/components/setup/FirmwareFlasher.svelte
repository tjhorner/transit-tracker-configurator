<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { CircleCheck, Download } from "@lucide/svelte"
  import { Progress } from "$lib/components/ui/progress"
  import { Transport, ESPLoader } from "esptool-js"
  import { getSerialPort, sleep } from "$lib/utils"
  import * as Dialog from "$lib/components/ui/dialog"

  interface Props {
    eraseFlash?: boolean
    onSuccess: () => void
  }

  let { eraseFlash = false, onSuccess }: Props = $props()

  let flashing = $state(false)
  let progress = $state(0)
  let statusMessage = $state("")
  let success = $state(false)

  let showFlashingHelp = $state(false)

  async function beginFlash() {
    flashing = true
    progress = 0
    statusMessage = "Connecting to Transit Tracker..."

    try {
      let port: SerialPort
      try {
        port = await getSerialPort()
      } catch (e: any) {
        if ((e as DOMException).name === "NotFoundError") {
          showFlashingHelp = true
          return
        }

        throw e
      }

      const transport = new Transport(port)
      const esploader = new ESPLoader({
        transport,
        baudrate: 921600,
        romBaudrate: 115200,
        enableTracing: false
      })

      await esploader.main()

      if (eraseFlash) {
        statusMessage = "Erasing flash..."
        await esploader.eraseFlash()
      }

      statusMessage = "Downloading firmware..."

      const resp = await fetch("/firmware/firmware.bin")
      const reader = new FileReader()
      const blob = await resp.blob()

      const firmwareData = await new Promise<string>((resolve) => {
        reader.addEventListener("load", () => resolve(reader.result as string))
        reader.readAsBinaryString(blob)
      })

      statusMessage = "Uploading firmware..."

      await esploader.writeFlash({
        fileArray: [
          {
            address: 0x0,
            data: firmwareData
          }
        ],
        flashSize: "keep",
        flashMode: "keep",
        flashFreq: "keep",
        eraseAll: false,
        compress: true,
        reportProgress: (_, written, total) => {
          progress = Math.round((written / total) * 100)
        }
      })

      await resetTransport(transport)
      await transport.disconnect()

      success = true
      onSuccess()
    } catch (e: any) {
      console.error(e)
      success = false
    } finally {
      flashing = false
    }
  }

  async function resetTransport(transport: Transport) {
    await transport.device.setSignals({
      dataTerminalReady: false,
      requestToSend: true
    })

    await sleep(250)

    await transport.device.setSignals({
      dataTerminalReady: false,
      requestToSend: false
    })

    await sleep(250)
  }
</script>

<p class="mb-4 leading-6">
  Connect your Transit Tracker to this computer via USB and press the button below to flash the
  firmware.
</p>

<Button class="w-full" disabled={flashing || success} onclick={beginFlash}>
  {#if success}
    <CircleCheck color="green" />
    Firmware flashed
  {:else}
    <Download />
    {#if flashing}
      Flashing firmware... {progress.toFixed(0)}%
    {:else}
      Flash firmware
    {/if}
  {/if}
</Button>

{#if flashing}
  <Progress class="mt-3 h-2" value={progress} />
  <p class="mt-1 text-center text-sm text-muted-foreground">{statusMessage}</p>
{/if}

<Dialog.Root open={showFlashingHelp} onOpenChange={() => (showFlashingHelp = false)}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>No port selected</Dialog.Title>
      <p>
        No device was selected from the list. If your Transit Tracker isn't showing up in the list
        of devices, follow these tips.
      </p>

      <ul class="my-6 ml-6 list-disc [&>li]:mt-2">
        <li>
          Make sure it's in flashing mode. To enter flashing mode:
          <ol class="ml-8 list-decimal">
            <li>Press and hold the BOOT button.</li>
            <li><strong>While BOOT is held</strong>, press and release RESET.</li>
            <li>Release the BOOT button.</li>
          </ol>
        </li>
        <li>Make sure your USB cable can transfer data, not just power.</li>
        <li>It will probably show up as something like "USB JTAG/serial debug unit".</li>
      </ul>
    </Dialog.Header>
    <Dialog.Footer>
      <Button class="w-full" onclick={() => (showFlashingHelp = false)}>Try again</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
