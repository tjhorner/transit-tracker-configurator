<script lang="ts">
  import { api, type Trip as ApiTrip } from "$lib/api"
  import { config, type RouteAtStop } from "$lib/state"
  import TransitTrackerSimulator from "$lib/components/simulator/TransitTrackerSimulator.svelte"
  import { hexColor, type Trip as SimTrip } from "$lib/components/simulator/simulator"

  interface Props {
    routes: RouteAtStop[]
    timeOffsets: Record<string, number>
  }

  let { routes, timeOffsets }: Props = $props()

  const abbreviations = $config.abbreviations
  const routeStyles = $config.routeStyles
  const unitDisplay = $config.timeUnits
  const scrollHeadsigns = $config.headsignOverflow === "scroll"

  let apiTrips: ApiTrip[] = $state([])

  let simulatorTrips: SimTrip[] = $derived(
    apiTrips
      .map((trip) => {
        const route = routes.find((r) => r.routeId === trip.routeId)
        const style = routeStyles.find((s) => s.routeId === trip.routeId)
        const offset = timeOffsets[trip.stopId] ?? 0

        let headsign = trip.headsign
        for (const abbr of abbreviations) {
          headsign = headsign.replaceAll(abbr.from, abbr.to)
        }

        return {
          routeId: trip.routeId,
          routeName: style?.name || trip.routeName,
          routeColor: style?.color
            ? hexColor(parseInt(style.color.slice(1), 16))
            : route?.color
              ? hexColor(parseInt(route.color, 16))
              : { r: 0xff, g: 0xff, b: 0xff },
          headsign,
          arrivalTime: trip.arrivalTime + offset * -60,
          departureTime: trip.departureTime + offset * -60,
          isRealtime: trip.isRealtime
        }
      })
      .filter((trip) => trip.arrivalTime > Math.floor(Date.now() / 1000))
      .slice(0, 3)
  )

  async function getTrips() {
    const pairs = routes.map((r) => `${r.routeId},${r.stopId}`).join(";")
    const response = await api.getSchedule(pairs, 10)
    apiTrips = response.trips
  }

  $effect(() => {
    if (routes.length > 0) {
      getTrips()
    }
  })
</script>

<div class="flex min-h-24 w-full items-center justify-center">
  <div class="simulator">
    <TransitTrackerSimulator
      trips={simulatorTrips}
      options={{
        brightness: 1.3,
        pixelPitch: 8,
        glowRadius: 16,
        unitDisplay,
        scrollHeadsigns
      }}
      class="w-full"
    />
  </div>
</div>

<style>
  .simulator {
    border: 1.5vw solid #0b0b0b;
    border-radius: 10px;
  }
</style>
