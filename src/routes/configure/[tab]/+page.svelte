<script lang="ts">
  import CustomizeConfig from "$lib/components/configuration/customize/CustomizeConfig.svelte"
  import PushConfigButton from "$lib/components/configuration/PushConfigButton.svelte"
  import RouteConfig from "$lib/components/configuration/routes/RouteConfig.svelte"
  import { Button } from "$lib/components/ui/button"
  import * as Card from "$lib/components/ui/card"
  import { Separator } from "$lib/components/ui/separator"
  import * as Tabs from "$lib/components/ui/tabs"
  import { config, deviceConnection, type DeviceConnection } from "$lib/state"
  import * as Dialog from "$lib/components/ui/dialog"
  import { Cable, Cog, FileCode, Paintbrush, Route, Unplug, Usb, Wifi } from "@lucide/svelte"
  import ConnectDialog from "$lib/components/configuration/ConnectDialog.svelte"
  import TopNav from "$lib/components/TopNav.svelte"
  import GenerateYamlDialog from "$lib/components/configuration/GenerateYamlDialog.svelte"
  import { page } from "$app/state"
  import { goto } from "$app/navigation"
  import LogsDialog from "$lib/components/configuration/LogsDialog.svelte"
  import AdvancedConfig from "$lib/components/configuration/advanced/AdvancedConfig.svelte"

  let showConnectDialog = $state(false)
  let showLogsDialog = $state(false)
  let showYamlDialog = $state(false)

  let connectedIp = $derived(new URL($deviceConnection.baseUrl ?? "http://127.0.0.1").hostname)

  function setDeviceConnection(connection: DeviceConnection) {
    $deviceConnection = connection
    showConnectDialog = false
  }
</script>

<Dialog.Root bind:open={showConnectDialog}>
  <Dialog.Content>
    <Dialog.Header>
      <Dialog.Title>Connect device</Dialog.Title>
      <Dialog.Description>
        You can connect to your Transit Tracker via a USB connection to your computer or via your
        local network.
      </Dialog.Description>
    </Dialog.Header>

    <ConnectDialog onSuccess={setDeviceConnection} />
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showLogsDialog}>
  <Dialog.Content class="max-h-full max-w-7xl">
    <Dialog.Header>
      <Dialog.Title>Logs</Dialog.Title>
    </Dialog.Header>

    {#if showLogsDialog}
      <LogsDialog />
    {/if}
  </Dialog.Content>
</Dialog.Root>

<Dialog.Root bind:open={showYamlDialog}>
  <Dialog.Content class="max-h-screen overflow-y-auto">
    <Dialog.Header>
      <Dialog.Title>Generate YAML</Dialog.Title>
      <Dialog.Description>
        You can use this YAML with the
        <Button
          variant="link"
          size="small"
          href="https://transit-tracker.eastsideurbanism.org/docs/advanced/esphome-component"
          target="_blank">Transit Tracker ESPHome component</Button
        >.
      </Dialog.Description>
    </Dialog.Header>

    <GenerateYamlDialog />
  </Dialog.Content>
</Dialog.Root>

<TopNav>
  <div class="flex items-center gap-1 text-sm text-muted-foreground">
    {#if $deviceConnection.type === "usb"}
      <Usb size={16} class="text-muted-foreground" />
      USB connection
    {:else if $deviceConnection.type === "network"}
      <Wifi size={16} class="text-muted-foreground" />
      <Button variant="link" target="_blank" size="small" href={$deviceConnection.baseUrl}
        >{connectedIp}</Button
      >
    {:else}
      <Unplug size={16} class="text-muted-foreground" />
      Not connected
    {/if}

    <Button
      variant="link"
      size="small"
      class="ml-4 hover:text-red-500"
      onclick={() => (showConnectDialog = true)}>Change</Button
    >
  </div>
</TopNav>

<Card.Root class="w-xl">
  <Card.Header>
    <Card.Title>Configuration</Card.Title>
    <Card.Description>Change how your Transit Tracker looks and acts.</Card.Description>
  </Card.Header>
  <Card.Content>
    <Tabs.Root value={page.params.tab} onValueChange={(value) => goto(`./${value}`)}>
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
        <!-- silly thing to get around terrible state model (sorry) -->
        {#if page.params.tab === "customize"}
          <CustomizeConfig />
        {/if}
      </Tabs.Content>

      <Tabs.Content value="advanced">
        <AdvancedConfig />
      </Tabs.Content>
    </Tabs.Root>

    <Separator class="my-4" />

    <div class="flex w-full gap-2">
      <div class="flex flex-grow flex-col gap-1">
        {#if $deviceConnection.type !== "none"}
          <PushConfigButton />
        {:else}
          <Button class="flex-grow" onclick={() => (showConnectDialog = true)}>
            <Cable /> Connect device
          </Button>
        {/if}
      </div>

      <Button class="flex-grow" variant="secondary" onclick={() => (showYamlDialog = true)}>
        <FileCode /> Generate YAML
      </Button>
    </div>
  </Card.Content>
</Card.Root>
