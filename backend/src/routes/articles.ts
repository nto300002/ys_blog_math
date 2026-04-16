import { Hono } from "hono";
import { Env } from "../index";

export const articlesRouter = new Hono<{ Bindings: Env }>();

// GET /api/articles/:id
articlesRouter.get("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  const article = await c.env.DB.prepare(
    "SELECT * FROM articles WHERE id = ?"
  )
    .bind(id)
    .first();

  if (!article) return c.json({ error: "Not found" }, 404);
  return c.json(article);
});

// POST /api/articles
articlesRouter.post("/", async (c) => {
  const body = await c.req.json<{
    title: string;
    slug: string;
    folder_id?: number;
    content?: string;
    status?: string;
  }>();

  if (!body.title || !body.slug) {
    return c.json({ error: "title and slug are required" }, 400);
  }

  const result = await c.env.DB.prepare(
    `INSERT INTO articles (folder_id, title, slug, content, status)
     VALUES (?, ?, ?, ?, ?)
     RETURNING *`
  )
    .bind(
      body.folder_id ?? null,
      body.title,
      body.slug,
      body.content ?? "",
      body.status ?? "draft"
    )
    .first();

  return c.json(result, 201);
});

// PUT /api/articles/:id
articlesRouter.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  const body = await c.req.json<{
    title?: string;
    content?: string;
    status?: string;
    folder_id?: number | null;
  }>();

  const existing = await c.env.DB.prepare(
    "SELECT id FROM articles WHERE id = ?"
  )
    .bind(id)
    .first();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const result = await c.env.DB.prepare(
    `UPDATE articles
     SET title     = COALESCE(?, title),
         content   = COALESCE(?, content),
         status    = COALESCE(?, status),
         folder_id = COALESCE(?, folder_id)
     WHERE id = ?
     RETURNING *`
  )
    .bind(
      body.title ?? null,
      body.content ?? null,
      body.status ?? null,
      body.folder_id ?? null,
      id
    )
    .first();

  return c.json(result);
});

// DELETE /api/articles/:id
articlesRouter.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  const existing = await c.env.DB.prepare(
    "SELECT id FROM articles WHERE id = ?"
  )
    .bind(id)
    .first();
  if (!existing) return c.json({ error: "Not found" }, 404);

  await c.env.DB.prepare("DELETE FROM articles WHERE id = ?").bind(id).run();
  return c.json({ deleted: id });
});
