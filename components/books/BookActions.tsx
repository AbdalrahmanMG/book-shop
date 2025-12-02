"use client";

import { Button } from "@/components/ui/button";
import { Pencil, Trash2, Loader2 } from "lucide-react";

interface BookActionsProps {
  onEdit: () => void;
  onDelete: () => void;
  isDeleting?: boolean;
  isDetailsPage?: boolean;
  isProcessing?: boolean;
}

export const BookActions = ({
  onEdit,
  onDelete,
  isDeleting = false,
  isDetailsPage = false,
  isProcessing = false,
}: BookActionsProps) => {
  return (
    <div className="flex gap-2">
      <Button
        variant="secondary"
        size={"lg"}
        onClick={onEdit}
        disabled={isProcessing}
        title="Edit Book"
      >
        <Pencil className="w-4 h-4" /> {isDetailsPage && "Edit"}
      </Button>
      <Button variant="destructive" onClick={onDelete} title="Delete Book" disabled={isProcessing}>
        {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
        Delete
      </Button>
    </div>
  );
};
