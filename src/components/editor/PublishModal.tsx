"use client";

import Image from "next/image";
import { useState } from "react";

interface PublishModalProps {
  title: string;
  content: string;
  slug?: string;
  onClose: () => void;
  onPublished: (slug: string) => void;
}

export function PublishModal({
  title,
  content,
  slug,
  onClose,
  onPublished,
}: PublishModalProps) {
  const [tagInput, setTagInput] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [coverImage, setCoverImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  function addTag(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter" && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) {
        setTags([...tags, tagInput.trim()]);
      }
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data: { url?: string; error?: string } = await res.json();
      if (data.url) setCoverImage(data.url);
      else setError(data.error ?? "업로드 실패");
    } catch {
      setError("이미지 업로드에 실패했습니다");
    } finally {
      setUploading(false);
    }
  }

  async function handlePublish() {
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력해주세요");
      return;
    }

    setPublishing(true);
    setError("");

    const newSlug =
      slug ??
      title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    const method = slug ? "PATCH" : "POST";
    const url = slug ? `/api/posts/${slug}` : "/api/posts";

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title,
          slug: newSlug,
          content,
          coverImage: coverImage || undefined,
          tagNames: tags,
          published: true,
        }),
      });

      if (!res.ok) {
        const d: { error?: string } = await res.json();
        setError(d.error ?? "발행에 실패했습니다");
        return;
      }

      const d: { slug: string } = await res.json();
      onPublished(d.slug);
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-bg border border-border rounded-lg w-full max-w-md p-6 space-y-5 mx-4">
        <div className="flex items-center justify-between">
          <h2 className="font-bold tracking-[-0.02em] text-fg">포스트 발행</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-fg-muted hover:text-fg text-lg"
          >
            ✕
          </button>
        </div>

        {/* 태그 */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-fg-muted">
            태그
          </p>
          <div className="flex flex-wrap gap-1.5 mb-2">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center gap-1 text-xs border border-border px-2 py-0.5 rounded text-fg-muted"
              >
                {tag}
                <button
                  type="button"
                  onClick={() => removeTag(tag)}
                  className="hover:text-fg"
                >
                  ✕
                </button>
              </span>
            ))}
          </div>
          <input
            type="text"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={addTag}
            placeholder="Enter로 태그 추가"
            className="w-full text-sm bg-bg-subtle border border-border rounded px-3 py-1.5 text-fg placeholder:text-fg-muted focus:outline-none focus:border-fg-muted"
          />
        </div>

        {/* 커버 이미지 */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-fg-muted">
            커버 이미지
          </p>
          {coverImage ? (
            <div className="relative">
              <Image
                src={coverImage}
                alt="커버 이미지"
                width={400}
                height={200}
                className="w-full h-36 object-cover rounded"
              />
              <button
                type="button"
                onClick={() => setCoverImage("")}
                className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded hover:bg-black/80"
              >
                제거
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center border border-dashed border-border rounded h-24 cursor-pointer hover:bg-bg-subtle transition-colors text-sm text-fg-muted">
              {uploading ? "업로드 중..." : "이미지 선택"}
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

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="button"
          onClick={handlePublish}
          disabled={publishing}
          className="w-full py-2.5 bg-fg text-bg text-sm font-medium rounded hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {publishing ? "발행 중..." : "지금 발행"}
        </button>
      </div>
    </div>
  );
}
