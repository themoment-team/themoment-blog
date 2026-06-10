'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import type { PostSortKey } from '../api';

interface TagItem {
  name: string;
  slug: string;
  count: number;
}

interface PostFiltersProps {
  currentSort: PostSortKey;
  currentTag?: string;
  tags: TagItem[];
}

export function PostFilters({ currentSort, currentTag, tags }: PostFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function update(patch: { sort?: PostSortKey; tag?: string | null }) {
    const params = new URLSearchParams(searchParams.toString());

    if ('sort' in patch) {
      if (patch.sort === 'latest') params.delete('sort');
      else if (patch.sort) params.set('sort', patch.sort);
    }
    if ('tag' in patch) {
      if (!patch.tag) params.delete('tag');
      else params.set('tag', patch.tag);
    }

    router.push(`?${params.toString()}`);
  }

  const activeTags = tags.filter((t) => t.count > 0);

  return (
    <div className="flex flex-col gap-3">
      {/* 태그 필터 */}
      {activeTags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => update({ tag: null })}
            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
              !currentTag
                ? 'border-fg bg-fg text-bg'
                : 'border-border text-fg-muted hover:border-fg-muted hover:text-fg'
            }`}
          >
            전체
          </button>
          {activeTags.map((tag) => (
            <button
              key={tag.slug}
              type="button"
              onClick={() => update({ tag: currentTag === tag.slug ? null : tag.slug })}
              className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                currentTag === tag.slug
                  ? 'border-fg bg-fg text-bg'
                  : 'border-border text-fg-muted hover:border-fg-muted hover:text-fg'
              }`}
            >
              {tag.name}
              <span className="ml-1 opacity-50">{tag.count}</span>
            </button>
          ))}
        </div>
      )}

      {/* 정렬 */}
      <div className="flex justify-end">
        <div className="relative inline-flex items-center">
          <select
            value={currentSort}
            onChange={(e) => update({ sort: e.target.value as PostSortKey })}
            className="cursor-pointer appearance-none rounded border border-border bg-bg py-1.5 pr-7 pl-2.5 text-fg-muted text-xs transition-colors hover:text-fg focus:border-fg-muted focus:outline-none"
          >
            <option value="latest">최신순</option>
            <option value="views">조회수순</option>
            <option value="likes">좋아요순</option>
          </select>
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="pointer-events-none absolute right-2 size-3 text-fg-muted"
            aria-hidden="true"
          >
            <path d="M6 9l6 6 6-6" />
          </svg>
        </div>
      </div>
    </div>
  );
}
