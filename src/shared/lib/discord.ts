interface PublishedPost {
  title: string;
  slug: string;
  authorName: string;
  excerpt?: string | null;
  coverImage?: string | null;
  seriesTitle?: string;
  tagNames?: string[];
}

export async function notifyPostPublished({
  title,
  slug,
  authorName,
  excerpt,
  coverImage,
  seriesTitle,
  tagNames,
}: PublishedPost) {
  const webhookUrl = process.env.DISCORD_WEBHOOK_URL;
  if (!webhookUrl) return;

  const siteUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';
  const summary = excerpt?.trim();
  const description = summary
    ? summary.length > 120
      ? `${summary.slice(0, 120)}…`
      : summary
    : `${authorName} 님이 새 글을 발행했습니다.`;
  const fields = [
    ...(seriesTitle ? [{ name: '시리즈', value: seriesTitle, inline: true }] : []),
    ...(tagNames?.length
      ? [{ name: '태그', value: tagNames.map((tag) => `#${tag}`).join('  '), inline: true }]
      : []),
  ];

  try {
    const response = await fetch(webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        username: '그순간',
        avatar_url: `${siteUrl}/logo.png`,
        embeds: [
          {
            color: 5793266,
            author: { name: '그순간 기술블로그', url: siteUrl },
            title,
            url: `${siteUrl}/posts/${slug}`,
            description,
            ...(coverImage && { image: { url: coverImage } }),
            ...(fields.length && { fields }),
            footer: { text: `${authorName} · 새 글 발행` },
          },
        ],
      }),
    });

    if (!response.ok) console.error(`[discord] 웹훅 전송 실패: ${response.status}`);
  } catch (error) {
    console.error('[discord] 웹훅 전송 실패:', error);
  }
}
