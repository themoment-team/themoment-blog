import assert from 'node:assert/strict';
import test from 'node:test';
import { notifyPostPublished } from '../src/shared/lib/discord.ts';

test('발행한 글을 Discord 웹훅으로 전송한다', async () => {
  const originalFetch = globalThis.fetch;
  const originalWebhookUrl = process.env.DISCORD_WEBHOOK_URL;
  let request: { url: string; init?: RequestInit } | undefined;

  process.env.DISCORD_WEBHOOK_URL = 'https://discord.com/api/webhooks/test';
  globalThis.fetch = async (url, init) => {
    request = { url: String(url), init };
    return new Response(null, { status: 204 });
  };

  try {
    const excerpt = '가'.repeat(121);
    await notifyPostPublished({
      title: '웹훅 테스트',
      slug: 'webhook-test',
      authorName: '홍길동',
      excerpt,
      coverImage: 'https://res.cloudinary.com/example/image.jpg',
      seriesTitle: '웹 개발 기초',
      tagNames: ['React', 'Next.js'],
    });

    assert.equal(request?.url, process.env.DISCORD_WEBHOOK_URL);
    assert.equal(request?.init?.method, 'POST');
    assert.deepEqual(JSON.parse(String(request?.init?.body)), {
      username: '그순간',
      embeds: [
        {
          color: 5793266,
          author: {
            name: '그순간 기술블로그',
            url: 'http://localhost:3000',
          },
          title: '웹훅 테스트',
          url: 'http://localhost:3000/posts/webhook-test',
          description: `${excerpt.slice(0, 120)}…`,
          image: { url: 'https://res.cloudinary.com/example/image.jpg' },
          fields: [
            { name: '시리즈', value: '웹 개발 기초', inline: true },
            { name: '태그', value: '#React  #Next.js', inline: true },
          ],
          footer: { text: '홍길동 · 새 글 발행' },
        },
      ],
    });
  } finally {
    globalThis.fetch = originalFetch;
    if (originalWebhookUrl === undefined) delete process.env.DISCORD_WEBHOOK_URL;
    else process.env.DISCORD_WEBHOOK_URL = originalWebhookUrl;
  }
});
