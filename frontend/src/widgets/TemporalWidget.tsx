import React, { memo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, ReferenceLine,
} from 'recharts';
import { widgetRegistry } from '../registry';
import { transformTemporal } from '../utils/transformers';
import type { TemporalPayload, WidgetComponentProps } from '../types';
import { WidgetSkeleton, WidgetError } from '../components/WidgetCard';

const TREND_COLOR: Record<string, string> = {
  up:   '#ff7a17', // accent-sunset
  down: '#c4b5fd', // accent-twilight
  flat: '#7d8187', // mute
};

const TREND_LABEL: Record<string, string> = {
  up: '↑ TRENDING UP', down: '↓ TRENDING DOWN', flat: '→ STABLE',
};

function TemporalWidgetComponent({ data, isLoading, error }: WidgetComponentProps<TemporalPayload>) {
  if (isLoading) return <WidgetSkeleton />;
  if (error || !data) return <WidgetError message={error ?? 'No data'} />;

  const chartData = transformTemporal(data);
  const color     = TREND_COLOR[data.meta.trend] ?? '#ff7a17';
  const avg       = chartData.reduce((s, d) => s + d.value, 0) / chartData.length;
  const gradId    = `grad-${data.meta.datasetId}`;

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4, alignItems: 'center' }}>
        <span style={monoMetaStyle}>{data.meta.unit} · {data.meta.interval}</span>
        <span style={{ ...monoMetaStyle, color }}>{TREND_LABEL[data.meta.trend]}</span>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 16, left: 4 }}>
          <defs>
            <linearGradient id={gradId} x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%"  stopColor={color} stopOpacity={0.18} />
              <stop offset="95%" stopColor={color} stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
          <XAxis
            dataKey="displayDate"
            tick={{ fill: 'var(--mute)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            interval="preserveStartEnd"
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--mute)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            width={52}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              new Intl.NumberFormat('en-US', { notation: 'compact' }).format(v)
            }
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: 'var(--mute)', fontSize: 11, fontFamily: 'var(--font-mono)' }}
            itemStyle={{ color: 'var(--ink)', fontSize: 12 }}
            formatter={(value: number) => [
              `${new Intl.NumberFormat('en-US').format(value)} ${data.meta.unit}`, '',
            ]}
            cursor={{ stroke: 'var(--hairline)', strokeWidth: 1 }}
          />
          <ReferenceLine
            y={avg}
            stroke="var(--canvas-mid)"
            strokeDasharray="4 4"
            label={{ value: 'avg', fill: 'var(--mute)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
          />
          <Area
            type="monotone"
            dataKey="value"
            stroke={color}
            strokeWidth={1.5}
            fill={`url(#${gradId})`}
            dot={false}
            activeDot={{ r: 3, fill: color, stroke: 'var(--canvas)', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

widgetRegistry.register<TemporalPayload>({
  type: 'temporal',
  displayName: 'Area Chart',
  description: 'Time-series with ISO-8601 timestamps and trend analysis',
  icon: '📈',
  defaultSize: { w: 6, h: 3, minW: 3, minH: 2 },
  availableDatasets: ['stock_price', 'daily_active_users', 'server_latency', 'revenue_trend'],
  component: memo(TemporalWidgetComponent) as React.ComponentType<WidgetComponentProps<TemporalPayload>>,
});

export { TemporalWidgetComponent };

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
};
