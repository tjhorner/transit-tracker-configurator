<script lang="ts">
  import { setSerialContext } from "$lib/serial-context"
  import { Button } from "./ui/button"
  import * as Dialog from "./ui/dialog"

  let showHavingTroubleDialog = $state(false)
  let bootButtonRequired = $state(false)
  let { children } = $props()

  async function getSerialPort(withBootButtonRequired = false): Promise<SerialPort> {
    bootButtonRequired = withBootButtonRequired

    if (!("serial" in navigator)) {
      alert("Web Serial API is not supported in this browser.")
      throw new Error("Web Serial API not supported")
    }

    try {
      const pairedPorts = await navigator.serial.getPorts()
      if (pairedPorts.length === 1) {
        return pairedPorts[0]
      }

      return await navigator.serial.requestPort({
        filters: [{ usbVendorId: 0x303a, usbProductId: 0x1001 }]
      })
    } catch (e: any) {
      if (e.message.includes("No port selected") || (e as DOMException).name === "NotFoundError") {
        showHavingTroubleDialog = true
      } else {
        alert(`Error selecting serial port: ${e.message}`)
      }

      throw e
    }
  }

  async function getOpenSerialPort(withBootButtonRequired = false): Promise<SerialPort> {
    const port = await getSerialPort(withBootButtonRequired)

    try {
      await port.open({ baudRate: 115200 })
    } catch (e: any) {
      if (e.message.includes("already open")) {
        await port.close()
        await port.open({ baudRate: 115200 })
      }

      if (e.message.includes("Failed to open serial port")) {
        console.error("Failed to open serial port:", e)
        throw new Error(
          "Couldn't open serial port. Please close all other tabs or applications that might be connecting to the device."
        )
      }

      throw e
    }

    return port
  }

  setSerialContext({
    getSerialPort,
    getOpenSerialPort
  })
</script>

<Dialog.Root open={showHavingTroubleDialog} onOpenChange={() => (showHavingTroubleDialog = false)}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>No port selected</Dialog.Title>
      <p>
        No device was selected from the list. If your Transit Tracker isn't showing up in the list
        of devices, follow these tips.
      </p>

      <ul class="my-6 ml-6 list-disc [&>li]:mt-2">
        {#if bootButtonRequired}
          <li>
            Make sure it's in flashing mode. To enter flashing mode:
            <ol class="ml-8 list-decimal">
              <li>Press and hold the BOOT button.</li>
              <li><strong>While BOOT is held</strong>, press and release RESET.</li>
              <li>Release the BOOT button.</li>
            </ol>
          </li>
        {/if}
        <li>Make sure your USB cable can transfer data, not just power.</li>
        <li>It will probably show up as something like "USB JTAG/serial debug unit".</li>
        <li>Close any other apps that may be using the USB port.</li>
        <li>If all else fails, try restarting your browser or computer.</li>
      </ul>
    </Dialog.Header>
    <Dialog.Footer>
      <Button class="w-full" onclick={() => (showHavingTroubleDialog = false)}>OK</Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>

{@render children()}
