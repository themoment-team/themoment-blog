import Link from 'next/link';

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
  prevPost: Pick<SeriesPost, 'title' | 'slug'> | null;
  nextPost: Pick<SeriesPost, 'title' | 'slug'> | null;
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
    <div className="space-y-4 rounded-lg border border-border bg-bg-subtle p-5">
      <div>
        <p className="mb-1 font-medium text-[10px] text-fg-muted uppercase tracking-label">
          시리즈
        </p>
        <Link
          href={`/series/${seriesSlug}`}
          className="font-semibold text-fg transition-colors hover:text-accent"
        >
          {seriesTitle}
        </Link>
      </div>

      <ol className="space-y-1.5">
        {posts.map((post, i) => {
          const isCurrent = post.id === currentPostId;
          return (
            <li key={post.id} className="flex items-start gap-2.5">
              <span className="mt-0.5 w-4 shrink-0 text-right text-fg-muted text-xs">{i + 1}.</span>
              {isCurrent ? (
                <span className="font-medium text-accent text-sm">
                  {post.title}
                  <span className="ml-1.5 font-normal text-[10px] text-fg-muted">← 현재</span>
                </span>
              ) : (
                <Link
                  href={`/posts/${post.slug}`}
                  className="text-fg-muted text-sm transition-colors hover:text-fg"
                >
                  {post.title}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {(prevPost || nextPost) && (
        <div className="flex justify-between gap-4 border-border border-t pt-3">
          {prevPost ? (
            <Link href={`/posts/${prevPost.slug}`} className="group min-w-0 flex-1 text-left">
              <p className="mb-0.5 text-[10px] text-fg-muted uppercase tracking-label">이전 글</p>
              <p className="truncate text-fg-muted text-sm transition-colors group-hover:text-fg">
                ← {prevPost.title}
              </p>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {nextPost && (
            <Link href={`/posts/${nextPost.slug}`} className="group min-w-0 flex-1 text-right">
              <p className="mb-0.5 text-[10px] text-fg-muted uppercase tracking-label">다음 글</p>
              <p className="truncate text-fg-muted text-sm transition-colors group-hover:text-fg">
                {nextPost.title} →
              </p>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
