import { describe, it, expect } from "vitest";
import { renderHook, waitFor } from "@testing-library/react";
import { useTree, useArticle, useSaveArticle } from "../../src/hooks/useArticles";

describe("useTree", () => {
  it("ツリーデータを取得できる", async () => {
    const { result } = renderHook(() => useTree());
    await waitFor(() => expect(result.current.tree).not.toBeNull());
    expect(result.current.tree?.folders).toHaveLength(1);
    expect(result.current.tree?.articles).toHaveLength(2);
  });
});

describe("useArticle", () => {
  it("記事を取得できる", async () => {
    const { result } = renderHook(() => useArticle(1));
    await waitFor(() => expect(result.current.article).not.toBeNull());
    expect(result.current.article?.slug).toBe("cpu-perf");
  });

  it("idがnullのとき何も取得しない", () => {
    const { result } = renderHook(() => useArticle(null));
    expect(result.current.article).toBeNull();
    expect(result.current.loading).toBe(false);
  });
});

describe("useSaveArticle", () => {
  it("保存後に saved ステータスになる", async () => {
    const { result } = renderHook(() => useSaveArticle());
    expect(result.current.status).toBe("idle");
    result.current.save(1, { content: "updated" });
    await waitFor(() => expect(result.current.status).toBe("saved"));
  });
});
