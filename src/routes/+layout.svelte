<script>
  import { ModeWatcher } from "mode-watcher"
  import { Toaster } from "$lib/components/ui/sonner"
  import "../app.css"
  import SerialPortProvider from "$lib/components/SerialPortProvider.svelte"

  let { children } = $props()
</script>

<svelte:head>
  <title>Transit Tracker Configurator</title>
</svelte:head>

<ModeWatcher />
<Toaster position="bottom-center" />

<SerialPortProvider>
  <div class="layout-container">
    <div class="py-12">
      {@render children()}
    </div>
  </div>
</SerialPortProvider>

<style>
  .layout-container {
    display: flex;
    flex-direction: column;
    /* justify-content: safe center; */
    align-items: safe center;
    height: 100%;
    width: 100%;
  }
</style>
