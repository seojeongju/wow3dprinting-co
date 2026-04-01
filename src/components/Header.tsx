import Link from 'next/link';
import { Search, Menu, Cpu, Printer, Radio } from 'lucide-react';

const CATEGORIES = [
  { name: '인공지능', href: '/category/ai-ml', icon: Cpu },
  { name: '3D 프린팅', href: '/category/3d-printing', icon: Printer },
  { name: '로보틱스', href: '/category/robotics', icon: Radio },
];

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6">
        {/* Top bar (Trending/Date) */}
        <div className="hidden border-b py-2 text-xs font-medium md:flex justify-between items-center text-muted-foreground tracking-wider">
          <div className="flex gap-4">
            <span className="font-bold">주요 소식:</span>
            <Link href="#" className="hover:text-foreground">차세대 슬라이싱 기술</Link>
            <Link href="#" className="hover:text-foreground">제너레이티브 디자인 2.0</Link>
          </div>
          <div>{new Date().toLocaleDateString('ko-KR', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}</div>
        </div>

        <div className="flex h-16 items-center justify-between py-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-2xl font-black tracking-tighter text-primary flex items-center">
                3D<span className="text-secondary-foreground font-light">프린팅</span>타임즈
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-6 text-sm font-bold tracking-widest">
              {CATEGORIES.map((cat) => (
                <Link
                  key={cat.name}
                  href={cat.href}
                  className="transition-colors hover:text-primary flex items-center gap-1.5"
                >
                  <cat.icon className="w-3.5 h-3.5" />
                  {cat.name}
                </Link>
              ))}
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <button className="p-2 hover:bg-accent rounded-full transition-colors">
              <Search className="w-5 h-5" />
            </button>
            <button className="md:hidden p-2 hover:bg-accent rounded-full transition-colors">
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:block">
               <Link href="/admin" className="text-xs font-bold bg-primary text-primary-foreground px-4 py-2 rounded-full hover:opacity-90 transition-opacity">
                구독하기
               </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
