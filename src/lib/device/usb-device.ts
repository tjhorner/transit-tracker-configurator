import { ConfigValidationError, type TransitTrackerDevice } from "./transit-tracker-device"
import { ESPHomeRpcClient } from "$lib/esphome-rpc"
import type { SerialContext } from "$lib/serial-context"

export class UsbTransitTrackerDevice implements TransitTrackerDevice {
  private static instance: UsbTransitTrackerDevice | null = null

  static getInstance(ctx: SerialContext): UsbTransitTrackerDevice {
    if (!UsbTransitTrackerDevice.instance) {
      UsbTransitTrackerDevice.instance = new UsbTransitTrackerDevice(ctx)
    } else {
      UsbTransitTrackerDevice.instance.ctx = ctx
    }

    return UsbTransitTrackerDevice.instance
  }

  constructor(private ctx: SerialContext) {}

  private port: SerialPort | null = null
  private rpc: ESPHomeRpcClient | null = null

  async close() {
    if (this.rpc) {
      await this.rpc.disconnect()
      this.rpc = null
    }

    if (this.port) {
      try {
        await this.port.close()
      } catch (e: any) {
        console.warn("Error closing serial port:", e)
      }

      this.port = null
    }
  }

  async getProjectVersion(): Promise<string | null> {
    await this.initializeRpc()
    const { project_version } = await this.rpc!.getDeviceInfo()
    return project_version
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
      this.port = await this.ctx.getSerialPort()

      try {
        await this.port.open({ baudRate: 115200 })
      } catch (e: any) {
        if (e.message.includes("already open")) {
          await this.port.close()
          await this.port.open({ baudRate: 115200 })
        }

        if (e.message.includes("Failed to open serial port")) {
          throw new Error(
            "Couldn't open serial port. Please close all other tabs or applications that might be connecting to the device."
          )
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
}
