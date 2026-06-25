import type { Monitor } from './types'

export const SNAP_THRESHOLD = 10

export interface MonitorPosition {
  name: string
  x: number
  y: number
  width: number
  height: number
  transform: number
}

interface DragState {
  name: string
  startMouseX: number
  startMouseY: number
  origX: number
  origY: number
  scale: number
}

export interface CanvasState {
  monitors: MonitorPosition[]
  selected: string | null
  drag: DragState | null
}

export type CanvasAction =
  | { type: 'INIT'; monitors: Monitor[] }
  | { type: 'SELECT'; name: string | null }
  | { type: 'DRAG_START'; name: string; mouseX: number; mouseY: number; scale: number }
  | { type: 'DRAG_MOVE'; mouseX: number; mouseY: number }
  | { type: 'DRAG_END' }

export const initialCanvasState: CanvasState = {
  monitors: [],
  selected: null,
  drag: null
}

function xSnapCandidates(
  dragged: MonitorPosition,
  other: MonitorPosition,
  newX: number
): Array<{ val: number; dist: number }> {
  const dRight = newX + dragged.width
  const oRight = other.x + other.width
  return [
    { val: other.x, dist: Math.abs(newX - other.x) },
    { val: oRight, dist: Math.abs(newX - oRight) },
    { val: other.x - dragged.width, dist: Math.abs(dRight - other.x) },
    { val: oRight - dragged.width, dist: Math.abs(dRight - oRight) }
  ]
}

function ySnapCandidates(
  dragged: MonitorPosition,
  other: MonitorPosition,
  newY: number
): Array<{ val: number; dist: number }> {
  const dBottom = newY + dragged.height
  const oBottom = other.y + other.height
  return [
    { val: other.y, dist: Math.abs(newY - other.y) },
    { val: oBottom, dist: Math.abs(newY - oBottom) },
    { val: other.y - dragged.height, dist: Math.abs(dBottom - other.y) },
    { val: oBottom - dragged.height, dist: Math.abs(dBottom - oBottom) }
  ]
}

export function applySnap(
  dragged: MonitorPosition,
  others: MonitorPosition[],
  newX: number,
  newY: number
): { x: number; y: number } {
  let bestX = newX
  let bestXDist = Infinity
  let bestY = newY
  let bestYDist = Infinity

  for (const other of others) {
    if (other.name === dragged.name) continue
    for (const c of xSnapCandidates(dragged, other, newX)) {
      if (c.dist < bestXDist) { bestXDist = c.dist; bestX = c.val }
    }
    for (const c of ySnapCandidates(dragged, other, newY)) {
      if (c.dist < bestYDist) { bestYDist = c.dist; bestY = c.val }
    }
  }

  return {
    x: bestXDist <= SNAP_THRESHOLD ? bestX : newX,
    y: bestYDist <= SNAP_THRESHOLD ? bestY : newY
  }
}

function handleInit(state: CanvasState, monitors: Monitor[]): CanvasState {
  return {
    ...state,
    monitors: monitors.map((m) => ({
      name: m.name,
      x: m.x,
      y: m.y,
      width: m.width,
      height: m.height,
      transform: m.transform
    })),
    drag: null
  }
}

function handleDragStart(
  state: CanvasState,
  action: Extract<CanvasAction, { type: 'DRAG_START' }>
): CanvasState {
  const monitor = state.monitors.find((m) => m.name === action.name)
  if (!monitor) return state
  return {
    ...state,
    selected: action.name,
    drag: {
      name: action.name,
      startMouseX: action.mouseX,
      startMouseY: action.mouseY,
      origX: monitor.x,
      origY: monitor.y,
      scale: action.scale
    }
  }
}

function handleDragMove(state: CanvasState, mouseX: number, mouseY: number): CanvasState {
  if (!state.drag) return state
  const { drag } = state
  const rawX = drag.origX + (mouseX - drag.startMouseX) / drag.scale
  const rawY = drag.origY + (mouseY - drag.startMouseY) / drag.scale
  const dragged = state.monitors.find((m) => m.name === drag.name)!
  const { x, y } = applySnap(dragged, state.monitors, rawX, rawY)
  return {
    ...state,
    monitors: state.monitors.map((m) => (m.name === drag.name ? { ...m, x, y } : m))
  }
}

export function canvasReducer(state: CanvasState, action: CanvasAction): CanvasState {
  switch (action.type) {
    case 'INIT':
      return handleInit(state, action.monitors)
    case 'SELECT':
      return { ...state, selected: action.name }
    case 'DRAG_START':
      return handleDragStart(state, action)
    case 'DRAG_MOVE':
      return handleDragMove(state, action.mouseX, action.mouseY)
    case 'DRAG_END':
      return { ...state, drag: null }
    default:
      return state
  }
}
