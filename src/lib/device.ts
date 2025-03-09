import { ImprovSerial } from "improv-wifi-serial-sdk/dist/serial"
import type { ConfigState } from "./state"

async function setConfig(baseUrl: string, name: string, value: string) {
  const resp = await fetch(`${baseUrl}/text/${name}/set?value=${encodeURIComponent(value)}`, {
    method: "post",
    // @ts-ignore
    targetAddressSpace: "private"
  })
  
  if (!resp.ok) {
    throw new Error(`Failed to set config value ${name} on device ${baseUrl}`)
  }
}

async function getConfig(baseUrl: string, name: string): Promise<string> {
  const resp = await fetch(`${baseUrl}/text/${name}`)
  if (!resp.ok) {
    throw new Error(`Failed to get config value ${name} from device ${baseUrl}`)
  }

  const value = await resp.json()
  return value.value
}

export async function getDeviceBaseUrl(): Promise<string> {
  const port = await navigator.serial.requestPort()
  await port.open({ baudRate: 115200 })

  const improv = new ImprovSerial(port, console)
  await improv.initialize()

  if (!improv.nextUrl) {
    throw new Error("Device did not report URL")
  }

  await improv.close()
  await port.close()

  return improv.nextUrl
}

export async function pushConfigToDevice(config: ConfigState, deviceBaseUrl: string) {
  await setConfig(deviceBaseUrl, "base_url_config", config.apiBaseUrl)

  await setConfig(deviceBaseUrl, "feed_code_config", config.feed!.code)

  await setConfig(deviceBaseUrl, "schedule_config", config.routes.map(route => {
    const stopTimeOffset = config.stopTimeOffsets[route.stopId] ?? 0
    return `${route.routeId},${route.stopId},${stopTimeOffset ? stopTimeOffset * -60 : 0}`
  }).join(";"))

  await setConfig(deviceBaseUrl, "abbreviations_config", config.abbreviations.map(abbr => {
    return `${abbr.from};${abbr.to}`
  }).join("\n"))

  await setConfig(deviceBaseUrl, "route_styles_config", config.routeStyles.map(style => {
    return `${style.routeId};${style.name};${style.color.replaceAll("#", "")}`
  }).join("\n"))

  await fetch(`${deviceBaseUrl}/button/reload_tracker/press`, {
    method: "post",
    // @ts-ignore
    targetAddressSpace: "private"
  })
}
