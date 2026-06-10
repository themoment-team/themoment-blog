'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ALLOWED_TAGS, type AllowedTag } from '@/shared/config/tags';

interface SeriesItem {
  id: string;
  title: string;
  slug: string;
}

interface PublishModalProps {
  title: string;
  content: string;
  slug?: string;
  onClose: () => void;
  onPublished: (slug: string) => void;
}

export function PublishModal({ title, content, slug, onClose, onPublished }: PublishModalProps) {
  const [selectedTags, setSelectedTags] = useState<AllowedTag[]>([]);
  const [coverImage, setCoverImage] = useState('');
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState('');

  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState('');
  const [newSeriesTitle, setNewSeriesTitle] = useState('');
  const [seriesOrder, setSeriesOrder] = useState('');
  const [isNewSeries, setIsNewSeries] = useState(false);

  useEffect(() => {
    fetch('/api/series')
      .then((r) => r.json())
      .then((data: SeriesItem[]) => setSeriesList(data))
      .catch(() => {});
  }, []);

  function toggleTag(tag: AllowedTag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append('file', file);

    try {
      const res = await fetch('/api/upload', { method: 'POST', body: fd });
      const data: { url?: string; error?: string } = await res.json();
      if (data.url) setCoverImage(data.url);
      else setError(data.error ?? '업로드 실패');
    } catch {
      setError('이미지 업로드에 실패했습니다');
    } finally {
      setUploading(false);
    }
  }

  async function handlePublish() {
    if (!title.trim() || !content.trim()) {
      setError('제목과 내용을 입력해주세요');
      return;
    }

    const seriesTitle = isNewSeries
      ? newSeriesTitle.trim() || null
      : (seriesList.find((s) => s.id === selectedSeriesId)?.title ?? null);

    setPublishing(true);
    setError('');

    const newSlug =
      slug ??
      title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '');

    const method = slug ? 'PATCH' : 'POST';
    const url = slug ? `/api/posts/${slug}` : '/api/posts';

    const body: Record<string, unknown> = {
      title,
      slug: newSlug,
      content,
      coverImage: coverImage || undefined,
      tagNames: selectedTags,
      published: true,
      seriesTitle,
      seriesOrder: seriesOrder ? Number(seriesOrder) : null,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d: { error?: string } = await res.json();
        setError(d.error ?? '발행에 실패했습니다');
        return;
      }

      const d: { slug: string } = await res.json();
      onPublished(d.slug);
    } catch {
      setError('네트워크 오류가 발생했습니다');
    } finally {
      setPublishing(false);
    }
  }

  const hasSeriesSelection = isNewSeries
    ? newSeriesTitle.trim().length > 0
    : selectedSeriesId.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="mx-4 max-h-[90vh] w-full max-w-md space-y-5 overflow-y-auto rounded-lg border border-border bg-bg p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-bold text-fg tracking-[-0.02em]">포스트 발행</h2>
          <button type="button" onClick={onClose} className="text-fg-muted text-lg hover:text-fg">
            ✕
          </button>
        </div>

        {/* 태그 */}
        <div className="space-y-2">
          <p className="font-medium text-fg-muted text-xs uppercase tracking-[0.06em]">태그</p>
          <div className="flex flex-wrap gap-2">
            {ALLOWED_TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`rounded border px-2.5 py-1 text-xs transition-colors ${
                    active
                      ? 'border-fg bg-fg text-bg'
                      : 'border-border text-fg-muted hover:border-fg hover:text-fg'
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* 시리즈 */}
        <div className="space-y-2">
          <p className="font-medium text-fg-muted text-xs uppercase tracking-[0.06em]">시리즈</p>
          <div className="mb-2 flex gap-2">
            <button
              type="button"
              onClick={() => {
                setIsNewSeries(false);
                setSelectedSeriesId('');
              }}
              className={`rounded border px-2.5 py-1 text-xs transition-colors ${
                !isNewSeries
                  ? 'border-fg bg-fg text-bg'
                  : 'border-border text-fg-muted hover:border-fg hover:text-fg'
              }`}
            >
              기존 시리즈
            </button>
            <button
              type="button"
              onClick={() => {
                setIsNewSeries(true);
                setSelectedSeriesId('');
              }}
              className={`rounded border px-2.5 py-1 text-xs transition-colors ${
                isNewSeries
                  ? 'border-fg bg-fg text-bg'
                  : 'border-border text-fg-muted hover:border-fg hover:text-fg'
              }`}
            >
              새 시리즈
            </button>
          </div>

          {isNewSeries ? (
            <input
              type="text"
              placeholder="시리즈 제목 입력"
              value={newSeriesTitle}
              onChange={(e) => setNewSeriesTitle(e.target.value)}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-fg text-sm placeholder:text-fg-muted focus:border-fg-muted focus:outline-none"
            />
          ) : (
            <select
              value={selectedSeriesId}
              onChange={(e) => setSelectedSeriesId(e.target.value)}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-fg text-sm focus:border-fg-muted focus:outline-none"
            >
              <option value="">없음</option>
              {seriesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          )}

          {hasSeriesSelection && (
            <input
              type="number"
              placeholder="시리즈 내 순서 (예: 1)"
              min={1}
              value={seriesOrder}
              onChange={(e) => setSeriesOrder(e.target.value)}
              className="w-full rounded border border-border bg-bg px-3 py-2 text-fg text-sm placeholder:text-fg-muted focus:border-fg-muted focus:outline-none"
            />
          )}
        </div>

        {/* 커버 이미지 */}
        <div className="space-y-2">
          <p className="font-medium text-fg-muted text-xs uppercase tracking-[0.06em]">
            커버 이미지
          </p>
          {coverImage ? (
            <div className="relative">
              <Image
                src={coverImage}
                alt="커버 이미지"
                width={400}
                height={200}
                className="h-36 w-full rounded object-cover"
              />
              <button
                type="button"
                onClick={() => setCoverImage('')}
                className="absolute top-2 right-2 rounded bg-black/60 px-2 py-0.5 text-white text-xs hover:bg-black/80"
              >
                제거
              </button>
            </div>
          ) : (
            <label className="flex h-24 cursor-pointer items-center justify-center rounded border border-border border-dashed text-fg-muted text-sm transition-colors hover:bg-bg-subtle">
              {uploading ? '업로드 중...' : '이미지 선택'}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="sr-only"
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {error && <p className="text-red-500 text-sm">{error}</p>}

        <button
          type="button"
          onClick={handlePublish}
          disabled={publishing}
          className="w-full rounded bg-fg py-2.5 font-medium text-bg text-sm transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {publishing ? '발행 중...' : '지금 발행'}
        </button>
      </div>
    </div>
  );
}
