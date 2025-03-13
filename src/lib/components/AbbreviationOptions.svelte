<script lang="ts">
	import type { Abbreviation, ConfigState } from "$lib/state"

  interface Props {
    configState: ConfigState
    onsave: (abbreviations: Abbreviation[]) => void
  }

  let { configState, onsave }: Props = $props()

  let abbreviations: Abbreviation[] = $state(configState.abbreviations)

  function removeAbbr(index: number) {
    abbreviations.splice(index, 1)
  }

  $effect(() => {
    onsave(abbreviations)
  })
</script>

<div class="abbreviations">
  {#each abbreviations as abbr, idx}
    <div class="abbreviation">
      <input type="text" placeholder="From" bind:value={abbr.from} />
      →
      <input type="text" placeholder="To" bind:value={abbr.to} />
      <button onclick={() => removeAbbr(idx)}>&times;</button>
    </div>
  {/each}

  <button onclick={() => abbreviations.push({ from: "", to: "" })}>
    Add Abbreviation
  </button>
</div>

<style>
  .abbreviations {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    padding: 1rem;
    border: 1px solid #ccc;
    border-radius: 8px;
    background-color: #f9f9f9;
  }

  .abbreviation {
    display: flex;
    align-items: center;
    gap: 0.5rem;
  }

  .abbreviation input {
    padding: 0.5rem;
    border: 1px solid #ccc;
    border-radius: 4px;
    flex: 1;
  }

  .abbreviation button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    background-color: #ff6b6b;
    color: white;
    cursor: pointer;
  }

  .abbreviation button:hover {
    background-color: #ff4c4c;
  }

  button {
    padding: 0.5rem 1rem;
    border: none;
    border-radius: 4px;
    background-color: #4caf50;
    color: white;
    cursor: pointer;
  }

  button:hover {
    background-color: #45a049;
  }

  @media (prefers-color-scheme: dark) {
    .abbreviations {
      border-color: #555;
      background-color: #333;
    }

    .abbreviation input {
      background-color: #444;
      color: white;
      border-color: #555;
    }

    .abbreviation button {
      background-color: #ff4c4c;
    }

    .abbreviation button:hover {
      background-color: #ff3333 !important;
    }

    button {
      background-color: #45a049;
    }

    button:hover {
      background-color: #3e8e41;
    }

    button:disabled {
      background-color: #555;
    }
  }
</style>