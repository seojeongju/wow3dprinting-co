'use client';

import { useState } from 'react';
import {
  Sparkles,
  Search,
  Loader2,
  ListPlus,
  Newspaper,
  Copy,
  Wand2,
  ClipboardPaste,
} from 'lucide-react';

type AssistAction = 'rewrite' | 'expand' | 'shorten' | 'titles' | 'lead' | 'bullets';

interface AiToolboxProps {
  adminPassword?: string;
  onApply: (data: { title: string; slug: string; content: string }) => void;
  /** 어시스턴트 결과를 기사 본문 끝에 이어 붙이기 */
  onAppendContent?: (text: string) => void;
}

export default function AiToolbox({ adminPassword = '', onApply, onAppendContent }: AiToolboxProps) {
  const [panel, setPanel] = useState<'draft' | 'assist'>('draft');
  const [keyword, setKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchResults, setSearchResults] = useState<
    Array<{ title: string; link: string; snippet: string; source: string }>
  >([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [error, setError] = useState('');

  const [assistText, setAssistText] = useState('');
  const [assistContext, setAssistContext] = useState('');
  const [assistAction, setAssistAction] = useState<AssistAction>('rewrite');
  const [assistResult, setAssistResult] = useState('');
  const [assistLoading, setAssistLoading] = useState(false);

  const pwd = () => adminPassword || undefined;

  const handleSearch = async () => {
    if (!keyword.trim()) return;
    setIsSearching(true);
    setError('');
    try {
      const res = await fetch('/api/admin/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword: keyword.trim(), password: pwd() }),
      });
      const data = (await res.json()) as { success: boolean; results?: typeof searchResults; message?: string };
      if (!res.ok || !data.success) {
        throw new Error(data.message || `검색 실패 (${res.status})`);
      }
      const results = data.results ?? [];
      setSearchResults(results);
      setSelectedIndices(results.map((_, i) => i));
      if (results.length === 0) {
        setError('검색 결과가 없습니다. 키워드를 바꾸거나 아래「키워드만으로 초안」을 사용해 보세요.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelection = (index: number) => {
    setSelectedIndices((prev) =>
      prev.includes(index) ? prev.filter((i) => i !== index) : [...prev, index]
    );
  };

  const toggleAll = () => {
    if (selectedIndices.length === searchResults.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(searchResults.map((_, i) => i));
    }
  };

  const runGenerate = async (filteredResults: typeof searchResults) => {
    setIsGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: keyword.trim(),
          searchResults: filteredResults,
          password: pwd(),
        }),
      });
      const data = (await res.json()) as {
        success: boolean;
        title?: string;
        slug?: string;
        content?: string;
        message?: string;
      };
      if (!res.ok || !data.success) {
        throw new Error(data.message || `생성 실패 (${res.status})`);
      }
      onApply({
        title: data.title ?? '',
        slug: data.slug ?? '',
        content: data.content ?? '',
      });
      alert('AI가 기사 초안을 폼에 채워 넣었습니다. 검토 후 등록하세요.');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '기사 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGenerate = async () => {
    if (!keyword.trim()) return;
    const filteredResults = searchResults.filter((_, i) => selectedIndices.includes(i));
    if (filteredResults.length === 0 && searchResults.length > 0) {
      if (!confirm('선택된 참고 자료가 없습니다. 키워드만으로 초안을 작성할까요?')) return;
    }
    await runGenerate(filteredResults);
  };

  /** 검색 없이 키워드만으로 초안 */
  const handleGenerateKeywordOnly = async () => {
    if (!keyword.trim()) {
      setError('먼저 키워드를 입력하세요.');
      return;
    }
    if (!confirm('웹 검색 없이 키워드만으로 초안을 작성합니다. 계속할까요?')) return;
    await runGenerate([]);
  };

  const handleAssist = async () => {
    setAssistLoading(true);
    setError('');
    setAssistResult('');
    try {
      const res = await fetch('/api/admin/ai/assist', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: assistAction,
          text: assistText,
          context: assistContext || undefined,
          password: pwd(),
        }),
      });
      const data = (await res.json()) as {
        success: boolean;
        result?: string;
        titles?: string[];
        message?: string;
      };
      if (!res.ok || !data.success) {
        throw new Error(data.message || `어시스턴트 실패 (${res.status})`);
      }
      setAssistResult(data.result ?? data.titles?.map((t, i) => `${i + 1}. ${t}`).join('\n') ?? '');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '어시스턴트 오류');
    } finally {
      setAssistLoading(false);
    }
  };

  const appendResultToArticle = async () => {
    if (!assistResult) return;
    try {
      await navigator.clipboard.writeText(assistResult);
    } catch {
      /* ignore */
    }
    onAppendContent?.(assistResult);
  };

  return (
    <div className="bg-primary/[0.03] border border-primary/20 rounded-3xl p-6 mb-8 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-primary">AI 기사 스튜디오</h3>
            <p className="text-xs text-muted-foreground font-medium opacity-70">
              자료 검색·신문 기사 형식 초안·문장 다듬기 (AI + Serper)
            </p>
          </div>
        </div>
        <div className="flex rounded-xl border bg-background p-1 text-[10px] font-black uppercase tracking-wider">
          <button
            type="button"
            onClick={() => setPanel('draft')}
            className={`px-4 py-2 rounded-lg transition-colors ${panel === 'draft' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            자료·초안
          </button>
          <button
            type="button"
            onClick={() => setPanel('assist')}
            className={`px-4 py-2 rounded-lg transition-colors ${panel === 'assist' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground'}`}
          >
            문장 어시스턴트
          </button>
        </div>
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 text-destructive text-xs font-bold rounded-xl border border-destructive/20 mb-4 whitespace-pre-wrap">
          {error}
        </div>
      )}

      {panel === 'draft' && (
        <div className="space-y-4">
          <p className="text-[10px] text-muted-foreground leading-relaxed">
            제목은 제목 필드에, 본문은 리드(## 없음) 다음에 <code className="text-foreground/80">## 소제목</code>마다 그 아래
            기사 내용 단락이 오는 구조로 생성됩니다(소제목+본문 블록 2개 이상).
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              placeholder="주제 키워드 (예: 금속 3D프린팅 항공 부품)"
              className="flex-grow bg-white border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all shadow-inner"
            />
            <button
              type="button"
              onClick={handleSearch}
              disabled={isSearching || !keyword.trim()}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-muted text-foreground rounded-2xl font-bold text-xs hover:bg-primary hover:text-white transition-all disabled:opacity-50"
            >
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
              자료 수집
            </button>
          </div>

          <button
            type="button"
            onClick={handleGenerateKeywordOnly}
            disabled={isGenerating || !keyword.trim()}
            className="w-full text-[10px] font-bold text-primary border border-dashed border-primary/40 rounded-xl py-2 hover:bg-primary/5 disabled:opacity-50"
          >
            검색 없이 키워드만으로 초안 작성
          </button>

          {searchResults.length > 0 && (
            <div className="space-y-3 bg-white p-4 rounded-2xl border shadow-sm">
              <div className="flex items-center justify-between border-b pb-2">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <Newspaper className="w-3 h-3" />
                  수집된 관련 소식 ({searchResults.length})
                </h4>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-[9px] font-bold text-primary hover:underline px-2 py-1"
                >
                  {selectedIndices.length === searchResults.length ? '전체 해제' : '전체 선택'}
                </button>
              </div>
              <div className="max-h-60 overflow-y-auto space-y-2 pr-2">
                {searchResults.map((res, i) => {
                  const isSelected = selectedIndices.includes(i);
                  return (
                    <button
                      type="button"
                      key={i}
                      onClick={() => toggleSelection(i)}
                      className={`w-full text-left flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                        isSelected
                          ? 'border-primary/40 bg-primary/[0.02]'
                          : 'border-transparent bg-muted/10 opacity-60 grayscale'
                      }`}
                    >
                      <div
                        className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center shrink-0 ${
                          isSelected ? 'bg-primary border-primary text-white' : 'border-muted-foreground/30 bg-white'
                        }`}
                      >
                        {isSelected && <Copy className="w-2.5 h-2.5" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p
                          className={`font-bold text-xs line-clamp-1 ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}
                        >
                          {res.title}
                        </p>
                        <p className="text-[10px] text-muted-foreground opacity-70 line-clamp-2 mt-1 italic">
                          {res.snippet}
                        </p>
                        <p className="text-[9px] text-primary/70 mt-1 truncate">{res.source}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={handleGenerate}
            disabled={isGenerating || !keyword.trim()}
            className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-xl transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50"
          >
            {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ListPlus className="w-5 h-5" />}
            AI 기반 기사 초안 자동 작성
          </button>
        </div>
      )}

      {panel === 'assist' && (
        <div className="space-y-3">
          <p className="text-[10px] text-muted-foreground">
            본문 입력란에서 쓴 문장을 복사해 넣거나, 아래에 직접 입력하세요. 제목 후보는 짧은 요지만 있어도 됩니다.
          </p>
          <textarea
            value={assistContext}
            onChange={(e) => setAssistContext(e.target.value)}
            placeholder="(선택) 전체 기사 맥락·메모"
            rows={3}
            className="w-full bg-white border rounded-2xl px-4 py-3 text-xs font-mono focus:ring-2 focus:ring-primary outline-none"
          />
          <textarea
            value={assistText}
            onChange={(e) => setAssistText(e.target.value)}
            placeholder="편집할 문단 또는 제목 후보용 요지"
            rows={5}
            className="w-full bg-white border rounded-2xl px-4 py-3 text-xs font-mono focus:ring-2 focus:ring-primary outline-none"
          />
          <div className="flex flex-col sm:flex-row gap-2">
            <select
              value={assistAction}
              onChange={(e) => setAssistAction(e.target.value as AssistAction)}
              className="border rounded-2xl px-4 py-3 text-xs font-bold bg-background"
            >
              <option value="rewrite">문체 다듬기</option>
              <option value="expand">내용 확장</option>
              <option value="shorten">짧게 압축</option>
              <option value="lead">리드(도입) 작성</option>
              <option value="bullets">불릿 요약</option>
              <option value="titles">제목 후보 5개</option>
            </select>
            <button
              type="button"
              onClick={handleAssist}
              disabled={assistLoading}
              className="flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-2xl font-bold text-xs disabled:opacity-50"
            >
              {assistLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
              실행
            </button>
          </div>
          {assistResult && (
            <div className="rounded-2xl border bg-white p-4 space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase text-muted-foreground">결과</span>
                <button
                  type="button"
                  onClick={() => {
                    void navigator.clipboard.writeText(assistResult);
                  }}
                  className="text-[10px] font-bold text-primary flex items-center gap-1"
                >
                  <Copy className="w-3 h-3" />
                  복사
                </button>
              </div>
              <pre className="text-xs whitespace-pre-wrap font-sans text-foreground max-h-48 overflow-y-auto">
                {assistResult}
              </pre>
              {onAppendContent && (
                <button
                  type="button"
                  onClick={() => void appendResultToArticle()}
                  className="w-full flex items-center justify-center gap-2 py-2 rounded-xl border border-primary/30 text-[10px] font-bold text-primary hover:bg-primary/5"
                >
                  <ClipboardPaste className="w-3 h-3" />
                  본문 끝에 붙이기 (+클립보드 복사)
                </button>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
