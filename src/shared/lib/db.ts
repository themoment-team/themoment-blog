import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { pgSchema } from "drizzle-orm/pg-core";

const sql = neon(process.env.DATABASE_URL!);

export const db = drizzle(sql);
export const blog = pgSchema("blog");
