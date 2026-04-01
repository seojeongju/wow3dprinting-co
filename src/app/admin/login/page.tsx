'use client';

export const runtime = 'edge';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { LogIn, Lock, Mail, Loader2, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch('/api/admin/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json() as any;
        throw new Error(data.message || '로그인에 실패했습니다.');
      }

      // 로그인 성공 시 메인 페이지로 리다이렉트
      router.push('/');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <Link href="/" className="mb-8 flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors text-sm font-bold tracking-widest uppercase">
        <ArrowLeft className="w-4 h-4" />
        뉴스 홈으로 돌아가기
      </Link>
      
      <div className="w-full max-w-md bg-card border rounded-3xl shadow-2xl overflow-hidden">
        <div className="p-8 md:p-12">
          <div className="flex flex-col items-center text-center mb-10">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-primary" />
            </div>
            <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 text-primary">운영 관리자 포털</h1>
            <p className="text-sm text-muted-foreground font-medium opacity-70 italic">글쓰기 및 권한 관리를 위해 로그인하세요.</p>
          </div>

          <form onSubmit={handleLogin} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-primary ml-1">관리자 이메일</label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@wow3d.co.kr"
                  className="w-full bg-muted border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary transition-all font-medium"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-widest text-primary ml-1">보안 비밀번호</label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-muted border-none rounded-2xl py-4 pl-12 pr-4 focus:ring-2 focus:ring-primary transition-all font-medium"
                  required
                />
              </div>
            </div>

            {error && (
              <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-sm font-bold text-center">
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full bg-primary text-primary-foreground font-black uppercase tracking-widest py-4 rounded-2xl hover:shadow-xl transition-all active:scale-95 flex items-center justify-center gap-2"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <>
                  <LogIn className="w-5 h-5" />
                  시스템 보안 인증 및 로그인
                </>
              )}
            </button>
          </form>
        </div>
        
        <div className="bg-muted/50 p-6 text-center border-t">
          <p className="text-xs text-muted-foreground font-medium">관리자 계정 분실 시 시스템 관리자에게 문의하세요.</p>
        </div>
      </div>
    </div>
  );
}
