import Link from 'next/link';
import { getSessionUser } from '@/lib/auth_edge';
import LogoutButton from './LogoutButton';
import { headers } from 'next/headers';

export default async function Footer() {
  const user = await getSessionUser();
  const isAdmin = user?.role === 'admin';

  // host 헤더로 사이트 분기
  const headersList = await headers();
  const host = headersList.get('host') || '';
  const isWow3d = host.includes('wow3dprinting.com') && !host.includes('.co.kr');

  // 사이트별 발행 정보
  const siteInfo = isWow3d
    ? {
        name: '와우3D프린팅타임즈',
        nameEn: 'Wow3D Printing Times',
        desc: '와우3D프린팅타임즈는 3D 프린팅 기술, 적층 제조 혁신, 미래 제조업의 흐름을 독자들에게 가장 빠르고 정확하게 전달합니다.',
        address: '경북 구미시 산호대로 253 구미첨단의료기술타워 606호',
        regNumber: '경북,아00661',
        publisher: '김순희',
        youthManager: '김순희',
        regDate: '2021년 12월 15일',
        phone: '(+82) 54-464-3137',
        email: 'wow3d16@naver.com',
        copyright: '© 2021-2026 Wow3D Printing Times.',
        primaryColor: '#F97316',
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
        primaryColor: undefined,
      };

  return (
    <footer className="w-full border-t bg-muted/30 py-12 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="md:col-span-2 lg:col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center space-x-2">
              <span
                className="text-xl font-black tracking-tighter"
                style={{ color: siteInfo.primaryColor }}
              >
                {isWow3d ? (
                  <>와우<span className="text-foreground font-light">3D프린팅</span>타임즈</>
                ) : (
                  <>3D<span className="text-secondary-foreground font-light">프린팅</span>타임즈</>
                )}
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              {siteInfo.desc}
            </p>
            <div className="flex gap-4 items-center">
              {['FB', 'IG', 'IN'].map((s) => (
                <div
                  key={s}
                  className="w-8 h-8 rounded-full bg-muted flex items-center justify-center transition-colors cursor-pointer"
                  style={{}}
                >
                  <span className="text-[10px] font-black uppercase">{s}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <h4
              className="text-sm font-bold tracking-widest text-foreground uppercase italic px-1 underline decoration-2 underline-offset-4 mb-2 w-fit"
              style={{ textDecorationColor: siteInfo.primaryColor }}
            >
              Quick Links
            </h4>
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">최신 기술 뉴스</Link>
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">칼럼 &amp; 인사이트</Link>
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">3D 프린팅 공정</Link>
            <Link href="/" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">산업 리뷰</Link>
          </div>

          <div className="flex flex-col gap-3">
            <h4
              className="text-sm font-bold tracking-widest text-foreground uppercase italic px-1 underline decoration-2 underline-offset-4 mb-2 w-fit"
              style={{ textDecorationColor: siteInfo.primaryColor }}
            >
              Support
            </h4>
            <Link href="/policy/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">개인정보처리방침</Link>
            <Link href="/policy/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">이용약관</Link>
            <Link href={`mailto:${siteInfo.email}`} className="text-sm text-muted-foreground hover:text-primary transition-colors font-medium">광고 및 제휴</Link>
          </div>

          <div className="flex flex-col gap-4">
            <h4
              className="text-sm font-bold tracking-widest text-foreground uppercase italic px-1 underline decoration-2 underline-offset-4 mb-2 w-fit"
              style={{ textDecorationColor: siteInfo.primaryColor }}
            >
              Newsletter
            </h4>
            <p className="text-xs text-muted-foreground italic">최신 기술 동향을 이메일로 가장 먼저 받아보세요.</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="이메일 주소"
                className="w-full text-xs p-2.5 bg-background border rounded-xl focus:ring-2 outline-none transition-all"
                style={{ ['--tw-ring-color' as any]: siteInfo.primaryColor }}
              />
              <button
                className="text-xs font-black px-4 py-2.5 rounded-xl transition-all active:scale-95 text-white"
                style={{ background: siteInfo.primaryColor || 'var(--color-primary)' }}
              >
                SUBSCRIBE
              </button>
            </div>
          </div>
        </div>

        {/* 발행 정보 */}
        <div className="mt-12 border-t pt-8 flex flex-col gap-6 text-xs text-muted-foreground">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 border-b pb-8 opacity-70">
            <div className="flex flex-col gap-1.5">
              <p><span className="font-bold text-foreground">제호:</span> {siteInfo.name}</p>
              <p><span className="font-bold text-foreground">발행소:</span> {siteInfo.address}</p>
              <p><span className="font-bold text-foreground">등록번호:</span> {siteInfo.regNumber}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p><span className="font-bold text-foreground">발행/편집인:</span> {siteInfo.publisher}</p>
              <p><span className="font-bold text-foreground">청소년보호책임자:</span> {siteInfo.youthManager}</p>
              <p><span className="font-bold text-foreground">등록/발행일:</span> {siteInfo.regDate}</p>
            </div>
            <div className="flex flex-col gap-1.5">
              <p><span className="font-bold text-foreground">전화:</span> {siteInfo.phone}</p>
              <p><span className="font-bold text-foreground">이메일:</span> {siteInfo.email}</p>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="font-medium tracking-tight">{siteInfo.copyright} All rights reserved.</p>
            <div className="flex items-center gap-6">
              <span className="hidden md:block opacity-50">본 사이트는 이메일주소 무단수집을 거부합니다. [법률 8486호]</span>
              {isAdmin ? (
                <LogoutButton />
              ) : (
                <Link href="/admin/login" className="font-black hover:underline underline-offset-4 tracking-widest uppercase text-[10px]"
                  style={{ color: siteInfo.primaryColor || 'var(--color-primary)' }}>
                  [ 관리자 로그인 ]
                </Link>
              )}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
