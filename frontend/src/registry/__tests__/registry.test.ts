import { describe, it, expect } from 'vitest';
import React from 'react';

import { widgetRegistry } from '../index';
import type { WidgetDefinition } from '../../types';

// ─── Helpers ─────────────────────────────────────────────────────────────────
function makeDefinition(
  type: 'categorical' | 'temporal' | 'hierarchical' | 'relational',
  overrides: Partial<WidgetDefinition> = {}
): WidgetDefinition {
  return {
    type,
    displayName: `Test ${type}`,
    description: 'A test widget',
    icon: '🧪',
    defaultSize: { w: 4, h: 3 },
    availableDatasets: ['ds1', 'ds2'],
    component: () => React.createElement('div', null, type),
    ...overrides,
  };
}

// ─── Integration tests for the widget registry ────────────────────────────────
describe('WidgetRegistry integration', () => {
  // The singleton is shared across tests, so we read state carefully.
  // We don't reset between tests because real use-cases don't reset it either.
  // Instead we assert properties that hold regardless of registration order.

  it('starts with the four registered widget types from App.tsx imports', async () => {
    // Import App to trigger registrations
    await import('../../App');
    expect(widgetRegistry.has('categorical')).toBe(true);
    expect(widgetRegistry.has('temporal')).toBe(true);
    expect(widgetRegistry.has('hierarchical')).toBe(true);
    expect(widgetRegistry.has('relational')).toBe(true);
  });

  it('getAll() returns at least 4 definitions after App imports', async () => {
    await import('../../App');
    expect(widgetRegistry.getAll().length).toBeGreaterThanOrEqual(4);
  });

  it('get() returns undefined for an unregistered type', () => {
    // @ts-expect-error — intentionally invalid type
    expect(widgetRegistry.get('pie_chart')).toBeUndefined();
  });

  it('registered definition has required shape', async () => {
    await import('../../App');
    const def = widgetRegistry.get('categorical');
    expect(def).toBeDefined();
    expect(def!.type).toBe('categorical');
    expect(def!.displayName).toBeTypeOf('string');
    expect(def!.defaultSize.w).toBeTypeOf('number');
    expect(def!.defaultSize.h).toBeTypeOf('number');
    expect(Array.isArray(def!.availableDatasets)).toBe(true);
    expect(def!.availableDatasets.length).toBeGreaterThan(0);
  });

  it('types() returns an array of WidgetType strings', async () => {
    await import('../../App');
    const types = widgetRegistry.types();
    expect(Array.isArray(types)).toBe(true);
    types.forEach((t) => expect(typeof t).toBe('string'));
  });

  it('size() matches getAll().length', async () => {
    await import('../../App');
    expect(widgetRegistry.size()).toBe(widgetRegistry.getAll().length);
  });

  it('adding a new widget type does not require modifying existing code paths', () => {
    // This test encodes the DX promise: calling register() is all it takes.
    const before = widgetRegistry.size();

    // Simulate a 5th chart type being added
    const fakeType = 'gauge' as unknown as 'relational';
    widgetRegistry.register(makeDefinition('relational', { type: fakeType, displayName: 'Gauge' }));

    expect(widgetRegistry.size()).toBe(before + 1);
    expect(widgetRegistry.has(fakeType)).toBe(true);
    expect(widgetRegistry.get(fakeType)!.displayName).toBe('Gauge');
  });
});
