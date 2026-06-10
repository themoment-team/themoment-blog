import {
  getAllTags,
  getPublishedPosts,
  PostCard,
  PostFilters,
  type PostSortKey,
} from '@features/post-view';
import Link from 'next/link';
import { Suspense } from 'react';
import { Footer } from './_components/footer';
import { Header } from './_components/header';

interface HomePageProps {
  searchParams: Promise<{ sort?: string; tag?: string }>;
}

function isValidSort(v: unknown): v is PostSortKey {
  return v === 'latest' || v === 'views' || v === 'likes';
}

export default async function HomePage({ searchParams }: HomePageProps) {
  const { sort: rawSort, tag } = await searchParams;
  const sort: PostSortKey = isValidSort(rawSort) ? rawSort : 'likes';

  const [posts, tags] = await Promise.all([getPublishedPosts(10, 0, sort, tag), getAllTags()]);

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* 히어로 */}
        <section className="border-border border-b">
          <div className="mx-auto max-w-5xl px-4 py-16 sm:py-24">
            <p className="mb-4 font-medium text-fg-muted text-xs uppercase tracking-label">
              더모먼트 기술블로그
            </p>
            <h1 className="font-bold text-5xl text-fg leading-[1.0] tracking-display sm:text-7xl">
              그순간
            </h1>
            <p className="mt-4 max-w-md text-base text-fg-muted leading-relaxed">
              팀 더모먼트 동아리 기록하는 개발의 순간들
            </p>
          </div>
        </section>

        {/* 포스트 목록 */}
        <section className="mx-auto max-w-5xl px-4 py-8">
          <div className="mb-6">
            <Suspense>
              <PostFilters currentSort={sort} currentTag={tag} tags={tags} />
            </Suspense>
          </div>

          {posts.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-fg-muted text-sm uppercase tracking-label">
                아직 포스트가 없습니다
              </p>
            </div>
          ) : (
            <>
              {posts.map((post) => (
                <PostCard
                  key={post.id}
                  title={post.title}
                  slug={post.slug}
                  excerpt={post.excerpt}
                  coverImage={post.coverImage}
                  viewCount={post.viewCount}
                  publishedAt={post.publishedAt}
                  author={post.author}
                  tags={post.tags}
                />
              ))}
              <div className="border-border border-t pt-4 pb-2">
                <Link
                  href="/posts"
                  className="text-fg-muted text-sm uppercase tracking-label transition-colors hover:text-fg"
                >
                  모든 포스트 보기 →
                </Link>
              </div>
            </>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
