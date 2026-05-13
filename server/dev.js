import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const rootDir = path.resolve(path.dirname(__filename), "..");
const viteBin = path.join(rootDir, "node_modules", "vite", "bin", "vite.js");

const children = [
  spawn(process.execPath, ["server/index.js"], {
    cwd: rootDir,
    stdio: "inherit",
    env: { ...process.env, PORT: process.env.PORT || "3001" }
  }),
  spawn(process.execPath, [viteBin, "--host", "127.0.0.1"], {
    cwd: rootDir,
    stdio: "inherit"
  })
];

let shuttingDown = false;

function stopAll(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;

  for (const child of children) {
    if (!child.killed) {
      child.kill(signal);
    }
  }
}

for (const child of children) {
  child.on("exit", (code, signal) => {
    if (!shuttingDown && code !== 0) {
      console.log(`Dev process exited with ${signal || code}`);
      stopAll("SIGTERM");
      process.exit(code || 1);
    }
  });
}

process.on("SIGINT", () => stopAll("SIGINT"));
process.on("SIGTERM", () => stopAll("SIGTERM"));
