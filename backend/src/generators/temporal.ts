import type { TemporalPayload, TemporalDataPoint } from '../types';

function toISO(date: Date): string {
  return date.toISOString().replace(/\.\d{3}Z$/, '.000Z');
}

function generateDailySeries(
  days: number,
  baseValue: number,
  volatility: number,
  startDate: Date
): TemporalDataPoint[] {
  const points: TemporalDataPoint[] = [];
  let value = baseValue;
  for (let i = 0; i < days; i++) {
    const d = new Date(startDate);
    d.setDate(d.getDate() + i);
    d.setHours(0, 0, 0, 0);
    // Deterministic drift using index (no Math.random for reproducibility in tests)
    const drift = Math.sin(i * 0.3) * volatility + Math.cos(i * 0.1) * volatility * 0.5;
    value = Math.max(0, value + drift);
    points.push({ timestamp: toISO(d), value: Math.round(value * 100) / 100 });
  }
  return points;
}

function generateHourlySeries(hours: number, baseValue: number, startDate: Date): TemporalDataPoint[] {
  const points: TemporalDataPoint[] = [];
  let value = baseValue;
  for (let i = 0; i < hours; i++) {
    const d = new Date(startDate);
    d.setHours(d.getHours() + i, 0, 0, 0);
    const drift = Math.sin(i * 0.8) * baseValue * 0.1;
    value = Math.max(0, value + drift);
    points.push({ timestamp: toISO(d), value: Math.round(value * 100) / 100 });
  }
  return points;
}

function computeTrend(data: TemporalDataPoint[]): 'up' | 'down' | 'flat' {
  if (data.length < 2) return 'flat';
  const first = data[0].value;
  const last = data[data.length - 1].value;
  const pctChange = (last - first) / first;
  if (pctChange > 0.02) return 'up';
  if (pctChange < -0.02) return 'down';
  return 'flat';
}

const REFERENCE_DATE = new Date('2024-01-01T00:00:00.000Z');

type DatasetKey = 'stock_price' | 'daily_active_users' | 'server_latency' | 'revenue_trend';

const DATASET_BUILDERS: Record<DatasetKey, () => TemporalPayload> = {
  stock_price: () => {
    const data = generateDailySeries(90, 142.50, 4.2, REFERENCE_DATE);
    return {
      type: 'temporal',
      title: 'Stock Price — Last 90 Days',
      data,
      meta: {
        interval: 'daily',
        timezone: 'UTC',
        unit: 'USD',
        trend: computeTrend(data),
        datasetId: 'stock_price',
      },
    };
  },
  daily_active_users: () => {
    const data = generateDailySeries(60, 24_500, 800, REFERENCE_DATE);
    return {
      type: 'temporal',
      title: 'Daily Active Users',
      data,
      meta: {
        interval: 'daily',
        timezone: 'UTC',
        unit: 'users',
        trend: computeTrend(data),
        datasetId: 'daily_active_users',
      },
    };
  },
  server_latency: () => {
    const data = generateHourlySeries(48, 120, REFERENCE_DATE);
    return {
      type: 'temporal',
      title: 'API Latency — Last 48 Hours',
      data,
      meta: {
        interval: 'hourly',
        timezone: 'UTC',
        unit: 'ms',
        trend: computeTrend(data),
        datasetId: 'server_latency',
      },
    };
  },
  revenue_trend: () => {
    const data = generateDailySeries(30, 85_000, 3_200, REFERENCE_DATE);
    return {
      type: 'temporal',
      title: 'Daily Revenue — Last 30 Days',
      data,
      meta: {
        interval: 'daily',
        timezone: 'UTC',
        unit: 'USD',
        trend: computeTrend(data),
        datasetId: 'revenue_trend',
      },
    };
  },
};

const DEFAULT_DATASET: DatasetKey = 'stock_price';

export function generateTemporalData(datasetId?: string): TemporalPayload {
  const key =
    datasetId && datasetId in DATASET_BUILDERS
      ? (datasetId as DatasetKey)
      : DEFAULT_DATASET;
  return DATASET_BUILDERS[key]();
}

export function getTemporalDatasets(): string[] {
  return Object.keys(DATASET_BUILDERS);
}
