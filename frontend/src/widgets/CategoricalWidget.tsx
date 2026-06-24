import React, { memo } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { widgetRegistry } from '../registry';
import { transformCategorical, formatValue } from '../utils/transformers';
import type { CategoricalPayload, WidgetComponentProps } from '../types';
import { WidgetSkeleton, WidgetError } from '../components/WidgetCard';

function CategoricalWidgetComponent({ data, isLoading, error }: WidgetComponentProps<CategoricalPayload>) {
  if (isLoading) return <WidgetSkeleton />;
  if (error || !data) return <WidgetError message={error ?? 'No data'} />;

  const chartData = transformCategorical(data);

  return (
    <div style={{ width: '100%', height: '100%', display: 'flex', flexDirection: 'column' }}>
      <span style={metaStyle}>{data.meta.description}</span>
      <div style={{ flex: 1, minHeight: 0 }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 28, left: 4 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--hairline)" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: 'var(--mute)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            angle={-20}
            textAnchor="end"
            interval={0}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fill: 'var(--mute)', fontSize: 10, fontFamily: 'var(--font-mono)' }}
            tickFormatter={(v: number) => formatValue(v, data.meta.unit)}
            width={58}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            contentStyle={tooltipStyle}
            labelStyle={{ color: 'var(--body)', fontSize: 12 }}
            itemStyle={{ color: 'var(--ink)', fontSize: 12 }}
            formatter={(value: number) => [formatValue(value, data.meta.unit), data.meta.unit]}
            cursor={{ fill: 'rgba(255,255,255,0.03)' }}
          />
          <Bar dataKey="value" radius={[2, 2, 0, 0]} maxBarSize={48}>
            {chartData.map((entry, i) => <Cell key={i} fill={entry.fill} />)}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
      </div>
    </div>
  );
}

widgetRegistry.register<CategoricalPayload>({
  type: 'categorical',
  displayName: 'Bar Chart',
  description: 'Categorical comparison with key-value pairs',
  icon: '📊',
  defaultSize: { w: 4, h: 3, minW: 2, minH: 2 },
  availableDatasets: ['sales_by_region', 'products_by_category', 'support_tickets'],
  component: memo(CategoricalWidgetComponent) as React.ComponentType<WidgetComponentProps<CategoricalPayload>>,
});

export { CategoricalWidgetComponent };

const metaStyle: React.CSSProperties = {
  fontFamily: 'var(--font-mono)',
  fontSize: 10,
  letterSpacing: '1.1px',
  color: 'var(--mute)',
  marginBottom: 4,
  textTransform: 'uppercase',
};

const tooltipStyle: React.CSSProperties = {
  background: 'var(--canvas-soft)',
  border: '1px solid var(--hairline)',
  borderRadius: 'var(--radius-sm)',
  fontSize: 12,
};
