import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getSeriesNavData } from '@/entities/series';
import {
  getLikeCount,
  getPostBySlug,
  LikeButton,
  PostContent,
  SeriesNav,
  TableOfContents,
  TagBadge,
  ViewCounter,
} from '@/features/post-view';
import { SITE_URL } from '@/shared/config/site';
import { extractHeadings } from '@/shared/lib/markdown';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(decodeURIComponent(slug));
  if (!post) return { title: '포스트를 찾을 수 없습니다' };

  const url = `${SITE_URL}/posts/${post.slug}`;

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    keywords: post.tags.map((t) => t.name),
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      url,
      type: 'article',
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author.name],
      images: post.coverImage ? [{ url: post.coverImage }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export const revalidate = 60;

export default async function PostPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const post = await getPostBySlug(slug);

  if (!post?.published) notFound();

  const headings = extractHeadings(post.content);
  const [likeCount, seriesNav] = await Promise.all([
    getLikeCount(post.id),
    post.seriesId ? getSeriesNavData(post.id, post.seriesId) : null,
  ]);

  const dateStr = post.publishedAt
    ? new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(post.publishedAt))
    : null;

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt ?? '',
    author: { '@type': 'Person', name: post.author.name },
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    url: `${SITE_URL}/posts/${post.slug}`,
    ...(post.coverImage && { image: post.coverImage }),
  };

  // <script> 태그 내 </script> 주입 방지: <, >, & 를 유니코드로 이스케이프
  const safeJsonLd = JSON.stringify(jsonLd).replace(
    /[<>&]/g,
    (c) => ({ '<': '\\u003c', '>': '\\u003e', '&': '\\u0026' })[c] ?? c,
  );

  return (
    <>
      {/* biome-ignore lint/security/noDangerouslySetInnerHtml: JSON-LD 구조화 데이터, 서버에서 이스케이프 처리됨 */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: safeJsonLd }} />
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex items-start gap-12">
          {/* 메인 콘텐츠 */}
          <article className="min-w-0 flex-1">
            {/* 헤더 */}
            <header className="mb-8 space-y-4">
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <TagBadge key={tag.id} name={tag.name} slug={tag.slug} />
                  ))}
                </div>
              )}

              <h1 className="font-bold text-4xl text-fg leading-[1.0] tracking-display sm:text-5xl">
                {post.title}
              </h1>

              <div className="flex items-center gap-3 text-fg-muted text-sm">
                <span>{post.author.name}</span>
                {dateStr && (
                  <>
                    <span className="opacity-40">·</span>
                    <span>{dateStr}</span>
                  </>
                )}
                <span className="opacity-40">·</span>
                <ViewCounter slug={slug} initialCount={post.viewCount} />
              </div>
            </header>

            {/* 시리즈 네비게이션 */}
            {seriesNav && (
              <div className="mb-8">
                <SeriesNav
                  seriesTitle={seriesNav.series.title}
                  seriesSlug={seriesNav.series.slug}
                  posts={seriesNav.posts}
                  currentPostId={post.id}
                  prevPost={seriesNav.prevPost}
                  nextPost={seriesNav.nextPost}
                />
              </div>
            )}

            {/* 커버 이미지 */}
            {post.coverImage && (
              <div className="mb-8 overflow-hidden rounded">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  width={800}
                  height={400}
                  className="w-full object-cover"
                  priority
                />
              </div>
            )}

            {/* 본문 */}
            <PostContent content={post.content} />

            {/* 푸터 액션 */}
            <div className="mt-10 flex flex-col items-start gap-4 border-border border-t pt-8">
              <LikeButton slug={slug} initialCount={likeCount} />
              <Link
                href="/posts"
                className="text-fg-muted text-sm uppercase tracking-label transition-colors hover:text-fg"
              >
                ← 목록
              </Link>
            </div>
          </article>

          {/* ToC 사이드바 (데스크톱) */}
          {headings.length > 0 && (
            <aside className="sticky top-24 hidden w-56 flex-none lg:block">
              <TableOfContents headings={headings} />
            </aside>
          )}
        </div>

        {/* 모바일 ToC (접기/펼치기) */}
        {headings.length > 0 && (
          <details className="mt-6 rounded border border-border p-4 lg:hidden">
            <summary className="cursor-pointer font-medium text-fg-muted text-xs uppercase tracking-label">
              목차
            </summary>
            <div className="mt-3">
              <TableOfContents headings={headings} />
            </div>
          </details>
        )}
      </div>
    </>
  );
}
