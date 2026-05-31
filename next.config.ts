import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {
    root: process.cwd(),
  },
  async rewrites() {
    return [
      {
        source: "/dashboard",
        destination: "/",
      },
      {
        source: "/publications",
        destination: "/",
      },
      {
        source: "/calendar",
        destination: "/",
      },
      {
        source: "/add-publication",
        destination: "/",
      },
      {
        source: "/tasks",
        destination: "/",
      },
      {
        source: "/team",
        destination: "/",
      },
      {
        source: "/messages",
        destination: "/",
      },
      {
        source: "/notifications",
        destination: "/",
      },
      {
        source: "/settings",
        destination: "/",
      },
      {
        source: "/login",
        destination: "/",
      },
    ];
  },
};

export default nextConfig;
