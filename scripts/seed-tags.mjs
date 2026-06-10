import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL);

const NEW_TAGS = [
  { name: 'Frontend', slug: 'frontend' },
  { name: 'Backend', slug: 'backend' },
  { name: 'DevOps', slug: 'devops' },
  { name: 'AI', slug: 'ai' },
  { name: 'Mobile', slug: 'mobile' },
  { name: 'Database', slug: 'database' },
  { name: 'Infra', slug: 'infra' },
  { name: 'Project', slug: 'project' },
  { name: 'Career', slug: 'career' },
  { name: 'ETC', slug: 'etc' },
];

for (const tag of NEW_TAGS) {
  await sql`
    INSERT INTO blog.tb_tags (id, name, slug)
    VALUES (gen_random_uuid(), ${tag.name}, ${tag.slug})
    ON CONFLICT (slug) DO UPDATE SET name = EXCLUDED.name
  `;
  console.log(`✓ ${tag.name}`);
}
console.log('태그 시딩 완료');
