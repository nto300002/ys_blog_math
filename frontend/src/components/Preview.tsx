import { useEffect, useRef } from "react";
import { marked } from "marked";
import { markedHighlight } from "marked-highlight";
import hljs from "highlight.js";
import katex from "katex";

marked.use(
  markedHighlight({
    langPrefix: "hljs language-",
    highlight(code, lang) {
      const language = hljs.getLanguage(lang) ? lang : "plaintext";
      return hljs.highlight(code, { language }).value;
    },
  })
);

function renderKaTeX(html: string): string {
  // Block math: $$...$$
  html = html.replace(/\$\$([\s\S]+?)\$\$/g, (_, tex) => {
    try {
      return katex.renderToString(tex, { displayMode: true });
    } catch {
      return `<span class="katex-error">${tex}</span>`;
    }
  });
  // Inline math: $...$
  html = html.replace(/\$([^$\n]+?)\$/g, (_, tex) => {
    try {
      return katex.renderToString(tex, { displayMode: false });
    } catch {
      return `<span class="katex-error">${tex}</span>`;
    }
  });
  return html;
}

type Props = {
  content: string;
};

export default function Preview({ content }: Props) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!ref.current) return;
    const raw = marked.parse(content) as string;
    ref.current.innerHTML = renderKaTeX(raw);
  }, [content]);

  return <div ref={ref} className="preview markdown-body" />;
}
