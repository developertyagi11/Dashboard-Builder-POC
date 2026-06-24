import { Router, type Request, type Response, type NextFunction } from 'express';
import { BatchRequestSchema } from '../schemas';
import { generateWidgetData, getAvailableDatasets } from '../generators';
import type { BatchWidgetResponse, WidgetType } from '../types';
import { AppError } from '../middleware/errorHandler';

export const widgetsRouter = Router();

// GET /api/widgets/datasets — list available dataset IDs per type
widgetsRouter.get('/datasets', (_req: Request, res: Response) => {
  res.json({ datasets: getAvailableDatasets() });
});

// GET /api/widgets/:type — fetch a single widget's data
widgetsRouter.get(
  '/:type',
  (req: Request, res: Response, next: NextFunction) => {
    const { type } = req.params;
    const validTypes: WidgetType[] = ['categorical', 'temporal', 'hierarchical', 'relational'];

    if (!validTypes.includes(type as WidgetType)) {
      return next(
        new AppError(404, 'UNKNOWN_WIDGET_TYPE', `Widget type "${type}" is not registered.`)
      );
    }

    const datasetId = typeof req.query['datasetId'] === 'string' ? req.query['datasetId'] : undefined;

    try {
      const data = generateWidgetData(type as WidgetType, datasetId);
      res.json({ data });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/widgets/batch — fetch multiple widget datasets concurrently
widgetsRouter.post(
  '/batch',
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = BatchRequestSchema.safeParse(req.body);
      if (!parsed.success) {
        return next(parsed.error);
      }

      const { requests } = parsed.data;

      // Concurrently generate all widget data (CPU-bound simulation;
      // in production these would be real async DB/API calls)
      const settled = await Promise.allSettled(
        requests.map(async ({ widgetId, type, datasetId }) => ({
          widgetId,
          result: generateWidgetData(type as WidgetType, datasetId),
        }))
      );

      const results: BatchWidgetResponse['results'] = {};
      settled.forEach((outcome, i) => {
        const { widgetId } = requests[i];
        if (outcome.status === 'fulfilled') {
          results[widgetId] = { status: 'success', data: outcome.value.result };
        } else {
          results[widgetId] = {
            status: 'error',
            error:
              outcome.reason instanceof Error
                ? outcome.reason.message
                : 'Unknown error',
          };
        }
      });

      const response: BatchWidgetResponse = {
        results,
        fetchedAt: new Date().toISOString(),
      };

      res.json(response);
    } catch (err) {
      next(err);
    }
  }
);
