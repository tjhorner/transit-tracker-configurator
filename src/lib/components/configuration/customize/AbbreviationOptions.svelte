<script lang="ts">
  import type { Abbreviation, ConfigState } from "$lib/state"
  import { Button } from "$lib/components/ui/button"
  import { Input } from "$lib/components/ui/input"
  import { Card, CardContent } from "$lib/components/ui/card"
  import { Trash } from "@lucide/svelte"

  interface Props {
    configState: ConfigState
    onsave: (abbreviations: Abbreviation[]) => void
  }

  let { configState, onsave }: Props = $props()

  let abbreviations: Abbreviation[] = $state(configState.abbreviations)

  function removeAbbr(index: number) {
    abbreviations.splice(index, 1)
  }

  $effect(() => {
    onsave(abbreviations)
  })
</script>

<Card>
  <CardContent class="space-y-4 p-3">
    {#each abbreviations as abbr, idx}
      <div class="flex items-center gap-2">
        <Input type="text" placeholder="From" bind:value={abbr.from} />
        <span class="mx-1">→</span>
        <Input type="text" placeholder="To" bind:value={abbr.to} />
        <Button variant="destructive" class="px-3" onclick={() => removeAbbr(idx)}>
          <Trash />
        </Button>
      </div>
    {/each}

    <Button
      variant="secondary"
      class="w-full"
      size="sm"
      onclick={() => abbreviations.push({ from: "", to: "" })}
    >
      Add abbreviation
    </Button>
  </CardContent>
</Card>
