import { TagBadge } from "./TagBadge";

interface Tag {
  id: string;
  name: string;
  slug: string;
  count: number;
}

export function TagCloud({ tags }: { tags: Tag[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <TagBadge
          key={tag.id}
          name={tag.name}
          slug={tag.slug}
          count={tag.count}
        />
      ))}
    </div>
  );
}
