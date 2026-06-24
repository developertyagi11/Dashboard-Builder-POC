import React, { Component, type ErrorInfo, memo, useState } from 'react';
import { widgetRegistry } from '../registry';
import { useDashboardStore } from '../store/dashboardStore';
import { useWidgetData } from '../hooks/useWidgetData';
import { outlinePillSmStyle } from './Dashboard';
import type { WidgetInstance } from '../types';

// ─── Error Boundary ───────────────────────────────────────────────────────────
interface ErrorBoundaryState { hasError: boolean; message: string }

class WidgetErrorBoundary extends Component<
  { children: React.ReactNode; widgetId: string },
  ErrorBoundaryState
> {
  state: ErrorBoundaryState = { hasError: false, message: '' };

  static getDerivedStateFromError(err: unknown): ErrorBoundaryState {
    return { hasError: true, message: err instanceof Error ? err.message : 'Render error' };
  }

  componentDidCatch(err: Error, info: ErrorInfo) {
    console.error(`[WidgetErrorBoundary] widget=${this.props.widgetId}`, err, info);
  }

  render() {
    if (this.state.hasError) {
      return (
        <ErrorPlate message={this.state.message}>
          <button
            style={outlinePillSmStyle}
            onClick={() => this.setState({ hasError: false, message: '' })}
          >
            Retry
          </button>
        </ErrorPlate>
      );
    }
    return this.props.children;
  }
}

// ─── Widget content (data-fetching layer) ────────────────────────────────────
const WidgetContent = memo(function WidgetContent({ instance }: { instance: WidgetInstance }) {
  const { data, isLoading, error, refetch } = useWidgetData(
    instance.id, instance.type, instance.config.datasetId
  );

  const definition = widgetRegistry.get(instance.type);
  if (!definition) {
    return <ErrorPlate message={`Unknown type: ${instance.type}`} />;
  }

  const Component = definition.component;
  return (
    <WidgetErrorBoundary widgetId={instance.id}>
      {error && (
        <button
          onClick={refetch}
          title="Retry fetch"
          style={{ ...outlinePillSmStyle, position: 'absolute', top: 8, right: 36, zIndex: 5 }}
        >
          ↻
        </button>
      )}
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      <Component data={data as any} isLoading={isLoading} error={error} widgetId={instance.id} />
    </WidgetErrorBoundary>
  );
});

// ─── Card shell ───────────────────────────────────────────────────────────────
export const WidgetCard = memo(function WidgetCard({ instance }: { instance: WidgetInstance }) {
  const removeWidget       = useDashboardStore((s) => s.removeWidget);
  const updateWidgetConfig = useDashboardStore((s) => s.updateWidgetConfig);
  const [configOpen, setConfigOpen] = useState(false);

  const definition = widgetRegistry.get(instance.type);
  const title      = instance.config.title ?? definition?.displayName ?? instance.type;

  return (
    <div style={cardStyle}>
      {/* ── Header ── */}
      <div style={headerStyle} className="widget-drag-handle">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 0 }}>
          <span style={{ fontSize: 14, lineHeight: 1 }}>{definition?.icon ?? '📦'}</span>
          <span style={titleStyle}>{title}</span>
        </div>
        <div className="widget-drag-cancel" style={{ display: 'flex', gap: 2, flexShrink: 0 }}>
          <IconBtn title="Configure" onClick={() => setConfigOpen((o) => !o)}>⚙</IconBtn>
          <IconBtn title="Remove" onClick={() => removeWidget(instance.id)}>✕</IconBtn>
        </div>
      </div>

      {/* ── Config drawer ── */}
      {configOpen && definition && (
        <div style={configStyle}>
          <FieldRow label="DATASET">
            <select
              style={selectStyle}
              value={instance.config.datasetId ?? ''}
              onChange={(e) => { updateWidgetConfig(instance.id, { datasetId: e.target.value }); setConfigOpen(false); }}
            >
              {definition.availableDatasets.map((ds) => (
                <option key={ds} value={ds}>{ds.replace(/_/g, ' ')}</option>
              ))}
            </select>
          </FieldRow>
          <FieldRow label="TITLE">
            <input
              style={inputStyle}
              placeholder={definition.displayName}
              value={instance.config.title ?? ''}
              onChange={(e) => updateWidgetConfig(instance.id, { title: e.target.value || undefined })}
            />
          </FieldRow>
        </div>
      )}

      {/* ── Chart area ── */}
      <div style={chartAreaStyle}>
        <WidgetContent instance={instance} />
      </div>
    </div>
  );
});

// ─── Sub-components ───────────────────────────────────────────────────────────
function IconBtn({ children, title, onClick }: { children: React.ReactNode; title: string; onClick: () => void }) {
  return (
    <button style={iconBtnStyle} title={title} onClick={onClick}>
      {children}
    </button>
  );
}

function FieldRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <span style={monoLabelStyle}>{label}</span>
      {children}
    </div>
  );
}

// Exported for widget components to use
export function WidgetSkeleton() {
  return (
    <div style={centreStyle}>
      <span style={{ color: 'var(--mute)', fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '1.2px' }}>
        LOADING…
      </span>
    </div>
  );
}

export function WidgetError({ message }: { message: string }) {
  return <ErrorPlate message={message} />;
}

function ErrorPlate({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <div style={{ ...centreStyle, gap: 10, flexDirection: 'column' }}>
      <span style={{ fontSize: 20 }}>⚠</span>
      <span style={{ color: 'var(--accent-sunset)', fontSize: 12, textAlign: 'center', maxWidth: 200, lineHeight: '18px' }}>
        {message}
      </span>
      {children}
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const cardStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  background: 'var(--canvas-card)',
  border: '1px solid var(--hairline)',
  borderRadius: 'var(--radius-sm)',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
  position: 'relative',
};

const headerStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 8,
  padding: '10px 12px 9px',
  borderBottom: '1px solid var(--hairline)',
  cursor: 'grab',
  userSelect: 'none',
  flexShrink: 0,
};

const titleStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 400,
  color: 'var(--ink)',
  overflow: 'hidden',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
};

const iconBtnStyle: React.CSSProperties = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  padding: '3px 5px',
  borderRadius: 4,
  fontSize: 11,
  color: 'var(--mute)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};

const configStyle: React.CSSProperties = {
  padding: '10px 12px',
  borderBottom: '1px solid var(--hairline)',
  background: 'var(--canvas-soft)',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
  flexShrink: 0,
};

const monoLabelStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: '1.2px',
  color: 'var(--mute)',
};

const baseInputStyle: React.CSSProperties = {
  background: 'var(--canvas-card)',
  color: 'var(--ink)',
  border: '1px solid var(--hairline)',
  borderRadius: 'var(--radius-sm)',
  padding: '5px 10px',
  fontSize: 12,
  fontFamily: 'var(--font-sans)',
  width: '100%',
};

const selectStyle: React.CSSProperties = { ...baseInputStyle };
const inputStyle: React.CSSProperties = { ...baseInputStyle, outline: 'none' };

const chartAreaStyle: React.CSSProperties = {
  flex: 1,
  minHeight: 0,
  padding: '8px 10px 10px',
  position: 'relative',
};

const centreStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
};
