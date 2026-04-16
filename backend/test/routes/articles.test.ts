import { describe, it, expect, beforeEach } from "vitest";
import { env } from "cloudflare:test";
import app from "../../src/index";
import { applySchema, seedArticles } from "../setup";

describe("Articles API", () => {
  beforeEach(async () => {
    await applySchema(env.DB);
  });

  describe("POST /api/articles", () => {
    it("201: 正常に記事を作成できる", async () => {
      const res = await app.request("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "新しい記事", slug: "new-article" }),
      }, env);

      expect(res.status).toBe(201);
      const data = await res.json<{ title: string; slug: string }>();
      expect(data.title).toBe("新しい記事");
      expect(data.slug).toBe("new-article");
    });

    it("400: title がないとエラー", async () => {
      const res = await app.request("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug: "no-title" }),
      }, env);

      expect(res.status).toBe(400);
    });

    it("400: slug がないとエラー", async () => {
      const res = await app.request("/api/articles", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title: "No Slug" }),
      }, env);

      expect(res.status).toBe(400);
    });
  });

  describe("GET /api/articles/:id", () => {
    beforeEach(async () => {
      await seedArticles(env.DB);
    });

    it("200: 存在する記事を取得できる", async () => {
      const res = await app.request("/api/articles/1", {}, env);
      expect(res.status).toBe(200);
      const data = await res.json<{ slug: string }>();
      expect(data.slug).toBe("test-article");
    });

    it("404: 存在しない記事はNotFound", async () => {
      const res = await app.request("/api/articles/999", {}, env);
      expect(res.status).toBe(404);
    });

    it("400: 不正なidはBadRequest", async () => {
      const res = await app.request("/api/articles/abc", {}, env);
      expect(res.status).toBe(400);
    });
  });

  describe("PUT /api/articles/:id", () => {
    beforeEach(async () => {
      await seedArticles(env.DB);
    });

    it("200: 記事を更新できる", async () => {
      const res = await app.request("/api/articles/1", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "# Updated" }),
      }, env);

      expect(res.status).toBe(200);
      const data = await res.json<{ content: string }>();
      expect(data.content).toBe("# Updated");
    });

    it("404: 存在しない記事はNotFound", async () => {
      const res = await app.request("/api/articles/999", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: "x" }),
      }, env);

      expect(res.status).toBe(404);
    });
  });

  describe("DELETE /api/articles/:id", () => {
    beforeEach(async () => {
      await seedArticles(env.DB);
    });

    it("200: 記事を削除できる", async () => {
      const res = await app.request("/api/articles/1", {
        method: "DELETE",
      }, env);

      expect(res.status).toBe(200);
      const data = await res.json<{ deleted: number }>();
      expect(data.deleted).toBe(1);
    });

    it("404: 存在しない記事はNotFound", async () => {
      const res = await app.request("/api/articles/999", {
        method: "DELETE",
      }, env);

      expect(res.status).toBe(404);
    });
  });
});
