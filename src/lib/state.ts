import { writable } from "svelte/store"
import { defaultBaseUrl } from "./config"

export interface RouteAtStop {
  stopId: string
  stopCode: string
  stopName: string
  routeId: string
  routeName: string
  headsigns: string[]
  color: string | null
}

export interface RouteStyle {
  routeId: string
  name: string
  color: string
}

export interface Feed {
  code: string
  name: string
  description: string
  bounds: [number, number, number, number]
}

export interface Abbreviation {
  from: string
  to: string
}

export interface ConfigState {
  apiBaseUrl: string
  deviceBaseUrl?: string
  routes: RouteAtStop[]
  routeStyles: RouteStyle[]
  abbreviations: Abbreviation[]
  stopTimeOffsets: Record<string, number>
  timeDisplay: "arrival" | "departure"
  timeUnits: "long" | "short" | "none"
  listMode: "sequential" | "nextPerRoute"
  displayOrientation: "normal" | "flipped"
}

function toGlobalId(feedCode: string, localId: string): string {
  return `${feedCode}:${localId}`
}

function migrateFeedCodeToGlobalIds(config: ConfigState & { feed?: Feed }): ConfigState {
  if (!config.feed) return config

  const feedCode = config.feed.code
  delete config.feed

  return {
    ...config,
    routes: config.routes.map((route) => ({
      ...route,
      stopId: toGlobalId(feedCode, route.stopId),
      routeId: toGlobalId(feedCode, route.routeId),
    })),
    routeStyles: config.routeStyles.map((style) => ({
      ...style,
      routeId: toGlobalId(feedCode, style.routeId),
    })),
  }
}

function migrateBaseUrlToHttp(config: ConfigState): ConfigState {
  if (config.apiBaseUrl.startsWith("ws://") || config.apiBaseUrl.startsWith("wss://")) {
    const url = new URL(config.apiBaseUrl)
    url.protocol = url.protocol === "ws:" ? "http:" : "https:"
    url.pathname = ""
    config.apiBaseUrl = url.href
  }

  return config
}

function createPersistentStore<T>(key: string, initialValue: T, ...migrate: ((value: T) => T)[]) {
  let currentValue: T = initialValue

  // Attempt to retrieve existing value from localStorage
  try {
    const storedValue = localStorage.getItem(key)
    if (storedValue !== null) {
      currentValue = JSON.parse(storedValue) as T
      for (const key in initialValue) {
        if (currentValue[key] === undefined) {
          currentValue[key] = initialValue[key]
        }
      }
    }
  } catch (error) {
    console.error(`Error parsing JSON from localStorage key "${key}":`, error)
  }

  currentValue = migrate.reduce((value, migrateFn) => migrateFn(value), currentValue)

  // Create a Svelte writable store with the (possibly) retrieved value
  const store = writable<T>(currentValue)

  // Subscribe to changes so every update is also reflected in localStorage
  store.subscribe((value) => {
    localStorage.setItem(key, JSON.stringify(value))
  })

  return store
}

export function getWebSocketEndpoint(baseUrl: string) {
  const url = new URL(baseUrl)
  url.protocol = url.protocol === "http:" ? "ws:" : "wss:"
  url.pathname = "/"
  return url.href
}

export const config = createPersistentStore<ConfigState>("config", {
  apiBaseUrl: defaultBaseUrl,
  routes: [],
  routeStyles: [],
  abbreviations: [],
  stopTimeOffsets: {},
  timeDisplay: "arrival",
  timeUnits: "long",
  listMode: "sequential",
  displayOrientation: "normal",
}, migrateFeedCodeToGlobalIds, migrateBaseUrlToHttp)
