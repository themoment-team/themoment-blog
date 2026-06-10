import type { Metadata } from 'next';
import { getAllTags, TagCloud } from '@/features/post-view';

export const metadata: Metadata = { title: '태그' };

export default async function TagsPage() {
  const tags = await getAllTags();

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8">
        <h1 className="font-bold text-3xl text-fg leading-[1.1] tracking-[-0.03em]">태그</h1>
        <p className="mt-2 text-fg-muted text-sm">{tags.length}개의 태그</p>
      </div>

      {tags.length === 0 ? (
        <p className="text-fg-muted text-sm uppercase tracking-[0.06em]">태그가 없습니다</p>
      ) : (
        <TagCloud tags={tags} />
      )}
    </div>
  );
}
