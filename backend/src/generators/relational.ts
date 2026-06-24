import type { RelationalPayload, RelationalDataPoint } from '../types';

function pearsonCorrelation(data: RelationalDataPoint[]): number {
  const n = data.length;
  if (n < 2) return 0;
  const meanX = data.reduce((s, d) => s + d.x, 0) / n;
  const meanY = data.reduce((s, d) => s + d.y, 0) / n;
  const num = data.reduce((s, d) => s + (d.x - meanX) * (d.y - meanY), 0);
  const denomX = Math.sqrt(data.reduce((s, d) => s + (d.x - meanX) ** 2, 0));
  const denomY = Math.sqrt(data.reduce((s, d) => s + (d.y - meanY) ** 2, 0));
  if (denomX === 0 || denomY === 0) return 0;
  return Math.round((num / (denomX * denomY)) * 1000) / 1000;
}

const DATASETS: Record<string, RelationalPayload> = {
  marketing_vs_revenue: {
    type: 'relational',
    title: 'Marketing Spend vs. Revenue',
    data: [
      { x: 10, y: 85, label: 'Q1 2022', group: '2022' },
      { x: 14, y: 102, label: 'Q2 2022', group: '2022' },
      { x: 18, y: 134, label: 'Q3 2022', group: '2022' },
      { x: 22, y: 158, label: 'Q4 2022', group: '2022' },
      { x: 25, y: 172, label: 'Q1 2023', group: '2023' },
      { x: 28, y: 195, label: 'Q2 2023', group: '2023' },
      { x: 35, y: 228, label: 'Q3 2023', group: '2023' },
      { x: 42, y: 265, label: 'Q4 2023', group: '2023' },
      { x: 48, y: 290, label: 'Q1 2024', group: '2024' },
      { x: 53, y: 318, label: 'Q2 2024', group: '2024' },
      { x: 60, y: 355, label: 'Q3 2024', group: '2024' },
      { x: 68, y: 390, label: 'Q4 2024', group: '2024' },
    ],
    meta: {
      xAxis: { label: 'Marketing Spend', unit: '$K' },
      yAxis: { label: 'Revenue', unit: '$K' },
      correlation: 0,
      datasetId: 'marketing_vs_revenue',
    },
  },
  performance_metrics: {
    type: 'relational',
    title: 'Response Time vs. Error Rate',
    data: [
      { x: 45, y: 0.1, label: 'us-east-1', group: 'North America', size: 120 },
      { x: 52, y: 0.2, label: 'us-west-2', group: 'North America', size: 95 },
      { x: 78, y: 0.8, label: 'eu-west-1', group: 'Europe', size: 88 },
      { x: 65, y: 0.4, label: 'eu-central-1', group: 'Europe', size: 72 },
      { x: 120, y: 2.1, label: 'ap-southeast-1', group: 'Asia', size: 65 },
      { x: 98, y: 1.4, label: 'ap-northeast-1', group: 'Asia', size: 78 },
      { x: 145, y: 3.2, label: 'ap-south-1', group: 'Asia', size: 45 },
      { x: 88, y: 0.9, label: 'sa-east-1', group: 'South America', size: 38 },
    ],
    meta: {
      xAxis: { label: 'Avg Response Time', unit: 'ms' },
      yAxis: { label: 'Error Rate', unit: '%' },
      correlation: 0,
      datasetId: 'performance_metrics',
    },
  },
  employee_satisfaction: {
    type: 'relational',
    title: 'Tenure vs. Satisfaction Score',
    data: [
      { x: 0.5, y: 82, label: 'New Hire Cohort', group: '<1yr', size: 45 },
      { x: 1, y: 74, label: '1yr Cohort', group: '1-2yr', size: 62 },
      { x: 1.5, y: 69, label: '18mo Cohort', group: '1-2yr', size: 58 },
      { x: 2, y: 72, label: '2yr Cohort', group: '2-3yr', size: 71 },
      { x: 3, y: 78, label: '3yr Cohort', group: '3-5yr', size: 84 },
      { x: 4, y: 80, label: '4yr Cohort', group: '3-5yr', size: 76 },
      { x: 5, y: 85, label: '5yr Cohort', group: '5yr+', size: 55 },
      { x: 7, y: 88, label: '7yr Cohort', group: '5yr+', size: 42 },
      { x: 10, y: 91, label: '10yr Cohort', group: '5yr+', size: 28 },
    ],
    meta: {
      xAxis: { label: 'Tenure', unit: 'years' },
      yAxis: { label: 'Satisfaction Score', unit: '/100' },
      correlation: 0,
      datasetId: 'employee_satisfaction',
    },
  },
};

// Compute correlations at module load (pure, deterministic)
for (const key of Object.keys(DATASETS)) {
  const ds = DATASETS[key];
  ds.meta.correlation = pearsonCorrelation(ds.data);
}

const DEFAULT_DATASET = 'marketing_vs_revenue';

export function generateRelationalData(datasetId?: string): RelationalPayload {
  const key = datasetId && DATASETS[datasetId] ? datasetId : DEFAULT_DATASET;
  return JSON.parse(JSON.stringify(DATASETS[key])) as RelationalPayload;
}

export function getRelationalDatasets(): string[] {
  return Object.keys(DATASETS);
}
