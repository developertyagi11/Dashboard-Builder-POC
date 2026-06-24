import type { HierarchicalPayload, HierarchicalNode } from '../types';

function sumChildren(node: HierarchicalNode): number {
  if (!node.children || node.children.length === 0) return node.value;
  return node.children.reduce((acc, child) => acc + sumChildren(child), 0);
}

function treeDepth(node: HierarchicalNode): number {
  if (!node.children || node.children.length === 0) return 1;
  return 1 + Math.max(...node.children.map(treeDepth));
}

const DATASETS: Record<string, () => HierarchicalPayload> = {
  tech_budget: () => {
    const root: HierarchicalNode = {
      id: 'root',
      name: 'Engineering Budget',
      value: 0,
      children: [
        {
          id: 'infra',
          name: 'Infrastructure',
          value: 0,
          color: '#6366f1',
          children: [
            { id: 'cloud', name: 'Cloud Hosting', value: 420_000 },
            { id: 'cdn', name: 'CDN & Bandwidth', value: 85_000 },
            { id: 'monitoring', name: 'Monitoring', value: 62_000 },
          ],
        },
        {
          id: 'eng',
          name: 'Engineering',
          value: 0,
          color: '#8b5cf6',
          children: [
            { id: 'backend', name: 'Backend Team', value: 980_000 },
            { id: 'frontend', name: 'Frontend Team', value: 720_000 },
            { id: 'data', name: 'Data Platform', value: 540_000 },
          ],
        },
        {
          id: 'tooling',
          name: 'Tooling & Licenses',
          value: 0,
          color: '#a78bfa',
          children: [
            { id: 'saas', name: 'SaaS Tools', value: 148_000 },
            { id: 'security', name: 'Security Software', value: 92_000 },
          ],
        },
      ],
    };

    // Roll up leaf values to parents
    function rollUp(node: HierarchicalNode): HierarchicalNode {
      if (!node.children || node.children.length === 0) return node;
      const rolled = { ...node, children: node.children.map(rollUp) };
      if (rolled.value === 0) {
        rolled.value = rolled.children.reduce((s, c) => s + c.value, 0);
      }
      return rolled;
    }

    const computed = rollUp(root);
    return {
      type: 'hierarchical',
      title: 'Annual Engineering Budget Breakdown',
      root: computed,
      meta: {
        depth: treeDepth(computed),
        totalValue: sumChildren(computed),
        description: 'Treemap of annual engineering spend by category',
        datasetId: 'tech_budget',
      },
    };
  },

  market_share: () => {
    const root: HierarchicalNode = {
      id: 'root',
      name: 'Global Smartphone Market',
      value: 100,
      children: [
        {
          id: 'apple',
          name: 'Apple',
          value: 0,
          color: '#f59e0b',
          children: [
            { id: 'iphone15', name: 'iPhone 15 Series', value: 18 },
            { id: 'iphone14', name: 'iPhone 14 Series', value: 8 },
            { id: 'older_apple', name: 'Older Models', value: 2 },
          ],
        },
        {
          id: 'samsung',
          name: 'Samsung',
          value: 0,
          color: '#3b82f6',
          children: [
            { id: 'galaxy_s', name: 'Galaxy S Series', value: 12 },
            { id: 'galaxy_a', name: 'Galaxy A Series', value: 10 },
            { id: 'galaxy_other', name: 'Other Samsung', value: 6 },
          ],
        },
        {
          id: 'xiaomi',
          name: 'Xiaomi',
          value: 13,
          color: '#ef4444',
        },
        {
          id: 'oppo',
          name: 'OPPO',
          value: 10,
          color: '#22c55e',
        },
        {
          id: 'others',
          name: 'Others',
          value: 21,
          color: '#94a3b8',
        },
      ],
    };

    function rollUp(node: HierarchicalNode): HierarchicalNode {
      if (!node.children || node.children.length === 0) return node;
      const rolled = { ...node, children: node.children.map(rollUp) };
      if (rolled.value === 0) {
        rolled.value = rolled.children.reduce((s, c) => s + c.value, 0);
      }
      return rolled;
    }

    const computed = rollUp(root);
    return {
      type: 'hierarchical',
      title: 'Global Smartphone Market Share',
      root: computed,
      meta: {
        depth: treeDepth(computed),
        totalValue: 100,
        description: 'Market share by vendor and sub-model (% of units shipped)',
        datasetId: 'market_share',
      },
    };
  },
};

const DEFAULT_DATASET = 'tech_budget';

export function generateHierarchicalData(datasetId?: string): HierarchicalPayload {
  const key = datasetId && DATASETS[datasetId] ? datasetId : DEFAULT_DATASET;
  return DATASETS[key]();
}

export function getHierarchicalDatasets(): string[] {
  return Object.keys(DATASETS);
}
