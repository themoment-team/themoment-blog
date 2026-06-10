import type { Metadata } from 'next';
import Link from 'next/link';
import { getAllSeries } from '@/entities/series';

export const metadata: Metadata = { title: '시리즈' };

export default async function SeriesPage() {
  const allSeries = await getAllSeries();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-bold text-3xl text-fg leading-[1.1] tracking-[-0.03em]">시리즈</h1>
        <p className="mt-2 text-fg-muted text-sm">{allSeries.length}개의 시리즈</p>
      </div>

      {allSeries.length === 0 ? (
        <p className="text-fg-muted text-sm uppercase tracking-[0.06em]">시리즈가 없습니다</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {allSeries.map((s) => (
            <Link
              key={s.id}
              href={`/series/${s.slug}`}
              className="group rounded-lg border border-border p-5 transition-colors hover:border-fg-muted"
            >
              <h2 className="font-semibold text-fg transition-colors group-hover:text-accent">
                {s.title}
              </h2>
              {s.description && (
                <p className="mt-1 line-clamp-2 text-fg-muted text-sm">{s.description}</p>
              )}
              <p className="mt-3 text-fg-muted text-xs uppercase tracking-label">
                {s.postCount}개의 글
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
