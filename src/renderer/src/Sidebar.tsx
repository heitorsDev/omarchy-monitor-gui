import React from 'react'
import type { CanvasAction, MonitorPosition } from './canvasReducer'

interface Props {
  monitors: MonitorPosition[]
  selected: string | null
  dispatch: React.Dispatch<CanvasAction>
}

export default function Sidebar({ monitors, selected, dispatch }: Props): React.ReactElement {
  return (
    <div
      style={{
        width: 200,
        flexShrink: 0,
        background: '#111827',
        borderRight: '1px solid #374151',
        display: 'flex',
        flexDirection: 'column',
        padding: '12px 0'
      }}
    >
      <div
        style={{
          padding: '0 12px 8px',
          fontSize: 11,
          fontFamily: 'monospace',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}
      >
        Monitors
      </div>
      {monitors.map((m) => {
        const isSelected = m.name === selected
        return (
          <button
            key={m.name}
            onClick={() => dispatch({ type: 'SELECT', name: m.name })}
            style={{
              display: 'block',
              width: '100%',
              textAlign: 'left',
              padding: '8px 12px',
              border: 'none',
              background: isSelected ? 'rgba(96,165,250,0.15)' : 'transparent',
              borderLeft: `3px solid ${isSelected ? '#60a5fa' : 'transparent'}`,
              color: isSelected ? '#93c5fd' : '#d1d5db',
              cursor: 'pointer',
              fontFamily: 'monospace',
              fontSize: 13
            }}
          >
            {m.name}
          </button>
        )
      })}
      {monitors.length === 0 && (
        <div style={{ padding: '8px 12px', color: '#6b7280', fontFamily: 'monospace', fontSize: 12 }}>
          —
        </div>
      )}
    </div>
  )
}
