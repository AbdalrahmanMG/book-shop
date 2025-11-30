"use client";

import { useForm, type UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { addBook } from "@/api/books/actions";
import { toast } from "sonner";
import { getSessionData } from "@/api/auth/actions";
import { addBookSchema, AddBookFormData } from "@/validation/auth";
import { BookForm, BookFormData } from "@/components/books/BookForm";

type FieldErrors = {
  [K in keyof AddBookFormData]?: string[];
};

interface AddBookFailureResponse {
  success: false;
  message?: string;
  fieldErrors?: FieldErrors;
}

function isAddBookFailureResponse(
  result: unknown,
): result is AddBookFailureResponse & { success: false; fieldErrors: FieldErrors } {
  if (typeof result !== "object" || result === null) {
    return false;
  }

  const potentialError = result as { success?: boolean; fieldErrors?: unknown };
  return (
    potentialError.success === false &&
    typeof potentialError.fieldErrors === "object" &&
    potentialError.fieldErrors !== null
  );
}

export default function AddBookPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const { data: userData } = useQuery({
    queryKey: ["me"],
    queryFn: async () => getSessionData(),
  });

  const form = useForm<AddBookFormData>({
    resolver: zodResolver(addBookSchema),
    defaultValues: {
      title: "",
      description: "",
      price: "",
      thumbnail: null,
      author: "",
      category: "Technology",
    },
    mode: "onSubmit",
  });

  const mutation = useMutation({
    mutationFn: async (data: AddBookFormData) => {
      const fd = new FormData();
      fd.append("title", data.title);
      fd.append("description", data.description);
      fd.append("price", data.price);
      fd.append("author", data.author);
      fd.append("category", data.category);
      const ownerId = userData?.id ?? 0;
      if (ownerId === 0) {
        throw new Error("User session data not available.");
      }
      fd.append("ownerId", String(ownerId));
      if (data.thumbnail instanceof File) {
        fd.append("thumbnail", data.thumbnail);
      }
      return addBook(fd);
    },
    onSuccess: (result) => {
      if (result?.success) {
        queryClient.invalidateQueries({ queryKey: ["books"] });
        toast.success(`${result.book?.title} has been added.`);
        router.push("/my-books");
      } else {
        if (isAddBookFailureResponse(result)) {
          Object.keys(result.fieldErrors).forEach((key) => {
            const field = key as keyof AddBookFormData;
            form.setError(field, {
              message: result.fieldErrors[field]?.[0] || "Invalid input",
              type: "server",
            });
          });
          toast.error("Please correct the highlighted errors.");
        } else {
          toast.error(result?.message ?? "Failed to add the book");
        }
      }
    },
    onError: (error) => {
      toast.error(`Could not add book: ${error.message}.`);
    },
  });

  const onSubmit = (data: AddBookFormData) => {
    mutation.mutate(data);
  };

  return (
    <div className="max-w-xl mx-auto p-6 md:p-10 bg-card rounded-xl shadow-lg mt-8">
      <h1 className="text-3xl font-extrabold mb-8 text-center text-primary">List a New Book</h1>
      <BookForm
        form={form as UseFormReturn<BookFormData>}
        onSubmit={onSubmit as (data: BookFormData) => void}
        isSubmitting={mutation.isPending}
        submitButtonText="Add Book"
      />
    </div>
  );
}
