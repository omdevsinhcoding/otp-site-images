import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ResponsivePaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function ResponsivePagination({ 
  currentPage, 
  totalPages, 
  onPageChange 
}: ResponsivePaginationProps) {
  if (totalPages <= 1) return null;

  const getPages = (): (number | 'ellipsis-start' | 'ellipsis-end')[] => {
    const pages: (number | 'ellipsis-start' | 'ellipsis-end')[] = [];
    
    // Determine visible range based on screen width
    const maxVisible = typeof window !== 'undefined' && window.innerWidth < 375 ? 3 : 
                       typeof window !== 'undefined' && window.innerWidth < 640 ? 5 : 7;
    
    if (totalPages <= maxVisible) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      
      const halfVisible = Math.floor((maxVisible - 2) / 2);
      let start = Math.max(2, currentPage - halfVisible);
      let end = Math.min(totalPages - 1, currentPage + halfVisible);
      
      if (currentPage <= halfVisible + 1) {
        end = maxVisible - 1;
      } else if (currentPage >= totalPages - halfVisible) {
        start = totalPages - maxVisible + 2;
      }
      
      if (start > 2) pages.push('ellipsis-start');
      
      for (let i = start; i <= end; i++) pages.push(i);
      
      if (end < totalPages - 1) pages.push('ellipsis-end');
      
      pages.push(totalPages);
    }
    
    return pages;
  };

  const pages = getPages();

  return (
    <div className="flex items-center justify-center pt-4 pb-6 mb-[env(safe-area-inset-bottom)]">
      <div className="flex items-center gap-1 xs:gap-1.5 sm:gap-2 overflow-x-auto max-w-full px-2 scrollbar-hide">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="flex-shrink-0 p-1.5 xs:p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronLeft className="w-4 h-4 xs:w-5 xs:h-5" />
        </button>
        
        {pages.map((page, idx) => {
          if (page === 'ellipsis-start' || page === 'ellipsis-end') {
            return (
              <span
                key={page}
                className="flex-shrink-0 w-6 h-6 xs:w-7 xs:h-7 sm:w-9 sm:h-9 flex items-center justify-center text-xs xs:text-sm text-muted-foreground"
              >
                …
              </span>
            );
          }
          
          return (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`flex-shrink-0 w-7 h-7 xs:w-8 xs:h-8 sm:w-9 sm:h-9 rounded-lg text-xs xs:text-sm font-medium transition-colors ${
                currentPage === page
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-accent text-muted-foreground'
              }`}
            >
              {page}
            </button>
          );
        })}
        
        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="flex-shrink-0 p-1.5 xs:p-2 rounded-lg hover:bg-accent disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          <ChevronRight className="w-4 h-4 xs:w-5 xs:h-5" />
        </button>
      </div>
    </div>
  );
}
