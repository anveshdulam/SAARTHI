import { db, initDb } from "./db.js";
import crypto from "crypto";

console.log("Resetting database...");

// Initialize if empty
initDb();

// Clear tables
db.prepare("DELETE FROM events").run();
db.prepare("DELETE FROM plan_blocks").run();
db.prepare("DELETE FROM plans").run();
db.prepare("DELETE FROM constraints").run();
db.prepare("DELETE FROM commitments").run();

const userId = "demo_user_1";

const c1 = crypto.randomUUID();
const c2 = crypto.randomUUID();
const cons1 = crypto.randomUUID();

const nowIso = new Date().toISOString();
// Known demo timezone: Asia/Kolkata
// Demo date: 2026-10-08
// 17:00 IST -> 11:30 UTC
// 18:00 IST -> 12:30 UTC
const clubStartTime = "2026-10-08T11:30:00.000Z";
const clubEndTime = "2026-10-08T12:30:00.000Z";

db.prepare(`
  INSERT INTO commitments (id, user_id, title, type, estimated_minutes, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, 'pending', ?, ?)
`).run(c1, userId, "Java Study Session", "soft", 120, nowIso, nowIso);

db.prepare(`
  INSERT INTO commitments (id, user_id, title, type, start_time, end_time, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, ?)
`).run(c2, userId, "Club Meeting", "hard", clubStartTime, clubEndTime, nowIso, nowIso);

db.prepare(`
  INSERT INTO constraints (id, user_id, type, value, description, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`).run(cons1, userId, "time_limit", "21:00", "Hard stop, no work after 9 PM", nowIso);


console.log("Database seeded successfully with 2 commitments and 1 constraint for demo_user_1.");
