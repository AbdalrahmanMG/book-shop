"use client";

import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Book, Categories, SafeUserData } from "@/types";
import Image from "next/image";
import { memo, useState } from "react";
import { Eye } from "lucide-react";
import { DeleteModal } from "./DeleteModal";
import { BookActions } from "./BookActions";

interface BookCardProps {
  book: Book;
  userData?: SafeUserData | null;
  onDelete?: () => void;
  onEdit?: () => void;
  onView?: () => void;
  isDeleting?: boolean;
  isAnyActionPending?: boolean;
  onFilterByCategory: (value: Categories) => void;
}

const BookCard = ({
  book,
  userData,
  onDelete,
  onEdit,
  onView,
  isDeleting = false,
  isAnyActionPending = false,
  onFilterByCategory,
}: BookCardProps) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  const isOwner = userData && userData.id === book.owner_id;
  const isDisabled = isAnyActionPending || isDeleting;

  const handleEdit = () => {
    if (isDisabled) return;
    onEdit?.();
  };

  const handleView = () => {
    if (isDisabled) return;
    onView?.();
  };

  const handleDelete = () => {
    if (isDisabled) return;
    onDelete?.();
    setIsModalOpen(false);
  };

  return (
    <>
      <Card
        className={`w-full flex flex-col transition-all duration-300 hover:shadow-lg rounded-xl overflow-hidden shadow-md border-2 border-transparent hover:border-primary/50 ${isDisabled ? "opacity-60 pointer-events-none" : ""}`}
      >
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

          <p className="text-xs text-secondary-foreground/70">
            Category:{" "}
            <span
              className="cursor-pointer hover:text-primary/80"
              onClick={(e) => {
                e.stopPropagation();
                if (!isDisabled) {
                  onFilterByCategory(book.category);
                }
              }}
            >
              {book.category}
            </span>
          </p>
          <p className="text-md font-semibold text-primary/80 mt-1">${book.price}</p>
        </CardContent>

        <CardFooter className="p-4 flex justify-center gap-2 border-t mt-auto">
          <Button
            variant="outline"
            size="icon"
            onClick={handleView}
            title="View Details"
            disabled={isDisabled}
          >
            <Eye className="w-4 h-4" />
          </Button>

          {isOwner && (
            <BookActions
              onEdit={handleEdit}
              onDelete={() => !isDisabled && setIsModalOpen(true)}
              isDeleting={isDeleting}
              isProcessing={isAnyActionPending}
            />
          )}
        </CardFooter>
      </Card>

      <DeleteModal
        isOpen={isModalOpen && !isDisabled}
        onOpenChange={(open) => !isDisabled && setIsModalOpen(open)}
        onConfirm={handleDelete}
        title={`Do you want to delete "${book.title}"?`}
        description="This action cannot be undone and will permanently remove the book from the database."
      />
    </>
  );
};

export default memo(BookCard);
