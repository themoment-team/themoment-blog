"use client";

import { useEffect, useState } from "react";

interface ViewCounterProps {
  slug: string;
  initialCount: number;
}

export function ViewCounter({ slug, initialCount }: ViewCounterProps) {
  const [count, setCount] = useState(initialCount);

  useEffect(() => {
    const key = `viewed-${slug}`;
    if (sessionStorage.getItem(key)) return;

    fetch(`/api/posts/${slug}/views`, { method: "POST" })
      .then(() => {
        sessionStorage.setItem(key, "1");
        setCount((c) => c + 1);
      })
      .catch(() => {});
  }, [slug]);

  return (
    <span className="text-sm text-fg-muted">{count.toLocaleString()} 조회</span>
  );
}
