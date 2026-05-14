import { getPublishedPosts, PostCard } from "@features/post-view";
import { Footer } from "./_components/footer";
import { Header } from "./_components/header";

export default async function HomePage() {
  const posts = await getPublishedPosts(10);

  return (
    <>
      <Header />
      <main className="flex-1">
        {/* 히어로 */}
        <section className="border-b border-border">
          <div className="max-w-5xl mx-auto px-4 py-16 sm:py-24">
            <p className="text-xs font-medium uppercase tracking-label text-fg-muted mb-4">
              더모먼트 기술블로그
            </p>
            <h1 className="text-5xl sm:text-7xl font-bold tracking-display leading-[1.0] text-fg">
              그순간
            </h1>
            <p className="mt-4 text-base text-fg-muted max-w-md leading-relaxed">
              팀 더모먼트 동아리 기록하는 개발의 순간들
            </p>
          </div>
        </section>

        {/* 포스트 목록 */}
        <section className="max-w-5xl mx-auto px-4 py-8">
          {posts.length === 0 ? (
            <div className="py-24 text-center">
              <p className="text-fg-muted text-sm uppercase tracking-label">
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
        </section>
      </main>
      <Footer />
    </>
  );
}
