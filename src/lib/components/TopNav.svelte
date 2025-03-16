<script lang="ts">
  import { Button } from "$lib/components/ui/button"
  import { ArrowLeft } from "@lucide/svelte"
  let { children = null } = $props()
</script>

<div class="mb-4 flex w-full justify-between">
  <Button variant="link" size="small" href="/"><ArrowLeft /> Home</Button>
  {@render children?.()}
</div>
