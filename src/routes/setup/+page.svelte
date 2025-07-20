<script lang="ts">
  import ConnectWiFi from "$lib/components/setup/ConnectWiFi.svelte"
  import FirmwareFlasher from "$lib/components/setup/FirmwareFlasher.svelte"
  import TopNav from "$lib/components/TopNav.svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import * as Tabs from "$lib/components/ui/tabs"
  import { deviceConnection } from "$lib/state"
  import { ArrowRight, CheckCircle, Cog, Cpu, Wifi } from "@lucide/svelte"

  let firmwareFlashSuccess = $state(false)
  let step = $state("firmware")

  function onWiFiSetupSuccess() {
    $deviceConnection.type = "usb"
    step = "configure"
  }
</script>

<TopNav />

<Card.Root class="w-xl">
  <Card.Header>
    <Card.Title>Initial setup</Card.Title>
    <Card.Description>Let's set up your new Transit Tracker!</Card.Description>
  </Card.Header>
  <Card.Content>
    <Tabs.Root value={step}>
      <Tabs.List class="mb-4 grid w-full grid-cols-3">
        <Tabs.Trigger value="firmware" disabled={step !== "firmware"}>
          <Cpu size={16} class="mr-1" />
          Flash firmware
        </Tabs.Trigger>
        <Tabs.Trigger value="wifi" disabled={step !== "wifi"}>
          <Wifi size={16} class="mr-1" />
          Connect Wi-Fi
        </Tabs.Trigger>
        <Tabs.Trigger value="configure" disabled={step !== "configure"}>
          <Cog size={16} class="mr-1" />
          Configure
        </Tabs.Trigger>
      </Tabs.List>
      <Tabs.Content value="firmware">
        <p>
          If this is the first time setting up your Transit Tracker, you'll
          first need to perform the following steps:
        </p>

        <ol class="my-3 ml-6 list-decimal">
          <li>Press and hold the button labeled BOOT on the board.</li>
          <li>With BOOT held, press and release the RESET button quickly.</li>
          <li>Release the BOOT button.</li>
        </ol>

        <FirmwareFlasher eraseFlash={true} onSuccess={() => (firmwareFlashSuccess = true)} />

        {#if firmwareFlashSuccess}
          <Button class="mt-4 w-full" variant="secondary" onclick={() => (step = "wifi")}>
            Continue to Wi-Fi setup <ArrowRight />
          </Button>
        {/if}
      </Tabs.Content>
      <Tabs.Content value="wifi">
        {#if step === "wifi"}
          <!-- hack otherwise it will mount even when not this step -->
          <ConnectWiFi onSuccess={onWiFiSetupSuccess} />
        {/if}
      </Tabs.Content>
      <Tabs.Content value="configure">
        <div class="flex items-center gap-2 text-xl">
          <CheckCircle size={24} class="text-green-400" />
          <strong>Setup complete!</strong>
        </div>

        <p class="mt-2 leading-6">
          Your Transit Tracker is now set up and ready to configure. Click the button below to set
          your routes and customizations.
        </p>

        <Button class="mt-4 w-full" href="/configure">
          Continue to configuration <ArrowRight />
        </Button>
      </Tabs.Content>
    </Tabs.Root>
  </Card.Content>
</Card.Root>
