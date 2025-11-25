import type { BetterAuthOptions } from "better-auth";

import { expo } from "@better-auth/expo";
import { db } from "@repo/db";
import * as schema from "@repo/db/schema/auth";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";

import { env } from "cloudflare:workers";

export const auth = betterAuth<BetterAuthOptions>({
	database: drizzleAdapter(db, {
		provider: "pg",
		schema: schema,
	}),
	trustedOrigins: [env.CORS_ORIGIN || "", "stackify://", "exp://"],
	emailAndPassword: {
		enabled: true,
	},
	// uncomment cookieCache setting when ready to deploy to Cloudflare using *.workers.dev domains
	session: {
		cookieCache: {
			enabled: true,
			maxAge: 60,
		},
	},
	secret: env.BETTER_AUTH_SECRET,
	baseURL: env.BETTER_AUTH_URL,
	advanced: {
		defaultCookieAttributes: {
			sameSite: "none",
			secure: true,
			httpOnly: true,
		},
		disableOriginCheck: process.env.NODE_ENV === "development",
		// uncomment crossSubDomainCookies setting when ready to deploy and replace <your-workers-subdomain> with your actual workers subdomain
		// https://developers.cloudflare.com/workers/wrangler/configuration/#workersdev
		crossSubDomainCookies: {
			enabled: true,
			domain: ".mogalapallinitin-cloudflare.workers.dev",
		},
	},
	plugins: [expo()],
});
