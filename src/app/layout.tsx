import type { Metadata } from "next";
import { Noto_Sans_KR, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Wow3dHeader from "@/components/Wow3dHeader";
import Footer from "@/components/Footer";
import { headers } from "next/headers";

const notoLines = Noto_Sans_KR({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

// 사이트별 메타데이터 동적 생성
export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isWow3d = host.includes('wow3dprinting.com') && !host.includes('.co.kr');

  if (isWow3d) {
    // wow3dprinting.com 전용 메타데이터
    return {
      title: {
        default: '와우3D프린팅타임즈 | 3D 프린팅 기술 인텔리전스 미디어',
        template: '%s | 와우3D프린팅타임즈',
      },
      description: '국내 유일 프리미엄 3D 프린팅 전문 미디어. 최첨단 3D 프린팅 기술, 산업 동향, 장비 리뷰 및 제조 인텔리전스를 제공합니다.',
      keywords: ['3D 프린팅', '3D프린팅타임즈', '와우3D', '적층 제조', '3D 프린터', 'FDM', 'SLA', '3D printing Korea'],
      openGraph: {
        type: 'website',
        locale: 'ko_KR',
        url: 'https://wow3dprinting.com',
        siteName: '와우3D프린팅타임즈',
        title: '와우3D프린팅타임즈 | 3D 프린팅 기술 인텔리전스 미디어',
        description: '국내 유일 프리미엄 3D 프린팅 전문 미디어. 최첨단 3D 프린팅 기술 정보를 제공합니다.',
      },
      twitter: {
        card: 'summary_large_image',
        title: '와우3D프린팅타임즈',
        description: '국내 유일 프리미엄 3D 프린팅 전문 미디어.',
      },
      verification: {
        // 기존 네이버 인증 코드 (wow3dprinting.co.kr에서 이전)
        other: {
          'naver-site-verification': '98de0b1c5e16e3c096d8b3b7326f8aa42f4d123e',
        },
      },
      alternates: {
        canonical: 'https://wow3dprinting.com',
      },
    };
  }

  // wow3dprinting.co.kr (3D프린팅타임즈) 전용 메타데이터
  return {
    title: {
      default: '3D프린팅타임즈 | AI · 3D 프린팅 · 로보틱스 인텔리전스',
      template: '%s | 3D프린팅타임즈',
    },
    description: '첨단 제조 기술, 머신러닝 혁신, AI·3D 프린팅·로보틱스 최신 트렌드를 가장 먼저 전달하는 국내 최고의 기술 미디어입니다.',
    keywords: ['3D프린팅타임즈', '3D 프린팅', 'AI', '로보틱스', '첨단 제조', '스마트 팩토리', '적층 제조'],
    openGraph: {
      type: 'website',
      locale: 'ko_KR',
      url: 'https://wow3dprinting.co.kr',
      siteName: '3D프린팅타임즈',
      title: '3D프린팅타임즈 | AI · 3D 프린팅 · 로보틱스 인텔리전스',
      description: '첨단 제조 기술, 머신러닝 혁신, AI·3D 프린팅·로보틱스 최신 트렌드를 전달합니다.',
    },
    twitter: {
      card: 'summary_large_image',
      title: '3D프린팅타임즈',
      description: '첨단 제조 기술과 AI·3D 프린팅 인텔리전스 미디어.',
    },
    verification: {
      other: {
        'naver-site-verification': '98de0b1c5e16e3c096d8b3b7326f8aa42f4d123e',
      },
    },
    alternates: {
      canonical: 'https://wow3dprinting.co.kr',
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // host 헤더로 사이트 판별
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isWow3d = host.includes('wow3dprinting.com') && !host.includes('.co.kr');

  return (
    <html
      lang="ko"
      className={`${notoLines.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col font-sans"
        style={isWow3d ? { background: '#FFFFFF' } : undefined}
      >
        {/* 사이트별 헤더 분기 */}
        {isWow3d ? <Wow3dHeader /> : <Header />}
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
