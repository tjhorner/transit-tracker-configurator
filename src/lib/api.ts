import type { Readable } from "svelte/store"
import type { FeatureCollection } from "geojson"
import { config, type ConfigState } from "./state"

export interface Feed {
  code: string
  name: string
  description: string
  bounds: [number, number, number, number]
}

export interface Stop {
  stopId: string
  stopCode: string | null
  name: string
  lat: number
  lon: number
}

export interface Trip {
  tripId: string
  routeId: string
  routeName: string
  stopId: string
  stopName: string
  headsign: string
  arrivalTime: number
  departureTime: number
  isRealtime: boolean
}

export interface Schedule {
  trips: Trip[]
}

export interface Route {
  routeId: string
  name: string
  color: string | null
  headsigns: string[]
}

class TransitTrackerApi {
  private baseUrl!: string

  constructor(state: Readable<ConfigState>) {
    state.subscribe((config) => {
      this.baseUrl = new URL(config.apiBaseUrl).origin
    })
  }

  async getFeeds(): Promise<Feed[]> {
    const response = await fetch(`${this.baseUrl}/feeds`)
    if (!response.ok) {
      throw new Error(`Error fetching feeds: ${response.statusText}`)
    }
    return response.json()
  }

  async getServiceAreas(): Promise<FeatureCollection> {
    const response = await fetch(`${this.baseUrl}/feeds/service-areas`)
    if (!response.ok) {
      throw new Error(`Error fetching service areas: ${response.statusText}`)
    }
    return response.json()
  }

  async getSchedule(pairs: string, limit: number = 10): Promise<Schedule> {
    const response = await fetch(
      `${this.baseUrl}/schedule/${encodeURIComponent(pairs)}?limit=${limit}`
    )
    if (!response.ok) {
      throw new Error(`Error fetching schedule: ${response.statusText}`)
    }
    return response.json()
  }

  async getStopsWithin(bounds: number[][]): Promise<Stop[]> {
    const response = await fetch(
      `${this.baseUrl}/stops/within/${bounds[0][0]},${bounds[0][1]},${bounds[1][0]},${bounds[1][1]}`
    )
    if (!response.ok) {
      throw new Error(`Error fetching stops: ${response.statusText}`)
    }
    return response.json()
  }

  async getRoutesForStop(stopId: string): Promise<Route[]> {
    const response = await fetch(`${this.baseUrl}/stops/${encodeURIComponent(stopId)}/routes`)
    if (!response.ok) {
      throw new Error(`Error fetching routes for stop: ${response.statusText}`)
    }
    return response.json()
  }
}

export const api = new TransitTrackerApi(config)
