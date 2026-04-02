import Link from 'next/link';
import { getSessionUser } from '@/lib/auth_edge';
import LogoutButton from './LogoutButton';
import { headers } from 'next/headers';
import { Mail, Phone, MapPin, ShieldCheck, Zap } from 'lucide-react';

export default async function Footer() {
  const user = await getSessionUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'editor';

  // host 헤더로 사이트 분기
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isWow3d = host.includes('wow3dprinting.com') && !host.includes('.co.kr');

  // 사이트별 발행 정보 (화이트 테마 최적화)
  const siteInfo = isWow3d
    ? {
        name: '와우3D프린팅타임즈',
        nameEn: 'Wow3D Printing Times',
        desc: '와우3D프린팅타임즈는 3D 프린팅 기술, 적층 제조 혁신, 미래 제조업의 흐름을 독자들에게 가장 빠르고 정확하게 전달합니다. 기술 중심의 세상을 위해 프리미엄 가치를 지향합니다.',
        address: '경북 구미시 산호대로 253 구미첨단의료기술타워 606호',
        regNumber: '경북,아00661',
        publisher: '김순희',
        youthManager: '김순희',
        regDate: '2021년 12월 15일',
        phone: '(+82) 54-464-3137',
        email: 'wow3d16@naver.com',
        copyright: '© 2021-2026 Wow3D Printing Times.',
        primaryColor: '#FF5D00',
        bgColor: '#FFFFFF',
        borderColor: '#F1F3F5',
        textColor: '#868E96',
        headingColor: '#212529',
        cardColor: '#F8F9FA',
      }
    : {
        name: '3D프린팅타임즈',
        nameEn: '3D Printing Times',
        desc: '3D프린팅타임즈는 적층 제조, 인공지능 혁신, 로봇 자동화의 미래를 독자들에게 가장 빠르고 정확하게 전달합니다. 기술 중심의 세상을 위해 복잡한 기술을 알기 쉽게 풀어냅니다.',
        address: '서울특별시 마포구 독막로93, 4층',
        regNumber: '서울, 아03616',
        publisher: '김순희',
        youthManager: '김순희',
        regDate: '2015년 3월 05일',
        phone: '(+82) 2-3144-3137',
        email: '3dcookiehd@naver.com',
        copyright: '© 2015-2026 3D Printing Times.',
        primaryColor: '#00D1FF',
        bgColor: '#FFFFFF',
        borderColor: '#F1F3F5',
        textColor: '#868E96',
        headingColor: '#212529',
        cardColor: '#F8F9FA',
      };

  return (
    <footer 
      className="w-full border-t py-16 md:py-24 transition-colors duration-500"
      style={{ background: siteInfo.bgColor, borderColor: siteInfo.borderColor }}
    >
      <div className="container mx-auto px-4 md:px-6 text-left">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-2 lg:grid-cols-5 mb-16">
          <div className="lg:col-span-2 flex flex-col gap-6">
            <Link href="/" className="flex items-center space-x-2">
              <span
                className="text-2xl font-black tracking-tighter"
                style={{ color: siteInfo.primaryColor }}
              >
                {isWow3d ? (
                  <>WOW<span className="text-black font-light group-hover:text-orange-500 transition-colors">3D</span> PRINTING</>
                ) : (
                  <>3D<span className="text-black font-light leading-none">프린팅</span>타임즈</>
                )}
              </span>
            </Link>
            <p className="text-sm leading-relaxed max-w-sm" style={{ color: siteInfo.textColor }}>
              {siteInfo.desc}
            </p>
            <div className="flex gap-3 items-center">
              {[ 'FB', 'IG', 'IN', 'YT'].map((s) => (
                <div
                  key={s}
                  className="w-9 h-9 rounded-xl flex items-center justify-center transition-all cursor-pointer hover:bg-gray-100 border border-gray-100"
                  style={{ background: siteInfo.cardColor }}
                >
                  <span className="text-[10px] font-black uppercase" style={{ color: siteInfo.textColor }}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-[11px] font-black tracking-[0.3em] uppercase italic" style={{ color: siteInfo.headingColor }}>
              Network
            </h4>
            <div className="flex flex-col gap-3 font-bold text-[13px]">
              <Link href="/" className="hover:text-orange-500 transition-colors" style={{ color: siteInfo.textColor }}>Intelligence</Link>
              <Link href="/" className="hover:text-orange-500 transition-colors" style={{ color: siteInfo.textColor }}>Case Studies</Link>
              <Link href="/" className="hover:text-orange-500 transition-colors" style={{ color: siteInfo.textColor }}>Industry Radar</Link>
              <Link href="/" className="hover:text-orange-500 transition-colors" style={{ color: siteInfo.textColor }}>Material Intel</Link>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-[11px] font-black tracking-[0.3em] uppercase italic" style={{ color: siteInfo.headingColor }}>
              Compliance
            </h4>
            <div className="flex flex-col gap-3 font-bold text-[13px]">
              <Link href="/policy/privacy" className="hover:text-orange-500 transition-colors" style={{ color: siteInfo.textColor }}>Privacy Policy</Link>
              <Link href="/policy/terms" className="hover:text-orange-500 transition-colors" style={{ color: siteInfo.textColor }}>Terms of Use</Link>
              <Link href={`mailto:${siteInfo.email}`} className="hover:text-orange-500 transition-colors" style={{ color: siteInfo.textColor }}>Contact Us</Link>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <h4 className="text-[11px] font-black tracking-[0.3em] uppercase italic" style={{ color: siteInfo.headingColor }}>
              Newsletter
            </h4>
            <div className="relative group">
              <input
                type="email"
                placeholder="EMAIL ADDRESS"
                className="w-full text-[10px] font-bold p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-[#FF5D00]/10 tracking-widest"
                style={{ color: siteInfo.headingColor }}
              />
              <button
                className="absolute right-2 top-2 p-2 bg-[#1A1A1E] text-white rounded-xl transition-all active:scale-95 hover:bg-[#FF5D00]"
              >
                <Zap className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[9px] font-bold uppercase tracking-widest leading-loose" style={{ color: siteInfo.textColor }}>
              JOIN THE CIRCLE OF TECH LEADERS.
            </p>
          </div>
        </div>

        {/* 법적 고지 레이어 (White Theme) */}
        <div className="pt-12 border-t" style={{ borderColor: siteInfo.borderColor }}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10 mb-12 opacity-80">
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest" style={{ color: siteInfo.headingColor }}>
                <MapPin className="w-3.5 h-3.5 text-[#FF5D00]" /> Publisher Info
              </div>
              <p className="text-[11px] font-medium leading-relaxed" style={{ color: siteInfo.textColor }}>
                제호: {siteInfo.name}<br />
                발행소: {siteInfo.address}<br />
                등록번호: {siteInfo.regNumber}
              </p>
            </div>
            <div className="flex flex-col gap-3">
               <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest" style={{ color: siteInfo.headingColor }}>
                <ShieldCheck className="w-3.5 h-3.5 text-[#FF5D00]" /> Operational Info
              </div>
              <p className="text-[11px] font-medium leading-relaxed" style={{ color: siteInfo.textColor }}>
                발행/편집인: {siteInfo.publisher}<br />
                청소년보호책임자: {siteInfo.youthManager}<br />
                등록/발행일: {siteInfo.regDate}
              </p>
            </div>
            <div className="flex flex-col gap-3">
               <div className="flex items-center gap-2 text-[10px] uppercase font-black tracking-widest" style={{ color: siteInfo.headingColor }}>
                <Mail className="w-3.5 h-3.5 text-[#FF5D00]" /> Support Line
              </div>
              <p className="text-[11px] font-medium leading-relaxed" style={{ color: siteInfo.textColor }}>
                전화: {siteInfo.phone}<br />
                이메일: {siteInfo.email}
              </p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-[10px] font-black tracking-[0.2em] uppercase" style={{ color: siteInfo.textColor }}>
              {siteInfo.copyright} All Information is Intel Property.
            </p>
            <div className="flex items-center gap-10">
              <span className="hidden lg:block text-[9px] font-bold uppercase tracking-widest opacity-30" style={{ color: siteInfo.textColor }}>
                Unauthorized data scraping is prohibited.
              </span>
              {isAdmin ? (
                <LogoutButton />
              ) : (
                <Link href="/admin/login" className="text-[10px] font-black uppercase tracking-[0.2em] px-5 py-2.5 rounded-lg border border-gray-100 hover:bg-gray-50 transition-all"
                  style={{ color: '#ADB5BD' }}>
                  Admin Core
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
