import { writable } from "svelte/store"
import { apiBaseUrl } from "./config"

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
  feed?: Feed
  routes: RouteAtStop[]
  routeStyles: RouteStyle[]
  abbreviations: Abbreviation[]
  stopTimeOffsets: Record<string, number>
  timeDisplay: "arrival" | "departure"
  listMode: "sequential" | "nextPerRoute"
}

function createPersistentStore<T>(key: string, initialValue: T) {
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

  // Create a Svelte writable store with the (possibly) retrieved value
  const store = writable<T>(currentValue)

  // Subscribe to changes so every update is also reflected in localStorage
  store.subscribe((value) => {
    localStorage.setItem(key, JSON.stringify(value))
  })

  return store
}

function getWebSocketEndpoint(baseUrl: string) {
  const url = new URL(baseUrl)
  url.protocol = url.protocol === "http:" ? "ws:" : "wss:"
  url.pathname = "/"
  return url.href
}

export const config = createPersistentStore<ConfigState>("config", {
  apiBaseUrl: getWebSocketEndpoint(apiBaseUrl),
  routes: [],
  routeStyles: [],
  abbreviations: [],
  stopTimeOffsets: {},
  timeDisplay: "arrival",
  listMode: "sequential"
})
