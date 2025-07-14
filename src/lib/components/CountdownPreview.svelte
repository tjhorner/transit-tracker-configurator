<script lang="ts">
  import { api } from "$lib/api"
  import type { RouteAtStop } from "$lib/state"

  interface Props {
    routes: RouteAtStop[]
    timeOffsets: Record<string, number>
  }

  let { routes, timeOffsets }: Props = $props()

  interface TripDto {
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

  let trips: TripDto[] = $state([])

  function getCountdownText(trip: TripDto) {
    const now = new Date()
    const offset = timeOffsets[trip.stopId] ?? 0
    const diff = new Date(trip.arrivalTime * 1000).getTime() - now.getTime() + offset * -60000

    const hours = Math.floor(diff / 3600000)
    const minutes = Math.floor(diff / 60000)
    const seconds = Math.floor(diff / 1000)

    if (hours > 0) {
      return `${hours}h${minutes % 60}m`
    }

    if (minutes === 0 && seconds <= 30) {
      return "Now"
    }

    return `${minutes}min`
  }

  async function getTrips() {
    const pairs = routes.map((r) => `${r.routeId},${r.stopId}`).join(";")
    const response = await api.getSchedule(pairs, 10)
    trips = response.trips
  }

  $effect(() => {
    if (routes.length > 0) {
      getTrips()
    }
  })
</script>

<div>
  {#if trips.length === 0}
    <div class="text-md text-center text-muted-foreground">No upcoming trips</div>
  {:else}
    <table>
      <tbody>
        {#each trips as trip}
          <tr>
            <td><strong>{trip.routeName}</strong></td>
            <td>{trip.headsign}</td>
            <td style="text-align: right" class={trip.isRealtime ? "text-green-500 dark:text-green-400" : ""}>{getCountdownText(trip)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
  {/if}
</div>

<style>
  table {
    width: 100%;
  }
</style>
