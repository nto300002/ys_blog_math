import { useEffect, useRef, useMemo } from "react";
import { EditorView, basicSetup } from "codemirror";
import { markdown } from "@codemirror/lang-markdown";
import { oneDark } from "@codemirror/theme-one-dark";

type Props = {
  content: string;
  onChange: (value: string) => void;
  onDrop?: (file: File, pos: number) => void;
};

export default function Editor({ content, onChange, onDrop }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  const updateListener = useMemo(
    () =>
      EditorView.updateListener.of((update) => {
        if (update.docChanged) {
          onChange(update.state.doc.toString());
        }
      }),
    [onChange]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    const view = new EditorView({
      doc: content,
      extensions: [
        basicSetup,
        markdown(),
        oneDark,
        updateListener,
        EditorView.domEventHandlers({
          drop(event, view) {
            event.preventDefault();
            const file = event.dataTransfer?.files[0];
            if (!file) return;
            const pos = view.posAtCoords({ x: event.clientX, y: event.clientY }) ?? 0;
            onDrop?.(file, pos);
          },
          dragover(event) {
            event.preventDefault();
          },
        }),
      ],
      parent: containerRef.current,
    });

    viewRef.current = view;
    return () => view.destroy();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Sync external content changes (e.g. switching articles)
  useEffect(() => {
    const view = viewRef.current;
    if (!view) return;
    const current = view.state.doc.toString();
    if (current !== content) {
      view.dispatch({
        changes: { from: 0, to: current.length, insert: content },
      });
    }
  }, [content]);

  return <div ref={containerRef} className="editor-cm" />;
}
