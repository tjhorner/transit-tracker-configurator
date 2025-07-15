<script lang="ts">
  import * as Popover from "$lib/components/ui/popover"
  import { Input } from "$lib/components/ui/input"
  import type { IroColorPicker } from "@jaames/iro/dist/ColorPicker"
  import iro from "@jaames/iro"

  interface Props {
    value: string
    palette?: string[]
  }

  let { value = $bindable(), palette }: Props = $props()
  let colorPickerEl: HTMLDivElement | null = $state(null)
  let iroPicker: IroColorPicker | null = null

  function setColorFromInput(event: Event) {
    const target = event.target as HTMLInputElement
    const color = target.value

    setColor(color)

    if (target.value === "") {
      target.value = "#"
    }
  }

  function setColor(color: string) {
    if (isColorValid(color)) {
      value = color
      iroPicker?.color.set(color)
    }
  }

  function isColorValid(color: string) {
    if (color.length !== 7) {
      return false
    }

    if (color[0] !== "#") {
      return false
    }

    const s = new Option().style
    s.color = color
    return s.color !== ""
  }

  function cssColor() {
    if (isColorValid(value)) {
      return value
    }

    return "#000000"
  }

  $effect(() => {
    iroPicker?.color.set(value)
  })

  $effect(() => {
    if (!iroPicker && colorPickerEl) {
      iroPicker = iro.ColorPicker(colorPickerEl, {
        borderWidth: 1,
        width: colorPickerEl.clientWidth,
        color: cssColor()
      })

      iroPicker.on("color:change", (color: iro.Color) => {
        value = color.hexString.toUpperCase()
      })
    } else if (iroPicker && !colorPickerEl) {
      iroPicker = null
    }
  })
</script>

<Popover.Root>
  <Popover.Trigger>
    <div
      class="h-8 w-8 cursor-pointer rounded-full border-2 border-black border-opacity-30 transition-transform hover:scale-110 active:scale-95"
      style={`background-color: ${cssColor()}`}
    ></div>
  </Popover.Trigger>
  <Popover.Content class="w-56" trapFocus={false}>
    <div class="flex flex-col gap-2">
      <div bind:this={colorPickerEl} class="w-full"></div>
      <Input
        class="h-8 px-2 py-1"
        placeholder="#000000"
        maxlength={7}
        {value}
        onkeyup={setColorFromInput}
      />
      {#if palette?.length}
        <div class="flex gap-1">
          {#each palette as color}
            <button
              class="h-6 w-6 cursor-pointer rounded-sm border-2 border-black border-opacity-30 transition-transform hover:scale-110 active:scale-95"
              style={`background-color: ${color}`}
              title={color}
              aria-label={color}
              onclick={() => setColor(color)}
            ></button>
          {/each}
        </div>
      {/if}
    </div>
  </Popover.Content>
</Popover.Root>
