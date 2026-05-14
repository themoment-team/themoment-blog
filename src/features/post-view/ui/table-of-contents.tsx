"use client";

import { useEffect, useRef, useState } from "react";

interface Heading {
  depth: 1 | 2 | 3;
  text: string;
  id: string;
}

interface TableOfContentsProps {
  headings: Heading[];
}

export function TableOfContents({ headings }: TableOfContentsProps) {
  const [activeId, setActiveId] = useState<string>("");
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    if (observerRef.current) observerRef.current.disconnect();

    const callback: IntersectionObserverCallback = (entries) => {
      const visible = entries
        .filter((e) => e.isIntersecting)
        .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);

      if (visible.length > 0) {
        setActiveId(visible[0].target.id);
      }
    };

    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: "0px 0px -70% 0px",
    });

    for (const h of headings) {
      const el = document.getElementById(h.id);
      if (el) observerRef.current.observe(el);
    }

    return () => observerRef.current?.disconnect();
  }, [headings]);

  if (headings.length === 0) return null;

  return (
    <nav className="space-y-1" aria-label="목차">
      <p className="text-[11px] font-medium uppercase tracking-[0.06em] text-fg-muted mb-3">
        목차
      </p>
      {headings.map((h) => {
        const isActive = activeId === h.id;
        const indent = h.depth === 1 ? "pl-0" : h.depth === 2 ? "pl-3" : "pl-6";

        return (
          <a
            key={h.id}
            href={`#${h.id}`}
            className={`block text-[13px] leading-snug py-0.5 transition-colors ${indent} ${
              isActive
                ? "text-accent font-semibold"
                : "text-fg-muted hover:text-fg"
            }`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(h.id)?.scrollIntoView({
                behavior: "smooth",
                block: "start",
              });
            }}
          >
            {h.text}
          </a>
        );
      })}
    </nav>
  );
}
