import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createDb } from '../db.ts';

describe('db (:memory:)', () => {
  it('creates schema, inserts, lists, gets by id, updates (changing updated_at), and deletes using parameterised SQL', () => {
    const memDb = createDb(':memory:');

    // Schema creation check
    const tables = memDb
      .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='designs'")
      .all() as { name: string }[];
    assert.equal(tables.length, 1);

    // Insert
    const insert = memDb.prepare(`
      INSERT INTO designs (
        name, capacity_t, span_m, lifting_height_m, duty_class,
        hoist_speed_m_min, traverse_speed_m_min, travel_speed_m_min,
        supply, floor_to_rail_height_m, hook_approach_left_mm, hook_approach_right_mm,
        computed_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = insert.run(
      'Memory Crane',
      10,
      25,
      7.9,
      'A5',
      6,
      20,
      32,
      '380V/50Hz',
      8.321,
      920,
      1150,
      '{"span_mm":25000}'
    );
    const id = Number(info.lastInsertRowid);
    assert.ok(id > 0);

    // List
    const list = memDb.prepare('SELECT id, name FROM designs ORDER BY id DESC').all() as {
      id: number;
      name: string;
    }[];
    assert.equal(list.length, 1);
    assert.equal(list[0].name, 'Memory Crane');

    // Get by id
    const row = memDb
      .prepare('SELECT id, name, capacity_t, updated_at FROM designs WHERE id = ?')
      .get(id) as { id: number; name: string; capacity_t: number; updated_at: string };
    assert.equal(row.name, 'Memory Crane');
    assert.equal(row.capacity_t, 10);

    // Update (explicitly set updated_at to a new timestamp)
    const newUpdatedAt = '2099-01-01 00:00:00';
    memDb
      .prepare('UPDATE designs SET name = ?, updated_at = ? WHERE id = ?')
      .run('Updated Crane', newUpdatedAt, id);

    const updated = memDb
      .prepare('SELECT name, updated_at FROM designs WHERE id = ?')
      .get(id) as { name: string; updated_at: string };
    assert.equal(updated.name, 'Updated Crane');
    assert.notEqual(updated.updated_at, row.updated_at);
    assert.equal(updated.updated_at, newUpdatedAt);

    // Parameterised SQL injection safety check
    const malicious = memDb
      .prepare('SELECT id FROM designs WHERE name = ?')
      .all("'; DROP TABLE designs; --");
    assert.equal(malicious.length, 0);

    // Delete
    const delInfo = memDb.prepare('DELETE FROM designs WHERE id = ?').run(id);
    assert.equal(delInfo.changes, 1);

    const afterDelete = memDb.prepare('SELECT id FROM designs WHERE id = ?').get(id);
    assert.equal(afterDelete, undefined);

    memDb.close();
  });
});
