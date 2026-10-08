const { buildPlan } = require("./mcp-server/dist/planner.js");
const { toZonedTime, format } = require("date-fns-tz");

function runTest(processTZ) {
  process.env.TZ = processTZ;
  
  // Simulated Inputs for "test_user" in Asia/Kolkata
  const currentTimeUtcStr = "2026-10-08T13:30:00.000Z"; // 19:00 IST
  const userTimezone = "Asia/Kolkata";
  const planningDate = "2026-10-08";
  const cutoffLocalTime = "21:00"; // 21:00 IST = 15:30 UTC
  
  const mapped = [
    { id: "soft1", type: "soft", estimatedMinutes: 90 }
  ];

  const planResult = buildPlan(mapped, currentTimeUtcStr, userTimezone, planningDate, cutoffLocalTime);
  
  // Inspect the generated block
  const block = planResult.blocks[0];
  const startUtc = block ? block.startTime : null;
  const endUtc = block ? block.endTime : null;

  let startIst = null;
  let endIst = null;
  if (startUtc) {
    const zonedStart = toZonedTime(new Date(startUtc), userTimezone);
    startIst = format(zonedStart, "yyyy-MM-dd HH:mm:ssXXX", { timeZone: userTimezone });
  }

  console.log(`[TZ=${processTZ}] startUtc: ${startUtc}, endUtc: ${endUtc}, startIst: ${startIst}, blocks: ${planResult.blocks.length}`);
}

runTest("UTC");
runTest("Asia/Kolkata");
runTest("America/New_York");
