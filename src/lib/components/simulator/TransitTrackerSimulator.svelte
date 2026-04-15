<script lang="ts">
  import { TransitTrackerSimulator, type SimulatorOptions, type Trip } from "./simulator"

  let {
    trips = [],
    options = {},
    class: className = ""
  }: {
    trips?: Trip[]
    options?: SimulatorOptions
    class?: string
  } = $props()

  let canvas: HTMLCanvasElement | undefined = $state()
  let simulator: TransitTrackerSimulator | undefined = $state()

  function formatDuration(seconds: number) {
    if (seconds <= 30) return "now"
    const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" })
    if (seconds < 3600) {
      return rtf.format(Math.round(seconds / 60), "minute")
    } else {
      const hours = Math.floor(seconds / 3600)
      const minutes = Math.floor((seconds % 3600) / 60)
      return `${hours} hours${minutes > 0 ? " " + minutes + " minutes" : ""}`
    }
  }

  $effect(() => {
    if (!canvas) return
    const sim = new TransitTrackerSimulator(canvas, options)
    sim.start()
    simulator = sim
    return () => sim.stop()
  })

  $effect(() => {
    simulator?.setTrips(trips)
  })
</script>

<canvas
  bind:this={canvas}
  class={className}
  aria-label={trips.length === 0
    ? "No upcoming departures"
    : trips
        .map((t) => {
          const now = Math.floor(Date.now() / 1000)
          const seconds = (t.arrivalTime ?? 0) - now
          let timeStr = formatDuration(seconds)
          return `${t.routeName} to ${t.headsign} ${timeStr}${t.isRealtime ? " (real-time)" : ""}`
        })
        .join("; ")}
></canvas>
