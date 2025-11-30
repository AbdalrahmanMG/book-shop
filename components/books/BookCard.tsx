"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, SafeUserData } from "@/types";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Pencil, Trash2, Eye, Loader2 } from "lucide-react";
import { DeleteModal } from "./DeleteModal";

interface BookCardProps {
  book: Book;
  userData?: SafeUserData | null;
  onDelete?: () => void;
  isDeleting?: boolean;
}

export const BookCard = ({ book, userData, onDelete, isDeleting = false }: BookCardProps) => {
  const router = useRouter();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isOwner = userData && userData.id === book.ownerId;

  const handleEdit = () => {
    router.push(`/books/update-book?id=${book.id}`);
  };

  const handleView = () => {
    router.push(`/books/${book.id}`);
  };

  return (
    <>
      <Card className="w-full flex flex-col transition-all duration-300 hover:shadow-lg rounded-xl overflow-hidden shadow-md border-2 border-transparent hover:border-primary/50">
        <div className="w-3/5 mx-auto mt-4 relative aspect-2/3 cursor-pointer" onClick={handleView}>
          <Image
            src={book.thumbnail}
            alt={book.title}
            fill
            sizes="(max-width: 640px) 50vw, 25vw"
            className="rounded-lg shadow-xl object-cover transition-transform duration-500 ease-in-out group-hover:scale-105"
            priority
          />
        </div>

        <CardContent className="flex flex-col grow gap-1 p-4 pt-6 text-center">
          <CardHeader className="p-0 mb-2 space-y-0">
            <CardTitle
              className="text-lg font-bold line-clamp-2 leading-snug cursor-pointer hover:text-primary transition-colors"
              onClick={handleView}
            >
              {book.title}
            </CardTitle>
            <p className="text-sm text-muted-foreground font-medium">{book.author}</p>
          </CardHeader>

          <p className="text-xs text-secondary-foreground/70">Category: {book.category}</p>
          <p className="text-md font-semibold text-primary/80 mt-1">${book.price}</p>
        </CardContent>

        <CardFooter className="p-4 flex justify-center gap-2 border-t mt-auto">
          <Button variant="outline" size="icon" onClick={handleView} title="View Details">
            <Eye className="w-4 h-4" />
          </Button>

          {isOwner && (
            <>
              <Button variant="secondary" size="icon" onClick={handleEdit} title="Edit Book">
                <Pencil className="w-4 h-4" />
              </Button>
              <Button
                variant="destructive"
                size="icon"
                onClick={() => setIsModalOpen(true)}
                title="Delete Book"
                disabled={isDeleting}
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
              </Button>
            </>
          )}
        </CardFooter>
      </Card>

      <DeleteModal
        isOpen={isModalOpen}
        onOpenChange={setIsModalOpen}
        onConfirm={() => {
          onDelete?.();
          setIsModalOpen(false);
        }}
        title={`Do you want to delete "${book.title}"?`}
        description="This action cannot be undone and will permanently remove the book from the database."
      />
    </>
  );
};
