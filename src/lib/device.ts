import { getWebSocketEndpoint, type ConfigState } from "./state"
import type { TransitTrackerDevice } from "./device/transit-tracker-device"
import semver from "semver"

async function* configRequestGenerator(device: TransitTrackerDevice, config: ConfigState) {
  let projectVersion = await device.getProjectVersion()
  if (projectVersion === "dev") {
    projectVersion = "999.0.0"
  }

  yield device.setTextEntity("base_url_config", getWebSocketEndpoint(config.apiBaseUrl))

  yield device.setTextEntity("feed_code_config", "")

  yield device.setTextEntity(
    "schedule_config",
    config.routes
      .map((route) => {
        let pair = `${route.routeId},${route.stopId}`
        const stopTimeOffset = config.stopTimeOffsets[route.stopId] ?? 0
        if (stopTimeOffset !== 0) pair += `,${stopTimeOffset * -60}`
        return pair
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

  if (!projectVersion || semver.lt(projectVersion, "2.7.0")) {
    yield device.setSwitchEntity(
      "flip_display",
      config.displayOrientation === "flipped" ? "ON" : "OFF"
    )
  }

  yield device.setSwitchEntity(
    "scroll_headsigns",
    config.headsignOverflow === "scroll" ? "ON" : "OFF"
  )

  yield device.setTextEntity("now_str_config", config.localization.now)

  yield device.setTextEntity("min_long_str_config", config.localization.minLong)

  yield device.setTextEntity("min_short_str_config", config.localization.minShort)

  yield device.setTextEntity("hours_short_str_config", config.localization.hoursShort)
}

export async function pushConfigToDevice(config: ConfigState, device: TransitTrackerDevice) {
  const results = []

  const configRequests = configRequestGenerator(device, config)
  for await (const result of configRequests) {
    results.push(result)
  }

  await device.pressButton("write_preferences")
  await device.pressButton("reload_tracker")

  await device.close?.()

  return results
}
