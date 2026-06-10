import { getSeriesBySlug, getSeriesWithPosts } from "@features/post-view";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const s = await getSeriesBySlug(decodeURIComponent(slug));
  return { title: s ? s.title : "시리즈" };
}

export default async function SeriesDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const s = await getSeriesBySlug(decodeURIComponent(slug));
  if (!s) notFound();

  const data = await getSeriesWithPosts(s.id);
  const seriesPosts = data?.posts ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.06em] text-fg-muted mb-2">
          시리즈
        </p>
        <h1 className="text-3xl font-bold tracking-[-0.03em] leading-[1.1] text-fg">
          {s.title}
        </h1>
        {s.description && (
          <p className="mt-2 text-sm text-fg-muted">{s.description}</p>
        )}
        <p className="mt-3 text-sm text-fg-muted">{seriesPosts.length}개의 포스트</p>
      </div>

      {seriesPosts.length === 0 ? (
        <p className="text-fg-muted text-sm uppercase tracking-[0.06em]">
          포스트가 없습니다
        </p>
      ) : (
        <ol className="divide-y divide-border">
          {seriesPosts.map((post, i) => (
            <li key={post.id} className="flex items-center gap-4 group py-4">
              <span className="text-sm text-fg-muted font-mono w-6 shrink-0 text-right">
                {i + 1}.
              </span>
              <Link
                href={`/posts/${post.slug}`}
                className="text-base font-medium text-fg group-hover:text-accent transition-colors"
              >
                {post.title}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
