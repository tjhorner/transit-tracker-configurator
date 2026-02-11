<script lang="ts">
  import { Label } from "$lib/components/ui/label"
  import { Button } from "../../ui/button"
  import { Input } from "../../ui/input"
  import { config } from "$lib/state"
  import { Globe } from "@lucide/svelte"
  import { defaultBaseUrl } from "$lib/config"

  interface Props {
    onSuccess?: (baseUrl: string) => void
  }

  let { onSuccess }: Props = $props()

  let apiBaseUrl = $state($config.apiBaseUrl)
  let saving = $state(false)

  function isValidUrl(url: string): boolean {
    try {
      const parsedUrl = new URL(url)
      if (!["http:", "https:"].includes(parsedUrl.protocol)) {
        return false
      }
      return true
    } catch {
      return false
    }
  }

  async function saveApiBaseUrl() {
    if (!isValidUrl(apiBaseUrl)) {
      alert("Please enter a valid URL")
      return
    }

    if (apiBaseUrl.endsWith("/")) {
      apiBaseUrl = apiBaseUrl.slice(0, -1)
    }

    saving = true

    try {
      const resp = await fetch(`${apiBaseUrl}/feeds`, {
        method: "GET"
      })

      if (!resp.ok) {
        throw new Error(`${resp.status} ${resp.statusText}`)
      }
    } catch (e: any) {
      alert(`Unable to connect to the API server at ${apiBaseUrl}. Error: ${e.message}`)
      saving = false
      return
    }

    try {
      onSuccess?.(apiBaseUrl)
    } catch (e: any) {
      alert(`Unable to update API base URL. Error: ${e.message}`)
    } finally {
      saving = false
    }
  }

  function resetToDefault() {
    apiBaseUrl = defaultBaseUrl
  }
</script>

<div class="flex flex-col gap-4">
  <div class="flex flex-col gap-2">
    <Label for="api-url" class="flex items-center gap-2">
      <Globe class="h-4 w-4" />
      API Base URL
    </Label>
    <Input
      placeholder="https://api.example.com"
      bind:value={apiBaseUrl}
      name="api-url"
      id="api-url"
      type="url"
    />
    <p class="text-sm text-muted-foreground">The base URL for the Transit Tracker API to use</p>
  </div>

  <div class="flex gap-2">
    <Button
      class="flex-grow"
      onclick={saveApiBaseUrl}
      disabled={!apiBaseUrl || saving || !isValidUrl(apiBaseUrl)}
    >
      Save API URL
    </Button>
    <Button variant="outline" onclick={resetToDefault} disabled={saving}>Reset</Button>
  </div>
</div>
