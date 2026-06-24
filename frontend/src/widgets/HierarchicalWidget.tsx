import React, { memo } from 'react';
import { Treemap, ResponsiveContainer, Tooltip } from 'recharts';
import { widgetRegistry } from '../registry';
import { transformHierarchical } from '../utils/transformers';
import type { HierarchicalPayload, WidgetComponentProps } from '../types';
import { WidgetSkeleton, WidgetError } from '../components/WidgetCard';

// xAI accent palette for treemap cells
const PALETTE = [
  '#ff7a17', '#7c3aed', '#c4b5fd', '#a0c3ec',
  '#ffc285', '#dadbdf', '#363a3f', '#0d1726',
];

interface ContentProps {
  x?: number; y?: number; width?: number; height?: number;
  name?: string; value?: number; depth?: number; index?: number;
}

function CustomContent({ x = 0, y = 0, width = 0, height = 0, name = '', value = 0, depth = 0, index = 0 }: ContentProps) {
  if (width < 4 || height < 4) return null;

  const fill = depth === 1
    ? PALETTE[index % PALETTE.length]
    : `${PALETTE[index % PALETTE.length]}88`;

  const showLabel = width > 44 && height > 24;
  const showValue = width > 70 && height > 44;

  return (
    <g>
      <rect x={x + 1} y={y + 1} width={width - 2} height={height - 2} fill={fill} rx={4} />
      {showLabel && (
        <text
          x={x + 8} y={y + 18}
          fill={depth === 1 ? '#0a0a0a' : 'rgba(10,10,10,0.8)'}
          fontSize={Math.min(12, width / 7)}
          fontFamily="var(--font-sans)"
          fontWeight={400}
          style={{ pointerEvents: 'none' }}
        >
          {name.length > 16 ? name.slice(0, 14) + '…' : name}
        </text>
      )}
      {showValue && (
        <text
          x={x + 8} y={y + 33}
          fill="rgba(10,10,10,0.65)"
          fontSize={Math.min(10, width / 9)}
          fontFamily="var(--font-mono)"
          style={{ pointerEvents: 'none' }}
        >
          {new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value)}
        </text>
      )}
    </g>
  );
}

function HierarchicalWidgetComponent({ data, isLoading, error }: WidgetComponentProps<HierarchicalPayload>) {
  if (isLoading) return <WidgetSkeleton />;
  if (error || !data) return <WidgetError message={error ?? 'No data'} />;

  const treemapData = transformHierarchical(data);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <span style={monoMetaStyle}>
        {data.meta.description} · depth {data.meta.depth}
      </span>
      <div style={{ flex: 1, minHeight: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={treemapData.children ?? [{ name: treemapData.name, size: treemapData.size }]}
          dataKey="size"
          aspectRatio={4 / 3}
          content={<CustomContent />}
        >
          <Tooltip
            contentStyle={tooltipStyle}
            itemStyle={{ color: 'var(--ink)', fontSize: 12 }}
            labelStyle={{ color: 'var(--mute)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            formatter={(value: number, name: string) => [
              new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value), name,
            ]}
          />
        </Treemap>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

widgetRegistry.register<HierarchicalPayload>({
  type: 'hierarchical',
  displayName: 'Treemap',
  description: 'Part-to-whole using nested tree structures',
  icon: '🗂️',
  defaultSize: { w: 5, h: 4, minW: 3, minH: 3 },
  availableDatasets: ['tech_budget', 'market_share'],
  component: memo(HierarchicalWidgetComponent) as React.ComponentType<WidgetComponentProps<HierarchicalPayload>>,
});

export { HierarchicalWidgetComponent };

const monoMetaStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: '1.1px',
  color: 'var(--mute)',
  marginBottom: 6,
  textTransform: 'uppercase',
  flexShrink: 0,
};

const tooltipStyle: React.CSSProperties = {
  background: 'var(--canvas-soft)',
  border: '1px solid var(--hairline)',
  borderRadius: 'var(--radius-sm)',
};
