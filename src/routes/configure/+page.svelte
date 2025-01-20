<script lang="ts">
	import ConfigOptions from "$lib/components/ConfigOptions.svelte"
	import { config } from "$lib/state"
</script>

<ConfigOptions configState={$config} />
