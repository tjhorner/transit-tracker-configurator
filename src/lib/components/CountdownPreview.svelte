<script lang="ts">
	import { apiBaseUrl } from "$lib/config"
	import type { RouteAtStop } from "$lib/state"

  interface Props {
    feed: string
    routes: RouteAtStop[]
  }

  let { feed, routes }: Props = $props()

  interface TripDto {
    tripId: string
    routeId: string
    routeName: string
    stopId: string
    stopName: string
    headsign: string
    arrivalTime: number
    departureTime: number
    countdownText: string
    isRealtime: boolean
  }

  let trips: TripDto[] = $state([])

  async function getTrips() {
    const pairs = routes.map((r) => `${r.routeId},${r.stopId}`).join(";")
    const response = await fetch(`${apiBaseUrl}/schedule/${feed}/${pairs}`)
    trips = (await response.json()).trips
  }

  $effect(() => {
    if (routes.length > 0) {
      getTrips()
    }
  })
</script>

<div>
  <table>
    <tbody>
      {#each trips as trip}
        <tr>
          <td><strong>{trip.routeName}</strong></td>
          <td>{trip.headsign}</td>
          <td style="text-align: right">{trip.countdownText}</td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>

<style>
  table {
    width: 100%;
  }
</style>