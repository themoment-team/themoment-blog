import type { Metadata } from "next";
import { PostCard } from "@/components/post/PostCard";
import { getPublishedPosts } from "@/lib/posts";

export const metadata: Metadata = { title: "포스트" };

export default async function PostsPage() {
  const posts = await getPublishedPosts(50);

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-[-0.03em] leading-[1.1] text-fg">
          포스트
        </h1>
        <p className="mt-2 text-sm text-fg-muted">{posts.length}개의 글</p>
      </div>

      {posts.length === 0 ? (
        <div className="py-24 text-center">
          <p className="text-fg-muted text-sm uppercase tracking-[0.06em]">
            아직 포스트가 없습니다
          </p>
        </div>
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
