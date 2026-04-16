import { useState, useEffect, useCallback } from "react";

export type Article = {
  id: number;
  folder_id: number | null;
  title: string;
  slug: string;
  content: string;
  status: "draft" | "published";
  created_at: string;
  updated_at: string;
};

export type Folder = {
  id: number;
  name: string;
  parent_id: number | null;
  created_at: string;
};

export type Tree = {
  folders: Folder[];
  articles: Pick<Article, "id" | "folder_id" | "title" | "slug" | "status">[];
};

export function useTree() {
  const [tree, setTree] = useState<Tree | null>(null);
  const [error, setError] = useState<string | null>(null);

  const refetch = useCallback(async () => {
    try {
      const res = await fetch("/api/tree");
      if (!res.ok) throw new Error("Failed to fetch tree");
      setTree(await res.json());
    } catch (e) {
      setError(String(e));
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { tree, error, refetch };
}

export function useArticle(id: number | null) {
  const [article, setArticle] = useState<Article | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id === null) return;
    setLoading(true);
    fetch(`/api/articles/${id}`)
      .then((r) => {
        if (!r.ok) throw new Error("Not found");
        return r.json<Article>();
      })
      .then(setArticle)
      .catch((e) => setError(String(e)))
      .finally(() => setLoading(false));
  }, [id]);

  return { article, loading, error };
}

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export function useSaveArticle() {
  const [status, setStatus] = useState<SaveStatus>("idle");

  const save = useCallback(
    async (id: number, patch: Partial<Pick<Article, "title" | "content" | "status">>) => {
      setStatus("saving");
      try {
        const res = await fetch(`/api/articles/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        if (!res.ok) throw new Error("Save failed");
        setStatus("saved");
      } catch {
        setStatus("error");
      }
    },
    []
  );

  return { save, status };
}
