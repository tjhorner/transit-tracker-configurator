<script>
  import "../app.css"
	let { children } = $props()
</script>

<div class="container">
  {@render children()}
</div>

<style>
  .container {
    display: flex;
    justify-content: center;
    align-items: center;
    height: 100%;
    width: 100%;
  }
</style>