import { Hono } from "hono";
import { Env } from "../index";

export const r2Router = new Hono<{ Bindings: Env }>();

// POST /api/r2/upload
r2Router.post("/upload", async (c) => {
  const formData = await c.req.formData();
  const file = formData.get("file") as File | null;

  if (!file) return c.json({ error: "file is required" }, 400);
  if (!file.type.startsWith("image/")) {
    return c.json({ error: "Only image files are allowed" }, 400);
  }

  const key = `${Date.now()}-${file.name}`;
  await c.env.R2.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type },
  });

  return c.json({ url: `/r2/${key}` }, 201);
});
