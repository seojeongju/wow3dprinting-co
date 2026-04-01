'use client';

import { useState } from 'react';
import { Edit3, Trash2, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import AdminEditorModal from './AdminEditorModal';

interface AdminActionsProps {
  article: any;
}

export default function AdminActions({ article }: AdminActionsProps) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    if (!confirm('정말로 이 기사를 삭제하시겠습니까? 이 작업은 되돌릴 수 없습니다.')) {
      return;
    }

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        alert('기사가 성공적으로 삭제되었습니다.');
        router.push('/');
        router.refresh();
      } else {
        const error = await res.json() as any;
        alert(`삭제 실패: ${error.message}`);
      }
    } catch (err) {
      alert('삭제 중 네트워크 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={() => setIsEditModalOpen(true)}
        className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-xl hover:-translate-y-0.5 transition-all active:scale-95 shadow-lg shadow-primary/20"
      >
        <Edit3 className="w-3.5 h-3.5" />
        Modify Content
      </button>

      <button
        onClick={handleDelete}
        disabled={isDeleting}
        className="flex items-center gap-2 px-6 py-3 bg-muted text-muted-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-destructive hover:text-destructive-foreground transition-all active:scale-95 disabled:opacity-50"
      >
        {isDeleting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <Trash2 className="w-3.5 h-3.5" />
        )}
        Delete
      </button>

      {isEditModalOpen && (
        <AdminEditorModal 
          article={article} 
          onClose={() => setIsEditModalOpen(false)} 
        />
      )}
    </div>
  );
}
