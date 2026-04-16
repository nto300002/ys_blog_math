import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import type { Tree, Folder } from "../hooks/useArticles";

type TreeNode = {
  type: "folder" | "article";
  id: number;
  name: string;
  slug?: string;
  children: TreeNode[];
  depth: number;
};

function buildTree(tree: Tree): TreeNode[] {
  const folderMap = new Map<number, TreeNode>();
  const roots: TreeNode[] = [];

  for (const f of tree.folders) {
    folderMap.set(f.id, {
      type: "folder",
      id: f.id,
      name: f.name,
      children: [],
      depth: 0,
    });
  }

  for (const f of tree.folders) {
    const node = folderMap.get(f.id)!;
    if (f.parent_id === null) {
      roots.push(node);
    } else {
      folderMap.get(f.parent_id)?.children.push(node);
    }
  }

  // assign depths
  function setDepth(node: TreeNode, d: number) {
    node.depth = d;
    node.children.forEach((c) => setDepth(c, d + 1));
  }
  roots.forEach((r) => setDepth(r, 0));

  // attach articles to their folder or root
  for (const a of tree.articles) {
    const articleNode: TreeNode = {
      type: "article",
      id: a.id,
      name: a.title,
      slug: a.slug,
      children: [],
      depth: 0,
    };
    if (a.folder_id !== null && folderMap.has(a.folder_id)) {
      const folder = folderMap.get(a.folder_id)!;
      articleNode.depth = folder.depth + 1;
      folder.children.push(articleNode);
    } else {
      roots.push(articleNode);
    }
  }

  return roots;
}

type Props = {
  tree: Tree;
  currentSlug?: string;
};

export default function Sidebar({ tree, currentSlug }: Props) {
  const navigate = useNavigate();
  const [openFolders, setOpenFolders] = useState<Set<number>>(() => {
    try {
      const saved = localStorage.getItem("openFolders");
      return new Set(saved ? JSON.parse(saved) : []);
    } catch {
      return new Set();
    }
  });

  useEffect(() => {
    localStorage.setItem("openFolders", JSON.stringify([...openFolders]));
  }, [openFolders]);

  const toggleFolder = (id: number) => {
    setOpenFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const nodes = buildTree(tree);

  function renderNode(node: TreeNode): React.ReactNode {
    const indent = 8 + node.depth * 16;

    if (node.type === "folder") {
      const isOpen = openFolders.has(node.id);
      return (
        <div key={`folder-${node.id}`}>
          <div
            style={{ paddingLeft: indent }}
            className="sidebar-item folder"
            onClick={() => toggleFolder(node.id)}
          >
            <span className="icon">{isOpen ? "▾" : "▸"}</span>
            {node.name}
          </div>
          {isOpen && node.children.map(renderNode)}
        </div>
      );
    }

    const isActive = node.slug === currentSlug;
    return (
      <div
        key={`article-${node.id}`}
        style={{ paddingLeft: indent }}
        className={`sidebar-item article${isActive ? " active" : ""}`}
        onClick={() => navigate(`/articles/${node.slug}`)}
      >
        <span className="icon">📄</span>
        {node.name}
      </div>
    );
  }

  return (
    <aside className="sidebar">
      <div className="sidebar-header">記事一覧</div>
      {nodes.map(renderNode)}
    </aside>
  );
}
