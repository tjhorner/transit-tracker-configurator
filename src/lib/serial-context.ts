import { createContext } from "svelte"

export interface SerialContext {
  getOpenSerialPort(withBootButtonRequired?: boolean): Promise<SerialPort>
}

export const [getSerialContext, setSerialContext] = createContext<SerialContext>()
