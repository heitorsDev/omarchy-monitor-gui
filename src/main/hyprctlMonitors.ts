import type { HyprctlMonitor } from './types'

interface HyprctlRaw {
  name: string
  width: number
  height: number
  refreshRate: number
  x: number
  y: number
  scale: number
  transform: number
  availableModes: string[]
}

export function parseHyprctlMonitors(json: string): HyprctlMonitor[] {
  const raw = JSON.parse(json) as HyprctlRaw[]

  return raw.map((m) => ({
    name: m.name,
    width: m.width,
    height: m.height,
    x: m.x,
    y: m.y,
    scale: m.scale,
    refreshRate: m.refreshRate,
    availableModes: m.availableModes,
    transform: m.transform
  }))
}
