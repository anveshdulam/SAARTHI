import { execSync } from "child_process";
import assert from "assert";
import fs from "fs";

console.log("Starting P2 Logging Test Suite...\n");

function runLogScript(env: Record<string, string>, scriptBody: string) {
  const scriptPath = "tests/.temp_log_script.ts";
  fs.writeFileSync(scriptPath, scriptBody);
  try {
    const stdout = execSync(`npx tsx ${scriptPath} 2>&1`, { env: { ...process.env, ...env }, encoding: "utf8" });
    fs.unlinkSync(scriptPath);
    return stdout;
  } catch (err: any) {
    fs.unlinkSync(scriptPath);
    if (err.stdout || err.stderr) {
      return (err.stdout || "") + (err.stderr || "");
    }
    throw err;
  }
}

// TEST A - Production JSON
console.log("TEST A - Production JSON");
const resA = runLogScript({ NODE_ENV: "production" }, `
  import { logger } from "../backend/src/logger.js";
  logger.info("Test JSON", { business_id: 123 });
`);
const parsedA = JSON.parse(resA.trim());
assert.ok(parsedA.timestamp, "missing timestamp");
assert.strictEqual(parsedA.level, "info");
assert.strictEqual(parsedA.service, "backend");
assert.strictEqual(parsedA.message, "Test JSON");
assert.strictEqual(parsedA.business_id, 123);
console.log("PASS: JSON format correct\\n");

// TEST B - Development readable format
console.log("TEST B - Development readable format");
const resB = runLogScript({ NODE_ENV: "development" }, `
  import { logger } from "../backend/src/logger.js";
  logger.info("Test readable", { operation: "test.op", duration_ms: 42, some_field: "foo" });
`);
assert.ok(resB.includes("INFO [backend] Test readable"), "missing readable prefix");
assert.ok(resB.includes("operation=test.op"), "missing operation");
assert.ok(resB.includes("duration_ms=42"), "missing duration_ms");
assert.ok(resB.includes("some_field=foo"), "missing custom field");
assert.ok(!resB.startsWith("{"), "should not be JSON");
console.log("PASS: Readable format correct\\n");

// TEST C - LOG_LEVEL=debug
console.log("TEST C - LOG_LEVEL=debug");
const resC = runLogScript({ LOG_LEVEL: "debug" }, `
  import { logger } from "../backend/src/logger.js";
  logger.debug("Debug msg");
  logger.info("Info msg");
`);
assert.ok(resC.includes("Debug msg"), "missing debug");
assert.ok(resC.includes("Info msg"), "missing info");
console.log("PASS: Debug level\\n");

// TEST D - LOG_LEVEL=info
console.log("TEST D - LOG_LEVEL=info");
const resD = runLogScript({ LOG_LEVEL: "info" }, `
  import { logger } from "../backend/src/logger.js";
  logger.debug("Debug msg");
  logger.info("Info msg");
  logger.warn("Warn msg");
`);
assert.ok(!resD.includes("Debug msg"), "debug should be suppressed");
assert.ok(resD.includes("Info msg"), "missing info");
assert.ok(resD.includes("Warn msg"), "missing warn");
console.log("PASS: Info level\\n");

// TEST E - LOG_LEVEL=warn
console.log("TEST E - LOG_LEVEL=warn");
const resE = runLogScript({ LOG_LEVEL: "warn" }, `
  import { logger } from "../backend/src/logger.js";
  logger.info("Info msg");
  logger.warn("Warn msg");
`);
assert.ok(!resE.includes("Info msg"), "info should be suppressed");
assert.ok(resE.includes("Warn msg"), "missing warn");
console.log("PASS: Warn level\\n");

// TEST F - LOG_LEVEL=error
console.log("TEST F - LOG_LEVEL=error");
const resF = runLogScript({ LOG_LEVEL: "error" }, `
  import { logger } from "../backend/src/logger.js";
  logger.warn("Warn msg");
  logger.error("Error msg");
`);
assert.ok(!resF.includes("Warn msg"), "warn should be suppressed");
assert.ok(resF.includes("Error msg"), "missing error");
console.log("PASS: Error level\\n");

// TEST G - Invalid LOG_LEVEL
console.log("TEST G - Invalid LOG_LEVEL");
const resG = runLogScript({ LOG_LEVEL: "garbage" }, `
  import { logger } from "../backend/src/logger.js";
  logger.debug("Debug msg");
  logger.info("Info msg");
`);
assert.ok(resG.includes("[WARN] Invalid LOG_LEVEL provided"), "Missing configuration warning");
assert.ok(!resG.includes("Debug msg"), "debug should be suppressed by default info");
assert.ok(resG.includes("Info msg"), "info should be present");
console.log("PASS: Invalid level defaulted safely\\n");

// TEST H - Secret safety in development
console.log("TEST H - Secret safety in development");
const resH = runLogScript({ NODE_ENV: "development" }, `
  import { logger } from "../backend/src/logger.js";
  logger.info("Secret dev test", { 
    my_secret: "super_secret_value",
    cookie: "session_id=123",
    safe_val: "public"
  });
`);
assert.ok(!resH.includes("super_secret_value"), "leaked secret");
assert.ok(!resH.includes("session_id=123"), "leaked cookie");
assert.ok(resH.includes("[REDACTED]"), "missing redaction marker");
assert.ok(resH.includes("public"), "safe value removed");
console.log("PASS: Dev secret safety\\n");

// TEST I - Secret safety in production
console.log("TEST I - Secret safety in production");
const resI = runLogScript({ NODE_ENV: "production" }, `
  import { logger } from "../backend/src/logger.js";
  logger.info("Secret prod test", { 
    auth_token: "aws_secret",
    public_id: "test"
  });
`);
const parsedI = JSON.parse(resI.trim());
assert.strictEqual(parsedI.auth_token, "[REDACTED]", "failed redaction in JSON");
assert.strictEqual(parsedI.public_id, "test");
console.log("PASS: Prod secret safety\\n");

// TEST J - Request ID preservation
console.log("TEST J - Request ID preservation");
const resJ = runLogScript({ NODE_ENV: "development" }, `
  import { logger, requestContext } from "../backend/src/logger.js";
  requestContext.run({ requestId: "req-777" }, () => {
    logger.info("Ctx dev");
  });
`);
assert.ok(resJ.includes("request_id=req-777"), "Missing request_id in dev");

const resJ2 = runLogScript({ NODE_ENV: "production" }, `
  import { logger, requestContext } from "../backend/src/logger.js";
  requestContext.run({ requestId: "req-888" }, () => {
    logger.info("Ctx prod");
  });
`);
const parsedJ2 = JSON.parse(resJ2.trim());
assert.strictEqual(parsedJ2.request_id, "req-888", "Missing request_id in prod");
console.log("PASS: Request ID preserved in both formats\\n");

// TEST K - P1 metadata preservation
console.log("TEST K - P1 metadata preservation");
const resK = runLogScript({ NODE_ENV: "development" }, `
  import { logger } from "../backend/src/logger.js";
  logger.info("P1 metadata", {
    duration_ms: 105.4,
    operation: "mcp.tool",
    tool_name: "test_tool",
    error_code: "TIMEOUT"
  });
`);
assert.ok(resK.includes("duration_ms=105.4"), "Missing duration");
assert.ok(resK.includes("operation=mcp.tool"), "Missing operation");
assert.ok(resK.includes("tool_name=test_tool"), "Missing tool_name");
assert.ok(resK.includes("error_code=TIMEOUT"), "Missing error_code");
console.log("PASS: P1 metadata preserved\\n");

// TEST L - Error object safety
console.log("TEST L - Error object safety");
const resL = runLogScript({ NODE_ENV: "production" }, `
  import { logger } from "../backend/src/logger.js";
  const err = new Error("Auth failed");
  (err as any).code = "AUTH_ERR";
  (err as any).aws_secret = "secret123";
  logger.error("Operation failed", { error: err });
`);
const parsedL = JSON.parse(resL.trim());
assert.ok(parsedL.error, "Missing error object");
assert.strictEqual(parsedL.error.message, "Auth failed");
assert.strictEqual(parsedL.error.error_code, "AUTH_ERR");
assert.ok(!parsedL.error.aws_secret, "Exposed arbitrary error properties");
console.log("PASS: Error object safety\\n");

console.log("ALL P2 TESTS PASSED");
