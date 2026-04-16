import { useEffect, useState } from "react";

type Heading = {
  id: string;
  text: string;
  level: number;
};

type Props = {
  contentRef: React.RefObject<HTMLDivElement | null>;
};

export default function TOC({ contentRef }: Props) {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeId, setActiveId] = useState<string>("");

  useEffect(() => {
    if (!contentRef.current) return;
    const els = contentRef.current.querySelectorAll<HTMLHeadingElement>(
      "h1,h2,h3,h4,h5,h6"
    );
    const list: Heading[] = Array.from(els).map((el, i) => {
      const id = el.id || `heading-${i}`;
      el.id = id;
      return { id, text: el.textContent ?? "", level: Number(el.tagName[1]) };
    });
    setHeadings(list);
  }, [contentRef]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      { rootMargin: "0px 0px -80% 0px" }
    );

    if (!contentRef.current) return;
    contentRef.current
      .querySelectorAll("h1,h2,h3,h4,h5,h6")
      .forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, [headings, contentRef]);

  if (headings.length === 0) return null;

  return (
    <nav className="toc">
      <div className="toc-header">目次</div>
      {headings.map((h) => (
        <a
          key={h.id}
          href={`#${h.id}`}
          className={`toc-item level-${h.level}${activeId === h.id ? " active" : ""}`}
          style={{ paddingLeft: (h.level - 1) * 12 + 8 }}
        >
          {h.text}
        </a>
      ))}
    </nav>
  );
}
