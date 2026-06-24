import React, { memo } from 'react';
import { widgetRegistry } from '../registry';
import { useDashboardStore } from '../store/dashboardStore';
import { outlinePillStyle } from './Dashboard';
import type { WidgetType } from '../types';

interface AddWidgetModalProps {
  onClose: () => void;
}

export const AddWidgetModal = memo(function AddWidgetModal({ onClose }: AddWidgetModalProps) {
  const addWidget   = useDashboardStore((s) => s.addWidget);
  const definitions = widgetRegistry.getAll();

  function handleAdd(type: WidgetType) {
    addWidget(type);
    onClose();
  }

  return (
    <div style={overlayStyle} onClick={onClose}>
      <div style={dialogStyle} onClick={(e) => e.stopPropagation()}>

        {/* ── Dialog header ── */}
        <div style={dialogHeaderStyle}>
          <div>
            <span style={eyebrowStyle}>ADD WIDGET</span>
            <h2 style={dialogTitleStyle}>Choose visualization</h2>
          </div>
          <button style={closeBtnStyle} onClick={onClose} title="Close">✕</button>
        </div>

        {/* ── Hairline ── */}
        <div style={{ height: 1, background: 'var(--hairline)', margin: '0 -24px 20px' }} />

        {/* ── Widget grid ── */}
        <div style={gridStyle}>
          {definitions.map((def) => (
            <button
              key={def.type}
              style={widgetCardStyle}
              onClick={() => handleAdd(def.type)}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--mute)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.borderColor = 'var(--hairline)';
              }}
            >
              <span style={{ fontSize: 28, lineHeight: 1 }}>{def.icon}</span>
              <span style={cardNameStyle}>{def.displayName}</span>
              <span style={cardDescStyle}>{def.description}</span>
              <span style={{ ...tagStyle, marginTop: 4 }}>{def.type}</span>
            </button>
          ))}
        </div>

        {/* ── Footer ── */}
        <div style={{ height: 1, background: 'var(--hairline)', margin: '20px -24px 16px' }} />
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button style={outlinePillStyle} onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
});

// ─── Styles ───────────────────────────────────────────────────────────────────
const overlayStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  zIndex: 100,
  background: 'rgba(0,0,0,0.72)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  backdropFilter: 'blur(2px)',
};

const dialogStyle: React.CSSProperties = {
  background: 'var(--canvas-card)',
  border: '1px solid var(--hairline)',
  borderRadius: 'var(--radius-sm)',
  padding: 24,
  width: 460,
  maxWidth: '92vw',
  maxHeight: '85vh',
  overflowY: 'auto',
};

const dialogHeaderStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'flex-start',
  marginBottom: 16,
};

const eyebrowStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 11,
  letterSpacing: '1.4px',
  color: 'var(--mute)',
  display: 'block',
  marginBottom: 6,
};

const dialogTitleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 24,
  fontWeight: 400,
  letterSpacing: '-0.4px',
  color: 'var(--ink)',
  lineHeight: '28px',
};

const closeBtnStyle: React.CSSProperties = {
  background: 'none',
  border: '1px solid var(--hairline)',
  borderRadius: 'var(--radius-pill)',
  color: 'var(--mute)',
  fontSize: 12,
  width: 28,
  height: 28,
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  cursor: 'pointer',
  flexShrink: 0,
};

const gridStyle: React.CSSProperties = {
  display: 'grid',
  gridTemplateColumns: '1fr 1fr',
  gap: 10,
};

const widgetCardStyle: React.CSSProperties = {
  background: 'var(--canvas-soft)',
  border: '1px solid var(--hairline)',
  borderRadius: 'var(--radius-sm)',
  padding: '16px 14px',
  cursor: 'pointer',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'flex-start',
  gap: 6,
  textAlign: 'left',
  transition: 'border-color 0.15s',
};

const cardNameStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 14,
  fontWeight: 400,
  color: 'var(--ink)',
  letterSpacing: '-0.1px',
};

const cardDescStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 12,
  color: 'var(--mute)',
  lineHeight: '16px',
};

const tagStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: '1.1px',
  color: 'var(--mute)',
  textTransform: 'uppercase',
  background: 'var(--canvas-card)',
  border: '1px solid var(--hairline)',
  borderRadius: 'var(--radius-pill)',
  padding: '2px 8px',
};
