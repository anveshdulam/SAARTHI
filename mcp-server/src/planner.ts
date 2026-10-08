import { isAfter, isBefore, parseISO } from "date-fns";
import { fromZonedTime, toZonedTime } from "date-fns-tz";

export interface Commitment {
  id: string;
  type: "hard" | "soft";
  startTime?: string;
  endTime?: string;
  estimatedMinutes?: number;
  deadline?: string;
}

export interface Block {
  commitmentId: string;
  startTime: string;
  endTime: string;
}

export interface PlanResult {
  blocks: Block[];
  unscheduled: string[]; // commitment IDs that couldn't be scheduled
  riskState: "LOW" | "MEDIUM" | "HIGH";
  conflicts: string[];
  explanation: string;
}

export function buildPlan(
  commitments: Commitment[],
  currentTimeUtc: string,
  userTimezone: string,
  planningDate: string, // e.g. "2026-10-08"
  cutoffLocalTime: string // e.g. "21:00"
): PlanResult {
  const blocks: Block[] = [];
  const unscheduled: string[] = [];
  let riskState: "LOW" | "MEDIUM" | "HIGH" = "LOW";
  const conflicts: string[] = [];

  // Sort hard commitments by start time
  const hardEvents = commitments
    .filter(c => c.type === "hard" && c.startTime && c.endTime)
    .sort((a, b) => new Date(a.startTime!).getTime() - new Date(b.startTime!).getTime());

  // Check for conflicts in hard events
  for (let i = 0; i < hardEvents.length - 1; i++) {
    const current = hardEvents[i];
    const next = hardEvents[i + 1];
    if (isAfter(new Date(current.endTime!), new Date(next.startTime!))) {
      conflicts.push(`Conflict: ${current.id} overlaps with ${next.id}`);
      riskState = "HIGH";
    }
  }

  // Schedule hard events
  hardEvents.forEach(e => {
    blocks.push({
      commitmentId: e.id,
      startTime: e.startTime!,
      endTime: e.endTime!
    });
  });

  // Sort soft tasks by deadline (earliest first), fallback to ID for deterministic tie-break
  const softTasks = commitments
    .filter(c => c.type === "soft" && c.estimatedMinutes)
    .sort((a, b) => {
      if (a.deadline && b.deadline) {
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      }
      if (a.deadline) return -1;
      if (b.deadline) return 1;
      return a.id.localeCompare(b.id);
    });

  // Implement gap-finding scheduling logic
  let currentPointer = new Date(currentTimeUtc);
  
  // Construct cutoff string in the user's local timezone (e.g., "2026-10-08T21:00:00")
  const cutoffLocalStr = `${planningDate}T${cutoffLocalTime}:00`;
  // Convert local cutoff string to absolute UTC instant Date object
  const cutoffDate = fromZonedTime(cutoffLocalStr, userTimezone);

  for (const task of softTasks) {
    let scheduled = false;
    const durationMs = task.estimatedMinutes! * 60000;

    // We will search for a gap from currentPointer to cutoffDate
    let searchStart = new Date(currentPointer);

    while (!scheduled && isBefore(searchStart, cutoffDate)) {
      const searchEnd = new Date(searchStart.getTime() + durationMs);
      if (isAfter(searchEnd, cutoffDate)) break; // Cannot fit before cutoff

      // Check for overlap with existing blocks
      const overlap = blocks.find(
        (b) =>
          isBefore(searchStart, new Date(b.endTime)) &&
          isAfter(searchEnd, new Date(b.startTime))
      );

      if (overlap) {
        // Move searchStart to the end of the overlapping block
        searchStart = new Date(overlap.endTime);
      } else {
        // Found a gap!
        blocks.push({
          commitmentId: task.id,
          startTime: searchStart.toISOString(),
          endTime: searchEnd.toISOString(),
        });
        
        // Update current pointer
        currentPointer = searchEnd;
        scheduled = true;
      }
    }

    if (!scheduled) {
      unscheduled.push(task.id);
      riskState = "HIGH";
      conflicts.push(`Insufficient capacity for task: ${task.id}`);
    }
  }

  // Sort blocks chronologically
  blocks.sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());

  return {
    blocks,
    unscheduled,
    riskState,
    conflicts,
    explanation: conflicts.length > 0 ? "Conflicts detected or capacity exceeded." : "Schedule built successfully."
  };
}
