import { generateCategoricalData, getCategoricalDatasets } from './categorical';
import { generateTemporalData, getTemporalDatasets } from './temporal';
import { generateHierarchicalData, getHierarchicalDatasets } from './hierarchical';
import { generateRelationalData, getRelationalDatasets } from './relational';
import type { WidgetPayload, WidgetType } from '../types';

export function generateWidgetData(type: WidgetType, datasetId?: string): WidgetPayload {
  switch (type) {
    case 'categorical':
      return generateCategoricalData(datasetId);
    case 'temporal':
      return generateTemporalData(datasetId);
    case 'hierarchical':
      return generateHierarchicalData(datasetId);
    case 'relational':
      return generateRelationalData(datasetId);
    default: {
      const _exhaustive: never = type;
      throw new Error(`Unknown widget type: ${_exhaustive}`);
    }
  }
}

export function getAvailableDatasets(): Record<WidgetType, string[]> {
  return {
    categorical: getCategoricalDatasets(),
    temporal: getTemporalDatasets(),
    hierarchical: getHierarchicalDatasets(),
    relational: getRelationalDatasets(),
  };
}
