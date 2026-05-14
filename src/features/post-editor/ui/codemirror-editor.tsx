"use client";

import { markdown, markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { HighlightStyle, syntaxHighlighting } from "@codemirror/language";
import { EditorSelection } from "@codemirror/state";
import { EditorView, keymap, placeholder } from "@codemirror/view";
import { defaultKeymap, history, historyKeymap } from "@codemirror/commands";
import { tags } from "@lezer/highlight";
import CodeMirror from "@uiw/react-codemirror";
import { useMemo, useRef } from "react";

export interface CodeMirrorEditorHandle {
  insert: (before: string, after?: string) => void;
}

interface Props {
  value: string;
  onChange: (value: string) => void;
  onSave: () => void;
  onImageUpload: (file: File) => Promise<void>;
  onReady?: (handle: CodeMirrorEditorHandle) => void;
}

// ── 토글 래퍼 ────────────────────────────────────────────────────
function toggleWrapper(view: EditorView, before: string, after: string) {
  const changes = view.state.changeByRange((range) => {
    const sel = view.state.sliceDoc(range.from, range.to);
    const outerBefore = view.state.sliceDoc(range.from - before.length, range.from);
    const outerAfter  = view.state.sliceDoc(range.to, range.to + after.length);

    if (sel.startsWith(before) && sel.endsWith(after) && sel.length >= before.length + after.length) {
      const inner = sel.slice(before.length, sel.length - after.length);
      return {
        changes: { from: range.from, to: range.to, insert: inner },
        range: EditorSelection.range(range.from, range.from + inner.length),
      };
    }
    if (outerBefore === before && outerAfter === after) {
      return {
        changes: [
          { from: range.from - before.length, to: range.from, insert: "" },
          { from: range.to, to: range.to + after.length, insert: "" },
        ],
        range: EditorSelection.range(
          range.from - before.length,
          range.to - before.length,
        ),
      };
    }
    return {
      changes: [
        { from: range.from, insert: before },
        { from: range.to, insert: after },
      ],
      range: EditorSelection.range(
        range.from + before.length,
        range.to + before.length,
      ),
    };
  });
  view.dispatch(changes);
  view.focus();
}

// ── 마크다운 syntax highlight ─────────────────────────────────────
const markdownHighlight = HighlightStyle.define([
  { tag: tags.heading1, fontWeight: "700", fontSize: "1.4em" },
  { tag: tags.heading2, fontWeight: "700", fontSize: "1.2em" },
  { tag: tags.heading3, fontWeight: "700", fontSize: "1.1em" },
  { tag: tags.strong,        fontWeight: "700" },
  { tag: tags.emphasis,      fontStyle: "italic" },
  { tag: tags.strikethrough, textDecoration: "line-through" },
  { tag: tags.link,      color: "var(--accent)", textDecoration: "underline" },
  { tag: tags.url,       color: "var(--fg-muted)" },
  { tag: tags.monospace, fontFamily: "monospace", color: "var(--accent)" },
  { tag: tags.quote,     color: "var(--fg-muted)", fontStyle: "italic" },
  { tag: tags.meta,      color: "var(--fg-muted)" },
]);

// ── 테마 ─────────────────────────────────────────────────────────
const editorTheme = EditorView.theme({
  "&": { height: "100%", background: "transparent", color: "var(--fg)" },
  ".cm-scroller": { fontFamily: "inherit", lineHeight: "1.75", overflow: "auto" },
  ".cm-content": { padding: "2rem", caretColor: "var(--fg)" },
  ".cm-line": { padding: "0" },
  ".cm-gutters": { display: "none" },
  ".cm-activeLine": { background: "transparent" },
  ".cm-cursor, .cm-dropCursor": { borderLeftColor: "var(--fg)" },
  ".cm-selectionBackground": {
    background: "color-mix(in srgb, var(--accent) 20%, transparent) !important",
  },
  "&.cm-focused .cm-selectionBackground": {
    background: "color-mix(in srgb, var(--accent) 30%, transparent) !important",
  },
  "&.cm-focused": { outline: "none" },
  ".cm-placeholder": { color: "var(--fg-muted)" },
});

// ── 컴포넌트 ─────────────────────────────────────────────────────
export function CodeMirrorEditor({ value, onChange, onSave, onImageUpload, onReady }: Props) {
  const onSaveRef        = useRef(onSave);
  const onImageUploadRef = useRef(onImageUpload);
  onSaveRef.current        = onSave;
  onImageUploadRef.current = onImageUpload;

  const extensions = useMemo(() => [
    history(),
    keymap.of([
      { key: "Tab",   run: (view) => { view.dispatch(view.state.replaceSelection("  ")); return true; } },
      { key: "Mod-b", run: (view) => { toggleWrapper(view, "**", "**");    return true; } },
      { key: "Mod-i", run: (view) => { toggleWrapper(view, "*", "*");       return true; } },
      { key: "Mod-u", run: (view) => { toggleWrapper(view, "<u>", "</u>"); return true; } },
      { key: "Mod-k", run: (view) => { toggleWrapper(view, "[", "](url)"); return true; } },
      { key: "Mod-s", run: ()     => { onSaveRef.current();                return true; } },
      ...defaultKeymap,
      ...historyKeymap,
    ]),
    markdown({ base: markdownLanguage, codeLanguages: languages }),
    syntaxHighlighting(markdownHighlight),
    editorTheme,
    EditorView.lineWrapping,
    EditorView.domEventHandlers({
      paste(e) {
        const item = Array.from(e.clipboardData?.items ?? []).find((i) =>
          i.type.startsWith("image/"),
        );
        if (!item) return false;
        e.preventDefault();
        const file = item.getAsFile();
        if (file) onImageUploadRef.current(file);
        return true;
      },
    }),
    placeholder("마크다운으로 내용을 작성하세요..."),
  ], []); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <CodeMirror
      value={value}
      onChange={onChange}
      onCreateEditor={(view) => {
        onReady?.({
          insert: (before, after = "") => toggleWrapper(view, before, after),
        });
      }}
      extensions={extensions}
      basicSetup={false}
      theme="none"
      height="100%"
      className="h-full"
    />
  );
}
