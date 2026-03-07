import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  async rewrites() {
    return [
      { source: "/api/users/:path*", destination: `${process.env.NEXT_PUBLIC_USER_SERVICE_URL || "http://localhost:3001"}/users/:path*` },
      { source: "/api/auth/:path*", destination: `${process.env.NEXT_PUBLIC_USER_SERVICE_URL || "http://localhost:3001"}/auth/:path*` },
      { source: "/api/questions-list", destination: `${process.env.NEXT_PUBLIC_QUESTION_SERVICE_URL || "http://localhost:8000"}/questions` },
      { source: "/api/questions-get/:title*", destination: `${process.env.NEXT_PUBLIC_QUESTION_SERVICE_URL || "http://localhost:8000"}/questions/:title*` },
      { source: "/api/questions-fetch", destination: `${process.env.NEXT_PUBLIC_QUESTION_SERVICE_URL || "http://localhost:8000"}/fetch` },
      { source: "/api/questions-upsert", destination: `${process.env.NEXT_PUBLIC_QUESTION_SERVICE_URL || "http://localhost:8000"}/upsert` },
      { source: "/api/questions-delete", destination: `${process.env.NEXT_PUBLIC_QUESTION_SERVICE_URL || "http://localhost:8000"}/delete` },
    ];
  },
};

export default nextConfig;
