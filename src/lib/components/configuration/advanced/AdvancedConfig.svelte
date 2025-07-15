<script lang="ts">
  import * as RadioGroup from "../../ui/radio-group"
  import { Label } from "../../ui/label"
  import { config } from "$lib/state"
  import { Button } from "../../ui/button"
  import { Pencil } from "@lucide/svelte"
  import ChangeHostDialog from "./ChangeHostDialog.svelte"
  import * as Dialog from "$lib/components/ui/dialog"

  let showChangeHostDialog = $state(false)

  function saveApiBaseUrl(newUrl: string) {
    if ($config.apiBaseUrl !== newUrl) {
      $config.routes = []
      $config.routeStyles = []
      $config.stopTimeOffsets = {}
    }

    $config.apiBaseUrl = newUrl
    showChangeHostDialog = false
  }
</script>

<Dialog.Root bind:open={showChangeHostDialog}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Change API server</Dialog.Title>
      <Dialog.Description>
        <span class="font-bold text-orange-500 dark:text-yellow-500">Warning</span>: Changing the
        API server will clear selected stops and routes.
      </Dialog.Description>
    </Dialog.Header>

    <ChangeHostDialog onSuccess={saveApiBaseUrl} />
  </Dialog.Content>
</Dialog.Root>

<div class="mb-5">
  <h4 class="scroll-m-20 text-xl font-semibold tracking-tight">API Server</h4>
  <div class="mb-1 text-sm italic text-muted-foreground">
    See also:
    <a href="https://transit-tracker.eastsideurbanism.org/docs/advanced/api-server" target="_blank"
      >API Server Documentation</a
    >
  </div>

  <div class="mb-2 text-sm text-muted-foreground">
    You can switch the API server your Transit Tracker uses in order to track routes from other
    transit agencies.
  </div>

  <Button size="sm" variant="secondary" onclick={() => (showChangeHostDialog = true)}>
    <Pencil />
    Change API server
  </Button>
</div>

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
