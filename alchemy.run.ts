import alchemy from "alchemy";
import { Nextjs, Worker } from "alchemy/cloudflare";
import { GitHubComment } from "alchemy/github";
import { CloudflareStateStore } from "alchemy/state";
import { config } from "dotenv";

config({ path: "./.env" });
config({ path: "./apps/web/.env" });
config({ path: "./apps/server/.env" });

const app = await alchemy("stackify", {
	stateStore: (scope) => new CloudflareStateStore(scope),
});

export const web = await Nextjs("web", {
	cwd: "apps/web",
	bindings: {
		NEXT_PUBLIC_SERVER_URL: process.env.NEXT_PUBLIC_SERVER_URL || "",
	},
	dev: {
		command: "pnpm run dev",
	},
});

export const server = await Worker("server", {
	cwd: "apps/server",
	entrypoint: "src/index.ts",
	compatibility: "node",
	bindings: {
		DATABASE_URL: alchemy.secret(process.env.DATABASE_URL),
		CORS_ORIGIN: process.env.CORS_ORIGIN || "",
		BETTER_AUTH_SECRET: alchemy.secret(process.env.BETTER_AUTH_SECRET),
		BETTER_AUTH_URL: process.env.BETTER_AUTH_URL || "",
	},
	dev: {
		port: 3000,
	},
});

console.log(`Web    -> ${web.url}`);
console.log(`Server -> ${server.url}`);

if (process.env.PULL_REQUEST) {
	const webPreviewUrl = web.url;
	const serverPreviewUrl = server.url;

	await GitHubComment("pr-preview-comment", {
		owner: process.env.GITHUB_REPOSITORY_OWNER || "nitinmogalapalli",
		repository: process.env.GITHUB_REPOSITORY_NAME || "stackify",
		issueNumber: Number(process.env.PULL_REQUEST),
		body: `
## 🚀 Preview Deployed

Your preview is ready!

**Web Preview URL:** ${webPreviewUrl}
**Server Preview URL:** ${serverPreviewUrl}

This preview was built from commit ${process.env.GITHUB_SHA}

---
<sub>🤖 This comment will be updated automatically when you push new commits to this PR.</sub>`,
	});
}

await app.finalize();
