import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

export async function getSerialPort() {
  const pairedPorts = await navigator.serial.getPorts()
  if (pairedPorts.length === 1) {
    return pairedPorts[0]
  }

  return await navigator.serial.requestPort({
    filters: [{ usbVendorId: 0x303a, usbProductId: 0x1001 }]
  })
}

export function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural
}
