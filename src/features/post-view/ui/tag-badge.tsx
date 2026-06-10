import Link from 'next/link';

interface TagBadgeProps {
  name: string;
  slug: string;
  count?: number;
}

export function TagBadge({ name, slug, count }: TagBadgeProps) {
  return (
    <Link
      href={`/tags/${slug}`}
      className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 font-medium text-fg-muted text-xs uppercase tracking-[0.06em] transition-colors hover:border-accent hover:text-accent"
    >
      {name}
      {count !== undefined && <span className="text-[10px] opacity-60">{count}</span>}
    </Link>
  );
}
