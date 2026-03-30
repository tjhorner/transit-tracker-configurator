import {
  ConfigValidationError,
  type SetEntityResult,
  type TransitTrackerDevice
} from "./transit-tracker-device"

export class NetworkTransitTrackerDevice implements TransitTrackerDevice {
  constructor(private readonly baseUrl: string) {}

  private async request(path: string, method: string): Promise<Response> {
    const resp = await fetch(`${this.baseUrl}${path}`, {
      method,
      // @ts-ignore
      targetAddressSpace: "local"
    })

    return resp
  }

  private async get(path: string): Promise<Response> {
    return this.request(path, "get")
  }

  private async post(path: string): Promise<Response> {
    return this.request(path, "post")
  }

  async getProjectVersion(): Promise<string | null> {
    try {
      const resp = await this.get("/text_sensor/project_version_text")
      if (!resp.ok) {
        return null
      }
      const data = await resp.json()
      return data.state || null
    } catch {
      return null
    }
  }

  async setTextEntity(name: string, value: string) {
    if (value.length > 512) {
      throw new ConfigValidationError(`Value for ${name} is too long: ${value.length} > 512`)
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
