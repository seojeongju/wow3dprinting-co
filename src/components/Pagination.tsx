import Link from 'next/link';

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  baseUrl: string;
}

export default function Pagination({ currentPage, totalPages, baseUrl }: PaginationProps) {
  if (totalPages <= 1) return null;

  const pages = [];
  const maxVisiblePages = 5;

  let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
  let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

  if (endPage - startPage + 1 < maxVisiblePages) {
    startPage = Math.max(1, endPage - maxVisiblePages + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }

  const getPageUrl = (page: number) => {
    const separator = baseUrl.includes('?') ? '&' : '?';
    return `${baseUrl}${separator}page=${page}`;
  };

  return (
    <div className="flex flex-col items-center gap-6 mt-16 pt-8 border-t border-muted/30">
      <div className="flex items-center gap-2">
        {/* Previous Button */}
        {currentPage > 1 && (
          <Link
            href={getPageUrl(currentPage - 1)}
            className="h-10 px-4 inline-flex items-center justify-center rounded-lg border border-muted hover:bg-muted/50 transition-all font-medium text-sm"
          >
            이전
          </Link>
        )}

        {/* Page Numbers */}
        <div className="flex items-center gap-1">
          {startPage > 1 && (
            <>
              <Link href={getPageUrl(1)} className="w-10 h-10 inline-flex items-center justify-center rounded-lg hover:bg-muted/50 transition-all text-sm">1</Link>
              {startPage > 2 && <span className="text-muted-foreground px-1">...</span>}
            </>
          )}

          {pages.map((page) => (
            <Link
              key={page}
              href={getPageUrl(page)}
              className={`w-10 h-10 inline-flex items-center justify-center rounded-lg transition-all text-sm font-bold ${
                currentPage === page
                  ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                  : 'hover:bg-muted/50 text-muted-foreground hover:text-foreground'
              }`}
            >
              {page}
            </Link>
          ))}

          {endPage < totalPages && (
            <>
              {endPage < totalPages - 1 && <span className="text-muted-foreground px-1">...</span>}
              <Link href={getPageUrl(totalPages)} className="w-10 h-10 inline-flex items-center justify-center rounded-lg hover:bg-muted/50 transition-all text-sm">{totalPages}</Link>
            </>
          )}
        </div>

        {/* Next Button */}
        {currentPage < totalPages && (
          <Link
            href={getPageUrl(currentPage + 1)}
            className="h-10 px-4 inline-flex items-center justify-center rounded-lg border border-muted hover:bg-muted/50 transition-all font-medium text-sm"
          >
            다음
          </Link>
        )}
      </div>
      
      <p className="text-xs font-medium text-muted-foreground/60 tracking-widest uppercase">
        Page {currentPage} of {totalPages}
      </p>
    </div>
  );
}
