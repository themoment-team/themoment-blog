import Image from 'next/image';
import Link from 'next/link';

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
    ? new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      }).format(new Date(publishedAt))
    : null;

  return (
    <article className="group border-border border-b py-8 last:border-none">
      <div className="flex items-start gap-6">
        <div className="min-w-0 flex-1 space-y-2">
          <Link href={`/posts/${slug}`} className="block">
            <h2 className="line-clamp-2 font-bold text-fg text-xl leading-tight tracking-heading transition-colors group-hover:text-accent">
              {title}
            </h2>
          </Link>

          {excerpt && (
            <p className="line-clamp-2 text-fg-muted text-sm leading-relaxed">
              {excerpt.replace(/<[^>]+>/g, '').trim()}
            </p>
          )}

          {tags && tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {tags.map((tag) => (
                <Link
                  key={tag.slug}
                  href={`/tags/${tag.slug}`}
                  className="font-medium text-[11px] text-fg-muted uppercase tracking-label transition-colors hover:text-accent"
                >
                  {tag.name}
                </Link>
              ))}
            </div>
          )}

          <div className="flex items-center gap-3 pt-1 text-fg-muted text-xs">
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
            className="h-20 w-28 flex-none overflow-hidden rounded sm:h-24 sm:w-36"
          >
            <Image
              src={coverImage}
              alt={title}
              width={144}
              height={96}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          </Link>
        )}
      </div>
    </article>
  );
}
