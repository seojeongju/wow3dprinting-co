'use client';

import { useState } from 'react';
import ImageLightboxModal from '@/components/ImageLightboxModal';

interface ArticleContentContainerProps {
  children: React.ReactNode;
}

export default function ArticleContentContainer({ children }: ArticleContentContainerProps) {
  const [activeImgSrc, setActiveImgSrc] = useState<string | null>(null);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = e.target as HTMLElement;
    if (target && target.tagName.toLowerCase() === 'img') {
      const img = target as HTMLImageElement;
      if (img.src) {
        setActiveImgSrc(img.src);
      }
    }
  };

  return (
    <>
      <div
        onClick={handleClick}
        className="w-full relative [&_img]:cursor-pointer [&_img]:transition-all [&_img]:duration-300 [&_img]:hover:scale-[1.01] [&_img]:hover:shadow-2xl"
      >
        {children}
      </div>

      <ImageLightboxModal
        src={activeImgSrc}
        isOpen={Boolean(activeImgSrc)}
        onClose={() => setActiveImgSrc(null)}
      />
    </>
  );
}
