'use client';

export const runtime = 'edge';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import AiToolbox from '@/components/AiToolbox';

interface Category {
  id: number;
  name: string;
}

export default function AdminPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    status: 'draft',
    password: '',
  });

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);

  // 카테고리 로딩 로직 삭제 (사용 안함)

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // 제목 입력 시 슬러그 자동 생성 (영어 소문자/숫자 및 하이픈 전환, 한국어는 인코딩 됨)
    if (name === 'title' && !formData.slug) {
      const autoSlug = value.toLowerCase().replace(/[^a-z0-9가-힣]+/g, '-').replace(/(^-|-$)+/g, '');
      setFormData((prev) => ({ ...prev, slug: autoSlug }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setThumbnailFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const data = new FormData();
      Object.entries(formData).forEach(([key, val]) => {
        data.append(key, val);
      });
      
      if (thumbnailFile) {
        data.append('thumbnail', thumbnailFile);
      }

      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        body: data,
      });

      const result = await res.json() as any;

      if (res.ok && result.success) {
        setSuccess('기사가 성공적으로 등록되었습니다! 메인 페이지로 이동합니다.');
        // 폼 초기화 (비밀번호 제외)
        setFormData({
          title: '',
          slug: '',
          content: '',
          status: 'draft',
          password: formData.password,
        });
        setThumbnailFile(null);
        
        setTimeout(() => {
          router.push('/');
        }, 2000);
      } else {
        setError(result.message || '기사 등록에 실패했습니다.');
      }
    } catch (err: any) {
      setError('서버와 통신 중 문제가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="container mx-auto px-4 py-8"><p>Loading categories...</p></div>;
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-black mb-8 border-b pb-4">기사 등록 대시보드</h1>
      
      {error && (
        <div className="bg-destructive/10 text-destructive p-4 rounded-md mb-6 font-bold text-sm">
          {error}
        </div>
      )}
      
      {success && (
        <div className="bg-green-50 text-green-700 p-4 rounded-md mb-6 font-bold text-sm border border-green-200">
          {success}
        </div>
      )}

      {/* AI 어시스턴트 도구 상자 */}
      <AiToolbox 
        onApply={(data) => {
          setFormData(prev => ({
            ...prev,
            title: data.title,
            slug: data.slug,
            content: data.content
          }));
        }}
      />

      <form onSubmit={handleSubmit} className="space-y-6 bg-muted/20 p-6 rounded-lg border">
        
        {/* 보안: 관리자 비밀번호 (옵션 기능) */}
        <div className="grid gap-2">
          <label className="text-sm font-bold">관리자 인증 비밀번호</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            placeholder="업로드를 위해 비밀번호를 입력하세요 (선택)"
            className="border p-2 rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
          />
          <p className="text-xs text-muted-foreground">env.ADMIN_PASSWORD가 설정된 경우 입력 필수</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <label className="text-sm font-bold">기사 제목 *</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="뉴스 제목을 입력하세요"
              required
              className="border p-2 rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
            />
          </div>

          <div className="grid gap-2">
            <label className="text-sm font-bold">URL 슬러그 (Slug) *</label>
            <input
              type="text"
              name="slug"
              value={formData.slug}
              onChange={handleChange}
              placeholder="url-path-name"
              required
              className="border p-2 rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="grid gap-2">
            <label className="text-sm font-bold">발행 상태 *</label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="border p-2 rounded-md bg-background focus:ring-2 focus:ring-primary outline-none"
            >
              <option value="draft">임시저장 (Draft)</option>
              <option value="published">공개 (Published)</option>
            </select>
          </div>
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-bold">썸네일 이미지</label>
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            className="border p-2 rounded-md bg-background text-sm"
          />
        </div>

        <div className="grid gap-2">
          <label className="text-sm font-bold">본문 내용 (Markdown) *</label>
          <textarea
            name="content"
            value={formData.content}
            onChange={handleChange}
            placeholder="# 마크다운으로 작성하세요..."
            required
            rows={15}
            className="border p-3 rounded-md bg-background font-mono text-sm focus:ring-2 focus:ring-primary outline-none resize-y"
          />
        </div>

        <div className="pt-4 flex justify-end gap-4 border-t">
           <button
             type="button"
             onClick={() => router.push('/')}
             className="px-6 py-2 rounded-md border font-bold hover:bg-muted transition-colors"
           >
             취소
           </button>
           <button
             type="submit"
             disabled={submitting}
             className="px-6 py-2 rounded-md bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
           >
             {submitting ? '업로드 중...' : '기사 등록 (Submit)'}
           </button>
        </div>
      </form>
    </div>
  );
}
