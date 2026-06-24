import type {
  CategoricalPayload,
  TemporalPayload,
  HierarchicalPayload,
  RelationalPayload,
  HierarchicalNode,
} from '../types';

// ─── Categorical ─────────────────────────────────────────────────────────────
export interface CategoricalChartDatum {
  name: string;
  value: number;
  fill: string;
  formattedValue: string;
}

// xAI accent palette
const PALETTE = [
  '#ff7a17', // accent-sunset
  '#7c3aed', // accent-dusk
  '#c4b5fd', // accent-twilight
  '#a0c3ec', // accent-breeze
  '#ffc285', // accent-sunset-soft
  '#dadbdf', // body
  '#7d8187', // mute
  '#0d1726', // accent-midnight (use sparingly)
];

export function transformCategorical(
  payload: CategoricalPayload
): CategoricalChartDatum[] {
  return payload.data.map((pt, i) => ({
    name: pt.category,
    value: pt.value,
    fill: pt.color ?? PALETTE[i % PALETTE.length],
    formattedValue: formatValue(pt.value, payload.meta.unit),
  }));
}

// ─── Temporal ────────────────────────────────────────────────────────────────
export interface TemporalChartDatum {
  timestamp: number; // epoch ms for Recharts
  displayDate: string;
  value: number;
}

export function transformTemporal(payload: TemporalPayload): TemporalChartDatum[] {
  return payload.data.map((pt) => {
    const date = new Date(pt.timestamp);
    return {
      timestamp: date.getTime(),
      displayDate: formatDate(date, payload.meta.interval),
      value: pt.value,
    };
  });
}

function formatDate(date: Date, interval: TemporalPayload['meta']['interval']): string {
  switch (interval) {
    case 'hourly':
      return date.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit' });
    case 'daily':
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    case 'weekly':
      return `W${getWeekNumber(date)} ${date.getFullYear()}`;
    case 'monthly':
      return date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
  }
}

function getWeekNumber(date: Date): number {
  const start = new Date(date.getFullYear(), 0, 1);
  return Math.ceil(((date.getTime() - start.getTime()) / 86400000 + start.getDay() + 1) / 7);
}

// ─── Hierarchical ────────────────────────────────────────────────────────────
// Recharts Treemap expects a flat array with a `children` array of leaf objects
export interface TreemapDatum {
  name: string;
  size?: number;
  children?: TreemapDatum[];
  fill?: string;
}

export function transformHierarchical(payload: HierarchicalPayload): TreemapDatum {
  return nodeToTreemapDatum(payload.root);
}

function nodeToTreemapDatum(node: HierarchicalNode): TreemapDatum {
  if (!node.children || node.children.length === 0) {
    return { name: node.name, size: node.value, fill: node.color };
  }
  return {
    name: node.name,
    fill: node.color,
    children: node.children.map(nodeToTreemapDatum),
  };
}

// ─── Relational ──────────────────────────────────────────────────────────────
export interface ScatterDatum {
  x: number;
  y: number;
  label: string;
  group: string;
  z: number; // bubble size, normalized
}

export interface ScatterGroup {
  name: string;
  data: ScatterDatum[];
  fill: string;
}

export function transformRelational(payload: RelationalPayload): ScatterGroup[] {
  const groups = new Map<string, ScatterDatum[]>();

  // Normalise bubble sizes within 5–25 range
  const sizes = payload.data.map((d) => d.size ?? 10);
  const minSize = Math.min(...sizes);
  const maxSize = Math.max(...sizes);
  const sizeRange = maxSize - minSize || 1;

  payload.data.forEach((pt) => {
    const group = pt.group ?? 'Default';
    if (!groups.has(group)) groups.set(group, []);
    const z = 5 + ((pt.size ?? 10) - minSize) / sizeRange * 20;
    groups.get(group)!.push({
      x: pt.x,
      y: pt.y,
      label: pt.label,
      group,
      z: Math.round(z),
    });
  });

  return Array.from(groups.entries()).map(([name, data], i) => ({
    name,
    data,
    fill: PALETTE[i % PALETTE.length],
  }));
}

// ─── Shared utilities ────────────────────────────────────────────────────────
export function formatValue(value: number, unit: string): string {
  if (unit === 'USD' || unit === '$K') {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(value);
  }
  return `${new Intl.NumberFormat('en-US', { notation: 'compact' }).format(value)} ${unit}`;
}

export function formatCorrelation(r: number): string {
  const abs = Math.abs(r);
  const dir = r > 0 ? 'positive' : r < 0 ? 'negative' : '';
  const strength = abs >= 0.9 ? 'very strong' : abs >= 0.7 ? 'strong' : abs >= 0.4 ? 'moderate' : 'weak';
  return r === 0 ? 'no correlation' : `${strength} ${dir} (r=${r.toFixed(3)})`;
}
