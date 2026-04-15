<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { CircleCheck, Download } from "@lucide/svelte"
  import { Progress } from "$lib/components/ui/progress"
  import { Transport, ESPLoader } from "esptool-js"
  import { sleep } from "$lib/utils"
  import { getSerialContext } from "$lib/serial-context"
  import { onDestroy } from "svelte"

  interface Props {
    file?: string
    offset?: number
    eraseFlash?: boolean
    bootButtonRequired?: boolean
    onSuccess: () => void
  }

  let {
    file = "https://transit-tracker.eastsideurbanism.org/firmware/firmware.factory.bin",
    offset = 0,
    eraseFlash = false,
    bootButtonRequired = true,
    onSuccess
  }: Props = $props()

  const ctx = getSerialContext()

  let flashing = $state(false)
  let progress = $state(0)
  let statusMessage = $state("")
  let success = $state(false)

  let port: SerialPort | null = $state(null)

  async function beginFlash() {
    flashing = true
    progress = 0
    statusMessage = "Connecting to Transit Tracker..."

    try {
      port = await ctx.getSerialPort(bootButtonRequired)

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

      const resp = await fetch(file)
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
            address: offset,
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

      await esploader.after("hard_reset")
      await resetTransport(transport)
      await transport.disconnect()

      success = true
      onSuccess()
    } catch (e: any) {
      console.error(e)
      success = false
    } finally {
      flashing = false
      await port?.close()
      port = null
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

  onDestroy(async () => {
    await port?.close()
  })
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
