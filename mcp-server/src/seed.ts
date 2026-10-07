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

db.prepare(`
  INSERT INTO commitments (id, user_id, title, type, estimated_minutes, status)
  VALUES (?, ?, ?, ?, ?, 'pending')
`).run(c1, userId, "Java Study Session", "soft", 120);

db.prepare(`
  INSERT INTO commitments (id, user_id, title, type, start_time, end_time, status)
  VALUES (?, ?, ?, ?, ?, ?, 'pending')
`).run(c2, userId, "Club Meeting", "hard", "17:00", "18:00");

db.prepare(`
  INSERT INTO constraints (id, user_id, type, value, description)
  VALUES (?, ?, ?, ?, ?)
`).run(cons1, userId, "time_limit", "21:00", "Hard stop, no work after 9 PM");

console.log("Database seeded successfully with 2 commitments and 1 constraint for demo_user_1.");
