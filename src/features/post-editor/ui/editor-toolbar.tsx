'use client';

import { useRef } from 'react';

interface EditorToolbarProps {
  onInsert: (before: string, after?: string) => void;
  onImageUpload: (file: File) => void;
}

const TOOLS = [
  { label: 'H1', before: '# ', tip: '제목 1' },
  { label: 'H2', before: '## ', tip: '제목 2' },
  { label: 'H3', before: '### ', tip: '제목 3' },
  { label: 'B', before: '**', after: '**', tip: '굵게' },
  { label: 'I', before: '_', after: '_', tip: '기울임' },
  { label: '`', before: '`', after: '`', tip: '인라인 코드' },
  { label: '```', before: '```\n', after: '\n```', tip: '코드 블록' },
  { label: '—', before: '\n---\n', tip: '수평선' },
  { label: '[]', before: '[', after: '](url)', tip: '링크' },
];

export function EditorToolbar({ onInsert, onImageUpload }: EditorToolbarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) onImageUpload(file);
    e.target.value = '';
  }

  return (
    <div className="flex shrink-0 items-center gap-1 overflow-x-auto border-border border-b px-4 py-2">
      {TOOLS.map((tool) => (
        <button
          key={tool.label}
          type="button"
          title={tool.tip}
          onClick={() => onInsert(tool.before, tool.after)}
          className="flex-none rounded px-2.5 py-1 font-mono text-fg-muted text-xs transition-colors hover:bg-bg-subtle hover:text-fg"
        >
          {tool.label}
        </button>
      ))}
      <div className="mx-1 h-4 w-px shrink-0 bg-border" />
      <button
        type="button"
        title="이미지 삽입"
        onClick={() => fileInputRef.current?.click()}
        className="flex-none rounded px-2.5 py-1 text-fg-muted text-xs transition-colors hover:bg-bg-subtle hover:text-fg"
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
