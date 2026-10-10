import { spawn } from "child_process";

async function runTest(env: Record<string, string>, name: string) {
  console.log(`\n--- RUNNING DAEMON TEST: ${name} ---`);
  return new Promise<void>((resolve, reject) => {
    const backend = spawn("npx", ["tsx", "src/index.ts"], {
      cwd: "./backend",
      env: { ...process.env, ...env },
      shell: true
    });
    
    let out = "";
    backend.stdout.on("data", d => out += d.toString());
    backend.stderr.on("data", d => out += d.toString());
    
    setTimeout(() => {
      fetch("http://localhost:3001/api/state").catch(() => {});
      setTimeout(() => backend.kill(), 1000);
    }, 2000);
    
    backend.on("close", () => {
      console.log(out);
      resolve();
    });
    
    // Safety timeout
    setTimeout(() => {
      backend.kill();
      reject(new Error("Timeout"));
    }, 10000);
  });
}

async function main() {
  await runTest({ NODE_ENV: "development", LOG_LEVEL: "debug" }, "DEV DEBUG");
  await runTest({ NODE_ENV: "production", LOG_LEVEL: "info" }, "PROD INFO");
  await runTest({ LOG_LEVEL: "garbage" }, "INVALID LOG_LEVEL");
}
main().catch(console.error);
