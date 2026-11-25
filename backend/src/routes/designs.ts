import { Router, Request, Response } from 'express';
import { DatabaseSync } from 'node:sqlite';
import { validateCraneInput } from '../validation.js';
import { computeCrane, CraneInput, ComputedCrane } from '../calculations.js';
import { generateCraneSvg } from '../drawing.js';

interface DesignRow {
  id: number;
  name: string;
  capacity_t: number;
  span_m: number;
  lifting_height_m: number;
  duty_class: CraneInput['duty_class'];
  hoist_speed_m_min: number;
  traverse_speed_m_min: number;
  travel_speed_m_min: number;
  supply: CraneInput['supply'];
  floor_to_rail_height_m: number;
  hook_approach_left_mm: number;
  hook_approach_right_mm: number;
  computed_json: string;
  created_at: string;
  updated_at: string;
}

function parseId(rawId: string | string[] | undefined): number | null {
  const str = Array.isArray(rawId) ? rawId[0] : rawId;
  if (!str || !/^\d+$/.test(str)) return null;
  const num = Number(str);
  return Number.isSafeInteger(num) && num > 0 ? num : null;
}

function formatDesignRow(row: DesignRow) {
  return {
    id: row.id,
    name: row.name,
    capacity_t: row.capacity_t,
    span_m: row.span_m,
    lifting_height_m: row.lifting_height_m,
    duty_class: row.duty_class,
    hoist_speed_m_min: row.hoist_speed_m_min,
    traverse_speed_m_min: row.traverse_speed_m_min,
    travel_speed_m_min: row.travel_speed_m_min,
    supply: row.supply,
    floor_to_rail_height_m: row.floor_to_rail_height_m,
    hook_approach_left_mm: row.hook_approach_left_mm,
    hook_approach_right_mm: row.hook_approach_right_mm,
    computed: JSON.parse(row.computed_json) as ComputedCrane,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

export function createDesignsRouter(db: DatabaseSync): Router {
  const router = Router();

  // POST /api/preview — validate + compute + return SVG without saving
  router.post('/preview', (req: Request, res: Response) => {
    const validation = validateCraneInput(req.body);
    if (!validation.success) {
      res.status(400).json({ errors: validation.errors });
      return;
    }

    const computed = computeCrane(validation.data);
    const svg = generateCraneSvg(validation.data, computed);
    res.status(200).json({ computed, svg });
  });

  // POST /api/designs — create
  router.post('/designs', (req: Request, res: Response) => {
    const validation = validateCraneInput(req.body);
    if (!validation.success) {
      res.status(400).json({ errors: validation.errors });
      return;
    }

    const d = validation.data;
    const computed = computeCrane(d);
    const now = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const info = db
      .prepare(
        `INSERT INTO designs (
          name, capacity_t, span_m, lifting_height_m, duty_class,
          hoist_speed_m_min, traverse_speed_m_min, travel_speed_m_min,
          supply, floor_to_rail_height_m, hook_approach_left_mm, hook_approach_right_mm,
          computed_json, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
      )
      .run(
        d.name,
        d.capacity_t,
        d.span_m,
        d.lifting_height_m,
        d.duty_class,
        d.hoist_speed_m_min,
        d.traverse_speed_m_min,
        d.travel_speed_m_min,
        d.supply,
        d.floor_to_rail_height_m,
        d.hook_approach_left_mm,
        d.hook_approach_right_mm,
        JSON.stringify(computed),
        now,
        now
      );

    const created = db
      .prepare('SELECT * FROM designs WHERE id = ?')
      .get(Number(info.lastInsertRowid)) as unknown as DesignRow;

    res.status(201).json(formatDesignRow(created));
  });

  // GET /api/designs — list
  router.get('/designs', (_req: Request, res: Response) => {
    const rows = db
      .prepare(
        `SELECT id, name, capacity_t, span_m, lifting_height_m, duty_class, updated_at
         FROM designs
         ORDER BY updated_at DESC, id DESC`
      )
      .all();
    res.status(200).json(rows);
  });

  // GET /api/designs/:id — get one
  router.get('/designs/:id', (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ errors: [{ field: 'id', message: 'Invalid design id' }] });
      return;
    }

    const row = db
      .prepare('SELECT * FROM designs WHERE id = ?')
      .get(id) as unknown as DesignRow | undefined;

    if (!row) {
      res.status(404).json({ errors: [{ field: 'id', message: 'Design not found' }] });
      return;
    }

    res.status(200).json(formatDesignRow(row));
  });

  // PUT /api/designs/:id — update (re-validate, recompute, set updated_at explicitly)
  router.put('/designs/:id', (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ errors: [{ field: 'id', message: 'Invalid design id' }] });
      return;
    }

    const existing = db.prepare('SELECT id FROM designs WHERE id = ?').get(id);
    if (!existing) {
      res.status(404).json({ errors: [{ field: 'id', message: 'Design not found' }] });
      return;
    }

    const validation = validateCraneInput(req.body);
    if (!validation.success) {
      res.status(400).json({ errors: validation.errors });
      return;
    }

    const d = validation.data;
    const computed = computeCrane(d);
    const updatedAt = new Date().toISOString().replace('T', ' ').slice(0, 19);

    db.prepare(
      `UPDATE designs SET
        name = ?, capacity_t = ?, span_m = ?, lifting_height_m = ?, duty_class = ?,
        hoist_speed_m_min = ?, traverse_speed_m_min = ?, travel_speed_m_min = ?,
        supply = ?, floor_to_rail_height_m = ?, hook_approach_left_mm = ?, hook_approach_right_mm = ?,
        computed_json = ?, updated_at = ?
       WHERE id = ?`
    ).run(
      d.name,
      d.capacity_t,
      d.span_m,
      d.lifting_height_m,
      d.duty_class,
      d.hoist_speed_m_min,
      d.traverse_speed_m_min,
      d.travel_speed_m_min,
      d.supply,
      d.floor_to_rail_height_m,
      d.hook_approach_left_mm,
      d.hook_approach_right_mm,
      JSON.stringify(computed),
      updatedAt,
      id
    );

    const updated = db
      .prepare('SELECT * FROM designs WHERE id = ?')
      .get(id) as unknown as DesignRow;

    res.status(200).json(formatDesignRow(updated));
  });

  // DELETE /api/designs/:id — delete
  router.delete('/designs/:id', (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ errors: [{ field: 'id', message: 'Invalid design id' }] });
      return;
    }

    const info = db.prepare('DELETE FROM designs WHERE id = ?').run(id);
    if (info.changes === 0) {
      res.status(404).json({ errors: [{ field: 'id', message: 'Design not found' }] });
      return;
    }

    res.status(200).json({ deleted: true, id });
  });

  // GET /api/designs/:id/drawing.svg — return SVG for download/display
  router.get('/designs/:id/drawing.svg', (req: Request, res: Response) => {
    const id = parseId(req.params.id);
    if (id === null) {
      res.status(400).json({ errors: [{ field: 'id', message: 'Invalid design id' }] });
      return;
    }

    const row = db
      .prepare('SELECT * FROM designs WHERE id = ?')
      .get(id) as unknown as DesignRow | undefined;

    if (!row) {
      res.status(404).json({ errors: [{ field: 'id', message: 'Design not found' }] });
      return;
    }

    const formatted = formatDesignRow(row);
    const svg = generateCraneSvg(formatted, formatted.computed);
    res.setHeader('Content-Type', 'image/svg+xml; charset=utf-8');
    res.setHeader('Content-Disposition', `inline; filename="crane-${id}.svg"`);
    res.status(200).send(svg);
  });

  return router;
}
