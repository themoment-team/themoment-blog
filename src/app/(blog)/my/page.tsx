import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/features/auth/config';
import { DeletePostButton } from '@/features/post-editor/ui/delete-post-button';
import { DeleteSeriesButton } from '@/features/post-editor/ui/delete-series-button';
import { getAllSeries, getDraftPosts, getPublishedPosts } from '@/features/post-view';

export const metadata: Metadata = { title: '내 글 목록' };

function formatDate(date: Date | string | null) {
  if (!date) return '-';
  return new Intl.DateTimeFormat('ko-KR', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(new Date(date));
}

export default async function MyPostsPage() {
  const session = await auth();
  if (!session?.user.isMomentMember) redirect('/');

  const [myPublished, drafts, allSeries] = await Promise.all([
    getPublishedPosts(200, 0, 'latest', undefined, session.user.id),
    getDraftPosts(session.user.id),
    getAllSeries(),
  ]);

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <h1 className="mb-10 font-bold text-3xl text-fg tracking-[-0.03em]">내 글 목록</h1>

      {/* 임시저장 */}
      <section className="mb-12">
        <h2 className="mb-4 font-medium text-fg-muted text-xs uppercase tracking-[0.06em]">
          임시저장 ({drafts.length})
        </h2>

        {drafts.length === 0 ? (
          <p className="py-6 text-fg-muted text-sm">임시저장된 글이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border">
            {drafts.map((post) => (
              <li key={post.id} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-fg text-sm">
                    {post.title || '(제목 없음)'}
                  </p>
                  <p className="mt-0.5 text-fg-muted text-xs">{formatDate(post.updatedAt)} 수정</p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <DeletePostButton postId={post.id} published={false} />
                  <Link
                    href={`/edit/${post.slug}`}
                    className="rounded border border-border px-3 py-1 text-fg-muted text-xs transition-colors hover:text-fg"
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
        <h2 className="mb-4 font-medium text-fg-muted text-xs uppercase tracking-[0.06em]">
          발행된 글 ({myPublished.length})
        </h2>

        {myPublished.length === 0 ? (
          <p className="py-6 text-fg-muted text-sm">발행된 글이 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border">
            {myPublished.map((post) => (
              <li key={post.id} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-fg text-sm">{post.title}</p>
                  <p className="mt-0.5 text-fg-muted text-xs">
                    {formatDate(post.publishedAt)} 발행
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <DeletePostButton postId={post.id} published={true} />
                  <Link
                    href={`/posts/${post.slug}`}
                    className="text-fg-muted text-xs transition-colors hover:text-fg"
                  >
                    보기
                  </Link>
                  <Link
                    href={`/edit/${post.slug}`}
                    className="rounded border border-border px-3 py-1 text-fg-muted text-xs transition-colors hover:text-fg"
                  >
                    수정
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* 시리즈 관리 */}
      <section className="mt-12">
        <h2 className="mb-4 font-medium text-fg-muted text-xs uppercase tracking-[0.06em]">
          시리즈 관리 ({allSeries.length})
        </h2>

        {allSeries.length === 0 ? (
          <p className="py-6 text-fg-muted text-sm">시리즈가 없습니다.</p>
        ) : (
          <ul className="divide-y divide-border">
            {allSeries.map((s) => (
              <li key={s.id} className="flex items-center justify-between gap-4 py-4">
                <div className="min-w-0">
                  <p className="truncate font-medium text-fg text-sm">{s.title}</p>
                  <p className="mt-0.5 text-fg-muted text-xs">{s.postCount}개의 글</p>
                </div>
                <DeleteSeriesButton
                  seriesId={s.id}
                  title={s.title}
                  postCount={s.postCount}
                />
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
