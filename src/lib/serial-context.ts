import { createContext } from "svelte"

export interface SerialContext {
  getSerialPort(withBootButtonRequired?: boolean): Promise<SerialPort>
}

export const [getSerialContext, setSerialContext] = createContext<SerialContext>()
