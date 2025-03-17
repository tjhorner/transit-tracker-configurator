import { ImprovSerial } from "improv-wifi-serial-sdk/dist/serial"
import type { ConfigState } from "./state"
import { getSerialPort } from "./utils"

export async function getDeviceBaseUrl(): Promise<string> {
  const port = await getSerialPort()

  try {
    await port.open({ baudRate: 115200 })
  } catch (e: any) {
    if (e.message.includes("already open")) {
      await port.close()
      await port.open({ baudRate: 115200 })
    }
  }

  const improv = new ImprovSerial(port, console)

  let retries = 0
  let deviceBaseUrl: string | undefined
  while (!deviceBaseUrl && retries <= 3) {
    try {
      await improv.initialize()

      if (!improv.nextUrl) {
        throw new Error("Device did not report URL")
      }

      deviceBaseUrl = improv.nextUrl
      await improv.close()
    } catch (e: any) {
      console.warn(e)
      retries++
      if (retries > 3) {
        throw e
      }
    }
  }

  await port.close()

  return improv.nextUrl!
}

interface SetConfigResult {
  ok: boolean
  name: string
}

async function setConfig(baseUrl: string, name: string, value: string, domain: string = "text"): Promise<SetConfigResult> {
  const resp = await fetch(`${baseUrl}/${domain}/${name}/set?value=${encodeURIComponent(value)}`, {
    method: "post",
    // @ts-ignore
    targetAddressSpace: "private"
  })

  return { ok: resp.ok, name }
}

async function getConfig(baseUrl: string, name: string): Promise<string> {
  const resp = await fetch(`${baseUrl}/text/${name}`)
  if (!resp.ok) {
    throw new Error(`Failed to get config value ${name} from device ${baseUrl}`)
  }

  const value = await resp.json()
  return value.value
}

function* configRequestGenerator(baseUrl: string, config: ConfigState) {
  yield setConfig(baseUrl, "base_url_config", config.apiBaseUrl)

  yield setConfig(baseUrl, "feed_code_config", config.feed!.code)

  yield setConfig(
    baseUrl,
    "schedule_config",
    config.routes
      .map((route) => {
        const stopTimeOffset = config.stopTimeOffsets[route.stopId] ?? 0
        return `${route.routeId},${route.stopId},${stopTimeOffset ? stopTimeOffset * -60 : 0}`
      })
      .join(";")
  )

  yield setConfig(
    baseUrl,
    "abbreviations_config",
    config.abbreviations
      .map((abbr) => {
        return `${abbr.from};${abbr.to}`
      })
      .join("\n")
  )

  yield setConfig(
    baseUrl,
    "route_styles_config",
    config.routeStyles
      .map((style) => {
        return `${style.routeId};${style.name};${style.color.replaceAll("#", "")}`
      })
      .join("\n")
  )

  yield setConfig(
    baseUrl,
    "time_display_config",
    config.timeDisplay,
    "select"
  )

  yield setConfig(
    baseUrl,
    "list_mode_config",
    config.listMode,
    "select"
  )
}

export async function pushConfigToDevice(config: ConfigState, deviceBaseUrl: string) {
  const results = []

  const configRequests = configRequestGenerator(deviceBaseUrl, config)
  for (const request of configRequests) {
    const result = await request
    results.push(result)
  }

  await fetch(`${deviceBaseUrl}/button/write_preferences/press`, {
    method: "post",
    // @ts-ignore
    targetAddressSpace: "private"
  })

  await fetch(`${deviceBaseUrl}/button/reload_tracker/press`, {
    method: "post",
    // @ts-ignore
    targetAddressSpace: "private"
  })

  return results
}
