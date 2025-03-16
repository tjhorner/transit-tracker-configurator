<script lang="ts">
  let { children } = $props()
</script>

<div class="btns">
  {@render children()}
</div>

<style>
  .btns :global(h1) {
    margin: 0;
  }

  .btns {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 1em;
    max-width: 500px;
  }

  .btns :global(button) {
    background: none;
    color: inherit;
    border: none;
    padding: 0;
    font: inherit;
    cursor: pointer;
    outline: inherit;
    text-align: left;
  }

  .btns :global(a),
  .btns :global(button) {
    display: block;
    width: 100%;
    background: #ececec;
    border-radius: 10px;
    padding: 1em;
    color: inherit;
    text-decoration: none;
    line-height: 1.25;
  }

  .btns :global(a):hover,
  .btns :global(button):hover {
    background: #ddd;
  }

  .btns :global(a):active,
  .btns :global(button):active {
    background: #ccc;
  }

  .btns :global(hr) {
    width: 100%;
    border: none;
    border-top: 1px solid #ccc;
  }

  @media (prefers-color-scheme: dark) {
    .btns :global(a),
    .btns :global(button) {
      background: #333;
      color: white;
    }

    .btns :global(a):hover,
    .btns :global(button):hover {
      background: #444;
    }

    .btns :global(a):active,
    .btns :global(button):active {
      background: #555;
    }

    .btns :global(hr) {
      border-top-color: #555;
    }
  }
</style>
