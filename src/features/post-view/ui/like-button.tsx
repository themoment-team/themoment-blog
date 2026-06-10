'use client';

import { useEffect, useState } from 'react';
import { getFingerprint } from '@/shared/lib/fingerprint';

interface LikeButtonProps {
  slug: string;
  initialCount: number;
}

export function LikeButton({ slug, initialCount }: LikeButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [liked, setLiked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    const fp = getFingerprint();
    fetch(`/api/posts/${slug}/likes?fp=${fp}`, { signal: controller.signal })
      .then((r) => r.json())
      .then((data: { count: number; liked: boolean }) => {
        setCount(data.count);
        setLiked(data.liked);
      })
      .catch((err: unknown) => {
        if (err instanceof Error && err.name === 'AbortError') return;
      });
    return () => controller.abort();
  }, [slug]);

  async function toggle() {
    if (loading) return;
    setLoading(true);

    const fp = getFingerprint();
    const method = liked ? 'DELETE' : 'POST';
    const url = liked ? `/api/posts/${slug}/likes?fp=${fp}` : `/api/posts/${slug}/likes`;
    const body = liked ? undefined : JSON.stringify({ fingerprint: fp });

    setLiked(!liked);
    setCount((c) => c + (liked ? -1 : 1));

    try {
      const res = await fetch(url, {
        method,
        headers: body ? { 'Content-Type': 'application/json' } : {},
        body,
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: { count: number; liked: boolean } = await res.json();
      setCount(data.count);
      setLiked(data.liked);
    } catch {
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
      className={`flex items-center gap-2 rounded border px-3 py-1.5 text-sm transition-colors ${
        liked
          ? 'border-accent text-accent'
          : 'border-border text-fg-muted hover:border-fg hover:text-fg'
      } disabled:opacity-50`}
      aria-label={liked ? '좋아요 취소' : '좋아요'}
    >
      <span>{liked ? '♥' : '♡'}</span>
      <span>{count.toLocaleString()}</span>
    </button>
  );
}
