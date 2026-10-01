'use client';

import { useState } from 'react';
import { Maximize2, ZoomIn } from 'lucide-react';
import ImageLightboxModal from '@/components/ImageLightboxModal';

interface InteractiveArticleImageProps {
  src: string;
  alt: string;
  className?: string;
  priority?: boolean;
  caption?: string;
}

export default function InteractiveArticleImage({
  src,
  alt,
  className = '',
  priority = false,
  caption,
}: InteractiveArticleImageProps) {
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);

  return (
    <>
      <figure className="group relative my-8 w-full">
        {/* 자동 비율 조절 + 상하 잘림 방지 래퍼 */}
        <div
          onClick={() => setIsLightboxOpen(true)}
          className={`relative cursor-pointer overflow-hidden rounded-[2.5rem] bg-gradient-to-b from-gray-50/50 to-gray-100/50 dark:from-zinc-900/50 dark:to-zinc-800/50 shadow-2xl transition-all duration-500 hover:shadow-primary/20 hover:scale-[1.005] ring-1 ring-black/5 ${className}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={src}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            className="w-full h-auto block rounded-[2.5rem] object-contain transition-transform duration-700 ease-out group-hover:scale-[1.01]"
          />

          {/* 호버 시 나타나는 라이트박스 자동 확대 레이어 */}
          <div className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center backdrop-blur-[2px] rounded-[2.5rem]">
            <div className="flex items-center gap-2 bg-white/90 dark:bg-zinc-900/90 text-zinc-900 dark:text-zinc-100 px-5 py-3 rounded-full shadow-2xl font-bold text-xs uppercase tracking-widest transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300">
              <ZoomIn className="w-4 h-4 text-primary" />
              <span>클릭하여 원본 크게보기</span>
            </div>
          </div>

          {/* 우상단 확대 뱃지 */}
          <div className="absolute top-4 right-4 bg-black/60 backdrop-blur-md text-white p-2.5 rounded-2xl opacity-70 group-hover:opacity-100 transition-opacity shadow-lg">
            <Maximize2 className="w-4 h-4" />
          </div>
        </div>

        {caption && (
          <figcaption className="mt-3 text-center text-xs text-muted-foreground italic font-medium">
            {caption}
          </figcaption>
        )}
      </figure>

      {/* 라이트박스 팝업 */}
      <ImageLightboxModal
        src={src}
        alt={alt}
        isOpen={isLightboxOpen}
        onClose={() => setIsLightboxOpen(false)}
      />
    </>
  );
}
