// ─── Mirrored from backend (shared contract) ────────────────────────────────
export interface CategoricalDataPoint {
  category: string;
  value: number;
  color?: string;
}
export interface CategoricalPayload {
  type: 'categorical';
  title: string;
  data: CategoricalDataPoint[];
  meta: { unit: string; description: string; datasetId: string };
}

export interface TemporalDataPoint {
  timestamp: string;
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
  meta: { depth: number; totalValue: number; description: string; datasetId: string };
}

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

export type WidgetPayload =
  | CategoricalPayload
  | TemporalPayload
  | HierarchicalPayload
  | RelationalPayload;

export type WidgetType = WidgetPayload['type'];

// ─── Dashboard / Layout types ────────────────────────────────────────────────
export interface GridSize {
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface WidgetLayout {
  i: string; // widget instance id
  x: number;
  y: number;
  w: number;
  h: number;
  minW?: number;
  minH?: number;
}

export interface WidgetConfig {
  datasetId?: string;
  title?: string; // user-overridden title
}

export interface WidgetInstance {
  id: string;
  type: WidgetType;
  config: WidgetConfig;
}

export interface DashboardState {
  widgets: Record<string, WidgetInstance>;
  layout: WidgetLayout[];
}

// ─── Widget registry ─────────────────────────────────────────────────────────
export interface WidgetComponentProps<T extends WidgetPayload = WidgetPayload> {
  data: T | null;
  isLoading: boolean;
  error: string | null;
  widgetId: string;
}

export interface WidgetDefinition<T extends WidgetPayload = WidgetPayload> {
  type: WidgetType;
  displayName: string;
  description: string;
  icon: string;
  defaultSize: GridSize;
  availableDatasets: string[];
  component: React.ComponentType<WidgetComponentProps<T>>;
}
