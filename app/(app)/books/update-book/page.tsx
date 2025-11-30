"use client";

import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter, useSearchParams } from "next/navigation";
import { getBookDetails, updateBook } from "@/api/books";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useEffect } from "react";
import { Book } from "@/types";
import { updateBookSchema, UpdateBookFormData } from "@/validation/auth";
import { BookForm } from "@/components/books/BookForm";

interface ServerActionError {
  error: string;
}

function isServerError(result: Book | ServerActionError): result is ServerActionError {
  return (result as ServerActionError).error !== undefined;
}

export default function UpdateBookPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const searchParams = useSearchParams();
  const bookId = Number(searchParams.get("id"));

  const {
    data: bookData,
    isLoading: isBookLoading,
    isError: isBookError,
  } = useQuery({
    queryKey: ["book", bookId],
    queryFn: async () => getBookDetails(bookId),
    enabled: !!bookId,
  });

  const form = useForm<UpdateBookFormData>({
    resolver: zodResolver(updateBookSchema),
    defaultValues: {
      id: String(bookId),
      title: "",
      description: "",
      price: "",
      author: "",
      category: "Technology",
      thumbnail: null,
    },
    mode: "onSubmit",
  });

  useEffect(() => {
    if (bookData) {
      form.reset({
        id: String(bookId),
        title: bookData.title,
        description: bookData.description,
        price: String(bookData.price),
        author: bookData.author,
        category: bookData.category,
        thumbnail: bookData.thumbnail || null,
      });
    }
  }, [bookData, form, bookId]);

  const mutation = useMutation({
    mutationFn: async (data: UpdateBookFormData) => {
      const fd = new FormData();
      fd.append("title", data.title);
      fd.append("description", data.description);
      fd.append("price", data.price);
      fd.append("author", data.author);
      fd.append("category", data.category);
      fd.append("id", String(bookId));
      if (data.thumbnail) {
        if (data.thumbnail instanceof File) {
          fd.append("thumbnail", data.thumbnail);
        } else if (typeof data.thumbnail === "string") {
          fd.append("thumbnail", data.thumbnail);
        }
      } else {
        fd.append("thumbnail", "");
        console.log("Thumbnail is null/undefined, sending empty string or skipping.");
      }

      return updateBook(fd);
    },
    onSuccess: (result) => {
      if (isServerError(result)) {
        toast.error(result.error);
      } else {
        queryClient.invalidateQueries({ queryKey: ["books"] });
        queryClient.invalidateQueries({ queryKey: ["book", bookId] });
        toast.success(`${result?.title} has been updated.`);
        router.back();
      }
    },
    onError: (error) => {
      toast.error(`Could not update book: ${error.message}.`);
    },
  });

  const onSubmit = (data: UpdateBookFormData) => {
    mutation.mutate(data);
  };

  if (isBookLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isBookError || !bookData) {
    return (
      <div className="max-w-xl mx-auto p-6 md:p-10 bg-card rounded-xl shadow-lg mt-8 text-center">
        <h1 className="text-3xl font-extrabold mb-8 text-destructive">Book Not Found</h1>
        <p className="text-muted-foreground">Could not load details for book ID: {bookId}.</p>
        <Button onClick={() => router.push("/books")} className="mt-6">
          Go to Books List
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto p-6 md:p-10 bg-card rounded-xl shadow-lg mt-8">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-primary">Update Book Listing</h1>
      <BookForm
        form={form as UseFormReturn<UpdateBookFormData>}
        onSubmit={onSubmit as (data: UpdateBookFormData) => void}
        isSubmitting={mutation.isPending}
        submitButtonText="Save Changes"
        initialThumbnailUrl={bookData.thumbnail}
      />
    </div>
  );
}
