import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // Paul's legal answers search the committed ERC passage index on the server
  outputFileTracingIncludes: { "/api/paul": ["./corpus/passages.json"] },
};

export default nextConfig;
