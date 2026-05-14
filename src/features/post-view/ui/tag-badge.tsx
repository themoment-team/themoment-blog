import Link from "next/link";

interface TagBadgeProps {
  name: string;
  slug: string;
  count?: number;
}

export function TagBadge({ name, slug, count }: TagBadgeProps) {
  return (
    <Link
      href={`/tags/${slug}`}
      className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-[0.06em] text-fg-muted border border-border px-2 py-0.5 rounded hover:text-accent hover:border-accent transition-colors"
    >
      {name}
      {count !== undefined && (
        <span className="text-[10px] opacity-60">{count}</span>
      )}
    </Link>
  );
}
