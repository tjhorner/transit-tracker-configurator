import { ConfigValidationError, type TransitTrackerDevice } from "./transit-tracker-device"
import { ESPHomeRpcClient } from "$lib/esphome-rpc"

export class UsbTransitTrackerDevice implements TransitTrackerDevice {
  static instance: UsbTransitTrackerDevice = new UsbTransitTrackerDevice()

  private port: SerialPort | null = null
  private rpc: ESPHomeRpcClient | null = null

  async close() {
    if (this.rpc) {
      await this.rpc.disconnect()
    }

    if (this.port && this.port.connected) {
      await this.port.close()
    }
  }

  async setTextEntity(id: string, value: string) {
    if (value.length > 255) {
      throw new ConfigValidationError(`Value for ${id} is too long: ${value.length} > 255`)
    }

    await this.initializeRpc()
    const ok = await this.rpc!.setTextEntity(id, value)
    return { name: id, ok }
  }

  async setSelectEntity(id: string, value: string) {
    await this.initializeRpc()
    const ok = await this.rpc!.setSelectEntity(id, value)
    return { name: id, ok }
  }

  async setSwitchEntity(id: string, value: "ON" | "OFF") {
    await this.initializeRpc()
    const ok = await this.rpc!.setSwitchEntity(id, value)
    return { name: id, ok }
  }

  async pressButton(id: string) {
    await this.initializeRpc()
    const ok = await this.rpc!.pressButton(id)
    return { name: id, ok }
  }

  private async initializeRpc() {
    if (!this.port) {
      this.port = await this.getSerialPort()

      try {
        await this.port.open({ baudRate: 115200 })
      } catch (e: any) {
        if (e.message.includes("already open")) {
          await this.port.close()
          await this.port.open({ baudRate: 115200 })
        }
      }
    }

    if (!this.rpc) {
      this.rpc = new ESPHomeRpcClient(this.port)

      this.rpc.addEventListener("disconnect", async () => {
        this.port = null
        this.rpc = null
      })

      await this.rpc.connect()
    }
  }

  private async getSerialPort() {
    const pairedPorts = await navigator.serial.getPorts()
    if (pairedPorts.length === 1) {
      return pairedPorts[0]
    }
  
    return await navigator.serial.requestPort({
      filters: [{ usbVendorId: 0x303a, usbProductId: 0x1001 }]
    })
  }
}
