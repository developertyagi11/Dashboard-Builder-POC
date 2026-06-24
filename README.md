# Dashboard Builder POC

A scalable, extensible dashboard builder with dynamic widget registration, complex state management, and four distinct visualization types — built with Node.js/Express + React/TypeScript.

## Quick Start (Docker — recommended)

```bash
docker compose up --build
```

- Frontend: http://localhost:5173
- Backend API: http://localhost:3001
- Health check: http://localhost:3001/health

## Local Development

### Prerequisites

- Node.js 20+
- npm 9+

### Backend

```bash
cd backend
npm install
npm run dev        # ts-node-dev hot-reload on :3001
```

### Frontend

```bash
cd frontend
npm install
npm run dev        # Vite dev server on :5173
```

The Vite dev server proxies `/api/*` to `localhost:3001`, so no CORS issues during development.

## Running Tests

```bash
# Backend (Jest)
cd backend
npm test

# Frontend (Vitest)
cd frontend
npm test
```

Coverage reports:
```bash
cd backend && npm run test:coverage
cd frontend && npm run test:coverage
```

## API Reference

| Endpoint | Method | Description |
|---|---|---|
| `/health` | GET | Server health check |
| `/api/widgets/datasets` | GET | List all available dataset IDs per type |
| `/api/widgets/:type` | GET | Fetch data for a single widget. `?datasetId=` optional |
| `/api/widgets/batch` | POST | Fetch multiple widgets concurrently |

### Batch request body

```json
{
  "requests": [
    { "widgetId": "w1", "type": "categorical", "datasetId": "sales_by_region" },
    { "widgetId": "w2", "type": "temporal" },
    { "widgetId": "w3", "type": "hierarchical", "datasetId": "market_share" },
    { "widgetId": "w4", "type": "relational", "datasetId": "performance_metrics" }
  ]
}
```

## Adding a 5th Chart Type

1. **Backend** — add a generator in `backend/src/generators/pie.ts` and register it in `generators/index.ts` switch.
2. **Frontend** — create `frontend/src/widgets/PieWidget.tsx` and call `widgetRegistry.register({ type: 'pie', ... })`.
3. **Import it** in `frontend/src/App.tsx`.

That's it. Zero changes to the Dashboard shell, registry, store, or routing logic.

## Project Structure

```
dashboard-builder-poc/
├── backend/
│   ├── src/
│   │   ├── types/         # TypeScript data contracts
│   │   ├── schemas/       # Zod runtime validation schemas
│   │   ├── generators/    # Mock data engines (categorical, temporal, hierarchical, relational)
│   │   ├── routes/        # Express route handlers
│   │   ├── middleware/    # Error handler
│   │   └── index.ts       # Server bootstrap
│   └── tests/             # Jest integration + unit tests
└── frontend/
    └── src/
        ├── types/          # Shared TypeScript contracts (mirrors backend)
        ├── registry/       # WidgetRegistry singleton
        ├── store/          # Zustand dashboard state (persisted to localStorage)
        ├── widgets/        # 4 chart components — each self-registers
        ├── components/     # Dashboard shell, WidgetCard (ErrorBoundary), AddWidgetModal
        ├── hooks/          # useWidgetData (fetch + retry + abort)
        └── utils/          # Pure data transformers (unit tested)
```
