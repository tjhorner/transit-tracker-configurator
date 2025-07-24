<script lang="ts">
  import { goto } from "$app/navigation"
  import ConnectWiFi from "$lib/components/setup/ConnectWiFi.svelte"
  import TopNav from "$lib/components/TopNav.svelte"
  import * as Card from "$lib/components/ui/card"
  import { toast } from "svelte-sonner"
</script>

<TopNav />

<Card.Root class="w-xl">
  <Card.Header>
    <Card.Title>Change Wi-Fi</Card.Title>
    <Card.Description>Change the Wi-Fi network your Transit Tracker connects to.</Card.Description>
  </Card.Header>
  <Card.Content>
    <ConnectWiFi
      showInfo={true}
      onSuccess={() => {
        toast.success("Wi-Fi network changed")
        goto("/")
      }}
    />
  </Card.Content>
</Card.Root>
