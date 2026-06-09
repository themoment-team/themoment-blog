import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);

// tb_series 테이블 생성
await sql`
  CREATE TABLE IF NOT EXISTS blog.tb_series (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(500) NOT NULL,
    slug VARCHAR(500) NOT NULL UNIQUE,
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
  )
`;
console.log("✓ tb_series 테이블 생성");

// tb_posts에 series 컬럼 추가
await sql`
  ALTER TABLE blog.tb_posts
    ADD COLUMN IF NOT EXISTS series_id UUID REFERENCES blog.tb_series(id) ON DELETE SET NULL,
    ADD COLUMN IF NOT EXISTS series_order INTEGER
`;
console.log("✓ tb_posts에 series_id, series_order 컬럼 추가");

console.log("마이그레이션 완료");
