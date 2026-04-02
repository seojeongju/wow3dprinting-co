'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Loader2 } from 'lucide-react';

export default function LogoutButton() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);

  const handleLogout = async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const res = await fetch('/api/admin/auth', {
        method: 'DELETE',
      });

      if (res.ok) {
        // 로그아웃 성공 시 홈으로 이동하고 페이지 새로고침
        router.push('/');
        router.refresh();
      } else {
        const data = await res.json() as any;
        alert(data.message || '로그아웃 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('Logout failed:', error);
      alert('서버와 통신 중 리가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button
      onClick={handleLogout}
      disabled={isLoading}
      className="font-black text-primary hover:underline underline-offset-4 tracking-widest uppercase text-[10px] flex items-center gap-1"
    >
      {isLoading && <Loader2 className="w-3 h-3 animate-spin" />}
      [ 관리자 로그아웃 ]
    </button>
  );
}
