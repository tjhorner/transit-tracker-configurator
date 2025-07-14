import type { Readable } from "svelte/store"
import type { FeatureCollection } from "geojson"
import { config, type ConfigState } from "./state"

export interface Feed {
  code: string
  name: string
  description: string
  bounds: [number, number, number, number]
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

  async getSchedule(pairs: string, limit: number = 10) {
    const response = await fetch(`${this.baseUrl}/schedule/${encodeURIComponent(pairs)}?limit=${limit}`)
    if (!response.ok) {
      throw new Error(`Error fetching schedule: ${response.statusText}`)
    }
    return response.json()
  }

  async getStopsWithin(bounds: number[][]) {
    const response = await fetch(`${this.baseUrl}/stops/within/${bounds[0][0]},${bounds[0][1]},${bounds[1][0]},${bounds[1][1]}`)
    if (!response.ok) {
      throw new Error(`Error fetching stops: ${response.statusText}`)
    }
    return response.json()
  }

  async getRoutesForStop(stopId: string) {
    const response = await fetch(`${this.baseUrl}/stops/${encodeURIComponent(stopId)}/routes`)
    if (!response.ok) {
      throw new Error(`Error fetching routes for stop: ${response.statusText}`)
    }
    return response.json()
  }
}

export const api = new TransitTrackerApi(config)
