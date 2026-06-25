import React from 'react'
import { parseModeString } from './canvasReducer'
import type { CanvasAction, MonitorPosition } from './canvasReducer'

const GDK_SCALE_OPTIONS = [1, 1.75, 2]

const TRANSFORM_OPTIONS = [
  { value: 0, label: 'Normal' },
  { value: 1, label: '90°' },
  { value: 2, label: '180°' },
  { value: 3, label: '270°' }
]

interface Props {
  monitor: MonitorPosition
  gdkScale: number
  dispatch: React.Dispatch<CanvasAction>
}

function findCurrentMode(m: MonitorPosition): string {
  const match = m.availableModes.find((mode) => {
    const p = parseModeString(mode)
    return p !== null && p.width === m.width && p.height === m.height &&
      Math.abs(p.refreshRate - m.refreshRate) < 0.5
  })
  return match ?? m.availableModes[0] ?? `${m.width}x${m.height}@${m.refreshRate}Hz`
}

const fieldStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 4,
  marginBottom: 16
}

const labelStyle: React.CSSProperties = {
  fontSize: 11,
  fontFamily: 'monospace',
  color: '#6b7280',
  textTransform: 'uppercase',
  letterSpacing: '0.05em'
}

const selectStyle: React.CSSProperties = {
  background: '#1f2937',
  border: '1px solid #374151',
  borderRadius: 4,
  color: '#e5e7eb',
  fontFamily: 'monospace',
  fontSize: 13,
  padding: '4px 8px',
  width: '100%'
}

const inputStyle: React.CSSProperties = { ...selectStyle }

export default function MonitorPanel({ monitor, gdkScale, dispatch }: Props): React.ReactElement {
  const currentMode = findCurrentMode(monitor)

  return (
    <div
      style={{
        width: 260,
        flexShrink: 0,
        background: '#111827',
        borderLeft: '1px solid #374151',
        padding: '16px 16px',
        overflowY: 'auto'
      }}
    >
      <div
        style={{
          fontFamily: 'monospace',
          fontSize: 13,
          color: '#93c5fd',
          marginBottom: 20,
          fontWeight: 600
        }}
      >
        {monitor.name}
      </div>

      <div style={fieldStyle}>
        <span style={labelStyle}>Resolution</span>
        <select
          style={selectStyle}
          value={currentMode}
          onChange={(e) =>
            dispatch({ type: 'SET_MODE', name: monitor.name, mode: e.target.value })
          }
        >
          {monitor.availableModes.map((mode) => (
            <option key={mode} value={mode}>
              {mode}
            </option>
          ))}
        </select>
      </div>

      <div style={fieldStyle}>
        <span style={labelStyle}>Scale</span>
        <input
          style={inputStyle}
          type="number"
          step="0.25"
          min="0.25"
          max="4"
          value={monitor.scale}
          onChange={(e) => {
            const v = parseFloat(e.target.value)
            if (!isNaN(v) && v > 0)
              dispatch({ type: 'UPDATE_MONITOR', name: monitor.name, patch: { scale: v } })
          }}
        />
      </div>

      <div style={fieldStyle}>
        <span style={labelStyle}>GDK_SCALE</span>
        <select
          style={selectStyle}
          value={gdkScale}
          onChange={(e) => dispatch({ type: 'SET_GDK_SCALE', value: parseFloat(e.target.value) })}
        >
          {GDK_SCALE_OPTIONS.map((v) => (
            <option key={v} value={v}>
              {v}
            </option>
          ))}
        </select>
      </div>

      <div style={fieldStyle}>
        <span style={labelStyle}>Transform</span>
        <select
          style={selectStyle}
          value={monitor.transform}
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_MONITOR',
              name: monitor.name,
              patch: { transform: parseInt(e.target.value, 10) }
            })
          }
        >
          {TRANSFORM_OPTIONS.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </select>
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginTop: 8
        }}
      >
        <span style={labelStyle}>Disable</span>
        <input
          type="checkbox"
          checked={monitor.disabled}
          onChange={(e) =>
            dispatch({
              type: 'UPDATE_MONITOR',
              name: monitor.name,
              patch: { disabled: e.target.checked }
            })
          }
          style={{ width: 16, height: 16, cursor: 'pointer', accentColor: '#60a5fa' }}
        />
      </div>
    </div>
  )
}
