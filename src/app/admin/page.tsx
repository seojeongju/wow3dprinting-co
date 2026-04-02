'use client';

export const runtime = 'edge';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import AiToolbox from '@/components/AiToolbox';
import { 
  Clock, 
  ExternalLink, 
  Edit3, 
  FileText, 
  CheckCircle2, 
  Layers, 
  Globe, 
  Laptop,
  ArrowRight,
  Filter
} from 'lucide-react';

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
  const [articles, setArticles] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'all' | 'draft'>('all');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    status: 'draft',
    password: '',
  });

  // 기사 목록 불러오기
  const fetchArticles = useCallback(async () => {
    // 비밀번호가 있을 때만 요청 (보안)
    if (!formData.password) return;
    try {
      const res = await fetch(`/api/admin/articles?password=${encodeURIComponent(formData.password)}`);
      if (res.ok) {
        const data = await res.json() as any;
        if (data.success) {
          setArticles(data.articles);
        }
      }
    } catch (err) {
      console.error('Fetch articles error:', err);
    }
  }, [formData.password]);

  // 비밀번호 입력 시 또는 등록 성공 시 목록 갱신
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchArticles();
    }, 1000);
    return () => clearTimeout(timer);
  }, [fetchArticles]);

  // 게시 대상 사이트 선택 (기본값: 두 사이트 모두)
  const [publishToTimes, setPublishToTimes] = useState(true);  // 3D프린팅타임즈
  const [publishToWow3d, setPublishToWow3d] = useState(true);  // 와우3D프린팅타임즈

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

      // 게시 대상 사이트 결정
      let targetSites = 'both';
      if (publishToTimes && !publishToWow3d) targetSites = 'times';
      if (!publishToTimes && publishToWow3d) targetSites = 'wow3d';
      if (!publishToTimes && !publishToWow3d) targetSites = 'both'; // 둘 다 비선택 시 기본값
      data.append('targetSites', targetSites);

      if (thumbnailFile) {
        data.append('thumbnail', thumbnailFile);
      }

      const res = await fetch('/api/admin/articles', {
        method: 'POST',
        body: data,
      });

      const result = await res.json() as any;

      if (res.ok && result.success) {
        setSuccess('기사가 성공적으로 등록되었습니다!');
        fetchArticles(); // 목록 즉시 갱신
        // 폼 초기화 (비밀번호 제외)
        setFormData({
          title: '',
          slug: '',
          content: '',
          status: 'draft',
          password: formData.password,
        });
        setThumbnailFile(null);
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

        {/* 게시 대상 사이트 선택 */}
        <div className="grid gap-3 p-4 bg-primary/5 border border-primary/20 rounded-xl">
          <label className="text-sm font-black text-primary">📡 게시 대상 사이트</label>
          <p className="text-xs text-muted-foreground">기사를 게시할 사이트를 선택하세요. 기본값은 두 사이트 동시 게시입니다.</p>
          <div className="flex flex-col gap-3">
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={publishToTimes}
                onChange={(e) => setPublishToTimes(e.target.checked)}
                className="w-4 h-4 rounded accent-primary"
              />
              <div>
                <span className="font-bold text-sm">3D프린팅타임즈</span>
                <span className="ml-2 text-xs text-muted-foreground">wow3dprinting.co.kr</span>
              </div>
            </label>
            <label className="flex items-center gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={publishToWow3d}
                onChange={(e) => setPublishToWow3d(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#F97316' }}
              />
              <div>
                <span className="font-bold text-sm">와우3D프린팅타임즈</span>
                <span className="ml-2 text-xs text-muted-foreground">wow3dprinting.com</span>
              </div>
            </label>
          </div>
          <div className="text-[10px] font-bold text-muted-foreground/60 pt-1 border-t">
            현재 선택: {publishToTimes && publishToWow3d ? '양쪽 동시 게시' : publishToTimes ? '3D프린팅타임즈만' : publishToWow3d ? '와우3D프린팅타임즈만' : '선택 없음 (동시 게시 처리)'}
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

      {/* 기사 관리 섹션 */}
      <div className="mt-20 border-t pt-20 mb-32">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-10 gap-6">
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-black italic tracking-tighter">Contents Cloud Management</h2>
            <p className="text-xs text-muted-foreground font-medium uppercase tracking-[0.2em] opacity-60">기사 상태 및 게시 채널 통합 관리</p>
          </div>
          
          <div className="flex p-1 bg-muted rounded-xl border">
            <button 
              onClick={() => setActiveTab('all')}
              className={`px-6 py-2.5 rounded-lg text-xs font-black transition-all ${activeTab === 'all' ? 'bg-background shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
            >
              전체 기사
            </button>
            <button 
              onClick={() => setActiveTab('draft')}
              className={`px-6 py-2.5 rounded-lg text-xs font-black transition-all ${activeTab === 'draft' ? 'bg-background shadow-lg' : 'text-muted-foreground hover:text-foreground'}`}
            >
              임시저장
            </button>
          </div>
        </div>

        <div className="grid gap-4">
          {articles
            .filter(a => activeTab === 'all' || a.status === 'draft')
            .map((item) => (
              <div key={item.id} className="group bg-white border border-gray-100 p-6 rounded-[2rem] hover:border-primary/20 hover:shadow-xl transition-all duration-500">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                  <div className="flex-1 flex flex-col gap-3">
                    <div className="flex items-center gap-3">
                      <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${item.status === 'published' ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-600 animate-pulse'}`}>
                        {item.status}
                      </span>
                      <div className="flex items-center gap-2 text-[10px] font-bold text-gray-300">
                        {(item.targetSites === 'times' || item.targetSites === 'both') && <Globe className="w-3 h-3 text-blue-400" />}
                        {(item.targetSites === 'wow3d' || item.targetSites === 'both') && <Laptop className="w-3 h-3 text-orange-400" />}
                        <span className="ml-1 uppercase tracking-tighter">{item.targetSites}</span>
                      </div>
                    </div>
                    <h3 className="text-base font-black text-gray-800 leading-snug group-hover:text-primary transition-colors line-clamp-1">{item.title}</h3>
                    <div className="flex items-center gap-4 text-[10px] font-bold text-gray-400">
                      <span className="flex items-center gap-1.5"><Clock className="w-3 h-3" /> {new Date(item.publishedAt || (item as any).id).toLocaleDateString('ko-KR')}</span>
                      <span className="flex items-center gap-1.5"><FileText className="w-3 h-3" /> {item.slug}</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => router.push(`/articles/${item.slug}`)}
                      className="shrink-0 flex items-center gap-2 px-6 py-3 bg-muted/30 rounded-xl text-[10px] font-black uppercase tracking-widest group-hover:bg-primary group-hover:text-white transition-all shadow-sm"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      편집 바로가기
                    </button>
                    <a 
                      href={`/articles/${item.slug}`}
                      target="_blank"
                      className="p-3 bg-muted/20 text-muted-foreground rounded-xl hover:bg-muted transition-colors border"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
          ))}

          {articles.length === 0 && (
             <div className="py-20 text-center border-2 border-dashed border-gray-100 rounded-[3rem] bg-gray-50/20">
                <Layers className="w-12 h-12 text-gray-200 mx-auto mb-4 opacity-50" />
                <p className="text-xs font-black uppercase tracking-widest text-gray-300 italic">No Articles Data Streamed ...</p>
             </div>
          )}
        </div>
      </div>
    </div>
  );
}
