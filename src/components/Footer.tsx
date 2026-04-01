import Link from 'next/link';

export default function Footer() {
  return (
    <footer className="w-full border-t bg-muted/30 py-12 md:py-24">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-4 lg:grid-cols-5">
          <div className="md:col-span-2 lg:col-span-2 flex flex-col gap-4">
            <Link href="/" className="flex items-center space-x-2">
              <span className="text-xl font-black tracking-tighter text-primary">
                3D<span className="text-secondary-foreground font-light">PRINTING</span>TIMES
              </span>
            </Link>
            <p className="text-sm text-muted-foreground leading-relaxed max-w-sm">
              The 3D Printing Times informs and educates readers about the future of additive manufacturing, AI innovations, and robotic automation. Breaking down the complex for the tech-driven world.
            </p>
            <div className="flex gap-4 items-center">
                {/* Social icons placeholder */}
                <span className="w-5 h-5 bg-muted rounded-full"></span>
                <span className="w-5 h-5 bg-muted rounded-full"></span>
                <span className="w-5 h-5 bg-muted rounded-full"></span>
            </div>
          </div>
          <div className="flex flex-col gap-3">
             <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Categories</h4>
             <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">AI & ML</Link>
             <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">3D Printing</Link>
             <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Robotics</Link>
             <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Industry Reports</Link>
          </div>
          <div className="flex flex-col gap-3">
             <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Support</h4>
             <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">About Us</Link>
             <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Privacy Policy</Link>
             <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Terms of Service</Link>
             <Link href="#" className="text-sm text-muted-foreground hover:text-primary transition-colors">Contact</Link>
          </div>
          <div className="flex flex-col gap-4">
            <h4 className="text-sm font-bold uppercase tracking-widest text-foreground">Subscribe</h4>
            <p className="text-xs text-muted-foreground italic">Stay ahead with the tech-news digest.</p>
            <div className="flex gap-2">
               <input type="email" placeholder="Email Address" className="w-full text-xs p-2 bg-background border rounded-md focus:ring-1 focus:ring-primary outline-none" />
               <button className="text-xs font-bold bg-primary text-primary-foreground px-3 py-2 rounded-md hover:opacity-90">GO</button>
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
               <span>Powered by Cloudflare Pages & D1</span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
