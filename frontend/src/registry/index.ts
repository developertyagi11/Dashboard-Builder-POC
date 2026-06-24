import type { WidgetDefinition, WidgetPayload, WidgetType } from '../types';

/**
 * WidgetRegistry — the central extension point.
 *
 * To add a new chart type:
 *   1. Create a widget component in src/widgets/
 *   2. Call widgetRegistry.register({ type, displayName, component, ... })
 *   3. Done. The Dashboard shell discovers it automatically.
 *
 * The core layout/rendering logic never needs to change.
 */
class WidgetRegistry {
  private readonly registry = new Map<WidgetType, WidgetDefinition>();

  register<T extends WidgetPayload>(definition: WidgetDefinition<T>): void {
    if (this.registry.has(definition.type)) {
      console.warn(`[WidgetRegistry] Overwriting registration for type "${definition.type}"`);
    }
    // Cast is safe: T is constrained to WidgetPayload, and the Map holds the
    // base type so the Dashboard can retrieve without knowing T at call-site.
    this.registry.set(definition.type, definition as unknown as WidgetDefinition);
  }

  get(type: WidgetType): WidgetDefinition | undefined {
    return this.registry.get(type);
  }

  getAll(): WidgetDefinition[] {
    return Array.from(this.registry.values());
  }

  has(type: WidgetType): boolean {
    return this.registry.has(type);
  }

  size(): number {
    return this.registry.size;
  }

  types(): WidgetType[] {
    return Array.from(this.registry.keys());
  }
}

export const widgetRegistry = new WidgetRegistry();
