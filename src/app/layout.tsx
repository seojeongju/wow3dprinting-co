import type { Metadata } from "next";
import { Noto_Sans_KR, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Wow3dHeader from "@/components/Wow3dHeader";
import Footer from "@/components/Footer";
import { headers } from "next/headers";
import {
  buildOrganizationJsonLd,
  buildWebsiteJsonLd,
  getSiteContext,
  serializeJsonLd,
} from "@/lib/seo";

const NAVER_SITE_VERIFICATION = "98de0b1c5e16e3c096d8b3b7326f8aa42f4d123e";
const GOOGLE_SITE_VERIFICATION = {
  wow3d: process.env.GOOGLE_SITE_VERIFICATION_WOW3D,
  times: "0dyd_R-ICR2ROtT1Bs72Gxi3E7gjPl_qKonnS4ejJMw",
} as const;

const notoLines = Noto_Sans_KR({
  variable: "--font-noto-sans",
  subsets: ["latin"],
  weight: ["100", "300", "400", "500", "700", "900"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export async function generateMetadata(): Promise<Metadata> {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const { isWow3d, baseUrl, siteTitle, siteDescription, ogImage, alternateBaseUrl } =
    getSiteContext(host);

  const googleVerification = isWow3d
    ? GOOGLE_SITE_VERIFICATION.wow3d
    : GOOGLE_SITE_VERIFICATION.times;

  return {
    metadataBase: new URL(baseUrl),
    title: {
      default: isWow3d
        ? "와우3D프린팅타임즈 | 3D 프린팅 기술 인텔리전스 미디어"
        : "3D프린팅타임즈 | AI · 3D 프린팅 · 로보틱스 인텔리전스",
      template: `%s | ${siteTitle}`,
    },
    description: siteDescription,
    keywords: isWow3d
      ? [
          "3D 프린팅",
          "3D프린팅타임즈",
          "와우3D",
          "적층 제조",
          "3D 프린터",
          "FDM",
          "SLA",
          "3D printing Korea",
        ]
      : [
          "3D프린팅타임즈",
          "3D 프린팅",
          "AI",
          "로보틱스",
          "첨단 제조",
          "스마트 팩토리",
          "적층 제조",
        ],
    authors: [{ name: siteTitle, url: baseUrl }],
    creator: siteTitle,
    publisher: siteTitle,
    formatDetection: {
      email: false,
      address: false,
      telephone: false,
    },
    openGraph: {
      type: "website",
      locale: "ko_KR",
      url: baseUrl,
      siteName: siteTitle,
      title: isWow3d
        ? "와우3D프린팅타임즈 | 3D 프린팅 기술 인텔리전스 미디어"
        : "3D프린팅타임즈 | AI · 3D 프린팅 · 로보틱스 인텔리전스",
      description: siteDescription,
      images: [
        {
          url: ogImage,
          width: 1200,
          height: 630,
          alt: siteTitle,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: siteTitle,
      description: siteDescription,
      images: [ogImage],
    },
    verification: {
      ...(googleVerification ? { google: googleVerification } : {}),
      other: {
        "naver-site-verification": NAVER_SITE_VERIFICATION,
      },
    },
    alternates: {
      canonical: baseUrl,
      languages: {
        "ko-KR": baseUrl,
        ko: alternateBaseUrl,
        "x-default": baseUrl,
      },
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
  };
}

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const host = headersList.get("host") || "";
  const { isWow3d, baseUrl, siteTitle, siteDescription, ogImage } =
    getSiteContext(host);

  const orgJsonLd = buildOrganizationJsonLd({
    siteTitle,
    baseUrl,
    description: siteDescription,
    logoUrl: ogImage,
  });
  const websiteJsonLd = buildWebsiteJsonLd({
    siteTitle,
    baseUrl,
    description: siteDescription,
  });

  return (
    <html
      lang="ko"
      className={`${notoLines.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col font-sans"
        style={isWow3d ? { background: "#FFFFFF" } : undefined}
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: serializeJsonLd([orgJsonLd, websiteJsonLd]),
          }}
        />
        {isWow3d ? <Wow3dHeader /> : <Header />}
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
