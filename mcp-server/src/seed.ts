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

const userId = "demo-user-id";
const nowIso = new Date().toISOString();

// Create 5 commitments
const commitments = [
  { id: crypto.randomUUID(), title: "Study Block: Distributed Systems", type: "hard", start_time: "2026-10-10T08:30:00.000Z", end_time: "2026-10-10T10:00:00.000Z", status: "pending", estimated_minutes: null }, // Past due / At risk
  { id: crypto.randomUUID(), title: "Part-time Job Shift", type: "hard", start_time: "2026-10-10T11:00:00.000Z", end_time: "2026-10-10T15:00:00.000Z", status: "pending", estimated_minutes: null },
  { id: crypto.randomUUID(), title: "Gym (Push Day)", type: "soft", start_time: null, end_time: null, status: "pending", estimated_minutes: 60 },
  { id: crypto.randomUUID(), title: "Read 20 pages of fiction", type: "soft", start_time: null, end_time: null, status: "pending", estimated_minutes: 30 },
  { id: crypto.randomUUID(), title: "Call Parents", type: "soft", start_time: null, end_time: null, status: "pending", estimated_minutes: 20 },
];

const insertCommitment = db.prepare(`
  INSERT INTO commitments (id, user_id, title, type, start_time, end_time, estimated_minutes, status, created_at, updated_at)
  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
`);

for (const c of commitments) {
  insertCommitment.run(c.id, userId, c.title, c.type, c.start_time, c.end_time, c.estimated_minutes, c.status, nowIso, nowIso);
}

// Create 3 constraints
const constraints = [
  { id: crypto.randomUUID(), type: "time_limit", value: "22:00", description: "No study after 10 PM" },
  { id: crypto.randomUUID(), type: "recurring_habit", value: "Gym Tue/Thu", description: "Gym on Tuesdays and Thursdays" },
  { id: crypto.randomUUID(), type: "time_limit", value: "23:30", description: "Sleep by 11:30 PM" },
];

const insertConstraint = db.prepare(`
  INSERT INTO constraints (id, user_id, type, value, description, created_at)
  VALUES (?, ?, ?, ?, ?, ?)
`);

for (const c of constraints) {
  insertConstraint.run(c.id, userId, c.type, c.value, c.description, nowIso);
}

console.log("Database seeded successfully with 5 commitments and 3 constraints for 'demo-user-id' (Aarav scenario).");
