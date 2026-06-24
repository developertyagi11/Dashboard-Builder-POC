import { generateCategoricalData } from '../src/generators/categorical';
import { generateTemporalData } from '../src/generators/temporal';
import { generateHierarchicalData } from '../src/generators/hierarchical';
import { generateRelationalData } from '../src/generators/relational';
import { generateWidgetData } from '../src/generators';
import {
  CategoricalPayloadSchema,
  TemporalPayloadSchema,
  HierarchicalPayloadSchema,
  RelationalPayloadSchema,
} from '../src/schemas';

// ─── ISO-8601 regex ───────────────────────────────────────────────────────────
const ISO8601_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

describe('Categorical Generator', () => {
  it('returns valid schema-compliant data for default dataset', () => {
    const data = generateCategoricalData();
    const result = CategoricalPayloadSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('returns correct type discriminant', () => {
    expect(generateCategoricalData().type).toBe('categorical');
  });

  it('falls back to default dataset for unknown datasetId', () => {
    const data = generateCategoricalData('non_existent_dataset');
    expect(data.meta.datasetId).toBe('sales_by_region');
  });

  it('returns requested dataset when valid', () => {
    const data = generateCategoricalData('products_by_category');
    expect(data.meta.datasetId).toBe('products_by_category');
  });

  it('all data points have positive values', () => {
    const data = generateCategoricalData();
    data.data.forEach((pt) => expect(pt.value).toBeGreaterThan(0));
  });

  it('returns a deep clone (mutations do not affect subsequent calls)', () => {
    const first = generateCategoricalData();
    first.data[0].value = 999_999_999;
    const second = generateCategoricalData();
    expect(second.data[0].value).not.toBe(999_999_999);
  });
});

describe('Temporal Generator', () => {
  it('returns valid schema-compliant data', () => {
    const data = generateTemporalData();
    const result = TemporalPayloadSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('all timestamps are ISO-8601 UTC', () => {
    const data = generateTemporalData();
    data.data.forEach((pt) =>
      expect(pt.timestamp).toMatch(ISO8601_RE)
    );
  });

  it('timestamps are monotonically increasing', () => {
    const data = generateTemporalData('stock_price');
    for (let i = 1; i < data.data.length; i++) {
      expect(new Date(data.data[i].timestamp).getTime()).toBeGreaterThan(
        new Date(data.data[i - 1].timestamp).getTime()
      );
    }
  });

  it('trend field is one of the valid enum values', () => {
    const valid = ['up', 'down', 'flat'];
    const data = generateTemporalData();
    expect(valid).toContain(data.meta.trend);
  });

  it('daily_active_users dataset has at least 60 data points', () => {
    const data = generateTemporalData('daily_active_users');
    expect(data.data.length).toBeGreaterThanOrEqual(60);
  });

  it('server_latency dataset uses hourly interval', () => {
    const data = generateTemporalData('server_latency');
    expect(data.meta.interval).toBe('hourly');
  });
});

describe('Hierarchical Generator', () => {
  it('returns valid schema-compliant data', () => {
    const data = generateHierarchicalData();
    const result = HierarchicalPayloadSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('depth meta matches actual tree depth', () => {
    function depth(node: { children?: unknown[] }): number {
      if (!node.children || node.children.length === 0) return 1;
      return 1 + Math.max(...(node.children as typeof node[]).map(depth));
    }
    const data = generateHierarchicalData('tech_budget');
    expect(data.meta.depth).toBe(depth(data.root));
  });

  it('totalValue equals sum of all leaf nodes', () => {
    function leafSum(node: { value: number; children?: typeof node[] }): number {
      if (!node.children || node.children.length === 0) return node.value;
      return node.children.reduce((s, c) => s + leafSum(c), 0);
    }
    const data = generateHierarchicalData('tech_budget');
    expect(data.meta.totalValue).toBeCloseTo(leafSum(data.root), 0);
  });

  it('market_share dataset sums to 100', () => {
    const data = generateHierarchicalData('market_share');
    expect(data.meta.totalValue).toBe(100);
  });

  it('all node values are non-negative', () => {
    function checkNonNegative(node: { value: number; children?: typeof node[] }): void {
      expect(node.value).toBeGreaterThanOrEqual(0);
      node.children?.forEach(checkNonNegative);
    }
    checkNonNegative(generateHierarchicalData().root);
  });
});

describe('Relational Generator', () => {
  it('returns valid schema-compliant data', () => {
    const data = generateRelationalData();
    const result = RelationalPayloadSchema.safeParse(data);
    expect(result.success).toBe(true);
  });

  it('correlation coefficient is between -1 and 1', () => {
    const data = generateRelationalData();
    expect(data.meta.correlation).toBeGreaterThanOrEqual(-1);
    expect(data.meta.correlation).toBeLessThanOrEqual(1);
  });

  it('marketing_vs_revenue has positive correlation', () => {
    const data = generateRelationalData('marketing_vs_revenue');
    expect(data.meta.correlation).toBeGreaterThan(0.9);
  });

  it('returns a deep clone on each call', () => {
    const first = generateRelationalData();
    first.data[0].x = 99999;
    const second = generateRelationalData();
    expect(second.data[0].x).not.toBe(99999);
  });
});

describe('generateWidgetData dispatcher', () => {
  it.each([
    ['categorical'],
    ['temporal'],
    ['hierarchical'],
    ['relational'],
  ] as const)('dispatches %s without throwing', (type) => {
    expect(() => generateWidgetData(type)).not.toThrow();
  });

  it('returns payloads with matching type discriminant', () => {
    const types = ['categorical', 'temporal', 'hierarchical', 'relational'] as const;
    types.forEach((type) => {
      expect(generateWidgetData(type).type).toBe(type);
    });
  });
});
