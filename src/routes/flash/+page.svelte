<script lang="ts">
	import { goto } from "$app/navigation"
	import FlashButton from "$lib/components/FlashButton.svelte"
	import { getDeviceBaseUrl } from "$lib/device"
	import { config } from "$lib/state"

	let loading = $state(false)

	async function saveDeviceBaseUrl() {
		loading = true
		try {
			const baseUrl = await getDeviceBaseUrl()
			$config.deviceBaseUrl = baseUrl
			goto("/configure")
		} catch (e: any) {
			console.error(e)
			alert(`Failed to connect to device. Try refreshing the page.\n\nDetails: ${e.message}`)
		} finally {
			loading = false
		}
	}
</script>

<div class="layout">
	<h1>Set up device</h1>

	<p>
		From this page, you can flash the pre-built firmware for your Transit Tracker and connect it to
		your Wi-Fi network. Plug in the board and press Connect to get started.
	</p>

	<p>Once flashed, press the Next button to configure the routes you want to use.</p>

	{#if loading}
		<p>Connecting to device...</p>
	{:else}
		<div class="buttons">
			<FlashButton manifest="/firmware/manifest.json" />
			<button onclick={saveDeviceBaseUrl}>Next: Configuration</button>
		</div>
	{/if}
</div>

<style>
	.layout {
		max-width: 600px;
	}

	p {
		line-height: 1.5;
	}

	.buttons {
		display: flex;
		width: 100%;
		justify-content: space-between;
	}
</style>
