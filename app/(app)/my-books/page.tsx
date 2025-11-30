"use client";

import { getSessionData } from "@/api/auth";
import { getBooks } from "@/api/books";
import { deleteBook } from "@/api/books/deleteBook";
import { BookCard } from "@/components/books/BookCard";
import MainPagination from "@/components/books/MainPagination";
import SearchSortControls from "@/components/books/SearchSortControlers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

const MyBookPage = () => {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  // const [bookOwnerId, setBookOwnerId] = useState<number | null>(null);
  const [sort, setSort] = useState<"asc" | "desc" | "none">("none");

  const debouncedSearch = useDebounce(search, 400);
  const queryClient = useQueryClient();
  const router = useRouter();

  const { data: userData, isLoading } = useQuery({
    queryKey: ["me"],
    queryFn: async () => getSessionData(),
    staleTime: Infinity,
  });

  const bookOwnerId = userData?.id ?? null;

  const {
    data: booksData,
    isLoading: isLoadingBooks,
    isError: isErrorBooks,
  } = useQuery({
    queryKey: ["books", page, debouncedSearch, sort, bookOwnerId],
    queryFn: () => getBooks({ page, pageSize: 10, search: debouncedSearch, sort, bookOwnerId }),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 15,
    enabled: !!bookOwnerId,
  });

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const handleSortChange = (value: "asc" | "desc" | "none") => {
    setSort(value);
    setPage(1);
  };

  const deleteBookMutation = useMutation({
    mutationFn: (id: number) => deleteBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book deleted successfully!");
    },
    onError: (error) => {
      toast.error(`Error deleting book: ${error.message || "Unknown error"}`);
    },
  });

  const renderContent = () => {
    if (isLoadingBooks || isLoading) {
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
            onDelete={() => deleteBookMutation.mutate(book.id)}
            isDeleting={deleteBookMutation.isPending}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="p-4 md:p-8 max-w-7xl mx-auto space-y-8">
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-3xl font-extrabold tracking-tight">
            📚 My-Book Collection
          </CardTitle>
          <div className="flex gap-3">
            <Button onClick={() => router.push("/books/new-book")}>+ Add New Book</Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <SearchSortControls
            setSearch={handleSearchChange}
            sort={sort}
            search={search}
            setSort={handleSortChange}
          />
          {renderContent()}
          <MainPagination page={page} setPage={setPage} booksData={booksData} />
        </CardContent>
      </Card>
    </div>
  );
};

export default MyBookPage;
