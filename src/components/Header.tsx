import Link from 'next/link';
import { Search, Menu, Radio, PlusCircle, Zap, Bell, Cpu, Monitor } from 'lucide-react';
import { getSessionUser } from '@/lib/auth_edge';

export default async function Header() {
  const user = await getSessionUser();
  const isAdmin = user?.role === 'admin' || user?.role === 'editor';

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4 md:px-6">
        {/* Top bar (Trending Ticker / Date) */}
        <div className="hidden border-b py-2.5 text-[10px] font-black uppercase tracking-[0.2em] md:flex justify-between items-center text-muted-foreground/60 overflow-hidden">
          <div className="flex items-center gap-6 overflow-hidden">
            <div className="flex items-center gap-2 text-primary shrink-0">
              <Zap className="w-3 h-3 fill-primary" />
              <span className="font-black italic">BREAKING TECH:</span>
            </div>
            <div className="flex gap-8 animate-in slide-in-from-right duration-1000 whitespace-nowrap overflow-hidden">
              <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <Cpu className="w-2.5 h-2.5 opacity-50" />
                적층 제조 AI 슬라이싱 혁신 실현
              </Link>
              <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <Monitor className="w-2.5 h-2.5 opacity-50" />
                엔비디아 젠슨 황, 산업용 로봇의 미래 발표
              </Link>
              <Link href="/" className="hover:text-primary transition-colors flex items-center gap-1.5">
                <Cpu className="w-2.5 h-2.5 opacity-50" />
                NASA 화성 거주지 3D 프린팅 프로젝트 완료 
              </Link>
            </div>
          </div>
          <div className="flex items-center gap-4 shrink-0 border-l pl-6 ml-6">
            <span className="opacity-40">{new Date().toLocaleDateString('ko-KR', { weekday: 'short', month: 'long', day: 'numeric' })}</span>
            <div className="flex items-center gap-1.5 text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              <span className="font-black italic">LIVE INTEL</span>
            </div>
          </div>
        </div>

        <div className="flex h-20 items-center justify-between py-4">
          <div className="flex items-center gap-10">
            <Link href="/" className="flex items-center space-x-2 group">
              <div className="flex items-center justify-center w-10 h-10 bg-primary/10 rounded-xl group-hover:bg-primary/20 transition-all">
                <span className="text-xl font-black text-primary">3D</span>
              </div>
              <span className="text-2xl font-black tracking-tighter text-foreground flex flex-col leading-none">
                PRINTING
                <span className="text-[10px] tracking-[0.4em] font-light text-primary/60">TIMES AI INTELLIGENCE</span>
              </span>
            </Link>
            
            <nav className="hidden lg:flex items-center gap-10 text-[11px] font-black tracking-[0.2em] uppercase text-muted-foreground">
              <Link href="/" className="transition-all hover:text-primary relative group">
                NEWS & FEED
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </Link>
              <Link href="/" className="transition-all hover:text-primary relative group">
                COLUMNS
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </Link>
              <Link href="/" className="transition-all hover:text-primary relative group">
                RESOURCES
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all group-hover:w-full" />
              </Link>
              {isAdmin && (
                <Link href="/admin" className="text-primary flex items-center gap-2 animate-pulse bg-primary/5 px-4 py-2 rounded-xl">
                  <PlusCircle className="w-3.5 h-3.5" />
                  POST ARTICLE
                </Link>
              )}
            </nav>
          </div>

          <div className="flex items-center gap-5">
            <div className="hidden md:flex items-center bg-muted/40 border border-muted-foreground/10 px-4 py-2 rounded-2xl gap-3 focus-within:ring-1 focus-within:ring-primary transition-all">
              <Search className="w-4 h-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="INTEL SEARCH..." 
                className="bg-transparent border-none text-[10px] font-black tracking-widest outline-none w-32 placeholder:text-muted-foreground/40"
              />
              <span className="text-[8px] bg-muted px-1.5 py-0.5 rounded border border-muted-foreground/20 font-mono">⌘K</span>
            </div>
            
            <button className="p-2.5 hover:bg-muted/60 rounded-xl transition-all relative">
              <Bell className="w-5 h-5 text-muted-foreground" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-primary rounded-full border-2 border-background" />
            </button>

            <button className="lg:hidden p-2.5 hover:bg-muted rounded-xl transition-colors">
              <Menu className="w-6 h-6" />
            </button>

            <div className="hidden lg:block">
              <Link href="/admin" className="text-[10px] font-black bg-primary text-primary-foreground px-8 py-3.5 rounded-2xl hover:shadow-[0_0_20px_rgba(var(--primary),0.3)] transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-primary/20">
                <Radio className="w-3.5 h-3.5 animate-pulse" />
                SUBSCRIBE PRO
              </Link>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
