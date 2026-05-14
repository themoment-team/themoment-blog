import { getAllTags, TagCloud } from "@features/post-view";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "태그" };

export default async function TagsPage() {
  const tags = await getAllTags();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-[-0.03em] leading-[1.1] text-fg">
          태그
        </h1>
        <p className="mt-2 text-sm text-fg-muted">{tags.length}개의 태그</p>
      </div>

      {tags.length === 0 ? (
        <p className="text-fg-muted text-sm uppercase tracking-[0.06em]">
          태그가 없습니다
        </p>
      ) : (
        <TagCloud tags={tags} />
      )}
    </div>
  );
}
