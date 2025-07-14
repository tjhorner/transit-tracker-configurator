<script lang="ts">
  import { goto } from "$app/navigation"
  import FirmwareFlasher from "$lib/components/setup/FirmwareFlasher.svelte"
  import TopNav from "$lib/components/TopNav.svelte"
  import * as Card from "$lib/components/ui/card"
  import { toast } from "svelte-sonner"
</script>

<TopNav />

<Card.Root class="w-xl">
  <Card.Header>
    <Card.Title>Update firmware</Card.Title>
    <Card.Description>Get the latest features and bug fixes.</Card.Description>
  </Card.Header>
  <Card.Content>
    <FirmwareFlasher
      file="https://transit-tracker.eastsideurbanism.org/firmware/firmware.bin"
      offset={0x10000}
      eraseFlash={false}
      bootButtonRequired={false}
      onSuccess={() => {
        toast.success("Firmware updated")
        goto("/")
      }}
    />
  </Card.Content>
</Card.Root>
