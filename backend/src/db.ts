import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

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

export const db = createDb();
