import React, { useCallback, useEffect, useState, memo } from 'react';
import { Responsive, WidthProvider, type Layout, type Layouts } from 'react-grid-layout';
import { useDashboardStore } from '../store/dashboardStore';
import { WidgetCard } from './WidgetCard';
import { AddWidgetModal } from './AddWidgetModal';
import type { WidgetLayout } from '../types';

import 'react-grid-layout/css/styles.css';
import 'react-resizable/css/styles.css';

const ResponsiveGrid = WidthProvider(Responsive);

const BREAKPOINTS = { lg: 1200, md: 996, sm: 768, xs: 480, xxs: 0 };
const COLS        = { lg: 12,   md: 10,  sm: 6,   xs: 4,   xxs: 2 };

function toRGLLayout(layouts: WidgetLayout[]): Layout[] {
  return layouts.map(({ i, x, y, w, h, minW, minH }) => ({ i, x, y, w, h, minW, minH }));
}

/** For narrow breakpoints, stack widgets full-width in reading order */
function toStackedLayout(layout: WidgetLayout[], cols: number): Layout[] {
  const sorted = [...layout].sort((a, b) => a.y !== b.y ? a.y - b.y : a.x - b.x);
  let y = 0;
  return sorted.map((l) => {
    const item: Layout = { i: l.i, x: 0, y, w: cols, h: l.h, minW: 1, minH: l.minH ?? 2 };
    y += l.h;
    return item;
  });
}

function buildLayouts(layout: WidgetLayout[]): Layouts {
  const lg = toRGLLayout(layout);
  return {
    lg,
    md: lg,
    sm:  toStackedLayout(layout, 6),
    xs:  toStackedLayout(layout, 4),
    xxs: toStackedLayout(layout, 2),
  };
}

export const Dashboard = memo(function Dashboard() {
  const widgets        = useDashboardStore((s) => s.widgets);
  const layout         = useDashboardStore((s) => s.layout);
  const isLoading      = useDashboardStore((s) => s.isLoading);
  const updateLayout   = useDashboardStore((s) => s.updateLayout);
  const resetDashboard = useDashboardStore((s) => s.resetDashboard);
  const initDashboard  = useDashboardStore((s) => s.initDashboard);

  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    initDashboard();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLayoutChange = useCallback(
    (_current: Layout[], allLayouts: Layouts) => {
      const lgLayout = allLayouts.lg;
      if (lgLayout) updateLayout(lgLayout as WidgetLayout[]);
    },
    [updateLayout]
  );

  const widgetIds = Object.keys(widgets);
  const isEmpty   = !isLoading && widgetIds.length === 0;

  return (
    <div style={shellStyle}>
      {/* ── Nav bar ── */}
      <header style={navStyle}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={wordmarkStyle}>Dashboard</span>
          <span style={eyebrowStyle}>BUILDER</span>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          {!isEmpty && !isLoading && (
            <button style={outlinePillStyle} onClick={resetDashboard}>
              Reset
            </button>
          )}
          <button style={primaryPillStyle} onClick={() => setShowModal(true)}>
            + Add widget
          </button>
        </div>
      </header>

      {/* ── Hairline divider ── */}
      <div style={hairlineStyle} />

      {/* ── Grid canvas ── */}
      <main style={mainStyle}>
        {isLoading ? (
          <LoadingState />
        ) : isEmpty ? (
          <EmptyState onAdd={() => setShowModal(true)} />
        ) : (
          <ResponsiveGrid
            className="layout"
            layouts={buildLayouts(layout)}
            breakpoints={BREAKPOINTS}
            cols={COLS}
            rowHeight={80}
            draggableHandle=".widget-drag-handle"
            draggableCancel=".widget-drag-cancel"
            onLayoutChange={handleLayoutChange}
            margin={[12, 12]}
            containerPadding={[0, 0]}
            isDraggable
            isResizable
          >
            {widgetIds.map((id) => (
              <div key={id} style={{ height: '100%' }}>
                <WidgetCard instance={widgets[id]} />
              </div>
            ))}
          </ResponsiveGrid>
        )}
      </main>

      {showModal && <AddWidgetModal onClose={() => setShowModal(false)} />}
    </div>
  );
});

// ─── Sub-components ───────────────────────────────────────────────────────────
function LoadingState() {
  return (
    <div style={emptyStyle}>
      <span style={{ color: 'var(--mute)', fontSize: 12, fontFamily: 'var(--font-mono)', letterSpacing: '1.4px' }}>
        LOADING…
      </span>
    </div>
  );
}

function EmptyState({ onAdd }: { onAdd: () => void }) {
  return (
    <div style={emptyStyle}>
      <span style={{ ...eyebrowStyle, marginBottom: 24, color: 'var(--mute)' }}>
        DASHBOARD BUILDER
      </span>
      <h1 style={heroHeadlineStyle}>No widgets yet</h1>
      <p style={{ color: 'var(--mute)', fontSize: 16, lineHeight: '24px', marginTop: 12, marginBottom: 32 }}>
        Add your first visualization to get started.
      </p>
      <button style={{ ...primaryPillStyle, fontSize: 14, padding: '10px 24px' }} onClick={onAdd}>
        + Add widget
      </button>
    </div>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
const shellStyle: React.CSSProperties = {
  minHeight: '100vh',
  background: 'var(--canvas)',
  display: 'flex',
  flexDirection: 'column',
};

const navStyle: React.CSSProperties = {
  display: 'flex',
  justifyContent: 'space-between',
  alignItems: 'center',
  padding: '10px 16px',
  background: 'var(--canvas)',
  position: 'sticky',
  top: 0,
  zIndex: 20,
  gap: 8,
};

const hairlineStyle: React.CSSProperties = {
  height: 1,
  background: 'var(--hairline)',
};

const mainStyle: React.CSSProperties = {
  flex: 1,
  padding: '16px',
};

const emptyStyle: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '70vh',
  textAlign: 'center',
  padding: '0 16px',
};

const wordmarkStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 15,
  fontWeight: 400,
  letterSpacing: '-0.3px',
  color: 'var(--ink)',
};

const eyebrowStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: '1.4px',
  color: 'var(--mute)',
  textTransform: 'uppercase' as const,
};

const heroHeadlineStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 'clamp(28px, 6vw, 48px)',
  fontWeight: 400,
  lineHeight: 1,
  letterSpacing: '-1.2px',
  color: 'var(--ink)',
};

const basePillStyle: React.CSSProperties = {
  fontFamily: 'var(--font-sans)',
  fontSize: 13,
  fontWeight: 400,
  lineHeight: '20px',
  borderRadius: 'var(--radius-pill)',
  padding: '7px 14px',
  cursor: 'pointer',
  border: '1px solid',
  transition: 'opacity 0.15s',
  whiteSpace: 'nowrap' as const,
};

export const outlinePillStyle: React.CSSProperties = {
  ...basePillStyle,
  background: 'transparent',
  color: 'var(--ink)',
  borderColor: 'var(--hairline)',
};

export const primaryPillStyle: React.CSSProperties = {
  ...basePillStyle,
  background: 'var(--ink)',
  color: 'var(--canvas)',
  borderColor: 'var(--ink)',
};

export const outlinePillSmStyle: React.CSSProperties = {
  ...basePillStyle,
  padding: '3px 10px',
  background: 'transparent',
  color: 'var(--ink)',
  borderColor: 'var(--hairline)',
  fontSize: 11,
};
