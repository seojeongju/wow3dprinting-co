import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t bg-muted/30 py-12 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="md:col-span-2 lg:col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-tighter text-primary">
                3D<span className="text-secondary-foreground font-light">프린팅</span>타임즈
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              3D프린팅타임즈는 적층 제조, 인공지능 혁신, 로봇 자동화의 미래를 독자들에게 가장 빠르고 정확하게 전달합니다. 기술 중심의 세상을 위해 복잡한 기술을 알기 쉽게 풀어냅니다.
            </p>
            <div className="flex gap-4 items-center">
              {/* Social icons placeholder */}
              <span className="w-5 h-5 bg-muted rounded-full"></span>
              <span className="w-5 h-5 bg-muted rounded-full"></span>
              <span className="w-5 h-5 bg-muted rounded-full"></span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold tracking-widest text-foreground">카테고리</h4>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">인공지능 (AI)</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">3D 프린팅</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">로보틱스</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">산업 리뷰</Link>
          </div>
          <div className="flex flex-col gap-3">
            <h4 className="text-sm font-bold tracking-widest text-foreground">고객센터</h4>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">회사 소개</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">개인정보처리방침</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">이용약관</Link>
            <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">광고 및 제휴</Link>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-bold tracking-widest text-foreground">뉴스레터 구독</h4>
            <p className="text-xs text-muted-foreground italic">최신 기술 동향을 이메일로 받아보세요.</p>
            <div className="flex gap-2">
              <input type="email" placeholder="이메일 주소" className="w-full text-xs p-2 bg-background border rounded-md focus:ring-1 focus:ring-primary outline-none" />
              <button className="text-xs font-bold bg-primary text-primary-foreground px-3 py-2 rounded-md hover:opacity-90">구독</button>
            </div>
          </div>
        </div>
        <div className="mt-12 border-t pt-8 flex flex-col gap-6 text-xs text-muted-foreground">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 border-b pb-6">
            <div className="flex flex-col gap-1">
              <p><span className="font-bold text-foreground">제호:</span> 3D프린팅타임즈</p>
              <p><span className="font-bold text-foreground">발행소:</span> 서울특별시 마포구 독막로93, 4층</p>
              <p><span className="font-bold text-foreground">등록번호:</span> 서울, 아03616</p>
            </div>
            <div className="flex flex-col gap-1">
              <p><span className="font-bold text-foreground">발행/편집인:</span> 김순희</p>
              <p><span className="font-bold text-foreground">청소년보호책임자:</span> 김순희</p>
              <p><span className="font-bold text-foreground">등록/발행일:</span> 2015년 3월 05일</p>
            </div>
            <div className="flex flex-col gap-1">
              <p><span className="font-bold text-foreground">전화:</span> (+82) 2-3144-3137</p>
              <p><span className="font-bold text-foreground">이메일:</span> 3dcookiehd@naver.com</p>
            </div>
          </div>
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© 2015-2026 3D Printing Times. All rights reserved.</p>
            <div className="flex gap-4 uppercase font-bold tracking-tighter">
              <span>본 사이트는 이메일주소를 무단수집하는 행위를 거부합니다.[법률 8486호]</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
