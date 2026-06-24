import type { CategoricalPayload } from '../types';

const DATASETS: Record<string, CategoricalPayload> = {
  sales_by_region: {
    type: 'categorical',
    title: 'Sales by Region',
    data: [
      { category: 'North America', value: 4_820_000, color: '#6366f1' },
      { category: 'Europe', value: 3_150_000, color: '#8b5cf6' },
      { category: 'Asia Pacific', value: 5_240_000, color: '#a78bfa' },
      { category: 'Latin America', value: 1_380_000, color: '#c4b5fd' },
      { category: 'Middle East', value: 890_000, color: '#ddd6fe' },
    ],
    meta: { unit: 'USD', description: 'Annual revenue by geographic region', datasetId: 'sales_by_region' },
  },
  products_by_category: {
    type: 'categorical',
    title: 'Units Sold by Product Category',
    data: [
      { category: 'Electronics', value: 12_400, color: '#f59e0b' },
      { category: 'Apparel', value: 8_900, color: '#fbbf24' },
      { category: 'Home & Garden', value: 6_200, color: '#fcd34d' },
      { category: 'Sports', value: 4_700, color: '#fde68a' },
      { category: 'Books', value: 3_100, color: '#fef3c7' },
      { category: 'Toys', value: 2_800, color: '#fffbeb' },
    ],
    meta: { unit: 'units', description: 'Total units sold per product category', datasetId: 'products_by_category' },
  },
  support_tickets: {
    type: 'categorical',
    title: 'Support Tickets by Priority',
    data: [
      { category: 'Critical', value: 23, color: '#ef4444' },
      { category: 'High', value: 87, color: '#f97316' },
      { category: 'Medium', value: 214, color: '#eab308' },
      { category: 'Low', value: 391, color: '#22c55e' },
    ],
    meta: { unit: 'tickets', description: 'Open support tickets by priority level', datasetId: 'support_tickets' },
  },
};

const DEFAULT_DATASET = 'sales_by_region';

export function generateCategoricalData(datasetId?: string): CategoricalPayload {
  const key = datasetId && DATASETS[datasetId] ? datasetId : DEFAULT_DATASET;
  // Return a deep clone to prevent mutation
  return JSON.parse(JSON.stringify(DATASETS[key])) as CategoricalPayload;
}

export function getCategoricalDatasets(): string[] {
  return Object.keys(DATASETS);
}
