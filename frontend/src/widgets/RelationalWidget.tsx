import React, { memo } from 'react';
import {
  ScatterChart, Scatter, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, ZAxis,
} from 'recharts';
import { widgetRegistry } from '../registry';
import { transformRelational, formatCorrelation } from '../utils/transformers';
import type { RelationalPayload, WidgetComponentProps } from '../types';
import { WidgetSkeleton, WidgetError } from '../components/WidgetCard';

interface TooltipProps {
  active?: boolean;
  payload?: Array<{ payload: { label: string; x: number; y: number } }>;
  xUnit: string;
  yUnit: string;
}

function ScatterTooltip({ active, payload, xUnit, yUnit }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={tooltipStyle}>
      <p style={{ margin: 0, fontSize: 12, color: 'var(--ink)', marginBottom: 4 }}>{d.label}</p>
      <p style={{ margin: 0, fontSize: 11, color: 'var(--mute)', fontFamily: 'var(--font-mono)', letterSpacing: '0.8px' }}>
        {d.x} {xUnit} · {d.y} {yUnit}
      </p>
    </div>
  );
}

function RelationalWidgetComponent({ data, isLoading, error }: WidgetComponentProps<RelationalPayload>) {
  if (isLoading) return <WidgetSkeleton />;
  if (error || !data) return <WidgetError message={error ?? 'No data'} />;

  const groups    = transformRelational(data);
  const corrLabel = formatCorrelation(data.meta.correlation);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
        <span style={monoMetaStyle}>
          {data.meta.xAxis.label} ({data.meta.xAxis.unit}) vs {data.meta.yAxis.label} ({data.meta.yAxis.unit})
        </span>
        <span style={{ ...monoMetaStyle, color: 'var(--accent-twilight)' }}>{corrLabel}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 4, right: 4, bottom: 16, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" />
          <XAxis
            type="number"
            dataKey="x"
            name={data.meta.xAxis.label}
            unit={` ${data.meta.xAxis.unit}`}
            tick={{ fill: 'var(--mute)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            type="number"
            dataKey="y"
            name={data.meta.yAxis.label}
            unit={` ${data.meta.yAxis.unit}`}
            tick={{ fill: 'var(--mute)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            width={50}
            axisLine={false}
            tickLine={false}
          />
          <ZAxis type="number" dataKey="z" range={[30, 300]} />
          <Tooltip
            content={<ScatterTooltip xUnit={data.meta.xAxis.unit} yUnit={data.meta.yAxis.unit} />}
            cursor={{ stroke: 'var(--hairline)', strokeWidth: 1 }}
          />
          {groups.length > 1 && (
            <Legend
              wrapperStyle={{ fontSize: 10, color: 'var(--mute)', fontFamily: 'var(--font-mono)', letterSpacing: '0.8px', paddingTop: 4 }}
            />
          )}
          {groups.map((g) => (
            <Scatter key={g.name} name={g.name} data={g.data} fill={g.fill} fillOpacity={0.8} />
          ))}
        </ScatterChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

widgetRegistry.register<RelationalPayload>({
  type: 'relational',
  displayName: 'Scatter Plot',
  description: 'Correlation & coordinate-based relational data',
  icon: '🔵',
  defaultSize: { w: 5, h: 3, minW: 3, minH: 2 },
  availableDatasets: ['marketing_vs_revenue', 'performance_metrics', 'employee_satisfaction'],
  component: memo(RelationalWidgetComponent) as React.ComponentType<WidgetComponentProps<RelationalPayload>>,
});

export { RelationalWidgetComponent };

const monoMetaStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: '1.1px',
  color: 'var(--mute)',
  textTransform: 'uppercase',
};

const tooltipStyle: React.CSSProperties = {
  background: 'var(--canvas-soft)',
  border: '1px solid var(--hairline)',
  borderRadius: 'var(--radius-sm)',
  padding: '8px 12px',
};
