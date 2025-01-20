<script>
	let { children } = $props()
</script>

<div class="container">
  {@render children()}
</div>

<style>
  :global(body, html) {
    margin: 0;
    height: 100%;
    width: 100%;
    font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
    background: #f9f9f9;
  }
  
  :global(*, * *) {
    box-sizing: border-box;
  }

  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
  }
</style>