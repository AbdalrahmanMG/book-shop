"use client";

import { KeyboardEvent, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

import { getSessionData } from "@/api/auth/actions";
import { getBooks } from "@/api/books/actions";
import { deleteBook } from "@/api/books/actions";
import BookCard from "@/components/books/BookCard";
import MainPagination from "@/components/books/MainPagination";
import SearchSortControls from "@/components/books/SearchSortControlers";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Categories } from "@/types";

const MyBookPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const queryClient = useQueryClient();

  const page = Number(searchParams.get("page") || 1);
  const search = searchParams.get("search") || "";
  const sort = (searchParams.get("sort") as "asc" | "desc" | "none") || "none";
  const category = (searchParams.get("category") as Categories) || "all";
  const [searchInput, setSearchInput] = useState(search);
  const [isAnyActionPending, setIsAnyActionPending] = useState(false);

  const updateURL = (params: Record<string, string | null | number>) => {
    const newParams = new URLSearchParams(searchParams.toString());

    Object.entries(params).forEach(([key, value]) => {
      if (value === null || value === "" || value === "none" || value === "all") {
        newParams.delete(key);
      } else {
        newParams.set(key, String(value));
      }
    });

    router.push(`/my-books?${newParams.toString()}`);
  };

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
    queryKey: ["books", page, search, sort, bookOwnerId, category],
    queryFn: () => getBooks({ page, pageSize: 12, search: search, sort, bookOwnerId, category }),
    placeholderData: (prev) => prev,
    staleTime: 1000 * 15,
    enabled: !!bookOwnerId,
  });

  const handleSearchChange = () => {
    if (isAnyActionPending) return;
    updateURL({ search: searchInput.trim(), page: 1 });
  };

  const handleEnterPressForSearch = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !isAnyActionPending) {
      handleSearchChange();
    }
  };

  const handleSortChange = (value: "asc" | "desc" | "none") => {
    if (isAnyActionPending) return;

    updateURL({ sort: value, page: 1 });
  };

  const handlePageChange = (value: number) => {
    if (isAnyActionPending) return;

    updateURL({ page: value });
  };

  const handleReset = () => {
    if (isAnyActionPending) return;

    setSearchInput("");
    updateURL({ search: null, sort: null, page: null, category: "all" });
  };

  const handleFilterByCategory = (value: Categories | "all") => {
    if (isAnyActionPending) return;

    handleReset();
    updateURL({ category: value, page: 1 });
  };

  const deleteBookMutation = useMutation({
    mutationFn: async (id: number) => {
      setIsAnyActionPending(true);
      return deleteBook(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book deleted successfully!");
      setIsAnyActionPending(false);
    },
    onError: (error) => {
      toast.error(`Error deleting book: ${error.message || "Unknown error"}`);
      setIsAnyActionPending(false);
    },
  });

  const handleEdit = (bookId: number) => {
    if (isAnyActionPending) return;
    setIsAnyActionPending(true);

    toast.loading("📝 Opening editor...", { id: "edit-toast" });
    setTimeout(() => {
      toast.dismiss("edit-toast");
    }, 2000);
    router.push(`/books/update-book?id=${bookId}`);
  };

  const handleView = (bookId: number) => {
    if (isAnyActionPending) return;
    setIsAnyActionPending(true);

    toast.loading("📖 Loading book details...", { id: "view-toast" });

    setTimeout(() => {
      toast.dismiss("view-toast");
    }, 2000);
    router.push(`/books/${bookId}`);
  };

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
            onEdit={() => handleEdit(book.id)}
            onView={() => handleView(book.id)}
            isDeleting={deleteBookMutation.isPending}
            isAnyActionPending={isAnyActionPending}
            onFilterByCategory={handleFilterByCategory}
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
            <Button
              onClick={() => {
                if (!isAnyActionPending) router.push("/books/new-book");
              }}
              disabled={isAnyActionPending}
            >
              + Add New Book
            </Button>{" "}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <SearchSortControls
            search={searchInput}
            setSearch={setSearchInput}
            sort={sort}
            setSort={handleSortChange}
            onSearchKeyPress={handleEnterPressForSearch}
            onSearchSubmit={handleSearchChange}
            onReset={handleReset}
            category={category || "all"}
            onFilterCategory={handleFilterByCategory}
            disabled={isAnyActionPending}
          />
          {renderContent()}
          <MainPagination
            page={page}
            onPageChange={handlePageChange}
            booksData={booksData}
            disabled={isAnyActionPending}
          />{" "}
        </CardContent>
      </Card>
    </div>
  );
};

export default MyBookPage;
