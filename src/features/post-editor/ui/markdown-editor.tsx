"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useRef, useState } from "react";
import rehypeRaw from "rehype-raw";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { CodeMirrorEditorHandle } from "./codemirror-editor";
import { EditorToolbar } from "./editor-toolbar";
import { PublishModal } from "./publish-modal";

const CodeMirrorEditor = dynamic(
  () => import("./codemirror-editor").then((m) => m.CodeMirrorEditor),
  { ssr: false, loading: () => <div className="h-full" /> },
);

interface MarkdownEditorProps {
  initialTitle?: string;
  initialContent?: string;
  slug?: string;
}

type Mode = "write" | "split" | "preview";

// ── 미리보기 패널 ─────────────────────────────────────────────
function PreviewPane({ content }: { content: string }) {
  if (!content.trim()) {
    return (
      <div className="p-8 text-fg-muted text-sm uppercase tracking-label">
        미리볼 내용이 없습니다
      </div>
    );
  }

  return (
    <div className="prose dark:prose-invert max-w-none p-8 pt-10 text-fg">
      <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>{content}</ReactMarkdown>
    </div>
  );
}

// ── 메인 에디터 ───────────────────────────────────────────────
export function MarkdownEditor({
  initialTitle = "",
  initialContent = "",
  slug,
}: MarkdownEditorProps) {
  const router = useRouter();
  const editorRef = useRef<CodeMirrorEditorHandle | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<Mode>("split");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState("");
  const [uploading, setUploading] = useState(false);
  const [draggingOver, setDraggingOver] = useState(false);
  // 첫 임시저장 후 생성된 slug를 보관 (중복 POST 방지)
  const draftSlugRef = useRef<string | undefined>(slug);

  const insertMarkdown = useCallback((before: string, after = "") => {
    editorRef.current?.insert(before, after);
  }, []);

  async function handleImageUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const r = await fetch("/api/upload", { method: "POST", body: fd });
      const data: { url?: string } = await r.json();
      if (data.url)
        insertMarkdown(`<img src="${data.url}" width="600" alt="이미지" />\n`);
    } catch {
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveDraft() {
    if (!title.trim()) {
      setSaveStatus("error");
      setSaveError("제목을 입력해주세요");
      return;
    }
    setSaving(true);
    setSaveStatus("idle");
    setSaveError("");
    try {
      const currentSlug = draftSlugRef.current;
      const slugified =
        currentSlug ??
        (title
          .toLowerCase()
          .replace(/[^a-z0-9가-힣]/g, "-")
          .replace(/-+/g, "-")
          .replace(/^-|-$/g, "") || "untitled");
      const method = currentSlug ? "PATCH" : "POST";
      const url = currentSlug ? `/api/posts/${currentSlug}` : "/api/posts";
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, slug: slugified, content, published: false }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSaveStatus("error");
        setSaveError((d as { error?: string }).error ?? "저장 실패");
        return;
      }
      if (!currentSlug) {
        const data: { slug: string } = await res.json();
        draftSlugRef.current = data.slug;
      }
      setSaveStatus("saved");
      setSaveError("");
      setTimeout(() => setSaveStatus("idle"), 2000);
    } catch (err) {
      console.error("[임시저장]", err);
      setSaveStatus("error");
      setSaveError("네트워크 오류");
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    const hasContent = title.trim() || content.trim();
    if (hasContent && !window.confirm("작성 중인 내용이 있습니다. 나가시겠습니까?")) return;
    if (window.history.length > 1) router.back();
    else router.push("/");
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDraggingOver(false);
    const file = Array.from(e.dataTransfer.files).find((f) =>
      f.type.startsWith("image/"),
    );
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
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-fg-muted hover:text-fg transition-colors"
            >
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleSaveDraft}
                disabled={saving}
                className={`text-sm transition-colors disabled:opacity-50 ${
                  saveStatus === "saved"
                    ? "text-green-500"
                    : saveStatus === "error"
                      ? "text-red-500"
                      : "text-fg-muted hover:text-fg"
                }`}
              >
                {saving
                  ? "저장 중..."
                  : saveStatus === "saved"
                    ? "저장됨 ✓"
                    : saveStatus === "error"
                      ? "저장 실패"
                      : "임시저장"}
              </button>
              {saveStatus === "error" && saveError && (
                <span className="text-xs text-red-400">{saveError}</span>
              )}
            </div>
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
          <EditorToolbar
            onInsert={insertMarkdown}
            onImageUpload={handleImageUpload}
          />
        )}

        {/* 에디터 영역 */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop file upload zone */}
        <div
          className={`flex flex-1 overflow-hidden relative transition-shadow ${draggingOver && !uploading ? "ring-2 ring-inset ring-accent" : ""}`}
          onDrop={handleFileDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setDraggingOver(true);
          }}
          onDragLeave={(e) => {
            const rel = e.relatedTarget;
            if (rel instanceof Node && e.currentTarget.contains(rel)) return;
            setDraggingOver(false);
          }}
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
            <div
              className={`${mode === "split" ? "w-1/2 border-r border-border" : "w-full"} overflow-hidden`}
            >
              <CodeMirrorEditor
                value={content}
                onChange={setContent}
                onSave={handleSaveDraft}
                onImageUpload={handleImageUpload}
                onReady={(handle) => { editorRef.current = handle; }}
              />
            </div>
          )}

          {/* 미리보기 패널 */}
          {(mode === "preview" || mode === "split") && (
            <div
              className={`${mode === "split" ? "w-1/2" : "w-full"} overflow-y-auto`}
            >
              <PreviewPane content={content} />
            </div>
          )}
        </div>
      </div>

      {showPublishModal && (
        <PublishModal
          title={title}
          content={content}
          slug={draftSlugRef.current}
          onClose={() => setShowPublishModal(false)}
          onPublished={(newSlug) => router.push(`/posts/${newSlug}`)}
        />
      )}
    </>
  );
}
