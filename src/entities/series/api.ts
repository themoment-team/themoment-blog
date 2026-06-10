import { eq } from 'drizzle-orm';
import { db } from '@/shared/lib/db';
import { series } from './model';

export async function getSeriesBySlug(slug: string) {
  const [s] = await db.select().from(series).where(eq(series.slug, slug)).limit(1);
  return s ?? null;
}
