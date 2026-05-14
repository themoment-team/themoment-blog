"use client";

import { useEffect, useState } from "react";
import { getFingerprint } from "@/lib/fingerprint";

interface LikeButtonProps {
  slug: string;
  initialCount: number;
}

export function LikeButton({ slug, initialCount }: LikeButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fp = getFingerprint();
    fetch(`/api/posts/${slug}/likes?fp=${fp}`)
      .then((r) => r.json())
      .then((data: { count: number; liked: boolean }) => {
        setCount(data.count);
        setLiked(data.liked);
      })
      .catch(() => {});
  }, [slug]);

  async function toggle() {
    if (loading) return;
    setLoading(true);

    const fp = getFingerprint();
    const method = liked ? "DELETE" : "POST";
    const url = liked
      ? `/api/posts/${slug}/likes?fp=${fp}`
      : `/api/posts/${slug}/likes`;
    const body = liked ? undefined : JSON.stringify({ fingerprint: fp });

    // Optimistic update
    setLiked(!liked);
    setCount((c) => c + (liked ? -1 : 1));

    try {
      const res = await fetch(url, {
        method,
        headers: body ? { "Content-Type": "application/json" } : {},
        body,
      });
      const data: { count: number; liked: boolean } = await res.json();
      setCount(data.count);
      setLiked(data.liked);
    } catch {
      // 롤백
      setLiked(liked);
      setCount((c) => c + (liked ? 1 : -1));
    } finally {
      setLoading(false);
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      disabled={loading}
      className={`flex items-center gap-2 text-sm px-3 py-1.5 border rounded transition-colors ${
        liked
          ? "border-accent text-accent"
          : "border-border text-fg-muted hover:border-fg hover:text-fg"
      } disabled:opacity-50`}
      aria-label={liked ? "좋아요 취소" : "좋아요"}
    >
      <span>{liked ? "♥" : "♡"}</span>
      <span>{count.toLocaleString()}</span>
    </button>
  );
}
