import Link from 'next/link';

export const runtime = 'edge';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 text-center">
      <div className="space-y-6 max-w-md">
        <h1 className="text-9xl font-black tracking-tighter text-primary/20">404</h1>
        <div className="space-y-2">
          <h2 className="text-3xl font-black uppercase tracking-tighter">Page Not Found</h2>
          <p className="text-muted-foreground font-medium italic">
            요청하신 페이지를 찾을 수 없습니다. 주소가 정확한지 확인해 주세요.
          </p>
        </div>
        <Link 
          href="/" 
          className="inline-flex h-12 items-center justify-center rounded-full bg-primary px-8 text-sm font-black uppercase tracking-widest text-primary-foreground shadow-lg transition-all hover:shadow-xl active:scale-95"
        >
          Back to Times
        </Link>
      </div>
    </div>
  );
}
