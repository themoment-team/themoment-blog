import { neon } from '@neondatabase/serverless';
import { drizzle } from 'drizzle-orm/neon-http';
import { pgSchema } from 'drizzle-orm/pg-core';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다');

const sql = neon(databaseUrl);

export const db = drizzle(sql);
export const blog = pgSchema('blog');
