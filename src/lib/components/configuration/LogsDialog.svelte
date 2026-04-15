<script lang="ts">
  import "@xterm/xterm/css/xterm.css"
  import { Terminal } from "@xterm/xterm"
  import { FitAddon } from "@xterm/addon-fit"
  import { onMount } from "svelte"
  import { Button } from "../ui/button"
  import { getSerialContext } from "$lib/serial-context"

  const ctx = getSerialContext()

  let logsEl: HTMLDivElement | null = null
  let terminal: Terminal | null = null
  let port: SerialPort | null = null

  let abortController: AbortController = new AbortController()
  let logHistory: string[] = []

  class LineBreakTransformer implements Transformer<string, string> {
    private chunks = ""

    transform(chunk: string, controller: TransformStreamDefaultController<string>) {
      // Append new chunks to existing chunks.
      this.chunks += chunk
      // For each line breaks in chunks, send the parsed lines out.
      const lines = this.chunks.split("\r\n")
      this.chunks = lines.pop()!
      lines.forEach((line) => controller.enqueue(line + "\r\n"))
    }

    flush(controller: TransformStreamDefaultController<string>) {
      // When the stream is closed, flush any remaining chunks out.
      controller.enqueue(this.chunks)
    }
  }

  class TimestampTransformer implements Transformer<string, string> {
    transform(chunk: string, controller: TransformStreamDefaultController<string>) {
      const date = new Date()
      controller.enqueue(`[${date.toISOString()}]${chunk}`)
    }
  }

  function removeAnsiCodes(str: string) {
    return str.replace(/\x1B\[[0-9;]*m/g, "")
  }

  async function connectTerminal() {
    port = await ctx.getSerialPort()

    try {
      await port.open({ baudRate: 115200 })
    } catch (e: any) {
      if (e.message.includes("already open")) {
        await port.close()
        await port.open({ baudRate: 115200 })
      }
    }

    try {
      await port.readable
        ?.pipeThrough(new TextDecoderStream(), {
          signal: abortController.signal
        })
        .pipeThrough(new TransformStream(new LineBreakTransformer()))
        .pipeThrough(new TransformStream(new TimestampTransformer()))
        .pipeTo(
          new WritableStream({
            write: (chunk) => {
              terminal?.write(chunk)
              logHistory.push(removeAnsiCodes(chunk))
            }
          })
        )
    } catch (e: any) {
      if (e.name === "AbortError") {
        console.log("Stream aborted")
      } else {
        console.error("Error reading from port:", e)
      }
    } finally {
      setTimeout(async () => {
        await port?.close()
      }, 0)
    }
  }

  function downloadLogs() {
    const blob = new Blob([logHistory.join("\n")], { type: "text/plain" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `transit-tracker-logs-${new Date().toISOString()}.txt`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  onMount(() => {
    terminal = new Terminal()
    const fitAddon = new FitAddon()
    terminal.loadAddon(fitAddon)
    terminal.open(logsEl!)
    fitAddon.fit()
    connectTerminal()

    return () => {
      abortController.abort()
      terminal?.dispose()
    }
  })
</script>

<div bind:this={logsEl} id="logs"></div>

<Button variant="secondary" onclick={downloadLogs}>Download logs</Button>
