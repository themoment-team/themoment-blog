# Series + Tags + SEO Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 그순간 블로그에 시리즈 기능을 신규 추가하고, 태그 목록을 새 스펙으로 교체하며, SEO를 강화한다.

**Architecture:** 기존 FSD 레이어 구조 유지. `tb_series` 테이블 신규 추가 + `tb_posts`에 FK 컬럼 추가. 시리즈 읽기 로직은 `features/post-view/api`, 쓰기 로직은 `features/post-editor/api`에 병합. SEO는 Next.js 내장 API(Metadata, sitemap, robots) 활용.

**Tech Stack:** Next.js 16 App Router, Drizzle ORM (Neon PostgreSQL), Tailwind CSS v4, TypeScript strict

**Branch:** `feature/series-tags-seo`

---

## 파일 구조 맵

### 신규 생성
- `src/entities/series/model.ts` — tb_series Drizzle 스키마
- `src/entities/series/index.ts` — 엔티티 exports
- `src/features/post-view/ui/series-nav.tsx` — 시리즈 네비게이션 컴포넌트
- `src/app/api/series/route.ts` — GET /api/series, POST /api/series
- `src/app/api/series/[slug]/route.ts` — GET /api/series/[slug]
- `src/app/(blog)/series/page.tsx` — 시리즈 목록 페이지
- `src/app/(blog)/series/[slug]/page.tsx` — 시리즈 상세 페이지
- `src/features/post-view/ui/json-ld.tsx` — JSON-LD BlogPosting 컴포넌트
- `src/app/sitemap.ts` — 동적 sitemap.xml
- `src/app/robots.ts` — robots.txt
- `src/app/rss.xml/route.ts` — RSS 2.0 피드
- `scripts/seed-tags.mjs` — 새 태그 DB 시딩 스크립트

### 수정
- `src/shared/config/tags.ts` — ALLOWED_TAGS 새 목록으로 교체
- `src/entities/post/model.ts` — series_id, series_order 컬럼 추가
- `drizzle.config.ts` — series 스키마 경로 추가
- `src/features/post-view/api.ts` — getPublishedPosts에 tags 포함, series 조회 함수 추가
- `src/features/post-view/index.ts` — 신규 exports 추가
- `src/features/post-editor/api.ts` — upsertSeries, createPost/updatePost에 series 처리 추가
- `src/features/post-editor/index.ts` — 신규 exports 추가
- `src/features/post-editor/ui/publish-modal.tsx` — 시리즈 선택 UI 추가
- `src/app/(blog)/posts/[slug]/page.tsx` — SeriesNav + JSON-LD + 강화된 메타데이터
- `src/app/(blog)/posts/page.tsx` — PostCard에 tags 전달
- `src/app/page.tsx` — PostCard에 tags 전달

---

## Task 1: 태그 상수 교체

**Files:**
- Modify: `src/shared/config/tags.ts`

- [ ] **Step 1: ALLOWED_TAGS를 새 스펙으로 교체**

```ts
// src/shared/config/tags.ts
export const ALLOWED_TAGS = [
  "Frontend",
  "Backend",
  "DevOps",
  "AI",
  "Mobile",
  "Database",
  "Infra",
  "Project",
  "Career",
  "ETC",
] as const;

export type AllowedTag = (typeof ALLOWED_TAGS)[number];
```

- [ ] **Step 2: 빌드 에러 없음 확인**

```bash
pnpm run build 2>&1 | grep -E "error|Error" | head -20
```

Expected: 에러 없음 (PublishModal이 AllowedTag를 그대로 사용하므로 타입 호환)

- [ ] **Step 3: 태그 시딩 스크립트 작성**

```js
// scripts/seed-tags.mjs
import { neon } from "@neondatabase/serverless";
import "dotenv/config";

const sql = neon(process.env.DATABASE_URL);

const NEW_TAGS = [
  { name: "Frontend", slug: "frontend" },
  { name: "Backend", slug: "backend" },
  { name: "DevOps", slug: "devops" },
  { name: "AI", slug: "ai" },
  { name: "Mobile", slug: "mobile" },
  { name: "Database", slug: "database" },
  { name: "Infra", slug: "infra" },
  { name: "Project", slug: "project" },
  { name: "Career", slug: "career" },
  { name: "ETC", slug: "etc" },
];

for (const tag of NEW_TAGS) {
  await sql`
    INSERT INTO blog.tb_tags (id, name, slug)
    VALUES (gen_random_uuid(), ${tag.name}, ${tag.slug})
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  `;
  console.log(`✓ ${tag.name}`);
}
console.log("태그 시딩 완료");
```

- [ ] **Step 4: 시딩 스크립트 실행**

```bash
pnpm dotenv-cli -e .env.local -- node scripts/seed-tags.mjs
```

Expected:
```
✓ Frontend
✓ Backend
✓ DevOps
✓ AI
✓ Mobile
✓ Database
✓ Infra
✓ Project
✓ Career
✓ ETC
태그 시딩 완료
```

- [ ] **Step 5: 커밋**

```bash
git add src/shared/config/tags.ts scripts/seed-tags.mjs
git commit -m "update: 태그 목록 새 스펙으로 교체 및 시딩 스크립트 추가"
```

---

## Task 2: 포스트 목록에 태그 포함

`getPublishedPosts`가 현재 태그를 반환하지 않아 PostCard에 태그가 표시되지 않는 문제 해결.

**Files:**
- Modify: `src/features/post-view/api.ts`
- Modify: `src/app/page.tsx`
- Modify: `src/app/(blog)/posts/page.tsx`

- [ ] **Step 1: `getPublishedPosts`에 태그 포함 (2-query 방식)**

`src/features/post-view/api.ts`의 `getPublishedPosts` 함수 교체:

```ts
export async function getPublishedPosts(
  limit = 20,
  offset = 0,
  sort: PostSortKey = "latest",
  tag?: string,
) {
  const likeCountExpr = sql<number>`(select count(*) from ${likes} where ${likes.postId} = ${posts.id})`;

  const orderExpr =
    sort === "views"
      ? desc(posts.viewCount)
      : sort === "likes"
        ? desc(likeCountExpr)
        : desc(posts.publishedAt);

  const tagSubquery = tag
    ? inArray(
        posts.id,
        db
          .select({ id: postTags.postId })
          .from(postTags)
          .innerJoin(tags, eq(postTags.tagId, tags.id))
          .where(eq(tags.slug, tag)),
      )
    : undefined;

  const whereClause = tagSubquery
    ? and(eq(posts.published, true), tagSubquery)
    : eq(posts.published, true);

  const postList = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      excerpt: posts.excerpt,
      coverImage: posts.coverImage,
      viewCount: posts.viewCount,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      author: { id: users.id, name: users.name },
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(whereClause)
    .orderBy(orderExpr)
    .limit(limit)
    .offset(offset);

  if (postList.length === 0) return postList.map((p) => ({ ...p, tags: [] as { name: string; slug: string }[] }));

  const postIds = postList.map((p) => p.id);
  const allTagRows = await db
    .select({ postId: postTags.postId, name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(inArray(postTags.postId, postIds));

  const tagsByPost = new Map<string, { name: string; slug: string }[]>();
  for (const row of allTagRows) {
    const arr = tagsByPost.get(row.postId) ?? [];
    arr.push({ name: row.name, slug: row.slug });
    tagsByPost.set(row.postId, arr);
  }

  return postList.map((p) => ({ ...p, tags: tagsByPost.get(p.id) ?? [] }));
}
```

- [ ] **Step 2: `src/app/page.tsx`에서 PostCard에 tags 전달**

홈페이지의 `PostCard` 사용 부분에 `tags={post.tags}` 추가:

```tsx
{posts.map((post) => (
  <PostCard
    key={post.id}
    title={post.title}
    slug={post.slug}
    excerpt={post.excerpt}
    coverImage={post.coverImage}
    viewCount={post.viewCount}
    publishedAt={post.publishedAt}
    author={post.author}
    tags={post.tags}
  />
))}
```

- [ ] **Step 3: `src/app/(blog)/posts/page.tsx`에서 PostCard에 tags 전달**

```tsx
{postList.map((post) => (
  <PostCard
    key={post.id}
    title={post.title}
    slug={post.slug}
    excerpt={post.excerpt}
    coverImage={post.coverImage}
    viewCount={post.viewCount}
    publishedAt={post.publishedAt}
    author={post.author}
    tags={post.tags}
  />
))}
```

- [ ] **Step 4: 빌드 확인**

```bash
pnpm run build 2>&1 | tail -5
```

Expected: 에러 없이 빌드 성공

- [ ] **Step 5: 커밋**

```bash
git add src/features/post-view/api.ts src/app/page.tsx src/app/(blog)/posts/page.tsx
git commit -m "update: 포스트 목록에 태그 포함하여 PostCard에 표시"
```

---

## Task 3: 시리즈 DB 스키마

**Files:**
- Create: `src/entities/series/model.ts`
- Create: `src/entities/series/index.ts`
- Modify: `src/entities/post/model.ts`
- Modify: `drizzle.config.ts`

- [ ] **Step 1: `src/entities/series/model.ts` 작성**

```ts
import { blog } from "@shared/lib/db";
import { text, timestamp, uuid, varchar } from "drizzle-orm/pg-core";

export const series = blog.table("tb_series", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  description: text("description"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export type Series = typeof series.$inferSelect;
export type NewSeries = typeof series.$inferInsert;
```

- [ ] **Step 2: `src/entities/series/index.ts` 작성**

```ts
export { series, type Series, type NewSeries } from "./model";
```

- [ ] **Step 3: `src/entities/post/model.ts`에 series 컬럼 추가**

기존 파일에서 imports에 `integer` 확인 (이미 있음), 그리고 `series` import 추가:

```ts
import { series } from "@entities/series";
import { tags } from "@entities/tag";
import { users } from "@entities/user";
import { blog } from "@shared/lib/db";
import {
  boolean,
  integer,
  primaryKey,
  text,
  timestamp,
  unique,
  uuid,
  varchar,
} from "drizzle-orm/pg-core";

export const posts = blog.table("tb_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: varchar("title", { length: 500 }).notNull(),
  slug: varchar("slug", { length: 500 }).notNull().unique(),
  content: text("content").notNull(),
  excerpt: text("excerpt"),
  coverImage: text("cover_image"),
  authorId: uuid("author_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  seriesId: uuid("series_id").references(() => series.id, {
    onDelete: "set null",
  }),
  seriesOrder: integer("series_order"),
  viewCount: integer("view_count").notNull().default(0),
  published: boolean("published").notNull().default(false),
  publishedAt: timestamp("published_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const postTags = blog.table(
  "tb_post_tags",
  {
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    tagId: uuid("tag_id")
      .notNull()
      .references(() => tags.id, { onDelete: "cascade" }),
  },
  (t) => [primaryKey({ columns: [t.postId, t.tagId] })],
);

export const likes = blog.table(
  "tb_likes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    postId: uuid("post_id")
      .notNull()
      .references(() => posts.id, { onDelete: "cascade" }),
    userId: uuid("user_id").references(() => users.id, {
      onDelete: "cascade",
    }),
    fingerprint: varchar("fingerprint", { length: 36 }).notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [unique().on(t.postId, t.fingerprint)],
);

export type Post = typeof posts.$inferSelect;
export type NewPost = typeof posts.$inferInsert;
export type Like = typeof likes.$inferSelect;
```

- [ ] **Step 4: `drizzle.config.ts`에 series 스키마 추가**

```ts
import { defineConfig } from "drizzle-kit";

export default defineConfig({
  schema: [
    "./src/entities/post/model.ts",
    "./src/entities/user/model.ts",
    "./src/entities/tag/model.ts",
    "./src/entities/series/model.ts",
  ],
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  schemaFilter: ["blog"],
});
```

- [ ] **Step 5: DB 스키마 반영 (Drizzle push)**

```bash
pnpm dotenv-cli -e .env.local -- pnpm drizzle-kit push
```

Expected: `tb_series` 테이블 생성, `tb_posts`에 `series_id`, `series_order` 컬럼 추가

- [ ] **Step 6: 빌드 확인**

```bash
pnpm run build 2>&1 | tail -5
```

- [ ] **Step 7: 커밋**

```bash
git add src/entities/series/ src/entities/post/model.ts drizzle.config.ts
git commit -m "add: 시리즈 엔티티 스키마 추가 및 포스트에 series FK 컬럼 추가"
```

---

## Task 4: 시리즈 읽기 API 함수

**Files:**
- Modify: `src/features/post-view/api.ts`
- Modify: `src/features/post-view/index.ts`

- [ ] **Step 1: `src/features/post-view/api.ts` 상단 imports에 series 추가**

기존 imports 다음에 추가:

```ts
import { series } from "@entities/series";
```

그리고 기존 `import { asc } from "drizzle-orm"` 추가 (현재 없으면):

```ts
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
```

- [ ] **Step 2: `getPostBySlug`에 seriesId, seriesOrder 포함되도록 확인**

`getPostBySlug`의 select 필드에 추가:

```ts
export async function getPostBySlug(slug: string) {
  const [post] = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      content: posts.content,
      excerpt: posts.excerpt,
      coverImage: posts.coverImage,
      viewCount: posts.viewCount,
      published: posts.published,
      publishedAt: posts.publishedAt,
      createdAt: posts.createdAt,
      updatedAt: posts.updatedAt,
      seriesId: posts.seriesId,
      seriesOrder: posts.seriesOrder,
      author: { id: users.id, name: users.name },
    })
    .from(posts)
    .innerJoin(users, eq(posts.authorId, users.id))
    .where(eq(posts.slug, slug))
    .limit(1);

  if (!post) return null;

  const postTagsData = await db
    .select({ id: tags.id, name: tags.name, slug: tags.slug })
    .from(postTags)
    .innerJoin(tags, eq(postTags.tagId, tags.id))
    .where(eq(postTags.postId, post.id));

  return { ...post, tags: postTagsData };
}
```

- [ ] **Step 3: 시리즈 조회 함수 3개 추가**

파일 하단(태그 섹션 다음)에 추가:

```ts
// ── 시리즈 ────────────────────────────────────────────────────────

export async function getAllSeries() {
  const allSeries = await db.select().from(series).orderBy(series.createdAt);

  const postCounts = await db
    .select({
      seriesId: posts.seriesId,
      count: sql<number>`cast(count(*) as int)`,
    })
    .from(posts)
    .where(and(eq(posts.published, true), sql`${posts.seriesId} is not null`))
    .groupBy(posts.seriesId);

  const countMap = new Map(postCounts.map((r) => [r.seriesId, r.count]));

  return allSeries.map((s) => ({ ...s, postCount: countMap.get(s.id) ?? 0 }));
}

export async function getSeriesBySlug(slug: string) {
  const [s] = await db
    .select()
    .from(series)
    .where(eq(series.slug, slug))
    .limit(1);
  return s ?? null;
}

export async function getSeriesWithPosts(seriesId: string) {
  const [s] = await db
    .select()
    .from(series)
    .where(eq(series.id, seriesId))
    .limit(1);
  if (!s) return null;

  const seriesPosts = await db
    .select({
      id: posts.id,
      title: posts.title,
      slug: posts.slug,
      seriesOrder: posts.seriesOrder,
    })
    .from(posts)
    .where(and(eq(posts.seriesId, seriesId), eq(posts.published, true)))
    .orderBy(asc(posts.seriesOrder));

  return { ...s, posts: seriesPosts };
}

export async function getSeriesNavData(postId: string, seriesId: string) {
  const seriesData = await getSeriesWithPosts(seriesId);
  if (!seriesData) return null;

  const idx = seriesData.posts.findIndex((p) => p.id === postId);
  const prevPost = idx > 0 ? seriesData.posts[idx - 1] : null;
  const nextPost = idx < seriesData.posts.length - 1 ? seriesData.posts[idx + 1] : null;

  return {
    series: { id: seriesData.id, title: seriesData.title, slug: seriesData.slug },
    posts: seriesData.posts,
    currentIndex: idx,
    prevPost,
    nextPost,
  };
}
```

- [ ] **Step 4: `src/features/post-view/index.ts`에 exports 추가**

```ts
export {
  addLike,
  getAllSeries,
  getAllTags,
  getDraftPosts,
  getLikeCount,
  getPostBySlug,
  getPostForEdit,
  getPostsByTag,
  getPublishedPosts,
  getSeriesBySlug,
  getSeriesNavData,
  getSeriesWithPosts,
  getTagBySlug,
  getTagIdsByNames,
  hasLiked,
  incrementViewCount,
  removeLike,
  type PostSortKey,
} from "./api";
export { LikeButton } from "./ui/like-button";
export { PostCard } from "./ui/post-card";
export { PostContent } from "./ui/post-content";
export { TableOfContents } from "./ui/table-of-contents";
export { TagBadge } from "./ui/tag-badge";
export { TagCloud } from "./ui/tag-cloud";
export { ViewCounter } from "./ui/view-counter";
export { PostFilters } from "./ui/post-filters";
```

- [ ] **Step 5: 빌드 확인**

```bash
pnpm run build 2>&1 | tail -5
```

- [ ] **Step 6: 커밋**

```bash
git add src/features/post-view/api.ts src/features/post-view/index.ts
git commit -m "add: 시리즈 읽기 API 함수 추가 (getAllSeries, getSeriesNavData 등)"
```

---

## Task 5: 시리즈 쓰기 함수 + API 라우트

**Files:**
- Modify: `src/features/post-editor/api.ts`
- Modify: `src/features/post-editor/index.ts`
- Create: `src/app/api/series/route.ts`
- Create: `src/app/api/series/[slug]/route.ts`

- [ ] **Step 1: `src/features/post-editor/api.ts`에 series import 추가 및 함수 추가**

파일 상단 imports에 추가:

```ts
import { series } from "@entities/series";
```

그리고 파일 하단에 추가:

```ts
export async function upsertSeries(title: string): Promise<string> {
  const slug = title
    .toLowerCase()
    .replace(/[^a-z0-9가-힣]/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");

  const [existing] = await db
    .select({ id: series.id })
    .from(series)
    .where(eq(series.slug, slug))
    .limit(1);

  if (existing) return existing.id;

  const [created] = await db
    .insert(series)
    .values({ title, slug })
    .returning({ id: series.id });
  return created.id;
}
```

- [ ] **Step 2: `createPost`에 series 처리 추가**

`createPost` 함수 시그니처 및 구현 수정:

```ts
export async function createPost(data: {
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  coverImage?: string;
  authorId: string;
  published: boolean;
  tagNames?: string[];
  seriesTitle?: string;
  seriesOrder?: number;
}) {
  const { tagNames, seriesTitle, seriesOrder, ...postData } = data;

  let seriesId: string | null = null;
  if (seriesTitle?.trim()) {
    seriesId = await upsertSeries(seriesTitle.trim());
  }

  const [post] = await db
    .insert(posts)
    .values({
      ...postData,
      seriesId,
      seriesOrder: seriesId ? (seriesOrder ?? null) : null,
      publishedAt: postData.published ? new Date() : null,
    })
    .returning();

  if (tagNames?.length) {
    const tagIds = await getTagIdsByNames(tagNames);
    if (tagIds.length > 0) {
      await db
        .insert(postTags)
        .values(tagIds.map((tagId) => ({ postId: post.id, tagId })));
    }
  }

  return post;
}
```

- [ ] **Step 3: `updatePost`에 series 처리 추가**

```ts
export async function updatePost(
  postId: string,
  data: Partial<{
    title: string;
    content: string;
    excerpt: string;
    coverImage: string;
    published: boolean;
    tagNames: string[];
    seriesTitle: string | null;
    seriesOrder: number | null;
  }>,
) {
  const { tagNames, seriesTitle, seriesOrder, ...postData } = data;

  const updateData: Record<string, unknown> = {
    ...postData,
    updatedAt: new Date(),
  };

  if ("seriesTitle" in data) {
    if (seriesTitle) {
      updateData.seriesId = await upsertSeries(seriesTitle.trim());
      updateData.seriesOrder = seriesOrder ?? null;
    } else {
      updateData.seriesId = null;
      updateData.seriesOrder = null;
    }
  }

  if (postData.published === true) {
    updateData.publishedAt = new Date();
  }

  const [post] = await db
    .update(posts)
    .set(updateData)
    .where(eq(posts.id, postId))
    .returning();

  if (tagNames !== undefined) {
    await db.delete(postTags).where(eq(postTags.postId, postId));
    if (tagNames.length > 0) {
      const tagIds = await getTagIdsByNames(tagNames);
      if (tagIds.length > 0) {
        await db
          .insert(postTags)
          .values(tagIds.map((tagId) => ({ postId, tagId })));
      }
    }
  }

  return post;
}
```

- [ ] **Step 4: `src/features/post-editor/index.ts`에 upsertSeries export 추가**

```ts
export { createPost, deletePost, updatePost, upsertSeries } from "./api";
export { deletePostAction } from "./actions";
export { DeletePostButton } from "./ui/delete-post-button";
export { EditorToolbar } from "./ui/editor-toolbar";
export { MarkdownEditor } from "./ui/markdown-editor";
export { PublishModal } from "./ui/publish-modal";
```

- [ ] **Step 5: `src/app/api/series/route.ts` 작성**

```ts
import { auth } from "@features/auth/config";
import { upsertSeries } from "@features/post-editor";
import { getAllSeries } from "@features/post-view";
import { NextResponse } from "next/server";

export async function GET() {
  const allSeries = await getAllSeries();
  return NextResponse.json(allSeries);
}

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user.isMomentMember) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title } = await req.json();
  if (!title?.trim()) {
    return NextResponse.json({ error: "title required" }, { status: 400 });
  }

  const id = await upsertSeries(title.trim());
  return NextResponse.json({ id }, { status: 201 });
}
```

- [ ] **Step 6: `src/app/api/series/[slug]/route.ts` 작성**

```ts
import { getSeriesWithPosts } from "@features/post-view";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const data = await getSeriesWithPosts(
    (await import("@features/post-view/api").then((m) => m.getSeriesBySlug))(slug).then(
      (s) => s?.id ?? "",
    ),
  );

  // 더 직접적인 방법으로 재작성:
  return NextResponse.json(data ?? { error: "Not found" }, {
    status: data ? 200 : 404,
  });
}
```

위 Step 6를 다음으로 교체:

```ts
import { getSeriesBySlug, getSeriesWithPosts } from "@features/post-view";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;
  const s = await getSeriesBySlug(slug);
  if (!s) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const data = await getSeriesWithPosts(s.id);
  return NextResponse.json(data);
}
```

- [ ] **Step 7: API routes에서 posts/route.ts, posts/[slug]/route.ts에 series 필드 수용**

`src/app/api/posts/route.ts` POST 핸들러 body 파싱 업데이트:

```ts
const { title, slug, content, excerpt, coverImage, published, tagNames, seriesTitle, seriesOrder } = body;
```

그리고 createPost 호출에 추가:

```ts
const post = await createPost({
  title,
  slug,
  content,
  excerpt: excerpt || generateExcerpt(content),
  coverImage: coverImage ?? undefined,
  authorId: session.user.id,
  published: published ?? false,
  tagNames: validatedTagNames,
  seriesTitle: seriesTitle ?? undefined,
  seriesOrder: typeof seriesOrder === "number" ? seriesOrder : undefined,
});
```

`src/app/api/posts/[slug]/route.ts` PATCH 핸들러:

```ts
const { title, content, excerpt, coverImage, published, tagNames, seriesTitle, seriesOrder } = body;
```

그리고 updatePost 호출에 추가:

```ts
const updated = await updatePost(post.id, {
  title,
  content,
  excerpt: excerpt || (content ? generateExcerpt(content) : undefined),
  coverImage,
  published,
  tagNames: validatedTagNames,
  ...(("seriesTitle" in body) && {
    seriesTitle: seriesTitle ?? null,
    seriesOrder: typeof seriesOrder === "number" ? seriesOrder : null,
  }),
});
```

- [ ] **Step 8: 빌드 확인**

```bash
pnpm run build 2>&1 | tail -5
```

- [ ] **Step 9: 커밋**

```bash
git add src/features/post-editor/ src/app/api/series/ src/app/api/posts/
git commit -m "add: 시리즈 쓰기 API 함수 및 /api/series 라우트 추가"
```

---

## Task 6: SeriesNav UI 컴포넌트

**Files:**
- Create: `src/features/post-view/ui/series-nav.tsx`
- Modify: `src/features/post-view/index.ts`

- [ ] **Step 1: `src/features/post-view/ui/series-nav.tsx` 작성**

```tsx
import Link from "next/link";

interface SeriesPost {
  id: string;
  title: string;
  slug: string;
  seriesOrder: number | null;
}

interface SeriesNavProps {
  seriesTitle: string;
  seriesSlug: string;
  posts: SeriesPost[];
  currentPostId: string;
  prevPost: Pick<SeriesPost, "title" | "slug"> | null;
  nextPost: Pick<SeriesPost, "title" | "slug"> | null;
}

export function SeriesNav({
  seriesTitle,
  seriesSlug,
  posts,
  currentPostId,
  prevPost,
  nextPost,
}: SeriesNavProps) {
  return (
    <div className="border border-border rounded-lg p-5 space-y-4 bg-bg-subtle">
      {/* 시리즈 헤더 */}
      <div>
        <p className="text-[10px] font-medium uppercase tracking-label text-fg-muted mb-1">
          시리즈
        </p>
        <Link
          href={`/series/${seriesSlug}`}
          className="font-semibold text-fg hover:text-accent transition-colors"
        >
          {seriesTitle}
        </Link>
      </div>

      {/* 시리즈 글 목록 */}
      <ol className="space-y-1.5">
        {posts.map((post, i) => {
          const isCurrent = post.id === currentPostId;
          return (
            <li key={post.id} className="flex items-start gap-2.5">
              <span className="text-xs text-fg-muted mt-0.5 w-4 shrink-0 text-right">
                {i + 1}.
              </span>
              {isCurrent ? (
                <span className="text-sm font-medium text-accent">
                  {post.title}
                  <span className="ml-1.5 text-[10px] font-normal text-fg-muted">
                    ← 현재
                  </span>
                </span>
              ) : (
                <Link
                  href={`/posts/${post.slug}`}
                  className="text-sm text-fg-muted hover:text-fg transition-colors"
                >
                  {post.title}
                </Link>
              )}
            </li>
          );
        })}
      </ol>

      {/* 이전/다음 버튼 */}
      {(prevPost || nextPost) && (
        <div className="pt-3 border-t border-border flex justify-between gap-4">
          {prevPost ? (
            <Link
              href={`/posts/${prevPost.slug}`}
              className="flex-1 min-w-0 text-left group"
            >
              <p className="text-[10px] uppercase tracking-label text-fg-muted mb-0.5">
                이전 글
              </p>
              <p className="text-sm text-fg-muted group-hover:text-fg transition-colors truncate">
                ← {prevPost.title}
              </p>
            </Link>
          ) : (
            <div className="flex-1" />
          )}
          {nextPost && (
            <Link
              href={`/posts/${nextPost.slug}`}
              className="flex-1 min-w-0 text-right group"
            >
              <p className="text-[10px] uppercase tracking-label text-fg-muted mb-0.5">
                다음 글
              </p>
              <p className="text-sm text-fg-muted group-hover:text-fg transition-colors truncate">
                {nextPost.title} →
              </p>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `src/features/post-view/index.ts`에 SeriesNav export 추가**

```ts
export { SeriesNav } from "./ui/series-nav";
```

를 기존 exports 목록에 추가.

- [ ] **Step 3: 빌드 확인**

```bash
pnpm run build 2>&1 | tail -5
```

- [ ] **Step 4: 커밋**

```bash
git add src/features/post-view/ui/series-nav.tsx src/features/post-view/index.ts
git commit -m "add: SeriesNav 컴포넌트 추가 (시리즈 목록 + 이전/다음 글 네비게이션)"
```

---

## Task 7: 시리즈 페이지

**Files:**
- Create: `src/app/(blog)/series/page.tsx`
- Create: `src/app/(blog)/series/[slug]/page.tsx`

- [ ] **Step 1: `src/app/(blog)/series/page.tsx` 작성**

```tsx
import { getAllSeries } from "@features/post-view";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "시리즈" };

export default async function SeriesPage() {
  const allSeries = await getAllSeries();

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-[-0.03em] leading-[1.1] text-fg">
          시리즈
        </h1>
        <p className="mt-2 text-sm text-fg-muted">{allSeries.length}개의 시리즈</p>
      </div>

      {allSeries.length === 0 ? (
        <p className="text-fg-muted text-sm uppercase tracking-[0.06em]">
          시리즈가 없습니다
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {allSeries.map((s) => (
            <Link
              key={s.id}
              href={`/series/${s.slug}`}
              className="group border border-border rounded-lg p-5 hover:border-fg-muted transition-colors"
            >
              <h2 className="font-semibold text-fg group-hover:text-accent transition-colors">
                {s.title}
              </h2>
              {s.description && (
                <p className="mt-1 text-sm text-fg-muted line-clamp-2">
                  {s.description}
                </p>
              )}
              <p className="mt-3 text-xs text-fg-muted uppercase tracking-label">
                {s.postCount}개의 글
              </p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 2: `src/app/(blog)/series/[slug]/page.tsx` 작성**

```tsx
import { getSeriesBySlug, getSeriesWithPosts, PostCard } from "@features/post-view";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const s = await getSeriesBySlug(slug);
  return { title: s ? s.title : "시리즈" };
}

export default async function SeriesDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const s = await getSeriesBySlug(slug);
  if (!s) notFound();

  const data = await getSeriesWithPosts(s.id);
  const seriesPosts = data?.posts ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.06em] text-fg-muted mb-2">
          시리즈
        </p>
        <h1 className="text-3xl font-bold tracking-[-0.03em] leading-[1.1] text-fg">
          {s.title}
        </h1>
        {s.description && (
          <p className="mt-2 text-sm text-fg-muted">{s.description}</p>
        )}
        <p className="mt-3 text-sm text-fg-muted">{seriesPosts.length}개의 포스트</p>
      </div>

      {seriesPosts.length === 0 ? (
        <p className="text-fg-muted text-sm uppercase tracking-[0.06em]">
          포스트가 없습니다
        </p>
      ) : (
        <div>
          {seriesPosts.map((post, i) => (
            <div key={post.id} className="flex items-start gap-4">
              <span className="text-sm text-fg-muted mt-10 w-6 shrink-0 text-right font-mono">
                {i + 1}
              </span>
              <div className="flex-1 min-w-0">
                <PostCard
                  title={post.title}
                  slug={post.slug}
                  excerpt={undefined}
                  coverImage={undefined}
                  viewCount={0}
                  publishedAt={null}
                  author={{ name: "" }}
                  tags={[]}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

위 코드는 PostCard에 불필요한 props를 전달하므로, 시리즈 상세 페이지용으로 간단히 직접 링크 목록으로 수정:

```tsx
import { getSeriesBySlug, getSeriesWithPosts } from "@features/post-view";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const s = await getSeriesBySlug(slug);
  return { title: s ? s.title : "시리즈" };
}

export default async function SeriesDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const s = await getSeriesBySlug(slug);
  if (!s) notFound();

  const data = await getSeriesWithPosts(s.id);
  const seriesPosts = data?.posts ?? [];

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="mb-8">
        <p className="text-xs font-medium uppercase tracking-[0.06em] text-fg-muted mb-2">
          시리즈
        </p>
        <h1 className="text-3xl font-bold tracking-[-0.03em] leading-[1.1] text-fg">
          {s.title}
        </h1>
        {s.description && (
          <p className="mt-2 text-sm text-fg-muted">{s.description}</p>
        )}
        <p className="mt-3 text-sm text-fg-muted">{seriesPosts.length}개의 포스트</p>
      </div>

      {seriesPosts.length === 0 ? (
        <p className="text-fg-muted text-sm uppercase tracking-[0.06em]">
          포스트가 없습니다
        </p>
      ) : (
        <ol className="space-y-3">
          {seriesPosts.map((post, i) => (
            <li key={post.id} className="flex items-center gap-4 group border-b border-border py-4 last:border-none">
              <span className="text-sm text-fg-muted font-mono w-6 shrink-0 text-right">
                {i + 1}.
              </span>
              <Link
                href={`/posts/${post.slug}`}
                className="text-base font-medium text-fg group-hover:text-accent transition-colors"
              >
                {post.title}
              </Link>
            </li>
          ))}
        </ol>
      )}
    </div>
  );
}
```

- [ ] **Step 3: 빌드 확인**

```bash
pnpm run build 2>&1 | tail -5
```

- [ ] **Step 4: 커밋**

```bash
git add src/app/'(blog)'/series/
git commit -m "add: 시리즈 목록 및 상세 페이지 추가"
```

---

## Task 8: PublishModal에 시리즈 선택 UI

**Files:**
- Modify: `src/features/post-editor/ui/publish-modal.tsx`

- [ ] **Step 1: `publish-modal.tsx` 전체 교체**

```tsx
"use client";

import { ALLOWED_TAGS, type AllowedTag } from "@shared/config/tags";
import Image from "next/image";
import { useEffect, useState } from "react";

interface SeriesItem {
  id: string;
  title: string;
  slug: string;
}

interface PublishModalProps {
  title: string;
  content: string;
  slug?: string;
  onClose: () => void;
  onPublished: (slug: string) => void;
}

export function PublishModal({
  title,
  content,
  slug,
  onClose,
  onPublished,
}: PublishModalProps) {
  const [selectedTags, setSelectedTags] = useState<AllowedTag[]>([]);
  const [coverImage, setCoverImage] = useState("");
  const [uploading, setUploading] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [error, setError] = useState("");

  // 시리즈 관련 상태
  const [seriesList, setSeriesList] = useState<SeriesItem[]>([]);
  const [selectedSeriesId, setSelectedSeriesId] = useState<string>("");
  const [newSeriesTitle, setNewSeriesTitle] = useState("");
  const [seriesOrder, setSeriesOrder] = useState<string>("");
  const [isNewSeries, setIsNewSeries] = useState(false);

  useEffect(() => {
    fetch("/api/series")
      .then((r) => r.json())
      .then((data: SeriesItem[]) => setSeriesList(data))
      .catch(() => {});
  }, []);

  function toggleTag(tag: AllowedTag) {
    setSelectedTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag],
    );
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const fd = new FormData();
    fd.append("file", file);

    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data: { url?: string; error?: string } = await res.json();
      if (data.url) setCoverImage(data.url);
      else setError(data.error ?? "업로드 실패");
    } catch {
      setError("이미지 업로드에 실패했습니다");
    } finally {
      setUploading(false);
    }
  }

  async function handlePublish() {
    if (!title.trim() || !content.trim()) {
      setError("제목과 내용을 입력해주세요");
      return;
    }

    const seriesTitle = isNewSeries
      ? newSeriesTitle.trim()
      : seriesList.find((s) => s.id === selectedSeriesId)?.title ?? null;

    setPublishing(true);
    setError("");

    const newSlug =
      slug ??
      title
        .toLowerCase()
        .replace(/[^a-z0-9가-힣]/g, "-")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");

    const method = slug ? "PATCH" : "POST";
    const url = slug ? `/api/posts/${slug}` : "/api/posts";

    const body: Record<string, unknown> = {
      title,
      slug: newSlug,
      content,
      coverImage: coverImage || undefined,
      tagNames: selectedTags,
      published: true,
      seriesTitle: seriesTitle || null,
      seriesOrder: seriesOrder ? Number(seriesOrder) : null,
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const d: { error?: string } = await res.json();
        setError(d.error ?? "발행에 실패했습니다");
        return;
      }

      const d: { slug: string } = await res.json();
      onPublished(d.slug);
    } catch {
      setError("네트워크 오류가 발생했습니다");
    } finally {
      setPublishing(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-bg border border-border rounded-lg w-full max-w-md p-6 space-y-5 mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="font-bold tracking-[-0.02em] text-fg">포스트 발행</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-fg-muted hover:text-fg text-lg"
          >
            ✕
          </button>
        </div>

        {/* 태그 */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-fg-muted">
            태그
          </p>
          <div className="flex flex-wrap gap-2">
            {ALLOWED_TAGS.map((tag) => {
              const active = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                    active
                      ? "bg-fg text-bg border-fg"
                      : "border-border text-fg-muted hover:border-fg hover:text-fg"
                  }`}
                >
                  {tag}
                </button>
              );
            })}
          </div>
        </div>

        {/* 시리즈 */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-fg-muted">
            시리즈
          </p>
          <div className="flex gap-2 mb-2">
            <button
              type="button"
              onClick={() => { setIsNewSeries(false); setSelectedSeriesId(""); }}
              className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                !isNewSeries ? "bg-fg text-bg border-fg" : "border-border text-fg-muted hover:border-fg hover:text-fg"
              }`}
            >
              기존 시리즈
            </button>
            <button
              type="button"
              onClick={() => { setIsNewSeries(true); setSelectedSeriesId(""); }}
              className={`text-xs px-2.5 py-1 rounded border transition-colors ${
                isNewSeries ? "bg-fg text-bg border-fg" : "border-border text-fg-muted hover:border-fg hover:text-fg"
              }`}
            >
              새 시리즈
            </button>
          </div>

          {isNewSeries ? (
            <input
              type="text"
              placeholder="시리즈 제목 입력"
              value={newSeriesTitle}
              onChange={(e) => setNewSeriesTitle(e.target.value)}
              className="w-full text-sm border border-border rounded px-3 py-2 bg-bg text-fg placeholder:text-fg-muted focus:outline-none focus:border-fg-muted"
            />
          ) : (
            <select
              value={selectedSeriesId}
              onChange={(e) => setSelectedSeriesId(e.target.value)}
              className="w-full text-sm border border-border rounded px-3 py-2 bg-bg text-fg focus:outline-none focus:border-fg-muted"
            >
              <option value="">없음</option>
              {seriesList.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.title}
                </option>
              ))}
            </select>
          )}

          {(selectedSeriesId || (isNewSeries && newSeriesTitle)) && (
            <input
              type="number"
              placeholder="시리즈 내 순서 (예: 1)"
              min={1}
              value={seriesOrder}
              onChange={(e) => setSeriesOrder(e.target.value)}
              className="w-full text-sm border border-border rounded px-3 py-2 bg-bg text-fg placeholder:text-fg-muted focus:outline-none focus:border-fg-muted"
            />
          )}
        </div>

        {/* 커버 이미지 */}
        <div className="space-y-2">
          <p className="text-xs font-medium uppercase tracking-[0.06em] text-fg-muted">
            커버 이미지
          </p>
          {coverImage ? (
            <div className="relative">
              <Image
                src={coverImage}
                alt="커버 이미지"
                width={400}
                height={200}
                className="w-full h-36 object-cover rounded"
              />
              <button
                type="button"
                onClick={() => setCoverImage("")}
                className="absolute top-2 right-2 bg-black/60 text-white text-xs px-2 py-0.5 rounded hover:bg-black/80"
              >
                제거
              </button>
            </div>
          ) : (
            <label className="flex items-center justify-center border border-dashed border-border rounded h-24 cursor-pointer hover:bg-bg-subtle transition-colors text-sm text-fg-muted">
              {uploading ? "업로드 중..." : "이미지 선택"}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="sr-only"
                disabled={uploading}
              />
            </label>
          )}
        </div>

        {error && <p className="text-sm text-red-500">{error}</p>}

        <button
          type="button"
          onClick={handlePublish}
          disabled={publishing}
          className="w-full py-2.5 bg-fg text-bg text-sm font-medium rounded hover:opacity-80 transition-opacity disabled:opacity-50"
        >
          {publishing ? "발행 중..." : "지금 발행"}
        </button>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
pnpm run build 2>&1 | tail -5
```

- [ ] **Step 3: 커밋**

```bash
git add src/features/post-editor/ui/publish-modal.tsx
git commit -m "update: PublishModal에 시리즈 선택 UI 추가"
```

---

## Task 9: 포스트 상세 페이지에 SeriesNav 추가

**Files:**
- Modify: `src/app/(blog)/posts/[slug]/page.tsx`

- [ ] **Step 1: 포스트 상세 페이지에서 SeriesNav 렌더링**

`src/app/(blog)/posts/[slug]/page.tsx` 전체 교체:

```tsx
import {
  getLikeCount,
  getPostBySlug,
  getSeriesNavData,
  LikeButton,
  PostContent,
  SeriesNav,
  TableOfContents,
  TagBadge,
  ViewCounter,
} from "@features/post-view";
import { extractHeadings } from "@shared/lib/markdown";
import { SITE_URL } from "@shared/config/site";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPostBySlug(decodeURIComponent(slug));
  if (!post) return { title: "포스트를 찾을 수 없습니다" };

  const url = `${SITE_URL}/posts/${post.slug}`;

  return {
    title: post.title,
    description: post.excerpt ?? undefined,
    keywords: post.tags.map((t) => t.name),
    alternates: { canonical: url },
    openGraph: {
      title: post.title,
      description: post.excerpt ?? undefined,
      url,
      type: "article",
      publishedTime: post.publishedAt?.toISOString(),
      modifiedTime: post.updatedAt.toISOString(),
      authors: [post.author.name],
      images: post.coverImage ? [{ url: post.coverImage }] : [],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.excerpt ?? undefined,
      images: post.coverImage ? [post.coverImage] : [],
    },
  };
}

export const revalidate = 60;

export default async function PostPage({ params }: PageProps) {
  const { slug: rawSlug } = await params;
  const slug = decodeURIComponent(rawSlug);
  const post = await getPostBySlug(slug);

  if (!post || !post.published) notFound();

  const [headings, likeCount, seriesNav] = await Promise.all([
    Promise.resolve(extractHeadings(post.content)),
    getLikeCount(post.id),
    post.seriesId ? getSeriesNavData(post.id, post.seriesId) : null,
  ]);

  const dateStr = post.publishedAt
    ? new Intl.DateTimeFormat("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      }).format(new Date(post.publishedAt))
    : null;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt ?? "",
    author: { "@type": "Person", name: post.author.name },
    datePublished: post.publishedAt?.toISOString(),
    dateModified: post.updatedAt.toISOString(),
    url: `${SITE_URL}/posts/${post.slug}`,
    ...(post.coverImage && { image: post.coverImage }),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex gap-12 items-start">
          {/* 메인 콘텐츠 */}
          <article className="flex-1 min-w-0">
            {/* 헤더 */}
            <header className="mb-8 space-y-4">
              {post.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {post.tags.map((tag) => (
                    <TagBadge key={tag.id} name={tag.name} slug={tag.slug} />
                  ))}
                </div>
              )}

              <h1 className="text-4xl sm:text-5xl font-bold tracking-display leading-[1.0] text-fg">
                {post.title}
              </h1>

              <div className="flex items-center gap-3 text-sm text-fg-muted">
                <span>{post.author.name}</span>
                {dateStr && (
                  <>
                    <span className="opacity-40">·</span>
                    <span>{dateStr}</span>
                  </>
                )}
                <span className="opacity-40">·</span>
                <ViewCounter slug={slug} initialCount={post.viewCount} />
              </div>
            </header>

            {/* 시리즈 네비게이션 */}
            {seriesNav && (
              <div className="mb-8">
                <SeriesNav
                  seriesTitle={seriesNav.series.title}
                  seriesSlug={seriesNav.series.slug}
                  posts={seriesNav.posts}
                  currentPostId={post.id}
                  prevPost={seriesNav.prevPost}
                  nextPost={seriesNav.nextPost}
                />
              </div>
            )}

            {/* 커버 이미지 */}
            {post.coverImage && (
              <div className="mb-8 overflow-hidden rounded">
                <Image
                  src={post.coverImage}
                  alt={post.title}
                  width={800}
                  height={400}
                  className="w-full object-cover"
                  priority
                />
              </div>
            )}

            {/* 본문 */}
            <PostContent content={post.content} />

            {/* 푸터 액션 */}
            <div className="mt-10 pt-8 border-t border-border flex flex-col items-start gap-4">
              <LikeButton slug={slug} initialCount={likeCount} />
              <Link
                href="/posts"
                className="text-sm text-fg-muted hover:text-fg transition-colors uppercase tracking-label"
              >
                ← 목록
              </Link>
            </div>
          </article>

          {/* ToC 사이드바 (데스크톱) */}
          {headings.length > 0 && (
            <aside className="hidden lg:block flex-none w-56 sticky top-24">
              <TableOfContents headings={headings} />
            </aside>
          )}
        </div>

        {/* 모바일 ToC (접기/펼치기) */}
        {headings.length > 0 && (
          <details className="lg:hidden mt-6 border border-border rounded p-4">
            <summary className="text-xs font-medium uppercase tracking-label text-fg-muted cursor-pointer">
              목차
            </summary>
            <div className="mt-3">
              <TableOfContents headings={headings} />
            </div>
          </details>
        )}
      </div>
    </>
  );
}
```

- [ ] **Step 2: 빌드 확인**

```bash
pnpm run build 2>&1 | tail -5
```

- [ ] **Step 3: 커밋**

```bash
git add src/app/'(blog)'/posts/'[slug]'/page.tsx
git commit -m "update: 포스트 상세에 SeriesNav 추가 및 SEO 메타데이터 강화"
```

---

## Task 10: sitemap, robots, RSS

**Files:**
- Create: `src/app/sitemap.ts`
- Create: `src/app/robots.ts`
- Create: `src/app/rss.xml/route.ts`

- [ ] **Step 1: `src/app/sitemap.ts` 작성**

```ts
import { getPublishedPosts, getAllSeries, getAllTags } from "@features/post-view";
import { SITE_URL } from "@shared/config/site";
import type { MetadataRoute } from "next";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [posts, allSeries, tags] = await Promise.all([
    getPublishedPosts(1000),
    getAllSeries(),
    getAllTags(),
  ]);

  const postEntries: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/posts/${post.slug}`,
    lastModified: post.publishedAt ?? post.createdAt,
    changeFrequency: "weekly",
    priority: 0.8,
  }));

  const seriesEntries: MetadataRoute.Sitemap = allSeries.map((s) => ({
    url: `${SITE_URL}/series/${s.slug}`,
    changeFrequency: "weekly",
    priority: 0.6,
  }));

  const tagEntries: MetadataRoute.Sitemap = tags.map((t) => ({
    url: `${SITE_URL}/tags/${t.slug}`,
    changeFrequency: "weekly",
    priority: 0.5,
  }));

  return [
    { url: SITE_URL, changeFrequency: "daily", priority: 1.0 },
    { url: `${SITE_URL}/posts`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/series`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${SITE_URL}/tags`, changeFrequency: "weekly", priority: 0.6 },
    ...postEntries,
    ...seriesEntries,
    ...tagEntries,
  ];
}
```

- [ ] **Step 2: `src/app/robots.ts` 작성**

```ts
import { SITE_URL } from "@shared/config/site";
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/write", "/edit/", "/api/", "/login"],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
```

- [ ] **Step 3: `src/app/rss.xml/route.ts` 작성**

```ts
import { getPublishedPosts } from "@features/post-view";
import { SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@shared/config/site";

export const revalidate = 3600;

export async function GET() {
  const posts = await getPublishedPosts(50);

  const items = posts
    .map((post) => {
      const pubDate = post.publishedAt
        ? new Date(post.publishedAt).toUTCString()
        : new Date(post.createdAt).toUTCString();
      const link = `${SITE_URL}/posts/${post.slug}`;
      const excerpt = post.excerpt ? post.excerpt.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;") : "";
      return `
    <item>
      <title><![CDATA[${post.title}]]></title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <description><![CDATA[${excerpt}]]></description>
      <author>${post.author.name}</author>
      <pubDate>${pubDate}</pubDate>
    </item>`;
    })
    .join("");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title><![CDATA[${SITE_NAME}]]></title>
    <link>${SITE_URL}</link>
    <description><![CDATA[${SITE_DESCRIPTION}]]></description>
    <language>ko</language>
    <atom:link href="${SITE_URL}/rss.xml" rel="self" type="application/rss+xml" />
    ${items}
  </channel>
</rss>`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600",
    },
  });
}
```

- [ ] **Step 4: 빌드 확인**

```bash
pnpm run build 2>&1 | tail -10
```

Expected: 빌드 성공, sitemap/robots 라우트 포함

- [ ] **Step 5: 커밋**

```bash
git add src/app/sitemap.ts src/app/robots.ts src/app/rss.xml/
git commit -m "add: sitemap.xml, robots.txt, RSS 피드 추가"
```

---

## Task 11: 헤더 네비게이션에 시리즈 링크 추가

**Files:**
- Modify: `src/app/_components/header.tsx`

- [ ] **Step 1: header.tsx 확인 후 시리즈 링크 추가**

헤더에 시리즈 페이지 링크를 추가. 먼저 현재 헤더 구조 확인 후 수정.

`src/app/_components/header.tsx`를 읽고, 기존 nav 항목(예: "포스트", "태그") 근처에 `시리즈` 링크 추가:

```tsx
<Link href="/series" ...>시리즈</Link>
```

(기존 스타일과 일치하게 추가)

- [ ] **Step 2: 최종 전체 빌드 확인**

```bash
pnpm run build
```

Expected: 에러 없이 완전 성공

- [ ] **Step 3: 최종 커밋**

```bash
git add src/app/_components/header.tsx
git commit -m "update: 헤더에 시리즈 페이지 링크 추가"
```

---

## 스펙 커버리지 검증

| 요구사항 | 처리 |
|----------|------|
| 시리즈 내 순서 지정 | Task 3 (seriesOrder 컬럼), Task 5 (upsertSeries), Task 8 (PublishModal) |
| 게시글 작성 시 시리즈 선택 | Task 8 (PublishModal) |
| 시리즈 이름/목록/현재 위치 표시 | Task 6 (SeriesNav) |
| 이전 글 / 다음 글 버튼 | Task 6 (SeriesNav) |
| 고정형 태그 상수 관리 | Task 1 (ALLOWED_TAGS) |
| 태그 카드 표시 | Task 2 (getPublishedPosts + PostCard) |
| /tag/[slug] 페이지 | 기존 구현 유지 |
| title/description/keywords | Task 9 (generateMetadata) |
| openGraph | Task 9 |
| twitter card | Task 9 |
| canonical URL | Task 9 |
| JSON-LD BlogPosting | Task 9 (inline script) |
| sitemap.xml | Task 10 |
| robots.txt | Task 10 |
| RSS Feed | Task 10 |
| 시리즈 목록/상세 페이지 | Task 7 |
