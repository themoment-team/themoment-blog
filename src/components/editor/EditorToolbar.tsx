"use client";

import { useRef } from "react";

interface EditorToolbarProps {
  onInsert: (before: string, after?: string) => void;
  onImageUpload: (file: File) => void;
}

const TOOLS = [
  { label: "H1", before: "# ", tip: "제목 1" },
  { label: "H2", before: "## ", tip: "제목 2" },
  { label: "H3", before: "### ", tip: "제목 3" },
  { label: "B", before: "**", after: "**", tip: "굵게" },
  { label: "I", before: "_", after: "_", tip: "기울임" },
  { label: "`", before: "`", after: "`", tip: "인라인 코드" },
  { label: "```", before: "```\n", after: "\n```", tip: "코드 블록" },
  { label: "—", before: "\n---\n", tip: "수평선" },
  { label: "[]", before: "[", after: "](url)", tip: "링크" },
];

export function EditorToolbar({ onInsert, onImageUpload }: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onImageUpload(file);
    e.target.value = "";
  }

  return (
    <div className="flex items-center gap-1 px-4 py-2 border-b border-border overflow-x-auto shrink-0">
      {TOOLS.map((tool) => (
        <button
          key={tool.label}
          type="button"
          title={tool.tip}
          onClick={() => onInsert(tool.before, tool.after)}
          className="flex-none px-2.5 py-1 text-xs font-mono text-fg-muted hover:text-fg hover:bg-bg-subtle rounded transition-colors"
        >
          {tool.label}
        </button>
      ))}
      <div className="w-px h-4 bg-border mx-1 shrink-0" />
      <button
        type="button"
        title="이미지 삽입"
        onClick={() => fileInputRef.current?.click()}
        className="flex-none px-2.5 py-1 text-xs text-fg-muted hover:text-fg hover:bg-bg-subtle rounded transition-colors"
      >
        이미지
      </button>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={handleFileChange}
      />
    </div>
  );
}
