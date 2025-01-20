import { writable } from "svelte/store"

export interface RouteAtStop {
  stopId: string
  stopCode: string
  stopName: string
  routeId: string
  routeName: string
  headsigns: string[]
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
}

function createPersistentStore<T>(key: string, initialValue: T) {
  let currentValue: T = initialValue

  // Attempt to retrieve existing value from localStorage
  try {
    const storedValue = localStorage.getItem(key)
    if (storedValue !== null) {
      currentValue = JSON.parse(storedValue) as T
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

export const config = createPersistentStore<ConfigState>("config", {
  apiBaseUrl: "wss://tt.horner.tj/",
  feed: undefined,
  routes: [],
  routeStyles: [],
  abbreviations: [],
})
