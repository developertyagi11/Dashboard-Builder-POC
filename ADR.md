# Architectural Decision Records

## ADR-001: State Management — Zustand over Redux

**Status:** Accepted  
**Date:** 2024-01

### Context

The dashboard requires a complex global state combining widget instances, layout positions, and per-widget configurations, all persisted to localStorage. The state is read by many components but written by relatively few (the toolbar, the WidgetCard config panel, and the GridLayout callback).

### Decision

Use **Zustand** with the `persist` and `subscribeWithSelector` middleware.

### Rationale

| Criterion | Redux Toolkit | Zustand |
|---|---|---|
| Boilerplate | Slices + actions + selectors = ~4 files | Single store file |
| Middleware | `redux-persist` separate package | Built-in `persist` middleware |
| Selective re-renders | `useSelector` with equality fn | `useStore(s => s.slice)` with automatic shallow equality |
| TypeScript DX | Good (RTK has good types) | Excellent (store is a plain typed object) |
| Bundle size | ~14 kB | ~1.2 kB |

**Key benefit:** Zustand's selector-based subscription model means `WidgetCard` only re-renders when _its own widget instance_ changes, not when an unrelated widget updates. This is critical for dashboard performance at scale.

**Trade-off:** Redux DevTools integration is less seamless with Zustand (though available via the `devtools` middleware). For a team already invested in Redux, RTK would be equally valid.

---

## ADR-002: Charting Library — Recharts over Victory / ECharts / D3

**Status:** Accepted  
**Date:** 2024-01

### Context

We need to render four structurally distinct chart types (bar, area, treemap, scatter) with a shared dark theme, tooltips, and responsive sizing.

### Decision

Use **Recharts 2.x** as the primary charting library.

### Rationale

| Criterion | Recharts | Victory | ECharts | D3 |
|---|---|---|---|---|
| React-native API | Composable JSX | Composable JSX | Imperative | Imperative |
| TypeScript support | First-class | Good | Types via `@types/echarts` | First-class |
| Treemap built-in | ✅ | ❌ | ✅ | via `d3-hierarchy` |
| Scatter + ZAxis | ✅ | ✅ | ✅ | Manual |
| Bundle size | ~230 kB | ~160 kB | ~750 kB | ~500 kB |
| Responsive container | `<ResponsiveContainer>` | Manual | `resize` option | Manual |

**Key benefit:** `<ResponsiveContainer>` handles grid resize events without any imperative DOM manipulation, which aligns perfectly with the react-grid-layout resize lifecycle. Each chart is a pure functional component.

**Trade-off:** Recharts has limited support for some advanced chart types (sunburst, sankey). For production, ECharts would be stronger for hierarchical and flow diagrams. We chose Recharts because the POC treemap implementation is sufficient, and the React-first API reduces complexity.

---

## ADR-003: Widget Registry — Self-Registration Pattern

**Status:** Accepted  
**Date:** 2024-01

### Context

The brief requires that "adding a new chart type should not require modifying the core layout logic." The naive approach — a switch statement in the Dashboard component — violates this.

### Decision

Use a **singleton Map-based registry** where each widget module registers itself on import.

### Mechanics

```
App.tsx
  └─ imports CategoricalWidget.tsx  ──► widgetRegistry.register({ type: 'categorical', ... })
  └─ imports TemporalWidget.tsx     ──► widgetRegistry.register({ type: 'temporal', ... })
  └─ ...

Dashboard.tsx
  └─ widgetRegistry.getAll()  ← discovers all registered types dynamically
  └─ widgetRegistry.get(type) ← renders any type without knowing it at compile time
```

### Benefits

- **Zero modification** to the core shell for new chart types
- **Co-location** of type metadata (icon, default size, datasets) with the component
- **Testable** as a unit: the registry integration test verifies registration count and shape

### Trade-off

Import order matters: widget files must be imported before the Dashboard mounts. This is enforced in `App.tsx` via top-level side-effectful imports (explicit and deliberate, not accidental).

---

## ADR-004: Data Drift Handling (Production Design)

**Status:** Proposed  
**Date:** 2024-01

### Context

If this system were connected to a live stream (Kafka, WebSocket, or polling API), the shape of incoming data could change without notice — new fields, renamed keys, dropped fields, changed types.

### Proposed Strategy

**Layer 1 — Schema validation at the API boundary**  
Every response runs through the Zod discriminated union schema before being passed to the frontend. Any payload that fails validation is rejected with a structured `SCHEMA_MISMATCH` error rather than a silent render failure. The widget displays an isolated error state; the rest of the dashboard continues working.

**Layer 2 — Schema versioning**  
Each payload includes a `schemaVersion` field (e.g., `"v2"`). The backend maintains a version registry and can apply upgrade transformers (`v1 → v2`) so old clients continue to function during migrations.

**Layer 3 — Monitoring & alerting**  
Failed Zod parses are emitted as structured log events (`validation_error`, `payload_type`, `field_path`) to a metrics system (DataDog/Prometheus). A threshold alert fires when validation failure rate exceeds 1% over a 5-minute window, indicating an upstream schema change.

**Layer 4 — Graceful degradation**  
The widget's error boundary catches runtime errors (e.g., a transformer accessing a field that no longer exists). The user sees a retry button, not a broken page. Stale-while-revalidate caching means the last good payload remains visible while the new one is being validated.

**Layer 5 — Contract testing**  
Backend and frontend share a Zod schema package. CI runs Pact-style contract tests that compare the backend's emitted schema against the frontend's expected schema on every PR, catching drift before it reaches production.
