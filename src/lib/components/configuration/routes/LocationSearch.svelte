<script lang="ts">
  import { onMount } from "svelte"
  import { setOptions, importLibrary } from "@googlemaps/js-api-loader"

  interface Props {
    apiKey: string
    onPlaceSelected?: (location: { lat: number; lng: number }) => void
  }

  let { apiKey, onPlaceSelected, ...restProps }: Props = $props()

  let input: HTMLInputElement

  onMount(async () => {
    setOptions({
      key: apiKey,
      v: "weekly"
    })

    const { Autocomplete } = await importLibrary("places")

    const autocomplete = new Autocomplete(input, { fields: ["geometry"] })

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace()
      if (!place.geometry || !place.geometry?.location) {
        return
      }

      input.blur()

      onPlaceSelected?.({
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng()
      })
    })
  })
</script>

<input
  bind:this={input}
  {...restProps}
  class="w-96 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-black shadow-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
  type="text"
  placeholder="Search for a location..."
  onkeydown={(e) => e.key === "Enter" && e.preventDefault()}
/>
