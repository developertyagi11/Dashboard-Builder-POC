import { z } from 'zod';

// ─── Categorical ─────────────────────────────────────────────────────────────
export const CategoricalDataPointSchema = z.object({
  category: z.string().min(1),
  value: z.number().finite(),
  color: z.string().optional(),
});

export const CategoricalPayloadSchema = z.object({
  type: z.literal('categorical'),
  title: z.string().min(1),
  data: z.array(CategoricalDataPointSchema).min(1),
  meta: z.object({
    unit: z.string(),
    description: z.string(),
    datasetId: z.string(),
  }),
});

// ─── Temporal ────────────────────────────────────────────────────────────────
const ISO8601Regex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

export const TemporalDataPointSchema = z.object({
  timestamp: z.string().regex(ISO8601Regex, 'Must be ISO-8601 UTC (Z suffix)'),
  value: z.number().finite(),
  label: z.string().optional(),
});

export const TemporalPayloadSchema = z.object({
  type: z.literal('temporal'),
  title: z.string().min(1),
  data: z.array(TemporalDataPointSchema).min(2),
  meta: z.object({
    interval: z.enum(['hourly', 'daily', 'weekly', 'monthly']),
    timezone: z.string(),
    unit: z.string(),
    trend: z.enum(['up', 'down', 'flat']),
    datasetId: z.string(),
  }),
});

// ─── Hierarchical ────────────────────────────────────────────────────────────
// Recursive schema via z.lazy
type HierarchicalNodeInput = {
  id: string;
  name: string;
  value: number;
  color?: string;
  children?: HierarchicalNodeInput[];
};

export const HierarchicalNodeSchema: z.ZodType<HierarchicalNodeInput> = z.lazy(
  () =>
    z.object({
      id: z.string().min(1),
      name: z.string().min(1),
      value: z.number().nonnegative(),
      color: z.string().optional(),
      children: z.array(HierarchicalNodeSchema).optional(),
    })
);

export const HierarchicalPayloadSchema = z.object({
  type: z.literal('hierarchical'),
  title: z.string().min(1),
  root: HierarchicalNodeSchema,
  meta: z.object({
    depth: z.number().int().positive(),
    totalValue: z.number().positive(),
    description: z.string(),
    datasetId: z.string(),
  }),
});

// ─── Relational ──────────────────────────────────────────────────────────────
export const RelationalDataPointSchema = z.object({
  x: z.number().finite(),
  y: z.number().finite(),
  label: z.string().min(1),
  group: z.string().optional(),
  size: z.number().positive().optional(),
});

export const RelationalPayloadSchema = z.object({
  type: z.literal('relational'),
  title: z.string().min(1),
  data: z.array(RelationalDataPointSchema).min(2),
  meta: z.object({
    xAxis: z.object({ label: z.string(), unit: z.string() }),
    yAxis: z.object({ label: z.string(), unit: z.string() }),
    correlation: z.number().min(-1).max(1),
    datasetId: z.string(),
  }),
});

// ─── Discriminated Union ──────────────────────────────────────────────────────
export const WidgetPayloadSchema = z.discriminatedUnion('type', [
  CategoricalPayloadSchema,
  TemporalPayloadSchema,
  HierarchicalPayloadSchema,
  RelationalPayloadSchema,
]);

// ─── Request Schemas ──────────────────────────────────────────────────────────
export const BatchRequestSchema = z.object({
  requests: z
    .array(
      z.object({
        widgetId: z.string().min(1),
        type: z.enum(['categorical', 'temporal', 'hierarchical', 'relational']),
        datasetId: z.string().optional(),
      })
    )
    .min(1)
    .max(20),
});
