"use client";

import Image from "next/image";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useParams, useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Loader2, Frown, ArrowLeft } from "lucide-react";
import { getBookDetails } from "@/api/books/getBookDetails";
import { deleteBook } from "@/api/books/deleteBook";
import { getSessionData } from "@/api/auth";
import { Button } from "@/components/ui/button";
import { DeleteModal } from "@/components/books/DeleteModal";
import { BookActions } from "@/components/books/BookActions";
import { toast } from "sonner";
import { useState } from "react";

export default function BookDetailsPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const id = params.id as string;

  const bookId = Number(id);

  const { data: userData } = useQuery({
    queryKey: ["me"],
    queryFn: getSessionData,
    staleTime: Infinity,
  });

  const {
    data: book,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["book", bookId],
    queryFn: () => getBookDetails(bookId),
    staleTime: 1000 * 60 * 5,
    enabled: !isNaN(bookId),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => deleteBook(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["books"] });
      toast.success("Book deleted successfully!");
      router.push("/books");
    },
    onError: (error: Error | unknown) => {
      const err = error as { message?: string };
      toast.error(`Error deleting book: ${err.message || "Unknown error"}`);
    },
  });

  const handleEdit = () => router.push(`/books/update-book?id=${bookId}`);
  const handleDelete = () => deleteMutation.mutate(bookId);
  const isOwner = userData && book && userData.id === book.ownerId;

  if (isLoading)
    return (
      <div className="p-10 flex flex-col items-center justify-center space-y-4">
        <Loader2 className="w-10 h-10 animate-spin text-primary" />
        <p className="text-xl text-muted-foreground">Loading book details...</p>
      </div>
    );

  if (isError)
    return (
      <div className="p-10 flex flex-col items-center justify-center space-y-4">
        <Frown className="w-10 h-10 text-destructive" />
        <p className="text-xl text-destructive">
          Error loading book. Please check your connection.
        </p>
      </div>
    );

  if (!book)
    return (
      <div className="p-10 flex flex-col items-center justify-center space-y-4">
        <Frown className="w-10 h-10 text-muted-foreground" />
        <p className="text-xl text-muted-foreground">Book Not Found</p>
      </div>
    );

  return (
    <div className="container mx-auto px-4 md:px-6 py-8 md:py-12 max-w-6xl">
      <Button
        variant="outline"
        className="mb-6 flex items-center gap-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="w-4 h-4" />
        Back
      </Button>
      <Card className="shadow-xl">
        <CardContent className="p-6 md:p-10">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-12">
            <div className="md:col-span-4 flex justify-center">
              <div className="relative w-full max-w-xs md:max-w-none aspect-2/3 shadow-2xl rounded-lg overflow-hidden border">
                <Image
                  src={book.thumbnail}
                  alt={book.title}
                  fill
                  sizes="(max-width: 768px) 100vw, 30vw"
                  className="object-cover"
                  priority
                />
              </div>
            </div>

            <div className="md:col-span-8 flex flex-col space-y-6">
              <div className="space-y-1">
                <h1 className="text-4xl lg:text-5xl font-extrabold tracking-tight text-primary">
                  {book.title}
                </h1>
                <p className="text-2xl font-semibold text-muted-foreground">By {book.author}</p>
              </div>

              <Separator />

              <div className="flex flex-col gap-4">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Price</p>
                  <p className="text-lg font-bold">${(Number(book.price) as number).toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Category</p>
                  <p className="text-lg font-bold">{book.category}</p>
                </div>
              </div>

              <Separator />

              <div className="space-y-3">
                <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Description</h2>
                <p className="text-lg text-gray-700 dark:text-gray-300 leading-relaxed indent-6">
                  {book.description}
                </p>
              </div>

              {/* Owner Actions */}
              {isOwner && (
                <BookActions
                  onEdit={handleEdit}
                  onDelete={() => setIsModalOpen(true)}
                  isDeleting={deleteMutation.isPending}
                  isDetailsPage={true}
                />
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Modal */}
      <DeleteModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConfirm={handleDelete}
        title={`Do you want to delete "${book.title}"?`}
        description="This action cannot be undone and will permanently remove the book from the database."
      />
    </div>
  );
}
