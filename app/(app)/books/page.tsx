"use client";

import { getBooks } from "@/api/books";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
  PaginationLink,
} from "@/components/ui/pagination";
import {  useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { BookCard } from "@/components/books/BookCard";
import { getSessionData } from "@/api/auth";

const BooksPage = () => {
  const [page, setPage] = useState(1);
  const [bookOwnerId, setBookOwnerId] = useState<number | null>(null);

  const router = useRouter();

  const {
    data: booksData,
    isLoading: isLoadingBooks,
    isError: isErrorBooks,
  } = useQuery({
    queryKey: ["books", page, bookOwnerId],
    queryFn: () => getBooks({ page, pageSize: 10, bookOwnerId }),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 15,
  });

  const { data: userData } = useQuery({
    queryKey: ["me"],
    queryFn: async () => getSessionData(),
    staleTime: Infinity, 
  });

  const isAuthenticated = !!userData; 

  const showOwnerBooks = () => {
    if (!bookOwnerId && isAuthenticated) {
      setBookOwnerId(userData.id);
    } else {
      setBookOwnerId(null);
    }
    setPage(1);
  };

  const handlePageChange = (newPage: number) => {
    if (newPage > 0 && newPage <= (booksData?.pages ?? 1)) {
      setPage(newPage);
    }
  };

  const renderContent = () => {
    if (isLoadingBooks) {
      return <p className="text-center p-8 text-lg text-muted-foreground">Loading books...</p>;
    }

    if (isErrorBooks) {
      return (
        <p className="text-center p-8 text-xl text-destructive">
          Failed to load books. Please try again.
        </p>
      );
    }

    if (!booksData || booksData.books.length === 0) {
      return (
        <p className="text-center p-8 text-lg text-muted-foreground">
          {bookOwnerId
            ? "You haven't added any books yet."
            : "No books found matching your criteria."}
        </p>
      );
    }

    return (
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
        {booksData.books.map((book) => (
          <BookCard
            key={book.id}
            book={book}
            userData={userData}
          />
        ))}
      </div>
    );
  };

  const renderPagination = () => {
    if (!booksData || booksData.pages <= 1) return null;

    const pagesArray = Array.from({ length: booksData.pages }, (_, i) => i + 1);

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

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-3xl font-extrabold tracking-tight">
            📚 Book Collection
          </CardTitle>
          <div className="flex gap-3">
            <Button
              onClick={showOwnerBooks}
              variant={bookOwnerId ? "secondary" : "outline"}
              disabled={!isAuthenticated}
            >
              {bookOwnerId ? "Show All Books" : "Show My Books"}
            </Button>
            <Button onClick={() => router.push("/books/add")}>+ Add New Book</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {renderContent()}
          {renderPagination()}
        </CardContent>
      </Card>
    </div>
  );
};

export default BooksPage;
