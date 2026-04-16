import { Hono } from "hono";
import { Env } from "../index";

export const foldersRouter = new Hono<{ Bindings: Env }>();

// POST /api/folders
foldersRouter.post("/", async (c) => {
  const body = await c.req.json<{ name: string; parent_id?: number }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);

  const result = await c.env.DB.prepare(
    "INSERT INTO folders (name, parent_id) VALUES (?, ?) RETURNING *"
  )
    .bind(body.name, body.parent_id ?? null)
    .first();

  return c.json(result, 201);
});

// PUT /api/folders/:id
foldersRouter.put("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  const body = await c.req.json<{ name: string }>();
  if (!body.name) return c.json({ error: "name is required" }, 400);

  const existing = await c.env.DB.prepare(
    "SELECT id FROM folders WHERE id = ?"
  )
    .bind(id)
    .first();
  if (!existing) return c.json({ error: "Not found" }, 404);

  const result = await c.env.DB.prepare(
    "UPDATE folders SET name = ? WHERE id = ? RETURNING *"
  )
    .bind(body.name, id)
    .first();

  return c.json(result);
});

// DELETE /api/folders/:id
foldersRouter.delete("/:id", async (c) => {
  const id = Number(c.req.param("id"));
  if (isNaN(id)) return c.json({ error: "Invalid id" }, 400);

  const existing = await c.env.DB.prepare(
    "SELECT id FROM folders WHERE id = ?"
  )
    .bind(id)
    .first();
  if (!existing) return c.json({ error: "Not found" }, 404);

  await c.env.DB.prepare("DELETE FROM folders WHERE id = ?").bind(id).run();
  return c.json({ deleted: id });
});
