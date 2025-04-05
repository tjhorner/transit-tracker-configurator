import { apiBaseUrl } from "./config"
import type { FeatureCollection } from "geojson"

export interface Feed {
  code: string
  name: string
  description: string
  bounds: [number, number, number, number]
}

class TransitTrackerApi {
  constructor(private readonly baseUrl: string) {}

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
}

export const api = new TransitTrackerApi(apiBaseUrl)
