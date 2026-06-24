import { describe, it, expect } from 'vitest';
import {
  transformCategorical,
  transformTemporal,
  transformHierarchical,
  transformRelational,
  formatValue,
  formatCorrelation,
} from '../transformers';
import type {
  CategoricalPayload,
  TemporalPayload,
  HierarchicalPayload,
  RelationalPayload,
} from '../../types';

// ─── Fixtures ─────────────────────────────────────────────────────────────────
const categoricalFixture: CategoricalPayload = {
  type: 'categorical',
  title: 'Test',
  data: [
    { category: 'A', value: 100, color: '#f00' },
    { category: 'B', value: 200 },
  ],
  meta: { unit: 'USD', description: 'test', datasetId: 'test' },
};

const temporalFixture: TemporalPayload = {
  type: 'temporal',
  title: 'Test',
  data: [
    { timestamp: '2024-01-01T00:00:00.000Z', value: 10 },
    { timestamp: '2024-01-02T00:00:00.000Z', value: 20 },
    { timestamp: '2024-01-03T00:00:00.000Z', value: 15 },
  ],
  meta: { interval: 'daily', timezone: 'UTC', unit: 'USD', trend: 'up', datasetId: 'test' },
};

const hierarchicalFixture: HierarchicalPayload = {
  type: 'hierarchical',
  title: 'Test',
  root: {
    id: 'root',
    name: 'Root',
    value: 100,
    children: [
      { id: 'a', name: 'Child A', value: 60, color: '#f00' },
      { id: 'b', name: 'Child B', value: 40 },
    ],
  },
  meta: { depth: 2, totalValue: 100, description: 'test', datasetId: 'test' },
};

const relationalFixture: RelationalPayload = {
  type: 'relational',
  title: 'Test',
  data: [
    { x: 1, y: 10, label: 'P1', group: 'G1', size: 10 },
    { x: 2, y: 20, label: 'P2', group: 'G1', size: 20 },
    { x: 3, y: 5,  label: 'P3', group: 'G2', size: 15 },
  ],
  meta: {
    xAxis: { label: 'X', unit: 'u' },
    yAxis: { label: 'Y', unit: 'u' },
    correlation: 0.8,
    datasetId: 'test',
  },
};

// ─── transformCategorical ─────────────────────────────────────────────────────
describe('transformCategorical', () => {
  it('preserves category count', () => {
    expect(transformCategorical(categoricalFixture)).toHaveLength(2);
  });

  it('maps category to name and value', () => {
    const result = transformCategorical(categoricalFixture);
    expect(result[0].name).toBe('A');
    expect(result[0].value).toBe(100);
  });

  it('uses explicit color when provided', () => {
    const result = transformCategorical(categoricalFixture);
    expect(result[0].fill).toBe('#f00');
  });

  it('falls back to palette color when color is absent', () => {
    const result = transformCategorical(categoricalFixture);
    expect(result[1].fill).toMatch(/^#[0-9a-f]{6}$/i);
  });

  it('includes formattedValue string', () => {
    const result = transformCategorical(categoricalFixture);
    expect(result[0].formattedValue).toBeTypeOf('string');
    expect(result[0].formattedValue.length).toBeGreaterThan(0);
  });
});

// ─── transformTemporal ────────────────────────────────────────────────────────
describe('transformTemporal', () => {
  it('preserves data point count', () => {
    expect(transformTemporal(temporalFixture)).toHaveLength(3);
  });

  it('converts ISO-8601 to numeric epoch timestamp', () => {
    const result = transformTemporal(temporalFixture);
    expect(result[0].timestamp).toBeTypeOf('number');
    expect(result[0].timestamp).toBe(new Date('2024-01-01T00:00:00.000Z').getTime());
  });

  it('epoch timestamps are monotonically increasing', () => {
    const result = transformTemporal(temporalFixture);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].timestamp).toBeGreaterThan(result[i - 1].timestamp);
    }
  });

  it('includes a displayDate string', () => {
    const result = transformTemporal(temporalFixture);
    expect(result[0].displayDate).toBeTypeOf('string');
    expect(result[0].displayDate.length).toBeGreaterThan(0);
  });

  it('handles hourly interval display format', () => {
    const hourlyFixture: TemporalPayload = {
      ...temporalFixture,
      meta: { ...temporalFixture.meta, interval: 'hourly' },
    };
    const result = transformTemporal(hourlyFixture);
    expect(result[0].displayDate).toBeTypeOf('string');
  });
});

// ─── transformHierarchical ────────────────────────────────────────────────────
describe('transformHierarchical', () => {
  it('returns root name', () => {
    const result = transformHierarchical(hierarchicalFixture);
    expect(result.name).toBe('Root');
  });

  it('maps children correctly', () => {
    const result = transformHierarchical(hierarchicalFixture);
    expect(result.children).toHaveLength(2);
    expect(result.children![0].name).toBe('Child A');
    expect(result.children![0].size).toBe(60);
  });

  it('propagates color to children', () => {
    const result = transformHierarchical(hierarchicalFixture);
    expect(result.children![0].fill).toBe('#f00');
  });

  it('leaf nodes have size but no children array', () => {
    const result = transformHierarchical(hierarchicalFixture);
    expect(result.children![0].children).toBeUndefined();
  });
});

// ─── transformRelational ─────────────────────────────────────────────────────
describe('transformRelational', () => {
  it('groups data points by group key', () => {
    const result = transformRelational(relationalFixture);
    expect(result).toHaveLength(2); // G1 and G2
  });

  it('G1 has 2 points, G2 has 1', () => {
    const result = transformRelational(relationalFixture);
    const g1 = result.find((g) => g.name === 'G1');
    const g2 = result.find((g) => g.name === 'G2');
    expect(g1!.data).toHaveLength(2);
    expect(g2!.data).toHaveLength(1);
  });

  it('each group has a fill color', () => {
    const result = transformRelational(relationalFixture);
    result.forEach((g) => expect(g.fill).toMatch(/^#[0-9a-f]{6}$/i));
  });

  it('normalises z values within 5-25 range', () => {
    const result = transformRelational(relationalFixture);
    result.forEach((g) =>
      g.data.forEach((pt) => {
        expect(pt.z).toBeGreaterThanOrEqual(5);
        expect(pt.z).toBeLessThanOrEqual(25);
      })
    );
  });

  it('uses "Default" group when group is undefined', () => {
    const noGroupFixture: RelationalPayload = {
      ...relationalFixture,
      data: [{ x: 1, y: 1, label: 'P' }],
    };
    const result = transformRelational(noGroupFixture);
    expect(result[0].name).toBe('Default');
  });
});

// ─── formatValue ─────────────────────────────────────────────────────────────
describe('formatValue', () => {
  it('formats USD values with currency notation', () => {
    const result = formatValue(1_500_000, 'USD');
    expect(result).toContain('$');
  });

  it('formats non-currency values with unit suffix', () => {
    const result = formatValue(5_000, 'users');
    expect(result).toContain('users');
  });
});

// ─── formatCorrelation ───────────────────────────────────────────────────────
describe('formatCorrelation', () => {
  it('describes a strong positive correlation', () => {
    expect(formatCorrelation(0.95)).toContain('positive');
    expect(formatCorrelation(0.95)).toContain('very strong');
  });

  it('describes a negative correlation', () => {
    expect(formatCorrelation(-0.75)).toContain('negative');
  });

  it('returns "no correlation" for zero', () => {
    expect(formatCorrelation(0)).toBe('no correlation');
  });

  it('includes the r= value rounded to 3 decimal places', () => {
    expect(formatCorrelation(0.8)).toContain('r=0.800');
  });
});
