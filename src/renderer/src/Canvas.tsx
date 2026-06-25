import React, { useEffect, useRef, useState } from 'react'
import type { CanvasAction, CanvasState, MonitorPosition } from './canvasReducer'

interface Props {
  state: CanvasState
  dispatch: React.Dispatch<CanvasAction>
}

function effectiveWidth(m: MonitorPosition): number {
  return m.transform === 1 || m.transform === 3 ? m.height : m.width
}

function effectiveHeight(m: MonitorPosition): number {
  return m.transform === 1 || m.transform === 3 ? m.width : m.height
}

function computeScale(
  monitors: MonitorPosition[],
  canvasW: number,
  canvasH: number
): { scale: number; offsetX: number; offsetY: number } {
  if (monitors.length === 0) return { scale: 1, offsetX: 0, offsetY: 0 }
  const PADDING = 40
  const minX = Math.min(...monitors.map((m) => m.x))
  const minY = Math.min(...monitors.map((m) => m.y))
  const maxX = Math.max(...monitors.map((m) => m.x + effectiveWidth(m)))
  const maxY = Math.max(...monitors.map((m) => m.y + effectiveHeight(m)))
  const scale = Math.min(
    (canvasW - PADDING * 2) / Math.max(maxX - minX, 1),
    (canvasH - PADDING * 2) / Math.max(maxY - minY, 1)
  )
  return {
    scale,
    offsetX: -minX * scale + PADDING,
    offsetY: -minY * scale + PADDING
  }
}

export default function Canvas({ state, dispatch }: Props): React.ReactElement {
  const containerRef = useRef<HTMLDivElement>(null)
  const [dims, setDims] = useState({ width: 800, height: 480 })

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const obs = new ResizeObserver(() => {
      setDims({ width: el.offsetWidth, height: el.offsetHeight })
    })
    obs.observe(el)
    return () => obs.disconnect()
  }, [])

  const { scale, offsetX, offsetY } = computeScale(state.monitors, dims.width, dims.height)

  useEffect(() => {
    if (!state.drag) return
    const onMove = (e: MouseEvent): void =>
      dispatch({ type: 'DRAG_MOVE', mouseX: e.clientX, mouseY: e.clientY })
    const onUp = (): void => dispatch({ type: 'DRAG_END' })
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => {
      window.removeEventListener('mousemove', onMove)
      window.removeEventListener('mouseup', onUp)
    }
  }, [state.drag, dispatch])

  const dragging = state.drag
    ? state.monitors.find((m) => m.name === state.drag!.name)
    : null

  return (
    <div
      ref={containerRef}
      style={{
        flex: 1,
        position: 'relative',
        overflow: 'hidden',
        background: '#1a1a2e',
        cursor: state.drag ? 'grabbing' : 'default'
      }}
    >
      {state.monitors.map((m) => {
        const w = effectiveWidth(m) * scale
        const h = effectiveHeight(m) * scale
        const left = m.x * scale + offsetX
        const top = m.y * scale + offsetY
        const isSelected = state.selected === m.name
        const isDragging = state.drag?.name === m.name
        return (
          <div
            key={m.name}
            onMouseDown={(e) => {
              e.preventDefault()
              dispatch({ type: 'DRAG_START', name: m.name, mouseX: e.clientX, mouseY: e.clientY, scale })
            }}
            onClick={() => dispatch({ type: 'SELECT', name: m.name })}
            style={{
              position: 'absolute',
              left,
              top,
              width: w,
              height: h,
              boxSizing: 'border-box',
              border: `2px solid ${isSelected ? '#60a5fa' : '#4b5563'}`,
              background: isDragging
                ? 'rgba(96,165,250,0.25)'
                : isSelected
                  ? 'rgba(96,165,250,0.15)'
                  : 'rgba(75,85,99,0.3)',
              cursor: 'grab',
              userSelect: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: 4,
              transition: isDragging ? 'none' : 'border-color 0.15s, background 0.15s'
            }}
          >
            <span
              style={{
                color: isSelected ? '#93c5fd' : '#9ca3af',
                fontSize: Math.max(10, 13 * scale),
                fontFamily: 'monospace',
                pointerEvents: 'none',
                textAlign: 'center'
              }}
            >
              {m.name}
            </span>
          </div>
        )
      })}

      {dragging && (
        <div
          style={{
            position: 'absolute',
            left: dragging.x * scale + offsetX,
            top: dragging.y * scale + offsetY - 24,
            background: 'rgba(0,0,0,0.75)',
            color: '#e5e7eb',
            fontSize: 11,
            fontFamily: 'monospace',
            padding: '2px 6px',
            borderRadius: 3,
            pointerEvents: 'none',
            whiteSpace: 'nowrap'
          }}
        >
          {Math.round(dragging.x)}, {Math.round(dragging.y)}
        </div>
      )}

      {state.monitors.length === 0 && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#6b7280',
            fontFamily: 'sans-serif'
          }}
        >
          No monitors detected
        </div>
      )}
    </div>
  )
}
