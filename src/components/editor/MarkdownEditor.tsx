"use client";

import hljs from "highlight.js";
import "highlight.js/styles/github.css";
import { useRouter } from "next/navigation";
import { useCallback, useMemo, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import rehypeRaw from "rehype-raw";
import remarkGfm from "remark-gfm";
import { EditorToolbar } from "./EditorToolbar";
import { PublishModal } from "./PublishModal";

interface MarkdownEditorProps {
  initialTitle?: string;
  initialContent?: string;
  slug?: string;
}

type Mode = "write" | "split" | "preview";

// ── 세그먼트 파서 ─────────────────────────────────────────────
type Segment =
  | { id: string; type: "img"; raw: string; src: string; width: number }
  | { id: string; type: "text"; raw: string };

function parseSegments(content: string): Segment[] {
  const result: Segment[] = [];
  let lastIndex = 0;
  let n = 0;
  const re = /<img\b[^>]*\/>/g;
  let m: RegExpExecArray | null;

  while ((m = re.exec(content)) !== null) {
    if (m.index > lastIndex) {
      result.push({ id: `t${n++}`, type: "text", raw: content.slice(lastIndex, m.index) });
    }
    const src = m[0].match(/src="([^"]*)"/)?.[1] ?? "";
    const width = Number(m[0].match(/width="([^"]*)"/)?.[1]) || 600;
    result.push({ id: `i${n++}`, type: "img", raw: m[0], src, width });
    lastIndex = m.index + m[0].length;
  }
  if (lastIndex < content.length) {
    result.push({ id: `t${n++}`, type: "text", raw: content.slice(lastIndex) });
  }
  return result;
}

// ── 메인 에디터 ───────────────────────────────────────────────
export function MarkdownEditor({
  initialTitle = "",
  initialContent = "",
  slug,
}: MarkdownEditorProps) {
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<Mode>("split");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [draggingOver, setDraggingOver] = useState(false);

  const insertMarkdown = useCallback((before: string, after = "") => {
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const sel = ta.value.slice(start, end);
    const next = ta.value.slice(0, start) + before + sel + after + ta.value.slice(end);
    setContent(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(start + before.length, start + before.length + sel.length);
    });
  }, []);

  async function handleImageUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const data: { url?: string } = await r.json();
      if (data.url) insertMarkdown(`<img src="${data.url}" width="600" alt="이미지" />\n`);
    } catch {
    } finally {
      setUploading(false);
    }
  }

  function handleImageWidthChange(src: string, newWidth: number) {
    setContent((prev) => {
      const esc = src.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      return prev.replace(
        new RegExp(`(<img[^>]*src="${esc}"[^>]*?)width="[^"]*"`, "g"),
        `$1width="${newWidth}"`,
      );
    });
  }

  async function handleSaveDraft() {
    if (!title.trim() || !content.trim()) return;
    setSaving(true);
    try {
      const slugified =
        slug ??
        title.toLowerCase().replace(/[^a-z0-9가-힣]/g, "-").replace(/-+/g, "-");
      const method = slug ? "PATCH" : "POST";
      const url = slug ? `/api/posts/${slug}` : "/api/posts";
      await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug: slugified, content, published: false }),
      });
    } finally {
      setSaving(false);
    }
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key !== "Tab") return;
    e.preventDefault();
    const ta = textareaRef.current;
    if (!ta) return;
    const start = ta.selectionStart;
    const end = ta.selectionEnd;
    const spaces = "  ";
    setContent(ta.value.slice(0, start) + spaces + ta.value.slice(end));
    requestAnimationFrame(() => {
      ta.selectionStart = ta.selectionEnd = start + spaces.length;
    });
  }

  function handlePaste(e: React.ClipboardEvent<HTMLTextAreaElement>) {
    const item = Array.from(e.clipboardData.items).find((i) => i.type.startsWith("image/"));
    if (!item) return;
    e.preventDefault();
    const file = item.getAsFile();
    if (file) handleImageUpload(file);
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDraggingOver(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith("image/"));
    if (file) handleImageUpload(file);
  }

  const modeButtons: { key: Mode; label: string }[] = [
    { key: "write", label: "편집" },
    { key: "split", label: "분할" },
    { key: "preview", label: "미리보기" },
  ];

  return (
    <>
      <div className="flex flex-col h-full">
        {/* 상단 바 */}
        <div className="flex items-center justify-between px-6 py-3 border-b border-border shrink-0">
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => router.back()} className="text-sm text-fg-muted hover:text-fg transition-colors">
              ← 나가기
            </button>
            <div className="flex text-xs border border-border rounded overflow-hidden">
              {modeButtons.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMode(key)}
                  className={`px-3 py-1 transition-colors ${mode === key ? "bg-fg text-bg" : "text-fg-muted hover:text-fg"}`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={handleSaveDraft}
              disabled={saving}
              className="text-sm text-fg-muted hover:text-fg transition-colors disabled:opacity-50"
            >
              {saving ? "저장 중..." : "임시저장"}
            </button>
            <button
              type="button"
              onClick={() => setShowPublishModal(true)}
              className="text-sm font-medium px-4 py-1.5 bg-fg text-bg rounded hover:opacity-80 transition-opacity"
            >
              발행
            </button>
          </div>
        </div>

        {/* 제목 */}
        <div className="border-b border-border px-8 py-4 shrink-0">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full text-3xl font-bold tracking-heading bg-transparent text-fg placeholder:text-fg-muted focus:outline-none"
          />
        </div>

        {/* 툴바 */}
        {mode !== "preview" && (
          <EditorToolbar onInsert={insertMarkdown} onImageUpload={handleImageUpload} />
        )}

        {/* 에디터 영역 */}
        <div
          className={`flex flex-1 overflow-hidden relative transition-shadow ${draggingOver && !uploading ? "ring-2 ring-inset ring-accent" : ""}`}
          onDrop={handleFileDrop}
          onDragOver={(e) => { e.preventDefault(); setDraggingOver(true); }}
          onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setDraggingOver(false); }}
        >
          {/* 업로드 오버레이 */}
          {uploading && (
            <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-bg/85 backdrop-blur-sm">
              <div className="w-10 h-10 border-2 border-bg-subtle border-t-accent rounded-full animate-spin mb-3" />
              <p className="text-sm font-medium text-fg uppercase tracking-label">
                이미지 업로드 중
              </p>
            </div>
          )}

          {/* 드래그 오버 오버레이 */}
          {draggingOver && !uploading && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-bg/70 pointer-events-none">
              <p className="text-sm font-medium text-accent uppercase tracking-label">
                이미지를 여기에 놓으세요
              </p>
            </div>
          )}

          {/* 편집 패널 */}
          {(mode === "write" || mode === "split") && (
            <div className={`${mode === "split" ? "w-1/2 border-r border-border" : "w-full"} overflow-y-auto`}>
              <textarea
                ref={textareaRef}
                value={content}
                onChange={(e) => setContent(e.target.value)}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                placeholder="마크다운으로 내용을 작성하세요..."
                className="w-full h-full min-h-full resize-none p-8 bg-transparent text-fg font-sans text-base leading-relaxed focus:outline-none placeholder:text-fg-muted"
                spellCheck={false}
              />
            </div>
          )}

          {/* 미리보기 패널 */}
          {(mode === "preview" || mode === "split") && (
            <div className={`${mode === "split" ? "w-1/2" : "w-full"} overflow-y-auto`}>
              <PreviewContent
                content={content}
                onImageWidthChange={handleImageWidthChange}
              />
            </div>
          )}
        </div>
      </div>

      {showPublishModal && (
        <PublishModal
          title={title}
          content={content}
          slug={slug}
          onClose={() => setShowPublishModal(false)}
          onPublished={(newSlug) => router.push(`/posts/${newSlug}`)}
        />
      )}
    </>
  );
}

// ── 이미지 컴포넌트 ───────────────────────────────────────────
function ResizableImage({
  src,
  width: initialWidth,
  alt = "이미지",
  onWidthChange,
}: {
  src: string;
  width?: string | number;
  alt?: string;
  onWidthChange: (src: string, newWidth: number) => void;
}) {
  const [w, setW] = useState(Number(initialWidth) || 600);
  const [hovered, setHovered] = useState(false);
  const currentW = useRef(w);

  function startResize(e: React.MouseEvent, fromLeft: boolean) {
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startW = w;
    currentW.current = w;

    function onMove(ev: MouseEvent) {
      const delta = ev.clientX - startX;
      const next = Math.max(80, startW + (fromLeft ? -delta : delta));
      currentW.current = next;
      setW(next);
    }
    function onUp() {
      onWidthChange(src, currentW.current);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseup", onUp);
    }
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseup", onUp);
  }

  const CORNER = "absolute w-3 h-3 bg-bg border-2 border-accent rounded-sm z-10";

  return (
    <span
      className="relative inline-block my-2 select-none"
      style={{ width: w, maxWidth: "100%" }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={(e) => {
        const rel = e.relatedTarget;
        if (rel instanceof Node && e.currentTarget.contains(rel)) return;
        setHovered(false);
      }}
    >
      {/* biome-ignore lint/a11y/useAltText: alt prop으로 전달됨 */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={{ width: "100%", display: "block", WebkitUserDrag: "none" } as React.CSSProperties}
      />

      {hovered && (
        <>
          <span className="absolute inset-0 border-2 border-accent pointer-events-none" />

          <span className="absolute bottom-2 left-1/2 -translate-x-1/2 text-xs bg-black/50 text-white px-1.5 py-0.5 rounded pointer-events-none select-none whitespace-nowrap">
            {Math.round(w)}px
          </span>

          <span className={`${CORNER} top-1.5 left-1.5 cursor-nw-resize`} onMouseDown={(e) => startResize(e, true)} />
          <span className={`${CORNER} top-1.5 right-1.5 cursor-ne-resize`} onMouseDown={(e) => startResize(e, false)} />
          <span className={`${CORNER} bottom-1.5 left-1.5 cursor-sw-resize`} onMouseDown={(e) => startResize(e, true)} />
          <span className={`${CORNER} bottom-1.5 right-1.5 cursor-se-resize`} onMouseDown={(e) => startResize(e, false)} />
        </>
      )}
    </span>
  );
}

// ── 미리보기 ──────────────────────────────────────────────────
function PreviewContent({
  content,
  onImageWidthChange,
}: {
  content: string;
  onImageWidthChange: (src: string, newWidth: number) => void;
}) {
  const segments = useMemo(() => parseSegments(content), [content]);

  if (!content.trim()) {
    return (
      <div className="p-8 text-fg-muted text-sm uppercase tracking-label">
        미리볼 내용이 없습니다
      </div>
    );
  }

  return (
    <div className="prose dark:prose-invert max-w-none p-8 pt-10 text-fg">
      {segments.map((seg) => (
        <div key={seg.id}>
          {seg.type === "img" ? (
            <ResizableImage
              src={seg.src}
              width={seg.width}
              alt="이미지"
              onWidthChange={onImageWidthChange}
            />
          ) : (
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              rehypePlugins={[rehypeRaw]}
              components={{
                code({ className, children }) {
                  const lang = className?.replace("language-", "") ?? "";
                  const code = String(children ?? "").replace(/\n$/, "");
                  if (!className?.startsWith("language-")) {
                    return (
                      <code className="bg-bg-subtle px-1 py-0.5 rounded text-sm font-mono">
                        {children}
                      </code>
                    );
                  }
                  const highlighted =
                    lang && hljs.getLanguage(lang)
                      ? hljs.highlight(code, { language: lang }).value
                      : hljs.highlightAuto(code).value;
                  return (
                    <pre className="hljs rounded-lg overflow-x-auto">
                      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: highlight.js 출력 */}
                      <code className={`language-${lang}`} dangerouslySetInnerHTML={{ __html: highlighted }} />
                    </pre>
                  );
                },
              }}
            >
              {seg.raw}
            </ReactMarkdown>
          )}
        </div>
      ))}
    </div>
  );
}
