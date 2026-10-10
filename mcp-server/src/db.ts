import Database from "better-sqlite3";
import path from "path";

const dbPath = path.resolve(__dirname, "../../data.db");
export const db = new Database(dbPath);

db.pragma("journal_mode = WAL");

export const initDb = () => {
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_preferences (
      user_id TEXT PRIMARY KEY,
      timezone TEXT NOT NULL DEFAULT 'UTC',
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS commitments (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      type TEXT NOT NULL, -- 'hard', 'soft'
      estimated_minutes INTEGER,
      start_time TEXT,
      end_time TEXT,
      deadline TEXT,
      status TEXT DEFAULT 'proposed', -- proposed, awaiting_confirmation, pending, completed, missed, rejected, cancelled, failed
      idempotency_key TEXT UNIQUE,
      created_at TEXT,
      updated_at TEXT
    );

    CREATE TABLE IF NOT EXISTS constraints (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      value TEXT NOT NULL,
      description TEXT,
      created_at TEXT
    );

    CREATE TABLE IF NOT EXISTS plans (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      version INTEGER NOT NULL,
      status TEXT DEFAULT 'proposed',
      reasoning TEXT,
      risk_state TEXT,
      supersedes_version INTEGER,
      created_at TEXT,
      UNIQUE(user_id, version)
    );

    CREATE TABLE IF NOT EXISTS plan_blocks (
      id TEXT PRIMARY KEY,
      plan_id TEXT NOT NULL,
      commitment_id TEXT NOT NULL,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      FOREIGN KEY (plan_id) REFERENCES plans(id) ON DELETE CASCADE,
      FOREIGN KEY (commitment_id) REFERENCES commitments(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS events (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL,
      entity TEXT,
      old_state TEXT,
      new_state TEXT,
      request_id TEXT,
      plan_version INTEGER,
      created_at TEXT
    );
  `);
};
