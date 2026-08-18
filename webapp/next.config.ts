import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
	turbopack: {
		root: path.join(__dirname),
	},
	async rewrites() {
		return [
			{ source: "/faq", destination: "/supporto?view=faq" },
			{ source: "/istruzioni", destination: "/supporto?view=istruzioni" },
		];
	},
};

export default nextConfig;
