import { describe, expect, it } from 'vitest'
import { parseMonitorsConf, serializeMonitorsConf } from './monitorsConf'
import type { NamedEntry, OpaqueEntry } from './types'

const FIXTURE = `# monitors.conf
monitor=eDP-1, 1920x1080@60, 0x0, 1
monitor=HDMI-A-2, 3440x1440@144, 1920x0, 1.5
monitor=DP-1, 2560x1440@165, 5360x0, 1, transform, 1
monitor=DP-2,disable
env = GDK_SCALE,1
monitor=,preferred,auto,1
`

describe('parseMonitorsConf', () => {
  it('parses named entries', () => {
    const conf = parseMonitorsConf(FIXTURE)
    const named = conf.entries.filter((e): e is NamedEntry => e.type === 'named' && !e.disabled)

    expect(named).toHaveLength(3)
    expect(named[0]).toMatchObject({
      type: 'named',
      port: 'eDP-1',
      width: 1920,
      height: 1080,
      refreshRate: 60,
      x: 0,
      y: 0,
      scale: 1,
      transform: 0,
      disabled: false
    })
    expect(named[1]).toMatchObject({
      port: 'HDMI-A-2',
      width: 3440,
      height: 1440,
      refreshRate: 144,
      x: 1920,
      y: 0,
      scale: 1.5,
      transform: 0
    })
    expect(named[2]).toMatchObject({
      port: 'DP-1',
      width: 2560,
      height: 1440,
      refreshRate: 165,
      x: 5360,
      y: 0,
      scale: 1,
      transform: 1
    })
  })

  it('parses disabled entries', () => {
    const conf = parseMonitorsConf(FIXTURE)
    const disabled = conf.entries.filter((e): e is NamedEntry => e.type === 'named' && e.disabled)

    expect(disabled).toHaveLength(1)
    expect(disabled[0]).toMatchObject({ type: 'named', port: 'DP-2', disabled: true })
  })

  it('parses GDK_SCALE', () => {
    const conf = parseMonitorsConf(FIXTURE)
    const gdk = conf.entries.find((e) => e.type === 'gdk_scale')

    expect(gdk).toMatchObject({ type: 'gdk_scale', value: 1 })
  })

  it('preserves catch-all line as opaque', () => {
    const conf = parseMonitorsConf(FIXTURE)
    const catchAll = conf.entries.find(
      (e): e is OpaqueEntry => e.type === 'opaque' && e.raw.includes('monitor=,preferred')
    )
    expect(catchAll).toBeDefined()
    expect(catchAll?.raw).toBe('monitor=,preferred,auto,1')
  })

  it('preserves comments as opaque', () => {
    const conf = parseMonitorsConf(FIXTURE)
    const comment = conf.entries.find(
      (e): e is OpaqueEntry => e.type === 'opaque' && e.raw.startsWith('#')
    )
    expect(comment).toBeDefined()
    expect(comment?.raw).toBe('# monitors.conf')
  })
})

describe('serializeMonitorsConf', () => {
  it('serializes a named entry to valid Hyprland syntax', () => {
    const result = serializeMonitorsConf({
      entries: [
        {
          type: 'named',
          port: 'eDP-1',
          width: 1920,
          height: 1080,
          refreshRate: 60,
          x: 0,
          y: 0,
          scale: 1,
          transform: 0,
          disabled: false
        }
      ]
    })
    expect(result).toBe('monitor=eDP-1, 1920x1080@60, 0x0, 1')
  })

  it('serializes a disabled entry', () => {
    const result = serializeMonitorsConf({
      entries: [
        {
          type: 'named',
          port: 'DP-2',
          width: 0,
          height: 0,
          refreshRate: 0,
          x: 0,
          y: 0,
          scale: 1,
          transform: 0,
          disabled: true
        }
      ]
    })
    expect(result).toBe('monitor=DP-2,disable')
  })

  it('serializes GDK_SCALE entry', () => {
    const result = serializeMonitorsConf({ entries: [{ type: 'gdk_scale', value: 2 }] })
    expect(result).toBe('env = GDK_SCALE,2')
  })

  it('preserves opaque entries verbatim', () => {
    const raw = 'monitor=,preferred,auto,1'
    const result = serializeMonitorsConf({ entries: [{ type: 'opaque', raw }] })
    expect(result).toBe(raw)
  })

  it('serializes transform when non-zero', () => {
    const result = serializeMonitorsConf({
      entries: [
        {
          type: 'named',
          port: 'DP-1',
          width: 2560,
          height: 1440,
          refreshRate: 165,
          x: 5360,
          y: 0,
          scale: 1,
          transform: 1,
          disabled: false
        }
      ]
    })
    expect(result).toBe('monitor=DP-1, 2560x1440@165, 5360x0, 1, transform, 1')
  })

  it('omits transform when zero', () => {
    const result = serializeMonitorsConf({
      entries: [
        {
          type: 'named',
          port: 'eDP-1',
          width: 1920,
          height: 1080,
          refreshRate: 60,
          x: 0,
          y: 0,
          scale: 1,
          transform: 0,
          disabled: false
        }
      ]
    })
    expect(result).not.toContain('transform')
  })
})

describe('round-trip', () => {
  it('parse → serialize → parse produces identical structure', () => {
    const conf1 = parseMonitorsConf(FIXTURE)
    const serialized = serializeMonitorsConf(conf1)
    const conf2 = parseMonitorsConf(serialized)
    expect(conf2).toEqual(conf1)
  })

  it('handles floating-point refresh rate across round-trip', () => {
    const raw = 'monitor=DP-3, 3440x1440@143.968, 0x0, 1\n'
    const conf1 = parseMonitorsConf(raw)
    const conf2 = parseMonitorsConf(serializeMonitorsConf(conf1))
    expect(conf2).toEqual(conf1)
  })

  it('handles floating-point scale across round-trip', () => {
    const raw = 'monitor=HDMI-A-1, 2560x1440@60, 0x0, 1.5\n'
    const conf1 = parseMonitorsConf(raw)
    const conf2 = parseMonitorsConf(serializeMonitorsConf(conf1))
    expect(conf2).toEqual(conf1)
  })
})
