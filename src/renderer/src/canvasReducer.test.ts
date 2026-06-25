import { describe, expect, it } from 'vitest'
import {
  applySnap,
  canvasReducer,
  initialCanvasState,
  parseModeString,
  SNAP_THRESHOLD
} from './canvasReducer'
import type { CanvasState, MonitorPosition } from './canvasReducer'
import type { Monitor } from './types'

const monA: Monitor = {
  name: 'eDP-1',
  width: 200,
  height: 100,
  x: 0,
  y: 0,
  scale: 1,
  refreshRate: 60,
  availableModes: ['200x100@60.00Hz', '200x100@30.00Hz'],
  transform: 0
}

const monB: Monitor = {
  name: 'HDMI-A-1',
  width: 200,
  height: 100,
  x: 300,
  y: 0,
  scale: 1,
  refreshRate: 60,
  availableModes: ['200x100@60.00Hz'],
  transform: 0
}

function initState(monitors: Monitor[]): CanvasState {
  return canvasReducer(initialCanvasState, { type: 'INIT', monitors })
}

describe('INIT', () => {
  it('populates monitors from Monitor array', () => {
    const s = initState([monA, monB])
    expect(s.monitors).toHaveLength(2)
    expect(s.monitors[0]).toMatchObject({ name: 'eDP-1', x: 0, y: 0, width: 200, height: 100 })
    expect(s.monitors[1]).toMatchObject({ name: 'HDMI-A-1', x: 300, y: 0 })
  })

  it('clears drag state', () => {
    const stateWithDrag: CanvasState = {
      ...initialCanvasState,
      drag: { name: 'eDP-1', startMouseX: 0, startMouseY: 0, origX: 0, origY: 0, scale: 1 }
    }
    const s = canvasReducer(stateWithDrag, { type: 'INIT', monitors: [monA] })
    expect(s.drag).toBeNull()
  })
})

describe('SELECT', () => {
  it('sets selected monitor', () => {
    const s0 = initState([monA])
    const s1 = canvasReducer(s0, { type: 'SELECT', name: 'eDP-1' })
    expect(s1.selected).toBe('eDP-1')
  })

  it('deselects when passed null', () => {
    const s0 = { ...initState([monA]), selected: 'eDP-1' }
    const s1 = canvasReducer(s0, { type: 'SELECT', name: null })
    expect(s1.selected).toBeNull()
  })
})

describe('DRAG_START', () => {
  it('records drag origin and selects the monitor', () => {
    const s0 = initState([monA, monB])
    const s1 = canvasReducer(s0, {
      type: 'DRAG_START',
      name: 'eDP-1',
      mouseX: 50,
      mouseY: 30,
      scale: 0.5
    })
    expect(s1.selected).toBe('eDP-1')
    expect(s1.drag).toMatchObject({
      name: 'eDP-1',
      startMouseX: 50,
      startMouseY: 30,
      origX: 0,
      origY: 0,
      scale: 0.5
    })
  })

  it('is a no-op for unknown monitor name', () => {
    const s0 = initState([monA])
    const s1 = canvasReducer(s0, {
      type: 'DRAG_START',
      name: 'DP-99',
      mouseX: 0,
      mouseY: 0,
      scale: 1
    })
    expect(s1).toBe(s0)
  })
})

describe('DRAG_MOVE', () => {
  it('updates dragged monitor position using scale', () => {
    // scale=1, so 1 mouse px = 1 monitor px
    const s0 = initState([monA, monB])
    const s1 = canvasReducer(s0, {
      type: 'DRAG_START',
      name: 'eDP-1',
      mouseX: 0,
      mouseY: 0,
      scale: 1
    })
    const s2 = canvasReducer(s1, { type: 'DRAG_MOVE', mouseX: 50, mouseY: 20 })
    const moved = s2.monitors.find((m) => m.name === 'eDP-1')!
    expect(moved.x).toBe(50)
    expect(moved.y).toBe(20)
  })

  it('converts mouse delta via scale', () => {
    // scale=0.5: 20 mouse px / 0.5 = 40 monitor px
    const s0 = initState([monA])
    const s1 = canvasReducer(s0, {
      type: 'DRAG_START',
      name: 'eDP-1',
      mouseX: 100,
      mouseY: 100,
      scale: 0.5
    })
    const s2 = canvasReducer(s1, { type: 'DRAG_MOVE', mouseX: 120, mouseY: 110 })
    const moved = s2.monitors.find((m) => m.name === 'eDP-1')!
    expect(moved.x).toBe(40)
    expect(moved.y).toBe(20)
  })

  it('is a no-op when not dragging', () => {
    const s0 = initState([monA])
    const s1 = canvasReducer(s0, { type: 'DRAG_MOVE', mouseX: 100, mouseY: 100 })
    expect(s1).toBe(s0)
  })

  it('does not move stationary monitors', () => {
    const s0 = initState([monA, monB])
    const s1 = canvasReducer(s0, {
      type: 'DRAG_START',
      name: 'eDP-1',
      mouseX: 0,
      mouseY: 0,
      scale: 1
    })
    const s2 = canvasReducer(s1, { type: 'DRAG_MOVE', mouseX: 10, mouseY: 0 })
    const stationary = s2.monitors.find((m) => m.name === 'HDMI-A-1')!
    expect(stationary.x).toBe(300)
  })
})

describe('DRAG_END', () => {
  it('clears drag state', () => {
    const s0 = initState([monA])
    const s1 = canvasReducer(s0, {
      type: 'DRAG_START',
      name: 'eDP-1',
      mouseX: 0,
      mouseY: 0,
      scale: 1
    })
    const s2 = canvasReducer(s1, { type: 'DRAG_END' })
    expect(s2.drag).toBeNull()
  })

  it('preserves final position after drag', () => {
    const s0 = initState([monA])
    const s1 = canvasReducer(s0, {
      type: 'DRAG_START',
      name: 'eDP-1',
      mouseX: 0,
      mouseY: 0,
      scale: 1
    })
    const s2 = canvasReducer(s1, { type: 'DRAG_MOVE', mouseX: 50, mouseY: 30 })
    const s3 = canvasReducer(s2, { type: 'DRAG_END' })
    expect(s3.monitors[0]).toMatchObject({ x: 50, y: 30 })
  })
})

describe('parseModeString', () => {
  it('parses standard mode string', () => {
    expect(parseModeString('1920x1080@60.00Hz')).toEqual({ width: 1920, height: 1080, refreshRate: 60 })
  })

  it('parses high-refresh mode', () => {
    expect(parseModeString('3440x1440@143.97Hz')).toEqual({ width: 3440, height: 1440, refreshRate: 143.97 })
  })

  it('returns null for invalid format', () => {
    expect(parseModeString('invalid')).toBeNull()
    expect(parseModeString('1920x1080@60')).toBeNull()
  })
})

describe('SET_MODE', () => {
  it('updates width, height, refreshRate from mode string', () => {
    const s0 = canvasReducer(initialCanvasState, {
      type: 'INIT',
      monitors: [{ ...monA, availableModes: ['200x100@60.00Hz', '100x50@30.00Hz'] }]
    })
    const s1 = canvasReducer(s0, { type: 'SET_MODE', name: 'eDP-1', mode: '100x50@30.00Hz' })
    const m = s1.monitors.find((m) => m.name === 'eDP-1')!
    expect(m.width).toBe(100)
    expect(m.height).toBe(50)
    expect(m.refreshRate).toBe(30)
  })

  it('is a no-op for invalid mode string', () => {
    const s0 = canvasReducer(initialCanvasState, { type: 'INIT', monitors: [monA] })
    const s1 = canvasReducer(s0, { type: 'SET_MODE', name: 'eDP-1', mode: 'bad' })
    expect(s1).toBe(s0)
  })
})

describe('UPDATE_MONITOR', () => {
  it('updates scale', () => {
    const s0 = canvasReducer(initialCanvasState, { type: 'INIT', monitors: [monA] })
    const s1 = canvasReducer(s0, { type: 'UPDATE_MONITOR', name: 'eDP-1', patch: { scale: 1.5 } })
    expect(s1.monitors[0].scale).toBe(1.5)
  })

  it('updates transform', () => {
    const s0 = canvasReducer(initialCanvasState, { type: 'INIT', monitors: [monA] })
    const s1 = canvasReducer(s0, { type: 'UPDATE_MONITOR', name: 'eDP-1', patch: { transform: 1 } })
    expect(s1.monitors[0].transform).toBe(1)
  })

  it('disables a monitor', () => {
    const s0 = canvasReducer(initialCanvasState, { type: 'INIT', monitors: [monA] })
    const s1 = canvasReducer(s0, { type: 'UPDATE_MONITOR', name: 'eDP-1', patch: { disabled: true } })
    expect(s1.monitors[0].disabled).toBe(true)
  })

  it('re-enables a disabled monitor', () => {
    const s0 = canvasReducer(initialCanvasState, { type: 'INIT', monitors: [monA] })
    const s1 = canvasReducer(s0, { type: 'UPDATE_MONITOR', name: 'eDP-1', patch: { disabled: true } })
    const s2 = canvasReducer(s1, { type: 'UPDATE_MONITOR', name: 'eDP-1', patch: { disabled: false } })
    expect(s2.monitors[0].disabled).toBe(false)
  })

  it('does not affect other monitors', () => {
    const s0 = canvasReducer(initialCanvasState, { type: 'INIT', monitors: [monA, monB] })
    const s1 = canvasReducer(s0, { type: 'UPDATE_MONITOR', name: 'eDP-1', patch: { scale: 2 } })
    expect(s1.monitors.find((m) => m.name === 'HDMI-A-1')!.scale).toBe(1)
  })
})

describe('SET_GDK_SCALE', () => {
  it('updates gdkScale', () => {
    const s0 = canvasReducer(initialCanvasState, { type: 'INIT', monitors: [monA] })
    const s1 = canvasReducer(s0, { type: 'SET_GDK_SCALE', value: 1.75 })
    expect(s1.gdkScale).toBe(1.75)
  })
})

describe('INIT', () => {
  it('seeds disabled=false for all monitors', () => {
    const s = canvasReducer(initialCanvasState, { type: 'INIT', monitors: [monA] })
    expect(s.monitors[0].disabled).toBe(false)
  })

  it('seeds scale and refreshRate from Monitor', () => {
    const s = canvasReducer(initialCanvasState, {
      type: 'INIT',
      monitors: [{ ...monA, scale: 1.5, refreshRate: 144 }]
    })
    expect(s.monitors[0].scale).toBe(1.5)
    expect(s.monitors[0].refreshRate).toBe(144)
  })
})

describe('applySnap', () => {
  const base = { refreshRate: 60, transform: 0, scale: 1, availableModes: [], disabled: false }
  const posA: MonitorPosition = { name: 'A', x: 0, y: 0, width: 200, height: 100, ...base }
  const posB: MonitorPosition = { name: 'B', x: 300, y: 0, width: 200, height: 100, ...base }

  it('snaps left edge of dragged to right edge of stationary (within threshold)', () => {
    // B dragged to x=209 — left edge is 9px from A's right edge (200)
    const result = applySnap(posB, [posA, posB], 209, 0)
    expect(result.x).toBe(200)
  })

  it('snaps right edge of dragged to left edge of stationary (within threshold)', () => {
    // B dragged to x=-192 — right edge (8) is 8px from A's left edge (0) → snap to x=-200
    const result = applySnap(posB, [posA, posB], -192, 0)
    expect(result.x).toBe(-200)
  })

  it('does not snap when beyond threshold', () => {
    // B dragged to x=215 — 15px from A's right edge, no snap
    const result = applySnap(posB, [posA, posB], 215, 0)
    expect(result.x).toBe(215)
  })

  it('snaps top edge to bottom edge of stationary', () => {
    // B dragged to y=107 — top edge is 7px from A's bottom (100)
    const result = applySnap(posB, [posA, posB], 300, 107)
    expect(result.y).toBe(100)
  })

  it('threshold boundary: exactly at threshold snaps', () => {
    const result = applySnap(posB, [posA, posB], 200 + SNAP_THRESHOLD, 0)
    expect(result.x).toBe(200)
  })

  it('threshold boundary: one past threshold does not snap', () => {
    const result = applySnap(posB, [posA, posB], 200 + SNAP_THRESHOLD + 1, 0)
    expect(result.x).toBe(200 + SNAP_THRESHOLD + 1)
  })
})
