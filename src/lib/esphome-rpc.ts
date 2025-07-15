/**
 * ESPHome Serial RPC Client
 * A TypeScript client for communicating with ESPHome devices over Web Serial using JSON-RPC
 */

// Entity types enum
enum EntityType {
  TEXT = 1,
  SELECT = 2,
  SWITCH = 3,
  BUTTON = 4
}

// Base interface for JSON-RPC requests
interface JsonRpcRequest {
  jsonrpc: string
  method: string
  params?: any
  id: number
}

// Base interface for JSON-RPC responses
interface JsonRpcResponse {
  jsonrpc: string
  id: number
  result?: any
  error?: {
    code: number
    message: string
  }
}

// Device info response
interface DeviceInfo {
  name: string
  ip_address: string
  ssid: string
  esphome_version: string
  project_version: string
}

// WiFi network information
export interface WiFiNetwork {
  ssid: string
  rssi: number
  channel: number
  auth: boolean
}

// Text entity properties
interface TextEntity {
  id: string
  type: EntityType.TEXT
  value: string
  mode: number
  min_length: number
  max_length: number
  pattern: string
}

// Select entity properties
interface SelectEntity {
  id: string
  type: EntityType.SELECT
  value: string
  options: string[]
}

// Switch entity properties
interface SwitchEntity {
  id: string
  type: EntityType.SWITCH
  value: "ON" | "OFF"
}

// Button entity properties
interface ButtonEntity {
  id: string
  type: EntityType.BUTTON
}

// Generic entity response type
type Entity = TextEntity | SelectEntity | SwitchEntity | ButtonEntity

/**
 * ESPHome Serial RPC Client
 */
export class ESPHomeRpcClient extends EventTarget {
  private port: SerialPort
  private reader: ReadableStreamDefaultReader<Uint8Array> | null = null
  private writer: WritableStreamDefaultWriter<Uint8Array> | null = null
  private requestId = 1
  private decoder = new TextDecoder()
  private encoder = new TextEncoder()
  private buffer = ""
  private pendingRequests = new Map<
    number,
    { resolve: (value: any) => void; reject: (reason?: any) => void }
  >()
  private eventListeners = new Map<string, ((data: any) => void)[]>()
  private magicHeader = "JRPC:"

  /**
   * Create a new ESPHome RPC client using Web Serial
   * @param port An open Web Serial port
   */
  constructor(port: SerialPort) {
    super()
    this.port = port
  }

  /**
   * Connect to the device and start reading
   */
  async connect(): Promise<void> {
    try {
      this.reader = this.port.readable!.getReader()
      this.writer = this.port.writable!.getWriter()

      // Start reading from the serial port
      this.startReading()

      console.log("Connected to ESPHome device")
    } catch (error) {
      console.error("Failed to connect:", error)
      throw error
    }
  }

  /**
   * Disconnect from the device
   */
  async disconnect(): Promise<void> {
    try {
      // Clear any pending requests with errors
      for (const [id, { reject }] of this.pendingRequests.entries()) {
        reject(new Error("Disconnected"))
        this.pendingRequests.delete(id)
      }

      let didDisconnect = false

      // Release the reader and writer
      if (this.reader) {
        try {
          this.reader.releaseLock()
        } catch (e: any) {
          console.warn("Error releasing reader lock:", e)
        }

        this.reader = null
        didDisconnect = true
      }

      if (this.writer) {
        try {
          this.writer.releaseLock()
        } catch (e: any) {
          console.warn("Error releasing writer lock:", e)
        }

        this.writer = null
        didDisconnect = true
      }

      if (didDisconnect) {
        this.dispatchEvent(new Event("disconnect"))
        console.log("Disconnected from ESPHome device")
      }
    } catch (error) {
      console.error("Error during disconnect:", error)
      throw error
    }
  }

  /**
   * Get device information (name, IP address, SSID)
   */
  async getDeviceInfo(): Promise<DeviceInfo> {
    const response = await this.sendRequest({
      jsonrpc: "2.0",
      method: "device.info",
      id: this.getNextRequestId()
    })

    return response.result as DeviceInfo
  }

  /**
   * Get the state of a text entity
   * @param id The entity ID
   */
  async getTextEntity(id: string): Promise<TextEntity> {
    const response = await this.sendRequest({
      jsonrpc: "2.0",
      method: "entity.get",
      params: {
        id,
        type: EntityType.TEXT
      },
      id: this.getNextRequestId()
    })

    return response.result as TextEntity
  }

  /**
   * Set the value of a text entity
   * @param id The entity ID
   * @param value The new text value
   */
  async setTextEntity(id: string, value: string): Promise<boolean> {
    const response = await this.sendRequest({
      jsonrpc: "2.0",
      method: "entity.set",
      params: {
        id,
        type: EntityType.TEXT,
        value
      },
      id: this.getNextRequestId()
    })

    return response.result?.success === true
  }

  /**
   * Get the state of a select entity
   * @param id The entity ID
   */
  async getSelectEntity(id: string): Promise<SelectEntity> {
    const response = await this.sendRequest({
      jsonrpc: "2.0",
      method: "entity.get",
      params: {
        id,
        type: EntityType.SELECT
      },
      id: this.getNextRequestId()
    })

    return response.result as SelectEntity
  }

  /**
   * Set the value of a select entity
   * @param id The entity ID
   * @param option The option to select
   */
  async setSelectEntity(id: string, option: string): Promise<boolean> {
    const response = await this.sendRequest({
      jsonrpc: "2.0",
      method: "entity.set",
      params: {
        id,
        type: EntityType.SELECT,
        value: option
      },
      id: this.getNextRequestId()
    })

    return response.result?.success === true
  }

  /**
   * Get the state of a switch entity
   * @param id The entity ID
   */
  async getSwitchEntity(id: string): Promise<SwitchEntity> {
    const response = await this.sendRequest({
      jsonrpc: "2.0",
      method: "entity.get",
      params: {
        id,
        type: EntityType.SWITCH
      },
      id: this.getNextRequestId()
    })

    return response.result as SwitchEntity
  }

  /**
   * Turn a switch on or off
   * @param id The entity ID
   * @param state ON or OFF
   */
  async setSwitchEntity(id: string, state: "ON" | "OFF"): Promise<boolean> {
    const response = await this.sendRequest({
      jsonrpc: "2.0",
      method: "entity.set",
      params: {
        id,
        type: EntityType.SWITCH,
        value: state
      },
      id: this.getNextRequestId()
    })

    return response.result?.success === true
  }

  /**
   * Press a button
   * @param id The button entity ID
   */
  async pressButton(id: string): Promise<boolean> {
    const response = await this.sendRequest({
      jsonrpc: "2.0",
      method: "button.press",
      params: {
        id
      },
      id: this.getNextRequestId()
    })

    return response.result?.success === true
  }

  /**
   * Scan for WiFi networks
   * @returns Array of WiFi networks
   */
  async scanWifiNetworks(): Promise<WiFiNetwork[]> {
    const response = await this.sendRequest({
      jsonrpc: "2.0",
      method: "wifi.scan",
      id: this.getNextRequestId()
    })

    return (response.result?.networks as WiFiNetwork[]) || []
  }

  /**
   * Connect to a WiFi network
   * @param ssid The network SSID
   * @param password The network password
   * @returns Promise that resolves when connected
   */
  async connectToWifi(ssid: string, password: string): Promise<boolean> {
    // First, set up event listeners
    return new Promise<boolean>((resolve, reject) => {
      // Listen for success event
      const successHandler = (data: any) => {
        this.removeRpcEventListener("wifi.connect.success", successHandler)
        this.removeRpcEventListener("wifi.connect.error", errorHandler)
        resolve(true)
      }

      // Listen for error event
      const errorHandler = (data: any) => {
        this.removeRpcEventListener("wifi.connect.success", successHandler)
        this.removeRpcEventListener("wifi.connect.error", errorHandler)
        reject(new Error(data.message || "Failed to connect to WiFi"))
      }

      this.addRpcEventListener("wifi.connect.success", successHandler)
      this.addRpcEventListener("wifi.connect.error", errorHandler)

      // Send the connection request
      this.sendRequest({
        jsonrpc: "2.0",
        method: "wifi.settings",
        params: {
          ssid,
          password
        },
        id: this.getNextRequestId()
      }).catch((error) => {
        this.removeRpcEventListener("wifi.connect.success", successHandler)
        this.removeRpcEventListener("wifi.connect.error", errorHandler)
        reject(error)
      })

      // Set a timeout for connection (60 seconds)
      setTimeout(() => {
        this.removeRpcEventListener("wifi.connect.success", successHandler)
        this.removeRpcEventListener("wifi.connect.error", errorHandler)
        reject(new Error("Connection timeout"))
      }, 60000)
    })
  }

  /**
   * Add an event listener for server-sent events
   * @param event The event name
   * @param listener The callback function
   */
  addRpcEventListener(event: string, listener: (data: any) => void): void {
    const listeners = this.eventListeners.get(event) || []
    listeners.push(listener)
    this.eventListeners.set(event, listeners)
  }

  /**
   * Remove an event listener
   * @param event The event name
   * @param listener The callback function to remove
   */
  removeRpcEventListener(event: string, listener: (data: any) => void): void {
    const listeners = this.eventListeners.get(event)
    if (listeners) {
      const index = listeners.indexOf(listener)
      if (index !== -1) {
        listeners.splice(index, 1)
        if (listeners.length === 0) {
          this.eventListeners.delete(event)
        } else {
          this.eventListeners.set(event, listeners)
        }
      }
    }
  }

  /**
   * Helper method to get the next request ID
   */
  private getNextRequestId(): number {
    return this.requestId++
  }

  /**
   * Send a JSON-RPC request and wait for a response
   * @param request The JSON-RPC request object
   */
  private async sendRequest(request: JsonRpcRequest): Promise<JsonRpcResponse> {
    if (!this.writer) {
      throw new Error("Not connected")
    }
    
    console.log("Sending request:", request)

    return new Promise<JsonRpcResponse>((resolve, reject) => {
      const id = request.id

      // Store the promise callbacks for later resolution
      this.pendingRequests.set(id, { resolve, reject })

      // Serialize the request
      const jsonString = JSON.stringify(request)
      const data = this.encoder.encode(this.magicHeader + jsonString + "\r\n")

      // Send the request
      this.writer!.write(data).catch((error) => {
        this.pendingRequests.delete(id)
        reject(error)
      })
    })
  }

  /**
   * Start reading from the serial port
   */
  private async startReading(): Promise<void> {
    if (!this.reader) {
      throw new Error("Not connected")
    }

    try {
      while (true) {
        const { value, done } = await this.reader.read()

        if (done) {
          // The stream has been canceled
          break
        }

        // Process the received data
        this.processData(value)
      }
    } catch (error: any) {
      if (!error.message.includes("Releasing")) {
        await this.disconnect()
        throw error
      }
    }
  }

  /**
   * Process received data from the serial port
   * @param chunk The received data chunk
   */
  private processData(chunk: Uint8Array): void {
    // Decode the received data and add it to our buffer
    const text = this.decoder.decode(chunk)
    this.buffer += text

    // Process any complete lines in the buffer
    let lineEndIndex: number
    while ((lineEndIndex = this.buffer.indexOf("\n")) !== -1) {
      // Extract the line
      let line = this.buffer.substring(0, lineEndIndex).trim()

      // Remove the processed line from the buffer
      this.buffer = this.buffer.substring(lineEndIndex + 1)

      // Check if this is a JSON-RPC message (starts with our magic header)
      if (line.startsWith(this.magicHeader)) {
        // Extract the JSON part (after the magic header)
        const jsonPart = line.substring(this.magicHeader.length)

        try {
          // Parse the JSON message
          const message = JSON.parse(jsonPart)

          console.log("Received message:", message)

          // Check if this is a response or an event
          if (message.method && !message.id) {
            // This is a server-sent event
            console.log("Received server event:", message.method)

            // Notify any listeners for this event
            const listeners = this.eventListeners.get(message.method)
            if (listeners) {
              for (const listener of listeners) {
                try {
                  listener(message.params)
                } catch (error) {
                  console.error("Error in event listener:", error)
                }
              }
            }
          } else if (message.id !== undefined) {
            // This is a response to a request
            const response = message as JsonRpcResponse

            // Find and resolve the corresponding request
            if (this.pendingRequests.has(response.id)) {
              const { resolve, reject } = this.pendingRequests.get(response.id)!

              if (response.error) {
                reject(
                  new Error(`JSON-RPC error: ${response.error.message} (${response.error.code})`)
                )
              } else {
                resolve(response)
              }

              // Remove the resolved request
              this.pendingRequests.delete(response.id)
            }
          }
        } catch (error) {
          console.error("Error parsing JSON-RPC message:", error)
        }
      }
    }
  }
}
