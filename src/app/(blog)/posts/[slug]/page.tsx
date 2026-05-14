import {
  getLikeCount,
  getPostBySlug,
  LikeButton,
  PostContent,
  TableOfContents,
  TagBadge,
  ViewCounter,
} from "@features/post-view";
import { extractHeadings } from "@shared/lib/markdown";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(decodeURIComponent(slug));
  if (!post) return { title: "포스트를 찾을 수 없습니다" };

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    openGraph: {
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

  if (!post || !post.published) notFound();

  const headings = extractHeadings(post.content);
  const likeCount = await getLikeCount(post.id);

  const dateStr = post.publishedAt
    ? new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(post.publishedAt))
    : null;

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="flex gap-12 items-start">
        {/* 메인 콘텐츠 */}
        <article className="flex-1 min-w-0">
          {/* 헤더 */}
          <header className="mb-8 space-y-4">
            {post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <TagBadge key={tag.id} name={tag.name} slug={tag.slug} />
                ))}
              </div>
            )}

            <h1 className="text-4xl sm:text-5xl font-bold tracking-display leading-[1.0] text-fg">
              {post.title}
            </h1>

            <div className="flex items-center gap-3 text-sm text-fg-muted">
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
          <div className="mt-10 pt-8 border-t border-border flex items-center gap-4">
            <LikeButton slug={slug} initialCount={likeCount} />
            <Link
              href="/posts"
              className="text-sm text-fg-muted hover:text-fg transition-colors uppercase tracking-label"
            >
              ← 목록
            </Link>
          </div>
        </article>

        {/* ToC 사이드바 (데스크톱) */}
        {headings.length > 0 && (
          <aside className="hidden lg:block flex-none w-56 sticky top-24">
            <TableOfContents headings={headings} />
          </aside>
        )}
      </div>

      {/* 모바일 ToC (접기/펼치기) */}
      {headings.length > 0 && (
        <details className="lg:hidden mt-6 border border-border rounded p-4">
          <summary className="text-xs font-medium uppercase tracking-label text-fg-muted cursor-pointer">
            목차
          </summary>
          <div className="mt-3">
            <TableOfContents headings={headings} />
          </div>
        </details>
      )}
    </div>
  );
}
