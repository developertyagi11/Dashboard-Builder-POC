import request from 'supertest';
import { app } from '../src/index';

describe('GET /health', () => {
  it('returns 200 with status ok', async () => {
    const res = await request(app).get('/health');
    expect(res.status).toBe(200);
    expect(res.body.status).toBe('ok');
    expect(res.body.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });
});

describe('GET /api/widgets/datasets', () => {
  it('returns dataset lists for all four widget types', async () => {
    const res = await request(app).get('/api/widgets/datasets');
    expect(res.status).toBe(200);
    expect(res.body.datasets).toHaveProperty('categorical');
    expect(res.body.datasets).toHaveProperty('temporal');
    expect(res.body.datasets).toHaveProperty('hierarchical');
    expect(res.body.datasets).toHaveProperty('relational');
    expect(Array.isArray(res.body.datasets.categorical)).toBe(true);
  });
});

describe('GET /api/widgets/:type', () => {
  it.each(['categorical', 'temporal', 'hierarchical', 'relational'])(
    'returns 200 and correct type for %s',
    async (type) => {
      const res = await request(app).get(`/api/widgets/${type}`);
      expect(res.status).toBe(200);
      expect(res.body.data.type).toBe(type);
    }
  );

  it('returns 404 for unknown widget type', async () => {
    const res = await request(app).get('/api/widgets/unknown_type');
    expect(res.status).toBe(404);
    expect(res.body.error).toBe('UNKNOWN_WIDGET_TYPE');
  });

  it('accepts a valid datasetId query parameter', async () => {
    const res = await request(app).get('/api/widgets/categorical?datasetId=support_tickets');
    expect(res.status).toBe(200);
    expect(res.body.data.meta.datasetId).toBe('support_tickets');
  });

  it('falls back to default dataset for invalid datasetId', async () => {
    const res = await request(app).get('/api/widgets/categorical?datasetId=does_not_exist');
    expect(res.status).toBe(200);
    expect(res.body.data.meta.datasetId).toBe('sales_by_region');
  });
});

describe('POST /api/widgets/batch', () => {
  it('returns results for all requested widgets', async () => {
    const res = await request(app)
      .post('/api/widgets/batch')
      .send({
        requests: [
          { widgetId: 'w1', type: 'categorical' },
          { widgetId: 'w2', type: 'temporal' },
          { widgetId: 'w3', type: 'hierarchical' },
          { widgetId: 'w4', type: 'relational' },
        ],
      });
    expect(res.status).toBe(200);
    expect(res.body.results.w1.status).toBe('success');
    expect(res.body.results.w2.status).toBe('success');
    expect(res.body.results.w3.status).toBe('success');
    expect(res.body.results.w4.status).toBe('success');
    expect(res.body.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
  });

  it('returns 400 for empty requests array', async () => {
    const res = await request(app)
      .post('/api/widgets/batch')
      .send({ requests: [] });
    expect(res.status).toBe(400);
    expect(res.body.error).toBe('VALIDATION_ERROR');
  });

  it('returns 400 when widgetId is missing', async () => {
    const res = await request(app)
      .post('/api/widgets/batch')
      .send({ requests: [{ type: 'categorical' }] });
    expect(res.status).toBe(400);
  });

  it('returns 400 for invalid widget type in batch', async () => {
    const res = await request(app)
      .post('/api/widgets/batch')
      .send({ requests: [{ widgetId: 'w1', type: 'pie_chart' }] });
    expect(res.status).toBe(400);
  });

  it('includes fetchedAt in ISO-8601 format', async () => {
    const res = await request(app)
      .post('/api/widgets/batch')
      .send({ requests: [{ widgetId: 'x', type: 'categorical' }] });
    expect(res.body.fetchedAt).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
  });
});

describe('404 handler', () => {
  it('returns 404 for completely unknown routes', async () => {
    const res = await request(app).get('/api/unknown/route');
    expect(res.status).toBe(404);
  });
});
