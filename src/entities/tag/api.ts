import { inArray, eq } from 'drizzle-orm';
import { db } from '@/shared/lib/db';
import { tags } from './model';

export async function getTagBySlug(slug: string) {
  const [tag] = await db.select().from(tags).where(eq(tags.slug, slug)).limit(1);
  return tag ?? null;
}

export async function getTagIdsByNames(names: string[]): Promise<string[]> {
  if (names.length === 0) return [];
  const rows = await db.select({ id: tags.id }).from(tags).where(inArray(tags.name, names));
  return rows.map((r) => r.id);
}
