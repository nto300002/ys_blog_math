import { useRef } from "react";
import Preview from "./Preview";
import TOC from "./TOC";

type Props = {
  content: string;
};

export default function Reader({ content }: Props) {
  const previewRef = useRef<HTMLDivElement>(null);

  return (
    <div className="reader-layout">
      <div ref={previewRef} className="reader-content">
        <Preview content={content} />
      </div>
      <TOC contentRef={previewRef} />
    </div>
  );
}
