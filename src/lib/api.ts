import { apiBaseUrl } from "./config"

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
}

export const api = new TransitTrackerApi(apiBaseUrl)
