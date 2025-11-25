import type { NextConfig } from "next";

import { initOpenNextCloudflareForDev } from "@opennextjs/cloudflare";

const nextConfig: NextConfig = {
	typedRoutes: true,
	experimental: {
		reactCompiler: true,
	},
};

export default nextConfig;

initOpenNextCloudflareForDev();
