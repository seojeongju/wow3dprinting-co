'use client';

import { useState } from 'react';
import { X, Save, Loader2, AlertCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface AdminEditorModalProps {
  article: any;
  onClose: () => void;
}

export default function AdminEditorModal({ article, onClose }: AdminEditorModalProps) {
  const [formData, setFormData] = useState({
    title: article.title,
    content: article.content,
    status: article.status,
    slug: article.slug,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        onClose();
        router.refresh();
      } else {
        const result = await res.json() as any;
        throw new Error(result.message || '수정에 실패했습니다.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-background/80 backdrop-blur-md animate-in fade-in duration-300 overflow-y-auto">
      <div className="w-full max-w-4xl bg-card border rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col my-auto max-h-none min-h-[500px]">
        <div className="p-6 border-b flex items-center justify-between bg-muted/30">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-primary rounded-xl flex items-center justify-center text-primary-foreground">
              <Save className="w-4 h-4" />
            </div>
            <h2 className="text-sm font-black uppercase tracking-widest text-primary">기사 인라인 편집 모드</h2>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 rounded-full hover:bg-muted flex items-center justify-center transition-colors font-bold"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSave} className="flex-1 overflow-y-auto p-8 space-y-8">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">기사 제목</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="w-full bg-muted/50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary transition-all font-bold"
                required
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">공개 상태 설정</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                className="w-full bg-muted/50 border-none rounded-2xl p-4 focus:ring-2 focus:ring-primary transition-all font-bold appearance-none cursor-pointer"
              >
                <option value="published">전체 공개 (Published)</option>
                <option value="draft">임시 저장 (Draft)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-primary ml-1">본문 내용 (마크다운 지원)</label>
            <textarea
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full bg-muted/50 border-none rounded-[2rem] p-6 focus:ring-2 focus:ring-primary transition-all font-mono text-sm leading-relaxed min-h-[400px] resize-y"
              required
            />
          </div>

          {error && (
            <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-2xl text-destructive text-xs font-bold flex items-center gap-3">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}
        </form>

        <div className="p-6 border-t bg-muted/20 flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-3 font-bold text-[11px] text-muted-foreground hover:text-foreground transition-colors"
          >
            변경 취소 (닫기)
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-[11px] hover:shadow-xl transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-primary/20"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <Save className="w-4 h-4" />
                기사 수정내용 저장하기
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
