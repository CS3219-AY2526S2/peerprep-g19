"use client";

import { useEffect, useRef } from "react";
import { EditorView, keymap } from "@codemirror/view";
import { EditorState } from "@codemirror/state";
import { basicSetup } from "codemirror";
import { oneDark } from "@codemirror/theme-one-dark";
import { python } from "@codemirror/lang-python";
import { java } from "@codemirror/lang-java";
import { cpp } from "@codemirror/lang-cpp";
import { indentWithTab } from "@codemirror/commands";
import { yCollab } from "y-codemirror.next";
import type * as Y from "yjs";
import type { Awareness } from "y-protocols/awareness";
import type { SupportedLanguage } from "@/types/collaboration";

function getLanguageExtension(lang: SupportedLanguage) {
  switch (lang) {
    case "python3":
      return python();
    case "java":
      return java();
    case "cpp":
    case "c":
      return cpp();
    default:
      return python();
  }
}

interface CodeEditorProps {
  ytext: Y.Text;
  awareness: Awareness;
  language: SupportedLanguage;
  undoManager: Y.UndoManager;
}

export function CodeEditor({ ytext, awareness, language, undoManager }: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewRef = useRef<EditorView | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Clean up previous editor
    if (viewRef.current) {
      viewRef.current.destroy();
    }

    const state = EditorState.create({
      doc: ytext.toString(),
      extensions: [
        basicSetup,
        keymap.of([indentWithTab]),
        oneDark,
        getLanguageExtension(language),
        yCollab(ytext, awareness, { undoManager }),
        EditorView.theme({
          "&": { height: "100%", fontSize: "14px" },
          ".cm-scroller": { overflow: "auto" },
          ".cm-content": { fontFamily: "var(--font-geist-mono), monospace" },
        }),
      ],
    });

    viewRef.current = new EditorView({
      state,
      parent: containerRef.current,
    });

    return () => {
      viewRef.current?.destroy();
      viewRef.current = null;
    };
  }, [ytext, awareness, language, undoManager]);

  return <div ref={containerRef} className="h-full w-full" />;
}
