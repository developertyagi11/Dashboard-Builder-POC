// ─── Categorical ────────────────────────────────────────────────────────────
export interface CategoricalDataPoint {
  category: string;
  value: number;
  color?: string;
}

export interface CategoricalPayload {
  type: 'categorical';
  title: string;
  data: CategoricalDataPoint[];
  meta: {
    unit: string;
    description: string;
    datasetId: string;
  };
}

// ─── Temporal ───────────────────────────────────────────────────────────────
export interface TemporalDataPoint {
  timestamp: string; // ISO-8601
  value: number;
  label?: string;
}

export interface TemporalPayload {
  type: 'temporal';
  title: string;
  data: TemporalDataPoint[];
  meta: {
    interval: 'hourly' | 'daily' | 'weekly' | 'monthly';
    timezone: string;
    unit: string;
    trend: 'up' | 'down' | 'flat';
    datasetId: string;
  };
}

// ─── Hierarchical ───────────────────────────────────────────────────────────
export interface HierarchicalNode {
  id: string;
  name: string;
  value: number;
  color?: string;
  children?: HierarchicalNode[];
}

export interface HierarchicalPayload {
  type: 'hierarchical';
  title: string;
  root: HierarchicalNode;
  meta: {
    depth: number;
    totalValue: number;
    description: string;
    datasetId: string;
  };
}

// ─── Relational ─────────────────────────────────────────────────────────────
export interface RelationalDataPoint {
  x: number;
  y: number;
  label: string;
  group?: string;
  size?: number;
}

export interface RelationalPayload {
  type: 'relational';
  title: string;
  data: RelationalDataPoint[];
  meta: {
    xAxis: { label: string; unit: string };
    yAxis: { label: string; unit: string };
    correlation: number;
    datasetId: string;
  };
}

// ─── Discriminated Union ─────────────────────────────────────────────────────
export type WidgetPayload =
  | CategoricalPayload
  | TemporalPayload
  | HierarchicalPayload
  | RelationalPayload;

export type WidgetType = WidgetPayload['type'];

// ─── API Types ───────────────────────────────────────────────────────────────
export interface BatchWidgetRequest {
  requests: Array<{
    widgetId: string;
    type: WidgetType;
    datasetId?: string;
  }>;
}

export interface BatchWidgetResponse {
  results: Record<
    string,
    | { status: 'success'; data: WidgetPayload }
    | { status: 'error'; error: string }
  >;
  fetchedAt: string; // ISO-8601
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
}
