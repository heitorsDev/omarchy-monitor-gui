import { describe, expect, it } from 'vitest'
import { parseHyprctlMonitors } from './hyprctlMonitors'

const FIXTURE_JSON = JSON.stringify([
  {
    id: 0,
    name: 'eDP-1',
    description: 'AU Optronics 0x2036 Unknown',
    make: 'AU Optronics',
    model: '0x2036',
    serial: '',
    width: 1920,
    height: 1080,
    refreshRate: 60.0,
    x: 0,
    y: 0,
    activeWorkspace: { id: 1, name: '1' },
    specialWorkspace: { id: 0, name: '' },
    reserved: [0, 0, 0, 0],
    scale: 1.0,
    transform: 0,
    focused: true,
    dpmsStatus: true,
    vrr: false,
    activelyTearing: false,
    currentFormat: 'XRGB8888',
    availableModes: ['1920x1080@60.00Hz', '1280x720@60.00Hz']
  },
  {
    id: 1,
    name: 'HDMI-A-2',
    description: 'Dell U3421WE',
    make: 'Dell',
    model: 'U3421WE',
    serial: 'ABC123',
    width: 3440,
    height: 1440,
    refreshRate: 143.968,
    x: 1920,
    y: 0,
    activeWorkspace: { id: 2, name: '2' },
    specialWorkspace: { id: 0, name: '' },
    reserved: [0, 0, 0, 0],
    scale: 1.5,
    transform: 1,
    focused: false,
    dpmsStatus: true,
    vrr: false,
    activelyTearing: false,
    currentFormat: 'XRGB8888',
    availableModes: ['3440x1440@143.97Hz', '1920x1080@60.00Hz']
  }
])

describe('parseHyprctlMonitors', () => {
  it('maps JSON array to internal monitor shape', () => {
    const monitors = parseHyprctlMonitors(FIXTURE_JSON)

    expect(monitors).toHaveLength(2)
    expect(monitors[0]).toEqual({
      name: 'eDP-1',
      width: 1920,
      height: 1080,
      x: 0,
      y: 0,
      scale: 1,
      refreshRate: 60,
      availableModes: ['1920x1080@60.00Hz', '1280x720@60.00Hz'],
      transform: 0
    })
  })

  it('maps availableModes correctly', () => {
    const monitors = parseHyprctlMonitors(FIXTURE_JSON)
    expect(monitors[1].availableModes).toEqual(['3440x1440@143.97Hz', '1920x1080@60.00Hz'])
  })

  it('maps transform correctly', () => {
    const monitors = parseHyprctlMonitors(FIXTURE_JSON)
    expect(monitors[1].transform).toBe(1)
  })

  it('maps non-integer refresh rate', () => {
    const monitors = parseHyprctlMonitors(FIXTURE_JSON)
    expect(monitors[1].refreshRate).toBe(143.968)
  })

  it('maps position and scale', () => {
    const monitors = parseHyprctlMonitors(FIXTURE_JSON)
    expect(monitors[1]).toMatchObject({ x: 1920, y: 0, scale: 1.5 })
  })

  it('returns empty array for empty JSON', () => {
    expect(parseHyprctlMonitors('[]')).toEqual([])
  })
})
