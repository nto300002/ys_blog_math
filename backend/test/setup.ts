import { readFileSync } from "fs";
import { resolve } from "path";

export async function applySchema(db: D1Database) {
  const sql = readFileSync(resolve(__dirname, "../src/db/schema.sql"), "utf-8");
  const statements = sql
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const stmt of statements) {
    await db.prepare(stmt).run();
  }
}

export async function seedArticles(db: D1Database) {
  await db
    .prepare(
      "INSERT INTO articles (title, slug, content, status) VALUES (?, ?, ?, ?)"
    )
    .bind("Test Article", "test-article", "# Hello", "published")
    .run();
}
