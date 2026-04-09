'use client';

import { useState, useRef, useEffect } from 'react';
import { Upload, FileText, Loader2, FileUp, CheckCircle, AlertCircle } from 'lucide-react';
import * as pdfjsLib from 'pdfjs-dist';
import mammoth from 'mammoth';

interface DocumentUploaderProps {
  onExtract: (text: string) => void;
}

export default function DocumentUploader({ onExtract }: DocumentUploaderProps) {
  const [isExtracting, setIsExtracting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // pdf.js 워커 설정 (CDN 사용 - 클라이언트 환경에서 필요)
    if (typeof window !== 'undefined' && 'GlobalWorkerOptions' in pdfjsLib) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.mjs`;
    }
  }, []);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Reset states
    setError(null);
    setSuccess(null);
    setIsExtracting(true);

    try {
      let extractedText = '';
      const arrayBuffer = await file.arrayBuffer();

      if (file.name.endsWith('.pdf')) {
        // PDF 파싱 로직
        const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
        const maxPages = pdf.numPages;
        const pageTextPromises = [];

        for (let i = 1; i <= maxPages; i++) {
          pageTextPromises.push(
            pdf.getPage(i).then(async (page) => {
              const textContent = await page.getTextContent();
              return textContent.items.map((item: any) => item.str).join(' ');
            })
          );
        }

        const pageTexts = await Promise.all(pageTextPromises);
        extractedText = pageTexts.join('\n\n');

      } else if (file.name.endsWith('.docx')) {
        // DOCX 파싱 로직
        const result = await mammoth.extractRawText({ arrayBuffer });
        extractedText = result.value;
      } else {
        throw new Error('지원되지 않는 파일 형식입니다. PDF나 DOCX 파일을 업로드해주세요.');
      }

      if (!extractedText || extractedText.trim() === '') {
        throw new Error('문서에서 추출된 텍스트가 없습니다. 파일이 비어있거나 스캔된 이미지 형태의 문서일 수 있습니다.');
      }

      setSuccess(`${file.name} 문서가 성공적으로 파싱되었습니다.`);
      onExtract(extractedText);
      
    } catch (err: any) {
      console.error('문서 추출 중 오류:', err);
      setError(err.message || '문서를 읽는 중 예상치 못한 오류가 발생했습니다.');
    } finally {
      setIsExtracting(false);
      // 인풋 초기화로 동일 파일 재업로드 가능하게 함
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-primary/5 border border-primary/20 rounded-[1.5rem] p-5 shadow-sm">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-primary/10 rounded-xl flex items-center justify-center">
            <FileUp className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest text-primary">문서 텍스트 추출기</h3>
            <p className="text-[11px] text-muted-foreground font-medium opacity-80 mt-0.5">
              기록된 PDF나 DOCX 파일을 올리면 텍스트를 추출해 본문에 덧붙입니다.
            </p>
          </div>
        </div>

        <div>
          <input 
            type="file" 
            accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
            className="hidden" 
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isExtracting}
            className="flex items-center justify-center gap-2 px-5 py-2.5 bg-background border border-primary/30 text-primary rounded-xl font-bold text-xs hover:bg-primary hover:text-white transition-all disabled:opacity-50"
          >
            {isExtracting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
            {isExtracting ? '문서 읽는 중...' : '문서 불러오기 (PDF, DOCX)'}
          </button>
        </div>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 text-red-600 text-xs font-bold rounded-xl border border-red-100 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="mt-4 p-3 bg-green-50 text-green-700 text-xs font-bold rounded-xl border border-green-100 flex items-center gap-2">
          <CheckCircle className="w-4 h-4" />
          <span>{success}</span>
        </div>
      )}
    </div>
  );
}
