export interface NamedEntry {
  type: 'named'
  port: string
  width: number
  height: number
  refreshRate: number
  x: number
  y: number
  scale: number
  transform: number
  disabled: boolean
}

export interface GdkScaleEntry {
  type: 'gdk_scale'
  value: number
}

export interface OpaqueEntry {
  type: 'opaque'
  raw: string
}

export type ConfigEntry = NamedEntry | GdkScaleEntry | OpaqueEntry

export interface MonitorsConf {
  entries: ConfigEntry[]
}

export interface HyprctlMonitor {
  name: string
  width: number
  height: number
  x: number
  y: number
  scale: number
  refreshRate: number
  availableModes: string[]
  transform: number
}
