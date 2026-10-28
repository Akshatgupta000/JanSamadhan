import { describe, it, expect, beforeAll } from 'vitest';
import request from 'supertest';
import { createApp } from '../../src/app';
import { Application } from 'express';

describe('JanSamadhan Innovation Hub - Landing Page Frontend Integration Tests', () => {
  let app: Application;

  beforeAll(() => {
    app = createApp();
  });

  it('GET / should serve the premium landing page HTML with 200 status', async () => {
    const res = await request(app).get('/');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/html');
    expect(res.text).toContain('JanSamadhan Innovation Hub');
    expect(res.text).toContain('Building a smarter, more collaborative innovation ecosystem for Jharkhand');
    expect(res.text).toContain('Every Problem Can Spark a');
    expect(res.text).toContain('Better Tomorrow');
    expect(res.text).toContain('From a Local Challenge to a Lasting Solution');
    expect(res.text).toContain('Intelligence That Helps People Make Better Decisions');
    expect(res.text).toContain('Where Ideas Become Real-World Solutions');
    expect(res.text).toContain('Understand the Challenges. See the Progress');
    expect(res.text).toContain('Different Perspectives. One Shared Mission');
    expect(res.text).toContain('Your Community Has Problems Worth Solving');
    expect(res.text).toContain('modal-report');
    expect(res.text).toContain('modal-signin');
  });

  it('GET /css/styles.css should serve the design system stylesheet', async () => {
    const res = await request(app).get('/css/styles.css');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toContain('text/css');
    expect(res.text).toContain('--color-deep-forest: #123D32');
    expect(res.text).toContain('--color-dark-evergreen: #0B2B25');
    expect(res.text).toContain('--color-lime: #D9F36A');
    expect(res.text).toContain('--color-warm-ivory: #F7F7F0');
  });

  it('GET /js/app.js should serve the interactive client application script', async () => {
    const res = await request(app).get('/js/app.js');
    expect(res.status).toBe(200);
    expect(res.headers['content-type']).toMatch(/javascript/);
    expect(res.text).toContain('initJharkhandMap');
    expect(res.text).toContain('JHARKHAND_DISTRICTS');
  });

  it('GET /api/v1/non-existent-route should still return 404', async () => {
    const res = await request(app).get('/api/v1/non-existent-route');
    expect(res.status).toBe(404);
    expect(res.body.success).toBe(false);
  });
});
