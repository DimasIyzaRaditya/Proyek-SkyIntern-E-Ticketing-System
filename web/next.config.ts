import type { NextConfig } from "next";

const toPattern = (raw?: string) => {
  if (!raw) return null;
  try {
    const url = new URL(raw);
    return {
      protocol: url.protocol.replace(":", "") as "http" | "https",
      hostname: url.hostname,
      port: url.port,
      pathname: "/**",
    };
  } catch {
    return null;
  }
};

const envImagePatterns = [
  toPattern(process.env.NEXT_PUBLIC_API_BASE_URL),
  toPattern(process.env.NEXT_PUBLIC_MINIO_URL),
].filter(Boolean) as Array<{
  protocol: "http" | "https";
  hostname: string;
  port: string;
  pathname: string;
}>;

const nextConfig: NextConfig = {
  turbopack: {
    root: __dirname,
  },
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9000",
        pathname: "/skyintern/**",
      },
      {
        protocol: "http",
        hostname: "127.0.0.1",
        port: "9000",
        pathname: "/skyintern/**",
      },
      ...envImagePatterns,
    ],
  },
};

export default nextConfig;
