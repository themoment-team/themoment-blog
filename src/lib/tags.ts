import { desc, eq, sql } from "drizzle-orm";
import { db } from "./db";
import { postTags, tags } from "./db/schema";

export async function getAllTags() {
  return db
    .select({
      id: tags.id,
      name: tags.name,
      slug: tags.slug,
      count: sql<number>`cast(count(${postTags.postId}) as int)`,
    })
    .from(tags)
    .leftJoin(postTags, eq(tags.id, postTags.tagId))
    .groupBy(tags.id)
    .orderBy(desc(sql`count(${postTags.postId})`));
}

export async function getTagBySlug(slug: string) {
  const [tag] = await db
    .select()
    .from(tags)
    .where(eq(tags.slug, slug))
    .limit(1);
  return tag ?? null;
}

export async function findOrCreateTag(name: string): Promise<string> {
  const slug = name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9가-힣-]/g, "");

  const [existing] = await db
    .select({ id: tags.id })
    .from(tags)
    .where(eq(tags.name, name))
    .limit(1);

  if (existing) return existing.id;

  const [created] = await db
    .insert(tags)
    .values({ name, slug })
    .returning({ id: tags.id });

  return created.id;
}
