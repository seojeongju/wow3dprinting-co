import type { NextConfig } from "next";

let nextConfig: NextConfig = {
  images: {
    unoptimized: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
};


// setupDevPlatform은 로컬 개발 환경에서만 동적으로 적용되도록 검토하거나,
// 프로덕션 빌드 오류 방지를 위해 현재는 기본 설정을 유지합니다.
// Cloudflare Pages 프로덕션 환경에서는 플랫폼 바인딩이 런타임에 자동으로 주입됩니다.

export default nextConfig;
