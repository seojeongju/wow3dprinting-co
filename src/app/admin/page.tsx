'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
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
  Filter,
  Trash2,
  Image as ImageIcon,
  UploadCloud,
  X,
  Eye,
  Type
} from 'lucide-react';
const TiptapEditor = dynamic(() => import('@/components/TiptapEditor'), { 
  ssr: false,
  loading: () => <div className="h-[600px] w-full bg-muted animate-pulse rounded-[2.5rem] flex items-center justify-center text-muted-foreground font-bold">에디터를 불러오는 중...</div>
});

const AiToolbox = dynamic(() => import('@/components/AiToolbox'), { 
  ssr: false,
  loading: () => <div className="h-[200px] w-full bg-primary/5 animate-pulse rounded-3xl" />
});

const DocumentUploader = dynamic(() => import('@/components/DocumentUploader'), { 
  ssr: false,
  loading: () => <div className="h-[80px] w-full bg-primary/5 animate-pulse rounded-2xl" />
});

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
  const [editingId, setEditingId] = useState<number | null>(null);
  
  // 페이지네이션 상태
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // 필터링 상태
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    content: '',
    status: 'draft',
    password: '',
    thumbnailKey: '',
  });

  // 수정용 기사 데이터 로드
  const handleLoadForEdit = (item: any) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      slug: item.slug,
      content: item.content,
      status: item.status,
      password: formData.password, // 패스워드는 유지
      thumbnailKey: item.thumbnailKey || '',
    });
    setThumbnailPreview(item.thumbnailKey ? (item.thumbnailKey.startsWith('http') || item.thumbnailKey.startsWith('//') ? item.thumbnailKey : `/api/assets/${item.thumbnailKey}`) : null);
    setPublishToTimes(item.targetSites === 'times' || item.targetSites === 'both');
    setPublishToWow3d(item.targetSites === 'wow3d' || item.targetSites === 'both');
    
    // 상단 폼으로 스크롤
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // 탭 또는 검색 조건 변경 시 페이지 초기화
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, searchTerm, startDate, endDate]);

  // 수정 취소
  const handleCancelEdit = () => {
    setEditingId(null);
    setFormData({
      title: '',
      slug: '',
      content: '',
      status: 'draft',
      password: formData.password,
      thumbnailKey: '',
    });
    setThumbnailFile(null);
    setThumbnailPreview(null);
  };

  // 기사 목록 불러오기 (비밀번호 미설정 환경에서도 동작)
  const fetchArticles = useCallback(async () => {
    try {
      // 비밀번호가 있으면 포함, 없으면 빈 문자열로 전송 (서버에서 ADMIN_PASSWORD 미설정 시 통과)
      const params = formData.password ? `?password=${encodeURIComponent(formData.password)}` : '';
      const res = await fetch(`/api/admin/articles${params}`);
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

  // 기사 삭제 처리
  const handleDelete = async (id: number) => {
    if (!confirm('정말로 이 기사를 영구 삭제하시겠습니까? 관련 이미지 자산도 함께 삭제됩니다.')) return;
    
    try {
      const params = new URLSearchParams();
      params.append('id', id.toString());
      if (formData.password) params.append('password', formData.password);
      
      const res = await fetch(`/api/admin/articles?${params.toString()}`, {
        method: 'DELETE',
      });
      
      const data = await res.json() as any;
      if (res.ok && data.success) {
        alert('기사가 성공적으로 삭제되었습니다.');
        fetchArticles(); // 목록 갱신
      } else {
        alert(`삭제 실패: ${data.message || '알 수 없는 오류'}`);
      }
    } catch (err) {
      console.error('Delete error:', err);
      alert('서버와 통신 중 오류가 발생했습니다.');
    }
  };

  // 페이지 로드 시 즉시 실행 + 비밀번호 변경 시 재실행
  useEffect(() => {
    fetchArticles(); // 즉시 실행
    const timer = setTimeout(() => {
      fetchArticles();
    }, 500);
    return () => clearTimeout(timer);
  }, [fetchArticles]);

  // 게시 대상 사이트 선택 (기본값: 두 사이트 모두)
  const [publishToTimes, setPublishToTimes] = useState(true);  // 3D프린팅타임즈
  const [publishToWow3d, setPublishToWow3d] = useState(true);  // 와우3D프린팅타임즈

  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [thumbnailPreview, setThumbnailPreview] = useState<string | null>(null);

  const handleClearThumbnail = () => {
    setThumbnailFile(null);
    setThumbnailPreview(null);
    setFormData(prev => ({ ...prev, thumbnailKey: '' }));
  };

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

  // 에디터 내용 동기화
  const handleEditorChange = (html: string) => {
    setFormData(prev => ({ ...prev, content: html }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setThumbnailFile(file);
      setThumbnailPreview(URL.createObjectURL(file));
      setFormData(prev => ({ ...prev, thumbnailKey: '' })); // 새로운 파일 업로드 시 기존 키 초기화
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setSubmitting(true);

    try {
      const data = new FormData();
      // 수정 시 ID 추가
      if (editingId) {
        data.append('id', editingId.toString());
      }
      
      data.append('title', formData.title);
      data.append('slug', formData.slug);
      data.append('content', formData.content);
      data.append('status', formData.status);
      data.append('password', formData.password);

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
        method: editingId ? 'PUT' : 'POST',
        body: data,
      });

      const result = await res.json() as any;

      if (res.ok && result.success) {
        setSuccess(editingId ? '기사가 성공적으로 수정되었습니다!' : '기사가 성공적으로 등록되었습니다!');
        fetchArticles(); // 목록 즉시 갱신
        
        // 폼 초기화 (수정 완료 후 초기화 로직 실행)
        handleCancelEdit();
      } else {
        setError(result.message || '작업에 실패했습니다.');
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
      <h1 className={`text-3xl font-black mb-8 border-b pb-4 ${editingId ? 'text-blue-600' : ''}`}>
        {editingId ? '기사 수정 모드 (Editing)' : '기사 등록 대시보드'}
      </h1>
      
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
      <Suspense fallback={<div className="h-[200px] w-full bg-primary/5 animate-pulse rounded-3xl" />}>
        <AiToolbox
          adminPassword={formData.password}
          onApply={(data) => {
            setFormData((prev) => ({
              ...prev,
              title: data.title,
              slug: data.slug,
              content: data.content,
            }));
          }}
          onAppendContent={(text) => {
            setFormData((prev) => ({
              ...prev,
              content: prev.content ? `${prev.content.trimEnd()}\n\n${text}` : text,
            }));
          }}
        />
      </Suspense>

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

        <div className="grid gap-3">
          <label className="text-sm font-bold flex items-center gap-2">
            <ImageIcon className="w-5 h-5 text-primary" />
            썸네일 이미지 업로드
          </label>
          <div className="relative group rounded-[2rem] overflow-hidden border-2 border-dashed border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors w-full aspect-video md:aspect-[21/9] flex flex-col items-center justify-center">
            {thumbnailPreview ? (
              <>
                <img 
                  src={thumbnailPreview.startsWith('//') ? `https:${thumbnailPreview}` : thumbnailPreview} 
                  alt="Thumbnail Preview" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-4">
                   <label className="cursor-pointer p-4 bg-white/20 hover:bg-white/40 text-white rounded-full backdrop-blur-sm transition-colors">
                      <UploadCloud className="w-6 h-6" />
                      <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
                   </label>
                   <button 
                     type="button" 
                     onClick={handleClearThumbnail}
                     className="p-4 bg-red-500/80 hover:bg-red-500 text-white rounded-full backdrop-blur-sm transition-colors"
                   >
                     <X className="w-6 h-6" />
                   </button>
                </div>
              </>
            ) : (
              <label className="w-full h-full cursor-pointer flex flex-col items-center justify-center p-8 text-center text-primary/60 hover:text-primary transition-colors">
                <UploadCloud className="w-12 h-12 mb-4 opacity-50" />
                <span className="text-sm font-black tracking-widest uppercase mb-2">클릭하여 이미지 업로드</span>
                <span className="text-[10px] uppercase font-bold opacity-70">JPG, PNG, WEBP 지원</span>
                <input type="file" accept="image/*" onChange={handleFileChange} className="hidden" />
              </label>
            )}
          </div>
        </div>

        {/* 텍스트 추출기 (PDF, DOCX) */}
        <Suspense fallback={<div className="h-[80px] w-full bg-primary/5 animate-pulse rounded-2xl" />}>
          <DocumentUploader 
            onExtract={(text) => {
              setFormData(prev => ({
                ...prev,
                content: prev.content ? `${prev.content.trimEnd()}\n\n${text}` : text
              }));
            }} 
          />
        </Suspense>

        <div className="grid grid-cols-1 gap-6">
          <div className="grid gap-2">
            <label className="text-sm font-bold flex items-center gap-2">
              <Edit3 className="w-4 h-4 text-primary" />
              스마트 콘텐츠 에디터 *
            </label>
            <Suspense fallback={<div className="h-[600px] w-full bg-muted animate-pulse rounded-[2.5rem]" />}>
              <TiptapEditor 
                content={formData.content} 
                onChange={handleEditorChange} 
              />
            </Suspense>
            <p className="text-[10px] text-muted-foreground italic mt-2">
              * 상단 툴바를 이용해 사진, 동영상, 인용구 등을 삽입할 수 있습니다. 이미지는 클릭하여 정렬 및 크기 조절이 가능합니다.
            </p>
          </div>
        </div>

        <div className="pt-4 flex justify-end gap-4 border-t">
           {editingId ? (
             <>
               <button
                 type="button"
                 onClick={handleCancelEdit}
                 className="px-6 py-2 rounded-md border font-bold hover:bg-muted transition-colors"
               >
                 수정 취소
               </button>
               <button
                 type="submit"
                 disabled={submitting}
                 className="px-6 py-2 rounded-md bg-blue-600 text-white font-bold hover:bg-blue-700 transition-colors disabled:opacity-50"
               >
                 {submitting ? '수정 중...' : '기사 수정 완료 (Update)'}
               </button>
             </>
           ) : (
             <>
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
             </>
           )}
        </div>
      </form>

      {/* 기사 관리 섹션 */}
      <div id="management-section" className="mt-20 border-t pt-20 mb-32">
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

        {/* 필터 및 검색 바 */}
        <div className="flex flex-col md:flex-row gap-4 mb-8 p-6 bg-white border border-gray-100 rounded-[2rem] shadow-sm">
          <div className="flex-1 relative">
            <input 
              type="text"
              placeholder="제목, 내용 또는 슬러그 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-muted/20 border-none rounded-xl text-xs font-bold focus:ring-2 focus:ring-primary outline-none"
            />
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50">
              <Filter className="w-4 h-4" />
            </div>
          </div>
          <div className="flex gap-2">
            <input 
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="px-4 py-3 bg-muted/20 border-none rounded-xl text-[10px] font-black focus:ring-2 focus:ring-primary outline-none"
            />
            <span className="flex items-center text-gray-300">~</span>
            <input 
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="px-4 py-3 bg-muted/20 border-none rounded-xl text-[10px] font-black focus:ring-2 focus:ring-primary outline-none"
            />
            {(searchTerm || startDate || endDate) && (
              <button 
                onClick={() => {
                  setSearchTerm('');
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-4 py-3 bg-red-50 text-red-500 rounded-xl text-[10px] font-black hover:bg-red-500 hover:text-white transition-all"
              >
                초기화
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4">
          {(() => {
            const filtered = articles.filter(a => {
              // 1. 탭 필터 (전체 또는 임시저장)
              const tabOk = activeTab === 'all' || a.status === 'draft';
              
              // 2. 키워드 검색 (제목, 본문, 슬러그)
              const term = searchTerm.toLowerCase().trim();
              const searchOk = !term || 
                a.title.toLowerCase().includes(term) || 
                (a.content && a.content.toLowerCase().includes(term)) || 
                a.slug.toLowerCase().includes(term);

              // 3. 발행 날짜 필터
              // 기사 날짜를 YYYY-MM-DD 형식으로 변환
              const artDate = new Date(a.publishedAt || a.id).toISOString().split('T')[0];
              const startOk = !startDate || artDate >= startDate;
              const endOk = !endDate || artDate <= endDate;

              return tabOk && searchOk && startOk && endOk;
            });
            const totalPages = Math.ceil(filtered.length / itemsPerPage);
            const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

            return (
              <>
                {paginated.map((item) => (
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
                          onClick={() => handleLoadForEdit(item)}
                          className="shrink-0 flex items-center gap-2 px-6 py-3 bg-blue-50 text-blue-600 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-sm border border-blue-100"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          내용 수정하기
                        </button>
                        <a 
                          href={`/articles/${item.slug}`}
                          target="_blank"
                          className="p-3 bg-muted/20 text-muted-foreground rounded-xl hover:bg-muted transition-colors border"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                        <button 
                          onClick={() => handleDelete(item.id)}
                          className="p-3 bg-red-50 text-red-400 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-100"
                          title="기사 삭제"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}

                {/* 페이지네이션 컨트롤 */}
                {totalPages > 1 && (
                  <div className="flex items-center justify-center gap-2 mt-12 pb-10">
                    <button
                      disabled={currentPage === 1}
                      onClick={() => {
                        setCurrentPage(prev => Math.max(1, prev - 1));
                        document.getElementById('management-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="p-2.5 rounded-xl border bg-white disabled:opacity-30 hover:bg-muted transition-colors"
                    >
                      <ArrowRight className="w-4 h-4 rotate-180" />
                    </button>
                    
                    <div className="flex gap-1.5">
                      {Array.from({ length: totalPages }).map((_, i) => (
                        <button
                          key={i + 1}
                          onClick={() => {
                            setCurrentPage(i + 1);
                            document.getElementById('management-section')?.scrollIntoView({ behavior: 'smooth' });
                          }}
                          className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all border ${
                            currentPage === i + 1 
                              ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20' 
                              : 'bg-white text-muted-foreground hover:border-gray-300'
                          }`}
                        >
                          {i + 1}
                        </button>
                      ))}
                    </div>

                    <button
                      disabled={currentPage === totalPages}
                      onClick={() => {
                        setCurrentPage(prev => Math.min(totalPages, prev + 1));
                        document.getElementById('management-section')?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className="p-2.5 rounded-xl border bg-white disabled:opacity-30 hover:bg-muted transition-colors"
                    >
                      <ArrowRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </>
            );
          })()}

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
