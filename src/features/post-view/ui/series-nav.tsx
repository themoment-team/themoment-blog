import Link from "next/link";

interface SeriesPost {
  id: string;
  title: string;
  slug: string;
  seriesOrder: number | null;
}

interface SeriesNavProps {
  seriesTitle: string;
  seriesSlug: string;
  posts: SeriesPost[];
  currentPostId: string;
  prevPost: Pick<SeriesPost, "title" | "slug"> | null;
  nextPost: Pick<SeriesPost, "title" | "slug"> | null;
}

export function SeriesNav({
  seriesTitle,
  seriesSlug,
  posts,
  currentPostId,
  prevPost,
  nextPost,
}: SeriesNavProps) {
  return (
    <div className="border border-border rounded-lg p-5 space-y-4 bg-bg-subtle">
      <div>
        <p className="text-[10px] font-medium uppercase tracking-label text-fg-muted mb-1">
          시리즈
        </p>
        <Link
          href={`/series/${seriesSlug}`}
          className="font-semibold text-fg hover:text-accent transition-colors"
        >
          {seriesTitle}
        </Link>
      </div>

      <ol className="space-y-1.5">
        {posts.map((post, i) => {
          const isCurrent = post.id === currentPostId;
          return (
            <li key={post.id} className="flex items-start gap-2.5">
              <span className="text-xs text-fg-muted mt-0.5 w-4 shrink-0 text-right">
                {i + 1}.
              </span>
              {isCurrent ? (
                <span className="text-sm font-medium text-accent">
                  {post.title}
                  <span className="ml-1.5 text-[10px] font-normal text-fg-muted">
                    ← 현재
                  </span>
                </span>
              ) : (
                <Link
                  href={`/posts/${post.slug}`}
                  className="text-sm text-fg-muted hover:text-fg transition-colors"
                >
                  {post.title}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {(prevPost || nextPost) && (
        <div className="pt-3 border-t border-border flex justify-between gap-4">
          {prevPost ? (
            <Link
              href={`/posts/${prevPost.slug}`}
              className="flex-1 min-w-0 text-left group"
            >
              <p className="text-[10px] uppercase tracking-label text-fg-muted mb-0.5">
                이전 글
              </p>
              <p className="text-sm text-fg-muted group-hover:text-fg transition-colors truncate">
                ← {prevPost.title}
              </p>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {nextPost && (
            <Link
              href={`/posts/${nextPost.slug}`}
              className="flex-1 min-w-0 text-right group"
            >
              <p className="text-[10px] uppercase tracking-label text-fg-muted mb-0.5">
                다음 글
              </p>
              <p className="text-sm text-fg-muted group-hover:text-fg transition-colors truncate">
                {nextPost.title} →
              </p>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
