<script lang="ts">
  import { goto, preloadData } from "$app/navigation"
  import * as Card from "$lib/components/ui/card"
  import { CircleFadingArrowUp, WandSparkles, Wifi, Wrench } from "@lucide/svelte"
  import * as Dialog from "$lib/components/ui/dialog"
  import type { Component } from "svelte"

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

{#snippet cardLink(
  title: string,
  subtitle: string,
  href: string,
  Icon: Component,
  webSerialRequired: boolean = false
)}
  <Card.Root
    class="cursor-pointer bg-secondary text-secondary-foreground hover:bg-secondary/80"
    onmouseover={() => (!webSerialRequired || browserSupportsWebSerial) && preloadData(href)}
    onclick={() => (webSerialRequired ? goToWebSerialRequired(href) : goto(href))}
  >
    <Card.Header class="p-4 text-center">
      <Icon class="mx-auto my-1" size={32} />
      <Card.Title>{title}</Card.Title>
      <Card.Description>{subtitle}</Card.Description>
    </Card.Header>
  </Card.Root>
{/snippet}

<Card.Root>
  <Card.Header>
    <Card.Title>Transit Tracker Configurator</Card.Title>
    <Card.Description>Welcome! What would you like to do?</Card.Description>
  </Card.Header>
  <Card.Content class="grid grid-cols-2 gap-4">
    {@render cardLink(
      "Initial setup",
      "Set up a new Transit Tracker",
      "/setup",
      WandSparkles,
      true
    )}
    {@render cardLink(
      "Update firmware",
      "Install the latest firmware",
      "/update",
      CircleFadingArrowUp,
      true
    )}
    {@render cardLink("Change Wi-Fi", "Connect to a different Wi-Fi network", "/wifi", Wifi, true)}
    {@render cardLink("Configure", "Change routes and customizations", "/configure/routes", Wrench)}
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
