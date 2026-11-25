import { describe, it, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createDb, seedReferenceDesignIfEmpty } from '../db.ts';
import { createApp } from '../index.ts';

const VALID_PAYLOAD = {
  name: 'API Test 10t Crane',
  capacity_t: 10,
  span_m: 25,
  lifting_height_m: 7.5,
  duty_class: 'A5',
  hoist_speed_m_min: 6,
  traverse_speed_m_min: 20,
  travel_speed_m_min: 32,
  supply: '380V/50Hz',
  floor_to_rail_height_m: 8.5,
  hook_approach_left_mm: 920,
  hook_approach_right_mm: 1150,
};

describe('API /api/designs and /api/preview', () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    const memDb = createDb(':memory:');
    seedReferenceDesignIfEmpty(memDb);
    const app = createApp(memDb);
    server = http.createServer(app);
    await new Promise<void>((resolve) => {
      server.listen(0, '127.0.0.1', () => resolve());
    });
    const addr = server.address() as { port: number };
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  after(async () => {
    await new Promise<void>((resolve) => server.close(() => resolve()));
  });

  it('creates a design (201), lists it, gets it, updates it, downloads SVG, and deletes it', async () => {
    // Create
    const createRes = await fetch(`${baseUrl}/api/designs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_PAYLOAD),
    });
    assert.equal(createRes.status, 201);
    const created = (await createRes.json()) as { id: number; name: string; updated_at: string };
    assert.equal(created.name, 'API Test 10t Crane');
    assert.ok(created.id > 0);

    // Update
    const updateRes = await fetch(`${baseUrl}/api/designs/${created.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...VALID_PAYLOAD, name: 'Updated API Crane' }),
    });
    assert.equal(updateRes.status, 200);
    const updated = (await updateRes.json()) as { name: string };
    assert.equal(updated.name, 'Updated API Crane');

    // Drawing SVG
    const svgRes = await fetch(`${baseUrl}/api/designs/${created.id}/drawing.svg`);
    assert.equal(svgRes.status, 200);
    const svgText = await svgRes.text();
    assert.ok(svgText.includes('<svg'));

    // Delete
    const delRes = await fetch(`${baseUrl}/api/designs/${created.id}`, { method: 'DELETE' });
    assert.equal(delRes.status, 200);

    // Get after delete -> 404
    const getDeleted = await fetch(`${baseUrl}/api/designs/${created.id}`);
    assert.equal(getDeleted.status, 404);
  });

  it('returns 400 with multiple errors on invalid create', async () => {
    const res = await fetch(`${baseUrl}/api/designs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ...VALID_PAYLOAD, name: '', span_m: -5, capacity_t: 99 }),
    });
    assert.equal(res.status, 400);
    const body = (await res.json()) as { errors: { field: string; message: string }[] };
    assert.ok(Array.isArray(body.errors));
    assert.ok(body.errors.length >= 3);
  });

  it('returns 404 for missing id and 400 for non-numeric id', async () => {
    const notFound = await fetch(`${baseUrl}/api/designs/999999`);
    assert.equal(notFound.status, 404);

    const badId = await fetch(`${baseUrl}/api/designs/abc`);
    assert.equal(badId.status, 400);
  });

  it('returns 400 on malformed JSON body', async () => {
    const res = await fetch(`${baseUrl}/api/designs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: '{bad json',
    });
    assert.equal(res.status, 400);
    const body = (await res.json()) as { errors: { field: string; message: string }[] };
    assert.equal(body.errors[0].field, 'body');
  });

  it('returns 200 with SVG on POST /api/preview', async () => {
    const res = await fetch(`${baseUrl}/api/preview`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(VALID_PAYLOAD),
    });
    assert.equal(res.status, 200);
    const body = (await res.json()) as { svg: string; computed: { span_mm: number } };
    assert.ok(body.svg.includes('<svg'));
    assert.equal(body.computed.span_mm, 25000);
  });
});
