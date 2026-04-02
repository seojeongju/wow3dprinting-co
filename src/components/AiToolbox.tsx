'use client';

import { useState } from 'react';
import { Sparkles, Search, Loader2, ListPlus, Newspaper, Copy } from 'lucide-react';

interface AiToolboxProps {
  onApply: (data: { title: string; slug: string; content: string }) => void;
}

export default function AiToolbox({ onApply }: AiToolboxProps) {
  const [keyword, setKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<number[]>([]);
  const [error, setError] = useState('');

  const handleSearch = async () => {
    if (!keyword) return;
    setIsSearching(true);
    setError('');
    try {
      const res = await fetch('/api/admin/ai/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ keyword }),
      });
      const data = await res.json() as { success: boolean; results: any[]; message?: string };
      if (data.success) {
        setSearchResults(data.results);
        // 검색 완료 시 모든 항목을 기본으로 선택
        setSelectedIndices(data.results.map((_, i) => i));
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      setError(err.message || '검색 중 오류가 발생했습니다.');
    } finally {
      setIsSearching(false);
    }
  };

  const toggleSelection = (index: number) => {
    setSelectedIndices(prev => 
      prev.includes(index) 
        ? prev.filter(i => i !== index) 
        : [...prev, index]
    );
  };

  const toggleAll = () => {
    if (selectedIndices.length === searchResults.length) {
      setSelectedIndices([]);
    } else {
      setSelectedIndices(searchResults.map((_, i) => i));
    }
  };

  const handleGenerate = async () => {
    if (!keyword) return;
    
    // 선택된 자료만 필터링
    const filteredResults = searchResults.filter((_, i) => selectedIndices.includes(i));
    
    // 자료가 하나도 선택되지 않았을 경우 확인
    if (filteredResults.length === 0 && searchResults.length > 0) {
      if (!confirm('선택된 참고 자료가 없습니다. 검색된 자료 없이 키워드만으로 기사를 작성하시겠습니까?')) {
        return;
      }
    }

    setIsGenerating(true);
    setError('');
    try {
      const res = await fetch('/api/admin/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: keyword, searchResults: filteredResults }),
      });
      const data = await res.json() as { 
        success: boolean; 
        title: string; 
        slug: string; 
        content: string; 
        message?: string;
      };
      if (data.success) {
        onApply({
          title: data.title,
          slug: data.slug,
          content: data.content,
        });
        alert('AI가 선택된 자료를 분석하여 기사 초안을 작성했습니다!');
      } else {
        throw new Error(data.message);
      }
    } catch (err: any) {
      setError(err.message || '기사 생성 중 오류가 발생했습니다.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="bg-primary/[0.03] border border-primary/20 rounded-3xl p-6 mb-8 shadow-sm">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-primary/10 rounded-2xl flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="text-sm font-black uppercase tracking-widest text-primary">AI 기사 어시스턴트</h3>
          <p className="text-xs text-muted-foreground font-medium opacity-70">최신 기술 정보를 검색하고 기사 초안을 자동으로 작성합니다.</p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex gap-2">
          <input
            type="text"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="주요 기술 키워드 입력 (예: 3D프린팅 하이브리드 제조)"
            className="flex-grow bg-white border rounded-2xl px-4 py-3 text-sm focus:ring-2 focus:ring-primary outline-none transition-all shadow-inner"
          />
          <button
            onClick={handleSearch}
            disabled={isSearching || !keyword}
            className="flex items-center gap-2 px-6 py-3 bg-muted text-foreground rounded-2xl font-bold text-xs hover:bg-primary hover:text-white transition-all disabled:opacity-50"
          >
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
            자료 수집
          </button>
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 text-destructive text-xs font-bold rounded-xl border border-destructive/20">
            {error}
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="space-y-3 bg-white p-4 rounded-2xl border shadow-sm">
            <div className="flex items-center justify-between border-b pb-2">
              <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                <Newspaper className="w-3 h-3" />
                수집된 관련 소식 ({searchResults.length})
              </h4>
              <button 
                onClick={toggleAll}
                className="text-[9px] font-bold text-primary hover:underline px-2 py-1"
              >
                {selectedIndices.length === searchResults.length ? '전체 해제' : '전체 선택'}
              </button>
            </div>
            <div className="max-h-60 overflow-y-auto space-y-2 pr-2 scrollbar-hide">
              {searchResults.map((res, i) => {
                const isSelected = selectedIndices.includes(i);
                return (
                  <div 
                    key={i} 
                    onClick={() => toggleSelection(i)}
                    className={`group flex items-start gap-3 p-3 rounded-xl border transition-all cursor-pointer hover:shadow-md ${
                      isSelected 
                        ? 'border-primary/40 bg-primary/[0.02]' 
                        : 'border-transparent bg-muted/10 opacity-60 grayscale'
                    }`}
                  >
                    <div className={`mt-0.5 w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                      isSelected ? 'bg-primary border-primary text-white' : 'border-muted-foreground/30 bg-white'
                    }`}>
                      {isSelected && <Copy className="w-2.5 h-2.5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`font-bold text-xs line-clamp-1 ${isSelected ? 'text-foreground' : 'text-muted-foreground'}`}>
                        {res.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground opacity-70 line-clamp-2 mt-1 italic">
                        {res.snippet}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={isGenerating || !keyword}
          className="w-full flex items-center justify-center gap-2 px-6 py-4 bg-primary text-primary-foreground rounded-2xl font-black uppercase tracking-widest text-xs hover:shadow-xl transition-all active:scale-95 shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          {isGenerating ? <Loader2 className="w-5 h-5 animate-spin" /> : <ListPlus className="w-5 h-5" />}
          AI 기반 기사 초안 자동 작성 시작
        </button>
      </div>
    </div>
  );
}
