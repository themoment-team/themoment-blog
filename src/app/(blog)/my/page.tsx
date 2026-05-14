import { DeletePostButton } from "@features/post-editor/ui/delete-post-button";
import { auth } from "@features/auth/config";
import { getDraftPosts, getPublishedPosts } from "@features/post-view";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

export const metadata: Metadata = { title: "내 글 목록" };

function formatDate(date: Date | string | null) {
  if (!date) return "-";
  return new Intl.DateTimeFormat("ko-KR", {
    year: "numeric",
    month: "short",
    day: "numeric",
  }).format(new Date(date));
}

export default async function MyPostsPage() {
  const session = await auth();
  if (!session?.user.isMomentMember) redirect("/");

  const [allPublished, drafts] = await Promise.all([
    getPublishedPosts(100),
    getDraftPosts(session.user.id),
  ]);

  const myPublished = allPublished.filter((p) => p.author.id === session.user.id);

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <h1 className="text-3xl font-bold tracking-[-0.03em] text-fg mb-10">
        내 글 목록
      </h1>

      {/* 임시저장 */}
      <section className="mb-12">
        <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-fg-muted mb-4">
          임시저장 ({drafts.length})
        </h2>

        {drafts.length === 0 ? (
          <p className="text-sm text-fg-muted py-6">임시저장된 글이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border">
            {drafts.map((post) => (
              <li key={post.id} className="py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg truncate">
                    {post.title || "(제목 없음)"}
                  </p>
                  <p className="text-xs text-fg-muted mt-0.5">
                    {formatDate(post.updatedAt)} 수정
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <DeletePostButton postId={post.id} published={false} />
                  <Link
                    href={`/edit/${post.slug}`}
                    className="text-xs text-fg-muted hover:text-fg border border-border px-3 py-1 rounded transition-colors"
                  >
                    이어쓰기
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 발행된 글 */}
      <section>
        <h2 className="text-xs font-medium uppercase tracking-[0.06em] text-fg-muted mb-4">
          발행된 글 ({myPublished.length})
        </h2>

        {myPublished.length === 0 ? (
          <p className="text-sm text-fg-muted py-6">발행된 글이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border">
            {myPublished.map((post) => (
              <li key={post.id} className="py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-fg truncate">{post.title}</p>
                  <p className="text-xs text-fg-muted mt-0.5">
                    {formatDate(post.publishedAt)} 발행
                  </p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <DeletePostButton postId={post.id} published={true} />
                  <Link
                    href={`/posts/${post.slug}`}
                    className="text-xs text-fg-muted hover:text-fg transition-colors"
                  >
                    보기
                  </Link>
                  <Link
                    href={`/edit/${post.slug}`}
                    className="text-xs text-fg-muted hover:text-fg border border-border px-3 py-1 rounded transition-colors"
                  >
                    수정
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
