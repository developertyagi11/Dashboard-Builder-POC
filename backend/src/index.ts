import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { widgetsRouter } from './routes/widgets';
import { dashboardRouter } from './routes/dashboard';
import { errorHandler } from './middleware/errorHandler';

const app = express();
const PORT = process.env['PORT'] ?? 3001;
const MONGODB_URI = process.env['MONGODB_URI'] ?? 'mongodb://localhost:27017/dashboard';

app.use(cors({ origin: process.env['CORS_ORIGIN'] ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

// Health check
app.get('/health', (_req, res) => res.json({ status: 'ok', timestamp: new Date().toISOString() }));

// API routes
app.use('/api/widgets', widgetsRouter);
app.use('/api/dashboard', dashboardRouter);

// 404 for unmatched routes
app.use((_req, res) => res.status(404).json({ error: 'NOT_FOUND', message: 'Route not found' }));

// Global error handler — must be last
app.use(errorHandler);

// Only bind to a port when run directly, not when imported by tests
if (require.main === module) {
  mongoose
    .connect(MONGODB_URI)
    .then(() => {
      console.log(`Connected to MongoDB at ${MONGODB_URI}`);
      app.listen(PORT, () => {
        console.log(`Dashboard API running on http://localhost:${PORT}`);
      });
    })
    .catch((err) => {
      console.error('Failed to connect to MongoDB:', err);
      process.exit(1);
    });
}

export { app };
