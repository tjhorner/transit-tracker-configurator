<script lang="ts">
  import CustomizeConfig from "$lib/components/configuration/CustomizeConfig.svelte"
  import PushConfigButton from "$lib/components/configuration/PushConfigButton.svelte"
  import RouteConfig from "$lib/components/configuration/RouteConfig.svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { Separator } from "$lib/components/ui/separator"
  import * as Tabs from "$lib/components/ui/tabs"
  import { getDeviceBaseUrl } from "$lib/device"
  import { config } from "$lib/state"
  import * as Dialog from "$lib/components/ui/dialog"
  import { ArrowLeft, Cable, Cog, FileCode, Paintbrush, Route, Unplug } from "@lucide/svelte"
  import ConnectDialog from "$lib/components/configuration/ConnectDialog.svelte"
  import TopNav from "$lib/components/TopNav.svelte"

  let connectedIp = $derived(new URL($config.deviceBaseUrl ?? "http://127.0.0.1").hostname)

  let showConnectDialog = $state(false)

  function setBaseUrl(url: string) {
    $config.deviceBaseUrl = url
    showConnectDialog = false
  }
</script>

<Dialog.Root bind:open={showConnectDialog}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Connect device</Dialog.Title>
      <Dialog.Description>
        You can connect to your Transit Tracker automatically via USB or enter its IP manually. It
        must be on the same network as this computer in either case.
      </Dialog.Description>
    </Dialog.Header>

    <ConnectDialog onSuccess={setBaseUrl} />
  </Dialog.Content>
</Dialog.Root>

<TopNav>
  <div class="flex items-center gap-1 text-sm text-muted-foreground">
    {#if $config.deviceBaseUrl}
      Connected: <span class="font-mono">{connectedIp}</span>
      <Button
        variant="link"
        size="small"
        class="ml-4"
        onclick={() => ($config.deviceBaseUrl = undefined)}>Disconnect</Button
      >
    {:else}
      <Unplug size={16} class="text-muted-foreground" />
      <span>Not connected to device</span>
    {/if}
  </div>
</TopNav>

<Card.Root class="w-xl">
  <Card.Header>
    <Card.Title>Configuration</Card.Title>
    <Card.Description>Change how your Transit Tracker looks and acts.</Card.Description>
  </Card.Header>
  <Card.Content>
    <Tabs.Root value="routes">
      <Tabs.List class="mb-4 grid w-full grid-cols-3">
        <Tabs.Trigger value="routes">
          <Route size={16} class="mr-1" />
          Routes
        </Tabs.Trigger>
        <Tabs.Trigger value="customize">
          <Paintbrush size={16} class="mr-1" />
          Customize
        </Tabs.Trigger>
        <Tabs.Trigger value="advanced">
          <Cog size={16} class="mr-1" />
          Advanced
        </Tabs.Trigger>
      </Tabs.List>

      <Tabs.Content value="routes">
        <RouteConfig />
      </Tabs.Content>

      <Tabs.Content value="customize">
        <CustomizeConfig />
      </Tabs.Content>

      <Tabs.Content value="advanced">
        There will be advanced options here one day. But today is apparently not that day.
      </Tabs.Content>
    </Tabs.Root>

    <Separator class="my-4" />

    <div class="flex w-full gap-2">
      <div class="flex flex-grow flex-col gap-1">
        {#if $config.deviceBaseUrl}
          <PushConfigButton />
        {:else}
          <Button class="flex-grow" onclick={() => (showConnectDialog = true)}>
            <Cable /> Connect device
          </Button>
        {/if}
      </div>

      <!-- <Button class="flex-grow" variant="secondary">
        <FileCode /> Generate YAML
      </Button> -->
    </div>
  </Card.Content>
</Card.Root>
