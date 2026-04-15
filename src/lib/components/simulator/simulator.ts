import { FONT_BITMAP, type Glyph, GLYPH_TABLE } from "./font"

export interface Trip {
  routeId: string
  routeName: string
  routeColor: Color
  headsign: string
  arrivalTime: number
  departureTime: number
  isRealtime: boolean
}

export interface Color {
  r: number
  g: number
  b: number
}

export type UnitDisplay = "long" | "short" | "none"

export interface SimulatorOptions {
  width?: number
  height?: number
  pixelPitch?: number
  glowRadius?: number
  glowAlpha?: number
  brightness?: number
  limit?: number
  unitDisplay?: UnitDisplay
  displayDepartureTimes?: boolean
  scrollHeadsigns?: boolean
  realtimeColor?: Color
}

function colorToCSS(c: Color): string {
  return `rgb(${c.r},${c.g},${c.b})`
}

function colorToGlowCSS(c: Color, alpha: number): string {
  return `rgba(${c.r},${c.g},${c.b},${alpha})`
}

export function hexColor(hex: number): Color {
  return {
    r: (hex >> 16) & 0xff,
    g: (hex >> 8) & 0xff,
    b: hex & 0xff
  }
}

const GLYPH_MAP = new Map<number, Glyph>()
for (const g of GLYPH_TABLE) {
  GLYPH_MAP.set(g.codePoint, g)
}

const FONT_BASELINE = 8
const FONT_DESCENDER = 2

class BitmapFont {
  getAscender(): number {
    return FONT_BASELINE
  }
  getDescender(): number {
    return FONT_DESCENDER
  }

  getGlyph(codePoint: number): Glyph | undefined {
    return GLYPH_MAP.get(codePoint)
  }

  measureText(text: string): number {
    let x = 0
    for (let i = 0; i < text.length; i++) {
      const glyph = this.getGlyph(text.charCodeAt(i))
      if (glyph) x += glyph.advance
    }
    return x
  }

  drawText(fb: PixelFramebuffer, x: number, y: number, text: string, color: Color) {
    let cursorX = x
    for (let i = 0; i < text.length; i++) {
      const glyph = this.getGlyph(text.charCodeAt(i))
      if (!glyph) continue
      this.drawGlyph(fb, cursorX + glyph.offsetX, y + glyph.offsetY, glyph, color)
      cursorX += glyph.advance
    }
  }

  private drawGlyph(fb: PixelFramebuffer, x: number, y: number, glyph: Glyph, color: Color) {
    let byteIndex = glyph.dataOffset
    let bitmask = 0
    let pixelData = 0

    for (let gy = 0; gy < glyph.height; gy++) {
      for (let gx = 0; gx < glyph.width; gx++) {
        if (bitmask === 0) {
          pixelData = FONT_BITMAP[byteIndex++]
          bitmask = 0x80
        }
        if ((pixelData & bitmask) !== 0) {
          fb.drawPixel(x + gx, y + gy, color)
        }
        bitmask >>= 1
      }
    }
  }
}

interface ClipRect {
  x1: number
  y1: number
  x2: number
  y2: number
}

class PixelFramebuffer {
  readonly width: number
  readonly height: number
  readonly data: Uint8Array // RGBA format

  private clip: ClipRect | null = null

  constructor(width: number, height: number) {
    this.width = width
    this.height = height
    this.data = new Uint8Array(width * height * 4)
  }

  clear() {
    this.data.fill(0)
  }

  startClipping(x1: number, y1: number, x2: number, y2: number) {
    this.clip = { x1, y1, x2, y2 }
  }

  endClipping() {
    this.clip = null
  }

  drawPixel(x: number, y: number, color: Color) {
    if (x < 0 || x >= this.width || y < 0 || y >= this.height) return
    if (this.clip) {
      if (x < this.clip.x1 || x >= this.clip.x2 || y < this.clip.y1 || y >= this.clip.y2) return
    }
    const idx = (y * this.width + x) * 4
    this.data[idx] = color.r
    this.data[idx + 1] = color.g
    this.data[idx + 2] = color.b
    this.data[idx + 3] = 255
  }
}

function formatDurationFromNow(
  unixTimestamp: number,
  rtcNow: number,
  unitDisplay: UnitDisplay
): string {
  const diff = unixTimestamp - rtcNow

  if (diff < 30) return "Now"

  if (diff < 60) {
    switch (unitDisplay) {
      case "long":
        return "0min"
      case "short":
        return "0m"
      case "none":
        return "0"
    }
  }

  const minutes = Math.floor(diff / 60)

  if (minutes < 60) {
    switch (unitDisplay) {
      case "long":
        return `${minutes}min`
      case "short":
        return `${minutes}m`
      case "none":
        return `${minutes}`
    }
  }

  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  switch (unitDisplay) {
    case "long":
    case "short":
      return `${hours}h${remainingMinutes}m`
    case "none":
      return `${hours}:${String(remainingMinutes).padStart(2, "0")}`
  }
}

const REALTIME_ICON: number[][] = [
  [0, 0, 0, 3, 3, 3],
  [0, 0, 3, 0, 0, 0],
  [0, 3, 0, 0, 2, 2],
  [3, 0, 0, 2, 0, 0],
  [3, 0, 2, 0, 0, 1],
  [3, 0, 2, 0, 1, 1]
]

function drawRealtimeIcon(
  fb: PixelFramebuffer,
  bottomRightX: number,
  bottomRightY: number,
  uptime: number,
  realtimeColor: Color,
  realtimeColorDark: Color
) {
  const numFrames = 6
  const idleFrameDuration = 3000
  const animFrameDuration = 200
  const cycleDuration = idleFrameDuration + (numFrames - 1) * animFrameDuration

  const cycleTime = uptime % cycleDuration
  let frame: number
  if (cycleTime < idleFrameDuration) {
    frame = 0
  } else {
    frame = 1 + Math.floor((cycleTime - idleFrameDuration) / animFrameDuration)
  }

  const isSegmentLit = (segment: number): boolean => {
    switch (segment) {
      case 1:
        return frame >= 1 && frame <= 3
      case 2:
        return frame >= 2 && frame <= 4
      case 3:
        return frame >= 3 && frame <= 5
      default:
        return false
    }
  }

  for (let i = 0; i < 6; i++) {
    for (let j = 0; j < 6; j++) {
      const segment = REALTIME_ICON[i][j]
      if (segment === 0) continue
      const color = isSegmentLit(segment) ? realtimeColor : realtimeColorDark
      fb.drawPixel(bottomRightX - (5 - j), bottomRightY - (5 - i), color)
    }
  }
}

const SCROLL_SPEED = 10 // pixels/second
const IDLE_TIME_LEFT = 5000 // ms
const IDLE_TIME_RIGHT = 1000 // ms

class CanvasRenderer {
  private ctx: CanvasRenderingContext2D

  private dpr: number

  constructor(
    private canvas: HTMLCanvasElement,
    private displayWidth: number,
    private displayHeight: number,
    private pitch: number,
    private glowRadius: number,
    private glowAlpha: number,
    private brightness: number = 1
  ) {
    this.dpr = window.devicePixelRatio || 1
    this.setCanvasSize()
    this.ctx = canvas.getContext("2d")!
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  private setCanvasSize() {
    this.canvas.width = this.displayWidth * this.pitch * this.dpr
    this.canvas.height = this.displayHeight * this.pitch * this.dpr
  }

  render(fb: PixelFramebuffer) {
    const ctx = this.ctx
    const pitch = this.pitch
    const pixelRadius = pitch * 0.35

    ctx.fillStyle = "#0a0a0a"
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height)

    // Draw unlit pixel grid (subtle dots)
    ctx.fillStyle = "rgba(30,30,30,0.5)"
    for (let y = 0; y < this.displayHeight; y++) {
      for (let x = 0; x < this.displayWidth; x++) {
        const cx = x * pitch + pitch / 2
        const cy = y * pitch + pitch / 2
        ctx.beginPath()
        ctx.arc(cx, cy, pixelRadius * 0.6, 0, Math.PI * 2)
        ctx.fill()
      }
    }

    // Draw lit pixels with glow
    ctx.save()
    for (let y = 0; y < this.displayHeight; y++) {
      for (let x = 0; x < this.displayWidth; x++) {
        const idx = (y * fb.width + x) * 4
        const a = fb.data[idx + 3]
        if (a === 0) continue

        const r = Math.min(255, Math.round(fb.data[idx] * this.brightness))
        const g = Math.min(255, Math.round(fb.data[idx + 1] * this.brightness))
        const b = Math.min(255, Math.round(fb.data[idx + 2] * this.brightness))

        const cx = x * pitch + pitch / 2
        const cy = y * pitch + pitch / 2

        if (this.glowRadius > 0) {
          ctx.shadowBlur = this.glowRadius
          ctx.shadowColor = colorToGlowCSS({ r, g, b }, this.glowAlpha)
        } else {
          ctx.shadowBlur = 0
        }

        ctx.fillStyle = colorToCSS({ r, g, b })
        ctx.beginPath()
        ctx.arc(cx, cy, pixelRadius, 0, Math.PI * 2)
        ctx.fill()
      }
    }
    ctx.restore()
  }

  resize(displayWidth: number, displayHeight: number) {
    this.displayWidth = displayWidth
    this.displayHeight = displayHeight
    this.setCanvasSize()
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  setPitch(pitch: number) {
    this.pitch = pitch
    this.setCanvasSize()
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0)
  }

  setGlow(radius: number, alpha: number) {
    this.glowRadius = radius
    this.glowAlpha = alpha
  }

  setBrightness(brightness: number) {
    this.brightness = brightness
  }
}

export class TransitTrackerSimulator {
  private fb: PixelFramebuffer
  private renderer: CanvasRenderer
  private font = new BitmapFont()
  private trips: Trip[] = []
  private animationId: number | null = null
  private startTime = 0

  private width: number
  private height: number
  private limit: number
  private unitDisplay: UnitDisplay
  private displayDepartureTimes: boolean
  private scrollHeadsigns: boolean
  private realtimeColor: Color
  private realtimeColorDark: Color

  constructor(canvas: HTMLCanvasElement, options: SimulatorOptions = {}) {
    this.width = options.width ?? 128
    this.height = options.height ?? 32
    this.limit = options.limit ?? 3
    this.unitDisplay = options.unitDisplay ?? "short"
    this.displayDepartureTimes = options.displayDepartureTimes ?? true
    this.scrollHeadsigns = options.scrollHeadsigns ?? true
    this.realtimeColor = options.realtimeColor ?? { r: 0x20, g: 0xff, b: 0x00 }
    this.realtimeColorDark = {
      r: Math.floor(this.realtimeColor.r * 0.5),
      g: Math.floor(this.realtimeColor.g * 0.5),
      b: Math.floor(this.realtimeColor.b * 0.5)
    }

    this.fb = new PixelFramebuffer(this.width, this.height)
    this.renderer = new CanvasRenderer(
      canvas,
      this.width,
      this.height,
      options.pixelPitch ?? 4,
      options.glowRadius ?? 4,
      options.glowAlpha ?? 0.6,
      options.brightness ?? 1
    )
  }

  setTrips(trips: Trip[]) {
    this.trips = trips
  }

  start() {
    if (this.animationId !== null) return
    this.startTime = performance.now()
    const loop = () => {
      this.drawFrame()
      this.animationId = requestAnimationFrame(loop)
    }
    this.animationId = requestAnimationFrame(loop)
  }

  stop() {
    if (this.animationId !== null) {
      cancelAnimationFrame(this.animationId)
      this.animationId = null
    }
  }

  private drawFrame() {
    this.fb.clear()

    if (this.trips.length === 0) {
      const msg = "No upcoming departures"
      const color = { r: 150, g: 150, b: 150 }
      const textWidth = this.font.measureText(msg)
      const x = Math.floor((this.width - textWidth) / 2)
      const y = Math.floor((this.height - (this.font.getAscender() + this.font.getDescender())) / 2)
      this.font.drawText(this.fb, x, y, msg, color)
      this.renderer.render(this.fb)
      return
    }

    const uptime = performance.now() - this.startTime
    const rtcNow = Math.floor(Date.now() / 1000)
    const fontAscender = this.font.getAscender()
    const fontDescender = this.font.getDescender()
    const nominalFontHeight = fontAscender + fontDescender

    // Two-pass headsign overflow measurement for synchronized scrolling
    let scrollCycleDuration = 0
    if (this.scrollHeadsigns) {
      let largestOverflow = 0
      for (const trip of this.trips) {
        const overflow = this.measureTripHeadsignOverflow(trip, nominalFontHeight, rtcNow)
        largestOverflow = Math.max(largestOverflow, overflow)
      }
      if (largestOverflow > 0) {
        const longestScrollTime = Math.floor((largestOverflow * 1000) / SCROLL_SPEED)
        scrollCycleDuration = IDLE_TIME_LEFT + IDLE_TIME_RIGHT + 2 * longestScrollTime
      }
    }

    // Vertical centering (matching C++ logic)
    const maxTripsHeight = this.limit * fontAscender + (this.limit - 1) * fontDescender
    let yOffset = Math.floor((this.height % maxTripsHeight) / 2)

    for (const trip of this.trips) {
      this.drawTrip(trip, yOffset, nominalFontHeight, uptime, rtcNow, scrollCycleDuration)
      yOffset += nominalFontHeight
    }

    this.renderer.render(this.fb)
  }

  private measureTripHeadsignOverflow(trip: Trip, fontHeight: number, rtcNow: number): number {
    const routeWidth = this.font.measureText(trip.routeName)
    const timeText = formatDurationFromNow(
      this.displayDepartureTimes ? trip.departureTime : trip.arrivalTime,
      rtcNow,
      this.unitDisplay
    )
    const timeWidth = this.font.measureText(timeText)

    let headsignClippingStart = routeWidth + 3
    let headsignClippingEnd = this.width - timeWidth - 2
    if (trip.isRealtime) headsignClippingEnd -= 8

    const headsignMaxWidth = headsignClippingEnd - headsignClippingStart
    const headsignActualWidth = this.font.measureText(trip.headsign)
    return Math.max(0, headsignActualWidth - headsignMaxWidth)
  }

  private drawTrip(
    trip: Trip,
    yOffset: number,
    fontHeight: number,
    uptime: number,
    rtcNow: number,
    scrollCycleDuration: number
  ) {
    // Route name (left-aligned)
    this.font.drawText(this.fb, 0, yOffset, trip.routeName, trip.routeColor)
    const routeWidth = this.font.measureText(trip.routeName)

    // Time display (right-aligned)
    const timeText = formatDurationFromNow(
      this.displayDepartureTimes ? trip.departureTime : trip.arrivalTime,
      rtcNow,
      this.unitDisplay
    )
    const timeWidth = this.font.measureText(timeText)
    const timeColor = trip.isRealtime ? this.realtimeColor : { r: 0xa7, g: 0xa7, b: 0xa7 }
    this.font.drawText(this.fb, this.width + 1 - timeWidth, yOffset, timeText, timeColor)

    // Headsign clipping bounds
    const headsignClippingStart = routeWidth + 3
    let headsignClippingEnd = this.width - timeWidth - 2

    // Realtime icon
    if (trip.isRealtime) {
      headsignClippingEnd -= 8
      const iconBottomRightX = this.width - timeWidth - 2
      const iconBottomRightY = yOffset + fontHeight - 6
      drawRealtimeIcon(
        this.fb,
        iconBottomRightX,
        iconBottomRightY,
        uptime,
        this.realtimeColor,
        this.realtimeColorDark
      )
    }

    // Headsign with scroll
    const headsignMaxWidth = headsignClippingEnd - headsignClippingStart
    const headsignActualWidth = this.font.measureText(trip.headsign)
    const headsignOverflow = headsignActualWidth - headsignMaxWidth

    let scrollOffset = 0
    if (headsignOverflow > 0 && scrollCycleDuration > 0) {
      const scrollTime = Math.floor((headsignOverflow * 1000) / SCROLL_SPEED)
      const scrollCycleTime = uptime % scrollCycleDuration

      if (scrollCycleTime < IDLE_TIME_LEFT) {
        // Idle left
      } else if (scrollCycleTime < IDLE_TIME_LEFT + scrollTime) {
        // Scrolling left
        const timeSinceStart = scrollCycleTime - IDLE_TIME_LEFT
        scrollOffset = Math.floor((timeSinceStart * SCROLL_SPEED) / 1000)
      } else if (scrollCycleTime < IDLE_TIME_LEFT + scrollTime + IDLE_TIME_RIGHT) {
        // Idle right
        scrollOffset = headsignOverflow
      } else if (scrollCycleTime < IDLE_TIME_LEFT + 2 * scrollTime + IDLE_TIME_RIGHT) {
        // Scrolling right
        const timeSinceStart = scrollCycleTime - (IDLE_TIME_LEFT + scrollTime + IDLE_TIME_RIGHT)
        scrollOffset = headsignOverflow - Math.floor((timeSinceStart * SCROLL_SPEED) / 1000)
      }
    }

    this.fb.startClipping(headsignClippingStart, 0, headsignClippingEnd, this.height)
    this.font.drawText(this.fb, headsignClippingStart - scrollOffset, yOffset, trip.headsign, {
      r: 0xff,
      g: 0xff,
      b: 0xff
    })
    this.fb.endClipping()
  }
}
