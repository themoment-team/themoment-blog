import type { Metadata } from 'next';
import { Suspense } from 'react';
import {
  getAllTags,
  getPublishedPosts,
  PostCard,
  PostFilters,
  type PostSortKey,
} from '@/features/post-view';

export const metadata: Metadata = { title: '포스트' };

interface PageProps {
  searchParams: Promise<{ sort?: string; tag?: string }>;
}

function isValidSort(v: unknown): v is PostSortKey {
  return v === 'latest' || v === 'views' || v === 'likes';
}

export default async function PostsPage({ searchParams }: PageProps) {
  const { sort: rawSort, tag } = await searchParams;
  const sort: PostSortKey = isValidSort(rawSort) ? rawSort : 'latest';

  const [postList, tags] = await Promise.all([getPublishedPosts(50, 0, sort, tag), getAllTags()]);

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6">
        <h1 className="font-bold text-3xl text-fg leading-[1.1] tracking-[-0.03em]">포스트</h1>
        <p className="mt-2 text-fg-muted text-sm">{postList.length}개의 글</p>
      </div>

      <div className="mb-8">
        <Suspense>
          <PostFilters currentSort={sort} currentTag={tag} tags={tags} />
        </Suspense>
      </div>

      {postList.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-fg-muted text-sm uppercase tracking-[0.06em]">포스트가 없습니다</p>
        </div>
      ) : (
        postList.map((post) => (
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
        ))
      )}
    </div>
  );
}
