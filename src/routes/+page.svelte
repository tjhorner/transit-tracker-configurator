<script lang="ts">
  import { goto } from "$app/navigation"
  import * as Card from "$lib/components/ui/card"
  import { CircleFadingArrowUp, WandSparkles, Wifi, Wrench } from "@lucide/svelte"
  import * as Dialog from "$lib/components/ui/dialog"

  const browserSupportsWebSerial = "serial" in navigator

  let showUnsupportedBrowserDialog = $state(false)

  function goToWebSerialRequired(path: string) {
    if (browserSupportsWebSerial) {
      goto(path)
    } else {
      showUnsupportedBrowserDialog = true
    }
  }
</script>

<Card.Root>
  <Card.Header>
    <Card.Title>Transit Tracker Configurator</Card.Title>
    <Card.Description>Welcome! What would you like to do?</Card.Description>
  </Card.Header>
  <Card.Content class="grid grid-cols-2 gap-4">
    <Card.Root
      class="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80"
      onclick={() => goToWebSerialRequired("/setup")}
    >
      <Card.Header class="p-4 text-center">
        <WandSparkles class="mx-auto my-1" size={32} />
        <Card.Title>Initial setup</Card.Title>
        <Card.Description>Set up a new Transit Tracker</Card.Description>
      </Card.Header>
    </Card.Root>

    <Card.Root
      class="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80"
      onclick={() => alert("Coming soon!")}
    >
      <Card.Header class="p-4 text-center">
        <CircleFadingArrowUp class="mx-auto my-1" size={32} />
        <Card.Title>Update firmware</Card.Title>
        <Card.Description>Install the latest firmware</Card.Description>
      </Card.Header>
    </Card.Root>

    <Card.Root
      class="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80"
      onclick={() => goToWebSerialRequired("/wifi")}
    >
      <Card.Header class="p-4 text-center">
        <Wifi class="mx-auto my-1" size={32} />
        <Card.Title>Change Wi-Fi</Card.Title>
        <Card.Description>Connect to a different Wi-Fi network</Card.Description>
      </Card.Header>
    </Card.Root>

    <Card.Root
      class="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80"
      onclick={() => goto("/configure")}
    >
      <Card.Header class="p-4 text-center">
        <Wrench class="mx-auto my-1" size={32} />
        <Card.Title>Configure</Card.Title>
        <Card.Description>Change routes and customizations</Card.Description>
      </Card.Header>
    </Card.Root>
  </Card.Content>
</Card.Root>

<Dialog.Root
  open={showUnsupportedBrowserDialog}
  onOpenChange={() => (showUnsupportedBrowserDialog = false)}
>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Unsupported browser</Dialog.Title>
      <p class="leading-6">
        Setup is only supported on Chromium-based browsers since Firefox and Safari do not support
        Web Serial which is required to connect to your Transit Tracker.
      </p>

      <p class="leading-6">
        Please download a Chromium-based browser like Google Chrome or Microsoft Edge to continue.
      </p>
    </Dialog.Header>
  </Dialog.Content>
</Dialog.Root>
