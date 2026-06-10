'use client';

import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import type { CodeMirrorEditorHandle } from './codemirror-editor';
import { EditorToolbar } from './editor-toolbar';
import { PublishModal } from './publish-modal';

const CodeMirrorEditor = dynamic(
  () => import('./codemirror-editor').then((m) => m.CodeMirrorEditor),
  { ssr: false, loading: () => <div className="h-full" /> },
);

interface MarkdownEditorProps {
  initialTitle?: string;
  initialContent?: string;
  slug?: string;
}

type Mode = 'write' | 'split' | 'preview';

// ── 세그먼트 파서 ─────────────────────────────────────────────
type Segment =
  | { id: string; type: 'img'; src: string; width: number }
  | { id: string; type: 'text'; raw: string };

function parseSegments(content: string): Segment[] {
  const result: Segment[] = [];
  let lastIndex = 0;
  let n = 0;
  const re = /<img\b[^>]*\/>/g;
  let m = re.exec(content);

  while (m !== null) {
    if (m.index > lastIndex) {
      result.push({
        id: `t${n++}`,
        type: 'text',
        raw: content.slice(lastIndex, m.index),
      });
    }
    const src = m[0].match(/src="([^"]*)"/)?.[1] ?? '';
    const width = Number(m[0].match(/width="([^"]*)"/)?.[1]) || 600;
    result.push({ id: `i${n++}`, type: 'img', src, width });
    lastIndex = m.index + m[0].length;
    m = re.exec(content);
  }
  if (lastIndex < content.length) {
    result.push({ id: `t${n++}`, type: 'text', raw: content.slice(lastIndex) });
  }
  return result;
}

// ── 이미지 리사이즈 컴포넌트 ─────────────────────────────────
function ResizableImage({
  src,
  width: initialWidth,
  alt = '이미지',
  onWidthChange,
}: {
  src: string;
  width?: number;
  alt?: string;
  onWidthChange: (src: string, newWidth: number) => void;
}) {
  const [w, setW] = useState(initialWidth ?? 600);
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
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    }
    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  }

  const CORNER = 'absolute w-3 h-3 bg-bg border-2 border-accent rounded-sm z-10';

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: 이미지 호버 상태 추적용 컨테이너
    <span
      className="relative my-2 inline-block select-none"
      style={{ width: w, maxWidth: '100%' }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={(e) => {
        if (e.currentTarget.contains(e.relatedTarget as Node)) return;
        setHovered(false);
      }}
    >
      {/* biome-ignore lint/performance/noImgElement: 에디터 미리보기 이미지, next/image 사용 불가 */}
      <img
        src={src}
        alt={alt}
        draggable={false}
        style={
          {
            width: '100%',
            display: 'block',
            WebkitUserDrag: 'none',
          } as React.CSSProperties
        }
      />
      {hovered && (
        <>
          <span className="pointer-events-none absolute inset-0 border-2 border-accent" />
          <span className="pointer-events-none absolute bottom-2 left-1/2 -translate-x-1/2 select-none whitespace-nowrap rounded bg-black/50 px-1.5 py-0.5 text-white text-xs">
            {Math.round(w)}px
          </span>
          {/* biome-ignore lint/a11y/noStaticElementInteractions: 이미지 리사이즈 핸들 */}
          <span
            className={`${CORNER} top-1.5 left-1.5 cursor-nw-resize`}
            onMouseDown={(e) => startResize(e, true)}
          />
          {/* biome-ignore lint/a11y/noStaticElementInteractions: 이미지 리사이즈 핸들 */}
          <span
            className={`${CORNER} top-1.5 right-1.5 cursor-ne-resize`}
            onMouseDown={(e) => startResize(e, false)}
          />
          {/* biome-ignore lint/a11y/noStaticElementInteractions: 이미지 리사이즈 핸들 */}
          <span
            className={`${CORNER} bottom-1.5 left-1.5 cursor-sw-resize`}
            onMouseDown={(e) => startResize(e, true)}
          />
          {/* biome-ignore lint/a11y/noStaticElementInteractions: 이미지 리사이즈 핸들 */}
          <span
            className={`${CORNER} right-1.5 bottom-1.5 cursor-se-resize`}
            onMouseDown={(e) => startResize(e, false)}
          />
        </>
      )}
    </span>
  );
}

// ── 미리보기 패널 ─────────────────────────────────────────────
function PreviewPane({
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
      {segments.map((seg) =>
        seg.type === 'img' ? (
          <ResizableImage
            key={seg.id}
            src={seg.src}
            width={seg.width}
            onWidthChange={onImageWidthChange}
          />
        ) : (
          <ReactMarkdown key={seg.id} remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
            {seg.raw}
          </ReactMarkdown>
        ),
      )}
    </div>
  );
}

// ── 메인 에디터 ───────────────────────────────────────────────
export function MarkdownEditor({
  initialTitle = '',
  initialContent = '',
  slug,
}: MarkdownEditorProps) {
  const router = useRouter();
  const editorRef = useRef<CodeMirrorEditorHandle | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [content, setContent] = useState(initialContent);
  const [mode, setMode] = useState<Mode>('split');
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saved' | 'error'>('idle');
  const [saveError, setSaveError] = useState('');
  const [uploading, setUploading] = useState(false);
  const [draggingOver, setDraggingOver] = useState(false);
  // 첫 임시저장 후 생성된 slug를 보관 (중복 POST 방지)
  const draftSlugRef = useRef<string | undefined>(slug);

  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (title.trim() || content.trim()) e.preventDefault();
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [title, content]);

  const insertMarkdown = useCallback((before: string, after = '') => {
    editorRef.current?.insert(before, after);
  }, []);

  function handleImageWidthChange(src: string, newWidth: number) {
    setContent((prev) =>
      prev.replace(/<img\b[^>]*>/g, (match) => {
        if (!match.includes(`src="${src}"`)) return match;
        const widthAttr = `width="${Math.round(newWidth)}"`;
        if (match.includes('width=')) {
          return match.replace(/width="[^"]*"/, widthAttr);
        }
        return match.replace(/(\s*\/?>)$/, ` ${widthAttr}$1`);
      }),
    );
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);
    try {
      const r = await fetch('/api/upload', { method: 'POST', body: fd });
      const data: { url?: string } = await r.json();
      if (data.url) insertMarkdown(`<img src="${data.url}" width="600" alt="이미지" />\n`);
    } catch {
    } finally {
      setUploading(false);
    }
  }

  async function handleSaveDraft() {
    if (!title.trim()) {
      setSaveStatus('error');
      setSaveError('제목을 입력해주세요');
      return;
    }
    setSaving(true);
    setSaveStatus('idle');
    setSaveError('');
    try {
      const currentSlug = draftSlugRef.current;
      const slugified =
        currentSlug ??
        (title
          .toLowerCase()
          .replace(/[^a-z0-9가-힣]/g, '-')
          .replace(/-+/g, '-')
          .replace(/^-|-$/g, '') ||
          'untitled');
      const method = currentSlug ? 'PATCH' : 'POST';
      const url = currentSlug ? `/api/posts/${currentSlug}` : '/api/posts';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title,
          slug: slugified,
          content,
          published: false,
        }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        setSaveStatus('error');
        setSaveError((d as { error?: string }).error ?? '저장 실패');
        return;
      }
      if (!currentSlug) {
        const data: { slug: string } = await res.json();
        draftSlugRef.current = data.slug;
      }
      setSaveStatus('saved');
      setSaveError('');
      setTimeout(() => setSaveStatus('idle'), 2000);
    } catch (err) {
      console.error('[임시저장]', err);
      setSaveStatus('error');
      setSaveError('네트워크 오류');
    } finally {
      setSaving(false);
    }
  }

  function handleBack() {
    const hasContent = title.trim() || content.trim();
    if (hasContent && !window.confirm('작성 중인 내용이 있습니다. 나가시겠습니까?')) return;
    if (window.history.length > 1) router.back();
    else router.push('/');
  }

  function handleFileDrop(e: React.DragEvent) {
    e.preventDefault();
    setDraggingOver(false);
    const file = Array.from(e.dataTransfer.files).find((f) => f.type.startsWith('image/'));
    if (file) handleImageUpload(file);
  }

  const modeButtons: { key: Mode; label: string }[] = [
    { key: 'write', label: '편집' },
    { key: 'split', label: '분할' },
    { key: 'preview', label: '미리보기' },
  ];

  return (
    <>
      <div className="flex h-full flex-col">
        {/* 상단 바 */}
        <div className="flex shrink-0 items-center justify-between border-border border-b px-6 py-3">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={handleBack}
              className="text-fg-muted text-sm transition-colors hover:text-fg"
            >
              ← 나가기
            </button>
            <div className="flex overflow-hidden rounded border border-border text-xs">
              {modeButtons.map(({ key, label }) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setMode(key)}
                  className={`px-3 py-1 transition-colors ${mode === key ? 'bg-fg text-bg' : 'text-fg-muted hover:text-fg'}`}
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
                  saveStatus === 'saved'
                    ? 'text-green-500'
                    : saveStatus === 'error'
                      ? 'text-red-500'
                      : 'text-fg-muted hover:text-fg'
                }`}
              >
                {saving
                  ? '저장 중...'
                  : saveStatus === 'saved'
                    ? '저장됨 ✓'
                    : saveStatus === 'error'
                      ? '저장 실패'
                      : '임시저장'}
              </button>
              {saveStatus === 'error' && saveError && (
                <span className="text-red-400 text-xs">{saveError}</span>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowPublishModal(true)}
              className="rounded bg-fg px-4 py-1.5 font-medium text-bg text-sm transition-opacity hover:opacity-80"
            >
              발행
            </button>
          </div>
        </div>

        {/* 제목 */}
        <div className="shrink-0 border-border border-b px-8 py-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="제목을 입력하세요"
            className="w-full bg-transparent font-bold text-3xl text-fg tracking-heading placeholder:text-fg-muted focus:outline-none"
          />
        </div>

        {/* 툴바 */}
        {mode !== 'preview' && (
          <EditorToolbar onInsert={insertMarkdown} onImageUpload={handleImageUpload} />
        )}

        {/* 에디터 영역 */}
        {/* biome-ignore lint/a11y/noStaticElementInteractions: drag-and-drop file upload zone */}
        <div
          className={`relative flex flex-1 overflow-hidden transition-shadow ${draggingOver && !uploading ? 'ring-2 ring-accent ring-inset' : ''}`}
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
              <div className="mb-3 h-10 w-10 animate-spin rounded-full border-2 border-bg-subtle border-t-accent" />
              <p className="font-medium text-fg text-sm uppercase tracking-label">
                이미지 업로드 중
              </p>
            </div>
          )}

          {/* 드래그 오버 오버레이 */}
          {draggingOver && !uploading && (
            <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-bg/70">
              <p className="font-medium text-accent text-sm uppercase tracking-label">
                이미지를 여기에 놓으세요
              </p>
            </div>
          )}

          {/* 편집 패널 */}
          {(mode === 'write' || mode === 'split') && (
            <div
              className={`${mode === 'split' ? 'w-1/2 border-border border-r' : 'w-full'} overflow-hidden`}
            >
              <CodeMirrorEditor
                value={content}
                onChange={setContent}
                onSave={handleSaveDraft}
                onImageUpload={handleImageUpload}
                onReady={(handle) => {
                  editorRef.current = handle;
                }}
              />
            </div>
          )}

          {/* 미리보기 패널 */}
          {(mode === 'preview' || mode === 'split') && (
            <div className={`${mode === 'split' ? 'w-1/2' : 'w-full'} overflow-y-auto`}>
              <PreviewPane content={content} onImageWidthChange={handleImageWidthChange} />
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
