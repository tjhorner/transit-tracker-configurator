<script lang="ts">
  import type { Abbreviation, ConfigState, Localization } from "$lib/state"
  import { Button } from "$lib/components/ui/button"
  import { Label } from "$lib/components/ui/label"
  import { Input } from "$lib/components/ui/input"
  import { Card, CardContent } from "$lib/components/ui/card"
  import { Trash } from "@lucide/svelte"

  interface Props {
    configState: ConfigState
    onsave: (localization: Localization) => void
  }

  let { configState, onsave }: Props = $props()

  let localization: Localization = $state(configState.localization)

  $effect(() => {
    onsave(localization)
  })
</script>

<div class="grid grid-cols-2 gap-3">
  <div class="flex flex-col gap-2">
    <Label for="now" class="flex items-center gap-2">
      Now Label
    </Label>
    <Input
      placeholder="Now"
      bind:value={localization.now}
      name="now"
      id="now"
    />
  </div>

  <div class="flex flex-col gap-2">
    <Label for="minLong" class="flex items-center gap-2">
      Minutes Long Label
    </Label>
    <Input
      placeholder="min"
      bind:value={localization.minLong}
      name="minLong"
      id="minLong"
    />
  </div>

  <div class="flex flex-col gap-2">
    <Label for="minShort" class="flex items-center gap-2">
      Minutes Short Label
    </Label>
    <Input
      placeholder="m"
      bind:value={localization.minShort}
      name="minShort"
      id="minShort"
    />
  </div>

  <div class="flex flex-col gap-2">
    <Label for="hoursShort" class="flex items-center gap-2">
      Hours Short Label
    </Label>
    <Input
      placeholder="h"
      bind:value={localization.hoursShort}
      name="hoursShort"
      id="hoursShort"
    />
  </div>
</div>