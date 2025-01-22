<script>
  import "../app.css"
	let { children } = $props()
</script>

<svelte:head>
  <title>Countdown Display Configurator</title>
</svelte:head>

<div class="container">
  {@render children()}
</div>

<style>
  .container {
    display: flex;
    justify-content: safe center;
    align-items: safe center;
    height: 100%;
    width: 100%;
  }
</style>