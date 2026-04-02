import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Wow3dHeader from "@/components/Wow3dHeader";
import Footer from "@/components/Footer";
import { headers } from "next/headers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
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
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body
        className="min-h-full flex flex-col"
        style={isWow3d ? { background: '#0F0500' } : undefined}
      >
        {/* 사이트별 헤더 분기 */}
        {isWow3d ? <Wow3dHeader /> : <Header />}
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
