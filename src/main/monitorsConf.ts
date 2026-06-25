import type { ConfigEntry, MonitorsConf, NamedEntry } from './types'

const PORT_RE = /^[A-Za-z][A-Za-z0-9-]*/

function parseMonitorLine(originalLine: string): ConfigEntry {
  const trimmed = originalLine.trim()
  const body = trimmed.slice('monitor='.length)
  const commaIdx = body.indexOf(',')

  if (commaIdx === -1) {
    return { type: 'opaque', raw: originalLine }
  }

  const port = body.slice(0, commaIdx).trim()
  if (!PORT_RE.test(port)) {
    return { type: 'opaque', raw: originalLine }
  }

  const rest = body.slice(commaIdx + 1).trim()

  if (rest.toLowerCase() === 'disable') {
    const entry: NamedEntry = {
      type: 'named',
      port,
      width: 0,
      height: 0,
      refreshRate: 0,
      x: 0,
      y: 0,
      scale: 1,
      transform: 0,
      disabled: true
    }
    return entry
  }

  const parts = rest.split(',').map((p) => p.trim())
  if (parts.length < 3) {
    return { type: 'opaque', raw: originalLine }
  }

  const modeMatch = parts[0].match(/^(\d+)x(\d+)@([\d.]+)$/)
  if (!modeMatch) {
    return { type: 'opaque', raw: originalLine }
  }

  const posMatch = parts[1].match(/^(-?\d+)x(-?\d+)$/)
  if (!posMatch) {
    return { type: 'opaque', raw: originalLine }
  }

  const width = parseInt(modeMatch[1], 10)
  const height = parseInt(modeMatch[2], 10)
  const refreshRate = parseFloat(modeMatch[3])
  const x = parseInt(posMatch[1], 10)
  const y = parseInt(posMatch[2], 10)
  const scale = parseFloat(parts[2])

  let transform = 0
  if (parts.length >= 5 && parts[3].toLowerCase() === 'transform') {
    transform = parseInt(parts[4], 10)
  }

  const entry: NamedEntry = {
    type: 'named',
    port,
    width,
    height,
    refreshRate,
    x,
    y,
    scale,
    transform,
    disabled: false
  }
  return entry
}

export function parseMonitorsConf(raw: string): MonitorsConf {
  const lines = raw.split('\n')
  const entries: ConfigEntry[] = []

  for (const line of lines) {
    const trimmed = line.trim()

    if (trimmed === '' || trimmed.startsWith('#')) {
      entries.push({ type: 'opaque', raw: line })
      continue
    }

    const gdkMatch = trimmed.match(/^env\s*=\s*GDK_SCALE\s*,\s*([\d.]+)$/)
    if (gdkMatch) {
      entries.push({ type: 'gdk_scale', value: parseFloat(gdkMatch[1]) })
      continue
    }

    if (trimmed.startsWith('monitor=')) {
      entries.push(parseMonitorLine(line))
      continue
    }

    entries.push({ type: 'opaque', raw: line })
  }

  return { entries }
}

export function serializeMonitorsConf(conf: MonitorsConf): string {
  return conf.entries
    .map((entry) => {
      if (entry.type === 'opaque') return entry.raw

      if (entry.type === 'gdk_scale') {
        return `env = GDK_SCALE,${entry.value}`
      }

      if (entry.disabled) {
        return `monitor=${entry.port},disable`
      }

      const mode = `${entry.width}x${entry.height}@${entry.refreshRate}`
      const pos = `${entry.x}x${entry.y}`
      const base = `monitor=${entry.port}, ${mode}, ${pos}, ${entry.scale}`

      if (entry.transform !== 0) {
        return `${base}, transform, ${entry.transform}`
      }

      return base
    })
    .join('\n')
}
