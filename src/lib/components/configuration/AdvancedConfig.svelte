<script lang="ts">
  import * as RadioGroup from "../ui/radio-group"
  import { Label } from "../ui/label"
  import { config } from "$lib/state"
</script>

<div class="mb-5">
  <h4 class="mb-2 scroll-m-20 text-xl font-semibold tracking-tight">Display Orientation</h4>

  <RadioGroup.Root bind:value={$config.displayOrientation}>
    <div class="flex items-center space-x-2">
      <RadioGroup.Item value="normal" id="normal" />
      <Label for="normal">Normal &mdash; USB port on the right</Label>
    </div>
    <div class="flex items-center space-x-2">
      <RadioGroup.Item value="flipped" id="flipped" />
      <Label for="flipped">Flipped &mdash; USB port on the left</Label>
    </div>
  </RadioGroup.Root>
</div>