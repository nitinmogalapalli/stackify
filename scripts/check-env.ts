import fg from "fast-glob";

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const projectRoot = path.resolve(process.cwd());

// ──────────────────────────────────────────────────────
// Load allowed environment variables
// ──────────────────────────────────────────────────────
const allowed = new Set<string>();

const loadTurboList = () => {
	const turboPath = path.join(projectRoot, "turbo.json");
	if (!existsSync(turboPath)) return;

	const turbo = JSON.parse(readFileSync(turboPath, "utf8"));
	for (const group of [turbo.globalEnv, turbo.globalPassThroughEnv]) {
		if (!Array.isArray(group)) continue;
		group.forEach((key: string) => {
			if (key && /^[A-Z0-9_]+$/.test(key)) allowed.add(key);
		});
	}
};

loadTurboList();

// ──────────────────────────────────────────────────────
// Scan source for process.env usage
// ──────────────────────────────────────────────────────
const files = fg.sync(["**/*.{js,ts,jsx,tsx}"], {
	cwd: projectRoot,
	absolute: true,
	ignore: [
		"**/node_modules/**",
		"**/dist/**",
		"**/build/**",
		"**/.next/**",
		"**/out/**",
		"alchemy.run.ts",
	],
});

const regex = /process\.env\.([A-Z0-9_]+)/g;
const regexAlt = /env\.([A-Z0-9_]+)/g;
const errors: { file: string; key: string; reason: string }[] = [];

for (const file of files) {
	const content = readFileSync(file, "utf8");
	const relativeFile = path.relative(projectRoot, file);
	const isClient =
		content.startsWith('"use client"') || content.startsWith("'use client'");

	for (const match of content.matchAll(regex)) {
		const key = match[1];

		// Error #1: undeclared variables anywhere
		if (!allowed.has(key)) {
			errors.push({
				file: relativeFile,
				key,
				reason: "undeclared",
			});
			continue;
		}

		// Error #2: Next.js rule — client files may only use NEXT_PUBLIC_*
		if (isClient && !key.startsWith("NEXT_PUBLIC_")) {
			errors.push({
				file: relativeFile,
				key,
				reason: "next_client_restriction",
			});
		}
	}

	for (const match of content.matchAll(regexAlt)) {
		const key = match[1];

		// Error #1: undeclared variables anywhere
		if (!allowed.has(key)) {
			errors.push({
				file: relativeFile,
				key,
				reason: "undeclared",
			});
			continue;
		}

		// Error #2: Next.js rule — client files may only use NEXT_PUBLIC_*
		if (isClient && !key.startsWith("NEXT_PUBLIC_")) {
			errors.push({
				file: relativeFile,
				key,
				reason: "next_client_restriction",
			});
		}
	}
}

// ──────────────────────────────────────────────────────
// Result output
// ──────────────────────────────────────────────────────
if (errors.length > 0) {
	console.error("\n❌ Environment variable issues detected:\n");

	for (const err of errors) {
		if (err.reason === "undeclared") {
			console.error(`  • ${err.key}  →  ${err.file} (❌ undeclared)`);
		} else if (err.reason === "next_client_restriction") {
			console.error(
				`  • ${err.key}  →  ${err.file} (❌ not allowed in Client Component — must start with NEXT_PUBLIC_)`,
			);
		}
	}

	console.error(
		"\nDeclare them in turbo.json→globalEnv, or turbo.json→globalPassThroughEnv.\n" +
			"Next.js rule: Client components may ONLY access `NEXT_PUBLIC_*` env vars.\n",
	);
	process.exit(1);
}

console.log("✓ All environment variables are declared 🎉");
