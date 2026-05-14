import Image from "next/image";
import Link from "next/link";

interface PostCardProps {
  title: string;
  slug: string;
  excerpt?: string | null;
  coverImage?: string | null;
  viewCount: number;
  publishedAt?: Date | null;
  author: { name: string };
  tags?: Array<{ name: string; slug: string }>;
}

export function PostCard({
  title,
  slug,
  excerpt,
  coverImage,
  viewCount,
  publishedAt,
  author,
  tags,
}: PostCardProps) {
  const dateStr = publishedAt
    ? new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(publishedAt))
    : null;

  return (
    <article className="group border-b border-border py-8 last:border-none">
      <div className="flex gap-6 items-start">
        <div className="flex-1 min-w-0 space-y-2">
          <Link href={`/posts/${slug}`} className="block">
            <h2 className="text-xl font-bold tracking-[-0.03em] leading-[1.2] text-fg group-hover:text-accent transition-colors line-clamp-2">
              {title}
            </h2>
          </Link>

          {excerpt && (
            <p className="text-sm text-fg-muted leading-relaxed line-clamp-2">
              {excerpt}
            </p>
          )}

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/tags/${tag.slug}`}
                  className="text-[11px] font-medium uppercase tracking-[0.06em] text-fg-muted hover:text-accent transition-colors"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 text-xs text-fg-muted pt-1">
            <span>{author.name}</span>
            {dateStr && (
              <>
                <span className="opacity-40">·</span>
                <span>{dateStr}</span>
              </>
            )}
            <span className="opacity-40">·</span>
            <span>{viewCount.toLocaleString()} 조회</span>
          </div>
        </div>

        {coverImage && (
          <Link
            href={`/posts/${slug}`}
            className="flex-none w-28 h-20 sm:w-36 sm:h-24 overflow-hidden rounded"
          >
            <Image
              src={coverImage}
              alt={title}
              width={144}
              height={96}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </Link>
        )}
      </div>
    </article>
  );
}
