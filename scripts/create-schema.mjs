import { neon } from "@neondatabase/serverless";

const sql = neon(process.env.DATABASE_URL);
await sql`CREATE SCHEMA IF NOT EXISTS blog`;
console.log("✓ blog 스키마 생성 완료");
