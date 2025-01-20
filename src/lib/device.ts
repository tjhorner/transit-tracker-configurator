import type { ConfigState } from "./state"

async function setConfig(baseUrl: string, name: string, value: string) {
  await fetch(`${baseUrl}/text/${name}/set?value=${encodeURIComponent(value)}`, {
    method: "post"
  })
}

export async function pushConfigToDevice(config: ConfigState, deviceBaseUrl: string) {
  await setConfig(deviceBaseUrl, "base_url_config", config.apiBaseUrl)

  await setConfig(deviceBaseUrl, "feed_code_config", config.feed!.code)

  await setConfig(deviceBaseUrl, "schedule_config", config.routes.map(route => {
    return `${route.routeId},${route.stopId}`
  }).join(";"))

  await setConfig(deviceBaseUrl, "abbreviations_config", config.abbreviations.map(abbr => {
    return `${abbr.from};${abbr.to}`
  }).join("\n"))

  await setConfig(deviceBaseUrl, "route_styles_config", config.routeStyles.map(style => {
    return `${style.routeId};${style.name};${style.color.replaceAll("#", "")}`
  }).join("\n"))

  await fetch(`${deviceBaseUrl}/button/reload_tracker/press`, { method: "post" })
}
