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

export const metadata: Metadata = {
  title: "3D Printing Times | AI, 3D Printing & Robotics Intelligence",
  description: "The definitive source for advanced manufacturing, machine learning breakthroughs, and technological trends.",
};

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
