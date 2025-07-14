export interface SetEntityResult {
  ok: boolean
  name: string
}

export class ConfigValidationError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "ConfigValidationError"
  }
}

export interface TransitTrackerDevice {
  close?(): Promise<void>

  setTextEntity(id: string, value: string): Promise<SetEntityResult>
  setSelectEntity(id: string, value: string): Promise<SetEntityResult>
  setSwitchEntity(id: string, value: "ON" | "OFF"): Promise<SetEntityResult>
  pressButton(id: string): Promise<SetEntityResult>
}
