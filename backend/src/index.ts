import { Hono } from "hono";
import { cors } from "hono/cors";
import { articlesRouter } from "./routes/articles";
import { foldersRouter } from "./routes/folders";
import { r2Router } from "./routes/r2";

export type Env = {
  DB: D1Database;
  R2: R2Bucket;
};

const app = new Hono<{ Bindings: Env }>();

app.use("*", cors({ origin: "*" }));

app.route("/api/articles", articlesRouter);
app.route("/api/folders", foldersRouter);
app.route("/api/r2", r2Router);

// GET /api/tree — フォルダ＋記事ツリー
app.get("/api/tree", async (c) => {
  const db = c.env.DB;
  const [folders, articles] = await Promise.all([
    db.prepare("SELECT * FROM folders ORDER BY name").all(),
    db
      .prepare("SELECT id, folder_id, title, slug, status FROM articles ORDER BY title")
      .all(),
  ]);
  return c.json({ folders: folders.results, articles: articles.results });
});

export default app;
