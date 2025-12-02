import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
} from "@/components/ui/pagination";
import { Book } from "@/types";

interface PaginationProps {
  booksData:
    | {
        books: Book[];
        total: number;
        pages: number;
      }
    | undefined;
  onPageChange: (newPage: number) => void;
  page: number;
  disabled?: boolean;
}

const MainPagination = ({ booksData, onPageChange, page, disabled = false }: PaginationProps) => {
  if (!booksData || booksData.pages <= 1) return null;

  const pagesArray = Array.from({ length: booksData.pages }, (_, i) => i + 1);

  const handlePageChange = (newPage: number) => {
    if (disabled) return;
    if (newPage > 0 && newPage <= (booksData?.pages ?? 1)) {
      onPageChange(newPage);
    }
  };

  const isPrevDisabled = page === 1 || disabled;
  const isNextDisabled = page === booksData.pages || disabled;

  return (
    <Pagination className={`mt-8 ${disabled ? "opacity-60 pointer-events-none" : ""}`}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => handlePageChange(page - 1)}
            aria-disabled={isPrevDisabled}
            className={isPrevDisabled ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
        {pagesArray.map((pageNumber) => (
          <PaginationItem key={pageNumber}>
            <PaginationLink
              onClick={() => handlePageChange(pageNumber)}
              isActive={page === pageNumber}
              className={disabled ? "pointer-events-none" : undefined}
            >
              {pageNumber}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            onClick={() => handlePageChange(page + 1)}
            aria-disabled={isNextDisabled}
            className={isNextDisabled ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default MainPagination;
