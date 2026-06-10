import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) throw new Error('DATABASE_URL 환경변수가 설정되지 않았습니다');

export default defineConfig({
  schema: [
    './src/entities/post/model.ts',
    './src/entities/user/model.ts',
    './src/entities/tag/model.ts',
    './src/entities/series/model.ts',
  ],
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: databaseUrl,
  },
  schemaFilter: ['blog'],
});
