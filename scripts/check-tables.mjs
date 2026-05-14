import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
const rows = await sql`
  SELECT table_name
  FROM information_schema.tables
  WHERE table_schema = 'blog'
  ORDER BY table_name
`;
console.log(`blog 스키마 테이블 (${rows.length}개):`);
rows.forEach((r) => console.log(" -", r.table_name));
