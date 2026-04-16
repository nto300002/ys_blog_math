import { useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import Sidebar from "../components/Sidebar";
import Reader from "../components/Reader";
import { useTree } from "../hooks/useArticles";

export default function ReaderPage() {
  const { slug } = useParams<{ slug?: string }>();
  const { tree } = useTree();
  const [content, setContent] = useState("");
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (!tree || !slug) return;
    const article = tree.articles.find((a) => a.slug === slug);
    if (!article) return;
    fetch(`/api/articles/${article.id}`)
      .then((r) => r.json<{ content: string }>())
      .then((d) => setContent(d.content));
  }, [tree, slug]);

  return (
    <div className={`app-layout${darkMode ? " dark" : ""}`}>
      <header className="topbar">
        <span className="topbar-title">ys_blog_math</span>
        <button onClick={() => setDarkMode((d) => !d)}>
          {darkMode ? "☀️ ライト" : "🌙 ダーク"}
        </button>
      </header>
      <div className="main-layout">
        {tree && <Sidebar tree={tree} currentSlug={slug} />}
        <main className="content-area">
          <Reader content={content} />
        </main>
      </div>
    </div>
  );
}
