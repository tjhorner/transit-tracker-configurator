<script lang="ts">
  import "esp-web-tools"
  let { manifest } = $props()
</script>

<esp-web-install-button {manifest}>
  <button slot="activate">Flash Firmware</button>
</esp-web-install-button>
