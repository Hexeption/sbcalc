import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
  ...(isGitHubPages
    ? {
        output: "export",
        trailingSlash: true,
        basePath: "/sbcalc",
      }
    : {}),
};

export default nextConfig;
