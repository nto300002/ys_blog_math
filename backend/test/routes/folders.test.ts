import { describe, it, expect, beforeEach } from "vitest";
import { env } from "cloudflare:test";
import app from "../../src/index";
import { applySchema } from "../setup";

describe("Folders API", () => {
  beforeEach(async () => {
    await applySchema(env.DB);
  });

  describe("POST /api/folders", () => {
    it("201: フォルダを作成できる", async () => {
      const res = await app.request("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "数学" }),
      }, env);

      expect(res.status).toBe(201);
      const data = await res.json<{ name: string }>();
      expect(data.name).toBe("数学");
    });

    it("201: ネストしたフォルダを作成できる", async () => {
      const parent = await app.request("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "親フォルダ" }),
      }, env);
      const parentData = await parent.json<{ id: number }>();

      const child = await app.request("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "子フォルダ", parent_id: parentData.id }),
      }, env);

      expect(child.status).toBe(201);
      const childData = await child.json<{ parent_id: number }>();
      expect(childData.parent_id).toBe(parentData.id);
    });

    it("400: name がないとエラー", async () => {
      const res = await app.request("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({}),
      }, env);

      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/folders/:id", () => {
    it("200: フォルダをリネームできる", async () => {
      const created = await app.request("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "旧名" }),
      }, env);
      const { id } = await created.json<{ id: number }>();

      const res = await app.request(`/api/folders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "新名" }),
      }, env);

      expect(res.status).toBe(200);
      const data = await res.json<{ name: string }>();
      expect(data.name).toBe("新名");
    });

    it("404: 存在しないフォルダはNotFound", async () => {
      const res = await app.request("/api/folders/999", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "x" }),
      }, env);

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/folders/:id", () => {
    it("200: フォルダを削除できる", async () => {
      const created = await app.request("/api/folders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: "削除対象" }),
      }, env);
      const { id } = await created.json<{ id: number }>();

      const res = await app.request(`/api/folders/${id}`, {
        method: "DELETE",
      }, env);

      expect(res.status).toBe(200);
    });

    it("404: 存在しないフォルダはNotFound", async () => {
      const res = await app.request("/api/folders/999", {
        method: "DELETE",
      }, env);

      expect(res.status).toBe(404);
    });
  });

  describe("GET /api/tree", () => {
    it("200: ツリーを取得できる", async () => {
      const res = await app.request("/api/tree", {}, env);
      expect(res.status).toBe(200);
      const data = await res.json<{ folders: unknown[]; articles: unknown[] }>();
      expect(Array.isArray(data.folders)).toBe(true);
      expect(Array.isArray(data.articles)).toBe(true);
    });
  });
});
