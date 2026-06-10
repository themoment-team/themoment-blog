import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getPostsByTag, getTagBySlug, PostCard } from '@/features/post-view';

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
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <p className="mb-2 font-medium text-fg-muted text-xs uppercase tracking-[0.06em]">태그</p>
        <h1 className="font-bold text-3xl text-fg leading-[1.1] tracking-[-0.03em]">#{tag.name}</h1>
        <p className="mt-2 text-fg-muted text-sm">{posts.length}개의 포스트</p>
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
