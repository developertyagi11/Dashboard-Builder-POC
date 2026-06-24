import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { WidgetInstance, WidgetLayout, WidgetType, WidgetConfig } from '../types';
import { widgetRegistry } from '../registry';
import { loadDashboard, saveDashboard } from '../api/dashboard';

const COLS = 12;

interface DashboardStore {
  widgets: Record<string, WidgetInstance>;
  layout: WidgetLayout[];
  isLoading: boolean;
  saveError: string | null;

  initDashboard: () => Promise<void>;
  addWidget: (type: WidgetType) => void;
  removeWidget: (id: string) => void;
  updateLayout: (newLayout: WidgetLayout[]) => void;
  updateWidgetConfig: (id: string, config: Partial<WidgetConfig>) => void;
  resetDashboard: () => void;
}

let idCounter = 0;
function generateId(): string {
  return `widget-${Date.now()}-${++idCounter}`;
}

/** Pack new widget into the first available slot (fills rows left-to-right before going down) */
function findPlacement(layout: WidgetLayout[], newW: number, newH: number): { x: number; y: number } {
  if (layout.length === 0) return { x: 0, y: 0 };

  const maxRow = layout.reduce((m, l) => Math.max(m, l.y + l.h), 0);

  for (let y = 0; y <= maxRow; y++) {
    for (let x = 0; x <= COLS - newW; x++) {
      const overlaps = layout.some(
        (l) =>
          x < l.x + l.w && x + newW > l.x &&
          y < l.y + l.h && y + newH > l.y
      );
      if (!overlaps) return { x, y };
    }
  }

  return { x: 0, y: maxRow };
}

// Debounce saves so rapid drag/resize events don't flood the API
let saveTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleSave(widgets: Record<string, WidgetInstance>, layout: WidgetLayout[]) {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    saveDashboard({ widgets, layout }).catch((err) => {
      console.error('[dashboardStore] save failed:', err);
    });
  }, 600);
}

export const useDashboardStore = create<DashboardStore>()(
  subscribeWithSelector(
    (set, get) => ({
      widgets: {},
      layout: [],
      isLoading: false,
      saveError: null,

      async initDashboard() {
        set({ isLoading: true });
        try {
          const { widgets, layout } = await loadDashboard();
          set({ widgets, layout, isLoading: false });
        } catch (err) {
          console.error('[dashboardStore] init failed:', err);
          // Fall back to empty dashboard — don't block the UI
          set({ isLoading: false });
        }
      },

      addWidget(type) {
        const definition = widgetRegistry.get(type);
        if (!definition) {
          console.error(`[dashboardStore] unknown widget type: ${type}`);
          return;
        }

        const id = generateId();
        const { w, h, minW, minH } = definition.defaultSize;
        const { x, y } = findPlacement(get().layout, w, h);

        const instance: WidgetInstance = {
          id,
          type,
          config: { datasetId: definition.availableDatasets[0] },
        };
        const layoutItem: WidgetLayout = { i: id, x, y, w, h, minW, minH };

        set((state) => {
          const widgets = { ...state.widgets, [id]: instance };
          const layout = [...state.layout, layoutItem];
          scheduleSave(widgets, layout);
          return { widgets, layout };
        });
      },

      removeWidget(id) {
        set((state) => {
          const { [id]: _removed, ...widgets } = state.widgets;
          const layout = state.layout.filter((l) => l.i !== id);
          scheduleSave(widgets, layout);
          return { widgets, layout };
        });
      },

      updateLayout(newLayout) {
        set((state) => {
          const layout = newLayout.map((incoming) => {
            const existing = state.layout.find((l) => l.i === incoming.i);
            return existing ? { ...existing, ...incoming } : incoming;
          });
          scheduleSave(state.widgets, layout);
          return { layout };
        });
      },

      updateWidgetConfig(id, config) {
        set((state) => {
          const existing = state.widgets[id];
          if (!existing) return state;
          const widgets = {
            ...state.widgets,
            [id]: { ...existing, config: { ...existing.config, ...config } },
          };
          scheduleSave(widgets, state.layout);
          return { widgets };
        });
      },

      resetDashboard() {
        set({ widgets: {}, layout: [] });
        scheduleSave({}, []);
      },
    })
  )
);
