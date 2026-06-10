import { getPostsByTag, getTagBySlug, PostCard } from '@features/post-view';
import type { Metadata } from 'next';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  return { title: tag ? `#${tag.name}` : '태그' };
}

export default async function TagPage({ params }: PageProps) {
  const { slug } = await params;
  const tag = await getTagBySlug(slug);
  if (!tag) notFound();

  const posts = await getPostsByTag(slug);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.06em] text-fg-muted mb-2">태그</p>
        <h1 className="text-3xl font-bold tracking-[-0.03em] leading-[1.1] text-fg">#{tag.name}</h1>
        <p className="mt-2 text-sm text-fg-muted">{posts.length}개의 포스트</p>
      </div>

      {posts.length === 0 ? (
        <p className="text-fg-muted text-sm uppercase tracking-[0.06em]">포스트가 없습니다</p>
      ) : (
        posts.map((post) => (
          <PostCard
            key={post.id}
            title={post.title}
            slug={post.slug}
            excerpt={post.excerpt}
            coverImage={post.coverImage}
            viewCount={post.viewCount}
            publishedAt={post.publishedAt}
            author={post.author}
          />
        ))
      )}
    </div>
  );
}
