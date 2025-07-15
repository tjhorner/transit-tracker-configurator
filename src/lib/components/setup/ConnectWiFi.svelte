<script lang="ts" module>
  import { z } from "zod"

  export const formSchema = z.object({
    ssid: z.string().nonempty(),
    password: z.string()
  })

  type FormSchema = typeof formSchema
  export type { FormSchema }
</script>

<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import {
    Cable,
    RefreshCw,
    SignalHigh,
    SignalMedium,
    SignalLow,
    LockKeyhole
  } from "@lucide/svelte"
  import { getSerialPort } from "$lib/utils"
  import * as Form from "$lib/components/ui/form"
  import { Input } from "$lib/components/ui/input"
  import * as Select from "$lib/components/ui/select"
  import { zodClient } from "sveltekit-superforms/adapters"
  import { type Infer, superForm } from "sveltekit-superforms"
  import { onMount } from "svelte"
  import { ESPHomeRpcClient, type WiFiNetwork } from "$lib/esphome-rpc"

  interface Props {
    onSuccess?: () => void
  }

  let { onSuccess }: Props = $props()

  let scanning = $state(false)
  let connecting = $state(false)

  let foundNetworks = $state<WiFiNetwork[]>([])

  let manualSsidEntry = $state(false)

  let selectedNetworkIsSecure = $derived(
    manualSsidEntry || foundNetworks.find((network) => network.ssid === $formData.ssid)?.auth
  )

  let port: SerialPort | null = $state(null)
  let rpcClient: ESPHomeRpcClient | null = $state(null)

  async function initializeRpc() {
    port = await getSerialPort()

    try {
      await port.open({ baudRate: 115200 })
    } catch (e: any) {
      if (e.message.includes("Failed to open serial port")) {
        alert(
          "Couldn't open serial port. Please close all other browser tabs or applications that might be connecting to the device."
        )
        return
      }

      if (!e.message.endsWith("already open.")) {
        alert(`Unable to connect to Transit Tracker. Error: ${e.message}`)
        return
      }
    }

    rpcClient = new ESPHomeRpcClient(port)

    try {
      await rpcClient.connect()
    } catch (error: any) {
      alert(`Your Transit Tracker doesn't seem to be responding properly. Please try pressing the RESET button on the board and try again. Error: ${error.message || error}`)
      await rpcClient.disconnect()
    }

    rpcClient.addEventListener("disconnect", () => {
      rpcClient = null
    })
  }

  async function scanForNetworks() {
    scanning = true

    if (!rpcClient) {
      await initializeRpc()
    }

    try {
      let tries = 0
      while (tries < 3) {
        if (!rpcClient) {
          break
        }

        const networks = await rpcClient!.scanWifiNetworks()
        foundNetworks = networks.sort((a, b) => b.rssi - a.rssi)

        if (foundNetworks.length > 0) {
          break
        }

        tries++
        await new Promise((resolve) => setTimeout(resolve, 5000))
      }
    } finally {
      scanning = false
    }
  }

  async function provision() {
    connecting = true

    try {
      if (!rpcClient) {
        await initializeRpc()
      }

      await rpcClient!.connectToWifi($formData.ssid, $formData.password)
      onSuccess?.()
    } catch (error: any) {
      console.error("Failed to connect to WiFi:", error)
      alert(`Failed to connect to WiFi: ${error.message || error}`)
    } finally {
      connecting = false
    }
  }

  const form = superForm<Infer<FormSchema>>(
    {
      ssid: "",
      password: ""
    },
    {
      validators: zodClient(formSchema)
    }
  )

  const { form: formData } = form

  onMount(() => {
    scanForNetworks()

    return async () => {
      await rpcClient?.disconnect()
      await port?.close()
    }
  })
</script>

{#if rpcClient}
  <div class="flex flex-col gap-2">
    <Form.Field {form} name="ssid">
      <Form.Control>
        {#snippet children({ props })}
          <Form.Label>Network</Form.Label>
          {#if manualSsidEntry}
            <Input {...props} bind:value={$formData.ssid} disabled={connecting} />
          {:else}
            <Select.Root
              type="single"
              bind:value={$formData.ssid}
              name={props.name}
              disabled={connecting || scanning || foundNetworks.length === 0}
            >
              <Select.Trigger {...props}>
                {#if scanning}
                  Scanning for networks...
                {:else if foundNetworks.length === 0}
                  No networks found
                {:else}
                  {$formData.ssid || "Choose a network"}
                {/if}
              </Select.Trigger>
              <Select.Content>
                {#each foundNetworks as network}
                  <Select.Item value={network.ssid}>
                    {@const iconClass = "relative bottom-1"}
                    {#if network.rssi > -50}
                      <SignalHigh class={`${iconClass} text-green-400`} />
                    {:else if network.rssi > -70}
                      <SignalMedium class={`${iconClass} text-yellow-400`} />
                    {:else}
                      <SignalLow class={`${iconClass} text-red-400`} />
                    {/if}
                    {#if network.auth}
                      <LockKeyhole size={12} class="mr-1" />
                    {/if}
                    {network.ssid}
                    <span class="ml-2 text-muted-foreground">{network.rssi} dBm</span>
                  </Select.Item>
                {/each}
              </Select.Content>
            </Select.Root>
          {/if}
        {/snippet}
      </Form.Control>
      <Form.Description>
        {#if !manualSsidEntry && !scanning}
          Can't find your network? <Button
            variant="link"
            size="small"
            onclick={() => (manualSsidEntry = !manualSsidEntry)}>Manually enter name</Button
          >
        {/if}
      </Form.Description>
      <Form.FieldErrors />
    </Form.Field>

    {#if selectedNetworkIsSecure}
      <Form.Field {form} name="password">
        <Form.Control>
          {#snippet children({ props })}
            <Form.Label>Password</Form.Label>
            <Input
              {...props}
              bind:value={$formData.password}
              type="password"
              disabled={connecting}
              autocomplete="off"
            />
          {/snippet}
        </Form.Control>
        <Form.FieldErrors />
      </Form.Field>
    {/if}

    <div class="flex flex-col gap-2 sm:flex-row">
      <Button
        variant="secondary"
        class="w-full sm:w-1/3"
        disabled={scanning || connecting}
        onclick={scanForNetworks}
      >
        <RefreshCw />
        {#if scanning}
          Scanning...
        {:else}
          Refresh
        {/if}
      </Button>

      <Button
        class="w-full sm:w-2/3"
        disabled={$formData.ssid === "" || connecting}
        onclick={provision}
      >
        <Cable />
        {#if connecting}
          Connecting to network...
        {:else}
          Connect
        {/if}
      </Button>
    </div>

    <p class="mt-1 text-sm text-muted-foreground">
      <strong>Note</strong>: Only 2.4 GHz networks are supported. You may need to change your
      router's settings if you can't see your network in the list.
    </p>
  </div>
{:else}
  <p class="mb-4 leading-6">
    Connection to your Transit Tracker was lost. Please connect it to your computer and click the
    button below to try again.
  </p>

  <Button class="w-full" disabled={connecting} onclick={scanForNetworks}>
    <Cable />
    {#if connecting}
      Connecting to Transit Tracker...
    {:else}
      Connect to Transit Tracker
    {/if}
  </Button>
{/if}
