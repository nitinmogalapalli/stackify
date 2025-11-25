// import dotenv from "dotenv";

// dotenv.config({
// 	path: "../../apps/server/.env",
// });

import { neon, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import ws from "ws";

import { env } from "cloudflare:workers";

neonConfig.webSocketConstructor = ws;

// To work in edge environments (Cloudflare Workers, Vercel Edge, etc.), enable querying over fetch
// neonConfig.poolQueryViaFetch = true

const sql = neon(env.DATABASE_URL || "");
export const db = drizzle(sql);
