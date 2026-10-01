'use client';

import { useEffect, useState } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Maximize2, Download } from 'lucide-react';

interface ImageLightboxModalProps {
  src: string | null;
  alt?: string;
  isOpen: boolean;
  onClose: () => void;
}

export default function ImageLightboxModal({
  src,
  alt = '기사 이미지',
  isOpen,
  onClose,
}: ImageLightboxModalProps) {
  const [scale, setScale] = useState(1);

  // Esc 키 누를 때 모달 닫기
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  // 모달이 열릴 때마다 scale 초기화
  useEffect(() => {
    if (isOpen) {
      setScale(1);
    }
  }, [isOpen, src]);

  if (!isOpen || !src) return null;

  const handleZoomIn = () => setScale((prev) => Math.min(prev + 0.25, 3));
  const handleZoomOut = () => setScale((prev) => Math.max(prev - 0.25, 0.5));
  const handleResetZoom = () => setScale(1);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md transition-opacity animate-in fade-in duration-300"
      onClick={onClose}
    >
      {/* 툴바 제어 헤더 */}
      <div
        className="absolute top-6 right-6 z-[101] flex items-center gap-3 bg-zinc-900/80 p-2.5 rounded-2xl border border-white/10 shadow-2xl backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleZoomOut}
          className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          title="축소"
        >
          <ZoomOut className="w-5 h-5" />
        </button>
        <span className="text-xs font-mono font-bold text-zinc-300 min-w-[44px] text-center">
          {Math.round(scale * 100)}%
        </span>
        <button
          onClick={handleZoomIn}
          className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          title="확대"
        >
          <ZoomIn className="w-5 h-5" />
        </button>
        <button
          onClick={handleResetZoom}
          className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          title="원본 크기 복원"
        >
          <RotateCcw className="w-5 h-5" />
        </button>
        <div className="w-px h-5 bg-white/10 my-auto mx-1" />
        <a
          href={src}
          download
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-zinc-300 hover:text-white hover:bg-white/10 rounded-xl transition-all"
          title="이미지 원본 다운로드 / 새 창 열기"
        >
          <Download className="w-5 h-5" />
        </a>
        <button
          onClick={onClose}
          className="p-2 text-zinc-100 bg-red-500/80 hover:bg-red-500 rounded-xl transition-all shadow-lg"
          title="닫기 (Esc)"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* 안내 태그 (하단) */}
      <div
        className="absolute bottom-6 left-1/2 -translate-x-1/2 z-[101] px-5 py-2.5 bg-zinc-900/80 border border-white/10 rounded-full text-xs text-zinc-300 font-medium backdrop-blur-xl pointer-events-none shadow-2xl flex items-center gap-2"
      >
        <Maximize2 className="w-3.5 h-3.5 text-primary" />
        <span>마우스 휠이나 버튼으로 이미지를 자유롭게 확대/축소할 수 있습니다</span>
      </div>

      {/* 이미지 메인 뷰어 영역 (상하 잘림 방지 및 마우스 휠 지원) */}
      <div
        className="relative max-w-[95vw] max-h-[90vh] overflow-auto flex items-center justify-center p-4 cursor-default"
        onClick={(e) => e.stopPropagation()}
        onWheel={(e) => {
          e.preventDefault();
          if (e.deltaY < 0) {
            handleZoomIn();
          } else {
            handleZoomOut();
          }
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={src}
          alt={alt}
          style={{ transform: `scale(${scale})` }}
          className="max-w-full max-h-[85vh] object-contain transition-transform duration-200 ease-out rounded-2xl shadow-2xl select-none"
        />
      </div>
    </div>
  );
}
