import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

// Integration tests run against a real SQLite database rather than a mocked
// Prisma client — the persistence logic (autosave, resume, mastery upserts) is
// exactly the part worth testing for real. The file is created fresh for each
// run and removed afterwards, so it never collides with the dev database.

const TEST_DB_FILE = path.resolve(__dirname, "../../prisma/test.db");

export async function setup() {
  for (const suffix of ["", "-journal"]) {
    const file = `${TEST_DB_FILE}${suffix}`;
    if (fs.existsSync(file)) fs.rmSync(file);
  }

  process.env.DATABASE_URL = "file:./test.db";

  execFileSync("npx", ["prisma", "migrate", "deploy"], {
    cwd: path.resolve(__dirname, "../.."),
    env: { ...process.env, DATABASE_URL: "file:./test.db" },
    stdio: "pipe",
  });
}

export async function teardown() {
  for (const suffix of ["", "-journal"]) {
    const file = `${TEST_DB_FILE}${suffix}`;
    if (fs.existsSync(file)) fs.rmSync(file);
  }
}
