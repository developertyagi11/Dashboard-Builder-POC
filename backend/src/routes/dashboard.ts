import { Router } from 'express';
import { Schema, model } from 'mongoose';

const DashboardSchema = new Schema(
  {
    widgets: { type: Schema.Types.Mixed, default: {} },
    layout:  { type: [Schema.Types.Mixed], default: [] },
  },
  { timestamps: true }
);

const Dashboard = model('Dashboard', DashboardSchema);

export const dashboardRouter = Router();

// GET /api/dashboard — load saved state
dashboardRouter.get('/', async (_req, res, next) => {
  try {
    let doc = await Dashboard.findOne();
    if (!doc) {
      doc = await Dashboard.create({ widgets: {}, layout: [] });
    }
    res.json({ widgets: doc.get('widgets') ?? {}, layout: doc.get('layout') ?? [] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/dashboard — upsert state
dashboardRouter.put('/', async (req, res, next) => {
  try {
    const { widgets, layout } = req.body as { widgets: unknown; layout: unknown[] };
    const doc = await Dashboard.findOneAndUpdate(
      {},
      { $set: { widgets, layout } },
      { upsert: true, new: true }
    );
    res.json({ widgets: doc?.get('widgets') ?? {}, layout: doc?.get('layout') ?? [] });
  } catch (err) {
    next(err);
  }
});
