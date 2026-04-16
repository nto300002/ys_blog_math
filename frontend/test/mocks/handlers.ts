import { http, HttpResponse } from "msw";

const mockTree = {
  folders: [{ id: 1, name: "数学", parent_id: null, created_at: "" }],
  articles: [
    { id: 1, folder_id: 1, title: "CPUパフォーマンス入門", slug: "cpu-perf", status: "published" },
    { id: 2, folder_id: null, title: "このエディタの使い方", slug: "editor-guide", status: "draft" },
  ],
};

const mockArticle = {
  id: 1,
  folder_id: 1,
  title: "CPUパフォーマンス入門",
  slug: "cpu-perf",
  content: "# CPU\n\nMIPS: $\\frac{f}{CPI}$",
  status: "published",
  created_at: "2024-01-01",
  updated_at: "2024-01-01",
};

export const handlers = [
  http.get("/api/tree", () => HttpResponse.json(mockTree)),

  http.get("/api/articles/:id", ({ params }) => {
    const id = Number(params.id);
    if (id === 1) return HttpResponse.json(mockArticle);
    return HttpResponse.json({ error: "Not found" }, { status: 404 });
  }),

  http.put("/api/articles/:id", async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ ...mockArticle, ...body });
  }),

  http.post("/api/articles", async ({ request }) => {
    const body = await request.json() as Record<string, unknown>;
    return HttpResponse.json({ id: 99, ...body }, { status: 201 });
  }),

  http.delete("/api/articles/:id", () =>
    HttpResponse.json({ deleted: 1 })
  ),
];
