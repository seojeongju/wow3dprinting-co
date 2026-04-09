'use client';

import { useState, useRef, useEffect } from 'react';
import { Edit3, Trash2, Save, X, Loader2, Settings, ArrowLeft, CheckCircle, PlusCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import Image from 'next/image';
import Markdown from '@/components/Markdown';

interface ArticleEditorProps {
  article: any;
  category: any;
  isAdmin: boolean;
}

export default function ArticleEditor({ article, category, isAdmin }: ArticleEditorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [formData, setFormData] = useState({
    title: article.title,
    content: article.content,
    status: article.status,
    thumbnailKey: article.thumbnailKey,
  });
  const router = useRouter();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);
  const contentImageInputRef = useRef<HTMLInputElement>(null);

  // 텍스트 영역 높이 자동 조절
  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
  }, [isEditing, formData.content]);

  // 자산 업로드 헬퍼
  const uploadAsset = async (file: File) => {
    const uploadFormData = new FormData();
    uploadFormData.append('file', file);
    
    const res = await fetch('/api/admin/assets', {
      method: 'POST',
      body: uploadFormData,
    });
    
    if (!res.ok) throw new Error('업로드 실패');
    return await res.json() as { key: string, url: string };
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const asset = await uploadAsset(file);
      setFormData(prev => ({ ...prev, thumbnailKey: asset.key }));
    } catch (err) {
      alert('이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContentImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    try {
      const asset = await uploadAsset(file);
      const imageMarkdown = `\n![${file.name}](${asset.url})\n`;
      
      // 커서 위치에 정밀하게 삽입하는 로직
      if (textareaRef.current) {
        const start = textareaRef.current.selectionStart;
        const end = textareaRef.current.selectionEnd;
        const currentContent = formData.content;
        
        const newContent = 
          currentContent.substring(0, start) + 
          imageMarkdown + 
          currentContent.substring(end);
        
        setFormData(prev => ({ ...prev, content: newContent }));
        
        // 상태 업데이트 후 커서 위치 조정 (다음 틱에서 실행)
        setTimeout(() => {
          if (textareaRef.current) {
            textareaRef.current.focus();
            const newPos = start + imageMarkdown.length;
            textareaRef.current.setSelectionRange(newPos, newPos);
          }
        }, 0);
      } else {
        // 폴백: 맨 뒤에 추가
        setFormData(prev => ({ ...prev, content: prev.content + imageMarkdown }));
      }
    } catch (err) {
      alert('본문 이미지 업로드 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
      // 인풋 초기화 (같은 파일 다시 선택 가능하게)
      e.target.value = '';
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setIsEditing(false);
        router.refresh();
      } else {
        const error = await res.json() as any;
        alert(`저장 실패: ${error.message}`);
      }
    } catch (err) {
      alert('저장 중 네트워크 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm('정말로 이 기사를 삭제하시겠습니까?')) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/admin/articles/${article.id}`, {
        method: 'DELETE',
      });
      if (res.ok) {
        router.push('/');
        router.refresh();
      }
    } catch (err) {
      alert('삭제 중 오류가 발생했습니다.');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <article className="container mx-auto px-4 py-12 md:px-6 max-w-4xl min-h-screen">
      {/* 관리자 통합 제어 바 */}
      {isAdmin && (
        <div className="mb-12 p-6 bg-primary/[0.03] border border-primary/20 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-6 sticky top-24 z-40 backdrop-blur-xl shadow-2xl shadow-primary/5 transition-all">
          <div className="flex items-center gap-4">
            <div className={`w-12 h-12 ${isEditing ? 'bg-primary' : 'bg-primary/10'} rounded-2xl flex items-center justify-center text-primary-foreground transition-colors`}>
              {isEditing ? <Edit3 className="w-6 h-6 animate-pulse" /> : <Settings className="w-6 h-6 text-primary" />}
            </div>
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-primary">
                {isEditing ? '기사 편집 모드 활성화' : '운영 관리자 전용 도구'}
              </p>
              <p className="text-xs text-muted-foreground font-medium italic opacity-70">
                {isEditing ? '작성 중인 내용은 실시간으로 확인 가능합니다.' : '현재 기사의 내용을 즉시 수정하거나 삭제할 수 있습니다.'}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-3">
            {!isEditing ? (
              <>
                <button
                  onClick={() => setIsEditing(true)}
                  className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-xl transition-all active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  본문 직접 수정하기
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="flex items-center gap-2 px-6 py-3 bg-muted text-muted-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-destructive hover:text-destructive-foreground transition-all"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  기사 삭제
                </button>
              </>
            ) : (
              <>
                <button
                  onClick={handleSave}
                  disabled={isLoading}
                  className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] hover:shadow-xl transition-all shadow-lg shadow-primary/30"
                >
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                  수정내용 저장
                </button>
                <button
                  onClick={() => {
                    if (confirm('수정 중인 내용을 취소하시겠습니까?')) {
                      setIsEditing(false);
                      setFormData({ 
                        title: article.title, 
                        content: article.content, 
                        status: article.status,
                        thumbnailKey: article.thumbnailKey 
                      });
                    }
                  }}
                  className="flex items-center gap-2 px-6 py-3 bg-muted text-muted-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-background transition-all"
                >
                  <X className="w-3.5 h-3.5" />
                  편집 취소
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {/* 기사 헤더 영역 */}
      <header className="mb-14 flex flex-col gap-6">
        <div className="flex items-center gap-3">
          {category && (
            <span className="w-fit text-[10px] font-black uppercase tracking-[0.3em] text-primary bg-primary/10 px-4 py-1.5 rounded-full">
              {category.name}
            </span>
          )}
          <div className="h-px w-8 bg-muted-foreground/20" />
          {isEditing ? (
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="bg-muted px-3 py-1 rounded-full text-[10px] font-bold border-none outline-none focus:ring-2 focus:ring-primary"
            >
              <option value="published">공개 (Published)</option>
              <option value="draft">임시저장 (Draft)</option>
            </select>
          ) : (
            <span className="text-[10px] font-bold text-muted-foreground tracking-widest uppercase opacity-40">
              상태: {formData.status.toUpperCase()}
            </span>
          )}
        </div>

        {isEditing ? (
          <textarea
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
            className="text-4xl md:text-5xl font-black tracking-tighter leading-tight italic bg-muted/30 border-none rounded-2xl p-4 w-full focus:ring-2 focus:ring-primary outline-none min-h-[120px] resize-none"
            placeholder="기사 제목을 입력하세요..."
          />
        ) : (
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter leading-tight italic">
            {formData.title}
          </h1>
        )}
        
        <div className="flex items-center justify-between border-y py-6 mt-4">
          <div className="flex flex-col">
            <span className="font-bold text-foreground">작성: {article.authorId.toUpperCase() || '관리자'}</span>
            <span>게시일: {article.publishedAt ? format(new Date(article.publishedAt), 'yyyy년 M월 d일') : '최근'}</span>
          </div>
        </div>
      </header>

      {/* 기사 섬네일 관리 (지능형 레이아웃) */}
      <input 
        type="file" 
        ref={thumbnailInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleThumbnailUpload} 
      />
      
      {(formData.thumbnailKey || isEditing) && (
        <div className="relative aspect-video mb-12 rounded-[2.5rem] overflow-hidden shadow-2xl group/thumb bg-muted/30">
          {formData.thumbnailKey ? (
            <>
              <Image 
                src={(() => {
                  const rawUrl = (formData.thumbnailKey || '').trim();
                  if (rawUrl.startsWith('//')) return `https:${rawUrl}`;
                  if (rawUrl.startsWith('http')) return rawUrl;
                  return `/api/assets/${rawUrl}`;
                })()} 
                alt={formData.title} 
                fill 
                className="object-cover" 
                priority
                unoptimized={true}
              />
              {isEditing && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity gap-4 shadow-inner">
                  <button 
                    onClick={() => thumbnailInputRef.current?.click()}
                    className="p-3 bg-white text-black rounded-full hover:scale-110 transition-transform shadow-lg"
                  >
                    <Edit3 className="w-5 h-5" />
                  </button>
                  <button 
                    onClick={() => setFormData(prev => ({ ...prev, thumbnailKey: null }))}
                    className="p-3 bg-destructive text-white rounded-full hover:scale-110 transition-transform shadow-lg"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center border-4 border-dashed border-muted-foreground/10 rounded-[2.5rem]">
              <button 
                onClick={() => thumbnailInputRef.current?.click()}
                className="flex flex-col items-center gap-4 text-muted-foreground hover:text-primary transition-colors"
              >
                <PlusCircle className="w-12 h-12 opacity-20" />
                <span className="font-black uppercase tracking-widest text-[10px] opacity-40">공식 기사 섬네일 추가</span>
              </button>
            </div>
          )}
        </div>
      )}

      {/* 본문 에디터 및 본문 렌더링 영역 */}
      <input 
        type="file" 
        ref={contentImageInputRef} 
        className="hidden" 
        accept="image/*" 
        onChange={handleContentImageUpload} 
      />

      <div className="prose prose-lg prose-zinc max-w-none w-full break-words break-keep overflow-hidden prose-headings:font-black prose-headings:tracking-tighter prose-headings:italic prose-p:leading-relaxed prose-img:rounded-[2.5rem] prose-img:shadow-2xl prose-img:mx-auto">
        {isEditing ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between p-4 bg-muted/30 rounded-2xl">
              <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-primary opacity-60">
                <Edit3 className="w-3.5 h-3.5" />
                <span>기사 본문 마크다운 편집 중</span>
              </div>
              <button
                onClick={() => contentImageInputRef.current?.click()}
                className="flex items-center gap-2 px-4 py-2 bg-background border text-[10px] font-black uppercase tracking-widest rounded-xl hover:bg-muted transition-all active:scale-95 shadow-sm"
              >
                <PlusCircle className="w-3.5 h-3.5 text-primary" />
                본문 이미지 추가
              </button>
            </div>
            <textarea
              ref={textareaRef}
              value={formData.content}
              onChange={(e) => setFormData({ ...formData, content: e.target.value })}
              className="w-full min-h-[500px] bg-muted/30 border-none rounded-[2rem] p-8 font-mono text-base leading-relaxed focus:ring-2 focus:ring-primary outline-none focus:bg-background transition-all"
              placeholder="여기에 기사 내용을 작성하세요..."
            />

            {/* 실시간 미리보기 영역 (Live Preview) */}
            <div className="mt-16 pt-16 border-t-2 border-dashed border-muted">
              <div className="flex items-center gap-3 mb-10 opacity-40">
                <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                <h3 className="text-xs font-black uppercase tracking-[0.3em]">실시간 미리보기 (Live Preview)</h3>
              </div>
              <div className="bg-primary/[0.01] rounded-[2.5rem] p-8 border border-primary/5 shadow-inner">
                <Markdown content={formData.content} />
              </div>
            </div>
          </div>
        ) : (
          <Markdown content={formData.content} />
        )}
      </div>

      <footer className="mt-20 border-t pt-12">
        <h3 className="text-sm font-bold uppercase tracking-widest mb-6">전문가 분석 및 인사이트</h3>
        <p className="text-muted-foreground text-sm italic">
          3D프린팅타임즈는 인공지능과 제조 기술의 융합을 지속적으로 모니터링합니다. 
          추가적인 후속 리포트를 기대해 주세요.
        </p>
      </footer>
    </article>
  );
}
