import { ImprovSerial } from "improv-wifi-serial-sdk/dist/serial"
import { getWebSocketEndpoint, type ConfigState } from "./state"
import { getSerialPort } from "./utils"
import type { TransitTrackerDevice } from "./device/transit-tracker-device"

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

function* configRequestGenerator(device: TransitTrackerDevice, config: ConfigState) {
  yield device.setTextEntity("base_url_config", getWebSocketEndpoint(config.apiBaseUrl))

  yield device.setTextEntity("feed_code_config", "")

  yield device.setTextEntity(
    "schedule_config",
    config.routes
      .map((route) => {
        const stopTimeOffset = config.stopTimeOffsets[route.stopId] ?? 0
        return `${route.routeId},${route.stopId},${stopTimeOffset ? stopTimeOffset * -60 : 0}`
      })
      .join(";")
  )

  yield device.setTextEntity(
    "abbreviations_config",
    config.abbreviations
      .map((abbr) => {
        return `${abbr.from};${abbr.to}`
      })
      .join("\n")
  )

  yield device.setTextEntity(
    "route_styles_config",
    config.routeStyles
      .map((style) => {
        return `${style.routeId};${style.name};${style.color.replaceAll("#", "")}`
      })
      .join("\n")
  )

  yield device.setSelectEntity("time_display_config", config.timeDisplay)
  yield device.setSelectEntity("time_units_config", config.timeUnits)
  yield device.setSelectEntity("list_mode_config", config.listMode)

  yield device.setSwitchEntity(
    "flip_display",
    config.displayOrientation === "flipped" ? "ON" : "OFF"
  )
}

export async function pushConfigToDevice(config: ConfigState, device: TransitTrackerDevice) {
  const results = []

  const configRequests = configRequestGenerator(device, config)
  for (const request of configRequests) {
    const result = await request
    results.push(result)
  }

  await device.pressButton("write_preferences")
  await device.pressButton("reload_tracker")

  return results
}
