import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { computeCrane, CraneInput } from './calculations.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_DB_PATH = path.resolve(__dirname, '../crane_designs.db');

export function createDb(dbPath: string = DEFAULT_DB_PATH): DatabaseSync {
  const db = new DatabaseSync(dbPath);
  if (dbPath !== ':memory:') {
    db.exec('PRAGMA journal_mode = WAL;');
  }
  db.exec('PRAGMA foreign_keys = ON;');

  db.exec(`
    CREATE TABLE IF NOT EXISTS designs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      capacity_t REAL NOT NULL,
      span_m REAL NOT NULL,
      lifting_height_m REAL NOT NULL,
      duty_class TEXT NOT NULL,
      hoist_speed_m_min REAL NOT NULL,
      traverse_speed_m_min REAL NOT NULL,
      travel_speed_m_min REAL NOT NULL,
      supply TEXT NOT NULL,
      floor_to_rail_height_m REAL NOT NULL,
      hook_approach_left_mm REAL NOT NULL,
      hook_approach_right_mm REAL NOT NULL,
      computed_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);

  return db;
}

export function seedReferenceDesignIfEmpty(database: DatabaseSync): void {
  const row = database.prepare('SELECT COUNT(*) AS count FROM designs').get() as { count: number };
  if (row.count > 0) return;

  const refInput: CraneInput = {
    name: 'Reference 10t / 25m Single Girder',
    capacity_t: 10,
    span_m: 25,
    lifting_height_m: 7.7,
    duty_class: 'A5',
    hoist_speed_m_min: 6,
    traverse_speed_m_min: 20,
    travel_speed_m_min: 32,
    supply: '380V/50Hz',
    floor_to_rail_height_m: 8.321,
    hook_approach_left_mm: 920,
    hook_approach_right_mm: 1150,
  };
  const computed = computeCrane(refInput);

  database
    .prepare(
      `INSERT INTO designs (
        name, capacity_t, span_m, lifting_height_m, duty_class,
        hoist_speed_m_min, traverse_speed_m_min, travel_speed_m_min,
        supply, floor_to_rail_height_m, hook_approach_left_mm, hook_approach_right_mm,
        computed_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
    )
    .run(
      refInput.name,
      refInput.capacity_t,
      refInput.span_m,
      refInput.lifting_height_m,
      refInput.duty_class,
      refInput.hoist_speed_m_min,
      refInput.traverse_speed_m_min,
      refInput.travel_speed_m_min,
      refInput.supply,
      refInput.floor_to_rail_height_m,
      refInput.hook_approach_left_mm,
      refInput.hook_approach_right_mm,
      JSON.stringify(computed)
    );
}

export const db = createDb();
