import Link from 'next/link';
import { Search, Menu, Radio } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6">
        {/* Top bar (Trending/Date) */}
        <div className="hidden border-b py-2 text-xs font-medium md:flex justify-between items-center text-muted-foreground tracking-wider">
          <div className="flex gap-4">
            <span className="font-bold text-primary">WOW3D 미디어:</span>
            <Link href="/" className="hover:text-foreground">차세대 슬라이싱 기술</Link>
            <Link href="/" className="hover:text-foreground">제너레이티브 디자인 2.0</Link>
          </div>
          <div className="font-bold">{new Date().toLocaleDateString('ko-KR', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
        </div>

        <div className="flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-black tracking-tighter text-primary flex items-center">
                3D<span className="text-secondary-foreground font-light">프린팅</span>타임즈
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-8 text-sm font-black tracking-widest uppercase text-muted-foreground/60">
              <Link href="/" className="transition-colors hover:text-primary text-primary">
                최신 기술 뉴스
              </Link>
              <Link href="/" className="transition-colors hover:text-primary">
                칼럼 & 인사이트
              </Link>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-accent rounded-full transition-colors group">
              <Search className="w-5 h-5 group-hover:text-primary" />
            </button>
            <button className="md:hidden p-2 hover:bg-accent rounded-full transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:block">
               <Link href="/admin" className="text-xs font-black bg-primary text-primary-foreground px-6 py-2.5 rounded-full hover:shadow-lg transition-all active:scale-95 flex items-center gap-2">
                <Radio className="w-3 h-3 animate-pulse" />
                구독하기
               </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
