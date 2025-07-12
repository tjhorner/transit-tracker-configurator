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

class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ConfigValidationError"
  }
}

async function postDevice(baseUrl: string, path: string): Promise<Response> {
  const resp = await fetch(`${baseUrl}${path}`, {
    method: "post",
    // @ts-ignore
    targetAddressSpace: "private"
  })

  return resp
}

async function setTextConfig(
  baseUrl: string,
  name: string,
  value: string
): Promise<SetConfigResult> {
  if (value.length > 255) {
    throw new ConfigValidationError(`Value for ${name} is too long: ${value.length} > 255`)
  }

  const resp = await postDevice(baseUrl, `/text/${name}/set?value=${encodeURIComponent(value)}`)
  return { ok: resp.ok, name }
}

async function setSelectConfig(
  baseUrl: string,
  name: string,
  value: string
): Promise<SetConfigResult> {
  const resp = await postDevice(baseUrl, `/select/${name}/set?option=${encodeURIComponent(value)}`)
  return { ok: resp.ok, name }
}

async function setSwitchConfig(
  baseUrl: string,
  name: string,
  value: boolean
): Promise<SetConfigResult> {
  const endpoint = value ? "turn_on" : "turn_off"
  const resp = await postDevice(baseUrl, `/switch/${name}/${endpoint}`)
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
  yield setTextConfig(baseUrl, "base_url_config", config.apiBaseUrl)

  yield setTextConfig(baseUrl, "feed_code_config", "")

  yield setTextConfig(
    baseUrl,
    "schedule_config",
    config.routes
      .map((route) => {
        const stopTimeOffset = config.stopTimeOffsets[route.stopId] ?? 0
        return `${route.routeId},${route.stopId},${stopTimeOffset ? stopTimeOffset * -60 : 0}`
      })
      .join(";")
  )

  yield setTextConfig(
    baseUrl,
    "abbreviations_config",
    config.abbreviations
      .map((abbr) => {
        return `${abbr.from};${abbr.to}`
      })
      .join("\n")
  )

  yield setTextConfig(
    baseUrl,
    "route_styles_config",
    config.routeStyles
      .map((style) => {
        return `${style.routeId};${style.name};${style.color.replaceAll("#", "")}`
      })
      .join("\n")
  )

  yield setSelectConfig(baseUrl, "time_display_config", config.timeDisplay)
  yield setSelectConfig(baseUrl, "time_units_config", config.timeUnits)
  yield setSelectConfig(baseUrl, "list_mode_config", config.listMode)

  yield setSwitchConfig(baseUrl, "flip_display", config.displayOrientation === "flipped")
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
