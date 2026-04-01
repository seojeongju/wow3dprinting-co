import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl?: string;
}

export default function Pagination({ currentPage, totalPages, baseUrl = '/' }: PaginationProps) {
  // 표시할 페이지 번호 범위 계산 (현재 페이지 앞뒤로 2개씩)
  const getPageNumbers = () => {
    const pages = [];
    const moveRange = 2;
    let start = Math.max(1, currentPage - moveRange);
    let end = Math.min(totalPages, currentPage + moveRange);

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }
    return pages;
  };

  const pages = getPageNumbers();

  return (
    <nav className="flex items-center gap-1 sm:gap-2">
      {/* 이전 페이지 버튼 */}
      <Link
        href={currentPage > 1 ? `${baseUrl}?page=${currentPage - 1}` : '#'}
        className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${
          currentPage > 1 
            ? 'hover:bg-primary/10 hover:border-primary text-foreground' 
            : 'opacity-20 cursor-not-allowed pointer-events-none'
        }`}
        aria-disabled={currentPage <= 1}
      >
        <ChevronLeft className="w-5 h-5" />
      </Link>

      {/* 페이지 숫자 목록 */}
      {pages[0] > 1 && (
        <>
          <Link
            href={`${baseUrl}?page=1`}
            className="w-10 h-10 hidden sm:flex items-center justify-center rounded-xl border hover:bg-primary/10 hover:border-primary transition-all text-xs font-bold"
          >
            1
          </Link>
          {pages[0] > 2 && <span className="px-1 text-muted-foreground opacity-50">...</span>}
        </>
      )}

      {pages.map((page) => (
        <Link
          key={page}
          href={`${baseUrl}?page=${page}`}
          className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all text-xs font-bold ${
            currentPage === page
              ? 'bg-primary border-primary text-primary-foreground shadow-lg shadow-primary/20 scale-110 z-10'
              : 'hover:bg-primary/10 hover:border-primary text-muted-foreground'
          }`}
        >
          {page}
        </Link>
      ))}

      {pages[pages.length - 1] < totalPages && (
        <>
          {pages[pages.length - 1] < totalPages - 1 && <span className="px-1 text-muted-foreground opacity-50">...</span>}
          <Link
            href={`${baseUrl}?page=${totalPages}`}
            className="w-10 h-10 hidden sm:flex items-center justify-center rounded-xl border hover:bg-primary/10 hover:border-primary transition-all text-xs font-bold"
          >
            {totalPages}
          </Link>
        </>
      )}

      {/* 다음 페이지 버튼 */}
      <Link
        href={currentPage < totalPages ? `${baseUrl}?page=${currentPage + 1}` : '#'}
        className={`w-10 h-10 flex items-center justify-center rounded-xl border transition-all ${
          currentPage < totalPages 
            ? 'hover:bg-primary/10 hover:border-primary text-foreground' 
            : 'opacity-20 cursor-not-allowed pointer-events-none'
        }`}
        aria-disabled={currentPage >= totalPages}
      >
        <ChevronRight className="w-5 h-5" />
      </Link>
    </nav>
  );
}
