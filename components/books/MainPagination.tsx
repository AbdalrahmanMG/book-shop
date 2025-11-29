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
  setPage: (newPage: number) => void;
  page: number;
}

const MainPagination = ({ booksData, setPage, page }: PaginationProps) => {
  if (!booksData || booksData.pages <= 1) return null;

  const pagesArray = Array.from({ length: booksData.pages }, (_, i) => i + 1);

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= (booksData?.pages ?? 1)) {
      setPage(newPage);
    }
  };

  return (
    <Pagination className="mt-8">
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => handlePageChange(page - 1)}
            aria-disabled={page === 1}
            className={page === 1 ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
        {pagesArray.map((pageNumber) => (
          <PaginationItem key={pageNumber}>
            <PaginationLink
              onClick={() => handlePageChange(pageNumber)}
              isActive={page === pageNumber}
            >
              {pageNumber}
            </PaginationLink>
          </PaginationItem>
        ))}
        <PaginationItem>
          <PaginationNext
            onClick={() => handlePageChange(page + 1)}
            aria-disabled={page === booksData.pages}
            className={page === booksData.pages ? "pointer-events-none opacity-50" : undefined}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default MainPagination;
