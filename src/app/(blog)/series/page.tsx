import { getAllSeries } from "@features/post-view";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "시리즈" };

export default async function SeriesPage() {
  const allSeries = await getAllSeries();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-[-0.03em] leading-[1.1] text-fg">
          시리즈
        </h1>
        <p className="mt-2 text-sm text-fg-muted">{allSeries.length}개의 시리즈</p>
      </div>

      {allSeries.length === 0 ? (
        <p className="text-fg-muted text-sm uppercase tracking-[0.06em]">
          시리즈가 없습니다
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {allSeries.map((s) => (
            <Link
              key={s.id}
              href={`/series/${s.slug}`}
              className="group border border-border rounded-lg p-5 hover:border-fg-muted transition-colors"
            >
              <h2 className="font-semibold text-fg group-hover:text-accent transition-colors">
                {s.title}
              </h2>
              {s.description && (
                <p className="mt-1 text-sm text-fg-muted line-clamp-2">
                  {s.description}
                </p>
              )}
              <p className="mt-3 text-xs text-fg-muted uppercase tracking-label">
                {s.postCount}개의 글
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
