import {
  ConfigValidationError,
  type SetEntityResult,
  type TransitTrackerDevice
} from "./transit-tracker-device"

export class NetworkTransitTrackerDevice implements TransitTrackerDevice {
  constructor(private readonly baseUrl: string) {}

  private async post(path: string): Promise<Response> {
    const resp = await fetch(`${this.baseUrl}${path}`, {
      method: "post",
      // @ts-ignore
      targetAddressSpace: "local"
    })

    return resp
  }

  async setTextEntity(name: string, value: string) {
    if (value.length > 255) {
      throw new ConfigValidationError(`Value for ${name} is too long: ${value.length} > 255`)
    }

    const resp = await this.post(`/text/${name}/set?value=${encodeURIComponent(value)}`)
    return { ok: resp.ok, name }
  }

  async setSelectEntity(name: string, value: string) {
    const resp = await this.post(`/select/${name}/set?option=${encodeURIComponent(value)}`)
    return { ok: resp.ok, name }
  }

  async setSwitchEntity(name: string, value: "ON" | "OFF") {
    const endpoint = value === "ON" ? "turn_on" : "turn_off"
    const resp = await this.post(`/switch/${name}/${endpoint}`)
    return { ok: resp.ok, name }
  }

  async pressButton(name: string): Promise<SetEntityResult> {
    const resp = await this.post(`/button/${name}/press`)
    return { ok: resp.ok, name }
  }
}
