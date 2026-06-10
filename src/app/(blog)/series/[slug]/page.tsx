import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSeriesBySlug, getSeriesWithPosts } from '@/features/post-view';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const s = await getSeriesBySlug(decodeURIComponent(slug));
  return { title: s ? s.title : '시리즈' };
}

export default async function SeriesDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const s = await getSeriesBySlug(decodeURIComponent(slug));
  if (!s) notFound();

  const data = await getSeriesWithPosts(s.id);
  const seriesPosts = data?.posts ?? [];

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <p className="mb-2 font-medium text-fg-muted text-xs uppercase tracking-[0.06em]">시리즈</p>
        <h1 className="font-bold text-3xl text-fg leading-[1.1] tracking-[-0.03em]">{s.title}</h1>
        {s.description && <p className="mt-2 text-fg-muted text-sm">{s.description}</p>}
        <p className="mt-3 text-fg-muted text-sm">{seriesPosts.length}개의 포스트</p>
      </div>

      {seriesPosts.length === 0 ? (
        <p className="text-fg-muted text-sm uppercase tracking-[0.06em]">포스트가 없습니다</p>
      ) : (
        <ol className="divide-y divide-border">
          {seriesPosts.map((post, i) => (
            <li key={post.id} className="group flex items-center gap-4 py-4">
              <span className="w-6 shrink-0 text-right font-mono text-fg-muted text-sm">
                {i + 1}.
              </span>
              <Link
                href={`/posts/${post.slug}`}
                className="font-medium text-base text-fg transition-colors group-hover:text-accent"
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
