import Link from "next/link";
import { getPostsBySeries } from "@/lib/posts";

interface SeriesNavigatorProps {
  seriesId: string;
  seriesName: string;
  currentSlug: string;
}

export async function SeriesNavigator({
  seriesId,
  seriesName,
  currentSlug,
}: SeriesNavigatorProps) {
  const posts = await getPostsBySeries(seriesId);
  if (posts.length <= 1) return null;

  const currentIdx = posts.findIndex((p) => p.slug === currentSlug);
  const prev = currentIdx > 0 ? posts[currentIdx - 1] : null;
  const next = currentIdx < posts.length - 1 ? posts[currentIdx + 1] : null;

  return (
    <div className="border border-border rounded p-5 space-y-4">
      <p className="text-xs font-medium uppercase tracking-[0.06em] text-fg-muted">
        시리즈 — {seriesName}
      </p>

      <ol className="space-y-1.5">
        {posts.map((post, i) => (
          <li key={post.id}>
            <Link
              href={`/posts/${post.slug}`}
              className={`flex items-start gap-2 text-sm py-0.5 transition-colors ${
                post.slug === currentSlug
                  ? "text-accent font-semibold"
                  : "text-fg-muted hover:text-fg"
              }`}
            >
              <span className="flex-none text-xs mt-0.5 w-4 text-right opacity-50">
                {i + 1}.
              </span>
              {post.title}
            </Link>
          </li>
        ))}
      </ol>

      {(prev || next) && (
        <div className="flex items-center justify-between gap-4 pt-3 border-t border-border">
          {prev ? (
            <Link
              href={`/posts/${prev.slug}`}
              className="text-sm text-fg-muted hover:text-fg transition-colors flex items-center gap-1 min-w-0"
            >
              <span className="flex-none">←</span>
              <span className="truncate">{prev.title}</span>
            </Link>
          ) : (
            <span />
          )}
          {next && (
            <Link
              href={`/posts/${next.slug}`}
              className="text-sm text-fg-muted hover:text-fg transition-colors flex items-center gap-1 min-w-0 ml-auto"
            >
              <span className="truncate">{next.title}</span>
              <span className="flex-none">→</span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
