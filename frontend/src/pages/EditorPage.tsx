import { useState, useCallback, useEffect, useMemo } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Editor from "../components/Editor";
import Preview from "../components/Preview";
import { useTree, useArticle, useSaveArticle } from "../hooks/useArticles";

function debounce<T extends (...args: Parameters<T>) => void>(fn: T, ms: number): T {
  let timer: ReturnType<typeof setTimeout>;
  return ((...args: Parameters<T>) => {
    clearTimeout(timer);
    timer = setTimeout(() => fn(...args), ms);
  }) as T;
}

export default function EditorPage() {
  const { id } = useParams<{ id?: string }>();
  const articleId = id ? Number(id) : null;

  const { tree } = useTree();
  const { article } = useArticle(articleId);
  const { save, status } = useSaveArticle();

  const [content, setContent] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (article) setContent(article.content);
  }, [article]);

  const debouncedSave = useMemo(
    () =>
      debounce((value: string) => {
        if (articleId !== null) save(articleId, { content: value });
      }, 1500),
    [articleId, save]
  );

  const handleChange = useCallback(
    (value: string) => {
      setContent(value);
      debouncedSave(value);
    },
    [debouncedSave]
  );

  const handleDrop = useCallback(
    async (file: File, pos: number) => {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/r2/upload", { method: "POST", body: formData });
      if (!res.ok) return;
      const { url } = await res.json<{ url: string }>();
      const insertion = `![${file.name}](${url})`;
      setContent((prev) => prev.slice(0, pos) + insertion + prev.slice(pos));
    },
    []
  );

  const saveLabel =
    status === "saving" ? "保存中…" : status === "saved" ? "保存済み ✓" : status === "error" ? "保存失敗" : "";

  return (
    <div className={`app-layout${darkMode ? " dark" : ""}`}>
      <header className="topbar">
        <span className="topbar-title">ys_blog_math — Editor</span>
        <button onClick={() => setDarkMode((d) => !d)}>
          {darkMode ? "☀️ ライト" : "🌙 ダーク"}
        </button>
      </header>
      <div className="main-layout">
        {tree && <Sidebar tree={tree} />}
        <main className="editor-area">
          <Editor content={content} onChange={handleChange} onDrop={handleDrop} />
        </main>
        <aside className="preview-area">
          <Preview content={content} />
        </aside>
      </div>
      <footer className="statusbar">
        <span>文字数: {content.length}</span>
        <span className="save-status">{saveLabel}</span>
      </footer>
    </div>
  );
}
