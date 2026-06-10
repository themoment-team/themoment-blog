import type { MetadataRoute } from 'next';
import { getAllSeries } from '@/entities/series';
import { getAllTags, getPublishedPosts } from '@/features/post-view';
import { SITE_URL } from '@/shared/config/site';

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, allSeries, tags] = await Promise.all([
    getPublishedPosts(1000),
    getAllSeries(),
    getAllTags(),
  ]);

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/posts/${post.slug}`,
    lastModified: post.publishedAt ?? post.createdAt,
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  const seriesEntries: MetadataRoute.Sitemap = allSeries.map((s) => ({
    url: `${SITE_URL}/series/${s.slug}`,
    changeFrequency: 'weekly',
    priority: 0.6,
  }));

  const tagEntries: MetadataRoute.Sitemap = tags.map((t) => ({
    url: `${SITE_URL}/tags/${t.slug}`,
    changeFrequency: 'weekly',
    priority: 0.5,
  }));

  return [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1.0 },
    { url: `${SITE_URL}/posts`, changeFrequency: 'daily', priority: 0.9 },
    { url: `${SITE_URL}/series`, changeFrequency: 'weekly', priority: 0.7 },
    { url: `${SITE_URL}/tags`, changeFrequency: 'weekly', priority: 0.6 },
    ...postEntries,
    ...seriesEntries,
    ...tagEntries,
  ];
}
